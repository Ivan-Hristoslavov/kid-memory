import type { Metadata } from "next";
import { Baloo_2, Inter, Nunito } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { CookieConsent } from "@/components/site/cookie-consent";
import { Analytics } from "@/components/site/analytics";
import { HashScroll } from "@/components/site/hash-link";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin", "cyrillic"],
  variable: "--font-nunito",
  display: "swap",
});

const baloo = Baloo_2({
  subsets: ["latin"],
  variable: "--font-baloo",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Бисерите на моето дете — персонализиран детски постер",
    template: "%s | Бисерите на моето дете",
  },
  description:
    "Запази първите смешни думи на твоето дете като уникална илюстрация. Персонализиран подарък за дете — детски постер със снимка, име и най-сладките думички. Идеален подарък за рожден ден.",
  keywords: [
    "персонализиран подарък за дете",
    "детски постер",
    "подарък за рожден ден",
    "детски спомени",
    "смешни детски думи",
    "персонализирана илюстрация",
  ],
  openGraph: {
    type: "website",
    locale: "bg_BG",
    url: siteUrl,
    siteName: "Бисерите на моето дете",
    title: "Бисерите на моето дете — запази смешните думи завинаги ❤️",
    description:
      "Децата растат толкова бързо. Днес чуваме техните смешни думи. Утре вече ги няма. Запази тези малки моменти завинаги.",
    images: [
      {
        url: "/og.jpg",
        width: 1200,
        height: 630,
        alt: "Персонализиран детски постер с илюстрация на дете и неговите смешни думички",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Бисерите на моето дете",
    description: "Запази първите смешни думи на твоето дете като уникална илюстрация.",
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
        className={`${nunito.variable} ${baloo.variable} ${inter.variable} grain min-h-full flex flex-col font-sans antialiased`}
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
