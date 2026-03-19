import { http, HttpResponse, delay } from "msw";
import { mockStatuses } from "../data";
import type { StatusDefinition } from "@/types";

const _statuses: StatusDefinition[] = structuredClone(mockStatuses);

export const statusHandlers = [
  http.get("/api/statuses", async () => {
    await delay(200);
    return HttpResponse.json(_statuses);
  }),

  http.patch("/api/statuses/:id", async ({ params, request }) => {
    await delay(200);
    const idx = _statuses.findIndex((s) => s.id === params.id);
    if (idx === -1) return new HttpResponse(null, { status: 404 });
    const updates = (await request.json()) as Partial<Pick<StatusDefinition, "name" | "color">>;
    const status = _statuses[idx];
    if (updates.name !== undefined) status.name = updates.name.trim();
    if (updates.color !== undefined) status.color = updates.color;
    return HttpResponse.json(status);
  }),
];
