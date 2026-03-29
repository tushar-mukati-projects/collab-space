import type { PrismaClient } from "@prisma/client";

export const up = async (prisma: PrismaClient) => {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Attachment" (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      url TEXT NOT NULL,
      size INT NOT NULL,
      mime_type TEXT NOT NULL,
      uploaded_by TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
      ticket_id UUID NOT NULL REFERENCES "Ticket"(id) ON DELETE CASCADE,
      workspace_id TEXT NOT NULL REFERENCES "Workspace"(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "Attachment_ticket_id_idx" ON "Attachment"(ticket_id)
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "Attachment_workspace_id_idx" ON "Attachment"(workspace_id)
  `);
};
