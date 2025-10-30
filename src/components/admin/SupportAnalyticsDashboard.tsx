import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
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
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Smile,
  MessageSquare,
  Phone,
  Mail,
  Instagram,
  Target,
  Activity,
  Calendar,
  Filter,
  Download,
  Bell,
  Settings,
  Zap,
  Star,
  BarChart3,
  PieChart as PieChartIcon,
  AlertCircle,
  ThumbsUp,
  Timer,
  UserCheck,
  RefreshCw
} from 'lucide-react';
import { supportAnalyticsServiceEnhanced } from '@/services/support-analytics-enhanced.service';
import {
  SupportMetrics,
  AgentPerformance,
  ChannelEffectiveness,
  PerformanceAlert,
  AnalyticsFilters,
  TrendData
} from '@/services/support-analytics-enhanced.service';

interface DashboardData {
  metrics: {
    totalTickets: number;
    resolvedTickets: number;
    avgResponseTime: number;
    avgResolutionTime: number;
    satisfactionScore: number;
    slaComplianceRate: number;
    agentUtilizationRate: number;
    firstContactResolutionRate: number;
    escalationRate: number;
  };
  trends: {
    tickets: TrendData[];
    responseTime: TrendData[];
    satisfaction: TrendData[];
  };
  topAgents: AgentPerformance[];
  channelPerformance: ChannelEffectiveness[];
  alerts: PerformanceAlert[];
}

const COLORS = ['#8B4513', '#F5DEB3', '#CD853F', '#DEB887', '#D2691E', '#BC8F8F', '#F4A460', '#DAA520'];

