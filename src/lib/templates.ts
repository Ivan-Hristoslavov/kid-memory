/**
 * Poster templates — the single source of truth for what a poster can be.
 *
 * The shop launched children-only, which tied its whole revenue to a handful of
 * dates: 1 юни, Коледа, 8 март. A seasonal campaign could repaint the home page
 * for any occasion, but the wizard still asked for a child's name, age and
 * gender — so an "подарък за колежка" visitor landed on a form that made no
 * sense and left. A template decides what the wizard asks, what the AI is told
 * to draw and which occasions the poster is sold against; the photo, the art
 * styles, printing, delivery and checkout stay shared.
 *
 * Everything a template changes lives in this file. UI copy only — the prompt
 * side is in `lib/ai/template-prompt.ts` so it never reaches the client bundle.
 */

/** Poster templates, in the order the picker shows them. */
export const TEMPLATE_ORDER = [
  "KID_WORDS",
  "PORTRAIT_LINES",
  "PET",
  "COUPLE",
  "BABY_STATS",
] as const;

export type TemplateId = (typeof TEMPLATE_ORDER)[number];

/** The original product, and what an order without a template means. */
export const DEFAULT_TEMPLATE: TemplateId = "KID_WORDS";

/**
 * The poster prompt positions bubbles into six named areas; more than that and
 * the model starts stacking them or dropping the extras silently.
 */
export const MAX_POSTER_LINES = 6;

/** Whether a subject field is asked for, and whether it may be left empty. */
export type FieldMode = "required" | "optional" | "none";

/** One line of text on the poster: a big line, optionally a small one under it. */
export interface PosterLine {
  /** The large line — the mispronunciation, the quote, the habit. */
  text: string;
  /** The small line under it, in brackets. Empty when the template has none. */
  sub?: string;
  /** Optional small object drawn beside the bubble. */
  visual?: string;
}

/**
 * Whoever is on the poster — a child, a colleague, a dog. Fields beyond `name`
 * and `lines` are only filled when the template asks for them.
 */
export interface PosterSubject {
  name: string;
  /** Years. Halves allowed for toddlers (2.5). Null when not asked. */
  age?: number | null;
  /** Internal, template-neutral. Labels differ per template. */
  gender?: "MALE" | "FEMALE" | null;
  /** "колежка", "учителка" — context for the poster's wording. */
  relation?: string;
  /** Breed or kind, pets only. */
  species?: string;
  lines: PosterLine[];
}

export interface PosterTemplateDef {
  id: TemplateId;
  /** Card title in the picker. */
  name: string;
  /** One line under the title — what the poster actually is. */
  tagline: string;
  /** lucide-react icon name, resolved through lib/icons.ts. */
  icon: string;
  /** Tailwind gradient pair, matching the style cards. */
  gradient: string;
  /** Occasion chips on the picker card — this is the "when would I buy it". */
  occasions: readonly string[];

  subject: {
    /** "детето" — drives copy like "Име на детето". */
    noun: string;
    /** "децата" */
    nounPlural: string;
    min: number;
    max: number;
    /** Copy on the "add another" button. Null when max is 1. */
    addLabel: string | null;
    age: FieldMode;
    /** Upper bound for the age picker. */
    ageMax: number;
    gender: FieldMode;
    /** [male, female] — a dog is "Мъжко", a colleague is "Мъж". */
    genderLabels: readonly [string, string];
    relation: FieldMode;
    species: FieldMode;
  };

  lines: {
    heading: string;
    /** One sentence explaining the mechanic, shown above the fields. */
    help: string;
    textLabel: string;
    textPlaceholder: string;
    /** Null means this template has no second line in its bubbles. */
    subLabel: string | null;
    subPlaceholder: string;
    subRequired: boolean;
    min: number;
    max: number;
    /** Shown as inspiration — people freeze on an empty first row. */
    examples: readonly { text: string; sub?: string }[];
  };

  /** Shown on the uploader; a good pet photo is not a good portrait photo. */
  photoHint: string;

  /**
   * Keeps a template resolvable for past orders and admin while hiding it from
   * the storefront — same contract as `PRODUCTS.available` in the catalog.
   */
  available: boolean;
}

