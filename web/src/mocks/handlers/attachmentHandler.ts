import { http, HttpResponse, delay } from "msw";
import { _tickets } from "../store";
import { mockUrl } from "../config";
import type { Attachment } from "@/types";

interface StoredAttachment extends Attachment {
  ticket_id: string;
}

const _attachments: StoredAttachment[] = [];

const toResponse = (a: StoredAttachment): Attachment => ({
  id: a.id,
  filename: a.filename,
  url: a.url,
  size: a.size,
  mime_type: a.mime_type,
  uploaded_by: a.uploaded_by,
  created_at: a.created_at,
});

export const attachmentHandlers = [
  http.post(mockUrl("/upload"), async ({ request }) => {
    await delay(400);
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return HttpResponse.json({ error: "No file provided" }, { status: 400 });
    return HttpResponse.json({ url: URL.createObjectURL(file) });
  }),

  http.get(mockUrl("/tickets/:id/attachments"), async ({ params }) => {
    await delay(200);
    const ticketId = params.id as string;
    const ticket = _tickets.find((t) => t.id === ticketId);
    if (!ticket) return HttpResponse.json({ error: "Ticket not found" }, { status: 404 });

    const result = _attachments.filter((a) => a.ticket_id === ticketId).map(toResponse);
    return HttpResponse.json(result);
  }),

  http.post(mockUrl("/tickets/:id/attachments"), async ({ params, request }) => {
    await delay(500);
    const ticketId = params.id as string;
    const ticket = _tickets.find((t) => t.id === ticketId);
    if (!ticket) return HttpResponse.json({ error: "Ticket not found" }, { status: 404 });

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return HttpResponse.json({ error: "No file provided" }, { status: 400 });

    const attachment: StoredAttachment = {
      id: crypto.randomUUID(),
      filename: file.name,
      url: URL.createObjectURL(file),
      size: file.size,
      mime_type: file.type || "application/octet-stream",
      uploaded_by: "usr_01",
      created_at: new Date().toISOString(),
      ticket_id: ticketId,
    };
    _attachments.push(attachment);

    return HttpResponse.json(toResponse(attachment), { status: 201 });
  }),

  http.delete(mockUrl("/tickets/:id/attachments/:attachmentId"), async ({ params }) => {
    await delay(200);
    const attachmentId = params.attachmentId as string;
    const idx = _attachments.findIndex((a) => a.id === attachmentId);
    if (idx === -1) return HttpResponse.json({ error: "Attachment not found" }, { status: 404 });
    _attachments.splice(idx, 1);
    return HttpResponse.json({ success: true });
  }),
];
