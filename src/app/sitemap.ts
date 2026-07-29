import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { ARTICLES } from "@/lib/articles";

type Freq = MetadataRoute.Sitemap[number]["changeFrequency"];

/**
 * Every publicly indexable page. Checkout, success and confirmation routes are
 * deliberately absent — they are per-order and marked noindex.
 */
const PAGES: { path: string; priority: number; freq: Freq }[] = [
  { path: "", priority: 1, freq: "weekly" },
  { path: "/create", priority: 0.9, freq: "weekly" },
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
    ...ARTICLES.map((a) => ({
      url: `${SITE_URL}/idei/${a.slug}`,
      lastModified: new Date(a.updated),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
