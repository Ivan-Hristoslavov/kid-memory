"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { enabledPaymentMethods, payments } from "@/lib/payments";
import { getSettings } from "@/lib/settings";
import { isPhoneBlocked } from "@/lib/blocked-phones";
import { finalizeConfirmedOrder } from "@/lib/orders/finalize";
import { rateLimit } from "@/lib/rate-limit";
import { shopCheckoutSchema } from "@/lib/validations";
import { cartInput, cartLabel, priceCart } from "@/lib/shop/pricing";

export interface ShopCheckoutState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

/**
 * Places a catalogue order.
 *
 * Mirrors `confirmOrder` for the poster deliberately, rather than inventing a
 * second way to take money: same rate limit, same paused-shop check, same
 * server-side pricing rule, same blocked-phone guard, same "Stripe leaves the
 * order unconfirmed until the webhook says otherwise", same confirmation token
 * and the same `finalizeConfirmedOrder`. Everything downstream — couriers,
 * emails, the admin queue, tracking — therefore works with no shop-specific
 * branch.
 *
 * The one structural difference: a poster order already exists by the time
 * checkout runs, because generating the preview created it. A basket has no row
 * until now, so this creates the order and its lines together.
 */
export async function placeShopOrder(
  _prev: ShopCheckoutState,
  formData: FormData
): Promise<ShopCheckoutState> {
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(`shop-checkout:${ip}`, { limit: 10, windowMs: 60 * 60 * 1000 }).ok) {
    return { error: "Твърде много опити. Опитай отново по-късно." };
  }

  const parsed = shopCheckoutSchema.safeParse({
    customerName: formData.get("customerName"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    city: formData.get("city") ?? "",
    address: formData.get("address") ?? "",
    courier: formData.get("courier") ?? "",
    deliveryMethod: formData.get("deliveryMethod") ?? "",
    courierOffice: formData.get("courierOffice") ?? "",
    paymentMethod: formData.get("paymentMethod") ?? "COD",
    marketingOptIn: formData.get("marketingOptIn") === "on",
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { error: "Провери отбелязаните полета.", fieldErrors };
  }

  const settings = await getSettings();
  if (settings.shopPaused) return { error: settings.shopPausedMessage };

  // The basket travels as JSON in a hidden field. It is input, not truth:
  // `priceCart` re-reads every product from the catalogue and discards anything
  // it does not recognise.
  let rawCart: unknown;
  try {
    rawCart = JSON.parse(String(formData.get("cart") ?? "[]"));
  } catch {
    return { error: "Количката не можа да бъде прочетена. Опитай пак." };
  }
  const cartParsed = cartInput.safeParse(rawCart);
  if (!cartParsed.success) {
    return { error: "Количката е празна или невалидна." };
  }
  const cart = priceCart(cartParsed.data);
  if (!cart) {
    return {
      error:
        "Нищо в количката не може да бъде поръчано. Продуктите може да са се променили — провери я отново.",
    };
  }

  const data = parsed.data;
  const method = data.paymentMethod;
  if (!enabledPaymentMethods().includes(method)) {
    return {
      error:
        method === "STRIPE"
          ? "Плащането с карта не е достъпно в момента. Избери наложен платеж."
          : "Този начин на плащане не е достъпен.",
      fieldErrors: { paymentMethod: "Избери друг начин на плащане" },
    };
  }

  // Only cash on delivery is checked: the block exists because an unclaimed
  // parcel is a total loss, and a prepaid order cannot become one.
  if (method === "COD" && (await isPhoneBlocked(data.phone))) {
    return {
      error:
        "Не можем да приемем поръчка с наложен платеж на този телефон. Плати с карта или ни пиши, за да уредим поръчката лично.",
      fieldErrors: { phone: "Избери плащане с карта или се свържи с нас" },
    };
  }

  const label = cartLabel(cart);
  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const order = await prisma.order.create({
    data: {
      // A shop order carries no poster. These columns stay filled with
      // placeholders so every existing reader — admin, emails, the courier
      // manifest — keeps working without a shop-specific branch; the lines are
      // where the truth is.
      childName: label,
      words: [] as Prisma.InputJsonValue,
      subjects: [] as Prisma.InputJsonValue,
      animals: [],
      style: "",
      priceEUR: cart.totalEUR,
      paymentMethod: method,
      customerName: data.customerName,
      phone: data.phone,
      email: data.email,
      city: data.city || null,
      address: data.address || null,
      courier: data.courier as "ECONT" | "SPEEDY",
      deliveryMethod: data.deliveryMethod as "OFFICE" | "ADDRESS" | "LOCKER",
      courierOffice: data.courierOffice || null,
      marketingOptIn: data.marketingOptIn,
      lines: {
        create: cart.lines.map((l) => ({
          productId: l.product.id,
          title: l.product.title,
          quantity: l.quantity,
          unitPriceEUR: l.unitPriceEUR,
          variants: l.variants as Prisma.InputJsonValue,
          photoKey: l.photoKey ?? null,
          designId: l.designId ?? null,
          // Every field of the placement, not three of them. `feather` and
          // `font` were dropped here while the print renderer did not exist;
          // now that it does, a line saved without them prints a hard-edged
          // photo and the wrong face.
          placement:
            l.photoKey || l.designId
              ? (l.placement as unknown as Prisma.InputJsonValue)
              : undefined,
          text: l.text ?? null,
          giftWrap: l.giftWrap,
        })),
      },
    },
  });

  if (method === "STRIPE") {
    // Left unconfirmed on purpose. Reaching a payment page is not an order —
    // half of them never pay, and counting those would put unpaid work in the
    // print queue. The webhook is the only thing that confirms.
    let redirectUrl: string | undefined;
    try {
      const intent = await payments("STRIPE").createPayment({
        orderId: order.id,
        orderNumber: order.orderNumber,
        amountEUR: cart.totalEUR,
        description: label,
        customerEmail: data.email,
        successUrl: `${site}/success?order=${order.orderNumber}&id=${order.id}`,
        cancelUrl: `${site}/kolichka`,
      });
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentRef: intent.id },
      });
      redirectUrl = intent.redirectUrl;
    } catch (err) {
      console.error("Stripe checkout session failed:", err);
      return {
        error:
          "Плащането с карта не тръгна. Опитай пак или избери наложен платеж — количката е запазена.",
      };
    }
    if (!redirectUrl) {
      return {
        error:
          "Плащането с карта не тръгна. Опитай пак или избери наложен платеж — количката е запазена.",
      };
    }
    // Outside the try: redirect() signals by throwing, and catching it would
    // turn a working redirect into the error above.
    redirect(redirectUrl);
  }

  // ---- Cash on delivery ----------------------------------------------------
  const confirmToken = randomBytes(24).toString("base64url");
  await prisma.order.update({
    where: { id: order.id },
    data: { status: "CONFIRMED", confirmToken },
  });

  await payments("COD").createPayment({
    orderId: order.id,
    orderNumber: order.orderNumber,
    amountEUR: cart.totalEUR,
    description: label,
    successUrl: `${site}/success`,
    cancelUrl: `${site}/kolichka`,
  });

  await finalizeConfirmedOrder(order.id);

  redirect(`/success?order=${order.orderNumber}&id=${order.id}`);
}
