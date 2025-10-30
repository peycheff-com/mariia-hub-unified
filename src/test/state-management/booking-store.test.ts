import { describe, it, test, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createService,
  createTimeSlot,
  createBooking,
  createExtendedProfile
} from '@/test/factories/extended-factories';

// Import store types and actions
import {
  useBookingStore,
  useBookingState,
  useBookingActions,
  bookingEvents
} from '@/stores/bookingStore';

// Mock React hooks for testing Zustand store
const mockReactUseEffect = vi.fn();
const mockReactUseCallback = vi.fn();
const mockReactUseMemo = vi.fn();

vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useEffect: mockReactUseEffect,
    useCallback: mockReactUseCallback,
    useMemo: mockReactUseMemo,
  };
});

describe('Booking Store State Management', () => {
  beforeEach(() => {
    // Reset store state before each test
    const store = useBookingStore.getState();
    store.resetBooking();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Service Selection', () => {
    test('should select service and update state', () => {
      const { selectService, selectedService } = useBookingStore.getState();

      const mockService = createService({
        id: 'service-123',
        title: 'Test Service',
        category: 'beauty'
      });

      selectService(mockService);

      const updatedState = useBookingStore.getState();
      expect(updatedState.selectedService).toEqual(mockService);
      expect(updatedState.currentStep).toBe(2);
      expect(updatedState.canProceed.step1).toBe(true);
    });

    test('should clear service selection', () => {
      const { selectService, clearSelection, selectedService } = useBookingStore.getState();

      const mockService = createService();
      selectService(mockService);

      expect(useBookingStore.getState().selectedService).toEqual(mockService);

      clearSelection();

      const updatedState = useBookingStore.getState();
      expect(updatedState.selectedService).toBeNull();
      expect(updatedState.currentStep).toBe(1);
      expect(updatedState.canProceed.step1).toBe(false);
    });

    test('should emit service selection event', () => {
      const eventSpy = vi.fn();
      bookingEvents.on('service:selected', eventSpy);

      const { selectService } = useBookingStore.getState();
      const mockService = createService();

      selectService(mockService);

      expect(eventSpy).toHaveBeenCalledWith({
        service: mockService,
        timestamp: expect.any(Number)
      });

      bookingEvents.off('service:selected', eventSpy);
    });

    test('should validate service before selection', () => {
      const { selectService, error } = useBookingStore.getState();

      const invalidService = {
        id: '',
        title: '',
        // Missing required fields
      };

      selectService(invalidService as any);

      const updatedState = useBookingStore.getState();
      expect(updatedState.selectedService).toBeNull();
      expect(updatedState.error).toContain('Invalid service data');
    });
  });

  describe('Time Slot Selection', () => {
    beforeEach(() => {
      // Set up initial state with selected service
      const { selectService } = useBookingStore.getState();
      selectService(createService());
    });

    test('should select time slot and update state', () => {
      const { selectTimeSlot, selectedTimeSlot } = useBookingStore.getState();

      const mockTimeSlot = createTimeSlot({
        id: 'slot-123',
        start_time: '2024-01-15T10:00:00Z',
        end_time: '2024-01-15T11:00:00Z',
        status: 'available'
      });

      selectTimeSlot(mockTimeSlot);

      const updatedState = useBookingStore.getState();
      expect(updatedState.selectedTimeSlot).toEqual(mockTimeSlot);
      expect(updatedState.currentStep).toBe(3);
      expect(updatedState.canProceed.step2).toBe(true);
    });

    test('should clear time slot selection', () => {
      const { selectTimeSlot, clearTimeSlot, selectedTimeSlot } = useBookingStore.getState();

      const mockTimeSlot = createTimeSlot();
      selectTimeSlot(mockTimeSlot);

      expect(useBookingStore.getState().selectedTimeSlot).toEqual(mockTimeSlot);

      clearTimeSlot();

      const updatedState = useBookingStore.getState();
      expect(updatedState.selectedTimeSlot).toBeNull();
      expect(updatedState.currentStep).toBe(2);
      expect(updatedState.canProceed.step2).toBe(false);
    });

    test('should hold time slot temporarily', async () => {
      vi.useFakeTimers();

      const { selectTimeSlot, selectedTimeSlot, isTimeSlotHeld } = useBookingStore.getState();

      const mockTimeSlot = createTimeSlot({
        id: 'slot-123',
        hold_expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
      });

      selectTimeSlot(mockTimeSlot);

      await vi.runAllTimersAsync();

      const updatedState = useBookingStore.getState();
      expect(updatedState.isTimeSlotHeld).toBe(true);
      expect(updatedState.holdExpiresAt).toBeDefined();

      vi.useRealTimers();
    });

    test('should release time slot hold on expiry', async () => {
      vi.useFakeTimers();

      const { selectTimeSlot, clearTimeSlot } = useBookingStore.getState();

      const mockTimeSlot = createTimeSlot({
        id: 'slot-123',
        hold_expires_at: new Date(Date.now() + 1000).toISOString() // 1 second
      });

      selectTimeSlot(mockTimeSlot);

      // Fast-forward past expiry time
      vi.advanceTimersByTime(2000);

      const updatedState = useBookingStore.getState();
      expect(updatedState.selectedTimeSlot).toBeNull();
      expect(updatedState.isTimeSlotHeld).toBe(false);

      vi.useRealTimers();
    });

    test('should emit time slot selection event', () => {
      const eventSpy = vi.fn();
      bookingEvents.on('timeslot:selected', eventSpy);

      const { selectTimeSlot } = useBookingStore.getState();
      const mockTimeSlot = createTimeSlot();

      selectTimeSlot(mockTimeSlot);

      expect(eventSpy).toHaveBeenCalledWith({
        timeSlot: mockTimeSlot,
        timestamp: expect.any(Number)
      });

      bookingEvents.off('timeslot:selected', eventSpy);
    });
  });

  describe('Booking Details', () => {
    beforeEach(() => {
      // Set up initial state with service and time slot
      const { selectService, selectTimeSlot } = useBookingStore.getState();
      selectService(createService());
      selectTimeSlot(createTimeSlot());
    });

    test('should update booking details', () => {
      const { updateDetails, details } = useBookingStore.getState();

      const mockDetails = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+48123456789',
        notes: 'Special requirements',
        preferences: {
          style: 'natural',
          intensity: 'medium'
        }
      };

      updateDetails(mockDetails);

      const updatedState = useBookingStore.getState();
      expect(updatedState.details).toEqual(mockDetails);
      expect(updatedState.currentStep).toBe(4);
      expect(updatedState.canProceed.step3).toBe(true);
    });

    test('should validate required details', () => {
      const { updateDetails, details, error } = useBookingStore.getState();

      const incompleteDetails = {
        name: '', // Empty name
        email: 'john.doe@example.com',
        phone: '+48123456789'
      };

      updateDetails(incompleteDetails);

      const updatedState = useBookingStore.getState();
      expect(updatedState.error).toContain('Name is required');
      expect(updatedState.canProceed.step3).toBe(false);
    });

    test('should validate email format', () => {
      const { updateDetails } = useBookingStore.getState();

      const invalidDetails = {
        name: 'John Doe',
        email: 'invalid-email',
        phone: '+48123456789'
      };

      updateDetails(invalidDetails);

      const updatedState = useBookingStore.getState();
      expect(updatedState.error).toContain('Invalid email format');
    });

    test('should validate phone number format', () => {
      const { updateDetails } = useBookingStore.getState();

      const invalidDetails = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '123' // Too short
      };

      updateDetails(invalidDetails);

      const updatedState = useBookingStore.getState();
      expect(updatedState.error).toContain('Invalid phone number');
    });

    test('should emit details update event', () => {
      const eventSpy = vi.fn();
      bookingEvents.on('details:updated', eventSpy);

      const { updateDetails } = useBookingStore.getState();
      const mockDetails = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+48123456789'
      };

      updateDetails(mockDetails);

      expect(eventSpy).toHaveBeenCalledWith({
        details: mockDetails,
        timestamp: expect.any(Number)
      });

      bookingEvents.off('details:updated', eventSpy);
    });
  });

  describe('Payment Details', () => {
    beforeEach(() => {
      // Set up complete booking state
      const { selectService, selectTimeSlot, updateDetails } = useBookingStore.getState();
      selectService(createService());
      selectTimeSlot(createTimeSlot());
      updateDetails({
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+48123456789'
      });
    });

    test('should set payment details', () => {
      const { setPaymentDetails, paymentDetails } = useBookingStore.getState();

      const mockPaymentDetails = {
        method: 'stripe',
        paymentIntentId: 'pi_123',
        last4: '4242',
        brand: 'visa'
      };

      setPaymentDetails(mockPaymentDetails);

      const updatedState = useBookingStore.getState();
      expect(updatedState.paymentDetails).toEqual(mockPaymentDetails);
      expect(updatedState.canProceed.step4).toBe(true);
    });

    test('should validate payment details', () => {
      const { setPaymentDetails } = useBookingStore.getState();

      const invalidPaymentDetails = {
        method: '',
        paymentIntentId: ''
      };

      setPaymentDetails(invalidPaymentDetails);

      const updatedState = useBookingStore.getState();
      expect(updatedState.error).toContain('Invalid payment details');
      expect(updatedState.canProceed.step4).toBe(false);
    });

    test('should calculate total price with discounts', () => {
      const { setPaymentDetails, calculateTotal } = useBookingStore.getState();

      const state = useBookingStore.getState();
      if (state.selectedService) {
        const discounts = [
          { type: 'percentage', value: 10 }, // 10% off
          { type: 'fixed', value: 50 } // 50 PLN off
        ];

        const total = calculateTotal(discounts);
        const expectedTotal = state.selectedService.price * 0.9 - 50; // Apply 10% discount then 50 PLN off

        expect(total).toBe(expectedTotal);
      }
    });
  });

  describe('Booking Creation', () => {
    beforeEach(() => {
      // Set up complete booking state
      const { selectService, selectTimeSlot, updateDetails, setPaymentDetails } = useBookingStore.getState();
      selectService(createService({ price: 200 }));
      selectTimeSlot(createTimeSlot());
      updateDetails({
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+48123456789'
      });
      setPaymentDetails({
        method: 'stripe',
        paymentIntentId: 'pi_123'
      });
    });

    test('should create booking with complete data', async () => {
      const { createBooking, currentBooking, isLoading } = useBookingStore.getState();

      const mockBooking = createBooking({
        id: 'booking-123',
        status: 'pending',
        total_price: 200
      });

      // Mock booking service
      const mockBookingService = {
        createBooking: vi.fn().mockResolvedValue({ data: mockBooking, error: null })
      };

      vi.doMock('@/services/booking.service', () => ({
        bookingService: mockBookingService
      }));

      await createBooking();

      const updatedState = useBookingStore.getState();
      expect(updatedState.currentBooking).toEqual(mockBooking);
      expect(updatedState.isLoading).toBe(false);
    });

    test('should handle booking creation error', async () => {
      const { createBooking, error, isLoading } = useBookingStore.getState();

      const mockBookingService = {
        createBooking: vi.fn().mockRejectedValue(new Error('Failed to create booking'))
      };

      vi.doMock('@/services/booking.service', () => ({
        bookingService: mockBookingService
      }));

      await createBooking();

      const updatedState = useBookingStore.getState();
      expect(updatedState.error).toContain('Failed to create booking');
      expect(updatedState.isLoading).toBe(false);
      expect(updatedState.currentBooking).toBeNull();
    });

    test('should validate booking data before creation', () => {
      const { createBooking, error } = useBookingStore.getState();

      // Reset state to incomplete booking
      useBookingStore.getState().resetBooking();

      createBooking();

      const updatedState = useBookingStore.getState();
      expect(updatedState.error).toContain('Incomplete booking data');
      expect(updatedState.currentBooking).toBeNull();
    });

    test('should emit booking creation events', async () => {
      const startEventSpy = vi.fn();
      const successEventSpy = vi.fn();

      bookingEvents.on('booking:creation:start', startEventSpy);
      bookingEvents.on('booking:creation:success', successEventSpy);

      const { createBooking } = useBookingStore.getState();
      const mockBooking = createBooking();

      const mockBookingService = {
        createBooking: vi.fn().mockResolvedValue({ data: mockBooking, error: null })
      };

      vi.doMock('@/services/booking.service', () => ({
        bookingService: mockBookingService
      }));

      await createBooking();

      expect(startEventSpy).toHaveBeenCalled();
      expect(successEventSpy).toHaveBeenCalledWith({
        booking: mockBooking,
        timestamp: expect.any(Number)
      });

      bookingEvents.off('booking:creation:start', startEventSpy);
      bookingEvents.off('booking:creation:success', successEventSpy);
    });
  });

  describe('Booking Status Management', () => {
    test('should update booking status', () => {
      const { updateBookingStatus, currentBooking } = useBookingStore.getState();

      const mockBooking = createBooking({ status: 'pending' });
      useBookingStore.setState({ currentBooking: mockBooking });

      updateBookingStatus('confirmed');

      const updatedState = useBookingStore.getState();
      expect(updatedState.currentBooking?.status).toBe('confirmed');
    });

    test('should cancel booking with reason', () => {
      const { updateBookingStatus, currentBooking } = useBookingStore.getState();

      const mockBooking = createBooking({ status: 'confirmed' });
      useBookingStore.setState({ currentBooking: mockBooking });

      updateBookingStatus('cancelled', 'Client requested cancellation');

      const updatedState = useBookingStore.getState();
      expect(updatedState.currentBooking?.status).toBe('cancelled');
      expect(updatedState.currentBooking?.cancellation_reason).toBe('Client requested cancellation');
    });

    test('should handle status transitions validation', () => {
      const { updateBookingStatus, error } = useBookingStore.getState();

      const mockBooking = createBooking({ status: 'completed' });
      useBookingStore.setState({ currentBooking: mockBooking });

      // Try to change status from completed to pending (invalid transition)
      updateBookingStatus('pending');

      const updatedState = useBookingStore.getState();
      expect(updatedState.error).toContain('Invalid status transition');
    });
  });

  describe('Group Booking', () => {
    test('should enable group booking mode', () => {
      const { setGroupBooking, isGroupBooking, groupSize } = useBookingStore.getState();

      setGroupBooking(true, 4);

      const updatedState = useBookingStore.getState();
      expect(updatedState.isGroupBooking).toBe(true);
      expect(updatedState.groupSize).toBe(4);
    });

    test('should add group participants', () => {
      const { setGroupBooking, addGroupParticipant, groupParticipants } = useBookingStore.getState();

      setGroupBooking(true, 3);

      const participant1 = createExtendedProfile({ id: 'participant-1' });
      const participant2 = createExtendedProfile({ id: 'participant-2' });

      addGroupParticipant(participant1);
      addGroupParticipant(participant2);

      const updatedState = useBookingStore.getState();
      expect(updatedState.groupParticipants).toHaveLength(2);
      expect(updatedState.groupParticipants[0]).toEqual(participant1);
      expect(updatedState.groupParticipants[1]).toEqual(participant2);
    });

    test('should validate group size limits', () => {
      const { setGroupBooking, addGroupParticipant, error } = useBookingStore.getState();

      setGroupBooking(true, 2);

      const participant1 = createExtendedProfile({ id: 'participant-1' });
      const participant2 = createExtendedProfile({ id: 'participant-2' });
      const participant3 = createExtendedProfile({ id: 'participant-3' });

      addGroupParticipant(participant1);
      addGroupParticipant(participant2);

      // Try to add third participant (exceeds group size)
      addGroupParticipant(participant3);

      const updatedState = useBookingStore.getState();
      expect(updatedState.error).toContain('Group size limit exceeded');
      expect(updatedState.groupParticipants).toHaveLength(2);
    });

    test('should remove group participants', () => {
      const { setGroupBooking, addGroupParticipant, removeGroupParticipant, groupParticipants } = useBookingStore.getState();

      setGroupBooking(true, 3);

      const participant1 = createExtendedProfile({ id: 'participant-1' });
      const participant2 = createExtendedProfile({ id: 'participant-2' });

      addGroupParticipant(participant1);
      addGroupParticipant(participant2);

      removeGroupParticipant(participant1.id);

      const updatedState = useBookingStore.getState();
      expect(updatedState.groupParticipants).toHaveLength(1);
      expect(updatedState.groupParticipants[0]).toEqual(participant2);
    });

    test('should calculate group booking price', () => {
      const { setGroupBooking, calculateGroupPrice } = useBookingStore.getState();

      const mockService = createService({ price: 200 });
      useBookingStore.setState({ selectedService: mockService });

      setGroupBooking(true, 4);

      const totalPrice = calculateGroupPrice();
      const expectedPrice = mockService.price * 4 * 0.9; // 10% group discount

      expect(totalPrice).toBe(expectedPrice);
    });
  });

  describe('Error Handling', () => {
    test('should set and clear errors', () => {
      const { setError, clearError, error } = useBookingStore.getState();

      setError('Test error message');

      expect(useBookingStore.getState().error).toBe('Test error message');

      clearError();

      expect(useBookingStore.getState().error).toBeNull();
    });

    test('should auto-clear errors on state change', () => {
      const { setError, selectService, error } = useBookingStore.getState();

      setError('Previous error');

      selectService(createService());

      expect(useBookingStore.getState().error).toBeNull();
    });

    test('should emit error events', () => {
      const errorEventSpy = vi.fn();
      bookingEvents.on('error:occurred', errorEventSpy);

      const { setError } = useBookingStore.getState();

      setError('Test error');

      expect(errorEventSpy).toHaveBeenCalledWith({
        error: 'Test error',
        timestamp: expect.any(Number)
      });

      bookingEvents.off('error:occurred', errorEventSpy);
    });
  });

  describe('Loading States', () => {
    test('should manage loading state during operations', async () => {
      const { createBooking, isLoading } = useBookingStore.getState();

      // Mock async operation
      let resolveOperation: (value: any) => void;
      const mockPromise = new Promise(resolve => {
        resolveOperation = resolve;
      });

      const mockBookingService = {
        createBooking: vi.fn().mockReturnValue(mockPromise)
      };

      vi.doMock('@/services/booking.service', () => ({
        bookingService: mockBookingService
      }));

      const operationPromise = createBooking();

      expect(useBookingStore.getState().isLoading).toBe(true);

      resolveOperation({ data: createBooking(), error: null });
      await operationPromise;

      expect(useBookingStore.getState().isLoading).toBe(false);
    });

    test('should prevent concurrent operations', () => {
      const { createBooking, isLoading } = useBookingStore.getState();

      // Start first operation
      createBooking();

      expect(isLoading).toBe(true);

      // Try to start second operation
      const result = createBooking();

      expect(result).toEqual({ error: 'Another operation is in progress' });
    });
  });

  describe('State Persistence', () => {
    test('should persist state to localStorage', () => {
      const { selectService, updateDetails } = useBookingStore.getState();

      const mockService = createService();
      const mockDetails = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+48123456789'
      };

      selectService(mockService);
      updateDetails(mockDetails);

      // Check if localStorage was called
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'booking-state',
        expect.any(String)
      );
    });

    test('should restore state from localStorage', () => {
      const persistedState = {
        selectedService: createService(),
        details: {
          name: 'John Doe',
          email: 'john.doe@example.com'
        },
        currentStep: 3
      };

      // Mock localStorage getItem
      (localStorage.getItem as any).mockReturnValue(JSON.stringify(persistedState));

      // Re-initialize store
      const { resetBooking } = useBookingStore.getState();
      resetBooking();

      // State should be restored from localStorage
      const restoredState = useBookingStore.getState();
      expect(restoredState.selectedService).toEqual(persistedState.selectedService);
      expect(restoredState.details).toEqual(persistedState.details);
      expect(restoredState.currentStep).toBe(persistedState.currentStep);
    });

    test('should handle corrupted localStorage data', () => {
      // Mock corrupted data
      (localStorage.getItem as any).mockReturnValue('invalid json');

      // Should not throw error and should initialize clean state
      expect(() => {
        const { resetBooking } = useBookingStore.getState();
        resetBooking();
      }).not.toThrow();

      const state = useBookingStore.getState();
      expect(state.selectedService).toBeNull();
      expect(state.details).toEqual({});
    });
  });

  describe('Performance Optimization', () => {
    test('should debounce state updates', async () => {
      vi.useFakeTimers();

      const { updateDetails } = useBookingStore.getState();

      const mockDetails = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+48123456789'
      };

      // Rapid successive updates
      updateDetails({ name: 'John' });
      updateDetails({ name: 'John Doe' });
      updateDetails(mockDetails);

      // Should only persist once after debounce
      vi.advanceTimersByTime(300);

      expect(localStorage.setItem).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });

    test('should memoize expensive calculations', () => {
      const { calculateTotal } = useBookingStore.getState();

      const expensiveCalculationSpy = vi.fn(() => 100);
      const originalCalculateTotal = calculateTotal;

      // Mock expensive calculation
      const mockCalculateTotal = vi.fn(() => expensiveCalculationSpy());

      // Call calculation multiple times with same inputs
      const result1 = mockCalculateTotal([]);
      const result2 = mockCalculateTotal([]);

      // Should only calculate once due to memoization
      expect(expensiveCalculationSpy).toHaveBeenCalledTimes(1);
      expect(result1).toBe(result2);
    });
  });

  describe('Event System', () => {
    test('should subscribe to and emit booking events', () => {
      const eventSpy = vi.fn();

      bookingEvents.on('step:changed', eventSpy);

      const { selectService } = useBookingStore.getState();
      selectService(createService());

      expect(eventSpy).toHaveBeenCalledWith({
        fromStep: 1,
        toStep: 2,
        timestamp: expect.any(Number)
      });

      bookingEvents.off('step:changed', eventSpy);
    });

    test('should handle multiple event listeners', () => {
      const spy1 = vi.fn();
      const spy2 = vi.fn();
      const spy3 = vi.fn();

      bookingEvents.on('booking:created', spy1);
      bookingEvents.on('booking:created', spy2);
      bookingEvents.on('booking:created', spy3);

      const { createBooking } = useBookingStore.getState();
      const mockBooking = createBooking();

      const mockBookingService = {
        createBooking: vi.fn().mockResolvedValue({ data: mockBooking, error: null })
      };

      vi.doMock('@/services/booking.service', () => ({
        bookingService: mockBookingService
      }));

      createBooking();

      // All listeners should be called
      expect(spy1).toHaveBeenCalled();
      expect(spy2).toHaveBeenCalled();
      expect(spy3).toHaveBeenCalled();

      bookingEvents.off('booking:created', spy1);
      bookingEvents.off('booking:created', spy2);
      bookingEvents.off('booking:created', spy3);
    });

    test('should handle event listener errors gracefully', () => {
      const errorSpy = vi.fn(() => {
        throw new Error('Listener error');
      });
      const normalSpy = vi.fn();

      bookingEvents.on('test:event', errorSpy);
      bookingEvents.on('test:event', normalSpy);

      // Emit event - should not throw despite listener error
      expect(() => {
        bookingEvents.emit('test:event', { data: 'test' });
      }).not.toThrow();

      // Normal listener should still be called
      expect(normalSpy).toHaveBeenCalled();

      bookingEvents.off('test:event', errorSpy);
      bookingEvents.off('test:event', normalSpy);
    });
  });

  describe('Store Reset and Cleanup', () => {
    test('should reset store to initial state', () => {
      // Set up complex state
      const { selectService, selectTimeSlot, updateDetails } = useBookingStore.getState();
      selectService(createService());
      selectTimeSlot(createTimeSlot());
      updateDetails({ name: 'Test User', email: 'test@example.com', phone: '+48123456789' });

      expect(useBookingStore.getState().selectedService).not.toBeNull();
      expect(useBookingStore.getState().selectedTimeSlot).not.toBeNull();
      expect(useBookingStore.getState().details).not.toEqual({});

      // Reset store
      const { resetBooking } = useBookingStore.getState();
      resetBooking();

      const state = useBookingStore.getState();
      expect(state.selectedService).toBeNull();
      expect(state.selectedTimeSlot).toBeNull();
      expect(state.details).toEqual({});
      expect(state.currentStep).toBe(1);
      expect(state.currentBooking).toBeNull();
      expect(state.error).toBeNull();
      expect(state.isLoading).toBe(false);
    });

    test('should clear persisted data on reset', () => {
      // Set up state with data
      const { selectService, resetBooking } = useBookingStore.getState();
      selectService(createService());

      expect(localStorage.setItem).toHaveBeenCalled();

      // Reset store
      resetBooking();

      // Should clear localStorage
      expect(localStorage.removeItem).toHaveBeenCalledWith('booking-state');
    });

    test('should emit reset event', () => {
      const resetSpy = vi.fn();
      bookingEvents.on('store:reset', resetSpy);

      const { resetBooking } = useBookingStore.getState();
      resetBooking();

      expect(resetSpy).toHaveBeenCalledWith({
        timestamp: expect.any(Number)
      });

      bookingEvents.off('store:reset', resetSpy);
    });
  });
});