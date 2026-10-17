import type { PrismaClient } from "@prisma/client";

export const up = async (prisma: PrismaClient) => {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Board" (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      workspace_id TEXT NOT NULL REFERENCES "Workspace"(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "Board_workspace_id_idx" ON "Board"(workspace_id)
  `);

  await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS set_board_updated_at ON "Board"`);
  await prisma.$executeRawUnsafe(`
    CREATE TRIGGER set_board_updated_at BEFORE UPDATE ON "Board"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at()
  `);
};
