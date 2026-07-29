"use client";

// Factual claims only — no invented counts or ratings. Real review numbers
// come from the DB via the Testimonials section.
import { motion } from "framer-motion";
import { Eye, RefreshCw, Truck, Wallet } from "lucide-react";

const FACTS = [
  { icon: Eye, value: "Виж, после плати", label: "готовият постер преди поръчка" },
  { icon: Wallet, value: "При доставка", label: "плащаш, щом го получиш" },
  { icon: RefreshCw, value: "Безплатна корекция", label: "докато не стане както искаш" },
  { icon: Truck, value: "Еконт и Спиди", label: "до офис, адрес или автомат" },
];

export function SocialProof() {
  return (
    <section className="border-y border-border/60 bg-card/40 py-10">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-6 sm:grid-cols-4">
        {FACTS.map((f, i) => (
          <motion.div
            key={f.value}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="flex flex-col items-center gap-1 text-center"
          >
            <f.icon className="size-6 text-primary" />
            <span className="font-heading text-lg font-extrabold tracking-tight">
              {f.value}
            </span>
            <span className="text-sm text-muted-foreground">{f.label}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
