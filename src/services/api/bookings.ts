import { supabase } from '@/integrations/supabase/client';

import { ApiService } from './index';

export interface Booking {
  id: string;
  service_id: string;
  user_id?: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_status: 'pending' | 'paid' | 'unpaid' | 'refunded';
  payment_method?: 'card' | 'cash' | 'transfer';
  stripe_payment_intent_id?: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateBookingData {
  service_id: string;
  user_id?: string;
  date: string;
  time: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  notes?: string;
  payment_method?: 'card' | 'cash';
  stripe_payment_intent_id?: string;
}

export class BookingsApi {
  // Create a new booking
  static async createBooking(data: CreateBookingData): Promise<Booking | null> {
    return ApiService.handleRequestWithRetry(
      () => supabase
        .from('bookings')
        .insert({
          ...data,
          status: 'pending',
          payment_status: data.payment_method === 'card' ? 'pending' : 'unpaid',
        })
        .select()
        .single(),
      3,
      'Failed to create booking'
    );
  }

  // Get a booking by ID
  static async getBooking(id: string): Promise<Booking | null> {
    return ApiService.handleRequest(
      supabase
        .from('bookings')
        .select(`
          *,
          services(
            id,
            title,
            duration_minutes,
            price_from,
            service_type
          )
        `)
        .eq('id', id)
        .single(),
      'Failed to load booking'
    );
  }

  // Get all bookings for a user
  static async getUserBookings(userId: string): Promise<Booking[] | null> {
    return ApiService.handleRequest(
      supabase
        .from('bookings')
        .select(`
          *,
          services(
            id,
            title,
            duration_minutes,
            price_from,
            service_type
          )
        `)
        .eq('user_id', userId)
        .order('date', { ascending: false }),
      'Failed to load bookings'
    );
  }

  // Update booking status
  static async updateBookingStatus(
    id: string,
    status: Booking['status'],
    paymentStatus?: Booking['payment_status']
  ): Promise<Booking | null> {
    const updateData: any = { status, updated_at: new Date().toISOString() };

    if (paymentStatus) {
      updateData.payment_status = paymentStatus;
    }

    return ApiService.handleRequest(
      supabase
        .from('bookings')
        .update(updateData)
        .eq('id', id)
        .select()
        .single(),
      'Failed to update booking'
    );
  }

  // Cancel a booking
  static async cancelBooking(id: string, reason?: string): Promise<Booking | null> {
    return ApiService.handleRequest(
      supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
          notes: reason ? `Cancelled: ${reason}` : 'Cancelled by customer'
        })
        .eq('id', id)
        .select()
        .single(),
      'Failed to cancel booking'
    );
  }

  // Reschedule a booking
  static async rescheduleBooking(
    id: string,
    newDate: string,
    newTime: string
  ): Promise<Booking | null> {
    return ApiService.handleRequest(
      supabase
        .from('bookings')
        .update({
          date: newDate,
          time: newTime,
          updated_at: new Date().toISOString(),
          notes: 'Rescheduled by customer'
        })
        .eq('id', id)
        .select()
        .single(),
      'Failed to reschedule booking'
    );
  }

  // Check if a time slot is available
  static async checkAvailability(
    serviceId: string,
    date: string,
    time: string,
    excludeBookingId?: string
  ): Promise<boolean> {
    const query = supabase
      .from('bookings')
      .select('id')
      .eq('service_id', serviceId)
      .eq('date', date)
      .eq('time', time)
      .in('status', ['pending', 'confirmed']);

    if (excludeBookingId) {
      query.neq('id', excludeBookingId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error checking availability:', error);
      return false;
    }

    return !data || data.length === 0;
  }

  // Get all bookings (for admin)
  static async getAllBookings(filters?: {
    status?: Booking['status'];
    dateFrom?: string;
    dateTo?: string;
  }): Promise<Booking[] | null> {
    let query = supabase
      .from('bookings')
      .select(`
        *,
        services(
          id,
          title,
          duration_minutes,
          price_from,
          service_type
        )
      `)
      .order('date', { ascending: false })
      .order('time', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.dateFrom) {
      query = query.gte('date', filters.dateFrom);
    }
    if (filters?.dateTo) {
      query = query.lte('date', filters.dateTo);
    }

    return ApiService.handleRequest(
      query,
      'Failed to load bookings'
    );
  }
}