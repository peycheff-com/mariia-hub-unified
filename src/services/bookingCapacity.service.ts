import { z } from 'zod';

import { supabase } from '@/integrations/supabase/client';

import { BaseService } from './api/base.service';

// Enhanced types with capacity information
export interface TimeSlotWithCapacity {
  id: string;
  start_time: string;
  end_time: string;
  service_id?: string;
  service_type: string;
  location_type?: string;
  capacity: number;
  current_bookings: number;
  available_spots: number;
  is_fully_booked: boolean;
  is_available: boolean;
}

export interface AvailabilityCheckResult {
  available: boolean;
  availability_id?: string;
  remaining_capacity: number;
  total_capacity: number;
  conflict_reason?: string;
}

// Validation schemas
const CheckAvailabilitySchema = z.object({
  service_id: z.string().uuid(),
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
  group_size: z.number().int().min(1).default(1),
});

const SetCapacitySchema = z.object({
  availability_id: z.string().uuid(),
  capacity: z.number().int().min(1).max(50),
});

const BulkUpdateCapacitySchema = z.object({
  service_id: z.string().uuid(),
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
  new_capacity: z.number().int().min(1).max(50),
  weeks_ahead: z.number().int().min(1).max(52).default(12),
});

export type CheckAvailabilityRequest = z.infer<typeof CheckAvailabilitySchema>;
export type SetCapacityRequest = z.infer<typeof SetCapacitySchema>;
export type BulkUpdateCapacityRequest = z.infer<typeof BulkUpdateCapacitySchema>;

export class BookingCapacityService extends BaseService {
  private static instance: BookingCapacityService;

  static getInstance(): BookingCapacityService {
    if (!BookingCapacityService.instance) {
      BookingCapacityService.instance = new BookingCapacityService();
    }
    return BookingCapacityService.instance;
  }

  // Check availability with capacity
  async checkAvailabilityCapacity(
    serviceId: string,
    startTime: string,
    endTime: string,
    groupSize: number = 1
  ): Promise<{ data: AvailabilityCheckResult | null; error: any }> {
    try {
      const validated = CheckAvailabilitySchema.parse({
        service_id: serviceId,
        start_time: startTime,
        end_time: endTime,
        group_size: groupSize,
      });

      const { data, error } = await supabase.rpc('check_availability_capacity', {
        p_service_id: validated.service_id,
        p_start_time: validated.start_time,
        p_end_time: validated.end_time,
        p_group_size: validated.group_size,
      });

      if (error) {
        return { data: null, error: this.handleError(error) };
      }

      if (data && data.length > 0) {
        return {
          data: {
            available: data[0].available,
            availability_id: data[0].availability_id,
            remaining_capacity: data[0].remaining_capacity,
            total_capacity: data[0].total_capacity,
            conflict_reason: data[0].conflict_reason,
          },
          error: null,
        };
      }

      return { data: null, error: { message: 'No availability data returned' } };
    } catch (error) {
      return { data: null, error: this.handleError(error) };
    }
  }

  // Get available slots with capacity information
  async getAvailableSlotsWithCapacity(
    serviceId: string,
    date: string,
    durationMinutes: number = 60
  ): Promise<{ data: TimeSlotWithCapacity[]; error: any }> {
    try {
      const { data, error } = await supabase.rpc('get_available_slots_with_capacity', {
        p_service_id: serviceId,
        p_date: date,
        p_duration_minutes: durationMinutes,
      });

      if (error) {
        return { data: [], error: this.handleError(error) };
      }

      const slots: TimeSlotWithCapacity[] = (data || []).map(slot => ({
        id: slot.availability_id,
        start_time: slot.start_time,
        end_time: slot.end_time,
        capacity: slot.capacity,
        current_bookings: slot.current_bookings,
        available_spots: slot.available_spots,
        is_fully_booked: slot.is_fully_booked,
        service_type: '', // Will be filled from service data
        is_available: slot.available_spots > 0,
      }));

      return { data: slots, error: null };
    } catch (error) {
      return { data: [], error: this.handleError(error) };
    }
  }

  // Set capacity for a specific slot (admin only)
  async setSlotCapacity(
    availabilityId: string,
    capacity: number,
    adminId?: string
  ): Promise<{ success: boolean; error: any }> {
    try {
      const validated = SetCapacitySchema.parse({
        availability_id: availabilityId,
        capacity: capacity,
      });

      const { data, error } = await supabase.rpc('set_slot_capacity', {
        p_availability_id: validated.availability_id,
        p_capacity: validated.capacity,
        p_admin_id: adminId,
      });

      if (error) {
        return { success: false, error: this.handleError(error) };
      }

      return { success: !!data, error: null };
    } catch (error) {
      return { success: false, error: this.handleError(error) };
    }
  }

  // Bulk update capacity for recurring slots (admin only)
  async bulkUpdateCapacity(
    serviceId: string,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    newCapacity: number,
    adminId?: string,
    weeksAhead: number = 12
  ): Promise<{ updatedCount: number; error: any }> {
    try {
      const validated = BulkUpdateCapacitySchema.parse({
        service_id: serviceId,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        new_capacity: newCapacity,
        weeks_ahead: weeksAhead,
      });

      const { data, error } = await supabase.rpc('bulk_update_capacity', {
        p_service_id: validated.service_id,
        p_day_of_week: validated.day_of_week,
        p_start_time: validated.start_time,
        p_end_time: validated.end_time,
        p_new_capacity: validated.new_capacity,
        p_admin_id: adminId,
        p_weeks_ahead: validated.weeks_ahead,
      });

      if (error) {
        return { updatedCount: 0, error: this.handleError(error) };
      }

      return { updatedCount: data || 0, error: null };
    } catch (error) {
      return { updatedCount: 0, error: this.handleError(error) };
    }
  }

