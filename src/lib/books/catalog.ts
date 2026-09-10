/**
 * What a personalised book can be — the choices the wizard offers.
 *
 * UI copy only. Everything the model is told lives in lib/ai/book-prompt.ts,
 * which is server-only, exactly as `templates.ts` and `ai/template-prompt.ts`
 * are split for the poster. A prompt in this file would ship to every browser
 * and be editable by anyone who opens devtools.
 */

/** Length of the story itself, excluding cover, dedication and back cover. */
export const STORY_PAGE_COUNT = 20;

/**
 * How much is generated before anyone pays.
 *
 * A poster costs about six cents to preview, so it is given away. A full book
 * is twenty-odd illustrations — around €1.30 at medium quality — and handing
 * that to every curious visitor is a different proposition entirely.
 *
 * So the free preview is the whole story text plus the cover and the first
 * three illustrated pages: roughly €0.30, and enough to see the real children,
 * the real style and the real writing. The remaining pages are generated once
 * the order is paid. The promise the shop is built on — you see it before you
 * pay — survives intact.
 */
export const FREE_PREVIEW_PAGES = 3;

export interface BookAdventure {
  id: string;
  name: string;
  /** One line under the name on the picker card. */
  blurb: string;
  /** lucide-react icon name, resolved through lib/icons.ts. */
  icon: string;
}

/**
 * `CUSTOM` is deliberately part of the same list rather than a separate escape
 * hatch below it: a parent who already knows the story they want should not
 * have to pick a wrong preset first.
 */
export const ADVENTURES: readonly BookAdventure[] = [
  { id: "MAGIC_FOREST", name: "Магическа гора", blurb: "Говорещи дървета и светулки, които показват пътя.", icon: "Trees" },
  { id: "DINOSAURS", name: "Светът на динозаврите", blurb: "Огромни следи и едно много дружелюбно динозавърче.", icon: "Footprints" },
  { id: "SPACE", name: "Космическо приключение", blurb: "Ракета, звезден прах и планета, която никой не е виждал.", icon: "Rocket" },
  { id: "KINGDOM", name: "Магическо кралство", blurb: "Замък, таен коридор и корона, която трябва да се върне.", icon: "Castle" },
  { id: "DRAGONS", name: "Дракони", blurb: "Дракон, който се страхува от собствения си огън.", icon: "Flame" },
  { id: "UNDERWATER", name: "Подводен свят", blurb: "Коралов град и една изгубена перла.", icon: "Waves" },
  { id: "PIRATES", name: "Пирати", blurb: "Карта, компас, който бърка, и остров с изненада.", icon: "Anchor" },
  { id: "ANIMALS", name: "Приключение с животни", blurb: "Цяла гора от приятели, всеки с различен характер.", icon: "PawPrint" },
  { id: "CHRISTMAS", name: "Коледно приключение", blurb: "Изгубен подарък и една много дълга шейна.", icon: "Snowflake" },
  { id: "BEDTIME", name: "Приказка преди лягане", blurb: "Тиха история, която завършва със заспиване.", icon: "Moon" },
  { id: "CUSTOM", name: "Моята идея", blurb: "Опиши какво искаш да се случи и ние го написваме.", icon: "Wand2" },
];

export function adventureById(id: string): BookAdventure | undefined {
  return ADVENTURES.find((a) => a.id === id);
}

/** Maps onto the BookAgeGroup enum in the schema. */
export const AGE_GROUPS = [
  { id: "AGE_3_5", name: "3–5 години", blurb: "Къси изречения, много повторение." },
  { id: "AGE_5_7", name: "5–7 години", blurb: "По-дълга история, първи прочит сам." },
  { id: "AGE_7_9", name: "7–9 години", blurb: "Повече обрати и по-богат речник." },
] as const;

/** Maps onto the BookMood enum. */
export const MOODS = [
  { id: "FUNNY", name: "Забавно", blurb: "Смях, лудории, малко хаос." },
  { id: "MAGICAL", name: "Магическо", blurb: "Чудеса, светлина, тихо вълшебство." },
  { id: "ADVENTUROUS", name: "Приключенско", blurb: "Смелост, откриване, малко напрежение." },
  { id: "CALM", name: "Спокойно", blurb: "Меко темпо, за преди сън." },
  { id: "EDUCATIONAL", name: "Образователно", blurb: "Научава нещо, без да поучава." },
] as const;

export interface BookArtStyle {
  id: string;
  name: string;
  blurb: string;
}

/**
 * Named by what they look like, never by a studio.
 *
 * The poster catalogue learned this the hard way: a style called "Дисни/Пиксар"
 * borrows someone else's trademark and promises something the shop cannot
 * deliver. These describe the drawing.
 */
export const BOOK_STYLES: readonly BookArtStyle[] = [
  { id: "SOFT", name: "Мека детска илюстрация", blurb: "Топли заоблени форми, спокойни цветове." },
  { id: "WATERCOLOR", name: "Акварел", blurb: "Меки преливания, ръчно рисувано усещане." },
  { id: "STORYBOOK", name: "Цветна приказна илюстрация", blurb: "Наситени цветове, богата сцена." },
  { id: "ANIMATED_3D", name: "Анимационно 3D", blurb: "Обемни герои, меко кино осветление." },
  { id: "CLASSIC", name: "Класическа книжна илюстрация", blurb: "Като от книга, четена и от родителите." },
];

export function styleById(id: string): BookArtStyle | undefined {
  return BOOK_STYLES.find((s) => s.id === id);
}

/** How many characters a book may star. Two is the case the wizard optimises. */
export const MIN_CHARACTERS = 1;
export const MAX_CHARACTERS = 4;
export const DEFAULT_CHARACTERS = 2;

/**
 * Suggestions under the "must include" field.
 *
 * Offered as chips because a blank box gets left blank: most parents do not
 * think to mention the grandmother or the dog until they are reminded that
 * they can.
 */
export const MUST_INCLUDE_SUGGESTIONS = [
  "баба",
  "дядо",
  "кучето",
  "котката",
  "любимата играчка",
  "морето",
  "къщата на баба",
  "детската градина",
] as const;
