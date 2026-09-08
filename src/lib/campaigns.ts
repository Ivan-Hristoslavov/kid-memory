import "server-only";
import { prisma } from "@/lib/prisma";
import type { TemplateId } from "@/lib/templates";

/**
 * Seasonal campaigns.
 *
 * Sales for a personalised gift are brutally seasonal — Коледа and 1 юни carry
 * most of the year while February and March are dead. Campaigns exist to put a
 * reason to buy in front of visitors during the quiet months, by re-skinning the
 * site for whichever occasion is next.
 *
 * Windows repeat yearly and are stored as month/day, so they never need
 * updating. A window may wrap the new year.
 */
export interface ActiveCampaign {
  id: string;
  name: string;
  heroTitle?: string | null;
  heroSubtitle?: string | null;
  heroBadge?: string | null;
  promoText?: string | null;
  promoSecondary?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  accentColor?: string | null;
  auraColor?: string | null;
  /** Poster type this occasion sells; null lets the visitor pick. */
  template?: TemplateId | null;
}

/** Day-of-year style ordinal that ignores the year — good enough for ordering. */
function stamp(month: number, day: number): number {
  return month * 100 + day;
}

/**
 * Today's month and day **in Bulgaria**, not on the server.
 *
 * Vercel runs in UTC, so `new Date().getDate()` rolls over two hours late in
 * summer and one in winter. A campaign set to end on 24 декември would still be
 * showing "поръчай за Коледа" for the first hours of the 25th, and the Коледа →
 * Нова година handover would land on the wrong day every year.
 */
function sofiaToday(now: Date): { month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Sofia",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? "1");
  return { month: get("month"), day: get("day") };
}

export function isWithinWindow(
  now: Date,
  startMonth: number,
  startDay: number,
  endMonth: number,
  endDay: number
): boolean {
  const { month, day } = sofiaToday(now);
  const today = stamp(month, day);
  const start = stamp(startMonth, startDay);
  const end = stamp(endMonth, endDay);
  // Wrapping window, e.g. 20 Nov → 6 Jan.
  if (start > end) return today >= start || today <= end;
  return today >= start && today <= end;
}

/**
 * The campaign that should be showing right now, or null. Highest priority
 * wins when windows overlap. Never throws — a campaign is decoration, and the
 * shop must render without it.
 */
export async function getActiveCampaign(now = new Date()): Promise<ActiveCampaign | null> {
  try {
    const candidates = await prisma.campaign.findMany({
      where: { enabled: true },
      orderBy: { priority: "desc" },
    });
    const match = candidates.find((c) =>
      isWithinWindow(now, c.startMonth, c.startDay, c.endMonth, c.endDay)
    );
    return match ?? null;
  } catch (err) {
    console.error("campaign lookup failed:", err);
    return null;
  }
}

/**
 * CSS variable overrides for the active campaign, injected as an inline style
 * on the page shell. Only the two brand hooks are overridable — letting a
 * campaign repaint arbitrary tokens would make the site unpredictable.
 */
export function campaignStyle(campaign: ActiveCampaign | null): React.CSSProperties {
  if (!campaign) return {};
  const style: Record<string, string> = {};
  if (campaign.accentColor) {
    style["--primary"] = campaign.accentColor;
    style["--ring"] = campaign.accentColor;
  }
  if (campaign.auraColor) style["--blush"] = campaign.auraColor;
  return style as React.CSSProperties;
}

/**
 * The Bulgarian gift calendar, seeded on first run.
 *
 * Weighted deliberately toward the quiet months: 2 февруари and 8 март exist to
 * give February and March a reason to buy, which is the whole point of the
 * feature. Movable feasts like Великден are left out — they need a date each
 * year and are better added by hand from the admin.
 */
