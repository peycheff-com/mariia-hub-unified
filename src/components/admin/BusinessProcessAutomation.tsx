import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Zap,
  Settings,
  Play,
  Pause,
  RotateCcw,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Users,
  Activity,
  BarChart3,
  Brain,
  Bot,
  Target,
  Lightbulb,
  FileText,
  MessageSquare,
  Calendar,
  CreditCard,
  Mail,
  Phone,
  Bell,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  RefreshCw,
  Cpu,
  Database,
  Shield,
  Globe,
  Smartphone,
  Filter,
  Search,
  X,
  Save,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Sparkles,
  Workflow,
  Timer,
  Layers,
  GitBranch,
  GitMerge,
  Code,
  Link2,
  Package,
  Briefcase,
  Heart,
  Star,
  Award,
  TrendingUp as TrendingUpIcon,
  ChevronDown,
  MoreHorizontal,
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

// Enhanced Automation Interfaces
interface AutomationWorkflow {
  id: string;
  name: string;
  description: string;
  category: 'customer_service' | 'booking' | 'marketing' | 'administrative' | 'analytics' | 'operations';
  status: 'active' | 'paused' | 'draft' | 'error';
  trigger: {
    type: 'manual' | 'scheduled' | 'event_based' | 'api_webhook';
    conditions: TriggerCondition[];
  };
  actions: WorkflowAction[];
  schedule?: {
    frequency: string;
    nextRun: string;
    timezone: string;
  };
  performance: {
    successRate: number;
    averageExecutionTime: number;
    totalExecutions: number;
    errorRate: number;
    costSavings: number;
    timeSavings: number;
  };
  integrations: string[];
  aiEnhanced: boolean;
  complexity: 'simple' | 'medium' | 'complex';
  tags: string[];
}

interface TriggerCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains' | 'in' | 'not_in';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

interface WorkflowAction {
  id: string;
  type: 'send_email' | 'send_sms' | 'create_booking' | 'update_customer' | 'generate_report' | 'call_api' | 'schedule_task' | 'send_notification' | 'ai_analysis' | 'data_processing';
  parameters: Record<string, any>;
  delay?: number; // seconds
  order: number;
  errorHandling?: 'retry' | 'skip' | 'stop_workflow';
}

interface AutomationInsight {
  workflowId: string;
  type: 'performance' | 'optimization' | 'anomaly' | 'trend';
  severity: 'info' | 'warning' | 'error' | 'success';
  title: string;
  description: string;
  recommendation?: string;
  impact?: {
    efficiency: number;
    cost: number;
    time: number;
  };
  timestamp: string;
}

interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  prerequisites: string[];
  workflow: Omit<AutomationWorkflow, 'id' | 'status' | 'performance'>;
  useCase: string;
  benefits: string[];
}

interface ProcessMetrics {
  totalWorkflows: number;
  activeWorkflows: number;
  averageSuccessRate: number;
  totalExecutions: number;
  errorRate: number;
  costSavings: number;
  timeSavings: number;
  automationsByCategory: Record<string, number>;
  topPerformingWorkflows: {
    workflowId: string;
    name: string;
    successRate: number;
    executions: number;
  }[];
  recentExecutions: {
    workflowId: string;
    workflowName: string;
    status: 'success' | 'error';
    executionTime: number;
    timestamp: string;
  }[];
}

