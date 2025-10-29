// Rate limiting utilities and classes

export interface RateLimitConfig {
  maxRequests: number; // Max requests per window
  windowMs: number; // Time window in milliseconds
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
  strategy?: 'sliding-window' | 'fixed-window' | 'token-bucket';
}

export interface RateLimitResult {
  allowed: boolean;
  remainingRequests: number;
  retryAfter?: number; // Timestamp when to retry
  resetAfter?: number; // Timestamp when window resets
  retryAfterMs?: number; // How long until retry in ms
  headers?: Record<string, string>; // Rate limit headers
}

// Main rate limiter class
export class RateLimiter {
  private config: RateLimitConfig;
  private requests: Array<{ timestamp: number; success?: boolean }> = [];
  private lastReset = 0;

  constructor(config: RateLimitConfig) {
    this.config = {
      maxRequests: 100,
      windowMs: 60000, // 1 minute
      ...config,
    };
  }

  // Check if request is allowed
  public checkLimit(key?: string): RateLimitResult {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Clean old requests based on strategy
    if (this.config.strategy === 'sliding-window') {
      this.requests = this.requests.filter(req => req.timestamp >= windowStart);
    } else if (this.config.strategy === 'fixed-window') {
      // Fixed window resets after windowMs
      if (now - this.lastReset > this.config.windowMs) {
        this.requests = [];
        this.lastReset = now;
      }
    }

    // Count requests in window
    const requestCount = this.requests.filter(req => {
      // Apply filters
      if (this.config.skipSuccessfulRequests && req.success === true) return false;
      if (this.config.skipFailedRequests && req.success === false) return false;
      return true;
    }).length;

    const remaining = Math.max(0, this.config.maxRequests - requestCount);
    const allowed = requestCount < this.config.maxRequests;

    const result: RateLimitResult = {
      allowed,
      remainingRequests: remaining,
    };

    // Add retry info if not allowed
    if (!allowed) {
      if (this.config.strategy === 'sliding-window') {
        // Find oldest request
        const oldestRequest = this.requests[0];
        if (oldestRequest) {
          result.retryAfter = oldestRequest.timestamp + this.config.windowMs;
          result.retryAfterMs = result.retryAfter - now;
        }
      } else {
        result.retryAfter = this.lastReset + this.config.windowMs;
        result.retryAfterMs = result.retryAfter - now;
      }

      result.resetAfter = this.lastReset + this.config.windowMs;
    }

    // Add standard rate limit headers
    result.headers = {
      'X-RateLimit-Limit': this.config.maxRequests.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': new Date(result.resetAfter || this.lastReset + this.config.windowMs).toISOString(),
    };

    return result;
  }

  // Record a request attempt
  public recordRequest(success: boolean = true, key?: string): void {
    this.requests.push({
      timestamp: Date.now(),
      success,
      key,
    });
  }

  // Reset the limiter
  public reset(): void {
    this.requests = [];
    this.lastReset = Date.now();
  }

  // Get current stats
  public getStats() {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    const requestsInWindow = this.requests.filter(req => req.timestamp >= windowStart);
    const recentRequests = requestsInWindow.slice(-10); // Last 10 requests

    return {
      totalRequests: this.requests.length,
      requestsInWindow: requestsInWindow.length,
      maxRequests: this.config.maxRequests,
      windowMs: this.config.windowMs,
      recentRequests: recentRequests.map(req => ({
        timestamp: req.timestamp,
        age: now - req.timestamp,
        success: req.success,
      })),
    };
  }
}

// Token bucket rate limiter
export class TokenBucket {
  private capacity: number;
  private tokens: number;
  private refillRate: number;
  private lastRefill: number;

