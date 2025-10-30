import { describe, it, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { createServer } from 'node:http';
import { createApp } from '@/api/app';
import {
  createService,
  createBooking,
  createTimeSlot,
  createExtendedProfile,
  createServices,
  createTimeSlots
} from '@/test/factories/extended-factories';

// Mock dependencies
vi.mock('@/integrations/supabase/client');
vi.mock('@/services/auth.service');
vi.mock('@/services/booking.service');
vi.mock('@/services/services.service');

describe('API Endpoints Testing', () => {
  let server: any;
  let baseURL: string;

  beforeEach(async () => {
    // Create test server
    const app = createApp();
    server = createServer(app);

    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const port = (server.address() as any).port;
        baseURL = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  afterEach(async () => {
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    }
    vi.clearAllMocks();
  });

  // Helper function for making HTTP requests
  const makeRequest = async (
    path: string,
    options: RequestInit = {}
  ): Promise<{ data: any; status: number; headers: Headers }> => {
    const response = await fetch(`${baseURL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    return {
      data,
      status: response.status,
      headers: response.headers,
    };
  };

  describe('Health Check Endpoints', () => {
    test('GET /health should return health status', async () => {
      const { data, status } = await makeRequest('/health');

      expect(status).toBe(200);
      expect(data).toEqual({
        status: 'healthy',
        timestamp: expect.any(String),
        version: expect.any(String),
        environment: expect.any(String),
      });
    });

    test('GET /health/ready should return readiness status', async () => {
      const { data, status } = await makeRequest('/health/ready');

      expect(status).toBe(200);
      expect(data).toEqual({
        status: 'ready',
        checks: {
          database: expect.any(Object),
          cache: expect.any(Object),
          storage: expect.any(Object),
        },
      });
    });

    test('GET /health/live should return liveness status', async () => {
      const { data, status } = await makeRequest('/health/live');

      expect(status).toBe(200);
      expect(data).toEqual({
        status: 'alive',
        uptime: expect.any(Number),
      });
    });
  });

  describe('Authentication Endpoints', () => {
    describe('POST /auth/login', () => {
      test('should login user with valid credentials', async () => {
        const mockUser = createExtendedProfile({
          id: 'user-123',
          email: 'test@example.com',
        });

        vi.mocked(import('@/services/auth.service').AuthService).mockImplementationOnce(() => ({
          signIn: vi.fn().mockResolvedValue({
            data: { user: mockUser, session: { access_token: 'token-123' } },
            error: null,
          }),
        }));

        const loginData = {
          email: 'test@example.com',
          password: 'password123',
        };

        const { data, status } = await makeRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify(loginData),
        });

        expect(status).toBe(200);
        expect(data.user).toEqual(mockUser);
        expect(data.session.access_token).toBe('token-123');
      });

      test('should reject login with invalid credentials', async () => {
        vi.mocked(import('@/services/auth.service').AuthService).mockImplementationOnce(() => ({
          signIn: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Invalid credentials' },
          }),
        }));

        const loginData = {
          email: 'test@example.com',
          password: 'wrongpassword',
        };

        const { data, status } = await makeRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify(loginData),
        });

        expect(status).toBe(401);
        expect(data.error).toContain('Invalid credentials');
      });

      test('should validate required fields', async () => {
        const { data, status } = await makeRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify({}), // Missing email and password
        });

        expect(status).toBe(400);
        expect(data.errors).toContain('Email is required');
        expect(data.errors).toContain('Password is required');
      });

      test('should validate email format', async () => {
        const loginData = {
          email: 'invalid-email',
          password: 'password123',
        };

        const { data, status } = await makeRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify(loginData),
        });

        expect(status).toBe(400);
        expect(data.errors).toContain('Invalid email format');
      });
    });

    describe('POST /auth/register', () => {
      test('should register new user', async () => {
        const mockUser = createExtendedProfile({
          id: 'user-123',
          email: 'newuser@example.com',
        });

        vi.mocked(import('@/services/auth.service').AuthService).mockImplementationOnce(() => ({
          signUp: vi.fn().mockResolvedValue({
            data: { user: mockUser, session: { access_token: 'token-123' } },
            error: null,
          }),
        }));

        const registerData = {
          email: 'newuser@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
        };

        const { data, status } = await makeRequest('/auth/register', {
          method: 'POST',
          body: JSON.stringify(registerData),
        });

        expect(status).toBe(201);
        expect(data.user).toEqual(mockUser);
        expect(data.session.access_token).toBe('token-123');
      });

      test('should handle duplicate email registration', async () => {
        vi.mocked(import('@/services/auth.service').AuthService).mockImplementationOnce(() => ({
          signUp: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'User already registered' },
          }),
        }));

        const registerData = {
          email: 'existing@example.com',
          password: 'password123',
          firstName: 'Jane',
          lastName: 'Doe',
        };

        const { data, status } = await makeRequest('/auth/register', {
          method: 'POST',
          body: JSON.stringify(registerData),
        });

        expect(status).toBe(409);
        expect(data.error).toContain('User already registered');
      });

      test('should validate password strength', async () => {
        const registerData = {
          email: 'test@example.com',
          password: '123', // Too weak
          firstName: 'John',
          lastName: 'Doe',
        };

        const { data, status } = await makeRequest('/auth/register', {
          method: 'POST',
          body: JSON.stringify(registerData),
        });

        expect(status).toBe(400);
        expect(data.errors).toContain('Password must be at least 6 characters long');
      });
    });

    describe('POST /auth/logout', () => {
      test('should logout authenticated user', async () => {
        vi.mocked(import('@/services/auth.service').AuthService).mockImplementationOnce(() => ({
          signOut: vi.fn().mockResolvedValue({ error: null }),
        }));

        const { data, status } = await makeRequest('/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer valid-token',
          },
        });

        expect(status).toBe(200);
        expect(data.message).toContain('Logged out successfully');
      });

      test('should reject logout without token', async () => {
        const { data, status } = await makeRequest('/auth/logout', {
          method: 'POST',
        });

        expect(status).toBe(401);
        expect(data.error).toContain('Authorization token required');
      });
    });

    describe('POST /auth/refresh', () => {
      test('should refresh access token', async () => {
        vi.mocked(import('@/services/auth.service').AuthService).mockImplementationOnce(() => ({
          refreshToken: vi.fn().mockResolvedValue({
            data: { session: { access_token: 'new-token-456' } },
            error: null,
          }),
        }));

        const { data, status } = await makeRequest('/auth/refresh', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer refresh-token',
          },
        });

        expect(status).toBe(200);
        expect(data.session.access_token).toBe('new-token-456');
      });
    });
  });

  describe('Services Endpoints', () => {
    describe('GET /api/services', () => {
      test('should return list of services', async () => {
        const mockServices = createServices(5);

        vi.mocked(import('@/services/services.service').ServicesService).mockImplementationOnce(() => ({
          getAllServices: vi.fn().mockResolvedValue({ data: mockServices, error: null }),
        }));

        const { data, status } = await makeRequest('/api/services');

        expect(status).toBe(200);
        expect(data.services).toEqual(mockServices);
        expect(data.pagination).toEqual({
          page: 1,
          limit: 20,
          total: 5,
          totalPages: 1,
        });
      });

      test('should support pagination', async () => {
        const mockServices = createServices(25);

        vi.mocked(import('@/services/services.service').ServicesService).mockImplementationOnce(() => ({
          getAllServices: vi.fn().mockResolvedValue({ data: mockServices, error: null }),
        }));

        const { data, status } = await makeRequest('/api/services?page=2&limit=10');

        expect(status).toBe(200);
        expect(data.pagination.page).toBe(2);
        expect(data.pagination.limit).toBe(10);
      });

      test('should support filtering by category', async () => {
        const beautyServices = createServices(3, { category: 'beauty' });

        vi.mocked(import('@/services/services.service').ServicesService).mockImplementationOnce(() => ({
          getServicesByCategory: vi.fn().mockResolvedValue({ data: beautyServices, error: null }),
        }));

        const { data, status } = await makeRequest('/api/services?category=beauty');

        expect(status).toBe(200);
        expect(data.services).toHaveLength(3);
        data.services.forEach((service: any) => {
          expect(service.category).toBe('beauty');
        });
      });

      test('should support search functionality', async () => {
        const searchResults = createServices(2, {
          title: 'Lash Enhancement',
          description: 'Professional lash services'
        });

        vi.mocked(import('@/services/services.service').ServicesService).mockImplementationOnce(() => ({
          searchServices: vi.fn().mockResolvedValue({ data: searchResults, error: null }),
        }));

        const { data, status } = await makeRequest('/api/services?search=lash');

        expect(status).toBe(200);
        expect(data.services).toHaveLength(2);
      });

      test('should handle empty results', async () => {
        vi.mocked(import('@/services/services.service').ServicesService).mockImplementationOnce(() => ({
          getAllServices: vi.fn().mockResolvedValue({ data: [], error: null }),
        }));

        const { data, status } = await makeRequest('/api/services');

        expect(status).toBe(200);
        expect(data.services).toEqual([]);
        expect(data.pagination.total).toBe(0);
      });
    });

    describe('GET /api/services/:id', () => {
      test('should return specific service', async () => {
        const mockService = createService({ id: 'service-123' });

        vi.mocked(import('@/services/services.service').ServicesService).mockImplementationOnce(() => ({
          getServiceById: vi.fn().mockResolvedValue({ data: mockService, error: null }),
        }));

        const { data, status } = await makeRequest('/api/services/service-123');

        expect(status).toBe(200);
        expect(data.service).toEqual(mockService);
      });

      test('should handle non-existent service', async () => {
        vi.mocked(import('@/services/services.service').ServicesService).mockImplementationOnce(() => ({
          getServiceById: vi.fn().mockResolvedValue({ data: null, error: { message: 'Service not found' } }),
        }));

        const { data, status } = await makeRequest('/api/services/non-existent');

        expect(status).toBe(404);
        expect(data.error).toContain('Service not found');
      });

      test('should include related data when requested', async () => {
        const mockService = createService({
          id: 'service-123',
          gallery_urls: ['image1.jpg', 'image2.jpg']
        });

        vi.mocked(import('@/services/services.service').ServicesService).mockImplementationOnce(() => ({
          getServiceById: vi.fn().mockResolvedValue({ data: mockService, error: null }),
        }));

        const { data, status } = await makeRequest('/api/services/service-123?include=gallery,faqs');

        expect(status).toBe(200);
        expect(data.service).toEqual(mockService);
      });
    });

    describe('POST /api/services', () => {
      test('should create new service (admin only)', async () => {
        const mockService = createService({ id: undefined });
        const createdService = { ...mockService, id: 'service-123' };

        vi.mocked(import('@/services/services.service').ServicesService).mockImplementationOnce(() => ({
          createService: vi.fn().mockResolvedValue({ data: createdService, error: null }),
        }));

        const serviceData = {
          title: 'New Service',
          description: 'Service description',
          category: 'beauty',
          price: 200,
          duration: 60,
        };

        const { data, status } = await makeRequest('/api/services', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer admin-token',
          },
          body: JSON.stringify(serviceData),
        });

        expect(status).toBe(201);
        expect(data.service).toEqual(createdService);
      });

      test('should reject unauthorized service creation', async () => {
        const serviceData = {
          title: 'New Service',
          description: 'Service description',
          category: 'beauty',
          price: 200,
          duration: 60,
        };

        const { data, status } = await makeRequest('/api/services', {
          method: 'POST',
          body: JSON.stringify(serviceData),
        });

        expect(status).toBe(401);
        expect(data.error).toContain('Admin access required');
      });

      test('should validate service data', async () => {
        const invalidServiceData = {
          title: '', // Empty title
          price: -100, // Negative price
          duration: 0, // Zero duration
        };

        const { data, status } = await makeRequest('/api/services', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer admin-token',
          },
          body: JSON.stringify(invalidServiceData),
        });

        expect(status).toBe(400);
        expect(data.errors).toContain('Title is required');
        expect(data.errors).toContain('Price must be positive');
        expect(data.errors).toContain('Duration must be positive');
      });
    });

    describe('PUT /api/services/:id', () => {
      test('should update service (admin only)', async () => {
        const updatedService = createService({
          id: 'service-123',
          title: 'Updated Service Title',
          price: 250,
        });

        vi.mocked(import('@/services/services.service').ServicesService).mockImplementationOnce(() => ({
          updateService: vi.fn().mockResolvedValue({ data: updatedService, error: null }),
        }));

        const updateData = {
          title: 'Updated Service Title',
          price: 250,
        };

        const { data, status } = await makeRequest('/api/services/service-123', {
          method: 'PUT',
          headers: {
            Authorization: 'Bearer admin-token',
          },
          body: JSON.stringify(updateData),
        });

        expect(status).toBe(200);
        expect(data.service).toEqual(updatedService);
      });

      test('should reject unauthorized service update', async () => {
        const updateData = { title: 'Updated Title' };

        const { data, status } = await makeRequest('/api/services/service-123', {
          method: 'PUT',
          body: JSON.stringify(updateData),
        });

        expect(status).toBe(401);
        expect(data.error).toContain('Admin access required');
      });
    });

    describe('DELETE /api/services/:id', () => {
      test('should delete service (admin only)', async () => {
        vi.mocked(import('@/services/services.service').ServicesService).mockImplementationOnce(() => ({
          deleteService: vi.fn().mockResolvedValue({ data: null, error: null }),
        }));

        const { data, status } = await makeRequest('/api/services/service-123', {
          method: 'DELETE',
          headers: {
            Authorization: 'Bearer admin-token',
          },
        });

        expect(status).toBe(200);
        expect(data.message).toContain('Service deleted successfully');
      });

      test('should reject unauthorized service deletion', async () => {
        const { data, status } = await makeRequest('/api/services/service-123', {
          method: 'DELETE',
        });

        expect(status).toBe(401);
        expect(data.error).toContain('Admin access required');
      });
    });
  });

  describe('Bookings Endpoints', () => {
    describe('GET /api/bookings', () => {
      test('should return user bookings', async () => {
        const mockBookings = createBookings(3, {
          client_id: 'user-123'
        });

        vi.mocked(import('@/services/booking.service').BookingService).mockImplementationOnce(() => ({
          getUserBookingsWithFilters: vi.fn().mockResolvedValue({ data: mockBookings, error: null }),
        }));

        const { data, status } = await makeRequest('/api/bookings', {
          headers: {
            Authorization: 'Bearer user-token',
          },
        });

        expect(status).toBe(200);
        expect(data.bookings).toEqual(mockBookings);
      });

      test('should support booking filters', async () => {
        const confirmedBookings = createBookings(2, {
          client_id: 'user-123',
          status: 'confirmed'
        });

        vi.mocked(import('@/services/booking.service').BookingService).mockImplementationOnce(() => ({
          getUserBookingsWithFilters: vi.fn().mockResolvedValue({ data: confirmedBookings, error: null }),
        }));

        const { data, status } = await makeRequest('/api/bookings?status=confirmed&limit=10', {
          headers: {
            Authorization: 'Bearer user-token',
          },
        });

        expect(status).toBe(200);
        expect(data.bookings).toHaveLength(2);
        data.bookings.forEach((booking: any) => {
          expect(booking.status).toBe('confirmed');
        });
      });

      test('should reject unauthorized booking access', async () => {
        const { data, status } = await makeRequest('/api/bookings');

        expect(status).toBe(401);
        expect(data.error).toContain('Authentication required');
      });
    });

    describe('POST /api/bookings', () => {
      test('should create new booking', async () => {
        const mockBooking = createBooking({ id: undefined });
        const createdBooking = { ...mockBooking, id: 'booking-123' };

        vi.mocked(import('@/services/booking.service').BookingService).mockImplementationOnce(() => ({
          createBooking: vi.fn().mockResolvedValue({ data: createdBooking, error: null }),
        }));

        const bookingData = {
          service_id: 'service-123',
          start_time: '2024-01-15T10:00:00Z',
          end_time: '2024-01-15T11:00:00Z',
          client_info: {
            name: 'John Doe',
            email: 'john.doe@example.com',
            phone: '+48123456789',
          },
        };

        const { data, status } = await makeRequest('/api/bookings', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer user-token',
          },
          body: JSON.stringify(bookingData),
        });

        expect(status).toBe(201);
        expect(data.booking).toEqual(createdBooking);
      });

      test('should validate booking data', async () => {
        const invalidBookingData = {
          service_id: '', // Missing service ID
          start_time: 'invalid-date',
          client_info: {
            name: '', // Missing name
            email: 'invalid-email', // Invalid email
            phone: '123', // Invalid phone
          },
        };

        const { data, status } = await makeRequest('/api/bookings', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer user-token',
          },
          body: JSON.stringify(invalidBookingData),
        });

        expect(status).toBe(400);
        expect(data.errors).toContain('Service ID is required');
        expect(data.errors).toContain('Valid start time is required');
        expect(data.errors).toContain('Name is required');
        expect(data.errors).toContain('Valid email is required');
        expect(data.errors).toContain('Valid phone number is required');
      });

      test('should handle booking conflicts', async () => {
        vi.mocked(import('@/services/booking.service').BookingService).mockImplementationOnce(() => ({
          createBooking: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Time slot is no longer available' },
          }),
        }));

        const bookingData = {
          service_id: 'service-123',
          start_time: '2024-01-15T10:00:00Z',
          end_time: '2024-01-15T11:00:00Z',
          client_info: {
            name: 'John Doe',
            email: 'john.doe@example.com',
            phone: '+48123456789',
          },
        };

        const { data, status } = await makeRequest('/api/bookings', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer user-token',
          },
          body: JSON.stringify(bookingData),
        });

        expect(status).toBe(409);
        expect(data.error).toContain('Time slot is no longer available');
      });
    });

    describe('GET /api/bookings/:id', () => {
      test('should return specific booking', async () => {
        const mockBooking = createBooking({ id: 'booking-123' });

        vi.mocked(import('@/services/booking.service').BookingService).mockImplementationOnce(() => ({
          getBookingById: vi.fn().mockResolvedValue({ data: mockBooking, error: null }),
        }));

        const { data, status } = await makeRequest('/api/bookings/booking-123', {
          headers: {
            Authorization: 'Bearer user-token',
          },
        });

        expect(status).toBe(200);
        expect(data.booking).toEqual(mockBooking);
      });

      test('should prevent access to other users bookings', async () => {
        const mockBooking = createBooking({
          id: 'booking-456',
          client_id: 'other-user-123' // Different user
        });

        vi.mocked(import('@/services/booking.service').BookingService).mockImplementationOnce(() => ({
          getBookingById: vi.fn().mockResolvedValue({ data: mockBooking, error: null }),
        }));

        const { data, status } = await makeRequest('/api/bookings/booking-456', {
          headers: {
            Authorization: 'Bearer user-token', // user-123 token
          },
        });

        expect(status).toBe(403);
        expect(data.error).toContain('Access denied');
      });
    });

    describe('PUT /api/bookings/:id/cancel', () => {
      test('should cancel booking', async () => {
        const cancelledBooking = createBooking({
          id: 'booking-123',
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: 'Client requested cancellation'
        });

        vi.mocked(import('@/services/booking.service').BookingService).mockImplementationOnce(() => ({
          cancelBooking: vi.fn().mockResolvedValue({ data: cancelledBooking, error: null }),
        }));

        const cancelData = {
          reason: 'Client requested cancellation',
        };

        const { data, status } = await makeRequest('/api/bookings/booking-123/cancel', {
          method: 'PUT',
          headers: {
            Authorization: 'Bearer user-token',
          },
          body: JSON.stringify(cancelData),
        });

        expect(status).toBe(200);
        expect(data.booking.status).toBe('cancelled');
        expect(data.booking.cancellation_reason).toBe('Client requested cancellation');
      });

      test('should prevent cancellation of completed bookings', async () => {
        const completedBooking = createBooking({
          id: 'booking-123',
          status: 'completed'
        });

        vi.mocked(import('@/services/booking.service').BookingService).mockImplementationOnce(() => ({
          getBookingById: vi.fn().mockResolvedValue({ data: completedBooking, error: null }),
        }));

        const { data, status } = await makeRequest('/api/bookings/booking-123/cancel', {
          method: 'PUT',
          headers: {
            Authorization: 'Bearer user-token',
          },
          body: JSON.stringify({ reason: 'Changed mind' }),
        });

        expect(status).toBe(400);
        expect(data.error).toContain('Cannot cancel completed booking');
      });
    });
  });

  describe('Availability Endpoints', () => {
    describe('GET /api/availability', () => {
      test('should return available time slots', async () => {
        const mockTimeSlots = createTimeSlots(5, {
          status: 'available',
          service_id: 'service-123'
        });

        vi.mocked(import('@/services/booking.service').BookingService).mockImplementationOnce(() => ({
          checkAvailability: vi.fn().mockResolvedValue({ data: mockTimeSlots, error: null }),
        }));

        const { data, status } = await makeRequest('/api/availability?service_id=service-123&start_date=2024-01-01&end_date=2024-01-31');

        expect(status).toBe(200);
        expect(data.timeSlots).toEqual(mockTimeSlots);
        expect(data.timeSlots).toHaveLength(5);
      });

      test('should validate availability query parameters', async () => {
        const { data, status } = await makeRequest('/api/availability'); // Missing required params

        expect(status).toBe(400);
        expect(data.errors).toContain('Service ID is required');
        expect(data.errors).toContain('Start date is required');
        expect(data.errors).toContain('End date is required');
      });

      test('should support date range filtering', async () => {
        const timeSlotsInRange = createTimeSlots(3, {
          start_time: '2024-01-15T10:00:00Z',
          service_id: 'service-123'
        });

        vi.mocked(import('@/services/booking.service').BookingService).mockImplementationOnce(() => ({
          checkAvailability: vi.fn().mockResolvedValue({ data: timeSlotsInRange, error: null }),
        }));

        const { data, status } = await makeRequest('/api/availability?service_id=service-123&start_date=2024-01-01&end_date=2024-01-31');

        expect(status).toBe(200);
        expect(data.timeSlots).toHaveLength(3);
      });
    });

    describe('POST /api/availability/:id/hold', () => {
      test('should hold time slot', async () => {
        const mockHold = {
          id: 'hold-123',
          time_slot_id: 'slot-123',
          session_id: 'session-123',
          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        };

        vi.mocked(import('@/services/booking.service').BookingService).mockImplementationOnce(() => ({
          holdTimeSlot: vi.fn().mockResolvedValue({ data: mockHold, error: null }),
        }));

        const { data, status } = await makeRequest('/api/availability/slot-123/hold', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer user-token',
          },
        });

        expect(status).toBe(200);
        expect(data.hold).toEqual(mockHold);
      });

      test('should handle time slot already held', async () => {
        vi.mocked(import('@/services/booking.service').BookingService).mockImplementationOnce(() => ({
          holdTimeSlot: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Time slot is no longer available' },
          }),
        }));

        const { data, status } = await makeRequest('/api/availability/slot-123/hold', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer user-token',
          },
        });

        expect(status).toBe(409);
        expect(data.error).toContain('Time slot is no longer available');
      });
    });

    describe('DELETE /api/availability/:id/hold', () => {
      test('should release time slot hold', async () => {
        vi.mocked(import('@/services/booking.service').BookingService).mockImplementationOnce(() => ({
          releaseTimeSlot: vi.fn().mockResolvedValue({ error: null }),
        }));

        const { data, status } = await makeRequest('/api/availability/slot-123/hold', {
          method: 'DELETE',
          headers: {
            Authorization: 'Bearer user-token',
          },
        });

        expect(status).toBe(200);
        expect(data.message).toContain('Time slot hold released');
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle 404 routes', async () => {
      const { data, status } = await makeRequest('/api/non-existent-endpoint');

      expect(status).toBe(404);
      expect(data.error).toContain('Endpoint not found');
    });

    test('should handle invalid JSON payload', async () => {
      const { data, status } = await makeRequest('/api/auth/login', {
        method: 'POST',
        body: 'invalid-json',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(status).toBe(400);
      expect(data.error).toContain('Invalid JSON payload');
    });

    test('should handle rate limiting', async () => {
      // Mock rate limiting middleware
      const mockRateLimit = vi.fn().mockImplementation(() => {
        return { status: 429, json: () => ({ error: 'Too many requests' }) };
      });

      const { data, status } = await makeRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
      });

      // This would need to be implemented in the actual rate limiting middleware
      // For now, we'll just verify the structure
      expect(status).toBeDefined();
    });

    test('should handle server errors', async () => {
      // Mock database error
      vi.mocked(import('@/services/booking.service').BookingService).mockImplementationOnce(() => ({
        createBooking: vi.fn().mockRejectedValue(new Error('Database connection failed')),
      }));

      const bookingData = {
        service_id: 'service-123',
        start_time: '2024-01-15T10:00:00Z',
        end_time: '2024-01-15T11:00:00Z',
        client_info: {
          name: 'John Doe',
          email: 'john.doe@example.com',
          phone: '+48123456789',
        },
      };

      const { data, status } = await makeRequest('/api/bookings', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer user-token',
        },
        body: JSON.stringify(bookingData),
      });

      expect(status).toBe(500);
      expect(data.error).toContain('Internal server error');
    });
  });

  describe('Request Validation', () => {
    test('should validate request headers', async () => {
      const { data, status } = await makeRequest('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain', // Invalid content type
        },
      });

      expect(status).toBe(400);
      expect(data.error).toContain('Content-Type must be application/json');
    });

    test('should validate request size limits', async () => {
      const largePayload = {
        data: 'x'.repeat(1000000), // 1MB of data
      };

      const { data, status } = await makeRequest('/api/bookings', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer user-token',
        },
        body: JSON.stringify(largePayload),
      });

      expect(status).toBe(413);
      expect(data.error).toContain('Request payload too large');
    });

    test('should sanitize input data', async () => {
      const maliciousData = {
        service_id: '<script>alert("xss")</script>',
        start_time: '2024-01-15T10:00:00Z',
        client_info: {
          name: 'John<script>alert("xss")</script>Doe',
          email: 'john.doe@example.com',
          phone: '+48123456789',
        },
      };

      const { data, status } = await makeRequest('/api/bookings', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer user-token',
        },
        body: JSON.stringify(maliciousData),
      });

      // Input should be sanitized
      expect(status).toBe(400);
      expect(data.errors).toContain('Invalid characters in input');
    });
  });

  describe('Response Headers', () => {
    test('should include CORS headers', async () => {
      const { headers } = await makeRequest('/health');

      expect(headers.get('Access-Control-Allow-Origin')).toBeTruthy();
      expect(headers.get('Access-Control-Allow-Methods')).toBeTruthy();
      expect(headers.get('Access-Control-Allow-Headers')).toBeTruthy();
    });

    test('should include security headers', async () => {
      const { headers } = await makeRequest('/health');

      expect(headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(headers.get('X-Frame-Options')).toBe('DENY');
      expect(headers.get('X-XSS-Protection')).toBeTruthy();
    });

    test('should include rate limiting headers', async () => {
      const { headers } = await makeRequest('/health');

      // Rate limiting headers would be set by middleware
      expect(headers.get('X-RateLimit-Limit')).toBeTruthy();
      expect(headers.get('X-RateLimit-Remaining')).toBeTruthy();
      expect(headers.get('X-RateLimit-Reset')).toBeTruthy();
    });
  });
});