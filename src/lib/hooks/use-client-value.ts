"use client";

import { useSyncExternalStore } from "react";

/**
 * Two tiny readers for things only the browser knows.
 *
 * Both exist because the obvious spelling — a `useState` flipped inside a
 * `useEffect` — costs a second render pass on every mount and is what the
 * `react-hooks/set-state-in-effect` rule warns about. `useSyncExternalStore`
 * says the same thing in one pass, and its third argument is exactly "what the
 * server should assume".
 */

const noop = () => () => {};

/** False while rendering on the server, true once running in the browser. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false
  );
}

/**
 * Whether the visitor asked the system for less motion. Live — changing the
 * setting updates the page without a reload.
 *
 * The server assumes false so the markup matches. A carousel that autoplays
 * for one frame before stopping is a far smaller problem than a hydration
 * mismatch.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  );
}

/**
 * The visitor's cookie choice, live.
 *
 * Three components need it — the analytics loader, the banner itself and the
 * sticky mobile bar — and all three previously read it with a `useState`
 * flipped inside a `useEffect`, plus their own copy of the event listener.
 * Here it is once. The server snapshot is null, which is the honest answer:
 * consent lives in `localStorage` and the server has never seen it.
 *
 * `subscribe` listens for the same custom event `choose()` already dispatches,
 * so accepting in the banner updates every reader in the same tick.
 */
export function useConsent(): "all" | "essential" | null {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener("biserite:consent", cb);
      window.addEventListener("storage", cb);
      return () => {
        window.removeEventListener("biserite:consent", cb);
        window.removeEventListener("storage", cb);
      };
    },
    () => {
      const v = localStorage.getItem("biserite-consent");
      return v === "all" || v === "essential" ? v : null;
    },
    () => null
  );
}

/** Whether the page is scrolled past `y`. Server assumes not. */
export function useScrolledPast(y: number): boolean {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener("scroll", cb, { passive: true });
      return () => window.removeEventListener("scroll", cb);
    },
    () => window.scrollY > y,
    () => false
  );
}

/** A sessionStorage flag, read live. Server assumes it is unset. */
export function useSessionFlag(key: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener("storage", cb);
      return () => window.removeEventListener("storage", cb);
    },
    () => sessionStorage.getItem(key) === "1",
    () => false
  );
}
