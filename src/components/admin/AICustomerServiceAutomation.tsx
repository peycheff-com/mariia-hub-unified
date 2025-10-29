import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  MessageSquare,
  Bot,
  Users,
  Brain,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Phone,
  Mail,
  MessageCircle,
  Send,
  Settings,
  Zap,
  Star,
  Heart,
  Target,
  Activity,
  BarChart3,
  Eye,
  Edit,
  Trash2,
  Plus,
  RefreshCw,
  Filter,
  Search,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Lightbulb,
  User,
  Calendar,
  CreditCard,
  ThumbsUp,
  ThumbsDown,
  Smile,
  Frown,
  Meh,
  Volume2,
  VolumeX,
  Reply,
  Forward,
  Paperclip,
  Download,
  Upload,
  Link,
  Copy,
  Globe,
  Smartphone,
  Headphones,
  HelpCircle,
  Info,
  Sparkles,
  Bot as BotIcon,
  UserCheck,
  Clock as ClockIcon,
  Timer,
  Target as TargetIcon,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

// Enhanced Customer Service Automation Interfaces
interface AIConversation {
  id: string;
  customerId: string;
  customerName: string;
  messages: ConversationMessage[];
  status: 'active' | 'resolved' | 'escalated' | 'automated';
  channel: 'chat' | 'email' | 'phone' | 'whatsapp' | 'sms';
  startTime: string;
  endTime?: string;
  duration?: number;
  aiHandled: boolean;
  humanHandled: boolean;
  sentiment: 'positive' | 'negative' | 'neutral';
  topics: string[];
  resolution?: {
    type: 'automated' | 'human' | 'hybrid';
    confidence: number;
    timeToResolution: number;
    customerSatisfaction?: number;
  };
  aiInsights: {
    customerIntent: string;
    recommendedActions: string[];
    escalationProbability: number;
    suggestedResponses: string[];
    knowledgeBaseMatches: KnowledgeMatch[];
  };
  performance: {
    responseTime: number;
    firstResponseTime: number;
    resolutionTime: number;
    customerSatisfaction: number;
    automatedResponses: number;
    escalationRate: number;
  };
}

interface ConversationMessage {
  id: string;
  sender: 'customer' | 'ai' | 'human';
  content: string;
  timestamp: string;
  channel: string;
  aiGenerated: boolean;
  confidence?: number;
  suggestedActions?: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
  attachments?: MessageAttachment[];
}

interface MessageAttachment {
  id: string;
  type: 'image' | 'document' | 'audio' | 'video';
  name: string;
  url: string;
  size: number;
}

interface KnowledgeMatch {
  articleId: string;
  title: string;
  content: string;
  relevanceScore: number;
  category: string;
  lastUpdated: string;
  usageCount: number;
}

interface CustomerServiceMetrics {
  totalConversations: number;
  activeConversations: number;
  aiHandledConversations: number;
  averageResponseTime: number;
  averageResolutionTime: number;
  customerSatisfaction: number;
  automationRate: number;
  escalationRate: number;
  topTopics: {
    topic: string;
    count: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  }[];
  channelPerformance: {
    channel: string;
    conversations: number;
    satisfaction: number;
    responseTime: number;
    automationRate: number;
  }[];
  agentPerformance: {
    agentId: string;
    agentName: string;
    conversations: number;
    satisfaction: number;
    responseTime: number;
    resolutionRate: number;
  }[];
}

interface AIAutomationRule {
  id: string;
  name: string;
  description: string;
  category: 'routing' | 'response' | 'escalation' | 'proactive' | 'sentiment' | 'knowledge';
  status: 'active' | 'paused' | 'draft';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  performance: {
    successRate: number;
    accuracy: number;
    customerSatisfaction: number;
    executionsCount: number;
  };
  aiEnhanced: boolean;
  learningEnabled: boolean;
}

interface AutomationCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'sentiment_is' | 'topic_is';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

interface AutomationAction {
  type: 'send_message' | 'route_to_agent' | 'escalate' | 'create_ticket' | 'update_crm' | 'analyze_sentiment' | 'search_knowledge' | 'suggest_response' | 'trigger_workflow';
  parameters: Record<string, any>;
  delay?: number;
  order: number;
}

