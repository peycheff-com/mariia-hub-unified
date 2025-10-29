import { vi } from 'vitest';

import { createService, createBooking, createExtendedProfile } from '@/test/factories/extended-factories';

// ==================== SUPABASE MOCK ====================

export const createSupabaseMock = () => {
  const mockData = {
    services: [],
    bookings: [],
    profiles: [],
    availability_slots: [],
  };

  const mockTable = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 'mock-id', ...mockData.services[0] },
        error: null
      }),
      then: vi.fn().mockResolvedValue({
        data: { id: 'mock-id', ...mockData.services[0] },
        error: null
      }),
    })),
    update: vi.fn().mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 'mock-id', ...mockData.services[0] },
        error: null
      }),
      then: vi.fn().mockResolvedValue({
        data: { id: 'mock-id', ...mockData.services[0] },
        error: null
      }),
    })),
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
    single: vi.fn().mockImplementation(() => {
      return Promise.resolve({ data: null, error: null });
    }),
    maybeSingle: vi.fn().mockImplementation(() => {
      return Promise.resolve({ data: null, error: null });
    }),
    exists: vi.fn().mockImplementation(() => {
      return Promise.resolve({ data: false, error: null });
    }),
    then: vi.fn().mockImplementation((resolve) => {
      resolve({ data: mockData.services, error: null });
      return mockTable;
    }),
    catch: vi.fn().mockReturnThis(),
    finally: vi.fn().mockReturnThis(),
  };

  return {
    from: vi.fn().mockReturnValue(mockTable),
    rpc: vi.fn().mockResolvedValue({
      data: 100, // Default price
      error: null
    }),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signIn: vi.fn().mockResolvedValue({ data: { user: createExtendedProfile() }, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: { user: createExtendedProfile() }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
      updateUser: vi.fn().mockResolvedValue({ data: { user: createExtendedProfile() }, error: null }),
      refreshSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: { path: 'mock-path' }, error: null }),
        download: vi.fn().mockResolvedValue({ data: new Blob(), error: null }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://mock-url.com/image.jpg' },
        }),
        remove: vi.fn().mockResolvedValue({ error: null }),
        list: vi.fn().mockResolvedValue({ data: [], error: null }),
        move: vi.fn().mockResolvedValue({ error: null }),
        copy: vi.fn().mockResolvedValue({ error: null }),
      })),
    },
    functions: {
      invoke: vi.fn().mockImplementation((_functionName: string, _options: any) => {
        switch (_functionName) {
          case 'send-sms':
            return Promise.resolve({ data: { success: true }, error: null });
          case 'send-email':
            return Promise.resolve({ data: { success: true }, error: null });
          case 'process-payment':
            return Promise.resolve({ data: { success: true, paymentId: 'mock-payment-id' }, error: null });
          default:
            return Promise.resolve({ data: null, error: { message: 'Unknown function' } });
        }
      }),
    },
    realtime: {
      channel: vi.fn(() => ({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockResolvedValue({}),
        unsubscribe: vi.fn(),
        send: vi.fn(),
      })),
      channels: [],
      subscriptions: [],
    },
  };
};

// ==================== STRIPE MOCK ====================

export const createStripeMock = () => {
  const mockElements = {
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
  };

  const mockStripe = {
    elements: vi.fn(() => mockElements),
    confirmPayment: vi.fn().mockResolvedValue({
      paymentIntent: {
        status: 'succeeded',
        id: 'pi_test_123',
      },
      error: null,
    }),
    confirmCardPayment: vi.fn().mockResolvedValue({
      paymentIntent: {
        status: 'succeeded',
        id: 'pi_test_123',
      },
      error: null,
    }),
    confirmCardSetup: vi.fn().mockResolvedValue({
      setupIntent: {
        status: 'succeeded',
        id: 'seti_test_123',
      },
      error: null,
    }),
    retrievePaymentIntent: vi.fn().mockResolvedValue({
      paymentIntent: {
        id: 'pi_test_123',
        status: 'succeeded',
        amount: 20000,
        currency: 'pln',
      },
    }),
    redirectToCheckout: vi.fn().mockResolvedValue({ error: null }),
    createPaymentMethod: vi.fn().mockResolvedValue({
      paymentMethod: {
        id: 'pm_test_123',
        type: 'card',
        card: {
          brand: 'visa',
          last4: '4242',
          exp_month: 12,
          exp_year: 2024,
        },
      },
    }),
    createToken: vi.fn().mockResolvedValue({
      token: {
        id: 'tok_test_123',
        type: 'card',
        card: {
          id: 'card_test_123',
          brand: 'visa',
          last4: '4242',
        },
      },
    }),
    verifyMicrodeposits: vi.fn(),
    retrieveSetupIntent: vi.fn(),
    updatePaymentIntent: vi.fn(),
    cancelPaymentIntent: vi.fn(),
  };

  return { mockStripe, mockElements };
};

