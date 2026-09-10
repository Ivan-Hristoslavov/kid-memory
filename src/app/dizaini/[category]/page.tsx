import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { MentyHeader } from "@/components/menty/header";
import { MentyFooter } from "@/components/menty/footer";
import {
  DESIGN_CATEGORIES,
  designImage,
  designsInCategory,
  type DesignCategory,
} from "@/lib/shop/designs";
import { TEXT_DESIGNS } from "@/lib/shop/text-designs";
import { TextDesignArt } from "@/components/menty/text-design-art";
import { ALL_PRODUCTS, byTag } from "@/lib/shop/products";
import { ProductCard } from "@/components/menty/bestsellers";
import { formatPrice } from "@/lib/catalog";

export function generateStaticParams() {
  return DESIGN_CATEGORIES.map((c) => ({ category: c.id.toLowerCase() }));
}

/** The list above is every category, so anything else is a dead URL. */
export const dynamicParams = false;

/**
 * Which product tag matches a design category. Only some have one — a category
 * without a tag simply shows no product row, which is the right failure.
 */
const SUITED_TAG: Partial<Record<string, string>> = {
  GAMING: "theme-gaming",
  BACHELOR: "theme-bachelor",
  HEN: "theme-couples",
  PETS: "theme-kids",
  HOLIDAY: "theme-birthday",
  PROFESSION: "theme-office",
};

function metaFor(slug: string) {
  return DESIGN_CATEGORIES.find((c) => c.id.toLowerCase() === slug);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const c = metaFor(category);
  if (!c) return { title: "Категорията не е намерена" };
  return {
    title: `Дизайни — ${c.label}`,
    description: `${c.blurb} ${
      designsInCategory(c.id).length +
      TEXT_DESIGNS.filter((t) => t.category === c.id).length
    } готови дизайна за тениски, суичъри и чаши.`,
    alternates: { canonical: `/dizaini/${category}` },
  };
}

/**
 * One category of designs.
 *
 * Every tile links straight into a product with the design already chosen, so
 * the path from "I want that" to a basket is one click rather than a hunt for
 * where to apply it. The product it links to is the cheapest one that takes a
 * photo — the t-shirt, in practice — because that is the least committing place
 * to land, and the panel lets them change product afterwards.
 */
export default async function DesignCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const meta = metaFor(category);
  if (!meta) notFound();

  const designs = designsInCategory(meta.id as DesignCategory);
  const words = TEXT_DESIGNS.filter((t) => t.category === meta.id);
  /**
   * The products that suit this world.
   *
   * This is where the theme collections went. They used to be a parallel set of
   * collection pages that duplicated these categories; the hand-assigned tags
   * survived, and doing this job is a better use of them than running a second
   * navigation system.
   */
  const suited = byTag(SUITED_TAG[meta.id] ?? "");
  /**
   * Where a design tile lands.
   *
   * The cheapest product that takes artwork is a 3.49 sticker, and sending
   * somebody who wants a raid crest to a sticker undersells the whole page. The
   * adult unisex t-shirt is what these designs are for, so that is the landing,
   * and the panel lets them change product from there.
   */
  const landing =
    ALL_PRODUCTS.find((p) => p.id === "premium-tee-stanley-stella") ??
    ALL_PRODUCTS.find((p) => p.personalization.includes("PHOTO") && p.printArea);

  return (
    <>
      <MentyHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <nav aria-label="Пътека" className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/" className="transition-colors hover:text-foreground">
              Начало
            </Link>
            <ChevronRight className="size-3" />
            <Link href="/dizaini" className="transition-colors hover:text-foreground">
              Дизайни
            </Link>
            <ChevronRight className="size-3" />
            <span className="text-foreground">{meta.label}</span>
          </nav>

          <h1 className="mt-6 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            {meta.label}
          </h1>
          <p className="mt-2 text-muted-foreground">{meta.blurb}</p>
          {landing && (
            <p className="mt-1 text-sm text-muted-foreground">
              Върху тениска от {formatPrice(landing.priceEUR)}, или върху суичър,
              чаша, чанта и шапка.
            </p>
          )}

          {/* Two sections, not one mixed grid. Lettering and graphics are
              different purchases — somebody buying "Кумът" for six friends is
              not browsing crests — and a heading is what lets them skip. */}
          {words.length > 0 && (
            <h2 className="mt-10 font-heading text-xl font-bold tracking-tight">
              С надпис
            </h2>
          )}
          <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {words.map((w) => (
              <li key={w.id}>
                <Link
                  href={landing ? `/produkt/${landing.id}?design=${w.id}` : "/produkti"}
                  className="group block overflow-hidden rounded-xl ring-1 ring-border transition-shadow hover:shadow-lg"
                >
                  <div
                    className={`relative aspect-square p-8 ${w.forDark ? "bg-forest" : "bg-sand"}`}
                  >
                    <TextDesignArt
                      design={w}
                      color={w.forDark ? "#FEFCF8" : "#2B2B2B"}
                    />
                  </div>
                  <p className="bg-background p-3 text-center text-sm font-medium text-foreground">
                    {w.title}
                  </p>
                </Link>
              </li>
            ))}
          </ul>

          {designs.length > 0 && (
            <h2 className="mt-12 font-heading text-xl font-bold tracking-tight">
              С графика
            </h2>
          )}
          <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {designs.map((d) => (
              <li key={d.id}>
                <Link
                  href={landing ? `/produkt/${landing.id}?design=${d.id}` : "/produkti"}
                  className="group block overflow-hidden rounded-xl ring-1 ring-border transition-shadow hover:shadow-lg"
                >
                  {/* Light artwork on a dark tile, dark artwork on sand — half
                      of these are drawn for black garments and vanish on white. */}
                  <div
                    className={`relative aspect-square ${d.forDark ? "bg-forest" : "bg-sand"}`}
                  >
                    <Image
                      src={designImage(d.id)}
                      alt={d.title}
                      fill
                      sizes="(max-width: 640px) 50vw, 220px"
                      className="object-contain p-5 transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <p className="bg-background p-3 text-center text-sm font-medium text-foreground">
                    {d.title}
                  </p>
                </Link>
              </li>
            ))}
          </ul>

          {suited.length > 0 && (
            <section className="mt-16 border-t border-border pt-12">
              <h2 className="font-heading text-xl font-bold tracking-tight">
                Върху какво да го сложим
              </h2>
              <ul className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {suited.slice(0, 4).map((p) => (
                  <li key={p.id}>
                    <ProductCard product={p} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </main>
      <MentyFooter />
    </>
  );
}
