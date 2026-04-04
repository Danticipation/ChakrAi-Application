/**
 * UPDATED USER SESSION MANAGER
 * Now uses the unified authentication system
 */

import { getAuthenticatedUser } from '@server/auth/unifiedAuth.js';

import { Request } from 'express';

// Define a type for the request object to satisfy TypeScript
interface AppRequest extends Request {
  ctx?: {
    uid: string;
    adid: string;
    sid: string;
  };
  userId?: any;
}

export const userSessionManager = {
  getSessionFromRequest: async (req: AppRequest) => {
    const user = await getAuthenticatedUser(req);
    return {
      ...user,
      deviceFingerprint: req.headers['x-device-fingerprint'] || 
                        req.headers['device-fingerprint'] || 
                        'unknown',
      sessionId: req.headers['x-session-id'] || 
                req.headers['session-id'] || 
                `session-${Date.now()}`
    };
  }
};

export const getOrCreateAnonymousUser = async (req: AppRequest) => {
  const ctx = (req as any).ctx;
  if (!ctx?.uid) throw new Error('auth_ctx_missing');
  return { uid: ctx.uid, adid: ctx.adid, sid: ctx.sid, id: req.userId };
};
