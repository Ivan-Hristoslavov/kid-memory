import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { ARTICLES } from "@/lib/articles";
import { ALL_PRODUCTS } from "@/lib/shop/products";
import { DESIGN_CATEGORIES } from "@/lib/shop/designs";
import { GIFT_AUDIENCES, GIFT_OCCASIONS, GIFT_THEMES } from "@/lib/brand";

type Freq = MetadataRoute.Sitemap[number]["changeFrequency"];

/**
 * Every publicly indexable page. Checkout, success and confirmation routes are
 * deliberately absent — they are per-order and marked noindex.
 */
const PAGES: { path: string; priority: number; freq: Freq }[] = [
  { path: "", priority: 1, freq: "weekly" },
  { path: "/create", priority: 0.9, freq: "weekly" },
  { path: "/produkti", priority: 0.9, freq: "weekly" },
  { path: "/dizaini", priority: 0.9, freq: "weekly" },
  { path: "/personalizirani", priority: 0.7, freq: "monthly" },
  { path: "/biznes-podaratsi", priority: 0.7, freq: "monthly" },
  { path: "/idei", priority: 0.8, freq: "weekly" },
  { path: "/otzivi", priority: 0.7, freq: "weekly" },
  { path: "/snimkite", priority: 0.6, freq: "monthly" },
  { path: "/proverka", priority: 0.4, freq: "monthly" },
  { path: "/vrashtane", priority: 0.3, freq: "yearly" },
  { path: "/obshti-usloviya", priority: 0.2, freq: "yearly" },
  { path: "/poveritelnost", priority: 0.2, freq: "yearly" },
  { path: "/biskvitki", priority: 0.2, freq: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    ...PAGES.map(({ path, priority, freq }) => ({
      url: `${SITE_URL}${path}`,
      lastModified,
      changeFrequency: freq,
      priority,
    })),
    // The catalogue was missing from here entirely: every product page, every
    // collection and every design category was unlisted, which is a strange
    // thing for a shop to hide from a crawler.
    ...ALL_PRODUCTS.map((p) => ({
      url: `${SITE_URL}/produkt/${p.id}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...DESIGN_CATEGORIES.map((c) => ({
      url: `${SITE_URL}/dizaini/${c.id.toLowerCase()}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...[
      ...new Set(
        [...GIFT_AUDIENCES, ...GIFT_OCCASIONS, ...GIFT_THEMES].map((c) => c.id)
      ),
    ].map((id) => ({
      url: `${SITE_URL}/za-povoda/${id}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...ARTICLES.map((a) => ({
      url: `${SITE_URL}/idei/${a.slug}`,
      lastModified: new Date(a.updated),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
