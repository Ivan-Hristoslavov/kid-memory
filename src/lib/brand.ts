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
 * want a mug. The reference runs these as eight circular photographs directly
 * under the hero, so each carries its own image; `id` becomes the collection
 * route once those pages exist.
 */
export const GIFT_AUDIENCES = [
  { id: "for-her", label: "За нея", image: "/moments/for-her.webp" },
  { id: "for-him", label: "За него", image: "/moments/for-him.webp" },
  { id: "for-couples", label: "За двойки", image: "/moments/for-couples.webp" },
  { id: "for-parents", label: "За родители", image: "/moments/for-parents.webp" },
  { id: "for-kids", label: "За деца", image: "/moments/for-kids.webp" },
  { id: "birthday", label: "Рожден ден", image: "/moments/birthday.webp" },
  { id: "anniversary", label: "Годишнина", image: "/moments/anniversary.webp" },
  { id: "just-because", label: "Просто така", image: "/moments/just-because.webp" },
] as const;

/**
 * The occasion tiles. The reference runs these as a six-up row of photographs
 * under the bestsellers, in this order.
 */
export const GIFT_OCCASIONS = [
  { id: "birthday", label: "Рожден ден", image: "/moments/birthday.webp" },
  { id: "anniversary", label: "Годишнина", image: "/moments/anniversary.webp" },
  { id: "new-baby", label: "Ново бебе", image: "/moments/new-baby.webp" },
  { id: "best-friend", label: "За най-добър приятел", image: "/moments/best-friend.webp" },
  { id: "thank-you", label: "Благодаря", image: "/moments/thank-you.webp" },
  { id: "love", label: "Обичам те", image: "/moments/love.webp" },
] as const;

/**
 * Lifestyle photography that is not tied to a category or an occasion — the
 * personalisation banner, the editorial block and anywhere a warm scene is
 * needed. Kept here so no component holds an image path of its own.
 */
/**
 * The hero carousel: real product mock-ups, each carrying an example design.
 *
 * Deliberately NOT the branded packaging shots. The hero has to answer "what do
 * I actually get", and a photograph of our own gift box does not — a mug with
 * somebody's family on it does. Order is the rotation order.
 */
export const HERO_SLIDES = [
  /**
   * Real product mock-ups, each carrying an example design.
   *
   * The poster comes first on purpose. It is the one thing this shop makes end
   * to end — the illustration, the Bulgarian lettering, the print — and its
   * samples carry actual submissions ("апум" for паун, "Цитатите на Митко"),
   * which is the only place on the page where the product sounds like a person
   * rather than a category. Leading with a mug made the shop look like a
   * reseller of other people's blanks.
   */
  {
    id: "poster-framed",
    image: "/samples/hero-wall.webp",
    label: "Постер по твоя снимка",
    href: "/create",
  },
  {
    id: "poster-kid",
    image: "/samples/storybook.webp",
    label: "„Думичките на Боби“",
    href: "/create?template=KID_WORDS",
    /** A poster is a tall artwork: show it whole, never cropped. */
    portrait: true,
  },
  { id: "mug", image: "/hero/mug.webp", label: "Чаша със снимка", href: "/produkt/photo-mug-330" },
  {
    id: "poster-portrait",
    image: "/samples/realistic.webp",
    label: "„Цитатите на Митко“",
    href: "/create?template=PORTRAIT_LINES",
    /** A poster is a tall artwork: show it whole, never cropped. */
    portrait: true,
  },
  { id: "tee", image: "/hero/tee.webp", label: "Тениска с печат", href: "/produkt/premium-tee-stanley-stella" },
  {
    id: "poster-pet",
    image: "/samples/disney.webp",
    label: "„Такъв е Рекс“",
    href: "/create?template=PET",
    /** A poster is a tall artwork: show it whole, never cropped. */
    portrait: true,
  },
  // The puzzle that used to sit here was a PrintFactory product. Our printer
  // does not make one, so the slide shows something they do — their own
  // photograph of the blank, until we have styled shots of our own.
  { id: "kids-tee", image: "/supplier/ge.webp", label: "Детска тениска", href: "/produkt/kids-tee" },
  { id: "tote", image: "/hero/tote.webp", label: "Памучна чанта", href: "/produkt/organic-tote" },
] as const;

export const LIFESTYLE = {
  /** The hero scene: a mug, branded boxes, room on the left for the headline. */
  hero: "/brand/hero.webp",
  /** The personalisation banner: a flat-lay of the things you customise. */
  personalize: "/brand/personalize.webp",
  /** Branded packaging — the box, the hang tag, the tissue, the embroidery. */
  box: "/brand/box.webp",
  tag: "/brand/tag.webp",
  tissue: "/brand/tissue.webp",
  embroidery: "/brand/embroidery.webp",
  /** Warm scenes from the moments sheet, for editorial blocks. */
  giftWrap: "/moments/gift-wrap.webp",
  family: "/moments/family.webp",
  packaging: "/moments/packaging.webp",
} as const;
