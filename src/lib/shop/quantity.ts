/**
 * The quantity discount, in a module both sides can import.
 *
 * It lives here rather than in `pricing.ts` because that file is `server-only`
 * and the basket needs the same rule on the client — a header total that
 * disagrees with the invoice is worse than no discount at all. The server still
 * prices the order; this is the rule, stated once, in a place with no server
 * dependencies.
 *
 * ── WHY IT COUNTS UNITS AND NOT LINES ────────────────────────────────────
 * The biggest order a shop like this takes is a party set — six shirts for a
 * hen weekend, five for a stag do — and the competition sells exactly that as a
 * single product. Ours could not, because every shirt in such an order is a
 * separate cart line: different name, different size, often a different role.
 * A per-line discount would never once have fired on the order it exists for.
 *
 * Six shirts with six different names is a set whatever the basket calls them.
 */
export const QUANTITY_TIERS: readonly { from: number; off: number }[] = [
  { from: 10, off: 0.2 },
  { from: 6, off: 0.15 },
  { from: 4, off: 0.1 },
];

export function quantityDiscount(units: number): number {
  return QUANTITY_TIERS.find((t) => units >= t.from)?.off ?? 0;
}

/** The next tier up, for the "add two more" nudge. Null at the top tier. */
export function nextTier(units: number): { from: number; off: number } | null {
  const better = [...QUANTITY_TIERS]
    .sort((a, b) => a.from - b.from)
    .find((t) => t.from > units);
  return better ?? null;
}
