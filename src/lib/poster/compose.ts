import "server-only";
import sharp from "sharp";
import { BRAND } from "@/lib/brand";
import { TEMPLATE_PROMPTS, type BubbleKind } from "@/lib/ai/template-prompt";
import {
  DEFAULT_TEMPLATE,
  MAX_POSTER_LINES,
  type PosterSubject,
  type TemplateId,
} from "@/lib/templates";
import { capHeight, fitSize, lineHeight, measure, textPath } from "./text";

/**
 * Server-side poster typography: the app draws every letter, the image model
 * draws none.
 *
 * An image model renders words as pixels it believes look like letters, and for
 * Cyrillic it is wrong often enough to matter — ъ, щ and я come back malformed
 * on a poster somebody paid for and framed. Here the wording is composited from
 * the exact strings the customer typed, so it cannot be misspelled at all.
 *
 * Two things this file has to solve that the model got for free:
 *
 *  - WHERE the text goes. The compositor never sees the illustration's content,
 *    so placement comes from both ends: `buildPrompt` reserves calm margins,
 *    and `busynessMap` below measures the returned art and drops each bubble
 *    into the quietest space that is actually free.
 *  - HOW it looks. Straight rectangles and a system font read as a screenshot
 *    pasted onto a painting, so the containers are drawn with hand-wobbled
 *    outlines and the letters come from a hand-drawn typeface as vector paths.
 */

export interface PosterText {
  template: TemplateId;
  subjects: PosterSubject[];
  /** Defaults to the current year — the subtitle dates the keepsake. */
  year?: number;
}

/** Rotating accent colours for the bubbles. */
const ACCENTS = ["#d9576f", "#3a7bd5", "#2f9e63", "#8a5cc4", "#e0873a", "#1f9ea3"];

const INK = "#2f2637";
const PAPER = "#fffdf6";

/* ------------------------------------------------------------------ *
 * Deterministic wobble
 * ------------------------------------------------------------------ */

/**
 * The hand-drawn look needs jitter, but regenerating an order must reproduce
 * the same poster — a customer comparing their preview to the print should not
 * find the bubbles moved. The jitter is therefore seeded from the text itself.
 */
