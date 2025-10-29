import { create } from 'zustand';
import { subscribeWithSelector , persist, createJSONStorage } from 'zustand/middleware';

import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';

import {
  RealtimeState,
  RealtimeActions,
  Booking,
  BookingBaseStore,
  bookingEvents,
} from './bookingTypes';

// Realtime Store - Real-time sync and optimistic updates
export const useBookingRealtimeStore = create<RealtimeState & RealtimeActions>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial state
        isConnected: false,
        realtimeChannel: null,
        optimisticUpdates: [],
        conflictDetected: false,
        syncStatus: 'synced',
        lastSyncTime: null,

        // Actions
        connectRealtime: () => {
          const state = get();
          const baseStore = useBookingBaseStore.getState();

          if (state.isConnected || state.realtimeChannel) {
            logger.info('Realtime already connected, skipping');
            return;
          }

          try {
            logger.info('Connecting to realtime updates');

            const channel = supabase
              .channel('booking-updates')
              .on(
                'postgres_changes',
                {
                  event: '*',
                  schema: 'public',
                  table: 'bookings',
                  filter: `user_id=eq.${baseStore.currentBooking?.user_id || ''}`,
                },
                (payload) => {
                  state.handleRealtimeEvent(payload);
                }
              )
              .on(
                'postgres_changes',
                {
                  event: '*',
                  schema: 'public',
                  table: 'availability_slots',
                },
                (payload) => {
                  // Handle availability changes
                  if (baseStore.selectedService && baseStore.selectedTimeSlot) {
                    // Import calendar store to refresh availability
                    import('./bookingCalendarStore').then(({ useBookingCalendarStore }) => {
                      const calendarStore = useBookingCalendarStore.getState();
                      calendarStore.refreshAvailability();
                    });
                  }
                }
              )
              .subscribe((status) => {
                set({
                  isConnected: status === 'SUBSCRIBED',
                  syncStatus: status === 'SUBSCRIBED' ? 'synced' : 'syncing',
                });

                if (status === 'SUBSCRIBED') {
                  logger.info('Connected to booking updates');
                } else {
                  logger.info('Realtime subscription status:', status);
                }
              });

            set({ realtimeChannel: channel });
          } catch (error) {
            logger.error('Failed to connect to realtime:', error);
            set({
              syncStatus: 'error',
            });
          }
        },

        disconnectRealtime: () => {
          const state = get();
          if (state.realtimeChannel) {
            supabase.removeChannel(state.realtimeChannel);
            set({
              isConnected: false,
              realtimeChannel: null,
              syncStatus: 'offline',
            });
            logger.info('Disconnected from booking updates');
          }
        },

        addOptimisticUpdate: (type, data) => {
          const id = crypto.randomUUID();
          const update = {
            id,
            type,
            data,
            timestamp: new Date(),
            status: 'pending' as const,
          };

          set((state) => ({
            optimisticUpdates: [...state.optimisticUpdates, update],
            syncStatus: 'syncing',
          }));

          logger.info('Optimistic update added', {
            id,
            type,
            timestamp: update.timestamp.toISOString(),
          });

          return id;
        },

        resolveOptimisticUpdate: (id, success, result) => {
          set((state) => ({
            optimisticUpdates: state.optimisticUpdates.map(update =>
              update.id === id
                ? { ...update, status: success ? 'success' : 'error' as const }
                : update
            ),
            syncStatus: 'synced',
            lastSyncTime: new Date(),
          }));

          logger.info('Optimistic update resolved', {
            id,
            success,
            status: success ? 'success' : 'error',
          });

          // Remove successful updates after a delay
          setTimeout(() => {
            set((state) => ({
              optimisticUpdates: state.optimisticUpdates.filter(
                update => !(update.id === id && update.status === 'success')
              ),
            }));
          }, 3000);
        },

        detectConflict: (booking1, booking2) => {
          if (!booking1.timeSlot || !booking2.timeSlot) return false;

          const start1 = new Date(booking1.timeSlot.date);
          const end1 = new Date(start1.getTime() + (booking1.service.duration_minutes * 60 * 1000));
          const start2 = new Date(booking2.timeSlot.date);
          const end2 = new Date(start2.getTime() + (booking2.service.duration_minutes * 60 * 1000));

          // Check for time overlap
          const timeOverlap = (start1 < end2 && start2 < end1);

          // Check for service/location conflict
          const serviceConflict = booking1.service.id === booking2.service.id;
          const locationConflict = booking1.timeSlot.location === booking2.timeSlot.location;

          const hasConflict = timeOverlap && (serviceConflict || locationConflict);

          if (hasConflict) {
            logger.warn('Booking conflict detected', {
              booking1Id: booking1.id,
              booking2Id: booking2.id,
              timeOverlap,
              serviceConflict,
              locationConflict,
            });
          }

          return hasConflict;
        },

        handleRealtimeEvent: (event) => {
          const { eventType, new: newRecord, old: oldRecord } = event;
          const baseStore = useBookingBaseStore.getState();

          logger.info('Handling realtime event', { eventType, recordId: newRecord?.id || oldRecord?.id });

          switch (eventType) {
            case 'INSERT':
              // Handle new booking
              if (newRecord.user_id === baseStore.currentBooking?.user_id) {
                set((state) => {
                  // Check for conflicts
                  const conflict = baseStore.currentBooking &&
                                  baseStore.selectedService &&
                                  baseStore.selectedTimeSlot &&
                    state.detectConflict(
                      { ...baseStore.currentBooking, timeSlot: baseStore.selectedTimeSlot, service: baseStore.selectedService },
                      newRecord
                    );

                  return {
                    conflictDetected: !!conflict,
                    // Update current booking if it matches
                    ...(baseStore.currentBooking?.id === newRecord.id && {
                      currentBooking: { ...baseStore.currentBooking, ...newRecord }
                    }),
                  };
                });

                if (eventType === 'INSERT') {
                  bookingEvents.emit('booking_created_realtime', newRecord);
                }
              }
              break;

            case 'UPDATE':
              // Handle booking updates
              if (oldRecord?.id === baseStore.currentBooking?.id) {
                set((state) => ({
                  currentBooking: baseStore.currentBooking ? { ...baseStore.currentBooking, ...newRecord } : null,
                }));

                bookingEvents.emit('booking_updated_realtime', {
                  bookingId: newRecord.id,
                  changes: newRecord,
                });
              }
              break;

            case 'DELETE':
              // Handle booking deletions
              if (oldRecord?.id === baseStore.currentBooking?.id) {
                set({ currentBooking: null });
                bookingEvents.emit('booking_deleted_realtime', { bookingId: oldRecord.id });
              }
              break;

            default:
              logger.warn('Unknown realtime event type:', eventType);
          }
        },

        syncWithServer: async () => {
          const state = get();
          const baseStore = useBookingBaseStore.getState();

          if (state.syncStatus === 'syncing') {
            logger.info('Sync already in progress, skipping');
            return;
          }

          set({ syncStatus: 'syncing' });
          logger.info('Starting server sync', { pendingUpdates: state.optimisticUpdates.filter(u => u.status === 'pending').length });

          try {
            // Sync pending optimistic updates
            const pendingUpdates = state.optimisticUpdates.filter(u => u.status === 'pending');

            for (const update of pendingUpdates) {
              try {
                let result;
                switch (update.type) {
                  case 'create':
                    result = await baseStore.createBooking();
                    break;
                  case 'update':
                    result = await baseStore.updateBookingStatus(update.data.status);
                    break;
                  case 'delete':
                    // Handle deletion if needed
                    break;
                }

                state.resolveOptimisticUpdate(update.id, true, result);
              } catch (error) {
                state.resolveOptimisticUpdate(update.id, false);
                logger.error('Failed to sync optimistic update:', { updateId: update.id, error });
              }
            }

            set({
              syncStatus: 'synced',
              lastSyncTime: new Date(),
            });

            logger.info('Server sync completed successfully');
          } catch (error) {
            set({
              syncStatus: 'error',
            });
            logger.error('Sync failed:', error);
          }
        },

        retryFailedUpdates: async () => {
          const state = get();
          const failedUpdates = state.optimisticUpdates.filter(u => u.status === 'error');

          logger.info('Retrying failed updates', { count: failedUpdates.length });

          for (const update of failedUpdates) {
            // Reset to pending and retry
            set((state) => ({
              optimisticUpdates: state.optimisticUpdates.map(u =>
                u.id === update.id ? { ...u, status: 'pending' as const } : u
              ),
            }));

            try {
              await state.syncWithServer();
            } catch (error) {
              logger.error('Retry failed for update:', { updateId: update.id, error });
            }
          }
        },
      }),
      {
        name: 'booking-realtime-store',
        storage: createJSONStorage(() => sessionStorage),
        partialize: (state) => ({
          optimisticUpdates: state.optimisticUpdates.filter(u => u.status === 'pending'),
          syncStatus: state.syncStatus,
          lastSyncTime: state.lastSyncTime,
        }),
        version: 1,
        onRehydrateStorage: () => (state) => {
          logger.info('Booking realtime store hydrated:', state);
        },
      }
    )
  )
);

// Selectors for optimized re-renders
export const useBookingRealtime = () => useBookingRealtimeStore((state) => ({
  isConnected: state.isConnected,
  syncStatus: state.syncStatus,
  conflictDetected: state.conflictDetected,
  optimisticUpdates: state.optimisticUpdates,
  lastSyncTime: state.lastSyncTime,
}));

export const useIsConnected = () => useBookingRealtimeStore((state) => state.isConnected);
export const useSyncStatus = () => useBookingRealtimeStore((state) => state.syncStatus);
export const useConflictDetected = () => useBookingRealtimeStore((state) => state.conflictDetected);
export const useOptimisticUpdates = () => useBookingRealtimeStore((state) => state.optimisticUpdates);
export const useBookingSync = () => useBookingRealtimeStore((state) => ({
  connectRealtime: state.connectRealtime,
  disconnectRealtime: state.disconnectRealtime,
  syncWithServer: state.syncWithServer,
  retryFailedUpdates: state.retryFailedUpdates,
}));