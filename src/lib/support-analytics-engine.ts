// Advanced Analytics Calculation Engine for Support Analytics
import { supabase } from '@/integrations/supabase/client';
import {
  SupportAnalyticsFilter,
  SupportDashboardMetrics,
  SupportPrediction,
  SupportKPIDefinition,
  SupportBenchmarkData,
  TimeSeriesData,
  ComparisonData
} from '@/types/support-analytics';

export interface AnalyticsCalculationConfig {
  timeWindow: {
    start: Date;
    end: Date;
    comparisonStart?: Date;
    comparisonEnd?: Date;
  };
  dimensions: string[];
  metrics: string[];
  filters: Record<string, any>;
  aggregationLevel: 'hour' | 'day' | 'week' | 'month';
}

export interface AnalyticsResult<T = any> {
  data: T;
  metadata: {
    calculationTime: number;
    dataSource: string;
    confidence: number;
    sampleSize: number;
    lastUpdated: Date;
  };
  trends: {
    direction: 'up' | 'down' | 'stable';
    magnitude: number;
    significance: number;
  };
  benchmarks?: SupportBenchmarkData;
}

export class SupportAnalyticsEngine {
  private readonly KPI_DEFINITIONS: Map<string, SupportKPIDefinition> = new Map([
    ['ticket_volume', {
      name: 'Ticket Volume',
      description: 'Total number of support tickets',
      calculation: 'COUNT(DISTINCT id)',
      target_value: 100,
      threshold_min: 50,
      threshold_max: 200,
      unit: 'tickets',
      frequency: 'daily',
      dimensions: ['channel', 'category', 'priority', 'agent']
    }],
    ['first_response_time', {
      name: 'First Response Time',
      description: 'Average time to first response in minutes',
      calculation: 'AVG(EXTRACT(EPOCH FROM (first_response_at - assigned_at))/60)',
      target_value: 60,
      threshold_min: 30,
      threshold_max: 120,
      unit: 'minutes',
      frequency: 'hourly',
      dimensions: ['channel', 'priority', 'category', 'agent']
    }],
    ['resolution_time', {
      name: 'Resolution Time',
      description: 'Average time to resolve tickets in hours',
      calculation: 'AVG(EXTRACT(EPOCH FROM (resolved_at - assigned_at))/3600)',
      target_value: 24,
      threshold_min: 12,
      threshold_max: 48,
      unit: 'hours',
      frequency: 'daily',
      dimensions: ['channel', 'priority', 'category', 'agent']
    }],
    ['customer_satisfaction', {
      name: 'Customer Satisfaction',
      description: 'Average customer satisfaction rating',
      calculation: 'AVG(customer_satisfaction_rating)',
      target_value: 4.5,
      threshold_min: 3.5,
      threshold_max: 5.0,
      unit: 'rating',
      frequency: 'daily',
      dimensions: ['channel', 'category', 'priority', 'agent']
    }],
    ['sla_compliance', {
      name: 'SLA Compliance Rate',
      description: 'Percentage of tickets meeting SLA requirements',
      calculation: '(COUNT(CASE WHEN first_response_met = true THEN 1 END)::DECIMAL / COUNT(*)) * 100',
      target_value: 95,
      threshold_min: 85,
      threshold_max: 100,
      unit: 'percentage',
      frequency: 'daily',
      dimensions: ['priority', 'category', 'agent']
    }],
    ['first_contact_resolution', {
      name: 'First Contact Resolution',
      description: 'Percentage of tickets resolved on first contact',
      calculation: '(COUNT(CASE WHEN first_contact_resolution = true THEN 1 END)::DECIMAL / COUNT(*)) * 100',
      target_value: 80,
      threshold_min: 60,
      threshold_max: 95,
      unit: 'percentage',
      frequency: 'daily',
      dimensions: ['channel', 'category', 'agent']
    }],
    ['agent_utilization', {
      name: 'Agent Utilization',
      description: 'Percentage of agent time spent on support activities',
      calculation: 'AVG(utilization_rate)',
      target_value: 85,
      threshold_min: 70,
      threshold_max: 95,
      unit: 'percentage',
      frequency: 'hourly',
      dimensions: ['agent', 'team']
    }]
  ]);

