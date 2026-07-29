import { SiteHeader } from "@/components/site/site-header";
import { Footer } from "@/components/site/footer";
import { MobileCta } from "@/components/site/mobile-cta";
import { Hero } from "@/components/landing/hero";
import { Story } from "@/components/landing/story";
import { WordMarquee } from "@/components/landing/word-marquee";
import { Showcase } from "@/components/landing/showcase";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Occasions } from "@/components/landing/occasions";
import { OnTheWall } from "@/components/landing/on-the-wall";
import { Testimonials } from "@/components/landing/testimonials";
import { Pricing } from "@/components/landing/pricing";
import { Guarantee } from "@/components/landing/guarantee";
import { Faq } from "@/components/landing/faq";
import { FinalCta } from "@/components/landing/final-cta";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { landingJsonLd } from "@/lib/seo";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export const dynamic = "force-dynamic";

export default async function Home() {
  const settings = await getSettings();

  // Ratings are only published as structured data when genuine approved
  // reviews exist and are rendered on this same page.
  const ratings = await prisma.review
    .aggregate({
      where: { status: "APPROVED" },
      _avg: { rating: true },
      _count: true,
    })
    .catch(() => null);

  const reviewSummary =
    settings.showReviews && ratings && ratings._count > 0 && ratings._avg.rating
      ? {
          count: ratings._count,
          average: Math.round(ratings._avg.rating * 10) / 10,
        }
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(landingJsonLd(reviewSummary)) }}
      />
      <SiteHeader />
      <main className="flex-1">
        <Hero title={settings.heroTitle} subtitle={settings.heroSubtitle} />
        <WordMarquee />
        <Story />
        <Showcase />
        <HowItWorks />
        <OnTheWall />
        {settings.showReviews && <Testimonials heading={settings.reviewsHeading} />}
        <Occasions />
        <Pricing />
        <Guarantee />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
      <MobileCta />
    </>
  );
}
