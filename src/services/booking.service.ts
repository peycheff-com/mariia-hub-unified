import { z } from 'zod';

import { supabase } from '@/integrations/supabase/client';
import { UserDashboardStats, BookingCard, PersonalizedRecommendation, CalendarEvent } from '@/types/user';

import { BaseService } from './api/base.service';

/**
 * @fileoverview Comprehensive booking service managing beauty and fitness service reservations
 * Handles availability checking, time slot management, booking creation, and user portal features
 * Integrates with Supabase for data persistence and external booking systems for synchronization
 *
 * @author mariiaborysevych Team
 * @since 1.0.0
 * @version 1.0.0
 */

// Types

/**
 * Represents a complete booking record with all associated information
 * @interface Booking
 * @property {string} id - Unique booking identifier
 * @property {string} client_id - ID of the client who made the booking
 * @property {string} service_id - ID of the booked service
 * @property {string} [location_id] - ID of the location where service will be provided
 * @property {string} [practitioner_id] - ID of the service practitioner
 * @property {string} start_time - ISO datetime string for appointment start
 * @property {string} end_time - ISO datetime string for appointment end
 * @property {'pending'|'confirmed'|'cancelled'|'completed'|'no_show'} status - Current booking status
 * @property {number} total_price - Total price for the booking in currency units
 * @property {string} currency - Currency code (e.g., 'PLN', 'EUR', 'USD')
 * @property {string} [notes] - Additional booking notes or client preferences
 * @property {Object} client_info - Client contact information
 * @property {string} client_info.name - Client's full name
 * @property {string} client_info.email - Client's email address
 * @property {string} client_info.phone - Client's phone number
 * @property {Record<string, any>} [preferences] - Client preferences and special requirements
 * @property {'pending'|'paid'|'refunded'|'partial'} payment_status - Current payment status
 * @property {string} [payment_method] - Payment method used
 * @property {string} [external_booking_id] - ID from external booking system
 * @property {'pending'|'synced'|'error'} [external_sync_status] - Sync status with external systems
 * @property {string} created_at - ISO datetime when booking was created
 * @property {string} updated_at - ISO datetime when booking was last updated
 * @property {string} [cancelled_at] - ISO datetime when booking was cancelled
 * @property {string} [cancellation_reason] - Reason for booking cancellation
 * @property {number} [refund_amount] - Amount refunded if applicable
 * @property {string} [refund_reason] - Reason for refund
 */
export interface Booking {
  id: string;
  client_id: string;
  service_id: string;
  location_id?: string;
  practitioner_id?: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  total_price: number;
  currency: string;
  notes?: string;
  client_info: {
    name: string;
    email: string;
    phone: string;
  };
  preferences?: Record<string, any>;
  payment_status: 'pending' | 'paid' | 'refunded' | 'partial';
  payment_method?: string;
  external_booking_id?: string;
  external_sync_status?: 'pending' | 'synced' | 'error';
  created_at: string;
  updated_at: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  refund_amount?: number;
  refund_reason?: string;
}

/**
 * Represents a time slot available for booking
 * @interface TimeSlot
 * @property {string} id - Unique time slot identifier
 * @property {string} start_time - ISO datetime string for slot start time
 * @property {string} end_time - ISO datetime string for slot end time
 * @property {string} service_id - ID of the service this slot belongs to
 * @property {string} [location_id] - ID of the location for this time slot
 * @property {string} [practitioner_id] - ID of the practitioner for this time slot
 * @property {'available'|'held'|'booked'} status - Current availability status
 * @property {number} [max_participants] - Maximum number of participants for group services
 * @property {number} [current_participants] - Current number of participants
 */
export interface TimeSlot {
  id: string;
  start_time: string;
  end_time: string;
  service_id: string;
  location_id?: string;
  practitioner_id?: string;
  status: 'available' | 'held' | 'booked';
  max_participants?: number;
  current_participants?: number;
}

