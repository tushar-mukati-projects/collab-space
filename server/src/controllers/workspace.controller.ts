import type { Request, Response } from "express";
import { validated } from "../types.js";
import { getUserWorkspaceWithMembers } from "../services/workspace.service.js";

export const getWorkspace = async (req: Request, res: Response) => {
  const { userId } = validated(req);
  const workspace = await getUserWorkspaceWithMembers(userId);
  res.json(workspace ?? null);
};
