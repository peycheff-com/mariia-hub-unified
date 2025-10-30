import { supabase } from '@/integrations/supabase';
import type { Database } from '@/types/supabase';

export interface ClientJourneyMetrics {
  clientId: string;
  currentTier: string;
  journeyProgress: number;
  satisfactionScore: number;
  lifetimeValue: number;
  interactionCount: number;
  preferredChannels: string[];
  lastInteraction: string;
  riskFactors: string[];
  opportunities: string[];
  personalizedInsights: string[];
}

export interface SupportTicket {
  id: string;
  clientId: string;
  clientName: string;
  subject: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  category: string;
  channel: string;
  assignedAgent?: string;
  createdAt: string;
  updatedAt: string;
  isVIP: boolean;
}

export interface Alert {
  id: string;
  type: 'system' | 'client' | 'performance' | 'security';
  priority: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  actionRequired: boolean;
  metadata?: any;
}

export interface WhiteGloveService {
  id: string;
  serviceType: 'concierge' | 'video_consultation' | 'priority_support' | 'emergency';
  clientId: string;
  status: 'active' | 'scheduled' | 'completed' | 'cancelled';
  scheduledAt?: string;
  assignedAgent?: string;
  customizations?: any;
}

export class LuxurySupportOrchestrator {
  private realTimeSubscriptions: Map<string, any> = new Map();

  constructor() {
    this.initializeRealTimeMonitoring();
  }

  /**
   * Get comprehensive client journey metrics
   */
  async getClientJourneyMetrics(clientId: string): Promise<ClientJourneyMetrics> {
    try {
      const [
        profile,
        bookings,
        tickets,
        interactions,
        valueData
      ] = await Promise.all([
        this.getClientProfile(clientId),
        this.getClientBookings(clientId),
        this.getClientTickets(clientId),
        this.getClientInteractions(clientId),
        this.getClientValueData(clientId)
      ]);

      const tier = this.calculateClientTier(profile, valueData);
      const journeyProgress = this.calculateJourneyProgress(profile, bookings, interactions);
      const satisfactionScore = await this.calculateSatisfactionScore(tickets);
      const lifetimeValue = valueData?.totalValue || 0;
      const interactionCount = interactions.length;
      const preferredChannels = this.getPreferredChannels(interactions);
      const lastInteraction = this.getLastInteraction(interactions);
      const riskFactors = this.identifyRiskFactors(profile, tickets, valueData);
      const opportunities = this.identifyOpportunities(profile, bookings, interactions);
      const personalizedInsights = await this.generatePersonalizedInsights(
        profile, tickets, bookings, tier
      );

      return {
        clientId,
        currentTier: tier,
        journeyProgress,
        satisfactionScore,
        lifetimeValue,
        interactionCount,
        preferredChannels,
        lastInteraction,
        riskFactors,
        opportunities,
        personalizedInsights
      };
    } catch (error) {
      console.error('Failed to get client journey metrics:', error);
      throw error;
    }
  }

