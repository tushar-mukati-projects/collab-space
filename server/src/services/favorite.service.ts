import { prisma } from "../db.js";
import { serializeStatus } from "../utils.js";

export const listFavorites = async (userId: string, workspaceId: string) => {
  const favorites = await prisma.favorite.findMany({
    where: { user_id: userId, workspace_id: workspaceId },
    include: { ticket: { select: { title: true, status: true } } },
    orderBy: { created_at: "desc" },
  });

  return favorites.map((f: any) => ({
    id: f.id,
    ticket_id: f.ticket_id,
    title: f.ticket.title,
    status: serializeStatus(f.ticket.status),
    created_at: f.created_at.toISOString(),
  }));
};

export const toggleFavorite = async (userId: string, workspaceId: string, ticketId: string) => {
  const existing = await prisma.favorite.findUnique({
    where: {
      user_id_workspace_id_ticket_id: {
        user_id: userId,
        workspace_id: workspaceId,
        ticket_id: ticketId,
      },
    },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return { action: "removed" as const, id: existing.id };
  }

  const favorite = await prisma.favorite.create({
    data: { user_id: userId, workspace_id: workspaceId, ticket_id: ticketId },
  });

  return { action: "added" as const, id: favorite.id };
};
