import { prisma } from "../db.js";
import { serializeStatus, deserializeStatus } from "../utils.js";

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

export const moveTicket = async (
  ticketId: string,
  status: string,
  userId: string,
  workspaceId: string,
): Promise<
  { error: "ticket_not_found" | "board_not_found" } | { data: ReturnType<typeof serializeBoard> }
> => {
  const dbStatus = deserializeStatus(status);

  const ticket = await prisma.ticket.findFirst({
    where: { id: ticketId, workspace_id: workspaceId },
  });

  if (!ticket) return { error: "ticket_not_found" };

  const oldStatus = serializeStatus(ticket.status);

  await prisma.ticket.update({
    where: { id: ticketId },
    data: { status: dbStatus },
  });

  await prisma.activity.create({
    data: {
      type: "ticket_status_changed",
      message: `Status changed from ${oldStatus} to ${status}`,
      user_id: userId,
      ticket_id: ticketId,
    },
  });

  let boardId: string | null = null;
  if (ticket.parent_type === "board" && ticket.parent_id) {
    boardId = ticket.parent_id;
  } else if (ticket.parent_type === "ticket" && ticket.parent_id) {
    let current = ticket;
    while (current.parent_type === "ticket" && current.parent_id) {
      const parent = await prisma.ticket.findUnique({
        where: { id: current.parent_id },
      });
      if (!parent) break;
      current = parent;
    }
    if (current.parent_type === "board" && current.parent_id) {
      boardId = current.parent_id;
    }
  }

  const board = await prisma.board.findFirst({
    where: { id: boardId ?? undefined, workspace_id: workspaceId },
  });

  if (!board) return { error: "board_not_found" };

  const ticket_counts = await computeTicketCounts(board.id);
  return { data: serializeBoard(board, ticket_counts) };
};

export const deleteBoard = async (id: string, workspaceId: string) => {
  const board = await prisma.board.findFirst({ where: { id, workspace_id: workspaceId } });
  if (!board) return false;
  await prisma.ticket.deleteMany({ where: { parent_id: id, parent_type: "board" } });
  await prisma.board.delete({ where: { id } });
  return true;
};
