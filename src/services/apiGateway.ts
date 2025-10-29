import { supabase } from '@/integrations/supabase/client';
import { cacheService } from './cacheService';
import { bookingDomainService } from './bookingDomainService';
import { webSocketService } from './websocketService';
import { logger } from '@/lib/logger';

// API configuration
const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_URL || '/api/v1',
  timeout: 10000,
  retries: 3,
  retryDelay: 1000,
};

// Error types
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Request/Response types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status: number;
  success: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Request options
export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  cache?: boolean;
  cacheTTL?: number;
  retries?: number;
  signal?: AbortSignal;
}

class ApiGateway {
  private static instance: ApiGateway;
  private requestInterceptors: Array<(config: any) => any> = [];
  private responseInterceptors: Array<(response: any) => any> = [];

  static getInstance(): ApiGateway {
    if (!ApiGateway.instance) {
      ApiGateway.instance = new ApiGateway();
    }
    return ApiGateway.instance;
  }

  // Interceptor management
  addRequestInterceptor(interceptor: (config: any) => any): void {
    this.requestInterceptors.push(interceptor);
  }

  addResponseInterceptor(interceptor: (response: any) => any): void {
    this.responseInterceptors.push(interceptor);
  }

  // Core request method
  private async request<T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      body,
      headers = {},
      params,
      cache = false,
      cacheTTL = 300,
      retries = API_CONFIG.retries,
      signal,
    } = options;

    // Build URL
    const url = new URL(endpoint, API_CONFIG.baseUrl);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    // Check cache for GET requests
    if (method === 'GET' && cache) {
      const cacheKey = url.toString();
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Build config
    let config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      signal,
    };

    if (body && method !== 'GET' && method !== 'HEAD') {
      config.body = JSON.stringify(body);
    }

    // Apply request interceptors
    for (const interceptor of this.requestInterceptors) {
      config = interceptor(config);
    }

    let lastError: Error | null = null;

    // Retry logic
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url.toString(), config);
        let data: any;

        // Handle response
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text();
        }

        const result: ApiResponse<T> = {
          data: data.data || data,
          message: data.message,
          status: response.status,
          success: response.ok,
        };

        // Apply response interceptors
        for (const interceptor of this.responseInterceptors) {
          Object.assign(result, interceptor(result));
        }

        // Cache successful GET responses
        if (method === 'GET' && response.ok && cache) {
          await cacheService.set(url.toString(), result, cacheTTL);
        }

        if (!response.ok) {
          throw new ApiError(
            result.message || data.error || 'Request failed',
            response.status,
            data.code,
            data.details
          );
        }

        return result;
      } catch (error) {
        lastError = error as Error;

        // Don't retry on 4xx errors (except 429)
        if (error instanceof ApiError && error.status >= 400 && error.status < 500 && error.status !== 429) {
          throw error;
        }

        // Don't retry on abort
        if (error instanceof DOMException && error.name === 'AbortError') {
          throw error;
        }

        // Wait before retry
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, API_CONFIG.retryDelay * Math.pow(2, attempt)));
        }
      }
    }

    throw lastError;
  }

  // Booking endpoints
  bookings = {
    // Get bookings with filtering
    list: async (params?: {
      page?: number;
      limit?: number;
      status?: string;
      serviceType?: string;
      dateFrom?: string;
      dateTo?: string;
      userId?: string;
    }): Promise<PaginatedResponse<any>> => {
      return this.request('/bookings', { params, cache: true, cacheTTL: 60 });
    },

    // Get single booking
    get: async (id: string): Promise<ApiResponse<any>> => {
      return this.request(`/bookings/${id}`, { cache: true, cacheTTL: 300 });
    },

    // Create booking
    create: async (data: {
      serviceId: string;
      timeSlot: any;
      details: any;
      location?: string;
    }): Promise<ApiResponse<any>> => {
      const response = await this.request('/bookings', {
        method: 'POST',
        body: data,
      });

      // Emit real-time event
      if (response.success) {
        webSocketService.send('booking:created', {
          bookingId: response.data.id,
          serviceId: data.serviceId,
          status: response.data.status,
        });
      }

      return response;
    },

    // Update booking
    update: async (id: string, data: Partial<any>): Promise<ApiResponse<any>> => {
      const response = await this.request(`/bookings/${id}`, {
        method: 'PATCH',
        body: data,
      });

      // Emit real-time event
      if (response.success && data.status) {
        webSocketService.send('booking:updated', {
          bookingId: id,
          status: data.status,
        });
      }

      return response;
    },

    // Cancel booking
    cancel: async (id: string, reason?: string): Promise<ApiResponse<any>> => {
      const response = await this.request(`/bookings/${id}/cancel`, {
        method: 'POST',
        body: { reason },
      });

      // Emit real-time event
      if (response.success) {
        webSocketService.send('booking:cancelled', {
          bookingId: id,
          reason: reason || 'Cancelled by user',
        });
      }

      return response;
    },

    // Get user bookings
    forUser: async (userId: string, params?: {
      status?: string;
      limit?: number;
    }): Promise<ApiResponse<any[]>> => {
      return this.request(`/users/${userId}/bookings`, {
        params,
        cache: true,
        cacheTTL: 120,
      });
    },
  };

  // Services endpoints
  services = {
    // List services
    list: async (params?: {
      type?: string;
      active?: boolean;
      featured?: boolean;
    }): Promise<ApiResponse<any[]>> => {
      const response = await this.request('/services', { params, cache: true, cacheTTL: 3600 });

      // Cache in Redis
      if (response.success) {
        await cacheService.cacheServices(response.data);
      }

      return response;
    },

    // Get single service
    get: async (id: string): Promise<ApiResponse<any>> => {
      return this.request(`/services/${id}`, { cache: true, cacheTTL: 3600 });
    },

    // Get service availability
    availability: async (id: string, params?: {
      startDate?: string;
      endDate?: string;
      location?: string;
    }): Promise<ApiResponse<any[]>> => {
      return this.request(`/services/${id}/availability`, {
        params,
        cache: true,
        cacheTTL: 300,
      });
    },

    // Check specific slot availability
    checkSlot: async (data: {
      serviceId: string;
      date: string;
      time: string;
      duration: number;
    }): Promise<ApiResponse<{ available: boolean; reason?: string }>> => {
      return this.request('/services/check-availability', {
        method: 'POST',
        body: data,
        cache: false,
      });
    },
  };

  // Availability endpoints
  availability = {
    // Get available slots
    slots: async (params: {
      serviceId: string;
      date: string;
      location?: string;
    }): Promise<ApiResponse<any[]>> => {
      const { serviceId, date, location } = params;

      // Check cache first
      const cacheKey = `slots:${serviceId}:${date}:${location || 'studio'}`;
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      const response = await this.request('/availability/slots', {
        params,
        cache: true,
        cacheTTL: 300,
      });

      // Cache in Redis
      if (response.success) {
        await cacheService.set(cacheKey, response, 300);
      }

      return response;
    },

    // Reserve slot (create hold)
    reserve: async (data: {
      serviceId: string;
      slotId: string;
      userId: string;
      sessionId?: string;
    }): Promise<ApiResponse<{ holdId: string; expiresAt: string }>> => {
      const response = await this.request('/availability/reserve', {
        method: 'POST',
        body: data,
      });

      // Cache hold
      if (response.success) {
        await cacheService.cacheHold({
          slotId: data.slotId,
          userId: data.userId,
          expiresAt: new Date(response.data.expiresAt),
          sessionId: data.sessionId || '',
        });

        // Emit real-time event
        webSocketService.send('slot:reserved', {
          slotId: data.slotId,
          userId: data.userId,
          expiresAt: response.data.expiresAt,
        });
      }

      return response;
    },

    // Release slot (remove hold)
    release: async (holdId: string): Promise<ApiResponse<void>> => {
      const response = await this.request(`/availability/holds/${holdId}`, {
        method: 'DELETE',
      });

      // Remove from cache
      await cacheService.removeHoldFromCache(holdId);

      // Emit real-time event
      webSocketService.send('slot:released', { slotId: holdId });

      return response;
    },

    // Batch create availability (admin)
    createBatch: async (data: {
      serviceType: string;
      daysOfWeek: number[];
      timeSlots: Array<{
        startTime: string;
        endTime: string;
        location: string;
      }>;
      startDate: string;
      endDate: string;
    }): Promise<ApiResponse<any[]>> => {
      const response = await this.request('/admin/availability/batch', {
        method: 'POST',
        body: data,
      });

      // Invalidate affected date caches
      if (response.success) {
        const startDate = new Date(data.startDate);
        const endDate = new Date(data.endDate);
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          await cacheService.invalidateDate(d, data.serviceType as any);
        }

        // Emit real-time event
        webSocketService.send('availability:updated', {
          serviceType: data.serviceType,
          dateRange: [startDate, endDate],
        });
      }

      return response;
    },
  };

  // Admin endpoints
  admin = {
    // Get dashboard stats
    stats: async (): Promise<ApiResponse<any>> => {
      const cached = await cacheService.getAdminStatsFromCache();
      if (cached) {
        return { data: cached, status: 200, success: true };
      }

      const response = await this.request('/admin/stats', {
        cache: true,
        cacheTTL: 60,
      });

      // Cache stats
      if (response.success) {
        await cacheService.cacheAdminStats(response.data);
      }

      return response;
    },

    // Get calendar view
    calendar: async (params: {
      serviceType?: string;
      startDate: string;
      endDate: string;
      view: 'month' | 'week' | 'day';
    }): Promise<ApiResponse<any>> => {
      const { serviceType, startDate, endDate } = params;
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Check cache
      const cached = await cacheService.getCalendarViewFromCache(
        serviceType as any,
        start,
        end
      );
      if (cached) {
        return { data: cached, status: 200, success: true };
      }

      const response = await this.request('/admin/calendar', {
        params,
        cache: true,
        cacheTTL: 900,
      });

      // Cache calendar view
      if (response.success) {
        await cacheService.cacheCalendarView(
          serviceType as any,
          start,
          end,
          response.data
        );
      }

      return response;
    },

    // Manage availability
    availability: {
      create: async (data: any): Promise<ApiResponse<any>> => {
        return this.availability.createBatch(data);
      },

      update: async (id: string, data: any): Promise<ApiResponse<any>> => {
        return this.request(`/admin/availability/${id}`, {
          method: 'PATCH',
          body: data,
        });
      },

      delete: async (id: string): Promise<ApiResponse<void>> => {
        return this.request(`/admin/availability/${id}`, {
          method: 'DELETE',
        });
      },

      list: async (params?: {
        serviceType?: string;
        date?: string;
      }): Promise<ApiResponse<any[]>> => {
        return this.request('/admin/availability', { params });
      },
    },

    // Bookings management
    bookings: {
      updateStatus: async (
        id: string,
        status: string,
        reason?: string
      ): Promise<ApiResponse<any>> => {
        const response = await this.request(`/admin/bookings/${id}/status`, {
          method: 'PATCH',
          body: { status, reason },
        });

        // Emit real-time event
        if (response.success) {
          if (status === 'cancelled') {
            webSocketService.send('booking:cancelled', {
              bookingId: id,
              reason: reason || 'Cancelled by admin',
            });
          } else {
            webSocketService.send('booking:updated', {
              bookingId: id,
              status,
            });
          }
        }

        return response;
      },

      export: async (params: {
        format: 'csv' | 'excel';
        filters?: any;
      }): Promise<Blob> => {
        const response = await fetch(`${API_CONFIG.baseUrl}/admin/bookings/export`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
        });

        if (!response.ok) {
          throw new ApiError('Export failed', response.status);
        }

        return response.blob();
      },
    },
  };

  // Health check
  async health(): Promise<ApiResponse<{
    api: boolean;
    database: boolean;
    cache: boolean;
    websocket: boolean;
  }>> {
    const checks = await Promise.allSettled([
      fetch(`${API_CONFIG.baseUrl}/health`),
      supabase.from('services').select('id').limit(1),
      cacheService.isHealthy(),
      Promise.resolve(webSocketService.isConnected()),
    ]);

    return {
      data: {
        api: checks[0].status === 'fulfilled',
        database: checks[1].status === 'fulfilled',
        cache: checks[2].status === 'fulfilled' && checks[2].value,
        websocket: checks[3].status === 'fulfilled' && checks[3].value,
      },
      status: 200,
      success: true,
    };
  }
}

// Export singleton instance
export const apiGateway = ApiGateway.getInstance();

// Default interceptors
apiGateway.addRequestInterceptor((config) => {
  // Add auth token
  const token = localStorage.getItem('supabase.auth.token');
  if (token) {
    try {
      const parsed = JSON.parse(token);
      if (parsed.access_token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${parsed.access_token}`,
        };
      }
    } catch (e) {
      logger.error('Failed to parse auth token:', e);
    }
  }

  return config;
});

apiGateway.addResponseInterceptor((response) => {
  // Handle common error patterns
  if (response.status === 401) {
    // Redirect to login
    window.location.href = '/login';
  }

  return response;
});

// Export convenience methods
export const {
  bookings,
  services,
  availability,
  admin,
} = apiGateway;
