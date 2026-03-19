import type { Request, Response } from "express";
import { validated } from "../types.js";
import { userIdSchema } from "../schemas/users.schema.js";
import { listWorkspaceUsers, getWorkspaceUser } from "../services/user.service.js";

export const list = async (req: Request, res: Response) => {
  const { workspaceId } = validated(req);
  res.json(await listWorkspaceUsers(workspaceId));
};
export const getOne = async (req: Request, res: Response) => {
  const {
    params: { id },
    workspaceId,
  } = validated(req, userIdSchema);
  const u = await getWorkspaceUser(id, workspaceId);
  if (!u) return res.status(404).json({ error: "User not found" });
  res.json(u);
};
