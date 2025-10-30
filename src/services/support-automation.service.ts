import { supabase } from '@/integrations/supabase/client';
import { getAIService } from '@/integrations/ai/core/AIService';
import {
  SupportTicket,
  KnowledgeBaseArticle,
  CustomerProfile,
  AutomationRule,
  SLAPolicy,
  ChatbotConfig,
  AIInsight,
  AIRecommendation,
  KnowledgeSearchResult,
  SentimentAnalysis,
  CustomerIntent,
  calculateTicketValue,
  estimateResolutionTime,
  calculateChurnRisk
} from '@/types/support-automation';

export class SupportAutomationService {
  private aiService = getAIService();

  // Ticket Management
  async createTicket(ticketData: Partial<SupportTicket>): Promise<SupportTicket> {
    try {
      // Enrich ticket with AI processing
      const enrichedTicket = await this.enrichTicket(ticketData);

      // Insert into database
      const { data, error } = await supabase
        .from('support_tickets')
        .insert(enrichedTicket)
        .select()
        .single();

      if (error) throw error;

      // Process automation rules
      await this.processAutomationRules('ticket_created', data);

      // Generate AI insights
      await this.generateTicketInsights(data);

      return data;
    } catch (error) {
      console.error('Error creating support ticket:', error);
      throw error;
    }
  }

