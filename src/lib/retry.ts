import { log } from './logger';

export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  shouldRetry?: (error: any, attempt: number) => boolean;
  onRetry?: (error: any, attempt: number, delay: number) => void;
}

const defaultOptions: Required<RetryOptions> = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffFactor: 2,
  shouldRetry: (error, attempt) => {
    // Retry on network errors, timeouts, and 5xx status codes
    if (error.name === 'NetworkError' || error.name === 'TimeoutError') {
      return true;
    }
    if (error.status >= 500 && error.status < 600) {
      return true;
    }
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      return true;
    }
    return false;
  },
  onRetry: (error, attempt, delay) => {
    log.warn(`Retrying operation (attempt ${attempt}) after ${delay}ms`, { error: error.message });
  },
};

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...defaultOptions, ...options };
  let lastError: any;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      const result = await operation();
      if (attempt > 1) {
        log.info(`Operation succeeded on attempt ${attempt}`);
      }
      return result;
    } catch (error) {
      lastError = error;

      // Check if we should retry
      if (attempt === opts.maxAttempts || !opts.shouldRetry(error, attempt)) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        opts.baseDelay * Math.pow(opts.backoffFactor, attempt - 1),
        opts.maxDelay
      );

      // Add jitter to prevent thundering herd
      const jitter = delay * 0.1 * Math.random();
      const finalDelay = delay + jitter;

      // Call retry callback
      opts.onRetry(error, attempt, Math.round(finalDelay));

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, finalDelay));
    }
  }

  // All attempts failed
  log.error(`Operation failed after ${opts.maxAttempts} attempts`, { lastError });
  throw lastError;
}

// Specialized retry for Supabase operations
export async function withSupabaseRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  return withRetry(operation, {
    ...options,
    shouldRetry: (error, attempt) => {
      // Supabase-specific retry logic
      if (error.code === 'PGRST116') return false; // Not found - don't retry
      if (error.code === '23505') return false; // Unique violation - don't retry
      if (error.code?.startsWith('23')) return false; // Constraint violations - don't retry

      // Network and timeout errors
      if (error.code === 'PGRST301' || error.code === 'PGRST000') {
        return true;
      }

      // Default retry logic
      return defaultOptions.shouldRetry(error, attempt);
    },
  });
}

// Debounce function for rapid retries
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

// Throttle function for limiting retry frequency
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

// Circuit breaker pattern for failing operations
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000 // 1 minute
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
      log.warn(`Circuit breaker OPENED after ${this.failures} failures`);
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
    };
  }

  reset() {
    this.failures = 0;
    this.state = 'CLOSED';
    this.lastFailureTime = 0;
  }
}

export default withRetry;