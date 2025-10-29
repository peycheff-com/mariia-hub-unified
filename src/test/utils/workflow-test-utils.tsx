import { ReactElement } from 'react';
import { render, RenderOptions, fireEvent, waitFor, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { vi, type MockedFunction } from 'vitest';

import i18n from '../i18n-test';
import { BookingContext } from '@/contexts/BookingContext';
import { CurrencyContext } from '@/contexts/CurrencyContext';
import { ModeContext } from '@/contexts/ModeContext';

// Test data factories
export const createMockService = (overrides = {}) => ({
  id: 'svc_test',
  name: 'Test Service',
  description: 'Test description',
  duration_minutes: 60,
  price_pln: 300,
  price_eur: 70,
  price_usd: 80,
  category: 'beauty',
  is_active: true,
  location_id: 'loc_test',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const createMockTimeSlot = (overrides = {}) => ({
  id: 'slot_test',
  start_time: '2030-01-01T10:00:00.000Z',
  end_time: '2030-01-01T11:00:00.000Z',
  service_id: 'svc_test',
  location_id: 'loc_test',
  is_available: true,
  ...overrides,
});

export const createMockBooking = (overrides = {}) => ({
  id: 'booking_test',
  service_id: 'svc_test',
  client_email: 'test@example.com',
  client_name: 'Test Client',
  start_time: '2030-01-01T10:00:00.000Z',
  end_time: '2030-01-01T11:00:00.000Z',
  status: 'confirmed',
  total_price: 300,
  currency: 'PLN',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const createMockUser = (overrides = {}) => ({
  id: 'user_test',
  email: 'test@example.com',
  name: 'Test User',
  role: 'client',
  phone: '+48 123 456 789',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

// Performance measurement utilities
export const measureRenderTime = async (component: ReactElement, options?: RenderOptions) => {
  const startTime = performance.now();
  const result = render(component, options);
  const endTime = performance.now();

  return {
    ...result,
    renderTime: endTime - startTime,
  };
};

export const measureAsyncOperation = async <T>(
  operation: () => Promise<T>,
  label: string
): Promise<{ result: T; duration: number }> => {
  const startTime = performance.now();
  const result = await operation();
  const endTime = performance.now();

  return {
    result,
    duration: endTime - startTime,
  };
};

// Mock context providers for testing
export const createMockBookingContext = (overrides = {}) => ({
  selectedService: null,
  selectedLocation: null,
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
  ...overrides,
});

export const createMockCurrencyContext = (overrides = {}) => ({
  currency: 'PLN',
  setCurrency: vi.fn(),
  convertPrice: vi.fn((price: number) => price),
  formatPrice: vi.fn((price: number, currency: string) => `${price} ${currency}`),
  ...overrides,
});

export const createMockModeContext = (overrides = {}) => ({
  mode: 'beauty',
  setMode: vi.fn(),
  preferences: {},
  updatePreferences: vi.fn(),
  ...overrides,
});

// Test providers wrapper with all contexts
interface WorkflowTestProvidersProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
  bookingContext?: ReturnType<typeof createMockBookingContext>;
  currencyContext?: ReturnType<typeof createMockCurrencyContext>;
  modeContext?: ReturnType<typeof createMockModeContext>;
}

export const WorkflowTestProviders = ({
  children,
  queryClient,
  bookingContext = createMockBookingContext(),
  currencyContext = createMockCurrencyContext(),
  modeContext = createMockModeContext(),
}: WorkflowTestProvidersProps) => {
  const testQueryClient = queryClient || new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={testQueryClient}>
      <I18nextProvider i18n={i18n}>
        <BrowserRouter>
          <BookingContext.Provider value={bookingContext}>
            <CurrencyContext.Provider value={currencyContext}>
              <ModeContext.Provider value={modeContext}>
                {children}
              </ModeContext.Provider>
            </CurrencyContext.Provider>
          </BookingContext.Provider>
        </BrowserRouter>
      </I18nextProvider>
    </QueryClientProvider>
  );
};

// Custom render function with workflow providers
export const renderWithWorkflowProviders = (
  ui: ReactElement,
  options?: {
    queryClient?: QueryClient;
    bookingContext?: ReturnType<typeof createMockBookingContext>;
    currencyContext?: ReturnType<typeof createMockCurrencyContext>;
    modeContext?: ReturnType<typeof createMockModeContext>;
  } & Omit<RenderOptions, 'wrapper'>
) => {
  const {
    queryClient,
    bookingContext,
    currencyContext,
    modeContext,
    ...renderOptions
  } = options || {};

  return render(ui, {
    wrapper: ({ children }) => (
      <WorkflowTestProviders
        queryClient={queryClient}
        bookingContext={bookingContext}
        currencyContext={currencyContext}
        modeContext={modeContext}
      >
        {children}
      </WorkflowTestProviders>
    ),
    ...renderOptions,
  });
};

// Workflow simulation helpers
export const simulateBookingFlow = async (
  renderResult: ReturnType<typeof renderWithWorkflowProviders>,
  serviceData = createMockService(),
  timeSlotData = createMockTimeSlot()
) => {
  const { container } = renderResult;

  // Step 1: Select service
  const serviceButton = screen.getByText(serviceData.name);
  fireEvent.click(serviceButton);

  // Wait for service selection to process
  await waitFor(() => {
    expect(screen.getByText(/when works for you/i)).toBeInTheDocument();
  });

  // Step 2: Select time slot
  const timeButtons = screen.getAllByRole('button').filter(btn =>
    btn.textContent && /^\d{1,2}:\d{2}$/.test(btn.textContent)
  );

  if (timeButtons.length > 0) {
    fireEvent.click(timeButtons[0]);
  }

  // Wait for time selection to process
  await waitFor(() => {
    expect(screen.getByText(/your information/i)).toBeInTheDocument();
  });

  // Step 3: Fill client information
  const nameInput = screen.getByLabelText(/name/i);
  const emailInput = screen.getByLabelText(/email/i);

  fireEvent.change(nameInput, { target: { value: 'Test User' } });
  fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

  return renderResult;
};

// API mocking utilities
export const createMockSupabaseClient = (overrides = {}) => ({
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        data: [],
        error: null,
      })),
      in: vi.fn(() => ({
        data: [],
        error: null,
      })),
      data: [],
      error: null,
    })),
    insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
    update: vi.fn(() => Promise.resolve({ data: null, error: null })),
    delete: vi.fn(() => Promise.resolve({ data: null, error: null })),
  })),
  ...overrides,
});

