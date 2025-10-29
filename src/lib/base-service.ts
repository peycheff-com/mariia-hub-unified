import { ApiResponse, ApiError } from '@/types/shared';

import { env } from './env';

// Custom error classes
export class APIError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: any;

  constructor(status: number, code: string, message: string, details?: any) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class NetworkError extends Error {
  public readonly retryable: boolean;

  constructor(message: string, retryable = true) {
    super(message);
    this.name = 'NetworkError';
    this.retryable = retryable;
  }
}

export class ValidationError extends Error {
  public readonly field: string;
  public readonly value: any;

  constructor(field: string, value: any, message: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
  }
}

// Base service class with centralized error handling
export abstract class BaseService {
  protected baseURL: string;
  protected timeout: number;
  protected retryAttempts: number;
  protected retryDelay: number;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || env.VITE_APP_URL;
    this.timeout = env.VITE_API_TIMEOUT;
    this.retryAttempts = 3;
    this.retryDelay = 1000;
  }

  // HTTP request with retry logic
  protected async request<T>(
    endpoint: string,
    options: RequestInit & { timeout?: number; skipRetry?: boolean } = {}
  ): Promise<T> {
    const { timeout = this.timeout, skipRetry = false, ...fetchOptions } = options;
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;

    let lastError: Error;

    for (let attempt = 0; attempt <= this.retryAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            ...fetchOptions.headers,
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new APIError(
            response.status,
            errorData.code || 'HTTP_ERROR',
            errorData.message || `HTTP ${response.status}: ${response.statusText}`,
            errorData.details
          );
        }

        const data = await response.json();
        return this.handleSuccess(data);
      } catch (error) {
        lastError = error as Error;

        // Don't retry on certain errors
        if (skipRetry || this.shouldNotRetry(error)) {
          throw this.handleError(error);
        }

        // Wait before retrying (exponential backoff)
        if (attempt < this.retryAttempts) {
          await this.delay(Math.pow(2, attempt) * this.retryDelay);
        }
      }
    }

    throw this.handleError(lastError!);
  }

  // HTTP method helpers
  protected async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', ...options });
  }

  protected async post<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  protected async put<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  protected async patch<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  protected async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', ...options });
  }

  // Error handling
  protected handleError(error: Error): never {
    if (error instanceof APIError) {
      // Log API errors with context
      this.logError('API Error', {
        status: error.status,
        code: error.code,
        message: error.message,
        details: error.details,
        stack: error.stack,
      });
      throw error;
    }

    if (error instanceof NetworkError) {
      // Log network errors
      this.logError('Network Error', {
        message: error.message,
        retryable: error.retryable,
        stack: error.stack,
      });
      throw error;
    }

    if (error instanceof ValidationError) {
      // Log validation errors
      this.logError('Validation Error', {
        field: error.field,
        value: error.value,
        message: error.message,
        stack: error.stack,
      });
      throw error;
    }

    if (error.name === 'AbortError') {
      throw new NetworkError('Request was aborted', false);
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new NetworkError('Network connection failed');
    }

    // Unknown error
    this.logError('Unknown Error', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });

    throw new APIError(500, 'UNKNOWN_ERROR', error.message);
  }

  // Success response handling
  protected handleSuccess<T>(response: any): T {
    // Handle different response formats
    if (response.data !== undefined) {
      return response.data as T;
    }
    if (response.success !== undefined) {
      if (!response.success) {
        throw new APIError(400, response.error?.code || 'UNKNOWN_ERROR', response.error?.message || 'Request failed');
      }
      return response.data || response;
    }
    return response as T;
  }

  // Retry logic
  private shouldNotRetry(error: Error): boolean {
    // Don't retry on client errors (4xx)
    if (error instanceof APIError && error.status >= 400 && error.status < 500) {
      return true;
    }

    // Don't retry on validation errors
    if (error instanceof ValidationError) {
      return true;
    }

    // Don't retry on abort
    if (error.name === 'AbortError') {
      return true;
    }

    // Don't retry on network errors that aren't retryable
    if (error instanceof NetworkError && !error.retryable) {
      return true;
    }

    return false;
  }

  // Utility functions
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private logError(type: string, details: Record<string, any>): void {
    // In development, log to console
    if (env.NODE_ENV === 'development') {
      console.error(`[${type}]`, details);
    }

    // In production, send to error tracking service
    if (env.NODE_ENV === 'production' && env.VITE_SENTRY_DSN) {
      // Integration with Sentry would go here
      // For now, just use console.error
      console.error(`[${type}]`, details);
    }
  }

  // Request caching
  protected async cachedRequest<T>(
    key: string,
    requestFn: () => Promise<T>,
    ttl: number = env.VITE_CACHE_TTL
  ): Promise<T> {
    // Try to get from cache
    const cached = localStorage.getItem(key);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < ttl) {
        return data;
      }
    }

    // Make request and cache result
    const data = await requestFn();
    localStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));

    return data;
  }

  // Request deduplication
  private pendingRequests = new Map<string, Promise<any>>();

  protected async deduplicatedRequest<T>(
    key: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }

    const request = requestFn();
    this.pendingRequests.set(key, request);

    try {
      const result = await request;
      return result;
    } finally {
      this.pendingRequests.delete(key);
    }
  }

  // Cleanup method for when service is no longer needed
  cleanup(): void {
    // Cancel all pending requests
    this.pendingRequests.clear();
  }
}

// Service factory for creating typed services
export function createService<T extends BaseService>(
  ServiceClass: new (...args: any[]) => T,
  ...args: ConstructorParameters<typeof ServiceClass>
): T {
  return new ServiceClass(...args);
}

// Higher-order function for service methods with error handling
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  errorHandler?: (error: Error) => void
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      if (errorHandler) {
        errorHandler(error as Error);
      }
      throw error;
    }
  };
}

// Error reporting utility
export const errorReporter = {
  report: (error: Error, context?: Record<string, any>) => {
    // Send to error tracking service
    if (env.VITE_SENTRY_DSN) {
      // Sentry integration would go here
    }

    // Fallback to console
    console.error('Error reported:', { error, context });
  },

  reportAPIError: (error: APIError, request?: { url: string; method: string }) => {
    errorReporter.report(error, {
      type: 'API Error',
      request,
      status: error.status,
      code: error.code,
    });
  },

  reportNetworkError: (error: NetworkError, request?: { url: string; method: string }) => {
    errorReporter.report(error, {
      type: 'Network Error',
      request,
      retryable: error.retryable,
    });
  },

  reportValidationError: (error: ValidationError, form?: string) => {
    errorReporter.report(error, {
      type: 'Validation Error',
      form,
      field: error.field,
      value: error.value,
    });
  },
};