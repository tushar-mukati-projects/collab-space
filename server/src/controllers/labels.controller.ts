import type { Request, Response } from "express";
import { wrapController } from "./index.js";
import { validated } from "../types.js";
import { createLabelSchema, labelIdSchema } from "../schemas/labels.schema.js";
import { listLabels, createLabel, updateLabel, deleteLabel } from "../services/label.service.js";

const listCtrl = async (req: Request, res: Response) => {
  res.json(await listLabels(req.workspaceId));
};
const createCtrl = async (req: Request, res: Response) => {
  const {
    body: { name, color },
  } = validated(req, createLabelSchema);
  res.status(201).json(await createLabel(name, color, req.workspaceId));
};
const updateCtrl = async (req: Request, res: Response) => {
  const {
    params: { id },
  } = validated(req, labelIdSchema);
  const l = await updateLabel(id, req.body, req.workspaceId);
  if (!l) return res.status(404).json({ error: "Label not found" });
  res.json(l);
};
const removeCtrl = async (req: Request, res: Response) => {
  const {
    params: { id },
  } = validated(req, labelIdSchema);
  if (!(await deleteLabel(id, req.workspaceId)))
    return res.status(404).json({ error: "Label not found" });
  res.json({ success: true });
};

export const list = wrapController(listCtrl);
export const create = wrapController(createCtrl);
export const update = wrapController(updateCtrl);
export const remove = wrapController(removeCtrl);
