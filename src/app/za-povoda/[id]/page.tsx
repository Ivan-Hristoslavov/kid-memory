import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MentyHeader } from "@/components/menty/header";
import { MentyFooter } from "@/components/menty/footer";
import { ProductCard } from "@/components/menty/bestsellers";
import { GIFT_AUDIENCES, GIFT_OCCASIONS } from "@/lib/brand";
import { byTag } from "@/lib/shop/products";
import { DESIGNS } from "@/lib/shop/designs";
import { TEXT_DESIGNS } from "@/lib/shop/text-designs";
import { productById } from "@/lib/shop/products";
import { DesignedShirt } from "@/components/menty/designed-shirt";
import { formatPrice } from "@/lib/catalog";

/** Two rails point here: an audience, or an occasion. Themes moved to /dizaini. */
const COLLECTIONS = [...GIFT_AUDIENCES, ...GIFT_OCCASIONS];

/** Ids are duplicated across the two rails (birthday appears in both). */
function collectionById(id: string) {
  return COLLECTIONS.find((c) => c.id === id);
}

/**
 * Which design categories an occasion sells shirts from.
 *
 * Only where it is genuinely true. A birthday does not have a uniform; a stag
 * weekend does, and so does the wedding it precedes.
 */
const SHIRT_CATEGORIES: Partial<Record<string, string[]>> = {
  wedding: ["BACHELOR", "HEN"],
};

export function generateStaticParams() {
  return [...new Set(COLLECTIONS.map((c) => c.id))].map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const c = collectionById(id);
  if (!c) return { title: "Колекцията не е намерена" };
  return {
    title: `Подаръци ${c.label.toLowerCase()}`,
    description: `Персонализирани подаръци ${c.label.toLowerCase()} — със снимка, име или послание.`,
    alternates: { canonical: `/za-povoda/${c.id}` },
  };
}

/**
 * A collection page.
 *
 * Filtering is by the hand-assigned tags in the catalogue rather than anything
 * inferred: which mug suits a colleague and which suits a partner is a
 * merchandising judgement, and guessing it from the product family would put a
 * christening gift in front of somebody shopping for their boss.
 */
export default async function CollectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const collection = collectionById(id);
  if (!collection) notFound();

  const items = byTag(collection.id);
  /**
   * Ready-made shirts that belong to this occasion.
   *
   * "Подаръци сватба" was showing a mug with two dogs on it and an enamel cup
   * with a campfire, because the only thing connecting a product to a
   * collection was a hand-assigned tag on the BLANK — and a blank has no
   * occasion, it is a blank. What a wedding page should open with is the
   * shirts: the groom's, the best man's, the bride's party. Those exist now as
   * products, and this is where they were missing from.
   */
  const shirts = SHIRT_CATEGORIES[collection.id]
    ? [
        ...TEXT_DESIGNS.filter((d) =>
          SHIRT_CATEGORIES[collection.id]!.includes(d.category)
        ).map((d) => ({ id: d.id, title: d.title, forDark: d.forDark })),
        ...DESIGNS.filter(
          (d) => !d.iconOnly && SHIRT_CATEGORIES[collection.id]!.includes(d.category)
        ).map((d) => ({ id: d.id, title: d.title, forDark: d.forDark })),
      ]
    : [];

  return (
    <>
      <MentyHeader />
      <main className="flex-1">
        {/* An editorial band rather than a heading on a coloured strip.
            Moonpig and Papier both arrange a catalogue well and neither looks
            like anything; a collection page that opens with a photograph and
            lets the type sit inside it is the difference between a catalogue
            and a shop worth buying from. The scrim is a gradient rather than a
            flat overlay so the image stays an image. */}
        <section className="relative isolate overflow-hidden border-b border-border">
          <Image
            src={collection.image}
            alt=""
            fill
            priority
            sizes="100vw"
            className="-z-10 object-cover"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-forest/90 via-forest/70 to-forest/20" />
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ivory/70">
              Подаръци за повода
            </p>
            <h1 className="mt-3 max-w-2xl font-heading text-4xl font-bold tracking-tight text-ivory sm:text-5xl">
              {collection.label}
            </h1>
            <p className="mt-3 max-w-xl text-ivory/85">
              {shirts.length > 0
                ? `${shirts.length} готови тениски и ${items.length} продукта за персонализиране.`
                : `${items.length} ${
                    items.length === 1 ? "продукт" : "продукта"
                  }, всеки от които може да носи снимка, име или послание.`}
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          {shirts.length > 0 && (
            <section className="mb-14">
              <h2 className="font-heading text-xl font-bold tracking-tight sm:text-2xl">
                Готови тениски
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                За младоженеца, кума, булката и цялата компания. Много от тях
                приемат име.
              </p>
              <ul className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {shirts.slice(0, 15).map((d) => (
                  <li key={d.id}>
                    <Link
                      href={`/produkt/t-${d.id}`}
                      className="group block overflow-hidden rounded-xl ring-1 ring-border transition-shadow hover:shadow-lg"
                    >
                      <div className="bg-gradient-to-b from-ivory to-sand p-3">
                        <DesignedShirt
                          designId={d.id}
                          colorHex={d.forDark ? "#1B1B1B" : "#E8E8E8"}
                        />
                      </div>
                      <div className="bg-background p-3 text-center">
                        <p className="text-sm font-medium text-foreground">
                          {d.title}
                        </p>
                        <p className="mt-0.5 text-sm font-semibold text-foreground">
                          {formatPrice(productById(`t-${d.id}`)?.priceEUR ?? 0)}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href="/dizaini/bachelor"
                className="mt-5 inline-block text-sm font-semibold text-foreground/70 transition-colors hover:text-foreground"
              >
                Виж всички за ергенско и моминско →
              </Link>
            </section>
          )}

          {shirts.length > 0 && items.length > 0 && (
            <h2 className="mb-5 font-heading text-xl font-bold tracking-tight sm:text-2xl">
              За персонализиране
            </h2>
          )}

          {items.length === 0 && shirts.length === 0 ? (
            <div className="rounded-xl bg-sand p-12 text-center ring-1 ring-border">
              <p className="text-muted-foreground">
                Още подбираме подаръците за този повод.
              </p>
              <Link
                href="/produkti"
                className="mt-4 inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground"
              >
                Виж всички продукти
              </Link>
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {items.map((p) => (
                <li key={p.id}>
                  <ProductCard product={p} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
      <MentyFooter />
    </>
  );
}
