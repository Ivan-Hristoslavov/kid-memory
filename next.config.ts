import type { NextConfig } from "next";

/**
 * Permanent redirects for the collection ids that no longer exist.
 *
 * The theme collections duplicated the design categories — `theme-gaming` and
 * `/dizaini/gaming` were the same shelf behind two doors — and removing them is
 * most of what made the site navigable again. Removing a URL is not the same as
 * being allowed to break it: these were linked from the homepage, they are in
 * the sitemap Google has already read, and a 404 throws away whatever ranking
 * they earned. 308 keeps it.
 *
 * See docs/site-structure.md.
 */
const THEME_REDIRECTS = [
  ["theme-gaming", "gaming"],
  ["theme-bachelor", "bachelor"],
  ["theme-couples", "hen"],
  ["theme-kids", "pets"],
  ["theme-birthday", "holiday"],
  ["theme-office", "profession"],
] as const;

const nextConfig: NextConfig = {
  async redirects() {
    return THEME_REDIRECTS.map(([from, to]) => ({
      source: `/za-povoda/${from}`,
      destination: `/dizaini/${to}`,
      permanent: true,
    }));
  },
};

export default nextConfig;
