import type { Metadata } from "next";
import { MentyHeader } from "@/components/menty/header";
import { MentyFooter } from "@/components/menty/footer";
import { ProductBrowser } from "@/components/menty/product-sort";
import Link from "next/link";
import { PRODUCT_GROUPS, byGroup } from "@/lib/shop/products";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Всички продукти",
  description: BRAND.description,
  alternates: { canonical: "/produkti" },
};

/**
 * The catalogue.
 *
 * Grouped the way the supplier groups their own, and in their order. Fourteen
 * garments under one heading called "Дрехи" was not a catalogue, it was a pile:
 * a t-shirt, a hoodie and a pair of shorts are three different decisions and
 * they were sharing a shelf.
 *
 * There is a jump link per group at the top, because on a phone the ninth
 * heading is a long way down. Empty groups are skipped, so the page grows on
 * its own as the catalogue fills rather than showing bare headings.
 */
export default function ProductsPage() {
  const groups = PRODUCT_GROUPS.map((g) => ({
    ...g,
    items: [...byGroup(g.id)],
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

          <nav
            aria-label="Категории"
            className="-mx-1 mt-6 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {groups.map((g) => (
              <Link
                key={g.id}
                href={`#${g.id.toLowerCase()}`}
                className="h-9 shrink-0 rounded-full border border-border bg-background px-4 text-sm font-medium leading-9 text-foreground/75 transition-colors hover:border-foreground/40 hover:text-foreground"
              >
                {g.label}
              </Link>
            ))}
          </nav>

          {/* Sorting and a price ceiling. A shopper with a budget cannot use a
              grouped page — see the component's own note on why sorting
              flattens the shelves rather than sorting inside them. */}
          <ProductBrowser groups={groups} />
        </div>
      </main>
      <MentyFooter />
    </>
  );
}
