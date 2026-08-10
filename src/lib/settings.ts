import "server-only";
import { prisma } from "@/lib/prisma";
import { COMPANY } from "@/lib/legal";

/**
 * Editable site settings stored in the DB, so copy and toggles can be changed
 * from the admin panel without a deploy. Anything missing falls back to these
 * defaults, so the site always renders even with an empty table.
 */
export interface SiteSettings {
  promoEnabled: boolean;
  promoText: string;
  promoSecondary: string;
  heroTitle: string;
  heroSubtitle: string;
  showReviews: boolean;
  reviewsHeading: string;
  deliveryDays: string;
  contactEmail: string;
  contactPhone: string;
  /** Image quality sent to the AI — drives cost per poster. */
  aiQuality: "low" | "medium" | "high";
  /** Max generations per day; 0 = no limit. Protects the AI budget. */
  aiDailyLimit: number;
  /** Stops new orders with an explanation instead of taking the site down. */
  shopPaused: boolean;
  shopPausedMessage: string;
  /** Shown at checkout near a seasonal deadline, e.g. "поръчай до 15 декември". */
  orderCutoffNote: string;
}

export const DEFAULT_SETTINGS: SiteSettings = {
  promoEnabled: true,
  promoText: "Безплатна доставка над 35 €",
  // "Готово за 24 часа" read as a delivery promise and contradicted the 1–3 day
  // shipping stated in the FAQ. The design really is ready in minutes.
  promoSecondary: "Виждаш дизайна за 2 минути",
  // Occasion-neutral on purpose: the default headline is what a visitor sees
  // outside every campaign window, and it used to speak only to parents.
  heroTitle: "Подарък, който казва „това си ти“.",
  heroSubtitle:
    "Изпращаш снимка, ние я превръщаме в илюстрован постер — с думите, които този човек (или любимец) всички му знаят. Виждаш готовия дизайн за 2 минути и плащаш при доставка.",
  showReviews: true,
  reviewsHeading: "Хора, които вече го закачиха на стената",
  deliveryDays: "1–3 работни дни",
  // Same source as the legal pages, so the site never shows two addresses.
  contactEmail: COMPANY.email,
  contactPhone: "",
  aiQuality: (process.env.AI_QUALITY as SiteSettings["aiQuality"]) || "medium",
  aiDailyLimit: Number(process.env.AI_DAILY_LIMIT || 30),
  shopPaused: false,
  shopPausedMessage:
    "В момента не приемаме нови поръчки — връщаме се съвсем скоро. Пиши ни, ако ти трябва постер спешно.",
  orderCutoffNote: "",
};

const KEY = "site";

export async function getSettings(): Promise<SiteSettings> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: KEY } });
    if (!row) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(row.value as Partial<SiteSettings>) };
  } catch {
    // Never let a settings lookup take the page down.
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(patch: Partial<SiteSettings>): Promise<SiteSettings> {
  const current = await getSettings();
  const next = { ...current, ...patch };
  await prisma.siteSetting.upsert({
    where: { key: KEY },
    create: { key: KEY, value: next },
    update: { value: next },
  });
  return next;
}
