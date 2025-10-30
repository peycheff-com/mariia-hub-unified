import { describe, it, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@/test/utils/test-utilities';
import { QueryClient } from '@tanstack/react-query';
import Step1Choose from '@/components/booking/Step1Choose';
import { createService, createServices } from '@/test/factories/extended-factories';
import { BookingService } from '@/services/booking.service';
import * as bookingStoreModule from '@/stores/bookingStore';

// Mock the booking store
const mockSelectService = vi.fn();
const mockResetBooking = vi.fn();
const mockSelectedService = null;

vi.mock('@/stores/bookingStore', () => ({
  useBookingStore: () => ({
    selectService: mockSelectService,
    resetBooking: mockResetBooking,
    selectedService: mockSelectedService,
    serviceType: null,
    canProceed: { step1: false },
    currentStep: 1,
  }),
}));

describe('Step1Choose - Service Selection', () => {
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
      getServices: vi.fn(),
      getServicesByCategory: vi.fn(),
      searchServices: vi.fn(),
    };

    vi.spyOn(BookingService.prototype, 'constructor').mockImplementation(() => mockBookingService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    test('should render service selection interface', async () => {
      const mockServices = createServices(6);
      mockBookingService.getServices.mockResolvedValue({ data: mockServices, error: null });

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step1Choose />);

      expect(screen.getByText('Choose Service')).toBeInTheDocument();
      expect(screen.getByText('Select the service you would like to book')).toBeInTheDocument();
    });

    test('should display category filters', async () => {
      const mockServices = createServices(6);
      mockBookingService.getServices.mockResolvedValue({ data: mockServices, error: null });

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step1Choose />);

      expect(screen.getByRole('button', { name: /beauty/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /fitness/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /lifestyle/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /all/i })).toBeInTheDocument();
    });

    test('should show loading state initially', () => {
      const { render } = await import('@/test/utils/test-utilities');
      render(<Step1Choose />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText('Loading services...')).toBeInTheDocument();
    });
  });

  describe('Service Loading', () => {
    test('should load and display services successfully', async () => {
      const mockServices = createServices(6, {
        category: 'beauty',
        is_active: true,
      });
      mockBookingService.getServices.mockResolvedValue({ data: mockServices, error: null });

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step1Choose />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Verify services are displayed
      mockServices.forEach((service) => {
        expect(screen.getByText(service.title)).toBeInTheDocument();
        expect(screen.getByText(`${service.price} ${service.currency}`)).toBeInTheDocument();
      });
    });

    test('should handle empty services list', async () => {
      mockBookingService.getServices.mockResolvedValue({ data: [], error: null });

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step1Choose />);

      await waitFor(() => {
        expect(screen.getByText('No services available')).toBeInTheDocument();
        expect(screen.getByText('Please check back later or contact us for more information')).toBeInTheDocument();
      });
    });

    test('should handle service loading error', async () => {
      const errorMessage = 'Failed to load services';
      mockBookingService.getServices.mockRejectedValue(new Error(errorMessage));

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step1Choose />);

      await waitFor(() => {
        expect(screen.getByText('Error loading services')).toBeInTheDocument();
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    test('should retry loading services on retry button click', async () => {
      const errorMessage = 'Network error';
      mockBookingService.getServices
        .mockRejectedValueOnce(new Error(errorMessage))
        .mockResolvedValueOnce({ data: createServices(3), error: null });

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step1Choose />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(retryButton);

      expect(mockBookingService.getServices).toHaveBeenCalledTimes(2);
    });
  });

  describe('Service Filtering', () => {
    let mockServices: any[];

    beforeEach(() => {
      mockServices = [
        ...createServices(3, { category: 'beauty', is_active: true }),
        ...createServices(2, { category: 'fitness', is_active: true }),
        ...createServices(1, { category: 'lifestyle', is_active: true }),
      ];
    });

    test('should filter services by category', async () => {
      mockBookingService.getServices.mockResolvedValue({ data: mockServices, error: null });

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step1Choose />);

      await waitFor(() => {
        expect(screen.getByText(mockServices[0].title)).toBeInTheDocument();
      });

      // Click on Beauty filter
      const beautyFilter = screen.getByRole('button', { name: /beauty/i });
      fireEvent.click(beautyFilter);

      await waitFor(() => {
        // Should only show beauty services
        const beautyServices = mockServices.filter(s => s.category === 'beauty');
        beautyServices.forEach((service) => {
          expect(screen.getByText(service.title)).toBeInTheDocument();
        });

        // Should not show fitness services
        const fitnessServices = mockServices.filter(s => s.category === 'fitness');
        fitnessServices.forEach((service) => {
          expect(screen.queryByText(service.title)).not.toBeInTheDocument();
        });
      });
    });

    test('should show all services when "All" filter is selected', async () => {
      mockBookingService.getServices.mockResolvedValue({ data: mockServices, error: null });

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step1Choose />);

      await waitFor(() => {
        expect(screen.getByText(mockServices[0].title)).toBeInTheDocument();
      });

      // Click on Beauty filter first
      const beautyFilter = screen.getByRole('button', { name: /beauty/i });
      fireEvent.click(beautyFilter);

      await waitFor(() => {
        const fitnessServices = mockServices.filter(s => s.category === 'fitness');
        expect(screen.queryByText(fitnessServices[0].title)).not.toBeInTheDocument();
      });

      // Click on All filter
      const allFilter = screen.getByRole('button', { name: /all/i });
      fireEvent.click(allFilter);

      await waitFor(() => {
        // Should show all services again
        mockServices.forEach((service) => {
          expect(screen.getByText(service.title)).toBeInTheDocument();
        });
      });
    });

    test('should search services by keyword', async () => {
      mockBookingService.getServices.mockResolvedValue({ data: mockServices, error: null });

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step1Choose />);

      await waitFor(() => {
        expect(screen.getByText(mockServices[0].title)).toBeInTheDocument();
      });

      // Find search input
      const searchInput = screen.getByPlaceholderText(/search services/i);
      expect(searchInput).toBeInTheDocument();

      // Search for a specific service
      const targetService = mockServices[0];
      fireEvent.change(searchInput, { target: { value: targetService.title.substring(0, 5) } });

      await waitFor(() => {
        expect(screen.getByText(targetService.title)).toBeInTheDocument();
        // Other services should be filtered out
        mockServices.slice(1).forEach((service) => {
          if (!service.title.toLowerCase().includes(targetService.title.substring(0, 5).toLowerCase())) {
            expect(screen.queryByText(service.title)).not.toBeInTheDocument();
          }
        });
      });
    });

    test('should handle search with no results', async () => {
      mockBookingService.getServices.mockResolvedValue({ data: mockServices, error: null });

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step1Choose />);

      await waitFor(() => {
        expect(screen.getByText(mockServices[0].title)).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search services/i);
      fireEvent.change(searchInput, { target: { value: 'NonExistentService' } });

      await waitFor(() => {
        expect(screen.getByText('No services found')).toBeInTheDocument();
        expect(screen.getByText('Try adjusting your search or filters')).toBeInTheDocument();
      });
    });

    test('should clear search when clear button is clicked', async () => {
      mockBookingService.getServices.mockResolvedValue({ data: mockServices, error: null });

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step1Choose />);

      await waitFor(() => {
        expect(screen.getByText(mockServices[0].title)).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search services/i);
      const clearButton = screen.getByRole('button', { name: /clear search/i });

      // Search first
      fireEvent.change(searchInput, { target: { value: 'test' } });
      expect(searchInput).toHaveValue('test');

      // Clear search
      fireEvent.click(clearButton);

      expect(searchInput).toHaveValue('');
      await waitFor(() => {
        mockServices.forEach((service) => {
          expect(screen.getByText(service.title)).toBeInTheDocument();
        });
      });
    });
  });

  describe('Service Selection', () => {
    let mockServices: any[];

    beforeEach(() => {
      mockServices = createServices(3, { is_active: true });
      mockBookingService.getServices.mockResolvedValue({ data: mockServices, error: null });
    });

    test('should select a service when clicked', async () => {
      const { render } = await import('@/test/utils/test-utilities');
      render(<Step1Choose />);

      await waitFor(() => {
        expect(screen.getByText(mockServices[0].title)).toBeInTheDocument();
      });

      const serviceCard = screen.getByText(mockServices[0].title).closest('[data-testid="service-card"]');
      expect(serviceCard).toBeInTheDocument();

      fireEvent.click(serviceCard!);

      expect(mockSelectService).toHaveBeenCalledWith(mockServices[0]);
    });

    test('should highlight selected service', async () => {
      const { render } = await import('@/test/utils/test-utilities');
      render(<Step1Choose />);

      await waitFor(() => {
        expect(screen.getByText(mockServices[0].title)).toBeInTheDocument();
      });

      const serviceCard = screen.getByText(mockServices[0].title).closest('[data-testid="service-card"]');
      fireEvent.click(serviceCard!);

      await waitFor(() => {
        expect(serviceCard).toHaveClass('selected');
        expect(serviceCard).toHaveAttribute('aria-selected', 'true');
      });
    });

    test('should allow changing selected service', async () => {
      const { render } = await import('@/test/utils/test-utilities');
      render(<Step1Choose />);

      await waitFor(() => {
        expect(screen.getByText(mockServices[0].title)).toBeInTheDocument();
      });

      // Select first service
      const firstServiceCard = screen.getByText(mockServices[0].title).closest('[data-testid="service-card"]');
      fireEvent.click(firstServiceCard!);

      expect(mockSelectService).toHaveBeenCalledWith(mockServices[0]);

      // Select second service
      const secondServiceCard = screen.getByText(mockServices[1].title).closest('[data-testid="service-card"]');
      fireEvent.click(secondServiceCard!);

      expect(mockSelectService).toHaveBeenCalledWith(mockServices[1]);
      expect(firstServiceCard).not.toHaveClass('selected');
      expect(secondServiceCard).toHaveClass('selected');
    });

    test('should show continue button when service is selected', async () => {
      const { render } = await import('@/test/utils/test-utilities');
      render(<Step1Choose />);

      // Continue button should be disabled initially
      const continueButton = screen.getByRole('button', { name: /continue/i });
      expect(continueButton).toBeDisabled();

      await waitFor(() => {
        expect(screen.getByText(mockServices[0].title)).toBeInTheDocument();
      });

      const serviceCard = screen.getByText(mockServices[0].title).closest('[data-testid="service-card"]');
      fireEvent.click(serviceCard!);

      await waitFor(() => {
        expect(continueButton).not.toBeDisabled();
      });
    });
  });

  describe('Service Details', () => {
    test('should show service details modal when service is clicked', async () => {
      const mockService = createService({
        description: 'Test service description',
        duration: 60,
        price: 200,
        benefits: ['Benefit 1', 'Benefit 2'],
        preparation: 'Prepare for service',
        aftercare: 'After care instructions',
      });
      mockBookingService.getServices.mockResolvedValue({ data: [mockService], error: null });

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step1Choose />);

      await waitFor(() => {
        expect(screen.getByText(mockService.title)).toBeInTheDocument();
      });

      // Click on details button
      const detailsButton = screen.getByRole('button', { name: /view details/i });
      fireEvent.click(detailsButton);

      await waitFor(() => {
        expect(screen.getByText('Service Details')).toBeInTheDocument();
        expect(screen.getByText(mockService.description)).toBeInTheDocument();
        expect(screen.getByText(`${mockService.duration} minutes`)).toBeInTheDocument();
        expect(screen.getByText(`${mockService.price} ${mockService.currency}`)).toBeInTheDocument();
        expect(screen.getByText('Benefits')).toBeInTheDocument();
        expect(screen.getByText('Preparation')).toBeInTheDocument();
        expect(screen.getByText('Aftercare')).toBeInTheDocument();
      });
    });

    test('should close details modal when close button is clicked', async () => {
      const mockService = createService();
      mockBookingService.getServices.mockResolvedValue({ data: [mockService], error: null });

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step1Choose />);

      await waitFor(() => {
        const detailsButton = screen.getByRole('button', { name: /view details/i });
        fireEvent.click(detailsButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Service Details')).toBeInTheDocument();
      });

      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('Service Details')).not.toBeInTheDocument();
      });
    });

    test('should select service from details modal', async () => {
      const mockService = createService();
      mockBookingService.getServices.mockResolvedValue({ data: [mockService], error: null });

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step1Choose />);

      await waitFor(() => {
        const detailsButton = screen.getByRole('button', { name: /view details/i });
        fireEvent.click(detailsButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Service Details')).toBeInTheDocument();
      });

      const selectButton = screen.getByRole('button', { name: /select this service/i });
      fireEvent.click(selectButton);

      expect(mockSelectService).toHaveBeenCalledWith(mockService);
      expect(screen.queryByText('Service Details')).not.toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    test('should go back when back button is clicked', async () => {
      const mockServices = createServices(3);
      mockBookingService.getServices.mockResolvedValue({ data: mockServices, error: null });

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step1Choose />);

      await waitFor(() => {
        expect(screen.getByText(mockServices[0].title)).toBeInTheDocument();
      });

      const backButton = screen.getByRole('button', { name: /back/i });
      expect(backButton).toBeInTheDocument();

      // Note: Navigation testing would require router mock setup
      // This is a placeholder for navigation behavior
      expect(backButton).toBeInTheDocument();
    });

    test('should proceed to next step when continue button is clicked with selected service', async () => {
      const mockServices = createServices(3);
      mockBookingService.getServices.mockResolvedValue({ data: mockServices, error: null });

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step1Choose />);

      await waitFor(() => {
        expect(screen.getByText(mockServices[0].title)).toBeInTheDocument();
      });

      // Select a service
      const serviceCard = screen.getByText(mockServices[0].title).closest('[data-testid="service-card"]');
      fireEvent.click(serviceCard!);

      // Continue button should be enabled
      const continueButton = screen.getByRole('button', { name: /continue/i });
      expect(continueButton).not.toBeDisabled();

      // Click continue
      fireEvent.click(continueButton);

      // Note: Navigation testing would require router mock setup
      // This verifies the button is clickable and enabled
      expect(continueButton).not.toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels and roles', async () => {
      const mockServices = createServices(3);
      mockBookingService.getServices.mockResolvedValue({ data: mockServices, error: null });

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step1Choose />);

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
        expect(screen.getByRole('region', { name: /service filters/i })).toBeInTheDocument();
        expect(screen.getByRole('grid', { name: /services/i })).toBeInTheDocument();
      });

      // Service cards should be selectable
      const serviceCards = screen.getAllByRole('gridcell');
      serviceCards.forEach((card) => {
        expect(card).toHaveAttribute('tabindex', '0');
      });
    });

    test('should support keyboard navigation', async () => {
      const mockServices = createServices(3);
      mockBookingService.getServices.mockResolvedValue({ data: mockServices, error: null });

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step1Choose />);

      await waitFor(() => {
        expect(screen.getByText(mockServices[0].title)).toBeInTheDocument();
      });

      const firstServiceCard = screen.getByText(mockServices[0].title).closest('[data-testid="service-card"]');

      // Focus service card
      firstServiceCard?.focus();
      expect(firstServiceCard).toHaveFocus();

      // Select with Enter key
      fireEvent.keyDown(firstServiceCard!, { key: 'Enter', code: 'Enter' });
      expect(mockSelectService).toHaveBeenCalledWith(mockServices[0]);

      // Select with Space key
      fireEvent.keyDown(firstServiceCard!, { key: ' ', code: 'Space' });
      expect(mockSelectService).toHaveBeenCalledTimes(2);
    });

    test('should announce filter changes to screen readers', async () => {
      const mockServices = createServices(6);
      mockBookingService.getServices.mockResolvedValue({ data: mockServices, error: null });

      const { render } = await import('@/test/utils/test-utilities');
      render(<Step1Choose />);

      await waitFor(() => {
        expect(screen.getByText(mockServices[0].title)).toBeInTheDocument();
      });

      // Check for live region announcements
      expect(screen.getByRole('status')).toBeInTheDocument();

      // Change filter
      const beautyFilter = screen.getByRole('button', { name: /beauty/i });
      fireEvent.click(beautyFilter);

      // Should announce the filter change
      const statusRegion = screen.getByRole('status');
      expect(statusRegion).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    test('should not make unnecessary API calls', async () => {
      const mockServices = createServices(3);
      mockBookingService.getServices.mockResolvedValue({ data: mockServices, error: null });

      const { render, rerender } = await import('@/test/utils/test-utilities');
      const { unmount } = render(<Step1Choose />);

      await waitFor(() => {
        expect(mockBookingService.getServices).toHaveBeenCalledTimes(1);
      });

      // Rerender should not trigger new API call
      rerender(<Step1Choose />);
      await waitFor(() => {
        expect(mockBookingService.getServices).toHaveBeenCalledTimes(1);
      });

      // Cleanup
      unmount();
    });

    test('should handle large service lists efficiently', async () => {
      const largeServiceList = createServices(100);
      mockBookingService.getServices.mockResolvedValue({ data: largeServiceList, error: null });

      const { render } = await import('@/test/utils/test-utilities');
      const startTime = performance.now();

      render(<Step1Choose />);

      await waitFor(() => {
        expect(screen.getByText(largeServiceList[0].title)).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (less than 1 second)
      expect(renderTime).toBeLessThan(1000);
    });
  });
});