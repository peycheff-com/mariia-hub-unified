// Real-Time Support Analytics Service
import { supabase } from '@/integrations/supabase/client';
import {
  SupportTicket,
  SupportDashboardMetrics,
  AgentPerformanceDashboard,
  SupportAnalyticsFilter,
  SupportQueueMetrics,
  SupportRealtimeUpdate,
  TimeSeriesData,
  ComparisonData,
  SupportAlert,
  CustomerSatisfactionAnalytics,
  OperationalIntelligence,
  VIPAnalytics,
  SupportAnalyticsResponse
} from '@/types/support-analytics';

class SupportAnalyticsService {
  private subscriptionCallbacks: Map<string, (payload: any) => void> = new Map();
  private cache: Map<string, { data: any; expiresAt: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.initializeRealtimeSubscriptions();
  }

  // Real-time subscription management
  private initializeRealtimeSubscriptions() {
    const channel = supabase
      .channel('support-analytics')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_tickets'
        },
        (payload) => this.handleTicketUpdate(payload)
      )
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_interactions'
        },
        (payload) => this.handleInteractionUpdate(payload)
      )
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_queue_metrics'
        },
        (payload) => this.handleQueueMetricsUpdate(payload)
      )
      .subscribe();

    return channel;
  }

  private handleTicketUpdate(payload: any) {
    const update: SupportRealtimeUpdate = {
      type: 'ticket_updated',
      data: payload.new,
      timestamp: new Date().toISOString()
    };

    this.broadcastUpdate('tickets', update);
    this.invalidateCache('dashboard-metrics');
    this.invalidateCache('queue-metrics');
  }

  private handleInteractionUpdate(payload: any) {
    const update: SupportRealtimeUpdate = {
      type: 'new_message',
      data: payload.new,
      timestamp: new Date().toISOString()
    };

    this.broadcastUpdate('interactions', update);
  }

  private handleQueueMetricsUpdate(payload: any) {
    const update: SupportRealtimeUpdate = {
      type: 'queue_metrics_update',
      data: payload.new,
      timestamp: new Date().toISOString()
    };

    this.broadcastUpdate('queue', update);
    this.invalidateCache('queue-metrics');
  }

  // Dashboard Metrics
  async getDashboardMetrics(filter?: SupportAnalyticsFilter): Promise<SupportDashboardMetrics> {
    const cacheKey = `dashboard-metrics-${JSON.stringify(filter)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const { data: metrics, error } = await supabase.rpc('get_support_metrics', {
      date_start: filter?.date_range?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      date_end: filter?.date_range?.end || new Date().toISOString().split('T')[0]
    });

    if (error) throw error;

    const dashboardMetrics: SupportDashboardMetrics = {
      ...metrics,
      trend_data: await this.getTrendData(filter)
    };

    this.setCache(cacheKey, dashboardMetrics);
    return dashboardMetrics;
  }

  // Agent Performance Dashboard
  async getAgentPerformance(agentId: string, filter?: SupportAnalyticsFilter): Promise<AgentPerformanceDashboard> {
    const cacheKey = `agent-performance-${agentId}-${JSON.stringify(filter)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    // Get agent basic info and current metrics
    const { data: agent } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, avatar_url')
      .eq('id', agentId)
      .single();

    const { data: metrics } = await supabase.rpc('get_agent_performance_metrics', {
      agent_id_param: agentId,
      date_start: filter?.date_range?.start || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      date_end: filter?.date_range?.end || new Date().toISOString().split('T')[0]
    });

    // Get active tickets for this agent
    const { data: activeTickets } = await supabase
      .from('support_tickets')
      .select(`
        id, ticket_number, subject, priority, created_at,
        status, customer_id:profiles(first_name, last_name)
      `)
      .eq('agent_id', agentId)
      .in('status', ['open', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(5);

    // Get weekly performance data
    const weeklyPerformance = await this.getAgentWeeklyPerformance(agentId);

    const agentDashboard: AgentPerformanceDashboard = {
      agent_id: agentId,
      agent_name: `${agent?.first_name} ${agent?.last_name}` || 'Unknown Agent',
      agent_avatar: agent?.avatar_url,
      current_status: await this.getAgentCurrentStatus(agentId),
      tickets_handled_today: metrics?.tickets_handled || 0,
      tickets_resolved_today: metrics?.tickets_resolved || 0,
      avg_response_time_current: metrics?.avg_first_response_time || 0,
      current_satisfaction_score: metrics?.customer_satisfaction_avg || 0,
      tickets_in_queue: activeTickets?.length || 0,
      active_tickets: activeTickets?.map(ticket => ({
        id: ticket.id,
        ticket_number: ticket.ticket_number,
        subject: ticket.subject,
        priority: ticket.priority,
        wait_time: Math.floor((Date.now() - new Date(ticket.created_at).getTime()) / 1000 / 60) // minutes
      })) || [],
      performance_metrics: {
        tickets_per_hour: metrics?.tickets_per_hour || 0,
        utilization_rate: metrics?.utilization_rate || 0,
        quality_score: metrics?.quality_score || 0,
        adherence_percentage: metrics?.adherence_percentage || 0
      },
      weekly_performance: weeklyPerformance
    };

    this.setCache(cacheKey, agentDashboard);
    return agentDashboard;
  }

  // Customer Satisfaction Analytics
  async getSatisfactionAnalytics(filter?: SupportAnalyticsFilter): Promise<CustomerSatisfactionAnalytics> {
    const cacheKey = `satisfaction-analytics-${JSON.stringify(filter)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const { data: satisfactionData } = await supabase.rpc('get_satisfaction_trends', {
      days_back: this.calculateDaysBack(filter)
    });

    const satisfactionByChannel = await this.getSatisfactionByDimension('channel', filter);
    const satisfactionByCategory = await this.getSatisfactionByDimension('category', filter);
    const satisfactionByPriority = await this.getSatisfactionByDimension('priority', filter);

    const driverAnalysis = await this.analyzeSatisfactionDrivers(filter);
    const topIssues = await this.identifyTopSatisfactionIssues(filter);

    const analytics: CustomerSatisfactionAnalytics = {
      current_csat: satisfactionData?.latest_score || 0,
      current_nps: await this.getCurrentNPSScore(filter),
      current_ces: await this.getCurrentCESScore(filter),
      satisfaction_trend: satisfactionData?.daily_scores || [],
      satisfaction_by_channel: satisfactionByChannel,
      satisfaction_by_category: satisfactionByCategory,
      satisfaction_by_priority: satisfactionByPriority,
      driver_analysis: driverAnalysis,
      top_issues: topIssues
    };

    this.setCache(cacheKey, analytics);
    return analytics;
  }

  // Operational Intelligence
  async getOperationalIntelligence(filter?: SupportAnalyticsFilter): Promise<OperationalIntelligence> {
    const cacheKey = `operational-intelligence-${JSON.stringify(filter)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const currentVolume = await this.getCurrentTicketVolume(filter);
    const predictedVolume = await this.getPredictedVolume();
    const staffingRecommendations = await this.getStaffingRecommendations(filter);
    const capacityUtilization = await this.getCapacityUtilization(filter);
    const skillGapAnalysis = await this.getSkillGapAnalysis(filter);
    const automationOpportunities = await this.getAutomationOpportunities(filter);

    const intelligence: OperationalIntelligence = {
      current_volume: currentVolume,
      predicted_volume: predictedVolume,
      staffing_recommendations: staffingRecommendations,
      capacity_utilization: capacityUtilization,
      skill_gap_analysis: skillGapAnalysis,
      automation_opportunities: automationOpportunities
    };

    this.setCache(cacheKey, intelligence);
    return intelligence;
  }

  // VIP Analytics
  async getVIPAnalytics(filter?: SupportAnalyticsFilter): Promise<VIPAnalytics> {
    const cacheKey = `vip-analytics-${JSON.stringify(filter)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const { data: vipData } = await supabase
      .from('support_vip_tracking')
      .select('*')
      .order('vip_level', { ascending: false });

    const vipDistribution = this.calculateVIPDistribution(vipData);
    const vipSatisfaction = await this.getVIPSatisfaction(filter);
    const vipRetentionRate = await this.calculateVIPRetentionRate(filter);
    const vipSupportMetrics = await this.getVIPSupportMetrics(filter);
    const vipTierPerformance = await this.getVIPTierPerformance(filter);
    const highValueInsights = await this.getHighValueInsights(filter);

    const analytics: VIPAnalytics = {
      total_vip_customers: vipData?.length || 0,
      vip_distribution: vipDistribution,
      vip_satisfaction: vipSatisfaction,
      vip_retention_rate: vipRetentionRate,
      vip_support_metrics: vipSupportMetrics,
      vip_tier_performance: vipTierPerformance,
      high_value_insights: highValueInsights
    };

    this.setCache(cacheKey, analytics);
    return analytics;
  }

  // Queue Metrics
  async getQueueMetrics(queueName?: string): Promise<SupportQueueMetrics[]> {
    const cacheKey = `queue-metrics-${queueName || 'all'}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    let query = supabase
      .from('support_queue_metrics')
      .select('*')
      .order('measurement_timestamp', { ascending: false })
      .limit(100);

    if (queueName) {
      query = query.eq('queue_name', queueName);
    }

    const { data, error } = await query;
    if (error) throw error;

    this.setCache(cacheKey, data);
    return data;
  }

  // Alert Management
  async getActiveAlerts(severity?: string): Promise<SupportAlert[]> {
    const { data, error } = await supabase
      .from('support_alerts')
      .select('*')
      .eq('is_resolved', false)
      .eq('is_acknowledged', false)
      .order('severity', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (severity) {
      return data.filter(alert => alert.severity === severity);
    }

    return data;
  }

  async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('support_alerts')
      .update({
        is_acknowledged: true,
        acknowledged_by: userId,
        acknowledged_at: new Date().toISOString()
      })
      .eq('id', alertId);

    if (error) throw error;
  }

  async resolveAlert(alertId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('support_alerts')
      .update({
        is_resolved: true,
        resolved_by: userId,
        resolved_at: new Date().toISOString()
      })
      .eq('id', alertId);

    if (error) throw error;
  }

  // Real-time subscription methods
  subscribeToUpdates(callback: (update: SupportRealtimeUpdate) => void): () => void {
    const id = Math.random().toString(36);
    this.subscriptionCallbacks.set(id, callback);

    return () => {
      this.subscriptionCallbacks.delete(id);
    };
  }

  private broadcastUpdate(channel: string, update: SupportRealtimeUpdate) {
    this.subscriptionCallbacks.forEach(callback => {
      try {
        callback(update);
      } catch (error) {
        console.error('Error in subscription callback:', error);
      }
    });
  }

  // Cache management
  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache<T>(key: string, data: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.CACHE_TTL);
    this.cache.set(key, { data, expiresAt });
  }

  private invalidateCache(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  // Helper methods
  private async getTrendData(filter?: SupportAnalyticsFilter): Promise<TimeSeriesData[]> {
    const days = this.calculateDaysBack(filter);
    const { data } = await supabase
      .from('support_analytics_snapshots')
      .select('snapshot_date, total_tickets, customer_satisfaction_avg, first_response_time_avg')
      .gte('snapshot_date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('snapshot_date', { ascending: true });

    return data?.map(item => ({
      timestamp: item.snapshot_date,
      value: item.total_tickets,
      metadata: {
        satisfaction: item.customer_satisfaction_avg,
        response_time: item.first_response_time_avg
      }
    })) || [];
  }

  private async getAgentCurrentStatus(agentId: string): Promise<'online' | 'offline' | 'busy' | 'away'> {
    // This would typically integrate with a presence system
    // For now, return a simple implementation
    return 'online';
  }

  private async getAgentWeeklyPerformance(agentId: string): Promise<Array<{date: string; tickets_handled: number; satisfaction: number; response_time: number}>> {
    const { data } = await supabase
      .from('support_agent_metrics')
      .select('measurement_date, tickets_handled, customer_satisfaction_avg, first_response_time_seconds')
      .eq('agent_id', agentId)
      .gte('measurement_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('measurement_date', { ascending: true });

    return data?.map(item => ({
      date: item.measurement_date,
      tickets_handled: item.tickets_handled,
      satisfaction: item.customer_satisfaction_avg,
      response_time: item.first_response_time_seconds / 60 // convert to minutes
    })) || [];
  }

  private async getSatisfactionByDimension(dimension: string, filter?: SupportAnalyticsFilter): Promise<Record<string, number>> {
    let query = supabase
      .from('support_tickets')
      .select(`${dimension}, customer_satisfaction_rating`)
      .not('customer_satisfaction_rating', 'is', null);

    if (filter?.date_range) {
      query = query
        .gte('created_at', filter.date_range.start)
        .lte('created_at', filter.date_range.end);
    }

    const { data } = await query;

    const result: Record<string, number> = {};
    data?.forEach(item => {
      const key = item[dimension];
      if (key && item.customer_satisfaction_rating) {
        if (!result[key]) {
          result[key] = [];
        }
        result[key].push(item.customer_satisfaction_rating);
      }
    });

    // Calculate averages
    Object.keys(result).forEach(key => {
      const values = result[key];
      result[key] = values.reduce((sum: number, val: number) => sum + val, 0) / values.length;
    });

    return result;
  }

  private async analyzeSatisfactionDrivers(filter?: SupportAnalyticsFilter): Promise<Array<{factor: string; impact: number; correlation: number}>> {
    // This would typically use machine learning or statistical analysis
    // For now, return mock data
    return [
      { factor: 'Response Time', impact: 0.8, correlation: -0.65 },
      { factor: 'First Contact Resolution', impact: 0.7, correlation: 0.72 },
      { factor: 'Agent Empathy', impact: 0.6, correlation: 0.68 },
      { factor: 'Resolution Quality', impact: 0.9, correlation: 0.81 }
    ];
  }

  private async identifyTopSatisfactionIssues(filter?: SupportAnalyticsFilter): Promise<Array<{category: string; frequency: number; avg_satisfaction: number; trend: 'improving' | 'declining' | 'stable'}>> {
    const { data } = await supabase
      .from('support_tickets')
      .select(`
        category_id,
        customer_satisfaction_rating,
        created_at,
        support_categories(name)
      `)
      .not('customer_satisfaction_rating', 'is', null)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    const grouped: Record<string, {ratings: number[], dates: string[]}> = {};

    data?.forEach(ticket => {
      const categoryName = ticket.support_categories?.name || 'Unknown';
      if (!grouped[categoryName]) {
        grouped[categoryName] = { ratings: [], dates: [] };
      }
      grouped[categoryName].ratings.push(ticket.customer_satisfaction_rating);
      grouped[categoryName].dates.push(ticket.created_at);
    });

    return Object.entries(grouped).map(([category, data]) => ({
      category,
      frequency: data.ratings.length,
      avg_satisfaction: data.ratings.reduce((sum, val) => sum + val, 0) / data.ratings.length,
      trend: this.calculateTrend(data.ratings, data.dates)
    })).sort((a, b) => b.frequency - a.frequency).slice(0, 5);
  }

  private calculateTrend(ratings: number[], dates: string[]): 'improving' | 'declining' | 'stable' {
    if (ratings.length < 2) return 'stable';

    const midpoint = Math.floor(ratings.length / 2);
    const firstHalf = ratings.slice(0, midpoint);
    const secondHalf = ratings.slice(midpoint);

    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

    const diff = secondAvg - firstAvg;
    if (diff > 0.3) return 'improving';
    if (diff < -0.3) return 'declining';
    return 'stable';
  }

  private calculateDaysBack(filter?: SupportAnalyticsFilter): number {
    if (!filter?.date_range?.start) return 30;
    const start = new Date(filter.date_range.start);
    const now = new Date();
    return Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }

  private async getCurrentNPSScore(filter?: SupportAnalyticsFilter): Promise<number> {
    const { data } = await supabase
      .from('support_tickets')
      .select('nps_score')
      .not('nps_score', 'is', null);

    if (!data || data.length === 0) return 0;

    const scores = data.map(t => t.nps_score);
    const promoters = scores.filter(s => s >= 70).length;
    const detractors = scores.filter(s => s <= 30).length;

    return ((promoters - detractors) / scores.length) * 100;
  }

  private async getCurrentCESScore(filter?: SupportAnalyticsFilter): Promise<number> {
    const { data } = await supabase
      .from('support_tickets')
      .select('customer_effort_score')
      .not('customer_effort_score', 'is', null);

    if (!data || data.length === 0) return 0;

    const scores = data.map(t => t.customer_effort_score);
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  private async getCurrentTicketVolume(filter?: SupportAnalyticsFilter): Promise<number> {
    const { data } = await supabase
      .from('support_tickets')
      .select('id')
      .eq('status', 'open');

    return data?.length || 0;
  }

  private async getPredictedVolume(): Promise<Array<{date: string; predicted: number; confidence: number}>> {
    const { data } = await supabase.rpc('predict_ticket_volume', { days_forward: 7 });
    return data || [];
  }

  private async getStaffingRecommendations(filter?: SupportAnalyticsFilter): Promise<Array<{time_period: string; recommended_agents: number; current_agents: number; volume_prediction: number}>> {
    // This would typically use a staffing algorithm
    // For now, return basic recommendations
    return [
      { time_period: 'Morning (6AM-12PM)', recommended_agents: 3, current_agents: 2, volume_prediction: 15 },
      { time_period: 'Afternoon (12PM-6PM)', recommended_agents: 5, current_agents: 4, volume_prediction: 25 },
      { time_period: 'Evening (6PM-12AM)', recommended_agents: 2, current_agents: 3, volume_prediction: 8 }
    ];
  }

  private async getCapacityUtilization(filter?: SupportAnalyticsFilter): Promise<any> {
    return {
      current_utilization: 0.75,
      optimal_utilization: 0.85,
      overstaffed_periods: ['2024-01-15 22:00', '2024-01-16 06:00'],
      understaffed_periods: ['2024-01-15 14:00', '2024-01-16 10:00']
    };
  }

  private async getSkillGapAnalysis(filter?: SupportAnalyticsFilter): Promise<Array<{skill: string; required_level: number; current_average: number; gap: number; recommended_training: string[]}>> {
    return [
      {
        skill: 'Technical Knowledge',
        required_level: 8,
        current_average: 6.5,
        gap: 1.5,
        recommended_training: ['Advanced System Training', 'Product Knowledge Workshop']
      },
      {
        skill: 'Communication Skills',
        required_level: 9,
        current_average: 8.2,
        gap: 0.8,
        recommended_training: ['Customer Communication Excellence']
      }
    ];
  }

  private async getAutomationOpportunities(filter?: SupportAnalyticsFilter): Promise<Array<{process: string; current_manual_time: number; potential_automation_time: number; roi_estimate: number; implementation_complexity: 'low' | 'medium' | 'high'}>> {
    return [
      {
        process: 'Ticket Categorization',
        current_manual_time: 5,
        potential_automation_time: 1,
        roi_estimate: 0.8,
        implementation_complexity: 'medium'
      },
      {
        process: 'Response Suggestions',
        current_manual_time: 8,
        potential_automation_time: 2,
        roi_estimate: 0.75,
        implementation_complexity: 'high'
      }
    ];
  }

  private calculateVIPDistribution(vipData: any[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    vipData?.forEach(vip => {
      distribution[vip.vip_level] = (distribution[vip.vip_level] || 0) + 1;
    });
    return distribution;
  }

  private async getVIPSatisfaction(filter?: SupportAnalyticsFilter): Promise<Record<string, number>> {
    const { data } = await supabase
      .from('support_tickets')
      .select(`
        customer_satisfaction_rating,
        support_vip_tracking(vip_level)
      `)
      .not('customer_satisfaction_rating', 'is', null)
      .not('support_vip_tracking', 'is', null);

    const satisfaction: Record<string, number> = {};

    data?.forEach(ticket => {
      const vipLevel = ticket.support_vip_tracking?.vip_level;
      if (vipLevel && ticket.customer_satisfaction_rating) {
        if (!satisfaction[vipLevel]) {
          satisfaction[vipLevel] = [];
        }
        satisfaction[vipLevel].push(ticket.customer_satisfaction_rating);
      }
    });

    // Calculate averages
    Object.keys(satisfaction).forEach(level => {
      const ratings = satisfaction[level];
      satisfaction[level] = ratings.reduce((sum: number, val: number) => sum + val, 0) / ratings.length;
    });

    return satisfaction;
  }

  private async calculateVIPRetentionRate(filter?: SupportAnalyticsFilter): Promise<number> {
    // This would typically analyze VIP customer retention over time
    // For now, return a mock value
    return 0.92;
  }

  private async getVIPSupportMetrics(filter?: SupportAnalyticsFilter): Promise<any> {
    return {
      avg_response_time: 15, // minutes
      dedicated_agent_performance: 4.7,
      white_glove_service_usage: 0.85,
      personalized_follow_up_rate: 0.92
    };
  }

  private async getVIPTierPerformance(filter?: SupportAnalyticsFilter): Promise<Array<{tier: string; customer_count: number; avg_satisfaction: number; revenue_impact: number; support_cost: number; retention_rate: number}>> {
    return [
      { tier: 'diamond', customer_count: 5, avg_satisfaction: 4.9, revenue_impact: 25000, support_cost: 5000, retention_rate: 0.98 },
      { tier: 'platinum', customer_count: 15, avg_satisfaction: 4.7, revenue_impact: 45000, support_cost: 8000, retention_rate: 0.95 },
      { tier: 'gold', customer_count: 30, avg_satisfaction: 4.5, revenue_impact: 60000, support_cost: 9000, retention_rate: 0.90 }
    ];
  }

  private async getHighValueInsights(filter?: SupportAnalyticsFilter): Promise<Array<{customer_id: string; customer_name: string; tier: string; recent_issues: string[]; satisfaction_trend: 'improving' | 'declining' | 'stable'; recommended_actions: string[]}>> {
    // This would typically analyze VIP customer behavior and provide insights
    return [
      {
        customer_id: '123',
        customer_name: 'Anna Kowalska',
        tier: 'diamond',
        recent_issues: ['Booking system error', 'Payment processing issue'],
        satisfaction_trend: 'declining',
        recommended_actions: ['Personal follow-up call', 'Service credit', 'Dedicated agent assignment']
      }
    ];
  }
}

// Export singleton instance
export const supportAnalyticsService = new SupportAnalyticsService();
export default supportAnalyticsService;