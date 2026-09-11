import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LIFESTYLE } from "@/lib/brand";

/**
 * The personalisation banner: one wide card, copy on the left, a flat-lay of
 * the things you actually customise on the right.
 *
 * It sits between the categories and the bestsellers because that is where the
 * reference puts it, and the placement is the argument: it explains what makes
 * these products different before showing any price.
 */
export function PersonalizeBanner() {
  return (
    <section className="bg-background py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-stretch gap-0 overflow-hidden rounded-xl bg-sand ring-1 ring-border lg:grid-cols-2">
          <div className="flex flex-col justify-center p-8 sm:p-10 lg:p-14">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Персонализирано
            </p>
            <h2 className="mt-4 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              Направи го уникален.
            </h2>
            <p className="mt-4 max-w-sm text-pretty text-muted-foreground">
              Добави снимка, име, послание или специална дата. Ние го поемаме
              оттам — от печата до опаковката.
            </p>
            <Link
              href="/personalizirani"
              className="group mt-8 inline-flex h-12 w-fit items-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-foreground/85"
            >
              Започни персонализация
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <div className="relative min-h-64 lg:min-h-[26rem]">
            <Image
              src={LIFESTYLE.personalize}
              alt="Чаша, рамка и снимка, подредени за персонализиране"
              fill
              sizes="(max-width: 1024px) 100vw, 640px"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
