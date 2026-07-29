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
    tint: "bg-sky/60 text-sky-950/70",
  },
  {
    icon: MessageSquareHeart,
    title: "Добави думичките",
    text: "Истинската дума и как я казва детето. И двете влизат на постера.",
    tint: "bg-blush/60 text-rose-950/70",
  },
  {
    icon: Eye,
    title: "Виж го готов",
    text: "За около 2 минути. Безплатно, без карта — ако не ти хареса, просто не поръчваш.",
    tint: "bg-mint/60 text-emerald-950/70",
  },
  {
    icon: Truck,
    title: "Плащаш при доставка",
    text: "Отпечатваме и изпращаме с Еконт или Спиди. Плащаш на куриера.",
    tint: "bg-sun/60 text-amber-950/70",
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
              className="glass lift relative rounded-3xl p-8 text-center"
            >
              <span className="absolute -top-4 left-1/2 grid size-8 -translate-x-1/2 place-items-center rounded-full bg-primary font-heading text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30">
                {i + 1}
              </span>
              <div
                className={`mx-auto grid size-16 place-items-center rounded-2xl ${step.tint}`}
              >
                <step.icon className="size-7" />
              </div>
              <h3 className="mt-6 font-heading text-xl font-bold">{step.title}</h3>
              <p className="mt-3 text-muted-foreground">{step.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
