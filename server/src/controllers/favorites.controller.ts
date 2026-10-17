import type { Request, Response } from "express";
import { validated } from "../types.js";
import { toggleFavoriteSchema } from "../schemas/favorites.schema.js";
import { listFavorites, toggleFavorite } from "../services/favorite.service.js";

export const list = async (req: Request, res: Response) => {
  const { userId, workspaceId } = validated(req);
  res.json(await listFavorites(userId, workspaceId));
};
export const toggle = async (req: Request, res: Response) => {
  const {
    body: { ticket_id },
    userId,
    workspaceId,
  } = validated(req, toggleFavoriteSchema);
  const result = await toggleFavorite(userId, workspaceId, ticket_id);
  if ("error" in result) return res.status(404).json({ error: "Ticket not found" });
  res.json(result);
};
