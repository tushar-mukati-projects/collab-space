import { z } from "zod";
export const toggleFavoriteSchema = z.object({
  body: z.object({ ticket_id: z.string().min(1, "ticket_id is required") }),
});
