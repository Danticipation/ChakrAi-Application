// Phase 3: Continuous health monitoring
import { MemoryManager } from './memoryOptimization.js';
import { PerformanceMonitor } from './performanceMonitor.js';

export class HealthMonitor {
  private static instance: HealthMonitor;
  private intervalId: NodeJS.Timeout | null = null;
  private readonly checkInterval = 30000; // 30 seconds
  
  private constructor() {}
  
  static getInstance(): HealthMonitor {
    if (!this.instance) {
      this.instance = new HealthMonitor();
    }
    return this.instance;
  }
  
  start(): void {
    if (this.intervalId) {
      console.log('[HealthMonitor] Already running');
      return;
    }
    
    console.log('[HealthMonitor] Starting continuous monitoring...');
    
    this.intervalId = setInterval(() => {
      this.performHealthCheck();
    }, this.checkInterval);
    
    // Run initial check
    this.performHealthCheck();
  }
  
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[HealthMonitor] Stopped');
    }
  }
  
  private performHealthCheck(): void {
    const timestamp = new Date().toISOString();
    
    // Memory check
    const memory = process.memoryUsage();
    const heapUsedMB = memory.heapUsed / 1024 / 1024;
    
    if (heapUsedMB > 1024) { // > 1GB
      console.warn(`[HealthMonitor] HIGH MEMORY: ${heapUsedMB.toFixed(2)}MB at ${timestamp}`);
      this.handleHighMemory();
    }
    
    // Cache cleanup
    MemoryManager.clearExpired();
    
    // Performance check
    const perfStats = PerformanceMonitor.getStats();
    if (Array.isArray(perfStats)) {
      const slowOps = perfStats.filter(stat => stat.avgTime > 2000);
      if (slowOps.length > 0) {
        console.warn(`[HealthMonitor] SLOW OPERATIONS detected: ${slowOps.length} operations > 2s`);
      }
    }
    
    // Log periodic status
    if (Math.random() < 0.1) { // 10% chance for status log
      console.log(`[HealthMonitor] Status OK - Heap: ${heapUsedMB.toFixed(1)}MB, Uptime: ${process.uptime().toFixed(0)}s`);
    }
  }
  
  private handleHighMemory(): void {
    console.log('[HealthMonitor] Attempting memory optimization...');
    
    // Force garbage collection
    const gcResult = MemoryManager.forceGC();
    if (gcResult) {
      console.log('[HealthMonitor] Garbage collection forced');
    }
    
    // Clear performance stats to free memory
    PerformanceMonitor.clearStats();
    
    // Clear cache aggressively
    MemoryManager.clearAll();
    
    console.log('[HealthMonitor] Memory optimization completed');
  }
  
  // Get current health status
  getStatus(): any {
    const memory = process.memoryUsage();
    const cacheStats = MemoryManager.getCacheStats();
    const perfStats = PerformanceMonitor.getStats();
    
    return {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        heapUsed: memory.heapUsed,
        heapTotal: memory.heapTotal,
        external: memory.external,
        rss: memory.rss
      },
      cache: cacheStats,
      performance: {
        totalOperations: Array.isArray(perfStats) ? perfStats.length : 0,
        slowOperations: Array.isArray(perfStats) ? 
          perfStats.filter(stat => stat.avgTime > 1000).length : 0
      },
      monitoring: {
        running: this.intervalId !== null,
        checkInterval: this.checkInterval
      }
    };
  }
}