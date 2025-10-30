/**
 * Mock Service Factory
 *
 * Provides comprehensive mocking for external services including
 * Supabase, Stripe, Booksy, and email services for reliable testing.
 */

import { vi } from 'vitest';

// Base mock service interface
export interface MockService {
  reset(): void;
  setup(): void;
  teardown(): void;
}

// Mock data types
export interface MockUser {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface MockService {
  id: string;
  title: string;
  description: string;
  category: 'beauty' | 'fitness' | 'lifestyle';
  price: number;
  duration: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface MockBooking {
  id: string;
  service_id: string;
  profile_id: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  total_price: number;
  created_at: string;
  updated_at: string;
}

export interface MockAvailabilitySlot {
  id: string;
  service_id: string;
  start_time: string;
  end_time: string;
  status: 'available' | 'booked' | 'blocked';
  max_bookings: number;
  current_bookings: number;
  created_at: string;
  updated_at: string;
}

// In-memory mock database
class MockDatabase {
  private users: Map<string, MockUser> = new Map();
  private services: Map<string, MockService> = new Map();
  private bookings: Map<string, MockBooking> = new Map();
  private availabilitySlots: Map<string, MockAvailabilitySlot> = new Map();

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    // Seed test users
    const testUsers: MockUser[] = [
      {
        id: 'user-1',
        email: 'test@example.com',
        full_name: 'Test User',
        phone: '+1234567890',
        role: 'customer',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'admin-1',
        email: 'admin@example.com',
        full_name: 'Admin User',
        phone: '+0987654321',
        role: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    testUsers.forEach(user => this.users.set(user.id, user));

    // Seed test services
    const testServices: MockService[] = [
      {
        id: 'service-1',
        title: 'Lip Enhancement',
        description: 'Professional lip enhancement service',
        category: 'beauty',
        price: 250.00,
        duration: 60,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'service-2',
        title: 'Personal Training',
        description: 'One-on-one personal training session',
        category: 'fitness',
        price: 150.00,
        duration: 45,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'service-3',
        title: 'Brow Shaping',
        description: 'Professional brow shaping and styling',
        category: 'beauty',
        price: 80.00,
        duration: 30,
        status: 'inactive',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    testServices.forEach(service => this.services.set(service.id, service));

    // Seed availability slots
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const testSlots: MockAvailabilitySlot[] = [
      {
        id: 'slot-1',
        service_id: 'service-1',
        start_time: tomorrow.toISOString(),
        end_time: new Date(tomorrow.getTime() + 60 * 60 * 1000).toISOString(),
        status: 'available',
        max_bookings: 1,
        current_bookings: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'slot-2',
        service_id: 'service-2',
        start_time: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(),
        status: 'available',
        max_bookings: 3,
        current_bookings: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    testSlots.forEach(slot => this.availabilitySlots.set(slot.id, slot));
  }

  // User operations
  createUser(userData: Partial<MockUser>): MockUser {
    const user: MockUser = {
      id: `user-${Date.now()}`,
      email: userData.email || '',
      full_name: userData.full_name || '',
      phone: userData.phone,
      role: userData.role || 'customer',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...userData
    };

    this.users.set(user.id, user);
    return user;
  }

  getUser(id: string): MockUser | undefined {
    return this.users.get(id);
  }

  getUserByEmail(email: string): MockUser | undefined {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  updateUser(id: string, updates: Partial<MockUser>): MockUser | undefined {
    const user = this.users.get(id);
    if (user) {
      const updatedUser = { ...user, ...updates, updated_at: new Date().toISOString() };
      this.users.set(id, updatedUser);
      return updatedUser;
    }
    return undefined;
  }

  // Service operations
  getServices(category?: string): MockService[] {
    const services = Array.from(this.services.values());
    return category ? services.filter(service => service.category === category) : services;
  }

  getService(id: string): MockService | undefined {
    return this.services.get(id);
  }

  createService(serviceData: Partial<MockService>): MockService {
    const service: MockService = {
      id: `service-${Date.now()}`,
      title: serviceData.title || '',
      description: serviceData.description || '',
      category: serviceData.category || 'beauty',
      price: serviceData.price || 0,
      duration: serviceData.duration || 60,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...serviceData
    };

    this.services.set(service.id, service);
    return service;
  }

  // Booking operations
  createBooking(bookingData: Partial<MockBooking>): MockBooking {
    const booking: MockBooking = {
      id: `booking-${Date.now()}`,
      service_id: bookingData.service_id || '',
      profile_id: bookingData.profile_id || '',
      start_time: bookingData.start_time || new Date().toISOString(),
      end_time: bookingData.end_time || new Date().toISOString(),
      status: 'pending',
      total_price: bookingData.total_price || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...bookingData
    };

    this.bookings.set(booking.id, booking);
    return booking;
  }

  getBooking(id: string): MockBooking | undefined {
    return this.bookings.get(id);
  }

  getBookingsForUser(userId: string): MockBooking[] {
    return Array.from(this.bookings.values()).filter(booking => booking.profile_id === userId);
  }

  updateBooking(id: string, updates: Partial<MockBooking>): MockBooking | undefined {
    const booking = this.bookings.get(id);
    if (booking) {
      const updatedBooking = { ...booking, ...updates, updated_at: new Date().toISOString() };
      this.bookings.set(id, updatedBooking);
      return updatedBooking;
    }
    return undefined;
  }

  // Availability operations
  getAvailabilitySlots(serviceId?: string): MockAvailabilitySlot[] {
    const slots = Array.from(this.availabilitySlots.values());
    return serviceId ? slots.filter(slot => slot.service_id === serviceId) : slots;
  }

  createAvailabilitySlot(slotData: Partial<MockAvailabilitySlot>): MockAvailabilitySlot {
    const slot: MockAvailabilitySlot = {
      id: `slot-${Date.now()}`,
      service_id: slotData.service_id || '',
      start_time: slotData.start_time || new Date().toISOString(),
      end_time: slotData.end_time || new Date().toISOString(),
      status: 'available',
      max_bookings: slotData.max_bookings || 1,
      current_bookings: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...slotData
    };

    this.availabilitySlots.set(slot.id, slot);
    return slot;
  }

  updateAvailabilitySlot(id: string, updates: Partial<MockAvailabilitySlot>): MockAvailabilitySlot | undefined {
    const slot = this.availabilitySlots.get(id);
    if (slot) {
      const updatedSlot = { ...slot, ...updates, updated_at: new Date().toISOString() };
      this.availabilitySlots.set(id, updatedSlot);
      return updatedSlot;
    }
    return undefined;
  }

  // Utility methods
  reset(): void {
    this.users.clear();
    this.services.clear();
    this.bookings.clear();
    this.availabilitySlots.clear();
    this.seedInitialData();
  }
}

// Global mock database instance
const mockDb = new MockDatabase();

// Supabase Mock Service
export class SupabaseMockService implements MockService {
  private auth: any;
  private client: any;

  constructor() {
    this.setup();
  }

  setup(): void {
    // Mock Supabase client
    this.client = {
      from: vi.fn((table: string) => this.createTableMock(table)),
      storage: {
        from: vi.fn(() => ({
          upload: vi.fn(),
          getPublicUrl: vi.fn(),
          remove: vi.fn()
        }))
      },
      functions: {
        invoke: vi.fn()
      }
    };

    // Mock Supabase auth
    this.auth = {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getCurrentUser: vi.fn(),
      onAuthStateChange: vi.fn(),
      updateUser: vi.fn(),
      resetPasswordForEmail: vi.fn()
    };

    // Setup default responses
    this.setupDefaultResponses();
  }

  private createTableMock(table: string) {
    return {
      select: vi.fn((columns?: string) => ({
        eq: vi.fn((column: string, value: any) => this.createQueryMock(table, 'eq', column, value)),
        in: vi.fn((column: string, values: any[]) => this.createQueryMock(table, 'in', column, values)),
        gte: vi.fn((column: string, value: any) => this.createQueryMock(table, 'gte', column, value)),
        lte: vi.fn((column: string, value: any) => this.createQueryMock(table, 'lte', column, value)),
        order: vi.fn(() => this.createQueryMock(table)),
        limit: vi.fn((limit: number) => this.createQueryMock(table, 'limit', limit)),
        single: vi.fn(() => this.createQueryMock(table, 'single')),
        then: vi.fn((resolve: any) => resolve(this.executeQuery(table)))
      })),
      insert: vi.fn((data: any) => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: this.insertData(table, data), error: null }))
        })),
        then: vi.fn((resolve: any) => resolve({ data: this.insertData(table, data), error: null }))
      })),
      update: vi.fn((data: any) => ({
        eq: vi.fn((column: string, value: any) => ({
          select: vi.fn(() => ({
            then: vi.fn((resolve: any) => resolve({
              data: this.updateData(table, column, value, data),
              error: null
            }))
          }))
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn((column: string, value: any) => ({
          then: vi.fn((resolve: any) => resolve({
            data: this.deleteData(table, column, value),
            error: null
          }))
        }))
      }))
    };
  }

  private createQueryMock(table: string, operation?: string, column?: string, value?: any) {
    return {
      data: null,
      error: null,
      then: vi.fn((resolve: any) => resolve(this.executeQuery(table, operation, column, value)))
    };
  }

  private executeQuery(table: string, operation?: string, column?: string, value?: any) {
    try {
      switch (table) {
        case 'profiles':
          if (operation === 'eq' && column === 'id') {
            const user = mockDb.getUser(value);
            return { data: user, error: null };
          }
          if (operation === 'eq' && column === 'email') {
            const user = mockDb.getUserByEmail(value);
            return { data: user, error: null };
          }
          return { data: Array.from(mockDb.users.values()), error: null };

        case 'services':
          if (operation === 'eq' && column === 'id') {
            const service = mockDb.getService(value);
            return { data: service, error: null };
          }
          if (operation === 'eq' && column === 'category') {
            const services = mockDb.getServices(value);
            return { data: services, error: null };
          }
          return { data: mockDb.getServices(), error: null };

        case 'bookings':
          if (operation === 'eq' && column === 'id') {
            const booking = mockDb.getBooking(value);
            return { data: booking, error: null };
          }
          if (operation === 'eq' && column === 'profile_id') {
            const bookings = mockDb.getBookingsForUser(value);
            return { data: bookings, error: null };
          }
          return { data: Array.from(mockDb.bookings.values()), error: null };

        case 'availability_slots':
          if (operation === 'eq' && column === 'id') {
            const slot = mockDb.getAvailabilitySlots().find(s => s.id === value);
            return { data: slot, error: null };
          }
          if (operation === 'eq' && column === 'service_id') {
            const slots = mockDb.getAvailabilitySlots(value);
            return { data: slots, error: null };
          }
          return { data: mockDb.getAvailabilitySlots(), error: null };

        default:
          return { data: [], error: null };
      }
    } catch (error) {
      return { data: null, error: error.message };
    }
  }

  private insertData(table: string, data: any) {
    try {
      switch (table) {
        case 'profiles':
          return mockDb.createUser(data);
        case 'services':
          return mockDb.createService(data);
        case 'bookings':
          return mockDb.createBooking(data);
        case 'availability_slots':
          return mockDb.createAvailabilitySlot(data);
        default:
          return data;
      }
    } catch (error) {
      return null;
    }
  }

  private updateData(table: string, column: string, value: any, updates: any) {
    try {
      switch (table) {
        case 'profiles':
          return mockDb.updateUser(value, updates);
        case 'services':
          return mockDb.updateService?.(value, updates);
        case 'bookings':
          return mockDb.updateBooking(value, updates);
        case 'availability_slots':
          return mockDb.updateAvailabilitySlot(value, updates);
        default:
          return updates;
      }
    } catch (error) {
      return null;
    }
  }

  private deleteData(table: string, column: string, value: any) {
    // For simplicity, we'll just return the deleted item
    return this.executeQuery(table, 'eq', column, value).data;
  }

  private setupDefaultResponses(): void {
    // Auth responses
    this.auth.signInWithPassword.mockResolvedValue({
      data: { user: mockDb.getUser('user-1'), session: { access_token: 'mock-token' } },
      error: null
    });

    this.auth.signUp.mockResolvedValue({
      data: { user: mockDb.getUser('user-1'), session: { access_token: 'mock-token' } },
      error: null
    });

    this.auth.getCurrentUser.mockResolvedValue({
      data: { user: mockDb.getUser('user-1') },
      error: null
    });

    this.auth.signOut.mockResolvedValue({ error: null });

    // Storage responses
    this.client.storage.from().upload.mockResolvedValue({
      data: { path: 'uploads/image.jpg' },
      error: null
    });

    this.client.storage.from().getPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://mock-url.com/image.jpg' }
    });
  }

