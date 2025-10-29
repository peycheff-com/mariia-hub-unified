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

import { bookingDomainService } from './bookingDomainService';
import { groupBookingService } from './groupBooking.service';
import { waitlistService } from './waitlist.service';
import { dynamicPricingService } from './dynamicPricing.service';
import { paymentSystemService } from './paymentSystemService';
import { loyaltyProgramService } from './loyaltyProgramService';

export interface CreateBookingRequest {
  serviceId: string;
  timeSlot: TimeSlot;
  details: BookingDetails;
  userId?: string;
  isGroupBooking?: boolean;
  groupSize?: number;
  groupParticipants?: Array<{
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    notes?: string;
  }>;
  pricingRules?: Array<{
    rule_id: string;
    rule_type: string;
    discount_percentage?: number;
    applied_amount: number;
  }>;
  paymentDetails?: PaymentDetails;
}

export interface BookingResponse {
  success: boolean;
  booking?: Booking;
  error?: string;
  requiresPayment?: boolean;
  paymentIntentId?: string;
  loyaltyPointsEarned?: number;
}

export interface AvailabilityRequest {
  serviceId: string;
  date: Date;
  groupSize?: number;
  location?: LocationType;
}

export interface AvailabilityResponse {
  available: boolean;
  timeSlots: TimeSlot[];
  capacity?: {
    total: number;
    available: number;
    allowsGroups: boolean;
  };
  pricing?: {
    basePrice: number;
    discountedPrice: number;
    appliedRules: any[];
  };
}

