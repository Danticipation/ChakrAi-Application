import type { Request, Response, NextFunction } from "express";
import { db } from "../../db.js";
import { auditLogs } from "../../../shared/schema.js";

/**
 * HIPAA Compliance: Audit Logging Middleware
 * 
 * This middleware automatically logs all access to Protected Health Information (PHI).
 * REQUIRED by HIPAA for compliance.
 */

interface AuditLogParams {
  userId?: number;
  actorUserId?: number;
  actorType: 'user' | 'admin' | 'therapist' | 'system';
  action: 'read' | 'write' | 'update' | 'delete' | 'login' | 'logout' | 'export';
  resourceType: string;
  resourceId?: number;
  success?: boolean;
  failureReason?: string;
  dataSnapshot?: any;
  changeDetails?: any;
  accessReason?: string;
  complianceFlags?: string[];
}

/**
 * Log an audit event to the database
 */
export async function logAudit(
  req: Request,
  params: AuditLogParams
): Promise<void> {
  try {
    if (!db) {
      console.error('⚠️  Database not available for audit logging');
      return;
    }

    const ipAddress = (req.ip || req.socket.remoteAddress || 'unknown').replace('::ffff:', '');
    const userAgent = req.get('user-agent') || 'unknown';
    const sessionId = (req as any).auth?.token || req.cookies?.session_id || 'unknown';

    await db.insert(auditLogs).values({
      timestamp: new Date(),
      userId: params.userId,
      actorUserId: params.actorUserId,
      actorType: params.actorType,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      ipAddress,
      userAgent,
      sessionId,
      success: params.success ?? true,
      failureReason: params.failureReason,
      dataSnapshot: params.dataSnapshot,
      changeDetails: params.changeDetails,
      accessReason: params.accessReason,
      complianceFlags: params.complianceFlags,
    });

    console.log(`📋 AUDIT: ${params.actorType} ${params.action} ${params.resourceType}${params.resourceId ? ` #${params.resourceId}` : ''}`);
  } catch (error) {
    // CRITICAL: Audit logging failures must be visible but shouldn't break the app
    console.error('🚨 AUDIT LOG FAILURE:', error);
    console.error('   This is a HIPAA compliance issue - investigate immediately!');
  }
}

/**
 * Middleware to automatically log PHI access
 * Use this on routes that access protected health information
 */
export function auditMiddleware(
  resourceType: string,
  action: 'read' | 'write' | 'update' | 'delete'
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).auth?.user;
    
    // Log the access attempt
    const auditParams: AuditLogParams = {
      userId: user?.sub ? parseInt(user.sub) : undefined,
      actorUserId: user?.sub ? parseInt(user.sub) : undefined,
      actorType: user?.roles?.includes('admin') ? 'admin' 
                : user?.roles?.includes('therapist') ? 'therapist' 
                : 'user',
      action,
      resourceType,
      resourceId: req.params.id ? parseInt(req.params.id) : undefined,
      accessReason: 'user_request',
    };

    await logAudit(req, auditParams);
    next();
  };
}

/**
 * Helper to log failed access attempts (for security monitoring)
 */
export async function logFailedAccess(
  req: Request,
  resourceType: string,
  reason: string
): Promise<void> {
  const user = (req as any).auth?.user;
  
  await logAudit(req, {
    userId: user?.sub ? parseInt(user.sub) : undefined,
    actorUserId: user?.sub ? parseInt(user.sub) : undefined,
    actorType: 'user',
    action: 'read',
    resourceType,
    success: false,
    failureReason: reason,
    complianceFlags: ['unauthorized_access_attempt'],
  });
}
