import { z } from "zod";

const stringOrArray = z.union([z.string(), z.array(z.string())]).optional();

export const listTicketsSchema = z.object({
  query: z
    .object({
      assignees: stringOrArray,
      created_by: stringOrArray,
      statuses: stringOrArray,
      priorities: stringOrArray,
      labels: stringOrArray,
      parent_type: stringOrArray,
      search_term: z.string().optional(),
      parent_id: z.string().optional(),
    })
    .passthrough(),
});

export const createTicketSchema = z.object({
  body: z.object({
    title: z.string().min(1, "title is required"),
    description: z.string().optional(),
    content: z.string().optional(),
    status: z.string().optional(),
    priority: z.string().optional(),
    assignee: z.string().nullable().optional(),
    labels: z.array(z.string()).optional(),
    due_date: z.string().nullable().optional(),
    parent_id: z.string().optional(),
    parent_type: z.string().optional(),
  }),
});

export const ticketIdSchema = z.object({
  params: z.object({ id: z.string() }),
});

export const updateTicketSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      content: z.string().optional(),
      status: z.string().optional(),
      priority: z.string().optional(),
      assignee: z.string().nullable().optional(),
      labels: z.array(z.string()).optional(),
      due_date: z.string().nullable().optional(),
    })
    .passthrough(),
});

export const createCommentSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    content: z.string().min(1, "content is required"),
  }),
});
