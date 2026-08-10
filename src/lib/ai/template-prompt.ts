import "server-only";
import { joinNames, type PosterLine, type PosterSubject, type TemplateId } from "@/lib/templates";

/**
 * Per-template prompt language.
 *
 * The poster prompt is one long instruction, and almost all of it is shared:
 * identity lock, art direction, print safe area, bake-the-text rules. Only a
 * few sentences actually differ between a child's poster and a dog's — what the
 * heroes are, what the title says and what a bubble means. Those sentences live
 * here, keyed by template, so `buildPosterPrompt` stays one function instead of
 * five near-copies that drift apart.
 *
 * Server-only: none of this belongs in the client bundle.
 */

/** "1 година", "3 години", "2 години и половина" */
export function formatAge(age: number): string {
  const whole = Math.floor(age);
  const half = age - whole >= 0.5;
  const unit = whole === 1 ? "година" : "години";
  if (whole === 0) return "половин година";
  return half ? `${whole} ${unit} и половина` : `${whole} ${unit}`;
}

/**
 * How the lines are drawn. Speech bubbles imply someone said it, which is wrong
 * for a dog's habits and very wrong for a newborn's birth weight.
 */
export type BubbleKind = "speech" | "caption" | "card";

export interface TemplatePrompt {
  /** English noun for one subject — used throughout the shared prompt. */
  noun: string;
  nounPlural: string;
  /** Opening sentence: what artwork to make. */
  headline: (n: number) => string;
  /** Species-appropriate likeness instruction. */
  identityLock: (n: number) => string;
  /** One subject inline, e.g. "Мила — a girl aged 3". */
  describe: (s: PosterSubject) => string;
  /** Bulgarian title banner. */
  title: (subjects: PosterSubject[]) => string;
  /** Small line under the title. Empty string means no subtitle. */
  subtitle: (subjects: PosterSubject[], year: number) => string;
  bubbleKind: BubbleKind;
  /** What the containers look like. */
  bubbleIntro: (count: number) => string;
  /** Why both lines matter — stops the model dropping the small one. */
  bubbleRule: string;
  /** The text of one bubble, already quoted for the model. */
  bubbleText: (line: PosterLine) => string;
  /**
   * What wraps the small second line — brackets for a mispronunciation, a dash
   * for who said it, nothing for a birth weight. Shared with the compositor so
   * the drawn poster and the prompt agree on punctuation.
   */
  subAffix: readonly [prefix: string, suffix: string];
}

/** English gender word, defaulting to a neutral noun when it wasn't asked. */
function genderWord(s: PosterSubject, male: string, female: string, neutral: string): string {
  if (s.gender === "MALE") return male;
  if (s.gender === "FEMALE") return female;
  return neutral;
}

/** `„text“` plus, when present, a smaller bracketed second line. */
function twoLine(line: PosterLine, smallPrefix = "", smallSuffix = ""): string {
  const big = `large bold Bulgarian Cyrillic reading „${line.text}“`;
  if (!line.sub) return `${big}. This one has a single line only — do not invent a second line.`;
  return `${big}, and directly under it on its own line, in noticeably smaller plain lettering, „${smallPrefix}${line.sub}${smallSuffix}“`;
}

