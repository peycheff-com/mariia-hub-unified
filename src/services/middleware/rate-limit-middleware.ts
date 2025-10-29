import { Context, Next } from 'hono';

import { ApiError } from '../api/base.service';

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (c: Context) => string;
}

export interface RateLimitInfo {
  limit: number;
  current: number;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export class RateLimitMiddleware {
  // In-memory store (in production, use Redis or similar)
  private static store = new Map<string, RateLimitEntry>();
  private static cleanupInterval: NodeJS.Timeout;

  /**
   * Create rate limiting middleware
   */
  static rateLimit(config: RateLimitConfig) {
    return async (c: Context, next: Next) => {
      const key = config.keyGenerator ? config.keyGenerator(c) : this.defaultKeyGenerator(c);
      const now = Date.now();

      // Clean up expired entries
      this.cleanupExpiredEntries(now);

      // Get or create rate limit entry
      let entry = this.store.get(key);
      if (!entry || now > entry.resetTime) {
        entry = {
          count: 0,
          resetTime: now + config.windowMs
        };
        this.store.set(key, entry);
      }

      // Skip based on configuration
      const shouldSkip = this.shouldSkipRequest(c, config, now);
      if (shouldSkip) {
        await next();
        return;
      }

      // Check if limit exceeded
      if (entry.count >= config.maxRequests) {
        const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
        const resetTime = new Date(entry.resetTime);

        const rateLimitInfo: RateLimitInfo = {
          limit: config.maxRequests,
          current: entry.count,
          remaining: 0,
          resetTime,
          retryAfter
        };

        // Add rate limit headers
        c.res.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
        c.res.headers.set('X-RateLimit-Current', entry.count.toString());
        c.res.headers.set('X-RateLimit-Remaining', '0');
        c.res.headers.set('X-RateLimit-Reset', entry.resetTime.toString());
        c.res.headers.set('Retry-After', retryAfter.toString());

        const error: ApiError = {
          message: config.message || 'Too many requests',
          code: 'RATE_LIMIT_EXCEEDED',
          details: rateLimitInfo,
          timestamp: new Date().toISOString()
        };

        c.status(429);
        return c.json(error);
      }

      // Increment counter
      entry.count++;
      this.store.set(key, entry);

      // Add rate limit headers
      const remaining = config.maxRequests - entry.count;
      c.res.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
      c.res.headers.set('X-RateLimit-Current', entry.count.toString());
      c.res.headers.set('X-RateLimit-Remaining', remaining.toString());
      c.res.headers.set('X-RateLimit-Reset', entry.resetTime.toString());

      await next();
    };
  }

  /**
   * Default key generator using IP address
   */
  private static defaultKeyGenerator(c: Context): string {
    // Try to get real IP address
    const forwarded = c.req.header('x-forwarded-for');
    const realIp = c.req.header('x-real-ip');
    const cfConnectingIp = c.req.header('cf-connecting-ip'); // Cloudflare

    let ip = forwarded || realIp || cfConnectingIp || 'unknown';

    // If forwarded contains multiple IPs, take the first one
    if (forwarded && forwarded.includes(',')) {
      ip = forwarded.split(',')[0].trim();
    }

    // Add user agent and path for more specific limiting
    const userAgent = c.req.header('user-agent') || 'unknown';
    const path = c.req.path;

    return `${ip}:${userAgent}:${path}`;
  }

  /**
   * Check if request should be skipped based on configuration
   */
  private static shouldSkipRequest(
    c: Context,
    config: RateLimitConfig,
    now: number
  ): boolean {
    // Skip successful requests if configured
    if (config.skipSuccessfulRequests) {
      // Note: This would need to be implemented after the request
      // For now, we'll skip based on request method
      if (c.req.method === 'GET') {
        return true;
      }
    }

    // Skip failed requests if configured
    if (config.skipFailedRequests) {
      // Note: This would need to be implemented after the request
      // For now, we'll skip health check endpoints
      if (c.req.path.startsWith('/health') || c.req.path.startsWith('/api/health')) {
        return true;
      }
    }

    return false;
  }

  /**
   * Clean up expired entries
   */
  private static cleanupExpiredEntries(now: number): void {
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Start cleanup interval
   */
  static startCleanupInterval(intervalMs: number = 60000): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      this.cleanupExpiredEntries(now);
    }, intervalMs);
  }

  /**
   * Stop cleanup interval
   */
  static stopCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
  }

  /**
   * Get current rate limit info for a key
   */
  static getRateLimitInfo(key: string): RateLimitInfo | null {
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }

    const now = Date.now();
    const resetTime = new Date(entry.resetTime);

    return {
      limit: 0, // Not stored in simple implementation
      current: entry.count,
      remaining: Math.max(0, entry.count - (now > entry.resetTime ? entry.count : 0)),
      resetTime,
      retryAfter: now > entry.resetTime ? 0 : Math.ceil((entry.resetTime - now) / 1000)
    };
  }

  /**
   * Reset rate limit for a key
   */
  static resetRateLimit(key: string): void {
    this.store.delete(key);
  }

  /**
   * Clear all rate limits
   */
  static clearAllRateLimits(): void {
    this.store.clear();
  }
}

// Predefined rate limit configurations
export const RateLimitConfigs = {
  // General API rate limit
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Too many API requests, please try again later'
  },

  // Strict rate limit for sensitive endpoints
  strict: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 20,
    message: 'Too many requests to this endpoint, please try again later'
  },

  // Very strict for authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many authentication attempts, please try again later'
  },

  // Booking creation rate limit
  booking: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    message: 'Too many booking attempts, please try again later'
  },

  // Upload rate limit
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5,
    message: 'Too many upload attempts, please try again later'
  },

  // Search rate limit
  search: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    message: 'Too many search requests, please try again later'
  }
};

// Key generators for different scenarios
export const KeyGenerators = {
  // Limit by IP only
  byIp: (c: Context) => {
    const forwarded = c.req.header('x-forwarded-for');
    const realIp = c.req.header('x-real-ip');
    return forwarded || realIp || 'unknown';
  },

  // Limit by user ID if authenticated, otherwise IP
  byUserOrIp: (c: Context) => {
    // This would need to be adapted based on your auth system
    const userId = c.req.header('x-user-id');
    return userId || KeyGenerators.byIp(c);
  },

  // Limit by IP and endpoint
  byIpAndEndpoint: (c: Context) => {
    const ip = KeyGenerators.byIp(c);
    const endpoint = c.req.path;
    return `${ip}:${endpoint}`;
  },

  // Limit by user and service (for bookings, etc.)
  byUserAndService: (c: Context) => {
    const userId = c.req.header('x-user-id');
    const serviceId = c.req.query('service_id') || c.req.param('serviceId');
    return `user:${userId}:service:${serviceId}`;
  }
};

// Start cleanup interval when module is loaded
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
  RateLimitMiddleware.startCleanupInterval();
}

// Handle process termination
if (typeof process !== 'undefined') {
  process.on('SIGTERM', () => {
    RateLimitMiddleware.stopCleanupInterval();
  });

  process.on('SIGINT', () => {
    RateLimitMiddleware.stopCleanupInterval();
  });
}