declare module '@server/auth/unifiedAuth' {
  import { Request, Response, NextFunction } from 'express';

  export const unifiedAuthMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  export const getAuthenticatedUser: (req: Request) => Promise<{ id: number; uid: string; adid: string; sid: string; isAnonymous?: boolean }>;
  export const optionalAuthMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  export const generateAuthToken: (user: { id: number; email?: string; isAnonymous?: boolean }) => string;
  export const clearUserSession: (deviceFingerprint: string) => void;
  export const clearAllSessions: () => void;
  export const getCurrentUserId: (req: Request) => Promise<number>;

  interface UnifiedAuthExports {
    getAuthenticatedUser: typeof getAuthenticatedUser;
    unifiedAuthMiddleware: typeof unifiedAuthMiddleware;
    optionalAuthMiddleware: typeof optionalAuthMiddleware;
    generateAuthToken: typeof generateAuthToken;
    clearUserSession: typeof clearUserSession;
    getCurrentUserId: typeof getCurrentUserId;
  }

  const _default: UnifiedAuthExports;
  export default _default;
}
