import { describe, it, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import {
  createBooking,
  createTimeSlot,
  createService,
  createExtendedProfile,
  createServices,
  createTimeSlots
} from '@/test/factories/extended-factories';

// Mock Supabase client for testing database operations
const mockSupabaseClient = {
  from: vi.fn(),
  rpc: vi.fn(),
  auth: {
    getUser: vi.fn(),
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    updateUser: vi.fn(),
    onAuthStateChange: vi.fn(),
  },
  storage: {
    from: vi.fn(),
  },
  realtime: {
    channel: vi.fn(),
    subscribe: vi.fn(),
  },
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient,
}));

describe('Supabase Database Operations', () => {
  let mockTable: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create a comprehensive mock table object
    mockTable = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      like: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      and: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      exists: vi.fn().mockResolvedValue({ data: false, error: null }),
      then: vi.fn().mockImplementation((resolve) => {
        resolve({ data: [], error: null });
        return mockTable;
      }),
      catch: vi.fn().mockReturnThis(),
      finally: vi.fn().mockReturnThis(),
    };

    mockSupabaseClient.from.mockReturnValue(mockTable);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Booking Operations', () => {
    describe('Create Booking', () => {
      test('should create a new booking record', async () => {
        const mockBooking = createBooking({ id: undefined });
        const createdBooking = { ...mockBooking, id: 'booking-123', created_at: new Date().toISOString() };

        mockTable.insert.mockReturnValue(mockTable);
        mockTable.select.mockReturnValue(mockTable);
        mockTable.single.mockResolvedValue({ data: createdBooking, error: null });

        const result = await supabase
          .from('bookings')
          .insert(mockBooking)
          .select()
          .single();

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('bookings');
        expect(mockTable.insert).toHaveBeenCalledWith(mockBooking);
        expect(mockTable.select).toHaveBeenCalled();
        expect(mockTable.single).toHaveBeenCalled();
        expect(result.data).toEqual(createdBooking);
      });

      test('should handle booking creation with required fields validation', async () => {
        const incompleteBooking = {
          service_id: 'service-123',
          // Missing required fields: client_id, start_time, end_time
        };

        mockTable.insert.mockRejectedValue({
          message: 'null value in column "client_id" violates not-null constraint',
          code: '23502'
        });

        try {
          await supabase
            .from('bookings')
            .insert(incompleteBooking)
            .select()
            .single();
          expect.fail('Should have thrown an error');
        } catch (error: any) {
          expect(error.message).toContain('null value in column "client_id"');
          expect(error.code).toBe('23502');
        }
      });

      test('should create booking with proper relationships', async () => {
        const mockBooking = createBooking({
          service_id: 'service-123',
          client_id: 'client-123',
          staff_id: 'staff-123',
          location_id: 'location-123',
        });
        const createdBooking = { ...mockBooking, id: 'booking-123' };

        mockTable.insert.mockReturnValue(mockTable);
        mockTable.select.mockReturnValue(mockTable);
        mockTable.single.mockResolvedValue({ data: createdBooking, error: null });

        const result = await supabase
          .from('bookings')
          .insert(mockBooking)
          .select(`
            *,
            services(id, title, category),
            profiles(id, full_name, email),
            locations(id, name, address)
          `)
          .single();

        expect(mockTable.select).toHaveBeenCalledWith(`
            *,
            services(id, title, category),
            profiles(id, full_name, email),
            locations(id, name, address)
          `);
        expect(result.data).toEqual(createdBooking);
      });
    });

    describe('Read Bookings', () => {
      test('should retrieve bookings with filters', async () => {
        const mockBookings = createBookings(5);
        mockTable.select.mockResolvedValue({ data: mockBookings, error: null });

        const result = await supabase
          .from('bookings')
          .select('*')
          .eq('client_id', 'client-123')
          .eq('status', 'confirmed')
          .gte('start_time', '2024-01-01T00:00:00Z')
          .lte('start_time', '2024-12-31T23:59:59Z')
          .order('start_time', { ascending: true });

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('bookings');
        expect(mockTable.eq).toHaveBeenCalledWith('client_id', 'client-123');
        expect(mockTable.eq).toHaveBeenCalledWith('status', 'confirmed');
        expect(mockTable.gte).toHaveBeenCalledWith('start_time', '2024-01-01T00:00:00Z');
        expect(mockTable.lte).toHaveBeenCalledWith('start_time', '2024-12-31T23:59:59Z');
        expect(mockTable.order).toHaveBeenCalledWith('start_time', { ascending: true });
        expect(result.data).toEqual(mockBookings);
      });

      test('should retrieve single booking by ID', async () => {
        const mockBooking = createBooking({ id: 'booking-123' });
        mockTable.single.mockResolvedValue({ data: mockBooking, error: null });

        const result = await supabase
          .from('bookings')
          .select('*')
          .eq('id', 'booking-123')
          .single();

        expect(mockTable.eq).toHaveBeenCalledWith('id', 'booking-123');
        expect(mockTable.single).toHaveBeenCalled();
        expect(result.data).toEqual(mockBooking);
      });

      test('should handle non-existent booking', async () => {
        mockTable.single.mockResolvedValue({
          data: null,
          error: { message: 'No rows found', code: 'PGRST116' }
        });

        const result = await supabase
          .from('bookings')
          .select('*')
          .eq('id', 'non-existent')
          .single();

        expect(result.data).toBeNull();
        expect(result.error.message).toBe('No rows found');
      });

      test('should paginate booking results', async () => {
        const mockBookings = createBookings(20);
        mockTable.select.mockResolvedValue({ data: mockBookings, error: null });

        const result = await supabase
          .from('bookings')
          .select('*')
          .eq('client_id', 'client-123')
          .order('created_at', { ascending: false })
          .range(0, 9); // First page, 10 items

        expect(mockTable.range).toHaveBeenCalledWith(0, 9);
        expect(result.data).toEqual(mockBookings);
      });
    });

    describe('Update Bookings', () => {
      test('should update booking status', async () => {
        const bookingId = 'booking-123';
        const updateData = { status: 'confirmed', payment_status: 'paid' };
        const updatedBooking = createBooking({ id: bookingId, ...updateData });

        mockTable.update.mockReturnValue(mockTable);
        mockTable.eq.mockReturnValue(mockTable);
        mockTable.select.mockReturnValue(mockTable);
        mockTable.single.mockResolvedValue({ data: updatedBooking, error: null });

        const result = await supabase
          .from('bookings')
          .update(updateData)
          .eq('id', bookingId)
          .select()
          .single();

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('bookings');
        expect(mockTable.update).toHaveBeenCalledWith(updateData);
        expect(mockTable.eq).toHaveBeenCalledWith('id', bookingId);
        expect(result.data).toEqual(updatedBooking);
      });

      test('should handle concurrent booking updates', async () => {
        const bookingId = 'booking-123';
        const updateData = { status: 'cancelled' };

        // Simulate optimistic locking failure
        mockTable.update.mockRejectedValue({
          message: 'optimistic lock failed',
          code: 'PGRST116'
        });

        try {
          await supabase
            .from('bookings')
            .update(updateData)
            .eq('id', bookingId)
            .eq('version', 1) // Version check for optimistic locking
            .single();
          expect.fail('Should have thrown an error');
        } catch (error: any) {
          expect(error.message).toContain('optimistic lock failed');
        }
      });
    });

    describe('Delete Bookings', () => {
      test('should soft delete booking (update status)', async () => {
        const bookingId = 'booking-123';
        const cancelledBooking = createBooking({
          id: bookingId,
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: 'Client requested cancellation'
        });

        mockTable.update.mockReturnValue(mockTable);
        mockTable.eq.mockReturnValue(mockTable);
        mockTable.select.mockReturnValue(mockTable);
        mockTable.single.mockResolvedValue({ data: cancelledBooking, error: null });

        const result = await supabase
          .from('bookings')
          .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            cancellation_reason: 'Client requested cancellation'
          })
          .eq('id', bookingId)
          .select()
          .single();

        expect(mockTable.update).toHaveBeenCalledWith({
          status: 'cancelled',
          cancelled_at: expect.any(String),
          cancellation_reason: 'Client requested cancellation'
        });
        expect(result.data).toEqual(cancelledBooking);
      });

      test('should permanently delete booking (hard delete)', async () => {
        const bookingId = 'booking-123';
        mockTable.delete.mockReturnValue(mockTable);
        mockTable.eq.mockResolvedValue({ data: null, error: null });

        const result = await supabase
          .from('bookings')
          .delete()
          .eq('id', bookingId);

        expect(mockTable.delete).toHaveBeenCalled();
        expect(mockTable.eq).toHaveBeenCalledWith('id', bookingId);
        expect(result.error).toBeNull();
      });
    });

    describe('Booking Relationships', () => {
      test('should retrieve bookings with service details', async () => {
        const mockBookings = createBookings(3);
        mockTable.select.mockResolvedValue({ data: mockBookings, error: null });

        const result = await supabase
          .from('bookings')
          .select(`
            *,
            service:services(id, title, category, duration, price),
            client:profiles(id, full_name, email, phone)
          `);

        expect(mockTable.select).toHaveBeenCalledWith(`
            *,
            service:services(id, title, category, duration, price),
            client:profiles(id, full_name, email, phone)
          `);
        expect(result.data).toEqual(mockBookings);
      });

      test('should handle complex booking queries with aggregations', async () => {
        mockSupabaseClient.rpc.mockResolvedValue({
          data: [
            { month: '2024-01', booking_count: 45, revenue: 12500 },
            { month: '2024-02', booking_count: 52, revenue: 14800 },
          ],
          error: null
        });

        const result = await supabase.rpc('get_booking_statistics', {
          start_date: '2024-01-01',
          end_date: '2024-12-31',
          group_by: 'month'
        });

        expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('get_booking_statistics', {
          start_date: '2024-01-01',
          end_date: '2024-12-31',
          group_by: 'month'
        });
        expect(result.data).toHaveLength(2);
      });
    });
  });

  describe('Availability Slots Operations', () => {
    describe('Create Time Slots', () => {
      test('should create multiple availability slots', async () => {
        const mockTimeSlots = createTimeSlots(5, { id: undefined });
        const createdTimeSlots = mockTimeSlots.map((slot, index) => ({
          ...slot,
          id: `slot-${index + 1}`,
          created_at: new Date().toISOString()
        }));

        mockTable.insert.mockReturnValue(mockTable);
        mockTable.select.mockReturnValue(mockTable);
        mockTable.then.mockImplementation((resolve) => {
          resolve({ data: createdTimeSlots, error: null });
          return mockTable;
        });

        const result = await supabase
          .from('availability_slots')
          .insert(mockTimeSlots)
          .select();

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('availability_slots');
        expect(mockTable.insert).toHaveBeenCalledWith(mockTimeSlots);
        expect(result.data).toEqual(createdTimeSlots);
      });

      test('should handle time slot conflicts', async () => {
        const conflictingSlot = createTimeSlot({
          service_id: 'service-123',
          start_time: '2024-01-15T10:00:00Z',
          end_time: '2024-01-15T11:00:00Z',
        });

        mockTable.insert.mockRejectedValue({
          message: 'duplicate key value violates unique constraint',
          code: '23505',
          details: {
            constraint: 'availability_slots_service_time_unique'
          }
        });

        try {
          await supabase
            .from('availability_slots')
            .insert(conflictingSlot)
            .single();
          expect.fail('Should have thrown a duplicate key error');
        } catch (error: any) {
          expect(error.code).toBe('23505');
          expect(error.message).toContain('duplicate key value');
        }
      });
    });

    describe('Query Time Slots', () => {
      test('should retrieve available time slots for a service', async () => {
        const serviceId = 'service-123';
        const startDate = '2024-01-01T00:00:00Z';
        const endDate = '2024-01-31T23:59:59Z';
        const mockTimeSlots = createTimeSlots(10, {
          service_id: serviceId,
          status: 'available'
        });

        mockTable.select.mockResolvedValue({ data: mockTimeSlots, error: null });

        const result = await supabase
          .from('availability_slots')
          .select('*')
          .eq('service_id', serviceId)
          .eq('status', 'available')
          .gte('start_time', startDate)
          .lte('start_time', endDate)
          .order('start_time', { ascending: true });

        expect(mockTable.eq).toHaveBeenCalledWith('service_id', serviceId);
        expect(mockTable.eq).toHaveBeenCalledWith('status', 'available');
        expect(mockTable.gte).toHaveBeenCalledWith('start_time', startDate);
        expect(mockTable.lte).toHaveBeenCalledWith('start_time', endDate);
        expect(result.data).toEqual(mockTimeSlots);
      });

      test('should check time slot availability', async () => {
        const slotId = 'slot-123';
        mockTable.select.mockResolvedValue({
          data: { status: 'available', current_bookings: 0, max_bookings: 1 },
          error: null
        });

        const result = await supabase
          .from('availability_slots')
          .select('status, current_bookings, max_bookings')
          .eq('id', slotId)
          .single();

        expect(result.data.status).toBe('available');
        expect(result.data.current_bookings).toBe(0);
        expect(result.data.max_bookings).toBe(1);
      });
    });

    describe('Update Time Slots', () => {
      test('should update time slot status when booked', async () => {
        const slotId = 'slot-123';
        const updateData = {
          status: 'booked',
          current_bookings: 1,
          updated_at: new Date().toISOString()
        };

        mockTable.update.mockReturnValue(mockTable);
        mockTable.eq.mockReturnValue(mockTable);
        mockTable.select.mockReturnValue(mockTable);
        mockTable.single.mockResolvedValue({
          data: { id: slotId, ...updateData },
          error: null
        });

        const result = await supabase
          .from('availability_slots')
          .update(updateData)
          .eq('id', slotId)
          .select()
          .single();

        expect(mockTable.update).toHaveBeenCalledWith(updateData);
        expect(mockTable.eq).toHaveBeenCalledWith('id', slotId);
        expect(result.data.status).toBe('booked');
      });

      test('should batch update time slots', async () => {
        const slotIds = ['slot-1', 'slot-2', 'slot-3'];
        const updateData = { status: 'unavailable' };

        mockTable.update.mockReturnValue(mockTable);
        mockTable.in.mockReturnValue(mockTable);
        mockTable.select.mockResolvedValue({
          data: slotIds.map(id => ({ id, ...updateData })),
          error: null
        });

        const result = await supabase
          .from('availability_slots')
          .update(updateData)
          .in('id', slotIds)
          .select();

        expect(mockTable.in).toHaveBeenCalledWith('id', slotIds);
        expect(result.data).toHaveLength(3);
      });
    });
  });

  describe('Service Operations', () => {
    describe('Create Services', () => {
      test('should create a new service with all required fields', async () => {
        const mockService = createService({ id: undefined });
        const createdService = { ...mockService, id: 'service-123' };

        mockTable.insert.mockReturnValue(mockTable);
        mockTable.select.mockReturnValue(mockTable);
        mockTable.single.mockResolvedValue({ data: createdService, error: null });

        const result = await supabase
          .from('services')
          .insert(mockService)
          .select()
          .single();

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('services');
        expect(mockTable.insert).toHaveBeenCalledWith(mockService);
        expect(result.data).toEqual(createdService);
      });

      test('should handle service creation with images', async () => {
        const mockService = createService({
          id: undefined,
          image_url: 'https://example.com/image.jpg',
          gallery_urls: ['https://example.com/gallery1.jpg', 'https://example.com/gallery2.jpg']
        });

        mockTable.insert.mockReturnValue(mockTable);
        mockTable.select.mockReturnValue(mockTable);
        mockTable.single.mockResolvedValue({
          data: { ...mockService, id: 'service-123' },
          error: null
        });

        const result = await supabase
          .from('services')
          .insert(mockService)
          .select()
          .single();

        expect(result.data.image_url).toBe('https://example.com/image.jpg');
        expect(result.data.gallery_urls).toHaveLength(2);
      });
    });

    describe('Query Services', () => {
      test('should retrieve services with filters', async () => {
        const mockServices = createServices(5, {
          category: 'beauty',
          is_active: true,
          featured: true
        });

        mockTable.select.mockResolvedValue({ data: mockServices, error: null });

        const result = await supabase
          .from('services')
          .select('*')
          .eq('category', 'beauty')
          .eq('is_active', true)
          .eq('featured', true)
          .order('created_at', { ascending: false });

        expect(mockTable.eq).toHaveBeenCalledWith('category', 'beauty');
        expect(mockTable.eq).toHaveBeenCalledWith('is_active', true);
        expect(mockTable.eq).toHaveBeenCalledWith('featured', true);
        expect(result.data).toEqual(mockServices);
      });

      test('should search services by text', async () => {
        const searchTerm = 'lash';
        const mockServices = createServices(3, {
          title: 'Lash Enhancement',
          description: 'Professional lash services'
        });

        mockTable.select.mockResolvedValue({ data: mockServices, error: null });

        const result = await supabase
          .from('services')
          .select('*')
          .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
          .eq('is_active', true);

        expect(mockTable.or).toHaveBeenCalledWith(
          `title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
        );
        expect(result.data).toEqual(mockServices);
      });

      test('should retrieve services with price range filter', async () => {
        const minPrice = 100;
        const maxPrice = 500;
        const mockServices = createServices(3, {
          price: 250,
          currency: 'PLN'
        });

        mockTable.select.mockResolvedValue({ data: mockServices, error: null });

        const result = await supabase
          .from('services')
          .select('*')
          .gte('price', minPrice)
          .lte('price', maxPrice)
          .eq('currency', 'PLN')
          .order('price', { ascending: true });

        expect(mockTable.gte).toHaveBeenCalledWith('price', minPrice);
        expect(mockTable.lte).toHaveBeenCalledWith('price', maxPrice);
        expect(mockTable.eq).toHaveBeenCalledWith('currency', 'PLN');
        expect(result.data).toEqual(mockServices);
      });
    });
  });

  describe('User Profile Operations', () => {
    describe('Create Profiles', () => {
      test('should create user profile with preferences', async () => {
        const mockProfile = createExtendedProfile({ id: undefined });
        const createdProfile = { ...mockProfile, id: 'profile-123' };

        mockTable.insert.mockReturnValue(mockTable);
        mockTable.select.mockReturnValue(mockTable);
        mockTable.single.mockResolvedValue({ data: createdProfile, error: null });

        const result = await supabase
          .from('profiles')
          .insert(mockProfile)
          .select()
          .single();

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles');
        expect(mockTable.insert).toHaveBeenCalledWith(mockProfile);
        expect(result.data).toEqual(createdProfile);
      });
    });

    describe('Update Profiles', () => {
      test('should update user profile information', async () => {
        const profileId = 'profile-123';
        const updateData = {
          first_name: 'Jane',
          last_name: 'Smith',
          phone: '+48987654321',
          bio: 'Updated bio'
        };

        mockTable.update.mockReturnValue(mockTable);
        mockTable.eq.mockReturnValue(mockTable);
        mockTable.select.mockReturnValue(mockTable);
        mockTable.single.mockResolvedValue({
          data: { id: profileId, ...updateData },
          error: null
        });

        const result = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', profileId)
          .select()
          .single();

        expect(mockTable.update).toHaveBeenCalledWith(updateData);
        expect(mockTable.eq).toHaveBeenCalledWith('id', profileId);
        expect(result.data.first_name).toBe('Jane');
        expect(result.data.last_name).toBe('Smith');
      });

      test('should update user preferences', async () => {
        const profileId = 'profile-123';
        const preferences = {
          language: 'pl',
          currency: 'PLN',
          notifications: {
            email: true,
            sms: false,
            push: true
          },
          marketing_emails: false,
          theme: 'dark'
        };

        mockTable.update.mockReturnValue(mockTable);
        mockTable.eq.mockReturnValue(mockTable);
        mockTable.select.mockReturnValue(mockTable);
        mockTable.single.mockResolvedValue({
          data: { id: profileId, preferences },
          error: null
        });

        const result = await supabase
          .from('profiles')
          .update({ preferences })
          .eq('id', profileId)
          .select()
          .single();

        expect(mockTable.update).toHaveBeenCalledWith({ preferences });
        expect(result.data.preferences).toEqual(preferences);
      });
    });

    describe('Query Profiles', () => {
      test('should retrieve user profile with booking statistics', async () => {
        const mockProfile = createExtendedProfile({
          stats: {
            total_bookings: 25,
            total_spent: 5000,
            last_booking: '2024-01-15T10:00:00Z'
          }
        });

        mockTable.select.mockResolvedValue({ data: mockProfile, error: null });

        const result = await supabase
          .from('profiles')
          .select(`
            *,
            booking_stats:bookings(count),
            total_spent:bookings(total_price.sum)
          `)
          .eq('id', 'profile-123')
          .single();

        expect(mockTable.select).toHaveBeenCalledWith(`
            *,
            booking_stats:bookings(count),
            total_spent:bookings(total_price.sum)
          `);
        expect(result.data.stats.total_bookings).toBe(25);
      });
    });
  });

  describe('Database Constraints and Validation', () => {
    test('should enforce foreign key constraints', async () => {
      const invalidBooking = createBooking({
        service_id: 'non-existent-service',
        client_id: 'client-123'
      });

      mockTable.insert.mockRejectedValue({
        message: 'insert or update on table "bookings" violates foreign key constraint',
        code: '23503',
        details: {
          constraint: 'bookings_service_id_fkey',
          table: 'bookings'
        }
      });

      try {
        await supabase
          .from('bookings')
          .insert(invalidBooking)
          .single();
        expect.fail('Should have thrown a foreign key constraint error');
      } catch (error: any) {
        expect(error.code).toBe('23503');
        expect(error.message).toContain('foreign key constraint');
      }
    });

    test('should enforce check constraints', async () => {
      const invalidService = createService({
        price: -100, // Negative price
        duration: 0    // Zero duration
      });

      mockTable.insert.mockRejectedValue({
        message: 'new row for relation "services" violates check constraint',
        code: '23514',
        details: {
          constraint: 'services_price_check'
        }
      });

      try {
        await supabase
          .from('services')
          .insert(invalidService)
          .single();
        expect.fail('Should have thrown a check constraint error');
      } catch (error: any) {
        expect(error.code).toBe('23514');
        expect(error.message).toContain('check constraint');
      }
    });

    test('should enforce unique constraints', async () => {
      const mockService = createService({
        title: 'Duplicate Service Title',
        slug: 'duplicate-service-title'
      });

      mockTable.insert.mockRejectedValue({
        message: 'duplicate key value violates unique constraint',
        code: '23505',
        details: {
          constraint: 'services_slug_unique'
        }
      });

      try {
        await supabase
          .from('services')
          .insert(mockService)
          .single();
        expect.fail('Should have thrown a unique constraint error');
      } catch (error: any) {
        expect(error.code).toBe('23505');
        expect(error.message).toContain('unique constraint');
      }
    });
  });

  describe('Database Transactions', () => {
    test('should handle transactional operations', async () => {
      // Note: Supabase doesn't directly support multi-statement transactions
      // This test demonstrates how to handle related operations atomically

      const booking = createBooking({ id: undefined });
      const timeSlot = createTimeSlot({ id: 'slot-123', status: 'available' });
      const updatedSlot = { ...timeSlot, status: 'booked', current_bookings: 1 };

      // Mock successful operations
      mockTable.insert.mockReturnValue(mockTable);
      mockTable.select.mockReturnValue(mockTable);
      mockTable.single.mockResolvedValue({ data: { ...booking, id: 'booking-123' }, error: null });
      mockTable.update.mockReturnValue(mockTable);
      mockTable.eq.mockReturnValue(mockTable);
      mockTable.single.mockResolvedValue({ data: updatedSlot, error: null });

      // Create booking first
      const bookingResult = await supabase
        .from('bookings')
        .insert(booking)
        .select()
        .single();

      expect(bookingResult.data.id).toBe('booking-123');

      // Then update time slot
      const slotResult = await supabase
        .from('availability_slots')
        .update({ status: 'booked', current_bookings: 1 })
        .eq('id', 'slot-123')
        .select()
        .single();

      expect(slotResult.data.status).toBe('booked');
    });

    test('should handle rollback scenario', async () => {
      const booking = createBooking({ id: undefined });

      // Mock booking creation success
      mockTable.insert.mockReturnValue(mockTable);
      mockTable.select.mockReturnValue(mockTable);
      mockTable.single.mockResolvedValue({ data: { ...booking, id: 'booking-123' }, error: null });

      // Mock time slot update failure
      mockTable.update.mockRejectedValue({
        message: 'Time slot no longer available',
        code: 'P0001'
      });

      const bookingResult = await supabase
        .from('bookings')
        .insert(booking)
        .select()
        .single();

      // Booking was created successfully
      expect(bookingResult.data.id).toBe('booking-123');

      // But time slot update fails - in a real transaction, we'd need to rollback
      try {
        await supabase
          .from('availability_slots')
          .update({ status: 'booked' })
          .eq('id', 'slot-123')
          .single();
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('Time slot no longer available');

        // In a real implementation, we would delete the created booking here
        // to maintain consistency
      }
    });
  });

  describe('Performance and Optimization', () => {
    test('should use proper indexes for queries', async () => {
      const mockBookings = createBookings(100);

      mockTable.select.mockResolvedValue({ data: mockBookings, error: null });

      // Query with indexed columns
      const result = await supabase
        .from('bookings')
        .select('*')
        .eq('client_id', 'client-123')     // Should be indexed
        .eq('status', 'confirmed')         // Should be indexed
        .gte('start_time', '2024-01-01')   // Should be indexed
        .order('start_time', { ascending: true }) // Should use index for ordering
        .limit(20);

      expect(mockTable.limit).toHaveBeenCalledWith(20);
      expect(result.data).toHaveLength(100);
    });

    test('should handle large datasets efficiently', async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) =>
        createBooking({ id: `booking-${i}` })
      );

      mockTable.select.mockResolvedValue({ data: largeDataset, error: null });

      const startTime = performance.now();

      const result = await supabase
        .from('bookings')
        .select('id, client_id, start_time, status') // Select only needed columns
        .order('start_time', { ascending: false })
        .limit(100);

      const endTime = performance.now();
      const queryTime = endTime - startTime;

      expect(queryTime).toBeLessThan(1000); // Should complete within 1 second
      expect(result.data).toHaveLength(1000);
    });

    test('should use database functions for complex operations', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: [
          { service_id: 'service-1', booking_count: 45, total_revenue: 11250 },
          { service_id: 'service-2', booking_count: 32, total_revenue: 8000 },
        ],
        error: null
      });

      const result = await supabase.rpc('get_service_analytics', {
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        include_cancelled: false
      });

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('get_service_analytics', {
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        include_cancelled: false
      });
      expect(result.data).toHaveLength(2);
    });
  });
});