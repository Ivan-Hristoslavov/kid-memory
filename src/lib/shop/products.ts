/**
 * The MENTY storefront catalogue.
 *
 * Every entry maps a Menty SKU onto a real PrintFactory item. That mapping is
 * the whole point of this file: the V2 brief is explicit that product cards
 * must show the actual product forms PrintFactory fulfils, never invented ones,
 * and that "product URLs/source codes are stored in data and not hardcoded into
 * visual components". So the components below `/shop` read this and nothing
 * else — no component ever contains a printfactory.bg URL or a product code.
 *
 * This is deliberately a TypeScript module rather than database rows, matching
 * how `lib/catalog.ts` and `lib/articles.ts` already work in this project: a
 * bounded, slow-moving list that wants to be reviewable in a diff. It moves to
 * the database when PrintFactory's feed is wired up and stock/pricing start
 * changing on their schedule rather than ours.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * IMAGES ARE NOT SUPPLIED HERE.
 *
 * `images` holds local paths under /public/products/. Four of them are filled
 * by scripts/gen-brand-assets.ts, which renders a stand-in shot of each item.
 * Those are stand-ins, generated at the owner's instruction: the brief wants
 * the supplier's own photography, and the picture on a card must match the
 * parcel at the door, so they are to be replaced before launch. The rest stay
 * empty; `hasImages()` tells the UI which state to render, so a missing asset
 * degrades to a branded, labelled frame rather than a grey box.
 * ─────────────────────────────────────────────────────────────────────────
 */

import type { PodSupplierId } from "@/lib/pod/types";

/** What can be personalised on an item — drives the product page controls. */
export type PersonalizationKind =
  | "PHOTO"
  | "TEXT"
  | "DATE"
  | "DESIGN"
  | "EMBROIDERY";

/** Broad grouping, used for collection pages and the bestsellers rhythm. */
export type ProductFamily =
  | "DRINKWARE"
  | "APPAREL"
  | "WALL"
  | "ACCESSORIES"
  | "PUZZLES"
  | "HOME"
  | "PACKAGING";

/**
 * Where artwork lands on a product, and how big that area really is.
 *
 * The rectangle is expressed as fractions of the product photograph, so the
 * editor can draw the print window over the mock-up without knowing its pixel
 * size. The millimetre figures are the physical print area, and they are what
 * makes a resolution warning possible: a photo can look fine on screen and
 * still be 80 DPI once it is 90mm wide on a mug.
 */
export interface PrintArea {
  /** Fractions of the product image, 0..1, top-left origin. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Physical print size. */
  widthMm: number;
  heightMm: number;
}

export interface ProductVariantAxis {
  /** "Цвят", "Размер" — shown as the control label. */
  label: string;
  /** Real options from the source catalogue, never invented combinations. */
  options: readonly string[];
}

export interface MentyProduct {
  /** Internal Menty id — what our own URLs and orders reference. */
  id: string;
  /** Bulgarian product title as shown to the customer. */
  title: string;
  /** One line under the title on a product card. */
  blurb: string;
  family: ProductFamily;

  /**
   * Who manufactures and ships this.
   *
   * A field rather than a constant because it has already changed once: the
   * shop moved from PrintFactory to printondemand.bg, and a catalogue that
   * names one supplier in every entry has to be rewritten to move again.
   * Resolved to an implementation through lib/pod.
   */
  supplier: PodSupplierId;
  /**
   * The supplier's product code. Null where their page lists none — those items
   * are still real, they are just identified by URL alone.
   */
  supplierProductCode: string | null;
  /** Canonical supplier page. The authority for form, variants and mockups. */
  supplierUrl: string;

  /**
   * Retail price. See CURRENCY_NOTE below — the reference mockup prices in
   * lева, this ships in euro, and `priceReferenceBGN` keeps the mockup's
   * number so the two can always be reconciled.
   */
  priceEUR: number;
  priceReferenceBGN: number;

  /** Local asset paths under /public/products/. Empty until supplied. */
  images: readonly string[];
  /** Absent on products that take no artwork. */
  printArea?: PrintArea;
  variants: readonly ProductVariantAxis[];
  personalization: readonly PersonalizationKind[];

  /**
   * Which collections this belongs to — ids from GIFT_AUDIENCES and
   * GIFT_OCCASIONS in lib/brand.ts. A gift shop is browsed by recipient and
   * occasion rather than by product family, so this is what the collection
   * pages filter on. Assigned by hand: it is a merchandising decision, not
   * something derivable from the product itself.
   */
  tags: readonly string[];

