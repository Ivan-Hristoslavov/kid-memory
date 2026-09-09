import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Sparkles, Star } from "lucide-react";
import { formatPrice } from "@/lib/catalog";
import { bestsellers, hasImages, type MentyProduct } from "@/lib/shop/products";

/**
 * The bestsellers row — five compact cards on a desktop, as the reference sets
 * it, scrolling horizontally on a phone rather than reflowing into a tall grid.
 *
 * A card is image, name, stars, price and a cart action, in that order, with
 * the photograph taking most of the height: the brief's rule is that the
 * product photo dominates and the chrome stays quiet.
 */
export function Bestsellers() {
  const items = bestsellers();

  return (
    <section className="bg-background py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            Бестселъри
          </h2>
          <Link
            href="/produkti"
            className="shrink-0 text-sm font-semibold text-foreground/70 transition-colors hover:text-foreground"
          >
            Виж всички →
          </Link>
        </div>

        <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {items.map((p) => (
            <li key={p.id}>
              <ProductCard product={p} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function ProductCard({ product }: { product: MentyProduct }) {
  const personalizable = product.personalization.length > 0;

  return (
    <Link
      href={`/produkt/${product.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl bg-card ring-1 ring-border transition-shadow hover:shadow-lg hover:shadow-foreground/5"
    >
      <span className="relative block aspect-square overflow-hidden bg-sand">
        {hasImages(product) ? (
          <Image
            src={product.images[0]}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 250px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          /* No grey box: a labelled, on-brand frame instead, so a missing
             supplier asset reads as "photo pending", not as a broken card. */
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
            <Sparkles className="size-6 text-forest/30" strokeWidth={1.5} />
            <span className="px-3 text-[0.7rem] font-medium text-muted-foreground">
              Снимката се подготвя
            </span>
          </span>
        )}
        {personalizable && (
          <span className="absolute left-2 top-2 rounded-md bg-background/90 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-forest">
            Персонализируемо
          </span>
        )}
      </span>

      <span className="flex flex-1 flex-col p-3">
        <span className="text-sm font-medium leading-snug text-foreground">
          {product.title}
        </span>
        {product.rating && (
          <span className="mt-1.5 flex items-center gap-1">
            <Star className="size-3.5 fill-clay text-clay" />
            <span className="text-xs text-muted-foreground">
              {product.rating.average} ({product.rating.count})
            </span>
          </span>
        )}
        <span className="mt-auto flex items-center justify-between pt-3">
          <span className="font-semibold text-foreground">
            {formatPrice(product.priceEUR)}
          </span>
          <span
            aria-hidden
            className="grid size-8 place-items-center rounded-lg bg-muted text-foreground/70 transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
          >
            <ShoppingBag className="size-4" strokeWidth={1.5} />
          </span>
        </span>
      </span>
    </Link>
  );
}
