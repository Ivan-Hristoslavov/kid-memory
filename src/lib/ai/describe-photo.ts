import "server-only";
import sharp from "sharp";

/**
 * Reads the uploaded photo before anything is generated, and answers two
 * questions the rest of the pipeline cannot answer for itself.
 *
 * First: what does this person actually look like? The image model is handed
 * the photo and told to keep the likeness, but "keep the likeness" is the whole
 * of the instruction — nothing in the prompt names the face shape, the eye
 * colour or the parting of the hair. Written-out features survive the trip into
 * the illustration far better than an implicit reference does, so a vision model
 * puts them into words first and `buildPrompt` spends them.
 *
 * Second: is this photo usable at all? The upload route already rejects images
 * that are too small and warns about blur and exposure, but it measures pixels,
 * not faces — a sharp, bright, correctly sized photo of the back of someone's
 * head passes every mechanical check and then costs a paid generation. Only
 * hard failures block: a photo nobody could work from. Dim light, a busy
 * background or a slightly small face are the normal case for a phone snapshot
 * of a toddler and must never turn a customer away.
 *
 * The check is advisory by construction. If the key is missing, the API errors,
 * the model returns nonsense or the call hangs, this returns `checked: false`
 * and the upload proceeds exactly as it did before. A broken vision endpoint
 * must never stop the shop from taking orders.
 */

/** Reasons a photo cannot produce a usable poster no matter how well it is drawn. */
export type PhotoBlocker = "NO_FACE" | "FACE_OBSCURED" | "SEVERE_BLUR";

/**
 * One subject found in the photo.
 *
 * Deliberately positional and nameless. The wizard collects names as "№ 1" and
 * "№ 2" without ever asking which one stands on the left, so binding "Мила" to
 * the leftmost face would be a guess — and a guess that, when wrong, prints a
 * sibling's hair colour on the wrong child. Position is what the photo actually
 * tells us, so position is all this claims.
 */
export interface PhotoSubjectDescription {
  /** "leftmost" | "centre" | "rightmost" etc. — always in left-to-right order. */
  position: string;
  kind: "child" | "adult" | "baby" | "pet";
  /** Face shape, eyes, eyebrows, nose, mouth, skin tone, distinctive marks. */
  features: string;
  hair: string;
  clothing: string;
  /** Null rather than "none", so the prompt builder can simply skip it. */
  glasses: string | null;
}

export interface PhotoDescription {
  /** How many subjects the reader found. Drives the wizard's count warning. */
  faces: number;
  subjects: PhotoSubjectDescription[];
  /** Non-empty means the upload should be refused. */
  blockers: PhotoBlocker[];
  /**
   * False when the check could not run (no key, API error, bad JSON, timeout).
   * Callers must treat this as "no information", never as "photo is fine but
   * featureless" — the difference decides whether a poster is blocked.
   */
  checked: boolean;
}

const UNCHECKED: PhotoDescription = {
  faces: 0,
  subjects: [],
  blockers: [],
  checked: false,
};

/**
 * A vision call cannot be allowed to hold an upload open. The customer is
 * staring at a spinner on step one, and a slow answer is worth less than a fast
 * upload with no description at all.
 */
const TIMEOUT_MS = 15_000;

/** Beyond this the photo is a crowd, not a poster subject list. */
const MAX_SUBJECTS = 6;

/** Long enough for a full set of features, short enough to bound the prompt. */
const MAX_FIELD_CHARS = 220;

const VALID_BLOCKERS = new Set<PhotoBlocker>(["NO_FACE", "FACE_OBSCURED", "SEVERE_BLUR"]);
const VALID_KINDS = new Set(["child", "adult", "baby", "pet"]);

