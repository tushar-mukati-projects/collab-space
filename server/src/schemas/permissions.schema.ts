import { z } from "zod";

export const updatePermissionsSchema = z.object({
  params: z.object({
    role: z.string(),
  }),
  body: z.object({
    permissions: z.array(z.string()),
  }),
});
