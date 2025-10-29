import { z } from 'zod';

import { supabase } from '@/integrations/supabase/client';
import {
  UserDashboardStats,
  BookingCard,
  PersonalizedRecommendation,
  CalendarEvent
} from '@/types/user';
import {
  Booking,
  ServiceType,
  LocationType,
  TimeSlot,
  Service,
  BookingDetails
} from '@/stores/bookingStore';
import { logger } from '@/lib/logger';

import {
  bookingServiceAtomic,
  BookingServiceResult,
  AvailabilityServiceResult
} from './bookingServiceAtomic';
import { conflictResolutionService } from './conflictResolutionService';
import { cacheServiceAtomic } from './cacheServiceAtomic';
import { webSocketServiceAtomic } from './websocketServiceAtomic';

// Enhanced booking service that integrates atomic operations
/**
 * @fileoverview Enhanced booking service with atomic operations
 * Integrates conflict resolution, real-time synchronization, and cache coherence
 * while maintaining backward compatibility with existing booking service interface
 *
 * @author Mariia Hub Team
 * @since 2.0.0
 */

// Enhanced types
export interface EnhancedBookingService {
  // Atomic operations
  getAvailabilityAtomic(
    serviceId: string,
    location: LocationType,
    date: Date,
    options?: any
  ): Promise<AvailabilityServiceResult>;

  reserveTimeSlotAtomic(
    serviceId: string,
    slotId: string,
    userId: string,
    startTime: Date,
    endTime: Date,
    options?: any
  ): Promise<BookingServiceResult>;

  createBookingAtomic(
    service: Service,
    timeSlot: TimeSlot,
    details: BookingDetails,
    holdId?: string,
    userId?: string,
    options?: any
  ): Promise<BookingServiceResult>;

  // Legacy compatibility methods (enhanced)
  getAvailability(serviceId: string, location: LocationType, date: Date): Promise<any>;
  createBooking(service: Service, timeSlot: TimeSlot, details: BookingDetails): Promise<any>;
  cancelBooking(bookingId: string, reason: string): Promise<any>;
  updateBooking(bookingId: string, updates: any): Promise<any>;
  getBookingById(bookingId: string): Promise<any>;
  getUserBookings(userId: string, options?: any): Promise<any>;
}

/**
 * Enhanced Booking Service Class
 *
 * Provides both atomic operations for new functionality and
 * backward-compatible legacy methods for existing code.
 */
class EnhancedBookingService implements EnhancedBookingService {
  private static instance: EnhancedBookingService;
  private initialized = false;
  private atomicServiceAvailable = false;

  static getInstance(): EnhancedBookingService {
    if (!EnhancedBookingService.instance) {
      EnhancedBookingService.instance = new EnhancedBookingService();
    }
    return EnhancedBookingService.instance;
  }

  private constructor() {
    this.initializeServices();
  }

  private async initializeServices(): Promise<void> {
    try {
      logger.info('[ENHANCED-SERVICE] Initializing enhanced booking services');

      // Initialize all atomic services
      await Promise.allSettled([
        cacheServiceAtomic.connect(),
        webSocketServiceAtomic.connect(),
        this.checkAtomicServiceHealth()
      ]);

      this.atomicServiceAvailable = true;
      this.initialized = true;

      logger.info('[ENHANCED-SERVICE] All services initialized successfully');

    } catch (error) {
      logger.error('[ENHANCED-SERVICE] Failed to initialize services', error);
      this.atomicServiceAvailable = false;
      this.initialized = true;
    }
  }

  private async checkAtomicServiceHealth(): Promise<boolean> {
    try {
      const health = await bookingServiceAtomic.getServiceHealth();
      return health.overall;
    } catch (error) {
      logger.warn('[ENHANCED-SERVICE] Atomic service health check failed:', error);
      return false;
    }
  }

  // ATOMIC OPERATIONS

