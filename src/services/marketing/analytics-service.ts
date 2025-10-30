import { supabase } from '@/integrations/supabase/client';
import {
  MarketingCampaign,
  CampaignPerformance,
  ContentPerformance,
  SocialPost,
  ClientTestimonial,
  InfluencerCollaboration,
  EmailAnalytics,
  CampaignStatus,
  SocialPlatform
} from '@/integrations/supabase/types/marketing.types';

// Analytics date ranges
type DateRange = '7d' | '30d' | '90d' | '1y' | 'custom' | { start: string; end: string };

// Comprehensive metrics interface
interface MarketingMetrics {
  overview: {
    total_spend: number;
    total_revenue: number;
    total_conversions: number;
    total_impressions: number;
    total_engagements: number;
    average_ctr: number;
    average_cpc: number;
    average_cpa: number;
    total_roi: number;
    romi: number; // Return on Marketing Investment
  };
  platform_performance: Record<SocialPlatform, {
    impressions: number;
    reach: number;
    engagements: number;
    engagement_rate: number;
    clicks: number;
    conversions: number;
    spend: number;
    cpa: number;
    roi: number;
    best_performing_content: string[];
  }>;
  campaign_performance: Array<{
    campaign_id: string;
    campaign_name: string;
    status: CampaignStatus;
    budget: number;
    spend: number;
    revenue: number;
    roi: number;
    conversions: number;
    kpis_met: number;
    total_kpis: number;
  }>;
  content_insights: {
    top_performing_posts: Array<{
      id: string;
      title: string;
      platform: SocialPlatform;
      engagement_rate: number;
      conversions: number;
      roi: number;
    }>;
    best_content_types: Record<string, {
      avg_engagement_rate: number;
      avg_ctr: number;
      avg_roi: number;
      post_count: number;
    }>;
    optimal_posting_times: Record<SocialPlatform, Array<{
      time: string;
      avg_engagement_rate: number;
      post_count: number;
    }>>;
  };
  audience_insights: {
    demographics: {
      age_groups: Record<string, number>;
      genders: Record<string, number>;
      locations: Record<string, number>;
    };
    behavior: {
      peak_activity_times: Record<string, number>;
      preferred_content_types: Record<string, number>;
      device_usage: Record<string, number>;
    };
  };
  conversion_funnel: {
    awareness: number;
    interest: number;
    consideration: number;
    conversion: number;
    retention: number;
    advocacy: number;
    drop_off_rates: Record<string, number>;
  };
  competitor_analysis: {
    market_share: number;
    competitor_performance: Array<{
      name: string;
      followers: number;
      engagement_rate: number;
      content_frequency: number;
      estimated_spend: number;
    }>;
    content_gaps: string[];
    opportunity_areas: string[];
  };
  attribution_analysis: {
    touchpoint_analysis: Record<string, {
      touch_count: number;
      conversion_rate: number;
      path_position: number;
      time_to_conversion: number;
    }>;
    path_analysis: Array<{
      path: string[];
      conversion_count: number;
      conversion_value: number;
      path_length: number;
    }>;
    model_comparison: {
      last_click: number;
      linear: number;
      time_decay: number;
      position_based: number;
      data_driven: number;
    };
  };
}

// Performance alerts and insights
interface PerformanceAlert {
  id: string;
  type: 'opportunity' | 'warning' | 'critical';
  category: 'spending' | 'performance' | 'engagement' | 'conversion';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  recommended_actions: string[];
  metrics_affected: string[];
  created_at: string;
  is_resolved: boolean;
}

// Prediction and forecasting
interface ForecastData {
  period: string;
  predicted_impressions: number;
  predicted_engagements: number;
  predicted_conversions: number;
  predicted_revenue: number;
  predicted_spend: number;
  confidence_level: number;
  factors: Array<{
    factor: string;
    impact: number;
    description: string;
  }>;
}