// ==================== BOOKSY API MOCK ====================

export const createBooksyMock = () => {
  const mockBooksyData = {
    services: Array.from({ length: 20 }, () => createService({
      external_id: `booksy_${Math.random().toString(36).substring(2, 11)}`,
    })),
    availability: Array.from({ length: 50 }, () => ({
      id: Math.random().toString(36).substring(2, 11),
      start_time: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      end_time: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
      is_available: Math.random() > 0.3,
      duration: 60,
      price: Math.floor(Math.random() * 400 + 100),
      currency: 'PLN',
    })),
    bookings: Array.from({ length: 30 }, () => createBooking({
      external_id: `booksy_${Math.random().toString(36).substring(2, 11)}`,
      source: 'booksy',
    })),
  };

  return {
    getServices: vi.fn().mockResolvedValue({
      success: true,
      data: mockBooksyData.services,
    }),
    getServiceById: vi.fn().mockImplementation((id: string) => {
      const service = mockBooksyData.services.find(s => s.id === id);
      return Promise.resolve({
        success: true,
        data: service || null,
      });
    }),
    getAvailability: vi.fn().mockResolvedValue({
      success: true,
      data: mockBooksyData.availability,
    }),
    createBooking: vi.fn().mockImplementation((bookingData: any) => {
      const newBooking = createBooking({
        ...bookingData,
        external_id: `booksy_${Math.random().toString(36).substring(2, 11)}`,
        source: 'booksy',
      });
      mockBooksyData.bookings.push(newBooking);
      return Promise.resolve({
        success: true,
        data: newBooking,
      });
    }),
    updateBooking: vi.fn().mockImplementation((id: string, updates: any) => {
      const bookingIndex = mockBooksyData.bookings.findIndex(b => b.id === id);
      if (bookingIndex !== -1) {
        mockBooksyData.bookings[bookingIndex] = {
          ...mockBooksyData.bookings[bookingIndex],
          ...updates,
        };
        return Promise.resolve({
          success: true,
          data: mockBooksyData.bookings[bookingIndex],
        });
      }
      return Promise.resolve({
        success: false,
        error: 'Booking not found',
      });
    }),
    cancelBooking: vi.fn().mockImplementation((id: string) => {
      const booking = mockBooksyData.bookings.find(b => b.id === id);
      if (booking) {
        booking.status = 'cancelled';
        return Promise.resolve({
          success: true,
          data: booking,
        });
      }
      return Promise.resolve({
        success: false,
        error: 'Booking not found',
      });
    }),
    syncBookings: vi.fn().mockResolvedValue({
      success: true,
      synced: 5,
      failed: 0,
    }),
    getClientInfo: vi.fn().mockResolvedValue({
      success: true,
      data: {
        id: 'client_123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+48123456789',
        total_visits: 10,
        total_spent: 2500,
        last_visit: new Date().toISOString(),
      },
    }),
    getStaffInfo: vi.fn().mockResolvedValue({
      success: true,
      data: [
        {
          id: 'staff_1',
          name: 'Jane Smith',
          specialties: ['Lash Enhancement', 'Brow Lamination'],
          rating: 4.8,
          total_bookings: 150,
        },
      ],
    }),
  };
};

// ==================== GOOGLE ANALYTICS MOCK ====================

