import { Context, Next } from 'hono';

import { logger } from '@/lib/logger';

import { ApiError } from '../api/base.service';

export interface ErrorHandlingConfig {
  logErrors: boolean;
  logStackTraces: boolean;
  sendErrorReports: boolean;
  includeStackTrace: boolean;
  customErrorHandlers?: Map<string, (error: Error, c: Context) => Response>;
}

export interface ErrorReport {
  error: {
    message: string;
    stack?: string;
    code?: string;
    name: string;
  };
  request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    query: Record<string, string>;
    body?: any;
    userAgent: string;
    ip: string;
  };
  timestamp: string;
  environment: string;
  userId?: string;
  sessionId?: string;
}

const defaultConfig: ErrorHandlingConfig = {
  logErrors: true,
  logStackTraces: process.env.NODE_ENV === 'development',
  sendErrorReports: process.env.NODE_ENV === 'production',
  includeStackTrace: process.env.NODE_ENV === 'development',
  customErrorHandlers: new Map()
};

export class ErrorMiddleware {
  /**
   * Global error handling middleware
   */
  static handleErrors(config: Partial<ErrorHandlingConfig> = {}) {
    const cfg = { ...defaultConfig, ...config };

    return async (c: Context, next: Next) => {
      try {
        await next();
      } catch (error) {
        const handledError = this.handleError(error, c, cfg);

        // Don't log if custom handler already handled it
        if (cfg.logErrors && !this.isCustomHandledError(error, cfg)) {
          this.logError(error, c, cfg);
        }

        // Send error report in production
        if (cfg.sendErrorReports && this.shouldSendErrorReport(error, cfg)) {
          await this.sendErrorReport(error, c, cfg);
        }

        return handledError;
      }
    };
  }

  /**
   * Handle 404 errors
   */
  static handleNotFound() {
    return async (c: Context, next: Next) => {
      await next();

    // If response status is still 404, handle it
    if (c.res.status === 404) {
      const error: ApiError = {
        message: 'Resource not found',
        code: 'NOT_FOUND',
        details: {
          path: c.req.path,
          method: c.req.method
        },
        timestamp: new Date().toISOString()
      };

      c.status(404);
      return c.json(error);
    }
    };
  }

