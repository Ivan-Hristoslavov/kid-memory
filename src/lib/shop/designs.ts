/**
 * The ready-made design catalogue.
 *
 * The shop's original bet was that everyone arrives with a photograph. Most
 * people do not. They arrive knowing they want a shirt for a stag weekend and
 * no idea what should be on it, and a blank upload box asks them to be a
 * designer before they are allowed to be a customer. This is the answer: a
 * design they pick, on a product they pick, ordered in two clicks.
 *
 * Each entry carries the prompt that produced it, so `scripts/gen-designs.ts`
 * and the storefront read one list. A design whose artwork is missing is a
 * design that has not been generated yet, not a second file to keep in step.
 *
 * ── ON INTELLECTUAL PROPERTY, WHICH IS NOT A DETAIL HERE ─────────────────
 * There is nothing in this file from World of Warcraft, League of Legends, or
 * any other published game, film or brand. Their names, logos, characters,
 * classes, races, item names and typefaces are trademarks, and printing them on
 * a shirt for sale is infringement whatever the shirt costs. Blizzard and Riot
 * both run active takedown programmes, print partners refuse the jobs when they
 * notice, and the liability sits with the seller rather than the printer.
 *
 * What IS here is the genre: a raid party's sword and shield, a rune circle, a
 * pixel heart, an arcade cabinet. Those read to exactly the same buyer, they are
 * ours to sell, and they cannot be taken down. If a licence is ever wanted, it
 * is bought from the publisher, not assumed.
 * ─────────────────────────────────────────────────────────────────────────
 */

export type DesignCategory =
  | "BACHELOR"
  | "HEN"
  | "GAMING"
  | "PETS"
  | "FITNESS"
  | "TECH"
  | "TEACHER"
  | "OUTDOORS"
  | "TRAVEL"
  | "MUSIC"
  | "FAMILY"
  | "HUMOUR"
  | "HOLIDAY"
  | "PROFESSION"
  | "GRADUATION";

export interface DesignCategoryMeta {
  id: DesignCategory;
  label: string;
  /** One line under the heading on the category page. */
  blurb: string;
  /** The design whose artwork represents the category. */
  cover: string;
}

export const DESIGN_CATEGORIES: readonly DesignCategoryMeta[] = [
  {
    id: "GAMING",
    label: "Гейминг",
    blurb: "За вечерите, които свършват в 3 сутринта.",
    cover: "raid-party",
  },
  {
    id: "BACHELOR",
    label: "Ергенско парти",
    blurb: "Последната нощ преди „да“.",
    cover: "stag-crown",
  },
  {
    id: "HEN",
    label: "Моминско парти",
    blurb: "Целият отбор в едно.",
    cover: "hen-wreath",
  },
  {
    id: "PETS",
    label: "За любимеца",
    blurb: "Кучето вкъщи е член на семейството.",
    cover: "dog-line",
  },
  {
    id: "FITNESS",
    label: "Фитнес",
    blurb: "За тези, които не пропускат ден.",
    cover: "barbell",
  },
  {
    id: "TECH",
    label: "IT и програмисти",
    blurb: "Вътрешни шеги, които само екипът разбира.",
    cover: "terminal-cursor",
  },
  {
    id: "TEACHER",
    label: "За учителя",
    blurb: "Подаръкът в края на годината.",
    cover: "apple-books",
  },
  {
    id: "OUTDOORS",
    label: "Риболов и лов",
    blurb: "За съботите край язовира.",
    cover: "fishing-lure",
  },
  {
    id: "TRAVEL",
    label: "Пътешествия",
    blurb: "За следващия билет.",
    cover: "mountain-sun",
  },
  {
    id: "MUSIC",
    label: "Музика",
    blurb: "За тези, които слушат високо.",
    cover: "cassette",
  },
  {
    id: "FAMILY",
    label: "Семейство",
    blurb: "Първите години, за спомен.",
    cover: "family-line",
  },
  {
    id: "HOLIDAY",
    label: "Празници",
    blurb: "Коледа, Нова година, Осми март.",
    cover: "christmas-tree",
  },
  {
    id: "PROFESSION",
    label: "По професия",
    blurb: "За тези, които работят, докато другите спят.",
    cover: "stethoscope",
  },
  {
    id: "GRADUATION",
    label: "Абитуриентски",
    blurb: "Випускът, който няма да се повтори.",
    cover: "grad-cap",
  },
  {
    id: "HUMOUR",
    label: "Хумор",
    blurb: "Подаръкът, който разсмива.",
    cover: "coffee-first",
  },
];

