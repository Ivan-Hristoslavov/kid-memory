"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { PDFDocument } from "pdf-lib";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";
import { courier } from "@/lib/couriers";
import { sendOrderReceivedEmail, sendShippedEmail } from "@/lib/email/send";
import { adminStatusSchema } from "@/lib/validations";
import {
  ADDONS,
  PRODUCTS,
  calcDeliveryEUR,
  calcTotalEUR,
  type AddonId,
  type ProductId,
} from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { logAdminEvent } from "@/lib/admin-log";
import { blockPhone, unblockPhone } from "@/lib/blocked-phones";
import { isTestMode } from "@/lib/config";

export interface AdminActionState {
  ok?: boolean;
  error?: string;
  message?: string;
}

/**
 * Defense in depth: middleware already gates /admin with Basic auth,
 * but server actions are callable endpoints — re-verify on every action.
 */
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

/**
 * Blocks or unblocks the phone on an order. Used after a refused parcel so the
 * same number cannot place another cash-on-delivery order — a returned
 * personalised poster is a total loss, not a restockable item.
 */
export async function togglePhoneBlock(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  try {
    await assertAdmin();
  } catch {
    return { error: "Нямаш достъп." };
  }

  const orderId = String(formData.get("orderId") ?? "");
  const block = formData.get("block") === "1";
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order?.phone) return { error: "Поръчката няма телефон" };

  if (block) {
    await blockPhone(order.phone, "Отказана пратка", order.orderNumber);
  } else {
    await unblockPhone(order.phone);
  }

  await logAdminEvent({
    orderId,
    action: block ? "PHONE_BLOCKED" : "PHONE_UNBLOCKED",
    detail: order.phone,
  });
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true, message: block ? "Телефонът е блокиран." : "Телефонът е отблокиран." };
}

export async function updateOrderStatus(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  try {
    await assertAdmin();
  } catch {
    return { error: "Нямаш достъп." };
  }

  const parsed = adminStatusSchema.safeParse({
    orderId: formData.get("orderId"),
    status: formData.get("status"),
    trackingNumber: formData.get("trackingNumber") || undefined,
  });
  if (!parsed.success) return { error: "Невалидни данни" };

  const { orderId, status, trackingNumber } = parsed.data;
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { error: "Поръчката не е намерена" };

  await prisma.order.update({
    where: { id: orderId },
    data: { status, ...(trackingNumber ? { trackingNumber } : {}) },
  });

  await logAdminEvent({
    orderId,
    action: "STATUS_CHANGED",
    detail: `${order.status} → ${status}${trackingNumber ? ` · ${trackingNumber}` : ""}`,
  });

  // Shipping transition notifies the customer automatically
  if (status === "SHIPPED" && order.email) {
    try {
      await sendShippedEmail({
        orderNumber: order.orderNumber,
        customerName: order.customerName ?? "",
        email: order.email,
        productType: (order.productType ?? "DIGITAL") as ProductId,
        childName: order.childName,
        courier: order.courier,
        trackingNumber: trackingNumber ?? order.trackingNumber,
      });
    } catch (err) {
      console.error("Shipped email failed:", err);
    }
  }

  revalidatePath("/admin");
  return { ok: true, message: "Статусът е обновен." };
}

export async function createShipment(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  try {
    await assertAdmin();
  } catch {
    return { error: "Нямаш достъп." };
  }

  const orderId = String(formData.get("orderId") ?? "");
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { error: "Поръчката не е намерена" };
  if (!order.courier || !order.customerName || !order.phone || !order.city) {
    return { error: "Липсват данни за доставка" };
  }

  const product = order.productType ? PRODUCTS[order.productType as ProductId] : null;

  try {
    const result = await courier(order.courier).createShipment({
      orderNumber: order.orderNumber,
      recipientName: order.customerName,
      phone: order.phone,
      city: order.city,
      deliveryKind: order.deliveryMethod ?? "OFFICE",
      address: order.address ?? undefined,
      officeId: order.courierOffice ?? undefined,
      codAmountEUR: Number(order.priceEUR ?? product?.priceEUR ?? 0),
      description: `Детски постер — поръчка №${order.orderNumber}`,
    });

    await prisma.order.update({
      where: { id: orderId },
      data: { trackingNumber: result.trackingNumber, status: "SHIPPED" },
    });

    if (order.email) {
      try {
        await sendShippedEmail({
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          email: order.email,
          productType: (order.productType ?? "DIGITAL") as ProductId,
          childName: order.childName,
          courier: order.courier,
          trackingNumber: result.trackingNumber,
        });
      } catch (err) {
        console.error("Shipped email failed:", err);
      }
    }

    revalidatePath("/admin");
    return { ok: true, message: `Товарителница: ${result.trackingNumber}` };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Грешка при създаване на товарителница" };
  }
}

export async function generateFinalPdf(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  try {
    await assertAdmin();
  } catch {
    return { error: "Нямаш достъп." };
  }

  const orderId = String(formData.get("orderId") ?? "");
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order?.finalImage) return { error: "Няма финално изображение" };

  try {
    const png = await storage().get(order.finalImage);
    const pdf = await PDFDocument.create();
    const image = await pdf.embedPng(new Uint8Array(png));
    // A3 at 300 dpi ≈ 3508×4961 pt-space; use image aspect on an A3 page (pt)
    const page = pdf.addPage([841.89, 1190.55]); // A3 portrait in points
    const scale = Math.min(page.getWidth() / image.width, page.getHeight() / image.height);
    const w = image.width * scale;
    const h = image.height * scale;
    page.drawImage(image, {
      x: (page.getWidth() - w) / 2,
      y: (page.getHeight() - h) / 2,
      width: w,
      height: h,
    });

    const pdfBytes = Buffer.from(await pdf.save());
    const pdfKey = `orders/${order.id}/final.pdf`;
    await storage().put(pdfKey, pdfBytes, "application/pdf");
    await prisma.order.update({ where: { id: orderId }, data: { finalPdf: pdfKey } });

    revalidatePath("/admin");
    return { ok: true, message: "PDF за печат е готов." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "PDF генерирането не успя" };
  }
}

