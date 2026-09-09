import { Star } from "lucide-react";

/**
 * A rating, in the brand's clay rather than the generic amber every shop uses.
 *
 * Rounds to the nearest whole star rather than drawing halves: at the sizes
 * this appears in, a half star reads as a rendering artefact, and the exact
 * average is printed as a number beside it anyway.
 */
export function Stars({
  value,
  className = "size-4",
}: {
  value: number;
  className?: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-0.5"
      aria-label={`${value} от 5 звезди`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          aria-hidden
          className={`${className} ${
            i < Math.round(value)
              ? "fill-clay text-clay"
              : "fill-border text-border"
          }`}
        />
      ))}
    </span>
  );
}

/** Initials on a sand disc — no invented avatar photographs. */
export function Initials({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sand text-sm font-semibold text-foreground/70 ring-1 ring-border">
      {initials}
    </span>
  );
}
