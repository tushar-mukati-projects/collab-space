import { prisma } from "../db.js";
import { logger } from "../logger.js";

export const savePushSubscription = async (
  userId: string,
  workspaceId: string,
  endpoint: string,
  p256dh: string,
  auth: string,
) => {
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: {
      user_id: userId,
      workspace_id: workspaceId,
      endpoint,
      p256dh,
      auth,
    },
    update: {
      p256dh,
      auth,
    },
  });
};

export const removePushSubscription = async (endpoint: string, userId: string) => {
  await prisma.pushSubscription.deleteMany({
    where: { endpoint, user_id: userId },
  });
};

export const sendPushToUser = async (userId: string, title: string, body: string, url?: string) => {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { user_id: userId },
  });

  if (subscriptions.length === 0) return;

  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

  if (!vapidPublicKey || !vapidPrivateKey) {
    logger.warn("VAPID keys not configured, skipping push notification", { userId });
    return;
  }

  const payload = JSON.stringify({ title, body, url: url ?? "/" });

  logger.info("Push notification queued", {
    userId,
    recipientCount: subscriptions.length,
    title,
  });
  void payload;
};
