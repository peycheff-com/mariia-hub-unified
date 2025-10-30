import { supabase } from '@/integrations/supabase';
import { SupportService } from '@/services/support.service';
import type { Database } from '@/types/supabase';

export class TicketRoutingService {
  // Automated ticket routing engine
  static async routeTicket(ticketId: string): Promise<{
    success: boolean;
    agentId?: string;
    teamId?: string;
    reason?: string;
    escalationLevel?: number;
  }> {
    try {
      const ticket = await SupportService.getTicketById(ticketId);
      if (!ticket) {
        return { success: false, reason: 'Ticket not found' };
      }

      // Check if ticket is already assigned
      if (ticket.assigned_agent_id) {
        return { success: false, reason: 'Ticket already assigned' };
      }

      // Priority 1: Check for urgent tickets
      if (ticket.priority === 'urgent') {
        const urgentResult = await this.routeUrgentTicket(ticket);
        if (urgentResult.success) return urgentResult;
      }

      // Priority 2: Check for VIP customers (based on booking history or customer tier)
      const vipResult = await this.routeVipCustomer(ticket);
      if (vipResult.success) return vipResult;

      // Priority 3: Route by category specialization
      const categoryResult = await this.routeByCategory(ticket);
      if (categoryResult.success) return categoryResult;

      // Priority 4: Route by language preferences
      const languageResult = await this.routeByLanguage(ticket);
      if (languageResult.success) return languageResult;

      // Priority 5: Route to least busy qualified agent
      const availabilityResult = await this.routeByAvailability(ticket);
      if (availabilityResult.success) return availabilityResult;

      // Fallback: Route to default team
      const fallbackResult = await this.routeToDefaultTeam(ticket);
      return fallbackResult;

    } catch (error) {
      console.error('Error routing ticket:', error);
      return { success: false, reason: 'Routing system error' };
    }
  }

  // Route urgent tickets to senior agents
  private static async routeUrgentTicket(ticket: Database['public']['Tables']['support_tickets']['Row']) {
    const { data: seniorAgents, error } = await supabase
      .from('support_agents')
      .select(`
        *,
        user:auth.users(id, email, user_metadata),
        team:support_teams(*)
      `)
      .eq('is_active', true)
      .eq('is_on_break', false)
      .in('agent_level', ['senior_agent', 'team_lead', 'manager'])
      .contains('specializations', [ticket.category])
      .order('customer_satisfaction_avg', { ascending: false })
      .limit(3);

    if (error || !seniorAgents?.length) {
      return { success: false, reason: 'No senior agents available for urgent ticket' };
    }

    // Check agent availability
    for (const agent of seniorAgents) {
      const isAvailable = await this.checkAgentAvailability(agent.user_id);
      if (isAvailable) {
        await this.assignTicketToAgent(ticket.id, agent.user_id, agent.team_id);
        return {
          success: true,
          agentId: agent.user_id,
          teamId: agent.team_id,
          reason: 'Urgent ticket routed to senior agent'
        };
      }
    }

    return { success: false, reason: 'All senior agents at capacity' };
  }

  // Route VIP customers to top agents
  private static async routeVipCustomer(ticket: Database['public']['Tables']['support_tickets']['Row']) {
    // Check if customer is VIP based on booking history or user metadata
    const isVipCustomer = await this.checkVipStatus(ticket.user_id);
    if (!isVipCustomer) {
      return { success: false, reason: 'Not a VIP customer' };
    }

    const { data: topAgents, error } = await supabase
      .from('support_agents')
      .select(`
        *,
        user:auth.users(id, email, user_metadata),
        team:support_teams(*)
      `)
      .eq('is_active', true)
      .eq('is_on_break', false)
      .gte('customer_satisfaction_avg', 4.5)
      .contains('specializations', [ticket.category])
      .order('customer_satisfaction_avg', { ascending: false })
      .limit(5);

    if (error || !topAgents?.length) {
      return { success: false, reason: 'No top agents available for VIP customer' };
    }

    for (const agent of topAgents) {
      const isAvailable = await this.checkAgentAvailability(agent.user_id);
      if (isAvailable) {
        await this.assignTicketToAgent(ticket.id, agent.user_id, agent.team_id);
        return {
          success: true,
          agentId: agent.user_id,
          teamId: agent.team_id,
          reason: 'VIP customer routed to top-rated agent'
        };
      }
    }

    return { success: false, reason: 'All top agents at capacity for VIP customer' };
  }

