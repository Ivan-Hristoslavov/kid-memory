"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { payments } from "@/lib/payments";
import { getSettings } from "@/lib/settings";
import { isPhoneBlocked } from "@/lib/blocked-phones";
import { trackServerPurchase } from "@/lib/analytics/server";
import { sendOrderReceivedEmail, sendOwnerNewOrderEmail } from "@/lib/email/send";
import { rateLimit } from "@/lib/rate-limit";
import { checkoutSchema } from "@/lib/validations";
import {
  ADDONS,
  availableAddons,
  calcDeliveryEUR,
  calcGrandTotalEUR,
  calcTotalEUR,
  formatPrice,
  isAvailable,
  PRODUCTS,
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
    city: formData.get("city"),
    address: formData.get("address") ?? "",
    courier: formData.get("courier"),
    deliveryMethod: formData.get("deliveryMethod"),
    courierOffice: formData.get("courierOffice") ?? "",
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { error: "Провери отбелязаните полета.", fieldErrors };
  }

  const data = parsed.data;
  const productId = data.productType as ProductId;
  const product = PRODUCTS[productId];
  if (!isAvailable(productId)) {
    return { error: "Този продукт вече не е наличен. Избери друг вариант." };
  }
  // Digital orders can't take physical extras; totals are computed server-side.
  const allowedAddons = availableAddons(productId);
  const addons = data.addons.filter((a): a is AddonId =>
    allowedAddons.includes(a as AddonId)
  );
  const subtotalEUR = calcTotalEUR(productId, addons);
  const deliveryEUR = calcDeliveryEUR(productId, subtotalEUR);
  const totalEUR = calcGrandTotalEUR(productId, addons);

  // A number that already refused a personalised parcel must not silently cost
  // us a second one. The message stays neutral — we invite contact rather than
  // accuse anyone, since numbers get reused and mistakes happen.
  if (await isPhoneBlocked(data.phone)) {
    return {
      error:
        "Не можем да приемем поръчка с наложен платеж на този телефон. Пиши ни и ще уредим поръчката лично.",
      fieldErrors: { phone: "Свържи се с нас за тази поръчка" },
    };
  }

  const order = await prisma.order.findUnique({ where: { id: data.orderId } });
  if (!order || order.status !== "PREVIEW_READY") {
    return { error: "Поръчката не е намерена или вече е потвърдена." };
  }

  // Single-use token for the "confirm before we print" link in the email.
  const confirmToken = randomBytes(24).toString("base64url");

  // Price is always taken from the server-side catalog, never from the client.
  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: "CONFIRMED",
      productType: data.productType as ProductId,
      addons,
      priceEUR: totalEUR,
      confirmToken,
      paymentMethod: "COD",
      customerName: data.customerName,
      phone: data.phone,
      email: data.email,
      city: data.city,
      address: data.address || null,
      courier: data.productType === "DIGITAL" ? null : data.courier,
      deliveryMethod: data.productType === "DIGITAL" ? null : data.deliveryMethod,
      courierOffice: data.courierOffice || null,
    },
  });

  await payments("COD").createPayment(order.id, totalEUR);

  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const settings = await getSettings();

  // Server-side conversion, so a consent-blocked browser still reports the sale.
  await trackServerPurchase({
    orderId: order.id,
    orderNumber: order.orderNumber,
    valueEUR: totalEUR,
    email: data.email,
    phone: data.phone,
    city: data.city,
    productName: product.name,
  });

  try {
    await sendOrderReceivedEmail({
      orderNumber: order.orderNumber,
      customerName: data.customerName,
      email: data.email,
      productType: data.productType as ProductId,
      childName: order.childName,
      addons,
      subtotalEUR,
      deliveryEUR,
      totalEUR,
      deliveryDays: settings.deliveryDays,
      confirmUrl: `${site}/potvurdi/${confirmToken}`,
      trackUrl: `${site}/proverka?order=${order.orderNumber}`,
    });
    await prisma.order.update({
      where: { id: order.id },
      data: { emailsSent: [...(order.emailsSent as string[]), "ORDER_RECEIVED"] },
    });
  } catch (err) {
    // Email must never block a confirmed order
    console.error("Order-received email failed:", err);
  }

  try {
    await sendOwnerNewOrderEmail({
      orderNumber: order.orderNumber,
      childName: order.childName,
      customerName: data.customerName,
      phone: data.phone,
      productName: product.name,
      total: formatPrice(totalEUR),
      addons: addons.map((a) => ADDONS[a]?.name ?? a),
      adminUrl: `${site}/admin/orders/${order.id}`,
    });
  } catch (err) {
    console.error("Owner notification failed:", err);
  }

  // The cuid is unguessable, so the success page can safely show order details
  // without someone enumerating sequential order numbers.
  redirect(`/success?order=${order.orderNumber}&id=${order.id}`);
}
