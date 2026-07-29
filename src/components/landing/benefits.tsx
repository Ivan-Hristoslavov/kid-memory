"use client";

import { motion } from "framer-motion";
import { Frame, Gift, Palette, Sparkles } from "lucide-react";

const BENEFITS = [
  {
    icon: Sparkles,
    title: "Уникално за твоето дете",
    text: "Илюстрация по лицето и думите на детето — няма втора същата на света.",
    tint: "bg-blush/50",
  },
  {
    icon: Palette,
    title: "Ти избираш стила",
    text: "Детска книжка, 3D анимация, акварел или фентъзи — както го виждаш ти.",
    tint: "bg-sky/50",
  },
  {
    icon: Frame,
    title: "Готово за рамка",
    text: "Премиум печат на матова хартия, който красиви всяка детска стая.",
    tint: "bg-mint/50",
  },
  {
    icon: Gift,
    title: "Подаръкът, който трогва",
    text: "За рожден ден, кръщене или просто защото порастват прекалено бързо.",
    tint: "bg-sun/50",
  },
];

export function Benefits() {
  return (
    <section className="py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="text-center font-heading text-4xl font-extrabold tracking-tight sm:text-5xl"
        >
          Защо родителите го обичат
        </motion.h2>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="glass rounded-3xl p-7 text-center"
            >
              <div
                className={`mx-auto grid size-14 place-items-center rounded-2xl ${b.tint} text-foreground/70`}
              >
                <b.icon className="size-6" />
              </div>
              <h3 className="mt-5 font-heading text-lg font-bold">{b.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{b.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
