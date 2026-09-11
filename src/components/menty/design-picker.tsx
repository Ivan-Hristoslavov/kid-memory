"use client";

import { useState } from "react";
import Image from "next/image";
import { Check } from "lucide-react";
import {
  DESIGN_CATEGORIES,
  designImage,
  designsInCategory,
  type DesignCategory,
} from "@/lib/shop/designs";
import { TEXT_DESIGNS } from "@/lib/shop/text-designs";
import { TextDesignArt } from "./text-design-art";

/**
 * Picking a ready-made design.
 *
 * Twelve categories and fifty designs is more than fits on a product page, so
 * the categories are chips and only one category's designs are shown at a time.
 * It opens on gaming because that is the busiest one; a shopper who wants
 * something else is one tap away, and a shopper who wants nothing scrolls past.
 *
 * The thumbnails are drawn on the brand's sand rather than on white. The
 * artwork is transparent PNG and a good half of it is drawn light for dark
 * garments — on a white tile those designs simply disappear.
 */
export function DesignPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (designId: string) => void;
}) {
  const [category, setCategory] = useState<DesignCategory>("BACHELOR");
  const designs = designsInCategory(category);
  // Lettering first. For a stag or hen weekend it is what people actually buy —
  // the graphics are the alternative, not the headline.
  const words = TEXT_DESIGNS.filter((t) => t.category === category);

  return (
    <div>
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {DESIGN_CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategory(c.id)}
            aria-pressed={category === c.id}
            className={`h-8 shrink-0 rounded-full border px-3 text-xs font-medium transition-colors ${
              category === c.id
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-background text-foreground/70 hover:border-foreground/40"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <ul className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-5">
        {words.map((w) => {
          const active = value === w.id;
          return (
            <li key={w.id}>
              <button
                type="button"
                onClick={() => onChange(active ? "" : w.id)}
                aria-pressed={active}
                title={w.title}
                className={`relative block aspect-square w-full overflow-hidden rounded-lg border p-2 transition-colors ${
                  w.forDark ? "bg-ground-dark" : "bg-ground-light"
                } ${
                  active
                    ? "border-foreground ring-1 ring-foreground"
                    : "border-border hover:border-foreground/40"
                }`}
              >
                <TextDesignArt
                  design={w}
                  color={w.forDark ? "#FEFCF8" : "#2B2B2B"}
                />
                {active && (
                  <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-foreground">
                    <Check className="size-2.5 text-background" strokeWidth={3} />
                  </span>
                )}
              </button>
            </li>
          );
        })}

        {designs.map((d) => {
          const active = value === d.id;
          return (
            <li key={d.id}>
              <button
                type="button"
                onClick={() => onChange(active ? "" : d.id)}
                aria-pressed={active}
                title={d.title}
                className={`relative block aspect-square w-full overflow-hidden rounded-lg border bg-sand p-1.5 transition-colors ${
                  active
                    ? "border-foreground ring-1 ring-foreground"
                    : "border-border hover:border-foreground/40"
                }`}
              >
                <Image
                  src={designImage(d.id)}
                  alt={d.title}
                  fill
                  sizes="120px"
                  className="object-contain p-1.5"
                />
                {active && (
                  <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-foreground">
                    <Check className="size-2.5 text-background" strokeWidth={3} />
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
