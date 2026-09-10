/**
 * printondemand.bg's blank catalogue, and what each blank costs us.
 *
 * Read from their panel on 2026-09-10: the assortment from `/v2/cat/view/prd`
 * and the wholesale prices from the price list at `/v2/info-center/prices`.
 * Both are behind a login, so this is a snapshot rather than a live feed —
 * `scripts/pod-catalog-check.ts` re-reads the public halves and says when it
 * has drifted.
 *
 * Why a snapshot at all, when `lib/shop/products.ts` already lists what we
 * sell? Because that file was written from guesses. Every price in it was a
 * plausible number rather than a real one, which is a bad way to run a shop
 * whose margin is the difference between two figures. This file holds the one
 * we do not control; the shop's own file holds the one we do.
 *
 * PRICES ARE EUR, VAT INCLUDED — their price list is quoted that way, and the
 * account is set to EUR (`uData.currency.code === "EUR"`), so no conversion
 * happens anywhere and none should be added.
 */

export interface SupplierBlank {
  /** Their id in the panel URL: `/v2/catalog/create/<uid>`. Also `_u` when creating. */
  uid: string;
  /** Their numeric product id. */
  id: number;
  /** Their Bulgarian name, kept verbatim so their support and ours match. */
  name: string;
  /** What the blank costs us, cheapest variant, EUR incl. VAT. */
  costEUR: number;
  /** The dearest variant, where sizes or colours change the price. */
  costMaxEUR: number;
  /** Whose blank the cheapest price belongs to — the same garment differs by maker. */
  cheapestFrom: string;
  /** Every maker they stock this blank from. */
  manufacturers: string[];
  collections: string[];
  /** Their size names, exactly as ordered — `size_id` is looked up from these. */
  sizes: string[];
  /** Available colours as hex, in their own order. */
  colors: string[];
  /** Their photograph of the blank, on S3 and publicly reachable. */
  image: string;
  /** False for things a customer cannot buy — print media sold by the roll. */
  retail: boolean;
}

const S3 = "https://prinondemandbg.s3.eu-north-1.amazonaws.com/catalog/cache/";

/**
 * What printing costs, per print position, EUR incl. VAT.
 *
 * Their price list bands it by the sum of the artwork's sides in centimetres,
 * which is unusual but consistent across every garment — the same three
 * numbers appear under every manufacturer. A mug printed front and back is
 * therefore charged twice, and any quote that forgets this is short by 1.61 at
 * the very least.
 */
export const PRINT_PRICE_EUR = {
  /** Sum of sides under 30 cm. */
  small: 1.61,
  /** Sum of sides under 70 cm. */
  medium: 3.08,
  /** The full print area. */
  full: 4.6,
} as const;

export type PrintSize = keyof typeof PRINT_PRICE_EUR;

