import type { Metadata } from "next";
import {
  Manrope,
  Nunito,
  Oswald,
  Pattaya,
  Playfair_Display,
  Russo_One,
} from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/menty/theme-provider";
import { BRAND } from "@/lib/brand";
import { CookieConsent } from "@/components/site/cookie-consent";
import { Analytics } from "@/components/site/analytics";
import { HashScroll } from "@/components/site/hash-link";
import "./globals.css";

/**
 * Editorial serif for headlines, per the MENTY brand spec.
 *
 * Playfair Display carries Cyrillic and Cyrillic Extended, which is the whole
 * reason it can be used here at all — most display serifs with this contrast
 * either omit Cyrillic or graft it on from Latin shapes, and ъ, щ, я and Ж are
 * where that always shows. It is variable across 400–900.
 *
 * It is deliberately confined to short strings: headlines and pull quotes. Body
 * copy, navigation, prices and forms all stay on Manrope, because a high-
 * contrast serif at 16px in Bulgarian is tiring to read.
 */
const playfair = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  variable: "--font-playfair",
  display: "swap",
});

/**
 * The wordmark face, and nothing else.
 *
 * The logo is a rounded geometric sans, which neither Manrope nor Playfair is.
 * Rather than ship the mark as a bitmap — which could not be recoloured for the
 * light, dark and single-letter lockups the identity sheet specifies, and would
 * blur on a retina header — it is set as live text in Nunito and paired with a
 * drawn heart. One weight, Latin only, because the wordmark is "Menty".
 */
const nunito = Nunito({
  subsets: ["latin"],
  weight: ["800"],
  variable: "--font-logo-face",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
  display: "swap",
});

/**
 * The three display faces the printed designs are set in.
 *
 * They exist for one job: a t-shirt. The site's own three — Playfair, Nunito,
 * Manrope — are reading faces, and a stag-weekend shirt set in a book serif
 * looks like a wedding invitation. What that market runs on is heavy condensed
 * capitals, and none of the site's faces can do it.
 *
 * All three carry Cyrillic, which rules out most of the obvious candidates:
 * Anton, Bebas Neue and Alfa Slab One are Latin-only, and a shirt that reads
 * "MLADOZHENETSA" is not the product. Loaded here rather than per-design so a
 * customer changing the face on the preview sees it instantly.
 */
const oswald = Oswald({
  subsets: ["latin", "cyrillic"],
  variable: "--font-oswald",
  display: "swap",
});

const russo = Russo_One({
  subsets: ["latin", "cyrillic"],
  weight: ["400"],
  variable: "--font-russo",
  display: "swap",
});

const pattaya = Pattaya({
  subsets: ["latin", "cyrillic"],
  weight: ["400"],
  variable: "--font-pattaya",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${BRAND.name} — ${BRAND.promise}`,
    template: `%s | ${BRAND.name}`,
  },
  description: BRAND.description,
  // Kept deliberately broad across occasions: the old set was children-only,
  // which is exactly what capped the shop to a few dates a year.
  keywords: [
    "персонализиран подарък",
    "подарък със снимка",
    "чаша със снимка",
    "постер по снимка",
    "подарък за рожден ден",
    "подарък за годишнина",
    "тениска със снимка",
    "подаръчна кутия",
  ],
  openGraph: {
    type: "website",
    locale: "bg_BG",
    url: siteUrl,
    siteName: BRAND.name,
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: BRAND.description,
    images: [
      {
        url: "/og.jpg",
        width: 1200,
        height: 630,
        alt: "Персонализирани подаръци със снимка и послание",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND.name,
    description: BRAND.description,
    images: ["/og.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  formatDetection: { telephone: true, address: false, email: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bg" className="h-full" suppressHydrationWarning>
      <body
        className={`${playfair.variable} ${manrope.variable} ${nunito.variable} ${oswald.variable} ${russo.variable} ${pattaya.variable} grain min-h-full flex flex-col font-sans antialiased`}
      >
        <ThemeProvider>
          {children}
          <HashScroll />
          <Toaster position="top-center" richColors />
          <CookieConsent />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