  async calculateKPI(
    kpiName: string,
    config: AnalyticsCalculationConfig
  ): Promise<AnalyticsResult<number>> {
    const startTime = performance.now();
    const definition = this.KPI_DEFINITIONS.get(kpiName);

    if (!definition) {
      throw new Error(`Unknown KPI: ${kpiName}`);
    }

    const { data, count } = await this.executeQuery(kpiName, config);
    const calculationTime = performance.now() - startTime;

    const currentValue = this.extractValue(data, kpiName);
    const previousValue = await this.getPreviousValue(kpiName, config);

    const result: AnalyticsResult<number> = {
      data: currentValue,
      metadata: {
        calculationTime,
        dataSource: 'support_tickets',
        confidence: this.calculateConfidence(count, definition.frequency),
        sampleSize: count || 0,
        lastUpdated: new Date()
      },
      trends: this.calculateTrend(currentValue, previousValue),
      benchmarks: await this.getBenchmarks(kpiName, currentValue)
    };

    return result;
  }

  async calculateMultiKPI(
    kpiNames: string[],
    config: AnalyticsCalculationConfig
  ): Promise<AnalyticsResult<Record<string, number>>> {
    const startTime = performance.now();
    const results: Record<string, number> = {};
    const totalSampleSize = 0;

    for (const kpiName of kpiNames) {
      const definition = this.KPI_DEFINITIONS.get(kpiName);
      if (!definition) continue;

      const { data, count } = await this.executeQuery(kpiName, config);
      results[kpiName] = this.extractValue(data, kpiName);
    }

    const calculationTime = performance.now() - startTime;

    return {
      data: results,
      metadata: {
        calculationTime,
        dataSource: 'support_tickets',
        confidence: 0.95,
        sampleSize: totalSampleSize,
        lastUpdated: new Date()
      },
      trends: {
        direction: 'stable',
        magnitude: 0,
        significance: 0
      }
    };
  }

  async calculateTimeSeries(
    kpiName: string,
    config: AnalyticsCalculationConfig
  ): Promise<AnalyticsResult<TimeSeriesData[]>> {
    const startTime = performance.now();
    const definition = this.KPI_DEFINITIONS.get(kpiName);

    if (!definition) {
      throw new Error(`Unknown KPI: ${kpiName}`);
    }

    const timeSeriesData = await this.generateTimeSeriesData(kpiName, config);
    const calculationTime = performance.now() - startTime;

    return {
      data: timeSeriesData,
      metadata: {
        calculationTime,
        dataSource: 'support_analytics_snapshots',
        confidence: 0.9,
        sampleSize: timeSeriesData.length,
        lastUpdated: new Date()
      },
      trends: this.calculateTimeSeriesTrend(timeSeriesData)
    };
  }

  async calculateComparison(
    kpiName: string,
    config: AnalyticsCalculationConfig
  ): Promise<AnalyticsResult<ComparisonData[]>> {
    const startTime = performance.now();

    const currentPeriod = await this.calculateKPI(kpiName, {
      ...config,
      timeWindow: {
        start: config.timeWindow.start,
        end: config.timeWindow.end
      }
    });

    const previousPeriod = await this.calculateKPI(kpiName, {
      ...config,
      timeWindow: {
        start: config.timeWindow.comparisonStart || config.timeWindow.start,
        end: config.timeWindow.comparisonEnd || config.timeWindow.start
      }
    });

    const calculationTime = performance.now() - startTime;

    const comparison: ComparisonData[] = [{
      category: kpiName,
      current_period: currentPeriod.data,
      previous_period: previousPeriod.data,
      change_percentage: this.calculatePercentageChange(previousPeriod.data, currentPeriod.data),
      trend: currentPeriod.trends.direction
    }];

    return {
      data: comparison,
      metadata: {
        calculationTime,
        dataSource: 'support_tickets',
        confidence: Math.min(currentPeriod.metadata.confidence, previousPeriod.metadata.confidence),
        sampleSize: currentPeriod.metadata.sampleSize + previousPeriod.metadata.sampleSize,
        lastUpdated: new Date()
      },
      trends: currentPeriod.trends
    };
  }

