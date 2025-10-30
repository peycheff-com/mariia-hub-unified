// Customer Satisfaction Analytics Service
import { supabase } from '@/integrations/supabase/client';
import {
  SupportFeedbackSurvey,
  SupportAnalyticsFilter,
  CustomerSatisfactionAnalytics,
  TimeSeriesData,
  SupportAlert
} from '@/types/support-analytics';

export interface SatisfactionMetrics {
  csat: number; // Customer Satisfaction (1-5)
  nps: number; // Net Promoter Score (-100 to 100)
  ces: number; // Customer Effort Score (1-7)
  response_rate: number;
  sentiment_distribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

export interface SatisfactionDriver {
  factor: string;
  impact_score: number;
  correlation_strength: number;
  improvement_potential: number;
  category: 'response_time' | 'agent_quality' | 'resolution_quality' | 'process_efficiency' | 'communication';
}

export interface SatisfactionTrend {
  period: string;
  csat: number;
  nps: number;
  ces: number;
  survey_count: number;
  response_rate: number;
  key_drivers: string[];
  notable_issues: string[];
}

export interface SatisfactionSegment {
  segment_name: string;
  segment_size: number;
  csat: number;
  nps: number;
  ces: number;
  response_rate: number;
  key_insights: string[];
  recommendations: string[];
}

export interface SatisfactionPrediction {
  prediction_date: string;
  predicted_csat: number;
  predicted_nps: number;
  predicted_ces: number;
  confidence_level: number;
  risk_factors: string[];
  improvement_opportunities: string[];
}

export class CustomerSatisfactionAnalyticsService {
  private readonly SATISFACTION_THRESHOLDS = {
    csat: { excellent: 4.5, good: 4.0, average: 3.5, poor: 3.0 },
    nps: { excellent: 50, good: 20, average: 0, poor: -20 },
    ces: { excellent: 2, good: 3, average: 4, poor: 5 }
  };

  private readonly DRIVER_FACTORS = [
    'first_response_time',
    'resolution_time',
    'agent_knowledge',
    'agent_empathy',
    'communication_clarity',
    'resolution_quality',
    'process_simplicity',
    'channel_experience'
  ];

  // Main satisfaction analytics
  async getSatisfactionAnalytics(filter?: SupportAnalyticsFilter): Promise<CustomerSatisfactionAnalytics> {
    const metrics = await this.calculateSatisfactionMetrics(filter);
    const trends = await this.analyzeSatisfactionTrends(filter);
    const satisfactionByChannel = await this.getSatisfactionByChannel(filter);
    const satisfactionByCategory = await this.getSatisfactionByCategory(filter);
    const satisfactionByPriority = await this.getSatisfactionByPriority(filter);
    const drivers = await this.analyzeSatisfactionDrivers(filter);
    const topIssues = await this.identifyTopSatisfactionIssues(filter);
    const segments = await this.analyzeSatisfactionSegments(filter);
    const predictions = await this.predictSatisfactionTrends(filter);

    return {
      current_csat: metrics.csat,
      current_nps: metrics.nps,
      current_ces: metrics.ces,
      satisfaction_trend: trends,
      satisfaction_by_channel: satisfactionByChannel,
      satisfaction_by_category: satisfactionByCategory,
      satisfaction_by_priority: satisfactionByPriority,
      driver_analysis: drivers,
      top_issues: topIssues,
      segment_analysis: segments,
      predictions,
      benchmark_comparison: await this.getBenchmarkComparison(metrics),
      improvement_roadmap: await this.generateImprovementRoadmap(drivers, topIssues)
    };
  }

