import { prisma } from "../db.js";
import { WORKSPACE_ROLES } from "../constants.js";

type ClerkUser = { id: string; email: string; name: string; avatar: string };

const upsertUser = (user: ClerkUser) => {
  return prisma.user.upsert({
    where: { id: user.id },
    create: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
    },
    update: {
      name: user.name,
      avatar: user.avatar,
    },
  });
};

export const getUserWorkspaceWithMembers = async (userId: string) => {
  const membership = await prisma.workspaceMember.findFirst({
    where: { user_id: userId },
    orderBy: { joined_at: "asc" },
    include: {
      workspace: {
        include: {
          members: {
            include: { user: true },
          },
        },
      },
    },
  });

  if (!membership) return null;

  const workspace = membership.workspace;

  return {
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    logo: workspace.logo,
    plan: workspace.plan,
    invited_emails: workspace.invited_emails,
    members: workspace.members.map((m: any) => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      avatar: m.user.avatar,
      role: m.role,
      status: m.status,
      created_at: m.user.created_at,
      updated_at: m.user.updated_at,
    })),
  };
};

export const createWorkspace = async (
  name: string,
  userId: string,
  clerkUser: ClerkUser | null,
) => {
  const slug = name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  const words = name.trim().split(/\s+/);
  const initials =
    words.length >= 2
      ? `${words[0][0]}${words[1][0]}`.toUpperCase()
      : name.slice(0, 2).toUpperCase();
  const logo = `https://ui-avatars.com/api/?name=${initials}&background=6366f1&color=fff&bold=true`;

  if (clerkUser) {
    await upsertUser(clerkUser);
  }

  const workspace = await prisma.workspace.create({
    data: {
      name,
      slug,
      logo,
      plan: "pro",
      members: {
        create: {
          user_id: userId,
          role: WORKSPACE_ROLES.ADMIN,
        },
      },
      status_definitions: {
        createMany: {
          data: [
            { value: "backlog", name: "Backlog", color: "#6b7280", order: 0 },
            { value: "todo", name: "Todo", color: "#f59e0b", order: 1 },
            {
              value: "in_progress",
              name: "In Progress",
              color: "#3b82f6",
              order: 2,
            },
            {
              value: "in_review",
              name: "In Review",
              color: "#8b5cf6",
              order: 3,
            },
            { value: "done", name: "Done", color: "#22c55e", order: 4 },
          ],
        },
      },
    },
    include: {
      members: true,
      status_definitions: true,
    },
  });

  return workspace;
};

export const getInvitations = async (email: string) => {
  const workspaces = await prisma.workspace.findMany({
    where: {
      invited_emails: { has: email },
    },
    include: {
      _count: {
        select: { members: true },
      },
    },
  });

  return workspaces.map((w: any) => ({
    id: w.id,
    name: w.name,
    slug: w.slug,
    logo: w.logo,
    plan: w.plan,
    member_count: w._count.members,
  }));
};

export const joinWorkspace = async (
  workspaceId: string,
  email: string,
  userId: string,
  clerkUser: ClerkUser | null,
) => {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });

  if (!workspace) return { error: "not_found" as const, workspace: null };

  if (!workspace.invited_emails.includes(email)) {
    return { error: "forbidden" as const, workspace: null };
  }

  if (clerkUser) {
    await upsertUser(clerkUser);
  }

  const updatedWorkspace = await prisma.$transaction(async (tx: any) => {
    const updated = await tx.workspace.update({
      where: { id: workspaceId },
      data: {
        invited_emails: {
          set: workspace.invited_emails.filter((e: any) => e !== email),
        },
      },
    });

    await tx.workspaceMember.create({
      data: {
        user_id: userId,
        workspace_id: workspaceId,
        role: WORKSPACE_ROLES.MEMBER,
      },
    });

    return updated;
  });

  return { error: null, workspace: updatedWorkspace };
};

export const inviteToWorkspace = async (workspaceId: string, email: string, inviterId: string) => {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });

  if (!workspace) return { error: "not_found" as const };

  const callerMembership = await prisma.workspaceMember.findUnique({
    where: {
      user_id_workspace_id: {
        user_id: inviterId,
        workspace_id: workspaceId,
      },
    },
  });

  if (!callerMembership || callerMembership.role !== WORKSPACE_ROLES.ADMIN) {
    return { error: "forbidden" as const };
  }

  if (!workspace.invited_emails.includes(email)) {
    await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        invited_emails: { push: email },
      },
    });
  }

  return { error: null };
};

export const revokeInvite = async (workspaceId: string, email: string, callerId: string) => {
  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!workspace) return { error: "not_found" as const };

  const caller = await prisma.workspaceMember.findUnique({
    where: { user_id_workspace_id: { user_id: callerId, workspace_id: workspaceId } },
  });
  if (!caller || caller.role !== WORKSPACE_ROLES.ADMIN) return { error: "forbidden" as const };

  await prisma.workspace.update({
    where: { id: workspaceId },
    data: { invited_emails: { set: workspace.invited_emails.filter((e: any) => e !== email) } },
  });
  return { error: null };
};

export const removeMember = async (workspaceId: string, memberId: string, callerId: string) => {
  const caller = await prisma.workspaceMember.findUnique({
    where: { user_id_workspace_id: { user_id: callerId, workspace_id: workspaceId } },
  });
  if (!caller || caller.role !== WORKSPACE_ROLES.ADMIN) return { error: "forbidden" as const };

  const target = await prisma.workspaceMember.findUnique({
    where: { user_id_workspace_id: { user_id: memberId, workspace_id: workspaceId } },
  });
  if (!target) return { error: "not_found" as const };

  await prisma.workspaceMember.delete({
    where: { user_id_workspace_id: { user_id: memberId, workspace_id: workspaceId } },
  });
  return { error: null };
};

export const changeMemberRole = async (
  workspaceId: string,
  memberId: string,
  role: string,
  callerId: string,
) => {
  const caller = await prisma.workspaceMember.findUnique({
    where: { user_id_workspace_id: { user_id: callerId, workspace_id: workspaceId } },
  });
  if (!caller || caller.role !== WORKSPACE_ROLES.ADMIN) return { error: "forbidden" as const };

  const target = await prisma.workspaceMember.findUnique({
    where: { user_id_workspace_id: { user_id: memberId, workspace_id: workspaceId } },
  });
  if (!target) return { error: "not_found" as const };

  await prisma.workspaceMember.update({
    where: { user_id_workspace_id: { user_id: memberId, workspace_id: workspaceId } },
    data: { role: role as any },
  });
  return { error: null };
};
