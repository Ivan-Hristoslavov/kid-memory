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
  /**
   * Option name → hex, for axes that are colours.
   *
   * Two jobs. It lets the control render swatches instead of a row of words,
   * which is how anyone actually picks a colour; and it is the fill the mock-up
   * is composited over, so choosing "Бургунди" turns the shirt burgundy in the
   * preview. The hexes are the supplier's own, from their colour nomenclature.
   */
  swatch?: Readonly<Record<string, string>>;
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
 * So prices render in euro and `priceReferenceBGN` carries the lev figure
 * alongside. It began as the reference mockup's own number; now that prices are
 * set from real supplier costs it is simply the conversion, at the fixed
 * statutory rate of 1 EUR = 1.95583 BGN, rounded to the nearest .90 ending
 * rather than left as a raw division. Keep it: dual display is what shoppers
 * still read a year into the changeover.
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
 * Prices are ours, and they are set for volume rather than for the fattest
 * margin per order: about 1.6–1.8× the landed cost, and 2× only on the two
 * cheapest blanks, where the absolute margin is small however it is multiplied.
 * A mug at 9.99 and a tee at 16.99 are prices somebody buys without opening
 * another tab; at 14.90 and 26.90 they open the tab.
 *
 * Endings are .99 rather than .90. It is a small trick and a real one — the
 * left digit is what gets read, so 9.99 lands as "nine something" while 10.90
 * lands as "eleven".
 *
 * Landed cost is the blank plus ONE print position at the middle band (3.08;
 * 1.61 on hats and stickers, whose print never reaches 30 cm of side). A second
 * position is charged again, so a two-sided design eats 3.08 of the margin
 * below unless the product page charges for it. `landedCostEUR` in the
 * catalogue module is the number to check any change against.
 *
 * The thinnest lines are the stickers and the gift box, at about 1.5×. Both are
 * add-ons rather than reasons to visit: they exist to lift an order that has
 * already been decided, and 3.90 is a price nobody thinks about.
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
    priceEUR: 9.99,
    priceReferenceBGN: 19.9,
    images: ["/supplier/bejdh.webp"],
    printArea: { x: 0.2367, y: 0.3417, width: 0.5531, height: 0.3417, widthMm: 208, heightMm: 88 },
    tags: ["for-her", "for-him", "for-parents", "birthday", "anniversary", "thank-you", "just-because", "love"],
    variants: [{
        label: "Цвят",
        options: ["Неопределен"],
        swatch: {
        "Неопределен": "#FFFFFF",
        },
      }],
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
    priceEUR: 13.99,
    priceReferenceBGN: 27.9,
    images: ["/supplier/hejg.webp"],
    printArea: { x: 0.2699, y: 0.3212, width: 0.5531, height: 0.5018, widthMm: 86, heightMm: 38 },
    tags: ["for-him", "for-her", "birthday", "thank-you", "just-because"],
    variants: [{
        label: "Цвят",
        options: ["Неопределен"],
        swatch: {
        "Неопределен": "#FFFFFF",
        },
      }],
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
    priceEUR: 13.99,
    priceReferenceBGN: 27.9,
    images: ["/supplier/dagdf.webp"],
    printArea: { x: 0.2367, y: 0.3097, width: 0.5642, height: 0.6305, widthMm: 182, heightMm: 106 },
    tags: ["for-him", "for-her", "for-kids", "birthday", "thank-you"],
    variants: [{
        label: "Цвят",
        options: ["Бял", "Сребро"],
        swatch: {
        "Бял": "#E8E8E8",
        "Сребро": "#A5A7A6",
        },
      }],
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
    priceEUR: 16.99,
    priceReferenceBGN: 33.9,
    images: ["/supplier/c.webp"],
    printArea: { x: 0.2699, y: 0.1977, width: 0.4425, height: 0.692, widthMm: 377, heightMm: 571 },
    tags: ["for-him", "for-her", "for-couples", "birthday", "just-because"],
    variants: [
      { label: "Размер", options: ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"] },
      {
        label: "Цвят",
        options: ["Черен", "Бял", "Сив меланж", "Кобалтово синьо CB", "Огнено червено (FR)", "Бургунди(41)", "Графитено сиво(GL)", "Цинк(XW)", "Зелено(47)", "Горско зелено(TM)", "Кралско синьо(51)", "Морско синьо(32)", "Натурално(60)", "Слънчогледово жълто(34)", "Червено(40)", "Тъмно синьо(AZ)", "Син премиум меланж (VF)", "Червено премиум меланж (VH)", "Зелено ретро меланж (RX)", "Кралско синьо ретро меланж (R6)", "Тъмно сив меланж HD", "Небесно синьо(YT)", "Тъмно зелено(38)", "Маслинено зелено(59)", "FN Navy", "CP Cotton Pink", "SY Yellow", "VG Green", "Светло синьо(ZU)", "Оранжево(44)", "Бледо розово (52)", "Цикламено(57)", "HP heather purple", "Лилаво (PE)", "Каки(3М)", "Шоколадeно(CQ)", "Жълто(K2)", "LM Лайм", "Натурален"],
        swatch: {
        "Черен": "#1B1B1B",
        "Бял": "#E8E8E8",
        "Сив меланж": "#938E8E",
        "Кобалтово синьо CB": "#0B074A",
        "Огнено червено (FR)": "#FD2316",
        "Бургунди(41)": "#4E082F",
        "Графитено сиво(GL)": "#2A2729",
        "Цинк(XW)": "#929A8F",
        "Зелено(47)": "#229C54",
        "Горско зелено(TM)": "#102F20",
        "Кралско синьо(51)": "#26489E",
        "Морско синьо(32)": "#071541",
        "Натурално(60)": "#EFDFAC",
        "Слънчогледово жълто(34)": "#FFC314",
        "Червено(40)": "#FB1227",
        "Тъмно синьо(AZ)": "#060E36",
        "Син премиум меланж (VF)": "#080F29",
        "Червено премиум меланж (VH)": "#852940",
        "Зелено ретро меланж (RX)": "#078D4E",
        "Кралско синьо ретро меланж (R6)": "#5D6BB0",
        "Тъмно сив меланж HD": "#14181E",
        "Небесно синьо(YT)": "#84B8D7",
        "Тъмно зелено(38)": "#102A1B",
        "Маслинено зелено(59)": "#4A4E39",
        "FN Navy": "#282E3C",
        "CP Cotton Pink": "#F5CCD2",
        "SY Yellow": "#FBB517",
        "VG Green": "#00774F",
        "Светло синьо(ZU)": "#2484AC",
        "Оранжево(44)": "#FE5311",
        "Бледо розово (52)": "#FAA1C0",
        "Цикламено(57)": "#CA4175",
        "HP heather purple": "#2E0658",
        "Лилаво (PE)": "#1F006C",
        "Каки(3М)": "#917D60",
        "Шоколадeно(CQ)": "#2C1C18",
        "Жълто(K2)": "#FBFD19",
        "LM Лайм": "#6CBC38",
        "Натурален": "#E2D0BB",
        },
      },
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
    priceEUR: 15.99,
    priceReferenceBGN: 31.9,
    images: ["/supplier/ce.webp"],
    printArea: { x: 0.3031, y: 0.3018, width: 0.4425, height: 0.5713, widthMm: 342, heightMm: 453 },
    tags: ["for-her", "birthday", "just-because", "best-friend"],
    variants: [
      { label: "Размер", options: ["XS", "S", "M", "L", "XL", "2XL", "3XL"] },
      {
        label: "Цвят",
        options: ["Бял", "Черен", "Сив меланж", "(NE) Mint", "H1 heather burgundy", "HP heather purple", "Кобалтово синьо CB", "Огнено червено (FR)", "Графитено сиво(GL)", "Сиво", "Цинк(XW)", "Зелено(47)", "Горско зелено(TM)", "Кралско синьо(51)", "Натурално(60)", "Слънчогледово жълто(34)", "Червено(40)", "Тъмно синьо(AZ)", "Цикламено", "Тъмно сив меланж HD", "CP Cotton Pink", "SY Yellow", "VG Green", "Небесно синьо(YT)", "Светло синьо(ZU)", "Бургунди(41)", "Цикламено(57)", "Морско синьо(32)", "Тъмно зелено(38)", "Оранжево(44)", "Бледо розово (52)", "LM Лайм", "Лилаво (PE)", "Кралско синьо ретро меланж (R6)", "Зелено ретро меланж (RX)", "Син премиум меланж (VF)", "Червено премиум меланж (VH)"],
        swatch: {
        "Бял": "#E8E8E8",
        "Черен": "#1B1B1B",
        "Сив меланж": "#938E8E",
        "(NE) Mint": "#A0D4AC",
        "H1 heather burgundy": "#761253",
        "HP heather purple": "#2E0658",
        "Кобалтово синьо CB": "#0B074A",
        "Огнено червено (FR)": "#FD2316",
        "Графитено сиво(GL)": "#2A2729",
        "Сиво": "#B3B7B4",
        "Цинк(XW)": "#929A8F",
        "Зелено(47)": "#229C54",
        "Горско зелено(TM)": "#102F20",
        "Кралско синьо(51)": "#26489E",
        "Натурално(60)": "#EFDFAC",
        "Слънчогледово жълто(34)": "#FFC314",
        "Червено(40)": "#FB1227",
        "Тъмно синьо(AZ)": "#060E36",
        "Цикламено": "#F52D74",
        "Тъмно сив меланж HD": "#14181E",
        "CP Cotton Pink": "#F5CCD2",
        "SY Yellow": "#FBB517",
        "VG Green": "#00774F",
        "Небесно синьо(YT)": "#84B8D7",
        "Светло синьо(ZU)": "#2484AC",
        "Бургунди(41)": "#4E082F",
        "Цикламено(57)": "#CA4175",
        "Морско синьо(32)": "#071541",
        "Тъмно зелено(38)": "#102A1B",
        "Оранжево(44)": "#FE5311",
        "Бледо розово (52)": "#FAA1C0",
        "LM Лайм": "#6CBC38",
        "Лилаво (PE)": "#1F006C",
        "Кралско синьо ретро меланж (R6)": "#5D6BB0",
        "Зелено ретро меланж (RX)": "#078D4E",
        "Син премиум меланж (VF)": "#080F29",
        "Червено премиум меланж (VH)": "#852940",
        },
      },
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
    priceEUR: 17.99,
    priceReferenceBGN: 35.9,
    images: ["/supplier/iidf.webp"],
    printArea: { x: 0.2699, y: 0.2197, width: 0.4867, height: 0.6837, widthMm: 415, heightMm: 571 },
    tags: ["for-him", "for-her", "for-couples", "birthday", "just-because"],
    variants: [
      { label: "Размер", options: ["XS", "S", "M", "L", "XL", "2XL"] },
      {
        label: "Цвят",
        options: ["Черен", "Бял"],
        swatch: {
        "Черен": "#1B1B1B",
        "Бял": "#E8E8E8",
        },
      },
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
    priceEUR: 21.99,
    priceReferenceBGN: 42.9,
    images: ["/supplier/gddfd.webp"],
    printArea: { x: 0.2699, y: 0.1833, width: 0.4867, height: 0.7331, widthMm: 415, heightMm: 571 },
    tags: ["for-him", "for-her", "birthday"],
    variants: [
      { label: "Размер", options: ["XS", "S", "M", "L", "XL", "2XL"] },
      {
        label: "Цвят",
        options: ["Черен", "Бял"],
        swatch: {
        "Черен": "#1B1B1B",
        "Бял": "#E8E8E8",
        },
      },
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
    priceEUR: 13.99,
    priceReferenceBGN: 27.9,
    images: ["/supplier/ge.webp"],
    printArea: { x: 0.3252, y: 0.2065, width: 0.3982, height: 0.6468, widthMm: 225, heightMm: 325 },
    tags: ["for-kids", "for-parents", "birthday", "just-because"],
    variants: [
      { label: "Размер", options: ["1-2 Години", "2-3 Години", "3-4 Години", "4-5 Години", "5-6 Години", "6-8 Години", "7-8 Години", "9-11 Години", "12-13 Години", "14-15 Години"] },
      {
        label: "Цвят",
        options: ["Черен", "Син премиум меланж (VF)", "Бледо розово (52)", "Тъмно сив меланж HD", "Кралско синьо ретро меланж (R6)", "Червено премиум меланж (VH)", "Зелено ретро меланж (RX)", "Морско синьо(32)", "Кралско синьо(51)", "Небесно синьо(YT)", "Слънчогледово жълто(34)", "Червено(40)", "Бял", "Сив меланж", "Зелено(47)"],
        swatch: {
        "Черен": "#1B1B1B",
        "Син премиум меланж (VF)": "#080F29",
        "Бледо розово (52)": "#FAA1C0",
        "Тъмно сив меланж HD": "#14181E",
        "Кралско синьо ретро меланж (R6)": "#5D6BB0",
        "Червено премиум меланж (VH)": "#852940",
        "Зелено ретро меланж (RX)": "#078D4E",
        "Морско синьо(32)": "#071541",
        "Кралско синьо(51)": "#26489E",
        "Небесно синьо(YT)": "#84B8D7",
        "Слънчогледово жълто(34)": "#FFC314",
        "Червено(40)": "#FB1227",
        "Бял": "#E8E8E8",
        "Сив меланж": "#938E8E",
        "Зелено(47)": "#229C54",
        },
      },
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
    priceEUR: 13.99,
    priceReferenceBGN: 27.9,
    images: ["/supplier/gdab.webp"],
    printArea: { x: 0.3252, y: 0.1836, width: 0.3982, height: 0.5752, widthMm: 164, heightMm: 208 },
    tags: ["new-baby", "for-parents", "for-kids", "thank-you"],
    variants: [
      { label: "Размер", options: ["3 Месеца", "6 Месеца", "9 Месеца", "12 Месеца"] },
      {
        label: "Цвят",
        options: ["Бял", "CP Cotton Pink", "Светло зелено", "Светло Жълто", "Светло Синьо", "Червено(40)"],
        swatch: {
        "Бял": "#E8E8E8",
        "CP Cotton Pink": "#F5CCD2",
        "Светло зелено": "#AED375",
        "Светло Жълто": "#F3DA66",
        "Светло Синьо": "#A4C7E5",
        "Червено(40)": "#FB1227",
        },
      },
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
    priceEUR: 13.99,
    priceReferenceBGN: 27.9,
    images: ["/supplier/ddejj.webp"],
    printArea: { x: 0.2478, y: 0.4926, width: 0.4867, height: 0.3284, widthMm: 376, heightMm: 239 },
    tags: ["for-her", "birthday", "best-friend", "just-because"],
    variants: [
      { label: "Размер", options: ["XS", "S", "M", "L", "XL", "2XL", "3XL"] },
      {
        label: "Цвят",
        options: ["Бял", "Черен"],
        swatch: {
        "Бял": "#E8E8E8",
        "Черен": "#1B1B1B",
        },
      },
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
    priceEUR: 13.99,
    priceReferenceBGN: 27.9,
    images: ["/supplier/de.webp"],
    printArea: { x: 0.2699, y: 0.2371, width: 0.4867, height: 0.6683, widthMm: 383, heightMm: 574 },
    tags: ["for-him", "birthday", "just-because"],
    variants: [
      { label: "Размер", options: ["S", "M", "L", "XL", "2XL", "3XL"] },
      {
        label: "Цвят",
        options: ["Бял", "Черен", "Сив меланж", "Тъмно синьо(AZ)", "Червено(40)", "Кралско синьо(51)"],
        swatch: {
        "Бял": "#E8E8E8",
        "Черен": "#1B1B1B",
        "Сив меланж": "#938E8E",
        "Тъмно синьо(AZ)": "#060E36",
        "Червено(40)": "#FB1227",
        "Кралско синьо(51)": "#26489E",
        },
      },
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
    priceEUR: 12.99,
    priceReferenceBGN: 25.9,
    images: ["/supplier/gh.webp"],
    printArea: { x: 0.2699, y: 0.3028, width: 0.5531, height: 0.6392, widthMm: 347, heightMm: 452 },
    tags: ["for-her", "birthday", "just-because"],
    variants: [
      { label: "Размер", options: ["XS", "S", "M", "L", "XL", "2XL", "3XL"] },
      {
        label: "Цвят",
        options: ["Черен", "Бял", "Сив меланж", "Червено(40)", "Тъмно синьо(AZ)"],
        swatch: {
        "Черен": "#1B1B1B",
        "Бял": "#E8E8E8",
        "Сив меланж": "#938E8E",
        "Червено(40)": "#FB1227",
        "Тъмно синьо(AZ)": "#060E36",
        },
      },
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
    priceEUR: 17.99,
    priceReferenceBGN: 35.9,
    images: ["/supplier/dcc.webp"],
    printArea: { x: 0.3142, y: 0.1855, width: 0.3761, height: 0.7884, widthMm: 374, heightMm: 576 },
    tags: ["for-him", "thank-you", "just-because"],
    variants: [
      { label: "Размер", options: ["S", "M", "L", "XL", "2XL", "3XL"] },
      {
        label: "Цвят",
        options: ["Черен", "Бял", "Слънчогледово жълто(34)", "Тъмно зелено(38)", "Червено(40)", "Бургунди(41)", "Зелено(47)", "Кралско синьо(51)", "Тъмно синьо(AZ)", "Тъмно сив меланж HD", "Кралско синьо ретро меланж (R6)", "Зелено ретро меланж (RX)", "Син премиум меланж (VF)", "Червено премиум меланж (VH)", "Небесно синьо(YT)", "Морско синьо(32)", "Сив меланж", "Оранжево(44)", "Лилаво (PE)", "Смарагдено зелено (77)"],
        swatch: {
        "Черен": "#1B1B1B",
        "Бял": "#E8E8E8",
        "Слънчогледово жълто(34)": "#FFC314",
        "Тъмно зелено(38)": "#102A1B",
        "Червено(40)": "#FB1227",
        "Бургунди(41)": "#4E082F",
        "Зелено(47)": "#229C54",
        "Кралско синьо(51)": "#26489E",
        "Тъмно синьо(AZ)": "#060E36",
        "Тъмно сив меланж HD": "#14181E",
        "Кралско синьо ретро меланж (R6)": "#5D6BB0",
        "Зелено ретро меланж (RX)": "#078D4E",
        "Син премиум меланж (VF)": "#080F29",
        "Червено премиум меланж (VH)": "#852940",
        "Небесно синьо(YT)": "#84B8D7",
        "Морско синьо(32)": "#071541",
        "Сив меланж": "#938E8E",
        "Оранжево(44)": "#FE5311",
        "Лилаво (PE)": "#1F006C",
        "Смарагдено зелено (77)": "#106C5F",
        },
      },
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
    priceEUR: 27.99,
    priceReferenceBGN: 54.9,
    images: ["/supplier/ca.webp"],
    printArea: { x: 0.281, y: 0.3665, width: 0.4425, height: 0.5174, widthMm: 377, heightMm: 522 },
    tags: ["for-him", "for-her", "for-couples", "birthday", "anniversary"],
    variants: [
      { label: "Размер", options: ["S", "M", "L", "XL", "2XL", "3XL"] },
      {
        label: "Цвят",
        options: ["Бял", "Черен"],
        swatch: {
        "Бял": "#E8E8E8",
        "Черен": "#1B1B1B",
        },
      },
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
    priceEUR: 23.99,
    priceReferenceBGN: 46.9,
    images: ["/supplier/cj.webp"],
    printArea: { x: 0.2699, y: 0.249, width: 0.4425, height: 0.473, widthMm: 377, heightMm: 528 },
    tags: ["for-him", "for-her", "birthday", "just-because"],
    variants: [
      { label: "Размер", options: ["S", "M", "L", "XL", "2XL", "3XL"] },
      {
        label: "Цвят",
        options: ["Бял", "Черен"],
        swatch: {
        "Бял": "#E8E8E8",
        "Черен": "#1B1B1B",
        },
      },
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
    priceEUR: 32.99,
    priceReferenceBGN: 64.9,
    images: ["/supplier/eaccd.webp"],
    printArea: { x: 0.3142, y: 0.3641, width: 0.4425, height: 0.5461, widthMm: 526, heightMm: 522 },
    tags: ["for-him", "for-her", "for-couples", "birthday"],
    variants: [
      { label: "Размер", options: ["S", "M", "L", "XL", "2XL"] },
      {
        label: "Цвят",
        options: ["Черен", "Маслинено зелено [P]", "Тъмно синьо [P]", "Тъмно червено", "Бежово"],
        swatch: {
        "Черен": "#1B1B1B",
        "Маслинено зелено [P]": "#434633",
        "Тъмно синьо [P]": "#141621",
        "Тъмно червено": "#4B0720",
        "Бежово": "#B3AC9E",
        },
      },
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
    priceEUR: 33.99,
    priceReferenceBGN: 66.9,
    images: ["/supplier/gcjg.webp"],
    printArea: { x: 0.281, y: 0.399, width: 0.4425, height: 0.5633, widthMm: 377, heightMm: 522 },
    tags: ["for-him", "for-her", "birthday", "anniversary"],
    variants: [
      { label: "Размер", options: ["M", "L", "XL", "2XL"] },
      {
        label: "Цвят",
        options: ["Черен"],
        swatch: {
        "Черен": "#1B1B1B",
        },
      },
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
    priceEUR: 25.99,
    priceReferenceBGN: 50.9,
    images: ["/supplier/eaij.webp"],
    printArea: { x: 0.2699, y: 0.0433, width: 0.531, height: 0.8662, widthMm: 480, heightMm: 909 },
    tags: ["for-him", "birthday", "anniversary"],
    variants: [
      { label: "Размер", options: ["M", "L", "XL", "2XL"] },
      {
        label: "Цвят",
        options: ["Черен"],
        swatch: {
        "Черен": "#1B1B1B",
        },
      },
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
    priceEUR: 22.99,
    priceReferenceBGN: 44.9,
    images: ["/supplier/gdah.webp"],
    printArea: { x: 0.0929, y: 0.2649, width: 0.8407, height: 0.6844, widthMm: 345, heightMm: 388 },
    tags: ["for-him", "just-because"],
    variants: [
      { label: "Размер", options: ["M", "L", "XL", "2XL", "3XL"] },
      {
        label: "Цвят",
        options: ["Черен"],
        swatch: {
        "Черен": "#1B1B1B",
        },
      },
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
    priceEUR: 9.99,
    priceReferenceBGN: 19.9,
    images: ["/supplier/ebih.webp"],
    printArea: { x: 0.2699, y: 0.4425, width: 0.4867, height: 0.4867, widthMm: 373, heightMm: 373 },
    tags: ["for-her", "for-him", "thank-you", "just-because", "best-friend"],
    variants: [{
        label: "Цвят",
        options: ["Натурален", "Черен"],
        swatch: {
        "Натурален": "#E2D0BB",
        "Черен": "#1B1B1B",
        },
      }],
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
    priceEUR: 10.99,
    priceReferenceBGN: 21.9,
    images: ["/supplier/debd.webp"],
    printArea: { x: 0.2699, y: 0.2434, width: 0.4867, height: 0.3097, widthMm: 122, heightMm: 93 },
    tags: ["for-him", "for-her", "birthday", "just-because"],
    variants: [{
        label: "Цвят",
        options: ["Черен", "Бял", "Червено(40)", "Сиво 4C", "Тъмно Кралско Съньо DR", "Тъмно зелено ABG", "Тъмно синьо(AZ)", "Каки(3М)"],
        swatch: {
        "Черен": "#1B1B1B",
        "Бял": "#E8E8E8",
        "Червено(40)": "#FB1227",
        "Сиво 4C": "#B9B6B4",
        "Тъмно Кралско Съньо DR": "#2B3A59",
        "Тъмно зелено ABG": "#374339",
        "Тъмно синьо(AZ)": "#060E36",
        "Каки(3М)": "#917D60",
        },
      }],
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
    priceEUR: 11.99,
    priceReferenceBGN: 23.9,
    images: ["/supplier/dchc.webp"],
    printArea: { x: 0.2257, y: 0.1991, width: 0.5752, height: 0.354, widthMm: 124, heightMm: 70 },
    tags: ["for-him", "birthday", "just-because"],
    variants: [{
        label: "Цвят",
        options: ["Черен"],
        swatch: {
        "Черен": "#1B1B1B",
        },
      }],
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
    priceEUR: 13.99,
    priceReferenceBGN: 27.9,
    images: ["/supplier/djbh.webp"],
    printArea: { x: 0.2699, y: 0.3097, width: 0.4867, height: 0.2655, widthMm: 122, heightMm: 80 },
    tags: ["for-him", "for-her", "birthday", "just-because"],
    variants: [{
        label: "Цвят",
        options: ["Черен", "Бял", "Графитено сиво(GL)", "Каки(3М)", "Маслинено зелено(59)", "Тъмно синьо(AZ)"],
        swatch: {
        "Черен": "#1B1B1B",
        "Бял": "#E8E8E8",
        "Графитено сиво(GL)": "#2A2729",
        "Каки(3М)": "#917D60",
        "Маслинено зелено(59)": "#4A4E39",
        "Тъмно синьо(AZ)": "#060E36",
        },
      }],
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
    priceEUR: 3.49,
    priceReferenceBGN: 6.9,
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
    priceEUR: 3.49,
    priceReferenceBGN: 6.9,
    images: ["/supplier/bbfcc.webp"],
    printArea: { x: 0.115, y: 0.2643, width: 0.8186, height: 0.5507, widthMm: 264, heightMm: 192 },
    tags: ["birthday", "anniversary", "thank-you", "love"],
    variants: [{
        label: "Цвят",
        options: ["Черен", "Бял"],
        swatch: {
        "Черен": "#1B1B1B",
        "Бял": "#E8E8E8",
        },
      }],
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
