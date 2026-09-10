import { z } from "zod";
import { ADDONS, ANIMALS, AVAILABLE_PRODUCTS, STYLES } from "@/lib/catalog";
import {
  MAX_POSTER_LINES,
  TEMPLATES,
  TEMPLATE_ORDER,
  type TemplateId,
} from "@/lib/templates";

export const MAX_PHOTO_BYTES = 8 * 1024 * 1024; // 8 MB
/** Below this the face carries too little detail for a usable likeness. */
export const MIN_PHOTO_SIDE = 500;
/** sharp's `stats().sharpness`; typical in-focus phone photos sit well above. */
export const BLUR_THRESHOLD = 1.6;
export const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

/** One line on the poster: the big line, optionally a small one under it. */
export const posterLineSchema = z.object({
  text: z.string().trim().min(1, "Попълни текста").max(80, "Текстът е твърде дълъг"),
  sub: z.string().trim().max(80).optional().or(z.literal("")),
  // Optional: what the AI should draw beside this bubble (animal/object).
  visual: z.string().trim().max(60).optional().or(z.literal("")),
});

export const posterSubjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Името трябва да е поне 2 букви")
    .max(40, "Името е твърде дълго"),
  // Null means "this template does not ask for it" — distinct from an age of 0.
  age: z
    .number()
    .min(0, "Невалидна възраст")
    .max(120, "Невалидна възраст")
    .nullable()
    .optional(),
  gender: z.enum(["MALE", "FEMALE"]).nullable().optional(),
  relation: z.string().trim().max(40).optional().or(z.literal("")),
  species: z.string().trim().max(40).optional().or(z.literal("")),
  lines: z
    .array(posterLineSchema)
    .min(1, "Добави поне един ред")
    .max(MAX_POSTER_LINES, `Максимум ${MAX_POSTER_LINES} реда на постер`),
});

export const posterInputSchema = z
  .object({
    template: z.enum(TEMPLATE_ORDER as unknown as [TemplateId, ...TemplateId[]], {
      message: "Избери вид постер",
    }),
    subjects: z.array(posterSubjectSchema).min(1, "Добави поне един"),
    photoKey: z.string().min(1, "Качи снимка"),
    leadEmail: z.string().trim().email("Невалиден имейл").optional().or(z.literal("")),
    // Animals step is currently disabled — per-line `visual` covers this better.
    animals: z
      .array(z.enum(ANIMALS.map((a) => a.id) as [string, ...string[]]))
      .max(4, "Избери до 4 животни")
      .default([]),
    style: z.enum(STYLES.map((s) => s.id) as [string, ...string[]]),
  })
  // The template contract is enforced here, not only in the wizard: the client
  // can be bypassed, and a COUPLE poster built from one person or a PET poster
  // with no species produces a prompt that quietly makes no sense.
  .superRefine((data, ctx) => {
    const cfg = TEMPLATES[data.template].subject;
    if (data.subjects.length < cfg.min || data.subjects.length > cfg.max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["subjects"],
        message:
          cfg.min === cfg.max
            ? `Този постер иска точно ${cfg.min}`
            : `Този постер иска между ${cfg.min} и ${cfg.max}`,
      });
    }
    data.subjects.forEach((s, i) => {
      const who = s.name || cfg.noun;
      if (cfg.age === "required" && typeof s.age !== "number") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["subjects", i, "age"],
          message: `Въведи възраст на ${who}`,
        });
      }
      if (cfg.gender === "required" && !s.gender) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["subjects", i, "gender"],
          message: `Избери пол на ${who}`,
        });
      }
      if (cfg.species === "required" && !s.species) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["subjects", i, "species"],
          message: `Въведи вид или порода на ${who}`,
        });
      }
    });
  });

