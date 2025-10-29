/**
 * API Security Validation System
 *
 * Comprehensive API security validation with:
 * - Request/response validation
 * - Rate limiting and abuse detection
 * - Input sanitization and validation
 * - Authentication and authorization checks
 * - Security monitoring and alerting
 */

import { z, ZodSchema, ZodError } from 'zod';

import { SecurityMonitor } from './security';

export interface ApiSecurityConfig {
  enableRateLimiting: boolean;
  maxRequestsPerMinute: number;
  maxRequestsPerHour: number;
  enableInputValidation: boolean;
  enableOutputSanitization: boolean;
  enableSecurityLogging: boolean;
  blockedCountries: string[];
  allowedOrigins: string[];
  maxRequestSize: number;
}

export const defaultApiSecurityConfig: ApiSecurityConfig = {
  enableRateLimiting: true,
  maxRequestsPerMinute: 100,
  maxRequestsPerHour: 1000,
  enableInputValidation: true,
  enableOutputSanitization: true,
  enableSecurityLogging: true,
  blockedCountries: ['CN', 'RU', 'KP'], // Example blocked countries
  allowedOrigins: [
    'https://mariia-hub.pl',
    'https://www.mariia-hub.pl',
    'https://app.mariia-hub.pl'
  ],
  maxRequestSize: 10 * 1024 * 1024 // 10MB
};

export interface SecurityContext {
  userId?: string;
  sessionId?: string;
  ipAddress: string;
  userAgent: string;
  origin: string;
  requestId: string;
  timestamp: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  securityScore: number;
  sanitizedData?: any;
}

export interface RateLimitResult {
  isAllowed: boolean;
  remainingRequests: number;
  resetTime: number;
  retryAfter?: number;
}

/**
 * API Security Validator
 */
export class ApiSecurityValidator {
  private config: ApiSecurityConfig;
  private rateLimitStore: Map<string, { requests: number[]; lastReset: number }> = new Map();
  private blockedIPs: Set<string> = new Set();
  private suspiciousPatterns: Map<string, number> = new Map();

  constructor(config: ApiSecurityConfig = defaultApiSecurityConfig) {
    this.config = config;
    this.initializeCleanup();
  }

  /**
   * Initialize cleanup intervals
   */
  private initializeCleanup() {
    // Clean up rate limit data every hour
    setInterval(() => {
      this.cleanupRateLimitData();
    }, 60 * 60 * 1000);

    // Clean up suspicious patterns every 6 hours
    setInterval(() => {
      this.cleanupSuspiciousPatterns();
    }, 6 * 60 * 60 * 1000);
  }

  /**
   * Comprehensive API request validation
   */
  validateApiRequest(
    request: Request,
    context: SecurityContext,
    validationSchema?: ZodSchema,
    customValidators?: Array<(data: any) => ValidationResult>
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let securityScore = 100;

    // 1. Origin validation
    const originValidation = this.validateOrigin(context.origin);
    if (!originValidation.isValid) {
      errors.push(...originValidation.errors);
      securityScore -= 30;
    }

    // 2. IP-based validation
    const ipValidation = this.validateIPAddress(context.ipAddress);
    if (!ipValidation.isValid) {
      errors.push(...ipValidation.errors);
      securityScore -= 40;
    }
    warnings.push(...ipValidation.warnings);

    // 3. Rate limiting check
    if (this.config.enableRateLimiting) {
      const rateLimitResult = this.checkRateLimit(context);
      if (!rateLimitResult.isAllowed) {
        errors.push(`Rate limit exceeded. Retry after ${rateLimitResult.retryAfter} seconds`);
        securityScore -= 50;
      }
    }

    // 4. Request size validation
    const contentLength = request.headers.get('content-length');
    if (contentLength) {
      const size = parseInt(contentLength);
      if (size > this.config.maxRequestSize) {
        errors.push(`Request size ${size} exceeds maximum ${this.config.maxRequestSize}`);
        securityScore -= 20;
      }
    }

    // 5. User agent validation
    const userAgentValidation = this.validateUserAgent(context.userAgent);
    if (!userAgentValidation.isValid) {
      warnings.push(...userAgentValidation.warnings);
      securityScore -= 10;
    }

    // 6. Input validation (if schema provided)
    let sanitizedData: any = null;
    if (this.config.enableInputValidation && validationSchema) {
      const inputValidation = this.validateInput(request, validationSchema);
      if (!inputValidation.isValid) {
        errors.push(...inputValidation.errors);
        securityScore -= 25;
      } else {
        sanitizedData = inputValidation.sanitizedData;
      }
    }

    // 7. Custom validators
    if (customValidators && sanitizedData) {
      for (const validator of customValidators) {
        const customResult = validator(sanitizedData);
        if (!customResult.isValid) {
          errors.push(...customResult.errors);
          securityScore -= 15;
        }
        warnings.push(...customResult.warnings);
      }
    }

    // 8. Suspicious pattern detection
    const patternResult = this.detectSuspiciousPatterns(request, context);
    if (patternResult.isSuspicious) {
      warnings.push(...patternResult.warnings);
      securityScore -= patternResult.scoreReduction;
    }

    // Log security events
    if (this.config.enableSecurityLogging && (errors.length > 0 || securityScore < 70)) {
      SecurityMonitor.getInstance().logSecurityEvent({
        type: errors.length > 0 ? 'SUSPICIOUS_ACTIVITY' : 'RATE_LIMIT',
        severity: securityScore < 50 ? 'high' : securityScore < 70 ? 'medium' : 'low',
        details: {
          activity: 'api_request_validation',
          requestId: context.requestId,
          errors,
          warnings,
          securityScore,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent
        }
      });
    }

    return {
      isValid: errors.length === 0 && securityScore >= 50,
      errors,
      warnings,
      securityScore,
      sanitizedData
    };
  }

