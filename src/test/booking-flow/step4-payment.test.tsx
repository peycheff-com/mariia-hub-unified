import { describe, it, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@/test/utils/test-utilities';
import { QueryClient } from '@tanstack/react-query';
import Step4Payment from '@/components/booking/Step4Payment';
import { createService, createTimeSlot, createMockBooking } from '@/test/factories/extended-factories';
import { BookingService } from '@/services/booking.service';
import { loadStripe } from '@stripe/stripe-js';
import * as bookingStoreModule from '@/stores/bookingStore';

// Mock Stripe
const mockStripe = {
  elements: vi.fn(),
  confirmPayment: vi.fn(),
  confirmCardPayment: vi.fn(),
  retrievePaymentIntent: vi.fn(),
};

// Mock Stripe Elements
const mockElements = {
  create: vi.fn(),
  getElement: vi.fn(),
  update: vi.fn(),
  fetchUpdates: vi.fn(),
  submit: vi.fn(),
};

// Mock card element
const mockCardElement = {
  mount: vi.fn(),
  unmount: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  focus: vi.fn(),
  blur: vi.fn(),
  clear: vi.fn(),
  destroy: vi.fn(),
  update: vi.fn(),
};

// Mock the booking store
const mockSelectedService = createService({
  id: 'test-service-id',
  title: 'Test Service',
  price: 200,
  currency: 'PLN',
});
const mockSelectedTimeSlot = createTimeSlot({
  id: 'test-slot-id',
  start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
});
const mockBookingDetails = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+48123456789',
};

vi.mock('@/stores/bookingStore', () => ({
  useBookingStore: () => ({
    selectedService: mockSelectedService,
    selectedTimeSlot: mockSelectedTimeSlot,
    details: mockBookingDetails,
    canProceed: { step4: true },
    currentStep: 4,
  }),
}));

vi.mock('@stripe/react-stripe-js', () => ({
  useStripe: () => mockStripe,
  useElements: () => mockElements,
  Elements: ({ children }: any) => children,
  loadStripe: vi.fn().mockResolvedValue(mockStripe),
}));

