import { z } from "zod";
import { ADDONS, ANIMALS, AVAILABLE_PRODUCTS, STYLES } from "@/lib/catalog";

export const MAX_PHOTO_BYTES = 8 * 1024 * 1024; // 8 MB
/** Below this the face carries too little detail for a usable likeness. */
export const MIN_PHOTO_SIDE = 500;
/** sharp's `stats().sharpness`; typical in-focus phone photos sit well above. */
export const BLUR_THRESHOLD = 1.6;
export const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

export const funnyWordSchema = z.object({
  word: z.string().trim().min(1, "Въведи думата").max(60),
  saidAs: z.string().trim().min(1, "Въведи как я казва детето").max(60),
  // Optional: what the AI should draw beside this bubble (animal/object).
  visual: z.string().trim().max(60).optional().or(z.literal("")),
});

export const childInfoSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Името трябва да е поне 2 букви")
    .max(30, "Името е твърде дълго"),
  age: z.coerce.number().min(0, "Невалидна възраст").max(18, "Невалидна възраст"),
  gender: z.enum(["BOY", "GIRL"]),
});

export const childSchema = childInfoSchema.extend({
  words: z.array(funnyWordSchema).min(1, "Добави поне една думичка").max(12),
});

export const posterInputSchema = z.object({
  children: z
    .array(childSchema)
    .min(1, "Добави поне едно дете")
    .max(3, "Максимум 3 деца на постер"),
  photoKey: z.string().min(1, "Качи снимка"),
  leadEmail: z.string().trim().email("Невалиден имейл").optional().or(z.literal("")),
  // Animals step is currently disabled — per-word `visual` covers this better.
  animals: z
    .array(z.enum(ANIMALS.map((a) => a.id) as [string, ...string[]]))
    .max(4, "Избери до 4 животни")
    .default([]),
  style: z.enum(STYLES.map((s) => s.id) as [string, ...string[]]),
});

export type PosterInput = z.infer<typeof posterInputSchema>;
export type ChildInput = z.infer<typeof childSchema>;

const bgPhoneRegex = /^(\+359|0)8[7-9][0-9]{7}$/;

export const checkoutSchema = z
  .object({
    orderId: z.string().cuid(),
    // Only products currently on sale can be ordered — a hidden product must
    // not be reachable by posting its id directly.
    productType: z.enum(AVAILABLE_PRODUCTS as unknown as [string, ...string[]], {
      message: "Избери наличен продукт",
    }),
    addons: z.array(z.enum(Object.keys(ADDONS) as [string, ...string[]])).default([]),
    customerName: z.string().trim().min(3, "Въведи име и фамилия").max(80),
    phone: z
      .string()
      .trim()
      .transform((v) => v.replace(/[\s-]/g, ""))
      .pipe(z.string().regex(bgPhoneRegex, "Невалиден български телефонен номер")),
    email: z.string().trim().email("Невалиден имейл адрес").max(120),
    city: z.string().trim().min(2, "Въведи град").max(60),
    address: z.string().trim().max(200).optional().or(z.literal("")),
    courier: z.enum(["ECONT", "SPEEDY"]),
    deliveryMethod: z.enum(["OFFICE", "ADDRESS", "LOCKER"]),
    courierOffice: z.string().trim().max(200).optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    // Digital product needs no physical delivery details
    if (data.productType === "DIGITAL") return;
    if (data.deliveryMethod === "ADDRESS" && !data.address) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["address"],
        message: "Въведи адрес за доставка",
      });
    }
    if (
      (data.deliveryMethod === "OFFICE" || data.deliveryMethod === "LOCKER") &&
      !data.courierOffice
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["courierOffice"],
        message: "Избери офис или автомат",
      });
    }
  });

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const adminStatusSchema = z.object({
  orderId: z.string().cuid(),
  status: z.enum([
    "CREATED",
    "GENERATING",
    "PREVIEW_READY",
    "CONFIRMED",
    "PRINTING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ]),
  trackingNumber: z.string().trim().max(60).optional(),
});
