import {
  ApiClient,
  ApiClientConfig,
  ApiResponse,
  HttpMethod,
  RequestConfig,
  FileUploadOptions
} from '../types/api';
import { MariiaHubSDKError, ErrorFactory } from '../types/errors';

/**
 * HTTP client implementation
 */
export class HttpClient implements ApiClient {
  private config: ApiClientConfig;
  private baseURL: string;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];

  constructor(config: ApiClientConfig) {
    this.config = { ...config };
    this.baseURL = config.baseURL;
  }

  /**
   * Make GET request
   */
  async get<T = any>(
    path: string,
    params?: Record<string, any>,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>('GET', path, undefined, { ...config, params });
  }

  /**
   * Make POST request
   */
  async post<T = any>(
    path: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>('POST', path, data, config);
  }

  /**
   * Make PUT request
   */
  async put<T = any>(
    path: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', path, data, config);
  }

  /**
   * Make PATCH request
   */
  async patch<T = any>(
    path: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', path, data, config);
  }

  /**
   * Make DELETE request
   */
  async delete<T = any>(
    path: string,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', path, undefined, config);
  }

  /**
   * Upload file
   */
  async upload<T = any>(
    path: string,
    options: FileUploadOptions,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();

    // Add file to form data
    if (options.file instanceof File) {
      formData.append('file', options.file, options.filename || options.file.name);
    } else {
      formData.append('file', options.file, options.filename || 'blob');
    }

    // Add metadata
    if (options.metadata) {
      formData.append('metadata', JSON.stringify(options.metadata));
    }

    // Create upload configuration
    const uploadConfig: RequestConfig = {
      ...config,
      headers: {
        ...config?.headers,
        // Don't set Content-Type for FormData - browser will set it with boundary
      },
      onProgress: options.onProgress
    };

    return this.request<T>('POST', path, formData, uploadConfig);
  }

  /**
   * Download file
   */
  async download(
    path: string,
    filename?: string,
    config?: RequestConfig
  ): Promise<Blob> {
    const requestConfig: RequestConfig = {
      ...config,
      responseType: 'blob'
    };

    const response = await this.request('GET', path, undefined, requestConfig);

    if (response.success && response.data instanceof Blob) {
      // Create download link if filename provided
      if (filename && typeof window !== 'undefined') {
        const url = window.URL.createObjectURL(response.data);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }

      return response.data;
    }

    throw new MariiaHubSDKError(
      'Download failed - invalid response',
      'DOWNLOAD_FAILED'
    );
  }

  /**
   * Make raw request
   */
  async request<T = any>(
    method: HttpMethod,
    path: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    let requestConfig = this.mergeConfig(config);
    let url = this.buildUrl(path, requestConfig.params);

    // Apply request interceptors
    for (const interceptor of this.requestInterceptors) {
      requestConfig = await interceptor.fn(requestConfig);
    }

    try {
      // Make HTTP request
      const response = await this.makeHttpRequest<T>(method, url, data, requestConfig);

      // Apply response success interceptors
      let processedResponse = response;
      for (const interceptor of this.responseInterceptors) {
        if (interceptor.success) {
          processedResponse = await interceptor.success(processedResponse);
        }
      }

      return processedResponse;

    } catch (error) {
      // Apply response error interceptors
      let processedError = error;
      for (const interceptor of this.responseInterceptors) {
        if (interceptor.error) {
          try {
            processedError = await interceptor.error(processedError);
          } catch (interceptorError) {
            // If interceptor throws, continue with original error
            processedError = error;
          }
        }
      }

      throw processedError;
    }
  }

  /**
   * Add request interceptor
   */
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
    // Sort by order
    this.requestInterceptors.sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  /**
   * Add response interceptor
   */
  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
    // Sort by order
    this.responseInterceptors.sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  /**
   * Update client configuration
   */
  updateConfig(config: Partial<ApiClientConfig>): void {
    this.config = { ...this.config, ...config };
    if (config.baseURL) {
      this.baseURL = config.baseURL;
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): ApiClientConfig {
    return { ...this.config };
  }

  /**
   * Build URL with query parameters
   */
  private buildUrl(path: string, params?: Record<string, any>): string {
    let url = `${this.baseURL}${path}`;

    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams();

      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => searchParams.append(key, String(v)));
          } else {
            searchParams.append(key, String(value));
          }
        }
      }

      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    return url;
  }

  /**
   * Merge configuration with defaults
   */
  private mergeConfig(config?: RequestConfig): RequestConfig {
    const defaults: RequestConfig = {
      timeout: this.config.timeout,
      retries: this.config.retries,
      retryDelay: this.config.retryDelay,
      headers: { ...this.config.headers }
    };

    return {
      ...defaults,
      ...config,
      headers: {
        ...defaults.headers,
        ...config?.headers
      }
    };
  }

  /**
   * Make actual HTTP request
   */
  private async makeHttpRequest<T>(
    method: HttpMethod,
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timeoutId = config?.timeout
      ? setTimeout(() => controller.abort(), config.timeout)
      : null;

    try {
      const fetchOptions: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...config?.headers
        },
        signal: controller.signal
      };

      // Add body for POST, PUT, PATCH requests
      if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
        if (data instanceof FormData) {
          fetchOptions.body = data;
          // Don't set Content-Type for FormData
          delete (fetchOptions.headers as any)['Content-Type'];
        } else {
          fetchOptions.body = JSON.stringify(data);
        }
      }

      // Execute request with retry logic
      const response = await this.executeWithRetry(
        () => fetch(url, fetchOptions),
        config?.retries || this.config.retries || 0,
        config?.retryDelay || this.config.retryDelay || 1000
      );

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Parse response
      return await this.parseResponse<T>(response);

    } catch (error) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Handle different error types
      if (error.name === 'AbortError') {
        throw new MariiaHubSDKError(
          'Request timeout',
          'REQUEST_TIMEOUT',
          408
        );
      }

      if (error instanceof MariiaHubSDKError) {
        throw error;
      }

      // Handle network errors
      if (error instanceof TypeError) {
        throw new MariiaHubSDKError(
          `Network error: ${error.message}`,
          'NETWORK_ERROR',
          undefined,
          { originalError: error.message }
        );
      }

      throw new MariiaHubSDKError(
        `Request failed: ${error.message}`,
        'REQUEST_FAILED',
        undefined,
        { originalError: error.message }
      );
    }
  }

  /**
   * Execute request with retry logic
   */
  private async executeWithRetry<T>(
    requestFn: () => Promise<T>,
    maxRetries: number,
    baseDelay: number
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;

        // Don't retry on certain error types
        if (this.shouldNotRetry(error)) {
          throw error;
        }

        // Don't retry after the last attempt
        if (attempt === maxRetries) {
          throw error;
        }

        // Calculate delay with exponential backoff
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  /**
   * Check if error should not be retried
   */
  private shouldNotRetry(error: any): boolean {
    if (error.status === 401 || error.status === 403) {
      return true; // Don't retry auth errors
    }

    if (error.status === 404) {
      return true; // Don't retry not found errors
    }

    if (error.status === 422) {
      return true; // Don't retry validation errors
    }

    if (error.status === 429) {
      return false; // Retry rate limit errors
    }

    if (error.status >= 500) {
      return false; // Retry server errors
    }

    // For network errors, retry
    if (error instanceof TypeError) {
      return false;
    }

    return true; // Don't retry unknown errors by default
  }

  /**
   * Parse HTTP response
   */
  private async parseResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const contentType = response.headers.get('content-type');
    let data: any;

    try {
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else if (contentType?.includes('text/')) {
        data = await response.text();
      } else {
        data = await response.blob();
      }
    } catch (parseError) {
      throw new MariiaHubSDKError(
        `Failed to parse response: ${parseError.message}`,
        'INVALID_RESPONSE_FORMAT',
        response.status
      );
    }

    // Handle API error responses
    if (!response.ok) {
      const errorData = typeof data === 'object' ? data : { message: response.statusText };
      throw ErrorFactory.fromApiResponse({
        ...errorData,
        statusCode: response.status
      });
    }

    // Return success response
    return {
      success: true,
      data,
      meta: {
        requestId: response.headers.get('x-request-id') || undefined,
        rateLimit: this.parseRateLimitHeaders(response.headers)
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Parse rate limit headers
   */
  private parseRateLimitHeaders(headers: Headers): any {
    const limit = headers.get('x-ratelimit-limit');
    const remaining = headers.get('x-ratelimit-remaining');
    const reset = headers.get('x-ratelimit-reset');
    const retryAfter = headers.get('retry-after');

    if (limit || remaining || reset || retryAfter) {
      return {
        limit: limit ? parseInt(limit) : undefined,
        remaining: remaining ? parseInt(remaining) : undefined,
        reset: reset ? parseInt(reset) : undefined,
        retryAfter: retryAfter ? parseInt(retryAfter) : undefined
      };
    }

    return undefined;
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Request interceptor interface
 */
export interface RequestInterceptor {
  fn: (config: RequestConfig) => Promise<RequestConfig>;
  order?: number;
}

/**
 * Response interceptor interface
 */
export interface ResponseInterceptor {
  success?: (response: ApiResponse) => Promise<ApiResponse>;
  error?: (error: any) => Promise<any>;
  order?: number;
}