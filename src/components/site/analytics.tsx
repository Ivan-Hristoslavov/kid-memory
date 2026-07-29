"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { getConsent } from "./cookie-consent";

/**
 * Loads analytics/marketing tags only after the visitor consents, and only if
 * the corresponding env var is configured. Nothing runs without both.
 */
export function Analytics() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    setAllowed(getConsent() === "all");
    const onConsent = (e: Event) =>
      setAllowed((e as CustomEvent<string>).detail === "all");
    window.addEventListener("biserite:consent", onConsent);
    return () => window.removeEventListener("biserite:consent", onConsent);
  }, []);

  const ga = process.env.NEXT_PUBLIC_GA_ID;
  const pixel = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  if (!allowed) return null;

  return (
    <>
      {ga && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ga}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());gtag('config','${ga}',{anonymize_ip:true});`}
          </Script>
        </>
      )}

      {pixel && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
            n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
            document,'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('init','${pixel}');fbq('track','PageView');`}
        </Script>
      )}
    </>
  );
}

type TagWindow = {
  gtag?: (...a: unknown[]) => void;
  fbq?: (...a: unknown[]) => void;
};

function tags(): TagWindow | null {
  if (typeof window === "undefined" || getConsent() !== "all") return null;
  return window as unknown as TagWindow;
}

/** Fire a conversion event (used on the success page). */
export function trackPurchase(value: number, orderId: string) {
  const w = tags();
  if (!w) return;
  w.gtag?.("event", "purchase", {
    transaction_id: orderId,
    value,
    currency: "EUR",
  });
  // eventID must match the server-side Conversions API event so Meta counts
  // one conversion rather than two.
  w.fbq?.("track", "Purchase", { value, currency: "EUR" }, { eventID: orderId });
}

/**
 * Mid-funnel signals. With a handful of purchases a week, Meta cannot optimise
 * on Purchase alone — these give the algorithm something to learn from.
 */
export function trackFunnel(
  step: "ViewContent" | "Lead" | "AddToCart" | "InitiateCheckout",
  params: Record<string, unknown> = {}
) {
  const w = tags();
  if (!w) return;
  w.fbq?.("track", step, { currency: "EUR", ...params });
  w.gtag?.("event", step, params);
}
