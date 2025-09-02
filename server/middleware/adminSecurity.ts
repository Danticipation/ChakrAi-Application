// Production Security Middleware for Admin/Debug Routes
import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// Rate limiting for admin endpoints
const adminAttempts = new Map<string, { count: number, lastAttempt: number }>();

function getClientId(req: Request): string {
  // Use IP + User-Agent hash for rate limiting
  const ip = req.ip || 'unknown';
  const ua = req.get('User-Agent') || 'unknown';
  return crypto.createHash('sha256').update(ip + ua).digest('hex').substring(0, 16);
}

export function adminSecurityMiddleware(req: Request, res: Response, next: NextFunction) {
  const clientId = getClientId(req);
  const now = Date.now();
  
  // Rate limiting: max 10 attempts per hour
  const attempts = adminAttempts.get(clientId);
  if (attempts && attempts.count >= 10 && now - attempts.lastAttempt < 60 * 60 * 1000) {
    console.warn(`🚨 Admin rate limit exceeded for client: ${clientId}`);
    return res.status(429).json({ 
      error: 'rate_limit_exceeded',
      message: 'Too many admin attempts. Try again later.'
    });
  }
  
  // Check admin secret
  const adminSecret = req.headers['x-admin-secret'] as string;
  const validSecret = process.env.ADMIN_HEALTH_SECRET;
  
  if (!adminSecret || !validSecret || adminSecret !== validSecret) {
    // Log failed attempt
    const currentAttempts = adminAttempts.get(clientId) || { count: 0, lastAttempt: 0 };
    adminAttempts.set(clientId, {
      count: currentAttempts.count + 1,
      lastAttempt: now
    });
    
    console.warn(`🚨 Unauthorized admin access attempt from: ${clientId}`);
    return res.status(401).json({ 
      error: 'unauthorized',
      message: 'Invalid admin credentials'
    });
  }
  
  // Success - reset attempts
  adminAttempts.delete(clientId);
  
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  return next();
}

export function debugSecurityMiddleware(req: Request, res: Response, next: NextFunction) {
  // In production, debug routes should be completely disabled
  if (process.env.NODE_ENV === 'production') {
    console.warn(`🚨 Debug route accessed in production: ${req.path}`);
    return res.status(404).json({ 
      error: 'not_found',
      message: 'Debug endpoints disabled in production'
    });
  }
  
  // In development, still require some basic protection
  const clientId = getClientId(req);
  const attempts = adminAttempts.get(clientId) || { count: 0, lastAttempt: 0 };
  
  if (attempts.count > 50) { // Higher limit for debug in dev
    return res.status(429).json({ 
      error: 'rate_limit_exceeded',
      message: 'Too many debug requests'
    });
  }
  
  adminAttempts.set(clientId, {
    count: attempts.count + 1,
    lastAttempt: Date.now()
  });
  
  return next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const role = (req as any).role ?? (req.user as any)?.role;
    if (role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    return next();
  } catch (e: unknown) {
    const err = e instanceof Error ? e : new Error(String(e));
    return next(err);
  }
}

// Cleanup old rate limit entries
setInterval(() => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [clientId, data] of adminAttempts.entries()) {
    if (data.lastAttempt < oneHourAgo) {
      adminAttempts.delete(clientId);
    }
  }
}, 15 * 60 * 1000); // Cleanup every 15 minutes