  // Route by category specialization
  private static async routeByCategory(ticket: Database['public']['Tables']['support_tickets']['Row']) {
    const { data: specializedAgents, error } = await supabase
      .from('support_agents')
      .select(`
        *,
        user:auth.users(id, email, user_metadata),
        team:support_teams(*)
      `)
      .eq('is_active', true)
      .eq('is_on_break', false)
      .contains('specializations', [ticket.category])
      .order('customer_satisfaction_avg', { ascending: false });

    if (error || !specializedAgents?.length) {
      return { success: false, reason: 'No agents specialize in this category' };
    }

    // Sort by availability and satisfaction
    const agentsWithLoad = await Promise.all(
      specializedAgents.map(async (agent) => {
        const currentLoad = await this.getAgentCurrentLoad(agent.user_id);
        return {
          ...agent,
          currentLoad,
          availabilityScore: Math.max(0, 1 - (currentLoad / agent.max_concurrent_tickets))
        };
      })
    );

    // Sort by availability and satisfaction
    agentsWithLoad.sort((a, b) => {
      const scoreA = a.availabilityScore * a.customer_satisfaction_avg;
      const scoreB = b.availabilityScore * b.customer_satisfaction_avg;
      return scoreB - scoreA;
    });

    const bestAgent = agentsWithLoad[0];
    if (bestAgent && bestAgent.currentLoad < bestAgent.max_concurrent_tickets) {
      await this.assignTicketToAgent(ticket.id, bestAgent.user_id, bestAgent.team_id);
      return {
        success: true,
        agentId: bestAgent.user_id,
        teamId: bestAgent.team_id,
        reason: `Routed by category specialization: ${ticket.category}`
      };
    }

    return { success: false, reason: 'All specialized agents at capacity' };
  }

  // Route by language preferences
  private static async routeByLanguage(ticket: Database['public']['Tables']['support_tickets']['Row']) {
    // Detect customer language preference from user metadata or content
    const customerLanguage = await this.detectCustomerLanguage(ticket);

    const { data: languageAgents, error } = await supabase
      .from('support_agents')
      .select(`
        *,
        user:auth.users(id, email, user_metadata),
        team:support_teams(*)
      `)
      .eq('is_active', true)
      .eq('is_on_break', false)
      .contains('languages', [customerLanguage])
      .order('customer_satisfaction_avg', { ascending: false });

    if (error || !languageAgents?.length) {
      return { success: false, reason: `No agents available for language: ${customerLanguage}` };
    }

    for (const agent of languageAgents) {
      const isAvailable = await this.checkAgentAvailability(agent.user_id);
      if (isAvailable) {
        await this.assignTicketToAgent(ticket.id, agent.user_id, agent.team_id);
        return {
          success: true,
          agentId: agent.user_id,
          teamId: agent.team_id,
          reason: `Routed by language preference: ${customerLanguage}`
        };
      }
    }

    return { success: false, reason: `All ${customerLanguage}-speaking agents at capacity` };
  }

  // Route to least busy qualified agent
  private static async routeByAvailability(ticket: Database['public']['Tables']['support_tickets']['Row']) {
    const { data: availableAgents, error } = await supabase
      .from('support_agents')
      .select(`
        *,
        user:auth.users(id, email, user_metadata),
        team:support_teams(*)
      `)
      .eq('is_active', true)
      .eq('is_on_break', false)
      .eq('auto_assign_enabled', true)
      .order('customer_satisfaction_avg', { ascending: false });

    if (error || !availableAgents?.length) {
      return { success: false, reason: 'No agents available for auto-assignment' };
    }

    const agentsWithLoad = await Promise.all(
      availableAgents.map(async (agent) => {
        const currentLoad = await this.getAgentCurrentLoad(agent.user_id);
        return {
          ...agent,
          currentLoad,
          availabilityRatio: currentLoad / agent.max_concurrent_tickets
        };
      })
    );

    // Filter agents who have capacity
    const availableAgentsWithCapacity = agentsWithLoad.filter(
      agent => agent.currentLoad < agent.max_concurrent_tickets
    );

    if (availableAgentsWithCapacity.length === 0) {
      return { success: false, reason: 'All agents at maximum capacity' };
    }

    // Sort by availability (least busy first)
    availableAgentsWithCapacity.sort((a, b) => a.availabilityRatio - b.availabilityRatio);

    const bestAgent = availableAgentsWithCapacity[0];
    await this.assignTicketToAgent(ticket.id, bestAgent.user_id, bestAgent.team_id);
    return {
      success: true,
      agentId: bestAgent.user_id,
      teamId: bestAgent.team_id,
      reason: 'Routed to least busy available agent'
    };
  }

