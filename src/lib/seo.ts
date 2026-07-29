import { AVAILABLE_PRODUCTS, PRODUCTS, highestPriceEUR, lowestPriceEUR } from "@/lib/catalog";
import { COMPANY } from "@/lib/legal";
import { FAQ_ITEMS } from "@/lib/faq";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

/**
 * Structured data for the landing page.
 *
 * `aggregateRating` is emitted only when real approved reviews exist and are
 * rendered on the same page — inventing or hiding ratings is a manual-action
 * risk, not a shortcut.
 */
export function landingJsonLd(reviews: { count: number; average: number } | null) {
  const organization = {
    "@type": "Organization",
    "@id": `${SITE_URL}#organization`,
    name: COMPANY.brand,
    legalName: COMPANY.legalName,
    url: SITE_URL,
    email: COMPANY.email,
    address: {
      "@type": "PostalAddress",
      addressCountry: "BG",
      streetAddress: COMPANY.address,
    },
    areaServed: { "@type": "Country", name: "България" },
  };

  const product = {
    "@type": "Product",
    "@id": `${SITE_URL}#product`,
    name: "Персонализиран детски постер „Бисерите на моето дете“",
    description:
      "Персонализиран подарък за дете — снимката на детето, превърната в илюстрация, заедно с най-смешните думички, които казва грешно. Изработва се по поръчка и се доставя с Еконт или Спиди.",
    brand: { "@type": "Brand", name: COMPANY.brand },
    url: SITE_URL,
    category: "Персонализирани подаръци",
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "EUR",
      lowPrice: lowestPriceEUR(),
      highPrice: highestPriceEUR(),
      offerCount: AVAILABLE_PRODUCTS.length,
      availability: "https://schema.org/InStock",
      areaServed: "BG",
      offers: AVAILABLE_PRODUCTS.map((id) => ({
        "@type": "Offer",
        name: PRODUCTS[id].name,
        price: PRODUCTS[id].priceEUR,
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
      })),
    },
    ...(reviews && reviews.count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: reviews.average,
            reviewCount: reviews.count,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };

  const faq = {
    "@type": "FAQPage",
    "@id": `${SITE_URL}#faq`,
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  const website = {
    "@type": "WebSite",
    "@id": `${SITE_URL}#website`,
    url: SITE_URL,
    name: COMPANY.brand,
    inLanguage: "bg-BG",
    publisher: { "@id": `${SITE_URL}#organization` },
  };

  return { "@context": "https://schema.org", "@graph": [organization, website, product, faq] };
}

/** Breadcrumbs for inner pages — helps Google render the path in results. */
export function breadcrumbJsonLd(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Начало", item: SITE_URL },
      ...trail.map((crumb, i) => ({
        "@type": "ListItem",
        position: i + 2,
        name: crumb.name,
        item: `${SITE_URL}${crumb.path}`,
      })),
    ],
  };
}
