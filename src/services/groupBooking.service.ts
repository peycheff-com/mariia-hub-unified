import { supabase } from '@/integrations/supabase/client';
import {
  Service,
  GroupBooking,
  GroupParticipant,
  TimeSlotWithCapacity,
  EnhancedBooking
} from '@/types/booking';
import { logger } from '@/lib/logger';

export class GroupBookingService {
  /**
   * Check if a service supports group bookings and get capacity info
   */
  async checkGroupAvailability(
    serviceId: string,
    date: Date,
    time: string,
    groupSize: number
  ): Promise<TimeSlotWithCapacity | null> {
    try {
      const { data: service } = await supabase
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .eq('is_active', true)
        .single();

      if (!service) {
        throw new Error('Service not found or inactive');
      }

      // Call the database function to check availability with capacity
      const { data, error } = await supabase
        .rpc('check_slot_availability_with_capacity', {
          p_service_id: serviceId,
          p_booking_date: date.toISOString().split('T')[0],
          p_booking_time: time,
          p_duration_minutes: service.duration_minutes,
          p_group_size: groupSize
        });

      if (error) throw error;

      if (data && data.length > 0) {
        const result = data[0];
        if (result.available) {
          // Get additional capacity settings
          const { data: capacitySettings } = await supabase
            .from('availability')
            .select('capacity, allows_groups, max_group_size, current_bookings')
            .eq('service_type', service.service_type)
            .contains('time_range', `[${date.toISOString()},"${date.toISOString()}]`)
            .single();

          return {
            id: `${serviceId}-${date}-${time}`,
            date,
            time,
            available: true,
            location: 'studio',
            capacity: capacitySettings?.capacity || 1,
            currentBookings: capacitySettings?.current_bookings || 0,
            remainingCapacity: result.remaining_capacity,
            allowsGroups: capacitySettings?.allows_groups || false,
            maxGroupSize: capacitySettings?.max_group_size || 1,
            price: service.price_from * groupSize
          };
        }
      }

      return null;
    } catch (error) {
      logger.error('Error checking group availability:', error);
      throw error;
    }
  }

