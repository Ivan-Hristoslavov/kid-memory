import "server-only";
import { createClient } from "@supabase/supabase-js";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

/**
 * Private object storage behind signed URLs.
 * Drivers: Supabase Storage (private bucket) for production,
 * local filesystem for development. Never expose public URLs.
 */
export interface StorageDriver {
  put(key: string, data: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<Buffer>;
  /** Time-limited signed URL for browser access. */
  signedUrl(key: string, expiresInSeconds: number): Promise<string>;
  /**
   * Signs many keys at once. The admin table shows a thumbnail per order, and
   * signing 200 keys one at a time would be 200 round trips to Supabase.
   * Returns a map keyed by storage key; keys that fail are simply absent.
   */
  signedUrls(
    keys: string[],
    expiresInSeconds: number
  ): Promise<Record<string, string>>;
  delete(key: string): Promise<void>;
}

class SupabaseStorage implements StorageDriver {
  private client;
  private bucket: string;

  constructor() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Supabase storage requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
    this.client = createClient(url, key, { auth: { persistSession: false } });
    this.bucket = process.env.SUPABASE_BUCKET || "posters";
  }

  async put(key: string, data: Buffer, contentType: string) {
    const { error } = await this.client.storage
      .from(this.bucket)
      .upload(key, data, { contentType, upsert: true });
    if (error) throw new Error(`Storage upload failed: ${error.message}`);
  }

  async get(key: string) {
    const { data, error } = await this.client.storage.from(this.bucket).download(key);
    if (error || !data) throw new Error(`Storage download failed: ${error?.message}`);
    return Buffer.from(await data.arrayBuffer());
  }

  async signedUrl(key: string, expiresInSeconds: number) {
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .createSignedUrl(key, expiresInSeconds);
    if (error || !data) throw new Error(`Signed URL failed: ${error?.message}`);
    return data.signedUrl;
  }

  async signedUrls(keys: string[], expiresInSeconds: number) {
    if (keys.length === 0) return {};
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .createSignedUrls(keys, expiresInSeconds);
    if (error || !data) {
      // A missing thumbnail must never take the admin page down.
      console.error("Batch signed URLs failed:", error?.message);
      return {};
    }
    const out: Record<string, string> = {};
    for (const item of data) {
      if (item.signedUrl && item.path) out[item.path] = item.signedUrl;
    }
    return out;
  }

  async delete(key: string) {
    await this.client.storage.from(this.bucket).remove([key]);
  }
}

/**
 * Dev-only driver: files under .storage/, served via /api/files with an
 * HMAC-signed, expiring token so behavior matches production semantics.
 */
class LocalStorage implements StorageDriver {
  private root = path.join(process.cwd(), ".storage");

  private filePath(key: string) {
    const safe = path.normalize(key).replace(/^(\.\.[/\\])+/, "");
    return path.join(this.root, safe);
  }

  async put(key: string, data: Buffer) {
    const fp = this.filePath(key);
    await fs.mkdir(path.dirname(fp), { recursive: true });
    await fs.writeFile(fp, data);
  }

  async get(key: string) {
    return fs.readFile(this.filePath(key));
  }

  async signedUrl(key: string, expiresInSeconds: number) {
    const expires = Date.now() + expiresInSeconds * 1000;
    const sig = signLocalToken(key, expires);
    const base = process.env.NEXT_PUBLIC_SITE_URL || "";
    return `${base}/api/files?key=${encodeURIComponent(key)}&expires=${expires}&sig=${sig}`;
  }

  async signedUrls(keys: string[], expiresInSeconds: number) {
    // Local signing is just an HMAC, so a loop costs nothing.
    const out: Record<string, string> = {};
    for (const key of keys) out[key] = await this.signedUrl(key, expiresInSeconds);
    return out;
  }

  async delete(key: string) {
    await fs.rm(this.filePath(key), { force: true });
  }
}

function localSecret(): string {
  return process.env.ADMIN_PASSWORD || "dev-secret";
}

export function signLocalToken(key: string, expires: number): string {
  return crypto
    .createHmac("sha256", localSecret())
    .update(`${key}:${expires}`)
    .digest("hex");
}

export function verifyLocalToken(key: string, expires: number, sig: string): boolean {
  if (Date.now() > expires) return false;
  const expected = signLocalToken(key, expires);
  return (
    sig.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  );
}

let driver: StorageDriver | null = null;

export function storage(): StorageDriver {
  if (!driver) {
    driver =
      process.env.STORAGE_DRIVER === "supabase" ? new SupabaseStorage() : new LocalStorage();
  }
  return driver;
}
