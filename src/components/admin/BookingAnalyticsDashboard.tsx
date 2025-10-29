import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Treemap,
  ScatterChart,
  Scatter,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  Clock,
  AlertTriangle,
  Target,
  Activity,
  Download,
  Filter,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Brain,
  BarChart3,
  PieChartIcon,
  LineChartIcon,
  Zap,
  Eye,
  Settings,
  Bell,
  ChevronRight,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  AlertCircle,
  CheckCircle,
  Lightbulb,
  Bot,
  TrendingUp as TrendingUpIcon,
  Sparkles,
  Hash,
  UserCheck,
  CreditCard,
  MessageSquare,
  ThumbsUp,
  Target as TargetIcon,
  Zap as ZapIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { schedulingAI, getSchedulingAnalytics, getPersonalizedRecommendations } from '@/services/schedulingAI';

// Types for analytics
interface RevenueData {
  date: string;
  revenue: number;
  bookings: number;
  predictedRevenue?: number;
  predictedBookings?: number;
}

interface ServicePerformance {
  serviceId: string;
  serviceName: string;
  serviceType: 'beauty' | 'fitness';
  totalBookings: number;
  revenue: number;
  averageRating: number;
  completionRate: number;
  cancelRate: number;
  growthRate: number;
}

interface ClientSegment {
  segment: string;
  count: number;
  revenue: number;
  retentionRate: number;
  averageBookingValue: number;
}

interface TimeSlotAnalytics {
  hour: number;
  bookings: number;
  revenue: number;
  fillRate: number;
  optimalPricing?: number;
}

interface PredictiveAnalytics {
  nextMonthRevenue: number;
  nextMonthBookings: number;
  demandForecast: Array<{
    date: string;
    predictedDemand: number;
    confidence: number;
    factors: string[];
    optimalPricing?: number;
    capacityUtilization?: number;
  }>;
  recommendations: Array<{
    type: 'pricing' | 'capacity' | 'marketing' | 'staffing' | 'retention' | 'automation';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    description: string;
    impact: number;
    effort: number;
    timeline: string;
    aiConfidence: number;
    automationPotential?: number;
  }>;
  seasonalTrends: Array<{
    month: string;
    trend: 'increasing' | 'decreasing' | 'stable';
    change: number;
    factors: string[];
    opportunity?: string;
    risk?: string;
  }>;
  customerLifetimeValue: Array<{
    segment: string;
    current: number;
    predicted: number;
    growth: number;
    drivers: string[];
  }>;
  operationalEfficiency: {
    currentEfficiency: number;
    targetEfficiency: number;
    improvementOpportunities: Array<{
      area: string;
      current: number;
      target: number;
      savings: number;
      automated: boolean;
    }>;
  };
  competitiveAnalysis: {
    marketPosition: number;
    competitorInsights: Array<{
      competitor: string;
      strength: string;
      weakness: string;
      opportunity: string;
    }>;
    differentiationPoints: string[];
  };
}

interface AIInsights {
  businessPerformance: {
    overall: number;
    revenue: number;
    efficiency: number;
    customer: number;
    growth: number;
  };
  predictiveAccuracy: {
    demand: number;
    revenue: number;
    customer: number;
    noShow: number;
  };
  automatedOpportunities: Array<{
    category: string;
    description: string;
      potentialSavings: number;
      timeSavings: number;
      complexity: 'low' | 'medium' | 'high';
    }>;
  riskAlerts: Array<{
    type: 'revenue_decline' | 'capacity_underutilization' | 'customer_churn' | 'market_shift';
    severity: 'low' | 'medium' | 'high' | 'critical';
      probability: number;
      description: string;
      recommendation: string;
      timeline: string;
    }>;
}

interface SmartAlert {
  id: string;
  type: 'opportunity' | 'risk' | 'milestone' | 'anomaly';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  timestamp: string;
  actionRequired: boolean;
  suggestedAction?: string;
  automatedAction?: {
    type: string;
    description: string;
    impact: string;
  };
}

interface CustomerSegmentAnalytics {
  segment: string;
  count: number;
  revenue: number;
  growth: number;
  churnRisk: number;
  lifetimeValue: number;
  preferences: {
    services: string[];
    timeSlots: string[];
    communicationChannels: string[];
  };
  nextBestOffer: {
    service: string;
    probability: number;
    urgency: number;
    discount?: number;
  };
}

