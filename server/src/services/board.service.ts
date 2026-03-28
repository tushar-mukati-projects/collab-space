import { prisma } from "../db.js";
import { deleteTicket } from "./ticket.service.js";

interface BoardRow {
  id: string;
  name: string;
  workspace_id: string;
  created_at: Date;
  updated_at: Date;
}

const computeTicketCounts = async (boardId: string) => {
  const counts = await prisma.ticket.groupBy({
    by: ["status"],
    where: { parent_id: boardId, parent_type: "board" },
    _count: true,
  });

  const ticket_counts = {
    total: 0,
    backlog: 0,
    todo: 0,
    in_progress: 0,
    in_review: 0,
    done: 0,
  };

  for (const c of counts) {
    const key = c.status as keyof typeof ticket_counts;
    if (key in ticket_counts) {
      ticket_counts[key] = c._count;
    }
    ticket_counts.total += c._count;
  }

  return ticket_counts;
};

const serializeBoard = (
  board: BoardRow,
  ticket_counts: {
    total: number;
    backlog: number;
    todo: number;
    in_progress: number;
    in_review: number;
    done: number;
  },
) => {
  return {
    id: board.id,
    name: board.name,
    workspace_id: board.workspace_id,
    ticket_counts,
    created_at: board.created_at,
    updated_at: board.updated_at,
  };
};

export const listBoards = async (workspaceId: string) => {
  const boards = await prisma.board.findMany({
    where: { workspace_id: workspaceId },
    orderBy: { created_at: "desc" },
  });

  return Promise.all(
    boards.map(async (board: any) => {
      const ticket_counts = await computeTicketCounts(board.id);
      return serializeBoard(board, ticket_counts);
    }),
  );
};

export const getBoard = async (id: string, workspaceId: string) => {
  const board = await prisma.board.findFirst({
    where: { id, workspace_id: workspaceId },
  });

  if (!board) return null;

  const ticket_counts = await computeTicketCounts(board.id);
  return serializeBoard(board, ticket_counts);
};

export const createBoard = async (name: string, workspaceId: string) => {
  const board = await prisma.board.create({
    data: { name, workspace_id: workspaceId },
  });

  return serializeBoard(board, {
    total: 0,
    backlog: 0,
    todo: 0,
    in_progress: 0,
    in_review: 0,
    done: 0,
  });
};

export const deleteBoard = async (id: string, workspaceId: string) => {
  const board = await prisma.board.findFirst({ where: { id, workspace_id: workspaceId } });
  if (!board) return false;

  const boardTickets = await prisma.ticket.findMany({
    where: { parent_id: id, parent_type: "board" },
    select: { id: true },
  });
  for (const ticket of boardTickets) {
    await deleteTicket(ticket.id, workspaceId);
  }

  await prisma.board.delete({ where: { id } });
  return true;
};
