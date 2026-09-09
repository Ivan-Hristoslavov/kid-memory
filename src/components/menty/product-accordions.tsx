"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Details, delivery and returns, as collapsible rows under the purchase panel.
 *
 * The reference shows a reviews row here too. It is omitted rather than faked:
 * this shop has no per-product reviews yet, and a row that opens onto invented
 * praise is exactly what the reviews section elsewhere refuses to do.
 */
export function ProductAccordions({
  details,
}: {
  details: { title: string; body: string }[];
}) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="mt-8 divide-y divide-border border-y border-border">
      {details.map((d, i) => {
        const isOpen = open === i;
        return (
          <div key={d.title}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 py-4 text-left"
            >
              <span className="text-sm font-semibold text-foreground">{d.title}</span>
              <ChevronDown
                className={`size-4 shrink-0 text-muted-foreground transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {isOpen && (
              <p className="pb-4 text-sm leading-relaxed text-muted-foreground">
                {d.body}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
