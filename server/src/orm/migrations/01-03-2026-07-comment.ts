import type { PrismaClient } from "@prisma/client";

export const up = async (prisma: PrismaClient) => {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Comment" (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
      content TEXT NOT NULL,
      author_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
      ticket_id UUID NOT NULL REFERENCES "Ticket"(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "Comment_ticket_created_idx" ON "Comment"(ticket_id, created_at)
  `);
};
