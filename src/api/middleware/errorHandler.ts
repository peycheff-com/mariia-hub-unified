/**
 * Global Error Handler Middleware
 * Centralized error handling for the API ecosystem
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface APIError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
  isOperational?: boolean;
}

export class CustomError extends Error implements APIError {
  public statusCode: number;
  public code: string;
  public details?: any;
  public isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: any,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends CustomError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class AuthenticationError extends CustomError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends CustomError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends CustomError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND_ERROR');
  }
}

export class ConflictError extends CustomError {
  constructor(message: string, details?: any) {
    super(message, 409, 'CONFLICT_ERROR', details);
  }
}

export class RateLimitError extends CustomError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}

export class DatabaseError extends CustomError {
  constructor(message: string = 'Database operation failed', details?: any) {
    super(message, 500, 'DATABASE_ERROR', details);
  }
}

export class ExternalServiceError extends CustomError {
  constructor(service: string, message: string = 'External service error') {
    super(`${service}: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR', { service });
  }
}

export class BusinessLogicError extends CustomError {
  constructor(message: string, details?: any) {
    super(message, 422, 'BUSINESS_LOGIC_ERROR', details);
  }
}

export const errorHandler = (
  error: APIError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Generate unique error ID for tracking
  const errorId = generateErrorId();
  const requestId = (req as any).requestId;

  // Determine if this is a known error type
  const statusCode = error.statusCode || 500;
  const code = error.code || 'INTERNAL_ERROR';
  const message = error.message || 'An unexpected error occurred';

  // Log the error
  const logData = {
    errorId,
    requestId,
    method: req.method,
    url: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id,
    statusCode,
    code,
    message: error.message,
    stack: error.stack,
    details: error.details,
    isOperational: error.isOperational,
  };

  if (statusCode >= 500) {
    logger.error('Server Error', logData);
  } else {
    logger.warn('Client Error', logData);
  }

  // Prepare error response
  const errorResponse: any = {
    error: true,
    code,
    message,
    timestamp: new Date().toISOString(),
    requestId,
    errorId,
    path: req.path,
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = error.stack;
  }

  // Include additional details if available
  if (error.details && Object.keys(error.details).length > 0) {
    errorResponse.details = error.details;
  }

  // Handle specific error types
  if (error.name === 'ValidationError') {
    errorResponse.errors = error.details;
  }

  if (error.name === 'CastError') {
    errorResponse.message = 'Invalid data format';
    errorResponse.code = 'INVALID_FORMAT';
  }

  if (error.name === 'JsonWebTokenError') {
    errorResponse.message = 'Invalid authentication token';
    errorResponse.code = 'INVALID_TOKEN';
    statusCode = 401;
  }

  if (error.name === 'TokenExpiredError') {
    errorResponse.message = 'Authentication token expired';
    errorResponse.code = 'TOKEN_EXPIRED';
    statusCode = 401;
  }

  if (error.name === 'MulterError') {
    if (error.message.includes('File too large')) {
      errorResponse.message = 'File size exceeds limit';
      errorResponse.code = 'FILE_TOO_LARGE';
    } else if (error.message.includes('Unexpected field')) {
      errorResponse.message = 'Invalid file field';
      errorResponse.code = 'INVALID_FILE_FIELD';
    } else {
      errorResponse.message = 'File upload error';
      errorResponse.code = 'FILE_UPLOAD_ERROR';
    }
    statusCode = 400;
  }

  // Supabase specific errors
  if (error.message?.includes('duplicate key')) {
    errorResponse.message = 'Resource already exists';
    errorResponse.code = 'DUPLICATE_RESOURCE';
    statusCode = 409;
  }

  if (error.message?.includes('foreign key constraint')) {
    errorResponse.message = 'Referenced resource does not exist';
    errorResponse.code = 'REFERENCE_NOT_FOUND';
    statusCode = 400;
  }

  if (error.message?.includes('check constraint')) {
    errorResponse.message = 'Data validation failed';
    errorResponse.code = 'CONSTRAINT_VIOLATION';
    statusCode = 400;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

/**
 * Async error wrapper for route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Generate unique error ID
 */
function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Handle unhandled promise rejections
 */
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Promise Rejection', {
    reason: reason?.message || reason,
    stack: reason?.stack,
    promise,
  });

  // In production, you might want to exit the process
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

/**
 * Handle uncaught exceptions
 */
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception', {
    message: error.message,
    stack: error.stack,
  });

  // Exit the process immediately
  process.exit(1);
});

export default errorHandler;