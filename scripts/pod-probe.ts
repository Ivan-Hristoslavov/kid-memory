/**
 * Exercises the live printondemand.bg API against the documented v2.2 surface.
 *
 * Read-only: it lists reference data and products, and never posts an order.
 *
 * Run: node --env-file=.env node_modules/.bin/tsx --tsconfig scripts/tsconfig.json \
 *        scripts/pod-probe.ts
 */
import { activePodProvider, allPodProviders } from "@/lib/pod";
import { PrintOnDemandProvider } from "@/lib/pod/printondemand";

async function main() {
  for (const p of allPodProviders()) {
    console.log(`${p.id.padEnd(14)} ${p.name.padEnd(22)} ${p.configured() ? "configured" : "not configured"}`);
  }
  const active = activePodProvider();
  console.log(`active: ${active ? active.name : "none"}\n`);
  if (!(active instanceof PrintOnDemandProvider)) return;

  const sizes = await active.nomenclature.sizes();
  console.log(`sizes:      ${sizes.data.length} — ${sizes.data.slice(0, 8).map((s) => `${s.id}:${s.name}`).join(", ")}`);

  const colors = await active.nomenclature.colors();
  console.log(`colors:     ${colors.data.length} — ${colors.data.slice(0, 4).map((c) => c.name).join(", ")}…`);

  const statuses = await active.nomenclature.orderStatuses();
  console.log(`statuses:   ${statuses.data.map((s) => s.name).join(", ")}`);

  const products = await active.listProducts();
  console.log(`our products:        ${products.data.length}`);

  const fulfilment = await active.listFulfilmentProducts();
  console.log(`fulfilment products: ${fulfilment.data.length}`);
  for (const p of fulfilment.data.slice(0, 3)) {
    const s = p.sizes[0];
    console.log(`  #${p.id} ${p.name} — ${p.sizes.length} sizes, from ${s?.total_price} лв, stock ${s?.quantity}`);
  }
}
main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
