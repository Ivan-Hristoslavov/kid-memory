/**
 * Text designs, drawn as SVG rather than generated as pictures.
 *
 * The competitor's stag and hen ranges are almost entirely lettering — "Кумът",
 * "Младоженецът", "Под ново ръководство" — and that is what sells for those
 * occasions. We cannot generate them: image models garble small type, and an
 * earlier run of this project produced "CIFTS" and "CITTE FOR EERE ROMENTS" on
 * assets that had to be thrown away. Cyrillic is worse, not better.
 *
 * So these are set, not drawn. The advantages compound:
 *
 *   - correct Bulgarian, every time, because it is a string
 *   - vector, so it is sharp at any zoom and print-ready without upscaling
 *   - free to add one, which matters when a range wants forty phrases
 *   - a name can be dropped in, which is the personalisation people pay for
 *
 * `{name}` in a line is replaced with whatever the customer typed in the text
 * field, or dropped along with its line when they typed nothing. That is the
 * difference between "Кумът" and "Кумът Мартин" without a second design.
 */

export type TextLayout = "STACK" | "BANNER";

export interface TextDesign {
  id: string;
  title: string;
  category: "BACHELOR" | "HEN" | "GAMING" | "HUMOUR" | "FAMILY";
  /** Drawn light, for dark garments. */
  forDark: boolean;
  /** Lines top to bottom. A line containing `{name}` is dropped when empty. */
  lines: readonly string[];
  /** Which line carries the weight — index into `lines`. */
  emphasis: number;
  layout: TextLayout;
  /** Tailwind-free hex, because this is rendered into SVG. */
  accent?: string;
  font: "SERIF" | "ROUNDED" | "SANS";
}

const t = (
  id: string,
  title: string,
  category: TextDesign["category"],
  forDark: boolean,
  lines: string[],
  emphasis: number,
  font: TextDesign["font"] = "SANS",
  layout: TextLayout = "STACK",
  accent?: string
): TextDesign => ({ id, title, category, forDark, lines, emphasis, layout, font, accent });

