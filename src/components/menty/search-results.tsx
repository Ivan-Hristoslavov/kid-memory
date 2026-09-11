"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { ProductCard } from "./bestsellers";
import { DesignedShirt } from "./designed-shirt";
import { formatPrice } from "@/lib/catalog";
import { ALL_PRODUCTS, productById } from "@/lib/shop/products";
import { DESIGNS } from "@/lib/shop/designs";
import { TEXT_DESIGNS } from "@/lib/shop/text-designs";

/**
 * Search over both halves of the catalogue.
 *
 * The dialog searched products only, which on a shop whose range is mostly
 * DESIGNS means most queries found nothing. "кум" matches no product title and
 * six lettering designs; "динозавър" matches no product at all. Two sections,
 * designs first, because a design is what somebody is usually describing.
 *
 * Matching is every-word-must-appear rather than any-word. "детска тениска"
 * should not return every t-shirt; a query with two words is a narrowing, and
 * treating it as a widening is what makes a search feel broken.
 */
function norm(s: string): string {
  return s.toLowerCase().replace(/ё/g, "е");
}

export function SearchResults() {
  const params = useSearchParams();
  const router = useRouter();
  const initial = params.get("q") ?? "";
  const [query, setQuery] = useState(initial);

  const q = norm(initial.trim());
  const words = q.split(/\s+/).filter(Boolean);
  const enough = q.length >= 2;

  const products = enough
    ? ALL_PRODUCTS.filter((p) => {
        const hay = norm(`${p.title} ${p.blurb} ${p.tags.join(" ")}`);
        return words.every((w) => hay.includes(w));
      })
    : [];

  const designs = enough
    ? [
        ...TEXT_DESIGNS.map((d) => ({
          id: d.id,
          title: d.title,
          forDark: d.forDark,
          hay: `${d.title} ${d.lines.join(" ")} ${d.category}`,
        })),
        ...DESIGNS.filter((d) => !d.iconOnly).map((d) => ({
          id: d.id,
          title: d.title,
          forDark: d.forDark,
          hay: `${d.title} ${d.category}`,
        })),
      ].filter((d) => words.every((w) => norm(d.hay).includes(w)))
    : [];

  const total = products.length + designs.length;

  return (
    <>
      <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
        Търсене
      </h1>

      <form
        className="mt-5 flex max-w-xl gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          router.replace(`/tarsene?q=${encodeURIComponent(query.trim())}`);
        }}
      >
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            strokeWidth={1.5}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Кумът, чаша, динозавър…"
            aria-label="Търсене"
            className="h-12 w-full rounded-lg border border-border bg-background pl-10 pr-3.5 text-sm outline-none transition-colors focus:border-foreground/40"
          />
        </div>
        <button
          type="submit"
          className="h-12 shrink-0 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-foreground/85"
        >
          Търси
        </button>
      </form>

      {!enough ? (
        <p className="mt-8 text-muted-foreground">
          Напиши поне две букви — име на продукт, повод или дизайн.
        </p>
      ) : total === 0 ? (
        <div className="mt-8 rounded-xl bg-sand p-10 text-center">
          <p className="font-semibold text-foreground">
            Нищо за „{initial.trim()}“
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Опитай с една дума — „кум“, „чаша“, „гейминг“.
          </p>
        </div>
      ) : (
        <>
          <p className="mt-6 text-sm text-muted-foreground">
            {total} {total === 1 ? "резултат" : "резултата"} за „{initial.trim()}“
          </p>

          {designs.length > 0 && (
            <section className="mt-8">
              <h2 className="font-heading text-xl font-bold tracking-tight">
                Готови тениски
              </h2>
              <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {designs.slice(0, 20).map((d) => {
                  const p = productById(`t-${d.id}`);
                  return (
                    <li key={d.id}>
                      <Link
                        href={`/produkt/t-${d.id}`}
                        className="group block overflow-hidden rounded-2xl bg-card ring-1 ring-border transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-forest/10"
                      >
                        <span className="block bg-gradient-to-b from-ivory to-sand p-2">
                          <DesignedShirt
                            designId={d.id}
                            colorHex={d.forDark ? "#1B1B1B" : "#E8E8E8"}
                          />
                        </span>
                        <span className="block p-3 text-center">
                          <span className="block text-sm font-medium text-foreground">
                            {d.title}
                          </span>
                          {p && (
                            <span className="mt-0.5 block text-sm font-semibold text-foreground">
                              {formatPrice(p.priceEUR)}
                            </span>
                          )}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {products.length > 0 && (
            <section className="mt-12">
              <h2 className="font-heading text-xl font-bold tracking-tight">
                Продукти
              </h2>
              <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {products.map((p) => (
                  <li key={p.id}>
                    <ProductCard product={p} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </>
  );
}
