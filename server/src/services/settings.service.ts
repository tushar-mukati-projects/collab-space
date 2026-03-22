import { prisma } from "../db.js";

export const getNotificationPrefs = async (userId: string, workspaceId: string) => {
  const prefs = await prisma.notificationPrefs.upsert({
    where: {
      user_id_workspace_id: { user_id: userId, workspace_id: workspaceId },
    },
    create: { user_id: userId, workspace_id: workspaceId },
    update: {},
  });

  return {
    ticket_assigned: prefs.ticket_assigned,
    mentioned: prefs.mentioned,
    meeting_starting: prefs.meeting_starting,
    status_changed: prefs.status_changed,
    email_enabled: prefs.email_enabled,
    push_enabled: prefs.push_enabled,
  };
};

export const updateNotificationPrefs = async (
  userId: string,
  workspaceId: string,
  data: {
    ticket_assigned?: boolean;
    mentioned?: boolean;
    meeting_starting?: boolean;
    status_changed?: boolean;
    email_enabled?: boolean;
    push_enabled?: boolean;
  },
) => {
  const updateData: Record<string, boolean> = {};
  if (typeof data.ticket_assigned === "boolean") updateData.ticket_assigned = data.ticket_assigned;
  if (typeof data.mentioned === "boolean") updateData.mentioned = data.mentioned;
  if (typeof data.meeting_starting === "boolean")
    updateData.meeting_starting = data.meeting_starting;
  if (typeof data.status_changed === "boolean") updateData.status_changed = data.status_changed;
  if (typeof data.email_enabled === "boolean") updateData.email_enabled = data.email_enabled;
  if (typeof data.push_enabled === "boolean") updateData.push_enabled = data.push_enabled;

  const prefs = await prisma.notificationPrefs.upsert({
    where: {
      user_id_workspace_id: { user_id: userId, workspace_id: workspaceId },
    },
    create: { user_id: userId, workspace_id: workspaceId, ...updateData },
    update: updateData,
  });

  return {
    ticket_assigned: prefs.ticket_assigned,
    mentioned: prefs.mentioned,
    meeting_starting: prefs.meeting_starting,
    status_changed: prefs.status_changed,
    email_enabled: prefs.email_enabled,
    push_enabled: prefs.push_enabled,
  };
};

export const getAppearancePrefs = async (userId: string, workspaceId: string) => {
  const prefs = await prisma.appearancePrefs.upsert({
    where: {
      user_id_workspace_id: { user_id: userId, workspace_id: workspaceId },
    },
    create: { user_id: userId, workspace_id: workspaceId },
    update: {},
  });

  return {
    theme: prefs.theme,
    accent_color: prefs.accent_color,
    font_size: prefs.font_size,
  };
};

export const updateAppearancePrefs = async (
  userId: string,
  workspaceId: string,
  data: { theme?: string; accent_color?: string; font_size?: string },
) => {
  const updateData: Record<string, string> = {};
  if (typeof data.theme === "string") updateData.theme = data.theme;
  if (typeof data.accent_color === "string") updateData.accent_color = data.accent_color;
  if (typeof data.font_size === "string") updateData.font_size = data.font_size;

  const prefs = await prisma.appearancePrefs.upsert({
    where: {
      user_id_workspace_id: { user_id: userId, workspace_id: workspaceId },
    },
    create: { user_id: userId, workspace_id: workspaceId, ...updateData },
    update: updateData,
  });

  return {
    theme: prefs.theme,
    accent_color: prefs.accent_color,
    font_size: prefs.font_size,
  };
};
