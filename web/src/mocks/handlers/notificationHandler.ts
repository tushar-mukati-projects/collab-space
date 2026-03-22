import { http, HttpResponse, delay } from "msw";
import { mockNotifications } from "../data";
import type { Notification } from "@/types";

const _notifications: Notification[] = structuredClone(mockNotifications);

export const notificationHandlers = [
  http.get("/api/notifications", async () => {
    await delay(300);
    return HttpResponse.json(_notifications);
  }),

  http.patch("/api/notifications", async ({ request }) => {
    await delay(200);
    const body = (await request.json()) as { ids: string[]; status: { read: boolean } };
    for (const notif of _notifications) {
      if (body.ids.includes(notif.id)) {
        notif.read = body.status.read;
      }
    }
    const updated = _notifications.filter((n) => body.ids.includes(n.id));
    return HttpResponse.json(updated);
  }),

  http.post("/api/notifications/subscribe", async () => {
    await delay(200);
    return HttpResponse.json({ success: true });
  }),

  http.delete("/api/notifications/subscribe", async () => {
    await delay(200);
    return HttpResponse.json({ success: true });
  }),
];