  getClient(): any {
    return this.client;
  }

  getAuth(): any {
    return this.auth;
  }

  reset(): void {
    mockDb.reset();
    this.setup();
  }

  teardown(): void {
    mockDb.reset();
  }
}

// Stripe Mock Service
export class StripeMockService implements MockService {
  private stripe: any;

  constructor() {
    this.setup();
  }

  setup(): void {
    this.stripe = {
      paymentIntents: {
        create: vi.fn(),
        confirm: vi.fn(),
        retrieve: vi.fn(),
        cancel: vi.fn()
      },
      customers: {
        create: vi.fn(),
        retrieve: vi.fn(),
        update: vi.fn()
      },
      prices: {
        create: vi.fn(),
        retrieve: vi.fn(),
        list: vi.fn()
      },
      products: {
        create: vi.fn(),
        retrieve: vi.fn(),
        update: vi.fn()
      },
      webhooks: {
        constructEvent: vi.fn()
      }
    };

    this.setupDefaultResponses();
  }

  private setupDefaultResponses(): void {
    // Payment Intent responses
    this.stripe.paymentIntents.create.mockResolvedValue({
      id: 'pi_mock_123',
      client_secret: 'pi_mock_123_secret',
      status: 'requires_payment_method',
      amount: 10000,
      currency: 'pln'
    });

    this.stripe.paymentIntents.confirm.mockResolvedValue({
      id: 'pi_mock_123',
      status: 'succeeded',
      amount: 10000,
      currency: 'pln'
    });

    // Customer responses
    this.stripe.customers.create.mockResolvedValue({
      id: 'cus_mock_123',
      email: 'test@example.com',
      name: 'Test User'
    });

    // Price responses
    this.stripe.prices.create.mockResolvedValue({
      id: 'price_mock_123',
      unit_amount: 10000,
      currency: 'pln',
      product: 'prod_mock_123'
    });

    // Product responses
    this.stripe.products.create.mockResolvedValue({
      id: 'prod_mock_123',
      name: 'Test Service',
      description: 'Test service description'
    });
  }