/**
 * One PDF holding every poster that is confirmed by the customer and ready to
 * print, one A3 page each. Printing them one by one was the slowest part of
 * fulfilment; this turns a morning's orders into a single print job.
 *
 * Only orders with `confirmedAt` are included — an unconfirmed order must never
 * reach the printer.
 */
export async function generateBatchPrintPdf(): Promise<
  AdminActionState & { url?: string; count?: number }
> {
  try {
    await assertAdmin();
  } catch {
    return { error: "Нямаш достъп." };
  }

  const orders = await prisma.order.findMany({
    where: {
      status: "CONFIRMED",
      confirmedAt: { not: null },
      finalImage: { not: null },
    },
    select: { id: true, orderNumber: true, childName: true, finalImage: true },
    orderBy: { confirmedAt: "asc" },
    take: 50,
  });

  if (orders.length === 0) {
    return { error: "Няма потвърдени поръчки за печат." };
  }

  try {
    const pdf = await PDFDocument.create();

    for (const order of orders) {
      const png = await storage().get(order.finalImage!);
      const image = await pdf.embedPng(new Uint8Array(png));
      const page = pdf.addPage([841.89, 1190.55]); // A3 portrait, points
      const scale = Math.min(page.getWidth() / image.width, page.getHeight() / image.height);
      const w = image.width * scale;
      const h = image.height * scale;
      page.drawImage(image, {
        x: (page.getWidth() - w) / 2,
        y: (page.getHeight() - h) / 2,
        width: w,
        height: h,
      });
      // Order number in the corner so prints can be matched to parcels after
      // they come off the printer in a stack.
      page.drawText(`#${order.orderNumber} · ${order.childName}`, {
        x: 24,
        y: 18,
        size: 9,
      });
    }

    const bytes = Buffer.from(await pdf.save());
    const key = `batches/${new Date().toISOString().slice(0, 10)}-${Date.now()}.pdf`;
    await storage().put(key, bytes, "application/pdf");
    const url = await storage().signedUrl(key, 60 * 60);

    await logAdminEvent({
      action: "BATCH_PDF",
      detail: `${orders.length} поръчки: ${orders.map((o) => o.orderNumber).join(", ")}`,
    });

    return { ok: true, url, count: orders.length, message: `${orders.length} постера в един PDF.` };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Пакетният PDF не се създаде" };
  }
}

export async function resendOrderEmail(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  try {
    await assertAdmin();
  } catch {
    return { error: "Нямаш достъп." };
  }

  const orderId = String(formData.get("orderId") ?? "");
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order?.email || !order.customerName) return { error: "Поръчката няма имейл" };

  try {
    const productType = (order.productType ?? "POSTER_A3") as ProductId;
    const storedTotal = order.priceEUR ? Number(order.priceEUR) : null;

    if (order.status === "SHIPPED" || order.status === "DELIVERED") {
      await sendShippedEmail({
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        email: order.email,
        productType,
        childName: order.childName,
        courier: order.courier,
        trackingNumber: order.trackingNumber,
        totalEUR: storedTotal,
      });
    } else {
      // A resend must reuse the original confirmation link, so an earlier
      // email and this one can't both be "the" valid one.
      let confirmToken = order.confirmToken;
      if (!confirmToken) {
        confirmToken = randomBytes(24).toString("base64url");
        await prisma.order.update({
          where: { id: order.id },
          data: { confirmToken },
        });
      }

      const addons = order.addons.filter((a): a is AddonId => a in ADDONS);
      const subtotalEUR = calcTotalEUR(productType, addons);
      const deliveryEUR = calcDeliveryEUR(productType, subtotalEUR);
      const settings = await getSettings();
      const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

      await sendOrderReceivedEmail({
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        email: order.email,
        productType,
        childName: order.childName,
        addons,
        subtotalEUR,
        deliveryEUR,
        totalEUR: storedTotal ?? subtotalEUR + deliveryEUR,
        deliveryDays: settings.deliveryDays,
        confirmUrl: `${site}/potvurdi/${confirmToken}`,
        trackUrl: `${site}/proverka?order=${order.orderNumber}`,
      });
    }
    return { ok: true, message: "Имейлът е изпратен." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Имейлът не се изпрати" };
  }
}

/** Signed URLs for admin asset access (preview / final / PDF). */
export async function getAdminAssetUrl(
  _prev: AdminActionState & { url?: string },
  formData: FormData
): Promise<AdminActionState & { url?: string }> {
  try {
    await assertAdmin();
  } catch {
    return { error: "Нямаш достъп." };
  }

  const orderId = String(formData.get("orderId") ?? "");
  const kind = String(formData.get("kind") ?? "preview");
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { error: "Поръчката не е намерена" };

  const key =
    kind === "final" ? order.finalImage : kind === "pdf" ? order.finalPdf : order.previewImage;
  if (!key) return { error: "Файлът още не е генериран" };

  const url = await storage().signedUrl(key, 15 * 60);
  return { ok: true, url };
}