export const TEMPLATES: Record<TemplateId, PosterTemplateDef> = {
  KID_WORDS: {
    id: "KID_WORDS",
    name: "Бисерите на детето",
    tagline: "Смешните думички, които казва грешно — преди да ги научи правилно.",
    icon: "Baby",
    gradient: "from-peach to-sun",
    occasions: ["Рожден ден", "1-ви юни", "Коледа", "Първи учебен ден", "Просто така"],
    subject: {
      noun: "детето",
      nounPlural: "децата",
      min: 1,
      max: 3,
      addLabel: "Добави още дете (братче / сестриче)",
      age: "required",
      ageMax: 18,
      gender: "required",
      genderLabels: ["Момче", "Момиче"],
      relation: "none",
      species: "none",
    },
    lines: {
      heading: "Добави бисерите",
      help: "Всяко балонче показва думичката както детето я казва, а отдолу дребно — истинската. Точно това е шегата.",
      textLabel: "Както я казва",
      textPlaceholder: "лисапед",
      subLabel: "Истинската дума",
      subPlaceholder: "велосипед",
      subRequired: true,
      min: 1,
      max: MAX_POSTER_LINES,
      examples: [
        { text: "лисапед", sub: "велосипед" },
        { text: "пусосмукачка", sub: "прахосмукачка" },
        { text: "шоколата", sub: "шоколад" },
      ],
    },
    photoHint: "Ясно лице към камерата, добра светлина, отблизо.",
    available: true,
  },

  PORTRAIT_LINES: {
    id: "PORTRAIT_LINES",
    name: "Портрет с реплики",
    tagline: "За колега, приятел или учител — с изреченията, които всички му знаят.",
    icon: "Quote",
    gradient: "from-cream to-peach",
    occasions: [
      "Рожден ден",
      "Изпращане на колега",
      "Пенсиониране",
      "Подарък за учител",
      "Дипломиране",
      "Благодарност",
    ],
    subject: {
      noun: "човека",
      nounPlural: "хората",
      min: 1,
      max: 3,
      addLabel: "Добави още човек",
      // A birthday poster often wants the round number on it, but nobody should
      // be forced to state a colleague's age to buy them a gift.
      age: "optional",
      ageMax: 100,
      gender: "required",
      genderLabels: ["Мъж", "Жена"],
      relation: "optional",
      species: "none",
    },
    lines: {
      heading: "Добави репликите",
      help: "Изреченията, които този човек повтаря и всички около него разпознават веднага.",
      textLabel: "Репликата",
      textPlaceholder: "Ще го оправим в понеделник",
      subLabel: "Кога я казва (по избор)",
      subPlaceholder: "всеки петък в 17:30",
      subRequired: false,
      min: 1,
      max: MAX_POSTER_LINES,
      examples: [
        { text: "Ще го оправим в понеделник", sub: "всеки петък в 17:30" },
        { text: "Първо кафе, после проблеми" },
        { text: "Аз само за пет минути" },
      ],
    },
    photoHint: "Снимка в цял ръст или до кръста работи най-добре за портрет.",
    available: true,
  },

  PET: {
    id: "PET",
    name: "Любимецът",
    tagline: "Кучето, котката или папагалът — с всичко, което прави само то.",
    icon: "PawPrint",
    gradient: "from-blush to-peach",
    occasions: [
      "Рожден ден на любимеца",
      "Нов дом",
      "В памет",
      "Подарък за собственика",
      "Просто така",
    ],
    subject: {
      noun: "любимеца",
      nounPlural: "любимците",
      min: 1,
      max: 3,
      addLabel: "Добави още любимец",
      age: "optional",
      ageMax: 30,
      gender: "optional",
      genderLabels: ["Мъжко", "Женско"],
      relation: "none",
      species: "required",
    },
    lines: {
      heading: "Какво прави само то",
      help: "Навиците, заради които се смеете вкъщи. Едно изречение на балонче.",
      textLabel: "Навикът",
      textPlaceholder: "Лае по прахосмукачката",
      subLabel: null,
      subPlaceholder: "",
      subRequired: false,
      min: 1,
      max: MAX_POSTER_LINES,
      examples: [
        { text: "Лае по прахосмукачката" },
        { text: "Спи точно върху клавиатурата" },
        { text: "Краде чорапи и ги крие" },
      ],
    },
    photoHint: "Снимка на нивото на очите на животното, без силна светкавица.",
    available: true,
  },

  COUPLE: {
    id: "COUPLE",
    name: "Двойка",
    tagline: "Двамата заедно — с вътрешните шеги, които никой друг не разбира.",
    icon: "Heart",
    gradient: "from-cream to-blush",
    occasions: ["Годишнина", "Сватба", "Свети Валентин", "Годеж"],
    subject: {
      noun: "човека",
      nounPlural: "двамата",
      // A couple is exactly two — anything else is the PORTRAIT_LINES template.
      min: 2,
      max: 2,
      addLabel: null,
      age: "none",
      ageMax: 100,
      gender: "required",
      genderLabels: ["Мъж", "Жена"],
      relation: "none",
      species: "none",
    },
    lines: {
      heading: "Вашите изречения",
      help: "Вътрешните шеги и репликите, които се повтарят между вас двамата.",
      textLabel: "Репликата",
      textPlaceholder: "Аз не хъркам",
      subLabel: "Кой я казва (по избор)",
      subPlaceholder: "Иван",
      subRequired: false,
      min: 1,
      max: MAX_POSTER_LINES,
      examples: [
        { text: "Аз не хъркам", sub: "Иван" },
        { text: "Тръгваме след 5 минути", sub: "Мария" },
        { text: "Ти избери филма" },
      ],
    },
    photoHint: "Обща снимка, на която и двете лица се виждат ясно.",
    available: true,
  },

  BABY_STATS: {
    id: "BABY_STATS",
    name: "Данни от раждането",
    tagline: "Първата снимка с теглото, ръста и часа — за детската стая.",
    icon: "Sparkles",
    gradient: "from-peach to-blush",
    occasions: ["Раждане", "Изписване", "Кръщене", "Първи рожден ден"],
    subject: {
      noun: "бебето",
      nounPlural: "бебетата",
      // Twins fit; triplets share one photo badly at poster size.
      min: 1,
      max: 2,
      addLabel: "Добави близнак",
      age: "none",
      ageMax: 1,
      gender: "required",
      genderLabels: ["Момче", "Момиче"],
      relation: "none",
      species: "none",
    },
    lines: {
      heading: "Данните от раждането",
      help: "Числата, които се помнят цял живот. Стойността се изписва едро, а какво е — дребно отдолу.",
      textLabel: "Стойност",
      textPlaceholder: "3.450 кг",
      subLabel: "Какво е",
      subPlaceholder: "тегло",
      subRequired: true,
      min: 1,
      max: MAX_POSTER_LINES,
      examples: [
        { text: "3.450 кг", sub: "тегло" },
        { text: "52 см", sub: "ръст" },
        { text: "14:20", sub: "час на раждане" },
        { text: "12.03.2026", sub: "дата" },
      ],
    },
    photoHint: "Снимка отблизо, при мека естествена светлина.",
    available: true,
  },
};

