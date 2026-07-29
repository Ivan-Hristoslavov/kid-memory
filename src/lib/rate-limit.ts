/**
 * Simple in-memory sliding-window rate limiter.
 * Good for a single Node instance; swap for Upstash Redis in serverless/multi-node.
 */

type Window = { timestamps: number[] };

const buckets = new Map<string, Window>();

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): { ok: boolean; remaining: number } {
  const now = Date.now();

  if (now - lastCleanup > CLEANUP_INTERVAL_MS) {
    for (const [k, w] of buckets) {
      w.timestamps = w.timestamps.filter((t) => now - t < windowMs);
      if (w.timestamps.length === 0) buckets.delete(k);
    }
    lastCleanup = now;
  }

  const bucket = buckets.get(key) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);

  if (bucket.timestamps.length >= limit) {
    buckets.set(key, bucket);
    return { ok: false, remaining: 0 };
  }

  bucket.timestamps.push(now);
  buckets.set(key, bucket);
  return { ok: true, remaining: limit - bucket.timestamps.length };
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || "unknown";
}
