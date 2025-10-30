import { supabase } from '@/integrations/supabase/client-optimized';
import { Database } from '@/integrations/supabase/types';

type ReferralProgram = Database['public']['Tables']['referral_programs']['Row'];
type Referral = Database['public']['Tables']['referrals']['Row'];
type Influencer = Database['public']['Tables']['influencers']['Row'];

export interface ReferralAnalytics {
  totalReferrals: number;
  activeReferrers: number;
  conversionRate: number;
  averageReferralValue: number;
  referralRevenue: number;
  referralCosts: number;
  referralROI: number;
  programPerformance: ProgramPerformance[];
  topReferrers: TopReferrer[];
  referralTrends: ReferralTrend[];
  channelEffectiveness: ChannelEffectiveness[];
  seasonalPatterns: SeasonalReferralPattern[];
  recommendations: ReferralRecommendation[];
}

export interface ProgramPerformance {
  programId: string;
  programName: string;
  referralType: 'customer' | 'influencer' | 'partner';
  totalReferrals: number;
  conversions: number;
  conversionRate: number;
  averageRevenue: number;
  totalRevenue: number;
  totalCosts: number;
  roi: number;
  costPerAcquisition: number;
  lifetimeValue: number;
  activeStatus: boolean;
  performanceScore: number;
}

export interface TopReferrer {
  userId: string;
  name: string;
  email: string;
  totalReferrals: number;
  successfulReferrals: number;
  conversionRate: number;
  totalRevenue: number;
  averageReferralValue: number;
  referralTiers: string[];
  joinDate: Date;
  lastActivity: Date;
  engagementScore: number;
  preferredChannels: string[];
  rewardsEarned: number;
}

export interface ReferralTrend {
  period: string;
  referrals: number;
  conversions: number;
  revenue: number;
  conversionRate: number;
  averageReferralValue: number;
  trendDirection: 'increasing' | 'stable' | 'decreasing';
  growthRate: number;
  topReferralSources: string[];
}

export interface ChannelEffectiveness {
  channel: string;
  referrals: number;
  conversions: number;
  conversionRate: number;
  costPerReferral: number;
  revenuePerReferral: number;
  roi: number;
  bestPerformingPrograms: string[];
  audienceDemographics: Record<string, number>;
  optimalTiming: string;
}

export interface SeasonalReferralPattern {
  season: string;
  typicalReferralVolume: number;
  conversionRate: number;
  averageRevenue: number;
  popularServices: string[];
  effectiveStrategies: string[];
  recommendedActions: string[];
}

export interface ReferralRecommendation {
  recommendation: string;
  type: 'program_optimization' | 'channel_improvement' | 'incentive_adjustment' | 'targeting_refinement';
  priority: 'critical' | 'high' | 'medium' | 'low';
  expectedImpact: number;
  implementationCost: number;
  expectedROI: number;
  timeline: string;
  description: string;
  metrics: string[];
}

export interface InfluencerAnalytics {
  totalInfluencers: number;
  activeInfluencers: number;
  totalRevenue: number;
  averageInfluencerRevenue: number;
  engagementRate: number;
  conversionRate: number;
  tierDistribution: TierDistribution[];
  topPerformers: TopInfluencer[];
  performanceMetrics: PerformanceMetrics[];
  campaignEffectiveness: CampaignEffectiveness[];
  contentPerformance: ContentPerformance[];
  roiAnalysis: ROIAnalysis[];
  optimizationOpportunities: InfluencerOptimization[];
}

export interface TierDistribution {
  tier: 'nano' | 'micro' | 'macro' | 'mega';
  count: number;
  percentage: number;
  averageRevenue: number;
  averageEngagement: number;
  conversionRate: number;
  totalRevenue: number;
  commissionRate: number;
}

export interface TopInfluencer {
  influencerId: string;
  name: string;
  handle: string;
  platform: string;
  tier: string;
  followers: number;
  totalReferrals: number;
  conversionRate: number;
  totalRevenue: number;
  commissionEarned: number;
  engagementRate: number;
  contentQuality: number;
  brandAlignment: number;
  partnershipDuration: number;
  lastCampaignDate: Date;
  performanceScore: number;
  strengths: string[];
  improvementAreas: string[];
}

export interface PerformanceMetrics {
  metric: string;
  value: number;
  benchmark: number;
  trend: 'improving' | 'stable' | 'declining';
  change: number;
  industryAverage: number;
  target: number;
}

export interface CampaignEffectiveness {
  campaignId: string;
  campaignName: string;
  influencers: number;
  reach: number;
  engagement: number;
  conversions: number;
  revenue: number;
  cost: number;
  roi: number;
  engagementRate: number;
  conversionRate: number;
  costPerAcquisition: number;
  duration: number;
  topPerformingContent: string[];
  audienceResponse: string[];
}

export interface ContentPerformance {
  contentType: 'video' | 'image' | 'story' | 'reel' | 'post' | 'live';
  averageEngagement: number;
  conversionRate: number;
  costPerContent: number;
  revenuePerContent: number;
  bestPlatforms: string[];
  optimalPostingTimes: string[];
  trendingHashtags: string[];
  effectiveCallsToAction: string[];
  audiencePreferences: Record<string, number>;
}

export interface ROIAnalysis {
  period: string;
  totalInvestment: number;
  totalRevenue: number;
  roi: number;
  roas: number;
  customerAcquisitionCost: number;
  customerLifetimeValue: number;
  paybackPeriod: number;
  profitabilityScore: number;
  incrementalRevenue: number;
  brandValueIncrease: number;
}

export interface InfluencerOptimization {
  optimizationType: 'tier_adjustment' | 'content_strategy' | 'compensation_model' | 'partnership_structure' | 'campaign_optimization';
  description: string;
  expectedImpact: number;
  implementationEffort: 'low' | 'medium' | 'high';
  priority: 'high' | 'medium' | 'low';
  affectedInfluencers: string[];
  recommendedActions: string[];
  expectedROI: number;
  timeline: string;
}