export const SUPPLIER_BLANKS: readonly SupplierBlank[] = [
  {
    uid: "gddfd", id: 63353, name: "Овърсайз Премиум Хеви Тениска",
    costEUR: 10.2, costMaxEUR: 10.71, cheapestFrom: "Shine · HEAVY Oversized",
    manufacturers: ["Shine (printondemand.bg)"], collections: ["HEAVY Oversized"],
    sizes: ["XS", "S", "M", "L", "XL", "2XL"],
    colors: ["#1B1B1B", "#E8E8E8"],
    image: `${S3}6601181871f095412bb2f284e337684d/oversize%20lice%20bl%20-wbp2-556x646.webp`,
    retail: true,
  },
  {
    uid: "iidf", id: 8835, name: "Унисекс Овърсайз тениска",
    costEUR: 7.56, costMaxEUR: 8.07, cheapestFrom: "Shine · Premium OVERSIZED",
    manufacturers: ["Shine (printondemand.bg)"], collections: ["Premium OVERSIZED"],
    sizes: ["XS", "S", "M", "L", "XL", "2XL"],
    colors: ["#1B1B1B", "#E8E8E8"],
    image: `${S3}3e498b5bdb6cdd08a1ba3e6caf8172ea/oversize%20tshirt%20cut-wbp2-556x646.webp`,
    retail: true,
  },
  {
    uid: "c", id: 2, name: "Мъжка тениска",
    costEUR: 3.68, costMaxEUR: 7.59, cheapestFrom: "Roly · ATOMIC 150",
    manufacturers: ["Shine (printondemand.bg)", "Fruit Of The Loom", "Stanley and Stella", "Roly"],
    collections: ["Premium", "Iconic", "Rocker", "Valueweight", "ATOMIC 150", "CREATOR", "CREATOR 2.0"],
    sizes: ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"],
    colors: ["#1B1B1B", "#E8E8E8", "#938E8E", "#0B074A", "#FD2316", "#4E082F", "#2A2729", "#929A8F", "#229C54", "#102F20", "#26489E", "#071541", "#EFDFAC", "#FFC314", "#FB1227", "#060E36", "#080F29", "#852940", "#078D4E", "#5D6BB0", "#14181E", "#84B8D7", "#102A1B", "#4A4E39", "#282E3C", "#F5CCD2", "#FBB517", "#00774F", "#2484AC", "#FE5311", "#FAA1C0", "#CA4175", "#2E0658", "#1F006C", "#917D60", "#2C1C18", "#FBFD19", "#6CBC38", "#E2D0BB"],
    image: `${S3}b0ff9be377a8f3119b5b9fb6bf660699/t-shirt-mockup-of-a-serious-man-casually-posing-in-a-studio-46019-r-el2%20-%20Copy1-wbp2-556x646.webp`,
    retail: true,
  },
  {
    uid: "ce", id: 24, name: "Дамска тениска",
    costEUR: 4.17, costMaxEUR: 6.75, cheapestFrom: "Fruit Of The Loom · Iconic",
    manufacturers: ["Shine (printondemand.bg)", "Fruit Of The Loom", "Stanley and Stella"],
    collections: ["Premium", "Iconic", "Jazzer", "Valueweight"],
    sizes: ["XS", "S", "M", "L", "XL", "2XL", "3XL"],
    colors: ["#E8E8E8", "#1B1B1B", "#938E8E", "#A0D4AC", "#761253", "#2E0658", "#0B074A", "#FD2316", "#2A2729", "#B3B7B4", "#929A8F", "#229C54", "#102F20", "#26489E", "#EFDFAC", "#FFC314", "#FB1227", "#060E36", "#F52D74", "#14181E", "#F5CCD2", "#FBB517", "#00774F", "#84B8D7", "#2484AC", "#4E082F", "#CA4175", "#071541", "#102A1B", "#FE5311", "#FAA1C0", "#6CBC38", "#1F006C", "#5D6BB0", "#078D4E", "#080F29", "#852940"],
    image: `${S3}92c8bfe88a80e291cbc6f50153a72914/womens-tshirt-black-wbp2-556x646.webp`,
    retail: true,
  },
  {
    uid: "ca", id: 20, name: "Унисекс суичър",
    costEUR: 14.46, costMaxEUR: 14.97, cheapestFrom: "Shine · Premium",
    manufacturers: ["Shine (printondemand.bg)"], collections: ["Premium"],
    sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
    colors: ["#E8E8E8", "#1B1B1B"],
    image: `${S3}54c4837fd9e34cd7a16efe9223b10a32/unisex-hoodie-wbp2-556x646.webp`,
    retail: true,
  },
  {
    uid: "cj", id: 29, name: "Унисекс блуза",
    costEUR: 11.4, costMaxEUR: 11.91, cheapestFrom: "Shine · Premium",
    manufacturers: ["Shine (printondemand.bg)"], collections: ["Premium"],
    sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
    colors: ["#E8E8E8", "#1B1B1B"],
    image: `${S3}1bd0a5a9d84493ea8fc52c2f8defbc63/unisex-sweatshirt-cover-wbp2-556x646.webp`,
    retail: true,
  },
  {
    uid: "gcjg", id: 6296, name: "Унисекс ватиран суичър с цип",
    costEUR: 18.96, costMaxEUR: 19.47, cheapestFrom: "Shine · Premium",
    manufacturers: ["Shine (printondemand.bg)"], collections: ["Premium"],
    sizes: ["M", "L", "XL", "2XL"],
    colors: ["#1B1B1B"],
    image: `${S3}9e2b02afe43eb8750c7a04b233f346f5/zipped%20hoodie%20front-wbp2-556x646.webp`,
    retail: true,
  },
  {
    uid: "eaccd", id: 40223, name: "Овърсайз суичър",
    costEUR: 18.61, costMaxEUR: 19.12, cheapestFrom: "Shine · Premium OVERSIZED",
    manufacturers: ["Shine (printondemand.bg)"], collections: ["Premium OVERSIZED"],
    sizes: ["S", "M", "L", "XL", "2XL"],
    colors: ["#1B1B1B", "#434633", "#141621", "#4B0720", "#B3AC9E"],
    image: `${S3}90ca12f78fc7dad5aa78cdd7a858779e/hoody_djob_vryzki_%20-wbp2-556x646.webp`,
    retail: true,
  },
  {
    uid: "ddejj", id: 33499, name: "Кроп топ",
    costEUR: 5.46, costMaxEUR: 5.97, cheapestFrom: "Shine · Premium",
    manufacturers: ["Shine (printondemand.bg)"], collections: ["Premium"],
    sizes: ["XS", "S", "M", "L", "XL", "2XL", "3XL"],
    colors: ["#E8E8E8", "#1B1B1B"],
    image: `${S3}9422b6b17f407cda1cad14f8d74f0c85/Kysa%20damska%20teniska%20%281%29-wbp2-556x646.webp`,
    retail: true,
  },
  {
    uid: "eaij", id: 4089, name: "Мъжки Ватиран Анцуг",
    costEUR: 13.14, costMaxEUR: 13.14, cheapestFrom: "Shine · Premium",
    manufacturers: ["Shine (printondemand.bg)"], collections: ["Premium"],
    sizes: ["M", "L", "XL", "2XL"],
    colors: ["#1B1B1B"],
    image: `${S3}c18552eaf20c28361041bcef79ef661c/cover_1000-wbp2-556x646.webp`,
    retail: true,
  },
  {
    uid: "gdah", id: 6307, name: "Къс панталон",
    costEUR: 11.16, costMaxEUR: 11.16, cheapestFrom: "Shine · Premium",
    manufacturers: ["Shine (printondemand.bg)"], collections: ["Premium"],
    sizes: ["M", "L", "XL", "2XL", "3XL"],
    colors: ["#1B1B1B"],
    image: `${S3}399a320c28ea16187998c8c70d96e31d/shorts%20front-wbp2-556x646.webp`,
    retail: true,
  },
  {
    uid: "ge", id: 64, name: "Детска тениска",
    costEUR: 3.63, costMaxEUR: 5.52, cheapestFrom: "Fruit Of The Loom · Valueweight",
    manufacturers: ["Shine (printondemand.bg)", "Fruit Of The Loom"],
    collections: ["Premium", "Valueweight"],
    sizes: ["1-2 Години", "2-3 Години", "3-4 Години", "4-5 Години", "5-6 Години", "6-8 Години", "7-8 Години", "9-11 Години", "12-13 Години", "14-15 Години"],
    colors: ["#1B1B1B", "#080F29", "#FAA1C0", "#14181E", "#5D6BB0", "#852940", "#078D4E", "#071541", "#26489E", "#84B8D7", "#FFC314", "#FB1227", "#E8E8E8", "#938E8E", "#229C54"],
    image: `${S3}6891cb3d44b48958e3eb1d0944a437eb/kids%20tshirt%20-%20Copy-wbp2-556x646.webp`,
    retail: true,
  },
  {
    uid: "gdab", id: 6301, name: "Бебешко Боди",
    costEUR: 5.46, costMaxEUR: 5.46, cheapestFrom: "Shine · Premium",
    manufacturers: ["Shine (printondemand.bg)"], collections: ["Premium"],
    sizes: ["3 Месеца", "6 Месеца", "9 Месеца", "12 Месеца"],
    colors: ["#E8E8E8", "#F5CCD2", "#AED375", "#F3DA66", "#A4C7E5", "#FB1227"],
    image: `${S3}1d437c77d00d62cf6c33770196e98669/bodysuit%20product-wbp2-556x646.webp`,
    retail: true,
  },
  {
    uid: "de", id: 34, name: "Мъжки потник",
    costEUR: 4.09, costMaxEUR: 6.39, cheapestFrom: "Fruit Of The Loom · Valueweight",
    manufacturers: ["Shine (printondemand.bg)", "Fruit Of The Loom"],
    collections: ["Premium", "Valueweight"],
    sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
    colors: ["#E8E8E8", "#1B1B1B", "#938E8E", "#060E36", "#FB1227", "#26489E"],
    image: `${S3}19da41f91b9e16af1c02e201d98a9287/mens-tank-top-cover-wbp2-556x646.webp`,
    retail: true,
  },
  {
    uid: "gh", id: 67, name: "Дамски потник",
    costEUR: 4.09, costMaxEUR: 5.11, cheapestFrom: "Fruit Of The Loom · Valueweight",
    manufacturers: ["Shine (printondemand.bg)", "Fruit Of The Loom"],
    collections: ["Premium", "Valueweight"],
    sizes: ["XS", "S", "M", "L", "XL", "2XL", "3XL"],
    colors: ["#1B1B1B", "#E8E8E8", "#938E8E", "#FB1227", "#060E36"],
    image: `${S3}fbcce4492b3c1251cdad10e87fef2513/womens-tank-top-cover-wbp2-556x646.webp`,
    retail: true,
  },
  {
    uid: "dcc", id: 322, name: "Мъжка Polo риза",
    costEUR: 7.06, costMaxEUR: 8.08, cheapestFrom: "Fruit Of The Loom · Polo",
    manufacturers: ["Fruit Of The Loom"], collections: ["Polo"],
    sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
    colors: ["#1B1B1B", "#E8E8E8", "#FFC314", "#102A1B", "#FB1227", "#4E082F", "#229C54", "#26489E", "#060E36", "#14181E", "#5D6BB0", "#078D4E", "#080F29", "#852940", "#84B8D7", "#071541", "#938E8E", "#FE5311", "#1F006C", "#106C5F"],
    image: `${S3}e3635eb52890781c609178a430ff5b09/polo-shirt-mockup-featuring-a-man-looking-downwards-3190-el111-wbp2-556x646.webp`,
    retail: true,
  },
  {
    uid: "ebih", id: 4187, name: "Чанта 100% памук",
    costEUR: 1.78, costMaxEUR: 1.78, cheapestFrom: "Hidea · Natural",
    manufacturers: ["Hidea"], collections: ["Natural"],
    sizes: ["Чанта памучна 37 x 41 cm"],
    colors: ["#E2D0BB", "#1B1B1B"],
    image: `${S3}d0a1ca918f8b0f08ed5e05d96b3f9500/92414-60%20Natural-wbp2-556x646.webp`,
    retail: true,
  },
  {
    uid: "dchc", id: 3272, name: "Унисекс Шапка с мрежа",
    costEUR: 5.37, costMaxEUR: 5.37, cheapestFrom: "Atlantis · Rapper",
    manufacturers: ["Atlantis"], collections: ["Rapper"],
    sizes: ["Шапка Унисекс"],
    colors: ["#1B1B1B"],
    image: `${S3}14658e348f560ad564c2a603db1b624d/mockup-of-a-trucker-hat-balancing-on-its-bill-11751-wbp2-556x646.webp`,
    retail: true,
  },
  {
    uid: "debd", id: 3413, name: "Унисекс Шапка",
    costEUR: 3.17, costMaxEUR: 3.17, cheapestFrom: "Atlantis · LIBERTY FIVE",
    manufacturers: ["Atlantis"], collections: ["LIBERTY FIVE"],
    sizes: ["Шапка Унисекс"],
    colors: ["#1B1B1B", "#E8E8E8", "#FB1227", "#B9B6B4", "#2B3A59", "#374339", "#060E36", "#917D60"],
    image: `${S3}453ca6d3e9291459cc930b1dee55d737/dad-hat-mockup-over-a-null-background-a11707ready1111-wbp2-556x646.webp`,
    retail: true,
  },
  {
    uid: "djbh", id: 3917, name: "Унисекс Шапка Идиотка",
    costEUR: 6.75, costMaxEUR: 6.75, cheapestFrom: "Atlantis · Geo",
    manufacturers: ["Atlantis"], collections: ["Geo"],
    sizes: ["Шапка Унисекс"],
    colors: ["#1B1B1B", "#E8E8E8", "#2A2729", "#917D60", "#4A4E39", "#060E36"],
    image: `${S3}9dfc7d4ea39f8472cc0a7a78fa5229d9/bucket-hat-mockup-featuring-a-customizable-background-3029-el1111222223333-wbp2-556x646.webp`,
    retail: true,
  },
  {
    uid: "hejg", id: 7496, name: "Емайлирано Канче",
    costEUR: 4.6, costMaxEUR: 4.6, cheapestFrom: "BestSub · Sublimation",
    manufacturers: ["BestSub"], collections: ["Sublimation"],
    sizes: ["Брой"],
    colors: ["#FFFFFF"],
    image: `${S3}91f7e32e661302987c766fc269da7c5b/kanche1-wbp2-556x646.webp`,
    retail: true,
  },
  {
    uid: "bejdh", id: 14937, name: "Керамична Чаша",
    costEUR: 2.45, costMaxEUR: 2.45, cheapestFrom: "BestSub · Sublimation",
    manufacturers: ["BestSub"], collections: ["Sublimation"],
    sizes: ["Брой"],
    colors: ["#FFFFFF"],
    image: `${S3}c4ca4238a0b923820dcc509a6f75849b/1-wbp2-556x646.webp`,
    retail: true,
  },
  {
    uid: "gehah", id: 64707, name: "Магическа Чаша",
    costEUR: 3.27, costMaxEUR: 3.27, cheapestFrom: "BestSub · Sublimation",
    manufacturers: ["BestSub"], collections: ["Sublimation"],
    sizes: ["Брой"],
    colors: ["#FFFFFF"],
    image: `${S3}c4ca4238a0b923820dcc509a6f75849b/1-wbp2-556x646.webp`,
    retail: true,
  },
  {
    uid: "dagdf", id: 30635, name: "Алуминиева бутилка - 500 ml",
    costEUR: 4.35, costMaxEUR: 4.35, cheapestFrom: "BestSub · Sublimation",
    manufacturers: ["BestSub"], collections: ["Sublimation"],
    sizes: ["Брой"],
    colors: ["#E8E8E8", "#A5A7A6"],
    image: `${S3}86ed5d87ce732a4618f03fe4fb221cd0/recycled-aluminium-bottle-500ml-wbp2-556x646.webp`,
    retail: true,
  },
  {
    uid: "bbagb", id: 11061, name: "Стикер - 5см. X 5см.",
    costEUR: 0.26, costMaxEUR: 0.26, cheapestFrom: "Shine · Premium",
    manufacturers: ["Shine (printondemand.bg)"], collections: ["Premium"],
    sizes: ["5см. x 5см. (Стикер)"],
    colors: ["#FFFFFF"],
    image: `${S3}050e7f3e0ff26b4e70e19b196a482476/IMG_20230204_154627-wbp2-556x646.webp`,
    retail: true,
  },
  {
    uid: "bbagi", id: 11068, name: "Стикер - 7см. X 7см.",
    costEUR: 0.41, costMaxEUR: 0.41, cheapestFrom: "Shine · Premium",
    manufacturers: ["Shine (printondemand.bg)"], collections: ["Premium"],
    sizes: ["7см. x 7см. (Стикер)"],
    colors: ["#FFFFFF"],
    image: `${S3}990870b4e1ccf2146ebdc0b6acb41c5e/IMG_20230204_155935-wbp2-556x646.webp`,
    retail: true,
  },
  {
    uid: "bbahe", id: 11074, name: "Стикер - 10см. X 10см.",
    costEUR: 0.77, costMaxEUR: 0.77, cheapestFrom: "Shine · Premium",
    manufacturers: ["Shine (printondemand.bg)"], collections: ["Premium"],
    sizes: ["10см. x 10см. (Стикер)"],
    colors: ["#FFFFFF"],
    image: `${S3}a480538f0ad26a7e5b8c2ccea12e6cb1/IMG_20230204_162736-wbp2-556x646.webp`,
    retail: true,
  },
  {
    uid: "bbfcc", id: 11522, name: "Картонена кутия",
    costEUR: 0.97, costMaxEUR: 0.97, cheapestFrom: "Shine · Premium",
    manufacturers: ["Shine (printondemand.bg)"], collections: ["Premium"],
    sizes: ["Брой"],
    colors: ["#1B1B1B", "#E8E8E8"],
    image: `${S3}94519f09d6fec2d222fff37827dfd8ea/1%20cherno-wbp2-556x646.webp`,
    retail: true,
  },
  // Print media, sold by the 60 cm × 100 m roll. Priced per square metre rather
  // than per item and useless to a customer, so they never reach the shop.
  {
    uid: "bfh", id: 157, name: "DTF печат",
    costEUR: 0, costMaxEUR: 0, cheapestFrom: "DTF печат от PrintOnDemand.bg",
    manufacturers: ["DTF печат от PrintOnDemand.bg"], collections: ["Premium"],
    sizes: ["Ролка 60см х 100 метра"], colors: ["#E8E8E8"],
    image: `${S3}5d5e3346a905a24e5d7b4480f3b5822d/dtf11222-wbp2-556x646.webp`,
    retail: false,
  },
  {
    uid: "eihb", id: 4871, name: "UV DTF СТИКЕРИ",
    costEUR: 0, costMaxEUR: 0, cheapestFrom: "UV DTF печат от PrintOnDemand.bg",
    manufacturers: ["UV DTF печат от PrintOnDemand.bg"], collections: ["Premium"],
    sizes: ["Ролка 60см х 100 метра"], colors: ["#E8E8E8"],
    image: `${S3}e1e1d0d69f0ca81aac4373ca0fc903f2/READY3-wbp2-556x646.webp`,
    retail: false,
  },
];

