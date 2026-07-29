"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export interface ReviewFormState {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

const reviewSchema = z.object({
  authorName: z.string().trim().min(2, "Въведи име").max(60),
  city: z.string().trim().max(60).optional().or(z.literal("")),
  rating: z.coerce.number().int().min(1).max(5),
  text: z
    .string()
    .trim()
    .min(15, "Разкажи поне с няколко думи")
    .max(1000, "Максимум 1000 знака"),
  orderNumber: z.coerce.number().int().positive().optional().or(z.literal("")),
});

/** Public review submission — always lands as PENDING for admin approval. */
export async function submitReview(
  _prev: ReviewFormState,
  formData: FormData
): Promise<ReviewFormState> {
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(`review:${ip}`, { limit: 5, windowMs: 24 * 60 * 60 * 1000 }).ok) {
    return { error: "Твърде много отзиви от това устройство. Опитай утре." };
  }

  const parsed = reviewSchema.safeParse({
    authorName: formData.get("authorName"),
    city: formData.get("city") ?? "",
    rating: formData.get("rating"),
    text: formData.get("text"),
    orderNumber: formData.get("orderNumber") || "",
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { error: "Провери отбелязаните полета.", fieldErrors };
  }

  const d = parsed.data;
  await prisma.review.create({
    data: {
      authorName: d.authorName,
      city: d.city || null,
      rating: d.rating,
      text: d.text,
      orderNumber: typeof d.orderNumber === "number" ? d.orderNumber : null,
      status: "PENDING",
    },
  });

  revalidatePath("/admin");
  return { ok: true };
}
