import type { PrismaClient } from "@prisma/client";

export const up = async (prisma: PrismaClient) => {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ProcessedWebhookEvent" (
      id TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
};