// Performance assertion helpers
export const expectPerformanceWithin = (
  duration: number,
  maxDuration: number,
  operation: string
) => {
  if (duration > maxDuration) {
    throw new Error(
      `Performance threshold exceeded for ${operation}: ${duration}ms > ${maxDuration}ms`
    );
  }
};

export const expectRenderPerformance = async (
  component: ReactElement,
  maxRenderTime: number = 100
) => {
  const { renderTime } = await measureRenderTime(component);
  expectPerformanceWithin(renderTime, maxRenderTime, 'component render');
  return renderTime;
};

// Large dataset testing utilities
export const createLargeServiceDataset = (count: number) => {
  return Array.from({ length: count }, (_, i) =>
    createMockService({
      id: `svc_${i}`,
      name: `Service ${i + 1}`,
      price_pln: 100 + (i * 10),
    })
  );
};

export const createLargeBookingDataset = (count: number) => {
  return Array.from({ length: count }, (_, i) =>
    createMockBooking({
      id: `booking_${i}`,
      client_email: `client${i + 1}@example.com`,
      start_time: `2030-01-${String(i + 1).padStart(2, '0')}T10:00:00.000Z`,
    })
  );
};

// Error scenario testing utilities
export const simulateNetworkFailure = (mockFn: MockedFunction<any>) => {
  mockFn.mockRejectedValue(new Error('Network error'));
};

export const simulateSlowResponse = (mockFn: MockedFunction<any>, delay: number = 1000) => {
  mockFn.mockImplementation(() =>
    new Promise((resolve) => setTimeout(resolve, delay))
  );
};

export const simulateApiError = (mockFn: MockedFunction<any>, error: any) => {
  mockFn.mockResolvedValue({ data: null, error });
};

// Memory usage testing (simplified for browser environment)
export const getMemoryUsage = () => {
  if ('memory' in performance) {
    return (performance as any).memory;
  }
  return null;
};

export const expectMemoryUsageWithin = (
  maxHeapSize: number,
  operation: string
) => {
  const memory = getMemoryUsage();
  if (memory && memory.usedJSHeapSize > maxHeapSize) {
    throw new Error(
      `Memory usage threshold exceeded for ${operation}: ${memory.usedJSHeapSize} > ${maxHeapSize}`
    );
  }
};

// Re-export testing utilities
export * from '@testing-library/react';
export { vi };