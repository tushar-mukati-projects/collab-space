import type { BoardSummary } from "@/types";

export const mockBoards: BoardSummary[] = [
  {
    id: "board_01",
    name: "Sprint 13 Board",
    workspace_id: "ws_01",
    ticket_counts: { total: 10, backlog: 2, todo: 2, in_progress: 3, in_review: 2, done: 1 },
    created_at: "2026-03-01T00:00:00.000Z",
    updated_at: "2026-03-15T10:00:00.000Z",
  },
  {
    id: "board_02",
    name: "Bug Fixes",
    workspace_id: "ws_01",
    ticket_counts: { total: 3, backlog: 1, todo: 1, in_progress: 0, in_review: 1, done: 0 },
    created_at: "2026-03-05T00:00:00.000Z",
    updated_at: "2026-03-14T08:00:00.000Z",
  },
  {
    id: "board_03",
    name: "Technical Debt",
    workspace_id: "ws_01",
    ticket_counts: { total: 2, backlog: 1, todo: 0, in_progress: 1, in_review: 0, done: 0 },
    created_at: "2026-03-10T00:00:00.000Z",
    updated_at: "2026-03-13T14:00:00.000Z",
  },
];