function seedFrom(text: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------------ *
 * Reading the illustration
 * ------------------------------------------------------------------ */

const GRID_W = 16;
const GRID_H = 24;
/** Samples per grid cell, per axis — enough to see detail, cheap to compute. */
const SUB = 4;

/**
 * How visually busy each cell of the illustration is, 0 (flat sky) to 1 (a
 * face, foliage, a patterned shirt).
 *
 * Local standard deviation rather than brightness: a bubble is unreadable over
 * detail, not over dark. A plain navy sky is a fine place for text; a bright
 * flowerbed is not.
 */
async function busynessMap(illustration: Buffer): Promise<number[]> {
  const { data } = await sharp(illustration)
    .greyscale()
    .resize(GRID_W * SUB, GRID_H * SUB, { fit: "fill" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const cells: number[] = [];
  const rowStride = GRID_W * SUB;

  for (let cy = 0; cy < GRID_H; cy++) {
    for (let cx = 0; cx < GRID_W; cx++) {
      let sum = 0;
      let sumSq = 0;
      for (let y = 0; y < SUB; y++) {
        for (let x = 0; x < SUB; x++) {
          const v = data[(cy * SUB + y) * rowStride + (cx * SUB + x)];
          sum += v;
          sumSq += v * v;
        }
      }
      const n = SUB * SUB;
      const variance = Math.max(0, sumSq / n - (sum / n) ** 2);
      // 64 is roughly the deviation of clearly detailed art; above that the
      // exact value stops mattering, it is simply "do not put text here".
      cells.push(Math.min(1, Math.sqrt(variance) / 64));
    }
  }
  return cells;
}

/** Mean busyness under a rectangle given in image pixels. */
function busynessAt(
  map: number[],
  imgW: number,
  imgH: number,
  x: number,
  y: number,
  w: number,
  h: number
): number {
  const c0 = Math.max(0, Math.floor((x / imgW) * GRID_W));
  const c1 = Math.min(GRID_W - 1, Math.ceil(((x + w) / imgW) * GRID_W) - 1);
  const r0 = Math.max(0, Math.floor((y / imgH) * GRID_H));
  const r1 = Math.min(GRID_H - 1, Math.ceil(((y + h) / imgH) * GRID_H) - 1);

  let total = 0;
  let n = 0;
  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      total += map[r * GRID_W + c];
      n++;
    }
  }
  return n ? total / n : 1;
}

/* ------------------------------------------------------------------ *
 * Shapes
 * ------------------------------------------------------------------ */

/**
 * A rounded rectangle whose sides bow slightly and unevenly, the way a drawn
 * outline does. A geometrically perfect rectangle is the single strongest tell
 * that the text was pasted on afterwards.
 */
function wobblyRect(
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  rand: () => number
): string {
  const bow = Math.min(w, h) * 0.045;
  const j = () => (rand() - 0.5) * 2 * bow;

  const x2 = x + w;
  const y2 = y + h;

  return [
    `M ${x + r} ${y}`,
    `Q ${x + w / 2 + j()} ${y + j()} ${x2 - r} ${y}`,
    `Q ${x2} ${y} ${x2} ${y + r}`,
    `Q ${x2 + j()} ${y + h / 2 + j()} ${x2} ${y2 - r}`,
    `Q ${x2} ${y2} ${x2 - r} ${y2}`,
    `Q ${x + w / 2 + j()} ${y2 + j()} ${x + r} ${y2}`,
    `Q ${x} ${y2} ${x} ${y2 - r}`,
    `Q ${x + j()} ${y + h / 2 + j()} ${x} ${y + r}`,
    `Q ${x} ${y} ${x + r} ${y}`,
    "Z",
  ]
    .map((s) => s.replace(/(-?\d+\.\d{2})\d+/g, "$1"))
    .join(" ");
}

/** Speech-bubble tail, pointing from the bubble toward the poster centre. */
function tail(
  x: number,
  y: number,
  w: number,
  h: number,
  pointsRight: boolean,
  rand: () => number
): string {
  const size = h * 0.34;
  const baseY = y + h * (0.58 + rand() * 0.1);
  const edge = pointsRight ? x + w : x;
  const dir = pointsRight ? 1 : -1;
  return [
    `M ${edge - dir * size * 0.2} ${baseY - size * 0.3}`,
    `L ${edge + dir * size * 0.95} ${baseY + size * 0.55}`,
    `L ${edge - dir * size * 0.15} ${baseY + size * 0.42}`,
    "Z",
  ].join(" ");
}

/**
 * A caption tag — a label on a string, for posters where nobody is speaking.
 * A dog with a speech bubble reads as a joke about a talking dog.
 *
 * The point faces the subject, the way a hand-drawn label leans toward the
 * thing it names; pointing it at the poster's edge makes it read as an arrow
 * off the page.
 */
function tagShape(
  x: number,
  y: number,
  w: number,
  h: number,
  pointsRight: boolean,
  rand: () => number
): string {
  const notch = h * 0.28;
  const j = () => (rand() - 0.5) * h * 0.05;

  // Described tip-on-the-left; `mx` mirrors every x about the tag's own centre
  // when the tip belongs on the right. Mirroring the coordinates rather than
  // wrapping in a transform keeps this a path-data helper.
  const mx = (v: number) => (pointsRight ? 2 * x + w - v : v);
  const f = (v: number) => v.toFixed(1);

  return [
    `M ${f(mx(x + notch))} ${f(y)}`,
    `L ${f(mx(x + w - notch * 0.4))} ${f(y + j())}`,
    `Q ${f(mx(x + w))} ${f(y + h / 2)} ${f(mx(x + w - notch * 0.4))} ${f(y + h)}`,
    `L ${f(mx(x + notch))} ${f(y + h + j())}`,
    `L ${f(mx(x))} ${f(y + h / 2)}`,
    "Z",
  ].join(" ");
}

/* ------------------------------------------------------------------ *
 * Lettering
 * ------------------------------------------------------------------ */

/**
 * One string as two stacked paths: a thick outline underneath, the letter on
 * top. Drawn as separate elements rather than with paint-order so it does not
 * depend on the renderer supporting an SVG 2 property — the same caution that
 * moved the type to outlines in the first place.
 */
function letters(
  text: string,
  x: number,
  baseline: number,
  size: number,
  fill: string,
  halo: string,
  haloWidth: number,
  anchor: "start" | "middle" | "end" = "middle"
): string {
  const d = textPath(text, x, baseline, size, anchor);
  if (!d) return "";
  const outline = haloWidth
    ? `<path d="${d}" fill="none" stroke="${halo}" stroke-width="${haloWidth.toFixed(1)}" stroke-linejoin="round" stroke-linecap="round"/>`
    : "";
  return `${outline}<path d="${d}" fill="${fill}"/>`;
}

/* ------------------------------------------------------------------ *
 * Layout
 * ------------------------------------------------------------------ */

interface Placed {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface BubbleContent {
  big: string;
  small: string;
  accent: string;
}

/**
 * Lines to draw, spread across subjects so one talkative child cannot use every
 * slot and leave their sibling with none — the same share-out the prompt does.
 */
function collectLines(copy: PosterText): BubbleContent[] {
  const t = TEMPLATE_PROMPTS[copy.template] ?? TEMPLATE_PROMPTS[DEFAULT_TEMPLATE];
  const [pre, post] = t.subAffix;
  const perSubject = Math.max(1, Math.floor(MAX_POSTER_LINES / Math.max(copy.subjects.length, 1)));

  return copy.subjects
    .flatMap((s) => s.lines.slice(0, perSubject))
    .slice(0, MAX_POSTER_LINES)
    .map((line, i) => ({
      big: line.text,
      small: line.sub ? `${pre}${line.sub}${post}` : "",
      accent: ACCENTS[i % ACCENTS.length],
    }));
}

/* ------------------------------------------------------------------ *
 * The overlay
 * ------------------------------------------------------------------ */

export function buildOverlaySvg(
  width: number,
  height: number,
  copy: PosterText,
  map: number[]
): string {
  const t = TEMPLATE_PROMPTS[copy.template] ?? TEMPLATE_PROMPTS[DEFAULT_TEMPLATE];
  const kind: BubbleKind = t.bubbleKind;
  const title = t.title(copy.subjects);
  const subtitle = t.subtitle(copy.subjects, copy.year ?? new Date().getFullYear());
  const rand = seedFrom(`${copy.template}|${title}|${copy.subjects.map((s) => s.name).join()}`);

  const parts: string[] = [];

  /* --- title banner ------------------------------------------------ */

  const margin = width * 0.07;
  const bannerW = width - margin * 2;
  const titleFit = fitSize(title, bannerW * 0.84, 2, width * 0.075, width * 0.03);
  const subSize = width * 0.028;

  const subFit = subtitle ? fitSize(subtitle, bannerW * 0.8, 1, subSize, width * 0.016) : null;

  // Laid out from explicit paddings rather than a fudge factor: the subtitle
  // used to be positioned relative to the last title baseline and sat on the
  // banner's bottom edge whenever the title wrapped to one line instead of two.
  const padTop = width * 0.03;
  const padBottom = width * 0.028;
  const titleLh = lineHeight(titleFit.size) * 0.82;
  const subLh = subFit ? lineHeight(subFit.size) * 0.95 : 0;

  const bannerH = padTop + titleFit.lines.length * titleLh + subLh + padBottom;
  const bannerY = height * 0.045;
  const bannerTilt = (rand() - 0.5) * 2.4;

  parts.push(
    `<g transform="rotate(${bannerTilt.toFixed(2)} ${width / 2} ${bannerY + bannerH / 2})">`,
    `<path d="${wobblyRect(margin, bannerY, bannerW, bannerH, bannerH * 0.28, rand)}" fill="${PAPER}" fill-opacity="0.93" stroke="${INK}" stroke-width="${(width * 0.005).toFixed(1)}" stroke-linejoin="round"/>`
  );

  let ty = bannerY + padTop + capHeight(titleFit.size);
  for (const line of titleFit.lines) {
    parts.push(letters(line, width / 2, ty, titleFit.size, INK, PAPER, width * 0.006));
    ty += titleLh;
  }
  if (subFit) {
    parts.push(
      letters(
        subFit.lines[0] ?? subtitle,
        width / 2,
        bannerY + padTop + titleFit.lines.length * titleLh + capHeight(subFit.size),
        subFit.size,
        "#6b5f78",
        PAPER,
        0
      )
    );
  }
  parts.push("</g>");

  /* --- bubbles ----------------------------------------------------- */

  const bubbles = collectLines(copy);
  const maxW = width * 0.4;
  const padX = width * 0.032;
  const padY = width * 0.028;
  const gap = width * 0.012;

  const placed: Placed[] = [];
  // Keep clear of the banner above and the print safe area below.
  const topLimit = bannerY + bannerH + height * 0.03;
  const bottomLimit = height * 0.93;

  bubbles.forEach((b, i) => {
    const innerW = maxW - padX * 2;
    const bigFit = fitSize(b.big, innerW, 2, width * 0.052, width * 0.026);
    const smallFit = b.small
      ? fitSize(b.small, innerW, 1, width * 0.026, width * 0.015)
      : null;

    const textW = Math.max(
      ...bigFit.lines.map((l) => measure(l, bigFit.size)),
      smallFit ? measure(smallFit.lines[0] ?? "", smallFit.size) : 0
    );
    const h =
      padY * 2 +
      bigFit.lines.length * lineHeight(bigFit.size) * 0.86 +
      (smallFit ? gap + lineHeight(smallFit.size) * 0.86 : 0);

    // A caption tag spends part of its width on the point, so it needs that
    // much more box before the text starts crowding the tip.
    const notch = kind === "caption" ? h * 0.28 : 0;
    const w = Math.min(maxW, textW + padX * 2 + notch);

    // Candidate positions: a left and a right column, stepped down the poster.
    // Everything else — which one is actually free — comes from the art.
    const STEPS = 14;
    let best: { x: number; y: number; score: number } | null = null;

    for (let side = 0; side < 2; side++) {
      const x = side === 0 ? margin * 0.6 : width - margin * 0.6 - w;
      for (let s = 0; s < STEPS; s++) {
        const y = topLimit + ((bottomLimit - topLimit - h) * s) / (STEPS - 1);
        if (y + h > bottomLimit) continue;

        const clash = placed.some(
          (p) => x < p.x + p.w + gap && x + w + gap > p.x && y < p.y + p.h + gap && y + h + gap > p.y
        );
        if (clash) continue;

        // A speech tail reaches past the box toward the centre, so it is
        // scored with the box. Judging the box alone put a tail across a
        // subject's eye while reporting the placement as clear.
        const pointsAtCentre = x + w / 2 < width / 2;
        const reach = kind === "speech" ? h * 0.4 : 0;
        let score = busynessAt(
          map,
          width,
          height,
          pointsAtCentre ? x : x - reach,
          y,
          w + reach,
          h
        );
        // Alternate sides when the art is indifferent — bubbles stacked down
        // one edge look like a list, not a poster.
        if (side !== i % 2) score += 0.06;
        // Two bubbles level with each other read as one wide block and their
        // tails meet in the middle, so a free band lower down is worth more
        // than a marginally calmer patch alongside something already placed.
        if (placed.some((p) => y < p.y + p.h && y + h > p.y)) score += 0.1;
        // Mild pull toward the vertical order they were entered in, so the
        // reading order roughly follows the order the customer typed.
        score += Math.abs(y - (topLimit + ((bottomLimit - topLimit) * i) / bubbles.length)) / height * 0.12;

        if (!best || score < best.score) best = { x, y, score };
      }
    }
    if (!best) return;

    placed.push({ x: best.x, y: best.y, w, h });

    const pointsRight = best.x + w / 2 < width / 2;
    const tilt = (rand() - 0.5) * 5;
    const strokeW = width * 0.0045;

    parts.push(
      `<g transform="rotate(${tilt.toFixed(2)} ${(best.x + w / 2).toFixed(1)} ${(best.y + h / 2).toFixed(1)})">`
    );

    if (kind === "speech") {
      parts.push(
        `<path d="${tail(best.x, best.y, w, h, pointsRight, rand)}" fill="${PAPER}" stroke="${b.accent}" stroke-width="${strokeW.toFixed(1)}" stroke-linejoin="round"/>`,
        `<path d="${wobblyRect(best.x, best.y, w, h, h * 0.3, rand)}" fill="${PAPER}" stroke="${b.accent}" stroke-width="${(strokeW * 1.25).toFixed(1)}" stroke-linejoin="round"/>`
      );
    } else if (kind === "caption") {
      parts.push(
        `<path d="${tagShape(best.x, best.y, w, h, pointsRight, rand)}" fill="${PAPER}" stroke="${b.accent}" stroke-width="${(strokeW * 1.25).toFixed(1)}" stroke-linejoin="round"/>`
      );
    } else {
      parts.push(
        `<path d="${wobblyRect(best.x, best.y, w, h, h * 0.16, rand)}" fill="${PAPER}" stroke="${b.accent}" stroke-width="${(strokeW * 1.25).toFixed(1)}" stroke-linejoin="round"/>`,
        `<path d="${wobblyRect(best.x + strokeW * 2.2, best.y + strokeW * 2.2, w - strokeW * 4.4, h - strokeW * 4.4, h * 0.13, rand)}" fill="none" stroke="${b.accent}" stroke-opacity="0.35" stroke-width="${(strokeW * 0.6).toFixed(1)}"/>`
      );
    }

    // Centred on the box minus the tag's point, so a caption's words sit in
    // the part of the shape that is actually rectangular.
    const textCx = best.x + w / 2 - (pointsRight ? notch : -notch) / 2;

    let by = best.y + padY + capHeight(bigFit.size);
    for (const line of bigFit.lines) {
      parts.push(letters(line, textCx, by, bigFit.size, b.accent, PAPER, 0));
      by += lineHeight(bigFit.size) * 0.86;
    }
    if (smallFit) {
      // `by` is where the next big line's baseline would sit. Backing out its
      // cap height gives the top of the free space, which is what the small
      // line is measured from — otherwise the gap grew with the big type size.
      parts.push(
        letters(
          smallFit.lines[0] ?? "",
          textCx,
          by - capHeight(bigFit.size) + gap + capHeight(smallFit.size),
          smallFit.size,
          "#6b5f78",
          PAPER,
          0
        )
      );
    }
    parts.push("</g>");
  });

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${parts.join("")}</svg>`;
}

/** Final print-quality poster: illustration + typography, PNG. */
export async function composeFinalPoster(
  illustration: Buffer,
  copy: PosterText
): Promise<Buffer> {
  const img = sharp(illustration);
  const meta = await img.metadata();
  const width = meta.width ?? 1024;
  const height = meta.height ?? 1536;

  const map = await busynessMap(illustration);
  const overlay = Buffer.from(buildOverlaySvg(width, height, copy, map));

  return sharp(illustration)
    .composite([{ input: overlay, top: 0, left: 0 }])
    .png({ quality: 95 })
    .toBuffer();
}

/**
 * Protected preview: low resolution, tiled watermark, soft blurred edges.
 * The only render a customer sees before the order is confirmed.
 */
export async function composeProtectedPreview(finalPoster: Buffer): Promise<Buffer> {
  // Deliberately small + soft: a stolen preview must be unusable for print.
  const PREVIEW_W = 560;
  const resized = await sharp(finalPoster).resize({ width: PREVIEW_W }).blur(0.6).toBuffer();
  const meta = await sharp(resized).metadata();
  const w = meta.width ?? PREVIEW_W;
  const h = meta.height ?? 840;

  const label = `${BRAND.name.toUpperCase()} · ПРЕГЛЕД`;
  const markSize = Math.round(w * 0.055);
  // One glyph outline, reused — the tile repeats ~30 times and inlining the
  // path each time would balloon the SVG for no gain.
  const markPath = textPath(label, 0, 0, markSize, "middle");

  const marks: string[] = [];
  const stepY = Math.round(h / 9);
  const stepX = Math.round(w / 2.2);
  for (let row = 0, y = stepY * 0.4; y < h + stepY; y += stepY, row++) {
    for (let x = -stepX + (row % 2 ? stepX / 2 : 0); x < w + stepX; x += stepX) {
      marks.push(
        `<use href="#wm" transform="translate(${x.toFixed(0)} ${y.toFixed(0)}) rotate(-28)"/>`
      );
    }
  }

  const bandY = Math.round(h * 0.52);
  const bandPath = textPath("ПРЕГЛЕД", w / 2, bandY + Math.round(w * 0.026), Math.round(w * 0.075), "middle");

  const watermark = Buffer.from(
    `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <defs><path id="wm" d="${markPath}" fill="#ffffff" fill-opacity="0.42" stroke="#2a2233" stroke-opacity="0.22" stroke-width="1"/></defs>
      ${marks.join("")}
      <rect x="0" y="${bandY - Math.round(h * 0.045)}" width="${w}" height="${Math.round(h * 0.09)}" fill="#2a2233" fill-opacity="0.16"/>
      <path d="${bandPath}" fill="#ffffff" fill-opacity="0.85"/>
    </svg>`
  );

  return sharp(resized)
    .composite([{ input: watermark, top: 0, left: 0 }])
    .jpeg({ quality: 55 })
    .toBuffer();
}