export type PosterInput = z.infer<typeof posterInputSchema>;
export type PosterSubjectInput = z.infer<typeof posterSubjectSchema>;

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
    /**
     * Delivery details are optional at the shape level and required in the
     * refinement below, for physical products only. A digital order ships by
     * email — asking it for a courier office would fail validation on a field
     * the form never showed.
     */
    city: z.string().trim().max(60).optional().or(z.literal("")),
    address: z.string().trim().max(200).optional().or(z.literal("")),
    courier: z.enum(["ECONT", "SPEEDY"]).optional().or(z.literal("")),
    deliveryMethod: z.enum(["OFFICE", "ADDRESS", "LOCKER"]).optional().or(z.literal("")),
    courierOffice: z.string().trim().max(200).optional().or(z.literal("")),
    /**
     * How the customer pays. Cash on delivery is the default because it is the
     * one method that is always available; card is only offered when the
     * merchant account is configured.
     */
    paymentMethod: z.enum(["COD", "STRIPE"]).default("COD"),
    /** Consent must be explicit — an unticked box is a "no", never an omission. */
    marketingOptIn: z.coerce.boolean().default(false),
    /** Optional; drives the yearly birthday reminder. */
    childBirthday: z
      .string()
      .trim()
      .optional()
      .or(z.literal(""))
      .transform((v) => (v ? new Date(v) : null))
      .refine((d) => d === null || !Number.isNaN(d.getTime()), "Невалидна дата"),
  })
  .superRefine((data, ctx) => {
    // Digital product needs no physical delivery details, but it does need the
    // money up front: a courier cannot collect cash for a file.
    if (data.productType === "DIGITAL") {
      if (data.paymentMethod !== "STRIPE") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["paymentMethod"],
          message: "Дигиталният файл се плаща онлайн с карта",
        });
      }
      return;
    }
    if (!data.city) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["city"],
        message: "Въведи град",
      });
    }
    if (!data.courier) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["courier"],
        message: "Избери куриер",
      });
    }
    if (!data.deliveryMethod) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["deliveryMethod"],
        message: "Избери начин на доставка",
      });
    }
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

/**
 * Catalogue checkout.
 *
 * The same customer, delivery and payment rules as `checkoutSchema`, minus
 * everything that belongs to a poster: there is no single `productType` to
 * choose, no add-on list (gift wrapping is chosen per line in the basket), and
 * no child's birthday. The basket itself is validated and priced separately in
 * lib/shop/pricing.ts, because a list of products is not a form field.
 *
 * Every catalogue item is physical, so delivery details are unconditionally
 * required here — there is no digital branch to exempt.
 */
export const shopCheckoutSchema = z
  .object({
    customerName: z.string().trim().min(3, "Въведи име и фамилия").max(80),
    phone: z
      .string()
      .trim()
      .transform((v) => v.replace(/[\s-]/g, ""))
      .pipe(z.string().regex(bgPhoneRegex, "Невалиден български телефонен номер")),
    email: z.string().trim().email("Невалиден имейл адрес").max(120),
    city: z.string().trim().max(60).optional().or(z.literal("")),
    address: z.string().trim().max(200).optional().or(z.literal("")),
    courier: z.enum(["ECONT", "SPEEDY"]).optional().or(z.literal("")),
    deliveryMethod: z.enum(["OFFICE", "ADDRESS", "LOCKER"]).optional().or(z.literal("")),
    courierOffice: z.string().trim().max(200).optional().or(z.literal("")),
    paymentMethod: z.enum(["COD", "STRIPE"]).default("COD"),
    /** Consent must be explicit — an unticked box is a "no", never an omission. */
    marketingOptIn: z.coerce.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    if (!data.city) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["city"], message: "Въведи град" });
    }
    if (!data.courier) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["courier"], message: "Избери куриер" });
    }
    if (!data.deliveryMethod) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["deliveryMethod"],
        message: "Избери начин на доставка",
      });
    }
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

export type ShopCheckoutInput = z.infer<typeof shopCheckoutSchema>;

/**
 * A personalised book, as posted by the wizard.
 *
 * The photo keys are storage keys minted by /api/upload, never files — the
 * upload has already normalised, stripped EXIF and refused unusable images by
 * the time this runs.
 */
export const bookInputSchema = z.object({
  characters: z
    .array(
      z.object({
        name: z.string().trim().min(2, "Въведи име").max(40),
        age: z.number().int().min(0).max(17).nullable().optional(),
        gender: z.enum(["BOY", "GIRL"]).nullable().optional(),
        description: z.string().trim().max(600).optional(),
        interests: z.string().trim().max(120).optional(),
        favouriteToy: z.string().trim().max(80).optional(),
        favouriteAnimal: z.string().trim().max(80).optional(),
        photoKey: z.string().min(1, "Качи снимка").max(200),
      })
    )
    .min(1, "Добави поне едно дете")
    .max(4, "Най-много четири деца"),
  /** Only meaningful with more than one child; the prompt actually spends it. */
  relationships: z.string().trim().max(500).optional(),
  adventure: z.string().min(1, "Избери приключение").max(40),
  customIdea: z.string().trim().max(800).optional(),
  ageGroup: z.enum(["AGE_3_5", "AGE_5_7", "AGE_7_9"]),
  mood: z.enum(["FUNNY", "MAGICAL", "ADVENTUROUS", "CALM", "EDUCATIONAL"]),
  mustInclude: z.array(z.string().trim().max(40)).max(10).default([]),
  style: z.string().min(1).max(40),
  dedication: z.string().trim().max(240).optional(),
  leadEmail: z.string().trim().email().max(120).optional().or(z.literal("")),
});

export type BookInput = z.infer<typeof bookInputSchema>;

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
