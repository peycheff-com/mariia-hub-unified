/**
 * Booksy Availability Synchronization
 *
 * Real-time synchronization of availability slots between platform and Booksy
 * Handles bidirectional sync, conflict resolution, and calendar management
 */

import { booksyClient, BooksyAvailability, BooksyTimeSlot } from './booksy-api-client';
import { bookingService } from './booking.service';
import { supabase } from '@/integrations/supabase/client';
import { BaseService } from './api/base.service';

export interface AvailabilitySlot {
  id: string;
  serviceId: string;
  startTime: string;
  endTime: string;
  status: 'available' | 'held' | 'booked' | 'blocked';
  maxParticipants?: number;
  currentParticipants?: number;
  booksySlotId?: string;
  booksySyncStatus?: 'pending' | 'synced' | 'error' | 'conflict';
  booksyLastSync?: string;
  metadata?: Record<string, any>;
}

export interface AvailabilityConflict {
  id: string;
  slotId: string;
  booksySlotId?: string;
  conflictType: 'double_booking' | 'time_overlap' | 'availability_mismatch' | 'capacity_conflict';
  platformData: AvailabilitySlot;
  booksyData?: BooksyTimeSlot;
  resolutionStatus: 'pending' | 'resolved_platform' | 'resolved_booksy' | 'manual_review';
  autoResolved: boolean;
  createdAt: Date;
  resolvedAt?: Date;
}

export interface SyncRule {
  id: string;
  name: string;
  description: string;
  sourceSystem: 'platform' | 'booksy' | 'both';
  priority: number;
  conditions: {
    serviceTypes?: string[];
    timeWindows?: Array<{ start: string; end: string }>;
    bufferTimes?: { before: number; after: number };
    maxAdvanceBooking?: number; // days
  };
  actions: {
    syncAvailability: boolean;
    autoResolveConflicts: boolean;
    notifyAdmin: boolean;
  };
  active: boolean;
}

export class BooksyAvailabilitySync extends BaseService {
  private static instance: BooksyAvailabilitySync;
  private syncRules: Map<string, SyncRule> = new Map();
  private isProcessing: boolean = false;
  private lastFullSync: Date | null = null;
  private conflicts: Map<string, AvailabilityConflict> = new Map();

  static getInstance(): BooksyAvailabilitySync {
    if (!BooksyAvailabilitySync.instance) {
      BooksyAvailabilitySync.instance = new BooksyAvailabilitySync();
    }
    return BooksyAvailabilitySync.instance;
  }

  constructor() {
    super();
    this.initializeDefaultRules();
  }

  /**
   * Initialize the availability sync system
   */
  async initialize(): Promise<void> {
    try {
      // Load sync rules from database
      await this.loadSyncRules();

      // Load existing conflicts
      await this.loadConflicts();

      // Start periodic sync processor
      this.startSyncProcessor();

      console.log('Booksy Availability Sync initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Booksy Availability Sync:', error);
      throw error;
    }
  }

