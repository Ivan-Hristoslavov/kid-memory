/**
 * Generates 6 marketing sample posters (one per style) with FICTIONAL children
 * via gpt-image-1 text-to-image, and saves optimized webp files to
 * public/samples/{style}.webp. Run: node --env-file=.env scripts/gen-samples.mjs
 */
import { promises as fs } from "fs";
import path from "path";
import sharp from "sharp";

const KEY = process.env.OPENAI_API_KEY;
if (!KEY) throw new Error("OPENAI_API_KEY missing");

const STYLE_PROMPTS = {
  realistic:
    "a detailed semi-realistic painted portrait illustration for print — lifelike face, soft realistic skin and eyes, fine painterly detail, natural colours; a fine-art children's portrait, only lightly illustrated (NOT a cartoon)",
  storybook:
    "a richly detailed painted children's-book illustration — watercolor and colored-pencil textures, warm natural daylight, lifelike face with soft painterly shading, vibrant yet natural colours, like a high-end illustrated storybook cover",
  disney:
    "a polished Disney / Pixar-style illustration — soft rounded features, big warm expressive eyes, gentle cinematic lighting, cute and charming",
  caricature:
    "a playful, good-natured caricature / comic illustration — bold clean outlines, lively slightly exaggerated features, bright cheerful colours, fun and humorous",
  watercolor:
    "a delicate hand-painted watercolor illustration, soft washes and gentle pastel tones, realistic sweet face",
  fantasy:
    "a richly painted magical fantasy illustration with soft glow, sparkles and a dreamy enchanted atmosphere",
};

const SAMPLES = [
  {
    style: "realistic",
    child: "a fictional cute 4-year-old Bulgarian girl with wavy chestnut hair and brown eyes, wearing a soft pink dress",
    scene: "a sunlit summer garden with roses and a wooden fence",
    title: "Думичките на Мила",
    bubbles: [
      { text: "прахумосмачка", visual: "a cute cartoon vacuum cleaner" },
      { text: "аляяя", visual: "a cute glass of water with a smiling face" },
    ],
  },
  {
    style: "storybook",
    child: "a fictional cheerful 3-year-old Bulgarian boy with short blond hair and blue eyes, wearing a striped t-shirt",
    scene: "a storybook meadow with a little red tractor and haystacks",
    title: "Думичките на Боби",
    bubbles: [
      { text: "апум", visual: "a beautiful friendly peacock" },
      { text: "тактул", visual: "a cute little red tractor with eyes" },
    ],
  },
  {
    style: "disney",
    child: "a fictional adorable 5-year-old Bulgarian girl with long dark hair in a ponytail and green eyes, wearing a teal dress",
    scene: "an underwater-themed dreamy world with soft bubbles and corals",
    title: "Думичките на Ема",
    bubbles: [
      { text: "опокоп", visual: "a cute smiling octopus" },
      { text: "мецан", visual: "a soft brown teddy bear" },
    ],
  },
  {
    style: "caricature",
    child: "a fictional funny 4-year-old Bulgarian boy with curly red hair and freckles, wearing a yellow t-shirt",
    scene: "a bright playground with a slide and scattered toys",
    title: "Думичките на Ники",
    bubbles: [
      { text: "хеикоптел", visual: "a goofy cartoon helicopter" },
      { text: "нанан", visual: "a happy cartoon banana" },
    ],
  },
  {
    style: "watercolor",
    child: "a fictional sweet 3-year-old Bulgarian girl with two little pigtails and hazel eyes, wearing a lavender dress",
    scene: "a soft watercolor spring garden with butterflies and blossoms",
    title: "Думичките на Дара",
    bubbles: [
      { text: "пепелуда", visual: "a delicate colorful butterfly" },
      { text: "кококо", visual: "a cute fluffy hen" },
    ],
  },
  {
    style: "fantasy",
    child: "two fictional Bulgarian twins — a 4-year-old boy and girl with brown hair, wearing cozy sweaters",
    scene: "a magical starry forest with glowing fireflies and a friendly baby dragon",
    title: "Думичките на Ани и Алекс",
    bubbles: [
      { text: "дакончо", visual: "a small friendly baby dragon" },
      { text: "зездичка", visual: "a glowing golden star" },
    ],
  },
];

function buildPrompt(s) {
  const bubbles = s.bubbles
    .map(
      (b) =>
        `a bubble reading exactly „${b.text}“ whose tail points directly at ${b.visual} touching it — this word belongs to THAT drawing only`
    )
    .join("; ");
  return [
    `Create a COMPLETE, premium personalized children's memory POSTER — a single finished artwork. The hero: ${s.child} (an entirely fictional child, not a real person), front and centre, facing the viewer, joyful.`,
    `Whole-scene art style: ${STYLE_PROMPTS[s.style]}. Setting: ${s.scene}. Fill the frame with rich detail, vibrant harmonious colours and a polished professional poster composition.`,
    "BAKE THE TEXT INTO THE ARTWORK, drawn in the same illustration style:",
    `• A decorative hand-lettered TITLE banner across the top reading exactly, in correct Bulgarian Cyrillic: “${s.title}”.`,
    `• Comic-style speech bubbles in bold Bulgarian Cyrillic: ${bubbles}. CRITICAL: never swap the words between the drawings — each word must sit with its own matching object. Each drawn object appears EXACTLY ONCE, no duplicates, evenly spaced, tidy.`,
    "Copy every Bulgarian word CHARACTER-BY-CHARACTER exactly — do not translate, autocorrect, drop or invent any letter. Large, clean, clearly legible text.",
    "Vertical portrait poster, 2:3. No signature, no watermark. High detail, professional print quality.",
  ].join(" ");
}

const outDir = path.join(process.cwd(), "public", "samples");
await fs.mkdir(outDir, { recursive: true });

for (const s of SAMPLES) {
  const out = path.join(outDir, `${s.style}.webp`);
  try {
    await fs.access(out);
    console.log(`skip ${s.style} (exists)`);
    continue;
  } catch {}

  process.stdout.write(`generating ${s.style}... `);
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt: buildPrompt(s),
      size: "1024x1536",
      quality: "high",
      n: 1,
    }),
  });
  if (!res.ok) {
    console.log(`FAIL HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    continue;
  }
  const json = await res.json();
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) {
    console.log("FAIL no image");
    continue;
  }
  await sharp(Buffer.from(b64, "base64"))
    .resize({ width: 768 })
    .webp({ quality: 84 })
    .toFile(out);
  console.log("OK");
}
console.log("Done.");
