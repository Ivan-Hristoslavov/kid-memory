/**
 * Turning a generated garment photograph into a compositable mock-up.
 *
 * The compositor puts a solid colour behind a greyscale PNG whose surround is
 * opaque white, and that is what lets one file serve forty colours. A picture
 * has to arrive in that format, not merely look better than the supplier's.
 *
 * Shared by `gen-mockups.ts`, which pays for the pictures, and
 * `reprocess-mockups.ts`, which does not — tuning the shading should never mean
 * generating again.
 */
import sharp from "sharp";

/**
 * How far the shading is pushed.
 *
 * The render is a WHITE garment, so the only information in it is how much
 * DARKER than white each pixel is — and on a well-lit white shirt that range is
 * tiny: a flat panel measures about 13 below white, a collar shadow about 23.
 * Used literally those become alpha 6 and 10, which is invisible, and the shirt
 * composites as a flat cut-out.
 *
 * 2.2 stretches that range to where the supplier's own files sit: their flat
 * panels are 31/255 and a panel here lands at 29. Higher starts turning a black
 * shirt grey.
 */
const SHADE = 2.2;

/** Above this alpha in the source, a pixel is garment. */
const EDGE = 128;

/**
 * Rings of garment eaten from the edge.
 *
 * The generated edge is anti-aliased: a band of semi-transparent pixels whose
 * RGB is a blend of shirt and backdrop. Treated as garment they become a dark
 * fringe; treated as backdrop they leave a pale one. Two rings removes the band
 * and costs nothing visible at this size.
 */
const ERODE = 2;

function erode(mask: Uint8Array, width: number, height: number): void {
  for (let pass = 0; pass < ERODE; pass++) {
    const next = new Uint8Array(mask);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const i = y * width + x;
        if (!mask[i]) continue;
        if (!mask[i - 1] || !mask[i + 1] || !mask[i - width] || !mask[i + width]) {
          next[i] = 0;
        }
      }
    }
    mask.set(next);
  }
}

export async function toMockup(png: Buffer): Promise<Buffer> {
  const img = sharp(png).ensureAlpha();
  const { width, height } = await img.metadata();
  if (!width || !height) throw new Error("no dimensions");
  const raw = await img.raw().toBuffer();

  // The model was asked for a transparent background and delivered one, so the
  // silhouette is already in the alpha channel. Keying it out of the colour
  // would be guesswork by comparison — and was: an earlier version flood-filled
  // on luminance and cut the shirt in half, because the RGB under a
  // fully-transparent pixel is still whatever grey the renderer left there.
  const mask = new Uint8Array(width * height);
  for (let i = 0; i < mask.length; i++) mask[i] = raw[i * 4 + 3] >= EDGE ? 1 : 0;
  erode(mask, width, height);

  const out = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    if (!mask[i]) {
      // Outside the garment: opaque white, so it masks the colour behind it.
      out[i * 4] = 255;
      out[i * 4 + 1] = 255;
      out[i * 4 + 2] = 255;
      out[i * 4 + 3] = 255;
      continue;
    }
    // Inside: black, as opaque as the render is dark. Rec. 709, because a
    // fold's darkness is a brightness judgement and the eye weights green.
    const lum =
      0.2126 * raw[i * 4] + 0.7152 * raw[i * 4 + 1] + 0.0722 * raw[i * 4 + 2];
    out[i * 4] = 0;
    out[i * 4 + 1] = 0;
    out[i * 4 + 2] = 0;
    out[i * 4 + 3] = Math.round(Math.min(255, (255 - lum) * SHADE));
  }

  return sharp(out, { raw: { width, height, channels: 4 } })
    .png({ compressionLevel: 9, effort: 9 })
    .toBuffer();
}
