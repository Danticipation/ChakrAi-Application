import { Request, Response, NextFunction } from 'express';
import { unifiedAuthMiddleware } from '../../auth/unifiedAuth.js';

// Extend the Request type to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: number;
      isAnonymous?: boolean;
    }
  }
}

/**
 * Middleware to ensure a user is authenticated and has a userId.
 * This should be used on routes that require a logged-in user.
 */
export const requireUserId = (req: Request, res: Response, next: NextFunction) => {
  // unifiedAuthMiddleware should have already run and set req.userId
  if (!req.userId) {
    return res.status(401).json({ error: 'Authentication required', message: 'User ID not found in request.' });
  }
  next();
};

// Re-export unifiedAuthMiddleware for convenience if needed elsewhere
export { unifiedAuthMiddleware };
