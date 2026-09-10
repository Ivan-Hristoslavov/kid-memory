/**
 * Our own garment mock-ups, in the format the compositor needs.
 *
 * The supplier's renders are 458px photographs of a creased shirt, and they
 * looked it — upscaling them only made the creases sharper. They are also
 * pieces of a system: the compositor puts a solid colour behind a greyscale
 * PNG whose surround is opaque white, and that is what lets one file serve
 * forty colours.
 *
 * So a replacement has to arrive in that format, not just look better. This
 * makes one:
 *
 *   1. gpt-image-1 draws a clean garment on a TRANSPARENT background, which
 *      hands us the silhouette for free in the alpha channel — no keying, no
 *      threshold, no halo.
 *   2. Inside that silhouette the pixels become black, with alpha taken from
 *      how DARK the render is: a fold at 60% brightness becomes 40% black, a
 *      flat lit panel becomes almost nothing. That is the shading, and only
 *      the shading.
 *   3. Outside it they become opaque white, so the garment masks the colour
 *      behind it exactly at its own edge.
 *
 * Run: node --env-file=.env node_modules/.bin/tsx --tsconfig scripts/tsconfig.json \
 *        scripts/gen-mockups.ts [--dry] [--only <id>]
 */
import { promises as fs } from "fs";
import path from "path";
import { toMockup } from "./mockup-alpha";

interface Garment {
  id: string;
  /** File written to /public/mockups/<out>.png. */
  out: string;
  prompt: string;
}

const LOOK = `Studio product photograph, shot from directly above, perfectly flat and \
symmetrical, smooth and neatly pressed with no creases and no wrinkles, soft even light with \
gentle natural shading in the folds of the sleeves and hem only. Pure white garment. Fully \
transparent background — no backdrop, no shadow on the ground, no surface, no hanger, no \
mannequin, no person, no text, no logo, no label, no print of any kind on the garment.`;

const GARMENTS: Garment[] = [
  {
    id: "tee-front",
    out: "own-tee-front",
    prompt: `A premium heavyweight white cotton crew-neck t-shirt, seen from the front, sleeves \
straight out to the sides, ribbed collar clearly defined, side seams visible. ${LOOK}`,
  },
  {
    id: "tee-back",
    out: "own-tee-back",
    prompt: `A premium heavyweight white cotton crew-neck t-shirt seen from the BACK, sleeves \
straight out to the sides, back collar seam visible. ${LOOK}`,
  },
  {
    id: "hoodie-front",
    out: "own-hoodie-front",
    prompt: `A premium heavyweight white cotton hooded sweatshirt seen from the front, hood laid \
flat above the shoulders, kangaroo pocket and ribbed cuffs visible, drawstrings tucked. ${LOOK}`,
  },
  {
    id: "sweatshirt-front",
    out: "own-sweatshirt-front",
    prompt: `A premium heavyweight white cotton crew-neck sweatshirt without a hood, seen from \
the front, ribbed collar cuffs and hem clearly defined. ${LOOK}`,
  },
];

async function generate(g: Garment): Promise<Buffer> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt: g.prompt,
      size: "1024x1024",
      quality: "high",
      background: "transparent",
      output_format: "png",
      n: 1,
    }),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  const json = (await res.json()) as { data: { b64_json: string }[] };
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) throw new Error("empty response");
  return Buffer.from(b64, "base64");
}

async function main() {
  const argv = process.argv.slice(2);
  const dry = argv.includes("--dry");
  const onlyAt = argv.indexOf("--only");
  const only = onlyAt >= 0 ? argv[onlyAt + 1] : null;

  const dir = path.join(process.cwd(), "public", "mockups");
  await fs.mkdir(dir, { recursive: true });

  const todo = only ? GARMENTS.filter((g) => g.id === only) : GARMENTS;
  console.log(`\n${todo.length} garment(s) at high — about $${(todo.length * 0.25).toFixed(2)}\n`);
  if (dry) {
    for (const g of todo) console.log(`?  ${g.id.padEnd(18)} -> ${g.out}.png`);
    return;
  }

  for (const g of todo) {
    process.stdout.write(`→  ${g.id.padEnd(18)} `);
    try {
      const png = await generate(g);
      // The raw generation is kept beside the processed one: it is the only
      // copy of what the model drew, and reprocessing with a different SHADE
      // should not mean paying for the picture again.
      await fs.writeFile(path.join(dir, `${g.out}.raw.png`), png);
      await fs.writeFile(path.join(dir, `${g.out}.png`), await toMockup(png));
      const { size } = await fs.stat(path.join(dir, `${g.out}.png`));
      console.log(`ok  ${(size / 1024).toFixed(0)} KB`);
    } catch (err) {
      console.log(`FAILED  ${err instanceof Error ? err.message : err}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
