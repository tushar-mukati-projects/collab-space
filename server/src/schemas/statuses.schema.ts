import { z } from "zod";
export const statusIdSchema = z.object({ params: z.object({ id: z.string() }) });
