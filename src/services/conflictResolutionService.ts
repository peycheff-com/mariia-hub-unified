import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

import { BookingEvent } from './bookingDomainServiceAtomic';
import { cacheServiceAtomic } from './cacheServiceAtomic';
import { webSocketServiceAtomic } from './websocketServiceAtomic';

// Conflict detection and resolution types
export interface ConflictEvent {
  id: string;
  type: 'HOLD_CONFLICT' | 'BOOKING_CONFLICT' | 'CACHE_CONFLICT' | 'VERSION_CONFLICT';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: {
    resourceType: 'slot' | 'service' | 'booking' | 'cache';
    resourceId: string;
    timestamp: Date;
    participants: string[]; // User IDs or transaction IDs involved
    data: any; // Specific conflict data
  };
  resolution?: {
    strategy: ConflictResolutionStrategy;
    result: 'resolved' | 'escalated' | 'pending';
    action: string;
    timestamp: Date;
  };
}

export type ConflictResolutionStrategy =
  | 'first_come_first_serve'
  | 'last_wins'
  | 'consensus'
  | 'arbitration'
  | 'rollback_all'
  | 'priority_based'
  | 'admin_intervention';

export interface ConflictMetrics {
  totalConflicts: number;
  conflictsByType: Record<string, number>;
  conflictsBySeverity: Record<string, number>;
  averageResolutionTime: number;
  resolutionSuccessRate: number;
  activeConflicts: number;
  conflictsLastHour: number;
}

export interface ConflictPattern {
  type: string;
  frequency: number;
  commonCauses: string[];
  recommendedActions: string[];
  lastOccurrence: Date;
}

/**
 * Conflict Detection and Resolution Service
 *
 * Provides intelligent conflict detection, resolution strategies,
 * and proactive prevention mechanisms for the booking system.
 */
export class ConflictResolutionService {
  private static instance: ConflictResolutionService;
  private activeConflicts = new Map<string, ConflictEvent>();
  private conflictHistory: ConflictEvent[] = [];
  private conflictPatterns = new Map<string, ConflictPattern>();
  private resolutionHandlers = new Map<ConflictResolutionStrategy, Function>();
  private monitoringInterval: NodeJS.Timeout | null = null;

  static getInstance(): ConflictResolutionService {
    if (!ConflictResolutionService.instance) {
      ConflictResolutionService.instance = new ConflictResolutionService();
    }
    return ConflictResolutionService.instance;
  }

  constructor() {
    this.setupResolutionHandlers();
    this.startMonitoring();
    this.loadHistoricalPatterns();
  }

  // Main conflict detection

  async detectAndResolveConflict(event: BookingEvent): Promise<ConflictEvent | null> {
    const conflict = await this.analyzeEventForConflict(event);

    if (!conflict) {
      return null;
    }

    logger.warn(`Conflict detected: ${conflict.type}`, {
      conflictId: conflict.id,
      severity: conflict.severity,
      resourceType: conflict.details.resourceType,
      resourceId: conflict.details.resourceId
    });

    // Add to active conflicts
    this.activeConflicts.set(conflict.id, conflict);

    // Attempt automatic resolution
    const resolutionResult = await this.attemptConflictResolution(conflict);

    if (resolutionResult.resolved) {
      conflict.resolution = {
        strategy: resolutionResult.strategy,
        result: 'resolved',
        action: resolutionResult.action,
        timestamp: new Date()
      };

      // Move to history
      this.activeConflicts.delete(conflict.id);
      this.conflictHistory.push(conflict);

      // Publish resolution
      await this.publishConflictResolution(conflict);

    } else {
      // Escalate if automatic resolution failed
      await this.escalateConflict(conflict);
    }

    // Update conflict patterns
    this.updateConflictPatterns(conflict);

    return conflict;
  }

  private async analyzeEventForConflict(event: BookingEvent): Promise<ConflictEvent | null> {
    try {
      switch (event.type) {
        case 'slot.reserved':
          return await this.analyzeSlotReservationConflict(event);
        case 'booking.created':
          return await this.analyzeBookingCreationConflict(event);
        case 'conflict.detected':
          return this.analyzeExplicitConflict(event);
        default:
          return null;
      }
    } catch (error) {
      logger.error('Error analyzing event for conflicts:', error);
      return null;
    }
  }

