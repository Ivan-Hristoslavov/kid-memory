import "server-only";
import { parse as parseFont, type Font } from "opentype.js";
import type { TextFont } from "@/lib/shop/placement";
import {
  MANROPE_B64,
  NUNITO_B64,
  OSWALD_B64,
  PATTAYA_B64,
  PLAYFAIR_B64,
  RUSSO_B64,
} from "./font-data";

/**
 * Lettering for print, as vector outlines rather than SVG <text>.
 *
 * The same lesson `lib/poster/text.ts` already learned the hard way: librsvg —
 * the engine behind sharp — ignores @font-face completely, so a print file that
 * merely NAMES a font falls back to whatever the host happens to have. Locally
 * that is Helvetica; on a serverless host it may be nothing at all, and the
 * Cyrillic would be the first thing to go.
 *
 * Converting each string to <path> removes fonts from the render path
 * entirely: the glyph shapes travel inside the SVG, so what the customer saw in
 * the browser is what the printer receives.
 */

const B64: Record<TextFont, string> = {
  DISPLAY: OSWALD_B64,
  HEAVY: RUSSO_B64,
  SCRIPT: PATTAYA_B64,
  SERIF: PLAYFAIR_B64,
  ROUNDED: NUNITO_B64,
  SANS: MANROPE_B64,
};

const cache = new Map<TextFont, Font>();

function font(face: TextFont): Font {
  const hit = cache.get(face);
  if (hit) return hit;
  const bytes = Buffer.from(B64[face], "base64");
  // opentype wants a standalone ArrayBuffer; a Buffer's underlying buffer is a
  // shared pool slice, so hand over a copy of exactly this font's bytes.
  const ab = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  );
  const parsed = parseFont(ab as ArrayBuffer);
  cache.set(face, parsed);
  return parsed;
}

/**
 * Glyph-by-glyph layout, deliberately not `getPath`/`getAdvanceWidth`.
 *
 * Those route through opentype's Bidi engine, which applies OpenType features
 * and throws outright on Oswald: "substitutionType : 62 lookupType: 6 —
 * substFormat: 2 is not yet supported". The `ccmp` table it cannot read exists
 * to compose diacritics, and Bulgarian needs none of it.
 *
 * Walking the string and advancing by each glyph's own width, with kerning
 * looked up in pairs, avoids the feature engine entirely and produces the same
 * result for this alphabet.
 */
function layout(
  text: string,
  size: number,
  face: TextFont
): { d: string; width: number } {
  const f = font(face);
  const scale = size / f.unitsPerEm;
  let x = 0;
  let d = "";
  let prev = null as ReturnType<Font["charToGlyph"]> | null;
  for (const ch of text) {
    const glyph = f.charToGlyph(ch);
    if (prev) x += f.getKerningValue(prev, glyph) * scale;
    d += glyph.getPath(x, 0, size).toPathData(2);
    x += (glyph.advanceWidth ?? 0) * scale;
    prev = glyph;
  }
  return { d, width: x };
}

/** Width of `text` in px when set at `size`, kerning included. */
export function measure(text: string, size: number, face: TextFont): number {
  return layout(text, size, face).width;
}

/**
 * One line as an SVG `<path>`, centred on `cx` with its baseline at `y`.
 *
 * `maxWidth` squeezes rather than overflows. A long Bulgarian word running past
 * the print area is the one failure that cannot be allowed on something being
 * manufactured — better a slightly condensed line than ink off the edge.
 */
export function outline(
  text: string,
  { cx, y, size, face, fill, maxWidth }: {
    cx: number;
    y: number;
    size: number;
    face: TextFont;
    fill: string;
    maxWidth: number;
  }
): string {
  const { d, width: natural } = layout(text, size, face);
  const scale = natural > maxWidth ? maxWidth / natural : 1;
  const width = natural * scale;
  const tx = cx - width / 2;
  return `<path d="${d}" fill="${fill}" transform="translate(${tx.toFixed(2)} ${y.toFixed(2)}) scale(${scale.toFixed(4)} 1)"/>`;
}

/** Distance from baseline to the top of a capital, for vertical centring. */
export function capHeight(size: number, face: TextFont): number {
  const f = font(face);
  const cap = f.tables?.os2?.sCapHeight ?? f.unitsPerEm * 0.7;
  return (cap / f.unitsPerEm) * size;
}
