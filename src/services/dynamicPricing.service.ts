import { supabase } from '@/integrations/supabase/client';
import { PricingRule, AppliedPricingRule } from '@/types/booking';
import { logger } from '@/lib/logger';

export class DynamicPricingService {
  /**
   * Get all active pricing rules for a service
   */
  async getPricingRules(serviceId: string): Promise<PricingRule[]> {
    try {
      const { data, error } = await supabase
        .from('pricing_rules')
        .select('*')
        .eq('service_id', serviceId)
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (error) throw error;

      return (data || []).map(this.mapDbRuleToPricingRule);
    } catch (error) {
      logger.error('Error getting pricing rules:', error);
      return [];
    }
  }

  /**
   * Create a new pricing rule
   */
  async createPricingRule(rule: Omit<PricingRule, 'id'>): Promise<PricingRule> {
    try {
      const { data, error } = await supabase
        .from('pricing_rules')
        .insert({
          service_id: rule.serviceId,
          name: rule.name,
          description: rule.description,
          rule_type: rule.ruleType,
          configuration: rule.configuration,
          min_group_size: rule.minGroupSize,
          max_group_size: rule.maxGroupSize,
          valid_from: rule.validFrom?.toISOString().split('T')[0],
          valid_until: rule.validUntil?.toISOString().split('T')[0],
          valid_days: rule.validDays,
          valid_time_start: rule.validTimeStart,
          valid_time_end: rule.validTimeEnd,
          priority: rule.priority,
          is_stackable: rule.isStackable,
          is_active: rule.isActive
        })
        .select()
        .single();

      if (error) throw error;

      logger.info('Pricing rule created', { ruleId: data.id, name: rule.name });
      return this.mapDbRuleToPricingRule(data);
    } catch (error) {
      logger.error('Error creating pricing rule:', error);
      throw error;
    }
  }

