/**
 * Builds the static Open Graph card at public/og.jpg.
 *
 * Deliberately a build-time script rather than a runtime `ImageResponse` route:
 * the card carries Cyrillic copy, and generating it once here avoids depending
 * on a font fetch succeeding in production. Re-run after changing the copy:
 *
 *   node scripts/build-og-image.mjs
 */
import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";

const WIDTH = 1200;
const HEIGHT = 630;
// The one sample whose baked Cyrillic came out clean — the OG card is the
// first thing anyone sees shared, so it must not carry a spelling slip.
const POSTER = "public/samples/storybook.webp";
const OUT = "public/og.jpg";

const POSTER_H = 470;
const POSTER_W = Math.round((POSTER_H * 768) / 1152);
const POSTER_X = WIDTH - POSTER_W - 80;
const POSTER_Y = Math.round((HEIGHT - POSTER_H) / 2);

const background = `
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#faf7f1"/>
      <stop offset="60%" stop-color="#f5f1e9"/>
      <stop offset="100%" stop-color="#efe9df"/>
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
  <circle cx="120" cy="90" r="140" fill="#ffffff" opacity="0.4"/>
  <circle cx="980" cy="600" r="180" fill="#ffffff" opacity="0.3"/>
</svg>`;

const text = `
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
  <style>
    .eyebrow { font: 700 24px "Helvetica Neue", Arial, sans-serif; fill: #9c5a35; letter-spacing: 4px; }
    .title   { font: 800 62px Georgia, "Times New Roman", serif; fill: #312c26; }
    .sub     { font: 400 28px "Helvetica Neue", Arial, sans-serif; fill: #6b635a; }
    .badge   { font: 700 24px "Helvetica Neue", Arial, sans-serif; fill: #ffffff; }
  </style>
  <text class="eyebrow" x="80" y="128">ПОВОД</text>
  <text class="title" x="80" y="228">Подарък, който</text>
  <text class="title" x="80" y="300">казва „това си ти“</text>
  <text class="sub" x="80" y="368">Снимката става илюстрован постер. За всеки повод.</text>
  <text class="sub" x="80" y="412">за дете · за колега · за двойка · за любимец</text>
  <rect x="80" y="466" width="392" height="62" rx="10" fill="#9c5a35"/>
  <text class="badge" x="112" y="506">Виждаш го, преди да платиш</text>
</svg>`;

const poster = await sharp(await readFile(POSTER))
  .resize(POSTER_W, POSTER_H, { fit: "cover" })
  .toBuffer();

// Rounded corners + a soft card edge for the poster thumbnail.
const posterMask = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${POSTER_W}" height="${POSTER_H}">
     <rect width="${POSTER_W}" height="${POSTER_H}" rx="24" fill="#fff"/>
   </svg>`
);

const roundedPoster = await sharp(poster)
  .composite([{ input: posterMask, blend: "dest-in" }])
  .png()
  .toBuffer();

const card = await sharp(Buffer.from(background))
  .composite([
    { input: roundedPoster, top: POSTER_Y, left: POSTER_X },
    { input: Buffer.from(text), top: 0, left: 0 },
  ])
  .jpeg({ quality: 88 })
  .toBuffer();

await writeFile(OUT, card);
console.log(`Wrote ${OUT} (${WIDTH}x${HEIGHT}, ${(card.length / 1024).toFixed(0)} KB)`);
