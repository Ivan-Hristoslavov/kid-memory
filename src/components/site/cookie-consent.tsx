"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";

const KEY = "biserite-consent";

export type ConsentValue = "all" | "essential";

/** Reads the stored choice — analytics scripts check this before loading. */
export function getConsent(): ConsentValue | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(KEY);
  return v === "all" || v === "essential" ? v : null;
}

/**
 * GDPR/ePrivacy banner. Nothing beyond strictly necessary cookies runs until
 * the visitor accepts — declining is exactly one click, same as accepting.
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!getConsent()) setVisible(true);
  }, []);

  function choose(value: ConsentValue) {
    localStorage.setItem(KEY, value);
    setVisible(false);
    window.dispatchEvent(new CustomEvent("biserite:consent", { detail: value }));
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="fixed inset-x-0 bottom-0 z-50 p-4 sm:bottom-4 sm:left-4 sm:right-auto sm:max-w-md"
          role="dialog"
          aria-label="Съгласие за бисквитки"
        >
          <div className="glass rounded-3xl p-6 shadow-2xl shadow-plum/20">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground">
                <Cookie className="size-5" />
              </span>
              <div>
                <p className="font-heading font-bold">Използваме бисквитки</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Задължителните са нужни, за да работи сайтът. С твое съгласие ползваме и
                  анонимна статистика и рекламни бисквитки.{" "}
                  <Link href="/biskvitki" className="font-semibold text-primary underline">
                    Научи повече
                  </Link>
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Button onClick={() => choose("all")} className="flex-1 rounded-full">
                Приемам всички
              </Button>
              <Button
                onClick={() => choose("essential")}
                variant="outline"
                className="flex-1 rounded-full"
              >
                Само задължителни
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
