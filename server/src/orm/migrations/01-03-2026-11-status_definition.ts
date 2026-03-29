import type { PrismaClient } from "@prisma/client";

export const up = async (prisma: PrismaClient) => {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "StatusDefinition" (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
      value "TicketStatus" NOT NULL,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      "order" INT NOT NULL,
      workspace_id TEXT NOT NULL REFERENCES "Workspace"(id) ON DELETE CASCADE,
      UNIQUE(workspace_id, value)
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "StatusDefinition_workspace_order_idx"
    ON "StatusDefinition"(workspace_id, "order")
  `);
};
