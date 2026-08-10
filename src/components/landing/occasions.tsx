"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { iconFor } from "@/lib/icons";
import { OCCASIONS } from "@/lib/templates";
import { Eyebrow } from "./shared";

export function Occasions() {
  return (
    <section id="occasions" className="aura-cool py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="flex flex-col items-center text-center"
        >
          <Eyebrow>Подарък за всеки повод</Eyebrow>
          <h2 className="mt-5 font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
            Кога да го подариш
          </h2>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            Персонализираният постер е подарък, който не се забравя след седмица.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {OCCASIONS.map((o, i) => {
            const Icon = iconFor(o.icon);
            return (
              <motion.div
                key={o.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
              >
                {/* Carries the template, so the form the visitor lands on is the
                    one the card just promised. */}
                <Link
                  href={`/create?template=${o.template}`}
                  className="lift group flex h-full flex-col overflow-hidden rounded-xl bg-card ring-1 ring-border/70"
                >
                  {/* The poster this occasion actually produces. A farewell gift
                      and a birth announcement share nothing but the paper, and
                      an icon hid exactly that. */}
                  {/* 2:3 is the poster's own ratio, so the card shows the whole
                      artwork. Any tighter box cropped the bottom bubbles, and a
                      half-cut line reads as a layout bug. */}
                  <span className="relative block aspect-[2/3] overflow-hidden bg-secondary">
                    <Image
                      src={o.image}
                      alt={o.alt}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </span>
                  <span className="flex flex-1 items-start gap-3 p-5">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-secondary-foreground transition-colors group-hover:bg-primary/15 group-hover:text-primary">
                      <Icon className="size-4.5" />
                    </span>
                    <span>
                      <span className="block font-heading font-bold">{o.title}</span>
                      <span className="mt-1 block text-sm text-muted-foreground">{o.text}</span>
                    </span>
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
