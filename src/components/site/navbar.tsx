"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Frame, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HashLink } from "./hash-link";
import { BRAND } from "@/lib/brand";

// Order matches the order the sections appear on the page, so the nav reads as
// a map of the page rather than a random list. "Отзиви" is last because it
// leaves the page. "Поводи" is back and first: it is now the entry point that
// tells a visitor this is not only a children's shop.
const LINKS = [
  { href: "/#occasions", label: "Поводи" },
  { href: "/#styles", label: "Стилове" },
  { href: "/#how", label: "Как работи" },
  { href: "/#pricing", label: "Цени" },
  { href: "/idei", label: "Идеи" },
  { href: "/otzivi", label: "Отзиви" },
];

/** Inner nav pill — positioning is handled by SiteHeader. */
export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <div className="px-4 pt-3">
      <nav className="glass-nav mx-auto max-w-5xl rounded-2xl px-4 py-2.5 sm:rounded-full sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex min-w-0 items-center gap-2" onClick={() => setOpen(false)}>
            {/* A frame, not a heart — the mark should say "printed and hung",
                which is true of every occasion the shop now sells. */}
            <span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
              <Frame className="size-4" />
            </span>
            <span className="min-w-0 truncate">
              <span className="block font-heading text-lg font-bold tracking-tight leading-none">
                {BRAND.name}
              </span>
              <span className="hidden text-xs text-muted-foreground sm:block">
                {BRAND.tagline}
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-1">
            <div className="hidden items-center gap-1 lg:flex">
              {LINKS.map((l) => (
                <Button key={l.href} asChild variant="ghost" className="rounded-full">
                  {l.href.includes("#") ? (
                    <HashLink href={l.href}>{l.label}</HashLink>
                  ) : (
                    <Link href={l.href}>{l.label}</Link>
                  )}
                </Button>
              ))}
            </div>

            <Button asChild className="rounded-full shadow-lg shadow-primary/25">
              <Link href="/create">Създай</Link>
            </Button>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Затвори менюто" : "Отвори менюто"}
              aria-expanded={open}
              className="grid size-10 place-items-center rounded-full text-foreground/70 transition-colors hover:bg-muted lg:hidden"
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="overflow-hidden lg:hidden"
            >
              <ul className="mt-2 space-y-1 border-t border-border/60 pt-2">
                {LINKS.map((l) => (
                  <li key={l.href}>
                    {l.href.includes("#") ? (
                      <HashLink
                        href={l.href}
                        onNavigate={() => setOpen(false)}
                        className="block rounded-xl px-4 py-2.5 font-semibold text-foreground/80 transition-colors hover:bg-muted"
                      >
                        {l.label}
                      </HashLink>
                    ) : (
                      <Link
                        href={l.href}
                        onClick={() => setOpen(false)}
                        className="block rounded-xl px-4 py-2.5 font-semibold text-foreground/80 transition-colors hover:bg-muted"
                      >
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </div>
  );
}
