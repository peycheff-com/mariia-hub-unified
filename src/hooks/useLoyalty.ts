import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useState } from 'react';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface LoyaltyTier {
  name: string;
  level: number;
  min_points: number;
  benefits: Record<string, any>;
  point_multiplier: number;
  color: string;
  icon: string | null;
}

export interface CustomerLoyalty {
  id: string;
  customer_id: string;
  program_id: string;
  current_points: number;
  tier: string;
  tier_expires_at: string | null;
  total_earned: number;
  total_redeemed: number;
  last_activity: string;
  created_at: string;
  updated_at: string;
}

export interface PointTransaction {
  id: string;
  customer_id: string;
  program_id: string;
  points: number;
  transaction_type: 'earned' | 'redeemed' | 'expired' | 'adjusted';
  reference_id: string | null;
  reference_type: string | null;
  description: string | null;
  metadata: Record<string, any>;
  expires_at: string | null;
  created_at: string;
}

export interface AchievementBadge {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  category: string;
  criteria: Record<string, any>;
  points_awarded: number;
  is_active: boolean;
  created_at: string;
}

export interface CustomerAchievement {
  id: string;
  customer_id: string;
  badge_id: string;
  earned_at: string;
  metadata: Record<string, any>;
  badge: AchievementBadge;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string | null;
  referral_code: string;
  status: 'pending' | 'completed' | 'expired';
  reward_points: number;
  referrer_reward_points: number;
  completed_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface Reward {
  id: string;
  program_id: string;
  name: string;
  description: string | null;
  category: string;
  points_cost: number;
  discount_value: number | null;
  discount_type: 'percentage' | 'fixed';
  max_uses: number | null;
  current_uses: number;
  is_active: boolean;
  is_limited: boolean;
  available_from: string | null;
  available_until: string | null;
  image_url: string | null;
  terms: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerReward {
  id: string;
  customer_id: string;
  reward_id: string;
  points_used: number;
  status: 'active' | 'used' | 'expired';
  redemption_code: string | null;
  used_at: string | null;
  expires_at: string | null;
  created_at: string;
  reward: Reward;
}

export interface CustomerStreak {
  id: string;
  customer_id: string;
  streak_type: string;
  current_streak: number;
  longest_streak: number;
  last_activity: string | null;
  next_bonus_threshold: number;
  created_at: string;
  updated_at: string;
}

export function useLoyalty() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isGeneratingReferral, setIsGeneratingReferral] = useState(false);

