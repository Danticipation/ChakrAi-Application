// Phase 3: Memory optimization utilities for long-running processes
export class MemoryManager {
  private static readonly MAX_CACHE_SIZE = 100;
  private static cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  // Cache with TTL (Time To Live)
  static setCache(key: string, data: any, ttlMs: number = 300000): void { // 5 minutes default
    // Clear expired entries periodically
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      this.clearExpired();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }

  static getCache(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  static clearExpired(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  static clearAll(): void {
    this.cache.clear();
  }

  static getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE
    };
  }

  // Memory usage monitoring
  static getMemoryUsage(): NodeJS.MemoryUsage {
    return process.memoryUsage();
  }

  static logMemoryUsage(label: string = 'Memory'): void {
    const memory = this.getMemoryUsage();
    console.log(`[${label}] Memory Usage:`, {
      rss: `${Math.round(memory.rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memory.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memory.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(memory.external / 1024 / 1024)}MB`
    });
  }

  // Force garbage collection if available
  static forceGC(): boolean {
    if (typeof global !== 'undefined' && 'gc' in global && typeof global.gc === 'function') {
      global.gc();
      return true;
    }
    return false;
  }

  // Stream processing for large datasets
  static async processLargeArray<T, R>(
    array: T[],
    processor: (item: T) => Promise<R> | R,
    options: {
      batchSize?: number;
      concurrency?: number;
      onProgress?: (processed: number, total: number) => void;
    } = {}
  ): Promise<R[]> {
    const { batchSize = 100, concurrency = 5, onProgress } = options;
    const results: R[] = [];
    
    for (let i = 0; i < array.length; i += batchSize) {
      const batch = array.slice(i, i + batchSize);
      
      // Process batch with controlled concurrency
      const batchPromises = batch.map(async (item, index) => {
        // Limit concurrent operations
        if (index % concurrency === 0 && index > 0) {
          await new Promise(resolve => setImmediate(resolve));
        }
        return processor(item);
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Progress callback
      onProgress?.(results.length, array.length);
      
      // Allow event loop to breathe
      await new Promise(resolve => setImmediate(resolve));
    }
    
    return results;
  }
}

// Resource pool for managing expensive connections/objects
export class ResourcePool<T> {
  private available: T[] = [];
  private inUse = new Set<T>();
  private readonly maxSize: number;
  private readonly factory: () => Promise<T>;
  private readonly destroyer: (resource: T) => Promise<void>;

  constructor(
    maxSize: number,
    factory: () => Promise<T>,
    destroyer: (resource: T) => Promise<void> = async () => {}
  ) {
    this.maxSize = maxSize;
    this.factory = factory;
    this.destroyer = destroyer;
  }

  async acquire(): Promise<T> {
    if (this.available.length > 0) {
      const resource = this.available.pop()!;
      this.inUse.add(resource);
      return resource;
    }

    if (this.inUse.size < this.maxSize) {
      const resource = await this.factory();
      this.inUse.add(resource);
      return resource;
    }

    // Wait for a resource to become available
    return new Promise((resolve) => {
      const checkAvailable = () => {
        if (this.available.length > 0) {
          const resource = this.available.pop()!;
          this.inUse.add(resource);
          resolve(resource);
        } else {
          setTimeout(checkAvailable, 10);
        }
      };
      checkAvailable();
    });
  }

  async release(resource: T): Promise<void> {
    if (this.inUse.has(resource)) {
      this.inUse.delete(resource);
      this.available.push(resource);
    }
  }

  async destroy(): Promise<void> {
    const allResources = [...this.available, ...this.inUse];
    await Promise.all(allResources.map(resource => this.destroyer(resource)));
    this.available = [];
    this.inUse.clear();
  }

  getStats(): { available: number; inUse: number; total: number } {
    return {
      available: this.available.length,
      inUse: this.inUse.size,
      total: this.available.length + this.inUse.size
    };
  }
}