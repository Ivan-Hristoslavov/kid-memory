import "server-only";
import sharp from "sharp";
import { NUNITO_B64 } from "./font-data";

/**
 * Server-side poster typography. Text is rendered by the app (not the AI) as
 * a playful comic-style SVG layer composited over the illustration with sharp.
 * The font is embedded (base64) so it renders identically in every environment.
 */

export interface PosterText {
  childName: string;
  words: { word: string; saidAs: string }[];
}

// Rotating bubble accent colours for the child's funny words.
const WORD_COLORS = ["#d9576f", "#3a7bd5", "#2f9e63", "#8a5cc4", "#e0873a", "#1f9ea3"];

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** 5-point star path centred at (cx,cy). */
function star(cx: number, cy: number, r: number, fill: string): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)}`);
  }
  return `<polygon points="${pts.join(" ")}" fill="${fill}" stroke="#fff" stroke-width="${(r * 0.18).toFixed(1)}" stroke-linejoin="round"/>`;
}

function heart(cx: number, cy: number, s: number, fill: string): string {
  return `<path transform="translate(${cx - s / 2},${cy - s / 2}) scale(${s / 24})" d="M12 21s-7.5-4.6-10-9.2C.3 8.4 2 5 5.2 5c2 0 3.3 1.2 3.8 2.2C9.5 6.2 10.8 5 12.8 5 16 5 17.7 8.4 16 11.8 13.5 16.4 12 21 12 21z" fill="${fill}" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/>`;
}

/** One comic speech bubble with a tail pointing toward the poster centre. */
function bubble(opts: {
  x: number;
  y: number;
  w: number;
  h: number;
  setup: string;
  word: string;
  color: string;
  left: boolean;
  setupFont: number;
  wordFont: number;
  rotate: number;
}): string {
  const { x, y, w, h, setup, word, color, left, setupFont, wordFont, rotate } = opts;
  const cx = x + w / 2;
  const tail = left
    ? `M ${x + w * 0.72} ${y + h - 2} q 4 ${h * 0.28} 30 ${h * 0.4} q -20 -${h * 0.14} -14 -${h * 0.4} Z`
    : `M ${x + w * 0.28} ${y + h - 2} q -4 ${h * 0.28} -30 ${h * 0.4} q 20 -${h * 0.14} 14 -${h * 0.4} Z`;
  return `<g transform="rotate(${rotate} ${cx} ${y + h / 2})" filter="url(#bshadow)">
    <path d="${tail}" fill="#ffffff" stroke="${color}" stroke-width="3"/>
    <rect x="${x}" y="${y}" rx="${h * 0.34}" width="${w}" height="${h}" fill="#ffffff" stroke="${color}" stroke-width="3.5"/>
    <text x="${cx}" y="${y + h * 0.4}" text-anchor="middle" dominant-baseline="middle"
      font-family="PosterFont" font-weight="700" font-size="${setupFont}" fill="#7a6d86">${escapeXml(setup)}</text>
    <text x="${cx}" y="${y + h * 0.72}" text-anchor="middle" dominant-baseline="middle"
      font-family="PosterFont" font-weight="800" font-size="${wordFont}" fill="${color}">„${escapeXml(word)}“</text>
  </g>`;
}

/** SVG overlay: decorated title + comic speech bubbles down the sides. */
export function buildOverlaySvg(width: number, height: number, text: PosterText): string {
  const titleSize = Math.round(width * 0.05);
  const nameSize = Math.round(width * 0.062);
  const setupFont = Math.round(width * 0.02);
  const wordFont = Math.round(width * 0.032);

  const title = "Най-сладките думички";
  const nameLine = `на ${text.childName}`;

  const bubbles = text.words
    .slice(0, 6)
    .map((w, i) => {
      const left = i % 2 === 0;
      const label = w.saidAs;
      const setup = `На ${w.word.toLowerCase()}`;
      const bw = Math.min(
        width * 0.44,
        Math.max(label.length + 2, setup.length) * wordFont * 0.52 + wordFont
      );
      const bh = setupFont * 1.2 + wordFont * 1.5 + 24;
      const x = left ? width * 0.05 : width - bw - width * 0.05;
      const y = height * 0.24 + i * (bh + height * 0.028);
      if (y + bh > height * 0.94) return "";
      return bubble({
        x,
        y,
        w: bw,
        h: bh,
        setup,
        word: label,
        color: WORD_COLORS[i % WORD_COLORS.length],
        left,
        setupFont,
        wordFont,
        rotate: left ? -2.5 : 2.5,
      });
    })
    .join("");

  const midX = width / 2;
  const titleY = Math.round(height * 0.07);
  const nameY = titleY + nameSize * 1.05;

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <style>@font-face { font-family: 'PosterFont'; src: url('data:font/ttf;base64,${NUNITO_B64}'); }</style>
      <linearGradient id="topfade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#fffdf8" stop-opacity="0.9"/>
        <stop offset="100%" stop-color="#fffdf8" stop-opacity="0"/>
      </linearGradient>
      <filter id="bshadow" x="-20%" y="-20%" width="140%" height="150%">
        <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#4a3b5c" flood-opacity="0.22"/>
      </filter>
    </defs>

    <rect width="${width}" height="${Math.round(height * 0.2)}" fill="url(#topfade)"/>

    ${star(midX - titleSize * 4.4, titleY - titleSize * 0.2, titleSize * 0.42, "#f4b942")}
    ${star(midX + titleSize * 4.4, titleY - titleSize * 0.2, titleSize * 0.42, "#f4b942")}
    <text x="${midX}" y="${titleY}" text-anchor="middle"
      font-family="PosterFont" font-weight="800" font-size="${titleSize}"
      fill="#4a3b5c" stroke="#ffffff" stroke-width="${titleSize * 0.14}" paint-order="stroke"
      stroke-linejoin="round">${escapeXml(title)}</text>
    <text x="${midX - nameSize * 0.4}" y="${nameY}" text-anchor="middle"
      font-family="PosterFont" font-weight="800" font-size="${nameSize}"
      fill="#d9576f" stroke="#ffffff" stroke-width="${nameSize * 0.13}" paint-order="stroke"
      stroke-linejoin="round">${escapeXml(nameLine)}</text>
    ${heart(midX + nameSize * (0.4 + nameLine.length * 0.22), nameY - nameSize * 0.35, nameSize * 0.6, "#e0607a")}

    ${bubbles}
  </svg>`;
}

