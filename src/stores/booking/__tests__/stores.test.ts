// Test file to verify booking stores work correctly

import { describe, it, expect, beforeEach } from 'vitest';

import {
  useBookingBaseStore,
  useBookingGroupStore,
  useBookingPricingStore,
  useBookingCapacityStore,
  useBookingRealtimeStore,
  useBookingCalendarStore,
  useBookingHistoryStore,
} from '../index';

describe('Booking Stores', () => {
  beforeEach(() => {
    // Reset all stores before each test
    useBookingBaseStore.getState().resetBooking();
    useBookingGroupStore.getState().setGroupBooking(false);
    useBookingPricingStore.getState().applyPricingRules([]);
  });

  describe('Base Store', () => {
    it('should initialize with default values', () => {
      const store = useBookingBaseStore.getState();
      expect(store.currentBooking).toBe(null);
      expect(store.selectedService).toBe(null);
      expect(store.selectedTimeSlot).toBe(null);
      expect(store.isCreating).toBe(false);
      expect(store.error).toBe(null);
      expect(store.step).toBe(1);
      expect(store.canProceed).toBe(false);
    });

    it('should handle service selection', () => {
      const store = useBookingBaseStore.getState();
      const mockService = {
        id: 'test-service',
        title: 'Test Service',
        slug: 'test-service',
        service_type: 'beauty' as const,
        price_from: 100,
        duration_minutes: 60,
      };

      store.selectService(mockService);

      const updatedState = useBookingBaseStore.getState();
      expect(updatedState.selectedService).toEqual(mockService);
    });
  });

  describe('Group Store', () => {
    it('should initialize with default group values', () => {
      const store = useBookingGroupStore.getState();
      expect(store.isGroupBooking).toBe(false);
      expect(store.groupSize).toBe(1);
      expect(store.groupParticipants).toEqual([]);
    });

    it('should handle group booking mode', () => {
      const store = useBookingGroupStore.getState();

      store.setGroupBooking(true);
      const stateAfterGroup = useBookingGroupStore.getState();
      expect(stateAfterGroup.isGroupBooking).toBe(true);
      expect(stateAfterGroup.groupSize).toBe(2);

      store.setGroupSize(3);
      const stateAfterSize = useBookingGroupStore.getState();
      expect(stateAfterSize.groupSize).toBe(3);
    });
  });

  describe('Pricing Store', () => {
    it('should initialize with default pricing values', () => {
      const store = useBookingPricingStore.getState();
      expect(store.originalPrice).toBe(0);
      expect(store.discountAmount).toBe(0);
      expect(store.appliedPricingRules).toEqual([]);
    });

    it('should apply pricing rules', () => {
      const store = useBookingPricingStore.getState();
      const rules = [
        { rule_id: 'rule1', rule_type: 'discount', applied_amount: 10 },
        { rule_id: 'rule2', rule_type: 'special', applied_amount: 5 },
      ];

      store.applyPricingRules(rules);

      const updatedState = useBookingPricingStore.getState();
      expect(updatedState.appliedPricingRules).toEqual(rules);
      expect(updatedState.discountAmount).toBe(15);
    });
  });

  describe('Capacity Store', () => {
    it('should initialize with default capacity values', () => {
      const store = useBookingCapacityStore.getState();
      expect(store.capacityInfo).toBe(null);
      expect(store.waitlistMode).toBe(false);
      expect(store.waitlistEntry).toBe(null);
    });

    it('should handle waitlist mode', () => {
      const store = useBookingCapacityStore.getState();

      store.setWaitlistMode(true);
      expect(store.waitlistMode).toBe(true);
    });
  });

  describe('Realtime Store', () => {
    it('should initialize with default realtime values', () => {
      const store = useBookingRealtimeStore.getState();
      expect(store.isConnected).toBe(false);
      expect(store.syncStatus).toBe('synced');
      expect(store.conflictDetected).toBe(false);
      expect(store.optimisticUpdates).toEqual([]);
    });
  });

  describe('Calendar Store', () => {
    it('should initialize with default calendar values', () => {
      const store = useBookingCalendarStore.getState();
      expect(store.calendarView).toBe('week');
      expect(store.availableTimeSlots).toEqual([]);
      expect(store.calendarLoading).toBe(false);
    });

    it('should handle calendar view changes', () => {
      const store = useBookingCalendarStore.getState();

      store.setCalendarView('day');
      const stateAfterDay = useBookingCalendarStore.getState();
      expect(stateAfterDay.calendarView).toBe('day');

      store.setCalendarView('month');
      const stateAfterMonth = useBookingCalendarStore.getState();
      expect(stateAfterMonth.calendarView).toBe('month');
    });
  });

  describe('History Store', () => {
    it('should initialize with default history values', () => {
      const store = useBookingHistoryStore.getState();
      expect(store.bookingHistory).toEqual([]);
      expect(store.historyLoading).toBe(false);
      expect(store.historyTotalCount).toBe(0);
      expect(store.cancellationInProgress).toBe(false);
    });
  });

  describe('Backward Compatibility', () => {
    it('should provide combined state access', () => {
      // Test that the combined hooks work
      expect(typeof useBookingBaseStore).toBe('function');
      expect(typeof useBookingGroupStore).toBe('function');
      expect(typeof useBookingPricingStore).toBe('function');
      expect(typeof useBookingCapacityStore).toBe('function');
      expect(typeof useBookingRealtimeStore).toBe('function');
      expect(typeof useBookingCalendarStore).toBe('function');
      expect(typeof useBookingHistoryStore).toBe('function');
    });
  });

  describe('Integration', () => {
    it('should work across multiple stores', () => {
      const baseStore = useBookingBaseStore.getState();
      const groupStore = useBookingGroupStore.getState();
      const pricingStore = useBookingPricingStore.getState();

      // Set up a booking
      const mockService = {
        id: 'integration-test',
        title: 'Integration Test',
        slug: 'integration-test',
        service_type: 'fitness' as const,
        price_from: 150,
        duration_minutes: 45,
      };

      baseStore.selectService(mockService);
      groupStore.setGroupBooking(true);
      groupStore.setGroupSize(3);

      // Apply some pricing
      pricingStore.applyPricingRules([
        { rule_id: 'group-discount', rule_type: 'group', applied_amount: 20 }
      ]);

      // Verify all stores are updated
      expect(useBookingBaseStore.getState().selectedService?.id).toBe('integration-test');
      expect(useBookingGroupStore.getState().isGroupBooking).toBe(true);
      expect(useBookingGroupStore.getState().groupSize).toBe(3);
      expect(useBookingPricingStore.getState().discountAmount).toBe(20);
    });
  });
});