import { supabase } from '@/integrations/supabase/client';
import {
  LoyaltyPointsParams,
  CustomerLoyaltyStatus,
  ApiResponse,
  LoyaltyProgram,
  LoyaltyTier,
  CustomerPoints,
  PointsTransaction,
  Reward,
  RewardRedemption,
  ReferralProgram,
  Referral,
  ReferralReward,
  ReferralCodeGenerationParams,
  ReferralStatus
} from '@/types/payment-loyalty';

export class LoyaltyProgramService {
  // ========================================
  // POINTS MANAGEMENT
  // ========================================

  /**
   * Award points to a customer
   */
  async awardPoints(params: LoyaltyPointsParams): Promise<ApiResponse<PointsTransaction>> {
    try {
      // Get or create customer points record
      const customerPoints = await this.getOrCreateCustomerPoints(params.userId);

      if (!customerPoints.data) {
        return {
          data: null,
          error: {
            message: 'Failed to get customer points record',
            code: 'CUSTOMER_POINTS_ERROR'
          },
          success: false
        };
      }

      // Calculate expiration (1 year from earning)
      const expiresAt = params.expiresAt || new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      // Create points transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('points_transactions')
        .insert({
          customer_points_id: customerPoints.data.id,
          booking_id: params.bookingId,
          transaction_type: 'earned',
          points: params.points,
          balance_before: customerPoints.data.current_balance,
          balance_after: customerPoints.data.current_balance + params.points,
          description: params.description || 'Points earned from booking',
          expires_at: expiresAt.toISOString(),
          metadata: {
            awarded_at: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (transactionError) {
        return {
          data: null,
          error: {
            message: 'Failed to create points transaction',
            code: 'TRANSACTION_ERROR',
            details: transactionError
          },
          success: false
        };
      }

      // Update customer points balance
      const newBalance = customerPoints.data.current_balance + params.points;
      const newTotalEarned = customerPoints.data.total_earned + params.points;

      await this.updateCustomerPointsBalance(customerPoints.data.id, {
        current_balance: newBalance,
        total_earned: newTotalEarned
      });

      // Check for tier upgrade
      await this.checkAndUpgradeTier(customerPoints.data.user_id);

      return {
        data: transaction,
        error: null,
        success: true
      };
    } catch (error) {
      console.error('Error awarding points:', error);
      return {
        data: null,
        error: {
          message: 'Failed to award points',
          code: 'AWARD_ERROR'
        },
        success: false
      };
    }
  }

  /**
   * Redeem points for rewards
   */
  async redeemPoints(userId: string, pointsToRedeem: number, rewardId?: string, description?: string): Promise<ApiResponse<PointsTransaction>> {
    try {
      // Get customer points record
      const customerPoints = await this.getOrCreateCustomerPoints(userId);

      if (!customerPoints.data) {
        return {
          data: null,
          error: {
            message: 'Failed to get customer points record',
            code: 'CUSTOMER_POINTS_ERROR'
          },
          success: false
        };
      }

      // Check sufficient balance
      if (customerPoints.data.current_balance < pointsToRedeem) {
        return {
          data: null,
          error: {
            message: 'Insufficient points balance',
            code: 'INSUFFICIENT_POINTS'
          },
          success: false
        };
      }

      // Create points transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('points_transactions')
        .insert({
          customer_points_id: customerPoints.data.id,
          transaction_type: 'redeemed',
          points: -pointsToRedeem,
          balance_before: customerPoints.data.current_balance,
          balance_after: customerPoints.data.current_balance - pointsToRedeem,
          description: description || 'Points redeemed for reward',
          metadata: {
            reward_id: rewardId,
            redeemed_at: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (transactionError) {
        return {
          data: null,
          error: {
            message: 'Failed to redeem points',
            code: 'REDEEM_ERROR',
            details: transactionError
          },
          success: false
        };
      }

      // Update customer points balance
      const newBalance = customerPoints.data.current_balance - pointsToRedeem;
      const newTotalRedeemed = customerPoints.data.total_redeemed + pointsToRedeem;

      await this.updateCustomerPointsBalance(customerPoints.data.id, {
        current_balance: newBalance,
        total_redeemed: newTotalRedeemed
      });

      return {
        data: transaction,
        error: null,
        success: true
      };
    } catch (error) {
      console.error('Error redeeming points:', error);
      return {
        data: null,
        error: {
          message: 'Failed to redeem points',
          code: 'REDEEM_ERROR'
        },
        success: false
      };
    }
  }

  /**
   * Get or create customer points record
   */
  private async getOrCreateCustomerPoints(userId: string): Promise<ApiResponse<CustomerPoints>> {
    try {
      // Get active loyalty program
      const { data: program, error: programError } = await supabase
        .from('loyalty_program')
        .select('*')
        .eq('is_active', true)
        .single();

      if (programError || !program) {
        return {
          data: null,
          error: {
            message: 'No active loyalty program found',
            code: 'NO_ACTIVE_PROGRAM'
          },
          success: false
        };
      }

      // Try to get existing customer points
      const { data: customerPoints, error: customerError } = await supabase
        .from('customer_points')
        .select('*')
        .eq('user_id', userId)
        .eq('program_id', program.id)
        .single();

      if (customerError && customerError.code === 'PGRST116') {
        // Create new customer points record
        const { data: newCustomerPoints, error: createError } = await supabase
          .from('customer_points')
          .insert({
            user_id: userId,
            current_balance: 0,
            total_earned: 0,
            total_redeemed: 0,
            program_id: program.id
          })
          .select()
          .single();

        if (createError) {
          return {
            data: null,
            error: {
              message: 'Failed to create customer points record',
              code: 'CREATE_ERROR',
              details: createError
            },
            success: false
          };
        }

        return {
          data: newCustomerPoints,
          error: null,
          success: true
        };
      }

      return {
        data: customerPoints,
        error: customerError,
        success: !customerError
      };
    } catch (error) {
      console.error('Error getting customer points:', error);
      return {
        data: null,
        error: {
          message: 'Failed to get customer points',
          code: 'GET_ERROR'
        },
        success: false
      };
    }
  }

  /**
   * Update customer points balance
   */
  private async updateCustomerPointsBalance(customerPointsId: string, updates: Partial<CustomerPoints>): Promise<void> {
    await supabase
      .from('customer_points')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', customerPointsId);
  }

  /**
   * Check and upgrade customer tier if needed
   */
  private async checkAndUpgradeTier(userId: string): Promise<void> {
    try {
      // Get customer points with current tier
      const { data: customerPoints, error: customerError } = await supabase
        .from('customer_points')
        .select(`
          *,
          loyalty_tiers!inner(
            id,
            name,
            min_points,
            max_points,
            points_multiplier,
            benefits
          )
        `)
        .eq('user_id', userId)
        .single();

      if (customerError || !customerPoints) {
        return;
      }

      // Get all tiers for the program, ordered by min_points
      const { data: tiers } = await supabase
        .from('loyalty_tiers')
        .select('*')
        .eq('program_id', customerPoints.program_id)
        .order('min_points', { ascending: false });

      if (!tiers || tiers.length === 0) {
        return;
      }

      // Find the highest tier the customer qualifies for
      const eligibleTier = tiers.find(tier =>
        customerPoints.total_earned >= tier.min_points
      );

      // Upgrade if different from current tier
      if (eligibleTier && eligibleTier.id !== customerPoints.tier_id) {
        await supabase
          .from('customer_points')
          .update({
            tier_id: eligibleTier.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', customerPoints.id);

        // Create points transaction for tier upgrade
        await supabase
          .from('points_transactions')
          .insert({
            customer_points_id: customerPoints.id,
            transaction_type: 'earned',
            points: 0,
            balance_before: customerPoints.current_balance,
            balance_after: customerPoints.current_balance,
            description: `Upgraded to ${eligibleTier.name} tier`,
            metadata: {
              tier_upgrade: true,
              new_tier: eligibleTier.name,
              new_tier_id: eligibleTier.id
            }
          });
      }
    } catch (error) {
      console.error('Error checking tier upgrade:', error);
    }
  }

  // ========================================
  // CUSTOMER LOYALTY STATUS
  // ========================================

  /**
   * Get comprehensive customer loyalty status
   */
  async getCustomerLoyaltyStatus(userId: string): Promise<ApiResponse<CustomerLoyaltyStatus>> {
    try {
      // Get customer points with tier info
      const { data: customerPoints, error: customerError } = await supabase
        .from('customer_points')
        .select(`
          *,
          loyalty_tiers (
            id,
            name,
            min_points,
            max_points,
            points_multiplier,
            benefits
          ),
          loyalty_program (
            id,
            name,
            points_per_currency
          )
        `)
        .eq('user_id', userId)
        .single();

      if (customerError || !customerPoints) {
        return {
          data: null,
          error: {
            message: 'Customer loyalty data not found',
            code: 'NOT_FOUND'
          },
          success: false
        };
      }

      // Get next tier
      const { data: nextTier } = await supabase
        .from('loyalty_tiers')
        .select('*')
        .eq('program_id', customerPoints.program_id)
        .gt('min_points', customerPoints.total_earned)
        .order('min_points', { ascending: true })
        .limit(1)
        .single();

      // Calculate points to next tier
      const pointsToNextTier = nextTier
        ? nextTier.min_points - customerPoints.total_earned
        : 0;

      // Get expiring points (next 30 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const { data: expiringPoints } = await supabase
        .from('points_transactions')
        .select('points, expires_at')
        .eq('customer_points_id', customerPoints.id)
        .eq('transaction_type', 'earned')
        .gt('points', 0)
        .lte('expires_at', thirtyDaysFromNow.toISOString())
        .gt('expires_at', new Date().toISOString());

      // Group expiring points by date
      const expiringByDate = expiringPoints?.reduce((acc: any, point) => {
        const date = new Date(point.expires_at).toLocaleDateString();
        if (!acc[date]) {
          acc[date] = 0;
        }
        acc[date] += point.points;
        return acc;
      }, {}) || {};

      const pointsExpiring = Object.entries(expiringByDate).map(([date, amount]) => ({
        amount: amount as number,
        expiresAt: date
      }));

      return {
        data: {
          customerId: userId,
          currentPoints: customerPoints.current_balance,
          totalEarned: customerPoints.total_earned,
          totalRedeemed: customerPoints.total_redeemed,
          currentTier: customerPoints.loyalty_tiers,
          nextTier: nextTier || null,
          pointsToNextTier,
          benefits: customerPoints.loyalty_tiers?.benefits || {},
          pointsExpiring: pointsExpiring.length > 0 ? pointsExpiring : undefined
        },
        error: null,
        success: true
      };
    } catch (error) {
      console.error('Error getting customer loyalty status:', error);
      return {
        data: null,
        error: {
          message: 'Failed to get customer loyalty status',
          code: 'STATUS_ERROR'
        },
        success: false
      };
    }
  }

  // ========================================
  // REWARDS MANAGEMENT
  // ========================================

  /**
   * Get available rewards for customer
   */
  async getAvailableRewards(userId: string, serviceType?: string): Promise<ApiResponse<Reward[]>> {
    try {
      // Get customer points
      const customerPoints = await this.getOrCreateCustomerPoints(userId);

      if (!customerPoints.data) {
        return {
          data: [],
          error: null,
          success: true
        };
      }

      // Build query
      let query = supabase
        .from('rewards')
        .select('*')
        .eq('is_active', true)
        .lte('points_cost', customerPoints.data.current_balance);

      // Filter by service type if specified
      if (serviceType) {
        query = query.contains('applicable_service_types', [serviceType]);
      }

      // Filter by valid_until date
      query = query.or('valid_until.is.null,valid_until.gt.' + new Date().toISOString());

      const { data: rewards, error: rewardsError } = await query.order('points_cost', { ascending: true });

      return {
        data: rewards || [],
        error: rewardsError,
        success: !rewardsError
      };
    } catch (error) {
      console.error('Error getting available rewards:', error);
      return {
        data: [],
        error: {
          message: 'Failed to get available rewards',
          code: 'REWARDS_ERROR'
        },
        success: false
      };
    }
  }

  /**
   * Redeem a reward
   */
  async redeemReward(userId: string, rewardId: string): Promise<ApiResponse<RewardRedemption>> {
    try {
      // Get reward details
      const { data: reward, error: rewardError } = await supabase
        .from('rewards')
        .select('*')
        .eq('id', rewardId)
        .eq('is_active', true)
        .single();

      if (rewardError || !reward) {
        return {
          data: null,
          error: {
            message: 'Reward not found or not available',
            code: 'REWARD_NOT_FOUND'
          },
          success: false
        };
      }

      // Check stock if applicable
      if (reward.stock_quantity !== null && reward.stock_quantity <= 0) {
        return {
          data: null,
          error: {
            message: 'Reward is out of stock',
            code: 'OUT_OF_STOCK'
          },
          success: false
        };
      }

      // Check expiration
      if (reward.valid_until && new Date(reward.valid_until) < new Date()) {
        return {
          data: null,
          error: {
            message: 'Reward has expired',
            code: 'REWARD_EXPIRED'
          },
          success: false
        };
      }

      // Redeem points
      const pointsResult = await this.redeemPoints(
        userId,
        reward.points_cost,
        rewardId,
        `Redeemed ${reward.name}`
      );

      if (!pointsResult.success || !pointsResult.data) {
        return {
          data: null,
          error: pointsResult.error || {
            message: 'Failed to redeem points',
            code: 'POINTS_REDEEM_ERROR'
          },
          success: false
        };
      }

      // Generate redemption code
      const redemptionCode = this.generateRedemptionCode();

      // Set expiration (90 days from redemption)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 90);

      // Create reward redemption
      const { data: redemption, error: redemptionError } = await supabase
        .from('reward_redemptions')
        .insert({
          reward_id: rewardId,
          user_id: userId,
          points_used: reward.points_cost,
          status: 'issued',
          expires_at: expiresAt.toISOString(),
          redemption_code: redemptionCode,
          metadata: {
            reward_name: reward.name,
            reward_type: reward.type,
            redeemed_at: new Date().toISOString()
          }
        })
        .select(`
          *,
          rewards (
            name,
            type,
            discount_type,
            discount_value
          )
        `)
        .single();

      if (redemptionError) {
        // Rollback points transaction
        await this.awardPoints({
          userId,
          points: reward.points_cost,
          type: 'earned',
          description: 'Points refunded due to reward redemption error'
        });

        return {
          data: null,
          error: {
            message: 'Failed to create reward redemption',
            code: 'REDEMPTION_ERROR',
            details: redemptionError
          },
          success: false
        };
      }

      // Update reward stock if applicable
      if (reward.stock_quantity !== null) {
        await supabase
          .from('rewards')
          .update({ stock_quantity: reward.stock_quantity - 1 })
          .eq('id', rewardId);
      }

      return {
        data: redemption,
        error: null,
        success: true
      };
    } catch (error) {
      console.error('Error redeeming reward:', error);
      return {
        data: null,
        error: {
          message: 'Failed to redeem reward',
          code: 'REDEEM_ERROR'
        },
        success: false
      };
    }
  }

  /**
   * Generate unique redemption code
   */
  private generateRedemptionCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'REWARD-';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // ========================================
  // REFERRAL PROGRAM
  // ========================================

  /**
   * Generate referral code for user
   */
  async generateReferralCode(params: ReferralCodeGenerationParams): Promise<ApiResponse<{ referral: Referral; code: string }>> {
    try {
      // Get active referral program
      const { data: program, error: programError } = await supabase
        .from('referral_program')
        .select('*')
        .eq('is_active', true)
        .single();

      if (programError || !program) {
        return {
          data: null,
          error: {
            message: 'No active referral program found',
            code: 'NO_ACTIVE_PROGRAM'
          },
          success: false
        };
      }

      // Generate unique referral code
      const code = params.customCode || this.generateReferralCodeString();

      // Check if code already exists
      const { data: existingReferral } = await supabase
        .from('referrals')
        .select('id')
        .eq('referral_code', code)
        .single();

      if (existingReferral) {
        return {
          data: null,
          error: {
            message: 'Referral code already exists',
            code: 'CODE_EXISTS'
          },
          success: false
        };
      }

      // Set expiration
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (params.expiresIn || 365)); // Default 1 year

      // Create referral record
      const { data: referral, error: referralError } = await supabase
        .from('referrals')
        .insert({
          program_id: params.programId || program.id,
          referrer_id: params.referrerId,
          referral_code: code,
          status: 'pending',
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

      if (referralError) {
        return {
          data: null,
          error: {
            message: 'Failed to create referral',
            code: 'REFERRAL_CREATE_ERROR',
            details: referralError
          },
          success: false
        };
      }

      return {
        data: {
          referral,
          code
        },
        error: null,
        success: true
      };
    } catch (error) {
      console.error('Error generating referral code:', error);
      return {
        data: null,
        error: {
          message: 'Failed to generate referral code',
          code: 'GENERATE_ERROR'
        },
        success: false
      };
    }
  }

  /**
   * Process referral completion
   */
  async completeReferral(referralCode: string, refereeId: string): Promise<ApiResponse<Referral>> {
    try {
      // Get referral record
      const { data: referral, error: referralError } = await supabase
        .from('referrals')
        .select(`
          *,
          referral_program (
            referrer_reward_points,
            referee_reward_points,
            referrer_discount_type,
            referrer_discount_value,
            referee_discount_type,
            referee_discount_value
          )
        `)
        .eq('referral_code', referralCode)
        .eq('status', 'pending')
        .single();

      if (referralError || !referral) {
        return {
          data: null,
          error: {
            message: 'Invalid or expired referral code',
            code: 'INVALID_REFERRAL'
          },
          success: false
        };
      }

      // Update referral record
      const { data: updatedReferral, error: updateError } = await supabase
        .from('referrals')
        .update({
          referee_id,
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', referral.id)
        .select()
        .single();

      if (updateError) {
        return {
          data: null,
          error: {
            message: 'Failed to complete referral',
            code: 'COMPLETE_ERROR',
            details: updateError
          },
          success: false
        };
      }

      // Award points to referrer
      if (referral.referral_program.referrer_reward_points > 0) {
        await this.awardPoints({
          userId: referral.referrer_id,
          points: referral.referral_program.referrer_reward_points,
          type: 'earned',
          description: `Referral reward for inviting ${refereeId}`
        });
      }

      // Award points to referee
      if (referral.referral_program.referee_reward_points > 0) {
        await this.awardPoints({
          userId: refereeId,
          points: referral.referral_program.referee_reward_points,
          type: 'earned',
          description: 'Welcome reward from referral'
        });
      }

      // Create discount rewards if applicable
      const rewardsToCreate = [];

      // Referrer discount
      if (referral.referral_program.referrer_discount_type && referral.referral_program.referrer_discount_value) {
        rewardsToCreate.push({
          referral_id: referral.id,
          recipient_id: referral.referrer_id,
          reward_type: 'discount',
          reward_value: referral.referral_program.referrer_discount_value,
          discount_code: this.generateDiscountCode('REF'),
          expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days
        });
      }

      // Referee discount
      if (referral.referral_program.referee_discount_type && referral.referral_program.referee_discount_value) {
        rewardsToCreate.push({
          referral_id: referral.id,
          recipient_id: refereeId,
          reward_type: 'discount',
          reward_value: referral.referral_program.referee_discount_value,
          discount_code: this.generateDiscountCode('WELCOME'),
          expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days
        });
      }

      if (rewardsToCreate.length > 0) {
        await supabase
          .from('referral_rewards')
          .insert(rewardsToCreate);
      }

      return {
        data: updatedReferral,
        error: null,
        success: true
      };
    } catch (error) {
      console.error('Error completing referral:', error);
      return {
        data: null,
        error: {
          message: 'Failed to complete referral',
          code: 'COMPLETE_ERROR'
        },
        success: false
      };
    }
  }

  /**
   * Get referral status for user
   */
  async getReferralStatus(userId: string): Promise<ApiResponse<ReferralStatus>> {
    try {
      // Get referrals where user is referrer
      const { data: referrals, error: referralsError } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', userId)
        .order('created_at', { ascending: false });

      if (referralsError) {
        return {
          data: null,
          error: {
            message: 'Failed to get referrals',
            code: 'REFERRALS_ERROR'
          },
          success: false
        };
      }

      // Get referral rewards
      const { data: rewards } = await supabase
        .from('referral_rewards')
        .select('*')
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false });

      // Calculate totals
      const totalReferrals = referrals?.length || 0;
      const completedReferrals = referrals?.filter(r => r.status === 'completed').length || 0;
      const pendingReferrals = referrals?.filter(r => r.status === 'pending').length || 0;
      const totalRewardsEarned = rewards?.reduce((sum, reward) => {
        if (reward.reward_type === 'points' && reward.status === 'issued') {
          return sum + (reward.points_awarded || 0);
        }
        return sum;
      }, 0) || 0;

      // Get user's referral code
      const activeReferral = referrals?.find(r => r.status === 'pending');

      return {
        data: {
          referralCode: activeReferral?.referral_code || '',
          totalReferrals,
          completedReferrals,
          pendingReferrals,
          totalRewardsEarned,
          rewards: rewards || []
        },
        error: null,
        success: true
      };
    } catch (error) {
      console.error('Error getting referral status:', error);
      return {
        data: null,
        error: {
          message: 'Failed to get referral status',
          code: 'STATUS_ERROR'
        },
        success: false
      };
    }
  }

  /**
   * Generate unique referral code string
   */
  private generateReferralCodeString(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Generate discount code
   */
  private generateDiscountCode(prefix: string): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = prefix + '-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}

// Export singleton instance
export const loyaltyProgramService = new LoyaltyProgramService();