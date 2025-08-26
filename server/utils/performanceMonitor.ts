// Phase 3: Performance monitoring and optimization
import { performance } from 'perf_hooks';

export class PerformanceMonitor {
  private static metrics = new Map<string, { 
    count: number; 
    totalTime: number; 
    minTime: number; 
    maxTime: number; 
    lastRun: number; 
  }>();

  // Time execution of functions
  static async timeExecution<T>(
    name: string, 
    fn: () => Promise<T> | T
  ): Promise<{ result: T; duration: number }> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;

    this.recordMetric(name, duration);

    return { result, duration };
  }

  // Record performance metrics
  private static recordMetric(name: string, duration: number): void {
    const existing = this.metrics.get(name);
    
    if (existing) {
      existing.count++;
      existing.totalTime += duration;
      existing.minTime = Math.min(existing.minTime, duration);
      existing.maxTime = Math.max(existing.maxTime, duration);
      existing.lastRun = Date.now();
    } else {
      this.metrics.set(name, {
        count: 1,
        totalTime: duration,
        minTime: duration,
        maxTime: duration,
        lastRun: Date.now()
      });
    }
  }

  // Get performance statistics
  static getStats(name?: string): any {
    if (name) {
      const metric = this.metrics.get(name);
      if (!metric) return null;

      return {
        name,
        count: metric.count,
        avgTime: metric.totalTime / metric.count,
        minTime: metric.minTime,
        maxTime: metric.maxTime,
        totalTime: metric.totalTime,
        lastRun: new Date(metric.lastRun).toISOString()
      };
    }

    // Return all metrics
    const allStats: any[] = [];
    this.metrics.forEach((metric, metricName) => {
      allStats.push({
        name: metricName,
        count: metric.count,
        avgTime: metric.totalTime / metric.count,
        minTime: metric.minTime,
        maxTime: metric.maxTime,
        totalTime: metric.totalTime,
        lastRun: new Date(metric.lastRun).toISOString()
      });
    });

    return allStats.sort((a, b) => b.totalTime - a.totalTime);
  }

  // Clear metrics
  static clearStats(name?: string): void {
    if (name) {
      this.metrics.delete(name);
    } else {
      this.metrics.clear();
    }
  }

  // Performance middleware for Express
  static middleware() {
    return (req: any, res: any, next: any) => {
      const start = performance.now();
      const route = `${req.method} ${req.route?.path || req.path}`;

      res.on('finish', () => {
        const duration = performance.now() - start;
        this.recordMetric(`HTTP:${route}`, duration);
        
        // Log slow requests
        if (duration > 1000) { // > 1 second
          console.warn(`[SLOW REQUEST] ${route} took ${duration.toFixed(2)}ms`);
        }
      });

      next();
    };
  }

  // Database query performance tracking
  static trackQuery<T>(
    query: string, 
    executor: () => Promise<T>
  ): Promise<T> {
    return this.timeExecution(`DB:${query.substring(0, 50)}`, executor)
      .then(({ result, duration }) => {
        if (duration > 500) { // > 500ms
          console.warn(`[SLOW QUERY] ${query.substring(0, 100)} took ${duration.toFixed(2)}ms`);
        }
        return result;
      });
  }

  // API call performance tracking
  static trackAPICall<T>(
    service: string,
    endpoint: string,
    executor: () => Promise<T>
  ): Promise<T> {
    return this.timeExecution(`API:${service}:${endpoint}`, executor)
      .then(({ result, duration }) => {
        if (duration > 2000) { // > 2 seconds
          console.warn(`[SLOW API] ${service}:${endpoint} took ${duration.toFixed(2)}ms`);
        }
        return result;
      });
  }
}

// Rate limiting with performance considerations
export class AdaptiveRateLimit {
  private static requestCounts = new Map<string, { count: number; resetTime: number }>();
  private static dynamicLimits = new Map<string, number>();

  static checkLimit(
    key: string, 
    baseLimit: number = 100, 
    windowMs: number = 60000
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    let record = this.requestCounts.get(key);
    
    // Reset if window expired
    if (!record || record.resetTime <= now) {
      record = { count: 0, resetTime: now + windowMs };
      this.requestCounts.set(key, record);
    }

    // Apply dynamic limit based on recent performance
    const dynamicLimit = this.getDynamicLimit(key, baseLimit);
    
    if (record.count >= dynamicLimit) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.resetTime
      };
    }

    record.count++;
    return {
      allowed: true,
      remaining: dynamicLimit - record.count,
      resetTime: record.resetTime
    };
  }

  private static getDynamicLimit(key: string, baseLimit: number): number {
    // Adjust limits based on system performance
    const systemLoad = this.getSystemLoad();
    
    if (systemLoad > 0.8) {
      return Math.floor(baseLimit * 0.5); // Reduce by 50% under high load
    } else if (systemLoad > 0.6) {
      return Math.floor(baseLimit * 0.75); // Reduce by 25% under medium load
    }
    
    return baseLimit;
  }

  private static getSystemLoad(): number {
    // Simple approximation based on memory usage
    const memory = process.memoryUsage();
    const usedMemory = memory.heapUsed;
    const totalMemory = memory.heapTotal;
    
    return usedMemory / totalMemory;
  }
}