import type { Metadata } from "next";
import { MentyHeader } from "@/components/menty/header";
import { MentyFooter } from "@/components/menty/footer";
import { ProductCard } from "@/components/menty/bestsellers";
import { ALL_PRODUCTS, type ProductFamily } from "@/lib/shop/products";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Всички продукти",
  description: BRAND.description,
  alternates: { canonical: "/produkti" },
};

/**
 * The catalogue.
 *
 * Grouped by family rather than presented as one long grid: somebody browsing
 * for a gift is choosing a KIND of thing first — something to drink from,
 * something to wear, something for the wall — and a flat grid of a hundred
 * items makes that choice harder, not easier.
 *
 * Families with nothing in them are skipped, so the page grows on its own as
 * the catalogue fills rather than showing empty headings.
 */
const FAMILY_LABELS: Record<ProductFamily, string> = {
  DRINKWARE: "Чаши",
  APPAREL: "Дрехи",
  WALL: "За стената",
  ACCESSORIES: "Аксесоари",
  PUZZLES: "Пъзели",
  HOME: "За дома",
  PACKAGING: "Опаковка",
};

const FAMILY_ORDER: readonly ProductFamily[] = [
  "DRINKWARE",
  "APPAREL",
  "WALL",
  "ACCESSORIES",
  "PUZZLES",
  "HOME",
  "PACKAGING",
];

export default function ProductsPage() {
  const groups = FAMILY_ORDER.map((family) => ({
    family,
    items: ALL_PRODUCTS.filter((p) => p.family === family),
  })).filter((g) => g.items.length > 0);

  return (
    <>
      <MentyHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Всички продукти
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Всеки от тях може да носи снимка, име или послание. Изработваме по
            поръчка в България.
          </p>

          {groups.map((group) => (
            <section key={group.family} className="mt-12 sm:mt-16">
              <h2 className="font-heading text-xl font-bold tracking-tight sm:text-2xl">
                {FAMILY_LABELS[group.family]}
              </h2>
              <ul className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {group.items.map((p) => (
                  <li key={p.id}>
                    <ProductCard product={p} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
      <MentyFooter />
    </>
  );
}
