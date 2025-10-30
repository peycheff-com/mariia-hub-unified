import { supabase } from '@/integrations/supabase';
import { SupportService } from '@/services/support.service';
import type { Database, SupportTicketWithDetails } from '@/types/supabase';

export interface ClientProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  joinDate: string;
  totalBookings: number;
  totalSpent: number;
  lastBookingDate?: string;
  preferredServices: string[];
  vipStatus: 'standard' | 'premium' | 'vip';
  communicationPreferences: {
    email: boolean;
    sms: boolean;
    phone: boolean;
    preferredLanguage: 'en' | 'pl';
  };
  supportHistory: {
    totalTickets: number;
    resolvedTickets: number;
    satisfactionAvg: number;
    lastTicketDate?: string;
    frequentCategories: string[];
  };
  riskFactors: {
    lowSatisfaction: boolean;
    multipleEscalations: boolean;
    longResolutionTimes: boolean;
    recentComplaints: boolean;
  };
  relationshipScore: number; // 0-100
  nextContactDate?: string;
  notes: string;
}

export interface ClientInteraction {
  id: string;
  clientId: string;
  type: 'booking' | 'support_ticket' | 'payment' | 'cancellation' | 'inquiry' | 'feedback';
  date: string;
  description: string;
  outcome?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  value?: number; // For monetary interactions
  metadata: Record<string, any>;
}

export interface ClientSegment {
  id: string;
  name: string;
  criteria: {
    minSpent?: number;
    minBookings?: number;
    vipStatus?: string[];
    serviceCategories?: string[];
    satisfactionRange?: [number, number];
    bookingFrequency?: 'high' | 'medium' | 'low';
  };
  clientCount: number;
  lastUpdated: string;
}

