import "server-only";
import { createHash } from "node:crypto";

/**
 * Server-side Meta Conversions API.
 *
 * The browser pixel only loads after the visitor accepts marketing cookies, so
 * a large share of real sales never reaches Meta and ad delivery optimises on
 * a fraction of the data. This reports the purchase from the server instead.
 *
 * `event_id` is the order id and is also passed to the browser pixel, so Meta
 * deduplicates the two reports into a single conversion.
 *
 * No-ops unless META_PIXEL_ID and META_CAPI_TOKEN are configured.
 */

const API_VERSION = "v21.0";

/** Meta expects lowercase, trimmed, SHA-256 hashed identifiers. */
function hash(value: string | null | undefined): string[] {
  const normalised = (value ?? "").trim().toLowerCase();
  if (!normalised) return [];
  return [createHash("sha256").update(normalised).digest("hex")];
}

/** Phone numbers hash in E.164 form without the leading "+". */
function hashPhone(phone: string | null | undefined): string[] {
  let digits = (phone ?? "").replace(/\D/g, "");
  if (!digits) return [];
  if (digits.startsWith("00")) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = `359${digits.slice(1)}`;
  return [createHash("sha256").update(digits).digest("hex")];
}

export interface ServerPurchase {
  orderId: string;
  orderNumber: number;
  valueEUR: number;
  email: string;
  phone: string;
  city: string;
  productName: string;
}

export async function trackServerPurchase(purchase: ServerPurchase): Promise<void> {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const token = process.env.META_CAPI_TOKEN;
  if (!pixelId || !token) return;

  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const payload = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        // Matches the browser pixel's eventID so Meta counts one conversion.
        event_id: purchase.orderId,
        action_source: "website",
        event_source_url: `${site}/success`,
        user_data: {
          em: hash(purchase.email),
          ph: hashPhone(purchase.phone),
          ct: hash(purchase.city.replace(/\s/g, "")),
          country: hash("bg"),
        },
        custom_data: {
          currency: "EUR",
          value: purchase.valueEUR,
          order_id: String(purchase.orderNumber),
          content_name: purchase.productName,
        },
      },
    ],
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${pixelId}/events?access_token=${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    if (!res.ok) {
      console.error("Meta CAPI rejected the event:", res.status, await res.text());
    }
  } catch (err) {
    // Analytics must never break a confirmed order.
    console.error("Meta CAPI request failed:", err);
  }
}
