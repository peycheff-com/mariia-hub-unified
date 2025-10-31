import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  MessageSquare,
  Bot,
  Zap,
  Sparkles,
  BarChart3,
  PieChart,
  LineChart,
  Filter,
  Search,
  RefreshCw,
  Settings,
  Download,
  Upload,
  Share2,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  MoreVertical,
  Star,
  ThumbsUp,
  ThumbsDown,
  Award,
  Timer,
  Calendar,
  Globe,
  Languages,
  Smartphone,
  Mail,
  Phone,
  MessageCircle,
  Video,
  Headphones,
  HelpCircle,
  Info,
  Lightbulb,
  Cpu,
  Database,
  Shield,
  AlertCircle,
  CheckCircle as CheckCircleIcon,
  XCircle as XCircleIcon,
  AlertTriangle as AlertTriangleIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Activity as ActivityIcon,
  Target as TargetIcon,
  BarChart3 as BarChart3Icon,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Brain as BrainIcon,
  Zap as ZapIcon,
  Sparkles as SparklesIcon,
  Bot as BotIcon,
  Filter as FilterIcon,
  Search as SearchIcon,
  RefreshCw as RefreshCwIcon,
  Settings as SettingsIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Share2 as Share2Icon,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  Edit as EditIcon,
  Trash2 as Trash2Icon,
  Plus as PlusIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ChevronDown as ChevronDownIcon,
  ChevronUp as ChevronUpIcon,
  MoreHorizontal as MoreHorizontalIcon,
  MoreVertical as MoreVerticalIcon,
  Star as StarIcon,
  ThumbsUp as ThumbsUpIcon,
  ThumbsDown as ThumbsDownIcon,
  Award as AwardIcon,
  Timer as TimerIcon,
  Calendar as CalendarIcon,
  Globe as GlobeIcon,
  Languages as LanguagesIcon,
  Smartphone as SmartphoneIcon,
  Mail as MailIcon,
  Phone as PhoneIcon,
  MessageCircle as MessageCircleIcon,
  Video as VideoIcon,
  Headphones as HeadphonesIcon,
  HelpCircle as HelpCircleIcon,
  Info as InfoIcon,
  Lightbulb as LightbulbIcon,
  Cpu as CpuIcon,
  Database as DatabaseIcon,
  Shield as ShieldIcon,
  Clock as ClockIcon,
  Users as UsersIcon,
  MessageSquare as MessageSquareIcon
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

import { supportAutomationService } from '@/services/support-automation.service';
import {
  SupportTicket,
  AIInsight,
  AIRecommendation,
  SentimentAnalysis,
  CustomerIntent,
  CustomerProfile
} from '@/types/support-automation';

interface TicketIntelligenceSystemProps {
  className?: string;
  enableRealTimeAnalysis?: boolean;
  enablePredictiveInsights?: boolean;
  enableAutoCategorization?: boolean;
  enableSentimentAnalysis?: boolean;
  enableSmartRouting?: boolean;
}

interface TicketAnalytics {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  averageResponseTime: number;
  averageResolutionTime: number;
  customerSatisfaction: number;
  automationRate: number;
  escalationRate: number;
  categoryDistribution: Array<{
    category: string;
    count: number;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  sentimentDistribution: {
    positive: number;
    neutral: number;
    negative: number;
    very_negative: number;
  };
  priorityDistribution: Array<{
    priority: string;
    count: number;
    averageResolutionTime: number;
  }>;
  channelPerformance: Array<{
    channel: string;
    tickets: number;
    satisfaction: number;
    responseTime: number;
    automationRate: number;
  }>;
  agentPerformance: Array<{
    agentId: string;
    agentName: string;
    tickets: number;
    satisfaction: number;
    responseTime: number;
    resolutionRate: number;
    efficiency: number;
  }>;
  trends: {
    daily: Array<{ date: string; tickets: number; satisfaction: number }>;
    weekly: Array<{ week: string; tickets: number; satisfaction: number }>;
    monthly: Array<{ month: string; tickets: number; satisfaction: number }>;
  };
  predictions: {
    nextWeekVolume: number;
    predictedIssues: Array<{
      type: string;
      probability: number;
      impact: 'high' | 'medium' | 'low';
      recommendation: string;
    }>;
    resourceNeeds: {
      agents: number;
      peakHours: string[];
    };
  };
}

interface IntelligentQueue {
  id: string;
  name: string;
  tickets: SupportTicket[];
  priority: number;
  avgWaitTime: number;
  slaCompliance: number;
  autoAssignEnabled: boolean;
  aiOptimization: boolean;
  routingRules: Array<{
    condition: string;
    action: string;
    weight: number;
  }>;
}

export function TicketIntelligenceSystem({
  className,
  enableRealTimeAnalysis = true,
  enablePredictiveInsights = true,
  enableAutoCategorization = true,
  enableSentimentAnalysis = true,
  enableSmartRouting = true
}: TicketIntelligenceSystemProps) {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'insights' | 'automation' | 'queues'>('overview');

  // Data states
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [analytics, setAnalytics] = useState<TicketAnalytics | null>(null);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [queues, setQueues] = useState<IntelligentQueue[]>([]);

  // UI states
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [timeRange, setTimeRange] = useState('7d');

  // Feature toggles
  const [realTimeAnalysisEnabled, setRealTimeAnalysisEnabled] = useState(enableRealTimeAnalysis);
  const [predictiveInsightsEnabled, setPredictiveInsightsEnabled] = useState(enablePredictiveInsights);
  const [autoCategorizationEnabled, setAutoCategorizationEnabled] = useState(enableAutoCategorization);
  const [sentimentAnalysisEnabled, setSentimentAnalysisEnabled] = useState(enableSentimentAnalysis);
  const [smartRoutingEnabled, setSmartRoutingEnabled] = useState(enableSmartRouting);

  // Selected states
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [selectedInsight, setSelectedInsight] = useState<AIInsight | null>(null);
  const [selectedQueue, setSelectedQueue] = useState<IntelligentQueue | null>(null);

  // Load initial data
  useEffect(() => {
    loadData();
    if (realTimeAnalysisEnabled) {
      startRealTimeUpdates();
    }
    return () => stopRealTimeUpdates();
  }, [timeRange, realTimeAnalysisEnabled]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadTickets(),
        loadAnalytics(),
        loadInsights(),
        loadRecommendations(),
        loadQueues()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load ticket intelligence data');
    } finally {
      setLoading(false);
    }
  };

