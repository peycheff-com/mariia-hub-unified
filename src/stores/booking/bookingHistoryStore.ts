import { create } from 'zustand';
import { subscribeWithSelector , persist, createJSONStorage } from 'zustand/middleware';

import { logger } from '@/lib/logger';

import {
  HistoryState,
  HistoryActions,
  BookingBaseStore,
  bookingEvents,
} from './bookingTypes';

// History Store - Booking history and reschedule/cancellation logic
export const useBookingHistoryStore = create<HistoryState & HistoryActions>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial state
        bookingHistory: [],
        historyLoading: false,
        historyTotalCount: 0,
        cancellationInProgress: false,
        resourceAllocations: [],
        resourceConflicts: [],

        // Actions
        getBookingHistory: async (options = {}) => {
          const state = get();
          const baseStore = useBookingBaseStore.getState();

          set({ historyLoading: true });

          try {
            logger.info('Fetching booking history', {
              userId: baseStore.currentBooking?.user_id,
              options,
            });

            const { bookingHistoryService } = await import('@/services/bookingHistory.service');
            const result = await bookingHistoryService.getBookingHistory(
              baseStore.currentBooking?.user_id || '',
              options
            );

            set({
              bookingHistory: result.items,
              historyTotalCount: result.totalCount,
              historyLoading: false
            });

            logger.info('Booking history fetched successfully', {
              itemCount: result.items.length,
              totalCount: result.totalCount,
            });

            return result;
          } catch (error) {
            set({
              historyLoading: false
            });

            logger.error('Failed to get booking history', error);

            return {
              items: [],
              totalCount: 0,
              totalPages: 0,
              currentPage: 1,
              hasNextPage: false,
              hasPreviousPage: false
            };
          }
        },

        rebookFromHistory: async (bookingId) => {
          const state = get();
          const baseStore = useBookingBaseStore.getState();

          set({ isCreating: true });

          try {
            logger.info('Rebooking from history', { bookingId });

            const { bookingHistoryService } = await import('@/services/bookingHistory.service');
            const result = await bookingHistoryService.rebookFromHistory(
              bookingId,
              baseStore.currentBooking?.user_id || ''
            );

            if (result.success) {
              // Reset current booking and start new flow
              set({
                isCreating: false,
                // Note: We don't directly manipulate baseStore state here
                // The calling component should handle the reset
              });

              bookingEvents.emit('booking_rebooked', {
                originalBookingId: bookingId,
                newBookingId: result.newBookingId
              });

              logger.info('Rebooking successful', {
                originalBookingId: bookingId,
                newBookingId: result.newBookingId,
              });
            }

            return result;
          } catch (error) {
            set({
              isCreating: false
            });

            logger.error('Failed to rebook from history', error);

            return {
              success: false,
              error: errorMessage
            };
          }
        },

        exportBookingHistory: async (format) => {
          const state = get();
          const baseStore = useBookingBaseStore.getState();

          set({ historyLoading: true });

          try {
            logger.info('Exporting booking history', { format });

            const { bookingHistoryService } = await import('@/services/bookingHistory.service');
            const result = await bookingHistoryService.exportBookingHistory(
              baseStore.currentBooking?.user_id || '',
              { format }
            );

            set({ historyLoading: false });

            if (result.success && result.data) {
              // Download the file
              const url = URL.createObjectURL(result.data);
              const a = document.createElement('a');
              a.href = url;
              a.download = result.filename || `booking-history.${format}`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);

              logger.info('Booking history exported successfully', {
                format,
                filename: result.filename,
              });
            }

            return result;
          } catch (error) {
            set({
              historyLoading: false
            });

            logger.error('Failed to export booking history', error);

            return {
              success: false,
              error: errorMessage
            };
          }
        },

        rescheduleBooking: async (newDate, newTime) => {
          const state = get();
          const baseStore = useBookingBaseStore.getState();

          if (!baseStore.currentBooking?.id) {
            logger.error('Cannot reschedule - no current booking');
            return false;
          }

          try {
            logger.info('Rescheduling booking', {
              bookingId: baseStore.currentBooking.id,
              newDate: newDate.toISOString(),
              newTime,
            });

            const { rescheduleService } = await import('@/services/reschedule.service');
            const result = await rescheduleService.rescheduleBooking({
              bookingId: baseStore.currentBooking.id,
              userId: baseStore.currentBooking.user_id || '',
              newDate,
              newTime,
            });

            if (result.success) {
              bookingEvents.emit('booking_rescheduled', {
                bookingId: baseStore.currentBooking.id,
                newDate,
                newTime,
              });

              logger.info('Booking rescheduled successfully', {
                bookingId: baseStore.currentBooking.id,
                newDate: newDate.toISOString(),
                newTime,
              });

              return true;
            } else {
              logger.error('Failed to reschedule booking', { error: result.error });
              return false;
            }
          } catch (error) {
            logger.error('Failed to reschedule booking', error);
            return false;
          }
        },

        quickReschedule: async (action) => {
          const state = get();
          const baseStore = useBookingBaseStore.getState();

          if (!baseStore.currentBooking?.id) {
            logger.error('Cannot quick reschedule - no current booking');
            return false;
          }

          try {
            logger.info('Quick rescheduling booking', {
              bookingId: baseStore.currentBooking.id,
              action,
            });

            const { rescheduleService } = await import('@/services/reschedule.service');
            const result = await rescheduleService.quickReschedule(
              baseStore.currentBooking.id,
              baseStore.currentBooking.user_id || '',
              action
            );

            if (result.success && result.newDateTime) {
              // Update booking in state
              set((state) => ({
                // Note: We don't directly update baseStore here
                // The component should handle the booking update
              }));

              bookingEvents.emit('booking_quick_rescheduled', {
                bookingId: baseStore.currentBooking.id,
                action,
                newDateTime: result.newDateTime,
              });

              logger.info('Quick reschedule successful', {
                bookingId: baseStore.currentBooking.id,
                action,
                newDateTime: result.newDateTime,
              });

              return true;
            } else {
              logger.error('Failed to quick reschedule booking', { error: result.error });
              return false;
            }
          } catch (error) {
            logger.error('Failed to quick reschedule booking', error);
            return false;
          }
        },

        cancelBooking: async (reason, specialCondition, documentation) => {
          const state = get();
          const baseStore = useBookingBaseStore.getState();

          if (!baseStore.currentBooking?.id) {
            logger.error('Cannot cancel - no current booking');
            return {
              success: false,
              error: 'No booking to cancel'
            };
          }

          set({ cancellationInProgress: true });

          try {
            logger.info('Cancelling booking', {
              bookingId: baseStore.currentBooking.id,
              reason,
              specialCondition,
            });

            const { cancellationPolicyService } = await import('@/services/cancellationPolicy.service');
            const result = await cancellationPolicyService.cancelBooking({
              bookingId: baseStore.currentBooking.id,
              userId: baseStore.currentBooking.user_id || '',
              reason,
              specialCondition,
              documentation,
              autoRefund: true
            });

            if (result.success) {
              // Update booking status
              set((state) => ({
                cancellationInProgress: false
              }));

              bookingEvents.emit('booking_cancelled', {
                bookingId: baseStore.currentBooking!.id,
                refundAmount: result.refundAmount,
                reason
              });

              logger.info('Booking cancelled successfully', {
                bookingId: baseStore.currentBooking.id,
                refundAmount: result.refundAmount,
                reason,
              });

              return {
                success: true,
                refundAmount: result.refundAmount
              };
            } else {
              set({
                cancellationInProgress: false
              });

              logger.error('Cancellation failed', { error: result.error });

              return {
                success: false,
                error: result.error
              };
            }
          } catch (error) {
            set({
              cancellationInProgress: false
            });

            logger.error('Cancellation failed', error);

            return {
              success: false,
              error: errorMessage
            };
          }
        },

        allocateResources: async (bookingId, requirements) => {
          const state = get();
          const baseStore = useBookingBaseStore.getState();

          set({ isCreating: true });

          try {
            logger.info('Allocating resources', {
              bookingId,
              requirementCount: requirements.length,
            });

            const { resourceAllocationService } = await import('@/services/resourceAllocation.service');
            const result = await resourceAllocationService.allocateResources({
              bookingId,
              serviceId: baseStore.selectedService?.id || '',
              startTime: baseStore.selectedTimeSlot?.date || new Date(),
              endTime: new Date((baseStore.selectedTimeSlot?.date || new Date()).getTime() +
                              (baseStore.selectedService?.duration_minutes || 60) * 60 * 1000),
              requirements
            });

            if (result.success) {
              set({
                resourceAllocations: result.allocations || [],
                resourceConflicts: result.conflicts || [],
                isCreating: false
              });

              bookingEvents.emit('resources_allocated', {
                bookingId,
                allocations: result.allocations
              });

              logger.info('Resources allocated successfully', {
                bookingId,
                allocationCount: result.allocations?.length || 0,
                conflictCount: result.conflicts?.length || 0,
              });
            } else {
              set({
                resourceConflicts: result.conflicts || [],
                isCreating: false
              });

              logger.error('Resource allocation failed', { error: result.error });
            }

            return result;
          } catch (error) {
            set({
              isCreating: false
            });

            logger.error('Resource allocation failed', error);

            return {
              success: false,
              error: error instanceof Error ? error.message : 'Resource allocation failed'
            };
          }
        },
      }),
      {
        name: 'booking-history-store',
        storage: createJSONStorage(() => sessionStorage),
        partialize: (state) => ({
          bookingHistory: state.bookingHistory,
          historyTotalCount: state.historyTotalCount,
        }),
        version: 1,
        onRehydrateStorage: () => (state) => {
          logger.info('Booking history store hydrated:', state);
        },
      }
    )
  )
);

// Selectors for optimized re-renders
export const useBookingHistory = () => useBookingHistoryStore((state) => ({
  bookingHistory: state.bookingHistory,
  historyLoading: state.historyLoading,
  historyTotalCount: state.historyTotalCount,
}));

export const useBookingHistoryItems = () => useBookingHistoryStore((state) => state.bookingHistory);
export const useHistoryLoading = () => useBookingHistoryStore((state) => state.historyLoading);
export const useHistoryTotalCount = () => useBookingHistoryStore((state) => state.historyTotalCount);
export const useBookingReschedule = () => useBookingHistoryStore((state) => ({
  rescheduleCount: state.rescheduleCount,
  lastRescheduledAt: state.lastRescheduledAt,
}));
export const useBookingCancellation = () => useBookingHistoryStore((state) => ({
  cancellationInProgress: state.cancellationInProgress,
}));
export const useResourceAllocation = () => useBookingHistoryStore((state) => ({
  resourceAllocations: state.resourceAllocations,
  resourceConflicts: state.resourceConflicts,
}));