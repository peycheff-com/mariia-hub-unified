// OPTIMIZED BOOKING SERVICE
// High-performance booking operations with caching, batch processing, and conflict prevention

import { supabaseOptimized } from '@/integrations/supabase/client-optimized';
import { performanceMonitor } from '@/lib/performance-monitoring-system';
import { realtimeManager } from '@/integrations/supabase/realtime-optimized';

interface OptimizedBookingOptions {
  useCache?: boolean;
  cacheTTL?: number;
  enableRealtime?: boolean;
  priority?: 'high' | 'normal' | 'low';
}

interface BatchBookingOperation {
  type: 'create' | 'update' | 'cancel';
  data: any;
  priority?: 'high' | 'normal' | 'low';
}

interface BookingConflict {
  type: 'time_slot' | 'resource' | 'capacity';
  message: string;
  conflictingBookings: any[];
  alternativeSlots?: any[];
}

interface BookingMetrics {
  totalBookings: number;
  successRate: number;
  averageBookingTime: number;
  conflictRate: number;
  cancellationRate: number;
  revenueMetrics: {
    totalRevenue: number;
    averageBookingValue: number;
    revenueByServiceType: Record<string, number>;
  };
}

class OptimizedBookingService {
  private static instance: OptimizedBookingService;
  private bookingCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private batchQueue: BatchBookingOperation[] = [];
  private batchTimer?: NodeJS.Timeout;
  private isProcessingBatch = false;
  private metrics: BookingMetrics;

  private constructor() {
    this.metrics = {
      totalBookings: 0,
      successRate: 0,
      averageBookingTime: 0,
      conflictRate: 0,
      cancellationRate: 0,
      revenueMetrics: {
        totalRevenue: 0,
        averageBookingValue: 0,
        revenueByServiceType: {}
      }
    };

    this.initializeBatchProcessor();
  }

  static getInstance(): OptimizedBookingService {
    if (!OptimizedBookingService.instance) {
      OptimizedBookingService.instance = new OptimizedBookingService();
    }
    return OptimizedBookingService.instance;
  }

  // Optimized availability checking with advanced caching
  async checkAvailability(
    serviceId: string,
    startDate: string,
    endDate: string,
    options: OptimizedBookingOptions = {}
  ): Promise<{ availableSlots: any[]; conflicts: any[]; cached: boolean }> {
    const startTime = performance.now();
    const { useCache = true, cacheTTL = 300000 } = options; // 5 minutes default cache

    const cacheKey = `availability_${serviceId}_${startDate}_${endDate}`;

    // Check cache first
    if (useCache) {
      const cached = this.bookingCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < cached.ttl) {
        performanceMonitor.recordQueryPerformance('check_availability_cache', 1, 1, true);
        return { ...cached.data, cached: true };
      }
    }

