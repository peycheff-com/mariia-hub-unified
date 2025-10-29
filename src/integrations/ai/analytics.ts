import { supabase } from '@/integrations/supabase/client';

export interface AIUsageEvent {
  id?: string;
  user_id?: string;
  session_id: string;
  event_type: 'content_generation' | 'translation' | 'scheduling' | 'recommendation' | 'chatbot';
  feature: string;
  input_tokens?: number;
  output_tokens?: number;
  model_used: string;
  processing_time_ms: number;
  success: boolean;
  error_message?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface AIContentMetrics {
  total_generations: number;
  successful_generations: number;
  average_processing_time: number;
  total_tokens_used: number;
  cost_estimate: number;
  most_used_features: Array<{ feature: string; count: number }>;
  user_satisfaction_score?: number;
  quality_score_average?: number;
}

export interface AIUsageAnalytics {
  daily_usage: Array<{
    date: string;
    events: number;
    tokens: number;
    cost: number;
    success_rate: number;
  }>;
  feature_breakdown: Record<string, {
    usage_count: number;
    success_rate: number;
    avg_processing_time: number;
    user_satisfaction: number;
  }>;
  top_users: Array<{
    user_id: string;
    usage_count: number;
    feature_preference: string;
  }>;
  cost_analysis: {
    daily_average: number;
    monthly_projection: number;
    cost_per_feature: Record<string, number>;
  };
  quality_metrics: {
    average_score: number;
    improvement_trend: 'up' | 'down' | 'stable';
    common_issues: Array<{
      issue: string;
      frequency: number;
    }>;
  };
}

export class AIAnalyticsService {
  private static instance: AIAnalyticsService;
  private sessionId: string;
  private eventQueue: AIUsageEvent[] = [];
  private batchProcessing: boolean = false;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.startBatchProcessing();
  }

  static getInstance(): AIAnalyticsService {
    if (!AIAnalyticsService.instance) {
      AIAnalyticsService.instance = new AIAnalyticsService();
    }
    return AIAnalyticsService.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async trackEvent(event: Omit<AIUsageEvent, 'id' | 'created_at' | 'session_id'>): Promise<void> {
    const fullEvent: AIUsageEvent = {
      ...event,
      id: this.generateEventId(),
      session_id: this.sessionId,
      created_at: new Date().toISOString(),
    };

    this.eventQueue.push(fullEvent);

    // Process immediately for critical events
    if (event.event_type === 'content_generation' || !event.success) {
      await this.processBatch();
    }
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async processBatch(): Promise<void> {
    if (this.batchProcessing || this.eventQueue.length === 0) return;

    this.batchProcessing = true;
    const batch = [...this.eventQueue];
    this.eventQueue = [];

    try {
      const { error } = await supabase
        .from('ai_usage_events')
        .insert(batch);

      if (error) {
        console.error('Failed to store AI usage events:', error);
        // Re-add failed events to queue
        this.eventQueue.unshift(...batch);
      }
    } catch (error) {
      console.error('Error processing AI analytics batch:', error);
      this.eventQueue.unshift(...batch);
    } finally {
      this.batchProcessing = false;
    }
  }

  private startBatchProcessing(): void {
    // Process batch every 30 seconds
    setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.processBatch();
      }
    }, 30000);

