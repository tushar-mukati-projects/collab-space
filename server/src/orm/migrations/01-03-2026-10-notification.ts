import type { PrismaClient } from "@prisma/client";

export const up = async (prisma: PrismaClient) => {
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "NotificationType" AS ENUM (
        'ticket_assigned', 'mentioned', 'meeting_starting', 'document_shared', 'status_changed'
      );
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Notification" (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
      type "NotificationType" NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      read BOOLEAN NOT NULL DEFAULT FALSE,
      link TEXT NOT NULL,
      actor_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "Notification_user_read_created_idx"
    ON "Notification"(user_id, read, created_at DESC)
  `);
};
