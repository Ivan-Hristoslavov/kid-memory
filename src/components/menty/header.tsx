"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { SearchDialog } from "./search-dialog";
import { ThemeToggle } from "./theme-toggle";
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
/**
 * Five items, and each one answers a different question.
 *
 * It was six, and two of them ("Персонализирани", "Бизнес подаръци") were
 * explanations rather than places to browse — those moved to the footer. The
 * poster wizard, which is the one thing this shop makes end to end, was not in
 * the navigation at all.
 *
 * Order is what a visitor decides in: what it is, what is on it, who it is for,
 * then the two made-to-order products. See docs/site-structure.md.
 */
const NAV = [
  { href: "/produkti", label: "Продукти" },
  { href: "/dizaini", label: "Дизайни" },
  { href: "/za-povoda", label: "За повода" },
  { href: "/create", label: "Постер" },
  { href: "/prikazka", label: "Детска книжка" },
];

export function MentyHeader() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();

  /**
   * At the very top the header sits on the hero's own sand and needs no line;
   * once the page moves under it, it has to separate itself from whatever is
   * passing beneath.
   *
   * Watched with an IntersectionObserver on a sentinel rather than by reading
   * `window.scrollY`. Which element actually scrolls depends on the page's
   * overflow — here `html` is `height: 100%` and the body overflows it — and a
   * scrollY read silently returns 0 whenever it guesses the wrong one. The
   * observer just asks whether the top of the document is still on screen,
   * which is true regardless of who is doing the scrolling.
   */
  const sentinel = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
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
    <>
      {/* Zero-height marker at the very top of the document. */}
      <div ref={sentinel} aria-hidden className="absolute top-0 h-px w-full" />
      <header
      className={`sticky top-0 z-50 bg-background/90 backdrop-blur-md transition-shadow duration-300 ${
        scrolled ? "border-b border-border shadow-sm" : "border-b border-transparent"
      }`}
    >
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
          {NAV.map((l) => {
            const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`relative py-2 text-sm transition-colors ${
                  active
                    ? "font-semibold text-foreground"
                    : "font-medium text-foreground/70 hover:text-foreground"
                }`}
              >
                {l.label}
                {/* A rule under the current section rather than a coloured
                    pill — the page already tells you where you are, this only
                    has to confirm it. */}
                {active && (
                  <span className="absolute -bottom-px left-0 h-0.5 w-full rounded-full bg-clay" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1 lg:ml-0">
          <IconButton label="Търсене" onClick={() => setSearchOpen(true)}>
            <Search className="size-5" />
          </IconButton>
          <ThemeToggle />
          {/* Checkout is guest-only by design, so "account" means the
              passwordless view of your own past orders rather than a login. */}
          <Link
            href="/moite"
            aria-label="Моите поръчки"
            className="hidden size-10 place-items-center rounded-lg text-foreground/70 transition-colors hover:bg-muted hover:text-foreground sm:grid"
          >
            <User className="size-5" />
          </Link>
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
                  aria-current={pathname === l.href ? "page" : undefined}
                  className={`block rounded-lg px-2 py-3 text-base transition-colors hover:bg-muted ${
                    pathname === l.href
                      ? "font-semibold text-foreground"
                      : "font-medium text-foreground/85"
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
        <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
      </header>
    </>
  );
}

function IconButton({
  label,
  children,
  onClick,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`grid size-10 place-items-center rounded-lg text-foreground/70 transition-colors hover:bg-muted hover:text-foreground ${className}`}
    >
      {children}
    </button>
  );
}
