import { createHash } from 'crypto';

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
  retryableErrors?: string[];
  retryableStatusCodes?: number[];
  onRetry?: (attempt: number, error: Error, delay: number) => void;
}

export interface RetryOptions {
  key?: string;
  customConfig?: Partial<RetryConfig>;
  context?: Record<string, any>;
}

export class RetryManager {
  private static instance: RetryManager;
  private defaultConfig: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    jitter: true,
    retryableErrors: [
      'NETWORK_ERROR',
      'TIMEOUT',
      'CONNECTION_REFUSED',
      'ECONNRESET',
      'ENOTFOUND',
      'ECONNREFUSED',
      'ETIMEDOUT'
    ],
    retryableStatusCodes: [408, 429, 500, 502, 503, 504]
  };

  private attempts = new Map<string, number>();
  private lastAttempt = new Map<string, number>();
  private circuitBreakers = new Map<string, CircuitBreaker>();

  static getInstance(): RetryManager {
    if (!RetryManager.instance) {
      RetryManager.instance = new RetryManager();
    }
    return RetryManager.instance;
  }

  async execute<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const config = { ...this.defaultConfig, ...options.customConfig };
    const key = options.key || this.generateKey(fn.toString());

    // Check circuit breaker
    const circuitBreaker = this.getCircuitBreaker(key);
    if (!circuitBreaker.canExecute()) {
      throw new Error(`Circuit breaker is open for ${key}`);
    }

    let lastError: Error;
    let totalDelay = 0;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        const result = await fn();
        // Success - reset counters
        circuitBreaker.recordSuccess();
        this.resetAttempts(key);
        return result;
      } catch (error) {
        lastError = error as Error;

        if (!this.shouldRetry(error, attempt, config)) {
          circuitBreaker.recordFailure();
          throw lastError;
        }

        const delay = this.calculateDelay(attempt, config);
        totalDelay += delay;

        config.onRetry?.(attempt, lastError, delay);

        console.warn(`Retry attempt ${attempt}/${config.maxAttempts} for ${key}, delay: ${delay}ms`, {
          error: lastError.message,
          totalDelay
        });

        await this.sleep(delay);
      }
    }

    // Max attempts exhausted
    circuitBreaker.recordFailure();
    throw lastError!;
  }

  private shouldRetry(error: Error, attempt: number, config: RetryConfig): boolean {
    if (attempt >= config.maxAttempts) {
      return false;
    }

    // Check error type
    if (error.name && config.retryableErrors?.includes(error.name)) {
      return true;
    }

    // Check HTTP status code for fetch errors
    if ('status' in error && typeof error.status === 'number') {
      return config.retryableStatusCodes?.includes(error.status) || false;
    }

    // Check error message
    const message = error.message.toLowerCase();
    const retryablePatterns = [
      'network',
      'timeout',
      'connection',
      'fetch',
      'abort',
      'interrupted'
    ];

    return retryablePatterns.some(pattern => message.includes(pattern));
  }

  private calculateDelay(attempt: number, config: RetryConfig): number {
    let delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
    delay = Math.min(delay, config.maxDelay);

    if (config.jitter) {
      // Add randomness to prevent thundering herd
      delay = delay * (0.5 + Math.random() * 0.5);
    }

    return Math.floor(delay);
  }

  private generateKey(functionString: string): string {
    return createHash('md5').update(functionString).digest('hex').substring(0, 8);
  }

  private getCircuitBreaker(key: string): CircuitBreaker {
    if (!this.circuitBreakers.has(key)) {
      this.circuitBreakers.set(key, new CircuitBreaker(key));
    }
    return this.circuitBreakers.get(key)!;
  }

  private resetAttempts(key: string): void {
    this.attempts.delete(key);
    this.lastAttempt.delete(key);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public methods for monitoring
  getStats() {
    return {
      activeRetries: this.attempts.size,
      circuitBreakers: Array.from(this.circuitBreakers.entries()).map(([key, cb]) => ({
        key,
        state: cb.getState(),
        stats: cb.getStats()
      }))
    };
  }

  resetCircuitBreaker(key: string): void {
    const cb = this.circuitBreakers.get(key);
    if (cb) {
      cb.reset();
    }
  }

  resetAll(): void {
    this.attempts.clear();
    this.lastAttempt.clear();
    this.circuitBreakers.clear();
  }
}

class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;
  private nextAttempt = 0;

  // Configuration
  private readonly failureThreshold = 5;
  private readonly successThreshold = 3;
  private readonly timeout = 60000; // 1 minute
  private readonly monitoringPeriod = 300000; // 5 minutes

  constructor(private readonly key: string) {}

  canExecute(): boolean {
    const now = Date.now();

    switch (this.state) {
      case 'CLOSED':
        return true;

      case 'OPEN':
        if (now >= this.nextAttempt) {
          this.state = 'HALF_OPEN';
          this.successCount = 0;
          return true;
        }
        return false;

      case 'HALF_OPEN':
        return true;

      default:
        return false;
    }
  }

  recordSuccess(): void {
    const now = Date.now();

    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.reset();
      }
    } else if (this.state === 'CLOSED') {
      // Track success rate in closed state
      const recentFailures = this.getRecentFailures(now);
      if (recentFailures === 0) {
        this.failureCount = Math.max(0, this.failureCount - 1);
      }
    }
  }

  recordFailure(): void {
    const now = Date.now();
    this.lastFailureTime = now;
    this.failureCount++;

    if (this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
      this.nextAttempt = now + this.timeout;
    } else if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = now + this.timeout;
      console.warn(`Circuit breaker OPEN for ${this.key} after ${this.failureCount} failures`);
    }
  }

  getState(): string {
    return this.state;
  }

  getStats() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      nextAttempt: this.nextAttempt,
      timeUntilRetry: Math.max(0, this.nextAttempt - Date.now())
    };
  }

  reset(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
    this.nextAttempt = 0;
  }

  private getRecentFailures(now: number): number {
    // Check if failures are within the monitoring period
    if (now - this.lastFailureTime > this.monitoringPeriod) {
      return 0;
    }
    return this.failureCount;
  }
}

// Export singleton instance
export const retryManager = RetryManager.getInstance();

// Convenience wrapper function
export function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  return retryManager.execute(fn, options);
}

// Higher-order component for API calls
export function createRetryableOperation<T extends any[], R>(
  operation: (...args: T) => Promise<R>,
  config?: Partial<RetryConfig>
) {
  return (...args: T): Promise<R> => {
    return retryManager.execute(() => operation(...args), {
      customConfig: config,
      key: operation.name
    });
  };
}