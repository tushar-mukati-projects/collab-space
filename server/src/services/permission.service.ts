import { prisma } from "../db.js";
import { ALL_PERMISSIONS, DEFAULT_ROLE_PERMISSIONS, WORKSPACE_ROLES } from "../constants.js";
import type { Permission } from "../constants.js";
import { logger } from "../logger.js";

const CACHE_TTL = 30_000;
const cache = new Map<string, { perms: Set<Permission>; expires: number }>();

const cacheKey = (workspaceId: string, role: string) => `${workspaceId}:${role}`;

const invalidateCache = (workspaceId: string) => {
  for (const key of cache.keys()) {
    if (key.startsWith(`${workspaceId}:`)) cache.delete(key);
  }
};

export const seedWorkspacePermissions = async (workspaceId: string) => {
  const existing = await prisma.rolePermission.findFirst({ where: { workspace_id: workspaceId } });
  if (existing) return;

  const rows = Object.entries(DEFAULT_ROLE_PERMISSIONS).flatMap(([role, perms]) =>
    perms.map((permission) => ({ workspace_id: workspaceId, role: role as any, permission })),
  );

  await prisma.rolePermission.createMany({ data: rows, skipDuplicates: true });
  invalidateCache(workspaceId);
  logger.info("Seeded default permissions", {
    workspaceId,
    roles: Object.keys(DEFAULT_ROLE_PERMISSIONS),
  });
};

export const getPermissionsForRole = async (
  workspaceId: string,
  role: string,
): Promise<Set<Permission>> => {
  if (role === WORKSPACE_ROLES.ADMIN) {
    return new Set(ALL_PERMISSIONS);
  }

  const key = cacheKey(workspaceId, role);
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) {
    return cached.perms;
  }

  let rows = await prisma.rolePermission.findMany({
    where: { workspace_id: workspaceId, role: role as any },
    select: { permission: true },
  });

  if (rows.length === 0) {
    await seedWorkspacePermissions(workspaceId);
    rows = await prisma.rolePermission.findMany({
      where: { workspace_id: workspaceId, role: role as any },
      select: { permission: true },
    });
  }

  const perms = new Set(rows.map((r) => r.permission as Permission));
  cache.set(key, { perms, expires: Date.now() + CACHE_TTL });
  return perms;
};

export const getAllPermissionsForWorkspace = async (workspaceId: string) => {
  await seedWorkspacePermissions(workspaceId);

  const rows = await prisma.rolePermission.findMany({
    where: { workspace_id: workspaceId },
    select: { role: true, permission: true },
  });

  const grouped: Record<string, string[]> = {};
  for (const row of rows) {
    if (!grouped[row.role]) grouped[row.role] = [];
    grouped[row.role].push(row.permission);
  }

  return grouped;
};

export const updateRolePermissions = async (
  workspaceId: string,
  role: string,
  permissions: string[],
) => {
  if (role === WORKSPACE_ROLES.ADMIN) {
    return { error: "cannot_modify_admin" as const };
  }

  const validPerms = permissions.filter((p) => ALL_PERMISSIONS.includes(p as Permission));

  await prisma.$transaction([
    prisma.rolePermission.deleteMany({
      where: { workspace_id: workspaceId, role: role as any },
    }),
    prisma.rolePermission.createMany({
      data: validPerms.map((permission) => ({
        workspace_id: workspaceId,
        role: role as any,
        permission,
      })),
    }),
  ]);

  invalidateCache(workspaceId);
  logger.info("Updated role permissions", { workspaceId, role, count: validPerms.length });
  return { error: null };
};
