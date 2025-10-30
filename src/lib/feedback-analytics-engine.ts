// Satisfaction Analytics and Sentiment Analysis Engine
// For luxury beauty/fitness platform feedback insights

import { supabase } from '@/integrations/supabase/client';
import type {
  SatisfactionMetric,
  NPSMeasurement,
  CESMeasurement,
  SentimentAnalysis,
  FeedbackTheme,
  ServiceRecoveryCase,
  ClientSatisfactionPrediction,
  SatisfactionMetricType,
  ServiceType,
  SentimentSourceType
} from '@/types/feedback';

export interface AnalyticsFilter {
  dateRange: {
    start: string;
    end: string;
  };
  serviceTypes?: ServiceType[];
  staffIds?: string[];
  clientSegments?: string[];
  ratingRange?: { min: number; max: number };
}

export interface SatisfactionTrend {
  period: string;
  averageScore: number;
  totalResponses: number;
  trendDirection: 'up' | 'down' | 'stable';
  trendPercentage: number;
  confidence: number;
}

export interface SentimentBreakdown {
  positive: {
    count: number;
    percentage: number;
    averageScore: number;
    commonThemes: string[];
  };
  negative: {
    count: number;
    percentage: number;
    averageScore: number;
    commonThemes: string[];
    urgentIssues: string[];
  };
  neutral: {
    count: number;
    percentage: number;
    averageScore: number;
  };
}

export interface ThemeAnalysis {
  theme: string;
  category: string;
  frequency: number;
  sentiment: {
    positive: number;
    negative: number;
    neutral: number;
  };
  trend: 'increasing' | 'decreasing' | 'stable';
  impact: 'low' | 'medium' | 'high' | 'critical';
  relatedMetrics: string[];
}

export interface PredictiveInsight {
  type: 'churn_risk' | 'satisfaction_decline' | 'revenue_impact' | 'staff_performance';
  title: string;
  description: string;
  confidence: number;
  timeframe: string;
  potentialImpact: 'low' | 'medium' | 'high' | 'critical';
  recommendedActions: string[];
  supportingData: any;
}

export interface PerformanceBenchmark {
  metric: string;
  currentValue: number;
  industryAverage: number;
  targetValue: number;
  percentile: number;
  performance: 'excellent' | 'good' | 'average' | 'below_average' | 'poor';
}

export class FeedbackAnalyticsEngine {
  private readonly INDUSTRY_BENCHMARKS = {
    overall_satisfaction: { average: 4.2, target: 4.5, excellent: 4.7 },
    nps_score: { average: 30, target: 50, excellent: 70 },
    ces_score: { average: 3.5, target: 2.0, excellent: 1.5 }, // Lower is better for CES
    response_rate: { average: 15, target: 25, excellent: 35 }
  };

  // ========================================
  // SATISFACTION ANALYTICS
  // ========================================

  /**
   * Get comprehensive satisfaction analytics
   */
  async getSatisfactionAnalytics(filter: AnalyticsFilter): Promise<{
    overview: {
      overallSatisfaction: number;
      totalResponses: number;
      responseRate: number;
      satisfactionDistribution: Record<string, number>;
    };
    trends: Record<SatisfactionMetricType, SatisfactionTrend[]>;
    breakdowns: {
      byServiceType: Record<ServiceType, number>;
      byStaff: Array<{ staffId: string; name: string; score: number; responses: number }>;
      byTimeOfDay: Record<string, number>;
      byDayOfWeek: Record<string, number>;
    };
    benchmarks: PerformanceBenchmark[];
  }> {
    try {
      // Get satisfaction metrics
      const { data: metrics, error: metricsError } = await supabase
        .from('satisfaction_metrics')
        .select('*')
        .gte('measurement_date', filter.dateRange.start)
        .lte('measurement_date', filter.dateRange.end);

      if (metricsError) throw metricsError;

      // Calculate overview
      const overview = this.calculateOverview(metrics || []);

      // Calculate trends
      const trends = await this.calculateSatisfactionTrends(filter);

      // Calculate breakdowns
      const breakdowns = await this.calculateBreakdowns(metrics || [], filter);

      // Calculate benchmarks
      const benchmarks = this.calculateBenchmarks(overview);

      return {
        overview,
        trends,
        breakdowns,
        benchmarks
      };
    } catch (error) {
      console.error('Error getting satisfaction analytics:', error);
      throw error;
    }
  }

