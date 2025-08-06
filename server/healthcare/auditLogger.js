/**
 * Healthcare Compliance Audit Logger
 * Provides comprehensive audit trails for healthcare data access
 */

export class HealthcareAuditLogger {
  static logDataAccess(userId, action, resourceType, resourceId, metadata = {}) {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      userId,
      action,
      resourceType,
      resourceId,
      metadata,
      sessionId: metadata.sessionId || 'unknown',
      ipAddress: metadata.ipAddress || 'unknown',
      userAgent: metadata.userAgent || 'unknown',
      complianceLevel: 'HEALTHCARE'
    };
    
    // Log to console (in production, this would go to secure audit database)
    console.log(`[HEALTHCARE AUDIT] ${JSON.stringify(auditEntry)}`);
    
    // Check for security violations
    if (action.includes('FAILED') || action.includes('VIOLATION')) {
      console.error(`[SECURITY ALERT] ${action} for user ${userId} on ${resourceType} ${resourceId}`);
    }
    
    return auditEntry;
  }
  
  static logSecurityEvent(eventType, details) {
    const securityEvent = {
      timestamp: new Date().toISOString(),
      eventType,
      details,
      severity: this.getSeverityLevel(eventType),
      complianceLevel: 'HEALTHCARE'
    };
    
    console.log(`[SECURITY EVENT] ${JSON.stringify(securityEvent)}`);
    
    if (securityEvent.severity === 'HIGH') {
      console.error(`[HIGH PRIORITY SECURITY EVENT] ${eventType}: ${JSON.stringify(details)}`);
    }
    
    return securityEvent;
  }
  
  static getSeverityLevel(eventType) {
    const highSeverityEvents = ['UNAUTHORIZED_ACCESS', 'DATA_BREACH', 'AUTHENTICATION_FAILURE'];
    const mediumSeverityEvents = ['SUSPICIOUS_ACTIVITY', 'RATE_LIMIT_EXCEEDED'];
    
    if (highSeverityEvents.includes(eventType)) return 'HIGH';
    if (mediumSeverityEvents.includes(eventType)) return 'MEDIUM';
    return 'LOW';
  }
}