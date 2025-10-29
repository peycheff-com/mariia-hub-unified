import { describe, it, expect, vi, beforeEach } from 'vitest';

import { EnhancedBooking } from '@/types/booking';
import {
  setupServiceTestMocks,
  createMockResponse,
  createMockSingleResponse,
  mockSuccessfulQuery,
  mockRpcCall,
  mockServiceQuery,
  mockSpecificQuery,
  createMockQueryChain,
  resetAllMocks,
  type MockSupabase
} from '@/test/__tests__/serviceTestHelpers';

import { groupBookingService } from '../groupBooking.service';

describe('GroupBookingService', () => {
  let mockSupabase: MockSupabase;

  beforeEach(() => {
    const mocks = setupServiceTestMocks();
    mockSupabase = mocks.mockSupabase;
    resetAllMocks();
  });

  describe('checkGroupAvailability', () => {
    it('should check availability for group booking', async () => {
      const mockService = { id: 'service-1', duration_minutes: 60, price_from: 100 };
      const mockCapacityData = { capacity: 10, allows_groups: true, max_group_size: 15, current_bookings: 0 };
      const mockAvailability = [{ available: true, remaining_capacity: 8 }];

      // Track which table is being queried
      let callCount = 0;
      mockSupabase.from.mockImplementation((table: string) => {
        callCount++;
        if (table === 'services' && callCount === 1) {
          // First call - get service
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: mockService, error: null })
                })
              })
            })
          } as any;
        } else if (table === 'availability' && callCount === 2) {
          // Second call - get capacity settings
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                contains: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: mockCapacityData, error: null })
                })
              })
            })
          } as any;
        }
        return createMockQueryChain();
      });

      // Mock RPC call
      mockRpcCall(mockSupabase, 'check_slot_availability_with_capacity', mockAvailability);

      const result = await groupBookingService.checkGroupAvailability(
        'service-1',
        new Date('2024-02-01'),
        '10:00',
        5
      );

      expect(result).toEqual({
        id: 'service-1-Thu Feb 01 2024-10:00',
        date: new Date('2024-02-01'),
        time: '10:00',
        available: true,
        location: 'studio',
        capacity: 10,
        currentBookings: 0,
        remainingCapacity: 8,
        allowsGroups: true,
        maxGroupSize: 15,
        price: 500, // 100 * 5
      });
    });

    it('should return null if service not found', async () => {
      // Mock service not found
      mockServiceQuery(mockSupabase, 'invalid-service', null, { message: 'Service not found or inactive' });

      const result = await groupBookingService.checkGroupAvailability(
        'invalid-service',
        new Date('2024-02-01'),
        '10:00',
        5
      );

      expect(result).toBeNull();
    });

    it('should return null if no availability', async () => {
      const mockService = { id: 'service-1', duration_minutes: 60 };

      // Mock service found
      mockServiceQuery(mockSupabase, 'service-1', mockService);

      // Mock RPC call with no availability
      mockRpcCall(mockSupabase, 'check_slot_availability_with_capacity', [{ available: false }]);

      const result = await groupBookingService.checkGroupAvailability(
        'service-1',
        new Date('2024-02-01'),
        '10:00',
        5
      );

      expect(result).toBeNull();
    });
  });

  describe('calculateGroupPricing', () => {
    it('should calculate pricing with group discount', async () => {
      const mockService = { price_from: 100 };
      const mockPricingData = [{
        final_price: 850,
        total_discount: 150,
        applied_rules: [{
          rule_type: 'group_discount',
          discount_percentage: 15,
          applied_amount: 150,
        }],
      }];

      // Mock service query
      mockServiceQuery(mockSupabase, 'service-1', mockService);

      // Mock RPC call - the actual function used in the service
      mockRpcCall(mockSupabase, 'calculate_dynamic_pricing', mockPricingData);

      const result = await groupBookingService.calculateGroupPricing(
        'service-1',
        new Date('2024-02-01'),
        '10:00',
        10
      );

      expect(result).toEqual({
        basePricePerPerson: 100,
        finalPrice: 850,
        discountPerPerson: 15,
        totalDiscountAmount: 150,
        totalDiscountPercentage: 15,
        appliedRules: [{
          rule_type: 'group_discount',
          discount_percentage: 15,
          applied_amount: 150,
        }],
      });
    });

    it('should return base pricing if calculation fails', async () => {
      const mockService = { price_from: 100 };

      // Mock service query
      mockServiceQuery(mockSupabase, 'service-1', mockService);

      // Mock RPC call failure - using the correct function name
      mockRpcCall(mockSupabase, 'calculate_dynamic_pricing', null, { message: 'Pricing calculation failed' });

      const result = await groupBookingService.calculateGroupPricing(
        'service-1',
        new Date('2024-02-01'),
        '10:00',
        5
      );

      expect(result).toEqual({
        basePricePerPerson: 100,
        finalPrice: 500,
        discountPerPerson: 0,
        totalDiscountAmount: 0,
        totalDiscountPercentage: 0,
        appliedRules: [],
      });
    });
  });

  describe('createGroupBooking', () => {
    it('should create group booking successfully', async () => {
      const mockBookingData: EnhancedBooking = {
        step1: {
          serviceId: 'service-1',
          serviceType: 'beauty',
          durationMinutes: 60,
          locationId: 'location-1',
          selectedAddOns: [],
          isGroupBooking: true,
          groupSize: 5,
          participants: [
            { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
            { firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' },
            { firstName: 'Bob', lastName: 'Johnson' },
            { firstName: 'Alice', lastName: 'Brown' },
            { firstName: 'Charlie', lastName: 'Davis' },
          ],
        },
        step2: {
          selectedDate: new Date('2024-02-01'),
          selectedTime: '10:00',
        },
        step3: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          whatsappConsent: true,
          marketingConsent: false,
        },
      };

      const mockGroupBooking = {
        id: 'group-booking-1',
        group_name: 'Group - Test Group',
        group_size: 5,
        status: 'pending',
      };

      const mockSingleBooking = {
        id: 'booking-1',
        group_booking_id: 'group-booking-1',
        status: 'confirmed',
      };

      // Mock service query for pricing calculation
      mockServiceQuery(mockSupabase, 'service-1', { price_from: 100 });

      // Track table calls for the main flow
      const callCount = 0;
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'services') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { price_from: 100 }, error: null })
              })
            })
          } as any;
        } else if (table === 'group_bookings') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockGroupBooking, error: null })
              })
            })
          } as any;
        } else if (table === 'bookings') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockSingleBooking, error: null })
              })
            })
          } as any;
        } else if (table === 'booking_changes') {
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null })
          } as any;
        }
        return createMockQueryChain();
      });

      // Mock pricing calculation
      mockRpcCall(mockSupabase, 'calculate_dynamic_pricing', [{
        final_price: 850,
        total_discount: 150,
        applied_rules: [],
      }]);

      const result = await groupBookingService.createGroupBooking(mockBookingData);

      expect(result).toEqual(mockGroupBooking);
      expect(mockSupabase.from).toHaveBeenCalledWith('group_bookings');
    }, 10000); // Increase timeout to 10 seconds

    it('should throw error for invalid group booking', async () => {
      const mockBookingData: EnhancedBooking = {
        step1: {
          serviceId: 'service-1',
          serviceType: 'beauty',
          durationMinutes: 60,
          locationId: 'location-1',
          selectedAddOns: [],
          isGroupBooking: false, // Not a group booking
          groupSize: 1,
        },
        step2: {
          selectedDate: new Date('2024-02-01'),
          selectedTime: '10:00',
        },
        step3: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          whatsappConsent: true,
          marketingConsent: false,
        },
      };

      await expect(groupBookingService.createGroupBooking(mockBookingData)).rejects.toThrow(
        'Invalid group booking parameters'
      );
    });
  });

  describe('updateGroupBooking', () => {
    it('should update group booking', async () => {
      const mockUpdatedBooking = {
        id: 'group-booking-1',
        group_name: 'Updated Group Name',
        group_size: 8,
        updated_at: '2024-02-01T10:00:00Z',
      };

      mockSpecificQuery(mockSupabase, 'group_bookings', mockUpdatedBooking);

      const result = await groupBookingService.updateGroupBooking('group-booking-1', {
        groupName: 'Updated Group Name',
        groupSize: 8,
      });

      expect(result).toEqual(mockUpdatedBooking);
    });

    it('should throw error on update failure', async () => {
      mockSpecificQuery(mockSupabase, 'group_bookings', null, { message: 'Update failed' });

      await expect(
        groupBookingService.updateGroupBooking('invalid-id', {})
      ).rejects.toThrow('Update failed');
    });
  });

  describe('cancelGroupBooking', () => {
    it('should cancel group booking', async () => {
      const mockGroupBooking = {
        id: 'group-booking-1',
        status: 'confirmed',
      };

      const mockBookings = [
        { id: 'booking-1' },
        { id: 'booking-2' },
      ];

      let callCount = 0;
      mockSupabase.from.mockImplementation((table: string) => {
        callCount++;
        if (table === 'group_bookings') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: { status: 'cancelled' }, error: null })
            })
          } as any;
        } else if (table === 'bookings') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockResolvedValue({ data: mockBookings, error: null })
              })
            })
          } as any;
        } else if (table === 'booking_changes') {
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null })
          } as any;
        }
        return createMockQueryChain();
      });

      // The cancel method doesn't return a value, just verify it completes
      await expect(groupBookingService.cancelGroupBooking('group-booking-1', 'Customer request')).resolves.toBeUndefined();

      expect(mockSupabase.from).toHaveBeenCalledWith('group_bookings');
      expect(mockSupabase.from).toHaveBeenCalledWith('bookings');
      expect(mockSupabase.from).toHaveBeenCalledWith('booking_changes');
    });
  });

  describe('getUserGroupBookings', () => {
    it('should get user group bookings', async () => {
      const mockGroupBookings = [
        {
          id: 'group-booking-1',
          group_name: 'Test Group',
          services: {
            id: 'service-1',
            title: 'Test Service',
            service_type: 'beauty',
            duration_minutes: 60,
          },
        },
        {
          id: 'group-booking-2',
          group_name: 'Another Group',
          services: {
            id: 'service-2',
            title: 'Another Service',
            service_type: 'fitness',
            duration_minutes: 45,
          },
        },
      ];

      mockSpecificQuery(mockSupabase, 'group_bookings', mockGroupBookings);

      const result = await groupBookingService.getUserGroupBookings('user-123');

      expect(result).toEqual(mockGroupBookings);
      expect(mockSupabase.from).toHaveBeenCalledWith('group_bookings');
    });

    it('should return empty array on error', async () => {
      mockSpecificQuery(mockSupabase, 'group_bookings', null, { message: 'Failed to fetch bookings' });

      const result = await groupBookingService.getUserGroupBookings('invalid-user');

      expect(result).toEqual([]);
    });
  });

  describe('getAvailableTimeSlotsWithCapacity', () => {
    it('should get available time slots with capacity', async () => {
      const mockService = { id: 'service-1', duration_minutes: 60 };
      const mockAvailability = [{ available: true, remaining_capacity: 8 }];
      const mockCapacityData = { capacity: 10, allows_groups: true, max_group_size: 15, current_bookings: 0 };

      // Mock service query
      mockServiceQuery(mockSupabase, 'service-1', mockService);

      // Mock availability check for the first successful slot
      let callCount = 0;
      mockSupabase.from.mockImplementation((table: string) => {
        callCount++;
        if (table === 'services') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: mockService, error: null })
                })
              })
            })
          } as any;
        } else if (table === 'availability' && callCount > 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                contains: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: mockCapacityData, error: null })
                })
              })
            })
          } as any;
        }
        return createMockQueryChain();
      });

      // Mock RPC call
      mockRpcCall(mockSupabase, 'check_slot_availability_with_capacity', mockAvailability);

      const result = await groupBookingService.getAvailableTimeSlotsWithCapacity(
        'service-1',
        new Date('2024-02-01'),
        5
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return empty array if service not found', async () => {
      // Mock service not found
      mockServiceQuery(mockSupabase, 'invalid-service', null, { message: 'Service not found or inactive' });

      const result = await groupBookingService.getAvailableTimeSlotsWithCapacity(
        'invalid-service',
        new Date('2024-02-01'),
        5
      );

      expect(result).toEqual([]);
    });
  });
});