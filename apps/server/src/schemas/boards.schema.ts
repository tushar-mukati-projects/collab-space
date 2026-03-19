import { z } from "zod";

export const createBoardSchema = z.object({
  body: z.object({ name: z.string().min(1, "name is required") }),
});

export const getBoardSchema = z.object({
  params: z.object({ id: z.string() }),
});

export const moveTicketSchema = z.object({
  body: z.object({
    ticket_id: z.string().min(1, "ticket_id is required"),
    to_status: z.string().min(1, "to_status is required"),
  }),
});
