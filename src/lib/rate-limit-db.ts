import "server-only";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

/**
 * Rate limiting that survives serverless.
 *
 * The in-memory limiter only guards one Node process; on Vercel each request
 * can land on a fresh instance with an empty map, so someone refreshing the
 * page could keep triggering paid AI generations. This counter lives in
 * Postgres, so every instance sees the same tally.
 *
 * IPs are hashed before storage — a raw IP is personal data under GDPR and we
 * have no reason to keep one.
 */
export function ipHash(ip: string): string {
  const salt = process.env.RATE_LIMIT_SALT ?? "biserite";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 24);
}

export interface LimitResult {
  ok: boolean;
  used: number;
  limit: number;
}

/**
 * Increments the counter for `key` and reports whether it is still under the
 * limit. Fails OPEN: if the database is unreachable, a paying customer must
 * still be able to order — the global daily cap remains as the spend backstop.
 */
export async function consume(
  key: string,
  limit: number,
  windowMs: number
): Promise<LimitResult> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + windowMs);

  try {
    const existing = await prisma.rateLimit.findUnique({ where: { key } });

    // Expired window: reset rather than accumulate forever.
    if (!existing || existing.expiresAt <= now) {
      await prisma.rateLimit.upsert({
        where: { key },
        create: { key, count: 1, expiresAt },
        update: { count: 1, expiresAt },
      });
      return { ok: true, used: 1, limit };
    }

    if (existing.count >= limit) {
      return { ok: false, used: existing.count, limit };
    }

    const updated = await prisma.rateLimit.update({
      where: { key },
      data: { count: { increment: 1 } },
    });
    return { ok: updated.count <= limit, used: updated.count, limit };
  } catch (err) {
    console.error("db rate limit failed, allowing request:", err);
    return { ok: true, used: 0, limit };
  }
}

/** Reads a counter without incrementing it. */
export async function peek(key: string): Promise<number> {
  try {
    const row = await prisma.rateLimit.findUnique({ where: { key } });
    if (!row || row.expiresAt <= new Date()) return 0;
    return row.count;
  } catch {
    return 0;
  }
}

/** Removes expired counters. Called from the daily cleanup cron. */
export async function pruneRateLimits(): Promise<number> {
  const res = await prisma.rateLimit.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return res.count;
}

/** UTC day stamp, so a window key rolls over predictably. */
export function dayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}