/** Final print-quality poster: illustration + typography, PNG. */
export async function composeFinalPoster(illustration: Buffer, text: PosterText): Promise<Buffer> {
  const img = sharp(illustration);
  const meta = await img.metadata();
  const width = meta.width ?? 1024;
  const height = meta.height ?? 1536;
  const overlay = Buffer.from(buildOverlaySvg(width, height, text));

  return img
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
  const resized = await sharp(finalPoster)
    .resize({ width: PREVIEW_W })
    .blur(0.6)
    .toBuffer();
  const meta = await sharp(resized).metadata();
  const w = meta.width ?? PREVIEW_W;
  const h = meta.height ?? 840;

  // Dense two-tone diagonal watermark — dark + light so it survives on any
  // background, and covers enough of the art that it can't be cropped out.
  const marks: string[] = [];
  const stepY = Math.round(h / 9);
  const stepX = Math.round(w / 2.2);
  for (let row = 0, y = stepY * 0.4; y < h + stepY; y += stepY, row++) {
    for (let x = -stepX + (row % 2 ? stepX / 2 : 0); x < w + stepX; x += stepX) {
      marks.push(
        `<text x="${x}" y="${y}" font-family="Helvetica, Arial, sans-serif" font-weight="800"
           font-size="${Math.round(w * 0.062)}" letter-spacing="2"
           fill="#ffffff" fill-opacity="0.42" stroke="#2a2233" stroke-opacity="0.22" stroke-width="1"
           transform="rotate(-28 ${x} ${y})">БИСЕРИТЕ · ПРЕГЛЕД</text>`
      );
    }
  }

  // Extra centre band so the focal point of the poster is always covered.
  const bandY = Math.round(h * 0.52);
  marks.push(
    `<rect x="0" y="${bandY - Math.round(h * 0.045)}" width="${w}" height="${Math.round(h * 0.09)}" fill="#2a2233" fill-opacity="0.16"/>`,
    `<text x="${w / 2}" y="${bandY + Math.round(w * 0.028)}" text-anchor="middle"
       font-family="Helvetica, Arial, sans-serif" font-weight="800" font-size="${Math.round(w * 0.075)}"
       letter-spacing="3" fill="#ffffff" fill-opacity="0.85">ПРЕГЛЕД</text>`
  );

  const watermark = Buffer.from(
    `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">${marks.join("")}</svg>`
  );

  return sharp(resized)
    .composite([{ input: watermark, top: 0, left: 0 }])
    .jpeg({ quality: 55 })
    .toBuffer();
}
