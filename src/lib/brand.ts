/**
 * Brand identity in one place.
 *
 * The shop launched as "Бисерите на моето дете", which named the customer's
 * child in the brand itself, and was then renamed to the occasion-neutral
 * "Повод". MENTY is the third and widest step: not a poster shop that also
 * sells other things, but a personalised gifting brand whose catalogue happens
 * to include posters.
 *
 * The wordmark is set as "Menty" — sentence case, no gift-box icon. The
 * all-caps MENTY is only the document/typographic form.
 *
 * Every surface reads the name from here, including `COMPANY.brand` in
 * lib/legal.ts, so a rename never has to be chased through the codebase. The
 * legal entity is separate and comes from NEXT_PUBLIC_COMPANY_* — a trading
 * name is not a company name.
 */
export const BRAND = {
  name: "Menty",
  /** Used where the name alone is too bare, e.g. the OG title. */
  full: "Menty — персонализирани подаръци",
  /** The line under the wordmark. */
  tagline: "Подаръци за истински моменти",
  /** English lockup, for the logo and any English-language surface. */
  taglineEn: "Gifts for real moments.",
  /**
   * The promise, in the brand's own words. Used as the hero headline default
   * and anywhere the shop has one sentence to explain itself.
   */
  promise: "Подарък, който е наистина личен.",
  promiseEn: "The gift that feels personal.",
  /** One sentence, used as the default meta description. */
  description:
    "Персонализирани подаръци за хората, които правят живота ти по-специален — чаши, постери и рамки, тениски, пъзели и подаръчни кутии със снимка и послание.",
} as const;

/**
 * The category rail under the hero.
 *
 * People shop for gifts by recipient and by occasion, not by product type —
 * somebody arrives knowing it is their mother's birthday, not knowing they
 * want a mug. `href` stays a plain string because the collection routes are
 * built in a later pass; nothing renders a dead link until they exist.
 */
export const GIFT_AUDIENCES = [
  { id: "for-her", label: "За нея" },
  { id: "for-him", label: "За него" },
  { id: "for-couples", label: "За двойки" },
  { id: "for-parents", label: "За родители" },
  { id: "for-kids", label: "За деца" },
] as const;

export const GIFT_OCCASIONS = [
  { id: "birthday", label: "Рожден ден" },
  { id: "anniversary", label: "Годишнина" },
  { id: "new-baby", label: "Ново бебе" },
  { id: "thank-you", label: "Благодаря" },
  { id: "love", label: "Обичам те" },
  { id: "just-because", label: "Просто така" },
] as const;
