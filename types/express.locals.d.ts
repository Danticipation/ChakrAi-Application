import 'express-serve-static-core';

declare global {
  namespace Express {
    interface Locals {
      requestId?: string;
      userId?: number | string;
      sessionId?: string;
      // add whatever you actually use in middleware: traceId, orgId, etc.
    }
  }
}

export {};