  /**
   * Get service availability with atomic guarantees
   */
  async getAvailabilityAtomic(
    serviceId: string,
    location: LocationType,
    date: Date,
    options: {
      useCache?: boolean;
      optimistic?: boolean;
      version?: number;
    } = {}
  ): Promise<AvailabilityServiceResult> {
    if (!this.atomicServiceAvailable) {
      logger.warn('[ENHANCED-SERVICE] Atomic service not available, falling back to legacy');
      return await this.getAvailabilityLegacy(serviceId, location, date);
    }

    try {
      const result = await bookingServiceAtomic.getAvailabilityAtomic(
        serviceId,
        location,
        date,
        options
      );

      // Publish real-time subscription if available
      if (webSocketServiceAtomic.isHealthy()) {
        webSocketServiceAtomic.subscribe(`availability:${serviceId}`);
        webSocketServiceAtomic.subscribe(`availability:${date.toISOString().split('T')[0]}`);
      }

      return result;

    } catch (error) {
      logger.error('[ENHANCED-SERVICE] Error in atomic availability check:', error);
      return await this.getAvailabilityLegacy(serviceId, location, date);
    }
  }

  /**
   * Reserve time slot with atomic conflict resolution
   */
  async reserveTimeSlotAtomic(
    serviceId: string,
    slotId: string,
    userId: string,
    startTime: Date,
    endTime: Date,
    options: {
      maxRetries?: number;
      useOptimisticLock?: boolean;
    } = {}
  ): Promise<BookingServiceResult> {
    if (!this.atomicServiceAvailable) {
      logger.warn('[ENHANCED-SERVICE] Atomic service not available, cannot guarantee atomic reservation');
      return {
        success: false,
        transactionId: this.generateTransactionId('legacy'),
        version: Date.now(),
        conflictReason: 'Atomic service not available'
      };
    }

    try {
      const result = await bookingServiceAtomic.reserveTimeSlotAtomic(
        serviceId,
        slotId,
        userId,
        startTime,
        endTime,
        options
      );

      // Handle conflict if detected
      if (!result.success && result.conflictDetected) {
        await this.handleReservationConflict(result, {
          serviceId,
          slotId,
          userId,
          startTime,
          endTime
        });
      }

      return result;

    } catch (error) {
      logger.error('[ENHANCED-SERVICE] Error in atomic slot reservation:', error);
      return {
        success: false,
        transactionId: this.generateTransactionId('error'),
        version: Date.now(),
        conflictReason: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create booking with full transaction integrity
   */
  async createBookingAtomic(
    service: Service,
    timeSlot: TimeSlot,
    details: BookingDetails,
    holdId?: string,
    userId?: string,
    options: {
      validateAvailability?: boolean;
      useOptimisticUpdates?: boolean;
    } = {}
  ): Promise<BookingServiceResult> {
    if (!this.atomicServiceAvailable) {
      logger.warn('[ENHANCED-SERVICE] Atomic service not available, falling back to legacy booking');
      return await this.createBookingLegacy(service, timeSlot, details);
    }

    try {
      const result = await bookingServiceAtomic.createBookingAtomic(
        service,
        timeSlot,
        details,
        holdId,
        userId,
        options
      );

      // Handle booking conflict if detected
      if (!result.success && result.conflictDetected) {
        await this.handleBookingConflict(result, {
          service,
          timeSlot,
          details,
          holdId,
          userId
        });
      }

      return result;

    } catch (error) {
      logger.error('[ENHANCED-SERVICE] Error in atomic booking creation:', error);
      return await this.createBookingLegacy(service, timeSlot, details);
    }
  }

  // LEGACY COMPATIBILITY METHODS (Enhanced with atomic features)

  /**
   * Legacy getAvailability with atomic enhancements
   */
  async getAvailability(
    serviceId: string,
    location: LocationType,
    date: Date
  ): Promise<any> {
    if (this.atomicServiceAvailable) {
      try {
        const atomicResult = await this.getAvailabilityAtomic(serviceId, location, date, {
          useCache: true,
          optimistic: false
        });

        // Convert to legacy format
        return {
          success: atomicResult.success,
          slots: atomicResult.slots,
          conflicts: atomicResult.conflicts,
          version: atomicResult.version
        };

      } catch (error) {
        logger.error('[ENHANCED-SERVICE] Atomic availability failed, falling back:', error);
      }
    }

    // Fallback to legacy implementation
    return await this.getAvailabilityLegacy(serviceId, location, date);
  }

  /**
   * Legacy createBooking with atomic enhancements
   */
  async createBooking(
    service: Service,
    timeSlot: TimeSlot,
    details: BookingDetails
  ): Promise<any> {
    if (this.atomicServiceAvailable) {
      try {
        const atomicResult = await this.createBookingAtomic(
          service,
          timeSlot,
          details,
          undefined, // No hold ID
          undefined, // No user ID
          {
            validateAvailability: true,
            useOptimisticUpdates: true
          }
        );

        // Convert to legacy format
        return {
          success: atomicResult.success,
          booking: atomicResult.booking,
          error: atomicResult.conflictReason,
          requiresRetry: atomicResult.requiresRetry
        };

      } catch (error) {
        logger.error('[ENHANCED-SERVICE] Atomic booking failed, falling back:', error);
      }
    }

    // Fallback to legacy implementation
    return await this.createBookingLegacy(service, timeSlot, details);
  }

  /**
   * Enhanced cancel booking with conflict detection
   */
  async cancelBooking(
    bookingId: string,
    reason: string
  ): Promise<any> {
    try {
      // First validate booking exists and can be cancelled
      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (fetchError || !booking) {
        return { success: false, error: 'Booking not found' };
      }

      if (booking.status === 'cancelled') {
        return { success: false, error: 'Booking already cancelled' };
      }

      // Check business rules for cancellation
      const bookingDateTime = new Date(`${booking.booking_date}T${booking.booking_time}`);
      const hoursUntilBooking = (bookingDateTime.getTime() - Date.now()) / (1000 * 60 * 60);

      if (hoursUntilBooking < 24) {
        return {
          success: false,
          error: 'Cannot cancel bookings less than 24 hours in advance'
        };
      }

      // Perform atomic cancellation
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (updateError) {
        logger.error('[ENHANCED-SERVICE] Error cancelling booking:', updateError);
        return { success: false, error: 'Failed to cancel booking' };
      }

      // Invalidate relevant caches
      if (this.atomicServiceAvailable) {
        await cacheServiceAtomic.invalidateByTags(
          [`availability:${booking.service_id}`, `user_bookings:${booking.user_id}`],
          'immediate',
          `Booking cancelled: ${reason}`
        );

        // Publish real-time event
        if (webSocketServiceAtomic.isHealthy()) {
          webSocketServiceAtomic.publishBookingEvent('cancelled', {
            bookingId,
            serviceId: booking.service_id,
            userId: booking.user_id,
            status: 'cancelled',
            timestamp: new Date()
          });
        }
      }

      logger.info('[ENHANCED-SERVICE] Successfully cancelled booking', { bookingId, reason });
      return { success: true };

    } catch (error) {
      logger.error('[ENHANCED-SERVICE] Error in cancel booking:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Enhanced update booking with conflict detection
   */
  async updateBooking(
    bookingId: string,
    updates: any
  ): Promise<any> {
    try {
      // Validate booking exists
      const { data: existingBooking, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (fetchError || !existingBooking) {
        return { success: false, error: 'Booking not found' };
      }

      // Prepare updates with validation
      const validUpdates = {
        ...updates,
        updated_at: new Date().toISOString(),
        version: Date.now()
      };

      // Perform atomic update
      const { data: updatedBooking, error: updateError } = await supabase
        .from('bookings')
        .update(validUpdates)
        .eq('id', bookingId)
        .select()
        .single();

      if (updateError) {
        logger.error('[ENHANCED-SERVICE] Error updating booking:', updateError);
        return { success: false, error: 'Failed to update booking' };
      }

      // Invalidate relevant caches
      if (this.atomicServiceAvailable) {
        await cacheServiceAtomic.invalidateByTags(
          [`availability:${updatedBooking.service_id}`, `user_bookings:${updatedBooking.user_id}`],
          'immediate',
          `Booking updated: ${bookingId}`
        );

        // Publish real-time event
        if (webSocketServiceAtomic.isHealthy()) {
          webSocketServiceAtomic.publishBookingEvent('updated', {
            bookingId,
            serviceId: updatedBooking.service_id,
            userId: updatedBooking.user_id,
            status: updatedBooking.status,
            timestamp: new Date()
          });
        }
      }

      logger.info('[ENHANCED-SERVICE] Successfully updated booking', { bookingId });
      return { success: true, booking: updatedBooking };

    } catch (error) {
      logger.error('[ENHANCED-SERVICE] Error in update booking:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getBookingById(bookingId: string): Promise<any> {
    try {
      // Try cache first if atomic service is available
      if (this.atomicServiceAvailable) {
        const cached = await cacheServiceAtomic.getAtomic(`booking:${bookingId}`);
        if (cached) {
          return cached.data;
        }
      }

      // Fetch from database
      const { data: booking, error } = await supabase
        .from('bookings')
        .select(`
          *,
          service:services(*),
          user:profiles(*)
        `)
        .eq('id', bookingId)
        .single();

      if (error) {
        logger.error('[ENHANCED-SERVICE] Error fetching booking:', error);
        return null;
      }

      // Cache the result
      if (this.atomicServiceAvailable && booking) {
        await cacheServiceAtomic.setAtomic(
          `booking:${bookingId}`,
          booking,
          1800, // 30 minutes
          ['booking', `service:${booking.service_id}`, `user:${booking.user_id}`]
        );
      }

      return booking;

    } catch (error) {
      logger.error('[ENHANCED-SERVICE] Error in getBookingById:', error);
      return null;
    }
  }

  async getUserBookings(
    userId: string,
    options: {
      status?: string;
      limit?: number;
      offset?: number;
      orderBy?: 'created_at' | 'booking_date';
      orderDirection?: 'asc' | 'desc';
    } = {}
  ): Promise<any> {
    try {
      // Try cache first if atomic service is available
      const cacheKey = `user_bookings:${userId}:${JSON.stringify(options)}`;
      if (this.atomicServiceAvailable) {
        const cached = await cacheServiceAtomic.getAtomic(cacheKey);
        if (cached) {
          return cached.data;
        }
      }

      let query = supabase
        .from('bookings')
        .select(`
          *,
          service:services(*)
        `)
        .eq('user_id', userId);

      // Apply filters
      if (options.status) {
        query = query.eq('status', options.status);
      }

      // Apply ordering
      const orderBy = options.orderBy || 'created_at';
      const orderDirection = options.orderDirection || 'desc';
      query = query.order(orderBy, { ascending: orderDirection === 'asc' });

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data: bookings, error } = await query;

      if (error) {
        logger.error('[ENHANCED-SERVICE] Error fetching user bookings:', error);
        return [];
      }

      // Cache the result
      if (this.atomicServiceAvailable && bookings) {
        await cacheServiceAtomic.setAtomic(
          cacheKey,
          bookings || [],
          900, // 15 minutes
          ['user_bookings', `user:${userId}`]
        );
      }

      return bookings || [];

    } catch (error) {
      logger.error('[ENHANCED-SERVICE] Error in getUserBookings:', error);
      return [];
    }
  }

  // Private helper methods

  private async getAvailabilityLegacy(
    serviceId: string,
    location: LocationType,
    date: Date
  ): Promise<AvailabilityServiceResult> {
    try {
      // Fallback legacy implementation
      const { data: slots, error } = await supabase
        .from('availability_slots')
        .select('*')
        .eq('service_id', serviceId)
        .eq('date', date.toISOString().split('T')[0])
        .eq('location', location)
        .order('start_time');

      if (error) {
        logger.error('[ENHANCED-SERVICE] Legacy availability error:', error);
        return { success: false, slots: [], version: Date.now() };
      }

      return {
        success: true,
        slots: slots || [],
        version: Date.now()
      };

    } catch (error) {
      logger.error('[ENHANCED-SERVICE] Legacy availability exception:', error);
      return { success: false, slots: [], version: Date.now() };
    }
  }

  private async createBookingLegacy(
    service: Service,
    timeSlot: TimeSlot,
    details: BookingDetails
  ): Promise<BookingServiceResult> {
    try {
      // Fallback legacy implementation
      const bookingData = {
        service_id: service.id,
        booking_date: timeSlot.date.toISOString().split('T')[0],
        booking_time: timeSlot.time,
        status: 'pending',
        client_name: details.client_name,
        client_email: details.client_email,
        client_phone: details.client_phone,
        notes: details.notes,
        location_id: this.getLocationId(timeSlot.location),
        duration_minutes: service.duration_minutes,
        currency: 'PLN',
        amount_paid: service.price_from,
        payment_method: 'pending',
        consent_terms_accepted: details.consent_terms,
        consent_marketing_accepted: details.consent_marketing,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: booking, error } = await supabase
        .from('bookings')
        .insert(bookingData)
        .select()
        .single();

      if (error) {
        logger.error('[ENHANCED-SERVICE] Legacy booking error:', error);
        return {
          success: false,
          transactionId: this.generateTransactionId('legacy'),
          version: Date.now(),
          conflictReason: error.message
        };
      }

      return {
        success: true,
        booking: booking,
        transactionId: this.generateTransactionId('legacy'),
        version: Date.now()
      };

    } catch (error) {
      logger.error('[ENHANCED-SERVICE] Legacy booking exception:', error);
      return {
        success: false,
        transactionId: this.generateTransactionId('legacy'),
        version: Date.now(),
        conflictReason: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async handleReservationConflict(
    result: BookingServiceResult,
    context: any
  ): Promise<void> {
    logger.warn('[ENHANCED-SERVICE] Handling reservation conflict', {
      conflictReason: result.conflictReason,
      context
    });

    // Suggest retry for recoverable conflicts
    if (result.requiresRetry && result.suggestedAction === 'retry') {
      // Could implement automatic retry with exponential backoff
      logger.info('[ENHANCED-SERVICE] Suggesting retry for reservation conflict');
    }
  }

  private async handleBookingConflict(
    result: BookingServiceResult,
    context: any
  ): Promise<void> {
    logger.warn('[ENHANCED-SERVICE] Handling booking conflict', {
      conflictReason: result.conflictReason,
      context
    });

    // Log conflict for analysis
    if (this.atomicServiceAvailable) {
      // Conflict would be automatically handled by conflict resolution service
    }
  }

  private getLocationId(location: LocationType): string {
    const locationMap = {
      studio: 'studio-location-id',
      online: 'online-location-id',
      fitness: 'fitness-location-id',
    };
    return locationMap[location] || 'studio-location-id';
  }

  private generateTransactionId(operation: string): string {
    return `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Health monitoring
  async getServiceHealth(): Promise<any> {
    const health = {
      initialized: this.initialized,
      atomicServiceAvailable: this.atomicServiceAvailable,
      services: {}
    };

    if (this.atomicServiceAvailable) {
      try {
        health.services = await bookingServiceAtomic.getServiceHealth();
      } catch (error) {
        health.services = { error: error.message };
      }
    }

    return health;
  }

  // Cleanup
  async cleanup(): Promise<void> {
    try {
      if (this.atomicServiceAvailable) {
        await bookingServiceAtomic.cleanup();
      }
      logger.info('[ENHANCED-SERVICE] Cleanup completed');
    } catch (error) {
      logger.error('[ENHANCED-SERVICE] Error during cleanup:', error);
    }
  }
}

// Export singleton instance
export const enhancedBookingService = EnhancedBookingService.getInstance();

// Initialize service
enhancedBookingService.initializeServices().catch(logger.error);