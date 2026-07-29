"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Magnetic } from "@/components/site/magnetic";

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
          <p className="font-heading text-2xl font-bold leading-relaxed sm:text-3xl">
            Децата растат толкова бързо.
            <br />
            Днес чуваме техните смешни думи.
            <br />
            Утре вече ги няма.
          </p>
          <p className="mt-6 text-xl text-muted-foreground">
            Запази тези малки моменти завинаги ❤️
          </p>
          <Magnetic className="mt-10">
            <Button
              asChild
              size="lg"
              className="h-14 rounded-full px-10 text-lg shadow-xl shadow-primary/30"
            >
              <Link href="/create">
                Създай моя спомен
                <Heart className="ml-1 size-5 fill-current" />
              </Link>
            </Button>
          </Magnetic>
        </motion.div>
      </div>
    </section>
  );
}
