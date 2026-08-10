import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { sendBirthdayReminderEmail, sendReviewRequestEmail } from "@/lib/email/send";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Long enough for the poster to be hung, short enough to still feel fresh. */
const REVIEW_DELAY_DAYS = 3;
/** Stop chasing an old order that was never reviewed. */
const REVIEW_WINDOW_DAYS = 30;
/** Enough notice to order, print and ship before the day. */
const BIRTHDAY_LEAD_DAYS = 21;

/**
 * Daily follow-ups: ask delivered customers for a review and a wall photo, and
 * remind past customers a few weeks before the child's next birthday.
 *
 * Both are one-shot per order, tracked by their own timestamp columns, so a
 * re-run cannot spam anyone.
 *
 * Protected by CRON_SECRET.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 503 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const settings = await getSettings();
  const now = Date.now();

  // ---- Review + wall photo -------------------------------------------------
  const readyForReview = await prisma.order.findMany({
    where: {
      status: "DELIVERED",
      reviewRequestAt: null,
      email: { not: null },
      updatedAt: {
        lt: new Date(now - REVIEW_DELAY_DAYS * 86_400_000),
        gt: new Date(now - REVIEW_WINDOW_DAYS * 86_400_000),
      },
    },
    select: { id: true, email: true, customerName: true, childName: true },
    take: 100,
  });

  let reviewsSent = 0;
  for (const order of readyForReview) {
    if (!order.email) continue;
    try {
      await sendReviewRequestEmail({
        email: order.email,
        customerName: order.customerName ?? "",
        childName: order.childName,
        reviewUrl: `${site}/otzivi`,
        contactEmail: settings.contactEmail,
      });
      await prisma.order.update({
        where: { id: order.id },
        data: { reviewRequestAt: new Date() },
      });
      reviewsSent++;
    } catch (err) {
      console.error("review request failed for", order.id, err);
    }
  }

  // ---- Birthday reminders --------------------------------------------------
  // Compared on month/day so the reminder repeats every year. A year-wrapping
  // window (e.g. mid-December looking into January) has to work too.
  const target = new Date(now + BIRTHDAY_LEAD_DAYS * 86_400_000);
  const targetMonth = target.getMonth() + 1;
  const targetDay = target.getDate();

  const withBirthday = await prisma.order.findMany({
    where: {
      childBirthday: { not: null },
      email: { not: null },
      marketingOptIn: true,
      status: { in: ["DELIVERED", "SHIPPED"] },
    },
    select: {
      id: true,
      email: true,
      childName: true,
      childBirthday: true,
      birthdayReminderAt: true,
    },
    take: 500,
  });

  let birthdaysSent = 0;
  for (const order of withBirthday) {
    const bd = order.childBirthday;
    if (!bd || !order.email) continue;
    if (bd.getMonth() + 1 !== targetMonth || bd.getDate() !== targetDay) continue;
    // Once per calendar year.
    if (
      order.birthdayReminderAt &&
      order.birthdayReminderAt.getFullYear() === target.getFullYear()
    ) {
      continue;
    }

    try {
      await sendBirthdayReminderEmail({
        email: order.email,
        childName: order.childName,
        turningAge: target.getFullYear() - bd.getFullYear(),
        createUrl: `${site}/create`,
      });
      await prisma.order.update({
        where: { id: order.id },
        data: { birthdayReminderAt: new Date() },
      });
      birthdaysSent++;
    } catch (err) {
      console.error("birthday reminder failed for", order.id, err);
    }
  }

  return NextResponse.json({
    reviewCandidates: readyForReview.length,
    reviewsSent,
    birthdaysSent,
  });
}
