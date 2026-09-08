/**
 * Re-syncs the seeded campaigns' accent colours onto rows that already exist.
 *
 * `seedCampaignsIfEmpty` only ever runs against an empty table, so changing
 * DEFAULT_CAMPAIGNS moves nothing that has already been seeded. That mattered
 * the moment the brand palette changed: a campaign sets `--primary` and
 * `--blush` as inline CSS variables on the whole home page, so the old
 * saturated accents (a bright blue, a pink, a green, an orange) simply painted
 * over the MENTY tokens and the rebrand looked like it had not been applied.
 *
 * Matching is by name, and ONLY the two colour columns are touched — a
 * campaign's copy, window and priority may well have been edited by hand in
 * the admin panel and must survive this.
 *
 * Run: npx tsx --tsconfig scripts/tsconfig.json scripts/sync-campaign-colors.ts
 * Add --dry to print what would change without writing.
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { DEFAULT_CAMPAIGNS } from "@/lib/campaigns";

const dry = process.argv.includes("--dry");

/**
 * Same connection dance as src/lib/prisma.ts: the Prisma CLI accepts
 * `sslmode=require` in the URL but node-postgres rejects Supavisor's
 * self-signed chain, so the parameter is stripped and SSL is passed explicitly.
 */
function client(): PrismaClient {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL is not set");
  const url = new URL(raw);
  url.searchParams.delete("sslmode");
  const adapter = new PrismaPg({
    connectionString: url.toString(),
    ssl: { rejectUnauthorized: false },
  });
  return new PrismaClient({ adapter });
}

async function main() {
  const prisma = client();
  let changed = 0;

  for (const seed of DEFAULT_CAMPAIGNS) {
    const existing = await prisma.campaign.findFirst({
      where: { name: seed.name },
      select: { id: true, name: true, accentColor: true, auraColor: true },
    });
    if (!existing) {
      console.log(`–  ${seed.name}: not in the database, skipped`);
      continue;
    }
    if (
      existing.accentColor === seed.accentColor &&
      existing.auraColor === seed.auraColor
    ) {
      console.log(`=  ${seed.name}: already current`);
      continue;
    }

    console.log(
      `${dry ? "?" : "→"}  ${seed.name}\n` +
        `      accent ${existing.accentColor} → ${seed.accentColor}\n` +
        `      aura   ${existing.auraColor} → ${seed.auraColor}`
    );
    if (!dry) {
      await prisma.campaign.update({
        where: { id: existing.id },
        data: { accentColor: seed.accentColor, auraColor: seed.auraColor },
      });
    }
    changed++;
  }

  console.log(
    dry
      ? `\n${changed} campaign(s) would be updated. Re-run without --dry to apply.`
      : `\n${changed} campaign(s) updated.`
  );
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