  private async analyzeSlotReservationConflict(event: any): Promise<ConflictEvent | null> {
    const { slotId, userId } = event;

    // Check for existing holds on the same slot
    const { data: existingHolds } = await supabase
      .from('holds')
      .select('*')
      .eq('slot_id', slotId)
      .gt('expires_at', new Date().toISOString())
      .neq('user_id', userId);

    if (!existingHolds || existingHolds.length === 0) {
      return null;
    }

    // Check for recent bookings on the same slot
    const { data: recentBookings } = await supabase
      .from('bookings')
      .select('*')
      .eq('booking_time', new Date().toISOString())
      .in('status', ['pending', 'confirmed'])
      .limit(5);

    const hasRecentBooking = recentBookings && recentBookings.length > 0;

    return {
      id: this.generateConflictId(),
      type: 'HOLD_CONFLICT',
      severity: hasRecentBooking ? 'critical' : 'high',
      details: {
        resourceType: 'slot',
        resourceId: slotId,
        timestamp: new Date(),
        participants: [userId, ...existingHolds.map(h => h.user_id)],
        data: {
          conflictingHolds: existingHolds,
          hasRecentBooking,
          eventTimestamp: event.expiresAt
        }
      }
    };
  }

  private async analyzeBookingCreationConflict(event: any): Promise<ConflictEvent | null> {
    const { booking } = event;

    // Check for existing bookings with overlapping time
    const { data: overlappingBookings } = await supabase
      .from('bookings')
      .select('*')
      .eq('service_id', booking.service_id)
      .eq('booking_date', booking.timeSlot.date.toISOString().split('T')[0])
      .in('status', ['pending', 'confirmed'])
      .neq('id', booking.id);

    if (!overlappingBookings || overlappingBookings.length === 0) {
      return null;
    }

    // Check for cache inconsistencies
    const cachedAvailability = await cacheServiceAtomic.getAvailabilityAtomic(
      booking.service_id,
      booking.timeSlot.location,
      booking.timeSlot.date
    );

    const cacheInconsistent = cachedAvailability &&
      !cachedAvailability.slots.some(slot =>
        slot.id === booking.timeSlot.id && slot.available
      );

    return {
      id: this.generateConflictId(),
      type: cacheInconsistent ? 'CACHE_CONFLICT' : 'BOOKING_CONFLICT',
      severity: cacheInconsistent ? 'critical' : 'high',
      details: {
        resourceType: 'booking',
        resourceId: booking.id,
        timestamp: new Date(),
        participants: [booking.user_id, ...overlappingBookings.map(b => b.user_id)],
        data: {
          conflictingBookings: overlappingBookings,
          cacheInconsistent,
          cachedAvailability: cachedAvailability?.slots.length || 0
        }
      }
    };
  }

  private analyzeExplicitConflict(event: any): ConflictEvent | null {
    if (!event.details) {
      return null;
    }

    return {
      id: this.generateConflictId(),
      type: event.details.type || 'UNKNOWN_CONFLICT',
      severity: this.determineConflictSeverity(event.details),
      details: {
        resourceType: event.details.resourceType || 'unknown',
        resourceId: event.details.resourceId || 'unknown',
        timestamp: new Date(),
        participants: event.details.participants || [],
        data: event.details
      }
    };
  }

  // Conflict resolution strategies

  private async attemptConflictResolution(conflict: ConflictEvent): Promise<{
    resolved: boolean;
    strategy: ConflictResolutionStrategy;
    action: string;
  }> {
    const strategies = this.getResolutionStrategies(conflict);

    for (const strategy of strategies) {
      try {
        const result = await this.executeResolutionStrategy(conflict, strategy);
        if (result.resolved) {
          logger.info(`Conflict resolved with strategy: ${strategy}`, {
            conflictId: conflict.id,
            action: result.action
          });
          return result;
        }
      } catch (error) {
        logger.error(`Resolution strategy ${strategy} failed:`, error);
        continue;
      }
    }

    return {
      resolved: false,
      strategy: 'admin_intervention',
      action: 'Automatic resolution failed, escalating'
    };
  }