export const createGoogleAnalyticsMock = () => {
  const events: any[] = [];

  return {
    gtag: vi.fn().mockImplementation((command: string, ...args: any[]) => {
      events.push({ command, args, timestamp: Date.now() });
    }),
    trackPageView: vi.fn().mockImplementation((path: string) => {
      events.push({
        command: 'config',
        args: ['GA_MEASUREMENT_ID', { page_path: path }],
        timestamp: Date.now(),
      });
    }),
    trackEvent: vi.fn().mockImplementation((action: string, parameters: any) => {
      events.push({
        command: 'event',
        args: [action, parameters],
        timestamp: Date.now(),
      });
    }),
    trackConversion: vi.fn().mockImplementation((value: number, currency: string) => {
      events.push({
        command: 'event',
        args: ['conversion', { send_to: 'GA_MEASUREMENT_ID', value, currency }],
        timestamp: Date.now(),
      });
    }),
    getEvents: () => events,
    clearEvents: () => events.length = 0,
  };
};

// ==================== EMAIL SERVICE MOCK ====================

export const createEmailServiceMock = () => {
  const sentEmails: any[] = [];

  return {
    sendBookingConfirmation: vi.fn().mockImplementation(async (bookingData: any) => {
      sentEmails.push({
        type: 'booking_confirmation',
        to: bookingData.client_email,
        data: bookingData,
        sent_at: new Date().toISOString(),
      });
      return { success: true, id: 'email_123' };
    }),
    sendBookingReminder: vi.fn().mockImplementation(async (bookingData: any) => {
      sentEmails.push({
        type: 'booking_reminder',
        to: bookingData.client_email,
        data: bookingData,
        sent_at: new Date().toISOString(),
      });
      return { success: true, id: 'email_124' };
    }),
    sendCancellationNotice: vi.fn().mockImplementation(async (bookingData: any) => {
      sentEmails.push({
        type: 'cancellation_notice',
        to: bookingData.client_email,
        data: bookingData,
        sent_at: new Date().toISOString(),
      });
      return { success: true, id: 'email_125' };
    }),
    sendMarketingEmail: vi.fn().mockImplementation(async (campaign: any) => {
      sentEmails.push({
        type: 'marketing',
        to: campaign.recipients,
        data: campaign,
        sent_at: new Date().toISOString(),
      });
      return { success: true, sent: campaign.recipients.length };
    }),
    getSentEmails: () => sentEmails,
    clearEmails: () => sentEmails.length = 0,
  };
};

// ==================== SMS SERVICE MOCK ====================

export const createSMSServiceMock = () => {
  const sentSMS: any[] = [];

  return {
    sendSMS: vi.fn().mockImplementation(async (to: string, message: string) => {
      sentSMS.push({
        to,
        message,
        sent_at: new Date().toISOString(),
        id: `sms_${Math.random().toString(36).substring(2, 11)}`,
      });
      return { success: true, id: `sms_${Math.random().toString(36).substring(2, 11)}` };
    }),
    sendBookingConfirmationSMS: vi.fn().mockImplementation(async (bookingData: any) => {
      const message = `Your booking for ${bookingData.service_title} is confirmed for ${bookingData.start_time}. Reply CANCEL to cancel.`;
      sentSMS.push({
        type: 'booking_confirmation',
        to: bookingData.client_phone,
        message,
        data: bookingData,
        sent_at: new Date().toISOString(),
      });
      return { success: true, id: `sms_${Math.random().toString(36).substring(2, 11)}` };
    }),
    sendBookingReminderSMS: vi.fn().mockImplementation(async (bookingData: any) => {
      const message = `Reminder: Your appointment for ${bookingData.service_title} is tomorrow at ${bookingData.start_time}. Reply RESCHEDULE if needed.`;
      sentSMS.push({
        type: 'booking_reminder',
        to: bookingData.client_phone,
        message,
        data: bookingData,
        sent_at: new Date().toISOString(),
      });
      return { success: true, id: `sms_${Math.random().toString(36).substring(2, 11)}` };
    }),
    getSentSMS: () => sentSMS,
    clearSMS: () => sentSMS.length = 0,
  };
};

// ==================== WEBHOOK MOCK ====================

