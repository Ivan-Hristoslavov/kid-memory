import type { Metadata } from "next";
import { Manrope, PT_Serif } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { BRAND } from "@/lib/brand";
import { CookieConsent } from "@/components/site/cookie-consent";
import { Analytics } from "@/components/site/analytics";
import { HashScroll } from "@/components/site/hash-link";
import "./globals.css";

/**
 * A serif drawn for Cyrillic over a geometric grotesk. Baloo — a rounded face
 * made for children's material — was what made every page read as a nursery no
 * matter what the copy said, and it has no Cyrillic subset at all.
 *
 * PT Serif ships 400/700 only, so headings styled `font-extrabold` resolve to
 * 700 rather than being synthetically emboldened.
 */
const ptSerif = PT_Serif({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "700"],
  variable: "--font-pt-serif",
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
        className={`${ptSerif.variable} ${manrope.variable} grain min-h-full flex flex-col font-sans antialiased`}
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
