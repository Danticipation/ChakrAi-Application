/**
 * FIXED UNIFIED AUTHENTICATION SYSTEM
 * Prevents multiple user creation for same session
 */

import jwt from 'jsonwebtoken';
import { storage } from '../storage.js';

const JWT_SECRET = process.env.JWT_SECRET || 'chakrai-dev-secret-change-in-production';

// Single cache for all user sessions
const globalUserCache = new Map();

/**
 * SINGLE SOURCE OF TRUTH: Get or create user
 * FIXED: Prevents multiple user creation
 */
export const getAuthenticatedUser = async (req) => {
  const ctx = (req && req.ctx) || (req && req['ctx']);
  if (!ctx?.uid) throw new Error('auth_ctx_missing');
  return { id: req.userId, uid: ctx.uid, adid: ctx.adid, sid: ctx.sid };
};

// Cache management - no auto-clear on startup

/**
 * UNIFIED AUTHENTICATION MIDDLEWARE
 * Use this middleware on all routes that need user authentication
 */
export const unifiedAuthMiddleware = async (req, res, next) => {
  try {
    const user = await getAuthenticatedUser(req);
    
    // Set user info on request object
    req.user = user;
    req.userId = user.id;
    req.authenticatedUserId = user.id;
    req.isAnonymous = user.isAnonymous;
    
    console.log(`🔒 Authenticated request: User ${user.id}, Route: ${req.path}`);
    
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    res.status(401).json({ 
      error: 'Authentication required',
      message: 'Please provide valid authentication'
    });
  }
};

/**
 * Optional authentication middleware (doesn't fail if no auth)
 */
export const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const user = await getAuthenticatedUser(req);
    req.user = user;
    req.userId = user.id;
    req.authenticatedUserId = user.id;
    req.isAnonymous = user.isAnonymous;
  } catch (error) {
    // Continue without authentication
    req.user = null;
    req.userId = null;
    req.authenticatedUserId = null;
    req.isAnonymous = true;
  }
  next();
};

/**
 * Generate JWT token for registered users
 */
export const generateAuthToken = (user) => {
  return jwt.sign(
    { 
      userId: user.id, 
      email: user.email || null,
      isAnonymous: user.isAnonymous 
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
};

/**
 * Clear user from cache (for logout/reset)
 */
export const clearUserSession = (deviceFingerprint) => {
  globalUserCache.delete(deviceFingerprint);
  console.log(`🗑️ Cleared session for device: ${deviceFingerprint}`);
};

/**
 * Clear all cache (for system reset)
 */
export const clearAllSessions = () => {
  globalUserCache.clear();
  console.log('🧨 Cleared all user sessions');
};

/**
 * Get current user ID (for compatibility with existing code)
 */
export const getCurrentUserId = async (req) => {
  const user = await getAuthenticatedUser(req);
  return user.id;
};

export default {
  getAuthenticatedUser,
  unifiedAuthMiddleware,
  optionalAuthMiddleware,
  generateAuthToken,
  clearUserSession,
  getCurrentUserId
};
