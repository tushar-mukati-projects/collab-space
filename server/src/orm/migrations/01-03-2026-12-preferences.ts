import type { PrismaClient } from "@prisma/client";

export const up = async (prisma: PrismaClient) => {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "NotificationPrefs" (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
      workspace_id TEXT NOT NULL REFERENCES "Workspace"(id) ON DELETE CASCADE,
      ticket_assigned BOOLEAN NOT NULL DEFAULT TRUE,
      mentioned BOOLEAN NOT NULL DEFAULT TRUE,
      meeting_starting BOOLEAN NOT NULL DEFAULT TRUE,
      status_changed BOOLEAN NOT NULL DEFAULT FALSE,
      email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
      push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
      UNIQUE(user_id, workspace_id)
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "AppearancePrefs" (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
      workspace_id TEXT NOT NULL REFERENCES "Workspace"(id) ON DELETE CASCADE,
      theme TEXT NOT NULL DEFAULT 'system',
      accent_color TEXT NOT NULL DEFAULT 'indigo',
      font_size TEXT NOT NULL DEFAULT 'default',
      UNIQUE(user_id, workspace_id)
    )
  `);
};
