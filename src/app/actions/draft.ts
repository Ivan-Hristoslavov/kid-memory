"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { sendDraftLinkEmail } from "@/lib/email/send";

/**
 * Emails the visitor a link back into their generated poster.
 *
 * Closing the tab used to lose everything, including a generation we had
 * already paid for. The order row already exists by this point, so the link is
 * just the checkout URL for that order.
 */
const schema = z.object({
  orderId: z.string().cuid(),
  email: z.string().trim().email("Въведи валиден имейл").max(120),
});

export interface DraftState {
  ok?: boolean;
  error?: string;
}

export async function emailDraftLink(
  _prev: DraftState,
  formData: FormData
): Promise<DraftState> {
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(`draft:${ip}`, { limit: 10, windowMs: 60 * 60 * 1000 }).ok) {
    return { error: "Твърде много опити. Опитай пак по-късно." };
  }

  const parsed = schema.safeParse({
    orderId: formData.get("orderId"),
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Провери имейла." };
  }

  const order = await prisma.order
    .findUnique({
      where: { id: parsed.data.orderId },
      select: { id: true, childName: true, status: true },
    })
    .catch(() => null);
  if (!order) return { error: "Поръчката не е намерена." };

  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  try {
    await sendDraftLinkEmail({
      email: parsed.data.email,
      childName: order.childName,
      resumeUrl: `${site}/order?orderId=${order.id}`,
    });
  } catch (err) {
    console.error("draft link email failed:", err);
    return { error: "Имейлът не се изпрати. Опитай пак." };
  }

  // Remember it so the abandoned-poster cron can reach them too.
  await prisma.order
    .update({ where: { id: order.id }, data: { leadEmail: parsed.data.email } })
    .catch(() => null);

  return { ok: true };
}