export interface Design {
  id: string;
  title: string;
  category: DesignCategory;
  /**
   * Whether the artwork is drawn light, for dark garments.
   *
   * A cream line drawing is invisible on a white shirt and perfect on a black
   * one. The product page uses this to preselect a colour that works, rather
   * than letting somebody order something they cannot see.
   */
  forDark: boolean;
  /** The generation prompt. Kept so one list drives art and shop alike. */
  prompt: string;
  /**
   * A silhouette meant to sit ABOVE lettering, not to be sold on its own.
   *
   * Every stag and hen shirt on the Bulgarian market is a small black figure
   * over a phrase — a groom and bride, a bow tie, a row of men in suits — and
   * lettering alone was the obvious thing missing from ours. These live in the
   * same list because they are generated the same way, and are filtered out of
   * every shop listing because a bow tie by itself is not a design.
   */
  iconOnly?: boolean;
}

/** Shared art direction: the print itself, not a photograph of a print. */
export const DESIGN_LOOK = `Flat vector-style illustration, clean bold shapes, screen-print \
aesthetic, centred with even margins, fully transparent background. NO text, no letters, no \
numbers, no words, no signature, no watermark, no frame, no background scenery, no photograph, \
no mock-up, no garment — the artwork alone.`;

const d = (
  id: string,
  title: string,
  category: DesignCategory,
  forDark: boolean,
  prompt: string
): Design => ({ id, title, category, forDark, prompt });

