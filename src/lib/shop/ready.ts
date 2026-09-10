/**
 * Ready-made shirts: a design and a garment sold as one thing.
 *
 * The shop had it backwards. Everything routed through an editor — pick a
 * blank, then pick a design, then place it — and most people do not want to
 * design anything. They want to buy the shirt that says "Кумът" and get on with
 * their weekend. The competition sells exactly that: a product called "Тениска
 * с щампа - Кумът", with a price and an add-to-cart button, and no step in
 * between.
 *
 * So every design is now also a product. Same catalogue type, same cart, same
 * checkout — the difference is that it arrives already decided.
 *
 * ── NO IMAGE IS GENERATED FOR THESE ──────────────────────────────────────
 * A hundred and sixty designs across a garment would be a hundred and sixty
 * renders to make, store and regenerate whenever a mock-up changes. There is no
 * need: the preview already composites a colour, the artwork and the supplier's
 * greyscale render live, and a card can do the same. The picture on the card is
 * therefore always in step with the design, and adding a design costs nothing
 * but a line.
 * ─────────────────────────────────────────────────────────────────────────
 */
import { DESIGNS, EMBROIDERY_DESIGNS, designImage, isEmbroidery } from "./designs";
import { TEXT_DESIGNS } from "./text-designs";
import { PRODUCTS, type MentyProduct } from "./products";

/** The garment a ready-made design is sold on unless it says otherwise. */
const BASE_ID = "premium-tee-stanley-stella";

/**
 * The women's cut, for designs that are worn by women.
 *
 * A women's tee is not a men's tee in a smaller size — it has a waist and a
 * shaped bust — and the whole hen range was being shown on a straight unisex
 * body, which made it look borrowed from the men's rail. The distinction is by
 * design category rather than by product, because "Булката" is a women's shirt
 * whatever blank it is printed on.
 */
const BASE_ID_WOMEN = "womens-tee";

/** Categories sold on the women's cut. */
const WOMENS_CATEGORIES = new Set(["HEN"]);

/**
 * The blank an embroidered design is sold on, and what stitching adds.
 *
 * A polo, because that is what an embroidered mark belongs on — a chest badge
 * on a t-shirt reads as a mistake. And embroidery is not a print with a
 * different name: the supplier charges 0.0004 per stitch, so a compact chest
 * mark of roughly eight thousand stitches costs about 3.20 to sew on top of the
 * garment, against 3.08 for a DTF print of any size. The 5.50 digitising fee is
 * paid once per design, by us, because we own the design and sell it many
 * times — passing it on per order would price a single polo at over twenty.
 */
const BASE_ID_EMBROIDERY = "mens-polo";
const STITCH_COST_EUR = 3.2;
/** Retail multiple on the embroidered landed cost, matching the rest. */
const EMBROIDERY_MARKUP = 1.85;

/** Ready-made ids are `t-<designId>`, so the design is recoverable from the id. */
export const READY_PREFIX = "t-";

export function designIdOf(productId: string): string | null {
  return productId.startsWith(READY_PREFIX)
    ? productId.slice(READY_PREFIX.length)
    : null;
}

function base(womens = false, embroidered = false): MentyProduct {
  const id = embroidered
    ? BASE_ID_EMBROIDERY
    : womens
      ? BASE_ID_WOMEN
      : BASE_ID;
  const b = PRODUCTS.find((p) => p.id === id);
  if (!b) throw new Error(`ready.ts: base product ${id} is missing`);
  return b;
}

/**
 * Which blank a design is shown and sold on.
 *
 * Exported because everything that draws a shirt needs the same answer — the
 * picker, the category grid, the basket thumbnail — and each of them working it
 * out separately is how a design ends up on a men's body in one place and a
 * women's in another.
 */
export function baseUidForDesign(designId: string): string {
  if (isEmbroidery(designId)) return "dcc";
  const text = TEXT_DESIGNS.find((d) => d.id === designId);
  const graphic = DESIGNS.find((d) => d.id === designId);
  const category = text?.category ?? graphic?.category;
  return category && WOMENS_CATEGORIES.has(category) ? "ce" : "c";
}

/**
 * Colours offered on a ready-made shirt — three, not thirty-nine.
 *
 * The blank sells on choice; this sells on the design being right. Somebody
 * buying six shirts for a stag weekend wants them to match, and a wall of
 * swatches turns a decision into work. Light artwork gets dark garments and
 * vice versa, so no combination on offer is invisible.
 */