/** Templates currently on sale, in display order. */
export const AVAILABLE_TEMPLATES = TEMPLATE_ORDER.filter(
  (id) => TEMPLATES[id].available
) as readonly TemplateId[];

export function isTemplateId(value: unknown): value is TemplateId {
  return typeof value === "string" && value in TEMPLATES;
}

/**
 * Resolves any stored or user-supplied value to a template, falling back to the
 * original product. Never throws — an order from before templates existed, or a
 * hand-typed `?template=` in the URL, must still render a working wizard.
 */
export function getTemplate(value: unknown): PosterTemplateDef {
  return isTemplateId(value) ? TEMPLATES[value] : TEMPLATES[DEFAULT_TEMPLATE];
}

/**
 * Subjects for an order, mapping the legacy `children` shape across for rows
 * written before templates existed. Every read path must go through this —
 * reading `subjects` directly returns `[]` for every historical order.
 */
export function orderSubjects(order: {
  subjects?: unknown;
  children?: unknown;
}): PosterSubject[] {
  if (Array.isArray(order.subjects) && order.subjects.length > 0) {
    return order.subjects as PosterSubject[];
  }
  if (!Array.isArray(order.children)) return [];
  return (order.children as LegacyChild[]).map((c) => ({
    name: c.name,
    age: typeof c.age === "number" ? c.age : null,
    gender: c.gender === "GIRL" ? "FEMALE" : "MALE",
    // The legacy pair is stored the other way round to how it prints: the
    // mispronunciation is the big line, the real word the small one.
    lines: (c.words ?? []).map((w) => ({
      text: w.saidAs,
      sub: w.word,
      visual: w.visual,
    })),
  }));
}

interface LegacyChild {
  name: string;
  age?: number;
  gender?: "BOY" | "GIRL";
  words?: { word: string; saidAs: string; visual?: string }[];
}

/** "Мила", "Мила и Борис", "Мила, Борис и Ема" */
export function joinNames(names: string[]): string {
  const clean = names.filter(Boolean);
  if (clean.length <= 1) return clean[0] ?? "";
  return `${clean.slice(0, -1).join(", ")} и ${clean.at(-1)}`;
}

