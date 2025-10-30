import { supabase } from '@/integrations/supabase';

export interface VIPClientProfile {
  id: string;
  name: string;
  email: string;
  tier: 'vip_platinum' | 'vip_gold' | 'vip_silver' | 'premium';
  joinDate: string;
  lifetimeValue: number;
  bookingCount: number;
  satisfactionScore: number;
  preferences: VIPClientPreferences;
  dedicatedAgent?: string;
  relationshipManager?: string;
  customServices: string[];
  exclusiveAccess: string[];
  riskStatus: 'low' | 'medium' | 'high';
  opportunityScore: number;
}

export interface VIPClientPreferences {
  communicationChannels: string[];
  preferredContactTimes: string[];
  language: string;
  personalInterests: string[];
  servicePreferences: string[];
  notificationSettings: {
    marketing: boolean;
    promotions: boolean;
    appointments: boolean;
    emergencies: boolean;
  };
  luxuryPreferences: {
    privacyLevel: 'standard' | 'enhanced' | 'maximum';
    personalizationLevel: 'basic' | 'advanced' | 'premium';
    whiteGloveService: boolean;
    priorityAccess: boolean;
  };
}

export interface WhiteGloveService {
  id: string;
  clientId: string;
  serviceType: 'personal_concierge' | 'priority_booking' | 'custom_scheduling' | 'exclusive_access' | 'emergency_support';
  status: 'requested' | 'active' | 'scheduled' | 'completed' | 'cancelled';
  priority: 'standard' | 'high' | 'urgent';
  scheduledAt?: string;
  assignedAgent?: string;
  customizations: any;
  progress: {
    stage: string;
    percentage: number;
    estimatedCompletion?: string;
  };
  notifications: {
    client: boolean;
    agent: boolean;
    manager: boolean;
  };
}

export interface VIPJourneyStage {
  id: string;
  clientId: string;
  stage: 'onboarding' | 'engagement' | 'retention' | 'advocacy' | 're-engagement';
  progress: number;
  milestones: Array<{
    name: string;
    completed: boolean;
    completedAt?: string;
  }>;
  nextActions: string[];
  personalizedContent: any;
  timeline: {
    startDate: string;
    expectedCompletion: string;
    actualCompletion?: string;
  };
}

export interface VIPInteraction {
  id: string;
  clientId: string;
  type: 'phone' | 'email' | 'chat' | 'video' | 'in_person' | 'automated';
  channel: string;
  timestamp: string;
  duration?: number;
  agent?: string;
  satisfaction?: number;
  outcome: string;
  notes: string;
  followUpRequired: boolean;
  followUpActions: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  tags: string[];
}

export class VIPClientExperienceManager {
  private vipProfiles: Map<string, VIPClientProfile> = new Map();
  private activeServices: Map<string, WhiteGloveService[]> = new Map();
  private journeyStages: Map<string, VIPJourneyStage> = new Map();

  constructor() {
    this.initializeVIPSystem();
  }

  /**
   * Get comprehensive VIP client profile
   */
  async getVIPClientProfile(clientId: string): Promise<VIPClientProfile | null> {
    try {
      // Check cache first
      if (this.vipProfiles.has(clientId)) {
        return this.vipProfiles.get(clientId)!;
      }

      const [
        profile,
        valueData,
        preferences,
        dedicatedAgent,
        relationshipManager
      ] = await Promise.all([
        this.getClientProfile(clientId),
        this.getClientValueData(clientId),
        this.getClientPreferences(clientId),
        this.getDedicatedAgent(clientId),
        this.getRelationshipManager(clientId)
      ]);

      if (!profile) return null;

      const tier = this.calculateVIPTier(profile, valueData);
      const riskStatus = await this.assessClientRisk(clientId, profile, valueData);
      const opportunityScore = await this.calculateOpportunityScore(clientId, profile, valueData);

      const vipProfile: VIPClientProfile = {
        id: clientId,
        name: profile.full_name || 'Unknown',
        email: profile.email || '',
        tier,
        joinDate: profile.created_at,
        lifetimeValue: valueData?.totalValue || 0,
        bookingCount: valueData?.bookingCount || 0,
        satisfactionScore: valueData?.averageSatisfaction || 5.0,
        preferences: preferences || this.getDefaultVIPPreferences(),
        dedicatedAgent: dedicatedAgent?.full_name,
        relationshipManager: relationshipManager?.full_name,
        customServices: await this.getClientCustomServices(clientId),
        exclusiveAccess: await this.getClientExclusiveAccess(clientId),
        riskStatus,
        opportunityScore
      };

      // Cache the profile
      this.vipProfiles.set(clientId, vipProfile);

      return vipProfile;
    } catch (error) {
      console.error('Failed to get VIP client profile:', error);
      return null;
    }
  }

