/**
 * Enhanced Security Middleware for Production
 * Implements zero-trust architecture principles
 * OWASP security best practices
 */

import { Context, Next } from 'hono';

import { ApiError } from '../api/base.service';

export interface SecurityMiddlewareOptions {
  enableRateLimit?: boolean;
  enableCORS?: boolean;
  enableCSP?: boolean;
  enableSecurityHeaders?: boolean;
  enableRequestValidation?: boolean;
  customHeaders?: Record<string, string>;
}

export class SecurityMiddleware {
  private static rateLimiter = new Map<string, { count: number; resetTime: number }>();

  /**
   * Rate limiting with configurable windows
   */
  static rateLimit(options: {
    windowMs?: number;
    maxRequests?: number;
    keyGenerator?: (c: Context) => string;
    skipSuccessfulRequests?: boolean;
  } = {}) {
    const {
      windowMs = 15 * 60 * 1000, // 15 minutes
      maxRequests = 100,
      keyGenerator = (c) => c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown',
      skipSuccessfulRequests = false
    } = options;

    return async (c: Context, next: Next) => {
      const key = keyGenerator(c);
      const now = Date.now();
      const record = this.rateLimiter.get(key);

      if (!record || now > record.resetTime) {
        this.rateLimiter.set(key, { count: 1, resetTime: now + windowMs });
      } else {
        record.count++;

        if (record.count > maxRequests) {
          const error: ApiError = {
            message: 'Too Many Requests',
            code: 'RATE_LIMIT_EXCEEDED',
            details: {
              retryAfter: Math.ceil((record.resetTime - now) / 1000),
              limit: maxRequests,
              windowMs
            },
            timestamp: new Date().toISOString()
          };

          c.res.headers.set('Retry-After', Math.ceil((record.resetTime - now) / 1000).toString());
          c.status(429);
          return c.json(error);
        }
      }

      // Clean up expired entries periodically
      if (Math.random() < 0.01) { // 1% chance to clean up
        for (const [k, v] of this.rateLimiter.entries()) {
          if (now > v.resetTime) {
            this.rateLimiter.delete(k);
          }
        }
      }

      await next();
    };
  }

  /**
   * CORS configuration with strict origins
   */
  static cors(options: {
    origins?: string[];
    methods?: string[];
    allowedHeaders?: string[];
    exposedHeaders?: string[];
    credentials?: boolean;
    maxAge?: number;
  } = {}) {
    const {
      origins = process.env.ALLOWED_ORIGINS?.split(',') || ['https://mariiahub.com'],
      methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders = ['Content-Type', 'Authorization', 'X-API-Key', 'X-Requested-With'],
      exposedHeaders = ['X-Total-Count', 'X-Rate-Limit-Remaining'],
      credentials = true,
      maxAge = 86400 // 24 hours
    } = options;

    return async (c: Context, next: Next) => {
      const origin = c.req.header('origin');

      // Handle preflight requests
      if (c.req.method === 'OPTIONS') {
        if (origin && origins.includes(origin)) {
          c.res.headers.set('Access-Control-Allow-Origin', origin);
        }
        c.res.headers.set('Access-Control-Allow-Methods', methods.join(', '));
        c.res.headers.set('Access-Control-Allow-Headers', allowedHeaders.join(', '));
        c.res.headers.set('Access-Control-Max-Age', maxAge.toString());
        c.res.headers.set('Access-Control-Allow-Credentials', credentials.toString());

        c.status(200);
        return;
      }

      // Set CORS headers for actual requests
      if (origin && origins.includes(origin)) {
        c.res.headers.set('Access-Control-Allow-Origin', origin);
        c.res.headers.set('Access-Control-Allow-Credentials', credentials.toString());
        c.res.headers.set('Access-Control-Expose-Headers', exposedHeaders.join(', '));
      }

      await next();
    };
  }

