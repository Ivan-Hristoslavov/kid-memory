/**
 * Product catalog, poster styles and animal options.
 * Single source of truth shared by wizard, checkout, admin and emails.
 */

/**
 * `available: false` keeps a product resolvable for past orders, admin and
 * emails, but hides it from the storefront. DIGITAL is off while the shop is
 * cash-on-delivery only — a courier can't collect payment for a file.
 */
export const PRODUCTS = {
  DIGITAL: {
    id: "DIGITAL",
    name: "Дигитален файл",
    description: "Файл в 4K качество за печат у дома или споделяне.",
    priceEUR: 12.9,
    available: false,
    features: ["4K дигитален файл", "Готов за печат навсякъде", "Доставка по имейл до минути"],
  },
  POSTER_A4: {
    id: "POSTER_A4",
    name: "Постер A4",
    description: "Отпечатан на премиум матова хартия, готов за рамка.",
    priceEUR: 18.9,
    available: true,
    features: ["Премиум печат A4", "Матова хартия 250 г", "Включен дигитален файл"],
  },
  POSTER_A3: {
    id: "POSTER_A3",
    name: "Постер A3",
    description: "Големият формат, който грабва погледа на всяка стена.",
    priceEUR: 26.9,
    available: true,
    features: ["Премиум печат A3", "Матова хартия 250 г", "Включен дигитален файл"],
  },
  PREMIUM: {
    id: "PREMIUM",
    name: "Премиум пакет",
    description: "Постер A3 + A4 + дигитален файл + подаръчна кутия.",
    priceEUR: 36.9,
    available: true,
    features: [
      "Постер A3 + A4",
      "Елегантна подаръчна кутия",
      "4K дигитален файл",
      "Приоритетна изработка",
    ],
  },
} as const;

export type ProductId = keyof typeof PRODUCTS;

/** Display order for the storefront — hidden products are filtered out. */
const PRODUCT_ORDER = ["DIGITAL", "POSTER_A4", "POSTER_A3", "PREMIUM"] as const;

/** Products currently on sale, in display order. */
export const AVAILABLE_PRODUCTS = PRODUCT_ORDER.filter(
  (id) => PRODUCTS[id].available
) as readonly ProductId[];

export function isAvailable(id: ProductId): boolean {
  return PRODUCTS[id].available;
}

/** Cheapest price on sale — drives every "от X €" label. */
export function lowestPriceEUR(): number {
  return Math.min(...AVAILABLE_PRODUCTS.map((id) => PRODUCTS[id].priceEUR));
}

export function highestPriceEUR(): number {
  return Math.max(...AVAILABLE_PRODUCTS.map((id) => PRODUCTS[id].priceEUR));
}

/**
 * Optional extras added at checkout. `icon` is a lucide-react icon name.
 * Digital-only orders can't take physical add-ons (`physicalOnly`).
 */
export const ADDONS = {
  FRAME: {
    id: "FRAME",
    name: "Дървена рамка",
    description: "Елегантна рамка в натурално дърво — закачаш го веднага.",
    priceEUR: 5.9,
    icon: "Frame",
    physicalOnly: true,
  },
  EXTRA_COPY: {
    id: "EXTRA_COPY",
    name: "Второ копие",
    description: "Същият постер още веднъж — за баба, за вилата или за офиса.",
    // Priced as a share of the chosen format instead of a flat fee: the
    // illustration is already generated, so a second print costs us only paper.
    // A flat 12.90 read as "another whole poster" and killed the attach rate.
    priceEUR: 0,
    discountOfBase: 0.4,
    icon: "Copy",
    physicalOnly: true,
  },
  PHOTO_PAPER: {
    id: "PHOTO_PAPER",
    name: "Премиум фотохартия",
    description: "Плътна перлена фотохартия 300 г — по-наситени цветове.",
    priceEUR: 2.4,
    icon: "Layers",
    physicalOnly: true,
  },
  GIFT_WRAP: {
    id: "GIFT_WRAP",
    name: "Подаръчно опаковане",
    description:
      "Опаковано с панделка и ръчно написана картичка, запечатана с восъчен печат.",
    priceEUR: 2.9,
    icon: "Gift",
    // Ribbon, a handwritten card and a wax seal only make sense on something
    // we physically ship.
    physicalOnly: true,
  },
} as const;

export type AddonId = keyof typeof ADDONS;

/** Display order for add-ons at checkout — cheapest upsell last. */
export const ADDON_ORDER: readonly AddonId[] = [
  "FRAME",
  "EXTRA_COPY",
  "PHOTO_PAPER",
  "GIFT_WRAP",
];

/**
 * Courier cost passed on to the customer. It has to appear in the checkout
 * summary and the confirmation email — a shopper who is quoted one number and
 * asked for a bigger one at the counter simply refuses the parcel, and a
 * personalised poster that comes back is a total loss.
 */
export const DELIVERY = {
  feeEUR: 4.9,
  freeAboveEUR: 35,
} as const;