  /** Shown on the card and the product page. Real counts only, never invented. */
  rating?: { average: number; count: number };
  /** Drives the "Бестселъри" row, in this order. */
  bestsellerRank?: number;
}

/**
 * CURRENCY_NOTE — a deliberate, flagged deviation from the reference.
 *
 * The V2 reference prices every card in лева (24.90 лв. and so on). Bulgaria
 * adopted the euro on 1 January 2026, and this project has been euro-only by an
 * explicit earlier decision — `formatPrice`, the `priceEUR` database column and
 * the courier's cash-on-delivery amount are all euro. Reproducing лева in
 * September 2026 would ship a storefront quoting a currency the country has
 * retired, and would disagree with the amount the courier actually collects.
 *
 * So prices render in euro and `priceReferenceBGN` records what the reference
 * showed. Conversion is at the fixed statutory rate of 1 EUR = 1.95583 BGN,
 * rounded to a retail-looking .90 ending rather than left as a raw division.
 */
export const BGN_PER_EUR = 1.95583;

export const PRODUCTS: readonly MentyProduct[] = [
  {
    id: "photo-mug-330",
    title: "Персонализирана чаша",
    blurb: "Керамична чаша 330 мл със снимка и послание.",
    family: "DRINKWARE",
    supplier: "PRINTFACTORY",
    supplierProductCode: "MD4000",
    supplierUrl: "https://printfactory.bg/print-on-demand-ceramic-mug",
    priceEUR: 12.9,
    priceReferenceBGN: 24.9,
    images: ["/products/photo-mug-330.webp"],
    printArea: { x: 0.3, y: 0.36, width: 0.36, height: 0.32, widthMm: 90, heightMm: 80 },
    tags: ["for-her", "for-him", "for-parents", "birthday", "anniversary", "thank-you", "just-because", "love"],
    variants: [{ label: "Цвят", options: ["Бяла"] }],
    personalization: ["PHOTO", "TEXT"],
    bestsellerRank: 1,
  },
  {
    id: "color-handle-mug",
    title: "Чаша с цветна дръжка",
    blurb: "Бяла керамична чаша с цветна дръжка и вътрешност.",
    family: "DRINKWARE",
    supplier: "PRINTFACTORY",
    supplierProductCode: null,
    supplierUrl:
      "https://printfactory.bg/bqla-keramichna-chasha-s-cvetna-drajka-i-vatreshnost",
    priceEUR: 14.9,
    priceReferenceBGN: 28.9,
    images: ["/products/color-handle-mug.webp"],
    printArea: { x: 0.3, y: 0.36, width: 0.36, height: 0.32, widthMm: 90, heightMm: 80 },
    tags: ["for-her", "for-him", "birthday", "just-because"],
    variants: [
      { label: "Цвят", options: ["Черна", "Синя", "Червена", "Зелена", "Розова"] },
    ],
    personalization: ["PHOTO", "TEXT"],
  },
  {
    id: "premium-tee-stanley-stella",
    title: "Премиум тениска Stanley/Stella",
    blurb: "Унисекс тениска от органичен памук.",
    family: "APPAREL",
    supplier: "PRINTFACTORY",
    supplierProductCode: "STTU755-E",
    supplierUrl:
      "https://printfactory.bg/stanley-stella-organic-creator-print-on-demand-balgaria",
    priceEUR: 20.9,
    priceReferenceBGN: 39.9,
    images: ["/products/premium-tee-stanley-stella.webp"],
    printArea: { x: 0.34, y: 0.3, width: 0.32, height: 0.34, widthMm: 280, heightMm: 380 },
    tags: ["for-him", "for-her", "for-couples", "birthday", "just-because"],
    variants: [
      { label: "Размер", options: ["XS", "S", "M", "L", "XL", "XXL"] },
      { label: "Цвят", options: ["Бяла", "Черна", "Бежова", "Тъмнозелена"] },
    ],
    personalization: ["PHOTO", "TEXT", "DESIGN"],
    bestsellerRank: 2,
  },
  {
    id: "organic-hoodie",
    title: "Суичър с бродерия",
    blurb: "Унисекс суичър от органичен памук, B&C.",
    family: "APPAREL",
    supplier: "PRINTFACTORY",
    supplierProductCode: null,
    supplierUrl:
      "https://printfactory.bg/uniseks-suichar-ot-organichen-pamuck-print-on-demand",
    priceEUR: 30.9,
    priceReferenceBGN: 59.9,
    images: ["/products/organic-hoodie.webp"],
    printArea: { x: 0.36, y: 0.3, width: 0.28, height: 0.24, widthMm: 250, heightMm: 300 },
    tags: ["for-him", "for-her", "for-couples", "birthday", "anniversary"],
    variants: [
      { label: "Размер", options: ["S", "M", "L", "XL", "XXL"] },
      { label: "Цвят", options: ["Тъмнозелен", "Черен", "Бежов", "Сив"] },
    ],
    personalization: ["EMBROIDERY", "TEXT", "DESIGN"],
    bestsellerRank: 4,
  },
  {
    id: "photo-leather-keychain",
    title: "Ключодържател със снимка",
    blurb: "Кожен ключодържател с гравирана снимка.",
    family: "ACCESSORIES",
    supplier: "PRINTFACTORY",
    supplierProductCode: null,
    supplierUrl: "https://printfactory.bg/kojen-kliuchodarjatel-sas-snimka",
    priceEUR: 10.9,
    priceReferenceBGN: 19.9,
    images: ["/products/photo-leather-keychain.webp"],
    printArea: { x: 0.3, y: 0.34, width: 0.4, height: 0.3, widthMm: 50, heightMm: 30 },
    tags: ["for-him", "for-couples", "anniversary", "love", "thank-you"],
    variants: [{ label: "Цвят", options: ["Кафяв", "Черен"] }],
    personalization: ["PHOTO", "TEXT"],
    bestsellerRank: 5,
  },
  {
    id: "metal-keychain-2sided",
    title: "Метален ключодържател",
    blurb: "Двустранен печат върху метал.",
    family: "ACCESSORIES",
    supplier: "PRINTFACTORY",
    supplierProductCode: "YA154",
    supplierUrl:
      "https://printfactory.bg/best-sublimation/metalen-kliuchodarjatel-za-dvustranen-pechat",
    priceEUR: 8.9,
    priceReferenceBGN: 16.9,
    images: ["/products/metal-keychain-2sided.webp"],
    printArea: { x: 0.3, y: 0.34, width: 0.4, height: 0.3, widthMm: 50, heightMm: 30 },
    tags: ["for-him", "for-couples", "love", "just-because"],
    variants: [],
    personalization: ["PHOTO", "TEXT"],
  },
  {
    id: "photo-puzzle-a4",
    title: "Фото пъзел A4",
    blurb: "Картонен пъзел със снимка — спомен, който се сглобява.",
    family: "PUZZLES",
    supplier: "PRINTFACTORY",
    supplierProductCode: "PTA4",
    supplierUrl: "https://printfactory.bg/pazel-a4-120parcheta-pechat-pri-poiskvane",
    priceEUR: 15.9,
    priceReferenceBGN: 29.9,
    images: ["/products/photo-puzzle-a4.webp"],
    printArea: { x: 0.08, y: 0.08, width: 0.84, height: 0.84, widthMm: 210, heightMm: 297 },
    tags: ["for-kids", "for-parents", "for-couples", "birthday", "love"],
    variants: [{ label: "Части", options: ["120"] }],
    personalization: ["PHOTO", "TEXT"],
  },
  {
    id: "organic-tote",
    title: "Памучна чанта",
    blurb: "Плътна чанта от органичен памук.",
    family: "ACCESSORIES",
    supplier: "PRINTFACTORY",
    supplierProductCode: "KI0252",
    supplierUrl:
      "https://printfactory.bg/platna-pamuchna-chanta-ot-organichen-pamuk-print-on-demand",
    priceEUR: 13.9,
    priceReferenceBGN: 26.9,
    images: ["/products/organic-tote.webp"],
    printArea: { x: 0.3, y: 0.32, width: 0.4, height: 0.36, widthMm: 250, heightMm: 250 },
    tags: ["for-her", "for-parents", "thank-you", "just-because"],
    variants: [{ label: "Цвят", options: ["Натурална", "Черна"] }],
    personalization: ["PHOTO", "TEXT", "DESIGN"],
  },
  {
    id: "printed-socks",
    title: "Чорапи с печат",
    blurb: "Памучни чорапи с печат по поръчка.",
    family: "APPAREL",
    supplier: "PRINTFACTORY",
    supplierProductCode: null,
    supplierUrl:
      "https://printfactory.bg/pechat-i-shtampirane-na-chorapi-print-on-demand-balgaria",
    priceEUR: 9.9,
    priceReferenceBGN: 18.9,
    images: ["/products/printed-socks.webp"],
    printArea: { x: 0.34, y: 0.4, width: 0.32, height: 0.2, widthMm: 60, heightMm: 40 },
    tags: ["for-him", "for-kids", "birthday", "just-because"],
    variants: [{ label: "Размер", options: ["36-40", "41-45"] }],
    personalization: ["PHOTO", "DESIGN"],
  },
  {
    id: "studio-waistpack",
    title: "Чанта банан Studio",
    blurb: "Studio Waistpack с персонализиран печат.",
    family: "ACCESSORIES",
    supplier: "PRINTFACTORY",
    supplierProductCode: "BG144",
    supplierUrl: "https://printfactory.bg/aksesoari/chanta-banan-print-on-demand",
    priceEUR: 17.9,
    priceReferenceBGN: 34.9,
    images: ["/products/studio-waistpack.webp"],
    tags: ["for-him", "for-her", "birthday", "just-because"],
    variants: [{ label: "Цвят", options: ["Черна", "Бежова"] }],
    personalization: ["DESIGN", "TEXT"],
  },
];

