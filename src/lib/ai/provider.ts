import "server-only";
import sharp from "sharp";
import { STYLES } from "@/lib/catalog";
import { aiBakesText } from "@/lib/config";
import {
  DEFAULT_TEMPLATE,
  MAX_POSTER_LINES,
  type PosterSubject,
  type TemplateId,
} from "@/lib/templates";
import { TEMPLATE_PROMPTS, formatAge } from "./template-prompt";

export { formatAge };
export { joinNames } from "@/lib/templates";

/**
 * AI poster generation. With gpt-image-1 the model renders the COMPLETE poster —
 * illustration + hand-lettered title + bubbles — all baked in, so the text and
 * art share one cohesive style (ChatGPT-quality result).
 *
 * What differs per poster template (a child's mispronunciations vs a dog's
 * habits vs a birth weight) lives in `template-prompt.ts`; everything below is
 * shared, because identity lock, art direction and print safe area are the same
 * problem whoever is in the photo.
 */
export interface GenerationRequest {
  photo: Buffer;
  template: TemplateId;
  subjects: PosterSubject[];
  animals: string[]; // animal ids from catalog
  style: string; // style id from catalog
  /** Image quality — set from admin settings; drives cost per poster. */
  quality?: "low" | "medium" | "high";
}

export interface AIImageProvider {
  /** Returns a high-resolution illustration as PNG buffer. */
  generate(req: GenerationRequest): Promise<Buffer>;
}

const STYLE_PROMPTS: Record<string, string> = {
  realistic:
    "a detailed semi-realistic painted portrait illustration for print — lifelike faces faithful to the photo, soft realistic skin and eyes, fine painterly detail, natural colours; a fine-art children's portrait, only lightly illustrated (NOT a cartoon)",
  storybook:
    "a richly detailed painted children's-book illustration — watercolor and colored-pencil textures, warm natural daylight, lifelike recognizable faces with soft painterly shading and fine detail, vibrant yet natural colours, like a high-end illustrated storybook cover (slightly stylized, NOT a flat cartoon)",
  disney:
    "a polished modern 3D-animated feature-film look — soft rounded volumes, big warm expressive eyes, soft subsurface skin shading, gentle cinematic lighting, cute and charming, while keeping the REAL child clearly recognizable (not a generic character)",
  caricature:
    "a playful, good-natured comic illustration — bold clean outlines and bright cheerful colours, but the face itself stays TRUE to the photo: real face shape, real hair, real eye colour and the child's own smile, only gently stylized. Do NOT turn the child into a generic cartoon character and do NOT exaggerate the head, eyes or features beyond recognition",
  watercolor:
    "a delicate hand-painted watercolor illustration, soft washes and gentle pastel tones, still keeping realistic recognizable faces",
  fantasy:
    "a richly painted magical fantasy illustration with soft glow, sparkles and a dreamy enchanted atmosphere, semi-realistic recognizable faces",
};

/**
 * How the little objects drawn next to each bubble should be rendered. Without
 * this they default to flat cartoon stickers, which clash badly on the painted
 * styles — a smiley-faced vacuum on a semi-realistic portrait reads as a
 * mistake.
 */
const OBJECT_STYLE_PROMPTS: Record<string, string> = {
  realistic: "painted in the same soft semi-realistic style as the rest of the artwork",
  storybook: "drawn in the same watercolor and colored-pencil storybook style as the scene",
  disney: "modelled in the same soft rounded 3D-animated style as the scene",
  caricature: "drawn with the same bold clean comic outlines as the rest of the poster",
  watercolor: "painted as a delicate watercolor sketch matching the rest of the artwork",
  fantasy: "painted in the same magical, softly glowing style as the scene",
};

const ANIMAL_PROMPTS: Record<string, string> = {
  dog: "an adorable playful puppy",
  cat: "a sweet fluffy kitten",
  rabbit: "a soft cuddly bunny",
  panda: "a cuddly baby panda",
  bird: "a cheerful little songbird",
  owl: "a wise cute little owl",
  fish: "a bright friendly little fish",
  turtle: "a happy little turtle",
  squirrel: "a clever little squirrel",
  snail: "a friendly little snail",
  bee: "a cheerful little bee",
  hamster: "a chubby cute hamster",
};

