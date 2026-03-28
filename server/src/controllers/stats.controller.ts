import type { Request, Response } from "express";
import { getWorkspaceStats } from "../services/stats.service.js";

export const stats = async (req: Request, res: Response) => {
  const workspaceId = (req as any).workspaceId as string;
  if (!workspaceId) return res.status(400).json({ error: "No workspace" });
  res.json(await getWorkspaceStats(workspaceId));
};
