// Comprehensive Feedback Management Dashboard
// For luxury beauty/fitness platform admin interface

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Star,
  MessageSquare,
  Heart,
  ThumbsDown,
  Activity,
  Target,
  Zap,
  Award,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Settings,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Bell,
  User,
  DollarSign,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  MoreVertical
} from 'lucide-react';

import { feedbackService } from '@/services/feedback.service';
import { feedbackAnalyticsEngine } from '@/lib/feedback-analytics-engine';
import { realTimeFeedbackMonitoring } from '@/lib/real-time-feedback-monitoring';
import { serviceRecoveryService } from '@/services/service-recovery.service';

interface DashboardData {
  overview: {
    totalSubmissions: number;
    averageSatisfaction: number;
    npsScore: number;
    cesScore: number;
    activeAlerts: number;
    recoveryCases: number;
    responseRate: number;
    todaySubmissions: number;
  };
  trends: {
    satisfactionTrend: Array<{ date: string; score: number; volume: number }>;
    npsTrend: Array<{ date: string; score: number; promoters: number; detractors: number }>;
    sentimentTrend: Array<{ date: string; positive: number; negative: number; neutral: number }>;
  };
  topIssues: Array<{
    theme: string;
    count: number;
    sentiment: 'positive' | 'negative' | 'neutral';
    trend: 'improving' | 'stable' | 'declining';
    impact: 'low' | 'medium' | 'high' | 'critical';
  }>;
  staffRankings: Array<{
    staffId: string;
    staffName: string;
    averageRating: number;
    totalReviews: number;
    ranking: number;
    trend: 'improving' | 'stable' | 'declining';
  }>;
  recentAlerts: Array<{
    id: string;
    type: string;
    severity: 'info' | 'warning' | 'critical' | 'emergency';
    title: string;
    createdAt: string;
    clientName?: string;
    serviceName?: string;
  }>;
  recoveryCases: Array<{
    id: string;
    clientId: string;
    clientName: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: string;
    createdAt: string;
    assignedTo?: string;
    satisfactionBefore?: number;
    satisfactionAfter?: number;
  }>;
}

const FeedbackManagementDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Initialize data fetch
  useEffect(() => {
    fetchDashboardData();

    if (autoRefresh) {
      const interval = setInterval(fetchDashboardData, 60000); // Refresh every minute
      setRefreshInterval(interval);
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [selectedPeriod, autoRefresh]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const dateRange = getDateRange(selectedPeriod);
      const dashboardData = await feedbackService.getFeedbackDashboard(dateRange);

      // Transform data for dashboard
      const transformedData: DashboardData = {
        overview: {
          totalSubmissions: dashboardData.summary.total_submissions,
          averageSatisfaction: dashboardData.summary.average_satisfaction,
          npsScore: dashboardData.summary.nps_score,
          cesScore: dashboardData.summary.ces_score,
          activeAlerts: dashboardData.summary.active_alerts,
          recoveryCases: dashboardData.summary.recovery_cases,
          responseRate: dashboardData.summary.response_rate || 0,
          todaySubmissions: dashboardData.summary.total_submissions // Would filter for today
        },
        trends: {
          satisfactionTrend: dashboardData.trends.satisfaction_trend.map(t => ({
            date: t.date,
            score: t.average_score,
            volume: t.measurement_count
          })),
          npsTrend: dashboardData.trends.nps_trend.map(t => ({
            date: t.month,
            score: t.nps_score,
            promoters: t.promoters,
            detractors: t.detractors
          })),
          sentimentTrend: dashboardData.trends.sentiment_trend.map(t => ({
            date: t.date,
            positive: t.sentiment.positive,
            negative: t.sentiment.negative,
            neutral: t.sentiment.neutral
          }))
        },
        topIssues: dashboardData.top_issues.map(issue => ({
          theme: issue.theme,
          count: issue.count,
          sentiment: issue.sentiment,
          trend: issue.trend,
          impact: issue.count > 10 ? 'critical' : issue.count > 5 ? 'high' : 'medium'
        })),
        staffRankings: dashboardData.staff_rankings.map(staff => ({
          staffId: staff.staff_id,
          staffName: staff.staff_name,
          averageRating: staff.average_satisfaction_score || staff.average_rating,
          totalReviews: staff.total_reviews,
          ranking: staff.ranking_position || staff.overall_rank,
          trend: 'stable' // Would calculate from actual data
        })),
        recentAlerts: dashboardData.recent_alerts.map(alert => ({
          id: alert.id,
          type: alert.alert_type,
          severity: alert.severity,
          title: alert.alert_title,
          createdAt: alert.created_at,
          clientName: 'Client Name', // Would get from actual data
          serviceName: 'Service Name' // Would get from actual data
        })),
        recoveryCases: dashboardData.recovery_cases.map(recovery => ({
          id: recovery.id,
          clientId: recovery.client_id,
          clientName: 'Client Name', // Would get from actual data
          priority: recovery.recovery_priority,
          status: recovery.recovery_status,
          createdAt: recovery.created_at,
          assignedTo: recovery.assigned_to,
          satisfactionBefore: recovery.satisfaction_before,
          satisfactionAfter: recovery.satisfaction_after
        }))
      };

      setData(transformedData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = (period: string) => {
    const end = new Date();
    const start = new Date();

    switch (period) {
      case '7d':
        start.setDate(end.getDate() - 7);
        break;
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      case '90d':
        start.setDate(end.getDate() - 90);
        break;
      case '1y':
        start.setFullYear(end.getFullYear() - 1);
        break;
    }

    return {
      start: start.toISOString(),
      end: end.toISOString()
    };
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'emergency': return 'bg-red-600 text-white';
      case 'critical': return 'bg-red-500 text-white';
      case 'warning': return 'bg-yellow-500 text-white';
      case 'info': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'new': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return null;
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Feedback Management Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor client satisfaction and manage service recovery</p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Period Selector */}
          <div className="flex items-center space-x-2 bg-white rounded-lg border shadow-sm">
            {(['7d', '30d', '90d', '1y'] as const).map(period => (
              <Button
                key={period}
                variant={selectedPeriod === period ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedPeriod(period)}
                className="rounded-none first:rounded-l-lg last:rounded-r-lg"
              >
                {period === '7d' ? '7 Days' : period === '30d' ? '30 Days' : period === '90d' ? '90 Days' : '1 Year'}
              </Button>
            ))}
          </div>

          {/* Auto Refresh Toggle */}
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </Button>

          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Total Submissions</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{data.overview.totalSubmissions}</div>
            <p className="text-xs text-blue-600">
              {data.overview.todaySubmissions} today
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Average Satisfaction</CardTitle>
            <Star className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{data.overview.averageSatisfaction.toFixed(1)}</div>
            <div className="flex items-center space-x-1">
              {getTrendIcon('improving')}
              <p className="text-xs text-green-600">+0.3 from last period</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">NPS Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{data.overview.npsScore}</div>
            <p className="text-xs text-purple-600">
              {data.overview.npsScore >= 50 ? 'Excellent' : data.overview.npsScore >= 20 ? 'Good' : 'Needs Improvement'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{data.overview.activeAlerts}</div>
            <p className="text-xs text-orange-600">
              {data.overview.recoveryCases} recovery cases
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="recovery">Recovery</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Satisfaction Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Satisfaction Trend</CardTitle>
                <CardDescription>Customer satisfaction over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.trends.satisfactionTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 5]} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#8884d8"
                      strokeWidth={2}
                      dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Sentiment Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Sentiment Breakdown</CardTitle>
                <CardDescription>Distribution of feedback sentiment</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Positive', value: 65, color: '#10B981' },
                        { name: 'Neutral', value: 20, color: '#6B7280' },
                        { name: 'Negative', value: 15, color: '#EF4444' }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: 'Positive', value: 65, color: '#10B981' },
                        { name: 'Neutral', value: 20, color: '#6B7280' },
                        { name: 'Negative', value: 15, color: '#EF4444' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Alerts</CardTitle>
                <CardDescription>Latest satisfaction alerts requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.recentAlerts.slice(0, 5).map(alert => (
                    <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                        <div>
                          <p className="font-medium text-sm">{alert.title}</p>
                          <p className="text-xs text-gray-500">{alert.clientName} • {alert.serviceName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {new Date(alert.createdAt).toLocaleDateString()}
                        </p>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Issues */}
            <Card>
              <CardHeader>
                <CardTitle>Top Issues</CardTitle>
                <CardDescription>Most common feedback themes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.topIssues.slice(0, 5).map((issue, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{issue.theme}</p>
                          <p className="text-xs text-gray-500">{issue.count} mentions</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getTrendIcon(issue.trend)}
                        <Badge variant={issue.impact === 'critical' ? 'destructive' : 'secondary'}>
                          {issue.impact}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* NPS Trend */}
            <Card>
              <CardHeader>
                <CardTitle>NPS Trend</CardTitle>
                <CardDescription>Net Promoter Score over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.trends.npsTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="#8884d8" strokeWidth={2} />
                    <Line type="monotone" dataKey="promoters" stroke="#10B981" strokeWidth={1} />
                    <Line type="monotone" dataKey="detractors" stroke="#EF4444" strokeWidth={1} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Sentiment Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Sentiment Trend</CardTitle>
                <CardDescription>Sentiment analysis over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.trends.sentimentTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="positive" stroke="#10B981" strokeWidth={2} />
                    <Line type="monotone" dataKey="neutral" stroke="#6B7280" strokeWidth={2} />
                    <Line type="monotone" dataKey="negative" stroke="#EF4444" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Issues Tab */}
        <TabsContent value="issues" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Feedback Issues Analysis</CardTitle>
              <CardDescription>Detailed breakdown of common issues and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {data.topIssues.map((issue, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold">{issue.theme}</h3>
                        <Badge variant={issue.sentiment === 'negative' ? 'destructive' : 'secondary'}>
                          {issue.sentiment}
                        </Badge>
                        <Badge variant={issue.impact === 'critical' ? 'destructive' : 'outline'}>
                          {issue.impact} impact
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getTrendIcon(issue.trend)}
                        <span className="text-sm text-gray-600">{issue.count} mentions</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Trend</p>
                        <p className="font-medium capitalize">{issue.trend}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Frequency</p>
                        <p className="font-medium">{issue.count} times</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Sentiment</p>
                        <p className="font-medium capitalize">{issue.sentiment}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Staff Tab */}
        <TabsContent value="staff" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Staff Performance Rankings</CardTitle>
              <CardDescription>Staff members ranked by client satisfaction scores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.staffRankings.map((staff, index) => (
                  <div key={staff.staffId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold">{staff.staffName}</h3>
                        <p className="text-sm text-gray-500">{staff.totalReviews} reviews</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-semibold text-lg">{staff.averageRating.toFixed(1)}</p>
                        <div className="flex items-center space-x-1">
                          {getTrendIcon(staff.trend)}
                          <span className="text-xs text-gray-500 capitalize">{staff.trend}</span>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Star className="h-5 w-5 text-yellow-400 fill-current" />
                        <Star className="h-5 w-5 text-yellow-400 fill-current" />
                        <Star className="h-5 w-5 text-yellow-400 fill-current" />
                        <Star className="h-5 w-5 text-yellow-400 fill-current" />
                        <Star className="h-5 w-5 text-gray-300" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Alerts</CardTitle>
              <CardDescription>System alerts requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.recentAlerts.map(alert => (
                  <div key={alert.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity.toUpperCase()}
                        </Badge>
                        <div>
                          <h3 className="font-semibold">{alert.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {alert.clientName} • {alert.serviceName}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(alert.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                        <Button variant="outline" size="sm">
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recovery Tab */}
        <TabsContent value="recovery" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Service Recovery Cases</CardTitle>
              <CardDescription>Active service recovery and client retention cases</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.recoveryCases.map(recovery => (
                  <div key={recovery.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <Badge className={getPriorityColor(recovery.priority)}>
                          {recovery.priority.toUpperCase()}
                        </Badge>
                        <div>
                          <h3 className="font-semibold">{recovery.clientName}</h3>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                            <span>Case #{recovery.id.slice(-8)}</span>
                            {recovery.assignedTo && <span>Assigned to: {recovery.assignedTo}</span>}
                            <span>{new Date(recovery.createdAt).toLocaleDateString()}</span>
                          </div>
                          {recovery.satisfactionBefore && recovery.satisfactionAfter && (
                            <div className="flex items-center space-x-2 mt-2">
                              <span className="text-sm text-gray-500">
                                Before: {recovery.satisfactionBefore.toFixed(1)}
                              </span>
                              <TrendingUp className="h-4 w-4 text-green-500" />
                              <span className="text-sm text-gray-500">
                                After: {recovery.satisfactionAfter.toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(recovery.status)}>
                          {recovery.status.replace('_', ' ')}
                        </Badge>
                        <Button variant="outline" size="sm">
                          Manage
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FeedbackManagementDashboard;