/**
 * Payment abstraction.
 *
 * Cash on delivery is the default and always available. Card payment is opt-in
 * per environment, because it needs a merchant account the shop may not have
 * yet — see `stripeEnabled()` in lib/config.
 *
 * The two differ in more than the money. A COD order is confirmed the moment
 * it is placed and paid only on the doorstep, so nothing may be printed until
 * the customer re-confirms by email. A card order is already paid when it
 * reaches us, which removes the refusal risk and the confirmation step with it.
 */

/** Everything a provider needs to open a payment for one order. */
export interface PaymentRequest {
  orderId: string;
  /** Shown to the customer on the payment page and used as the reference. */
  orderNumber: number;
  /** Grand total — goods plus delivery. Never a subtotal. */
  amountEUR: number;
  /** What is being bought, in Bulgarian, for the payment page line item. */
  description: string;
  /** Prefilled on the payment page so the receipt reaches the buyer. */
  customerEmail?: string;
  /** Where the provider returns a paying customer. */
  successUrl: string;
  /** Where the provider returns a customer who backed out. */
  cancelUrl: string;
}

export interface PaymentIntent {
  /** Provider-side id ("cod_<orderId>" for cash on delivery). */
  id: string;
  /** Where to send the customer, if the provider needs a redirect. */
  redirectUrl?: string;
  status: "PENDING" | "PAID" | "FAILED";
}

/** What a verified webhook tells us about an order. */
export interface PaymentWebhookResult {
  orderId: string;
  paid: boolean;
  /** Provider-side reference, stored on the order for reconciliation. */
  reference?: string;
  /**
   * What the provider says was actually collected. The caller compares it with
   * the price it stored: a session is created server-side and its amount cannot
   * be edited by the buyer, so a mismatch means something is wrong enough that
   * the order must not auto-confirm.
   */
  amountEUR?: number;
  /** True for events that carry no payment outcome and need no action. */
  ignored?: boolean;
}

export interface PaymentProvider {
  readonly id: PaymentMethodId;
  /** Begin payment for an order. COD resolves immediately as PENDING. */
  createPayment(req: PaymentRequest): Promise<PaymentIntent>;
  /** Handle async confirmation (webhooks). COD confirms on delivery. */
  handleWebhook?(rawBody: string, signature: string): Promise<PaymentWebhookResult>;
}

export type PaymentMethodId = "COD" | "STRIPE" | "REVOLUT";
