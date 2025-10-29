import { supabase } from '@/integrations/supabase/client';
import { WaitlistEntry, Service } from '@/types/booking';
import { logger } from '@/lib/logger';

export class WaitlistService {
  /**
   * Add a customer to the waitlist
   */
  async addToWaitlist(entry: Omit<WaitlistEntry, 'id' | 'createdAt' | 'updatedAt' | 'promotionAttempts'>): Promise<WaitlistEntry> {
    try {
      // Calculate priority score based on various factors
      const priorityScore = this.calculatePriorityScore(entry);

      const { data, error } = await supabase
        .from('waitlist_entries')
        .insert({
          service_id: entry.serviceId,
          user_id: entry.userId,
          preferred_date: entry.preferredDate.toISOString().split('T')[0],
          preferred_time: entry.preferredTime,
          preferred_time_range_start: entry.preferredTimeRangeStart,
          preferred_time_range_end: entry.preferredTimeRangeEnd,
          location_type: entry.locationType,
          group_size: entry.groupSize,
          flexible_with_time: entry.flexibleWithTime,
          flexible_with_location: entry.flexibleWithLocation,
          contact_email: entry.contactEmail,
          contact_phone: entry.contactPhone,
          notes: entry.notes,
          priority_score: priorityScore,
          auto_promote_eligible: entry.autoPromoteEligible,
          max_promotion_attempts: entry.maxPromotionAttempts
        })
        .select()
        .single();

      if (error) throw error;

      logger.info('Added to waitlist', { waitlistId: data.id, serviceId: entry.serviceId });
      return this.mapDbEntryToWaitlistEntry(data);
    } catch (error) {
      logger.error('Error adding to waitlist:', error);
      throw error;
    }
  }

  /**
   * Get waitlist entries for a specific service and date
   */
  async getWaitlistForService(
    serviceId: string,
    date: Date,
    includeExpired: boolean = false
  ): Promise<WaitlistEntry[]> {
    try {
      const { data, error } = await supabase
        .from('waitlist_entries')
        .select(`
          *,
          services (
            id,
            title,
            service_type,
            duration_minutes,
            price_from
          )
        `)
        .eq('service_id', serviceId)
        .eq('preferred_date', date.toISOString().split('T')[0])
        .in('status', includeExpired ? ['active', 'promoted', 'expired'] : ['active'])
        .order('priority_score', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;

      return (data || []).map(this.mapDbEntryToWaitlistEntry);
    } catch (error) {
      logger.error('Error getting waitlist for service:', error);
      return [];
    }
  }

  /**
   * Get user's waitlist entries
   */
  async getUserWaitlistEntries(userId: string): Promise<WaitlistEntry[]> {
    try {
      const { data, error } = await supabase
        .from('waitlist_entries')
        .select(`
          *,
          services (
            id,
            title,
            service_type,
            duration_minutes
          )
        `)
        .eq('user_id', userId)
        .in('status', ['active', 'promoted'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(this.mapDbEntryToWaitlistEntry);
    } catch (error) {
      logger.error('Error getting user waitlist entries:', error);
      return [];
    }
  }

  /**
   * Update waitlist entry status
   */
  async updateWaitlistStatus(
    waitlistId: string,
    status: WaitlistEntry['status'],
    bookingId?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'promoted' && bookingId) {
        updateData.promoted_booking_id = bookingId;
      }

      const { error } = await supabase
        .from('waitlist_entries')
        .update(updateData)
        .eq('id', waitlistId);

      if (error) throw error;

      logger.info('Waitlist entry updated', { waitlistId, status, bookingId });
    } catch (error) {
      logger.error('Error updating waitlist status:', error);
      throw error;
    }
  }

  /**
   * Remove from waitlist
   */
  async removeFromWaitlist(waitlistId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('waitlist_entries')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', waitlistId);

      if (error) throw error;

      logger.info('Removed from waitlist', { waitlistId });
    } catch (error) {
      logger.error('Error removing from waitlist:', error);
      throw error;
    }
  }

