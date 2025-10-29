import { render, RenderOptions, RenderResult, fireEvent, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import React, { ReactElement } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { vi, describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';

import { BookingProvider } from '@/contexts/BookingContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { ModeProvider } from '@/contexts/ModeContext';
import { Toaster } from '@/components/ui/toaster';

import i18n from '@/lib/i18n';



// ==================== MOCK IMPLEMENTATIONS ====================

export const createMockSupabaseClient = () => ({
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    resetPasswordForEmail: vi.fn(),
    updateUser: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    exists: vi.fn().mockResolvedValue({ data: false, error: null }),
    count: 'exact',
    then: vi.fn(),
    catch: vi.fn(),
    finally: vi.fn(),
  })),
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(),
      download: vi.fn(),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'mock-url' } }),
      remove: vi.fn(),
      list: vi.fn(),
    })),
  },
  functions: {
    invoke: vi.fn(),
  },
  realtime: {
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockResolvedValue({}),
      unsubscribe: vi.fn(),
    })),
    channels: [],
  },
});

export const createMockStripe = () => ({
  redirectToCheckout: vi.fn(),
  confirmPayment: vi.fn(),
  confirmCardPayment: vi.fn(),
  elements: vi.fn(),
  createPaymentMethod: vi.fn(),
  retrievePaymentIntent: vi.fn(),
});

export const createMockBooksyAPI = () => ({
  getServices: vi.fn(),
  getAvailability: vi.fn(),
  createBooking: vi.fn(),
  cancelBooking: vi.fn(),
  syncBooking: vi.fn(),
});

// ==================== PROVIDERS SETUP ====================

interface CustomProvidersProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
  initialRoute?: string;
}

const AllTheProviders = ({
  children,
  queryClient = new QueryClient({
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
  }),
  initialRoute = '/',
}: CustomProvidersProps) => {
  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <BrowserRouter initialEntries={[initialRoute]}>
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

// ==================== CUSTOM RENDER FUNCTION ====================

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  initialRoute?: string;
  user?: ReturnType<typeof userEvent.setup>;
}

const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult & { user: ReturnType<typeof userEvent.setup> } => {
  const { queryClient, initialRoute, user = userEvent.setup(), ...renderOptions } = options;

  const renderResult = render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders queryClient={queryClient} initialRoute={initialRoute}>
        {children}
      </AllTheProviders>
    ),
    ...renderOptions,
  });

  return { ...renderResult, user };
};

// ==================== TESTING HELPERS ====================

export class ComponentTestHelper {
  constructor(
    private renderResult: RenderResult & { user: ReturnType<typeof userEvent.setup> }
  ) {}

  getByTestId(testId: string) {
    return this.renderResult.getByTestId(testId);
  }

  queryByTestId(testId: string) {
    return this.renderResult.queryByTestId(testId);
  }

  async findByTestId(testId: string, options?: { timeout?: number }) {
    return this.renderResult.findByTestId(testId, options);
  }

  async clickButton(labelOrTestId: string) {
    const element = this.renderResult.getByRole('button', { name: labelOrTestId }) ||
                  this.renderResult.getByTestId(labelOrTestId);
    await this.renderResult.user.click(element);
  }

  async typeText(selector: string, text: string) {
    const element = this.renderResult.getByLabelText(selector) ||
                  this.renderResult.getByPlaceholderText(selector) ||
                  this.renderResult.getByTestId(selector);
    await this.renderResult.user.type(element, text);
  }

  async selectOption(selectLabel: string, option: string) {
    const select = this.renderResult.getByLabelText(selectLabel);
    await this.renderResult.user.selectOptions(select, option);
  }

  async fillForm(fields: Record<string, string>) {
    for (const [field, value] of Object.entries(fields)) {
      await this.typeText(field, value);
    }
  }

  async waitForElement(testId: string) {
    await this.renderResult.waitForElement(() => this.renderResult.getByTestId(testId));
  }

  expectElementToExist(testId: string) {
    expect(this.renderResult.getByTestId(testId)).toBeInTheDocument();
  }

