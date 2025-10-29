import { aiService, isAIFeatureEnabled } from './config';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    intent?: string;
    confidence?: number;
    suggestedActions?: string[];
    relatedServices?: string[];
  };
}

export interface ChatContext {
  userId?: string;
  sessionId: string;
  userInfo?: {
    name?: string;
    preferences?: {
      language: string;
      serviceCategories: string[];
      location?: string;
    };
  };
  bookingContext?: {
    selectedService?: string;
    preferredTime?: string;
    step?: string;
  };
  conversationHistory: ChatMessage[];
}

export interface ChatbotResponse {
  message: string;
  intent: string;
  confidence: number;
  actions: Array<{
    type: 'book' | 'navigate' | 'info' | 'handoff';
    label: string;
    data?: any;
  }>;
  suggestedReplies?: string[];
  shouldHandoff: boolean;
  metadata?: any;
}

export class AIChatbotService {
  private contexts: Map<string, ChatContext> = new Map();
  private intents: Map<string, string[]> = new Map();

  constructor() {
    this.initializeIntents();
  }

  private initializeIntents() {
    // Define intent patterns
    this.intents.set('booking', [
      'book appointment',
      'make reservation',
      'schedule',
      'book now',
      'reserve',
      'available times',
    ]);

    this.intents.set('information', [
      'what is',
      'tell me about',
      'how much',
      'price',
      'cost',
      'duration',
      'information',
    ]);

    this.intents.set('cancellation', [
      'cancel',
      'reschedule',
      'change appointment',
      'modify booking',
    ]);

    this.intents.set('general', [
      'hello',
      'hi',
      'help',
      'support',
      'contact',
    ]);
  }

  async processMessage(
    sessionId: string,
    message: string,
    userId?: string
  ): Promise<ChatbotResponse> {
    if (!aiService || !isAIFeatureEnabled('CHATBOT')) {
      throw new Error('AI chatbot is not available');
    }

    // Get or create context
    let context = this.contexts.get(sessionId);
    if (!context) {
      context = this.createContext(sessionId, userId);
      this.contexts.set(sessionId, context);
    }

    // Add user message to history
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    context.conversationHistory.push(userMessage);

    // Detect intent
    const intent = this.detectIntent(message);
    const confidence = this.calculateConfidence(message, intent);

    // Generate response
    const response = await this.generateResponse(context, message, intent, confidence);

    // Add assistant message to history
    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response.message,
      timestamp: new Date(),
      metadata: {
        intent: response.intent,
        confidence: response.confidence,
        suggestedActions: response.actions.map(a => a.label),
      },
    };
    context.conversationHistory.push(assistantMessage);

    // Update context
    this.updateContext(context, response);

