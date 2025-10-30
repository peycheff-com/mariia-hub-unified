import { z } from 'zod';

// Support Automation Core Types
export const SupportTicketSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  customerName: z.string(),
  customerEmail: z.string().email(),
  customerPhone: z.string().optional(),
  subject: z.string(),
  description: z.string(),
  category: z.enum(['booking', 'technical', 'billing', 'general', 'complaint', 'feedback']),
  priority: z.enum(['low', 'medium', 'high', 'urgent', 'critical']),
  status: z.enum(['open', 'in_progress', 'pending_customer', 'resolved', 'closed', 'escalated']),
  channel: z.enum(['email', 'chat', 'phone', 'whatsapp', 'webform', 'mobile_app']),
  assignedAgentId: z.string().optional(),
  assignedAgentName: z.string().optional(),
  department: z.enum(['customer_service', 'technical', 'billing', 'management']).optional(),
  tags: z.array(z.string()),
  attachments: z.array(z.object({
    id: z.string(),
    name: z.string(),
    url: z.string(),
    type: z.string(),
    size: z.number()
  })).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  resolvedAt: z.string().optional(),
  dueDate: z.string().optional(),
  satisfaction: z.number().min(1).max(5).optional(),
  feedback: z.string().optional(),
  escalationCount: z.number().default(0),
  aiProcessed: z.boolean().default(false),
  aiConfidence: z.number().min(0).max(1).optional(),
  aiRecommendedActions: z.array(z.string()).optional(),
  estimatedResolutionTime: z.number().optional(), // in minutes
  actualResolutionTime: z.number().optional(), // in minutes
  firstResponseTime: z.number().optional(), // in minutes
  customerWaitTime: z.number().optional(), // in minutes
  value: z.number().optional(), // monetary value of ticket
  churnRisk: z.enum(['low', 'medium', 'high']).optional(),
  sentiment: z.enum(['positive', 'neutral', 'negative', 'very_negative']).optional(),
  language: z.string().default('en'),
  isVIP: z.boolean().default(false),
  source: z.string().optional(),
  utmSource: z.string().optional(),
  relatedBookingId: z.string().optional(),
  relatedServiceId: z.string().optional(),
  customFields: z.record(z.any()).optional(),
});

export const KnowledgeBaseArticleSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  summary: z.string(),
  category: z.string(),
  subcategory: z.string().optional(),
  tags: z.array(z.string()),
  author: z.string(),
  status: z.enum(['draft', 'published', 'archived']),
  language: z.string(),
  priority: z.number().min(1).max(10),
  views: z.number().default(0),
  helpful: z.number().default(0),
  notHelpful: z.number().default(0),
  searchTerms: z.array(z.string()),
  relatedArticles: z.array(z.string()),
  attachments: z.array(z.object({
    id: z.string(),
    name: z.string(),
    url: z.string(),
    type: z.string()
  })).optional(),
  lastReviewed: z.string(),
  nextReview: z.string(),
  aiGenerated: z.boolean().default(false),
  aiOptimized: z.boolean().default(false),
  readabilityScore: z.number().min(0).max(100).optional(),
  seoScore: z.number().min(0).max(100).optional(),
  effectiveness: z.number().min(0).max(1).optional(),
  usageCount: z.number().default(0),
  successRate: z.number().min(0).max(1).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  publishedAt: z.string().optional(),
  version: z.number().default(1),
  feedback: z.array(z.object({
    id: z.string(),
    rating: z.number().min(1).max(5),
    comment: z.string(),
    helpful: z.boolean(),
    timestamp: z.string(),
    userId: z.string().optional()
  })).optional()
});

