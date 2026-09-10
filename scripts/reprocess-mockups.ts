/**
 * Re-derives the composite-ready PNGs from the raw generations.
 *
 * Separate from `gen-mockups.ts` so that tuning the shading strength or the
 * erosion does not mean paying for the pictures again. The raw file is the
 * expensive part and it never changes.
 *
 * Run: node node_modules/.bin/tsx --tsconfig scripts/tsconfig.json \
 *        scripts/reprocess-mockups.ts
 */
import { promises as fs } from "fs";
import path from "path";
import { toMockup } from "./mockup-alpha";

async function main() {
  const dir = path.join(process.cwd(), "public", "mockups");
  const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".raw.png"));
  for (const f of files) {
    const raw = await fs.readFile(path.join(dir, f));
    const out = f.replace(".raw.png", ".png");
    await fs.writeFile(path.join(dir, out), await toMockup(raw));
    const { size } = await fs.stat(path.join(dir, out));
    console.log(`${out.padEnd(28)} ${(size / 1024).toFixed(0)} KB`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
