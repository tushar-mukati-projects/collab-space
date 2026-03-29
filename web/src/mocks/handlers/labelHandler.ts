import { http, HttpResponse, delay } from "msw";
import { mockLabels } from "../data";
import { mockUrl } from "../config";
import type { Label, CreateLabelInput, UpdateLabelInput } from "@/types";

const _labels: Label[] = structuredClone(mockLabels);

export const labelHandlers = [
  http.get(mockUrl("/labels"), async () => {
    await delay(200);
    return HttpResponse.json(_labels);
  }),

  http.post(mockUrl("/labels"), async ({ request }) => {
    await delay(300);
    const input = (await request.json()) as CreateLabelInput;
    const label: Label = {
      id: crypto.randomUUID(),
      name: input.name.trim(),
      color: input.color,
    };
    _labels.push(label);
    return HttpResponse.json(label, { status: 201 });
  }),

  http.patch(mockUrl("/labels/:id"), async ({ params, request }) => {
    await delay(200);
    const idx = _labels.findIndex((l) => l.id === params.id);
    if (idx === -1) return new HttpResponse(null, { status: 404 });
    const updates = (await request.json()) as UpdateLabelInput;
    const label = _labels[idx];
    if (updates.name !== undefined) label.name = updates.name.trim();
    if (updates.color !== undefined) label.color = updates.color;
    return HttpResponse.json(label);
  }),

  http.delete(mockUrl("/labels/:id"), async ({ params }) => {
    await delay(200);
    const idx = _labels.findIndex((l) => l.id === params.id);
    if (idx === -1) return new HttpResponse(null, { status: 404 });
    _labels.splice(idx, 1);
    return HttpResponse.json({ success: true });
  }),
];