export function blankByUid(uid: string): SupplierBlank | undefined {
  return SUPPLIER_BLANKS.find((b) => b.uid === uid);
}

/** Everything a customer can actually be sold. */
export const RETAIL_BLANKS = SUPPLIER_BLANKS.filter((b) => b.retail);

/**
 * What one finished item costs us: the blank, plus a print charge per position.
 *
 * Deliberately not "cost × margin". Margin is a merchandising decision that
 * belongs beside the price it produces, and a blank that costs 0.26 wants a
 * very different multiplier from one that costs 18.96.
 */
export function landedCostEUR(
  blank: SupplierBlank,
  prints: readonly PrintSize[] = ["medium"]
): number {
  const print = prints.reduce((sum, p) => sum + PRINT_PRICE_EUR[p], 0);
  return Math.round((blank.costEUR + print) * 100) / 100;
}

/**
 * Where each blank can be printed, in the supplier's own numbers.
 *
 * `canvas` is the print window in their editor's pixels; `index` is the scale
 * factor they use to turn a typed size into those pixels. Their own code reads
 *
 *     px = mm × index / 10
 *
 * so millimetres come back as `px × 10 / index` — see `printAreaMm`.
 *
 * ── ONE THING TO CONFIRM WITH THEM ───────────────────────────────────────
 * That formula reproduces the stated size exactly on every item whose size is
 * in its name: the 10 cm sticker computes to 105 mm, the 5 cm one to 53 mm, and
 * the mug's front panel to 208 × 88 mm, which is a normal wrap. On garments it
 * returns areas that look too generous — 377 × 571 mm for a men's t-shirt
 * front. Their DTF stock is 60 cm wide so it is not impossible, but it is not
 * confirmed either, and a DPI warning built on a wrong number is worse than no
 * warning. Treat garment figures as provisional until their support answers.
 * ─────────────────────────────────────────────────────────────────────────
 */
