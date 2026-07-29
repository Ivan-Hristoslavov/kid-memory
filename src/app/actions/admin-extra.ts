"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";
import { aiProvider, joinNames } from "@/lib/ai/provider";
import { composeFinalPoster, composeProtectedPreview } from "@/lib/poster/compose";
import { aiBakesText, isTestMode } from "@/lib/config";
import { getSettings, saveSettings, type SiteSettings } from "@/lib/settings";

export interface AdminState {
  ok?: boolean;
  error?: string;
  message?: string;
}

/** Same defense-in-depth gate as the other admin actions. */
async function assertAdmin(): Promise<void> {
  if (isTestMode()) return; // open for QA — never in production
  const hdrs = await headers();
  const auth = hdrs.get("authorization") ?? "";
  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASSWORD;
  if (!user || !pass) throw new Error("Admin credentials are not configured");
  const expected = "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");
  if (auth !== expected) throw new Error("Unauthorized");
}

/* ------------------------------- reviews -------------------------------- */

export async function moderateReview(
  _prev: AdminState,
  formData: FormData
): Promise<AdminState> {
  try {
    await assertAdmin();
  } catch {
    return { error: "Нямаш достъп." };
  }

  const id = String(formData.get("id") ?? "");
  const op = String(formData.get("op") ?? "");
  if (!id) return { error: "Липсва отзив" };

  try {
    switch (op) {
      case "approve":
        await prisma.review.update({ where: { id }, data: { status: "APPROVED" } });
        break;
      case "reject":
        await prisma.review.update({ where: { id }, data: { status: "REJECTED" } });
        break;
      case "pending":
        await prisma.review.update({ where: { id }, data: { status: "PENDING" } });
        break;
      case "feature": {
        const r = await prisma.review.findUnique({ where: { id } });
        await prisma.review.update({
          where: { id },
          data: { featured: !r?.featured, status: "APPROVED" },
        });
        break;
      }
      case "delete":
        await prisma.review.delete({ where: { id } });
        break;
      default:
        return { error: "Непозната операция" };
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Операцията не успя" };
  }

  revalidatePath("/admin/reviews");
  revalidatePath("/");
  revalidatePath("/otzivi");
  return { ok: true, message: "Готово." };
}

/* ------------------------------ settings -------------------------------- */

export async function updateSettings(
  _prev: AdminState,
  formData: FormData
): Promise<AdminState> {
  try {
    await assertAdmin();
  } catch {
    return { error: "Нямаш достъп." };
  }

  const str = (k: string) => String(formData.get(k) ?? "").trim();
  const patch: Partial<SiteSettings> = {
    promoEnabled: formData.get("promoEnabled") === "on",
    promoText: str("promoText"),
    promoSecondary: str("promoSecondary"),
    heroTitle: str("heroTitle"),
    heroSubtitle: str("heroSubtitle"),
    showReviews: formData.get("showReviews") === "on",
    reviewsHeading: str("reviewsHeading"),
    deliveryDays: str("deliveryDays"),
    contactEmail: str("contactEmail"),
    contactPhone: str("contactPhone"),
    aiQuality: (["low", "medium", "high"] as const).includes(
      str("aiQuality") as "low" | "medium" | "high"
    )
      ? (str("aiQuality") as "low" | "medium" | "high")
      : "medium",
    aiDailyLimit: Math.max(0, Number(str("aiDailyLimit")) || 0),
  };

  try {
    await saveSettings(patch);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Записът не успя" };
  }

  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  return { ok: true, message: "Настройките са запазени." };
}

/* --------------------------- regenerate poster --------------------------- */

/**
 * Re-runs generation for an existing order using its stored inputs — the fix
 * when the AI garbles a word or the parent asks for another take.
 */
export async function regeneratePoster(
  _prev: AdminState,
  formData: FormData
): Promise<AdminState> {
  try {
    await assertAdmin();
  } catch {
    return { error: "Нямаш достъп." };
  }

  const orderId = String(formData.get("orderId") ?? "");
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { error: "Поръчката не е намерена" };
  if (!order.photoKey) return { error: "Липсва оригиналната снимка" };

  let photo: Buffer;
  try {
    photo = await storage().get(order.photoKey);
  } catch {
    return { error: "Снимката вече не е налична (може да е изтрита по давност)" };
  }

  const children = (order.children as {
    name: string;
    age: number;
    gender: "BOY" | "GIRL";
    words: { word: string; saidAs: string; visual?: string }[];
  }[]) ?? [];

  if (children.length === 0) return { error: "Липсват данни за децата" };

  try {
    const illustration = await aiProvider().generate({
      photo,
      children,
      animals: order.animals,
      style: order.style,
      quality: (await getSettings()).aiQuality,
    });

    const finalPoster = aiBakesText()
      ? illustration
      : await composeFinalPoster(illustration, {
          childName: joinNames(children.map((c) => c.name)),
          words: children.flatMap((c) => c.words),
        });
    const preview = await composeProtectedPreview(finalPoster);

    const finalKey = `orders/${order.id}/final.png`;
    const previewKey = `orders/${order.id}/preview.jpg`;
    await storage().put(finalKey, finalPoster, "image/png");
    await storage().put(previewKey, preview, "image/jpeg");

    await prisma.order.update({
      where: { id: order.id },
      // Clear the stale print PDF — it no longer matches the new artwork.
      data: { previewImage: previewKey, finalImage: finalKey, finalPdf: null },
    });

    revalidatePath(`/admin/orders/${order.id}`);
    return { ok: true, message: "Постерът е прегенериран." };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Прегенерирането не успя",
    };
  }
}
