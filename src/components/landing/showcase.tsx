"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { STYLES } from "@/lib/catalog";
import { iconFor } from "@/lib/icons";
import { Eyebrow } from "./shared";
import { TiltCard } from "./tilt-card";

/** Child name shown under each sample poster (fictional examples). */
const SAMPLE_NAMES: Record<string, string> = {
  realistic: "Мила",
  storybook: "Боби",
  disney: "Ема",
  caricature: "Ники",
  watercolor: "Дара",
  fantasy: "Ани и Алекс",
};

export function Showcase() {
  return (
    // Tighter than the other sections on purpose: the hero deck already shows
    // all six styles, so this one is the "look closer" pass, not a reveal.
    <section id="styles" className="bg-card/50 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="flex flex-col items-center text-center"
        >
          <Eyebrow>6 стила · безкрайно сладки</Eyebrow>
          <h2 className="mt-5 font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
            Всяко дете — своя собствена приказка
          </h2>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            Примерни постери с измислени дечица. Твоят ще е със снимката и думичките на
            твоето дете.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {STYLES.map((style, i) => {
            const Icon = iconFor(style.icon);
            return (
              <motion.div
                key={style.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, delay: (i % 3) * 0.1 }}
                className="group"
              >
                <Link href="/create" className="block">
                  <TiltCard className="relative">
                  <div className="elevate relative overflow-hidden rounded-[1.6rem] bg-white p-2.5 ring-1 ring-black/5 transition-shadow duration-300 group-hover:shadow-2xl group-hover:shadow-plum/25">
                    <div className="relative aspect-[2/3] overflow-hidden rounded-[1.1rem]">
                      <Image
                        src={`/samples/${style.id}.webp`}
                        alt={`Примерен постер в стил ${style.name} — Думичките на ${SAMPLE_NAMES[style.id]}`}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                      {/* hover veil */}
                      <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-plum/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <span className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-4 py-2 text-sm font-bold text-foreground shadow-lg">
                          Създай в този стил <ArrowRight className="size-4" />
                        </span>
                      </div>
                    </div>
                  </div>
                  </TiltCard>
                  <div className="mt-4 flex items-center justify-center gap-2.5">
                    <span
                      className={`grid size-9 place-items-center rounded-xl bg-gradient-to-br ${style.gradient} text-foreground/70`}
                    >
                      <Icon className="size-4.5" />
                    </span>
                    <div className="text-left">
                      <p className="font-heading font-bold leading-tight">{style.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Думичките на {SAMPLE_NAMES[style.id]}
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-14 text-center">
          <Button
            asChild
            size="lg"
            className="h-13 rounded-full px-8 text-base shadow-lg shadow-primary/25"
          >
            <Link href="/create">Създай своя — за 5 минути</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
