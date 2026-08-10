/**
 * Shared poster-artwork generation for the marketing images.
 *
 * Two scripts draw the same thing — a finished poster with baked-in Bulgarian
 * lettering — for two different slots on the site: `gen-samples.mjs` fills the
 * style grid, `gen-occasions.mjs` fills the occasion cards. The prompt is the
 * expensive part to get right (identity, exact Cyrillic, print margins), so it
 * lives here once and both scripts call it.
 *
 * COSTS OpenAI credit: one 1024x1536 generation per missing file, medium
 * quality by default (override with SAMPLE_QUALITY=high).
 */
import { promises as fs } from "fs";
import sharp from "sharp";

export const STYLE_PROMPTS = {
  realistic:
    "a detailed semi-realistic painted portrait illustration for print — lifelike face, soft realistic skin and eyes, fine painterly detail, natural colours; a fine-art portrait, only lightly illustrated (NOT a cartoon)",
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

/**
 * What holds the text on the poster. A dog does not talk — a speech bubble
 * reads as a joke about the dog rather than about its habits — and birth stats
 * are records, not speech.
 */
export const CONTAINERS = {
  speech: "comic-style speech bubbles",
  caption:
    "small decorative caption tags or ribbons, NOT speech bubbles coming from the animal's mouth",
  card: "small elegant label cards — soft rounded panels or hand-drawn frames, NOT speech bubbles",
};

/**
 * @param {{style: string, kind: keyof typeof CONTAINERS, hero: string,
 *   scene: string, title: string,
 *   lines: {text: string, sub?: string, visual?: string}[]}} s
 */
export function buildPrompt(s) {
  const container = s.kind === "speech" ? "bubble" : "label";
  const spec = s.lines
    .map((l, i) => {
      const second = l.sub
        ? `, and directly under it on its own line in noticeably smaller plain lettering „${l.sub}“`
        : " — this one has a single line only";
      const art = l.visual
        ? ` Just outside this ${container}, touching it but never overlapping a letter, draw exactly one ${l.visual}; it belongs to ${container} ${i + 1} only and appears nowhere else.`
        : ` This ${container} has no drawing beside it.`;
      return `${container} ${i + 1}: large bold Bulgarian Cyrillic reading „${l.text}“${second}.${art}`;
    })
    .join(" ");

  return [
    `Create a COMPLETE, premium personalized POSTER — a single finished artwork. The hero: ${s.hero}, front and centre, facing the viewer, warm and characterful.`,
    `Whole-scene art style: ${STYLE_PROMPTS[s.style]}. Setting: ${s.scene}. Fill the frame with rich detail, harmonious colours and a polished professional poster composition.`,
    "PRINT COMPOSITION: keep a calm margin of at least 7% of the image height on all four sides; nothing important may touch or cross it, and never crop the hero at the bottom edge.",
    "BAKE THE TEXT INTO THE ARTWORK, drawn in the same illustration style:",
    `• A decorative hand-lettered TITLE banner across the top reading exactly, in correct Bulgarian Cyrillic: “${s.title}”.`,
    `• Exactly ${s.lines.length} ${CONTAINERS[s.kind]}, no more and no fewer. ${spec}`,
    "CRITICAL: never swap text between drawings — each line sits with its own object. Each drawn object appears EXACTLY ONCE, evenly spaced, tidy.",
    "Copy every Bulgarian word CHARACTER-BY-CHARACTER exactly — do not translate, autocorrect, drop or invent any letter, and never hyphenate or split a word across two lines. Large, clean, clearly legible text.",
    "Vertical portrait poster, 2:3. No signature, no watermark. High detail, professional print quality.",
  ].join(" ");
}

/**
 * Draws one poster and writes it as webp. Existing files are skipped, so a
 * re-run only pays for what is missing — delete a file to have it redrawn.
 *
 * @returns {Promise<"skipped" | "ok" | "failed">}
 */
export async function renderPoster(spec, outPath, { width = 768 } = {}) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY missing");

  try {
    await fs.access(outPath);
    return "skipped";
  } catch {}

  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt: buildPrompt(spec),
      size: "1024x1536",
      quality: process.env.SAMPLE_QUALITY || "medium",
      n: 1,
    }),
  });
  if (!res.ok) {
    console.log(`  HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
    return "failed";
  }
  const json = await res.json();
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) {
    console.log("  no image in response");
    return "failed";
  }
  await sharp(Buffer.from(b64, "base64")).resize({ width }).webp({ quality: 84 }).toFile(outPath);
  return "ok";
}

/** Runs a list of specs, one at a time, and reports what each one cost. */
export async function renderAll(items) {
  let made = 0;
  for (const { spec, out, label } of items) {
    process.stdout.write(`${label}... `);
    try {
      const result = await renderPoster(spec, out);
      console.log(result === "ok" ? "OK" : result === "skipped" ? "skip (exists)" : "FAIL");
      if (result === "ok") made++;
    } catch (err) {
      console.log(`FAIL ${err.message}`);
    }
  }
  console.log(`Done. ${made} image(s) generated.`);
}
