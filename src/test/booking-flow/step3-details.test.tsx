import { describe, it, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@/test/utils/test-utilities';
import { QueryClient } from '@tanstack/react-query';
import Step3Details from '@/components/booking/Step3Details';
import { createTimeSlot, createService, createExtendedProfile } from '@/test/factories/extended-factories';
import { BookingService } from '@/services/booking.service';
import * as bookingStoreModule from '@/stores/bookingStore';

// Mock the booking store
const mockUpdateDetails = vi.fn();
const mockSelectedService = createService({ id: 'test-service-id', title: 'Test Service' });
const mockSelectedTimeSlot = createTimeSlot({
  id: 'test-slot-id',
  start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
});

vi.mock('@/stores/bookingStore', () => ({
  useBookingStore: () => ({
    selectService: vi.fn(),
    selectTimeSlot: vi.fn(),
    updateDetails: mockUpdateDetails,
    selectedService: mockSelectedService,
    selectedTimeSlot: mockSelectedTimeSlot,
    details: {},
    canProceed: { step3: false },
    currentStep: 3,
  }),
}));

describe('Step3Details - Client Information & Preferences', () => {
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
      saveBookingDraft: vi.fn(),
      getBookingDraft: vi.fn(),
    };

    vi.spyOn(BookingService.prototype, 'constructor').mockImplementation(() => mockBookingService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    test('should render client details form', async () => {
      const { render } = await import('@/test/utils/test-utilities');
      render(<Step3Details />);

      expect(screen.getByText('Your Details')).toBeInTheDocument();
      expect(screen.getByText('Please provide your information to complete the booking')).toBeInTheDocument();
    });

    test('should display selected service and time information', async () => {
      const { render } = await import('@/test/utils/test-utilities');
      render(<Step3Details />);

      expect(screen.getByText(mockSelectedService.title)).toBeInTheDocument();

      const startTime = new Date(mockSelectedTimeSlot.start_time);
      const formattedDate = startTime.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const formattedTime = startTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });

      expect(screen.getByText(formattedDate)).toBeInTheDocument();
      expect(screen.getByText(formattedTime)).toBeInTheDocument();
    });

    test('should render all required form fields', async () => {
      const { render } = await import('@/test/utils/test-utilities');
      render(<Step3Details />);

      // Personal information fields
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();

      // Address fields
      expect(screen.getByLabelText(/street address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/postal code/i)).toBeInTheDocument();

      // Preferences
      expect(screen.getByLabelText(/special requests or preferences/i)).toBeInTheDocument();
    });

    test('should show progress indicator', async () => {
      const { render } = await import('@/test/utils/test-utilities');
      render(<Step3Details />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByText('Step 3 of 4')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    test('should validate required fields', async () => {
      const { render, userEvent } = await import('@/test/utils/test-utilities');
      render(<Step3Details />);

      const continueButton = screen.getByRole('button', { name: /continue/i });

      // Try to continue without filling required fields
      fireEvent.click(continueButton);

      await waitFor(() => {
        // Should show validation errors
        expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/email address is required/i)).toBeInTheDocument();
        expect(screen.getByText(/phone number is required/i)).toBeInTheDocument();
      });
    });

    test('should validate email format', async () => {
      const { render, userEvent } = await import('@/test/utils/test-utilities');
      render(<Step3Details />);

      const emailInput = screen.getByLabelText(/email address/i);
      const continueButton = screen.getByRole('button', { name: /continue/i });

      // Enter invalid email
      await userEvent.type(emailInput, 'invalid-email');
      fireEvent.click(continueButton);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });

      // Enter valid email
      await userEvent.clear(emailInput);
      await userEvent.type(emailInput, 'test@example.com');
      fireEvent.click(continueButton);

      await waitFor(() => {
        expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument();
      });
    });

    test('should validate phone number format', async () => {
      const { render, userEvent } = await import('@/test/utils/test-utilities');
      render(<Step3Details />);

      const phoneInput = screen.getByLabelText(/phone number/i);
      const continueButton = screen.getByRole('button', { name: /continue/i });

      // Enter invalid phone number
      await userEvent.type(phoneInput, '123');
      fireEvent.click(continueButton);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid phone number/i)).toBeInTheDocument();
      });

      // Enter valid phone number
      await userEvent.clear(phoneInput);
      await userEvent.type(phoneInput, '+48123456789');
      fireEvent.click(continueButton);

      await waitFor(() => {
        expect(screen.queryByText(/please enter a valid phone number/i)).not.toBeInTheDocument();
      });
    });

    test('should validate postal code format', async () => {
      const { render, userEvent } = await import('@/test/utils/test-utilities');
      render(<Step3Details />);

      const postalCodeInput = screen.getByLabelText(/postal code/i);
      const continueButton = screen.getByRole('button', { name: /continue/i });

      // Enter invalid postal code
      await userEvent.type(postalCodeInput, 'abc');
      fireEvent.click(continueButton);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid postal code/i)).toBeInTheDocument();
      });

      // Enter valid Polish postal code
      await userEvent.clear(postalCodeInput);
      await userEvent.type(postalCodeInput, '00-123');
      fireEvent.click(continueButton);

      await waitFor(() => {
        expect(screen.queryByText(/please enter a valid postal code/i)).not.toBeInTheDocument();
      });
    });

    test('should show inline validation on field blur', async () => {
      const { render, userEvent } = await import('@/test/utils/test-utilities');
      render(<Step3Details />);

      const emailInput = screen.getByLabelText(/email address/i);

      // Enter invalid email and blur
      await userEvent.type(emailInput, 'invalid-email');
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });
    });

    test('should clear validation errors when field is corrected', async () => {
      const { render, userEvent } = await import('@/test/utils/test-utilities');
      render(<Step3Details />);

      const emailInput = screen.getByLabelText(/email address/i);

      // Enter invalid email
      await userEvent.type(emailInput, 'invalid-email');
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });

      // Correct the email
      await userEvent.clear(emailInput);
      await userEvent.type(emailInput, 'test@example.com');
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    test('should save booking draft when form is valid', async () => {
      const { render, userEvent } = await import('@/test/utils/test-utilities');
      mockBookingService.saveBookingDraft.mockResolvedValue({
        data: { id: 'draft-123' },
        error: null
      });

      render(<Step3Details />);

      // Fill out the form
      await userEvent.type(screen.getByLabelText(/first name/i), 'John');
      await userEvent.type(screen.getByLabelText(/last name/i), 'Doe');
      await userEvent.type(screen.getByLabelText(/email address/i), 'john.doe@example.com');
      await userEvent.type(screen.getByLabelText(/phone number/i), '+48123456789');
      await userEvent.type(screen.getByLabelText(/street address/i), '123 Test Street');
      await userEvent.type(screen.getByLabelText(/city/i), 'Warsaw');
      await userEvent.type(screen.getByLabelText(/postal code/i), '00-123');

      const continueButton = screen.getByRole('button', { name: /continue/i });
      fireEvent.click(continueButton);

      await waitFor(() => {
        expect(mockBookingService.saveBookingDraft).toHaveBeenCalledWith(
          expect.any(String), // session ID
          expect.objectContaining({
            client_info: expect.objectContaining({
              name: 'John Doe',
              email: 'john.doe@example.com',
              phone: '+48123456789',
              address: {
                street: '123 Test Street',
                city: 'Warsaw',
                postal_code: '00-123',
              }
            })
          })
        );
      });

      expect(mockUpdateDetails).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'John Doe',
          email: 'john.doe@example.com',
          phone: '+48123456789',
        })
      );
    });

    test('should enable continue button when form is valid', async () => {
      const { render, userEvent } = await import('@/test/utils/test-utilities');
      render(<Step3Details />);

      const continueButton = screen.getByRole('button', { name: /continue/i });
      expect(continueButton).toBeDisabled();

      // Fill out required fields
      await userEvent.type(screen.getByLabelText(/first name/i), 'John');
      await userEvent.type(screen.getByLabelText(/last name/i), 'Doe');
      await userEvent.type(screen.getByLabelText(/email address/i), 'john.doe@example.com');
      await userEvent.type(screen.getByLabelText(/phone number/i), '+48123456789');

      await waitFor(() => {
        expect(continueButton).not.toBeDisabled();
      });
    });

    test('should handle save draft error', async () => {
      const { render, userEvent } = await import('@/test/utils/test-utilities');
      mockBookingService.saveBookingDraft.mockRejectedValue(new Error('Failed to save draft'));

      render(<Step3Details />);

      // Fill out the form
      await userEvent.type(screen.getByLabelText(/first name/i), 'John');
      await userEvent.type(screen.getByLabelText(/last name/i), 'Doe');
      await userEvent.type(screen.getByLabelText(/email address/i), 'john.doe@example.com');
      await userEvent.type(screen.getByLabelText(/phone number/i), '+48123456789');

      const continueButton = screen.getByRole('button', { name: /continue/i });
      fireEvent.click(continueButton);

      await waitFor(() => {
        expect(screen.getByText('Error saving your information')).toBeInTheDocument();
        expect(screen.getByText(/please try again or contact support/i)).toBeInTheDocument();
      });
    });

    test('should retry saving on retry button click', async () => {
      const { render, userEvent } = await import('@/test/utils/test-utilities');
      mockBookingService.saveBookingDraft
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ data: { id: 'draft-123' }, error: null });

      render(<Step3Details />);

      // Fill out the form
      await userEvent.type(screen.getByLabelText(/first name/i), 'John');
      await userEvent.type(screen.getByLabelText(/last name/i), 'Doe');
      await userEvent.type(screen.getByLabelText(/email address/i), 'john.doe@example.com');
      await userEvent.type(screen.getByLabelText(/phone number/i), '+48123456789');

      const continueButton = screen.getByRole('button', { name: /continue/i });
      fireEvent.click(continueButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(retryButton);

      expect(mockBookingService.saveBookingDraft).toHaveBeenCalledTimes(2);
    });
  });

  describe('Auto-save Functionality', () => {
    test('should auto-save form data periodically', async () => {
      vi.useFakeTimers();

      const { render, userEvent } = await import('@/test/utils/test-utilities');
      mockBookingService.saveBookingDraft.mockResolvedValue({
        data: { id: 'draft-123' },
        error: null
      });

      render(<Step3Details />);

      // Fill out some fields
      await userEvent.type(screen.getByLabelText(/first name/i), 'John');
      await userEvent.type(screen.getByLabelText(/last name/i), 'Doe');

      // Fast-forward 30 seconds (auto-save interval)
      vi.advanceTimersByTime(30 * 1000);

      await waitFor(() => {
        expect(mockBookingService.saveBookingDraft).toHaveBeenCalled();
      });

      vi.useRealTimers();
    });

    test('should load existing draft data on mount', async () => {
      const existingDraft = {
        id: 'draft-123',
        client_info: {
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '+48987654321',
        },
      };

      mockBookingService.getBookingDraft.mockResolvedValue({
        data: existingDraft,
        error: null
      });

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step3Details />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Jane')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Smith')).toBeInTheDocument();
        expect(screen.getByDisplayValue('jane@example.com')).toBeInTheDocument();
        expect(screen.getByDisplayValue('+48987654321')).toBeInTheDocument();
      });
    });

    test('should handle expired draft gracefully', async () => {
      mockBookingService.getBookingDraft.mockResolvedValue({
        data: null,
        error: { message: 'Draft has expired' }
      });

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step3Details />);

      // Should start with empty form
      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toHaveValue('');
        expect(screen.getByLabelText(/last name/i)).toHaveValue('');
      });
    });
  });

  describe('Service Preferences', () => {
    test('should show service-specific preference fields', async () => {
      const beautyService = createService({
        category: 'beauty',
        requirements: ['Allergy information', 'Previous treatments'],
      });

      // Mock the store to return beauty service
      vi.doMock('@/stores/bookingStore', () => ({
        useBookingStore: () => ({
          selectedService: beautyService,
          selectedTimeSlot: mockSelectedTimeSlot,
          updateDetails: mockUpdateDetails,
          details: {},
          canProceed: { step3: false },
          currentStep: 3,
        }),
      }));

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step3Details />);

      await waitFor(() => {
        expect(screen.getByLabelText(/allergy information/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/previous treatments/i)).toBeInTheDocument();
      });
    });

    test('should include preferences in saved data', async () => {
      const { render, userEvent } = await import('@/test/utils/test-utilities');
      mockBookingService.saveBookingDraft.mockResolvedValue({
        data: { id: 'draft-123' },
        error: null
      });

      render(<Step3Details />);

      // Fill out form with preferences
      await userEvent.type(screen.getByLabelText(/first name/i), 'John');
      await userEvent.type(screen.getByLabelText(/last name/i), 'Doe');
      await userEvent.type(screen.getByLabelText(/email address/i), 'john.doe@example.com');
      await userEvent.type(screen.getByLabelText(/phone number/i), '+48123456789');
      await userEvent.type(screen.getByLabelText(/special requests or preferences/i), 'Prefer natural look');

      const continueButton = screen.getByRole('button', { name: /continue/i });
      fireEvent.click(continueButton);

      await waitFor(() => {
        expect(mockBookingService.saveBookingDraft).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            preferences: {
              specialRequests: 'Prefer natural look'
            }
          })
        );
      });
    });
  });

  describe('GDPR Compliance', () => {
    test('should show GDPR consent checkboxes', async () => {
      const { render } = await import('@/test/utils/test-utilities');
      render(<Step3Details />);

      expect(screen.getByRole('checkbox', { name: /i agree to the processing of my personal data/i })).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: /i consent to receive marketing communications/i })).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: /i agree to the terms and conditions/i })).toBeInTheDocument();
    });

    test('should require terms and conditions consent', async () => {
      const { render, userEvent } = await import('@/test/utils/test-utilities');
      render(<Step3Details />);

      // Fill out form but don't accept terms
      await userEvent.type(screen.getByLabelText(/first name/i), 'John');
      await userEvent.type(screen.getByLabelText(/last name/i), 'Doe');
      await userEvent.type(screen.getByLabelText(/email address/i), 'john.doe@example.com');
      await userEvent.type(screen.getByLabelText(/phone number/i), '+48123456789');

      const continueButton = screen.getByRole('button', { name: /continue/i });
      fireEvent.click(continueButton);

      await waitFor(() => {
        expect(screen.getByText(/you must accept the terms and conditions/i)).toBeInTheDocument();
      });
    });

    test('should include consent choices in saved data', async () => {
      const { render, userEvent } = await import('@/test/utils/test-utilities');
      mockBookingService.saveBookingDraft.mockResolvedValue({
        data: { id: 'draft-123' },
        error: null
      });

      render(<Step3Details />);

      // Fill out form
      await userEvent.type(screen.getByLabelText(/first name/i), 'John');
      await userEvent.type(screen.getByLabelText(/last name/i), 'Doe');
      await userEvent.type(screen.getByLabelText(/email address/i), 'john.doe@example.com');
      await userEvent.type(screen.getByLabelText(/phone number/i), '+48123456789');

      // Check consents
      const gdprCheckbox = screen.getByRole('checkbox', { name: /processing of my personal data/i });
      const marketingCheckbox = screen.getByRole('checkbox', { name: /marketing communications/i });
      const termsCheckbox = screen.getByRole('checkbox', { name: /terms and conditions/i });

      fireEvent.click(gdprCheckbox);
      fireEvent.click(termsCheckbox);
      // Marketing checkbox remains unchecked

      const continueButton = screen.getByRole('button', { name: /continue/i });
      fireEvent.click(continueButton);

      await waitFor(() => {
        expect(mockBookingService.saveBookingDraft).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            consents: {
              gdpr: true,
              marketing: false,
              terms: true
            }
          })
        );
      });
    });

    test('should show privacy policy link', async () => {
      const { render } = await import('@/test/utils/test-utilities');
      render(<Step3Details />);

      const privacyLink = screen.getByRole('link', { name: /privacy policy/i });
      expect(privacyLink).toBeInTheDocument();
      expect(privacyLink).toHaveAttribute('href', '/privacy');
      expect(privacyLink).toHaveAttribute('target', '_blank');
    });
  });

  describe('Navigation', () => {
    test('should go back to time selection', async () => {
      const { render } = await import('@/test/utils/test-utilities');
      render(<Step3Details />);

      const backButton = screen.getByRole('button', { name: /back/i });
      expect(backButton).toBeInTheDocument();
    });

    test('should proceed to payment when continue button is clicked with valid form', async () => {
      const { render, userEvent } = await import('@/test/utils/test-utilities');
      mockBookingService.saveBookingDraft.mockResolvedValue({
        data: { id: 'draft-123' },
        error: null
      });

      render(<Step3Details />);

      // Fill out form
      await userEvent.type(screen.getByLabelText(/first name/i), 'John');
      await userEvent.type(screen.getByLabelText(/last name/i), 'Doe');
      await userEvent.type(screen.getByLabelText(/email address/i), 'john.doe@example.com');
      await userEvent.type(screen.getByLabelText(/phone number/i), '+48123456789');

      // Accept terms
      const termsCheckbox = screen.getByRole('checkbox', { name: /terms and conditions/i });
      fireEvent.click(termsCheckbox);

      const continueButton = screen.getByRole('button', { name: /continue/i });
      expect(continueButton).not.toBeDisabled();

      fireEvent.click(continueButton);
      expect(continueButton).not.toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    test('should have proper form labels and descriptions', async () => {
      const { render } = await import('@/test/utils/test-utilities');
      render(<Step3Details />);

      // All inputs should have associated labels
      const inputs = screen.getAllByRole('textbox');
      inputs.forEach(input => {
        const label = screen.getByLabelText(input.getAttribute('aria-label') || '');
        expect(label).toBeInTheDocument();
      });
    });

    test('should show validation errors with proper ARIA attributes', async () => {
      const { render } = await import('@/test/utils/test-utilities');
      render(<Step3Details />);

      const continueButton = screen.getByRole('button', { name: /continue/i });
      fireEvent.click(continueButton);

      await waitFor(() => {
        const errors = screen.getAllByRole('alert');
        errors.forEach(error => {
          expect(error).toHaveAttribute('aria-live', 'polite');
        });
      });
    });

    test('should support keyboard navigation', async () => {
      const { render, userEvent } = await import('@/test/utils/test-utilities');
      render(<Step3Details />);

      const firstNameInput = screen.getByLabelText(/first name/i);

      // Tab through form fields
      await userEvent.tab();
      expect(firstNameInput).toHaveFocus();

      await userEvent.tab();
      const lastNameInput = screen.getByLabelText(/last name/i);
      expect(lastNameInput).toHaveFocus();
    });

    test('should announce form validation status', async () => {
      const { render } = await import('@/test/utils/test-utilities');
      render(<Step3Details />);

      const continueButton = screen.getByRole('button', { name: /continue/i });
      fireEvent.click(continueButton);

      await waitFor(() => {
        const statusRegion = screen.getByRole('status');
        expect(statusRegion).toBeInTheDocument();
        expect(statusRegion).toHaveTextContent(/please complete all required fields/i);
      });
    });
  });

  describe('Performance', () => {
    test('should not auto-save excessively', async () => {
      vi.useFakeTimers();

      const { render, userEvent } = await import('@/test/utils/test-utilities');
      render(<Step3Details />);

      // Type in multiple fields quickly
      await userEvent.type(screen.getByLabelText(/first name/i), 'John');
      await userEvent.type(screen.getByLabelText(/last name/i), 'Doe');

      // Should only save once per interval, not on every keystroke
      vi.advanceTimersByTime(30 * 1000);

      await waitFor(() => {
        expect(mockBookingService.saveBookingDraft).toHaveBeenCalledTimes(1);
      });

      vi.useRealTimers();
    });

    test('should handle large preference texts efficiently', async () => {
      const { render, userEvent } = await import('@/test/utils/test-utilities');
      const largeText = 'A'.repeat(1000); // 1000 characters

      render(<Step3Details />);

      const startTime = performance.now();

      await userEvent.type(screen.getByLabelText(/special requests or preferences/i), largeText);

      const endTime = performance.now();
      const typingTime = endTime - startTime;

      // Should handle large text input efficiently
      expect(typingTime).toBeLessThan(1000);
    });
  });
});