/**
 * Secure API Gateway
 *
 * Centralized handler for all external API calls with:
 * - Authentication and credential management
 * - Circuit breaker pattern
 * - Exponential backoff retry logic
 * - Rate limiting
 * - Request/response logging
 * - Performance monitoring
 */

import { createClient } from '@supabase/supabase-js';

import { credentialManager, DecryptedCredentials } from '@/lib/secure-credentials';
import { getRequiredEnvVar } from '@/lib/runtime-env';

// Circuit breaker states
export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

// Service configuration
export interface ServiceConfig {
  name: string;
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  circuitThreshold: number;
  circuitTimeout: number;
  rateLimitRpm: number;
  requiresAuth: boolean;
  authType: 'bearer' | 'basic' | 'custom';
}

// API request options
export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, any>;
  timeout?: number;
  retries?: number;
  bypassCircuitBreaker?: boolean;
}

// API response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
  headers?: Record<string, string>;
  responseTime: number;
  fromCache: boolean;
  circuitState?: CircuitState;
  attempts: number;
}

// Circuit breaker interface
interface CircuitBreaker {
  state: CircuitState;
  failureCount: number;
  lastFailureTime?: Date;
  nextRetryTime?: Date;
  successCount: number;
  lastSuccessTime?: Date;
}

// Rate limiter
class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  canMakeRequest(service: string, limitRpm: number): boolean {
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window

    if (!this.requests.has(service)) {
      this.requests.set(service, []);
    }

    const serviceRequests = this.requests.get(service)!;

    // Remove old requests outside the window
    const validRequests = serviceRequests.filter(time => time > windowStart);
    this.requests.set(service, validRequests);

    // Check if under limit
    if (validRequests.length < limitRpm) {
      validRequests.push(now);
      return true;
    }

    return false;
  }

  getRemainingRequests(service: string, limitRpm: number): number {
    const now = Date.now();
    const windowStart = now - 60000;

    const serviceRequests = this.requests.get(service) || [];
    const validRequests = serviceRequests.filter(time => time > windowStart);

    return Math.max(0, limitRpm - validRequests.length);
  }
}

// Cache for responses
class ResponseCache {
  private cache: Map<string, { data: any; expiry: Date }> = new Map();

