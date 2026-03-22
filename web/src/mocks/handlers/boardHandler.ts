import { http, HttpResponse, delay } from "msw";
import { _boards, _tickets } from "../store";
import { mockUrl } from "../config";
import type { BoardSummary, CreateBoardInput } from "@/types";

export const boardHandlers = [
  http.get(mockUrl("/boards"), async () => {
    await delay(300);
    return HttpResponse.json(_boards);
  }),

  http.get(mockUrl("/boards/:id"), async ({ params }) => {
    await delay(200);
    const board = _boards.find((b) => b.id === params.id);
    if (!board) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(board);
  }),

  http.post(mockUrl("/boards"), async ({ request }) => {
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

  http.delete(mockUrl("/boards/:id"), async ({ params }) => {
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
