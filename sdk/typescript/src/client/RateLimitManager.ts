import { RateLimitConfig } from '../types/api';
import { RateLimitError, ErrorFactory } from '../types/errors';

/**
 * Rate limit manager implementation
 */
export class RateLimitManager {
  private config: RateLimitConfig;
  private requests: Map<string, RequestRecord[]> = new Map();
  private cleanupInterval?: NodeJS.Timeout;

  constructor(config: RateLimitConfig) {
    this.config = { ...config };
    this.startCleanupInterval();
  }

  /**
   * Check if request is allowed
   */
  async checkLimit(path: string): Promise<void> {
    const key = this.getRequestKey(path);
    const now = Date.now();
    const windowMs = this.config.windowMs || 60000; // Default 1 minute
    const maxRequests = this.config.maxRequests || 100;

    // Clean old requests
    this.cleanupOldRequests(key, now, windowMs);

    // Check current request count
    const requests = this.requests.get(key) || [];

    if (requests.length >= maxRequests) {
      const oldestRequest = requests[0];
      const resetTime = oldestRequest.timestamp + windowMs;
      const retryAfter = Math.ceil((resetTime - now) / 1000);

      throw new RateLimitError(
        `Rate limit exceeded for ${path}. Maximum ${maxRequests} requests per ${windowMs / 1000} seconds.`,
        'RATE_LIMIT_EXCEEDED',
        429,
        {
          retryAfter,
          limit: maxRequests,
          remaining: 0,
          reset: new Date(resetTime).toISOString()
        }
      );
    }

    // Record this request
    requests.push({ timestamp: now, path });
    this.requests.set(key, requests);
  }

  /**
   * Get current rate limit status
   */
  getStatus(path?: string): RateLimitStatus {
    const key = path ? this.getRequestKey(path) : '*';
    const now = Date.now();
    const windowMs = this.config.windowMs || 60000;
    const maxRequests = this.config.maxRequests || 100;

    // Clean old requests
    this.cleanupOldRequests(key, now, windowMs);

    const requests = this.requests.get(key) || [];
    const oldestRequest = requests[0];

    return {
      limit: maxRequests,
      remaining: Math.max(0, maxRequests - requests.length),
      reset: oldestRequest ? oldestRequest.timestamp + windowMs : now + windowMs,
      requests: requests.length,
      windowMs
    };
  }

  /**
   * Reset rate limit for specific path
   */
  reset(path?: string): void {
    const key = path ? this.getRequestKey(path) : '*';
    this.requests.delete(key);
  }

  /**
   * Reset all rate limits
   */
  resetAll(): void {
    this.requests.clear();
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<RateLimitConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get configuration
   */
  getConfig(): RateLimitConfig {
    return { ...this.config };
  }

  /**
   * Cleanup manager
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
    this.requests.clear();
  }

  /**
   * Get request key for rate limiting
   */
  private getRequestKey(path: string): string {
    // Group similar paths together for rate limiting
    const normalizedPath = this.normalizePath(path);
    return normalizedPath;
  }

  /**
   * Normalize path for rate limiting
   */
  private normalizePath(path: string): string {
    // Remove IDs from paths for grouping
    return path
      .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, '/:id')
      .replace(/\/\d+/g, '/:id')
      .replace(/\?.*$/, ''); // Remove query parameters
  }

  /**
   * Clean old requests outside the time window
   */
  private cleanupOldRequests(key: string, now: number, windowMs: number): void {
    const requests = this.requests.get(key) || [];
    const cutoff = now - windowMs;

    const filteredRequests = requests.filter(request => request.timestamp > cutoff);

    if (filteredRequests.length !== requests.length) {
      this.requests.set(key, filteredRequests);
    }
  }

  /**
   * Start cleanup interval to prevent memory leaks
   */
  private startCleanupInterval(): void {
    // Clean up every 5 minutes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const windowMs = this.config.windowMs || 60000;
      const cutoff = now - windowMs;

      for (const [key, requests] of this.requests.entries()) {
        const filteredRequests = requests.filter(request => request.timestamp > cutoff);
        if (filteredRequests.length === 0) {
          this.requests.delete(key);
        } else if (filteredRequests.length !== requests.length) {
          this.requests.set(key, filteredRequests);
        }
      }
    }, 5 * 60 * 1000); // 5 minutes
  }
}

/**
 * Request record for rate limiting
 */
interface RequestRecord {
  timestamp: number;
  path: string;
}

/**
 * Rate limit status
 */
export interface RateLimitStatus {
  limit: number;
  remaining: number;
  reset: number;
  requests: number;
  windowMs: number;
}

/**
 * Advanced rate limit manager with burst handling
 */
