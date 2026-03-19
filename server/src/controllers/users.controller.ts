import type { Request, Response } from "express";
import { wrapController } from "./index.js";
import { validated } from "../types.js";
import { userIdSchema } from "../schemas/users.schema.js";
import { listWorkspaceUsers, getWorkspaceUser } from "../services/user.service.js";

const listCtrl = async (req: Request, res: Response) => {
  res.json(await listWorkspaceUsers(req.workspaceId));
};
const getOneCtrl = async (req: Request, res: Response) => {
  const {
    params: { id },
  } = validated(req, userIdSchema);
  const u = await getWorkspaceUser(id, req.workspaceId);
  if (!u) return res.status(404).json({ error: "User not found" });
  res.json(u);
};

export const list = wrapController(listCtrl);
export const getOne = wrapController(getOneCtrl);
