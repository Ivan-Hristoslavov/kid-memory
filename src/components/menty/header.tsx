"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PRODUCT_GROUPS } from "@/lib/shop/products";
import { ChevronDown, Menu, Search, ShoppingBag, User, Wand2, X } from "lucide-react";
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
 * Four places, in the order somebody decides in.
 *
 * "Готови тениски" leads because most people do not want to design anything —
 * they want the one that says "Кумът". "Продукти" opens a panel rather than a
 * page: the shop sells twenty-seven things across nine shelves, and a single
 * word gave no hint of that, which is why it read as vague.
 *
 * The editor is not in this list. It is the button beside it, because it is an
 * action rather than a place. See docs/site-structure.md.
 */
const NAV: { href: string; label: string; panel?: boolean }[] = [
  { href: "/dizaini", label: "Готови тениски" },
  { href: "/produkti", label: "Продукти", panel: true },
  { href: "/za-povoda", label: "За повода" },
  { href: "/prikazka", label: "Детска книжка" },
];

export function MentyHeader() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [panel, setPanel] = useState(false);
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
              <div
                key={l.href}
                // z-50 keeps the trigger ABOVE the dismiss layer below.
                // Without it the backdrop rendered over the button the instant
                // the panel opened, and the tail of the very click that opened
                // it landed on the backdrop and shut it again — a button that
                // looked broken while behaving exactly as written.
                className="relative z-50"
                // Click, not hover.
                //
                // Hover looks nicer and fought itself: opening on enter and
                // closing on leave meant a click opened the panel and the
                // pointer leaving shut it again a moment later, so the button
                // appeared dead. Hover is also unavailable on a phone and
                // awkward on a keyboard. One trigger, one behaviour.
                onKeyDown={(e) => {
                  if (e.key === "Escape") setPanel(false);
                }}
              >
                {/* z-50 on the trigger itself, not only on its wrapper. The
                    dismiss layer is a sibling INSIDE that wrapper, so lifting
                    the wrapper moved both of them together and the backdrop
                    still painted over the button — the panel opened and could
                    not be closed by the control that opened it. */}
                <span className="relative z-50 flex items-center gap-1">
                  <Link
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    // Closed on the way out rather than in an effect: the
                    // React Compiler rejects setState during render, and the
                    // click that navigates is the right moment anyway.
                    onClick={() => setPanel(false)}
                    className={`relative py-2 text-sm transition-colors ${
                      active
                        ? "font-semibold text-foreground"
                        : "font-medium text-foreground/70 hover:text-foreground"
                    }`}
                  >
                    {l.label}
                    {/* A rule under the current section rather than a coloured
                        pill — the page already tells you where you are, this
                        only has to confirm it. */}
                    {active && (
                      <span className="absolute -bottom-px left-0 h-0.5 w-full rounded-full bg-clay" />
                    )}
                  </Link>
                  {/* The chevron is its own button, not decoration inside the
                      link. Hover alone would have left the panel unreachable by
                      touch and by keyboard, and the link still has to be able
                      to go to the page — one control cannot do both. */}
                  {l.panel && (
                    <button
                      type="button"
                      onClick={() => setPanel((v) => !v)}
                      aria-expanded={panel}
                      aria-label={`${l.label} — категории`}
                      className="grid size-5 place-items-center rounded text-foreground/60 transition-colors hover:text-foreground"
                    >
                      <ChevronDown
                        className={`size-3.5 transition-transform ${panel ? "rotate-180" : ""}`}
                        strokeWidth={2}
                      />
                    </button>
                  )}
                </span>

                {l.panel && panel && (
                  <>
                    {/* Anywhere else closes it. A menu that can only be
                        dismissed by finding its own button again is a trap. */}
                    <button
                      type="button"
                      aria-label="Затвори"
                      onClick={() => setPanel(false)}
                      className="fixed inset-0 z-40 cursor-default"
                    />
                    <div className="absolute left-1/2 top-full z-50 w-[34rem] -translate-x-1/2 pt-3">
                    <ul className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-background p-2 shadow-xl">
                      {PRODUCT_GROUPS.map((g) => (
                        <li key={g.id}>
                          <Link
                            href={`/produkti#${g.id.toLowerCase()}`}
                            onClick={() => setPanel(false)}
                            className="block rounded-lg px-3 py-2.5 transition-colors hover:bg-muted"
                          >
                            <span className="block text-sm font-semibold text-foreground">
                              {g.label}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              {g.blurb}
                            </span>
                          </Link>
                        </li>
                      ))}
                      </ul>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1 lg:ml-0">
          {/* The custom route, as a button rather than a nav item.
              It is an action — "make me one" — and it used to be the only way
              in, which is why nobody who just wanted a shirt ever got one. Now
              it is one obvious thing to press for the people who do want it. */}
          <Link
            href="/produkti"
            className="mr-2 hidden h-10 items-center gap-1.5 rounded-lg bg-forest px-4 text-sm font-semibold text-ivory transition-colors hover:bg-forest/90 sm:inline-flex"
          >
            <Wand2 className="size-4" strokeWidth={1.75} />
            Създай свой
          </Link>
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
                {/* The shelves inline rather than behind a second tap: on a
                    phone a nested menu is a place to get lost, and this list is
                    short enough to simply show. */}
                {l.panel && (
                  <ul className="mb-1 ml-2 border-l border-border pl-3">
                    {PRODUCT_GROUPS.map((g) => (
                      <li key={g.id}>
                        <Link
                          href={`/produkti#${g.id.toLowerCase()}`}
                          onClick={() => setOpen(false)}
                          className="block rounded-lg px-2 py-2 text-sm text-foreground/75 transition-colors hover:bg-muted hover:text-foreground"
                        >
                          {g.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
            {/* The button has no room in the mobile bar, so it leads the menu. */}
            <li className="pb-2 pt-1">
              <Link
                href="/produkti"
                onClick={() => setOpen(false)}
                className="flex h-12 items-center justify-center gap-2 rounded-lg bg-forest text-sm font-semibold text-ivory"
              >
                <Wand2 className="size-4" strokeWidth={1.75} />
                Създай свой дизайн
              </Link>
            </li>
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
