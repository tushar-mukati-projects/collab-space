import { http, HttpResponse, delay } from "msw";
import { _boards, _tickets, recalculateBoardCounts } from "../store";
import type { BoardSummary, MoveTicketInput, CreateBoardInput } from "@/types";

export const boardHandlers = [
  http.get("/api/boards", async () => {
    await delay(300);
    return HttpResponse.json(_boards);
  }),

  http.get("/api/boards/:id", async ({ params }) => {
    await delay(200);
    const board = _boards.find((b) => b.id === params.id);
    if (!board) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(board);
  }),

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

  http.patch("/api/boards/move-ticket", async ({ request }) => {
    await delay(200);
    const input = (await request.json()) as MoveTicketInput;

    const ticket = _tickets.find((t) => t.id === input.ticket_id);
    if (!ticket) return new HttpResponse(null, { status: 404 });

    ticket.status = input.to_status;
    ticket.updated_at = new Date().toISOString();

    if (ticket.parent_type === "board" && ticket.parent_id) {
      recalculateBoardCounts(ticket.parent_id);
    }

    const boardId = ticket.parent_type === "board" ? ticket.parent_id : null;
    const board = _boards.find((b) => b.id === boardId);
    return HttpResponse.json(board ?? { success: true });
  }),

  http.delete("/api/boards/:id", async ({ params }) => {
    await delay(200);
    const idx = _boards.findIndex((b) => b.id === params.id);
    if (idx === -1) return new HttpResponse(null, { status: 404 });
    _boards.splice(idx, 1);
    const filtered = _tickets.filter(
      (t) => !(t.parent_type === "board" && t.parent_id === params.id),
    );
    _tickets.splice(0, _tickets.length, ...filtered);
    return HttpResponse.json({ success: true });
  }),
];
