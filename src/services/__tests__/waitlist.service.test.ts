import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

import { waitlistService } from '../waitlist.service';

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          in: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => ({
                single: vi.fn()
              }))
            }))
          }))
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn()
      }))
    })),
    rpc: vi.fn()
  }
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn()
  }
}));

describe('WaitlistService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('addToWaitlist', () => {
    it('should add a customer to the waitlist', async () => {
      const mockEntry = {
        id: 'test-id',
        service_id: 'service-1',
        user_id: 'user-1',
        status: 'active',
        created_at: new Date().toISOString(),
        priority_score: 50
      };

      const mockSupabaseReturn = {
        data: mockEntry,
        error: null
      };

      supabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue(mockSupabaseReturn)
          })
        })
      } as any);

      const result = await waitlistService.addToWaitlist({
        serviceId: 'service-1',
        userId: 'user-1',
        preferredDate: new Date(),
        preferredTime: '10:00',
        groupSize: 1,
        flexibleWithTime: true,
        flexibleWithLocation: false,
        contactEmail: 'test@example.com',
        autoPromoteEligible: true,
        maxPromotionAttempts: 3
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('test-id');
      expect(logger.info).toHaveBeenCalledWith('Added to waitlist', expect.any(Object));
    });

    it('should handle errors when adding to waitlist', async () => {
      const mockError = new Error('Database error');

      supabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: mockError })
          })
        })
      } as any);

      await expect(waitlistService.addToWaitlist({
        serviceId: 'service-1',
        userId: 'user-1',
        preferredDate: new Date(),
        preferredTime: '10:00',
        groupSize: 1,
        flexibleWithTime: true,
        flexibleWithLocation: false,
        contactEmail: 'test@example.com',
        autoPromoteEligible: true,
        maxPromotionAttempts: 3
      })).rejects.toThrow('Database error');

      expect(logger.error).toHaveBeenCalledWith('Error adding to waitlist:', mockError);
    });
  });

  describe('getWaitlistForService', () => {
    it('should get waitlist entries for a service', async () => {
      const mockEntries = [
        {
          id: 'test-id-1',
          service_id: 'service-1',
          status: 'active',
          created_at: new Date().toISOString(),
          services: {
            id: 'service-1',
            title: 'Test Service',
            service_type: 'beauty',
            duration_minutes: 60,
            price_from: 100
          }
        }
      ];

      const mockSupabaseReturn = {
        data: mockEntries,
        error: null
      };

      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue(mockSupabaseReturn)
              })
            })
          })
        })
      } as any);

      const result = await waitlistService.getWaitlistForService(
        'service-1',
        new Date(),
        false
      );

      expect(result).toHaveLength(1);
      expect(result[0].serviceId).toBe('service-1');
      expect(result[0].status).toBe('active');
    });

    it('should return empty array on error', async () => {
      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                order: vi.fn().mockRejectedValue(new Error('Database error'))
              })
            })
          })
        })
      } as any);

      const result = await waitlistService.getWaitlistForService(
        'service-1',
        new Date(),
        false
      );

      expect(result).toEqual([]);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('updateWaitlistStatus', () => {
    it('should update waitlist entry status', async () => {
      const mockSupabaseReturn = { error: null };

      supabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue(mockSupabaseReturn)
        })
      } as any);

      await waitlistService.updateWaitlistStatus('test-id', 'promoted', 'booking-1');

      expect(supabase.from).toHaveBeenCalledWith('waitlist_entries');
      expect(logger.info).toHaveBeenCalledWith('Waitlist entry updated', {
        waitlistId: 'test-id',
        status: 'promoted',
        bookingId: 'booking-1'
      });
    });

    it('should handle errors when updating status', async () => {
      const mockError = new Error('Update failed');

      supabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: mockError })
        })
      } as any);

      await expect(waitlistService.updateWaitlistStatus('test-id', 'promoted'))
        .rejects.toThrow('Update failed');

      expect(logger.error).toHaveBeenCalledWith('Error updating waitlist status:', mockError);
    });
  });

  describe('promoteWaitlistEntry', () => {
    it('should promote waitlist entry to booking', async () => {
      const mockBookingId = 'booking-123';
      const mockSupabaseReturn = {
        data: mockBookingId,
        error: null
      };

      supabase.rpc = vi.fn().mockResolvedValue(mockSupabaseReturn);

      const result = await waitlistService.promoteWaitlistEntry('waitlist-1');

      expect(result).toBe(mockBookingId);
      expect(supabase.rpc).toHaveBeenCalledWith('promote_waitlist_entry', {
        p_waitlist_id: 'waitlist-1'
      });
      expect(logger.info).toHaveBeenCalledWith('Waitlist entry promoted to booking', {
        waitlistId: 'waitlist-1',
        bookingId: mockBookingId
      });
    });

    it('should return null if no booking created', async () => {
      const mockSupabaseReturn = {
        data: null,
        error: null
      };

      supabase.rpc = vi.fn().mockResolvedValue(mockSupabaseReturn);

      const result = await waitlistService.promoteWaitlistEntry('waitlist-1');

      expect(result).toBeNull();
    });

    it('should handle promotion errors', async () => {
      const mockError = new Error('Promotion failed');

      supabase.rpc = vi.fn().mockResolvedValue({
        data: null,
        error: mockError
      });

      await expect(waitlistService.promoteWaitlistEntry('waitlist-1'))
        .rejects.toThrow('Promotion failed');

      expect(logger.error).toHaveBeenCalledWith('Error promoting waitlist entry:', mockError);
    });
  });

  describe('getWaitlistStats', () => {
    it('should return waitlist statistics', async () => {
      const mockData = [
        { status: 'active', service_id: 'service-1', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), preferred_date: '2024-01-15' },
        { status: 'promoted', service_id: 'service-1', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), preferred_date: '2024-01-16' },
        { status: 'active', service_id: 'service-2', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), preferred_date: '2024-01-17' }
      ];

      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({
              data: mockData,
              error: null
            })
          })
        })
      } as any);

      const result = await waitlistService.getWaitlistStats();

      expect(result).toEqual({
        totalActive: 2,
        totalPromoted: 1,
        averageWaitTime: expect.any(Number),
        serviceBreakdown: {
          'service-1': 2,
          'service-2': 1
        },
        upcomingDates: expect.any(Array)
      });
    });

    it('should return default stats on error', async () => {
      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            in: vi.fn().mockRejectedValue(new Error('Stats error'))
          })
        })
      } as any);

      const result = await waitlistService.getWaitlistStats();

      expect(result).toEqual({
        totalActive: 0,
        totalPromoted: 0,
        averageWaitTime: 0,
        serviceBreakdown: {},
        upcomingDates: []
      });
    });
  });

  describe('checkWaitlistAvailability', () => {
    it('should return true if no active waitlist entries exist', async () => {
      const mockSupabaseReturn = { data: [], error: null };

      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue(mockSupabaseReturn)
            })
          })
        })
      } as any);

      const result = await waitlistService.checkWaitlistAvailability(
        'service-1',
        new Date(),
        '10:00'
      );

      expect(result).toBe(true);
    });

    it('should return false if active waitlist entries exist', async () => {
      const mockSupabaseReturn = {
        data: [{ id: 'test-id' }],
        error: null
      };

      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue(mockSupabaseReturn)
            })
          })
        })
      } as any);

      const result = await waitlistService.checkWaitlistAvailability(
        'service-1',
        new Date(),
        '10:00'
      );

      expect(result).toBe(false);
    });
  });

  describe('getNextEligibleEntry', () => {
    it('should find exact match first', async () => {
      const mockEntry = {
        id: 'test-id',
        service_id: 'service-1',
        status: 'active',
        auto_promote_eligible: true,
        promotion_attempts: 0,
        max_promotion_attempts: 3,
        priority_score: 100,
        created_at: new Date().toISOString()
      };

      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  lte: vi.fn().mockReturnValue({
                    lt: vi.fn().mockReturnValue({
                      order: vi.fn().mockReturnValue({
                        order: vi.fn().mockReturnValue({
                          limit: vi.fn().mockResolvedValue({
                            data: [mockEntry],
                            error: null
                          })
                        })
                      })
                    })
                  })
                })
              })
            })
          })
        })
      } as any);

      const result = await waitlistService.getNextEligibleEntry(
        'service-1',
        new Date(),
        '10:00',
        1
      );

      expect(result).toBeDefined();
      expect(result?.id).toBe('test-id');
    });

    it('should return null if no eligible entries found', async () => {
      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  lte: vi.fn().mockReturnValue({
                    lt: vi.fn().mockReturnValue({
                      order: vi.fn().mockReturnValue({
                        order: vi.fn().mockReturnValue({
                          limit: vi.fn().mockResolvedValue({
                            data: [],
                            error: null
                          })
                        })
                      })
                    })
                  })
                })
              })
            })
          })
        })
      } as any);

      const result = await waitlistService.getNextEligibleEntry(
        'service-1',
        new Date(),
        '10:00',
        1
      );

      expect(result).toBeNull();
    });
  });
});