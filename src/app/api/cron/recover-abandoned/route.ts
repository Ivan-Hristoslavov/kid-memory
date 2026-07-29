import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendRecoveryEmail } from "@/lib/email/send";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Give the customer time to finish checking out before nudging them. */
const MIN_AGE_MINUTES = 60;
/** Past this the poster is stale and a reminder just reads as spam. */
const MAX_AGE_HOURS = 72;

/**
 * Emails customers who generated a poster but never completed checkout.
 *
 * They uploaded a photo of their child, waited for the illustration and saw the
 * result — the emotional work is already done, so putting it back in front of
 * them is the cheapest conversion available. Sends once per order, tracked via
 * `recoveryEmailAt`.
 *
 * Protected by CRON_SECRET: call as
 *   GET /api/cron/recover-abandoned  with  Authorization: Bearer <CRON_SECRET>
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 503 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  const notBefore = new Date(now - MIN_AGE_MINUTES * 60 * 1000);
  const notAfter = new Date(now - MAX_AGE_HOURS * 60 * 60 * 1000);

  const abandoned = await prisma.order.findMany({
    where: {
      status: "PREVIEW_READY",
      recoveryEmailAt: null,
      leadEmail: { not: null },
      createdAt: { lt: notBefore, gt: notAfter },
    },
    select: { id: true, leadEmail: true, childName: true },
    take: 100,
  });

  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  let sent = 0;
  const failed: string[] = [];

  for (const order of abandoned) {
    if (!order.leadEmail) continue;
    try {
      await sendRecoveryEmail({
        email: order.leadEmail,
        childName: order.childName,
        resumeUrl: `${site}/order?orderId=${order.id}`,
      });
      // Stamped only after a successful send, so a failure retries next run.
      await prisma.order.update({
        where: { id: order.id },
        data: { recoveryEmailAt: new Date() },
      });
      sent++;
    } catch (err) {
      failed.push(order.id);
      console.error("recovery email failed for", order.id, err);
    }
  }

  return NextResponse.json({ scanned: abandoned.length, sent, failed: failed.length });
}
