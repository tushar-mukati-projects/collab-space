import { z } from "zod";

export const chatSchema = z.object({
  body: z.object({
    messages: z
      .array(
        z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string().min(1),
        }),
      )
      .min(1, "At least one message is required"),
  }),
});
