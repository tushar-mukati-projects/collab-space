import type { Request, Response } from "express";
import { validated } from "../types.js";
import { createBoardSchema, getBoardSchema } from "../schemas/boards.schema.js";
import { listBoards, createBoard, getBoard, deleteBoard } from "../services/board.service.js";

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

export const remove = async (req: Request, res: Response) => {
  const {
    params: { id },
    workspaceId,
  } = validated(req, getBoardSchema);
  if (!(await deleteBoard(id, workspaceId)))
    return res.status(404).json({ error: "Board not found" });
  res.json({ success: true });
};