  getStripe(): any {
    return this.stripe;
  }

  reset(): void {
    this.setup();
  }

  teardown(): void {
    // Clean up any timers or async operations
  }
}

// Booksy Mock Service
export class BooksyMockService implements MockService {
  private client: any;

  constructor() {
    this.setup();
  }

  setup(): void {
    this.client = {
      getAvailability: vi.fn(),
      createAppointment: vi.fn(),
      updateAppointment: vi.fn(),
      cancelAppointment: vi.fn(),
      getServices: vi.fn(),
      getAppointments: vi.fn()
    };

    this.setupDefaultResponses();
  }

  private setupDefaultResponses(): void {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    this.client.getAvailability.mockResolvedValue({
      data: [
        {
          id: 'booksy-slot-1',
          start_time: tomorrow.toISOString(),
          end_time: new Date(tomorrow.getTime() + 60 * 60 * 1000).toISOString(),
          available: true
        }
      ]
    });

    this.client.createAppointment.mockResolvedValue({
      data: {
        id: 'booksy-appointment-1',
        status: 'confirmed',
        service_id: 'service-1',
        start_time: tomorrow.toISOString()
      }
    });

    this.client.getServices.mockResolvedValue({
      data: [
        {
          id: 'booksy-service-1',
          name: 'Lip Enhancement',
          price: 250.00,
          duration: 60
        }
      ]
    });
  }

