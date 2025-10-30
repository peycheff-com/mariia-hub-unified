/**
 * Request Logger Middleware
 * Detailed logging of API requests and responses
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

export interface RequestInfo {
  requestId: string;
  method: string;
  url: string;
  ip: string;
  userAgent: string;
  userId?: string;
  startTime: number;
}

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  // Generate unique request ID
  const requestId = uuidv4();

  // Store request info
  const requestInfo: RequestInfo = {
    requestId,
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip || req.connection.remoteAddress || 'unknown',
    userAgent: req.get('User-Agent') || 'unknown',
    startTime: Date.now(),
  };

  // Attach request ID to request object for downstream use
  (req as any).requestId = requestId;

  // Log incoming request
  logger.info('Incoming request', {
    requestId,
    method: req.method,
    url: req.originalUrl || req.url,
    ip: requestInfo.ip,
    userAgent: requestInfo.userAgent,
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length'),
    referer: req.get('Referer'),
    query: req.query,
    // Only log body for small requests to avoid logging sensitive data
    body: req.body && Object.keys(req.body).length < 5 ? req.body : '[REDACTED_LARGE_BODY]',
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk: any, encoding?: any) {
    // Calculate response time
    const responseTime = Date.now() - requestInfo.startTime;

    // Get user ID if available
    const userId = (req as any).user?.id;

    // Log response
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
    logger[logLevel]('Request completed', {
      requestId,
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      responseSize: res.get('Content-Length') || 0,
      userId,
      ip: requestInfo.ip,
      // Log slow requests
      isSlow: responseTime > 1000,
      // Log error responses
      isError: res.statusCode >= 400,
      isClientError: res.statusCode >= 400 && res.statusCode < 500,
      isServerError: res.statusCode >= 500,
    });

    // Log additional details for errors
    if (res.statusCode >= 400) {
      logger.warn('Request error details', {
        requestId,
        statusCode: res.statusCode,
        method: req.method,
        url: req.originalUrl || req.url,
        userId,
        ip: requestInfo.ip,
        userAgent: requestInfo.userAgent,
        responseTime: `${responseTime}ms`,
      });
    }

    // Call original end function
    originalEnd.call(this, chunk, encoding);
  };

  // Handle response errors
  res.on('error', (error) => {
    logger.error('Response error', {
      requestId,
      error: error.message,
      method: req.method,
      url: req.originalUrl || req.url,
      userId: (req as any).user?.id,
    });
  });

  next();
};

/**
 * Middleware to track API usage metrics
 */
export const metricsTracker = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const requestId = (req as any).requestId;

  // Track request start
  logger.apiCall(req.method, req.path, (req as any).user?.id);

  // Override res.end to track completion
  const originalEnd = res.end;
  res.end = function(chunk: any, encoding?: any) {
    const duration = Date.now() - startTime;

    // Log performance metrics
    logger.performance(`${req.method} ${req.path}`, duration, {
      requestId,
      statusCode: res.statusCode,
      userId: (req as any).user?.id,
      method: req.method,
      path: req.path,
    });

    // Track business metrics
    if (req.path.startsWith('/api/v1/bookings')) {
      if (req.method === 'POST') {
        logger.business('booking_attempt', {
          requestId,
          userId: (req as any).user?.id,
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          success: res.statusCode < 400,
        });
      }
    }

    if (req.path.startsWith('/api/v1/payments')) {
      if (req.method === 'POST') {
        logger.business('payment_attempt', {
          requestId,
          userId: (req as any).user?.id,
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          success: res.statusCode < 400,
        });
      }
    }

    originalEnd.call(this, chunk, encoding);
  };

  next();
};

/**
 * Middleware to log security events
 */
export const securityLogger = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = (req as any).requestId;

  // Log suspicious activities
  if (req.path.includes('/admin') || req.path.includes('/api-keys')) {
    logger.security('Admin access attempt', {
      requestId,
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: (req as any).user?.id,
      hasAuth: !!req.headers.authorization,
    });
  }

  // Log authentication attempts
  if (req.path.includes('/auth/login') || req.path.includes('/auth/register')) {
    logger.security('Authentication attempt', {
      requestId,
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      email: req.body?.email,
    });
  }

  // Log failed requests
  res.on('finish', () => {
    if (res.statusCode === 401 || res.statusCode === 403) {
      logger.security('Access denied', {
        requestId,
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: (req as any).user?.id,
        statusCode: res.statusCode,
      });
    }
  });

  next();
};

export default {
  requestLogger,
  metricsTracker,
  securityLogger,
};