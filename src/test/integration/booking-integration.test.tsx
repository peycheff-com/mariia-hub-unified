import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { BookingProvider } from '@/contexts/BookingContext'
import { CurrencyProvider } from '@/contexts/CurrencyContext'
import { ModeProvider } from '@/contexts/ModeContext'
import { bookingService } from '@/services/booking.service'
import { stripeService } from '@/services/stripe.service'

// Import components to test integration
import { BookingWizard } from '@/components/booking/BookingWizard'
import { Step1Choose } from '@/components/booking/Step1Choose'
import { Step2Time } from '@/components/booking/Step2Time'
import { Step3Details } from '@/components/booking/Step3Details'
import { Step4Payment } from '@/components/booking/Step4Payment'

// Mock services
vi.mock('@/services/booking.service')
vi.mock('@/services/stripe.service')
vi.mock('@/services/email.service')
vi.mock('@/integrations/supabase/client')

const mockBookingService = vi.mocked(bookingService)
const mockStripeService = vi.mocked(stripeService)

// Test data
const mockService = {
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
}

const mockTimeSlot = {
  id: 'slot-1',
  start_time: '2024-01-15T10:00:00Z',
  end_time: '2024-01-15T11:30:00Z',
  is_available: true,
  service_id: 'beauty-lips',
  price: 350,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

const mockBooking = {
  id: 'booking-1',
  service_id: 'beauty-lips',
  client_email: 'jan@example.com',
  start_time: '2024-01-15T10:00:00Z',
  end_time: '2024-01-15T11:30:00Z',
  status: 'confirmed',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

// Test wrapper
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false }
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

describe('Booking Integration Tests', () => {
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    vi.clearAllMocks()
    user = userEvent.setup()

    // Setup default mocks
    mockBookingService.getServices.mockResolvedValue({
      services: [mockService],
      total: 1
    })
    mockBookingService.getTimeSlots.mockResolvedValue({
      slots: [mockTimeSlot],
      total: 1
    })
    mockBookingService.holdTimeSlot.mockResolvedValue({
      hold: { id: 'hold-1', expires_at: '2024-01-15T10:05:00Z' }
    })
    mockBookingService.createBooking.mockResolvedValue({
      booking: mockBooking
    })
    mockStripeService.createPaymentIntent.mockResolvedValue({
      client_secret: 'pi_test_secret',
      payment_intent_id: 'pi_test_id'
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Complete Booking Flow Integration', () => {
    it('completes full booking journey from service selection to payment', async () => {
      render(
        <TestWrapper>
          <BookingWizard />
        </TestWrapper>
      )

      // Step 1: Service Selection
      await waitFor(() => {
        expect(screen.getByText(/rzęsy/i)).toBeInTheDocument()
      })

      const serviceCard = screen.getByText(/rzęsy/i).closest('[data-testid*="service-card"]')
      await user.click(serviceCard!)

      let nextButton = screen.getByRole('button', { name: /dalej/i })
      expect(nextButton).toBeEnabled()
      await user.click(nextButton)

      // Verify service selection
      expect(mockBookingService.getServices).toHaveBeenCalledWith({
        service_type: undefined,
        search: undefined,
        category: undefined,
        limit: 20,
        offset: 0
      })

      // Step 2: Time Slot Selection
      await waitFor(() => {
        expect(screen.getByText(/wybierz termin/i)).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.getByText('10:00')).toBeInTheDocument()
      })

      const timeSlot = screen.getByText('10:00').closest('[data-testid*="time-slot"]')
      await user.click(timeSlot!)

      // Verify time slot hold
      expect(mockBookingService.getTimeSlots).toHaveBeenCalledWith('beauty-lips', {
        limit: 50,
        offset: 0
      })
      expect(mockBookingService.holdTimeSlot).toHaveBeenCalledWith('slot-1', expect.any(String))

      nextButton = screen.getByRole('button', { name: /dalej/i })
      await user.click(nextButton)

      // Step 3: Client Details
      await waitFor(() => {
        expect(screen.getByText(/dane klienta/i)).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText(/imię/i), 'Jan')
      await user.type(screen.getByLabelText(/email/i), 'jan@example.com')
      await user.type(screen.getByLabelText(/telefon/i), '+48 123 456 789')

      nextButton = screen.getByRole('button', { name: /dalej/i })
      await user.click(nextButton)

      // Step 4: Payment
      await waitFor(() => {
        expect(screen.getByText(/płatność/i)).toBeInTheDocument()
      })

      // Verify booking summary
      expect(screen.getByText(/rzęsy/i)).toBeInTheDocument()
      expect(screen.getByText('350 zł')).toBeInTheDocument()
      expect(screen.getByText(/jan@example.com/i)).toBeInTheDocument()

      // Enter payment details
      await user.type(screen.getByLabelText(/numer karty/i), '4242424242424242')
      await user.type(screen.getByLabelText(/data ważności/i), '12/25')
      await user.type(screen.getByLabelText(/kod cvv/i), '123')

      const payButton = screen.getByRole('button', { name: /zapłać/i })
      await user.click(payButton)

      // Verify booking creation
      await waitFor(() => {
        expect(mockBookingService.createBooking).toHaveBeenCalledWith(
          expect.objectContaining({
            service_id: 'beauty-lips',
            client_email: 'jan@example.com',
            start_time: '2024-01-15T10:00:00Z',
            end_time: '2024-01-15T11:30:00Z'
          }),
          expect.any(String)
        )
      })

      // Verify payment intent creation
      expect(mockStripeService.createPaymentIntent).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 35000, // Price in cents
          currency: 'pln',
          metadata: expect.objectContaining({
            service_id: 'beauty-lips',
            client_email: 'jan@example.com'
          })
        })
      )

      // Verify success state
      await waitFor(() => {
        expect(screen.getByText(/rezerwacja potwierdzona/i)).toBeInTheDocument()
        expect(screen.getByText(/dziękujemy/i)).toBeInTheDocument()
      })
    })

    it('handles booking journey with service filtering', async () => {
      render(
        <TestWrapper>
          <Step1Choose />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(/rzęsy/i)).toBeInTheDocument()
      })

      // Apply beauty filter
      const beautyFilter = screen.getByRole('button', { name: /beauty/i })
      await user.click(beautyFilter)

      // Verify filtered API call
      await waitFor(() => {
        expect(mockBookingService.getServices).toHaveBeenCalledWith({
          service_type: 'beauty',
          search: undefined,
          category: undefined,
          limit: 20,
          offset: 0
        })
      })

      // Select service
      const serviceCard = screen.getByText(/rzęsy/i).closest('[data-testid*="service-card"]')
      await user.click(serviceCard!)

      // Verify navigation callback is called
      expect(screen.getByRole('button', { name: /dalej/i })).toBeEnabled()
    })

    it('handles booking journey with search functionality', async () => {
      render(
        <TestWrapper>
          <Step1Choose />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(/rzęsy/i)).toBeInTheDocument()
      })

      // Search for service
      const searchInput = screen.getByPlaceholderText(/szukaj usług/i)
      await user.type(searchInput, 'rzęsy')

      // Wait for debounced search
      await waitFor(() => {
        expect(mockBookingService.getServices).toHaveBeenCalledWith({
          service_type: undefined,
          search: 'rzęsy',
          category: undefined,
          limit: 20,
          offset: 0
        })
      }, { timeout: 1000 })

      // Verify search results
      expect(screen.getByText(/rzęsy/i)).toBeInTheDocument()
    })
  })

  describe('Time Slot Selection Integration', () => {
    it('handles time slot availability checking', async () => {
      render(
        <TestWrapper>
          <Step2Time serviceId="beauty-lips" onNext={vi.fn()} onBack={vi.fn()} />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('10:00')).toBeInTheDocument()
      })

      // Click time slot to check availability and hold
      const timeSlot = screen.getByText('10:00').closest('[data-testid*="time-slot"]')
      await user.click(timeSlot!)

      expect(mockBookingService.holdTimeSlot).toHaveBeenCalledWith('slot-1', expect.any(String))

      // Select different time slot
      const anotherSlot = screen.getByText('14:00').closest('[data-testid*="time-slot"]')
      if (anotherSlot) {
        await user.click(anotherSlot)
      }
    })

    it('handles no available time slots scenario', async () => {
      mockBookingService.getTimeSlots.mockResolvedValue({
        slots: [],
        total: 0
      })

      render(
        <TestWrapper>
          <Step2Time serviceId="beauty-lips" onNext={vi.fn()} onBack={vi.fn()} />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(/brak dostępnych terminów/i)).toBeInTheDocument()
        expect(screen.getByText(/dołącz do listy oczekujących/i)).toBeInTheDocument()
      })

      // Test waitlist functionality
      const waitlistButton = screen.getByRole('button', { name: /dołącz do listy oczekujących/i })
      await user.click(waitlistButton)

      await waitFor(() => {
        expect(screen.getByText(/dodano do listy oczekujących/i)).toBeInTheDocument()
      })
    })

    it('handles time slot hold expiration', async () => {
      render(
        <TestWrapper>
          <Step2Time serviceId="beauty-lips" onNext={vi.fn()} onBack={vi.fn()} />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('10:00')).toBeInTheDocument()
      })

      // Select time slot
      const timeSlot = screen.getByText('10:00').closest('[data-testid*="time-slot"]')
      await user.click(timeSlot!)

      // Simulate hold expiration after 5 minutes
      vi.advanceTimersByTime(5 * 60 * 1000 + 1000) // 5 minutes + 1 second

      await waitFor(() => {
        expect(screen.getByText(/termin wygasł/i)).toBeInTheDocument()
        expect(screen.getByText(/wybierz inny termin/i)).toBeInTheDocument()
      })
    })
  })

  describe('Client Details Integration', () => {
    it('validates and saves client information', async () => {
      const onNext = vi.fn()

      render(
        <TestWrapper>
          <Step3Details onNext={onNext} onBack={vi.fn()} />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/imię/i)).toBeInTheDocument()
      })

      // Try to proceed without filling form
      const nextButton = screen.getByRole('button', { name: /dalej/i })
      await user.click(nextButton)

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/imię jest wymagane/i)).toBeInTheDocument()
        expect(screen.getByText(/email jest wymagany/i)).toBeInTheDocument()
        expect(screen.getByText(/telefon jest wymagany/i)).toBeInTheDocument()
      })

      // Fill form with invalid data
      await user.type(screen.getByLabelText(/imię/i), 'J')
      await user.type(screen.getByLabelText(/email/i), 'invalid-email')
      await user.type(screen.getByLabelText(/telefon/i), '123')

      await user.click(nextButton)

      // Should show specific validation errors
      await waitFor(() => {
        expect(screen.getByText(/imię musi mieć co najmniej 2 znaki/i)).toBeInTheDocument()
        expect(screen.getByText(/nieprawidłowy format email/i)).toBeInTheDocument()
        expect(screen.getByText(/nieprawidłowy format telefonu/i)).toBeInTheDocument()
      })

      // Fill form with valid data
      await user.clear(screen.getByLabelText(/imię/i))
      await user.type(screen.getByLabelText(/imię/i), 'Jan Kowalski')
      await user.clear(screen.getByLabelText(/email/i))
      await user.type(screen.getByLabelText(/email/i), 'jan@example.com')
      await user.clear(screen.getByLabelText(/telefon/i))
      await user.type(screen.getByLabelText(/telefon/i), '+48 123 456 789')

      await user.click(nextButton)

      // Should proceed to next step
      await waitFor(() => {
        expect(onNext).toHaveBeenCalledWith({
          firstName: 'Jan Kowalski',
          email: 'jan@example.com',
          phone: '+48 123 456 789',
          notes: '',
          consent: true
        })
      })
    })

    it('handles form data persistence across page refreshes', async () => {
      const clientData = {
        firstName: 'Anna',
        email: 'anna@example.com',
        phone: '+48 987 654 321',
        notes: 'First time client',
        consent: true
      }

      // Save data to session storage
      sessionStorage.setItem('booking_draft', JSON.stringify({
        clientDetails: clientData
      }))

      render(
        <TestWrapper>
          <Step3Details onNext={vi.fn()} onBack={vi.fn()} />
        </TestWrapper>
      )

      // Should restore form data
      await waitFor(() => {
        expect(screen.getByDisplayValue('Anna')).toBeInTheDocument()
        expect(screen.getByDisplayValue('anna@example.com')).toBeInTheDocument()
        expect(screen.getByDisplayValue('+48 987 654 321')).toBeInTheDocument()
        expect(screen.getByDisplayValue('First time client')).toBeInTheDocument()
      })
    })
  })

  describe('Payment Integration', () => {
    it('processes payment with Stripe integration', async () => {
      const onNext = vi.fn()

      render(
        <TestWrapper>
          <Step4Payment
            service={mockService}
            timeSlot={mockTimeSlot}
            clientDetails={{
              firstName: 'Jan',
              email: 'jan@example.com',
              phone: '+48 123 456 789',
              notes: '',
              consent: true
            }}
            onNext={onNext}
            onBack={vi.fn()}
          />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(/płatność/i)).toBeInTheDocument()
      })

      // Enter payment details
      await user.type(screen.getByLabelText(/numer karty/i), '4242424242424242')
      await user.type(screen.getByLabelText(/data ważności/i), '12/25')
      await user.type(screen.getByLabelText(/kod cvv/i), '123')

      const payButton = screen.getByRole('button', { name: /zapłać/i })
      await user.click(payButton)

      // Verify Stripe payment intent creation
      await waitFor(() => {
        expect(mockStripeService.createPaymentIntent).toHaveBeenCalledWith(
          expect.objectContaining({
            amount: 35000,
            currency: 'pln',
            metadata: expect.objectContaining({
              service_id: 'beauty-lips',
              client_email: 'jan@example.com',
              service_title: 'Rzęsy'
            })
          })
        )
      })

      // Verify booking creation
      expect(mockBookingService.createBooking).toHaveBeenCalledWith(
        expect.objectContaining({
          service_id: 'beauty-lips',
          client_email: 'jan@example.com',
          start_time: '2024-01-15T10:00:00Z',
          end_time: '2024-01-15T11:30:00Z'
        }),
        expect.any(String)
      )

      // Should proceed to confirmation
      await waitFor(() => {
        expect(onNext).toHaveBeenCalledWith({
          booking: mockBooking,
          payment_intent: {
            client_secret: 'pi_test_secret',
            payment_intent_id: 'pi_test_id'
          }
        })
      })
    })

    it('handles payment failure gracefully', async () => {
      mockStripeService.createPaymentIntent.mockRejectedValue(
        new Error('Payment failed: Insufficient funds')
      )

      render(
        <TestWrapper>
          <Step4Payment
            service={mockService}
            timeSlot={mockTimeSlot}
            clientDetails={{
              firstName: 'Jan',
              email: 'jan@example.com',
              phone: '+48 123 456 789',
              notes: '',
              consent: true
            }}
            onNext={vi.fn()}
            onBack={vi.fn()}
          />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(/płatność/i)).toBeInTheDocument()
      })

      // Enter payment details
      await user.type(screen.getByLabelText(/numer karty/i), '4000000000000002') // Declined card
      await user.type(screen.getByLabelText(/data ważności/i), '12/25')
      await user.type(screen.getByLabelText(/kod cvv/i), '123')

      const payButton = screen.getByRole('button', { name: /zapłać/i })
      await user.click(payButton)

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/płatność nieudana/i)).toBeInTheDocument()
        expect(screen.getByText(/nieprawidłowe dane karty lub niewystarczające środki/i)).toBeInTheDocument()
      })

      // Should not proceed to next step
      expect(mockBookingService.createBooking).not.toHaveBeenCalled()
    })

    it('handles Polish VAT for companies', async () => {
      render(
        <TestWrapper>
          <Step4Payment
            service={mockService}
            timeSlot={mockTimeSlot}
            clientDetails={{
              firstName: 'Jan',
              email: 'jan@example.com',
              phone: '+48 123 456 789',
              notes: '',
              consent: true,
              isCompany: true,
              companyName: 'Test Company',
              nip: '1234567890',
              companyAddress: 'Test Address 123, Warsaw, Poland'
            }}
            onNext={vi.fn()}
            onBack={vi.fn()}
          />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(/faktura vat/i)).toBeInTheDocument()
        expect(screen.getByDisplayValue('Test Company')).toBeInTheDocument()
        expect(screen.getByDisplayValue('1234567890')).toBeInTheDocument()
      })

      // Verify Polish VAT is included in payment
      await user.type(screen.getByLabelText(/numer karty/i), '4242424242424242')
      await user.type(screen.getByLabelText(/data ważności/i), '12/25')
      await user.type(screen.getByLabelText(/kod cvv/i), '123')

      const payButton = screen.getByRole('button', { name: /zapłać/i })
      await user.click(payButton)

      await waitFor(() => {
        expect(mockStripeService.createPaymentIntent).toHaveBeenCalledWith(
          expect.objectContaining({
            amount: 35000, // Base amount
            metadata: expect.objectContaining({
              is_company: 'true',
              company_name: 'Test Company',
              nip: '1234567890'
            })
          })
        )
      })
    })
  })

  describe('Error Handling Integration', () => {
    it('handles network errors during booking flow', async () => {
      mockBookingService.getServices.mockRejectedValue(new Error('Network error'))

      render(
        <TestWrapper>
          <BookingWizard />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(/nie udało się załadować usług/i)).toBeInTheDocument()
      })

      // Test retry functionality
      const retryButton = screen.getByRole('button', { name: /spróbuj ponownie/i })
      await user.click(retryButton)

      // Should attempt to reload services
      expect(mockBookingService.getServices).toHaveBeenCalledTimes(2)
    })

    it('handles concurrent booking attempts', async () => {
      render(
        <TestWrapper>
          <BookingWizard />
        </TestWrapper>
      )

      // Complete steps 1-3
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
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/płatność/i)).toBeInTheDocument()
      })

      // Simulate concurrent booking attempt (slot becomes unavailable)
      mockBookingService.createBooking.mockRejectedValue(
        new Error('Time slot no longer available')
      )

      await user.type(screen.getByLabelText(/numer karty/i), '4242424242424242')
      await user.type(screen.getByLabelText(/data ważności/i), '12/25')
      await user.type(screen.getByLabelText(/kod cvv/i), '123')

      const payButton = screen.getByRole('button', { name: /zapłać/i })
      await user.click(payButton)

      await waitFor(() => {
        expect(screen.getByText(/termin nie jest już dostępny/i)).toBeInTheDocument()
        expect(screen.getByText(/wybierz inny termin/i)).toBeInTheDocument()
      })
    })

    it('handles session timeout during booking', async () => {
      vi.useFakeTimers()

      render(
        <TestWrapper>
          <BookingWizard />
        </TestWrapper>
      )

      // Complete first step
      await waitFor(() => {
        expect(screen.getByText(/rzęsy/i)).toBeInTheDocument()
      })

      const serviceCard = screen.getByText(/rzęsy/i).closest('[data-testid*="service-card"]')
      await user.click(serviceCard!)

      // Simulate session timeout (30 minutes)
      vi.advanceTimersByTime(30 * 60 * 1000)

      await waitFor(() => {
        expect(screen.getByText(/sesja wygasła/i)).toBeInTheDocument()
        expect(screen.getByText(/rozpocznij ponownie/i)).toBeInTheDocument()
      })

      vi.useRealTimers()
    })
  })
})