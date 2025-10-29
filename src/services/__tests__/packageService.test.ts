import { describe, it, expect, vi, beforeEach } from 'vitest';

import { supabase } from '@/integrations/supabase/client';

import { packageService, ServicePackage } from '../packageService';

// Mock supabase
vi.mock('@/integrations/supabase/client', () => {
  const mockSupabase = {
    rpc: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            or: vi.fn(() => ({
              order: vi.fn(() => ({
                range: vi.fn(() => Promise.resolve({ data: [], error: null }))
              }))
            })),
            order: vi.fn(() => ({
              range: vi.fn(() => Promise.resolve({ data: [], error: null }))
            })),
            single: vi.fn(() => Promise.resolve({ data: null, error: null }))
          })),
          or: vi.fn(() => ({
            order: vi.fn(() => ({
              range: vi.fn(() => Promise.resolve({ data: [], error: null }))
            }))
          })),
          order: vi.fn(() => ({
            range: vi.fn(() => Promise.resolve({ data: [], error: null }))
          })),
          single: vi.fn(() => Promise.resolve({ data: null, error: null }))
        })),
        in: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: [], error: null }))
        })),
        order: vi.fn(() => ({
          range: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: null }))
          }))
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      }))
    }))
  }

  return { supabase: mockSupabase }
});

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('packageService', () => {
  const mockServicePackage: ServicePackage = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Test Package',
    slug: 'test-package',
    description: 'Test description',
    service_id: '550e8400-e29b-41d4-a716-446655440000',
    session_count: 5,
    original_price: 500,
    package_price: 400,
    savings_amount: 100,
    savings_percentage: 20,
    validity_days: 365,
    is_active: true,
    is_featured: false,
    display_order: 0,
    features: {},
    benefits: [],
    inclusions: {},
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    service: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Test Service',
      slug: 'test-service',
      service_type: 'beauty',
      duration_minutes: 60,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getServicePackages', () => {
    it('should fetch service packages with default options', async () => {
      const mockSupabase = vi.mocked(supabase);

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            or: vi.fn().mockReturnValueOnce({
              order: vi.fn().mockReturnValueOnce({
                range: vi.fn().mockResolvedValueOnce({
                  data: [mockServicePackage],
                  error: null,
                }),
              }),
            }),
          }),
        })
      } as any);

      const result = await packageService.getServicePackages();

      expect(mockSupabase.from).toHaveBeenCalledWith('service_packages');
      expect(result).toEqual([mockServicePackage]);
    });

    it('should filter by category when specified', async () => {
      const mockSupabase = vi.mocked(supabase);

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockReturnValueOnce({
              or: vi.fn().mockReturnValueOnce({
                order: vi.fn().mockReturnValueOnce({
                  range: vi.fn().mockResolvedValueOnce({
                    data: [mockServicePackage],
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        })
      } as any);

      await packageService.getServicePackages({ category: 'beauty' });

      expect(mockSupabase.from).toHaveBeenCalledWith('service_packages');
    });

    it('should filter featured packages when specified', async () => {
      const mockSupabase = vi.mocked(supabase);

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockReturnValueOnce({
              or: vi.fn().mockReturnValueOnce({
                order: vi.fn().mockReturnValueOnce({
                  range: vi.fn().mockResolvedValueOnce({
                    data: [mockServicePackage],
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        })
      } as any);

      await packageService.getServicePackages({ is_featured: true });

      expect(mockSupabase.from).toHaveBeenCalledWith('service_packages');
    });
  });

  describe('getServicePackage', () => {
    it('should fetch a single package by slug', async () => {
      const mockSupabase = vi.mocked(supabase);

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockReturnValueOnce({
              single: vi.fn().mockResolvedValueOnce({
                data: mockServicePackage,
                error: null,
              }),
            }),
          }),
        })
      } as any);

      const result = await packageService.getServicePackage('test-package');

      expect(mockSupabase.from).toHaveBeenCalledWith('service_packages');
      expect(result).toEqual(mockServicePackage);
    });

    it('should fetch a single package by ID', async () => {
      const mockSupabase = vi.mocked(supabase);

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockReturnValueOnce({
              single: vi.fn().mockResolvedValueOnce({
                data: mockServicePackage,
                error: null,
              }),
            }),
          }),
        })
      } as any);

      const result = await packageService.getServicePackage('550e8400-e29b-41d4-a716-446655440001');

      expect(result).toEqual(mockServicePackage);
    });

    it('should return null when package not found', async () => {
      const mockSupabase = vi.mocked(supabase);

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockReturnValueOnce({
              single: vi.fn().mockResolvedValueOnce({
                data: null,
                error: { code: 'PGRST116' },
              }),
            }),
          }),
        })
      } as any);

      const result = await packageService.getServicePackage('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('purchasePackage', () => {
    const mockPurchaseData = {
      client_id: '550e8400-e29b-41d4-a716-446655440000',
      package_id: '550e8400-e29b-41d4-a716-446655440001',
      payment_method: 'stripe' as const,
    };

    it('should call purchase_package RPC function', async () => {
      const mockSupabase = vi.mocked(supabase);

      // Mock getServicePackage to return valid package
      vi.spyOn(packageService, 'getServicePackage').mockResolvedValue(mockServicePackage);

      const mockRpc = vi.fn().mockResolvedValue({
        data: 'client-pkg-id',
        error: null,
      });

      mockSupabase.rpc = mockRpc;

      const result = await packageService.purchasePackage(mockPurchaseData);

      expect(mockRpc).toHaveBeenCalledWith('purchase_package', {
        p_client_id: mockPurchaseData.client_id,
        p_package_id: mockPurchaseData.package_id,
        p_payment_id: undefined,  // paymentId parameter not passed in test
        p_amount_paid: mockServicePackage.package_price,
        p_currency: 'pln',
        p_gift_to: null,
        p_gift_message: null,
        p_purchase_notes: null,
      });
    });

    it('should throw error when package not found', async () => {
      vi.spyOn(packageService, 'getServicePackage').mockResolvedValue(null);

      await expect(
        packageService.purchasePackage(mockPurchaseData)
      ).rejects.toThrow('Package not found');
    });

    it('should throw error when package is expired', async () => {
      const expiredPackage = {
        ...mockServicePackage,
        valid_until: new Date(Date.now() - 1000).toISOString(),
      };

      vi.spyOn(packageService, 'getServicePackage').mockResolvedValue(expiredPackage);

      await expect(
        packageService.purchasePackage(mockPurchaseData)
      ).rejects.toThrow('Package is no longer available for purchase');
    });
  });

  describe('usePackageSession', () => {
    it('should call use_package_session RPC function', async () => {
      const mockSupabase = vi.mocked(supabase);

      const mockRpc = vi.fn().mockResolvedValue({
        data: 'session-id',
        error: null,
      });

      mockSupabase.rpc = mockRpc;

      const result = await packageService.usePackageSession('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 'Test notes');

      expect(mockRpc).toHaveBeenCalledWith('use_package_session', {
        p_client_id: '550e8400-e29b-41d4-a716-446655440000',
        p_booking_id: '550e8400-e29b-41d4-a716-446655440001',
        p_notes: 'Test notes',
      });
      expect(result).toBe('session-id');
    });
  });

  describe('checkPackageBalance', () => {
    it('should call check_package_balance RPC function', async () => {
      const mockSupabase = vi.mocked(supabase);

      const mockRpc = vi.fn().mockResolvedValue({
        data: [
          {
            package_id: 'pkg-1',
            sessions_remaining: 3,
            expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ],
        error: null,
      });

      mockSupabase.rpc = mockRpc;

      const result = await packageService.checkPackageBalance('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001');

      expect(mockRpc).toHaveBeenCalledWith('check_package_balance', {
        p_client_id: '550e8400-e29b-41d4-a716-446655440000',
        p_service_id: '550e8400-e29b-41d4-a716-446655440001',
      });
      expect(result).toHaveLength(1);
      expect(result[0].sessions_remaining).toBe(3);
    });
  });

  describe('createServicePackage', () => {
    const mockCreateData = {
      name: 'New Package',
      slug: 'new-package',
      service_id: '550e8400-e29b-41d4-a716-446655440001',
      session_count: 10,
      package_price: 1000,
      validity_days: 365,
    };

    it('should create a new service package', async () => {
      const mockSupabase = vi.mocked(supabase);

      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnValueOnce({
          select: vi.fn().mockReturnValueOnce({
            single: vi.fn().mockResolvedValueOnce({
              data: mockServicePackage,
              error: null,
            }),
          }),
        })
      } as any);

      const result = await packageService.createServicePackage(mockCreateData);

      expect(mockSupabase.from).toHaveBeenCalledWith('service_packages');
      expect(result).toEqual(mockServicePackage);
    });
  });
});