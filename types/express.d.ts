import 'express-serve-static-core';

declare global {
  namespace Express {
    interface Request {
      userId?: number;
      user?: { id: number };
      authenticatedUserId?: number;
      isAnonymous?: boolean;
    }
  }
}
