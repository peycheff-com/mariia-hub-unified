import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { pl, enUS } from 'date-fns/locale';

// UI Components
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Calendar,
  Clock,
  Star,
  Target,
  Zap,
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  Eye,
  Click,
  ShoppingCart,
  MessageCircle,
  Award,
  AlertCircle,
  CheckCircle,
  XCircle,
  Lightbulb,
  Info,
  RefreshCw,
  Download,
  Filter,
  ChevronUp,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Bot,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Timer,
  MapPin,
  Package,
  CreditCard,
  UserCheck,
  AlertTriangle,
  Bell,
} from 'lucide-react';
import {
  LineChart as RechartsLineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Button,
} from '@/components/ui/button';
import {
  Badge,
} from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Progress,
} from '@/components/ui/progress';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Separator,
} from '@/components/ui/separator';

// Icons

import { getEnhancedAIService } from '@/integrations/ai/core/AIService';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';


// Types
interface AIInsight {
  id: string;
  type: 'prediction' | 'recommendation' | 'anomaly' | 'opportunity' | 'warning';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  category: string;
  data?: any;
  createdAt: Date;
  status: 'active' | 'resolved' | 'dismissed';
}

interface AIMetrics {
  period: string;
  totalRequests: number;
  successRate: number;
  averageResponseTime: number;
  costUsage: number;
  tokensUsed: number;
  accuracy: number;
  userSatisfaction: number;
  providerBreakdown: Record<string, number>;
  topIntents: Array<{ intent: string; count: number; percentage: number }>;
  errorRate: number;
  cacheHitRate: number;
}

interface PredictionData {
  date: string;
  predicted: number;
  actual?: number;
  confidence: number;
}

interface ConversionFunnel {
  stage: string;
  users: number;
  conversionRate: number;
  dropOff: number;
}

interface UserBehavior {
  userId: string;
  sessions: number;
  interactions: number;
  bookingConversion: number;
  preferredServices: string[];
  lastActive: Date;
  satisfaction: number;
}

