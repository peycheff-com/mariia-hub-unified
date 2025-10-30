import { vi, beforeEach, afterEach } from 'vitest';
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { BookingProvider } from '@/contexts/BookingContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { ModeProvider } from '@/contexts/ModeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { createI18nextMock } from '@/test/mocks/services.mock';
import { flushPromises } from '@/test/setup-global';

// ==================== TEST PROVIDERS ====================

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0,
      staleTime: 0,
    },
    mutations: {
      retry: false,
    },
  },
});

// Mock i18next for testing
const mockI18n = createI18nextMock().i18n;

interface TestProvidersProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
  initialRoute?: string;
}

const TestProviders = ({
  children,
  queryClient = createTestQueryClient(),
  initialRoute = '/'
}: TestProvidersProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={mockI18n}>
        <BrowserRouter>
          <AuthProvider>
            <ModeProvider>
              <CurrencyProvider>
                <BookingProvider>
                  {children}
                </BookingProvider>
              </CurrencyProvider>
            </ModeProvider>
          </AuthProvider>
        </BrowserRouter>
      </I18nextProvider>
    </QueryClientProvider>
  );
};

// ==================== CUSTOM RENDER FUNCTION ====================

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  initialRoute?: string;
}

const customRender = (
  ui: ReactElement,
  {
    queryClient = createTestQueryClient(),
    initialRoute = '/',
    ...renderOptions
  }: CustomRenderOptions = {}
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <TestProviders queryClient={queryClient} initialRoute={initialRoute}>
      {children}
    </TestProviders>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// ==================== TEST HELPERS ====================

/**
 * Wait for component to update and all promises to resolve
 */
export const waitForComponentUpdate = async () => {
  await flushPromises();
  await new Promise(resolve => setTimeout(resolve, 0));
};

/**
 * Mock user authentication state
 */
export const mockAuthState = (user: any = null) => {
  const { supabase } = await import('@/integrations/supabase/client');
  (supabase.auth.getUser as any).mockResolvedValue({
    data: { user },
    error: null,
  });
};

/**
 * Mock authenticated user
 */
export const mockAuthenticatedUser = () => {
  const user = {
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: {
      full_name: 'Test User',
      role: 'client'
    }
  };
  mockAuthState(user);
  return user;
};

/**
 * Mock admin user
 */
export const mockAdminUser = () => {
  const user = {
    id: 'admin-user-id',
    email: 'admin@example.com',
    user_metadata: {
      full_name: 'Admin User',
      role: 'admin'
    }
  };
  mockAuthState(user);
  return user;
};

/**
 * Create mock service data with default values
 */
export const createMockService = (overrides: any = {}) => ({
  id: 'test-service-id',
  title: 'Test Service',
  slug: 'test-service',
  description: 'A test service for testing',
  category: 'beauty',
  service_type: 'individual',
  duration: 60,
  price: 200,
  currency: 'PLN',
  is_active: true,
  featured: false,
  image_url: 'https://example.com/image.jpg',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

/**
 * Create mock booking data with default values
 */
export const createMockBooking = (overrides: any = {}) => ({
  id: 'test-booking-id',
  service_id: 'test-service-id',
  client_id: 'test-client-id',
  start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  end_time: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
  status: 'pending',
  total_price: 200,
  currency: 'PLN',
  client_info: {
    name: 'Test Client',
    email: 'client@example.com',
    phone: '+48123456789'
  },
  payment_status: 'pending',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

/**
 * Create mock time slot data with default values
 */
export const createMockTimeSlot = (overrides: any = {}) => ({
  id: 'test-slot-id',
  start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  end_time: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
  service_id: 'test-service-id',
  status: 'available',
  max_participants: 1,
  current_participants: 0,
  ...overrides,
});

/**
 * Mock API response with data
 */
export const mockApiResponse = (data: any, error: any = null) => ({
  data,
  error,
});

/**
 * Mock successful API response
 */
export const mockSuccessResponse = (data: any) => mockApiResponse(data, null);

/**
 * Mock error API response
 */
export const mockErrorResponse = (error: any) => mockApiResponse(null, error);

/**
 * Mock network error
 */
export const mockNetworkError = (message = 'Network Error') => ({
  message,
  name: 'NetworkError',
  code: 'NETWORK_ERROR',
});

/**
 * Mock validation error
 */
export const mockValidationError = (field: string, message: string) => ({
  message,
  field,
  code: 'VALIDATION_ERROR',
});

/**
 * Mock Stripe payment intent
 */
export const mockPaymentIntent = (overrides: any = {}) => ({
  id: 'pi_test_123',
  status: 'succeeded',
  amount: 20000,
  currency: 'pln',
  created: Math.floor(Date.now() / 1000),
  metadata: {
    booking_id: 'test-booking-id'
  },
  ...overrides,
});

/**
 * Mock Stripe elements
 */
export const mockStripeElements = () => ({
  create: vi.fn().mockReturnValue({
    mount: vi.fn(),
    unmount: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    focus: vi.fn(),
    blur: vi.fn(),
    clear: vi.fn(),
    destroy: vi.fn(),
    update: vi.fn(),
  }),
  getElement: vi.fn(),
  update: vi.fn(),
  fetchUpdates: vi.fn(),
  submit: vi.fn(),
});

/**
 * Mock fetch with custom response
 */
export const mockFetch = (response: any, options: { status?: number; delay?: number } = {}) => {
  const { status = 200, delay = 0 } = options;

  return (global.fetch as any).mockImplementation(async () => {
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => response,
      text: async () => JSON.stringify(response),
      headers: new Headers({
        'Content-Type': 'application/json'
      })
    };
  });
};

/**
 * Mock fetch error
 */
export const mockFetchError = (error: any, options: { status?: number } = {}) => {
  const { status = 500 } = options;

  return (global.fetch as any).mockImplementation(async () => {
    return {
      ok: false,
      status,
      json: async () => ({ error }),
      text: async () => JSON.stringify({ error }),
      headers: new Headers({
        'Content-Type': 'application/json'
      })
    };
  });
};

/**
 * Reset all mocks
 */
export const resetAllMocks = () => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
};

/**
 * Setup test environment
 */
export const setupTest = () => {
  // Reset localStorage and sessionStorage
  localStorage.clear();
  sessionStorage.clear();

  // Reset fetch
  (global.fetch as any).mockClear();

  // Reset query client
  const queryClient = createTestQueryClient();

  return { queryClient };
};

/**
 * Cleanup test environment
 */
export const cleanupTest = () => {
  resetAllMocks();
  localStorage.clear();
  sessionStorage.clear();
};

// ==================== TEST HOOKS ====================

beforeEach(() => {
  setupTest();
});

afterEach(() => {
  cleanupTest();
});

// ==================== EXPORTS ====================

export * from '@testing-library/react';
export { customRender as render };
export { TestProviders };
export { default as userEvent } from '@testing-library/user-event';

// Re-export common testing utilities
export {
  vi,
  expect,
  describe,
  it,
  test,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
} from 'vitest';