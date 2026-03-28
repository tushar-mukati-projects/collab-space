import { http, HttpResponse, delay } from "msw";
import { mockUsers } from "../data";
import { mockUrl } from "../config";
import type { User, NotificationPreferences, AppearancePreferences } from "@/types";

const _currentUser: User = structuredClone(mockUsers[0]);

const _notificationPrefs: NotificationPreferences = {
  ticket_assigned: true,
  mentioned: true,
  meeting_starting: true,
  status_changed: false,
  email_enabled: true,
  push_enabled: true,
};

const _appearancePrefs: AppearancePreferences = {
  theme: "system",
  accent_color: "indigo",
  font_size: "default",
};

export const settingsHandlers = [
  http.get(mockUrl("/settings/notifications"), async () => {
    await delay(200);
    return HttpResponse.json(_notificationPrefs);
  }),

  http.patch(mockUrl("/settings/notifications"), async ({ request }) => {
    await delay(300);
    const updates = (await request.json()) as Partial<NotificationPreferences>;
    Object.assign(_notificationPrefs, updates);
    return HttpResponse.json(_notificationPrefs);
  }),

  http.get(mockUrl("/settings/appearance"), async () => {
    await delay(200);
    return HttpResponse.json(_appearancePrefs);
  }),

  http.patch(mockUrl("/settings/appearance"), async ({ request }) => {
    await delay(300);
    const updates = (await request.json()) as Partial<AppearancePreferences>;
    Object.assign(_appearancePrefs, updates);
    return HttpResponse.json(_appearancePrefs);
  }),

  http.post(mockUrl("/settings/test-email"), async () => {
    await delay(500);
    return HttpResponse.json({ success: true, sent_to: _currentUser.email });
  }),
];