export const CustomerProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  language: z.string().default('en'),
  timezone: z.string(),
  location: z.object({
    city: z.string(),
    country: z.string(),
    address: z.string().optional(),
    postalCode: z.string().optional()
  }).optional(),
  vipStatus: z.enum(['regular', 'silver', 'gold', 'platinum']).default('regular'),
  loyaltyPoints: z.number().default(0),
  totalSpent: z.number().default(0),
  bookingCount: z.number().default(0),
  lastBookingDate: z.string().optional(),
  preferredServices: z.array(z.string()),
  allergies: z.array(z.string()).optional(),
  medicalConditions: z.array(z.string()).optional(),
  preferences: z.object({
    communicationChannel: z.enum(['email', 'phone', 'whatsapp', 'sms']).default('email'),
    appointmentReminders: z.boolean().default(true),
    marketingConsent: z.boolean().default(false),
    dataProcessingConsent: z.boolean().default(true)
  }),
  customFields: z.record(z.any()).optional(),
  notes: z.array(z.object({
    id: z.string(),
    content: z.string(),
    author: z.string(),
    timestamp: z.string(),
    isInternal: z.boolean().default(true)
  })).optional(),
  interactions: z.array(z.object({
    id: z.string(),
    type: z.enum(['email', 'phone', 'chat', 'appointment', 'payment']),
    timestamp: z.string(),
    duration: z.number().optional(),
    subject: z.string(),
    outcome: z.string().optional(),
    sentiment: z.enum(['positive', 'neutral', 'negative']).optional(),
    agentId: z.string().optional()
  })).optional(),
  satisfactionHistory: z.array(z.object({
    date: z.string(),
    rating: z.number().min(1).max(5),
    category: z.string(),
    feedback: z.string().optional()
  })).optional(),
  churnRisk: z.enum(['low', 'medium', 'high']).optional(),
  lifetimeValue: z.number().default(0),
  acquisitionCost: z.number().optional(),
  lastContactDate: z.string().optional(),
  nextFollowUpDate: z.string().optional(),
  tags: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const AutomationRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.enum(['routing', 'response', 'escalation', 'proactive', 'sentiment', 'knowledge', 'workflow', 'notification']),
  status: z.enum(['active', 'paused', 'draft', 'archived']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  trigger: z.object({
    type: z.enum(['ticket_created', 'ticket_updated', 'customer_action', 'time_based', 'external_webhook', 'sentiment_change', 'sla_warning']),
    conditions: z.array(z.object({
      field: z.string(),
      operator: z.enum(['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than', 'in', 'not_in', 'regex', 'sentiment_is', 'category_is', 'priority_is']),
      value: z.any(),
      logicalOperator: z.enum(['AND', 'OR']).default('AND')
    }))
  }),
  actions: z.array(z.object({
    type: z.enum(['send_email', 'send_sms', 'send_webhook', 'assign_agent', 'change_status', 'change_priority', 'add_tag', 'remove_tag', 'escalate', 'create_ticket', 'update_customer', 'schedule_followup', 'trigger_workflow', 'notify_manager', 'ai_response', 'search_knowledge', 'update_crm', 'create_task', 'log_activity']),
    parameters: z.record(z.any()),
    delay: z.number().optional(),
    order: z.number(),
    conditions: z.array(z.object({
      field: z.string(),
      operator: z.enum(['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than', 'in', 'not_in']),
      value: z.any(),
      logicalOperator: z.enum(['AND', 'OR']).default('AND')
    })).optional()
  })),
  performance: z.object({
    executions: z.number().default(0),
    successes: z.number().default(0),
    failures: z.number().default(0),
    averageExecutionTime: z.number().default(0),
    successRate: z.number().default(0),
    customerSatisfactionImpact: z.number().optional(),
    efficiencyGain: z.number().optional(),
    costSavings: z.number().optional(),
    lastExecution: z.string().optional(),
    nextExecution: z.string().optional()
  }),
  aiEnhanced: z.boolean().default(false),
  learningEnabled: z.boolean().default(false),
  version: z.number().default(1),
  createdBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const SLAPolicySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.enum(['response_time', 'resolution_time', 'first_contact', 'customer_satisfaction']),
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.enum(['equals', 'in', 'contains']),
    value: z.any()
  })),
  targets: z.object({
    firstResponse: z.number().optional(), // in minutes
    resolution: z.number().optional(), // in minutes
    customerSatisfaction: z.number().min(0).max(100).optional()
  }),
  escalationRules: z.array(z.object({
    threshold: z.number(), // percentage of SLA used
    action: z.enum(['notify_manager', 'escalate_priority', 'reassign_ticket', 'notify_customer']),
    recipients: z.array(z.string())
  })),
  active: z.boolean().default(true),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const ChatbotConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  personality: z.object({
    tone: z.enum(['professional', 'friendly', 'casual', 'luxury', 'empathetic']),
    language: z.string(),
    responseStyle: z.enum(['concise', 'detailed', 'conversational', 'formal']),
    empathy: z.boolean().default(true),
    useEmojis: z.boolean().default(false),
    greetingStyle: z.enum(['formal', 'casual', 'personalized'])
  }),
  capabilities: z.object({
    booking: z.boolean().default(true),
    rescheduling: z.boolean().default(true),
    pricing: z.boolean().default(true),
    knowledgeSearch: z.boolean().default(true),
    sentimentDetection: z.boolean().default(true),
    languageDetection: z.boolean().default(true),
    escalation: z.boolean().default(true),
    personalization: z.boolean().default(true),
    proactiveHelp: z.boolean().default(true)
  }),
  responses: z.object({
    greetings: z.array(z.string()),
    unknownQueries: z.array(z.string()),
    escalation: z.array(z.string()),
    unavailable: z.array(z.string()),
    satisfaction: z.array(z.string())
  }),
  aiSettings: z.object({
    model: z.string(),
    temperature: z.number().min(0).max(2).default(0.7),
    maxTokens: z.number().default(1000),
    contextWindow: z.number().default(10),
    confidenceThreshold: z.number().min(0).max(1).default(0.8),
    learningEnabled: z.boolean().default(true),
    personalizationEnabled: z.boolean().default(true)
  }),
  integration: z.object({
    bookingSystem: z.boolean().default(true),
    crm: z.boolean().default(true),
    knowledgeBase: z.boolean().default(true),
    payment: z.boolean().default(false),
    calendar: z.boolean().default(true),
    analytics: z.boolean().default(true)
  }),
  languages: z.array(z.string()).default(['en']),
  active: z.boolean().default(true),
  version: z.number().default(1),
  performance: z.object({
    totalConversations: z.number().default(0),
    successfulResolutions: z.number().default(0),
    escalatedConversations: z.number().default(0),
    averageResponseTime: z.number().default(0),
    customerSatisfaction: z.number().default(0)
  }).optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const AnalyticsSchema = z.object({
  overview: z.object({
    totalTickets: z.number(),
    openTickets: z.number(),
    resolvedTickets: z.number(),
    averageResponseTime: z.number(),
    averageResolutionTime: z.number(),
    customerSatisfaction: z.number(),
    automationRate: z.number(),
    escalationRate: z.number()
  }),
  trends: z.array(z.object({
    date: z.string(),
    tickets: z.number(),
    responseTime: z.number(),
    resolutionTime: z.number(),
    satisfaction: z.number(),
    automationRate: z.number()
  })),
  categories: z.array(z.object({
    category: z.string(),
    count: z.number(),
    percentage: z.number(),
    averageResolutionTime: z.number(),
    satisfaction: z.number()
  })),
  channels: z.array(z.object({
    channel: z.string(),
    tickets: z.number(),
    responseTime: z.number(),
    satisfaction: z.number(),
    automationRate: z.number()
  })),
  agents: z.array(z.object({
    id: z.string(),
    name: z.string(),
    tickets: z.number(),
    responseTime: z.number(),
    resolutionTime: z.number(),
    satisfaction: z.number(),
    efficiency: z.number()
  })),
  sentiment: z.object({
    positive: z.number(),
    neutral: z.number(),
    negative: z.number(),
    veryNegative: z.number()
  }),
  languages: z.array(z.object({
    language: z.string(),
    tickets: z.number(),
    percentage: z.number(),
    satisfaction: z.number()
  }))
});

