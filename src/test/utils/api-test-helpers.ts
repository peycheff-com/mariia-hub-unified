import { vi } from 'vitest';

import { createService, createBooking, createExtendedProfile } from '@/test/factories/extended-factories';

// ==================== API REQUEST BUILDERS ====================

export const buildApiRequest = (endpoint: string, options: RequestInit = {}) => ({
  url: `https://api.test.com${endpoint}`,
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer test-token',
    ...options.headers,
  },
  ...options,
});

export const buildGraphQLRequest = (query: string, variables?: any) => ({
  url: 'https://api.test.com/graphql',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer test-token',
  },
  body: JSON.stringify({ query, variables }),
});

// ==================== API RESPONSE BUILDERS ====================

export const buildApiResponse = <T>(data: T, status = 200) => ({
  status,
  ok: status >= 200 && status < 300,
  json: vi.fn().mockResolvedValue(data),
  text: vi.fn().mockResolvedValue(JSON.stringify(data)),
  headers: new Headers({
    'Content-Type': 'application/json',
  }),
  url: 'https://api.test.com/test',
});

export const buildApiError = (message: string, status = 400) => ({
  status,
  ok: false,
  json: vi.fn().mockResolvedValue({ error: message }),
  text: vi.fn().mockResolvedValue(JSON.stringify({ error: message })),
  headers: new Headers({
    'Content-Type': 'application/json',
  }),
  url: 'https://api.test.com/test',
});

// ==================== MOCK API INTERCEPTORS ====================

export const createMockApiInterceptor = () => {
  const calls: any[] = [];

  const interceptor = {
    // Record all API calls
    addCall: (request: any, response: any) => {
      calls.push({ request, response, timestamp: Date.now() });
    },

    // Get all calls
    getCalls: () => calls,

    // Get calls by endpoint
    getCallsByEndpoint: (endpoint: string) =>
      calls.filter(call => call.request.url.includes(endpoint)),

    // Clear calls
    clearCalls: () => calls.length = 0,

    // Check if endpoint was called
    wasCalled: (endpoint: string) =>
      calls.some(call => call.request.url.includes(endpoint)),

    // Get request data for endpoint
    getRequestData: (endpoint: string) =>
      calls
        .filter(call => call.request.url.includes(endpoint))
        .map(call => call.request),

    // Get response data for endpoint
    getResponseData: (endpoint: string) =>
      calls
        .filter(call => call.request.url.includes(endpoint))
        .map(call => call.response),
  };

  return interceptor;
};

// ==================== API TEST SCENARIOS ====================

export const createServiceApiMock = () => {
  const services = Array.from({ length: 10 }, () => createService());

  return {
    // GET /services
    getServices: vi.fn().mockResolvedValue(buildApiResponse(services)),

    // GET /services/:id
    getServiceById: vi.fn().mockImplementation((id: string) => {
      const service = services.find(s => s.id === id);
      return Promise.resolve(
        service
          ? buildApiResponse(service)
          : buildApiError('Service not found', 404)
      );
    }),

    // POST /services
    createService: vi.fn().mockImplementation((serviceData: any) => {
      const newService = createService(serviceData);
      services.push(newService);
      return Promise.resolve(buildApiResponse(newService, 201));
    }),

    // PUT /services/:id
    updateService: vi.fn().mockImplementation((id: string, updates: any) => {
      const index = services.findIndex(s => s.id === id);
      if (index !== -1) {
        services[index] = { ...services[index], ...updates };
        return Promise.resolve(buildApiResponse(services[index]));
      }
      return Promise.resolve(buildApiError('Service not found', 404));
    }),

    // DELETE /services/:id
    deleteService: vi.fn().mockImplementation((id: string) => {
      const index = services.findIndex(s => s.id === id);
      if (index !== -1) {
        services.splice(index, 1);
        return Promise.resolve(buildApiResponse({ success: true }));
      }
      return Promise.resolve(buildApiError('Service not found', 404));
    }),

    // GET /services/search
    searchServices: vi.fn().mockImplementation((query: string) => {
      const filtered = services.filter(s =>
        s.title.toLowerCase().includes(query.toLowerCase()) ||
        s.description.toLowerCase().includes(query.toLowerCase())
      );
      return Promise.resolve(buildApiResponse(filtered));
    }),

    // Get internal data for testing
    _getData: () => services,
    _resetData: () => services.length = 0,
  };
};

