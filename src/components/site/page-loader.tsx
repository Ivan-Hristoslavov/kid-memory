"use client";

import { motion } from "framer-motion";
import { Heart } from "lucide-react";

/** Branded full-viewport loader shown during route/server loads. */
export function PageLoader({ label = "Зареждаме..." }: { label?: string }) {
  return (
    <div className="bg-dreamy flex min-h-[70vh] flex-1 flex-col items-center justify-center gap-6">
      <motion.span
        animate={{ scale: [1, 1.18, 1] }}
        transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
        className="grid size-20 place-items-center rounded-full bg-primary/10 text-primary shadow-lg shadow-primary/10"
      >
        <Heart className="size-9 fill-current" />
      </motion.span>
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="size-2.5 rounded-full bg-primary/70"
            animate={{ y: [0, -7, 0], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
      <p className="font-heading text-sm font-semibold text-muted-foreground">{label}</p>
    </div>
  );
}
