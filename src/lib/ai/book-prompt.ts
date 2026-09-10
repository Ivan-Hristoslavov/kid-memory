import "server-only";
import { STORY_PAGE_COUNT } from "@/lib/books/catalog";

/**
 * Everything the models are told about a book. Server-only, like
 * `ai/template-prompt.ts` — prompts in a client module ship to every browser
 * and can be rewritten in devtools, which for an image pipeline is an
 * injection route into our own generations.
 */

/** What each art style means to the illustrator. */
export const BOOK_STYLE_PROMPTS: Record<string, string> = {
  SOFT: "a soft modern children's-book illustration — rounded gentle shapes, warm muted palette, flat shading with light texture, friendly and calm",
  WATERCOLOR: "a hand-painted watercolour children's illustration — soft washes, visible paper grain, gentle bleeding edges, delicate and airy",
  STORYBOOK: "a richly coloured classic storybook illustration — saturated but harmonious colour, detailed backgrounds, painterly light",
  ANIMATED_3D:
    "a polished 3D-animated feature-film look — soft rounded volumes, expressive eyes, subsurface skin shading, gentle cinematic lighting",
  CLASSIC:
    "a classic mid-century children's book illustration — confident ink linework, limited flat colour palette, textured paper feel",
};

/** How the story should read at each age. */
export const AGE_PROMPTS: Record<string, string> = {
  AGE_3_5:
    "for a 3–5 year old: very short sentences, simple everyday words, plenty of repetition and sound words, roughly 20–35 words per page",
  AGE_5_7:
    "for a 5–7 year old just starting to read alone: short clear sentences, a slightly wider vocabulary, roughly 35–55 words per page",
  AGE_7_9:
    "for a 7–9 year old: fuller sentences, richer vocabulary, more cause and consequence, roughly 55–80 words per page",
};

export const MOOD_PROMPTS: Record<string, string> = {
  FUNNY: "playful and funny, with small comic mishaps and a light touch",
  MAGICAL: "wondrous and gently magical, full of quiet marvels",
  ADVENTUROUS: "adventurous and brave, with real but never frightening stakes",
  CALM: "calm and soothing, paced for bedtime, ending in sleep",
  EDUCATIONAL: "quietly educational — the children learn something by doing, never by being lectured",
};

export const ADVENTURE_PROMPTS: Record<string, string> = {
  MAGIC_FOREST: "a magical forest where the trees speak and fireflies show the way",
  DINOSAURS: "a world of dinosaurs, with enormous footprints and one very friendly young dinosaur",
  SPACE: "a space adventure — a small rocket, star dust, and a planet nobody has seen",
  KINGDOM: "a magical kingdom with a castle, a hidden corridor and a crown that must be returned",
  DRAGONS: "a dragon who is afraid of his own fire and needs help",
  UNDERWATER: "an underwater world — a coral city and one lost pearl",
  PIRATES: "a pirate adventure — a map, a compass that points wrong, and an island with a surprise",
  ANIMALS: "a forest full of animal friends, each with a distinct character",
  CHRISTMAS: "a Christmas adventure — a lost present and a very long sleigh ride",
  BEDTIME: "a quiet bedtime story that ends with everyone falling asleep",
};

export interface CharacterBrief {
  name: string;
  age?: number | null;
  gender?: "BOY" | "GIRL" | null;
  /** The parent's own words about the child. */
  description?: string | null;
  interests?: string | null;
  favouriteToy?: string | null;
  favouriteAnimal?: string | null;
  /** The written appearance sheet produced from the photo. */
  appearance?: string | null;
}

export interface StoryBrief {
  characters: CharacterBrief[];
  /** How the children relate to one another, in the parent's words. */
  relationships?: string | null;
  adventure: string;
  customIdea?: string | null;
  ageGroup: string;
  mood: string;
  mustInclude: string[];
  dedication?: string | null;
}

function describeCharacter(c: CharacterBrief): string {
  return [
    `${c.name}`,
    typeof c.age === "number" ? `aged ${c.age}` : null,
    c.gender === "GIRL" ? "a girl" : c.gender === "BOY" ? "a boy" : null,
    c.appearance ? `who looks like this: ${c.appearance}` : null,
    c.description ? `The parent describes them: "${c.description}"` : null,
    c.interests ? `Interests: ${c.interests}.` : null,
    c.favouriteToy ? `Favourite toy: ${c.favouriteToy}.` : null,
    c.favouriteAnimal ? `Favourite animal: ${c.favouriteAnimal}.` : null,
  ]
    .filter(Boolean)
    .join(", ");
}

