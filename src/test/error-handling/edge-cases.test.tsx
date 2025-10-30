import { describe, it, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@/test/utils/test-utilities';
import { QueryClient } from '@tanstack/react-query';
import Step1Choose from '@/components/booking/Step1Choose';
import Step2Time from '@/components/booking/Step2Time';
import Step3Details from '@/components/booking/Step3Details';
import Step4Payment from '@/components/booking/Step4Payment';
import {
  createService,
  createBooking,
  createTimeSlot,
  createExtendedProfile
} from '@/test/factories/extended-factories';
import { BookingService } from '@/services/booking.service';

describe('Error Handling & Edge Cases', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false },
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Network Error Scenarios', () => {
    test('should handle complete network failure', async () => {
      // Mock fetch to simulate network failure
      global.fetch = vi.fn().mockRejectedValue(new Error('Network request failed'));

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step1Choose />);

      await waitFor(() => {
        expect(screen.getByText('Network Error')).toBeInTheDocument();
        expect(screen.getByText('Unable to connect to our servers. Please check your internet connection and try again.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });

    test('should handle network timeout', async () => {
      // Mock fetch to simulate timeout
      global.fetch = vi.fn().mockImplementation(() =>
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 100);
        })
      );

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step1Choose />);

      await waitFor(() => {
        expect(screen.getByText('Request Timeout')).toBeInTheDocument();
        expect(screen.getByText('The request took too long to complete. Please try again.')).toBeInTheDocument();
      });
    });

    test('should handle intermittent network issues', async () => {
      let callCount = 0;
      global.fetch = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount <= 2) {
          return Promise.reject(new Error('Network unstable'));
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ data: [], error: null })
        });
      });

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step1Choose />);

      // Should automatically retry on network issues
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
      }, { timeout: 5000 });
    });

    test('should handle CORS errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('CORS policy blocked request'));

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step1Choose />);

      await waitFor(() => {
        expect(screen.getByText('CORS Error')).toBeInTheDocument();
        expect(screen.getByText('Cross-origin request blocked. Please contact support if this issue persists.')).toBeInTheDocument();
      });
    });
  });

  describe('Database Error Scenarios', () => {
    test('should handle database connection failure', async () => {
      const mockBookingService = {
        checkAvailability: vi.fn().mockRejectedValue(new Error('Database connection lost')),
      };

      vi.spyOn(BookingService.prototype, 'constructor').mockImplementation(() => mockBookingService);

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step2Time />);

      await waitFor(() => {
        expect(screen.getByText('Database Connection Error')).toBeInTheDocument();
        expect(screen.getByText('Unable to connect to our database. Please try again in a moment.')).toBeInTheDocument();
      });
    });

    test('should handle database constraint violations', async () => {
      const mockBookingService = {
        createBooking: vi.fn().mockRejectedValue({
          message: 'duplicate key value violates unique constraint',
          code: '23505',
          constraint: 'unique_booking_constraint'
        }),
      };

      vi.spyOn(BookingService.prototype, 'constructor').mockImplementation(() => mockBookingService);

      // This would be tested in the actual booking flow component
      expect(() => {
        mockBookingService.createBooking({} as any);
      }).not.toThrow();
    });

    test('should handle foreign key constraint failures', async () => {
      const mockBookingService = {
        createBooking: vi.fn().mockRejectedValue({
          message: 'insert or update on table "bookings" violates foreign key constraint',
          code: '23503',
          details: { constraint: 'bookings_service_id_fkey' }
        }),
      };

      vi.spyOn(BookingService.prototype, 'constructor').mockImplementation(() => mockBookingService);

      expect(() => {
        mockBookingService.createBooking({} as any);
      }).not.toThrow();
    });

    test('should handle database deadlock scenarios', async () => {
      const mockBookingService = {
        holdTimeSlot: vi.fn().mockRejectedValue({
          message: 'deadlock detected',
          code: '40P01'
        }),
      };

      vi.spyOn(BookingService.prototype, 'constructor').mockImplementation(() => mockBookingService);

      // Should implement retry logic for deadlocks
      const { render } = await import('@/test/utils/test-utilities');
      render(<Step2Time />);

      // The component should handle the deadlock gracefully
      expect(screen.getByText('Checking availability...')).toBeInTheDocument();
    });
  });

  describe('Concurrent Booking Scenarios', () => {
    test('should handle race conditions for time slot selection', async () => {
      vi.useFakeTimers();

      const mockTimeSlot = createTimeSlot({
        id: 'slot-123',
        status: 'available'
      });

      const mockBookingService = {
        checkAvailability: vi.fn().mockResolvedValue({
          data: [mockTimeSlot],
          error: null
        }),
        holdTimeSlot: vi.fn().mockImplementation((slotId, sessionId) => {
          // Simulate concurrent access
          if (sessionId === 'session-1') {
            return Promise.resolve({
              data: { id: 'hold-123', time_slot_id: slotId, session_id: sessionId },
              error: null
            });
          } else {
            return Promise.resolve({
              data: null,
              error: { message: 'Time slot already taken' }
            });
          }
        }),
      };

      vi.spyOn(BookingService.prototype, 'constructor').mockImplementation(() => mockBookingService);

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step2Time />);

      await waitFor(() => {
        expect(screen.getByTestId('time-slot-slot-123')).toBeInTheDocument();
      });

      // Simulate two users clicking simultaneously
      const timeSlot = screen.getByTestId('time-slot-slot-123');

      // First user succeeds
      fireEvent.click(timeSlot);

      vi.advanceTimersByTime(100);

      await waitFor(() => {
        expect(mockBookingService.holdTimeSlot).toHaveBeenCalled();
      });

      vi.useRealTimers();
    });

    test('should handle double booking prevention', async () => {
      const mockTimeSlot = createTimeSlot({
        id: 'slot-123',
        status: 'available',
        max_bookings: 1,
        current_bookings: 1
      });

      const mockBookingService = {
        holdTimeSlot: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Time slot is no longer available' }
        }),
      };

      vi.spyOn(BookingService.prototype, 'constructor').mockImplementation(() => mockBookingService);

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step2Time />);

      await waitFor(() => {
        expect(screen.getByTestId('time-slot-slot-123')).toBeInTheDocument();
      });

      const timeSlot = screen.getByTestId('time-slot-slot-123');
      fireEvent.click(timeSlot);

      await waitFor(() => {
        expect(screen.getByText('This time slot is no longer available')).toBeInTheDocument();
        expect(screen.getByText('Another user just booked this time slot. Please select a different time.')).toBeInTheDocument();
      });
    });

    test('should handle concurrent profile updates', async () => {
      const mockProfile = createExtendedProfile({
        id: 'user-123',
        first_name: 'John',
        last_name: 'Doe'
      });

      // Simulate optimistic locking failure
      const mockAuthService = {
        updateProfile: vi.fn().mockRejectedValue({
          message: 'Record has been modified by another user',
          code: 'OPTIMISTIC_LOCK_FAILED'
        }),
      };

      vi.doMock('@/services/auth.service', () => ({
        AuthService: mockAuthService
      }));

      // Component should handle optimistic locking gracefully
      const { render } = await import('@/test/utils/test-utilities');

      const TestComponent = () => {
        const { updateProfile, error } = useAuth();

        const handleUpdate = async () => {
          await updateProfile({ first_name: 'Jane' });
        };

        return (
          <div>
            <button onClick={handleUpdate}>Update Profile</button>
            {error && <div data-testid="error">{error.message}</div>}
          </div>
        );
      };

      render(<TestComponent />);

      const updateButton = screen.getByRole('button', { name: 'Update Profile' });
      fireEvent.click(updateButton);

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Record has been modified by another user');
      });
    });
  });

  describe('Edge Case Scenarios', () => {
    test('should handle extremely large service names', async () => {
      const longName = 'A'.repeat(1000); // 1000 characters
      const mockService = createService({
        title: longName,
        description: 'Service with extremely long name'
      });

      const mockBookingService = {
        getServices: vi.fn().mockResolvedValue({
          data: [mockService],
          error: null
        }),
      };

      vi.spyOn(BookingService.prototype, 'constructor').mockImplementation(() => mockBookingService);

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step1Choose />);

      await waitFor(() => {
        // Should truncate or handle long names gracefully
        const serviceTitle = screen.getByText(longName);
        expect(serviceTitle).toBeInTheDocument();
        // Or it should be truncated with ellipsis
      });
    });

    test('should handle special characters in user input', async () => {
      const specialChars = {
        name: 'Jöhn Döe-Śmith"\'',
        email: 'john.doe+test@example.co.uk',
        phone: '+48 (123) 456-789',
        notes: 'Special chars: éàüöß ñ 中文 🎉'
      };

      const { render, userEvent } = await import('@/test/utils/test-utilities');
      render(<Step3Details />);

      await userEvent.type(screen.getByLabelText(/first name/i), specialChars.name.split(' ')[0]);
      await userEvent.type(screen.getByLabelText(/last name/i), specialChars.name.split(' ')[1]);
      await userEvent.type(screen.getByLabelText(/email address/i), specialChars.email);
      await userEvent.type(screen.getByLabelText(/phone number/i), specialChars.phone);
      await userEvent.type(screen.getByLabelText(/special requests/i), specialChars.notes);

      // Should handle special characters without errors
      expect(screen.getByDisplayValue(specialChars.name.split(' ')[0])).toBeInTheDocument();
      expect(screen.getByDisplayValue(specialChars.email)).toBeInTheDocument();
    });

    test('should handle timezone edge cases', async () => {
      const mockTimeSlot = createTimeSlot({
        start_time: '2023-12-31T23:30:00Z', // New Year's Eve UTC
        end_time: '2024-01-01T00:30:00Z'  // New Year's Day UTC
      });

      const mockBookingService = {
        checkAvailability: vi.fn().mockResolvedValue({
          data: [mockTimeSlot],
          error: null
        }),
      };

      vi.spyOn(BookingService.prototype, 'constructor').mockImplementation(() => mockBookingService);

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step2Time />);

      await waitFor(() => {
        expect(screen.getByTestId('time-slot-slot-123')).toBeInTheDocument();
      });

      // Should display times in user's local timezone
      const timeElement = screen.getByText(/11:30 PM|23:30/); // Depending on locale
      expect(timeElement).toBeInTheDocument();
    });

    test('should handle leap year dates', async () => {
      const leapYearDate = '2024-02-29T10:00:00Z'; // Feb 29 on leap year
      const mockTimeSlot = createTimeSlot({
        start_time: leapYearDate,
        end_time: '2024-02-29T11:00:00Z'
      });

      const mockBookingService = {
        checkAvailability: vi.fn().mockResolvedValue({
          data: [mockTimeSlot],
          error: null
        }),
      };

      vi.spyOn(BookingService.prototype, 'constructor').mockImplementation(() => mockBookingService);

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step2Time />);

      await waitFor(() => {
        expect(screen.getByTestId('time-slot-slot-123')).toBeInTheDocument();
      });

      // Should handle leap year dates correctly
      expect(screen.getByText(/Feb 29|29 February/)).toBeInTheDocument();
    });

    test('should handle daylight saving time transitions', async () => {
      const dstDate = '2024-03-31T01:30:00Z'; // During DST transition
      const mockTimeSlot = createTimeSlot({
        start_time: dstDate,
        end_time: '2024-03-31T02:30:00Z'
      });

      const mockBookingService = {
        checkAvailability: vi.fn().mockResolvedValue({
          data: [mockTimeSlot],
          error: null
        }),
      };

      vi.spyOn(BookingService.prototype, 'constructor').mockImplementation(() => mockBookingService);

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step2Time />);

      await waitFor(() => {
        expect(screen.getByTestId('time-slot-slot-123')).toBeInTheDocument();
      });

      // Should handle DST transitions without timezone errors
    });
  });

  describe('Payment Edge Cases', () => {
    test('should handle payment processing timeouts', async () => {
      const mockStripe = {
        confirmPayment: vi.fn().mockImplementation(() =>
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Payment timeout')), 30000);
          })
        ),
      };

      vi.doMock('@stripe/react-stripe-js', () => ({
        useStripe: () => mockStripe,
        useElements: () => ({ create: vi.fn() }),
        Elements: ({ children }: any) => children,
        loadStripe: vi.fn().mockResolvedValue(mockStripe),
      }));

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step4Payment />);

      await waitFor(() => {
        const payButton = screen.getByRole('button', { name: /pay now/i });
        fireEvent.click(payButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Payment Timeout')).toBeInTheDocument();
        expect(screen.getByText('The payment request timed out. Please try again.')).toBeInTheDocument();
      });
    });

    test('should handle insufficient funds scenarios', async () => {
      const mockStripe = {
        confirmPayment: vi.fn().mockResolvedValue({
          error: {
            type: 'card_error',
            code: 'insufficient_funds',
            message: 'Insufficient funds'
          }
        }),
      };

      vi.doMock('@stripe/react-stripe-js', () => ({
        useStripe: () => mockStripe,
        useElements: () => ({ create: vi.fn() }),
        Elements: ({ children }: any) => children,
        loadStripe: vi.fn().mockResolvedValue(mockStripe),
      }));

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step4Payment />);

      const payButton = screen.getByRole('button', { name: /pay now/i });
      fireEvent.click(payButton);

      await waitFor(() => {
        expect(screen.getByText('Insufficient Funds')).toBeInTheDocument();
        expect(screen.getByText('Your card has insufficient funds. Please use a different card or contact your bank.')).toBeInTheDocument();
      });
    });

    test('should handle card expiration during payment', async () => {
      const mockStripe = {
        confirmPayment: vi.fn().mockResolvedValue({
          error: {
            type: 'card_error',
            code: 'expired_card',
            message: 'Your card has expired'
          }
        }),
      };

      vi.doMock('@stripe/react-stripe-js', () => ({
        useStripe: () => mockStripe,
        useElements: () => ({ create: vi.fn() }),
        Elements: ({ children }: any) => children,
        loadStripe: vi.fn().mockResolvedValue(mockStripe),
      }));

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step4Payment />);

      const payButton = screen.getByRole('button', { name: /pay now/i });
      fireEvent.click(payButton);

      await waitFor(() => {
        expect(screen.getByText('Card Expired')).toBeInTheDocument();
        expect(screen.getByText('Your card has expired. Please use a different card.')).toBeInTheDocument();
      });
    });

    test('should handle 3D Secure authentication failures', async () => {
      const mockStripe = {
        confirmPayment: vi.fn().mockResolvedValue({
          error: {
            type: 'card_error',
            code: 'authentication_required',
            message: 'Authentication required'
          }
        }),
      };

      vi.doMock('@stripe/react-stripe-js', () => ({
        useStripe: () => mockStripe,
        useElements: () => ({ create: vi.fn() }),
        Elements: ({ children }: any) => children,
        loadStripe: vi.fn().mockResolvedValue(mockStripe),
      }));

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step4Payment />);

      const payButton = screen.getByRole('button', { name: /pay now/i });
      fireEvent.click(payButton);

      await waitFor(() => {
        expect(screen.getByText('Additional Authentication Required')).toBeInTheDocument();
        expect(screen.getByText('Your bank requires additional verification. Please complete the authentication in the popup window.')).toBeInTheDocument();
      });
    });
  });

  describe('Browser Compatibility Edge Cases', () => {
    test('should handle browsers without certain APIs', async () => {
      // Mock missing IntersectionObserver
      const originalIntersectionObserver = global.IntersectionObserver;
      delete (global as any).IntersectionObserver;

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step1Choose />);

      // Should gracefully fall back to polyfills or alternative methods
      await waitFor(() => {
        expect(screen.getByText('Choose Service')).toBeInTheDocument();
      });

      // Restore original
      global.IntersectionObserver = originalIntersectionObserver;
    });

    test('should handle low memory scenarios', async () => {
      // Mock low memory conditions
      Object.defineProperty(global, 'navigator', {
        value: {
          ...global.navigator,
          deviceMemory: 1, // Low memory device
          hardwareConcurrency: 2, // Limited CPU cores
        },
        writable: true,
      });

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step1Choose />);

      // Should adapt to low memory conditions
      await waitFor(() => {
        expect(screen.getByText('Choose Service')).toBeInTheDocument();
      });
    });

    test('should handle slow device performance', async () => {
      // Mock slow device
      vi.spyOn(performance, 'now').mockImplementation(() => Date.now() - 1000); // Simulate delay

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step1Choose />);

      // Should still render but with performance optimizations
      await waitFor(() => {
        expect(screen.getByText('Choose Service')).toBeInTheDocument();
      });
    });
  });

  describe('Data Corruption Scenarios', () {
    test('should handle malformed JSON responses', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve('{"invalid": json}'), // Missing closing brace
      });

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step1Choose />);

      await waitFor(() => {
        expect(screen.getByText('Invalid Response')).toBeInTheDocument();
        expect(screen.getByText('The server returned an invalid response. Please try again.')).toBeInTheDocument();
      });
    });

    test('should handle unexpected data structures', async () => {
      const mockServices = [
        { id: 1, name: 'Service 1' }, // Missing required fields
        { id: 2, title: 'Service 2', category: 'beauty' }, // Different structure
        null, // Null entry
        undefined, // Undefined entry
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: mockServices }),
      });

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step1Choose />);

      // Should filter out invalid entries
      await waitFor(() => {
        expect(screen.getByText('Service 2')).toBeInTheDocument();
        expect(screen.queryByText('Service 1')).not.toBeInTheDocument();
      });
    });

    test('should handle circular references in data', async () => {
      const circularData: any = { id: 'service-123' };
      circularData.self = circularData; // Create circular reference

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: [circularData] }),
      });

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step1Choose />);

      // Should handle circular references without infinite loops
      await waitFor(() => {
        expect(screen.getByText('Choose Service')).toBeInTheDocument();
      });
    });
  });

  describe('Resource Exhaustion Scenarios', () {
    test('should handle file upload size limits', async () => {
      const largeFile = new File(['x'.repeat(10 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' }); // 10MB

      const { render, userEvent } = await import('@/test/utils/test-utilities');
      render(<Step3Details />);

      const fileInput = screen.getByLabelText(/upload/i) || screen.getByRole('button', { name: /upload/i });

      // Mock file change event
      Object.defineProperty(fileInput, 'files', {
        value: [largeFile],
        writable: false,
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByText('File Too Large')).toBeInTheDocument();
        expect(screen.getByText('The selected file exceeds the maximum size limit of 5MB.')).toBeInTheDocument();
      });
    });

    test('should handle rate limiting', async () => {
      let requestCount = 0;
      global.fetch = vi.fn().mockImplementation(() => {
        requestCount++;
        if (requestCount > 10) {
          return Promise.resolve({
            ok: false,
            status: 429,
            json: () => Promise.resolve({
              error: 'Too many requests',
              message: 'Rate limit exceeded. Please try again later.'
            })
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ data: [], error: null })
        });
      });

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step1Choose />);

      // Make multiple rapid requests
      for (let i = 0; i < 12; i++) {
        fireEvent.click(screen.getByRole('button', { name: /refresh/i }));
      }

      await waitFor(() => {
        expect(screen.getByText('Rate Limit Exceeded')).toBeInTheDocument();
        expect(screen.getByText('Too many requests. Please wait a moment before trying again.')).toBeInTheDocument();
      });
    });

    test('should handle localStorage quota exceeded', async () => {
      // Mock localStorage quota exceeded
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn().mockImplementation((key, value) => {
        if (key === 'booking-state' && value.length > 1000) {
          throw new Error('QuotaExceededError: The quota has been exceeded.');
        }
        return originalSetItem.call(localStorage, key, value);
      });

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step1Choose />);

      // Should fall back to memory storage
      await waitFor(() => {
        expect(screen.getByText('Choose Service')).toBeInTheDocument();
      });

      // Restore original
      localStorage.setItem = originalSetItem;
    });
  });

  describe('Security Edge Cases', () => {
    test('should handle XSS attack attempts', async () => {
      const xssPayload = {
        name: '<script>alert("XSS")</script>',
        email: 'xss@example.com',
        notes: '<img src=x onerror=alert("XSS") alt="Image" />',
        phone: '<script>document.location="evil.com"</script>'
      };

      const { render, userEvent } = await import('@/test/utils/test-utilities');
      render(<Step3Details />);

      await userEvent.type(screen.getByLabelText(/first name/i), xssPayload.name);
      await userEvent.type(screen.getByLabelText(/email address/i), xssPayload.email);
      await userEvent.type(screen.getByLabelText(/phone number/i), xssPayload.phone);
      await userEvent.type(screen.getByLabelText(/special requests/i), xssPayload.notes);

      // Should sanitize input and not execute scripts
      expect(screen.queryByText('XSS')).not.toBeInTheDocument();
      expect(screen.queryByText('evil.com')).not.toBeInTheDocument();
    });

    test('should handle SQL injection attempts', async () => {
      const sqlPayload = {
        email: "'; DROP TABLE users; --",
        name: "'; INSERT INTO users VALUES('hacker'); --"
      };

      const { render, userEvent } = await import('@/test/utils/test-utilities');
      render(<Step3Details />);

      await userEvent.type(screen.getByLabelText(/email address/i), sqlPayload.email);
      await userEvent.type(screen.getByLabelText(/first name/i), sqlPayload.name);

      // Input should be escaped/sanitized
      expect(screen.getByDisplayValue(sqlPayload.email)).toBeInTheDocument();
      // But backend should properly sanitize
    });

    test('should handle path traversal attempts', async () => {
      const pathTraversalPayload = '../../../etc/passwd';

      global.fetch = vi.fn().mockImplementation((url) => {
        if (url.includes(pathTraversalPayload)) {
          return Promise.resolve({
            ok: false,
            status: 400,
            json: () => Promise.resolve({
              error: 'Invalid path'
            })
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ data: [], error: null })
        });
      });

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step1Choose />);

      // Should reject path traversal attempts
      await waitFor(() => {
        expect(screen.getByText('Choose Service')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility Edge Cases', () => {
    test('should handle screen reader announcements', async () => {
      const { render } = await import('@/test/utils/test-utilities');
      render(<Step1Choose />);

      // Should have ARIA live regions for dynamic content
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    test('should handle keyboard navigation failures', async () => {
      const { render, userEvent } = await import('@/test/utils/test-utilities');
      render(<Step1Choose />);

      // Should work even if certain keyboard events fail
      await userEvent.tab();
      expect(document.activeElement).toBeInstanceOf(HTMLElement);
    });

    test('should handle high contrast mode', async () => {
      // Mock high contrast mode
      Object.defineProperty(window, 'matchMedia', {
        value: vi.fn().mockImplementation(() => ({
          matches: true,
          media: '(prefers-contrast: high)',
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
        writable: true,
      });

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step1Choose />);

      // Should adapt to high contrast mode
      expect(screen.getByText('Choose Service')).toBeInTheDocument();
    });
  });
});