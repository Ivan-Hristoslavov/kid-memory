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
