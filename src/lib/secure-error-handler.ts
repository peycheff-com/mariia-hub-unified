/**
 * Secure Error Handling System
 *
 * Defense-in-depth error handling with:
 * - Information leakage prevention
 * - Secure error logging
 * - Client-safe error responses
 * - Error rate limiting
 * - Security event correlation
 */

import { SecurityMonitor } from './security';

export interface SecureErrorConfig {
  enableDetailedLogging: boolean;
  enableStackTrace: boolean;
  maxErrorMessages: number;
  errorRateLimit: number;
  sanitizeUserInput: boolean;
  logSecurityEvents: boolean;
  errorRetentionHours: number;
}

export const defaultSecureErrorConfig: SecureErrorConfig = {
  enableDetailedLogging: true,
  enableStackTrace: false, // Disabled in production
  maxErrorMessages: 10,
  errorRateLimit: 100, // Max 100 errors per hour per user
  sanitizeUserInput: true,
  logSecurityEvents: true,
  errorRetentionHours: 24
};

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  timestamp: number;
}

export interface SecureErrorResponse {
  message: string;
  code: string;
  details?: Record<string, any>;
  requestId?: string;
  timestamp: string;
}

export interface ErrorClassification {
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'validation' | 'authentication' | 'authorization' | 'business' | 'system' | 'security';
  isClientSafe: boolean;
  requiresInvestigation: boolean;
}

/**
 * Secure Error Handler
 */
export class SecureErrorHandler {
  private config: SecureErrorConfig;
  private errorCounts: Map<string, { count: number; lastReset: number }> = new Map();
  private sensitivePatterns: RegExp[];
  private errorMessages: Map<string, string> = new Map();

  constructor(config: SecureErrorConfig = defaultSecureErrorConfig) {
    this.config = config;
    this.initializeSensitivePatterns();
    this.initializeErrorMessages();
    this.initializeCleanup();
  }

