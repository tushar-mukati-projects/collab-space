import { z } from "zod";
export const markNotificationsSchema = z.object({
  body: z.object({
    ids: z.array(z.string()).min(1, "ids must be non-empty"),
    status: z.object({ read: z.boolean() }),
  }),
});
export const pushSubscribeSchema = z.object({
  body: z.object({
    endpoint: z.string().min(1),
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});
export const pushUnsubscribeSchema = z.object({ body: z.object({ endpoint: z.string().min(1) }) });
