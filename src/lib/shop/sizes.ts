/**
 * Size charts, in centimetres, from the supplier's own product descriptions.
 *
 * Nine sizes and no measurements is how a shop earns returns it cannot accept:
 * a personalised garment is exempt from the distance-selling right of
 * withdrawal, so a wrong size is not a return — it is a customer who is stuck
 * with it and tells people so. A table is the cheapest insurance the site can
 * buy.
 *
 * Read from `inner_product.description_uses` in their panel rather than typed
 * from a generic chart, because "L" means whatever the manufacturer says it
 * means and Fruit of the Loom's L is not Stanley/Stella's.
 *
 * Garments with no chart are absent rather than guessed. `sizeChart` returns
 * undefined and the product page simply does not show the section — an invented
 * measurement is worse than none, because somebody would buy against it.
 */

export interface SizeChart {
  /** Column headings after the size name, e.g. ["Ширина", "Дължина"]. */
  columns: readonly string[];
  /** Rows of [size, ...measurements], all in centimetres. */
  rows: readonly (readonly string[])[];
  /** Their own washing note, identical across the range. */
  care?: boolean;
}

const WIDTH_LENGTH = ["Ширина", "Дължина"] as const;
const HIP_LENGTH = ["Ханш обиколка", "Дължина"] as const;

const CHARTS: Readonly<Record<string, SizeChart>> = {
  // Мъжка тениска
  c: {
    columns: WIDTH_LENGTH,
    rows: [
      ["S", "51", "71"], ["M", "53", "73"], ["L", "55", "75"],
      ["XL", "58", "77"], ["2XL", "61", "79"], ["3XL", "64", "81"],
    ],
    care: true,
  },
  // Дамска тениска
  ce: {
    columns: WIDTH_LENGTH,
    rows: [
      ["S", "45", "65"], ["M", "47", "67"], ["L", "49", "69"],
      ["XL", "51", "71"], ["2XL", "53", "72"], ["3XL", "55", "73"],
    ],
    care: true,
  },
  // Унисекс овърсайз тениска
  iidf: {
    columns: WIDTH_LENGTH,
    rows: [
      ["S", "60", "72"], ["M", "62", "74"], ["L", "64", "76"],
      ["XL", "66", "78"], ["2XL", "68", "80"],
    ],
    care: true,
  },
  // Овърсайз премиум хеви
  gddfd: {
    columns: WIDTH_LENGTH,
    rows: [
      ["S", "60", "74"], ["M", "62", "76"], ["L", "64", "78"],
      ["XL", "66", "80"], ["2XL", "68", "82"],
    ],
    care: true,
  },
  // Детска тениска
  ge: {
    columns: WIDTH_LENGTH,
    rows: [
      ["1-2 Години", "29", "39"], ["2-3 Години", "31", "43"],
      ["3-4 Години", "33", "45"], ["4-5 Години", "35", "47"],
      ["6-8 Години", "36", "50"], ["9-11 Години", "40", "55"],
      ["12-13 Години", "44", "60"],
    ],
    care: true,
  },
  // Бебешко боди — by height, not width and length.
  gdab: {
    columns: ["Височина"],
    rows: [
      ["3 Месеца", "62"], ["6 Месеца", "68"],
      ["9 Месеца", "74"], ["12 Месеца", "80"],
    ],
    care: true,
  },
  // Унисекс суичър
  ca: {
    columns: WIDTH_LENGTH,
    rows: [
      ["S", "50.8", "68.5"], ["M", "55.8", "71"], ["L", "62", "73.5"],
      ["XL", "66", "76"], ["2XL", "71", "78.7"], ["3XL", "81", "83.8"],
    ],
    care: true,
  },
  // Унисекс блуза — the supplier lists the same body as the hoodie.
  cj: {
    columns: WIDTH_LENGTH,
    rows: [
      ["S", "50.8", "68.5"], ["M", "55.8", "71"], ["L", "62", "73.5"],
      ["XL", "66", "76"], ["2XL", "71", "78.7"], ["3XL", "81", "83.8"],
    ],
    care: true,
  },
  // Ватиран суичър с цип
  gcjg: {
    columns: WIDTH_LENGTH,
    rows: [["M", "53", "70"], ["L", "55", "72"], ["XL", "57", "74"], ["2XL", "58", "76"]],
    care: true,
  },
  // Овърсайз суичър
  eaccd: {
    columns: WIDTH_LENGTH,
    rows: [["L", "67", "74"], ["XL", "72", "76"], ["2XL", "77", "79"]],
    care: true,
  },
  // Кроп топ
  ddejj: {
    columns: WIDTH_LENGTH,
    rows: [
      ["XS", "42", "39"], ["S", "44", "40.5"], ["M", "46", "41.5"],
      ["L", "48", "43"], ["XL", "50", "44.5"], ["2XL", "52", "46"],
      ["3XL", "54", "47"],
    ],
    care: true,
  },
  // Мъжки потник
  de: {
    columns: WIDTH_LENGTH,
    rows: [
      ["S", "47", "71"], ["M", "50", "72"], ["L", "55", "74"],
      ["XL", "58", "77"], ["2XL", "62", "79"], ["3XL", "65", "80"],
    ],
    care: true,
  },
  // Дамски потник
  gh: {
    columns: WIDTH_LENGTH,
    rows: [
      ["S", "45", "65"], ["M", "47", "67"], ["L", "50", "68.5"],
      ["XL", "52", "70"], ["2XL", "53", "72"], ["3XL", "55.5", "75"],
    ],
    care: true,
  },
  // Мъжка Polo риза
  dcc: {
    columns: WIDTH_LENGTH,
    rows: [
      ["S", "48", "70"], ["M", "52", "72"], ["L", "56", "74"],
      ["XL", "60", "76"], ["2XL", "64", "78"], ["3XL", "68", "80"],
    ],
    care: true,
  },
  // Мъжки ватиран анцуг
  eaij: {
    columns: HIP_LENGTH,
    rows: [["M", "102", "102"], ["L", "106", "104"], ["XL", "110", "108"], ["2XL", "114", "109"]],
    care: true,
  },
  // Къс панталон
  gdah: {
    columns: HIP_LENGTH,
    rows: [
      ["M", "94", "51"], ["L", "98", "52"], ["XL", "102", "54"],
      ["2XL", "106", "55"], ["3XL", "110", "56"],
    ],
    care: true,
  },
};

export function sizeChart(uid: string | null | undefined): SizeChart | undefined {
  return uid ? CHARTS[uid] : undefined;
}

/** Their washing instructions, identical across the whole textile range. */
export const CARE_INSTRUCTIONS = [
  "Пере се на максимум 40°, обърнато наопаки, без белина.",
  "Не се суши в сушилня.",
  "Не се глади директно върху щампата — силната топлина напуква мастилата.",
] as const;
