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
 * Whether the active AI provider renders the poster text itself.
 * gpt-image-1 bakes the Bulgarian text into the art; Gemini (Nano Banana)
 * and the mock provider return a text-free illustration, so the app draws
 * the title + speech bubbles as a crisp SVG overlay instead.
 */
export function aiBakesText(): boolean {
  return process.env.AI_PROVIDER === "openai";
}
