import type { Request, Response } from "express";
import { wrapController } from "./index.js";
import { getUserWorkspaceWithMembers } from "../services/workspace.service.js";

const getCtrl = async (req: Request, res: Response) => {
  const workspace = await getUserWorkspaceWithMembers(req.userId);
  res.json(workspace ?? null);
};

export const getWorkspace = wrapController(getCtrl);