  constructor(capacity: number, refillRate: number) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.refillRate = refillRate; // Tokens per second
    this.lastRefill = Date.now();
  }

  // Consume tokens
  public consume(tokens: number = 1): boolean {
    this.refill();

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }

    return false;
  }

  // Refill tokens based on time elapsed
  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000; // Convert to seconds
    const tokensToAdd = Math.floor(elapsed * this.refillRate);

    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  // Get available tokens
  public getAvailableTokens(): number {
    this.refill();
    return this.tokens;
  }

  // Add tokens (for manual adjustments)
  public addTokens(tokens: number): void {
    this.tokens = Math.min(this.capacity, this.tokens + tokens);
  }
}

// API rate limiting service
export class ApiRateLimiter {
  private limiters: Map<string, RateLimiter> = new Map();
  private tokenBuckets: Map<string, TokenBucket> = new Map();
  private globalConfig: RateLimitConfig;
  private requests: Map<string, number> = new Map();

  constructor(globalConfig: RateLimitConfig) {
    this.globalConfig = globalConfig;
  }

  // Get rate limiter for specific endpoint
  private getLimiter(key: string): RateLimiter {
    if (!this.limiters.has(key)) {
      this.limiters.set(key, new RateLimiter(this.globalConfig));
    }
    return this.limiters.get(key)!;
  }

  // Get token bucket for specific user
  private getTokenBucket(key: string): TokenBucket {
    if (!this.tokenBuckets.has(key)) {
      // Default: 100 tokens, refill at 1 token per second
      this.tokenBuckets.set(key, new TokenBucket(100, 1));
    }
    return this.tokenBuckets.get(key)!;
  }

  // Check rate limit with different strategies
  public async checkLimit(options: {
    key?: string;
    userId?: string;
    endpoint?: string;
    strategy?: 'sliding-window' | 'fixed-window' | 'token-bucket';
  }): Promise<RateLimitResult> {
    const limiterKey = `${options.endpoint || 'default'}:${options.userId || 'anonymous'}`;
    const limiter = options.strategy === 'token-bucket'
      ? this.getTokenBucket(options.userId || limiterKey)
      : this.getLimiter(limiterKey);

    // For token bucket strategy
    if (options.strategy === 'token-bucket') {
      const bucket = limiter as TokenBucket;
      const allowed = bucket.consume();

      return {
        allowed,
        remainingRequests: bucket.getAvailableTokens(),
        retryAfter: allowed ? undefined : Date.now() + 60000, // Retry in 1 minute
        retryAfterMs: allowed ? 0 : 60000,
        headers: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': bucket.getAvailableTokens().toString(),
          'X-RateLimit-Reset': new Date(Date.now() + 100000).toISOString(),
        },
      };
    }

    return limiter.checkLimit(options.key);
  }

  // Middleware for Express-like APIs
  public middleware() {
    return async (req: any, res: any, next: any) => {
      const key = req.user?.id || req.ip || 'anonymous';
      const endpoint = req.route?.path || req.path;

      const result = await this.checkLimit({ key, endpoint });

      // Add rate limit headers
      Object.entries(result.headers).forEach(([header, value]) => {
        res.setHeader(header, value);
      });

      // Check if request is allowed
      if (!result.allowed) {
        // Return 429 Too Many Requests
        const retryAfter = result.retryAfter
          ? new Date(result.retryAfter).toUTCString()
          : new Date(Date.now() + 60000).toUTCString();

        res.setHeader('Retry-After', retryAfter);
        res.setHeader('Content-Type', 'application/json');

        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
          retryAfter,
          remainingRequests: result.remainingRequests,
          resetAfter: result.resetAfter,
        });
      }

      // Record the request
      this.requests.set(key, (this.requests.get(key) || 0) + 1);

      // Add request identifier for tracking
      req.rateLimitId = Math.random().toString(36).substring(2);

      next();
    };
  }

  // React hook for rate limiting
  export function useRateLimiter(config: RateLimitConfig) {
    const [state, setState] = useState<{
      canMakeRequest: boolean;
      remainingRequests: number;
      retryAfter: number | null;
      resetAfter: number | null;
      lastRequestTime: number | null;
    }>({
      canMakeRequest: true,
      remainingRequests: config.maxRequests,
      retryAfter: null,
      resetAfter: null,
      lastRequestTime: null,
    });

    const limiterRef = useRef<RateLimiter | null>(null);

    // Initialize rate limiter
    if (!limiterRef.current) {
      limiterRef.current = new RateLimiter(config);
    }

    const checkRateLimit = useCallback(async () => {
      const result = limiterRef.current!.checkLimit();

      setState({
        canMakeRequest: result.allowed,
        remainingRequests: result.remainingRequests,
        retryAfter: result.retryAfter || null,
        resetAfter: result.resetAfter || null,
        lastRequestTime: Date.now(),
      });

      return result;
    }, [limiterRef.current]);

    const recordRequest = useCallback((success: boolean = true) => {
      limiterRef.current?.recordRequest(success);
    }, [limiterRef.current]);

    const reset = useCallback(() => {
      limiterRef.current?.reset();
      setState({
        canMakeRequest: true,
        remainingRequests: config.maxRequests,
        retryAfter: null,
        resetAfter: null,
        lastRequestTime: null,
      });
    }, [limiterRef.current]);

    return {
      ...state,
      checkRateLimit,
      recordRequest,
      reset,
      isRateLimited: !state.canMakeRequest,
    };
  }
}