  private getResolutionStrategies(conflict: ConflictEvent): ConflictResolutionStrategy[] {
    const strategies: ConflictResolutionStrategy[] = [];

    switch (conflict.type) {
      case 'HOLD_CONFLICT':
        if (conflict.severity === 'low') {
          strategies.push('first_come_first_serve', 'last_wins');
        } else {
          strategies.push('priority_based', 'arbitration');
        }
        break;

      case 'BOOKING_CONFLICT':
        strategies.push('first_come_first_serve', 'consensus');
        break;

      case 'CACHE_CONFLICT':
        strategies.push('rollback_all', 'consensus');
        break;

      case 'VERSION_CONFLICT':
        strategies.push('last_wins', 'arbitration');
        break;

      default:
        strategies.push('admin_intervention');
    }

    return strategies;
  }

  private async executeResolutionStrategy(
    conflict: ConflictEvent,
    strategy: ConflictResolutionStrategy
  ): Promise<{ resolved: boolean; strategy: ConflictResolutionStrategy; action: string }> {
    const handler = this.resolutionHandlers.get(strategy);
    if (!handler) {
      throw new Error(`No handler for strategy: ${strategy}`);
    }

    return await handler(conflict);
  }

  private setupResolutionHandlers(): void {
    // First come, first serve resolution
    this.resolutionHandlers.set('first_come_first_serve', async (conflict) => {
      const { details } = conflict;

      if (conflict.type === 'HOLD_CONFLICT') {
        // Keep the earliest hold, release others
        const conflictingHolds = details.data.conflictingHolds;
        if (conflictingHolds.length > 1) {
          // Sort by creation time
          conflictingHolds.sort((a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );

          // Keep the first, release the rest
          const toKeep = conflictingHolds[0];
          const toRelease = conflictingHolds.slice(1);

          for (const hold of toRelease) {
            await supabase.from('holds').delete().eq('id', hold.id);
            await cacheServiceAtomic.removeHoldFromCache(hold.slot_id);
          }

          return {
            resolved: true,
            strategy: 'first_come_first_serve',
            action: `Kept earliest hold (${toKeep.id}), released ${toRelease.length} conflicting holds`
          };
        }
      }

      return {
        resolved: false,
        strategy: 'first_come_first_serve',
        action: 'No holds to resolve'
      };
    });

    // Last wins resolution
    this.resolutionHandlers.set('last_wins', async (conflict) => {
      const { details } = conflict;

      if (conflict.type === 'HOLD_CONFLICT') {
        const conflictingHolds = details.data.conflictingHolds;
        if (conflictingHolds.length > 1) {
          // Sort by creation time (newest first)
          conflictingHolds.sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );

          // Keep the last, release the rest
          const toKeep = conflictingHolds[0];
          const toRelease = conflictingHolds.slice(1);

          for (const hold of toRelease) {
            await supabase.from('holds').delete().eq('id', hold.id);
            await cacheServiceAtomic.removeHoldFromCache(hold.slot_id);
          }

          return {
            resolved: true,
            strategy: 'last_wins',
            action: `Kept latest hold (${toKeep.id}), released ${toRelease.length} conflicting holds`
          };
        }
      }

      return {
        resolved: false,
        strategy: 'last_wins',
        action: 'No holds to resolve'
      };
    });

    // Priority based resolution
    this.resolutionHandlers.set('priority_based', async (conflict) => {
      // This would involve checking user priorities, service importance, etc.
      // For now, fall back to first come first serve
      return await this.resolutionHandlers.get('first_come_first_serve')!(conflict);
    });

    // Rollback all resolution
    this.resolutionHandlers.set('rollback_all', async (conflict) => {
      const { details } = conflict;

      if (conflict.type === 'CACHE_CONFLICT') {
        // Invalidate all related caches
        const tags = [`availability:${details.resourceId}`];
        await cacheServiceAtomic.invalidateByTags(
          tags,
          'immediate',
          `Conflict rollback: ${conflict.id}`
        );

        return {
          resolved: true,
          strategy: 'rollback_all',
          action: 'Invalidated all related caches due to conflict'
        };
      }

      return {
        resolved: false,
        strategy: 'rollback_all',
        action: 'Not applicable for this conflict type'
      };
    });

    // Admin intervention
    this.resolutionHandlers.set('admin_intervention', async (conflict) => {
      // Log for admin review
      logger.error(`Conflict requires admin intervention:`, conflict);

      // Could also create admin notification here
      await this.notifyAdmins(conflict);

      return {
        resolved: false,
        strategy: 'admin_intervention',
        action: 'Escalated to administrators'
      };
    });
  }

