import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/catalog";
import { productById } from "@/lib/shop/products";
import { DesignedShirt } from "./designed-shirt";

/**
 * The same design, on something else.
 *
 * This is the one thing a card shop cannot do and we can. Moonpig's design IS
 * the product — a birthday card with a dog on it is one SKU, and wanting the dog
 * on a mug is a different search. Here a design is an attribute of any of
 * twenty-seven products, and saying so turns one decision ("I like this") into
 * a choice of price point rather than a dead end.
 *
 * It needs no new routes and no new products. `/produkt/<blank>?design=<id>`
 * already puts a chosen design into the editor on any blank that takes artwork,
 * which is machinery that has existed since the design catalogue was built —
 * this only makes it visible at the moment somebody is deciding.
 */

/** One per shelf, cheapest first, so the row reads as a price ladder. */
const ALTERNATIVES = [
  "photo-mug-330",
  "organic-tote",
  "organic-hoodie",
  "dad-hat",
  "photo-stickers",
  "photo-poster-paper",
];

export function SameDesignOn({
  designId,
  exclude,
}: {
  designId: string;
  /** The product already being looked at. */
  exclude: string;
}) {
  const items = ALTERNATIVES.flatMap((id) => {
    const p = productById(id);
    return p && p.id !== exclude && p.printArea && p.images[0] ? [p] : [];
  });
  if (items.length === 0) return null;

  return (
    <section className="mt-14 border-t border-border pt-10">
      <h2 className="font-heading text-xl font-bold tracking-tight">
        Същият дизайн върху
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Избираш продукта, дизайнът идва с теб.
      </p>

      <ul className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {items.map((p) => (
          <li key={p.id}>
            <Link
              href={`/produkt/${p.id}?design=${designId}`}
              className="group block overflow-hidden rounded-2xl bg-card ring-1 ring-border transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-forest/10"
            >
              <span className="relative block aspect-square bg-gradient-to-b from-ivory to-sand">
                <Image
                  src={p.images[0]}
                  alt={p.title}
                  fill
                  sizes="(max-width: 640px) 50vw, 180px"
                  className="object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                />
              </span>
              <span className="block p-3 text-center">
                <span className="block text-sm font-medium text-foreground">
                  {p.title}
                </span>
                <span className="mt-0.5 block text-sm font-semibold text-foreground">
                  {formatPrice(p.priceEUR)}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Other designs from the same world, as finished shirts.
 *
 * Somebody looking at "Кумът" is buying for a stag weekend and needs five more
 * shirts, not one. The row exists to say the rest of the set is here — which is
 * also the quickest route to the quantity discount.
 */
export function MoreFromCategory({
  designs,
  exclude,
}: {
  designs: { id: string; title: string; forDark: boolean }[];
  exclude: string;
}) {
  const rest = designs.filter((d) => d.id !== exclude).slice(0, 6);
  if (rest.length === 0) return null;

  return (
    <section className="mt-14 border-t border-border pt-10">
      <h2 className="font-heading text-xl font-bold tracking-tight">
        За същата компания
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        4 броя −10%, 6 броя −15%. Размерите и имената може да са различни.
      </p>

      <ul className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {rest.map((d) => {
          const product = productById(`t-${d.id}`);
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
                  {product && (
                    <span className="mt-0.5 block text-sm font-semibold text-foreground">
                      {formatPrice(product.priceEUR)}
                    </span>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
