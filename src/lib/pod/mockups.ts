/**
 * The supplier's own product mock-ups, and exactly where a print lands on them.
 *
 * This is what makes "see it on the t-shirt" possible. The catalogue photographs
 * in `catalog.ts` are marketing shots — a man posing, a bag on a peg — and a
 * print window drawn over one of those lands on a shoulder or a wall. These are
 * the flat renders their own editor uses, and the rectangles below are the same
 * rectangles their editor draws.
 *
 * ── HOW THEIR MOCK-UPS ARE BUILT, BECAUSE WE HAVE TO REPRODUCE IT ────────
 * Each PNG is greyscale-plus-alpha. Outside the garment it is opaque white, so
 * it masks whatever is behind it. Over the garment it is dark grey at about 12%
 * alpha — nothing but folds and shadow. Their editor puts a solid
 * `background-color` behind it, and that is how one PNG serves forty colours.
 *
 * So the stack, from back to front:
 *
 *   1. a solid fill of the chosen colour
 *   2. the customer's artwork, clipped to `print`
 *   3. this PNG
 *
 * Artwork under the shading rather than over it is not a detail: it is why the
 * result looks printed on cloth instead of pasted on top of a photograph, and
 * the opaque surround means artwork that overflows the garment is masked for
 * free.
 *
 * ── COORDINATES ──────────────────────────────────────────────────────────
 * Fractions of the mock-up image, top-left origin, so they survive any render
 * size. Derived from their own layout: the editor lays the image out 452px wide
 * inside `.scaled-content`, positions `.drawing-area` at a fixed top 60px /
 * left 122px, and offsets the print box from there by the per-position
 * `canvas_top` / `canvas_left`. Checked against the live DOM on the men's
 * t-shirt, where the computed rectangle agrees to three decimal places.
 *
 * Stickers are absent on purpose. Their mock-up for all three sizes is a
 * placeholder image called `websiteplanet-dummy-460X460.png`, which is a stand-in
 * on their side too — a sticker is its own artwork and needs no garment behind it.
 * ─────────────────────────────────────────────────────────────────────────
 */

