import { prisma } from "../db.js";
import { collectTicketSubtree } from "./ticket.service.js";

type TicketCounts = {
  total: number;
  backlog: number;
  todo: number;
  in_progress: number;
  in_review: number;
  done: number;
};

const emptyCounts = (): TicketCounts => ({
  total: 0,
  backlog: 0,
  todo: 0,
  in_progress: 0,
  in_review: 0,
  done: 0,
});

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

  const ticket_counts = emptyCounts();
  for (const c of counts) {
    const key = c.status as keyof TicketCounts;
    if (key in ticket_counts) {
      ticket_counts[key] = c._count;
    }
    ticket_counts.total += c._count;
  }

  return ticket_counts;
};

const computeTicketCountsForBoards = async (boardIds: string[]) => {
  const byBoard = new Map<string, TicketCounts>();
  boardIds.forEach((id) => byBoard.set(id, emptyCounts()));
  if (boardIds.length === 0) return byBoard;

  const counts = await prisma.ticket.groupBy({
    by: ["parent_id", "status"],
    where: { parent_id: { in: boardIds }, parent_type: "board" },
    _count: true,
  });

  for (const c of counts) {
    if (!c.parent_id) continue;
    const bucket = byBoard.get(c.parent_id);
    if (!bucket) continue;
    const key = c.status as keyof TicketCounts;
    if (key in bucket) bucket[key] = c._count;
    bucket.total += c._count;
  }

  return byBoard;
};

const serializeBoard = (board: BoardRow, ticket_counts: TicketCounts) => {
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

  const countsByBoard = await computeTicketCountsForBoards(boards.map((b: BoardRow) => b.id));
  return boards.map((board: BoardRow) =>
    serializeBoard(board, countsByBoard.get(board.id) ?? emptyCounts()),
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

  return serializeBoard(board, emptyCounts());
};

export const deleteBoard = async (id: string, workspaceId: string) => {
  const board = await prisma.board.findFirst({ where: { id, workspace_id: workspaceId } });
  if (!board) return false;

  const boardTickets = await prisma.ticket.findMany({
    where: { parent_id: id, parent_type: "board" },
    select: { id: true },
  });

  const ticketIds: string[] = [];
  for (const ticket of boardTickets) {
    ticketIds.push(...(await collectTicketSubtree(ticket.id)));
  }

  await prisma.$transaction([
    prisma.ticket.deleteMany({ where: { id: { in: ticketIds } } }),
    prisma.board.delete({ where: { id } }),
  ]);
  return true;
};
