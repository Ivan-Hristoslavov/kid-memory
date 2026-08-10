"use server";

import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { sendAccessLinkEmail } from "@/lib/email/send";

/**
 * Passwordless access to a customer's own orders.
 *
 * Checkout stays guest-only — accounts cost conversion — but a returning
 * customer still needs a way back to a design we already generated and already
 * paid for. A short-lived emailed token does that without a password.
 */
const TOKEN_TTL_MS = 30 * 60 * 1000;

export interface AccessState {
  ok?: boolean;
  error?: string;
}

export async function requestAccessLink(
  _prev: AccessState,
  formData: FormData
): Promise<AccessState> {
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(`access:${ip}`, { limit: 5, windowMs: 60 * 60 * 1000 }).ok) {
    return { error: "Твърде много опити. Опитай отново по-късно." };
  }

  const parsed = z
    .string()
    .trim()
    .email("Въведи валиден имейл")
    .max(120)
    .safeParse(formData.get("email"));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Невалиден имейл" };

  const email = parsed.data.toLowerCase();

  // Always report success, whether or not the address is known. Saying "no such
  // customer" would turn this form into a way to test whether someone bought.
  const hasOrders = await prisma.order
    .count({ where: { email: { equals: email, mode: "insensitive" } } })
    .catch(() => 0);

  if (hasOrders > 0) {
    const token = randomBytes(24).toString("base64url");
    const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    try {
      await prisma.accessToken.create({
        data: { token, email, expiresAt: new Date(Date.now() + TOKEN_TTL_MS) },
      });
      await sendAccessLinkEmail({ email, url: `${site}/moite?t=${token}` });
    } catch (err) {
      console.error("access link failed:", err);
      return { error: "Нещо се обърка. Опитай пак." };
    }
  }

  return { ok: true };
}

export interface CustomerOrder {
  id: string;
  orderNumber: number;
  childName: string;
  status: string;
  createdAt: Date;
  previewUrl: string | null;
}

/** Resolves a token to its orders, or null if it is unknown or expired. */
export async function ordersForToken(
  token: string
): Promise<{ email: string; orders: CustomerOrder[] } | null> {
  const row = await prisma.accessToken.findUnique({ where: { token } }).catch(() => null);
  if (!row || row.expiresAt <= new Date()) return null;

  const orders = await prisma.order.findMany({
    where: { email: { equals: row.email, mode: "insensitive" } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      orderNumber: true,
      childName: true,
      status: true,
      createdAt: true,
      previewImage: true,
    },
    take: 50,
  });

  const { storage } = await import("@/lib/storage");
  const thumbs = await storage()
    .signedUrls(
      orders.map((o) => o.previewImage).filter((k): k is string => Boolean(k)),
      30 * 60
    )
    .catch(() => ({}) as Record<string, string>);

  return {
    email: row.email,
    orders: orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      childName: o.childName,
      status: o.status,
      createdAt: o.createdAt,
      previewUrl: o.previewImage ? (thumbs[o.previewImage] ?? null) : null,
    })),
  };
}
