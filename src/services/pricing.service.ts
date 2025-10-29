import { supabase } from '@/integrations/supabase/client'
import {
  PricingRule,
  PricingRuleInsert,
  PricingRuleUpdate,
  PricingCalculation,
  PriceBreakdown,
  PriceCalculationContext,
  PricingAnalytics,
  PriceOptimizationSuggestion,
  PricingSimulationRequest,
  PricingSimulationResult,
  PricingRuleTemplate,
  PRICING_RULE_TEMPLATES,
  PricingNotification,
  PricingDashboardStats
} from '@/types/pricing'

import { Service } from '@/types'

class PricingService {
  // Cache for calculated prices
  private priceCache = new Map<string, { price: number; timestamp: number }>()
  private CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  /**
   * Calculate dynamic price for a service
   */
  async calculateDynamicPrice(
    serviceId: string,
    date: string = new Date().toISOString().split('T')[0],
    groupSize: number = 1,
    context: PriceCalculationContext = {}
  ): Promise<PriceBreakdown> {
    const cacheKey = `${serviceId}-${date}-${groupSize}-${JSON.stringify(context)}`
    const cached = this.priceCache.get(cacheKey)

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      // Get detailed breakdown for cached price
      return await this.getPriceBreakdown(serviceId, date, groupSize, context)
    }

