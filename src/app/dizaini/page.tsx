import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MentyHeader } from "@/components/menty/header";
import { MentyFooter } from "@/components/menty/footer";
import { DESIGN_CATEGORIES, designImage, designsInCategory } from "@/lib/shop/designs";

export const metadata: Metadata = {
  title: "Готови дизайни",
  description:
    "Над петдесет готови дизайна за тениски, суичъри и чаши — гейминг, ергенско и моминско парти, любимци, фитнес и още. Избираш дизайн, избираш продукт, готово.",
  alternates: { canonical: "/dizaini" },
};

/**
 * The design index.
 *
 * It exists because the shop's original path assumed everyone arrives with a
 * photograph, and most people arrive with an occasion and no idea. A grid of
 * finished designs is a shorter route to a basket than an empty upload box,
 * and it is the page that can rank for "тениска за ергенско парти" — which is
 * what somebody actually types.
 */
export default function DesignsPage() {
  return (
    <>
      <MentyHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Готови дизайни
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Не ти трябва снимка. Избираш дизайн, избираш продукт и цвят — и го
            получаваш отпечатан в България до няколко дни.
          </p>

          <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {DESIGN_CATEGORIES.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/dizaini/${c.id.toLowerCase()}`}
                  className="group block overflow-hidden rounded-xl bg-background ring-1 ring-border transition-shadow hover:shadow-lg"
                >
                  <div className="relative aspect-square bg-sand">
                    <Image
                      src={designImage(c.cover)}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 50vw, 260px"
                      className="object-contain p-6 transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-3.5">
                    <p className="text-sm font-semibold text-foreground">{c.label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{c.blurb}</p>
                    <p className="mt-1.5 text-xs font-medium text-forest">
                      {designsInCategory(c.id).length} дизайна →
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
      <MentyFooter />
    </>
  );
}
