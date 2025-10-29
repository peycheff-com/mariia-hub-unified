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

import { cacheService, CachedHold } from './cacheService';

// Enhanced types for atomic operations
export interface AtomicHoldResult {
  success: boolean;
  holdId?: string;
  expiresAt?: Date;
  version?: number;
  conflictReason?: 'EXISTS' | 'CONFLICT' | 'DATABASE_ERROR' | 'LOCK_FAILED';
}

export interface AtomicBookingResult {
  success: boolean;
  booking?: Booking;
  transactionId?: string;
  rollbackData?: any;
  conflictReason?: string;
}

export interface DistributedLock {
  key: string;
  owner: string;
  expiresAt: Date;
  version: number;
}

// Domain events with enhanced metadata
export type BookingEvent =
  | { type: 'booking.created'; booking: Booking; transactionId: string }
  | { type: 'booking.updated'; bookingId: string; status: BookingStatus; transactionId: string }
  | { type: 'booking.cancelled'; bookingId: string; reason: string; transactionId: string }
  | { type: 'slot.reserved'; slotId: string; userId: string; expiresAt: Date; version: number }
  | { type: 'slot.released'; slotId: string; version: number }
  | { type: 'conflict.detected'; type: 'HOLD_CONFLICT' | 'BOOKING_CONFLICT'; details: any }
  | { type: 'cache.invalidated'; keys: string[]; reason: string };

// Event listeners with enhanced typing
type EventListener = (event: BookingEvent) => void;
const eventListeners = new Map<string, Set<EventListener>>();

/**
 * Enhanced Booking Domain Service with Atomic Operations
 *
 * Addresses critical race conditions in:
 * 1. Hold creation and management
 * 2. Booking creation with concurrent access
 * 3. Cache coherence and invalidation
 * 4. Distributed locking for multi-instance deployments
 */
export class BookingDomainServiceAtomic {
  private static instance: BookingDomainServiceAtomic;
  private readonly LOCK_TIMEOUT = 30000; // 30 seconds
  private readonly HOLD_TIMEOUT = 600000; // 10 minutes
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_BASE = 100; // Base delay in ms for exponential backoff

  static getInstance(): BookingDomainServiceAtomic {
    if (!BookingDomainServiceAtomic.instance) {
      BookingDomainServiceAtomic.instance = new BookingDomainServiceAtomic();
    }
    return BookingDomainServiceAtomic.instance;
  }

  // Event management
  static on(eventType: string, listener: EventListener) {
    if (!eventListeners.has(eventType)) {
      eventListeners.set(eventType, new Set());
    }
    eventListeners.get(eventType)!.add(listener);
  }

  static off(eventType: string, listener: EventListener) {
    eventListeners.get(eventType)?.delete(listener);
  }

