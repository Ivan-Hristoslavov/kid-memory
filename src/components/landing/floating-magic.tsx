"use client";

import { motion } from "framer-motion";
import { Cloud, Heart, Sparkles, Star } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Item {
  Icon: LucideIcon;
  x: string;
  y: string;
  size: string;
  color: string;
  duration: number;
  delay: number;
}

/**
 * Subtle ambient decorations. Kept to the outer margins and low opacity so
 * they never compete with the headline or the poster.
 */
const ITEMS: Item[] = [
  { Icon: Cloud, x: "4%", y: "12%", size: "size-8", color: "text-sky", duration: 11, delay: 0 },
  { Icon: Star, x: "10%", y: "72%", size: "size-5", color: "text-sun", duration: 9, delay: 1.2 },
  { Icon: Sparkles, x: "93%", y: "20%", size: "size-5", color: "text-lavender", duration: 8, delay: 0.6 },
  { Icon: Heart, x: "95%", y: "78%", size: "size-5", color: "text-blush", duration: 10, delay: 1.8 },
];

export function FloatingMagic() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 hidden overflow-hidden lg:block">
      {ITEMS.map((item, i) => (
        <motion.span
          key={i}
          className={`absolute ${item.color}`}
          style={{ left: item.x, top: item.y }}
          animate={{ y: [0, -12, 0] }}
          transition={{
            duration: item.duration,
            delay: item.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <item.Icon className={`${item.size} fill-current opacity-30`} />
        </motion.span>
      ))}
    </div>
  );
}
