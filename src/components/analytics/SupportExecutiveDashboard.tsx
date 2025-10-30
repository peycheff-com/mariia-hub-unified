import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import {
  TrendingUp, TrendingDown, Users, MessageSquare, Clock, Star,
  AlertTriangle, CheckCircle, Target, Zap, DollarSign, Award,
  Activity, BarChart3, PieChartIcon, Calendar, Download, Filter,
  Bell, Settings, RefreshCw, ChevronUp, ChevronDown
} from 'lucide-react';

import { supportAnalyticsService } from '@/services/support-analytics.service';
import { customerSatisfactionAnalyticsService } from '@/services/customer-satisfaction-analytics.service';
import { operationalIntelligenceService } from '@/services/operational-intelligence.service';
import {
  SupportDashboardMetrics,
  CustomerSatisfactionAnalytics,
  OperationalIntelligence,
  SupportAlert,
  VIPAnalytics
} from '@/types/support-analytics';

interface SupportExecutiveDashboardProps {
  timeRange?: {
    start: string;
    end: string;
  };
  refreshInterval?: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const SupportExecutiveDashboard: React.FC<SupportExecutiveDashboardProps> = ({
  timeRange,
  refreshInterval = 30000 // 30 seconds
}) => {
  const [metrics, setMetrics] = useState<SupportDashboardMetrics | null>(null);
  const [satisfactionAnalytics, setSatisfactionAnalytics] = useState<CustomerSatisfactionAnalytics | null>(null);
  const [operationalIntelligence, setOperationalIntelligence] = useState<OperationalIntelligence | null>(null);
  const [vipAnalytics, setVipAnalytics] = useState<VIPAnalytics | null>(null);
  const [alerts, setAlerts] = useState<SupportAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange || {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const filter = { date_range: selectedTimeRange };

      const [
        metricsData,
        satisfactionData,
        operationalData,
        vipData,
        alertsData
      ] = await Promise.all([
        supportAnalyticsService.getDashboardMetrics(filter),
        customerSatisfactionAnalyticsService.getSatisfactionAnalytics(filter),
        operationalIntelligenceService.getOperationalIntelligence(filter),
        supportAnalyticsService.getVIPAnalytics(filter),
        supportAnalyticsService.getActiveAlerts()
      ]);

      setMetrics(metricsData);
      setSatisfactionAnalytics(satisfactionData);
      setOperationalIntelligence(operationalData);
      setVipAnalytics(vipData);
      setAlerts(alertsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(fetchDashboardData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [selectedTimeRange, autoRefresh, refreshInterval]);

  // Calculate trend indicators
  const getTrendIndicator = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100;
    if (Math.abs(change) < 1) return { icon: <div className="w-4 h-4" />, color: 'text-gray-500', text: 'Stable' };
    if (change > 0) return {
      icon: <TrendingUp className="w-4 h-4" />,
      color: 'text-green-600',
      text: `+${change.toFixed(1)}%`
    };
    return {
      icon: <TrendingDown className="w-4 h-4" />,
      color: 'text-red-600',
      text: `${change.toFixed(1)}%`
    };
  };

  // Format large numbers
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Get status color for metrics
  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return 'text-green-600';
    if (value >= thresholds.warning) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-lg font-medium">Loading Support Analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <Button onClick={fetchDashboardData} className="mt-4">
            Retry
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Support Analytics Dashboard</h1>
          <p className="text-gray-600">Real-time insights into support operations and performance</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span className="text-sm text-gray-600">
              {new Date(selectedTimeRange.start).toLocaleDateString()} - {new Date(selectedTimeRange.end).toLocaleDateString()}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? <Bell className="w-4 h-4 mr-2" /> : <div className="w-4 h-4 mr-2" />}
            Auto-refresh
          </Button>
          <Button variant="outline" size="sm" onClick={fetchDashboardData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-900">Active Alerts</h2>
          <div className="grid gap-2">
            {alerts.slice(0, 3).map((alert) => (
              <Alert key={alert.id} className={`border-l-4 ${
                alert.severity === 'critical' ? 'border-l-red-500' :
                alert.severity === 'high' ? 'border-l-orange-500' :
                alert.severity === 'medium' ? 'border-l-yellow-500' :
                'border-l-blue-500'
              }`}>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="flex justify-between items-center">
                  <span>{alert.title}</span>
                  <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                    {alert.severity}
                  </Badge>
                </AlertTitle>
                <AlertDescription>{alert.message}</AlertDescription>
              </Alert>
            ))}
          </div>
        </div>
      )}

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics?.total_tickets || 0)}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              {getTrendIndicator(
                metrics?.total_tickets || 0,
                (metrics?.total_tickets || 0) * 0.9 // Mock previous value
              ).icon}
              <span>vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics?.open_tickets || 0)}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <div className={`w-2 h-2 rounded-full ${
                (metrics?.open_tickets || 0) > 50 ? 'bg-red-500' : 'bg-green-500'
              }`} />
              <span>Current queue</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((metrics?.avg_first_response_time || 0) / 60)}m
            </div>
            <div className={`text-xs ${
              getStatusColor(
                metrics?.avg_first_response_time || 0,
                { good: 3600, warning: 7200 } // 1 hour good, 2 hours warning
              )
            }`}>
              Target: 60min
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer Satisfaction</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(satisfactionAnalytics?.current_csat || 0).toFixed(1)}
            </div>
            <div className={`text-xs ${
              getStatusColor(
                satisfactionAnalytics?.current_csat || 0,
                { good: 4.5, warning: 4.0 }
              )
            }`}>
              Out of 5.0
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="satisfaction">Satisfaction</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="vip">VIP Analytics</TabsTrigger>
          <TabsTrigger value="forecasts">Forecasts</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ticket Volume Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Ticket Volume Trend</CardTitle>
                <CardDescription>Daily ticket volume over selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={metrics?.trend_data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="tickets" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Tickets by Channel */}
            <Card>
              <CardHeader>
                <CardTitle>Tickets by Channel</CardTitle>
                <CardDescription>Distribution across support channels</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={Object.entries(metrics?.tickets_by_channel || {}).map(([channel, count]) => ({
                        name: channel,
                        value: count
                      }))}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label
                    >
                      {Object.entries(metrics?.tickets_by_channel || {}).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Satisfaction Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Satisfaction Trend</CardTitle>
                <CardDescription>Daily satisfaction scores</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={satisfactionAnalytics?.satisfaction_trend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 5]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="csat" stroke="#82ca9d" name="CSAT" />
                    <Line type="monotone" dataKey="nps" stroke="#8884d8" name="NPS" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* SLA Compliance */}
            <Card>
              <CardHeader>
                <CardTitle>SLA Performance</CardTitle>
                <CardDescription>Service Level Agreement compliance rate</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overall Compliance</span>
                  <span className="text-sm font-bold">{(metrics?.sla_compliance_rate || 0).toFixed(1)}%</span>
                </div>
                <Progress value={metrics?.sla_compliance_rate || 0} className="h-2" />
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>First Response</span>
                    <span>92%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Resolution Time</span>
                    <span>88%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Quality Score</span>
                    <span>95%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Satisfaction Tab */}
        <TabsContent value="satisfaction" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Satisfaction Scores */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Satisfaction Metrics</CardTitle>
                <CardDescription>Current satisfaction scores and trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {(satisfactionAnalytics?.current_csat || 0).toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">CSAT</div>
                    <div className="text-xs text-gray-500">Customer Satisfaction</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {(satisfactionAnalytics?.current_nps || 0).toFixed(0)}
                    </div>
                    <div className="text-sm text-gray-600">NPS</div>
                    <div className="text-xs text-gray-500">Net Promoter Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">
                      {(satisfactionAnalytics?.current_ces || 0).toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">CES</div>
                    <div className="text-xs text-gray-500">Customer Effort Score</div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={satisfactionAnalytics?.driver_analysis?.map(driver => ({
                    metric: driver.factor,
                score: driver.impact_score * 100,
                fullMark: 100
              }))}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar name="Impact Score" dataKey="score" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Issues */}
        <Card>
          <CardHeader>
            <CardTitle>Top Satisfaction Issues</CardTitle>
            <CardDescription>Categories impacting customer satisfaction</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {satisfactionAnalytics?.top_issues?.slice(0, 5).map((issue, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{issue.category}</div>
                    <div className="text-xs text-gray-600">
                      {issue.frequency} tickets • Avg rating: {issue.avg_satisfaction.toFixed(1)}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={issue.trend === 'improving' ? 'default' : issue.trend === 'declining' ? 'destructive' : 'secondary'}>
                      {issue.trend}
                    </Badge>
                    <div className={`w-2 h-2 rounded-full ${
                      issue.impact_level === 'high' ? 'bg-red-500' :
                      issue.impact_level === 'medium' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </TabsContent>

    {/* Operations Tab */}
    <TabsContent value="operations" className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Volume and Predictions */}
        <Card>
          <CardHeader>
            <CardTitle>Volume & Predictions</CardTitle>
            <CardDescription>Current ticket volume and 7-day forecast</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Current Volume</span>
                <span className="text-2xl font-bold">{operationalIntelligence?.current_volume || 0}</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={operationalIntelligence?.predicted_volume}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="predicted" stroke="#8884d8" strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Staffing Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>Staffing Recommendations</CardTitle>
            <CardDescription>Optimal agent allocation for next 24 hours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {operationalIntelligence?.staffing_recommendations?.map((rec, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-sm">{rec.time_period}</span>
                    <Badge variant={rec.surplus_deficit > 0 ? 'destructive' : 'default'}>
                      {rec.surplus_deficit > 0 ? `+${rec.surplus_deficit} needed` : `${Math.abs(rec.surplus_deficit)} excess`}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>Required: {rec.required_agents}</div>
                    <div>Current: {rec.current_agents}</div>
                    <div>Predicted Volume: {rec.volume_prediction}</div>
                    <div>Service Level: {rec.service_level_target}%</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Capacity Utilization */}
        <Card>
          <CardHeader>
            <CardTitle>Capacity Utilization</CardTitle>
            <CardDescription>Current system capacity and utilization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Current Utilization</span>
                  <span className="text-sm font-bold">{((operationalIntelligence?.capacity_utilization?.current_utilization || 0) * 100).toFixed(1)}%</span>
                </div>
                <Progress value={(operationalIntelligence?.capacity_utilization?.current_utilization || 0) * 100} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Optimal Target</span>
                  <span className="text-sm font-bold">{((operationalIntelligence?.capacity_utilization?.optimal_utilization || 0) * 100).toFixed(1)}%</span>
                </div>
                <Progress value={(operationalIntelligence?.capacity_utilization?.optimal_utilization || 0) * 100} className="h-2" />
              </div>
              <div className="pt-2">
                <Badge variant={operationalIntelligence?.capacity_utilization?.utilization_trend === 'improving' ? 'default' : 'secondary'}>
                  {operationalIntelligence?.capacity_utilization?.utilization_trend}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Automation Opportunities */}
        <Card>
          <CardHeader>
            <CardTitle>Top Automation Opportunities</CardTitle>
            <CardDescription>Processes with highest automation potential</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {operationalIntelligence?.automation_opportunities?.slice(0, 4).map((opp, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex-1">
                    <div className="text-sm font-medium">{opp.process}</div>
                    <div className="text-xs text-gray-600">
                      {opp.time_savings_percentage.toFixed(0)}% time savings • {opp.roi_months}mo ROI
                    </div>
                  </div>
                  <Badge variant={opp.implementation_complexity === 'low' ? 'default' : 'secondary'}>
                    {opp.implementation_complexity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </TabsContent>

    {/* Performance Tab */}
    <TabsContent value="performance" className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agent Performance Overview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Agent Performance Distribution</CardTitle>
            <CardDescription>Performance metrics across team</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { metric: 'Response Time', target: 60, current: 45 },
                { metric: 'Resolution Time', target: 24, current: 18 },
                { metric: 'CSAT Score', target: 4.5, current: 4.4 },
                { metric: 'SLA Compliance', target: 95, current: 92 },
                { metric: 'FCR Rate', target: 80, current: 78 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="metric" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="target" fill="#82ca9d" />
                <Bar dataKey="current" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
            <CardDescription>Best performing agents this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((rank) => (
                <div key={rank} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      rank === 1 ? 'bg-yellow-500' :
                      rank === 2 ? 'bg-gray-400' :
                      rank === 3 ? 'bg-orange-600' :
                      'bg-gray-300'
                    }`}>
                      {rank}
                    </div>
                    <div>
                      <div className="font-medium text-sm">Agent {rank}</div>
                      <div className="text-xs text-gray-600">98% CSAT • 4.8 avg rating</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm">{45 - rank * 3}</div>
                    <div className="text-xs text-gray-600">tickets</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Skill Gap Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Skill Gap Analysis</CardTitle>
            <CardDescription>Areas requiring skill development</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {operationalIntelligence?.skill_gap_analysis?.slice(0, 4).map((gap, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{gap.skill}</span>
                    <Badge variant={gap.urgency === 'high' ? 'destructive' : gap.urgency === 'medium' ? 'default' : 'secondary'}>
                      {gap.gap_percentage.toFixed(0)}% gap
                    </Badge>
                  </div>
                  <Progress value={(gap.current_level / gap.required_level) * 100} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quality Metrics */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Quality Metrics Overview</CardTitle>
            <CardDescription>Quality assurance metrics and trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              {[
                { metric: 'Avg QA Score', value: 4.6, target: 4.5, status: 'good' },
                { metric: 'Call Monitoring', value: 85, target: 90, status: 'warning' },
                { metric: 'Accuracy Rate', value: 94, target: 95, status: 'warning' },
                { metric: 'Compliance Score', value: 98, target: 95, status: 'good' }
              ].map((item, index) => (
                <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className={`text-2xl font-bold ${
                    item.status === 'good' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {item.value}
                    {item.metric.includes('Score') || item.metric.includes('Rate') ? '' : '%'}
                  </div>
                  <div className="text-sm text-gray-600">{item.metric}</div>
                  <div className="text-xs text-gray-500">Target: {item.target}{item.metric.includes('Score') || item.metric.includes('Rate') ? '' : '%'}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </TabsContent>

    {/* VIP Analytics Tab */}
    <TabsContent value="vip" className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* VIP Overview */}
        <Card>
          <CardHeader>
            <CardTitle>VIP Customer Overview</CardTitle>
            <CardDescription>High-value customer support metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{vipAnalytics?.total_vip_customers || 0}</div>
                <div className="text-sm text-gray-600">Total VIP Customers</div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="font-bold">{(vipAnalytics?.vip_retention_rate || 0) * 100}%</div>
                  <div className="text-xs text-gray-600">Retention Rate</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="font-bold">{(vipAnalytics?.vip_support_metrics?.avg_response_time || 0)}m</div>
                  <div className="text-xs text-gray-600">Avg Response</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* VIP Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>VIP Tier Distribution</CardTitle>
            <CardDescription>Customers across VIP levels</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={Object.entries(vipAnalytics?.vip_distribution || {}).map(([tier, count]) => ({
                    name: tier,
                    value: count
                  }))}
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {Object.entries(vipAnalytics?.vip_distribution || {}).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* VIP Satisfaction */}
        <Card>
          <CardHeader>
            <CardTitle>VIP Satisfaction</CardTitle>
            <CardDescription>Satisfaction scores by VIP tier</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(vipAnalytics?.vip_satisfaction || {}).map(([tier, score], index) => (
                <div key={tier} className="flex justify-between items-center">
                  <span className="text-sm font-medium capitalize">{tier}</span>
                  <div className="flex items-center space-x-2">
                    <div className="text-sm font-bold">{score.toFixed(1)}</div>
                    <div className="w-12 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${(score / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* High-Value Insights */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>High-Value Customer Insights</CardTitle>
            <CardDescription>Important trends and issues among VIP customers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vipAnalytics?.high_value_insights?.slice(0, 6).map((insight, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-sm">{insight.customer_name}</h4>
                    <Badge variant={insight.satisfaction_trend === 'declining' ? 'destructive' : 'default'}>
                      {insight.tier}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-600 mb-2">
                    Recent issues: {insight.recent_issues.join(', ')}
                  </div>
                  <div className="space-y-1">
                    {insight.recommended_actions.slice(0, 2).map((action, i) => (
                      <div key={i} className="text-xs bg-blue-50 text-blue-700 p-1 rounded">
                        • {action}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </TabsContent>

    {/* Forecasts Tab */}
    <TabsContent value="forecasts" className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Volume Forecast */}
        <Card>
          <CardHeader>
            <CardTitle>7-Day Volume Forecast</CardTitle>
            <CardDescription>Predicted ticket volume with confidence intervals</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={operationalIntelligence?.predicted_volume}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="predicted" stroke="#8884d8" name="Predicted Volume" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Satisfaction Forecast */}
        <Card>
          <CardHeader>
            <CardTitle>Satisfaction Forecast</CardTitle>
            <CardDescription>Predicted customer satisfaction trends</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={satisfactionAnalytics?.predictions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="prediction_date" />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="predicted_csat" stroke="#82ca9d" name="Predicted CSAT" />
                <Line type="monotone" dataKey="predicted_nps" stroke="#8884d8" name="Predicted NPS" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Risk Factors */}
        <Card>
          <CardHeader>
            <CardTitle>Potential Risk Factors</CardTitle>
            <CardDescription>Factors that may impact future performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {satisfactionAnalytics?.predictions?.[0]?.risk_factors?.map((risk, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 bg-red-50 rounded">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span className="text-sm">{risk}</span>
                </div>
              )) || (
                <div className="text-sm text-gray-600">No significant risk factors identified</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Improvement Opportunities */}
        <Card>
          <CardHeader>
            <CardTitle>Improvement Opportunities</CardTitle>
            <CardDescription>Areas with potential for performance enhancement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {satisfactionAnalytics?.predictions?.[0]?.improvement_opportunities?.map((opportunity, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 bg-green-50 rounded">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">{opportunity}</span>
                </div>
              )) || (
                <div className="text-sm text-gray-600">Focus on maintaining current performance levels</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </TabsContent>
  </Tabs>
</div>
);
};

export default SupportExecutiveDashboard;