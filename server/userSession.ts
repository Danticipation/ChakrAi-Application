/**
 * UPDATED USER SESSION MANAGER
 * Now uses the unified authentication system
 */

import { getAuthenticatedUser } from './auth/unifiedAuth.js';

export const userSessionManager = {
  getSessionFromRequest: (req) => ({
    deviceFingerprint: req.headers['x-device-fingerprint'] || 
                      req.headers['device-fingerprint'] || 
                      'unknown',
    sessionId: req.headers['x-session-id'] || 
              req.headers['session-id'] || 
              `session-${Date.now()}`
  })
};

export const getOrCreateAnonymousUser = async (req) => {
  const ctx = (req as any).ctx;
  if (!ctx?.uid) throw new Error('auth_ctx_missing');
  return { uid: ctx.uid, adid: ctx.adid, sid: ctx.sid, id: req.userId };
};
