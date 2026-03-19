import type { Request, Response } from "express";
import { validated } from "../types.js";
import { statusIdSchema } from "../schemas/statuses.schema.js";
import { listStatuses, updateStatus } from "../services/status.service.js";

export const list = async (req: Request, res: Response) => {
  const { workspaceId } = validated(req);
  res.json(await listStatuses(workspaceId));
};
export const update = async (req: Request, res: Response) => {
  const {
    params: { id },
    workspaceId,
  } = validated(req, statusIdSchema);
  const s = await updateStatus(id, req.body, workspaceId);
  if (!s) return res.status(404).json({ error: "Status not found" });
  res.json(s);
};