export class MarketingAnalyticsService {
  private readonly WARSOW_TIMEZONE = 'Europe/Warsaw';
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get comprehensive marketing analytics dashboard
   */
  async getMarketingAnalytics(dateRange: DateRange = '30d'): Promise<MarketingMetrics> {
    const cacheKey = `marketing_analytics_${JSON.stringify(dateRange)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const { startDate, endDate } = this.parseDateRange(dateRange);

      const [
        overview,
        platformPerformance,
        campaignPerformance,
        contentInsights,
        audienceInsights,
        conversionFunnel,
        competitorAnalysis,
        attributionAnalysis
      ] = await Promise.all([
        this.getOverviewMetrics(startDate, endDate),
        this.getPlatformPerformance(startDate, endDate),
        this.getCampaignPerformance(startDate, endDate),
        this.getContentInsights(startDate, endDate),
        this.getAudienceInsights(startDate, endDate),
        this.getConversionFunnel(startDate, endDate),
        this.getCompetitorAnalysis(startDate, endDate),
        this.getAttributionAnalysis(startDate, endDate)
      ]);

      const analytics: MarketingMetrics = {
        overview,
        platform_performance: platformPerformance,
        campaign_performance: campaignPerformance,
        content_insights: contentInsights,
        audience_insights: audienceInsights,
        conversion_funnel: conversionFunnel,
        competitor_analysis: competitorAnalysis,
        attribution_analysis: attributionAnalysis
      };

      this.setCache(cacheKey, analytics);
      return analytics;
    } catch (error) {
      console.error('Error getting marketing analytics:', error);
      throw error;
    }
  }

  /**
   * Get overview metrics
   */
  private async getOverviewMetrics(startDate: string, endDate: string): Promise<MarketingMetrics['overview']> {
    try {
      // Get campaign performance data
      const { data: campaignData } = await supabase
        .from('campaign_performance')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate);

      // Get content performance data
      const { data: contentData } = await supabase
        .from('content_performance')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate);

      // Get email analytics
      const { data: emailData } = await supabase
        .from('email_analytics')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      // Aggregate metrics
      const totalSpend = campaignData?.reduce((sum, c) => sum + (c.spend || 0), 0) || 0;
      const totalImpressions = campaignData?.reduce((sum, c) => sum + (c.impressions || 0), 0) || 0;
      const totalEngagements = campaignData?.reduce((sum, c) => sum + (c.engagements || 0), 0) || 0;
      const totalClicks = campaignData?.reduce((sum, c) => sum + (c.clicks || 0), 0) || 0;
      const totalConversions = campaignData?.reduce((sum, c) => sum + (c.conversions || 0), 0) || 0;

      // Calculate revenue (estimated from conversions)
      const averageConversionValue = 250; // PLN - average service value
      const totalRevenue = totalConversions * averageConversionValue;

      // Calculate derived metrics
      const averageCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
      const averageCPC = totalClicks > 0 ? totalSpend / totalClicks : 0;
      const averageCPA = totalConversions > 0 ? totalSpend / totalConversions : 0;
      const totalROI = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;
      const romi = totalSpend > 0 ? totalRevenue / totalSpend : 0;

      return {
        total_spend: totalSpend,
        total_revenue: totalRevenue,
        total_conversions: totalConversions,
        total_impressions: totalImpressions,
        total_engagements: totalEngagements,
        average_ctr: Math.round(averageCTR * 100) / 100,
        average_cpc: Math.round(averageCPC * 100) / 100,
        average_cpa: Math.round(averageCPA * 100) / 100,
        total_roi: Math.round(totalROI * 100) / 100,
        romi: Math.round(romi * 100) / 100
      };
    } catch (error) {
      console.error('Error getting overview metrics:', error);
      return this.getEmptyOverviewMetrics();
    }
  }

  /**
   * Get platform performance breakdown
   */
  private async getPlatformPerformance(startDate: string, endDate: string): Promise<MarketingMetrics['platform_performance']> {
    try {
      const { data: performanceData } = await supabase
        .from('campaign_performance')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate);

      const { data: contentData } = await supabase
        .from('content_performance')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate);

      const platforms: SocialPlatform[] = ['instagram', 'facebook', 'linkedin', 'tiktok', 'youtube', 'pinterest'];
      const platformPerformance: MarketingMetrics['platform_performance'] = {} as any;

      for (const platform of platforms) {
        const platformCampaigns = performanceData?.filter(p => p.platform === platform) || [];
        const platformContent = contentData?.filter(c => c.platform === platform) || [];

        const impressions = platformCampaigns.reduce((sum, p) => sum + (p.impressions || 0), 0);
        const reach = platformCampaigns.reduce((sum, p) => sum + (p.reach || 0), 0);
        const engagements = platformCampaigns.reduce((sum, p) => sum + (p.engagements || 0), 0);
        const clicks = platformCampaigns.reduce((sum, p) => sum + (p.clicks || 0), 0);
        const conversions = platformCampaigns.reduce((sum, p) => sum + (p.conversions || 0), 0);
        const spend = platformCampaigns.reduce((sum, p) => sum + (p.spend || 0), 0);

        const engagementRate = impressions > 0 ? (engagements / impressions) * 100 : 0;
        const cpa = conversions > 0 ? spend / conversions : 0;
        const revenue = conversions * 250; // estimated value
        const roi = spend > 0 ? ((revenue - spend) / spend) * 100 : 0;

        // Find best performing content
        const bestContent = platformContent
          .sort((a, b) => (b.engagement_rate || 0) - (a.engagement_rate || 0))
          .slice(0, 3)
          .map(c => c.content_id);

        platformPerformance[platform] = {
          impressions,
          reach,
          engagements,
          engagement_rate: Math.round(engagementRate * 100) / 100,
          clicks,
          conversions,
          spend,
          cpa: Math.round(cpa * 100) / 100,
          roi: Math.round(roi * 100) / 100,
          best_performing_content: bestContent
        };
      }

      return platformPerformance;
    } catch (error) {
      console.error('Error getting platform performance:', error);
      return this.getEmptyPlatformPerformance();
    }
  }

  /**
   * Get campaign performance
   */
  private async getCampaignPerformance(startDate: string, endDate: string): Promise<MarketingMetrics['campaign_performance']> {
    try {
      const { data: campaigns } = await supabase
        .from('marketing_campaigns')
        .select(`
          *,
          campaign_performance!inner(
            date,
            spend,
            impressions,
            engagements,
            conversions
          )
        `)
        .gte('campaign_performance.date', startDate)
        .lte('campaign_performance.date', endDate);

      if (!campaigns) return [];

      return campaigns.map(campaign => {
        const campaignPerf = campaign.campaign_performance || [];
        const totalSpend = campaignPerf.reduce((sum, p) => sum + (p.spend || 0), 0);
        const totalConversions = campaignPerf.reduce((sum, p) => sum + (p.conversions || 0), 0);
        const totalRevenue = totalConversions * 250; // estimated value
        const roi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;

        // Calculate KPI performance
        const targetMetrics = campaign.target_metrics || {};
        const actualMetrics = campaign.actual_metrics || {};
        const kpisMet = Object.keys(targetMetrics).filter(key => {
          const target = targetMetrics[key];
          const actual = actualMetrics[key];
          return actual >= target;
        }).length;

        return {
          campaign_id: campaign.id,
          campaign_name: campaign.name,
          status: campaign.status,
          budget: campaign.budget || 0,
          spend: totalSpend,
          revenue: totalRevenue,
          roi: Math.round(roi * 100) / 100,
          conversions: totalConversions,
          kpis_met: kpisMet,
          total_kpis: Object.keys(targetMetrics).length
        };
      });
    } catch (error) {
      console.error('Error getting campaign performance:', error);
      return [];
    }
  }

  /**
   * Get content insights
   */
  private async getContentInsights(startDate: string, endDate: string): Promise<MarketingMetrics['content_insights']> {
    try {
      const { data: contentData } = await supabase
        .from('content_performance')
        .select(`
          *,
          social_posts!inner(
            title,
            platform,
            post_type
          )
        `)
        .gte('date', startDate)
        .lte('date', endDate);

      if (!contentData) {
        return {
          top_performing_posts: [],
          best_content_types: {},
          optimal_posting_times: {}
        };
      }

      // Find top performing posts
      const topPosts = contentData
        .sort((a, b) => (b.engagement_rate || 0) - (a.engagement_rate || 0))
        .slice(0, 10)
        .map(cp => ({
          id: cp.content_id,
          title: cp.social_posts.title,
          platform: cp.social_posts.platform,
          engagement_rate: cp.engagement_rate || 0,
          conversions: cp.conversions || 0,
          roi: cp.roi || 0
        }));

      // Analyze best content types
      const contentTypeStats: Record<string, {
        total_engagement_rate: number;
        total_ctr: number;
        total_roi: number;
        count: number;
      }> = {};

      contentData.forEach(cp => {
        const contentType = cp.social_posts.post_type;
        if (!contentTypeStats[contentType]) {
          contentTypeStats[contentType] = {
            total_engagement_rate: 0,
            total_ctr: 0,
            total_roi: 0,
            count: 0
          };
        }

        contentTypeStats[contentType].total_engagement_rate += cp.engagement_rate || 0;
        contentTypeStats[contentType].total_ctr += cp.click_through_rate || 0;
        contentTypeStats[contentType].total_roi += cp.roi || 0;
        contentTypeStats[contentType].count++;
      });

      const bestContentTypes: Record<string, any> = {};
      Object.entries(contentTypeStats).forEach(([type, stats]) => {
        bestContentTypes[type] = {
          avg_engagement_rate: Math.round((stats.total_engagement_rate / stats.count) * 100) / 100,
          avg_ctr: Math.round((stats.total_ctr / stats.count) * 100) / 100,
          avg_roi: Math.round((stats.total_roi / stats.count) * 100) / 100,
          post_count: stats.count
        };
      });

      // Analyze optimal posting times
      const optimalTimes: Record<SocialPlatform, any> = {};
      const platforms: SocialPlatform[] = ['instagram', 'facebook', 'linkedin', 'tiktok'];

      for (const platform of platforms) {
        const platformData = contentData.filter(cp => cp.social_posts.platform === platform);
        const timeStats: Record<string, { total_engagement: number; count: number }> = {};

        platformData.forEach(cp => {
          // Extract hour from content creation or posting time
          const hour = new Date(cp.date).getHours();
          const timeSlot = `${hour}:00`;

          if (!timeStats[timeSlot]) {
            timeStats[timeSlot] = { total_engagement: 0, count: 0 };
          }

          timeStats[timeSlot].total_engagement += cp.engagement_rate || 0;
          timeStats[timeSlot].count++;
        });

        optimalTimes[platform] = Object.entries(timeStats)
          .map(([time, stats]) => ({
            time,
            avg_engagement_rate: stats.count > 0 ? stats.total_engagement / stats.count : 0,
            post_count: stats.count
          }))
          .sort((a, b) => b.avg_engagement_rate - a.avg_engagement_rate)
          .slice(0, 5);
      }

      return {
        top_performing_posts: topPosts,
        best_content_types: bestContentTypes,
        optimal_posting_times: optimalTimes
      };
    } catch (error) {
      console.error('Error getting content insights:', error);
      return {
        top_performing_posts: [],
        best_content_types: {},
        optimal_posting_times: {}
      };
    }
  }

  /**
   * Get audience insights
   */
  private async getAudienceInsights(startDate: string, endDate: string): Promise<MarketingMetrics['audience_insights']> {
    try {
      // Simulated audience insights - in production, this would use actual analytics data
      return {
        demographics: {
          age_groups: {
            '18-24': 15,
            '25-34': 35,
            '35-44': 30,
            '45-54': 15,
            '55+': 5
          },
          genders: {
            'Kobiety': 85,
            'Mężczyźni': 15
          },
          locations: {
            'Warszawa': 60,
            'Kraków': 10,
            'Łódź': 5,
            'Wrocław': 8,
            'Poznań': 7,
            'Inne': 10
          }
        },
        behavior: {
          peak_activity_times: {
            '08:00-10:00': 25,
            '12:00-14:00': 30,
            '18:00-20:00': 35,
            '20:00-22:00': 10
          },
          preferred_content_types: {
            'carousel': 40,
            'reel': 30,
            'image': 20,
            'video': 10
          },
          device_usage: {
            'Mobile': 75,
            'Desktop': 20,
            'Tablet': 5
          }
        }
      };
    } catch (error) {
      console.error('Error getting audience insights:', error);
      return {
        demographics: { age_groups: {}, genders: {}, locations: {} },
        behavior: { peak_activity_times: {}, preferred_content_types: {}, device_usage: {} }
      };
    }
  }

  /**
   * Get conversion funnel analysis
   */
  private async getConversionFunnel(startDate: string, endDate: string): Promise<MarketingMetrics['conversion_funnel']> {
    try {
      // Get funnel stage data from various sources
      const { data: socialData } = await supabase
        .from('content_performance')
        .select('impressions, engagements, clicks, conversions')
        .gte('date', startDate)
        .lte('date', endDate);

      const { data: emailData } = await supabase
        .from('email_analytics')
        .select('delivered_at, opened_at, clicked_at, status')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      const totalImpressions = socialData?.reduce((sum, s) => sum + (s.impressions || 0), 0) || 0;
      const totalEngagements = socialData?.reduce((sum, s) => sum + (s.engagements || 0), 0) || 0;
      const totalClicks = socialData?.reduce((sum, s) => sum + (s.clicks || 0), 0) || 0;
      const totalConversions = socialData?.reduce((sum, s) => sum + (s.conversions || 0), 0) || 0;

      // Calculate funnel metrics
      const awareness = totalImpressions;
      const interest = totalEngagements;
      const consideration = totalClicks;
      const conversion = totalConversions;

      // Estimate retention and advocacy based on repeat business and reviews
      const retention = Math.floor(conversion * 0.7); // 70% retention estimate
      const advocacy = Math.floor(retention * 0.4); // 40% become advocates

      // Calculate drop-off rates
      const dropOffRates = {
        awareness_to_interest: awareness > 0 ? ((awareness - interest) / awareness) * 100 : 0,
        interest_to_consideration: interest > 0 ? ((interest - consideration) / interest) * 100 : 0,
        consideration_to_conversion: consideration > 0 ? ((consideration - conversion) / consideration) * 100 : 0,
        conversion_to_retention: conversion > 0 ? ((conversion - retention) / conversion) * 100 : 0,
        retention_to_advocacy: retention > 0 ? ((retention - advocacy) / retention) * 100 : 0
      };

      return {
        awareness,
        interest,
        consideration,
        conversion,
        retention,
        advocacy,
        drop_off_rates: dropOffRates
      };
    } catch (error) {
      console.error('Error getting conversion funnel:', error);
      return {
        awareness: 0,
        interest: 0,
        consideration: 0,
        conversion: 0,
        retention: 0,
        advocacy: 0,
        drop_off_rates: {}
      };
    }
  }

  /**
   * Get competitor analysis
   */
  private async getCompetitorAnalysis(startDate: string, endDate: string): Promise<MarketingMetrics['competitor_analysis']> {
    try {
      const { data: competitors } = await supabase
        .from('competitors')
        .select('*')
        .eq('is_active', true);

      const { data: competitorAnalysis } = await supabase
        .from('competitor_analysis')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate);

      // Calculate market share based on follower counts
      const ourFollowers = 50000; // Our estimated follower count
      const totalMarketFollowers = competitors?.reduce((sum, c) => sum + (c.follower_count || 0), 0) || 0 + ourFollowers;
      const marketShare = (ourFollowers / totalMarketFollowers) * 100;

      // Compile competitor performance data
      const competitorPerformance = competitors?.map(competitor => {
        const analysis = competitorAnalysis?.filter(a => a.competitor_id === competitor.id);
        const avgEngagementRate = analysis?.reduce((sum, a) => sum + (a.engagement_rate || 0), 0) / (analysis?.length || 1) || 0;
        const avgContentFrequency = analysis?.reduce((sum, a) => sum + (a.post_count || 0), 0) / (analysis?.length || 1) || 0;

        return {
          name: competitor.name,
          followers: competitor.follower_count || 0,
          engagement_rate: Math.round(avgEngagementRate * 100) / 100,
          content_frequency: Math.round(avgContentFrequency * 10) / 10,
          estimated_spend: this.estimateCompetitorSpend(competitor)
        };
      }) || [];

      // Identify content gaps and opportunities
      const contentGaps = this.identifyContentGaps(competitorPerformance);
      const opportunityAreas = this.identifyOpportunityAreas(competitorPerformance);

      return {
        market_share: Math.round(marketShare * 100) / 100,
        competitor_performance: competitorPerformance,
        content_gaps: contentGaps,
        opportunity_areas: opportunityAreas
      };
    } catch (error) {
      console.error('Error getting competitor analysis:', error);
      return {
        market_share: 0,
        competitor_performance: [],
        content_gaps: [],
        opportunity_areas: []
      };
    }
  }

  /**
   * Get attribution analysis
   */
  private async getAttributionAnalysis(startDate: string, endDate: string): Promise<MarketingMetrics['attribution_analysis']> {
    try {
      // Get conversion data with touchpoint information
      const { data: conversions } = await supabase
        .from('bookings')
        .select(`
          *,
          booking_data
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (!conversions) {
        return this.getEmptyAttributionAnalysis();
      }

      // Analyze touchpoints
      const touchpointAnalysis: Record<string, any> = {};
      const pathAnalysis: any[] = [];

      conversions.forEach(conversion => {
        const bookingData = conversion.booking_data as any;
        const touchpoints = bookingData?.touchpoints || ['direct']; // Default if no data

        // Record path
        pathAnalysis.push({
          path: touchpoints,
          conversion_count: 1,
          conversion_value: conversion.total_amount,
          path_length: touchpoints.length
        });

        // Analyze individual touchpoints
        touchpoints.forEach((touchpoint: string, index: number) => {
          if (!touchpointAnalysis[touchpoint]) {
            touchpointAnalysis[touchpoint] = {
              touch_count: 0,
              conversion_count: 0,
              total_path_position: 0,
              total_time_to_conversion: 0
            };
          }

          touchpointAnalysis[touchpoint].touch_count++;
          touchpointAnalysis[touchpoint].total_path_position += index + 1;
        });
      });

      // Calculate derived metrics
      Object.entries(touchpointAnalysis).forEach(([touchpoint, data]) => {
        const touchpointData = data as any;
        touchpointAnalysis[touchpoint] = {
          touch_count: touchpointData.touch_count,
          conversion_rate: conversions.length > 0 ? (touchpointData.touch_count / conversions.length) * 100 : 0,
          path_position: touchpointData.touch_count > 0 ? touchpointData.total_path_position / touchpointData.touch_count : 0,
          time_to_conversion: 2 // days - estimated
        };
      });

      // Calculate attribution model values
      const totalConversionValue = conversions.reduce((sum, c) => sum + c.total_amount, 0);
      const modelComparison = {
        last_click: totalConversionValue * 0.4, // 40% to last click
        linear: totalConversionValue * 0.2,     // 20% linear distribution
        time_decay: totalConversionValue * 0.2, // 20% time decay
        position_based: totalConversionValue * 0.1, // 10% position based
        data_driven: totalConversionValue * 0.1    // 10% data driven
      };

      return {
        touchpoint_analysis: touchpointAnalysis,
        path_analysis: pathAnalysis,
        model_comparison: modelComparison
      };
    } catch (error) {
      console.error('Error getting attribution analysis:', error);
      return this.getEmptyAttributionAnalysis();
    }
  }

  /**
   * Generate performance alerts
   */
  async generatePerformanceAlerts(dateRange: DateRange = '30d'): Promise<PerformanceAlert[]> {
    try {
      const analytics = await this.getMarketingAnalytics(dateRange);
      const alerts: PerformanceAlert[] = [];

      // Check for overspending
      if (analytics.overview.total_spend > (analytics.overview.budget || 0) * 0.9) {
        alerts.push({
          id: `overspend_${Date.now()}`,
          type: 'warning',
          category: 'spending',
          title: 'Blisko przekroczenia budżetu',
          description: `Wydatki marketingowe wynoszą ${analytics.overview.total_spend} PLN, co stanowi 90% allocated budżetu.`,
          impact: 'high',
          recommended_actions: [
            'Przejrzyj wydatki na poszczególnych platformach',
            'Oceń efektywność działających kampanii',
            'Rozważ ograniczenie wydatków na najmniej efektywne kampanie'
          ],
          metrics_affected: ['total_spend', 'roi'],
          created_at: new Date().toISOString(),
          is_resolved: false
        });
      }

      // Check for low ROI
      if (analytics.overview.total_roi < 150) { // Less than 150% ROI
        alerts.push({
          id: `low_roi_${Date.now()}`,
          type: 'warning',
          category: 'performance',
          title: 'Niski zwrot z inwestycji marketingowych',
          description: `ROI wynosi ${analytics.overview.total_roi}%, co jest poniżej docelowego poziomu 200%.`,
          impact: 'medium',
          recommended_actions: [
            'Optymalizuj targetowanie kampanii',
            'Przetestuj nowe kreacje reklamowe',
            'Przeanalizuj wydajność poszczególnych platform'
          ],
          metrics_affected: ['roi', 'cpa', 'conversions'],
          created_at: new Date().toISOString(),
          is_resolved: false
        });
      }

      // Check for low engagement rate
      const avgEngagementRate = Object.values(analytics.platform_performance)
        .reduce((sum, p) => sum + p.engagement_rate, 0) / Object.keys(analytics.platform_performance).length;

      if (avgEngagementRate < 2) {
        alerts.push({
          id: `low_engagement_${Date.now()}`,
          type: 'opportunity',
          category: 'engagement',
          title: 'Niska stopa zaangażowania',
          description: `Średnia stopa zaangażowania wynosi ${avgEngagementRate.toFixed(2)}%, co wskazuje na potrzebę optymalizacji treści.`,
          impact: 'medium',
          recommended_actions: [
            'Stwórz bardziej angażujące treści',
            'Użyj więcej formatów wideo',
            'Zwiększ interakcję z odbiorcami',
            'Przetestuj różne godziny publikacji'
          ],
          metrics_affected: ['engagement_rate', 'impressions', 'reach'],
          created_at: new Date().toISOString(),
          is_resolved: false
        });
      }

      // Check for conversion drop-offs
      const considerToConvDropOff = analytics.conversion_funnel.drop_off_rates.consideration_to_conversion;
      if (considerToConvDropOff > 80) {
        alerts.push({
          id: `conversion_dropoff_${Date.now()}`,
          type: 'critical',
          category: 'conversion',
          title: 'Wysoki spadek konwersji',
          description: `${considerToConvDropOff.toFixed(1)}% użytkowników rezygnuje na etapie konwersji.`,
          impact: 'high',
          recommended_actions: [
            'Uprościj proces rezerwacji',
            'Dodaj opinie klientów przy CTA',
            'Przetestuj różne warianty CTA',
            'Sprawdź czy strona docelowa działa poprawnie'
          ],
          metrics_affected: ['conversions', 'cpa', 'roi'],
          created_at: new Date().toISOString(),
          is_resolved: false
        });
      }

      return alerts;
    } catch (error) {
      console.error('Error generating performance alerts:', error);
      return [];
    }
  }

  /**
   * Generate forecasting data
   */
  async generateForecastingData(periods: number = 12): Promise<ForecastData[]> {
    try {
      const historicalData = await this.getMarketingAnalytics('90d');
      const forecasts: ForecastData[] = [];

      for (let i = 1; i <= periods; i++) {
        const periodDate = new Date();
        periodDate.setMonth(periodDate.getMonth() + i);

        // Simple forecasting based on historical trends
        const growthFactor = 1.05; // 5% monthly growth assumption
        const seasonalFactor = this.getSeasonalFactor(periodDate.getMonth());

        const predictedImpressions = Math.round(historicalData.overview.total_impressions * growthFactor * seasonalFactor * (i / 3));
        const predictedEngagements = Math.round(predictedImpressions * (historicalData.overview.total_engagements / historicalData.overview.total_impressions));
        const predictedConversions = Math.round(predictedEngagements * 0.02); // 2% conversion rate assumption
        const predictedRevenue = predictedConversions * 250; // average value
        const predictedSpend = predictedImpressions * 0.05; // CPM assumption

        forecasts.push({
          period: periodDate.toISOString().split('T')[0],
          predicted_impressions: predictedImpressions,
          predicted_engagements: predictedEngagements,
          predicted_conversions: predictedConversions,
          predicted_revenue: predictedRevenue,
          predicted_spend: predictedSpend,
          confidence_level: Math.max(60, 95 - (i * 5)), // Decreasing confidence over time
          factors: [
            {
              factor: 'Historyczne trendy',
              impact: growthFactor * 100,
              description: 'Oparty na ostatnich 90 dniach danych'
            },
            {
              factor: 'Sezonowość',
              impact: seasonalFactor * 100,
              description: 'Sezonowe wahania w branży beauty/fitness'
            },
            {
              factor: 'Wzrost rynku',
              impact: 105,
              description: 'Przewidywany wzrost rynku w Warszawie'
            }
          ]
        });
      }

      return forecasts;
    } catch (error) {
      console.error('Error generating forecasting data:', error);
      return [];
    }
  }

  // Helper methods
  private parseDateRange(range: DateRange): { startDate: string; endDate: string } {
    const endDate = new Date().toISOString().split('T')[0];
    let startDate: string;

    if (range === 'custom' && typeof range === 'object') {
      return {
        startDate: range.start,
        endDate: range.end
      };
    }

    const days = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    };

    const daysBack = days[range as keyof typeof days] || 30;
    const start = new Date();
    start.setDate(start.getDate() - daysBack);
    startDate = start.toISOString().split('T')[0];

    return { startDate, endDate };
  }

  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private getSeasonalFactor(month: number): number {
    // Seasonal factors for beauty/fitness industry in Poland
    const factors = [0.8, 0.9, 1.1, 1.2, 1.3, 1.4, 1.3, 1.2, 1.1, 1.0, 0.9, 0.8]; // Jan-Dec
    return factors[month];
  }

  private estimateCompetitorSpend(competitor: any): number {
    // Estimate competitor spend based on follower count and engagement
    const followerCount = competitor.follower_count || 0;
    const baseSpendPerFollower = 0.001; // PLN per follower per month
    return Math.round(followerCount * baseSpendPerFollower);
  }

  private identifyContentGaps(competitors: any[]): string[] {
    const commonContent = ['promotions', 'behind_scenes', 'testimonials'];
    return ['Educational content', 'Tutorials', 'Industry insights', 'User-generated content'];
  }

  private identifyOpportunityAreas(competitors: any[]): string[] {
    return ['Micro-influencer partnerships', 'Local community engagement', 'Seasonal campaigns', 'Interactive content'];
  }

  // Empty/default methods for error cases
  private getEmptyOverviewMetrics(): MarketingMetrics['overview'] {
    return {
      total_spend: 0,
      total_revenue: 0,
      total_conversions: 0,
      total_impressions: 0,
      total_engagements: 0,
      average_ctr: 0,
      average_cpc: 0,
      average_cpa: 0,
      total_roi: 0,
      romi: 0
    };
  }

  private getEmptyPlatformPerformance(): MarketingMetrics['platform_performance'] {
    const platforms: SocialPlatform[] = ['instagram', 'facebook', 'linkedin', 'tiktok', 'youtube', 'pinterest'];
    const empty: any = {};
    platforms.forEach(platform => {
      empty[platform] = {
        impressions: 0,
        reach: 0,
        engagements: 0,
        engagement_rate: 0,
        clicks: 0,
        conversions: 0,
        spend: 0,
        cpa: 0,
        roi: 0,
        best_performing_content: []
      };
    });
    return empty;
  }

  private getEmptyAttributionAnalysis(): MarketingMetrics['attribution_analysis'] {
    return {
      touchpoint_analysis: {},
      path_analysis: [],
      model_comparison: {
        last_click: 0,
        linear: 0,
        time_decay: 0,
        position_based: 0,
        data_driven: 0
      }
    };
  }

  /**
   * Generate comprehensive marketing report
   */
  async generateMarketingReport(dateRange: DateRange = '30d'): Promise<{
    summary: string;
    key_insights: string[];
    recommendations: string[];
    next_steps: string[];
    analytics: MarketingMetrics;
    alerts: PerformanceAlert[];
    forecasts: ForecastData[];
  }> {
    try {
      const [analytics, alerts, forecasts] = await Promise.all([
        this.getMarketingAnalytics(dateRange),
        this.generatePerformanceAlerts(dateRange),
        this.generateForecastingData(6)
      ]);

      const summary = this.generateReportSummary(analytics);
      const keyInsights = this.extractKeyInsights(analytics);
      const recommendations = this.generateRecommendations(analytics, alerts);
      const nextSteps = this.generateNextSteps(analytics, alerts);

      return {
        summary,
        key_insights: keyInsights,
        recommendations,
        next_steps,
        analytics,
        alerts,
        forecasts
      };
    } catch (error) {
      console.error('Error generating marketing report:', error);
      throw error;
    }
  }

  private generateReportSummary(analytics: MarketingMetrics): string {
    const roi = analytics.overview.total_roi;
    const conversions = analytics.overview.total_conversions;
    const topPlatform = Object.entries(analytics.platform_performance)
      .sort(([, a], [, b]) => b.roi - a.roi)[0];

    return `W okresie sprawozdawczym kampanie marketingowe wygenerowały ROI na poziomie ${roi}% z ${conversions} konwersjami. Najlepszą platformą okazał się ${topPlatform?.[0] || 'Instagram'} z ROI ${topPlatform?.[1]?.roi || 0}%.`;
  }

  private extractKeyInsights(analytics: MarketingMetrics): string[] {
    const insights: string[] = [];

    // Performance insights
    if (analytics.overview.total_roi > 200) {
      insights.push('Marketing campaigns are performing exceptionally well with ROI above 200%');
    }

    // Platform insights
    const bestPlatform = Object.entries(analytics.platform_performance)
      .sort(([, a], [, b]) => b.engagement_rate - a.engagement_rate)[0];

    if (bestPlatform) {
      insights.push(`${bestPlatform[0]} shows highest engagement rate at ${bestPlatform[1].engagement_rate}%`);
    }

    // Content insights
    const topContentType = Object.entries(analytics.content_insights.best_content_types)
      .sort(([, a], [, b]) => b.avg_engagement_rate - a.avg_engagement_rate)[0];

    if (topContentType) {
      insights.push(`${topContentType[0]} content performs best with ${topContentType[1].avg_engagement_rate}% engagement`);
    }

    return insights;
  }

  private generateRecommendations(analytics: MarketingMetrics, alerts: PerformanceAlert[]): string[] {
    const recommendations: string[] = [];

    // Budget recommendations
    if (analytics.overview.total_roi < 150) {
      recommendations.push('Reallocate budget to better performing platforms');
    }

    // Content recommendations
    const lowPerformingPlatforms = Object.entries(analytics.platform_performance)
      .filter(([, p]) => p.engagement_rate < 2)
      .map(([p]) => p);

    if (lowPerformingPlatforms.length > 0) {
      recommendations.push(`Improve content strategy for ${lowPerformingPlatforms.join(', ')}`);
    }

    // Conversion recommendations
    if (analytics.conversion_funnel.drop_off_rates.consideration_to_conversion > 70) {
      recommendations.push('Optimize conversion funnel to reduce drop-off rates');
    }

    return recommendations;
  }

  private generateNextSteps(analytics: MarketingMetrics, alerts: PerformanceAlert[]): string[] {
    const steps: string[] = [];

    // Address critical alerts
    const criticalAlerts = alerts.filter(a => a.type === 'critical');
    if (criticalAlerts.length > 0) {
      steps.push('Address critical performance alerts immediately');
    }

    // Optimization steps
    steps.push('Schedule weekly performance review meetings');
    steps.push('Implement A/B testing for underperforming content');
    steps.push('Expand successful content to other platforms');

    return steps;
  }
}

// Export singleton instance
export const marketingAnalytics = new MarketingAnalyticsService();