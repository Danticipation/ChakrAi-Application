import 'express-serve-static-core';

declare module 'express-serve-static-core' {
  interface Request {
    userId?: number;
    user?: { id: number };
    authenticatedUserId?: number;
    isAnonymous?: boolean;
  }
}
