import type { Request, Response, NextFunction } from "express";

type AsyncHandler = (req: Request, res: Response) => Promise<any>;

export const wrapController = (fn: AsyncHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res).catch(next);
  };
};
