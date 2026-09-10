import { TEXT_FONTS } from "@/lib/shop/placement";
import { resolveLines, type TextDesign } from "@/lib/shop/text-designs";

/**
 * A text design, drawn as SVG.
 *
 * Inline rather than an <img src="data:…">, and that is not a style choice: an
 * SVG loaded as an image is its own document and cannot reach the page's
 * webfonts, so every one of these would fall back to a system face and the
 * Bulgarian would be set in whatever the machine had lying around. Inline, it
 * uses the same Playfair, Nunito and Manrope as the rest of the site.
 *
 * The viewBox is 100 wide and sized to the number of lines, so the whole thing
 * scales to whatever print window it lands in without any measurement. Line
 * width is controlled by `textLength`, which squeezes a long Bulgarian word to
 * fit rather than letting it run out of the print area — the one thing that
 * cannot be allowed to happen on something being manufactured.
 */
export function TextDesignArt({
  design,
  name = "",
  color,
}: {
  design: TextDesign;
  /** The customer's text, substituted for `{name}`. */
  name?: string;
  /** Ink colour, decided by the garment. */
  color: string;
}) {
  const lines = resolveLines(design, name);
  if (lines.length === 0) return null;

  const font = TEXT_FONTS[design.font].css;
  const banner = design.layout === "BANNER";

  // Each line owns a band; the emphasised one owns a taller band and fills more
  // of the width. Everything is expressed in viewBox units so the SVG needs no
  // knowledge of its rendered size.
  const bands = lines.map((_, i) => (i === design.emphasis ? 22 : 13));
  const gap = 4;
  const height =
    bands.reduce((a, b) => a + b, 0) + gap * (lines.length - 1) + (banner ? 10 : 0);

  // Baselines computed up front rather than accumulated inside the map: a
  // running total mutated during render is exactly what the React Compiler
  // refuses to reason about, and it is unnecessary here.
  const tops: number[] = [];
  bands.reduce((top, band) => {
    tops.push(top);
    return top + band + gap;
  }, banner ? 5 : 0);

  return (
    <svg
      viewBox={`0 0 100 ${height}`}
      role="img"
      aria-label={design.title}
      className="size-full"
      preserveAspectRatio="xMidYMid meet"
    >
      {banner && (
        <>
          <rect x="4" y="0" width="92" height="1.2" fill={design.accent ?? color} />
          <rect
            x="4"
            y={height - 1.2}
            width="92"
            height="1.2"
            fill={design.accent ?? color}
          />
        </>
      )}
      {lines.map((line, i) => {
        const strong = i === design.emphasis;
        const band = bands[i];
        const cy = tops[i] + band * 0.78;
        // Long lines get the full width, short ones are not stretched to it —
        // a two-letter word forced across 92 units reads as a mistake.
        const width = Math.min(strong ? 92 : 72, line.length * (strong ? 11 : 7));
        return (
          <text
            key={i}
            x="50"
            y={cy}
            textAnchor="middle"
            fontFamily={font}
            fontSize={band}
            fontWeight={strong ? 800 : 600}
            letterSpacing={strong ? "0" : "0.6"}
            fill={strong ? (design.accent ?? color) : color}
            textLength={width}
            lengthAdjust="spacingAndGlyphs"
          >
            {line}
          </text>
        );
      })}
    </svg>
  );
}