    try {
      const { data, error } = await supabase.rpc('calculate_dynamic_price', {
        p_service_id: serviceId,
        p_date: date,
        p_group_size: groupSize,
        p_context: context
      })

      if (error) throw error

      const price = parseFloat(data)

      // Cache the result
      this.priceCache.set(cacheKey, { price, timestamp: Date.now() })

      // Get detailed breakdown
      return await this.getPriceBreakdown(serviceId, date, groupSize, context)
    } catch (error) {
      console.error('Error calculating dynamic price:', error)
      throw error
    }
  }

  /**
   * Get detailed price breakdown with applied rules
   */
  async getPriceBreakdown(
    serviceId: string,
    date: string,
    groupSize: number,
    context: PriceCalculationContext
  ): Promise<PriceBreakdown> {
    try {
      // Get base service price
      const { data: service, error: serviceError } = await supabase
        .from('services')
        .select('price, name')
        .eq('id', serviceId)
        .single()

      if (serviceError) throw serviceError

      // Get latest calculation
      const { data: calculation, error: calcError } = await supabase
        .from('pricing_calculations')
        .select(`
          *,
          pricing_rules(id, name, rule_type, modifier_type, modifier_value)
        `)
        .eq('service_id', serviceId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (calcError || !calculation) {
        return {
          base_price: service.price,
          final_price: service.price,
          total_modifier: 0,
          applied_rules: [],
          calculation_context: {
            date,
            group_size: groupSize,
            ...context
          }
        }
      }

      // Get applied rules details
      const { data: appliedRules, error: rulesError } = await supabase
        .from('pricing_rules')
        .select('id, name, rule_type, modifier_type, modifier_value')
        .in('id', calculation.applied_rules)

      if (rulesError) throw rulesError

      let runningPrice = service.price
      const appliedRuleDetails = []

      for (const rule of appliedRules || []) {
        const modifiedPrice = this.applyModifier(runningPrice, rule.modifier_type, rule.modifier_value)
        appliedRuleDetails.push({
          id: rule.id,
          name: rule.name,
          type: rule.rule_type,
          modifier_value: rule.modifier_value,
          modified_price: modifiedPrice
        })
        runningPrice = modifiedPrice
      }

      return {
        base_price: service.price,
        final_price: runningPrice,
        total_modifier: ((runningPrice - service.price) / service.price) * 100,
        applied_rules: appliedRuleDetails,
        calculation_context: {
          date,
          group_size: groupSize,
          ...context
        }
      }
    } catch (error) {
      console.error('Error getting price breakdown:', error)
      throw error
    }
  }

  /**
   * Apply price modifier
   */
  private applyModifier(basePrice: number, modifierType: string, modifierValue: number): number {
    switch (modifierType) {
      case 'percentage':
        return basePrice * (1 + modifierValue / 100)
      case 'fixed':
        return basePrice + modifierValue
      case 'multiply':
        return basePrice * modifierValue
      default:
        return basePrice
    }
  }

  /**
   * Get all pricing rules for a service
   */
  async getPricingRules(serviceId?: string): Promise<PricingRule[]> {
    try {
      let query = supabase
        .from('pricing_rules')
        .select('*')
        .order('priority', { ascending: true })

      if (serviceId) {
        query = query.eq('service_id', serviceId)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching pricing rules:', error)
      throw error
    }
  }

  /**
   * Create a new pricing rule
   */
  async createPricingRule(rule: PricingRuleInsert): Promise<PricingRule> {
    try {
      const { data, error } = await supabase
        .from('pricing_rules')
        .insert(rule)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating pricing rule:', error)
      throw error
    }
  }

  /**
   * Update a pricing rule
   */
  async updatePricingRule(id: string, updates: PricingRuleUpdate): Promise<PricingRule> {
    try {
      const { data, error } = await supabase
        .from('pricing_rules')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating pricing rule:', error)
      throw error
    }
  }

  /**
   * Delete a pricing rule
   */
  async deletePricingRule(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('pricing_rules')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting pricing rule:', error)
      throw error
    }
  }

  /**
   * Get pricing analytics for services
   */
  async getPricingAnalytics(serviceIds: string[]): Promise<PricingAnalytics[]> {
    try {
      const analytics: PricingAnalytics[] = []

      for (const serviceId of serviceIds) {
        // Get service info
        const { data: service, error: serviceError } = await supabase
          .from('services')
          .select('name, price')
          .eq('id', serviceId)
          .single()

        if (serviceError) continue

        // Get recent calculations
        const { data: recentCalculations, error: calcError } = await supabase
          .from('pricing_calculations')
          .select('final_price, created_at')
          .eq('service_id', serviceId)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

        if (calcError) continue

        // Calculate averages and trends
        const avg7d = this.calculateAveragePrice(recentCalculations, 7)
        const avg30d = this.calculateAveragePrice(recentCalculations, 30)
        const trend = this.determinePriceTrend(recentCalculations)

        // Get occupancy rate
        const occupancyRate = await this.getOccupancyRate(serviceId)

        // Get suggestion
        const { data: suggestion } = await supabase.rpc('suggest_pricing_adjustment', {
          p_service_id: serviceId,
          p_target_occupancy: 0.85
        })

        analytics.push({
          service_id: serviceId,
          service_name: service.name,
          current_price: service.price,
          average_price_7d: avg7d,
          average_price_30d: avg30d,
          price_trend: trend,
          demand_level: 0, // Would need additional calculation
          occupancy_rate,
          revenue_impact: 0, // Would need additional calculation
          suggested_price: suggestion?.[0]?.suggested_price || service.price,
          recommendation: suggestion?.[0]?.recommendation || 'Current pricing is optimal'
        })
      }

      return analytics
    } catch (error) {
      console.error('Error getting pricing analytics:', error)
      throw error
    }
  }

  /**
   * Run pricing simulation
   */
  async runPricingSimulation(request: PricingSimulationRequest): Promise<PricingSimulationResult> {
    try {
      // This would typically be a Supabase function
      // For now, we'll implement basic simulation on the client
      const scenarios = []

      // Test each rule scenario
      for (const rule of request.rules) {
        const results = []

        for (const demand of request.variables.demand_levels) {
          for (const groupSize of request.variables.group_sizes) {
            const price = await this.calculateDynamicPrice(
              request.service_id,
              request.simulation_period.start_date,
              groupSize,
              { demand_level: demand }
            )

            results.push(price.final_price)
          }
        }

        scenarios.push({
          scenario_name: rule.name,
          rules: [rule],
          results: {
            average_price: results.reduce((a, b) => a + b, 0) / results.length,
            price_range: {
              min: Math.min(...results),
              max: Math.max(...results)
            },
            expected_revenue: results.reduce((a, b) => a + b, 0),
            booking_count: results.length,
            occupancy_rate: 0.85 // Placeholder
          }
        })
      }

      return {
        service_id: request.service_id,
        simulation_period: request.simulation_period,
        scenarios,
        recommendations: ['Consider the weekend premium rule for highest revenue', 'Group discount shows good booking volume']
      }
    } catch (error) {
      console.error('Error running pricing simulation:', error)
      throw error
    }
  }

  /**
   * Get pricing dashboard statistics
   */
  async getDashboardStats(): Promise<PricingDashboardStats> {
    try {
      // Get total rules
      const { count: totalRules } = await supabase
        .from('pricing_rules')
        .select('*', { count: 'exact', head: true })

      // Get active rules
      const { count: activeRules } = await supabase
        .from('pricing_rules')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      // Get total calculations
      const { count: totalCalculations } = await supabase
        .from('pricing_calculations')
        .select('*', { count: 'exact', head: true })

      // Get average price change
      const { data: calculations } = await supabase
        .from('pricing_calculations')
        .select('base_price, final_price')
        .limit(100)

      const avgPriceChange = calculations?.reduce((acc, calc) => {
        return acc + ((calc.final_price - calc.base_price) / calc.base_price) * 100
      }, 0) / (calculations?.length || 1)

      return {
        total_rules: totalRules || 0,
        active_rules: activeRules || 0,
        total_calculations: totalCalculations || 0,
        average_price_change: avgPriceChange || 0,
        revenue_impact: 0, // Would need calculation
        most_profitable_service: 'Lash Extensions', // Would need calculation
        least_profitable_service: 'Brow Lamination', // Would need calculation
        top_performing_rule: 'Weekend Premium', // Would need calculation
        upcoming_rule_changes: 0 // Would need calculation
      }
    } catch (error) {
      console.error('Error getting dashboard stats:', error)
      throw error
    }
  }

  /**
   * Get rule templates
   */
  getRuleTemplates(): PricingRuleTemplate[] {
    return PRICING_RULE_TEMPLATES
  }

  /**
   * Clear price cache
   */
  clearCache(): void {
    this.priceCache.clear()
  }

  // Helper methods
  private calculateAveragePrice(calculations: PricingCalculation[], days: number): number {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    const recentCalculations = calculations.filter(c =>
      new Date(c.created_at) > cutoff
    )

    if (recentCalculations.length === 0) return 0

    return recentCalculations.reduce((sum, c) => sum + c.final_price, 0) / recentCalculations.length
  }

  private determinePriceTrend(calculations: PricingCalculation[]): 'increasing' | 'decreasing' | 'stable' {
    if (calculations.length < 2) return 'stable'

    const sorted = [...calculations].sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

    const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2))
    const secondHalf = sorted.slice(Math.floor(sorted.length / 2))

    const avgFirst = firstHalf.reduce((sum, c) => sum + c.final_price, 0) / firstHalf.length
    const avgSecond = secondHalf.reduce((sum, c) => sum + c.final_price, 0) / secondHalf.length

    const change = ((avgSecond - avgFirst) / avgFirst) * 100

    if (change > 5) return 'increasing'
    if (change < -5) return 'decreasing'
    return 'stable'
  }

  private async getOccupancyRate(serviceId: string): Promise<number> {
    // Calculate occupancy rate for last 7 days
    const { data: slots } = await supabase
      .from('availability_slots')
      .select('status')
      .eq('service_id', serviceId)
      .gte('start_time', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

    if (!slots || slots.length === 0) return 0

    const bookedSlots = slots.filter(s => s.status === 'booked').length
    return (bookedSlots / slots.length) * 100
  }
}

export const pricingService = new PricingService()