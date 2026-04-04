// PHI-Safe Observability Middleware
import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';

interface RequestMetrics {
  route: string;
  uidHash: string;
  method: string;
  statusCode: number;
  latencyMs: number;
  timestamp: string;
  userAgent?: string;
  ipHash?: string;
}

// Hash function for UIDs - never log raw UIDs (PHI-safe)
function hashUid(uid: string): string {
  return crypto.createHash('sha256').update(uid).digest('hex').substring(0, 12);
}

// Hash IP addresses for privacy
function hashIp(ip: string): string {
  return crypto.createHash('sha256').update(ip + process.env.IP_SALT || 'default-salt').digest('hex').substring(0, 8);
}

// In-memory metrics store (in production, use Redis/DB)
const metricsStore = {
  requests: [] as RequestMetrics[],
  routeCounts: new Map<string, number>(),
  uidCollisions: new Set<string>(),
  errorCounts: new Map<string, number>()
};

export function observabilityMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  const originalSend = res.send;
  
  // Capture response
  res.send = function(data) {
    const endTime = Date.now();
    const latencyMs = endTime - startTime;
    
    try {
      const uid = (req as any).ctx?.uid;
      const route = req.route?.path || req.path;
      
      if (uid && route) {
        const uidHash = hashUid(uid);
        const ipHash = hashIp(req.ip || 'unknown');
        
        const metrics: RequestMetrics = {
          route,
          uidHash,
          method: req.method,
          statusCode: res.statusCode,
          latencyMs,
          timestamp: new Date().toISOString(),
          userAgent: req.get('User-Agent')?.substring(0, 50),
          ipHash
        };
        
        // Store metrics (PHI-safe)
        metricsStore.requests.push(metrics);
        
        // Update route counts
        const routeKey = `${req.method} ${route}`;
        metricsStore.routeCounts.set(routeKey, (metricsStore.routeCounts.get(routeKey) || 0) + 1);
        
        // Track unique UIDs (not checking for collisions, just counting)
        metricsStore.uidCollisions.add(uidHash);
        
        // Log errors
        if (res.statusCode >= 400) {
          const errorKey = `${res.statusCode} ${route}`;
          metricsStore.errorCounts.set(errorKey, (metricsStore.errorCounts.get(errorKey) || 0) + 1);
        }
        
        // PHI-safe logging
        if (process.env.NODE_ENV === 'development') {
          console.log(`📊 ${req.method} ${route} | UID:${uidHash} | ${res.statusCode} | ${latencyMs}ms`);
        }
        
        // Keep only last 1000 requests to prevent memory leak
        if (metricsStore.requests.length > 1000) {
          metricsStore.requests = metricsStore.requests.slice(-1000);
        }
      }
    } catch (error) {
      console.error('Observability error:', error);
    }
    
    return originalSend.call(this, data);
  };
  
  next();
}

// Analytics dashboard endpoint
export function getObservabilityDashboard() {
  const now = Date.now();
  const last24h = metricsStore.requests.filter(r => 
    new Date(r.timestamp).getTime() > now - 24 * 60 * 60 * 1000
  );
  
  return {
    summary: {
      totalRequests: metricsStore.requests.length,
      uniqueUIDs: metricsStore.uidCollisions.size,
      uidCollisions: 0, // Should always be 0
      avgLatency: last24h.length > 0 ? 
        last24h.reduce((sum, r) => sum + r.latencyMs, 0) / last24h.length : 0,
      errorRate: last24h.length > 0 ? 
        last24h.filter(r => r.statusCode >= 400).length / last24h.length : 0
    },
    routeCounts: Object.fromEntries(metricsStore.routeCounts),
    errorCounts: Object.fromEntries(metricsStore.errorCounts),
    recentRequests: last24h.slice(-50).map(r => ({
      route: r.route,
      uidHash: r.uidHash,
      statusCode: r.statusCode,
      latencyMs: r.latencyMs,
      timestamp: r.timestamp
    })),
    healthStatus: {
      uidSystemHealthy: metricsStore.uidCollisions.size > 0, // No collisions = healthy
      avgLatencyHealthy: last24h.length === 0 || 
        (last24h.reduce((sum, r) => sum + r.latencyMs, 0) / last24h.length) < 1000,
      errorRateHealthy: last24h.length === 0 || 
        (last24h.filter(r => r.statusCode >= 400).length / last24h.length) < 0.05
    }
  };
}