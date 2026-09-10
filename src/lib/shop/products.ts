/**
 * The MENTY storefront catalogue.
 *
 * Every entry maps a Menty SKU onto a blank printondemand.bg actually stocks.
 * That mapping is the whole point of this file: product cards must show the
 * forms our printer fulfils, never invented ones, and "product URLs/source
 * codes are stored in data and not hardcoded into visual components". So the
 * components below `/shop` read this and nothing else — no component contains
 * a supplier URL or a product code.
 *
 * This is deliberately a TypeScript module rather than database rows, matching
 * how `lib/catalog.ts` and `lib/articles.ts` already work: a bounded,
 * slow-moving list that wants to be reviewable in a diff. It moves to the
 * database when stock and pricing start changing on the supplier's schedule
 * rather than ours.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * IMAGES ARE THE SUPPLIER'S OWN PHOTOGRAPHS.
 *
 * `images` holds local paths under /public/supplier/, fetched from their S3 on
 * 2026-09-10. They are real photographs of the real blanks, which is what the
 * brief asked for and what the generated stand-ins were never going to be —
 * the picture on a card has to match the parcel at the door.
 *
 * What they do NOT show is a design on the product. A styled shot of a mug
 * carrying an actual customer's photograph is still worth commissioning; until
 * then the product page's own editor is what shows the artwork in place.
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
   * Resolved to an implementation through lib/pod. "OWN" means no print
   * partner at all — the poster is made by this shop's own pipeline, and
   * calling that PrintFactory was simply wrong.
   */
  supplier: PodSupplierId | "OWN";
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

/**
 * The catalogue, rebuilt from printondemand.bg's real assortment.
 *
 * It used to list a photo puzzle, two keychains, printed socks and a waistpack.
 * None of those exist at the supplier the shop actually moved to — they were
 * carried over from the PrintFactory era, and a card for a product nobody can
 * make is worse than a shorter catalogue. Everything below maps to a blank in
 * `lib/pod/catalog.ts`, with its real wholesale cost recorded there.
 *
 * `supplierProductCode` holds the panel's uid, which is what `_u` wants when a
 * personalised product is created, and `supplierUrl` points at that blank's
 * page. Images are their own photographs, fetched to /public/supplier/ rather
 * than hot-linked: their S3 bucket is not a CDN we control, and a supplier who
 * reorganises their storage should not empty our product grid.
 *
 * Prices are ours. Each is roughly 2.5–3× the landed cost for small items and
 * about 2.2× for the expensive garments, because a 50-euro hoodie will not sell
 * at the multiple a 15-euro mug does. `landedCostEUR` in the catalogue module
 * is the number to check them against when they need revisiting.
 */