  set(key: string, data: any, ttlMs: number = 300000): void { // Default 5 minutes
    this.cache.set(key, {
      data,
      expiry: new Date(Date.now() + ttlMs)
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (item.expiry < new Date()) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }
}

// Main API Gateway class
export class SecureApiGateway {
  private supabase = createClient(
    getRequiredEnvVar('SUPABASE_URL', ['VITE_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL']),
    getRequiredEnvVar('SUPABASE_SERVICE_ROLE_KEY', ['VITE_SUPABASE_SERVICE_ROLE_KEY'])
  );

  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private rateLimiter = new RateLimiter();
  private cache = new ResponseCache();

  // Service configurations
  private serviceConfigs: Record<string, ServiceConfig> = {
    stripe: {
      name: 'Stripe',
      baseUrl: 'https://api.stripe.com/v1',
      timeout: 10000,
      retryAttempts: 3,
      retryDelay: 1000,
      circuitThreshold: 5,
      circuitTimeout: 60000,
      rateLimitRpm: 100,
      requiresAuth: true,
      authType: 'bearer'
    },
    booksy: {
      name: 'Booksy',
      baseUrl: 'https://api.booksy.com/api/v1',
      timeout: 15000,
      retryAttempts: 2,
      retryDelay: 2000,
      circuitThreshold: 3,
      circuitTimeout: 120000,
      rateLimitRpm: 1000,
      requiresAuth: true,
      authType: 'bearer'
    },
    whatsapp: {
      name: 'WhatsApp',
      baseUrl: 'https://graph.facebook.com/v18.0',
      timeout: 10000,
      retryAttempts: 3,
      retryDelay: 1500,
      circuitThreshold: 5,
      circuitTimeout: 30000,
      rateLimitRpm: 50,
      requiresAuth: true,
      authType: 'bearer'
    },
    resend: {
      name: 'Resend',
      baseUrl: 'https://api.resend.com',
      timeout: 10000,
      retryAttempts: 3,
      retryDelay: 1000,
      circuitThreshold: 5,
      circuitTimeout: 60000,
      rateLimitRpm: 100,
      requiresAuth: true,
      authType: 'bearer'
    },
    openai: {
      name: 'OpenAI',
      baseUrl: 'https://api.openai.com/v1',
      timeout: 30000,
      retryAttempts: 2,
      retryDelay: 2000,
      circuitThreshold: 3,
      circuitTimeout: 60000,
      rateLimitRpm: 60,
      requiresAuth: true,
      authType: 'bearer'
    },
    anthropic: {
      name: 'Anthropic',
      baseUrl: 'https://api.anthropic.com/v1',
      timeout: 30000,
      retryAttempts: 2,
      retryDelay: 2000,
      circuitThreshold: 3,
      circuitTimeout: 60000,
      rateLimitRpm: 1000,
      requiresAuth: true,
      authType: 'custom'
    }
  };

  /**
   * Make a secure API request
   */
  async request<T = any>(
    service: string,
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const config = this.serviceConfigs[service];
    if (!config) {
      return {
        success: false,
        error: `Unknown service: ${service}`,
        responseTime: 0,
        fromCache: false,
        attempts: 0
      };
    }

    const startTime = Date.now();
    const cacheKey = `${service}:${endpoint}:${JSON.stringify(options)}`;

    // Check cache first for GET requests
    if (!options.body && config.name !== 'Stripe') {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return {
          success: true,
          data: cached,
          responseTime: Date.now() - startTime,
          fromCache: true,
          attempts: 1
        };
      }
    }

    // Check rate limit
    if (!this.rateLimiter.canMakeRequest(service, config.rateLimitRpm)) {
      return {
        success: false,
        error: `Rate limit exceeded for ${service}`,
        responseTime: Date.now() - startTime,
        fromCache: false,
        attempts: 0
      };
    }

    // Check circuit breaker
    const circuitState = this.getCircuitState(service);
    if (circuitState.state === CircuitState.OPEN && !options.bypassCircuitBreaker) {
      const now = new Date();
      if (circuitState.nextRetryTime && now < circuitState.nextRetryTime) {
        return {
          success: false,
          error: `Circuit breaker open for ${service}. Retry at ${circuitState.nextRetryTime}`,
          circuitState: circuitState.state,
          responseTime: Date.now() - startTime,
          fromCache: false,
          attempts: 0
        };
      }
    }

    // Get credentials
    let credentials: DecryptedCredentials | null = null;
    if (config.requiresAuth) {
      credentials = await credentialManager.getCredentials(service);
      if (!credentials) {
        this.recordFailure(service);
        return {
          success: false,
          error: `No credentials found for ${service}`,
          responseTime: Date.now() - startTime,
          fromCache: false,
          attempts: 0
        };
      }
    }

    // Prepare request
    const url = `${config.baseUrl}${endpoint}`;
    const headers = this.prepareHeaders(config, credentials, options.headers);

    // Execute request with retries
    const response = await this.executeRequestWithRetry<T>(
      service,
      url,
      {
        method: options.method || 'GET',
        headers,
        body: options.body,
        timeout: options.timeout || config.timeout
      },
      config.retryAttempts,
      config.retryDelay
    );

    // Update circuit breaker based on response
    if (response.success) {
      this.recordSuccess(service);

      // Cache successful GET requests
      if (!options.body && response.data) {
        this.cache.set(cacheKey, response.data);
      }

      // Update service health
      await this.updateServiceHealth(service, 'healthy', response.responseTime);
    } else {
      this.recordFailure(service);
      await this.updateServiceHealth(service, 'unhealthy', response.responseTime, response.error);
    }

    return {
      ...response,
      responseTime: Date.now() - startTime,
      circuitState: this.getCircuitState(service).state
    };
  }

  /**
   * Execute HTTP request with retry logic
   */
  private async executeRequestWithRetry<T>(
    service: string,
    url: string,
    request: {
      method: string;
      headers: Record<string, string>;
      body?: any;
      timeout: number;
    },
    maxRetries: number,
    baseDelay: number
  ): Promise<ApiResponse<T>> {
    let lastError: Error | null = null;
    let attempts = 0;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      attempts = attempt + 1;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), request.timeout);