    try {
      // Use optimized Supabase client
      const result = await supabaseOptimized.queryWithMonitoring(
        'check_availability_optimized',
        () => supabaseOptimized.baseClient.rpc('check_availability_optimized', {
          p_service_id: serviceId,
          p_start_date: startDate,
          p_end_date: endDate
        }),
        { cacheKey, cacheTTL }
      );

      if (result.error) {
        throw result.error;
      }

      const availableSlots = result.data || [];
      const conflicts = await this.detectBookingConflicts(serviceId, startDate, endDate);

      const response = {
        availableSlots,
        conflicts,
        cached: false
      };

      // Cache successful result
      this.bookingCache.set(cacheKey, {
        data: response,
        timestamp: Date.now(),
        ttl: cacheTTL
      });

      const queryTime = performance.now() - startTime;
      performanceMonitor.recordQueryPerformance('check_availability', queryTime, availableSlots.length, false);

      return response;

    } catch (error) {
      const queryTime = performance.now() - startTime;
      performanceMonitor.recordQueryPerformance('check_availability_error', queryTime, 0, false);
      throw error;
    }
  }

  // Optimized booking creation with conflict prevention
  async createBooking(
    bookingData: any,
    options: OptimizedBookingOptions = {}
  ): Promise<{ success: boolean; bookingId?: string; conflicts?: BookingConflict[] }> {
    const startTime = performance.now();
    const { enableRealtime = true, priority = 'normal' } = options;

    try {
      // Pre-booking validation
      const validationResult = await this.validateBookingData(bookingData);
      if (!validationResult.valid) {
        return { success: false, conflicts: validationResult.conflicts };
      }

      // Create hold on time slot
      const holdResult = await this.createTemporaryHold(
        bookingData.service_id,
        bookingData.booking_date,
        bookingData.start_time,
        bookingData.session_id
      );

      if (!holdResult.success) {
        return { success: false, conflicts: holdResult.conflicts };
      }

      // Use optimized booking function
      const bookingResult = await supabaseOptimized.queryWithMonitoring(
        'create_booking_optimized',
        () => supabaseOptimized.baseClient.rpc('create_booking_optimized', {
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

      if (bookingResult.error || !bookingResult.data) {
        // Release hold on failure
        await this.releaseTemporaryHold(holdResult.holdId!);
        throw bookingResult.error || new Error('Booking creation failed');
      }

      const bookingRecord = bookingResult.data[0];
      const success = bookingRecord.success;

      if (success) {
        // Update metrics
        this.updateBookingMetrics(true, performance.now() - startTime, bookingData.total_amount);

        // Set up real-time subscription
        if (enableRealtime) {
          realtimeManager.subscribeToUserBookings(
            bookingData.user_id,
            (payload) => this.handleRealtimeBookingUpdate(payload)
          );
        }

        // Invalidate relevant caches
        this.invalidateAvailabilityCache(bookingData.service_id, bookingData.booking_date);

        return { success: true, bookingId: bookingRecord.booking_id };
      } else {
        // Release hold on booking failure
        await this.releaseTemporaryHold(holdResult.holdId!);
        return { success: false, conflicts: [{ type: 'time_slot', message: bookingRecord.error_message, conflictingBookings: [] }] };
      }

    } catch (error) {
      const bookingTime = performance.now() - startTime;
      this.updateBookingMetrics(false, bookingTime, 0);
      throw error;
    }
  }

  // Batch booking operations for improved performance
  async createBatchBookings(
    bookings: any[],
    options: { processImmediately?: boolean; priority?: 'high' | 'normal' } = {}
  ): Promise<{ results: any[]; errors: any[] }> {
    const { processImmediately = false, priority = 'normal' } = options;

    if (processImmediately) {
      return this.processBatchImmediately(bookings);
    } else {
      // Add to batch queue
      bookings.forEach(booking => {
        this.batchQueue.push({
          type: 'create',
          data: booking,
          priority
        });
      });

      return { results: [], errors: [], queued: true };
    }
  }

  private async processBatchImmediately(bookings: any[]): Promise<{ results: any[]; errors: any[] }> {
    const results = [];
    const errors = [];

    // Process bookings with conflict detection
    const sortedBookings = bookings.sort((a, b) => {
      // Prioritize by date and time
      const dateCompare = new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime();
      if (dateCompare !== 0) return dateCompare;
      return a.start_time.localeCompare(b.start_time);
    });

    for (const booking of sortedBookings) {
      try {
        const result = await this.createBooking(booking, { enableRealtime: false });
        if (result.success) {
          results.push({ bookingId: result.bookingId, ...booking });
        } else {
          errors.push({ booking, conflicts: result.conflicts });
        }
      } catch (error) {
        errors.push({ booking, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    return { results, errors };
  }

  private initializeBatchProcessor() {
    // Process batch queue every 30 seconds
    this.batchTimer = setInterval(() => {
      if (this.batchQueue.length > 0 && !this.isProcessingBatch) {
        this.processBatchQueue();
      }
    }, 30000);
  }

  private async processBatchQueue() {
    if (this.isProcessingBatch || this.batchQueue.length === 0) return;

    this.isProcessingBatch = true;

    try {
      // Sort by priority
      this.batchQueue.sort((a, b) => {
        const priorityOrder = { high: 3, normal: 2, low: 1 };
        return (priorityOrder[b.priority || 'normal'] || 0) - (priorityOrder[a.priority || 'normal'] || 0);
      });

      // Process in batches of 5
      const batchSize = 5;
      const batch = this.batchQueue.splice(0, batchSize);

      for (const operation of batch) {
        try {
          if (operation.type === 'create') {
            await this.createBooking(operation.data, { enableRealtime: false });
          }
          // Add other operation types as needed
        } catch (error) {
          console.error('[BOOKING] Batch operation failed:', error);
        }
      }

    } catch (error) {
      console.error('[BOOKING] Batch processing failed:', error);
    } finally {
      this.isProcessingBatch = false;
    }
  }

  // Conflict detection and resolution
  private async detectBookingConflicts(
    serviceId: string,
    startDate: string,
    endDate: string
  ): Promise<BookingConflict[]> {
    try {
      const { data: existingBookings } = await supabaseOptimized.baseClient
        .from('bookings')
        .select('*')
        .eq('service_id', serviceId)
        .gte('booking_date', startDate)
        .lte('booking_date', endDate)
        .in('status', ['pending', 'confirmed']);

      const conflicts: BookingConflict[] = [];

      // Check for time slot conflicts
      for (const booking of existingBookings || []) {
        // Add conflict detection logic here
        conflicts.push({
          type: 'time_slot',
          message: `Time slot conflict with existing booking ${booking.id}`,
          conflictingBookings: [booking]
        });
      }

      return conflicts;

    } catch (error) {
      console.error('[BOOKING] Conflict detection failed:', error);
      return [];
    }
  }

  private async validateBookingData(bookingData: any): Promise<{ valid: boolean; conflicts?: BookingConflict[] }> {
    const conflicts: BookingConflict[] = [];

    // Check required fields
    if (!bookingData.service_id || !bookingData.user_id || !bookingData.booking_date || !bookingData.start_time) {
      conflicts.push({
        type: 'time_slot',
        message: 'Missing required booking information',
        conflictingBookings: []
      });
    }

    // Check booking date is in the future
    const bookingDate = new Date(bookingData.booking_date);
    if (bookingDate < new Date().setHours(0, 0, 0, 0)) {
      conflicts.push({
        type: 'time_slot',
        message: 'Booking date cannot be in the past',
        conflictingBookings: []
      });
    }

    // Check service availability
    try {
      const availability = await this.checkAvailability(
        bookingData.service_id,
        bookingData.booking_date,
        bookingData.booking_date
      );

      const requestedSlot = availability.availableSlots.find(
        slot => slot.start_time === bookingData.start_time
      );

      if (!requestedSlot) {
        conflicts.push({
          type: 'time_slot',
          message: 'Requested time slot is not available',
          conflictingBookings: [],
          alternativeSlots: availability.availableSlots.slice(0, 3)
        });
      }
    } catch (error) {
      conflicts.push({
        type: 'time_slot',
        message: 'Unable to verify availability',
        conflictingBookings: []
      });
    }

    return { valid: conflicts.length === 0, conflicts: conflicts.length > 0 ? conflicts : undefined };
  }

  // Temporary hold management
  private async createTemporaryHold(
    serviceId: string,
    bookingDate: string,
    startTime: string,
    sessionId: string
  ): Promise<{ success: boolean; holdId?: string; conflicts?: BookingConflict[] }> {
    try {
      const { data, error } = await supabaseOptimized.baseClient
        .from('holds')
        .insert({
          service_id: serviceId,
          date: bookingDate,
          time_slot: startTime,
          session_id: sessionId,
          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
        })
        .select()
        .single();

      if (error) {
        return { success: false, conflicts: [{ type: 'time_slot', message: error.message, conflictingBookings: [] }] };
      }

      return { success: true, holdId: data.id };

    } catch (error) {
      return { success: false, conflicts: [{ type: 'time_slot', message: 'Failed to create hold', conflictingBookings: [] }] };
    }
  }

  private async releaseTemporaryHold(holdId: string): Promise<void> {
    try {
      await supabaseOptimized.baseClient
        .from('holds')
        .delete()
        .eq('id', holdId);
    } catch (error) {
      console.error('[BOOKING] Failed to release hold:', error);
    }
  }

  // Real-time update handler
  private handleRealtimeBookingUpdate(payload: any) {
    console.log('[BOOKING] Real-time update received:', payload);
    // Invalidate relevant caches
    if (payload.new?.service_id && payload.new?.booking_date) {
      this.invalidateAvailabilityCache(payload.new.service_id, payload.new.booking_date);
    }
  }

  // Cache management
  private invalidateAvailabilityCache(serviceId: string, date: string) {
    const keysToDelete = [];
    for (const [key] of this.bookingCache) {
      if (key.startsWith(`availability_${serviceId}_`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.bookingCache.delete(key));
  }

  // Metrics management
  private updateBookingMetrics(success: boolean, bookingTime: number, revenue: number) {
    this.metrics.totalBookings++;

    if (success) {
      this.metrics.revenueMetrics.totalRevenue += revenue;

      // Update success rate
      const successfulBookings = this.metrics.totalBookings - this.metrics.conflictRate * this.metrics.totalBookings / 100;
      this.metrics.successRate = (successfulBookings / this.metrics.totalBookings) * 100;

      // Update average booking value
      this.metrics.revenueMetrics.averageBookingValue =
        this.metrics.revenueMetrics.totalRevenue / (this.metrics.totalBookings * this.metrics.successRate / 100);
    }

    // Update average booking time
    this.metrics.averageBookingTime =
      (this.metrics.averageBookingTime * (this.metrics.totalBookings - 1) + bookingTime) / this.metrics.totalBookings;
  }

  // Public API methods
  async getUserBookings(
    userId: string,
    filters: any = {},
    options: OptimizedBookingOptions = {}
  ) {
    return supabaseOptimized.getUserBookings(userId, filters);
  }

  async cancelBooking(bookingId: string, reason?: string) {
    const startTime = performance.now();

    try {
      const { data, error } = await supabaseOptimized.baseClient
        .from('bookings')
        .update({
          status: 'cancelled',
          cancellation_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;

      // Update cancellation rate
      this.metrics.cancellationRate = (this.metrics.cancellationRate * (this.metrics.totalBookings - 1) + 1) / this.metrics.totalBookings;

      const queryTime = performance.now() - startTime;
      performanceMonitor.recordQueryPerformance('cancel_booking', queryTime, 1);

      return { success: true, booking: data };

    } catch (error) {
      const queryTime = performance.now() - startTime;
      performanceMonitor.recordQueryPerformance('cancel_booking_error', queryTime, 0);
      throw error;
    }
  }

  getMetrics(): BookingMetrics {
    return { ...this.metrics };
  }

  clearCache() {
    this.bookingCache.clear();
  }

  async cleanupExpiredEntities() {
    try {
      await supabaseOptimized.baseClient.rpc('cleanup_expired_entities');
    } catch (error) {
      console.error('[BOOKING] Cleanup failed:', error);
    }
  }
}

// Export singleton instance
export const optimizedBookingService = OptimizedBookingService.getInstance();

// Convenience exports
export const checkAvailability = (serviceId: string, startDate: string, endDate: string, options?: OptimizedBookingOptions) =>
  optimizedBookingService.checkAvailability(serviceId, startDate, endDate, options);

export const createBooking = (bookingData: any, options?: OptimizedBookingOptions) =>
  optimizedBookingService.createBooking(bookingData, options);

export const createBatchBookings = (bookings: any[], options?: any) =>
  optimizedBookingService.createBatchBookings(bookings, options);

export const getUserBookings = (userId: string, filters?: any, options?: OptimizedBookingOptions) =>
  optimizedBookingService.getUserBookings(userId, filters, options);

export const cancelBooking = (bookingId: string, reason?: string) =>
  optimizedBookingService.cancelBooking(bookingId, reason);

export const getBookingMetrics = () => optimizedBookingService.getMetrics();

// Development debugging
if (import.meta.env.DEV) {
  (window as any).bookingDebug = {
    getMetrics: getBookingMetrics,
    clearCache: () => optimizedBookingService.clearCache(),
    cleanup: () => optimizedBookingService.cleanupExpiredEntities()
  };
}