export interface BookingDraft {
  id: string;
  session_id: string;
  service_id: string;
  selected_time?: string;
  client_info?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  preferences?: Record<string, any>;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface Hold {
  id: string;
  time_slot_id: string;
  session_id: string;
  expires_at: string;
  created_at: string;
}

// Validation schemas
const CreateBookingSchema = z.object({
  service_id: z.string().uuid(),
  location_id: z.string().uuid().optional(),
  practitioner_id: z.string().uuid().optional(),
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
  total_price: z.number().positive(),
  currency: z.string().length(3),
  notes: z.string().optional(),
  client_info: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(6),
  }),
  preferences: z.record(z.any()).optional(),
  payment_method: z.string().optional(),
});

const BookingFiltersSchema = z.object({
  client_id: z.string().uuid().optional(),
  service_id: z.string().uuid().optional(),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed', 'no_show']).optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  location_id: z.string().uuid().optional(),
  practitioner_id: z.string().uuid().optional(),
});

export type CreateBookingRequest = z.infer<typeof CreateBookingSchema>;
export type BookingFilters = z.infer<typeof BookingFiltersSchema>;

export class BookingService extends BaseService {
  private static instance: BookingService;

  static getInstance(): BookingService {
    if (!BookingService.instance) {
      BookingService.instance = new BookingService();
    }
    return BookingService.instance;
  }

  // Check availability for a service
  async checkAvailability(
    serviceId: string,
    startDate: string,
    endDate: string,
    locationId?: string,
    practitionerId?: string
  ): Promise<{ data: TimeSlot[]; error: any }> {
    try {
      let query = supabase
        .from('availability_slots')
        .select('*')
        .eq('service_id', serviceId)
        .eq('status', 'available')
        .gte('start_time', startDate)
        .lte('start_time', endDate)
        .order('start_time', { ascending: true });

      if (locationId) {
        query = query.eq('location_id', locationId);
      }
      if (practitionerId) {
        query = query.eq('practitioner_id', practitionerId);
      }

      const { data, error } = await query;

      if (error) {
        return { data: [], error: this.handleError(error) };
      }

      return { data: data || [], error: null };
    } catch (error) {
      return { data: [], error: this.handleError(error) };
    }
  }

  // Hold a time slot (5-minute reservation during booking flow)
  async holdTimeSlot(
    timeSlotId: string,
    sessionId: string
  ): Promise<{ data: Hold | null; error: any }> {
    try {
      // First check if slot is still available
      const { data: slot, error: slotError } = await supabase
        .from('availability_slots')
        .select('*')
        .eq('id', timeSlotId)
        .eq('status', 'available')
        .single();

      if (slotError || !slot) {
        return { data: null, error: { message: 'Time slot not available' } };
      }

      // Update slot status to held
      const { error: updateError } = await supabase
        .from('availability_slots')
        .update({
          status: 'held',
          updated_at: new Date().toISOString()
        })
        .eq('id', timeSlotId);

      if (updateError) {
        return { data: null, error: this.handleError(updateError) };
      }

      // Create hold record
      const { data: hold, error: holdError } = await supabase
        .from('holds')
        .insert({
          time_slot_id: timeSlotId,
          session_id: sessionId,
          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
        })
        .select()
        .single();

      if (holdError) {
        // Rollback slot status on error
        await supabase
          .from('availability_slots')
          .update({ status: 'available' })
          .eq('id', timeSlotId);
        return { data: null, error: this.handleError(holdError) };
      }

      return { data: hold, error: null };
    } catch (error) {
      return { data: null, error: this.handleError(error) };
    }
  }

