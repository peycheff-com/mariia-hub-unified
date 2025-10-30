import { supabase } from '@/integrations/supabase/client-optimized';
import { SupportTicket, SupportChatSession, KnowledgeBaseArticle } from '@/types/support-automation';
import { Profile } from '@/types/supabase';

// ========================================
// TYPES AND INTERFACES
// ========================================

export interface SupportMetrics {
  id: string;
  metric_date: string;
  metric_hour: number;
  total_tickets: number;
  new_tickets: number;
  resolved_tickets: number;
  open_tickets: number;
  escalated_tickets: number;
  avg_first_response_time: number;
  avg_resolution_time: number;
  median_response_time: number;
  p95_response_time: number;
  first_contact_resolution_rate: number;
  customer_satisfaction_score: number;
  net_promoter_score: number;
  active_agents: number;
  agent_utilization_rate: number;
  email_tickets: number;
  chat_tickets: number;
  phone_tickets: number;
  social_tickets: number;
  urgent_tickets: number;
  high_priority_tickets: number;
  normal_priority_tickets: number;
  low_priority_tickets: number;
  sla_compliance_rate: number;
  sla_breaches: number;
  created_at: string;
  updated_at: string;
}

export interface AgentPerformance {
  id: string;
  agent_id: string;
  performance_date: string;
  tickets_handled: number;
  tickets_resolved: number;
  avg_handling_time: number;
  first_contact_resolutions: number;
  customer_satisfaction_avg: number;
  quality_score: number;
  available_time_minutes: number;
  talk_time_minutes: number;
  after_call_work_minutes: number;
  break_time_minutes: number;
  response_rate: number;
  resolution_rate: number;
  escalation_rate: number;
  created_at: string;
  updated_at: string;
}

export interface CustomerSatisfactionMetrics {
  id: string;
  ticket_id?: string;
  customer_id?: string;
  csat_score: number;
  nps_score: number;
  effort_score: number;
  feedback_text?: string;
  feedback_categories: string[];
  sentiment_score: number;
  support_channel: string;
  interaction_type: string;
  agent_id?: string;
  created_at: string;
}

export interface ChannelEffectiveness {
  id: string;
  channel: string;
  analytics_date: string;
  total_conversations: number;
  successful_conversations: number;
  avg_response_time: number;
  resolution_rate: number;
  customer_satisfaction: number;
  cost_per_interaction: number;
  agent_time_spent_minutes: number;
  first_contact_resolution_rate: number;
  escalation_rate: number;
  created_at: string;
  updated_at: string;
}

export interface PerformanceAlert {
  id: string;
  alert_type: string;
  alert_severity: 'low' | 'medium' | 'high' | 'critical';
  alert_title: string;
  alert_description?: string;
  current_value: number;
  threshold_value: number;
  variance_percentage: number;
  affected_agents: string[];
  affected_time_period: string;
  metric_category: string;
  alert_status: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
  assigned_to?: string;
  resolution_notes?: string;
  created_at: string;
  acknowledged_at?: string;
  resolved_at?: string;
}

export interface VolumeForecast {
  id: string;
  forecast_date: string;
  forecast_horizon_days: number;
  forecast_model: string;
  predicted_ticket_volume: number;
  confidence_interval_lower: number;
  confidence_interval_upper: number;
  seasonality_factor: number;
  trend_factor: number;
  day_of_week_factor: number;
  actual_volume?: number;
  forecast_error?: number;
  mean_absolute_percentage_error?: number;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeBaseAnalytics {
  id: string;
  article_id: string;
  analytics_date: string;
  views: number;
  unique_views: number;
  helpful_votes: number;
  not_helpful_votes: number;
  shares: number;
  downloads: number;
  search_impressions: number;
  click_through_rate: number;
  avg_position: number;
  resolved_issues: number;
  resolution_rate: number;
  created_at: string;
  updated_at: string;
}

export interface ChatPerformanceAnalytics {
  id: string;
  chat_session_id: string;
  session_duration_minutes?: number;
  first_response_time_seconds?: number;
  avg_response_time_seconds?: number;
  wait_time_seconds?: number;
  messages_exchanged?: number;
  customer_messages?: number;
  agent_messages?: number;
  resolved: boolean;
  resolution_time_minutes?: number;
  escalation_required: boolean;
  session_rating?: number;
  customer_effort_score?: number;
  agent_id?: string;
  concurrent_chats: number;
  created_at: string;
}

export interface AnalyticsFilters {
  dateRange: {
    start: Date;
    end: Date;
  };
  channels?: string[];
  agents?: string[];
  categories?: string[];
  priorities?: string[];
  satisfactionRange?: {
    min: number;
    max: number;
  };
}

export interface AnalyticsMetrics {
  totalTickets: number;
  resolvedTickets: number;
  avgResponseTime: number;
  avgResolutionTime: number;
  satisfactionScore: number;
  slaComplianceRate: number;
  agentUtilizationRate: number;
  firstContactResolutionRate: number;
  escalationRate: number;
}

export interface TrendData {
  date: string;
  value: number;
  label: string;
}

// ========================================
// CORE ANALYTICS SERVICE
// ========================================

class SupportAnalyticsServiceEnhanced {
  private static instance: SupportAnalyticsServiceEnhanced;

  static getInstance(): SupportAnalyticsServiceEnhanced {
    if (!SupportAnalyticsServiceEnhanced.instance) {
      SupportAnalyticsServiceEnhanced.instance = new SupportAnalyticsServiceEnhanced();
    }
    return SupportAnalyticsServiceEnhanced.instance;
  }

