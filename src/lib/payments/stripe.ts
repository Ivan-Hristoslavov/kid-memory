import "server-only";
import Stripe from "stripe";
import { cardPaymentsOffered } from "@/lib/config";
import type {
  PaymentIntent,
  PaymentProvider,
  PaymentRequest,
  PaymentWebhookResult,
} from "./types";

/**
 * Stripe Checkout — the hosted page, not an embedded form.
 *
 * Hosting the card fields ourselves would put us inside PCI scope and leave
 * 3-D Secure, Apple Pay and Google Pay to build by hand. The redirect costs one
 * page transition and gives all of that, translated, for free.
 */

/**
 * Card payment is opt-in twice over: the owner flips the public switch, and the
 * secret key has to actually be there. Requiring both means a half-finished
 * setup shows cash on delivery instead of a card button that throws on click.
 */
export function stripeConfigured(): boolean {
  return cardPaymentsOffered() && Boolean(process.env.STRIPE_SECRET_KEY);
}

let client: Stripe | null = null;

/**
 * Created on first use rather than at import time, so a deployment without a
 * Stripe key can still import the payments module for cash on delivery.
 *
 * `apiVersion` is deliberately not pinned here: the SDK defaults to exactly the
 * version its own TypeScript types describe, and hardcoding a string only
 * creates a second place to forget on upgrade.
 */
function stripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  client ??= new Stripe(key, { typescript: true });
  return client;
}

/** Euros to the integer minor units Stripe bills in. */
function toCents(eur: number): number {
  return Math.round(eur * 100);
}

export class StripeProvider implements PaymentProvider {
  readonly id = "STRIPE" as const;

  async createPayment(req: PaymentRequest): Promise<PaymentIntent> {
    const session = await stripe().checkout.sessions.create(
      {
        mode: "payment",
        locale: "bg",
        // Both are read back on the webhook. `client_reference_id` is the
        // documented place for our own id; the metadata copy is what shows up
        // in the dashboard next to a payment when a human is reconciling.
        client_reference_id: req.orderId,
        metadata: { orderId: req.orderId, orderNumber: String(req.orderNumber) },
        payment_intent_data: {
          metadata: { orderId: req.orderId, orderNumber: String(req.orderNumber) },
        },
        customer_email: req.customerEmail,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "eur",
              unit_amount: toCents(req.amountEUR),
              product_data: { name: req.description },
            },
          },
        ],
        success_url: req.successUrl,
        cancel_url: req.cancelUrl,
      },
      // A double-submitted form must not open two payable sessions for one
      // order — both could be paid, and the customer would be charged twice.
      // Stripe returns the original session for a repeated key.
      //
      // The amount is part of the key on purpose: a customer who goes back and
      // changes the format needs a session for the new price, not the old one.
      // Keys expire after 24 hours, which is also when an unpaid session dies,
      // so a returning customer gets a fresh page rather than an expired one.
      { idempotencyKey: `order_${req.orderId}_${toCents(req.amountEUR)}` }
    );

    return {
      id: session.id,
      redirectUrl: session.url ?? undefined,
      status: session.payment_status === "paid" ? "PAID" : "PENDING",
    };
  }

  async handleWebhook(rawBody: string, signature: string): Promise<PaymentWebhookResult> {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not configured");

    // Async variant: it uses the platform's WebCrypto instead of node:crypto,
    // so the same code verifies correctly on every runtime we might deploy to.
    const event = await stripe().webhooks.constructEventAsync(rawBody, signature, secret);

    switch (event.type) {
      // Card payments settle inside the redirect, so this arrives already paid.
      // Delayed methods (bank debits) arrive unpaid here and settle later.
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object;
        const orderId = session.client_reference_id ?? session.metadata?.orderId;
        if (!orderId) return { orderId: "", paid: false, ignored: true };
        return {
          orderId,
          paid: session.payment_status === "paid",
          reference: session.id,
          amountEUR: session.amount_total === null ? undefined : session.amount_total / 100,
        };
      }

      // Nothing to undo — the order was never confirmed, it simply stays a
      // preview the customer can come back to.
      case "checkout.session.expired":
      case "checkout.session.async_payment_failed": {
        const session = event.data.object;
        const orderId = session.client_reference_id ?? session.metadata?.orderId;
        return { orderId: orderId ?? "", paid: false, ignored: true };
      }

      default:
        return { orderId: "", paid: false, ignored: true };
    }
  }
}
