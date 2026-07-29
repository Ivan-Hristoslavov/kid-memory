"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AVAILABLE_PRODUCTS, DELIVERY, PRODUCTS, formatPrice } from "@/lib/catalog";
import { Eyebrow } from "./shared";
import { AddonsStrip } from "./addons-strip";

const TAGLINE: Partial<Record<keyof typeof PRODUCTS, string>> = {
  POSTER_A3: "Най-избиран",
  PREMIUM: "Най-стойностен",
};

export function Pricing() {
  return (
    <section id="pricing" className="bg-card/50 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="flex flex-col items-center text-center"
        >
          <Eyebrow>Прозрачни цени</Eyebrow>
          <h2 className="mt-5 font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
            Избери своя спомен
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Виждаш готовия постер, преди да платиш. Плащаш чак при доставка.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {AVAILABLE_PRODUCTS.map((id, i) => {
            const product = PRODUCTS[id];
            const featured = id === "POSTER_A3";
            return (
              <motion.div
                key={id}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
                className={`relative flex flex-col rounded-3xl p-7 ${
                  featured
                    ? "elevate-lg bg-gradient-to-b from-primary/10 to-lavender/40 ring-2 ring-primary lg:-mt-4 lg:mb-4"
                    : "glass lift"
                }`}
              >
                {TAGLINE[id] && (
                  <Badge
                    className={`absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full ${
                      featured ? "" : "bg-foreground text-background"
                    }`}
                  >
                    {TAGLINE[id]}
                  </Badge>
                )}
                <h3 className="font-heading text-lg font-bold">{product.name}</h3>
                <p className="mt-2 min-h-10 text-sm text-muted-foreground">
                  {product.description}
                </p>
                <p className="mt-5 font-heading text-4xl font-extrabold">
                  {formatPrice(product.priceEUR)}
                </p>
                <ul className="mt-5 flex-1 space-y-2.5">
                  {product.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  variant={featured ? "default" : "outline"}
                  className="mt-7 h-12 rounded-full"
                >
                  <Link href="/create">Избери</Link>
                </Button>
              </motion.div>
            );
          })}
        </div>

        <AddonsStrip />

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-10 flex items-center justify-center gap-2 text-sm text-muted-foreground"
        >
          <ShieldCheck className="size-4 text-primary" />
          Доставка {formatPrice(DELIVERY.feeEUR)} с Еконт или Спиди · безплатна над{" "}
          {formatPrice(DELIVERY.freeAboveEUR)} · плащане при получаване
        </motion.p>
      </div>
    </section>
  );
}
