"use client";

import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";

const PHASES = [
  "Разглеждаме снимката",
  "Скицираме героя",
  "Смесваме боите",
  "Рисуваме магичния свят",
  "Изписваме думичките",
  "Последни щрихи",
];

/** Colour washes that fade in one after another, like paint layers. */
const WASHES = [
  { className: "bg-[radial-gradient(60%_50%_at_50%_75%,#bfe3c0,transparent)]", delay: 0.2 },
  { className: "bg-[radial-gradient(70%_45%_at_50%_25%,#bfe0f5,transparent)]", delay: 1.0 },
  { className: "bg-[radial-gradient(45%_35%_at_30%_55%,#f7d7c4,transparent)]", delay: 1.8 },
  { className: "bg-[radial-gradient(40%_30%_at_72%_45%,#e6d4f5,transparent)]", delay: 2.6 },
  { className: "bg-[radial-gradient(35%_25%_at_50%_50%,#ffe9b8,transparent)]", delay: 3.4 },
];

/** Typical end-to-end generation time; only used to frame the wait. */
const TYPICAL_SECONDS = 50;

export function GeneratingScene({
  phase,
  name,
  elapsed = 0,
}: {
  phase: number;
  name: string;
  /** Seconds since the request started, so the wait has a visible pulse. */
  elapsed?: number;
}) {
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-8 py-4 text-center">
      {/* the canvas painting itself */}
      <div className="relative">
        <motion.div
          aria-hidden
          className="absolute -inset-10 -z-10 rounded-full bg-gradient-to-tr from-blush via-lavender to-sky blur-3xl"
          animate={{ opacity: [0.35, 0.65, 0.35], scale: [0.95, 1.08, 0.95] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          initial={{ opacity: 0, y: 14, rotate: -2 }}
          animate={{ opacity: 1, y: 0, rotate: -1.5 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="rounded-[1.4rem] bg-white p-2.5 shadow-2xl shadow-plum/25 ring-1 ring-black/5"
        >
          <div className="relative aspect-[2/3] w-52 overflow-hidden rounded-[1rem] bg-[#fdfaf4]">
            {WASHES.map((w, i) => (
              <motion.div
                key={i}
                className={`absolute inset-0 ${w.className}`}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 0.85, scale: 1 }}
                transition={{ duration: 1.4, delay: w.delay, ease: "easeOut" }}
              />
            ))}

            {/* brush sweep */}
            <motion.div
              className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/70 to-transparent"
              animate={{ x: ["-120%", "320%"] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* rising sparkles */}
            {Array.from({ length: 7 }).map((_, i) => (
              <motion.span
                key={i}
                className="absolute text-primary/70"
                style={{ left: `${10 + i * 12}%`, bottom: "-10%" }}
                animate={{ y: [0, -230], opacity: [0, 0.9, 0], rotate: [0, 90] }}
                transition={{
                  duration: 3.2 + (i % 3) * 0.6,
                  repeat: Infinity,
                  delay: i * 0.45,
                  ease: "easeOut",
                }}
              >
                <Sparkles className="size-3.5 fill-current" />
              </motion.span>
            ))}

            {/* a suggestion of the child taking shape */}
            <motion.svg
              viewBox="0 0 100 150"
              className="absolute inset-0 h-full w-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ duration: 2, delay: 2.2 }}
            >
              <motion.circle
                cx="50"
                cy="72"
                r="20"
                fill="none"
                stroke="#b98cd6"
                strokeWidth="1.4"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2.4, delay: 2.2, ease: "easeInOut" }}
              />
              <motion.path
                d="M30 118 q20 -22 40 0"
                fill="none"
                stroke="#e07189"
                strokeWidth="1.4"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, delay: 3.2, ease: "easeInOut" }}
              />
            </motion.svg>
          </div>
        </motion.div>
      </div>

      {/* phase checklist */}
      <ul className="w-full space-y-2 text-left">
        {PHASES.map((p, i) => {
          const done = i < phase;
          const active = i === phase;
          return (
            <motion.li
              key={p}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: done || active ? 1 : 0.35, x: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-3"
            >
              <span
                className={`grid size-6 shrink-0 place-items-center rounded-full transition-colors ${
                  done
                    ? "bg-primary text-primary-foreground"
                    : active
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {done ? (
                  <Check className="size-3.5" />
                ) : active ? (
                  <motion.span
                    className="size-2 rounded-full bg-current"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 1.1, repeat: Infinity }}
                  />
                ) : (
                  <span className="size-2 rounded-full bg-current opacity-40" />
                )}
              </span>
              <span
                className={`text-sm ${
                  active ? "font-heading font-bold" : "text-muted-foreground"
                }`}
              >
                {p}
              </span>
            </motion.li>
          );
        })}
      </ul>

      {/* A silent wait of this length reads as a hang, so show it ticking. */}
      <div className="w-full max-w-xs">
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-primary"
            animate={{
              width: `${Math.min(95, (elapsed / TYPICAL_SECONDS) * 100)}%`,
            }}
            transition={{ ease: "linear", duration: 0.5 }}
          />
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {elapsed}s · обикновено около {TYPICAL_SECONDS}s
        </p>
      </div>

      <p className="text-sm text-muted-foreground">
        Създаваме илюстрацията на <strong className="text-foreground">{name}</strong>.
        {elapsed > TYPICAL_SECONDS + 25
          ? " Отнема повече от обикновено — още сме на линия, не затваряй страницата."
          : " Обикновено под минута — при натоварване опитваме автоматично отново."}
      </p>
    </div>
  );
}

export const GENERATING_PHASES = PHASES.length;
