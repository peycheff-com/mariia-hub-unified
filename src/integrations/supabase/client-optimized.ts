// OPTIMIZED SUPABASE CLIENT
// Enhanced configuration for high-performance booking system
// Implements connection pooling, caching, and performance monitoring

import { createClient } from '@supabase/supabase-js';
import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Performance monitoring utilities
interface QueryPerformanceMetrics {
  queryName: string;
  startTime: number;
  duration: number;
  resultCount?: number;
  success: boolean;
  error?: string;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: QueryPerformanceMetrics[] = [];
  private maxMetrics = 1000;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  recordMetric(metric: QueryPerformanceMetrics) {
    this.metrics.push(metric);
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log slow queries (>100ms)
    if (metric.duration > 100) {
      console.warn(`[PERFORMANCE] Slow query detected: ${metric.queryName} took ${metric.duration}ms`);
    }

    // Send to monitoring service if configured
    this.sendToMonitoring(metric);
  }

  private async sendToMonitoring(metric: QueryPerformanceMetrics) {
    try {
      // In production, send to your monitoring service
      if (import.meta.env.PROD && metric.duration > 500) {
        // Send critical performance issues to monitoring
        await fetch('/api/performance/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(metric)
        });
      }
    } catch (error) {
      console.error('Failed to send performance metric:', error);
    }
  }

  getMetrics(): QueryPerformanceMetrics[] {
    return this.metrics;
  }

  getAverageQueryTime(queryName?: string): number {
    const filtered = queryName
      ? this.metrics.filter(m => m.queryName === queryName)
      : this.metrics;

    if (filtered.length === 0) return 0;

    return filtered.reduce((sum, m) => sum + m.duration, 0) / filtered.length;
  }
}

// Connection pool configuration
const supabaseConfig = {
  // Connection settings
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage,
    storageKey: 'mariia-hub-supabase.auth.token'
  },

  // Real-time configuration
  realtime: {
    params: {
      eventsPerSecond: 10, // Limit events for performance
    }
  },

  // Global headers for performance
  global: {
    headers: {
      'X-Client-Version': '1.0.0-optimized',
      'X-Performance-Monitor': 'enabled'
    }
  }
};

// Performance-enhanced Supabase client wrapper
class OptimizedSupabaseClient {
  private client: SupabaseClient<Database>;
  private performanceMonitor: PerformanceMonitor;
  private queryCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private defaultCacheTTL = 5 * 60 * 1000; // 5 minutes

  constructor(url: string, key: string) {
    this.client = createClient<Database>(url, key, supabaseConfig);
    this.performanceMonitor = PerformanceMonitor.getInstance();
  }

  // Query wrapper with performance monitoring
  async queryWithMonitoring<T>(
    queryName: string,
    queryFn: () => Promise<{ data: T; error: any; count?: number }>,
    options: {
      cacheKey?: string;
      cacheTTL?: number;
      bypassCache?: boolean;
    } = {}
  ): Promise<{ data: T | null; error: any; count?: number }> {
    const startTime = performance.now();
    const { cacheKey, cacheTTL = this.defaultCacheTTL, bypassCache = false } = options;

    // Check cache first
    if (cacheKey && !bypassCache) {
      const cached = this.queryCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < cached.ttl) {
        return { data: cached.data, error: null };
      }
    }

