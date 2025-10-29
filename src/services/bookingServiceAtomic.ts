import { supabase } from '@/integrations/supabase/client';
import {
  Booking,
  BookingStatus,
  ServiceType,
  LocationType,
  TimeSlot,
  Service,
  BookingDetails,
  PaymentDetails
} from '@/stores/bookingStore';
import { logger } from '@/lib/logger';

import { bookingDomainServiceAtomic, AtomicHoldResult, AtomicBookingResult } from './bookingDomainServiceAtomic';
import { cacheServiceAtomic } from './cacheServiceAtomic';
import { webSocketServiceAtomic } from './websocketServiceAtomic';

// Enhanced booking result with conflict resolution
export interface BookingServiceResult {
  success: boolean;
  booking?: Booking;
  holdId?: string;
  transactionId: string;
  version: number;
  conflictDetected?: boolean;
  conflictReason?: string;
  rollbackSuccessful?: boolean;
  requiresRetry?: boolean;
  suggestedAction?: 'retry' | 'refresh' | 'contact_support';
}

// Availability service result with optimistic updates
export interface AvailabilityServiceResult {
  success: boolean;
  slots: TimeSlot[];
  version: number;
  conflicts?: {
    type: 'HOLD_CONFLICT' | 'BOOKING_CONFLICT' | 'CACHE_CONFLICT';
    details: any;
  }[];
  optimistic?: boolean;
}

// Unified service configuration
const SERVICE_CONFIG = {
  maxRetries: 3,
  retryDelayBase: 200, // Base delay in ms
  conflictResolutionStrategy: 'optimal' as 'aggressive' | 'conservative' | 'optimal',
  enableOptimisticUpdates: true,
  enableRealtimeSync: true,
  cacheTimeout: 300, // 5 minutes
  holdTimeout: 600, // 10 minutes
};

/**
 * Unified Atomic Booking Service
 *
 * Integrates all atomic components to provide:
 * - Race condition-free booking operations
 * - Real-time availability synchronization
 * - Conflict detection and resolution
 * - Optimistic UI updates with rollback
 * - Distributed coordination across instances
 */
export class BookingServiceAtomic {
  private static instance: BookingServiceAtomic;
  private retryCount = new Map<string, number>();
  private activeTransactions = new Map<string, any>();
  private eventListeners = new Map<string, Set<Function>>();

  static getInstance(): BookingServiceAtomic {
    if (!BookingServiceAtomic.instance) {
      BookingServiceAtomic.instance = new BookingServiceAtomic();
    }
    return BookingServiceAtomic.instance;
  }

  constructor() {
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Listen to WebSocket events for real-time updates
    webSocketServiceAtomic.on('availability:updated', (payload) => {
      this.handleRealtimeAvailabilityUpdate(payload);
    });

    webSocketServiceAtomic.on('slot:reserved', (payload) => {
      this.handleRealtimeSlotEvent('reserved', payload);
    });

    webSocketServiceAtomic.on('slot:released', (payload) => {
      this.handleRealtimeSlotEvent('released', payload);
    });

    webSocketServiceAtomic.on('conflict:detected', (payload) => {
      this.handleRealtimeConflict(payload);
    });

    // Listen to booking domain events
    bookingDomainServiceAtomic.on('slot.reserved', (event) => {
      this.publishSlotEvent('reserved', event);
    });

    bookingDomainServiceAtomic.on('slot.released', (event) => {
      this.publishSlotEvent('released', event);
    });

    bookingDomainServiceAtomic.on('booking.created', (event) => {
      this.publishBookingEvent('created', event);
    });

    bookingDomainServiceAtomic.on('conflict.detected', (event) => {
      this.publishConflictEvent(event);
    });
  }

  // Main atomic operations

