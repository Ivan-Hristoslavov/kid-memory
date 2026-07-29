import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Phones that previously refused a cash-on-delivery parcel.
 *
 * A personalised poster that comes back cannot be resold, so a repeat refusal
 * is a guaranteed loss. Matching is done on the last 8 digits because the same
 * number arrives as 0888…, +359888… and 359888… depending on how it was typed.
 */
export function phoneKey(phone: string): string {
  return phone.replace(/\D/g, "").slice(-8);
}

export async function isPhoneBlocked(phone: string): Promise<boolean> {
  const key = phoneKey(phone);
  if (key.length < 8) return false;
  try {
    return (await prisma.blockedPhone.count({ where: { phone: key } })) > 0;
  } catch (err) {
    // Never let a lookup failure block a legitimate order.
    console.error("blocked phone lookup failed:", err);
    return false;
  }
}

export async function blockPhone(
  phone: string,
  reason: string,
  orderRef?: number
): Promise<void> {
  const key = phoneKey(phone);
  if (key.length < 8) return;
  await prisma.blockedPhone.upsert({
    where: { phone: key },
    create: { phone: key, reason, orderRef: orderRef ?? null },
    update: { reason, orderRef: orderRef ?? null },
  });
}

export async function unblockPhone(phone: string): Promise<void> {
  const key = phoneKey(phone);
  await prisma.blockedPhone.deleteMany({ where: { phone: key } });
}
