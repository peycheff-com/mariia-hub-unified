import { SupportService } from './support.service';
import { ClientRelationshipService } from './client-relationship.service';
import { KnowledgeBaseService } from './knowledge-base.service';
import { SupportAnalyticsService } from './support-analytics.service';
import { TicketRoutingService } from './ticket-routing.service';
import { CommunicationService } from '../lib/communication/communication-service';
import type {
  SupportTicketWithDetails,
  ClientProfile,
  KnowledgeBaseArticle,
  SupportMetrics,
  CRMData,
  CommunicationMessage
} from '@/types/supabase';

/**
 * Unified Support Service
 * Integrates all support systems (tickets, CRM, knowledge base, analytics, communication)
 * into a single, seamless service with real-time data synchronization.
 */

export interface UnifiedSupportData {
  tickets: SupportTicketWithDetails[];
  clientProfile: ClientProfile | null;
  knowledgeBase: {
    articles: KnowledgeBaseArticle[];
    categories: any[];
    searchResults: KnowledgeBaseArticle[];
  };
  analytics: SupportMetrics | null;
  communications: CommunicationMessage[];
  crmData: CRMData | null;
  lastSync: string;
  systemHealth: {
    tickets: 'healthy' | 'warning' | 'error';
    crm: 'healthy' | 'warning' | 'error';
    knowledgeBase: 'healthy' | 'warning' | 'error';
    analytics: 'healthy' | 'warning' | 'error';
    communications: 'healthy' | 'warning' | 'error';
  };
}

export interface SupportWorkflow {
  id: string;
  clientId: string;
  trigger: 'ticket_created' | 'client_inquiry' | 'escalation' | 'vip_request' | 'proactive_outreach';
  steps: WorkflowStep[];
  currentStep: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedAgent?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'automated' | 'manual' | 'conditional';
  action: string;
  parameters: Record<string, any>;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  result?: any;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface IntegratedEvent {
  id: string;
  type: 'ticket_event' | 'client_event' | 'communication_event' | 'analytics_event' | 'system_event';
  source: 'tickets' | 'crm' | 'knowledge_base' | 'analytics' | 'communications';
  action: string;
  data: any;
  timestamp: string;
  clientId?: string;
  ticketId?: string;
  agentId?: string;
  processed: boolean;
}

class UnifiedSupportService {
  private static instance: UnifiedSupportService;
  private dataCache: Map<string, any> = new Map();
  private eventQueue: IntegratedEvent[] = [];
  private workflows: Map<string, SupportWorkflow> = new Map();
  private subscribers: Map<string, Function[]> = new Map();
  private syncInProgress = false;
  private lastSyncTime: Date | null = null;

  private constructor() {
    this.initializeRealtimeSubscriptions();
    this.startEventProcessor();
    this.startPeriodicSync();
  }

  public static getInstance(): UnifiedSupportService {
    if (!UnifiedSupportService.instance) {
      UnifiedSupportService.instance = new UnifiedSupportService();
    }
    return UnifiedSupportService.instance;
  }

  // ========== DATA INTEGRATION ==========

  /**
   * Get unified support data for a client or agent
   */
  async getUnifiedSupportData(params: {
    clientId?: string;
    agentId?: string;
    ticketId?: string;
    includeHistory?: boolean;
    realTime?: boolean;
  }): Promise<UnifiedSupportData> {
    const cacheKey = `unified_${JSON.stringify(params)}`;

    if (this.dataCache.has(cacheKey) && !params.realTime) {
      return this.dataCache.get(cacheKey);
    }

    try {
      const [
        tickets,
        clientProfile,
        knowledgeBase,
        analytics,
        communications,
        crmData,
        systemHealth
      ] = await Promise.all([
        this.getTicketsData(params),
        this.getClientProfileData(params.clientId),
        this.getKnowledgeBaseData(),
        this.getAnalyticsData(params),
        this.getCommunicationsData(params),
        this.getCRMData(params.clientId),
        this.getSystemHealth()
      ]);

      const unifiedData: UnifiedSupportData = {
        tickets,
        clientProfile,
        knowledgeBase,
        analytics,
        communications,
        crmData,
        lastSync: new Date().toISOString(),
        systemHealth
      };

      this.dataCache.set(cacheKey, unifiedData);
      this.lastSyncTime = new Date();

      return unifiedData;
    } catch (error) {
      console.error('Error getting unified support data:', error);
      throw error;
    }
  }

