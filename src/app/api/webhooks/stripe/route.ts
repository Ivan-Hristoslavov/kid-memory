import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { payments, stripeConfigured } from "@/lib/payments";
import { finalizeConfirmedOrder } from "@/lib/orders/finalize";
import { logAdminEvent } from "@/lib/admin-log";
import { sendOwnerAlertEmail } from "@/lib/email/send";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Stripe's view of the truth about money.
 *
 * The browser redirect back from Checkout is a courtesy, not evidence: a
 * customer can close the tab, lose signal, or simply never return, and the
 * payment still went through. This endpoint is the only place an order becomes
 * CONFIRMED and PAID, which is why the success page reads state rather than
 * writing it.
 *
 * Signature-verified against STRIPE_WEBHOOK_SECRET — the body is otherwise an
 * unauthenticated POST from the open internet claiming an order was paid.
 */
export async function POST(req: Request) {
  if (!stripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not enabled" }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // The raw text, not the parsed JSON: the signature covers the exact bytes,
  // so anything that re-serialises the body invalidates it.
  const rawBody = await req.text();

  let result;
  try {
    result = await payments("STRIPE").handleWebhook!(rawBody, signature);
  } catch (err) {
    // A bad signature is either a misconfigured secret or someone probing.
    // Either way it is a 400 — a 500 would make Stripe retry it forever.
    console.error("Stripe webhook verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (result.ignored || !result.orderId || !result.paid) {
    return NextResponse.json({ received: true });
  }

  const order = await prisma.order.findUnique({ where: { id: result.orderId } });
  if (!order) {
    // 200 on purpose: the order is gone and retrying will not bring it back.
    console.error("Stripe webhook for unknown order:", result.orderId);
    return NextResponse.json({ received: true });
  }

  // Already handled — Stripe retries on timeouts even when we succeeded.
  if (order.paidAt) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  // The session amount is set by us and cannot be edited by the buyer, so a
  // mismatch means something is wrong enough that this must not auto-confirm
  // into the print queue. Recorded, flagged to the owner, and left alone.
  const expected = order.priceEUR ? Number(order.priceEUR) : null;
  if (expected !== null && result.amountEUR !== undefined) {
    const off = Math.abs(result.amountEUR - expected) > 0.01;
    if (off) {
      await logAdminEvent({
        action: "PAYMENT_AMOUNT_MISMATCH",
        orderId: order.id,
        actor: "stripe",
        detail: `Stripe събра ${result.amountEUR} €, а поръчката е за ${expected} €`,
      });
      await sendOwnerAlertEmail({
        subject: `Несъответствие в плащането по поръчка №${order.orderNumber}`,
        body: `Stripe събра ${result.amountEUR} €, а поръчката е записана за ${expected} €. Поръчката НЕ е потвърдена автоматично — провери я ръчно в админа.`,
      }).catch(() => {});
      return NextResponse.json({ received: true, mismatch: true });
    }
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: "CONFIRMED",
      paymentStatus: "PAID",
      paidAt: new Date(),
      paymentRef: result.reference ?? order.paymentRef,
      // Paid means confirmed. The email confirmation step exists only to stop
      // us printing something nobody will pay for at the door; with the money
      // already in, asking again would just delay the order by a day.
      confirmedAt: new Date(),
    },
  });

  await finalizeConfirmedOrder(order.id);

  return NextResponse.json({ received: true });
}
