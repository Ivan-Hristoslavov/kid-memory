"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

import { FAQ_ITEMS as ITEMS } from "@/lib/faq";

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="py-24 sm:py-28">
      <div className="mx-auto max-w-3xl px-6">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="text-center font-heading text-4xl font-extrabold tracking-tight sm:text-5xl"
        >
          Често задавани въпроси
        </motion.h2>

        <div className="mt-12 space-y-3">
          {ITEMS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div
                key={item.q}
                className="glass overflow-hidden rounded-2xl transition-shadow hover:shadow-lg"
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="font-heading font-bold">{item.q}</span>
                  <ChevronDown
                    className={`size-5 shrink-0 text-muted-foreground transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <p className="px-6 pb-5 text-muted-foreground">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
