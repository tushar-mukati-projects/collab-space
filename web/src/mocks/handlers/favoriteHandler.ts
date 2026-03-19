import { http, HttpResponse, delay } from "msw";
import { mockFavorites } from "../data/favorites";
import type { Favorite } from "@/types";

const _favorites: Favorite[] = structuredClone(mockFavorites);

const generateId = (prefix: string): string => {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
};

export const favoriteHandlers = [
  http.get("/api/favorites", async () => {
    await delay(200);
    return HttpResponse.json(_favorites);
  }),

  http.post("/api/favorites", async ({ request }) => {
    await delay(200);
    const { ticket_id } = (await request.json()) as { ticket_id: string };

    const existingIdx = _favorites.findIndex((f) => f.ticket_id === ticket_id);

    if (existingIdx >= 0) {
      const removed = _favorites.splice(existingIdx, 1)[0];
      return HttpResponse.json({ action: "removed", id: removed.id });
    }

    const favorite: Favorite = {
      id: generateId("fav"),
      ticket_id,
      title: "Ticket",
      status: "todo",
      created_at: new Date().toISOString(),
    };
    _favorites.push(favorite);
    return HttpResponse.json({ action: "added", id: favorite.id });
  }),
];