  // Conflict escalation and notification

  private async escalateConflict(conflict: ConflictEvent): Promise<void> {
    logger.error(`Conflict escalation required: ${conflict.type}`, conflict);

    // Update conflict to escalated status
    conflict.resolution = {
      strategy: 'admin_intervention',
      result: 'escalated',
      action: 'Awaiting admin intervention',
      timestamp: new Date()
    };

    // Publish escalation event
    await this.publishConflictEscalation(conflict);

    // Notify administrators
    await this.notifyAdmins(conflict);
  }

  private async notifyAdmins(conflict: ConflictEvent): Promise<void> {
    // This would integrate with notification systems
    // For now, just log at error level
    logger.error('ADMIN NOTIFICATION REQUIRED', {
      conflictId: conflict.id,
      type: conflict.type,
      severity: conflict.severity,
      resourceId: conflict.details.resourceId,
      participants: conflict.details.participants,
      timestamp: conflict.details.timestamp
    });
  }

  private async publishConflictResolution(conflict: ConflictEvent): Promise<void> {
    if (webSocketServiceAtomic.isHealthy()) {
      webSocketServiceAtomic.publishConflictDetected({
        type: conflict.type,
        details: conflict.details,
        timestamp: conflict.details.timestamp,
        resolved: true,
        resolution: conflict.resolution
      });
    }
  }

  private async publishConflictEscalation(conflict: ConflictEvent): Promise<void> {
    if (webSocketServiceAtomic.isHealthy()) {
      webSocketServiceAtomic.publishConflictDetected({
        type: conflict.type,
        details: conflict.details,
        timestamp: conflict.details.timestamp,
        resolved: false,
        escalated: true
      });
    }
  }

  // Pattern analysis and learning

  private updateConflictPatterns(conflict: ConflictEvent): void {
    const patternKey = `${conflict.type}_${conflict.details.resourceType}`;
    let pattern = this.conflictPatterns.get(patternKey);

    if (!pattern) {
      pattern = {
        type: conflict.type,
        frequency: 0,
        commonCauses: [],
        recommendedActions: [],
        lastOccurrence: new Date()
      };
      this.conflictPatterns.set(patternKey, pattern);
    }

    pattern.frequency++;
    pattern.lastOccurrence = new Date();

    // Analyze causes (simplified)
    if (conflict.details.data.hasRecentBooking) {
      if (!pattern.commonCauses.includes('recent_booking_overlap')) {
        pattern.commonCauses.push('recent_booking_overlap');
      }
    }

    if (conflict.details.data.cacheInconsistent) {
      if (!pattern.commonCauses.includes('cache_inconsistency')) {
        pattern.commonCauses.push('cache_inconsistency');
      }
    }

    // Update recommendations based on patterns
    if (pattern.frequency > 5 && conflict.type === 'HOLD_CONFLICT') {
      if (!pattern.recommendedActions.includes('reduce_hold_timeout')) {
        pattern.recommendedActions.push('reduce_hold_timeout');
      }
    }

    if (pattern.frequency > 10) {
      if (!pattern.recommendedActions.includes('investigate_system_performance')) {
        pattern.recommendedActions.push('investigate_system_performance');
      }
    }
  }

  private async loadHistoricalPatterns(): Promise<void> {
    try {
      // Load recent conflicts from database for pattern analysis
      const { data: recentConflicts } = await supabase
        .from('conflict_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (recentConflicts) {
        for (const conflictData of recentConflicts) {
          this.conflictHistory.push({
            id: conflictData.id,
            type: conflictData.conflict_type,
            severity: conflictData.severity,
            details: conflictData.details,
            resolution: conflictData.resolution
          });

          // Update patterns
          this.updateConflictPatterns(this.conflictHistory[this.conflictHistory.length - 1]);
        }
      }

      logger.info('Loaded historical conflict patterns', {
        totalConflicts: this.conflictHistory.length,
        patterns: this.conflictPatterns.size
      });

    } catch (error) {
      logger.error('Failed to load historical patterns:', error);
    }
  }

  // Monitoring and metrics

