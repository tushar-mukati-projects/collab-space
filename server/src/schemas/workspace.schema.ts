import { z } from "zod";

export const createWorkspaceSchema = z.object({
  body: z.object({ name: z.string().min(1, "name is required") }),
});

export const getInvitationsSchema = z.object({
  query: z.object({ email: z.string().email("valid email required") }),
});

export const joinWorkspaceSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({ email: z.string().email() }),
});

export const inviteToWorkspaceSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({ email: z.string().email() }),
});