/**
 * The story prompt.
 *
 * Asks for structured JSON rather than prose, because the pages have to be
 * split, stored, illustrated and re-generated one at a time — parsing a wall of
 * text back into pages is guesswork that fails on the first story that uses a
 * blank line for effect.
 *
 * The most important instruction is the one about the children being the
 * protagonists. Given only names, these models reliably produce a story about
 * a generic child that mentions the names twice, which is exactly the thing a
 * parent would notice and resent.
 */
export function buildStoryPrompt(brief: StoryBrief): string {
  const n = brief.characters.length;
  const custom = brief.customIdea?.trim();

  return [
    `Write a complete, original children's picture-book story in BULGARIAN, in ${STORY_PAGE_COUNT} pages.`,
    `The ${n === 1 ? "hero" : "heroes"} are real ${n === 1 ? "a real child" : `${n} real children`}: ${brief.characters
      .map(describeCharacter)
      .join(" — and — ")}.`,
    n > 1 && brief.relationships
      ? `How they relate to each other, in their parent's words: "${brief.relationships}". Let this shape who leads, who worries, who makes things happen — do not merely restate it.`
      : "",
    `THEY ARE THE PROTAGONISTS. Their names, their traits and the things they love must drive what happens — decisions, mistakes, the solution. A story about a generic child that merely mentions their names is a failure.`,
    custom
      ? `The parent has asked for this specific story: "${custom}". Follow it closely; it outranks the theme below.`
      : `Setting and theme: ${ADVENTURE_PROMPTS[brief.adventure] ?? ADVENTURE_PROMPTS.MAGIC_FOREST}.`,
    `Tone: ${MOOD_PROMPTS[brief.mood] ?? MOOD_PROMPTS.MAGICAL}.`,
    `Language level: ${AGE_PROMPTS[brief.ageGroup] ?? AGE_PROMPTS.AGE_5_7}.`,
    brief.mustInclude.length
      ? `These must genuinely appear in the story, not as a passing mention: ${brief.mustInclude.join(", ")}.`
      : "",
    `Structure it as a real story: an opening that sets up ordinary life, something that changes it, a rising difficulty, a climax where the ${
      n === 1 ? "child solves" : "children solve"
    } it themselves, and a warm ending. Do not resolve it with an adult arriving to help.`,
    `Bulgarian must be natural and correct — this is read aloud by a parent. No transliteration, no anglicisms, no rhyming unless it stays effortless.`,
    "",
    "Return ONLY valid JSON, no markdown fence, in exactly this shape:",
    `{"title": "...", "subtitle": "...", "pages": [{"pageNumber": 1, "text": "...", "imagePrompt": "..."}]}`,
    `- "title" is the book's title in Bulgarian, short enough for a cover.`,
    `- "subtitle" is one short Bulgarian line under it, or "".`,
    `- exactly ${STORY_PAGE_COUNT} pages, numbered 1 to ${STORY_PAGE_COUNT}.`,
    `- "text" is the Bulgarian page text.`,
    `- "imagePrompt" is IN ENGLISH and describes only what is visible on that page: who is present, what they are doing, where, and the light. Name the characters by name so the illustrator can match them to their reference. Never describe text, lettering or speech bubbles — the words are set by the app, not drawn.`,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * One page's illustration.
 *
 * The character sheets are repeated on EVERY page, which is the whole reason a
 * book looks like one child rather than twenty cousins. It is verbose and it is
 * the point: these models have no memory between calls, so anything not
 * restated is re-invented.
 */
export function buildPageImagePrompt(args: {
  imagePrompt: string;
  characters: CharacterBrief[];
  style: string;
}): string {
  const sheets = args.characters
    .map((c) =>
      `${c.name}: ${c.appearance ?? "a child"}${
        typeof c.age === "number" ? `, aged ${c.age}` : ""
      }.`
    )
    .join(" ");

  return [
    `A single illustration for one page of a children's picture book.`,
    `Scene: ${args.imagePrompt}`,
    `CHARACTER CONSISTENCY — these are the same characters throughout the book and must look identical on every page: ${sheets}`,
    `Keep each character's face, hair, build and clothing exactly as described, in every scene, from any angle.`,
    `Art direction, identical across the whole book: ${
      BOOK_STYLE_PROMPTS[args.style] ?? BOOK_STYLE_PROMPTS.SOFT
    }.`,
    `Full-bleed horizontal illustration. Leave the lower third calmer and less detailed — the page text is composited there afterwards.`,
    `Do NOT draw any text, letters, numbers, captions, speech bubbles or signatures anywhere, in any language.`,
    `Warm, safe and age-appropriate. No frightening imagery.`,
  ].join(" ");
}
