import { supabase } from '@/integrations/supabase/client';
import { BookingChange, TimeSlotWithCapacity } from '@/types/booking';
import { logger } from '@/lib/logger';
import { bookingEvents } from '@/stores/bookingStore';
import { ResendService } from '@/lib/resend';
import { CommunicationService } from '@/lib/communication';
import { cacheService } from '@/services/cacheService';

export interface RescheduleOptions {
  allowDifferentService?: boolean;
  allowDifferentLocation?: boolean;
  maxReschedules?: number;
  advanceNoticeHours?: number;
}

export interface RescheduleRequest {
  bookingId: string;
  newDate: Date;
  newTime: string;
  newServiceId?: string;
  newLocationType?: string;
  reason?: string;
  userId: string;
}

export class RescheduleService {
  private defaultOptions: RescheduleOptions = {
    allowDifferentService: false,
    allowDifferentLocation: true,
    maxReschedules: 3,
    advanceNoticeHours: 24
  };

  private CACHE_KEY_PREFIX = 'reschedule_';
  private CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get booking history for a user
   */
  async getBookingHistory(userId: string, limit: number = 50): Promise<BookingChange[]> {
    try {
      const { data, error } = await supabase
        .from('booking_changes')
        .select(`
          *,
          bookings (
            id,
            service_id,
            services (
              id,
              title,
              service_type,
              duration_minutes
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(this.mapDbChangeToBookingChange);
    } catch (error) {
      logger.error('Error getting booking history:', error);
      return [];
    }
  }

  /**
   * Check if booking can be rescheduled
   */
  async canReschedule(
    bookingId: string,
    userId: string,
    options: RescheduleOptions = {}
  ): Promise<{
    canReschedule: boolean;
    reason?: string;
    currentRescheduleCount: number;
    maxReschedules: number;
    advanceNoticeMet: boolean;
  }> {
    try {
      const mergedOptions = { ...this.defaultOptions, ...options };

      // Get booking details
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          *,
          services (
            id,
            title,
            service_type,
            duration_minutes,
            cancellation_policy
          )
        `)
        .eq('id', bookingId)
        .single();

      if (bookingError || !booking) {
        return {
          canReschedule: false,
          reason: 'Booking not found',
          currentRescheduleCount: 0,
          maxReschedules: mergedOptions.maxReschedules,
          advanceNoticeMet: false
        };
      }

      // Check if booking belongs to user or if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      const isAdmin = profile?.role === 'admin';
      if (booking.user_id !== userId && !isAdmin) {
        return {
          canReschedule: false,
          reason: 'Not authorized to reschedule this booking',
          currentRescheduleCount: 0,
          maxReschedules: mergedOptions.maxReschedules,
          advanceNoticeMet: false
        };
      }

      // Check booking status
      if (booking.status !== 'confirmed' && booking.status !== 'pending') {
        return {
          canReschedule: false,
          reason: `Cannot reschedule booking with status: ${booking.status}`,
          currentRescheduleCount: 0,
          maxReschedules: mergedOptions.maxReschedules,
          advanceNoticeMet: false
        };
      }

      // Check reschedule count
      const currentRescheduleCount = booking.reschedule_count || 0;
      if (currentRescheduleCount >= mergedOptions.maxReschedules) {
        return {
          canReschedule: false,
          reason: `Maximum reschedule limit reached (${mergedOptions.maxReschedules})`,
          currentRescheduleCount,
          maxReschedules: mergedOptions.maxReschedules,
          advanceNoticeMet: false
        };
      }

      // Check advance notice
      const bookingDateTime = new Date(
        `${booking.booking_date}T${booking.booking_time}`
      );
      const now = new Date();
      const hoursUntilBooking = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      const advanceNoticeMet = hoursUntilBooking >= mergedOptions.advanceNoticeHours;

      if (!advanceNoticeMet) {
        return {
          canReschedule: false,
          reason: `Rescheduling requires at least ${mergedOptions.advanceNoticeHours} hours advance notice`,
          currentRescheduleCount,
          maxReschedules: mergedOptions.maxReschedules,
          advanceNoticeMet
        };
      }

      return {
        canReschedule: true,
        currentRescheduleCount,
        maxReschedules: mergedOptions.maxReschedules,
        advanceNoticeMet
      };
    } catch (error) {
      logger.error('Error checking reschedule eligibility:', error);
      return {
        canReschedule: false,
        reason: 'Error checking eligibility',
        currentRescheduleCount: 0,
        maxReschedules: 0,
        advanceNoticeMet: false
      };
    }
  }

