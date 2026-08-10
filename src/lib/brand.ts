/**
 * Brand identity in one place.
 *
 * The shop was launched as "Бисерите на моето дете", which named the customer's
 * child in the brand itself — so every visit that wasn't about a child (a
 * colleague's leaving gift, an anniversary, a dog) arrived somewhere that
 * clearly wasn't for them. The name is now occasion-neutral, and every surface
 * reads it from here rather than repeating a literal.
 */
export const BRAND = {
  name: "Повод",
  /** Used where the name alone is too bare, e.g. the OG title. */
  full: "Повод — персонализирани постери по снимка",
  tagline: "Подарък със собствено лице",
  /** One sentence, used as the default meta description. */
  description:
    "Превръщаме снимка в илюстрован постер за всеки повод — за дете, за колега, за двойка или за любимеца. Виждаш дизайна преди да платиш.",
  /** The four audiences, used as a strip under the hero and in the footer. */
  audiences: ["за дете", "за колега", "за двойка", "за любимец"],
} as const;