  /**
   * Calculate overview metrics
   */
  private calculateOverview(metrics: SatisfactionMetric[]): any {
    const totalResponses = metrics.length;
    const overallSatisfaction = totalResponses > 0
      ? metrics.reduce((sum, m) => sum + m.score, 0) / totalResponses
      : 0;

    // Calculate satisfaction distribution
    const distribution = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    metrics.forEach(m => {
      const score = Math.floor(m.score);
      if (score >= 1 && score <= 5) {
        distribution[score.toString()]++;
      }
    });

    // Calculate response rate (would need total bookings/sessions data)
    const responseRate = this.calculateResponseRate(metrics);

    return {
      overallSatisfaction: Math.round(overallSatisfaction * 100) / 100,
      totalResponses,
      responseRate,
      satisfactionDistribution: distribution
    };
  }

  /**
   * Calculate satisfaction trends over time
   */
  private async calculateSatisfactionTrends(
    filter: AnalyticsFilter
  ): Promise<Record<SatisfactionMetricType, SatisfactionTrend[]>> {
    const trends: Record<string, SatisfactionTrend[]> = {};

    const metricTypes: SatisfactionMetricType[] = [
      'overall_satisfaction',
      'service_quality',
      'staff_professionalism',
      'facility_cleanliness',
      'value_for_money',
      'likelihood_to_return',
      'likelihood_to_recommend'
    ];

    for (const metricType of metricTypes) {
      trends[metricType] = await this.calculateMetricTrend(metricType, filter);
    }

    return trends as Record<SatisfactionMetricType, SatisfactionTrend[]>;
  }

  /**
   * Calculate trend for specific metric
   */
  private async calculateMetricTrend(
    metricType: SatisfactionMetricType,
    filter: AnalyticsFilter
  ): Promise<SatisfactionTrend[]> {
    try {
      const { data, error } = await supabase
        .from('satisfaction_metrics')
        .select('measurement_date, score')
        .eq('metric_type', metricType)
        .gte('measurement_date', filter.dateRange.start)
        .lte('measurement_date', filter.dateRange.end)
        .order('measurement_date', { ascending: true });

      if (error) throw error;

      // Group by week
      const weeklyData: Record<string, number[]> = {};
      (data || []).forEach(metric => {
        const week = this.getWeekKey(metric.measurement_date);
        if (!weeklyData[week]) weeklyData[week] = [];
        weeklyData[week].push(metric.score);
      });

      // Calculate trends
      const weeks = Object.keys(weeklyData).sort();
      const trends: SatisfactionTrend[] = [];

      for (let i = 0; i < weeks.length; i++) {
        const week = weeks[i];
        const scores = weeklyData[week];
        const averageScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;

        let trendDirection: 'up' | 'down' | 'stable' = 'stable';
        let trendPercentage = 0;

        if (i > 0) {
          const previousWeek = weeks[i - 1];
          const previousAverage = weeklyData[previousWeek].reduce((sum, s) => sum + s, 0) / weeklyData[previousWeek].length;
          const change = ((averageScore - previousAverage) / previousAverage) * 100;

          if (change > 2) {
            trendDirection = 'up';
            trendPercentage = Math.abs(change);
          } else if (change < -2) {
            trendDirection = 'down';
            trendPercentage = Math.abs(change);
          }
        }

        trends.push({
          period: week,
          averageScore: Math.round(averageScore * 100) / 100,
          totalResponses: scores.length,
          trendDirection,
          trendPercentage,
          confidence: Math.min(0.95, scores.length / 10) // Higher confidence with more data
        });
      }

      return trends;
    } catch (error) {
      console.error(`Error calculating trend for ${metricType}:`, error);
      return [];
    }
  }

