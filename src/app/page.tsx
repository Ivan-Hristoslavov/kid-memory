import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";
import { MentyHeader } from "@/components/menty/header";
import { MentyHero } from "@/components/menty/hero";
import { TrustRow } from "@/components/menty/trust-row";
import { WordMarquee } from "@/components/menty/word-marquee";
import { Transformation } from "@/components/menty/transformation";
import { CategoryStrip } from "@/components/menty/category-strip";
import { PersonalizeBanner } from "@/components/menty/personalize-banner";
import { Bestsellers } from "@/components/menty/bestsellers";
import { Themes } from "@/components/menty/themes";
import { Occasions } from "@/components/menty/occasions";
import { HowItWorks } from "@/components/menty/how-it-works";
import { Reviews } from "@/components/menty/reviews";
import { MentyFooter } from "@/components/menty/footer";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  title: `${BRAND.name} — ${BRAND.promise}`,
  description: BRAND.description,
};

/** Reviews are read per request, so the page cannot be prerendered stale. */
export const dynamic = "force-dynamic";

/**
 * The MENTY storefront home page.
 *
 * Section order is taken from the V2 brief and its reference image, and is the
 * part that must not drift: hero, category rail, personalisation banner,
 * bestsellers, occasions, how it works, reviews, footer. The trust row sits
 * between the hero and the categories because the reference puts it there.
 *
 * The previous poster landing page has not been deleted — its sections still
 * live under components/landing and the wizard it fed is still at /create.
 * The poster is one product in this catalogue now rather than the whole shop.
 */
export default function Home() {
  return (
    <>
      <MentyHeader />
      <main className="flex-1">
        <MentyHero />
        <TrustRow />
        {/* The voice, immediately under the hero: real submissions rather than
            another row of category labels. */}
        <WordMarquee />
        <CategoryStrip />
        {/* What you give and what comes back — the differentiator the page
            otherwise only described in icons. */}
        <Transformation />
        <PersonalizeBanner />
        <Bestsellers />
        {/* Themes before occasions: "he plays games" is a thought people arrive
            with, "it is her birthday on Tuesday" is one they arrive with too,
            but the first has no other door into the catalogue. */}
        <Themes />
        <Occasions />
        <HowItWorks />
        <Reviews />
      </main>
      <MentyFooter />
    </>
  );
}
