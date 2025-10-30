import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  Treemap
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  MessageSquare,
  Phone,
  Mail,
  Star,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Zap,
  Award,
  Crown,
  Diamond,
  Globe,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Settings,
  Eye,
  Brain,
  Heart,
  Shield,
  HeadphonesIcon,
  FileText,
  Database,
  Wifi,
  TrendingDown as TrendDownIcon,
  ArrowUp,
  ArrowDown,
  MoreVertical,
  Bell,
  AlertCircle,
  Info,
  ChevronUp,
  ChevronDown,
  User,
  ShoppingCart,
  CreditCard,
  Building,
  MapPin,
  Timer,
  Percent,
  Hash
} from 'lucide-react';
import { unifiedSupportService } from '@/services/UnifiedSupportService';
import { useLuxuryExperience } from '@/contexts/LuxuryExperienceContext';

interface ExecutiveMetrics {
  overview: {
    totalRevenue: number;
    totalClients: number;
    totalInteractions: number;
    satisfactionScore: number;
    retentionRate: number;
    supportROI: number;
    systemHealth: number;
    activeVIPs: number;
  };
  financial: {
    revenueGrowth: number;
    costPerTicket: number;
    customerLifetimeValue: number;
    upsellRevenue: number;
    supportCosts: number;
    profitMargin: number;
    monthlyRecurringRevenue: number;
    averageRevenuePerUser: number;
  };
  operational: {
    avgResponseTime: number;
    resolutionRate: number;
    firstContactResolution: number;
    agentUtilization: number;
    ticketVolume: number;
    serviceLevelAgreement: number;
    escalations: number;
    automationRate: number;
  };
  client: {
    clientSatisfaction: number;
    netPromoterScore: number;
    clientChurnRate: number;
    vipRetentionRate: number;
    newClientAcquisition: number;
    clientEngagement: number;
    segmentationData: any[];
    loyaltyMetrics: any[];
  };
  predictive: {
    volumeForecast: number;
    churnRisk: number;
    revenueForecast: number;
    resourceNeeds: number;
    seasonalTrends: any[];
    opportunityAnalysis: any[];
    riskIndicators: any[];
  };
}

interface TimeSeriesData {
  date: string;
  revenue: number;
  interactions: number;
  satisfaction: number;
  newClients: number;
  retention: number;
}

