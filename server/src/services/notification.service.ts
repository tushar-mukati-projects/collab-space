import { prisma } from "../db.js";

export const listNotifications = async (userId: string) => {
  const notifications = await prisma.notification.findMany({
    where: { user_id: userId },
    orderBy: { created_at: "desc" },
  });

  return notifications.map((n: any) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    read: n.read,
    created_at: n.created_at,
    link: n.link,
    actor_id: n.actor_id,
  }));
};

export const markNotifications = async (ids: string[], read: boolean, userId: string) => {
  await prisma.notification.updateMany({
    where: {
      id: { in: ids },
      user_id: userId,
    },
    data: { read },
  });
};
