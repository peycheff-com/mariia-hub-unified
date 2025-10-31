import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { loyaltyService } from '@/services/loyalty.service';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

// Types based on the migration schema
export interface LoyaltyTier {
  id: string;
  name: string;
  level: number;
  description: string;
  min_spend_amount: number;
  min_visits: number;
  min_points: number;
  points_multiplier: number;
  benefits: string[];
  color_code: string;
  icon_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoyaltyMember {
  id: string;
  user_id: string;
  tier_id?: string;
  member_number: string;
  current_points: number;
  lifetime_points: number;
  total_spend: number;
  total_visits: number;
  join_date: string;
  tier_advancement_date?: string;
  points_expiry_date?: string;
  preferences: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  tier?: LoyaltyTier;
}

export interface PointsTransaction {
  id: string;
  member_id: string;
  transaction_type: 'earn' | 'redeem' | 'expire' | 'adjust' | 'bonus';
  points: number;
  balance_before: number;
  balance_after: number;
  description: string;
  reference_type?: string;
  reference_id?: string;
  booking_id?: string;
  expires_at?: string;
  metadata: Record<string, any>;
  created_at: string;
  created_by?: string;
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  category: string;
  points_cost: number;
  reward_type: 'discount' | 'service' | 'product' | 'experience' | 'gift_card' | 'upgrade';
  value?: number;
  image_url?: string;
  terms_conditions?: string;
  is_active: boolean;
  is_limited: boolean;
  quantity_available?: number;
  min_tier_level: number;
  valid_from?: string;
  valid_until?: string;
  restrictions: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface RewardRedemption {
  id: string;
  member_id: string;
  reward_id: string;
  points_used: number;
  redemption_code: string;
  status: 'pending' | 'confirmed' | 'used' | 'expired' | 'cancelled';
  redemption_date: string;
  expiry_date?: string;
  used_date?: string;
  booking_id?: string;
  notes?: string;
  metadata: Record<string, any>;
  created_at: string;
  reward?: Reward;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referee_email: string;
  referee_name?: string;
  referee_phone?: string;
  referral_code: string;
  referral_type: 'client' | 'staff' | 'social' | 'partner' | 'corporate' | 'influencer';
  status: 'pending' | 'registered' | 'first_booking' | 'completed' | 'expired' | 'cancelled';
  referral_date: string;
  registration_date?: string;
  first_booking_date?: string;
  completion_date?: string;
  expiry_date?: string;
  referrer_reward_points: number;
  referee_reward_points: number;
  referrer_reward_type?: string;
  referee_reward_type?: string;
  notes?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: string;
  icon_url?: string;
  badge_url?: string;
  points_awarded: number;
  achievement_type: 'milestone' | 'streak' | 'engagement' | 'social' | 'learning' | 'special';
  criteria: Record<string, any>;
  is_active: boolean;
  is_repeatable: boolean;
  created_at: string;
  updated_at: string;
}

export interface MemberAchievement {
  id: string;
  member_id: string;
  achievement_id: string;
  progress_data: Record<string, any>;
  completed_at: string;
  points_awarded: number;
  is_displayed: boolean;
  notes?: string;
  created_at: string;
  achievement?: Achievement;
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
  tierProgress: number;
  referralCount: number;
  achievementsCount: number;
  rewardsRedeemed: number;
}

interface VIPExperience {
  conciergeService: boolean;
  priorityBooking: boolean;
  exclusiveEvents: boolean;
  personalizedOffers: boolean;
  freeShipping: boolean;
  dedicatedSupport: boolean;
}

interface GamificationProgress {
  currentStreaks: Record<string, number>;
  longestStreaks: Record<string, number>;
  unlockedBadges: Achievement[];
  nextMilestone: string;
  leaderboardRank?: number;
  totalChallenges: number;
  completedChallenges: number;
}

interface PersonalizedRewards {
  recommendedRewards: Reward[];
  nextRewardGoal: Reward;
  optimalRedemptionTime: string;
  bonusPointOpportunities: string[];
  personalizedOffers: Reward[];
}

interface LoyaltyState {
  member: LoyaltyMember | null;
  tiers: LoyaltyTier[];
  transactions: PointsTransaction[];
  rewards: Reward[];
  redemptions: RewardRedemption[];
  referrals: Referral[];
  achievements: Achievement[];
  memberAchievements: MemberAchievement[];
  stats: LoyaltyStats | null;
  vipExperience: VIPExperience;
  gamification: GamificationProgress;
  personalizedRewards: PersonalizedRewards;
  loading: boolean;
  error: string | null;
}

type LoyaltyAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_MEMBER'; payload: LoyaltyMember | null }
  | { type: 'SET_TIERS'; payload: LoyaltyTier[] }
  | { type: 'SET_TRANSACTIONS'; payload: PointsTransaction[] }
  | { type: 'SET_REWARDS'; payload: Reward[] }
  | { type: 'SET_REDEMPTIONS'; payload: RewardRedemption[] }
  | { type: 'SET_REFERRALS'; payload: Referral[] }
  | { type: 'SET_ACHIEVEMENTS'; payload: Achievement[] }
  | { type: 'SET_MEMBER_ACHIEVEMENTS'; payload: MemberAchievement[] }
  | { type: 'SET_STATS'; payload: LoyaltyStats | null }
  | { type: 'SET_VIP_EXPERIENCE'; payload: VIPExperience }
  | { type: 'SET_GAMIFICATION'; payload: GamificationProgress }
  | { type: 'SET_PERSONALIZED_REWARDS'; payload: PersonalizedRewards }
  | { type: 'UPDATE_POINTS'; payload: { current: number; lifetime: number } }
  | { type: 'ADD_TRANSACTION'; payload: PointsTransaction }
  | { type: 'ADD_ACHIEVEMENT'; payload: MemberAchievement }
  | { type: 'UPDATE_TIER'; payload: LoyaltyTier };

const initialState: LoyaltyState = {
  member: null,
  tiers: [],
  transactions: [],
  rewards: [],
  redemptions: [],
  referrals: [],
  achievements: [],
  memberAchievements: [],
  stats: null,
  vipExperience: {
    conciergeService: false,
    priorityBooking: false,
    exclusiveEvents: false,
    personalizedOffers: false,
    freeShipping: false,
    dedicatedSupport: false,
  },
  gamification: {
    currentStreaks: {},
    longestStreaks: {},
    unlockedBadges: [],
    nextMilestone: '',
    totalChallenges: 0,
    completedChallenges: 0,
  },
  personalizedRewards: {
    recommendedRewards: [],
    nextRewardGoal: {} as Reward,
    optimalRedemptionTime: '',
    bonusPointOpportunities: [],
    personalizedOffers: [],
  },
  loading: false,
  error: null,
};

function loyaltyReducer(state: LoyaltyState, action: LoyaltyAction): LoyaltyState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_MEMBER':
      return { ...state, member: action.payload, loading: false };
    case 'SET_TIERS':
      return { ...state, tiers: action.payload };
    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.payload };
    case 'SET_REWARDS':
      return { ...state, rewards: action.payload };
    case 'SET_REDEMPTIONS':
      return { ...state, redemptions: action.payload };
    case 'SET_REFERRALS':
      return { ...state, referrals: action.payload };
    case 'SET_ACHIEVEMENTS':
      return { ...state, achievements: action.payload };
    case 'SET_MEMBER_ACHIEVEMENTS':
      return { ...state, memberAchievements: action.payload };
    case 'SET_STATS':
      return { ...state, stats: action.payload };
    case 'SET_VIP_EXPERIENCE':
      return { ...state, vipExperience: action.payload };
    case 'SET_GAMIFICATION':
      return { ...state, gamification: action.payload };
    case 'SET_PERSONALIZED_REWARDS':
      return { ...state, personalizedRewards: action.payload };
    case 'UPDATE_POINTS':
      return {
        ...state,
        member: state.member
          ? {
              ...state.member,
              current_points: action.payload.current,
              lifetime_points: action.payload.lifetime,
            }
          : null,
      };
    case 'ADD_TRANSACTION':
      return { ...state, transactions: [action.payload, ...state.transactions] };
    case 'ADD_ACHIEVEMENT':
      return { ...state, memberAchievements: [action.payload, ...state.memberAchievements] };
    case 'UPDATE_TIER':
      return {
        ...state,
        member: state.member ? { ...state.member, tier_id: action.payload.id, tier: action.payload } : null,
      };
    default:
      return state;
  }
}

