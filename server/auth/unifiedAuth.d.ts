import { Request, Response, NextFunction } from 'express';

interface User {
  id: number;
  uid: string;
  adid: string;
  sid: string;
  isAnonymous: boolean;
  email?: string;
}

export const getAuthenticatedUser: (req: Request) => Promise<User>;
export const unifiedAuthMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export const optionalAuthMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export const generateAuthToken: (user: User) => string;
export const clearUserSession: (deviceFingerprint: string) => void;
export const clearAllSessions: () => void;
export const getCurrentUserId: (req: Request) => Promise<number>;

// Extend the Request type to include userId, user, and authenticatedUserId
declare global {
  namespace Express {
    interface Request {
      userId?: number;
      user?: {
        id: number;
        uid: string;
        adid: string;
        sid: string;
        isAnonymous: boolean;
        email?: string;
      };
      authenticatedUserId?: number;
      isAnonymous?: boolean;
    }
  }
}