  /**
   * Validate response data
   */
  validateApiResponse(
    data: any,
    context: SecurityContext,
    sanitizationRules?: Array<(data: any) => any>
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let securityScore = 100;

    // Check for data leakage
    const leakageCheck = this.checkDataLeakage(data);
    if (leakageCheck.hasLeakage) {
      errors.push(...leakageCheck.issues);
      securityScore -= 40;
    }

    // Sanitize output if enabled
    let sanitizedData = data;
    if (this.config.enableOutputSanitization) {
      sanitizedData = this.sanitizeOutput(data);
      warnings.push('Output data sanitized');
    }

    // Apply custom sanitization rules
    if (sanitizationRules) {
      for (const rule of sanitizationRules) {
        try {
          sanitizedData = rule(sanitizedData);
        } catch (error) {
          warnings.push('Custom sanitization rule failed');
          securityScore -= 5;
        }
      }
    }

    // Check response size
    const responseSize = JSON.stringify(sanitizedData).length;
    if (responseSize > 1024 * 1024) { // 1MB
      warnings.push(`Large response size: ${responseSize} bytes`);
      securityScore -= 10;
    }

    return {
      isValid: errors.length === 0 && securityScore >= 70,
      errors,
      warnings,
      securityScore,
      sanitizedData
    };
  }

  /**
   * Validate request origin
   */
  private validateOrigin(origin: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!origin) {
      errors.push('Missing origin header');
      return { isValid: false, errors, warnings, securityScore: 0 };
    }

    const isAllowed = this.config.allowedOrigins.some(allowedOrigin =>
      origin === allowedOrigin || origin.endsWith(allowedOrigin)
    );

    if (!isAllowed) {
      errors.push(`Origin ${origin} not allowed`);
    }