  // Release a held time slot
  async releaseTimeSlot(holdId: string): Promise<{ error: any }> {
    try {
      // Get hold details
      const { data: hold, error: fetchError } = await supabase
        .from('holds')
        .select('*')
        .eq('id', holdId)
        .single();

      if (fetchError || !hold) {
        return { error: { message: 'Hold not found' } };
      }

      // Update slot status back to available
      await supabase
        .from('availability_slots')
        .update({
          status: 'available',
          updated_at: new Date().toISOString()
        })
        .eq('id', hold.time_slot_id);

      // Delete hold record
      const { error: deleteError } = await supabase
        .from('holds')
        .delete()
        .eq('id', holdId);

      if (deleteError) {
        return { error: this.handleError(deleteError) };
      }

      return { error: null };
    } catch (error) {
      return { error: this.handleError(error) };
    }
  }

  // Save booking draft
  async saveBookingDraft(
    sessionId: string,
    data: Partial<BookingDraft>
  ): Promise<{ data: BookingDraft | null; error: any }> {
    try {
      const upsertData = {
        session_id: sessionId,
        ...data,
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
        updated_at: new Date().toISOString(),
      };

      const { data: draft, error } = await supabase
        .from('booking_drafts')
        .upsert(upsertData, {
          onConflict: 'session_id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) {
        return { data: null, error: this.handleError(error) };
      }

      return { data: draft, error: null };
    } catch (error) {
      return { data: null, error: this.handleError(error) };
    }
  }

  // Get booking draft
  async getBookingDraft(sessionId: string): Promise<{ data: BookingDraft | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('booking_drafts')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (error) {
        return { data: null, error: this.handleError(error) };
      }

      // Check if draft has expired
      if (new Date(data.expires_at) < new Date()) {
        // Delete expired draft
        await supabase
          .from('booking_drafts')
          .delete()
          .eq('session_id', sessionId);
        return { data: null, error: { message: 'Draft has expired' } };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: this.handleError(error) };
    }
  }