  /**
   * Get available time slots for rescheduling
   */
  async getRescheduleOptions(
    bookingId: string,
    targetDate?: Date,
    groupSize: number = 1
  ): Promise<TimeSlotWithCapacity[]> {
    try {
      // Get current booking details
      const { data: booking, error } = await supabase
        .from('bookings')
        .select(`
          service_id,
          services (
            service_type,
            duration_minutes
          )
        `)
        .eq('id', bookingId)
        .single();

      if (error || !booking) {
        throw new Error('Booking not found');
      }

      const serviceId = booking.service_id;
      const dateToCheck = targetDate || new Date();

      // Get available slots with capacity
      const { data, error: availabilityError } = await supabase
        .rpc('check_slot_availability_with_capacity', {
          p_service_id: serviceId,
          p_booking_date: dateToCheck.toISOString().split('T')[0],
          p_booking_time: '00:00', // Will be overridden in loop
          p_duration_minutes: booking.services.duration_minutes,
          p_group_size: groupSize
        });

      if (availabilityError) throw availabilityError;

      // Generate time slots for the day
      const slots: TimeSlotWithCapacity[] = [];
      const startTime = 8;
      const endTime = 20;
      const intervalMinutes = 30;

      for (let hour = startTime; hour < endTime; hour++) {
        for (let minute = 0; minute < 60; minute += intervalMinutes) {
          const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

          try {
            const { data: slotData } = await supabase
              .rpc('check_slot_availability_with_capacity', {
                p_service_id: serviceId,
                p_booking_date: dateToCheck.toISOString().split('T')[0],
                p_booking_time: timeStr,
                p_duration_minutes: booking.services.duration_minutes,
                p_group_size: groupSize
              });

            if (slotData && slotData.length > 0 && slotData[0].available) {
              slots.push({
                id: `${serviceId}-${dateToCheck.toISOString().split('T')[0]}-${timeStr}`,
                date: dateToCheck,
                time: timeStr,
                available: true,
                location: 'studio',
                capacity: slotData[0].remaining_capacity + groupSize,
                currentBookings: slotData[0].remaining_capacity > 0 ? 1 : 0,
                remainingCapacity: slotData[0].remaining_capacity,
                allowsGroups: true,
                maxGroupSize: 10
              });
            }
          } catch (error) {
            // Skip slots that fail
            continue;
          }
        }
      }

      return slots;
    } catch (error) {
      logger.error('Error getting reschedule options:', error);
      return [];
    }
  }