    return {
      isValid: isAllowed,
      errors,
      warnings,
      securityScore: isAllowed ? 100 : 0
    };
  }

  /**
   * Validate IP address
   */
  private validateIPAddress(ipAddress: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let securityScore = 100;

    // Check if IP is blocked
    if (this.blockedIPs.has(ipAddress)) {
      errors.push(`IP address ${ipAddress} is blocked`);
      securityScore = 0;
    }

    // Check for private/internal IPs (suspicious for external API)
    const privateIPRanges = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^127\./,
      /^localhost$/i,
      /^::1$/,
      /^fc00:/,
      /^fe80:/
    ];

    const isPrivateIP = privateIPRanges.some(range => range.test(ipAddress));
    if (isPrivateIP) {
      warnings.push(`Private IP address detected: ${ipAddress}`);
      securityScore -= 20;
    }

    // Check for proxy/VPN indicators
    const proxyIndicators = ['proxy', 'vpn', 'tor', 'anonymous'];
    if (proxyIndicators.some(indicator => ipAddress.toLowerCase().includes(indicator))) {
      warnings.push(`Potential proxy/VPN detected: ${ipAddress}`);
      securityScore -= 15;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      securityScore
    };
  }

  /**
   * Check rate limits
   */
  private checkRateLimit(context: SecurityContext): RateLimitResult {
    const key = `${context.ipAddress}:${context.sessionId || 'anonymous'}`;
    const now = Date.now();

    if (!this.rateLimitStore.has(key)) {
      this.rateLimitStore.set(key, {
        requests: [],
        lastReset: now
      });
    }

    const rateLimitData = this.rateLimitStore.get(key)!;

    // Clean old requests (older than 1 hour)
    rateLimitData.requests = rateLimitData.requests.filter(
      timestamp => now - timestamp < 60 * 60 * 1000
    );

    // Check minute limit
    const minuteRequests = rateLimitData.requests.filter(
      timestamp => now - timestamp < 60 * 1000
    );

    if (minuteRequests.length >= this.config.maxRequestsPerMinute) {
      const oldestRequest = Math.min(...minuteRequests);
      const retryAfter = Math.ceil((60 * 1000 - (now - oldestRequest)) / 1000);

      return {
        isAllowed: false,
        remainingRequests: 0,
        resetTime: oldestRequest + 60 * 1000,
        retryAfter
      };
    }

    // Check hour limit
    if (rateLimitData.requests.length >= this.config.maxRequestsPerHour) {
      const oldestRequest = Math.min(...rateLimitData.requests);
      const retryAfter = Math.ceil((60 * 60 * 1000 - (now - oldestRequest)) / 1000);

      return {
        isAllowed: false,
        remainingRequests: 0,
        resetTime: oldestRequest + 60 * 60 * 1000,
        retryAfter
      };
    }

    // Add current request
    rateLimitData.requests.push(now);

    return {
      isAllowed: true,
      remainingRequests: Math.min(
        this.config.maxRequestsPerMinute - minuteRequests.length - 1,
        this.config.maxRequestsPerHour - rateLimitData.requests.length
      ),
      resetTime: now + 60 * 60 * 1000
    };
  }

  /**
   * Validate user agent
   */
  private validateUserAgent(userAgent: string): ValidationResult {
    const warnings: string[] = [];
    let securityScore = 100;

    if (!userAgent || userAgent.length < 10) {
      warnings.push('Suspicious or missing user agent');
      securityScore -= 25;
    }

    // Check for known bot/user agent patterns
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /java/i,
      /perl/i,
      /php/i
    ];

    if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
      warnings.push('Bot-like user agent detected');
      securityScore -= 20;
    }

    return {
      isValid: true,
      errors: [],
      warnings,
      securityScore
    };
  }

  /**
   * Validate input data against schema
   */
  private validateInput(request: Request, schema: ZodSchema): ValidationResult {
    try {
      // Parse request body
      const body = request.headers.get('content-type')?.includes('application/json')
        ? request.json()
        : {};

      // Validate against schema
      const validatedData = schema.parse(body);

      return {
        isValid: true,
        errors: [],
        warnings: [],
        securityScore: 100,
        sanitizedData: validatedData
      };
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
        return {
          isValid: false,
          errors,
          warnings: [],
          securityScore: 0
        };
      }

      return {
        isValid: false,
        errors: ['Input validation failed'],
        warnings: [],
        securityScore: 0
      };
    }
  }

  /**
   * Detect suspicious patterns
   */
  private detectSuspiciousPatterns(request: Request, context: SecurityContext): {
    isSuspicious: boolean;
    warnings: string[];
    scoreReduction: number;
  } {
    const warnings: string[] = [];
    let scoreReduction = 0;
    let isSuspicious = false;

    const patternKey = `${context.ipAddress}:${context.sessionId || 'anonymous'}`;
    const currentCount = this.suspiciousPatterns.get(patternKey) || 0;

    // Check for rapid requests
    if (currentCount > 10) {
      warnings.push(`High frequency requests detected: ${currentCount} requests`);
      scoreReduction += 30;
      isSuspicious = true;
    }

    // Check for suspicious headers
    const headers = Object.fromEntries(request.headers.entries());
    const suspiciousHeaders = ['x-forwarded-for', 'x-real-ip', 'x-originating-ip'];

    const forwardedHeaders = suspiciousHeaders.filter(header => headers[header]);
    if (forwardedHeaders.length > 2) {
      warnings.push('Multiple forwarding headers detected');
      scoreReduction += 15;
      isSuspicious = true;
    }

    // Update pattern count
    this.suspiciousPatterns.set(patternKey, currentCount + 1);

    return {
      isSuspicious,
      warnings,
      scoreReduction
    };
  }

  /**
   * Check for data leakage in response
   */
  private checkDataLeakage(data: any): {
    hasLeakage: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    const dataString = JSON.stringify(data);

    // Check for sensitive patterns
    const sensitivePatterns = [
      /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/, // Credit card numbers
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /password["\s]*[:=]["\s]*[^"{}\s,}]+/i, // Passwords
      /secret["\s]*[:=]["\s]*[^"{}\s,}]+/i, // Secrets
      /token["\s]*[:=]["\s]*[^"{}\s,}]+/i, // Tokens
      /api[_-]?key["\s]*[:=]["\s]*[^"{}\s,}]+/i, // API keys
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/ // Email addresses
    ];

    for (const pattern of sensitivePatterns) {
      if (pattern.test(dataString)) {
        issues.push('Sensitive data pattern detected in response');
        break;
      }
    }

    // Check for stack traces or error details
    if (/at\s+.*\(.*\)|Error:|Stack trace:/i.test(dataString)) {
      issues.push('Potential stack trace or error details in response');
    }

    return {
      hasLeakage: issues.length > 0,
      issues
    };
  }

  /**
   * Sanitize output data
   */
  private sanitizeOutput(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sanitized = Array.isArray(data) ? [] : {};

    for (const [key, value] of Object.entries(data)) {
      // Remove sensitive keys
      const sensitiveKeys = ['password', 'secret', 'token', 'key', 'creditCard', 'ssn'];
      const isSensitive = sensitiveKeys.some(sensitive =>
        key.toLowerCase().includes(sensitive.toLowerCase())
      );

      if (isSensitive) {
        continue;
      }

      // Recursively sanitize nested objects
      if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeOutput(value);
      } else if (typeof value === 'string') {
        // Sanitize string values
        sanitized[key] = value
          .replace(/<script[^>]*>.*?<\/script>/gi, '[REMOVED_SCRIPT]')
          .replace(/javascript:/gi, '[REMOVED_JS]')
          .replace(/on\w+\s*=/gi, '[REMOVED_HANDLER]');
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Clean up old rate limit data
   */
  private cleanupRateLimitData(): void {
    const now = Date.now();
    const cutoff = now - 24 * 60 * 60 * 1000; // 24 hours

    for (const [key, data] of this.rateLimitStore.entries()) {
      data.requests = data.requests.filter(timestamp => timestamp > cutoff);
      if (data.requests.length === 0) {
        this.rateLimitStore.delete(key);
      }
    }
  }

  /**
   * Clean up suspicious pattern data
   */
  private cleanupSuspiciousPatterns(): void {
    for (const [key, count] of this.suspiciousPatterns.entries()) {
      if (count < 5) { // Remove low-count patterns
        this.suspiciousPatterns.delete(key);
      } else {
        // Decay the count
        this.suspiciousPatterns.set(key, Math.floor(count * 0.5));
      }
    }
  }

  /**
   * Block an IP address
   */
  blockIPAddress(ipAddress: string, duration?: number): void {
    this.blockedIPs.add(ipAddress);

    if (duration) {
      setTimeout(() => {
        this.blockedIPs.delete(ipAddress);
      }, duration);
    }

    SecurityMonitor.getInstance().logSecurityEvent({
      type: 'SUSPICIOUS_ACTIVITY',
      severity: 'high',
      details: {
        activity: 'ip_blocked',
        ipAddress,
        duration
      }
    });
  }

  /**
   * Get security metrics
   */
  getSecurityMetrics(): {
    trackedIPs: number;
    blockedIPs: number;
    activeRateLimits: number;
    suspiciousPatterns: number;
  } {
    return {
      trackedIPs: this.rateLimitStore.size,
      blockedIPs: this.blockedIPs.size,
      activeRateLimits: this.rateLimitStore.size,
      suspiciousPatterns: this.suspiciousPatterns.size
    };
  }
}

// Export singleton instance
export const apiSecurityValidator = new ApiSecurityValidator();

// Export utilities
export const validateApiRequest = (
  request: Request,
  context: SecurityContext,
  validationSchema?: ZodSchema,
  customValidators?: Array<(data: any) => ValidationResult>
) => apiSecurityValidator.validateApiRequest(request, context, validationSchema, customValidators);

export const validateApiResponse = (
  data: any,
  context: SecurityContext,
  sanitizationRules?: Array<(data: any) => any>
) => apiSecurityValidator.validateApiResponse(data, context, sanitizationRules);

export const blockIPAddress = (ipAddress: string, duration?: number) =>
  apiSecurityValidator.blockIPAddress(ipAddress, duration);