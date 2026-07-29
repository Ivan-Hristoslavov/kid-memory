"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Baby, Cake, Gift, PartyPopper, Snowflake, Sun } from "lucide-react";
import { Eyebrow } from "./shared";

const OCCASIONS = [
  { icon: Cake, title: "Рожден ден", text: "Подарък, който детето ще пази и след години." },
  { icon: Baby, title: "Кръщене", text: "Нежен спомен от първите месеци." },
  { icon: Sun, title: "1-ви юни", text: "Празникът на детето — с неговите думички." },
  { icon: Snowflake, title: "Коледа", text: "Топъл подарък под елхата." },
  { icon: PartyPopper, title: "Първи учебен ден", text: "Границата между бебе и голямо дете." },
  { icon: Gift, title: "Просто така", text: "Защото порастват прекалено бързо." },
];

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
          {OCCASIONS.map((o, i) => (
            <motion.div
              key={o.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
            >
              <Link
                href="/create"
                className="glass lift group flex h-full items-start gap-4 rounded-2xl p-6"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground transition-colors group-hover:bg-primary/15 group-hover:text-primary">
                  <o.icon className="size-5" />
                </span>
                <span>
                  <span className="block font-heading font-bold">{o.title}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{o.text}</span>
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
