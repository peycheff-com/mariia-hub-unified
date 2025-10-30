import { supabase } from '@/integrations/supabase/client';
import {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate
} from '@/integrations/supabase/types';

// Type definitions for loyalty program
export type LoyaltyTier = Tables<'loyalty_tiers'>;
export type LoyaltyMember = Tables<'loyalty_members'>;
export type PointsTransaction = Tables<'points_transactions'>;
export type Reward = Tables<'rewards_catalog'>;
export type RewardRedemption = Tables<'reward_redemptions'>;
export type Referral = Tables<'referrals'>;
export type Achievement = Tables<'achievements'>;
export type MemberAchievement = Tables<'member_achievements'>;
export type LoyaltySetting = Tables<'loyalty_settings'>;

export interface LoyaltyMemberWithTier extends LoyaltyMember {
  tier?: LoyaltyTier;
}

export interface PointsTransactionWithDetails extends PointsTransaction {
  member?: LoyaltyMember;
}

export interface RewardRedemptionWithDetails extends RewardRedemption {
  reward?: Reward;
  member?: LoyaltyMember;
}

export interface ReferralWithDetails extends Referral {
  referrer_member?: LoyaltyMember;
}

export interface MemberAchievementWithDetails extends MemberAchievement {
  achievement?: Achievement;
  member?: LoyaltyMember;
}

export interface LoyaltyStats {
  currentTier: string;
  pointsToNextTier: number;
  lifetimePoints: number;
  totalVisits: number;
  totalSpend: number;
  availablePoints: number;
  expiringPoints: number;
  nextBenefit: string;
}

export interface TierBenefits {
  [key: string]: {
    name: string;
    description: string;
    icon: string;
  }[];
}

