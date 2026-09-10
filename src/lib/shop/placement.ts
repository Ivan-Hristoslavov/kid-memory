/**
 * Where a customer's photograph sits inside a product's print area.
 *
 * Deliberately a transform rather than a cropped image. The browser only ever
 * holds a downscaled preview — the upload route resizes to 1600px — so cropping
 * client-side would build the print file out of a screen-sized copy. Recording
 * where the photo was placed lets the print file be re-rendered from the
 * original upload at full resolution, which is the only version good enough to
 * put on paper or ceramic.
 *
 * `x` and `y` are the photo's centre as a fraction of the print area, so
 * 0.5/0.5 is centred and the numbers survive any change to the mock-up's pixel
 * size. `scale` is relative to "just covers the area", so 1 is the tightest fit
 * that leaves no gap.
 *
 * Lives in lib rather than beside the editor because the store, the checkout
 * schema and eventually the print renderer all need it, and none of those
 * should import from a component.
 */
export interface Placement {
  x: number;
  y: number;
  scale: number;
  /**
   * How far the photo's edge is faded into the garment, 0..1 of the shorter
   * side.
   *
   * A rectangular photo printed on cloth has a hard border, and on a dark
   * garment that border reads as a sticker rather than a print. Feathering is
   * the standard remedy — the print simply stops carrying ink towards its edge
   * — and it costs nothing to produce, because it is applied when the print
   * file is rendered rather than by the printer.
   *
   * 0 keeps the hard edge, which is right for a photo that was composed to
   * have one.
   */
  feather: number;
  /** Which font the customer's line of text is set in. */
  font: TextFont;
}

/**
 * The three faces on offer, and no more.
 *
 * They are the site's own — already loaded, so choosing one costs no extra
 * download — and they are genuinely different from one another: a serif for
 * something formal, a rounded sans for something warm, a grotesque for
 * something plain. A longer list would be a worse decision, not a freer one.
 */
export const TEXT_FONTS = {
  SERIF: { label: "Класически", css: "var(--font-playfair), Georgia, serif" },
  ROUNDED: { label: "Топъл", css: "var(--font-logo-face), system-ui, sans-serif" },
  SANS: { label: "Изчистен", css: "var(--font-manrope), system-ui, sans-serif" },
} as const;

export type TextFont = keyof typeof TEXT_FONTS;

export const DEFAULT_PLACEMENT: Placement = {
  x: 0.5,
  y: 0.5,
  scale: 1,
  feather: 0,
  font: "SERIF",
};

/** Below this a print looks visibly soft. */
export const MIN_PRINT_DPI = 150;
