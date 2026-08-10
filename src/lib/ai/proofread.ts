import "server-only";
import sharp from "sharp";
import { DEFAULT_TEMPLATE, MAX_POSTER_LINES, type PosterSubject, type TemplateId } from "@/lib/templates";
import { TEMPLATE_PROMPTS } from "./template-prompt";

/**
 * Reads the finished poster back and checks the Bulgarian actually printed on
 * it against the Bulgarian the customer typed.
 *
 * The image model letters the poster because nothing the app draws looks as
 * integrated — but it renders words as pixels it believes look like letters,
 * and Cyrillic ъ, щ and я come back malformed often enough to reach a framed
 * print. It cannot be instructed out of that; it can only be caught. So a
 * vision model transcribes the poster and the comparison happens here, in code,
 * against the exact strings on the order.
 *
 * Deliberately a blind transcription: handing the model the expected wording
 * and asking "does this match?" primes it to agree, and it will read a broken
 * glyph as the word it was told to expect. It is asked only what it sees.
 */

export interface ProofResult {
  /** False when the transcription ran and something is missing or misspelled. */
  ok: boolean;
  /** Expected strings that were not found printed correctly. */
  missing: string[];
  /** Fraction of expected strings found, 0–1. Picks the best of several tries. */
  score: number;
  /** What the reader saw, kept for the admin so a dispute is checkable. */
  transcript: string[];
  /**
   * False when the check could not run at all (no key, API error, bad model).
   * A broken proofreader must never block an order or spend money retrying —
   * the poster ships and the admin is told it went out unverified.
   */
  checked: boolean;
}

/**
 * Every string the poster is supposed to show, in the order it appears.
 * Mirrors what `buildPosterPrompt` asks the model to letter.
 */
export function expectedStrings(
  template: TemplateId,
  subjects: PosterSubject[],
  year = new Date().getFullYear()
): string[] {
  const t = TEMPLATE_PROMPTS[template] ?? TEMPLATE_PROMPTS[DEFAULT_TEMPLATE];
  const [pre, post] = t.subAffix;
  const perSubject = Math.max(1, Math.floor(MAX_POSTER_LINES / Math.max(subjects.length, 1)));

  const out = [t.title(subjects)];
  const subtitle = t.subtitle(subjects, year);
  if (subtitle) out.push(subtitle);

  for (const line of subjects.flatMap((s) => s.lines.slice(0, perSubject)).slice(0, MAX_POSTER_LINES)) {
    out.push(line.text);
    if (line.sub) out.push(`${pre}${line.sub}${post}`);
  }
  return out;
}

/**
 * Latin letters that are drawn identically to a Cyrillic one. A transcriber
 * mixing the two says nothing about the poster — the shapes on the paper are
 * the same — so they are folded together before comparing. Genuine defects
 * (а vs ъ, щ vs ш) survive this, which is the point.
 */
const HOMOGLYPHS: Record<string, string> = {
  a: "а", e: "е", o: "о", p: "р", c: "с", y: "у", x: "х", k: "к",
  m: "м", t: "т", b: "в", h: "н", i: "и", j: "ј", s: "ѕ", n: "п",
};

function normalize(s: string): string {
  return [...s.toLowerCase().normalize("NFC")]
    .map((ch) => HOMOGLYPHS[ch] ?? ch)
    .join("")
    .replace(/[„“”"'`‘’()[\]{}·•—–\-.,!?:;]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const TRANSCRIBE_PROMPT = [
  "Transcribe every piece of text printed on this poster, exactly as it appears.",
  "Copy character by character, including any misspelling, missing letter or malformed letter.",
  "Do NOT correct, translate, complete or guess any word — if a word looks wrong or broken, write it wrong or broken exactly as drawn.",
  "If a letter is unreadable, write ? in its place.",
  'Reply with JSON only: {"lines": ["...", "..."]}, one entry per visual line of text, top to bottom.',
].join(" ");

export async function proofreadPoster(poster: Buffer, expected: string[]): Promise<ProofResult> {
  const empty: ProofResult = { ok: true, missing: [], score: 1, transcript: [], checked: false };
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !expected.length) return empty;

  // Downscaled: the lettering stays legible well below print size, and the
  // request is billed by image tokens.
  const jpeg = await sharp(poster).resize({ width: 1024, withoutEnlargement: true }).jpeg({ quality: 88 }).toBuffer();

  let transcript: string[];
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.AI_PROOF_MODEL || "gpt-4o-mini",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: TRANSCRIBE_PROMPT },
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${jpeg.toString("base64")}`, detail: "high" },
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      console.error("Proofread failed:", res.status, (await res.text()).slice(0, 200));
      return empty;
    }

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const parsed = JSON.parse(json.choices?.[0]?.message?.content ?? "{}") as { lines?: unknown };
    transcript = Array.isArray(parsed.lines) ? parsed.lines.map(String) : [];
  } catch (err) {
    console.error("Proofread error:", err instanceof Error ? err.message : err);
    return empty;
  }

  // Matched against the joined transcription as well as line by line, because
  // the poster may wrap one of our strings across two visual lines.
  const lines = transcript.map(normalize).filter(Boolean);
  const joined = lines.join(" ");
  const missing = expected.filter((want) => {
    const n = normalize(want);
    return !n || (!lines.includes(n) && !joined.includes(n));
  });

  return {
    ok: missing.length === 0,
    missing,
    score: (expected.length - missing.length) / expected.length,
    transcript,
    checked: true,
  };
}
