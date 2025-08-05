import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { storage } from '../storage.js';
import { 
  authLimiter, 
  validateRegistration, 
  validateLogin, 
  handleValidationErrors 
} from '../middleware/security.js';
import { asyncHandler, createConflictError, createAuthError } from '../utils/errorHandler.js';

const router = express.Router();

// JWT secret for authentication - MUST be set in production
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is required');
  process.exit(1);
}

// Middleware for authentication
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Registration endpoint
router.post('/register', 
  authLimiter,
  validateRegistration,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      throw createConflictError('User already exists with this email');
    }

    // Hash password with higher salt rounds for better security
    const saltRounds = 14;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await storage.createRegisteredUser({
      email,
      passwordHash,
      displayName: name,
      username: email.split('@')[0] + '_' + Date.now(),
      isAnonymous: false
    });

    // Generate JWT token with shorter expiry for better security
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' } // Reduced from 30d for better security
    );

    // Store auth token
    await storage.createAuthToken({
      userId: user.id,
      token: token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      deviceInfo: req.headers['user-agent'] || 'Unknown device'
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        isAnonymous: false
      },
      token
    });
  })
);

// Login endpoint
router.post('/login',
  authLimiter,
  validateLogin,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Get user by email
    const user = await storage.getUserByEmail(email);
    if (!user || !user.passwordHash) {
      throw createAuthError('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw createAuthError('Invalid email or password');
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Store auth token
    await storage.createAuthToken({
      userId: user.id,
      token: token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      deviceInfo: req.headers['user-agent'] || 'Unknown device'
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        isAnonymous: false
      },
      token
    });
  })
);

// Logout endpoint
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Invalidate the token (you could add token blacklisting here)
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Token verification endpoint
router.get('/verify', authenticateToken, async (req, res) => {
  try {
    // If we reach here, the token is valid
    const user = await storage.getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        isAnonymous: user.isAnonymous
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Migration endpoint for anonymous to registered user
router.post('/migrate', async (req, res) => {
  try {
    const { anonymousUserId, email, password, name } = req.body;

    // Check if email already exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const saltRounds = 14;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Update anonymous user to registered user
    const updatedUser = await storage.migrateAnonymousUser(anonymousUserId, {
      email,
      passwordHash,
      displayName: name,
      username: email.split('@')[0] + '_' + Date.now(),
      isAnonymous: false
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: updatedUser.id, email: updatedUser.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Store auth token
    await storage.createAuthToken({
      userId: updatedUser.id,
      token: token,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      deviceInfo: req.headers['user-agent'] || 'Unknown device'
    });

    res.json({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
        isAnonymous: false
      },
      token
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ error: 'Migration failed' });
  }
});

export default router;