interface AIInsight {
  id: string;
  type: 'pattern' | 'opportunity' | 'risk' | 'trend' | 'performance';
  severity: 'info' | 'warning' | 'error' | 'success';
  title: string;
  description: string;
  recommendation?: string;
  impact?: {
    efficiency: number;
    satisfaction: number;
    cost: number;
  };
  data: {
    relatedConversations?: string[];
    customerSegments?: string[];
    timeRange?: string;
    metrics?: Record<string, number>;
  };
  timestamp: string;
}

interface AIKnowledgeBase {
  articles: KnowledgeArticle[];
  categories: string[];
  lastUpdated: string;
  totalArticles: number;
  searchIndex: Map<string, string[]>; // Simple inverted index
}

interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  priority: number;
  lastUpdated: string;
  usageCount: number;
  effectiveness: number;
  aiGenerated: boolean;
  relatedArticles: string[];
  faqs?: {
    question: string;
    answer: string;
    usageCount: number;
  }[];
}

const AICustomerServiceAutomation: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'conversations' | 'automation' | 'knowledge' | 'insights' | 'settings' | 'analytics'>('conversations');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterChannel, setFilterChannel] = useState('all');
  const [sortBy, setSortBy] = useState('startTime');
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [automationRules, setAutomationRules] = useState<AIAutomationRule[]>([]);
  const [knowledgeBase, setKnowledgeBase] = useState<AIKnowledgeBase | null>(null);
  const [metrics, setMetrics] = useState<CustomerServiceMetrics | null>(null);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<AIConversation | null>(null);

  // AI Settings
  const [aiResponseEnabled, setAiResponseEnabled] = useState(true);
  const [sentimentAnalysisEnabled, setSentimentAnalysisEnabled] = useState(true);
  const [proactiveEngagementEnabled, setProactiveEngagementEnabled] = useState(true);
  const [autoEscalationEnabled, setAutoEscalationEnabled] = useState(true);
  const [learningMode, setLearningMode] = useState(true);

  // Real-time metrics
  const performanceScore = useMemo(() => {
    if (!metrics) return 0;
    return Math.round(
      (metrics.customerSatisfaction * 0.4) +
      ((100 - metrics.averageResponseTime) * 0.3) +
      (metrics.automationRate * 0.2) +
      ((100 - metrics.escalationRate) * 0.1)
    );
  }, [metrics]);

  // Load data
  useEffect(() => {
    loadConversations();
    loadAutomationRules();
    loadKnowledgeBase();
    loadMetrics();
    loadInsights();

    // Set up real-time updates
    const interval = setInterval(() => {
      loadMetrics();
      loadRecentConversations();
    }, 15000); // Update every 15 seconds

    return () => clearInterval(interval);
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      // Simulate loading conversations
      const mockConversations: AIConversation[] = [
        {
          id: 'conv-1',
          customerId: 'customer-1',
          customerName: 'Anna Kowalska',
          messages: [
            {
              id: 'msg-1',
              sender: 'customer',
              content: 'Hi, I would like to book a facial treatment for this weekend',
              timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
              channel: 'chat',
              aiGenerated: false
            },
            {
              id: 'msg-2',
              sender: 'ai',
              content: 'Hello Anna! I\'d be happy to help you book a facial treatment. We have several options available for this weekend. Would you prefer a luxury facial treatment or a more basic skincare session?',
              timestamp: new Date(Date.now() - 28 * 60 * 1000).toISOString(),
              channel: 'chat',
              aiGenerated: true,
              confidence: 92,
              suggestedActions: ['Offer luxury facial', 'Check weekend availability', 'Provide pricing options']
            },
            {
              id: 'msg-3',
              sender: 'customer',
              content: 'I\'m interested in the luxury facial treatment. What are the available time slots?',
              timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
              channel: 'chat',
              aiGenerated: false
            },
            {
              id: 'msg-4',
              sender: 'ai',
              content: 'Great choice! We have luxury facial treatment slots available on Saturday at 10:00 AM, 2:00 PM, and 4:00 PM. The 60-minute luxury facial includes deep cleansing, exfoliation, massage, and custom mask treatment. Would you like me to book any of these slots for you?',
              timestamp: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
              channel: 'chat',
              aiGenerated: true,
              confidence: 95
            }
          ],
          status: 'active',
          channel: 'chat',
          startTime: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
          aiHandled: true,
          humanHandled: false,
          sentiment: 'positive',
          topics: ['booking', 'facial_treatment', 'weekend_availability'],
          aiInsights: {
            customerIntent: 'book_luxury_facial',
            recommendedActions: ['Check availability', 'Offer weekend slots', 'Provide detailed service description'],
            escalationProbability: 15,
            suggestedResponses: [
              'I have luxury facial slots available this weekend',
              'Let me check our weekend availability for you',
              'Would you like me to describe our luxury facial treatment?'
            ],
            knowledgeBaseMatches: [
              {
                articleId: 'kb-1',
                title: 'Luxury Facial Treatment Description',
                content: 'Our luxury facial treatment includes...',
                relevanceScore: 94,
                category: 'services',
                lastUpdated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                usageCount: 234
              }
            ]
          },
          performance: {
            responseTime: 120,
            firstResponseTime: 120,
            resolutionTime: 0,
            customerSatisfaction: 0,
            automatedResponses: 2,
            escalationRate: 0
          }
        },
        {
          id: 'conv-2',
          customerId: 'customer-2',
          customerName: 'Marek Nowak',
          messages: [
            {
              id: 'msg-5',
              sender: 'customer',
              content: 'I need to cancel my appointment for tomorrow',
              timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
              channel: 'email',
              aiGenerated: false,
              sentiment: 'negative'
            }
          ],
          status: 'resolved',
          channel: 'email',
          startTime: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          duration: 300,
          aiHandled: true,
          humanHandled: false,
          sentiment: 'negative',
          topics: ['cancellation', 'appointment'],
          resolution: {
            type: 'automated',
            confidence: 98,
            timeToResolution: 300,
            customerSatisfaction: 85
          },
          aiInsights: {
            customerIntent: 'cancel_appointment',
            recommendedActions: ['Process cancellation', 'Check cancellation policy', 'Offer rescheduling'],
            escalationProbability: 5,
            suggestedResponses: [
              'I can process your cancellation right away',
              'Would you like to reschedule instead?',
              'Your cancellation has been processed successfully'
            ],
            knowledgeBaseMatches: [
              {
                articleId: 'kb-2',
                title: 'Cancellation Policy',
                content: 'Our cancellation policy...',
                relevanceScore: 89,
                category: 'policies',
                lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                usageCount: 156
              }
            ]
          },
          performance: {
            responseTime: 60,
            firstResponseTime: 60,
            resolutionTime: 300,
            customerSatisfaction: 85,
            automatedResponses: 1,
            escalationRate: 0
          }
        }
      ];

      setConversations(mockConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  }, []);

  const loadAutomationRules = useCallback(async () => {
    try {
      const mockRules: AIAutomationRule[] = [
        {
          id: 'rule-1',
          name: 'Intent-Based Routing',
          description: 'Automatically route conversations based on AI-detected customer intent',
          category: 'routing',
          status: 'active',
          priority: 'high',
          conditions: [
            {
              field: 'customerIntent',
              operator: 'equals',
              value: 'booking_request'
            }
          ],
          actions: [
            {
              type: 'route_to_agent',
              parameters: {
                agentType: 'booking_specialist',
                priority: 'high'
              },
              order: 1
            }
          ],
          performance: {
            successRate: 94,
            accuracy: 91,
            customerSatisfaction: 88,
            executionsCount: 1456
          },
          aiEnhanced: true,
          learningEnabled: true
        },
        {
          id: 'rule-2',
          name: 'Negative Sentiment Escalation',
          description: 'Automatically escalate conversations with negative sentiment to human agents',
          category: 'sentiment',
          status: 'active',
          priority: 'urgent',
          conditions: [
            {
              field: 'sentiment',
              operator: 'sentiment_is',
              value: 'negative'
            }
          ],
          actions: [
            {
              type: 'escalate',
              parameters: {
                reason: 'negative_sentiment',
                priority: 'urgent',
                notifyManager: true
              },
              order: 1
            }
          ],
          performance: {
            successRate: 96,
            accuracy: 94,
            customerSatisfaction: 91,
            executionsCount: 89
          },
          aiEnhanced: true,
          learningEnabled: true
        },
        {
          id: 'rule-3',
          name: 'Knowledge Base Search',
          description: 'Automatically search knowledge base for relevant articles',
          category: 'knowledge',
          status: 'active',
          priority: 'medium',
          conditions: [
            {
              field: 'message.content',
              operator: 'contains',
              value: 'how to'
            }
          ],
          actions: [
            {
              type: 'search_knowledge',
              parameters: {
                maxResults: 3,
                minRelevance: 0.8
              },
              order: 1
            },
            {
              type: 'suggest_response',
              parameters: {
                includeKnowledgeResults: true
              },
              order: 2
            }
          ],
          performance: {
            successRate: 87,
            accuracy: 89,
            customerSatisfaction: 82,
            executionsCount: 567
          },
          aiEnhanced: true,
          learningEnabled: true
        }
      ];

      setAutomationRules(mockRules);
    } catch (error) {
      console.error('Error loading automation rules:', error);
    }
  }, []);

  const loadKnowledgeBase = useCallback(async () => {
    try {
      const mockKnowledgeBase: AIKnowledgeBase = {
        articles: [
          {
            id: 'kb-1',
            title: 'Luxury Facial Treatment Description',
            content: 'Our luxury facial treatment is a comprehensive 60-minute skincare experience that includes deep cleansing, professional exfoliation, personalized massage, and custom mask application. Perfect for all skin types.',
            category: 'services',
            tags: ['facial', 'luxury', 'skincare', 'treatment'],
            priority: 1,
            lastUpdated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            usageCount: 234,
            effectiveness: 94,
            aiGenerated: false,
            relatedArticles: ['kb-2', 'kb-3'],
            faqs: [
              {
                question: 'How long does the treatment take?',
                answer: 'The luxury facial treatment takes approximately 60 minutes.',
                usageCount: 45
              },
              {
                question: 'Is it suitable for sensitive skin?',
                answer: 'Yes, we customize the treatment based on your skin type and sensitivity.',
                usageCount: 32
              }
            ]
          },
          {
            id: 'kb-2',
            title: 'Cancellation Policy',
            content: 'We understand that sometimes plans change. You can cancel or reschedule your appointment up to 24 hours before your scheduled time without any charges. Cancellations made less than 24 hours in advance may incur a cancellation fee.',
            category: 'policies',
            tags: ['cancellation', 'policy', 'fees', 'rescheduling'],
            priority: 2,
            lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            usageCount: 156,
            effectiveness: 89,
            aiGenerated: true,
            relatedArticles: ['kb-1', 'kb-4']
          }
        ],
        categories: ['services', 'policies', 'pricing', 'booking', 'aftercare'],
        lastUpdated: new Date().toISOString(),
        totalArticles: 2,
        searchIndex: new Map()
      };

      // Build simple search index
      mockKnowledgeBase.articles.forEach(article => {
        const words = article.title.toLowerCase().split(' ');
        words.forEach(word => {
          if (!mockKnowledgeBase.searchIndex.has(word)) {
            mockKnowledgeBase.searchIndex.set(word, []);
          }
          mockKnowledgeBase.searchIndex.get(word)?.push(article.id);
        });
      });

      setKnowledgeBase(mockKnowledgeBase);
    } catch (error) {
      console.error('Error loading knowledge base:', error);
    }
  }, []);

  const loadMetrics = useCallback(async () => {
    try {
      const mockMetrics: CustomerServiceMetrics = {
        totalConversations: 1247,
        activeConversations: 23,
        aiHandledConversations: 856,
        averageResponseTime: 90,
        averageResolutionTime: 480,
        customerSatisfaction: 87,
        automationRate: 69,
        escalationRate: 12,
        topTopics: [
          { topic: 'booking_request', count: 342, trend: 'increasing' },
          { topic: 'cancellation', count: 234, trend: 'stable' },
          { topic: 'pricing_inquiry', count: 189, trend: 'increasing' },
          { topic: 'service_details', count: 156, trend: 'decreasing' }
        ],
        channelPerformance: [
          { channel: 'chat', conversations: 456, satisfaction: 89, responseTime: 75, automationRate: 78 },
          { channel: 'email', conversations: 398, satisfaction: 91, responseTime: 120, automationRate: 65 },
          { channel: 'phone', conversations: 234, satisfaction: 85, responseTime: 60, automationRate: 45 }
        ],
        agentPerformance: [
          { agentId: 'agent-1', agentName: 'Anna S.', conversations: 234, satisfaction: 92, responseTime: 85, resolutionRate: 94 },
          { agentId: 'agent-2', agentName: 'Piotr K.', conversations: 189, satisfaction: 88, responseTime: 95, resolutionRate: 89 }
        ]
      };

      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  }, []);

  const loadInsights = useCallback(async () => {
    try {
      const mockInsights: AIInsight[] = [
        {
          id: 'insight-1',
          type: 'pattern',
          severity: 'warning',
          title: 'Increased Booking Cancellations',
          description: '30% increase in cancellation requests for weekend appointments',
          recommendation: 'Review weekend availability and consider implementing confirmation reminders',
          impact: {
            efficiency: -15,
            satisfaction: -8,
            cost: 5000
          },
          data: {
            relatedConversations: ['conv-3', 'conv-4', 'conv-5'],
            customerSegments: ['new_clients'],
            timeRange: 'last_7_days'
          },
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'insight-2',
          type: 'performance',
          severity: 'success',
          title: 'AI Response Performance Improving',
          description: 'AI-generated responses showing 94% customer satisfaction rate',
          recommendation: 'Expand AI response coverage to more inquiry types',
          impact: {
            efficiency: 25,
            satisfaction: 8,
            cost: -8000
          },
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
        }
      ];

      setInsights(mockInsights);
    } catch (error) {
      console.error('Error loading insights:', error);
    }
  }, []);

  const loadRecentConversations = useCallback(async () => {
    // Load recent conversations for real-time monitoring
  }, []);

  // Filter and sort conversations
  const filteredConversations = useMemo(() => {
    let filtered = conversations;

    if (searchQuery) {
      filtered = filtered.filter(conv =>
        conv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.topics.some(topic => topic.toLowerCase().includes(searchQuery.toLowerCase())) ||
        conv.messages.some(msg => msg.content.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(conv => conv.status === filterStatus);
    }

    if (filterChannel !== 'all') {
      filtered = filtered.filter(conv => conv.channel === filterChannel);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'startTime':
          return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
        case 'customerName':
          return a.customerName.localeCompare(b.customerName);
        case 'duration':
          return (b.duration || 0) - (a.duration || 0);
        case 'satisfaction':
          return (b.performance?.customerSatisfaction || 0) - (a.performance?.customerSatisfaction || 0);
        default:
          return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
      }
    });

    return filtered;
  }, [conversations, searchQuery, filterStatus, filterChannel, sortBy]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Customer Service Automation</h2>
          <p className="text-muted-foreground">Intelligent customer service with AI-powered responses and automation</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">Performance Score:</div>
          <div className="text-xl font-bold text-green-600">{performanceScore}/100</div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadMetrics()}
            disabled={refreshing}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Real-time Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.activeConversations || 0}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              12% from last hour
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Automation Rate</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.automationRate || 0}%</div>
            <Progress value={metrics?.automationRate || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer Satisfaction</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.customerSatisfaction || 0}%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Heart className="h-3 w-3 mr-1 text-red-500" />
              Excellent rating
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.averageResponseTime || 0}s</div>
            <div className="text-xs text-muted-foreground">
              45% faster than industry average
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="conversations" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Conversations
          </TabsTrigger>
          <TabsTrigger value="automation" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Automation
          </TabsTrigger>
          <TabsTrigger value="knowledge" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Knowledge Base
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Insights
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Conversations Tab */}
        <TabsContent value="conversations" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="escalated">Escalated</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterChannel} onValueChange={setFilterChannel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Channels</SelectItem>
                    <SelectItem value="chat">Chat</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="startTime">Sort by Time</SelectItem>
                    <SelectItem value="customerName">Sort by Customer</SelectItem>
                    <SelectItem value="duration">Sort by Duration</SelectItem>
                    <SelectItem value="satisfaction">Sort by Satisfaction</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Conversations List */}
          <div className="space-y-4">
            {filteredConversations.map((conversation) => (
              <Card
                key={conversation.id}
                className={cn(
                  "hover:shadow-lg transition-shadow cursor-pointer",
                  conversation.status === 'escalated' && "border-red-200",
                  conversation.status === 'resolved' && "border-green-200"
                )}
                onClick={() => setSelectedConversation(conversation)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{conversation.customerName}</h3>
                        <Badge variant={
                          conversation.status === 'active' ? 'default' :
                          conversation.status === 'resolved' ? 'secondary' :
                          conversation.status === 'escalated' ? 'destructive' : 'outline'
                        }>
                          {conversation.status}
                        </Badge>
                        {conversation.aiHandled && (
                          <Badge variant="secondary" className="text-xs">
                            <Bot className="h-3 w-3 mr-1" />
                            AI Handled
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {conversation.channel}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(conversation.startTime).toLocaleString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {conversation.messages.length} messages
                        </div>
                        {conversation.duration && (
                          <div className="flex items-center gap-1">
                            <Timer className="h-3 w-3" />
                            {Math.round(conversation.duration / 60)} min
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Topics:</span>
                      <div className="flex flex-wrap gap-1">
                        {conversation.topics.map((topic) => (
                          <Badge key={topic} variant="outline" className="text-xs">
                            {topic.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Sentiment:</span>
                      <div className={cn(
                        "flex items-center gap-1",
                        conversation.sentiment === 'positive' ? "text-green-600" :
                        conversation.sentiment === 'negative' ? "text-red-600" : "text-gray-600"
                      )}>
                        {conversation.sentiment === 'positive' && <Smile className="h-4 w-4" />}
                        {conversation.sentiment === 'negative' && <Frown className="h-4 w-4" />}
                        {conversation.sentiment === 'neutral' && <Meh className="h-4 w-4" />}
                        <span className="capitalize">{conversation.sentiment}</span>
                      </div>
                    </div>

                    {conversation.aiInsights.customerIntent && (
                      <div className="flex items-center gap-2 text-sm">
                        <Brain className="h-3 w-3 text-blue-500" />
                        <span className="font-medium">Intent:</span>
                        <span>{conversation.aiInsights.customerIntent.replace('_', ' ')}</span>
                      </div>
                    )}

                    {conversation.performance && (
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Response Time:</span>
                          <span className="ml-1">{conversation.performance.responseTime}s</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Satisfaction:</span>
                          <span className="ml-1">{conversation.performance.customerSatisfaction || 0}%</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Escalation:</span>
                          <span className="ml-1">{conversation.performance.escalationRate}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Automation Rules Tab */}
        <TabsContent value="automation" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {automationRules.map((rule) => (
              <Card key={rule.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{rule.name}</h3>
                      <Badge variant={
                        rule.priority === 'urgent' ? 'destructive' :
                        rule.priority === 'high' ? 'default' : 'secondary'
                      }>
                        {rule.priority}
                      </Badge>
                      <Badge variant={
                        rule.status === 'active' ? 'default' :
                        rule.status === 'paused' ? 'secondary' : 'outline'
                      }>
                        {rule.status}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">{rule.description}</p>

                    <div className="space-y-2">
                      <div className="text-sm font-medium">Conditions:</div>
                      <div className="space-y-1">
                        {rule.conditions.map((condition, index) => (
                          <div key={index} className="p-2 bg-muted/50 rounded text-xs">
                            <span className="font-medium">{condition.field}</span>
                            <span className="mx-1">{condition.operator}</span>
                            <span className="font-medium">{condition.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium">Performance:</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Success Rate:</span>
                          <span className="ml-1">{rule.performance.successRate}%</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Accuracy:</span>
                          <span className="ml-1">{rule.performance.accuracy}%</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Satisfaction:</span>
                          <span className="ml-1">{rule.performance.customerSatisfaction}%</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Executions:</span>
                          <span className="ml-1">{rule.performance.executionsCount}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      {rule.aiEnhanced && (
                        <Badge variant="secondary" className="text-xs">
                          <Brain className="h-3 w-3 mr-1" />
                          AI-Enhanced
                        </Badge>
                      )}
                      {rule.learningEnabled && (
                        <Badge variant="outline" className="text-xs">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Learning Enabled
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Other tabs would be implemented similarly */}
        <TabsContent value="knowledge" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Knowledge Base</CardTitle>
              <CardDescription>
                Intelligent knowledge management for AI-powered customer support
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Knowledge base management interface would be implemented here
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Features: AI article generation, auto-categorization, search optimization
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="space-y-4">
            {insights.map((insight) => (
              <Alert key={insight.id} className={cn(
                "border-l-4",
                insight.severity === 'error' ? "border-red-500 bg-red-50" :
                insight.severity === 'warning' ? "border-yellow-500 bg-yellow-50" :
                insight.severity === 'success' ? "border-green-500 bg-green-50" :
                "border-blue-500 bg-blue-50"
              )}>
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {insight.type === 'performance' && <TrendingUp className="h-4 w-4 text-green-600" />}
                      {insight.type === 'pattern' && <Target className="h-4 w-4 text-blue-600" />}
                      {insight.type === 'risk' && <AlertTriangle className="h-4 w-4 text-orange-600" />}
                      <h4 className="font-semibold">{insight.title}</h4>
                    </div>
                    <AlertDescription>{insight.description}</AlertDescription>
                    {insight.recommendation && (
                      <div className="mt-2 p-3 bg-muted/50 rounded">
                        <div className="font-medium text-sm mb-1">Recommendation:</div>
                        <p className="text-sm">{insight.recommendation}</p>
                        {insight.impact && (
                          <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">Efficiency:</span>
                              <span className="ml-1">{insight.impact.efficiency > 0 ? '+' : ''}{insight.impact.efficiency}%</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Satisfaction:</span>
                              <span className="ml-1">{insight.impact.satisfaction > 0 ? '+' : ''}{insight.impact.satisfaction}%</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Cost:</span>
                              <span className="ml-1">PLN {Math.abs(insight.impact.cost).toLocaleString()}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(insight.timestamp).toLocaleString()}
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Automation Settings</CardTitle>
              <CardDescription>
                Configure AI behavior and automation preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">AI Response Generation</div>
                      <p className="text-sm text-muted-foreground">Enable AI to generate automatic responses</p>
                    </div>
                    <Switch
                      checked={aiResponseEnabled}
                      onCheckedChange={setAiResponseEnabled}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Sentiment Analysis</div>
                      <p className="text-sm text-muted-foreground">Analyze customer sentiment in real-time</p>
                    </div>
                    <Switch
                      checked={sentimentAnalysisEnabled}
                      onCheckedChange={setSentimentAnalysisEnabled}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Proactive Engagement</div>
                      <p className="text-sm text-muted-foreground">Reach out to customers proactively</p>
                    </div>
                    <Switch
                      checked={proactiveEngagementEnabled}
                      onCheckedChange={setProactiveEngagementEnabled}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Auto-Escalation</div>
                      <p className="text-sm text-muted-foreground">Automatically escalate based on rules</p>
                    </div>
                    <Switch
                      checked={autoEscalationEnabled}
                      onCheckedChange={setAutoEscalationEnabled}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Learning Mode</div>
                      <p className="text-sm text-muted-foreground">Improve responses through machine learning</p>
                    </div>
                    <Switch
                      checked={learningMode}
                      onCheckedChange={setLearningMode}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {metrics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Conversation Topics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metrics.topTopics.map((topic, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{topic.topic.replace('_', ' ')}</span>
                          <Badge variant="outline" className="text-xs">
                            {topic.count}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          {topic.trend === 'increasing' && <TrendingUp className="h-3 w-3 text-green-500" />}
                          {topic.trend === 'decreasing' && <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />}
                          {topic.trend === 'stable' && <div className="h-3 w-3 bg-gray-300 rounded-full" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Channel Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {metrics.channelPerformance.map((channel, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium capitalize">{channel.channel}</span>
                          <Badge variant="outline" className="text-xs">
                            {channel.conversations} conversations
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Satisfaction:</span>
                            <span className="ml-1">{channel.satisfaction}%</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Response Time:</span>
                            <span className="ml-1">{channel.responseTime}s</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Automation:</span>
                            <span className="ml-1">{channel.automationRate}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AICustomerServiceAutomation;