export const createBookingApiMock = () => {
  const bookings = Array.from({ length: 20 }, () => createBooking());

  return {
    // GET /bookings
    getBookings: vi.fn().mockResolvedValue(buildApiResponse(bookings)),

    // GET /bookings/:id
    getBookingById: vi.fn().mockImplementation((id: string) => {
      const booking = bookings.find(b => b.id === id);
      return Promise.resolve(
        booking
          ? buildApiResponse(booking)
          : buildApiError('Booking not found', 404)
      );
    }),

    // POST /bookings
    createBooking: vi.fn().mockImplementation((bookingData: any) => {
      const newBooking = createBooking({
        ...bookingData,
        status: 'pending',
      });
      bookings.push(newBooking);
      return Promise.resolve(buildApiResponse(newBooking, 201));
    }),

    // PUT /bookings/:id
    updateBooking: vi.fn().mockImplementation((id: string, updates: any) => {
      const index = bookings.findIndex(b => b.id === id);
      if (index !== -1) {
        bookings[index] = { ...bookings[index], ...updates };
        return Promise.resolve(buildApiResponse(bookings[index]));
      }
      return Promise.resolve(buildApiError('Booking not found', 404));
    }),

    // POST /bookings/:id/confirm
    confirmBooking: vi.fn().mockImplementation((id: string) => {
      const booking = bookings.find(b => b.id === id);
      if (booking) {
        booking.status = 'confirmed';
        return Promise.resolve(buildApiResponse(booking));
      }
      return Promise.resolve(buildApiError('Booking not found', 404));
    }),

    // POST /bookings/:id/cancel
    cancelBooking: vi.fn().mockImplementation((id: string, reason?: string) => {
      const booking = bookings.find(b => b.id === id);
      if (booking) {
        booking.status = 'cancelled';
        if (reason) {
          booking.cancellation_reason = reason;
        }
        return Promise.resolve(buildApiResponse(booking));
      }
      return Promise.resolve(buildApiError('Booking not found', 404));
    }),

    // GET /bookings/availability
    checkAvailability: vi.fn().mockImplementation((params: any) => {
      const { service_id, date } = params;
      const mockSlots = Array.from({ length: 8 }, (_, i) => ({
        id: `slot-${i}`,
        start_time: `${date}T${9 + i}:00:00Z`,
        end_time: `${date}T${10 + i}:00:00Z`,
        is_available: Math.random() > 0.3,
      }));
      return Promise.resolve(buildApiResponse(mockSlots));
    }),

    // Get internal data for testing
    _getData: () => bookings,
    _resetData: () => bookings.length = 0,
  };
};

export const createAuthApiMock = () => {
  const users = Array.from({ length: 5 }, () => createExtendedProfile());

  return {
    // POST /auth/login
    login: vi.fn().mockImplementation(async (credentials: any) => {
      const { email, password } = credentials;
      const user = users.find(u => u.email === email);

      if (!user) {
        return Promise.resolve(buildApiError('Invalid credentials', 401));
      }

      return Promise.resolve(buildApiResponse({
        user,
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }));
    }),

    // POST /auth/register
    register: vi.fn().mockImplementation(async (userData: any) => {
      const { email, password, ...profileData } = userData;

      if (users.some(u => u.email === email)) {
        return Promise.resolve(buildApiError('Email already registered', 409));
      }

      const newUser = createExtendedProfile({
        email,
        ...profileData,
      });

      users.push(newUser);

      return Promise.resolve(buildApiResponse({
        user: newUser,
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }, 201));
    }),

    // POST /auth/refresh
    refreshToken: vi.fn().mockResolvedValue(buildApiResponse({
      token: 'new-mock-jwt-token',
      refreshToken: 'new-mock-refresh-token',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    })),

    // POST /auth/logout
    logout: vi.fn().mockResolvedValue(buildApiResponse({ success: true })),

    // POST /auth/forgot-password
    forgotPassword: vi.fn().mockResolvedValue(buildApiResponse({
      message: 'Password reset email sent',
    })),

    // POST /auth/reset-password
    resetPassword: vi.fn().mockResolvedValue(buildApiResponse({
      message: 'Password reset successfully',
    })),

    // GET /auth/me
    getCurrentUser: vi.fn().mockImplementation((token: string) => {
      if (token === 'mock-jwt-token') {
        return Promise.resolve(buildApiResponse(users[0]));
      }
      return Promise.resolve(buildApiError('Invalid token', 401));
    }),

    // Get internal data for testing
    _getData: () => users,
    _resetData: () => users.length = 0,
  };
};

