"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * The last thing on the page.
 *
 * It used to read "Децата растат толкова бързо. Днес чуваме техните смешни
 * думи." — beautiful, and addressed to a parent, which is exactly the audience
 * the shop stopped being only for. Somebody buying a leaving gift for a
 * colleague reached the bottom of the page and was told the product is about
 * their toddler.
 *
 * The replacement keeps the emotional shape — something passes, something
 * stays — without naming who the visitor is.
 */
export function FinalCta() {
  return (
    <section className="bg-dreamy relative overflow-hidden py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8 }}
        >
          <p className="text-balance font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            Поводът минава.
            <br />
            Подаръкът остава на стената.
          </p>
          <p className="mx-auto mt-6 max-w-xl text-pretty text-lg text-muted-foreground">
            След седмица никой не помни кой какво е подарил. Освен този подарък —
            защото на него е неговото лице и неговите думи.
          </p>
          <Button
            asChild
            size="lg"
            className="group mt-10 h-14 rounded-full px-10 text-lg shadow-xl shadow-primary/30"
          >
            <Link href="/create">
              Създай постер
              <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
          <p className="mt-4 text-sm text-muted-foreground">
            Безплатно, без карта. Плащаш чак при доставка.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