interface LoyaltyContextType {
  state: LoyaltyState;

  // Actions
  refreshMemberData: () => Promise<void>;
  earnPoints: (points: number, description: string, referenceType?: string, referenceId?: string, bookingId?: string) => Promise<string | null>;
  redeemPoints: (points: number, description: string, rewardId?: string) => Promise<string | null>;
  redeemReward: (rewardId: string, notes?: string) => Promise<RewardRedemption | null>;
  createReferral: (refereeEmail: string, refereeName?: string, refereePhone?: string, referralType?: string) => Promise<Referral | null>;
  checkReferralCode: (code: string) => Promise<Referral | null>;
  processSuccessfulReferral: (referralId: string, refereeUserId: string) => Promise<void>;
  updateMemberPreferences: (preferences: Record<string, any>) => Promise<boolean>;

  // Advanced features
  generatePersonalizedRecommendations: () => Promise<void>;
  checkNextTierProgress: () => { tier: LoyaltyTier; progress: number; pointsNeeded: number } | null;
  getVIPBenefits: () => Promise<VIPExperience>;
  getGamificationStatus: () => Promise<GamificationProgress>;
  getPersonalizedRewards: () => Promise<PersonalizedRewards>;
  processBookingCompletion: (bookingId: string, bookingData: any) => Promise<void>;
  triggerAchievementCheck: (activityType: string, activityData: any) => Promise<void>;
}

