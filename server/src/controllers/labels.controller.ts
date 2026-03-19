import type { Request, Response } from "express";
import { validated } from "../types.js";
import { createLabelSchema, labelIdSchema } from "../schemas/labels.schema.js";
import { listLabels, createLabel, updateLabel, deleteLabel } from "../services/label.service.js";

export const list = async (req: Request, res: Response) => {
  const { workspaceId } = validated(req);
  res.json(await listLabels(workspaceId));
};
export const create = async (req: Request, res: Response) => {
  const {
    body: { name, color },
    workspaceId,
  } = validated(req, createLabelSchema);
  res.status(201).json(await createLabel(name, color, workspaceId));
};
export const update = async (req: Request, res: Response) => {
  const {
    params: { id },
    workspaceId,
  } = validated(req, labelIdSchema);
  const l = await updateLabel(id, req.body, workspaceId);
  if (!l) return res.status(404).json({ error: "Label not found" });
  res.json(l);
};
export const remove = async (req: Request, res: Response) => {
  const {
    params: { id },
    workspaceId,
  } = validated(req, labelIdSchema);
  if (!(await deleteLabel(id, workspaceId)))
    return res.status(404).json({ error: "Label not found" });
  res.json({ success: true });
};
