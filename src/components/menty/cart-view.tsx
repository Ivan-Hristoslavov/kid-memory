"use client";

import { useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Gift, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import {
  ADDONS,
  DELIVERY,
  addonPriceEUR,
  calcDeliveryEUR,
  formatPrice,
} from "@/lib/catalog";
import { cartSubtotalEUR, cartUnits, useCart, type CartLine } from "@/lib/store/cart";
import { nextTier, quantityDiscount } from "@/lib/shop/quantity";
import { hasImages, productById } from "@/lib/shop/products";

/**
 * The basket.
 *
 * Rendered from the store through useSyncExternalStore with an empty server
 * snapshot, for the same reason as the header badge: the contents live in
 * localStorage, the server cannot know them, and saying so explicitly is
 * better than hydrating into a mismatch.
 *
 * Money is computed with the shop's existing helpers rather than re-derived
 * here. `addonPriceEUR` in particular must never be replaced by reading
 * `ADDONS[id].priceEUR` — percentage add-ons carry a zero base and a direct
 * read silently prices them at nothing.
 */
export function CartView() {
  const lines = useSyncExternalStore(
    useCart.subscribe,
    () => useCart.getState().lines,
    () => EMPTY
  );
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);

  if (lines.length === 0) {
    return (
      <div className="mt-10 flex flex-col items-center gap-4 rounded-xl bg-sand py-16 text-center ring-1 ring-border">
        <ShoppingBag className="size-8 text-forest/40" strokeWidth={1.5} />
        <p className="text-muted-foreground">Количката ти е празна.</p>
        <Link
          href="/produkti"
          className="mt-2 inline-flex h-12 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-foreground/85"
        >
          Разгледай продуктите
          <ArrowRight className="size-4" />
        </Link>
      </div>
    );
  }

  const goods = cartSubtotalEUR(lines);
  const wrapTotal = lines.reduce(
    (sum, l) => (l.giftWrap ? sum + ADDONS.GIFT_WRAP.priceEUR * l.quantity : sum),
    0
  );
  const units = cartUnits(lines);
  const off = quantityDiscount(units);
  const listPrice = lines.reduce((sum, l) => {
    const p = productById(l.productId);
    return p ? sum + p.priceEUR * l.quantity : sum;
  }, 0);
  const saved = Math.round((listPrice - goods) * 100) / 100;
  const up = nextTier(units);

  const subtotal = Math.round((goods + wrapTotal) * 100) / 100;
  // Nothing in this basket is a digital file, so delivery is always the
  // physical rate; POSTER_A4 stands in for "a physical product" here.
  const delivery = calcDeliveryEUR("POSTER_A4", subtotal);
  const total = Math.round((subtotal + delivery) * 100) / 100;

  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_20rem] lg:gap-14">
      <ul className="divide-y divide-border border-y border-border">
        {lines.map((line) => (
          <CartRow
            key={line.key}
            line={line}
            onQuantity={(q) => setQuantity(line.key, q)}
            onRemove={() => remove(line.key)}
          />
        ))}
      </ul>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="rounded-xl bg-sand p-6 ring-1 ring-border">
          <h2 className="font-heading text-lg font-bold">Обобщение</h2>
          <dl className="mt-4 space-y-2.5 text-sm">
            <Row label="Продукти" value={formatPrice(goods)} />
            {off > 0 && (
              <Row
                label={`Отстъпка за ${units} броя (−${Math.round(off * 100)}%)`}
                value={`−${formatPrice(saved)}`}
              />
            )}
            {wrapTotal > 0 && (
              <Row label="Подаръчна опаковка" value={formatPrice(wrapTotal)} />
            )}
            <Row
              label="Доставка"
              value={delivery === 0 ? "Безплатна" : formatPrice(delivery)}
            />
            <div className="border-t border-border pt-2.5">
              <Row label="Общо" value={formatPrice(total)} strong />
            </div>
          </dl>

          {/* The nudge is the point of the tier. Somebody buying four shirts
              for a hen weekend is usually buying six. */}
          {up && (
            <p className="mt-3 rounded-lg bg-forest/8 p-3 text-xs text-forest">
              Още {up.from - units}{" "}
              {up.from - units === 1 ? "продукт" : "продукта"} и отстъпката става{" "}
              {Math.round(up.off * 100)}%.
            </p>
          )}

          {delivery > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              Безплатна доставка над {formatPrice(DELIVERY.freeAboveEUR)}.
            </p>
          )}

          <Link
            href="/plashtane"
            className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-foreground/85"
          >
            Към плащане
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </aside>
    </div>
  );
}

/** Stable empty array — a new [] each call would loop useSyncExternalStore. */
const EMPTY: readonly CartLine[] = [];

function Row({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className={strong ? "font-semibold text-foreground" : "text-muted-foreground"}>
        {label}
      </dt>
      <dd className={strong ? "text-base font-semibold" : "font-medium text-foreground"}>
        {value}
      </dd>
    </div>
  );
}

function CartRow({
  line,
  onQuantity,
  onRemove,
}: {
  line: CartLine;
  onQuantity: (q: number) => void;
  onRemove: () => void;
}) {
  const product = productById(line.productId);

  // A line whose product has left the catalogue: show it and let it be removed
  // rather than dropping it silently from a basket somebody filled.
  if (!product) {
    return (
      <li className="flex items-center justify-between gap-4 py-5">
        <span className="text-sm text-muted-foreground">
          Този продукт вече не се предлага.
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="text-sm font-medium text-destructive"
        >
          Премахни
        </button>
      </li>
    );
  }

  const variants = Object.entries(line.variants);

  return (
    <li className="flex gap-4 py-5">
      <Link
        href={`/produkt/${product.id}`}
        className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-sand ring-1 ring-border sm:size-24"
      >
        {hasImages(product) && (
          <Image
            src={product.images[0]}
            alt=""
            fill
            sizes="96px"
            className="object-cover"
          />
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <Link
          href={`/produkt/${product.id}`}
          className="text-sm font-semibold text-foreground hover:underline"
        >
          {product.title}
        </Link>

        {variants.length > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            {variants.map(([k, v]) => `${k}: ${v}`).join(" · ")}
          </p>
        )}
        {line.text && (
          <p className="mt-1 truncate text-xs text-muted-foreground">
            Текст: „{line.text}“
          </p>
        )}
        {line.photoKey && (
          <p className="mt-1 text-xs text-muted-foreground">Със своя снимка</p>
        )}
        {line.giftWrap && (
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Gift className="size-3" strokeWidth={1.5} /> Подаръчна опаковка +
            {formatPrice(addonPriceEUR("GIFT_WRAP", "POSTER_A4"))}
          </p>
        )}

        <div className="mt-3 flex items-center gap-3">
          <div className="flex h-9 items-center rounded-lg border border-border">
            <button
              type="button"
              onClick={() => onQuantity(line.quantity - 1)}
              aria-label="По-малко"
              className="grid size-8 place-items-center text-foreground/70 hover:text-foreground"
            >
              <Minus className="size-3.5" />
            </button>
            <span className="w-6 text-center text-sm font-semibold">{line.quantity}</span>
            <button
              type="button"
              onClick={() => onQuantity(Math.min(20, line.quantity + 1))}
              aria-label="Повече"
              className="grid size-8 place-items-center text-foreground/70 hover:text-foreground"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Премахни ${product.title}`}
            className="grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
          >
            <Trash2 className="size-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <p className="shrink-0 text-sm font-semibold text-foreground">
        {formatPrice(Math.round(product.priceEUR * line.quantity * 100) / 100)}
      </p>
    </li>
  );
}