export const TEMPLATE_PROMPTS: Record<TemplateId, TemplatePrompt> = {
  KID_WORDS: {
    noun: "child",
    nounPlural: "children",
    headline: (n) =>
      `Create a COMPLETE, premium personalized children's memory POSTER featuring all ${n} ${n === 1 ? "child" : "children"} from the photo — a single finished artwork in a warm, richly detailed storybook / comic-book illustration style, like a beautiful children's book cover.`,
    identityLock: (n) =>
      `IDENTITY LOCK: use the uploaded photo as the reference and keep EACH child UNMISTAKABLY recognizable — preserve every child's exact face shape and proportions, skin tone, eye shape and colour, eyebrows, nose, mouth, smile, hairstyle and clothing. Do NOT merge, swap, drop, duplicate or genericise any child. All ${n} children are the heroes, together, front and centre, facing the viewer.`,
    describe: (s) =>
      `${s.name} — a ${genderWord(s, "boy", "girl", "child")}${
        typeof s.age === "number" ? ` aged ${s.age}` : ""
      }`,
    title: (subjects) => `Думичките на ${joinNames(subjects.map((s) => s.name))}`,
    // The keepsake only works as an archive if it says WHEN. Without an age and
    // a year it is just a picture; with them it dates a phase lasting months.
    subtitle: (subjects, year) =>
      subjects.length === 1 && typeof subjects[0].age === "number"
        ? `${subjects[0].name}, на ${formatAge(subjects[0].age)} · ${year}`
        : `${subjects
            .map((s) =>
              typeof s.age === "number" ? `${s.name} — ${formatAge(s.age)}` : s.name
            )
            .join(", ")} · ${year}`,
    bubbleKind: "speech",
    bubbleIntro: (count) =>
      `Exactly ${count} comic-style speech bubbles, no more and no fewer.`,
    bubbleRule:
      "Each funny word is the child's own mispronunciation of a real thing. Every bubble therefore shows TWO lines: the funny word large, and the real word small underneath in brackets. That pairing is the whole point of the poster and must never be dropped — without it nobody can tell what the child meant.",
    bubbleText: (line) => twoLine(line, "(", ")"),
    subAffix: ["(", ")"],
  },

  PORTRAIT_LINES: {
    noun: "person",
    nounPlural: "people",
    headline: (n) =>
      `Create a COMPLETE, premium personalized tribute POSTER featuring all ${n} ${n === 1 ? "person" : "people"} from the photo — a single finished artwork, warm and characterful, in a polished illustrated poster style suitable for an adult to hang at home or in an office.`,
    identityLock: (n) =>
      `IDENTITY LOCK: use the uploaded photo as the reference and keep EACH person UNMISTAKABLY recognizable — preserve exact face shape and proportions, skin tone, eye shape and colour, eyebrows, nose, mouth, smile, facial hair, glasses, hairstyle and clothing. Render ${n === 1 ? "them" : "each of them"} as a flattering but honest likeness of the real adult — never younger, never child-like, never a generic character. All ${n} are the heroes, together, front and centre, facing the viewer.`,
    describe: (s) =>
      `${s.name} — ${genderWord(s, "a man", "a woman", "a person")}${
        typeof s.age === "number" ? ` aged ${s.age}` : ""
      }${s.relation ? ` (${s.relation})` : ""}`,
    title: (subjects) => `Цитатите на ${joinNames(subjects.map((s) => s.name))}`,
    subtitle: (subjects, year) => {
      const one = subjects.length === 1 ? subjects[0] : null;
      if (one && typeof one.age === "number") return `${one.name}, на ${one.age} · ${year}`;
      if (one?.relation) return `${one.name} — ${one.relation} · ${year}`;
      return String(year);
    },
    bubbleKind: "speech",
    bubbleIntro: (count) =>
      `Exactly ${count} comic-style speech bubbles, no more and no fewer.`,
    bubbleRule:
      "Each bubble is a line this person actually repeats, and everyone who knows them recognises it instantly. Where a second smaller line is given, it says when they say it — keep it, it is the punchline.",
    bubbleText: (line) => twoLine(line, "(", ")"),
    subAffix: ["(", ")"],
  },

  PET: {
    noun: "pet",
    nounPlural: "pets",
    headline: (n) =>
      `Create a COMPLETE, premium personalized pet POSTER featuring all ${n} ${n === 1 ? "animal" : "animals"} from the photo — a single finished artwork, charming and full of character, in a richly detailed illustrated poster style.`,
    identityLock: (n) =>
      `IDENTITY LOCK: use the uploaded photo as the reference and keep EACH animal UNMISTAKABLY recognizable — preserve the exact breed, body shape and size, coat colour, fur length and texture, every marking, patch and spot exactly where it sits, ear shape and carriage, muzzle shape, and eye colour. An owner must recognise their own animal instantly. Do NOT substitute a generic cute animal of the same species, and do NOT humanise it — no clothes, no standing upright, no human facial expressions. All ${n} are the heroes, front and centre, facing the viewer.`,
    describe: (s) =>
      `${s.name} — ${s.species || "a pet"}${
        s.gender ? `, ${genderWord(s, "male", "female", "")}` : ""
      }${typeof s.age === "number" ? `, aged ${s.age}` : ""}`,
    title: (subjects) => `Такъв е ${joinNames(subjects.map((s) => s.name))}`,
    subtitle: (subjects, year) => {
      const one = subjects.length === 1 ? subjects[0] : null;
      if (one?.species) return `${one.species} · ${year}`;
      return String(year);
    },
    // A dog does not talk, so a speech bubble reads as a joke about the dog
    // rather than about its habits. Captions sit beside the animal instead.
    bubbleKind: "caption",
    bubbleIntro: (count) =>
      `Exactly ${count} small decorative caption labels — rounded hand-drawn tags or ribbons, NOT speech bubbles coming from the animal's mouth — no more and no fewer.`,
    bubbleRule:
      "Each caption is one habit the animal is known for at home. They are observations about the animal, not words it speaks.",
    bubbleText: (line) => twoLine(line),
    subAffix: ["", ""],
  },

  COUPLE: {
    noun: "person",
    nounPlural: "people",
    headline: () =>
      `Create a COMPLETE, premium personalized POSTER of the COUPLE from the photo — both of them together in one single finished artwork, warm and romantic without being sentimental, in a polished illustrated poster style.`,
    identityLock: () =>
      `IDENTITY LOCK: use the uploaded photo as the reference and keep BOTH people UNMISTAKABLY recognizable — preserve each one's exact face shape and proportions, skin tone, eye shape and colour, eyebrows, nose, mouth, smile, facial hair, glasses, hairstyle and clothing. Render them as honest likenesses of the real adults, never younger or child-like. Both are equally the heroes: side by side, front and centre, facing the viewer, clearly a couple.`,
    describe: (s) => `${s.name} — ${genderWord(s, "a man", "a woman", "a person")}`,
    title: (subjects) => joinNames(subjects.map((s) => s.name)),
    subtitle: (_subjects, year) => `нашите изречения · ${year}`,
    bubbleKind: "speech",
    bubbleIntro: (count) =>
      `Exactly ${count} comic-style speech bubbles, no more and no fewer.`,
    bubbleRule:
      "Each bubble is an inside joke between the two of them. Where a second smaller line names who says it, keep it — that attribution is the joke.",
    bubbleText: (line) => twoLine(line, "— "),
    subAffix: ["— ", ""],
  },

  BABY_STATS: {
    noun: "baby",
    nounPlural: "babies",
    headline: (n) =>
      `Create a COMPLETE, premium personalized birth-announcement POSTER featuring the ${n === 1 ? "newborn baby" : `${n} newborn babies`} from the photo — a single finished artwork, soft, calm and tender, in a delicate nursery illustration style.`,
    identityLock: (n) =>
      `IDENTITY LOCK: use the uploaded photo as the reference and keep the ${n === 1 ? "baby" : "babies"} recognizable — preserve face shape, skin tone, hair colour and amount, and the exact expression. Render a real newborn, correctly proportioned for a baby, never an older child and never a doll-like generic infant.`,
    describe: (s) => `${s.name} — a newborn ${genderWord(s, "boy", "girl", "baby")}`,
    title: (subjects) => {
      const names = joinNames(subjects.map((s) => s.name));
      if (subjects.length === 1 && subjects[0].gender === "FEMALE")
        return `Добре дошла, ${names}`;
      if (subjects.length === 1) return `Добре дошъл, ${names}`;
      return `Добре дошли, ${names}`;
    },
    subtitle: (_subjects, year) => String(year),
    // Birth stats are records, not speech — they read as data on a keepsake.
    bubbleKind: "card",
    bubbleIntro: (count) =>
      `Exactly ${count} small elegant label cards — soft rounded panels or hand-drawn frames, NOT speech bubbles — no more and no fewer.`,
    bubbleRule:
      "Each card records one fact from the birth: the value large, and what it measures small underneath. Both lines are required — a number with no label is meaningless on a keepsake.",
    bubbleText: (line) => twoLine(line),
    subAffix: ["", ""],
  },
};
