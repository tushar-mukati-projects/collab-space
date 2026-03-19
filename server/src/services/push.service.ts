import { prisma } from "../db.js";

export const savePushSubscription = async (
  userId: string,
  workspaceId: string,
  endpoint: string,
  p256dh: string,
  auth: string,
) => {
  // Upsert by endpoint to avoid duplicates
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
    console.log("[Push] No VAPID keys configured — skipping push notification");
    console.log(`  Would send to ${subscriptions.length} subscription(s):`);
    console.log(`  Title: ${title}`);
    console.log(`  Body: ${body}`);
    return;
  }

  // For production, use web-push library. For now, use the Fetch-based approach.
  const payload = JSON.stringify({ title, body, url: url ?? "/" });

  for (const sub of subscriptions) {
    try {
      // In production, this would use the web-push library with VAPID signing.
      // For now, we log the attempt. The client-side Notification API handles
      // browser notifications directly without a push server.
      console.log(`[Push] Sending to endpoint: ${sub.endpoint.slice(0, 50)}...`);
      console.log(`  Payload: ${payload}`);
    } catch (err) {
      console.error("[Push] Failed to send:", err);
    }
  }
};
