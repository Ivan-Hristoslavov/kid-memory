"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { enabledPaymentMethods, payments } from "@/lib/payments";
import { getSettings } from "@/lib/settings";
import { isPhoneBlocked } from "@/lib/blocked-phones";
import { finalizeConfirmedOrder } from "@/lib/orders/finalize";
import { rateLimit } from "@/lib/rate-limit";
import { checkoutSchema } from "@/lib/validations";
import {
  calcGrandTotalEUR,
  isAvailable,
  PRODUCTS,
  availableAddons,
  type AddonId,
  type ProductId,
} from "@/lib/catalog";

export interface CheckoutFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function confirmOrder(
  _prev: CheckoutFormState,
  formData: FormData
): Promise<CheckoutFormState> {
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(`checkout:${ip}`, { limit: 10, windowMs: 60 * 60 * 1000 }).ok) {
    return { error: "Твърде много опити. Опитай отново по-късно." };
  }

  const parsed = checkoutSchema.safeParse({
    orderId: formData.get("orderId"),
    productType: formData.get("productType"),
    addons: formData.getAll("addons").map(String),
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
    childBirthday: formData.get("childBirthday") ?? "",
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
  if (settings.shopPaused) {
    return { error: settings.shopPausedMessage };
  }

  const data = parsed.data;
  const productId = data.productType as ProductId;
  const product = PRODUCTS[productId];
  if (!isAvailable(productId)) {
    return { error: "Този продукт вече не е наличен. Избери друг вариант." };
  }

  // The form only shows methods the server confirmed, so a value outside this
  // list means the field was edited rather than chosen.
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

  // Digital orders can't take physical extras; totals are computed server-side.
  const allowedAddons = availableAddons(productId);
  const addons = data.addons.filter((a): a is AddonId =>
    allowedAddons.includes(a as AddonId)
  );
  const totalEUR = calcGrandTotalEUR(productId, addons);

  // A number that already refused a personalised parcel must not silently cost
  // us a second one. The message stays neutral — we invite contact rather than
  // accuse anyone, since numbers get reused and mistakes happen.
  //
  // Only cash on delivery is checked: the block exists because an unclaimed
  // parcel is a total loss, and a prepaid order cannot become one.
  if (method === "COD" && (await isPhoneBlocked(data.phone))) {
    return {
      error:
        "Не можем да приемем поръчка с наложен платеж на този телефон. Плати с карта или ни пиши, за да уредим поръчката лично.",
      fieldErrors: { phone: "Избери плащане с карта или се свържи с нас" },
    };
  }

  const order = await prisma.order.findUnique({ where: { id: data.orderId } });
  if (!order || order.status !== "PREVIEW_READY") {
    return { error: "Поръчката не е намерена или вече е потвърдена." };
  }

  const isDigital = productId === "DIGITAL";
  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  // Everything the customer typed, independent of how they pay. Price is always
  // taken from the server-side catalog, never from the client.
  const orderData = {
    productType: productId,
    addons,
    priceEUR: totalEUR,
    paymentMethod: method,
    customerName: data.customerName,
    phone: data.phone,
    email: data.email,
    city: data.city || null,
    address: data.address || null,
    courier: isDigital ? null : (data.courier as "ECONT" | "SPEEDY"),
    deliveryMethod: isDigital
      ? null
      : (data.deliveryMethod as "OFFICE" | "ADDRESS" | "LOCKER"),
    courierOffice: data.courierOffice || null,
    marketingOptIn: data.marketingOptIn,
    childBirthday: data.childBirthday,
  };

  if (method === "STRIPE") {
    // Deliberately still PREVIEW_READY. An order is not confirmed because
    // somebody reached the payment page — half of them never pay, and counting
    // those as orders would put unpaid work in the print queue and inflate
    // every conversion number the shop is steered by. The webhook confirms it.
    await prisma.order.update({ where: { id: order.id }, data: orderData });

    let redirectUrl: string | undefined;
    try {
      const intent = await payments("STRIPE").createPayment({
        orderId: order.id,
        orderNumber: order.orderNumber,
        amountEUR: totalEUR,
        description: `${product.name} — ${order.childName}`,
        customerEmail: data.email,
        successUrl: `${site}/success?order=${order.orderNumber}&id=${order.id}`,
        cancelUrl: `${site}/order?orderId=${order.id}`,
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
          "Плащането с карта не тръгна. Опитай пак или избери наложен платеж — поръчката е запазена.",
      };
    }

    if (!redirectUrl) {
      return {
        error:
          "Плащането с карта не тръгна. Опитай пак или избери наложен платеж — поръчката е запазена.",
      };
    }
    // Outside the try: redirect() signals by throwing, and catching it here
    // would turn a working redirect into the error message above.
    redirect(redirectUrl);
  }

  // ---- Cash on delivery ----------------------------------------------------
  // Single-use token for the "confirm before we print" link in the email.
  const confirmToken = randomBytes(24).toString("base64url");

  await prisma.order.update({
    where: { id: order.id },
    data: { ...orderData, status: "CONFIRMED", confirmToken },
  });

  await payments("COD").createPayment({
    orderId: order.id,
    orderNumber: order.orderNumber,
    amountEUR: totalEUR,
    description: `${product.name} — ${order.childName}`,
    successUrl: `${site}/success`,
    cancelUrl: `${site}/order?orderId=${order.id}`,
  });

  await finalizeConfirmedOrder(order.id);

  // The cuid is unguessable, so the success page can safely show order details
  // without someone enumerating sequential order numbers.
  redirect(`/success?order=${order.orderNumber}&id=${order.id}`);
}
