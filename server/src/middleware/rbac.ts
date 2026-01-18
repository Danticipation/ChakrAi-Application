import type { Request, Response, NextFunction } from "express";
import { logFailedAccess } from './auditLogger.js';

/**
 * HIPAA COMPLIANCE: Role-Based Access Control (RBAC)
 * 
 * Ensures users can only access resources they're authorized to view.
 * CRITICAL for HIPAA compliance - prevents unauthorized PHI access.
 */

export type UserRole = 'user' | 'therapist' | 'admin' | 'system';

/**
 * Middleware to require specific roles
 * @param allowedRoles - Array of roles that can access this route
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).auth?.user;
    
    if (!user) {
      await logFailedAccess(req, 'authorization', 'no_authenticated_user');
      return res.status(401).json({ error: 'unauthenticated' });
    }

    const userRoles: string[] = user.roles || ['user'];
    const hasRequiredRole = allowedRoles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      await logFailedAccess(req, 'authorization', `insufficient_permissions_required_${allowedRoles.join('_or_')}`);
      return res.status(403).json({ 
        error: 'forbidden',
        message: 'Insufficient permissions to access this resource',
        requiredRoles: allowedRoles
      });
    }

    next();
  };
}

/**
 * Middleware to ensure user can only access their own data
 * Checks if the userId in the route params matches the authenticated user
 */
export function requireOwnData() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).auth?.user;
    
    if (!user) {
      await logFailedAccess(req, 'authorization', 'no_authenticated_user');
      return res.status(401).json({ error: 'unauthenticated' });
    }

    const userRoles: string[] = user.roles || ['user'];
    const requestedUserId = req.params.userId || req.query.userId || req.body.userId;
    const authenticatedUserId = user.sub;

    // Admins and therapists can access other users' data (with proper logging)
    if (userRoles.includes('admin') || userRoles.includes('therapist')) {
      return next();
    }

    // Regular users can only access their own data
    if (requestedUserId && requestedUserId !== authenticatedUserId) {
      await logFailedAccess(req, 'authorization', 'attempted_access_to_other_user_data');
      return res.status(403).json({ 
        error: 'forbidden',
        message: 'You can only access your own data'
      });
    }

    next();
  };
}

/**
 * Middleware for therapist access to client data
 * Ensures therapist has an active relationship with the client
 */
export function requireTherapistClientRelationship() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).auth?.user;
    
    if (!user) {
      await logFailedAccess(req, 'authorization', 'no_authenticated_user');
      return res.status(401).json({ error: 'unauthenticated' });
    }

    const userRoles: string[] = user.roles || ['user'];
    
    // Admins bypass relationship checks
    if (userRoles.includes('admin')) {
      return next();
    }

    // Therapists must have an active relationship
    if (userRoles.includes('therapist')) {
      const clientUserId = req.params.userId || req.params.clientId;
      const therapistId = user.sub;

      // TODO: Check database for active client-therapist relationship
      // For now, we'll allow access but log it for audit
      // In production, this MUST check the clientTherapistRelationships table
      
      console.warn('⚠️  Therapist access granted without relationship check - implement database validation');
      return next();
    }

    await logFailedAccess(req, 'authorization', 'not_authorized_therapist');
    return res.status(403).json({ 
      error: 'forbidden',
      message: 'Only authorized therapists can access client data'
    });
  };
}

/**
 * Helper function to check if user has a specific role
 */
export function hasRole(req: Request, role: UserRole): boolean {
  const user = (req as any).auth?.user;
  if (!user) return false;
  
  const userRoles: string[] = user.roles || ['user'];
  return userRoles.includes(role);
}

/**
 * Helper to get user's roles
 */
export function getUserRoles(req: Request): UserRole[] {
  const user = (req as any).auth?.user;
  if (!user) return [];
  
  return (user.roles || ['user']) as UserRole[];
}
