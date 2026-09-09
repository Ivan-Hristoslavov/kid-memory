/**
 * Generates the MENTY brand and storefront imagery with gpt-image-1.
 *
 * The site needs three kinds of picture that no supplier provides: branded
 * packaging mock-ups (the box, the hang tag, the tissue, the embroidery), the
 * two large lifestyle scenes the reference puts in the hero and the
 * personalisation banner, and product shots for the bestsellers row.
 *
 * Run: node --env-file=.env node_modules/.bin/tsx --tsconfig scripts/tsconfig.json \
 *        scripts/gen-brand-assets.ts [--dry] [--only <id>] [--quality high]
 *
 * Idempotent: an asset whose file already exists is skipped, so a re-run only
 * fills gaps. Delete one file to regenerate just that one. `--dry` prints the
 * plan and the estimated spend without calling the API.
 *
 * ── ON THE PRODUCT SHOTS ──────────────────────────────────────────────────
 * The V2 brief forbids AI stand-ins in purchasable product cards and requires
 * the real PrintFactory forms. These were generated at the owner's explicit
 * instruction, and the prompts describe the actual catalogue items (a 330ml
 * ceramic mug, a Stanley/Stella tee, a B&C organic hoodie, a leather photo
 * keychain) so they are honest about the shape of what ships. They are still a
 * stand-in: swap them for the supplier's own photography before launch, or the
 * picture on the card and the parcel at the door can disagree.
 * ──────────────────────────────────────────────────────────────────────────
 */
import { promises as fs } from "fs";
import path from "path";
import sharp from "sharp";

type Size = "1024x1024" | "1024x1536" | "1536x1024";
type Quality = "low" | "medium" | "high";

interface Asset {
  id: string;
  /** Path under /public, without extension. */
  out: string;
  size: Size;
  prompt: string;
}

/**
 * The logo, described once and spliced into every prompt that shows it, so the
 * mark cannot drift between the box, the tag and the tissue.
 */
const LOGO = `the MENTY logo, which has exactly TWO parts and nothing else: \
(1) the single word "Menty" in a rounded geometric sans-serif, heavy weight, deep forest \
green, spelled M-e-n-t-y exactly; (2) IMMEDIATELY to the right of the final letter y and \
raised to its cap height, a small solid blush-pink HEART symbol, clearly visible and \
unmistakably heart-shaped — this heart is the brand's mark and must never be omitted. \
Render NO tagline, NO strapline, NO second line of small letters, and no other words, \
letters or numbers anywhere in the picture. Small letter-spaced type is the one thing \
this image must not contain`;

/** Shared art direction — the brand sheet's own look. */
const LOOK = `Soft warm natural daylight, shallow depth of field, clean uncluttered \
composition, generous negative space. Palette strictly ivory #FEFCF8, sand #F6EFE9, \
blush #D4A59A, clay #C77D6B and deep forest green #1F2F28 — no other colours, nothing \
saturated, no neon, no heavy colour grading. Premium editorial product photography for \
a boutique gifting brand. No people's faces, no watermark, no border.`;

