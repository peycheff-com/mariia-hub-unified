import { describe, it, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@/test/utils/test-utilities';
import { QueryClient } from '@tanstack/react-query';
import Step2Time from '@/components/booking/Step2Time';
import { createTimeSlot, createTimeSlots, createService } from '@/test/factories/extended-factories';
import { BookingService } from '@/services/booking.service';
import * as bookingStoreModule from '@/stores/bookingStore';

// Mock the booking store
const mockSelectTimeSlot = vi.fn();
const mockSelectedService = createService({ id: 'test-service-id', duration: 60 });
const mockSelectedTimeSlot = null;

vi.mock('@/stores/bookingStore', () => ({
  useBookingStore: () => ({
    selectService: vi.fn(),
    selectTimeSlot: mockSelectTimeSlot,
    selectedService: mockSelectedService,
    selectedTimeSlot: mockSelectedTimeSlot,
    canProceed: { step2: false },
    currentStep: 2,
  }),
}));

describe('Step2Time - Time Slot Selection', () => {
  let queryClient: QueryClient;
  let mockBookingService: any;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false },
      },
    });

    // Mock booking service
    mockBookingService = {
      checkAvailability: vi.fn(),
      holdTimeSlot: vi.fn(),
      releaseTimeSlot: vi.fn(),
      saveBookingDraft: vi.fn(),
      getBookingDraft: vi.fn(),
    };

    vi.spyOn(BookingService.prototype, 'constructor').mockImplementation(() => mockBookingService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    test('should render time slot selection interface', async () => {
      const mockTimeSlots = createTimeSlots(5);
      mockBookingService.checkAvailability.mockResolvedValue({ data: mockTimeSlots, error: null });

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step2Time />);

      expect(screen.getByText('Select Time')).toBeInTheDocument();
      expect(screen.getByText('Choose a convenient time slot for your appointment')).toBeInTheDocument();
    });

    test('should display selected service information', async () => {
      const { render } = await import('@/test/utils/test-utilities');
      render(<Step2Time />);

      expect(screen.getByText(mockSelectedService.title)).toBeInTheDocument();
      expect(screen.getByText(`${mockSelectedService.duration} minutes`)).toBeInTheDocument();
      expect(screen.getByText(`${mockSelectedService.price} ${mockSelectedService.currency}`)).toBeInTheDocument();
    });

    test('should show calendar view', async () => {
      const mockTimeSlots = createTimeSlots(5);
      mockBookingService.checkAvailability.mockResolvedValue({ data: mockTimeSlots, error: null });

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step2Time />);

      await waitFor(() => {
        expect(screen.getByRole('grid', { name: /calendar/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /previous month/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /next month/i })).toBeInTheDocument();
      });
    });

    test('should show loading state initially', () => {
      const { render } = await import('@/test/utils/test-utilities');
      render(<Step2Time />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText('Checking availability...')).toBeInTheDocument();
    });
  });

  describe('Time Slot Loading', () => {
    test('should load and display available time slots', async () => {
      const mockTimeSlots = createTimeSlots(8, {
        start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        status: 'available',
      });
      mockBookingService.checkAvailability.mockResolvedValue({ data: mockTimeSlots, error: null });

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step2Time />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Verify time slots are displayed
      mockTimeSlots.forEach((slot) => {
        const startTime = new Date(slot.start_time);
        const timeString = startTime.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        });
        expect(screen.getByText(timeString)).toBeInTheDocument();
      });
    });

    test('should handle no available time slots', async () => {
      mockBookingService.checkAvailability.mockResolvedValue({ data: [], error: null });

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step2Time />);

      await waitFor(() => {
        expect(screen.getByText('No available time slots')).toBeInTheDocument();
        expect(screen.getByText('Please try selecting a different date or contact us for assistance')).toBeInTheDocument();
      });

      // Should show join waitlist option
      expect(screen.getByRole('button', { name: /join waitlist/i })).toBeInTheDocument();
    });

    test('should handle availability checking error', async () => {
      const errorMessage = 'Failed to check availability';
      mockBookingService.checkAvailability.mockRejectedValue(new Error(errorMessage));

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step2Time />);

      await waitFor(() => {
        expect(screen.getByText('Error checking availability')).toBeInTheDocument();
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    test('should retry availability check on retry button click', async () => {
      const errorMessage = 'Network error';
      mockBookingService.checkAvailability
        .mockRejectedValueOnce(new Error(errorMessage))
        .mockResolvedValueOnce({ data: createTimeSlots(3), error: null });

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step2Time />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(retryButton);

      expect(mockBookingService.checkAvailability).toHaveBeenCalledTimes(2);
    });
  });

  describe('Calendar Navigation', () => {
    test('should navigate to previous month', async () => {
      const mockTimeSlots = createTimeSlots(5);
      mockBookingService.checkAvailability.mockResolvedValue({ data: mockTimeSlots, error: null });

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step2Time />);

      await waitFor(() => {
        expect(screen.getByRole('grid', { name: /calendar/i })).toBeInTheDocument();
      });

      const previousButton = screen.getByRole('button', { name: /previous month/i });
      fireEvent.click(previousButton);

      // Should trigger availability check for previous month
      expect(mockBookingService.checkAvailability).toHaveBeenCalled();
    });

    test('should navigate to next month', async () => {
      const mockTimeSlots = createTimeSlots(5);
      mockBookingService.checkAvailability.mockResolvedValue({ data: mockTimeSlots, error: null });

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step2Time />);

      await waitFor(() => {
        expect(screen.getByRole('grid', { name: /calendar/i })).toBeInTheDocument();
      });

      const nextButton = screen.getByRole('button', { name: /next month/i });
      fireEvent.click(nextButton);

      // Should trigger availability check for next month
      expect(mockBookingService.checkAvailability).toHaveBeenCalled();
    });

    test('should select a specific date', async () => {
      const targetDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 2 days from now
      const mockTimeSlots = createTimeSlots(5, {
        start_time: targetDate.toISOString(),
      });
      mockBookingService.checkAvailability.mockResolvedValue({ data: mockTimeSlots, error: null });

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step2Time />);

      await waitFor(() => {
        expect(screen.getByRole('grid', { name: /calendar/i })).toBeInTheDocument();
      });

      // Find and click the target date
      const dateString = targetDate.getDate().toString();
      const targetDateButton = screen.getByRole('button', { name: new RegExp(dateString) });
      fireEvent.click(targetDateButton);

      expect(mockBookingService.checkAvailability).toHaveBeenCalledWith(
        expect.any(String), // serviceId
        expect.any(String), // startDate
        expect.any(String), // endDate
        undefined, // locationId
        undefined  // practitionerId
      );
    });

    test('should highlight today in calendar', async () => {
      const mockTimeSlots = createTimeSlots(5);
      mockBookingService.checkAvailability.mockResolvedValue({ data: mockTimeSlots, error: null });

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step2Time />);

      await waitFor(() => {
        const today = new Date().getDate().toString();
        const todayButton = screen.getByRole('button', { name: today });
        expect(todayButton).toHaveAttribute('aria-label', expect.stringContaining('today'));
      });
    });

    test('should show availability indicators on calendar', async () => {
      const availableDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      const mockTimeSlots = createTimeSlots(3, {
        start_time: availableDate.toISOString(),
        status: 'available',
      });
      mockBookingService.checkAvailability.mockResolvedValue({ data: mockTimeSlots, error: null });

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step2Time />);

      await waitFor(() => {
        const dateString = availableDate.getDate().toString();
        const dateButton = screen.getByRole('button', { name: dateString });
        // Should indicate available slots
        expect(dateButton).toHaveClass('has-availability');
      });
    });
  });

  describe('Time Slot Selection', () => {
    let mockTimeSlots: any[];

    beforeEach(() => {
      mockTimeSlots = createTimeSlots(6, {
        status: 'available',
        start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
      mockBookingService.checkAvailability.mockResolvedValue({ data: mockTimeSlots, error: null });
    });

    test('should select a time slot when clicked', async () => {
      const { render } = await import('@/test/utils/test-utilities');
      render(<Step2Time />);

      await waitFor(() => {
        const firstTimeSlot = screen.getByTestId(`time-slot-${mockTimeSlots[0].id}`);
        expect(firstTimeSlot).toBeInTheDocument();
      });

      const timeSlot = screen.getByTestId(`time-slot-${mockTimeSlots[0].id}`);
      fireEvent.click(timeSlot);

      expect(mockSelectTimeSlot).toHaveBeenCalledWith(mockTimeSlots[0]);
    });

    test('should highlight selected time slot', async () => {
      const { render } = await import('@/test/utils/test-utilities');
      render(<Step2Time />);

      await waitFor(() => {
        const firstTimeSlot = screen.getByTestId(`time-slot-${mockTimeSlots[0].id}`);
        expect(firstTimeSlot).toBeInTheDocument();
      });

      const timeSlot = screen.getByTestId(`time-slot-${mockTimeSlots[0].id}`);
      fireEvent.click(timeSlot);

      await waitFor(() => {
        expect(timeSlot).toHaveClass('selected');
        expect(timeSlot).toHaveAttribute('aria-selected', 'true');
      });
    });

    test('should allow changing selected time slot', async () => {
      const { render } = await import('@/test/utils/test-utilities');
      render(<Step2Time />);

      await waitFor(() => {
        const firstTimeSlot = screen.getByTestId(`time-slot-${mockTimeSlots[0].id}`);
        expect(firstTimeSlot).toBeInTheDocument();
      });

      // Select first time slot
      const firstTimeSlot = screen.getByTestId(`time-slot-${mockTimeSlots[0].id}`);
      fireEvent.click(firstTimeSlot);

      expect(mockSelectTimeSlot).toHaveBeenCalledWith(mockTimeSlots[0]);

      // Select second time slot
      const secondTimeSlot = screen.getByTestId(`time-slot-${mockTimeSlots[1].id}`);
      fireEvent.click(secondTimeSlot);

      expect(mockSelectTimeSlot).toHaveBeenCalledWith(mockTimeSlots[1]);
      expect(firstTimeSlot).not.toHaveClass('selected');
      expect(secondTimeSlot).toHaveClass('selected');
    });

    test('should show continue button when time slot is selected', async () => {
      const { render } = await import('@/test/utils/test-utilities');
      render(<Step2Time />);

      // Continue button should be disabled initially
      const continueButton = screen.getByRole('button', { name: /continue/i });
      expect(continueButton).toBeDisabled();

      await waitFor(() => {
        const firstTimeSlot = screen.getByTestId(`time-slot-${mockTimeSlots[0].id}`);
        expect(firstTimeSlot).toBeInTheDocument();
      });

      const timeSlot = screen.getByTestId(`time-slot-${mockTimeSlots[0].id}`);
      fireEvent.click(timeSlot);

      await waitFor(() => {
        expect(continueButton).not.toBeDisabled();
      });
    });

    test('should not select unavailable time slots', async () => {
      const unavailableSlots = createTimeSlots(3, {
        status: 'booked',
        start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
      mockBookingService.checkAvailability.mockResolvedValue({ data: unavailableSlots, error: null });

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step2Time />);

      await waitFor(() => {
        const firstTimeSlot = screen.getByTestId(`time-slot-${unavailableSlots[0].id}`);
        expect(firstTimeSlot).toHaveClass('unavailable');
        expect(firstTimeSlot).toHaveAttribute('aria-disabled', 'true');
      });

      // Click on unavailable slot
      const timeSlot = screen.getByTestId(`time-slot-${unavailableSlots[0].id}`);
      fireEvent.click(timeSlot);

      // Should not trigger selection
      expect(mockSelectTimeSlot).not.toHaveBeenCalled();
    });
  });

  describe('Time Slot Holding', () => {
    test('should hold time slot when selected', async () => {
      const mockTimeSlots = createTimeSlots(3, { status: 'available' });
      const mockHold = {
        id: 'hold-123',
        time_slot_id: mockTimeSlots[0].id,
        session_id: 'session-123',
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      };

      mockBookingService.checkAvailability.mockResolvedValue({ data: mockTimeSlots, error: null });
      mockBookingService.holdTimeSlot.mockResolvedValue({ data: mockHold, error: null });

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step2Time />);

      await waitFor(() => {
        const timeSlot = screen.getByTestId(`time-slot-${mockTimeSlots[0].id}`);
        fireEvent.click(timeSlot);
      });

      await waitFor(() => {
        expect(mockBookingService.holdTimeSlot).toHaveBeenCalledWith(mockTimeSlots[0].id, expect.any(String));
      });
    });

    test('should handle time slot hold failure', async () => {
      const mockTimeSlots = createTimeSlots(3, { status: 'available' });
      mockBookingService.checkAvailability.mockResolvedValue({ data: mockTimeSlots, error: null });
      mockBookingService.holdTimeSlot.mockResolvedValue({ data: null, error: { message: 'Slot already taken' } });

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step2Time />);

      await waitFor(() => {
        const timeSlot = screen.getByTestId(`time-slot-${mockTimeSlots[0].id}`);
        fireEvent.click(timeSlot);
      });

      await waitFor(() => {
        expect(screen.getByText('This time slot is no longer available')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /refresh availability/i })).toBeInTheDocument();
      });
    });

    test('should show hold countdown timer', async () => {
      const mockTimeSlots = createTimeSlots(3, { status: 'available' });
      const mockHold = {
        id: 'hold-123',
        time_slot_id: mockTimeSlots[0].id,
        session_id: 'session-123',
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      };

      mockBookingService.checkAvailability.mockResolvedValue({ data: mockTimeSlots, error: null });
      mockBookingService.holdTimeSlot.mockResolvedValue({ data: mockHold, error: null });

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step2Time />);

      await waitFor(() => {
        const timeSlot = screen.getByTestId(`time-slot-${mockTimeSlots[0].id}`);
        fireEvent.click(timeSlot);
      });

      await waitFor(() => {
        expect(screen.getByText(/hold expires in/i)).toBeInTheDocument();
        expect(screen.getByTestId('hold-timer')).toBeInTheDocument();
      });
    });

    test('should refresh availability when hold expires', async () => {
      vi.useFakeTimers();

      const mockTimeSlots = createTimeSlots(3, { status: 'available' });
      const mockHold = {
        id: 'hold-123',
        time_slot_id: mockTimeSlots[0].id,
        session_id: 'session-123',
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      };

      mockBookingService.checkAvailability.mockResolvedValue({ data: mockTimeSlots, error: null });
      mockBookingService.holdTimeSlot.mockResolvedValue({ data: mockHold, error: null });

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step2Time />);

      await waitFor(() => {
        const timeSlot = screen.getByTestId(`time-slot-${mockTimeSlots[0].id}`);
        fireEvent.click(timeSlot);
      });

      // Fast-forward 5 minutes (hold expiration)
      vi.advanceTimersByTime(5 * 60 * 1000);

      await waitFor(() => {
        expect(mockBookingService.checkAvailability).toHaveBeenCalledTimes(2); // Initial + refresh
      });

      vi.useRealTimers();
    });
  });

  describe('Waitlist Functionality', () => {
    test('should show join waitlist option when no slots available', async () => {
      mockBookingService.checkAvailability.mockResolvedValue({ data: [], error: null });

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step2Time />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /join waitlist/i })).toBeInTheDocument();
        expect(screen.getByText('Get notified when new time slots become available')).toBeInTheDocument();
      });
    });

    test('should join waitlist when button is clicked', async () => {
      mockBookingService.checkAvailability.mockResolvedValue({ data: [], error: null });
      mockBookingService.saveBookingDraft.mockResolvedValue({
        data: { id: 'draft-123' },
        error: null
      });

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step2Time />);

      await waitFor(() => {
        const waitlistButton = screen.getByRole('button', { name: /join waitlist/i });
        fireEvent.click(waitlistButton);
      });

      await waitFor(() => {
        expect(screen.getByText('You have been added to the waitlist')).toBeInTheDocument();
        expect(screen.getByText(/We will notify you as soon as a time slot becomes available/i)).toBeInTheDocument();
      });
    });

    test('should handle waitlist join error', async () => {
      mockBookingService.checkAvailability.mockResolvedValue({ data: [], error: null });
      mockBookingService.saveBookingDraft.mockRejectedValue(new Error('Failed to join waitlist'));

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step2Time />);

      await waitFor(() => {
        const waitlistButton = screen.getByRole('button', { name: /join waitlist/i });
        fireEvent.click(waitlistButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Error joining waitlist')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      });
    });
  });

  describe('Alternative Times', () => {
    test('should show alternative time suggestions', async () => {
      const limitedSlots = createTimeSlots(2, {
        status: 'available',
        start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
      mockBookingService.checkAvailability.mockResolvedValue({ data: limitedSlots, error: null });

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step2Time />);

      await waitFor(() => {
        expect(screen.getByText(/limited availability/i)).toBeInTheDocument();
        expect(screen.getByText(/try these alternative times/i)).toBeInTheDocument();
      });

      // Should show suggestions for different dates
      expect(screen.getByText(/tomorrow/i)).toBeInTheDocument();
      expect(screen.getByText(/next week/i)).toBeInTheDocument();
    });

    test('should navigate to alternative time suggestions', async () => {
      const limitedSlots = createTimeSlots(2);
      mockBookingService.checkAvailability.mockResolvedValue({ data: limitedSlots, error: null });

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step2Time />);

      await waitFor(() => {
        expect(screen.getByText(/limited availability/i)).toBeInTheDocument();
      });

      const tomorrowButton = screen.getByRole('button', { name: /tomorrow/i });
      fireEvent.click(tomorrowButton);

      // Should trigger availability check for tomorrow
      expect(mockBookingService.checkAvailability).toHaveBeenCalled();
    });
  });

  describe('Navigation', () => {
    test('should go back to service selection', async () => {
      const mockTimeSlots = createTimeSlots(3);
      mockBookingService.checkAvailability.mockResolvedValue({ data: mockTimeSlots, error: null });

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step2Time />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
      });

      const backButton = screen.getByRole('button', { name: /back/i });
      expect(backButton).toBeInTheDocument();
    });

    test('should proceed to details when continue button is clicked with selected time slot', async () => {
      const mockTimeSlots = createTimeSlots(3);
      mockBookingService.checkAvailability.mockResolvedValue({ data: mockTimeSlots, error: null });

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step2Time />);

      await waitFor(() => {
        const timeSlot = screen.getByTestId(`time-slot-${mockTimeSlots[0].id}`);
        fireEvent.click(timeSlot);
      });

      const continueButton = screen.getByRole('button', { name: /continue/i });
      expect(continueButton).not.toBeDisabled();

      fireEvent.click(continueButton);
      expect(continueButton).not.toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels and roles', async () => {
      const mockTimeSlots = createTimeSlots(3);
      mockBookingService.checkAvailability.mockResolvedValue({ data: mockTimeSlots, error: null });

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step2Time />);

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
        expect(screen.getByRole('grid', { name: /calendar/i })).toBeInTheDocument();
        expect(screen.getByRole('list', { name: /available time slots/i })).toBeInTheDocument();
      });

      // Time slots should be selectable
      const timeSlots = screen.getAllByRole('button').filter(button =>
        button.getAttribute('data-testid')?.startsWith('time-slot-')
      );
      timeSlots.forEach((slot) => {
        expect(slot).toHaveAttribute('aria-label');
        expect(slot).toHaveAttribute('tabindex', '0');
      });
    });

    test('should support keyboard navigation', async () => {
      const mockTimeSlots = createTimeSlots(3);
      mockBookingService.checkAvailability.mockResolvedValue({ data: mockTimeSlots, error: null });

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step2Time />);

      await waitFor(() => {
        const firstTimeSlot = screen.getByTestId(`time-slot-${mockTimeSlots[0].id}`);
        expect(firstTimeSlot).toBeInTheDocument();
      });

      const firstTimeSlot = screen.getByTestId(`time-slot-${mockTimeSlots[0].id}`);

      // Focus time slot
      firstTimeSlot.focus();
      expect(firstTimeSlot).toHaveFocus();

      // Select with Enter key
      fireEvent.keyDown(firstTimeSlot, { key: 'Enter', code: 'Enter' });
      expect(mockSelectTimeSlot).toHaveBeenCalledWith(mockTimeSlots[0]);

      // Select with Space key
      fireEvent.keyDown(firstTimeSlot, { key: ' ', code: 'Space' });
      expect(mockSelectTimeSlot).toHaveBeenCalledTimes(2);
    });

    test('should announce time slot selection to screen readers', async () => {
      const mockTimeSlots = createTimeSlots(3);
      mockBookingService.checkAvailability.mockResolvedValue({ data: mockTimeSlots, error: null });

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step2Time />);

      await waitFor(() => {
        const timeSlot = screen.getByTestId(`time-slot-${mockTimeSlots[0].id}`);
        fireEvent.click(timeSlot);
      });

      // Should announce the selection
      const statusRegion = screen.getByRole('status');
      expect(statusRegion).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    test('should not make unnecessary API calls', async () => {
      const mockTimeSlots = createTimeSlots(5);
      mockBookingService.checkAvailability.mockResolvedValue({ data: mockTimeSlots, error: null });

      const { render, rerender } = await import('@/test/utils/test-utilities');
      const { unmount } = render(<Step2Time />);

      await waitFor(() => {
        expect(mockBookingService.checkAvailability).toHaveBeenCalledTimes(1);
      });

      // Rerender should not trigger new API call
      rerender(<Step2Time />);
      await waitFor(() => {
        expect(mockBookingService.checkAvailability).toHaveBeenCalledTimes(1);
      });

      unmount();
    });

    test('should handle large time slot lists efficiently', async () => {
      const largeTimeSlotList = createTimeSlots(100);
      mockBookingService.checkAvailability.mockResolvedValue({ data: largeTimeSlotList, error: null });

      const { render } = await import('@/test/utils/test-utilities');
      const startTime = performance.now();

      render(<Step2Time />);

      await waitFor(() => {
        expect(screen.getByTestId(`time-slot-${largeTimeSlotList[0].id}`)).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (less than 1 second)
      expect(renderTime).toBeLessThan(1000);
    });
  });
});