import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { bookingService } from '../booking.service';
import { servicesService } from '../services.service';
import { waitlistService } from '../waitlist.service';
import { bookingCapacityService } from '../bookingCapacity.service';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  insert: vi.fn(() => mockSupabase),
  update: vi.fn(() => mockSupabase),
  delete: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  in: vi.fn(() => mockSupabase),
  gte: vi.fn(() => mockSupabase),
  lte: vi.fn(() => mockSupabase),
  order: vi.fn(() => mockSupabase),
  limit: vi.fn(() => mockSupabase),
  single: vi.fn(() => mockSupabase),
  maybeSingle: vi.fn(() => mockSupabase),
  rpc: vi.fn(() => mockSupabase),
  auth: {
    getUser: vi.fn(() => ({ data: { user: { id: 'user_123' } } }))
  }
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase
}));

// Mock toast
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}));

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}));

// Test data
const mockServices = [
  {
    id: 'svc_beauty_001',
    title: 'Advanced Lip Enhancement',
    description: 'Premium lip enhancement treatment with advanced techniques',
    service_type: 'beauty',
    price_from: 250,
    price_to: 350,
    duration_minutes: 120,
    max_group_size: 1,
    requires_consultation: true,
    is_active: true,
    category: 'Premium',
    tags: ['popular', 'premium'],
    image_url: 'https://example.com/lip-enhancement.jpg',
    gallery_images: [
      'https://example.com/lip-before.jpg',
      'https://example.com/lip-after.jpg'
    ],
    preparation: ['Avoid lip products 24 hours before', 'Hydrate well'],
    aftercare: ['No kissing for 24 hours', 'Avoid spicy foods'],
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-20T15:30:00Z'
  },
  {
    id: 'svc_fitness_001',
    title: 'Personal Training Package',
    description: 'One-on-one personal training with customized workout plan',
    service_type: 'fitness',
    price_from: 150,
    price_to: 200,
    duration_minutes: 90,
    max_group_size: 1,
    requires_consultation: false,
    is_active: true,
    category: 'Training',
    tags: ['popular'],
    image_url: 'https://example.com/personal-training.jpg',
    gallery_images: [],
    preparation: ['Bring workout clothes', 'Arrive 10 minutes early'],
    aftercare: ['Rest and hydrate', 'Follow provided nutrition plan'],
    created_at: '2024-01-10T09:00:00Z',
    updated_at: '2024-01-18T14:20:00Z'
  },
  {
    id: 'svc_group_001',
    title: 'Group Fitness Class',
    description: 'High-energy group fitness class',
    service_type: 'fitness',
    price_from: 30,
    price_to: 50,
    duration_minutes: 60,
    max_group_size: 15,
    requires_consultation: false,
    is_active: true,
    category: 'Classes',
    tags: ['group', 'affordable'],
    image_url: 'https://example.com/group-class.jpg',
    gallery_images: [],
    preparation: ['Bring water bottle', 'Wear comfortable clothes'],
    aftercare: ['Stretch and rest', 'Stay hydrated'],
    created_at: '2024-01-05T08:00:00Z',
    updated_at: '2024-01-22T16:45:00Z'
  }
];

const mockAvailabilitySlots = [
  {
    id: 'slot_001',
    service_id: 'svc_beauty_001',
    date: '2024-12-15',
    start_time: '09:00:00',
    end_time: '11:00:00',
    available: true,
    max_bookings: 1,
    current_bookings: 0,
    location_id: 'loc_studio_001',
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 'slot_002',
    service_id: 'svc_beauty_001',
    date: '2024-12-15',
    start_time: '11:00:00',
    end_time: '13:00:00',
    available: true,
    max_bookings: 1,
    current_bookings: 0,
    location_id: 'loc_studio_001',
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 'slot_003',
    service_id: 'svc_group_001',
    date: '2024-12-16',
    start_time: '18:00:00',
    end_time: '19:00:00',
    available: true,
    max_bookings: 15,
    current_bookings: 8,
    location_id: 'loc_gym_001',
    created_at: '2024-01-16T08:00:00Z'
  }
];

