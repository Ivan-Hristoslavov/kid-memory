"use client";

import { useEffect, useRef } from "react";
import { trackPurchase } from "@/components/site/analytics";

/**
 * Fires the browser-side Purchase conversion once per order.
 *
 * `eventId` is the order id and matches the server-side Conversions API event,
 * so Meta deduplicates the pair instead of counting two sales. The ref guards
 * against React re-running the effect (Strict Mode, remounts).
 */
export function PurchaseTracker({
  orderId,
  valueEUR,
}: {
  orderId: string;
  valueEUR: number;
}) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    trackPurchase(valueEUR, orderId);
  }, [orderId, valueEUR]);

  return null;
}