  /**
   * Activate white-glove service for VIP client
   */
  async activateWhiteGloveService(
    clientId: string,
    serviceType: WhiteGloveService['serviceType'],
    priority: WhiteGloveService['priority'] = 'standard',
    customizations?: any
  ): Promise<WhiteGloveService> {
    try {
      const service: WhiteGloveService = {
        id: crypto.randomUUID(),
        clientId,
        serviceType,
        status: 'requested',
        priority,
        customizations: customizations || {},
        progress: {
          stage: 'initialization',
          percentage: 0
        },
        notifications: {
          client: true,
          agent: true,
          manager: true
        }
      };

      // Save service to database
      await supabase
        .from('white_glove_services')
        .insert({
          id: service.id,
          client_id: clientId,
          service_type: serviceType,
          status: 'requested',
          priority,
          customizations: customizations || {},
          created_at: new Date().toISOString()
        });

      // Update cache
      if (!this.activeServices.has(clientId)) {
        this.activeServices.set(clientId, []);
      }
      this.activeServices.get(clientId)!.push(service);

      // Trigger service activation workflow
      await this.executeServiceActivationWorkflow(service);

      return service;
    } catch (error) {
      console.error('Failed to activate white-glove service:', error);
      throw error;
    }
  }

  /**
   * Get VIP client journey stage and progress
   */
  async getClientJourneyStage(clientId: string): Promise<VIPJourneyStage | null> {
    try {
      // Check cache first
      if (this.journeyStages.has(clientId)) {
        return this.journeyStages.get(clientId)!;
      }

      const profile = await this.getVIPClientProfile(clientId);
      if (!profile) return null;

      const stage = this.determineJourneyStage(profile);
      const progress = await this.calculateJourneyProgress(clientId, stage);
      const milestones = await this.getJourneyMilestones(clientId, stage);
      const nextActions = await this.getNextJourneyActions(clientId, stage);
      const timeline = await this.getJourneyTimeline(clientId, stage);

      const journeyStage: VIPJourneyStage = {
        id: crypto.randomUUID(),
        clientId,
        stage,
        progress,
        milestones,
        nextActions,
        personalizedContent: await this.getPersonalizedContent(clientId, stage),
        timeline
      };

      // Cache the journey stage
      this.journeyStages.set(clientId, journeyStage);

      return journeyStage;
    } catch (error) {
      console.error('Failed to get client journey stage:', error);
      return null;
    }
  }

  /**
   * Record VIP client interaction
   */
  async recordVIPInteraction(interaction: Omit<VIPInteraction, 'id'>): Promise<VIPInteraction> {
    try {
      const newInteraction: VIPInteraction = {
        ...interaction,
        id: crypto.randomUUID()
      };

      // Save to database
      await supabase
        .from('vip_interactions')
        .insert({
          id: newInteraction.id,
          client_id: newInteraction.clientId,
          interaction_type: newInteraction.type,
          channel: newInteraction.channel,
          timestamp: newInteraction.timestamp,
          duration: newInteraction.duration,
          agent_id: newInteraction.agent,
          satisfaction_rating: newInteraction.satisfaction,
          outcome: newInteraction.outcome,
          notes: newInteraction.notes,
          follow_up_required: newInteraction.followUpRequired,
          follow_up_actions: newInteraction.followUpActions,
          sentiment: newInteraction.sentiment,
          tags: newInteraction.tags,
          created_at: new Date().toISOString()
        });

      // Update client profile based on interaction
      await this.updateProfileFromInteraction(newInteraction);

      return newInteraction;
    } catch (error) {
      console.error('Failed to record VIP interaction:', error);
      throw error;
    }
  }

  /**
   * Get personalized VIP experience recommendations
   */
  async getPersonalizedRecommendations(clientId: string): Promise<{
    services: Array<{
      name: string;
      description: string;
      priority: 'high' | 'medium' | 'low';
      reason: string;
    }>;
    content: Array<{
      type: string;
      title: string;
      description: string;
      relevanceScore: number;
    }>;
    offers: Array<{
      name: string;
      value: number;
      expiry: string;
      exclusivity: string;
    }>;
  }> {
    try {
      const profile = await this.getVIPClientProfile(clientId);
      if (!profile) {
        return { services: [], content: [], offers: [] };
      }

      const [
        serviceRecommendations,
        contentRecommendations,
        personalizedOffers
      ] = await Promise.all([
        this.getServiceRecommendations(profile),
        this.getContentRecommendations(profile),
        this.getPersonalizedOffers(profile)
      ]);

      return {
        services: serviceRecommendations,
        content: contentRecommendations,
        offers: personalizedOffers
      };
    } catch (error) {
      console.error('Failed to get personalized recommendations:', error);
      return { services: [], content: [], offers: [] };
    }
  }

