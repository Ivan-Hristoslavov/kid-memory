import "server-only";
import { z } from "zod";
import { ADDONS, DELIVERY, calcDeliveryEUR } from "@/lib/catalog";
import { quantityDiscount } from "./quantity";
import { productById, type MentyProduct } from "./products";
import { DEFAULT_PLACEMENT, type Placement } from "./placement";

/**
 * Server-side pricing for a basket.
 *
 * The client's basket is a suggestion, never an amount. Everything below is
 * recomputed from the catalogue: a posted price, a posted total, or a variant
 * the catalogue does not list is discarded rather than trusted. This matters
 * more here than it does for a poster — a poster order is one product and one
 * number, a basket is an arbitrary list somebody can hand-edit before posting.
 *
 * The quoted total must also match what the courier collects. A cash-on-
 * delivery parcel quoted at one number and charged another gets refused at the
 * door, and a personalised parcel that comes back is a total loss.
 */

/** What the browser may send. Deliberately no prices. */
export const cartLineInput = z.object({
  productId: z.string().min(1).max(64),
  quantity: z.number().int().min(1).max(20),
  variants: z.record(z.string().max(40), z.string().max(60)).default({}),
  photoKey: z.string().max(200).optional(),
  /**
   * Where the photo sits in the print area.
   *
   * x and y are the photo's CENTRE as a fraction of the print window, and that
   * centre legitimately leaves 0..1 once the photo is larger than the window:
   * panning a 3x zoom into a corner puts it at roughly -1.4 or 2.4. Bounding
   * these to 0..1 — as this first did — would have silently dropped the line
   * of any customer who zoomed in and moved the crop to an edge.
   *
   * The bound is therefore wide enough for any legal crop and narrow enough
   * that a hand-edited value cannot ask the print renderer for something
   * absurd. `scale` matches the slider's own range.
   */
  placement: z
    .object({
      x: z.number().min(-5).max(6),
      y: z.number().min(-5).max(6),
      scale: z.number().min(1).max(3),
      // Optional so a basket saved before feathering existed still validates
      // at checkout rather than silently dropping its line.
      feather: z.number().min(0).max(0.5).optional(),
      font: z
        .enum(["SERIF", "ROUNDED", "SANS", "DISPLAY", "HEAVY", "SCRIPT"])
        .optional(),
    })
    .optional(),
  designId: z.string().max(60).optional(),
  text: z.string().max(60).optional(),
  giftWrap: z.boolean().default(false),
});

export const cartInput = z.array(cartLineInput).min(1).max(30);

export type CartLineInput = z.infer<typeof cartLineInput>;

export interface PricedLine {
  product: MentyProduct;
  quantity: number;
  variants: Record<string, string>;
  photoKey?: string;
  /** A ready-made design's id, when the customer chose one instead. */
  designId?: string;
  placement: Placement;
  text?: string;
  giftWrap: boolean;
  unitPriceEUR: number;
  lineTotalEUR: number;
}

export interface PricedCart {
  lines: PricedLine[];
  /** Total units in the basket — what the quantity tier was decided on. */
  units: number;
  /** The tier applied, 0 when none. Shown so the saving is visible. */
  discount: number;
  /** What the same basket would have cost at list price. */
  goodsBeforeDiscountEUR: number;
  goodsEUR: number;
  giftWrapEUR: number;
  deliveryEUR: number;
  totalEUR: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Prices a basket, dropping anything the catalogue does not recognise.
 *
 * Returns null when nothing survives — an empty basket is not an order, and
 * saying so beats creating a zero-value row.
 */
export function priceCart(input: CartLineInput[]): PricedCart | null {
  const lines: PricedLine[] = [];
  const units = input.reduce((n, l) => n + (l.quantity || 0), 0);
  const off = quantityDiscount(units);

  for (const raw of input) {
    const product = productById(raw.productId);
    if (!product) continue;

    // Keep only options the catalogue actually offers on this product, so a
    // hand-edited "Цвят: Златна" cannot reach the print shop.
    const variants: Record<string, string> = {};
    for (const axis of product.variants) {
      const chosen = raw.variants[axis.label];
      variants[axis.label] = axis.options.includes(chosen as string)
        ? (chosen as string)
        : axis.options[0];
    }

    // A product that requires a photo has to have one; without it there is
    // nothing to print.
    if (product.personalization.includes("PHOTO") && !raw.photoKey) continue;

    // Rounded per unit rather than off the line total, so what the customer is
    // shown on the card and what they are charged agree to the cent.
    const unit = round2(product.priceEUR * (1 - off));
    lines.push({
      product,
      quantity: raw.quantity,
      variants,
      photoKey: raw.photoKey,
      designId: raw.designId,
      // A line with a photo always carries a placement, so the print renderer
      // never has to guess: an absent one means "centred, no zoom". The two
      // newer fields are filled from the default for the same reason — a basket
      // saved before they existed must still price, not fail.
      placement: raw.placement
        ? { ...DEFAULT_PLACEMENT, ...raw.placement }
        : DEFAULT_PLACEMENT,
      text: raw.text?.trim() || undefined,
      giftWrap: raw.giftWrap,
      unitPriceEUR: unit,
      lineTotalEUR: round2(unit * raw.quantity),
    });
  }

  if (lines.length === 0) return null;

  const goodsEUR = round2(lines.reduce((s, l) => s + l.lineTotalEUR, 0));
  const goodsBeforeDiscountEUR = round2(
    lines.reduce((s, l) => s + l.product.priceEUR * l.quantity, 0)
  );
  const giftWrapEUR = round2(
    lines.reduce(
      (s, l) => (l.giftWrap ? s + ADDONS.GIFT_WRAP.priceEUR * l.quantity : s),
      0
    )
  );
  const subtotal = round2(goodsEUR + giftWrapEUR);
  // Every catalogue item is a physical thing, so the physical rate applies;
  // POSTER_A4 stands in for "not the digital product" in the shared helper.
  const deliveryEUR = calcDeliveryEUR("POSTER_A4", subtotal);

  return {
    lines,
    units,
    discount: off,
    goodsBeforeDiscountEUR,
    goodsEUR,
    giftWrapEUR,
    deliveryEUR,
    totalEUR: round2(subtotal + deliveryEUR),
  };
}

/** Free-delivery threshold, for the message under the summary. */
export const FREE_DELIVERY_ABOVE = DELIVERY.freeAboveEUR;

/**
 * A short label for the order — what the admin list, the emails and the
 * courier's manifest show instead of a poster's child name.
 */
export function cartLabel(cart: PricedCart): string {
  const [first] = cart.lines;
  const others = cart.lines.length - 1;
  if (others <= 0) return first.product.title;
  return `${first.product.title} и още ${others}`;
}
