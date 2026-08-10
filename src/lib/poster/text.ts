import "server-only";
// Named import: opentype.js v2's ESM build has no default export, and Next
// resolves the .mjs even though the CommonJS build the CLI scripts load does
// provide one.
import { parse as parseFont, type Font } from "opentype.js";
import { NEUCHA_B64 } from "./font-data";

/**
 * Poster typography, rendered as vector outlines rather than SVG <text>.
 *
 * The overlay used to declare an @font-face with the font base64-inlined and
 * then set font-family on <text>. librsvg — the SVG engine behind sharp —
 * ignores @font-face entirely, so every poster silently fell back to whatever
 * sans-serif the host happened to have. Locally that was Helvetica; on a
 * serverless host it could be anything or nothing.
 *
 * Converting each string to <path> outlines here removes fonts from the render
 * path completely. The glyph shapes travel inside the SVG, so a poster looks
 * identical on a laptop and on Vercel, and the letters are exactly the ones in
 * the font file — which is the whole point of drawing the text ourselves
 * instead of asking an image model to spell Bulgarian.
 */

let cached: Font | null = null;

function font(): Font {
  if (!cached) {
    const bytes = Buffer.from(NEUCHA_B64, "base64");
    // opentype wants a standalone ArrayBuffer; a Buffer's underlying buffer is
    // a shared pool slice, so hand over a copy of exactly this font's bytes.
    const ab = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    cached = parseFont(ab as ArrayBuffer);
  }
  return cached;
}

/** Horizontal placement of a string relative to the x it is drawn at. */
export type Anchor = "start" | "middle" | "end";

/** Width of `text` in px when set at `size`, kerning included. */
export function measure(text: string, size: number): number {
  return font().getAdvanceWidth(text, size, { kerning: true });
}

/** Distance from baseline to the top of a capital letter, in px. */
export function capHeight(size: number): number {
  const f = font();
  // Neucha has no OS/2 capHeight, so derive it from the ascender — close
  // enough for centring, and stable across sizes.
  return (f.ascender / f.unitsPerEm) * size * 0.72;
}

/** Full line height (ascender to descender) at `size`, in px. */
export function lineHeight(size: number): number {
  const f = font();
  return ((f.ascender - f.descender) / f.unitsPerEm) * size;
}

/**
 * SVG path data for `text` with its baseline at (x, y).
 *
 * Returned as path data rather than a full element so callers can decide on
 * fill, stroke and paint-order — the outline behind poster lettering is what
 * keeps it legible over a busy illustration.
 */
export function textPath(
  text: string,
  x: number,
  y: number,
  size: number,
  anchor: Anchor = "start"
): string {
  const w = measure(text, size);
  const startX = anchor === "middle" ? x - w / 2 : anchor === "end" ? x - w : x;
  const path = font().getPath(text, startX, y, size, { kerning: true });
  return serialize(path.commands as PathCommand[]);
}

type PathCommand = {
  type: "M" | "L" | "C" | "Q" | "Z";
  x?: number;
  y?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
};

/**
 * Path data written here rather than with opentype's `toPathData`.
 *
 * That helper rounds with `Math.round(value + "e+2")` — string concatenation.
 * Any coordinate small enough that JavaScript prints it in exponential form
 * (below 1e-6, which curve control points reach through ordinary floating point
 * cancellation) becomes the literal "1e-7e+2", and the number comes out NaN.
 * librsvg then stops parsing at the bad token and silently drops the rest of
 * the path: a poster shipped with a word ending in a solid blob, which is the
 * exact failure moving the lettering into the app was meant to rule out.
 */
function serialize(commands: PathCommand[]): string {
  const n = (v: number | undefined): string => {
    if (typeof v !== "number" || !Number.isFinite(v)) {
      throw new Error(`Non-finite coordinate in glyph outline: ${v}`);
    }
    // Two decimals is well under a printed dot at 300 dpi, and keeps the
    // serialized poster small enough not to matter.
    return String(Math.round(v * 100) / 100);
  };

  const out: string[] = [];
  for (const c of commands) {
    switch (c.type) {
      case "M":
        out.push(`M${n(c.x)} ${n(c.y)}`);
        break;
      case "L":
        out.push(`L${n(c.x)} ${n(c.y)}`);
        break;
      case "Q":
        out.push(`Q${n(c.x1)} ${n(c.y1)} ${n(c.x)} ${n(c.y)}`);
        break;
      case "C":
        out.push(`C${n(c.x1)} ${n(c.y1)} ${n(c.x2)} ${n(c.y2)} ${n(c.x)} ${n(c.y)}`);
        break;
      case "Z":
        out.push("Z");
        break;
    }
  }
  return out.join("");
}

/**
 * Break `text` into lines that each fit within `maxWidth`.
 *
 * Measured with real advance widths instead of a characters-times-a-constant
 * estimate. The estimate was tuned on Latin text and under-counts wide Cyrillic
 * letters like ш, щ and ю, so long Bulgarian words ran outside their bubble.
 *
 * A single word longer than the line is left overflowing rather than
 * hyphenated: callers shrink the size until it fits, because a poster that
 * splits „изненада" across two lines reads as a printing defect.
 */
export function wrap(text: string, size: number, maxWidth: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];

  const lines: string[] = [];
  let line = words[0];

  for (const word of words.slice(1)) {
    const candidate = `${line} ${word}`;
    if (measure(candidate, size) <= maxWidth) line = candidate;
    else {
      lines.push(line);
      line = word;
    }
  }
  lines.push(line);
  return lines;
}

/**
 * Largest size at or below `startSize` at which `text` fits `maxWidth` in at
 * most `maxLines` lines.
 *
 * Poster text is user-supplied and unbounded — „Само едно кратко обаждане" and
 * „апум" land in identically sized bubbles. Fitting the type to the box keeps
 * both legible without the caller guessing.
 */
export function fitSize(
  text: string,
  maxWidth: number,
  maxLines: number,
  startSize: number,
  minSize = 8
): { size: number; lines: string[] } {
  let size = startSize;
  while (size > minSize) {
    const lines = wrap(text, size, maxWidth);
    const longest = Math.max(...lines.map((l) => measure(l, size)));
    if (lines.length <= maxLines && longest <= maxWidth) return { size, lines };
    size -= Math.max(1, Math.round(size * 0.06));
  }
  return { size: minSize, lines: wrap(text, minSize, maxWidth) };
}