  /**
   * ATOMIC AVAILABILITY CHECK WITH OPTIMISTIC UPDATES
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
    const transactionId = this.generateTransactionId('availability');
    const version = options.version || Date.now();

    logger.info(`[ATOMIC-SERVICE] Getting availability`, {
      serviceId,
      location,
      date,
      transactionId,
      useCache: options.useCache
    });

    try {
      // Step 1: Try cache first if enabled
      if (options.useCache !== false) {
        const cachedAvailability = await cacheServiceAtomic.getAvailabilityAtomic(
          serviceId,
          location,
          date,
          version
        );

        if (cachedAvailability) {
          logger.debug(`[ATOMIC-SERVICE] Cache hit for availability`, {
            serviceId,
            version: cachedAvailability.version
          });

          return {
            success: true,
            slots: cachedAvailability.slots,
            version: cachedAvailability.version,
            optimistic: false
          };
        }
      }

      // Step 2: Fetch from database with version checking
      const availabilityResult = await this.fetchAvailabilityFromDatabase(
        serviceId,
        location,
        date,
        version
      );

      if (!availabilityResult.success) {
        return {
          success: false,
          slots: [],
          version
        };
      }

      // Step 3: Update cache atomically
      if (options.optimistic !== false) {
        await cacheServiceAtomic.cacheAvailabilityAtomic(
          serviceId,
          location,
          date,
          availabilityResult.slots,
          availabilityResult.lockedSlots || [],
          availabilityResult.heldSlots || [],
          transactionId
        );
      }

      // Step 4: Subscribe to real-time updates for this service
      if (SERVICE_CONFIG.enableRealtimeSync) {
        webSocketServiceAtomic.subscribe(`availability:${serviceId}`);
        webSocketServiceAtomic.subscribe(`availability:${date.toISOString().split('T')[0]}`);
      }

      return {
        success: true,
        slots: availabilityResult.slots,
        version,
        optimistic: options.optimistic || false
      };

    } catch (error) {
      logger.error(`[ATOMIC-SERVICE] Error getting availability`, {
        serviceId,
        error,
        transactionId
      });

      return {
        success: false,
        slots: [],
        version,
        conflicts: [{
          type: 'CACHE_CONFLICT',
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        }]
      };
    }
  }

  /**
   * ATOMIC TIME SLOT RESERVATION WITH CONFLICT RESOLUTION
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
    const transactionId = this.generateTransactionId('reserve');
    const maxRetries = options.maxRetries || SERVICE_CONFIG.maxRetries;
    const version = Date.now();

    logger.info(`[ATOMIC-SERVICE] Reserving time slot`, {
      serviceId,
      slotId,
      userId,
      transactionId,
      maxRetries
    });

    let lastConflictReason = '';

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Step 1: Check if slot is still available
        const availabilityCheck = await this.checkSlotAvailabilityAtomic(
          serviceId,
          slotId,
          version
        );

        if (!availabilityCheck.success) {
          lastConflictReason = availabilityCheck.reason || 'Slot not available';
          logger.warn(`[ATOMIC-SERVICE] Slot not available on attempt ${attempt}`, {
            slotId,
            reason: lastConflictReason
          });
          continue;
        }

        // Step 2: Create atomic hold with distributed locking
        const holdResult = await bookingDomainServiceAtomic.reserveTimeSlotAtomic(
          slotId,
          userId,
          serviceId,
          startTime,
          endTime
        );

        if (!holdResult.success) {
          lastConflictReason = holdResult.conflictReason || 'Hold creation failed';
          logger.warn(`[ATOMIC-SERVICE] Hold creation failed on attempt ${attempt}`, {
            slotId,
            reason: lastConflictReason
          });
          continue;
        }

        // Step 3: Optimistic UI update if enabled
        if (SERVICE_CONFIG.enableOptimisticUpdates && options.useOptimisticLock !== false) {
          await this.updateOptimisticAvailability(
            serviceId,
            slotId,
            'held',
            version
          );
        }

        // Step 4: Publish real-time event
        if (SERVICE_CONFIG.enableRealtimeSync) {
          webSocketServiceAtomic.publishSlotEvent('reserved', {
            slotId,
            userId,
            serviceId,
            expiresAt: holdResult.expiresAt,
            version: holdResult.version || version,
            timestamp: new Date()
          });
        }

        logger.info(`[ATOMIC-SERVICE] Successfully reserved time slot`, {
          slotId,
          holdId: holdResult.holdId,
          transactionId,
          attempt
        });

        return {
          success: true,
          holdId: holdResult.holdId,
          transactionId,
          version: holdResult.version || version
        };

      } catch (error) {
        lastConflictReason = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`[ATOMIC-SERVICE] Error in reservation attempt ${attempt}`, {
          slotId,
          error
        });

        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = SERVICE_CONFIG.retryDelayBase * Math.pow(2, attempt - 1);
          await this.sleep(delay);
        }
      }
    }

    // All attempts failed
    return {
      success: false,
      transactionId,
      version,
      conflictDetected: true,
      conflictReason: lastConflictReason,
      requiresRetry: true,
      suggestedAction: this.determineSuggestedAction(lastConflictReason)
    };
  }

  /**
   * ATOMIC BOOKING CREATION WITH FULL TRANSACTION INTEGRITY
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
    const transactionId = this.generateTransactionId('booking');
    const version = Date.now();

    logger.info(`[ATOMIC-SERVICE] Creating booking`, {
      serviceId: service.id,
      holdId,
      userId,
      transactionId
    });

    let rollbackData: any = null;
    let activeHold: any = null;

    try {
      // Step 1: Validate availability if required
      if (options.validateAvailability !== false) {
        const availabilityCheck = await this.checkSlotAvailabilityAtomic(
          service.id,
          timeSlot.id,
          version
        );

        if (!availabilityCheck.success) {
          return {
            success: false,
            transactionId,
            version,
            conflictDetected: true,
            conflictReason: availabilityCheck.reason,
            suggestedAction: this.determineSuggestedAction(availabilityCheck.reason)
          };
        }
      }

      // Step 2: Create or validate hold
      if (holdId) {
        activeHold = await this.validateHoldForBooking(holdId, userId, transactionId);
        if (!activeHold.valid) {
          return {
            success: false,
            transactionId,
            version,
            conflictDetected: true,
            conflictReason: activeHold.reason
          };
        }
      }

      // Step 3: Create atomic booking
      const bookingResult = await bookingDomainServiceAtomic.createBookingAtomic(
        service,
        timeSlot,
        details,
        holdId,
        userId
      );

      if (!bookingResult.success || !bookingResult.booking) {
        return {
          success: false,
          transactionId,
          version,
          conflictDetected: true,
          conflictReason: bookingResult.conflictReason
        };
      }

      rollbackData = {
        booking: bookingResult.booking,
        hold: activeHold
      };

      // Step 4: Optimistic UI update if enabled
      if (SERVICE_CONFIG.enableOptimisticUpdates && options.useOptimisticUpdates !== false) {
        await this.updateOptimisticAvailability(
          service.id,
          timeSlot.id,
          'booked',
          version
        );
      }

      // Step 5: Publish real-time events
      if (SERVICE_CONFIG.enableRealtimeSync) {
        webSocketServiceAtomic.publishBookingEvent('created', {
          bookingId: bookingResult.booking.id,
          serviceId: service.id,
          userId: bookingResult.booking.user_id,
          status: bookingResult.booking.status,
          timestamp: new Date(),
          transactionId
        });
      }

      logger.info(`[ATOMIC-SERVICE] Successfully created booking`, {
        bookingId: bookingResult.booking.id,
        transactionId
      });

      return {
        success: true,
        booking: bookingResult.booking,
        transactionId,
        version
      };

    } catch (error) {
      logger.error(`[ATOMIC-SERVICE] Error creating booking`, {
        error,
        transactionId
      });

      // Rollback if possible
      if (rollbackData) {
        const rollbackSuccess = await this.rollbackBookingCreation(rollbackData);

        return {
          success: false,
          transactionId,
          version,
          conflictDetected: true,
          conflictReason: error instanceof Error ? error.message : 'Unknown error',
          rollbackSuccessful: rollbackSuccess
        };
      }

      return {
        success: false,
        transactionId,
        version,
        conflictDetected: true,
        conflictReason: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * ATOMIC SLOT RELEASE WITH CACHE SYNCHRONIZATION
   */
  async releaseTimeSlotAtomic(
    holdId: string,
    slotId: string,
    reason: string = 'User cancelled'
  ): Promise<BookingServiceResult> {
    const transactionId = this.generateTransactionId('release');
    const version = Date.now();

    logger.info(`[ATOMIC-SERVICE] Releasing time slot`, {
      holdId,
      slotId,
      reason,
      transactionId
    });

    try {
      // Step 1: Release hold atomically
      const releaseResult = await bookingDomainServiceAtomic.releaseTimeSlotAtomic(
        holdId,
        slotId
      );

      if (!releaseResult.success) {
        return {
          success: false,
          transactionId,
          version,
          conflictReason: releaseResult.error
        };
      }

      // Step 2: Update cache
      // This will be handled by the domain service events, but we can be explicit
      await cacheServiceAtomic.invalidateAtomic(
        [`hold:${slotId}`],
        'immediate',
        `Hold released: ${reason}`,
        transactionId
      );

      // Step 3: Publish real-time event
      if (SERVICE_CONFIG.enableRealtimeSync) {
        webSocketServiceAtomic.publishSlotEvent('released', {
          slotId,
          userId: 'system', // System action
          serviceId: 'unknown', // Would be extracted from hold
          version,
          timestamp: new Date()
        });
      }

      logger.info(`[ATOMIC-SERVICE] Successfully released time slot`, {
        holdId,
        slotId,
        transactionId
      });

      return {
        success: true,
        transactionId,
        version
      };

    } catch (error) {
      logger.error(`[ATOMIC-SERVICE] Error releasing time slot`, {
        holdId,
        slotId,
        error,
        transactionId
      });

      return {
        success: false,
        transactionId,
        version,
        conflictDetected: true,
        conflictReason: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Private helper methods

  private async fetchAvailabilityFromDatabase(
    serviceId: string,
    location: LocationType,
    date: Date,
    version: number
  ): Promise<{
    success: boolean;
    slots: TimeSlot[];
    lockedSlots?: string[];
    heldSlots?: string[];
  }> {
    try {
      // Fetch availability slots from database
      const { data: slots, error } = await supabase
        .from('availability_slots')
        .select('*')
        .eq('service_id', serviceId)
        .eq('date', date.toISOString().split('T')[0])
        .eq('location', location)
        .order('start_time');

      if (error) {
        logger.error('Database error fetching availability:', error);
        return { success: false, slots: [] };
      }

      // Fetch active holds
      const { data: holds } = await supabase
        .from('holds')
        .select('slot_id, expires_at')
        .eq('service_id', serviceId)
        .gt('expires_at', new Date().toISOString());

      const heldSlots = holds?.map(h => h.slot_id) || [];

      // Fetch existing bookings
      const { data: bookings } = await supabase
        .from('bookings')
        .select('booking_time')
        .eq('service_id', serviceId)
        .eq('booking_date', date.toISOString().split('T')[0])
        .in('status', ['pending', 'confirmed']);

      // Transform to TimeSlot format
      const timeSlots: TimeSlot[] = slots?.map(slot => ({
        id: slot.id,
        start_time: slot.start_time,
        end_time: slot.end_time,
        available: !heldSlots.includes(slot.id) && !bookings?.some(b => b.booking_time === slot.start_time),
        location: location,
        service_id: serviceId,
        max_participants: slot.max_participants,
        current_participants: slot.current_participants || 0
      })) || [];

      return {
        success: true,
        slots: timeSlots,
        heldSlots
      };

    } catch (error) {
      logger.error('Error fetching availability from database:', error);
      return { success: false, slots: [] };
    }
  }

  private async checkSlotAvailabilityAtomic(
    serviceId: string,
    slotId: string,
    version: number
  ): Promise<{ success: boolean; reason?: string }> {
    try {
      // Check in cache first
      const cacheKey = `slot_availability:${serviceId}:${slotId}`;
      const cached = await cacheServiceAtomic.getAtomic(cacheKey, version);

      if (cached && cached.data.available) {
        return { success: true };
      }

      // Check in database
      const { data: slot } = await supabase
        .from('availability_slots')
        .select('*')
        .eq('id', slotId)
        .single();

      if (!slot) {
        return { success: false, reason: 'Slot not found' };
      }

      // Check for holds
      const { count: holdsCount } = await supabase
        .from('holds')
        .select('*', { count: 'exact', head: true })
        .eq('slot_id', slotId)
        .gt('expires_at', new Date().toISOString());

      if (holdsCount && holdsCount > 0) {
        return { success: false, reason: 'Slot currently held' };
      }

      // Check for bookings
      const { count: bookingsCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('service_id', serviceId)
        .eq('booking_time', slot.start_time)
        .in('status', ['pending', 'confirmed']);

      if (bookingsCount && bookingsCount > 0) {
        return { success: false, reason: 'Slot already booked' };
      }

      // Update cache
      await cacheServiceAtomic.setAtomic(
        cacheKey,
        { available: true },
        SERVICE_CONFIG.cacheTimeout,
        ['availability', 'slot'],
        version
      );

      return { success: true };

    } catch (error) {
      logger.error('Error checking slot availability:', error);
      return { success: false, reason: 'Availability check failed' };
    }
  }

  private async validateHoldForBooking(
    holdId: string,
    userId: string,
    transactionId: string
  ): Promise<{ valid: boolean; reason?: string; hold?: any }> {
    try {
      const { data: hold, error } = await supabase
        .from('holds')
        .select('*')
        .eq('id', holdId)
        .eq('user_id', userId)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !hold) {
        return { valid: false, reason: 'Hold not found, expired, or invalid user' };
      }

      return { valid: true, hold };

    } catch (error) {
      return { valid: false, reason: 'Hold validation failed' };
    }
  }

  private async updateOptimisticAvailability(
    serviceId: string,
    slotId: string,
    status: 'available' | 'held' | 'booked',
    version: number
  ): Promise<void> {
    try {
      const cacheKey = `optimistic_availability:${serviceId}`;
      const optimisticUpdate = {
        slotId,
        status,
        timestamp: new Date(),
        version
      };

      await cacheServiceAtomic.setAtomic(
        cacheKey,
        optimisticUpdate,
        SERVICE_CONFIG.cacheTimeout / 10, // Shorter TTL for optimistic data
        ['optimistic', 'availability'],
        version
      );

    } catch (error) {
      logger.error('Error updating optimistic availability:', error);
    }
  }

  private async rollbackBookingCreation(rollbackData: any): Promise<boolean> {
    try {
      logger.info('Rolling back booking creation', rollbackData);

      // Delete booking if it was created
      if (rollbackData.booking) {
        await supabase
          .from('bookings')
          .delete()
          .eq('id', rollbackData.booking.id);
      }

      // Restore hold if it was converted
      if (rollbackData.hold) {
        await supabase
          .from('holds')
          .insert(rollbackData.hold);
      }

      // Invalidate relevant caches
      const tags = [
        `availability:${rollbackData.booking?.service_id || rollbackData.hold?.service_id}`
      ];
      await cacheServiceAtomic.invalidateByTags(
        tags,
        'immediate',
        'Booking creation rollback'
      );

      return true;

    } catch (error) {
      logger.error('Error during booking rollback:', error);
      return false;
    }
  }

  private determineSuggestedAction(reason: string): 'retry' | 'refresh' | 'contact_support' {
    const lowerReason = reason.toLowerCase();

    if (lowerReason.includes('lock') || lowerReason.includes('timeout')) {
      return 'retry';
    } else if (lowerReason.includes('not available') || lowerReason.includes('booked')) {
      return 'refresh';
    } else {
      return 'contact_support';
    }
  }

  private generateTransactionId(operation: string): string {
    return `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Real-time event handlers
  private handleRealtimeAvailabilityUpdate(payload: any): void {
    this.emit('availability:updated', payload);
  }

  private handleRealtimeSlotEvent(type: string, payload: any): void {
    this.emit(`slot:${type}`, payload);
  }

  private handleRealtimeConflict(payload: any): void {
    this.emit('conflict:detected', payload);
  }

  private publishSlotEvent(type: string, event: any): void {
    webSocketServiceAtomic.publishSlotEvent(`slot:${type}` as any, {
      slotId: event.slotId,
      userId: event.userId,
      serviceId: event.serviceId,
      expiresAt: event.expiresAt,
      version: event.version,
      timestamp: new Date()
    });
  }

  private publishBookingEvent(type: string, event: any): void {
    webSocketServiceAtomic.publishBookingEvent(`booking:${type}` as any, {
      bookingId: event.booking?.id,
      serviceId: event.booking?.service_id,
      userId: event.booking?.user_id,
      status: event.booking?.status,
      timestamp: new Date(),
      transactionId: event.transactionId
    });
  }

  private publishConflictEvent(event: any): void {
    webSocketServiceAtomic.publishConflictDetected({
      type: event.type,
      details: event.details,
      timestamp: new Date(),
      resolved: false
    });
  }

  // Event handling for external consumers
  on(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  off(event: string, listener: Function): void {
    this.eventListeners.get(event)?.delete(listener);
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          logger.error('Error in booking service event listener:', error);
        }
      });
    }
  }

  // Health monitoring
  async getServiceHealth(): Promise<{
    database: boolean;
    cache: boolean;
    websocket: boolean;
    domain: boolean;
    overall: boolean;
    details: any;
  }> {
    const [domainHealth, cacheHealth, wsHealth] = await Promise.allSettled([
      bookingDomainServiceAtomic.getAtomicServiceHealth(),
      cacheServiceAtomic.isHealthy(),
      webSocketServiceAtomic.isHealthy()
    ]);

    const domainResult = domainHealth.status === 'fulfilled' ? domainHealth.value : { database: false, cache: false, locks: false };
    const cacheResult = cacheHealth.status === 'fulfilled' ? cacheHealth.value : false;
    const wsResult = wsHealth.status === 'fulfilled' ? wsHealth.value : false;

    const overall = domainResult.database && cacheResult && wsResult;

    return {
      database: domainResult.database,
      cache: cacheResult,
      websocket: wsResult,
      domain: overall,
      overall,
      details: {
        domain: domainResult,
        cache: cacheHealth.status === 'fulfilled' ? cacheHealth.value : cacheHealth.reason,
        websocket: wsHealth.status === 'fulfilled' ? wsHealth.value : wsHealth.reason
      }
    };
  }

  // Cleanup
  async cleanup(): Promise<void> {
    try {
      webSocketServiceAtomic.disconnect();
      await cacheServiceAtomic.disconnect();
      this.eventListeners.clear();
      this.retryCount.clear();
      this.activeTransactions.clear();

      logger.info('Booking service atomic cleanup completed');
    } catch (error) {
      logger.error('Error during booking service cleanup:', error);
    }
  }
}

// Export singleton instance
export const bookingServiceAtomic = BookingServiceAtomic.getInstance();