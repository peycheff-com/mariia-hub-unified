import { supabase } from '@/integrations/supabase/client';

/**
 * Service to integrate loyalty program with payment system
 * Handle points redemption and discount application
 */

export interface LoyaltyDiscount {
  type: 'percentage' | 'fixed';
  value: number;
  pointsUsed: number;
  redemptionCode: string;
}

export class LoyaltyPaymentService {
  /**
   * Apply loyalty points as discount to payment
   */
  static async applyLoyaltyDiscount(
    customerId: string,
    pointsToUse: number,
    totalAmount: number
  ): Promise<LoyaltyDiscount | null> {
    try {
      // Get customer's loyalty status
      const { data: customerLoyalty, error: loyaltyError } = await supabase
        .from('customer_loyalty')
        .select('current_points, tier')
        .eq('customer_id', customerId)
        .single();

      if (loyaltyError || !customerLoyalty) {
        throw new Error('Customer not enrolled in loyalty program');
      }

      if (customerLoyalty.current_points < pointsToUse) {
        throw new Error('Insufficient loyalty points');
      }

      // Calculate discount based on tier
      const discountRate = this.getDiscountRate(customerLoyalty.tier);
      const discountValue = Math.floor(pointsToUse * discountRate);

      // Create redemption record
      const { data: redemption, error: redemptionError } = await supabase
        .from('customer_rewards')
        .insert({
          customer_id: customerId,
          reward_id: null, // Custom redemption
          points_used: pointsToUse,
          status: 'active',
          redemption_code: this.generateRedemptionCode(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        })
        .select()
        .single();

      if (redemptionError || !redemption) {
        throw new Error('Failed to create redemption record');
      }

      // Redeem the points
      const { error: redeemError } = await supabase.rpc('redeem_loyalty_points', {
        p_customer_id: customerId,
        p_program_id: (await supabase.from('loyalty_programs').select('id').eq('is_active', true).single()).data?.id,
        p_points: pointsToUse,
        p_reward_id: redemption.id,
        p_description: `Points redeemed for discount - Code: ${redemption.redemption_code}`
      });

      if (redeemError) {
        throw redeemError;
      }

      return {
        type: 'fixed',
        value: discountValue,
        pointsUsed: pointsToUse,
        redemptionCode: redemption.redemption_code
      };
    } catch (error) {
      console.error('Error applying loyalty discount:', error);
      throw error;
    }
  }

  /**
   * Redeem a specific reward from catalog
   */
  static async redeemReward(
    customerId: string,
    rewardId: string
  ): Promise<{
    redemptionCode: string;
    pointsUsed: number;
    reward: any;
  }> {
    try {
      // Get reward details
      const { data: reward, error: rewardError } = await supabase
        .from('rewards_catalog')
        .select('*')
        .eq('id', rewardId)
        .eq('is_active', true)
        .single();

      if (rewardError || !reward) {
        throw new Error('Reward not found or not available');
      }

      // Check availability
      if (reward.max_uses && reward.current_uses >= reward.max_uses) {
        throw new Error('Reward limit reached');
      }

      // Get customer's points
      const { data: customerLoyalty } = await supabase
        .from('customer_loyalty')
        .select('current_points')
        .eq('customer_id', customerId)
        .single();

      if (!customerLoyalty || customerLoyalty.current_points < reward.points_cost) {
        throw new Error('Insufficient points');
      }

      // Generate redemption code
      const redemptionCode = this.generateRedemptionCode();

      // Create customer reward record
      const { data: customerReward, error: insertError } = await supabase
        .from('customer_rewards')
        .insert({
          customer_id: customerId,
          reward_id: rewardId,
          points_used: reward.points_cost,
          status: 'active',
          redemption_code,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .select(`
          *,
          reward:rewards_catalog(*)
        `)
        .single();

      if (insertError || !customerReward) {
        throw new Error('Failed to redeem reward');
      }

      // Redeem the points
      await supabase.rpc('redeem_loyalty_points', {
        p_customer_id: customerId,
        p_program_id: (await supabase.from('loyalty_programs').select('id').eq('is_active', true).single()).data?.id,
        p_points: reward.points_cost,
        p_reward_id: rewardId,
        p_description: `Redeemed: ${reward.name}`
      });

      // Update reward usage count
      await supabase
        .from('rewards_catalog')
        .update({ current_uses: reward.current_uses + 1 })
        .eq('id', rewardId);

      return {
        redemptionCode,
        pointsUsed: reward.points_cost,
        reward: customerReward.reward
      };
    } catch (error) {
      console.error('Error redeeming reward:', error);
      throw error;
    }
  }

  /**
   * Validate and apply redemption code to payment
   */
  static async validateRedemptionCode(
    redemptionCode: string,
    customerId: string,
    cartTotal: number
  ): Promise<{
    valid: boolean;
    discount?: number;
    type?: 'percentage' | 'fixed';
    error?: string;
  }> {
    try {
      // Get redemption record
      const { data: redemption, error } = await supabase
        .from('customer_rewards')
        .select(`
          *,
          customer:customer_loyalty(customer_id),
          reward:rewards_catalog(*)
        `)
        .eq('redemption_code', redemptionCode)
        .eq('customer_id', customerId)
        .eq('status', 'active')
        .single();

      if (error || !redemption) {
        return { valid: false, error: 'Invalid redemption code' };
      }

      // Check expiry
      if (redemption.expires_at && new Date(redemption.expires_at) < new Date()) {
        return { valid: false, error: 'Redemption code expired' };
      }

      // Calculate discount based on reward type
      if (redemption.reward) {
        // Catalog reward
        if (redemption.reward.discount_type === 'percentage') {
          const discount = Math.min(
            (cartTotal * redemption.reward.discount_value) / 100,
            cartTotal
          );
          return {
            valid: true,
            discount,
            type: 'percentage'
          };
        } else {
          const discount = Math.min(redemption.reward.discount_value || 0, cartTotal);
          return {
            valid: true,
            discount,
            type: 'fixed'
          };
        }
      } else {
        // Custom points redemption (already calculated when redeemed)
        const discountRate = this.getDiscountRate(redemption.customer?.tier || 'bronze');
        const discount = redemption.points_used * discountRate;

        return {
          valid: true,
          discount,
          type: 'fixed'
        };
      }
    } catch (error) {
      console.error('Error validating redemption code:', error);
      return { valid: false, error: 'Failed to validate code' };
    }
  }

  /**
   * Mark redemption code as used
   */
  static async markRedemptionAsUsed(redemptionCode: string): Promise<void> {
    try {
      await supabase
        .from('customer_rewards')
        .update({
          status: 'used',
          used_at: new Date().toISOString()
        })
        .eq('redemption_code', redemptionCode);
    } catch (error) {
      console.error('Error marking redemption as used:', error);
      throw error;
    }
  }

  /**
   * Get available redemption options for customer
   */
  static async getRedemptionOptions(customerId: string, cartTotal: number) {
    try {
      const { data: customerLoyalty } = await supabase
        .from('customer_loyalty')
        .select('current_points, tier')
        .eq('customer_id', customerId)
        .single();

      if (!customerLoyalty) {
        return null;
      }

      const discountRate = this.getDiscountRate(customerLoyalty.tier);
      const maxPointsDiscount = Math.min(customerLoyalty.current_points, cartTotal / discountRate);

      return {
        maxPointsDiscount,
        pointsRate: discountRate,
        currentPoints: customerLoyalty.current_points,
        tier: customerLoyalty.tier
      };
    } catch (error) {
      console.error('Error getting redemption options:', error);
      return null;
    }
  }

  /**
   * Get discount rate based on tier
   */
  private static getDiscountRate(tier: string): number {
    const rates: Record<string, number> = {
      bronze: 0.01,    // 1 PLN per 100 points
      silver: 0.012,   // 1.2 PLN per 100 points
      gold: 0.015,     // 1.5 PLN per 100 points
      platinum: 0.02   // 2 PLN per 100 points
    };
    return rates[tier.toLowerCase()] || 0.01;
  }

  /**
   * Generate unique redemption code
   */
  private static generateRedemptionCode(): string {
    const prefix = 'LOYALTY';
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase();
    return `${prefix}-${random}-${timestamp}`;
  }

  /**
   * Process points refund for cancelled order
   */
  static async refundPoints(
    customerId: string,
    redemptionCode: string,
    refundReason: string
  ): Promise<void> {
    try {
      // Get redemption details
      const { data: redemption } = await supabase
        .from('customer_rewards')
        .select('*')
        .eq('redemption_code', redemptionCode)
        .eq('customer_id', customerId)
        .single();

      if (!redemption) {
        throw new Error('Redemption not found');
      }

      // Only refund if not already used
      if (redemption.status === 'used') {
        throw new Error('Cannot refund points for used redemption');
      }

      // Return the points
      const { error: earnError } = await supabase.rpc('earn_loyalty_points', {
        p_customer_id: customerId,
        p_program_id: (await supabase.from('loyalty_programs').select('id').eq('is_active', true).single()).data?.id,
        p_points: redemption.points_used,
        p_reference_id: redemption.id,
        p_reference_type: 'refund',
        p_description: `Points refunded: ${refundReason}`
      });

      if (earnError) {
        throw earnError;
      }

      // Mark redemption as refunded
      await supabase
        .from('customer_rewards')
        .update({
          status: 'refunded'
        })
        .eq('id', redemption.id);
    } catch (error) {
      console.error('Error refunding points:', error);
      throw error;
    }
  }

  /**
   * Get customer's redemption history
   */
  static async getRedemptionHistory(customerId: string, limit: number = 10) {
    try {
      const { data, error } = await supabase
        .from('customer_rewards')
        .select(`
          *,
          reward:rewards_catalog(name, description, category)
        `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting redemption history:', error);
      return [];
    }
  }
}