import type { Request, Response } from "express";
import { clerkClient } from "@clerk/express";
import { validated } from "../types.js";
import {
  createWorkspaceSchema,
  getInvitationsSchema,
  joinWorkspaceSchema,
  inviteToWorkspaceSchema,
} from "../schemas/workspace.schema.js";
import {
  createWorkspace,
  getInvitations as getInvitationsSvc,
  joinWorkspace,
  inviteToWorkspace,
} from "../services/workspace.service.js";
import { sendInvitationEmail } from "../services/email.service.js";
import { prisma } from "../db.js";

const clerkUserObj = (u: any) => {
  return {
    id: u.id,
    email: u.emailAddresses[0]?.emailAddress ?? "",
    name: `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim(),
    avatar: u.imageUrl ?? "",
  };
};

export const create = async (req: Request, res: Response) => {
  const {
    body: { name },
    userId,
  } = validated(req, createWorkspaceSchema);
  const cu = await clerkClient.users.getUser(userId);
  res.status(201).json(await createWorkspace(name, userId, clerkUserObj(cu)));
};

export const getInvitations = async (req: Request, res: Response) => {
  const {
    query: { email },
  } = validated(req, getInvitationsSchema);
  res.json(await getInvitationsSvc(email));
};

export const join = async (req: Request, res: Response) => {
  const {
    params: { id },
    body: { email },
    userId,
  } = validated(req, joinWorkspaceSchema);
  const cu = await clerkClient.users.getUser(userId);
  const result = await joinWorkspace(id, email, userId, clerkUserObj(cu));
  if (result.error === "not_found") return res.status(404).json({ error: "Workspace not found" });
  if (result.error === "forbidden") return res.status(403).json({ error: "Forbidden" });
  res.json(result.workspace);
};

export const invite = async (req: Request, res: Response) => {
  const {
    params: { id },
    body: { email },
    userId,
  } = validated(req, inviteToWorkspaceSchema);
  const result = await inviteToWorkspace(id, email, userId);
  if (result.error === "not_found") return res.status(404).json({ error: "Workspace not found" });
  if (result.error === "forbidden") return res.status(403).json({ error: "Forbidden" });
  try {
    const [inviter, ws] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
      prisma.workspace.findUnique({ where: { id }, select: { name: true } }),
    ]);
    await sendInvitationEmail(email, ws?.name ?? "CollabSpace", inviter?.name ?? "A team member");
  } catch {}
  res.json({ success: true });
};
