/**
 * SECURE PERSISTENT AUTHENTICATION FOR HEALTHCARE
 * Each user gets a permanent, unique identity that persists across sessions
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { storage } from '../storage.js';

const JWT_SECRET = process.env.JWT_SECRET || 'chakrai-dev-secret-change-in-production';

// Persistent user cache - users stay logged in across sessions
const persistentUserCache = new Map();

/**
 * Generate a permanent, unique user identifier
 */
const generatePermanentUserId = () => {
  return crypto.randomUUID();
};

/**
 * Create or retrieve permanent user based on secure token
 */
export const getOrCreatePermanentUser = async (req) => {
  try {
    // 1. Check for existing auth token in headers
    const authHeader = req.headers['authorization'];
    let userToken = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      userToken = authHeader.split(' ')[1];
    } else {
      // Check for session token in other headers
      userToken = req.headers['x-user-token'] || 
                 req.headers['user-token'] ||
                 req.headers['x-session-token'];
    }

    // 2. If we have a token, verify and get user
    if (userToken) {
      try {
        const decoded = jwt.verify(userToken, JWT_SECRET);
        
        // Check cache first
        if (persistentUserCache.has(decoded.permanentUserId)) {
          const cachedUser = persistentUserCache.get(decoded.permanentUserId);
          console.log(`🔐 Persistent user: ${cachedUser.id}`);
          return { user: cachedUser, token: userToken };
        }

        // Check database
        const user = await storage.getUserById(decoded.userId);
        if (user) {
          persistentUserCache.set(decoded.permanentUserId, user);
          console.log(`💾 Retrieved persistent user: ${user.id}`);
          return { user, token: userToken };
        }
      } catch (jwtError) {
        console.warn('Invalid token, creating new user');
      }
    }

    // 3. Create new permanent user
    const permanentUserId = generatePermanentUserId();
    const username = `user_${permanentUserId.slice(0, 8)}`;
    
    console.log(`✨ Creating permanent user: ${username}`);
    
    const newUser = await storage.createUser({
      username,
      displayName: 'Anonymous User',
      isAnonymous: true,
      deviceFingerprint: permanentUserId,
      sessionId: permanentUserId,
      email: null,
      passwordHash: null
    });

    // Generate permanent token
    const token = jwt.sign(
      { 
        userId: newUser.id,
        permanentUserId,
        isAnonymous: true,
        created: Date.now()
      },
      JWT_SECRET,
      { expiresIn: '365d' } // 1 year expiration
    );

    // Cache the user
    persistentUserCache.set(permanentUserId, newUser);
    
    console.log(`✅ Created permanent user ${newUser.id} with token`);
    
    return { user: newUser, token, isNewUser: true };

  } catch (error) {
    console.error('❌ Persistent auth error:', error);
    throw new Error('Authentication failed');
  }
};

/**
 * Secure authentication middleware for healthcare data
 */
export const secureAuthMiddleware = async (req, res, next) => {
  try {
    const { user, token, isNewUser } = await getOrCreatePermanentUser(req);
    
    // Set user info on request
    req.user = user;
    req.userId = user.id;
    req.authenticatedUserId = user.id;
    req.isAnonymous = user.isAnonymous;
    req.userToken = token;
    
    // Send token to client if new user
    if (isNewUser) {
      res.setHeader('X-User-Token', token);
      res.setHeader('X-New-User', 'true');
    }
    
    console.log(`🔒 Secure auth: User ${user.id}`);
    
    next();
  } catch (error) {
    console.error('❌ Secure auth error:', error);
    res.status(401).json({ 
      error: 'Authentication required',
      message: 'Secure authentication failed'
    });
  }
};

export default {
  getOrCreatePermanentUser,
  secureAuthMiddleware
};
