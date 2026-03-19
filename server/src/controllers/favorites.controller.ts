import type { Request, Response } from "express";
import { wrapController } from "./index.js";
import { validated } from "../types.js";
import { toggleFavoriteSchema } from "../schemas/favorites.schema.js";
import { listFavorites, toggleFavorite } from "../services/favorite.service.js";

const listCtrl = async (req: Request, res: Response) => {
  res.json(await listFavorites(req.userId, req.workspaceId));
};
const toggleCtrl = async (req: Request, res: Response) => {
  const {
    body: { ticket_id },
  } = validated(req, toggleFavoriteSchema);
  res.json(await toggleFavorite(req.userId, req.workspaceId, ticket_id));
};

export const list = wrapController(listCtrl);
export const toggle = wrapController(toggleCtrl);