  expectElementNotToExist(testId: string) {
    expect(this.renderResult.queryByTestId(testId)).not.toBeInTheDocument();
  }

  expectElementToBeVisible(testId: string) {
    expect(this.renderResult.getByTestId(testId)).toBeVisible();
  }

  expectElementToHaveText(testId: string, text: string) {
    expect(this.renderResult.getByTestId(testId)).toHaveTextContent(text);
  }
}

// ==================== BOOKING FLOW TEST HELPER ====================

export class BookingFlowTestHelper extends ComponentTestHelper {
  async selectService(serviceName: string) {
    await this.clickButton(serviceName);
    await this.waitForElement('service-selected');
  }

  async selectDateTime(date: string, time: string) {
    await this.clickButton(date);
    await this.clickButton(time);
    await this.waitForElement('datetime-selected');
  }

  async fillClientInfo(clientInfo: {
    name: string;
    email: string;
    phone: string;
    notes?: string;
  }) {
    await this.fillForm({
      'Name': clientInfo.name,
      'Email': clientInfo.email,
      'Phone': clientInfo.phone,
    });

    if (clientInfo.notes) {
      await this.typeText('Notes', clientInfo.notes);
    }
  }

  async proceedToNextStep() {
    await this.clickButton('Next');
  }

  async completeBooking() {
    await this.clickButton('Confirm Booking');
    await this.waitForElement('booking-confirmed');
  }
}

// ==================== FORM VALIDATION TEST HELPER ====================

export class FormValidationTestHelper extends ComponentTestHelper {
  async testRequiredField(fieldLabel: string, testId?: string) {
    const selector = testId || fieldLabel;

    // Clear field if it has value
    const field = this.renderResult.getByLabelText(fieldLabel) ||
                  this.renderResult.getByTestId(selector);
    await this.renderResult.user.clear(field);

    // Try to submit
    await this.clickButton('Submit');

    // Check for error message
    await this.waitForElement(`${selector}-error`);
    this.expectElementToHaveText(`${selector}-error`, 'This field is required');
  }

  async testInvalidEmail(email: string) {
    await this.typeText('Email', email);
    await this.clickButton('Submit');
    await this.waitForElement('email-error');
    this.expectElementToHaveText('email-error', 'Please enter a valid email address');
  }

  async testInvalidPhone(phone: string) {
    await this.typeText('Phone', phone);
    await this.clickButton('Submit');
    await this.waitForElement('phone-error');
    this.expectElementToHaveText('phone-error', 'Please enter a valid phone number');
  }

  async testMinLength(fieldLabel: string, minLength: number) {
    const field = this.renderResult.getByLabelText(fieldLabel);
    await this.renderResult.user.clear(field);

    // Enter less than minimum characters
    await this.renderResult.user.type(field, 'a'.repeat(minLength - 1));
    await this.clickButton('Submit');

    await this.waitForElement(`${fieldLabel.toLowerCase()}-error`);
    this.expectElementToHaveText(
      `${fieldLabel.toLowerCase()}-error`,
      `Must be at least ${minLength} characters`
    );
  }
}

// ==================== API MOCKING HELPERS ====================

export const mockApiSuccess = (mockFn: any, data: any) => {
  mockFn.mockResolvedValue({ data, error: null });
};

export const mockApiError = (mockFn: any, error: string) => {
  mockFn.mockResolvedValue({ data: null, error: { message: error } });
};

export const mockApiLoading = (mockFn: any) => {
  mockFn.mockImplementation(() => new Promise(() => {})); // Never resolves
};

// ==================== ASYNC TESTING HELPERS ====================

export const waitForAsyncOperations = async (timeout = 0) => {
  await new Promise(resolve => setTimeout(resolve, timeout));
};

export const flushPromises = () => new Promise(resolve => setImmediate(resolve));

// ==================== COMPONENT TESTING UTILITIES ====================

export const renderWithProviders = <T extends ReactElement>(
  component: T,
  options: CustomRenderOptions = {}
) => {
  return customRender(component, options);
};