  // Create booking
  async createBooking(bookingData: CreateBookingRequest): Promise<{ data: Booking | null; error: any }> {
    try {
      const validatedData = CreateBookingSchema.parse(bookingData);

      const { data, error } = await supabase
        .from('bookings')
        .insert({
          ...validatedData,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        return { data: null, error: this.handleError(error) };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: this.handleError(error) };
    }
  }

  // Confirm booking
  async confirmBooking(bookingId: string, paymentId?: string): Promise<{ data: Booking | null; error: any }> {
    try {
      const updateData: any = {
        status: 'confirmed',
        updated_at: new Date().toISOString(),
      };

      if (paymentId) {
        updateData.payment_status = 'paid';
        updateData.payment_method = 'stripe';
      }

      const { data, error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId)
        .select()
        .single();

      if (error) {
        return { data: null, error: this.handleError(error) };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: this.handleError(error) };
    }
  }

  // Cancel booking
  async cancelBooking(
    bookingId: string,
    reason?: string,
    refundAmount?: number
  ): Promise<{ data: Booking | null; error: any }> {
    try {
      const updateData: any = {
        status: 'cancelled',
        updated_at: new Date().toISOString(),
        cancelled_at: new Date().toISOString(),
      };

      if (reason) {
        updateData.cancellation_reason = reason;
      }

      if (refundAmount !== undefined) {
        updateData.refund_amount = refundAmount;
        updateData.payment_status = 'refunded';
      }

      const { data, error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId)
        .select()
        .single();

      if (error) {
        return { data: null, error: this.handleError(error) };
      }

      // Mark time slot as available again
      if (data.start_time && data.service_id) {
        await supabase
          .from('availability_slots')
          .update({
            status: 'available',
            updated_at: new Date().toISOString(),
          })
          .eq('start_time', data.start_time)
          .eq('service_id', data.service_id);
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: this.handleError(error) };
    }
  }

  // Get user bookings with explicit filters (used by admin/analytics flows)
  async getUserBookingsWithFilters(
    userId: string,
    filters?: BookingFilters
  ): Promise<{ data: Booking[]; error: any }> {
    try {
      const validatedFilters = filters ? BookingFiltersSchema.parse(filters) : {};

      let query = supabase
        .from('bookings')
        .select(`
          *,
          services(
            id,
            title,
            slug,
            service_type,
            duration_minutes
          )
        `)
        .eq('client_id', userId)
        .order('created_at', { ascending: false });

      // Apply filters
      if (validatedFilters.status) {
        query = query.eq('status', validatedFilters.status);
      }
      if (validatedFilters.service_id) {
        query = query.eq('service_id', validatedFilters.service_id);
      }
      if (validatedFilters.start_date) {
        query = query.gte('start_time', validatedFilters.start_date);
      }
      if (validatedFilters.end_date) {
        query = query.lte('start_time', validatedFilters.end_date);
      }

      const { data, error } = await query;

      if (error) {
        return { data: [], error: this.handleError(error) };
      }

      return { data: data || [], error: null };
    } catch (error) {
      return { data: [], error: this.handleError(error) };
    }
  }

  // Get booking by ID
  async getBookingById(bookingId: string): Promise<{ data: Booking | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          services(
            id,
            title,
            description,
            slug,
            service_type,
            duration_minutes,
            price_from,
            price_to
          )
        `)
        .eq('id', bookingId)
        .single();

      if (error) {
        return { data: null, error: this.handleError(error) };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: this.handleError(error) };
    }
  }

  // Clean up expired holds and drafts (utility function)
  async cleanupExpired(): Promise<{ error: any }> {
    try {
      const now = new Date().toISOString();

      // Release expired holds
      const { data: expiredHolds } = await supabase
        .from('holds')
        .select('id, time_slot_id')
        .lt('expires_at', now);

      if (expiredHolds && expiredHolds.length > 0) {
        // Get time slot IDs to update
        const slotIds = expiredHolds.map(hold => hold.time_slot_id);

        // Update slots back to available
        await supabase
          .from('availability_slots')
          .update({
            status: 'available',
            updated_at: now,
          })
          .in('id', slotIds);

        // Delete expired holds
        await supabase
          .from('holds')
          .delete()
          .lt('expires_at', now);
      }

      // Delete expired drafts
      await supabase
        .from('booking_drafts')
        .delete()
        .lt('expires_at', now);

      return { error: null };
    } catch (error) {
      return { error: this.handleError(error) };
    }
  }

  // User Portal Methods
  async getUserDashboardStats(): Promise<UserDashboardStats> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get total bookings
    const { count: totalBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', user.id);

    // Get upcoming bookings
    const { count: upcomingBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', user.id)
      .in('status', ['pending', 'confirmed'])
      .gte('start_time', new Date().toISOString());

    // Get completed services
    const { count: completedServices } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', user.id)
      .eq('status', 'completed');

    // Get favorite services count
    const { count: favoriteServices } = await supabase
      .from('user_favorites')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Get next appointment
    const { data: nextAppointment } = await supabase
      .from('bookings')
      .select(`
        *,
        service:services(name, location_id)
      `)
      .eq('client_id', user.id)
      .in('status', ['pending', 'confirmed'])
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(1)
      .single();

    // Get user profile for name
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name')
      .eq('id', user.id)
      .single();

    return {
      total_bookings: totalBookings || 0,
      upcoming_bookings: upcomingBookings || 0,
      completed_services: completedServices || 0,
      favorite_services: favoriteServices || 0,
      loyalty_points: 0, // Would be calculated from actual loyalty system
      next_appointment: nextAppointment ? {
        id: nextAppointment.id,
        service_name: nextAppointment.service?.name || 'Unknown Service',
        date: nextAppointment.start_time,
        time: nextAppointment.start_time,
        location: nextAppointment.service?.location_id || 'Warsaw',
      } : undefined,
      user_name: profile?.first_name || 'User',
    } as UserDashboardStats;
  }

  async getUserBookings(params?: {
    status?: string[];
    limit?: number;
    offset?: number;
    date?: Date;
    search?: string;
  }): Promise<BookingCard[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    let query = supabase
      .from('bookings')
      .select(`
        *,
        service:services(name, image_url, duration, category, type),
        practitioner:profiles(first_name, last_name)
      `)
      .eq('client_id', user.id)
      .order('start_time', { ascending: false });

    // Status filter
    if (params?.status && params.status.length > 0) {
      query = query.in('status', params.status);
    }

    // Date filter
    if (params?.date) {
      const startOfDay = new Date(params.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(params.date);
      endOfDay.setHours(23, 59, 59, 999);
      query = query
        .gte('start_time', startOfDay.toISOString())
        .lte('start_time', endOfDay.toISOString());
    }

    // Search filter
    if (params?.search) {
      query = query.ilike('service.name', `%${params.search}%`);
    }

    // Limit
    if (params?.limit) {
      query = query.limit(params.limit);
    }

    const { data, error } = await query;

    if (error || !data) return [];

    return data.map(booking => ({
      id: booking.id,
      service_name: booking.service?.name || 'Unknown Service',
      provider_name: booking.practitioner
        ? `${booking.practitioner.first_name} ${booking.practitioner.last_name}`
        : 'Specialist',
      date: booking.start_time,
      time: booking.start_time,
      duration: booking.service?.duration || 60,
      status: booking.status as any,
      price: booking.total_price,
      location: 'Warsaw', // Would come from actual location data
      image_url: booking.service?.image_url,
      can_reschedule: booking.status === 'confirmed',
      can_cancel: ['pending', 'confirmed'].includes(booking.status),
      review_submitted: false, // Would check reviews table
    })) as BookingCard[];
  }

  async getPersonalizedRecommendations(): Promise<PersonalizedRecommendation[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Get user's booking history
    const { data: bookings } = await supabase
      .from('bookings')
      .select('service_id')
      .eq('client_id', user.id);

    const bookedServiceIds = bookings?.map(b => b.service_id) || [];

    // Get user's favorites
    const { data: favorites } = await supabase
      .from('user_favorites')
      .select('service_id')
      .eq('user_id', user.id);

    const favoriteServiceIds = favorites?.map(f => f.service_id) || [];

    // Get recommendations based on similar services
    const { data: recommendations } = await supabase
      .from('services')
      .select('*')
      .eq('status', 'active')
      .not('id', 'in', [...bookedServiceIds, ...favoriteServiceIds])
      .limit(6);

    return (recommendations || []).map(service => ({
      service,
      reason: 'Based on your booking history',
      confidence: 0.85,
      category: 'similar' as const,
    })) as PersonalizedRecommendation[];
  }

  async getUserCalendarEvents(): Promise<CalendarEvent[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: bookings } = await supabase
      .from('bookings')
      .select(`
        *,
        service:services(name, location_id)
      `)
      .eq('client_id', user.id)
      .in('status', ['pending', 'confirmed'])
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true });

    return (bookings || []).map(booking => ({
      id: booking.id,
      title: booking.service?.name || 'Appointment',
      date: new Date(booking.start_time),
      time: booking.start_time,
      duration: booking.service?.duration || 60,
      type: 'booking' as const,
      status: booking.status as any,
      location: booking.service?.location_id || 'Warsaw',
      service_id: booking.service_id,
    })) as CalendarEvent[];
  }

  async submitReview(bookingId: string, review: { rating: number; comment: string }): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get service_id from booking
    const { data: booking } = await supabase
      .from('bookings')
      .select('service_id')
      .eq('id', bookingId)
      .single();

    if (!booking) throw new Error('Booking not found');

    // Insert review
    const { error } = await supabase
      .from('reviews')
      .insert({
        booking_id: bookingId,
        service_id: booking.service_id,
        client_id: user.id,
        rating: review.rating,
        comment: review.comment,
        created_at: new Date().toISOString(),
      });

    if (error) throw error;
  }
}

// Export singleton instance
export const bookingService = BookingService.getInstance();
