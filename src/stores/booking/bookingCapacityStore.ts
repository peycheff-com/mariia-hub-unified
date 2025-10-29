import { create } from 'zustand';
import { subscribeWithSelector , persist, createJSONStorage } from 'zustand/middleware';

import { logger } from '@/lib/logger';

import {
  CapacityState,
  CapacityActions,
  BookingBaseStore,
  GroupBookingStore,
} from './bookingTypes';

// Capacity Store - Capacity management and waitlist functionality
export const useBookingCapacityStore = create<CapacityState & CapacityActions>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial state
        capacityInfo: null,
        waitlistMode: false,
        waitlistEntry: null,

        // Actions
        checkCapacity: async (serviceId, date, time, groupSize = 1) => {
          try {
            logger.info('Checking capacity', {
              serviceId,
              date: date.toISOString(),
              time,
              groupSize,
            });

            const { supabase } = await import('@/integrations/supabase/client');
            const { data, error } = await supabase.rpc('check_slot_availability_with_capacity', {
              p_service_id: serviceId,
              p_booking_date: date.toISOString().split('T')[0],
              p_booking_time: time,
              p_duration_minutes: 60, // Would get from service
              p_group_size: groupSize,
            });

            if (error || !data || data.length === 0) {
              set({
                capacityInfo: null,
              });
              logger.error('Capacity check failed', { error, serviceId, date, time });
              return;
            }

            const result = data[0];
            const capacityInfo = {
              available: result.available,
              remainingCapacity: result.remaining_capacity,
              allowsGroups: true, // Would get from availability table
              maxGroupSize: 10, // Would get from service or availability
            };

            set({
              capacityInfo,
            });

            logger.info('Capacity check completed', {
              available: capacityInfo.available,
              remainingCapacity: capacityInfo.remainingCapacity,
              allowsGroups: capacityInfo.allowsGroups,
              maxGroupSize: capacityInfo.maxGroupSize,
            });
          } catch (error) {
            logger.error('Capacity check exception', error);
          }
        },

        setWaitlistMode: (enabled) => {
          set({ waitlistMode: enabled });
          logger.info('Waitlist mode changed', { enabled });
        },

        setWaitlistEntry: (entry) => {
          set({
            waitlistEntry: entry,
          });
          logger.info('Waitlist entry set', {
            serviceId: entry.serviceId,
            preferredDate: entry.preferredDate.toISOString(),
            preferredTime: entry.preferredTime,
            flexibleWithTime: entry.flexibleWithTime,
          });
        },

        joinWaitlist: async () => {
          const state = get();
          const baseStore = useBookingBaseStore.getState();
          const groupStore = useBookingGroupStore.getState();

          if (!state.waitlistEntry || !baseStore.selectedService) {
            logger.error('Cannot join waitlist - missing information', {
              hasWaitlistEntry: !!state.waitlistEntry,
              hasSelectedService: !!baseStore.selectedService,
            });
            return;
          }

          try {
            logger.info('Joining waitlist', {
              serviceId: baseStore.selectedService.id,
              preferredDate: state.waitlistEntry.preferredDate.toISOString(),
              preferredTime: state.waitlistEntry.preferredTime,
              groupSize: groupStore.groupSize,
            });

            const { waitlistService } = await import('@/services/waitlist.service');
            await waitlistService.addToWaitlist({
              serviceId: baseStore.selectedService.id,
              preferredDate: state.waitlistEntry.preferredDate,
              preferredTime: state.waitlistEntry.preferredTime,
              locationType: 'studio',
              groupSize: groupStore.groupSize,
              flexibleWithTime: state.waitlistEntry.flexibleWithTime,
              flexibleWithLocation: false,
              contactEmail: state.waitlistEntry.contactEmail,
              contactPhone: state.waitlistEntry.contactPhone,
              autoPromoteEligible: true,
              maxPromotionAttempts: 3,
            });

            set({
              waitlistMode: false,
              waitlistEntry: null,
            });

            logger.info('Successfully joined waitlist', {
              serviceId: baseStore.selectedService.id,
              contactEmail: state.waitlistEntry.contactEmail,
            });
          } catch (error) {
            logger.error('Failed to join waitlist', error);
          }
        },
      }),
      {
        name: 'booking-capacity-store',
        storage: createJSONStorage(() => sessionStorage),
        partialize: (state) => ({
          waitlistMode: state.waitlistMode,
          waitlistEntry: state.waitlistEntry,
        }),
        version: 1,
        onRehydrateStorage: () => (state) => {
          logger.info('Booking capacity store hydrated:', state);
        },
      }
    )
  )
);

// Selectors for optimized re-renders
export const useBookingCapacity = () => useBookingCapacityStore((state) => state.capacityInfo);
export const useBookingWaitlist = () => useBookingCapacityStore((state) => ({
  waitlistMode: state.waitlistMode,
  waitlistEntry: state.waitlistEntry,
}));
export const useWaitlistMode = () => useBookingCapacityStore((state) => state.waitlistMode);
export const useWaitlistEntry = () => useBookingCapacityStore((state) => state.waitlistEntry);

// Computed selector for capacity availability
export const useIsAvailable = () => {
  const capacityInfo = useBookingCapacity();
  return capacityInfo?.available ?? false;
};

// Computed selector for remaining capacity
export const useRemainingCapacity = () => {
  const capacityInfo = useBookingCapacity();
  return capacityInfo?.remainingCapacity ?? 0;
};

// Computed selector for group booking availability
export const useAllowsGroupBooking = () => {
  const capacityInfo = useBookingCapacity();
  return capacityInfo?.allowsGroups ?? false;
};