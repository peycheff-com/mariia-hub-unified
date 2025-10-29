import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { render, screen, fireEvent, waitFor , createMockService, createMockBooking, expectRenderPerformance } from '@/test/utils/workflow-test-utils';

// Mock external dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: [],
          error: null,
        })),
        data: [],
        error: null,
      })),
      insert: vi.fn(() => Promise.resolve({ data: { id: 'test_booking' }, error: null })),
      update: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  },
}));

vi.mock('@/hooks/useSlotGeneration', () => ({
  useSlotGeneration: () => ({
    slots: [
      { time: new Date('2030-01-01T10:00:00.000Z'), available: true },
      { time: new Date('2030-01-01T11:00:00.000Z'), available: true },
      { time: new Date('2030-01-01T14:00:00.000Z'), available: false },
    ],
    loading: false,
    error: null,
  }),
}));

vi.mock('@/hooks/useLocationFilter', () => ({
  useLocationFilter: () => ({
    filterSlotsByLocation: () => true,
  }),
}));

vi.mock('@/lib/stripe', () => ({
  createPaymentIntent: vi.fn(() =>
    Promise.resolve({ client_secret: 'test_secret', id: 'test_payment_intent' })
  ),
}));

// Import components after mocking
import { BookingWizard } from '@/components/booking/BookingWizard';

