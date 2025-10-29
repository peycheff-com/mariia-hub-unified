import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/utils/workflow-test-utils';

// Import components for performance testing
import { ServiceCard } from '@/components/ServiceCard';
import { AvailableSlotsList } from '@/components/AvailableSlotsList';
import { BookingWizard } from '@/components/booking/BookingWizard';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

import {
  createMockService,
  createLargeServiceDataset,
  createLargeBookingDataset,
  createMockTimeSlot,
  expectRenderPerformance,
  expectMemoryUsageWithin,
  measureAsyncOperation,
  getMemoryUsage,
} from '../utils/workflow-test-utils';

describe('Component Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Service Card Performance', () => {
    it('renders single service card within performance threshold', async () => {
      const service = createMockService({
        id: 'svc_performance_test',
        name: 'Performance Test Service',
        price_pln: 500,
      });

      const renderTime = await expectRenderPerformance(
        <ServiceCard service={service} />,
        50 // 50ms max for simple component
      );

      expect(renderTime).toBeLessThan(50);
    });

    it('handles large service lists efficiently', async () => {
      const largeServiceList = createLargeServiceDataset(100);

      const renderTime = await expectRenderPerformance(
        <div>
          {largeServiceList.map(service => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>,
        500 // 500ms max for 100 cards
      );

      expect(renderTime).toBeLessThan(500);

      // Verify all cards are rendered
      expect(screen.getAllByText(/Service \d+/)).toHaveLength(100);
    });

    it('performs well with service filtering', async () => {
      const largeServiceList = createLargeServiceDataset(50);

      const { container } = render(
        <div>
          {largeServiceList.map(service => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      );

      // Simulate filter operation
      const startTime = performance.now();

      const filteredCards = container.querySelectorAll('[data-category="beauty"]');

      const endTime = performance.now();
      const filterTime = endTime - startTime;

      expect(filterTime).toBeLessThan(10); // Filtering should be very fast
    });
  });

  describe('Available Slots Performance', () => {
    beforeEach(() => {
      vi.mock('@/hooks/useSlotGeneration', () => ({
        useSlotGeneration: () => ({
          slots: Array.from({ length: 200 }, (_, i) => ({
            time: new Date(`2030-01-01T${String(i % 24).padStart(2, '0')}:00:00.000Z`),
            available: i % 3 !== 0, // 2/3 available
          })),
          loading: false,
        }),
      }));
    });

    it('renders large time slot lists efficiently', async () => {
      const renderTime = await expectRenderPerformance(
        <AvailableSlotsList
          serviceId="svc_test"
          locationId="loc_test"
          durationMinutes={60}
          onSelectSlot={vi.fn()}
        />,
        300 // 300ms max for large slot list
      );

      expect(renderTime).toBeLessThan(300);

      // Verify slots are rendered
      const timeButtons = screen.getAllByRole('button').filter(btn =>
        btn.textContent && /^\d{1,2}:\d{2}$/.test(btn.textContent)
      );
      expect(timeButtons.length).toBeGreaterThan(100);
    });

    it('handles slot selection quickly', async () => {
      render(
        <AvailableSlotsList
          serviceId="svc_test"
          locationId="loc_test"
          durationMinutes={60}
          onSelectSlot={vi.fn()}
        />
      );

      const timeButtons = screen.getAllByRole('button').filter(btn =>
        btn.textContent && /^\d{1,2}:\d{2}$/.test(btn.textContent)
      );

      if (timeButtons.length > 0) {
        const startTime = performance.now();

        fireEvent.click(timeButtons[0]);

        const endTime = performance.now();
        const clickTime = endTime - startTime;

        expect(clickTime).toBeLessThan(50); // Click handling should be very fast
      }
    });

    it('efficiently updates available slots when date changes', async () => {
      const { rerender } = render(
        <AvailableSlotsList
          serviceId="svc_test"
          locationId="loc_test"
          durationMinutes={60}
          selectedDate={new Date('2030-01-01')}
          onSelectSlot={vi.fn()}
        />
      );

      const startTime = performance.now();

      // Change selected date
      rerender(
        <AvailableSlotsList
          serviceId="svc_test"
          locationId="loc_test"
          durationMinutes={60}
          selectedDate={new Date('2030-01-02')}
          onSelectSlot={vi.fn()}
        />
      );

      const endTime = performance.now();
      const updateTime = endTime - startTime;

      expect(updateTime).toBeLessThan(100); // Date change should be fast
    });
  });

  describe('Booking Wizard Performance', () => {
    it('renders complete booking wizard within threshold', async () => {
      const service = createMockService({
        id: 'svc_wizard_test',
        name: 'Wizard Performance Test',
        duration_minutes: 120,
        price_pln: 1000,
      });

      const renderTime = await expectRenderPerformance(
        <BookingWizard initialService={service} />,
        200 // 200ms max for complex component
      );

      expect(renderTime).toBeLessThan(200);
    });

    it('handles step transitions efficiently', async () => {
      const service = createMockService();

      render(<BookingWizard initialService={service} />);

      // Measure time for step 1 to step 2 transition
      const { duration: step2Time } = await measureAsyncOperation(async () => {
        const timeSlots = screen.getAllByRole('button').filter(btn =>
          btn.textContent && /^\d{1,2}:\d{2}$/.test(btn.textContent)
        );

        if (timeSlots.length > 0) {
          fireEvent.click(timeSlots[0]);
        }

        await waitFor(() => {
          expect(screen.getByText('Your Information')).toBeInTheDocument();
        });
      }, 'Step 1 to Step 2 transition');

      expect(step2Time).toBeLessThan(150);

      // Measure time for step 2 to step 3 transition
      const { duration: step3Time } = await measureAsyncOperation(async () => {
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
      }, 'Step 2 to Step 3 transition');

      expect(step3Time).toBeLessThan(200);
    });

    it('maintains performance with complex form validation', async () => {
      const service = createMockService();

      render(<BookingWizard initialService={service} />);

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

      // Test validation performance
      const startTime = performance.now();

      // Try to submit without required fields
      const continueButton = screen.getByText('Continue to Payment');
      fireEvent.click(continueButton);

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      });

      const endTime = performance.now();
      const validationTime = endTime - startTime;

      expect(validationTime).toBeLessThan(100); // Validation should be very fast
    });
  });

  describe('Admin Dashboard Performance', () => {
    beforeEach(() => {
      // Mock admin data
      vi.mock('@/hooks/useAdminData', () => ({
        useAdminData: () => ({
          services: createLargeServiceDataset(50),
          bookings: createLargeBookingDataset(100),
          users: Array.from({ length: 25 }, (_, i) => ({
            id: `user_${i}`,
            email: `user${i}@example.com`,
            name: `User ${i}`,
          })),
          analytics: {
            totalRevenue: 50000,
            totalBookings: 1000,
            conversionRate: 0.15,
          },
          loading: false,
        }),
      }));
    });

    it('renders admin dashboard with large datasets efficiently', async () => {
      const renderTime = await expectRenderPerformance(
        <AdminDashboard />,
        800 // 800ms max for complex dashboard with lots of data
      );

      expect(renderTime).toBeLessThan(800);

      // Verify data is loaded
      expect(screen.getByText('50')).toBeInTheDocument(); // Service count
      expect(screen.getByText('100')).toBeInTheDocument(); // Booking count
    });

    it('handles data filtering and sorting efficiently', async () => {
      render(<AdminDashboard />);

      // Test service filtering
      const startTime = performance.now();

      const filterInput = screen.getByPlaceholderText(/search services/i);
      fireEvent.change(filterInput, { target: { value: 'Service 1' } });

      await waitFor(() => {
        const filteredServices = screen.getAllByText(/Service 1/);
        expect(filteredServices.length).toBeGreaterThan(0);
      });

      const endTime = performance.now();
      const filterTime = endTime - startTime;

      expect(filterTime).toBeLessThan(200); // Filtering should be fast
    });
  });

  describe('Memory Usage Tests', () => {
    it('maintains reasonable memory usage with large datasets', async () => {
      const initialMemory = getMemoryUsage();

      // Render component with large dataset
      const largeServiceList = createLargeServiceDataset(200);

      render(
        <div>
          {largeServiceList.map(service => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      );

      // Wait for render to complete
      await waitFor(() => {
        expect(screen.getAllByText(/Service \d+/)).toHaveLength(200);
      });

      const finalMemory = getMemoryUsage();

      if (initialMemory && finalMemory) {
        const memoryIncrease = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;

        // Memory increase should be reasonable (less than 50MB for 200 service cards)
        expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      }
    });

    it('properly cleans up memory on component unmount', async () => {
      const initialMemory = getMemoryUsage();

      const { unmount } = render(
        <div>
          {createLargeServiceDataset(100).map(service => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      );

      await waitFor(() => {
        expect(screen.getAllByText(/Service \d+/)).toHaveLength(100);
      });

      const peakMemory = getMemoryUsage();

      // Unmount component
      unmount();

      // Wait for garbage collection (if available)
      await new Promise(resolve => setTimeout(resolve, 100));

      const finalMemory = getMemoryUsage();

      if (initialMemory && peakMemory && finalMemory) {
        const peakIncrease = peakMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
        const finalIncrease = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;

        // Final memory usage should be closer to initial than peak
        expect(finalIncrease).toBeLessThan(peakIncrease * 0.8);
      }
    });
  });

  describe('Async Operation Performance', () => {
    it('handles async data loading efficiently', async () => {
      // Mock slow API response
      vi.mock('@/hooks/useServices', () => ({
        useServices: () => ({
          services: createLargeServiceDataset(50),
          loading: false,
          error: null,
        }),
      }));

      const { duration } = await measureAsyncOperation(async () => {
        render(<BookingWizard />);

        await waitFor(() => {
          expect(screen.getByText(/select a service/i)).toBeInTheDocument();
        });
      }, 'Initial data load');

      expect(duration).toBeLessThan(500); // Initial load should be under 500ms
    });

    it('concurrent async operations are handled efficiently', async () => {
      const startTime = performance.now();

      // Simulate concurrent operations
      const promises = [
        measureAsyncOperation(async () => {
          render(<ServiceCard service={createMockService()} />);
          await new Promise(resolve => setTimeout(resolve, 50));
        }, 'Operation 1'),

        measureAsyncOperation(async () => {
          render(<ServiceCard service={createMockService()} />);
          await new Promise(resolve => setTimeout(resolve, 50));
        }, 'Operation 2'),

        measureAsyncOperation(async () => {
          render(<ServiceCard service={createMockService()} />);
          await new Promise(resolve => setTimeout(resolve, 50));
        }, 'Operation 3'),
      ];

      await Promise.all(promises);

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Concurrent operations should complete faster than sequential
      expect(totalTime).toBeLessThan(200); // Should be close to the longest single operation
    });
  });

  describe('Re-render Performance', () => {
    it('minimizes unnecessary re-renders during prop updates', async () => {
      const service = createMockService();

      const { rerender } = render(<ServiceCard service={service} />);

      const startTime = performance.now();

      // Update props multiple times
      for (let i = 0; i < 10; i++) {
        const updatedService = { ...service, name: `Updated Service ${i}` };
        rerender(<ServiceCard service={updatedService} />);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // 10 re-renders should be very fast
      expect(totalTime).toBeLessThan(100);
      expect(totalTime / 10).toBeLessThan(10); // Average per re-render
    });

    it('efficiently handles state updates in booking flow', async () => {
      const service = createMockService();

      render(<BookingWizard initialService={service} />);

      const startTime = performance.now();

      // Rapid state updates
      const nameInput = screen.getByLabelText(/name/i);
      for (let i = 0; i < 20; i++) {
        fireEvent.change(nameInput, { target: { value: `User ${i}` } });
      }

      const endTime = performance.now();
      const updateTime = endTime - startTime;

      // Rapid input changes should be handled efficiently
      expect(updateTime).toBeLessThan(200);
      expect(updateTime / 20).toBeLessThan(10); // Average per update
    });
  });
});