import { useMemo } from 'react';

// BACKWARD COMPATIBILITY LAYER
// This file imports from the new specialized booking stores
// to maintain backward compatibility with existing code

// Import all specialized stores and re-export them
export * from './booking/index';

// For direct imports, we also provide the legacy interface
import {
  useBookingState,
  useBookingActions,
  bookingEvents,
  useBookingBaseStore,
  useBookingGroupStore,
  useBookingPricingStore,
  useBookingCapacityStore,
  useBookingRealtimeStore,
  useBookingCalendarStore,
  useBookingHistoryStore,
} from './booking/index';

type BookingState = ReturnType<typeof useBookingState>;
type BookingActions = ReturnType<typeof useBookingActions>;
type BookingStore = BookingState & BookingActions;
type BookingSelector<T> = (store: BookingStore) => T;

const getBookingStateSnapshot = (): BookingState => {
  const baseStore = useBookingBaseStore.getState();
  const groupStore = useBookingGroupStore.getState();
  const pricingStore = useBookingPricingStore.getState();
  const capacityStore = useBookingCapacityStore.getState();
  const realtimeStore = useBookingRealtimeStore.getState();
  const calendarStore = useBookingCalendarStore.getState();
  const historyStore = useBookingHistoryStore.getState();

  return {
    ...baseStore,
    isGroupBooking: groupStore.isGroupBooking,
    groupSize: groupStore.groupSize,
    groupParticipants: groupStore.groupParticipants,
    originalPrice: pricingStore.originalPrice,
    discountAmount: pricingStore.discountAmount,
    appliedPricingRules: pricingStore.appliedPricingRules,
    capacityInfo: capacityStore.capacityInfo,
    waitlistMode: capacityStore.waitlistMode,
    waitlistEntry: capacityStore.waitlistEntry,
    isConnected: realtimeStore.isConnected,
    syncStatus: realtimeStore.syncStatus,
    conflictDetected: realtimeStore.conflictDetected,
    optimisticUpdates: realtimeStore.optimisticUpdates,
    lastSyncTime: realtimeStore.lastSyncTime,
    calendarView: calendarStore.calendarView,
    calendarDate: calendarStore.calendarDate,
    availableTimeSlots: calendarStore.availableTimeSlots,
    calendarLoading: calendarStore.calendarLoading,
    bookingHistory: historyStore.bookingHistory,
    historyLoading: historyStore.historyLoading,
    historyTotalCount: historyStore.historyTotalCount,
    cancellationInProgress: historyStore.cancellationInProgress,
    resourceAllocations: historyStore.resourceAllocations,
    resourceConflicts: historyStore.resourceConflicts,
  };
};

const getBookingActionsSnapshot = (): BookingActions => {
  const baseStore = useBookingBaseStore.getState();
  const groupStore = useBookingGroupStore.getState();
  const pricingStore = useBookingPricingStore.getState();
  const capacityStore = useBookingCapacityStore.getState();
  const realtimeStore = useBookingRealtimeStore.getState();
  const calendarStore = useBookingCalendarStore.getState();
  const historyStore = useBookingHistoryStore.getState();

  return {
    // Base actions
    selectService: baseStore.selectService,
    selectTimeSlot: baseStore.selectTimeSlot,
    updateDetails: baseStore.updateDetails,
    setPaymentDetails: baseStore.setPaymentDetails,
    nextStep: baseStore.nextStep,
    previousStep: baseStore.previousStep,
    resetBooking: baseStore.resetBooking,
    createBooking: baseStore.createBooking,
    updateBookingStatus: baseStore.updateBookingStatus,
    setError: baseStore.setError,
    clearError: baseStore.clearError,

    // Group booking actions
    setGroupBooking: groupStore.setGroupBooking,
    setGroupSize: groupStore.setGroupSize,
    setGroupParticipants: groupStore.setGroupParticipants,
    addGroupParticipant: groupStore.addGroupParticipant,
    removeGroupParticipant: groupStore.removeGroupParticipant,
    updateGroupParticipant: groupStore.updateGroupParticipant,

    // Pricing actions
    applyPricingRules: pricingStore.applyPricingRules,
    calculatePrice: pricingStore.calculatePrice,

    // Capacity actions
    checkCapacity: capacityStore.checkCapacity,
    setWaitlistMode: capacityStore.setWaitlistMode,
    setWaitlistEntry: capacityStore.setWaitlistEntry,
    joinWaitlist: capacityStore.joinWaitlist,

    // Realtime actions
    connectRealtime: realtimeStore.connectRealtime,
    disconnectRealtime: realtimeStore.disconnectRealtime,
    addOptimisticUpdate: realtimeStore.addOptimisticUpdate,
    resolveOptimisticUpdate: realtimeStore.resolveOptimisticUpdate,
    detectConflict: realtimeStore.detectConflict,
    handleRealtimeEvent: realtimeStore.handleRealtimeEvent,
    syncWithServer: realtimeStore.syncWithServer,
    retryFailedUpdates: realtimeStore.retryFailedUpdates,

    // Calendar actions
    setCalendarView: calendarStore.setCalendarView,
    setCalendarDate: calendarStore.setCalendarDate,
    refreshAvailability: calendarStore.refreshAvailability,

    // History actions
    getBookingHistory: historyStore.getBookingHistory,
    rebookFromHistory: historyStore.rebookFromHistory,
    exportBookingHistory: historyStore.exportBookingHistory,
    rescheduleBooking: historyStore.rescheduleBooking,
    quickReschedule: historyStore.quickReschedule,
    cancelBooking: historyStore.cancelBooking,
    allocateResources: historyStore.allocateResources,
  };
};

type UseBookingStoreHook = {
  (): BookingStore;
  <T>(selector: BookingSelector<T>): T;
  getState: () => BookingStore;
};

// Legacy interface for backward compatibility
// Use the new specialized stores directly for new code
export const useBookingStore = ((selector?: BookingSelector<any>) => {
  const state = useBookingState();
  const actions = useBookingActions();
  const store = useMemo<BookingStore>(() => ({ ...state, ...actions }), [state, actions]);

  if (selector) {
    return selector(store);
  }

  return store;
}) as UseBookingStoreHook;

useBookingStore.getState = () => ({
  ...getBookingStateSnapshot(),
  ...getBookingActionsSnapshot(),
});

// Export legacy selectors for backward compatibility
// These now use the specialized stores under the hood
export {
  useBookingService,
  useBookingTimeSlot,
  useBookingDetails,
  useBookingStep,
  useBookingCanProceed,
  useBookingError,
  useBookingIsCreating,
  useCurrentBooking,
  useGroupBooking,
  useBookingPricing,
  useBookingCapacity,
  useBookingWaitlist,
  useBookingReschedule,
  useBookingCancellation,
  useBookingHistory,
  useBookingCalendar,
  useResourceAllocation,
  useBookingRealtime,
  useBookingSync,
} from './booking';

// Re-export booking events for backward compatibility
export { bookingEvents } from './booking';