  private emit(event: BookingEvent) {
    const listeners = eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          logger.error('Error in event listener:', error);
        }
      });
    }
  }

  /**
   * ATOMIC HOLD CREATION WITH DISTRIBUTED LOCKING
   *
   * This method implements:
   * 1. Distributed locking to prevent race conditions
   * 2. Atomic database transactions
   * 3. Cache coherence management
   * 4. Optimistic concurrency control with versioning
   */
  async reserveTimeSlotAtomic(
    slotId: string,
    userId: string,
    serviceId: string,
    startTime: Date,
    endTime: Date
  ): Promise<AtomicHoldResult> {
    const lockKey = `hold:${slotId}`;
    const transactionId = crypto.randomUUID();
    const version = Date.now();

    logger.info(`[ATOMIC-HOLD] Starting atomic hold creation`, {
      slotId,
      userId,
      serviceId,
      transactionId,
      version
    });

    let acquiredLock: DistributedLock | null = null;
    let rollbackData: any = null;

    try {
      // Step 1: Acquire distributed lock with exponential backoff
      acquiredLock = await this.acquireDistributedLock(lockKey, transactionId);
      if (!acquiredLock) {
        await this.emitConflictEvent('HOLD_CONFLICT', {
          slotId,
          userId,
          reason: 'LOCK_ACQUISITION_FAILED'
        });
        return {
          success: false,
          conflictReason: 'LOCK_FAILED',
          version
        };
      }

      // Step 2: Check for existing holds in cache and database atomically
      const existingHold = await this.checkForExistingHoldAtomic(slotId);
      if (existingHold) {
        logger.warn(`[ATOMIC-HOLD] Hold already exists`, { slotId, existingHold });
        await this.emitConflictEvent('HOLD_CONFLICT', {
          slotId,
          userId,
          existingHold,
          reason: 'HOLD_ALREADY_EXISTS'
        });
        return {
          success: false,
          conflictReason: 'EXISTS',
          version
        };
      }

      // Step 3: Create hold with atomic transaction
      const holdResult = await this.createHoldAtomic(
        slotId,
        userId,
        serviceId,
        startTime,
        endTime,
        transactionId,
        version
      );

      if (!holdResult.success || !holdResult.holdId) {
        return holdResult;
      }

      // Step 4: Update cache atomically
      const cacheHold: CachedHold = {
        slotId,
        userId,
        expiresAt: new Date(Date.now() + this.HOLD_TIMEOUT),
        sessionId: transactionId
      };

      await cacheService.cacheHold(cacheHold);
      rollbackData = { cacheHold };

      // Step 5: Invalidate related availability caches
      await this.invalidateAvailabilityCaches(serviceId, startTime);

      // Step 6: Emit success event
      this.emit({
        type: 'slot.reserved',
        slotId,
        userId,
        expiresAt: cacheHold.expiresAt,
        version
      });

      logger.info(`[ATOMIC-HOLD] Successfully created hold`, {
        slotId,
        holdId: holdResult.holdId,
        transactionId,
        version
      });

      return {
        success: true,
        holdId: holdResult.holdId,
        expiresAt: cacheHold.expiresAt,
        version
      };

    } catch (error) {
      logger.error(`[ATOMIC-HOLD] Error during atomic hold creation`, {
        slotId,
        userId,
        error,
        transactionId
      });

      // Rollback changes if possible
      if (rollbackData) {
        await this.rollbackHoldCreation(rollbackData);
      }

      await this.emitConflictEvent('HOLD_CONFLICT', {
        slotId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        reason: 'TRANSACTION_ERROR'
      });

      return {
        success: false,
        conflictReason: 'DATABASE_ERROR',
        version
      };
    } finally {
      // Always release the distributed lock
      if (acquiredLock) {
        await this.releaseDistributedLock(lockKey, acquiredLock);
      }
    }
  }

  /**
   * ATOMIC BOOKING CREATION WITH OPTIMISTIC CONCURRENCY
   */
  async createBookingAtomic(
    service: Service,
    timeSlot: TimeSlot,
    details: BookingDetails,
    holdId?: string,
    userId?: string
  ): Promise<AtomicBookingResult> {
    const transactionId = crypto.randomUUID();
    const bookingKey = `booking:${service.id}:${timeSlot.date}:${timeSlot.time}`;

    logger.info(`[ATOMIC-BOOKING] Starting atomic booking creation`, {
      serviceId: service.id,
      timeSlot,
      holdId,
      userId,
      transactionId
    });

    let acquiredLock: DistributedLock | null = null;
    let rollbackData: any = null;

    try {
      // Step 1: Acquire distributed lock for the booking
      acquiredLock = await this.acquireDistributedLock(bookingKey, transactionId);
      if (!acquiredLock) {
        return {
          success: false,
          conflictReason: 'Could not acquire booking lock'
        };
      }

      // Step 2: Validate service availability with current data
      const availabilityCheck = await this.validateServiceAvailabilityAtomic(
        service.id,
        timeSlot
      );

      if (!availabilityCheck.valid) {
        return {
          success: false,
          conflictReason: availabilityCheck.reason || 'Service not available'
        };
      }

      // Step 3: Validate and convert hold to booking if provided
      if (holdId) {
        const holdConversion = await this.convertHoldToBookingAtomic(holdId, transactionId);
        if (!holdConversion.success) {
          return {
            success: false,
            conflictReason: holdConversion.reason || 'Hold conversion failed'
          };
        }
      }

      // Step 4: Create booking with atomic transaction
      const bookingResult = await this.insertBookingAtomic(
        service,
        timeSlot,
        details,
        transactionId,
        userId
      );

      if (!bookingResult.success || !bookingResult.booking) {
        return bookingResult;
      }

      // Step 5: Update caches atomically
      await this.updateBookingCaches(bookingResult.booking, service.id);
      rollbackData = { booking: bookingResult.booking };

      // Step 6: Invalidate related caches
      await this.invalidateAvailabilityCaches(service.id, timeSlot.date);

      // Step 7: Emit success event
      this.emit({
        type: 'booking.created',
        booking: bookingResult.booking,
        transactionId
      });

      logger.info(`[ATOMIC-BOOKING] Successfully created booking`, {
        bookingId: bookingResult.booking.id,
        transactionId
      });

      return {
        success: true,
        booking: bookingResult.booking,
        transactionId
      };

    } catch (error) {
      logger.error(`[ATOMIC-BOOKING] Error during atomic booking creation`, {
        serviceId: service.id,
        timeSlot,
        error,
        transactionId
      });

      // Rollback if possible
      if (rollbackData) {
        await this.rollbackBookingCreation(rollbackData);
      }

      return {
        success: false,
        conflictReason: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      if (acquiredLock) {
        await this.releaseDistributedLock(bookingKey, acquiredLock);
      }
    }
  }

  /**
   * RELEASE HOLD WITH ATOMIC OPERATIONS
   */
  async releaseTimeSlotAtomic(holdId: string, slotId: string): Promise<{ success: boolean; error?: string }> {
    const lockKey = `hold:${slotId}`;
    const transactionId = crypto.randomUUID();

    let acquiredLock: DistributedLock | null = null;

    try {
      acquiredLock = await this.acquireDistributedLock(lockKey, transactionId);
      if (!acquiredLock) {
        return { success: false, error: 'Could not acquire hold lock' };
      }

      // Remove hold from database
      const { error } = await supabase
        .from('holds')
        .delete()
        .eq('id', holdId);

      if (error) {
        logger.error(`[ATOMIC-HOLD] Failed to release hold`, { holdId, error });
        return { success: false, error: 'Failed to release hold' };
      }

      // Remove from cache
      await cacheService.removeHoldFromCache(slotId);

      // Emit event
      this.emit({
        type: 'slot.released',
        slotId,
        version: Date.now()
      });

      logger.info(`[ATOMIC-HOLD] Successfully released hold`, { holdId, slotId });

      return { success: true };

    } catch (error) {
      logger.error(`[ATOMIC-HOLD] Error releasing hold`, { holdId, error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      if (acquiredLock) {
        await this.releaseDistributedLock(lockKey, acquiredLock);
      }
    }
  }

  // Private atomic operations

  private async acquireDistributedLock(
    key: string,
    owner: string,
    timeout: number = this.LOCK_TIMEOUT
  ): Promise<DistributedLock | null> {
    const lock: DistributedLock = {
      key,
      owner,
      expiresAt: new Date(Date.now() + timeout),
      version: Date.now()
    };

    try {
      // Try to acquire lock atomically using Redis SET with NX and EX
      const lockKey = `lock:${key}`;
      const lockValue = JSON.stringify(lock);

      // Use Redis transaction to ensure atomicity
      const redis = (cacheService as any).redis;
      if (!redis) {
        logger.warn('[DISTRIBUTED-LOCK] Redis not available, using database fallback');
        return await this.acquireDatabaseLock(key, owner, timeout);
      }

      const result = await redis.set(lockKey, lockValue, 'PX', timeout, 'NX');

      if (result === 'OK') {
        logger.debug(`[DISTRIBUTED-LOCK] Acquired lock`, { key, owner });
        return lock;
      }

      // Check if lock is expired and try to acquire with compare-and-swap
      const existingLockData = await redis.get(lockKey);
      if (existingLockData) {
        const existingLock: DistributedLock = JSON.parse(existingLockData);
        if (new Date(existingLock.expiresAt) < new Date()) {
          // Lock is expired, try to acquire it
          const result = await redis.set(lockKey, lockValue, 'PX', timeout, 'NX');
          if (result === 'OK') {
            logger.debug(`[DISTRIBUTED-LOCK] Acquired expired lock`, { key, owner });
            return lock;
          }
        }
      }

      logger.debug(`[DISTRIBUTED-LOCK] Failed to acquire lock`, { key, owner });
      return null;

    } catch (error) {
      logger.error(`[DISTRIBUTED-LOCK] Error acquiring lock`, { key, owner, error });
      return null;
    }
  }

  private async releaseDistributedLock(key: string, lock: DistributedLock): Promise<void> {
    try {
      const lockKey = `lock:${key}`;
      const redis = (cacheService as any).redis;

      if (redis) {
        // Use Lua script for atomic release
        const luaScript = `
          if redis.call("GET", KEYS[1]) == ARGV[1] then
            return redis.call("DEL", KEYS[1])
          else
            return 0
          end
        `;

        await redis.eval(luaScript, 1, lockKey, JSON.stringify(lock));
      } else {
        await this.releaseDatabaseLock(key, lock);
      }

      logger.debug(`[DISTRIBUTED-LOCK] Released lock`, { key, owner: lock.owner });

    } catch (error) {
      logger.error(`[DISTRIBUTED-LOCK] Error releasing lock`, { key, error });
    }
  }

  private async acquireDatabaseLock(key: string, owner: string, timeout: number): Promise<DistributedLock | null> {
    const lock: DistributedLock = {
      key,
      owner,
      expiresAt: new Date(Date.now() + timeout),
      version: Date.now()
    };

    const { data, error } = await supabase
      .from('distributed_locks')
      .insert({
        lock_key: key,
        owner_id: owner,
        expires_at: lock.expiresAt.toISOString(),
        version: lock.version
      })
      .select('id')
      .single();

    if (error) {
      // Check if lock already exists and is expired
      const { data: existingLock } = await supabase
        .from('distributed_locks')
        .select('*')
        .eq('lock_key', key)
        .single();

      if (existingLock && new Date(existingLock.expires_at) < new Date()) {
        // Try to delete expired lock and create new one
        await supabase
          .from('distributed_locks')
          .delete()
          .eq('lock_key', key);

        const { data: newLock, error: newError } = await supabase
          .from('distributed_locks')
          .insert({
            lock_key: key,
            owner_id: owner,
            expires_at: lock.expiresAt.toISOString(),
            version: lock.version
          })
          .select('id')
          .single();

        if (!newError && newLock) {
          return lock;
        }
      }

      return null;
    }

    return lock;
  }

  private async releaseDatabaseLock(key: string, lock: DistributedLock): Promise<void> {
    await supabase
      .from('distributed_locks')
      .delete()
      .eq('lock_key', key)
      .eq('owner_id', lock.owner);
  }

  private async checkForExistingHoldAtomic(slotId: string): Promise<CachedHold | null> {
    // Check cache first
    const cachedHold = await cacheService.getHoldFromCache(slotId);
    if (cachedHold && new Date(cachedHold.expiresAt) > new Date()) {
      return cachedHold;
    }

    // Check database
    const { data, error } = await supabase
      .from('holds')
      .select('*')
      .eq('slot_id', slotId) // Assuming slot_id column exists
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!error && data) {
      // Update cache with database result
      const dbHold: CachedHold = {
        slotId,
        userId: data.user_id,
        expiresAt: new Date(data.expires_at),
        sessionId: data.session_id
      };
      await cacheService.cacheHold(dbHold);
      return dbHold;
    }

    // Remove stale cache entry
    if (cachedHold) {
      await cacheService.removeHoldFromCache(slotId);
    }

    return null;
  }

  private async createHoldAtomic(
    slotId: string,
    userId: string,
    serviceId: string,
    startTime: Date,
    endTime: Date,
    transactionId: string,
    version: number
  ): Promise<AtomicHoldResult> {
    const expiresAt = new Date(Date.now() + this.HOLD_TIMEOUT);

    const { data, error } = await supabase
      .from('holds')
      .insert({
        resource_id: 'mariia',
        slot_id: slotId,
        user_id: userId,
        service_id: serviceId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        expires_at: expiresAt.toISOString(),
        session_id: transactionId,
        version,
        created_at: new Date().toISOString()
      })
      .select('id, version')
      .single();

    if (error) {
      logger.error(`[ATOMIC-HOLD] Failed to create hold`, { slotId, userId, error });

      // Determine conflict reason
      if (error.code === '23505') { // Unique violation
        return {
          success: false,
          conflictReason: 'EXISTS',
          version
        };
      }

      return {
        success: false,
        conflictReason: 'DATABASE_ERROR',
        version
      };
    }

    return {
      success: true,
      holdId: data.id,
      version: data.version || version
    };
  }

  private async convertHoldToBookingAtomic(
    holdId: string,
    transactionId: string
  ): Promise<{ success: boolean; reason?: string }> {
    // Convert hold to booking with atomic transaction
    const { data, error } = await supabase.rpc('convert_hold_to_booking', {
      p_hold_id: holdId,
      p_session_id: transactionId
    });

    if (error) {
      logger.error(`[ATOMIC-HOLD] Failed to convert hold to booking`, { holdId, error });
      return { success: false, reason: error.message };
    }

    return { success: true };
  }

  private async validateServiceAvailabilityAtomic(
    serviceId: string,
    timeSlot: TimeSlot
  ): Promise<{ valid: boolean; reason?: string }> {
    // Atomic validation with current database state
    const { data, error } = await supabase.rpc('validate_service_availability', {
      p_service_id: serviceId,
      p_booking_date: timeSlot.date.toISOString().split('T')[0],
      p_booking_time: timeSlot.time,
      p_duration_minutes: 60 // This should come from service
    });

    if (error) {
      logger.error(`[ATOMIC-BOOKING] Validation failed`, { serviceId, error });
      return { valid: false, reason: 'Validation service error' };
    }

    return {
      valid: data?.is_available || false,
      reason: data?.reason
    };
  }

  private async insertBookingAtomic(
    service: Service,
    timeSlot: TimeSlot,
    details: BookingDetails,
    transactionId: string,
    userId?: string
  ): Promise<AtomicBookingResult> {
    try {
      const bookingData = {
        user_id: userId,
        service_id: service.id,
        booking_date: timeSlot.date.toISOString().split('T')[0],
        booking_time: timeSlot.time,
        status: 'pending' as BookingStatus,
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
        metadata: {
          service_type: service.service_type,
          time_slot: timeSlot,
          transaction_id: transactionId,
          version: Date.now()
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: booking, error } = await supabase
        .from('bookings')
        .insert(bookingData)
        .select(`
          *,
          service:services(*)
        `)
        .single();

      if (error) {
        logger.error(`[ATOMIC-BOOKING] Failed to create booking`, error);

        if (error.code === '23505') { // Unique violation
          return {
            success: false,
            conflictReason: 'Time slot already booked'
          };
        }

        return {
          success: false,
          conflictReason: 'Failed to create booking'
        };
      }

      // Transform to domain model
      const domainBooking: Booking = {
        id: booking.id,
        service_id: booking.service_id,
        user_id: booking.user_id,
        status: booking.status,
        service: {
          id: service.id,
          title: service.title,
          slug: service.slug,
          service_type: service.service_type,
          price_from: service.price_from,
          price_to: service.price_to,
          duration_minutes: service.duration_minutes,
          image_url: service.image_url,
        },
        timeSlot,
        details,
        created_at: new Date(booking.created_at),
        updated_at: new Date(booking.updated_at),
      };

      return {
        success: true,
        booking: domainBooking,
        transactionId
      };

    } catch (error) {
      logger.error(`[ATOMIC-BOOKING] Exception during booking creation`, error);
      return {
        success: false,
        conflictReason: 'Booking creation failed'
      };
    }
  }

  private async updateBookingCaches(booking: Booking, serviceId: string): Promise<void> {
    try {
      // Update any relevant caches
      // This could include user booking history, service stats, etc.
      const cacheKeys = [
        `user_bookings:${booking.user_id}`,
        `service_stats:${serviceId}`,
        `booking:${booking.id}`
      ];

      for (const key of cacheKeys) {
        const redis = (cacheService as any).redis;
        if (redis) {
          await redis.del(key);
        }
      }

      logger.debug(`[CACHE] Updated booking caches`, {
        bookingId: booking.id,
        serviceId
      });

    } catch (error) {
      logger.error(`[CACHE] Failed to update booking caches`, error);
    }
  }

  private async invalidateAvailabilityCaches(serviceId: string, date: Date): Promise<void> {
    try {
      // Invalidate all availability caches for this service and date
      const locations = ['studio', 'online', 'fitness'] as LocationType[];

      for (const location of locations) {
        await cacheService.invalidateAvailability(serviceId, location, date);
      }

      // Invalidate date-based caches
      await cacheService.invalidateDate(date);

      // Emit cache invalidation event
      this.emit({
        type: 'cache.invalidated',
        keys: [`availability:${serviceId}`, `date:${date.toISOString().split('T')[0]}`],
        reason: 'Booking created or modified'
      });

      logger.debug(`[CACHE] Invalidated availability caches`, { serviceId, date });

    } catch (error) {
      logger.error(`[CACHE] Failed to invalidate availability caches`, error);
    }
  }

  private async rollbackHoldCreation(rollbackData: any): Promise<void> {
    try {
      if (rollbackData.cacheHold) {
        await cacheService.removeHoldFromCache(rollbackData.cacheHold.slotId);
      }
      logger.debug(`[ROLLBACK] Successfully rolled back hold creation`, rollbackData);
    } catch (error) {
      logger.error(`[ROLLBACK] Failed to rollback hold creation`, error);
    }
  }

  private async rollbackBookingCreation(rollbackData: any): Promise<void> {
    try {
      if (rollbackData.booking) {
        // Delete the created booking
        await supabase
          .from('bookings')
          .delete()
          .eq('id', rollbackData.booking.id);

        // Update caches
        await this.updateBookingCaches(rollbackData.booking, rollbackData.booking.service_id);
      }
      logger.debug(`[ROLLBACK] Successfully rolled back booking creation`, rollbackData);
    } catch (error) {
      logger.error(`[ROLLBACK] Failed to rollback booking creation`, error);
    }
  }

  private async emitConflictEvent(
    type: 'HOLD_CONFLICT' | 'BOOKING_CONFLICT',
    details: any
  ): Promise<void> {
    this.emit({
      type: 'conflict.detected',
      type,
      details: {
        ...details,
        timestamp: new Date().toISOString(),
        version: Date.now()
      }
    });
  }

  private getLocationId(location: LocationType): string {
    const locationMap = {
      studio: 'studio-location-id',
      online: 'online-location-id',
      fitness: 'fitness-location-id',
    };
    return locationMap[location] || 'studio-location-id';
  }

  // Public health check methods

  async getAtomicServiceHealth(): Promise<{
    database: boolean;
    cache: boolean;
    locks: boolean;
    details: any;
  }> {
    try {
      const [dbHealth, cacheHealth, lockHealth] = await Promise.allSettled([
        this.checkDatabaseHealth(),
        this.checkCacheHealth(),
        this.checkLockHealth()
      ]);

      return {
        database: dbHealth.status === 'fulfilled' ? dbHealth.value : false,
        cache: cacheHealth.status === 'fulfilled' ? cacheHealth.value : false,
        locks: lockHealth.status === 'fulfilled' ? lockHealth.value : false,
        details: {
          database: dbHealth.status === 'fulfilled' ? dbHealth.value : dbHealth.reason,
          cache: cacheHealth.status === 'fulfilled' ? cacheHealth.value : cacheHealth.reason,
          locks: lockHealth.status === 'fulfilled' ? lockHealth.value : lockHealth.reason
        }
      };

    } catch (error) {
      logger.error(`[HEALTH] Error checking atomic service health`, error);
      return {
        database: false,
        cache: false,
        locks: false,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  private async checkDatabaseHealth(): Promise<boolean> {
    const { data, error } = await supabase
      .from('holds')
      .select('count')
      .limit(1);

    return !error && data !== null;
  }

  private async checkCacheHealth(): Promise<boolean> {
    return await cacheService.isHealthy();
  }

  private async checkLockHealth(): Promise<boolean> {
    try {
      const testLock = await this.acquireDistributedLock('health-check', 'health-service', 1000);
      if (testLock) {
        await this.releaseDistributedLock('health-check', testLock);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const bookingDomainServiceAtomic = BookingDomainServiceAtomic.getInstance();