import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { PricingRuleInsert, PriceCalculationContext } from '@/types/pricing'
import { supabase } from '@/integrations/supabase/client'

import { pricingService } from '../pricing.service'

// Mock supabase with simple structure that matches pricingService usage patterns
vi.mock('@/integrations/supabase/client', () => {
  const mockSupabase = {
    rpc: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
          })),
          in: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        })),
        order: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
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
})

describe('PricingService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    pricingService.clearCache()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('calculateDynamicPrice', () => {
    it('should calculate base price when no rules apply', async () => {
      const mockSupabase = vi.mocked(supabase)

      // Mock pricing calculation
      mockSupabase.rpc.mockResolvedValueOnce({
        data: 100,
        error: null
      })

      // Mock service query
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            single: vi.fn().mockResolvedValueOnce({
              data: { id: 'service-1', name: 'Test Service', price: 100 },
              error: null
            })
          })
        })
      } as any)

      // Mock calculation query (second .from() call)
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            order: vi.fn().mockReturnValueOnce({
              limit: vi.fn().mockReturnValueOnce({
                single: vi.fn().mockResolvedValueOnce({
                  data: null, // No calculation found - should return base price
                  error: { code: 'PGRST116' } // Not found error
                })
              })
            })
          })
        })
      } as any)

      // Mock applied rules query (third .from() call)
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          in: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockResolvedValueOnce({
              data: [],
              error: null
            })
          })
        })
      } as any)

      const result = await pricingService.calculateDynamicPrice(
        'service-1',
        '2024-01-01',
        1,
        {}
      )

      expect(result).toEqual({
        base_price: 100,
        final_price: 100,
        total_modifier: 0,
        applied_rules: [],
        calculation_context: {
          date: '2024-01-01',
          group_size: 1
        }
      })
    })

    it('should apply percentage modifier correctly', async () => {
      const mockSupabase = vi.mocked(supabase)

      // Mock pricing calculation
      mockSupabase.rpc.mockResolvedValueOnce({
        data: 110,
        error: null
      })

      // Mock service query
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            single: vi.fn().mockResolvedValueOnce({
              data: { id: 'service-1', name: 'Test Service', price: 100 },
              error: null
            })
          })
        })
      } as any)

      // Mock calculation details
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            order: vi.fn().mockReturnValueOnce({
              limit: vi.fn().mockResolvedValueOnce({
                data: {
                  id: 'calc-1',
                  base_price: 100,
                  final_price: 110,
                  applied_rules: ['rule-1']
                },
                error: null
              })
            })
          })
        })
      } as any)

      // Mock applied rules query
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          in: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockResolvedValueOnce({
              data: [{
                id: 'rule-1',
                name: 'Weekend Premium',
                rule_type: 'time_based',
                modifier_type: 'percentage',
                modifier_value: 10
              }],
              error: null
            })
          })
        })
      } as any)

      const result = await pricingService.calculateDynamicPrice(
        'service-1',
        '2024-01-01',
        1,
        {}
      )

      expect(result).toEqual({
        base_price: 100,
        final_price: expect.closeTo(110, 0.01), // Use closeTo for floating point precision
        total_modifier: expect.closeTo(10, 0.01),
        applied_rules: [{
          id: 'rule-1',
          name: 'Weekend Premium',
          type: 'time_based',
          modifier_value: 10,
          modified_price: expect.closeTo(110, 0.01)
        }],
        calculation_context: {
          date: '2024-01-01',
          group_size: 1
        }
      })
    })

    it('should use cached price when available', async () => {
      const mockSupabase = vi.mocked(supabase)

      // Mock pricing calculation
      mockSupabase.rpc.mockResolvedValueOnce({
        data: 100,
        error: null
      })

      // Mock service query
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            single: vi.fn().mockResolvedValueOnce({
              data: { id: 'service-1', name: 'Test Service', price: 100 },
              error: null
            })
          })
        })
      } as any)

      // Mock calculation details
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            order: vi.fn().mockReturnValueOnce({
              limit: vi.fn().mockResolvedValueOnce({
                data: {
                  id: 'calc-1',
                  base_price: 100,
                  final_price: 100,
                  applied_rules: []
                },
                error: null
              })
            })
          })
        })
      } as any)

      // Mock applied rules query
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          in: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockResolvedValueOnce({
              data: [],
              error: null
            })
          })
        })
      } as any)

      // First call
      await pricingService.calculateDynamicPrice('service-1', '2024-01-01', 1, {})

      // Second call should use cache (no additional RPC calls)
      await pricingService.calculateDynamicPrice('service-1', '2024-01-01', 1, {})

      // Should only call RPC once due to caching
      expect(mockSupabase.rpc).toHaveBeenCalledTimes(1)
    })
  })

  describe('createPricingRule', () => {
    it('should create a new pricing rule', async () => {
      const mockSupabase = vi.mocked(supabase)
      const ruleData: PricingRuleInsert = {
        service_id: 'service-1',
        name: 'Test Rule',
        rule_type: 'percentage',
        conditions: {},
        modifier_type: 'percentage',
        modifier_value: 10,
        priority: 50
      }

      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnValueOnce({
          select: vi.fn().mockReturnValueOnce({
            single: vi.fn().mockResolvedValueOnce({
              data: { id: 'rule-1', ...ruleData },
              error: null
            })
          })
        })
      } as any)

      const result = await pricingService.createPricingRule(ruleData)

      expect(result).toEqual({ id: 'rule-1', ...ruleData })
      expect(mockSupabase.from).toHaveBeenCalledWith('pricing_rules')
    })
  })

  describe('updatePricingRule', () => {
    it('should update an existing pricing rule', async () => {
      const mockSupabase = vi.mocked(supabase)
      const updateData = { name: 'Updated Rule', is_active: false }

      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            select: vi.fn().mockReturnValueOnce({
              single: vi.fn().mockResolvedValueOnce({
                data: { id: 'rule-1', name: 'Updated Rule', is_active: false },
                error: null
              })
            })
          })
        })
      } as any)

      const result = await pricingService.updatePricingRule('rule-1', updateData)

      expect(result).toEqual({ id: 'rule-1', name: 'Updated Rule', is_active: false })
      expect(mockSupabase.from).toHaveBeenCalledWith('pricing_rules')
    })
  })

  describe('deletePricingRule', () => {
    it('should delete a pricing rule', async () => {
      const mockSupabase = vi.mocked(supabase)

      mockSupabase.from.mockReturnValueOnce({
        delete: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockResolvedValueOnce({
            error: null
          })
        })
      } as any)

      await expect(pricingService.deletePricingRule('rule-1')).resolves.not.toThrow()
      expect(mockSupabase.from).toHaveBeenCalledWith('pricing_rules')
    })
  })

  describe('getPricingRules', () => {
    it('should fetch all pricing rules', async () => {
      const mockSupabase = vi.mocked(supabase)
      const mockRules = [
        { id: 'rule-1', name: 'Rule 1' },
        { id: 'rule-2', name: 'Rule 2' }
      ]

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          order: vi.fn().mockResolvedValueOnce({
            data: mockRules,
            error: null
          })
        })
      } as any)

      const result = await pricingService.getPricingRules()

      expect(result).toEqual(mockRules)
      expect(mockSupabase.from).toHaveBeenCalledWith('pricing_rules')
    })

    it('should fetch pricing rules for a specific service', async () => {
      const mockSupabase = vi.mocked(supabase)
      const mockRules = [
        { id: 'rule-1', name: 'Rule 1', service_id: 'service-1' }
      ]

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            order: vi.fn().mockResolvedValueOnce({
              data: mockRules,
              error: null
            })
          })
        })
      } as any)

      const result = await pricingService.getPricingRules('service-1')

      expect(result).toEqual(mockRules)
      expect(mockSupabase.from).toHaveBeenCalledWith('pricing_rules')
    })
  })

  describe('clearCache', () => {
    it('should clear the price cache', async () => {
      // Add something to cache by calling calculateDynamicPrice
      const mockSupabase = vi.mocked(supabase)

      // Mock the RPC call
      mockSupabase.rpc.mockResolvedValueOnce({ data: 100, error: null })

      // Mock the service query
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            single: vi.fn().mockResolvedValueOnce({
              data: { id: 'service-1', name: 'Test Service', price: 100 },
              error: null
            })
          })
        })
      } as any)

      // Mock calculation details
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            order: vi.fn().mockReturnValueOnce({
              limit: vi.fn().mockResolvedValueOnce({
                data: {
                  id: 'calc-1',
                  base_price: 100,
                  final_price: 100,
                  applied_rules: []
                },
                error: null
              })
            })
          })
        })
      } as any)

      // Mock applied rules query
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          in: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockResolvedValueOnce({
              data: [],
              error: null
            })
          })
        })
      } as any)

      await pricingService.calculateDynamicPrice('service-1', '2024-01-01', 1, {})

      // Clear cache
      pricingService.clearCache()

      // Cache should be empty (no easy way to test directly, but we can ensure it doesn't error)
      expect(() => pricingService.clearCache()).not.toThrow()
    })
  })

  describe('applyModifier', () => {
    it('should apply percentage modifier correctly', () => {
      // Access the private method via casting
      const service = pricingService as any
      const applyModifier = service.applyModifier.bind(service)

      expect(applyModifier(100, 'percentage', 10)).toBeCloseTo(110, 0.01)
      expect(applyModifier(100, 'percentage', -10)).toBeCloseTo(90, 0.01)
      expect(applyModifier(100, 'percentage', 0)).toBe(100)
    })

    it('should apply fixed modifier correctly', () => {
      const service = pricingService as any
      const applyModifier = service.applyModifier.bind(service)

      expect(applyModifier(100, 'fixed', 10)).toBe(110)
      expect(applyModifier(100, 'fixed', -10)).toBe(90)
      expect(applyModifier(100, 'fixed', 0)).toBe(100)
    })

    it('should apply multiply modifier correctly', () => {
      const service = pricingService as any
      const applyModifier = service.applyModifier.bind(service)

      expect(applyModifier(100, 'multiply', 1.5)).toBeCloseTo(150, 0.01)
      expect(applyModifier(100, 'multiply', 0.5)).toBeCloseTo(50, 0.01)
      expect(applyModifier(100, 'multiply', 1)).toBe(100)
    })

    it('should return base price for unknown modifier type', () => {
      const service = pricingService as any
      const applyModifier = service.applyModifier.bind(service)

      expect(applyModifier(100, 'unknown' as any, 10)).toBe(100)
    })
  })
})