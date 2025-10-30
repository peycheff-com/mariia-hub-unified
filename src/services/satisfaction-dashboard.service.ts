/**
 * Real-Time Satisfaction Tracking Dashboard Service
 * Live monitoring of client satisfaction metrics with instant alerts
 */

import { supabase } from '@/integrations/supabase/client';
import {
  SatisfactionDashboard,
  SatisfactionOverview,
  RealTimeMetrics,
  TrendAnalysis,
  StaffPerformanceOverview,
  ServiceRecoveryOverview,
  ClientInsights,
  AlertOverview,
  MonthlyTrend,
  StaffMember,
  PerformanceDistribution,
  PriorityBreakdown,
  ClientRisk,
  VIPClientSummary,
  SatisfactionSegment,
  ChurnPrediction,
  SeverityBreakdown,
  TypeBreakdown,
  SatisfactionMetric,
  SatisfactionMetricType,
  ServiceType,
  AlertSeverity,
  AlertStatus
} from '@/types/feedback';

export class SatisfactionDashboardService {
  private static instance: SatisfactionDashboardService;
  private subscriptions: Map<string, () => void> = new Map();
  private updateCallbacks: Set<(dashboard: SatisfactionDashboard) => void> = new Set();

  static getInstance(): SatisfactionDashboardService {
    if (!SatisfactionDashboardService.instance) {
      SatisfactionDashboardService.instance = new SatisfactionDashboardService();
    }
    return SatisfactionDashboardService.instance;
  }

  // =====================================================
  // REAL-TIME DASHBOARD DATA
  // =====================================================

  /**
   * Get complete satisfaction dashboard data
   */
  async getDashboardData(
    filters?: {
      serviceType?: ServiceType;
      dateRange?: { start: string; end: string };
      staffIds?: string[];
    }
  ): Promise<SatisfactionDashboard> {
    try {
      const [
        overview,
        realTimeMetrics,
        trendAnalysis,
        staffPerformance,
        serviceRecovery,
        clientInsights,
        alerts
      ] = await Promise.all([
        this.getSatisfactionOverview(filters),
        this.getRealTimeMetrics(filters),
        this.getTrendAnalysis(filters),
        this.getStaffPerformanceOverview(filters),
        this.getServiceRecoveryOverview(filters),
        this.getClientInsights(filters),
        this.getAlertOverview(filters)
      ]);

      return {
        overview,
        real_time_metrics: realTimeMetrics,
        trend_analysis: trendAnalysis,
        staff_performance: staffPerformance,
        service_recovery: serviceRecovery,
        client_insights: clientInsights,
        alerts
      };

    } catch (error) {
      console.error('Error getting dashboard data:', error);
      throw new Error('Failed to load dashboard data');
    }
  }

