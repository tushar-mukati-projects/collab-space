import { z } from "zod";

export const createCheckoutSchema = z.object({
  body: z.object({
    plan: z.enum(["pro", "enterprise"]),
  }),
});

export const createPortalSchema = z.object({});