export interface MockupPrintRect {
  /** Fractions of the mock-up image, 0..1, top-left origin. */
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Mockup {
  /** Their name for the view: "Отпред", "Отзад", "Отляво", "Отдясно". */
  name: string;
  /** Local path under /public/mockups/. */
  image: string;
  /** Width ÷ height, so a container can reserve the right box before it loads. */
  aspect: number;
  print: MockupPrintRect;
}

/** Keyed by the supplier's uid — the same key as `SUPPLIER_BLANKS`. */
export const MOCKUPS: Readonly<Record<string, readonly Mockup[]>> = {
  gddfd: [
    { name: "Отпред", image: "/mockups/oversizeHeviLice3.png", aspect: 1.1835, print: { x: 0.2699, y: 0.1833, width: 0.4867, height: 0.7331 } },
    { name: "Отляво", image: "/mockups/men_left_side1_img.png", aspect: 1, print: { x: 0.4137, y: 0.1549, width: 0.2212, height: 0.7301 } },
    { name: "Отдясно", image: "/mockups/men_right_side1_img.png", aspect: 1, print: { x: 0.3805, y: 0.1549, width: 0.2212, height: 0.708 } },
    { name: "Отзад", image: "/mockups/oversizeHeviGrub3.png", aspect: 1.1566, print: { x: 0.2699, y: 0.1663, width: 0.4867, height: 0.7165 } },
  ],
  iidf: [
    { name: "Отпред", image: "/mockups/oversize_front.png", aspect: 1.1036, print: { x: 0.2699, y: 0.2197, width: 0.4867, height: 0.6837 } },
    { name: "Отляво", image: "/mockups/men_left_side1_img.png", aspect: 1, print: { x: 0.4137, y: 0.1549, width: 0.2212, height: 0.7301 } },
    { name: "Отдясно", image: "/mockups/men_right_side1_img.png", aspect: 1, print: { x: 0.3805, y: 0.1549, width: 0.2212, height: 0.708 } },
    { name: "Отзад", image: "/mockups/oversize_black.png", aspect: 1.0553, print: { x: 0.2699, y: 0.2101, width: 0.4867, height: 0.6537 } },
  ],
  c: [
    { name: "Отпред", image: "/mockups/t-shirt-front.png", aspect: 1.1171, print: { x: 0.2699, y: 0.1977, width: 0.4425, height: 0.692 } },
    { name: "Отляво", image: "/mockups/men_left_side1_img.png", aspect: 1, print: { x: 0.4137, y: 0.1549, width: 0.2212, height: 0.7301 } },
    { name: "Отдясно", image: "/mockups/men_right_side1_img.png", aspect: 1, print: { x: 0.3805, y: 0.1549, width: 0.2212, height: 0.708 } },
    { name: "Отзад", image: "/mockups/t-shirt-back.png", aspect: 1.1171, print: { x: 0.2699, y: 0.1977, width: 0.4425, height: 0.692 } },
  ],
  ce: [
    { name: "Отпред", image: "/mockups/wm-t-front.png", aspect: 0.9745, print: { x: 0.3031, y: 0.3018, width: 0.4425, height: 0.5713 } },
    { name: "Отзад", image: "/mockups/wm-t-back.png", aspect: 0.9745, print: { x: 0.292, y: 0.1294, width: 0.4867, height: 0.7546 } },
  ],
  ca: [
    { name: "Отпред", image: "/mockups/sw-back.png", aspect: 0.9745, print: { x: 0.281, y: 0.3665, width: 0.4425, height: 0.5174 } },
    { name: "Отляво", image: "/mockups/sw_left.png", aspect: 1, print: { x: 0.4027, y: 0.2212, width: 0.177, height: 0.6416 } },
    { name: "Отдясно", image: "/mockups/sw_right.png", aspect: 1, print: { x: 0.4248, y: 0.2212, width: 0.177, height: 0.6416 } },
    { name: "Отзад", image: "/mockups/sw-back-2.png", aspect: 0.9745, print: { x: 0.281, y: 0.3665, width: 0.4425, height: 0.5174 } },
  ],
  cj: [
    { name: "Отпред", image: "/mockups/sweatshirt_new_front.png", aspect: 1.1253, print: { x: 0.2699, y: 0.249, width: 0.4425, height: 0.473 } },
    { name: "Отзад", image: "/mockups/sweatshirt_new_back.png", aspect: 1.1253, print: { x: 0.292, y: 0.1494, width: 0.4425, height: 0.5726 } },
  ],
  gcjg: [
    { name: "Отпред", image: "/mockups/sw_cp_front.png", aspect: 1.0609, print: { x: 0.281, y: 0.399, width: 0.4425, height: 0.5633 } },
    { name: "Отляво", image: "/mockups/sw_left.png", aspect: 1, print: { x: 0.4027, y: 0.2212, width: 0.177, height: 0.6416 } },
    { name: "Отдясно", image: "/mockups/sw_right.png", aspect: 1, print: { x: 0.4248, y: 0.2212, width: 0.177, height: 0.6416 } },
    { name: "Отзад", image: "/mockups/sw_cp_back.png", aspect: 1.0421, print: { x: 0.281, y: 0.392, width: 0.4425, height: 0.5533 } },
  ],
  eaccd: [
    { name: "Отпред", image: "/mockups/sw2_front.png", aspect: 1.0284, print: { x: 0.3142, y: 0.3641, width: 0.4425, height: 0.5461 } },
    { name: "Отляво", image: "/mockups/sw_left.png", aspect: 1, print: { x: 0.4027, y: 0.2212, width: 0.177, height: 0.6416 } },
    { name: "Отдясно", image: "/mockups/sw_right.png", aspect: 1, print: { x: 0.4248, y: 0.2212, width: 0.177, height: 0.6416 } },
    { name: "Отзад", image: "/mockups/sw2_back.png", aspect: 1.024, print: { x: 0.3031, y: 0.3172, width: 0.4425, height: 0.5437 } },
  ],
  ddejj: [
    { name: "Отпред", image: "/mockups/crop_top_front_3.png", aspect: 1.0602, print: { x: 0.2478, y: 0.4926, width: 0.4867, height: 0.3284 } },
    { name: "Отзад", image: "/mockups/crop_top_back_2.png", aspect: 0.914, print: { x: 0.2699, y: 0.2831, width: 0.4867, height: 0.4449 } },
  ],
  eaij: [
    { name: "Отпред", image: "/mockups/front.png", aspect: 0.9788, print: { x: 0.2699, y: 0.0433, width: 0.531, height: 0.8662 } },
    { name: "Отзад", image: "/mockups/GRYB 468.png", aspect: 0.8847, print: { x: 0.1814, y: 0.0391, width: 0.6416, height: 0.8808 } },
  ],
  gdah: [
    { name: "Отпред", image: "/mockups/pants_front.png", aspect: 0.9979, print: { x: 0.0929, y: 0.2649, width: 0.8407, height: 0.6844 } },
    { name: "Отзад", image: "/mockups/pants_back.png", aspect: 0.9751, print: { x: 0.0929, y: 0.2589, width: 0.8407, height: 0.6688 } },
  ],
  ge: [
    { name: "Отпред", image: "/mockups/kids-shirt-front.png", aspect: 1.1244, print: { x: 0.3252, y: 0.2065, width: 0.3982, height: 0.6468 } },
    { name: "Отзад", image: "/mockups/kids-shirt-back.png", aspect: 1.122, print: { x: 0.3252, y: 0.206, width: 0.3982, height: 0.6454 } },
  ],
  gdab: [
    { name: "Отпред", image: "/mockups/body_front.png", aspect: 1, print: { x: 0.3252, y: 0.1836, width: 0.3982, height: 0.5752 } },
    { name: "Отзад", image: "/mockups/body_back.png", aspect: 1, print: { x: 0.3252, y: 0.1836, width: 0.3982, height: 0.5752 } },
  ],
  de: [
    { name: "Отпред", image: "/mockups/pp-front.png", aspect: 0.9745, print: { x: 0.2699, y: 0.2371, width: 0.4867, height: 0.6683 } },
    { name: "Отзад", image: "/mockups/pp-back.png", aspect: 0.9745, print: { x: 0.2699, y: 0.2371, width: 0.4867, height: 0.6683 } },
  ],
  gh: [
    { name: "Отпред", image: "/mockups/womens-tank-top-front-s.png", aspect: 0.7603, print: { x: 0.2699, y: 0.3028, width: 0.5531, height: 0.6392 } },
    { name: "Отзад", image: "/mockups/womens-tank-top-back-s.png", aspect: 0.7667, print: { x: 0.2035, y: 0.2714, width: 0.5531, height: 0.6445 } },
  ],
  dcc: [
    { name: "Отпред", image: "/mockups/polo_front.png", aspect: 1.0481, print: { x: 0.3142, y: 0.1855, width: 0.3761, height: 0.7884 } },
    { name: "Отляво", image: "/mockups/polo_left.png", aspect: 1.0022, print: { x: 0.3805, y: 0.1552, width: 0.2655, height: 0.7871 } },
    { name: "Отдясно", image: "/mockups/polo_right.png", aspect: 0.9978, print: { x: 0.3805, y: 0.1545, width: 0.2655, height: 0.7837 } },
    { name: "Отзад", image: "/mockups/polo_back.png", aspect: 1.0292, print: { x: 0.3142, y: 0.148, width: 0.3761, height: 0.8083 } },
  ],
  ebih: [
    { name: "Отпред", image: "/mockups/mock up chanta468.png", aspect: 1, print: { x: 0.2699, y: 0.4425, width: 0.4867, height: 0.4867 } },
  ],
  dchc: [
    { name: "Отпред", image: "/mockups/hat_v_4.png", aspect: 1, print: { x: 0.2257, y: 0.1991, width: 0.5752, height: 0.354 } },
  ],
  debd: [
    { name: "Отпред", image: "/mockups/hat 1 (1).png", aspect: 1, print: { x: 0.2699, y: 0.2434, width: 0.4867, height: 0.3097 } },
  ],
  djbh: [
    { name: "Отпред", image: "/mockups/GEO_mockup_470.png", aspect: 1, print: { x: 0.2699, y: 0.3097, width: 0.4867, height: 0.2655 } },
  ],
  hejg: [
    { name: "Отпред", image: "/mockups/kanche_all.png", aspect: 1.8147, print: { x: 0.2699, y: 0.3212, width: 0.5531, height: 0.5018 } },
    { name: "Отляво", image: "/mockups/kanche_left.png", aspect: 1, print: { x: 0.3584, y: 0.3097, width: 0.531, height: 0.4867 } },
    { name: "Отдясно", image: "/mockups/kanche_right.png", aspect: 1, print: { x: 0.1593, y: 0.3097, width: 0.531, height: 0.4867 } },
  ],
  bejdh: [
    { name: "Отпред", image: "/mockups/chasha_center_1.png", aspect: 1.1031, print: { x: 0.2367, y: 0.3417, width: 0.5531, height: 0.3417 } },
    { name: "Отляво", image: "/mockups/chasha_left.png", aspect: 1.0723, print: { x: 0.3805, y: 0.3203, width: 0.3097, height: 0.427 } },
    { name: "Отдясно", image: "/mockups/chasha_right.png", aspect: 1.0723, print: { x: 0.3473, y: 0.3203, width: 0.3097, height: 0.427 } },
  ],
  dagdf: [
    { name: "Отпред", image: "/mockups/double aluminium_bottle_r.png", aspect: 1, print: { x: 0.2367, y: 0.3097, width: 0.5642, height: 0.6305 } },
    { name: "Отляво", image: "/mockups/single aluminium_bottle_r.png", aspect: 1, print: { x: 0.3805, y: 0.2987, width: 0.2655, height: 0.6637 } },
  ],
  bbfcc: [
    { name: "Отпред", image: "/mockups/box_gift_new.png", aspect: 0.9957, print: { x: 0.115, y: 0.2643, width: 0.8186, height: 0.5507 } },
  ],
};

/** Every view of one blank, front first. Empty when they supply no mock-up. */
export function mockupsFor(uid: string | null | undefined): readonly Mockup[] {
  return (uid && MOCKUPS[uid]) || [];
}

/** The front view — the one a product card and the editor open on. */
export function frontMockup(uid: string | null | undefined): Mockup | undefined {
  return mockupsFor(uid)[0];
}