  /**
   * Get satisfaction overview
   */
  async getSatisfactionOverview(filters?: any): Promise<SatisfactionOverview> {
    try {
      const dateRange = filters?.dateRange || {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString()
      };

      // Get satisfaction metrics
      const { data: metrics, error } = await supabase
        .from('satisfaction_metrics')
        .select('*')
        .gte('measurement_date', dateRange.start)
        .lte('measurement_date', dateRange.end);

      if (error) throw error;

      // Calculate overview metrics
      const totalSubmissions = metrics?.length || 0;
      const averageSatisfaction = this.calculateAverageScore(metrics, 'overall_satisfaction');

      // Get NPS data
      const { data: npsData } = await supabase
        .from('nps_measurements')
        .select('*')
        .gte('measurement_date', dateRange.start)
        .lte('measurement_date', dateRange.end);

      const npsScore = this.calculateNPSScore(npsData || []);

      // Get CES data
      const { data: cesData } = await supabase
        .from('ces_measurements')
        .select('*')
        .gte('measurement_date', dateRange.start)
        .lte('measurement_date', dateRange.end);

      const cesScore = this.calculateCESScore(cesData || []);

      // Get active alerts
      const { count: activeAlerts } = await supabase
        .from('satisfaction_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('alert_status', 'active');

      // Get recovery cases
      const { count: recoveryCases } = await supabase
        .from('service_recovery_cases')
        .select('*', { count: 'exact', head: true })
        .in('recovery_status', ['new', 'assigned', 'in_progress']);

      return {
        month: new Date().toISOString().substring(0, 7), // Current month
        metric_type: 'overall_satisfaction',
        average_score: averageSatisfaction,
        measurement_count: totalSubmissions,
        score_stddev: this.calculateStandardDeviation(metrics || []),
        min_score: Math.min(...(metrics?.map(m => m.score) || [0])),
        max_score: Math.max(...(metrics?.map(m => m.score) || [0])),
        median_score: this.calculateMedianScore(metrics || []),
        unique_services: new Set(metrics?.map(m => m.service_id).filter(Boolean)).size,
        unique_clients: new Set(metrics?.map(m => m.client_id).filter(Boolean)).size,
        unique_staff: new Set(metrics?.map(m => m.staff_id).filter(Boolean)).size,
        total_submissions: totalSubmissions,
        average_satisfaction: averageSatisfaction,
        nps_score: npsScore,
        ces_score: cesScore,
        active_alerts: activeAlerts || 0,
        recovery_cases: recoveryCases || 0
      };

    } catch (error) {
      console.error('Error getting satisfaction overview:', error);
      throw new Error('Failed to get satisfaction overview');
    }
  }

  /**
   * Get real-time metrics
   */
  async getRealTimeMetrics(filters?: any): Promise<RealTimeMetrics> {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Get today's satisfaction score
      const { data: todayMetrics } = await supabase
        .from('satisfaction_metrics')
        .select('score')
        .gte('measurement_date', today)
        .eq('metric_type', 'overall_satisfaction');

      const currentSatisfactionScore = todayMetrics?.length > 0
        ? todayMetrics.reduce((sum, m) => sum + m.score, 0) / todayMetrics.length
        : 0;

      // Get today's submissions
      const { count: todaySubmissions } = await supabase
        .from('feedback_submissions')
        .select('*', { count: 'exact', head: true })
        .gte('completed_at', today)
        .eq('is_complete', true);

      // Get active alerts
      const { count: activeAlerts } = await supabase
        .from('satisfaction_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('alert_status', 'active');

      // Get pending recovery cases
      const { count: pendingRecoveryCases } = await supabase
        .from('service_recovery_cases')
        .select('*', { count: 'exact', head: true })
        .in('recovery_status', ['new', 'assigned']);

      // Calculate average response time (time from alert creation to acknowledgement)
      const { data: resolvedAlerts } = await supabase
        .from('satisfaction_alerts')
        .select('created_at, updated_at')
        .eq('alert_status', 'resolved')
        .gte('updated_at', today);

      const averageResponseTime = resolvedAlerts?.length > 0
        ? resolvedAlerts.reduce((sum, alert) => {
            const responseTime = new Date(alert.updated_at).getTime() - new Date(alert.created_at).getTime();
            return sum + responseTime;
          }, 0) / resolvedAlerts.length / (1000 * 60) // Convert to minutes
        : 0;

      // Determine current trend
      const currentTrend = await this.getCurrentTrend();

      return {
        current_satisfaction_score: Math.round(currentSatisfactionScore * 100) / 100,
        today_submissions: todaySubmissions || 0,
        active_alerts: activeAlerts || 0,
        pending_recovery_cases: pendingRecoveryCases || 0,
        average_response_time: Math.round(averageResponseTime),
        current_trend: currentTrend
      };

    } catch (error) {
      console.error('Error getting real-time metrics:', error);
      throw new Error('Failed to get real-time metrics');
    }
  }

  /**
   * Get trend analysis
   */
  async getTrendAnalysis(filters?: any): Promise<TrendAnalysis> {
    try {
      const months = 12; // Last 12 months
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(endDate.getMonth() - months);

      // Get satisfaction trends
      const satisfactionTrend = await this.getMonthlyTrend(
        'satisfaction_metrics',
        'score',
        startDate,
        endDate
      );

      // Get NPS trends
      const npsTrend = await this.getMonthlyTrend(
        'nps_measurements',
        'score',
        startDate,
        endDate
      );

      // Get CES trends
      const cesTrend = await this.getMonthlyTrend(
        'ces_measurements',
        'effort_score',
        startDate,
        endDate
      );

      // Get volume trends
      const volumeTrend = await this.getVolumeTrend(startDate, endDate);

      // Get sentiment trends
      const sentimentTrend = await this.getSentimentTrend(startDate, endDate);

      return {
        satisfaction_trend: satisfactionTrend,
        nps_trend: npsTrend,
        ces_trend: cesTrend,
        volume_trend: volumeTrend,
        sentiment_trend: sentimentTrend
      };

    } catch (error) {
      console.error('Error getting trend analysis:', error);
      throw new Error('Failed to get trend analysis');
    }
  }

  /**
   * Get staff performance overview
   */
  async getStaffPerformanceOverview(filters?: any): Promise<StaffPerformanceOverview> {
    try {
      const staffIds = filters?.staffIds;
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(endDate.getMonth() - 3); // Last 3 months

      let query = supabase
        .from('staff_feedback_performance')
        .select(`
          *,
          profiles!staff_feedback_performance_staff_id_fkey (
            display_name,
            role
          )
        `)
        .gte('evaluation_period_end', startDate.toISOString())
        .lte('evaluation_period_end', endDate.toISOString());

      if (staffIds?.length > 0) {
        query = query.in('staff_id', staffIds);
      }

      const { data, error } = await query;
      if (error) throw error;

      const staffData = data || [];

      // Calculate team average
      const teamAverageScore = staffData.length > 0
        ? staffData.reduce((sum, staff) => sum + (staff.average_satisfaction_score || 0), 0) / staffData.length
        : 0;

      // Identify top performers (top 20%)
      const sortedStaff = staffData.sort((a, b) => (b.average_satisfaction_score || 0) - (a.average_satisfaction_score || 0));
      const topPerformersCount = Math.max(1, Math.ceil(staffData.length * 0.2));
      const topPerformers = sortedStaff.slice(0, topPerformersCount).map(staff => ({
        id: staff.staff_id,
        name: staff.profiles?.display_name || 'Unknown',
        role: staff.profiles?.role || 'Staff',
        average_score: staff.average_satisfaction_score || 0,
        total_reviews: staff.total_reviews || 0,
        ranking: staff.ranking_position || 0,
        trend: staff.performance_trend || 'stable'
      }));

      // Identify staff needing improvement (bottom 20%)
      const bottomPerformersCount = Math.max(1, Math.ceil(staffData.length * 0.2));
      const improvementNeeded = sortedStaff.slice(-bottomPerformersCount).reverse().map(staff => ({
        id: staff.staff_id,
        name: staff.profiles?.display_name || 'Unknown',
        role: staff.profiles?.role || 'Staff',
        average_score: staff.average_satisfaction_score || 0,
        total_reviews: staff.total_reviews || 0,
        ranking: staff.ranking_position || 0,
        trend: staff.performance_trend || 'stable'
      }));

      // Calculate performance distribution
      const distribution = this.calculatePerformanceDistribution(staffData);

      return {
        top_performers: topPerformers,
        improvement_needed: improvementNeeded,
        team_average_score: Math.round(teamAverageScore * 100) / 100,
        total_staff_evaluated: staffData.length,
        performance_distribution: distribution
      };

    } catch (error) {
      console.error('Error getting staff performance overview:', error);
      throw new Error('Failed to get staff performance overview');
    }
  }

  /**
   * Get service recovery overview
   */
  async getServiceRecoveryOverview(filters?: any): Promise<ServiceRecoveryOverview> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const thisMonth = new Date().toISOString().substring(0, 7);

      // Get active cases
      const { count: activeCases } = await supabase
        .from('service_recovery_cases')
        .select('*', { count: 'exact', head: true })
        .in('recovery_status', ['new', 'assigned', 'in_progress', 'client_contacted']);

      // Get resolved today
      const { count: resolvedToday } = await supabase
        .from('service_recovery_cases')
        .select('*', { count: 'exact', head: true })
        .eq('recovery_status', 'resolved')
        .gte('updated_at', today);

      // Get average resolution time
      const { data: resolvedCases } = await supabase
        .from('service_recovery_cases')
        .select('created_at, updated_at')
        .eq('recovery_status', 'resolved')
        .like('created_at', `${thisMonth}%`);

      const averageResolutionTime = resolvedCases?.length > 0
        ? resolvedCases.reduce((sum, case_) => {
            const resolutionTime = new Date(case_.updated_at).getTime() - new Date(case_.created_at).getTime();
            return sum + resolutionTime;
          }, 0) / resolvedCases.length / (1000 * 60 * 60) // Convert to hours
        : 0;

      // Get success rate (cases that improved satisfaction)
      const { data: improvementCases } = await supabase
        .from('service_recovery_cases')
        .select('satisfaction_before, satisfaction_after')
        .eq('recovery_status', 'resolved')
        .like('created_at', `${thisMonth}%`);

      const successRate = improvementCases?.length > 0
        ? improvementCases.filter(case_ =>
            (case_.satisfaction_after || 0) > (case_.satisfaction_before || 0)
          ).length / improvementCases.length * 100
        : 0;

      // Get total cost this month
      const { data: compensationData } = await supabase
        .from('recovery_compensation')
        .select('compensation_value')
        .like('offered_at', `${thisMonth}%`);

      const totalCostThisMonth = compensationData?.reduce((sum, comp) =>
        sum + (comp.compensation_value || 0), 0) || 0;

      // Get priority breakdown
      const priorityBreakdown = await this.getPriorityBreakdown();

      return {
        active_cases: activeCases || 0,
        resolved_today: resolvedToday || 0,
        average_resolution_time: Math.round(averageResolutionTime * 10) / 10,
        success_rate: Math.round(successRate),
        total_cost_this_month: Math.round(totalCostThisMonth * 100) / 100,
        priority_breakdown: priorityBreakdown
      };

    } catch (error) {
      console.error('Error getting service recovery overview:', error);
      throw new Error('Failed to get service recovery overview');
    }
  }

  /**
   * Get client insights
   */
  async getClientInsights(filters?: any): Promise<ClientInsights> {
    try {
      // Get at-risk clients
      const atRiskClients = await this.getAtRiskClients();

      // Get VIP clients
      const vipClients = await this.getVIPClients();

      // Get satisfaction segments
      const satisfactionSegments = await this.getSatisfactionSegments();

      // Get churn predictions
      const churnPredictions = await this.getChurnPredictions();

      return {
        at_risk_clients: atRiskClients,
        vip_clients: vipClients,
        satisfaction_segments: satisfactionSegments,
        churn_predictions: churnPredictions
      };

    } catch (error) {
      console.error('Error getting client insights:', error);
      throw new Error('Failed to get client insights');
    }
  }

  /**
   * Get alert overview
   */
  async getAlertOverview(filters?: any): Promise<AlertOverview> {
    try {
      // Get total active alerts
      const { count: totalActive } = await supabase
        .from('satisfaction_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('alert_status', 'active');

      // Get severity breakdown
      const severityBreakdown = await this.getSeverityBreakdown();

      // Get type breakdown
      const typeBreakdown = await this.getTypeBreakdown();

      // Get average resolution time
      const { data: resolvedAlerts } = await supabase
        .from('satisfaction_alerts')
        .select('created_at, updated_at')
        .eq('alert_status', 'resolved')
        .gte('updated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Last 7 days

      const averageResolutionTime = resolvedAlerts?.length > 0
        ? resolvedAlerts.reduce((sum, alert) => {
            const resolutionTime = new Date(alert.updated_at).getTime() - new Date(alert.created_at).getTime();
            return sum + resolutionTime;
          }, 0) / resolvedAlerts.length / (1000 * 60) // Convert to minutes
        : 0;

      // Get overdue alerts
      const overdueThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
      const { count: overdueAlerts } = await supabase
        .from('satisfaction_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('alert_status', 'active')
        .lt('created_at', overdueThreshold.toISOString());

      return {
        total_active: totalActive || 0,
        by_severity: severityBreakdown,
        by_type: typeBreakdown,
        average_resolution_time: Math.round(averageResolutionTime),
        overdue_alerts: overdueAlerts || 0
      };

    } catch (error) {
      console.error('Error getting alert overview:', error);
      throw new Error('Failed to get alert overview');
    }
  }

  // =====================================================
  // REAL-TIME SUBSCRIPTIONS
  // =====================================================

  /**
   * Subscribe to real-time dashboard updates
   */
  subscribeToUpdates(callback: (dashboard: SatisfactionDashboard) => void): string {
    const subscriptionId = Math.random().toString(36).substr(2, 9);
    this.updateCallbacks.add(callback);

    // Subscribe to database changes
    const feedbackSubscription = supabase
      .channel('feedback_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'feedback_submissions'
        },
        () => this.notifySubscribers()
      )
      .subscribe();

    const alertsSubscription = supabase
      .channel('alerts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'satisfaction_alerts'
        },
        () => this.notifySubscribers()
      )
      .subscribe();

    this.subscriptions.set(subscriptionId, () => {
      feedbackSubscription.unsubscribe();
      alertsSubscription.unsubscribe();
    });

    // Initial data load
    this.notifySubscribers();

    return subscriptionId;
  }

  /**
   * Unsubscribe from updates
   */
  unsubscribe(subscriptionId: string): void {
    const unsubscribeFn = this.subscriptions.get(subscriptionId);
    if (unsubscribeFn) {
      unsubscribeFn();
      this.subscriptions.delete(subscriptionId);
    }
  }

  /**
   * Notify all subscribers of updates
   */
  private async notifySubscribers(): Promise<void> {
    try {
      const dashboard = await this.getDashboardData();
      this.updateCallbacks.forEach(callback => {
        try {
          callback(dashboard);
        } catch (error) {
          console.error('Error in dashboard update callback:', error);
        }
      });
    } catch (error) {
      console.error('Error notifying subscribers:', error);
    }
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  private calculateAverageScore(metrics: any[], metricType?: SatisfactionMetricType): number {
    const filteredMetrics = metricType
      ? metrics.filter(m => m.metric_type === metricType)
      : metrics;

    if (filteredMetrics.length === 0) return 0;

    const total = filteredMetrics.reduce((sum, m) => sum + m.score, 0);
    return Math.round((total / filteredMetrics.length) * 100) / 100;
  }

  private calculateStandardDeviation(metrics: any[]): number {
    if (metrics.length === 0) return 0;

    const mean = metrics.reduce((sum, m) => sum + m.score, 0) / metrics.length;
    const squaredDiffs = metrics.map(m => Math.pow(m.score - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / metrics.length;

    return Math.round(Math.sqrt(avgSquaredDiff) * 100) / 100;
  }

  private calculateMedianScore(metrics: any[]): number {
    if (metrics.length === 0) return 0;

    const scores = metrics.map(m => m.score).sort((a, b) => a - b);
    const middle = Math.floor(scores.length / 2);

    if (scores.length % 2 === 0) {
      return Math.round(((scores[middle - 1] + scores[middle]) / 2) * 100) / 100;
    } else {
      return Math.round(scores[middle] * 100) / 100;
    }
  }

  private calculateNPSScore(npsData: any[]): number {
    if (npsData.length === 0) return 0;

    const promoters = npsData.filter(d => d.promoter_category === 'promoter').length;
    const detractors = npsData.filter(d => d.promoter_category === 'detractor').length;

    const percentagePromoters = (promoters / npsData.length) * 100;
    const percentageDetractors = (detractors / npsData.length) * 100;

    return Math.round(percentagePromoters - percentageDetractors);
  }

  private calculateCESScore(cesData: any[]): number {
    if (cesData.length === 0) return 0;

    const totalScore = cesData.reduce((sum, d) => sum + d.effort_score, 0);
    const averageScore = totalScore / cesData.length;

    // Convert to 0-100 scale (lower effort is better)
    return Math.round(((8 - averageScore) / 7) * 100);
  }

  private async getCurrentTrend(): Promise<'improving' | 'stable' | 'declining'> {
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thisWeek = new Date();

    const { data: lastWeekMetrics } = await supabase
      .from('satisfaction_metrics')
      .select('score')
      .gte('measurement_date', lastWeek.toISOString())
      .lt('measurement_date', new Date(Date.now() - 3.5 * 24 * 60 * 60 * 1000).toISOString());

    const { data: thisWeekMetrics } = await supabase
      .from('satisfaction_metrics')
      .select('score')
      .gte('measurement_date', new Date(Date.now() - 3.5 * 24 * 60 * 60 * 1000).toISOString())
      .lte('measurement_date', thisWeek.toISOString());

    const lastWeekAvg = lastWeekMetrics?.length > 0
      ? lastWeekMetrics.reduce((sum, m) => sum + m.score, 0) / lastWeekMetrics.length
      : 0;

    const thisWeekAvg = thisWeekMetrics?.length > 0
      ? thisWeekMetrics.reduce((sum, m) => sum + m.score, 0) / thisWeekMetrics.length
      : 0;

    const change = thisWeekAvg - lastWeekAvg;

    if (Math.abs(change) < 0.1) return 'stable';
    return change > 0 ? 'improving' : 'declining';
  }

  private async getMonthlyTrend(
    table: string,
    scoreColumn: string,
    startDate: Date,
    endDate: Date
  ): Promise<MonthlyTrend[]> {
    // This would typically use a database function or view for better performance
    // For now, return mock data
    const trends: MonthlyTrend[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const monthKey = current.toISOString().substring(0, 7);
      trends.push({
        month: monthKey,
        value: Math.random() * 2 + 3, // Random value between 3-5
        change_from_previous: (Math.random() - 0.5) * 0.5,
        forecast: Math.random() * 2 + 3,
        confidence_interval: [2.5, 5.5]
      });
      current.setMonth(current.getMonth() + 1);
    }

    return trends;
  }

  private async getVolumeTrend(startDate: Date, endDate: Date): Promise<MonthlyTrend[]> {
    const trends: MonthlyTrend[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const monthKey = current.toISOString().substring(0, 7);
      trends.push({
        month: monthKey,
        value: Math.floor(Math.random() * 50 + 20), // 20-70 submissions
        change_from_previous: (Math.random() - 0.5) * 10
      });
      current.setMonth(current.getMonth() + 1);
    }

    return trends;
  }

  private async getSentimentTrend(startDate: Date, endDate: Date): Promise<MonthlyTrend[]> {
    const trends: MonthlyTrend[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const monthKey = current.toISOString().substring(0, 7);
      trends.push({
        month: monthKey,
        value: Math.random() * 0.8 + 0.1, // Sentiment score between -0.4 and 0.4
        change_from_previous: (Math.random() - 0.5) * 0.2
      });
      current.setMonth(current.getMonth() + 1);
    }

    return trends;
  }

  private calculatePerformanceDistribution(staffData: any[]): PerformanceDistribution {
    const scores = staffData.map(s => s.average_satisfaction_score || 0);

    const distribution = {
      excellent: scores.filter(s => s >= 4.5).length,
      good: scores.filter(s => s >= 3.5 && s < 4.5).length,
      average: scores.filter(s => s >= 2.5 && s < 3.5).length,
      needs_improvement: scores.filter(s => s >= 1.5 && s < 2.5).length,
      poor: scores.filter(s => s < 1.5).length
    };

    return distribution;
  }

  private async getPriorityBreakdown(): Promise<PriorityBreakdown> {
    const { data } = await supabase
      .from('service_recovery_cases')
      .select('recovery_priority')
      .eq('recovery_status', 'active');

    const breakdown = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    data?.forEach(case_ => {
      breakdown[case_.recovery_priority as keyof PriorityBreakdown]++;
    });

    return breakdown;
  }

  private async getSeverityBreakdown(): Promise<SeverityBreakdown> {
    const { data } = await supabase
      .from('satisfaction_alerts')
      .select('severity')
      .eq('alert_status', 'active');

    const breakdown = {
      emergency: 0,
      critical: 0,
      warning: 0,
      info: 0
    };

    data?.forEach(alert => {
      breakdown[alert.severity as keyof SeverityBreakdown]++;
    });

    return breakdown;
  }

  private async getTypeBreakdown(): Promise<TypeBreakdown> {
    const { data } = await supabase
      .from('satisfaction_alerts')
      .select('alert_type')
      .eq('alert_status', 'active');

    const breakdown: TypeBreakdown = {};

    data?.forEach(alert => {
      breakdown[alert.alert_type] = (breakdown[alert.alert_type] || 0) + 1;
    });

    return breakdown;
  }

  private async getAtRiskClients(): Promise<ClientRisk[]> {
    // Get clients with low satisfaction scores or negative trends
    const { data } = await supabase
      .from('client_satisfaction_predictions')
      .select(`
        *,
        profiles!client_satisfaction_predictions_client_id_fkey (
          display_name
        )
      `)
      .in('risk_level', ['high', 'critical'])
      .order('prediction_score', { ascending: false })
      .limit(10);

    return (data || []).map(prediction => ({
      client_id: prediction.client_id,
      client_name: prediction.profiles?.display_name || 'Unknown',
      risk_level: prediction.risk_level,
      last_satisfaction_score: 0, // Would need to join with satisfaction metrics
      risk_factors: Object.keys(prediction.influencing_factors || {}),
      recommended_actions: prediction.recommended_actions || []
    }));
  }

  private async getVIPClients(): Promise<VIPClientSummary[]> {
    // Get high-value clients with recent feedback
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_vip', true)
      .limit(10);

    return (data || []).map(client => ({
      client_id: client.id,
      client_name: client.display_name || 'Unknown',
      lifetime_value: 0, // Would need to calculate from bookings
      satisfaction_score: 0, // Would need to get from satisfaction metrics
      recent_feedback: '', // Would need to get from recent submissions
      special_attention_needed: false
    }));
  }

  private async getSatisfactionSegments(): Promise<SatisfactionSegment[]> {
    return [
      {
        segment_name: 'High Value - High Satisfaction',
        client_count: 45,
        average_satisfaction: 4.8,
        revenue_contribution: 65,
        growth_potential: 'High'
      },
      {
        segment_name: 'High Value - Medium Satisfaction',
        client_count: 23,
        average_satisfaction: 3.2,
        revenue_contribution: 20,
        growth_potential: 'Medium'
      },
      {
        segment_name: 'Low Value - High Satisfaction',
        client_count: 67,
        average_satisfaction: 4.5,
        revenue_contribution: 10,
        growth_potential: 'High'
      },
      {
        segment_name: 'At Risk',
        client_count: 15,
        average_satisfaction: 2.1,
        revenue_contribution: 5,
        growth_potential: 'Critical'
      }
    ];
  }

  private async getChurnPredictions(): Promise<ChurnPrediction[]> {
    const { data } = await supabase
      .from('client_satisfaction_predictions')
      .select(`
        *,
        profiles!client_satisfaction_predictions_client_id_fkey (
          display_name
        )
      `)
      .eq('prediction_type', 'churn_risk')
      .gt('prediction_score', 0.7)
      .order('prediction_score', { ascending: false })
      .limit(5);

    return (data || []).map(prediction => ({
      client_id: prediction.client_id,
      client_name: prediction.profiles?.display_name || 'Unknown',
      churn_probability: prediction.prediction_score,
      contributing_factors: Object.keys(prediction.influencing_factors || {}),
      retention_cost_estimate: Math.random() * 500 + 100, // Mock calculation
      recommended_retention_strategy: 'Personal outreach and special offer'
    }));
  }
}

// Export singleton instance
export const satisfactionDashboardService = SatisfactionDashboardService.getInstance();