  async updateTicket(ticketId: string, updates: Partial<SupportTicket>): Promise<SupportTicket> {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .update(updates)
        .eq('id', ticketId)
        .select()
        .single();

      if (error) throw error;

      // Process automation rules for updates
      await this.processAutomationRules('ticket_updated', data);

      return data;
    } catch (error) {
      console.error('Error updating support ticket:', error);
      throw error;
    }
  }

  async getTicket(ticketId: string): Promise<SupportTicket | null> {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          customer:customer_profiles(*),
          assigned_agent:profiles(*)
        `)
        .eq('id', ticketId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching support ticket:', error);
      return null;
    }
  }

  async getTickets(filters: {
    status?: string[];
    priority?: string[];
    category?: string[];
    assignedAgentId?: string;
    customerId?: string;
    dateRange?: { start: string; end: string };
    limit?: number;
    offset?: number;
  } = {}): Promise<SupportTicket[]> {
    try {
      let query = supabase
        .from('support_tickets')
        .select(`
          *,
          customer:customer_profiles(*),
          assigned_agent:profiles(*)
        `)
        .order('createdAt', { ascending: false });

      // Apply filters
      if (filters.status?.length) {
        query = query.in('status', filters.status);
      }
      if (filters.priority?.length) {
        query = query.in('priority', filters.priority);
      }
      if (filters.category?.length) {
        query = query.in('category', filters.category);
      }
      if (filters.assignedAgentId) {
        query = query.eq('assignedAgentId', filters.assignedAgentId);
      }
      if (filters.customerId) {
        query = query.eq('customerId', filters.customerId);
      }
      if (filters.dateRange) {
        query = query
          .gte('createdAt', filters.dateRange.start)
          .lte('createdAt', filters.dateRange.end);
      }
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching support tickets:', error);
      return [];
    }
  }

  // AI Ticket Enrichment
  private async enrichTicket(ticketData: Partial<SupportTicket>): Promise<Partial<SupportTicket>> {
    const enriched = { ...ticketData };

    try {
      // Analyze sentiment
      if (ticketData.description) {
        const sentiment = await this.analyzeSentiment(ticketData.description);
        enriched.sentiment = sentiment.overall;
        enriched.aiConfidence = sentiment.confidence;
      }

      // Detect customer intent
      if (ticketData.subject && ticketData.description) {
        const intent = await this.detectCustomerIntent(
          `${ticketData.subject} ${ticketData.description}`,
          ticketData.customerId
        );
        enriched.aiRecommendedActions = intent.nextActions;
      }

      // Estimate resolution time
      if (ticketData.category && ticketData.priority) {
        enriched.estimatedResolutionTime = estimateResolutionTime(ticketData as SupportTicket);
      }

      // Calculate ticket value
      if (ticketData.category && ticketData.priority) {
        enriched.value = calculateTicketValue(ticketData as SupportTicket);
      }

      // Suggest tags using AI
      if (ticketData.description) {
        const suggestedTags = await this.suggestTags(ticketData.description);
        enriched.tags = [...(ticketData.tags || []), ...suggestedTags];
      }

      enriched.aiProcessed = true;
    } catch (error) {
      console.error('Error enriching ticket:', error);
      enriched.aiProcessed = false;
    }

    return enriched;
  }

  // Sentiment Analysis
  async analyzeSentiment(text: string): Promise<SentimentAnalysis> {
    try {
      const prompt = `Analyze the sentiment of this customer message: "${text}"

      Respond with JSON containing:
      - overall: "positive", "neutral", "negative", or "very_negative"
      - score: number from -1 (very negative) to 1 (very positive)
      - confidence: number from 0 to 1
      - emotions: object with joy, anger, fear, sadness, disgust, surprise (0-1)
      - keyPhrases: array of important phrases
      - urgency: "low", "medium", or "high"
      - sarcasm: boolean
      - language: detected language code`;

      const result = await this.aiService.generateContent(prompt, {
        temperature: 0.1,
        maxTokens: 500
      });

      const analysis = JSON.parse(result.content);
      analysis.processedAt = new Date().toISOString();

      return analysis;
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      // Return neutral sentiment as fallback
      return {
        overall: 'neutral',
        score: 0,
        confidence: 0.5,
        emotions: { joy: 0.2, anger: 0.1, fear: 0.1, sadness: 0.1, disgust: 0.1, surprise: 0.2 },
        keyPhrases: [],
        urgency: 'medium',
        sarcasm: false,
        language: 'en',
        processedAt: new Date().toISOString()
      };
    }
  }

  // Customer Intent Detection
  async detectCustomerIntent(message: string, customerId?: string): Promise<CustomerIntent> {
    try {
      let contextInfo = '';
      if (customerId) {
        const customer = await this.getCustomerProfile(customerId);
        if (customer) {
          contextInfo = `
          Customer context:
          - VIP Status: ${customer.vipStatus}
          - Previous bookings: ${customer.bookingCount}
          - Preferred services: ${customer.preferredServices.join(', ')}
          - Language: ${customer.language}
          - Total spent: ${customer.totalSpent}
          `;
        }
      }

      const prompt = `Analyze customer intent from this message: "${message}"

      ${contextInfo}

      Respond with JSON containing:
      - primary: main intent (booking_inquiry, cancellation_request, pricing_question, technical_issue, complaint, feedback, general_inquiry)
      - secondary: array of secondary intents
      - confidence: number from 0 to 1
      - entities: array of {type, value, startIndex, endIndex}
      - nextActions: array of suggested next actions
      - estimatedComplexity: "low", "medium", or "high"
      - processingTime: estimated processing time in minutes`;

      const result = await this.aiService.generateContent(prompt, {
        temperature: 0.2,
        maxTokens: 500
      });

      const intent = JSON.parse(result.content);
      intent.context = {
        previousIntents: [], // Would be loaded from history
        topicHistory: [],
        customerProfile: {}
      };
      intent.processingTime = Date.now();

      return intent;
    } catch (error) {
      console.error('Error detecting customer intent:', error);
      return {
        primary: 'general_inquiry',
        confidence: 0.5,
        entities: [],
        context: { previousIntents: [], topicHistory: [], customerProfile: {} },
        nextActions: ['Route to appropriate agent'],
        estimatedComplexity: 'medium',
        processingTime: 0
      };
    }
  }

  // Tag Suggestion
  async suggestTags(text: string): Promise<string[]> {
    try {
      const prompt = `Suggest relevant tags for this customer support message: "${text}"

      Respond with JSON array of tag strings (lowercase, underscore separated).
      Tags should be specific and helpful for categorization.
      Examples: ["payment_issue", "booking_conflict", "service_inquiry", "technical_glitch"]`;

      const result = await this.aiService.generateContent(prompt, {
        temperature: 0.3,
        maxTokens: 200
      });

      return JSON.parse(result.content);
    } catch (error) {
      console.error('Error suggesting tags:', error);
      return [];
    }
  }

  // Knowledge Base Management
  async searchKnowledgeBase(
    query: string,
    options: {
      category?: string;
      language?: string;
      limit?: number;
      minRelevance?: number;
    } = {}
  ): Promise<KnowledgeSearchResult[]> {
    try {
      let searchQuery = supabase
        .from('knowledge_base_articles')
        .select('*')
        .eq('status', 'published');

      if (options.category) {
        searchQuery = searchQuery.eq('category', options.category);
      }
      if (options.language) {
        searchQuery = searchQuery.eq('language', options.language);
      }

      // Use PostgreSQL full-text search
      searchQuery = searchQuery.textSearch('search_vector', query);

      const { data, error } = await searchQuery
        .limit(options.limit || 10)
        .order('effectiveness', { ascending: false });

      if (error) throw error;

      // Use AI to enhance search results and calculate relevance
      const enhancedResults = await Promise.all(
        (data || []).map(async (article) => {
          const relevance = await this.calculateRelevance(query, article);

          if (relevance < (options.minRelevance || 0.7)) {
            return null;
          }

          const suggestedResponse = await this.generateKnowledgeResponse(query, article);

          return {
            articleId: article.id,
            title: article.title,
            summary: article.summary,
            relevanceScore: relevance,
            category: article.category,
            tags: article.tags,
            lastUpdated: article.updatedAt,
            usageCount: article.usageCount,
            effectiveness: article.effectiveness || 0,
            suggestedResponse
          } as KnowledgeSearchResult;
        })
      );

      return enhancedResults.filter((result): result is KnowledgeSearchResult => result !== null)
        .sort((a, b) => b.relevanceScore - a.relevanceScore);
    } catch (error) {
      console.error('Error searching knowledge base:', error);
      return [];
    }
  }

  private async calculateRelevance(query: string, article: KnowledgeBaseArticle): Promise<number> {
    try {
      const prompt = `Calculate relevance score (0-1) for this search:
      Query: "${query}"
      Article: "${article.title} - ${article.summary}"

      Consider semantic similarity, keyword matching, and user intent.
      Respond with just the number (e.g., 0.85)`;

      const result = await this.aiService.generateContent(prompt, {
        temperature: 0.1,
        maxTokens: 10
      });

      const score = parseFloat(result.content.trim());
      return isNaN(score) ? 0.5 : Math.max(0, Math.min(1, score));
    } catch (error) {
      console.error('Error calculating relevance:', error);
      return 0.5;
    }
  }

  private async generateKnowledgeResponse(query: string, article: KnowledgeBaseArticle): Promise<string> {
    try {
      const prompt = `Based on this knowledge base article, generate a helpful response to the customer query:

      Query: "${query}"
      Article: "${article.content}"

      Generate a natural, helpful response that directly addresses the query using information from the article.
      Keep it concise but comprehensive. Maintain a helpful, professional tone.`;

      const result = await this.aiService.generateContent(prompt, {
        temperature: 0.6,
        maxTokens: 300
      });

      return result.content;
    } catch (error) {
      console.error('Error generating knowledge response:', error);
      return `Based on our knowledge base, here's what I found: ${article.summary}`;
    }
  }

  // Customer Profile Management
  async getCustomerProfile(customerId: string): Promise<CustomerProfile | null> {
    try {
      const { data, error } = await supabase
        .from('customer_profiles')
        .select('*')
        .eq('id', customerId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching customer profile:', error);
      return null;
    }
  }

  async updateCustomerProfile(customerId: string, updates: Partial<CustomerProfile>): Promise<CustomerProfile> {
    try {
      const { data, error } = await supabase
        .from('customer_profiles')
        .update(updates)
        .eq('id', customerId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating customer profile:', error);
      throw error;
    }
  }

  async analyzeCustomerRisk(customerId: string): Promise<{
    churnRisk: 'low' | 'medium' | 'high';
    riskFactors: string[];
    recommendations: string[];
  }> {
    try {
      const customer = await this.getCustomerProfile(customerId);
      if (!customer) {
        throw new Error('Customer not found');
      }

      const recentTickets = await this.getTickets({
        customerId,
        dateRange: {
          start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString()
        }
      });

      const churnRisk = calculateChurnRisk(customer, recentTickets);
      const riskFactors = [];
      const recommendations = [];

      // Analyze risk factors
      if (customer.satisfactionHistory.length > 0) {
        const recentSatisfaction = customer.satisfactionHistory.slice(-3);
        const avgSatisfaction = recentSatisfaction.reduce((acc, h) => acc + h.rating, 0) / recentSatisfaction.length;

        if (avgSatisfaction < 2) {
          riskFactors.push('Low satisfaction scores');
          recommendations.push('Contact customer to address concerns');
        }
      }

      const recentComplaints = recentTickets.filter(t => t.category === 'complaint').length;
      if (recentComplaints >= 2) {
        riskFactors.push('Multiple recent complaints');
        recommendations.push('Review complaint history and offer resolution');
      }

      if (customer.lastBookingDate) {
        const daysSinceLastBooking = Math.floor(
          (Date.now() - new Date(customer.lastBookingDate).getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceLastBooking > 90) {
          riskFactors.push('No recent bookings');
          recommendations.push('Send re-engagement offers or promotions');
        }
      }

      if (riskFactors.length === 0) {
        recommendations.push('Continue excellent service');
      }

      return {
        churnRisk,
        riskFactors,
        recommendations
      };
    } catch (error) {
      console.error('Error analyzing customer risk:', error);
      return {
        churnRisk: 'low',
        riskFactors: [],
        recommendations: []
      };
    }
  }

  // Automation Rules Processing
  private async processAutomationRules(trigger: string, data: any): Promise<void> {
    try {
      const { data: rules, error } = await supabase
        .from('automation_rules')
        .select('*')
        .eq('status', 'active')
        .eq('trigger.type', trigger);

      if (error) throw error;

      for (const rule of rules || []) {
        if (await this.evaluateRuleConditions(rule.trigger.conditions, data)) {
          await this.executeRuleActions(rule.actions, data, rule.id);
        }
      }
    } catch (error) {
      console.error('Error processing automation rules:', error);
    }
  }

  private async evaluateRuleConditions(conditions: any[], data: any): Promise<boolean> {
    try {
      if (!conditions || conditions.length === 0) return true;

      let result = true;
      let currentOperator = 'AND';

      for (const condition of conditions) {
        const conditionResult = this.evaluateCondition(condition, data);

        if (currentOperator === 'AND') {
          result = result && conditionResult;
        } else {
          result = result || conditionResult;
        }

        currentOperator = condition.logicalOperator || 'AND';
      }

      return result;
    } catch (error) {
      console.error('Error evaluating rule conditions:', error);
      return false;
    }
  }

  private evaluateCondition(condition: any, data: any): boolean {
    try {
      const value = this.getFieldValue(condition.field, data);

      switch (condition.operator) {
        case 'equals':
          return value === condition.value;
        case 'not_equals':
          return value !== condition.value;
        case 'contains':
          return String(value).toLowerCase().includes(String(condition.value).toLowerCase());
        case 'not_contains':
          return !String(value).toLowerCase().includes(String(condition.value).toLowerCase());
        case 'greater_than':
          return Number(value) > Number(condition.value);
        case 'less_than':
          return Number(value) < Number(condition.value);
        case 'in':
          return Array.isArray(condition.value) && condition.value.includes(value);
        case 'not_in':
          return Array.isArray(condition.value) && !condition.value.includes(value);
        default:
          return false;
      }
    } catch (error) {
      console.error('Error evaluating condition:', error);
      return false;
    }
  }

  private getFieldValue(field: string, data: any): any {
    try {
      return field.split('.').reduce((obj, key) => obj?.[key], data);
    } catch (error) {
      return null;
    }
  }

  private async executeRuleActions(actions: any[], data: any, ruleId: string): Promise<void> {
    try {
      for (const action of actions) {
        if (action.delay) {
          await new Promise(resolve => setTimeout(resolve, action.delay * 1000));
        }

        await this.executeAction(action, data, ruleId);
      }
    } catch (error) {
      console.error('Error executing rule actions:', error);
    }
  }

  private async executeAction(action: any, data: any, ruleId: string): Promise<void> {
    try {
      switch (action.type) {
        case 'assign_agent':
          await this.assignTicketToAgent(data.id, action.parameters.agentId);
          break;
        case 'change_status':
          await this.updateTicket(data.id, { status: action.parameters.status });
          break;
        case 'change_priority':
          await this.updateTicket(data.id, { priority: action.parameters.priority });
          break;
        case 'add_tag':
          // Add tag implementation
          break;
        case 'escalate':
          await this.escalateTicket(data.id, action.parameters.reason);
          break;
        case 'send_email':
          // Email sending implementation
          break;
        case 'notify_manager':
          // Manager notification implementation
          break;
        default:
          console.log('Unknown action type:', action.type);
      }

      // Log action execution
      await this.logAutomationExecution(ruleId, action.type, data.id, true);
    } catch (error) {
      console.error('Error executing action:', error);
      await this.logAutomationExecution(ruleId, action.type, data.id, false, error.message);
    }
  }

  private async assignTicketToAgent(ticketId: string, agentId: string): Promise<void> {
    await this.updateTicket(ticketId, {
      assignedAgentId: agentId,
      status: 'in_progress'
    });
  }

  private async escalateTicket(ticketId: string, reason: string): Promise<void> {
    await this.updateTicket(ticketId, {
      status: 'escalated',
      escalationCount: supabase.rpc('increment', { count: 1 })
    });
  }

  private async logAutomationExecution(
    ruleId: string,
    actionType: string,
    ticketId: string,
    success: boolean,
    error?: string
  ): Promise<void> {
    try {
      await supabase
        .from('automation_logs')
        .insert({
          ruleId,
          actionType,
          ticketId,
          success,
          error,
          timestamp: new Date().toISOString()
        });
    } catch (logError) {
      console.error('Error logging automation execution:', logError);
    }
  }

  // AI Insights Generation
  private async generateTicketInsights(ticket: SupportTicket): Promise<void> {
    try {
      const insights = await this.generateInsights(ticket);

      for (const insight of insights) {
        await this.saveInsight(insight);
      }
    } catch (error) {
      console.error('Error generating ticket insights:', error);
    }
  }

  async generateInsights(data: any): Promise<AIInsight[]> {
    try {
      const prompt = `Analyze this support ticket data and generate insights:

      ${JSON.stringify(data, null, 2)}

      Generate 1-3 insights with these types: pattern, opportunity, risk, trend, performance, prediction.
      For each insight, include severity, title, description, recommendation, confidence (0-1), and estimated impact.

      Respond with JSON array of insights.`;

      const result = await this.aiService.generateContent(prompt, {
        temperature: 0.4,
        maxTokens: 1000
      });

      const insights = JSON.parse(result.content);

      return insights.map((insight: any, index: number) => ({
        id: `insight-${Date.now()}-${index}`,
        ...insight,
        timestamp: new Date().toISOString(),
        acknowledged: false
      }));
    } catch (error) {
      console.error('Error generating insights:', error);
      return [];
    }
  }

  private async saveInsight(insight: AIInsight): Promise<void> {
    try {
      await supabase
        .from('ai_insights')
        .insert(insight);
    } catch (error) {
      console.error('Error saving insight:', error);
    }
  }

  // Recommendations Generation
  async generateRecommendations(ticketId: string): Promise<AIRecommendation[]> {
    try {
      const ticket = await this.getTicket(ticketId);
      if (!ticket) return [];

      const prompt = `Generate 3-5 recommendations for handling this support ticket:

      ${JSON.stringify(ticket, null, 2)}

      Include different types: response, action, escalation, knowledge, routing, proactive.
      For each recommendation, include title, description, suggested response text if applicable,
      confidence (0-1), priority, and estimated impact.

      Respond with JSON array of recommendations.`;

      const result = await this.aiService.generateContent(prompt, {
        temperature: 0.5,
        maxTokens: 1000
      });

      const recommendations = JSON.parse(result.content);

      return recommendations.map((rec: any, index: number) => ({
        id: `recommendation-${Date.now()}-${index}`,
        ticketId,
        ...rec,
        applied: false,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [];
    }
  }

  // Analytics and Reporting
  async getSupportAnalytics(
    dateRange: { start: string; end: string }
  ): Promise<any> {
    try {
      const { data: tickets, error } = await supabase
        .from('support_tickets')
        .select('*')
        .gte('createdAt', dateRange.start)
        .lte('createdAt', dateRange.end);

      if (error) throw error;

      const analytics = {
        overview: {
          totalTickets: tickets?.length || 0,
          openTickets: tickets?.filter(t => t.status === 'open').length || 0,
          resolvedTickets: tickets?.filter(t => t.status === 'resolved').length || 0,
          averageResponseTime: this.calculateAverageResponseTime(tickets || []),
          averageResolutionTime: this.calculateAverageResolutionTime(tickets || []),
          customerSatisfaction: this.calculateAverageSatisfaction(tickets || []),
          automationRate: this.calculateAutomationRate(tickets || []),
          escalationRate: this.calculateEscalationRate(tickets || [])
        },
        // Additional analytics categories would be implemented here
      };

      return analytics;
    } catch (error) {
      console.error('Error generating support analytics:', error);
      return null;
    }
  }

  private calculateAverageResponseTime(tickets: SupportTicket[]): number {
    const responseTimes = tickets
      .filter(t => t.firstResponseTime)
      .map(t => t.firstResponseTime!);

    return responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;
  }

  private calculateAverageResolutionTime(tickets: SupportTicket[]): number {
    const resolutionTimes = tickets
      .filter(t => t.actualResolutionTime)
      .map(t => t.actualResolutionTime!);

    return resolutionTimes.length > 0
      ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
      : 0;
  }

  private calculateAverageSatisfaction(tickets: SupportTicket[]): number {
    const satisfactionScores = tickets
      .filter(t => t.satisfaction)
      .map(t => t.satisfaction!);

    return satisfactionScores.length > 0
      ? satisfactionScores.reduce((a, b) => a + b, 0) / satisfactionScores.length
      : 0;
  }

  private calculateAutomationRate(tickets: SupportTicket[]): number {
    const aiProcessedTickets = tickets.filter(t => t.aiProcessed).length;
    return tickets.length > 0 ? (aiProcessedTickets / tickets.length) * 100 : 0;
  }

  private calculateEscalationRate(tickets: SupportTicket[]): number {
    const escalatedTickets = tickets.filter(t => t.escalationCount > 0).length;
    return tickets.length > 0 ? (escalatedTickets / tickets.length) * 100 : 0;
  }
}

// Singleton instance
export const supportAutomationService = new SupportAutomationService();