export class EnhancedBookingService {
  /**
   * Create a new booking with full integration
   */
  async createBooking(request: CreateBookingRequest): Promise<BookingResponse> {
    try {
      // Step 1: Get service details
      const { data: service, error: serviceError } = await supabase
        .from('services')
        .select('*')
        .eq('id', request.serviceId)
        .eq('is_active', true)
        .single();

      if (serviceError || !service) {
        return {
          success: false,
          error: 'Service not available'
        };
      }

      // Step 2: Validate service availability
      const availabilityCheck = await bookingDomainService.validateServiceAvailability(
        request.serviceId,
        request.timeSlot
      );

      if (!availabilityCheck.valid) {
        // Check if waitlist should be offered
        const waitlistAvailable = await waitlistService.checkWaitlistAvailability(
          request.serviceId,
          request.timeSlot.date,
          request.timeSlot.time
        );

        return {
          success: false,
          error: availabilityCheck.reason || 'Time slot not available',
          ...(waitlistAvailable && { suggestWaitlist: true })
        };
      }

      // Step 3: Calculate pricing with dynamic rules
      const pricingResult = await dynamicPricingService.calculatePrice(
        request.serviceId,
        service.price_from,
        request.timeSlot.date,
        request.timeSlot.time,
        request.groupSize || 1
      );

      // Step 4: Handle group bookings
      if (request.isGroupBooking && request.groupSize && request.groupSize > 1) {
        const groupBookingData = {
          step1: {
            serviceId: request.serviceId,
            isGroupBooking: true,
            groupSize: request.groupSize,
            participants: request.groupParticipants || [],
            specialRequests: request.details.notes
          },
          step2: {
            selectedDate: request.timeSlot.date,
            selectedTime: request.timeSlot.time
          },
          step3: {
            firstName: request.details.client_name.split(' ')[0],
            lastName: request.details.client_name.split(' ').slice(1).join(' '),
            email: request.details.client_email,
            phone: request.details.client_phone,
            notes: request.details.notes
          }
        };

        const groupBooking = await groupBookingService.createGroupBooking(groupBookingData);

        // Award loyalty points for group booking
        if (request.userId) {
          const pointsEarned = Math.floor(pricingResult.finalPrice * 0.1); // 10% of price as points
          await loyaltyProgramService.awardPoints({
            userId: request.userId,
            points: pointsEarned,
            type: 'earned',
            description: `Group booking: ${service.title}`,
            bookingId: groupBooking.id
          });
        }

        return {
          success: true,
          booking: {
            id: groupBooking.id,
            service_id: request.serviceId,
            user_id: request.userId,
            status: 'pending' as BookingStatus,
            service: {
              id: service.id,
              title: service.title,
              slug: service.slug || '',
              service_type: service.service_type as ServiceType,
              price_from: service.price_from,
              price_to: service.price_to,
              duration_minutes: service.duration_minutes,
              image_url: service.image_url
            },
            timeSlot: request.timeSlot,
            details: request.details,
            is_group_booking: true,
            group_booking_id: groupBooking.id,
            group_participant_count: request.groupSize,
            created_at: new Date(),
            updated_at: new Date()
          },
          loyaltyPointsEarned: request.userId ? Math.floor(pricingResult.finalPrice * 0.1) : undefined
        };
      }

      // Step 5: Reserve time slot
      const holdResult = await bookingDomainService.reserveTimeSlot(
        `${request.serviceId}-${request.timeSlot.date}-${request.timeSlot.time}`,
        request.userId || 'anonymous',
        request.serviceId
      );

      if (!holdResult.success) {
        return {
          success: false,
          error: 'Failed to reserve time slot'
        };
      }

      // Step 6: Create individual booking
      const bookingResult = await bookingDomainService.createBooking(
        {
          id: service.id,
          title: service.title,
          slug: service.slug || '',
          service_type: service.service_type as ServiceType,
          price_from: service.price_from,
          price_to: service.price_to,
          duration_minutes: service.duration_minutes,
          image_url: service.image_url
        },
        request.timeSlot,
        request.details,
        request.userId
      );

      if (!bookingResult.success) {
        // Release the hold
        if (holdResult.holdId) {
          await bookingDomainService.releaseTimeSlot(holdResult.holdId);
        }

        return {
          success: false,
          error: bookingResult.error || 'Failed to create booking'
        };
      }

      // Step 7: Process payment if required
      let requiresPayment = true;
      let paymentIntentId: string | undefined;

      if (request.paymentDetails) {
        // Create payment intent through Stripe (implementation depends on payment system)
        requiresPayment = false;
        // paymentIntentId = await stripeService.createPaymentIntent(...)
      }

      // Step 8: Award loyalty points
      let loyaltyPointsEarned: number | undefined;
      if (request.userId) {
        pointsEarned = Math.floor(pricingResult.finalPrice * 0.1); // 10% of price as points
        await loyaltyProgramService.awardPoints({
          userId: request.userId,
          points: pointsEarned,
          type: 'earned',
          description: `Booking: ${service.title}`,
          bookingId: bookingResult.booking!.id
        });
      }

      // Step 9: Log booking creation
      logger.info('Booking created successfully', {
        bookingId: bookingResult.booking!.id,
        serviceId: request.serviceId,
        userId: request.userId,
        isGroupBooking: false,
        totalPrice: pricingResult.finalPrice
      });

      return {
        success: true,
        booking: {
          ...bookingResult.booking!,
          payment: request.paymentDetails,
          applied_pricing_rules: pricingResult.appliedRules,
          original_price: pricingResult.originalPrice,
          discount_amount: pricingResult.totalDiscount
        },
        requiresPayment,
        paymentIntentId,
        loyaltyPointsEarned
      };

    } catch (error) {
      logger.error('Error creating booking:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create booking'
      };
    }
  }