  /**
   * Content Security Policy headers
   */
  static csp(options: {
    directives?: Record<string, string[]>;
    reportOnly?: boolean;
    reportURI?: string;
  } = {}) {
    const {
      directives = {
        'default-src': ["'self'"],
        'script-src': [
          "'self'",
          "'unsafe-eval'", // Remove in production if possible
          'https://cdn.supabase.co',
          'https://js.stripe.com',
          'https://www.googletagmanager.com'
        ],
        'style-src': [
          "'self'",
          "'unsafe-inline'",
          'https://fonts.googleapis.com'
        ],
        'img-src': [
          "'self'",
          'data:',
          'blob:',
          'https://*.supabase.co'
        ],
        'connect-src': [
          "'self'",
          'https://*.supabase.co',
          'https://api.stripe.com'
        ],
        'font-src': ["'self'", 'https://fonts.gstatic.com'],
        'object-src': ["'none'"],
        'frame-src': ["'self'", 'https://js.stripe.com'],
        'worker-src': ["'self'", 'blob:']
      },
      reportOnly = false,
      reportURI = '/api/security/csp-report'
    } = options;

    return async (c: Context, next: Next) => {
      const cspDirectives = Object.entries(directives)
        .map(([key, values]) => `${key} ${values.join(' ')}`)
        .join('; ');

      const headerName = reportOnly ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy';
      c.res.headers.set(headerName, `${cspDirectives}; report-uri ${reportURI}`);

      await next();
    };
  }

  /**
   * Comprehensive security headers
   */
  static securityHeaders(options: {
    enableHSTS?: boolean;
    enableFrameOptions?: boolean;
    enableContentTypeOptions?: boolean;
    enableReferrerPolicy?: boolean;
    enablePermissionsPolicy?: boolean;
  } = {}) {
    const {
      enableHSTS = true,
      enableFrameOptions = true,
      enableContentTypeOptions = true,
      enableReferrerPolicy = true,
      enablePermissionsPolicy = true
    } = options;

    return async (c: Context, next: Next) => {
      // HTTP Strict Transport Security
      if (enableHSTS) {
        c.res.headers.set(
          'Strict-Transport-Security',
          'max-age=31536000; includeSubDomains; preload'
        );
      }

      // X-Frame-Options (DEPRECATED but still useful)
      if (enableFrameOptions) {
        c.res.headers.set('X-Frame-Options', 'DENY');
      }

      // X-Content-Type-Options
      if (enableContentTypeOptions) {
        c.res.headers.set('X-Content-Type-Options', 'nosniff');
      }

      // Referrer Policy
      if (enableReferrerPolicy) {
        c.res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      }

      // Permissions Policy
      if (enablePermissionsPolicy) {
        const permissions = [
          'camera=()',
          'microphone=()',
          'geolocation=()',
          'payment=()',
          'usb=()',
          'bluetooth=()',
          'accelerometer=()',
          'gyroscope=()',
          'magnetometer=()'
        ];
        c.res.headers.set('Permissions-Policy', permissions.join(', '));
      }

      // Additional security headers
      c.res.headers.set('X-XSS-Protection', '1; mode=block');
      c.res.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
      c.res.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
      c.res.headers.set('Cross-Origin-Opener-Policy', 'same-origin');

      await next();
    };
  }

  /**
   * Request validation and sanitization
   */
  static requestValidation(options: {
    maxPayloadSize?: number;
    allowedMethods?: string[];
    validateJSON?: boolean;
    sanitizeInput?: boolean;
  } = {}) {
    const {
      maxPayloadSize = 10 * 1024 * 1024, // 10MB
      allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      validateJSON = true,
      sanitizeInput = true
    } = options;

    return async (c: Context, next: Next) => {
      // Method validation
      if (!allowedMethods.includes(c.req.method)) {
        const error: ApiError = {
          message: 'Method Not Allowed',
          code: 'METHOD_NOT_ALLOWED',
          details: { allowedMethods },
          timestamp: new Date().toISOString()
        };
        c.status(405);
        return c.json(error);
      }

      // Content length validation
      const contentLength = c.req.header('content-length');
      if (contentLength && parseInt(contentLength) > maxPayloadSize) {
        const error: ApiError = {
          message: 'Payload Too Large',
          code: 'PAYLOAD_TOO_LARGE',
          details: { maxSize: maxPayloadSize },
          timestamp: new Date().toISOString()
        };
        c.status(413);
        return c.json(error);
      }

      // JSON validation
      if (validateJSON && c.req.header('content-type')?.includes('application/json')) {
        try {
          await c.req.json();
        } catch (error) {
          const apiError: ApiError = {
            message: 'Invalid JSON',
            code: 'INVALID_JSON',
            details: { error: error instanceof Error ? error.message : 'Unknown error' },
            timestamp: new Date().toISOString()
          };
          c.status(400);
          return c.json(apiError);
        }
      }

      // Input sanitization (basic)
      if (sanitizeInput) {
        const userAgent = c.req.header('user-agent');
        if (userAgent && this.containsSuspiciousPatterns(userAgent)) {
          const error: ApiError = {
            message: 'Bad Request',
            code: 'SUSPICIOUS_USER_AGENT',
            details: { userAgent },
            timestamp: new Date().toISOString()
          };
          c.status(400);
          return c.json(error);
        }
      }

      await next();
    };
  }

