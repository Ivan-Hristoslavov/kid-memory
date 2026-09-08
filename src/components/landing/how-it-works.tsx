"use client";

import { motion } from "framer-motion";
import { Camera, Eye, MessageSquareHeart, Truck } from "lucide-react";

// Step 3 used to be "Получи спомен", which quietly skipped the free preview —
// the one thing the competition can't match. It gets its own step now.
const STEPS = [
  {
    icon: Camera,
    title: "Качи снимка",
    text: "Ясна, цветна снимка отблизо — по нея създаваме уникалната илюстрация.",
  },
  {
    icon: MessageSquareHeart,
    title: "Добави думичките",
    text: "Репликите, думичките или данните, които правят този постер негов. Влизат в балончетата.",
  },
  {
    icon: Eye,
    title: "Виж го готов",
    text: "За около 2 минути. Безплатно, без карта — ако не ти хареса, просто не поръчваш.",
  },
  {
    icon: Truck,
    title: "Плащаш при доставка",
    text: "Отпечатваме и изпращаме с Еконт или Спиди. Плащаш на куриера.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="aura-cool bg-card/50 py-24 sm:py-32">
      <div className="mx-auto max-w-5xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="text-center"
        >
          <h2 className="font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
            Как работи
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Четири малки стъпки — и плащаш чак на последната.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="lift relative rounded-xl bg-card p-8 text-center ring-1 ring-border/70"
            >
              <span className="absolute -top-4 left-1/2 grid size-8 -translate-x-1/2 place-items-center rounded-full bg-primary font-heading text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30">
                {i + 1}
              </span>
              {/* One ink-on-paper plate for all four steps. A different pastel
                  per step read as a nursery chart, not as a process. */}
              <div className="mx-auto grid size-16 place-items-center rounded-xl bg-secondary text-foreground/70 ring-1 ring-border/60">
                <step.icon className="size-7" />
              </div>
              <h3 className="mt-6 font-heading text-xl font-bold">{step.title}</h3>
              <p className="mt-3 text-muted-foreground">{step.text}</p>
            </motion.div>
          ))}
        </div>

        {/* Carried over from the section that used to sit above this one and
            said the same four things in different words. This line is the part
            that was worth keeping. */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-16 text-center"
        >
          <p className="font-heading text-2xl font-bold sm:text-3xl">
            Виждаш готовия постер, преди да платиш.
          </p>
          <p className="mt-2 text-lg text-muted-foreground">
            Без карта, без абонамент. Не ти хареса —{" "}
            <span className="text-gradient-warm">не поръчваш.</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
