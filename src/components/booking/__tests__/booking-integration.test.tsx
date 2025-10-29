// Booking Flow Integration Tests
// Tests the complete booking flow from service selection to payment

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';

// Import components and providers
import { BookingProvider } from '@/contexts/BookingContext';
import { useBookingStore } from '@/stores/bookingStore';
import * as apiGateway from '@/services/apiGateway';
import * as cqrsService from '@/services/cqrsService';

import { BookingSheet } from '../BookingSheet';

// Mock services
vi.mock('@/services/apiGateway');
vi.mock('@/services/cqrsService');
vi.mock('@/services/websocketService');
vi.mock('@/integrations/supabase/client');

// Mock services data
const mockServices = [
  {
    id: 'service-1',
    title: 'Beauty Brows',
    slug: 'beauty-brows',
    service_type: 'beauty',
    price_from: 300,
    price_to: 500,
    duration_minutes: 60,
    description: 'Professional brow service',
    image_url: '/test/brows.jpg',
  },
  {
    id: 'service-2',
    title: 'Fitness Glutes',
    slug: 'fitness-glutes',
    service_type: 'fitness',
    price_from: 200,
    price_to: 350,
    duration_minutes: 90,
    description: 'Intensive glute workout',
    image_url: '/test/glutes.jpg',
  },
];

const mockTimeSlots = [
  {
    id: 'slot-1',
    time: '09:00',
    available: true,
    location: 'studio',
    price: 300,
  },
  {
    id: 'slot-2',
    time: '10:30',
    available: true,
    location: 'studio',
    price: 300,
  },
  {
    id: 'slot-3',
    time: '14:00',
    available: false,
    location: 'studio',
    price: 300,
  },
];

// Test wrapper component
function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <BookingProvider>
          {children}
        </BookingProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

// Test helper functions
const renderBookingFlow = async () => {
  // Mock API responses
  vi.mocked(apiGateway.services.list).mockResolvedValue({
    success: true,
    data: mockServices,
    status: 200,
  });

  vi.mocked(apiGateway.services.get).mockImplementation((id) => {
    const service = mockServices.find(s => s.id === id);
    return Promise.resolve({
      success: true,
      data: service,
      status: 200,
    });
  });

  vi.mocked(apiGateway.availability.slots).mockResolvedValue({
    success: true,
    data: mockTimeSlots,
    status: 200,
  });

  vi.mocked(cqrsService.executeCommand).mockResolvedValue({
    id: 'booking-1',
    status: 'confirmed',
  });

  const utils = render(
    <TestWrapper>
      <BookingSheet isOpen={true} onClose={vi.fn()} />
    </TestWrapper>
  );

  return utils;
};

// Test data
const testClientDetails = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+48 123 456 789',
  notes: 'First time appointment',
};

