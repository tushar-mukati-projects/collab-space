import type { Request, Response } from "express";
import { wrapController } from "./index.js";
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

const listCtrl = async (req: Request, res: Response) => {
  const { query: q } = validated(req, listTicketsSchema);
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
  res.json(await listTickets(req.workspaceId, filters));
};

const createCtrl = async (req: Request, res: Response) => {
  const { body } = validated(req, createTicketSchema);
  res.status(201).json(await createTicket(body, req.userId, req.workspaceId));
};

const getOneCtrl = async (req: Request, res: Response) => {
  const {
    params: { id },
  } = validated(req, ticketIdSchema);
  const t = await getTicket(id, req.workspaceId);
  if (!t) return res.status(404).json({ error: "Ticket not found" });
  res.json(t);
};

const updateCtrl = async (req: Request, res: Response) => {
  const {
    params: { id },
    body,
  } = validated(req, updateTicketSchema);
  const t = await updateTicket(id, body, req.userId, req.workspaceId);
  if (!t) return res.status(404).json({ error: "Ticket not found" });
  res.json(t);
};

const removeCtrl = async (req: Request, res: Response) => {
  const {
    params: { id },
  } = validated(req, ticketIdSchema);
  if (!(await deleteTicket(id, req.workspaceId)))
    return res.status(404).json({ error: "Ticket not found" });
  res.json({ success: true });
};

const listCommentsCtrl = async (req: Request, res: Response) => {
  const {
    params: { id },
  } = validated(req, ticketIdSchema);
  const c = await listCommentsSvc(id, req.workspaceId);
  if (!c) return res.status(404).json({ error: "Ticket not found" });
  res.json(c);
};

const createCommentCtrl = async (req: Request, res: Response) => {
  const {
    params: { id },
    body: { content, author_id },
  } = validated(req, createCommentSchema);
  const c = await createCommentSvc(id, content, author_id ?? req.userId, req.workspaceId);
  if (!c) return res.status(404).json({ error: "Ticket not found" });
  res.status(201).json(c);
};

const listActivitiesCtrl = async (req: Request, res: Response) => {
  const {
    params: { id },
  } = validated(req, ticketIdSchema);
  const a = await listActivitiesSvc(id, req.workspaceId);
  if (!a) return res.status(404).json({ error: "Ticket not found" });
  res.json(a);
};

export const list = wrapController(listCtrl);
export const create = wrapController(createCtrl);
export const getOne = wrapController(getOneCtrl);
export const update = wrapController(updateCtrl);
export const remove = wrapController(removeCtrl);
export const listComments = wrapController(listCommentsCtrl);
export const createComment = wrapController(createCommentCtrl);
export const listActivities = wrapController(listActivitiesCtrl);