  private startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck();
      this.cleanupExpiredConflicts();
    }, 60000); // Every minute
  }

  private performHealthCheck(): void {
    const metrics = this.getConflictMetrics();

    if (metrics.activeConflicts > 10) {
      logger.warn('High number of active conflicts detected', metrics);
    }

    if (metrics.conflictsLastHour > 50) {
      logger.error('Critical: High conflict rate detected', metrics);
    }

    if (metrics.resolutionSuccessRate < 0.8 && metrics.totalConflicts > 10) {
      logger.error('Critical: Low conflict resolution success rate', metrics);
    }
  }

  private cleanupExpiredConflicts(): void {
    const now = new Date();
    const expiredThreshold = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago

    // Move expired active conflicts to history
    for (const [id, conflict] of this.activeConflicts.entries()) {
      if (conflict.details.timestamp < expiredThreshold) {
        conflict.resolution = {
          strategy: 'admin_intervention',
          result: 'pending',
          action: 'Conflict expired without resolution',
          timestamp: now
        };

        this.activeConflicts.delete(id);
        this.conflictHistory.push(conflict);
      }
    }

    // Limit history size
    if (this.conflictHistory.length > 1000) {
      this.conflictHistory = this.conflictHistory.slice(-500);
    }
  }

  // Public API

  getConflictMetrics(): ConflictMetrics {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const conflictsByType: Record<string, number> = {};
    const conflictsBySeverity: Record<string, number> = {};
    const conflictsLastHour = this.conflictHistory.filter(c =>
      c.details.timestamp > oneHourAgo
    ).length;

    let totalResolutionTime = 0;
    let resolvedConflicts = 0;

    for (const conflict of this.conflictHistory) {
      // Type distribution
      conflictsByType[conflict.type] = (conflictsByType[conflict.type] || 0) + 1;

      // Severity distribution
      conflictsBySeverity[conflict.severity] = (conflictsBySeverity[conflict.severity] || 0) + 1;

      // Resolution metrics
      if (conflict.resolution && conflict.resolution.result === 'resolved') {
        resolvedConflicts++;
        const resolutionTime = conflict.resolution.timestamp.getTime() - conflict.details.timestamp.getTime();
        totalResolutionTime += resolutionTime;
      }
    }

    return {
      totalConflicts: this.conflictHistory.length,
      conflictsByType,
      conflictsBySeverity,
      averageResolutionTime: resolvedConflicts > 0 ? totalResolutionTime / resolvedConflicts : 0,
      resolutionSuccessRate: this.conflictHistory.length > 0 ? resolvedConflicts / this.conflictHistory.length : 1,
      activeConflicts: this.activeConflicts.size,
      conflictsLastHour
    };
  }

  getConflictPatterns(): Map<string, ConflictPattern> {
    return new Map(this.conflictPatterns);
  }

  getActiveConflicts(): ConflictEvent[] {
    return Array.from(this.activeConflicts.values());
  }

  getRecommendations(): string[] {
    const recommendations: string[] = [];
    const metrics = this.getConflictMetrics();

    if (metrics.conflictsLastHour > 20) {
      recommendations.push('Consider reducing hold timeout to prevent conflicts');
      recommendations.push('Implement rate limiting for booking requests');
    }

    if (metrics.resolutionSuccessRate < 0.9) {
      recommendations.push('Review conflict resolution strategies');
      recommendations.push('Consider implementing more aggressive conflict detection');
    }

    if (metrics.conflictsByType['CACHE_CONFLICT'] > 5) {
      recommendations.push('Investigate cache coherence issues');
      recommendations.push('Consider implementing cache versioning');
    }

    // Add pattern-based recommendations
    for (const pattern of this.conflictPatterns.values()) {
      if (pattern.frequency > 10) {
        recommendations.push(...pattern.recommendedActions);
      }
    }

    return [...new Set(recommendations)]; // Remove duplicates
  }

  // Utility methods

  private determineConflictSeverity(details: any): 'low' | 'medium' | 'high' | 'critical' {
    // Simple severity determination based on conflict details
    if (details.hasRecentBooking || details.cacheInconsistent) {
      return 'critical';
    } else if (details.participants.length > 3) {
      return 'high';
    } else if (details.participants.length > 1) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  private generateConflictId(): string {
    return `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Cleanup

  async shutdown(): Promise<void> {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    // Save current state if needed
    logger.info('Conflict resolution service shutdown');
  }
}

// Export singleton instance
export const conflictResolutionService = ConflictResolutionService.getInstance();