const DESCRIBE_PROMPT = [
  "You are preparing reference notes for an illustrator who will draw the subjects of this photo from your description alone.",
  "Describe ONLY what is visibly present. Never infer, assume or flatter.",
  "List every person or animal in the photo in left-to-right order as they appear.",
  "For each one describe: face shape, eyes (colour, shape, size), eyebrows, nose, mouth and smile, skin tone, and any freckles, moles, dimples or scars; hair colour, length and style; visible clothing; and glasses if worn.",
  "Be specific about colour and proportion. Write plain descriptive noun phrases, not sentences and not instructions.",
  "Then judge whether the photo can produce a good likeness at all.",
  'Report a blocker ONLY for a hard failure: "NO_FACE" if no face is visible at all, "FACE_OBSCURED" if a face is substantially hidden by a mask, hand, sunglasses or heavy shadow, "SEVERE_BLUR" if the features cannot be made out.',
  "Dim lighting, a busy background, an unusual angle or a small face are NOT blockers — report an empty list for those.",
  'Reply with JSON only: {"subjects":[{"position":"leftmost","kind":"child|adult|baby|pet","features":"...","hair":"...","clothing":"...","glasses":"..."|null}],"blockers":["..."]}',
].join(" ");

/**
 * Model-written text on its way into another model's prompt.
 *
 * Whatever comes back is concatenated into the image-generation instruction, so
 * it is treated as untrusted: newlines and control characters are flattened so
 * nothing can look like a new instruction line, quoting characters that could
 * close our own quoted sections are dropped, and the whole thing is capped.
 */
function clean(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/[„“”"'`{}<>\\]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_FIELD_CHARS);
}

function toSubject(raw: unknown, index: number, total: number): PhotoSubjectDescription | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  const features = clean(r.features);
  const hair = clean(r.hair);
  // A subject with neither a face nor hair described carries nothing the
  // illustration prompt can use, and an empty slot would still inflate the
  // count the wizard checks against.
  if (!features && !hair) return null;

  const kindRaw = clean(r.kind).toLowerCase();
  const glasses = clean(r.glasses);

  return {
    // A lone subject has no left or right, whatever the reader called it —
    // "leftmost" on a single face reads as though someone were cropped out.
    position: total === 1 ? "centre" : clean(r.position) || fallbackPosition(index, total),
    kind: (VALID_KINDS.has(kindRaw) ? kindRaw : "adult") as PhotoSubjectDescription["kind"],
    features,
    hair,
    clothing: clean(r.clothing),
    // "none" and "no glasses" both mean the same absence; normalise so the
    // prompt builder never writes "glasses: none" into the instruction.
    glasses: glasses && !/^(none|no glasses|not visible|n\/a)$/i.test(glasses) ? glasses : null,
  };
}

/** Used when the model omits the position it was asked for. */
function fallbackPosition(index: number, total: number): string {
  if (total === 1) return "centre";
  if (index === 0) return "leftmost";
  if (index === total - 1) return "rightmost";
  return `${index + 1} from the left`;
}

/**
 * Describes the photo and judges whether it is usable.
 *
 * Never throws: every failure path returns `checked: false`.
 */
