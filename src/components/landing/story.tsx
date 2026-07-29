"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Battery, Signal, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "./shared";

/**
 * The problem section. Parents already collect these words — in the Notes app,
 * where they are forgotten. Showing that exact artifact next to the finished
 * poster makes the section do three jobs at once: recognition, the closing
 * window, and a demo of the transformation we sell.
 *
 * Replace NOTE_WORDS with real submissions as soon as there are any — invented
 * examples read as invented.
 */
const NOTE_WORDS = [
  { said: "прахумосмачка", real: "прахосмукачка" },
  { said: "аляяяя", real: "вода" },
  { said: "лисапед", real: "велосипед" },
  { said: "хелкоптел", real: "хеликоптер" },
  { said: "майпуна", real: "маймуна" },
];

export function Story() {
  return (
    // Trimmed bottom padding: this section's own spacing stacked with the next
    // section's top padding and left a dead screenful between them.
    <section className="aura relative overflow-hidden pt-24 pb-14 sm:pt-28 sm:pb-16">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <Eyebrow>Познато ли ти е?</Eyebrow>
          <h2 className="mt-5 text-balance font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
            Записваш ги в бележките на телефона.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            И там си остават — между списъка за пазар и паролата от Wi-Fi.
          </p>
        </motion.div>

        {/* Equal outer columns keep the pair optically centred — an `auto`
            poster column made the right side wider and threw the whole row off
            axis. Both halves are capped and centred inside their own column. */}
        <div className="mt-14 grid items-center justify-items-center gap-8 lg:grid-cols-[1fr_auto_1fr] lg:gap-10">
          {/* Phone note */}
          <motion.div
            initial={{ opacity: 0, y: 28, rotate: -3 }}
            whileInView={{ opacity: 1, y: 0, rotate: -2 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-[290px] lg:justify-self-end"
          >
            <div className="elevate rounded-[2.2rem] bg-foreground/90 p-2.5">
              <div className="overflow-hidden rounded-[1.7rem] bg-[#fdfcf8]">
                <div className="flex items-center justify-between px-5 pt-3 text-[11px] font-semibold text-foreground/70">
                  <span>9:41</span>
                  <span className="flex items-center gap-1">
                    <Signal className="size-3" />
                    <Wifi className="size-3" />
                    <Battery className="size-3.5" />
                  </span>
                </div>

                <div className="px-5 pb-6 pt-4">
                  <p className="text-[11px] font-medium text-foreground/40">
                    вторник, 14:32
                  </p>
                  <p className="mt-1 font-heading text-lg font-bold">Думичките на Мила</p>

                  <ul className="mt-4 space-y-3">
                    {NOTE_WORDS.map((w) => (
                      <li key={w.said} className="border-b border-dashed border-foreground/10 pb-2.5 last:border-0">
                        <span className="block font-semibold">{w.said}</span>
                        <span className="block text-xs text-foreground/45">
                          = {w.real}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <span className="mt-4 block h-4 w-px animate-pulse bg-primary" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Transform arrow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="flex justify-center"
          >
            <span className="grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30">
              <ArrowRight className="size-6 lg:block hidden" />
              <ArrowRight className="size-6 rotate-90 lg:hidden" />
            </span>
          </motion.div>

          {/* The poster */}
          <motion.div
            initial={{ opacity: 0, y: 28, rotate: 3 }}
            whileInView={{ opacity: 1, y: 0, rotate: 1.5 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative w-full max-w-[290px] lg:justify-self-start"
          >
            <div className="elevate overflow-hidden rounded-3xl bg-white p-3">
              <Image
                src="/samples/realistic.webp"
                alt="Постер с илюстрация на дете и неговите смешни думички"
                width={768}
                height={1152}
                className="w-full rounded-2xl"
              />
            </div>

            {/* Contact shadow: grounds the print instead of letting it float.
                A mirrored copy was the other option, but it needs pixel-exact
                offsets that break at every breakpoint. */}
            <div
              aria-hidden
              className="absolute inset-x-6 top-full -z-10 h-10 rounded-[50%] bg-plum/25 blur-2xl"
            />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-14 text-center"
        >
          <p className="font-heading text-2xl font-bold sm:text-3xl">
            Догодина вече ще ги казва правилно.
          </p>
          <p className="mt-2 text-lg text-muted-foreground">
            Бележката ще я изтриеш. Стената — <span className="text-gradient-warm">не.</span>
          </p>
          <Button asChild size="lg" className="mt-8 h-13 rounded-full px-8 text-base">
            <Link href="/create">
              Извади ги от телефона
              <ArrowRight className="size-5" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
