import "server-only";
import sharp from "sharp";

/**
 * Turns a photograph of a child into a written character sheet.
 *
 * This is what makes a book look like one child rather than twenty cousins.
 * The image models have no memory between calls, so page seven knows nothing
 * about page six; the only thing that carries a face across twenty
 * illustrations is a description repeated in every single prompt.
 *
 * It is a deliberate sibling of `describe-photo.ts`, not a replacement. That
 * one answers "is this photo usable, and what is in it" for a single poster.
 * This one answers "what does this specific child look like, in words another
 * model can draw from", which needs different questions and a different shape.
 */

export interface CharacterSheet {
  /** One paragraph an illustrator could work from. The prompt spends this. */
  appearance: string;
  hair: string;
  eyes: string;
  /** Face shape and any distinctive features. */
  face: string;
  /** What they are wearing in the photo — a starting point, not a uniform. */
  clothing: string;
  /** False when the reading could not run; callers must not treat that as
   *  "featureless child" — see describe-photo.ts for the same discipline. */
  checked: boolean;
}

const UNCHECKED: CharacterSheet = {
  appearance: "",
  hair: "",
  eyes: "",
  face: "",
  clothing: "",
  checked: false,
};

/** Long enough for a careful reading, short enough not to stall an upload. */
const TIMEOUT_MS = 20_000;

const SCHEMA_HINT = `{
  "appearance": "one flowing paragraph in ENGLISH describing this child so another artist could draw them without seeing the photo",
  "hair": "colour, length, texture, how it falls",
  "eyes": "colour and shape",
  "face": "face shape, cheeks, nose, mouth, any freckles or distinctive marks",
  "clothing": "what they are wearing in this photo"
}`;

/**
 * Never throws. A book with a weaker character sheet is worth far more than an
 * upload that fails, and the caller can see `checked: false` and decide.
 */
export async function readCharacter(photo: Buffer): Promise<CharacterSheet> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return UNCHECKED;

  let b64: string;
  try {
    // Downscaled before sending: the vision model gains nothing from a 4000px
    // photograph and the upload is the slow part of this call.
    const small = await sharp(photo)
      .rotate()
      .resize({ width: 768, withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();
    b64 = small.toString("base64");
  } catch {
    return UNCHECKED;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: process.env.BOOK_VISION_MODEL || "gpt-4.1-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You describe how a child looks so an illustrator can draw them consistently. You never guess at anything not visible, never mention names, and always answer with a single JSON object.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Describe the main child in this photograph for an illustrator. Answer in ENGLISH, as JSON in this shape:\n${SCHEMA_HINT}`,
              },
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${b64}` },
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) return UNCHECKED;

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = json.choices?.[0]?.message?.content;
    if (!raw) return UNCHECKED;

    const parsed = JSON.parse(raw) as Partial<CharacterSheet>;
    if (!parsed.appearance) return UNCHECKED;

    return {
      appearance: String(parsed.appearance).slice(0, 900),
      hair: String(parsed.hair ?? "").slice(0, 200),
      eyes: String(parsed.eyes ?? "").slice(0, 200),
      face: String(parsed.face ?? "").slice(0, 300),
      clothing: String(parsed.clothing ?? "").slice(0, 200),
      checked: true,
    };
  } catch {
    return UNCHECKED;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * The single line every page prompt carries.
 *
 * Kept short on purpose: the page prompt already repeats one of these per
 * character, and a full paragraph each turns a four-child book's prompt into
 * something the image model starts ignoring the end of.
 */
export function sheetForPrompt(sheet: CharacterSheet | null): string {
  if (!sheet?.checked) return "";
  return [sheet.appearance, sheet.hair, sheet.eyes, sheet.face]
    .filter(Boolean)
    .join(" ")
    .slice(0, 600);
}
