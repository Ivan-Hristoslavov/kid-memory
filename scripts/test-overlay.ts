/**
 * Renders the poster overlay over a synthetic background — no API, no cost.
 *
 * Typography is iterated on far more often than illustrations are: line
 * breaking, bubble sizing and placement all need looking at repeatedly, and
 * paying for a generated image each time makes that loop expensive enough to
 * skip. The stand-in has a calm top band and quiet side margins, which is what
 * `compositionContract` asks the model for, plus a busy centre so the placement
 * search has something to avoid.
 *
 * Run: npx tsx --tsconfig scripts/tsconfig.json scripts/test-overlay.ts [outDir]
 */
import { promises as fs } from "fs";
import path from "path";
import sharp from "sharp";
import { composeFinalPoster } from "@/lib/poster/compose";
import type { PosterSubject, TemplateId } from "@/lib/templates";

const W = 1024;
const H = 1536;

/** Stand-in illustration: calm edges, busy middle. */
async function backdrop(): Promise<Buffer> {
  const blobs = Array.from({ length: 90 }, (_, i) => {
    const a = (i / 90) * Math.PI * 2;
    const cx = W / 2 + Math.cos(a * 3.1) * W * 0.16;
    const cy = H * 0.55 + Math.sin(a * 2.3) * H * 0.2;
    const r = 18 + (i % 7) * 9;
    const hue = 20 + ((i * 37) % 300);
    return `<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${r}" fill="hsl(${hue} 60% 55%)" opacity="0.75"/>`;
  }).join("");

  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#bcd9ef"/><stop offset="55%" stop-color="#e8dcc0"/>
      <stop offset="100%" stop-color="#c9d8a8"/>
    </linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
    ${blobs}
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

const CASES: { file: string; template: TemplateId; subjects: PosterSubject[] }[] = [
  {
    file: "kid-words",
    template: "KID_WORDS",
    subjects: [
      {
        name: "Боби",
        age: 3,
        gender: "MALE",
        lines: [
          { text: "апум", sub: "паун" },
          { text: "тактул", sub: "трактор" },
          { text: "бабабека", sub: "библиотека" },
        ],
      },
    ],
  },
  {
    file: "portrait-lines",
    template: "PORTRAIT_LINES",
    subjects: [
      {
        name: "Ели",
        relation: "колежка",
        gender: "FEMALE",
        lines: [
          { text: "Ще го пуснем в петък", sub: "някой петък" },
          { text: "Само едно кратко обаждане", sub: "четиридесет минути" },
        ],
      },
    ],
  },
  {
    file: "pet",
    template: "PET",
    subjects: [
      {
        name: "Шаро",
        species: "куче",
        lines: [
          { text: "Пази дивана", sub: "от дивана" },
          { text: "Чува плик от километър" },
          { text: "Спи по гръб" },
        ],
      },
    ],
  },
];

// Wrapped rather than top-level await: package.json has no "type": "module",
// so the runner transpiles these scripts to CommonJS.
async function main() {
  const outDir = process.argv[2] || ".storage/overlay-test";
  await fs.mkdir(outDir, { recursive: true });
  const art = await backdrop();

  for (const c of CASES) {
    const poster = await composeFinalPoster(art, { template: c.template, subjects: c.subjects });
    const file = path.join(outDir, `${c.file}.png`);
    await fs.writeFile(file, poster);
    console.log(`✓ ${file}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
