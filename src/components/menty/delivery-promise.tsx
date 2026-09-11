"use client";

import { useHydrated } from "@/lib/hooks/use-client-value";
import { deliveryEstimate } from "@/lib/shop/delivery-date";

/**
 * "До петък, 18 септември" rather than "1–3 работни дни".
 *
 * A client component on purpose. These pages are statically generated, so a
 * date computed at build time would be whatever day the deploy happened and
 * would then be wrong for as long as the page is cached — which is worse than
 * the range it replaced.
 *
 * Renders the range until hydrated. Computing a date during SSR and another on
 * the client is a hydration mismatch, and the honest fallback for a visitor with
 * no JavaScript is the promise we can make without knowing today's date.
 */
export function DeliveryPromise({ className = "" }: { className?: string }) {
  const hydrated = useHydrated();
  if (!hydrated) return <span className={className}>1–3 работни дни</span>;

  const { label, iso } = deliveryEstimate();
  return (
    <time dateTime={iso} className={className}>
      до {label}
    </time>
  );
}