  /**
   * Update an existing pricing rule
   */
  async updatePricingRule(ruleId: string, updates: Partial<PricingRule>): Promise<PricingRule> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.configuration !== undefined) updateData.configuration = updates.configuration;
      if (updates.minGroupSize !== undefined) updateData.min_group_size = updates.minGroupSize;
      if (updates.maxGroupSize !== undefined) updateData.max_group_size = updates.maxGroupSize;
      if (updates.validFrom !== undefined) updateData.valid_from = updates.validFrom?.toISOString().split('T')[0];
      if (updates.validUntil !== undefined) updateData.valid_until = updates.validUntil?.toISOString().split('T')[0];
      if (updates.validDays !== undefined) updateData.valid_days = updates.validDays;
      if (updates.validTimeStart !== undefined) updateData.valid_time_start = updates.validTimeStart;
      if (updates.validTimeEnd !== undefined) updateData.valid_time_end = updates.validTimeEnd;
      if (updates.priority !== undefined) updateData.priority = updates.priority;
      if (updates.isStackable !== undefined) updateData.is_stackable = updates.isStackable;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

      const { data, error } = await supabase
        .from('pricing_rules')
        .update(updateData)
        .eq('id', ruleId)
        .select()
        .single();

      if (error) throw error;

      logger.info('Pricing rule updated', { ruleId, updates });
      return this.mapDbRuleToPricingRule(data);
    } catch (error) {
      logger.error('Error updating pricing rule:', error);
      throw error;
    }
  }

  /**
   * Delete a pricing rule
   */
  async deletePricingRule(ruleId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('pricing_rules')
        .update({ is_active: false })
        .eq('id', ruleId);

      if (error) throw error;

      logger.info('Pricing rule deactivated', { ruleId });
    } catch (error) {
      logger.error('Error deactivating pricing rule:', error);
      throw error;
    }
  }

  /**
   * Calculate final price with all applicable rules
   */
  async calculatePrice(
    serviceId: string,
    basePrice: number,
    date: Date,
    time: string,
    groupSize: number = 1
  ): Promise<{
    finalPrice: number;
    appliedRules: AppliedPricingRule[];
    totalDiscount: number;
    originalPrice: number;
  }> {
    try {
      // Get service details
      const { data: service } = await supabase
        .from('services')
        .select('price_from, price_to')
        .eq('id', serviceId)
        .single();

      if (!service) throw new Error('Service not found');

      const originalPrice = basePrice * groupSize;
      let currentPrice = originalPrice;
      const appliedRules: AppliedPricingRule[] = [];
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });

      // Get applicable pricing rules
      const rules = await this.getApplicableRules(serviceId, date, time, groupSize);

      // Apply rules in priority order
      for (const rule of rules) {
        const ruleResult = this.applyPricingRule(rule, currentPrice, groupSize, date, time, dayOfWeek);

        if (ruleResult.applied) {
          currentPrice = ruleResult.newPrice;
          appliedRules.push(ruleResult.appliedRule);

          // If rule is not stackable, stop processing further rules
          if (!rule.isStackable) {
            break;
          }
        }
      }

      // Ensure minimum price (50% of original)
      const minPrice = originalPrice * 0.5;
      const finalPrice = Math.max(currentPrice, minPrice);

      return {
        finalPrice,
        appliedRules,
        totalDiscount: originalPrice - finalPrice,
        originalPrice
      };
    } catch (error) {
      logger.error('Error calculating price:', error);
      // Return base pricing if calculation fails
      const originalPrice = basePrice * groupSize;
      return {
        finalPrice: originalPrice,
        appliedRules: [],
        totalDiscount: 0,
        originalPrice
      };
    }
  }

  /**
   * Get pricing rules that apply to specific conditions
   */
  private async getApplicableRules(
    serviceId: string,
    date: Date,
    time: string,
    groupSize: number
  ): Promise<PricingRule[]> {
    try {
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
      const dateStr = date.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('pricing_rules')
        .select('*')
        .eq('service_id', serviceId)
        .eq('is_active', true)
        .or(`min_group_size.is.null,min_group_size.lte.${groupSize}`)
        .or(`max_group_size.is.null,max_group_size.gte.${groupSize}`)
        .or(`valid_from.is.null,valid_from.lte.${dateStr}`)
        .or(`valid_until.is.null,valid_until.gte.${dateStr}`)
        .or(`valid_days.is.null,valid_days.cs.{${dayOfWeek}}`)
        .order('priority', { ascending: false });

      if (error) throw error;

      // Filter rules that match time constraints
      const timeMinutes = this.timeToMinutes(time);
      return (data || [])
        .filter(rule => {
          const ruleMapped = this.mapDbRuleToPricingRule(rule);
          if (ruleMapped.validTimeStart && ruleMapped.validTimeEnd) {
            const startMinutes = this.timeToMinutes(ruleMapped.validTimeStart);
            const endMinutes = this.timeToMinutes(ruleMapped.validTimeEnd);
            return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
          }
          return true;
        })
        .map(this.mapDbRuleToPricingRule);
    } catch (error) {
      logger.error('Error getting applicable rules:', error);
      return [];
    }
  }

  /**
   * Apply a single pricing rule
   */
  private applyPricingRule(
    rule: PricingRule,
    currentPrice: number,
    groupSize: number,
    date: Date,
    time: string,
    dayOfWeek: string
  ): {
    applied: boolean;
    newPrice: number;
    appliedRule?: AppliedPricingRule;
  } {
    let newPrice = currentPrice;
    let applied = false;
    let appliedRule: AppliedPricingRule | undefined;

    switch (rule.ruleType) {
      case 'group_discount':
        if (groupSize >= (rule.minGroupSize || 2)) {
          const discountPercent = rule.configuration.discount_percentage || 0;
          const discountAmount = currentPrice * (discountPercent / 100);
          newPrice = currentPrice - discountAmount;
          applied = true;
          appliedRule = {
            ruleId: rule.id,
            ruleType: rule.ruleType,
            discountPercentage: discountPercent,
            appliedAmount: discountAmount,
            description: `${rule.name}: ${discountPercent}% off for groups of ${groupSize}+`
          };
        }
        break;

      case 'early_bird':
        const daysAhead = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        const minDaysAhead = rule.configuration.min_days_ahead || 7;
        if (daysAhead >= minDaysAhead) {
          const discountPercent = rule.configuration.discount_percentage || 0;
          const discountAmount = currentPrice * (discountPercent / 100);
          newPrice = currentPrice - discountAmount;
          applied = true;
          appliedRule = {
            ruleId: rule.id,
            ruleType: rule.ruleType,
            discountPercentage: discountPercent,
            appliedAmount: discountAmount,
            description: `${rule.name}: ${discountPercent}% early bird discount`
          };
        }
        break;

      case 'seasonal':
        const multiplier = rule.configuration.price_multiplier || 1.0;
        if (multiplier !== 1.0) {
          newPrice = currentPrice * multiplier;
          applied = true;
          appliedRule = {
            ruleId: rule.id,
            ruleType: rule.ruleType,
            discountPercentage: multiplier < 1 ? ((1 - multiplier) * 100) * -1 : (multiplier - 1) * 100,
            appliedAmount: currentPrice * (multiplier - 1),
            description: `${rule.name}: ${multiplier > 1 ? '+' : ''}${((multiplier - 1) * 100).toFixed(1)}% seasonal adjustment`
          };
        }
        break;

      case 'last_minute':
        const hoursAhead = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60));
        const maxHoursAhead = rule.configuration.max_hours_ahead || 24;
        if (hoursAhead <= maxHoursAhead && hoursAhead > 0) {
          const discountPercent = rule.configuration.discount_percentage || 0;
          const discountAmount = currentPrice * (discountPercent / 100);
          newPrice = currentPrice - discountAmount;
          applied = true;
          appliedRule = {
            ruleId: rule.id,
            ruleType: rule.ruleType,
            discountPercentage: discountPercent,
            appliedAmount: discountAmount,
            description: `${rule.name}: ${discountPercent}% last minute discount`
          };
        }
        break;

      case 'time_based':
        const hour = parseInt(time.split(':')[0]);
        const peakHours = rule.configuration.peak_hours || [9, 10, 11, 17, 18, 19];
        const offPeakDiscount = rule.configuration.off_peak_discount || 0;
        if (!peakHours.includes(hour) && offPeakDiscount > 0) {
          const discountAmount = currentPrice * (offPeakDiscount / 100);
          newPrice = currentPrice - discountAmount;
          applied = true;
          appliedRule = {
            ruleId: rule.id,
            ruleType: rule.ruleType,
            discountPercentage: offPeakDiscount,
            appliedAmount: discountAmount,
            description: `${rule.name}: ${offPeakDiscount}% off-peak discount`
          };
        }
        break;

      case 'demand_based':
        // This would require booking data to calculate demand
        // For now, implementing a simple version
        const demandMultiplier = rule.configuration.high_demand_multiplier || 1.2;
        if (demandMultiplier > 1.0) {
          newPrice = currentPrice * demandMultiplier;
          applied = true;
          appliedRule = {
            ruleId: rule.id,
            ruleType: rule.ruleType,
            discountPercentage: (demandMultiplier - 1) * 100,
            appliedAmount: currentPrice * (demandMultiplier - 1),
            description: `${rule.name}: High demand pricing`
          };
        }
        break;
    }

    return { applied, newPrice, appliedRule };
  }

  /**
   * Get pricing analytics
   */
  async getPricingAnalytics(serviceId?: string): Promise<{
    totalRules: number;
    activeRules: number;
    ruleBreakdown: Record<string, number>;
    averageDiscount: number;
    mostUsedRule: string;
  }> {
    try {
      let query = supabase
        .from('pricing_rules')
        .select('*');

      if (serviceId) {
        query = query.eq('service_id', serviceId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const activeRules = data?.filter(rule => rule.is_active) || [];
      const ruleBreakdown = data?.reduce((acc, rule) => {
        acc[rule.rule_type] = (acc[rule.rule_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Calculate average discount from rule configurations
      const discounts = activeRules
        .map(rule => {
          const config = rule.configuration;
          return config.discount_percentage || config.off_peak_discount || 0;
        })
        .filter(d => d > 0);

      const averageDiscount = discounts.length > 0
        ? discounts.reduce((a, b) => a + b, 0) / discounts.length
        : 0;

      const mostUsedRuleType = Object.entries(ruleBreakdown)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || '';

      return {
        totalRules: data?.length || 0,
        activeRules: activeRules.length,
        ruleBreakdown,
        averageDiscount,
        mostUsedRule: mostUsedRuleType
      };
    } catch (error) {
      logger.error('Error getting pricing analytics:', error);
      return {
        totalRules: 0,
        activeRules: 0,
        ruleBreakdown: {},
        averageDiscount: 0,
        mostUsedRule: ''
      };
    }
  }

  /**
   * Convert time string to minutes for comparison
   */
  private timeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Map database rule to PricingRule interface
   */
  private mapDbRuleToPricingRule(dbRule: any): PricingRule {
    return {
      id: dbRule.id,
      serviceId: dbRule.service_id,
      name: dbRule.name,
      description: dbRule.description,
      ruleType: dbRule.rule_type,
      configuration: dbRule.configuration || {},
      minGroupSize: dbRule.min_group_size,
      maxGroupSize: dbRule.max_group_size,
      validFrom: dbRule.valid_from ? new Date(dbRule.valid_from) : undefined,
      validUntil: dbRule.valid_until ? new Date(dbRule.valid_until) : undefined,
      validDays: dbRule.valid_days,
      validTimeStart: dbRule.valid_time_start,
      validTimeEnd: dbRule.valid_time_end,
      priority: dbRule.priority,
      isStackable: dbRule.is_stackable,
      isActive: dbRule.is_active
    };
  }
}

// Export singleton instance
export const dynamicPricingService = new DynamicPricingService();