  async predictFutureValues(
    kpiName: string,
    forecastDays: number = 7
  ): Promise<AnalyticsResult<SupportPrediction[]>> {
    const startTime = performance.now();

    const historicalData = await this.getHistoricalData(kpiName, 30); // Last 30 days
    const predictions = this.generatePredictions(historicalData, forecastDays);

    const calculationTime = performance.now() - startTime;

    return {
      data: predictions,
      metadata: {
        calculationTime,
        dataSource: 'historical_analysis',
        confidence: this.calculatePredictionConfidence(historicalData),
        sampleSize: historicalData.length,
        lastUpdated: new Date()
      },
      trends: {
        direction: this.determineTrendDirection(predictions),
        magnitude: this.calculateTrendMagnitude(predictions),
        significance: 0.8
      }
    };
  }

  async calculateCorrelationMatrix(
    kpiNames: string[],
    config: AnalyticsCalculationConfig
  ): Promise<AnalyticsResult<Record<string, Record<string, number>>>> {
    const startTime = performance.now();

    const data: Record<string, number[]> = {};

    // Gather data for all KPIs
    for (const kpiName of kpiNames) {
      const timeSeries = await this.calculateTimeSeries(kpiName, config);
      data[kpiName] = timeSeries.data.map(d => d.y).filter(v => !isNaN(v));
    }

    // Calculate correlation matrix
    const correlationMatrix: Record<string, Record<string, number>> = {};

    for (const kpi1 of kpiNames) {
      correlationMatrix[kpi1] = {};
      for (const kpi2 of kpiNames) {
        if (data[kpi1] && data[kpi2] && data[kpi1].length > 1 && data[kpi2].length > 1) {
          correlationMatrix[kpi1][kpi2] = this.calculatePearsonCorrelation(data[kpi1], data[kpi2]);
        } else {
          correlationMatrix[kpi1][kpi2] = 0;
        }
      }
    }

    const calculationTime = performance.now() - startTime;

    return {
      data: correlationMatrix,
      metadata: {
        calculationTime,
        dataSource: 'correlation_analysis',
        confidence: 0.85,
        sampleSize: Math.min(...Object.values(data).map(d => d.length)),
        lastUpdated: new Date()
      },
      trends: {
        direction: 'stable',
        magnitude: 0,
        significance: 0.5
      }
    };
  }

  async detectAnomalies(
    kpiName: string,
    config: AnalyticsCalculationConfig,
    sensitivityThreshold: number = 2.0
  ): Promise<AnalyticsResult<Array<{timestamp: Date; value: number; anomalyScore: number; isAnomaly: boolean}>>> {
    const startTime = performance.now();

    const timeSeries = await this.calculateTimeSeries(kpiName, config);
    const anomalies = this.detectStatisticalAnomalies(timeSeries.data, sensitivityThreshold);

    const calculationTime = performance.now() - startTime;

    return {
      data: anomalies,
      metadata: {
        calculationTime,
        dataSource: 'statistical_analysis',
        confidence: 0.9,
        sampleSize: timeSeries.data.length,
        lastUpdated: new Date()
      },
      trends: {
        direction: 'stable',
        magnitude: 0,
        significance: anomalies.length > 0 ? 0.8 : 0.2
      }
    };
  }

  async calculateAgentPerformanceScore(
    agentId: string,
    config: AnalyticsCalculationConfig
  ): Promise<AnalyticsResult<{
    overallScore: number;
    breakdown: Record<string, number>;
    ranking: number;
    improvementAreas: string[];
  }>> {
    const startTime = performance.now();

    const kpiWeights = {
      customer_satisfaction: 0.3,
      first_response_time: 0.2,
      resolution_time: 0.2,
      first_contact_resolution: 0.15,
      sla_compliance: 0.15
    };

    const breakdown: Record<string, number> = {};
    let totalScore = 0;

    for (const [kpi, weight] of Object.entries(kpiWeights)) {
      const result = await this.calculateKPI(kpi, {
        ...config,
        filters: { ...config.filters, agent_id: agentId }
      });

      const normalizedScore = this.normalizeKPIScore(kpi, result.data);
      breakdown[kpi] = normalizedScore;
      totalScore += normalizedScore * weight;
    }

    const ranking = await this.getAgentRanking(agentId, totalScore, config);
    const improvementAreas = this.identifyImprovementAreas(breakdown);

    const calculationTime = performance.now() - startTime;

    return {
      data: {
        overallScore: Math.round(totalScore * 100) / 100,
        breakdown,
        ranking,
        improvementAreas
      },
      metadata: {
        calculationTime,
        dataSource: 'agent_performance',
        confidence: 0.95,
        sampleSize: 1,
        lastUpdated: new Date()
      },
      trends: {
        direction: 'stable',
        magnitude: 0,
        significance: 0.7
      }
    };
  }