  /**
   * Get active support tickets with VIP prioritization
   */
  async getActiveTickets(): Promise<SupportTicket[]> {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          client:profiles!support_tickets_user_id_fkey(id, full_name, user_metadata),
          agent:profiles!support_tickets_assigned_agent_id_fkey(id, full_name)
        `)
        .in('status', ['open', 'in_progress'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(ticket => ({
        id: ticket.id,
        clientId: ticket.user_id,
        clientName: ticket.client?.full_name || 'Unknown Client',
        subject: ticket.subject,
        priority: ticket.priority,
        status: ticket.status,
        category: ticket.category,
        channel: ticket.channel,
        assignedAgent: ticket.agent?.full_name,
        createdAt: ticket.created_at,
        updatedAt: ticket.updated_at,
        isVIP: this.isVIPClient(ticket.user_id)
      }));
    } catch (error) {
      console.error('Failed to get active tickets:', error);
      return [];
    }
  }

  /**
   * Get real-time alerts for luxury support system
   */
  async getActiveAlerts(): Promise<Alert[]> {
    try {
      const alerts: Alert[] = [];

      // Check for VIP client escalations
      const vipEscalations = await this.checkVIPEscalations();
      alerts.push(...vipEscalations);

      // Check for performance issues
      const performanceAlerts = await this.checkPerformanceIssues();
      alerts.push(...performanceAlerts);

      // Check for SLA violations
      const slaAlerts = await this.checkSLAViolations();
      alerts.push(...slaAlerts);

      // Check for white-glove service requests
      const serviceAlerts = await this.checkWhiteGloveRequests();
      alerts.push(...serviceAlerts);

      return alerts.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
    } catch (error) {
      console.error('Failed to get active alerts:', error);
      return [];
    }
  }

  /**
   * Trigger white-glove service for VIP clients
   */
  async triggerWhiteGloveService(
    clientId: string,
    serviceType: WhiteGloveService['serviceType'],
    customizations?: any
  ): Promise<WhiteGloveService> {
    try {
      const service: WhiteGloveService = {
        id: crypto.randomUUID(),
        serviceType,
        clientId,
        status: 'active',
        customizations
      };

      // Log white-glove service activation
      await supabase
        .from('white_glove_services')
        .insert({
          id: service.id,
          client_id: clientId,
          service_type: serviceType,
          status: 'active',
          customizations: customizations || {},
          created_at: new Date().toISOString()
        });

      // Notify dedicated agents
      await this.notifyDedicatedAgents(clientId, serviceType);

      // Send personalized notification to client
      await this.sendPersonalizedNotification(clientId, serviceType);

      return service;
    } catch (error) {
      console.error('Failed to trigger white-glove service:', error);
      throw error;
    }
  }

  /**
   * Automated intelligent ticket routing with VIP prioritization
   */
  async intelligentTicketRouting(ticketId: string): Promise<string | null> {
    try {
      const ticket = await this.getTicketDetails(ticketId);
      if (!ticket) return null;

      // Check if VIP client - priority routing
      const isVIP = this.isVIPClient(ticket.user_id);
      if (isVIP) {
        return await this.routeToVipAgent(ticketId);
      }

      // Get best available agent based on specialization and workload
      const bestAgent = await this.findBestAgent(ticket);
      if (!bestAgent) return null;

      // Assign ticket to agent
      await this.assignTicketToAgent(ticketId, bestAgent.id);

      return bestAgent.id;
    } catch (error) {
      console.error('Failed to route ticket:', error);
      return null;
    }
  }

  /**
   * Generate personalized client insights
   */
  async generatePersonalizedInsights(
    profile: any,
    tickets: any[],
    bookings: any[],
    tier: string
  ): Promise<string[]> {
    const insights: string[] = [];

    try {
      // Analyze booking patterns
      const bookingPatterns = this.analyzeBookingPatterns(bookings);
      if (bookingPatterns.prefersEvening) {
        insights.push("Client consistently prefers evening appointments - consider offering after-hours availability");
      }

      if (bookingPatterns.regularInterval) {
        insights.push("Shows strong loyalty with regular booking patterns - eligible for loyalty program benefits");
      }

      // Analyze support interactions
      const supportPatterns = this.analyzeSupportPatterns(tickets);
      if (supportPatterns.prefersSelfService) {
        insights.push("Comfortable with self-service options - enhance knowledge base access");
      }

      if (supportPatterns.valuesQuickResolution) {
        insights.push("Values fast resolution - prioritize for priority support routing");
      }

      // VIP-specific insights
      if (tier.includes('vip')) {
        insights.push("VIP client status - activate white-glove service protocols");
        insights.push("Consider personalized service recommendations based on history");
      }

      // Service preferences based on history
      const servicePreferences = this.analyzeServicePreferences(bookings);
      if (servicePreferences.preferredCategories.length > 0) {
        insights.push(`Shows interest in ${servicePreferences.preferredCategories.join(', ')} - personalize recommendations`);
      }

      return insights;
    } catch (error) {
      console.error('Failed to generate personalized insights:', error);
      return [];
    }
  }

  /**
   * Initialize real-time monitoring for luxury support
   */
  private initializeRealTimeMonitoring(): void {
    // Monitor VIP ticket creation
    const vipTicketSubscription = supabase
      .channel('vip-tickets')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_tickets'
        },
        async (payload) => {
          const newTicket = payload.new as any;
          if (this.isVIPClient(newTicket.user_id)) {
            await this.handleVIPTicketCreation(newTicket);
          }
        }
      )
      .subscribe();

    this.realTimeSubscriptions.set('vip-tickets', vipTicketSubscription);

    // Monitor system performance
    const performanceSubscription = supabase
      .channel('performance')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'system_metrics'
        },
        async (payload) => {
          await this.handlePerformanceUpdate(payload);
        }
      )
      .subscribe();

    this.realTimeSubscriptions.set('performance', performanceSubscription);
  }

  // Private helper methods
  private async getClientProfile(clientId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', clientId)
      .single();

    if (error) throw error;
    return data;
  }

  private async getClientBookings(clientId: string) {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', clientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  private async getClientTickets(clientId: string) {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', clientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  private async getClientInteractions(clientId: string) {
    // Get all client interactions across different touchpoints
    const { data, error } = await supabase
      .from('client_interactions')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  private async getClientValueData(clientId: string) {
    const { data, error } = await supabase
      .from('client_value_metrics')
      .select('*')
      .eq('client_id', clientId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  private calculateClientTier(profile: any, valueData: any): string {
    if (!valueData) return 'standard';

    const totalValue = valueData.totalValue || 0;
    const bookingCount = valueData.bookingCount || 0;
    const satisfactionScore = valueData.averageSatisfaction || 0;

    if (totalValue > 50000 && bookingCount > 20 && satisfactionScore >= 4.8) {
      return 'vip_platinum';
    } else if (totalValue > 25000 && bookingCount > 10 && satisfactionScore >= 4.5) {
      return 'vip_gold';
    } else if (totalValue > 10000 && bookingCount > 5 && satisfactionScore >= 4.2) {
      return 'vip_silver';
    } else if (totalValue > 5000 || bookingCount > 3) {
      return 'premium';
    }

    return 'standard';
  }

  private calculateJourneyProgress(profile: any, bookings: any[], interactions: any[]): number {
    let progress = 0;

    // Profile completion (30%)
    if (profile?.full_name) progress += 10;
    if (profile?.phone) progress += 10;
    if (profile?.preferences) progress += 10;

    // Booking history (40%)
    const bookingCount = bookings?.length || 0;
    if (bookingCount >= 1) progress += 10;
    if (bookingCount >= 3) progress += 10;
    if (bookingCount >= 5) progress += 10;
    if (bookingCount >= 10) progress += 10;

    // Engagement (30%)
    const interactionCount = interactions?.length || 0;
    if (interactionCount >= 1) progress += 10;
    if (interactionCount >= 3) progress += 10;
    if (interactionCount >= 5) progress += 10;

    return Math.min(progress, 100);
  }

  private async calculateSatisfactionScore(tickets: any[]): Promise<number> {
    if (!tickets || tickets.length === 0) return 5.0;

    const ratings = tickets
      .filter(t => t.customer_satisfaction_rating)
      .map(t => t.customer_satisfaction_rating);

    if (ratings.length === 0) return 5.0;

    const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
    return Math.round(average * 10) / 10;
  }

  private getPreferredChannels(interactions: any[]): string[] {
    const channelCounts: Record<string, number> = {};

    interactions.forEach(interaction => {
      const channel = interaction.channel || 'unknown';
      channelCounts[channel] = (channelCounts[channel] || 0) + 1;
    });

    return Object.entries(channelCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([channel]) => channel);
  }

  private getLastInteraction(interactions: any[]): string {
    if (!interactions || interactions.length === 0) return '';

    const latest = interactions.reduce((latest, current) =>
      new Date(current.created_at) > new Date(latest.created_at) ? current : latest
    );

    return latest.created_at;
  }

  private identifyRiskFactors(profile: any, tickets: any[], valueData: any): string[] {
    const risks: string[] = [];

    // Check for declining satisfaction
    const recentTickets = tickets?.slice(0, 5) || [];
    const avgRecentSatisfaction = recentTickets.reduce((sum, ticket) =>
      sum + (ticket.customer_satisfaction_rating || 5), 0) / recentTickets.length;

    if (avgRecentSatisfaction < 3.5) {
      risks.push("Declining satisfaction in recent interactions");
    }

    // Check for extended inactivity
    const lastInteraction = this.getLastInteraction(tickets);
    if (lastInteraction) {
      const daysSinceLastInteraction = Math.floor(
        (Date.now() - new Date(lastInteraction).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceLastInteraction > 90) {
        risks.push("No recent interactions for over 90 days");
      }
    }

    // Check for high-priority tickets
    const highPriorityTickets = tickets?.filter(t => t.priority === 'high' || t.priority === 'critical') || [];
    if (highPriorityTickets.length > 2) {
      risks.push("Multiple high-priority support tickets");
    }

    return risks;
  }

  private identifyOpportunities(profile: any, bookings: any[], interactions: any[]): string[] {
    const opportunities: string[] = [];

    // Upsell opportunities based on booking history
    const bookingCategories = [...new Set(bookings?.map(b => b.category))];
    if (bookingCategories.length === 1 && bookingCategories[0]) {
      opportunities.push(`Explore ${bookingCategories[0]} related services for upselling`);
    }

    // VIP upgrade opportunities
    if (bookings && bookings.length >= 5) {
      opportunities.push("Eligible for VIP tier upgrade - present premium benefits");
    }

    // Referral opportunities
    const satisfactionScores = interactions
      ?.filter(i => i.satisfaction_rating)
      ?.map(i => i.satisfaction_rating) || [];

    if (satisfactionScores.length > 0 && satisfactionScores.every(score => score >= 4.5)) {
      opportunities.push("High satisfaction scores - ideal for referral program");
    }

    return opportunities;
  }

  private isVIPClient(clientId: string): boolean {
    // This would typically check against a VIP client database or tier system
    // For now, return false as placeholder
    return false;
  }

  private async checkVIPEscalations(): Promise<Alert[]> {
    // Implementation for checking VIP escalations
    return [];
  }

  private async checkPerformanceIssues(): Promise<Alert[]> {
    // Implementation for checking performance issues
    return [];
  }

  private async checkSLAViolations(): Promise<Alert[]> {
    // Implementation for checking SLA violations
    return [];
  }

  private async checkWhiteGloveRequests(): Promise<Alert[]> {
    // Implementation for checking white-glove service requests
    return [];
  }

  private async notifyDedicatedAgents(clientId: string, serviceType: string): Promise<void> {
    // Implementation for notifying dedicated agents
  }

  private async sendPersonalizedNotification(clientId: string, serviceType: string): Promise<void> {
    // Implementation for sending personalized notifications
  }

  private async getTicketDetails(ticketId: string): Promise<any> {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (error) throw error;
    return data;
  }

  private async routeToVipAgent(ticketId: string): Promise<string | null> {
    // Implementation for routing to VIP agents
    return null;
  }

  private async findBestAgent(ticket: any): Promise<{ id: string } | null> {
    // Implementation for finding best available agent
    return null;
  }

  private async assignTicketToAgent(ticketId: string, agentId: string): Promise<void> {
    await supabase
      .from('support_tickets')
      .update({
        assigned_agent_id: agentId,
        status: 'in_progress',
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId);
  }

  private analyzeBookingPatterns(bookings: any[]): any {
    // Implementation for analyzing booking patterns
    return {
      prefersEvening: false,
      regularInterval: false
    };
  }

  private analyzeSupportPatterns(tickets: any[]): any {
    // Implementation for analyzing support patterns
    return {
      prefersSelfService: false,
      valuesQuickResolution: false
    };
  }

  private analyzeServicePreferences(bookings: any[]): any {
    // Implementation for analyzing service preferences
    return {
      preferredCategories: []
    };
  }

  private async handleVIPTicketCreation(ticket: any): Promise<void> {
    // Implementation for handling VIP ticket creation
  }

  private async handlePerformanceUpdate(payload: any): Promise<void> {
    // Implementation for handling performance updates
  }

  /**
   * Cleanup method for unsubscribing from real-time events
   */
  cleanup(): void {
    this.realTimeSubscriptions.forEach((subscription, key) => {
      supabase.removeChannel(subscription);
      this.realTimeSubscriptions.delete(key);
    });
  }
}