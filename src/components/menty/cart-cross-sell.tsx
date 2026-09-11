"use client";

import Image from "next/image";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/catalog";
import { useCart } from "@/lib/store/cart";
import { productById } from "@/lib/shop/products";

/**
 * The last, cheapest thing to offer, at the warmest moment there is.
 *
 * Somebody looking at their own basket has already decided to buy. Everything
 * upstream of here worked to get them to this state and then the page said
 * nothing — which on a shop with a four-item quantity tier is money left where
 * it fell.
 *
 * Three rules, and they are what separate a useful row from an annoying one:
 *
 *   - Only cheap things. The point is a yes without a reconsideration, so
 *     nothing here costs more than a few euro. A thirty-euro hoodie offered at
 *     checkout is a reason to go back and rethink the whole basket.
 *   - Nothing that needs personalising. An item that sends somebody back into
 *     an editor is not an add-on, it is a detour, and the basket they were one
 *     click from confirming is now abandoned.
 *   - Nothing already in the basket.
 */
const OFFERS = ["gift-box", "photo-stickers"];

export function CartCrossSell({ inCart }: { inCart: string[] }) {
  const add = useCart((s) => s.add);

  const items = OFFERS.flatMap((id) => {
    const p = productById(id);
    return p && !inCart.includes(id) && p.images[0] ? [p] : [];
  });
  if (items.length === 0) return null;

  return (
    <section className="mt-10 border-t border-border pt-8">
      <h2 className="font-heading text-lg font-bold tracking-tight">
        Добави и това
      </h2>
      <p className="mt-1 text-base text-muted-foreground">
        Дребни неща, които правят подаръка завършен.
      </p>

      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {items.map((p) => (
          <li
            key={p.id}
            className="flex items-center gap-4 rounded-xl bg-sand p-3 ring-1 ring-border"
          >
            <span className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-background">
              <Image
                src={p.images[0]}
                alt=""
                fill
                sizes="64px"
                className="object-contain p-1"
              />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-foreground">
                {p.title}
              </span>
              <span className="block text-sm text-muted-foreground">
                {formatPrice(p.priceEUR)}
              </span>
            </span>
            <button
              type="button"
              onClick={() => {
                add({
                  productId: p.id,
                  quantity: 1,
                  // First option on every axis: an add-on that asks a question
                  // has stopped being an add-on.
                  variants: Object.fromEntries(
                    p.variants.map((v) => [v.label, v.options[0]])
                  ),
                  giftWrap: false,
                });
                toast.success(`${p.title} е добавен`);
              }}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-foreground px-3 text-sm font-semibold text-background transition-colors hover:bg-foreground/85"
            >
              <Plus className="size-4" strokeWidth={2} /> Добави
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
