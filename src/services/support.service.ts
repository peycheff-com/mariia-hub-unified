import { supabase } from '@/integrations/supabase';
import type {
  Database,
  SupportTicketWithDetails,
  SupportDashboardData,
  SupportTicketMetrics,
  KnowledgeBaseArticleWithCategory,
  SupportAgentWithTeam
} from '@/types/supabase';

// Support ticket service functions
export class SupportService {
  // Ticket management
  static async createTicket(ticketData: Database['public']['Tables']['support_tickets']['Insert']) {
    const { data, error } = await supabase
      .from('support_tickets')
      .insert(ticketData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getTickets(filters?: {
    status?: Database['public']['Tables']['support_tickets']['Row']['status'][];
    priority?: Database['public']['Tables']['support_tickets']['Row']['priority'][];
    category?: Database['public']['Tables']['support_tickets']['Row']['category'][];
    assigned_agent_id?: string;
    user_id?: string;
    limit?: number;
    offset?: number;
  }): Promise<SupportTicketWithDetails[]> {
    let query = supabase
      .from('support_tickets')
      .select(`
        *,
        conversations:ticket_conversations(*),
        assigned_agent:profiles!support_tickets_assigned_agent_id_fkey(id, user_metadata, full_name),
        customer:auth.users!support_tickets_user_id_fkey(id, email, user_metadata),
        booking:bookings(*),
        service:services(*),
        escalations:ticket_escalations(*),
        satisfaction_survey:satisfaction_surveys(*)
      `);

    if (filters?.status?.length) {
      query = query.in('status', filters.status);
    }
    if (filters?.priority?.length) {
      query = query.in('priority', filters.priority);
    }
    if (filters?.category?.length) {
      query = query.in('category', filters.category);
    }
    if (filters?.assigned_agent_id) {
      query = query.eq('assigned_agent_id', filters.assigned_agent_id);
    }
    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id);
    }

    query = query.order('created_at', { ascending: false });

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async getTicketById(ticketId: string): Promise<SupportTicketWithDetails | null> {
    const { data, error } = await supabase
      .from('support_tickets')
      .select(`
        *,
        conversations:ticket_conversations(*),
        assigned_agent:profiles!support_tickets_assigned_agent_id_fkey(id, user_metadata, full_name),
        customer:auth.users!support_tickets_user_id_fkey(id, email, user_metadata),
        booking:bookings(*),
        service:services(*),
        escalations:ticket_escalations(*),
        satisfaction_survey:satisfaction_surveys(*)
      `)
      .eq('id', ticketId)
      .single();

    if (error) throw error;
    return data;
  }

  static async updateTicket(ticketId: string, updates: Database['public']['Tables']['support_tickets']['Update']) {
    const { data, error } = await supabase
      .from('support_tickets')
      .update(updates)
      .eq('id', ticketId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async assignTicket(ticketId: string, agentId: string) {
    return this.updateTicket(ticketId, {
      assigned_agent_id: agentId,
      status: 'in_progress'
    });
  }

  static async escalateTicket(ticketId: string, escalationData: Database['public']['Tables']['ticket_escalations']['Insert']) {
    const { data, error } = await supabase
      .from('ticket_escalations')
      .insert(escalationData)
      .select()
      .single();

    if (error) throw error;

    // Update ticket status
    await this.updateTicket(ticketId, {
      status: 'escalated',
      escalation_level: (await this.getTicketById(ticketId))?.escalation_level! + 1
    });

    return data;
  }

  // Ticket conversations
  static async addConversationMessage(messageData: Database['public']['Tables']['ticket_conversations']['Insert']) {
    const { data, error } = await supabase
      .from('ticket_conversations')
      .insert(messageData)
      .select()
      .single();

    if (error) throw error;

    // Update ticket's first response time if this is the first agent response
    if (messageData.message_type === 'agent_message') {
      const ticket = await this.getTicketById(messageData.ticket_id);
      if (ticket && !ticket.first_response_at) {
        await this.updateTicket(messageData.ticket_id, {
          first_response_at: new Date().toISOString()
        });
      }
    }

    return data;
  }

  static async getTicketConversations(ticketId: string) {
    const { data, error } = await supabase
      .from('ticket_conversations')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Knowledge Base
  static async getKnowledgeBaseCategories() {
    const { data, error } = await supabase
      .from('kb_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (error) throw error;
    return data || [];
  }

  static async getKnowledgeBaseArticles(filters?: {
    category_id?: string;
    status?: Database['public']['Tables']['kb_articles']['Row']['status'];
    featured?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<KnowledgeBaseArticleWithCategory[]> {
    let query = supabase
      .from('kb_articles')
      .select(`
        *,
        category:kb_categories(*)
      `);

    if (filters?.category_id) {
      query = query.eq('category_id', filters.category_id);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.featured !== undefined) {
      query = query.eq('is_featured', filters.featured);
    }
    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,content_en.ilike.%${filters.search}%,content_pl.ilike.%${filters.search}%`);
    }

    query = query.order('is_featured', { ascending: false })
                .order('view_count', { ascending: false });

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async getKnowledgeBaseArticle(slug: string): Promise<KnowledgeBaseArticleWithCategory | null> {
    const { data, error } = await supabase
      .from('kb_articles')
      .select(`
        *,
        category:kb_categories(*)
      `)
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error) throw error;

    // Increment view count
    if (data) {
      await supabase
        .from('kb_articles')
        .update({ view_count: data.view_count + 1 })
        .eq('id', data.id);
    }

    return data;
  }

  static async searchKnowledgeBase(query: string, language: string = 'en') {
    // Log search analytics
    await supabase
      .from('kb_search_analytics')
      .insert({
        search_query: query,
        search_language: language
      });

    // Perform search
    const { data, error } = await supabase
      .from('kb_articles')
      .select(`
        *,
        category:kb_categories(*)
      `)
      .eq('status', 'published')
      .or(`title.ilike.%${query}%,summary_en.ilike.%${query}%,summary_pl.ilike.%${query}%,content_en.ilike.%${query}%,content_pl.ilike.%${query}%`)
      .order('is_featured', { ascending: false })
      .order('view_count', { ascending: false })
      .limit(20);

    if (error) throw error;
    return data || [];
  }

  static async recordArticleHelpful(articleId: string, helpful: boolean) {
    const { data, error } = await supabase
      .from('kb_articles')
      .select('helpful_count, not_helpful_count')
      .eq('id', articleId)
      .single();

    if (error) throw error;

    const updates = helpful
      ? { helpful_count: data.helpful_count + 1 }
      : { not_helpful_count: data.not_helpful_count + 1 };

    return supabase
      .from('kb_articles')
      .update(updates)
      .eq('id', articleId);
  }

  // Support agents and teams
  static async getSupportAgents(filters?: {
    team_id?: string;
    is_active?: boolean;
    agent_level?: Database['public']['Tables']['support_agents']['Row']['agent_level'];
  }): Promise<SupportAgentWithTeam[]> {
    let query = supabase
      .from('support_agents')
      .select(`
        *,
        team:support_teams(*),
        user:auth.users(id, email, user_metadata)
      `);

    if (filters?.team_id) {
      query = query.eq('team_id', filters.team_id);
    }
    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }
    if (filters?.agent_level) {
      query = query.eq('agent_level', filters.agent_level);
    }

    query = query.order('agent_level', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async getSupportTeams() {
    const { data, error } = await supabase
      .from('support_teams')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  }

  // Canned responses
  static async getCannedResponses(category?: Database['public']['Tables']['canned_responses']['Row']['category']) {
    let query = supabase
      .from('canned_responses')
      .select('*')
      .eq('is_active', true)
      .order('title');

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async useCannedResponse(responseId: string) {
    // Increment usage count
    const { data, error } = await supabase
      .from('canned_responses')
      .update({ usage_count: supabase.rpc('increment', { amount: 1 }) })
      .eq('id', responseId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Satisfaction surveys
  static async createSatisfactionSurvey(surveyData: Database['public']['Tables']['satisfaction_surveys']['Insert']) {
    const { data, error } = await supabase
      .from('satisfaction_surveys')
      .insert(surveyData)
      .select()
      .single();

    if (error) throw error;

    // Update ticket satisfaction rating
    if (surveyData.overall_rating) {
      await this.updateTicket(surveyData.ticket_id, {
        customer_satisfaction_rating: surveyData.overall_rating
      });
    }

    return data;
  }

  // Analytics and metrics
  static async getSupportMetrics(dateRange?: { from: string; to: string }): Promise<SupportDashboardData> {
    const fromDate = dateRange?.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const toDate = dateRange?.to || new Date().toISOString();

    // Get ticket metrics
    const { data: tickets, error: ticketsError } = await supabase
      .from('support_tickets')
      .select('*')
      .gte('created_at', fromDate)
      .lte('created_at', toDate);

    if (ticketsError) throw ticketsError;

    const openTickets = tickets?.filter(t => t.status === 'open').length || 0;
    const inProgressTickets = tickets?.filter(t => t.status === 'in_progress').length || 0;
    const resolvedToday = tickets?.filter(t =>
      t.status === 'resolved' &&
      new Date(t.updated_at).toDateString() === new Date().toDateString()
    ).length || 0;
    const overdueTickets = tickets?.filter(t =>
      t.sla_resolution_deadline &&
      new Date(t.sla_resolution_deadline) < new Date() &&
      !['resolved', 'closed'].includes(t.status)
    ).length || 0;

    // Calculate priority breakdown
    const priorityBreakdown = tickets?.reduce((acc, ticket) => {
      acc[ticket.priority] = (acc[ticket.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Calculate category breakdown
    const categoryBreakdown = tickets?.reduce((acc, ticket) => {
      acc[ticket.category] = (acc[ticket.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Calculate channel breakdown
    const channelBreakdown = tickets?.reduce((acc, ticket) => {
      acc[ticket.channel] = (acc[ticket.channel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Get recent tickets
    const recentTickets = await this.getTickets({ limit: 10 });

    // Get team performance
    const teamPerformance = await this.getSupportAgents({ is_active: true });

    // Calculate average response time and satisfaction
    const resolvedTickets = tickets?.filter(t => t.status === 'resolved') || [];
    const avgResponseTime = resolvedTickets.length > 0
      ? resolvedTickets.reduce((sum, ticket) => {
          if (ticket.first_response_at && ticket.created_at) {
            const responseTime = new Date(ticket.first_response_at).getTime() - new Date(ticket.created_at).getTime();
            return sum + responseTime;
          }
          return sum;
        }, 0) / resolvedTickets.length / (1000 * 60) // Convert to minutes
      : 0;

    const customerSatisfactionAvg = resolvedTickets.length > 0
      ? resolvedTickets.reduce((sum, ticket) =>
          sum + (ticket.customer_satisfaction_rating || 0), 0) / resolvedTickets.length
      : 0;

    const slaComplianceRate = tickets && tickets.length > 0
      ? (tickets.filter(t => t.sla_status === 'on_track').length / tickets.length) * 100
      : 0;

    return {
      metrics: {
        totalTickets: tickets?.length || 0,
        openTickets,
        inProgressTickets,
        resolvedToday,
        overdueTickets,
        avgResponseTime: Math.round(avgResponseTime),
        customerSatisfactionAvg: Math.round(customerSatisfactionAvg * 100) / 100,
        slaComplianceRate: Math.round(slaComplianceRate * 100) / 100
      },
      recentTickets,
      teamPerformance,
      priorityBreakdown,
      categoryBreakdown,
      channelBreakdown
    };
  }

  // Automated ticket routing
  static async autoAssignTicket(ticketId: string): Promise<string | null> {
    const ticket = await this.getTicketById(ticketId);
    if (!ticket) return null;

    // Find suitable agents based on category and availability
    const { data: agents, error } = await supabase
      .from('support_agents')
      .select(`
        *,
        user:auth.users(id, email, user_metadata)
      `)
      .eq('is_active', true)
      .eq('is_on_break', false)
      .contains('specializations', [ticket.category])
      .order('customer_satisfaction_avg', { ascending: false })
      .limit(1);

    if (error || !agents || agents.length === 0) return null;

    const assignedAgent = agents[0];

    // Check agent's current workload
    const { data: currentTickets } = await supabase
      .from('support_tickets')
      .select('id')
      .eq('assigned_agent_id', assignedAgent.user_id)
      .in('status', ['open', 'in_progress']);

    if (currentTickets && currentTickets.length >= assignedAgent.max_concurrent_tickets) {
      return null; // Agent at capacity
    }

    // Assign ticket
    await this.assignTicket(ticketId, assignedAgent.user_id);
    return assignedAgent.user_id;
  }

  // Real-time subscriptions
  static subscribeToTicketUpdates(ticketId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`ticket_${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_tickets',
          filter: `id=eq.${ticketId}`
        },
        callback
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ticket_conversations',
          filter: `ticket_id=eq.${ticketId}`
        },
        callback
      )
      .subscribe();
  }

  static subscribeToAgentTickets(agentId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`agent_${agentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_tickets',
          filter: `assigned_agent_id=eq.${agentId}`
        },
        callback
      )
      .subscribe();
  }

  static unsubscribe(channel: any) {
    supabase.removeChannel(channel);
  }
}