  /**
   * IP-based blocking for known malicious actors
   */
  static ipBlocklist(blockedIPs: string[] = []) {
    return async (c: Context, next: Next) => {
      const clientIP = c.req.header('x-forwarded-for') ||
                      c.req.header('x-real-ip') ||
                      c.req.header('cf-connecting-ip') ||
                      'unknown';

      if (blockedIPs.includes(clientIP)) {
        const error: ApiError = {
          message: 'Forbidden',
          code: 'IP_BLOCKED',
          details: { ip: clientIP },
          timestamp: new Date().toISOString()
        };
        c.status(403);
        return c.json(error);
      }

      await next();
    };
  }

  /**
   * Request ID and logging
   */
  static requestLogger() {
    return async (c: Context, next: Next) => {
      const requestId = crypto.randomUUID();
      c.res.headers.set('X-Request-ID', requestId);
      c.set('requestId', requestId);

      const startTime = Date.now();
      await next();
      const duration = Date.now() - startTime;

      // Log request (in production, send to logging service)
      console.log(JSON.stringify({
        requestId,
        method: c.req.method,
        url: c.req.url,
        userAgent: c.req.header('user-agent'),
        ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
        duration,
        statusCode: c.res.status
      }));
    };
  }

  /**
   * CSRF protection for state-changing requests
   */
  static csrfProtection() {
    const csrfTokens = new Map<string, { token: string; expires: number }>();

    return async (c: Context, next: Next) => {
      const method = c.req.method;

      // Skip for GET, HEAD, OPTIONS
      if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
        await next();
        return;
      }

      const sessionToken = c.req.header('x-session-token');
      const csrfToken = c.req.header('x-csrf-token');

      if (!sessionToken || !csrfToken) {
        const error: ApiError = {
          message: 'CSRF Token Required',
          code: 'CSRF_TOKEN_MISSING',
          timestamp: new Date().toISOString()
        };
        c.status(403);
        return c.json(error);
      }

      const storedToken = csrfTokens.get(sessionToken);
      if (!storedToken || storedToken.expires < Date.now() || storedToken.token !== csrfToken) {
        const error: ApiError = {
          message: 'Invalid CSRF Token',
          code: 'CSRF_TOKEN_INVALID',
          timestamp: new Date().toISOString()
        };
        c.status(403);
        return c.json(error);
      }

      await next();
    };
  }

  /**
   * Detect suspicious patterns in user agent or other inputs
   */
  private static containsSuspiciousPatterns(input: string): boolean {
    const suspiciousPatterns = [
      /sqlmap/i,
      /nikto/i,
      /nmap/i,
      /dirb/i,
      /gobuster/i,
      /hydra/i,
      /john/i,
      /burp/i,
      /owasp/i,
      /sql.*injection/i,
      /xss/i,
      /<script/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Combined security middleware
   */
  static combine(options: SecurityMiddlewareOptions = {}) {
    const {
      enableRateLimit = true,
      enableCORS = true,
      enableCSP = true,
      enableSecurityHeaders = true,
      enableRequestValidation = true
    } = options;

    const middlewares = [];

    if (enableSecurityHeaders) {
      middlewares.push(this.securityHeaders());
    }

    if (enableRequestValidation) {
      middlewares.push(this.requestValidation());
    }

    if (enableRateLimit) {
      middlewares.push(this.rateLimit());
    }

    if (enableCORS) {
      middlewares.push(this.cors());
    }

    if (enableCSP) {
      middlewares.push(this.csp());
    }

    middlewares.push(this.requestLogger());

    return middlewares;
  }
}