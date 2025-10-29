import { create } from 'zustand';
import { subscribeWithSelector , persist, createJSONStorage } from 'zustand/middleware';

import { logger } from '@/lib/logger';

import {
  CalendarState,
  CalendarActions,
  BookingBaseStore,
  TimeSlot,
} from './bookingTypes';

// Calendar Store - Calendar and availability management
export const useBookingCalendarStore = create<CalendarState & CalendarActions>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial state
        calendarView: 'week',
        calendarDate: new Date(),
        availableTimeSlots: [],
        calendarLoading: false,

        // Actions
        setCalendarView: (view) => {
          set({ calendarView: view });
          logger.info('Calendar view changed', { view });
        },

        setCalendarDate: (date) => {
          set({ calendarDate: date });
          logger.info('Calendar date changed', { date: date.toISOString() });
        },

        refreshAvailability: async () => {
          const state = get();
          const baseStore = useBookingBaseStore.getState();

          if (!baseStore.selectedService) {
            logger.warn('Cannot refresh availability - no service selected');
            return;
          }

          set({ calendarLoading: true });

          try {
            logger.info('Refreshing availability', {
              serviceId: baseStore.selectedService.id,
              calendarView: state.calendarView,
              calendarDate: state.calendarDate.toISOString(),
            });

            // Load availability for current calendar date and view
            const { supabase } = await import('@/integrations/supabase/client');

            // Helper function to get date range
            const getDateRangeForView = (date: Date, view: 'day' | 'week' | 'month') => {
              switch (view) {
                case 'day':
                  return {
                    start: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
                    end: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59)
                  };
                case 'week':
                  const startOfWeek = new Date(date);
                  startOfWeek.setDate(date.getDate() - date.getDay() + 1);
                  const endOfWeek = new Date(startOfWeek);
                  endOfWeek.setDate(startOfWeek.getDate() + 6);
                  return { start: startOfWeek, end: endOfWeek };
                case 'month':
                  return {
                    start: new Date(date.getFullYear(), date.getMonth(), 1),
                    end: new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59)
                  };
              }
            };

            const dateRange = getDateRangeForView(state.calendarDate, state.calendarView);

            const { data, error } = await supabase
              .from('availability_slots')
              .select('*')
              .eq('service_id', baseStore.selectedService.id)
              .gte('slot_date', dateRange.start.toISOString().split('T')[0])
              .lte('slot_date', dateRange.end.toISOString().split('T')[0])
              .eq('is_available', true)
              .order('slot_date', { ascending: true })
              .order('start_time', { ascending: true });

            if (error) throw error;

            // Transform availability data
            const timeSlots: TimeSlot[] = (data || []).map(slot => ({
              id: slot.id,
              date: new Date(slot.slot_date),
              time: slot.start_time,
              available: slot.is_available,
              location: slot.location_type,
              capacity: slot.max_capacity,
              currentBookings: 0,
              remainingCapacity: slot.max_capacity,
              allowsGroups: slot.allows_groups,
              maxGroupSize: slot.max_group_size || 10
            }));

            set({
              availableTimeSlots: timeSlots,
              calendarLoading: false
            });

            logger.info('Availability refreshed successfully', {
              slotsFound: timeSlots.length,
              dateRange: {
                start: dateRange.start.toISOString(),
                end: dateRange.end.toISOString(),
              },
            });
          } catch (error) {
            set({
              calendarLoading: false
            });
            logger.error('Failed to refresh availability', error);
          }
        },
      }),
      {
        name: 'booking-calendar-store',
        storage: createJSONStorage(() => sessionStorage),
        partialize: (state) => ({
          calendarView: state.calendarView,
          calendarDate: state.calendarDate,
        }),
        version: 1,
        onRehydrateStorage: () => (state) => {
          logger.info('Booking calendar store hydrated:', state);
        },
      }
    )
  )
);

// Selectors for optimized re-renders
export const useBookingCalendar = () => useBookingCalendarStore((state) => ({
  calendarView: state.calendarView,
  calendarDate: state.calendarDate,
  availableTimeSlots: state.availableTimeSlots,
  calendarLoading: state.calendarLoading,
}));

export const useCalendarView = () => useBookingCalendarStore((state) => state.calendarView);
export const useCalendarDate = () => useBookingCalendarStore((state) => state.calendarDate);
export const useAvailableTimeSlots = () => useBookingCalendarStore((state) => state.availableTimeSlots);
export const useCalendarLoading = () => useBookingCalendarStore((state) => state.calendarLoading);

// Computed selector for available slots on current date
export const useAvailableSlotsForCurrentDate = () => {
  const calendarDate = useCalendarDate();
  const availableTimeSlots = useAvailableTimeSlots();

  return availableTimeSlots.filter(slot => {
    const slotDate = new Date(slot.date);
    return slotDate.toDateString() === calendarDate.toDateString();
  });
};

// Computed selector for available slots by location
export const useAvailableSlotsByLocation = (location?: string) => {
  const availableTimeSlots = useAvailableTimeSlots();

  if (!location) return availableTimeSlots;

  return availableTimeSlots.filter(slot => slot.location === location);
};