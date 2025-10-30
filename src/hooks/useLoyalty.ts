import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useState } from 'react';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { loyaltyService } from '@/services/loyalty.service';
import {
  LoyaltyTier,
  LoyaltyMember,
  PointsTransaction,
  Achievement,
  MemberAchievement,
  Referral,
  Reward,
  RewardRedemption,
  LoyaltyStats
} from '@/services/loyalty.service';

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

  // Get loyalty member data
  const { data: loyaltyMember, isLoading: isLoadingLoyalty } = useQuery({
    queryKey: ['loyalty-member', user?.id],
    queryFn: async () => {
      if (!user) return null;
      return loyaltyService.getLoyaltyMember(user.id);
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Get loyalty stats
  const { data: loyaltyStats } = useQuery({
    queryKey: ['loyalty-stats', loyaltyMember?.id],
    queryFn: async () => {
      if (!loyaltyMember) return null;
      return loyaltyService.getLoyaltyStats(loyaltyMember.id);
    },
    enabled: !!loyaltyMember,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Get all loyalty tiers
  const { data: tiers } = useQuery({
    queryKey: ['loyalty-tiers'],
    queryFn: async () => {
      const { data } = await supabase
        .from('loyalty_tiers')
        .select('*')
        .eq('is_active', true)
        .order('level');
      return data || [];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Get point transactions
  const { data: transactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['points-transactions', loyaltyMember?.id],
    queryFn: async () => {
      if (!loyaltyMember) return [];
      return loyaltyService.getPointsTransactions(loyaltyMember.id, 20);
    },
    enabled: !!loyaltyMember,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Get member achievements
  const { data: achievements, isLoading: isLoadingAchievements } = useQuery({
    queryKey: ['member-achievements', loyaltyMember?.id],
    queryFn: async () => {
      if (!loyaltyMember) return [];
      return loyaltyService.getMemberAchievements(loyaltyMember.id);
    },
    enabled: !!loyaltyMember,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Get available achievements
  const { data: availableBadges } = useQuery({
    queryKey: ['available-achievements'],
    queryFn: async () => {
      return loyaltyService.getAchievements();
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Get member referrals
  const { data: referrals, isLoading: isLoadingReferrals } = useQuery({
    queryKey: ['member-referrals', loyaltyMember?.id],
    queryFn: async () => {
      if (!loyaltyMember) return [];
      return loyaltyService.getMemberReferrals(loyaltyMember.id);
    },
    enabled: !!loyaltyMember,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Get rewards catalog
  const { data: rewardsCatalog, isLoading: isLoadingRewards } = useQuery({
    queryKey: ['rewards-catalog', loyaltyMember?.tier?.level],
    queryFn: async () => {
      const minTier = loyaltyMember?.tier?.level || 1;
      return loyaltyService.getRewardsCatalog(undefined, minTier);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Get member's redeemed rewards
  const { data: customerRewards, isLoading: isLoadingCustomerRewards } = useQuery({
    queryKey: ['member-redemptions', loyaltyMember?.id],
    queryFn: async () => {
      if (!loyaltyMember) return [];
      return loyaltyService.getMemberRedemptions(loyaltyMember.id);
    },
    enabled: !!loyaltyMember,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Get customer streaks (legacy - keeping for compatibility)
  const { data: streaks } = useQuery({
    queryKey: ['customer-streaks', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Mock streak data for now - this could be implemented in the future
      return [
        {
          id: 'mock-booking-streak',
          customer_id: user.id,
          streak_type: 'booking',
          current_streak: 2,
          longest_streak: 4,
          last_activity: new Date().toISOString(),
          next_bonus_threshold: 3,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'mock-referral-streak',
          customer_id: user.id,
          streak_type: 'referral',
          current_streak: 1,
          longest_streak: 2,
          last_activity: new Date().toISOString(),
          next_bonus_threshold: 3,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ] as CustomerStreak[];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Generate referral code mutation
  const generateReferralMutation = useMutation({
    mutationFn: async (refereeData: { email: string; name?: string; phone?: string }) => {
      if (!user || !loyaltyMember) throw new Error('User not authenticated');

      setIsGeneratingReferral(true);

      const referral = await loyaltyService.createReferral(
        loyaltyMember.id,
        refereeData.email,
        refereeData.name,
        refereeData.phone
      );

      if (!referral) {
        throw new Error('Failed to generate referral code');
      }

      return referral;
    },
    onSuccess: () => {
      toast.success('Referral created successfully!');
      queryClient.invalidateQueries({ queryKey: ['member-referrals'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create referral');
    },
    onSettled: () => {
      setIsGeneratingReferral(false);
    }
  });

  // Redeem reward mutation
  const redeemRewardMutation = useMutation({
    mutationFn: async ({ rewardId, notes }: { rewardId: string; notes?: string }) => {
      if (!loyaltyMember) throw new Error('Member not found');

      const redemption = await loyaltyService.redeemReward(loyaltyMember.id, rewardId, notes);

      if (!redemption) {
        throw new Error('Failed to redeem reward');
      }

      return redemption;
    },
    onSuccess: (data) => {
      toast.success(`Successfully redeemed ${data.reward?.title}!`);
      queryClient.invalidateQueries({ queryKey: ['loyalty-member'] });
      queryClient.invalidateQueries({ queryKey: ['loyalty-stats'] });
      queryClient.invalidateQueries({ queryKey: ['member-redemptions'] });
      queryClient.invalidateQueries({ queryKey: ['points-transactions'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to redeem reward');
    }
  });

  // Create compatibility layer for customerLoyalty
  const customerLoyalty = loyaltyMember ? {
    id: loyaltyMember.id,
    customer_id: loyaltyMember.user_id,
    program_id: 'default',
    current_points: loyaltyMember.current_points,
    tier: loyaltyMember.tier?.name || 'Bronze',
    tier_expires_at: null,
    total_earned: loyaltyMember.lifetime_points,
    total_redeemed: loyaltyMember.lifetime_points - loyaltyMember.current_points,
    last_activity: new Date().toISOString(),
    created_at: loyaltyMember.created_at,
    updated_at: loyaltyMember.updated_at
  } : null;

  // Get tier info for current customer
  const currentTier = loyaltyMember?.tier;

  // Get next tier info
  const nextTier = tiers?.find(t => t.level === (currentTier?.level || 0) + 1);

  // Calculate progress to next tier
  let progressToNextTier = 0;
  if (nextTier && loyaltyStats) {
    const currentTierMinPoints = currentTier?.min_points || 0;
    const nextTierMinPoints = nextTier.min_points;
    const currentPoints = loyaltyStats.lifetimePoints;

    if (nextTierMinPoints > currentTierMinPoints) {
      progressToNextTier = Math.min(100,
        ((currentPoints - currentTierMinPoints) / (nextTierMinPoints - currentTierMinPoints)) * 100
      );
    }
  }

  // Check if tier is expiring soon
  const isTierExpiringSoon = false; // New system doesn't have tier expiration

  return {
    // Data
    loyaltyProgram: null, // Not used in new system
    customerLoyalty,
    tiers,
    currentTier,
    nextTier,
    progressToNextTier,
    isTierExpiringSoon,
    transactions,
    achievements,
    availableBadges,
    referralCode: referrals?.[0]?.referral_code || null,
    referrals,
    rewardsCatalog,
    customerRewards,
    streaks,
    loyaltyStats,
    loyaltyMember,

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
    generateReferralCode: (refereeData: { email: string; name?: string; phone?: string }) =>
      generateReferralMutation.mutate(refereeData),
    redeemReward: (rewardId: string, notes?: string) =>
      redeemRewardMutation.mutate({ rewardId, notes }),
    refetchReferralCode: () => queryClient.invalidateQueries({ queryKey: ['member-referrals'] }),
  };
}