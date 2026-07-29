"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ADDONS, formatPrice } from "@/lib/catalog";
import { Eyebrow } from "./shared";

const POINTS = [
  "Премиум матова хартия 250 г, наситени цветове",
  "Формати A4 и A3 — за рамка над леглото или до бюрото",
  `Дървена рамка по избор (+${formatPrice(ADDONS.FRAME.priceEUR)})`,
  "Опаковано като подарък, готово за връчване",
];

export function OnTheWall() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  // The frame drifts slower than the page, so the room behind it gains depth as
  // you scroll past. Small range on purpose — a big shift reads as a glitch.
  const imageY = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);

  return (
    <section ref={sectionRef} className="bg-card/50 py-24 sm:py-32">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="elevate-lg relative overflow-hidden rounded-[2rem]"
        >
          <motion.div style={{ y: imageY }} className="scale-110">
            <Image
              src="/samples/wall.webp"
              alt="Персонализиран детски постер в рамка на стената в детска стая"
              width={1200}
              height={800}
              sizes="(max-width: 1024px) 92vw, 560px"
              className="w-full"
            />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          <Eyebrow>На стената</Eyebrow>
          <h2 className="mt-5 font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
            Спомен, който се вижда всеки ден
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Не е файл, който потъва в телефона. Виси в детската стая и връща усмивката
            всеки път, когато минеш покрай него.
          </p>

          <ul className="mt-8 space-y-3">
            {POINTS.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
                  <Check className="size-3.5" />
                </span>
                <span className="text-foreground/85">{p}</span>
              </li>
            ))}
          </ul>

          <Button
            asChild
            size="lg"
            className="mt-9 h-13 rounded-full px-8 text-base shadow-lg shadow-primary/25"
          >
            <Link href="/create">Създай своя постер</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
