import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/utils/workflow-test-utils';

// Mock external services for error testing
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('@/lib/stripe', () => ({
  createPaymentIntent: vi.fn(),
}));

// Import components after mocking
import { BookingWizard } from '@/components/booking/BookingWizard';
import { ServiceCard } from '@/components/ServiceCard';
import { AvailableSlotsList } from '@/components/AvailableSlotsList';

import {
  createMockService,
  createMockTimeSlot,
  simulateNetworkFailure,
  simulateSlowResponse,
  simulateApiError,
  createMockSupabaseClient,
} from '../utils/workflow-test-utils';

describe('Error Scenario and Edge Case Tests', () => {
  const mockService = createMockService();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Network Failure Scenarios', () => {
    it('handles service loading failures gracefully', async () => {
      // Mock network failure for service loading
      vi.mocked(vi.doMock('@/hooks/useServices', () => ({
        useServices: () => ({
          services: [],
          loading: false,
          error: new Error('Failed to load services'),
        }),
      })));

      render(<BookingWizard />);

      await waitFor(() => {
        expect(screen.getByText(/failed to load services/i)).toBeInTheDocument();
      });

      // Should provide retry option
      expect(screen.getByText('Retry')).toBeInTheDocument();

      // Retry should work
      vi.doMock('@/hooks/useServices', () => ({
        useServices: () => ({
          services: [mockService],
          loading: false,
          error: null,
        }),
      }));

      fireEvent.click(screen.getByText('Retry'));

      await waitFor(() => {
        expect(screen.getByText(mockService.name)).toBeInTheDocument();
      });
    });

    it('handles time slot loading failures', async () => {
      // Mock time slot loading failure
      vi.mocked(vi.doMock('@/hooks/useSlotGeneration', () => ({
        useSlotGeneration: () => ({
          slots: [],
          loading: false,
          error: new Error('Failed to load available slots'),
        }),
      })));

      render(
        <BookingWizard initialService={mockService} />
      );

      await waitFor(() => {
        expect(screen.getByText(/when works for you/i)).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText(/failed to load time slots/i)).toBeInTheDocument();
      });

      // Should show fallback option
      expect(screen.getByText('Contact us directly')).toBeInTheDocument();
    });

    it('handles booking creation failures', async () => {
      // Mock booking creation failure
      const mockSupabase = createMockSupabaseClient();
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database connection failed' },
        }),
      } as any);

      vi.doMock('@/integrations/supabase/client', () => ({
        supabase: mockSupabase,
      }));

      render(<BookingWizard initialService={mockService} />);

      // Complete booking flow
      const timeSlots = screen.getAllByRole('button').filter(btn =>
        btn.textContent && /^\d{1,2}:\d{2}$/.test(btn.textContent)
      );

      if (timeSlots.length > 0) {
        fireEvent.click(timeSlots[0]);
      }

      await waitFor(() => {
        expect(screen.getByText('Your Information')).toBeInTheDocument();
      });

      // Fill form
      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);

      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      const termsCheckbox = screen.getByLabelText(/terms and conditions/i);
      fireEvent.click(termsCheckbox);

      const continueButton = screen.getByText('Continue to Payment');
      fireEvent.click(continueButton);

      // Should show booking error
      await waitFor(() => {
        expect(screen.getByText(/booking failed/i)).toBeInTheDocument();
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
    });

    it('handles payment processing failures', async () => {
      // Mock payment failure
      vi.doMock('@/lib/stripe', () => ({
        createPaymentIntent: vi.fn().mockRejectedValue(new Error('Payment processing failed')),
      }));

      render(<BookingWizard initialService={mockService} />);

      // Complete flow to payment step
      const timeSlots = screen.getAllByRole('button').filter(btn =>
        btn.textContent && /^\d{1,2}:\d{2}$/.test(btn.textContent)
      );

      if (timeSlots.length > 0) {
        fireEvent.click(timeSlots[0]);
      }

      await waitFor(() => {
        expect(screen.getByText('Your Information')).toBeInTheDocument();
      });

      // Fill and submit form
      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);

      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      const termsCheckbox = screen.getByLabelText(/terms and conditions/i);
      fireEvent.click(termsCheckbox);

      const continueButton = screen.getByText('Continue to Payment');
      fireEvent.click(continueButton);

      await waitFor(() => {
        expect(screen.getByText('Payment')).toBeInTheDocument();
      });

      // Attempt payment
      const payButton = screen.getByText('Complete Payment');
      fireEvent.click(payButton);

      // Should show payment error
      await waitFor(() => {
        expect(screen.getByText(/payment failed/i)).toBeInTheDocument();
        expect(screen.getByText('Try Different Payment Method')).toBeInTheDocument();
      });
    });

    it('handles slow network responses with proper loading states', async () => {
      // Mock slow response
      vi.doMock('@/hooks/useServices', () => ({
        useServices: () => ({
          services: [],
          loading: true,
          error: null,
        }),
      }));

      render(<BookingWizard />);

      // Should show loading state
      expect(screen.getByText('Loading services...')).toBeInTheDocument();

      // Mock completion after delay
      await new Promise(resolve => setTimeout(resolve, 100));

      vi.doMock('@/hooks/useServices', () => ({
        useServices: () => ({
          services: [mockService],
          loading: false,
          error: null,
        }),
      }));

      await waitFor(() => {
        expect(screen.getByText(mockService.name)).toBeInTheDocument();
      });
    });
  });

  describe('Data Validation Errors', () => {
    it('handles invalid service data gracefully', async () => {
      const invalidService = {
        ...mockService,
        price_pln: -100, // Invalid negative price
        duration_minutes: 0, // Invalid zero duration
      };

      render(<ServiceCard service={invalidService} />);

      // Should handle invalid data gracefully
      expect(screen.getByText('Price not available')).toBeInTheDocument();
      expect(screen.getByText('Duration not specified')).toBeInTheDocument();
    });

    it('validates malformed date inputs', async () => {
      // Mock malformed time slot data
      vi.doMock('@/hooks/useSlotGeneration', () => ({
        useSlotGeneration: () => ({
          slots: [
            { time: new Date('invalid-date'), available: true },
            { time: null, available: true },
            { time: new Date('2030-01-01T10:00:00.000Z'), available: true },
          ],
          loading: false,
          error: null,
        }),
      }));

      render(
        <AvailableSlotsList
          serviceId="svc_test"
          locationId="loc_test"
          durationMinutes={60}
          onSelectSlot={vi.fn()}
        />
      );

      // Should only show valid time slots
      await waitFor(() => {
        const timeButtons = screen.getAllByRole('button').filter(btn =>
          btn.textContent && /^\d{1,2}:\d{2}$/.test(btn.textContent)
        );
        expect(timeButtons.length).toBe(1); // Only the valid one
      });
    });

    it('handles extremely large data values', async () => {
      const extremeService = {
        ...mockService,
        price_pln: Number.MAX_SAFE_INTEGER,
        name: 'A'.repeat(1000), // Very long name
        description: 'B'.repeat(10000), // Very long description
      };

      render(<ServiceCard service={extremeService} />);

      // Should handle extreme values without crashing
      expect(screen.getByText(/price upon request/i)).toBeInTheDocument();
      expect(screen.getByText('A'.repeat(100))).toBeInTheDocument(); // Should truncate
    });

    it('validates email formats strictly', async () => {
      render(<BookingWizard initialService={mockService} />);

      // Navigate to details step
      const timeSlots = screen.getAllByRole('button').filter(btn =>
        btn.textContent && /^\d{1,2}:\d{2}$/.test(btn.textContent)
      );

      if (timeSlots.length > 0) {
        fireEvent.click(timeSlots[0]);
      }

      await waitFor(() => {
        expect(screen.getByText('Your Information')).toBeInTheDocument();
      });

      // Test invalid email formats
      const invalidEmails = [
        'invalid-email',
        '@invalid.com',
        'invalid@',
        'invalid..email@test.com',
        'invalid@email@test.com',
        'invalid@.com',
      ];

      const emailInput = screen.getByLabelText(/email/i);

      invalidEmails.forEach(email => {
        fireEvent.change(emailInput, { target: { value: email } });

        // Should show validation error
        expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
      });

      // Test valid email
      fireEvent.change(emailInput, { target: { value: 'valid@example.com' } });

      // Should not show validation error
      expect(screen.queryByText(/invalid email format/i)).not.toBeInTheDocument();
    });

    it('validates phone number formats', async () => {
      render(<BookingWizard initialService={mockService} />);

      // Navigate to details step
      const timeSlots = screen.getAllByRole('button').filter(btn =>
        btn.textContent && /^\d{1,2}:\d{2}$/.test(btn.textContent)
      );

      if (timeSlots.length > 0) {
        fireEvent.click(timeSlots[0]);
      }

      await waitFor(() => {
        expect(screen.getByText('Your Information')).toBeInTheDocument();
      });

      const phoneInput = screen.getByLabelText(/phone/i);

      // Test invalid phone formats
      const invalidPhones = [
        '123', // Too short
        'abcdef', // Letters only
        '+1234567890123456', // Too long
      ];

      invalidPhones.forEach(phone => {
        fireEvent.change(phoneInput, { target: { value: phone } });

        // Should show validation error
        expect(screen.getByText(/invalid phone number/i)).toBeInTheDocument();
      });

      // Test valid phone numbers
      const validPhones = [
        '+48 123 456 789',
        '+1 555-123-4567',
        '1234567890',
      ];

      validPhones.forEach(phone => {
        fireEvent.change(phoneInput, { target: { value: phone } });

        // Should not show validation error
        expect(screen.queryByText(/invalid phone number/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Concurrent Operation Scenarios', () => {
    it('handles double-click prevention on booking submission', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const mockInsert = vi.fn().mockResolvedValue({
        data: { id: 'booking_123' },
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      render(<BookingWizard initialService={mockService} />);

      // Complete form
      const timeSlots = screen.getAllByRole('button').filter(btn =>
        btn.textContent && /^\d{1,2}:\d{2}$/.test(btn.textContent)
      );

      if (timeSlots.length > 0) {
        fireEvent.click(timeSlots[0]);
      }

      await waitFor(() => {
        expect(screen.getByText('Your Information')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);

      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      const termsCheckbox = screen.getByLabelText(/terms and conditions/i);
      fireEvent.click(termsCheckbox);

      const continueButton = screen.getByText('Continue to Payment');

      // Double-click rapidly
      fireEvent.click(continueButton);
      fireEvent.click(continueButton);
      fireEvent.click(continueButton);

      // Should only call API once
      await waitFor(() => {
        expect(mockInsert).toHaveBeenCalledTimes(1);
      }, { timeout: 3000 });
    });

    it('handles race conditions in time slot selection', async () => {
      // Mock multiple simultaneous slot availability checks
      vi.doMock('@/hooks/useSlotGeneration', () => ({
        useSlotGeneration: () => ({
          slots: [
            { time: new Date('2030-01-01T10:00:00.000Z'), available: true },
            { time: new Date('2030-01-01T11:00:00.000Z'), available: true },
          ],
          loading: false,
          error: null,
        }),
      }));

      const mockSupabase = createMockSupabaseClient();
      const mockInsert = vi.fn()
        .mockResolvedValueOnce({ data: null, error: { message: 'Slot taken' } })
        .mockResolvedValueOnce({ data: { id: 'booking_456' }, error: null });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      } as any);

      vi.doMock('@/integrations/supabase/client', () => ({
        supabase: mockSupabase,
      }));

      render(<BookingWizard initialService={mockService} />);

      const timeSlots = screen.getAllByRole('button').filter(btn =>
        btn.textContent && /^\d{1,2}:\d{2}$/.test(btn.textContent)
      );

      if (timeSlots.length > 0) {
        // Simulate concurrent booking attempts
        fireEvent.click(timeSlots[0]);
      }

      await waitFor(() => {
        expect(screen.getByText('Your Information')).toBeInTheDocument();
      });

      // Complete form quickly
      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);

      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      const termsCheckbox = screen.getByLabelText(/terms and conditions/i);
      fireEvent.click(termsCheckbox);

      const continueButton = screen.getByText('Continue to Payment');
      fireEvent.click(continueButton);

      // Should handle race condition gracefully
      await waitFor(() => {
        expect(screen.getByText(/slot no longer available/i)).toBeInTheDocument();
      });
    });
  });

  describe('Browser Compatibility Edge Cases', () => {
    it('handles browsers without proper date support', async () => {
      // Mock lack of proper Date support
      const originalDate = global.Date;
      global.Date = vi.fn(() => new originalDate('2030-01-01')) as any;
      global.Date.UTC = originalDate.UTC;
      global.Date.parse = originalDate.parse;
      global.Date.now = originalDate.now;

      render(<BookingWizard initialService={mockService} />);

      // Should still work with limited Date support
      expect(screen.getByText(mockService.name)).toBeInTheDocument();

      // Restore original Date
      global.Date = originalDate;
    });

    it('handles localStorage unavailability', async () => {
      // Mock localStorage being unavailable
      const originalLocalStorage = global.localStorage;
      Object.defineProperty(global, 'localStorage', {
        value: {
          getItem: vi.fn(() => { throw new Error('Storage unavailable'); }),
          setItem: vi.fn(() => { throw new Error('Storage unavailable'); }),
          removeItem: vi.fn(),
          clear: vi.fn(),
        },
        writable: true,
      });

      render(<BookingWizard initialService={mockService} />);

      // Should work without localStorage
      expect(screen.getByText(mockService.name)).toBeInTheDocument();

      // Restore original localStorage
      global.localStorage = originalLocalStorage;
    });

    it('handles network connectivity issues', async () => {
      // Mock navigator.onLine as false
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      render(<BookingWizard />);

      // Should show offline message
      await waitFor(() => {
        expect(screen.getByText(/offline mode/i)).toBeInTheDocument();
      });

      // Restore online status
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });
    });
  });

  describe('Resource Cleanup Tests', () => {
    it('properly cleans up intervals and timeouts on unmount', async () => {
      const { unmount } = render(<BookingWizard initialService={mockService} />);

      // Mock some intervals/timeouts that might be created
      const mockSetInterval = vi.fn();
      const mockSetTimeout = vi.fn();
      const mockClearInterval = vi.fn();
      const mockClearTimeout = vi.fn();

      global.setInterval = mockSetInterval;
      global.setTimeout = mockSetTimeout;
      global.clearInterval = mockClearInterval;
      global.clearTimeout = mockClearTimeout;

      // Unmount component
      unmount();

      // Cleanup functions should be called
      expect(mockClearInterval).toHaveBeenCalled();
      expect(mockClearTimeout).toHaveBeenCalled();
    });

    it('prevents memory leaks with large datasets', async () => {
      const largeServiceList = Array.from({ length: 1000 }, (_, i) =>
        createMockService({ id: `svc_${i}`, name: `Service ${i}` })
      );

      const { unmount } = render(
        <div>
          {largeServiceList.map(service => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      );

      await waitFor(() => {
        expect(screen.getAllByText(/Service \d+/)).toHaveLength(1000);
      });

      // Unmount should clean up properly
      unmount();

      // Components should be removed from DOM
      expect(screen.queryByText(/Service \d+/)).not.toBeInTheDocument();
    });
  });
});