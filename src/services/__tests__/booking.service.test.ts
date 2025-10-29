/**
 * Comprehensive Test Suite for Booking Service
 *
 * Tests cover critical business logic including:
 * - Time slot management and availability checking
 * - Booking creation, confirmation, and cancellation
 * - Polish phone number validation
 * - Location compatibility for beauty/fitness services
 * - Booking status transitions
 * - Hold management and draft persistence
 * - User portal functionality
 * - Error handling and edge cases
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { bookingService, BookingService } from '../booking.service';
import { bookingDomainService } from '../bookingDomainService';
import { CreateBookingRequest, TimeSlot, Booking, Hold } from '../booking.service';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
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
            limit: vi.fn(() => ({
              single: vi.fn(),
            })),
            single: vi.fn(),
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

describe('BookingService', () => {
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

  describe('Time Slot Management', () => {
    describe('checkAvailability', () => {
      it('should return available time slots for a service', async () => {
        const mockSlots: TimeSlot[] = [
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

      it('should filter by location when provided', async () => {
        const mockSelect = vi.fn().mockReturnThis();
        const mockEq = vi.fn().mockReturnThis();
        const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null });

        (supabase.from as any).mockReturnValue({
          select: mockSelect,
          eq: mockEq,
          order: mockOrder,
        });

        await service.checkAvailability(
          'service-1',
          '2024-01-15T00:00:00Z',
          '2024-01-15T23:59:59Z',
          'location-1'
        );

        expect(mockEq).toHaveBeenCalledWith('location_id', 'location-1');
      });

      it('should filter by practitioner when provided', async () => {
        const mockSelect = vi.fn().mockReturnThis();
        const mockEq = vi.fn().mockReturnThis();
        const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null });

        (supabase.from as any).mockReturnValue({
          select: mockSelect,
          eq: mockEq,
          order: mockOrder,
        });

        await service.checkAvailability(
          'service-1',
          '2024-01-15T00:00:00Z',
          '2024-01-15T23:59:59Z',
          undefined,
          'practitioner-1'
        );

        expect(mockEq).toHaveBeenCalledWith('practitioner_id', 'practitioner-1');
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
    });

    describe('holdTimeSlot', () => {
      it('should successfully hold an available time slot', async () => {
        const mockSlot = {
          id: 'slot-1',
          status: 'available',
        };

        const mockHold: Hold = {
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

      it('should rollback slot status on hold creation failure', async () => {
        const mockSlot = {
          id: 'slot-1',
          status: 'available',
        };

        const mockSelect = vi.fn().mockReturnThis();
        const mockEq = vi.fn().mockReturnThis();
        const mockSingle = vi.fn()
          .mockResolvedValueOnce({ data: mockSlot, error: null }) // Slot check
          .mockResolvedValueOnce({ data: null, error: { message: 'Hold creation failed' } }); // Hold creation

        const mockUpdate = vi.fn().mockReturnThis();

        (supabase.from as any).mockImplementation((table: string) => {
          if (table === 'availability_slots') {
            return {
              select: mockSelect,
              eq: mockEq,
              single: mockSingle,
              update: mockUpdate,
            };
          }
          if (table === 'holds') {
            return {
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: mockSingle
                })
              })
            };
          }
          return {};
        });

        const result = await service.holdTimeSlot('slot-1', 'session-123');

        expect(result.data).toBeNull();
        expect(result.error).toBeDefined();
        expect(mockUpdate).toHaveBeenCalledWith({ status: 'available', updated_at: expect.any(String) });
      });
    });

    describe('releaseTimeSlot', () => {
      it('should successfully release a held time slot', async () => {
        const mockHold: Hold = {
          id: 'hold-1',
          time_slot_id: 'slot-1',
          session_id: 'session-123',
          expires_at: '2024-01-15T10:05:00Z',
          created_at: '2024-01-15T10:00:00Z',
        };

        const mockSelect = vi.fn().mockReturnThis();
        const mockEq = vi.fn().mockReturnThis();
        const mockSingle = vi.fn().mockResolvedValue({ data: mockHold, error: null });
        const mockUpdate = vi.fn().mockReturnThis();
        const mockDelete = vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null })
        });

        (supabase.from as any).mockImplementation((table: string) => {
          if (table === 'holds') {
            return {
              select: mockSelect,
              eq: mockEq,
              single: mockSingle,
              delete: mockDelete,
            };
          }
          if (table === 'availability_slots') {
            return {
              update: mockUpdate,
              eq: mockEq,
            };
          }
          return {};
        });

        const result = await service.releaseTimeSlot('hold-1');

        expect(result.error).toBeNull();
        expect(mockUpdate).toHaveBeenCalledWith({
          status: 'available',
          updated_at: expect.any(String)
        });
        expect(mockDelete).toHaveBeenCalled();
      });

      it('should return error when hold not found', async () => {
        const mockSelect = vi.fn().mockReturnThis();
        const mockEq = vi.fn().mockReturnThis();
        const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'Hold not found' } });

        (supabase.from as any).mockReturnValue({
          select: mockSelect,
          eq: mockEq,
          single: mockSingle,
        });

        const result = await service.releaseTimeSlot('non-existent-hold');

        expect(result.error?.message).toBe('Hold not found');
      });
    });
  });

  describe('Booking Creation and Management', () => {
    describe('createBooking', () => {
      it('should create a booking with valid data', async () => {
        const bookingData: CreateBookingRequest = {
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

        const mockBooking: Booking = {
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

        const result = await service.createBooking(bookingData);

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

      it('should validate required fields', async () => {
        const invalidBookingData = {
          service_id: '', // Invalid UUID
          start_time: 'invalid-date',
          end_time: '2024-01-15T11:00:00Z',
          total_price: -100, // Invalid negative price
          currency: 'PLN',
          client_info: {
            name: '', // Required field missing
            email: 'invalid-email', // Invalid email
            phone: '123', // Too short
          },
        };

        const result = await service.createBooking(invalidBookingData as any);

        expect(result.data).toBeNull();
        expect(result.error).toBeDefined();
      });

      it('should handle database errors during booking creation', async () => {
        const bookingData: CreateBookingRequest = {
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

        const result = await service.createBooking(bookingData);

        expect(result.data).toBeNull();
        expect(result.error).toBeDefined();
      });
    });

    describe('confirmBooking', () => {
      it('should confirm a booking successfully', async () => {
        const mockBooking: Booking = {
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

      it('should confirm booking without payment', async () => {
        const mockBooking: Booking = {
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
          payment_status: 'pending',
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

        const result = await service.confirmBooking('booking-1');

        expect(result.data).toEqual(mockBooking);
        expect(result.error).toBeNull();
        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'confirmed',
            updated_at: expect.any(String),
          })
        );
        expect(mockUpdate).not.toHaveBeenCalledWith(
          expect.objectContaining({
            payment_status: expect.anything(),
          })
        );
      });

      it('should handle confirmation errors', async () => {
        const mockUpdate = vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Booking not found' }
              })
            })
          })
        });

        (supabase.from as any).mockReturnValue({
          update: mockUpdate,
        });

        const result = await service.confirmBooking('non-existent-booking');

        expect(result.data).toBeNull();
        expect(result.error).toBeDefined();
      });
    });

    describe('cancelBooking', () => {
      it('should cancel a booking with reason and refund', async () => {
        const mockBooking: Booking = {
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

      it('should cancel booking without refund', async () => {
        const mockBooking: Booking = {
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
          payment_status: 'pending',
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

        const result = await service.cancelBooking('booking-1', 'Client requested cancellation');

        expect(result.data).toEqual(mockBooking);
        expect(result.error).toBeNull();
        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'cancelled',
            cancellation_reason: 'Client requested cancellation',
            updated_at: expect.any(String),
            cancelled_at: expect.any(String),
          })
        );
        expect(mockUpdate).not.toHaveBeenCalledWith(
          expect.objectContaining({
            refund_amount: expect.anything(),
            payment_status: 'refunded',
          })
        );
      });
    });
  });

  describe('Draft Management', () => {
    describe('saveBookingDraft', () => {
      it('should save booking draft successfully', async () => {
        const draftData = {
          service_id: 'service-1',
          selected_time: '2024-01-15T10:00:00Z',
          client_info: {
            name: 'John Doe',
            email: 'john@example.com',
            phone: '+48 123 456 789',
          },
        };

        const mockDraft = {
          id: 'draft-1',
          session_id: 'session-123',
          ...draftData,
          expires_at: '2024-01-15T11:00:00Z',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z',
        };

        const mockUpsert = vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockDraft, error: null })
          })
        });

        (supabase.from as any).mockReturnValue({
          upsert: mockUpsert,
        });

        const result = await service.saveBookingDraft('session-123', draftData);

        expect(result.data).toEqual(mockDraft);
        expect(result.error).toBeNull();
        expect(mockUpsert).toHaveBeenCalledWith(
          expect.objectContaining({
            session_id: 'session-123',
            ...draftData,
            expires_at: expect.any(String),
            updated_at: expect.any(String),
          }),
          expect.objectContaining({
            onConflict: 'session_id',
            ignoreDuplicates: false,
          })
        );
      });

      it('should handle draft save errors', async () => {
        const mockUpsert = vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Draft save failed' }
            })
          })
        });

        (supabase.from as any).mockReturnValue({
          upsert: mockUpsert,
        });

        const result = await service.saveBookingDraft('session-123', {});

        expect(result.data).toBeNull();
        expect(result.error).toBeDefined();
      });
    });

    describe('getBookingDraft', () => {
      it('should retrieve existing non-expired draft', async () => {
        const mockDraft = {
          id: 'draft-1',
          session_id: 'session-123',
          service_id: 'service-1',
          expires_at: '2024-01-15T11:00:00Z', // Future expiry
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z',
        };

        const mockSelect = vi.fn().mockReturnThis();
        const mockEq = vi.fn().mockReturnThis();
        const mockSingle = vi.fn().mockResolvedValue({ data: mockDraft, error: null });

        (supabase.from as any).mockReturnValue({
          select: mockSelect,
          eq: mockEq,
          single: mockSingle,
        });

        const result = await service.getBookingDraft('session-123');

        expect(result.data).toEqual(mockDraft);
        expect(result.error).toBeNull();
      });

      it('should return error for expired draft', async () => {
        const expiredDraft = {
          id: 'draft-1',
          session_id: 'session-123',
          service_id: 'service-1',
          expires_at: '2024-01-14T10:00:00Z', // Past expiry
          created_at: '2024-01-14T09:00:00Z',
          updated_at: '2024-01-14T09:00:00Z',
        };

        const mockSelect = vi.fn().mockReturnThis();
        const mockEq = vi.fn().mockReturnThis();
        const mockSingle = vi.fn().mockResolvedValue({ data: expiredDraft, error: null });
        const mockDelete = vi.fn().mockReturnValue({
          eq: vi.fn()
        });

        (supabase.from as any).mockReturnValue({
          select: mockSelect,
          eq: mockEq,
          single: mockSingle,
          delete: mockDelete,
        });

        const result = await service.getBookingDraft('session-123');

        expect(result.data).toBeNull();
        expect(result.error?.message).toBe('Draft has expired');
        expect(mockDelete).toHaveBeenCalled();
      });

      it('should return null for non-existent draft', async () => {
        const mockSelect = vi.fn().mockReturnThis();
        const mockEq = vi.fn().mockReturnThis();
        const mockSingle = vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Draft not found' }
        });

        (supabase.from as any).mockReturnValue({
          select: mockSelect,
          eq: mockEq,
          single: mockSingle,
        });

        const result = await service.getBookingDraft('non-existent-session');

        expect(result.data).toBeNull();
        expect(result.error).toBeDefined();
      });
    });
  });

  describe('Polish Phone Number Validation', () => {
    describe('validatePolishPhoneNumber', () => {
      it('should validate correct Polish phone numbers', () => {
        // These tests will access private methods through type assertion
        const serviceAny = bookingDomainService as any;

        // Polish phone numbers must start with 5-9 after optional +48 prefix
        // and be 9 digits total after removing spaces and dashes
        expect(serviceAny['isValidPhone']('+48 512 345 678')).toBe(true);
        expect(serviceAny['isValidPhone']('+48512345678')).toBe(true);
        expect(serviceAny['isValidPhone']('48 512 345 678')).toBe(true);
        expect(serviceAny['isValidPhone']('512 345 678')).toBe(true);
        expect(serviceAny['isValidPhone']('512345678')).toBe(true);
        expect(serviceAny['isValidPhone']('+48 (512) 345 678')).toBe(true);
        expect(serviceAny['isValidPhone']('+48 512-345-678')).toBe(true);
        expect(serviceAny['isValidPhone']('612345678')).toBe(true); // 6xx numbers
        expect(serviceAny['isValidPhone']('712345678')).toBe(true); // 7xx numbers
        expect(serviceAny['isValidPhone']('812345678')).toBe(true); // 8xx numbers
        expect(serviceAny['isValidPhone']('912345678')).toBe(true); // 9xx numbers
      });

      it('should reject invalid Polish phone numbers', () => {
        const serviceAny = bookingDomainService as any;

        expect(serviceAny['isValidPhone']('+44 123 456 789')).toBe(false); // Wrong country code
        expect(serviceAny['isValidPhone']('123 45 67')).toBe(false); // Too short
        expect(serviceAny['isValidPhone']('123456789012')).toBe(false); // Too long
        expect(serviceAny['isValidPhone']('abc def ghi')).toBe(false); // Contains letters
        expect(serviceAny['isValidPhone']('')).toBe(false); // Empty
        expect(serviceAny['isValidPhone']('+48')).toBe(false); // Country code only
      });
    });
  });

  describe('Location Compatibility', () => {
    describe('validateLocationCompatibility', () => {
      it('should validate beauty service locations correctly', () => {
        const serviceAny = bookingDomainService as any;

        expect(serviceAny['validateLocationCompatibility']('beauty', 'studio')).toBe(true);
        expect(serviceAny['validateLocationCompatibility']('beauty', 'online')).toBe(true);
        expect(serviceAny['validateLocationCompatibility']('beauty', 'home')).toBe(false); // home not in rules
        expect(serviceAny['validateLocationCompatibility']('beauty', 'fitness')).toBe(false);
      });

      it('should validate fitness service locations correctly', () => {
        const serviceAny = bookingDomainService as any;

        expect(serviceAny['validateLocationCompatibility']('fitness', 'fitness')).toBe(true);
        expect(serviceAny['validateLocationCompatibility']('fitness', 'studio')).toBe(true);
        expect(serviceAny['validateLocationCompatibility']('fitness', 'online')).toBe(true);
        expect(serviceAny['validateLocationCompatibility']('fitness', 'beauty')).toBe(false);
      });

      it('should handle unknown service types', () => {
        const serviceAny = bookingDomainService as any;

        expect(serviceAny['validateLocationCompatibility']('unknown', 'studio')).toBe(false);
        expect(serviceAny['validateLocationCompatibility']('lifestyle', 'studio')).toBe(false);
      });
    });
  });

  describe('Status Transition Validation', () => {
    describe('validateStatusTransition', () => {
      it('should allow valid status transitions', () => {
        const serviceAny = bookingDomainService as any;

        expect(serviceAny['isValidStatusTransition']('draft', 'pending')).toBe(true);
        expect(serviceAny['isValidStatusTransition']('pending', 'confirmed')).toBe(true);
        expect(serviceAny['isValidStatusTransition']('confirmed', 'completed')).toBe(true);
        expect(serviceAny['isValidStatusTransition']('confirmed', 'cancelled')).toBe(true);
        expect(serviceAny['isValidStatusTransition']('pending', 'cancelled')).toBe(true);
      });

      it('should reject invalid status transitions', () => {
        const serviceAny = bookingDomainService as any;

        expect(serviceAny['isValidStatusTransition']('completed', 'pending')).toBe(false);
        expect(serviceAny['isValidStatusTransition']('cancelled', 'confirmed')).toBe(false);
        expect(serviceAny['isValidStatusTransition']('draft', 'completed')).toBe(false);
        expect(serviceAny['isValidStatusTransition']('cancelled', 'completed')).toBe(false);
        expect(serviceAny['isValidStatusTransition']('draft', 'reviewed')).toBe(false); // reviewed not in transitions
      });

      it('should handle terminal states', () => {
        const serviceAny = bookingDomainService as any;

        expect(serviceAny['isValidStatusTransition']('completed', 'confirmed')).toBe(false);
        expect(serviceAny['isValidStatusTransition']('cancelled', 'pending')).toBe(false);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network timeouts gracefully', async () => {
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

    it('should handle malformed data responses', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { invalid: 'data' }, // Missing required fields
            error: null
          })
        })
      });

      (supabase.from as any).mockReturnValue({
        insert: mockInsert,
      });

      const result = await service.createBooking({
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
      });

      // The service should still return data even if incomplete, as validation happens at insertion
      expect(result.error).toBeDefined();
    });

    it('should handle concurrent booking attempts gracefully', async () => {
      // This simulates race conditions in booking
      const mockSlot = {
        id: 'slot-1',
        status: 'available',
      };

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn()
        .mockResolvedValueOnce({ data: mockSlot, error: null }) // First call succeeds
        .mockResolvedValueOnce({ data: null, error: { message: 'Slot already booked' } }); // Second call fails

      const mockUpdate = vi.fn().mockReturnThis();

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'availability_slots') {
          return {
            select: mockSelect,
            eq: mockEq,
            single: mockSingle,
            update: mockUpdate,
          };
        }
        return {};
      });

      const [result1, result2] = await Promise.all([
        service.holdTimeSlot('slot-1', 'session-1'),
        service.holdTimeSlot('slot-1', 'session-2'),
      ]);

      expect(result1.data).toBeDefined();
      expect(result2.data).toBeNull();
      expect(result2.error?.message).toBe('Time slot not available');
    });
  });

  describe('User Portal Features', () => {
    describe('getUserDashboardStats', () => {
      it('should return user dashboard statistics', async () => {
        const mockUser = { id: 'user-1' };
        const mockProfile = { first_name: 'John' };

        // Mock auth
        (supabase.auth.getUser as any).mockResolvedValue({
          data: { user: mockUser }
        });

        // Mock profile query
        const mockProfileResult = { data: mockProfile, error: null };
        const mockCountResult = { count: 5, error: null };
        const mockNextAppointment = {
          id: 'booking-1',
          service: { name: 'Beauty Treatment', location_id: 'studio' },
          start_time: '2024-01-15T10:00:00Z',
        };

        let callCount = 0;
        (supabase.from as any).mockImplementation((table: string) => {
          if (table === 'profiles') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue(mockProfileResult)
              })
            };
          }

          // For all count queries, return consistent result
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gte: vi.fn().mockReturnValue({
                  in: vi.fn().mockReturnValue({
                    count: 'exact',
                    head: true,
                  })
                })
              })
            }),
            limit: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  gte: vi.fn().mockReturnValue({
                    in: vi.fn().mockReturnValue({
                      order: vi.fn().mockReturnValue({
                        limit: vi.fn().mockReturnValue({
                          single: vi.fn().mockResolvedValue({ data: mockNextAppointment, error: null })
                        })
                      })
                    })
                  })
                })
              })
            })
          };
        });

        // Mock the count calls properly
        const mockCount = vi.fn().mockResolvedValue({ count: 5 });
        vi.spyOn(supabase.from('bookings'), 'select').mockReturnValue({
          eq: vi.fn().mockReturnValue({
            count: 'exact',
            head: true,
          })
        } as any);

        // Test the structure - the actual implementation might be complex
        // so we'll test what we can verify
        const stats = await service.getUserDashboardStats();

        expect(stats).toHaveProperty('total_bookings');
        expect(stats).toHaveProperty('upcoming_bookings');
        expect(stats).toHaveProperty('completed_services');
        expect(stats).toHaveProperty('favorite_services');
        expect(stats).toHaveProperty('loyalty_points');
        expect(stats).toHaveProperty('user_name');
        expect(typeof stats.total_bookings).toBe('number');
        expect(typeof stats.user_name).toBe('string');
      });

      it('should handle unauthenticated users', async () => {
        (supabase.auth.getUser as any).mockResolvedValue({
          data: { user: null }
        });

        await expect(service.getUserDashboardStats()).rejects.toThrow('User not authenticated');
      });
    });
  });

  describe('Cleanup Operations', () => {
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
        expect(mockLt).toHaveBeenCalledWith('expires_at', expect.any(String));
        expect(mockUpdate).toHaveBeenCalled();
        expect(mockDelete).toHaveBeenCalledTimes(2);
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
});