export const PRODUCTS: readonly MentyProduct[] = [
  // ── Чаши и бутилки ────────────────────────────────────────────────────
  {
    id: "photo-mug-330",
    title: "Персонализирана чаша",
    blurb: "Керамична чаша със снимка и послание, отпечатана в България.",
    family: "DRINKWARE",
    supplier: "PRINTONDEMAND",
    supplierProductCode: "bejdh",
    supplierUrl: "https://printondemand.bg/v2/catalog/create/bejdh",
    priceEUR: 14.9,
    priceReferenceBGN: 28.9,
    images: ["/supplier/bejdh.webp"],
    printArea: { x: 0.3, y: 0.36, width: 0.36, height: 0.32, widthMm: 208, heightMm: 88 },
    tags: ["for-her", "for-him", "for-parents", "birthday", "anniversary", "thank-you", "just-because", "love"],
    variants: [{ label: "Цвят", options: ["Бяла"] }],
    personalization: ["PHOTO", "TEXT"],
    bestsellerRank: 1,
  },
  // The magic mug is missing on purpose, not by oversight.
  //
  // printondemand.bg stocks one (uid `gehah`, 3.27 wholesale), but every image
  // they have for it — the catalogue thumbnail and all three editor mock-ups —
  // is the same plain white mug they use for the ordinary ceramic one. Two
  // identical-looking cards three euro apart tell a customer nothing, and the
  // rule this file opens with is that the picture has to match the parcel. It
  // comes back the moment there is a photograph of the actual mug.
  {
    id: "enamel-mug",
    title: "Емайлирано канче",
    blurb: "За похода, за градината, за кафето на терасата.",
    family: "DRINKWARE",
    supplier: "PRINTONDEMAND",
    supplierProductCode: "hejg",
    supplierUrl: "https://printondemand.bg/v2/catalog/create/hejg",
    priceEUR: 19.9,
    priceReferenceBGN: 38.9,
    images: ["/supplier/hejg.webp"],
    printArea: { x: 0.28, y: 0.34, width: 0.4, height: 0.3, widthMm: 86, heightMm: 38 },
    tags: ["for-him", "for-her", "birthday", "thank-you", "just-because"],
    variants: [{ label: "Цвят", options: ["Бяло"] }],
    personalization: ["PHOTO", "TEXT"],
  },
  {
    id: "aluminium-bottle-500",
    title: "Алуминиева бутилка 500 мл",
    blurb: "Рециклиран алуминий, с име или снимка по избор.",
    family: "DRINKWARE",
    supplier: "PRINTONDEMAND",
    supplierProductCode: "dagdf",
    supplierUrl: "https://printondemand.bg/v2/catalog/create/dagdf",
    priceEUR: 19.9,
    priceReferenceBGN: 38.9,
    images: ["/supplier/dagdf.webp"],
    printArea: { x: 0.34, y: 0.25, width: 0.32, height: 0.5, widthMm: 182, heightMm: 106 },
    tags: ["for-him", "for-her", "for-kids", "birthday", "thank-you"],
    variants: [{ label: "Цвят", options: ["Бяла", "Сребриста"] }],
    personalization: ["PHOTO", "TEXT"],
  },

  // ── Тениски и потници ─────────────────────────────────────────────────
  {
    id: "premium-tee-stanley-stella",
    title: "Премиум тениска Stanley/Stella",
    blurb: "Унисекс тениска от органичен памук, колекция CREATOR.",
    family: "APPAREL",
    supplier: "PRINTONDEMAND",
    supplierProductCode: "c",
    supplierUrl: "https://printondemand.bg/v2/catalog/create/c",
    priceEUR: 26.9,
    priceReferenceBGN: 52.9,
    images: ["/supplier/c.webp"],
    printArea: { x: 0.34, y: 0.3, width: 0.32, height: 0.34, widthMm: 377, heightMm: 571 },
    tags: ["for-him", "for-her", "for-couples", "birthday", "just-because"],
    variants: [
      { label: "Размер", options: ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"] },
      { label: "Цвят", options: ["Бяла", "Черна", "Сив меланж", "Морско синьо", "Червена"] },
    ],
    personalization: ["PHOTO", "TEXT", "DESIGN"],
    bestsellerRank: 2,
  },
  {
    id: "womens-tee",
    title: "Дамска тениска",
    blurb: "Приталена дамска тениска, над трийсет цвята.",
    family: "APPAREL",
    supplier: "PRINTONDEMAND",
    supplierProductCode: "ce",
    supplierUrl: "https://printondemand.bg/v2/catalog/create/ce",
    priceEUR: 24.9,
    priceReferenceBGN: 48.9,
    images: ["/supplier/ce.webp"],
    printArea: { x: 0.34, y: 0.3, width: 0.32, height: 0.34, widthMm: 342, heightMm: 453 },
    tags: ["for-her", "birthday", "just-because", "best-friend"],
    variants: [
      { label: "Размер", options: ["XS", "S", "M", "L", "XL", "2XL", "3XL"] },
      { label: "Цвят", options: ["Бяла", "Черна", "Сив меланж", "Розова", "Мента"] },
    ],
    personalization: ["PHOTO", "TEXT", "DESIGN"],
  },
  {
    id: "oversize-tee",
    title: "Унисекс овърсайз тениска",
    blurb: "Свободна кройка, тежко памучно трико.",
    family: "APPAREL",
    supplier: "PRINTONDEMAND",
    supplierProductCode: "iidf",
    supplierUrl: "https://printondemand.bg/v2/catalog/create/iidf",
    priceEUR: 27.9,
    priceReferenceBGN: 54.9,
    images: ["/supplier/iidf.webp"],
    printArea: { x: 0.34, y: 0.3, width: 0.32, height: 0.34, widthMm: 415, heightMm: 571 },
    tags: ["for-him", "for-her", "for-couples", "birthday", "just-because"],
    variants: [
      { label: "Размер", options: ["XS", "S", "M", "L", "XL", "2XL"] },
      { label: "Цвят", options: ["Черна", "Бяла"] },
    ],
    personalization: ["PHOTO", "TEXT", "DESIGN"],
  },
  {
    id: "heavy-oversize-tee",
    title: "Овърсайз премиум хеви тениска",
    blurb: "Най-плътната ни тениска — плътен памук, който пада тежко.",
    family: "APPAREL",
    supplier: "PRINTONDEMAND",
    supplierProductCode: "gddfd",
    supplierUrl: "https://printondemand.bg/v2/catalog/create/gddfd",
    priceEUR: 32.9,
    priceReferenceBGN: 63.9,
    images: ["/supplier/gddfd.webp"],
    printArea: { x: 0.34, y: 0.3, width: 0.32, height: 0.34, widthMm: 415, heightMm: 571 },
    tags: ["for-him", "for-her", "birthday"],
    variants: [
      { label: "Размер", options: ["XS", "S", "M", "L", "XL", "2XL"] },
      { label: "Цвят", options: ["Черна", "Бяла"] },
    ],
    personalization: ["PHOTO", "TEXT", "DESIGN"],
  },
  {
    id: "kids-tee",
    title: "Детска тениска",
    blurb: "От 1 до 15 години, с рисунката или снимката на детето.",
    family: "APPAREL",
    supplier: "PRINTONDEMAND",
    supplierProductCode: "ge",
    supplierUrl: "https://printondemand.bg/v2/catalog/create/ge",
    priceEUR: 22.9,
    priceReferenceBGN: 44.9,
    images: ["/supplier/ge.webp"],
    printArea: { x: 0.34, y: 0.3, width: 0.32, height: 0.34, widthMm: 225, heightMm: 325 },
    tags: ["for-kids", "for-parents", "birthday", "just-because"],
    variants: [
      { label: "Размер", options: ["1-2 Години", "2-3 Години", "3-4 Години", "4-5 Години", "5-6 Години", "6-8 Години", "7-8 Години", "9-11 Години", "12-13 Години", "14-15 Години"] },
      { label: "Цвят", options: ["Бяла", "Черна", "Розова", "Синя", "Червена"] },
    ],
    personalization: ["PHOTO", "TEXT", "DESIGN"],
  },
  {
    id: "baby-bodysuit",
    title: "Бебешко боди",
    blurb: "Подаръкът за новото бебе — с име и дата на раждане.",
    family: "APPAREL",
    supplier: "PRINTONDEMAND",
    supplierProductCode: "gdab",
    supplierUrl: "https://printondemand.bg/v2/catalog/create/gdab",
    priceEUR: 22.9,
    priceReferenceBGN: 44.9,
    images: ["/supplier/gdab.webp"],
    printArea: { x: 0.34, y: 0.3, width: 0.32, height: 0.34, widthMm: 164, heightMm: 208 },
    tags: ["new-baby", "for-parents", "for-kids", "thank-you"],
    variants: [
      { label: "Размер", options: ["3 Месеца", "6 Месеца", "9 Месеца", "12 Месеца"] },
      { label: "Цвят", options: ["Бяло", "Розово", "Зелено", "Жълто", "Синьо", "Червено"] },
    ],
    personalization: ["TEXT", "DATE", "PHOTO"],
  },
  {
    id: "crop-top",
    title: "Кроп топ",
    blurb: "Къса дамска кройка с печат отпред или отзад.",
    family: "APPAREL",
    supplier: "PRINTONDEMAND",
    supplierProductCode: "ddejj",
    supplierUrl: "https://printondemand.bg/v2/catalog/create/ddejj",
    priceEUR: 22.9,
    priceReferenceBGN: 44.9,
    images: ["/supplier/ddejj.webp"],
    printArea: { x: 0.34, y: 0.32, width: 0.32, height: 0.24, widthMm: 376, heightMm: 239 },
    tags: ["for-her", "birthday", "best-friend", "just-because"],
    variants: [
      { label: "Размер", options: ["XS", "S", "M", "L", "XL", "2XL", "3XL"] },
      { label: "Цвят", options: ["Бял", "Черен"] },
    ],
    personalization: ["PHOTO", "TEXT", "DESIGN"],
  },
  {
    id: "mens-tank",
    title: "Мъжки потник",
    blurb: "За лятото и за залата.",
    family: "APPAREL",
    supplier: "PRINTONDEMAND",
    supplierProductCode: "de",
    supplierUrl: "https://printondemand.bg/v2/catalog/create/de",
    priceEUR: 22.9,
    priceReferenceBGN: 44.9,
    images: ["/supplier/de.webp"],
    printArea: { x: 0.35, y: 0.28, width: 0.3, height: 0.38, widthMm: 383, heightMm: 574 },
    tags: ["for-him", "birthday", "just-because"],
    variants: [
      { label: "Размер", options: ["S", "M", "L", "XL", "2XL", "3XL"] },
      { label: "Цвят", options: ["Бял", "Черен", "Сив меланж", "Тъмно синьо", "Червен"] },
    ],
    personalization: ["PHOTO", "TEXT", "DESIGN"],
  },
  {
    id: "womens-tank",
    title: "Дамски потник",
    blurb: "Лека дамска кройка с печат по избор.",
    family: "APPAREL",
    supplier: "PRINTONDEMAND",
    supplierProductCode: "gh",
    supplierUrl: "https://printondemand.bg/v2/catalog/create/gh",
    priceEUR: 21.9,
    priceReferenceBGN: 42.9,
    images: ["/supplier/gh.webp"],
    printArea: { x: 0.35, y: 0.28, width: 0.3, height: 0.38, widthMm: 347, heightMm: 452 },
    tags: ["for-her", "birthday", "just-because"],
    variants: [
      { label: "Размер", options: ["XS", "S", "M", "L", "XL", "2XL", "3XL"] },
      { label: "Цвят", options: ["Черен", "Бял", "Сив меланж", "Червен"] },
    ],
    personalization: ["PHOTO", "TEXT", "DESIGN"],
  },
  {
    id: "mens-polo",
    title: "Мъжка Polo риза",
    blurb: "Яка и копчета — за офиса и за фирмения подарък.",
    family: "APPAREL",
    supplier: "PRINTONDEMAND",
    supplierProductCode: "dcc",
    supplierUrl: "https://printondemand.bg/v2/catalog/create/dcc",
    priceEUR: 27.9,
    priceReferenceBGN: 54.9,
    images: ["/supplier/dcc.webp"],
    printArea: { x: 0.36, y: 0.3, width: 0.28, height: 0.34, widthMm: 374, heightMm: 576 },
    tags: ["for-him", "thank-you", "just-because"],
    variants: [
      { label: "Размер", options: ["S", "M", "L", "XL", "2XL", "3XL"] },
      { label: "Цвят", options: ["Черна", "Бяла", "Тъмно синя", "Червена", "Зелена"] },
    ],
    personalization: ["TEXT", "DESIGN", "EMBROIDERY"],
  },

  // ── Суичъри и долнища ─────────────────────────────────────────────────
  {
    id: "organic-hoodie",
    title: "Унисекс суичър",
    blurb: "Класически суичър с качулка, печат или бродерия.",
    family: "APPAREL",
    supplier: "PRINTONDEMAND",
    supplierProductCode: "ca",
    supplierUrl: "https://printondemand.bg/v2/catalog/create/ca",
    priceEUR: 42.9,
    priceReferenceBGN: 83.9,
    images: ["/supplier/ca.webp"],
    printArea: { x: 0.34, y: 0.32, width: 0.32, height: 0.3, widthMm: 377, heightMm: 522 },
    tags: ["for-him", "for-her", "for-couples", "birthday", "anniversary"],
    variants: [
      { label: "Размер", options: ["S", "M", "L", "XL", "2XL", "3XL"] },
      { label: "Цвят", options: ["Бял", "Черен"] },
    ],
    personalization: ["TEXT", "DESIGN", "EMBROIDERY"],
    bestsellerRank: 4,
  },
  {
    id: "unisex-sweatshirt",
    title: "Унисекс блуза",
    blurb: "Суичър без качулка — тихият вариант на същия подарък.",
    family: "APPAREL",
    supplier: "PRINTONDEMAND",
    supplierProductCode: "cj",
    supplierUrl: "https://printondemand.bg/v2/catalog/create/cj",
    priceEUR: 36.9,
    priceReferenceBGN: 71.9,
    images: ["/supplier/cj.webp"],
    printArea: { x: 0.34, y: 0.32, width: 0.32, height: 0.26, widthMm: 377, heightMm: 528 },
    tags: ["for-him", "for-her", "birthday", "just-because"],
    variants: [
      { label: "Размер", options: ["S", "M", "L", "XL", "2XL", "3XL"] },
      { label: "Цвят", options: ["Бяла", "Черна"] },
    ],
    personalization: ["TEXT", "DESIGN", "EMBROIDERY"],
  },
  {
    id: "oversize-hoodie",
    title: "Овърсайз суичър",
    blurb: "Широка кройка с връзки, в пет приглушени цвята.",
    family: "APPAREL",
    supplier: "PRINTONDEMAND",
    supplierProductCode: "eaccd",
    supplierUrl: "https://printondemand.bg/v2/catalog/create/eaccd",
    priceEUR: 49.9,
    priceReferenceBGN: 97.9,
    images: ["/supplier/eaccd.webp"],
    printArea: { x: 0.34, y: 0.32, width: 0.32, height: 0.3, widthMm: 526, heightMm: 522 },
    tags: ["for-him", "for-her", "for-couples", "birthday"],
    variants: [
      { label: "Размер", options: ["S", "M", "L", "XL", "2XL"] },
      { label: "Цвят", options: ["Черен", "Маслинен", "Тъмно син", "Бордо", "Пясъчен"] },
    ],
    personalization: ["TEXT", "DESIGN", "EMBROIDERY"],
  },
  {
    id: "zip-hoodie",
    title: "Унисекс ватиран суичър с цип",
    blurb: "Ватиран, с цял цип и джобове.",
    family: "APPAREL",
    supplier: "PRINTONDEMAND",
    supplierProductCode: "gcjg",
    supplierUrl: "https://printondemand.bg/v2/catalog/create/gcjg",
    priceEUR: 49.9,
    priceReferenceBGN: 97.9,
    images: ["/supplier/gcjg.webp"],
    printArea: { x: 0.34, y: 0.32, width: 0.32, height: 0.3, widthMm: 377, heightMm: 522 },
    tags: ["for-him", "for-her", "birthday", "anniversary"],
    variants: [
      { label: "Размер", options: ["M", "L", "XL", "2XL"] },
      { label: "Цвят", options: ["Черен"] },
    ],
    personalization: ["TEXT", "DESIGN", "EMBROIDERY"],
  },
  {
    id: "mens-tracksuit",
    title: "Мъжки ватиран анцуг",
    blurb: "Комплект за зимата, с бродирано име по избор.",
    family: "APPAREL",
    supplier: "PRINTONDEMAND",
    supplierProductCode: "eaij",
    supplierUrl: "https://printondemand.bg/v2/catalog/create/eaij",
    priceEUR: 39.9,
    priceReferenceBGN: 77.9,
    images: ["/supplier/eaij.webp"],
    printArea: { x: 0.36, y: 0.3, width: 0.28, height: 0.36, widthMm: 480, heightMm: 909 },
    tags: ["for-him", "birthday", "anniversary"],
    variants: [
      { label: "Размер", options: ["M", "L", "XL", "2XL"] },
      { label: "Цвят", options: ["Черен"] },
    ],
    personalization: ["TEXT", "DESIGN", "EMBROIDERY"],
  },
  {
    id: "shorts",
    title: "Къс панталон",
    blurb: "Летни шорти с печат отпред или отзад.",
    family: "APPAREL",
    supplier: "PRINTONDEMAND",
    supplierProductCode: "gdah",
    supplierUrl: "https://printondemand.bg/v2/catalog/create/gdah",
    priceEUR: 34.9,
    priceReferenceBGN: 67.9,
    images: ["/supplier/gdah.webp"],
    printArea: { x: 0.32, y: 0.3, width: 0.36, height: 0.34, widthMm: 345, heightMm: 388 },
    tags: ["for-him", "just-because"],
    variants: [
      { label: "Размер", options: ["M", "L", "XL", "2XL", "3XL"] },
      { label: "Цвят", options: ["Черен"] },
    ],
    personalization: ["TEXT", "DESIGN"],
  },

  // ── Аксесоари ─────────────────────────────────────────────────────────
  {
    id: "organic-tote",
    title: "Памучна чанта",
    blurb: "100% памук, 37 × 41 см — за пазара и за книгите.",
    family: "ACCESSORIES",
    supplier: "PRINTONDEMAND",
    supplierProductCode: "ebih",
    supplierUrl: "https://printondemand.bg/v2/catalog/create/ebih",
    priceEUR: 16.9,
    priceReferenceBGN: 32.9,
    images: ["/supplier/ebih.webp"],
    printArea: { x: 0.25, y: 0.28, width: 0.5, height: 0.44, widthMm: 373, heightMm: 373 },
    tags: ["for-her", "for-him", "thank-you", "just-because", "best-friend"],
    variants: [{ label: "Цвят", options: ["Натурална", "Черна"] }],
    personalization: ["PHOTO", "TEXT", "DESIGN"],
  },
  {
    id: "dad-hat",
    title: "Унисекс шапка",
    blurb: "Класическа шапка с козирка, осем цвята.",
    family: "ACCESSORIES",
    supplier: "PRINTONDEMAND",
    supplierProductCode: "debd",
    supplierUrl: "https://printondemand.bg/v2/catalog/create/debd",
    priceEUR: 16.9,
    priceReferenceBGN: 32.9,
    images: ["/supplier/debd.webp"],
    printArea: { x: 0.32, y: 0.38, width: 0.36, height: 0.2, widthMm: 122, heightMm: 93 },
    tags: ["for-him", "for-her", "birthday", "just-because"],
    variants: [{ label: "Цвят", options: ["Черна", "Бяла", "Червена", "Сива", "Тъмно синя", "Каки"] }],
    personalization: ["TEXT", "DESIGN", "EMBROIDERY"],
  },
  {
    id: "trucker-hat",
    title: "Унисекс шапка с мрежа",
    blurb: "Trucker кройка с дишащ гръб.",
    family: "ACCESSORIES",
    supplier: "PRINTONDEMAND",
    supplierProductCode: "dchc",
    supplierUrl: "https://printondemand.bg/v2/catalog/create/dchc",
    priceEUR: 19.9,
    priceReferenceBGN: 38.9,
    images: ["/supplier/dchc.webp"],
    printArea: { x: 0.32, y: 0.38, width: 0.36, height: 0.2, widthMm: 124, heightMm: 70 },
    tags: ["for-him", "birthday", "just-because"],
    variants: [{ label: "Цвят", options: ["Черна"] }],
    personalization: ["TEXT", "DESIGN", "EMBROIDERY"],
  },
  {
    id: "bucket-hat",
    title: "Унисекс шапка идиотка",
    blurb: "Bucket шапка за лятото, с печат от двете страни.",
    family: "ACCESSORIES",
    supplier: "PRINTONDEMAND",
    supplierProductCode: "djbh",
    supplierUrl: "https://printondemand.bg/v2/catalog/create/djbh",
    priceEUR: 21.9,
    priceReferenceBGN: 42.9,
    images: ["/supplier/djbh.webp"],
    printArea: { x: 0.32, y: 0.4, width: 0.36, height: 0.18, widthMm: 122, heightMm: 80 },
    tags: ["for-him", "for-her", "birthday", "just-because"],
    variants: [{ label: "Цвят", options: ["Черна", "Бяла", "Графит", "Каки", "Маслинена", "Тъмно синя"] }],
    personalization: ["TEXT", "DESIGN", "EMBROIDERY"],
  },
  {
    id: "photo-stickers",
    title: "Стикери със снимка",
    blurb: "Водоустойчиви стикери — за лаптопа, бутилката и тетрадката.",
    family: "ACCESSORIES",
    supplier: "PRINTONDEMAND",
    supplierProductCode: "bbahe",
    supplierUrl: "https://printondemand.bg/v2/catalog/create/bbahe",
    priceEUR: 4.9,
    priceReferenceBGN: 9.9,
    images: ["/supplier/bbahe.webp"],
    printArea: { x: 0.1, y: 0.1, width: 0.8, height: 0.8, widthMm: 105, heightMm: 105 },
    tags: ["for-kids", "for-her", "for-him", "just-because", "best-friend"],
    variants: [{ label: "Размер", options: ["5 × 5 см", "7 × 7 см", "10 × 10 см"] }],
    personalization: ["PHOTO", "TEXT", "DESIGN"],
  },

  // ── Опаковка ──────────────────────────────────────────────────────────
  {
    id: "gift-box",
    title: "Подаръчна кутия",
    blurb: "Картонена кутия с печат — подаръкът пристига опакован.",
    family: "PACKAGING",
    supplier: "PRINTONDEMAND",
    supplierProductCode: "bbfcc",
    supplierUrl: "https://printondemand.bg/v2/catalog/create/bbfcc",
    priceEUR: 3.9,
    priceReferenceBGN: 7.9,
    images: ["/supplier/bbfcc.webp"],
    printArea: { x: 0.15, y: 0.2, width: 0.7, height: 0.5, widthMm: 264, heightMm: 192 },
    tags: ["birthday", "anniversary", "thank-you", "love"],
    variants: [{ label: "Цвят", options: ["Черна", "Бяла"] }],
    personalization: ["TEXT", "DESIGN"],
  },
];


/**
 * The framed photo poster shown third in the reference's bestsellers row.
 *
 * It is kept separate from the list above because it is the ONE product this
 * shop already makes end to end — the existing AI illustration pipeline, its
 * print files and its fulfilment — rather than something the printer ships.
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
    supplier: "OWN",
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
 * The bestsellers row, in its order: mug, premium tee, framed poster, hoodie.
 *
 * Four rather than the reference's five — the fifth card was a photo keychain,
 * and our printer does not make one. A row of four real products beats a row of
 * five with a gap where one of them should be.
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
