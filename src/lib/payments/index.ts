import "server-only";
import { StripeProvider, stripeConfigured } from "./stripe";
import type {
  PaymentIntent,
  PaymentMethodId,
  PaymentProvider,
  PaymentRequest,
} from "./types";

export * from "./types";
export { stripeConfigured } from "./stripe";

/** Cash on delivery — collected by the courier, no online step. */
class CashOnDeliveryProvider implements PaymentProvider {
  readonly id = "COD" as const;

  async createPayment(req: PaymentRequest): Promise<PaymentIntent> {
    return { id: `cod_${req.orderId}`, status: "PENDING" };
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

const providers: Record<PaymentMethodId, PaymentProvider> = {
  COD: new CashOnDeliveryProvider(),
  STRIPE: new StripeProvider(),
  REVOLUT: new RevolutProvider(),
};

export function payments(id: PaymentMethodId = "COD"): PaymentProvider {
  return providers[id];
}

/**
 * Which methods a customer may actually pick, in display order.
 *
 * Cash on delivery is always offered. Card is offered only once the merchant
 * account exists, so a half-configured deployment shows one working option
 * rather than two, one of which errors at the worst possible moment.
 */
export function enabledPaymentMethods(): readonly PaymentMethodId[] {
  return stripeConfigured() ? (["STRIPE", "COD"] as const) : (["COD"] as const);
}
