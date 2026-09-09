"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { cartCount, useCart } from "@/lib/store/cart";
import { Logo } from "./logo";

/**
 * The storefront header.
 *
 * Deliberately not the floating frosted pill the poster site used: the brief
 * rules out heavy glassmorphism and pill-everything, and a gifting shop's
 * header has to hold a search field, an account and a basket without becoming
 * a lozenge. So it is a plain sticky bar on the page's own ivory, separated by
 * a hairline — the reference's own treatment.
 */
const NAV = [
  { href: "/produkti", label: "Продукти" },
  { href: "/za-povoda", label: "За повода" },
  { href: "/personalizirani", label: "Персонализирани" },
  { href: "/biznes-podaratsi", label: "Бизнес подаръци" },
];

export function MentyHeader() {
  const [open, setOpen] = useState(false);
  /**
   * The basket lives in localStorage, so the server has no idea what is in it.
   * Subscribing through useSyncExternalStore with a server snapshot of zero
   * makes that explicit: the first paint matches on both sides, and the badge
   * appears as soon as the client store is readable.
   *
   * Deliberately the core store API rather than `useCart.persist` — the persist
   * handle is not attached during prerendering, which failed the build with
   * "Cannot read properties of undefined (reading 'onFinishHydration')".
   * `subscribe` and `getState` always exist.
   */
  const count = useSyncExternalStore(
    useCart.subscribe,
    () => cartCount(useCart.getState().lines),
    () => 0
  );

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:h-20 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label="Menty — начало"
          onClick={() => setOpen(false)}
          className="shrink-0 text-[0.95rem] sm:text-[1.05rem]"
        >
          <Logo />
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-8 lg:flex">
          {NAV.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="relative py-2 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 lg:ml-0">
          <IconButton label="Търсене">
            <Search className="size-5" />
          </IconButton>
          <IconButton label="Профил" className="hidden sm:inline-flex">
            <User className="size-5" />
          </IconButton>
          <Link
            href="/kolichka"
            aria-label={count > 0 ? `Количка, ${count} артикула` : "Количка"}
            className="relative grid size-10 place-items-center rounded-lg text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
          >
            <ShoppingBag className="size-5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid min-w-[1.15rem] place-items-center rounded-full bg-clay px-1 text-[0.65rem] font-bold leading-[1.15rem] text-ivory">
                {count}
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Затвори менюто" : "Отвори менюто"}
            className="grid size-10 place-items-center rounded-lg text-foreground/70 transition-colors hover:bg-muted hover:text-foreground lg:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-border bg-background lg:hidden">
          <ul className="mx-auto max-w-7xl px-4 py-2 sm:px-6">
            {NAV.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-2 py-3 text-base font-medium text-foreground/85 transition-colors hover:bg-muted"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}

function IconButton({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`grid size-10 place-items-center rounded-lg text-foreground/70 transition-colors hover:bg-muted hover:text-foreground ${className}`}
    >
      {children}
    </button>
  );
}
