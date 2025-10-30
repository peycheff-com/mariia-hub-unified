import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
  Area
} from 'recharts';
import {
  Brain,
  Users,
  MessageSquare,
  Phone,
  Mail,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  Filter,
  Download,
  Settings,
  RefreshCw,
  Zap,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  Award,
  Star,
  Heart,
  HeadphonesIcon,
  FileText,
  Database,
  Wifi,
  Globe,
  Building,
  ShoppingCart,
  UserCheck,
  Bot,
  Cpu,
  Monitor,
  Eye,
  AlertCircle
} from 'lucide-react';

import SupportAnalyticsDashboard from './SupportAnalyticsDashboard';
import PerformanceTrackingSystem from './PerformanceTrackingSystem';
import CustomerExperienceAnalytics from './CustomerExperienceAnalytics';
import QualityAssuranceAnalytics from './QualityAssuranceAnalytics';
import PredictiveAnalytics from './PredictiveAnalytics';
import BusinessIntelligence from './BusinessIntelligence';
import AlertNotificationSystem from './AlertNotificationSystem';

interface SystemHealth {
  overall: 'healthy' | 'warning' | 'critical';
  components: {
    database: 'healthy' | 'warning' | 'critical';
    analytics: 'healthy' | 'warning' | 'critical';
    alerts: 'healthy' | 'warning' | 'critical';
    predictions: 'healthy' | 'warning' | 'critical';
  };
  lastUpdated: string;
  uptime: number;
}

interface IntegrationStatus {
  system: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync: string;
  recordsProcessed: number;
  errorRate: number;
  latency: number;
}

interface UnifiedMetrics {
  totalTickets: number;
  resolvedTickets: number;
  avgResponseTime: number;
  satisfactionScore: number;
  agentUtilization: number;
  systemHealth: number;
  activeAlerts: number;
  predictedVolume: number;
  roi: number;
}

