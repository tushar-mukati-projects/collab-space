import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import type { AuthedRequest } from "../types.js";
import type { Permission } from "../constants.js";
import { prisma } from "../db.js";
import { logger } from "../logger.js";
import { getPermissionsForRole } from "../services/permission.service.js";

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const { userId } = getAuth(req);
  if (!userId) {
    logger.warn("Unauthorized request", { path: req.path, ip: req.ip });
    return res.status(401).json({ error: "Unauthorized" });
  }
  (req as any).userId = userId;
  next();
};

export const workspaceMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const userId = (req as AuthedRequest).userId;
  if (!userId) return next();

  const membership = await prisma.workspaceMember.findFirst({
    where: { user_id: userId },
    select: { workspace_id: true, role: true },
    orderBy: { joined_at: "asc" },
  });

  if (membership) {
    (req as any).workspaceId = membership.workspace_id;
    (req as any).memberRole = membership.role;
    (req as any).permissions = await getPermissionsForRole(
      membership.workspace_id,
      membership.role,
    );
  }

  next();
};

export const requirePermission = (...permissions: Permission[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userPerms = (req as any).permissions as Set<Permission> | undefined;
    if (!userPerms) {
      return res.status(403).json({ error: "Forbidden" });
    }
    for (const perm of permissions) {
      if (!userPerms.has(perm)) {
        return res.status(403).json({ error: "Forbidden", required: perm });
      }
    }
    next();
  };
};
