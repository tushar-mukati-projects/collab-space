import { http, HttpResponse, delay } from "msw";
import { _tickets, _comments, _activities, recalculateBoardCounts } from "../store";
import { mockUrl } from "../config";
import type {
  Ticket,
  TicketSummary,
  CreateTicketInput,
  CreateCommentInput,
  Comment,
} from "@/types";

const toSummary = (ticket: Ticket): TicketSummary => {
  return {
    id: ticket.id,
    title: ticket.title,
    status: ticket.status,
    due_date: ticket.due_date,
    priority: ticket.priority,
    assignee: ticket.assignee,
    created_by: ticket.created_by,
    parent_id: ticket.parent_id,
    parent_type: ticket.parent_type,
    labels: ticket.labels,
    sub_ticket_count: _tickets.filter(
      (t) => t.parent_id === ticket.id && t.parent_type === "ticket",
    ).length,
  };
};

export const ticketHandlers = [
  http.get(mockUrl("/tickets"), async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const assignees = url.searchParams.getAll("assignees");
    const createdBy = url.searchParams.getAll("created_by");
    const statuses = url.searchParams.getAll("statuses");
    const priorities = url.searchParams.getAll("priorities");
    const labels = url.searchParams.getAll("labels");
    const parentId = url.searchParams.get("parent_id");
    const parentTypes = url.searchParams.getAll("parent_type");
    const searchTerm = url.searchParams.get("search_term")?.toLowerCase() ?? "";

    let results = _tickets;

    if (parentId) {
      results = results.filter((t) => t.parent_id === parentId);
    }
    if (parentTypes.length > 0) {
      results = results.filter((t) => t.parent_type && parentTypes.includes(t.parent_type));
    }
    if (assignees.length > 0) {
      results = results.filter((t) => t.assignee && assignees.includes(t.assignee));
    }
    if (createdBy.length > 0) {
      results = results.filter((t) => createdBy.includes(t.created_by));
    }
    if (statuses.length > 0) {
      results = results.filter((t) => statuses.includes(t.status));
    }
    if (priorities.length > 0) {
      results = results.filter((t) => priorities.includes(t.priority));
    }
    if (labels.length > 0) {
      results = results.filter((t) => labels.some((l) => t.labels.includes(l)));
    }
    if (searchTerm) {
      results = results.filter(
        (t) =>
          t.title.toLowerCase().includes(searchTerm) ||
          t.description.toLowerCase().includes(searchTerm),
      );
    }

    return HttpResponse.json(results.map(toSummary));
  }),

  http.get(mockUrl("/tickets/:id"), async ({ params }) => {
    await delay(200);
    const ticket = _tickets.find((t) => t.id === params.id);
    if (!ticket) {
      return HttpResponse.json({ error: "Ticket not found" }, { status: 404 });
    }
    return HttpResponse.json(ticket);
  }),

  http.post(mockUrl("/tickets"), async ({ request }) => {
    await delay(300);
    const input = (await request.json()) as CreateTicketInput;
    const now = new Date().toISOString();
    const parentType = input.parent_type ?? null;
    const parentId = input.parent_id ?? null;

    const ticket: Ticket = {
      id: crypto.randomUUID(),
      title: input.title,
      description: input.description ?? "",
      content: input.content ?? "",
      status: input.status ?? "backlog",
      priority: input.priority ?? "none",
      assignee: input.assignee ?? null,
      created_by: "usr_01",
      parent_id: parentId,
      parent_type: parentType,
      labels: input.labels ?? [],
      due_date: input.due_date ?? null,
      created_at: now,
      updated_at: now,
      sub_tickets: [],
      comments: [],
      workspace_id: "ws_01",
    };
    _tickets.push(ticket);

    if (parentType === "ticket" && parentId) {
      const parent = _tickets.find((t) => t.id === parentId);
      if (parent) {
        parent.sub_tickets.push(ticket.id);
        parent.updated_at = now;
      }
    }

    if (ticket.parent_type === "board" && ticket.parent_id) {
      recalculateBoardCounts(ticket.parent_id);
    }

    return HttpResponse.json(ticket, { status: 201 });
  }),

  http.patch(mockUrl("/tickets/:id"), async ({ params, request }) => {
    await delay(300);
    const idx = _tickets.findIndex((t) => t.id === params.id);
    if (idx === -1) {
      return HttpResponse.json({ error: "Ticket not found" }, { status: 404 });
    }
    const updates = (await request.json()) as Partial<Ticket>;
    const ticket = _tickets[idx];
    if (updates.title !== undefined) ticket.title = updates.title;
    if (updates.description !== undefined) ticket.description = updates.description;
    if (updates.content !== undefined) ticket.content = updates.content;
    if (updates.status !== undefined) ticket.status = updates.status;
    if (updates.priority !== undefined) ticket.priority = updates.priority;
    if (updates.assignee !== undefined) ticket.assignee = updates.assignee;
    if (updates.labels !== undefined) ticket.labels = updates.labels;
    if (updates.due_date !== undefined) ticket.due_date = updates.due_date;
    ticket.updated_at = new Date().toISOString();

    if (ticket.parent_type === "board" && ticket.parent_id) {
      recalculateBoardCounts(ticket.parent_id);
    }

    return HttpResponse.json(ticket);
  }),

  http.delete(mockUrl("/tickets/:id"), async ({ params }) => {
    await delay(200);
    const idx = _tickets.findIndex((t) => t.id === params.id);
    if (idx === -1) {
      return HttpResponse.json({ error: "Ticket not found" }, { status: 404 });
    }
    const ticketId = params.id as string;
    const ticket = _tickets[idx];
    const boardId = ticket.parent_type === "board" ? ticket.parent_id : null;
    _tickets.splice(idx, 1);
    const filteredComments = _comments.filter((c) => c.ticket_id !== ticketId);
    _comments.splice(0, _comments.length, ...filteredComments);
    const filteredActivities = _activities.filter((a) => a.ticket_id !== ticketId);
    _activities.splice(0, _activities.length, ...filteredActivities);
    if (boardId) recalculateBoardCounts(boardId);
    return HttpResponse.json({ success: true });
  }),

  http.get(mockUrl("/tickets/:id/activities"), async ({ params }) => {
    await delay(200);
    const ticketId = params.id as string;
    const filtered = _activities.filter((a) => a.ticket_id === ticketId);
    return HttpResponse.json(filtered);
  }),

  http.get(mockUrl("/tickets/:id/comments"), async ({ params }) => {
    await delay(200);
    const ticketId = params.id as string;
    const filtered = _comments.filter((c) => c.ticket_id === ticketId);
    return HttpResponse.json(filtered);
  }),

  http.post(mockUrl("/tickets/:id/comments"), async ({ params, request }) => {
    await delay(300);
    const ticketId = params.id as string;
    const input = (await request.json()) as Omit<CreateCommentInput, "ticket_id">;
    const now = new Date().toISOString();
    const comment: Comment = {
      id: crypto.randomUUID(),
      content: input.content,
      author_id: "usr_01",
      ticket_id: ticketId,
      created_at: now,
    };
    _comments.push(comment);

    const ticket = _tickets.find((t) => t.id === ticketId);
    if (ticket) {
      ticket.comments.push(comment.id);
      ticket.updated_at = now;
    }

    return HttpResponse.json(comment, { status: 201 });
  }),
];