  /**
   * Main error handling logic
   */
  private static handleError(
    error: any,
    c: Context,
    config: ErrorHandlingConfig
  ): Response {
    // Check for custom error handlers
    const customHandler = config.customErrorHandlers?.get(error.constructor.name);
    if (customHandler) {
      return customHandler(error, c);
    }

    // Handle known error types
    if (error instanceof ApiError) {
      const statusCode = this.getStatusCodeFromErrorCode(error.code);
      c.status(statusCode);
      return c.json({
        ...error,
        // Include stack trace in development
        ...(config.includeStackTrace && error.details?.stack && {
          details: {
            ...error.details,
            stack: error.details.stack
          }
        })
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationError: ApiError = {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: {
          errors: error.details || error.errors
        },
        timestamp: new Date().toISOString()
      };

      c.status(400);
      return c.json(validationError);
    }

    // Handle JWT/authorization errors
    if (error.name === 'JsonWebTokenError') {
      const authError: ApiError = {
        message: 'Invalid authentication token',
        code: 'INVALID_TOKEN',
        timestamp: new Date().toISOString()
      };

      c.status(401);
      return c.json(authError);
    }

    if (error.name === 'TokenExpiredError') {
      const authError: ApiError = {
        message: 'Authentication token has expired',
        code: 'TOKEN_EXPIRED',
        timestamp: new Date().toISOString()
      };

      c.status(401);
      return c.json(authError);
    }

    // Handle database errors
    if (error.code?.startsWith('PGRST')) {
      const dbError: ApiError = {
        message: 'Database operation failed',
        code: 'DATABASE_ERROR',
        details: {
          originalCode: error.code,
          originalMessage: error.message,
          details: error.details
        },
        timestamp: new Date().toISOString()
      };

      const statusCode = this.getDatabaseErrorStatusCode(error.code);
      c.status(statusCode);
      return c.json(dbError);
    }

    // Handle network errors
    if (error.name === 'NetworkError' || error.code === 'NETWORK_ERROR') {
      const networkError: ApiError = {
        message: 'Network connection failed',
        code: 'NETWORK_ERROR',
        timestamp: new Date().toISOString()
      };

      c.status(503);
      return c.json(networkError);
    }

    // Handle timeout errors
    if (error.name === 'TimeoutError' || error.code === 'TIMEOUT') {
      const timeoutError: ApiError = {
        message: 'Request timeout',
        code: 'TIMEOUT',
        timestamp: new Date().toISOString()
      };

      c.status(408);
      return c.json(timeoutError);
    }

    // Handle file upload errors
    if (error.name === 'MulterError') {
      const uploadError: ApiError = {
        message: this.getMulterErrorMessage(error),
        code: 'UPLOAD_ERROR',
        timestamp: new Date().toISOString()
      };

      c.status(400);
      return c.json(uploadError);
    }

    // Default error handling
    const defaultError: ApiError = {
      message: config.includeStackTrace && error.message ? error.message : 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: config.includeStackTrace ? {
        stack: error.stack,
        originalError: error
      } : undefined,
      timestamp: new Date().toISOString()
    };

    c.status(500);
    return c.json(defaultError);
  }

  /**
   * Check if error is handled by custom handler
   */
  private static isCustomHandledError(error: any, config: ErrorHandlingConfig): boolean {
    return config.customErrorHandlers?.has(error.constructor.name) || false;
  }

  /**
   * Log error to console and logging service
   */
  private static logError(error: any, c: Context, config: ErrorHandlingConfig): void {
    const logData = {
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        ...(config.logStackTraces && error.stack && { stack: error.stack })
      },
      request: {
        method: c.req.method,
        url: c.req.url,
        path: c.req.path,
        query: c.req.query(),
        headers: this.sanitizeHeaders(c.req.header()),
        userAgent: c.req.header('user-agent') || 'unknown',
        ip: this.getClientIp(c)
      }
    };

    // Log to console
    console.error('API Error:', logData);

    // Log to external logging service
    try {
      logger.error('API Error', error instanceof Error ? error : new Error(String(error)), {
        method: c.req.method,
        path: c.req.path,
        statusCode: c.res.status,
        userAgent: c.req.header('user-agent'),
        ip: this.getClientIp(c)
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  }

  /**
   * Send error report to monitoring service
   */
  private static async sendErrorReport(
    error: any,
    c: Context,
    config: ErrorHandlingConfig
  ): Promise<void> {
    try {
      const errorReport: ErrorReport = {
        error: {
          message: error.message,
          stack: error.stack,
          code: error.code,
          name: error.name
        },
        request: {
          method: c.req.method,
          url: c.req.url,
          headers: this.sanitizeHeaders(c.req.header()),
          query: c.req.query(),
          body: this.sanitizeRequestBody(await c.req.json().catch(() => null)),
          userAgent: c.req.header('user-agent') || 'unknown',
          ip: this.getClientIp(c)
        },
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'unknown',
        userId: c.req.header('x-user-id'),
        sessionId: c.req.header('x-session-id')
      };

      // Send to error reporting service (Sentry, etc.)
      // This would be implemented based on your error monitoring setup
      logger.error('Error Report', new Error(error.message), errorReport);
    } catch (reportError) {
      console.error('Failed to send error report:', reportError);
    }
  }

  /**
   * Determine if error should be reported
   */
  private static shouldSendErrorReport(error: any, config: ErrorHandlingConfig): boolean {
    // Don't report client errors (4xx)
    const statusCode = this.getStatusCodeFromErrorCode(error.code) || 500;
    if (statusCode >= 400 && statusCode < 500) {
      return false;
    }

    // Don't report specific error types
    const skipReportCodes = [
      'VALIDATION_ERROR',
      'RATE_LIMIT_EXCEEDED',
      'INVALID_TOKEN',
      'TOKEN_EXPIRED'
    ];

    return !skipReportCodes.includes(error.code);
  }

  /**
   * Get HTTP status code from error code
   */
  private static getStatusCodeFromErrorCode(code: string): number {
    const statusCodeMap: Record<string, number> = {
      'VALIDATION_ERROR': 400,
      'NOT_FOUND': 404,
      'UNAUTHORIZED': 401,
      'FORBIDDEN': 403,
      'RATE_LIMIT_EXCEEDED': 429,
      'INVALID_TOKEN': 401,
      'TOKEN_EXPIRED': 401,
      'NETWORK_ERROR': 503,
      'TIMEOUT': 408,
      'DATABASE_ERROR': 500,
      'UPLOAD_ERROR': 400,
      'INSUFFICIENT_PERMISSIONS': 403,
      'RESOURCE_CONFLICT': 409,
      'DEPENDENCY_UNAVAILABLE': 503
    };

    return statusCodeMap[code] || 500;
  }

  /**
   * Get status code for database errors
   */
  private static getDatabaseErrorStatusCode(pgCode: string): number {
    const dbStatusCodeMap: Record<string, number> = {
      'PGRST116': 404, // Not found
      'PGRST302': 400, // Data validation
      'PGRST301': 403, // Permission denied
      '23505': 409, // Unique violation
      '23503': 400, // Foreign key violation
      '23502': 400, // Not null violation
      '23514': 400, // Check violation
      '42501': 403, // Insufficient privilege
      '42601': 500, // Syntax error
      '42883': 500, // Undefined function
      '42P01': 404, // Undefined table
      '42703': 400, // Undefined column
      '08006': 503, // Connection failure
      '08001': 503, // SQL client unable to establish connection
      '08004': 503, // Server rejected the connection
      '08007': 503  // Transaction resolution unknown
    };

    return dbStatusCodeMap[pgCode] || 500;
  }

  /**
   * Get meaningful message for Multer errors
   */
  private static getMulterErrorMessage(error: any): string {
    const multerErrorMessages: Record<string, string> = {
      'LIMIT_FILE_SIZE': 'File too large',
      'LIMIT_FILE_COUNT': 'Too many files',
      'LIMIT_FIELD_KEY': 'Field name too long',
      'LIMIT_FIELD_VALUE': 'Field value too long',
      'LIMIT_FIELD_COUNT': 'Too many fields',
      'LIMIT_UNEXPECTED_FILE': 'Unexpected file field'
    };

    return multerErrorMessages[error.code] || 'File upload error';
  }

  /**
   * Sanitize headers for logging
   */
  private static sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
    const sensitiveHeaders = [
      'authorization',
      'cookie',
      'x-api-key',
      'x-auth-token',
      'password',
      'token'
    ];

    const sanitized: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
      if (sensitiveHeaders.includes(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Sanitize request body for logging
   */
  private static sanitizeRequestBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'apiKey',
      'authToken',
      'creditCard',
      'ssn',
      'socialSecurityNumber'
    ];

    const sanitized: any = {};
    for (const [key, value] of Object.entries(body)) {
      if (sensitiveFields.includes(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Get client IP address from request
   */
  private static getClientIp(c: Context): string {
    return (
      c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
      c.req.header('x-real-ip') ||
      c.req.header('cf-connecting-ip') ||
      c.req.header('x-client-ip') ||
      c.req.header('x-forwarded') ||
      c.req.header('forwarded-for') ||
      c.req.header('forwarded') ||
      'unknown'
    );
  }
}

// Custom error handler registration
export const registerCustomErrorHandler = (
  errorType: string,
  handler: (error: Error, c: Context) => Response
): void => {
  if (!defaultConfig.customErrorHandlers) {
    defaultConfig.customErrorHandlers = new Map();
  }
  defaultConfig.customErrorHandlers.set(errorType, handler);
};