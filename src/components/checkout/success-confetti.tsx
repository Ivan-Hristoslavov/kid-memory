"use client";

import { motion } from "framer-motion";
import { Heart, Sparkles, Star } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const PIECES: { Icon: LucideIcon; color: string }[] = [
  { Icon: Heart, color: "text-primary/70" },
  { Icon: Star, color: "text-sun" },
  { Icon: Sparkles, color: "text-lavender" },
  { Icon: Heart, color: "text-blush" },
  { Icon: Star, color: "text-mint" },
  { Icon: Sparkles, color: "text-sky" },
];

export function SuccessConfetti() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 18 }).map((_, i) => {
        const piece = PIECES[i % PIECES.length];
        return (
          <motion.span
            key={i}
            className={`absolute ${piece.color}`}
            style={{ left: `${(i * 53) % 100}%`, top: "-5%" }}
            animate={{ y: ["0vh", "110vh"], rotate: [0, i % 2 === 0 ? 260 : -260] }}
            transition={{
              duration: 6 + (i % 5),
              delay: i * 0.35,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <piece.Icon className="size-6 fill-current opacity-70" />
          </motion.span>
        );
      })}
    </div>
  );
}
