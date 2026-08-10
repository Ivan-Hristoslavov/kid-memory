/**
 * Generates the 6 marketing sample posters (one per art style) with FICTIONAL
 * people and pets, and saves optimized webp files to public/samples/{style}.webp.
 *
 * Run: node --env-file=.env scripts/gen-samples.mjs
 *
 * COSTS OpenAI credit — see scripts/poster-art.mjs. Existing files are skipped,
 * so delete the ones you want redrawn first.
 */
import path from "path";
import { promises as fs } from "fs";
import { renderAll } from "./poster-art.mjs";

/**
 * One sample per art style — spread across ALL FIVE poster templates on purpose.
 * Six children's posters was the strongest "this shop is only for parents"
 * signal left on the landing page, and it sat in the hero deck, the showcase
 * grid and the OG card at once. Filenames stay keyed by style id because the
 * Showcase and HeroPoster look them up that way.
 *
 * Style is matched to template rather than assigned at random: a caricature of a
 * newborn is wrong, and watercolour is exactly the register a birth
 * announcement wants. Keep `SAMPLE_POSTERS` in src/lib/templates.ts in sync —
 * it is what the captions under these images promise.
 */
const SAMPLES = [
  {
    style: "realistic",
    kind: "speech",
    hero: "a fictional friendly Bulgarian man in his late 30s with short dark hair, light stubble and glasses, wearing a shirt — an entirely fictional person, an adult, never a child",
    scene: "a warm modern office corner with a desk, a plant and soft window light",
    title: "Цитатите на Митко",
    lines: [
      { text: "Ще го оправим в понеделник", sub: "всеки петък", visual: "a small desk calendar" },
      { text: "Първо кафе, после проблеми", sub: "", visual: "a steaming cup of coffee" },
    ],
  },
  {
    style: "storybook",
    kind: "speech",
    hero: "a fictional cheerful 3-year-old Bulgarian boy with short blond hair and blue eyes, wearing a striped t-shirt",
    scene: "a storybook meadow with a little red tractor and haystacks",
    title: "Думичките на Боби",
    lines: [
      { text: "апум", sub: "паун", visual: "a beautiful friendly peacock" },
      { text: "тактул", sub: "трактор", visual: "a cute little red tractor" },
    ],
  },
  {
    style: "disney",
    kind: "caption",
    hero: "a fictional golden retriever dog with a warm expression, sitting upright — a real dog, never humanised, no clothes, not standing on two legs",
    scene: "a cosy living room with a rug, a sofa corner and warm afternoon light",
    title: "Такъв е Рекс",
    // Short lines on purpose. "Лае по прахосмукачката" came back as "ЛДЕ ПО
    // ЛРАХОСМУНКАДТА" — the model's Cyrillic degrades fast past ~15 characters,
    // and a misspelt sample on the home page costs more than a duller line.
    lines: [
      { text: "Краде чорапи", sub: "", visual: "a single striped sock" },
      { text: "Пази дивана", sub: "", visual: "a small sofa cushion" },
    ],
  },
  {
    style: "caricature",
    kind: "speech",
    hero: "a fictional Bulgarian couple in their 30s side by side — a woman with wavy dark hair and a man with a short beard, entirely fictional people",
    scene: "a bright kitchen corner with a coffee pot and morning light",
    title: "Мария и Иван",
    lines: [
      { text: "Аз не хъркам", sub: "", visual: "a small crescent moon" },
      { text: "Тръгваме след 5 минути", sub: "", visual: "a little alarm clock" },
    ],
  },
  {
    style: "watercolor",
    kind: "card",
    hero: "a fictional sleeping newborn baby girl wrapped in a soft knitted blanket — correctly proportioned for a newborn, entirely fictional",
    scene: "a calm nursery in soft watercolour washes with a mobile and dried flowers",
    title: "Добре дошла, Ема",
    lines: [
      { text: "3.450 кг", sub: "", visual: "a small vintage weighing scale" },
      { text: "52 см", sub: "", visual: "a folding wooden ruler" },
    ],
  },
  {
    style: "fantasy",
    kind: "speech",
    hero: "two fictional Bulgarian twins — a 4-year-old boy and girl with brown hair, wearing cozy sweaters",
    scene: "a magical starry forest with glowing fireflies and a friendly baby dragon",
    title: "Думичките на Ани и Алекс",
    lines: [
      { text: "дакончо", sub: "дракон", visual: "a small friendly baby dragon" },
      { text: "зездичка", sub: "звездичка", visual: "a glowing golden star" },
    ],
  },
];

const outDir = path.join(process.cwd(), "public", "samples");
await fs.mkdir(outDir, { recursive: true });

await renderAll(
  SAMPLES.map((spec) => ({
    spec,
    out: path.join(outDir, `${spec.style}.webp`),
    label: spec.style,
  })),
);