/**
 * The framed photo poster shown third in the reference's bestsellers row.
 *
 * It is kept separate from the list above because it is the ONE product this
 * shop already makes end to end — the existing AI illustration pipeline, its
 * print files and its fulfilment — rather than something PrintFactory ships.
 * The brief's rule about not replacing real supplier products with invented
 * ones is about the supplier's catalogue; this is not invented, it is the
 * original product, and it keeps its own route through the wizard.
 */
export const OWN_PRODUCTS: readonly MentyProduct[] = [
  {
    id: "photo-poster-framed",
    title: "Постер със снимка в рамка",
    blurb: "Илюстрован постер по твоя снимка, готов за стената.",
    family: "WALL",
    supplier: "PRINTFACTORY",
    supplierProductCode: null,
    supplierUrl: "",
    priceEUR: 17.9,
    priceReferenceBGN: 34.9,
    images: ["/samples/hero-wall.webp"],
    printArea: { x: 0.1, y: 0.08, width: 0.8, height: 0.84, widthMm: 210, heightMm: 297 },
    tags: ["for-parents", "for-couples", "for-kids", "new-baby", "anniversary", "love", "best-friend"],
    variants: [{ label: "Формат", options: ["A4", "A3"] }],
    personalization: ["PHOTO", "TEXT"],
    bestsellerRank: 3,
  },
];

