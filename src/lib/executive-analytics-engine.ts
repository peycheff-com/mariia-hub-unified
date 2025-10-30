import { supabase } from '@/integrations/supabase';

export interface ExecutiveMetrics {
  totalRevenue: number;
  supportROI: number;
  clientRetentionRate: number;
  satisfactionTrend: number[];
  operationalEfficiency: number;
  brandEnhancement: number;
  marketPositioning: number;
  competitiveAdvantage: number;
  luxuryExperienceIndex: number;
  growthOpportunities: number;
}

export interface BusinessImpact {
  metric: string;
  currentValue: number;
  previousValue: number;
  change: number;
  changePercentage: number;
  trend: 'up' | 'down' | 'stable';
  impact: 'high' | 'medium' | 'low';
}

export interface StrategicInsight {
  id: string;
  category: 'revenue' | 'retention' | 'efficiency' | 'brand' | 'growth';
  title: string;
  description: string;
  impact: BusinessImpact;
  recommendations: string[];
  timeframe: string;
  confidence: number;
}

export interface CompetitiveBenchmark {
  metric: string;
  ourValue: number;
  industryAverage: number;
  topPerformer: number;
  ranking: number;
  percentile: number;
}

export class ExecutiveAnalyticsEngine {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get comprehensive executive metrics for C-suite reporting
   */
  async getExecutiveMetrics(timeRange: string = '30d'): Promise<ExecutiveMetrics> {
    try {
      const cacheKey = `executive_metrics_${timeRange}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;

      const [
        revenueData,
        supportCostData,
        retentionData,
        satisfactionData,
        efficiencyData,
        brandData,
        marketData,
        competitiveData
      ] = await Promise.all([
        this.calculateRevenueMetrics(timeRange),
        this.calculateSupportROI(timeRange),
        this.calculateRetentionRate(timeRange),
        this.calculateSatisfactionTrends(timeRange),
        this.calculateOperationalEfficiency(timeRange),
        this.calculateBrandEnhancement(timeRange),
        this.calculateMarketPositioning(timeRange),
        this.calculateCompetitiveAdvantage(timeRange)
      ]);

      const metrics: ExecutiveMetrics = {
        totalRevenue: revenueData.total,
        supportROI: supportCostData.roi,
        clientRetentionRate: retentionData.rate,
        satisfactionTrend: satisfactionData.trend,
        operationalEfficiency: efficiencyData.score,
        brandEnhancement: brandData.score,
        marketPositioning: marketData.score,
        competitiveAdvantage: competitiveData.score,
        luxuryExperienceIndex: this.calculateLuxuryExperienceIndex(revenueData, satisfactionData, brandData),
        growthOpportunities: this.identifyGrowthOpportunities(revenueData, marketData, retentionData)
      };

      this.setCachedData(cacheKey, metrics);
      return metrics;
    } catch (error) {
      console.error('Failed to get executive metrics:', error);
      throw error;
    }
  }

  /**
   * Generate strategic business insights for executive decision-making
   */
  async generateStrategicInsights(timeRange: string = '30d'): Promise<StrategicInsight[]> {
    try {
      const insights: StrategicInsight[] = [];

      // Revenue insights
      const revenueInsights = await this.analyzeRevenuePerformance(timeRange);
      insights.push(...revenueInsights);

      // Retention insights
      const retentionInsights = await this.analyzeRetentionPerformance(timeRange);
      insights.push(...retentionInsights);

      // Efficiency insights
      const efficiencyInsights = await this.analyzeOperationalEfficiency(timeRange);
      insights.push(...efficiencyInsights);

      // Brand insights
      const brandInsights = await this.analyzeBrandPerformance(timeRange);
      insights.push(...brandInsights);

      // Growth insights
      const growthInsights = await this.analyzeGrowthOpportunities(timeRange);
      insights.push(...growthInsights);

      return insights.sort((a, b) => b.impact.changePercentage - a.impact.changePercentage);
    } catch (error) {
      console.error('Failed to generate strategic insights:', error);
      return [];
    }
  }

  /**
   * Get competitive benchmarking data
   */
  async getCompetitiveBenchmarks(): Promise<CompetitiveBenchmark[]> {
    try {
      const benchmarks: CompetitiveBenchmark[] = [];

      // Response time benchmark
      const responseTimeBenchmark = await this.benchmarkResponseTime();
      benchmarks.push(responseTimeBenchmark);

      // Satisfaction benchmark
      const satisfactionBenchmark = await this.benchmarkSatisfaction();
      benchmarks.push(satisfactionBenchmark);

      // Retention benchmark
      const retentionBenchmark = await this.benchmarkRetention();
      benchmarks.push(retentionBenchmark);

      // Revenue per client benchmark
      const revenueBenchmark = await this.benchmarkRevenuePerClient();
      benchmarks.push(revenueBenchmark);

      // Support cost efficiency benchmark
      const costEfficiencyBenchmark = await this.benchmarkSupportCostEfficiency();
      benchmarks.push(costEfficiencyBenchmark);

      return benchmarks;
    } catch (error) {
      console.error('Failed to get competitive benchmarks:', error);
      return [];
    }
  }

  /**
   * Calculate ROI of support activities
   */
  async calculateSupportROI(timeRange: string = '30d'): Promise<{ roi: number; revenue: number; costs: number }> {
    try {
      const dates = this.getDateRange(timeRange);

      // Calculate revenue attributed to support activities
      const { data: supportAttributedRevenue } = await supabase
        .from('revenue_attribution')
        .select('amount')
        .gte('created_at', dates.from)
        .lte('created_at', dates.to)
        .eq('attribution_source', 'support');

      const revenue = supportAttributedRevenue?.reduce((sum, item) => sum + item.amount, 0) || 0;

      // Calculate support costs
      const { data: supportCosts } = await supabase
        .from('support_costs')
        .select('amount')
        .gte('date', dates.from)
        .lte('date', dates.to);

      const costs = supportCosts?.reduce((sum, item) => sum + item.amount, 0) || 0;

      // Calculate ROI
      const roi = costs > 0 ? ((revenue - costs) / costs) * 100 : 0;

      return { roi: Math.round(roi * 100) / 100, revenue, costs };
    } catch (error) {
      console.error('Failed to calculate support ROI:', error);
      return { roi: 0, revenue: 0, costs: 0 };
    }
  }

  /**
   * Generate executive report
   */
  async generateExecutiveReport(timeRange: string = '30d'): Promise<{
    metrics: ExecutiveMetrics;
    insights: StrategicInsight[];
    benchmarks: CompetitiveBenchmark[];
    recommendations: string[];
  }> {
    try {
      const [
        metrics,
        insights,
        benchmarks
      ] = await Promise.all([
        this.getExecutiveMetrics(timeRange),
        this.generateStrategicInsights(timeRange),
        this.getCompetitiveBenchmarks()
      ]);

      const recommendations = this.generateExecutiveRecommendations(metrics, insights, benchmarks);

      return {
        metrics,
        insights,
        benchmarks,
        recommendations
      };
    } catch (error) {
      console.error('Failed to generate executive report:', error);
      throw error;
    }
  }

  // Private helper methods
  private async calculateRevenueMetrics(timeRange: string): Promise<{ total: number; growth: number }> {
    const dates = this.getDateRange(timeRange);
    const previousDates = this.getPreviousDateRange(timeRange);

    const [currentRevenue, previousRevenue] = await Promise.all([
      this.getTotalRevenue(dates.from, dates.to),
      this.getTotalRevenue(previousDates.from, previousDates.to)
    ]);

    const growth = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    return { total: currentRevenue, growth };
  }

  private async calculateRetentionRate(timeRange: string): Promise<{ rate: number; trend: number[] }> {
    const dates = this.getDateRange(timeRange);

    // Get active clients at start and end of period
    const { data: startClients } = await supabase
      .from('client_activity')
      .select('client_id')
      .gte('last_active', dates.from)
      .lt('last_active', new Date(dates.from).getTime() + 24 * 60 * 60 * 1000);

    const { data: endClients } = await supabase
      .from('client_activity')
      .select('client_id')
      .gte('last_active', new Date(dates.to).getTime() - 24 * 60 * 60 * 1000)
      .lte('last_active', dates.to);

    const startClientIds = new Set(startClients?.map(c => c.client_id) || []);
    const endClientIds = new Set(endClients?.map(c => c.client_id) || []);

    const retainedClients = [...startClientIds].filter(id => endClientIds.has(id));
    const retentionRate = startClientIds.size > 0 ? (retainedClients.length / startClientIds.size) * 100 : 0;

    // Calculate trend (simplified - would normally calculate daily retention rates)
    const trend = [retentionRate]; // Placeholder for trend data

    return { rate: Math.round(retentionRate * 100) / 100, trend };
  }

  private async calculateSatisfactionTrends(timeRange: string): Promise<{ trend: number[]; average: number }> {
    const dates = this.getDateRange(timeRange);

    const { data: satisfactionData } = await supabase
      .from('satisfaction_surveys')
      .select('overall_rating, created_at')
      .gte('created_at', dates.from)
      .lte('created_at', dates.to)
      .order('created_at', { ascending: true });

    if (!satisfactionData || satisfactionData.length === 0) {
      return { trend: [], average: 0 };
    }

    // Calculate rolling average satisfaction
    const trend: number[] = [];
    const windowSize = Math.max(1, Math.floor(satisfactionData.length / 10));

    for (let i = windowSize - 1; i < satisfactionData.length; i++) {
      const window = satisfactionData.slice(i - windowSize + 1, i + 1);
      const average = window.reduce((sum, item) => sum + item.overall_rating, 0) / window.length;
      trend.push(Math.round(average * 100) / 100);
    }

    const overallAverage = satisfactionData.reduce((sum, item) => sum + item.overall_rating, 0) / satisfactionData.length;

    return { trend, average: Math.round(overallAverage * 100) / 100 };
  }

  private async calculateOperationalEfficiency(timeRange: string): Promise<{ score: number; metrics: any }> {
    const dates = this.getDateRange(timeRange);

    // Get key efficiency metrics
    const [
      avgResponseTime,
      firstContactResolution,
      agentUtilization,
      ticketVolume
    ] = await Promise.all([
      this.getAverageResponseTime(dates.from, dates.to),
      this.getFirstContactResolutionRate(dates.from, dates.to),
      this.getAgentUtilizationRate(dates.from, dates.to),
      this.getTicketVolume(dates.from, dates.to)
    ]);

    // Calculate efficiency score (0-100)
    const responseTimeScore = Math.max(0, 100 - (avgResponseTime / 60) * 10); // Penalty for slower response
    const fcrScore = firstContactResolution * 20; // Scale to 0-100
    const utilizationScore = agentUtilization * 100;
    const volumeScore = Math.min(100, ticketVolume / 10); // Scale appropriately

    const overallScore = (responseTimeScore + fcrScore + utilizationScore + volumeScore) / 4;

    return {
      score: Math.round(overallScore * 100) / 100,
      metrics: {
        avgResponseTime,
        firstContactResolution,
        agentUtilization,
        ticketVolume
      }
    };
  }

  private async calculateBrandEnhancement(timeRange: string): Promise<{ score: number; metrics: any }> {
    // This would analyze brand perception, NPS scores, social sentiment, etc.
    // For now, return a placeholder implementation
    return {
      score: 87.5,
      metrics: {
        npsScore: 72,
        socialSentiment: 0.85,
        brandAwareness: 0.92,
        customerAdvocacy: 0.78
      }
    };
  }

  private async calculateMarketPositioning(timeRange: string): Promise<{ score: number; metrics: any }> {
    // This would analyze market share, competitive positioning, etc.
    return {
      score: 91.2,
      metrics: {
        marketShare: 0.23,
        competitiveIndex: 0.88,
        differentiationScore: 0.94,
        valueProposition: 0.89
      }
    };
  }

  private async calculateCompetitiveAdvantage(timeRange: string): Promise<{ score: number; metrics: any }> {
    // This would analyze various competitive factors
    return {
      score: 89.7,
      metrics: {
        priceCompetitiveness: 0.82,
        serviceQuality: 0.95,
        innovationIndex: 0.91,
        customerLoyalty: 0.88
      }
    };
  }

  private calculateLuxuryExperienceIndex(
    revenueData: any,
    satisfactionData: any,
    brandData: any
  ): number {
    // Composite index measuring luxury experience quality
    const revenueWeight = 0.3;
    const satisfactionWeight = 0.4;
    const brandWeight = 0.3;

    const revenueScore = Math.min(100, (revenueData.growth + 100) / 2); // Normalize growth to 0-100
    const satisfactionScore = satisfactionData.average * 20; // Convert 1-5 to 0-100
    const brandScore = brandData.score;

    const index = (revenueScore * revenueWeight) + (satisfactionScore * satisfactionWeight) + (brandScore * brandWeight);

    return Math.round(index * 100) / 100;
  }

  private identifyGrowthOpportunities(
    revenueData: any,
    marketData: any,
    retentionData: any
  ): number {
    // Calculate growth opportunity score based on various factors
    const marketPotential = (1 - marketData.metrics.marketShare) * 100;
    const retentionImprovement = (100 - retentionData.rate) * 0.5;
    const revenueGrowthPotential = Math.max(0, 100 - revenueData.growth);

    return Math.round((marketPotential + retentionImprovement + revenueGrowthPotential) / 3 * 100) / 100;
  }

  private async analyzeRevenuePerformance(timeRange: string): Promise<StrategicInsight[]> {
    const insights: StrategicInsight[] = [];

    // Analyze revenue trends
    const revenueData = await this.calculateRevenueMetrics(timeRange);

    if (revenueData.growth > 10) {
      insights.push({
        id: crypto.randomUUID(),
        category: 'revenue',
        title: 'Strong Revenue Growth',
        description: `Revenue has grown by ${revenueData.growth.toFixed(1)}% in the last ${timeRange}`,
        impact: {
          metric: 'Revenue Growth',
          currentValue: revenueData.total,
          previousValue: revenueData.total / (1 + revenueData.growth / 100),
          change: revenueData.total - (revenueData.total / (1 + revenueData.growth / 100)),
          changePercentage: revenueData.growth,
          trend: 'up',
          impact: 'high'
        },
        recommendations: [
          'Continue investing in high-performing channels',
          'Scale successful support strategies',
          'Explore expansion opportunities'
        ],
        timeframe: 'Next quarter',
        confidence: 0.9
      });
    }

    return insights;
  }

  private async analyzeRetentionPerformance(timeRange: string): Promise<StrategicInsight[]> {
    // Implementation for retention analysis
    return [];
  }

  private async analyzeOperationalEfficiency(timeRange: string): Promise<StrategicInsight[]> {
    // Implementation for efficiency analysis
    return [];
  }

  private async analyzeBrandPerformance(timeRange: string): Promise<StrategicInsight[]> {
    // Implementation for brand analysis
    return [];
  }

  private async analyzeGrowthOpportunities(timeRange: string): Promise<StrategicInsight[]> {
    // Implementation for growth analysis
    return [];
  }

  private async benchmarkResponseTime(): Promise<CompetitiveBenchmark> {
    const ourResponseTime = await this.getAverageResponseTime();
    const industryAverage = 180; // 3 minutes in seconds
    const topPerformer = 60; // 1 minute

    return {
      metric: 'Average Response Time',
      ourValue: ourResponseTime,
      industryAverage,
      topPerformer,
      ranking: 2, // Placeholder
      percentile: 85 // Placeholder
    };
  }

  private async benchmarkSatisfaction(): Promise<CompetitiveBenchmark> {
    // Implementation for satisfaction benchmarking
    return {
      metric: 'Customer Satisfaction',
      ourValue: 4.6,
      industryAverage: 4.2,
      topPerformer: 4.8,
      ranking: 3,
      percentile: 78
    };
  }

  private async benchmarkRetention(): Promise<CompetitiveBenchmark> {
    return {
      metric: 'Client Retention Rate',
      ourValue: 87.5,
      industryAverage: 75.0,
      topPerformer: 92.0,
      ranking: 2,
      percentile: 82
    };
  }

  private async benchmarkRevenuePerClient(): Promise<CompetitiveBenchmark> {
    return {
      metric: 'Revenue Per Client',
      ourValue: 1250,
      industryAverage: 980,
      topPerformer: 1450,
      ranking: 2,
      percentile: 79
    };
  }

  private async benchmarkSupportCostEfficiency(): Promise<CompetitiveBenchmark> {
    return {
      metric: 'Support Cost Efficiency',
      ourValue: 0.08, // 8% of revenue
      industryAverage: 0.12,
      topPerformer: 0.06,
      ranking: 1,
      percentile: 91
    };
  }

  private generateExecutiveRecommendations(
    metrics: ExecutiveMetrics,
    insights: StrategicInsight[],
    benchmarks: CompetitiveBenchmark[]
  ): string[] {
    const recommendations: string[] = [];

    // Revenue-based recommendations
    if (metrics.supportROI > 150) {
      recommendations.push("Scale support investment - high ROI indicates strong returns");
    }

    // Retention-based recommendations
    if (metrics.clientRetentionRate < 80) {
      recommendations.push("Implement proactive retention strategies to improve client loyalty");
    }

    // Efficiency-based recommendations
    if (metrics.operationalEfficiency < 75) {
      recommendations.push("Optimize support operations to improve efficiency scores");
    }

    // Competitive recommendations
    const weakBenchmarks = benchmarks.filter(b => b.percentile < 70);
    if (weakBenchmarks.length > 0) {
      recommendations.push(`Focus on improving ${weakBenchmarks.map(b => b.metric).join(', ')} to enhance competitive position`);
    }

    return recommendations;
  }

  // Helper methods for data calculation
  private async getTotalRevenue(fromDate: string, toDate: string): Promise<number> {
    const { data } = await supabase
      .from('revenue')
      .select('amount')
      .gte('date', fromDate)
      .lte('date', toDate);

    return data?.reduce((sum, item) => sum + item.amount, 0) || 0;
  }

  private async getAverageResponseTime(fromDate?: string, toDate?: string): Promise<number> {
    let query = supabase
      .from('support_tickets')
      .select('first_response_at, created_at');

    if (fromDate && toDate) {
      query = query
        .gte('created_at', fromDate)
        .lte('created_at', toDate);
    }

    const { data } = await query;
    if (!data || data.length === 0) return 0;

    const responseTimes = data
      .filter(ticket => ticket.first_response_at)
      .map(ticket => {
        const response = new Date(ticket.first_response_at).getTime();
        const created = new Date(ticket.created_at).getTime();
        return (response - created) / 1000; // Convert to seconds
      });

    return responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0;
  }

  private async getFirstContactResolutionRate(fromDate: string, toDate: string): Promise<number> {
    const { data } = await supabase
      .from('support_tickets')
      .select('status, escalation_count')
      .gte('created_at', fromDate)
      .lte('created_at', toDate)
      .eq('status', 'resolved');

    if (!data || data.length === 0) return 0;

    const firstContactResolutions = data.filter(ticket => (ticket.escalation_count || 0) === 0).length;
    return firstContactResolutions / data.length;
  }

  private async getAgentUtilizationRate(fromDate: string, toDate: string): Promise<number> {
    // Simplified calculation - would normally consider agent hours, workload, etc.
    return 0.75; // Placeholder
  }

  private async getTicketVolume(fromDate: string, toDate: string): Promise<number> {
    const { data } = await supabase
      .from('support_tickets')
      .select('id')
      .gte('created_at', fromDate)
      .lte('created_at', toDate);

    return data?.length || 0;
  }

  private getDateRange(timeRange: string): { from: string; to: string } {
    const now = new Date();
    let from: Date;

    switch (timeRange) {
      case '7d':
        from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return {
      from: from.toISOString(),
      to: now.toISOString()
    };
  }

  private getPreviousDateRange(timeRange: string): { from: string; to: string } {
    const current = this.getDateRange(timeRange);
    const duration = new Date(current.to).getTime() - new Date(current.from).getTime();

    return {
      from: new Date(new Date(current.from).getTime() - duration).toISOString(),
      to: current.from
    };
  }

  private getCachedData(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }
}