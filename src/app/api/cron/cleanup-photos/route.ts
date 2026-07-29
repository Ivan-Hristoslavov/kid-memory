import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";
import { PHOTO_RETENTION_DAYS } from "@/lib/legal";
import { pruneRateLimits } from "@/lib/rate-limit-db";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Deletes uploaded child photos older than the retention window (GDPR data
 * minimisation). The generated poster is kept — only the source photo goes.
 *
 * Protected by CRON_SECRET: call as
 *   GET /api/cron/cleanup-photos  with  Authorization: Bearer <CRON_SECRET>
 * Vercel Cron sends this header automatically when the secret is configured.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 503 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - PHOTO_RETENTION_DAYS);

  const stale = await prisma.order.findMany({
    where: { photoKey: { not: null }, createdAt: { lt: cutoff } },
    select: { id: true, photoKey: true },
    take: 500,
  });

  let deleted = 0;
  const failed: string[] = [];

  for (const o of stale) {
    try {
      if (o.photoKey) await storage().delete(o.photoKey);
      await prisma.order.update({ where: { id: o.id }, data: { photoKey: null } });
      deleted++;
    } catch (err) {
      failed.push(o.id);
      console.error("photo cleanup failed for", o.id, err);
    }
  }

  // Expired rate-limit rows would otherwise grow without bound.
  const prunedCounters = await pruneRateLimits().catch(() => 0);

  return NextResponse.json({
    retentionDays: PHOTO_RETENTION_DAYS,
    scanned: stale.length,
    deleted,
    failed: failed.length,
    prunedCounters,
  });
}