export const TEXT_DESIGNS: readonly TextDesign[] = [
  // ── Ергенско ──────────────────────────────────────────────────────────
  t("txt-groom", "Младоженецът", "BACHELOR", true, ["МЛАДОЖЕНЕЦЪТ", "{name}"], 0, "SANS", "BANNER"),
  t("txt-best-man", "Кумът", "BACHELOR", true, ["КУМЪТ", "{name}"], 0, "SANS", "BANNER"),
  t("txt-groom-team", "Отборът на младоженеца", "BACHELOR", true, ["ОТБОРЪТ НА", "МЛАДОЖЕНЕЦА", "{name}"], 1),
  t("txt-last-night", "Последна нощ на свобода", "BACHELOR", true, ["ПОСЛЕДНА НОЩ", "НА СВОБОДА"], 0, "SERIF"),
  t("txt-game-over", "Game Over", "BACHELOR", true, ["GAME", "OVER"], 1, "SANS", "STACK", "#C77D6B"),
  t("txt-almost-married", "Почти женен", "BACHELOR", true, ["ПОЧТИ", "ЖЕНЕН"], 1),
  t("txt-new-management", "Под ново ръководство", "BACHELOR", true, ["ПОД НОВО", "РЪКОВОДСТВО"], 1, "SERIF"),
  t("txt-stag-do", "Ергенски запой", "BACHELOR", true, ["ЕРГЕНСКИ", "ЗАПОЙ", "{name}"], 1),
  t("txt-chief-drinker", "Главният пияница", "BACHELOR", true, ["ГЛАВНИЯТ", "ПИЯНИЦА"], 1, "ROUNDED"),
  t("txt-last-charmer", "Последен сваляч", "BACHELOR", true, ["ПОСЛЕДЕН", "СВАЛЯЧ"], 1, "ROUNDED"),
  t("txt-free-until", "Свободен до", "BACHELOR", true, ["СВОБОДЕН ДО", "{name}"], 0, "SERIF", "BANNER"),
  t("txt-support-team", "Групата за подкрепа", "BACHELOR", true, ["ГРУПАТА ЗА", "ПОДКРЕПА"], 1),

  // ── Моминско ──────────────────────────────────────────────────────────
  t("txt-bride", "Булката", "HEN", false, ["БУЛКАТА", "{name}"], 0, "SERIF", "BANNER", "#C77D6B"),
  t("txt-maid-of-honour", "Кумата", "HEN", false, ["КУМАТА", "{name}"], 0, "SERIF", "BANNER", "#C77D6B"),
  t("txt-bride-team", "Отборът на булката", "HEN", false, ["ОТБОРЪТ НА", "БУЛКАТА", "{name}"], 1, "SERIF"),
  t("txt-she-said-yes", "Тя каза да", "HEN", false, ["ТЯ КАЗА", "ДА"], 1, "SERIF", "STACK", "#C77D6B"),
  t("txt-last-hen", "Последно моминско", "HEN", false, ["ПОСЛЕДНО", "МОМИНСКО"], 1, "ROUNDED"),
  t("txt-still-free", "Още е свободна", "HEN", false, ["ОЩЕ Е", "СВОБОДНА"], 1, "ROUNDED"),
  t("txt-hen-party", "Моминско парти", "HEN", false, ["МОМИНСКО", "ПАРТИ", "{name}"], 1, "SERIF"),
  t("txt-bride-squad", "Bride Squad", "HEN", false, ["BRIDE", "SQUAD"], 1, "SANS", "STACK", "#C77D6B"),
  t("txt-future-mrs", "Бъдещата госпожа", "HEN", false, ["БЪДЕЩАТА", "ГОСПОЖА", "{name}"], 1, "SERIF"),
  t("txt-one-last-dance", "Един последен танц", "HEN", false, ["ЕДИН ПОСЛЕДЕН", "ТАНЦ"], 1, "SERIF"),

  // ── Гейминг ───────────────────────────────────────────────────────────
  t("txt-gg", "GG WP", "GAMING", true, ["GG", "WP"], 0, "SANS", "STACK", "#7C5CFF"),
  t("txt-one-more-game", "Още една игра", "GAMING", true, ["ОЩЕ ЕДНА", "ИГРА"], 1),
  t("txt-respawn", "Respawn", "GAMING", true, ["RESPAWN"], 0, "SANS", "BANNER", "#3FC1C9"),
  t("txt-afk", "AFK живот", "GAMING", true, ["AFK", "ЖИВОТ"], 0, "SANS", "STACK", "#7C5CFF"),
  t("txt-loading", "Зарежда се", "GAMING", true, ["ЗАРЕЖДА СЕ", "…"], 0, "ROUNDED"),
  t("txt-no-sleep", "Сънят е за слабите", "GAMING", true, ["СЪНЯТ Е ЗА", "СЛАБИТЕ"], 1),

  // ── Хумор и семейство ────────────────────────────────────────────────
  t("txt-coffee-first", "Първо кафе", "HUMOUR", false, ["ПЪРВО", "КАФЕ"], 1, "ROUNDED", "STACK", "#C77D6B"),
  t("txt-best-dad", "Най-добрият татко", "FAMILY", true, ["НАЙ-ДОБРИЯТ", "ТАТКО", "{name}"], 1, "SERIF"),
  t("txt-best-mum", "Най-добрата мама", "FAMILY", false, ["НАЙ-ДОБРАТА", "МАМА", "{name}"], 1, "SERIF"),
];

export function textDesignById(id: string): TextDesign | undefined {
  return TEXT_DESIGNS.find((d) => d.id === id);
}

/**
 * The lines to actually draw, with `{name}` resolved.
 *
 * A line that is nothing but an empty name is removed rather than left as a
 * blank row, so "Кумът" with no name typed is a design in its own right and not
 * a design with a hole under it.
 */
export function resolveLines(design: TextDesign, name: string): string[] {
  const clean = name.trim();
  return design.lines
    .map((l) => l.replace("{name}", clean))
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}