  // Private helper methods

  private async executeQuery(kpiName: string, config: AnalyticsCalculationConfig): Promise<{ data: any[]; count: number }> {
    const definition = this.KPI_DEFINITIONS.get(kpiName);
    if (!definition) throw new Error(`Unknown KPI: ${kpiName}`);

    // Build query based on KPI definition and configuration
    let query = supabase
      .from('support_tickets')
      .select('*', { count: 'exact' });

    // Apply time filters
    if (config.timeWindow) {
      query = query
        .gte('created_at', config.timeWindow.start.toISOString())
        .lte('created_at', config.timeWindow.end.toISOString());
    }

    // Apply additional filters
    Object.entries(config.filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });

    const { data, count, error } = await query;
    if (error) throw error;

    // Perform the calculation
    const calculatedData = this.performCalculation(data, definition.calculation, config.dimensions);

    return { data: calculatedData, count: count || 0 };
  }

  private performCalculation(data: any[], calculation: string, dimensions: string[]): any[] {
    // This is a simplified implementation
    // In a real system, you'd parse the calculation string and execute it safely

    if (calculation.includes('COUNT')) {
      return [{ value: data.length }];
    }

    if (calculation.includes('AVG') && calculation.includes('customer_satisfaction_rating')) {
      const ratings = data.map(t => t.customer_satisfaction_rating).filter(r => r !== null);
      const avg = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;
      return [{ value: avg }];
    }

    if (calculation.includes('AVG') && calculation.includes('first_response_at')) {
      const responseTimes = data
        .filter(t => t.first_response_at && t.assigned_at)
        .map(t => (new Date(t.first_response_at).getTime() - new Date(t.assigned_at).getTime()) / 1000 / 60);
      const avg = responseTimes.length > 0 ? responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length : 0;
      return [{ value: avg }];
    }

    return [{ value: 0 }];
  }

  private extractValue(data: any[], kpiName: string): number {
    if (!data || data.length === 0) return 0;
    return data[0]?.value || 0;
  }

  private async getPreviousValue(kpiName: string, config: AnalyticsCalculationConfig): Promise<number> {
    if (!config.timeWindow.comparisonStart || !config.timeWindow.comparisonEnd) {
      return 0;
    }

    const previousConfig = {
      ...config,
      timeWindow: {
        start: config.timeWindow.comparisonStart,
        end: config.timeWindow.comparisonEnd
      }
    };

    const result = await this.calculateKPI(kpiName, previousConfig);
    return result.data;
  }

  private calculateTrend(current: number, previous: number): {
    direction: 'up' | 'down' | 'stable';
    magnitude: number;
    significance: number;
  } {
    if (previous === 0) {
      return { direction: 'stable', magnitude: 0, significance: 0 };
    }

    const change = ((current - previous) / previous) * 100;
    const magnitude = Math.abs(change);

    let direction: 'up' | 'down' | 'stable';
    if (Math.abs(change) < 5) {
      direction = 'stable';
    } else if (change > 0) {
      direction = 'up';
    } else {
      direction = 'down';
    }

    // Calculate statistical significance (simplified)
    const significance = Math.min(magnitude / 10, 1);

    return { direction, magnitude, significance };
  }

  private async getBenchmarks(kpiName: string, currentValue: number): Promise<SupportBenchmarkData> {
    // Mock benchmark data - in a real system, this would come from industry data or historical performance
    const benchmarks: Record<string, { industry: number; topQuartile: number }> = {
      ticket_volume: { industry: 100, topQuartile: 150 },
      first_response_time: { industry: 60, topQuartile: 30 },
      resolution_time: { industry: 24, topQuartile: 12 },
      customer_satisfaction: { industry: 4.0, topQuartile: 4.7 },
      sla_compliance: { industry: 90, topQuartile: 98 },
      first_contact_resolution: { industry: 70, topQuartile: 85 },
      agent_utilization: { industry: 80, topQuartile: 90 }
    };

    const benchmark = benchmarks[kpiName] || { industry: 0, topQuartile: 0 };

    return {
      industry_average: benchmark.industry,
      top_quartile: benchmark.topQuartile,
      current_value: currentValue,
      percentile: this.calculatePercentile(currentValue, benchmark.industry, benchmark.topQuartile),
      trend: 'stable', // Would be calculated based on historical data
      period_over_period_change: 0 // Would be calculated from previous period
    };
  }

  private calculatePercentile(value: number, industryAvg: number, topQuartile: number): number {
    if (value <= industryAvg) return Math.max(25, (value / industryAvg) * 25);
    if (value >= topQuartile) return 75 + ((value - topQuartile) / topQuartile) * 25;
    return 25 + ((value - industryAvg) / (topQuartile - industryAvg)) * 50;
  }

  private calculateConfidence(sampleSize: number, frequency: string): number {
    const minSampleSizes = {
      'real_time': 10,
      'hourly': 25,
      'daily': 50,
      'weekly': 30,
      'monthly': 20
    };

    const minSize = minSampleSizes[frequency] || 30;
    return Math.min(0.99, Math.max(0.5, sampleSize / minSize));
  }

  private async generateTimeSeriesData(kpiName: string, config: AnalyticsCalculationConfig): Promise<TimeSeriesData[]> {
    const definition = this.KPI_DEFINITIONS.get(kpiName);
    if (!definition) return [];

    const { data } = await supabase
      .from('support_analytics_snapshots')
      .select('*')
      .gte('snapshot_date', config.timeWindow.start.toISOString().split('T')[0])
      .lte('snapshot_date', config.timeWindow.end.toISOString().split('T')[0])
      .order('snapshot_date', { ascending: true });

    const kpiFieldMap: Record<string, string> = {
      ticket_volume: 'total_tickets',
      customer_satisfaction: 'customer_satisfaction_avg',
      first_response_time: 'first_response_time_avg',
      resolution_time: 'resolution_time_avg',
      sla_compliance: 'sla_compliance_rate',
      first_contact_resolution: 'first_contact_resolution_rate',
      agent_utilization: 'utilization_rate'
    };

    const field = kpiFieldMap[kpiName];
    if (!field) return [];

    return data?.map(item => ({
      timestamp: item.snapshot_date,
      value: item[field as keyof typeof item] as number || 0,
      metadata: {
        total_tickets: item.total_tickets,
        resolution_time: item.resolution_time_avg
      }
    })) || [];
  }

  private calculateTimeSeriesTrend(data: TimeSeriesData[]): {
    direction: 'up' | 'down' | 'stable';
    magnitude: number;
    significance: number;
  } {
    if (data.length < 2) {
      return { direction: 'stable', magnitude: 0, significance: 0 };
    }

    const values = data.map(d => d.y);
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

    const change = ((secondAvg - firstAvg) / firstAvg) * 100;
    const magnitude = Math.abs(change);

    let direction: 'up' | 'down' | 'stable';
    if (Math.abs(change) < 5) {
      direction = 'stable';
    } else if (change > 0) {
      direction = 'up';
    } else {
      direction = 'down';
    }

    return { direction, magnitude, significance: Math.min(magnitude / 20, 1) };
  }

  private calculatePercentageChange(previous: number, current: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  private async getHistoricalData(kpiName: string, days: number): Promise<TimeSeriesData[]> {
    const config: AnalyticsCalculationConfig = {
      timeWindow: {
        start: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
        end: new Date()
      },
      dimensions: [],
      metrics: [kpiName],
      filters: {},
      aggregationLevel: 'day'
    };

    return this.generateTimeSeriesData(kpiName, config);
  }

  private generatePredictions(historicalData: TimeSeriesData[], forecastDays: number): SupportPrediction[] {
    if (historicalData.length < 7) {
      // Not enough data for meaningful prediction
      return Array.from({ length: forecastDays }, (_, i) => ({
        id: `pred_${i}`,
        prediction_type: 'ticket_volume' as const,
        entity_type: 'system',
        predicted_value: historicalData[historicalData.length - 1]?.y || 0,
        confidence_score: 0.3,
        prediction_date: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        model_version: 'simple_average',
        features_used: {}
      }));
    }

    // Simple linear regression for prediction
    const values = historicalData.map(d => d.y);
    const trend = this.calculateLinearTrend(values);

    const lastValue = values[values.length - 1];
    const volatility = this.calculateVolatility(values);

    return Array.from({ length: forecastDays }, (_, i) => {
      const predictedValue = Math.max(0, lastValue + (trend * (i + 1)));
      const confidence = Math.max(0.3, Math.min(0.9, 1 - (volatility / lastValue)));

      return {
        id: `pred_${i}`,
        prediction_type: 'ticket_volume' as const,
        entity_type: 'system',
        predicted_value: Math.round(predictedValue * 100) / 100,
        confidence_score: Math.round(confidence * 100) / 100,
        prediction_date: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        model_version: 'linear_regression',
        features_used: {
          trend,
          last_value: lastValue,
          volatility,
          seasonality: this.calculateSeasonality(values)
        }
      };
    });
  }

  private calculateLinearTrend(values: number[]): number {
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * values[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  }

  private calculateVolatility(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  private calculateSeasonality(values: number[]): number {
    // Simple seasonality calculation based on weekly patterns
    if (values.length < 14) return 0;

    const weeklyAverages = [];
    for (let i = 0; i < values.length - 7; i += 7) {
      const week = values.slice(i, i + 7);
      const avg = week.reduce((sum, val) => sum + val, 0) / week.length;
      weeklyAverages.push(avg);
    }

    if (weeklyAverages.length < 2) return 0;
    return this.calculateVolatility(weeklyAverages) / weeklyAverages.reduce((sum, val) => sum + val, 0) / weeklyAverages.length;
  }

  private calculatePredictionConfidence(historicalData: TimeSeriesData[]): number {
    if (historicalData.length < 7) return 0.3;
    if (historicalData.length < 30) return 0.6;
    return 0.85;
  }

  private determineTrendDirection(predictions: SupportPrediction[]): 'up' | 'down' | 'stable' {
    if (predictions.length < 2) return 'stable';

    const first = predictions[0].predicted_value;
    const last = predictions[predictions.length - 1].predicted_value;
    const change = ((last - first) / first) * 100;

    if (Math.abs(change) < 5) return 'stable';
    return change > 0 ? 'up' : 'down';
  }

  private calculateTrendMagnitude(predictions: SupportPrediction[]): number {
    if (predictions.length < 2) return 0;

    const values = predictions.map(p => p.predicted_value);
    const trend = this.calculateLinearTrend(values);
    const avgValue = values.reduce((sum, val) => sum + val, 0) / values.length;

    return Math.abs((trend / avgValue) * 100);
  }

  private calculatePearsonCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;

    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    const sumYY = y.reduce((sum, val) => sum + val * val, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  private detectStatisticalAnomalies(
    data: TimeSeriesData[],
    threshold: number
  ): Array<{timestamp: Date; value: number; anomalyScore: number; isAnomaly: boolean}> {
    const values = data.map(d => d.y);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);

    return data.map(point => {
      const zScore = Math.abs((point.y - mean) / stdDev);
      const isAnomaly = zScore > threshold;

      return {
        timestamp: new Date(point.timestamp),
        value: point.y,
        anomalyScore: zScore,
        isAnomaly
      };
    });
  }

  private normalizeKPIScore(kpiName: string, value: number): number {
    const definition = this.KPI_DEFINITIONS.get(kpiName);
    if (!definition) return 0;

    // Normalize to 0-100 scale
    const { target_value, threshold_min, threshold_max } = definition;

    if (kpiName.includes('time') || kpiName.includes('time')) {
      // For time-based metrics, lower is better
      if (value <= target_value) return 100;
      if (value >= threshold_max) return 0;
      return Math.max(0, 100 - ((value - target_value) / (threshold_max - target_value)) * 100);
    } else {
      // For other metrics, higher is better
      if (value >= target_value) return 100;
      if (value <= threshold_min) return 0;
      return Math.min(100, ((value - threshold_min) / (target_value - threshold_min)) * 100);
    }
  }

  private async getAgentRanking(agentId: string, score: number, config: AnalyticsCalculationConfig): Promise<number> {
    // This would typically compare against all agents
    // For now, return a mock ranking
    return Math.floor(Math.random() * 10) + 1;
  }

  private identifyImprovementAreas(breakdown: Record<string, number>): string[] {
    const areas: string[] = [];

    Object.entries(breakdown).forEach(([kpi, score]) => {
      if (score < 70) {
        areas.push(kpi.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
      }
    });

    return areas;
  }
}

// Export singleton instance
export const supportAnalyticsEngine = new SupportAnalyticsEngine();
export default supportAnalyticsEngine;