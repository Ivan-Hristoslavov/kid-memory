import { NextResponse } from "next/server";
import { storage, verifyLocalToken } from "@/lib/storage";

export const runtime = "nodejs";

/**
 * Serves files for the local (dev) storage driver behind an HMAC-signed,
 * expiring token — mirrors the signed-URL semantics of Supabase in prod.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get("key") ?? "";
  const expires = Number(url.searchParams.get("expires") ?? 0);
  const sig = url.searchParams.get("sig") ?? "";

  if (!key || !expires || !sig || !verifyLocalToken(key, expires, sig)) {
    return NextResponse.json({ error: "Invalid or expired link" }, { status: 403 });
  }

  try {
    const data = await storage().get(key);
    const contentType = key.endsWith(".png")
      ? "image/png"
      : key.endsWith(".pdf")
        ? "application/pdf"
        : "image/jpeg";
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
