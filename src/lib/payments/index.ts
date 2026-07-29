import "server-only";
import type { PaymentIntent, PaymentProvider } from "./types";

export * from "./types";

/** Cash on delivery — collected by the courier, no online step. */
class CashOnDeliveryProvider implements PaymentProvider {
  readonly id = "COD" as const;

  async createPayment(orderId: string): Promise<PaymentIntent> {
    return { id: `cod_${orderId}`, status: "PENDING" };
  }
}

/** Stripe Checkout — wire in when card payments launch. */
class StripeProvider implements PaymentProvider {
  readonly id = "STRIPE" as const;

  async createPayment(): Promise<PaymentIntent> {
    // Planned: stripe.checkout.sessions.create with EUR price, success/cancel URLs.
    throw new Error("Stripe payments are not enabled yet");
  }

  async handleWebhook(): Promise<{ orderId: string; paid: boolean }> {
    // Planned: verify STRIPE_WEBHOOK_SECRET signature, read checkout.session.completed.
    throw new Error("Stripe payments are not enabled yet");
  }
}

/** Revolut Pay — wire in when enabled for the merchant account. */
class RevolutProvider implements PaymentProvider {
  readonly id = "REVOLUT" as const;

  async createPayment(): Promise<PaymentIntent> {
    // Planned: POST https://merchant.revolut.com/api/orders with amount in EUR.
    throw new Error("Revolut Pay is not enabled yet");
  }
}

const providers: Record<"COD" | "STRIPE" | "REVOLUT", PaymentProvider> = {
  COD: new CashOnDeliveryProvider(),
  STRIPE: new StripeProvider(),
  REVOLUT: new RevolutProvider(),
};

export function payments(id: "COD" | "STRIPE" | "REVOLUT" = "COD"): PaymentProvider {
  return providers[id];
}
