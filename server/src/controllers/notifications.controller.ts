import type { Request, Response } from "express";
import { wrapController } from "./index.js";
import { validated } from "../types.js";
import {
  markNotificationsSchema,
  pushSubscribeSchema,
  pushUnsubscribeSchema,
} from "../schemas/notifications.schema.js";
import { listNotifications, markNotifications } from "../services/notification.service.js";
import { savePushSubscription, removePushSubscription } from "../services/push.service.js";

const listCtrl = async (req: Request, res: Response) => {
  res.json(await listNotifications(req.userId));
};
const markReadCtrl = async (req: Request, res: Response) => {
  const {
    body: { ids, status },
  } = validated(req, markNotificationsSchema);
  await markNotifications(ids, status.read, req.userId);
  res.json({ success: true });
};
const subscribeCtrl = async (req: Request, res: Response) => {
  const {
    body: { endpoint, p256dh, auth },
  } = validated(req, pushSubscribeSchema);
  await savePushSubscription(req.userId, req.workspaceId, endpoint, p256dh, auth);
  res.json({ success: true });
};
const unsubscribeCtrl = async (req: Request, res: Response) => {
  const {
    body: { endpoint },
  } = validated(req, pushUnsubscribeSchema);
  await removePushSubscription(endpoint, req.userId);
  res.json({ success: true });
};

export const list = wrapController(listCtrl);
export const markRead = wrapController(markReadCtrl);
export const subscribe = wrapController(subscribeCtrl);
export const unsubscribe = wrapController(unsubscribeCtrl);