/** The template's prompt language, falling back to the original product. */
function promptFor(template: TemplateId) {
  return TEMPLATE_PROMPTS[template] ?? TEMPLATE_PROMPTS[DEFAULT_TEMPLATE];
}

/**
 * The layout the illustration and the compositor both have to agree on.
 *
 * The compositor is blind to the picture. It can measure where detail sits
 * (`busynessMap` in lib/poster/compose.ts) but it cannot move a face out of the
 * way, so the free space has to be requested up front. Exported because the
 * marketing sample script renders through the same layout — a sample drawn to
 * different rules would advertise a poster the shop does not make.
 */
export function compositionContract(noun: string): string {
  return [
    "COMPOSITION CONTRACT — wording is added by the app afterwards, so the artwork must leave room for it:",
    `the ${noun} occupy the central vertical third of the frame, front and centre, facing the viewer, and are never cropped;`,
    "the top 18% of the image is calm background only — open sky, soft foliage, blurred wall — with no face, no prop and no busy pattern;",
    "the left and right quarters of the image, from below that band down to 90% of the height, stay visually quiet: simple, low-contrast, softly blurred background with no important detail, so a caption placed there does not cover anything;",
    "companion characters and props sit low and central, near the feet, not out at the edges;",
    "keep a clean margin of at least 7% of the image height on all four sides.",
  ].join(" ");
}

/**
 * Text-free illustration prompt. The app overlays the wording afterwards, so
 * the model is asked for a picture and nothing that resembles a letter.
 */