describe('Complete Booking Workflow Integration Tests', () => {
  const mockService = createMockService({
    id: 'svc_lip_blush',
    name: 'Lip Blush Enhancement',
    category: 'beauty',
    duration_minutes: 120,
    price_pln: 800,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('completes full booking flow from service selection to payment', async () => {
    const bookingContext = {
      selectedService: null,
      selectedLocation: { id: 'loc_warsaw', name: 'Warsaw' },
      selectedDate: null,
      selectedTime: null,
      clientInfo: {},
      bookingStep: 1,
      setService: vi.fn(),
      setLocation: vi.fn(),
      setDate: vi.fn(),
      setTime: vi.fn(),
      setClientInfo: vi.fn(),
      nextStep: vi.fn(),
      prevStep: vi.fn(),
      resetBooking: vi.fn(),
    };

    const renderResult = render(
      <BookingWizard initialService={mockService} />,
      {
        bookingContext,
      }
    );

    // Step 1: Service Selection
    expect(screen.getByText('Lip Blush Enhancement')).toBeInTheDocument();

    // Verify service is selected automatically when provided
    await waitFor(() => {
      expect(bookingContext.setService).toHaveBeenCalledWith(mockService);
    });

    // Step 2: Time Selection
    expect(screen.getByText('When works for you?')).toBeInTheDocument();

    // Find and click first available time slot
    const timeSlots = screen.getAllByRole('button').filter(btn =>
      btn.textContent && /^\d{1,2}:\d{2}$/.test(btn.textContent)
    );

    expect(timeSlots.length).toBeGreaterThan(0);
    fireEvent.click(timeSlots[0]);

    await waitFor(() => {
      expect(bookingContext.setTime).toHaveBeenCalled();
    });

    // Step 3: Client Details
    expect(screen.getByText('Your Information')).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const phoneInput = screen.getByLabelText(/phone/i);

    fireEvent.change(nameInput, { target: { value: 'Anna Kowalska' } });
    fireEvent.change(emailInput, { target: { value: 'anna@example.com' } });
    fireEvent.change(phoneInput, { target: { value: '+48 123 456 789' } });

    // Agree to terms
    const termsCheckbox = screen.getByLabelText(/terms and conditions/i);
    fireEvent.click(termsCheckbox);

    // Proceed to payment
    const continueButton = screen.getByText('Continue to Payment');
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(bookingContext.setClientInfo).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Anna Kowalska',
          email: 'anna@example.com',
          phone: '+48 123 456 789',
        })
      );
    });

    // Step 4: Payment
    await waitFor(() => {
      expect(screen.getByText('Payment')).toBeInTheDocument();
    });

    expect(screen.getByText('800 PLN')).toBeInTheDocument();
    expect(screen.getByText('Lip Blush Enhancement')).toBeInTheDocument();
  });

  it('handles booking flow with fitness service', async () => {
    const fitnessService = createMockService({
      id: 'svc_glutes',
      name: 'Glutes Transformation Program',
      category: 'fitness',
      duration_minutes: 60,
      price_pln: 200,
    });

    const modeContext = {
      mode: 'fitness' as const,
      setMode: vi.fn(),
      preferences: { favoriteCategory: 'fitness' },
      updatePreferences: vi.fn(),
    };

    render(
      <BookingWizard initialService={fitnessService} />,
      {
        modeContext,
      }
    );

    // Verify fitness mode is preserved
    expect(screen.getByText('Glutes Transformation Program')).toBeInTheDocument();

    // Verify fitness-specific elements are present
    await waitFor(() => {
      expect(screen.getByText('Program Details')).toBeInTheDocument();
    });
  });

  it('maintains booking state across navigation', async () => {
    const bookingContext = createMockBookingContext();

    const { rerender } = render(
      <BookingWizard initialService={mockService} />,
      { bookingContext }
    );

    // Simulate browser navigation/refresh
    const persistedState = {
      selectedService: mockService,
      selectedLocation: { id: 'loc_warsaw', name: 'Warsaw' },
      step: 2,
    };

    // Mock localStorage restoration
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');
    getItemSpy.mockReturnValue(JSON.stringify(persistedState));

    // Re-render component (simulating page reload)
    rerender(
      <BookingWizard initialService={mockService} />,
      { bookingContext }
    );

    await waitFor(() => {
      expect(screen.getByText('When works for you?')).toBeInTheDocument();
    });
  });

  it('handles concurrent booking attempts gracefully', async () => {
    const bookingContext = createMockBookingContext();

    render(
      <BookingWizard initialService={mockService} />,
      { bookingContext }
    );

    // Simulate multiple rapid clicks on time slot
    const timeSlots = screen.getAllByRole('button').filter(btn =>
      btn.textContent && /^\d{1,2}:\d{2}$/.test(btn.textContent)
    );

    if (timeSlots.length > 0) {
      // Click multiple times rapidly
      fireEvent.click(timeSlots[0]);
      fireEvent.click(timeSlots[0]);
      fireEvent.click(timeSlots[0]);
    }

    // Verify only one booking progression occurs
    await waitFor(() => {
      expect(bookingContext.setTime).toHaveBeenCalledTimes(1);
    }, { timeout: 3000 });
  });

  it('validates all required fields before proceeding', async () => {
    render(<BookingWizard initialService={mockService} />);

    // Navigate to client details step
    const timeSlots = screen.getAllByRole('button').filter(btn =>
      btn.textContent && /^\d{1,2}:\d{2}$/.test(btn.textContent)
    );

    if (timeSlots.length > 0) {
      fireEvent.click(timeSlots[0]);
    }

    await waitFor(() => {
      expect(screen.getByText('Your Information')).toBeInTheDocument();
    });

    // Try to proceed without filling required fields
    const continueButton = screen.getByText('Continue to Payment');
    fireEvent.click(continueButton);

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });

    // Continue button should be disabled
    expect(continueButton).toBeDisabled();
  });

  it('handles booking creation failure gracefully', async () => {
    // Mock booking creation failure
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.from).mockReturnValue({
      insert: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Slot no longer available' },
      }),
    } as any);

    render(<BookingWizard initialService={mockService} />);

    // Complete flow up to payment
    const timeSlots = screen.getAllByRole('button').filter(btn =>
      btn.textContent && /^\d{1,2}:\d{2}$/.test(btn.textContent)
    );

    if (timeSlots.length > 0) {
      fireEvent.click(timeSlots[0]);
    }

    await waitFor(() => {
      expect(screen.getByText('Your Information')).toBeInTheDocument();
    });

    // Fill form and try to submit
    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);

    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const termsCheckbox = screen.getByLabelText(/terms and conditions/i);
    fireEvent.click(termsCheckbox);

    const continueButton = screen.getByText('Continue to Payment');
    fireEvent.click(continueButton);

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/slot no longer available/i)).toBeInTheDocument();
    });
  });

  it('supports booking modification and cancellation', async () => {
    const existingBooking = createMockBooking({
      id: 'existing_booking',
      status: 'confirmed',
      start_time: '2030-01-01T10:00:00.000Z',
    });

    // Mock existing booking retrieval
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: existingBooking,
            error: null,
          }),
        }),
      }),
      update: vi.fn().mockResolvedValue({
        data: { ...existingBooking, status: 'cancelled' },
        error: null,
      }),
    } as any);

    render(<BookingWizard initialService={mockService} bookingId="existing_booking" />);

    // Should show existing booking details
    await waitFor(() => {
      expect(screen.getByText(/manage booking/i)).toBeInTheDocument();
    });

    // Test modification flow
    const modifyButton = screen.getByText('Modify Booking');
    fireEvent.click(modifyButton);

    // Should allow time slot change
    await waitFor(() => {
      expect(screen.getByText('When works for you?')).toBeInTheDocument();
    });
  });

  it('handles package booking workflows', async () => {
    const packageService = createMockService({
      id: 'svc_package_lips',
      name: 'Lips Transformation Package',
      category: 'beauty',
      duration_minutes: 240,
      price_pln: 2000,
      is_package: true,
      sessions_count: 3,
    });

    render(<BookingWizard initialService={packageService} isPackage={true} />);

    // Should show package-specific UI
    await waitFor(() => {
      expect(screen.getByText(/3 sessions/i)).toBeInTheDocument();
      expect(screen.getByText(/package details/i)).toBeInTheDocument();
    });

    // Should show session scheduling options
    expect(screen.getByText(/schedule all sessions/i)).toBeInTheDocument();
    expect(screen.getByText(/schedule first session only/i)).toBeInTheDocument();
  });

  it('meets performance requirements for booking flow', async () => {
    const renderTime = await expectRenderPerformance(
      <BookingWizard initialService={mockService} />,
      200 // 200ms max render time
    );

    // Component should render within performance threshold
    expect(renderTime).toBeLessThan(200);

    // Step transitions should be fast
    const startTime = performance.now();

    const timeSlots = screen.getAllByRole('button').filter(btn =>
      btn.textContent && /^\d{1,2}:\d{2}$/.test(btn.textContent)
    );

    if (timeSlots.length > 0) {
      fireEvent.click(timeSlots[0]);
    }

    await waitFor(() => {
      expect(screen.getByText('Your Information')).toBeInTheDocument();
    });

    const endTime = performance.now();
    const transitionTime = endTime - startTime;

    expect(transitionTime).toBeLessThan(100); // 100ms max for step transition
  });

  it('maintains accessibility throughout booking flow', async () => {
    render(<BookingWizard initialService={mockService} />);

    // Check for proper ARIA labels
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('navigation')).toBeInTheDocument();

    // Check for focus management
    const firstInteractiveElement = screen.getAllByRole('button')[0];
    expect(firstInteractiveElement).toHaveFocus();

    // Navigate through flow and verify focus management
    const timeSlots = screen.getAllByRole('button').filter(btn =>
      btn.textContent && /^\d{1,2}:\d{2}$/.test(btn.textContent)
    );

    if (timeSlots.length > 0) {
      fireEvent.click(timeSlots[0]);
    }

    await waitFor(() => {
      expect(screen.getByText('Your Information')).toBeInTheDocument();
    });

    // Check that form inputs have proper labels
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();

    // Check for error announcements
    const continueButton = screen.getByText('Continue to Payment');
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});