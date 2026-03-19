import { http, HttpResponse, delay } from "msw";
import { _boards, _tickets, recalculateBoardCounts } from "../store";
import type { BoardSummary, MoveTicketInput, CreateBoardInput } from "@/types";

export const boardHandlers = [
  // GET /api/boards — returns board summaries
  http.get("/api/boards", async () => {
    await delay(300);
    return HttpResponse.json(_boards);
  }),

  // GET /api/boards/:id — returns board summary (no tickets; fetch via GET /api/tickets?parent_id=id&parent_type=board)
  http.get("/api/boards/:id", async ({ params }) => {
    await delay(200);
    const board = _boards.find((b) => b.id === params.id);
    if (!board) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(board);
  }),

  // POST /api/boards — create a new board
  http.post("/api/boards", async ({ request }) => {
    await delay(300);
    const input = (await request.json()) as CreateBoardInput;
    const newBoard: BoardSummary = {
      id: `board_${String(_boards.length + 1).padStart(2, "0")}`,
      name: input.name,
      workspace_id: "ws_01",
      ticket_counts: { total: 0, backlog: 0, todo: 0, in_progress: 0, in_review: 0, done: 0 },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    _boards.push(newBoard);
    return HttpResponse.json(newBoard, { status: 201 });
  }),

  // PATCH /api/boards/move-ticket — update a ticket's status
  http.patch("/api/boards/move-ticket", async ({ request }) => {
    await delay(200);
    const input = (await request.json()) as MoveTicketInput;

    const ticket = _tickets.find((t) => t.id === input.ticket_id);
    if (!ticket) return new HttpResponse(null, { status: 404 });

    ticket.status = input.to_status;
    ticket.updated_at = new Date().toISOString();

    // Recalculate counts for the board
    if (ticket.parent_type === "board" && ticket.parent_id) {
      recalculateBoardCounts(ticket.parent_id);
    }

    const boardId = ticket.parent_type === "board" ? ticket.parent_id : null;
    const board = _boards.find((b) => b.id === boardId);
    return HttpResponse.json(board ?? { success: true });
  }),
];