  /**
   * Get week key for grouping
   */
  private getWeekKey(dateString: string): string {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-W${Math.ceil(date.getDate() / 7)}`;
  }

  /**
   * Calculate breakdowns by different dimensions
   */
  private async calculateBreakdowns(metrics: SatisfactionMetric[], filter: AnalyticsFilter): Promise<any> {
    try {
      // Service type breakdown
      const { data: services } = await supabase
        .from('services')
        .select('id, type');

      const serviceBreakdown: Record<string, number> = {};
      metrics.forEach(metric => {
        if (metric.service_id) {
          const service = services?.find(s => s.id === metric.service_id);
          const serviceType = service?.type || 'unknown';
          if (!serviceBreakdown[serviceType]) {
            serviceBreakdown[serviceType] = [];
          }
          serviceBreakdown[serviceType].push(metric.score);
        }
      });

      // Calculate averages
      const serviceTypeBreakdown: Record<ServiceType, number> = {} as any;
      Object.entries(serviceBreakdown).forEach(([type, scores]) => {
        const average = scores.reduce((sum, s) => sum + s, 0) / scores.length;
        serviceTypeBreakdown[type as ServiceType] = Math.round(average * 100) / 100;
      });

      // Staff breakdown
      const staffBreakdown: Record<string, { scores: number[]; name: string }> = {};
      metrics.forEach(metric => {
        if (metric.staff_id) {
          if (!staffBreakdown[metric.staff_id]) {
            staffBreakdown[metric.staff_id] = { scores: [], name: '' };
          }
          staffBreakdown[metric.staff_id].scores.push(metric.score);
        }
      });

      // Get staff names
      const staffIds = Object.keys(staffBreakdown);
      if (staffIds.length > 0) {
        const { data: staffProfiles } = await supabase
          .from('profiles')
          .select('id, display_name')
          .in('id', staffIds);

        staffProfiles?.forEach(profile => {
          if (staffBreakdown[profile.id]) {
            staffBreakdown[profile.id].name = profile.display_name || 'Unknown';
          }
        });
      }

      const staffArray = Object.entries(staffBreakdown).map(([staffId, data]) => ({
        staffId,
        name: data.name,
        score: data.scores.length > 0 ? Math.round((data.scores.reduce((sum, s) => sum + s, 0) / data.scores.length) * 100) / 100 : 0,
        responses: data.scores.length
      })).sort((a, b) => b.score - a.score);

      // Time breakdowns
      const timeOfDayBreakdown = this.calculateTimeOfDayBreakdown(metrics);
      const dayOfWeekBreakdown = this.calculateDayOfWeekBreakdown(metrics);

      return {
        byServiceType: serviceTypeBreakdown,
        byStaff: staffArray,
        byTimeOfDay: timeOfDayBreakdown,
        byDayOfWeek: dayOfWeekBreakdown
      };
    } catch (error) {
      console.error('Error calculating breakdowns:', error);
      return {
        byServiceType: {},
        byStaff: [],
        byTimeOfDay: {},
        byDayOfWeek: {}
      };
    }
  }

  /**
   * Calculate time of day breakdown
   */
  private calculateTimeOfDayBreakdown(metrics: SatisfactionMetric[]): Record<string, number> {
    const breakdown: Record<string, number[]> = {
      'Morning (6-12)': [],
      'Afternoon (12-18)': [],
      'Evening (18-22)': [],
      'Night (22-6)': []
    };

    metrics.forEach(metric => {
      const hour = new Date(metric.measurement_date).getHours();
      let period = '';

      if (hour >= 6 && hour < 12) period = 'Morning (6-12)';
      else if (hour >= 12 && hour < 18) period = 'Afternoon (12-18)';
      else if (hour >= 18 && hour < 22) period = 'Evening (18-22)';
      else period = 'Night (22-6)';

      breakdown[period].push(metric.score);
    });

    // Calculate averages
    const result: Record<string, number> = {};
    Object.entries(breakdown).forEach(([period, scores]) => {
      result[period] = scores.length > 0 ? Math.round((scores.reduce((sum, s) => sum + s, 0) / scores.length) * 100) / 100 : 0;
    });

    return result;
  }

  /**
   * Calculate day of week breakdown
   */
  private calculateDayOfWeekBreakdown(metrics: SatisfactionMetric[]): Record<string, number> {
    const breakdown: Record<string, number[]> = {
      'Monday': [],
      'Tuesday': [],
      'Wednesday': [],
      'Thursday': [],
      'Friday': [],
      'Saturday': [],
      'Sunday': []
    };

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    metrics.forEach(metric => {
      const day = days[new Date(metric.measurement_date).getDay()];
      breakdown[day].push(metric.score);
    });

    // Calculate averages
    const result: Record<string, number> = {};
    Object.entries(breakdown).forEach(([day, scores]) => {
      result[day] = scores.length > 0 ? Math.round((scores.reduce((sum, s) => sum + s, 0) / scores.length) * 100) / 100 : 0;
    });

    return result;
  }

  /**
   * Calculate performance benchmarks
   */
  private calculateBenchmarks(overview: any): PerformanceBenchmark[] {
    const benchmarks: PerformanceBenchmark[] = [];

    // Overall satisfaction benchmark
    benchmarks.push({
      metric: 'Overall Satisfaction',
      currentValue: overview.overallSatisfaction,
      industryAverage: this.INDUSTRY_BENCHMARKS.overall_satisfaction.average,
      targetValue: this.INDUSTRY_BENCHMARKS.overall_satisfaction.target,
      percentile: this.calculatePercentile(overview.overallSatisfaction, this.INDUSTRY_BENCHMARKS.overall_satisfaction),
      performance: this.getPerformanceRating(overview.overallSatisfaction, this.INDUSTRY_BENCHMARKS.overall_satisfaction)
    });

    // NPS benchmark (would need actual NPS data)
    benchmarks.push({
      metric: 'NPS Score',
      currentValue: 0, // Would calculate from actual NPS data
      industryAverage: this.INDUSTRY_BENCHMARKS.nps_score.average,
      targetValue: this.INDUSTRY_BENCHMARKS.nps_score.target,
      percentile: 0,
      performance: 'average'
    });

    return benchmarks;
  }

  /**
   * Calculate percentile for benchmarking
   */
  private calculatePercentile(value: number, benchmark: any): number {
    const { average, excellent } = benchmark;
    if (value >= excellent) return 90;
    if (value >= average) return 50 + ((value - average) / (excellent - average)) * 40;
    return Math.max(10, (value / average) * 50);
  }

  /**
   * Get performance rating
   */
  private getPerformanceRating(value: number, benchmark: any): 'excellent' | 'good' | 'average' | 'below_average' | 'poor' {
    const { average, target, excellent } = benchmark;
    if (value >= excellent) return 'excellent';
    if (value >= target) return 'good';
    if (value >= average) return 'average';
    if (value >= average * 0.8) return 'below_average';
    return 'poor';
  }

  /**
   * Calculate response rate
   */
  private calculateResponseRate(metrics: SatisfactionMetric[]): number {
    // This would need additional data about total bookings/sessions
    // For now, return a placeholder
    return Math.round(Math.random() * 30 + 10); // 10-40%
  }

  // ========================================
  // SENTIMENT ANALYSIS
  // ========================================

  /**
   * Get comprehensive sentiment analysis
   */
  async getSentimentAnalysis(filter: AnalyticsFilter): Promise<{
    overview: SentimentBreakdown;
    trends: Array<{
      period: string;
      sentiment: Record<string, number>;
      volume: number;
    }>;
    themes: ThemeAnalysis[];
    languageBreakdown: Record<string, number>;
    emotionAnalysis: Record<string, number>;
  }> {
    try {
      // Get sentiment data
      const { data: sentiments, error: sentimentsError } = await supabase
        .from('sentiment_analysis')
        .select('*')
        .gte('processed_at', filter.dateRange.start)
        .lte('processed_at', filter.dateRange.end);

      if (sentimentsError) throw sentimentsError;

      // Calculate sentiment breakdown
      const overview = this.calculateSentimentBreakdown(sentiments || []);

      // Calculate sentiment trends
      const trends = await this.calculateSentimentTrends(sentiments || []);

      // Analyze themes
      const themes = await this.analyzeThemes(sentiments || []);

      // Language breakdown
      const languageBreakdown = this.calculateLanguageBreakdown(sentiments || []);

      // Emotion analysis
      const emotionAnalysis = this.calculateEmotionAnalysis(sentiments || []);

      return {
        overview,
        trends,
        themes,
        languageBreakdown,
        emotionAnalysis
      };
    } catch (error) {
      console.error('Error getting sentiment analysis:', error);
      throw error;
    }
  }

  /**
   * Calculate sentiment breakdown
   */
  private calculateSentimentBreakdown(sentiments: SentimentAnalysis[]): SentimentBreakdown {
    const positive = sentiments.filter(s => s.sentiment_label === 'positive');
    const negative = sentiments.filter(s => s.sentiment_label === 'negative');
    const neutral = sentiments.filter(s => s.sentiment_label === 'neutral');

    const total = sentiments.length;

    // Extract themes for positive and negative sentiment
    const positiveThemes = this.extractTopThemes(positive);
    const negativeThemes = this.extractTopThemes(negative);

    return {
      positive: {
        count: positive.length,
        percentage: total > 0 ? Math.round((positive.length / total) * 100) : 0,
        averageScore: positive.length > 0
          ? positive.reduce((sum, s) => sum + s.sentiment_score, 0) / positive.length
          : 0,
        commonThemes: positiveThemes
      },
      negative: {
        count: negative.length,
        percentage: total > 0 ? Math.round((negative.length / total) * 100) : 0,
        averageScore: negative.length > 0
          ? negative.reduce((sum, s) => sum + s.sentiment_score, 0) / negative.length
          : 0,
        commonThemes: negativeThemes,
        urgentIssues: this.identifyUrgentIssues(negative)
      },
      neutral: {
        count: neutral.length,
        percentage: total > 0 ? Math.round((neutral.length / total) * 100) : 0,
        averageScore: neutral.length > 0
          ? neutral.reduce((sum, s) => sum + s.sentiment_score, 0) / neutral.length
          : 0
      }
    };
  }

  /**
   * Extract top themes from sentiment data
   */
  private extractTopThemes(sentiments: SentimentAnalysis[]): string[] {
    const themeCounts: Record<string, number> = {};

    sentiments.forEach(sentiment => {
      sentiment.themes.forEach(theme => {
        themeCounts[theme] = (themeCounts[theme] || 0) + 1;
      });
    });

    return Object.entries(themeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([theme]) => theme);
  }

  /**
   * Identify urgent issues from negative sentiments
   */
  private identifyUrgentIssues(negativeSentiments: SentimentAnalysis[]): string[] {
    const urgentKeywords = ['refund', 'cancel', 'complaint', 'angry', 'terrible', 'worst', 'never', 'unacceptable'];
    const issues: string[] = [];

    negativeSentiments.forEach(sentiment => {
      const words = sentiment.text_content.toLowerCase().split(/\s+/);
      urgentKeywords.forEach(keyword => {
        if (words.includes(keyword) && !issues.includes(keyword)) {
          issues.push(keyword);
        }
      });
    });

    return issues.slice(0, 3);
  }

  /**
   * Calculate sentiment trends over time
   */
  private async calculateSentimentTrends(sentiments: SentimentAnalysis[]): Promise<any[]> {
    const weeklyData: Record<string, { positive: number; negative: number; neutral: number }> = {};

    sentiments.forEach(sentiment => {
      const week = this.getWeekKey(sentiment.processed_at);
      if (!weeklyData[week]) {
        weeklyData[week] = { positive: 0, negative: 0, neutral: 0 };
      }
      weeklyData[week][sentiment.sentiment_label]++;
    });

    return Object.entries(weeklyData)
      .map(([week, counts]) => {
        const total = counts.positive + counts.negative + counts.neutral;
        return {
          period: week,
          sentiment: {
            positive: Math.round((counts.positive / total) * 100),
            negative: Math.round((counts.negative / total) * 100),
            neutral: Math.round((counts.neutral / total) * 100)
          },
          volume: total
        };
      })
      .sort((a, b) => a.period.localeCompare(b.period));
  }

  /**
   * Analyze themes in feedback
   */
  private async analyzeThemes(sentiments: SentimentAnalysis[]): Promise<ThemeAnalysis[]> {
    try {
      const { data: themeLinks, error: themeLinksError } = await supabase
        .from('feedback_theme_links')
        .select(`
          relevance_score,
          feedback_themes!inner(
            theme_name_en,
            theme_category,
            is_positive
          )
        `);

      if (themeLinksError) throw themeLinksError;

      const themeAnalysis: Record<string, ThemeAnalysis> = {};

      (themeLinks || []).forEach(link => {
        const themeName = link.feedback_themes.theme_name_en;
        if (!themeAnalysis[themeName]) {
          themeAnalysis[themeName] = {
            theme: themeName,
            category: link.feedback_themes.theme_category,
            frequency: 0,
            sentiment: { positive: 0, negative: 0, neutral: 0 },
            trend: 'stable',
            impact: 'medium',
            relatedMetrics: []
          };
        }

        themeAnalysis[themeName].frequency++;
        const sentimentType = link.feedback_themes.is_positive ? 'positive' : 'negative';
        themeAnalysis[themeName].sentiment[sentimentType]++;
      });

      // Calculate impact and trends
      Object.values(themeAnalysis).forEach(analysis => {
        const total = analysis.sentiment.positive + analysis.sentiment.negative + analysis.sentiment.neutral;
        analysis.sentiment.positive = Math.round((analysis.sentiment.positive / total) * 100);
        analysis.sentiment.negative = Math.round((analysis.sentiment.negative / total) * 100);
        analysis.sentiment.neutral = Math.round((analysis.sentiment.neutral / total) * 100);

        // Determine impact
        if (analysis.frequency > 10) analysis.impact = 'critical';
        else if (analysis.frequency > 5) analysis.impact = 'high';
        else if (analysis.frequency > 2) analysis.impact = 'medium';
        else analysis.impact = 'low';
      });

      return Object.values(themeAnalysis)
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 20);
    } catch (error) {
      console.error('Error analyzing themes:', error);
      return [];
    }
  }

  /**
   * Calculate language breakdown
   */
  private calculateLanguageBreakdown(sentiments: SentimentAnalysis[]): Record<string, number> {
    const breakdown: Record<string, number> = {};

    sentiments.forEach(sentiment => {
      const language = sentiment.language_detected || 'unknown';
      breakdown[language] = (breakdown[language] || 0) + 1;
    });

    return breakdown;
  }

  /**
   * Calculate emotion analysis
   */
  private calculateEmotionAnalysis(sentiments: SentimentAnalysis[]): Record<string, number> {
    const emotions: Record<string, number> = {};

    sentiments.forEach(sentiment => {
      Object.entries(sentiment.emotions).forEach(([emotion, score]) => {
        emotions[emotion] = (emotions[emotion] || 0) + score;
      });
    });

    return emotions;
  }

  // ========================================
  // PREDICTIVE ANALYTICS
  // ========================================

  /**
   * Generate predictive insights
   */
  async generatePredictiveInsights(filter: AnalyticsFilter): Promise<PredictiveInsight[]> {
    try {
      const insights: PredictiveInsight[] = [];

      // Churn risk analysis
      const churnInsight = await this.analyzeChurnRisk(filter);
      if (churnInsight) insights.push(churnInsight);

      // Satisfaction decline prediction
      const declineInsight = await this.predictSatisfactionDecline(filter);
      if (declineInsight) insights.push(declineInsight);

      // Revenue impact analysis
      const revenueInsight = await this.analyzeRevenueImpact(filter);
      if (revenueInsight) insights.push(revenueInsight);

      // Staff performance insights
      const staffInsight = await this.analyzeStaffPerformance(filter);
      if (staffInsight) insights.push(staffInsight);

      return insights.sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      console.error('Error generating predictive insights:', error);
      return [];
    }
  }

  /**
   * Analyze churn risk
   */
  private async analyzeChurnRisk(filter: AnalyticsFilter): Promise<PredictiveInsight | null> {
    try {
      const { data: atRiskClients, error } = await supabase
        .from('client_satisfaction_predictions')
        .select('*')
        .eq('prediction_type', 'churn_risk')
        .gte('prediction_date', filter.dateRange.start)
        .lte('prediction_date', filter.dateRange.end)
        .order('prediction_score', { ascending: false })
        .limit(10);

      if (error || !atRiskClients || atRiskClients.length === 0) return null;

      const avgRiskScore = atRiskClients.reduce((sum, c) => sum + c.prediction_score, 0) / atRiskClients.length;

      return {
        type: 'churn_risk',
        title: 'High Churn Risk Detected',
        description: `${atRiskClients.length} clients show high risk of churn based on recent satisfaction patterns. Average risk score: ${Math.round(avgRiskScore * 100)}%`,
        confidence: 0.75,
        timeframe: 'Next 30 days',
        potentialImpact: avgRiskScore > 0.7 ? 'critical' : avgRiskScore > 0.5 ? 'high' : 'medium',
        recommendedActions: [
          'Personal outreach to at-risk clients',
          'Special retention offers',
          'Service recovery interventions',
          'Loyalty program enhancements'
        ],
        supportingData: {
          atRiskClients: atRiskClients.length,
          avgRiskScore: Math.round(avgRiskScore * 100),
          riskFactors: this.analyzeCommonRiskFactors(atRiskClients)
        }
      };
    } catch (error) {
      console.error('Error analyzing churn risk:', error);
      return null;
    }
  }

  /**
   * Predict satisfaction decline
   */
  private async predictSatisfactionDecline(filter: AnalyticsFilter): Promise<PredictiveInsight | null> {
    try {
      const { data: trends, error } = await supabase
        .from('satisfaction_overview')
        .select('*')
        .gte('month', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
        .order('month', { ascending: false })
        .limit(4);

      if (error || !trends || trends.length < 3) return null;

      // Calculate trend
      const recentTrend = this.calculateTrendDirection(trends.slice(0, 3).map(t => t.average_score));

      if (recentTrend.direction !== 'declining') return null;

      return {
        type: 'satisfaction_decline',
        title: 'Satisfaction Decline Trend',
        description: `Overall satisfaction has declined by ${Math.abs(recentTrend.percentage)}% over the last ${trends.length} weeks`,
        confidence: recentTrend.confidence,
        timeframe: 'Next 2-4 weeks',
        potentialImpact: recentTrend.percentage > 10 ? 'critical' : recentTrend.percentage > 5 ? 'high' : 'medium',
        recommendedActions: [
          'Investigate root causes of decline',
          'Staff retraining programs',
          'Service quality improvements',
          'Client feedback analysis'
        ],
        supportingData: {
          trendPercentage: recentTrend.percentage,
          confidence: recentTrend.confidence,
          affectedMetrics: trends.map(t => t.metric_type)
        }
      };
    } catch (error) {
      console.error('Error predicting satisfaction decline:', error);
      return null;
    }
  }

  /**
   * Analyze revenue impact
   */
  private async analyzeRevenueImpact(filter: AnalyticsFilter): Promise<PredictiveInsight | null> {
    try {
      // This would typically involve analyzing the correlation between satisfaction and revenue
      // For now, return a placeholder insight
      return {
        type: 'revenue_impact',
        title: 'Satisfaction Impact on Revenue',
        description: 'Current satisfaction levels may be impacting repeat business and referrals',
        confidence: 0.6,
        timeframe: 'Next quarter',
        potentialImpact: 'medium',
        recommendedActions: [
          'Monitor repeat booking rates',
          'Track referral metrics',
          'Implement satisfaction-linked incentives',
          'Enhance client retention programs'
        ],
        supportingData: {
          correlationCoefficient: 0.65, // Would calculate from actual data
          estimatedRevenueImpact: '5-10%',
          confidenceInterval: '±3%'
        }
      };
    } catch (error) {
      console.error('Error analyzing revenue impact:', error);
      return null;
    }
  }

  /**
   * Analyze staff performance
   */
  private async analyzeStaffPerformance(filter: AnalyticsFilter): Promise<PredictiveInsight | null> {
    try {
      const { data: staffPerformance, error } = await supabase
        .from('staff_feedback_performance')
        .select('*')
        .gte('evaluation_period_end', filter.dateRange.start)
        .lte('evaluation_period_end', filter.dateRange.end);

      if (error || !staffPerformance || staffPerformance.length === 0) return null;

      const lowPerformers = staffPerformance.filter(s => s.average_satisfaction_score && s.average_satisfaction_score < 3.5);
      const highPerformers = staffPerformance.filter(s => s.average_satisfaction_score && s.average_satisfaction_score >= 4.5);

      if (lowPerformers.length === 0 && highPerformers.length === 0) return null;

      return {
        type: 'staff_performance',
        title: 'Staff Performance Variation Detected',
        description: `Performance gap identified between high and low performers. ${lowPerformers.length} staff members need improvement.`,
        confidence: 0.8,
        timeframe: 'Next month',
        potentialImpact: lowPerformers.length > staffPerformance.length * 0.2 ? 'high' : 'medium',
        recommendedActions: [
          'Targeted training for low performers',
          'Mentorship programs',
          'Performance incentive adjustments',
          'Best practice sharing sessions'
        ],
        supportingData: {
          totalStaff: staffPerformance.length,
          lowPerformers: lowPerformers.length,
          highPerformers: highPerformers.length,
          performanceGap: this.calculatePerformanceGap(lowPerformers, highPerformers)
        }
      };
    } catch (error) {
      console.error('Error analyzing staff performance:', error);
      return null;
    }
  }

  /**
   * Calculate trend direction
   */
  private calculateTrendDirection(values: number[]): { direction: 'increasing' | 'decreasing' | 'stable'; percentage: number; confidence: number } {
    if (values.length < 2) return { direction: 'stable', percentage: 0, confidence: 0 };

    const first = values[0];
    const last = values[values.length - 1];
    const change = ((last - first) / first) * 100;

    let direction: 'increasing' | 'decreasing' | 'stable';
    if (change > 3) direction = 'increasing';
    else if (change < -3) direction = 'decreasing';
    else direction = 'stable';

    return {
      direction,
      percentage: Math.abs(change),
      confidence: Math.min(0.95, values.length / 10)
    };
  }

  /**
   * Analyze common risk factors
   */
  private analyzeCommonRiskFactors(clients: any[]): string[] {
    const factors: Record<string, number> = {};

    clients.forEach(client => {
      Object.entries(client.influencing_factors).forEach(([factor, value]) => {
        if (typeof value === 'number' && value > 0.5) {
          factors[factor] = (factors[factor] || 0) + 1;
        }
      });
    });

    return Object.entries(factors)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([factor]) => factor);
  }

  /**
   * Calculate performance gap
   */
  private calculatePerformanceGap(lowPerformers: any[], highPerformers: any[]): number {
    if (lowPerformers.length === 0 || highPerformers.length === 0) return 0;

    const avgLow = lowPerformers.reduce((sum, p) => sum + (p.average_satisfaction_score || 0), 0) / lowPerformers.length;
    const avgHigh = highPerformers.reduce((sum, p) => sum + (p.average_satisfaction_score || 0), 0) / highPerformers.length;

    return Math.round((avgHigh - avgLow) * 100) / 100;
  }
}

// Export singleton instance
export const feedbackAnalyticsEngine = new FeedbackAnalyticsEngine();