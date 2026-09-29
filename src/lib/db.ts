import "server-only";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? "file:./dev.db",
  });
  return new PrismaClient({ adapter });
}

// Reuse one client across hot reloads in development. After `prisma generate` (a new migration),
// the reloaded module brings a new PrismaClient class; a client cached from the old one would
// reject the new fields, so it is replaced instead of reused.
const cached = globalForPrisma.prisma;
export const db = cached instanceof PrismaClient ? cached : createClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