  /**
   * Check if waitlist is available for a service/time slot
   */
  async checkWaitlistAvailability(
    serviceId: string,
    date: Date,
    time?: string
  ): Promise<boolean> {
    try {
      const query = supabase
        .from('waitlist_entries')
        .select('id')
        .eq('service_id', serviceId)
        .eq('preferred_date', date.toISOString().split('T')[0])
        .eq('status', 'active');

      if (time) {
        query.eq('preferred_time', time);
      }

      const { data, error } = await query.limit(1);

      if (error) throw error;

      return (data || []).length === 0;
    } catch (error) {
      logger.error('Error checking waitlist availability:', error);
      return false;
    }
  }

  /**
   * Get next waitlist entry eligible for promotion
   */
  async getNextEligibleEntry(
    serviceId: string,
    date: Date,
    time: string,
    groupSize: number = 1
  ): Promise<WaitlistEntry | null> {
    try {
      // First try exact match
      const { data: exactMatch, error: exactError } = await supabase
        .from('waitlist_entries')
        .select('*')
        .eq('service_id', serviceId)
        .eq('preferred_date', date.toISOString().split('T')[0])
        .eq('preferred_time', time)
        .eq('status', 'active')
        .eq('auto_promote_eligible', true)
        .lte('group_size', groupSize)
        .lt('promotion_attempts', supabase.raw('max_promotion_attempts'))
        .order('priority_score', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(1);

      if (exactError) throw exactError;

      if (exactMatch && exactMatch.length > 0) {
        return this.mapDbEntryToWaitlistEntry(exactMatch[0]);
      }

      // If no exact match, try flexible time entries
      const { data: flexibleMatch, error: flexibleError } = await supabase
        .from('waitlist_entries')
        .select('*')
        .eq('service_id', serviceId)
        .eq('preferred_date', date.toISOString().split('T')[0])
        .eq('status', 'active')
        .eq('flexible_with_time', true)
        .eq('auto_promote_eligible', true)
        .lte('group_size', groupSize)
        .lt('promotion_attempts', supabase.raw('max_promotion_attempts'))
        .order('priority_score', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(1);

      if (flexibleError) throw flexibleError;

      if (flexibleMatch && flexibleMatch.length > 0) {
        return this.mapDbEntryToWaitlistEntry(flexibleMatch[0]);
      }

      return null;
    } catch (error) {
      logger.error('Error getting next eligible waitlist entry:', error);
      return null;
    }
  }

  /**
   * Promote waitlist entry to booking
   */
  async promoteWaitlistEntry(waitlistId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .rpc('promote_waitlist_entry', {
          p_waitlist_id: waitlistId
        });

      if (error) throw error;

      if (data) {
        logger.info('Waitlist entry promoted to booking', { waitlistId, bookingId: data });

        // Send notification (implementation depends on notification system)
        // await this.sendPromotionNotification(waitlistId, data);

        return data;
      }

      return null;
    } catch (error) {
      logger.error('Error promoting waitlist entry:', error);
      throw error;
    }
  }

  /**
   * Get all waitlist entries for admin dashboard
   */
  async getAdminWaitlistEntries(filters?: {
    serviceId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<WaitlistEntry[]> {
    try {
      let query = supabase
        .from('waitlist_entries')
        .select(`
          *,
          services (
            id,
            title,
            service_type,
            duration_minutes,
            price_from
          )
        `);

      if (filters?.serviceId && filters.serviceId !== 'all') {
        query = query.eq('service_id', filters.serviceId);
      }

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      query = query
        .order('created_at', { ascending: false })
        .order('priority_score', { ascending: false });

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(this.mapDbEntryToWaitlistEntry);
    } catch (error) {
      logger.error('Error getting admin waitlist entries:', error);
      return [];
    }
  }

  /**
   * Get waitlist statistics for admin dashboard
   */
  async getWaitlistStats(serviceId?: string): Promise<{
    totalActive: number;
    totalPromoted: number;
    averageWaitTime: number; // in days
    serviceBreakdown: Record<string, number>;
    upcomingDates: Array<{ date: string; count: number }>;
  }> {
    try {
      let query = supabase
        .from('waitlist_entries')
        .select('*')
        .in('status', ['active', 'promoted']);

      if (serviceId) {
        query = query.eq('service_id', serviceId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const activeEntries = data?.filter(e => e.status === 'active') || [];
      const promotedEntries = data?.filter(e => e.status === 'promoted') || [];

      // Calculate average wait time
      const averageWaitTime = promotedEntries.length > 0
        ? promotedEntries.reduce((acc, entry) => {
            const waitTime = Math.ceil(
              (new Date(entry.updated_at).getTime() - new Date(entry.created_at).getTime()) /
              (1000 * 60 * 60 * 24)
            );
            return acc + waitTime;
          }, 0) / promotedEntries.length
        : 0;

      // Service breakdown
      const serviceBreakdown = data?.reduce((acc, entry) => {
        acc[entry.service_id] = (acc[entry.service_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Upcoming dates
      const upcomingDates = activeEntries
        .reduce((acc, entry) => {
          const date = entry.preferred_date;
          const existing = acc.find(item => item.date === date);
          if (existing) {
            existing.count += 1;
          } else {
            acc.push({ date, count: 1 });
          }
          return acc;
        }, [] as Array<{ date: string; count: number }>)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 7); // Next 7 days

      return {
        totalActive: activeEntries.length,
        totalPromoted: promotedEntries.length,
        averageWaitTime,
        serviceBreakdown,
        upcomingDates
      };
    } catch (error) {
      logger.error('Error getting waitlist stats:', error);
      return {
        totalActive: 0,
        totalPromoted: 0,
        averageWaitTime: 0,
        serviceBreakdown: {},
        upcomingDates: []
      };
    }
  }

  /**
   * Calculate priority score for waitlist entry
   */
  private calculatePriorityScore(entry: Omit<WaitlistEntry, 'id' | 'createdAt' | 'updatedAt' | 'promotionAttempts'>): number {
    let score = 0;

    // Higher priority for larger groups (more revenue)
    score += Math.min(entry.groupSize * 10, 50);

    // Higher priority for inflexible customers (they need the slot more)
    if (!entry.flexibleWithTime) score += 20;
    if (!entry.flexibleWithLocation) score += 10;

    // Higher priority for regular customers (if we had that data)
    // score += customerLoyaltyScore;

    // Higher priority for specific times (peak hours)
    const hour = parseInt(entry.preferredTime.split(':')[0]);
    if (hour >= 9 && hour <= 11) score += 10; // Morning
    if (hour >= 17 && hour <= 19) score += 10; // Evening

    return score;
  }

  /**
   * Map database entry to WaitlistEntry interface
   */
  private mapDbEntryToWaitlistEntry(dbEntry: any): WaitlistEntry {
    return {
      id: dbEntry.id,
      serviceId: dbEntry.service_id,
      userId: dbEntry.user_id,
      preferredDate: new Date(dbEntry.preferred_date),
      preferredTime: dbEntry.preferred_time,
      preferredTimeRangeStart: dbEntry.preferred_time_range_start,
      preferredTimeRangeEnd: dbEntry.preferred_time_range_end,
      locationType: dbEntry.location_type,
      groupSize: dbEntry.group_size,
      flexibleWithTime: dbEntry.flexible_with_time,
      flexibleWithLocation: dbEntry.flexible_with_location,
      contactEmail: dbEntry.contact_email,
      contactPhone: dbEntry.contact_phone,
      notes: dbEntry.notes,
      status: dbEntry.status,
      priorityScore: dbEntry.priority_score,
      autoPromoteEligible: dbEntry.auto_promote_eligible,
      promotionAttempts: dbEntry.promotion_attempts,
      maxPromotionAttempts: dbEntry.max_promotion_attempts,
      createdAt: new Date(dbEntry.created_at),
      updatedAt: new Date(dbEntry.updated_at)
    };
  }
}

// Export singleton instance
export const waitlistService = new WaitlistService();