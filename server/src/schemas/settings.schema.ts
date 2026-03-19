import { z } from "zod";
export const updateProfileSchema = z.object({
  body: z.object({ name: z.string().optional(), email: z.string().email().optional() }),
});
export const updateWorkspaceSettingsSchema = z.object({
  body: z.object({ name: z.string().optional() }),
});
