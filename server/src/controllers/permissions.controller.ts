import type { Request, Response } from "express";
import { validated } from "../types.js";
import { updatePermissionsSchema } from "../schemas/permissions.schema.js";
import { ALL_PERMISSIONS, PERMISSION_LABELS } from "../constants.js";
import {
  getAllPermissionsForWorkspace,
  updateRolePermissions,
} from "../services/permission.service.js";

export const listAvailable = async (_req: Request, res: Response) => {
  res.json(ALL_PERMISSIONS.map((p) => ({ key: p, label: PERMISSION_LABELS[p] })));
};

export const listForWorkspace = async (req: Request, res: Response) => {
  const { workspaceId } = validated(req);
  const grouped = await getAllPermissionsForWorkspace(workspaceId);
  res.json(grouped);
};

export const updateForRole = async (req: Request, res: Response) => {
  const {
    params: { role },
    body: { permissions },
    workspaceId,
  } = validated(req, updatePermissionsSchema);
  const result = await updateRolePermissions(workspaceId, role, permissions);
  if (result.error === "cannot_modify_admin") {
    return res.status(400).json({ error: "Cannot modify admin permissions" });
  }
  res.json({ success: true });
};
