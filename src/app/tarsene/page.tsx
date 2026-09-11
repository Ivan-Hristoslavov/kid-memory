import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { MentyHeader } from "@/components/menty/header";
import { MentyFooter } from "@/components/menty/footer";
import { SearchResults } from "@/components/menty/search-results";

export const metadata: Metadata = {
  title: "Търсене",
  description: "Намери продукт, готова тениска или дизайн.",
  // Every query is a different page of the same catalogue, so none of them
  // should be indexed — the canonical is the bare search page.
  alternates: { canonical: "/tarsene" },
  robots: { index: false, follow: true },
};

/**
 * A search results PAGE, not only the dialog.
 *
 * The dialog was the whole of search, which meant a result had no URL: nobody
 * could send one to a friend, come back to one, or open one in a new tab, and
 * the browser's own back button did not lead anywhere useful. It also meant
 * that when somebody types a query and finds nothing, there is no page on which
 * to tell them what to do next.
 */
export default function SearchPage() {
  return (
    <>
      <MentyHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <Suspense
            fallback={
              <p className="text-muted-foreground">Търсенето се зарежда…</p>
            }
          >
            <SearchResults />
          </Suspense>

          <p className="mt-14 border-t border-border pt-8 text-sm text-muted-foreground">
            Не намираш каквото търсиш?{" "}
            <Link href="/produkti" className="font-semibold text-foreground hover:underline">
              Разгледай всички продукти
            </Link>{" "}
            или{" "}
            <Link href="/dizaini" className="font-semibold text-foreground hover:underline">
              готовите дизайни
            </Link>
            .
          </p>
        </div>
      </main>
      <MentyFooter />
    </>
  );
}
