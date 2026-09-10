"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { productById } from "@/lib/shop/products";
import type { Placement } from "@/lib/shop/placement";

/**
 * The basket.
 *
 * The poster shop never had one — it sold a single made-to-order item and went
 * straight from preview to checkout. A catalogue of a hundred products needs a
 * basket, so this is the first piece of that: client state only, with checkout
 * still to come.
 *
 * `localStorage` rather than the wizard's `sessionStorage`. A half-filled
 * wizard is a draft that should not follow you into a new visit, but an
 * abandoned basket is the opposite — coming back tomorrow and finding the mug
 * still in it is the behaviour people expect from a shop.
 *
 * A line is identified by product AND its chosen variants and personalisation:
 * two mugs with different photographs are two lines, not a quantity of two.
 */
export interface CartLine {
  /** Stable key derived from the product and everything chosen on it. */
  key: string;
  productId: string;
  quantity: number;
  /** Chosen variant options, keyed by axis label: { "Цвят": "Бяла" }. */
  variants: Record<string, string>;
  /** Storage key of an uploaded photo, when the product takes one. */
  photoKey?: string;
  /**
   * A ready-made design from `lib/shop/designs.ts`, when the customer chose one
   * instead of uploading.
   *
   * Mutually exclusive with `photoKey` in practice — the panel offers one or
   * the other — but stored separately rather than as a tagged union, because
   * the print renderer resolves them from different places: a design is a file
   * we ship, a photo is a private object in storage.
   */
  designId?: string;
  /**
   * Where the customer put that photo inside the print area. Stored as a
   * transform rather than a cropped file so the print can be re-rendered from
   * the original upload at full resolution.
   */
  placement?: Placement;
  /** Customer's own line of text, when the product takes one. */
  text?: string;
  giftWrap: boolean;
}

/** Everything that makes two lines of the same product distinct. */
function lineKey(input: Omit<CartLine, "key" | "quantity">): string {
  const variants = Object.entries(input.variants)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("|");
  const placement = input.placement
    ? `${input.placement.x.toFixed(3)},${input.placement.y.toFixed(3)},${input.placement.scale.toFixed(3)}`
    : "";
  return [
    input.productId,
    variants,
    input.photoKey ?? "",
    input.designId ?? "",
    placement,
    input.text ?? "",
    input.giftWrap ? "wrap" : "",
  ].join("::");
}

interface CartState {
  lines: CartLine[];
  add: (line: Omit<CartLine, "key">) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],

      add: (line) =>
        set((s) => {
          const key = lineKey(line);
          const existing = s.lines.find((l) => l.key === key);
          if (existing) {
            return {
              lines: s.lines.map((l) =>
                l.key === key ? { ...l, quantity: l.quantity + line.quantity } : l
              ),
            };
          }
          return { lines: [...s.lines, { ...line, key }] };
        }),

      setQuantity: (key, quantity) =>
        set((s) => ({
          lines:
            quantity <= 0
              ? s.lines.filter((l) => l.key !== key)
              : s.lines.map((l) => (l.key === key ? { ...l, quantity } : l)),
        })),

      remove: (key) => set((s) => ({ lines: s.lines.filter((l) => l.key !== key) })),
      clear: () => set({ lines: [] }),
    }),
    {
      name: "menty-cart",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
);

/** Total item count, for the header badge. */
export function cartCount(lines: readonly CartLine[]): number {
  return lines.reduce((n, l) => n + l.quantity, 0);
}

/**
 * Goods subtotal in EUR.
 *
 * Prices come from the catalogue rather than from the stored line, so a price
 * change is picked up on the next render instead of being frozen into whatever
 * the basket happened to record — the server will price the order again at
 * checkout regardless, and a basket that disagrees with that is worse than one
 * that simply follows the catalogue.
 */
export function cartSubtotalEUR(lines: readonly CartLine[]): number {
  const total = lines.reduce((sum, l) => {
    const product = productById(l.productId);
    return product ? sum + product.priceEUR * l.quantity : sum;
  }, 0);
  return Math.round(total * 100) / 100;
}