  // Calculate current satisfaction metrics
  async calculateSatisfactionMetrics(filter?: SupportAnalyticsFilter): Promise<SatisfactionMetrics> {
    const { data: surveys } = await supabase
      .from('support_feedback_surveys')
      .select('*')
      .gte('survey_response_date', filter?.date_range?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .lte('survey_response_date', filter?.date_range?.end || new Date().toISOString());

    const { data: tickets } = await supabase
      .from('support_tickets')
      .select('customer_satisfaction_rating, nps_score, customer_effort_score')
      .gte('created_at', filter?.date_range?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .lte('created_at', filter?.date_range?.end || new Date().toISOString())
      .not('customer_satisfaction_rating', 'is', null);

    // Calculate CSAT
    const csatRatings = tickets?.map(t => t.customer_satisfaction_rating).filter(r => r !== null) || [];
    const csat = csatRatings.length > 0 ? csatRatings.reduce((sum, r) => sum + r, 0) / csatRatings.length : 0;

    // Calculate NPS
    const npsScores = tickets?.map(t => t.nps_score).filter(s => s !== null) || [];
    const nps = this.calculateNPS(npsScores);

    // Calculate CES
    const cesScores = tickets?.map(t => t.customer_effort_score).filter(s => s !== null) || [];
    const ces = cesScores.length > 0 ? cesScores.reduce((sum, s) => sum + s, 0) / cesScores.length : 0;

    // Calculate response rate
    const totalEligibleTickets = await this.getTotalEligibleTickets(filter);
    const responseRate = totalEligibleTickets > 0 ? (surveys?.length || 0) / totalEligibleTickets * 100 : 0;

    // Analyze sentiment from comments
    const sentimentDistribution = await this.analyzeSentimentDistribution(surveys || []);

    return {
      csat: Math.round(csat * 100) / 100,
      nps: Math.round(nps * 100) / 100,
      ces: Math.round(ces * 100) / 100,
      response_rate: Math.round(responseRate * 100) / 100,
      sentiment_distribution: sentimentDistribution
    };
  }

  // Analyze satisfaction trends over time
  async analyzeSatisfactionTrends(filter?: SupportAnalyticsFilter): Promise<SatisfactionTrend[]> {
    const days = this.getDaysInRange(filter);
    const trends: SatisfactionTrend[] = [];

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayMetrics = await this.calculateSatisfactionMetrics({
        ...filter,
        date_range: {
          start: dateStr,
          end: dateStr
        }
      });

      const keyDrivers = await this.getTopDriversForDate(dateStr);
      const notableIssues = await this.getNotableIssuesForDate(dateStr);

      trends.unshift({
        period: dateStr,
        csat: dayMetrics.csat,
        nps: dayMetrics.nps,
        ces: dayMetrics.ces,
        survey_count: await this.getSurveyCountForDate(dateStr),
        response_rate: dayMetrics.response_rate,
        key_drivers: keyDrivers,
        notable_issues: notableIssues
      });
    }

    return trends;
  }

  // Analyze satisfaction by different dimensions
  async getSatisfactionByChannel(filter?: SupportAnalyticsFilter): Promise<Record<string, number>> {
    const { data } = await supabase
      .from('support_tickets')
      .select('channel, customer_satisfaction_rating')
      .not('customer_satisfaction_rating', 'is', null)
      .gte('created_at', filter?.date_range?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .lte('created_at', filter?.date_range?.end || new Date().toISOString());

    const channelSatisfaction: Record<string, number[]> = {};

    data?.forEach(ticket => {
      if (!channelSatisfaction[ticket.channel]) {
        channelSatisfaction[ticket.channel] = [];
      }
      channelSatisfaction[ticket.channel].push(ticket.customer_satisfaction_rating);
    });

    const result: Record<string, number> = {};
    Object.entries(channelSatisfaction).forEach(([channel, ratings]) => {
      result[channel] = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
    });

    return result;
  }

  async getSatisfactionByCategory(filter?: SupportAnalyticsFilter): Promise<Record<string, number>> {
    const { data } = await supabase
      .from('support_tickets')
      .select(`
        customer_satisfaction_rating,
        support_categories(name)
      `)
      .not('customer_satisfaction_rating', 'is', null)
      .gte('created_at', filter?.date_range?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .lte('created_at', filter?.date_range?.end || new Date().toISOString());

    const categorySatisfaction: Record<string, number[]> = {};

    data?.forEach(ticket => {
      const categoryName = ticket.support_categories?.name || 'Uncategorized';
      if (!categorySatisfaction[categoryName]) {
        categorySatisfaction[categoryName] = [];
      }
      categorySatisfaction[categoryName].push(ticket.customer_satisfaction_rating);
    });

    const result: Record<string, number> = {};
    Object.entries(categorySatisfaction).forEach(([category, ratings]) => {
      result[category] = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
    });

    return result;
  }

  async getSatisfactionByPriority(filter?: SupportAnalyticsFilter): Promise<Record<string, number>> {
    const { data } = await supabase
      .from('support_tickets')
      .select('priority, customer_satisfaction_rating')
      .not('customer_satisfaction_rating', 'is', null)
      .gte('created_at', filter?.date_range?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .lte('created_at', filter?.date_range?.end || new Date().toISOString());

    const prioritySatisfaction: Record<string, number[]> = {};

    data?.forEach(ticket => {
      if (!prioritySatisfaction[ticket.priority]) {
        prioritySatisfaction[ticket.priority] = [];
      }
      prioritySatisfaction[ticket.priority].push(ticket.customer_satisfaction_rating);
    });

    const result: Record<string, number> = {};
    Object.entries(prioritySatisfaction).forEach(([priority, ratings]) => {
      result[priority] = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
    });

    return result;
  }

  // Analyze satisfaction drivers
  async analyzeSatisfactionDrivers(filter?: SupportAnalyticsFilter): Promise<SatisfactionDriver[]> {
    const drivers: SatisfactionDriver[] = [];

    for (const factor of this.DRIVER_FACTORS) {
      const correlation = await this.calculateDriverCorrelation(factor, filter);
      const impact = await this.calculateDriverImpact(factor, filter);
      const potential = await this.calculateImprovementPotential(factor, filter);

      drivers.push({
        factor: this.formatFactorName(factor),
        impact_score: impact,
        correlation_strength: correlation,
        improvement_potential: potential,
        category: this.categorizeDriver(factor)
      });
    }

    return drivers.sort((a, b) => b.impact_score - a.impact_score);
  }

  // Identify top satisfaction issues
  async identifyTopSatisfactionIssues(filter?: SupportAnalyticsFilter): Promise<Array<{
    category: string;
    frequency: number;
    avg_satisfaction: number;
    trend: 'improving' | 'declining' | 'stable';
    impact_level: 'high' | 'medium' | 'low';
    root_causes: string[];
    recommended_actions: string[];
  }>> {
    const { data } = await supabase
      .from('support_tickets')
      .select(`
        customer_satisfaction_rating,
        created_at,
        support_categories(name),
        priority,
        tags
      `)
      .not('customer_satisfaction_rating', 'is', null)
      .gte('created_at', filter?.date_range?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .lte('created_at', filter?.date_range?.end || new Date().toISOString());

    const issues: Record<string, {
      ratings: number[];
      dates: string[];
      priorities: string[];
      tags: string[][];
    }> = {};

    data?.forEach(ticket => {
      const category = ticket.support_categories?.name || 'Uncategorized';
      if (!issues[category]) {
        issues[category] = { ratings: [], dates: [], priorities: [], tags: [] };
      }
      issues[category].ratings.push(ticket.customer_satisfaction_rating);
      issues[category].dates.push(ticket.created_at);
      issues[category].priorities.push(ticket.priority);
      issues[category].tags.push(ticket.tags || []);
    });

    return Object.entries(issues)
      .map(([category, data]) => ({
        category,
        frequency: data.ratings.length,
        avg_satisfaction: data.ratings.reduce((sum, r) => sum + r, 0) / data.ratings.length,
        trend: this.calculateTrend(data.ratings, data.dates),
        impact_level: this.calculateImpactLevel(data.avg_satisfaction, data.priorities),
        root_causes: this.identifyRootCauses(category, data),
        recommended_actions: this.generateRecommendedActions(category, data)
      }))
      .sort((a, b) => b.frequency * (6 - b.avg_satisfaction) - a.frequency * (6 - a.avg_satisfaction))
      .slice(0, 10);
  }

  // Analyze satisfaction segments
  async analyzeSatisfactionSegments(filter?: SupportAnalyticsFilter): Promise<SatisfactionSegment[]> {
    const segments = [
      { name: 'VIP Customers', filter: { is_vip: true } },
      { name: 'New Customers', filter: { days_as_customer: '<=30' } },
      { name: 'Long-term Customers', filter: { days_as_customer: '>365' } },
      { name: 'High-volume Customers', filter: { ticket_count: '>10' } },
      { name: 'Chat Users', filter: { preferred_channel: 'chat' } },
      { name: 'Phone Users', filter: { preferred_channel: 'phone' } }
    ];

    const segmentAnalysis: SatisfactionSegment[] = [];

    for (const segment of segments) {
      const segmentFilter = { ...filter, ...segment.filter };
      const metrics = await this.calculateSatisfactionMetrics(segmentFilter);
      const insights = await this.generateSegmentInsights(segment.name, segmentFilter);
      const recommendations = await this.generateSegmentRecommendations(segment.name, metrics, insights);

      segmentAnalysis.push({
        segment_name: segment.name,
        segment_size: await this.getSegmentSize(segment.filter),
        csat: metrics.csat,
        nps: metrics.nps,
        ces: metrics.ces,
        response_rate: metrics.response_rate,
        key_insights: insights,
        recommendations: recommendations
      });
    }

    return segmentAnalysis;
  }

  // Predict satisfaction trends
  async predictSatisfactionTrends(filter?: SupportAnalyticsFilter, daysAhead: number = 7): Promise<SatisfactionPrediction[]> {
    const historicalTrends = await this.analyzeSatisfactionTrends(filter);

    if (historicalTrends.length < 14) {
      // Not enough data for meaningful prediction
      return Array.from({ length: daysAhead }, (_, i) => ({
        prediction_date: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        predicted_csat: historicalTrends[historicalTrends.length - 1]?.csat || 0,
        predicted_nps: historicalTrends[historicalTrends.length - 1]?.nps || 0,
        predicted_ces: historicalTrends[historicalTrends.length - 1]?.ces || 0,
        confidence_level: 0.3,
        risk_factors: ['Insufficient historical data'],
        improvement_opportunities: []
      }));
    }

    const predictions: SatisfactionPrediction[] = [];
    const recentTrends = historicalTrends.slice(-14);

    for (let i = 1; i <= daysAhead; i++) {
      const csatPrediction = this.predictNextValue(recentTrends.map(t => t.csat), i);
      const npsPrediction = this.predictNextValue(recentTrends.map(t => t.nps), i);
      const cesPrediction = this.predictNextValue(recentTrends.map(t => t.ces), i);

      const confidence = Math.max(0.3, Math.min(0.9, 1 - (i / daysAhead) * 0.3));
      const riskFactors = await this.identifyRiskFactors(csatPrediction.value, npsPrediction.value);
      const opportunities = await this.identifyImprovementOpportunities(csatPrediction.value, npsPrediction.value);

      predictions.push({
        prediction_date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        predicted_csat: Math.round(csatPrediction.value * 100) / 100,
        predicted_nps: Math.round(npsPrediction.value * 100) / 100,
        predicted_ces: Math.round(cesPrediction.value * 100) / 100,
        confidence_level: Math.round(confidence * 100) / 100,
        risk_factors: riskFactors,
        improvement_opportunities: opportunities
      });
    }

    return predictions;
  }

  // Generate satisfaction alerts
  async generateSatisfactionAlerts(filter?: SupportAnalyticsFilter): Promise<SupportAlert[]> {
    const alerts: SupportAlert[] = [];
    const metrics = await this.calculateSatisfactionMetrics(filter);

    // CSAT alerts
    if (metrics.csat < this.SATISFACTION_THRESHOLDS.csat.poor) {
      alerts.push({
        id: `csat-alert-${Date.now()}`,
        alert_type: 'customer_satisfaction_drop',
        severity: metrics.csat < this.SATISFACTION_THRESHOLDS.csat.average ? 'high' : 'medium',
        title: 'Low Customer Satisfaction',
        message: `Current CSAT score of ${metrics.csat} is below acceptable threshold`,
        current_value: metrics.csat,
        threshold_value: this.SATISFACTION_THRESHOLDS.csat.average,
        is_acknowledged: false,
        is_resolved: false,
        created_at: new Date().toISOString()
      } as SupportAlert);
    }

    // NPS alerts
    if (metrics.nps < this.SATISFACTION_THRESHOLDS.nps.poor) {
      alerts.push({
        id: `nps-alert-${Date.now()}`,
        alert_type: 'customer_satisfaction_drop',
        severity: metrics.nps < this.SATISFACTION_THRESHOLDS.nps.average ? 'high' : 'medium',
        title: 'Low Net Promoter Score',
        message: `Current NPS score of ${metrics.nps} indicates customer dissatisfaction`,
        current_value: metrics.nps,
        threshold_value: this.SATISFACTION_THRESHOLDS.nps.average,
        is_acknowledged: false,
        is_resolved: false,
        created_at: new Date().toISOString()
      } as SupportAlert);
    }

    // Response rate alerts
    if (metrics.response_rate < 30) {
      alerts.push({
        id: `response-rate-alert-${Date.now()}`,
        alert_type: 'customer_satisfaction_drop',
        severity: 'medium',
        title: 'Low Survey Response Rate',
        message: `Survey response rate of ${metrics.response_rate}% is below target`,
        current_value: metrics.response_rate,
        threshold_value: 30,
        is_acknowledged: false,
        is_resolved: false,
        created_at: new Date().toISOString()
      } as SupportAlert);
    }

    return alerts;
  }

  // Helper methods

  private calculateNPS(scores: number[]): number {
    if (scores.length === 0) return 0;

    const promoters = scores.filter(s => s >= 70).length;
    const detractors = scores.filter(s => s <= 30).length;

    return ((promoters - detractors) / scores.length) * 100;
  }

  private async analyzeSentimentDistribution(surveys: SupportFeedbackSurvey[]): Promise<{
    positive: number;
    neutral: number;
    negative: number;
  }> {
    const sentiments = { positive: 0, neutral: 0, negative: 0 };

    surveys.forEach(survey => {
      if (survey.comments) {
        // Simple sentiment analysis based on keywords
        const comment = survey.comments.toLowerCase();
        const positiveWords = ['excellent', 'great', 'amazing', 'helpful', 'quick', 'resolved', 'satisfied'];
        const negativeWords = ['terrible', 'awful', 'slow', 'unhelpful', 'frustrated', 'disappointed', 'angry'];

        const positiveCount = positiveWords.filter(word => comment.includes(word)).length;
        const negativeCount = negativeWords.filter(word => comment.includes(word)).length;

        if (positiveCount > negativeCount) {
          sentiments.positive++;
        } else if (negativeCount > positiveCount) {
          sentiments.negative++;
        } else {
          sentiments.neutral++;
        }
      } else {
        // Use rating as sentiment indicator
        if (survey.overall_rating >= 4) {
          sentiments.positive++;
        } else if (survey.overall_rating <= 2) {
          sentiments.negative++;
        } else {
          sentiments.neutral++;
        }
      }
    });

    const total = sentiments.positive + sentiments.neutral + sentiments.negative;
    if (total === 0) return sentiments;

    return {
      positive: Math.round((sentiments.positive / total) * 100),
      neutral: Math.round((sentiments.neutral / total) * 100),
      negative: Math.round((sentiments.negative / total) * 100)
    };
  }

  private async getTotalEligibleTickets(filter?: SupportAnalyticsFilter): Promise<number> {
    const { count } = await supabase
      .from('support_tickets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'resolved')
      .gte('resolved_at', filter?.date_range?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .lte('resolved_at', filter?.date_range?.end || new Date().toISOString());

    return count || 0;
  }

  private getDaysInRange(filter?: SupportAnalyticsFilter): number {
    if (!filter?.date_range?.start) return 30;

    const start = new Date(filter.date_range.start);
    const end = filter.date_range.end ? new Date(filter.date_range.end) : new Date();

    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }

  private async getTopDriversForDate(date: string): Promise<string[]> {
    // This would analyze drivers for a specific date
    // For now, return mock data
    return ['Response Time', 'Agent Empathy', 'Resolution Quality'];
  }

  private async getNotableIssuesForDate(date: string): Promise<string[]> {
    // This would identify issues for a specific date
    return [];
  }

  private async getSurveyCountForDate(date: string): Promise<number> {
    const { count } = await supabase
      .from('support_feedback_surveys')
      .select('*', { count: 'exact', head: true })
      .eq('survey_response_date', date);

    return count || 0;
  }

  private async calculateDriverCorrelation(factor: string, filter?: SupportAnalyticsFilter): Promise<number> {
    // This would calculate correlation between the factor and satisfaction scores
    // For now, return mock correlations
    const correlations: Record<string, number> = {
      first_response_time: -0.65,
      resolution_time: -0.58,
      agent_knowledge: 0.72,
      agent_empathy: 0.68,
      communication_clarity: 0.75,
      resolution_quality: 0.81,
      process_simplicity: 0.62,
      channel_experience: 0.54
    };

    return correlations[factor] || 0;
  }

  private async calculateDriverImpact(factor: string, filter?: SupportAnalyticsFilter): Promise<number> {
    // This would calculate the impact of the factor on overall satisfaction
    const impacts: Record<string, number> = {
      first_response_time: 0.8,
      resolution_time: 0.7,
      agent_knowledge: 0.6,
      agent_empathy: 0.6,
      communication_clarity: 0.9,
      resolution_quality: 0.9,
      process_simplicity: 0.5,
      channel_experience: 0.4
    };

    return impacts[factor] || 0.5;
  }

  private async calculateImprovementPotential(factor: string, filter?: SupportAnalyticsFilter): Promise<number> {
    // This would calculate the potential for improvement in this area
    const potentials: Record<string, number> = {
      first_response_time: 0.7,
      resolution_time: 0.6,
      agent_knowledge: 0.8,
      agent_empathy: 0.7,
      communication_clarity: 0.5,
      resolution_quality: 0.4,
      process_simplicity: 0.9,
      channel_experience: 0.8
    };

    return potentials[factor] || 0.5;
  }

  private formatFactorName(factor: string): string {
    return factor.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  private categorizeDriver(factor: string): 'response_time' | 'agent_quality' | 'resolution_quality' | 'process_efficiency' | 'communication' {
    if (factor.includes('response_time') || factor.includes('resolution_time')) {
      return 'response_time';
    }
    if (factor.includes('agent_knowledge') || factor.includes('agent_empathy')) {
      return 'agent_quality';
    }
    if (factor.includes('resolution_quality')) {
      return 'resolution_quality';
    }
    if (factor.includes('process_simplicity')) {
      return 'process_efficiency';
    }
    return 'communication';
  }

  private calculateTrend(ratings: number[], dates: string[]): 'improving' | 'declining' | 'stable' {
    if (ratings.length < 2) return 'stable';

    const midpoint = Math.floor(ratings.length / 2);
    const firstHalf = ratings.slice(0, midpoint);
    const secondHalf = ratings.slice(midpoint);

    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

    const diff = secondAvg - firstAvg;
    if (diff > 0.2) return 'improving';
    if (diff < -0.2) return 'declining';
    return 'stable';
  }

  private calculateImpactLevel(avgSatisfaction: number, priorities: string[]): 'high' | 'medium' | 'low' {
    const highPriorityCount = priorities.filter(p => ['urgent', 'critical'].includes(p)).length;
    const priorityRatio = highPriorityCount / priorities.length;

    if (avgSatisfaction < 3 || priorityRatio > 0.5) return 'high';
    if (avgSatisfaction < 4 || priorityRatio > 0.2) return 'medium';
    return 'low';
  }

  private identifyRootCauses(category: string, data: any): string[] {
    // This would analyze root causes based on ticket data
    const causes: Record<string, string[]> = {
      'Technical Issues': ['System downtime', 'Insufficient training', 'Complex workflows'],
      'Billing & Payments': ['Payment gateway errors', 'Unclear pricing', 'Invoice issues'],
      'Booking Related': ['System glitches', 'Availability confusion', 'Process complexity']
    };

    return causes[category] || ['Under investigation'];
  }

  private generateRecommendedActions(category: string, data: any): string[] {
    // This would generate specific recommendations based on the analysis
    const actions: Record<string, string[]> = {
      'Technical Issues': ['Investigate system stability', 'Update knowledge base', 'Provide additional training'],
      'Billing & Payments': ['Review payment process', 'Clarify pricing information', 'Improve invoice accuracy'],
      'Booking Related': ['Simplify booking process', 'Improve system reliability', 'Enhance availability display']
    };

    return actions[category] || ['Analyze trends and identify patterns'];
  }

  private async getSegmentSize(filter: any): Promise<number> {
    // This would calculate the size of a customer segment
    return Math.floor(Math.random() * 1000) + 100; // Mock data
  }

  private async generateSegmentInsights(segmentName: string, filter: any): Promise<string[]> {
    // This would generate insights specific to each segment
    const insights: Record<string, string[]> = {
      'VIP Customers': ['Expect faster response times', 'Value personalized service', 'Prefer dedicated agents'],
      'New Customers': ['Need more guidance', 'Sensitive to first impressions', 'Value clear communication'],
      'Long-term Customers': ['Appreciate consistency', 'More tolerant of issues', 'Provide valuable feedback']
    };

    return insights[segmentName] || ['Segment-specific insights being analyzed'];
  }

  private async generateSegmentRecommendations(segmentName: string, metrics: SatisfactionMetrics, insights: string[]): Promise<string[]> {
    const recommendations: Record<string, string[]> = {
      'VIP Customers': ['Assign dedicated agents', 'Provide priority support', 'Implement proactive outreach'],
      'New Customers': ['Simplify onboarding process', 'Provide welcome guides', 'Offer extra support'],
      'Long-term Customers': ['Implement loyalty programs', 'Request feedback regularly', 'Provide exclusive benefits']
    };

    return recommendations[segmentName] || ['Tailor support approach to segment needs'];
  }

  private predictNextValue(historicalValues: number[], stepsAhead: number): { value: number; confidence: number } {
    if (historicalValues.length < 3) {
      return { value: historicalValues[historicalValues.length - 1] || 0, confidence: 0.3 };
    }

    // Simple linear regression for prediction
    const trend = this.calculateLinearTrend(historicalValues);
    const lastValue = historicalValues[historicalValues.length - 1];
    const predictedValue = lastValue + (trend * stepsAhead);

    return {
      value: Math.max(0, predictedValue), // Ensure non-negative values
      confidence: Math.max(0.3, Math.min(0.9, 1 - (stepsAhead * 0.1)))
    };
  }

  private calculateLinearTrend(values: number[]): number {
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * values[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);

    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }

  private async identifyRiskFactors(csat: number, nps: number): Promise<string[]> {
    const factors: string[] = [];

    if (csat < 3.5) factors.push('Low customer satisfaction');
    if (nps < 0) factors.push('Negative net promoter score');
    if (csat < 3 && nps < -20) factors.push('Critical satisfaction levels');

    return factors;
  }

  private async identifyImprovementOpportunities(csat: number, nps: number): Promise<string[]> {
    const opportunities: string[] = [];

    if (csat < 4) opportunities.push('Focus on improving service quality');
    if (nps < 20) opportunities.push('Enhance customer experience to boost loyalty');
    if (csat > 4 && nps > 30) opportunities.push('Leverage satisfied customers for referrals');

    return opportunities;
  }

  private async getBenchmarkComparison(metrics: SatisfactionMetrics): Promise<any> {
    // This would compare against industry benchmarks
    return {
      csat_percentile: this.calculatePercentile(metrics.csat, 3.8, 4.5),
      nps_percentile: this.calculatePercentile(metrics.nps, 10, 40),
      ces_percentile: this.calculatePercentile(7 - metrics.ces, 2, 4), // Reverse CES as lower is better
      industry_average: {
        csat: 3.8,
        nps: 10,
        ces: 3.2
      },
      top_quartile: {
        csat: 4.5,
        nps: 40,
        ces: 2.0
      }
    };
  }

  private calculatePercentile(value: number, industryAvg: number, topQuartile: number): number {
    if (value <= industryAvg) return Math.max(25, (value / industryAvg) * 25);
    if (value >= topQuartile) return 75 + ((value - topQuartile) / topQuartile) * 25;
    return 25 + ((value - industryAvg) / (topQuartile - industryAvg)) * 50;
  }

  private async generateImprovementRoadmap(drivers: SatisfactionDriver[], issues: any[]): Promise<any> {
    // This would create a prioritized roadmap for improvement
    return {
      immediate_actions: [
        'Address top satisfaction drivers',
        'Focus on high-impact, low-effort improvements',
        'Implement quick wins identified in analysis'
      ],
      short_term_goals: [
        'Improve response time consistency',
        'Enhance agent training programs',
        'Optimize support processes'
      ],
      long_term_initiatives: [
        'Implement predictive analytics',
        'Develop automated quality monitoring',
        'Create continuous improvement framework'
      ],
      expected_impact: {
        csat_improvement: '+0.5 points',
        nps_improvement: '+15 points',
        ces_improvement: '-0.8 points'
      }
    };
  }
}

// Export singleton instance
export const customerSatisfactionAnalyticsService = new CustomerSatisfactionAnalyticsService();
export default customerSatisfactionAnalyticsService;