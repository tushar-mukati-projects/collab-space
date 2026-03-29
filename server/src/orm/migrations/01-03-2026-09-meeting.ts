import type { PrismaClient } from "@prisma/client";

export const up = async (prisma: PrismaClient) => {
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "MeetingStatus" AS ENUM ('scheduled', 'live', 'ended');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Meeting" (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      start_time TIMESTAMPTZ NOT NULL,
      end_time TIMESTAMPTZ NOT NULL,
      status "MeetingStatus" NOT NULL DEFAULT 'scheduled',
      room_id TEXT NOT NULL UNIQUE,
      recording_url TEXT,
      workspace_id TEXT NOT NULL REFERENCES "Workspace"(id) ON DELETE CASCADE
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "Meeting_workspace_start_idx" ON "Meeting"(workspace_id, start_time)
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "MeetingParticipant" (
      meeting_id TEXT NOT NULL REFERENCES "Meeting"(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
      PRIMARY KEY (meeting_id, user_id)
    )
  `);
};
