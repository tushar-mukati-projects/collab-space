import type { Request, Response } from "express";
import { wrapController } from "./index.js";
import { validated } from "../types.js";
import { statusIdSchema } from "../schemas/statuses.schema.js";
import { listStatuses, updateStatus } from "../services/status.service.js";

const listCtrl = async (req: Request, res: Response) => {
  res.json(await listStatuses(req.workspaceId));
};
const updateCtrl = async (req: Request, res: Response) => {
  const {
    params: { id },
  } = validated(req, statusIdSchema);
  const s = await updateStatus(id, req.body, req.workspaceId);
  if (!s) return res.status(404).json({ error: "Status not found" });
  res.json(s);
};

export const list = wrapController(listCtrl);
export const update = wrapController(updateCtrl);
