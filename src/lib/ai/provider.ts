import "server-only";
import sharp from "sharp";
import { STYLES } from "@/lib/catalog";

/**
 * AI poster generation. With gpt-image-1 the model renders the COMPLETE poster —
 * illustration + hand-lettered title + speech bubbles — all baked in, so the
 * text and art share one cohesive style (ChatGPT-quality result).
 */
export interface PosterChild {
  name: string;
  age: number;
  gender: "BOY" | "GIRL";
  words: { word: string; saidAs: string; visual?: string }[];
}

export interface GenerationRequest {
  photo: Buffer;
  children: PosterChild[]; // 1–3 children (siblings/twins)
  animals: string[]; // animal ids from catalog
  style: string; // style id from catalog
  /** Image quality — set from admin settings; drives cost per poster. */
  quality?: "low" | "medium" | "high";
}

/** "Мила", "Мила и Борис", "Мила, Борис и Ема" */
export function joinNames(names: string[]): string {
  const clean = names.filter(Boolean);
  if (clean.length <= 1) return clean[0] ?? "";
  return `${clean.slice(0, -1).join(", ")} и ${clean.at(-1)}`;
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

/** "1 година", "3 години", "2 години и половина" */
export function formatAge(age: number): string {
  const whole = Math.floor(age);
  const half = age - whole >= 0.5;
  const unit = whole === 1 ? "година" : "години";
  if (whole === 0) return "половин година";
  return half ? `${whole} ${unit} и половина` : `${whole} ${unit}`;
}

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

export function buildPrompt(req: GenerationRequest): string {
  const style = STYLE_PROMPTS[req.style] ?? STYLE_PROMPTS.storybook;
  const animals = req.animals
    .map((a) => ANIMAL_PROMPTS[a])
    .filter(Boolean)
    .join(", ");
  const n = req.children.length;

  return [
    `Transform the uploaded photo of ${n === 1 ? "a real, specific child" : `${n} real, specific children`} into a personalized memory poster illustration. Keep EVERY child that appears in the photo — all ${n}.`,
    "CRITICAL — PHOTOREALISTIC IDENTITY LOCK: render each child with a faithful, high-fidelity, semi-realistic likeness — as if a master portrait artist carefully painted THIS exact child from the photo.",
    "For every child keep the real facial structure and true proportions, real skin tone with natural shading, realistic detailed eyes (exact shape and colour), eyebrows, nose, lips and the exact smile, and the exact hairstyle, hair colour and texture. Keep any hats, clothing and distinguishing features.",
    "Each face must look like a realistic portrait of the actual child — NOT a flat generic cartoon, NOT beautified, averaged or stylized away. A parent must instantly recognise their own children at a glance.",
    `Render the surrounding world, background, lighting and props in this art direction, while keeping the children's faces realistic and true to the photo: ${style}.`,
    `Keep the ${n === 1 ? "child" : "children"} as the clear main hero(es): together, front and centre, facing the viewer, natural pose.`,
    animals
      ? `Add these as charming, richly detailed companion characters around the children (they must NOT replace or cover the children): ${animals}.`
      : "",
    (() => {
      const things = req.children
        .flatMap((c) => c.words.map((w) => w.visual).filter(Boolean))
        .slice(0, 8);
      return things.length
        ? `Also include, EXACTLY ONCE each, a small cute cartoon of: ${things.map((t) => `"${t}"`).join(", ")} — evenly spaced around the children, no duplicates.`
        : "";
    })(),
    "Compose as a vertical portrait poster with a lush, detailed scene, real depth and soft cinematic lighting; leave generous empty space near the top and around the margins so wording can be overlaid later by the app.",
    "Do NOT write or draw ANY text, letters, words, numbers, captions, signatures or watermark anywhere — in any language, and ESPECIALLY no Bulgarian / Cyrillic text. Every word is added separately by the app afterwards, so the illustration itself must be completely text-free and never attempt to spell anything.",
    "Rich detail, natural realistic rendering of the children, harmonious colour palette, professional print quality, 4K.",
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

  const n = req.children.length;
  const names = joinNames(req.children.map((c) => c.name));
  const title = `Думичките на ${names}`;

  // The keepsake only works as an archive if it says WHEN. Without an age and a
  // year it is just a picture; with them it dates a phase that lasts months.
  const year = new Date().getFullYear();
  const subtitle =
    n === 1
      ? `${req.children[0].name}, на ${formatAge(req.children[0].age)} · ${year}`
      : `${req.children.map((c) => `${c.name} — ${formatAge(c.age)}`).join(", ")} · ${year}`;

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

  const pairs = req.children.flatMap((c) =>
    c.words.slice(0, 4).map((w) => ({ ...w, owner: c.name }))
  );

  const bubbleSpec = pairs
    .slice(0, SLOTS.length)
    .map((w, i) => {
      const who = n === 1 ? "" : ` (belongs to ${w.owner})`;
      // The drawing sits OUTSIDE the bubble — placing it inside made the model
      // render objects on top of the lettering.
      const art = w.visual
        ? ` Just outside this bubble, touching it but never overlapping any letter, draw exactly one small "${w.visual}", ${objectStyle}. It belongs to bubble ${i + 1} only and must not appear anywhere else in the poster.`
        : " This bubble has no drawing beside it.";
      return `Bubble ${i + 1}, ${SLOTS[i]}${who}: large bold Bulgarian Cyrillic reading \u201e${w.saidAs}\u201c, and directly under it on its own line, in noticeably smaller plain lettering, \u201e(${w.word})\u201c.${art}`;
    })
    .join(" ");

  return [
    `Create a COMPLETE, premium personalized children's memory POSTER featuring all ${n} ${n === 1 ? "child" : "children"} from the photo — a single finished artwork in a warm, richly detailed storybook / comic-book illustration style, like a beautiful children's book cover.`,
    // Toddlers read as ambiguous in photos more often than adults, so state it.
    `The ${n === 1 ? "child is" : "children are"}: ${req.children
      .map((c) => `${c.name} — a ${c.gender === "GIRL" ? "girl" : "boy"} aged ${c.age}`)
      .join("; ")}.`,
    `IDENTITY LOCK: use the uploaded photo as the reference and keep EACH child UNMISTAKABLY recognizable — preserve every child's exact face shape and proportions, skin tone, eye shape and colour, eyebrows, nose, mouth, smile, hairstyle and clothing. Do NOT merge, swap, drop, duplicate or genericise any child. All ${n} children are the heroes, together, front and centre, facing the viewer.`,
    `Whole-scene art style: ${style}. Fill the frame with a lush, richly detailed world (nature, water, sky, soft depth), vibrant harmonious colours and a polished professional poster composition — not empty or sparse.`,
    animals
      ? `Populate the scene with these as expressive, friendly companion characters around the children, ${objectStyle}: ${animals}.`
      : "",
    // Print safe area: the most common defect was the child sliced by the
    // bottom edge, which reads as a printing mistake once the poster is framed.
    "PRINT COMPOSITION — this poster will be printed and framed, so respect a safe area: keep a clean, calm margin of at least 7% of the image height on all four sides. No letter, bubble, face or important detail may touch or cross that margin. The children must sit fully inside the frame: never crop a child at the bottom edge, and leave clear visible space between the lowest part of the children and the bottom of the poster.",
    "Each funny word is the child's own mispronunciation of a real thing. Every bubble therefore shows TWO lines: the funny word large, and the real word small underneath in brackets. That pairing is the whole point of the poster and must never be dropped — without it nobody can tell what the child meant.",
    "BAKE THE TEXT INTO THE ARTWORK, hand-lettered in the same illustration style:",
    `• A decorative TITLE banner across the top reading exactly, in correct Bulgarian Cyrillic: “${title}”.`,
    `• Directly beneath the title, in small elegant lettering: “${subtitle}”.`,
    `• Exactly ${Math.min(pairs.length, SLOTS.length)} comic-style speech bubbles, no more and no fewer. ${bubbleSpec}`,
    "Every bubble MUST contain both of its lines — never leave a bubble empty, never omit the small word in brackets, never put a word beside the wrong drawing, and never repeat the same object anywhere in the poster.",
    "Copy every Bulgarian string CHARACTER-BY-CHARACTER exactly as written above — do not translate, transliterate, autocorrect, drop or invent any letter, and do not add extra words. Never hyphenate a word or split it across two lines: if a word is long, make its bubble wider or set that text smaller so it fits on a single line.",
    "All lettering must be clean, evenly spaced and clearly legible at print size, integrated naturally as part of the illustration.",
    "Vertical portrait poster, 2:3. No signature, no logo, no watermark. High detail, 4K, professional print quality.",
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * OpenAI gpt-image-1 with the child's photo as reference (images.edit).
 * Renders the complete poster with baked-in Bulgarian text — the strongest
 * model for legible in-image lettering.
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
      form.append("prompt", buildPosterPrompt(req));
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
