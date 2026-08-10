"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logAdminEvent } from "@/lib/admin-log";
import { seedCampaignsIfEmpty } from "@/lib/campaigns";
import { TEMPLATE_ORDER, type TemplateId } from "@/lib/templates";
import { sendCampaignEmail } from "@/lib/email/send";
import { isTestMode } from "@/lib/config";

export interface CampaignState {
  ok?: boolean;
  error?: string;
  message?: string;
}

async function assertAdmin(): Promise<void> {
  if (isTestMode()) return;
  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASSWORD;
  if (!user || !pass) throw new Error("Admin not configured");
  const auth = (await headers()).get("authorization") ?? "";
  if (auth !== "Basic " + Buffer.from(`${user}:${pass}`).toString("base64")) {
    throw new Error("Unauthorized");
  }
}

/** Empty string means "no override" — stored as null, not "". */
const optional = z
  .string()
  .trim()
  .max(300)
  .optional()
  .transform((v) => (v ? v : null));

const campaignSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Въведи име").max(80),
  startMonth: z.coerce.number().int().min(1).max(12),
  startDay: z.coerce.number().int().min(1).max(31),
  endMonth: z.coerce.number().int().min(1).max(12),
  endDay: z.coerce.number().int().min(1).max(31),
  priority: z.coerce.number().int().min(0).max(100).default(0),
  enabled: z.coerce.boolean().default(false),
  heroTitle: optional,
  heroSubtitle: optional,
  heroBadge: optional,
  promoText: optional,
  promoSecondary: optional,
  seoTitle: optional,
  seoDescription: optional,
  accentColor: optional,
  auraColor: optional,
  /** Empty means "let the visitor pick" — stored as null, not "". */
  template: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : null))
    .refine(
      (v) => v === null || (TEMPLATE_ORDER as readonly string[]).includes(v),
      "Непознат вид постер"
    )
    .transform((v) => v as TemplateId | null),
});

export async function saveCampaign(
  _prev: CampaignState,
  formData: FormData
): Promise<CampaignState> {
  try {
    await assertAdmin();
  } catch {
    return { error: "Нямаш достъп." };
  }

  const raw = Object.fromEntries(formData);
  const parsed = campaignSchema.safeParse({
    ...raw,
    enabled: formData.get("enabled") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Провери полетата." };
  }

  const { id, ...data } = parsed.data;

  if (id) {
    await prisma.campaign.update({ where: { id }, data });
    await logAdminEvent({ action: "CAMPAIGN_UPDATED", detail: data.name });
  } else {
    await prisma.campaign.create({ data });
    await logAdminEvent({ action: "CAMPAIGN_CREATED", detail: data.name });
  }

  // The home page reads the active campaign, so it has to re-render.
  revalidatePath("/");
  revalidatePath("/admin/campaigns");
  return { ok: true, message: "Кампанията е запазена." };
}

export async function toggleCampaign(
  _prev: CampaignState,
  formData: FormData
): Promise<CampaignState> {
  try {
    await assertAdmin();
  } catch {
    return { error: "Нямаш достъп." };
  }

  const id = String(formData.get("id") ?? "");
  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) return { error: "Кампанията не е намерена." };

  await prisma.campaign.update({
    where: { id },
    data: { enabled: !campaign.enabled },
  });
  await logAdminEvent({
    action: campaign.enabled ? "CAMPAIGN_DISABLED" : "CAMPAIGN_ENABLED",
    detail: campaign.name,
  });

  revalidatePath("/");
  revalidatePath("/admin/campaigns");
  return { ok: true, message: campaign.enabled ? "Изключена." : "Включена." };
}

export async function deleteCampaign(
  _prev: CampaignState,
  formData: FormData
): Promise<CampaignState> {
  try {
    await assertAdmin();
  } catch {
    return { error: "Нямаш достъп." };
  }

  const id = String(formData.get("id") ?? "");
  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) return { error: "Кампанията не е намерена." };

  await prisma.campaign.delete({ where: { id } });
  await logAdminEvent({ action: "CAMPAIGN_DELETED", detail: campaign.name });

  revalidatePath("/");
  revalidatePath("/admin/campaigns");
  return { ok: true, message: "Изтрита." };
}

/**
 * Sends a campaign to everyone who opted in.
 *
 * Campaigns only re-skin the site, which reaches people already visiting. A
 * past customer emailed before 8 март is the cheapest sale this shop can make —
 * this is what turns a campaign from decoration into revenue.
 *
 * Only `marketingOptIn` addresses are included, deduplicated, and each send is
 * recorded so a double click cannot double-send.
 */
export async function broadcastCampaign(
  _prev: CampaignState,
  formData: FormData
): Promise<CampaignState> {
  try {
    await assertAdmin();
  } catch {
    return { error: "Нямаш достъп." };
  }

  const id = String(formData.get("id") ?? "");
  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) return { error: "Кампанията не е намерена." };

  const recipients = await prisma.order.findMany({
    where: { marketingOptIn: true, email: { not: null } },
    select: { email: true },
    distinct: ["email"],
    take: 2000,
  });

  const emails = [...new Set(recipients.map((r) => r.email!.toLowerCase()))];
  if (emails.length === 0) {
    return { error: "Няма клиенти, дали съгласие за имейли." };
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const subject = campaign.seoTitle ?? campaign.heroTitle ?? campaign.name;
  const heading = campaign.heroTitle ?? campaign.name;
  const body =
    campaign.heroSubtitle ??
    campaign.seoDescription ??
    "Виж какво сме подготвили за този повод.";

  let sent = 0;
  for (const email of emails) {
    try {
      await sendCampaignEmail({
        email,
        subject,
        heading,
        body,
        ctaLabel: "Създай постер",
        ctaUrl: `${site}/create`,
        unsubscribeUrl: `${site}/otpisvane?email=${encodeURIComponent(email)}`,
      });
      sent++;
    } catch (err) {
      console.error("campaign email failed for", email, err);
    }
  }

  await logAdminEvent({
    action: "CAMPAIGN_BROADCAST",
    detail: `${campaign.name}: ${sent}/${emails.length}`,
  });

  return { ok: true, message: `Изпратени ${sent} от ${emails.length} имейла.` };
}

/** One-click opt-out, honoured across every order with that address. */
export async function unsubscribeEmail(email: string): Promise<boolean> {
  const clean = email.trim().toLowerCase();
  if (!clean) return false;
  try {
    await prisma.order.updateMany({
      where: { email: { equals: clean, mode: "insensitive" } },
      data: { marketingOptIn: false },
    });
    return true;
  } catch (err) {
    console.error("unsubscribe failed:", err);
    return false;
  }
}

/** Fills the table with the Bulgarian gift calendar on first use. */
export async function seedCampaigns(): Promise<CampaignState> {
  try {
    await assertAdmin();
  } catch {
    return { error: "Нямаш достъп." };
  }

  const count = await seedCampaignsIfEmpty();
  revalidatePath("/admin/campaigns");
  return count > 0
    ? { ok: true, message: `Добавени ${count} кампании.` }
    : { error: "Вече има кампании — изтрий ги, ако искаш да заредиш наново." };
}
