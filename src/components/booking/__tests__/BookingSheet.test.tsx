import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';

import { render, screen, fireEvent, waitFor, within, act } from '@/test/utils';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { BookingProvider } from '@/contexts/BookingContext';

import BookingSheet from '../BookingSheet';

import i18n from '@/i18n';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: [
            {
              id: 'svc_1',
              title: 'Lip Enhancement',
              service_type: 'beauty',
              duration_minutes: 60,
              price_from: 150,
              is_active: true,
              max_group_size: 1
            },
            {
              id: 'svc_2',
              title: 'Personal Training',
              service_type: 'fitness',
              duration_minutes: 90,
              price_from: 200,
              is_active: true,
              max_group_size: 10
            }
          ],
          error: null
        }))
      }))
    })),
    auth: {
      getUser: vi.fn(() => ({
        data: {
          user: {
            id: 'user_123'
          }
        }
      }))
    }
  }
}));

// Mock toast
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

// Mock booking store
const mockBookingStore = {
  selectedService: null,
  selectedTimeSlot: null,
  bookingDetails: null,
  isGroupBooking: false,
  groupSize: 1,
  groupParticipants: [],
  originalPrice: 0,
  discountAmount: 0,
  appliedPricingRules: [],
  capacityInfo: null,
  waitlistMode: false,
  waitlistEntry: null,
  step: 1,
  canProceed: false,
  totalPrice: 0,
  selectService: vi.fn(),
  selectTimeSlot: vi.fn(),
  updateDetails: vi.fn(),
  setGroupBooking: vi.fn(),
  setGroupSize: vi.fn(),
  setGroupParticipants: vi.fn(),
  applyPricingRules: vi.fn(),
  calculatePrice: vi.fn(),
  checkCapacity: vi.fn(),
  setWaitlistMode: vi.fn(),
  setWaitlistEntry: vi.fn(),
  joinWaitlist: vi.fn(),
  resetBooking: vi.fn()
};

vi.mock('@/stores/bookingStore', () => ({
  useBookingStore: () => mockBookingStore
}));

