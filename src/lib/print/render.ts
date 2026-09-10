import "server-only";
import sharp from "sharp";
import { storage } from "@/lib/storage";
import { DEFAULT_PLACEMENT, type Placement } from "@/lib/shop/placement";
import { designImage, isEmbroidery } from "@/lib/shop/designs";
import { resolveLines, textDesignById } from "@/lib/shop/text-designs";
import type { PrintArea } from "@/lib/shop/products";
import { capHeight, outline } from "./type";
import { promises as fs } from "fs";
import path from "path";

/**
 * The print file.
 *
 * Everything upstream of this has been a picture of a decision: a preview on a
 * mock-up, a transform stored on a basket line. This turns it into the thing
 * that gets manufactured — a PNG at the print area's true millimetre size, at
 * 300 DPI, with nothing on it but the artwork.
 *
 * ── WHY IT RE-RENDERS RATHER THAN CROPS THE PREVIEW ──────────────────────
 * The browser only ever holds a downscaled copy: the upload route resizes to
 * 1600px so a phone can show it. Cropping that would build a 40cm print out of
 * a screen-sized image. The basket stores WHERE the photo was placed instead —
 * centre, scale, feather as fractions — and this reads the original back out of
 * storage and applies the same transform at print resolution.
 * ─────────────────────────────────────────────────────────────────────────
 */

/** Printers want 300; below 150 a photograph is visibly soft. */
export const PRINT_DPI = 300;

const MM_PER_INCH = 25.4;

export function pxFor(mm: number): number {
  return Math.round((mm / MM_PER_INCH) * PRINT_DPI);
}

export interface PrintJob {
  area: PrintArea;
  placement: Placement;
  /** Storage key of the customer's upload. */
  photoKey?: string;
  /** A ready-made design's id. */
  designId?: string;
  /** The customer's line, for a lettering design's `{name}` slot. */
  text?: string;
  /**
   * Garment colour, as hex.
   *
   * The file itself stays transparent — a printer lays ink on cloth, not a
   * rectangle of background — but the INK has to be chosen against the garment,
   * exactly as the preview did, or a lettering design comes out cream on a
   * white shirt.
   */
  colorHex?: string;
}

export interface PrintFile {
  png: Buffer;
  widthPx: number;
  heightPx: number;
  /** What the artwork's own resolution works out to at this size. */
  effectiveDpi: number | null;
  /** Stitched rather than printed — the supplier needs telling. */
  embroidery: boolean;
}

export async function renderPrintFile(job: PrintJob): Promise<PrintFile> {
  const placement = { ...DEFAULT_PLACEMENT, ...job.placement };
  const width = pxFor(job.area.widthMm);
  const height = pxFor(job.area.heightMm);

  const text = job.designId ? textDesignById(job.designId) : undefined;
  if (text) {
    return {
      png: await sharp(Buffer.from(letteringSvg(text, job, width, height)))
        .png()
        .toBuffer(),
      widthPx: width,
      heightPx: height,
      // Outlines have no resolution to be short of.
      effectiveDpi: null,
      embroidery: false,
    };
  }

  const source = job.designId
    ? await readPublic(designImage(job.designId))
    : job.photoKey
      ? await storage().get(job.photoKey)
      : null;
  if (!source) throw new Error("print: nothing to render — no photo and no design");

  const meta = await sharp(source).metadata();
  const art = job.designId
    ? // A design is drawn with its own margins: contain it, never crop it.
      await sharp(source)
        .resize(width, height, { fit: "contain", background: TRANSPARENT })
        .png()
        .toBuffer()
    : await placePhoto(source, placement, width, height);

  return {
    png: art,
    widthPx: width,
    heightPx: height,
    effectiveDpi: meta.width && meta.height
      ? dpiOf(meta.width, meta.height, job.area, placement.scale)
      : null,
    embroidery: job.designId ? isEmbroidery(job.designId) : false,
  };
}

const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

/**
 * The photograph, covering the print window and panned exactly as placed.
 *
 * `placement.x` and `.y` are the photo's CENTRE as a fraction of the window,
 * and at any zoom above 1 that centre legitimately leaves 0..1 — panning a 3x
 * crop into a corner puts it near -1.4 or 2.4. Extracting from the scaled image
 * rather than cropping first is what keeps those coordinates meaningful.
 */
