import "server-only";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";
import { getSettings } from "@/lib/settings";
import { trackServerPurchase } from "@/lib/analytics/server";
import {
  sendDigitalDeliveryEmail,
  sendOrderReceivedEmail,
  sendOwnerNewOrderEmail,
} from "@/lib/email/send";
import {
  ADDONS,
  calcDeliveryEUR,
  calcTotalEUR,
  formatPrice,
  PRODUCTS,
  type AddonId,
  type ProductId,
} from "@/lib/catalog";

/**
 * Everything that happens once an order is really ours: the conversion ping,
 * the customer's receipt, the owner's alert, and — for the digital product —
 * the file itself.
 *
 * It lives here rather than in the checkout action because two very different
 * callers need it. Cash on delivery finalises inside the server action, while a
 * card order only becomes real when Stripe says so, minutes later and in a
 * different request. Duplicating this into a webhook handler is how the two
 * paths quietly drift apart until only one of them emails anybody.
 *
 * How long a digital download link stays valid. Long enough to survive a mail
 * client sitting on the message overnight, short enough that a forwarded email
 * is not a permanent giveaway; `/moite` mints a fresh one on demand.
 */
const DIGITAL_LINK_TTL_SECONDS = 24 * 60 * 60;
const DIGITAL_LINK_TTL_LABEL = "24 часа";

/**
 * Runs the post-confirmation side effects for one order, at most once.
 *
 * Idempotent by design: Stripe retries a webhook on any non-2xx response and
 * may deliver the same event twice even on success, so a second call must be a
 * no-op rather than a second receipt and a second owner alert. The `emailsSent`
 * stamp is the guard, and it is written before the optional work so a failure
 * further down cannot cause the whole thing to replay.
 *
 * Never throws. A confirmed, paid order must not be rolled back because an
 * email provider had a bad minute — the owner is alerted through the log and
 * the order is visible in the admin queue regardless.
 */
export async function finalizeConfirmedOrder(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { lines: { orderBy: { createdAt: "asc" } } },
  });
  if (!order) return;

  const sent = Array.isArray(order.emailsSent) ? (order.emailsSent as string[]) : [];
  if (sent.includes("ORDER_RECEIVED")) return;

  /**
   * A shop order has lines; a poster order has none. That is the whole
   * discriminator, the same one the admin uses.
   *
   * It matters here because `productType` is null on a shop order and used to
   * default to POSTER_A4 — so somebody who bought six t-shirts was sent a
   * receipt itemising an A4 poster and its add-ons. The total was right, which
   * is exactly what made it hard to notice.
   */
  const isShopOrder = order.lines.length > 0;
  const productId = (order.productType ?? "POSTER_A4") as ProductId;
  const product = PRODUCTS[productId];
  const addons = isShopOrder
    ? []
    : order.addons.filter((a): a is AddonId => a in ADDONS);

  const shopLines = order.lines.map((l) => ({
    title: l.title,
    quantity: l.quantity,
    totalEUR: Math.round(Number(l.unitPriceEUR) * l.quantity * 100) / 100,
  }));
  const goodsEUR = Math.round(
    shopLines.reduce((sum, l) => sum + l.totalEUR, 0) * 100
  ) / 100;

  const subtotalEUR = isShopOrder ? goodsEUR : calcTotalEUR(productId, addons);
  const totalEUR = order.priceEUR
    ? Number(order.priceEUR)
    : subtotalEUR + calcDeliveryEUR(productId, subtotalEUR);
  // Derived from the total rather than recomputed: the cart already applied the
  // quantity tier and the free-delivery threshold, and a second calculation
  // here could disagree with what the customer was charged.
  const deliveryEUR = isShopOrder
    ? Math.round((totalEUR - subtotalEUR) * 100) / 100
    : calcDeliveryEUR(productId, subtotalEUR);

  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const settings = await getSettings();
  const paid = order.paymentStatus === "PAID";

  // Claim the send before doing it. A crash mid-way costs one receipt; not
  // claiming it costs every customer a duplicate every time Stripe retries.
  await prisma.order.update({
    where: { id: order.id },
    data: { emailsSent: [...sent, "ORDER_RECEIVED"] },
  });

  // Server-side conversion, so a consent-blocked browser still reports the sale.
  try {
    await trackServerPurchase({
      orderId: order.id,
      orderNumber: order.orderNumber,
      valueEUR: totalEUR,
      email: order.email ?? "",
      phone: order.phone ?? "",
      city: order.city ?? "",
      productName: product.name,
    });
  } catch (err) {
    console.error("Server-side purchase tracking failed:", err);
  }

  if (order.email) {
    try {
      await sendOrderReceivedEmail({
        orderNumber: order.orderNumber,
        customerName: order.customerName ?? "",
        email: order.email,
        productType: productId,
        childName: order.childName,
        addons,
        subtotalEUR,
        deliveryEUR,
        totalEUR,
        deliveryDays: settings.deliveryDays,
        paid,
        lines: isShopOrder ? shopLines : undefined,
        confirmUrl: order.confirmToken ? `${site}/potvurdi/${order.confirmToken}` : undefined,
        trackUrl: `${site}/proverka?order=${order.orderNumber}`,
      });
    } catch (err) {
      console.error("Order-received email failed:", err);
    }
  }

  // The digital product is delivered by this email and nothing else — there is
  // no parcel and no admin step behind it, so a failure here is a customer who
  // paid and got nothing. It is logged loudly and recoverable from /moite.
  if (productId === "DIGITAL" && paid && order.email && order.finalImage) {
    try {
      const downloadUrl = await storage().signedUrl(order.finalImage, DIGITAL_LINK_TTL_SECONDS);
      await sendDigitalDeliveryEmail({
        orderNumber: order.orderNumber,
        customerName: order.customerName ?? "",
        email: order.email,
        childName: order.childName,
        downloadUrl,
        validFor: DIGITAL_LINK_TTL_LABEL,
        myOrdersUrl: `${site}/moite`,
      });
      await prisma.order.update({
        where: { id: order.id },
        data: { emailsSent: [...sent, "ORDER_RECEIVED", "DIGITAL_DELIVERY"] },
      });
    } catch (err) {
      console.error("Digital delivery email failed:", err);
    }
  }

  try {
    await sendOwnerNewOrderEmail({
      orderNumber: order.orderNumber,
      childName: order.childName,
      customerName: order.customerName ?? "",
      phone: order.phone ?? "",
      // The owner's alert says what to make. On a shop order that is the
      // basket, not a poster's product name — this is the mail that decides
      // what gets pulled off the shelf.
      productName: isShopOrder
        ? `${order.lines.length} ${order.lines.length === 1 ? "артикул" : "артикула"}`
        : product.name,
      total: `${formatPrice(totalEUR)}${paid ? " (платено)" : " (наложен платеж)"}`,
      addons: isShopOrder
        ? shopLines.map((l) => `${l.quantity} × ${l.title}`)
        : addons.map((a) => ADDONS[a]?.name ?? a),
      adminUrl: `${site}/admin/orders/${order.id}`,
    });
  } catch (err) {
    console.error("Owner notification failed:", err);
  }
}
