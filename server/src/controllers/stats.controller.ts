import type { Request, Response } from "express";
import { validated } from "../types.js";
import { getWorkspaceStats } from "../services/stats.service.js";

export const stats = async (req: Request, res: Response) => {
  const { workspaceId } = validated(req);
  res.json(await getWorkspaceStats(workspaceId));
};
