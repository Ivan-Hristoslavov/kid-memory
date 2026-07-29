"use client";

import { useRef, useState } from "react";

/**
 * Wraps the primary call to action so it leans very slightly toward the cursor
 * and lights up behind. The button is the single element the whole page exists
 * to get clicked, so it is the one place a little extra attention pays for
 * itself — the pull is only a few pixels, enough to feel responsive without
 * turning into a moving target you have to chase.
 *
 * Mouse only, and inert under `prefers-reduced-motion`.
 */
const PULL = 0.22; // fraction of the cursor's offset from centre
const MAX_PX = 10;

export function Magnetic({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [glow, setGlow] = useState(false);

  function handleMove(e: React.PointerEvent<HTMLSpanElement>) {
    if (e.pointerType !== "mouse") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    setOffset({
      x: Math.max(-MAX_PX, Math.min(MAX_PX, dx * PULL)),
      y: Math.max(-MAX_PX, Math.min(MAX_PX, dy * PULL)),
    });
  }

  return (
    <span
      ref={ref}
      onPointerMove={handleMove}
      onPointerEnter={() => setGlow(true)}
      onPointerLeave={() => {
        setOffset({ x: 0, y: 0 });
        setGlow(false);
      }}
      className={`relative inline-flex ${className}`}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-4 -z-10 rounded-full bg-primary/35 blur-2xl transition-opacity duration-500"
        style={{ opacity: glow ? 1 : 0 }}
      />
      <span
        className="inline-flex"
        style={{
          transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
          transition: glow ? "transform 150ms ease-out" : "transform 450ms cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        {children}
      </span>
    </span>
  );
}
