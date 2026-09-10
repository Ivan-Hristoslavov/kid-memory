/**
 * Print-on-demand supplier abstraction.
 *
 * The shop does not print anything itself: a mug is manufactured and shipped by
 * a partner, and which partner that is has already changed once. When the
 * supplier was a constant — `source: "PRINTFACTORY"` on every catalogue entry,
 * with their URLs beside it — changing it meant rewriting the catalogue.
 *
 * Modelled on `lib/payments`, which solved the same shape of problem: one
 * interface, one registry, and call sites that name a capability rather than a
 * company. Cash on delivery and Stripe sit behind `PaymentProvider`; suppliers
 * sit behind `PodProvider`.
 *
 * Note what is NOT here. There is no `listCatalogue()` returning everything a
 * supplier makes: their catalogues run to hundreds of blanks, the shop sells a
 * curated dozen, and which dozen is a merchandising decision that belongs in
 * `lib/shop/products.ts` — not something to be discovered at runtime.
 */

export type PodSupplierId = "PRINTFACTORY" | "PRINTONDEMAND";

/** One line of a fulfilment request — a product, its variant, its artwork. */
export interface PodOrderLine {
  /**
   * The supplier's own id for this product.
   *
   * On printondemand.bg this is a numeric id of a product that already exists
   * in THEIR catalogue with its artwork applied — their API accepts no design
   * file, so a personalised item has to be created on their side before it can
   * be ordered here.
   */
  supplierProductCode: string | null;
  /** The supplier's page for this item, when a code is not enough to identify it. */
  supplierUrl: string;
  quantity: number;
  /** Chosen options, in the supplier's own vocabulary: { "size": "M" }. */
  variants: Record<string, string>;
  /**
   * A publicly reachable URL of the print-ready artwork.
   *
   * Deliberately a URL and not bytes: every supplier API examined so far
   * fetches the file itself, and streaming megabytes through our own server to
   * hand them straight back is work nobody needs. It must be a signed,
   * expiring link — the artwork is a customer's photograph.
   */
  artworkUrl: string;
}

export interface PodOrderRequest {
  /** Our own order number, so their support and ours can talk about one thing. */
  reference: string;
  lines: PodOrderLine[];
  recipient: {
    name: string;
    phone: string;
    email?: string;
    /** Bulgarian address or courier office, as the customer chose. */
    city: string;
    address?: string;
    courier?: "ECONT" | "SPEEDY";
    courierOffice?: string;
  };
  /** What the courier collects, when the supplier handles cash on delivery. */
  codAmountEUR?: number;
}

export interface PodOrder {
  /** The supplier's id for this order. Stored so status can be polled. */
  id: string;
  status: PodOrderStatus;
  trackingNumber?: string;
}

export type PodOrderStatus =
  | "RECEIVED"
  | "IN_PRODUCTION"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "UNKNOWN";

export interface PodProvider {
  readonly id: PodSupplierId;
  /** Human name, for the admin panel and for error messages. */
  readonly name: string;

  /**
   * Whether this supplier can actually be used right now.
   *
   * Same discipline as `stripeConfigured()`: a half-configured supplier must be
   * invisible rather than fail at the worst possible moment, which for a print
   * partner is after the customer has paid.
   */
  configured(): boolean;

  /** Hands an order over for production. */
  createOrder(req: PodOrderRequest): Promise<PodOrder>;

  /** Where an order has got to. */
  getOrder(id: string): Promise<PodOrder>;
}

/**
 * Thrown when a supplier is reachable but cannot do what was asked.
 *
 * Separate from a network failure on purpose: one is worth retrying and the
 * other needs a person.
 */
export class PodError extends Error {
  constructor(
    message: string,
    readonly retryable = false
  ) {
    super(message);
    this.name = "PodError";
  }
}
