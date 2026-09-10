/**
 * Generates the ready-made design artwork with gpt-image-1.
 *
 * Run: node --env-file=.env node_modules/.bin/tsx --tsconfig scripts/tsconfig.json \
 *        scripts/gen-designs.ts [--dry] [--only <id>] [--quality high]
 *
 * The catalogue lives in src/lib/shop/designs.ts, not here, so the list the shop
 * sells and the list that gets drawn cannot drift apart. Idempotent: an existing
 * file is skipped, so deleting one design regenerates exactly that one.
 *
 * These come back with a TRANSPARENT background, which is the whole point —
 * the artwork is composited onto a garment of any colour, and a white square
 * behind a print is the thing that makes a shirt look like a sticker. WebP
 * keeps the alpha channel; `alphaQuality: 100` keeps the edges from fringing
 * against a dark garment.
 */
import { promises as fs } from "fs";
import path from "path";
import sharp from "sharp";
import {
  DESIGNS,
  DESIGN_ICONS,
  DESIGN_LOOK,
  EMBROIDERY_DESIGNS,
  type Design,
} from "../src/lib/shop/designs";

type Quality = "low" | "medium" | "high";
const PRICE: Record<Quality, number> = { low: 0.016, medium: 0.063, high: 0.25 };

async function generate(design: Design, quality: Quality): Promise<Buffer> {
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
      // The icons carry their own art direction — solid black, no colour — and
      // appending the general one would argue with it.
      // Icons and embroidery each carry their own art direction; appending the
      // general one would argue with it.
      prompt:
        design.iconOnly || design.category === "EMBROIDERY"
          ? design.prompt
          : `${design.prompt} ${DESIGN_LOOK}`,
      size: "1024x1024",
      quality,
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

async function exists(file: string): Promise<boolean> {
  try {
    await fs.stat(file);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const argv = process.argv.slice(2);
  const dry = argv.includes("--dry");
  const onlyAt = argv.indexOf("--only");
  const only = onlyAt >= 0 ? argv[onlyAt + 1] : null;
  const qAt = argv.indexOf("--quality");
  const quality = (qAt >= 0 ? argv[qAt + 1] : "medium") as Quality;

  const outDir = path.join(process.cwd(), "public", "designs");
  await fs.mkdir(outDir, { recursive: true });

  const all = [...DESIGNS, ...EMBROIDERY_DESIGNS, ...DESIGN_ICONS];
  const wanted = only ? all.filter((d) => d.id === only) : all;
  const todo: Design[] = [];
  for (const d of wanted) {
    if (await exists(path.join(outDir, `${d.id}.webp`))) {
      console.log(`=  ${d.id.padEnd(22)} exists, skipped`);
    } else {
      todo.push(d);
    }
  }

  console.log(
    `\n${todo.length} design(s) at ${quality} — about $${(todo.length * PRICE[quality]).toFixed(2)}\n`
  );
  if (dry) {
    for (const d of todo) console.log(`?  ${d.id.padEnd(22)} ${d.title}`);
    console.log("\nDry run. Re-run without --dry to generate.");
    return;
  }

  for (const d of todo) {
    process.stdout.write(`→  ${d.id.padEnd(22)} `);
    try {
      const png = await generate(d, quality);
      const file = path.join(outDir, `${d.id}.webp`);
      await sharp(png).webp({ quality: 88, alphaQuality: 100 }).toFile(file);
      const { size } = await fs.stat(file);
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
