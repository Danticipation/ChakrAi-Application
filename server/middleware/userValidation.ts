import { userSessionManager } from '../userSession.js';
import type { Request, Response, NextFunction } from 'express';

export const validateUserAuth = async (req: Request, res: Response, next: NextFunction) => {
  const sessionInfo = await userSessionManager.getSessionFromRequest(req);
  // const user = await userSessionManager.getOrCreateAnonymousUser(
  //   sessionInfo.deviceFingerprint,
  //   sessionInfo.sessionId
  // );
  // (req as any).userId = user.id;
  // (req as any).authenticatedUserId = user.id;
  next();
};

export const getAuthenticatedUserId = (req: Request) => {
  return (req as any).userId || (req as any).authenticatedUserId;
};

export function requireUser(req: Request, res: Response, next: NextFunction) {
  const id = (req.user as any)?.id ?? (req as any).userId ?? (req as any).uid;
  if (!id) {
    return res.status(401).json({ error: 'Unauthenticated' });
  }
  res.locals.userId = id;
  return next();
}