  /**
   * Trigger proactive VIP outreach
   */
  async triggerProactiveOutreach(clientId: string, trigger: string): Promise<void> {
    try {
      const profile = await this.getVIPClientProfile(clientId);
      if (!profile) return;

      const outreachStrategy = await this.determineOutreachStrategy(profile, trigger);

      // Execute outreach based on strategy
      switch (outreachStrategy.type) {
        case 'personal_call':
          await this.schedulePersonalCall(clientId, outreachStrategy);
          break;
        case 'personalized_email':
          await this.sendPersonalizedEmail(clientId, outreachStrategy);
          break;
        case 'white_glove_service':
          await this.offerWhiteGloveService(clientId, outreachStrategy);
          break;
        case 'exclusive_access':
          await this.grantExclusiveAccess(clientId, outreachStrategy);
          break;
      }

      // Log outreach attempt
      await this.logProactiveOutreach(clientId, trigger, outreachStrategy);
    } catch (error) {
      console.error('Failed to trigger proactive outreach:', error);
      throw error;
    }
  }

  /**
   * Monitor VIP client satisfaction and wellness
   */
  async monitorVIPWellness(clientId: string): Promise<{
    satisfactionScore: number;
    riskFactors: string[];
    wellnessMetrics: {
      engagement: number;
      satisfaction: number;
      loyalty: number;
      advocacy: number;
    };
    alerts: Array<{
      type: 'satisfaction' | 'engagement' | 'risk' | 'opportunity';
      message: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
    }>;
  }> {
    try {
      const profile = await this.getVIPClientProfile(clientId);
      if (!profile) {
        throw new Error('VIP profile not found');
      }

      const [
        recentInteractions,
        satisfactionTrend,
        engagementMetrics,
        riskAnalysis
      ] = await Promise.all([
        this.getRecentInteractions(clientId),
        this.getSatisfactionTrend(clientId),
        this.getEngagementMetrics(clientId),
        this.analyzeRiskFactors(clientId, profile)
      ]);

      const wellnessMetrics = {
        engagement: engagementMetrics.score,
        satisfaction: satisfactionTrend.average,
        loyalty: this.calculateLoyaltyScore(profile, engagementMetrics),
        advocacy: this.calculateAdvocacyScore(profile, recentInteractions)
      };

      const alerts = await this.generateWellnessAlerts(
        profile,
        wellnessMetrics,
        riskAnalysis
      );

      return {
        satisfactionScore: profile.satisfactionScore,
        riskFactors: riskAnalysis.factors,
        wellnessMetrics,
        alerts
      };
    } catch (error) {
      console.error('Failed to monitor VIP wellness:', error);
      throw error;
    }
  }

  // Private helper methods
  private async initializeVIPSystem(): Promise<void> {
    // Initialize VIP monitoring and automation systems
    await this.setupVIPMonitoring();
    await this.initializeAutomatedWorkflows();
    await this.loadActiveVIPProfiles();
  }