  /**
   * Reschedule a booking
   */
  async rescheduleBooking(request: RescheduleRequest): Promise<{
    success: boolean;
    bookingId?: string;
    error?: string;
    changeId?: string;
  }> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}${request.bookingId}`;

    try {
      // Check cache first
      const cached = await cacheService.get(cacheKey);
      if (cached && cached.success) {
        logger.info('Returning cached reschedule result', { bookingId: request.bookingId });
        return cached;
      }

      // Check eligibility
      const eligibility = await this.canReschedule(request.bookingId, request.userId);
      if (!eligibility.canReschedule) {
        return {
          success: false,
          error: eligibility.reason || 'Cannot reschedule booking'
        };
      }

      // Get current booking details
      const { data: currentBooking, error } = await supabase
        .from('bookings')
        .select(`
          *,
          services:service_id (
            title,
            duration_minutes
          )
        `)
        .eq('id', request.bookingId)
        .single();

      if (error || !currentBooking) {
        return {
          success: false,
          error: 'Booking not found'
        };
      }

      // Check availability for new slot
      const { data: availabilityCheck } = await supabase
        .rpc('check_slot_availability_with_capacity', {
          p_service_id: request.newServiceId || currentBooking.service_id,
          p_booking_date: request.newDate.toISOString().split('T')[0],
          p_booking_time: request.newTime,
          p_duration_minutes: currentBooking.services?.duration_minutes || 60,
          p_group_size: currentBooking.group_participant_count || 1
        });

      if (!availabilityCheck || availabilityCheck.length === 0 || !availabilityCheck[0].available) {
        return {
          success: false,
          error: 'New time slot is not available'
        };
      }

      // Create hold on new slot
      const { data: hold } = await supabase
        .from('holds')
        .insert({
          user_id: request.userId,
          service_id: request.newServiceId || currentBooking.service_id,
          time_range: `["${request.newDate.toISOString()}", "${new Date(request.newDate.getTime() + 60 * 60 * 1000).toISOString()}"]`,
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
          session_id: `reschedule-${request.bookingId}`,
          metadata: {
            reschedule_from_booking: request.bookingId
          }
        })
        .select()
        .single();

      // Update booking with new details
      const { data: updatedBooking, error: updateError } = await supabase
        .from('bookings')
        .update({
          booking_date: request.newDate.toISOString().split('T')[0],
          booking_time: request.newTime,
          service_id: request.newServiceId || currentBooking.service_id,
          location_type: request.newLocationType || currentBooking.location_type,
          reschedule_count: (currentBooking.reschedule_count || 0) + 1,
          last_rescheduled_at: new Date().toISOString(),
          metadata: {
            ...currentBooking.metadata,
            last_reschedule_reason: request.reason,
            reschedule_history: [
              ...(currentBooking.metadata?.reschedule_history || []),
              {
                from_date: currentBooking.booking_date,
                from_time: currentBooking.booking_time,
                to_date: request.newDate.toISOString().split('T')[0],
                to_time: request.newTime,
                rescheduled_at: new Date().toISOString(),
                reason: request.reason
              }
            ]
          }
        })
        .eq('id', request.bookingId)
        .select()
        .single();

      if (updateError) {
        // Remove hold if booking update fails
        if (hold) {
          await supabase.from('holds').delete().eq('id', hold.id);
        }
        throw updateError;
      }

      // Log the change
      const { data: changeLog } = await supabase
        .from('booking_changes')
        .insert({
          booking_id: request.bookingId,
          user_id: request.userId,
          change_type: 'rescheduled',
          old_date: currentBooking.booking_date,
          old_time: currentBooking.booking_time,
          old_service_id: currentBooking.service_id,
          new_date: request.newDate.toISOString().split('T')[0],
          new_time: request.newTime,
          new_service_id: request.newServiceId || currentBooking.service_id,
          reason: request.reason,
          changed_by: request.userId,
          system_generated: false,
          metadata: {
            previous_reschedule_count: currentBooking.reschedule_count || 0,
            new_reschedule_count: (currentBooking.reschedule_count || 0) + 1,
            hold_id: hold?.id
          }
        })
        .select()
        .single();

      // Remove hold after successful update
      if (hold) {
        await supabase.from('holds').delete().eq('id', hold.id);
      }

      const result = {
        success: true as const,
        bookingId: updatedBooking.id,
        changeId: changeLog?.id
      };

      // Cache successful result
      await cacheService.set(cacheKey, result, this.CACHE_TTL);

      // Send notifications
      await this.sendRescheduleNotifications({
        bookingId: request.bookingId,
        userId: request.userId,
        newDate: request.newDate,
        newTime: request.newTime,
        reason: request.reason,
        notifyClient: true
      });

      // Emit event for analytics
      bookingEvents.emit('booking_rescheduled', {
        bookingId: request.bookingId,
        oldDate: currentBooking.booking_date,
        newDate: request.newDate,
        reason: request.reason,
      });

      logger.info('Booking rescheduled successfully', {
        bookingId: request.bookingId,
        oldDate: currentBooking.booking_date,
        oldTime: currentBooking.booking_time,
        newDate: request.newDate,
        newTime: request.newTime
      });

      return result;
    } catch (error) {
      logger.error('Error rescheduling booking:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Send reschedule notifications
   */
  private async sendRescheduleNotifications(request: {
    bookingId: string;
    userId: string;
    newDate: Date;
    newTime: string;
    reason?: string;
    notifyClient?: boolean;
  }) {
    try {
      // Get booking details for notifications
      const { data: booking } = await supabase
        .from('bookings')
        .select(`
          *,
          services:service_id (
            title,
            duration_minutes
          )
        `)
        .eq('id', request.bookingId)
        .single();

      if (!booking) return;

      // Send email notification
      if (booking.client_email && request.notifyClient !== false) {
        await ResendService.sendRescheduleConfirmation({
          bookingId: request.bookingId,
          userId: booking.client_email,
          newDate: request.newDate.toDateString(),
          newTime: request.newTime,
          serviceTitle: booking.services?.title || 'Service',
        });
      }

      // Send WhatsApp notification
      if (booking.client_phone && request.notifyClient !== false) {
        await CommunicationService.sendRescheduleWhatsApp(
          booking.client_phone,
          booking.client_name || 'Client',
          booking.services?.title || 'Service',
          request.newDate.toLocaleDateString(),
          request.newTime
        );
      }

      logger.info('Reschedule notifications sent', { bookingId: request.bookingId });
    } catch (error) {
      logger.error('Failed to send reschedule notifications', { error, request });
      // Don't fail the reschedule if notifications fail
    }
  }

  /**
   * Quick reschedule with one click (rebook to same time next week)
   */
  async quickReschedule(
    bookingId: string,
    userId: string,
    action: 'next_week' | 'next_day' | 'same_time_next_week'
  ): Promise<{
    success: boolean;
    newDateTime?: { date: Date; time: string };
    error?: string;
  }> {
    try {
      // Get current booking
      const { data: booking, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (error || !booking) {
        return {
          success: false,
          error: 'Booking not found'
        };
      }

      const currentDateTime = new Date(
        `${booking.booking_date}T${booking.booking_time}`
      );

      let newDateTime: Date;

      switch (action) {
        case 'next_day':
          newDateTime = new Date(currentDateTime.getTime() + 24 * 60 * 60 * 1000);
          break;
        case 'next_week':
          newDateTime = new Date(currentDateTime.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case 'same_time_next_week':
          newDateTime = new Date(currentDateTime.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        default:
          return {
            success: false,
            error: 'Invalid quick reschedule action'
          };
      }

      const newDate = newDateTime;
      const newTime = newDateTime.toTimeString().slice(0, 5);

      // Check if new slot is available
      const { data: availability } = await supabase
        .rpc('check_slot_availability_with_capacity', {
          p_service_id: booking.service_id,
          p_booking_date: newDate.toISOString().split('T')[0],
          p_booking_time: newTime,
          p_duration_minutes: booking.metadata?.duration_minutes || 60,
          p_group_size: booking.group_participant_count || 1
        });

      if (!availability || availability.length === 0 || !availability[0].available) {
        return {
          success: false,
          error: 'Requested time slot is not available'
        };
      }

      // Perform the reschedule
      const result = await this.rescheduleBooking({
        bookingId,
        userId,
        newDate,
        newTime,
        reason: `Quick reschedule: ${action.replace(/_/g, ' ')}`
      });

      if (result.success) {
        return {
          success: true,
          newDateTime: { date: newDate, time: newTime }
        };
      }

      return {
        success: false,
        error: result.error
      };
    } catch (error) {
      logger.error('Error in quick reschedule:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Quick reschedule failed'
      };
    }
  }

  /**
   * Get reschedule statistics
   */
  async getRescheduleStats(serviceId?: string, dateRange?: { from: Date; to: Date }): Promise<{
    totalReschedules: number;
    averageTimeBeforeReschedule: number; // in hours
    mostRescheduledService: string;
    rescheduleReasons: Record<string, number>;
    rescheduleByDay: Record<string, number>;
  }> {
    try {
      let query = supabase
        .from('booking_changes')
        .select(`
          *,
          bookings (
            service_id,
            services (
              title
            )
          )
        `)
        .eq('change_type', 'rescheduled');

      if (serviceId) {
        query = query.eq('bookings.service_id', serviceId);
      }

      if (dateRange) {
        query = query
          .gte('created_at', dateRange.from.toISOString())
          .lte('created_at', dateRange.to.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      const reschedules = data || [];
      const serviceCounts = reschedules.reduce((acc, r) => {
        const serviceTitle = r.bookings?.services?.title || 'Unknown Service';
        acc[serviceTitle] = (acc[serviceTitle] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const reasonCounts = reschedules.reduce((acc, r) => {
        const reason = r.reason || 'No reason';
        acc[reason] = (acc[reason] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const dayCounts = reschedules.reduce((acc, r) => {
        const day = new Date(r.created_at).toLocaleDateString();
        acc[day] = (acc[day] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Calculate average time before reschedule
      const avgTime = reschedules.length > 0
        ? reschedules.reduce((sum, r) => {
            const bookingDate = new Date(r.old_date + 'T' + (r.old_time || '00:00'));
            const changeDate = new Date(r.created_at);
            const hoursDiff = (changeDate.getTime() - bookingDate.getTime()) / (1000 * 60 * 60);
            return sum + hoursDiff;
          }, 0) / reschedules.length
        : 0;

      const mostRescheduledService = Object.entries(serviceCounts)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || '';

      return {
        totalReschedules: reschedules.length,
        averageTimeBeforeReschedule: avgTime,
        mostRescheduledService,
        rescheduleReasons: reasonCounts,
        rescheduleByDay: dayCounts
      };
    } catch (error) {
      logger.error('Error getting reschedule stats:', error);
      return {
        totalReschedules: 0,
        averageTimeBeforeReschedule: 0,
        mostRescheduledService: '',
        rescheduleReasons: {},
        rescheduleByDay: {}
      };
    }
  }

  /**
   * Map database change to BookingChange interface
   */
  private mapDbChangeToBookingChange(dbChange: any): BookingChange {
    return {
      id: dbChange.id,
      bookingId: dbChange.booking_id,
      userId: dbChange.user_id,
      changeType: dbChange.change_type,
      oldDate: dbChange.old_date ? new Date(dbChange.old_date) : undefined,
      oldTime: dbChange.old_time || undefined,
      oldServiceId: dbChange.old_service_id || undefined,
      oldStatus: dbChange.old_status || undefined,
      newDate: dbChange.new_date ? new Date(dbChange.new_date) : undefined,
      newTime: dbChange.new_time || undefined,
      newServiceId: dbChange.new_service_id || undefined,
      newStatus: dbChange.new_status || undefined,
      reason: dbChange.reason || undefined,
      changedBy: dbChange.changed_by || undefined,
      systemGenerated: dbChange.system_generated || false,
      metadata: dbChange.metadata || {},
      createdAt: new Date(dbChange.created_at)
    };
  }
}

// Export singleton instance
export const rescheduleService = new RescheduleService();