        const response = await fetch(url, {
          method: request.method,
          headers: request.headers,
          body: request.body ? JSON.stringify(request.body) : undefined,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          let data: T;
          const contentType = response.headers.get('content-type');

          if (contentType?.includes('application/json')) {
            data = await response.json();
          } else if (contentType?.includes('text/')) {
            data = (await response.text()) as any;
          } else {
            data = (await response.blob()) as any;
          }

          return {
            success: true,
            data,
            statusCode: response.status,
            headers: Object.fromEntries(response.headers.entries()),
            attempts,
            fromCache: false,
            responseTime: 0 // Will be set by caller
          };
        } else {
          const errorText = await response.text();
          lastError = new Error(`HTTP ${response.status}: ${errorText}`);

          // Don't retry on client errors (4xx)
          if (response.status >= 400 && response.status < 500) {
            break;
          }
        }
      } catch (error) {
        lastError = error as Error;

        // Don't retry on abort
        if (error instanceof Error && error.name === 'AbortError') {
          break;
        }
      }

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Request failed',
      attempts,
      fromCache: false,
      responseTime: 0 // Will be set by caller
    };
  }

  /**
   * Prepare request headers with authentication
   */
  private prepareHeaders(
    config: ServiceConfig,
    credentials: DecryptedCredentials | null,
    additionalHeaders?: Record<string, string>
  ): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Mariia-Hub/1.0',
      ...additionalHeaders
    };

    if (config.requiresAuth && credentials) {
      switch (config.authType) {
        case 'bearer':
          headers['Authorization'] = `Bearer ${credentials.apiSecret}`;
          break;
        case 'basic':
          headers['Authorization'] = `Basic ${btoa(`${credentials.apiKey}:${credentials.apiSecret}`)}`;
          break;
        case 'custom':
          if (config.name === 'Anthropic') {
            headers['x-api-key'] = credentials.apiSecret;
            headers['anthropic-version'] = '2023-06-01';
          }
          break;
      }
    }

    return headers;
  }

  /**
   * Get circuit breaker state for a service
   */
  private getCircuitState(service: string): CircuitBreaker {
    if (!this.circuitBreakers.has(service)) {
      this.circuitBreakers.set(service, {
        state: CircuitState.CLOSED,
        failureCount: 0,
        successCount: 0
      });
    }
    return this.circuitBreakers.get(service)!;
  }

  /**
   * Record a successful request
   */
  private recordSuccess(service: string): void {
    const breaker = this.getCircuitState(service);
    breaker.successCount++;
    breaker.lastSuccessTime = new Date();

    switch (breaker.state) {
      case CircuitState.OPEN:
        // Check if we can transition to half-open
        const config = this.serviceConfigs[service];
        if (breaker.nextRetryTime && new Date() >= breaker.nextRetryTime) {
          breaker.state = CircuitState.HALF_OPEN;
          breaker.failureCount = 0;
        }
        break;
      case CircuitState.HALF_OPEN:
        // After a few successes, close the circuit
        if (breaker.successCount >= 3) {
          breaker.state = CircuitState.CLOSED;
          breaker.failureCount = 0;
          breaker.successCount = 0;
        }
        break;
    }
  }

  /**
   * Record a failed request
   */
  private recordFailure(service: string): void {
    const breaker = this.getCircuitState(service);
    const config = this.serviceConfigs[service];

    breaker.failureCount++;
    breaker.lastFailureTime = new Date();

    if (breaker.failureCount >= config.circuitThreshold) {
      breaker.state = CircuitState.OPEN;
      breaker.nextRetryTime = new Date(Date.now() + config.circuitTimeout);
    }
  }

  /**
   * Update service health in database
   */
  private async updateServiceHealth(
    service: string,
    status: 'healthy' | 'degraded' | 'unhealthy',
    responseTime?: number,
    error?: string
  ): Promise<void> {
    try {
      const { error: dbError } = await this.supabase.rpc('upsert_service_health', {
        p_service: service,
        p_status: status,
        p_response_time_ms: responseTime,
        p_last_error: error
      });

      if (dbError) {
        console.error('Failed to update service health:', dbError);
      }
    } catch (error) {
      console.error('Error updating service health:', error);
    }
  }

  /**
   * Get service health status
   */
  async getServiceHealth(service?: string): Promise<any> {
    try {
      let query = this.supabase.from('service_health').select('*');

      if (service) {
        query = query.eq('service', service);
      }

      const { data, error } = await query.order('last_check', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to get service health:', error);
      return null;
    }
  }

  /**
   * Reset circuit breaker for a service
   */
  resetCircuitBreaker(service: string): void {
    const breaker = this.getCircuitState(service);
    breaker.state = CircuitState.CLOSED;
    breaker.failureCount = 0;
    breaker.successCount = 0;
    breaker.lastFailureTime = undefined;
    breaker.nextRetryTime = undefined;
  }

  /**
   * Get current rate limit status
   */
  getRateLimitStatus(service: string): {
    remaining: number;
    limit: number;
    resetIn: number;
  } {
    const config = this.serviceConfigs[service];
    const remaining = this.rateLimiter.getRemainingRequests(service, config.rateLimitRpm);

    return {
      remaining,
      limit: config.rateLimitRpm,
      resetIn: 60 // Reset every minute
    };
  }

  /**
   * Clear response cache
   */
  clearCache(service?: string): void {
    if (service) {
      // Implementation would clear only service-specific cache
      this.cache.clear();
    } else {
      this.cache.clear();
    }
  }
}

// Export singleton instance
export const apiGateway = new SecureApiGateway();

// Convenience methods for common services
export const stripeApi = {
  createPaymentIntent: (data: any) =>
    apiGateway.request('stripe', '/payment_intents', {
      method: 'POST',
      body: data
    }),

  confirmPayment: (paymentIntentId: string) =>
    apiGateway.request('stripe', `/payment_intents/${paymentIntentId}/confirm`, {
      method: 'POST'
    }),

  getCustomer: (customerId: string) =>
    apiGateway.request('stripe', `/customers/${customerId}`)
};

export const booksyApi = {
  getAvailability: (serviceId: string, date: string) =>
    apiGateway.request('booksy', `/services/${serviceId}/availability`, {
      params: { date }
    }),

  createBooking: (data: any) =>
    apiGateway.request('booksy', '/bookings', {
      method: 'POST',
      body: data
    })
};

export const whatsappApi = {
  sendMessage: (to: string, message: string) =>
    apiGateway.request('whatsapp', `/messages`, {
      method: 'POST',
      body: {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: message }
      }
    }),

  markAsRead: (messageId: string) =>
    apiGateway.request('whatsapp', `/messages`, {
      method: 'POST',
      body: {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId
      }
    })
};

export const emailApi = {
  sendEmail: (data: {
    to: string[];
    subject: string;
    html: string;
    from?: string;
  }) =>
    apiGateway.request('resend', '/emails', {
      method: 'POST',
      body: data
    })
};