interface PerformanceTrend {
  metric: string;
  current: number;
  previous: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
  target: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

const ExecutiveAnalyticsDashboard: React.FC = () => {
  const { currentTier, enableLuxuryFeatures } = useLuxuryExperience();
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [selectedView, setSelectedView] = useState('overview');
  const [metrics, setMetrics] = useState<ExecutiveMetrics | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [performanceTrends, setPerformanceTrends] = useState<PerformanceTrend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Mock data for demonstration
  const mockMetrics: ExecutiveMetrics = {
    overview: {
      totalRevenue: 2847500,
      totalClients: 3420,
      totalInteractions: 45680,
      satisfactionScore: 4.8,
      retentionRate: 94.5,
      supportROI: 325,
      systemHealth: 99.2,
      activeVIPs: 285
    },
    financial: {
      revenueGrowth: 23.5,
      costPerTicket: 12.40,
      customerLifetimeValue: 8450,
      upsellRevenue: 385000,
      supportCosts: 567000,
      profitMargin: 68.5,
      monthlyRecurringRevenue: 425000,
      averageRevenuePerUser: 833
    },
    operational: {
      avgResponseTime: 1.2, // hours
      resolutionRate: 96.8,
      firstContactResolution: 78.5,
      agentUtilization: 87.3,
      ticketVolume: 12450,
      serviceLevelAgreement: 98.2,
      escalations: 2.3,
      automationRate: 65.8
    },
    client: {
      clientSatisfaction: 4.8,
      netPromoterScore: 72,
      clientChurnRate: 5.5,
      vipRetentionRate: 98.7,
      newClientAcquisition: 485,
      clientEngagement: 86.2,
      segmentationData: [
        { segment: 'VIP Platinum', count: 45, revenue: 1250000, satisfaction: 4.9 },
        { segment: 'VIP Gold', count: 85, revenue: 780000, satisfaction: 4.8 },
        { segment: 'VIP Silver', count: 155, revenue: 620000, satisfaction: 4.7 },
        { segment: 'Premium', count: 485, revenue: 485000, satisfaction: 4.6 },
        { segment: 'Standard', count: 2650, revenue: 495000, satisfaction: 4.3 }
      ],
      loyaltyMetrics: [
        { tier: 'VIP Platinum', retention: 99.2, upsell: 85, satisfaction: 4.9 },
        { tier: 'VIP Gold', retention: 97.8, upsell: 72, satisfaction: 4.8 },
        { tier: 'VIP Silver', retention: 95.5, upsell: 58, satisfaction: 4.7 },
        { tier: 'Premium', retention: 91.2, upsell: 35, satisfaction: 4.6 },
        { tier: 'Standard', retention: 87.3, upsell: 15, satisfaction: 4.3 }
      ]
    },
    predictive: {
      volumeForecast: 15200,
      churnRisk: 18,
      revenueForecast: 3250000,
      resourceNeeds: 15,
      seasonalTrends: [
        { month: 'Jan', predicted: 1200, actual: 1150 },
        { month: 'Feb', predicted: 1100, actual: 1080 },
        { month: 'Mar', predicted: 1400, actual: 1450 },
        { month: 'Apr', predicted: 1300, actual: 1280 },
        { month: 'May', predicted: 1500, actual: 0 },
        { month: 'Jun', predicted: 1600, actual: 0 }
      ],
      opportunityAnalysis: [
        { opportunity: 'VIP Upsell', potential: 125000, probability: 0.85, timeline: 'Q2' },
        { opportunity: 'Service Expansion', potential: 85000, probability: 0.72, timeline: 'Q3' },
        { opportunity: 'Premium Features', potential: 65000, probability: 0.68, timeline: 'Q2' },
        { opportunity: 'International Markets', potential: 250000, probability: 0.45, timeline: 'Q4' }
      ],
      riskIndicators: [
        { risk: 'VIP Churn', level: 'low', affected: 3, impact: 'high' },
        { risk: 'Seasonal Decline', level: 'medium', affected: 120, impact: 'medium' },
        { risk: 'Staff Shortage', level: 'high', affected: 0, impact: 'high' },
        { risk: 'System Load', level: 'low', affected: 0, impact: 'medium' }
      ]
    }
  };

  const mockTimeSeriesData: TimeSeriesData[] = [
    { date: '2024-01-01', revenue: 220000, interactions: 3200, satisfaction: 4.6, newClients: 35, retention: 92.1 },
    { date: '2024-01-08', revenue: 235000, interactions: 3450, satisfaction: 4.7, newClients: 42, retention: 93.2 },
    { date: '2024-01-15', revenue: 248000, interactions: 3680, satisfaction: 4.7, newClients: 38, retention: 93.8 },
    { date: '2024-01-22', revenue: 262000, interactions: 3890, satisfaction: 4.8, newClients: 45, retention: 94.1 },
    { date: '2024-01-29', revenue: 275000, interactions: 4120, satisfaction: 4.8, newClients: 51, retention: 94.3 },
    { date: '2024-02-05', revenue: 288000, interactions: 4350, satisfaction: 4.8, newClients: 48, retention: 94.5 },
    { date: '2024-02-12', revenue: 295000, interactions: 4560, satisfaction: 4.9, newClients: 52, retention: 94.7 },
    { date: '2024-02-19', revenue: 310000, interactions: 4780, satisfaction: 4.9, newClients: 58, retention: 94.8 }
  ];

  const mockPerformanceTrends: PerformanceTrend[] = [
    {
      metric: 'Revenue Growth',
      current: 23.5,
      previous: 18.2,
      trend: 'up',
      change: 5.3,
      target: 20.0,
      status: 'excellent'
    },
    {
      metric: 'Client Satisfaction',
      current: 4.8,
      previous: 4.6,
      trend: 'up',
      change: 0.2,
      target: 4.7,
      status: 'excellent'
    },
    {
      metric: 'Retention Rate',
      current: 94.5,
      previous: 92.1,
      trend: 'up',
      change: 2.4,
      target: 93.0,
      status: 'excellent'
    },
    {
      metric: 'Response Time',
      current: 1.2,
      previous: 1.8,
      trend: 'down',
      change: -0.6,
      target: 2.0,
      status: 'excellent'
    },
    {
      metric: 'Support ROI',
      current: 325,
      previous: 285,
      trend: 'up',
      change: 40,
      target: 300,
      status: 'excellent'
    },
    {
      metric: 'System Health',
      current: 99.2,
      previous: 97.8,
      trend: 'up',
      change: 1.4,
      target: 98.0,
      status: 'excellent'
    }
  ];

  useEffect(() => {
    loadExecutiveData();

    if (autoRefresh) {
      const interval = setInterval(loadExecutiveData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [selectedTimeRange, autoRefresh]);

  const loadExecutiveData = async () => {
    try {
      setIsLoading(true);

      // Simulate API call
      setTimeout(() => {
        setMetrics(mockMetrics);
        setTimeSeriesData(mockTimeSeriesData);
        setPerformanceTrends(mockPerformanceTrends);
        setIsLoading(false);
      }, 1500);
    } catch (error) {
      console.error('Error loading executive data:', error);
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    await loadExecutiveData();
    setIsRefreshing(false);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('pl-PL').format(num);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-50';
      case 'good': return 'text-blue-600 bg-blue-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowUp className="h-4 w-4 text-green-500" />;
      case 'down': return <ArrowDown className="h-4 w-4 text-red-500" />;
      default: return <TrendingUp className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const COLORS = ['#8B4513', '#DAA520', '#C0C0C0', '#4169E1', '#708090'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B4513] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading executive analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Executive Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive insights for luxury beauty & fitness support operations</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md bg-white"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">Last Year</option>
            </select>
          </div>

          <Button
            variant="outline"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 border-green-300' : ''}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Button>

          <Button
            variant="outline"
            onClick={refreshData}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics.overview.totalRevenue)}</div>
              <div className="flex items-center gap-2 mt-2">
                {getTrendIcon('up')}
                <span className="text-sm text-green-600">+{metrics.financial.revenueGrowth}% growth</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Clients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(metrics.overview.totalClients)}</div>
              <div className="flex items-center gap-2 mt-2">
                <Crown className="h-4 w-4 text-purple-500" />
                <span className="text-sm text-purple-600">{metrics.overview.activeVIPs} VIPs</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Star className="h-4 w-4" />
                Satisfaction Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.overview.satisfactionScore}/5.0</div>
              <div className="flex items-center gap-2 mt-2">
                <Heart className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-600">Excellent rating</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4" />
                Support ROI
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.overview.supportROI}%</div>
              <div className="flex items-center gap-2 mt-2">
                <Award className="h-4 w-4 text-orange-500" />
                <span className="text-sm text-orange-600">Industry leading</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Performance Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#8B4513]" />
            Performance Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {performanceTrends.map((trend, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">{trend.metric}</span>
                    <Badge className={getStatusColor(trend.status)}>
                      {trend.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Current: {trend.current}</span>
                    <span>•</span>
                    <span>Target: {trend.target}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    {getTrendIcon(trend.trend)}
                    <span className={`font-medium ${
                      trend.trend === 'up' ? 'text-green-600' :
                      trend.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {trend.change > 0 ? '+' : ''}{trend.change}
                    </span>
                  </div>
                  <Progress value={(trend.current / trend.target) * 100} className="mt-2 h-2 w-20" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analytics Tabs */}
      <Tabs value={selectedView} onValueChange={setSelectedView} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="operational">Operational</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="predictive">Predictive</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue & Satisfaction Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue & Satisfaction Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Bar yAxisId="left" dataKey="revenue" fill="#8B4513" opacity={0.3} />
                    <Line yAxisId="right" type="monotone" dataKey="satisfaction" stroke="#DAA520" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Client Segmentation */}
            {metrics && (
              <Card>
                <CardHeader>
                  <CardTitle>Client Segmentation</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={metrics.client.segmentationData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ segment, percent }) => `${segment} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {metrics.client.segmentationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#8B4513]" />
                System Health & Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">System Health</span>
                    <span className="text-sm font-bold">{metrics?.overview.systemHealth}%</span>
                  </div>
                  <Progress value={metrics?.overview.systemHealth} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Resolution Rate</span>
                    <span className="text-sm font-bold">{metrics?.operational.resolutionRate}%</span>
                  </div>
                  <Progress value={metrics?.operational.resolutionRate} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Automation Rate</span>
                    <span className="text-sm font-bold">{metrics?.operational.automationRate}%</span>
                  </div>
                  <Progress value={metrics?.operational.automationRate} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-6">
          {metrics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Financial Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Revenue Growth</span>
                      <span className="font-bold text-green-600">+{metrics.financial.revenueGrowth}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Cost Per Ticket</span>
                      <span className="font-bold">{formatCurrency(metrics.financial.costPerTicket)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Customer Lifetime Value</span>
                      <span className="font-bold">{formatCurrency(metrics.financial.customerLifetimeValue)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Monthly Recurring Revenue</span>
                      <span className="font-bold">{formatCurrency(metrics.financial.monthlyRecurringRevenue)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Profit Margin</span>
                      <span className="font-bold text-green-600">{metrics.financial.profitMargin}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revenue Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <Treemap
                      data={[
                        { name: 'VIP Services', value: 1250000, fill: '#8B4513' },
                        { name: 'Premium Services', value: 780000, fill: '#DAA520' },
                        { name: 'Standard Services', value: 620000, fill: '#C0C0C0' },
                        { name: 'Upsells', value: 385000, fill: '#4169E1' },
                        { name: 'Other', value: 125000, fill: '#708090' }
                      ]}
                    />
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Operational Tab */}
        <TabsContent value="operational" className="space-y-6">
          {metrics && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Response Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">{metrics.operational.avgResponseTime}h</div>
                      <div className="text-sm text-gray-600">Average Response Time</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">{metrics.operational.resolutionRate}%</div>
                      <div className="text-sm text-gray-600">Resolution Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">{metrics.operational.firstContactResolution}%</div>
                      <div className="text-sm text-gray-600">First Contact Resolution</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Agent Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Agent Utilization</span>
                        <span className="text-sm font-bold">{metrics.operational.agentUtilization}%</span>
                      </div>
                      <Progress value={metrics.operational.agentUtilization} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">SLA Compliance</span>
                        <span className="text-sm font-bold">{metrics.operational.serviceLevelAgreement}%</span>
                      </div>
                      <Progress value={metrics.operational.serviceLevelAgreement} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Automation Rate</span>
                        <span className="text-sm font-bold">{metrics.operational.automationRate}%</span>
                      </div>
                      <Progress value={metrics.operational.automationRate} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Volume Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600">{formatNumber(metrics.operational.ticketVolume)}</div>
                      <div className="text-sm text-gray-600">Total Tickets</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-red-600">{metrics.operational.escalations}%</div>
                      <div className="text-sm text-gray-600">Escalation Rate</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Clients Tab */}
        <TabsContent value="clients" className="space-y-6">
          {metrics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Client Satisfaction Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Client Satisfaction</span>
                      <span className="font-bold text-green-600">{metrics.client.clientSatisfaction}/5.0</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Net Promoter Score</span>
                      <span className="font-bold text-blue-600">{metrics.client.netPromoterScore}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Client Churn Rate</span>
                      <span className="font-bold text-red-600">{metrics.client.clientChurnRate}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">VIP Retention Rate</span>
                      <span className="font-bold text-green-600">{metrics.client.vipRetentionRate}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Client Engagement</span>
                      <span className="font-bold text-purple-600">{metrics.client.clientEngagement}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Client Loyalty by Tier</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={metrics.client.loyaltyMetrics}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="tier" />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} />
                      <Radar name="Retention" dataKey="retention" stroke="#8B4513" fill="#8B4513" fillOpacity={0.6} />
                      <Radar name="Upsell" dataKey="upsell" stroke="#DAA520" fill="#DAA520" fillOpacity={0.6} />
                      <Radar name="Satisfaction" dataKey="satisfaction" stroke="#C0C0C0" fill="#C0C0C0" fillOpacity={0.6} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Predictive Tab */}
        <TabsContent value="predictive" className="space-y-6">
          {metrics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-[#8B4513]" />
                    AI Predictions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-800">Volume Forecast</h4>
                      <p className="text-2xl font-bold text-blue-900">{formatNumber(metrics.predictive.volumeForecast)}</p>
                      <p className="text-sm text-blue-700">tickets expected next month</p>
                    </div>
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-medium text-green-800">Revenue Forecast</h4>
                      <p className="text-2xl font-bold text-green-900">{formatCurrency(metrics.predictive.revenueForecast)}</p>
                      <p className="text-sm text-green-700">predicted revenue next quarter</p>
                    </div>
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h4 className="font-medium text-red-800">Churn Risk</h4>
                      <p className="text-2xl font-bold text-red-900">{metrics.predictive.churnRisk}</p>
                      <p className="text-sm text-red-700">high-risk clients identified</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Opportunity Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metrics.predictive.opportunityAnalysis.map((opportunity, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{opportunity.opportunity}</h4>
                          <p className="text-sm text-gray-600">{formatCurrency(opportunity.potential)} potential</p>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-green-100 text-green-800">
                            {(opportunity.probability * 100).toFixed(0)}% probability
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">{opportunity.timeline}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Risk Indicators</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metrics.predictive.riskIndicators.map((risk, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className={`h-5 w-5 ${
                            risk.level === 'high' ? 'text-red-500' :
                            risk.level === 'medium' ? 'text-yellow-500' : 'text-green-500'
                          }`} />
                          <div>
                            <h4 className="font-medium">{risk.risk}</h4>
                            <p className="text-sm text-gray-600">{risk.affected} clients affected</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getRiskColor(risk.level)}>
                            {risk.level}
                          </Badge>
                          <span className="text-sm text-gray-500 capitalize">{risk.impact} impact</span>
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

export default ExecutiveAnalyticsDashboard;