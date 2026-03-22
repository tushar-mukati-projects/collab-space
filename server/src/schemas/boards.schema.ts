import { z } from "zod";

export const createBoardSchema = z.object({
  body: z.object({ name: z.string().min(1, "name is required") }),
});

export const getBoardSchema = z.object({
  params: z.object({ id: z.string() }),
});