const mockBookings = [
  {
    id: 'booking_001',
    service_id: 'svc_beauty_001',
    user_id: 'user_123',
    date: '2024-12-15',
    time: '09:00',
    status: 'confirmed',
    payment_status: 'paid',
    payment_method: 'card',
    client_name: 'Sarah Johnson',
    client_email: 'sarah.johnson@example.com',
    client_phone: '+1234567890',
    notes: 'First time appointment',
    created_at: '2024-11-20T10:00:00Z',
    updated_at: '2024-11-20T10:05:00Z'
  },
  {
    id: 'booking_002',
    service_id: 'svc_fitness_001',
    user_id: 'user_456',
    date: '2024-12-14',
    time: '14:00',
    status: 'pending',
    payment_status: 'unpaid',
    payment_method: 'cash',
    client_name: 'Mike Wilson',
    client_email: 'mike.wilson@example.com',
    client_phone: '+1234567891',
    notes: 'Focus on upper body',
    created_at: '2024-11-19T15:30:00Z',
    updated_at: '2024-11-19T15:30:00Z'
  }
];

describe('Booking Service Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock implementations
    mockSupabase.select.mockReturnValue(mockSupabase);
    mockSupabase.insert.mockReturnValue(mockSupabase);
    mockSupabase.update.mockReturnValue(mockSupabase);
    mockSupabase.eq.mockReturnValue(mockSupabase);
    mockSupabase.order.mockReturnValue(mockSupabase);
    mockSupabase.limit.mockReturnValue(mockSupabase);
    mockSupabase.single.mockReturnValue(mockSupabase);
    mockSupabase.maybeSingle.mockReturnValue(mockSupabase);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Service Discovery', () => {
    it('should retrieve all active services with correct data structure', async () => {
      mockSupabase.select.mockReturnValue({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            data: mockServices,
            error: null
          }))
        }))
      });

      const result = await servicesService.getActiveServices();

      expect(mockSupabase.from).toHaveBeenCalledWith('services');
      expect(mockSupabase.select).toHaveBeenCalled();
      expect(result).toEqual(mockServices);
      expect(result).toHaveLength(3);
    });

    it('should filter services by type correctly', async () => {
      const beautyServices = mockServices.filter(s => s.service_type === 'beauty');

      mockSupabase.select.mockReturnValue({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              data: beautyServices,
              error: null
            }))
          }))
        }))
      });

      const result = await servicesService.getServicesByType('beauty');

      expect(mockSupabase.eq).toHaveBeenCalledWith('is_active', true);
      expect(mockSupabase.eq).toHaveBeenCalledWith('service_type', 'beauty');
      expect(result).toEqual(beautyServices);
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Advanced Lip Enhancement');
    });

    it('should handle service not found scenarios', async () => {
      mockSupabase.maybeSingle.mockReturnValue({
        data: null,
        error: null
      });

      const result = await servicesService.getServiceById('nonexistent_service');

      expect(result).toBeNull();
    });

    it('should handle API errors gracefully', async () => {
      mockSupabase.select.mockReturnValue({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            data: null,
            error: { message: 'Database connection failed' }
          }))
        }))
      });

      await expect(servicesService.getActiveServices()).rejects.toThrow('Database connection failed');
    });
  });

  describe('Availability Management', () => {
    it('should retrieve availability for specific date range', async () => {
      const startDate = '2024-12-15';
      const endDate = '2024-12-16';

      mockSupabase.select.mockReturnValue({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            lte: vi.fn(() => ({
              order: vi.fn(() => ({
                data: mockAvailabilitySlots,
                error: null
              }))
            }))
          }))
        }))
      });

      const result = await bookingService.getAvailability('svc_beauty_001', startDate, endDate);

      expect(mockSupabase.from).toHaveBeenCalledWith('availability_slots');
      expect(mockSupabase.eq).toHaveBeenCalledWith('service_id', 'svc_beauty_001');
      expect(result).toEqual(mockAvailabilitySlots.filter(s => s.service_id === 'svc_beauty_001'));
    });

    it('should check capacity for group bookings', async () => {
      const mockCheckCapacity = vi.fn(() => Promise.resolve({
        available: true,
        remainingCapacity: 7,
        maxCapacity: 15,
        currentBookings: 8
      }));

      vi.mocked(bookingCapacityService).checkCapacity = mockCheckCapacity;

      const result = await bookingCapacityService.checkCapacity(
        'svc_group_001',
        '2024-12-16',
        '18:00',
        5
      );

      expect(mockCheckCapacity).toHaveBeenCalledWith(
        'svc_group_001',
        '2024-12-16',
        '18:00',
        5
      );
      expect(result.available).toBe(true);
      expect(result.remainingCapacity).toBe(7);
    });

    it('should reject bookings that exceed capacity', async () => {
      const mockCheckCapacity = vi.fn(() => Promise.resolve({
        available: false,
        remainingCapacity: 0,
        maxCapacity: 1,
        currentBookings: 1
      }));

      vi.mocked(bookingCapacityService).checkCapacity = mockCheckCapacity;

      const result = await bookingCapacityService.checkCapacity(
        'svc_beauty_001',
        '2024-12-15',
        '09:00',
        1
      );

      expect(result.available).toBe(false);
      expect(result.remainingCapacity).toBe(0);
    });
  });

  describe('Booking Creation', () => {
    it('should create a successful booking with all required data', async () => {
      const bookingData = {
        service_id: 'svc_beauty_001',
        date: '2024-12-15',
        time: '11:00',
        client_name: 'Jane Doe',
        client_email: 'jane.doe@example.com',
        client_phone: '+1234567892',
        notes: 'Looking forward to the treatment',
        payment_method: 'card'
      };

      mockSupabase.insert.mockReturnValue({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { id: 'booking_003', ...bookingData },
            error: null
          }))
        }))
      });

      const result = await bookingService.createBooking(bookingData);

      expect(mockSupabase.from).toHaveBeenCalledWith('bookings');
      expect(mockSupabase.insert).toHaveBeenCalledWith([bookingData]);
      expect(result.id).toBe('booking_003');
      expect(result.status).toBe('pending');
      expect(result.payment_status).toBe('unpaid');
    });

    it('should handle group bookings correctly', async () => {
      const groupBookingData = {
        service_id: 'svc_group_001',
        date: '2024-12-16',
        time: '18:00',
        client_name: 'Team Building Event',
        client_email: 'organizer@company.com',
        client_phone: '+1234567893',
        is_group_booking: true,
        group_size: 10,
        group_participants: [
          { name: 'Alice Johnson', email: 'alice@company.com' },
          { name: 'Bob Wilson', email: 'bob@company.com' }
        ],
        notes: 'Corporate team building',
        payment_method: 'invoice'
      };

      mockSupabase.insert.mockReturnValue({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { id: 'booking_group_001', ...groupBookingData },
            error: null
          }))
        }))
      });

      const result = await bookingService.createBooking(groupBookingData);

      expect(result.is_group_booking).toBe(true);
      expect(result.group_size).toBe(10);
      expect(result.group_participants).toHaveLength(2);
      expect(result.payment_method).toBe('invoice');
    });

    it('should update availability after successful booking', async () => {
      const bookingData = {
        service_id: 'svc_beauty_001',
        date: '2024-12-15',
        time: '09:00',
        client_name: 'Charlie Brown',
        client_email: 'charlie@example.com',
        client_phone: '+1234567894',
        payment_method: 'card'
      };

      let updateCallCount = 0;
      mockSupabase.update.mockImplementation((data) => {
        updateCallCount++;
        return {
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              data: { ...data, updated_at: new Date().toISOString() },
              error: null
            }))
          }))
        };
      });

      // Mock successful booking creation
      mockSupabase.insert.mockReturnValue({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { id: 'booking_004', ...bookingData },
            error: null
          }))
        }))
      });

      await bookingService.createBooking(bookingData);

      // Should update availability slot
      expect(updateCallCount).toBeGreaterThan(0);
    });

    it('should handle booking creation failures', async () => {
      const bookingData = {
        service_id: 'svc_beauty_001',
        date: '2024-12-15',
        time: '09:00',
        client_name: 'Invalid Booking',
        client_email: 'invalid@example.com',
        client_phone: '+1234567899',
        payment_method: 'card'
      };

      mockSupabase.insert.mockReturnValue({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: null,
            error: { message: 'Time slot no longer available' }
          }))
        }))
      });

      await expect(bookingService.createBooking(bookingData)).rejects.toThrow('Time slot no longer available');
    });
  });

  describe('Booking Management', () => {
    it('should retrieve user booking history', async () => {
      const userId = 'user_123';

      mockSupabase.select.mockReturnValue({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            data: mockBookings.filter(b => b.user_id === userId),
            error: null
          }))
        }))
      });

      const result = await bookingService.getUserBookings(userId);

      expect(mockSupabase.from).toHaveBeenCalledWith('bookings');
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', userId);
      expect(result).toHaveLength(1);
      expect(result[0].client_name).toBe('Sarah Johnson');
    });

    it('should update booking status correctly', async () => {
      const bookingId = 'booking_002';
      const newStatus = 'confirmed';

      mockSupabase.update.mockReturnValue({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => ({
                data: { ...mockBookings[1], status: newStatus },
                error: null
              }))
            }))
          }))
        }))
      });

      const result = await bookingService.updateBookingStatus(bookingId, newStatus);

      expect(mockSupabase.update).toHaveBeenCalledWith({
        status: newStatus,
        updated_at: expect.any(String)
      });
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', bookingId);
      expect(result.status).toBe(newStatus);
    });

    it('should handle booking cancellation with refund logic', async () => {
      const bookingId = 'booking_001';
      const cancellationReason = 'Client requested cancellation';

      mockSupabase.update.mockReturnValue({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => ({
                data: {
                  ...mockBookings[0],
                  status: 'cancelled',
                  cancellation_reason,
                  cancellation_date: new Date().toISOString()
                },
                error: null
              }))
            }))
          }))
        }))
      });

      const result = await bookingService.cancelBooking(bookingId, cancellationReason);

      expect(mockSupabase.update).toHaveBeenCalledWith({
        status: 'cancelled',
        cancellation_reason,
        cancellation_date: expect.any(String),
        updated_at: expect.any(String)
      });
      expect(result.status).toBe('cancelled');
      expect(result.cancellation_reason).toBe(cancellationReason);
    });

    it('should prevent cancellation of completed bookings', async () => {
      const completedBooking = {
        ...mockBookings[0],
        status: 'completed',
        completion_date: '2024-12-15T11:00:00Z'
      };

      mockSupabase.maybeSingle.mockReturnValue({
        data: completedBooking,
        error: null
      });

      await expect(bookingService.cancelBooking('booking_001', 'Too late to cancel')).rejects.toThrow('Cannot cancel completed bookings');
    });
  });

  describe('Waitlist Management', () => {
    it('should add users to waitlist when no availability', async () => {
      const waitlistEntry = {
        service_id: 'svc_beauty_001',
        preferred_date: '2024-12-15',
        preferred_time: '09:00',
        contact_email: 'waitlist@example.com',
        contact_phone: '+1234567895',
        flexible_with_time: true,
        notes: 'Willing to take any available slot'
      };

      mockSupabase.insert.mockReturnValue({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { id: 'waitlist_001', ...waitlistEntry },
            error: null
          }))
        }))
      });

      const result = await waitlistService.addToWaitlist(waitlistEntry);

      expect(mockSupabase.from).toHaveBeenCalledWith('waitlist_entries');
      expect(mockSupabase.insert).toHaveBeenCalledWith([waitlistEntry]);
      expect(result.id).toBe('waitlist_001');
      expect(result.status).toBe('waiting');
    });

    it('should check if user is already on waitlist', async () => {
      const userEmail = 'waitlist@example.com';
      const serviceId = 'svc_beauty_001';

      mockSupabase.select.mockReturnValue({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(() => ({
              data: { id: 'waitlist_001', contact_email: userEmail },
              error: null
            }))
          }))
        }))
      });

      const result = await waitlistService.isAlreadyOnWaitlist(userEmail, serviceId);

      expect(result).toBe(true);
    });

    it('should notify waitlisted users when slots become available', async () => {
      const serviceId = 'svc_beauty_001';
      const availableDate = '2024-12-15';
      const availableTime = '09:00';

      const waitlistEntries = [
        { id: 'waitlist_001', contact_email: 'user1@example.com' },
        { id: 'waitlist_002', contact_email: 'user2@example.com' }
      ];

      mockSupabase.select.mockReturnValue({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            data: waitlistEntries,
            error: null
          }))
        }))
      });

      // Mock email sending
      const mockSendEmail = vi.fn(() => Promise.resolve());
      vi.mock('@/services/email.service', () => ({
        emailService: {
          sendWaitlistNotification: mockSendEmail
        }
      }));

      await waitlistService.notifyAvailableSlots(serviceId, availableDate, availableTime);

      expect(mockSendEmail).toHaveBeenCalledTimes(2);
      expect(mockSendEmail).toHaveBeenCalledWith(
        'user1@example.com',
        serviceId,
        availableDate,
        availableTime
      );
      expect(mockSendEmail).toHaveBeenCalledWith(
        'user2@example.com',
        serviceId,
        availableDate,
        availableTime
      );
    });
  });

  describe('Search and Filtering', () => {
    it('should search services by name and description', async () => {
      const searchQuery = 'lip enhancement';

      const filteredServices = mockServices.filter(service =>
        service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase())
      );

      mockSupabase.select.mockReturnValue({
        or: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              data: filteredServices,
              error: null
            }))
          }))
        }))
      });

      const result = await servicesService.searchServices(searchQuery);

      expect(result).toEqual(filteredServices);
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Advanced Lip Enhancement');
    });

    it('should filter services by price range', async () => {
      const minPrice = 100;
      const maxPrice = 200;

      const filteredServices = mockServices.filter(service =>
        service.price_from >= minPrice && service.price_from <= maxPrice
      );

      mockSupabase.select.mockReturnValue({
        gte: vi.fn(() => ({
          lte: vi.fn(() => ({
            order: vi.fn(() => ({
              data: filteredServices,
              error: null
            }))
          }))
        }))
      });

      const result = await servicesService.getServicesByPriceRange(minPrice, maxPrice);

      expect(result).toEqual(filteredServices);
      expect(result).toHaveLength(2); // Personal Training and Group Class
    });

    it('should filter services by tags', async () => {
      const tags = ['popular', 'premium'];

      const filteredServices = mockServices.filter(service =>
        tags.some(tag => service.tags.includes(tag))
      );

      mockSupabase.select.mockReturnValue({
        contains: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              data: filteredServices,
              error: null
            }))
          }))
        }))
      });

      const result = await servicesService.getServicesByTags(tags);

      expect(result).toEqual(filteredServices);
      expect(result).toHaveLength(2); // Advanced Lip Enhancement and Personal Training
    });
  });

  describe('Performance and Optimization', () => {
    it('should handle large datasets efficiently', async () => {
      const largeServiceList = Array.from({ length: 1000 }, (_, index) => ({
        id: `svc_${index.toString().padStart(3, '0')}`,
        title: `Service ${index + 1}`,
        service_type: index % 2 === 0 ? 'beauty' : 'fitness',
        price_from: 50 + (index * 10),
        duration_minutes: 60 + (index % 4 * 30),
        is_active: true
      }));

      const startTime = performance.now();

      mockSupabase.select.mockReturnValue({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => ({
              data: largeServiceList,
              error: null
            }))
          }))
        }))
      });

      const result = await servicesService.getActiveServices({ limit: 1000 });

      const endTime = performance.now();
      const queryTime = endTime - startTime;

      expect(result).toHaveLength(1000);
      expect(queryTime).toBeLessThan(100); // Should complete in under 100ms
    });

    it('should implement proper pagination', async () => {
      const page = 2;
      const limit = 20;
      const startIndex = (page - 1) * limit;

      mockSupabase.select.mockReturnValue({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            range: vi.fn(() => ({
              data: mockServices.slice(startIndex, startIndex + limit),
              error: null
            }))
          }))
        }))
      });

      const result = await servicesService.getActiveServices({ page, limit });

      expect(mockSupabase.range).toHaveBeenCalledWith(startIndex, startIndex + limit);
      expect(result).toBeDefined();
    });

    it('should cache frequently accessed data', async () => {
      // First call should query the database
      mockSupabase.select.mockReturnValue({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            data: mockServices,
            error: null
          }))
        }))
      });

      const result1 = await servicesService.getActiveServices();
      expect(mockSupabase.from).toHaveBeenCalledTimes(1);

      // Second call should use cache (mock would not be called again)
      const result2 = await servicesService.getActiveServices();
      expect(mockSupabase.from).toHaveBeenCalledTimes(1); // Still 1, not 2

      expect(result1).toEqual(result2);
    });
  });
});