export const SupportAnalyticsDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  // Generate date range based on selection
  const getDateRange = (range: string) => {
    const end = new Date();
    const start = new Date();

    switch (range) {
      case '24h':
        start.setHours(start.getHours() - 24);
        break;
      case '7d':
        start.setDate(start.getDate() - 7);
        break;
      case '30d':
        start.setDate(start.getDate() - 30);
        break;
      case '90d':
        start.setDate(start.getDate() - 90);
        break;
      default:
        start.setDate(start.getDate() - 7);
    }

    return { start, end };
  };

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const dateRange = getDateRange(selectedTimeRange);

      const filters: AnalyticsFilters = {
        dateRange,
        channels: selectedChannel !== 'all' ? [selectedChannel] : undefined,
      };

      const data = await supportAnalyticsServiceEnhanced.getDashboardData(filters);
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchDashboardData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, selectedTimeRange, selectedChannel]);

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
  }, [selectedTimeRange, selectedChannel]);

  // Format time for display
  const formatTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  // Get trend indicator
  const getTrendIndicator = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change),
      isPositive: change >= 0,
      icon: change >= 0 ? TrendingUp : TrendingDown
    };
  };

  // Get alert severity color
  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  if (isLoading && !dashboardData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B4513]"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#8B4513]">Support Analytics Dashboard</h1>
          <p className="text-muted-foreground">Real-time performance metrics and insights</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Auto-refresh toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="auto-refresh"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="auto-refresh" className="text-sm">Auto-refresh</label>
          </div>

          {/* Time range selector */}
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

          {/* Channel filter */}
          <select
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="all">All Channels</option>
            <option value="email">Email</option>
            <option value="chat">Chat</option>
            <option value="phone">Phone</option>
            <option value="social">Social</option>
          </select>

          <Button variant="outline" onClick={fetchDashboardData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Performance Alerts */}
      {dashboardData.alerts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Active Alerts
          </h2>
          <div className="grid gap-3">
            {dashboardData.alerts.slice(0, 3).map((alert) => (
              <Alert key={alert.id} variant={getAlertSeverityColor(alert.alert_severity) as any}>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="flex items-center justify-between">
                  <span>{alert.alert_title}</span>
                  <Badge variant={getAlertSeverityColor(alert.alert_severity) as any}>
                    {alert.alert_severity.toUpperCase()}
                  </Badge>
                </AlertTitle>
                <AlertDescription>{alert.alert_description}</AlertDescription>
              </Alert>
            ))}
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Tickets */}
        <Card className="border-[#8B4513]/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <MessageSquare className="h-4 w-4 text-[#8B4513]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.metrics.totalTickets}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.metrics.resolvedTickets} resolved
            </p>
            <div className="mt-2">
              <Progress
                value={(dashboardData.metrics.resolvedTickets / dashboardData.metrics.totalTickets) * 100}
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Average Response Time */}
        <Card className="border-[#8B4513]/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-[#8B4513]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(dashboardData.metrics.avgResponseTime)}</div>
            <p className="text-xs text-muted-foreground">
              Target: &lt;30 min
            </p>
            <Badge
              variant={dashboardData.metrics.avgResponseTime <= 30 ? "default" : "destructive"}
              className="mt-2"
            >
              {dashboardData.metrics.avgResponseTime <= 30 ? 'On Target' : 'Below Target'}
            </Badge>
          </CardContent>
        </Card>

        {/* Customer Satisfaction */}
        <Card className="border-[#8B4513]/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer Satisfaction</CardTitle>
            <Smile className="h-4 w-4 text-[#8B4513]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.metrics.satisfactionScore.toFixed(1)}/5.0</div>
            <p className="text-xs text-muted-foreground">
              Last {selectedTimeRange}
            </p>
            <div className="flex items-center mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= Math.round(dashboardData.metrics.satisfactionScore)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* SLA Compliance */}
        <Card className="border-[#8B4513]/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SLA Compliance</CardTitle>
            <Target className="h-4 w-4 text-[#8B4513]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.metrics.slaComplianceRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Target: 95%
            </p>
            <div className="mt-2">
              <Progress
                value={dashboardData.metrics.slaComplianceRate}
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ticket Volume Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-[#8B4513]" />
                  Ticket Volume Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={dashboardData.trends.tickets}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#8B4513"
                      fill="#F5DEB3"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Satisfaction Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smile className="h-5 w-5 text-[#8B4513]" />
                  Customer Satisfaction Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dashboardData.trends.satisfaction}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 5]} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#8B4513"
                      strokeWidth={3}
                      dot={{ fill: '#8B4513', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="h-5 w-5 text-[#8B4513]" />
                  Resolution Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatTime(dashboardData.metrics.avgResolutionTime)}</div>
                <p className="text-sm text-muted-foreground">Average time to resolve</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#8B4513]" />
                  Agent Utilization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.metrics.agentUtilizationRate.toFixed(1)}%</div>
                <p className="text-sm text-muted-foreground">Agent productivity</p>
                <Progress value={dashboardData.metrics.agentUtilizationRate} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-[#8B4513]" />
                  First Contact Resolution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.metrics.firstContactResolutionRate.toFixed(1)}%</div>
                <p className="text-sm text-muted-foreground">Resolved on first contact</p>
                <Progress value={dashboardData.metrics.firstContactResolutionRate} className="mt-2" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Response Time Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Response Time Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dashboardData.trends.responseTime}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#8B4513"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Combined Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Combined Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="value"
                      data={dashboardData.trends.tickets}
                      stroke="#8B4513"
                      strokeWidth={2}
                      name="Tickets"
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      data={dashboardData.trends.satisfaction}
                      stroke="#22c55e"
                      strokeWidth={2}
                      name="Satisfaction"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Agents Tab */}
        <TabsContent value="agents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-[#8B4513]" />
                Top Performing Agents
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardData.topAgents.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.topAgents.map((agent, index) => (
                    <div key={agent.agent_id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 bg-[#8B4513] text-white rounded-full">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{agent.agent_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {agent.total_resolutions} resolutions
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{agent.avg_satisfaction.toFixed(1)}/5.0</p>
                        <p className="text-sm text-muted-foreground">Avg satisfaction</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No agent data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Channels Tab */}
        <TabsContent value="channels" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Channel Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-[#8B4513]" />
                  Channel Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardData.channelPerformance.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={dashboardData.channelPerformance.map(cp => ({
                          name: cp.channel,
                          value: cp.total_conversations
                        }))}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label
                      >
                        {dashboardData.channelPerformance.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No channel data available</p>
                )}
              </CardContent>
            </Card>

            {/* Channel Details */}
            <Card>
              <CardHeader>
                <CardTitle>Channel Details</CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardData.channelPerformance.length > 0 ? (
                  <div className="space-y-4">
                    {dashboardData.channelPerformance.map((channel) => (
                      <div key={channel.channel} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {channel.channel === 'email' && <Mail className="h-4 w-4" />}
                            {channel.channel === 'chat' && <MessageSquare className="h-4 w-4" />}
                            {channel.channel === 'phone' && <Phone className="h-4 w-4" />}
                            {channel.channel === 'social' && <Instagram className="h-4 w-4" />}
                            <span className="font-medium capitalize">{channel.channel}</span>
                          </div>
                          <Badge>{channel.resolution_rate.toFixed(1)}% success</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Conversations</p>
                            <p className="font-medium">{channel.total_conversations}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Avg Response</p>
                            <p className="font-medium">{formatTime(channel.avg_response_time)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No channel data available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SupportAnalyticsDashboard;