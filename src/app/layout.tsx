import type { Metadata } from "next";
import { Manrope, Onest } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { BRAND } from "@/lib/brand";
import { CookieConsent } from "@/components/site/cookie-consent";
import { Analytics } from "@/components/site/analytics";
import { HashScroll } from "@/components/site/hash-link";
import "./globals.css";

/**
 * A contemporary grotesk drawn Cyrillic-first, over a geometric one.
 *
 * The headings used to be PT Serif, which reads as a textbook rather than as a
 * shop — bookish where the product is a gift. Onest is the modern counterpart
 * that keeps proper Cyrillic: its ъ, щ, я and Ж are drawn, not adapted from
 * Latin shapes, which is where most fashionable faces fall apart in Bulgarian.
 *
 * It is variable across 100–900, so headings styled `font-extrabold` get a real
 * 800 cut instead of PT Serif's 700 ceiling.
 */
const onest = Onest({
  subsets: ["latin", "cyrillic"],
  variable: "--font-onest",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${BRAND.name} — персонализирани постери по снимка`,
    template: `%s | ${BRAND.name}`,
  },
  description: BRAND.description,
  // Kept deliberately broad across occasions: the old set was children-only,
  // which is exactly what capped the shop to a few dates a year.
  keywords: [
    "персонализиран подарък",
    "постер по снимка",
    "подарък за рожден ден",
    "подарък за колега",
    "подарък за годишнина",
    "портрет по снимка",
    "постер с домашен любимец",
    "персонализирана илюстрация",
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
        alt: "Персонализиран илюстрован постер по снимка",
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
    <html lang="bg" className="h-full">
      <body
        className={`${onest.variable} ${manrope.variable} grain min-h-full flex flex-col font-sans antialiased`}
      >
        {children}
        <HashScroll />
        <Toaster position="top-center" richColors />
        <CookieConsent />
        <Analytics />
      </body>
    </html>
  );
}