export const DESIGNS: readonly Design[] = [
  // ── Гейминг ───────────────────────────────────────────────────────────
  // The genre, never a title. See the note at the top of this file.
  d("raid-party", "Рейд отряд", "GAMING", true,
    "A heraldic crest built from a crossed longsword and battle axe behind a round shield, with a small stylised dragon silhouette above, in cream and pale gold on transparent."),
  d("rune-circle", "Рунически кръг", "GAMING", true,
    "A circular arcane rune ring made of invented geometric glyphs, glowing violet and cyan, with a faceted crystal at its centre."),
  d("pixel-heart", "Пиксел сърце", "GAMING", true,
    "Three chunky 8-bit pixel-art hearts in a row, bright red with a white highlight pixel, plus a simple pixel health bar beneath them."),
  d("arcade-cabinet", "Аркадна машина", "GAMING", true,
    "A retro upright arcade cabinet seen face-on, with a joystick and two round buttons, in cream, coral and teal."),
  d("mage-staff", "Жезълът на мага", "GAMING", true,
    "A tall wizard's staff topped with a glowing hexagonal crystal, wrapped in leather cord, with small sparks rising around it, in violet and cream."),
  d("crosshair", "Мерник", "GAMING", true,
    "A precise tactical crosshair reticle with tick marks, overlaid on a stylised puff of smoke, in white and orange."),
  d("block-pickaxe", "Кубична кирка", "GAMING", true,
    "A blocky voxel-style pickaxe crossed with a blocky sword, above three stacked cube blocks of earth and stone, in warm browns and greens."),
  d("controller-bolt", "Контролер", "GAMING", true,
    "A modern game controller seen face-on in bold outline, with a lightning bolt behind it, in cream with electric violet accents."),
  d("respawn-skull", "Възраждане", "GAMING", true,
    "A stylised cartoon skull wearing a gaming headset, with a small circular arrow loop around it, in cream and cyan."),
  d("loot-chest", "Сандъкът с плячка", "GAMING", true,
    "An open treasure chest with light and coins spilling upward out of it, in gold and cream, flat and graphic."),

  // ── Ергенско ──────────────────────────────────────────────────────────
  d("stag-crown", "Короната", "BACHELOR", true,
    "A bold heraldic crown above two crossed laurel branches, in cream and gold."),
  d("stag-chain", "Последна нощ", "BACHELOR", true,
    "A broken chain link with a wedding ring hanging from one open end, drawn in strong clean outline, in cream."),
  d("stag-whisky", "Уиски и пура", "BACHELOR", true,
    "A cut-crystal whisky tumbler with two ice cubes beside a lit cigar with a curl of smoke, in cream and amber."),
  d("stag-cards", "Карти и зарове", "BACHELOR", true,
    "A fanned hand of four playing cards with a pair of dice resting in front of them, in cream, red and charcoal."),
  d("stag-anchor", "Котвата", "BACHELOR", true,
    "A nautical anchor wrapped in rope inside a rope circle, in cream and navy."),
  d("stag-antlers", "Рога", "BACHELOR", true,
    "A pair of large stag antlers seen head-on above a small mountain range, in cream, flat and graphic."),

  // ── Моминско ──────────────────────────────────────────────────────────
  d("hen-wreath", "Цветен венец", "HEN", false,
    "A circular wreath of wildflowers and eucalyptus leaves with a small diamond ring resting at its centre, in blush pink, sage green and clay."),
  d("hen-champagne", "Шампанско", "HEN", false,
    "Two champagne coupe glasses clinking, with confetti and small bubbles rising around them, in blush pink and warm gold."),
  d("hen-butterfly", "Пеперуда", "HEN", false,
    "A single detailed butterfly with wings made of small wildflowers, in blush, clay and sage."),
  d("hen-heart", "Сърце от цветя", "HEN", false,
    "A heart outline formed entirely from small flowers and leaves, in blush pink, coral and sage green."),
  d("hen-crown", "Перлена корона", "HEN", false,
    "A delicate tiara of fine loops set with round pearls, in soft gold and cream."),
  d("hen-cocktail", "Коктейл", "HEN", false,
    "A tall cocktail glass with a slice of citrus and a paper umbrella, with two small hearts rising as bubbles, in coral and blush."),

  // ── Любимци ───────────────────────────────────────────────────────────
  d("dog-line", "Кучето", "PETS", false,
    "A single continuous line drawing of a sitting dog in profile, one unbroken stroke, in charcoal."),
  d("cat-line", "Котката", "PETS", false,
    "A single continuous line drawing of a curled sleeping cat, one unbroken stroke, in charcoal."),
  d("paw-heart", "Лапа и сърце", "PETS", false,
    "A dog paw print where the central pad is shaped as a heart, in clay brown."),
  d("dog-mountain", "Кучето и планината", "PETS", true,
    "A dog sitting in silhouette in front of a large circular sun with a mountain ridge behind, in cream and burnt orange."),

  // ── Фитнес ────────────────────────────────────────────────────────────
  d("barbell", "Щанга", "FITNESS", true,
    "A loaded barbell seen face-on with weight plates at both ends, in cream, strong and graphic."),
  d("kettlebell", "Пудовка", "FITNESS", true,
    "A kettlebell with a small lightning bolt on its body, in cream and electric yellow."),
  d("run-route", "Маршрутът", "FITNESS", false,
    "A winding running route line with a small pin at one end and a chequered flag at the other, in charcoal and coral."),

  // ── IT ────────────────────────────────────────────────────────────────
  d("terminal-cursor", "Терминал", "TECH", true,
    "A simple terminal window outline with a single blinking block cursor inside it, in cream and mint green."),
  d("bug-fixed", "Бъгът", "TECH", true,
    "A small friendly beetle inside a circle with a diagonal line through it, drawn as a clean icon, in cream and coral."),
  d("coffee-code", "Кафе и код", "TECH", false,
    "A coffee cup seen from the side with steam rising in the shape of curly brackets, in charcoal and clay."),

  // ── Учител ────────────────────────────────────────────────────────────
  d("apple-books", "Ябълка и книги", "TEACHER", false,
    "A stack of three books with a single apple resting on top, in clay red, sage and cream."),
  d("pencil-sun", "Молив и слънце", "TEACHER", false,
    "A pencil drawing an arc that becomes a rising sun with rays, in warm yellow and charcoal."),

  // ── Риболов и лов ─────────────────────────────────────────────────────
  d("fishing-lure", "Блесна", "OUTDOORS", true,
    "A fishing lure with a treble hook and small feathers, hanging from a line, in cream and teal."),
  d("deer-forest", "Еленът", "OUTDOORS", true,
    "A stag standing in profile in front of a row of pine trees, in cream, flat and graphic."),

  // ── Пътешествия ───────────────────────────────────────────────────────
  d("mountain-sun", "Планина и слънце", "TRAVEL", true,
    "A snow-capped mountain range in front of a large circular sun, in cream and burnt orange."),
  d("van-road", "Бусът", "TRAVEL", false,
    "A vintage camper van seen from the side with a surfboard on the roof, on a short strip of road, in teal, cream and clay."),
  d("compass-rose", "Компас", "TRAVEL", true,
    "An ornate eight-point compass rose inside a thin circle, in cream and gold."),

  // ── Музика ────────────────────────────────────────────────────────────
  d("cassette", "Касета", "MUSIC", true,
    "A retro audio cassette seen face-on with a small heart between its two reels, in cream, coral and teal."),
  d("soundwave", "Звукова вълна", "MUSIC", true,
    "A horizontal audio waveform of varying bar heights, in cream and violet."),

  // ── Семейство ─────────────────────────────────────────────────────────
  d("family-line", "Семейството", "FAMILY", false,
    "A single continuous line drawing of two adults and a small child holding hands, one unbroken stroke, in charcoal."),
  d("baby-bear", "Мече", "FAMILY", false,
    "A small sitting bear cub facing forward with a tiny heart on its chest, in soft brown and cream."),
  d("hands-heart", "Ръцете", "FAMILY", false,
    "Two hands, one large and one small, forming a heart shape between them, in clay and blush."),

  // ── Хумор ─────────────────────────────────────────────────────────────
  d("coffee-first", "Първо кафе", "HUMOUR", false,
    "An oversized coffee mug with a sleepy face drawn on it and heavy steam rising, in clay and cream."),
  d("sloth-nap", "Ленивецът", "HUMOUR", false,
    "A sloth hanging upside down from a branch with its eyes closed, in soft grey-brown and sage."),
  d("pizza-slice", "Парче пица", "HUMOUR", true,
    "A single slice of pizza with a lightning bolt of melted cheese trailing from it, in warm yellow, coral and cream."),

  // ── Гейминг, втора вълна ─────────────────────────────────────────────
  d("dice-d20", "Двадесетстенник", "GAMING", true,
    "A twenty-sided polyhedral dice seen at a three-quarter angle, faceted and clean, with a small sparkle beside it, in cream and violet."),
  d("headset-glow", "Слушалки", "GAMING", true,
    "A gaming headset with a boom microphone seen face-on, with two small glowing arcs at the ear cups, in cream and cyan."),
  d("keyboard-keys", "WASD", "GAMING", true,
    "Four blank mechanical keyboard keycaps arranged in the WASD cross shape, seen from a slight angle, with no letters on them, in cream and coral."),
  d("mana-potion", "Отвара", "GAMING", true,
    "A round-bottomed potion flask with a cork stopper, filled with glowing liquid and small bubbles rising, in cyan and violet."),
  d("boss-crown", "Финалният бос", "GAMING", true,
    "A jagged spiked crown above a pair of glowing eyes in shadow, menacing and graphic, in cream and deep red."),
  d("portal-ring", "Портал", "GAMING", true,
    "An upright oval portal ring with swirling energy inside it and small stones floating around its edge, in violet and cyan."),
  d("space-ship", "Космически кораб", "GAMING", true,
    "A small angular spacecraft seen from the side with a trail of thrust behind it, above three small stars, in cream and orange."),
  // Was an 8-bit mushroom, which OpenAI's safety system refused — it is close
  // enough to a Nintendo asset that a filter noticed, which is a useful second
  // opinion on the IP note at the top of this file. A pixel coin is ours.
  d("pixel-coin", "Пиксел монета", "GAMING", true,
    "A chunky 8-bit pixel-art coin seen face-on, a circle with a square hole and a highlight pixel, with two small sparkle pixels beside it, in warm gold and cream."),
  d("axe-rune", "Бойна брадва", "GAMING", true,
    "A double-headed viking battle axe seen face-on with invented rune marks etched on the blade, in cream and steel grey."),
  d("wolf-howl", "Вълкът", "GAMING", true,
    "A wolf's head howling in profile against a large full circle moon, geometric and graphic, in cream and pale blue."),
  d("phoenix", "Феникс", "GAMING", true,
    "A phoenix rising with spread wings and trailing flames, symmetrical and heraldic, in orange, gold and cream."),
  d("tower-defence", "Кулата", "GAMING", true,
    "A tall fantasy stone tower with a pointed roof and a banner, on a small rock, in cream and teal."),

  // ── Ергенско и моминско, графики ─────────────────────────────────────
  d("stag-beer", "Наздраве", "BACHELOR", true,
    "Two beer mugs clinking with foam and a few droplets flying, bold and graphic, in cream and warm amber."),
  d("stag-skull-hat", "Черепът с цилиндър", "BACHELOR", true,
    "A stylised skull wearing a top hat and a bow tie, clean and graphic, not gory, in cream."),
  d("hen-lips", "Целувка", "HEN", false,
    "A pair of stylised lips with a small heart beside them, in coral and blush."),
  d("hen-diamond", "Диамантът", "HEN", false,
    "A large faceted diamond seen face-on with small sparkles around it, in blush pink and pale gold."),

  // ── Празници ──────────────────────────────────────────────────────────
  d("christmas-tree", "Елха", "HOLIDAY", true,
    "A stylised triangular Christmas tree built from simple geometric layers with a star on top and small baubles, in deep green, cream and gold."),
  d("snowflake", "Снежинка", "HOLIDAY", true,
    "A single large six-armed snowflake with fine symmetrical detail, in pale blue and cream."),
  d("reindeer", "Еленът с шейната", "HOLIDAY", true,
    "A reindeer head seen face-on with large antlers and a round red nose, wearing a small scarf, in cream, red and green."),
  d("mimosa-branch", "Мартеница", "HOLIDAY", false,
    "Two small tassel figures, one white and one red, joined by twisted red and white cord, drawn cleanly, in red and cream on transparent."),
  d("spring-flowers", "Осми март", "HOLIDAY", false,
    "A small bunch of spring flowers — snowdrops and tulips — tied with a ribbon, in blush, sage and warm yellow."),

  // ── По професия ───────────────────────────────────────────────────────
  d("stethoscope", "Стетоскоп", "PROFESSION", false,
    "A stethoscope arranged so its tubing forms a heart shape, in charcoal and coral."),
  d("truck-road", "Камионът", "PROFESSION", true,
    "A long-haul lorry seen from the side on a short strip of road, with a small sun behind it, in cream and orange."),
  d("chef-knife", "Готвачът", "PROFESSION", false,
    "A chef's knife crossed with a whisk above a small sprig of herbs, in charcoal and sage."),
  d("hard-hat", "Строителят", "PROFESSION", true,
    "A hard hat above crossed spanner and hammer, in cream and warm yellow."),

  // ── Абитуриентски ─────────────────────────────────────────────────────
  d("grad-cap", "Шапката", "GRADUATION", true,
    "A graduation mortarboard cap thrown at an angle with its tassel flying, above a rolled diploma tied with ribbon, in cream and gold."),
  d("class-stars", "Випускът", "GRADUATION", true,
    "Three five-pointed stars in a rising arc with a small laurel branch beneath them, in cream and gold."),

  // ── Още любимци и хумор ──────────────────────────────────────────────
  d("cat-grumpy", "Намръщеното коте", "HUMOUR", false,
    "A round grumpy-looking cat sitting face-on with narrowed eyes and folded paws, in soft grey and cream."),
  d("plant-parent", "Родител на растения", "HUMOUR", false,
    "A potted monstera plant with two smaller pots beside it, in sage green and clay."),
  d("dog-paw-family", "Лапи в редица", "PETS", false,
    "Four dog paw prints of decreasing size walking in a diagonal line, in clay brown."),
];