/** Everything sellable, supplier items and our own, in one list. */
export const ALL_PRODUCTS: readonly MentyProduct[] = [
  ...PRODUCTS,
  ...OWN_PRODUCTS,
];

/** True once real assets have been placed under /public/products/. */
export function hasImages(product: MentyProduct): boolean {
  return product.images.length > 0;
}

export function productById(id: string): MentyProduct | undefined {
  return ALL_PRODUCTS.find((p) => p.id === id);
}

/**
 * The five cards in the reference's bestsellers row, in its order:
 * mug, premium tee, framed poster, embroidered hoodie, photo keychain.
 */
export function bestsellers(): readonly MentyProduct[] {
  return ALL_PRODUCTS.filter((p) => p.bestsellerRank !== undefined).sort(
    (a, b) => a.bestsellerRank! - b.bestsellerRank!
  );
}

export function byFamily(family: ProductFamily): readonly MentyProduct[] {
  return ALL_PRODUCTS.filter((p) => p.family === family);
}

/** Everything tagged for one audience or occasion id. */
export function byTag(tag: string): readonly MentyProduct[] {
  return ALL_PRODUCTS.filter((p) => p.tags.includes(tag));
}

/** Everything that can carry a photo, a name or a message. */
export function personalizable(): readonly MentyProduct[] {
  return ALL_PRODUCTS.filter((p) => p.personalization.length > 0);
}

/** How many of the catalogue's product images are still missing. */
export function missingImageCount(): number {
  return ALL_PRODUCTS.filter((p) => !hasImages(p)).length;
}