export const DEFAULT_CAMPAIGNS = [
  {
    name: "Ден на мъжката рожба (2 февруари)",
    startMonth: 1,
    startDay: 24,
    endMonth: 2,
    endDay: 2,
    priority: 10,
    heroBadge: "Ден на мъжката рожба · 2 февруари",
    heroTitle: "За сина, който догодина няма да казва „лисапед“.",
    heroSubtitle:
      "Снимката му става илюстрация, а думичките, които бърка — част от нея. Поръчай до 28 януари за доставка навреме.",
    promoText: "Ден на мъжката рожба — поръчай до 28 януари",
    promoSecondary: "Виждаш дизайна за 2 минути",
    seoTitle: "Подарък за Деня на мъжката рожба — персонализиран детски постер",
    accentColor: "oklch(0.50 0.040 200)",
    auraColor: "oklch(0.90 0.020 210)",
  },
  {
    name: "8 март",
    startMonth: 2,
    startDay: 20,
    endMonth: 3,
    endDay: 8,
    priority: 20,
    heroBadge: "Подарък за 8 март",
    heroTitle: "Подарък за мама — с думичките на детето ѝ.",
    heroSubtitle:
      "Не поредните цветя. Постер с лицето на детето и думичките, които тя ще помни цял живот. Поръчай до 4 март.",
    promoText: "За 8 март — поръчай до 4 март",
    promoSecondary: "Безплатна доставка над 35 €",
    seoTitle: "Подарък за 8 март за мама и баба — персонализиран постер",
    seoDescription:
      "Подарък за 8 март, който не увяхва: снимката на детето, превърната в илюстрация, заедно с думичките, които казва грешно.",
    accentColor: "oklch(0.62 0.090 20)",
    auraColor: "oklch(0.88 0.040 25)",
  },
  {
    name: "1 юни — Ден на детето",
    startMonth: 5,
    startDay: 15,
    endMonth: 6,
    endDay: 1,
    priority: 20,
    heroBadge: "За 1 юни",
    heroTitle: "Подарък за 1 юни, който няма да се забрави до юли.",
    heroSubtitle:
      "Играчката се забравя. Постерът с лицето и думичките на детето виси на стената години. Поръчай до 25 май.",
    promoText: "За 1 юни — поръчай до 25 май",
    promoSecondary: "Виждаш дизайна за 2 минути",
    seoTitle: "Подарък за 1 юни — персонализиран детски постер",
    accentColor: "oklch(0.574 0.032 162)",
    auraColor: "oklch(0.90 0.025 160)",
  },
  {
    name: "Ден на бащата (26 юни)",
    startMonth: 6,
    startDay: 15,
    endMonth: 6,
    endDay: 26,
    priority: 10,
    heroBadge: "За Деня на бащата · 26 юни",
    heroTitle: "За тате — с думичките, които само той разбира.",
    heroSubtitle:
      "Постер с лицето на детето и лапсусите, които вече са семейна шега. Поръчай до 22 юни.",
    promoText: "Ден на бащата — поръчай до 22 юни",
    promoSecondary: "Плащане при доставка",
    seoTitle: "Подарък за Деня на бащата от детето — персонализиран постер",
    accentColor: "oklch(0.52 0.035 190)",
    auraColor: "oklch(0.89 0.022 195)",
  },
  {
    name: "Първи учебен ден",
    startMonth: 8,
    startDay: 25,
    endMonth: 9,
    endDay: 15,
    priority: 10,
    heroBadge: "Първи учебен ден",
    heroTitle: "Границата между бебе и голямо дете.",
    heroSubtitle:
      "Запази думичките точно преди училището да ги оправи. Постер с лицето на детето и неговия речник.",
    promoText: "Преди първия учебен ден",
    promoSecondary: "Готово за 1–3 работни дни",
    accentColor: "oklch(0.623 0.119 34)",
    auraColor: "oklch(0.847 0.043 40)",
  },
  {
    name: "Ден на християнското семейство (21 ноември)",
    startMonth: 11,
    startDay: 10,
    endMonth: 11,
    endDay: 21,
    priority: 10,
    heroBadge: "Ден на семейството · 21 ноември",
    heroTitle: "Едно семейство. Един речник. Една стена.",
    heroSubtitle:
      "Постер с всички деца заедно и думичките, които всяко от тях казва по своему.",
    promoText: "Ден на християнското семейство — 21 ноември",
    promoSecondary: "До 3 деца на един постер",
    accentColor: "oklch(0.60 0.075 25)",
    auraColor: "oklch(0.88 0.038 30)",
  },
  {
    name: "Коледа",
    startMonth: 11,
    startDay: 22,
    endMonth: 12,
    endDay: 20,
    priority: 30,
    heroBadge: "Коледен подарък",
    heroTitle: "Подарък под елхата, който ще виси на стената и догодина.",
    heroSubtitle:
      "Снимката на детето става илюстрация, а думичките, които бърка — част от нея. Поръчай до 15 декември за доставка преди Коледа.",
    promoText: "За Коледа — поръчай до 15 декември",
    promoSecondary: "Подаръчно опаковане с восъчен печат",
    seoTitle: "Коледен подарък за дете и за баба — персонализиран постер",
    seoDescription:
      "Коледен подарък, който се пази: снимката на детето, превърната в илюстрация, със смешните думички, които казва.",
    accentColor: "oklch(0.46 0.045 158)",
    auraColor: "oklch(0.89 0.028 150)",
  },
] as const;

/** Inserts the default calendar once, if no campaigns exist yet. */
export async function seedCampaignsIfEmpty(): Promise<number> {
  const existing = await prisma.campaign.count();
  if (existing > 0) return 0;
  const res = await prisma.campaign.createMany({ data: [...DEFAULT_CAMPAIGNS] });
  return res.count;
}
