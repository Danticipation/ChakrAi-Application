/**
 * AUTHENTICATION TEST ENDPOINT
 * Test the unified authentication system
 */

import express from 'express';
import { unifiedAuthMiddleware, getAuthenticatedUser } from '../auth/unifiedAuth.js';

const router = express.Router();

// Test endpoint to verify unified auth is working
router.get('/test-auth', unifiedAuthMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'Unified authentication working!',
    userId: req.userId,
    isAnonymous: req.isAnonymous,
    user: {
      id: req.user.id,
      displayName: req.user.displayName,
      isAnonymous: req.user.isAnonymous
    }
  });
});

// Test endpoint to verify user creation
router.post('/test-create-user', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    res.json({
      success: true,
      message: 'User creation working!',
      userId: user.id,
      isAnonymous: user.isAnonymous
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
