import type { PrismaClient } from "@prisma/client";

export const up = async (prisma: PrismaClient) => {
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "WorkspacePlan" AS ENUM ('free', 'pro', 'enterprise');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Workspace" (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      logo TEXT NOT NULL DEFAULT '',
      plan "WorkspacePlan" NOT NULL DEFAULT 'free',
      invited_emails TEXT[] DEFAULT '{}',
      stripe_customer_id TEXT UNIQUE,
      stripe_subscription_id TEXT UNIQUE,
      subscription_status TEXT NOT NULL DEFAULT 'none',
      current_period_end TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TRIGGER set_workspace_updated_at BEFORE UPDATE ON "Workspace"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at()
  `);
};
