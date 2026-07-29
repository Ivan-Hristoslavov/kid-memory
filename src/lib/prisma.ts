import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  // Prisma 7 uses a driver adapter for the connection instead of the
  // schema `url`. The pg adapter reads the connection string directly.
  const raw = process.env.DATABASE_URL ?? "";
  const isSupabase = raw.includes("supabase.com");
  // Supabase's pooler presents a self-signed chain. node-postgres would reject
  // it when `sslmode` comes from the URL, so strip that param and pass an
  // explicit ssl config instead (still encrypted, CA not verified).
  // The Prisma CLI keeps using the URL as-is for migrations.
  const connectionString = isSupabase ? raw.replace(/([?&])sslmode=[^&]*/g, "$1").replace(/[?&]$/, "") : raw;
  const adapter = new PrismaPg({
    connectionString,
    ...(isSupabase ? { ssl: { rejectUnauthorized: false } } : {}),
  });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
