import type { Request } from "express";
import type { ZodSchema, z } from "zod";

declare global {
  namespace Express {
    interface Request {
      validated: any;
    }
  }
}

export interface AuthedRequest extends Request {
  userId: string;
}

export interface WorkspaceRequest extends AuthedRequest {
  workspaceId: string;
}

type Context = { userId: string; workspaceId: string };

export const validated: {
  <T extends ZodSchema>(req: Request, schema: T): z.infer<T> & Context;
  (req: Request): Context;
} = (req: Request, _schema?: any) => {
  const base = req.validated ?? {};
  return {
    ...base,
    userId: (req as any).userId,
    workspaceId: (req as any).workspaceId,
  };
};
