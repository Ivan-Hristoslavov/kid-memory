/**
 * Runs the photo pre-pass over real image files and prints what it saw.
 *
 * The gate decides whether a customer's upload is refused, so its strictness
 * has to be judged against actual photos rather than reasoned about: the useful
 * question is not "does the call work" but "does it wave through the ordinary
 * badly-lit phone snapshot of a toddler and stop only the hopeless ones". This
 * prints the verdict and the extracted features side by side so both can be
 * checked, and it prints the prompt block that generation would actually spend.
 *
 * Costs one vision call per file. Requires OPENAI_API_KEY.
 *
 * Run: npx tsx --tsconfig scripts/tsconfig.json scripts/test-describe.ts <photo...>
 */
import { promises as fs } from "fs";
import path from "path";
import { config } from "dotenv";
import { describePhoto, describeForPrompt } from "@/lib/ai/describe-photo";

config();

async function main() {
  const files = process.argv.slice(2);
  if (!files.length) {
    console.error("Usage: test-describe.ts <photo.jpg> [more.png ...]");
    process.exit(1);
  }
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY is not set — the pre-pass would return checked:false.");
    process.exit(1);
  }

  for (const file of files) {
    const name = path.basename(file);
    let buf: Buffer;
    try {
      buf = await fs.readFile(file);
    } catch {
      console.log(`\n=== ${name} ===\n  cannot read file`);
      continue;
    }

    const started = Date.now();
    const result = await describePhoto(buf);
    const ms = Date.now() - started;

    console.log(`\n=== ${name} === (${ms}ms)`);
    if (!result.checked) {
      console.log("  checked: false — call did not run; upload would proceed undescribed");
      continue;
    }

    console.log(`  faces: ${result.faces}`);
    console.log(
      `  verdict: ${result.blockers.length ? `REFUSED (${result.blockers.join(", ")})` : "accepted"}`
    );
    for (const [i, s] of result.subjects.entries()) {
      console.log(`  subject ${i + 1} (${s.position}, ${s.kind}):`);
      console.log(`    features: ${s.features}`);
      console.log(`    hair:     ${s.hair}`);
      console.log(`    clothing: ${s.clothing || "—"}`);
      console.log(`    glasses:  ${s.glasses ?? "—"}`);
    }

    const block = describeForPrompt(result);
    if (block) console.log(`\n  prompt block:\n    ${block}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