  const loadTickets = async () => {
    try {
      const mockTickets: SupportTicket[] = [
        {
          id: 'ticket-1',
          customerId: 'customer-1',
          customerName: 'Anna Kowalska',
          customerEmail: 'anna.kowalska@email.com',
          subject: 'Issue with facial treatment booking',
          description: 'I tried to book a facial treatment but the system keeps showing an error. I need this for Saturday if possible.',
          category: 'technical',
          priority: 'high',
          status: 'open',
          channel: 'chat',
          assignedAgentId: 'agent-1',
          assignedAgentName: 'Maria S.',
          tags: ['booking', 'error', 'urgent'],
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          aiProcessed: true,
          aiConfidence: 0.92,
          aiRecommendedActions: ['Check booking system', 'Offer manual booking', 'Escalate to technical team'],
          estimatedResolutionTime: 45,
          firstResponseTime: 5,
          customerWaitTime: 120,
          sentiment: 'negative',
          language: 'en',
          isVIP: true,
          value: 1500,
          churnRisk: 'medium'
        },
        {
          id: 'ticket-2',
          customerId: 'customer-2',
          customerName: 'Marek Nowak',
          customerEmail: 'marek.nowak@email.com',
          subject: 'Question about membership pricing',
          description: 'I\'m interested in the fitness membership. What are the different options and prices? Do you offer student discounts?',
          category: 'billing',
          priority: 'medium',
          status: 'in_progress',
          channel: 'email',
          assignedAgentId: 'agent-2',
          assignedAgentName: 'Piotr K.',
          tags: ['pricing', 'membership', 'inquiry'],
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          aiProcessed: true,
          aiConfidence: 0.88,
          aiRecommendedActions: ['Send pricing information', 'Ask about student status', 'Schedule consultation'],
          estimatedResolutionTime: 30,
          firstResponseTime: 15,
          customerWaitTime: 60,
          sentiment: 'neutral',
          language: 'pl',
          value: 800,
          churnRisk: 'low'
        }
      ];

      setTickets(mockTickets);
    } catch (error) {
      console.error('Error loading tickets:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      const mockAnalytics: TicketAnalytics = {
        totalTickets: 1247,
        openTickets: 23,
        resolvedTickets: 1189,
        averageResponseTime: 85,
        averageResolutionTime: 420,
        customerSatisfaction: 87,
        automationRate: 72,
        escalationRate: 8,
        categoryDistribution: [
          { category: 'technical', count: 342, percentage: 27.4, trend: 'up' },
          { category: 'billing', count: 298, percentage: 23.9, trend: 'stable' },
          { category: 'general', count: 234, percentage: 18.8, trend: 'down' },
          { category: 'booking', count: 189, percentage: 15.2, trend: 'up' },
          { category: 'complaint', count: 156, percentage: 12.5, trend: 'stable' },
          { category: 'feedback', count: 28, percentage: 2.2, trend: 'down' }
        ],
        sentimentDistribution: {
          positive: 456,
          neutral: 567,
          negative: 189,
          very_negative: 35
        },
        priorityDistribution: [
          { priority: 'urgent', count: 45, averageResolutionTime: 120 },
          { priority: 'high', count: 234, averageResolutionTime: 180 },
          { priority: 'medium', count: 567, averageResolutionTime: 240 },
          { priority: 'low', count: 401, averageResolutionTime: 360 }
        ],
        channelPerformance: [
          { channel: 'chat', tickets: 456, satisfaction: 89, responseTime: 75, automationRate: 78 },
          { channel: 'email', tickets: 398, satisfaction: 91, responseTime: 120, automationRate: 65 },
          { channel: 'phone', tickets: 234, satisfaction: 85, responseTime: 60, automationRate: 45 },
          { channel: 'whatsapp', tickets: 159, satisfaction: 87, responseTime: 90, automationRate: 82 }
        ],
        agentPerformance: [
          {
            agentId: 'agent-1',
            agentName: 'Maria S.',
            tickets: 234,
            satisfaction: 92,
            responseTime: 85,
            resolutionRate: 94,
            efficiency: 88
          },
          {
            agentId: 'agent-2',
            agentName: 'Piotr K.',
            tickets: 189,
            satisfaction: 88,
            responseTime: 95,
            resolutionRate: 89,
            efficiency: 82
          }
        ],
        trends: {
          daily: [
            { date: '2024-01-29', tickets: 45, satisfaction: 86 },
            { date: '2024-01-30', tickets: 52, satisfaction: 88 },
            { date: '2024-01-31', tickets: 48, satisfaction: 87 }
          ],
          weekly: [
            { week: '2024-W04', tickets: 312, satisfaction: 87 },
            { week: '2024-W05', tickets: 298, satisfaction: 89 }
          ],
          monthly: [
            { month: '2024-01', tickets: 1247, satisfaction: 87 },
            { month: '2023-12', tickets: 1156, satisfaction: 85 }
          ]
        },
        predictions: {
          nextWeekVolume: 1350,
          predictedIssues: [
            {
              type: 'Booking System Load',
              probability: 0.78,
              impact: 'high',
              recommendation: 'Increase server capacity and add backup booking options'
            },
            {
              type: 'Payment Processing Delays',
              probability: 0.65,
              impact: 'medium',
              recommendation: 'Monitor payment gateway and prepare manual processing options'
            }
          ],
          resourceNeeds: {
            agents: 8,
            peakHours: ['10:00-12:00', '14:00-16:00']
          }
        }
      };

      setAnalytics(mockAnalytics);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const loadInsights = async () => {
    try {
      const mockInsights: AIInsight[] = [
        {
          id: 'insight-1',
          type: 'pattern',
          severity: 'warning',
          title: 'Increased Technical Issues on Weekends',
          description: '45% increase in technical support tickets during weekends, primarily related to booking system errors.',
          recommendation: 'Deploy additional technical support staff on weekends and implement proactive system monitoring.',
          confidence: 0.89,
          impact: {
            efficiency: -20,
            satisfaction: -15,
            cost: 5000,
            revenue: -8000
          },
          data: {
            relatedTickets: ['ticket-1', 'ticket-3', 'ticket-5'],
            customerSegments: ['new_customers', 'mobile_users'],
            timeRange: 'last_30_days',
            metrics: { weekend_tickets: 78, weekday_tickets: 45 }
          },
          timestamp: new Date().toISOString(),
          acknowledged: false
        },
        {
          id: 'insight-2',
          type: 'opportunity',
          severity: 'success',
          title: 'High Chatbot Resolution Rate',
          description: 'AI chatbot is achieving 78% resolution rate for billing inquiries, significantly reducing agent workload.',
          recommendation: 'Expand chatbot capabilities to handle technical issues and provide proactive assistance.',
          confidence: 0.94,
          impact: {
            efficiency: 35,
            satisfaction: 8,
            cost: -12000,
            revenue: 5000
          },
          timestamp: new Date().toISOString(),
          acknowledged: false
        },
        {
          id: 'insight-3',
          type: 'risk',
          severity: 'error',
          title: 'Critical Response Time SLA Breach',
          description: 'Response time for high-priority tickets has increased by 40% in the past week, exceeding SLA targets.',
          recommendation: 'Immediate staff reallocation and review of ticket triage process required.',
          confidence: 0.96,
          impact: {
            efficiency: -25,
            satisfaction: -20,
            cost: 8000,
            revenue: -15000
          },
          timestamp: new Date().toISOString(),
          acknowledged: false
        }
      ];

      setInsights(mockInsights);
    } catch (error) {
      console.error('Error loading insights:', error);
    }
  };

  const loadRecommendations = async () => {
    try {
      const mockRecommendations: AIRecommendation[] = [
        {
          id: 'rec-1',
          ticketId: 'ticket-1',
          type: 'action',
          title: 'Escalate to Technical Team',
          description: 'This booking system error requires immediate technical attention.',
          suggestedActions: [
            { type: 'escalate', label: 'Escalate to Technical Team', data: { team: 'backend', priority: 'high' } },
            { type: 'create_task', label: 'Create Bug Report', data: { severity: 'high' } }
          ],
          confidence: 0.92,
          priority: 'urgent',
          estimatedImpact: {
            timeSaved: 180,
            satisfactionIncrease: 25,
            costReduction: 500
          },
          applied: false,
          timestamp: new Date().toISOString()
        },
        {
          id: 'rec-2',
          ticketId: 'ticket-2',
          type: 'response',
          title: 'Send Membership Pricing Information',
          description: 'Customer is interested in membership options with potential student discount.',
          suggestedText: 'Thank you for your interest in our fitness membership! I\'d be happy to provide you with our current pricing options. We offer several membership tiers, including a special student discount with valid ID. Would you like me to schedule a consultation to discuss the best option for your needs?',
          confidence: 0.88,
          priority: 'medium',
          estimatedImpact: {
            timeSaved: 15,
            satisfactionIncrease: 15,
            costReduction: 100
          },
          applied: false,
          timestamp: new Date().toISOString()
        }
      ];

      setRecommendations(mockRecommendations);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
  };

  const loadQueues = async () => {
    try {
      const mockQueues: IntelligentQueue[] = [
        {
          id: 'queue-1',
          name: 'High Priority',
          tickets: tickets.filter(t => t.priority === 'urgent' || t.priority === 'high'),
          priority: 1,
          avgWaitTime: 15,
          slaCompliance: 85,
          autoAssignEnabled: true,
          aiOptimization: true,
          routingRules: [
            { condition: 'priority = urgent', action: 'assign_to_best_agent', weight: 1.0 },
            { condition: 'sentiment = negative', action: 'escalate_immediately', weight: 0.8 }
          ]
        },
        {
          id: 'queue-2',
          name: 'Technical Support',
          tickets: tickets.filter(t => t.category === 'technical'),
          priority: 2,
          avgWaitTime: 45,
          slaCompliance: 78,
          autoAssignEnabled: true,
          aiOptimization: true,
          routingRules: [
            { condition: 'has_technical_keywords', action: 'route_to_tech_team', weight: 0.9 },
            { condition: 'is_vip_customer', action: 'priority_routing', weight: 0.7 }
          ]
        },
        {
          id: 'queue-3',
          name: 'General Inquiries',
          tickets: tickets.filter(t => t.category === 'general'),
          priority: 3,
          avgWaitTime: 30,
          slaCompliance: 92,
          autoAssignEnabled: true,
          aiOptimization: false,
          routingRules: [
            { condition: 'is_returning_customer', action: 'assign_to_previous_agent', weight: 0.6 }
          ]
        }
      ];

      setQueues(mockQueues);
    } catch (error) {
      console.error('Error loading queues:', error);
    }
  };

  // Real-time updates
  let realTimeInterval: NodeJS.Timeout | null = null;

  const startRealTimeUpdates = () => {
    realTimeInterval = setInterval(() => {
      if (realTimeAnalysisEnabled) {
        performRealTimeAnalysis();
      }
    }, 30000); // Update every 30 seconds
  };

  const stopRealTimeUpdates = () => {
    if (realTimeInterval) {
      clearInterval(realTimeInterval);
      realTimeInterval = null;
    }
  };

  const performRealTimeAnalysis = async () => {
    try {
      setAnalyzing(true);
      // Simulate real-time analysis
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update analytics with fresh data
      await loadAnalytics();

      // Generate new insights if needed
      if (Math.random() > 0.7) { // 30% chance of new insight
        const newInsight = await generateNewInsight();
        if (newInsight) {
          setInsights(prev => [newInsight, ...prev]);
          toast.success('New AI insight detected!');
        }
      }
    } catch (error) {
      console.error('Error performing real-time analysis:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const generateNewInsight = async (): Promise<AIInsight | null> => {
    try {
      const insightTypes = ['pattern', 'opportunity', 'risk', 'trend'];
      const severities = ['info', 'warning', 'error', 'success'];

      const mockInsight: AIInsight = {
        id: `insight-${Date.now()}`,
        type: insightTypes[Math.floor(Math.random() * insightTypes.length)] as any,
        severity: severities[Math.floor(Math.random() * severities.length)] as any,
        title: 'Real-time Analysis Alert',
        description: 'New pattern detected in customer support tickets requiring attention.',
        recommendation: 'Review recent ticket patterns and adjust support strategies accordingly.',
        confidence: 0.75 + Math.random() * 0.2,
        timestamp: new Date().toISOString(),
        acknowledged: false
      };

      return mockInsight;
    } catch (error) {
      console.error('Error generating insight:', error);
      return null;
    }
  };

  // Filter and sort tickets
  const filteredTickets = useMemo(() => {
    let filtered = [...tickets];

    if (searchQuery) {
      filtered = filtered.filter(ticket =>
        ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.customerName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === filterStatus);
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter(ticket => ticket.category === filterCategory);
    }

    if (filterPriority !== 'all') {
      filtered = filtered.filter(ticket => ticket.priority === filterPriority);
    }

    // Sort tickets
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'created_at':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder];
        case 'customer_satisfaction':
          return (b.satisfaction || 0) - (a.satisfaction || 0);
        case 'response_time':
          return (a.firstResponseTime || 0) - (b.firstResponseTime || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [tickets, searchQuery, filterStatus, filterCategory, filterPriority, sortBy]);

  // Handle ticket actions
  const handleTicketAction = async (ticketId: string, action: string) => {
    try {
      switch (action) {
        case 'analyze':
          await analyzeTicket(ticketId);
          break;
        case 'categorize':
          await autoCategorizeTicket(ticketId);
          break;
        case 'route':
          await smartRouteTicket(ticketId);
          break;
        case 'escalate':
          await escalateTicket(ticketId);
          break;
        default:
          console.log('Unknown action:', action);
      }
    } catch (error) {
      console.error('Error handling ticket action:', error);
      toast.error('Failed to perform action');
    }
  };

  const analyzeTicket = async (ticketId: string) => {
    try {
      toast.loading('Analyzing ticket with AI...');
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 3000));
      toast.success('Ticket analysis complete!');
    } catch (error) {
      console.error('Error analyzing ticket:', error);
      toast.error('Failed to analyze ticket');
    }
  };

  const autoCategorizeTicket = async (ticketId: string) => {
    try {
      if (!autoCategorizationEnabled) {
        toast.error('Auto-categorization is disabled');
        return;
      }

      toast.loading('Auto-categorizing ticket...');
      // Simulate categorization
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Ticket categorized successfully!');
    } catch (error) {
      console.error('Error categorizing ticket:', error);
      toast.error('Failed to categorize ticket');
    }
  };

  const smartRouteTicket = async (ticketId: string) => {
    try {
      if (!smartRoutingEnabled) {
        toast.error('Smart routing is disabled');
        return;
      }

      toast.loading('Smart routing ticket...');
      // Simulate routing
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Ticket routed to optimal agent!');
    } catch (error) {
      console.error('Error routing ticket:', error);
      toast.error('Failed to route ticket');
    }
  };

  const escalateTicket = async (ticketId: string) => {
    try {
      toast.loading('Escalating ticket...');
      // Simulate escalation
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Ticket escalated successfully!');
    } catch (error) {
      console.error('Error escalating ticket:', error);
      toast.error('Failed to escalate ticket');
    }
  };

  const handleInsightAction = async (insightId: string, action: string) => {
    try {
      switch (action) {
        case 'acknowledge':
          setInsights(prev => prev.map(insight =>
            insight.id === insightId
              ? { ...insight, acknowledged: true, acknowledgedAt: new Date().toISOString() }
              : insight
          ));
          toast.success('Insight acknowledged');
          break;
        case 'investigate':
          // Navigate to detailed investigation view
          toast.info('Investigation feature coming soon');
          break;
        default:
          console.log('Unknown action:', action);
      }
    } catch (error) {
      console.error('Error handling insight action:', error);
      toast.error('Failed to perform action');
    }
  };

  const handleRecommendationApply = async (recommendationId: string) => {
    try {
      setRecommendations(prev => prev.map(rec =>
        rec.id === recommendationId
          ? { ...rec, applied: true, appliedAt: new Date().toISOString() }
          : rec
      ));
      toast.success('Recommendation applied successfully!');
    } catch (error) {
      console.error('Error applying recommendation:', error);
      toast.error('Failed to apply recommendation');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className={cn("space-y-6", className)}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Brain className="h-8 w-8 text-blue-500" />
              {t('ticketIntelligence.title', 'Ticket Intelligence System')}
            </h1>
            <p className="text-muted-foreground">
              {t('ticketIntelligence.description', 'AI-powered ticket analysis, routing, and insights')}
            </p>
            {realTimeAnalysisEnabled && (
              <Badge variant="secondary" className="mt-2">
                <Activity className="h-3 w-3 mr-1" />
                {t('ticketIntelligence.realTime', 'Real-time Analysis')}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {analyzing && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                {t('ticketIntelligence.analyzing', 'AI Analyzing...')}
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadData()}
              disabled={loading || analyzing}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", (loading || analyzing) && "animate-spin")} />
              {t('ticketIntelligence.refresh', 'Refresh')}
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              {t('ticketIntelligence.export', 'Export')}
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('ticketIntelligence.totalTickets', 'Total Tickets')}</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalTickets.toLocaleString()}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                  12% from last period
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('ticketIntelligence.automationRate', 'Automation Rate')}</CardTitle>
                <Bot className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.automationRate}%</div>
                <Progress value={analytics.automationRate} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('ticketIntelligence.customerSatisfaction', 'Customer Satisfaction')}</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.customerSatisfaction}%</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Award className="h-3 w-3 mr-1 text-yellow-500" />
                  Excellent rating
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('ticketIntelligence.avgResponseTime', 'Avg Response Time')}</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.averageResponseTime}s</div>
                <div className="text-xs text-muted-foreground">
                  35% faster than industry average
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              {t('ticketIntelligence.overview', 'Overview')}
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <LineChart className="h-4 w-4" />
              {t('ticketIntelligence.analytics', 'Analytics')}
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              {t('ticketIntelligence.insights', 'AI Insights')}
              {insights.filter(i => !i.acknowledged).length > 0 && (
                <Badge variant="destructive" className="h-2 w-2 p-0" />
              )}
            </TabsTrigger>
            <TabsTrigger value="automation" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              {t('ticketIntelligence.automation', 'Automation')}
            </TabsTrigger>
            <TabsTrigger value="queues" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t('ticketIntelligence.queues', 'Queues')}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Active Insights */}
            {insights.filter(i => !i.acknowledged).length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  {t('ticketIntelligence.activeInsights', 'Active AI Insights')}
                </h3>
                <div className="grid gap-4">
                  {insights.filter(i => !i.acknowledged).slice(0, 3).map((insight) => (
                    <Alert key={insight.id} className={cn(
                      "border-l-4",
                      insight.severity === 'error' ? "border-red-500 bg-red-50" :
                      insight.severity === 'warning' ? "border-orange-500 bg-orange-50" :
                      insight.severity === 'success' ? "border-green-500 bg-green-50" :
                      "border-blue-500 bg-blue-50"
                    )}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{insight.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              {Math.round(insight.confidence * 100)}% confidence
                            </Badge>
                          </div>
                          <AlertDescription>{insight.description}</AlertDescription>
                          {insight.recommendation && (
                            <div className="mt-2 p-3 bg-muted/50 rounded">
                              <div className="font-medium text-sm mb-1">{t('ticketIntelligence.recommendation', 'Recommendation')}:</div>
                              <p className="text-sm">{insight.recommendation}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleInsightAction(insight.id, 'investigate')}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleInsightAction(insight.id, 'acknowledge')}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Alert>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Tickets */}
            <Card>
              <CardHeader>
                <CardTitle>{t('ticketIntelligence.recentTickets', 'Recent Tickets')}</CardTitle>
                <CardDescription>
                  {t('ticketIntelligence.recentTicketsDesc', 'Latest support tickets with AI analysis')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t('ticketIntelligence.searchTickets', 'Search tickets...')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('ticketIntelligence.allStatuses', 'All Statuses')}</SelectItem>
                      <SelectItem value="open">{t('ticketIntelligence.open', 'Open')}</SelectItem>
                      <SelectItem value="in_progress">{t('ticketIntelligence.inProgress', 'In Progress')}</SelectItem>
                      <SelectItem value="resolved">{t('ticketIntelligence.resolved', 'Resolved')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('ticketIntelligence.allCategories', 'All Categories')}</SelectItem>
                      <SelectItem value="technical">{t('ticketIntelligence.technical', 'Technical')}</SelectItem>
                      <SelectItem value="billing">{t('ticketIntelligence.billing', 'Billing')}</SelectItem>
                      <SelectItem value="general">{t('ticketIntelligence.general', 'General')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created_at">{t('ticketIntelligence.newest', 'Newest First')}</SelectItem>
                      <SelectItem value="priority">{t('ticketIntelligence.priority', 'Priority')}</SelectItem>
                      <SelectItem value="response_time">{t('ticketIntelligence.responseTime', 'Response Time')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Tickets List */}
                <div className="space-y-4">
                  {filteredTickets.slice(0, 5).map((ticket) => (
                    <div key={ticket.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{ticket.subject}</h4>
                            <Badge variant={
                              ticket.priority === 'urgent' ? 'destructive' :
                              ticket.priority === 'high' ? 'default' :
                              ticket.priority === 'medium' ? 'secondary' : 'outline'
                            }>
                              {ticket.priority}
                            </Badge>
                            <Badge variant="outline">{ticket.category}</Badge>
                            {ticket.aiProcessed && (
                              <Badge variant="secondary" className="text-xs">
                                <Brain className="h-3 w-3 mr-1" />
                                AI
                              </Badge>
                            )}
                            {ticket.isVIP && (
                              <Badge variant="outline" className="text-xs">
                                <Award className="h-3 w-3 mr-1" />
                                VIP
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {ticket.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{ticket.customerName}</span>
                            <span>{ticket.channel}</span>
                            <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                            {ticket.firstResponseTime && (
                              <span>{t('ticketIntelligence.responseTime', 'Response')}: {ticket.firstResponseTime}s</span>
                            )}
                            {ticket.sentiment && (
                              <span className={cn(
                                "capitalize",
                                ticket.sentiment === 'positive' ? "text-green-600" :
                                ticket.sentiment === 'negative' ? "text-red-600" : "text-gray-600"
                              )}>
                                {ticket.sentiment}
                              </span>
                            )}
                          </div>
                          {ticket.aiRecommendedActions && ticket.aiRecommendedActions.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {ticket.aiRecommendedActions.slice(0, 3).map((action, index) => (
                                <Button
                                  key={index}
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleTicketAction(ticket.id, action)}
                                  className="text-xs"
                                >
                                  <Sparkles className="h-3 w-3 mr-1" />
                                  {action}
                                </Button>
                              ))}
                            </div>
                          )}
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
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {analytics && (
              <>
                {/* Category Distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('ticketIntelligence.categoryDistribution', 'Category Distribution')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {analytics.categoryDistribution.map((category, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-medium capitalize">{category.category}</span>
                              <Badge variant="outline" className="text-xs">
                                {category.count}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-muted rounded-full h-2">
                                <div
                                  className="bg-primary h-2 rounded-full"
                                  style={{ width: `${category.percentage}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground w-12">
                                {category.percentage}%
                              </span>
                              {category.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                              {category.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Sentiment Distribution */}
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('ticketIntelligence.sentimentDistribution', 'Sentiment Distribution')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.entries(analytics.sentimentDistribution).map(([sentiment, count]) => (
                          <div key={sentiment} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-medium capitalize">{sentiment.replace('_', ' ')}</span>
                              <Badge variant="outline" className="text-xs">
                                {count}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-muted rounded-full h-2">
                                <div
                                  className={cn(
                                    "h-2 rounded-full",
                                    sentiment === 'positive' ? "bg-green-500" :
                                    sentiment === 'negative' ? "bg-red-500" :
                                    sentiment === 'very_negative' ? "bg-red-600" :
                                    "bg-gray-500"
                                  )}
                                  style={{ width: `${(count / analytics.totalTickets) * 100}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground w-12">
                                {Math.round((count / analytics.totalTickets) * 100)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Channel Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t('ticketIntelligence.channelPerformance', 'Channel Performance')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.channelPerformance.map((channel, index) => (
                        <div key={index} className="grid grid-cols-5 gap-4 items-center">
                          <div className="font-medium capitalize">{channel.channel}</div>
                          <div className="text-center">
                            <div className="font-semibold">{channel.tickets}</div>
                            <div className="text-xs text-muted-foreground">tickets</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold">{channel.satisfaction}%</div>
                            <div className="text-xs text-muted-foreground">satisfaction</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold">{channel.responseTime}s</div>
                            <div className="text-xs text-muted-foreground">response time</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold">{channel.automationRate}%</div>
                            <div className="text-xs text-muted-foreground">automation</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Predictions */}
                {enablePredictiveInsights && analytics.predictions && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5 text-blue-500" />
                        {t('ticketIntelligence.predictions', 'AI Predictions')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium mb-3">{t('ticketIntelligence.predictedIssues', 'Predicted Issues')}</h4>
                          <div className="space-y-3">
                            {analytics.predictions.predictedIssues.map((issue, index) => (
                              <Alert key={index} className={cn(
                                "border-l-4",
                                issue.impact === 'high' ? "border-red-500 bg-red-50" :
                                issue.impact === 'medium' ? "border-orange-500 bg-orange-50" :
                                "border-blue-500 bg-blue-50"
                              )}>
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold">{issue.type}</h4>
                                  <Badge variant="outline" className="text-xs">
                                    {Math.round(issue.probability * 100)}% probability
                                  </Badge>
                                </div>
                                <AlertDescription>{issue.recommendation}</AlertDescription>
                              </Alert>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-3">{t('ticketIntelligence.resourceNeeds', 'Resource Needs')}</h4>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span>{t('ticketIntelligence.requiredAgents', 'Required Agents')}:</span>
                              <span className="font-semibold">{analytics.predictions.resourceNeeds.agents}</span>
                            </div>
                            <div>
                              <span className="font-medium">{t('ticketIntelligence.peakHours', 'Peak Hours')}:</span>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {analytics.predictions.resourceNeeds.peakHours.map((hour, index) => (
                                  <Badge key={index} variant="outline">{hour}</Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{t('ticketIntelligence.allInsights', 'All AI Insights')}</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    {t('ticketIntelligence.filter', 'Filter')}
                  </Button>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {t('ticketIntelligence.refresh', 'Refresh')}
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {insights.map((insight) => (
                  <Alert key={insight.id} className={cn(
                    "border-l-4",
                    insight.severity === 'error' ? "border-red-500 bg-red-50" :
                    insight.severity === 'warning' ? "border-orange-500 bg-orange-50" :
                    insight.severity === 'success' ? "border-green-500 bg-green-50" :
                    "border-blue-500 bg-blue-50",
                    insight.acknowledged && "opacity-60"
                  )}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {insight.type === 'pattern' && <Target className="h-4 w-4 text-blue-600" />}
                          {insight.type === 'opportunity' && <TrendingUp className="h-4 w-4 text-green-600" />}
                          {insight.type === 'risk' && <AlertTriangle className="h-4 w-4 text-orange-600" />}
                          {insight.type === 'trend' && <Activity className="h-4 w-4 text-purple-600" />}
                          <h4 className="font-semibold">{insight.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {Math.round(insight.confidence * 100)}% confidence
                          </Badge>
                          {insight.acknowledged && (
                            <Badge variant="secondary" className="text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Acknowledged
                            </Badge>
                          )}
                        </div>
                        <AlertDescription>{insight.description}</AlertDescription>
                        {insight.recommendation && (
                          <div className="mt-2 p-3 bg-muted/50 rounded">
                            <div className="font-medium text-sm mb-1">{t('ticketIntelligence.recommendation', 'Recommendation')}:</div>
                            <p className="text-sm">{insight.recommendation}</p>
                          </div>
                        )}
                        {insight.impact && (
                          <div className="mt-2 grid grid-cols-4 gap-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">Efficiency:</span>
                              <span className={cn(
                                "ml-1 font-medium",
                                insight.impact.efficiency > 0 ? "text-green-600" : "text-red-600"
                              )}>
                                {insight.impact.efficiency > 0 ? '+' : ''}{insight.impact.efficiency}%
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Satisfaction:</span>
                              <span className={cn(
                                "ml-1 font-medium",
                                insight.impact.satisfaction > 0 ? "text-green-600" : "text-red-600"
                              )}>
                                {insight.impact.satisfaction > 0 ? '+' : ''}{insight.impact.satisfaction}%
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Cost:</span>
                              <span className={cn(
                                "ml-1 font-medium",
                                insight.impact.cost > 0 ? "text-red-600" : "text-green-600"
                              )}>
                                {insight.impact.cost > 0 ? '+' : ''}PLN {Math.abs(insight.impact.cost).toLocaleString()}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Revenue:</span>
                              <span className={cn(
                                "ml-1 font-medium",
                                insight.impact.revenue > 0 ? "text-green-600" : "text-red-600"
                              )}>
                                {insight.impact.revenue > 0 ? '+' : ''}PLN {Math.abs(insight.impact.revenue).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-2">
                          {new Date(insight.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleInsightAction(insight.id, 'investigate')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {!insight.acknowledged && (
                          <Button
                            size="sm"
                            onClick={() => handleInsightAction(insight.id, 'acknowledge')}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </Alert>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Automation Tab */}
          <TabsContent value="automation" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* AI Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-blue-500" />
                    {t('ticketIntelligence.aiRecommendations', 'AI Recommendations')}
                  </CardTitle>
                  <CardDescription>
                    {t('ticketIntelligence.aiRecommendationsDesc', 'Actionable AI suggestions for ticket handling')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recommendations.map((rec) => (
                      <div key={rec.id} className={cn(
                        "border rounded-lg p-4",
                        rec.applied ? "opacity-60 bg-green-50" : "bg-white"
                      )}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{rec.title}</h4>
                              <Badge variant="outline" className="text-xs">
                                {Math.round(rec.confidence * 100)}% confidence
                              </Badge>
                              <Badge variant={rec.priority === 'urgent' ? 'destructive' : rec.priority === 'high' ? 'default' : 'secondary'} className="text-xs">
                                {rec.priority}
                              </Badge>
                              {rec.applied && (
                                <Badge variant="secondary" className="text-xs">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Applied
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">{rec.description}</p>
                            {rec.suggestedText && (
                              <div className="bg-blue-50 p-3 rounded-md mb-3">
                                <p className="text-sm italic">"{rec.suggestedText}"</p>
                              </div>
                            )}
                            {rec.suggestedActions && rec.suggestedActions.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-3">
                                {rec.suggestedActions.map((action, index) => (
                                  <Button
                                    key={index}
                                    size="sm"
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {action.label}
                                  </Button>
                                ))}
                              </div>
                            )}
                            {rec.estimatedImpact && (
                              <div className="grid grid-cols-3 gap-2 text-xs">
                                <div>
                                  <span className="text-muted-foreground">Time Saved:</span>
                                  <span className="ml-1 font-medium">{rec.estimatedImpact.timeSaved}min</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Satisfaction:</span>
                                  <span className="ml-1 font-medium">+{rec.estimatedImpact.satisfactionIncrease}%</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Cost:</span>
                                  <span className="ml-1 font-medium text-green-600">-PLN {rec.estimatedImpact.costReduction}</span>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1">
                            {!rec.applied && (
                              <Button
                                size="sm"
                                onClick={() => handleRecommendationApply(rec.id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                {t('ticketIntelligence.apply', 'Apply')}
                              </Button>
                            )}
                            <Button size="sm" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Automation Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-blue-500" />
                    {t('ticketIntelligence.automationSettings', 'Automation Settings')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{t('ticketIntelligence.realTimeAnalysis', 'Real-time Analysis')}</div>
                        <p className="text-sm text-muted-foreground">
                          {t('ticketIntelligence.realTimeAnalysisDesc', 'Enable AI-powered real-time ticket analysis')}
                        </p>
                      </div>
                      <Switch
                        checked={realTimeAnalysisEnabled}
                        onCheckedChange={setRealTimeAnalysisEnabled}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{t('ticketIntelligence.predictiveInsights', 'Predictive Insights')}</div>
                        <p className="text-sm text-muted-foreground">
                          {t('ticketIntelligence.predictiveInsightsDesc', 'Generate predictive analytics and forecasts')}
                        </p>
                      </div>
                      <Switch
                        checked={predictiveInsightsEnabled}
                        onCheckedChange={setPredictiveInsightsEnabled}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{t('ticketIntelligence.autoCategorization', 'Auto-categorization')}</div>
                        <p className="text-sm text-muted-foreground">
                          {t('ticketIntelligence.autoCategorizationDesc', 'Automatically categorize tickets using AI')}
                        </p>
                      </div>
                      <Switch
                        checked={autoCategorizationEnabled}
                        onCheckedChange={setAutoCategorizationEnabled}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{t('ticketIntelligence.sentimentAnalysis', 'Sentiment Analysis')}</div>
                        <p className="text-sm text-muted-foreground">
                          {t('ticketIntelligence.sentimentAnalysisDesc', 'Analyze customer sentiment in real-time')}
                        </p>
                      </div>
                      <Switch
                        checked={sentimentAnalysisEnabled}
                        onCheckedChange={setSentimentAnalysisEnabled}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{t('ticketIntelligence.smartRouting', 'Smart Routing')}</div>
                        <p className="text-sm text-muted-foreground">
                          {t('ticketIntelligence.smartRoutingDesc', 'Intelligently route tickets to optimal agents')}
                        </p>
                      </div>
                      <Switch
                        checked={smartRoutingEnabled}
                        onCheckedChange={setSmartRoutingEnabled}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Queues Tab */}
          <TabsContent value="queues" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {queues.map((queue) => (
                <Card key={queue.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{queue.name}</CardTitle>
                      <Badge variant="outline" className="text-xs">
                        Priority: {queue.priority}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Tickets:</span>
                          <div className="font-semibold">{queue.tickets.length}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Avg Wait:</span>
                          <div className="font-semibold">{queue.avgWaitTime}m</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">SLA:</span>
                          <div className="font-semibold">{queue.slaCompliance}%</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">AI Opt:</span>
                          <Switch checked={queue.aiOptimization} disabled size="sm" />
                        </div>
                      </div>

                      {queue.routingRules.length > 0 && (
                        <div>
                          <h5 className="font-medium text-sm mb-2">{t('ticketIntelligence.routingRules', 'Routing Rules')}</h5>
                          <div className="space-y-1">
                            {queue.routingRules.slice(0, 2).map((rule, index) => (
                              <div key={index} className="text-xs bg-muted/50 p-2 rounded">
                                <span className="font-medium">{rule.condition}</span> → {rule.action}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Settings className="h-3 w-3 mr-1" />
                          {t('ticketIntelligence.configure', 'Configure')}
                        </Button>
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}