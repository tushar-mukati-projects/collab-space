import type { PrismaClient } from "@prisma/client";

export const up = async (prisma: PrismaClient) => {
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS workspace_id TEXT`,
  );

  await prisma.$executeRawUnsafe(`DELETE FROM "Notification" WHERE workspace_id IS NULL`);

  await prisma.$executeRawUnsafe(
    `ALTER TABLE "Notification" ALTER COLUMN workspace_id SET NOT NULL`,
  );

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      ALTER TABLE "Notification"
        ADD CONSTRAINT "Notification_workspace_id_fkey"
        FOREIGN KEY (workspace_id) REFERENCES "Workspace"(id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);

  await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS "Notification_user_read_created_idx"`);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "Notification_user_workspace_read_created_idx"
    ON "Notification"(user_id, workspace_id, read, created_at DESC)
  `);
};
