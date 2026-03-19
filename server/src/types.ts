import type { Request } from "express";
import type { ZodSchema, z } from "zod";

declare global {
  namespace Express {
    interface Request {
      userId: string;
      workspaceId: string;
      validated: Record<string, any>;
    }
  }
}

export const validated = <T extends ZodSchema>(req: Request, _schema: T): z.infer<T> => {
  return req.validated as z.infer<T>;
};
