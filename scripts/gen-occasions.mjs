/**
 * Generates one sample poster per OCCASION and saves it to
 * public/occasions/{slug}.webp.
 *
 * Run: node --env-file=.env scripts/gen-occasions.mjs
 *
 * The occasion cards on the landing page used to be an icon and two lines of
 * text, which asked the visitor to imagine the product at the exact moment they
 * are deciding whether it fits their occasion. Each card now shows the poster
 * that occasion would actually produce — a colleague's leaving gift looks
 * nothing like a birth announcement, and that difference is the whole pitch.
 *
 * Slugs MUST match `OCCASIONS[].slug` in src/lib/templates.ts.
 * COSTS OpenAI credit — see scripts/poster-art.mjs. Existing files are skipped.
 */
import path from "path";
import { promises as fs } from "fs";
import { renderAll } from "./poster-art.mjs";

/**
 * Every person here is fictional. Style is chosen per occasion rather than
 * cycled, because the register is part of the message: a farewell gift can be a
 * caricature, a christening cannot.
 */
const OCCASION_ART = [
  {
    slug: "rozhden-den",
    style: "storybook",
    kind: "speech",
    hero: "a fictional smiling 5-year-old Bulgarian girl with dark curly hair and a party hat, holding a small cake",
    scene: "a warm birthday table with garlands, balloons and soft candlelight",
    title: "Мия на 5",
    // Words the model has proven it can spell. Longer or rarer pairs come back
    // subtly wrong ("велосилед", "пэтладжан"), which on a sample poster reads as
    // a printing defect rather than as a toddler's charm.
    // Only pairs this model has actually drawn correctly. It silently
    // autocorrects a mispronunciation it doesn't recognise ("тотла" came back as
    // "торта", "балонки" as "балони") and then both lines read the same, which
    // kills the joke — the whole poster is the gap between the big word and the
    // small one. These two survived in the Christmas and storybook posters.
    // The second bubble carries no mispronunciation on purpose: given two of
    // them the model autocorrects one and prints the same word twice, which
    // looks like a bug. A plain line cannot fail that way.
    lines: [
      { text: "шоколата", sub: "шоколад", visual: "a chocolate bar" },
      { text: "Още едно парче", sub: "", visual: "a slice of cake on a plate" },
    ],
  },
  {
    slug: "kolega-rozhden-den",
    style: "realistic",
    kind: "speech",
    hero: "a fictional Bulgarian woman in her early 40s with shoulder-length dark hair and a blazer, an entirely fictional adult",
    scene: "an open-plan office with a laptop, sticky notes and large windows",
    title: "Цитатите на Ели",
    lines: [
      { text: "Ще го пуснем в петък", sub: "някой петък", visual: "a small desk calendar" },
      { text: "Само едно кратко обаждане", sub: "четиридесет минути", visual: "a desk phone" },
    ],
  },
  {
    slug: "izprashtane",
    style: "caricature",
    kind: "speech",
    hero: "a fictional Bulgarian man in his 30s with a short beard, holding a cardboard box with a plant in it — an entirely fictional adult",
    scene: "an office corridor with colleagues waving in the background",
    title: "Няма да те забравим, Крис",
    lines: [
      { text: "Аз идвам след 5 минути", sub: "", visual: "a little alarm clock" },
      { text: "Кой пи последното кафе", sub: "", visual: "an empty coffee pot" },
    ],
  },
  {
    slug: "uchitel",
    style: "watercolor",
    kind: "speech",
    hero: "a fictional warm Bulgarian woman teacher in her 50s with glasses and short grey hair, an entirely fictional adult",
    scene: "a bright classroom with a blackboard, chalk and a vase of flowers",
    title: "Госпожа Петрова",
    lines: [
      { text: "Тишина, пиша двойки", sub: "", visual: "a red pen" },
      { text: "Отваряме тетрадките", sub: "", visual: "an open notebook" },
    ],
  },
  {
    slug: "godishnina",
    style: "realistic",
    kind: "speech",
    hero: "a fictional Bulgarian couple in their 40s standing close together, a woman with straight dark hair and a man with greying hair — entirely fictional people",
    scene: "a candlelit dinner table with two glasses and warm evening light",
    title: "Десет години Ани и Стефан",
    lines: [
      { text: "Аз не хъркам", sub: "", visual: "a small crescent moon" },
      { text: "Гледаме само един епизод", sub: "", visual: "a TV remote control" },
    ],
  },
  {
    slug: "razhdane",
    style: "watercolor",
    kind: "card",
    hero: "a fictional sleeping newborn baby boy in a soft white blanket — correctly proportioned for a newborn, entirely fictional",
    scene: "a calm nursery in soft watercolour washes with dried flowers and a knitted bunny",
    title: "Добре дошъл, Марти",
    lines: [
      { text: "3.280 кг", sub: "", visual: "a small vintage weighing scale" },
      { text: "04:12 ч.", sub: "", visual: "a small round clock" },
    ],
  },
  {
    slug: "lyubimets",
    style: "disney",
    kind: "caption",
    hero: "a fictional grey tabby cat sitting upright with a proud expression — a real cat, never humanised, no clothes",
    scene: "a sunny windowsill with a keyboard, a mug and a houseplant",
    title: "Такава е Мая",
    lines: [
      { text: "Спи върху клавиатурата", sub: "", visual: "a computer keyboard" },
      { text: "Бута чашите от масата", sub: "", visual: "a tipping mug" },
    ],
  },
  {
    slug: "purvi-yuni",
    style: "fantasy",
    kind: "speech",
    hero: "two fictional Bulgarian children, a boy and a girl about 6 years old, running with a kite",
    scene: "a summer meadow at golden hour with soaring kites and fireflies",
    title: "Думичките на Ния и Дари",
    lines: [
      { text: "апум", sub: "паун", visual: "a beautiful friendly peacock" },
      { text: "опокоп", sub: "октопод", visual: "a friendly little octopus" },
    ],
  },
  {
    slug: "koleda",
    style: "storybook",
    kind: "speech",
    hero: "a fictional 4-year-old Bulgarian boy in a knitted jumper holding a wrapped present",
    scene: "a cosy room with a decorated Christmas tree, warm lights and snow outside the window",
    title: "Коледата на Иво",
    lines: [
      { text: "шоколата", sub: "шоколад", visual: "a chocolate bar" },
      { text: "елха с лампички", sub: "", visual: "a small string of fairy lights" },
    ],
  },
];

const outDir = path.join(process.cwd(), "public", "occasions");
await fs.mkdir(outDir, { recursive: true });

await renderAll(
  OCCASION_ART.map((spec) => ({
    spec,
    out: path.join(outDir, `${spec.slug}.webp`),
    label: spec.slug,
  })),
);
