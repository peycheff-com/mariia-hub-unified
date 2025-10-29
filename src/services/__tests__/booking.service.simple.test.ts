/**
 * Focused Test Suite for Booking Service Core Methods
 *
 * Tests actual methods that exist in booking.service.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { supabase } from '@/integrations/supabase/client';

import { bookingService, BookingService } from '../booking.service';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              single: vi.fn(),
              limit: vi.fn(),
            })),
            limit: vi.fn(() => ({
              single: vi.fn(),
            })),
          })),
          order: vi.fn(() => ({
            single: vi.fn(),
            limit: vi.fn(),
          })),
          single: vi.fn(),
          limit: vi.fn(),
        })),
        gte: vi.fn(() => ({
          lte: vi.fn(() => ({
            order: vi.fn(() => ({
              single: vi.fn(),
            })),
          })),
        })),
        order: vi.fn(() => ({
          single: vi.fn(),
          limit: vi.fn(),
        })),
        single: vi.fn(),
        limit: vi.fn(),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(),
      })),
      upsert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
    auth: {
      getUser: vi.fn(),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        getPublicUrl: vi.fn(),
      })),
    },
  },
}));

describe('BookingService - Core Functionality', () => {
  let service: BookingService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = BookingService.getInstance();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = BookingService.getInstance();
      const instance2 = BookingService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('checkAvailability', () => {
    it('should return available time slots for a service', async () => {
      const mockSlots = [
        {
          id: 'slot-1',
          start_time: '2024-01-15T10:00:00Z',
          end_time: '2024-01-15T11:00:00Z',
          service_id: 'service-1',
          status: 'available',
        },
        {
          id: 'slot-2',
          start_time: '2024-01-15T14:00:00Z',
          end_time: '2024-01-15T15:00:00Z',
          service_id: 'service-1',
          status: 'available',
        },
      ];

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({ data: mockSlots, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
      });

      const result = await service.checkAvailability(
        'service-1',
        '2024-01-15T00:00:00Z',
        '2024-01-15T23:59:59Z'
      );

      expect(result.data).toEqual(mockSlots);
      expect(result.error).toBeNull();
      expect(supabase.from).toHaveBeenCalledWith('availability_slots');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('service_id', 'service-1');
      expect(mockEq).toHaveBeenCalledWith('status', 'available');
    });

    it('should handle database errors gracefully', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
      });

      const result = await service.checkAvailability(
        'service-1',
        '2024-01-15T00:00:00Z',
        '2024-01-15T23:59:59Z'
      );

      expect(result.data).toEqual([]);
      expect(result.error).toBeDefined();
    });

    it('should handle network errors', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockRejectedValue(new Error('Network timeout'));

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
      });

      const result = await service.checkAvailability(
        'service-1',
        '2024-01-15T00:00:00Z',
        '2024-01-15T23:59:59Z'
      );

      expect(result.data).toEqual([]);
      expect(result.error).toBeDefined();
    });
  });

  describe('holdTimeSlot', () => {
    it('should successfully hold an available time slot', async () => {
      const mockSlot = {
        id: 'slot-1',
        status: 'available',
      };

      const mockHold = {
        id: 'hold-1',
        time_slot_id: 'slot-1',
        session_id: 'session-123',
        expires_at: '2024-01-15T10:05:00Z',
        created_at: '2024-01-15T10:00:00Z',
      };

      // Mock slot availability check
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({ data: mockSlot, error: null });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'availability_slots') {
          return {
            select: mockSelect,
            eq: mockEq,
            single: mockSingle,
            update: vi.fn().mockReturnThis(),
          };
        }
        if (table === 'holds') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockHold, error: null })
              })
            })
          };
        }
        return {};
      });

      const result = await service.holdTimeSlot('slot-1', 'session-123');

      expect(result.data).toEqual(mockHold);
      expect(result.error).toBeNull();
    });

    it('should fail when slot is not available', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'Slot not found' } });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      });

      const result = await service.holdTimeSlot('slot-1', 'session-123');

      expect(result.data).toBeNull();
      expect(result.error?.message).toBe('Time slot not available');
    });
  });

  describe('createBooking', () => {
    it('should create a booking with valid data', async () => {
      const bookingData = {
        service_id: 'service-1',
        start_time: '2024-01-15T10:00:00Z',
        end_time: '2024-01-15T11:00:00Z',
        total_price: 200,
        currency: 'PLN',
        client_info: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+48 123 456 789',
        },
      };

      const mockBooking = {
        id: 'booking-1',
        client_id: 'client-1',
        service_id: 'service-1',
        start_time: '2024-01-15T10:00:00Z',
        end_time: '2024-01-15T11:00:00Z',
        status: 'pending',
        total_price: 200,
        currency: 'PLN',
        client_info: bookingData.client_info,
        payment_status: 'pending',
        created_at: '2024-01-15T09:00:00Z',
        updated_at: '2024-01-15T09:00:00Z',
      };

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockBooking, error: null })
        })
      });

      (supabase.from as any).mockReturnValue({
        insert: mockInsert,
      });

      const result = await service.createBooking(bookingData as any);

      expect(result.data).toEqual(mockBooking);
      expect(result.error).toBeNull();
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          ...bookingData,
          status: 'pending',
          created_at: expect.any(String),
          updated_at: expect.any(String),
        })
      );
    });

    it('should handle database errors during booking creation', async () => {
      const bookingData = {
        service_id: 'service-1',
        start_time: '2024-01-15T10:00:00Z',
        end_time: '2024-01-15T11:00:00Z',
        total_price: 200,
        currency: 'PLN',
        client_info: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+48 123 456 789',
        },
      };

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database constraint violation' }
          })
        })
      });

      (supabase.from as any).mockReturnValue({
        insert: mockInsert,
      });

      const result = await service.createBooking(bookingData as any);

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
    });
  });

  describe('confirmBooking', () => {
    it('should confirm a booking successfully', async () => {
      const mockBooking = {
        id: 'booking-1',
        client_id: 'client-1',
        service_id: 'service-1',
        start_time: '2024-01-15T10:00:00Z',
        end_time: '2024-01-15T11:00:00Z',
        status: 'confirmed',
        total_price: 200,
        currency: 'PLN',
        client_info: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+48 123 456 789',
        },
        payment_status: 'paid',
        payment_method: 'stripe',
        created_at: '2024-01-15T09:00:00Z',
        updated_at: '2024-01-15T09:05:00Z',
      };

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockBooking, error: null })
          })
        })
      });

      (supabase.from as any).mockReturnValue({
        update: mockUpdate,
      });

      const result = await service.confirmBooking('booking-1', 'payment-123');

      expect(result.data).toEqual(mockBooking);
      expect(result.error).toBeNull();
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'confirmed',
          payment_status: 'paid',
          payment_method: 'stripe',
          updated_at: expect.any(String),
        })
      );
    });
  });

  describe('cancelBooking', () => {
    it('should cancel a booking with reason and refund', async () => {
      const mockBooking = {
        id: 'booking-1',
        client_id: 'client-1',
        service_id: 'service-1',
        start_time: '2024-01-15T10:00:00Z',
        end_time: '2024-01-15T11:00:00Z',
        status: 'cancelled',
        total_price: 200,
        currency: 'PLN',
        client_info: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+48 123 456 789',
        },
        payment_status: 'refunded',
        refund_amount: 200,
        refund_reason: 'Client requested cancellation',
        cancellation_reason: 'Client requested cancellation',
        cancelled_at: '2024-01-15T08:00:00Z',
        created_at: '2024-01-15T09:00:00Z',
        updated_at: '2024-01-15T08:00:00Z',
      };

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockBooking, error: null })
          })
        })
      });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'bookings') {
          return { update: mockUpdate };
        }
        if (table === 'availability_slots') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn()
            })
          };
        }
        return {};
      });

      const result = await service.cancelBooking('booking-1', 'Client requested cancellation', 200);

      expect(result.data).toEqual(mockBooking);
      expect(result.error).toBeNull();
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'cancelled',
          cancellation_reason: 'Client requested cancellation',
          refund_amount: 200,
          payment_status: 'refunded',
          cancelled_at: expect.any(String),
          updated_at: expect.any(String),
        })
      );
    });
  });

  describe('getUserBookingsWithFilters', () => {
    it('should get user bookings with filters', async () => {
      const mockBookings = [
        {
          id: 'booking-1',
          service_id: 'service-1',
          status: 'confirmed',
          services: {
            id: 'service-1',
            title: 'Beauty Treatment',
            slug: 'beauty-treatment',
            service_type: 'beauty',
            duration_minutes: 60,
          },
        },
      ];

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({ data: mockBookings, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
      });

      const result = await service.getUserBookingsWithFilters('user-1', {
        status: 'confirmed',
        service_id: 'service-1',
      });

      expect(result.data).toEqual(mockBookings);
      expect(result.error).toBeNull();
    });
  });

  describe('cleanupExpired', () => {
    it('should clean up expired holds and drafts', async () => {
      const mockExpiredHolds = [
        { id: 'hold-1', time_slot_id: 'slot-1' },
        { id: 'hold-2', time_slot_id: 'slot-2' },
      ];

      const mockSelect = vi.fn().mockReturnThis();
      const mockLt = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: mockExpiredHolds, error: null })
      });
      const mockUpdate = vi.fn().mockReturnThis();
      const mockDelete = vi.fn().mockReturnValue({
        lt: vi.fn().mockResolvedValue({ error: null })
      });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'holds') {
          return {
            select: mockSelect,
            lt: mockLt,
            delete: mockDelete,
          };
        }
        if (table === 'availability_slots') {
          return {
            update: mockUpdate,
            in: vi.fn(),
          };
        }
        if (table === 'booking_drafts') {
          return {
            delete: mockDelete,
          };
        }
        return {};
      });

      const result = await service.cleanupExpired();

      expect(result.error).toBeNull();
    });

    it('should handle cleanup errors gracefully', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockLt = vi.fn().mockRejectedValue(new Error('Database error'));

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
        lt: mockLt,
      });

      const result = await service.cleanupExpired();

      expect(result.error).toBeDefined();
    });
  });
});