export async function describePhoto(photo: Buffer): Promise<PhotoDescription> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return UNCHECKED;

  // Faces need more detail than the proofreader's line of text does, but not
  // print resolution — 1024px keeps eye colour and hairline readable while the
  // request stays billed as one image.
  let jpeg: Buffer;
  try {
    jpeg = await sharp(photo)
      .rotate()
      .resize({ width: 1024, withoutEnlargement: true })
      .jpeg({ quality: 88 })
      .toBuffer();
  } catch {
    return UNCHECKED;
  }

  const abort = AbortSignal.timeout(TIMEOUT_MS);

  let parsed: { subjects?: unknown; blockers?: unknown };
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      signal: abort,
      body: JSON.stringify({
        model: process.env.AI_VISION_MODEL || "gpt-4o-mini",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: DESCRIBE_PROMPT },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${jpeg.toString("base64")}`,
                  detail: "high",
                },
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      console.error("Photo description failed:", res.status, (await res.text()).slice(0, 200));
      return UNCHECKED;
    }

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    parsed = JSON.parse(json.choices?.[0]?.message?.content ?? "{}");
  } catch (err) {
    console.error("Photo description error:", err instanceof Error ? err.message : err);
    return UNCHECKED;
  }

  const rawSubjects = Array.isArray(parsed.subjects) ? parsed.subjects.slice(0, MAX_SUBJECTS) : [];
  const subjects = rawSubjects
    .map((s, i) => toSubject(s, i, rawSubjects.length))
    .filter((s): s is PhotoSubjectDescription => s !== null);

  const blockers = (Array.isArray(parsed.blockers) ? parsed.blockers : [])
    .map((b) => String(b).toUpperCase().trim())
    .filter((b): b is PhotoBlocker => VALID_BLOCKERS.has(b as PhotoBlocker));

  // A reader that found nobody but named no blocker has still told us the photo
  // has no usable subject — treat it as NO_FACE rather than letting a blank
  // description through as if the photo were fine.
  if (!subjects.length && !blockers.includes("NO_FACE")) {
    blockers.push("NO_FACE");
  }

  return {
    faces: subjects.length,
    subjects,
    blockers: [...new Set(blockers)],
    checked: true,
  };
}

/**
 * Where a photo's description is stored: beside the photo, same name, `.json`.
 *
 * Derived rather than recorded so an order that only kept `photoKey` — every
 * order placed before this existed — can still be asked for its description
 * without a lookup table.
 */
export function sidecarKey(photoKey: string): string {
  return photoKey.replace(/\.[^./]+$/, "") + ".json";
}

/**
 * Loads the description written at upload time.
 *
 * Returns null for every miss: photos uploaded before this feature existed have
 * no sidecar, and a photo whose vision call failed never got one. Callers fall
 * back to the generic identity lock, which is what the shop did until now.
 */
export async function readPhotoDescription(photoKey: string): Promise<PhotoDescription | null> {
  const { storage } = await import("@/lib/storage");
  try {
    const raw = await storage().get(sidecarKey(photoKey));
    return coercePhotoDescription(JSON.parse(raw.toString("utf8")));
  } catch {
    return null;
  }
}

/**
 * Validates a stored description back into shape — from the sidecar, or from
 * the `photoDescription` column on an order.
 *
 * Re-validated rather than trusted. The stored copy is ours, but it is still
 * model-written text heading into a prompt, and a row written by an older
 * version of this file may not match the current shape.
 */
export function coercePhotoDescription(value: unknown): PhotoDescription | null {
  if (!value || typeof value !== "object") return null;
  const raw = (value as { subjects?: unknown }).subjects;
  const list = Array.isArray(raw) ? raw.slice(0, MAX_SUBJECTS) : [];
  const subjects = list
    .map((s, i) => toSubject(s, i, list.length))
    .filter((s): s is PhotoSubjectDescription => s !== null);
  if (!subjects.length) return null;
  return { faces: subjects.length, subjects, blockers: [], checked: true };
}

/**
 * The reference-features block spent by the image prompt.
 *
 * Returns an empty string whenever there is nothing trustworthy to say, so
 * callers can drop it into a prompt array and let the existing `.filter(Boolean)`
 * remove it.
 */
export function describeForPrompt(description: PhotoDescription | null | undefined): string {
  if (!description?.checked || !description.subjects.length) return "";

  const parts = description.subjects.map((s, i) => {
    const bits = [s.features, s.hair && `hair: ${s.hair}`, s.clothing && `wearing ${s.clothing}`, s.glasses && `glasses: ${s.glasses}`]
      .filter(Boolean)
      .join("; ");
    return `Subject ${i + 1} (${s.position}): ${bits}.`;
  });

  return [
    "REFERENCE FEATURES observed in the uploaded photo — reproduce these exactly, they describe the real subjects and override any generic assumption:",
    ...parts,
  ].join(" ");
}
