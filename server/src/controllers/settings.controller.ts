import type { Request, Response } from "express";
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

export const getProfileHandler = async (req: Request, res: Response) => {
  const { userId, workspaceId } = validated(req);
  const role = await getMemberRole(userId, workspaceId);
  const p = await getProfile(userId, { role });
  if (!p) return res.status(404).json({ error: "User not found" });
  res.json(p);
};
export const updateProfileHandler = async (req: Request, res: Response) => {
  const { body, userId, workspaceId } = validated(req, updateProfileSchema);
  const u = await updateProfile(userId, body);
  const role = await getMemberRole(userId, workspaceId);
  res.json({ id: u.id, name: u.name, email: u.email, avatar: u.avatar, role });
};
export const getWorkspaceSettingsHandler = async (req: Request, res: Response) => {
  const { workspaceId } = validated(req);
  const ws = await getWorkspaceSettings(workspaceId);
  if (!ws) return res.status(400).json({ error: "Workspace not found" });
  res.json(ws);
};
export const updateWorkspaceSettingsHandler = async (req: Request, res: Response) => {
  const { body, userId, workspaceId } = validated(req, updateWorkspaceSettingsSchema);
  const role = await getMemberRole(userId, workspaceId);
  const r = await updateWorkspaceSettings(workspaceId, body, role);
  if ("error" in r && r.error === "forbidden") return res.status(403).json({ error: "Forbidden" });
  res.json(r);
};
export const getNotificationPrefsHandler = async (req: Request, res: Response) => {
  const { userId, workspaceId } = validated(req);
  res.json(await getNotificationPrefs(userId, workspaceId));
};
export const updateNotificationPrefsHandler = async (req: Request, res: Response) => {
  const { userId, workspaceId } = validated(req);
  res.json(await updateNotificationPrefs(userId, workspaceId, req.body));
};
export const getAppearancePrefsHandler = async (req: Request, res: Response) => {
  const { userId, workspaceId } = validated(req);
  res.json(await getAppearancePrefs(userId, workspaceId));
};
export const updateAppearancePrefsHandler = async (req: Request, res: Response) => {
  const { userId, workspaceId } = validated(req);
  res.json(await updateAppearancePrefs(userId, workspaceId, req.body));
};

export const testEmailHandler = async (req: Request, res: Response) => {
  const { userId } = validated(req);
  const { sendNotificationEmail } = await import("../services/email.service.js");
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (!user) return res.status(404).json({ error: "User not found" });
  const result = await sendNotificationEmail(
    user.email,
    "Test Email from CollabSpace",
    "If you're reading this, email delivery is working correctly.",
    "/settings",
  );
  res.json({ success: result.success, sent_to: user.email });
};