export const createWebhookMock = () => {
  const receivedWebhooks: any[] = [];

  return {
    onStripePaymentSuccess: vi.fn().mockImplementation(async (payload: any) => {
      receivedWebhooks.push({
        source: 'stripe',
        type: 'payment_intent.succeeded',
        payload,
        received_at: new Date().toISOString(),
      });
      return { success: true };
    }),
    onStripePaymentFailure: vi.fn().mockImplementation(async (payload: any) => {
      receivedWebhooks.push({
        source: 'stripe',
        type: 'payment_intent.payment_failed',
        payload,
        received_at: new Date().toISOString(),
      });
      return { success: true };
    }),
    onBooksyBookingUpdate: vi.fn().mockImplementation(async (payload: any) => {
      receivedWebhooks.push({
        source: 'booksy',
        type: 'booking.updated',
        payload,
        received_at: new Date().toISOString(),
      });
      return { success: true };
    }),
    getReceivedWebhooks: () => receivedWebhooks,
    clearWebhooks: () => receivedWebhooks.length = 0,
  };
};

// ==================== I18NEXT MOCK ====================

export const createI18nextMock = () => {
  const mockT = vi.fn((key: string, defaultValue?: string, options?: any) => {
    if (options && typeof options === 'object') {
      // Handle interpolation with variables like {{days}}
      let result = defaultValue || key;
      Object.keys(options).forEach(k => {
        if (typeof options[k] === 'number' || typeof options[k] === 'string') {
          result = result.replace(`{{${k}}}`, options[k].toString());
        }
      });
      return result;
    }
    return defaultValue || key;
  });

  const mockI18n = {
    language: 'en',
    changeLanguage: vi.fn().mockResolvedValue(undefined),
    t: mockT,
    exists: vi.fn().mockReturnValue(false),
    getResource: vi.fn().mockReturnValue(null),
    addResourceBundle: vi.fn(),
    removeResourceBundle: vi.fn(),
    loadNamespaces: vi.fn().mockResolvedValue(undefined),
    reloadResources: vi.fn().mockResolvedValue(undefined),
    getFixedT: vi.fn().mockReturnValue(mockT),
    init: vi.fn().mockResolvedValue(true),
    options: {
      interpolation: {
        defaultVariables: {}
      }
    }
  };

  const useTranslationMock = vi.fn(() => ({
    i18n: mockI18n,
    t: mockT,
    ready: true,
    changeLanguage: mockI18n.changeLanguage,
  }));

  return {
    useTranslation: useTranslationMock,
    I18nextProvider: ({ children }: any) => children,
    initReactI18next: { type: '3rdParty', init: vi.fn() },
    reactI18nextModule: { init: vi.fn() },
    i18n: mockI18n,
  };
};

// ==================== MOCK SETUP UTILITIES ====================

export const setupAllMocks = () => {
  const mockSupabase = createSupabaseMock();
  const { mockStripe, mockElements } = createStripeMock();
  const mockBooksy = createBooksyMock();
  const mockGA = createGoogleAnalyticsMock();
  const mockEmail = createEmailServiceMock();
  const mockSMS = createSMSServiceMock();
  const mockWebhook = createWebhookMock();
  const mockI18n = createI18nextMock();

  // Setup vi mocks (create them inline to avoid hoisting issues)
  vi.mock('@/integrations/supabase/client', () => {
    const mock = createSupabaseMock();
    return {
      supabase: mock,
    };
  });
  vi.mock('@stripe/react-stripe-js', () => ({
    useStripe: () => mockStripe,
    useElements: () => mockElements,
    Elements: ({ children }: any) => children,
    loadStripe: vi.fn().mockResolvedValue(mockStripe),
  }));
  vi.mock('react-i18next', () => createI18nextMock());
  vi.mock('@/integrations/booksy/api', () => mockBooksy);
  vi.mock('@/lib/analytics', () => mockGA);
  vi.mock('@/services/email.service', () => mockEmail);
  vi.mock('@/services/sms.service', () => mockSMS);
  vi.mock('@/services/webhook.service', () => mockWebhook);

  // Global window objects
  global.gtag = mockGA.gtag;
  global.stripe = mockStripe;

  return {
    mockSupabase,
    mockStripe,
    mockElements,
    mockBooksy,
    mockGA,
    mockEmail,
    mockSMS,
    mockWebhook,
    mockI18n: createI18nextMock(),
  };
};

export default {
  createSupabaseMock,
  createStripeMock,
  createBooksyMock,
  createGoogleAnalyticsMock,
  createEmailServiceMock,
  createSMSServiceMock,
  createWebhookMock,
  createI18nextMock,
  setupAllMocks,
};