export function buildPrompt(req: GenerationRequest): string {
  const style = STYLE_PROMPTS[req.style] ?? STYLE_PROMPTS.storybook;
  const t = promptFor(req.template);
  const animals = req.animals
    .map((a) => ANIMAL_PROMPTS[a])
    .filter(Boolean)
    .join(", ");
  const n = req.subjects.length;
  const noun = n === 1 ? t.noun : t.nounPlural;

  return [
    `Transform the uploaded photo of ${n === 1 ? `a real, specific ${t.noun}` : `${n} real, specific ${t.nounPlural}`} into a personalized poster illustration. Keep EVERY ${t.noun} that appears in the photo — all ${n}.`,
    `CRITICAL — PHOTOREALISTIC IDENTITY LOCK: render each ${t.noun} with a faithful, high-fidelity, semi-realistic likeness — as if a master portrait artist carefully painted THIS exact subject from the photo.`,
    t.identityLock(n),
    `Render the surrounding world, background, lighting and props in this art direction, while keeping the ${noun} true to the photo: ${style}.`,
    `Keep the ${noun} as the clear main hero(es): together, front and centre, facing the viewer, natural pose.`,
    animals
      ? `Add these as charming, richly detailed companion characters around the ${noun} (they must NOT replace or cover them): ${animals}.`
      : "",
    (() => {
      const things = req.subjects
        .flatMap((s) => s.lines.map((l) => l.visual).filter(Boolean))
        .slice(0, 8);
      return things.length
        ? `Also include, EXACTLY ONCE each, a small drawing of: ${things.map((x) => `"${x}"`).join(", ")} — evenly spaced around the ${noun}, no duplicates.`
        : "";
    })(),
    compositionContract(noun),
    "Compose as a vertical portrait poster with a lush, detailed scene, real depth and soft cinematic lighting.",
    "Do NOT write or draw ANY text, letters, words, numbers, captions, speech bubbles, banners, ribbons, labels, signatures or watermark anywhere — in any language, and ESPECIALLY no Bulgarian / Cyrillic text. Every word and every bubble is added separately by the app afterwards, so the illustration itself must be completely text-free and never attempt to spell anything.",
    "Rich detail, natural realistic rendering, harmonious colour palette, professional print quality, 4K.",
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * Full-poster prompt for gpt-image-1: the model bakes the illustration AND the
 * Bulgarian text (title banner + speech bubbles) into one cohesive artwork.
 */
export function buildPosterPrompt(req: GenerationRequest): string {
  const style = STYLE_PROMPTS[req.style] ?? STYLE_PROMPTS.storybook;
  const objectStyle = OBJECT_STYLE_PROMPTS[req.style] ?? OBJECT_STYLE_PROMPTS.storybook;
  const animals = req.animals
    .map((a) => ANIMAL_PROMPTS[a])
    .filter(Boolean)
    .join(", ");

  const t = promptFor(req.template);
  const n = req.subjects.length;
  const noun = n === 1 ? t.noun : t.nounPlural;
  const title = t.title(req.subjects);
  const subtitle = t.subtitle(req.subjects, new Date().getFullYear());

  // gpt-image-1 binds words to drawings far more reliably when each pair is a
  // numbered, positioned unit rather than one long list — otherwise it swaps
  // captions between objects and repeats the same drawing twice.
  const SLOTS = [
    "in the upper-left area",
    "in the upper-right area",
    "in the lower-left area",
    "in the lower-right area",
    "in the middle-left area",
    "in the middle-right area",
  ];

  // Spread the cap across subjects so one talkative child cannot eat every slot
  // and leave their sibling with none.
  const perSubject = Math.max(1, Math.floor(MAX_POSTER_LINES / Math.max(n, 1)));
  const lines = req.subjects.flatMap((s) =>
    s.lines.slice(0, perSubject).map((l) => ({ ...l, owner: s.name }))
  );

  // A dog does not speak and a birth weight is not a quote — the container word
  // has to follow the template, or the model draws speech bubbles regardless.
  const container = t.bubbleKind === "speech" ? "bubble" : "label";
  const Container = container === "bubble" ? "Bubble" : "Label";

  const bubbleSpec = lines
    .slice(0, SLOTS.length)
    .map((w, i) => {
      const who = n === 1 ? "" : ` (belongs to ${w.owner})`;
      // The drawing sits OUTSIDE the container — placing it inside made the
      // model render objects on top of the lettering.
      const art = w.visual
        ? ` Just outside this ${container}, touching it but never overlapping any letter, draw exactly one small "${w.visual}", ${objectStyle}. It belongs to ${container} ${i + 1} only and must not appear anywhere else in the poster.`
        : ` This ${container} has no drawing beside it.`;
      return `${Container} ${i + 1}, ${SLOTS[i]}${who}: ${t.bubbleText(w)}.${art}`;
    })
    .join(" ");

  return [
    `Create a COMPLETE, premium personalized children's memory POSTER featuring all ${n} ${n === 1 ? "child" : "children"} from the photo — a single finished artwork in a warm, richly detailed storybook / comic-book illustration style, like a beautiful children's book cover.`,
    // Toddlers and animals read as ambiguous in photos far more often than
    // adults, so state exactly who is in the frame.
    `The ${n === 1 ? `${t.noun} is` : `${t.nounPlural} are`}: ${req.subjects
      .map((s) => t.describe(s))
      .join("; ")}.`,
    t.identityLock(n),
    `Whole-scene art style: ${style}. Fill the frame with a lush, richly detailed world (nature, light, soft depth), harmonious colours and a polished professional poster composition — not empty or sparse.`,
    animals
      ? `Populate the scene with these as expressive, friendly companion characters around the ${noun}, ${objectStyle}: ${animals}.`
      : "",
    // Print safe area: the most common defect was the subject sliced by the
    // bottom edge, which reads as a printing mistake once the poster is framed.
    `PRINT COMPOSITION — this poster will be printed and framed, so respect a safe area: keep a clean, calm margin of at least 7% of the image height on all four sides. No letter, ${container}, face or important detail may touch or cross that margin. The ${noun} must sit fully inside the frame: never crop at the bottom edge, and leave clear visible space between the lowest part of the ${noun} and the bottom of the poster.`,
    t.bubbleRule,
    "BAKE THE TEXT INTO THE ARTWORK, hand-lettered in the same illustration style:",
    `\u2022 A decorative TITLE banner across the top reading exactly, in correct Bulgarian Cyrillic: \u201c${title}\u201d.`,
    subtitle
      ? `\u2022 Directly beneath the title, in small elegant lettering: \u201c${subtitle}\u201d.`
      : "",
    `\u2022 ${t.bubbleIntro(Math.min(lines.length, SLOTS.length))} ${bubbleSpec}`,
    `Every ${container} MUST contain all of the lines given for it — never leave one empty, never omit a smaller second line, never put text beside the wrong drawing, and never repeat the same object anywhere in the poster.`,
    `Copy every Bulgarian string CHARACTER-BY-CHARACTER exactly as written above — do not translate, transliterate, autocorrect, drop or invent any letter, and do not add extra words. Never hyphenate a word or split it across two lines: if a word is long, make its ${container} wider or set that text smaller so it fits on a single line.`,
    "All lettering must be clean, evenly spaced and clearly legible at print size, integrated naturally as part of the illustration.",
    "Vertical portrait poster, 2:3. No signature, no logo, no watermark. High detail, 4K, professional print quality.",
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * OpenAI gpt-image-1 with the subject's photo as reference (images.edit).
 *
 * The strongest illustrator of the two providers — best identity preservation
 * and the richest scenes — which is why it stays the default even though the
 * app, not the model, now sets the type. Whether it is asked for a finished
 * poster or a text-free illustration is AI_TEXT_MODE's call, not the provider's.
 */
class OpenAIProvider implements AIImageProvider {
  private static readonly MAX_ATTEMPTS = 4;
  private static readonly RETRYABLE = new Set([429, 500, 502, 503]);

  async generate(req: GenerationRequest): Promise<Buffer> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

    const png = await sharp(req.photo).rotate().png().toBuffer();
    let lastError = "";

    for (let attempt = 1; attempt <= OpenAIProvider.MAX_ATTEMPTS; attempt++) {
      const form = new FormData();
      form.append("model", "gpt-image-1");
      form.append("image[]", new Blob([new Uint8Array(png)], { type: "image/png" }), "child.png");
      form.append("prompt", aiBakesText() ? buildPosterPrompt(req) : buildPrompt(req));
      form.append("size", "1024x1536");
      // Quality drives cost: high ≈ 3x medium. The fallback matches the
      // DEFAULT_SETTINGS value in lib/settings.ts — keep the two in step.
      form.append("quality", req.quality || process.env.AI_QUALITY || "medium");

      let res: Response;
      try {
        res = await fetch("https://api.openai.com/v1/images/edits", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}` },
          body: form,
        });
      } catch (err) {
        lastError = err instanceof Error ? err.message : "network error";
        await OpenAIProvider.backoff(attempt);
        continue;
      }

      if (res.ok) {
        const json = (await res.json()) as { data: { b64_json: string }[] };
        const b64 = json.data?.[0]?.b64_json;
        if (b64) return sharp(Buffer.from(b64, "base64")).png().toBuffer();
        lastError = "empty response";
      } else {
        lastError = `HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`;
        if (!OpenAIProvider.RETRYABLE.has(res.status)) {
          throw new Error(`AI generation failed (${lastError})`);
        }
      }

      if (attempt < OpenAIProvider.MAX_ATTEMPTS) await OpenAIProvider.backoff(attempt);
    }

    throw new Error(`AI generation failed after retries (${lastError})`);
  }

  private static backoff(attempt: number): Promise<void> {
    const delay = 1500 * 2 ** (attempt - 1) + Math.random() * 500;
    return new Promise((resolve) => setTimeout(resolve, delay));
  }
}

/**
 * Google Gemini image model ("Nano Banana", gemini-2.5-flash-image) via the
 * Generative Language REST API. Strong at identity-preserving image-to-image:
 * the child's photo is sent as reference alongside the illustration prompt.
 */
class GeminiProvider implements AIImageProvider {
  private static readonly MAX_ATTEMPTS = 5;
  // The image model is frequently overloaded (503) — these are transient.
  private static readonly RETRYABLE = new Set([429, 500, 503]);
  // finishReason values that mean "retrying won't help" — a real content block.
  private static readonly SAFETY_STOPS = new Set([
    "SAFETY",
    "IMAGE_SAFETY",
    "PROHIBITED_CONTENT",
    "RECITATION",
    "BLOCKLIST",
  ]);

  async generate(req: GenerationRequest): Promise<Buffer> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");
    const model = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";

    const png = await sharp(req.photo)
      .rotate()
      .resize({ width: 1024, withoutEnlargement: true })
      .png()
      .toBuffer();

    const body = JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            { text: buildPrompt(req) },
            { inline_data: { mime_type: "image/png", data: png.toString("base64") } },
          ],
        },
      ],
      generationConfig: { responseModalities: ["IMAGE"] },
    });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    let lastError = "";

    for (let attempt = 1; attempt <= GeminiProvider.MAX_ATTEMPTS; attempt++) {
      let res: Response;
      try {
        res = await fetch(url, {
          method: "POST",
          // Key travels in a header, never in the URL.
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body,
        });
      } catch (err) {
        lastError = err instanceof Error ? err.message : "network error";
        await GeminiProvider.backoff(attempt);
        continue;
      }

      if (!res.ok) {
        lastError = `HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`;
        if (GeminiProvider.RETRYABLE.has(res.status) && attempt < GeminiProvider.MAX_ATTEMPTS) {
          await GeminiProvider.backoff(attempt);
          continue;
        }
        throw new Error(`Gemini generation failed (${lastError})`);
      }

      const json = (await res.json()) as {
        candidates?: {
          finishReason?: string;
          content?: {
            parts?: { inlineData?: { data?: string }; inline_data?: { data?: string } }[];
          };
        }[];
        promptFeedback?: { blockReason?: string };
      };

      const candidate = json.candidates?.[0];
      for (const part of candidate?.content?.parts ?? []) {
        const data = part.inlineData?.data ?? part.inline_data?.data;
        if (data) {
          // Normalize to PNG so downstream compositing is format-agnostic.
          return sharp(Buffer.from(data, "base64")).png().toBuffer();
        }
      }

      // 200 but no image: safety block is terminal; anything else may be a transient hiccup.
      const reason = candidate?.finishReason ?? json.promptFeedback?.blockReason ?? "unknown";
      if (GeminiProvider.SAFETY_STOPS.has(reason)) {
        throw new Error(`Gemini blocked the image (${reason})`);
      }
      lastError = `no image returned (finishReason: ${reason})`;
      if (attempt < GeminiProvider.MAX_ATTEMPTS) {
        await GeminiProvider.backoff(attempt);
        continue;
      }
    }

    throw new Error(`Gemini generation failed after retries (${lastError})`);
  }

  private static backoff(attempt: number): Promise<void> {
    // 1.2s, 2.4s, 4.8s, 9.6s + jitter — within the route's 120s budget.
    const delay = 1200 * 2 ** (attempt - 1) + Math.random() * 400;
    return new Promise((resolve) => setTimeout(resolve, delay));
  }
}

/**
 * Dev provider: renders a soft gradient poster locally so the full
 * order flow works without an AI key. Swap via AI_PROVIDER env.
 */
class MockProvider implements AIImageProvider {
  async generate(req: GenerationRequest): Promise<Buffer> {
    const styleMeta = STYLES.find((s) => s.id === req.style);
    const hueA = styleMeta?.id === "watercolor" ? "#cdb4f6" : "#ffd6c9";
    const hueB = styleMeta?.id === "disney" ? "#bde3ff" : "#ffe9b8";

    const svg = `<svg width="1024" height="1536" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${hueA}"/>
          <stop offset="100%" stop-color="${hueB}"/>
        </linearGradient>
      </defs>
      <rect width="1024" height="1536" fill="url(#g)"/>
      <circle cx="512" cy="820" r="260" fill="#ffffff" opacity="0.5"/>
      <circle cx="512" cy="740" r="130" fill="#ffffff" opacity="0.8"/>
      <ellipse cx="512" cy="1030" rx="200" ry="150" fill="#ffffff" opacity="0.8"/>
    </svg>`;

    return sharp(Buffer.from(svg)).png().toBuffer();
  }
}

let provider: AIImageProvider | null = null;

export function aiProvider(): AIImageProvider {
  if (!provider) {
    const p = process.env.AI_PROVIDER;
    provider =
      p === "gemini"
        ? new GeminiProvider()
        : p === "openai"
          ? new OpenAIProvider()
          : new MockProvider();
  }
  return provider;
}
