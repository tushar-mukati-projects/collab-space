import type { PrismaClient } from "@prisma/client";

export const up = async (prisma: PrismaClient) => {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "RolePermission" (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
      workspace_id TEXT NOT NULL REFERENCES "Workspace"(id) ON DELETE CASCADE,
      role "UserRole" NOT NULL,
      permission TEXT NOT NULL,
      UNIQUE(workspace_id, role, permission)
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "RolePermission_workspace_role_idx"
    ON "RolePermission"(workspace_id, role)
  `);
};
