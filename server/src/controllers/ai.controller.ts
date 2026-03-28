import type { Request, Response } from "express";
import { validated } from "../types.js";
import { chatSchema } from "../schemas/ai.schema.js";
import { chatStream } from "../services/ai.service.js";

export const chatHandler = async (req: Request, res: Response) => {
  const {
    body: { messages },
    workspaceId,
  } = validated(req, chatSchema);

  await chatStream(messages, workspaceId, res);
};