  private async getTicketsData(params: any): Promise<SupportTicketWithDetails[]> {
    const filters: any = {};

    if (params.clientId) {
      filters.user_id = params.clientId;
    }

    if (params.agentId) {
      filters.assigned_agent_id = params.agentId;
    }

    if (params.ticketId) {
      filters.id = params.ticketId;
    }

    return await SupportService.getTickets(filters);
  }

  private async getClientProfileData(clientId?: string): Promise<ClientProfile | null> {
    if (!clientId) return null;
    return await ClientRelationshipService.getClientProfile(clientId);
  }

  private async getKnowledgeBaseData() {
    const [articles, categories] = await Promise.all([
      SupportService.getKnowledgeBaseArticles({ status: 'published' }),
      SupportService.getKnowledgeBaseCategories()
    ]);

    return {
      articles,
      categories,
      searchResults: []
    };
  }

  private async getAnalyticsData(params: any): Promise<SupportMetrics | null> {
    if (params.agentId) {
      return await SupportAnalyticsService.getAgentMetrics(params.agentId);
    }

    if (params.clientId) {
      return await SupportAnalyticsService.getClientMetrics(params.clientId);
    }

    return await SupportAnalyticsService.getSupportMetrics();
  }

  private async getCommunicationsData(params: any): Promise<CommunicationMessage[]> {
    const filters: any = {};

    if (params.clientId) {
      filters.client_id = params.clientId;
    }

    if (params.ticketId) {
      filters.ticket_id = params.ticketId;
    }

    return await CommunicationService.getMessages(filters);
  }

  private async getCRMData(clientId?: string): Promise<CRMData | null> {
    if (!clientId) return null;
    return await ClientRelationshipService.getCRMData(clientId);
  }

  private async getSystemHealth() {
    const healthChecks = await Promise.allSettled([
      SupportService.healthCheck(),
      ClientRelationshipService.healthCheck(),
      SupportService.healthCheck(), // KB health check
      SupportAnalyticsService.healthCheck(),
      CommunicationService.healthCheck()
    ]);

    return {
      tickets: healthChecks[0].status === 'fulfilled' ? 'healthy' : 'error',
      crm: healthChecks[1].status === 'fulfilled' ? 'healthy' : 'error',
      knowledgeBase: healthChecks[2].status === 'fulfilled' ? 'healthy' : 'error',
      analytics: healthChecks[3].status === 'fulfilled' ? 'healthy' : 'error',
      communications: healthChecks[4].status === 'fulfilled' ? 'healthy' : 'error'
    };
  }

  // ========== WORKFLOW AUTOMATION ==========