/**
 * What each marketing sample in `public/samples/{style}.webp` actually depicts.
 *
 * The files are keyed by art style because that is what the Showcase grid and
 * the hero deck iterate over, but the posters themselves are spread across the
 * templates so the grid stops looking like a children's catalogue. This map is
 * the only thing tying the two together — keep it in step with the SAMPLES list
 * in `scripts/gen-samples.mjs`, or the captions will describe the wrong poster.
 */
export const SAMPLE_POSTERS: Record<
  string,
  { template: TemplateId; caption: string }
> = {
  realistic: { template: "PORTRAIT_LINES", caption: "Цитатите на Митко" },
  storybook: { template: "KID_WORDS", caption: "Думичките на Боби" },
  disney: { template: "PET", caption: "Такъв е Рекс" },
  caricature: { template: "COUPLE", caption: "Мария и Иван" },
  watercolor: { template: "BABY_STATS", caption: "Добре дошла, Ема" },
  fantasy: { template: "KID_WORDS", caption: "Думичките на Ани и Алекс" },
};

/**
 * The occasion grid on the home page. Each entry links into the wizard with its
 * template preselected, so the promise on the card is the form the visitor
 * actually gets. Deliberately spread across the calendar — the seasonal
 * campaigns cover the peaks, this covers the flat months.
 */
export const OCCASIONS: readonly {
  title: string;
  text: string;
  icon: string;
  template: TemplateId;
  /**
   * The sample poster shown on the card. Normally public/occasions/{slug}.webp
   * from scripts/gen-occasions.mjs, but any correct poster beats a bespoke one
   * with a spelling slip in it.
   */
  image: string;
  /** What this occasion's poster looks like. Alt text for the card image. */
  alt: string;
}[] = [
  {
    title: "Рожден ден",
    text: "Подарък, който детето ще пази и след години.",
    icon: "Cake",
    template: "KID_WORDS",
    // Borrows the storybook sample. Its own artwork came back four times with
    // the joke broken — the model kept autocorrecting the mispronounced word
    // („шоколата“ → „ШОКО-ЛАДЪ“), and a misspelt poster on the home page reads
    // as a printing defect. Point this back at /occasions/rozhden-den.webp when
    // a run produces a clean one.
    image: "/samples/storybook.webp",
    alt: "Постер за детски рожден ден с думичките на тригодишно момче",
  },
  {
    title: "Рожден ден на колега",
    text: "Репликите, които всички в офиса му знаят наизуст.",
    icon: "PartyPopper",
    template: "PORTRAIT_LINES",
    image: "/occasions/kolega-rozhden-den.webp",
    alt: "Постер за рожден ден на колежка с любимите ѝ офис реплики",
  },
  {
    title: "Изпращане на колега",
    text: "По-добро от картичка с подписи — и остава на стената.",
    icon: "Quote",
    template: "PORTRAIT_LINES",
    image: "/occasions/izprashtane.webp",
    alt: "Постер за изпращане на колега с репликите, по които ще липсва",
  },
  {
    title: "Подарък за учител",
    text: "Изреченията, които цял клас повтаря след него.",
    icon: "GraduationCap",
    template: "PORTRAIT_LINES",
    image: "/occasions/uchitel.webp",
    alt: "Постер подарък за учителка с изреченията, които класът ѝ знае наизуст",
  },
  {
    title: "Годишнина",
    text: "Вътрешните шеги, които само двамата разбирате.",
    icon: "Heart",
    template: "COUPLE",
    image: "/occasions/godishnina.webp",
    alt: "Постер за годишнина на двойка с вътрешните им шеги",
  },
  {
    title: "Раждане и кръщене",
    text: "Тегло, ръст и час — до първата снимка.",
    icon: "Sparkles",
    template: "BABY_STATS",
    image: "/occasions/razhdane.webp",
    alt: "Постер за новородено с тегло, ръст и час на раждане",
  },
  {
    title: "За любимеца",
    text: "Всичко, което прави само то — на стената.",
    icon: "PawPrint",
    template: "PET",
    image: "/occasions/lyubimets.webp",
    alt: "Постер за домашен любимец с навиците на котка",
  },
  {
    title: "1-ви юни",
    text: "Празникът на детето — с неговите думички.",
    icon: "Sun",
    template: "KID_WORDS",
    image: "/occasions/purvi-yuni.webp",
    alt: "Постер за 1-ви юни с думичките на две деца",
  },
  {
    title: "Коледа",
    text: "Топъл подарък под елхата.",
    icon: "Snowflake",
    template: "KID_WORDS",
    image: "/occasions/koleda.webp",
    alt: "Коледен постер с думичките на четиригодишно момче",
  },
];
