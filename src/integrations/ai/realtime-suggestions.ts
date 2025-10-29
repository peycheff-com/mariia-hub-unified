import { aiService } from './config';

export interface SuggestionContext {
  userId?: string;
  currentPath: string;
  userRole?: string;
  userPreferences?: {
    categories: string[];
    priceRange: { min: number; max: number };
    language: string;
  };
  sessionData?: {
    viewedServices: string[];
    searchQueries: string[];
    timeSpent: number;
    cartItems: string[];
  };
  realTimeData?: {
    currentWeather?: string;
    localEvents?: string[];
    trendingTopics?: string[];
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    dayOfWeek: string;
  };
}

export interface AISuggestion {
  id: string;
  type: 'content' | 'promotion' | 'recommendation' | 'tip' | 'warning' | 'upgrade';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  action?: {
    type: 'link' | 'button' | 'modal' | 'notification';
    label: string;
    url?: string;
    data?: any;
  };
  displayOptions: {
    position: 'top-banner' | 'side-panel' | 'inline' | 'modal' | 'toast';
    autoHide: boolean;
    hideAfter?: number;
    persistent: boolean;
    animation?: 'fade' | 'slide' | 'bounce';
  };
  targeting: {
    userSegments: string[];
    conditions: string[];
    frequency?: 'once' | 'daily' | 'weekly' | 'always';
  };
  metadata: {
    source: string;
    confidence: number;
    expiresAt?: string;
    trackable: boolean;
  };
  createdAt: string;
}

export interface SuggestionRule {
  id: string;
  name: string;
  description: string;
  conditions: Array<{
    field: keyof SuggestionContext;
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
    value: any;
  }>;
  actions: Array<{
    type: 'show_suggestion' | 'hide_suggestion' | 'modify_suggestion';
    suggestionId?: string;
    modification?: Partial<AISuggestion>;
  }>;
  isActive: boolean;
  priority: number;
}

export class RealtimeAISuggestions {
  private static instance: RealtimeAISuggestions;
  private activeSuggestions: Map<string, AISuggestion> = new Map();
  private rules: Map<string, SuggestionRule> = new Map();
  private userInteractions: Map<string, Set<string>> = new Map();
  private suggestionHistory: Map<string, AISuggestion[]> = new Map();

  static getInstance(): RealtimeAISuggestions {
    if (!RealtimeAISuggestions.instance) {
      RealtimeAISuggestions.instance = new RealtimeAISuggestions();
      RealtimeAISuggestions.instance.initializeDefaultRules();
    }
    return RealtimeAISuggestions.instance;
  }

  private initializeDefaultRules(): void {
    // Rule 1: Show weather-based suggestions
    this.addRule({
      id: 'weather-based',
      name: 'Weather-Based Recommendations',
      description: 'Show suggestions based on current weather',
      conditions: [
        {
          field: 'realTimeData' as any,
          operator: 'contains',
          value: { currentWeather: 'sunny' },
        },
      ],
      actions: [
        {
          type: 'show_suggestion',
          suggestionId: 'sunny-weather-special',
        },
      ],
      isActive: true,
      priority: 3,
    });

    // Rule 2: Cart abandonment
    this.addRule({
      id: 'cart-abandonment',
      name: 'Cart Abandonment Recovery',
      description: 'Show suggestions when user has items in cart',
      conditions: [
        {
          field: 'sessionData' as any,
          operator: 'greater_than',
          value: { cartItems: 0 },
        },
        {
          field: 'sessionData' as any,
          operator: 'greater_than',
          value: { timeSpent: 300000 }, // 5 minutes
        },
      ],
      actions: [
        {
          type: 'show_suggestion',
          suggestionId: 'cart-reminder',
        },
      ],
      isActive: true,
      priority: 5,
    });

    // Rule 3: High-value user recognition
    this.addRule({
      id: 'high-value-user',
      name: 'High-Value User Recognition',
      description: 'Show premium suggestions for high-value users',
      conditions: [
        {
          field: 'userPreferences' as any,
          operator: 'greater_than',
          value: { priceRange: { max: 500 } },
        },
      ],
      actions: [
        {
          type: 'show_suggestion',
          suggestionId: 'vip-upgrade',
        },
      ],
      isActive: true,
      priority: 4,
    });
  }