  // ========================================
  // REAL-TIME METRICS COLLECTION
  // ========================================

  /**
   * Collect real-time support metrics for the current hour
   */
  async collectHourlyMetrics(): Promise<SupportMetrics | null> {
    try {
      const now = new Date();
      const currentHour = now.getHours();
      const currentDate = now.toISOString().split('T')[0];

      // Get ticket metrics for the current hour
      const { data: tickets, error: ticketsError } = await supabase
        .from('support_tickets')
        .select('*')
        .gte('created_at', new Date(now.getFullYear(), now.getMonth(), now.getDate(), currentHour, 0, 0).toISOString())
        .lt('created_at', new Date(now.getFullYear(), now.getMonth(), now.getDate(), currentHour + 1, 0, 0).toISOString());

      if (ticketsError) throw ticketsError;

      // Get resolved tickets for the current hour
      const { data: resolvedTickets, error: resolvedError } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('status', 'resolved')
        .gte('resolved_at', new Date(now.getFullYear(), now.getMonth(), now.getDate(), currentHour, 0, 0).toISOString())
        .lt('resolved_at', new Date(now.getFullYear(), now.getMonth(), now.getDate(), currentHour + 1, 0, 0).toISOString());

      if (resolvedError) throw resolvedError;

      // Get active agents
      const { data: activeAgents, error: agentsError } = await supabase
        .from('profiles')
        .select('id')
        .eq('is_active', true)
        .in('role', ['agent', 'manager', 'admin']);

      if (agentsError) throw agentsError;

      // Calculate metrics
      const totalTickets = tickets?.length || 0;
      const resolvedTicketsCount = resolvedTickets?.length || 0;
      const openTickets = tickets?.filter(t => t.status !== 'resolved').length || 0;
      const escalatedTickets = tickets?.filter(t => t.escalation_level > 0).length || 0;

      // Calculate response times
      const responseTimes = resolvedTickets
        ?.filter(t => t.first_response_at)
        .map(t => {
          const created = new Date(t.created_at);
          const firstResponse = new Date(t.first_response_at!);
          return (firstResponse.getTime() - created.getTime()) / (1000 * 60); // minutes
        }) || [];

      const avgResponseTime = responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;

      const sortedResponseTimes = responseTimes.sort((a, b) => a - b);
      const medianResponseTime = sortedResponseTimes.length > 0
        ? sortedResponseTimes[Math.floor(sortedResponseTimes.length / 2)]
        : 0;

      const p95ResponseTime = sortedResponseTimes.length > 0
        ? sortedResponseTimes[Math.floor(sortedResponseTimes.length * 0.95)]
        : 0;

      // Calculate resolution times
      const resolutionTimes = resolvedTickets
        ?.filter(t => t.resolved_at)
        .map(t => {
          const created = new Date(t.created_at);
          const resolved = new Date(t.resolved_at!);
          return (resolved.getTime() - created.getTime()) / (1000 * 60); // minutes
        }) || [];

      const avgResolutionTime = resolutionTimes.length > 0
        ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
        : 0;

      // Get channel breakdown
      const emailTickets = tickets?.filter(t => t.source === 'email').length || 0;
      const chatTickets = tickets?.filter(t => t.source === 'chat').length || 0;
      const phoneTickets = tickets?.filter(t => t.source === 'phone').length || 0;
      const socialTickets = tickets?.filter(t => t.source === 'social').length || 0;

      // Get priority breakdown
      const urgentTickets = tickets?.filter(t => t.priority === 'urgent').length || 0;
      const highPriorityTickets = tickets?.filter(t => t.priority === 'high').length || 0;
      const normalPriorityTickets = tickets?.filter(t => t.priority === 'normal').length || 0;
      const lowPriorityTickets = tickets?.filter(t => t.priority === 'low').length || 0;

      // Get customer satisfaction for this hour
      const { data: satisfactionData, error: satisfactionError } = await supabase
        .from('customer_satisfaction_metrics')
        .select('csat_score')
        .gte('created_at', new Date(now.getFullYear(), now.getMonth(), now.getDate(), currentHour, 0, 0).toISOString())
        .lt('created_at', new Date(now.getFullYear(), now.getMonth(), now.getDate(), currentHour + 1, 0, 0).toISOString());

      if (satisfactionError) throw satisfactionError;

      const satisfactionScores = satisfactionData?.map(s => s.csat_score) || [];
      const avgSatisfaction = satisfactionScores.length > 0
        ? satisfactionScores.reduce((a, b) => a + b, 0) / satisfactionScores.length
        : 0;

      // Calculate SLA compliance
      const slaBreaches = tickets?.filter(t => {
        if (!t.sla_deadline) return false;
        return new Date(t.created_at) > new Date(t.sla_deadline);
      }).length || 0;

      const slaComplianceRate = totalTickets > 0
        ? ((totalTickets - slaBreaches) / totalTickets) * 100
        : 100;

      const metrics: Partial<SupportMetrics> = {
        metric_date: currentDate,
        metric_hour: currentHour,
        total_tickets: totalTickets,
        new_tickets: totalTickets,
        resolved_tickets: resolvedTicketsCount,
        open_tickets: openTickets,
        escalated_tickets: escalatedTickets,
        avg_first_response_time: Number(avgResponseTime.toFixed(2)),
        avg_resolution_time: Number(avgResolutionTime.toFixed(2)),
        median_response_time: Number(medianResponseTime.toFixed(2)),
        p95_response_time: Number(p95ResponseTime.toFixed(2)),
        customer_satisfaction_score: Number(avgSatisfaction.toFixed(2)),
        active_agents: activeAgents?.length || 0,
        email_tickets: emailTickets,
        chat_tickets: chatTickets,
        phone_tickets: phoneTickets,
        social_tickets: socialTickets,
        urgent_tickets: urgentTickets,
        high_priority_tickets: highPriorityTickets,
        normal_priority_tickets: normalPriorityTickets,
        low_priority_tickets: lowPriorityTickets,
        sla_breaches: slaBreaches,
        sla_compliance_rate: Number(slaComplianceRate.toFixed(2)),
      };

      // Upsert metrics
      const { data: upsertedMetrics, error: upsertError } = await supabase
        .from('support_metrics')
        .upsert(metrics, {
          onConflict: 'metric_date,metric_hour',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (upsertError) throw upsertError;

      return upsertedMetrics;
    } catch (error) {
      console.error('Error collecting hourly metrics:', error);
      return null;
    }
  }

  /**
   * Update agent performance metrics
   */
  async updateAgentPerformance(agentId: string, date: Date): Promise<AgentPerformance | null> {
    try {
      const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

      // Get tickets handled by this agent on the specified date
      const { data: agentTickets, error: ticketsError } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('assigned_agent_id', agentId)
        .gte('created_at', startDate.toISOString())
        .lt('created_at', endDate.toISOString());

      if (ticketsError) throw ticketsError;

      // Get resolved tickets
      const resolvedTickets = agentTickets?.filter(t => t.status === 'resolved') || [];
      const ticketsHandled = agentTickets?.length || 0;
      const ticketsResolved = resolvedTickets.length;

      // Calculate handling times
      const handlingTimes = resolvedTickets
        .filter(t => t.resolved_at)
        .map(t => {
          const created = new Date(t.created_at);
          const resolved = new Date(t.resolved_at!);
          return (resolved.getTime() - created.getTime()) / (1000 * 60); // minutes
        }) || [];

      const avgHandlingTime = handlingTimes.length > 0
        ? handlingTimes.reduce((a, b) => a + b, 0) / handlingTimes.length
        : 0;

      // Get first contact resolutions
      const firstContactResolutions = resolvedTickets.filter(t => !t.escalated_at).length;

      // Get customer satisfaction scores for this agent
      const { data: satisfactionData, error: satisfactionError } = await supabase
        .from('customer_satisfaction_metrics')
        .select('csat_score')
        .eq('agent_id', agentId)
        .gte('created_at', startDate.toISOString())
        .lt('created_at', endDate.toISOString());

      if (satisfactionError) throw satisfactionError;

      const satisfactionScores = satisfactionData?.map(s => s.csat_score) || [];
      const avgSatisfaction = satisfactionScores.length > 0
        ? satisfactionScores.reduce((a, b) => a + b, 0) / satisfactionScores.length
        : 0;

      // Get quality scores
      const { data: qualityData, error: qualityError } = await supabase
        .from('conversation_quality_scores')
        .select('overall_quality_score')
        .in('ticket_id', agentTickets?.map(t => t.id) || []);

      if (qualityError) throw qualityError;

      const qualityScores = qualityData?.map(q => q.overall_quality_score) || [];
      const avgQualityScore = qualityScores.length > 0
        ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length
        : 0;

      // Calculate rates
      const responseRate = ticketsHandled > 0 ? 100 : 0;
      const resolutionRate = ticketsHandled > 0 ? (ticketsResolved / ticketsHandled) * 100 : 0;
      const escalationRate = ticketsHandled > 0
        ? (agentTickets?.filter(t => t.escalation_level > 0).length || 0) / ticketsHandled * 100
        : 0;

      const performanceData: Partial<AgentPerformance> = {
        agent_id: agentId,
        performance_date: startDate.toISOString().split('T')[0],
        tickets_handled: ticketsHandled,
        tickets_resolved: ticketsResolved,
        avg_handling_time: Number(avgHandlingTime.toFixed(2)),
        first_contact_resolutions: firstContactResolutions,
        customer_satisfaction_avg: Number(avgSatisfaction.toFixed(2)),
        quality_score: Number(avgQualityScore.toFixed(2)),
        response_rate: Number(responseRate.toFixed(2)),
        resolution_rate: Number(resolutionRate.toFixed(2)),
        escalation_rate: Number(escalationRate.toFixed(2)),
      };

      const { data: upsertedPerformance, error: upsertError } = await supabase
        .from('agent_performance')
        .upsert(performanceData, {
          onConflict: 'agent_id,performance_date',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (upsertError) throw upsertError;

      return upsertedPerformance;
    } catch (error) {
      console.error('Error updating agent performance:', error);
      return null;
    }
  }

  /**
   * Record customer satisfaction metrics
   */
  async recordCustomerSatisfaction(data: {
    ticketId?: string;
    customerId?: string;
    csatScore: number;
    npsScore?: number;
    effortScore?: number;
    feedbackText?: string;
    feedbackCategories?: string[];
    supportChannel: string;
    interactionType: string;
    agentId?: string;
  }): Promise<CustomerSatisfactionMetrics | null> {
    try {
      // Analyze sentiment from feedback text
      let sentimentScore = 0;
      if (data.feedbackText) {
        sentimentScore = await this.analyzeSentiment(data.feedbackText);
      }

      const satisfactionData: Partial<CustomerSatisfactionMetrics> = {
        ticket_id: data.ticketId,
        customer_id: data.customerId,
        csat_score: data.csatScore,
        nps_score: data.npsScore,
        effort_score: data.effortScore,
        feedback_text: data.feedbackText,
        feedback_categories: data.feedbackCategories || [],
        sentiment_score: Number(sentimentScore.toFixed(2)),
        support_channel: data.supportChannel,
        interaction_type: data.interactionType,
        agent_id: data.agentId,
      };

      const { data: insertedSatisfaction, error: insertError } = await supabase
        .from('customer_satisfaction_metrics')
        .insert(satisfactionData)
        .select()
        .single();

      if (insertError) throw insertError;

      return insertedSatisfaction;
    } catch (error) {
      console.error('Error recording customer satisfaction:', error);
      return null;
    }
  }

  /**
   * Update channel effectiveness metrics
   */
  async updateChannelEffectiveness(channel: string, date: Date): Promise<ChannelEffectiveness | null> {
    try {
      const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

      // Get tickets for this channel
      const { data: channelTickets, error: ticketsError } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('source', channel)
        .gte('created_at', startDate.toISOString())
        .lt('created_at', endDate.toISOString());

      if (ticketsError) throw ticketsError;

      const totalConversations = channelTickets?.length || 0;
      const successfulConversations = channelTickets?.filter(t => t.status === 'resolved').length || 0;

      // Calculate response times
      const responseTimes = channelTickets
        ?.filter(t => t.first_response_at)
        .map(t => {
          const created = new Date(t.created_at);
          const firstResponse = new Date(t.first_response_at!);
          return (firstResponse.getTime() - created.getTime()) / (1000 * 60);
        }) || [];

      const avgResponseTime = responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;

      // Get satisfaction scores for this channel
      const { data: satisfactionData, error: satisfactionError } = await supabase
        .from('customer_satisfaction_metrics')
        .select('csat_score')
        .eq('support_channel', channel)
        .gte('created_at', startDate.toISOString())
        .lt('created_at', endDate.toISOString());

      if (satisfactionError) throw satisfactionError;

      const satisfactionScores = satisfactionData?.map(s => s.csat_score) || [];
      const avgSatisfaction = satisfactionScores.length > 0
        ? satisfactionScores.reduce((a, b) => a + b, 0) / satisfactionScores.length
        : 0;

      // Calculate rates
      const resolutionRate = totalConversations > 0
        ? (successfulConversations / totalConversations) * 100
        : 0;

      const firstContactResolutions = channelTickets?.filter(t => !t.escalated_at).length || 0;
      const firstContactResolutionRate = totalConversations > 0
        ? (firstContactResolutions / totalConversations) * 100
        : 0;

      const escalations = channelTickets?.filter(t => t.escalation_level > 0).length || 0;
      const escalationRate = totalConversations > 0
        ? (escalations / totalConversations) * 100
        : 0;

      const effectivenessData: Partial<ChannelEffectiveness> = {
        channel,
        analytics_date: startDate.toISOString().split('T')[0],
        total_conversations: totalConversations,
        successful_conversations: successfulConversations,
        avg_response_time: Number(avgResponseTime.toFixed(2)),
        resolution_rate: Number(resolutionRate.toFixed(2)),
        customer_satisfaction: Number(avgSatisfaction.toFixed(2)),
        first_contact_resolution_rate: Number(firstContactResolutionRate.toFixed(2)),
        escalation_rate: Number(escalationRate.toFixed(2)),
      };

      const { data: upsertedEffectiveness, error: upsertError } = await supabase
        .from('channel_effectiveness')
        .upsert(effectivenessData, {
          onConflict: 'channel,analytics_date',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (upsertError) throw upsertError;

      return upsertedEffectiveness;
    } catch (error) {
      console.error('Error updating channel effectiveness:', error);
      return null;
    }
  }

  // ========================================
  // ANALYTICS RETRIEVAL
  // ========================================

  /**
   * Get comprehensive analytics dashboard data
   */
  async getDashboardData(filters: AnalyticsFilters): Promise<{
    metrics: AnalyticsMetrics;
    trends: {
      tickets: TrendData[];
      responseTime: TrendData[];
      satisfaction: TrendData[];
    };
    topAgents: AgentPerformance[];
    channelPerformance: ChannelEffectiveness[];
    alerts: PerformanceAlert[];
  }> {
    try {
      // Get metrics for the date range
      const { data: metricsData, error: metricsError } = await supabase
        .from('support_metrics')
        .select('*')
        .gte('metric_date', filters.dateRange.start.toISOString().split('T')[0])
        .lte('metric_date', filters.dateRange.end.toISOString().split('T')[0]);

      if (metricsError) throw metricsError;

      // Calculate aggregated metrics
      const totalTickets = metricsData?.reduce((sum, m) => sum + m.total_tickets, 0) || 0;
      const resolvedTickets = metricsData?.reduce((sum, m) => sum + m.resolved_tickets, 0) || 0;
      const avgResponseTime = metricsData?.reduce((sum, m) => sum + m.avg_first_response_time, 0) || 0;
      const avgResolutionTime = metricsData?.reduce((sum, m) => sum + m.avg_resolution_time, 0) || 0;
      const satisfactionScore = metricsData?.reduce((sum, m) => sum + m.customer_satisfaction_score, 0) || 0;
      const slaComplianceRate = metricsData?.reduce((sum, m) => sum + m.sla_compliance_rate, 0) || 0;
      const agentUtilizationRate = metricsData?.reduce((sum, m) => sum + m.agent_utilization_rate, 0) || 0;

      const metricsCount = metricsData?.length || 1;
      const metrics: AnalyticsMetrics = {
        totalTickets,
        resolvedTickets,
        avgResponseTime: avgResponseTime / metricsCount,
        avgResolutionTime: avgResolutionTime / metricsCount,
        satisfactionScore: satisfactionScore / metricsCount,
        slaComplianceRate: slaComplianceRate / metricsCount,
        agentUtilizationRate: agentUtilizationRate / metricsCount,
        firstContactResolutionRate: 0, // Calculate from tickets
        escalationRate: 0, // Calculate from tickets
      };

      // Get trend data
      const ticketsTrend = metricsData?.map(m => ({
        date: m.metric_date,
        value: m.total_tickets,
        label: 'Tickets'
      })) || [];

      const responseTimeTrend = metricsData?.map(m => ({
        date: m.metric_date,
        value: m.avg_first_response_time,
        label: 'Response Time (min)'
      })) || [];

      const satisfactionTrend = metricsData?.map(m => ({
        date: m.metric_date,
        value: m.customer_satisfaction_score,
        label: 'Satisfaction'
      })) || [];

      // Get top performers
      const { data: topAgents, error: agentsError } = await supabase
        .from('agent_performance_leaderboard')
        .select('*')
        .limit(10);

      if (agentsError) throw agentsError;

      // Get channel performance
      const { data: channelPerformance, error: channelError } = await supabase
        .from('channel_performance_comparison')
        .select('*')
        .gte('analytics_date', filters.dateRange.start.toISOString().split('T')[0])
        .lte('analytics_date', filters.dateRange.end.toISOString().split('T')[0]);

      if (channelError) throw channelError;

      // Get active alerts
      const { data: alerts, error: alertsError } = await supabase
        .from('performance_alerts')
        .select('*')
        .eq('alert_status', 'active')
        .order('created_at', { ascending: false });

      if (alertsError) throw alertsError;

      return {
        metrics,
        trends: {
          tickets: ticketsTrend,
          responseTime: responseTimeTrend,
          satisfaction: satisfactionTrend,
        },
        topAgents: topAgents || [],
        channelPerformance: channelPerformance || [],
        alerts: alerts || [],
      };
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      throw error;
    }
  }

  /**
   * Get detailed agent performance analytics
   */
  async getAgentPerformanceAnalytics(agentId: string, dateRange: { start: Date; end: Date }): Promise<{
    performance: AgentPerformance[];
    satisfaction: CustomerSatisfactionMetrics[];
    quality: any[];
    trends: {
      tickets: TrendData[];
      satisfaction: TrendData[];
      resolution: TrendData[];
    };
  }> {
    try {
      // Get performance data
      const { data: performance, error: performanceError } = await supabase
        .from('agent_performance')
        .select('*')
        .eq('agent_id', agentId)
        .gte('performance_date', dateRange.start.toISOString().split('T')[0])
        .lte('performance_date', dateRange.end.toISOString().split('T')[0])
        .order('performance_date');

      if (performanceError) throw performanceError;

      // Get satisfaction data
      const { data: satisfaction, error: satisfactionError } = await supabase
        .from('customer_satisfaction_metrics')
        .select('*')
        .eq('agent_id', agentId)
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString())
        .order('created_at');

      if (satisfactionError) throw satisfactionError;

      // Get quality scores
      const { data: quality, error: qualityError } = await supabase
        .from('conversation_quality_scores')
        .select('*')
        .in('ticket_id', performance?.map(p => p.ticket_id) || []);

      if (qualityError) throw qualityError;

      // Generate trends
      const ticketsTrend = performance?.map(p => ({
        date: p.performance_date,
        value: p.tickets_handled,
        label: 'Tickets Handled'
      })) || [];

      const satisfactionTrend = performance?.map(p => ({
        date: p.performance_date,
        value: p.customer_satisfaction_avg,
        label: 'Satisfaction Score'
      })) || [];

      const resolutionTrend = performance?.map(p => ({
        date: p.performance_date,
        value: p.resolution_rate,
        label: 'Resolution Rate (%)'
      })) || [];

      return {
        performance: performance || [],
        satisfaction: satisfaction || [],
        quality: quality || [],
        trends: {
          tickets: ticketsTrend,
          satisfaction: satisfactionTrend,
          resolution: resolutionTrend,
        },
      };
    } catch (error) {
      console.error('Error getting agent performance analytics:', error);
      throw error;
    }
  }

  // ========================================
  // PREDICTIVE ANALYTICS
  // ========================================

  /**
   * Generate volume forecast using historical data
   */
  async generateVolumeForecast(daysAhead: number = 7): Promise<VolumeForecast[]> {
    try {
      const forecasts: VolumeForecast[] = [];
      const forecastModel = 'linear_regression';

      // Get historical data for the past 30 days
      const { data: historicalData, error: historicalError } = await supabase
        .from('support_metrics')
        .select('*')
        .gte('metric_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('metric_date');

      if (historicalError) throw historicalError;

      // Calculate daily totals
      const dailyData = historicalData?.reduce((acc, metric) => {
        const date = metric.metric_date;
        if (!acc[date]) {
          acc[date] = 0;
        }
        acc[date] += metric.total_tickets;
        return acc;
      }, {} as Record<string, number>) || {};

      // Simple linear regression for forecasting
      const dates = Object.keys(dailyData).sort();
      const volumes = dates.map(date => dailyData[date]);

      if (volumes.length < 2) {
        throw new Error('Insufficient historical data for forecasting');
      }

      // Calculate trend
      const n = volumes.length;
      const sumX = volumes.reduce((sum, _, i) => sum + i, 0);
      const sumY = volumes.reduce((sum, val) => sum + val, 0);
      const sumXY = volumes.reduce((sum, val, i) => sum + val * i, 0);
      const sumX2 = volumes.reduce((sum, _, i) => sum + i * i, 0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      // Generate forecasts
      for (let i = 0; i < daysAhead; i++) {
        const forecastDate = new Date();
        forecastDate.setDate(forecastDate.getDate() + i + 1);

        const dayOfWeek = forecastDate.getDay();
        const dayOfWeekFactor = this.getDayOfWeekFactor(dayOfWeek, dailyData);

        const predictedVolume = Math.max(0, Math.round(
          intercept + slope * (n + i) * dayOfWeekFactor
        ));

        const confidenceInterval = Math.round(predictedVolume * 0.2); // 20% confidence interval

        const forecastData: Partial<VolumeForecast> = {
          forecast_date: forecastDate.toISOString().split('T')[0],
          forecast_horizon_days: i + 1,
          forecast_model: forecastModel,
          predicted_ticket_volume: predictedVolume,
          confidence_interval_lower: Math.max(0, predictedVolume - confidenceInterval),
          confidence_interval_upper: predictedVolume + confidenceInterval,
          seasonality_factor: dayOfWeekFactor,
          trend_factor: slope,
          day_of_week_factor: dayOfWeekFactor,
        };

        const { data: forecast, error: forecastError } = await supabase
          .from('volume_forecasts')
          .upsert(forecastData, {
            onConflict: 'forecast_date,forecast_model',
            ignoreDuplicates: false
          })
          .select()
          .single();

        if (forecastError) throw forecastError;
        forecasts.push(forecast);
      }

      return forecasts;
    } catch (error) {
      console.error('Error generating volume forecast:', error);
      return [];
    }
  }

  /**
   * Calculate churn risk for customers
   */
  async calculateChurnRisk(customerId: string): Promise<{
    riskScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    factors: string[];
    recommendations: string[];
  } | null> {
    try {
      // Get customer's support history
      const { data: supportHistory, error: historyError } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (historyError) throw historyError;

      // Get satisfaction scores
      const { data: satisfactionData, error: satisfactionError } = await supabase
        .from('customer_satisfaction_metrics')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (satisfactionError) throw satisfactionError;

      // Get customer profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', customerId)
        .single();

      if (profileError) throw profileError;

      // Calculate risk factors
      const factors: string[] = [];
      let riskScore = 0;

      // Recent support issues
      const recentTickets = supportHistory?.filter(t =>
        new Date(t.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ).length || 0;

      if (recentTickets > 5) {
        riskScore += 20;
        factors.push('High number of recent support issues');
      }

      // Average resolution time
      const avgResolutionTime = supportHistory?.reduce((sum, t) => {
        if (t.resolved_at) {
          const duration = (new Date(t.resolved_at).getTime() - new Date(t.created_at).getTime()) / (1000 * 60 * 60);
          return sum + duration;
        }
        return sum;
      }, 0) / (supportHistory?.filter(t => t.resolved_at).length || 1) || 0;

      if (avgResolutionTime > 24) {
        riskScore += 15;
        factors.push('Long average resolution times');
      }

      // Satisfaction trend
      const recentSatisfaction = satisfactionData?.slice(0, 5).map(s => s.csat_score) || [];
      const olderSatisfaction = satisfactionData?.slice(5, 10).map(s => s.csat_score) || [];

      const recentAvg = recentSatisfaction.length > 0
        ? recentSatisfaction.reduce((a, b) => a + b, 0) / recentSatisfaction.length
        : 5;

      const olderAvg = olderSatisfaction.length > 0
        ? olderSatisfaction.reduce((a, b) => a + b, 0) / olderSatisfaction.length
        : 5;

      if (recentAvg < olderAvg - 1) {
        riskScore += 25;
        factors.push('Declining satisfaction scores');
      }

      if (recentAvg < 3) {
        riskScore += 30;
        factors.push('Low recent satisfaction scores');
      }

      // Escalation history
      const escalations = supportHistory?.filter(t => t.escalation_level > 0).length || 0;
      if (escalations > 2) {
        riskScore += 20;
        factors.push('Multiple escalations');
      }

      // Customer lifetime
      const customerLifetime = profile?.created_at
        ? (Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24)
        : 0;

      if (customerLifetime < 30 && recentTickets > 2) {
        riskScore += 15;
        factors.push('New customer with multiple issues');
      }

      // Determine risk level
      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (riskScore >= 70) riskLevel = 'critical';
      else if (riskScore >= 50) riskLevel = 'high';
      else if (riskScore >= 30) riskLevel = 'medium';

      // Generate recommendations
      const recommendations: string[] = [];
      if (riskScore >= 50) {
        recommendations.push('Schedule immediate proactive outreach');
        recommendations.push('Assign dedicated senior agent');
      }
      if (recentAvg < 3) {
        recommendations.push('Follow up on recent negative experiences');
      }
      if (avgResolutionTime > 24) {
        recommendations.push('Prioritize future tickets for faster resolution');
      }
      if (escalations > 2) {
        recommendations.push('Review escalation handling process');
      }

      // Store prediction
      const predictionData = {
        customer_id: customerId,
        prediction_date: new Date().toISOString().split('T')[0],
        churn_risk_score: Math.min(100, riskScore),
        risk_level: riskLevel,
        recent_support_issues: recentTickets,
        avg_resolution_time: Number(avgResolutionTime.toFixed(2)),
        satisfaction_trend: Number((recentAvg - olderAvg).toFixed(2)),
        escalation_history: escalations,
        customer_lifetime_months: Math.round(customerLifetime / 30),
        recommended_action: recommendations.join('; '),
        intervention_priority: riskScore >= 50 ? 1 : riskScore >= 30 ? 2 : 3,
      };

      await supabase
        .from('churn_risk_predictions')
        .upsert(predictionData, {
          onConflict: 'customer_id,prediction_date',
          ignoreDuplicates: false
        });

      return {
        riskScore: Math.min(100, riskScore),
        riskLevel,
        factors,
        recommendations,
      };
    } catch (error) {
      console.error('Error calculating churn risk:', error);
      return null;
    }
  }

  // ========================================
  // ALERTS AND NOTIFICATIONS
  // ========================================

  /**
   * Check for performance alerts and create notifications
   */
  async checkPerformanceAlerts(): Promise<PerformanceAlert[]> {
    try {
      const alerts: PerformanceAlert[] = [];
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Check SLA breaches
      const { data: currentMetrics, error: metricsError } = await supabase
        .from('support_metrics')
        .select('*')
        .eq('metric_date', now.toISOString().split('T')[0])
        .eq('metric_hour', now.getHours());

      if (metricsError) throw metricsError;

      if (currentMetrics && currentMetrics.length > 0) {
        const metrics = currentMetrics[0];

        // SLA compliance alert
        if (metrics.sla_compliance_rate < 90) {
          const alert = await this.createAlert({
            alertType: 'sla_breach',
            severity: metrics.sla_compliance_rate < 80 ? 'critical' : 'high',
            title: 'SLA Compliance Below Threshold',
            description: `Current SLA compliance is ${metrics.sla_compliance_rate.toFixed(2)}%, below the 90% threshold.`,
            currentValue: metrics.sla_compliance_rate,
            thresholdValue: 90,
            variancePercentage: ((90 - metrics.sla_compliance_rate) / 90) * 100,
            metricCategory: 'sla',
            affectedTimePeriod: `${now.getHours()}:00 - ${now.getHours() + 1}:00`,
          });
          if (alert) alerts.push(alert);
        }

        // Response time alert
        if (metrics.avg_first_response_time > 30) {
          const alert = await this.createAlert({
            alertType: 'response_time',
            severity: metrics.avg_first_response_time > 60 ? 'critical' : 'high',
            title: 'Response Time Exceeds Threshold',
            description: `Average response time is ${metrics.avg_first_response_time.toFixed(2)} minutes, exceeding the 30-minute threshold.`,
            currentValue: metrics.avg_first_response_time,
            thresholdValue: 30,
            variancePercentage: ((metrics.avg_first_response_time - 30) / 30) * 100,
            metricCategory: 'response_time',
            affectedTimePeriod: `${now.getHours()}:00 - ${now.getHours() + 1}:00`,
          });
          if (alert) alerts.push(alert);
        }

        // Satisfaction alert
        if (metrics.customer_satisfaction_score < 3.5) {
          const alert = await this.createAlert({
            alertType: 'satisfaction',
            severity: metrics.customer_satisfaction_score < 2.5 ? 'critical' : 'medium',
            title: 'Customer Satisfaction Below Target',
            description: `Customer satisfaction score is ${metrics.customer_satisfaction_score.toFixed(2)}, below the 3.5 target.`,
            currentValue: metrics.customer_satisfaction_score,
            thresholdValue: 3.5,
            variancePercentage: ((3.5 - metrics.customer_satisfaction_score) / 3.5) * 100,
            metricCategory: 'satisfaction',
            affectedTimePeriod: `${now.getHours()}:00 - ${now.getHours() + 1}:00`,
          });
          if (alert) alerts.push(alert);
        }
      }

      // Check for high volume spikes
      const { data: historicalMetrics, error: historicalError } = await supabase
        .from('support_metrics')
        .select('*')
        .gte('metric_date', new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .eq('metric_hour', now.getHours());

      if (historicalError) throw historicalError;

      if (historicalMetrics && historicalMetrics.length > 0 && currentMetrics?.length > 0) {
        const avgVolume = historicalMetrics.reduce((sum, m) => sum + m.total_tickets, 0) / historicalMetrics.length;
        const currentVolume = currentMetrics[0].total_tickets;

        if (currentVolume > avgVolume * 1.5) {
          const alert = await this.createAlert({
            alertType: 'volume_spike',
            severity: currentVolume > avgVolume * 2 ? 'critical' : 'high',
            title: 'Unusual Volume Spike Detected',
            description: `Current ticket volume (${currentVolume}) is ${((currentVolume / avgVolume - 1) * 100).toFixed(1)}% above average for this hour.`,
            currentValue: currentVolume,
            thresholdValue: avgVolume * 1.5,
            variancePercentage: ((currentVolume / avgVolume - 1) * 100),
            metricCategory: 'volume',
            affectedTimePeriod: `${now.getHours()}:00 - ${now.getHours() + 1}:00`,
          });
          if (alert) alerts.push(alert);
        }
      }

      return alerts;
    } catch (error) {
      console.error('Error checking performance alerts:', error);
      return [];
    }
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Analyze sentiment from text (simplified implementation)
   */
  private async analyzeSentiment(text: string): Promise<number> {
    // Simple sentiment analysis based on keywords
    const positiveWords = ['great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'perfect', 'love', 'happy', 'satisfied', 'thank', 'helpful', 'quick', 'resolved'];
    const negativeWords = ['terrible', 'awful', 'horrible', 'bad', 'worst', 'hate', 'unhappy', 'dissatisfied', 'slow', 'unhelpful', 'frustrated', 'angry', 'disappointed'];

    const words = text.toLowerCase().split(/\s+/);
    let score = 0;

    words.forEach(word => {
      if (positiveWords.includes(word)) score += 0.2;
      if (negativeWords.includes(word)) score -= 0.2;
    });

    // Normalize to -1 to 1 range
    return Math.max(-1, Math.min(1, score));
  }

  /**
   * Get day of week factor for forecasting
   */
  private getDayOfWeekFactor(dayOfWeek: number, historicalData: Record<string, number>): number {
    const dayAverages = [0, 0, 0, 0, 0, 0, 0];
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];

    Object.entries(historicalData).forEach(date => {
      const day = new Date(date).getDay();
      dayAverages[day] += historicalData[date];
      dayCounts[day]++;
    });

    const overallAverage = Object.values(historicalData).reduce((a, b) => a + b, 0) / Object.keys(historicalData).length;
    const dayAverage = dayCounts[dayOfWeek] > 0 ? dayAverages[dayOfWeek] / dayCounts[dayOfWeek] : overallAverage;

    return dayAverage > 0 ? dayAverage / overallAverage : 1;
  }

  /**
   * Create a performance alert
   */
  private async createAlert(alertData: {
    alertType: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description?: string;
    currentValue: number;
    thresholdValue: number;
    variancePercentage: number;
    metricCategory: string;
    affectedTimePeriod: string;
  }): Promise<PerformanceAlert | null> {
    try {
      const { data: alert, error: alertError } = await supabase
        .from('performance_alerts')
        .insert({
          alert_type: alertData.alertType,
          alert_severity: alertData.severity,
          alert_title: alertData.title,
          alert_description: alertData.description,
          current_value: alertData.currentValue,
          threshold_value: alertData.thresholdValue,
          variance_percentage: alertData.variancePercentage,
          metric_category: alertData.metricCategory,
          affected_time_period: alertData.affectedTimePeriod,
        })
        .select()
        .single();

      if (alertError) throw alertError;
      return alert;
    } catch (error) {
      console.error('Error creating alert:', error);
      return null;
    }
  }

  /**
   * Get knowledge base analytics
   */
  async getKnowledgeBaseAnalytics(articleId: string, dateRange: { start: Date; end: Date }): Promise<KnowledgeBaseAnalytics[]> {
    try {
      const { data, error } = await supabase
        .from('knowledge_base_analytics')
        .select('*')
        .eq('article_id', articleId)
        .gte('analytics_date', dateRange.start.toISOString().split('T')[0])
        .lte('analytics_date', dateRange.end.toISOString().split('T')[0])
        .order('analytics_date');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting knowledge base analytics:', error);
      return [];
    }
  }

  /**
   * Record chat performance analytics
   */
  async recordChatPerformance(data: {
    chatSessionId: string;
    sessionDurationMinutes?: number;
    firstResponseTimeSeconds?: number;
    avgResponseTimeSeconds?: number;
    waitTimeSeconds?: number;
    messagesExchanged?: number;
    customerMessages?: number;
    agentMessages?: number;
    resolved: boolean;
    resolutionTimeMinutes?: number;
    escalationRequired: boolean;
    sessionRating?: number;
    customerEffortScore?: number;
    agentId?: string;
    concurrentChats?: number;
  }): Promise<ChatPerformanceAnalytics | null> {
    try {
      const performanceData: Partial<ChatPerformanceAnalytics> = {
        chat_session_id: data.chatSessionId,
        session_duration_minutes: data.sessionDurationMinutes,
        first_response_time_seconds: data.firstResponseTimeSeconds,
        avg_response_time_seconds: data.avgResponseTimeSeconds,
        wait_time_seconds: data.waitTimeSeconds,
        messages_exchanged: data.messagesExchanged,
        customer_messages: data.customerMessages,
        agent_messages: data.agentMessages,
        resolved: data.resolved,
        resolution_time_minutes: data.resolutionTimeMinutes,
        escalation_required: data.escalationRequired,
        session_rating: data.sessionRating,
        customer_effort_score: data.customerEffortScore,
        agent_id: data.agentId,
        concurrent_chats: data.concurrentChats || 1,
      };

      const { data: insertedPerformance, error: insertError } = await supabase
        .from('chat_performance_analytics')
        .insert(performanceData)
        .select()
        .single();

      if (insertError) throw insertError;
      return insertedPerformance;
    } catch (error) {
      console.error('Error recording chat performance:', error);
      return null;
    }
  }
}

// Export singleton instance
export const supportAnalyticsServiceEnhanced = SupportAnalyticsServiceEnhanced.getInstance();
export default supportAnalyticsServiceEnhanced;