    // Process before page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.processBatch();
      });
    }
  }

  async getUsageAnalytics(
    startDate: string,
    endDate: string,
    userId?: string
  ): Promise<AIUsageAnalytics> {
    try {
      let query = supabase
        .from('ai_usage_events')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data: events, error } = await query;

      if (error) throw error;

      return this.calculateAnalytics(events || []);
    } catch (error) {
      console.error('Failed to fetch AI analytics:', error);
      throw error;
    }
  }

  private calculateAnalytics(events: AIUsageEvent[]): AIUsageAnalytics {
    // Group events by date
    const dailyUsage = this.groupEventsByDate(events);

    // Calculate feature breakdown
    const featureBreakdown = this.calculateFeatureBreakdown(events);

    // Identify top users
    const topUsers = this.calculateTopUsers(events);

    // Analyze costs
    const costAnalysis = this.calculateCostAnalysis(events);

    // Calculate quality metrics
    const qualityMetrics = this.calculateQualityMetrics(events);

    return {
      daily_usage: dailyUsage,
      feature_breakdown: featureBreakdown,
      top_users: topUsers,
      cost_analysis: costAnalysis,
      quality_metrics: qualityMetrics,
    };
  }

  private groupEventsByDate(events: AIUsageEvent[]): AIUsageAnalytics['daily_usage'] {
    const grouped = events.reduce((acc, event) => {
      const date = event.created_at.split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          date,
          events: 0,
          tokens: 0,
          cost: 0,
          success_rate: 0,
        };
      }
      acc[date].events++;
      acc[date].tokens += (event.input_tokens || 0) + (event.output_tokens || 0);
      acc[date].cost += this.calculateEventCost(event);
      return acc;
    }, {} as Record<string, any>);

    // Calculate success rates
    Object.values(grouped).forEach((day: any) => {
      const dayEvents = events.filter(e => e.created_at.startsWith(day.date));
      const successfulEvents = dayEvents.filter(e => e.success);
      day.success_rate = dayEvents.length > 0 ? successfulEvents.length / dayEvents.length : 0;
    });

    return Object.values(grouped);
  }

  private calculateFeatureBreakdown(events: AIUsageEvent[]): AIUsageAnalytics['feature_breakdown'] {
    const grouped = events.reduce((acc, event) => {
      const key = `${event.event_type}_${event.feature}`;
      if (!acc[key]) {
        acc[key] = {
          usage_count: 0,
          total_processing_time: 0,
          successful_events: 0,
          satisfaction_scores: [],
        };
      }
      acc[key].usage_count++;
      acc[key].total_processing_time += event.processing_time_ms;
      if (event.success) {
        acc[key].successful_events++;
      }
      if (event.metadata.user_satisfaction) {
        acc[key].satisfaction_scores.push(event.metadata.user_satisfaction);
      }
      return acc;
    }, {} as Record<string, any>);

    const breakdown: AIUsageAnalytics['feature_breakdown'] = {};
    Object.entries(grouped).forEach(([key, data]: [string, any]) => {
      breakdown[key] = {
        usage_count: data.usage_count,
        success_rate: data.usage_count > 0 ? data.successful_events / data.usage_count : 0,
        avg_processing_time: data.usage_count > 0 ? data.total_processing_time / data.usage_count : 0,
        user_satisfaction: data.satisfaction_scores.length > 0
          ? data.satisfaction_scores.reduce((a: number, b: number) => a + b, 0) / data.satisfaction_scores.length
          : 0,
      };
    });

    return breakdown;
  }

  private calculateTopUsers(events: AIUsageEvent[]): AIUsageAnalytics['top_users'] {
    const userUsage = events.reduce((acc, event) => {
      if (!event.user_id) return acc;
      if (!acc[event.user_id]) {
        acc[event.user_id] = {
          usage_count: 0,
          features: {} as Record<string, number>,
        };
      }
      acc[event.user_id].usage_count++;
      const featureKey = `${event.event_type}_${event.feature}`;
      acc[event.user_id].features[featureKey] = (acc[event.user_id].features[featureKey] || 0) + 1;
      return acc;
    }, {} as Record<string, any>);

    return Object.entries(userUsage)
      .map(([userId, data]: [string, any]) => ({
        user_id: userId,
        usage_count: data.usage_count,
        feature_preference: Object.entries(data.features)
          .sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0] || 'unknown',
      }))
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, 10);
  }

  private calculateCostAnalysis(events: AIUsageEvent[]): AIUsageAnalytics['cost_analysis'] {
    const totalCost = events.reduce((sum, event) => sum + this.calculateEventCost(event), 0);
    const days = new Set(events.map(e => e.created_at.split('T')[0])).size;
    const dailyAverage = days > 0 ? totalCost / days : 0;
    const monthlyProjection = dailyAverage * 30;

    const costPerFeature = events.reduce((acc, event) => {
      const key = `${event.event_type}_${event.feature}`;
      acc[key] = (acc[key] || 0) + this.calculateEventCost(event);
      return acc;
    }, {} as Record<string, number>);

    return {
      daily_average: dailyAverage,
      monthly_projection: monthlyProjection,
      cost_per_feature: costPerFeature,
    };
  }

  private calculateQualityMetrics(events: AIUsageEvent[]): AIUsageAnalytics['quality_metrics'] {
    const qualityScores = events
      .filter(e => e.metadata.quality_score)
      .map(e => e.metadata.quality_score);

    const averageScore = qualityScores.length > 0
      ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length
      : 0;

    // Calculate trend (simplified)
    const recentEvents = events.slice(-100);
    const recentScores = recentEvents
      .filter(e => e.metadata.quality_score)
      .map(e => e.metadata.quality_score);
    const olderEvents = events.slice(-200, -100);
    const olderScores = olderEvents
      .filter(e => e.metadata.quality_score)
      .map(e => e.metadata.quality_score);

    const recentAvg = recentScores.length > 0 ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length : 0;
    const olderAvg = olderScores.length > 0 ? olderScores.reduce((a, b) => a + b, 0) / olderScores.length : 0;

    let improvement_trend: 'up' | 'down' | 'stable' = 'stable';
    if (recentAvg > olderAvg + 0.05) improvement_trend = 'up';
    else if (recentAvg < olderAvg - 0.05) improvement_trend = 'down';

    // Extract common issues from error messages
    const commonIssues = events
      .filter(e => !e.success && e.error_message)
      .reduce((acc, event) => {
        const issue = event.error_message || 'Unknown error';
        acc[issue] = (acc[issue] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return {
      average_score: averageScore,
      improvement_trend,
      common_issues: Object.entries(commonIssues)
        .map(([issue, frequency]) => ({ issue, frequency }))
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 5),
    };
  }

  private calculateEventCost(event: AIUsageEvent): number {
    // GPT-4 Turbo pricing (as of 2024)
    const inputCostPerToken = 0.00001; // $0.01 per 1K tokens
    const outputCostPerToken = 0.00003; // $0.03 per 1K tokens

    const inputCost = (event.input_tokens || 0) * inputCostPerToken;
    const outputCost = (event.output_tokens || 0) * outputCostPerToken;

    return inputCost + outputCost;
  }

  async trackUserSatisfaction(
    eventId: string,
    satisfactionScore: number,
    feedback?: string
  ): Promise<void> {
    try {
      await supabase
        .from('ai_usage_events')
        .update({
          metadata: {
            user_satisfaction: satisfactionScore,
            feedback,
          },
        })
        .eq('id', eventId);
    } catch (error) {
      console.error('Failed to track user satisfaction:', error);
    }
  }

  async generateReport(startDate: string, endDate: string): Promise<{
    summary: string;
    insights: string[];
    recommendations: string[];
  }> {
    const analytics = await this.getUsageAnalytics(startDate, endDate);

    // Generate AI-powered insights
    const insights = [
      `Total of ${analytics.daily_usage.reduce((sum, d) => sum + d.events, 0)} AI interactions`,
      `Most used feature: ${Object.entries(analytics.feature_breakdown)
        .sort(([, a], [, b]) => b.usage_count - a.usage_count)[0]?.[0] || 'N/A'}`,
      `Average success rate: ${Math.round(
        Object.values(analytics.feature_breakdown)
          .reduce((sum, f) => sum + f.success_rate, 0) / Object.keys(analytics.feature_breakdown).length * 100
      )}%`,
      `Monthly cost projection: $${analytics.cost_analysis.monthly_projection.toFixed(2)}`,
    ];

    const recommendations = [
      'Consider implementing rate limiting for high-usage features',
      'Focus on improving features with low success rates',
      'Analyze user feedback to enhance satisfaction',
      'Monitor cost trends and optimize token usage',
    ];

    const summary = `AI usage analysis shows ${analytics.daily_usage.length} days of activity with total cost of $${analytics.cost_analysis.monthly_projection.toFixed(2)}`;

    return {
      summary,
      insights,
      recommendations,
    };
  }
}

// Export singleton instance
export const aiAnalyticsService = AIAnalyticsService.getInstance();