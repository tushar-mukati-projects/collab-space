import type { Request, Response } from "express";
import { validated } from "../types.js";
import {
  markNotificationsSchema,
  pushSubscribeSchema,
  pushUnsubscribeSchema,
} from "../schemas/notifications.schema.js";
import { listNotifications, markNotifications } from "../services/notification.service.js";
import { savePushSubscription, removePushSubscription } from "../services/push.service.js";

export const list = async (req: Request, res: Response) => {
  const { userId, workspaceId } = validated(req);
  res.json(await listNotifications(userId, workspaceId));
};
export const markRead = async (req: Request, res: Response) => {
  const {
    body: { ids, status },
    userId,
    workspaceId,
  } = validated(req, markNotificationsSchema);
  await markNotifications(ids, status.read, userId, workspaceId);
  res.json({ success: true });
};
export const subscribe = async (req: Request, res: Response) => {
  const {
    body: { endpoint, p256dh, auth },
    userId,
    workspaceId,
  } = validated(req, pushSubscribeSchema);
  await savePushSubscription(userId, workspaceId, endpoint, p256dh, auth);
  res.json({ success: true });
};
export const unsubscribe = async (req: Request, res: Response) => {
  const {
    body: { endpoint },
    userId,
  } = validated(req, pushUnsubscribeSchema);
  await removePushSubscription(endpoint, userId);
  res.json({ success: true });
};