// Export types
export type SupportTicket = z.infer<typeof SupportTicketSchema>;
export type KnowledgeBaseArticle = z.infer<typeof KnowledgeBaseArticleSchema>;
export type CustomerProfile = z.infer<typeof CustomerProfileSchema>;
export type AutomationRule = z.infer<typeof AutomationRuleSchema>;
export type SLAPolicy = z.infer<typeof SLAPolicySchema>;
export type ChatbotConfig = z.infer<typeof ChatbotConfigSchema>;
export type SupportAnalytics = z.infer<typeof AnalyticsSchema>;

// AI Processing Types
export interface AIInsight {
  id: string;
  type: 'pattern' | 'opportunity' | 'risk' | 'trend' | 'performance' | 'prediction';
  severity: 'info' | 'warning' | 'error' | 'success';
  title: string;
  description: string;
  recommendation?: string;
  confidence: number;
  impact?: {
    efficiency: number;
    satisfaction: number;
    cost: number;
    revenue: number;
  };
  data: {
    relatedTickets?: string[];
    customerSegments?: string[];
    timeRange?: string;
    metrics?: Record<string, number>;
    predictions?: Record<string, any>;
  };
  timestamp: string;
  expires?: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

export interface AIRecommendation {
  id: string;
  ticketId?: string;
  customerId?: string;
  type: 'response' | 'action' | 'escalation' | 'knowledge' | 'routing' | 'proactive';
  title: string;
  description: string;
  suggestedText?: string;
  suggestedActions?: Array<{
    type: string;
    label: string;
    data?: any;
  }>;
  confidence: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedImpact?: {
    timeSaved: number; // in minutes
    satisfactionIncrease: number; // percentage
    costReduction: number; // monetary value
  };
  applied: boolean;
  appliedAt?: string;
  appliedBy?: string;
  feedback?: {
    rating: number;
    comment: string;
    timestamp: string;
    userId: string;
  };
  timestamp: string;
  expires?: string;
}

export interface KnowledgeSearchResult {
  articleId: string;
  title: string;
  summary: string;
  relevanceScore: number;
  category: string;
  tags: string[];
  lastUpdated: string;
  usageCount: number;
  effectiveness: number;
  suggestedResponse?: string;
  relatedArticles?: Array<{
    id: string;
    title: string;
    relevanceScore: number;
  }>;
}

export interface SentimentAnalysis {
  overall: 'positive' | 'neutral' | 'negative' | 'very_negative';
  score: number; // -1 to 1
  confidence: number;
  emotions: {
    joy: number;
    anger: number;
    fear: number;
    sadness: number;
    disgust: number;
    surprise: number;
  };
  keyPhrases: string[];
  urgency: 'low' | 'medium' | 'high';
  sarcasm: boolean;
  language: string;
  processedAt: string;
}

export interface CustomerIntent {
  primary: string;
  secondary?: string[];
  confidence: number;
  entities: Array<{
    type: string;
    value: string;
    startIndex: number;
    endIndex: number;
  }>;
  context: {
    previousIntents: string[];
    topicHistory: string[];
    customerProfile: Partial<CustomerProfile>;
  };
  nextActions: string[];
  estimatedComplexity: 'low' | 'medium' | 'high';
  processingTime: number;
}

// Export AI types
export type {
  AIInsight,
  AIRecommendation,
  KnowledgeSearchResult,
  SentimentAnalysis,
  CustomerIntent
};

// Helper types for form handling
export interface SupportTicketFormData {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  subject: string;
  description: string;
  category: SupportTicket['category'];
  priority: SupportTicket['priority'];
  department?: SupportTicket['department'];
  tags: string[];
  relatedBookingId?: string;
  relatedServiceId?: string;
}

export interface AutomationRuleFormData {
  name: string;
  description: string;
  category: AutomationRule['category'];
  trigger: AutomationRule['trigger'];
  actions: AutomationRule['actions'];
  priority: AutomationRule['priority'];
  aiEnhanced: boolean;
  learningEnabled: boolean;
}

export interface ChatbotConfigFormData {
  name: string;
  personality: ChatbotConfig['personality'];
  capabilities: ChatbotConfig['capabilities'];
  responses: ChatbotConfig['responses'];
  aiSettings: ChatbotConfig['aiSettings'];
  languages: string[];
}

// Default configurations
export const DEFAULT_CHATBOT_CONFIG: Partial<ChatbotConfig> = {
  personality: {
    tone: 'luxury',
    language: 'en',
    responseStyle: 'conversational',
    empathy: true,
    useEmojis: false,
    greetingStyle: 'personalized'
  },
  capabilities: {
    booking: true,
    rescheduling: true,
    pricing: true,
    knowledgeSearch: true,
    sentimentDetection: true,
    languageDetection: true,
    escalation: true,
    personalization: true,
    proactiveHelp: true
  },
  aiSettings: {
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 1000,
    contextWindow: 10,
    confidenceThreshold: 0.8,
    learningEnabled: true,
    personalizationEnabled: true
  },
  integration: {
    bookingSystem: true,
    crm: true,
    knowledgeBase: true,
    payment: false,
    calendar: true,
    analytics: true
  },
  languages: ['en', 'pl'],
  active: true,
  version: 1
};

export const DEFAULT_SLA_POLICIES: Partial<SLAPolicy>[] = [
  {
    name: 'Urgent Tickets',
    category: 'response_time',
    conditions: [
      { field: 'priority', operator: 'equals', value: 'urgent' },
      { field: 'priority', operator: 'equals', value: 'critical' }
    ],
    targets: {
      firstResponse: 15, // 15 minutes
      resolution: 120 // 2 hours
    },
    priority: 'urgent'
  },
  {
    name: 'High Priority Tickets',
    category: 'response_time',
    conditions: [
      { field: 'priority', operator: 'equals', value: 'high' }
    ],
    targets: {
      firstResponse: 60, // 1 hour
      resolution: 480 // 8 hours
    },
    priority: 'high'
  },
  {
    name: 'Standard Tickets',
    category: 'response_time',
    conditions: [
      { field: 'priority', operator: 'equals', value: 'medium' },
      { field: 'priority', operator: 'equals', value: 'low' }
    ],
    targets: {
      firstResponse: 240, // 4 hours
      resolution: 1440 // 24 hours
    },
    priority: 'medium'
  },
  {
    name: 'VIP Customers',
    category: 'response_time',
    conditions: [
      { field: 'customer.isVIP', operator: 'equals', value: true }
    ],
    targets: {
      firstResponse: 30, // 30 minutes
      resolution: 240 // 4 hours
    },
    priority: 'high'
  }
];

// Utility functions
export const calculateTicketValue = (ticket: SupportTicket): number => {
  let baseValue = 0;

  switch (ticket.category) {
    case 'booking':
      baseValue = 500; // Average booking value
      break;
    case 'technical':
      baseValue = 200; // Technical support value
      break;
    case 'billing':
      baseValue = 1000; // Billing issues affect revenue
      break;
    case 'complaint':
      baseValue = -500; // Negative value
      break;
    default:
      baseValue = 100;
  }

  // Adjust by priority
  const priorityMultiplier = {
    low: 0.5,
    medium: 1,
    high: 2,
    urgent: 3,
    critical: 5
  }[ticket.priority];

  return baseValue * priorityMultiplier;
};

export const estimateResolutionTime = (ticket: SupportTicket): number => {
  const baseTimes = {
    booking: 30, // 30 minutes
    technical: 120, // 2 hours
    billing: 60, // 1 hour
    general: 15, // 15 minutes
    complaint: 90, // 1.5 hours
    feedback: 10 // 10 minutes
  };

  const priorityMultiplier = {
    low: 2,
    medium: 1,
    high: 0.5,
    urgent: 0.25,
    critical: 0.1
  }[ticket.priority];

  return Math.round(baseTimes[ticket.category] * priorityMultiplier);
};

export const calculateChurnRisk = (customer: CustomerProfile, recentTickets: SupportTicket[]): 'low' | 'medium' | 'high' => {
  const recentComplaints = recentTickets.filter(t =>
    t.category === 'complaint' &&
    new Date(t.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  ).length;

  const recentNegativeTickets = recentTickets.filter(t =>
    t.sentiment === 'negative' || t.sentiment === 'very_negative'
  ).length;

  const satisfactionScore = customer.satisfactionHistory
    .slice(-5)
    .reduce((acc, h) => acc + h.rating, 0) / Math.min(customer.satisfactionHistory.length, 5);

  if (recentComplaints >= 2 || recentNegativeTickets >= 3 || satisfactionScore < 2) {
    return 'high';
  } else if (recentComplaints >= 1 || recentNegativeTickets >= 1 || satisfactionScore < 3) {
    return 'medium';
  } else {
    return 'low';
  }
};