"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Eye, ShieldCheck, Sparkles, Tag } from "lucide-react";
import { formatPrice, lowestPriceEUR } from "@/lib/catalog";
import { HashLink } from "@/components/site/hash-link";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/brand";
import { AVAILABLE_TEMPLATES, TEMPLATES, type TemplateId } from "@/lib/templates";
import { iconFor } from "@/lib/icons";

/**
 * Underlines the quoted word in the headline with a hand-drawn squiggle that
 * draws itself in. The headline is editable from the admin panel, so the word
 * is found by its „…“ quotes rather than hardcoded — any quoted word works, and
 * a headline without quotes simply renders plain.
 */
function HeadlineWithSquiggle({ text }: { text: string }) {
  const match = text.match(/^([\s\S]*?)(„[^“]+“)([\s\S]*)$/);
  if (!match) return <>{text}</>;
  const [, before, quoted, after] = match;

  return (
    <>
      {before}
      <span className="relative inline-block whitespace-nowrap">
        {quoted}
        <svg
          aria-hidden
          viewBox="0 0 300 16"
          preserveAspectRatio="none"
          className="absolute -bottom-1 left-0 h-3 w-full text-primary"
        >
          <path
            className="squiggle"
            d="M3 11c40-6 78 4 118-1s86-7 176 2"
            fill="none"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </svg>
      </span>
      {after}
    </>
  );
}

export function Hero({
  title,
  subtitle,
  badge,
  template,
}: {
  title?: string;
  subtitle?: string;
  badge?: string | null;
  /** Set by the active campaign, so its CTA opens the form it advertised. */
  template?: TemplateId | null;
} = {}) {
  const createHref = template ? `/create?template=${template}` : "/create";
  return (
    <section className="bg-dreamy relative overflow-hidden pt-5 pb-14 sm:pt-14 sm:pb-24">
      {/* The photograph comes FIRST in the DOM so that on a phone the product
          is the first thing on screen. On a 375px viewport the old layout put
          the nearest poster image 991px down — a full screen of type before a
          visual product showed itself. `order` swaps it back to the right-hand
          column from `lg` up. */}
      <div className="relative mx-auto grid max-w-6xl items-center gap-6 px-6 sm:gap-9 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="order-1 lg:order-2"
        >
          <HeroFrame />
        </motion.div>

        <div className="order-2 text-center lg:order-1 lg:text-left">
          {/* A campaign can set this ("Първи учебен ден"), so it names the
              occasion the visitor arrived for before the headline does. */}
          {badge && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-4 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-sm font-bold text-secondary-foreground"
            >
              <Sparkles className="size-4" />
              {badge}
            </motion.div>
          )}

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-balance font-heading text-[2.6rem] font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-[4.2rem]"
          >
            <HeadlineWithSquiggle text={title ?? "Подарък, който казва „това си ти“."} />
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mx-auto mt-4 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg lg:mx-0"
          >
            {subtitle ?? BRAND.description}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-6 flex flex-col items-center gap-3 sm:mt-8 sm:flex-row sm:justify-center lg:justify-start"
          >
            <Button
              asChild
              size="lg"
              className="group h-14 w-full rounded-full px-8 text-lg shadow-xl shadow-primary/30 sm:w-auto"
            >
              <Link href={createHref}>
                Създай постер
                <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="lg" className="group h-14 rounded-full px-5">
              <HashLink href="/#how">
                Как работи
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </HashLink>
            </Button>
          </motion.div>

          {/* The single clearest signal that this is not a children-only shop.
              Each chip opens its own template. */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:mt-7 lg:justify-start"
          >
            {AVAILABLE_TEMPLATES.map((id) => {
              const t = TEMPLATES[id];
              const Icon = iconFor(t.icon);
              return (
                <Link
                  key={id}
                  href={`/create?template=${id}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/70 px-3 py-1.5 text-sm font-medium transition-colors hover:border-primary/50 hover:text-primary"
                >
                  <Icon className="size-3.5" />
                  {t.name}
                </Link>
              );
            })}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground lg:justify-start"
          >
            <span className="inline-flex items-center gap-1.5">
              <Eye className="size-4 text-primary" />
              <strong className="text-foreground">Виждаш го, преди да платиш</strong>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Tag className="size-4 text-primary" />
              от <strong className="text-foreground">{formatPrice(lowestPriceEUR())}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-primary" /> Плащане при доставка
            </span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/**
 * The hero visual: one framed print photographed on a wall.
 *
 * It replaced a fanned deck of six poster thumbnails. The deck showed the range
 * but never the product — a 2cm thumbnail cannot say "premium matte paper in a
 * real frame", and the range is already the whole job of the Showcase section
 * further down. One large photograph of the thing in a room does say it.
 *
 * The aspect ratio changes with the breakpoint rather than the file: a 3:4
 * portrait is right beside a headline on a desktop, but on a phone it would eat
 * the fold and push the call to action out of sight, so the same image is
 * cropped to a landscape band there.
 */
function HeroFrame() {
  return (
    <div className="relative mx-auto w-full max-w-[26rem] lg:max-w-none">
      {/* A portrait source shown in a landscape box is a hard crop, so the
          focal point is pulled upward on the small breakpoints: that keeps the
          frame's top edge and the whole title banner in view instead of
          centring on the middle of the artwork and slicing both. */}
      <div className="elevate-lg relative aspect-[5/4] w-full overflow-hidden rounded-2xl sm:aspect-[3/2] lg:aspect-[3/4]">
        <Image
          src="/samples/hero-wall.webp"
          alt="Персонализиран илюстрован постер в дъбова рамка, окачен на стена"
          fill
          priority
          sizes="(max-width: 1024px) 92vw, 460px"
          className="object-cover object-[50%_22%] lg:object-center"
        />
      </div>
      <div aria-hidden className="grounded" />
    </div>
  );
}