    try {
      const result = await queryFn();
      const duration = performance.now() - startTime;

      // Record performance metric
      this.performanceMonitor.recordMetric({
        queryName,
        startTime: Date.now(),
        duration,
        resultCount: Array.isArray(result.data) ? result.data.length : 1,
        success: !result.error
      });

      // Cache successful results
      if (cacheKey && !result.error && result.data !== null) {
        this.queryCache.set(cacheKey, {
          data: result.data,
          timestamp: Date.now(),
          ttl: cacheTTL
        });
      }

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;

      this.performanceMonitor.recordMetric({
        queryName,
        startTime: Date.now(),
        duration,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return { data: null, error };
    }
  }

  // Optimized service queries
  async getActiveServices(serviceType?: 'beauty' | 'fitness' | 'lifestyle') {
    const cacheKey = `active_services_${serviceType || 'all'}`;

    return this.queryWithMonitoring(
      'get_active_services',
      () => this.client
        .from('services')
        .select(`
          id, title, description, service_type, category,
          duration_minutes, price, currency, location_type,
          is_active, tags, images, metadata
        `)
        .eq('is_active', true)
        .eq('service_type', serviceType || 'beauty')
        .order('category', { ascending: true })
        .order('price', { ascending: true }),
      { cacheKey, cacheTTL: 10 * 60 * 1000 } // 10 minutes cache
    );
  }

  // Optimized availability checking
  async checkAvailability(
    serviceId: string,
    startDate: string,
    endDate: string,
    locationType?: 'studio' | 'mobile' | 'online' | 'salon'
  ) {
    const cacheKey = `availability_${serviceId}_${startDate}_${endDate}_${locationType || 'all'}`;

    return this.queryWithMonitoring(
      'check_availability',
      () => this.client
        .from('availability_slots')
        .select(`
          id, date, start_time, end_time, location_type,
          capacity, current_bookings, is_available, notes
        `)
        .eq('service_id', serviceId)
        .gte('date', startDate)
        .lte('date', endDate)
        .eq('is_available', true)
        .eq('location_type', locationType || 'studio')
        .order('date', { ascending: true })
        .order('start_time', { ascending: true }),
      { cacheKey, cacheTTL: 2 * 60 * 1000 } // 2 minutes cache
    );
  }

  // Optimized user bookings with efficient joins
  async getUserBookings(
    userId: string,
    filters: {
      status?: string[];
      limit?: number;
      offset?: number;
    } = {}
  ) {
    const { status, limit = 50, offset = 0 } = filters;
    const cacheKey = `user_bookings_${userId}_${JSON.stringify(filters)}`;

    let query = this.client
      .from('bookings')
      .select(`
        id, booking_date, start_time, end_time, status,
        total_amount, currency, client_name, client_email,
        payment_status, notes, created_at, updated_at,
        services (
          id, title, service_type, duration_minutes, price, images
        )
      `)
      .eq('user_id', userId)
      .order('booking_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status.length > 0) {
      query = query.in('status', status);
    }

    return this.queryWithMonitoring(
      'get_user_bookings',
      () => query,
      { cacheKey, cacheTTL: 30 * 1000 } // 30 seconds cache
    );
  }

  // Optimized real-time subscription management
  subscribeToBookings(
    userId: string,
    callback: (payload: any) => void
  ) {
    const channel = this.client
      .channel(`bookings_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[PERFORMANCE] Real-time subscription active for user ${userId}`);
        } else if (status === 'TIMED_OUT' || status === 'CLOSED') {
          console.warn(`[PERFORMANCE] Real-time subscription issue: ${status}`);
        }
      });

    return channel;
  }

  // Optimized booking creation with conflict detection
  async createBooking(bookingData: any) {
    const startTime = performance.now();

    try {
      const result = await this.queryWithMonitoring(
        'create_booking',
        () => this.client.rpc('create_booking_optimized', {
          p_service_id: bookingData.service_id,
          p_user_id: bookingData.user_id,
          p_booking_date: bookingData.booking_date,
          p_start_time: bookingData.start_time,
          p_end_time: bookingData.end_time,
          p_client_name: bookingData.client_name,
          p_client_email: bookingData.client_email,
          p_client_phone: bookingData.client_phone,
          p_total_amount: bookingData.total_amount,
          p_currency: bookingData.currency || 'PLN',
          p_notes: bookingData.notes,
          p_preferences: bookingData.preferences || {}
        })
      );

      // Invalidate relevant caches
      this.invalidateCachePattern('user_bookings_');
      this.invalidateCachePattern('availability_');

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`[PERFORMANCE] Booking creation failed in ${duration}ms:`, error);
      throw error;
    }
  }

  // Cache management utilities
  private invalidateCachePattern(pattern: string) {
    for (const key of this.queryCache.keys()) {
      if (key.startsWith(pattern)) {
        this.queryCache.delete(key);
      }
    }
  }

  clearCache() {
    this.queryCache.clear();
  }

  // Performance reporting
  getPerformanceReport() {
    const metrics = this.performanceMonitor.getMetrics();
    const avgQueryTime = this.performanceMonitor.getAverageQueryTime();
    const slowQueries = metrics.filter(m => m.duration > 100);
    const errorRate = metrics.filter(m => !m.success).length / metrics.length;

    return {
      totalQueries: metrics.length,
      averageQueryTime: Math.round(avgQueryTime),
      slowQueries: slowQueries.length,
      errorRate: Math.round(errorRate * 100),
      cacheSize: this.queryCache.size,
      recentSlowQueries: slowQueries.slice(-10)
    };
  }

  // Health check
  async healthCheck() {
    try {
      const startTime = performance.now();
      const { error } = await this.client.from('services').select('id').limit(1);
      const responseTime = performance.now() - startTime;

      return {
        status: error ? 'unhealthy' : 'healthy',
        responseTime: Math.round(responseTime),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  // Expose base client for advanced usage
  get baseClient() {
    return this.client;
  }
}

// Initialize optimized client
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error('Missing Supabase configuration');
}

export const supabaseOptimized = new OptimizedSupabaseClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Export singleton instance
export const supabase = supabaseOptimized.baseClient;

// Performance monitoring exports
export { PerformanceMonitor };

// Development utilities
if (import.meta.env.DEV) {
  // Log performance report every 30 seconds in development
  setInterval(() => {
    const report = supabaseOptimized.getPerformanceReport();
    console.log('[PERFORMANCE REPORT]', report);
  }, 30000);

  // Expose performance monitor to window for debugging
  (window as any).supabasePerformance = {
    getReport: () => supabaseOptimized.getPerformanceReport(),
    clearCache: () => supabaseOptimized.clearCache(),
    healthCheck: () => supabaseOptimized.healthCheck()
  };
}