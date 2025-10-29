// Main export file for booking stores
// This provides backward compatibility and combines all specialized stores

// Export all stores
export { useBookingBaseStore } from './bookingBaseStore';
export { useBookingGroupStore } from './bookingGroupStore';
export { useBookingPricingStore } from './bookingPricingStore';
export { useBookingCapacityStore } from './bookingCapacityStore';
export { useBookingRealtimeStore } from './bookingRealtimeStore';
export { useBookingCalendarStore } from './bookingCalendarStore';
export { useBookingHistoryStore } from './bookingHistoryStore';

// Export all types
export type {
  BookingStatus,
  ServiceType,
  LocationType,
  TimeSlot,
  Service,
  BookingDetails,
  PaymentDetails,
  Booking,
  BaseBookingState,
  GroupBookingState,
  PricingState,
  CapacityState,
  RealtimeState,
  CalendarState,
  HistoryState,
  BaseBookingActions,
  GroupBookingActions,
  PricingActions,
  CapacityActions,
  RealtimeActions,
  CalendarActions,
  HistoryActions,
  BookingBaseStore,
  BookingGroupStore,
  BookingPricingStore,
  BookingCapacityStore,
  BookingRealtimeStore,
  BookingCalendarStore,
  BookingHistoryStore,
} from './bookingTypes';

// Export event emitter
export { bookingEvents } from './bookingTypes';

// Export all selectors from individual stores
export {
  useBookingService,
  useBookingTimeSlot,
  useBookingDetails,
  useBookingStep,
  useBookingCanProceed,
  useBookingError,
  useBookingIsCreating,
  useCurrentBooking,
  useBookingTotalPrice,
} from './bookingBaseStore';

export {
  useGroupBooking,
  useGroupBookingParticipants,
  useIsGroupBooking,
  useGroupSize,
} from './bookingGroupStore';

export {
  useBookingPricing,
  useOriginalPrice,
  useDiscountAmount,
  useAppliedPricingRules,
  useFinalPrice,
} from './bookingPricingStore';

export {
  useBookingCapacity,
  useBookingWaitlist,
  useWaitlistMode,
  useWaitlistEntry,
  useIsAvailable,
  useRemainingCapacity,
  useAllowsGroupBooking,
} from './bookingCapacityStore';

export {
  useBookingRealtime,
  useIsConnected,
  useSyncStatus,
  useConflictDetected,
  useOptimisticUpdates,
  useBookingSync,
} from './bookingRealtimeStore';

export {
  useBookingCalendar,
  useCalendarView,
  useCalendarDate,
  useAvailableTimeSlots,
  useCalendarLoading,
  useAvailableSlotsForCurrentDate,
  useAvailableSlotsByLocation,
} from './bookingCalendarStore';

export {
  useBookingHistory,
  useBookingHistoryItems,
  useHistoryLoading,
  useHistoryTotalCount,
  useBookingReschedule,
  useBookingCancellation,
  useResourceAllocation,
} from './bookingHistoryStore';

// Import the stores for use in combined functions
import { useBookingBaseStore } from './bookingBaseStore';
import { useBookingGroupStore } from './bookingGroupStore';
import { useBookingPricingStore } from './bookingPricingStore';
import { useBookingCapacityStore } from './bookingCapacityStore';
import { useBookingRealtimeStore } from './bookingRealtimeStore';
import { useBookingCalendarStore } from './bookingCalendarStore';
import { useBookingHistoryStore } from './bookingHistoryStore';

// Combined selectors for convenience
export const useBookingState = () => {
  const baseStore = useBookingBaseStore();
  const groupStore = useBookingGroupStore();
  const pricingStore = useBookingPricingStore();
  const capacityStore = useBookingCapacityStore();
  const realtimeStore = useBookingRealtimeStore();
  const calendarStore = useBookingCalendarStore();
  const historyStore = useBookingHistoryStore();

  return {
    // Base state
    ...baseStore,

    // Group booking state
    isGroupBooking: groupStore.isGroupBooking,
    groupSize: groupStore.groupSize,
    groupParticipants: groupStore.groupParticipants,

    // Pricing state
    originalPrice: pricingStore.originalPrice,
    discountAmount: pricingStore.discountAmount,
    appliedPricingRules: pricingStore.appliedPricingRules,

    // Capacity state
    capacityInfo: capacityStore.capacityInfo,
    waitlistMode: capacityStore.waitlistMode,
    waitlistEntry: capacityStore.waitlistEntry,

    // Realtime state
    isConnected: realtimeStore.isConnected,
    syncStatus: realtimeStore.syncStatus,
    conflictDetected: realtimeStore.conflictDetected,
    optimisticUpdates: realtimeStore.optimisticUpdates,
    lastSyncTime: realtimeStore.lastSyncTime,

    // Calendar state
    calendarView: calendarStore.calendarView,
    calendarDate: calendarStore.calendarDate,
    availableTimeSlots: calendarStore.availableTimeSlots,
    calendarLoading: calendarStore.calendarLoading,

    // History state
    bookingHistory: historyStore.bookingHistory,
    historyLoading: historyStore.historyLoading,
    historyTotalCount: historyStore.historyTotalCount,
    cancellationInProgress: historyStore.cancellationInProgress,
    resourceAllocations: historyStore.resourceAllocations,
    resourceConflicts: historyStore.resourceConflicts,
  };
};

// Combined actions for convenience
export const useBookingActions = () => {
  const baseStore = useBookingBaseStore();
  const groupStore = useBookingGroupStore();
  const pricingStore = useBookingPricingStore();
  const capacityStore = useBookingCapacityStore();
  const realtimeStore = useBookingRealtimeStore();
  const calendarStore = useBookingCalendarStore();
  const historyStore = useBookingHistoryStore();

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

// Utility functions for store management
export const resetAllBookingStores = () => {
  useBookingBaseStore.getState().resetBooking();
  useBookingGroupStore.getState().setGroupBooking(false);
  useBookingPricingStore.getState().applyPricingRules([]);
  useBookingCapacityStore.getState().setWaitlistMode(false);
  useBookingRealtimeStore.getState().disconnectRealtime();
  useBookingCalendarStore.getState().setCalendarView('week');
  // History store doesn't need reset as it's historical data
};

export const connectAllBookingRealtime = () => {
  useBookingRealtimeStore.getState().connectRealtime();
};

export const disconnectAllBookingRealtime = () => {
  useBookingRealtimeStore.getState().disconnectRealtime();
};