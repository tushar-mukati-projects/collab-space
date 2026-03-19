import { prisma } from "../db.js";

// ─── Profile ────────────────────────────────────────────────────────────────

export const getProfile = async (userId: string, membership: { role: string }) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    role: membership.role,
  };
};

export const updateProfile = async (userId: string, data: { name?: string; email?: string }) => {
  const updateData: Record<string, string> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.email !== undefined) updateData.email = data.email;

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  return user;
};

// ─── Workspace ──────────────────────────────────────────────────────────────

const toWorkspaceDTO = (workspace: {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  plan: string;
  invited_emails: string[];
  members: {
    role: string;
    user: { id: string; name: string | null; email: string; avatar: string | null };
  }[];
}) => {
  return {
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    logo: workspace.logo,
    plan: workspace.plan,
    invited_emails: workspace.invited_emails,
    members: workspace.members.map((m) => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      avatar: m.user.avatar,
      role: m.role,
    })),
  };
};

export const getWorkspaceSettings = async (workspaceId: string) => {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true },
          },
        },
      },
    },
  });

  if (!workspace) return null;
  return toWorkspaceDTO(workspace);
};

export const updateWorkspaceSettings = async (
  workspaceId: string,
  data: { name?: string },
  role: string,
) => {
  if (role !== "owner" && role !== "admin") {
    return { error: "forbidden" as const };
  }

  const updateData: Record<string, string> = {};
  if (data.name !== undefined) {
    updateData.name = data.name;
    updateData.slug = data.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  }

  const workspace = await prisma.workspace.update({
    where: { id: workspaceId },
    data: updateData,
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true },
          },
        },
      },
    },
  });

  return toWorkspaceDTO(workspace);
};

// ─── Notification Preferences ───────────────────────────────────────────────

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

// ─── Appearance Preferences ─────────────────────────────────────────────────

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
