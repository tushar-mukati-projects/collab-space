import { z } from "zod";
export const createLabelSchema = z.object({
  body: z.object({
    name: z.string().min(1, "name is required"),
    color: z.string().min(1, "color is required"),
  }),
});
export const labelIdSchema = z.object({ params: z.object({ id: z.string() }) });
