import type { Request, Response, NextFunction } from "express";
import { getWorkspaceStats } from "../services/stats.service.js";

export const stats = async (req: Request, res: Response, next: NextFunction) => {
  const workspaceId = (req as any).workspaceId as string;
  if (!workspaceId) return res.status(400).json({ error: "No workspace" });

  try {
    res.json(await getWorkspaceStats(workspaceId));
  } catch (err) {
    next(err);
  }
};
