import { offlineManager } from '@/lib/offline-manager';
import { supabase } from '@/integrations/supabase/client';
import { log } from '@/lib/logger';

import { Booking, Service, AvailabilitySlot } from '@/types';

export class OfflineBookingService {
  private static instance: OfflineBookingService;

  static getInstance(): OfflineBookingService {
    if (!OfflineBookingService.instance) {
      OfflineBookingService.instance = new OfflineBookingService();
    }
    return OfflineBookingService.instance;
  }

  // Preload essential data for offline use
  async preloadOfflineData(userId?: string): Promise<void> {
    try {
      log.info('Preloading data for offline use...');

      // Cache user's bookings
      if (userId) {
        const { data: bookings, error: bookingsError } = await supabase
          .from('bookings')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!bookingsError && bookings) {
          await offlineManager.cacheBookings(bookings);
        }
      }

      // Cache services
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('active', true);

      if (!servicesError && services) {
        await offlineManager.cacheServices(services);
      }

      // Cache availability for next 7 days
      const today = new Date();
      const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

      const { data: availability, error: availabilityError } = await supabase
        .from('availability_slots')
        .select('*')
        .gte('date', today.toISOString().split('T')[0])
        .lte('date', weekFromNow.toISOString().split('T')[0])
        .eq('available', true);

      if (!availabilityError && availability) {
        await offlineManager.cacheAvailability(availability);
      }

      log.info('Offline data preloaded successfully');
    } catch (error) {
      log.error('Failed to preload offline data:', error);
    }
  }

  // Create booking with offline support
  async createBooking(bookingData: Partial<Booking>): Promise<{ success: boolean; booking?: Booking; queued?: boolean; error?: string }> {
    const isOnline = offlineManager.getConnectionStatus();

    if (!isOnline) {
      // Queue the booking creation for when online
      try {
        await offlineManager.queueAction({
          type: 'create',
          endpoint: '/api/bookings',
          payload: bookingData,
        });

        // Create a temporary booking with local ID for immediate feedback
        const tempBooking: Booking = {
          id: `temp-${Date.now()}`,
          ...bookingData as Booking,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          cached: true,
        };

        await offlineManager.cacheBookings([tempBooking]);

        return { success: true, booking: tempBooking, queued: true };
      } catch (error) {
        log.error('Failed to queue booking creation:', error);
        return { success: false, error: 'Failed to queue booking' };
      }
    }

    // Online: create booking normally
    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert([bookingData])
        .select()
        .single();

      if (error) {
        log.error('Failed to create booking:', error);
        return { success: false, error: error.message };
      }

      // Cache the new booking for offline use
      await offlineManager.cacheBookings([data]);

      return { success: true, booking: data };
    } catch (error) {
      log.error('Error creating booking:', error);
      return { success: false, error: 'Unknown error occurred' };
    }
  }

  // Update booking with offline support
  async updateBooking(
    bookingId: string,
    updates: Partial<Booking>
  ): Promise<{ success: boolean; booking?: Booking; queued?: boolean; error?: string }> {
    const isOnline = offlineManager.getConnectionStatus();

    if (!isOnline) {
      // Queue the update for when online
      try {
        await offlineManager.queueAction({
          type: 'update',
          endpoint: `/api/bookings/${bookingId}`,
          payload: { id: bookingId, ...updates },
        });

        // Update cached booking if it exists
        const cachedBookings = await offlineManager.getCachedBookings();
        const bookingIndex = cachedBookings.findIndex(b => b.id === bookingId);

        if (bookingIndex !== -1) {
          const updatedBooking = { ...cachedBookings[bookingIndex], ...updates };
          cachedBookings[bookingIndex] = updatedBooking;
          await offlineManager.cacheBookings(cachedBookings);

          return { success: true, booking: updatedBooking, queued: true };
        }

        return { success: true, queued: true };
      } catch (error) {
        log.error('Failed to queue booking update:', error);
        return { success: false, error: 'Failed to queue update' };
      }
    }

    // Online: update booking normally
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', bookingId)
        .select()
        .single();

      if (error) {
        log.error('Failed to update booking:', error);
        return { success: false, error: error.message };
      }

      // Update cached booking
      const cachedBookings = await offlineManager.getCachedBookings();
      const bookingIndex = cachedBookings.findIndex(b => b.id === bookingId);

      if (bookingIndex !== -1) {
        cachedBookings[bookingIndex] = data;
        await offlineManager.cacheBookings(cachedBookings);
      }

      return { success: true, booking: data };
    } catch (error) {
      log.error('Error updating booking:', error);
      return { success: false, error: 'Unknown error occurred' };
    }
  }

  // Cancel booking with offline support
  async cancelBooking(bookingId: string): Promise<{ success: boolean; queued?: boolean; error?: string }> {
    const isOnline = offlineManager.getConnectionStatus();

    if (!isOnline) {
      // Queue the cancellation for when online
      try {
        await offlineManager.queueAction({
          type: 'cancel',
          endpoint: `/api/bookings/${bookingId}/cancel`,
          payload: { id: bookingId, status: 'cancelled' },
        });

        // Update cached booking status if it exists
        const cachedBookings = await offlineManager.getCachedBookings();
        const bookingIndex = cachedBookings.findIndex(b => b.id === bookingId);

        if (bookingIndex !== -1) {
          cachedBookings[bookingIndex].status = 'cancelled';
          await offlineManager.cacheBookings(cachedBookings);
        }

        return { success: true, queued: true };
      } catch (error) {
        log.error('Failed to queue booking cancellation:', error);
        return { success: false, error: 'Failed to queue cancellation' };
      }
    }

    // Online: cancel booking normally
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (error) {
        log.error('Failed to cancel booking:', error);
        return { success: false, error: error.message };
      }

      // Update cached booking
      const cachedBookings = await offlineManager.getCachedBookings();
      const bookingIndex = cachedBookings.findIndex(b => b.id === bookingId);

      if (bookingIndex !== -1) {
        cachedBookings[bookingIndex].status = 'cancelled';
        await offlineManager.cacheBookings(cachedBookings);
      }

      return { success: true };
    } catch (error) {
      log.error('Error cancelling booking:', error);
      return { success: false, error: 'Unknown error occurred' };
    }
  }

  // Get bookings with offline fallback
  async getBookings(userId?: string): Promise<Booking[]> {
    const isOnline = offlineManager.getConnectionStatus();

    if (isOnline) {
      try {
        let query = supabase.from('bookings').select('*');

        if (userId) {
          query = query.eq('user_id', userId);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
          log.error('Failed to fetch bookings:', error);
          // Fallback to cached data
          return await offlineManager.getCachedBookings(userId);
        }

        // Cache the fetched bookings for offline use
        if (data) {
          await offlineManager.cacheBookings(data);
        }

        return data || [];
      } catch (error) {
        log.error('Error fetching bookings:', error);
        return await offlineManager.getCachedBookings(userId);
      }
    }

    // Offline: return cached bookings
    return await offlineManager.getCachedBookings(userId);
  }

  // Get services with offline fallback
  async getServices(category?: string): Promise<Service[]> {
    const isOnline = offlineManager.getConnectionStatus();

    if (isOnline) {
      try {
        let query = supabase.from('services').select('*').eq('active', true);

        if (category) {
          query = query.eq('category', category);
        }

        const { data, error } = await query.order('name');

        if (error) {
          log.error('Failed to fetch services:', error);
          // Fallback to cached data
          return await offlineManager.getCachedServices(category);
        }

        // Cache the fetched services for offline use
        if (data) {
          await offlineManager.cacheServices(data);
        }

        return data || [];
      } catch (error) {
        log.error('Error fetching services:', error);
        return await offlineManager.getCachedServices(category);
      }
    }

    // Offline: return cached services
    return await offlineManager.getCachedServices(category);
  }

  // Get availability with offline fallback
  async getAvailability(serviceId?: string, date?: string): Promise<AvailabilitySlot[]> {
    const isOnline = offlineManager.getConnectionStatus();

    if (isOnline) {
      try {
        let query = supabase.from('availability_slots').select('*').eq('available', true);

        if (serviceId) {
          query = query.eq('service_id', serviceId);
        }

        if (date) {
          query = query.gte('date', date).lte('date', date);
        } else {
          // Default to next 7 days
          const today = new Date();
          const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
          query = query
            .gte('date', today.toISOString().split('T')[0])
            .lte('date', weekFromNow.toISOString().split('T')[0]);
        }

        const { data, error } = await query.order('date').order('time');

        if (error) {
          log.error('Failed to fetch availability:', error);
          // Fallback to cached data
          return await offlineManager.getCachedAvailability(serviceId, date);
        }

        // Cache the fetched availability for offline use
        if (data) {
          await offlineManager.cacheAvailability(data);
        }

        return data || [];
      } catch (error) {
        log.error('Error fetching availability:', error);
        return await offlineManager.getCachedAvailability(serviceId, date);
      }
    }

    // Offline: return cached availability
    return await offlineManager.getCachedAvailability(serviceId, date);
  }
}

export const offlineBookingService = OfflineBookingService.getInstance();