    return response;
  }

  private createContext(sessionId: string, userId?: string): ChatContext {
    return {
      userId,
      sessionId,
      conversationHistory: [],
      userInfo: {
        preferences: {
          language: 'en',
          serviceCategories: [],
        },
      },
    };
  }

  private detectIntent(message: string): string {
    const lowerMessage = message.toLowerCase();

    for (const [intent, patterns] of this.intents) {
      for (const pattern of patterns) {
        if (lowerMessage.includes(pattern)) {
          return intent;
        }
      }
    }

    return 'general';
  }

  private calculateConfidence(message: string, intent: string): number {
    // Simple confidence calculation - can be enhanced with ML
    const lowerMessage = message.toLowerCase();
    const patterns = this.intents.get(intent) || [];

    let matches = 0;
    for (const pattern of patterns) {
      if (lowerMessage.includes(pattern)) {
        matches++;
      }
    }

    return Math.min(matches / patterns.length, 1);
  }

  private async generateResponse(
    context: ChatContext,
    message: string,
    intent: string,
    confidence: number
  ): Promise<ChatbotResponse> {
    const conversationHistory = context.conversationHistory
      .slice(-5) // Keep last 5 messages for context
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    const prompt = `You are a helpful AI assistant for a premium beauty and fitness booking platform in Warsaw.

    Context:
    - User intent: ${intent} (confidence: ${confidence})
    - Language preference: ${context.userInfo?.preferences.language || 'en'}
    - Previous conversation: ${conversationHistory || 'None'}
    - Current booking step: ${context.bookingContext?.step || 'None'}

    User message: "${message}"

    Guidelines:
    - Be helpful, professional, and friendly
    - Use a luxury/premium tone appropriate for the Warsaw beauty market
    - If asked about booking, guide them through the process
    - If asked about services, provide helpful information
    - If you can't help, offer to connect them with human support
    - Keep responses concise but informative

    Respond with JSON containing:
    - message: Your response to the user
    - intent: Detected intent
    - confidence: Your confidence in the response (0-1)
    - actions: Array of suggested actions (book/navigate/info/handoff)
    - suggestedReplies: Array of quick reply options
    - shouldHandoff: boolean if human intervention is needed

    Example actions:
    {"type": "book", "label": "Book Appointment", "data": {"serviceId": "xxx"}}
    {"type": "navigate", "label": "View Services", "data": {"path": "/beauty"}}
    {"type": "info", "label": "Learn More", "data": {"topic": "lip-enhancement"}}
    {"type": "handoff", "label": "Talk to Human", "data": {"reason": "complex_query"}}`;

    try {
      const response = await aiService['generateContent'](
        prompt,
        'You are an AI chatbot assistant for beauty and fitness services.',
        0.7,
        1000
      );

      const parsed = JSON.parse(response);

      // Determine if handoff is needed
      const shouldHandoff = this.shouldHandoffToHuman(intent, confidence, parsed.message);

      return {
        ...parsed,
        shouldHandoff,
      };
    } catch (error) {
      console.error('Failed to generate chatbot response:', error);

      // Fallback response
      return {
        message: "I'm sorry, I'm having trouble understanding. Could you please rephrase that or contact our support team for assistance?",
        intent: 'general',
        confidence: 0.5,
        actions: [
          {
            type: 'handoff',
            label: 'Contact Support',
            data: { reason: 'chatbot_error' },
          },
        ],
        suggestedReplies: ['Book Appointment', 'View Services', 'Contact Support'],
        shouldHandoff: true,
      };
    }
  }

  private shouldHandoffToHuman(intent: string, confidence: number, message: string): boolean {
    // Handoff conditions
    const handoffKeywords = ['complaint', 'refund', 'lawyer', 'sue', 'angry', 'frustrated'];
    const hasNegativeKeywords = handoffKeywords.some(keyword =>
      message.toLowerCase().includes(keyword)
    );

    return (
      hasNegativeKeywords ||
      confidence < 0.5 ||
      intent === 'cancellation' // Handoff cancellations to humans
    );
  }

  private updateContext(context: ChatContext, response: ChatbotResponse) {
    // Update booking context if relevant
    if (response.intent === 'booking') {
      context.bookingContext = {
        ...context.bookingContext,
        step: 'service_selection',
      };
    }

    // Update user preferences if detected
    // This would be enhanced with actual NLP
    if (response.message.toLowerCase().includes('polish')) {
      context.userInfo!.preferences.language = 'pl';
    }
  }

  // Public methods
  getContext(sessionId: string): ChatContext | undefined {
    return this.contexts.get(sessionId);
  }

  clearContext(sessionId: string) {
    this.contexts.delete(sessionId);
  }

  getContexts(): Map<string, ChatContext> {
    return this.contexts;
  }

  // Analytics methods
  getPopularIntents(): Map<string, number> {
    const intentCounts = new Map<string, number>();

    for (const context of this.contexts.values()) {
      for (const message of context.conversationHistory) {
        if (message.metadata?.intent) {
          const current = intentCounts.get(message.metadata.intent) || 0;
          intentCounts.set(message.metadata.intent, current + 1);
        }
      }
    }

    return intentCounts;
  }

  getConversationLength(sessionId: string): number {
    const context = this.contexts.get(sessionId);
    return context ? context.conversationHistory.length : 0;
  }

  getAverageResponseTime(): number {
    // Calculate average time between user and assistant messages
    // This would be enhanced with actual timestamp analysis
    return 2000; // 2 seconds placeholder
  }
}

// Export singleton instance
export const aiChatbotService = new AIChatbotService();

// React hook for chatbot
import { useState, useEffect } from 'react';

export function useAIChatbot(sessionId: string, userId?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (message: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await aiChatbotService.processMessage(sessionId, message, userId);

      // Update messages
      const context = aiChatbotService.getContext(sessionId);
      if (context) {
        setMessages(context.conversationHistory);
      }

      return response;
    } catch (err) {
      setError(err.message || 'Failed to send message');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Load existing context
    const context = aiChatbotService.getContext(sessionId);
    if (context) {
      setMessages(context.conversationHistory);
    }

    // Cleanup on unmount
    return () => {
      // Optionally clear context or persist it
    };
  }, [sessionId]);

  return {
    messages,
    sendMessage,
    isLoading,
    error,
    clearError: () => setError(null),
    clearChat: () => {
      aiChatbotService.clearContext(sessionId);
      setMessages([]);
    },
  };
}