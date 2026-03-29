import type { PrismaClient } from "@prisma/client";

export const up = async (prisma: PrismaClient) => {
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "UserRole" AS ENUM ('admin', 'member');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "UserStatus" AS ENUM ('online', 'offline', 'away');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "WorkspaceMember" (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
      workspace_id TEXT NOT NULL REFERENCES "Workspace"(id) ON DELETE CASCADE,
      role "UserRole" NOT NULL DEFAULT 'member',
      status "UserStatus" NOT NULL DEFAULT 'offline',
      joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, workspace_id)
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "WorkspaceMember_workspace_id_idx" ON "WorkspaceMember"(workspace_id)
  `);
};