const DARK_COLOURS = ["Черен", "Тъмно синьо(AZ)", "Бургунди(41)"];
const LIGHT_COLOURS = ["Бял", "Сив меланж", "Бледо розово (52)"];

function colourAxis(b: MentyProduct, forDark: boolean) {
  const axis = b.variants.find((v) => v.swatch);
  if (!axis?.swatch) return b.variants;
  const wanted = forDark ? DARK_COLOURS : LIGHT_COLOURS;
  const options = wanted.filter((o) => axis.options.includes(o));
  const swatch = Object.fromEntries(
    options.map((o) => [o, axis.swatch![o]]).filter(([, hex]) => hex)
  );
  return b.variants.map((v) =>
    v === axis ? { ...v, options, swatch } : v
  );
}

function make(
  designId: string,
  title: string,
  blurb: string,
  forDark: boolean,
  tags: readonly string[],
  takesName: boolean,
  womens = false,
  embroidered = false
): MentyProduct {
  const b = base(womens, embroidered);
  const priceEUR = embroidered
    ? Math.round((b.priceEUR + STITCH_COST_EUR * EMBROIDERY_MARKUP) * 100) / 100 -
      0.01
    : b.priceEUR;
  return {
    ...b,
    id: `${READY_PREFIX}${designId}`,
    priceEUR,
    priceReferenceBGN: Math.round(priceEUR * 1.95583 - 0.9) + 0.9,
    title: embroidered
      ? `Бродирано поло — ${title}`
      : `${womens ? "Дамска тениска" : "Тениска"} — ${title}`,
    blurb,
    // Cleared: a ready-made shirt is not a bestseller row candidate, and
    // inheriting the base product's rank would put fifty of them in it.
    bestsellerRank: undefined,
    images: [],
    variants: colourAxis(b, forDark),
    // A design with a name slot keeps the one field that fills it. Everything
    // else is gone — that is the whole point of the product.
    personalization: takesName ? (["TEXT"] as const) : [],
    tags,
  };
}

/**
 * Every design, sold as a shirt. Built on first use, not at import.
 *
 * This module reads `PRODUCTS` and `products.ts` reads this one back, which is
 * a cycle. It is a safe one only because nothing here runs at module scope: by
 * the time anybody calls this, both modules have finished evaluating. Turning
 * the list into a top-level const would put `PRODUCTS` in the temporal dead
 * zone depending on which file the bundler reached first — a bug that appears
 * on one route and not another.
 */
let cache: readonly MentyProduct[] | null = null;

export function readyProducts(): readonly MentyProduct[] {
  cache ??= build();
  return cache;
}

function build(): readonly MentyProduct[] {
  return [
  ...TEXT_DESIGNS.map((d) =>
    make(
      d.id,
      d.title,
      `Готова тениска с щампа „${d.title}“. Избираш размер и цвят — нищо друго.`,
      d.forDark,
      [d.category.toLowerCase()],
      d.lines.some((l) => l.includes("{name}")),
      WOMENS_CATEGORIES.has(d.category)
    )
  ),
  ...EMBROIDERY_DESIGNS.map((d) =>
    make(
      d.id,
      d.title,
      `Бродирано поло с мотив „${d.title}“. Избродирано с конци, не отпечатано — усеща се с пръст.`,
      d.forDark,
      ["embroidery"],
      false,
      false,
      true
    )
  ),
  ...DESIGNS.filter((d) => !d.iconOnly).map((d) =>
    make(
      d.id,
      d.title,
      `Готова тениска с щампа „${d.title}“. Избираш размер и цвят — нищо друго.`,
      d.forDark,
      [d.category.toLowerCase()],
      false,
      WOMENS_CATEGORIES.has(d.category)
    )
  ),
  ];
}

export function readyById(id: string): MentyProduct | undefined {
  return readyProducts().find((p) => p.id === id);
}

/** The artwork file for a graphic design sold ready-made, if it has one. */
export function readyArtwork(designId: string): string | null {
  const known =
    DESIGNS.some((d) => d.id === designId && !d.iconOnly) ||
    EMBROIDERY_DESIGNS.some((d) => d.id === designId);
  return known ? designImage(designId) : null;
}
