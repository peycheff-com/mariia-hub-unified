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

// Price breakdown item for better type safety
interface PriceBreakdownItem {
  type: 'base' | 'addon' | 'discount' | 'tax' | 'fee';
  name: string;
  amount: number;
  quantity?: number;
  unitPrice?: number;
}

// Service add-on interface
interface ServiceAddOn {
  id: string;
  name: string;
  price: number;
  duration?: number;
  description?: string;
  category?: string;
}

// Domain events
export type BookingEvent =
  | { type: 'booking.created'; booking: Booking }
  | { type: 'booking.updated'; bookingId: string; status: BookingStatus }
  | { type: 'booking.cancelled'; bookingId: string; reason: string }
  | { type: 'slot.reserved'; slotId: string; userId: string; expiresAt: Date }
  | { type: 'slot.released'; slotId: string };

// Event listeners
type EventListener = (event: BookingEvent) => void;
const eventListeners = new Map<string, Set<EventListener>>();

export class BookingDomainService {
  private static instance: BookingDomainService;

  static getInstance(): BookingDomainService {
    if (!BookingDomainService.instance) {
      BookingDomainService.instance = new BookingDomainService();
    }
    return BookingDomainService.instance;
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
      listeners.forEach(listener => listener(event));
    }
  }

  // Business logic methods

  /**
   * Validate service availability for a given time slot
   */
  async validateServiceAvailability(
    serviceId: string,
    timeSlot: TimeSlot
  ): Promise<{ valid: boolean; reason?: string }> {
    try {
      // Check if service exists and is active
      const { data: service, error: serviceError } = await supabase
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .eq('is_active', true)
        .single();

      if (serviceError || !service) {
        return { valid: false, reason: 'Service not available' };
      }

      // Check location compatibility
      const isLocationValid = this.validateLocationCompatibility(
        service.service_type as ServiceType,
        timeSlot.location
      );

      if (!isLocationValid) {
        return {
          valid: false,
          reason: `Location ${timeSlot.location} not available for ${service.service_type} services`
        };
      }

      // Check for existing bookings at the same time
      const existingBooking = await this.checkForConflictingBookings(
        timeSlot.date,
        timeSlot.time,
        service.duration_minutes
      );

      if (existingBooking) {
        return { valid: false, reason: 'Time slot already booked' };
      }

      return { valid: true };
    } catch (error) {
      logger.error('Error validating availability:', error);
      return { valid: false, reason: 'Validation failed' };
    }
  }

  /**
   * Create a hold on a time slot to prevent double booking
   */
  async reserveTimeSlot(
    slotId: string,
    userId: string,
    serviceId: string
  ): Promise<{ success: boolean; holdId?: string; expiresAt?: Date }> {
    try {
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      const { data: hold, error } = await supabase
        .from('holds')
        .insert({
          resource_id: 'mariia', // Single resource system
          user_id: userId,
          service_id: serviceId,
          start_time: new Date(), // This would be calculated from slot
          end_time: new Date(),
          expires_at: expiresAt.toISOString(),
          session_id: crypto.randomUUID(),
        })
        .select('id')
        .single();

      if (error) {
        logger.error('Failed to create hold:', error);
        return { success: false };
      }

      // Emit slot reservation event
      this.emit({
        type: 'slot.reserved',
        slotId,
        userId,
        expiresAt,
      });

      return {
        success: true,
        holdId: hold.id,
        expiresAt
      };
    } catch (error) {
      logger.error('Error reserving slot:', error);
      return { success: false };
    }
  }

  /**
   * Release a hold on a time slot
   */
  async releaseTimeSlot(holdId: string): Promise<void> {
    try {
      await supabase
        .from('holds')
        .delete()
        .eq('id', holdId);

      this.emit({
        type: 'slot.released',
        slotId: holdId,
      });
    } catch (error) {
      logger.error('Error releasing slot:', error);
    }
  }

  /**
   * Create a new booking with validation
   */
  async createBooking(
    service: Service,
    timeSlot: TimeSlot,
    details: BookingDetails,
    userId?: string
  ): Promise<{ success: boolean; booking?: Booking; error?: string }> {
    try {
      // Validate availability first
      const availabilityCheck = await this.validateServiceAvailability(
        service.id,
        timeSlot
      );

      if (!availabilityCheck.valid) {
        return {
          success: false,
          error: availabilityCheck.reason || 'Service not available'
        };
      }

      // Validate booking details
      const validationError = this.validateBookingDetails(details);
      if (validationError) {
        return { success: false, error: validationError };
      }

      // Create the booking
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
        selected_add_ons: [], // NOTE: Add-ons functionality pending - requires UI and pricing logic
        currency: 'PLN', // NOTE: User preferences integration pending - currently hardcoded
        amount_paid: service.price_from, // NOTE: Add-ons pricing calculation pending - currently base price only
        payment_method: 'pending',
        consent_terms_accepted: details.consent_terms,
        consent_marketing_accepted: details.consent_marketing,
        metadata: {
          service_type: service.service_type,
          time_slot: timeSlot,
        },
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
        logger.error('Failed to create booking:', error);
        return { success: false, error: 'Failed to create booking' };
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

      // Emit booking created event
      this.emit({
        type: 'booking.created',
        booking: domainBooking,
      });

      return { success: true, booking: domainBooking };
    } catch (error) {
      logger.error('Error creating booking:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update booking status with business rules
   */
  async updateBookingStatus(
    bookingId: string,
    newStatus: BookingStatus,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate status transition
      const { data: currentBooking, error: fetchError } = await supabase
        .from('bookings')
        .select('status')
        .eq('id', bookingId)
        .single();

      if (fetchError || !currentBooking) {
        return { success: false, error: 'Booking not found' };
      }

      if (!this.isValidStatusTransition(currentBooking.status, newStatus)) {
        return {
          success: false,
          error: `Invalid status transition from ${currentBooking.status} to ${newStatus}`
        };
      }

      // Apply business rules
      const businessRuleResult = await this.applyBusinessRulesForStatusChange(
        bookingId,
        currentBooking.status,
        newStatus
      );

      if (!businessRuleResult.valid) {
        return {
          success: false,
          error: businessRuleResult.reason
        };
      }

      // Update the booking
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
          admin_notes: reason,
        })
        .eq('id', bookingId);

      if (updateError) {
        logger.error('Failed to update booking status:', updateError);
        return { success: false, error: 'Failed to update booking' };
      }

      // Emit status update event
      this.emit({
        type: 'booking.updated',
        bookingId,
        status: newStatus,
      });

      if (newStatus === 'cancelled') {
        this.emit({
          type: 'booking.cancelled',
          bookingId,
          reason: reason || 'Cancelled by user',
        });
      }

      return { success: true };
    } catch (error) {
      logger.error('Error updating booking status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Calculate total price with add-ons and discounts
   */
  calculateTotalPrice(
    service: Service,
    addOns: ServiceAddOn[] = [],
    discountCode?: string
  ): { total: number; breakdown: PriceBreakdownItem[] } {
    const breakdown: PriceBreakdownItem[] = [
      {
        type: 'base',
        name: service.title,
        amount: service.price_from,
      },
    ];

    let total = service.price_from;

    // Add add-ons
    addOns.forEach(addOn => {
      total += addOn.price;
      breakdown.push({
        type: 'addon',
        name: addOn.title,
        amount: addOn.price,
      });
    });

    // Apply discount code
    if (discountCode) {
      // NOTE: Discount logic pending - requires discount code validation and calculation
      // TODO: Implement discount logic with proper validation and calculation
      const discount = 0;
      if (discount > 0) {
        total -= discount;
        breakdown.push({
          type: 'discount',
          name: `Discount code: ${discountCode}`,
          amount: -discount,
        });
      }
    }

    return { total, breakdown };
  }

  // Private helper methods

  private validateLocationCompatibility(
    serviceType: ServiceType,
    location: LocationType
  ): boolean {
    const compatibilityRules = {
      beauty: ['studio', 'online'],
      fitness: ['fitness', 'online', 'studio'],
    };

    return compatibilityRules[serviceType]?.includes(location) || false;
  }

  private async checkForConflictingBookings(
    date: Date,
    time: string,
    duration: number
  ): Promise<boolean> {
    const startTime = new Date(`${date.toISOString().split('T')[0]}T${time}`);
    const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

    const { count } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('booking_date', date.toISOString().split('T')[0])
      .in('status', ['pending', 'confirmed'])
      .or(`and(booking_time.lte.${time},booking_time.gte.${time})`);

    return count ? count > 0 : false;
  }

  private validateBookingDetails(details: BookingDetails): string | null {
    if (!details.client_name || details.client_name.trim().length < 2) {
      return 'Please provide a valid name';
    }

    if (!details.client_email || !this.isValidEmail(details.client_email)) {
      return 'Please provide a valid email address';
    }

    if (!details.client_phone || !this.isValidPhone(details.client_phone)) {
      return 'Please provide a valid phone number';
    }

    if (!details.consent_terms) {
      return 'You must accept the terms and conditions';
    }

    return null;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhone(phone: string): boolean {
    // Polish phone number validation
    const phoneRegex = /^(\+48|48)?[5-9]\d{8}$/;
    return phoneRegex.test(phone.replace(/[\s-]/g, ''));
  }

  private isValidStatusTransition(
    current: BookingStatus,
    next: BookingStatus
  ): boolean {
    const validTransitions = {
      draft: ['pending', 'cancelled'],
      pending: ['confirmed', 'cancelled'],
      confirmed: ['completed', 'cancelled'],
      completed: [], // Terminal state
      cancelled: [], // Terminal state
    };

    return validTransitions[current]?.includes(next) || false;
  }

  private async applyBusinessRulesForStatusChange(
    bookingId: string,
    currentStatus: BookingStatus,
    newStatus: BookingStatus
  ): Promise<{ valid: boolean; reason?: string }> {
    // Rule: Cannot cancel confirmed bookings less than 24h in advance
    if (currentStatus === 'confirmed' && newStatus === 'cancelled') {
      const { data: booking } = await supabase
        .from('bookings')
        .select('booking_date, booking_time')
        .eq('id', bookingId)
        .single();

      if (booking) {
        const bookingDateTime = new Date(
          `${booking.booking_date}T${booking.booking_time}`
        );
        const now = new Date();
        const hoursDiff = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (hoursDiff < 24) {
          return {
            valid: false,
            reason: 'Cannot cancel bookings less than 24 hours in advance',
          };
        }
      }
    }

    // Rule: Can only mark as completed after the booking time has passed
    if (newStatus === 'completed') {
      const { data: booking } = await supabase
        .from('bookings')
        .select('booking_date, booking_time')
        .eq('id', bookingId)
        .single();

      if (booking) {
        const bookingDateTime = new Date(
          `${booking.booking_date}T${booking.booking_time}`
        );
        const now = new Date();

        if (bookingDateTime > now) {
          return {
            valid: false,
            reason: 'Cannot complete future bookings',
          };
        }
      }
    }

    return { valid: true };
  }

  private getLocationId(location: LocationType): string {
    const locationMap = {
      studio: 'studio-location-id',
      online: 'online-location-id',
      fitness: 'fitness-location-id',
    };
    return locationMap[location] || 'studio-location-id';
  }
}

// Export singleton instance
export const bookingDomainService = BookingDomainService.getInstance();