// Pre-configured rate limiters for common use cases
export const rateLimiters = {
  // API endpoints
  api: new RateLimiter({
    maxRequests: 100,
    windowMs: 60000, // 1 minute
    strategy: 'sliding-window',
  }),

  // Authentication endpoints
  auth: new RateLimiter({
    maxRequests: 5,
    windowMs: 900000, // 15 minutes
    strategy: 'fixed-window',
    skipSuccessfulRequests: true, // Don't count successful logins
  }),

  // File uploads
  upload: new RateLimiter({
    maxRequests: 10,
    windowMs: 3600000, // 1 hour
    strategy: 'sliding-window',
  }),

  // Password reset
  passwordReset: new RateLimiter({
    maxRequests: 3,
    windowMs: 3600000, // 1 hour
    strategy: 'fixed-window',
  }),

  // Contact forms
  contact: new RateLimiter({
    maxRequests: 5,
    windowMs: 600000, // 10 minutes
    strategy: 'sliding-window',
  }),

  // Search endpoints
  search: new RateLimiter({
    maxRequests: 50,
    windowMs: 60000, // 1 minute
    strategy: 'sliding-window',
  }),

  // Booking endpoints
  booking: new RateLimiter({
    maxRequests: 20,
    windowMs: 300000, // 5 minutes
    strategy: 'sliding-window',
  }),
};

// Rate limiting utilities
export const rateLimitUtils = {
  // Get client IP (for server-side)
  getClientIP(req: any): string {
    return req.ip ||
           req.connection?.remoteAddress ||
           req.socket?.remoteAddress ||
           req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           req.headers['x-real-ip'] ||
           'unknown';
  },

  // Get user identifier
  getUserIdentifier(req: any): string {
    // Try different methods to identify the user
    return req.user?.id ||
           req.session?.id ||
           req.cookies?.userId ||
           this.getClientIP(req);
  },

  // Format retry after time
  formatRetryAfter(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toUTCString();
  },

  // Check if should skip rate limiting
  shouldSkip(req: any): boolean {
    // Skip for health checks, static assets, etc.
    return req.path?.startsWith('/health') ||
           req.path?.startsWith('/static') ||
           req.path?.startsWith('/assets') ||
           req.method === 'OPTIONS';
  },

  // Standard rate limit error response
  createErrorResponse(result: RateLimitResult) {
    return {
      status: 429,
      body: {
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.',
        retryAfter: result.retryAfter,
        remainingRequests: result.remainingRequests,
        resetAfter: result.resetAfter,
      },
      headers: result.headers || {},
    };
  },
};