  getClient(): any {
    return this.client;
  }

  reset(): void {
    this.setup();
  }

  teardown(): void {
    // Clean up any external connections
  }
}

// Email Mock Service
export class EmailMockService implements MockService {
  private emails: any[] = [];

  constructor() {
    this.setup();
  }

  setup(): void {
    // Mock email service
    this.emailService = {
      send: vi.fn(),
      sendTemplate: vi.fn(),
      verify: vi.fn()
    };

    this.setupDefaultResponses();
  }

  private setupDefaultResponses(): void {
    this.emailService.send.mockResolvedValue({
      messageId: 'msg_mock_123',
      status: 'sent'
    });

    this.emailService.sendTemplate.mockResolvedValue({
      messageId: 'msg_template_123',
      status: 'sent'
    });

    this.emailService.verify.mockResolvedValue({
      valid: true,
      reason: 'valid'
    });
  }

  async sendEmail(to: string, subject: string, content: string): Promise<any> {
    const email = {
      id: `email_${Date.now()}`,
      to,
      subject,
      content,
      sent_at: new Date().toISOString()
    };

    this.emails.push(email);
    return this.emailService.send({ to, subject, content });
  }

  async sendTemplate(to: string, templateId: string, data: any): Promise<any> {
    const email = {
      id: `email_${Date.now()}`,
      to,
      templateId,
      data,
      sent_at: new Date().toISOString()
    };

    this.emails.push(email);
    return this.emailService.sendTemplate({ to, templateId, data });
  }

