import { Router } from 'express';
import { requireRole, requireOwnData } from '../middleware/rbac.js';
import { auditMiddleware } from '../middleware/auditLogger.js';
import { unifiedAuthMiddleware } from '../auth/unifiedAuth.js';

const r = Router();

/**
 * Return the current authenticated user from JWT token.
 * If no valid token, this endpoint should still work to bootstrap anonymous users.
 */
r.get('/current', async (req, res) => {
  try {
    // Try to get token
    const token = req.header('Authorization')?.replace('Bearer ', '') || 
                  (req as any).cookies?.['access_token'];
    
    if (token) {
      // Verify token
      const jwt = await import('jsonwebtoken');
      const JWT_SECRET = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET || 'chakrai-dev-secret-change-in-production-256-bits-minimum';
      
      try {
        const decoded = jwt.default.verify(token, JWT_SECRET) as any;
        const userId = decoded.userId || parseInt(decoded.sub);
        
        if (userId) {
          return res.json({ 
            userId,
            email: decoded.email,
            displayName: decoded.email || 'User',
            isAuthenticated: true,
            ok: true 
          });
        }
      } catch (err) {
        console.log('Token verification failed:', err);
        // Token invalid, will create anonymous user below
      }
    }
    
    // No valid token - return unauthenticated
    // The client should call /api/auth/anonymous to get a token
    return res.status(401).json({ 
      error: 'Not authenticated',
      message: 'Please authenticate by calling /api/auth/anonymous'
    });
  } catch (error) {
    console.error('Error in /users/current:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Create/return an anonymous user id explicitly.
 */
r.post('/anonymous', (_req, res) => {
  const userId = Math.floor(Math.random() * 1e9);
  return res.json({ userId, anonymous: true, ok: true });
});

// ============================================================================
// HIPAA RBAC PROTECTED ROUTES
// ============================================================================

/**
 * Get user profile - RBAC: User can only access their own profile
 */
r.get('/profile/:userId', 
  unifiedAuthMiddleware, 
  requireOwnData(), 
  auditMiddleware('user_profile', 'read'),
  (req, res) => {
    const user = (req as any).auth?.user;
    res.json({ 
      userId: user.sub,
      email: user.email,
      roles: user.roles || ['user']
    });
  }
);

/**
 * Admin only: List all users
 */
r.get('/admin/all-users',
  unifiedAuthMiddleware,
  requireRole('admin'),
  auditMiddleware('user_list', 'read'),
  async (req, res) => {
    // TODO: Fetch all users from database
    res.json({ message: 'Admin access granted - would return all users' });
  }
);

/**
 * Therapist only: Get assigned clients
 */
r.get('/therapist/clients',
  unifiedAuthMiddleware,
  requireRole('therapist'),
  auditMiddleware('client_list', 'read'),
  async (req, res) => {
    // TODO: Fetch therapist's assigned clients from clientTherapistRelationships
    res.json({ message: 'Therapist access granted - would return assigned clients' });
  }
);

export default r;