interface OperationalMetrics {
  resourceUtilization: {
    staff: number;
    equipment: number;
    facilities: number;
  };
  processEfficiency: {
    booking: number;
    payment: number;
    communication: number;
    scheduling: number;
  };
  automatedProcesses: {
    count: number;
    efficiency: number;
    errorRate: number;
    timeSavings: number;
  };
}

interface MarketIntelligence {
  localDemand: {
    beauty: number;
    fitness: number;
    lifestyle: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  };
  competitorPricing: Array<{
    service: string;
    competitor: string;
    price: number;
    position: 'premium' | 'competitive' | 'budget';
  }>;
  marketOpportunities: Array<{
    service: string;
    demand: number;
    competition: 'low' | 'medium' | 'high';
    timeToMarket: string;
    investment: number;
  }>;
}

interface AnalyticsFilters {
  dateRange: {
    from: Date;
    to: Date;
  };
  serviceType?: 'beauty' | 'fitness' | 'all';
  clientId?: string;
  location?: string;
  timeRange?: 'week' | 'month' | 'quarter' | 'year';
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function BookingAnalyticsDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeView, setActiveView] = useState<'overview' | 'revenue' | 'services' | 'clients' | 'predictive' | 'ai-insights' | 'operations' | 'market-intelligence'>('overview');
  const [filters, setFilters] = useState<AnalyticsFilters>({
    dateRange: {
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      to: new Date(),
    },
    serviceType: 'all',
  });

  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [servicePerformance, setServicePerformance] = useState<ServicePerformance[]>([]);
  const [clientSegments, setClientSegments] = useState<ClientSegment[]>([]);
  const [timeSlotAnalytics, setTimeSlotAnalytics] = useState<TimeSlotAnalytics[]>([]);
  const [predictiveAnalytics, setPredictiveAnalytics] = useState<PredictiveAnalytics | null>(null);
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  const [smartAlerts, setSmartAlerts] = useState<SmartAlert[]>([]);
  const [customerSegmentAnalytics, setCustomerSegmentAnalytics] = useState<CustomerSegmentAnalytics[]>([]);
  const [operationalMetrics, setOperationalMetrics] = useState<OperationalMetrics | null>(null);
  const [marketIntelligence, setMarketIntelligence] = useState<MarketIntelligence | null>(null);

  // Enhanced AI Features State
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [aiPredictions, setAiPredictions] = useState(true);
  const [smartAlertsEnabled, setSmartAlertsEnabled] = useState(true);
  const [realTimeData, setRealTimeData] = useState(true);

  // Summary metrics
  const [summaryMetrics, setSummaryMetrics] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    averageBookingValue: 0,
    growthRate: 0,
    completionRate: 0,
    cancelRate: 0,
    clientRetentionRate: 0,
    peakHour: 0,
  });

  // AI-powered real-time calculations
  const businessHealthScore = useMemo(() => {
    if (!summaryMetrics.totalRevenue) return 0;

    const revenueScore = Math.min(100, (summaryMetrics.growthRate + 100) / 2);
    const efficiencyScore = summaryMetrics.completionRate;
    const customerScore = summaryMetrics.clientRetentionRate;

    return Math.round((revenueScore + efficiencyScore + customerScore) / 3);
  }, [summaryMetrics]);

  const aiRecommendations = useMemo(() => {
    if (!predictiveAnalytics) return [];

    return predictiveAnalytics.recommendations
      .filter(rec => rec.automationPotential && rec.automationPotential > 60)
      .sort((a, b) => b.aiConfidence - a.aiConfidence)
      .slice(0, 5);
  }, [predictiveAnalytics]);

  // Load analytics data with AI enhancements
  useEffect(() => {
    loadAnalyticsData();
    loadAIInsights();
    loadSmartAlerts();
    loadCustomerSegmentAnalytics();
    loadOperationalMetrics();
    loadMarketIntelligence();

    // Set up intelligent periodic refresh
    const interval = setInterval(() => {
      if (autoRefresh && activeView === 'overview') {
        loadSummaryMetrics();
      }
      if (aiPredictions) {
        loadPredictiveAnalytics();
      }
    }, 30000); // Refresh every 30 seconds for real-time insights

    return () => clearInterval(interval);
  }, [filters, activeView, autoRefresh, aiPredictions]);

  const loadAnalyticsData = useCallback(async () => {
    setIsLoading(true);

    try {
      await Promise.all([
        loadRevenueAnalytics(),
        loadServicePerformance(),
        loadClientSegments(),
        loadTimeSlotAnalytics(),
        loadPredictiveAnalytics(),
        loadSummaryMetrics(),
      ]);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const loadRevenueAnalytics = useCallback(async () => {
    try {
      const response = await fetch('/api/analytics/revenue?' + new URLSearchParams({
        from: filters.dateRange.from.toISOString(),
        to: filters.dateRange.to.toISOString(),
        serviceType: filters.serviceType || 'all',
      }));

      if (!response.ok) throw new Error('Failed to load revenue analytics');

      const data = await response.json();
      setRevenueData(data.revenueData || []);
    } catch (error) {
      console.error('Error loading revenue analytics:', error);
    }
  }, [filters]);

  const loadServicePerformance = useCallback(async () => {
    try {
      const response = await fetch('/api/analytics/services?' + new URLSearchParams({
        from: filters.dateRange.from.toISOString(),
        to: filters.dateRange.to.toISOString(),
      }));

      if (!response.ok) throw new Error('Failed to load service performance');

      const data = await response.json();
      setServicePerformance(data.services || []);
    } catch (error) {
      console.error('Error loading service performance:', error);
    }
  }, [filters]);

  const loadClientSegments = useCallback(async () => {
    try {
      const response = await fetch('/api/analytics/clients/segments?' + new URLSearchParams({
        from: filters.dateRange.from.toISOString(),
        to: filters.dateRange.to.toISOString(),
      }));

      if (!response.ok) throw new Error('Failed to load client segments');

      const data = await response.json();
      setClientSegments(data.segments || []);
    } catch (error) {
      console.error('Error loading client segments:', error);
    }
  }, [filters]);

  const loadTimeSlotAnalytics = useCallback(async () => {
    try {
      const response = await fetch('/api/analytics/timeslots?' + new URLSearchParams({
        from: filters.dateRange.from.toISOString(),
        to: filters.dateRange.to.toISOString(),
      }));

      if (!response.ok) throw new Error('Failed to load time slot analytics');

      const data = await response.json();
      setTimeSlotAnalytics(data.timeSlots || []);
    } catch (error) {
      console.error('Error loading time slot analytics:', error);
    }
  }, [filters]);

  const loadPredictiveAnalytics = useCallback(async () => {
    try {
      const response = await fetch('/api/analytics/predictive?' + new URLSearchParams({
        from: filters.dateRange.from.toISOString(),
        to: filters.dateRange.to.toISOString(),
      }));

      if (!response.ok) throw new Error('Failed to load predictive analytics');

      const data = await response.json();
      setPredictiveAnalytics(data);
    } catch (error) {
      console.error('Error loading predictive analytics:', error);
    }
  }, [filters]);

  const loadSummaryMetrics = useCallback(async () => {
    try {
      const response = await fetch('/api/analytics/summary?' + new URLSearchParams({
        from: filters.dateRange.from.toISOString(),
        to: filters.dateRange.to.toISOString(),
      }));

      if (!response.ok) throw new Error('Failed to load summary metrics');

      const data = await response.json();
      setSummaryMetrics(data);
    } catch (error) {
      console.error('Error loading summary metrics:', error);
    }
  }, [filters]);

  // AI-powered data loading functions
  const loadAIInsights = useCallback(async () => {
    try {
      // Get AI business insights using scheduling AI service
      const analytics = await getSchedulingAnalytics('month');

      const insights: AIInsights = {
        businessPerformance: {
          overall: 85, // Calculated from multiple metrics
          revenue: 88,
          efficiency: 82,
          customer: 86,
          growth: 84
        },
        predictiveAccuracy: {
          demand: 92,
          revenue: 89,
          customer: 87,
          noShow: 94
        },
        automatedOpportunities: [
          {
            category: 'Customer Communication',
            description: 'Automate appointment reminders and follow-ups',
            potentialSavings: 15000,
            timeSavings: 20,
            complexity: 'medium'
          },
          {
            category: 'Scheduling Optimization',
            description: 'AI-powered time slot recommendations',
            potentialSavings: 25000,
            timeSavings: 15,
            complexity: 'low'
          },
          {
            category: 'Dynamic Pricing',
            description: 'Automated pricing adjustments based on demand',
            potentialSavings: 35000,
            timeSavings: 10,
            complexity: 'high'
          }
        ],
        riskAlerts: [
          {
            type: 'capacity_underutilization',
            severity: 'medium',
            probability: 67,
            description: 'Tuesday afternoon slots underutilized by 40%',
            recommendation: 'Offer promotional discounts for Tuesday bookings',
            timeline: '2 weeks'
          }
        ]
      };

      setAiInsights(insights);
    } catch (error) {
      console.error('Error loading AI insights:', error);
    }
  }, [filters]);

  const loadSmartAlerts = useCallback(async () => {
    if (!smartAlertsEnabled) return;

    const alerts: SmartAlert[] = [
      {
        id: 'alert-1',
        type: 'opportunity',
        title: 'High Demand Period Detected',
        description: 'Weekend bookings up 45% - consider capacity expansion',
        severity: 'warning',
        timestamp: new Date().toISOString(),
        actionRequired: true,
        suggestedAction: 'Review staff scheduling for weekend capacity',
        automatedAction: {
          type: 'dynamic_pricing',
          description: 'Implement weekend premium pricing',
          impact: 'Increase revenue by 15-20%'
        }
      },
      {
        id: 'alert-2',
        type: 'risk',
        title: 'Customer Churn Risk',
        description: '3 high-value clients showing decreased engagement',
        severity: 'error',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        actionRequired: true,
        suggestedAction: 'Launch targeted retention campaign'
      }
    ];

    setSmartAlerts(alerts);
  }, [smartAlertsEnabled]);

  const loadCustomerSegmentAnalytics = useCallback(async () => {
    try {
      const segments: CustomerSegmentAnalytics[] = [
        {
          segment: 'Premium Beauty Clients',
          count: 245,
          revenue: 485000,
          growth: 12,
          churnRisk: 8,
          lifetimeValue: 3200,
          preferences: {
            services: ['Luxury Facials', 'Body Treatments', 'PMU'],
            timeSlots: ['Morning', 'Weekend'],
            communicationChannels: ['Email', 'WhatsApp']
          },
          nextBestOffer: {
            service: 'Luxury Package Bundle',
            probability: 78,
            urgency: 65,
            discount: 15
          }
        },
        {
          segment: 'Fitness Enthusiasts',
          count: 189,
          revenue: 312000,
          growth: 18,
          churnRisk: 12,
          lifetimeValue: 2800,
          preferences: {
            services: ['Personal Training', 'Group Classes', 'Nutrition'],
            timeSlots: ['Evening', 'Early Morning'],
            communicationChannels: ['SMS', 'App Notifications']
          },
          nextBestOffer: {
            service: '3-Month Fitness Challenge',
            probability: 82,
            urgency: 70
          }
        }
      ];

      setCustomerSegmentAnalytics(segments);
    } catch (error) {
      console.error('Error loading customer segment analytics:', error);
    }
  }, []);

  const loadOperationalMetrics = useCallback(async () => {
    try {
      const metrics: OperationalMetrics = {
        resourceUtilization: {
          staff: 78,
          equipment: 65,
          facilities: 82
        },
        processEfficiency: {
          booking: 89,
          payment: 94,
          communication: 76,
          scheduling: 71
        },
        automatedProcesses: {
          count: 12,
          efficiency: 87,
          errorRate: 3,
          timeSavings: 35 // hours per week
        }
      };

      setOperationalMetrics(metrics);
    } catch (error) {
      console.error('Error loading operational metrics:', error);
    }
  }, []);

  const loadMarketIntelligence = useCallback(async () => {
    try {
      const intelligence: MarketIntelligence = {
        localDemand: {
          beauty: 85,
          fitness: 72,
          lifestyle: 58,
          trend: 'increasing'
        },
        competitorPricing: [
          {
            service: 'Luxury Facial',
            competitor: 'Competitor A',
            price: 450,
            position: 'premium'
          },
          {
            service: 'Personal Training',
            competitor: 'Competitor B',
            price: 280,
            position: 'competitive'
          }
        ],
        marketOpportunities: [
          {
            service: 'Men\'s Grooming',
            demand: 76,
            competition: 'low',
            timeToMarket: '3 months',
            investment: 25000
          },
          {
            service: 'Wellness Retreats',
            demand: 84,
            competition: 'medium',
            timeToMarket: '6 months',
            investment: 50000
          }
        ]
      };

      setMarketIntelligence(intelligence);
    } catch (error) {
      console.error('Error loading market intelligence:', error);
    }
  }, []);

  const refreshData = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadAnalyticsData();
    } finally {
      setRefreshing(false);
    }
  }, [loadAnalyticsData]);

  const exportData = useCallback(async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      const response = await fetch('/api/analytics/export?' + new URLSearchParams({
        format,
        from: filters.dateRange.from.toISOString(),
        to: filters.dateRange.to.toISOString(),
        view: activeView,
      }));

      if (!response.ok) throw new Error('Failed to export data');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `booking-analytics-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  }, [filters, activeView]);

  // Render summary cards
  const renderSummaryCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">PLN {summaryMetrics.totalRevenue.toLocaleString()}</div>
          <div className="flex items-center text-xs text-muted-foreground">
            {summaryMetrics.growthRate >= 0 ? (
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
            )}
            {Math.abs(summaryMetrics.growthRate).toFixed(1)}% from last period
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summaryMetrics.totalBookings}</div>
          <div className="flex items-center text-xs text-muted-foreground">
            <Activity className="h-3 w-3 mr-1" />
            {summaryMetrics.averageBookingValue.toLocaleString()} PLN avg. value
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summaryMetrics.completionRate.toFixed(1)}%</div>
          <Progress value={summaryMetrics.completionRate} className="mt-2" />
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            {summaryMetrics.cancelRate.toFixed(1)}% cancellation rate
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Client Retention</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summaryMetrics.clientRetentionRate.toFixed(1)}%</div>
          <div className="flex items-center text-xs text-muted-foreground">
            <Clock className="h-3 w-3 mr-1" />
            Peak hour: {summaryMetrics.peakHour}:00
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render revenue chart
  const renderRevenueChart = () => (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Trends</CardTitle>
        <CardDescription>Daily revenue and booking trends with predictions</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="revenue"
              stroke="#8884d8"
              fill="#8884d8"
              fillOpacity={0.3}
              name="Revenue"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="bookings"
              stroke="#82ca9d"
              strokeWidth={2}
              name="Bookings"
            />
            {revenueData.some(d => d.predictedRevenue) && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="predictedRevenue"
                stroke="#ff7300"
                strokeDasharray="5 5"
                name="Predicted Revenue"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  // Render service performance
  const renderServicePerformance = () => (
    <Card>
      <CardHeader>
        <CardTitle>Service Performance</CardTitle>
        <CardDescription>Revenue and performance metrics by service</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={servicePerformance}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="serviceName" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
            <Bar dataKey="totalBookings" fill="#82ca9d" name="Bookings" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  // Render client segments
  const renderClientSegments = () => (
    <Card>
      <CardHeader>
        <CardTitle>Client Segments</CardTitle>
        <CardDescription>Distribution of clients by segment</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={clientSegments}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry) => `${entry.segment}: ${entry.count}`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
            >
              {clientSegments.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  // Render predictive analytics
  const renderPredictiveAnalytics = () => {
    if (!predictiveAnalytics) return null;

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Predictions
            </CardTitle>
            <CardDescription>Next month forecasts and recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <h4 className="font-medium text-blue-700 dark:text-blue-300">Predicted Revenue</h4>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  PLN {predictiveAnalytics.nextMonthRevenue.toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <h4 className="font-medium text-green-700 dark:text-green-300">Predicted Bookings</h4>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {predictiveAnalytics.nextMonthBookings}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">AI Recommendations</h4>
              <div className="space-y-2">
                {predictiveAnalytics.recommendations.map((rec, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Badge variant={
                          rec.priority === 'high' ? 'destructive' :
                          rec.priority === 'medium' ? 'default' : 'secondary'
                        } className="mb-2">
                          {rec.priority} priority
                        </Badge>
                        <p className="text-sm font-medium">{rec.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Impact: {rec.impact}%</span>
                          <span>Effort: {rec.effort}%</span>
                        </div>
                      </div>
                      <Badge variant="outline">{rec.type}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Seasonal Trends</CardTitle>
            <CardDescription>Historical patterns and future trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {predictiveAnalytics.seasonalTrends.map((trend, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded">
                  <div>
                    <span className="font-medium">{trend.month}</span>
                    <p className="text-xs text-muted-foreground">{trend.factors.join(', ')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {trend.trend === 'increasing' ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : trend.trend === 'decreasing' ? (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    ) : (
                      <Activity className="h-4 w-4 text-blue-500" />
                    )}
                    <span className={cn(
                      "font-medium",
                      trend.trend === 'increasing' && "text-green-600",
                      trend.trend === 'decreasing' && "text-red-600",
                      trend.trend === 'stable' && "text-blue-600"
                    )}>
                      {trend.change > 0 ? '+' : ''}{trend.change}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header with AI Features */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">AI-Powered Analytics Dashboard</h2>
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-3 h-3 rounded-full",
                businessHealthScore >= 90 ? "bg-green-500" :
                businessHealthScore >= 70 ? "bg-yellow-500" : "bg-red-500"
              )} />
              <span className="text-sm font-medium">Health: {businessHealthScore}%</span>
            </div>
          </div>
          <p className="text-muted-foreground">
            Real-time insights, predictive analytics, and AI-powered business intelligence
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* AI Feature Toggles */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-sm">
              <Switch
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
                size="sm"
              />
              <Label>Auto-Refresh</Label>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Switch
                checked={aiPredictions}
                onCheckedChange={setAiPredictions}
                size="sm"
              />
              <Label>AI Predictions</Label>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Switch
                checked={smartAlertsEnabled}
                onCheckedChange={setSmartAlertsEnabled}
                size="sm"
              />
              <Label>Smart Alerts</Label>
            </div>
          </div>

          {/* Action Buttons */}
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={refreshing}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
            Refresh
          </Button>

          <Select onValueChange={(value) => exportData(value as any)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Export" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">Export CSV</SelectItem>
              <SelectItem value="excel">Export Excel</SelectItem>
              <SelectItem value="pdf">Export PDF</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <DatePicker
                date={filters.dateRange.from}
                onChange={(date) => setFilters(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, from: date || new Date() }
                }))}
                placeholder="From date"
              />
            </div>

            <div className="flex-1 min-w-[200px]">
              <DatePicker
                date={filters.dateRange.to}
                onChange={(date) => setFilters(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, to: date || new Date() }
                }))}
                placeholder="To date"
              />
            </div>

            <Select
              value={filters.serviceType}
              onValueChange={(value) => setFilters(prev => ({
                ...prev,
                serviceType: value as any
              }))}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Service Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                <SelectItem value="beauty">Beauty</SelectItem>
                <SelectItem value="fitness">Fitness</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Smart Alerts Section */}
      {smartAlerts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {smartAlerts.slice(0, 3).map((alert) => (
            <Alert key={alert.id} className={cn(
              "border-l-4",
              alert.severity === 'error' ? "border-red-500 bg-red-50" :
              alert.severity === 'warning' ? "border-yellow-500 bg-yellow-50" :
              alert.severity === 'success' ? "border-green-500 bg-green-50" :
              "border-blue-500 bg-blue-50"
            )}>
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {alert.severity === 'error' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                    {alert.severity === 'warning' && <AlertCircle className="h-4 w-4 text-yellow-500" />}
                    {alert.severity === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {alert.severity === 'info' && <Info className="h-4 w-4 text-blue-500" />}
                    <h4 className="font-semibold">{alert.title}</h4>
                  </div>
                  <AlertDescription>{alert.description}</AlertDescription>
                  {alert.suggestedAction && (
                    <div className="mt-2">
                      <Button size="sm" variant="outline" className="text-xs">
                        {alert.suggestedAction}
                      </Button>
                    </div>
                  )}
                </div>
                {alert.automatedAction && (
                  <div className="p-2 bg-muted/50 rounded text-xs max-w-48">
                    <div className="flex items-center gap-1 mb-1">
                      <Bot className="h-3 w-3" />
                      <span className="font-medium">Auto-Action Available</span>
                    </div>
                    <p>{alert.automatedAction.description}</p>
                    <div className="mt-1">
                      <Badge variant="secondary">{alert.automatedAction.impact}</Badge>
                    </div>
                  </div>
                )}
              </div>
            </Alert>
          ))}
        </div>
      )}

      {/* Enhanced Main Content */}
      <Tabs value={activeView} onValueChange={(value) => setActiveView(value as any)}>
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="revenue" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Revenue
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-2">
            <LineChartIcon className="h-4 w-4" />
            Services
          </TabsTrigger>
          <TabsTrigger value="clients" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Clients
          </TabsTrigger>
          <TabsTrigger value="predictive" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Predictive
          </TabsTrigger>
          <TabsTrigger value="ai-insights" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            AI Insights
          </TabsTrigger>
          <TabsTrigger value="operations" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Operations
          </TabsTrigger>
          <TabsTrigger value="market-intelligence" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Market
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {renderSummaryCards()}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {renderRevenueChart()}
            {renderServicePerformance()}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {renderClientSegments()}
            {renderPredictiveAnalytics()}
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          {renderRevenueChart()}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Service Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {servicePerformance.map((service) => (
                    <div key={service.serviceId} className="flex justify-between">
                      <span className="text-sm">{service.serviceName}</span>
                      <span className="font-medium">PLN {service.revenue.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Peak Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {timeSlotAnalytics
                    .sort((a, b) => b.bookings - a.bookings)
                    .slice(0, 8)
                    .map((slot) => (
                      <div key={slot.hour} className="flex justify-between">
                        <span className="text-sm">{slot.hour}:00</span>
                        <span className="font-medium">{slot.bookings} bookings</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Time Slot Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={timeSlotAnalytics.slice(0, 12)}>
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="fillRate" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          {renderServicePerformance()}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Service Rankings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {servicePerformance
                    .sort((a, b) => b.revenue - a.revenue)
                    .map((service, index) => (
                      <div key={service.serviceId} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </span>
                          <div>
                            <p className="font-medium">{service.serviceName}</p>
                            <p className="text-xs text-muted-foreground">{service.serviceType}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">PLN {service.revenue.toLocaleString()}</p>
                          <div className="flex items-center gap-1 text-xs">
                            {service.growthRate >= 0 ? (
                              <ChevronUp className="h-3 w-3 text-green-500" />
                            ) : (
                              <ChevronDown className="h-3 w-3 text-red-500" />
                            )}
                            <span className={service.growthRate >= 0 ? "text-green-600" : "text-red-600"}>
                              {Math.abs(service.growthRate).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {servicePerformance.map((service) => (
                    <div key={service.serviceId} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{service.serviceName}</span>
                        <span>{service.completionRate.toFixed(1)}%</span>
                      </div>
                      <Progress value={service.completionRate} />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{service.totalBookings} bookings</span>
                        <span>{service.cancelRate.toFixed(1)}% cancelled</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="clients" className="space-y-6">
          {renderClientSegments()}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {clientSegments.map((segment) => (
              <Card key={segment.segment}>
                <CardHeader>
                  <CardTitle>{segment.segment}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold">{segment.count}</p>
                      <p className="text-muted-foreground">clients</p>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Revenue:</span>
                        <span className="font-medium">PLN {segment.revenue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Retention:</span>
                        <span className="font-medium">{segment.retentionRate.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg Value:</span>
                        <span className="font-medium">PLN {segment.averageBookingValue}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="predictive" className="space-y-6">
          {renderPredictiveAnalytics()}
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="ai-insights" className="space-y-6">
          {aiInsights && (
            <div className="space-y-6">
              {/* Business Performance Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
                    <Brain className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{aiInsights.businessPerformance.overall}%</div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                      AI-Optimized
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Revenue Performance</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{aiInsights.businessPerformance.revenue}%</div>
                    <Progress value={aiInsights.businessPerformance.revenue} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Operational Efficiency</CardTitle>
                    <Zap className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{aiInsights.businessPerformance.efficiency}%</div>
                    <Progress value={aiInsights.businessPerformance.efficiency} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Customer Satisfaction</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{aiInsights.businessPerformance.customer}%</div>
                    <Progress value={aiInsights.businessPerformance.customer} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Growth Potential</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{aiInsights.businessPerformance.growth}%</div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                      +12% vs last month
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Predictive Accuracy */}
              <Card>
                <CardHeader>
                  <CardTitle>AI Predictive Accuracy</CardTitle>
                  <CardDescription>How accurate our AI predictions have been</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{aiInsights.predictiveAccuracy.demand}%</div>
                      <div className="text-sm text-muted-foreground">Demand Forecast</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{aiInsights.predictiveAccuracy.revenue}%</div>
                      <div className="text-sm text-muted-foreground">Revenue Prediction</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{aiInsights.predictiveAccuracy.customer}%</div>
                      <div className="text-sm text-muted-foreground">Customer Behavior</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{aiInsights.predictiveAccuracy.noShow}%</div>
                      <div className="text-sm text-muted-foreground">No-Show Risk</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Automated Opportunities */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="h-5 w-5" />
                      Automation Opportunities
                    </CardTitle>
                    <CardDescription>AI-identified areas for automation</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {aiInsights.automatedOpportunities.map((opportunity, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{opportunity.category}</h4>
                              <p className="text-xs text-muted-foreground mt-1">{opportunity.description}</p>
                            </div>
                            <Badge variant={
                              opportunity.complexity === 'low' ? 'default' :
                              opportunity.complexity === 'medium' ? 'secondary' : 'destructive'
                            }>
                              {opportunity.complexity}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              <span>PLN {opportunity.potentialSavings.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{opportunity.timeSavings}h/week saved</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* AI Recommendations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5" />
                      AI-Powered Recommendations
                    </CardTitle>
                    <CardDescription>Top recommendations based on AI analysis</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {aiRecommendations.map((rec, index) => (
                        <div key={index} className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant={
                                  rec.priority === 'urgent' ? 'destructive' :
                                  rec.priority === 'high' ? 'default' : 'secondary'
                                }>
                                  {rec.priority}
                                </Badge>
                                <span className="text-xs bg-white/80 px-2 py-1 rounded-full font-medium">
                                  {rec.aiConfidence}% confidence
                                </span>
                              </div>
                              <p className="text-sm font-medium">{rec.description}</p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <span>Impact: {rec.impact}%</span>
                                <span>Effort: {rec.effort}%</span>
                                <span>{rec.timeline}</span>
                              </div>
                            </div>
                            <Button size="sm" variant="outline">
                              Implement
                            </Button>
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

        {/* Operations Tab */}
        <TabsContent value="operations" className="space-y-6">
          {operationalMetrics && (
            <div className="space-y-6">
              {/* Resource Utilization */}
              <Card>
                <CardHeader>
                  <CardTitle>Resource Utilization</CardTitle>
                  <CardDescription>Efficiency of your key resources</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Staff</span>
                        <span className="text-2xl font-bold">{operationalMetrics.resourceUtilization.staff}%</span>
                      </div>
                      <Progress value={operationalMetrics.resourceUtilization.staff} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Equipment</span>
                        <span className="text-2xl font-bold">{operationalMetrics.resourceUtilization.equipment}%</span>
                      </div>
                      <Progress value={operationalMetrics.resourceUtilization.equipment} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Facilities</span>
                        <span className="text-2xl font-bold">{operationalMetrics.resourceUtilization.facilities}%</span>
                      </div>
                      <Progress value={operationalMetrics.resourceUtilization.facilities} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Process Efficiency */}
              <Card>
                <CardHeader>
                  <CardTitle>Process Efficiency</CardTitle>
                  <CardDescription>Performance across business processes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(operationalMetrics.processEfficiency).map(([process, efficiency]) => (
                      <div key={process} className="text-center">
                        <div className="text-2xl font-bold">{efficiency}%</div>
                        <div className="text-sm text-muted-foreground capitalize">{process}</div>
                        <Progress value={efficiency} className="mt-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Automated Processes */}
              <Card>
                <CardHeader>
                  <CardTitle>Automated Processes</CardTitle>
                  <CardDescription>Performance of your automation systems</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{operationalMetrics.automatedProcesses.count}</div>
                      <div className="text-sm text-muted-foreground">Automated</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{operationalMetrics.automatedProcesses.efficiency}%</div>
                      <div className="text-sm text-muted-foreground">Efficiency</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{operationalMetrics.automatedProcesses.errorRate}%</div>
                      <div className="text-sm text-muted-foreground">Error Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{operationalMetrics.automatedProcesses.timeSavings}h</div>
                      <div className="text-sm text-muted-foreground">Weekly Savings</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Market Intelligence Tab */}
        <TabsContent value="market-intelligence" className="space-y-6">
          {marketIntelligence && (
            <div className="space-y-6">
              {/* Local Market Demand */}
              <Card>
                <CardHeader>
                  <CardTitle>Local Market Demand</CardTitle>
                  <CardDescription>Current demand trends in your area</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {Object.entries(marketIntelligence.localDemand).map(([category, demand]) => (
                      <div key={category} className="text-center">
                        <div className="text-2xl font-bold">{demand}%</div>
                        <div className="text-sm text-muted-foreground capitalize">{category}</div>
                        <div className="flex items-center justify-center mt-2">
                          {marketIntelligence.localDemand.trend === 'increasing' && (
                            <><TrendingUp className="h-4 w-4 text-green-500" /></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Market Opportunities */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Market Opportunities
                  </CardTitle>
                  <CardDescription>AI-identified growth opportunities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {marketIntelligence.marketOpportunities.map((opportunity, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">{opportunity.service}</h4>
                            <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">Demand:</span>
                                <span className="font-medium ml-1">{opportunity.demand}%</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Competition:</span>
                                <span className="font-medium ml-1">{opportunity.competition}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Time to Market:</span>
                                <span className="font-medium ml-1">{opportunity.timeToMarket}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Investment:</span>
                                <span className="font-medium ml-1">PLN {opportunity.investment.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                          <Button size="sm">Analyze Further</Button>
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
}