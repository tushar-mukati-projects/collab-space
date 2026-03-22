import { mockTickets, mockComments, mockActivities, mockBoards, mockWorkspace } from "./data";
import type { Ticket, Comment, Activity, BoardSummary, Workspace } from "@/types";

export const _tickets: Ticket[] = structuredClone(mockTickets);
export const _comments: Comment[] = structuredClone(mockComments);
export const _activities: Activity[] = structuredClone(mockActivities);
export const _boards: BoardSummary[] = structuredClone(mockBoards);
export const _workspaces: Workspace[] = [structuredClone(mockWorkspace)];

export const recalculateBoardCounts = (boardId: string) => {
  const board = _boards.find((b) => b.id === boardId);
  if (!board) return;
  const counts = { total: 0, backlog: 0, todo: 0, in_progress: 0, in_review: 0, done: 0 };
  for (const ticket of _tickets.filter(
    (t) => t.parent_id === boardId && t.parent_type === "board",
  )) {
    const key = ticket.status.replace(/-/g, "_") as keyof typeof counts;
    if (key in counts) (counts[key] as number)++;
    counts.total++;
  }
  board.ticket_counts = counts;
  board.updated_at = new Date().toISOString();
};