// ==================== API TEST HELPERS ====================

export const testApiCall = async (
  apiCall: () => Promise<any>,
  expectedStatus: number,
  expectedData?: any
) => {
  try {
    const response = await apiCall();

    expect(response.status).toBe(expectedStatus);

    if (expectedData) {
      expect(response.data).toEqual(expectedData);
    }

    return response;
  } catch (error) {
    if (expectedStatus >= 400) {
      expect(error.response?.status).toBe(expectedStatus);
      return error;
    }
    throw error;
  }
};

export const testApiError = async (
  apiCall: () => Promise<any>,
  expectedStatus: number,
  expectedError?: string
) => {
  await expect(apiCall()).rejects.toThrow();

  try {
    await apiCall();
  } catch (error: any) {
    expect(error.response?.status).toBe(expectedStatus);

    if (expectedError) {
      expect(error.response?.data?.error).toContain(expectedError);
    }
  }
};

// ==================== MOCK FETCH SETUP ====================

export const setupMockFetch = () => {
  const mockFetch = vi.fn();

  global.fetch = mockFetch;

  return {
    mockResponse: (url: string, response: any, options?: any) => {
      mockFetch.mockImplementation((requestUrl: string, requestOptions?: any) => {
        if (requestUrl.includes(url) || url === '*') {
          return Promise.resolve(response);
        }
        return Promise.resolve(buildApiError('Not Found', 404));
      });
    },

    mockResponseOnce: (url: string, response: any) => {
      mockFetch.mockImplementationOnce((requestUrl: string) => {
        if (requestUrl.includes(url)) {
          return Promise.resolve(response);
        }
        return Promise.resolve(buildApiError('Not Found', 404));
      });
    },

    mockSequentialResponses: (url: string, responses: any[]) => {
      responses.forEach(response => {
        mockFetch.mockImplementationOnce((requestUrl: string) => {
          if (requestUrl.includes(url)) {
            return Promise.resolve(response);
          }
          return Promise.resolve(buildApiError('Not Found', 404));
        });
      });
    },

    getCalls: () => mockFetch.mock.calls,
    clearCalls: () => mockFetch.mockClear(),
  };
};

// ==================== API TESTING UTILITIES ====================

export const createApiTestSuite = (apiMock: any, baseUrl: string) => {
  return {
    testGetAll: async () => {
      const response = await apiMock.getAll();
      expect(response.ok).toBe(true);
      return response.json();
    },

    testGetById: async (id: string) => {
      const response = await apiMock.getById(id);
      expect(response.ok).toBe(true);
      return response.json();
    },

    testCreate: async (data: any) => {
      const response = await apiMock.create(data);
      expect(response.ok).toBe(true);
      return response.json();
    },

    testUpdate: async (id: string, data: any) => {
      const response = await apiMock.update(id, data);
      expect(response.ok).toBe(true);
      return response.json();
    },

    testDelete: async (id: string) => {
      const response = await apiMock.delete(id);
      expect(response.ok).toBe(true);
      return response.json();
    },

    testNotFound: async (id: string) => {
      const response = await apiMock.getById(id);
      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
    },

    testValidationError: async (data: any) => {
      const response = await apiMock.create(data);
      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
    },
  };
};

export default {
  buildApiRequest,
  buildGraphQLRequest,
  buildApiResponse,
  buildApiError,
  createMockApiInterceptor,
  createServiceApiMock,
  createBookingApiMock,
  createAuthApiMock,
  testApiCall,
  testApiError,
  setupMockFetch,
  createApiTestSuite,
};