describe('Step4Payment - Payment Processing', () => {
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
      createBooking: vi.fn(),
      confirmBooking: vi.fn(),
      cancelBooking: vi.fn(),
      saveBookingDraft: vi.fn(),
      getBookingDraft: vi.fn(),
    };

    vi.spyOn(BookingService.prototype, 'constructor').mockImplementation(() => mockBookingService);

    // Mock Stripe element creation
    mockElements.create.mockReturnValue(mockCardElement);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    test('should render payment interface', async () => {
      const { render } = await import('@/test/utils/test-utilities');
      render(<Step4Payment />);

      expect(screen.getByText('Payment')).toBeInTheDocument();
      expect(screen.getByText('Complete your booking by providing payment information')).toBeInTheDocument();
    });

    test('should display booking summary', async () => {
      const { render } = await import('@/test/utils/test-utilities');
      render(<Step4Payment />);

      expect(screen.getByText('Booking Summary')).toBeInTheDocument();
      expect(screen.getByText(mockSelectedService.title)).toBeInTheDocument();
      expect(screen.getByText(mockBookingDetails.name)).toBeInTheDocument();
      expect(screen.getByText(mockBookingDetails.email)).toBeInTheDocument();

      const startTime = new Date(mockSelectedTimeSlot.start_time);
      const formattedDate = startTime.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      expect(screen.getByText(formattedDate)).toBeInTheDocument();
    });

    test('should display pricing information', async () => {
      const { render } = await import('@/test/utils/test-utilities');
      render(<Step4Payment />);

      expect(screen.getByText('Price Details')).toBeInTheDocument();
      expect(screen.getByText(mockSelectedService.title)).toBeInTheDocument();
      expect(screen.getByText(`${mockSelectedService.price} ${mockSelectedService.currency}`)).toBeInTheDocument();

      // Should show total
      expect(screen.getByText('Total')).toBeInTheDocument();
      expect(screen.getByText(`${mockSelectedService.price} ${mockSelectedService.currency}`)).toBeInTheDocument();
    });

    test('should show payment form', async () => {
      const { render } = await import('@/test/utils/test-utilities');
      render(<Step4Payment />);

      expect(screen.getByText('Payment Information')).toBeInTheDocument();
      expect(screen.getByTestId('card-element')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /pay now/i })).toBeInTheDocument();
    });

    test('should show loading state while initializing Stripe', async () => {
      // Mock delayed Stripe loading
      (loadStripe as any).mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve(mockStripe), 100))
      );

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step4Payment />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText('Initializing payment...')).toBeInTheDocument();
    });
  });

  describe('Payment Processing', () => {
    beforeEach(() => {
      mockStripe.confirmPayment.mockResolvedValue({
        paymentIntent: {
          status: 'succeeded',
          id: 'pi_test_123',
        },
        error: null,
      });
    });

    test('should create payment intent when component mounts', async () => {
      const { render } = await import('@/test/utils/test-utilities');
      render(<Step4Payment />);

      await waitFor(() => {
        expect(mockElements.create).toHaveBeenCalledWith('payment', {
          mode: 'payment',
          currency: mockSelectedService.currency.toLowerCase(),
          amount: mockSelectedService.price * 100, // Convert to cents
        });
      });
    });

    test('should handle successful payment', async () => {
      const mockBooking = createMockBooking({
        status: 'confirmed',
        payment_status: 'paid',
      });

      mockBookingService.createBooking.mockResolvedValue({
        data: mockBooking,
        error: null,
      });
      mockBookingService.confirmBooking.mockResolvedValue({
        data: mockBooking,
        error: null,
      });

      const { render, userEvent } = await import('@/test/utils/test-utilities');
      render(<Step4Payment />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /pay now/i })).toBeInTheDocument();
      });

      const payButton = screen.getByRole('button', { name: /pay now/i });
      expect(payButton).not.toBeDisabled();

      fireEvent.click(payButton);

      await waitFor(() => {
        expect(mockStripe.confirmPayment).toHaveBeenCalled();
        expect(mockBookingService.createBooking).toHaveBeenCalled();
        expect(mockBookingService.confirmBooking).toHaveBeenCalledWith(
          mockBooking.id,
          expect.any(String) // payment ID
        );
      });

      // Should show success message
      await waitFor(() => {
        expect(screen.getByText('Payment Successful!')).toBeInTheDocument();
        expect(screen.getByText('Your booking has been confirmed')).toBeInTheDocument();
      });
    });

    test('should handle payment failure', async () => {
      mockStripe.confirmPayment.mockResolvedValue({
        error: {
          message: 'Your card was declined.',
          type: 'card_error',
        },
      });

      const { render, userEvent } = await import('@/test/utils/test-utilities');
      render(<Step4Payment />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /pay now/i })).toBeInTheDocument();
      });

      const payButton = screen.getByRole('button', { name: /pay now/i });
      fireEvent.click(payButton);

      await waitFor(() => {
        expect(screen.getByText('Payment Failed')).toBeInTheDocument();
        expect(screen.getByText('Your card was declined.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      });

      // Should not create booking
      expect(mockBookingService.createBooking).not.toHaveBeenCalled();
    });

    test('should handle network error during payment', async () => {
      mockStripe.confirmPayment.mockRejectedValue(new Error('Network error'));

      const { render, userEvent } = await import('@/test/utils/test-utilities');
      render(<Step4Payment />);

      const payButton = screen.getByRole('button', { name: /pay now/i });
      fireEvent.click(payButton);

      await waitFor(() => {
        expect(screen.getByText('Payment Error')).toBeInTheDocument();
        expect(screen.getByText('A network error occurred. Please check your connection and try again.')).toBeInTheDocument();
      });
    });

    test('should disable pay button during processing', async () => {
      // Mock delayed payment processing
      mockStripe.confirmPayment.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({
          paymentIntent: { status: 'succeeded', id: 'pi_test_123' },
          error: null,
        }), 100))
      );

      const { render, userEvent } = await import('@/test/utils/test-utilities');
      render(<Step4Payment />);

      const payButton = screen.getByRole('button', { name: /pay now/i });
      fireEvent.click(payButton);

      // Button should be disabled during processing
      expect(payButton).toBeDisabled();
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText('Processing payment...')).toBeInTheDocument();
    });
  });

  describe('Card Element Integration', () => {
    test('should mount card element when Stripe is ready', async () => {
      const { render } = await import('@/test/utils/test-utilities');
      render(<Step4Payment />);

      await waitFor(() => {
        expect(mockElements.create).toHaveBeenCalledWith('payment', expect.any(Object));
        expect(mockCardElement.mount).toHaveBeenCalledWith('#card-element');
      });
    });

    test('should handle card element errors', async () => {
      mockCardElement.addEventListener.mockImplementation((event, callback) => {
        if (event === 'change') {
          callback({
            error: { message: 'Invalid card number' },
            complete: false,
          });
        }
      });

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step4Payment />);

      await waitFor(() => {
        expect(screen.getByText('Invalid card number')).toBeInTheDocument();
      });

      const payButton = screen.getByRole('button', { name: /pay now/i });
      expect(payButton).toBeDisabled();
    });

    test('should enable pay button when card is complete', async () => {
      mockCardElement.addEventListener.mockImplementation((event, callback) => {
        if (event === 'change') {
          callback({
            error: null,
            complete: true,
          });
        }
      });

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step4Payment />);

      await waitFor(() => {
        const payButton = screen.getByRole('button', { name: /pay now/i });
        expect(payButton).not.toBeDisabled();
      });
    });

    test('should handle card element focus and blur events', async () => {
      const { render } = await import('@/test/utils/test-utilities');
      render(<Step4Payment />);

      await waitFor(() => {
        expect(mockCardElement.addEventListener).toHaveBeenCalledWith('focus', expect.any(Function));
        expect(mockCardElement.addEventListener).toHaveBeenCalledWith('blur', expect.any(Function));
      });
    });
  });

  describe('Alternative Payment Methods', () => {
    test('should show payment method options', async () => {
      const { render } = await import('@/test/utils/test-utilities');
      render(<Step4Payment />);

      expect(screen.getByText('Payment Method')).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /credit card/i })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /apple pay/i })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /google pay/i })).toBeInTheDocument();
    });

    test('should switch payment methods', async () => {
      const { render, userEvent } = await import('@/test/utils/test-utilities');
      render(<Step4Payment />);

      const applePayRadio = screen.getByRole('radio', { name: /apple pay/i });
      await userEvent.click(applePayRadio);

      await waitFor(() => {
        expect(screen.getByText('Apple Pay')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /pay with apple pay/i })).toBeInTheDocument();
      });
    });

    test('should handle Apple Pay payment', async () => {
      const { render, userEvent } = await import('@/test/utils/test-utilities');
      render(<Step4Payment />);

      const applePayRadio = screen.getByRole('radio', { name: /apple pay/i });
      await userEvent.click(applePayRadio);

      const applePayButton = screen.getByRole('button', { name: /pay with apple pay/i });
      fireEvent.click(applePayButton);

      await waitFor(() => {
        // Should trigger Apple Pay payment flow
        expect(screen.getByText('Opening Apple Pay...')).toBeInTheDocument();
      });
    });
  });

  describe('Booking Creation', () => {
    test('should create booking before payment confirmation', async () => {
      const mockBooking = createMockBooking({
        status: 'pending',
        payment_status: 'pending',
      });

      mockBookingService.createBooking.mockResolvedValue({
        data: mockBooking,
        error: null,
      });
      mockStripe.confirmPayment.mockResolvedValue({
        paymentIntent: {
          status: 'succeeded',
          id: 'pi_test_123',
        },
        error: null,
      });

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step4Payment />);

      const payButton = screen.getByRole('button', { name: /pay now/i });
      fireEvent.click(payButton);

      await waitFor(() => {
        expect(mockBookingService.createBooking).toHaveBeenCalledWith({
          service_id: mockSelectedService.id,
          start_time: mockSelectedTimeSlot.start_time,
          end_time: expect.any(String),
          total_price: mockSelectedService.price,
          currency: mockSelectedService.currency,
          client_info: {
            name: mockBookingDetails.name,
            email: mockBookingDetails.email,
            phone: mockBookingDetails.phone,
          },
          payment_method: 'stripe',
        });
      });
    });

    test('should handle booking creation failure', async () => {
      mockBookingService.createBooking.mockRejectedValue(new Error('Failed to create booking'));

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step4Payment />);

      const payButton = screen.getByRole('button', { name: /pay now/i });
      fireEvent.click(payButton);

      await waitFor(() => {
        expect(screen.getByText('Booking Error')).toBeInTheDocument();
        expect(screen.getByText('Failed to create booking. Please try again.')).toBeInTheDocument();
      });

      // Should not process payment
      expect(mockStripe.confirmPayment).not.toHaveBeenCalled();
    });

    test('should confirm booking after successful payment', async () => {
      const mockBooking = createMockBooking({
        status: 'pending',
        payment_status: 'pending',
      });

      mockBookingService.createBooking.mockResolvedValue({
        data: mockBooking,
        error: null,
      });
      mockStripe.confirmPayment.mockResolvedValue({
        paymentIntent: {
          status: 'succeeded',
          id: 'pi_test_123',
        },
        error: null,
      });
      mockBookingService.confirmBooking.mockResolvedValue({
        data: { ...mockBooking, status: 'confirmed', payment_status: 'paid' },
        error: null,
      });

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step4Payment />);

      const payButton = screen.getByRole('button', { name: /pay now/i });
      fireEvent.click(payButton);

      await waitFor(() => {
        expect(mockBookingService.confirmBooking).toHaveBeenCalledWith(
          mockBooking.id,
          'pi_test_123'
        );
      });
    });
  });

  describe('Security Features', () => {
    test('should show security indicators', async () => {
      const { render } = await import('@/test/utils/test-utilities');
      render(<Step4Payment />);

      expect(screen.getByText('Secure Payment')).toBeInTheDocument();
      expect(screen.getByTestId('security-badges')).toBeInTheDocument();
      expect(screen.getByAltText(/ssl secured/i)).toBeInTheDocument();
      expect(screen.getByAltText(/pci compliant/i)).toBeInTheDocument();
    });

    test('should show 3D Secure verification when required', async () => {
      mockStripe.confirmPayment.mockResolvedValue({
        error: {
          type: 'card_error',
          code: 'authentication_required',
          message: 'Additional authentication required',
        },
      });

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step4Payment />);

      const payButton = screen.getByRole('button', { name: /pay now/i });
      fireEvent.click(payButton);

      await waitFor(() => {
        expect(screen.getByText('Additional Verification Required')).toBeInTheDocument();
        expect(screen.getByText('Your bank requires additional verification to complete this payment.')).toBeInTheDocument();
      });
    });

    test('should handle session timeout', async () => {
      vi.useFakeTimers();

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step4Payment />);

      // Fast-forward 30 minutes (session timeout)
      vi.advanceTimersByTime(30 * 60 * 1000);

      await waitFor(() => {
        expect(screen.getByText('Session Expired')).toBeInTheDocument();
        expect(screen.getByText('Your session has expired. Please start your booking again.')).toBeInTheDocument();
      });

      vi.useRealTimers();
    });
  });

  describe('Polish VAT Compliance', () => {
    test('should display VAT information for Polish customers', async () => {
      // Set location to Poland
      Object.defineProperty(navigator, 'language', {
        value: 'pl-PL',
        configurable: true,
      });

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step4Payment />);

      expect(screen.getByText('VAT Information')).toBeInTheDocument();
      expect(screen.getByText('VAT Rate: 23%')).toBeInTheDocument();
      expect(screen.getByText('VAT Amount:')).toBeInTheDocument();
    });

    test('should show company name and NIP for B2B', async () => {
      const { render, userEvent } = await import('@/test/utils/test-utilities');
      render(<Step4Payment />);

      // Enable B2B mode
      const b2bCheckbox = screen.getByRole('checkbox', { name: /business purchase/i });
      await userEvent.click(b2bCheckbox);

      await waitFor(() => {
        expect(screen.getByLabelText(/company name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/nip \(tax id\)/i)).toBeInTheDocument();
      });
    });

    test('should validate NIP format', async () => {
      const { render, userEvent } = await import('@/test/utils/test-utilities');
      render(<Step4Payment />);

      const b2bCheckbox = screen.getByRole('checkbox', { name: /business purchase/i });
      await userEvent.click(b2bCheckbox);

      const nipInput = screen.getByLabelText(/nip \(tax id\)/i);
      await userEvent.type(nipInput, '123'); // Invalid NIP

      const payButton = screen.getByRole('button', { name: /pay now/i });
      fireEvent.click(payButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid NIP number')).toBeInTheDocument();
      });
    });
  });

  describe('Receipt and Confirmation', () => {
    test('should show receipt after successful payment', async () => {
      const mockBooking = createMockBooking({
        status: 'confirmed',
        payment_status: 'paid',
      });

      mockBookingService.createBooking.mockResolvedValue({
        data: mockBooking,
        error: null,
      });
      mockStripe.confirmPayment.mockResolvedValue({
        paymentIntent: {
          status: 'succeeded',
          id: 'pi_test_123',
        },
        error: null,
      });
      mockBookingService.confirmBooking.mockResolvedValue({
        data: mockBooking,
        error: null,
      });

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step4Payment />);

      const payButton = screen.getByRole('button', { name: /pay now/i });
      fireEvent.click(payButton);

      await waitFor(() => {
        expect(screen.getByText('Payment Receipt')).toBeInTheDocument();
        expect(screen.getByText(`Booking ID: ${mockBooking.id}`)).toBeInTheDocument();
        expect(screen.getByText('Payment ID: pi_test_123')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /download receipt/i })).toBeInTheDocument();
      });
    });

    test('should send email confirmation', async () => {
      const mockBooking = createMockBooking();

      mockBookingService.createBooking.mockResolvedValue({
        data: mockBooking,
        error: null,
      });
      mockStripe.confirmPayment.mockResolvedValue({
        paymentIntent: {
          status: 'succeeded',
          id: 'pi_test_123',
        },
        error: null,
      });

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step4Payment />);

      const payButton = screen.getByRole('button', { name: /pay now/i });
      fireEvent.click(payButton);

      await waitFor(() => {
        expect(screen.getByText('Confirmation email sent to')).toBeInTheDocument();
        expect(screen.getByText(mockBookingDetails.email)).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    test('should go back to details', async () => {
      const { render } = await import('@/test/utils/test-utilities');
      render(<Step4Payment />);

      const backButton = screen.getByRole('button', { name: /back/i });
      expect(backButton).toBeInTheDocument();
    });

    test('should allow cancellation before payment', async () => {
      const { render } = await import('@/test/utils/test-utilities');
      render(<Step4Payment />);

      const cancelButton = screen.getByRole('button', { name: /cancel booking/i });
      expect(cancelButton).toBeInTheDocument();

      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.getByText('Cancel Booking?')).toBeInTheDocument();
        expect(screen.getByText('Are you sure you want to cancel your booking?')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /yes, cancel/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /no, keep booking/i })).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels', async () => {
      const { render } = await import('@/test/utils/test-utilities');
      render(<Step4Payment />);

      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('form', { name: /payment form/i })).toBeInTheDocument();

      const payButton = screen.getByRole('button', { name: /pay now/i });
      expect(payButton).toHaveAttribute('aria-describedby', 'payment-amount');
    });

    test('should announce payment status to screen readers', async () => {
      mockStripe.confirmPayment.mockResolvedValue({
        paymentIntent: {
          status: 'succeeded',
          id: 'pi_test_123',
        },
        error: null,
      });

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step4Payment />);

      const payButton = screen.getByRole('button', { name: /pay now/i });
      fireEvent.click(payButton);

      await waitFor(() => {
        const statusRegion = screen.getByRole('status');
        expect(statusRegion).toHaveTextContent(/payment successful/i);
      });
    });

    test('should support keyboard navigation', async () => {
      const { render, userEvent } = await import('@/test/utils/test-utilities');
      render(<Step4Payment />);

      await userEvent.tab();
      const firstElement = screen.getByRole('radio', { name: /credit card/i });
      expect(firstElement).toHaveFocus();

      await userEvent.tab();
      const payButton = screen.getByRole('button', { name: /pay now/i });
      expect(payButton).toHaveFocus();
    });
  });

  describe('Error Handling', () => {
    test('should handle Stripe initialization failure', async () => {
      (loadStripe as any).mockRejectedValue(new Error('Failed to load Stripe'));

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step4Payment />);

      await waitFor(() => {
        expect(screen.getByText('Payment System Unavailable')).toBeInTheDocument();
        expect(screen.getByText('Unable to initialize payment system. Please refresh the page and try again.')).toBeInTheDocument();
      });
    });

    test('should handle booking confirmation failure after payment', async () => {
      const mockBooking = createMockBooking();

      mockBookingService.createBooking.mockResolvedValue({
        data: mockBooking,
        error: null,
      });
      mockStripe.confirmPayment.mockResolvedValue({
        paymentIntent: {
          status: 'succeeded',
          id: 'pi_test_123',
        },
        error: null,
      });
      mockBookingService.confirmBooking.mockRejectedValue(new Error('Failed to confirm booking'));

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step4Payment />);

      const payButton = screen.getByRole('button', { name: /pay now/i });
      fireEvent.click(payButton);

      await waitFor(() => {
        expect(screen.getByText('Payment Processed')).toBeInTheDocument();
        expect(screen.getByText('Your payment was successful but there was an issue confirming your booking.')).toBeInTheDocument();
        expect(screen.getByText('Please contact support with your payment ID: pi_test_123')).toBeInTheDocument();
      });
    });
  });
});