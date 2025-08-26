import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

export class AppError extends Error implements ApiError {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Standard error response format
export const formatErrorResponse = (error: ApiError, includeStack: boolean = false) => {
  const response: any = {
    success: false,
    error: {
      message: error.message || 'An unexpected error occurred',
      code: error.code || 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    }
  };

  if (includeStack && process.env['NODE_ENV'] === 'development') {
    response.error.stack = error.stack;
  }

  return response;
};

// Centralized error handling middleware
export const errorHandler = (
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let { statusCode = 500, message, code } = error;

  // Don't log sensitive information in production
  if (process.env['NODE_ENV'] === 'production') {
    // Filter out sensitive errors
    if (statusCode === 500) {
      message = 'Internal server error';
      code = 'INTERNAL_ERROR';
    }
  } else {
    // Log full error details in development
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  }

  // Send error response
  res.status(statusCode).json(formatErrorResponse({
    message,
    code,
    statusCode
  } as ApiError, process.env['NODE_ENV'] === 'development'));
};

// Async wrapper for route handlers
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Common error generators
export const createValidationError = (message: string) => 
  new AppError(message, 400, 'VALIDATION_ERROR');

export const createAuthError = (message: string = 'Authentication required') => 
  new AppError(message, 401, 'AUTH_ERROR');

export const createForbiddenError = (message: string = 'Access forbidden') => 
  new AppError(message, 403, 'FORBIDDEN_ERROR');

export const createNotFoundError = (resource: string = 'Resource') => 
  new AppError(`${resource} not found`, 404, 'NOT_FOUND');

export const createConflictError = (message: string) => 
  new AppError(message, 409, 'CONFLICT_ERROR');

export const createRateLimitError = () => 
  new AppError('Too many requests', 429, 'RATE_LIMIT_ERROR');

export const createServerError = (message: string = 'Internal server error') => 
  new AppError(message, 500, 'SERVER_ERROR');