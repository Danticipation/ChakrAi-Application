import { userSessionManager } from '../userSession.js';

export const validateUserAuth = async (req, res, next) => {
  const sessionInfo = userSessionManager.getSessionFromRequest(req);
  const user = await userSessionManager.getOrCreateAnonymousUser(
    sessionInfo.deviceFingerprint,
    sessionInfo.sessionId
  );
  req.userId = user.id;
  req.authenticatedUserId = user.id;
  next();
};

export const getAuthenticatedUserId = (req) => {
  return req.userId || req.authenticatedUserId;
};
