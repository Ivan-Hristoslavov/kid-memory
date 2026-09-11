import type { MentyProduct } from "@/lib/shop/products";

/**
 * Which supplier makes what, and how one order becomes several.
 *
 * The shop sells across suppliers that do not overlap. printondemand.bg is a
 * DTF and sublimation house for textiles — twenty garments, four drinking
 * vessels, stickers and a box, and nothing on paper. The illustrated poster is
 * printed by us. The children's book will need a third partner entirely,
 * because nobody in the first two binds A5 signatures.
 *
 * So a basket is not one fulfilment. A mug and a poster in the same order are
 * two jobs, at two addresses, in two parcels. That is a commercial fact rather
 * than a technical one and this module's job is to make it visible rather than
 * to hide it — an order silently sent to one printer that cannot make half of
 * it is the worst possible outcome.
 *
 * ── THE SPLIT IS DECLARED, NEVER INFERRED ────────────────────────────────
 * `supplier` on the catalogue entry is the whole rule. Not the family, not the
 * print area, not whether a `supplierProductCode` happens to be set. A product
 * moving between printers is then one field, which has already happened once
 * when the shop left PrintFactory.
 * ─────────────────────────────────────────────────────────────────────────
 */

/** Who makes a thing. "OWN" is us — the poster, and for now the book. */
export type FulfilmentTarget = MentyProduct["supplier"];

export interface FulfilmentLine {
  /** OrderLine id, so the print file can be fetched for it. */
  id: string;
  product: MentyProduct;
  quantity: number;
  title: string;
}

export interface FulfilmentJob {
  target: FulfilmentTarget;
  /** Human name for the admin, and for talking to the supplier. */
  label: string;
  lines: FulfilmentLine[];
}

const LABELS: Record<string, string> = {
  PRINTONDEMAND: "printondemand.bg",
  PRINTFACTORY: "PrintFactory",
  OWN: "Наша изработка",
};

export function targetLabel(target: FulfilmentTarget): string {
  return LABELS[target] ?? target;
}

/**
 * One job per supplier, in a stable order.
 *
 * Stable because the admin reads it as a checklist and a list that reorders
 * itself between refreshes is one that gets a line missed. Lines whose product
 * has left the catalogue are dropped here rather than assigned to a guess —
 * they are still visible in the order itself, which is where an operator
 * should notice them.
 */
export function splitByFulfilment(
  lines: readonly FulfilmentLine[]
): FulfilmentJob[] {
  const byTarget = new Map<FulfilmentTarget, FulfilmentLine[]>();
  for (const line of lines) {
    const target = line.product.supplier;
    const bucket = byTarget.get(target);
    if (bucket) bucket.push(line);
    else byTarget.set(target, [line]);
  }

  return [...byTarget.entries()]
    .map(([target, jobLines]) => ({
      target,
      label: targetLabel(target),
      lines: jobLines,
    }))
    .sort((a, b) => a.target.localeCompare(b.target));
}

/**
 * Whether this order will arrive in more than one parcel.
 *
 * Worth answering out loud. The customer was charged delivery once — the cart
 * has one threshold and one fee — and a split order pays two couriers. On a
 * 9.99 mug beside a 17.90 poster that is most of the margin, and it is the kind
 * of thing a shop discovers at the end of a month rather than at the checkout.
 */
export function splitsIntoParcels(jobs: readonly FulfilmentJob[]): boolean {
  return jobs.length > 1;
}