  // Get capacity utilization report
  async getCapacityUtilizationReport(
    serviceId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<{ data: any[]; error: any }> {
    try {
      let query = supabase
        .from('availability_capacity_report')
        .select('*');

      if (serviceId) {
        query = query.eq('service_id', serviceId);
      }

      if (startDate) {
        query = query.gte('date', startDate);
      }

      if (endDate) {
        query = query.lte('date', endDate);
      }

      query = query.order('date', { ascending: true }).order('hour', { ascending: true });

      const { data, error } = await query;

      if (error) {
        return { data: [], error: this.handleError(error) };
      }

      return { data: data || [], error: null };
    } catch (error) {
      return { data: [], error: this.handleError(error) };
    }
  }

  // Create booking with capacity validation
  async createBookingWithCapacity(
    serviceId: string,
    startTime: string,
    endTime: string,
    bookingData: any,
    groupSize: number = 1
  ): Promise<{ data: any; error: any }> {
    try {
      // First check availability with capacity
      const availabilityCheck = await this.checkAvailabilityCapacity(
        serviceId,
        startTime,
        endTime,
        groupSize
      );

      if (availabilityCheck.error || !availabilityCheck.data?.available) {
        return {
          data: null,
          error: availabilityCheck.error || {
            message: availabilityCheck.data?.conflict_reason || 'Time slot not available',
          },
        };
      }

      // Create the booking
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          service_id: serviceId,
          booking_date: startTime.split('T')[0],
          booking_time: startTime.split('T')[1].substring(0, 5),
          status: 'pending',
          ...bookingData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        return { data: null, error: this.handleError(error) };
      }

      // Update the capacity count
      if (availabilityCheck.data.availability_id) {
        await supabase.rpc('update_slot_booking_count', {
          p_availability_id: availabilityCheck.data.availability_id,
          p_start_time: startTime,
          p_end_time: endTime,
        });
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: this.handleError(error) };
    }
  }

  // Cancel booking and update capacity
  async cancelBookingWithCapacity(bookingId: string): Promise<{ data: any; error: any }> {
    try {
      // Get booking details first
      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (fetchError || !booking) {
        return { data: null, error: { message: 'Booking not found' } };
      }

      // Cancel the booking
      const { data, error } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) {
        return { data: null, error: this.handleError(error) };
      }

      // Find and update the availability slot
      if (booking.booking_date && booking.booking_time) {
        const startTime = `${booking.booking_date}T${booking.booking_time}:00Z`;
        const endTime = new Date(new Date(startTime).getTime() + 60 * 60 * 1000).toISOString();

        // Find the availability slot
        const { data: availabilitySlots } = await supabase
          .from('availability')
          .select('id')
          .eq('service_id', booking.service_id)
          .contains('time_range', [startTime, endTime])
          .limit(1);

        if (availabilitySlots && availabilitySlots.length > 0) {
          // Update the booking count
          await supabase.rpc('update_slot_booking_count', {
            p_availability_id: availabilitySlots[0].id,
            p_start_time: startTime,
            p_end_time: endTime,
          });
        }
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: this.handleError(error) };
    }
  }

  // Get capacity analytics for admin dashboard
  async getCapacityAnalytics(
    serviceId?: string,
    daysBack: number = 7
  ): Promise<{
    totalSlots: number;
    averageUtilization: number;
    fullyBookedSlots: number;
    partiallyBookedSlots: number;
    emptySlots: number;
    data: any[];
    error: any;
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);
      const startDateStr = startDate.toISOString().split('T')[0];

      const { data, error } = await this.getCapacityUtilizationReport(
        serviceId,
        startDateStr,
        new Date().toISOString().split('T')[0]
      );

      if (error) {
        return {
          totalSlots: 0,
          averageUtilization: 0,
          fullyBookedSlots: 0,
          partiallyBookedSlots: 0,
          emptySlots: 0,
          data: [],
          error,
        };
      }

      const reportData = data || [];
      const totalSlots = reportData.reduce((sum, slot) => sum + slot.total_slots, 0);
      const totalCapacity = reportData.reduce((sum, slot) => sum + slot.total_capacity, 0);
      const totalBookings = reportData.reduce((sum, slot) => sum + slot.total_bookings, 0);
      const averageUtilization = totalCapacity > 0 ? (totalBookings / totalCapacity) * 100 : 0;

      const fullyBookedSlots = reportData.filter(
        slot => slot.utilization_percentage >= 100
      ).length;
      const partiallyBookedSlots = reportData.filter(
        slot => slot.utilization_percentage > 0 && slot.utilization_percentage < 100
      ).length;
      const emptySlots = reportData.filter(
        slot => slot.utilization_percentage === 0
      ).length;

      return {
        totalSlots,
        averageUtilization: Math.round(averageUtilization * 100) / 100,
        fullyBookedSlots,
        partiallyBookedSlots,
        emptySlots,
        data: reportData,
        error: null,
      };
    } catch (error) {
      return {
        totalSlots: 0,
        averageUtilization: 0,
        fullyBookedSlots: 0,
        partiallyBookedSlots: 0,
        emptySlots: 0,
        data: [],
        error: this.handleError(error),
      };
    }
  }
}

// Export singleton instance
export const bookingCapacityService = BookingCapacityService.getInstance();