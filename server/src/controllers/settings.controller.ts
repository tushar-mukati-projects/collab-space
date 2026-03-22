import type { Request, Response } from "express";
import { validated } from "../types.js";
import { prisma } from "../db.js";
import {
  getNotificationPrefs,
  updateNotificationPrefs,
  getAppearancePrefs,
  updateAppearancePrefs,
} from "../services/settings.service.js";

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
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  if (!user) return res.status(404).json({ error: "User not found" });
  const result = await sendNotificationEmail(
    user.email,
    "Test Email from CollabSpace",
    "If you're reading this, email delivery is working correctly.",
    "/settings",
  );
  res.json({ success: result.success, sent_to: user.email });
};
