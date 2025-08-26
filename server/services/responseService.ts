// Phase 2: Centralized response handling service
import { Response } from 'express';
import { PaginationParams, PaginationMeta, PaginationHelper } from '../utils/pagination.js';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: PaginationMeta;
  timestamp: string;
}

export class ResponseService {
  
  // Send successful response
  static sendSuccess<T>(
    res: Response, 
    data?: T, 
    message?: string, 
    statusCode: number = 200
  ): void {
    const response: ApiResponse<T> = {
      success: true,
      timestamp: new Date().toISOString()
    };
    
    if (data !== undefined) {
      response.data = data;
    }
    
    if (message !== undefined) {
      response.message = message;
    }
    
    res.status(statusCode).json(response);
  }
  
  // Send error response
  static sendError(
    res: Response, 
    message: string, 
    statusCode: number = 400,
    errorCode?: string
  ): void {
    const response: ApiResponse = {
      success: false,
      error: message,
      timestamp: new Date().toISOString()
    };
    
    if (errorCode) {
      (response as any).errorCode = errorCode;
    }
    
    res.status(statusCode).json(response);
  }
  
  // Send paginated response
  static sendPaginated<T>(
    res: Response,
    data: T[],
    pagination: PaginationParams,
    total: number,
    message?: string
  ): void {
    const meta = PaginationHelper.createMeta(pagination.page, pagination.limit, total);
    
    const response: ApiResponse<T[]> = {
      success: true,
      data,
      meta,
      timestamp: new Date().toISOString()
    };
    
    if (message !== undefined) {
      response.message = message;
    }
    
    res.json(response);
  }
  
  // Send validation error
  static sendValidationError(
    res: Response, 
    errors: Record<string, string[]>
  ): void {
    const response: ApiResponse = {
      success: false,
      error: 'Validation failed',
      timestamp: new Date().toISOString(),
      ...(errors && { validationErrors: errors })
    };
    
    res.status(422).json(response);
  }
  
  // Send not found error
  static sendNotFound(res: Response, resource: string = 'Resource'): void {
    this.sendError(res, `${resource} not found`, 404, 'NOT_FOUND');
  }
  
  // Send unauthorized error
  static sendUnauthorized(res: Response, message: string = 'Unauthorized'): void {
    this.sendError(res, message, 401, 'UNAUTHORIZED');
  }
  
  // Send forbidden error
  static sendForbidden(res: Response, message: string = 'Forbidden'): void {
    this.sendError(res, message, 403, 'FORBIDDEN');
  }
  
  // Send internal server error
  static sendInternalError(res: Response, message: string = 'Internal server error'): void {
    this.sendError(res, message, 500, 'INTERNAL_ERROR');
  }
}