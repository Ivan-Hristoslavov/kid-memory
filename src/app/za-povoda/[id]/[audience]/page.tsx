import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { MentyHeader } from "@/components/menty/header";
import { MentyFooter } from "@/components/menty/footer";
import { ProductCard } from "@/components/menty/bestsellers";
import { GIFT_AUDIENCES, GIFT_OCCASIONS } from "@/lib/brand";
import { byTag } from "@/lib/shop/products";

/**
 * An occasion crossed with a recipient — "подарък за рожден ден за нея".
 *
 * This is the shape every serious gifting site is built on. Moonpig's whole
 * catalogue is `/personalised-cards/birthday/for-her/`: product type, then
 * occasion, then recipient, with the recipient a CHILD of the occasion rather
 * than a sibling of it. Ours had the two as parallel flat lists that never met,
 * so the sentence somebody actually types had no page to land on.
 *
 * Only combinations with products in common are generated. A page that exists
 * to say "nothing here" is worse than a 404: it wastes a crawl and disappoints
 * a click. See docs/information-architecture.md.
 */
function combos() {
  return GIFT_OCCASIONS.flatMap((o) =>
    GIFT_AUDIENCES.filter(
      (a) => byTag(o.id).some((p) => p.tags.includes(a.id))
    ).map((a) => ({ id: o.id, audience: a.id }))
  );
}

export function generateStaticParams() {
  return combos();
}

export const dynamicParams = false;

function pair(id: string, audience: string) {
  const occasion = GIFT_OCCASIONS.find((o) => o.id === id);
  const who = GIFT_AUDIENCES.find((a) => a.id === audience);
  return occasion && who ? { occasion, who } : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; audience: string }>;
}): Promise<Metadata> {
  const { id, audience } = await params;
  const found = pair(id, audience);
  if (!found) return { title: "Колекцията не е намерена" };
  const title = `Подаръци ${found.occasion.label.toLowerCase()} ${found.who.label.toLowerCase()}`;
  return {
    title,
    description: `${title} — персонализирани, със снимка, име или послание. Изработка и доставка в България.`,
    alternates: { canonical: `/za-povoda/${id}/${audience}` },
  };
}

export default async function CrossPage({
  params,
}: {
  params: Promise<{ id: string; audience: string }>;
}) {
  const { id, audience } = await params;
  const found = pair(id, audience);
  if (!found) notFound();
  const { occasion, who } = found;

  const items = byTag(occasion.id).filter((p) => p.tags.includes(who.id));
  if (items.length === 0) notFound();

  // The other recipients this occasion has something for, so the page is a
  // junction rather than a cul-de-sac — the same job Moonpig's sibling links do.
  const siblings = GIFT_AUDIENCES.filter(
    (a) => a.id !== who.id && byTag(occasion.id).some((p) => p.tags.includes(a.id))
  );

  return (
    <>
      <MentyHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <nav
            aria-label="Пътека"
            className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground"
          >
            <Link href="/" className="transition-colors hover:text-foreground">
              Начало
            </Link>
            <ChevronRight className="size-3" />
            <Link href="/za-povoda" className="transition-colors hover:text-foreground">
              За повода
            </Link>
            <ChevronRight className="size-3" />
            <Link
              href={`/za-povoda/${occasion.id}`}
              className="transition-colors hover:text-foreground"
            >
              {occasion.label}
            </Link>
            <ChevronRight className="size-3" />
            <span className="text-foreground">{who.label}</span>
          </nav>

          {/* Two photographs, the occasion's and the recipient's, so a crossed
              page looks like the crossing rather than like a filtered list. */}
          <div className="mt-6 flex items-center gap-5">
            <span className="relative hidden h-24 w-40 shrink-0 overflow-hidden rounded-xl ring-1 ring-border sm:block">
              <Image
                src={occasion.image}
                alt=""
                fill
                priority
                sizes="160px"
                className="object-cover"
              />
              <span className="absolute inset-y-0 right-0 w-1/2">
                <Image src={who.image} alt="" fill sizes="80px" className="object-cover" />
              </span>
            </span>
            <div>
              <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                Подаръци {occasion.label.toLowerCase()} {who.label.toLowerCase()}
              </h1>
              <p className="mt-2 text-muted-foreground">
                {items.length} {items.length === 1 ? "продукт" : "продукта"} — със
                снимка, име или послание.
              </p>
            </div>
          </div>

          <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {items.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} />
              </li>
            ))}
          </ul>

          {siblings.length > 0 && (
            <section className="mt-14 border-t border-border pt-10">
              <h2 className="font-heading text-lg font-bold tracking-tight">
                {occasion.label} — за кого друг
              </h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {siblings.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/za-povoda/${occasion.id}/${a.id}`}
                      className="inline-flex h-10 items-center rounded-full border border-border bg-background px-4 text-sm font-medium text-foreground/80 transition-colors hover:border-foreground/40 hover:text-foreground"
                    >
                      {a.label}
                    </Link>
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