  getEmails(): any[] {
    return this.emails;
  }

  reset(): void {
    this.emails = [];
    this.setup();
  }

  teardown(): void {
    this.emails = [];
  }
}

// Mock Service Factory
export class MockServiceFactory {
  private static instance: MockServiceFactory;
  private services: Map<string, MockService> = new Map();

  private constructor() {
    this.initializeServices();
  }

  static getInstance(): MockServiceFactory {
    if (!MockServiceFactory.instance) {
      MockServiceFactory.instance = new MockServiceFactory();
    }
    return MockServiceFactory.instance;
  }

  private initializeServices(): void {
    this.services.set('supabase', new SupabaseMockService());
    this.services.set('stripe', new StripeMockService());
    this.services.set('booksy', new BooksyMockService());
    this.services.set('email', new EmailMockService());
  }

  getService<T extends MockService>(name: string): T {
    const service = this.services.get(name) as T;
    if (!service) {
      throw new Error(`Mock service '${name}' not found`);
    }
    return service;
  }

  getAllServices(): Map<string, MockService> {
    return new Map(this.services);
  }

  resetAll(): void {
    this.services.forEach(service => service.reset());
  }

  teardownAll(): void {
    this.services.forEach(service => service.teardown());
  }

  // Convenience methods for common services
  getSupabase(): SupabaseMockService {
    return this.getService<SupabaseMockService>('supabase');
  }

  getStripe(): StripeMockService {
    return this.getService<StripeMockService>('stripe');
  }

  getBooksy(): BooksyMockService {
    return this.getService<BooksyMockService>('booksy');
  }

  getEmail(): EmailMockService {
    return this.getService<EmailMockService>('email');
  }
}

// Global mock service instance
export const mockServiceFactory = MockServiceFactory.getInstance();

// Vitest setup function
export function setupMocks() {
  // Reset all mocks before each test
  mockServiceFactory.resetAll();

  // Return mock services for easy access in tests
  return {
    supabase: mockServiceFactory.getSupabase(),
    stripe: mockServiceFactory.getStripe(),
    booksy: mockServiceFactory.getBooksy(),
    email: mockServiceFactory.getEmail(),
    mockDb
  };
}

// Cleanup function
export function cleanupMocks() {
  mockServiceFactory.teardownAll();
}

export default mockServiceFactory;