export class ClientRelationshipService {
  // Get comprehensive client profile
  static async getClientProfile(clientId: string): Promise<ClientProfile | null> {
    try {
      // Get user profile and booking data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          bookings!bookings_user_id_fkey(id, service_id, total_amount, status, created_at, completed_at),
          user:auth.users(id, email, user_metadata)
        `)
        .eq('id', clientId)
        .single();

      if (profileError || !profile) return null;

      // Get support history
      const tickets = await SupportService.getTickets({ user_id: clientId });

      // Calculate client metrics
      const completedBookings = profile.bookings?.filter(b => b.status === 'completed') || [];
      const totalSpent = completedBookings.reduce((sum, booking) => sum + (booking.total_amount || 0), 0);
      const resolvedTickets = tickets.filter(t => t.status === 'resolved');

      // Determine VIP status
      const vipStatus = this.calculateVipStatus(totalSpent, completedBookings.length, tickets);

      // Analyze support history
      const supportHistory = this.analyzeSupportHistory(tickets);

      // Identify risk factors
      const riskFactors = this.identifyRiskFactors(tickets, resolvedTickets);

      // Calculate relationship score
      const relationshipScore = this.calculateRelationshipScore(
        totalSpent,
        completedBookings.length,
        supportHistory,
        riskFactors
      );

      // Get preferred services
      const preferredServices = this.getPreferredServices(completedBookings);

      return {
        id: clientId,
        email: profile.user?.email || '',
        name: profile.user?.user_metadata?.full_name || profile.user?.user_metadata?.name || 'Unknown',
        phone: profile.user?.user_metadata?.phone,
        joinDate: profile.created_at,
        totalBookings: completedBookings.length,
        totalSpent,
        lastBookingDate: completedBookings.length > 0
          ? new Date(Math.max(...completedBookings.map(b => new Date(b.completed_at || b.created_at).getTime()))).toISOString()
          : undefined,
        preferredServices,
        vipStatus,
        communicationPreferences: {
          email: profile.user?.user_metadata?.email_notifications !== false,
          sms: profile.user?.user_metadata?.sms_notifications === true,
          phone: profile.user?.user_metadata?.phone_notifications === true,
          preferredLanguage: (profile.user?.user_metadata?.language as 'en' | 'pl') || 'en'
        },
        supportHistory,
        riskFactors,
        relationshipScore,
        notes: profile.user?.user_metadata?.notes || ''
      };
    } catch (error) {
      console.error('Error getting client profile:', error);
      return null;
    }
  }

  // Get all clients with pagination and filtering
  static async getClients(filters?: {
    vipStatus?: ClientProfile['vipStatus'][];
    minSpent?: number;
    minBookings?: number;
    riskFactors?: keyof ClientProfile['riskFactors'][];
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<ClientProfile[]> {
    try {
      let query = supabase
        .from('profiles')
        .select(`
          *,
          user:auth.users(id, email, user_metadata),
          bookings!bookings_user_id_fkey(id, service_id, total_amount, status, created_at, completed_at)
        `)
        .eq('role', 'customer'); // Assuming customers have role 'customer'

      // Apply filters
      if (filters?.limit) query = query.limit(filters.limit);
      if (filters?.offset) query = query.range(filters.offset, filters.offset + filters.limit - 1);

      const { data: profiles, error } = await query;
      if (error || !profiles) return [];

      // Get all tickets for these users
      const userIds = profiles.map(p => p.id);
      const { data: allTickets } = await supabase
        .from('support_tickets')
        .select('*')
        .in('user_id', userIds);

      // Process each profile
      const clientProfiles: ClientProfile[] = [];
      for (const profile of profiles) {
        const userTickets = allTickets?.filter(t => t.user_id === profile.id) || [];
        const clientProfile = await this.getClientProfile(profile.id);

        if (clientProfile) {
          // Apply additional filters
          if (filters?.vipStatus?.length && !filters.vipStatus.includes(clientProfile.vipStatus)) continue;
          if (filters?.minSpent && clientProfile.totalSpent < filters.minSpent) continue;
          if (filters?.minBookings && clientProfile.totalBookings < filters.minBookings) continue;
          if (filters?.riskFactors?.length && !filters.riskFactors.some(risk => clientProfile.riskFactors[risk])) continue;
          if (filters?.search) {
            const searchLower = filters.search.toLowerCase();
            if (!clientProfile.name.toLowerCase().includes(searchLower) &&
                !clientProfile.email.toLowerCase().includes(searchLower)) continue;
          }

          clientProfiles.push(clientProfile);
        }
      }

      return clientProfiles;
    } catch (error) {
      console.error('Error getting clients:', error);
      return [];
    }
  }

  // Get client interaction timeline
  static async getClientInteractions(clientId: string, limit?: number): Promise<ClientInteraction[]> {
    try {
      const interactions: ClientInteraction[] = [];

      // Get bookings
      const { data: bookings } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', clientId)
        .order('created_at', { ascending: false })
        .limit(limit || 50);

      bookings?.forEach(booking => {
        interactions.push({
          id: `booking_${booking.id}`,
          clientId,
          type: 'booking',
          date: booking.created_at,
          description: `Booking for service ${booking.service_id}`,
          outcome: booking.status,
          value: booking.total_amount,
          metadata: { bookingId: booking.id, serviceId: booking.service_id }
        });
      });

      // Get support tickets
      const tickets = await SupportService.getTickets({ user_id: clientId, limit: limit || 50 });
      tickets.forEach(ticket => {
        interactions.push({
          id: `ticket_${ticket.id}`,
          clientId,
          type: 'support_ticket',
          date: ticket.created_at,
          description: ticket.subject,
          outcome: ticket.status,
          sentiment: ticket.customer_satisfaction_rating && ticket.customer_satisfaction_rating >= 4 ? 'positive' :
                   ticket.customer_satisfaction_rating && ticket.customer_satisfaction_rating <= 2 ? 'negative' : 'neutral',
          metadata: {
            ticketId: ticket.id,
            category: ticket.category,
            priority: ticket.priority,
            satisfaction: ticket.customer_satisfaction_rating
          }
        });
      });

      // Sort by date
      return interactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.error('Error getting client interactions:', error);
      return [];
    }
  }

  // Update client notes and preferences
  static async updateClientProfile(
    clientId: string,
    updates: Partial<Pick<ClientProfile, 'notes' | 'communicationPreferences' | 'nextContactDate'>>
  ): Promise<boolean> {
    try {
      const userMetadata: Record<string, any> = {};

      if (updates.notes !== undefined) userMetadata.notes = updates.notes;
      if (updates.communicationPreferences) {
        userMetadata.email_notifications = updates.communicationPreferences.email;
        userMetadata.sms_notifications = updates.communicationPreferences.sms;
        userMetadata.phone_notifications = updates.communicationPreferences.phone;
        userMetadata.language = updates.communicationPreferences.preferredLanguage;
      }
      if (updates.nextContactDate) userMetadata.next_contact_date = updates.nextContactDate;

      const { error } = await supabase
        .from('profiles')
        .update({
          user_metadata: userMetadata,
          updated_at: new Date().toISOString()
        })
        .eq('id', clientId);

      return !error;
    } catch (error) {
      console.error('Error updating client profile:', error);
      return false;
    }
  }

  // Create client segments
  static async createClientSegment(segment: Omit<ClientSegment, 'id' | 'clientCount' | 'lastUpdated'>): Promise<ClientSegment | null> {
    try {
      const { data, error } = await supabase
        .from('client_segments')
        .insert({
          name: segment.name,
          criteria: segment.criteria
        })
        .select()
        .single();

      if (error || !data) return null;

      // Calculate client count for this segment
      const clients = await this.getClientsByCriteria(segment.criteria);

      await supabase
        .from('client_segments')
        .update({ client_count: clients.length })
        .eq('id', data.id);

      return {
        ...data,
        clientCount: clients.length,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error creating client segment:', error);
      return null;
    }
  }

  // Get clients by criteria (for segmentation)
  static async getClientsByCriteria(criteria: ClientSegment['criteria']): Promise<ClientProfile[]> {
    const allClients = await this.getClients();

    return allClients.filter(client => {
      if (criteria.minSpent && client.totalSpent < criteria.minSpent) return false;
      if (criteria.minBookings && client.totalBookings < criteria.minBookings) return false;
      if (criteria.vipStatus?.length && !criteria.vipStatus.includes(client.vipStatus)) return false;
      if (criteria.satisfactionRange) {
        const [min, max] = criteria.satisfactionRange;
        if (client.supportHistory.satisfactionAvg < min || client.supportHistory.satisfactionAvg > max) return false;
      }

      return true;
    });
  }

  // Get at-risk clients
  static async getAtRiskClients(): Promise<ClientProfile[]> {
    const allClients = await this.getClients();

    return allClients.filter(client =>
      Object.values(client.riskFactors).some(risk => risk)
    ).sort((a, b) => {
      // Sort by relationship score (lowest first)
      return a.relationshipScore - b.relationshipScore;
    });
  }

  // Get VIP clients
  static async getVipClients(): Promise<ClientProfile[]> {
    const allClients = await this.getClients();

    return allClients
      .filter(client => client.vipStatus === 'vip' || client.vipStatus === 'premium')
      .sort((a, b) => {
        // Sort by relationship score and total spent
        const scoreA = a.relationshipScore + (a.totalSpent / 1000);
        const scoreB = b.relationshipScore + (b.totalSpent / 1000);
        return scoreB - scoreA;
      });
  }

  // Schedule follow-up for client
  static async scheduleFollowUp(
    clientId: string,
    followUpDate: string,
    notes: string,
    assignedAgentId?: string
  ): Promise<boolean> {
    try {
      // Add to client's profile
      await this.updateClientProfile(clientId, {
        nextContactDate: followUpDate
      });

      // Create follow-up task/task reminder
      const { error } = await supabase
        .from('client_follow_ups')
        .insert({
          client_id: clientId,
          follow_up_date: followUpDate,
          notes,
          assigned_agent_id: assignedAgentId,
          status: 'scheduled',
          created_at: new Date().toISOString()
        });

      return !error;
    } catch (error) {
      console.error('Error scheduling follow-up:', error);
      return false;
    }
  }

  // Helper methods
  private static calculateVipStatus(
    totalSpent: number,
    totalBookings: number,
    tickets: SupportTicketWithDetails[]
  ): ClientProfile['vipStatus'] {
    if (totalSpent >= 5000 || totalBookings >= 20) return 'vip';
    if (totalSpent >= 2000 || totalBookings >= 10) return 'premium';
    return 'standard';
  }

  private static analyzeSupportHistory(tickets: SupportTicketWithDetails[]) {
    const resolvedTickets = tickets.filter(t => t.status === 'resolved');
    const totalTickets = tickets.length;
    const resolvedCount = resolvedTickets.length;

    // Calculate satisfaction average
    const satisfactionRatings = resolvedTickets
      .map(t => t.customer_satisfaction_rating)
      .filter(r => r !== null && r !== undefined) as number[];

    const satisfactionAvg = satisfactionRatings.length > 0
      ? satisfactionRatings.reduce((sum, rating) => sum + rating, 0) / satisfactionRatings.length
      : 0;

    // Find frequent categories
    const categoryCounts = tickets.reduce((acc, ticket) => {
      acc[ticket.category] = (acc[ticket.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const frequentCategories = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category);

    return {
      totalTickets,
      resolvedTickets: resolvedCount,
      satisfactionAvg,
      lastTicketDate: tickets.length > 0 ? tickets[0].created_at : undefined,
      frequentCategories
    };
  }

  private static identifyRiskFactors(
    tickets: SupportTicketWithDetails[],
    resolvedTickets: SupportTicketWithDetails[]
  ): ClientProfile['riskFactors'] {
    const satisfactionRatings = resolvedTickets
      .map(t => t.customer_satisfaction_rating)
      .filter(r => r !== null && r !== undefined) as number[];

    const avgSatisfaction = satisfactionRatings.length > 0
      ? satisfactionRatings.reduce((sum, rating) => sum + rating, 0) / satisfactionRatings.length
      : 5; // Default to neutral if no ratings

    const escalatedTickets = tickets.filter(t => t.escalation_level > 0);
    const recentComplaints = tickets.filter(t =>
      t.category === 'complaint' &&
      new Date(t.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );

    // Calculate average resolution time
    const resolutionTimes = resolvedTickets
      .filter(t => t.resolved_at && t.created_at)
      .map(t => new Date(t.resolved_at!).getTime() - new Date(t.created_at).getTime());

    const avgResolutionTime = resolutionTimes.length > 0
      ? resolutionTimes.reduce((sum, time) => sum + time, 0) / resolutionTimes.length
      : 0;

    return {
      lowSatisfaction: avgSatisfaction < 3,
      multipleEscalations: escalatedTickets.length >= 2,
      longResolutionTimes: avgResolutionTime > 72 * 60 * 60 * 1000, // 3 days in milliseconds
      recentComplaints: recentComplaints.length >= 1
    };
  }

  private static calculateRelationshipScore(
    totalSpent: number,
    totalBookings: number,
    supportHistory: ClientProfile['supportHistory'],
    riskFactors: ClientProfile['riskFactors']
  ): number {
    let score = 50; // Base score

    // Positive factors
    score += Math.min(totalSpent / 100, 20); // Max 20 points for spending
    score += Math.min(totalBookings * 2, 15); // Max 15 points for booking frequency
    score += Math.min(supportHistory.satisfactionAvg * 5, 10); // Max 10 points for satisfaction

    // Negative factors
    if (riskFactors.lowSatisfaction) score -= 15;
    if (riskFactors.multipleEscalations) score -= 10;
    if (riskFactors.longResolutionTimes) score -= 5;
    if (riskFactors.recentComplaints) score -= 10;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private static getPreferredServices(bookings: any[]): string[] {
    const serviceCounts = bookings.reduce((acc, booking) => {
      acc[booking.service_id] = (acc[booking.service_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(serviceCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([serviceId]) => serviceId);
  }

  // Generate client insights and recommendations
  static async generateClientInsights(clientId: string): Promise<{
    insights: string[];
    recommendations: string[];
    nextActions: string[];
  }> {
    const profile = await this.getClientProfile(clientId);
    if (!profile) {
      return {
        insights: ['Client profile not found'],
        recommendations: [],
        nextActions: []
      };
    }

    const insights: string[] = [];
    const recommendations: string[] = [];
    const nextActions: string[] = [];

    // Generate insights based on client data
    if (profile.vipStatus === 'vip') {
      insights.push(`VIP client with ${profile.totalBookings} bookings and ${profile.totalSpent} PLN total spend`);
    }

    if (profile.supportHistory.satisfactionAvg < 3) {
      insights.push('Below average satisfaction rating requires attention');
      recommendations.push('Schedule personal follow-up call');
      nextActions.push('Review recent support interactions');
    }

    if (profile.riskFactors.multipleEscalations) {
      insights.push('Multiple escalations indicate potential service issues');
      recommendations.push('Assign senior agent for future interactions');
      nextActions.push('Analyze escalation patterns');
    }

    if (profile.relationshipScore < 40) {
      insights.push('Low relationship score indicates risk of churn');
      recommendations.push('Proactive outreach with special offers');
      nextActions.push('Schedule high-priority review');
    }

    if (profile.totalBookings === 0) {
      insights.push('New client with no bookings yet');
      recommendations.push('Welcome call and onboarding support');
      nextActions.push('Send personalized service recommendations');
    }

    if (profile.communicationPreferences.preferredLanguage === 'pl') {
      insights.push('Polish-speaking client');
      recommendations.push('Ensure Polish-language support availability');
    }

    return {
      insights,
      recommendations,
      nextActions
    };
  }
}