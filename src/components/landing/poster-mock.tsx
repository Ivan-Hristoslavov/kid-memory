"use client";

import { motion } from "framer-motion";
import { ChildIllustration, type ChildVariant } from "./child-illustration";

interface Bubble {
  text: string;
  x: string;
  y: string;
  rotate: number;
  color: string;
}

const DEFAULT_BUBBLES: Bubble[] = [
  { text: "Прахумосмачка", x: "-8%", y: "26%", rotate: -6, color: "bg-blush" },
  { text: "Аляяяя", x: "76%", y: "40%", rotate: 5, color: "bg-sky" },
  { text: "Апум", x: "-4%", y: "62%", rotate: 4, color: "bg-mint" },
];

/**
 * A framed sample poster — the child as the illustrated hero with their funny
 * words as speech bubbles. Reused in the hero and the showcase gallery.
 */
export function PosterMock({
  name = "Мила",
  variant,
  bubbles = DEFAULT_BUBBLES,
  bg = "bg-dreamy",
  className = "",
}: {
  name?: string;
  variant?: ChildVariant;
  bubbles?: Bubble[];
  bg?: string;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28, rotate: -2 }}
      whileInView={{ opacity: 1, y: 0, rotate: -1.5 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.9, ease: "easeOut" }}
      className={`relative w-full max-w-sm ${className}`}
    >
      <div
        aria-hidden
        className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-tr from-blush via-lavender to-sky opacity-60 blur-3xl"
      />

      <div className="rounded-[1.6rem] bg-white p-3 shadow-2xl shadow-plum/25 ring-1 ring-black/5">
        <div className={`relative overflow-hidden rounded-[1.1rem] px-4 pb-6 pt-7 ${bg}`}>
          <p className="text-center font-heading text-lg font-extrabold leading-tight text-foreground/85">
            Най-сладките думички
            <br />
            <span className="text-gradient-warm">на {name}</span>
          </p>
          <div className="mt-2 flex justify-center">
            <ChildIllustration variant={variant} />
          </div>
        </div>
      </div>

      {bubbles.map((b, i) => (
        <motion.div
          key={b.text}
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1, y: [0, -6, 0] }}
          viewport={{ once: true }}
          transition={{
            opacity: { duration: 0.5, delay: 0.2 + i * 0.15 },
            scale: { duration: 0.5, delay: 0.2 + i * 0.15 },
            y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 },
          }}
          style={{ left: b.x, top: b.y, rotate: `${b.rotate}deg` }}
          className={`absolute ${b.color} rounded-2xl rounded-bl-md px-4 py-2 shadow-lg ring-1 ring-black/5`}
        >
          <span className="font-heading text-sm font-bold text-foreground/80">„{b.text}“</span>
        </motion.div>
      ))}
    </motion.div>
  );
}