  /**
   * Check availability for a service
   */
  async checkAvailability(request: AvailabilityRequest): Promise<AvailabilityResponse> {
    try {
      const { data: service, error: serviceError } = await supabase
        .from('services')
        .select('*')
        .eq('id', request.serviceId)
        .eq('is_active', true)
        .single();

      if (serviceError || !service) {
        return {
          available: false,
          timeSlots: []
        };
      }

      // Get available time slots
      const timeSlots: TimeSlot[] = [];
      const startTime = 8; // 8 AM
      const endTime = 20; // 8 PM
      const intervalMinutes = 30;

      const groupSize = request.groupSize || 1;

      for (let hour = startTime; hour < endTime; hour++) {
        for (let minute = 0; minute < 60; minute += intervalMinutes) {
          const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

          try {
            const availabilityCheck = await bookingDomainService.validateServiceAvailability(
              request.serviceId,
              {
                id: `${request.serviceId}-${request.date}-${timeStr}`,
                date: request.date,
                time: timeStr,
                available: false,
                location: request.location || 'studio'
              }
            );

            if (availabilityCheck.valid) {
              timeSlots.push({
                id: `${request.serviceId}-${request.date}-${timeStr}`,
                date: request.date,
                time: timeStr,
                available: true,
                location: request.location || 'studio',
                price: service.price_from * groupSize
              });
            }
          } catch (error) {
            // Skip slots that fail availability check
            continue;
          }
        }
      }

      // Calculate pricing for the first available slot
      let pricing;
      if (timeSlots.length > 0) {
        const firstSlot = timeSlots[0];
        const pricingResult = await dynamicPricingService.calculatePrice(
          request.serviceId,
          service.price_from,
          firstSlot.date,
          firstSlot.time,
          groupSize
        );

        pricing = {
          basePrice: pricingResult.originalPrice,
          discountedPrice: pricingResult.finalPrice,
          appliedRules: pricingResult.appliedRules
        };
      }

      return {
        available: timeSlots.length > 0,
        timeSlots,
        pricing
      };

    } catch (error) {
      logger.error('Error checking availability:', error);
      return {
        available: false,
        timeSlots: []
      };
    }
  }

  /**
   * Reschedule an existing booking
   */
  async rescheduleBooking(
    bookingId: string,
    userId: string,
    newDate: Date,
    newTime: string
  ): Promise<{ success: boolean; error?: string; booking?: Booking }> {
    try {
      // Get current booking
      const { data: currentBooking, error: fetchError } = await supabase
        .from('bookings')
        .select(`
          *,
          services(*)
        `)
        .eq('id', bookingId)
        .single();

      if (fetchError || !currentBooking) {
        return {
          success: false,
          error: 'Booking not found'
        };
      }

      // Verify ownership
      if (currentBooking.user_id !== userId) {
        return {
          success: false,
          error: 'Not authorized to modify this booking'
        };
      }

      // Check reschedule limits
      const rescheduleCount = currentBooking.reschedule_count || 0;
      const maxReschedules = 3; // Configurable limit

      if (rescheduleCount >= maxReschedules) {
        return {
          success: false,
          error: 'Maximum reschedule limit reached'
        };
      }

      // Validate new time slot availability
      const newTimeSlot: TimeSlot = {
        id: `${currentBooking.service_id}-${newDate}-${newTime}`,
        date: newDate,
        time: newTime,
        available: false,
        location: currentBooking.location_type || 'studio'
      };

      const availabilityCheck = await bookingDomainService.validateServiceAvailability(
        currentBooking.service_id,
        newTimeSlot
      );

      if (!availabilityCheck.valid) {
        return {
          success: false,
          error: availabilityCheck.reason || 'New time slot not available'
        };
      }

      // Update booking
      const { data: updatedBooking, error: updateError } = await supabase
        .from('bookings')
        .update({
          booking_date: newDate.toISOString().split('T')[0],
          booking_time: newTime,
          reschedule_count: rescheduleCount + 1,
          last_rescheduled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          metadata: {
            ...currentBooking.metadata,
            reschedule_history: [
              ...(currentBooking.metadata?.reschedule_history || []),
              {
                from_date: currentBooking.booking_date,
                from_time: currentBooking.booking_time,
                to_date: newDate.toISOString().split('T')[0],
                to_time: newTime,
                rescheduled_at: new Date().toISOString()
              }
            ]
          }
        })
        .eq('id', bookingId)
        .select(`
          *,
          services(*)
        `)
        .single();

      if (updateError || !updatedBooking) {
        return {
          success: false,
          error: 'Failed to reschedule booking'
        };
      }

      logger.info('Booking rescheduled successfully', {
        bookingId,
        userId,
        newDate: newDate.toISOString().split('T')[0],
        newTime,
        rescheduleCount: rescheduleCount + 1
      });

      return {
        success: true,
        booking: this.mapDbBookingToDomain(updatedBooking)
      };

    } catch (error) {
      logger.error('Error rescheduling booking:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reschedule booking'
      };
    }
  }

