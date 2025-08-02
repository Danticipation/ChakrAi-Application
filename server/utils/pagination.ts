// Phase 3: Performance optimization - Pagination utilities
import { Request } from 'express';

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export class PaginationHelper {
  static readonly DEFAULT_LIMIT = 20;
  static readonly MAX_LIMIT = 100;

  static parseParams(req: Request): PaginationParams {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(
      this.MAX_LIMIT, 
      Math.max(1, parseInt(req.query.limit as string) || this.DEFAULT_LIMIT)
    );
    const offset = (page - 1) * limit;
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = ((req.query.sortOrder as string)?.toLowerCase() === 'asc') ? 'asc' : 'desc';

    return { page, limit, offset, sortBy, sortOrder };
  }

  static getOffset(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  static createMeta(page: number, limit: number, total: number): PaginationMeta {
    const totalPages = Math.ceil(total / limit);
    return {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
  }

  static applyToQuery(baseQuery: any, params: PaginationParams) {
    return baseQuery
      .limit(params.limit)
      .offset(params.offset)
      .orderBy(params.sortBy, params.sortOrder);
  }
}

// Memory-efficient data processing
export class DataProcessor {
  // Process large datasets in chunks to prevent memory issues
  static async processInChunks<T, R>(
    data: T[], 
    processor: (chunk: T[]) => Promise<R[]>, 
    chunkSize: number = 100
  ): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      const chunkResults = await processor(chunk);
      results.push(...chunkResults);
      
      // Allow event loop to process other tasks
      if (i % (chunkSize * 10) === 0) {
        await new Promise(resolve => setImmediate(resolve));
      }
    }
    
    return results;
  }

  // Efficient array deduplication
  static deduplicateByProperty<T>(array: T[], property: keyof T): T[] {
    const seen = new Set();
    return array.filter(item => {
      const value = item[property];
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    });
  }

  // Memory-efficient sorting for large datasets
  static sortLargeArray<T>(array: T[], compareFn: (a: T, b: T) => number, chunkSize: number = 1000): T[] {
    if (array.length <= chunkSize) {
      return array.sort(compareFn);
    }

    // For very large arrays, implement external sorting if needed
    // For now, just use native sort with warning
    console.warn(`Sorting large array of ${array.length} items in memory`);
    return array.sort(compareFn);
  }
}