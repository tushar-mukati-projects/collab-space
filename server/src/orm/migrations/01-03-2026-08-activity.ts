import type { PrismaClient } from "@prisma/client";

export const up = async (prisma: PrismaClient) => {
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "ActivityType" AS ENUM (
        'ticket_created', 'ticket_updated', 'ticket_status_changed',
        'ticket_assigned', 'comment_added', 'document_created',
        'document_updated', 'meeting_created', 'meeting_started', 'meeting_ended'
      );
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Activity" (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
      type "ActivityType" NOT NULL,
      message TEXT NOT NULL,
      user_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
      ticket_id UUID NOT NULL REFERENCES "Ticket"(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "Activity_ticket_created_idx" ON "Activity"(ticket_id, created_at)
  `);
};