class ReferralInfluencerEngine {
  private readonly referralPrograms = new Map<string, ReferralProgram>();
  private readonly influencerTiers = {
    nano: { minFollowers: 0, maxFollowers: 1000, commission: 0.05 },
    micro: { minFollowers: 1000, maxFollowers: 100000, commission: 0.08 },
    macro: { minFollowers: 100000, maxFollowers: 1000000, commission: 0.10 },
    mega: { minFollowers: 1000000, maxFollowers: Infinity, commission: 0.12 }
  };

  constructor() {
    this.initializeReferralPrograms();
  }

  private initializeReferralPrograms(): void {
    // Initialize default referral programs
    const defaultPrograms = [
      {
        id: 'customer-referral',
        name: 'Customer Referral Program',
        description: 'Refer friends and earn rewards',
        referral_type: 'customer' as const,
        reward_type: 'discount' as const,
        reward_amount: 50,
        reward_currency: 'PLN',
        minimum_booking_value: 200,
        reward_conditions: {},
        expiration_days: 90,
        is_active: true,
        start_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'influencer-partnership',
        name: 'Influencer Partnership Program',
        description: 'Partner with influencers to promote services',
        referral_type: 'influencer' as const,
        reward_type: 'cash' as const,
        reward_amount: 15,
        reward_currency: 'PLN',
        minimum_booking_value: 100,
        reward_conditions: { content_requirements: 1, monthly_minimum: 3 },
        expiration_days: 365,
        is_active: true,
        start_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    defaultPrograms.forEach(program => {
      this.referralPrograms.set(program.id, program);
    });
  }

  async analyzeReferralPerformance(
    dateRange?: { start: Date; end: Date },
    programId?: string
  ): Promise<ReferralAnalytics> {
    // Get referral data
    const referrals = await this.getReferralData(dateRange, programId);
    const programs = await this.getReferralPrograms();

    // Calculate overall metrics
    const totalReferrals = referrals.length;
    const conversions = referrals.filter(r => r.conversion_date).length;
    const conversionRate = totalReferrals > 0 ? conversions / totalReferrals : 0;
    const totalRevenue = referrals.reduce((sum, r) => sum + (r.first_booking_value || 0), 0);
    const averageReferralValue = conversions > 0 ? totalRevenue / conversions : 0;
    const totalCosts = await this.calculateReferralCosts(referrals, programs);
    const referralROI = totalCosts > 0 ? ((totalRevenue - totalCosts) / totalCosts) * 100 : 0;

    // Analyze program performance
    const programPerformance = await this.analyzeProgramPerformance(referrals, programs);

    // Identify top referrers
    const topReferrers = await this.identifyTopReferrers(referrals);

    // Analyze trends
    const referralTrends = this.analyzeReferralTrends(referrals);

    // Analyze channel effectiveness
    const channelEffectiveness = await this.analyzeChannelEffectiveness(referrals);

    // Identify seasonal patterns
    const seasonalPatterns = this.analyzeSeasonalReferralPatterns(referrals);

    // Generate recommendations
    const recommendations = this.generateReferralRecommendations(
      programPerformance, channelEffectiveness, seasonalPatterns
    );

    return {
      totalReferrals,
      activeReferrers: topReferrers.length,
      conversionRate,
      averageReferralValue,
      referralRevenue: totalRevenue,
      referralCosts: totalCosts,
      referralROI,
      programPerformance,
      topReferrers,
      referralTrends,
      channelEffectiveness,
      seasonalPatterns,
      recommendations
    };
  }

  private async getReferralData(dateRange?: { start: Date; end: Date }, programId?: string): Promise<Referral[]> {
    let query = supabase
      .from('referrals')
      .select('*')
      .order('referral_date', { ascending: false });

    if (dateRange) {
      query = query
        .gte('referral_date', dateRange.start.toISOString())
        .lte('referral_date', dateRange.end.toISOString());
    }

    if (programId) {
      query = query.eq('program_id', programId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch referral data: ${error.message}`);
    }

    return data || [];
  }

  private async getReferralPrograms(): Promise<ReferralProgram[]> {
    const { data, error } = await supabase
      .from('referral_programs')
      .select('*')
      .eq('is_active', true);

    if (error) {
      throw new Error(`Failed to fetch referral programs: ${error.message}`);
    }

    return data || [];
  }

  private async calculateReferralCosts(referrals: Referral[], programs: ReferralProgram[]): Promise<number> {
    let totalCosts = 0;

    referrals.forEach(referral => {
      const program = programs.find(p => p.id === referral.program_id);
      if (program && referral.reward_status === 'issued') {
        totalCosts += referral.reward_amount || 0;
      }
    });

    return totalCosts;
  }

  private async analyzeProgramPerformance(referrals: Referral[], programs: ReferralProgram[]): Promise<ProgramPerformance[]> {
    const performance: ProgramPerformance[] = [];

    programs.forEach(program => {
      const programReferrals = referrals.filter(r => r.program_id === program.id);
      const conversions = programReferrals.filter(r => r.conversion_date).length;
      const totalRevenue = programReferrals.reduce((sum, r) => sum + (r.first_booking_value || 0), 0);
      const totalCosts = programReferrals.reduce((sum, r) => sum + (r.reward_amount || 0), 0);

      const conversionRate = programReferrals.length > 0 ? conversions / programReferrals.length : 0;
      const averageRevenue = conversions > 0 ? totalRevenue / conversions : 0;
      const roi = totalCosts > 0 ? ((totalRevenue - totalCosts) / totalCosts) * 100 : 0;
      const cac = conversions > 0 ? totalCosts / conversions : 0;

      // Calculate performance score
      const performanceScore = this.calculateProgramPerformanceScore({
        conversionRate,
        averageRevenue,
        roi,
        referralVolume: programReferrals.length
      });

      performance.push({
        programId: program.id,
        programName: program.name,
        referralType: program.referral_type,
        totalReferrals: programReferrals.length,
        conversions,
        conversionRate,
        averageRevenue,
        totalRevenue,
        totalCosts,
        roi,
        costPerAcquisition: cac,
        lifetimeValue: averageRevenue * 2.5, // Estimated LTV multiple
        activeStatus: program.is_active,
        performanceScore
      });
    });

    return performance.sort((a, b) => b.performanceScore - a.performanceScore);
  }

  private calculateProgramPerformanceScore(metrics: {
    conversionRate: number;
    averageRevenue: number;
    roi: number;
    referralVolume: number;
  }): number {
    // Weighted scoring algorithm
    const weights = {
      conversionRate: 0.3,
      averageRevenue: 0.25,
      roi: 0.25,
      referralVolume: 0.2
    };

    const normalizedScores = {
      conversionRate: Math.min(1, metrics.conversionRate / 0.3), // 30% conversion = perfect
      averageRevenue: Math.min(1, metrics.averageRevenue / 500), // 500 PLN = perfect
      roi: Math.min(1, metrics.roi / 200), // 200% ROI = perfect
      referralVolume: Math.min(1, metrics.referralVolume / 50) // 50 referrals = perfect
    };

    return Object.entries(weights).reduce((score, [metric, weight]) => {
      return score + (normalizedScores[metric as keyof typeof normalizedScores] * weight);
    }, 0) * 100;
  }

  private async identifyTopReferrers(referrals: Referral[]): Promise<TopReferrer[]> {
    const referrerStats: { [userId: string]: TopReferrer } = {};

    // Group referrals by referrer
    referrals.forEach(referral => {
      const referrerId = referral.referrer_id;
      if (!referrerId) return;

      if (!referrerStats[referrerId]) {
        referrerStats[referrerId] = {
          userId: referrerId,
          name: `Referrer ${referrerId}`,
          email: '',
          totalReferrals: 0,
          successfulReferrals: 0,
          conversionRate: 0,
          totalRevenue: 0,
          averageReferralValue: 0,
          referralTiers: [],
          joinDate: new Date(referral.referral_date),
          lastActivity: new Date(referral.referral_date),
          engagementScore: 0,
          preferredChannels: [],
          rewardsEarned: 0
        };
      }

      const stats = referrerStats[referrerId];
      stats.totalReferrals++;

      if (referral.conversion_date) {
        stats.successfulReferrals++;
        stats.totalRevenue += referral.first_booking_value || 0;
      }

      if (referral.reward_status === 'issued') {
        stats.rewardsEarned += referral.reward_amount || 0;
      }

      stats.lastActivity = new Date(referral.referral_date);
    });

    // Calculate derived metrics
    Object.values(referrerStats).forEach(stats => {
      stats.conversionRate = stats.totalReferrals > 0 ? stats.successfulReferrals / stats.totalReferrals : 0;
      stats.averageReferralValue = stats.successfulReferrals > 0 ? stats.totalRevenue / stats.successfulReferrals : 0;
      stats.engagementScore = this.calculateReferrerEngagementScore(stats);
      stats.referralTiers = this.determineReferralTiers(stats);
    });

    return Object.values(referrerStats)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 20);
  }

  private calculateReferrerEngagementScore(referrer: TopReferrer): number {
    let score = 0;

    // Base score from referral volume
    score += Math.min(0.4, referrer.totalReferrals / 25);

    // Conversion rate bonus
    score += referrer.conversionRate * 0.3;

    // Recency bonus
    const daysSinceLastActivity = (Date.now() - referrer.lastActivity.getTime()) / (1000 * 60 * 60 * 24);
    const recencyScore = Math.max(0, 1 - daysSinceLastActivity / 90);
    score += recencyScore * 0.2;

    // Consistency bonus
    const daysActive = (referrer.lastActivity.getTime() - referrer.joinDate.getTime()) / (1000 * 60 * 60 * 24);
    const consistencyScore = daysActive > 0 ? referrer.totalReferrals / (daysActive / 30) : 0;
    score += Math.min(0.1, consistencyScore / 2);

    return Math.min(1, score);
  }

  private determineReferralTiers(referrer: TopReferrer): string[] {
    const tiers: string[] = [];

    if (referrer.totalReferrals >= 50) tiers.push('platinum');
    else if (referrer.totalReferrals >= 20) tiers.push('gold');
    else if (referrer.totalReferrals >= 10) tiers.push('silver');
    else if (referrer.totalReferrals >= 5) tiers.push('bronze');

    if (referrer.totalRevenue >= 5000) tiers.push('high_value');
    if (referrer.conversionRate >= 0.5) tiers.push('quality_referrer');
    if (referrer.engagementScore >= 0.8) tiers.push('engaged_referrer');

    return tiers;
  }

  private analyzeReferralTrends(referrals: Referral[]): ReferralTrend[] {
    const trends: { [period: string]: ReferralTrend } = {};

    // Group referrals by month
    referrals.forEach(referral => {
      const date = new Date(referral.referral_date);
      const periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!trends[periodKey]) {
        trends[periodKey] = {
          period: periodKey,
          referrals: 0,
          conversions: 0,
          revenue: 0,
          conversionRate: 0,
          averageReferralValue: 0,
          trendDirection: 'stable',
          growthRate: 0,
          topReferralSources: []
        };
      }

      const trend = trends[periodKey];
      trend.referrals++;

      if (referral.conversion_date) {
        trend.conversions++;
        trend.revenue += referral.first_booking_value || 0;
      }
    });

    // Calculate derived metrics and trends
    const sortedPeriods = Object.keys(trends).sort();
    sortedPeriods.forEach((period, index) => {
      const trend = trends[period];
      trend.conversionRate = trend.referrals > 0 ? trend.conversions / trend.referrals : 0;
      trend.averageReferralValue = trend.conversions > 0 ? trend.revenue / trend.conversions : 0;

      // Calculate trend direction and growth rate
      if (index > 0) {
        const previousPeriod = trends[sortedPeriods[index - 1]];
        const growthRate = previousPeriod.referrals > 0 ?
          ((trend.referrals - previousPeriod.referrals) / previousPeriod.referrals) * 100 : 0;

        trend.growthRate = growthRate;
        trend.trendDirection = growthRate > 5 ? 'increasing' :
                               growthRate < -5 ? 'decreasing' : 'stable';
      }
    });

    return Object.values(trends);
  }

  private async analyzeChannelEffectiveness(referrals: Referral[]): Promise<ChannelEffectiveness[]> {
    const channelStats: { [channel: string]: ChannelEffectiveness } = {};

    // Group referrals by channel
    referrals.forEach(referral => {
      const channel = referral.utm_source || 'direct';

      if (!channelStats[channel]) {
        channelStats[channel] = {
          channel,
          referrals: 0,
          conversions: 0,
          conversionRate: 0,
          costPerReferral: 0,
          revenuePerReferral: 0,
          roi: 0,
          bestPerformingPrograms: [],
          audienceDemographics: {},
          optimalTiming: ''
        };
      }

      const stats = channelStats[channel];
      stats.referrals++;

      if (referral.conversion_date) {
        stats.conversions++;
        stats.revenuePerReferral += referral.first_booking_value || 0;
      }
    });

    // Calculate channel metrics
    Object.entries(channelStats).forEach(([channel, stats]) => {
      stats.conversionRate = stats.referrals > 0 ? stats.conversions / stats.referrals : 0;
      stats.revenuePerReferral = stats.conversions > 0 ? stats.revenuePerReferral / stats.conversions : 0;

      // Estimate costs and ROI (simplified)
      stats.costPerReferral = this.estimateChannelCost(channel);
      const totalCost = stats.referrals * stats.costPerReferral;
      const totalRevenue = stats.conversions * stats.revenuePerReferral;
      stats.roi = totalCost > 0 ? ((totalRevenue - totalCost) / totalCost) * 100 : 0;

      // Determine optimal timing and demographics
      stats.optimalTiming = this.determineOptimalTiming(channel);
      stats.audienceDemographics = this.getChannelAudienceDemographics(channel);
    });

    return Object.values(channelStats).sort((a, b) => b.roi - a.roi);
  }

  private estimateChannelCost(channel: string): number {
    const costEstimates = {
      'direct': 0,
      'email': 2,
      'social_media': 5,
      'instagram': 8,
      'facebook': 6,
      'tiktok': 10,
      'youtube': 12,
      'blog': 4,
      'sms': 3,
      'whatsapp': 1
    };

    return costEstimates[channel as keyof typeof costEstimates] || 5;
  }

  private determineOptimalTiming(channel: string): string {
    const timingByChannel = {
      'email': 'Tuesday 10AM',
      'social_media': 'Evening 7-9PM',
      'instagram': 'Wednesday 6PM',
      'facebook': 'Thursday 2PM',
      'tiktok': 'Friday 8PM',
      'youtube': 'Saturday 1PM',
      'sms': 'Weekday 12PM',
      'whatsapp': 'Anytime'
    };

    return timingByChannel[channel as keyof typeof timingByChannel] || 'Flexible';
  }

  private getChannelAudienceDemographics(channel: string): Record<string, number> {
    const demographicsByChannel = {
      'instagram': { '18-34': 0.6, '35-44': 0.3, '45+': 0.1 },
      'facebook': { '18-34': 0.4, '35-54': 0.5, '55+': 0.1 },
      'tiktok': { '13-24': 0.7, '25-34': 0.25, '35+': 0.05 },
      'youtube': { '18-44': 0.6, '45-64': 0.35, '65+': 0.05 },
      'email': { '25-64': 0.8, '18-24': 0.1, '65+': 0.1 }
    };

    return demographicsByChannel[channel as keyof typeof demographicsByChannel] || { '18-44': 0.6, '45+': 0.4 };
  }

  private analyzeSeasonalReferralPatterns(referrals: Referral[]): SeasonalReferralPattern[] {
    const seasonalData: { [season: string]: { referrals: number; conversions: number; revenue: number; services: string[] } } = {
      spring: { referrals: 0, conversions: 0, revenue: 0, services: [] },
      summer: { referrals: 0, conversions: 0, revenue: 0, services: [] },
      autumn: { referrals: 0, conversions: 0, revenue: 0, services: [] },
      winter: { referrals: 0, conversions: 0, revenue: 0, services: [] }
    };

    // Group referrals by season
    referrals.forEach(referral => {
      const month = new Date(referral.referral_date).getMonth();
      let season: string;

      if (month >= 2 && month <= 4) season = 'spring';
      else if (month >= 5 && month <= 7) season = 'summer';
      else if (month >= 8 && month <= 10) season = 'autumn';
      else season = 'winter';

      const data = seasonalData[season];
      data.referrals++;

      if (referral.conversion_date) {
        data.conversions++;
        data.revenue += referral.first_booking_value || 0;
      }
    });

    // Generate seasonal patterns
    const patterns: SeasonalReferralPattern[] = [];
    Object.entries(seasonalData).forEach(([season, data]) => {
      const conversionRate = data.referrals > 0 ? data.conversions / data.referrals : 0;
      const averageRevenue = data.conversions > 0 ? data.revenue / data.conversions : 0;

      patterns.push({
        season,
        typicalReferralVolume: data.referrals,
        conversionRate,
        averageRevenue,
        popularServices: this.getSeasonalPopularServices(season),
        effectiveStrategies: this.getSeasonalEffectiveStrategies(season),
        recommendedActions: this.getSeasonalRecommendedActions(season, data)
      });
    });

    return patterns;
  }

  private getSeasonalPopularServices(season: string): string[] {
    const seasonalServices = {
      spring: ['Lip Enhancement', 'Brow Shaping', 'Pre-summer Prep'],
      summer: ['Body Treatments', 'Maintenance Services', 'Quick Touch-ups'],
      autumn: ['Glutes Programs', 'Fitness Prep', 'Wellness Services'],
      winter: ['Maintenance', 'Indoor Fitness', 'Wellness Packages']
    };

    return seasonalServices[season as keyof typeof seasonalServices] || [];
  }

  private getSeasonalEffectiveStrategies(season: string): string[] {
    const strategies = {
      spring: ['Spring Makeover Campaign', 'Summer Preparation Bundle', 'Social Media Contest'],
      summer: ['Beach Body Ready', 'Quick Treatment Promotions', 'Last-Minute Deals'],
      autumn: ['Back to Routine', 'Fall Fitness Challenge', 'Wellness Wednesday'],
      winter: ['Holiday Glamour', 'New Year Transformation', 'Winter Wellness']
    };

    return strategies[season as keyof typeof strategies] || [];
  }

  private getSeasonalRecommendedActions(season: string, data: any): string[] {
    const actions: string[] = [];

    if (data.referrals < 10) {
      actions.push('Increase seasonal marketing efforts');
      actions.push('Create season-specific referral incentives');
    }

    if (data.conversions / data.referrals < 0.2) {
      actions.push('Improve seasonal offer relevance');
      actions.push('Enhance conversion follow-up process');
    }

    if (data.revenue / data.conversions < 300) {
      actions.push('Promote higher-value seasonal services');
      actions.push('Create seasonal service bundles');
    }

    return actions;
  }

  private generateReferralRecommendations(
    programPerformance: ProgramPerformance[],
    channelEffectiveness: ChannelEffectiveness[],
    seasonalPatterns: SeasonalReferralPattern[]
  ): ReferralRecommendation[] {
    const recommendations: ReferralRecommendation[] = [];

    // Program optimization recommendations
    programPerformance.forEach(program => {
      if (program.conversionRate < 0.2) {
        recommendations.push({
          recommendation: `Optimize ${program.programName} for better conversion`,
          type: 'program_optimization',
          priority: 'high',
          expectedImpact: 25,
          implementationCost: 500,
          expectedROI: 400,
          timeline: '1_month',
          description: 'Improve conversion rate by optimizing referral process and incentives',
          metrics: ['conversion_rate', 'referral_volume', 'time_to_conversion']
        });
      }

      if (program.roi < 100) {
        recommendations.push({
          recommendation: `Adjust ${program.programName} reward structure`,
          type: 'incentive_adjustment',
          priority: 'medium',
          expectedImpact: 20,
          implementationCost: 200,
          expectedROI: 300,
          timeline: '2_weeks',
          description: 'Optimize reward amounts and conditions to improve ROI',
          metrics: ['roi', 'cost_per_acquisition', 'referral_value']
        });
      }
    });

    // Channel optimization recommendations
    const topChannels = channelEffectiveness.sort((a, b) => b.roi - a.roi).slice(0, 3);
    topChannels.forEach(channel => {
      if (channel.conversionRate < 0.3) {
        recommendations.push({
          recommendation: `Improve ${channel.channel} channel performance`,
          type: 'channel_improvement',
          priority: 'medium',
          expectedImpact: 15,
          implementationCost: 300,
          expectedROI: 200,
          timeline: '3_weeks',
          description: `Optimize messaging and timing for ${channel.channel} channel`,
          metrics: ['conversion_rate', 'engagement_rate', 'cost_per_conversion']
        });
      }
    });

    // Seasonal optimization recommendations
    seasonalPatterns.forEach(pattern => {
      if (pattern.typicalReferralVolume < 5) {
        recommendations.push({
          recommendation: `Boost ${pattern.season} referral program`,
          type: 'targeting_refinement',
          priority: 'low',
          expectedImpact: 10,
          implementationCost: 200,
          expectedROI: 150,
          timeline: '4_weeks',
          description: `Create seasonal campaigns and incentives for ${pattern.season}`,
          metrics: ['seasonal_referral_volume', 'seasonal_conversion_rate', 'seasonal_revenue']
        });
      }
    });

    return recommendations.sort((a, b) => {
      const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    });
  }

  async analyzeInfluencerPerformance(
    dateRange?: { start: Date; end: Date },
    tier?: string
  ): Promise<InfluencerAnalytics> {
    // Get influencer data
    const influencers = await this.getInfluencerData(tier);
    const referrals = await this.getInfluencerReferrals(dateRange);
    const campaigns = await this.getInfluencerCampaigns(dateRange);

    // Calculate overall metrics
    const totalInfluencers = influencers.length;
    const activeInfluencers = influencers.filter(i => i.is_active).length;
    const totalRevenue = referrals.reduce((sum, r) => sum + (r.first_booking_value || 0), 0);
    const averageInfluencerRevenue = totalInfluencers > 0 ? totalRevenue / totalInfluencers : 0;
    const totalReferrals = referrals.length;
    const conversions = referrals.filter(r => r.conversion_date).length;
    const conversionRate = totalReferrals > 0 ? conversions / totalReferrals : 0;

    // Analyze tier distribution
    const tierDistribution = this.analyzeTierDistribution(influencers);

    // Identify top performers
    const topPerformers = await this.identifyTopInfluencers(influencers, referrals);

    // Calculate performance metrics
    const performanceMetrics = this.calculateInfluencerMetrics(topPerformers, conversions, totalRevenue);

    // Analyze campaign effectiveness
    const campaignEffectiveness = await this.analyzeCampaignEffectiveness(campaigns, referrals);

    // Analyze content performance
    const contentPerformance = this.analyzeContentPerformance(influencers);

    // Analyze ROI
    const roiAnalysis = this.analyzeInfluencerROI(influencers, referrals, dateRange);

    // Generate optimization opportunities
    const optimizationOpportunities = this.generateInfluencerOptimizations(
      tierDistribution, performanceMetrics, campaignEffectiveness
    );

    return {
      totalInfluencers,
      activeInfluencers,
      totalRevenue,
      averageInfluencerRevenue,
      engagementRate: 0.85, // Mock - would calculate from actual engagement data
      conversionRate,
      tierDistribution,
      topPerformers,
      performanceMetrics,
      campaignEffectiveness,
      contentPerformance,
      roiAnalysis,
      optimizationOpportunities
    };
  }

  private async getInfluencerData(tier?: string): Promise<Influencer[]> {
    let query = supabase
      .from('influencers')
      .select('*')
      .order('total_revenue_generated', { ascending: false });

    if (tier) {
      query = query.eq('influencer_tier', tier);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch influencer data: ${error.message}`);
    }

    return data || [];
  }

  private async getInfluencerReferrals(dateRange?: { start: Date; end: Date }): Promise<Referral[]> {
    let query = supabase
      .from('referrals')
      .select('*')
      .in('program_id', ['influencer-partnership'])
      .order('referral_date', { ascending: false });

    if (dateRange) {
      query = query
        .gte('referral_date', dateRange.start.toISOString())
        .lte('referral_date', dateRange.end.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch influencer referrals: ${error.message}`);
    }

    return data || [];
  }

  private async getInfluencerCampaigns(dateRange?: { start: Date; end: Date }): Promise<any[]> {
    // Mock campaign data - would fetch from actual campaigns table
    return [
      {
        id: 'campaign-1',
        name: 'Summer Beauty Campaign',
        influencers: 5,
        start_date: dateRange?.start.toISOString() || new Date().toISOString(),
        end_date: dateRange?.end.toISOString() || new Date().toISOString(),
        budget: 5000,
        platform: 'instagram'
      }
    ];
  }

  private analyzeTierDistribution(influencers: Influencer[]): TierDistribution[] {
    const distribution: { [tier: string]: TierDistribution } = {};

    // Initialize tiers
    Object.keys(this.influencerTiers).forEach(tier => {
      distribution[tier] = {
        tier: tier as TierDistribution['tier'],
        count: 0,
        percentage: 0,
        averageRevenue: 0,
        averageEngagement: 0,
        conversionRate: 0,
        totalRevenue: 0,
        commissionRate: this.influencerTiers[tier as keyof typeof this.influencerTiers].commission
      };
    });

    // Count influencers by tier
    influencers.forEach(influencer => {
      const tier = influencer.influencer_tier;
      if (distribution[tier]) {
        distribution[tier].count++;
        distribution[tier].totalRevenue += influencer.total_revenue_generated || 0;
        distribution[tier].averageRevenue = (influencer.total_revenue_generated || 0) / distribution[tier].count;
        distribution[tier].averageEngagement = influencer.total_referrals || 0;
        distribution[tier].conversionRate = influencer.conversion_rate || 0;
      }
    });

    // Calculate percentages
    const totalInfluencers = influencers.length;
    Object.values(distribution).forEach(tier => {
      tier.percentage = totalInfluencers > 0 ? (tier.count / totalInfluencers) * 100 : 0;
    });

    return Object.values(distribution);
  }

  private async identifyTopInfluencers(influencers: Influencer[], referrals: Referral[]): Promise<TopInfluencer[]> {
    const topInfluencers: TopInfluencer[] = [];

    // Group referrals by influencer
    const influencerReferrals: { [influencerId: string]: Referral[] } = {};
    referrals.forEach(referral => {
      const influencerId = referral.referrer_id;
      if (influencerId) {
        if (!influencerReferrals[influencerId]) {
          influencerReferrals[influencerId] = [];
        }
        influencerReferrals[influencerId].push(referral);
      }
    });

    // Create top influencer profiles
    influencers.slice(0, 20).forEach(influencer => {
      const influencerSpecificReferrals = influencerReferrals[influencer.user_id] || [];
      const conversions = influencerSpecificReferrals.filter(r => r.conversion_date).length;
      const totalRevenue = influencerSpecificReferrals.reduce((sum, r) => sum + (r.first_booking_value || 0), 0);

      topInfluencers.push({
        influencerId: influencer.id,
        name: `Influencer ${influencer.user_id}`,
        handle: influencer.handle || 'unknown',
        platform: influencer.primary_platform || 'instagram',
        tier: influencer.influencer_tier,
        followers: influencer.follower_count || 0,
        totalReferrals: influencerSpecificReferrals.length,
        conversionRate: influencerSpecificReferrals.length > 0 ? conversions / influencerSpecificReferrals.length : 0,
        totalRevenue,
        commissionEarned: totalRevenue * (influencer.commission_rate || 0.1),
        engagementRate: 0.85, // Mock - would calculate from actual engagement data
        contentQuality: 0.8, // Mock - would assess from actual content
        brandAlignment: 0.9, // Mock - would assess from content analysis
        partnershipDuration: influencer.partnership_start_date ?
          (Date.now() - new Date(influencer.partnership_start_date).getTime()) / (1000 * 60 * 60 * 24) : 0,
        lastCampaignDate: new Date(),
        performanceScore: this.calculateInfluencerPerformanceScore(influencer, conversions, totalRevenue),
        strengths: this.identifyInfluencerStrengths(influencer, conversions),
        improvementAreas: this.identifyInfluencerImprovementAreas(influencer, conversions)
      });
    });

    return topInfluencers.sort((a, b) => b.performanceScore - a.performanceScore);
  }

  private calculateInfluencerPerformanceScore(influencer: Influencer, conversions: number, totalRevenue: number): number {
    let score = 0;

    // Revenue performance (40%)
    const revenueScore = Math.min(1, totalRevenue / 10000); // 10k PLN = perfect
    score += revenueScore * 0.4;

    // Conversion rate (30%)
    const conversionScore = Math.min(1, conversions / 20); // 20 conversions = perfect
    score += conversionScore * 0.3;

    // Consistency (20%)
    const consistencyScore = influencer.total_referrals > 0 ? Math.min(1, conversions / influencer.total_referrals) : 0;
    score += consistencyScore * 0.2;

    // Engagement (10%)
    score += 0.85 * 0.1; // Mock engagement score

    return score * 100;
  }

  private identifyInfluencerStrengths(influencer: Influencer, conversions: number): string[] {
    const strengths: string[] = [];

    if (conversions >= 10) strengths.push('high_conversion_rate');
    if (influencer.total_revenue_generated >= 5000) strengths.push('revenue_generator');
    if (influencer.follower_count >= 100000) strengths.push('large_audience');
    if (influencer.conversion_rate >= 0.5) strengths.push('quality_audience');
    if (influencer.commission_rate <= 0.08) strengths.push('cost_effective');

    return strengths.length > 0 ? strengths : ['potential_partner'];
  }

  private identifyInfluencerImprovementAreas(influencer: Influencer, conversions: number): string[] {
    const improvements: string[] = [];

    if (conversions < 5) improvements.push('conversion_optimization');
    if (influencer.total_revenue_generated < 2000) improvements.push('revenue_growth');
    if (influencer.conversion_rate < 0.2) improvements.push('audience_quality');
    if (influencer.follower_count < 10000) improvements.push('audience_growth');

    return improvements;
  }

  private calculateInfluencerMetrics(topPerformers: TopInfluencer[], conversions: number, totalRevenue: number): PerformanceMetrics[] {
    return [
      {
        metric: 'Average Revenue per Influencer',
        value: topPerformers.length > 0 ? totalRevenue / topPerformers.length : 0,
        benchmark: 5000,
        trend: 'increasing',
        change: 15.5,
        industryAverage: 3500,
        target: 8000
      },
      {
        metric: 'Conversion Rate',
        value: topPerformers.length > 0 ? topPerformers.reduce((sum, i) => sum + i.conversionRate, 0) / topPerformers.length : 0,
        benchmark: 0.3,
        trend: 'stable',
        change: 2.1,
        industryAverage: 0.25,
        target: 0.5
      },
      {
        metric: 'Engagement Rate',
        value: 0.85,
        benchmark: 0.75,
        trend: 'increasing',
        change: 8.2,
        industryAverage: 0.65,
        target: 0.9
      },
      {
        metric: 'ROI',
        value: 285,
        benchmark: 200,
        trend: 'increasing',
        change: 12.7,
        industryAverage: 180,
        target: 350
      }
    ];
  }

  private async analyzeCampaignEffectiveness(campaigns: any[], referrals: Referral[]): Promise<CampaignEffectiveness[]> {
    return campaigns.map(campaign => ({
      campaignId: campaign.id,
      campaignName: campaign.name,
      influencers: campaign.influencers,
      reach: campaign.influencers * 10000, // Mock reach calculation
      engagement: campaign.influencers * 500, // Mock engagement
      conversions: Math.floor(campaign.influencers * 3.5), // Mock conversions
      revenue: campaign.influencers * 1500, // Mock revenue
      cost: campaign.budget,
      roi: ((campaign.influencers * 1500 - campaign.budget) / campaign.budget) * 100,
      engagementRate: 0.05, // Mock
      conversionRate: 0.35, // Mock
      costPerAcquisition: campaign.budget / (campaign.influencers * 3.5),
      duration: 30, // days
      topPerformingContent: ['Before/After Videos', 'Tutorial Content', 'Testimonial Reels'],
      audienceResponse: ['Highly positive', 'Increased bookings', 'Brand awareness boost']
    }));
  }

  private analyzeContentPerformance(influencers: Influencer[]): ContentPerformance[] {
    return [
      {
        contentType: 'video',
        averageEngagement: 0.085,
        conversionRate: 0.042,
        costPerContent: 150,
        revenuePerContent: 850,
        bestPlatforms: ['Instagram', 'TikTok'],
        optimalPostingTimes: ['7-9PM', '12-2PM'],
        trendingHashtags: ['warsawbeauty', 'luxuryspa', 'selfcare'],
        effectiveCallsToAction: ['Book Now', 'Link in Bio', 'DM for Details'],
        audiencePreferences: { 'visual_content': 0.8, 'educational': 0.6, 'entertainment': 0.9 }
      },
      {
        contentType: 'image',
        averageEngagement: 0.045,
        conversionRate: 0.028,
        costPerContent: 80,
        revenuePerContent: 420,
        bestPlatforms: ['Instagram', 'Facebook'],
        optimalPostingTimes: ['9-11AM', '6-8PM'],
        trendingHashtags: ['beautytips', 'skincare', 'glam'],
        effectiveCallsToAction: ['Shop Now', 'Learn More', 'Book Appointment'],
        audiencePreferences: { 'visual_appeal': 0.9, 'information': 0.5, 'inspiration': 0.7 }
      }
    ];
  }

  private analyzeInfluencerROI(influencers: Influencer[], referrals: Referral[], dateRange?: { start: Date; end: Date }): ROIAnalysis {
    const totalInvestment = influencers.reduce((sum, i) => sum + 1000, 0); // Mock investment calculation
    const totalRevenue = referrals.reduce((sum, r) => sum + (r.first_booking_value || 0), 0);
    const roi = totalInvestment > 0 ? ((totalRevenue - totalInvestment) / totalInvestment) * 100 : 0;
    const conversions = referrals.filter(r => r.conversion_date).length;
    const cac = conversions > 0 ? totalInvestment / conversions : 0;
    const clv = 1500; // Mock customer lifetime value

    return {
      period: dateRange ? `${dateRange.start.toISOString().split('T')[0]} to ${dateRange.end.toISOString().split('T')[0]}` : 'Last 90 days',
      totalInvestment,
      totalRevenue,
      roi,
      roas: totalRevenue / totalInvestment,
      customerAcquisitionCost: cac,
      customerLifetimeValue: clv,
      paybackPeriod: cac > 0 ? (cac / 150) * 30 : 0, // days
      profitabilityScore: Math.min(100, roi / 5),
      incrementalRevenue: totalRevenue * 0.7, // Estimated incremental revenue
      brandValueIncrease: totalInvestment * 0.3 // Estimated brand value increase
    };
  }

  private generateInfluencerOptimizations(
    tierDistribution: TierDistribution[],
    performanceMetrics: PerformanceMetrics[],
    campaignEffectiveness: CampaignEffectiveness[]
  ): InfluencerOptimization[] {
    const optimizations: InfluencerOptimization[] = [];

    // Tier-based optimizations
    const lowPerformingTiers = tierDistribution.filter(tier => tier.conversionRate < 0.2);
    lowPerformingTiers.forEach(tier => {
      optimizations.push({
        optimizationType: 'tier_adjustment',
        description: `Optimize ${tier.tier} tier performance through better targeting and support`,
        expectedImpact: 25,
        implementationEffort: 'medium',
        priority: 'high',
        affectedInfluencers: [],
        recommendedActions: [
          'Provide better creative guidance',
          'Offer performance incentives',
          'Improve onboarding process'
        ],
        expectedROI: 200,
        timeline: '6_weeks'
      });
    });

    // Performance-based optimizations
    const lowPerformingMetrics = performanceMetrics.filter(metric => metric.value < metric.benchmark);
    lowPerformingMetrics.forEach(metric => {
      optimizations.push({
        optimizationType: 'campaign_optimization',
        description: `Improve ${metric.metric} through strategic adjustments`,
        expectedImpact: 20,
        implementationEffort: 'low',
        priority: 'medium',
        affectedInfluencers: [],
        recommendedActions: [
          'A/B test content approaches',
          'Optimize posting schedules',
          'Refine targeting parameters'
        ],
        expectedROI: 150,
        timeline: '4_weeks'
      });
    });

    return optimizations;
  }

  async createReferralCode(userId: string, programId: string): Promise<string> {
    const referralCode = this.generateReferralCode(userId);

    const { error } = await supabase
      .from('referrals')
      .insert({
        program_id: programId,
        referrer_id: userId,
        referral_code: referralCode,
        referral_date: new Date().toISOString(),
        attribution_window_days: 30
      });

    if (error) {
      throw new Error(`Failed to create referral code: ${error.message}`);
    }

    return referralCode;
  }

  private generateReferralCode(userId: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${userId.substring(0, 8)}-${timestamp}-${random}`.toUpperCase();
  }

  async trackReferralConversion(referralCode: string, bookingData: any): Promise<void> {
    // Find referral record
    const { data: referral, error: fetchError } = await supabase
      .from('referrals')
      .select('*')
      .eq('referral_code', referralCode)
      .single();

    if (fetchError || !referral) {
      throw new Error('Invalid referral code');
    }

    // Check if within attribution window
    const referralDate = new Date(referral.referral_date);
    const now = new Date();
    const daysSinceReferral = (now.getTime() - referralDate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceReferral > (referral.attribution_window_days || 30)) {
      throw new Error('Referral code expired');
    }

    // Update referral record
    const { error: updateError } = await supabase
      .from('referrals')
      .update({
        referred_id: bookingData.userId,
        conversion_date: now.toISOString(),
        first_booking_date: bookingData.bookingDate,
        first_booking_value: bookingData.totalAmount
      })
      .eq('id', referral.id);

    if (updateError) {
      throw new Error(`Failed to track referral conversion: ${updateError.message}`);
    }

    // Process rewards if conditions are met
    await this.processReferralReward(referral, bookingData);
  }

  private async processReferralReward(referral: Referral, bookingData: any): Promise<void> {
    // Get program details
    const { data: program } = await supabase
      .from('referral_programs')
      .select('*')
      .eq('id', referral.program_id)
      .single();

    if (!program) return;

    // Check if booking meets minimum value requirement
    if (program.minimum_booking_value && bookingData.totalAmount < program.minimum_booking_value) {
      return;
    }

    // Calculate reward amount
    let rewardAmount = program.reward_amount;
    if (program.reward_type === 'percentage') {
      rewardAmount = bookingData.totalAmount * (rewardAmount / 100);
    }

    // Update referral with reward information
    const { error } = await supabase
      .from('referrals')
      .update({
        reward_status: 'issued',
        reward_issued_date: new Date().toISOString(),
        reward_amount: rewardAmount
      })
      .eq('id', referral.id);

    if (error) {
      console.error('Failed to process referral reward:', error);
    }

    // Here you would integrate with your reward system (discount codes, cash payments, etc.)
    console.log(`Issued ${rewardAmount} ${program.reward_currency} reward to referrer ${referral.referrer_id}`);
  }
}

export const referralInfluencerEngine = new ReferralInfluencerEngine();