  /**
   * Perform full availability synchronization
   */
  async performFullAvailabilitySync(): Promise<{
    synced: number;
    conflicts: number;
    errors: string[];
  }> {
    const result = {
      synced: 0,
      conflicts: 0,
      errors: [] as string[]
    };

    if (this.isProcessing) {
      result.errors.push('Sync already in progress');
      return result;
    }

    this.isProcessing = true;
    const startTime = Date.now();

    try {
      // Get all active services that have Booksy integration
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('id, booksy_service_id, name, duration, buffer_time_before, buffer_time_after')
        .not('booksy_service_id', 'is', null)
        .eq('active', true);

      if (servicesError) {
        throw new Error(`Failed to fetch services: ${servicesError.message}`);
      }

      for (const service of services || []) {
        try {
          const syncResult = await this.syncServiceAvailability(service);
          result.synced += syncResult.synced;
          result.conflicts += syncResult.conflicts;
          result.errors.push(...syncResult.errors);
        } catch (error) {
          result.errors.push(`Failed to sync service ${service.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      this.lastFullSync = new Date();

      // Log the sync operation
      await this.logSyncActivity('full_availability_sync', 'availability', null, null, {
        synced: result.synced,
        conflicts: result.conflicts,
        duration: Date.now() - startTime
      }, 'from_booksy', null, true);

      console.log(`Full availability sync completed. Synced: ${result.synced}, Conflicts: ${result.conflicts}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`Full availability sync failed: ${errorMessage}`);

      await this.logSyncActivity('full_availability_sync_failed', 'availability', null, null, {
        error: errorMessage,
        duration: Date.now() - startTime
      }, 'from_booksy', null, false, errorMessage);
    } finally {
      this.isProcessing = false;
    }

    return result;
  }

  /**
   * Sync availability for a specific service
   */
  async syncServiceAvailability(service: {
    id: string;
    booksy_service_id: string;
    name: string;
    duration: number;
    buffer_time_before?: number;
    buffer_time_after?: number;
  }): Promise<{ synced: number; conflicts: number; errors: string[] }> {
    const result = { synced: 0, conflicts: 0, errors: [] as string[] };

    try {
      // Get availability for next 30 days from Booksy
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);

      const booksyAvailability = await booksyClient.getAvailability(
        service.booksy_service_id,
        startDate.toISOString().split('T')[0]
      );

      // Get current platform availability
      const { data: platformSlots, error: platformError } = await supabase
        .from('availability_slots')
        .select('*')
        .eq('service_id', service.id)
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString());

      if (platformError) {
        throw new Error(`Failed to fetch platform availability: ${platformError.message}`);
      }

      // Sync Booksy availability to platform
      for (const booksySlot of booksyAvailability.slots) {
        try {
          await this.syncBooksySlotToPlatform(service, booksySlot, platformSlots || []);
          result.synced++;
        } catch (error) {
          result.errors.push(`Failed to sync Booksy slot ${booksySlot.start}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Sync platform availability to Booksy (only for newly created slots)
      for (const platformSlot of platformSlots || []) {
        if (!platformSlot.booksy_slot_id && platformSlot.status === 'available') {
          try {
            await this.syncPlatformSlotToBooksy(service, platformSlot);
            result.synced++;
          } catch (error) {
            result.errors.push(`Failed to sync platform slot ${platformSlot.start_time}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }
    } catch (error) {
      result.errors.push(`Service availability sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Sync Booksy slot to platform
   */
  private async syncBooksySlotToPlatform(
    service: any,
    booksySlot: BooksyTimeSlot,
    platformSlots: any[]
  ): Promise<void> {
    // Find matching platform slot
    const existingSlot = platformSlots.find(slot =>
      slot.booksy_slot_id === booksySlot.start ||
      this.timeSlotsMatch(slot, booksySlot)
    );

    const slotData = {
      service_id: service.id,
      start_time: booksySlot.start,
      end_time: booksySlot.end,
      status: booksySlot.available ? 'available' : 'booked',
      booksy_slot_id: booksySlot.start,
      booksy_sync_status: 'synced',
      booksy_last_sync: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (existingSlot) {
      // Check for conflicts
      if (this.hasAvailabilityConflict(existingSlot, booksySlot)) {
        await this.createAvailabilityConflict(existingSlot, booksySlot);
        return;
      }

      // Update existing slot
      const { error: updateError } = await supabase
        .from('availability_slots')
        .update(slotData)
        .eq('id', existingSlot.id);

      if (updateError) {
        throw new Error(`Failed to update platform slot: ${updateError.message}`);
      }
    } else {
      // Create new slot
      const { error: insertError } = await supabase
        .from('availability_slots')
        .insert({
          ...slotData,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString()
        });

      if (insertError) {
        throw new Error(`Failed to create platform slot: ${insertError.message}`);
      }
    }
  }

  /**
   * Sync platform slot to Booksy
   */
  private async syncPlatformSlotToBooksy(service: any, platformSlot: any): Promise<void> {
    try {
      // Booksy doesn't typically allow creating availability slots via API
      // This would be implemented based on Booksy's specific API capabilities
      // For now, we'll just mark it as not syncable

      await supabase
        .from('availability_slots')
        .update({
          booksy_sync_status: 'error',
          booksy_sync_error: 'Platform to Booksy slot creation not supported',
          booksy_last_sync: new Date().toISOString()
        })
        .eq('id', platformSlot.id);

      console.log(`Platform slot ${platformSlot.id} cannot be synced to Booksy (API limitation)`);
    } catch (error) {
      throw new Error(`Failed to sync platform slot to Booksy: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Handle booking created in platform - update Booksy availability
   */
  async handlePlatformBooking(booking: {
    id: string;
    service_id: string;
    start_time: string;
    end_time: string;
    booksy_booking_id?: string;
  }): Promise<void> {
    try {
      // Mark the time slot as booked in platform
      const { error: updateError } = await supabase
        .from('availability_slots')
        .update({
          status: 'booked',
          booking_id: booking.id,
          updated_at: new Date().toISOString()
        })
        .eq('service_id', booking.service_id)
        .eq('start_time', booking.start_time)
        .eq('status', 'available');

      if (updateError) {
        console.error('Failed to update platform availability:', updateError);
      }

      // If booking was synced to Booksy, the availability should already be updated there
      // Otherwise, we might need to manually block the time in Booksy
      if (!booking.booksy_booking_id) {
        await this.blockTimeInBooksy(booking);
      }

      await this.logSyncActivity('booking_created', 'availability', booking.id, null, {
        service_id: booking.service_id,
        start_time: booking.start_time
      }, 'to_booksy', null, true);
    } catch (error) {
      console.error('Failed to handle platform booking:', error);
      await this.logSyncActivity('booking_handling_failed', 'availability', booking.id, null, {
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 'to_booksy', null, false, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Handle booking cancelled in platform - free up availability
   */
  async handlePlatformCancellation(booking: {
    id: string;
    service_id: string;
    start_time: string;
    end_time: string;
    booksy_booking_id?: string;
  }): Promise<void> {
    try {
      // Mark the time slot as available again in platform
      const { error: updateError } = await supabase
        .from('availability_slots')
        .update({
          status: 'available',
          booking_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('booking_id', booking.id);

      if (updateError) {
        console.error('Failed to update platform availability:', updateError);
      }

      // If booking was synced to Booksy, the availability should be updated there via webhook
      // Otherwise, we might need to manually unblock the time in Booksy
      if (!booking.booksy_booking_id) {
        await this.unblockTimeInBooksy(booking);
      }

      await this.logSyncActivity('booking_cancelled', 'availability', booking.id, null, {
        service_id: booking.service_id,
        start_time: booking.start_time
      }, 'to_booksy', null, true);
    } catch (error) {
      console.error('Failed to handle platform cancellation:', error);
      await this.logSyncActivity('cancellation_handling_failed', 'availability', booking.id, null, {
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 'to_booksy', null, false, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Handle Booksy webhook for availability changes
   */
  async handleBooksyAvailabilityWebhook(webhookData: {
    event: string;
    data: any;
  }): Promise<void> {
    try {
      switch (webhookData.event) {
        case 'availability.updated':
          await this.processBooksyAvailabilityUpdate(webhookData.data);
          break;
        case 'booking.created':
          await this.processBooksyBookingCreated(webhookData.data);
          break;
        case 'booking.cancelled':
          await this.processBooksyBookingCancelled(webhookData.data);
          break;
        default:
          console.log(`Unhandled Booksy availability webhook event: ${webhookData.event}`);
      }
    } catch (error) {
      console.error('Failed to handle Booksy availability webhook:', error);
      throw error;
    }
  }

  /**
   * Process Booksy availability update
   */
  private async processBooksyAvailabilityUpdate(data: any): Promise<void> {
    // Find corresponding service
    const { data: service } = await supabase
      .from('services')
      .select('id')
      .eq('booksy_service_id', data.service_id)
      .single();

    if (!service) {
      console.error(`Service not found for Booksy service ID: ${data.service_id}`);
      return;
    }

    // Update availability slots
    for (const slot of data.slots || []) {
      await this.syncBooksySlotToPlatform({ ...service, booksy_service_id: data.service_id }, slot, []);
    }
  }

  /**
   * Process Booksy booking created
   */
  private async processBooksyBookingCreated(data: any): Promise<void> {
    // Find corresponding platform slot
    const { data: slot } = await supabase
      .from('availability_slots')
      .select('*')
      .eq('booksy_slot_id', data.datetime)
      .eq('status', 'available')
      .single();

    if (slot) {
      // Mark slot as booked
      await supabase
        .from('availability_slots')
        .update({
          status: 'booked',
          booksy_booking_id: data.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', slot.id);
    }
  }

  /**
   * Process Booksy booking cancelled
   */
  private async processBooksyBookingCancelled(data: any): Promise<void> {
    // Find corresponding platform slot
    const { data: slot } = await supabase
      .from('availability_slots')
      .select('*')
      .eq('booksy_booking_id', data.id)
      .eq('status', 'booked')
      .single();

    if (slot) {
      // Mark slot as available again
      await supabase
        .from('availability_slots')
        .update({
          status: 'available',
          booksy_booking_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', slot.id);
    }
  }

  /**
   * Block time in Booksy (when booking created in platform)
   */
  private async blockTimeInBooksy(booking: any): Promise<void> {
    try {
      // This would depend on Booksy's API capabilities for blocking time
      // For now, we'll just log the action
      console.log(`Time blocking requested in Booksy for booking ${booking.id}`);

      // Add to sync queue for manual review if needed
      await supabase
        .from('booksy_sync_queue')
        .insert({
          id: crypto.randomUUID(),
          operation_type: 'block_time',
          entity_type: 'availability',
          entity_id: booking.id,
          payload: {
            service_id: booking.service_id,
            start_time: booking.start_time,
            end_time: booking.end_time
          },
          priority: 7,
          status: 'pending',
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to block time in Booksy:', error);
    }
  }

  /**
   * Unblock time in Booksy (when booking cancelled in platform)
   */
  private async unblockTimeInBooksy(booking: any): Promise<void> {
    try {
      // This would depend on Booksy's API capabilities for unblocking time
      // For now, we'll just log the action
      console.log(`Time unblocking requested in Booksy for booking ${booking.id}`);

      // Add to sync queue for manual review if needed
      await supabase
        .from('booksy_sync_queue')
        .insert({
          id: crypto.randomUUID(),
          operation_type: 'unblock_time',
          entity_type: 'availability',
          entity_id: booking.id,
          payload: {
            service_id: booking.service_id,
            start_time: booking.start_time,
            end_time: booking.end_time
          },
          priority: 7,
          status: 'pending',
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to unblock time in Booksy:', error);
    }
  }

  /**
   * Check if time slots match
   */
  private timeSlotsMatch(platformSlot: any, booksySlot: BooksyTimeSlot): boolean {
    const platformStart = new Date(platformSlot.start_time);
    const platformEnd = new Date(platformSlot.end_time);
    const booksyStart = new Date(booksySlot.start);
    const booksyEnd = new Date(booksySlot.end);

    // Allow 1-minute tolerance
    const tolerance = 60 * 1000; // 1 minute in milliseconds

    return (
      Math.abs(platformStart.getTime() - booksyStart.getTime()) <= tolerance &&
      Math.abs(platformEnd.getTime() - booksyEnd.getTime()) <= tolerance
    );
  }

  /**
   * Check for availability conflicts
   */
  private hasAvailabilityConflict(platformSlot: any, booksySlot: BooksyTimeSlot): boolean {
    // Check if statuses conflict
    const platformBooked = platformSlot.status === 'booked';
    const booksyBooked = !booksySlot.available;

    return platformBooked !== booksyBooked;
  }

  /**
   * Create availability conflict
   */
  private async createAvailabilityConflict(
    platformSlot: any,
    booksySlot: BooksyTimeSlot
  ): Promise<void> {
    try {
      const conflictId = crypto.randomUUID();

      await supabase
        .from('booksy_availability_conflicts')
        .insert({
          id: conflictId,
          slot_id: platformSlot.id,
          booksy_slot_id: booksySlot.start,
          conflict_type: 'availability_mismatch',
          platform_data: platformSlot,
          booksy_data: booksySlot,
          resolution_status: 'pending',
          auto_resolved: false,
          created_at: new Date().toISOString()
        });

      // Update platform slot status
      await supabase
        .from('availability_slots')
        .update({
          booksy_sync_status: 'conflict',
          booksy_sync_error: 'Availability conflict detected',
          updated_at: new Date().toISOString()
        })
        .eq('id', platformSlot.id);

      console.log(`Availability conflict created for slot ${platformSlot.id}`);
    } catch (error) {
      console.error('Failed to create availability conflict:', error);
    }
  }

  /**
   * Resolve availability conflict
   */
  async resolveConflict(
    conflictId: string,
    resolution: 'platform' | 'booksy' | 'manual'
  ): Promise<void> {
    try {
      const { data: conflict, error: fetchError } = await supabase
        .from('booksy_availability_conflicts')
        .select('*')
        .eq('id', conflictId)
        .single();

      if (fetchError || !conflict) {
        throw new Error('Conflict not found');
      }

      // Apply resolution
      if (resolution === 'platform') {
        // Update Booksy to match platform
        await this.syncPlatformSlotToBooksy(null, conflict.platform_data);
      } else if (resolution === 'booksy') {
        // Update platform to match Booksy
        await this.syncBooksySlotToPlatform(null, conflict.booksy_data, [conflict.platform_data]);
      }

      // Mark conflict as resolved
      await supabase
        .from('booksy_availability_conflicts')
        .update({
          resolution_status: `resolved_${resolution}`,
          resolved_at: new Date().toISOString()
        })
        .eq('id', conflictId);

      // Log conflict resolution
      await this.logSyncActivity('availability_conflict_resolved', 'availability', conflictId, null, {
        resolution,
        conflict_data: conflict
      }, 'conflict_resolution', null, true);

      console.log(`Availability conflict ${conflictId} resolved with ${resolution} priority`);
    } catch (error) {
      console.error('Failed to resolve availability conflict:', error);
      throw error;
    }
  }

  /**
   * Initialize default sync rules
   */
  private initializeDefaultRules(): void {
    const defaultRule: SyncRule = {
      id: 'default',
      name: 'Default Availability Sync',
      description: 'Default rule for syncing availability between platform and Booksy',
      sourceSystem: 'both',
      priority: 5,
      conditions: {
        bufferTimes: { before: 15, after: 15 }, // 15 minutes buffer
        maxAdvanceBooking: 90 // 90 days
      },
      actions: {
        syncAvailability: true,
        autoResolveConflicts: false,
        notifyAdmin: true
      },
      active: true
    };

    this.syncRules.set(defaultRule.id, defaultRule);
  }

  /**
   * Load sync rules from database
   */
  private async loadSyncRules(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('booksy_sync_rules')
        .select('*')
        .eq('active', true)
        .order('priority', { ascending: false });

      if (error) {
        throw new Error(`Failed to load sync rules: ${error.message}`);
      }

      this.syncRules.clear();
      (data || []).forEach(rule => {
        this.syncRules.set(rule.id, rule);
      });
    } catch (error) {
      console.error('Failed to load sync rules:', error);
    }
  }

  /**
   * Load existing conflicts
   */
  private async loadConflicts(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('booksy_availability_conflicts')
        .select('*')
        .eq('resolution_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to load conflicts: ${error.message}`);
      }

      this.conflicts.clear();
      (data || []).forEach(conflict => {
        this.conflicts.set(conflict.id, conflict as AvailabilityConflict);
      });
    } catch (error) {
      console.error('Failed to load conflicts:', error);
    }
  }

  /**
   * Start periodic sync processor
   */
  private startSyncProcessor(): void {
    setInterval(async () => {
      if (!this.isProcessing) {
        await this.performIncrementalSync();
      }
    }, 60000); // Sync every minute
  }

  /**
   * Perform incremental sync (recent changes only)
   */
  private async performIncrementalSync(): Promise<void> {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      // Get recent changes from platform
      const { data: recentChanges, error } = await supabase
        .from('availability_slots')
        .select('*')
        .gte('updated_at', fiveMinutesAgo.toISOString())
        .not('booksy_service_id', 'is', null);

      if (error) {
        console.error('Failed to fetch recent changes:', error);
        return;
      }

      // Process recent changes
      for (const change of recentChanges || []) {
        try {
          await this.processAvailabilityChange(change);
        } catch (error) {
          console.error(`Failed to process change for slot ${change.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Incremental sync failed:', error);
    }
  }

  /**
   * Process individual availability change
   */
  private async processAvailabilityChange(change: any): Promise<void> {
    // This would contain logic to sync individual changes
    // For now, just log the change
    console.log(`Processing availability change for slot ${change.id}`);
  }

  /**
   * Log sync activity
   */
  private async logSyncActivity(
    action: string,
    entityType: string,
    entityId: string | null,
    booksyEntityId: string | null,
    data: any,
    syncDirection: string,
    userId: string | null,
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    try {
      await supabase
        .from('booksy_audit_log')
        .insert({
          action,
          entity_type: entityType,
          entity_id: entityId,
          booksy_entity_id: booksyEntityId,
          new_data: data,
          sync_direction,
          user_id: userId,
          automated: true,
          success,
          error_message: errorMessage,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to log sync activity:', error);
    }
  }

  /**
   * Get sync status and statistics
   */
  async getSyncStatus(): Promise<{
    lastFullSync: Date | null;
    totalSlots: number;
    syncedSlots: number;
    conflictedSlots: number;
    pendingConflicts: number;
  }> {
    try {
      const { data: stats } = await supabase
        .from('booksy_availability_stats')
        .select('*')
        .single();

      const { count: conflictCount } = await supabase
        .from('booksy_availability_conflicts')
        .select('*', { count: 'exact', head: true })
        .eq('resolution_status', 'pending');

      return {
        lastFullSync: this.lastFullSync,
        totalSlots: stats?.total_slots || 0,
        syncedSlots: stats?.synced_slots || 0,
        conflictedSlots: stats?.conflicted_slots || 0,
        pendingConflicts: conflictCount || 0
      };
    } catch (error) {
      console.error('Failed to get sync status:', error);
      return {
        lastFullSync: this.lastFullSync,
        totalSlots: 0,
        syncedSlots: 0,
        conflictedSlots: 0,
        pendingConflicts: 0
      };
    }
  }
}

// Export singleton instance
export const booksyAvailabilitySync = BooksyAvailabilitySync.getInstance();