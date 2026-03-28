import type { Request, Response } from "express";
import { clerkClient } from "@clerk/express";
import { validated } from "../types.js";
import {
  createWorkspaceSchema,
  getInvitationsSchema,
  joinWorkspaceSchema,
  inviteToWorkspaceSchema,
  removeMemberSchema,
  changeRoleSchema,
  revokeInviteSchema,
} from "../schemas/workspace.schema.js";
import {
  createWorkspace,
  getInvitations as getInvitationsSvc,
  joinWorkspace,
  inviteToWorkspace,
  revokeInvite as revokeInviteSvc,
  removeMember as removeMemberSvc,
  changeMemberRole as changeRoleSvc,
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
  try {
    const [inviter, ws] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
      prisma.workspace.findUnique({ where: { id }, select: { name: true } }),
    ]);
    await sendInvitationEmail(email, ws?.name ?? "CollabSpace", inviter?.name ?? "A team member");
  } catch {
    // Email delivery is best-effort — don't block the invite response
  }
  res.json({ success: true });
};

export const revokeInvite = async (req: Request, res: Response) => {
  const {
    params: { id },
    body: { email },
  } = validated(req, revokeInviteSchema);
  const result = await revokeInviteSvc(id, email);
  if (result.error === "not_found") return res.status(404).json({ error: "Workspace not found" });
  res.json({ success: true });
};

export const removeMember = async (req: Request, res: Response) => {
  const {
    params: { id, memberId },
    userId,
  } = validated(req, removeMemberSchema);
  const result = await removeMemberSvc(id, memberId, userId);
  if (result.error === "not_found") return res.status(404).json({ error: "Member not found" });
  res.json({ success: true });
};

export const changeRole = async (req: Request, res: Response) => {
  const {
    params: { id, memberId },
    body: { role },
    userId,
  } = validated(req, changeRoleSchema);
  const result = await changeRoleSvc(id, memberId, role, userId);
  if (result.error === "not_found") return res.status(404).json({ error: "Member not found" });
  res.json({ success: true });
};
