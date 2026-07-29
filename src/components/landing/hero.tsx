"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Eye, Heart, ShieldCheck, Sparkles, Tag } from "lucide-react";
import { formatPrice, lowestPriceEUR } from "@/lib/catalog";
import { HashLink } from "@/components/site/hash-link";
import { Magnetic } from "@/components/site/magnetic";
import { Button } from "@/components/ui/button";
import { HeroPoster } from "./hero-poster";
import { FloatingMagic } from "./floating-magic";

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

export function Hero({ title, subtitle }: { title?: string; subtitle?: string } = {}) {
  return (
    <section className="bg-dreamy relative overflow-hidden pt-14 pb-20 sm:pt-20 sm:pb-28">
      <FloatingMagic />
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-5 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-sm font-bold text-secondary-foreground"
          >
            <Sparkles className="size-4" />
            С лицето на твоето дете — не само думички
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-balance font-heading text-5xl font-extrabold leading-[1.03] tracking-tight sm:text-6xl lg:text-[4.2rem]"
          >
            <HeadlineWithSquiggle text={title ?? "Догодина няма да казва „лисапед“."} />
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mx-auto mt-6 max-w-xl text-pretty text-lg text-muted-foreground lg:mx-0"
          >
            {subtitle ??
              "Превърни първите смешни думи на твоето дете в уникален илюстриран постер, който ще топли сърцето ти завинаги."}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="mt-9 flex flex-col items-center gap-4 sm:flex-row lg:justify-start sm:justify-center"
          >
            <Magnetic>
              <Button
                asChild
                size="lg"
                className="group h-14 rounded-full px-8 text-lg shadow-xl shadow-primary/30"
              >
                <Link href="/create">
                  Създай моя спомен
                  <Heart className="size-5 fill-current transition-transform group-hover:scale-110" />
                </Link>
              </Button>
            </Magnetic>
            <Button asChild variant="ghost" size="lg" className="group h-14 rounded-full px-5">
              <HashLink href="/#how">
                Как работи
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </HashLink>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.6 }}
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

        <div className="relative flex justify-center">
          <HeroPoster />
        </div>
      </div>
    </section>
  );
}