const ASSETS: Asset[] = [
  // ── Branded packaging: the brand sheet's bottom row ──────────────────────
  {
    id: "box",
    out: "brand/box",
    size: "1536x1024",
    prompt: `A premium kraft-brown gift box standing closed on a linen surface, printed with ${LOGO}. \
Beside it a small cream card leaning against the box, blank. A sprig of dried eucalyptus and a \
blush ribbon rest nearby. ${LOOK}`,
  },
  {
    id: "tag",
    out: "brand/tag",
    size: "1024x1024",
    prompt: `Close-up of a thick cream cardboard hang tag tied with natural twine to a wrapped gift, \
the tag printed with ${LOGO}. The gift behind it is kraft paper with a deep forest green satin \
ribbon, softly out of focus. ${LOOK}`,
  },
  {
    id: "tissue",
    out: "brand/tissue",
    size: "1536x1024",
    prompt: `Soft crumpled blush-pink tissue paper filling the frame, printed as an evenly repeating \
pattern of ${LOGO} in clay, the wordmark and its small heart repeating across the sheet at a gentle \
angle. Shallow focus, delicate paper texture. ${LOOK}`,
  },
  {
    id: "embroidery",
    out: "brand/embroidery",
    size: "1024x1024",
    prompt: `Extreme close-up of deep forest green organic cotton sweatshirt fabric, with ${LOGO} \
embroidered on the chest in cream thread, the small heart embroidered in blush, wordmark only. Visible stitch \
texture and soft fabric weave. ${LOOK}`,
  },

  // ── The two large lifestyle scenes ───────────────────────────────────────
  {
    id: "hero",
    out: "brand/hero",
    size: "1536x1024",
    prompt: `A warm gifting scene on a pale oak table: a white ceramic mug with a soft photographic \
print on it, two kraft gift boxes with blush and forest green ribbons, dried flowers in a small \
ceramic vase, and a folded handwritten note. One box carries ${LOGO}. Generous calm negative space \
in the left third of the frame for a headline to sit. ${LOOK}`,
  },
  {
    id: "personalize",
    out: "brand/personalize",
    size: "1536x1024",
    prompt: `A flat-lay from directly above: a pale oak desk with a white ceramic mug, a light wooden \
photo frame, a pair of hands placing a small printed photograph beside them, a pencil and a blank \
cream card. A kraft box in the corner carries ${LOGO}. Calm, tidy, room to breathe. ${LOOK}`,
  },

  // ── Bestsellers row. See the note at the top of this file. ───────────────
  {
    id: "product-mug",
    out: "products/photo-mug-330",
    size: "1024x1024",
    prompt: `Product photograph of a plain white glossy ceramic mug, 330ml, standard straight-sided \
shape with a simple rounded handle, standing centred on a seamless ivory background. A soft \
photographic image is printed on its side. Even studio light, gentle contact shadow. ${LOOK}`,
  },
  {
    id: "product-tee",
    out: "products/premium-tee-stanley-stella",
    size: "1024x1024",
    prompt: `Product photograph of a plain white unisex organic cotton t-shirt, relaxed straight cut \
with ribbed crew neck, laid flat and neatly arranged on a seamless ivory background, seen from \
directly above. A small soft print on the chest. Even studio light. ${LOOK}`,
  },
  {
    id: "product-hoodie",
    out: "products/organic-hoodie",
    size: "1024x1024",
    prompt: `Product photograph of a deep forest green unisex organic cotton hooded sweatshirt with a \
kangaroo pocket and drawstring hood, laid flat and neatly arranged on a seamless ivory background, \
seen from directly above, with ${LOGO} embroidered small on the left chest. Even studio light. ${LOOK}`,
  },
  {
    id: "product-keychain",
    out: "products/photo-leather-keychain",
    size: "1024x1024",
    prompt: `Product photograph of a small rectangular brown leather keychain with a brushed metal \
ring, lying flat on a seamless ivory background, a soft photographic image printed on the leather. \
Close, even studio light, gentle contact shadow. ${LOOK}`,
  },
];

/** gpt-image-1 list price per image, in USD. */
const PRICE: Record<Quality, number> = { low: 0.016, medium: 0.063, high: 0.25 };

async function generate(asset: Asset, quality: Quality): Promise<Buffer> {
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
      prompt: asset.prompt,
      size: asset.size,
      quality,
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
  const only = argv.includes("--only") ? argv[argv.indexOf("--only") + 1] : null;
  const quality = (argv.includes("--quality")
    ? argv[argv.indexOf("--quality") + 1]
    : "medium") as Quality;

  const publicDir = path.join(process.cwd(), "public");
  const planned: Asset[] = [];

  for (const asset of ASSETS) {
    if (only && asset.id !== only) continue;
    const file = path.join(publicDir, `${asset.out}.webp`);
    try {
      await fs.access(file);
      console.log(`=  ${asset.id.padEnd(24)} exists, skipped`);
      continue;
    } catch {
      planned.push(asset);
    }
  }

  const cost = (planned.length * PRICE[quality]).toFixed(2);
  console.log(
    `\n${planned.length} asset(s) to generate at ${quality} — about $${cost}\n`
  );
  if (dry) {
    for (const a of planned) console.log(`?  ${a.id.padEnd(24)} ${a.size}  -> public/${a.out}.webp`);
    console.log("\nDry run. Re-run without --dry to generate.");
    return;
  }

  for (const asset of planned) {
    process.stdout.write(`→  ${asset.id.padEnd(24)} `);
    try {
      const png = await generate(asset, quality);
      const file = path.join(publicDir, `${asset.out}.webp`);
      await fs.mkdir(path.dirname(file), { recursive: true });
      // webp at 82 keeps these visually clean while staying small enough that a
      // homepage carrying a dozen of them still loads quickly on a phone.
      await sharp(png).webp({ quality: 82 }).toFile(file);
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
