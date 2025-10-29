import { create } from 'zustand';
import { subscribeWithSelector , persist, createJSONStorage } from 'zustand/middleware';

import { logger } from '@/lib/logger';

import {
  GroupBookingState,
  GroupBookingActions,
} from './bookingTypes';

// Group Booking Store - Group booking functionality
export const useBookingGroupStore = create<GroupBookingState & GroupBookingActions>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial state
        isGroupBooking: false,
        groupSize: 1,
        groupParticipants: [],

        // Actions
        setGroupBooking: (isGroup: boolean) => {
          set((state) => ({
            isGroupBooking: isGroup,
            groupSize: isGroup ? Math.max(state.groupSize, 2) : 1,
            error: null,
          }));

          // Note: selectedTimeSlot reset should be handled by the component using both stores
          logger.info('Group booking mode changed', { isGroup, groupSize: get().groupSize });
        },

        setGroupSize: (size: number) => {
          const validatedSize = Math.max(1, size);
          set((state) => ({
            groupSize: validatedSize,
            error: null,
          }));

          // Note: selectedTimeSlot reset should be handled by the component using both stores
          logger.info('Group size set', { groupSize: validatedSize });
        },

        setGroupParticipants: (participants) => {
          set((state) => ({
            groupParticipants: participants,
            groupSize: participants.length,
            error: null,
          }));

          logger.info('Group participants set', { participantCount: participants.length });
        },

        addGroupParticipant: (participant) => {
          set((state) => {
            const newParticipants = [...state.groupParticipants, participant];
            return {
              groupParticipants: newParticipants,
              groupSize: newParticipants.length,
              error: null,
            };
          });

          logger.info('Group participant added', {
            participantName: `${participant.first_name} ${participant.last_name}`,
            totalParticipants: get().groupParticipants.length,
          });
        },

        removeGroupParticipant: (index) => {
          set((state) => {
            const newParticipants = state.groupParticipants.filter((_, i) => i !== index);
            const participant = state.groupParticipants[index];

            logger.info('Group participant removed', {
              participantName: participant ? `${participant.first_name} ${participant.last_name}` : 'Unknown',
              removedIndex: index,
              remainingParticipants: newParticipants.length,
            });

            return {
              groupParticipants: newParticipants,
              groupSize: Math.max(1, newParticipants.length),
              error: null,
            };
          });
        },

        updateGroupParticipant: (index, participant) => {
          set((state) => {
            const newParticipants = [...state.groupParticipants];
            const existingParticipant = newParticipants[index];

            if (existingParticipant) {
              newParticipants[index] = { ...existingParticipant, ...participant };

              logger.info('Group participant updated', {
                participantName: `${existingParticipant.first_name} ${existingParticipant.last_name}`,
                updatedFields: Object.keys(participant),
              });
            }

            return {
              groupParticipants: newParticipants,
              error: null,
            };
          });
        },
      }),
      {
        name: 'booking-group-store',
        storage: createJSONStorage(() => sessionStorage),
        partialize: (state) => ({
          isGroupBooking: state.isGroupBooking,
          groupSize: state.groupSize,
          groupParticipants: state.groupParticipants,
        }),
        version: 1,
        onRehydrateStorage: () => (state) => {
          logger.info('Booking group store hydrated:', state);
        },
      }
    )
  )
);

// Selectors for optimized re-renders
export const useGroupBooking = () => useBookingGroupStore((state) => ({
  isGroupBooking: state.isGroupBooking,
  groupSize: state.groupSize,
  groupParticipants: state.groupParticipants,
}));

export const useGroupBookingParticipants = () => useBookingGroupStore((state) => state.groupParticipants);
export const useIsGroupBooking = () => useBookingGroupStore((state) => state.isGroupBooking);
export const useGroupSize = () => useBookingGroupStore((state) => state.groupSize);