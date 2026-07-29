/**
 * Trader identification shown on legal pages and in the footer.
 * EU/BG e-commerce law requires these to be accurate and publicly visible.
 * ⚠️ REPLACE the placeholders with the real company data before launch.
 */
export const COMPANY = {
  legalName: process.env.NEXT_PUBLIC_COMPANY_NAME || "[Име на фирмата ЕООД]",
  eik: process.env.NEXT_PUBLIC_COMPANY_EIK || "[ЕИК/БУЛСТАТ]",
  address: process.env.NEXT_PUBLIC_COMPANY_ADDRESS || "[Адрес на управление]",
  email: process.env.NEXT_PUBLIC_COMPANY_EMAIL || "hello@biserite.bg",
  phone: process.env.NEXT_PUBLIC_COMPANY_PHONE || "[Телефон]",
  brand: "Бисерите на моето дете",
} as const;

/** How long an uploaded child photo is kept before automatic deletion. */
export const PHOTO_RETENTION_DAYS = 90;
