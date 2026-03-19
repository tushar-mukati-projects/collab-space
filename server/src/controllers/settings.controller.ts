import type { Request, Response } from "express";
import { wrapController } from "./index.js";
import { validated } from "../types.js";
import { updateProfileSchema, updateWorkspaceSettingsSchema } from "../schemas/settings.schema.js";
import { prisma } from "../db.js";
import {
  getProfile,
  updateProfile,
  getWorkspaceSettings,
  updateWorkspaceSettings,
  getNotificationPrefs,
  updateNotificationPrefs,
  getAppearancePrefs,
  updateAppearancePrefs,
} from "../services/settings.service.js";

const getMemberRole = async (userId: string, workspaceId: string) => {
  const m = await prisma.workspaceMember.findFirst({
    where: { user_id: userId, workspace_id: workspaceId },
    select: { role: true },
  });
  return m?.role ?? "member";
};

const getProfileCtrl = async (req: Request, res: Response) => {
  const role = await getMemberRole(req.userId, req.workspaceId);
  const p = await getProfile(req.userId, { role });
  if (!p) return res.status(404).json({ error: "User not found" });
  res.json(p);
};
const updateProfileCtrl = async (req: Request, res: Response) => {
  const { body } = validated(req, updateProfileSchema);
  const u = await updateProfile(req.userId, body);
  const role = await getMemberRole(req.userId, req.workspaceId);
  res.json({ id: u.id, name: u.name, email: u.email, avatar: u.avatar, role });
};
const getWsCtrl = async (req: Request, res: Response) => {
  const ws = await getWorkspaceSettings(req.workspaceId);
  if (!ws) return res.status(400).json({ error: "Workspace not found" });
  res.json(ws);
};
const updateWsCtrl = async (req: Request, res: Response) => {
  const { body } = validated(req, updateWorkspaceSettingsSchema);
  const role = await getMemberRole(req.userId, req.workspaceId);
  const r = await updateWorkspaceSettings(req.workspaceId, body, role);
  if ("error" in r && r.error === "forbidden") return res.status(403).json({ error: "Forbidden" });
  res.json(r);
};
const getNotifCtrl = async (req: Request, res: Response) => {
  res.json(await getNotificationPrefs(req.userId, req.workspaceId));
};
const updateNotifCtrl = async (req: Request, res: Response) => {
  res.json(await updateNotificationPrefs(req.userId, req.workspaceId, req.body));
};
const getAppearCtrl = async (req: Request, res: Response) => {
  res.json(await getAppearancePrefs(req.userId, req.workspaceId));
};
const updateAppearCtrl = async (req: Request, res: Response) => {
  res.json(await updateAppearancePrefs(req.userId, req.workspaceId, req.body));
};

export const getProfileHandler = wrapController(getProfileCtrl);
export const updateProfileHandler = wrapController(updateProfileCtrl);
export const getWorkspaceSettingsHandler = wrapController(getWsCtrl);
export const updateWorkspaceSettingsHandler = wrapController(updateWsCtrl);
export const getNotificationPrefsHandler = wrapController(getNotifCtrl);
export const updateNotificationPrefsHandler = wrapController(updateNotifCtrl);
export const getAppearancePrefsHandler = wrapController(getAppearCtrl);
export const updateAppearancePrefsHandler = wrapController(updateAppearCtrl);