async function placePhoto(
  source: Buffer,
  placement: Placement,
  width: number,
  height: number
): Promise<Buffer> {
  const scaled = await sharp(source)
    .resize(Math.round(width * placement.scale), Math.round(height * placement.scale), {
      fit: "cover",
      position: "centre",
    })
    .toBuffer();
  const meta = await sharp(scaled).metadata();
  const sw = meta.width ?? width;
  const sh = meta.height ?? height;

  // The window's top-left inside the scaled image, from the centre fraction.
  const left = Math.round(placement.x * sw - width / 2);
  const top = Math.round(placement.y * sh - height / 2);

  let out = sharp(scaled).extend({
    // Extending first means an extract can never fall outside the image, which
    // is exactly what a legal pan at high zoom would otherwise do.
    top: Math.max(0, -top),
    bottom: Math.max(0, top + height - sh),
    left: Math.max(0, -left),
    right: Math.max(0, left + width - sw),
    background: TRANSPARENT,
  });
  out = out.extract({
    left: Math.max(0, left),
    top: Math.max(0, top),
    width,
    height,
  });

  const png = await out.png().toBuffer();
  return placement.feather > 0 ? feather(png, width, height, placement.feather) : png;
}

/**
 * Fades the edges into nothing, as two crossed linear ramps.
 *
 * A radial mask would fade the corners of a landscape photograph long before
 * its sides, which loses the people at the ends of a group shot. Built as a
 * greyscale mask and multiplied into the alpha channel.
 */
async function feather(
  png: Buffer,
  width: number,
  height: number,
  amount: number
): Promise<Buffer> {
  const pct = Math.round(amount * 100);
  const stop = `<stop offset="0" stop-color="#000"/><stop offset="${pct}%" stop-color="#fff"/><stop offset="${100 - pct}%" stop-color="#fff"/><stop offset="100%" stop-color="#000"/>`;
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
       <defs>
         <linearGradient id="h" x1="0" x2="1" y1="0" y2="0">${stop}</linearGradient>
         <linearGradient id="v" x1="0" x2="0" y1="0" y2="1">${stop}</linearGradient>
       </defs>
       <rect width="100%" height="100%" fill="url(#h)"/>
       <rect width="100%" height="100%" fill="url(#v)" style="mix-blend-mode:multiply"/>
     </svg>`
  );
  const alpha = await sharp(mask).flatten({ background: "#000" }).greyscale().toBuffer();
  return sharp(png).joinChannel(alpha).png().toBuffer();
}

/** The lettering, as outlines. See `./type`. */
function letteringSvg(
  design: NonNullable<ReturnType<typeof textDesignById>>,
  job: PrintJob,
  width: number,
  height: number
): string {
  const lines = resolveLines(design, job.text ?? "");
  const ink = isLight(job.colorHex) ? "#2B2B2B" : "#FEFCF8";
  const accent = design.accent ?? ink;

  // The same proportions the preview uses, in print pixels rather than viewBox
  // units, so what was approved on screen is what is manufactured.
  const bands = lines.map((_, i) =>
    i === design.emphasis ? height * 0.22 : height * (design.subAccent ? 0.11 : 0.13)
  );
  const gap = height * 0.04;
  const block = bands.reduce((a, b) => a + b, 0) + gap * (lines.length - 1);
  let y = (height - block) / 2;

  const paths = lines.map((line, i) => {
    const strong = i === design.emphasis;
    const size = bands[i];
    const baseline = y + size * 0.5 + capHeight(size, design.font) / 2;
    y += size + gap;
    const fill = design.subAccent
      ? strong
        ? ink
        : accent
      : strong
        ? accent
        : ink;
    return outline(line, {
      cx: width / 2,
      y: baseline,
      size,
      face: design.font,
      fill,
      maxWidth: width * (strong ? 0.94 : 0.86),
    });
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${paths.join("")}</svg>`;
}

/** Rec. 709 luma — a saturated blue is not a light garment. */
function isLight(hex: string | undefined): boolean {
  if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return true;
  const n = parseInt(hex.slice(1), 16);
  return (
    0.2126 * ((n >> 16) & 255) +
      0.7152 * ((n >> 8) & 255) +
      0.0722 * (n & 255) >
    140
  );
}

/** Roughly what resolution the print will have, in DPI. */
function dpiOf(
  w: number,
  h: number,
  area: PrintArea,
  scale: number
): number {
  const areaRatio = area.widthMm / area.heightMm;
  const photoRatio = w / h;
  const across = photoRatio > areaRatio ? (h * areaRatio) / scale : w / scale;
  return Math.round(across / (area.widthMm / MM_PER_INCH));
}

/**
 * A file we ship, read from /public.
 *
 * Designs are ours and live in the repo, so there is no signed URL and no
 * network hop — the print renderer reads the same bytes the browser was shown.
 */
async function readPublic(url: string): Promise<Buffer> {
  return fs.readFile(path.join(process.cwd(), "public", url.replace(/^\//, "")));
}