  private async setupVIPMonitoring(): Promise<void> {
    // Set up real-time monitoring for VIP clients
    supabase
      .channel('vip-monitoring')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_tickets'
        },
        async (payload) => {
          const ticket = payload.new as any;
          if (await this.isVIPClient(ticket.user_id)) {
            await this.handleVIPTicketUpdate(ticket);
          }
        }
      )
      .subscribe();
  }

  private async initializeAutomatedWorkflows(): Promise<void> {
    // Set up automated workflows for VIP client management
    // This would include automated check-ins, birthday greetings, anniversary messages, etc.
  }

  private async loadActiveVIPProfiles(): Promise<void> {
    try {
      const { data: vipClients } = await supabase
        .from('profiles')
        .select('*')
        .in('tier', ['vip_platinum', 'vip_gold', 'vip_silver']);

      if (vipClients) {
        for (const client of vipClients) {
          const profile = await this.getVIPClientProfile(client.id);
          if (profile) {
            this.vipProfiles.set(client.id, profile);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load VIP profiles:', error);
    }
  }

  private async getClientProfile(clientId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', clientId)
      .single();

    if (error) throw error;
    return data;
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

  private async getClientPreferences(clientId: string) {
    const { data, error } = await supabase
      .from('client_preferences')
      .select('*')
      .eq('client_id', clientId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  private async getDedicatedAgent(clientId: string) {
    const { data, error } = await supabase
      .from('dedicated_agents')
      .select('*, profiles!dedicated_agents_agent_id_fkey(*)')
      .eq('client_id', clientId)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  private async getRelationshipManager(clientId: string) {
    const { data, error } = await supabase
      .from('relationship_managers')
      .select('*, profiles!relationship_managers_manager_id_fkey(*)')
      .eq('client_id', clientId)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  private calculateVIPTier(profile: any, valueData: any): VIPClientProfile['tier'] {
    if (!valueData) return 'premium';

    const totalValue = valueData.totalValue || 0;
    const bookingCount = valueData.bookingCount || 0;
    const satisfactionScore = valueData.averageSatisfaction || 0;

    if (totalValue > 100000 && bookingCount > 50 && satisfactionScore >= 4.9) {
      return 'vip_platinum';
    } else if (totalValue > 50000 && bookingCount > 25 && satisfactionScore >= 4.7) {
      return 'vip_gold';
    } else if (totalValue > 20000 && bookingCount > 10 && satisfactionScore >= 4.5) {
      return 'vip_silver';
    }

    return 'premium';
  }

  private async assessClientRisk(clientId: string, profile: any, valueData: any): Promise<'low' | 'medium' | 'high'> {
    const [
      recentTickets,
      satisfactionTrend,
      bookingTrend
    ] = await Promise.all([
      this.getRecentTickets(clientId),
      this.getSatisfactionTrend(clientId),
      this.getBookingTrend(clientId)
    ]);

    let riskScore = 0;

    // High number of recent support tickets
    if (recentTickets.length > 5) riskScore += 2;

    // Declining satisfaction
    if (satisfactionTrend.trend < -0.5) riskScore += 3;

    // Declining booking frequency
    if (bookingTrend.trend < -0.3) riskScore += 2;

    // Long time since last interaction
    const daysSinceLastInteraction = this.getDaysSinceLastInteraction(clientId);
    if (daysSinceLastInteraction > 90) riskScore += 2;

    if (riskScore >= 5) return 'high';
    if (riskScore >= 3) return 'medium';
    return 'low';
  }

  private async calculateOpportunityScore(clientId: string, profile: any, valueData: any): Promise<number> {
    const [
      upsellPotential,
      referralPotential,
      loyaltyPotential
    ] = await Promise.all([
      this.assessUpsellPotential(clientId),
      this.assessReferralPotential(clientId),
      this.assessLoyaltyPotential(clientId)
    ]);

    return (upsellPotential + referralPotential + loyaltyPotential) / 3;
  }

  private getDefaultVIPPreferences(): VIPClientPreferences {
    return {
      communicationChannels: ['email', 'phone'],
      preferredContactTimes: ['09:00-17:00'],
      language: 'en',
      personalInterests: [],
      servicePreferences: [],
      notificationSettings: {
        marketing: true,
        promotions: true,
        appointments: true,
        emergencies: true
      },
      luxuryPreferences: {
        privacyLevel: 'enhanced',
        personalizationLevel: 'advanced',
        whiteGloveService: true,
        priorityAccess: true
      }
    };
  }

  private async getClientCustomServices(clientId: string): Promise<string[]> {
    const { data } = await supabase
      .from('client_custom_services')
      .select('service_name')
      .eq('client_id', clientId)
      .eq('is_active', true);

    return data?.map(s => s.service_name) || [];
  }

  private async getClientExclusiveAccess(clientId: string): Promise<string[]> {
    const { data } = await supabase
      .from('exclusive_access')
      .select('access_type')
      .eq('client_id', clientId)
      .eq('is_active', true);

    return data?.map(a => a.access_type) || [];
  }

  private async executeServiceActivationWorkflow(service: WhiteGloveService): Promise<void> {
    // Implementation for service activation workflow
    // This would include agent assignment, client notification, progress tracking, etc.
  }

  private determineJourneyStage(profile: VIPClientProfile): VIPJourneyStage['stage'] {
    const daysSinceJoin = Math.floor(
      (Date.now() - new Date(profile.joinDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceJoin < 30) return 'onboarding';
    if (daysSinceJoin < 90) return 'engagement';
    if (profile.bookingCount > 10) return 'retention';
    if (profile.satisfactionScore > 4.8) return 'advocacy';
    return 're-engagement';
  }

  private async calculateJourneyProgress(clientId: string, stage: string): Promise<number> {
    // Implementation for calculating journey progress based on stage-specific metrics
    return 75; // Placeholder
  }

  private async getJourneyMilestones(clientId: string, stage: string): Promise<any[]> {
    // Implementation for getting journey milestones
    return [];
  }

  private async getNextJourneyActions(clientId: string, stage: string): Promise<string[]> {
    // Implementation for getting next actions in journey
    return [];
  }

  private async getPersonalizedContent(clientId: string, stage: string): Promise<any> {
    // Implementation for getting personalized content
    return {};
  }

  private async getJourneyTimeline(clientId: string, stage: string): Promise<any> {
    // Implementation for getting journey timeline
    return {
      startDate: new Date().toISOString(),
      expectedCompletion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };
  }

  private async updateProfileFromInteraction(interaction: VIPInteraction): Promise<void> {
    // Update cached profile based on interaction data
    const cachedProfile = this.vipProfiles.get(interaction.clientId);
    if (cachedProfile && interaction.satisfaction) {
      // Update satisfaction score with rolling average
      cachedProfile.satisfactionScore = (cachedProfile.satisfactionScore + interaction.satisfaction) / 2;
      this.vipProfiles.set(interaction.clientId, cachedProfile);
    }
  }

  private async isVIPClient(clientId: string): Promise<boolean> {
    const { data } = await supabase
      .from('profiles')
      .select('tier')
      .eq('id', clientId)
      .single();

    return data?.tier ? ['vip_platinum', 'vip_gold', 'vip_silver'].includes(data.tier) : false;
  }

  private async handleVIPTicketUpdate(ticket: any): Promise<void> {
    // Handle VIP ticket updates with priority routing and notifications
  }

  private async getServiceRecommendations(profile: VIPClientProfile): Promise<any[]> {
    // Implementation for service recommendations
    return [];
  }

  private async getContentRecommendations(profile: VIPClientProfile): Promise<any[]> {
    // Implementation for content recommendations
    return [];
  }

  private async getPersonalizedOffers(profile: VIPClientProfile): Promise<any[]> {
    // Implementation for personalized offers
    return [];
  }

  private async determineOutreachStrategy(profile: VIPClientProfile, trigger: string): Promise<any> {
    // Implementation for determining outreach strategy
    return {
      type: 'personalized_email',
      priority: 'medium',
      content: 'Personalized outreach content'
    };
  }

  private async schedulePersonalCall(clientId: string, strategy: any): Promise<void> {
    // Implementation for scheduling personal call
  }

  private async sendPersonalizedEmail(clientId: string, strategy: any): Promise<void> {
    // Implementation for sending personalized email
  }

  private async offerWhiteGloveService(clientId: string, strategy: any): Promise<void> {
    // Implementation for offering white-glove service
  }

  private async grantExclusiveAccess(clientId: string, strategy: any): Promise<void> {
    // Implementation for granting exclusive access
  }

  private async logProactiveOutreach(clientId: string, trigger: string, strategy: any): Promise<void> {
    // Implementation for logging proactive outreach
  }

  // Additional helper methods would be implemented here...
  private async getRecentTickets(clientId: string): Promise<any[]> { return []; }
  private async getSatisfactionTrend(clientId: string): Promise<any> { return { trend: 0, average: 4.5 }; }
  private async getBookingTrend(clientId: string): Promise<any> { return { trend: 0 }; }
  private getDaysSinceLastInteraction(clientId: string): number { return 30; }
  private async assessUpsellPotential(clientId: string): Promise<number> { return 75; }
  private async assessReferralPotential(clientId: string): Promise<number> { return 80; }
  private async assessLoyaltyPotential(clientId: string): Promise<number> { return 85; }
  private async getRecentInteractions(clientId: string): Promise<any[]> { return []; }
  private async getEngagementMetrics(clientId: string): Promise<any> { return { score: 75 }; }
  private async analyzeRiskFactors(clientId: string, profile: VIPClientProfile): Promise<any> { return { factors: [] }; }
  private calculateLoyaltyScore(profile: VIPClientProfile, engagement: any): number { return 85; }
  private calculateAdvocacyScore(profile: VIPClientProfile, interactions: any[]): number { return 80; }
  private async generateWellnessAlerts(profile: VIPClientProfile, metrics: any, risk: any): Promise<any[]> { return []; }
}