import { http, HttpResponse, delay } from "msw";
import { mockUsers, mockWorkspace } from "../data";
import type { User, Workspace } from "@/types";

const _currentUser: User = structuredClone(mockUsers[0]);
const _workspace: Workspace = structuredClone(mockWorkspace);

interface NotificationPreferences {
  ticket_assigned: boolean;
  mentioned: boolean;
  meeting_starting: boolean;
  status_changed: boolean;
  email_enabled: boolean;
  push_enabled: boolean;
}

interface AppearancePreferences {
  theme: "light" | "dark" | "system";
  accent_color: string;
  font_size: "compact" | "default" | "comfortable";
}

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
  http.get("/api/settings/profile", async () => {
    await delay(200);
    return HttpResponse.json(_currentUser);
  }),

  http.patch("/api/settings/profile", async ({ request }) => {
    await delay(300);
    const updates = (await request.json()) as Partial<User>;
    if (updates.name) _currentUser.name = updates.name;
    if (updates.email) _currentUser.email = updates.email;
    return HttpResponse.json(_currentUser);
  }),

  http.get("/api/settings/workspace", async () => {
    await delay(200);
    return HttpResponse.json(_workspace);
  }),

  http.patch("/api/settings/workspace", async ({ request }) => {
    await delay(300);
    const updates = (await request.json()) as Partial<Workspace>;
    if (updates.name) _workspace.name = updates.name;
    return HttpResponse.json(_workspace);
  }),

  http.get("/api/settings/notifications", async () => {
    await delay(200);
    return HttpResponse.json(_notificationPrefs);
  }),

  http.patch("/api/settings/notifications", async ({ request }) => {
    await delay(300);
    const updates = (await request.json()) as Partial<NotificationPreferences>;
    Object.assign(_notificationPrefs, updates);
    return HttpResponse.json(_notificationPrefs);
  }),

  http.get("/api/settings/appearance", async () => {
    await delay(200);
    return HttpResponse.json(_appearancePrefs);
  }),

  http.patch("/api/settings/appearance", async ({ request }) => {
    await delay(300);
    const updates = (await request.json()) as Partial<AppearancePreferences>;
    Object.assign(_appearancePrefs, updates);
    return HttpResponse.json(_appearancePrefs);
  }),

  http.post("/api/settings/test-email", async () => {
    await delay(500);
    return HttpResponse.json({ success: true, sent_to: _currentUser.email });
  }),
];
