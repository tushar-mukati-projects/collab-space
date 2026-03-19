import type { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.validated = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      }) as Record<string, any>;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({ error: err.issues[0]?.message ?? "Validation failed" });
      }
      next(err);
    }
  };
};