/**
 * Silhouettes for the lettering designs. Solid black on transparency, so one
 * file serves a dark garment by being inverted rather than generated twice.
 */
const ICON_LOOK = `Solid flat black silhouette on a fully transparent background, \
crisp clean edges, centred with even margins, screen-print style. Pure black only — no grey, \
no gradients, no shading, no outline, no colour. NO text, no letters, no numbers, no watermark, \
no frame, no background.`;

const ic = (id: string, title: string, prompt: string): Design => ({
  id,
  title,
  category: "HUMOUR",
  forDark: false,
  iconOnly: true,
  prompt: `${prompt} ${ICON_LOOK}`,
});

export const DESIGN_ICONS: readonly Design[] = [
  ic("ico-couple", "Младоженци", "A simple silhouette of a groom in a suit standing beside a bride in a long dress, both facing forward, cartoon-simple and friendly."),
  ic("ico-bowtie", "Папийонка", "A single bow tie seen face-on."),
  ic("ico-tophat", "Цилиндър", "A top hat above a bow tie, stacked and centred."),
  ic("ico-men-row", "Мъже в редица", "Five men in suits standing side by side in a row, seen from the front, full-body silhouettes of slightly different heights."),
  ic("ico-beer-cheers", "Халби", "Two beer steins clinking together with a few droplets flying off."),
  ic("ico-shots", "Шотове", "Three shot glasses standing in a row, one slightly tilted."),
  ic("ico-ring", "Пръстен", "A single engagement ring with a faceted stone, seen from the side at a slight angle."),
  ic("ico-tiara", "Диадема", "A small tiara with five points, seen face-on."),
  ic("ico-heels", "Обувка", "A single high-heeled shoe seen from the side."),
  ic("ico-women-row", "Жени в редица", "Five women in dresses standing side by side in a row, seen from the front, full-body silhouettes with different hairstyles."),
  ic("ico-champagne", "Чаши шампанско", "Two champagne coupe glasses clinking, with a few small bubbles rising."),
  ic("ico-lips", "Устни", "A pair of stylised lips, seen face-on."),
  ic("ico-controller", "Контролер", "A modern game controller seen face-on."),
  ic("ico-dice", "Зар", "A twenty-sided polyhedral dice seen at a three-quarter angle."),
];

export function designById(id: string): Design | undefined {
  return DESIGNS.find((x) => x.id === id);
}

export function designsInCategory(category: DesignCategory): readonly Design[] {
  return DESIGNS.filter((x) => x.category === category && !x.iconOnly);
}

export function categoryMeta(id: DesignCategory): DesignCategoryMeta | undefined {
  return DESIGN_CATEGORIES.find((c) => c.id === id);
}

/** Where a design's artwork lives once generated. */
export function designImage(id: string): string {
  return `/designs/${id}.webp`;
}
