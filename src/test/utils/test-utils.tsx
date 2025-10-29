import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';

import { BookingProvider } from '@/contexts/BookingContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { ModeProvider } from '@/contexts/ModeContext';
import { Toaster } from '@/components/ui/toaster';
import i18n from '@/i18n/config';

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <BrowserRouter>
            <ModeProvider>
              <CurrencyProvider>
                <BookingProvider>
                  {children}
                  <Toaster />
                </BookingProvider>
              </CurrencyProvider>
            </ModeProvider>
          </BrowserRouter>
        </I18nextProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything from testing-library
export * from '@testing-library/react';
export { customRender as render };

// Custom helpers for common testing patterns
export const createMockService = (overrides = {}) => ({
  id: 'test-service-id',
  title: 'Test Service',
  description: 'Test Description',
  category: 'beauty',
  duration: 60,
  price: 100,
  currency: 'PLN',
  image_url: 'https://example.com/image.jpg',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const createMockBooking = (overrides = {}) => ({
  id: 'test-booking-id',
  service_id: 'test-service-id',
  client_email: 'test@example.com',
  client_name: 'Test Client',
  client_phone: '+48123456789',
  start_time: new Date().toISOString(),
  end_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  status: 'pending',
  total_amount: 100,
  currency: 'PLN',
  notes: '',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const createMockTimeSlot = (overrides = {}) => ({
  id: 'test-slot-id',
  service_id: 'test-service-id',
  start_time: new Date().toISOString(),
  end_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  is_available: true,
  max_bookings: 1,
  current_bookings: 0,
  ...overrides,
});

// Mock handlers for common API calls
export const mockApiHandlers = {
  getServices: vi.fn(),
  getServiceById: vi.fn(),
  createBooking: vi.fn(),
  checkAvailability: vi.fn(),
  getTimeSlots: vi.fn(),
};

// Helper to wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// Helper to mock Supabase auth
export const mockSupabaseAuth = {
  user: null,
  session: null,
  signIn: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChange: vi.fn(),
};

// Helper to create mock form data
export const createMockFormData = (overrides = {}) => ({
  serviceId: 'test-service-id',
  date: '2024-01-01',
  time: '10:00',
  clientInfo: {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+48123456789',
  },
  ...overrides,
});