/**
 * What one generation costs us, so margin is visible per order instead of only
 * as a monthly API bill.
 *
 * These are gpt-image-1 list prices for a 1024x1536 image at each quality tier,
 * converted to EUR. They are configuration, not measurements — if the provider
 * or the exchange rate moves, update `AI_COST_*` env vars rather than the code.
 */
export type AiQuality = "low" | "medium" | "high";

const DEFAULTS: Record<AiQuality, number> = {
  low: 0.017,
  medium: 0.063,
  high: 0.25,
};

export function aiCostEUR(quality: AiQuality): number {
  const override = process.env[`AI_COST_${quality.toUpperCase()}`];
  const parsed = override ? Number(override) : NaN;
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULTS[quality];
}
