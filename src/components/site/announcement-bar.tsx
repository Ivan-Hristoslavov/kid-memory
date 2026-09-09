"use client";

import { useReducer } from "react";
import { useSessionFlag } from "@/lib/hooks/use-client-value";
import { Sparkles, Truck, X } from "lucide-react";

/**
 * Slim promo strip at the very top — a marketing hook (free shipping / speed).
 * Dismissible; the choice is remembered for the session.
 */
const DISMISSED_KEY = "biserite-promo-dismissed";

export function AnnouncementBar({
  text,
  secondary,
}: {
  text: string;
  secondary: string;
}) {
  // The dismissal lives in sessionStorage, so the server cannot know it and
  // assumes the bar is shown. `bump` re-reads after the close button writes.
  const [, bump] = useReducer((n: number) => n + 1, 0);
  const dismissed = useSessionFlag(DISMISSED_KEY);

  if (dismissed) return null;

  return (
    <div className="relative bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-x-6 gap-y-1 px-10 py-2 text-center text-sm font-semibold">
        <span className="inline-flex items-center gap-1.5">
          <Truck className="size-4" /> {text}
        </span>
        <span className="hidden items-center gap-1.5 sm:inline-flex">
          <Sparkles className="size-4" /> {secondary}
        </span>
      </div>
      <button
        type="button"
        onClick={() => {
          sessionStorage.setItem(DISMISSED_KEY, "1");
          // sessionStorage writes fire no event in this tab, so nudge the read.
          bump();
        }}
        aria-label="Затвори"
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 opacity-80 transition hover:bg-white/15 hover:opacity-100"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
