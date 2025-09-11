// Phase 3: Health monitoring system
import { Request, Response } from 'express';
import { storage } from '../src/storage.js';
import { PerformanceMonitor } from '../utils/performanceMonitor.js';
import { MemoryManager } from '../utils/memoryOptimization.js';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    database: { status: string; responseTime?: number; error?: string };
    memory: { status: string; usage: NodeJS.MemoryUsage; percentage: number };
    performance: { status: string; metrics: any };
    external: { 
      openai: { status: string; responseTime?: number; error?: string };
      elevenlabs: { status: string; responseTime?: number; error?: string };
    };
  };
}

export class HealthChecker {
  
  static async getHealthStatus(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    const checks = {
      database: await this.checkDatabase(),
      memory: this.checkMemory(),
      performance: this.checkPerformance(),
      external: {
        openai: await this.checkOpenAI(),
        elevenlabs: await this.checkElevenLabs()
      }
    };
    
    // Determine overall status
    const hasUnhealthy = Object.values(checks).some(check => 
      typeof check === 'object' && 'status' in check && check.status === 'unhealthy'
    );
    const hasExternal = checks.external.openai.status === 'unhealthy' || 
                       checks.external.elevenlabs.status === 'unhealthy';
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (hasUnhealthy && !hasExternal) {
      status = 'unhealthy';
    } else if (hasUnhealthy || hasExternal) {
      status = 'degraded';
    }
    
    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env['npm_package_version'] || '1.0.0',
      environment: process.env['NODE_ENV'] || 'development',
      checks
    };
  }
  
  private static async checkDatabase(): Promise<{ status: string; responseTime?: number; error?: string }> {
    try {
      const start = Date.now();
      
      // Simple database connectivity test
      if ('getUserById' in storage) {
        await (storage as any).getUserById(1);
      }
      
      const responseTime = Date.now() - start;
      
      return {
        status: responseTime < 1000 ? 'healthy' : 'degraded',
        responseTime
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown database error'
      };
    }
  }
  
  private static checkMemory(): { status: string; usage: NodeJS.MemoryUsage; percentage: number } {
    const usage = process.memoryUsage();
    const heapPercentage = (usage.heapUsed / usage.heapTotal) * 100;
    
    let status = 'healthy';
    if (heapPercentage > 90) {
      status = 'unhealthy';
    } else if (heapPercentage > 75) {
      status = 'degraded';
    }
    
    return {
      status,
      usage,
      percentage: heapPercentage
    };
  }
  
  private static checkPerformance(): { status: string; metrics: any } {
    const stats = PerformanceMonitor.getStats();
    const cacheStats = MemoryManager.getCacheStats();
    
    // Check for consistently slow operations
    const slowOperations = Array.isArray(stats) ? 
      stats.filter(stat => stat.avgTime > 1000).length : 0;
    
    let status = 'healthy';
    if (slowOperations > 5) {
      status = 'degraded';
    }
    
    return {
      status,
      metrics: {
        operations: Array.isArray(stats) ? stats.length : 0,
        slowOperations,
        cacheSize: cacheStats.size,
        cacheUtilization: (cacheStats.size / cacheStats.maxSize) * 100
      }
    };
  }
  
  private static async checkOpenAI(): Promise<{ status: string; responseTime?: number; error?: string }> {
    if (!process.env['OPENAI_API_KEY']) {
      return { status: 'degraded', error: 'API key not configured' };
    }
    
    try {
      const start = Date.now();
      
      // Simple API connectivity test (minimal request)
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env['OPENAI_API_KEY']}`,
          'Content-Type': 'application/json'
        }
      });
      
      const responseTime = Date.now() - start;
      
      if (response.ok) {
        return {
          status: responseTime < 2000 ? 'healthy' : 'degraded',
          responseTime
        };
      } else {
        return {
          status: 'unhealthy',
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown OpenAI error'
      };
    }
  }
  
  private static async checkElevenLabs(): Promise<{ status: string; responseTime?: number; error?: string }> {
    if (!process.env['ELEVENLABS_API_KEY']) {
      return { status: 'degraded', error: 'API key not configured' };
    }
    
    try {
      const start = Date.now();
      
      // Simple API connectivity test
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        method: 'GET',
        headers: {
          'xi-api-key': process.env['ELEVENLABS_API_KEY']
        }
      });
      
      const responseTime = Date.now() - start;
      
      if (response.ok) {
        return {
          status: responseTime < 2000 ? 'healthy' : 'degraded',
          responseTime
        };
      } else {
        return {
          status: 'unhealthy',
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown ElevenLabs error'
      };
    }
  }
}

// Express health check endpoints
export const healthEndpoints = {
  // Simple health check
  simple: (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  },
  
  // Detailed health check
  detailed: async (req: Request, res: Response) => {
    try {
      const health = await HealthChecker.getHealthStatus();
      
      const statusCode = health.status === 'healthy' ? 200 : 
                        health.status === 'degraded' ? 200 : 503;
      
      res.status(statusCode).json(health);
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Health check failed'
      });
    }
  }
};