"use client";

import { motion } from "framer-motion";
import { Copy, Frame, Gift, Layers } from "lucide-react";
import { ADDONS, ADDON_ORDER, formatPrice } from "@/lib/catalog";

const ICONS = { Frame, Layers, Gift, Copy } as const;

/** Upsell strip — shows the optional finishing touches available at checkout. */
export function AddonsStrip() {
  return (
    <div className="mt-14">
      <p className="text-center text-sm font-bold uppercase tracking-wide text-muted-foreground">
        Добави при поръчка
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {ADDON_ORDER.map((id, i) => {
          const a = ADDONS[id];
          const Icon = ICONS[a.icon as keyof typeof ICONS];
          return (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="glass lift flex items-center gap-4 rounded-2xl p-5"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground">
                <Icon className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="font-heading font-bold leading-tight">{a.name}</p>
                <p className="text-sm text-muted-foreground">{a.description}</p>
              </div>
              {/* Percentage add-ons have no single price outside checkout,
                  where the format is known — show the discount instead. */}
              <span className="ml-auto shrink-0 font-heading font-bold text-primary">
                {"discountOfBase" in a && a.discountOfBase
                  ? `−${Math.round(a.discountOfBase * 100)}%`
                  : `+${formatPrice(a.priceEUR)}`}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
