import { prisma } from "../db.js";

export const listWorkspaceUsers = async (workspaceId: string) => {
  const members = await prisma.workspaceMember.findMany({
    where: { workspace_id: workspaceId },
    include: { user: true },
    orderBy: { joined_at: "asc" },
  });

  return members.map((member: any) => ({
    id: member.user.id,
    name: member.user.name,
    email: member.user.email,
    avatar: member.user.avatar,
    role: member.role,
    status: member.status,
    created_at: member.user.created_at,
    updated_at: member.user.updated_at,
  }));
};

export const getWorkspaceUser = async (userId: string, workspaceId: string) => {
  const member = await prisma.workspaceMember.findFirst({
    where: { user_id: userId, workspace_id: workspaceId },
    include: { user: true },
  });

  if (!member) return null;

  return {
    id: member.user.id,
    name: member.user.name,
    email: member.user.email,
    avatar: member.user.avatar,
    role: member.role,
    status: member.status,
    created_at: member.user.created_at,
    updated_at: member.user.updated_at,
  };
};
