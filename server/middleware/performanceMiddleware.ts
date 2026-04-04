// Phase 3: Performance middleware integration
import { Request, Response, NextFunction } from 'express';
import { PerformanceMonitor } from '../utils/performanceMonitor.js';
import { MemoryManager } from '../utils/memoryOptimization.js';

// Request timing middleware
export const requestTimer = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime.bigint();
  
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to milliseconds
    
    // Log slow requests
    if (duration > 1000) {
      console.warn(`[SLOW REQUEST] ${req.method} ${req.url} - ${duration.toFixed(2)}ms`);
    }
    
    // Store performance data
    const route = `${req.method} ${req.route?.path || req.url}`;
    PerformanceMonitor.timeExecution(route, () => Promise.resolve(duration));
  });
  
  return next();
};

// Memory monitoring middleware
export const memoryMonitor = (req: Request, res: Response, next: NextFunction) => {
  // Check memory usage periodically
  const memUsage = process.memoryUsage();
  const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
  
  // Warn if memory usage is high
  if (heapUsedMB > 512) { // > 512MB
    console.warn(`[HIGH MEMORY] Current heap usage: ${heapUsedMB.toFixed(2)}MB`);
    
    // Force garbage collection if available and memory is very high
    if (heapUsedMB > 1024) { // > 1GB
      MemoryManager.forceGC();
    }
  }
  
  return next();
};

// Response compression optimization
export const compressionOptimizer = (req: Request, res: Response, next: NextFunction) => {
  // Override res.json to log large responses without setting incorrect headers
  const originalJson = res.json;
  
  res.json = function(data: any) {
    const jsonString = JSON.stringify(data);
    
    // Log large responses but don't set compression headers without actual compression
    if (jsonString.length > 10000) { // > 10KB
      console.log(`[LARGE RESPONSE] ${req.url} - ${jsonString.length} bytes`);
    }
    
    return originalJson.call(this, data);
  };
  
  return next();
};

// Database connection pooling monitor
export const dbConnectionMonitor = (req: Request, res: Response, next: NextFunction) => {
  // Add database connection tracking
  (req as any).dbStartTime = Date.now();
  
  res.on('finish', () => {
    const dbDuration = Date.now() - (req as any).dbStartTime;
    
    if (dbDuration > 500) { // > 500ms
      console.warn(`[SLOW DB] ${req.url} - DB operations took ${dbDuration}ms`);
    }
  });
  
  return next();
};

// Cache optimization middleware
export const cacheOptimizer = (req: Request, res: Response, next: NextFunction) => {
  // Check if response can be cached
  const cacheKey = `${req.method}:${req.url}`;
  const cached = MemoryManager.getCache(cacheKey);
  
  if (cached && req.method === 'GET') {
    res.set('X-Cache', 'HIT');
    return res.json(cached);
  }
  
  // Override res.json to cache successful responses
  const originalJson = res.json;
  res.json = function(data: any) {
    // Cache GET responses with 200 status
    if (req.method === 'GET' && res.statusCode === 200) {
      MemoryManager.setCache(cacheKey, data, 300000); // 5 minutes
      this.set('X-Cache', 'MISS');
    }
    
    return originalJson.call(this, data);
  };
  
  return next();
};