class LoyaltyService {
  // Get loyalty member by user ID
  async getLoyaltyMember(userId: string): Promise<LoyaltyMemberWithTier | null> {
    try {
      const { data, error } = await supabase
        .from('loyalty_members')
        .select(`
          *,
          tier:loyalty_tiers(*)
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Member doesn't exist, create one
          return await this.createLoyaltyMember(userId);
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching loyalty member:', error);
      return null;
    }
  }

  // Create new loyalty member
  async createLoyaltyMember(userId: string): Promise<LoyaltyMemberWithTier | null> {
    try {
      // Get member number from database function
      const { data: memberNumber, error: numberError } = await supabase
        .rpc('generate_member_number');

      if (numberError) throw numberError;

      // Get Bronze tier
      const { data: bronzeTier, error: tierError } = await supabase
        .from('loyalty_tiers')
        .select('*')
        .eq('level', 1)
        .single();

      if (tierError) throw tierError;

      // Create member
      const { data, error } = await supabase
        .from('loyalty_members')
        .insert({
          user_id: userId,
          tier_id: bronzeTier.id,
          member_number: memberNumber,
          current_points: 0,
          lifetime_points: 0,
          total_spend: 0,
          total_visits: 0,
          is_active: true
        })
        .select(`
          *,
          tier:loyalty_tiers(*)
        `)
        .single();

      if (error) throw error;

      // Award welcome points
      await this.earnPoints(data.id, 100, 'Welcome bonus for joining the loyalty program', 'bonus');

      return data;
    } catch (error) {
      console.error('Error creating loyalty member:', error);
      return null;
    }
  }

  // Earn points for a member
  async earnPoints(
    memberId: string,
    points: number,
    description: string,
    transactionType: string = 'earn',
    referenceType?: string,
    referenceId?: string,
    bookingId?: string
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('earn_points', {
        p_member_id: memberId,
        p_points: points,
        p_description: description,
        p_transaction_type: transactionType,
        p_reference_type: referenceType,
        p_reference_id: referenceId,
        p_booking_id: bookingId
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error earning points:', error);
      return null;
    }
  }

  // Redeem points
  async redeemPoints(
    memberId: string,
    points: number,
    description: string,
    rewardId?: string
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('redeem_points', {
        p_member_id: memberId,
        p_points: points,
        p_description: description,
        p_reward_id: rewardId
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error redeeming points:', error);
      return null;
    }
  }

  // Get points transactions for a member
  async getPointsTransactions(
    memberId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<PointsTransactionWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('points_transactions')
        .select(`
          *,
          member:loyalty_members!inner(
            user_id,
            member_number
          )
        `)
        .eq('member_id', memberId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching points transactions:', error);
      return [];
    }
  }

  // Get rewards catalog
  async getRewardsCatalog(
    category?: string,
    minTierLevel?: number,
    limit: number = 100
  ): Promise<Reward[]> {
    try {
      let query = supabase
        .from('rewards_catalog')
        .select('*')
        .eq('is_active', true);

      if (category) {
        query = query.eq('category', category);
      }

      if (minTierLevel) {
        query = query.gte('min_tier_level', minTierLevel);
      }

      const { data, error } = await query
        .order('points_cost', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching rewards catalog:', error);
      return [];
    }
  }

  // Redeem a reward
  async redeemReward(
    memberId: string,
    rewardId: string,
    notes?: string
  ): Promise<RewardRedemption | null> {
    try {
      // Get reward details
      const { data: reward, error: rewardError } = await supabase
        .from('rewards_catalog')
        .select('*')
        .eq('id', rewardId)
        .single();

      if (rewardError) throw rewardError;

      // Check if reward is still available
      if (reward.is_limited && reward.quantity_available <= 0) {
        throw new Error('Reward is no longer available');
      }

      // Generate redemption code
      const redemptionCode = `REWARD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Get member info for tier validation
      const { data: member, error: memberError } = await supabase
        .from('loyalty_members')
        .select(`
          *,
          tier:loyalty_tiers!inner(level)
        `)
        .eq('id', memberId)
        .single();

      if (memberError) throw memberError;

      // Check tier requirements
      if (member.tier && member.tier.level < reward.min_tier_level) {
        throw new Error('This reward requires a higher membership tier');
      }

      // Create redemption
      const { data: redemption, error: redemptionError } = await supabase
        .from('reward_redemptions')
        .insert({
          member_id: memberId,
          reward_id: rewardId,
          points_used: reward.points_cost,
          redemption_code: redemptionCode,
          status: 'pending',
          expiry_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
          notes: notes
        })
        .select(`
          *,
          reward:rewards_catalog(*)
        `)
        .single();

      if (redemptionError) throw redemptionError;

      // Redeem points
      await this.redeemPoints(
        memberId,
        reward.points_cost,
        `Redeemed reward: ${reward.title}`,
        rewardId
      );

      // Update reward quantity if limited
      if (reward.is_limited) {
        await supabase
          .from('rewards_catalog')
          .update({ quantity_available: reward.quantity_available - 1 })
          .eq('id', rewardId);
      }

      return redemption;
    } catch (error) {
      console.error('Error redeeming reward:', error);
      throw error;
    }
  }

  // Get member's reward redemptions
  async getMemberRedemptions(
    memberId: string,
    status?: string,
    limit: number = 50
  ): Promise<RewardRedemptionWithDetails[]> {
    try {
      let query = supabase
        .from('reward_redemptions')
        .select(`
          *,
          reward:rewards_catalog(*),
          member:loyalty_members!inner(
            user_id,
            member_number
          )
        `)
        .eq('member_id', memberId);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query
        .order('redemption_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching member redemptions:', error);
      return [];
    }
  }

  // Create referral
  async createReferral(
    memberId: string,
    refereeEmail: string,
    refereeName?: string,
    refereePhone?: string,
    referralType: string = 'client'
  ): Promise<Referral | null> {
    try {
      // Generate referral code
      const { data: referralCode, error: codeError } = await supabase
        .rpc('generate_referral_code');

      if (codeError) throw codeError;

      const { data, error } = await supabase
        .from('referrals')
        .insert({
          referrer_id: memberId,
          referee_email: refereeEmail,
          referee_name: refereeName,
          referee_phone: refereePhone,
          referral_code: referralCode,
          referral_type: referralType,
          status: 'pending',
          expiry_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days
        })
        .select('*')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating referral:', error);
      return null;
    }
  }

  // Get referrals for a member
  async getMemberReferrals(
    memberId: string,
    status?: string,
    limit: number = 50
  ): Promise<ReferralWithDetails[]> {
    try {
      let query = supabase
        .from('referrals')
        .select(`
          *,
          referrer_member:loyalty_members!inner(
            user_id,
            member_number
          )
        `)
        .eq('referrer_id', memberId);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query
        .order('referral_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching member referrals:', error);
      return [];
    }
  }

  // Check referral code validity
  async checkReferralCode(referralCode: string): Promise<Referral | null> {
    try {
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referral_code', referralCode)
        .eq('status', 'pending')
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      // Check if expired
      if (data.expiry_date && new Date(data.expiry_date) < new Date()) {
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error checking referral code:', error);
      return null;
    }
  }

  // Process successful referral
  async processSuccessfulReferral(referralId: string, refereeUserId: string): Promise<void> {
    try {
      // Update referral status
      const { data: referral, error: updateError } = await supabase
        .from('referrals')
        .update({
          status: 'completed',
          completion_date: new Date().toISOString()
        })
        .eq('id', referralId)
        .select('*')
        .single();

      if (updateError) throw updateError;

      // Award points to referrer
      await this.earnPoints(
        referral.referrer_id,
        referral.referrer_reward_points || 100,
        `Referral bonus: ${referral.referee_name || referral.referee_email} completed first booking`,
        'bonus',
        'referral',
        referralId
      );

      // Create loyalty member for referee if they don't have one
      const refereeMember = await this.getLoyaltyMember(refereeUserId);
      if (!refereeMember) {
        await this.createLoyaltyMember(refereeUserId);
      }

      // Award welcome bonus to referee
      if (refereeMember) {
        await this.earnPoints(
          refereeMember.id,
          referral.referee_reward_points || 50,
          'Welcome bonus from referral program',
          'bonus',
          'referral',
          referralId
        );
      }
    } catch (error) {
      console.error('Error processing successful referral:', error);
      throw error;
    }
  }

  // Get achievements
  async getAchievements(
    category?: string,
    isActive: boolean = true
  ): Promise<Achievement[]> {
    try {
      let query = supabase
        .from('achievements')
        .select('*')
        .eq('is_active', isActive);

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query
        .order('points_awarded', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching achievements:', error);
      return [];
    }
  }

  // Get member achievements
  async getMemberAchievements(memberId: string): Promise<MemberAchievementWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('member_achievements')
        .select(`
          *,
          achievement:achievements(*),
          member:loyalty_members!inner(
            user_id,
            member_number
          )
        `)
        .eq('member_id', memberId)
        .eq('is_displayed', true)
        .order('completed_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching member achievements:', error);
      return [];
    }
  }

  // Check and award achievements
  async checkAchievements(memberId: string, activityType: string, activityData: any): Promise<void> {
    try {
      // Get all relevant achievements
      const achievements = await this.getAchievements();

      // Get member's current achievements
      const memberAchievements = await this.getMemberAchievements(memberId);
      const completedIds = new Set(memberAchievements.map(ma => ma.achievement_id));

      for (const achievement of achievements) {
        if (completedIds.has(achievement.id) && !achievement.is_repeatable) {
          continue;
        }

        // Check if criteria is met
        if (this.checkAchievementCriteria(achievement.criteria, activityType, activityData)) {
          await this.awardAchievement(memberId, achievement.id);
        }
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  }

  // Check achievement criteria
  private checkAchievementCriteria(criteria: any, activityType: string, activityData: any): boolean {
    // This would contain complex logic to check if achievement criteria is met
    // For now, return a basic implementation
    switch (activityType) {
      case 'booking':
        return this.checkBookingAchievements(criteria, activityData);
      case 'review':
        return this.checkReviewAchievements(criteria, activityData);
      case 'referral':
        return this.checkReferralAchievements(criteria, activityData);
      default:
        return false;
    }
  }

  private checkBookingAchievements(criteria: any, bookingData: any): boolean {
    if (criteria.visits && bookingData.totalVisits >= criteria.visits) return true;
    if (criteria.beauty_services && bookingData.beautyServicesCount >= criteria.beauty_services) return true;
    if (criteria.fitness_sessions && bookingData.fitnessSessionsCount >= criteria.fitness_sessions) return true;
    if (criteria.total_spend && bookingData.totalSpend >= criteria.total_spend) return true;
    return false;
  }

  private checkReviewAchievements(criteria: any, reviewData: any): boolean {
    if (criteria.reviews && reviewData.totalReviews >= criteria.reviews) return true;
    return false;
  }

  private checkReferralAchievements(criteria: any, referralData: any): boolean {
    if (criteria.successful_referrals && referralData.successfulReferrals >= criteria.successful_referrals) return true;
    return false;
  }

  // Award achievement
  async awardAchievement(memberId: string, achievementId: string): Promise<MemberAchievement | null> {
    try {
      // Get achievement details
      const { data: achievement, error: achievementError } = await supabase
        .from('achievements')
        .select('*')
        .eq('id', achievementId)
        .single();

      if (achievementError) throw achievementError;

      // Check if already awarded
      const { data: existing, error: existingError } = await supabase
        .from('member_achievements')
        .select('*')
        .eq('member_id', memberId)
        .eq('achievement_id', achievementId)
        .single();

      if (existing && !achievement.is_repeatable) {
        return existing;
      }

      // Award achievement
      const { data, error } = await supabase
        .from('member_achievements')
        .insert({
          member_id: memberId,
          achievement_id: achievementId,
          progress_data: {},
          completed_at: new Date().toISOString(),
          points_awarded: achievement.points_awarded,
          is_displayed: true
        })
        .select(`
          *,
          achievement:achievements(*)
        `)
        .single();

      if (error) throw error;

      // Award points for achievement
      if (achievement.points_awarded > 0) {
        await this.earnPoints(
          memberId,
          achievement.points_awarded,
          `Achievement unlocked: ${achievement.name}`,
          'bonus',
          'achievement',
          achievementId
        );
      }

      return data;
    } catch (error) {
      console.error('Error awarding achievement:', error);
      return null;
    }
  }

  // Get loyalty stats
  async getLoyaltyStats(memberId: string): Promise<LoyaltyStats | null> {
    try {
      const member = await this.getLoyaltyMember(memberId);
      if (!member) return null;

      // Get all tiers
      const { data: tiers, error: tiersError } = await supabase
        .from('loyalty_tiers')
        .select('*')
        .eq('is_active', true)
        .order('level', { ascending: true });

      if (tiersError) throw tiersError;

      const currentTierIndex = tiers.findIndex(t => t.id === member.tier_id);
      const nextTier = tiers[currentTierIndex + 1];

      let pointsToNextTier = 0;
      let nextBenefit = '';

      if (nextTier) {
        const requiredPoints = Math.max(
          nextTier.min_points,
          nextTier.min_visits * 50, // Estimate 50 points per visit
          Number(nextTier.min_spend) * 0.5 // Estimate 0.5 points per PLN spent
        );
        pointsToNextTier = Math.max(0, requiredPoints - member.lifetime_points);
        nextBenefit = nextTier.benefits[0] || 'Enhanced benefits';
      }

      // Get expiring points
      const { data: expiringPoints, error: expiringError } = await supabase
        .from('points_transactions')
        .select('points')
        .eq('member_id', memberId)
        .eq('transaction_type', 'earn')
        .lt('expires_at', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()) // Next 30 days
        .gt('expires_at', new Date().toISOString());

      const totalExpiring = expiringPoints?.reduce((sum, t) => sum + t.points, 0) || 0;

      return {
        currentTier: member.tier?.name || 'Bronze',
        pointsToNextTier,
        lifetimePoints: member.lifetime_points,
        totalVisits: member.total_visits,
        totalSpend: Number(member.total_spend),
        availablePoints: member.current_points,
        expiringPoints: totalExpiring,
        nextBenefit
      };
    } catch (error) {
      console.error('Error fetching loyalty stats:', error);
      return null;
    }
  }

  // Get loyalty settings
  async getLoyaltySettings(key?: string): Promise<any> {
    try {
      let query = supabase
        .from('loyalty_settings')
        .select('*')
        .eq('is_active', true);

      if (key) {
        query = query.eq('key', key);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (key) {
        return data[0]?.value || null;
      }

      const settings: any = {};
      data.forEach(setting => {
        settings[setting.key] = setting.value;
      });

      return settings;
    } catch (error) {
      console.error('Error fetching loyalty settings:', error);
      return key ? null : {};
    }
  }

  // Update member preferences
  async updateMemberPreferences(
    memberId: string,
    preferences: any
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('loyalty_members')
        .update({ preferences })
        .eq('id', memberId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating member preferences:', error);
      return false;
    }
  }

  // Get tier benefits by level
  async getTierBenefits(): Promise<TierBenefits> {
    try {
      const { data: tiers, error } = await supabase
        .from('loyalty_tiers')
        .select('*')
        .eq('is_active', true)
        .order('level', { ascending: true });

      if (error) throw error;

      const benefits: TierBenefits = {};
      tiers.forEach(tier => {
        benefits[tier.name] = tier.benefits.map((benefit: string, index: number) => ({
          name: benefit,
          description: benefit,
          icon: `tier-${tier.level.toLowerCase()}-${index + 1}`
        }));
      });

      return benefits;
    } catch (error) {
      console.error('Error fetching tier benefits:', error);
      return {};
    }
  }
}

export const loyaltyService = new LoyaltyService();