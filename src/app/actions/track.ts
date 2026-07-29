"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { formatPrice } from "@/lib/catalog";

/**
 * Public order lookup. Requires the order number *and* the phone it was placed
 * with, so a sequential order number alone reveals nothing. Rate limited
 * because the pair is otherwise guessable by brute force.
 */

const lookupSchema = z.object({
  orderNumber: z.coerce.number().int().positive("Въведи номер на поръчка"),
  phone: z
    .string()
    .trim()
    .min(6, "Въведи телефона от поръчката")
    .transform((v) => v.replace(/\D/g, "")),
});

export interface TrackResult {
  error?: string;
  order?: {
    orderNumber: number;
    childName: string;
    status: string;
    courier: string | null;
    trackingNumber: string | null;
    total: string | null;
    confirmed: boolean;
  };
}

export async function lookupOrder(
  _prev: TrackResult,
  formData: FormData
): Promise<TrackResult> {
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(`track:${ip}`, { limit: 20, windowMs: 60 * 60 * 1000 }).ok) {
    return { error: "Твърде много опити. Опитай отново след малко." };
  }

  const parsed = lookupSchema.safeParse({
    orderNumber: formData.get("orderNumber"),
    phone: formData.get("phone"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Провери данните." };
  }

  const order = await prisma.order
    .findUnique({
      where: { orderNumber: parsed.data.orderNumber },
      select: {
        orderNumber: true,
        childName: true,
        status: true,
        phone: true,
        courier: true,
        trackingNumber: true,
        priceEUR: true,
        confirmedAt: true,
      },
    })
    .catch(() => null);

  // Compare on digits only — the stored number may carry +359 or spacing.
  const storedDigits = (order?.phone ?? "").replace(/\D/g, "");
  const givenDigits = parsed.data.phone;
  const phoneMatches =
    storedDigits.length > 0 &&
    (storedDigits.endsWith(givenDigits.slice(-8)) ||
      givenDigits.endsWith(storedDigits.slice(-8)));

  if (!order || !phoneMatches) {
    return { error: "Не намерихме поръчка с този номер и телефон." };
  }

  return {
    order: {
      orderNumber: order.orderNumber,
      childName: order.childName,
      status: order.status,
      courier: order.courier,
      trackingNumber: order.trackingNumber,
      total: order.priceEUR ? formatPrice(Number(order.priceEUR)) : null,
      confirmed: Boolean(order.confirmedAt),
    },
  };
}