const createTestWrapper = (children: React.ReactNode) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0
      }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <I18nextProvider i18n={i18n}>
          <CurrencyProvider>
            <BookingProvider>
              {children}
            </BookingProvider>
          </CurrencyProvider>
        </I18nextProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('BookingSheet', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset sessionStorage
    sessionStorage.clear();
    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1280
    });
  });

  describe('Initial Rendering', () => {
    it('renders nothing when not open', () => {
      const { container } = render(
        createTestWrapper(
          <BookingSheet isOpen={false} onClose={mockOnClose} />
        )
      );

      expect(container).toBeEmptyDOMElement();
    });

    it('renders booking sheet when open', async () => {
      render(
        createTestWrapper(
          <BookingSheet isOpen={true} onClose={mockOnClose} />
        )
      );

      await waitFor(() => {
        expect(screen.getByText('Choose Service & Location')).toBeInTheDocument();
        expect(screen.getByText('Step 1 of 4')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
      });
    });

    it('displays progress indicators correctly', async () => {
      render(
        createTestWrapper(
          <BookingSheet isOpen={true} onClose={mockOnClose} />
        )
      );

      await waitFor(() => {
        expect(screen.getByText('Service')).toBeInTheDocument();
        expect(screen.getByText('Time')).toBeInTheDocument();
        expect(screen.getByText('Details')).toBeInTheDocument();
        expect(screen.getByText('Payment')).toBeInTheDocument();
      });
    });

    it('shows loading state initially', async () => {
      render(
        createTestWrapper(
          <BookingSheet isOpen={true} onClose={mockOnClose} />
        )
      );

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });

  describe('Service Selection', () => {
    it('displays service options', async () => {
      render(
        createTestWrapper(
          <BookingSheet isOpen={true} onClose={mockOnClose} />
        )
      );

      await waitFor(() => {
        expect(screen.getByText('Lip Enhancement')).toBeInTheDocument();
        expect(screen.getByText('Personal Training')).toBeInTheDocument();
      });
    });

    it('allows service selection', async () => {
      const user = userEvent.setup();

      render(
        createTestWrapper(
          <BookingSheet isOpen={true} onClose={mockOnClose} />
        )
      );

      await waitFor(() => {
        expect(screen.getByText('Lip Enhancement')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Lip Enhancement'));

      expect(mockBookingStore.selectService).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'svc_1',
          title: 'Lip Enhancement'
        })
      );
    });

    it('handles preselected service', async () => {
      render(
        createTestWrapper(
          <BookingSheet
            isOpen={true}
            onClose={mockOnClose}
            preselectedService="svc_1"
            preselectedType="beauty"
          />
        )
      );

      await waitFor(() => {
        expect(mockBookingStore.selectService).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'svc_1'
          })
        );
      });
    });

    it('validates service selection before proceeding', async () => {
      render(
        createTestWrapper(
          <BookingSheet isOpen={true} onClose={mockOnClose} />
        )
      );

      await waitFor(() => {
        expect(screen.getByText('Choose Service & Location')).toBeInTheDocument();
      });

      const continueButton = screen.queryByRole('button', { name: /continue/i });
      if (continueButton) {
        expect(continueButton).toBeDisabled();
      }
    });
  });

  describe('Group Booking', () => {
    it('shows group booking toggle for services that support it', async () => {
      // Mock service that supports group booking
      mockBookingStore.selectedService = {
        id: 'svc_2',
        title: 'Personal Training',
        service_type: 'fitness',
        max_group_size: 10
      };

      render(
        createTestWrapper(
          <BookingSheet isOpen={true} onClose={mockOnClose} />
        )
      );

      await waitFor(() => {
        expect(screen.getByTestId('group-booking-toggle')).toBeInTheDocument();
      });
    });

    it('handles group size selection', async () => {
      const user = userEvent.setup();

      mockBookingStore.selectedService = {
        id: 'svc_2',
        title: 'Personal Training',
        service_type: 'fitness',
        max_group_size: 10
      };

      render(
        createTestWrapper(
          <BookingSheet isOpen={true} onClose={mockOnClose} />
        )
      );

      await waitFor(() => {
        expect(screen.getByTestId('group-booking-toggle')).toBeInTheDocument();
      });

      // Enable group booking
      await user.click(screen.getByTestId('group-booking-toggle'));

      expect(mockBookingStore.setGroupBooking).toHaveBeenCalledWith(true);

      // Select group size
      const sizeSelector = screen.getByTestId('group-size-selector');
      await user.selectOptions(sizeSelector, '5');

      expect(mockBookingStore.setGroupSize).toHaveBeenCalledWith(5);
    });
  });

  describe('Time Selection', () => {
    beforeEach(() => {
      mockBookingStore.selectedService = {
        id: 'svc_1',
        title: 'Lip Enhancement',
        service_type: 'beauty',
        duration_minutes: 60
      };
    });

    it('proceeds to time selection after service selection', async () => {
      render(
        createTestWrapper(
          <BookingSheet isOpen={true} onClose={mockOnClose} />
        )
      );

      await waitFor(() => {
        expect(screen.getByText('Choose Service & Location')).toBeInTheDocument();
      });

      // Simulate service selection
      act(() => {
        mockBookingStore.selectedService = {
          id: 'svc_1',
          title: 'Lip Enhancement'
        };
      });

      await waitFor(() => {
        expect(screen.getByText('Select Date & Time')).toBeInTheDocument();
      });
    });

    it('checks capacity for selected time slot', async () => {
      render(
        createTestWrapper(
          <BookingSheet isOpen={true} onClose={mockOnClose} />
        )
      );

      // Simulate time slot selection
      act(() => {
        mockBookingStore.selectedTimeSlot = {
          id: 'slot_1',
          date: '2024-12-15',
          time: '10:00',
          available: true
        };
      });

      await waitFor(() => {
        expect(mockBookingStore.checkCapacity).toHaveBeenCalledWith(
          'svc_1',
          expect.any(String),
          expect.any(String),
          expect.any(Number)
        );
      });
    });

    it('handles waitlist mode when no capacity available', async () => {
      mockBookingStore.capacityInfo = {
        available: false,
        remainingCapacity: 0,
        allowsGroups: false,
        maxGroupSize: 1
      };

      render(
        createTestWrapper(
          <BookingSheet isOpen={true} onClose={mockOnClose} />
        )
      );

      // Simulate time slot selection
      act(() => {
        mockBookingStore.selectedTimeSlot = {
          id: 'slot_1',
          date: '2024-12-15',
          time: '10:00',
          available: true
        };
      });

      await waitFor(() => {
        expect(mockBookingStore.setWaitlistMode).toHaveBeenCalledWith(true);
      });
    });
  });

  describe('Client Details', () => {
    beforeEach(() => {
      mockBookingStore.selectedService = {
        id: 'svc_1',
        title: 'Lip Enhancement'
      };
      mockBookingStore.selectedTimeSlot = {
        id: 'slot_1',
        date: '2024-12-15',
        time: '10:00'
      };
    });

    it('proceeds to client details step', async () => {
      render(
        createTestWrapper(
          <BookingSheet isOpen={true} onClose={mockOnClose} />
        )
      );

      await waitFor(() => {
        expect(screen.getByText('Your Details')).toBeInTheDocument();
      });
    });

    it('validates required fields', async () => {
      const user = userEvent.setup();

      render(
        createTestWrapper(
          <BookingSheet isOpen={true} onClose={mockOnClose} />
        )
      );

      await waitFor(() => {
        expect(screen.getByText('Your Details')).toBeInTheDocument();
      });

      // Try to proceed without filling required fields
      const continueButton = screen.getByRole('button', { name: /continue/i });
      await user.click(continueButton);

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/phone is required/i)).toBeInTheDocument();
      });
    });

    it('validates email format', async () => {
      const user = userEvent.setup();

      render(
        createTestWrapper(
          <BookingSheet isOpen={true} onClose={mockOnClose} />
        )
      );

      await waitFor(() => {
        expect(screen.getByText('Your Details')).toBeInTheDocument();
      });

      // Fill with invalid email
      await user.type(screen.getByLabelText(/email/i), 'invalid-email');

      const continueButton = screen.getByRole('button', { name: /continue/i });
      await user.click(continueButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
      });
    });

    it('validates phone format', async () => {
      const user = userEvent.setup();

      render(
        createTestWrapper(
          <BookingSheet isOpen={true} onClose={mockOnClose} />
        )
      );

      await waitFor(() => {
        expect(screen.getByText('Your Details')).toBeInTheDocument();
      });

      // Fill with invalid phone
      await user.type(screen.getByLabelText(/phone/i), '123');

      const continueButton = screen.getByRole('button', { name: /continue/i });
      await user.click(continueButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid phone format/i)).toBeInTheDocument();
      });
    });

    it('requires terms acceptance', async () => {
      const user = userEvent.setup();

      render(
        createTestWrapper(
          <BookingSheet isOpen={true} onClose={mockOnClose} />
        )
      );

      await waitFor(() => {
        expect(screen.getByText('Your Details')).toBeInTheDocument();
      });

      // Fill required fields but don't accept terms
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(screen.getByLabelText(/phone/i), '+1234567890');

      const continueButton = screen.getByRole('button', { name: /continue/i });
      await user.click(continueButton);

      await waitFor(() => {
        expect(screen.getByText(/you must accept the terms/i)).toBeInTheDocument();
      });
    });

    it('handles group participants', async () => {
      mockBookingStore.isGroupBooking = true;
      mockBookingStore.groupSize = 3;

      const user = userEvent.setup();

      render(
        createTestWrapper(
          <BookingSheet isOpen={true} onClose={mockOnClose} />
        )
      );

      await waitFor(() => {
        expect(screen.getByText('Your Details')).toBeInTheDocument();
      });

      // Should show group participant inputs
      expect(screen.getByTestId('group-participants')).toBeInTheDocument();
      expect(screen.getByText(/Participant 2/i)).toBeInTheDocument();
      expect(screen.getByText(/Participant 3/i)).toBeInTheDocument();
    });
  });

  describe('Payment', () => {
    beforeEach(() => {
      mockBookingStore.selectedService = {
        id: 'svc_1',
        title: 'Lip Enhancement',
        price_from: 150
      };
      mockBookingStore.selectedTimeSlot = {
        id: 'slot_1',
        date: '2024-12-15',
        time: '10:00'
      };
      mockBookingStore.bookingDetails = {
        client_name: 'John Doe',
        client_email: 'john@example.com',
        client_phone: '+1234567890',
        consent_terms: true,
        consent_marketing: false
      };
      mockBookingStore.totalPrice = 150;
    });

    it('proceeds to payment step', async () => {
      render(
        createTestWrapper(
          <BookingSheet isOpen={true} onClose={mockOnClose} />
        )
      );

      await waitFor(() => {
        expect(screen.getByText('Payment')).toBeInTheDocument();
      });
    });

    it('displays booking summary', async () => {
      render(
        createTestWrapper(
          <BookingSheet isOpen={true} onClose={mockOnClose} />
        )
      );

      await waitFor(() => {
        expect(screen.getByText('Lip Enhancement')).toBeInTheDocument();
        expect(screen.getByText('$150.00')).toBeInTheDocument();
        expect(screen.getByText('December 15, 2024')).toBeInTheDocument();
        expect(screen.getByText('10:00')).toBeInTheDocument();
      });
    });

    it('shows payment method options', async () => {
      render(
        createTestWrapper(
          <BookingSheet isOpen={true} onClose={mockOnClose} />
        )
      );

      await waitFor(() => {
        expect(screen.getByTestId('payment-method-card')).toBeInTheDocument();
        expect(screen.getByTestId('payment-method-cash')).toBeInTheDocument();
        expect(screen.getByTestId('payment-method-gift')).toBeInTheDocument();
      });
    });

    it('validates payment form before submission', async () => {
      const user = userEvent.setup();

      render(
        createTestWrapper(
          <BookingSheet isOpen={true} onClose={mockOnClose} />
        )
      );

      await waitFor(() => {
        expect(screen.getByText('Payment')).toBeInTheDocument();
      });

      // Select card payment
      await user.click(screen.getByTestId('payment-method-card'));

      // Try to confirm without filling card details
      const confirmButton = screen.getByRole('button', { name: /confirm booking/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/card number is required/i)).toBeInTheDocument();
        expect(screen.getByText(/expiry date is required/i)).toBeInTheDocument();
        expect(screen.getByText(/cvv is required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('shows mobile layout on small screens', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });

      render(
        createTestWrapper(
          <BookingSheet isOpen={true} onClose={mockOnClose} />
        )
      );

      await waitFor(() => {
        expect(screen.getByTestId('mobile-layout')).toBeInTheDocument();
      });

      // Mobile should have bottom navigation for step progress
      expect(screen.getByTestId('mobile-step-navigation')).toBeInTheDocument();
    });

    it('shows desktop layout on large screens', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1280
      });

      render(
        createTestWrapper(
          <BookingSheet isOpen={true} onClose={mockOnClose} />
        )
      );

      await waitFor(() => {
        expect(screen.getByTestId('desktop-layout')).toBeInTheDocument();
      });

      // Desktop should show sidebar summary
      expect(screen.getByTestId('desktop-booking-summary')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles service loading errors', async () => {
      // Mock error response
      vi.mocked(require('@/integrations/supabase/client').supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            data: null,
            error: { message: 'Failed to load services' }
          }))
        }))
      } as any);

      render(
        createTestWrapper(
          <BookingSheet isOpen={true} onClose={mockOnClose} />
        )
      );

      await waitFor(() => {
        expect(screen.getByText(/error loading services/i)).toBeInTheDocument();
      });
    });

    it('handles booking submission errors', async () => {
      mockBookingStore.selectedService = {
        id: 'svc_1',
        title: 'Lip Enhancement'
      };
      mockBookingStore.selectedTimeSlot = {
        id: 'slot_1',
        date: '2024-12-15',
        time: '10:00'
      };
      mockBookingStore.bookingDetails = {
        client_name: 'John Doe',
        client_email: 'john@example.com',
        client_phone: '+1234567890',
        consent_terms: true
      };

      // Mock Supabase insert error
      vi.mocked(require('@/integrations/supabase/client').supabase.from).mockReturnValue({
        insert: vi.fn(() => ({
          error: { message: 'Booking failed' }
        }))
      } as any);

      const user = userEvent.setup();

      render(
        createTestWrapper(
          <BookingSheet isOpen={true} onClose={mockOnClose} />
        )
      );

      await waitFor(() => {
        expect(screen.getByText('Payment')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('payment-method-cash'));
      await user.click(screen.getByRole('button', { name: /confirm booking/i }));

      await waitFor(() => {
        expect(screen.getByText(/booking failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', async () => {
      render(
        createTestWrapper(
          <BookingSheet isOpen={true} onClose={mockOnClose} />
        )
      );

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        expect(dialog).toHaveAttribute('aria-labelledby');
      });
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();

      render(
        createTestWrapper(
          <BookingSheet isOpen={true} onClose={mockOnClose} />
        )
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Test Tab navigation
      await user.tab();
      expect(screen.getByRole('button', { name: /close/i })).toHaveFocus();

      await user.tab();
      // Should focus on first interactive element
      expect(document.activeElement).not.toBe(document.body);
    });

    it('traps focus within modal', async () => {
      const user = userEvent.setup();

      render(
        createTestWrapper(
          <BookingSheet isOpen={true} onClose={mockOnClose} />
        )
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Tab through all elements and end up back at the close button
      for (let i = 0; i < 20; i++) {
        await user.tab();
      }

      expect(screen.getByRole('button', { name: /close/i })).toHaveFocus();
    });

    it('closes on Escape key', async () => {
      render(
        createTestWrapper(
          <BookingSheet isOpen={true} onClose={mockOnClose} />
        )
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });
});