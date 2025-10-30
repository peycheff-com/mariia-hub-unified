import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { BookingWizard } from '@/components/booking/BookingWizard'
import { BookingProvider } from '@/contexts/BookingContext'
import { CurrencyProvider } from '@/contexts/CurrencyContext'
import { ModeProvider } from '@/contexts/ModeContext'

// Test data
const mockServices = [
  {
    id: 'beauty-lips',
    title: 'Rzęsy',
    service_type: 'beauty' as const,
    duration_minutes: 90,
    price_from: 300,
    price_to: 500,
    description: 'Profesjonalne przedłużanie rzęs',
    is_active: true,
    category: 'beauty',
    tags: ['rzęsy', 'piękność'],
    images: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'fitness-glutes',
    title: 'Trening Pośladków',
    service_type: 'fitness' as const,
    duration_minutes: 60,
    price_from: 150,
    price_to: 200,
    description: 'Intensywny trening pośladków',
    is_active: true,
    category: 'fitness',
    tags: ['trening', 'pośladki', 'fitness'],
    images: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
]

const mockTimeSlots = [
  {
    id: 'slot-1',
    start_time: '2024-01-15T10:00:00Z',
    end_time: '2024-01-15T11:30:00Z',
    is_available: true,
    service_id: 'beauty-lips',
    price: 350,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'slot-2',
    start_time: '2024-01-15T14:00:00Z',
    end_time: '2024-01-15T15:30:00Z',
    is_available: true,
    service_id: 'beauty-lips',
    price: 350,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
]

// Mock service functions
const mockGetServices = vi.fn()
const mockGetTimeSlots = vi.fn()
const mockCreateBooking = vi.fn()
const mockHoldTimeSlot = vi.fn()
const mockReleaseTimeSlot = vi.fn()

// Mock service imports
vi.mock('@/services/booking.service', () => ({
  bookingService: {
    getServices: mockGetServices,
    getTimeSlots: mockGetTimeSlots,
    createBooking: mockCreateBooking,
    holdTimeSlot: mockHoldTimeSlot,
    releaseTimeSlot: mockReleaseTimeSlot
  }
}))

vi.mock('@/services/stripe.service', () => ({
  stripeService: {
    createPaymentIntent: vi.fn(() => Promise.resolve({
      client_secret: 'pi_test_secret',
      payment_intent_id: 'pi_test_id'
    }))
  }
}))

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0
      },
      mutations: {
        retry: false
      }
    }
  })

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ModeProvider>
          <CurrencyProvider>
            <BookingProvider>
              {children}
            </BookingProvider>
          </CurrencyProvider>
        </ModeProvider>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('BookingWizard', () => {
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    vi.clearAllMocks()
    user = userEvent.setup()

    // Setup default mock returns
    mockGetServices.mockResolvedValue({ services: mockServices, total: 2 })
    mockGetTimeSlots.mockResolvedValue({ slots: mockTimeSlots, total: 2 })
    mockCreateBooking.mockResolvedValue({
      booking: { id: 'booking-1', status: 'confirmed' },
      payment_intent: { client_secret: 'test_secret' }
    })
    mockHoldTimeSlot.mockResolvedValue({ hold: { id: 'hold-1', expires_at: '2024-01-15T10:05:00Z' } })
    mockReleaseTimeSlot.mockResolvedValue({})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Initial Load and Navigation', () => {
    it('renders the booking wizard with step 1 active', async () => {
      render(
        <TestWrapper>
          <BookingWizard />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(/wybierz usługę/i)).toBeInTheDocument()
      })

      // Should show service selection step
      expect(screen.getByRole('heading', { name: /wybierz usługę/i })).toBeInTheDocument()
      expect(screen.getByText(/rzęsy/i)).toBeInTheDocument()
      expect(screen.getByText(/trening pośladków/i)).toBeInTheDocument()
    })

    it('disables navigation to next steps when no service is selected', async () => {
      render(
        <TestWrapper>
          <BookingWizard />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(/wybierz usługę/i)).toBeInTheDocument()
      })

      // Next button should be disabled initially
      const nextButton = screen.getByRole('button', { name: /dalej/i })
      expect(nextButton).toBeDisabled()
    })

    it('shows loading state while fetching services', async () => {
      mockGetServices.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

      render(
        <TestWrapper>
          <BookingWizard />
        </TestWrapper>
      )

      // Should show loading spinner
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.getByText(/wybierz usługę/i)).toBeInTheDocument()
      })
    })

    it('handles error when fetching services fails', async () => {
      mockGetServices.mockRejectedValue(new Error('Failed to fetch services'))

      render(
        <TestWrapper>
          <BookingWizard />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(/nie udało się załadować usług/i)).toBeInTheDocument()
      })
    })
  })

  describe('Step 1: Service Selection', () => {
    it('enables next button when service is selected', async () => {
      render(
        <TestWrapper>
          <BookingWizard />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(/rzęsy/i)).toBeInTheDocument()
      })

      // Select a service
      const serviceCard = screen.getByText(/rzęsy/i).closest('[data-testid*="service-card"]')
      await user.click(serviceCard!)

      // Next button should be enabled
      const nextButton = screen.getByRole('button', { name: /dalej/i })
      expect(nextButton).toBeEnabled()
    })

    it('navigates to step 2 when service is selected and next is clicked', async () => {
      render(
        <TestWrapper>
          <BookingWizard />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(/rzęsy/i)).toBeInTheDocument()
      })

      // Select a service
      const serviceCard = screen.getByText(/rzęsy/i).closest('[data-testid*="service-card"]')
      await user.click(serviceCard!)

      // Click next
      const nextButton = screen.getByRole('button', { name: /dalej/i })
      await user.click(nextButton)

      // Should navigate to time selection
      await waitFor(() => {
        expect(screen.getByText(/wybierz termin/i)).toBeInTheDocument()
      })
    })

    it('filters services by category when category filter is applied', async () => {
      render(
        <TestWrapper>
          <BookingWizard />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(/rzęsy/i)).toBeInTheDocument()
      })

      // Apply beauty filter
      const beautyFilter = screen.getByRole('button', { name: /beauty/i })
      await user.click(beautyFilter)

      // Should only show beauty services
      expect(screen.getByText(/rzęsy/i)).toBeInTheDocument()
      expect(screen.queryByText(/trening pośladków/i)).not.toBeInTheDocument()
    })

    it('searches services when search term is entered', async () => {
      render(
        <TestWrapper>
          <BookingWizard />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(/rzęsy/i)).toBeInTheDocument()
      })

      // Enter search term
      const searchInput = screen.getByPlaceholderText(/szukaj usług/i)
      await user.type(searchInput, 'rzęsy')

      // Should show only matching services
      expect(screen.getByText(/rzęsy/i)).toBeInTheDocument()
      expect(screen.queryByText(/trening pośladków/i)).not.toBeInTheDocument()
    })
  })

  describe('Step 2: Time Slot Selection', () => {
    beforeEach(async () => {
      render(
        <TestWrapper>
          <BookingWizard />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(/rzęsy/i)).toBeInTheDocument()
      })

      // Select service and navigate to time selection
      const serviceCard = screen.getByText(/rzęsy/i).closest('[data-testid*="service-card"]')
      await user.click(serviceCard!)

      const nextButton = screen.getByRole('button', { name: /dalej/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/wybierz termin/i)).toBeInTheDocument()
      })
    })

    it('displays available time slots', async () => {
      await waitFor(() => {
        expect(screen.getByText('10:00')).toBeInTheDocument()
        expect(screen.getByText('14:00')).toBeInTheDocument()
      })
    })

    it('holds time slot when selected', async () => {
      const timeSlot = screen.getByText('10:00').closest('[data-testid*="time-slot"]')
      await user.click(timeSlot!)

      expect(mockHoldTimeSlot).toHaveBeenCalledWith('slot-1', expect.any(String))
    })

    it('enables next button when time slot is selected', async () => {
      const timeSlot = screen.getByText('10:00').closest('[data-testid*="time-slot"]')
      await user.click(timeSlot!)

      const nextButton = screen.getByRole('button', { name: /dalej/i })
      await waitFor(() => {
        expect(nextButton).toBeEnabled()
      })
    })

    it('releases hold when different time slot is selected', async () => {
      const firstSlot = screen.getByText('10:00').closest('[data-testid*="time-slot"]')
      await user.click(firstSlot!)

      const secondSlot = screen.getByText('14:00').closest('[data-testid*="time-slot"]')
      await user.click(secondSlot!)

      expect(mockReleaseTimeSlot).toHaveBeenCalledWith('slot-1', expect.any(String))
      expect(mockHoldTimeSlot).toHaveBeenCalledWith('slot-2', expect.any(String))
    })

    it('shows waitlist option when no time slots are available', async () => {
      mockGetTimeSlots.mockResolvedValue({ slots: [], total: 0 })

      render(
        <TestWrapper>
          <BookingWizard />
        </TestWrapper>
      )

      // Navigate to time selection
      const serviceCard = screen.getByText(/rzęsy/i).closest('[data-testid*="service-card"]')
      await user.click(serviceCard!)

      const nextButton = screen.getByRole('button', { name: /dalej/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/dołącz do listy oczekujących/i)).toBeInTheDocument()
      })
    })
  })

  describe('Step 3: Client Details', () => {
    beforeEach(async () => {
      render(
        <TestWrapper>
          <BookingWizard />
        </TestWrapper>
      )

      // Navigate to step 3
      await waitFor(() => {
        expect(screen.getByText(/rzęsy/i)).toBeInTheDocument()
      })

      const serviceCard = screen.getByText(/rzęsy/i).closest('[data-testid*="service-card"]')
      await user.click(serviceCard!)

      const nextButton = screen.getByRole('button', { name: /dalej/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText('10:00')).toBeInTheDocument()
      })

      const timeSlot = screen.getByText('10:00').closest('[data-testid*="time-slot"]')
      await user.click(timeSlot!)

      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/dane klienta/i)).toBeInTheDocument()
      })
    })

    it('displays client details form', async () => {
      expect(screen.getByLabelText(/imię/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/telefon/i)).toBeInTheDocument()
    })

    it('validates required fields', async () => {
      const nextButton = screen.getByRole('button', { name: /dalej/i })

      // Try to proceed without filling form
      await user.click(nextButton)

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/imię jest wymagane/i)).toBeInTheDocument()
        expect(screen.getByText(/email jest wymagany/i)).toBeInTheDocument()
        expect(screen.getByText(/telefon jest wymagany/i)).toBeInTheDocument()
      })
    })

    it('validates email format', async () => {
      const emailInput = screen.getByLabelText(/email/i)
      const nextButton = screen.getByRole('button', { name: /dalej/i })

      await user.type(emailInput, 'invalid-email')
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/nieprawidłowy format email/i)).toBeInTheDocument()
      })
    })

    it('validates phone number format', async () => {
      const phoneInput = screen.getByLabelText(/telefon/i)
      const nextButton = screen.getByRole('button', { name: /dalej/i })

      await user.type(phoneInput, '123')
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/nieprawidłowy format telefonu/i)).toBeInTheDocument()
      })
    })

    it('enables next button when form is valid', async () => {
      await user.type(screen.getByLabelText(/imię/i), 'Jan')
      await user.type(screen.getByLabelText(/email/i), 'jan@example.com')
      await user.type(screen.getByLabelText(/telefon/i), '+48 123 456 789')

      const nextButton = screen.getByRole('button', { name: /dalej/i })
      await waitFor(() => {
        expect(nextButton).toBeEnabled()
      })
    })

    it('saves form data to session storage', async () => {
      await user.type(screen.getByLabelText(/imię/i), 'Jan')
      await user.type(screen.getByLabelText(/email/i), 'jan@example.com')
      await user.type(screen.getByLabelText(/telefon/i), '+48 123 456 789')

      // Check if data is saved to session storage
      expect(sessionStorage.getItem('booking_draft')).toBeTruthy()
    })

    it('restores form data from session storage', async () => {
      // Save data to session storage
      const formData = {
        service: mockServices[0],
        timeSlot: mockTimeSlots[0],
        clientDetails: {
          firstName: 'Anna',
          email: 'anna@example.com',
          phone: '+48 987 654 321'
        }
      }
      sessionStorage.setItem('booking_draft', JSON.stringify(formData))

      // Re-render component
      render(
        <TestWrapper>
          <BookingWizard />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByDisplayValue('Anna')).toBeInTheDocument()
        expect(screen.getByDisplayValue('anna@example.com')).toBeInTheDocument()
        expect(screen.getByDisplayValue('+48 987 654 321')).toBeInTheDocument()
      })
    })
  })

  describe('Step 4: Payment', () => {
    beforeEach(async () => {
      render(
        <TestWrapper>
          <BookingWizard />
        </TestWrapper>
      )

      // Navigate to step 4
      await waitFor(() => {
        expect(screen.getByText(/rzęsy/i)).toBeInTheDocument()
      })

      const serviceCard = screen.getByText(/rzęsy/i).closest('[data-testid*="service-card"]')
      await user.click(serviceCard!)

      let nextButton = screen.getByRole('button', { name: /dalej/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText('10:00')).toBeInTheDocument()
      })

      const timeSlot = screen.getByText('10:00').closest('[data-testid*="time-slot"]')
      await user.click(timeSlot!)
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/dane klienta/i)).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText(/imię/i), 'Jan')
      await user.type(screen.getByLabelText(/email/i), 'jan@example.com')
      await user.type(screen.getByLabelText(/telefon/i), '+48 123 456 789')

      nextButton = screen.getByRole('button', { name: /dalej/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/płatność/i)).toBeInTheDocument()
      })
    })

    it('displays booking summary', async () => {
      expect(screen.getByText(/rzęsy/i)).toBeInTheDocument()
      expect(screen.getByText('350 zł')).toBeInTheDocument()
      expect(screen.getByText('15 stycznia 2024, 10:00')).toBeInTheDocument()
    })

    it('shows payment form', async () => {
      expect(screen.getByLabelText(/numer karty/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/data ważności/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/kod cvv/i)).toBeInTheDocument()
    })

    it('processes payment when form is submitted', async () => {
      await user.type(screen.getByLabelText(/numer karty/i), '4242424242424242')
      await user.type(screen.getByLabelText(/data ważności/i), '12/25')
      await user.type(screen.getByLabelText(/kod cvv/i), '123')

      const payButton = screen.getByRole('button', { name: /zapłać/i })
      await user.click(payButton)

      await waitFor(() => {
        expect(mockCreateBooking).toHaveBeenCalledWith(
          expect.objectContaining({
            service_id: 'beauty-lips',
            client_email: 'jan@example.com',
            start_time: '2024-01-15T10:00:00Z'
          }),
          expect.any(String)
        )
      })
    })

    it('shows success message when payment is successful', async () => {
      await user.type(screen.getByLabelText(/numer karty/i), '4242424242424242')
      await user.type(screen.getByLabelText(/data ważności/i), '12/25')
      await user.type(screen.getByLabelText(/kod cvv/i), '123')

      const payButton = screen.getByRole('button', { name: /zapłać/i })
      await user.click(payButton)

      await waitFor(() => {
        expect(screen.getByText(/rezerwacja potwierdzona/i)).toBeInTheDocument()
      })
    })

    it('shows error message when payment fails', async () => {
      mockCreateBooking.mockRejectedValue(new Error('Payment failed'))

      await user.type(screen.getByLabelText(/numer karty/i), '4242424242424242')
      await user.type(screen.getByLabelText(/data ważności/i), '12/25')
      await user.type(screen.getByLabelText(/kod cvv/i), '123')

      const payButton = screen.getByRole('button', { name: /zapłać/i })
      await user.click(payButton)

      await waitFor(() => {
        expect(screen.getByText(/wystąpił błąd podczas płatności/i)).toBeInTheDocument()
      })
    })

    it('releases time slot hold when payment fails', async () => {
      mockCreateBooking.mockRejectedValue(new Error('Payment failed'))

      await user.type(screen.getByLabelText(/numer karty/i), '4242424242424242')
      await user.type(screen.getByLabelText(/data ważności/i), '12/25')
      await user.type(screen.getByLabelText(/kod cvv/i), '123')

      const payButton = screen.getByRole('button', { name: /zapłać/i })
      await user.click(payButton)

      await waitFor(() => {
        expect(mockReleaseTimeSlot).toHaveBeenCalledWith('slot-1', expect.any(String))
      })
    })
  })

  describe('Navigation Between Steps', () => {
    it('allows going back to previous steps', async () => {
      render(
        <TestWrapper>
          <BookingWizard />
        </TestWrapper>
      )

      // Navigate to step 2
      await waitFor(() => {
        expect(screen.getByText(/rzęsy/i)).toBeInTheDocument()
      })

      const serviceCard = screen.getByText(/rzęsy/i).closest('[data-testid*="service-card"]')
      await user.click(serviceCard!)

      const nextButton = screen.getByRole('button', { name: /dalej/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/wybierz termin/i)).toBeInTheDocument()
      })

      // Go back to step 1
      const backButton = screen.getByRole('button', { name: /wróć/i })
      await user.click(backButton)

      await waitFor(() => {
        expect(screen.getByText(/wybierz usługę/i)).toBeInTheDocument()
      })
    })

    it('preserves selected data when navigating back', async () => {
      render(
        <TestWrapper>
          <BookingWizard />
        </TestWrapper>
      )

      // Select service and navigate to step 2
      await waitFor(() => {
        expect(screen.getByText(/rzęsy/i)).toBeInTheDocument()
      })

      const serviceCard = screen.getByText(/rzęsy/i).closest('[data-testid*="service-card"]')
      await user.click(serviceCard!)

      let nextButton = screen.getByRole('button', { name: /dalej/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/wybierz termin/i)).toBeInTheDocument()
      })

      // Go back and verify service is still selected
      const backButton = screen.getByRole('button', { name: /wróć/i })
      await user.click(backButton)

      await waitFor(() => {
        expect(screen.getByText(/wybierz usługę/i)).toBeInTheDocument()
      })

      // Service should still be selected
      expect(nextButton).toBeEnabled()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', async () => {
      render(
        <TestWrapper>
          <BookingWizard />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
        expect(screen.getByRole('navigation')).toBeInTheDocument()
      })

      // Check for step indicators
      expect(screen.getByRole('list')).toBeInTheDocument()
      expect(screen.getAllByRole('listitem')).toHaveLength(4)
    })

    it('supports keyboard navigation', async () => {
      render(
        <TestWrapper>
          <BookingWizard />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(/rzęsy/i)).toBeInTheDocument()
      })

      // Tab through service cards
      await user.tab()
      expect(screen.getByText(/rzęsy/i).closest('[data-testid*="service-card"]')).toHaveFocus()
    })

    it('announces step changes to screen readers', async () => {
      render(
        <TestWrapper>
          <BookingWizard />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(/wybierz usługę/i)).toBeInTheDocument()
      })

      // Select service and navigate to next step
      const serviceCard = screen.getByText(/rzęsy/i).closest('[data-testid*="service-card"]')
      await user.click(serviceCard!)

      const nextButton = screen.getByRole('button', { name: /dalej/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent(/krok 2 z 4/i)
      })
    })
  })

  describe('Error Handling', () => {
    it('handles network errors gracefully', async () => {
      mockGetServices.mockRejectedValue(new Error('Network error'))

      render(
        <TestWrapper>
          <BookingWizard />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(/nie udało się załadować usług/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /spróbuj ponownie/i })).toBeInTheDocument()
      })
    })

    it('allows retrying after error', async () => {
      mockGetServices
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ services: mockServices, total: 2 })

      render(
        <TestWrapper>
          <BookingWizard />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(/nie udało się załadować usług/i)).toBeInTheDocument()
      })

      const retryButton = screen.getByRole('button', { name: /spróbuj ponownie/i })
      await user.click(retryButton)

      await waitFor(() => {
        expect(screen.getByText(/rzęsy/i)).toBeInTheDocument()
      })
    })

    it('handles timeout errors gracefully', async () => {
      mockGetServices.mockImplementation(() =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      )

      render(
        <TestWrapper>
          <BookingWizard />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(/przekroczono czas oczekiwania/i)).toBeInTheDocument()
      })
    })
  })
})