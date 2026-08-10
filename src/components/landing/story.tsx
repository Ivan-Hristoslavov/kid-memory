"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Camera, MessageSquareQuote, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "./shared";

/**
 * The "what am I actually buying" section.
 *
 * It used to be an iPhone Notes mock-up with a parent's list of toddler words —
 * emotionally strong, but it assumed the visitor was a parent who already keeps
 * such a list, which is exactly the assumption the shop no longer makes. It is
 * now a straight demo of the transform: the three things you fill in on the
 * left, the finished print on the right. That reads the same whether the poster
 * is for a child, a colleague or a dog, and it doubles as a promise about how
 * little work is involved.
 */
const INPUTS = [
  {
    icon: Camera,
    label: "Снимката",
    value: "IMG_4821.HEIC",
    hint: "една ясна снимка, нищо повече",
  },
  {
    icon: MessageSquareQuote,
    label: "Репликите",
    value: "„Ще го оправим в понеделник“",
    hint: "две до шест, колкото искаш",
  },
  {
    icon: Palette,
    label: "Стилът",
    value: "Реалистична рисунка",
    hint: "шест на избор",
  },
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
          <Eyebrow>От три полета до стената</Eyebrow>
          <h2 className="mt-5 text-balance font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
            Ти попълваш три неща.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Останалото — рисунката, надписите, печатът и доставката — е наша работа.
          </p>
        </motion.div>

        {/* Equal outer columns keep the pair optically centred — an `auto`
            poster column made the right side wider and threw the whole row off
            axis. Both halves are capped and centred inside their own column. */}
        <div className="mt-14 grid items-center justify-items-center gap-8 lg:grid-cols-[1fr_auto_1fr] lg:gap-10">
          {/* What the visitor fills in */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-[330px] lg:justify-self-end"
          >
            <div className="elevate space-y-3 rounded-2xl bg-card p-5">
              {INPUTS.map((f, i) => (
                <div
                  key={f.label}
                  className="rounded-2xl border border-border bg-background/60 p-4"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                      <f.icon className="size-4" />
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {i + 1}. {f.label}
                    </span>
                  </div>
                  <p className="mt-2.5 truncate font-heading text-base font-bold">
                    {f.value}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{f.hint}</p>
                </div>
              ))}
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
            <div className="elevate overflow-hidden rounded-2xl bg-white p-3">
              <Image
                src="/samples/realistic.webp"
                alt="Готов илюстрован постер по снимка, отпечатан и готов за рамка"
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
            Виждаш готовия постер, преди да платиш.
          </p>
          <p className="mt-2 text-lg text-muted-foreground">
            Без карта, без абонамент. Не ти хареса —{" "}
            <span className="text-gradient-warm">не поръчваш.</span>
          </p>
          <Button asChild size="lg" className="mt-8 h-13 rounded-full px-8 text-base">
            <Link href="/create">
              Пробвай безплатно
              <ArrowRight className="size-5" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
