"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice, lowestPriceEUR } from "@/lib/catalog";
import { getConsent } from "./cookie-consent";

/** Sticky bottom call-to-action on mobile — keeps ordering one tap away. */
export function MobileCta() {
  const [show, setShow] = useState(false);
  // Don't stack under the cookie banner — wait until the visitor answered it.
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    setConsented(Boolean(getConsent()));
    const onConsent = () => setConsented(true);
    window.addEventListener("biserite:consent", onConsent);
    const onScroll = () => setShow(window.scrollY > 620);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("biserite:consent", onConsent);
    };
  }, []);

  return (
    <AnimatePresence>
      {show && consented && (
        <motion.div
          initial={{ y: 90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 90, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed inset-x-0 bottom-0 z-40 p-3 sm:hidden"
        >
          <div className="glass flex items-center justify-between gap-3 rounded-full py-2 pl-5 pr-2 shadow-2xl shadow-plum/20">
            <span className="text-sm font-bold">
              от {formatPrice(lowestPriceEUR())}{" "}
              <span className="text-muted-foreground">· при доставка</span>
            </span>
            <Button asChild className="rounded-full shadow-lg shadow-primary/25">
              <Link href="/create">
                Създай <Heart className="size-4 fill-current" />
              </Link>
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