const LoyaltyContext = createContext<LoyaltyContextType | undefined>(undefined);

interface LoyaltyProviderProps {
  children: ReactNode;
}

export function LoyaltyProvider({ children }: LoyaltyProviderProps) {
  const [state, dispatch] = useReducer(loyaltyReducer, initialState);
  const { user } = useAuth();

  // Initialize loyalty data for authenticated user
  useEffect(() => {
    if (user) {
      loadLoyaltyData();
    } else {
      // Clear data when user logs out
      dispatch({ type: 'SET_MEMBER', payload: null });
      dispatch({ type: 'SET_TRANSACTIONS', payload: [] });
      dispatch({ type: 'SET_REDEMPTIONS', payload: [] });
      dispatch({ type: 'SET_REFERRALS', payload: [] });
      dispatch({ type: 'SET_MEMBER_ACHIEVEMENTS', payload: [] });
      dispatch({ type: 'SET_STATS', payload: null });
    }
  }, [user]);

  const loadLoyaltyData = async () => {
    if (!user) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Load member data
      const member = await loyaltyService.getLoyaltyMember(user.id);
      if (member) {
        dispatch({ type: 'SET_MEMBER', payload: member });
      }

      // Load tiers
      const tiers = await loadAllTiers();
      dispatch({ type: 'SET_TIERS', payload: tiers });

      // Load other data if member exists
      if (member) {
        await Promise.all([
          loadTransactions(member.id),
          loadRewards(),
          loadRedemptions(member.id),
          loadReferrals(member.id),
          loadAchievements(),
          loadMemberAchievements(member.id),
          loadStats(member.id),
        ]);

        // Load advanced features
        await Promise.all([
          loadVIPBenefits(member),
          loadGamificationStatus(member.id),
          loadPersonalizedRewards(member.id),
        ]);
      }
    } catch (error) {
      console.error('Error loading loyalty data:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load loyalty data' });
    }
  };

  const loadAllTiers = async (): Promise<LoyaltyTier[]> => {
    try {
      const { data, error } = await supabase
        .from('loyalty_tiers')
        .select('*')
        .eq('is_active', true)
        .order('level', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading tiers:', error);
      return [];
    }
  };

  const loadTransactions = async (memberId: string) => {
    try {
      const transactions = await loyaltyService.getPointsTransactions(memberId, 50);
      dispatch({ type: 'SET_TRANSACTIONS', payload: transactions });
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const loadRewards = async () => {
    try {
      const rewards = await loyaltyService.getRewardsCatalog();
      dispatch({ type: 'SET_REWARDS', payload: rewards });
    } catch (error) {
      console.error('Error loading rewards:', error);
    }
  };

  const loadRedemptions = async (memberId: string) => {
    try {
      const redemptions = await loyaltyService.getMemberRedemptions(memberId);
      dispatch({ type: 'SET_REDEMPTIONS', payload: redemptions });
    } catch (error) {
      console.error('Error loading redemptions:', error);
    }
  };

  const loadReferrals = async (memberId: string) => {
    try {
      const referrals = await loyaltyService.getMemberReferrals(memberId);
      dispatch({ type: 'SET_REFERRALS', payload: referrals });
    } catch (error) {
      console.error('Error loading referrals:', error);
    }
  };

  const loadAchievements = async () => {
    try {
      const achievements = await loyaltyService.getAchievements();
      dispatch({ type: 'SET_ACHIEVEMENTS', payload: achievements });
    } catch (error) {
      console.error('Error loading achievements:', error);
    }
  };

  const loadMemberAchievements = async (memberId: string) => {
    try {
      const memberAchievements = await loyaltyService.getMemberAchievements(memberId);
      dispatch({ type: 'SET_MEMBER_ACHIEVEMENTS', payload: memberAchievements });
    } catch (error) {
      console.error('Error loading member achievements:', error);
    }
  };

  const loadStats = async (memberId: string) => {
    try {
      const stats = await loyaltyService.getLoyaltyStats(memberId);
      dispatch({ type: 'SET_STATS', payload: stats });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadVIPBenefits = async (member: LoyaltyMember) => {
    try {
      const tier = member.tier;
      if (!tier) return;

      const vipBenefits: VIPExperience = {
        conciergeService: tier.level >= 4, // Platinum and Diamond
        priorityBooking: tier.level >= 2, // Silver and above
        exclusiveEvents: tier.level >= 2, // Silver and above
        personalizedOffers: tier.level >= 3, // Gold and above
        freeShipping: tier.level >= 3, // Gold and above
        dedicatedSupport: tier.level >= 4, // Platinum and Diamond
      };

      dispatch({ type: 'SET_VIP_EXPERIENCE', payload: vipBenefits });
    } catch (error) {
      console.error('Error loading VIP benefits:', error);
    }
  };

  const loadGamificationStatus = async (memberId: string) => {
    try {
      // This would load streaks, challenges, etc.
      const gamification: GamificationProgress = {
        currentStreaks: {
          booking: 3,
          referral: 1,
        },
        longestStreaks: {
          booking: 6,
          referral: 3,
        },
        unlockedBadges: [],
        nextMilestone: 'Complete 5 more bookings to unlock "Beauty Explorer" badge',
        totalChallenges: 10,
        completedChallenges: 4,
      };

      dispatch({ type: 'SET_GAMIFICATION', payload: gamification });
    } catch (error) {
      console.error('Error loading gamification status:', error);
    }
  };

  const loadPersonalizedRewards = async (memberId: string) => {
    try {
      // This would use AI to recommend personalized rewards
      const personalized: PersonalizedRewards = {
        recommendedRewards: [],
        nextRewardGoal: {} as Reward,
        optimalRedemptionTime: 'After your next treatment',
        bonusPointOpportunities: [
          'Leave a review for your last treatment',
          'Refer a friend',
          'Book a new service type',
        ],
        personalizedOffers: [],
      };

      dispatch({ type: 'SET_PERSONALIZED_REWARDS', payload: personalized });
    } catch (error) {
      console.error('Error loading personalized rewards:', error);
    }
  };

  // Public API methods
  const refreshMemberData = async () => {
    await loadLoyaltyData();
  };

  const earnPoints = async (
    points: number,
    description: string,
    referenceType?: string,
    referenceId?: string,
    bookingId?: string
  ): Promise<string | null> => {
    if (!state.member) return null;

    try {
      const transactionId = await loyaltyService.earnPoints(
        state.member.id,
        points,
        description,
        'earn',
        referenceType,
        referenceId,
        bookingId
      );

      if (transactionId) {
        toast.success(`Earned ${points} points!`);
        await loadLoyaltyData(); // Refresh data
      }

      return transactionId;
    } catch (error) {
      console.error('Error earning points:', error);
      toast.error('Failed to earn points');
      return null;
    }
  };

  const redeemPoints = async (
    points: number,
    description: string,
    rewardId?: string
  ): Promise<string | null> => {
    if (!state.member) return null;

    try {
      const transactionId = await loyaltyService.redeemPoints(
        state.member.id,
        points,
        description,
        rewardId
      );

      if (transactionId) {
        toast.success(`Redeemed ${points} points!`);
        await loadLoyaltyData(); // Refresh data
      }

      return transactionId;
    } catch (error) {
      console.error('Error redeeming points:', error);
      toast.error('Failed to redeem points');
      return null;
    }
  };

  const redeemReward = async (rewardId: string, notes?: string): Promise<RewardRedemption | null> => {
    if (!state.member) return null;

    try {
      const redemption = await loyaltyService.redeemReward(state.member.id, rewardId, notes);

      if (redemption) {
        toast.success(`Successfully redeemed ${redemption.reward?.title}!`);
        await loadLoyaltyData(); // Refresh data
      }

      return redemption;
    } catch (error: any) {
      console.error('Error redeeming reward:', error);
      toast.error(error.message || 'Failed to redeem reward');
      return null;
    }
  };

  const createReferral = async (
    refereeEmail: string,
    refereeName?: string,
    refereePhone?: string,
    referralType: string = 'client'
  ): Promise<Referral | null> => {
    if (!state.member) return null;

    try {
      const referral = await loyaltyService.createReferral(
        state.member.id,
        refereeEmail,
        refereeName,
        refereePhone,
        referralType
      );

      if (referral) {
        toast.success('Referral created successfully!');
        await loadLoyaltyData(); // Refresh data
      }

      return referral;
    } catch (error) {
      console.error('Error creating referral:', error);
      toast.error('Failed to create referral');
      return null;
    }
  };

  const checkReferralCode = async (code: string): Promise<Referral | null> => {
    try {
      return await loyaltyService.checkReferralCode(code);
    } catch (error) {
      console.error('Error checking referral code:', error);
      return null;
    }
  };

  const processSuccessfulReferral = async (referralId: string, refereeUserId: string): Promise<void> => {
    try {
      await loyaltyService.processSuccessfulReferral(referralId, refereeUserId);
      toast.success('Referral completed! Points awarded.');
      await loadLoyaltyData(); // Refresh data
    } catch (error) {
      console.error('Error processing referral:', error);
      toast.error('Failed to process referral');
    }
  };

  const updateMemberPreferences = async (preferences: Record<string, any>): Promise<boolean> => {
    if (!state.member) return false;

    try {
      const success = await loyaltyService.updateMemberPreferences(state.member.id, preferences);
      if (success) {
        await loadLoyaltyData(); // Refresh data
      }
      return success;
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update preferences');
      return false;
    }
  };

  // Advanced features
  const generatePersonalizedRecommendations = async (): Promise<void> => {
    if (!state.member) return;

    try {
      // AI-powered recommendations
      await loadPersonalizedRewards(state.member.id);
    } catch (error) {
      console.error('Error generating recommendations:', error);
    }
  };

  const checkNextTierProgress = (): { tier: LoyaltyTier; progress: number; pointsNeeded: number } | null => {
    if (!state.member || !state.tiers.length) return null;

    const currentTierIndex = state.tiers.findIndex(t => t.id === state.member?.tier_id);
    const nextTier = state.tiers[currentTierIndex + 1];

    if (!nextTier) return null;

    const currentTier = state.tiers[currentTierIndex];
    const tierProgress = state.member.lifetime_points - (currentTier?.min_points || 0);
    const tierRange = nextTier.min_points - (currentTier?.min_points || 0);
    const progress = (tierProgress / tierRange) * 100;
    const pointsNeeded = Math.max(0, nextTier.min_points - state.member.lifetime_points);

    return {
      tier: nextTier,
      progress: Math.min(100, Math.max(0, progress)),
      pointsNeeded,
    };
  };

  const getVIPBenefits = async (): Promise<VIPExperience> => {
    if (!state.member) return state.vipExperience;

    await loadVIPBenefits(state.member);
    return state.vipExperience;
  };

  const getGamificationStatus = async (): Promise<GamificationProgress> => {
    if (!state.member) return state.gamification;

    await loadGamificationStatus(state.member.id);
    return state.gamification;
  };

  const getPersonalizedRewards = async (): Promise<PersonalizedRewards> => {
    if (!state.member) return state.personalizedRewards;

    await loadPersonalizedRewards(state.member.id);
    return state.personalizedRewards;
  };

  const processBookingCompletion = async (bookingId: string, bookingData: any): Promise<void> => {
    if (!state.member) return;

    try {
      // Award points for booking completion
      const pointsEarned = Math.round(bookingData.total_amount * 0.5); // 0.5 points per PLN
      await earnPoints(
        pointsEarned,
        `Points earned from booking: ${bookingData.service_name}`,
        'booking',
        bookingId,
        bookingId
      );

      // Check for achievements
      await triggerAchievementCheck('booking', {
        totalVisits: state.member.total_visits + 1,
        totalSpend: state.member.total_spend + bookingData.total_amount,
        serviceType: bookingData.service_type,
      });

      // Update member stats
      await refreshMemberData();
    } catch (error) {
      console.error('Error processing booking completion:', error);
    }
  };

  const triggerAchievementCheck = async (activityType: string, activityData: any): Promise<void> => {
    if (!state.member) return;

    try {
      await loyaltyService.checkAchievements(state.member.id, activityType, activityData);
      await loadMemberAchievements(state.member.id);
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  };

  const value: LoyaltyContextType = {
    state,
    refreshMemberData,
    earnPoints,
    redeemPoints,
    redeemReward,
    createReferral,
    checkReferralCode,
    processSuccessfulReferral,
    updateMemberPreferences,
    generatePersonalizedRecommendations,
    checkNextTierProgress,
    getVIPBenefits,
    getGamificationStatus,
    getPersonalizedRewards,
    processBookingCompletion,
    triggerAchievementCheck,
  };

  return <LoyaltyContext.Provider value={value}>{children}</LoyaltyContext.Provider>;
}

export function useLoyaltyContext(): LoyaltyContextType {
  const context = useContext(LoyaltyContext);
  if (context === undefined) {
    throw new Error('useLoyaltyContext must be used within a LoyaltyProvider');
  }
  return context;
}