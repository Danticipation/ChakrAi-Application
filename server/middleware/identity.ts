import type { Request, Response, NextFunction } from 'express';
import { ensureRequestUid } from '../identity/index.js';

export function identityMiddleware(req: Request, res: Response, next: NextFunction) {
  const uid = ensureRequestUid(req, res); // sets req.ctx.uid and cookie if absent
  console.log(`[Identity Middleware] req.ctx.uid set to: ${uid}`);
  next();
}
