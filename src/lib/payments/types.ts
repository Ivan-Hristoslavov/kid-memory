/**
 * Payment abstraction. Launch version ships cash-on-delivery only;
 * Stripe and Revolut Pay slot in behind the same interface later.
 */

export interface PaymentIntent {
  /** Provider-side id ("cod" for cash on delivery). */
  id: string;
  /** Where to send the customer, if the provider needs a redirect. */
  redirectUrl?: string;
  status: "PENDING" | "PAID" | "FAILED";
}

export interface PaymentProvider {
  readonly id: "COD" | "STRIPE" | "REVOLUT";
  /** Begin payment for an order. COD resolves immediately as PENDING. */
  createPayment(orderId: string, amountEUR: number): Promise<PaymentIntent>;
  /** Handle async confirmation (webhooks). COD confirms on delivery. */
  handleWebhook?(payload: unknown, signature: string): Promise<{ orderId: string; paid: boolean }>;
}
