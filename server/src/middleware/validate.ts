import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { ZodSchema, z } from "zod";
import { ZodError } from "zod";
import type { AuthedRequest, WorkspaceRequest } from "../types.js";

export const validate = <T extends ZodSchema>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.validated = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({ error: err.issues[0]?.message ?? "Validation failed" });
      }
      next(err);
    }
  };
};

export const endpoint = <T extends ZodSchema>(
  schema: T,
  handler: (data: z.infer<T>, req: WorkspaceRequest, res: Response) => Promise<any>,
): RequestHandler[] => [
  validate(schema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await handler(req.validated, req as WorkspaceRequest, res);
    } catch (err) {
      next(err);
    }
  },
];

export const authedEndpoint = <T extends ZodSchema>(
  schema: T,
  handler: (data: z.infer<T>, req: AuthedRequest, res: Response) => Promise<any>,
): RequestHandler[] => [
  validate(schema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await handler(req.validated, req as AuthedRequest, res);
    } catch (err) {
      next(err);
    }
  },
];