  async generateSuggestions(context: SuggestionContext): Promise<AISuggestion[]> {
    const suggestions: AISuggestion[] = [];
    const userId = context.userId || 'anonymous';

    // 1. Check rule-based suggestions
    const ruleBasedSuggestions = await this.evaluateRules(context);
    suggestions.push(...ruleBasedSuggestions);

    // 2. Generate AI-powered contextual suggestions
    const aiSuggestions = await this.generateContextualSuggestions(context);
    suggestions.push(...aiSuggestions);

    // 3. Add personalization suggestions
    const personalizedSuggestions = await this.generatePersonalizedSuggestions(context);
    suggestions.push(...personalizedSuggestions);

    // 4. Filter and prioritize
    const filteredSuggestions = this.filterAndPrioritize(suggestions, context);

    // 5. Track user interactions
    this.trackSuggestions(userId, filteredSuggestions);

    return filteredSuggestions;
  }

  private async evaluateRules(context: SuggestionContext): Promise<AISuggestion[]> {
    const matchedSuggestions: AISuggestion[] = [];

    for (const rule of this.rules.values()) {
      if (!rule.isActive) continue;

      const conditionsMet = rule.conditions.every(condition =>
        this.evaluateCondition(condition, context)
      );

      if (conditionsMet) {
        for (const action of rule.actions) {
          if (action.type === 'show_suggestion' && action.suggestionId) {
            const suggestion = await this.getSuggestionById(action.suggestionId);
            if (suggestion) {
              matchedSuggestions.push(suggestion);
            }
          }
        }
      }
    }

    return matchedSuggestions;
  }

  private evaluateCondition(condition: any, context: SuggestionContext): boolean {
    const value = this.getNestedValue(context, condition.field);

    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'contains':
        return typeof value === 'object'
          ? Object.entries(condition.value).every(([k, v]) => value[k] === v)
          : String(value).includes(String(condition.value));
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
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private async generateContextualSuggestions(context: SuggestionContext): Promise<AISuggestion[]> {
    if (!aiService) {
      return [];
    }

    const prompt = `Generate contextual AI suggestions based on user context:

Context:
- Current Path: ${context.currentPath}
- Time of Day: ${context.realTimeData?.timeOfDay}
- Day of Week: ${context.realTimeData?.dayOfWeek}
- Viewed Services: ${context.sessionData?.viewedServices?.join(', ') || 'None'}
- Search Queries: ${context.sessionData?.searchQueries?.join(', ') || 'None'}
- Cart Items: ${context.sessionData?.cartItems?.length || 0}
- Time Spent: ${Math.round((context.sessionData?.timeSpent || 0) / 60000)} minutes

Generate 2-3 relevant suggestions in JSON format:
{
  "suggestions": [
    {
      "type": "recommendation|promotion|tip|upgrade",
      "priority": "low|medium|high",
      "title": "Short catchy title",
      "message": "Detailed message with personalization",
      "reasoning": "Why this suggestion is relevant now"
    }
  ]
}

Make suggestions personalized and context-aware.`;

    try {
      const response = await aiService['generateContent'](
        prompt,
        'You are an AI assistant providing personalized recommendations in real-time.',
        0.6,
        1000
      );

      const parsed = JSON.parse(response);
      const suggestions: AISuggestion[] = [];

      parsed.suggestions.forEach((s: any, index: number) => {
        suggestions.push({
          id: `ai-contextual-${Date.now()}-${index}`,
          type: s.type,
          priority: s.priority,
          title: s.title,
          message: s.message,
          displayOptions: {
            position: 'inline',
            autoHide: true,
            hideAfter: 10000,
            persistent: false,
            animation: 'fade',
          },
          targeting: {
            userSegments: ['all'],
            conditions: ['context-match'],
            frequency: 'once',
          },
          metadata: {
            source: 'ai-contextual',
            confidence: 0.8,
            trackable: true,
          },
          createdAt: new Date().toISOString(),
        });
      });

      return suggestions;
    } catch (error) {
      console.error('Failed to generate contextual suggestions:', error);
      return [];
    }
  }

  private async generatePersonalizedSuggestions(context: SuggestionContext): Promise<AISuggestion[]> {
    const suggestions: AISuggestion[] = [];
    const userId = context.userId || 'anonymous';

    // Based on viewed services
    if (context.sessionData?.viewedServices?.length > 0) {
      const lastViewed = context.sessionData.viewedServices[
        context.sessionData.viewedServices.length - 1
      ];

      suggestions.push({
        id: `related-service-${Date.now()}`,
        type: 'recommendation',
        priority: 'medium',
        title: 'Complete Your Experience',
        message: `Customers who viewed this service also loved our complementary treatments`,
        action: {
          type: 'link',
          label: 'View Related Services',
          url: '/services?related=' + lastViewed,
        },
        displayOptions: {
          position: 'side-panel',
          autoHide: false,
          persistent: true,
        },
        targeting: {
          userSegments: ['engaged'],
          conditions: ['has-viewed-services'],
          frequency: 'once',
        },
        metadata: {
          source: 'personalization',
          confidence: 0.9,
          trackable: true,
        },
        createdAt: new Date().toISOString(),
      });
    }

    // Based on search behavior
    if (context.sessionData?.searchQueries?.length > 0) {
      suggestions.push({
        id: `search-assist-${Date.now()}`,
        type: 'tip',
        priority: 'low',
        title: 'Found What You\'re Looking For?',
        message: `Based on your search for "${context.sessionData.searchQueries[0]}", here are some tips...`,
        displayOptions: {
          position: 'toast',
          autoHide: true,
          hideAfter: 5000,
        },
        targeting: {
          userSegments: ['searcher'],
          conditions: ['has-searched'],
          frequency: 'once',
        },
        metadata: {
          source: 'personalization',
          confidence: 0.7,
          trackable: true,
        },
        createdAt: new Date().toISOString(),
      });
    }

    return suggestions;
  }

  private filterAndPrioritize(suggestions: AISuggestion[], context: SuggestionContext): AISuggestion[] {
    const userId = context.userId || 'anonymous';
    const userHistory = this.userInteractions.get(userId) || new Set();

    // Remove already shown suggestions (if not persistent)
    const filtered = suggestions.filter(s => {
      if (s.displayOptions.persistent) return true;
      if (s.targeting.frequency === 'once' && userHistory.has(s.id)) return false;
      return true;
    });

    // Sort by priority and confidence
    filtered.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];

      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }

      return (b.metadata.confidence || 0) - (a.metadata.confidence || 0);
    });

    // Limit number of suggestions
    return filtered.slice(0, 5);
  }

  private trackSuggestions(userId: string, suggestions: AISuggestion[]): void {
    if (!this.userInteractions.has(userId)) {
      this.userInteractions.set(userId, new Set());
    }

    const userSet = this.userInteractions.get(userId)!;
    suggestions.forEach(s => {
      if (s.targeting.frequency === 'once') {
        userSet.add(s.id);
      }
    });

    // Store in history
    if (!this.suggestionHistory.has(userId)) {
      this.suggestionHistory.set(userId, []);
    }
    const history = this.suggestionHistory.get(userId)!;
    history.push(...suggestions);

    // Keep only last 100 suggestions
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }
  }

  async getSuggestionById(id: string): Promise<AISuggestion | null> {
    // In a real implementation, this would fetch from a database
    // For now, return a predefined suggestion
    const predefinedSuggestions: Record<string, Partial<AISuggestion>> = {
      'sunny-weather-special': {
        type: 'promotion',
        priority: 'medium',
        title: 'Sunny Day Special!',
        message: 'Perfect weather for outdoor activities. Get 20% off our fitness classes today!',
        action: {
          type: 'link',
          label: 'View Classes',
          url: '/fitness/outdoor',
        },
      },
      'cart-reminder': {
        type: 'recommendation',
        priority: 'high',
        title: 'Complete Your Booking',
        message: 'Your cart is waiting. Complete your booking in the next 10 minutes for a special gift!',
        action: {
          type: 'link',
          label: 'View Cart',
          url: '/booking/cart',
        },
      },
      'vip-upgrade': {
        type: 'upgrade',
        priority: 'medium',
        title: 'VIP Experience Available',
        message: 'Upgrade to our VIP package for exclusive benefits and personalized service.',
        action: {
          type: 'modal',
          label: 'Learn More',
          data: { package: 'vip' },
        },
      },
    };

    const base = predefinedSuggestions[id];
    if (!base) return null;

    return {
      id,
      displayOptions: {
        position: 'top-banner',
        autoHide: true,
        hideAfter: 15000,
        persistent: false,
        animation: 'slide',
      },
      targeting: {
        userSegments: ['all'],
        conditions: [],
        frequency: 'once',
      },
      metadata: {
        source: 'predefined',
        confidence: 1.0,
        trackable: true,
      },
      createdAt: new Date().toISOString(),
      ...base,
    } as AISuggestion;
  }

  addRule(rule: SuggestionRule): void {
    this.rules.set(rule.id, rule);
  }

  removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
  }

  updateRule(ruleId: string, updates: Partial<SuggestionRule>): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      this.rules.set(ruleId, { ...rule, ...updates });
    }
  }

  async recordInteraction(
    userId: string,
    suggestionId: string,
    interaction: 'shown' | 'clicked' | 'dismissed' | 'converted'
  ): Promise<void> {
    // Track interaction for analytics
    console.log(`User ${userId} ${interaction} suggestion ${suggestionId}`);

    // In a real implementation, this would save to analytics
    const interactionData = {
      userId,
      suggestionId,
      interaction,
      timestamp: new Date().toISOString(),
    };

    // Store for A/B testing and optimization
    // await analytics.track('suggestion_interaction', interactionData);
  }

  async optimizeSuggestions(): Promise<{
    recommendations: string[];
    topPerforming: AISuggestion[];
    underperforming: AISuggestion[];
  }> {
    // Analyze suggestion performance
    const allSuggestions = Array.from(this.activeSuggestions.values());

    const topPerforming = allSuggestions
      .sort((a, b) => (b.metadata.confidence || 0) - (a.metadata.confidence || 0))
      .slice(0, 10);

    const underperforming = allSuggestions
      .filter(s => (s.metadata.confidence || 0) < 0.5)
      .slice(0, 5);

    const recommendations = [
      'Increase personalization based on user behavior patterns',
      'Test different display positions for better visibility',
      'Optimize timing of suggestions based on user session data',
      'A/B test different message formats',
      'Implement urgency messaging for time-sensitive offers',
    ];

    return {
      recommendations,
      topPerforming,
      underperforming,
    };
  }

  // Real-time webhook for external triggers
  async handleExternalTrigger(trigger: {
    type: 'weather' | 'event' | 'inventory' | 'promotion';
    data: any;
  }): Promise<AISuggestion[]> {
    const suggestions: AISuggestion[] = [];

    switch (trigger.type) {
      case 'weather':
        if (trigger.data.condition === 'rainy') {
          suggestions.push({
            id: `weather-rain-${Date.now()}`,
            type: 'recommendation',
            priority: 'medium',
            title: 'Rainy Day Special',
            message: 'Stay cozy with our indoor beauty treatments. 15% off today!',
            displayOptions: {
              position: 'top-banner',
              autoHide: false,
              persistent: true,
            },
            targeting: {
              userSegments: ['all'],
              conditions: ['weather-rain'],
              frequency: 'daily',
            },
            metadata: {
              source: 'external-trigger',
              confidence: 0.9,
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              trackable: true,
            },
            createdAt: new Date().toISOString(),
          });
        }
        break;

      case 'event':
        if (trigger.data.type === 'local-festival') {
          suggestions.push({
            id: `event-festival-${Date.now()}`,
            type: 'promotion',
            priority: 'high',
            title: 'Festival Special Offer',
            message: `Celebrate ${trigger.data.name} with our special festival package!`,
            displayOptions: {
              position: 'modal',
              autoHide: false,
              persistent: true,
            },
            targeting: {
              userSegments: ['local'],
              conditions: ['local-event'],
              frequency: 'once',
            },
            metadata: {
              source: 'external-trigger',
              confidence: 0.95,
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              trackable: true,
            },
            createdAt: new Date().toISOString(),
          });
        }
        break;

      case 'inventory':
        if (trigger.data.status === 'low-stock') {
          suggestions.push({
            id: `inventory-low-${Date.now()}`,
            type: 'warning',
            priority: 'urgent',
            title: 'Limited Availability',
            message: `Only ${trigger.data.quantity} spots left for ${trigger.data.service}!`,
            displayOptions: {
              position: 'toast',
              autoHide: false,
              persistent: true,
              animation: 'bounce',
            },
            targeting: {
              userSegments: ['all'],
              conditions: ['low-stock'],
              frequency: 'always',
            },
            metadata: {
              source: 'external-trigger',
              confidence: 1.0,
              trackable: true,
            },
            createdAt: new Date().toISOString(),
          });
        }
        break;
    }

    return suggestions;
  }
}

