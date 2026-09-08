/**
 * Test mode (TEST_MODE=true): for development/QA only.
 * Removes rate limits and returns the full, un-watermarked render in the
 * preview so everything generated can be inspected without restriction.
 * NEVER enable in production — it exposes print-quality files pre-payment.
 */
export function isTestMode(): boolean {
  return process.env.TEST_MODE === "true";
}

/**
 * Whether the image model renders the poster wording itself.
 *
 * This used to be derived from AI_PROVIDER, which tied two unrelated decisions
 * together: who draws the picture, and who writes the letters. gpt-image-1 is
 * the better illustrator and the worse speller — asked for Bulgarian it returns
 * malformed ъ, щ and я often enough that posters shipped with typos. Splitting
 * the flag keeps the stronger artwork and takes the lettering back into the
 * app, where the customer's exact string is drawn as vector outlines.
 *
 * "bake" is retained for comparing output, and because a future model may spell
 * Cyrillic reliably. It must not be the default while one still cannot.
 */
export function aiBakesText(): boolean {
  return process.env.AI_TEXT_MODE === "bake";
}

/**
 * Whether the shop offers card payment at all.
 *
 * Public rather than server-only because the storefront has to know: the price
 * cards, the digital product and the checkout form all render on the client and
 * must agree with what the server will accept. The secret keys stay server-side
 * — this flag only says the merchant account exists.
 *
 * Cash on delivery is never behind this. It is the fallback that always works.
 */
export function cardPaymentsOffered(): boolean {
  return process.env.NEXT_PUBLIC_STRIPE_ENABLED === "true";
}