export const renderComponentForTesting = <T extends ReactElement>(
  component: T,
  options: CustomRenderOptions = {}
): BookingFlowTestHelper => {
  const renderResult = renderWithProviders(component, options);
  return new BookingFlowTestHelper(renderResult);
};

// ==================== TEST SCENARIOS ====================

export const setupBookingFlowTest = () => {
  const mockServices = [
    { id: '1', title: 'Lash Enhancement', price: 200, duration: 60 },
    { id: '2', title: 'Brow Lamination', price: 150, duration: 45 },
  ];

  const mockSlots = [
    { id: '1', start_time: '2024-01-01T10:00:00Z', is_available: true },
    { id: '2', start_time: '2024-01-01T11:00:00Z', is_available: true },
  ];

  const mockSupabase = createMockSupabaseClient();
  const mockStripe = createMockStripe();

  // Mock API calls
  vi.mock('@/integrations/supabase/client', () => mockSupabase);
  vi.mock('@stripe/react-stripe-js', () => ({
    useStripe: () => mockStripe,
    useElements: () => null,
  }));

  return {
    mockServices,
    mockSlots,
    mockSupabase,
    mockStripe,
  };
};

export const setupAdminDashboardTest = () => {
  const mockData = {
    bookings: {
      total: 150,
      today: 12,
      pending: 5,
      revenue: 15000,
    },
    services: {
      total: 25,
      active: 20,
      featured: 8,
    },
    clients: {
      total: 450,
      new: 35,
      returning: 200,
    },
  };

  const mockSupabase = createMockSupabaseClient();

  // Mock admin API calls
  mockApiSuccess(mockSupabase.from().select, mockData);

  return {
    mockData,
    mockSupabase,
  };
};

// ==================== RE-EXPORT TESTING LIBRARY ====================

export * from '@testing-library/react';
export * from '@testing-library/user-event';
export { customRender as render };
export { renderWithProviders };
export { vi, describe, it, expect, beforeEach, afterEach, beforeAll, afterAll };

// ==================== COMMON ASSERTIONS ====================

export const expectToastToHaveBeenCalled = (message: string) => {
  const toast = vi.fn();
  vi.mock('@/hooks/use-toast', () => ({
    useToast: () => ({ toast }),
  }));
  expect(toast).toHaveBeenCalledWith(
    expect.objectContaining({
      description: message,
    })
  );
};

export const expectNavigationToHaveBeenCalled = (path: string) => {
  const mockNavigate = vi.fn();
  vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
      ...actual,
      useNavigate: () => mockNavigate,
    };
  });
  expect(mockNavigate).toHaveBeenCalledWith(path);
};

// ==================== ACCESSIBILITY TESTING HELPERS ====================

export const testAccessibility = async (container: HTMLElement) => {
  const { axe, toHaveNoViolations } = await import('jest-axe');
  expect.extend(toHaveNoViolations);

  const results = await axe(container);
  expect(results).toHaveNoViolations();
};

export const testKeyboardNavigation = async (container: HTMLElement) => {
  const interactiveElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  for (let i = 0; i < interactiveElements.length; i++) {
    const element = interactiveElements[i] as HTMLElement;

    // Test tab navigation
    fireEvent.tab();
    expect(element).toHaveFocus();

    // Test enter key for buttons
    if (element.tagName === 'BUTTON') {
      fireEvent.keyDown(element, { key: 'Enter', code: 'Enter' });
    }
  }
};

// ==================== PERFORMANCE TESTING HELPERS ====================

export const measureRenderTime = async (component: ReactElement) => {
  const start = performance.now();
  renderWithProviders(component);
  const end = performance.now();

  return {
    renderTime: end - start,
    isAcceptable: (threshold: number) => (end - start) < threshold,
  };
};

export const testComponentRerender = async (component: ReactElement, updates: any[]) => {
  const { rerender } = renderWithProviders(component);

  const renderTimes = [];

  for (const update of updates) {
    const start = performance.now();
    rerender(component);
    const end = performance.now();
    renderTimes.push(end - start);
  }

  return {
    averageRenderTime: renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length,
    maxRenderTime: Math.max(...renderTimes),
    renderTimes,
  };
};