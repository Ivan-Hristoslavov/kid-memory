"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { formatPrice } from "@/lib/catalog";
import { ALL_PRODUCTS, hasImages } from "@/lib/shop/products";
import { GIFT_AUDIENCES, GIFT_OCCASIONS } from "@/lib/brand";

/**
 * Catalogue search.
 *
 * Client-side and instant, because the catalogue is a static list held in the
 * bundle already — a round trip per keystroke would be slower and buy nothing.
 * It moves to the server the day the catalogue moves to the database.
 *
 * Matching is deliberately loose: title, blurb, product family and the
 * collection labels a product is tagged with, so "рожден ден" finds the mug
 * even though the word appears nowhere in its name.
 */
const LABELS = new Map<string, string>(
  [...GIFT_AUDIENCES, ...GIFT_OCCASIONS].map((c) => [c.id as string, c.label as string])
);

function haystack(id: string): string {
  const p = ALL_PRODUCTS.find((x) => x.id === id)!;
  return [
    p.title,
    p.blurb,
    ...p.variants.flatMap((v) => v.options),
    ...p.tags.map((t) => LABELS.get(t) ?? t),
  ]
    .join(" ")
    .toLowerCase();
}

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    // Stop the page behind the overlay from scrolling with it.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const words = q.split(/\s+/);
    return ALL_PRODUCTS.filter((p) => {
      const hay = haystack(p.id);
      return words.every((w) => hay.includes(w));
    }).slice(0, 8);
  }, [query]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Търсене"
      className="fixed inset-0 z-[60] flex items-start justify-center bg-forest/40 p-4 backdrop-blur-sm sm:p-10"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-xl overflow-hidden rounded-xl bg-background shadow-2xl ring-1 ring-border">
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="size-5 shrink-0 text-muted-foreground" strokeWidth={1.5} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Търси чаша, тениска, повод…"
            className="h-14 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Затвори търсенето"
            className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {query.trim().length < 2 ? (
            <p className="p-6 text-sm text-muted-foreground">
              Напиши поне две букви.
            </p>
          ) : results.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              Нищо не съвпада с „{query}“.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {results.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/produkt/${p.id}`}
                    onClick={onClose}
                    className="flex items-center gap-3 p-3 transition-colors hover:bg-muted"
                  >
                    <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-sand ring-1 ring-border">
                      {hasImages(p) && (
                        <Image src={p.images[0]} alt="" fill sizes="48px" className="object-cover" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{p.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {p.blurb}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold">
                      {formatPrice(p.priceEUR)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {/* Out of the dialog and onto a page with a URL. The dialog shows
              eight products; the page searches the designs too, which on a shop
              whose range is mostly designs is where most queries belong. */}
          {query.trim().length >= 2 && (
            <div className="border-t border-border p-3">
              <Link
                href={`/tarsene?q=${encodeURIComponent(query.trim())}`}
                onClick={onClose}
                className="block rounded-lg px-3 py-2 text-sm font-semibold text-forest transition-colors hover:bg-muted"
              >
                Виж всички резултати за „{query.trim()}“ →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