interface AIInsightsProps {
  className?: string;
  timeRange?: '7d' | '30d' | '90d';
  showDetailed?: boolean;
  onExport?: () => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function AIInsights({
  className,
  timeRange = '30d',
  showDetailed = true,
  onExport,
}: AIInsightsProps) {
  const { t, i18n } = useTranslation();
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [metrics, setMetrics] = useState<AIMetrics | null>(null);
  const [predictionData, setPredictionData] = useState<PredictionData[]>([]);
  const [conversionFunnel, setConversionFunnel] = useState<ConversionFunnel[]>([]);
  const [userBehavior, setUserBehavior] = useState<UserBehavior[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  const aiService = getEnhancedAIService();

  useEffect(() => {
    loadAIInsights();
  }, [selectedTimeRange]);

  const loadAIInsights = async () => {
    setIsLoading(true);
    try {
      // Load AI-generated insights
      await loadInsights();
      await loadMetrics();
      await loadPredictionData();
      await loadConversionFunnel();
      await loadUserBehavior();
    } catch (error) {
      console.error('Failed to load AI insights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadInsights = async () => {
    // Mock AI insights - in production, this would fetch from the database
    const mockInsights: AIInsight[] = [
      {
        id: '1',
        type: 'opportunity',
        title: 'High Demand for PMU Services',
        description: 'AI predicts 35% increase in PMU appointments over the next 2 weeks. Consider adding more slots.',
        confidence: 0.92,
        impact: 'high',
        category: 'demand',
        createdAt: new Date(),
        status: 'active',
        data: {
          predictedIncrease: 35,
          timeframe: '2 weeks',
          services: ['PMU Lips', 'PMU Brows'],
        },
      },
      {
        id: '2',
        type: 'recommendation',
        title: 'Optimize Pricing for Tuesday Afternoons',
        description: 'Low demand on Tuesday afternoons suggests opportunity for promotional pricing.',
        confidence: 0.87,
        impact: 'medium',
        category: 'pricing',
        createdAt: new Date(),
        status: 'active',
        data: {
          day: 'Tuesday',
          time: '14:00-17:00',
          suggestedDiscount: 15,
        },
      },
      {
        id: '3',
        type: 'anomaly',
        title: 'Unusual Cancellation Pattern',
        description: 'AI detected 40% increase in cancellations for Friday appointments. Investigation recommended.',
        confidence: 0.95,
        impact: 'high',
        category: 'retention',
        createdAt: new Date(),
        status: 'active',
      },
      {
        id: '4',
        type: 'prediction',
        title: 'Seasonal Trend: Fitness Services Rising',
        description: 'Prediction shows growing interest in fitness programs for the upcoming season.',
        confidence: 0.78,
        impact: 'medium',
        category: 'trends',
        createdAt: new Date(),
        status: 'active',
      },
      {
        id: '5',
        type: 'warning',
        title: 'Chatbot Satisfaction Decline',
        description: 'User satisfaction with AI chatbot decreased by 12% this week. Review conversations needed.',
        confidence: 0.89,
        impact: 'medium',
        category: 'customer-service',
        createdAt: new Date(),
        status: 'active',
      },
    ];

    setInsights(mockInsights);
  };

  const loadMetrics = async () => {
    // Get usage stats from AI service
    const usageStats = aiService.getUsageStats();

    // Mock additional metrics
    const mockMetrics: AIMetrics = {
      period: selectedTimeRange,
      totalRequests: usageStats.totalRequests || 1247,
      successRate: usageStats.successRate || 0.94,
      averageResponseTime: 1.2,
      costUsage: usageStats.totalCost || 47.83,
      tokensUsed: usageStats.averageTokensUsed * usageStats.totalRequests || 248500,
      accuracy: 0.91,
      userSatisfaction: 0.87,
      providerBreakdown: usageStats.providerBreakdown || { openai: 65, google: 25, anthropic: 10 },
      topIntents: [
        { intent: 'booking', count: 423, percentage: 34 },
        { intent: 'pricing', count: 312, percentage: 25 },
        { intent: 'services', count: 249, percentage: 20 },
        { intent: 'availability', count: 187, percentage: 15 },
        { intent: 'help', count: 76, percentage: 6 },
      ],
      errorRate: 0.06,
      cacheHitRate: 0.73,
    };

    setMetrics(mockMetrics);
  };

  const loadPredictionData = async () => {
    // Mock prediction vs actual data
    const days = parseInt(selectedTimeRange);
    const data: PredictionData[] = [];

    for (let i = days; i > 0; i--) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const predicted = Math.floor(50 + Math.random() * 30);
      const actual = i > 7 ? predicted + Math.floor(Math.random() * 10 - 5) : undefined;

      data.push({
        date,
        predicted,
        actual,
        confidence: 0.8 + Math.random() * 0.2,
      });
    }

    // Add future predictions
    for (let i = 1; i <= 7; i++) {
      const date = format(subDays(new Date(), -i), 'yyyy-MM-dd');
      data.push({
        date,
        predicted: Math.floor(55 + Math.random() * 25),
        confidence: 0.75 + Math.random() * 0.2,
      });
    }

    setPredictionData(data);
  };

  const loadConversionFunnel = async () => {
    const mockFunnel: ConversionFunnel[] = [
      { stage: 'Website Visit', users: 10000, conversionRate: 100, dropOff: 0 },
      { stage: 'AI Chat Initiated', users: 3200, conversionRate: 32, dropOff: 68 },
      { stage: 'Service Inquiry', users: 1840, conversionRate: 18.4, dropOff: 42.5 },
      { stage: 'Booking Attempt', users: 920, conversionRate: 9.2, dropOff: 50 },
      { stage: 'Payment', users: 644, conversionRate: 6.44, dropOff: 30 },
      { stage: 'Booking Confirmed', users: 558, conversionRate: 5.58, dropOff: 13.4 },
    ];

    setConversionFunnel(mockFunnel);
  };

  const loadUserBehavior = async () => {
    // Mock user behavior data
    const mockUsers: UserBehavior[] = Array.from({ length: 100 }, (_, i) => ({
      userId: `user-${i + 1}`,
      sessions: Math.floor(1 + Math.random() * 10),
      interactions: Math.floor(1 + Math.random() * 50),
      bookingConversion: Math.random(),
      preferredServices: [
        ['Lip Enhancement', 'Brow Lamination'],
        ['Personal Training', 'Group Fitness'],
        ['PMU Brows', 'PMU Lips'],
      ][Math.floor(Math.random() * 3)],
      lastActive: subDays(new Date(), Math.floor(Math.random() * 30)),
      satisfaction: 0.7 + Math.random() * 0.3,
    }));

    setUserBehavior(mockUsers.sort((a, b) => b.sessions - a.sessions).slice(0, 10));
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAIInsights();
    setRefreshing(false);
  };

  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'prediction': return <TrendingUp className="w-5 h-5" />;
      case 'recommendation': return <Lightbulb className="w-5 h-5" />;
      case 'anomaly': return <AlertTriangle className="w-5 h-5" />;
      case 'opportunity': return <Target className="w-5 h-5" />;
      case 'warning': return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getInsightColor = (type: AIInsight['type']) => {
    switch (type) {
      case 'prediction': return 'text-blue-600 bg-blue-50';
      case 'recommendation': return 'text-purple-600 bg-purple-50';
      case 'anomaly': return 'text-red-600 bg-red-50';
      case 'opportunity': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-orange-600 bg-orange-50';
    }
  };

  const getImpactColor = (impact: AIInsight['impact']) => {
    switch (impact) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
    }
  };

  const filteredInsights = useMemo(() => {
    if (selectedCategory === 'all') return insights;
    return insights.filter(insight => insight.category === selectedCategory);
  }, [insights, selectedCategory]);

  const pieData = useMemo(() => {
    if (!metrics) return [];
    return metrics.topIntents.map((intent, index) => ({
      name: intent.intent,
      value: intent.count,
      color: COLORS[index % COLORS.length],
    }));
  }, [metrics]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-96">
            <RefreshCw className="w-8 h-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <div className={cn("space-y-6", className)}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Brain className="w-6 h-6" />
              AI Insights & Analytics
            </h2>
            <p className="text-muted-foreground mt-1">
              AI-powered insights to optimize your business
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Refresh
            </Button>
            {onExport && (
              <Button variant="outline" size="sm" onClick={onExport}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            )}
          </div>
        </div>

        {/* Key Metrics */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">AI Requests</p>
                    <p className="text-2xl font-bold">{metrics.totalRequests.toLocaleString()}</p>
                    <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                      <ArrowUpRight className="w-3 h-3" />
                      <span>+12% from last period</span>
                    </div>
                  </div>
                  <Activity className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                    <p className="text-2xl font-bold">{Math.round(metrics.successRate * 100)}%</p>
                    <Progress value={metrics.successRate * 100} className="mt-2" />
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">User Satisfaction</p>
                    <p className="text-2xl font-bold">{Math.round(metrics.userSatisfaction * 100)}%</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                      <span>4.35/5 average rating</span>
                    </div>
                  </div>
                  <Heart className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">AI Cost</p>
                    <p className="text-2xl font-bold">${metrics.costUsage.toFixed(2)}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <DollarSign className="w-3 h-3" />
                      <span>${(metrics.costUsage / metrics.totalRequests * 1000).toFixed(3)} per 1K requests</span>
                    </div>
                  </div>
                  <CreditCard className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="insights" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
            <TabsTrigger value="predictions">Predictions</TabsTrigger>
            <TabsTrigger value="behavior">User Behavior</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="funnel">Conversion</TabsTrigger>
          </TabsList>

          {/* AI Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">AI-Generated Insights</h3>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="demand">Demand</SelectItem>
                  <SelectItem value="pricing">Pricing</SelectItem>
                  <SelectItem value="retention">Retention</SelectItem>
                  <SelectItem value="trends">Trends</SelectItem>
                  <SelectItem value="customer-service">Customer Service</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4">
              {filteredInsights.map((insight) => (
                <Card key={insight.id} className={cn("border-l-4", {
                  'border-l-blue-500': insight.type === 'prediction',
                  'border-l-purple-500': insight.type === 'recommendation',
                  'border-l-red-500': insight.type === 'anomaly',
                  'border-l-green-500': insight.type === 'opportunity',
                  'border-l-orange-500': insight.type === 'warning',
                })}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className={cn("p-2 rounded-lg", getInsightColor(insight.type))}>
                            {getInsightIcon(insight.type)}
                          </div>
                          <div>
                            <h4 className="font-semibold">{insight.title}</h4>
                            <p className="text-sm text-muted-foreground">{insight.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            Impact: <span className={cn("font-medium", getImpactColor(insight.impact))}>
                              {insight.impact}
                            </span>
                          </span>
                          <span className="flex items-center gap-1">
                            <BarChart3 className="w-3 h-3" />
                            Confidence: {Math.round(insight.confidence * 100)}%
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(insight.createdAt, 'MMM dd, HH:mm')}
                          </span>
                        </div>
                        {insight.data && (
                          <div className="mt-3 p-3 bg-muted rounded-lg">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              {Object.entries(insight.data).map(([key, value]) => (
                                <div key={key}>
                                  <span className="text-muted-foreground capitalize">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}:
                                  </span>
                                  <span className="ml-2 font-medium">{String(value)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={insight.status === 'active' ? 'default' : 'secondary'}>
                          {insight.status}
                        </Badge>
                        <Button variant="outline" size="sm">
                          Action
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Predictions Tab */}
          <TabsContent value="predictions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Demand Forecast</CardTitle>
                <CardDescription>
                  AI predictions for booking demand vs actual values
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={predictionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                    />
                    <YAxis />
                    <RechartsTooltip
                      labelFormatter={(value) => format(new Date(value as string), 'MMM dd, yyyy')}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="predicted"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.3}
                      name="Predicted Demand"
                    />
                    <Area
                      type="monotone"
                      dataKey="actual"
                      stroke="#82ca9d"
                      fill="#82ca9d"
                      fillOpacity={0.3}
                      name="Actual Demand"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Behavior Tab */}
          <TabsContent value="behavior" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top AI Interactions</CardTitle>
                  <CardDescription>
                    Most common user intents with AI assistant
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Most Active Users</CardTitle>
                  <CardDescription>
                    Users with highest AI interaction rates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {userBehavior.slice(0, 5).map((user, index) => (
                      <div key={user.userId} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium w-8">#{index + 1}</span>
                          <div>
                            <p className="text-sm font-medium">{user.userId}</p>
                            <p className="text-xs text-muted-foreground">
                              {user.sessions} sessions • {user.interactions} interactions
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={user.bookingConversion > 0.5 ? 'default' : 'secondary'}>
                            {Math.round(user.bookingConversion * 100)}% conversion
                          </Badge>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                            <span className="text-xs">{user.satisfaction.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            {metrics && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>AI Provider Usage</CardTitle>
                    <CardDescription>
                      Distribution of requests across AI providers
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(metrics.providerBreakdown).map(([provider, percentage]) => (
                        <div key={provider} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium capitalize">{provider}</span>
                            <span className="text-sm text-muted-foreground">{percentage}%</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                    <CardDescription>
                      Key performance indicators for AI systems
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Average Response Time</span>
                        <span className="font-medium">{metrics.averageResponseTime}s</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Error Rate</span>
                        <span className="font-medium text-red-600">{(metrics.errorRate * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Cache Hit Rate</span>
                        <span className="font-medium text-green-600">{(metrics.cacheHitRate * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Accuracy Score</span>
                        <span className="font-medium">{(metrics.accuracy * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Tokens Used</span>
                        <span className="font-medium">{metrics.tokensUsed.toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Conversion Funnel Tab */}
          <TabsContent value="funnel" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI-Assisted Conversion Funnel</CardTitle>
                <CardDescription>
                  User journey with AI interactions at each stage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {conversionFunnel.map((stage, index) => (
                    <div key={stage.stage} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{stage.stage}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {stage.users.toLocaleString()} users
                          </span>
                          <Badge variant={stage.conversionRate > 10 ? 'default' : 'secondary'}>
                            {stage.conversionRate}%
                          </Badge>
                        </div>
                      </div>
                      <div className="relative">
                        <Progress value={stage.conversionRate} className="h-3" />
                        {stage.dropOff > 0 && (
                          <div className="absolute top-4 right-0 text-xs text-red-600">
                            -{stage.dropOff}% drop off
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}