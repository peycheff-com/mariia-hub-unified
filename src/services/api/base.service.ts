// import { logger, measurePerformance } from '../logger.service';

// Stub implementations to avoid build issues
const logger = {
  debug: (msg: string, ctx?: any) => console.debug(msg, ctx),
  warn: (msg: string, ctx?: any) => console.warn(msg, ctx),
  error: (msg: string, err?: any, ctx?: any) => console.error(msg, err, ctx),
  info: (msg: string, ctx?: any) => console.info(msg, ctx),
  trace: (msg: string, ctx?: any) => console.trace(msg, ctx),
  errorBoundary: (error: Error, errorInfo: any) => console.error('Error boundary:', error, errorInfo)
};

const measurePerformance = async <T>(
  operation: string,
  fn: () => Promise<T>,
  context?: Record<string, any>
): Promise<T> => {
  const start = performance.now();
  try {
    const result = await fn();
    const end = performance.now();
    console.debug(`Operation ${operation} took ${end - start}ms`);
    return result;
  } catch (error) {
    const end = performance.now();
    console.error(`Operation ${operation} failed after ${end - start}ms:`, error);
    throw error;
  }
};

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
  timestamp: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export abstract class BaseService {
  protected baseUrl: string;
  protected defaultHeaders: Record<string, string>;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || '/api';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  protected async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: { ...this.defaultHeaders, ...options.headers },
      ...options,
    };

    try {
      logger.debug(`Making API request`, { url, method: options.method || 'GET' });

      const response = await measurePerformance(
        `API: ${options.method || 'GET'} ${endpoint}`,
        () => fetch(url, config)
      );

      if (!response.ok) {
        const errorData = await this.parseErrorResponse(response);
        const error = this.createError(errorData, response.status);

        logger.warn(`API request failed`, {
          url,
          status: response.status,
          error: errorData,
        });

        throw error;
      }

      const data = await response.json();

      logger.debug(`API request successful`, {
        url,
        status: response.status,
      });

      return data;
    } catch (error) {
      if (error instanceof Error && error.message.includes('API:')) {
        throw error;
      }

      logger.error(`API request error`, error instanceof Error ? error : new Error(String(error)), {
        url,
        method: options.method || 'GET',
      });

      throw this.createError({
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'NETWORK_ERROR',
      });
    }
  }

  protected async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = params ? `${endpoint}?${new URLSearchParams(params).toString()}` : endpoint;
    return this.request<T>(url, { method: 'GET' });
  }

  protected async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  protected async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  protected async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  protected async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  protected async upload<T>(endpoint: string, file: File, additionalData?: Record<string, any>): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }

    return this.request<T>(endpoint, {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set multipart headers
    });
  }

  protected handleError(error: any): ApiError {
    if (error instanceof Error) {
      return {
        message: error.message,
        code: 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString(),
        details: {
          stack: error.stack,
        },
      };
    }

    if (typeof error === 'object' && error !== null) {
      return {
        message: error.message || 'Unknown error',
        code: error.code || 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString(),
        details: error,
      };
    }

    return {
      message: String(error),
      code: 'UNKNOWN_ERROR',
      timestamp: new Date().toISOString(),
    };
  }

  private async parseErrorResponse(response: Response): Promise<any> {
    try {
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch {
        return { message: text };
      }
    } catch {
      return { message: `HTTP ${response.status}` };
    }
  }

  private createError(errorData: any, status?: number): ApiError {
    return {
      message: errorData.message || 'Request failed',
      code: errorData.code || `HTTP_${status}`,
      details: errorData.details || errorData,
      timestamp: new Date().toISOString(),
    };
  }

  // Retry logic with exponential backoff
  protected async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000,
    backoffFactor: number = 2
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (attempt === maxRetries) {
          logger.error(`Operation failed after ${maxRetries} attempts`, lastError);
          throw lastError;
        }

        const delay = baseDelay * Math.pow(backoffFactor, attempt - 1);

        logger.warn(`Operation failed, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`, {
          error: lastError instanceof Error ? lastError.message : String(lastError),
          attempt,
          maxRetries,
        });

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  // Cache management
  protected cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  protected setCache(key: string, data: any, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  protected getCache<T>(key: string): T | null {
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    const isExpired = Date.now() - cached.timestamp > cached.ttl;

    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  protected clearCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  // Request deduplication
  private pendingRequests = new Map<string, Promise<any>>();

  protected async deduplicateRequest<T>(key: string, operation: () => Promise<T>): Promise<T> {
    if (this.pendingRequests.has(key)) {
      logger.debug(`Request deduplicated: ${key}`);
      return this.pendingRequests.get(key);
    }

    const promise = operation().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }
}