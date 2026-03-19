import type { Request, Response } from "express";
import { validated } from "../types.js";
import { createBoardSchema, getBoardSchema, moveTicketSchema } from "../schemas/boards.schema.js";
import {
  listBoards,
  createBoard,
  getBoard,
  moveTicket as moveTicketSvc,
} from "../services/board.service.js";

export const list = async (req: Request, res: Response) => {
  const { workspaceId } = validated(req);
  res.json(await listBoards(workspaceId));
};

export const create = async (req: Request, res: Response) => {
  const {
    body: { name },
    workspaceId,
  } = validated(req, createBoardSchema);
  res.status(201).json(await createBoard(name, workspaceId));
};

export const getOne = async (req: Request, res: Response) => {
  const {
    params: { id },
    workspaceId,
  } = validated(req, getBoardSchema);
  const b = await getBoard(id, workspaceId);
  if (!b) return res.status(404).json({ error: "Board not found" });
  res.json(b);
};

export const moveTicket = async (req: Request, res: Response) => {
  const {
    body: { ticket_id, to_status },
    userId,
    workspaceId,
  } = validated(req, moveTicketSchema);
  const r = await moveTicketSvc(ticket_id, to_status, userId, workspaceId);
  if ("error" in r) return res.status(404).json({ error: r.error });
  res.json(r);
};