export interface PrintPosition {
  /** Their name — "Отпред", "Отзад", "Отляво", "Отдясно". */
  name: string;
  /** The print window in their editor, in pixels. */
  canvasWidth: number;
  canvasHeight: number;
}

export interface PrintGeometry {
  /** Their pixels-per-centimetre scale, horizontal and vertical. */
  indexWidth: number;
  indexHeight: number;
  positions: readonly PrintPosition[];
}

const geo = (
  iw: number,
  ih: number,
  ...pos: [string, number, number][]
): PrintGeometry => ({
  indexWidth: iw,
  indexHeight: ih,
  positions: pos.map(([name, canvasWidth, canvasHeight]) => ({
    name,
    canvasWidth,
    canvasHeight,
  })),
});

const F = "Отпред";
const B = "Отзад";
const L = "Отляво";
const R = "Отдясно";

export const PRINT_GEOMETRY: Readonly<Record<string, PrintGeometry>> = {
  gddfd: geo(5.3, 4.9, [F, 220, 280], [L, 100, 330], [R, 100, 320], [B, 220, 280]),
  iidf: geo(5.3, 4.9, [F, 220, 280], [L, 100, 330], [R, 100, 320], [B, 220, 280]),
  c: geo(5.3, 4.9, [F, 200, 280], [L, 100, 330], [R, 100, 320], [B, 200, 280]),
  ce: geo(5.85, 5.85, [F, 200, 265], [B, 220, 350]),
  ca: geo(5.3, 4.6, [F, 200, 240], [L, 80, 290], [R, 80, 290], [B, 200, 240]),
  cj: geo(5.3, 3.6, [F, 200, 190], [B, 200, 230]),
  gcjg: geo(5.3, 4.6, [F, 200, 240], [L, 80, 290], [R, 80, 290], [B, 200, 240]),
  eaccd: geo(3.8, 4.6, [F, 200, 240], [L, 80, 290], [R, 80, 290], [B, 200, 240]),
  ddejj: geo(5.85, 5.85, [F, 220, 140], [B, 220, 220]),
  eaij: geo(5.0, 4.4, [F, 240, 400], [B, 290, 450]),
  gdah: geo(11.0, 8.0, [F, 380, 310], [B, 380, 310]),
  ge: geo(8.0, 8.0, [F, 180, 260], [B, 180, 260]),
  gdab: geo(11.0, 12.5, [F, 180, 260], [B, 180, 260]),
  de: geo(5.75, 5.4, [F, 220, 310], [B, 220, 310]),
  gh: geo(7.2, 8.4, [F, 250, 380], [B, 250, 380]),
  dcc: geo(4.55, 5.9, [F, 170, 340], [L, 120, 355], [R, 120, 355], [B, 170, 355]),
  ebih: geo(5.9, 5.9, [F, 220, 220], [B, 220, 220]),
  dchc: geo(21.0, 23.0, [F, 260, 160]),
  debd: geo(18.0, 15.0, [F, 220, 140]),
  djbh: geo(18.0, 15.0, [F, 220, 120], [B, 220, 120]),
  hejg: geo(29.0, 33.0, [F, 250, 125], [L, 240, 220], [R, 240, 220]),
  bejdh: geo(12.0, 16.0, [F, 250, 140], [L, 140, 180], [R, 140, 180]),
  gehah: geo(12.0, 16.0, [F, 250, 140], [L, 140, 180], [R, 140, 180]),
  dagdf: geo(14.0, 27.0, [F, 255, 285], [L, 120, 300], [R, 120, 300]),
  bbagb: geo(75.0, 75.0, [F, 400, 400]),
  bbagi: geo(55.0, 55.0, [F, 400, 400]),
  bbahe: geo(38.0, 38.0, [F, 400, 400]),
  bbfcc: geo(14.0, 13.0, [F, 370, 250]),
};

/** One print position's physical size in millimetres. */
export function printAreaMm(
  uid: string,
  position = F
): { widthMm: number; heightMm: number } | undefined {
  const g = PRINT_GEOMETRY[uid];
  const p = g?.positions.find((x) => x.name === position);
  if (!g || !p) return undefined;
  return {
    widthMm: Math.round((p.canvasWidth * 10) / g.indexWidth),
    heightMm: Math.round((p.canvasHeight * 10) / g.indexHeight),
  };
}
