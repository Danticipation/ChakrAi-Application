import express from 'express';
import { getAuthenticatedUser, generateAuthToken } from '../auth/unifiedAuth.js';

const router = express.Router();

/**
 * DISABLED - REPLACED BY HIPAA AUTH
 * This route is disabled to prevent user ID conflicts
 */
router.post('/authenticate', async (req, res) => {
  // Use the user from HIPAA auth middleware
  res.json({
    userId: req.userId,
    sessionId: `session-${req.userId}`,
    deviceFingerprint: req.cookies?.did || 'secure-did',
    isAuthenticated: true,
    isAnonymous: req.isAnonymous,
    timestamp: new Date().toISOString()
  });
});

/**
 * DISABLED - REPLACED BY HIPAA AUTH
 */
router.get('/current-user', async (req, res) => {
  res.json({
    userId: req.userId,
    sessionId: `session-${req.userId}`,
    deviceFingerprint: req.cookies?.did || 'secure-did',
    isAuthenticated: true,
    isAnonymous: req.isAnonymous,
    timestamp: new Date().toISOString()
  });
});

export default router;