const UnifiedSupportAnalyticsHub: React.FC = () => {
  const [selectedView, setSelectedView] = useState('overview');
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [isLoading, setIsLoading] = useState(true);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [integrationStatus, setIntegrationStatus] = useState<IntegrationStatus[]>([]);
  const [unifiedMetrics, setUnifiedMetrics] = useState<UnifiedMetrics | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mock integration status
  const mockIntegrationStatus: IntegrationStatus[] = [
    {
      system: 'Support Tickets',
      status: 'connected',
      lastSync: '2024-01-15T15:30:00Z',
      recordsProcessed: 15420,
      errorRate: 0.02,
      latency: 120
    },
    {
      system: 'CRM/Client Profiles',
      status: 'connected',
      lastSync: '2024-01-15T15:28:00Z',
      recordsProcessed: 3250,
      errorRate: 0.01,
      latency: 85
    },
    {
      system: 'Knowledge Base',
      status: 'connected',
      lastSync: '2024-01-15T15:25:00Z',
      recordsProcessed: 850,
      errorRate: 0.00,
      latency: 45
    },
    {
      system: 'Communication Systems',
      status: 'connected',
      lastSync: '2024-01-15T15:32:00Z',
      recordsProcessed: 8900,
      errorRate: 0.03,
      latency: 95
    },
    {
      system: 'Booking System',
      status: 'connected',
      lastSync: '2024-01-15T15:31:00Z',
      recordsProcessed: 2100,
      errorRate: 0.01,
      latency: 110
    },
    {
      system: 'Payment Processing',
      status: 'warning',
      lastSync: '2024-01-15T14:45:00Z',
      recordsProcessed: 1200,
      errorRate: 0.08,
      latency: 250
    }
  ];

  const mockSystemHealth: SystemHealth = {
    overall: 'healthy',
    components: {
      database: 'healthy',
      analytics: 'healthy',
      alerts: 'warning',
      predictions: 'healthy'
    },
    lastUpdated: '2024-01-15T15:35:00Z',
    uptime: 99.8
  };

  const mockUnifiedMetrics: UnifiedMetrics = {
    totalTickets: 15420,
    resolvedTickets: 14580,
    avgResponseTime: 12.5,
    satisfactionScore: 4.6,
    agentUtilization: 87.5,
    systemHealth: 99.8,
    activeAlerts: 3,
    predictedVolume: 16500,
    roi: 245
  };

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setSystemHealth(mockSystemHealth);
      setIntegrationStatus(mockIntegrationStatus);
      setUnifiedMetrics(mockUnifiedMetrics);
      setIsLoading(false);
    }, 1000);
  }, []);

  const refreshAllSystems = async () => {
    setIsRefreshing(true);
    try {
      // Simulate system refresh
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error('Error refreshing systems:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <Wifi className="h-4 w-4 text-green-500" />;
      case 'disconnected': return <WifiOff className="h-4 w-4 text-gray-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const analyticsComponents = {
    overview: (
      <div className="space-y-6">
        {/* Executive Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Total Interactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{unifiedMetrics?.totalTickets.toLocaleString()}</div>
              <div className="flex items-center gap-2 mt-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600">+12% vs last period</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Star className="h-4 w-4" />
                Customer Satisfaction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{unifiedMetrics?.satisfactionScore}/5.0</div>
              <div className="flex items-center gap-2 mt-2">
                <Heart className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-600">Excellent rating</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Support ROI
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{unifiedMetrics?.roi}%</div>
              <div className="flex items-center gap-2 mt-2">
                <Award className="h-4 w-4 text-purple-500" />
                <span className="text-sm text-purple-600">Industry leading</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{unifiedMetrics?.systemHealth}%</div>
              <div className="flex items-center gap-2 mt-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600">All systems operational</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Integration Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-[#8B4513]" />
              System Integration Status
            </CardTitle>
            <CardDescription>Real-time status of all integrated systems and data flows</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {integrationStatus.map((integration) => (
                <div key={integration.system} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(integration.status)}
                    <div>
                      <h4 className="font-medium">{integration.system}</h4>
                      <p className="text-sm text-muted-foreground">
                        Last sync: {new Date(integration.lastSync).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-right text-sm">
                    <div>
                      <p className="text-muted-foreground">Records</p>
                      <p className="font-medium">{integration.recordsProcessed.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Error Rate</p>
                      <p className={`font-medium ${integration.errorRate > 0.05 ? 'text-red-600' : 'text-green-600'}`}>
                        {(integration.errorRate * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Latency</p>
                      <p className="font-medium">{integration.latency}ms</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Channel Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Channel Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Email</span>
                  </div>
                  <Badge variant="outline">95% success</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Chat</span>
                  </div>
                  <Badge variant="outline">92% success</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">Phone</span>
                  </div>
                  <Badge variant="outline">98% success</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="h-5 w-5 text-[#8B4513]" />
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">Volume Prediction</p>
                  <p className="text-sm text-blue-700">
                    {unifiedMetrics?.predictedVolume.toLocaleString()} tickets expected next week
                  </p>
                </div>
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-green-800">Churn Risk</p>
                  <p className="text-sm text-green-700">
                    3 high-risk customers identified
                  </p>
                </div>
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm font-medium text-orange-800">Opportunity</p>
                  <p className="text-sm text-orange-700">
                    Premium support upsell potential: $45K
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Active Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800">SLA Compliance</p>
                    <p className="text-xs text-red-700">Below target threshold</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-800">Response Time</p>
                    <p className="text-xs text-yellow-700">Slight degradation</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded">
                  <Info className="h-4 w-4 text-blue-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-800">System Update</p>
                    <p className="text-xs text-blue-700">Scheduled maintenance</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    ),
    dashboard: <SupportAnalyticsDashboard />,
    performance: <PerformanceTrackingSystem />,
    experience: <CustomerExperienceAnalytics />,
    quality: <QualityAssuranceAnalytics />,
    predictive: <PredictiveAnalytics />,
    business: <BusinessIntelligence />,
    alerts: <AlertNotificationSystem />
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B4513]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#8B4513]">Unified Support Analytics Hub</h1>
          <p className="text-muted-foreground">Comprehensive analytics platform for luxury beauty & fitness support operations</p>
        </div>

        <div className="flex items-center gap-4">
          {/* System Health Indicator */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${getHealthColor(systemHealth?.overall || 'healthy')}`}>
            <div className={`w-2 h-2 rounded-full ${
              systemHealth?.overall === 'healthy' ? 'bg-green-500' :
              systemHealth?.overall === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
            <span className="text-sm font-medium capitalize">
              {systemHealth?.overall || 'Unknown'}
            </span>
          </div>

          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>

          <Button
            variant="outline"
            onClick={refreshAllSystems}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh All'}
          </Button>

          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>

          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* System Status Bar */}
      {systemHealth && (
        <Alert>
          <Monitor className="h-4 w-4" />
          <AlertTitle>System Status</AlertTitle>
          <AlertDescription>
            <div className="flex items-center gap-6 mt-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">Database:</span>
                <Badge className={getHealthColor(systemHealth.components.database)}>
                  {systemHealth.components.database}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">Analytics:</span>
                <Badge className={getHealthColor(systemHealth.components.analytics)}>
                  {systemHealth.components.analytics}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">Alerts:</span>
                <Badge className={getHealthColor(systemHealth.components.alerts)}>
                  {systemHealth.components.alerts}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">Predictions:</span>
                <Badge className={getHealthColor(systemHealth.components.predictions)}>
                  {systemHealth.components.predictions}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Uptime: {systemHealth.uptime}%</span>
                <span>•</span>
                <span>Last updated: {new Date(systemHealth.lastUpdated).toLocaleTimeString()}</span>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Navigation Tabs */}
      <Tabs value={selectedView} onValueChange={setSelectedView} className="space-y-4">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="experience">Experience</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
          <TabsTrigger value="predictive">Predictive</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        {/* Tab Content */}
        <div className="min-h-[600px]">
          {analyticsComponents[selectedView as keyof typeof analyticsComponents]}
        </div>
      </Tabs>
    </div>
  );
};

export default UnifiedSupportAnalyticsHub;