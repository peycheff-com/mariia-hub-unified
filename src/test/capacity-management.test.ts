import { describe, it, expect, beforeEach, vi } from 'vitest';

import { BookingCapacityService } from '@/services/bookingCapacity.service';

describe('Capacity Management', () => {
  let service: BookingCapacityService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = BookingCapacityService.getInstance();
  });

  it('should instantiate the service', () => {
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(BookingCapacityService);
  });

  it('should be a singleton', () => {
    const service2 = BookingCapacityService.getInstance();
    expect(service).toBe(service2);
  });

  describe('checkAvailabilityCapacity', () => {
    it('should return a result object', async () => {
      // Mock the RPC call
      const { supabase } = await import('@/integrations/supabase/client');
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: [{
          available: true,
          remaining_capacity: 2,
          total_capacity: 3,
          conflict_reason: null
        }],
        error: null,
      });

      const result = await service.checkAvailabilityCapacity(
        'service1',
        '2025-01-25T09:00:00Z',
        '2025-01-25T10:00:00Z',
        1
      );

      expect(result).toBeDefined();
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('error');
    });
  });
});