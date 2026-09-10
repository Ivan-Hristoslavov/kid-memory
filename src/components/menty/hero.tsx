import Link from "next/link";
import { ArrowRight, Truck } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { deliveryEstimate } from "@/lib/shop/delivery-date";
import { HeroCarousel } from "./hero-carousel";

/**
 * The hero: a split composition, copy left, one large lifestyle photograph
 * right, exactly as the reference lays it out.
 *
 * The eyebrow is the English strapline in tracked capitals — the reference puts
 * it there and it is the one place the brand speaks English, so it reads as a
 * mark rather than as untranslated copy.
 *
 * Two calls to action with different weights: a filled forest button for the
 * catalogue, an outlined one for personalisation. Neither is a pill; the brief
 * asks for 12–14px corners, which `rounded-lg` gives at this project's radius.
 */
export function MentyHero() {
  // Gifts are bought for a date. A weekday name is a promise; "1–3 работни
  // дни" is a sum the reader has to do.
  const { weekday } = deliveryEstimate();

  return (
    <section className="border-b border-border bg-sand">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-24">
        {/* The photograph comes first in the DOM so a phone shows the product
            before a screenful of type; `order` returns it to the right-hand
            column from `lg` up. */}
        <div className="order-1 lg:order-2">
          <HeroCarousel />
        </div>

        <div className="order-2 lg:order-1">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {BRAND.taglineEn}
          </p>
          <h1 className="mt-5 text-balance font-heading text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
            {BRAND.promise}
          </h1>
          <p className="mt-5 max-w-md text-pretty text-base text-muted-foreground sm:text-lg">
            Персонализирани подаръци за хората, които правят живота ти
            по-специален.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/produkti"
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-foreground/85"
            >
              Разгледай продуктите
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/personalizirani"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-foreground/20 bg-background px-6 text-sm font-semibold text-foreground transition-colors hover:border-foreground/40 hover:bg-muted"
            >
              Персонализирай
            </Link>
          </div>

          <p className="mt-5 inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Truck className="size-4 shrink-0 text-forest" strokeWidth={1.5} />
            Поръчано днес — при теб около{" "}
            <strong className="font-semibold text-foreground">{weekday}</strong>
          </p>
        </div>
      </div>
    </section>
  );
}