/** Money helper — avoids float drift like 27.9 + 2.9 = 30.799999999999997. */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Add-ons that apply to a product (digital orders take no physical extras). */
export function availableAddons(productId: ProductId): readonly AddonId[] {
  return ADDON_ORDER.filter(
    (id) => productId !== "DIGITAL" || !ADDONS[id].physicalOnly
  );
}

/**
 * What an add-on costs for a given product. Most are a flat fee; `discountOfBase`
 * ones scale with the chosen format, so a second A3 costs more than a second A4.
 * Always use this instead of reading `ADDONS[id].priceEUR` directly.
 */
export function addonPriceEUR(addonId: AddonId, productId: ProductId): number {
  const addon = ADDONS[addonId];
  const pct = "discountOfBase" in addon ? addon.discountOfBase : 0;
  if (!pct) return addon.priceEUR;
  // Round to the nearest 10 cents so the discount never shows odd fractions.
  return Math.round(PRODUCTS[productId].priceEUR * (1 - pct) * 10) / 10;
}

/** Goods subtotal — product plus valid add-ons, excluding delivery. */
export function calcTotalEUR(productId: ProductId, addonIds: readonly string[]): number {
  const allowed = availableAddons(productId);
  const extras = addonIds
    .filter((id): id is AddonId => id in ADDONS)
    .filter((id) => allowed.includes(id))
    .reduce((sum, id) => sum + addonPriceEUR(id, productId), 0);
  return round2(PRODUCTS[productId].priceEUR + extras);
}

/** Delivery cost for a goods subtotal. Digital orders ship by email. */
export function calcDeliveryEUR(productId: ProductId, subtotalEUR: number): number {
  if (productId === "DIGITAL") return 0;
  return subtotalEUR >= DELIVERY.freeAboveEUR ? 0 : DELIVERY.feeEUR;
}

/**
 * The amount the courier actually collects. Server-side source of truth for
 * order totals — never trust client sums.
 */
export function calcGrandTotalEUR(
  productId: ProductId,
  addonIds: readonly string[]
): number {
  const subtotal = calcTotalEUR(productId, addonIds);
  return round2(subtotal + calcDeliveryEUR(productId, subtotal));
}

/** `icon` is a lucide-react icon name — resolved to a component in the UI. */
export const ANIMALS = [
  { id: "dog", icon: "Dog", name: "Кученце" },
  { id: "cat", icon: "Cat", name: "Коте" },
  { id: "rabbit", icon: "Rabbit", name: "Зайче" },
  { id: "panda", icon: "Panda", name: "Панда" },
  { id: "bird", icon: "Bird", name: "Птиче" },
  { id: "owl", icon: "Feather", name: "Бухалче" },
  { id: "fish", icon: "Fish", name: "Рибка" },
  { id: "turtle", icon: "Turtle", name: "Костенурка" },
  { id: "squirrel", icon: "Squirrel", name: "Катеричка" },
  { id: "snail", icon: "Snail", name: "Охлювче" },
  { id: "bee", icon: "Bug", name: "Пчеличка" },
  { id: "hamster", icon: "Rat", name: "Хамстерче" },
] as const;

export type AnimalId = (typeof ANIMALS)[number]["id"];

/** Print-oriented art directions. `icon` is a lucide-react icon name. */
export const STYLES = [
  {
    id: "realistic",
    name: "Реалистична рисунка",
    description: "Детайлна, близка до истинската — почти като жива снимка.",
    icon: "Aperture",
    gradient: "from-sky to-mint",
  },
  {
    id: "storybook",
    name: "Приказна илюстрация",
    description: "Топли акварелни и моливни текстури, като от любима приказка.",
    icon: "BookHeart",
    gradient: "from-peach to-sun",
  },
  {
    // Public names must not use someone else's trademarks — describe the look.
    id: "disney",
    name: "Анимационно 3D",
    description: "Сладък обемен стил с големи изразителни очи, като от анимация.",
    icon: "Castle",
    gradient: "from-lavender to-sky",
  },
  {
    id: "caricature",
    name: "Карикатура",
    description: "Забавен, шаржов стил с ярки цветове и настроение.",
    icon: "Drama",
    gradient: "from-blush to-peach",
  },
  {
    id: "watercolor",
    name: "Акварел",
    description: "Нежни, меки акварелни цветове и преливания.",
    icon: "Brush",
    gradient: "from-sky to-lavender",
  },
  {
    id: "fantasy",
    name: "Фентъзи свят",
    description: "Магичен свят с блясък, звезди и приключения.",
    icon: "Wand2",
    gradient: "from-blush to-lavender",
  },
] as const;

export type StyleId = (typeof STYLES)[number]["id"];

export const COURIERS = [
  { id: "ECONT", name: "Еконт" },
  { id: "SPEEDY", name: "Спиди" },
] as const;

export const DELIVERY_METHODS = [
  { id: "OFFICE", name: "До офис" },
  { id: "ADDRESS", name: "До адрес" },
  { id: "LOCKER", name: "Автомат / Еконтомат" },
] as const;

export function formatPrice(eur: number): string {
  const s = eur.toFixed(2).replace(/\.00$/, "");
  return `${s} €`;
}
