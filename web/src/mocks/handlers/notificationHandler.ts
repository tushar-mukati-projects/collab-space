import { http, HttpResponse, delay } from "msw";
import { mockNotifications } from "../data";
import type { Notification } from "@/types";

const _notifications: Notification[] = structuredClone(mockNotifications);

export const notificationHandlers = [
  // GET /api/notifications
  http.get("/api/notifications", async () => {
    await delay(300);
    return HttpResponse.json(_notifications);
  }),

  // PATCH /api/notifications — update notification status by IDs
  // Body: { ids: string[], status: { read: boolean } }
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
];