  // Fallback: Route to default team
  private static async routeToDefaultTeam(ticket: Database['public']['Tables']['support_tickets']['Row']) {
    const { data: defaultTeam, error } = await supabase
      .from('support_teams')
      .select('*')
      .eq('is_active', true)
      .order('name')
      .limit(1)
      .single();

    if (error || !defaultTeam) {
      return { success: false, reason: 'No default team available' };
    }

    // Update ticket with team assignment only
    await SupportService.updateTicket(ticket.id, {
      assigned_team_id: defaultTeam.id,
      status: 'open'
    });

    return {
      success: true,
      teamId: defaultTeam.id,
      reason: 'Routed to default team queue'
    };
  }

  // Helper methods
  private static async checkAgentAvailability(agentId: string): Promise<boolean> {
    const { data: agent } = await supabase
      .from('support_agents')
      .select('max_concurrent_tickets, is_on_break, working_hours')
      .eq('user_id', agentId)
      .single();

    if (!agent || agent.is_on_break) return false;

    // Check working hours
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();

    if (agent.working_hours) {
      const workingHours = agent.working_hours as any;
      const daySchedule = workingHours[currentDay];
      if (!daySchedule || !daySchedule.enabled) return false;
      if (currentHour < daySchedule.start || currentHour >= daySchedule.end) return false;
    }

    // Check current load
    const currentLoad = await this.getAgentCurrentLoad(agentId);
    return currentLoad < agent.max_concurrent_tickets;
  }

  private static async getAgentCurrentLoad(agentId: string): Promise<number> {
    const { data: activeTickets } = await supabase
      .from('support_tickets')
      .select('id')
      .eq('assigned_agent_id', agentId)
      .in('status', ['open', 'in_progress', 'waiting_on_customer']);

    return activeTickets?.length || 0;
  }

  private static async checkVipStatus(userId?: string): Promise<boolean> {
    if (!userId) return false;

    // Check user metadata for VIP status
    const { data: user } = await supabase
      .from('profiles')
      .select('user_metadata')
      .eq('id', userId)
      .single();

    if (user?.user_metadata?.vip_status === 'premium' ||
        user?.user_metadata?.vip_status === 'vip') {
      return true;
    }

    // Check booking history for high-value customers
    const { data: bookings } = await supabase
      .from('bookings')
      .select('total_amount, completed_at')
      .eq('user_id', userId)
      .eq('status', 'completed');

    if (bookings && bookings.length > 0) {
      const totalSpent = bookings.reduce((sum, booking) => sum + (booking.total_amount || 0), 0);
      const recentBookings = bookings.filter(b => {
        const bookingDate = new Date(b.completed_at);
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        return bookingDate > threeMonthsAgo;
      }).length;

      // Consider VIP if spent more than 2000 PLN or had 5+ recent bookings
      return totalSpent > 2000 || recentBookings >= 5;
    }

    return false;
  }

  private static async detectCustomerLanguage(ticket: Database['public']['Tables']['support_tickets']['Row']): Promise<string> {
    // Check user metadata for language preference
    if (ticket.user_id) {
      const { data: user } = await supabase
        .from('profiles')
        .select('user_metadata')
        .eq('id', ticket.user_id)
        .single();

      if (user?.user_metadata?.language) {
        return user.user_metadata.language;
      }
    }

    // Detect language from ticket content
    const polishKeywords = ['dzień', 'cześć', 'proszę', 'dziękuję', 'problem', 'rezerwacja', 'płatność'];
    const content = `${ticket.subject} ${ticket.description}`.toLowerCase();

    const hasPolishKeywords = polishKeywords.some(keyword => content.includes(keyword));

    return hasPolishKeywords ? 'pl' : 'en';
  }

  private static async assignTicketToAgent(ticketId: string, agentId: string, teamId?: string) {
    await SupportService.updateTicket(ticketId, {
      assigned_agent_id: agentId,
      assigned_team_id: teamId,
      status: 'in_progress'
    });

    // Log the assignment
    await supabase
      .from('ticket_conversations')
      .insert({
        ticket_id: ticketId,
        message: `Ticket automatically assigned to agent ${agentId}`,
        message_type: 'system_note',
        channel: 'system',
        sender_name: 'Auto-Routing System',
        is_internal: true
      });
  }

