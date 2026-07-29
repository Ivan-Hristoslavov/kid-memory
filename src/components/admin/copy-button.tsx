"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** Copies a value to the clipboard — for pasting into the courier's system. */
export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          // Clipboard is blocked without HTTPS or permission; nothing to do but
          // leave the text selectable.
        }
      }}
      aria-label={`Копирай ${label}`}
      className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
    >
      {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
      {copied ? "Копирано" : "Копирай"}
    </button>
  );
}