const BusinessProcessAutomation: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'workflows' | 'insights' | 'templates' | 'metrics' | 'editor'>('workflows');
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>([]);
  const [insights, setInsights] = useState<AutomationInsight[]>([]);
  const [templates, setTemplates] = useState<AutomationTemplate[]>([]);
  const [metrics, setMetrics] = useState<ProcessMetrics | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [editingWorkflow, setEditingWorkflow] = useState<AutomationWorkflow | null>(null);

  // Editor state
  const [newWorkflow, setNewWorkflow] = useState<Partial<AutomationWorkflow>>({
    name: '',
    description: '',
    category: 'customer_service',
    status: 'draft',
    aiEnhanced: true,
    complexity: 'simple',
    tags: [],
    trigger: {
      type: 'manual',
      conditions: []
    },
    actions: []
  });

  // Automation stats
  const automationEfficiency = useMemo(() => {
    if (!metrics) return 0;
    return Math.round((metrics.averageSuccessRate + (100 - metrics.errorRate)) / 2);
  }, [metrics]);

  const totalSavings = useMemo(() => {
    if (!metrics) return { cost: 0, time: 0 };
    return {
      cost: metrics.costSavings,
      time: metrics.timeSavings
    };
  }, [metrics]);

  // Load data
  useEffect(() => {
    loadWorkflows();
    loadInsights();
    loadTemplates();
    loadMetrics();

    // Set up real-time updates
    const interval = setInterval(() => {
      loadMetrics();
      loadRecentExecutions();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const loadWorkflows = useCallback(async () => {
    try {
      // Simulate loading workflows from database
      const mockWorkflows: AutomationWorkflow[] = [
        {
          id: 'workflow-1',
          name: 'Customer Welcome Series',
          description: 'Automated onboarding for new clients with personalized welcome emails and appointment suggestions',
          category: 'customer_service',
          status: 'active',
          trigger: {
            type: 'event_based',
            conditions: [
              { field: 'customer.created_at', operator: 'greater_than', value: 'now' }
            ]
          },
          actions: [
            {
              id: 'action-1',
              type: 'send_email',
              parameters: {
                template: 'welcome',
                personalize: true
              },
              order: 1
            },
            {
              id: 'action-2',
              type: 'ai_analysis',
              parameters: {
                type: 'customer_segmentation',
                confidence_threshold: 0.8
              },
              order: 2
            }
          ],
          performance: {
            successRate: 96,
            averageExecutionTime: 45,
            totalExecutions: 1247,
            errorRate: 4,
            costSavings: 15000,
            timeSavings: 120
          },
          integrations: ['email', 'ai_engine', 'crm'],
          aiEnhanced: true,
          complexity: 'medium',
          tags: ['onboarding', 'email', 'ai', 'customer']
        },
        {
          id: 'workflow-2',
          name: 'No-Show Prediction & Prevention',
          description: 'AI-powered prediction of no-shows with automated reminders and rebooking suggestions',
          category: 'booking',
          status: 'active',
          trigger: {
            type: 'scheduled',
            conditions: []
          },
          schedule: {
            frequency: 'daily',
            nextRun: '2024-01-15T09:00:00Z',
            timezone: 'Europe/Warsaw'
          },
          actions: [
            {
              id: 'action-3',
              type: 'ai_analysis',
              parameters: {
                type: 'noshow_prediction',
                look_ahead_days: 7
              },
              order: 1
            },
            {
              id: 'action-4',
              type: 'send_notification',
              parameters: {
                channels: ['email', 'sms'],
                message_type: 'reminder',
                timing: 'optimal'
              },
              order: 2
            }
          ],
          performance: {
            successRate: 92,
            averageExecutionTime: 120,
            totalExecutions: 892,
            errorRate: 8,
            costSavings: 25000,
            timeSavings: 180
          },
          integrations: ['ai_engine', 'notifications', 'booking_system'],
          aiEnhanced: true,
          complexity: 'complex',
          tags: ['ai', 'noshow', 'prediction', 'automation']
        },
        {
          id: 'workflow-3',
          name: 'Review Generation & Posting',
          description: 'Automated customer review requests with AI-powered personalized follow-ups',
          category: 'marketing',
          status: 'active',
          trigger: {
            type: 'event_based',
            conditions: [
              { field: 'booking.status', operator: 'equals', value: 'completed' },
              { field: 'booking.completion_date', operator: 'greater_than', value: '24h_ago' }
            ]
          },
          actions: [
            {
              id: 'action-5',
              type: 'send_notification',
              parameters: {
                channels: ['email', 'whatsapp'],
                message_type: 'review_request',
                personalization: true
              },
              delay: 3600, // 1 hour after completion
              order: 1
            },
            {
              id: 'action-6',
              type: 'ai_analysis',
              parameters: {
                type: 'sentiment_analysis',
                follow_up_strategy: 'personalized'
              },
              delay: 7200, // 2 hours after initial request
              order: 2
            }
          ],
          performance: {
            successRate: 89,
            averageExecutionTime: 30,
            totalExecutions: 456,
            errorRate: 11,
            costSavings: 8000,
            timeSavings: 60
          },
          integrations: ['review_platforms', 'ai_engine', 'communications'],
          aiEnhanced: true,
          complexity: 'medium',
          tags: ['reviews', 'marketing', 'ai', 'customer_feedback']
        }
      ];

      setWorkflows(mockWorkflows);
    } catch (error) {
      console.error('Error loading workflows:', error);
    }
  }, []);

  const loadInsights = useCallback(async () => {
    try {
      const mockInsights: AutomationInsight[] = [
        {
          workflowId: 'workflow-1',
          type: 'performance',
          severity: 'success',
          title: 'High Performing Workflow',
          description: 'Customer Welcome Series has 96% success rate, exceeding industry average by 18%',
          recommendation: 'Consider expanding this workflow to include SMS follow-ups',
          impact: {
            efficiency: 15,
            cost: 5000,
            time: 30
          },
          timestamp: new Date().toISOString()
        },
        {
          workflowId: 'workflow-2',
          type: 'optimization',
          severity: 'warning',
          title: 'AI Optimization Opportunity',
          description: 'No-Show Prediction could benefit from additional weather data integration',
          recommendation: 'Add weather API to improve prediction accuracy by 12%',
          impact: {
            efficiency: 12,
            cost: 8000,
            time: 45
          },
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          workflowId: 'workflow-3',
          type: 'anomaly',
          severity: 'error',
          title: 'Execution Spike Detected',
          description: 'Review Generation workflow executed 50% more times than usual in the last 24 hours',
          recommendation: 'Review for potential spam or system errors',
          impact: {
            efficiency: -25,
            cost: -3000,
            time: -20
          },
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
        }
      ];

      setInsights(mockInsights);
    } catch (error) {
      console.error('Error loading insights:', error);
    }
  }, []);

  const loadTemplates = useCallback(async () => {
    try {
      const mockTemplates: AutomationTemplate[] = [
        {
          id: 'template-1',
          name: 'Customer Birthday Automation',
          description: 'Automatically send birthday wishes and special offers to customers',
          category: 'customer_service',
          difficulty: 'beginner',
          estimatedTime: '15 minutes',
          prerequisites: ['Email service setup', 'Customer birth dates'],
          workflow: {
            name: 'Customer Birthday Automation',
            description: 'Send personalized birthday messages and special offers',
            category: 'customer_service',
            aiEnhanced: true,
            complexity: 'simple',
            tags: ['birthday', 'customer', 'marketing'],
            trigger: {
              type: 'scheduled',
              conditions: []
            },
            actions: [
              {
                id: 'action-1',
                type: 'send_email',
                parameters: {
                  template: 'birthday',
                  discount_code: 'BIRTHDAY15'
                },
                order: 1
              }
            ],
            integrations: ['email', 'crm']
          },
          useCase: 'Increase customer retention through personalized birthday communications',
          benefits: [
            '20% increase in birthday month bookings',
            'Improved customer satisfaction',
            'Automated personalization at scale'
          ]
        },
        {
          id: 'template-2',
          name: 'Inventory Alert System',
          description: 'Monitor inventory levels and automatically reorder when running low',
          category: 'operations',
          difficulty: 'intermediate',
          estimatedTime: '30 minutes',
          prerequisites: ['Inventory tracking', 'Supplier API'],
          workflow: {
            name: 'Inventory Alert System',
            description: 'Automated inventory monitoring and reordering',
            category: 'operations',
            aiEnhanced: true,
            complexity: 'medium',
            tags: ['inventory', 'operations', 'automation'],
            trigger: {
              type: 'event_based',
              conditions: [
                { field: 'inventory.level', operator: 'less_than', value: 'reorder_point' }
              ]
            },
            actions: [
              {
                id: 'action-1',
                type: 'send_notification',
                parameters: {
                  recipients: ['manager', 'procurement'],
                  message: 'Low inventory alert',
                  urgency: 'medium'
                },
                order: 1
              },
              {
                id: 'action-2',
                type: 'call_api',
                parameters: {
                  endpoint: 'supplier_api',
                  method: 'POST',
                  data: 'reorder_data'
                },
                order: 2
              }
            ],
            integrations: ['inventory_system', 'supplier_api', 'notifications']
          },
          useCase: 'Prevent stockouts and optimize inventory management',
          benefits: [
            'Zero stockouts in 6 months',
            '20% reduction in holding costs',
            'Automated procurement process'
          ]
        }
      ];

      setTemplates(mockTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  }, []);

  const loadMetrics = useCallback(async () => {
    try {
      const mockMetrics: ProcessMetrics = {
        totalWorkflows: 15,
        activeWorkflows: 12,
        averageSuccessRate: 91.5,
        totalExecutions: 12547,
        errorRate: 8.5,
        costSavings: 98000,
        timeSavings: 420,
        automationsByCategory: {
          customer_service: 6,
          booking: 4,
          marketing: 3,
          administrative: 2
        },
        topPerformingWorkflows: [
          {
            workflowId: 'workflow-1',
            name: 'Customer Welcome Series',
            successRate: 96,
            executions: 1247
          },
          {
            workflowId: 'workflow-2',
            name: 'No-Show Prediction',
            successRate: 92,
            executions: 892
          }
        ],
        recentExecutions: [
          {
            workflowId: 'workflow-1',
            workflowName: 'Customer Welcome Series',
            status: 'success',
            executionTime: 42,
            timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString()
          },
          {
            workflowId: 'workflow-2',
            workflowName: 'No-Show Prediction',
            status: 'success',
            executionTime: 118,
            timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString()
          },
          {
            workflowId: 'workflow-3',
            workflowName: 'Review Generation',
            status: 'error',
            executionTime: 35,
            timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString()
          }
        ]
      };

      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  }, []);

  const loadRecentExecutions = useCallback(async () => {
    // Load recent executions for real-time monitoring
  }, []);

  // Workflow management functions
  const saveWorkflow = async () => {
    try {
      if (editingWorkflow) {
        // Update existing workflow
        const updatedWorkflows = workflows.map(w =>
          w.id === editingWorkflow.id ? { ...editingWorkflow, ...newWorkflow } : w
        );
        setWorkflows(updatedWorkflows);
      } else {
        // Create new workflow
        const workflow: AutomationWorkflow = {
          id: `workflow-${Date.now()}`,
          ...newWorkflow as AutomationWorkflow,
          status: 'draft',
          performance: {
            successRate: 0,
            averageExecutionTime: 0,
            totalExecutions: 0,
            errorRate: 0,
            costSavings: 0,
            timeSavings: 0
          },
          integrations: [],
          complexity: newWorkflow.complexity || 'simple',
          tags: newWorkflow.tags || []
        };
        setWorkflows([...workflows, workflow]);
      }

      setEditingWorkflow(null);
      setNewWorkflow({
        name: '',
        description: '',
        category: 'customer_service',
        status: 'draft',
        aiEnhanced: true,
        complexity: 'simple',
        tags: [],
        trigger: {
          type: 'manual',
          conditions: []
        },
        actions: []
      });
    } catch (error) {
      console.error('Error saving workflow:', error);
    }
  };

  const deployWorkflow = async (workflowId: string) => {
    try {
      // Deploy workflow
      const updatedWorkflows = workflows.map(w =>
        w.id === workflowId ? { ...w, status: 'active' as const } : w
      );
      setWorkflows(updatedWorkflows);
    } catch (error) {
      console.error('Error deploying workflow:', error);
    }
  };

  const pauseWorkflow = async (workflowId: string) => {
    try {
      const updatedWorkflows = workflows.map(w =>
        w.id === workflowId ? { ...w, status: 'paused' as const } : w
      );
      setWorkflows(updatedWorkflows);
    } catch (error) {
      console.error('Error pausing workflow:', error);
    }
  };

  const deleteWorkflow = async (workflowId: string) => {
    try {
      const updatedWorkflows = workflows.filter(w => w.id !== workflowId);
      setWorkflows(updatedWorkflows);
    } catch (error) {
      console.error('Error deleting workflow:', error);
    }
  };

  // Filter and sort workflows
  const filteredWorkflows = useMemo(() => {
    let filtered = workflows;

    if (searchQuery) {
      filtered = filtered.filter(w =>
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter(w => w.category === filterCategory);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(w => w.status === filterStatus);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'success_rate':
          return b.performance.successRate - a.performance.successRate;
        case 'executions':
          return b.performance.totalExecutions - a.performance.totalExecutions;
        case 'created_date':
          return 0; // Would need created_date field
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return filtered;
  }, [workflows, searchQuery, filterCategory, filterStatus, sortBy]);

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
          <h2 className="text-2xl font-bold">Business Process Automation</h2>
          <p className="text-muted-foreground">AI-powered workflows with intelligent automation and optimization</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground">Efficiency:</div>
            <div className="text-xl font-bold text-green-600">{automationEfficiency}%</div>
          </div>
          <Button onClick={() => setActiveTab('editor')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Workflow
          </Button>
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

      {/* Cost Savings Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600 mr-4" />
              <div>
                <div className="text-2xl font-bold">PLN {totalSavings.cost.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Monthly Cost Savings</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-blue-600 mr-4" />
              <div>
                <div className="text-2xl font-bold">{totalSavings.time}h</div>
                <div className="text-sm text-muted-foreground">Time Saved Weekly</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="workflows" className="flex items-center gap-2">
            <Workflow className="h-4 w-4" />
            Workflows
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Insights
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="metrics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Metrics
          </TabsTrigger>
          <TabsTrigger value="editor" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create
          </TabsTrigger>
        </TabsList>

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="space-y-6">
          {/* Filters and Search */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search workflows..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="customer_service">Customer Service</SelectItem>
                    <SelectItem value="booking">Booking</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="administrative">Administrative</SelectItem>
                    <SelectItem value="analytics">Analytics</SelectItem>
                    <SelectItem value="operations">Operations</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Sort by Name</SelectItem>
                    <SelectItem value="success_rate">Sort by Success Rate</SelectItem>
                    <SelectItem value="executions">Sort by Executions</SelectItem>
                    <SelectItem value="created_date">Sort by Created Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Workflows Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredWorkflows.map((workflow) => (
              <Card key={workflow.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{workflow.name}</h3>
                        {workflow.aiEnhanced && (
                          <Badge variant="secondary" className="text-xs">
                            <Brain className="h-3 w-3 mr-1" />
                            AI-Enhanced
                          </Badge>
                        )}
                        <Badge variant={
                          workflow.status === 'active' ? 'default' :
                          workflow.status === 'paused' ? 'secondary' :
                          workflow.status === 'error' ? 'destructive' : 'outline'
                        }>
                          {workflow.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{workflow.description}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingWorkflow(workflow)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteWorkflow(workflow.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Workflow Performance */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Success Rate:</span>
                          <span className="font-medium">{workflow.performance.successRate}%</span>
                        </div>
                        <Progress value={workflow.performance.successRate} className="mt-1" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Executions:</span>
                          <span className="font-medium">{workflow.performance.totalExecutions}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Avg: {workflow.performance.averageExecutionTime}s
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {workflow.status === 'active' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => pauseWorkflow(workflow.id)}
                        >
                          <Pause className="h-3 w-3 mr-1" />
                          Pause
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => deployWorkflow(workflow.id)}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Deploy
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3 mr-1" />
                        View Details
                      </Button>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {workflow.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <Alert key={index} className={cn(
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
                      {insight.type === 'optimization' && <Lightbulb className="h-4 w-4 text-blue-600" />}
                      {insight.type === 'anomaly' && <AlertTriangle className="h-4 w-4 text-orange-600" />}
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
                              <span className="ml-1">+{insight.impact.efficiency}%</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Cost:</span>
                              <span className="ml-1">PLN {insight.impact.cost.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Time:</span>
                              <span className="ml-1">{insight.impact.time}h</span>
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

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-1">
                    <Package className="h-4 w-4" />
                    <h3 className="font-semibold">{template.name}</h3>
                    <Badge variant={
                      template.difficulty === 'beginner' ? 'default' :
                      template.difficulty === 'intermediate' ? 'secondary' : 'destructive'
                    }>
                      {template.difficulty}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{template.estimatedTime}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Layers className="h-3 w-3" />
                        <span>{template.category}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium">Use Case:</div>
                      <p className="text-sm text-muted-foreground">{template.useCase}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium">Benefits:</div>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {template.benefits.map((benefit, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Button
                      className="w-full"
                      onClick={() => {
                        setNewWorkflow(template.workflow);
                        setActiveTab('editor');
                      }}
                    >
                      <Plus className="h-3 w-3 mr-2" />
                      Use Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-6">
          {metrics && (
            <div className="space-y-6">
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
                    <Workflow className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.totalWorkflows}</div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Activity className="h-3 w-3 mr-1" />
                      {metrics.activeWorkflows} active
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Success Rate</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.averageSuccessRate}%</div>
                    <Progress value={metrics.averageSuccessRate} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
                    <Cpu className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.totalExecutions.toLocaleString()}</div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {metrics.errorRate}% error rate
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">PLN {metrics.costSavings.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">
                      {metrics.timeSavings} hours saved
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Category Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Workflows by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(metrics.automationsByCategory).map(([category, count]) => (
                        <div key={category} className="flex items-center justify-between">
                          <span className="text-sm capitalize">{category.replace('_', ' ')}</span>
                          <div className="flex items-center gap-2">
                            <Progress value={(count / metrics.totalWorkflows) * 100} className="w-16" />
                            <span className="text-sm font-medium">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Executions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {metrics.recentExecutions.map((execution, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex-1">
                            <div className="text-sm font-medium">{execution.workflowName}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(execution.timestamp).toLocaleString()}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {execution.status === 'success' ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span className="text-xs">{execution.executionTime}s</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Editor Tab */}
        <TabsContent value="editor" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {editingWorkflow ? 'Edit Workflow' : 'Create New Workflow'}
              </CardTitle>
              <CardDescription>
                {editingWorkflow ? 'Modify existing automation workflow' : 'Design a new automation workflow with AI enhancements'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Workflow Name</Label>
                    <Input
                      value={newWorkflow.name || ''}
                      onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                      placeholder="Enter workflow name"
                    />
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={newWorkflow.description || ''}
                      onChange={(e) => setNewWorkflow({ ...newWorkflow, description: e.target.value })}
                      placeholder="Describe what this workflow does"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>Category</Label>
                    <Select
                      value={newWorkflow.category || 'customer_service'}
                      onValueChange={(value: any) => setNewWorkflow({ ...newWorkflow, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="customer_service">Customer Service</SelectItem>
                        <SelectItem value="booking">Booking</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="administrative">Administrative</SelectItem>
                        <SelectItem value="analytics">Analytics</SelectItem>
                        <SelectItem value="operations">Operations</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Complexity</Label>
                    <Select
                      value={newWorkflow.complexity || 'simple'}
                      onValueChange={(value: any) => setNewWorkflow({ ...newWorkflow, complexity: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="simple">Simple</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="complex">Complex</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="ai-enhanced"
                      checked={newWorkflow.aiEnhanced || false}
                      onCheckedChange={(checked) => setNewWorkflow({ ...newWorkflow, aiEnhanced: checked })}
                    />
                    <Label htmlFor="ai-enhanced">Enable AI Enhancements</Label>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="text-sm font-medium">Quick Actions</div>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        setNewWorkflow({
                          ...newWorkflow,
                          trigger: {
                            type: 'event_based',
                            conditions: [
                              { field: 'booking.created', operator: 'equals', value: true }
                            ]
                          },
                          actions: [
                            {
                              id: 'action-1',
                              type: 'send_notification',
                              parameters: { template: 'booking_confirmation' },
                              order: 1
                            }
                          ]
                        });
                      }}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Booking Confirmation Template
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        setNewWorkflow({
                          ...newWorkflow,
                          trigger: {
                            type: 'scheduled',
                            conditions: []
                          },
                          actions: [
                            {
                              id: 'action-1',
                              type: 'generate_report',
                              parameters: { type: 'daily_summary', recipients: ['manager'] },
                              order: 1
                            }
                          ]
                        });
                      }}
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Daily Report Template
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        setNewWorkflow({
                          ...newWorkflow,
                          trigger: {
                            type: 'api_webhook',
                            conditions: []
                          },
                          actions: [
                            {
                              id: 'action-1',
                              type: 'ai_analysis',
                              parameters: { type: 'sentiment_analysis' },
                              order: 1
                            }
                          ]
                        });
                      }}
                    >
                      <Brain className="h-4 w-4 mr-2" />
                      AI Analysis Template
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  onClick={saveWorkflow}
                  disabled={!newWorkflow.name || !newWorkflow.description}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Workflow
                </Button>
                <Button variant="outline" onClick={() => setActiveTab('workflows')}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BusinessProcessAutomation;