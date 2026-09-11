"use client";

import { useState } from "react";
import { ArrowUpDown } from "lucide-react";
import { ProductCard } from "./bestsellers";
import { formatPrice } from "@/lib/catalog";
import type { MentyProduct, ProductGroup } from "@/lib/shop/products";

/**
 * Sorting and price filtering over the whole catalogue.
 *
 * The page groups by shelf, which is the right default — somebody browsing is
 * choosing a KIND of thing first. But a shopper with a budget cannot use a
 * grouped page at all: "a shirt under twenty" means reading nine sections and
 * doing the comparison by hand, and the competition simply has a dropdown.
 *
 * So sorting flattens. Choosing "най-евтини" is saying the shelves no longer
 * matter, and keeping them would leave the cheapest item in section seven.
 * The grouped view returns the moment sorting goes back to default, because
 * that is what the control means.
 *
 * State is local rather than in the URL. A sort order is a glance, not a
 * destination — nobody shares "products, sorted by price ascending" — and
 * putting it in the URL would make every combination a crawlable near-duplicate
 * of the same twenty-seven items.
 */

type Sort = "default" | "price-asc" | "price-desc";

const SORTS: { id: Sort; label: string }[] = [
  { id: "default", label: "По категория" },
  { id: "price-asc", label: "Най-евтини" },
  { id: "price-desc", label: "Най-скъпи" },
];

export function ProductBrowser({
  groups,
}: {
  groups: { id: ProductGroup; label: string; blurb: string; items: MentyProduct[] }[];
}) {
  const [sort, setSort] = useState<Sort>("default");
  const [maxPrice, setMaxPrice] = useState<number | null>(null);

  const all = groups.flatMap((g) => g.items);
  const ceilings = [15, 20, 30];

  const matches = (p: MentyProduct) => maxPrice === null || p.priceEUR <= maxPrice;
  const filtered = all.filter(matches);

  const sorted =
    sort === "price-asc"
      ? [...filtered].sort((a, b) => a.priceEUR - b.priceEUR)
      : sort === "price-desc"
        ? [...filtered].sort((a, b) => b.priceEUR - a.priceEUR)
        : null;

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <ArrowUpDown className="size-3.5" strokeWidth={1.5} /> Подреди
        </span>
        {SORTS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSort(s.id)}
            aria-pressed={sort === s.id}
            className={`h-9 rounded-full border px-3.5 text-sm font-medium transition-colors ${
              sort === s.id
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-background text-foreground/75 hover:border-foreground/40"
            }`}
          >
            {s.label}
          </button>
        ))}

        <span className="ml-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          До
        </span>
        {ceilings.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setMaxPrice(maxPrice === c ? null : c)}
            aria-pressed={maxPrice === c}
            className={`h-9 rounded-full border px-3.5 text-sm font-medium transition-colors ${
              maxPrice === c
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-background text-foreground/75 hover:border-foreground/40"
            }`}
          >
            {formatPrice(c)}
          </button>
        ))}
        {maxPrice !== null && (
          <button
            type="button"
            onClick={() => setMaxPrice(null)}
            className="h-9 px-2 text-sm font-medium text-muted-foreground underline-offset-2 hover:underline"
          >
            Изчисти
          </button>
        )}
      </div>

      {sorted ? (
        <>
          <p className="mt-6 text-sm text-muted-foreground">
            {sorted.length} {sorted.length === 1 ? "продукт" : "продукта"}
          </p>
          <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {sorted.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        </>
      ) : (
        groups
          .map((g) => ({ ...g, items: g.items.filter(matches) }))
          .filter((g) => g.items.length > 0)
          .map((group) => (
            <section
              key={group.id}
              id={group.id.toLowerCase()}
              className="mt-12 scroll-mt-28 sm:mt-16"
            >
              <h2 className="font-heading text-xl font-bold tracking-tight sm:text-2xl">
                {group.label}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{group.blurb}</p>
              <ul className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {group.items.map((p) => (
                  <li key={p.id}>
                    <ProductCard product={p} />
                  </li>
                ))}
              </ul>
            </section>
          ))
      )}

      {filtered.length === 0 && (
        <p className="mt-10 rounded-xl bg-sand p-10 text-center text-muted-foreground">
          Няма продукти под {maxPrice !== null ? formatPrice(maxPrice) : ""}.
        </p>
      )}
    </>
  );
}
