"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, HeartHandshake, RefreshCw, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

const POINTS = [
  {
    icon: Eye,
    title: "Виждаш го, преди да платиш",
    text: "Създаваш постера безплатно и виждаш готовия резултат с лицето на детето си. Ако не ти хареса — просто не поръчваш.",
  },
  {
    icon: Wallet,
    title: "Плащане при доставка",
    text: "Плащаш чак когато спомeнът е в ръцете ти. Без карта, без предплащане.",
  },
  {
    icon: RefreshCw,
    title: "Безплатна корекция",
    text: "Не си доволен от илюстрацията? Прегенерираме я безплатно, докато стане както искаш.",
  },
];

export function Guarantee() {
  return (
    <section className="aura py-24 sm:py-28">
      <div className="mx-auto max-w-5xl px-6">
        <div className="glass overflow-hidden rounded-[2.5rem] p-8 sm:p-12">
          <div className="flex flex-col items-center gap-4 text-center">
            <span className="grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary">
              <HeartHandshake className="size-8" />
            </span>
            <h2 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
              Поръчваш без никакъв риск
            </h2>
            <p className="max-w-xl text-muted-foreground">
              Искаме да си напълно спокоен. Затова поемаме риска вместо теб.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {POINTS.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="elevate-sm rounded-2xl bg-card/80 p-6 text-center"
              >
                <span className="mx-auto grid size-12 place-items-center rounded-xl bg-secondary text-secondary-foreground">
                  <p.icon className="size-6" />
                </span>
                <h3 className="mt-4 font-heading font-bold">{p.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{p.text}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Button
              asChild
              size="lg"
              className="h-13 rounded-full px-8 text-base shadow-lg shadow-primary/25"
            >
              <Link href="/create">Създай своя спомен днес</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
