import type { Request, Response, NextFunction, RequestHandler } from 'express';

export const safe =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any> | any): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((e: unknown) => {
      const err = e instanceof Error ? e : new Error(String(e));
      next(err);
    });
  };
