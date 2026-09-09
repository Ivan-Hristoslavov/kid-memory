import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, RotateCcw, Sparkles, Truck } from "lucide-react";
import { MentyHeader } from "@/components/menty/header";
import { MentyFooter } from "@/components/menty/footer";
import { ProductGallery } from "@/components/menty/product-gallery";
import { ProductPanel } from "@/components/menty/product-panel";
import { ProductAccordions } from "@/components/menty/product-accordions";
import { ProductCard } from "@/components/menty/bestsellers";
import { formatPrice, DELIVERY } from "@/lib/catalog";
import { ALL_PRODUCTS, productById } from "@/lib/shop/products";

/** Every catalogue entry is a known id, so the routes can be prerendered. */
export function generateStaticParams() {
  return ALL_PRODUCTS.map((p) => ({ id: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = productById(id);
  if (!product) return { title: "Продуктът не е намерен" };
  return {
    title: product.title,
    description: product.blurb,
    alternates: { canonical: `/produkt/${product.id}` },
  };
}

/**
 * The product page.
 *
 * Layout follows the brief: a large gallery on the left, a clean purchase panel
 * on the right, then the reassurance cards and the collapsible detail rows. The
 * type scale, radii, button height and spacing are the homepage's, because the
 * brief asks for one design language across both.
 *
 * The supplier's own page stays reachable from `sourceUrl` in the catalogue —
 * it is the authority on form and variants — but it is never linked to a
 * customer, who is buying from Menty and should not be handed off to a
 * fulfilment partner mid-purchase.
 */
export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = productById(id);
  if (!product) notFound();

  const related = ALL_PRODUCTS.filter(
    (p) => p.id !== product.id && p.family === product.family
  ).slice(0, 4);

  const details = [
    {
      title: "Детайли за продукта",
      body: `${product.blurb} Изработва се по поръчка в България, специално за теб.`,
    },
    {
      title: "Доставка и връщане",
      body: `Изработка 1–3 работни дни, след което доставка с Еконт или Спиди. Доставката е ${formatPrice(
        DELIVERY.feeEUR
      )} и е безплатна над ${formatPrice(
        DELIVERY.freeAboveEUR
      )}. Персонализираните продукти не подлежат на връщане, освен при дефект — в такъв случай ги подменяме безплатно.`,
    },
    {
      title: "Качество и печат",
      body: "Печатаме с устойчиви на избледняване мастила. Керамиката е подходяща за миялна машина, а текстилът се пере на 30° наопаки.",
    },
  ];

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
            <Link href="/produkti" className="transition-colors hover:text-foreground">
              Продукти
            </Link>
            <ChevronRight className="size-3" />
            <span className="text-foreground">{product.title}</span>
          </nav>

          <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-14">
            <ProductGallery product={product} />

            <div>
              <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                {product.title}
              </h1>
              <p className="mt-3 text-muted-foreground">{product.blurb}</p>
              <p className="mt-5 text-2xl font-semibold text-foreground">
                {formatPrice(product.priceEUR)}
              </p>

              <div className="mt-8">
                <ProductPanel product={product} />
              </div>

              <ul className="mt-8 grid gap-3 sm:grid-cols-3">
                <Reassurance icon={Truck} title="Доставка 1–3 дни" text="Еконт и Спиди" />
                <Reassurance icon={Sparkles} title="Печат в България" text="По поръчка" />
                <Reassurance icon={RotateCcw} title="Дефект — подмяна" text="Безплатно" />
              </ul>

              <ProductAccordions details={details} />
            </div>
          </div>

          {related.length > 0 && (
            <section className="mt-16 border-t border-border pt-12 sm:mt-20">
              <h2 className="font-heading text-2xl font-bold tracking-tight">
                Може да ти хареса
              </h2>
              <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {related.map((p) => (
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

function Reassurance({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  text: string;
}) {
  return (
    <li className="rounded-lg border border-border bg-background p-3">
      <Icon className="size-4 text-forest" strokeWidth={1.5} />
      <p className="mt-2 text-xs font-semibold text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground">{text}</p>
    </li>
  );
}
