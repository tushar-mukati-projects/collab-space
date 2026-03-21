import type { Request, Response } from "express";
import { clerkClient } from "@clerk/express";
import { validated } from "../types.js";
import { userIdSchema } from "../schemas/users.schema.js";
import { listWorkspaceUsers, getWorkspaceUser } from "../services/user.service.js";
import { prisma } from "../db.js";

export const me = async (req: Request, res: Response) => {
  const { userId } = validated(req);
  const cu = await clerkClient.users.getUser(userId);
  const user = await prisma.user.upsert({
    where: { id: userId },
    create: {
      id: userId,
      email: cu.emailAddresses[0]?.emailAddress ?? "",
      name: `${cu.firstName ?? ""} ${cu.lastName ?? ""}`.trim() || "User",
      avatar: cu.imageUrl ?? "",
    },
    update: {
      name: `${cu.firstName ?? ""} ${cu.lastName ?? ""}`.trim() || "User",
      avatar: cu.imageUrl ?? "",
    },
  });
  const membership = await prisma.workspaceMember.findFirst({
    where: { user_id: userId },
    select: { workspace_id: true, role: true },
    orderBy: { joined_at: "asc" },
  });

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    workspace_id: membership?.workspace_id ?? null,
    role: membership?.role ?? null,
  });
};

export const list = async (req: Request, res: Response) => {
  const { workspaceId } = validated(req);
  res.json(await listWorkspaceUsers(workspaceId));
};
export const getOne = async (req: Request, res: Response) => {
  const {
    params: { id },
    workspaceId,
  } = validated(req, userIdSchema);
  const u = await getWorkspaceUser(id, workspaceId);
  if (!u) return res.status(404).json({ error: "User not found" });
  res.json(u);
};