  /**
   * Initialize patterns for detecting sensitive information
   */
  private initializeSensitivePatterns(): void {
    this.sensitivePatterns = [
      // Database connection strings
      /(?:postgres|mysql|mongodb):\/\/[^\s@]+@[^\s@]+\/[^\s]+/gi,
      // API keys and tokens
      /(?:api[_-]?key|token|secret|password)\s*[:=]\s*[^\s\n\r,}]+/gi,
      // Credit card numbers
      /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
      // Email addresses (optionally sensitive)
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      // File paths
      /(?:\/[^\s\n\r,}]+)+/g,
      // IP addresses
      /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
      // Stack traces (if enabled)
      /at\s+.*\(.*\):(\d+):\d+/g
    ];
  }

  /**
   * Initialize safe error messages
   */
  private initializeErrorMessages(): void {
    this.errorMessages.set('DATABASE_ERROR', 'Database operation failed. Please try again later.');
    this.errorMessages.set('NETWORK_ERROR', 'Network connection issue. Please check your connection and try again.');
    this.errorMessages.set('VALIDATION_ERROR', 'Invalid input provided. Please check your data and try again.');
    this.errorMessages.set('AUTHENTICATION_ERROR', 'Authentication failed. Please log in again.');
    this.errorMessages.set('AUTHORIZATION_ERROR', 'You do not have permission to perform this action.');
    this.errorMessages.set('RATE_LIMIT_ERROR', 'Too many requests. Please try again later.');
    this.errorMessages.set('SYSTEM_ERROR', 'An unexpected error occurred. Please try again later.');
    this.errorMessages.set('SECURITY_ERROR', 'Security validation failed. Request blocked.');
    this.errorMessages.set('PAYMENT_ERROR', 'Payment processing failed. Please try again or contact support.');
    this.errorMessages.set('EXTERNAL_SERVICE_ERROR', 'External service temporarily unavailable. Please try again later.');
  }

  /**
   * Initialize cleanup intervals
   */
  private initializeCleanup(): void {
    // Clean up error counts every hour
    setInterval(() => {
      this.cleanupErrorCounts();
    }, 60 * 60 * 1000);
  }

  /**
   * Handle and process errors securely
   */
  handleSecureError(
    error: Error | unknown,
    context: ErrorContext,
    originalError?: Error
  ): SecureErrorResponse {
    const errorId = this.generateErrorId();
    const classification = this.classifyError(error, context);

    // Check error rate limiting
    if (!this.checkErrorRateLimit(context.userId || context.sessionId || 'anonymous')) {
      return {
        message: 'Rate limit exceeded. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        requestId: context.requestId,
        timestamp: new Date().toISOString()
      };
    }

    // Log the error securely
    this.logErrorSecurely(error, context, classification, errorId, originalError);

    // Create safe error response
    const safeMessage = classification.isClientSafe
      ? this.getClientSafeMessage(error, classification)
      : this.getGenericErrorMessage(classification);

    return {
      message: safeMessage,
      code: classification.category.toUpperCase(),
      details: classification.isClientSafe ? this.getSafeErrorDetails(error, classification) : undefined,
      requestId: context.requestId || errorId,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Classify error for appropriate handling
   */
  private classifyError(error: Error | unknown, context: ErrorContext): ErrorClassification {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = error instanceof Error && 'code' in error ? String(error.code) : '';

    // Security-related errors
    if (this.isSecurityError(error, context)) {
      return {
        severity: 'high',
        category: 'security',
        isClientSafe: false,
        requiresInvestigation: true
      };
    }

    // Authentication errors
    if (this.isAuthenticationError(error, context)) {
      return {
        severity: 'medium',
        category: 'authentication',
        isClientSafe: true,
        requiresInvestigation: false
      };
    }

    // Authorization errors
    if (this.isAuthorizationError(error, context)) {
      return {
        severity: 'medium',
        category: 'authorization',
        isClientSafe: true,
        requiresInvestigation: false
      };
    }

    // Validation errors
    if (this.isValidationError(error, context)) {
      return {
        severity: 'low',
        category: 'validation',
        isClientSafe: true,
        requiresInvestigation: false
      };
    }

    // Database errors
    if (this.isDatabaseError(error, context)) {
      return {
        severity: 'medium',
        category: 'system',
        isClientSafe: false,
        requiresInvestigation: true
      };
    }

    // Network errors
    if (this.isNetworkError(error, context)) {
      return {
        severity: 'low',
        category: 'system',
        isClientSafe: true,
        requiresInvestigation: false
      };
    }

    // Default classification
    return {
      severity: context.statusCode && context.statusCode >= 500 ? 'high' : 'medium',
      category: 'system',
      isClientSafe: false,
      requiresInvestigation: context.statusCode && context.statusCode >= 500
    };
  }

  /**
   * Check if error is security-related
   */
  private isSecurityError(error: Error | unknown, context: ErrorContext): boolean {
    const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
    const securityKeywords = [
      'unauthorized', 'forbidden', 'csrf', 'xss', 'injection', 'security',
      'blocked', 'suspicious', 'invalid signature', 'webhook', 'authentication'
    ];

    return securityKeywords.some(keyword => errorMessage.includes(keyword)) ||
           context.statusCode === 403 ||
           context.statusCode === 401;
  }

  /**
   * Check if error is authentication-related
   */
  private isAuthenticationError(error: Error | unknown, context: ErrorContext): boolean {
    const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
    const authKeywords = [
      'login', 'password', 'credential', 'token expired', 'invalid token',
      'authentication', 'unauthenticated'
    ];

    return authKeywords.some(keyword => errorMessage.includes(keyword)) ||
           context.statusCode === 401;
  }

  /**
   * Check if error is authorization-related
   */
  private isAuthorizationError(error: Error | unknown, context: ErrorContext): boolean {
    const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
    const authzKeywords = [
      'permission', 'access denied', 'forbidden', 'unauthorized',
      'role', 'privilege', 'access control'
    ];

    return authzKeywords.some(keyword => errorMessage.includes(keyword)) ||
           context.statusCode === 403;
  }

  /**
   * Check if error is validation-related
   */
  private isValidationError(error: Error | unknown, context: ErrorContext): boolean {
    const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
    const validationKeywords = [
      'invalid', 'required', 'missing', 'format', 'validation',
      'schema', 'type', 'constraint'
    ];

    return validationKeywords.some(keyword => errorMessage.includes(keyword)) ||
           context.statusCode === 400 ||
           context.statusCode === 422;
  }

  /**
   * Check if error is database-related
   */
  private isDatabaseError(error: Error | unknown, context: ErrorContext): boolean {
    const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
    const dbKeywords = [
      'database', 'sql', 'connection', 'timeout', 'constraint',
      'duplicate', 'foreign key', 'migration'
    ];

    return dbKeywords.some(keyword => errorMessage.includes(keyword));
  }

  /**
   * Check if error is network-related
   */
  private isNetworkError(error: Error | unknown, context: ErrorContext): boolean {
    const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
    const networkKeywords = [
      'network', 'connection', 'timeout', 'fetch', 'request',
      'endpoint', 'service unavailable'
    ];

    return networkKeywords.some(keyword => errorMessage.includes(keyword)) ||
           context.statusCode === 503 ||
           context.statusCode === 504;
  }

  /**
   * Log error securely without exposing sensitive information
   */
  private logErrorSecurely(
    error: Error | unknown,
    context: ErrorContext,
    classification: ErrorClassification,
    errorId: string,
    originalError?: Error
  ): void {
    const sanitizedError = this.sanitizeError(error);
    const logEntry = {
      errorId,
      timestamp: new Date().toISOString(),
      classification,
      context: {
        userId: context.userId,
        sessionId: context.sessionId,
        requestId: context.requestId,
        endpoint: context.endpoint,
        method: context.method,
        statusCode: context.statusCode
      },
      error: {
        message: sanitizedError.message,
        name: sanitizedError.name,
        code: sanitizedError.code,
        stack: this.config.enableStackTrace ? sanitizedError.stack : undefined
      }
    };

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('Secure Error:', logEntry);
    }

    // Log security events if required
    if (this.config.logSecurityEvents && classification.category === 'security') {
      SecurityMonitor.getInstance().logSecurityEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: classification.severity,
        details: {
          activity: 'security_error',
          errorId,
          message: sanitizedError.message,
          endpoint: context.endpoint,
          userId: context.userId
        }
      });
    }

    // Log to external monitoring service (implementation would go here)
    if (import.meta.env.PROD && this.config.enableDetailedLogging) {
      this.sendToMonitoringService(logEntry);
    }
  }

  /**
   * Sanitize error to remove sensitive information
   */
  private sanitizeError(error: Error | unknown): Error {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    let sanitizedMessage = errorObj.message;

    // Remove sensitive patterns
    for (const pattern of this.sensitivePatterns) {
      sanitizedMessage = sanitizedMessage.replace(pattern, '[REDACTED]');
    }

    // Truncate very long messages
    if (sanitizedMessage.length > 1000) {
      sanitizedMessage = sanitizedMessage.substring(0, 1000) + '... [TRUNCATED]';
    }

    // Create sanitized error
    const sanitizedError = new Error(sanitizedMessage);
    sanitizedError.name = errorObj.name;

    if ('code' in errorObj) {
      (sanitizedError as any).code = errorObj.code;
    }

    return sanitizedError;
  }

  /**
   * Get client-safe error message
   */
  private getClientSafeMessage(error: Error | unknown, classification: ErrorClassification): string {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const messageKey = `${classification.category.toUpperCase()}_ERROR`;

    return this.errorMessages.get(messageKey) || errorMessage;
  }

  /**
   * Get generic error message for non-client-safe errors
   */
  private getGenericErrorMessage(classification: ErrorClassification): string {
    switch (classification.category) {
      case 'security':
        return 'Security validation failed. Request blocked.';
      case 'authentication':
        return 'Authentication required. Please log in.';
      case 'authorization':
        return 'Access denied. You do not have permission to perform this action.';
      case 'validation':
        return 'Invalid input provided. Please check your data and try again.';
      default:
        return 'An error occurred. Please try again later.';
    }
  }

  /**
   * Get safe error details (sanitized)
   */
  private getSafeErrorDetails(error: Error | unknown, classification: ErrorClassification): Record<string, any> {
    const details: Record<string, any> = {};

    if (classification.category === 'validation' && error instanceof Error) {
      // Extract validation field names from error message (if available)
      const fieldMatches = error.message.match(/(\w+)\s+(?:is|required|invalid|missing)/gi);
      if (fieldMatches) {
        details.fields = fieldMatches.map(match => match.split(' ')[0]);
      }
    }

    // Add generic, safe details
    details.category = classification.category;
    details.severity = classification.severity;

    return details;
  }

  /**
   * Check error rate limiting
   */
  private checkErrorRateLimit(identifier: string): boolean {
    const now = Date.now();
    const key = `error_rate_${identifier}`;

    if (!this.errorCounts.has(key)) {
      this.errorCounts.set(key, { count: 0, lastReset: now });
    }

    const rateData = this.errorCounts.get(key)!;

    // Reset counter if it's been more than an hour
    if (now - rateData.lastReset > 60 * 60 * 1000) {
      rateData.count = 0;
      rateData.lastReset = now;
    }

    // Check if rate limit exceeded
    if (rateData.count >= this.config.errorRateLimit) {
      SecurityMonitor.getInstance().logSecurityEvent({
        type: 'RATE_LIMIT',
        severity: 'medium',
        details: {
          activity: 'error_rate_limit_exceeded',
          identifier,
          count: rateData.count,
          limit: this.config.errorRateLimit
        }
      });
      return false;
    }

    rateData.count++;
    return true;
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Send error to monitoring service
   */
  private sendToMonitoringService(logEntry: any): void {
    // Implementation would send to services like Sentry, DataDog, etc.
    // For now, just log to console
    console.log('Monitoring Service:', logEntry);
  }

  /**
   * Clean up old error counts
   */
  private cleanupErrorCounts(): void {
    const now = Date.now();
    const cutoff = now - this.config.errorRetentionHours * 60 * 60 * 1000;

    for (const [key, data] of this.errorCounts.entries()) {
      if (now - data.lastReset > cutoff) {
        this.errorCounts.delete(key);
      }
    }
  }

  /**
   * Get error metrics
   */
  getErrorMetrics(): {
    activeErrorCounters: number;
    totalErrorsTracked: number;
    averageErrorsPerHour: number;
  } {
    const totalErrors = Array.from(this.errorCounts.values())
      .reduce((sum, data) => sum + data.count, 0);

    return {
      activeErrorCounters: this.errorCounts.size,
      totalErrorsTracked: totalErrors,
      averageErrorsPerHour: this.errorCounts.size > 0 ? totalErrors / this.errorCounts.size : 0
    };
  }

  /**
   * Reset error counter for specific identifier
   */
  resetErrorCounter(identifier: string): void {
    const key = `error_rate_${identifier}`;
    this.errorCounts.delete(key);
  }
}

// Export singleton instance
export const secureErrorHandler = new SecureErrorHandler();

// Export utilities
export const handleSecureError = (
  error: Error | unknown,
  context: ErrorContext,
  originalError?: Error
) => secureErrorHandler.handleSecureError(error, context, originalError);

export const classifyError = (error: Error | unknown, context: ErrorContext) =>
  secureErrorHandler.classifyError(error, context);

export const resetErrorCounter = (identifier: string) =>
  secureErrorHandler.resetErrorCounter(identifier);

// Export types
export type { SecureErrorResponse, ErrorContext, ErrorClassification };