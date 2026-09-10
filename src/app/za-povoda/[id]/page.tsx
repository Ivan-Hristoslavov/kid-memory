import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MentyHeader } from "@/components/menty/header";
import { MentyFooter } from "@/components/menty/footer";
import { ProductCard } from "@/components/menty/bestsellers";
import { GIFT_AUDIENCES, GIFT_OCCASIONS } from "@/lib/brand";
import { byTag } from "@/lib/shop/products";

/** Two rails point here: an audience, or an occasion. Themes moved to /dizaini. */
const COLLECTIONS = [...GIFT_AUDIENCES, ...GIFT_OCCASIONS];

/** Ids are duplicated across the two rails (birthday appears in both). */
function collectionById(id: string) {
  return COLLECTIONS.find((c) => c.id === id);
}

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

  return (
    <>
      <MentyHeader />
      <main className="flex-1">
        <section className="border-b border-border bg-sand">
          <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
            <span className="relative hidden size-24 shrink-0 overflow-hidden rounded-full ring-1 ring-border sm:block">
              <Image src={collection.image} alt="" fill sizes="96px" className="object-cover" />
            </span>
            <div>
              <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                Подаръци {collection.label.toLowerCase()}
              </h1>
              <p className="mt-2 text-muted-foreground">
                {items.length}{" "}
                {items.length === 1 ? "продукт" : "продукта"}, всеки от които може
                да носи снимка, име или послание.
              </p>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          {items.length === 0 ? (
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