  // Escalation management
  static async checkForEscalations(): Promise<void> {
    try {
      // Find tickets that need escalation
      const { data: ticketsToEscalate, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('status', 'in_progress')
        .lt('sla_resolution_deadline', new Date().toISOString())
        .eq('escalation_level', 0); // Not yet escalated

      if (error || !ticketsToEscalate?.length) return;

      for (const ticket of ticketsToEscalate) {
        await this.escalateTicket(ticket, 'SLA breach');
      }

      // Find tickets at risk of breach
      const atRiskTime = new Date();
      atRiskTime.setHours(atRiskTime.getHours() + 1); // 1 hour from now

      const { data: atRiskTickets } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('status', 'in_progress')
        .lt('sla_resolution_deadline', atRiskTime.toISOString())
        .eq('escalation_level', 0);

      if (atRiskTickets?.length) {
        await this.notifyAtRiskTickets(atRiskTickets);
      }

    } catch (error) {
      console.error('Error checking for escalations:', error);
    }
  }

  private static async escalateTicket(
    ticket: Database['public']['Tables']['support_tickets']['Row'],
    reason: string
  ): Promise<void> {
    // Get current assigned agent
    const { data: currentAgent } = await supabase
      .from('support_agents')
      .select('team_id, user_id')
      .eq('user_id', ticket.assigned_agent_id)
      .single();

    // Find senior agent or team lead for escalation
    const { data: escalationTarget } = await supabase
      .from('support_agents')
      .select('*')
      .eq('team_id', currentAgent?.team_id)
      .in('agent_level', ['team_lead', 'manager'])
      .eq('is_active', true)
      .eq('is_on_break', false)
      .limit(1);

    if (escalationTarget) {
      // Create escalation record
      await supabase
        .from('ticket_escalations')
        .insert({
          ticket_id: ticket.id,
          from_agent_id: ticket.assigned_agent_id,
          to_agent_id: escalationTarget.user_id,
          from_team_id: currentAgent?.team_id,
          to_team_id: escalationTarget.team_id,
          escalation_reason: reason,
          escalation_type: 'automatic',
          status: 'accepted'
        });

      // Reassign ticket
      await this.assignTicketToAgent(ticket.id, escalationTarget.user_id, escalationTarget.team_id);

      // Update ticket
      await SupportService.updateTicket(ticket.id, {
        escalation_level: ticket.escalation_level + 1,
        status: 'escalated'
      });

      // Log escalation
      await supabase
        .from('ticket_conversations')
        .insert({
          ticket_id: ticket.id,
          message: `Ticket escalated due to: ${reason}`,
          message_type: 'system_note',
          channel: 'system',
          sender_name: 'Escalation System',
          is_internal: true
        });
    }
  }

  private static async notifyAtRiskTickets(tickets: Database['public']['Tables']['support_tickets']['Row'][]): Promise<void> {
    for (const ticket of tickets) {
      // Send notification to assigned agent
      await supabase
        .from('ticket_conversations')
        .insert({
          ticket_id: ticket.id,
          message: 'Warning: This ticket is at risk of SLA breach',
          message_type: 'system_note',
          channel: 'system',
          sender_name: 'SLA Monitor',
          is_internal: true
        });

      // Update SLA status
      await SupportService.updateTicket(ticket.id, {
        sla_status: 'at_risk'
      });
    }
  }

  // Priority scoring for new tickets
  static calculateTicketPriority(
    category: Database['public']['Tables']['support_tickets']['Row']['category'],
    description: string,
    userHistory?: { totalBookings: number; totalSpent: number }
  ): Database['public']['Tables']['support_tickets']['Row']['priority'] {
    let score = 0;

    // Category-based scoring
    const categoryScores = {
      'payment_problem': 8,
      'booking_issue': 7,
      'technical_support': 6,
      'complaint': 9,
      'account_management': 5,
      'billing': 7,
      'service_inquiry': 3,
      'feature_request': 2,
      'general': 1
    };

    score += categoryScores[category] || 1;

    // Urgency keywords in description
    const urgentKeywords = ['urgent', 'emergency', 'immediately', 'asap', 'broken', 'error', 'failed'];
    const lowerDescription = description.toLowerCase();

    urgentKeywords.forEach(keyword => {
      if (lowerDescription.includes(keyword)) {
        score += 3;
      }
    });

    // Customer history influence
    if (userHistory) {
      if (userHistory.totalSpent > 2000) score += 2; // High-value customer
      if (userHistory.totalBookings > 10) score += 1; // Loyal customer
    }

    // Convert score to priority
    if (score >= 10) return 'urgent';
    if (score >= 7) return 'high';
    if (score >= 4) return 'medium';
    return 'low';
  }
}