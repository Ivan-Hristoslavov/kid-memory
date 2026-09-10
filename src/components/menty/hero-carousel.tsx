"use client";

import { useCallback, useEffect, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/hooks/use-client-value";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { HERO_SLIDES } from "@/lib/brand";

const AUTOPLAY_MS = 5000;

/**
 * The hero visual: real product mock-ups rotating, each carrying an example
 * design.
 *
 * It replaced a single branded gift-box photograph. That shot said what our
 * packaging looks like; it never said what a customer receives. A mug with a
 * family on it, a framed print, a printed tee — those answer the question the
 * hero is actually being asked, and rotating them shows the range without a
 * second section.
 *
 * Autoplay pauses on hover and focus, and stops entirely under
 * `prefers-reduced-motion` — an endlessly moving hero is exactly what that
 * setting exists to stop. Each slide links to the product it shows.
 */
export function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = usePrefersReducedMotion();
  const total = HERO_SLIDES.length;

  const go = useCallback(
    (dir: 1 | -1) => setIndex((i) => (i + dir + total) % total),
    [total]
  );

  useEffect(() => {
    if (paused || reduced) return;
    const t = setInterval(() => go(1), AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [paused, reduced, go]);

  const slide = HERO_SLIDES[index];

  return (
    <div
      className="group relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-sand ring-1 ring-border lg:aspect-[3/2]">
        <AnimatePresence mode="sync">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            {/* `fill` measures against the nearest positioned ancestor, and a
                bare <Link> is static — Next warns about exactly this. */}
            <Link
              href={slide.href}
              aria-label={slide.label}
              className="relative block h-full w-full"
            >
              <Image
                src={slide.image}
                alt={slide.label}
                fill
                priority={index === 0}
                sizes="(max-width: 1024px) 100vw, 640px"
                /* A poster is a tall artwork with lettering along its top and
                   bottom edges — cropping it to a landscape frame cuts the
                   title off, which is the whole point of the sample. Product
                   mock-ups are shot for this frame and fill it. */
                className={
                  "portrait" in slide && slide.portrait
                    ? "object-contain p-4"
                    : "object-cover"
                }
              />
            </Link>
          </motion.div>
        </AnimatePresence>

        {/* The label names what is on screen, so the rotation reads as a
            product range rather than as decorative movement. */}
        <AnimatePresence mode="wait">
          <motion.span
            key={slide.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className="pointer-events-none absolute bottom-3 left-3 rounded-lg bg-background/90 px-3 py-1.5 text-xs font-semibold text-foreground backdrop-blur-sm"
          >
            {slide.label}
          </motion.span>
        </AnimatePresence>

        <Arrow side="left" onClick={() => go(-1)} />
        <Arrow side="right" onClick={() => go(1)} />
      </div>

      <div className="mt-3 flex items-center justify-center gap-1.5">
        {HERO_SLIDES.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={s.label}
            aria-current={i === index}
            className={`h-1.5 rounded-full transition-all ${
              i === index ? "w-6 bg-foreground" : "w-1.5 bg-foreground/25 hover:bg-foreground/45"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function Arrow({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Предишен" : "Следващ"}
      className={`absolute top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-background/85 text-foreground/70 opacity-0 shadow-sm backdrop-blur-sm transition hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100 ${
        side === "left" ? "left-3" : "right-3"
      }`}
    >
      <Icon className="size-4" />
    </button>
  );
}
