import { clerkMiddleware, getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { prisma } from "../db.js";

export { clerkMiddleware };

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  (req as any).userId = userId;
  next();
};

const wsCache = new Map<string, { workspaceId: string; expiresAt: number }>();
const CACHE_TTL = 60_000;

export const requireWorkspace = async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  (req as any).userId = userId;

  const cached = wsCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    (req as any).workspaceId = cached.workspaceId;
    return next();
  }

  const membership = await prisma.workspaceMember.findFirst({
    where: { user_id: userId },
    select: { workspace_id: true },
    orderBy: { joined_at: "asc" },
  });

  if (!membership) return res.status(404).json({ error: "No workspace found" });

  (req as any).workspaceId = membership.workspace_id;
  wsCache.set(userId, { workspaceId: membership.workspace_id, expiresAt: Date.now() + CACHE_TTL });
  next();
};