  /**
   * Create a group booking
   */
  async createGroupBooking(bookingData: EnhancedBooking): Promise<GroupBooking> {
    try {
      const { step1, step2, step3 } = bookingData;

      if (!step1.isGroupBooking || !step1.groupSize || step1.groupSize < 2) {
        throw new Error('Invalid group booking parameters');
      }

      // Calculate pricing with dynamic rules
      const pricingResult = await this.calculateGroupPricing(
        step1.serviceId,
        step2.selectedDate,
        step2.selectedTime,
        step1.groupSize
      );

      // Create group booking record
      const { data: groupBooking, error: groupError } = await supabase
        .from('group_bookings')
        .insert({
          group_name: step1.specialRequests ? `Group - ${step1.specialRequests.substring(0, 50)}` : undefined,
          group_size: step1.groupSize,
          primary_contact_name: `${step3.firstName} ${step3.lastName}`,
          primary_contact_email: step3.email,
          primary_contact_phone: step3.phone,
          service_id: step1.serviceId,
          booking_date: step2.selectedDate.toISOString().split('T')[0],
          booking_time: step2.selectedTime,
          location_type: 'studio',
          base_price_per_person: pricingResult.basePricePerPerson,
          discount_percentage: pricingResult.totalDiscountPercentage,
          total_price: pricingResult.finalPrice,
          status: 'pending',
          participants: step1.participants || [],
          creator_user_id: null // Set when user is authenticated
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Create individual booking records for tracking
      const bookings = [];
      for (let i = 0; i < step1.groupSize; i++) {
        const participant = step1.participants?.[i] || {
          firstName: step3.firstName,
          lastName: step3.lastName,
          email: step3.email,
          phone: step3.phone
        };

        const { data: booking, error } = await supabase
          .from('bookings')
          .insert({
            user_id: null,
            service_id: step1.serviceId,
            status: 'confirmed',
            booking_date: step2.selectedDate.toISOString().split('T')[0],
            booking_time: step2.selectedTime,
            client_name: `${participant.firstName} ${participant.lastName}`,
            client_email: participant.email || step3.email,
            client_phone: participant.phone || step3.phone,
            location_type: 'studio',
            amount_paid: 0,
            currency: 'PLN',
            metadata: {
              group_booking_id: groupBooking.id,
              participant_index: i,
              is_primary_contact: i === 0,
              group_size: step1.groupSize,
              notes: participant.notes
            },
            is_group_booking: true,
            group_booking_id: groupBooking.id,
            group_participant_count: step1.groupSize,
            original_price: pricingResult.basePricePerPerson,
            discount_amount: pricingResult.discountPerPerson,
            applied_pricing_rules: pricingResult.appliedRules
          })
          .select()
          .single();

        if (error) throw error;
        bookings.push(booking);
      }

      // Log booking change
      await this.logBookingChange(
        bookings[0].id,
        'created',
        null,
        step2.selectedDate,
        null,
        step2.selectedTime,
        null,
        'Group booking created',
        null,
        true,
        {
          group_booking_id: groupBooking.id,
          group_size: step1.groupSize,
          participants: step1.participants
        }
      );

      logger.info('Group booking created successfully', { groupBookingId: groupBooking.id });
      return groupBooking;
    } catch (error) {
      logger.error('Error creating group booking:', error);
      throw error;
    }
  }

  /**
   * Calculate dynamic pricing for group bookings
   */
  async calculateGroupPricing(
    serviceId: string,
    date: Date,
    time: string,
    groupSize: number
  ): Promise<{
    basePricePerPerson: number;
    finalPrice: number;
    discountPerPerson: number;
    totalDiscountAmount: number;
    totalDiscountPercentage: number;
    appliedRules: any[];
  }> {
    try {
      // Get service base price
      const { data: service } = await supabase
        .from('services')
        .select('price_from')
        .eq('id', serviceId)
        .single();

      if (!service) throw new Error('Service not found');

      const basePricePerPerson = service.price_from;
      const baseTotalPrice = basePricePerPerson * groupSize;

      // Call database pricing function
      const { data: pricingData, error } = await supabase
        .rpc('calculate_dynamic_pricing', {
          p_service_id: serviceId,
          p_booking_date: date.toISOString().split('T')[0],
          p_booking_time: time,
          p_group_size: groupSize,
          p_base_price: service.price_from
        });

      if (error) throw error;

      const pricing = pricingData[0];
      const finalPrice = Number(pricing.final_price);
      const totalDiscountAmount = Number(pricing.total_discount);

      return {
        basePricePerPerson,
        finalPrice,
        discountPerPerson: totalDiscountAmount / groupSize,
        totalDiscountAmount,
        totalDiscountPercentage: (totalDiscountAmount / baseTotalPrice) * 100,
        appliedRules: pricing.applied_rules || []
      };
    } catch (error) {
      logger.error('Error calculating group pricing:', error);
      // Return base pricing if calculation fails
      const { data: service } = await supabase
        .from('services')
        .select('price_from')
        .eq('id', serviceId)
        .single();

      const basePricePerPerson = service?.price_from || 0;
      const finalPrice = basePricePerPerson * groupSize;

      return {
        basePricePerPerson,
        finalPrice,
        discountPerPerson: 0,
        totalDiscountAmount: 0,
        totalDiscountPercentage: 0,
        appliedRules: []
      };
    }
  }

  /**
   * Get available time slots with capacity information
   */
  async getAvailableTimeSlotsWithCapacity(
    serviceId: string,
    date: Date,
    groupSize: number = 1
  ): Promise<TimeSlotWithCapacity[]> {
    try {
      const { data: service } = await supabase
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .eq('is_active', true)
        .single();

      if (!service) throw new Error('Service not found');

      // Get available time slots
      const slots: TimeSlotWithCapacity[] = [];
      const startTime = 8; // 8 AM
      const endTime = 20; // 8 PM
      const intervalMinutes = 30;

      for (let hour = startTime; hour < endTime; hour++) {
        for (let minute = 0; minute < 60; minute += intervalMinutes) {
          const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

          try {
            const availability = await this.checkGroupAvailability(
              serviceId,
              date,
              timeStr,
              groupSize
            );

            if (availability && availability.available) {
              slots.push(availability);
            }
          } catch (error) {
            // Skip slots that fail availability check
            continue;
          }
        }
      }

      return slots;
    } catch (error) {
      logger.error('Error getting available time slots with capacity:', error);
      return [];
    }
  }

  /**
   * Update group booking details
   */
  async updateGroupBooking(
    groupBookingId: string,
    updates: Partial<GroupBooking>
  ): Promise<GroupBooking> {
    try {
      const { data, error } = await supabase
        .from('group_bookings')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', groupBookingId)
        .select()
        .single();

      if (error) throw error;

      logger.info('Group booking updated', { groupBookingId, updates });
      return data;
    } catch (error) {
      logger.error('Error updating group booking:', error);
      throw error;
    }
  }

  /**
   * Cancel group booking
   */
  async cancelGroupBooking(groupBookingId: string, reason?: string): Promise<void> {
    try {
      // Update group booking status
      await supabase
        .from('group_bookings')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', groupBookingId);

      // Update associated individual bookings
      const { data: bookings } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          metadata: supabase.sql`
            metadata || jsonb_build_object('cancellation_reason', ${reason})
          `
        })
        .eq('group_booking_id', groupBookingId)
        .select('id');

      // Log cancellation for each booking
      if (bookings) {
        for (const booking of bookings) {
          await this.logBookingChange(
            booking.id,
            'cancelled',
            undefined,
            undefined,
            undefined,
            undefined,
            'cancelled',
            reason || 'Group booking cancelled',
            undefined,
            true,
            { group_booking_id: groupBookingId }
          );
        }
      }

      logger.info('Group booking cancelled', { groupBookingId, reason });
    } catch (error) {
      logger.error('Error cancelling group booking:', error);
      throw error;
    }
  }

  /**
   * Get group bookings for a user
   */
  async getUserGroupBookings(userId: string): Promise<GroupBooking[]> {
    try {
      const { data, error } = await supabase
        .from('group_bookings')
        .select(`
          *,
          services (
            id,
            title,
            service_type,
            duration_minutes
          )
        `)
        .eq('creator_user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error getting user group bookings:', error);
      return [];
    }
  }

  /**
   * Log booking changes for audit trail
   */
  private async logBookingChange(
    bookingId: string,
    changeType: 'created' | 'rescheduled' | 'cancelled' | 'modified_details' | 'status_changed',
    oldDate?: Date,
    newDate?: Date,
    oldTime?: string,
    newTime?: string,
    oldStatus?: string,
    newStatus?: string,
    changedBy?: string,
    systemGenerated: boolean = false,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    try {
      await supabase
        .from('booking_changes')
        .insert({
          booking_id: bookingId,
          change_type: changeType,
          old_date: oldDate?.toISOString().split('T')[0],
          new_date: newDate?.toISOString().split('T')[0],
          old_time: oldTime,
          new_time: newTime,
          old_status: oldStatus,
          new_status: newStatus,
          changed_by: changedBy,
          system_generated: systemGenerated,
          metadata,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      logger.error('Error logging booking change:', error);
      // Don't throw error here to avoid breaking main flow
    }
  }
}

// Export singleton instance
export const groupBookingService = new GroupBookingService();