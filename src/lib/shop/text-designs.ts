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
  category:
    | "BACHELOR"
    | "HEN"
    | "GAMING"
    | "HUMOUR"
    | "FAMILY"
    | "PROFESSION"
    | "FITNESS"
    | "TECH"
    | "PETS"
    | "GRADUATION"
    | "HOLIDAY";
  /** Drawn light, for dark garments. */
  forDark: boolean;
  /** Lines top to bottom. A line containing `{name}` is dropped when empty. */
  lines: readonly string[];
  /** Which line carries the weight — index into `lines`. */
  emphasis: number;
  layout: TextLayout;
  /** Tailwind-free hex, because this is rendered into SVG. */
  accent?: string;
  /**
   * A silhouette drawn above the lettering — an id from `DESIGN_ICONS`.
   *
   * This is the shape the Bulgarian market actually sells: a small black figure
   * over a phrase. "Кумът" alone is a word on a shirt; "Кумът" under a bow tie
   * is a stag-weekend shirt.
   */
  icon?: string;
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
  accent?: string,
  icon?: string
): TextDesign => ({
  id, title, category, forDark, lines, emphasis, layout, font, accent, icon,
});

export const TEXT_DESIGNS: readonly TextDesign[] = [
  // ── Ергенско ──────────────────────────────────────────────────────────
  t("txt-groom", "Младоженецът", "BACHELOR", true, ["МЛАДОЖЕНЕЦЪТ", "{name}"], 0, "SANS", "BANNER", undefined, "ico-couple"),
  t("txt-best-man", "Кумът", "BACHELOR", true, ["КУМЪТ", "{name}"], 0, "SANS", "BANNER", undefined, "ico-bowtie"),
  t("txt-groom-team", "Отборът на младоженеца", "BACHELOR", true, ["ОТБОРЪТ НА", "МЛАДОЖЕНЕЦА", "{name}"], 1, undefined, undefined, undefined, "ico-men-row"),
  t("txt-last-night", "Последна нощ на свобода", "BACHELOR", true, ["ПОСЛЕДНА НОЩ", "НА СВОБОДА"], 0, "SERIF", undefined, undefined, "ico-tophat"),
  t("txt-game-over", "Game Over", "BACHELOR", true, ["GAME", "OVER"], 1, "SANS", "STACK", "#C77D6B", "ico-couple"),
  t("txt-almost-married", "Почти женен", "BACHELOR", true, ["ПОЧТИ", "ЖЕНЕН"], 1, undefined, undefined, undefined, "ico-ring"),
  t("txt-new-management", "Под ново ръководство", "BACHELOR", true, ["ПОД НОВО", "РЪКОВОДСТВО"], 1, "SERIF", undefined, undefined, "ico-tophat"),
  t("txt-stag-do", "Ергенски запой", "BACHELOR", true, ["ЕРГЕНСКИ", "ЗАПОЙ", "{name}"], 1, undefined, undefined, undefined, "ico-beer-cheers"),
  t("txt-chief-drinker", "Главният пияница", "BACHELOR", true, ["ГЛАВНИЯТ", "ПИЯНИЦА"], 1, "ROUNDED", undefined, undefined, "ico-shots"),
  t("txt-last-charmer", "Последен сваляч", "BACHELOR", true, ["ПОСЛЕДЕН", "СВАЛЯЧ"], 1, "ROUNDED", undefined, undefined, "ico-heels"),
  t("txt-free-until", "Свободен до", "BACHELOR", true, ["СВОБОДЕН ДО", "{name}"], 0, "SERIF", "BANNER", undefined, "ico-ring"),
  t("txt-support-team", "Групата за подкрепа", "BACHELOR", true, ["ГРУПАТА ЗА", "ПОДКРЕПА"], 1, undefined, undefined, undefined, "ico-men-row"),

  // ── Моминско ──────────────────────────────────────────────────────────
  t("txt-bride", "Булката", "HEN", false, ["БУЛКАТА", "{name}"], 0, "SERIF", "BANNER", "#C77D6B", "ico-tiara"),
  t("txt-maid-of-honour", "Кумата", "HEN", false, ["КУМАТА", "{name}"], 0, "SERIF", "BANNER", "#C77D6B", "ico-heels"),
  t("txt-bride-team", "Отборът на булката", "HEN", false, ["ОТБОРЪТ НА", "БУЛКАТА", "{name}"], 1, "SERIF", undefined, undefined, "ico-women-row"),
  t("txt-she-said-yes", "Тя каза да", "HEN", false, ["ТЯ КАЗА", "ДА"], 1, "SERIF", "STACK", "#C77D6B", "ico-ring"),
  t("txt-last-hen", "Последно моминско", "HEN", false, ["ПОСЛЕДНО", "МОМИНСКО"], 1, "ROUNDED", undefined, undefined, "ico-champagne"),
  t("txt-still-free", "Още е свободна", "HEN", false, ["ОЩЕ Е", "СВОБОДНА"], 1, "ROUNDED", undefined, undefined, "ico-lips"),
  t("txt-hen-party", "Моминско парти", "HEN", false, ["МОМИНСКО", "ПАРТИ", "{name}"], 1, "SERIF", undefined, undefined, "ico-champagne"),
  t("txt-bride-squad", "Bride Squad", "HEN", false, ["BRIDE", "SQUAD"], 1, "SANS", "STACK", "#C77D6B", "ico-lips"),
  t("txt-future-mrs", "Бъдещата госпожа", "HEN", false, ["БЪДЕЩАТА", "ГОСПОЖА", "{name}"], 1, "SERIF", undefined, undefined, "ico-tiara"),
  t("txt-one-last-dance", "Един последен танц", "HEN", false, ["ЕДИН ПОСЛЕДЕН", "ТАНЦ"], 1, "SERIF", undefined, undefined, "ico-heels"),

  // ── Гейминг ───────────────────────────────────────────────────────────
  t("txt-gg", "GG WP", "GAMING", true, ["GG", "WP"], 0, "SANS", "STACK", "#7C5CFF", "ico-controller"),
  t("txt-one-more-game", "Още една игра", "GAMING", true, ["ОЩЕ ЕДНА", "ИГРА"], 1, undefined, undefined, undefined, "ico-dice"),
  t("txt-respawn", "Respawn", "GAMING", true, ["RESPAWN"], 0, "SANS", "BANNER", "#3FC1C9", "ico-controller"),
  t("txt-afk", "AFK живот", "GAMING", true, ["AFK", "ЖИВОТ"], 0, "SANS", "STACK", "#7C5CFF", "ico-controller"),
  t("txt-loading", "Зарежда се", "GAMING", true, ["ЗАРЕЖДА СЕ", "…"], 0, "ROUNDED"),
  t("txt-no-sleep", "Сънят е за слабите", "GAMING", true, ["СЪНЯТ Е ЗА", "СЛАБИТЕ"], 1, undefined, undefined, undefined, "ico-dice"),

  // ── Хумор и семейство ────────────────────────────────────────────────
  t("txt-coffee-first", "Първо кафе", "HUMOUR", false, ["ПЪРВО", "КАФЕ"], 1, "ROUNDED", "STACK", "#C77D6B", "ico-coffee"),
  t("txt-best-dad", "Най-добрият татко", "FAMILY", true, ["НАЙ-ДОБРИЯТ", "ТАТКО", "{name}"], 1, "SERIF", undefined, undefined, "ico-hands-heart"),
  t("txt-best-mum", "Най-добрата мама", "FAMILY", false, ["НАЙ-ДОБРАТА", "МАМА", "{name}"], 1, "SERIF", undefined, undefined, "ico-hands-heart"),

  // ── Ергенско, втора вълна ────────────────────────────────────────────
  t("txt-maybe-fooled", "Може би прецакан", "BACHELOR", true, ["МОЖЕ БИ", "ПРЕЦАКАН"], 1, "SANS", "STACK", undefined, "ico-couple"),
  t("txt-groom-oath", "Ергенска клетва", "BACHELOR", true, ["ЕРГЕНСКА", "КЛЕТВА"], 1, "SERIF", "BANNER", undefined, "ico-tophat"),
  t("txt-everything-allowed", "Днес всичко му е позволено", "BACHELOR", true, ["КУМ", "ДНЕС ВСИЧКО", "МУ Е ПОЗВОЛЕНО"], 0, "SANS", "BANNER", undefined, "ico-bowtie"),
  t("txt-boys-of-groom", "Момчетата на младоженеца", "BACHELOR", true, ["МОМЧЕТАТА НА", "МЛАДОЖЕНЕЦА"], 1, "SANS", "STACK", undefined, "ico-men-row"),
  t("txt-last-day-free", "Ерген за последен ден", "BACHELOR", true, ["{name} Е ЕРГЕН", "ЗА ПОСЛЕДЕН ДЕН"], 0, "SANS", "STACK", undefined, "ico-couple"),
  t("txt-drinking-team", "Отборът по пиене", "BACHELOR", true, ["ОТБОРЪТ", "ПО ПИЕНЕ"], 1, "SANS", "STACK", undefined, "ico-beer-cheers"),
  t("txt-caught", "Хванат", "BACHELOR", true, ["ХВАНАТ", "И ЩАСТЛИВ"], 0, "SERIF", "STACK", undefined, "ico-ring"),
  t("txt-groom-security", "Охраната на младоженеца", "BACHELOR", true, ["ОХРАНАТА НА", "МЛАДОЖЕНЕЦА"], 1, "SANS", "STACK", undefined, "ico-men-row"),
  t("txt-one-last-round", "Още по едно", "BACHELOR", true, ["ОЩЕ", "ПО ЕДНО"], 1, "ROUNDED", "STACK", undefined, "ico-shots"),
  t("txt-witness", "Свидетелят", "BACHELOR", true, ["СВИДЕТЕЛЯТ", "{name}"], 0, "SERIF", "BANNER", undefined, "ico-bowtie"),

  // ── Моминско, втора вълна ────────────────────────────────────────────
  t("txt-bride-squad-bg", "Отрядът на булката", "HEN", false, ["ОТРЯДЪТ НА", "БУЛКАТА"], 1, "SERIF", "STACK", "#C77D6B", "ico-women-row"),
  t("txt-bridesmaid", "Шаферка", "HEN", false, ["ШАФЕРКА", "{name}"], 0, "SERIF", "BANNER", "#C77D6B", "ico-heels"),
  t("txt-girls-of-bride", "Момичетата на булката", "HEN", false, ["МОМИЧЕТАТА НА", "БУЛКАТА"], 1, "SERIF", "STACK", undefined, "ico-women-row"),
  t("txt-bride-looking", "Кумата си търси белята", "HEN", false, ["КУМАТА", "СИ ТЪРСИ БЕЛЯТА"], 0, "ROUNDED", "STACK", "#C77D6B", "ico-lips"),
  t("txt-team-bride", "Team Bride", "HEN", false, ["TEAM", "BRIDE"], 1, "SERIF", "STACK", "#C77D6B", "ico-tiara"),
  t("txt-bride-to-be", "Bride to be", "HEN", false, ["BRIDE", "TO BE"], 0, "SERIF", "BANNER", "#C77D6B", "ico-ring"),
  t("txt-mother-of-bride", "Майката на булката", "HEN", false, ["МАЙКАТА НА", "БУЛКАТА"], 1, "SERIF", "STACK", undefined, "ico-tiara"),
  t("txt-last-free-night-hen", "Последна свободна нощ", "HEN", false, ["ПОСЛЕДНА", "СВОБОДНА НОЩ"], 1, "SERIF", "STACK", undefined, "ico-champagne"),
  t("txt-hen-drinking", "Пием за булката", "HEN", false, ["ПИЕМ ЗА", "БУЛКАТА"], 1, "ROUNDED", "STACK", undefined, "ico-champagne"),
  t("txt-hen-2026", "Моминско 2026", "HEN", false, ["МОМИНСКО", "2026"], 0, "SANS", "BANNER", "#C77D6B", "ico-tiara"),

  // ── Гейминг ───────────────────────────────────────────────────────────
  t("txt-just-one-more", "Само още един рунд", "GAMING", true, ["САМО ОЩЕ", "ЕДИН РУНД"], 1, "SANS", "STACK", "#7C5CFF", "ico-controller"),
  t("txt-noob", "Не съм нуб", "GAMING", true, ["НЕ СЪМ НУБ", "ЛАГВА"], 0, "SANS", "STACK", undefined, "ico-controller"),
  t("txt-lvl-up", "Ниво нагоре", "GAMING", true, ["НИВО", "НАГОРЕ"], 1, "SANS", "STACK", "#3FC1C9", "ico-dice"),
  t("txt-critical-hit", "Критичен удар", "GAMING", true, ["КРИТИЧЕН", "УДАР"], 1, "SANS", "STACK", "#C77D6B", "ico-dice"),
  t("txt-save-point", "Точка за запис", "GAMING", true, ["ТОЧКА", "ЗА ЗАПИС"], 1, "ROUNDED", "STACK", undefined, "ico-controller"),
  t("txt-offline", "Офлайн съм", "GAMING", true, ["ОФЛАЙН", "СЪМ"], 1, "SANS", "STACK", undefined, "ico-controller"),

  // ── Семейство ─────────────────────────────────────────────────────────
  t("txt-best-grandma", "Най-добрата баба", "FAMILY", false, ["НАЙ-ДОБРАТА", "БАБА", "{name}"], 1, "SERIF", undefined, undefined, "ico-hands-heart"),
  t("txt-best-grandpa", "Най-добрият дядо", "FAMILY", true, ["НАЙ-ДОБРИЯТ", "ДЯДО", "{name}"], 1, "SERIF", undefined, undefined, "ico-hands-heart"),
  t("txt-big-brother", "Голямото братче", "FAMILY", false, ["ГОЛЯМОТО", "БРАТЧЕ"], 1, "ROUNDED", undefined, undefined, "ico-baby"),
  t("txt-big-sister", "Голямата сестричка", "FAMILY", false, ["ГОЛЯМАТА", "СЕСТРИЧКА"], 1, "ROUNDED", undefined, undefined, "ico-baby"),
  t("txt-new-baby-2026", "Скоро идвам", "FAMILY", false, ["СКОРО", "ИДВАМ"], 1, "ROUNDED", undefined, undefined, "ico-baby"),
  t("txt-family-name", "Семейство", "FAMILY", true, ["СЕМЕЙСТВО", "{name}"], 1, "SERIF", "BANNER", undefined, "ico-hands-heart"),

  // ── Професии ──────────────────────────────────────────────────────────
  t("txt-nurse", "Медицинска сестра", "PROFESSION", false, ["СПАСЯВАМ ЖИВОТ", "И ПИЯ КАФЕ"], 0, "ROUNDED", undefined, undefined, "ico-coffee"),
  t("txt-driver", "Шофьор", "PROFESSION", true, ["ЖИВОТЪТ Е", "ПЪТ"], 1, "SERIF", undefined, undefined, "ico-car"),
  t("txt-teacher-year", "Най-добрият учител", "PROFESSION", false, ["НАЙ-ДОБРИЯТ", "УЧИТЕЛ", "{name}"], 1, "SERIF", undefined, undefined, "ico-cake"),
  t("txt-chef", "Готвачът", "PROFESSION", false, ["ГОТВЯ", "СЛЕДОВАТЕЛНО СЪМ"], 0, "SERIF", undefined, undefined, "ico-chef-hat"),
  t("txt-builder", "Майсторът", "PROFESSION", true, ["МАЙСТОРЪТ", "{name}"], 0, "SANS", "BANNER", undefined, "ico-car"),

  // ── Фитнес и IT ───────────────────────────────────────────────────────
  t("txt-no-excuses", "Без извинения", "FITNESS", true, ["БЕЗ", "ИЗВИНЕНИЯ"], 1, "SANS", undefined, undefined, "ico-dumbbell"),
  t("txt-leg-day", "Ден за крака", "FITNESS", true, ["ДЕН ЗА", "КРАКА"], 1, "SANS", undefined, undefined, "ico-dumbbell"),
  t("txt-works-on-mine", "При мен работи", "TECH", true, ["ПРИ МЕН", "РАБОТИ"], 1, "ROUNDED", undefined, undefined, "ico-laptop"),
  t("txt-ctrl-z", "Ctrl + Z", "TECH", true, ["CTRL", "+ Z"], 0, "SANS", "STACK", "#3FC1C9", "ico-laptop"),

  // ── Любимци и хумор ───────────────────────────────────────────────────
  t("txt-dog-dad", "Кучешки татко", "PETS", true, ["КУЧЕШКИ", "ТАТКО"], 1, "ROUNDED", undefined, undefined, "ico-dog"),
  t("txt-cat-mum", "Котешка мама", "PETS", false, ["КОТЕШКА", "МАМА"], 1, "ROUNDED", undefined, undefined, "ico-cat"),
  t("txt-dog-name", "Кучето се казва", "PETS", false, ["КУЧЕТО СЕ КАЗВА", "{name}"], 1, "SERIF", "BANNER", undefined, "ico-paw"),
  t("txt-not-today", "Днес не", "HUMOUR", true, ["ДНЕС", "НЕ"], 1, "SANS", undefined, undefined, "ico-coffee"),
  t("txt-nap-first", "Първо дрямка", "HUMOUR", false, ["ПЪРВО", "ДРЯМКА"], 1, "ROUNDED", undefined, undefined, "ico-cat"),
  t("txt-weekend", "Уикендът е характер", "HUMOUR", true, ["УИКЕНДЪТ", "Е ХАРАКТЕР"], 1, "SERIF", undefined, undefined, "ico-coffee"),

  // ── Абитуриентски и празници ─────────────────────────────────────────
  t("txt-class-2026", "Випуск 2026", "GRADUATION", true, ["ВИПУСК", "2026"], 1, "SERIF", "BANNER", undefined, "ico-grad-cap"),
  t("txt-graduated", "Успях", "GRADUATION", true, ["УСПЯХ", "{name}"], 0, "SERIF", "BANNER", undefined, "ico-grad-cap"),
  t("txt-merry", "Весела Коледа", "HOLIDAY", true, ["ВЕСЕЛА", "КОЛЕДА"], 1, "SERIF", undefined, undefined, "ico-tree"),
  t("txt-new-year", "Честита Нова година", "HOLIDAY", true, ["ЧЕСТИТА", "НОВА ГОДИНА"], 1, "SERIF", undefined, undefined, "ico-snow"),
  t("txt-first-christmas", "Първата ми Коледа", "HOLIDAY", false, ["ПЪРВАТА МИ", "КОЛЕДА"], 1, "ROUNDED", undefined, undefined, "ico-tree"),
  t("txt-getting-married", "Женя се", "BACHELOR", true, ["{name}", "СЕ ЖЕНИ"], 0, "SANS", "STACK", undefined, "ico-couple"),
  t("txt-wedding-day", "Сватбата на", "HEN", false, ["СВАТБАТА НА", "{name}"], 0, "SERIF", "BANNER", "#C77D6B", "ico-ring"),
  t("txt-just-married", "Младоженци", "HEN", false, ["МЛАДОЖЕНЦИ", "{name}"], 0, "SERIF", "BANNER", "#C77D6B", "ico-couple"),
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
