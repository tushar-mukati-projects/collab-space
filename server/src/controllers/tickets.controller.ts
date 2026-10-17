import type { Request, Response } from "express";
import { validated } from "../types.js";
import {
  listTicketsSchema,
  createTicketSchema,
  ticketIdSchema,
  updateTicketSchema,
  createCommentSchema,
} from "../schemas/tickets.schema.js";
import {
  listTickets,
  createTicket,
  getTicket,
  updateTicket,
  deleteTicket,
  listComments as listCommentsSvc,
  createComment as createCommentSvc,
  listActivities as listActivitiesSvc,
} from "../services/ticket.service.js";

const ensureArray = (val: unknown): string[] => {
  if (!val) return [];
  return Array.isArray(val) ? val : [String(val)];
};

export const list = async (req: Request, res: Response) => {
  const { query: q, workspaceId } = validated(req, listTicketsSchema);
  const filters = {
    assignees: ensureArray(q.assignees),
    created_by: ensureArray(q.created_by),
    statuses: ensureArray(q.statuses),
    priorities: ensureArray(q.priorities),
    labels: ensureArray(q.labels),
    parent_type: ensureArray(q.parent_type),
    search_term: q.search_term,
    parent_id: q.parent_id,
  };
  res.json(await listTickets(workspaceId, filters));
};

export const create = async (req: Request, res: Response) => {
  const { body, userId, workspaceId } = validated(req, createTicketSchema);
  res.status(201).json(await createTicket(body, userId, workspaceId));
};

export const getOne = async (req: Request, res: Response) => {
  const {
    params: { id },
    workspaceId,
  } = validated(req, ticketIdSchema);
  const t = await getTicket(id, workspaceId);
  if (!t) return res.status(404).json({ error: "Ticket not found" });
  res.json(t);
};

export const update = async (req: Request, res: Response) => {
  const {
    params: { id },
    body,
    userId,
    workspaceId,
  } = validated(req, updateTicketSchema);
  const t = await updateTicket(id, body, userId, workspaceId);
  if (!t) return res.status(404).json({ error: "Ticket not found" });
  res.json(t);
};

export const remove = async (req: Request, res: Response) => {
  const {
    params: { id },
    workspaceId,
  } = validated(req, ticketIdSchema);
  if (!(await deleteTicket(id, workspaceId)))
    return res.status(404).json({ error: "Ticket not found" });
  res.json({ success: true });
};

export const listComments = async (req: Request, res: Response) => {
  const {
    params: { id },
    workspaceId,
  } = validated(req, ticketIdSchema);
  const c = await listCommentsSvc(id, workspaceId);
  if (!c) return res.status(404).json({ error: "Ticket not found" });
  res.json(c);
};

export const createComment = async (req: Request, res: Response) => {
  const {
    params: { id },
    body: { content },
    userId,
    workspaceId,
  } = validated(req, createCommentSchema);
  const c = await createCommentSvc(id, content, userId, workspaceId);
  if (!c) return res.status(404).json({ error: "Ticket not found" });
  res.status(201).json(c);
};

export const listActivities = async (req: Request, res: Response) => {
  const {
    params: { id },
    workspaceId,
  } = validated(req, ticketIdSchema);
  const a = await listActivitiesSvc(id, workspaceId);
  if (!a) return res.status(404).json({ error: "Ticket not found" });
  res.json(a);
};