  // Get loyalty program info
  const { data: loyaltyProgram } = useQuery({
    queryKey: ['loyalty-program'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loyalty_programs')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Get customer loyalty status
  const { data: customerLoyalty, isLoading: isLoadingLoyalty } = useQuery({
    queryKey: ['customer-loyalty', user?.id],
    queryFn: async () => {
      if (!user || !loyaltyProgram) return null;

      const { data, error } = await supabase
        .from('customer_loyalty')
        .select('*')
        .eq('customer_id', user.id)
        .eq('program_id', loyaltyProgram.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      // Create loyalty record if doesn't exist
      if (!data && loyaltyProgram) {
        const { data: newLoyalty, error: insertError } = await supabase
          .from('customer_loyalty')
          .insert({
            customer_id: user.id,
            program_id: loyaltyProgram.id,
            tier: 'bronze'
          })
          .select()
          .single();

        if (insertError) throw insertError;
        return newLoyalty;
      }

      return data;
    },
    enabled: !!user && !!loyaltyProgram,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Get all tiers
  const { data: tiers } = useQuery({
    queryKey: ['loyalty-tiers', loyaltyProgram?.id],
    queryFn: async () => {
      if (!loyaltyProgram) return [];

      const { data, error } = await supabase
        .from('loyalty_tiers')
        .select('*')
        .eq('program_id', loyaltyProgram.id)
        .order('level');

      if (error) throw error;
      return data as LoyaltyTier[];
    },
    enabled: !!loyaltyProgram,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Get point transactions
  const { data: transactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['point-transactions', user?.id],
    queryFn: async () => {
      if (!user || !loyaltyProgram) return [];

      const { data, error } = await supabase
        .from('point_transactions')
        .select('*')
        .eq('customer_id', user.id)
        .eq('program_id', loyaltyProgram.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as PointTransaction[];
    },
    enabled: !!user && !!loyaltyProgram,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Get achievements
  const { data: achievements, isLoading: isLoadingAchievements } = useQuery({
    queryKey: ['customer-achievements', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('customer_achievements')
        .select(`
          *,
          badge:achievement_badges(*)
        `)
        .eq('customer_id', user.id)
        .order('earned_at', { ascending: false });

      if (error) throw error;
      return data as CustomerAchievement[];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Get available badges to earn
  const { data: availableBadges } = useQuery({
    queryKey: ['available-badges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('achievement_badges')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true });

      if (error) throw error;
      return data as AchievementBadge[];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Get customer's referrals
  const { data: referrals, isLoading: isLoadingReferrals } = useQuery({
    queryKey: ['customer-referrals', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Referral[];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Get customer's referral code
  const { data: referralCode, refetch: refetchReferralCode } = useQuery({
    queryKey: ['referral-code', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('referrals')
        .select('referral_code')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data?.referral_code || null;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Get rewards catalog
  const { data: rewardsCatalog, isLoading: isLoadingRewards } = useQuery({
    queryKey: ['rewards-catalog', loyaltyProgram?.id],
    queryFn: async () => {
      if (!loyaltyProgram) return [];

      const { data, error } = await supabase
        .from('rewards_catalog')
        .select('*')
        .eq('program_id', loyaltyProgram.id)
        .eq('is_active', true)
        .or(`available_from.is.null,available_from.lte.${new Date().toISOString()}`)
        .or(`available_until.is.null,available_until.gte.${new Date().toISOString()}`)
        .order('points_cost', { ascending: true });

      if (error) throw error;
      return data as Reward[];
    },
    enabled: !!loyaltyProgram,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Get customer's redeemed rewards
  const { data: customerRewards, isLoading: isLoadingCustomerRewards } = useQuery({
    queryKey: ['customer-rewards', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('customer_rewards')
        .select(`
          *,
          reward:rewards_catalog(*)
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CustomerReward[];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Get customer streaks
  const { data: streaks } = useQuery({
    queryKey: ['customer-streaks', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('customer_streaks')
        .select('*')
        .eq('customer_id', user.id);

      if (error) throw error;
      return data as CustomerStreak[];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Generate referral code mutation
  const generateReferralMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');

      setIsGeneratingReferral(true);

      const { data, error } = await supabase
        .rpc('generate_referral_code', { p_customer_id: user.id });

      if (error) throw error;

      // Create referral record
      const { data: referral, error: referralError } = await supabase
        .from('referrals')
        .insert({
          referrer_id: user.id,
          referral_code: data,
          expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days
        })
        .select()
        .single();

      if (referralError) throw referralError;
      return referral;
    },
    onSuccess: () => {
      toast.success('Referral code generated successfully!');
      refetchReferralCode();
      queryClient.invalidateQueries({ queryKey: ['customer-referrals'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to generate referral code');
    },
    onSettled: () => {
      setIsGeneratingReferral(false);
    }
  });

  // Redeem reward mutation
  const redeemRewardMutation = useMutation({
    mutationFn: async ({ rewardId, pointsCost }: { rewardId: string; pointsCost: number }) => {
      if (!user || !loyaltyProgram || !customerLoyalty) {
        throw new Error('Missing required data');
      }

      if (customerLoyalty.current_points < pointsCost) {
        throw new Error('Insufficient points');
      }

      // Check if reward is still available
      const { data: reward, error: rewardError } = await supabase
        .from('rewards_catalog')
        .select('*')
        .eq('id', rewardId)
        .eq('is_active', true)
        .single();

      if (rewardError || !reward) throw new Error('Reward not available');

      if (reward.max_uses && reward.current_uses >= reward.max_uses) {
        throw new Error('Reward limit reached');
      }

      // Generate redemption code
      const redemptionCode = `REWARD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Start transaction
      const { data: transaction, error: transactionError } = await supabase
        .rpc('redeem_loyalty_points', {
          p_customer_id: user.id,
          p_program_id: loyaltyProgram.id,
          p_points: pointsCost,
          p_reward_id: rewardId,
          p_description: `Redeemed: ${reward.name}`
        });

      if (transactionError) throw transactionError;

      // Create customer reward record
      const { data: customerReward, error: rewardInsertError } = await supabase
        .from('customer_rewards')
        .insert({
          customer_id: user.id,
          reward_id: rewardId,
          points_used: pointsCost,
          redemption_code: redemptionCode,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        })
        .select(`
          *,
          reward:rewards_catalog(*)
        `)
        .single();

      if (rewardInsertError) throw rewardInsertError;

      // Update reward usage count
      await supabase
        .from('rewards_catalog')
        .update({ current_uses: reward.current_uses + 1 })
        .eq('id', rewardId);

      return customerReward;
    },
    onSuccess: (data) => {
      toast.success(`Successfully redeemed ${data.reward.name}!`);
      queryClient.invalidateQueries({ queryKey: ['customer-loyalty'] });
      queryClient.invalidateQueries({ queryKey: ['customer-rewards'] });
      queryClient.invalidateQueries({ queryKey: ['point-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['rewards-catalog'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to redeem reward');
    }
  });

  // Get tier info for current customer
  const currentTier = tiers?.find(t => t.name === customerLoyalty?.tier);

  // Get next tier info
  const nextTier = tiers?.find(t => t.level === (currentTier?.level || 0) + 1);

  // Calculate progress to next tier
  const progressToNextTier = nextTier && customerLoyalty
    ? ((customerLoyalty.total_earned - (currentTier?.min_points || 0)) /
       (nextTier.min_points - (currentTier?.min_points || 0))) * 100
    : 0;

  // Check if tier is expiring soon
  const isTierExpiringSoon = customerLoyalty?.tier_expires_at
    ? new Date(customerLoyalty.tier_expires_at).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000 // 30 days
    : false;

  return {
    // Data
    loyaltyProgram,
    customerLoyalty,
    tiers,
    currentTier,
    nextTier,
    progressToNextTier,
    isTierExpiringSoon,
    transactions,
    achievements,
    availableBadges,
    referralCode,
    referrals,
    rewardsCatalog,
    customerRewards,
    streaks,

    // Loading states
    isLoadingLoyalty,
    isLoadingTransactions,
    isLoadingAchievements,
    isLoadingReferrals,
    isLoadingRewards,
    isLoadingCustomerRewards,

    // States
    isGeneratingReferral,

    // Actions
    generateReferralCode: () => generateReferralMutation.mutate(),
    redeemReward: (rewardId: string, pointsCost: number) =>
      redeemRewardMutation.mutate({ rewardId, pointsCost }),
    refetchReferralCode,
  };
}