  /**
   * Create and execute support workflow
   */
  async createSupportWorkflow(trigger: string, data: any): Promise<SupportWorkflow> {
    const workflow: SupportWorkflow = {
      id: `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      clientId: data.clientId,
      trigger: trigger as any,
      steps: this.generateWorkflowSteps(trigger, data),
      currentStep: 0,
      status: 'pending',
      priority: data.priority || 'medium',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.workflows.set(workflow.id, workflow);

    // Emit workflow created event
    this.emitEvent({
      id: `evt_${Date.now()}`,
      type: 'system_event',
      source: 'workflows',
      action: 'workflow_created',
      data: workflow,
      timestamp: new Date().toISOString(),
      processed: false
    });

    // Start workflow execution
    this.executeWorkflow(workflow.id);

    return workflow;
  }

  private generateWorkflowSteps(trigger: string, data: any): WorkflowStep[] {
    const baseSteps: WorkflowStep[] = [];

    switch (trigger) {
      case 'ticket_created':
        baseSteps.push(
          {
            id: 'analyze_ticket',
            name: 'Analyze Ticket',
            type: 'automated',
            action: 'analyze_ticket_sentiment',
            parameters: { ticketId: data.ticketId },
            status: 'pending'
          },
          {
            id: 'route_ticket',
            name: 'Route to Agent',
            type: 'automated',
            action: 'intelligent_routing',
            parameters: { ticketId: data.ticketId },
            status: 'pending'
          },
          {
            id: 'send_acknowledgment',
            name: 'Send Acknowledgment',
            type: 'automated',
            action: 'send_ticket_acknowledgment',
            parameters: { ticketId: data.ticketId, clientId: data.clientId },
            status: 'pending'
          },
          {
            id: 'set_sla',
            name: 'Set SLA',
            type: 'automated',
            action: 'set_ticket_sla',
            parameters: { ticketId: data.ticketId, priority: data.priority },
            status: 'pending'
          }
        );
        break;

      case 'vip_request':
        baseSteps.push(
          {
            id: 'vip_verification',
            name: 'Verify VIP Status',
            type: 'automated',
            action: 'verify_vip_status',
            parameters: { clientId: data.clientId },
            status: 'pending'
          },
          {
            id: 'assign_dedicated_agent',
            name: 'Assign Dedicated Agent',
            type: 'automated',
            action: 'assign_dedicated_agent',
            parameters: { clientId: data.clientId, serviceType: data.serviceType },
            status: 'pending'
          },
          {
            id: 'priority_queue',
            name: 'Add to Priority Queue',
            type: 'automated',
            action: 'add_to_priority_queue',
            parameters: { clientId: data.clientId },
            status: 'pending'
          },
          {
            id: 'notify_management',
            name: 'Notify Management',
            type: 'automated',
            action: 'notify_management',
            parameters: { clientId: data.clientId, requestType: data.requestType },
            status: 'pending'
          }
        );
        break;

      case 'escalation':
        baseSteps.push(
          {
            id: 'assess_severity',
            name: 'Assess Escalation Severity',
            type: 'automated',
            action: 'assess_escalation_severity',
            parameters: { ticketId: data.ticketId },
            status: 'pending'
          },
          {
            id: 'notify_escalation_team',
            name: 'Notify Escalation Team',
            type: 'automated',
            action: 'notify_escalation_team',
            parameters: { ticketId: data.ticketId, severity: data.severity },
            status: 'pending'
          },
          {
            id: 'update_client',
            name: 'Update Client',
            type: 'automated',
            action: 'send_escalation_update',
            parameters: { ticketId: data.ticketId, clientId: data.clientId },
            status: 'pending'
          }
        );
        break;
    }

    return baseSteps;
  }

  private async executeWorkflow(workflowId: string): Promise<void> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return;

    workflow.status = 'in_progress';
    workflow.updatedAt = new Date().toISOString();

    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];
      workflow.currentStep = i;

      try {
        step.status = 'in_progress';
        step.startedAt = new Date().toISOString();
        workflow.updatedAt = new Date().toISOString();

        const result = await this.executeWorkflowStep(step);

        step.status = 'completed';
        step.result = result;
        step.completedAt = new Date().toISOString();
        workflow.updatedAt = new Date().toISOString();

        // Emit step completed event
        this.emitEvent({
          id: `evt_${Date.now()}`,
          type: 'system_event',
          source: 'workflows',
          action: 'step_completed',
          data: { workflowId, stepId: step.id, result },
          timestamp: new Date().toISOString(),
          processed: false
        });

      } catch (error) {
        step.status = 'failed';
        step.error = error instanceof Error ? error.message : 'Unknown error';
        step.completedAt = new Date().toISOString();
        workflow.updatedAt = new Date().toISOString();

        // Emit step failed event
        this.emitEvent({
          id: `evt_${Date.now()}`,
          type: 'system_event',
          source: 'workflows',
          action: 'step_failed',
          data: { workflowId, stepId: step.id, error: step.error },
          timestamp: new Date().toISOString(),
          processed: false
        });

        break; // Stop workflow on step failure
      }
    }

    // Check if workflow completed
    const allStepsCompleted = workflow.steps.every(step =>
      step.status === 'completed' || step.status === 'skipped'
    );

    if (allStepsCompleted) {
      workflow.status = 'completed';
      workflow.completedAt = new Date().toISOString();
    } else {
      workflow.status = 'failed';
    }

    workflow.updatedAt = new Date().toISOString();

    // Emit workflow completed event
    this.emitEvent({
      id: `evt_${Date.now()}`,
      type: 'system_event',
      source: 'workflows',
      action: 'workflow_completed',
      data: workflow,
      timestamp: new Date().toISOString(),
      processed: false
    });
  }

  private async executeWorkflowStep(step: WorkflowStep): Promise<any> {
    switch (step.action) {
      case 'analyze_ticket_sentiment':
        return await this.analyzeTicketSentiment(step.parameters.ticketId);

      case 'intelligent_routing':
        return await TicketRoutingService.routeTicket(step.parameters.ticketId);

      case 'send_ticket_acknowledgment':
        return await CommunicationService.sendMessage({
          client_id: step.parameters.clientId,
          ticket_id: step.parameters.ticketId,
          type: 'email',
          subject: 'Support Ticket Received',
          content: 'Thank you for contacting us. We have received your ticket and will respond shortly.',
          automated: true
        });

      case 'set_ticket_sla':
        return await SupportService.updateTicket(step.parameters.ticketId, {
          sla_hours: this.calculateSLA(step.parameters.priority)
        });

      case 'verify_vip_status':
        return await ClientRelationshipService.verifyVIPStatus(step.parameters.clientId);

      case 'assign_dedicated_agent':
        return await TicketRoutingService.assignDedicatedAgent(
          step.parameters.clientId,
          step.parameters.serviceType
        );

      case 'notify_escalation_team':
        return await CommunicationService.sendNotification({
          type: 'escalation',
          recipients: ['escalation_team'],
          data: step.parameters
        });

      default:
        throw new Error(`Unknown workflow step action: ${step.action}`);
    }
  }

  private calculateSLA(priority: string): number {
    const slaHours = {
      urgent: 1,
      high: 4,
      medium: 24,
      low: 72
    };
    return slaHours[priority as keyof typeof slaHours] || 24;
  }

  // ========== EVENT SYSTEM ==========

  /**
   * Emit an integrated event
   */
  private emitEvent(event: IntegratedEvent): void {
    this.eventQueue.push(event);
    this.processEvents();
  }

  /**
   * Process events in the queue
   */
  private async processEvents(): Promise<void> {
    if (this.syncInProgress) return;

    this.syncInProgress = true;

    try {
      while (this.eventQueue.length > 0) {
        const event = this.eventQueue.shift();
        if (!event) break;

        await this.processEvent(event);
        event.processed = true;
      }
    } catch (error) {
      console.error('Error processing events:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  private async processEvent(event: IntegratedEvent): Promise<void> {
    // Update relevant data caches
    switch (event.type) {
      case 'ticket_event':
        this.invalidateCache(['tickets', 'analytics']);
        break;
      case 'client_event':
        this.invalidateCache(['clientProfile', 'crmData', 'analytics']);
        break;
      case 'communication_event':
        this.invalidateCache(['communications']);
        break;
      case 'analytics_event':
        this.invalidateCache(['analytics']);
        break;
    }

    // Notify subscribers
    this.notifySubscribers(event.type, event);
  }

  // ========== REAL-TIME SUBSCRIPTIONS ==========

  private initializeRealtimeSubscriptions(): void {
    // Subscribe to ticket changes
    SupportService.subscribeToTicketChanges((payload) => {
      this.emitEvent({
        id: `evt_${Date.now()}`,
        type: 'ticket_event',
        source: 'tickets',
        action: payload.eventType,
        data: payload,
        timestamp: new Date().toISOString(),
        ticketId: payload.record?.id,
        processed: false
      });

      // Auto-trigger workflows
      if (payload.eventType === 'INSERT') {
        this.createSupportWorkflow('ticket_created', {
          ticketId: payload.record.id,
          clientId: payload.record.user_id,
          priority: payload.record.priority
        });
      }
    });

    // Subscribe to client changes
    ClientRelationshipService.subscribeToClientChanges((payload) => {
      this.emitEvent({
        id: `evt_${Date.now()}`,
        type: 'client_event',
        source: 'crm',
        action: payload.eventType,
        data: payload,
        timestamp: new Date().toISOString(),
        clientId: payload.record?.id,
        processed: false
      });
    });

    // Subscribe to communication changes
    CommunicationService.subscribeToCommunicationChanges((payload) => {
      this.emitEvent({
        id: `evt_${Date.now()}`,
        type: 'communication_event',
        source: 'communications',
        action: payload.eventType,
        data: payload,
        timestamp: new Date().toISOString(),
        processed: false
      });
    });
  }

  // ========== UTILITY METHODS ==========

  private invalidateCache(types: string[]): void {
    // Clear cache entries that contain any of the specified types
    for (const [key] of this.dataCache) {
      if (types.some(type => key.includes(type))) {
        this.dataCache.delete(key);
      }
    }
  }

  private startEventProcessor(): void {
    // Process events every 100ms
    setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.processEvents();
      }
    }, 100);
  }

  private startPeriodicSync(): void {
    // Sync data every 5 minutes
    setInterval(() => {
      this.dataCache.clear();
      this.lastSyncTime = new Date();
    }, 5 * 60 * 1000);
  }

  // ========== PUBLIC API METHODS ==========

  /**
   * Create a support ticket with full integration
   */
  async createIntegratedTicket(ticketData: any): Promise<SupportTicketWithDetails> {
    // Create the ticket
    const ticket = await SupportService.createTicket(ticketData);

    // Update client profile
    if (ticketData.user_id) {
      await ClientRelationshipService.updateClientActivity(ticketData.user_id, {
        lastTicketDate: new Date().toISOString(),
        totalTickets: { increment: 1 }
      });
    }

    // Log communication
    await CommunicationService.logCommunication({
      type: 'ticket_created',
      ticket_id: ticket.id,
      client_id: ticketData.user_id,
      channel: 'web',
      automated: true
    });

    // Trigger analytics update
    await SupportAnalyticsService.recordTicketCreated(ticket);

    // Return integrated ticket data
    return ticket;
  }

  /**
   * Update a support ticket with full integration
   */
  async updateIntegratedTicket(ticketId: string, updates: any): Promise<SupportTicketWithDetails> {
    const ticket = await SupportService.updateTicket(ticketId, updates);

    // Update analytics
    if (updates.status === 'resolved') {
      await SupportAnalyticsService.recordTicketResolved(ticket);
    }

    // Send notification if needed
    if (updates.assigned_agent_id) {
      await CommunicationService.sendAgentNotification({
        agentId: updates.assigned_agent_id,
        ticketId: ticket.id,
        type: 'ticket_assigned'
      });
    }

    return ticket;
  }

  /**
   * Get comprehensive client view
   */
  async getComprehensiveClientView(clientId: string): Promise<any> {
    return await this.getUnifiedSupportData({
      clientId,
      includeHistory: true,
      realTime: true
    });
  }

  /**
   * Search across all integrated systems
   */
  async searchIntegratedSystems(query: string, options: any = {}): Promise<any> {
    const [ticketResults, kbResults, clientResults] = await Promise.all([
      SupportService.searchTickets(query),
      SupportService.searchKnowledgeBase(query),
      ClientRelationshipService.searchClients(query)
    ]);

    return {
      tickets: ticketResults,
      knowledgeBase: kbResults,
      clients: clientResults,
      total: ticketResults.length + kbResults.length + clientResults.length
    };
  }

  /**
   * Subscribe to integrated events
   */
  subscribe(eventType: string, callback: Function): string {
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, []);
    }

    this.subscribers.get(eventType)!.push({ id: subscriptionId, callback });

    return subscriptionId;
  }

  /**
   * Unsubscribe from events
   */
  unsubscribe(subscriptionId: string): void {
    for (const [eventType, subscriptions] of this.subscribers) {
      const index = subscriptions.findIndex((sub: any) => sub.id === subscriptionId);
      if (index !== -1) {
        subscriptions.splice(index, 1);
        break;
      }
    }
  }

  private notifySubscribers(eventType: string, event: IntegratedEvent): void {
    const subscriptions = this.subscribers.get(eventType);
    if (subscriptions) {
      subscriptions.forEach(({ callback }: any) => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in subscription callback:', error);
        }
      });
    }
  }

  // ========== HEALTH AND MONITORING ==========

  async getSystemStatus(): Promise<any> {
    const [
      ticketHealth,
      crmHealth,
      kbHealth,
      analyticsHealth,
      commHealth
    ] = await Promise.all([
      SupportService.healthCheck(),
      ClientRelationshipService.healthCheck(),
      SupportService.healthCheck(), // KB health
      SupportAnalyticsService.healthCheck(),
      CommunicationService.healthCheck()
    ]);

    return {
      overall: this.calculateOverallHealth([ticketHealth, crmHealth, kbHealth, analyticsHealth, commHealth]),
      services: {
        tickets: ticketHealth,
        crm: crmHealth,
        knowledgeBase: kbHealth,
        analytics: analyticsHealth,
        communications: commHealth
      },
      lastSync: this.lastSyncTime,
      activeWorkflows: Array.from(this.workflows.values()).filter(w => w.status === 'in_progress').length,
      queuedEvents: this.eventQueue.length
    };
  }

  private calculateOverallHealth(healthChecks: any[]): 'healthy' | 'warning' | 'error' {
    const errors = healthChecks.filter(h => h.status === 'error').length;
    const warnings = healthChecks.filter(h => h.status === 'warning').length;

    if (errors > 0) return 'error';
    if (warnings > 0) return 'warning';
    return 'healthy';
  }

  // ========== ANALYTICS METHODS ==========

  async getIntegratedAnalytics(params: any = {}): Promise<any> {
    const [ticketAnalytics, clientAnalytics, communicationAnalytics, performanceAnalytics] = await Promise.all([
      SupportAnalyticsService.getTicketAnalytics(params),
      SupportAnalyticsService.getClientAnalytics(params),
      CommunicationService.getCommunicationAnalytics(params),
      SupportAnalyticsService.getPerformanceAnalytics(params)
    ]);

    return {
      tickets: ticketAnalytics,
      clients: clientAnalytics,
      communications: communicationAnalytics,
      performance: performanceAnalytics,
      generatedAt: new Date().toISOString()
    };
  }

  // ========== UTILITY METHODS ==========

  private async analyzeTicketSentiment(ticketId: string): Promise<any> {
    // Implementation would integrate with AI service for sentiment analysis
    return {
      sentiment: 'neutral',
      confidence: 0.85,
      emotions: {
        satisfaction: 0.7,
        frustration: 0.2,
        urgency: 0.1
      }
    };
  }
}

// Export singleton instance
export const unifiedSupportService = UnifiedSupportService.getInstance();