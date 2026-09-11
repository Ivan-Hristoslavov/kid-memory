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

/**
 * Art direction for the shots that show a PRINT on a product.
 *
 * Deliberately not `LOOK`. That palette bans anything saturated, which is right
 * for packaging and wrong here: the whole point of these is the artwork on the
 * garment, and a gaming print in sand and blush is not a gaming print. So the
 * SCENE stays in the brand's neutrals and the DESIGN is free.
 *
 * Every prompt forbids lettering. Image models garble small type — the earlier
 * run produced "CIFTS" and "CITTE FOR EERE ROMENTS" — and a mock-up with a
 * misspelt word on the chest is worse than one with none.
 */
const PRINTED = `Photographed flat on a seamless warm ivory #FEFCF8 background, seen from \
directly above, soft even studio light, gentle contact shadow, generous negative space. The \
garment itself is a plain solid colour; only the printed design carries colour and detail. \
The design is a single clean graphic illustration inside the chest print area, crisp and \
well-registered as a direct-to-film print on fabric. \
ABSOLUTELY NO TEXT, no letters, no numbers, no words, no logos, no watermark, no border, \
no people, no faces, no hands.`;

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

  // ── Hero carousel: real product mock-ups carrying example artwork ────────
  // Not brand packaging. The hero has to show what a customer actually
  // receives, so each of these is a finished product with a plausible design
  // already on it, shot as a scene rather than on seamless white.
  {
    id: "hero-mug",
    out: "hero/mug",
    size: "1536x1024",
    prompt: `A white ceramic photo mug on a pale oak kitchen counter, steam rising from the coffee. \
Printed large on the side of the mug is a warm candid photograph of a smiling young family outdoors, \
clearly reproduced as a photographic print on the ceramic. Soft morning light from a window, a linen \
cloth and a small plant softly out of focus behind. ${LOOK}`,
  },
  {
    id: "hero-tee",
    out: "hero/tee",
    size: "1536x1024",
    prompt: `A white organic cotton t-shirt laid flat and neatly arranged on a pale oak surface, with a \
soft rectangular photographic print of two children laughing across the chest. Beside it a folded \
kraft gift box and a sprig of dried eucalyptus. Shot slightly from above. ${LOOK}`,
  },
  {
    id: "hero-frame",
    out: "hero/frame",
    size: "1536x1024",
    prompt: `A slim natural oak picture frame standing on a pale oak sideboard, holding a printed \
photograph of a couple laughing together, with a wide white mat around it. A ceramic vase with dried \
flowers beside it, warm plaster wall behind. ${LOOK}`,
  },
  {
    id: "hero-tote",
    out: "hero/tote",
    size: "1536x1024",
    prompt: `A natural cotton tote bag hanging from a wooden peg on a warm plaster wall, printed with a \
soft photographic image of a dog. Beside it a linen jacket, softly out of focus. Warm daylight from \
the side. ${LOOK}`,
  },

  // ── Replacement: the couples category shot ───────────────────────────────
  {
    id: "couples",
    out: "moments/for-couples",
    size: "1024x1024",
    prompt: `A man and a woman in their thirties standing close together, foreheads almost touching, \
laughing quietly. He wears a plain sage shirt, she a soft oatmeal knit. Clearly one man and one woman. \
Centred so the shot survives a circular crop. Clean warm-white interior background, softly out of \
focus. ${LOOK}`,
  },

  // ── The rest of the catalogue. Same note as above: stand-ins for supplier
  //    photography, describing the real item forms. ────────────────────────
  // ── Theme tiles: how a gift shop is actually browsed ─────────────────────
  // Somebody arrives knowing it is a colleague's leaving do, not knowing they
  // want a polo shirt. These are the entrances.
  {
    id: "theme-kids",
    out: "themes/kids",
    size: "1024x1024",
    prompt: `A small child's white cotton t-shirt laid flat on a seamless warm ivory background, \
seen from directly above, printed on the chest with a friendly illustrated dinosaur in soft \
greens and warm yellow. Beside it a folded pair of small dungarees and a wooden toy, softly out \
of focus. ${PRINTED}`,
  },
  {
    id: "theme-gaming",
    out: "themes/gaming",
    size: "1024x1024",
    prompt: `A black cotton t-shirt laid flat on a seamless warm ivory background, seen from \
directly above, printed across the chest with a bold graphic illustration of a retro game \
controller in electric violet and cyan on black. Beside it a coiled braided cable, softly out \
of focus. ${PRINTED}`,
  },
  {
    id: "theme-office",
    out: "themes/office",
    size: "1024x1024",
    prompt: `A deep navy polo shirt laid flat on a seamless warm ivory background, seen from \
directly above, with a small tidy embroidered abstract mark on the left chest — a simple \
geometric shape, no letters. Beside it a white ceramic mug and a closed notebook, softly out of \
focus. ${PRINTED}`,
  },
  {
    id: "theme-birthday",
    out: "themes/birthday",
    size: "1024x1024",
    prompt: `A white ceramic mug standing on a seamless warm ivory background beside a kraft gift \
box tied with a blush ribbon and a few paper streamers. Printed on the mug is a colourful \
illustrated birthday cake with candles. Soft studio light, gentle shadow. ${PRINTED}`,
  },
  {
    id: "theme-bachelor",
    out: "themes/bachelor",
    size: "1024x1024",
    prompt: `Three black cotton t-shirts laid flat side by side on a seamless warm ivory \
background, seen from directly above, each printed on the chest with the same bold white \
graphic crown illustration in slightly different sizes. Clean symmetrical arrangement. \
${PRINTED}`,
  },
  {
    id: "theme-couples",
    out: "themes/couples",
    size: "1024x1024",
    prompt: `Two cotton t-shirts laid flat side by side on a seamless warm ivory background, seen \
from directly above — one sand-coloured, one deep forest green — each printed on the chest with \
one half of a single illustrated heart, so the two halves face each other. ${PRINTED}`,
  },

  // ── Products carrying an example design ──────────────────────────────────
  {
    id: "print-tee-men",
    out: "prints/tee-men",
    size: "1024x1024",
    prompt: `A black unisex cotton t-shirt laid flat on a seamless warm ivory background, seen \
from directly above, printed across the chest with a bold illustrated mountain range and sun in \
warm terracotta and cream. ${PRINTED}`,
  },
  {
    id: "print-tee-women",
    out: "prints/tee-women",
    size: "1024x1024",
    prompt: `A soft blush-pink fitted women's cotton t-shirt laid flat on a seamless warm ivory \
background, seen from directly above, printed on the chest with a delicate illustrated bunch of \
wildflowers in muted sage and clay. ${PRINTED}`,
  },
  {
    id: "print-oversize-tee",
    out: "prints/oversize-tee",
    size: "1024x1024",
    prompt: `A heavy oversized black cotton t-shirt laid flat on a seamless warm ivory \
background, seen from directly above, printed large across the chest with a graphic illustrated \
wave in deep blue and white. Visibly thick fabric, dropped shoulders. ${PRINTED}`,
  },
  {
    id: "print-hoodie",
    out: "prints/hoodie",
    size: "1024x1024",
    prompt: `A deep forest green hooded sweatshirt with a kangaroo pocket, laid flat and neatly \
arranged on a seamless warm ivory background, seen from directly above, printed on the chest \
with a small illustrated pine forest in cream. ${PRINTED}`,
  },
  {
    id: "print-sweatshirt",
    out: "prints/sweatshirt",
    size: "1024x1024",
    prompt: `A cream crew-neck sweatshirt without a hood, laid flat on a seamless warm ivory \
background, seen from directly above, printed on the chest with an illustrated sleeping cat in \
charcoal and clay. ${PRINTED}`,
  },
  {
    id: "print-kids-tee",
    out: "prints/kids-tee",
    size: "1024x1024",
    prompt: `A small child's sky-blue cotton t-shirt laid flat on a seamless warm ivory \
background, seen from directly above, printed on the chest with a cheerful illustrated rocket \
and stars in warm yellow and coral. ${PRINTED}`,
  },
  {
    id: "print-bodysuit",
    out: "prints/bodysuit",
    size: "1024x1024",
    prompt: `A white baby bodysuit with press studs, laid flat on a seamless warm ivory \
background, seen from directly above, printed on the chest with a tiny illustrated bear cub in \
soft brown. Beside it a folded muslin cloth, softly out of focus. ${PRINTED}`,
  },
  {
    id: "print-crop-top",
    out: "prints/crop-top",
    size: "1024x1024",
    prompt: `A short white cropped women's t-shirt laid flat on a seamless warm ivory background, \
seen from directly above, printed small and centred on the chest with an illustrated crescent \
moon and stars in muted gold. ${PRINTED}`,
  },
  {
    id: "print-polo",
    out: "prints/polo",
    size: "1024x1024",
    prompt: `A white cotton polo shirt with a collar and two buttons, laid flat on a seamless \
warm ivory background, seen from directly above, with a small neat embroidered abstract leaf \
mark on the left chest. ${PRINTED}`,
  },
  {
    id: "print-tote",
    out: "prints/tote",
    size: "1024x1024",
    prompt: `A natural undyed cotton tote bag with long handles, laid flat and neatly arranged on \
a seamless warm ivory background, seen from directly above, printed on the front panel with an \
illustrated bunch of herbs in sage green. ${PRINTED}`,
  },
  {
    id: "print-cap",
    out: "prints/cap",
    size: "1024x1024",
    prompt: `A black cotton baseball cap resting on a seamless warm ivory background, seen from \
slightly above and in front, with a small neat embroidered abstract mountain mark on the front \
panel. ${PRINTED}`,
  },
  {
    id: "print-mug",
    out: "prints/mug",
    size: "1024x1024",
    prompt: `A white glossy ceramic mug standing centred on a seamless warm ivory background, \
printed on its side with an illustrated pair of dogs in charcoal and clay. Soft studio light, \
gentle contact shadow. ${PRINTED}`,
  },
  {
    id: "print-enamel-mug",
    out: "prints/enamel-mug",
    size: "1024x1024",
    prompt: `A white enamel camping mug with a dark rim, standing on a seamless warm ivory \
background, printed on its side with an illustrated campfire and pine trees in warm orange and \
deep green. ${PRINTED}`,
  },
  {
    id: "print-bottle",
    out: "prints/bottle",
    size: "1024x1024",
    prompt: `A brushed aluminium water bottle with a screw cap, standing upright on a seamless \
warm ivory background, printed down its side with an illustrated wave pattern in deep teal. \
${PRINTED}`,
  },
  {
    id: "print-stickers",
    out: "prints/stickers",
    size: "1024x1024",
    prompt: `Six square die-cut vinyl stickers arranged in a loose grid on a seamless warm ivory \
background, seen from directly above, each printed with a different simple illustration — a \
cactus, a cat, a mountain, a rocket, a flower, a paw print — in warm muted colours with a white \
border around each sticker. ${PRINTED}`,
  },
  {
    id: "print-heavy-tee",
    out: "prints/heavy-tee",
    size: "1024x1024",
    prompt: `A very heavy sand-coloured oversized cotton t-shirt laid flat on a seamless warm \
ivory background, seen from directly above, printed across the chest with a bold illustrated \
sun and desert horizon in burnt orange and cream. Visibly thick ribbed collar. ${PRINTED}`,
  },
  {
    id: "print-tank-men",
    out: "prints/tank-men",
    size: "1024x1024",
    prompt: `A white cotton men's tank top with wide shoulder straps, laid flat on a seamless \
warm ivory background, seen from directly above, printed on the chest with an illustrated palm \
leaf in deep green. ${PRINTED}`,
  },
  {
    id: "print-tank-women",
    out: "prints/tank-women",
    size: "1024x1024",
    prompt: `A black fitted women's tank top laid flat on a seamless warm ivory background, seen \
from directly above, printed small and centred on the chest with an illustrated hummingbird in \
teal and gold. ${PRINTED}`,
  },
  {
    id: "print-oversize-hoodie",
    out: "prints/oversize-hoodie",
    size: "1024x1024",
    prompt: `A heavy oversized olive-green hooded sweatshirt with drawstrings, laid flat and \
neatly arranged on a seamless warm ivory background, seen from directly above, printed on the \
chest with an illustrated mountain ridge in cream. Dropped shoulders, thick cuffs. ${PRINTED}`,
  },
  {
    id: "print-zip-hoodie",
    out: "prints/zip-hoodie",
    size: "1024x1024",
    prompt: `A black zip-up hooded sweatshirt with a full metal zip and side pockets, laid flat \
and neatly arranged on a seamless warm ivory background, seen from directly above, with a small \
illustrated wolf head printed on the left chest in white. ${PRINTED}`,
  },
  {
    id: "print-tracksuit",
    out: "prints/tracksuit",
    size: "1024x1024",
    prompt: `A black fleece tracksuit — a crew sweatshirt above and matching jogging bottoms \
below — laid flat and neatly arranged on a seamless warm ivory background, seen from directly \
above, with a small illustrated abstract mark printed on the chest in cream. ${PRINTED}`,
  },
  {
    id: "print-shorts",
    out: "prints/shorts",
    size: "1024x1024",
    prompt: `A pair of black cotton jersey shorts with a drawstring waist, laid flat and neatly \
folded on a seamless warm ivory background, seen from directly above, with a small illustrated \
wave printed on one leg in white. ${PRINTED}`,
  },
  {
    id: "print-trucker",
    out: "prints/trucker",
    size: "1024x1024",
    prompt: `A black and white trucker cap with a mesh back panel and a curved bill, resting on \
a seamless warm ivory background, seen from slightly above and in front, with a small \
illustrated cactus embroidered on the front panel. ${PRINTED}`,
  },
  {
    id: "print-bucket",
    out: "prints/bucket",
    size: "1024x1024",
    prompt: `A khaki cotton bucket hat with a soft downturned brim, resting on a seamless warm \
ivory background, seen from slightly above and in front, with a small illustrated fish \
embroidered on the side. ${PRINTED}`,
  },
  {
    id: "print-gift-box",
    out: "prints/gift-box",
    size: "1024x1024",
    prompt: `A closed matte black cardboard gift box with a lid, standing on a seamless warm \
ivory background at a slight three-quarter angle, printed on the lid with a delicate \
illustrated botanical wreath in blush pink. A folded blush ribbon resting beside it. ${PRINTED}`,
  },
  // ── Hero carousel, second wave ──────────────────────────────────────────
  // Wide scenes that fill the frame edge to edge. The posters in the rotation
  // are portrait and can only ever be contained; these are what give the hero
  // its full-bleed slides.
  {
    id: "hero-stag",
    out: "hero/stag",
    size: "1536x1024",
    prompt: `Five black cotton t-shirts laid flat side by side on a pale oak table, seen from \
directly above, each printed on the chest with a simple cream graphic. Beside them two beer \
steins and a set of keys. Warm daylight from one side, soft shadows. ${LOOK}`,
  },
  {
    id: "hero-hen",
    out: "hero/hen",
    size: "1536x1024",
    prompt: `Four soft blush-pink t-shirts laid flat in a neat row on a warm plaster surface, \
seen from directly above, each printed with a small delicate floral graphic. Beside them dried \
eucalyptus, two coupe glasses and a length of satin ribbon. ${LOOK}`,
  },
  {
    id: "hero-hoodie",
    out: "hero/hoodie",
    size: "1536x1024",
    prompt: `A deep forest green hooded sweatshirt laid flat on a pale oak surface, seen from \
slightly above, printed on the chest with a small cream illustrated mountain range. A folded \
kraft gift box and a sprig of dried eucalyptus beside it. ${LOOK}`,
  },
  {
    id: "hero-kids",
    out: "hero/kids",
    size: "1536x1024",
    prompt: `A small child's white cotton t-shirt laid flat on a pale oak surface beside a \
folded pair of dungarees and a wooden toy train, seen from directly above, the t-shirt printed \
with a friendly illustrated dinosaur in soft green and warm yellow. ${LOOK}`,
  },
  {
    id: "hero-desk",
    out: "hero/desk",
    size: "1536x1024",
    prompt: `A white ceramic mug printed with an illustrated pair of dogs, standing on a pale \
oak desk beside a closed linen notebook, a natural cotton tote bag folded flat, and three small \
die-cut stickers. Soft morning light from a window on the left. ${LOOK}`,
  },
  // ── PrintFactory's range: paper, which the textile printer cannot do ─────
  {
    id: "print-poster-framed",
    out: "prints/poster-framed",
    size: "1024x1024",
    prompt: `A slim natural oak picture frame standing upright on a seamless warm ivory \
background, seen face-on, holding a matte print of an illustrated mountain landscape at sunrise \
in terracotta and cream, with a wide white mat around it. Even studio light, gentle contact \
shadow. ${PRINTED}`,
  },
  {
    id: "print-poster-hangers",
    out: "prints/poster-hangers",
    size: "1024x1024",
    prompt: `A portrait paper print hanging from two slim oak batten hangers with a cord at the \
top, against a seamless warm ivory background, seen face-on. The print shows an illustrated \
botanical branch in sage green. Even studio light, soft shadow behind the paper. ${PRINTED}`,
  },
  {
    id: "print-poster-paper",
    out: "prints/poster-paper",
    size: "1024x1024",
    prompt: `A single sheet of matte art paper lying flat on a seamless warm ivory background, \
seen from directly above, printed with an illustrated sun and desert horizon in burnt orange and \
cream, one corner very slightly lifted to show the paper's thickness. ${PRINTED}`,
  },
  {
    id: "print-notebook",
    out: "prints/notebook",
    size: "1024x1024",
    prompt: `A closed hardcover notebook with an elastic closure band, lying flat at a slight \
angle on a seamless warm ivory background, seen from directly above, its cover printed with an \
illustrated line-drawn mountain range in cream on deep navy. ${PRINTED}`,
  },
  {
    id: "print-magic-mug",
    out: "prints/magic-mug",
    size: "1024x1024",
    prompt: `Product photograph of a black glossy ceramic mug standing centred on a seamless \
warm ivory background, with a lighter panel on its side where a colourful illustrated hot-air \
balloon has appeared, as if revealed by heat. The rest of the mug stays matte black. Even studio \
light, gentle contact shadow. ${PRINTED}`,
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
