import type { Request, Response } from "express";
import { wrapController } from "./index.js";
import { validated } from "../types.js";
import { createBoardSchema, getBoardSchema, moveTicketSchema } from "../schemas/boards.schema.js";
import {
  listBoards,
  createBoard,
  getBoard,
  moveTicket as moveTicketSvc,
} from "../services/board.service.js";

const listCtrl = async (req: Request, res: Response) => {
  res.json(await listBoards(req.workspaceId));
};

const createCtrl = async (req: Request, res: Response) => {
  const {
    body: { name },
  } = validated(req, createBoardSchema);
  res.status(201).json(await createBoard(name, req.workspaceId));
};

const getOneCtrl = async (req: Request, res: Response) => {
  const {
    params: { id },
  } = validated(req, getBoardSchema);
  const b = await getBoard(id, req.workspaceId);
  if (!b) return res.status(404).json({ error: "Board not found" });
  res.json(b);
};

const moveTicketCtrl = async (req: Request, res: Response) => {
  const {
    body: { ticket_id, to_status },
  } = validated(req, moveTicketSchema);
  const r = await moveTicketSvc(ticket_id, to_status, req.userId, req.workspaceId);
  if ("error" in r) return res.status(404).json({ error: r.error });
  res.json(r);
};

export const list = wrapController(listCtrl);
export const create = wrapController(createCtrl);
export const getOne = wrapController(getOneCtrl);
export const moveTicket = wrapController(moveTicketCtrl);
