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
}

export const DEFAULT_PLACEMENT: Placement = { x: 0.5, y: 0.5, scale: 1 };

/** Below this a print looks visibly soft. */
export const MIN_PRINT_DPI = 150;