  /**
   * Cancel a booking
   */
  async cancelBooking(
    bookingId: string,
    userId: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string; refundAmount?: number }> {
    try {
      // Get booking details
      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select(`
          *,
          services(*)
        `)
        .eq('id', bookingId)
        .single();

      if (fetchError || !booking) {
        return {
          success: false,
          error: 'Booking not found'
        };
      }

      // Verify ownership
      if (booking.user_id !== userId) {
        return {
          success: false,
          error: 'Not authorized to cancel this booking'
        };
      }

      // Calculate cancellation fees
      const cancellationFeeResult = await paymentSystemService.calculateCancellationFee({
        bookingId,
        totalAmount: booking.price_from || 0,
        depositPaid: booking.deposit_paid || 0,
        cancellationTime: new Date(),
        bookingTime: new Date(`${booking.booking_date}T${booking.booking_time}`),
        currency: booking.currency || 'PLN'
      });

      // Update booking status
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
          metadata: {
            ...booking.metadata,
            cancellation_reason: reason,
            cancellation_fee: cancellationFeeResult.data?.feeAmount || 0,
            refund_amount: cancellationFeeResult.data?.refundAmount || 0,
            cancelled_at: new Date().toISOString()
          }
        })
        .eq('id', bookingId);

      if (updateError) {
        return {
          success: false,
          error: 'Failed to cancel booking'
        };
      }

      logger.info('Booking cancelled successfully', {
        bookingId,
        userId,
        reason,
        refundAmount: cancellationFeeResult.data?.refundAmount
      });

      return {
        success: true,
        refundAmount: cancellationFeeResult.data?.refundAmount
      };

    } catch (error) {
      logger.error('Error cancelling booking:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel booking'
      };
    }
  }

  /**
   * Map database booking to domain model
   */
  private mapDbBookingToDomain(dbBooking: any): Booking {
    return {
      id: dbBooking.id,
      service_id: dbBooking.service_id,
      user_id: dbBooking.user_id,
      status: dbBooking.status as BookingStatus,
      service: {
        id: dbBooking.services.id,
        title: dbBooking.services.title,
        slug: dbBooking.services.slug || '',
        service_type: dbBooking.services.service_type as ServiceType,
        price_from: dbBooking.services.price_from,
        price_to: dbBooking.services.price_to,
        duration_minutes: dbBooking.services.duration_minutes,
        image_url: dbBooking.services.image_url
      },
      timeSlot: {
        id: `${dbBooking.service_id}-${dbBooking.booking_date}-${dbBooking.booking_time}`,
        date: new Date(dbBooking.booking_date),
        time: dbBooking.booking_time,
        available: false,
        location: dbBooking.location_type || 'studio'
      },
      details: {
        client_name: dbBooking.client_name,
        client_email: dbBooking.client_email,
        client_phone: dbBooking.client_phone,
        notes: dbBooking.notes,
        consent_terms: dbBooking.consent_terms_accepted || false,
        consent_marketing: dbBooking.consent_marketing_accepted || false
      },
      created_at: new Date(dbBooking.created_at),
      updated_at: new Date(dbBooking.updated_at),
      reschedule_count: dbBooking.reschedule_count,
      last_rescheduled_at: dbBooking.last_rescheduled_at ? new Date(dbBooking.last_rescheduled_at) : undefined
    };
  }

  /**
   * Get user's booking history
   */
  async getUserBookings(
    userId: string,
    options: {
      status?: BookingStatus;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ bookings: Booking[]; total: number }> {
    try {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          services(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Apply filters
      if (options.status) {
        query = query.eq('status', options.status);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data: bookings, error, count } = await query;

      if (error) {
        throw error;
      }

      return {
        bookings: bookings?.map(this.mapDbBookingToDomain) || [],
        total: count || 0
      };

    } catch (error) {
      logger.error('Error getting user bookings:', error);
      return {
        bookings: [],
        total: 0
      };
    }
  }
}

// Export singleton instance
export const enhancedBookingService = new EnhancedBookingService();