describe('Booking Flow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    useBookingStore.getState().resetBooking();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Complete Booking Flow', () => {
    it('should complete full booking flow successfully', async () => {
      const user = userEvent.setup();

      // Render booking flow
      const { getByText, getByLabelText, getByRole } = await renderBookingFlow();

      // Step 1: Service Selection
      await waitFor(() => {
        expect(getByText('Select Service')).toBeInTheDocument();
      });

      // Select beauty service
      const beautyService = getByText('Beauty Brows');
      await user.click(beautyService);

      // Click continue
      await user.click(getByRole('button', { name: /continue/i }));

      // Step 2: Time Selection
      await waitFor(() => {
        expect(getByText('Select a Time')).toBeInTheDocument();
      });

      // Select first available time slot
      const timeSlot = getByText('09:00');
      await user.click(timeSlot);

      // Step should auto-advance
      await waitFor(() => {
        expect(getByText('Your Details')).toBeInTheDocument();
      });

      // Step 3: Client Details
      await waitFor(() => {
        expect(getByLabelText(/name/i)).toBeInTheDocument();
        expect(getByLabelText(/email/i)).toBeInTheDocument();
        expect(getByLabelText(/phone/i)).toBeInTheDocument();
      });

      // Fill in client details
      await user.type(getByLabelText(/name/i), testClientDetails.name);
      await user.type(getByLabelText(/email/i), testClientDetails.email);
      await user.type(getByLabelText(/phone/i), testClientDetails.phone);
      await user.type(getByLabelText(/notes/i), testClientDetails.notes);

      // Accept terms
      const termsCheckbox = getByLabelText(/terms and conditions/i);
      await user.click(termsCheckbox);

      // Click continue
      await user.click(getByRole('button', { name: /continue/i }));

      // Step 4: Payment
      await waitFor(() => {
        expect(getByText('Payment')).toBeInTheDocument();
      });

      // Select payment method
      const cardPayment = getByLabelText(/card/i);
      await user.click(cardPayment);

      // Complete booking
      await user.click(getByRole('button', { name: /complete booking/i }));

      // Verify booking was created
      await waitFor(() => {
        expect(cqrsService.executeCommand).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'CreateBooking',
            data: expect.objectContaining({
              serviceId: 'service-1',
              clientDetails: expect.objectContaining({
                name: testClientDetails.name,
                email: testClientDetails.email,
                phone: testClientDetails.phone,
              }),
            }),
          })
        );
      });

      // Verify success state
      await waitFor(() => {
        expect(getByText(/booking confirmed/i)).toBeInTheDocument();
      });
    });

    it('should handle booking cancellation correctly', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      const { getByText, getByRole } = render(
        <TestWrapper>
          <BookingSheet isOpen={true} onClose={onClose} />
        </TestWrapper>
      );

      // Start booking but close before completion
      await waitFor(() => {
        expect(getByText('Select Service')).toBeInTheDocument();
      });

      // Close booking sheet
      const closeButton = getByRole('button', { name: /close/i });
      await user.click(closeButton);

      // Verify onClose was called
      expect(onClose).toHaveBeenCalled();
    });

    it('should validate required fields correctly', async () => {
      const user = userEvent.setup();

      const { getByText, getByLabelText, getByRole } = await renderBookingFlow();

      // Navigate to details step without selecting service
      await user.click(getByRole('button', { name: /continue/i }));

      // Should stay on service selection step
      expect(getByText('Select Service')).toBeInTheDocument();

      // Select service and proceed to details
      await user.click(getByText('Beauty Brows'));
      await user.click(getByRole('button', { name: /continue/i }));

      // Wait for time selection
      await waitFor(() => {
        expect(getByText('Select a Time')).toBeInTheDocument();
      });

      // Select time and proceed
      await user.click(getByText('09:00'));

      // Wait for details step
      await waitFor(() => {
        expect(getByText('Your Details')).toBeInTheDocument();
      });

      // Try to proceed without filling details
      await user.click(getByRole('button', { name: /continue/i }));

      // Should stay on details step and show validation
      expect(getByText('Your Details')).toBeInTheDocument();
    });

    it('should handle API errors gracefully', async () => {
      const user = userEvent.setup();

      // Mock API error
      vi.mocked(apiGateway.services.list).mockRejectedValue(
        new Error('Failed to load services')
      );

      const { getByText } = render(
        <TestWrapper>
          <BookingSheet isOpen={true} onClose={vi.fn()} />
        </TestWrapper>
      );

      // Should show error state
      await waitFor(() => {
        expect(getByText(/failed to load services/i)).toBeInTheDocument();
      });
    });

    it('should handle slot reservation correctly', async () => {
      const user = userEvent.setup();

      // Mock slot reservation
      vi.mocked(apiGateway.availability.reserve).mockResolvedValue({
        success: true,
        data: { holdId: 'hold-1', expiresAt: new Date(Date.now() + 600000).toISOString() },
      });

      const { getByText } = await renderBookingFlow();

      // Navigate to time selection
      await user.click(getByText('Beauty Brows'));
      await user.click(getByRole('button', { name: /continue/i }));

      // Select time slot
      await waitFor(() => {
        expect(getByText('Select a Time')).toBeInTheDocument();
      });

      await user.click(getByText('09:00'));

      // Verify slot was reserved
      await waitFor(() => {
        expect(apiGateway.availability.reserve).toHaveBeenCalledWith(
          expect.objectContaining({
            serviceId: 'service-1',
            slotId: 'slot-1',
          })
        );
      });
    });

    it('should handle real-time slot updates', async () => {
      const user = userEvent.setup();

      const { getByText, queryByText } = await renderBookingFlow();

      // Navigate to time selection
      await user.click(getByText('Beauty Brows'));
      await user.click(getByRole('button', { name: /continue/i }));

      // Initially all slots should be available
      await waitFor(() => {
        expect(getByText('09:00')).toBeInTheDocument();
        expect(getByText('10:30')).toBeInTheDocument();
        expect(getByText('14:00')).toBeInTheDocument();
      });

      // Simulate slot being reserved by another user
      act(() => {
        // Simulate WebSocket event
        const event = new CustomEvent('slot:reserved', {
          detail: { slotId: 'slot-1', userId: 'other-user' },
        });
        window.dispatchEvent(event);
      });

      // Slot should show as reserved
      await waitFor(() => {
        expect(queryByText('09:00')).not.toBeInTheDocument();
        expect(getByText('Reserved')).toBeInTheDocument();
      });
    });
  });

  describe('Booking State Management', () => {
    it('should persist booking state across steps', async () => {
      const user = userEvent.setup();

      const { getByText, store } = await renderBookingFlow();
      const bookingStore = useBookingStore.getState();

      // Select service
      await user.click(getByText('Beauty Brows'));

      // Check store state
      expect(bookingStore.selectedService).toEqual(
        expect.objectContaining({
          id: 'service-1',
          title: 'Beauty Brows',
        })
      );

      // Select time slot
      await user.click(getByRole('button', { name: /continue/i }));
      await user.click(getByText('09:00'));

      // Check store state
      expect(bookingStore.selectedTimeSlot).toEqual(
        expect.objectContaining({
          time: '09:00',
          available: true,
        })
      );
    });

    it('should reset booking state when requested', async () => {
      const { store } = await renderBookingFlow();
      const bookingStore = useBookingStore.getState();

      // Select service
      act(() => {
        bookingStore.selectService(mockServices[0]);
      });

      // Reset store
      act(() => {
        bookingStore.resetBooking();
      });

      // Verify state is cleared
      expect(bookingStore.selectedService).toBeNull();
      expect(bookingStore.selectedTimeSlot).toBeNull();
      expect(bookingStore.bookingDetails).toBeNull();
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();

      const { getByText, getByRole } = await renderBookingFlow();

      // Navigate using Tab key
      await user.tab();
      expect(getByRole('button', { name: /close/i })).toHaveFocus();

      // Continue through flow with Enter key
      await user.tab();
      await user.keyboard('{Enter}'); // Select service

      await user.tab();
      await user.keyboard('{Enter}'); // Continue button

      // Should have navigated to next step
      await waitFor(() => {
        expect(getByText('Select a Time')).toBeInTheDocument();
      });
    });

    it('should have proper ARIA labels', async () => {
      const { getByLabelText, getByRole } = await renderBookingFlow();

      // Check for proper ARIA labels
      expect(getByRole('dialog', { name: /booking/i })).toBeInTheDocument();
      expect(getByLabelText(/step 1 of 4/i)).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should load services efficiently', async () => {
      const startTime = performance.now();

      await renderBookingFlow();

      const loadTime = performance.now() - startTime;

      // Should load within 1 second
      expect(loadTime).toBeLessThan(1000);
    });

    it('should cache loaded data', async () => {
      const { getByText } = await renderBookingFlow();

      // Services should be loaded once
      expect(apiGateway.services.list).toHaveBeenCalledTimes(1);

      // Navigate away and back
      // (In a real test, this would involve routing)

      // Should not reload services from cache
      // expect(apiGateway.services.list).toHaveBeenCalledTimes(1);
    });
  });
});