// Export singleton instance
export const realtimeAISuggestions = RealtimeAISuggestions.getInstance();

// React hook for real-time suggestions
import { useEffect, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export function useRealtimeSuggestions(context: SuggestionContext) {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['realtime-suggestions', context.userId, context.currentPath],
    queryFn: () => realtimeAISuggestions.generateSuggestions(context),
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 15000,
  });

  useEffect(() => {
    if (data) {
      setSuggestions(data);
    }
  }, [data]);

  const recordInteraction = useCallback(async (
    suggestionId: string,
    interaction: 'shown' | 'clicked' | 'dismissed' | 'converted'
  ) => {
    await realtimeAISuggestions.recordInteraction(
      context.userId || 'anonymous',
      suggestionId,
      interaction
    );
    queryClient.invalidateQueries({ queryKey: ['realtime-suggestions'] });
  }, [context.userId, queryClient]);

  const dismissSuggestion = useCallback((suggestionId: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    recordInteraction(suggestionId, 'dismissed');
  }, [recordInteraction]);

  const triggerExternal = useCallback(async (trigger: any) => {
    const newSuggestions = await realtimeAISuggestions.handleExternalTrigger(trigger);
    setSuggestions(prev => [...prev, ...newSuggestions]);
  }, []);

  return {
    suggestions,
    isLoading,
    refetch,
    recordInteraction,
    dismissSuggestion,
    triggerExternal,
  };
}