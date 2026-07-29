"use client";

import { Star } from "lucide-react";

/** Row of star icons; supports half via fractional `value`. */
export function StarRating({
  value = 5,
  className = "size-4",
}: {
  value?: number;
  className?: string;
}) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} от 5 звезди`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < Math.round(value);
        return (
          <Star
            key={i}
            className={`${className} ${filled ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"}`}
          />
        );
      })}
    </span>
  );
}

/** Small pill label shown above section headings. */
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-sm font-bold uppercase tracking-wide text-secondary-foreground">
      {children}
    </span>
  );
}

const AVATAR_GRADIENTS = [
  "from-blush to-peach",
  "from-sky to-mint",
  "from-lavender to-sky",
  "from-peach to-sun",
  "from-mint to-sky",
  "from-blush to-lavender",
];

/** Colorful initials avatar — no real photos, deterministic colour per name. */
export function Avatar({ name, className = "size-11" }: { name: string; className?: string }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const idx = name.charCodeAt(0) % AVATAR_GRADIENTS.length;
  return (
    <span
      className={`grid ${className} shrink-0 place-items-center rounded-full bg-gradient-to-br ${AVATAR_GRADIENTS[idx]} font-heading text-sm font-bold text-white/90 shadow-inner ring-2 ring-white`}
    >
      {initials}
    </span>
  );
}
