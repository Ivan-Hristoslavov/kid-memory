/**
 * Renders sample posters through the REAL production compositing path, so what
 * the marketing pages show is what a customer actually receives.
 *
 * The previous samples were drawn by `poster-art.mjs`, which asks the image
 * model to letter the poster itself. Production no longer does that: the model
 * returns a text-free illustration and `composeFinalPoster` draws the Bulgarian
 * wording as vector outlines. A sample produced the old way advertises a poster
 * the shop does not make — and shows the malformed Cyrillic that moving the
 * lettering into the app was meant to eliminate.
 *
 * Run: npx tsx --tsconfig scripts/tsconfig.json scripts/gen-preview-samples.ts [outDir]
 * Needs OPENAI_API_KEY. Costs one image generation per sample
 * (SAMPLE_QUALITY=low ≈ €0.017 each).
 */
import { promises as fs } from "fs";
import path from "path";
import { compositionContract } from "@/lib/ai/provider";
import { composeFinalPoster } from "@/lib/poster/compose";
import { TEMPLATE_PROMPTS } from "@/lib/ai/template-prompt";
import type { PosterSubject, TemplateId } from "@/lib/templates";

interface Sample {
  file: string;
  template: TemplateId;
  subjects: PosterSubject[];
  /** Fictional hero — never a real person, these end up on the storefront. */
  hero: string;
  scene: string;
  style: string;
}

const SAMPLES: Sample[] = [
  {
    file: "kid-words",
    template: "KID_WORDS",
    hero: "one fictional cheerful 3-year-old boy with short blond hair, blue eyes and a striped t-shirt — an entirely invented child, not based on any real person",
    scene: "a sunlit storybook meadow, soft distant hills, a few wildflowers low near his feet",
    style:
      "a richly detailed painted children's-book illustration — watercolor and coloured-pencil texture, warm daylight, vibrant but natural colours",
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
    hero: "one fictional friendly woman in her early 40s with shoulder-length dark hair, wearing a blazer over a plain top — an entirely invented person, not based on anyone real",
    scene: "a calm modern office, softly blurred desks and a bright window behind her",
    style:
      "a polished semi-realistic painted portrait illustration, warm and characterful, suitable for an adult to hang in an office",
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
    hero: "one fictional scruffy medium-sized brown mixed-breed dog with one folded ear, sitting and looking at the viewer",
    scene: "a cosy living room, a softly blurred sofa and a warm rug, gentle afternoon light",
    style:
      "a charming richly detailed illustrated poster style, painterly texture, warm domestic colours",
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

function artPrompt(s: Sample): string {
  const t = TEMPLATE_PROMPTS[s.template];
  return [
    `Create a premium personalized poster ILLUSTRATION featuring ${s.hero}.`,
    `Setting: ${s.scene}.`,
    `Art direction: ${s.style}.`,
    compositionContract(t.noun),
    "Do NOT write or draw ANY text, letters, words, numbers, captions, speech bubbles, banners, ribbons, labels, signatures or watermark anywhere — in any language, and ESPECIALLY no Bulgarian / Cyrillic text. Every word and every bubble is added separately by the app afterwards, so the illustration itself must be completely text-free.",
    "Vertical portrait poster, 2:3. High detail, professional print quality.",
  ].join(" ");
}

async function generateArt(prompt: string): Promise<Buffer> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");

  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt,
      size: "1024x1536",
      quality: process.env.SAMPLE_QUALITY || "low",
      n: 1,
    }),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const json = (await res.json()) as { data: { b64_json: string }[] };
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) throw new Error("no image in response");
  return Buffer.from(b64, "base64");
}

// Wrapped rather than top-level await: package.json has no "type": "module",
// so the runner transpiles these scripts to CommonJS.
async function main() {
  const outDir = process.argv[2] || "public/samples/preview";
  await fs.mkdir(outDir, { recursive: true });

  for (const sample of SAMPLES) {
    console.log(`\n▸ ${sample.file} (${sample.template})`);
    const artFile = path.join(outDir, `${sample.file}-art.png`);

    // The illustration is the expensive half and the typography is the half
    // that gets iterated on, so a saved illustration is reused. Delete the
    // -art.png file to redraw it.
    let art: Buffer;
    try {
      art = await fs.readFile(artFile);
      console.log("  reusing existing illustration");
    } catch {
      const started = Date.now();
      art = await generateArt(artPrompt(sample));
      console.log(`  art generated in ${((Date.now() - started) / 1000).toFixed(1)}s`);
    }

    const poster = await composeFinalPoster(art, {
      template: sample.template,
      subjects: sample.subjects,
    });

    await fs.writeFile(artFile, art);
    await fs.writeFile(path.join(outDir, `${sample.file}.png`), poster);
    console.log(`  saved ${path.join(outDir, `${sample.file}.png`)}`);
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
