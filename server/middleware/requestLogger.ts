// server/middleware/requestLogger.ts
import type { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const started = process.hrtime.bigint();
  res.on('finish', () => {
    const tag = (res.locals as any).uidTag || 'anon';
    const ms = Number(process.hrtime.bigint() - started) / 1e6;
    console.log(`📊 ${req.method} ${req.originalUrl} | uidTag:${tag} | ${res.statusCode} | ${ms.toFixed(0)}ms`);
  });
  next();
}
