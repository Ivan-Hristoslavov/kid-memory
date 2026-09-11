/**
 * Reads PrintFactory's API catalogue and writes it to a file.
 *
 * Run: node node_modules/.bin/tsx --tsconfig scripts/tsconfig.json \
 *        scripts/pf-catalogue.ts
 *
 * A script and not a request-time fetch, for the same reason the supplier
 * blanks in lib/pod/catalog.ts are a file: a shop's product range is not
 * something to discover while somebody is waiting for a page, and a supplier
 * having a bad morning must not empty the catalogue.
 *
 * What comes back is NOT PrintFactory's range. It is the products this account
 * has built by hand in their Design Studio and added to the API catalogue —
 * their help centre is explicit that anything else is invisible to every
 * integration. So an empty answer is the correct answer until somebody has sat
 * in their designer; this script says so plainly rather than looking broken.
 */
import fs from "fs";
import path from "path";
import { config } from "dotenv";
import { PrintFactoryProvider } from "@/lib/pod/printfactory";

config({ path: path.join(process.cwd(), ".env"), quiet: true });

const OUT = path.join(process.cwd(), "src", "lib", "pod", "pf-catalogue.json");

async function main(): Promise<void> {
  const pf = new PrintFactoryProvider();
  if (!pf.configured()) {
    console.error(
      "PRINTFACTORY_CLIENT_CODE / PRINTFACTORY_API_KEY missing from .env"
    );
    process.exit(1);
  }

  const products = await pf.listApiCatalogue();

  if (products.length === 0) {
    console.log("PrintFactory API catalogue: empty.");
    console.log(
      "\nThat is their model, not a failure. A product reaches this list only\n" +
        "after somebody opens printfactory.bg, builds it in the Design Studio,\n" +
        "saves it to Темплейти and presses „Добави в API каталог“. Nothing has\n" +
        "been prepared on this account yet.\n"
    );
    // Still written, so the file exists and the shape is stable.
  }

  fs.writeFileSync(
    OUT,
    JSON.stringify(
      {
        fetchedAt: new Date().toISOString().slice(0, 10),
        count: products.length,
        products,
      },
      null,
      2
    ) + "\n"
  );

  console.log(`${products.length} product(s) → ${path.relative(process.cwd(), OUT)}`);
  for (const p of products) {
    console.log(`  ${p.sku}  ${p.name ?? "(no name)"}  print=${p.print_type ?? "-"}`);
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