export class AdvancedRateLimitManager extends RateLimitManager {
  private burstConfig?: {
    maxBurst: number;
    burstWindowMs: number;
  };
  private burstRequests: Map<string, RequestRecord[]> = new Map();

  constructor(config: RateLimitConfig, burstConfig?: { maxBurst: number; burstWindowMs: number }) {
    super(config);
    this.burstConfig = burstConfig;
  }

  /**
   * Check rate limit with burst handling
   */
  async checkLimit(path: string): Promise<void> {
    // Check regular rate limit first
    await super.checkLimit(path);

    // Check burst limit if configured
    if (this.burstConfig) {
      await this.checkBurstLimit(path);
    }
  }

  /**
   * Check burst rate limit
   */
  private async checkBurstLimit(path: string): Promise<void> {
    if (!this.burstConfig) return;

    const key = this.getRequestKey(path);
    const now = Date.now();
    const windowMs = this.burstConfig.burstWindowMs;
    const maxBurst = this.burstConfig.maxBurst;

    // Clean old burst requests
    this.cleanupOldBurstRequests(key, now, windowMs);

    // Check current burst request count
    const requests = this.burstRequests.get(key) || [];

    if (requests.length >= maxBurst) {
      const oldestRequest = requests[0];
      const resetTime = oldestRequest.timestamp + windowMs;
      const retryAfter = Math.ceil((resetTime - now) / 1000);

      throw new RateLimitError(
        `Burst rate limit exceeded for ${path}. Maximum ${maxBurst} requests per ${windowMs / 1000} seconds.`,
        'RATE_LIMIT_EXCEEDED',
        429,
        {
          retryAfter,
          limit: maxBurst,
          remaining: 0,
          reset: new Date(resetTime).toISOString(),
          burst: true
        }
      );
    }

    // Record this burst request
    requests.push({ timestamp: now, path });
    this.burstRequests.set(key, requests);
  }

  /**
   * Get rate limit status including burst status
   */
  getAdvancedStatus(path?: string): AdvancedRateLimitStatus {
    const regularStatus = this.getStatus(path);
    const burstStatus = this.getBurstStatus(path);

    return {
      ...regularStatus,
      burst: burstStatus
    };
  }

  /**
   * Get burst status
   */
  private getBurstStatus(path?: string): RateLimitStatus | null {
    if (!this.burstConfig) return null;

    const key = path ? this.getRequestKey(path) : '*';
    const now = Date.now();
    const windowMs = this.burstConfig.burstWindowMs;
    const maxBurst = this.burstConfig.maxBurst;

    // Clean old requests
    this.cleanupOldBurstRequests(key, now, windowMs);

    const requests = this.burstRequests.get(key) || [];
    const oldestRequest = requests[0];

    return {
      limit: maxBurst,
      remaining: Math.max(0, maxBurst - requests.length),
      reset: oldestRequest ? oldestRequest.timestamp + windowMs : now + windowMs,
      requests: requests.length,
      windowMs
    };
  }

  /**
   * Clean old burst requests
   */
  private cleanupOldBurstRequests(key: string, now: number, windowMs: number): void {
    const requests = this.burstRequests.get(key) || [];
    const cutoff = now - windowMs;

    const filteredRequests = requests.filter(request => request.timestamp > cutoff);

    if (filteredRequests.length !== requests.length) {
      this.burstRequests.set(key, filteredRequests);
    }
  }

  /**
   * Cleanup advanced manager
   */
  destroy(): void {
    super.destroy();
    this.burstRequests.clear();
  }
}

/**
 * Advanced rate limit status
 */
export interface AdvancedRateLimitStatus extends RateLimitStatus {
  burst?: RateLimitStatus | null;
}

/**
 * Rate limit middleware for Express.js
 */
export function createRateLimitMiddleware(rateLimitManager: RateLimitManager) {
  return async (req: any, res: any, next: any) => {
    try {
      await rateLimitManager.checkLimit(req.path);

      // Add rate limit headers to response
      const status = rateLimitManager.getStatus(req.path);
      res.set({
        'X-RateLimit-Limit': status.limit,
        'X-RateLimit-Remaining': status.remaining,
        'X-RateLimit-Reset': Math.ceil(status.reset / 1000)
      });

      next();
    } catch (error) {
      if (error instanceof RateLimitError) {
        res.set({
          'X-RateLimit-Limit': error.limit,
          'X-RateLimit-Remaining': error.remaining,
          'X-RateLimit-Reset': Math.ceil(error.reset! / 1000),
          'Retry-After': error.retryAfter
        });
        res.status(429).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
            retryAfter: error.retryAfter
          }
        });
      } else {
        next(error);
      }
    }
  };
}