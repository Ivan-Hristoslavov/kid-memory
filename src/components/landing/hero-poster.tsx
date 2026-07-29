"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { BadgeCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { STYLES } from "@/lib/catalog";

/**
 * Fanned deck of sample posters in the hero.
 *
 * A single static poster showed one style and left the other five invisible
 * until far down the page. The deck puts the whole range above the fold and
 * gives the hero motion without being a slideshow that hides content.
 *
 * Cards advance on their own, pause while the pointer is over the deck, and can
 * be driven by the arrows, the dots, or by clicking a card at the side.
 */
const AUTOPLAY_MS = 4200;

/**
 * Depth, offset and tilt per position relative to the front card. The spread is
 * deliberately tight — a wider fan pushed the outer cards across the hero
 * headline in the neighbouring column.
 */
const SLOTS: Record<number, { x: string; scale: number; rotate: number; opacity: number }> = {
  0: { x: "0%", scale: 1, rotate: 0, opacity: 1 },
  1: { x: "44%", scale: 0.82, rotate: 6, opacity: 0.85 },
  2: { x: "74%", scale: 0.66, rotate: 10, opacity: 0.4 },
  [-1]: { x: "-44%", scale: 0.82, rotate: -6, opacity: 0.85 },
  [-2]: { x: "-74%", scale: 0.66, rotate: -10, opacity: 0.4 },
};

export function HeroPoster() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = STYLES.length;

  const go = useCallback(
    (dir: 1 | -1) => setActive((i) => (i + dir + total) % total),
    [total]
  );

  // Honour the OS "reduce motion" setting — an endlessly moving hero is exactly
  // what that preference exists to stop.
  const reduced = useRef(false);
  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (paused || reduced.current) return;
    const t = setInterval(() => go(1), AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [paused, go]);

  /** Shortest signed distance from the front card, so the deck wraps around. */
  function offsetOf(index: number): number {
    const raw = index - active;
    const half = Math.floor(total / 2);
    if (raw > half) return raw - total;
    if (raw < -half) return raw + total;
    return raw;
  }

  return (
    <div
      className="relative w-full max-w-[21rem]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div
        aria-hidden
        className="absolute -inset-10 -z-10 rounded-[3rem] bg-gradient-to-tr from-blush via-lavender to-sky opacity-50 blur-3xl"
      />

      <div className="relative aspect-[2/3] w-full [perspective:1600px]">
        {STYLES.map((style, i) => {
          const offset = offsetOf(i);
          const slot = SLOTS[offset];
          const isFront = offset === 0;

          return (
            <motion.div
              key={style.id}
              className="absolute inset-0"
              initial={false}
              animate={{
                x: slot?.x ?? "0%",
                scale: slot?.scale ?? 0.6,
                rotate: slot?.rotate ?? 0,
                opacity: slot ? slot.opacity : 0,
                zIndex: 10 - Math.abs(offset),
              }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              style={{ pointerEvents: slot ? "auto" : "none" }}
            >
              <button
                type="button"
                // Side cards act as "bring this one forward"; the front card is
                // not a control, so it stays out of the tab order.
                tabIndex={isFront ? -1 : 0}
                aria-hidden={isFront}
                aria-label={`Покажи стил ${style.name}`}
                onClick={() => !isFront && setActive(i)}
                className={`block h-full w-full ${isFront ? "cursor-default" : "cursor-pointer"}`}
              >
                <div
                  className={`h-full overflow-hidden rounded-[1.5rem] bg-white p-3 ring-1 ring-black/5 ${
                    isFront ? "elevate-lg" : "elevate"
                  }`}
                >
                  <div className="relative h-full overflow-hidden rounded-[1rem]">
                    <Image
                      src={`/samples/${style.id}.webp`}
                      alt={`Примерен постер в стил ${style.name}`}
                      fill
                      priority={i === 0}
                      sizes="(max-width: 1024px) 85vw, 336px"
                      className="object-cover"
                    />
                    {!isFront && <div className="absolute inset-0 bg-plum/15" />}
                  </div>
                </div>
              </button>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        // Top-left of the deck: the bottom-right corner is now occupied by the
        // carousel controls and the style caption.
        className="glass-solid absolute -top-3 -left-2 z-20 flex items-center gap-2 rounded-full py-2 pl-3 pr-4"
      >
        <BadgeCheck className="size-5 text-primary" />
        <span className="text-sm font-bold">Готов за рамка</span>
      </motion.div>

      {/* Controls sit under the deck so they never cover the artwork. */}
      <div className="relative z-20 mt-7 flex items-center justify-center gap-3">
        <DeckButton label="Предишен стил" onClick={() => go(-1)}>
          <ChevronLeft className="size-4" />
        </DeckButton>

        <div className="flex items-center gap-1.5">
          {STYLES.map((style, i) => (
            <button
              key={style.id}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Покажи стил ${style.name}`}
              aria-current={i === active}
              className={`h-2 rounded-full transition-all ${
                i === active ? "w-6 bg-primary" : "w-2 bg-foreground/20 hover:bg-foreground/40"
              }`}
            />
          ))}
        </div>

        <DeckButton label="Следващ стил" onClick={() => go(1)}>
          <ChevronRight className="size-4" />
        </DeckButton>
      </div>

      <p
        aria-live="polite"
        className="relative z-20 mt-3 text-center text-sm font-semibold text-muted-foreground"
      >
        {STYLES[active].name}
      </p>

      <div aria-hidden className="grounded" />
    </div>
  );
}

function DeckButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="glass-solid grid size-9 place-items-center rounded-full text-foreground/70 transition-colors hover:text-foreground"
    >
      {children}
    </button>
  );
}
