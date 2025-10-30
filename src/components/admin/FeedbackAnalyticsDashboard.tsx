import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  MessageSquare,
  Star,
  Users,
  BarChart3,
  PieChart,
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle,
  Filter,
  Download,
  RefreshCw,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Target,
  Zap,
  Calendar
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, AreaChart, Area } from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast aria-live="polite" aria-atomic="true"';
import { useFeedbackAnalytics, useFeedback, useNPSSurvey } from '@/hooks/useFeedback';
import { cn } from '@/lib/utils';

interface FeedbackAnalytics {
  totalEntries: number;
  averageRating: number;
  responseRate: number;
  resolutionTime: number;
  satisfactionScore: number;
}

interface TopIssue {
  category: string;
  count: number;
  avgRating: number;
  sentiment: string;
}

interface FeedbackTrends {
  daily: Array<{ date: string; count: number; rating: number }>;
  weekly: Array<{ week: string; count: number; rating: number }>;
  monthly: Array<{ month: string; count: number; rating: number }>;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#84CC16'];

const sentimentColors = {
  positive: '#10B981',
  neutral: '#F59E0B',
  negative: '#EF4444',
  mixed: '#8B5CF6',
};

const priorityColors = {
  low: '#06B6D4',
  medium: '#F59E0B',
  high: '#EF4444',
  urgent: '#DC2626',
  critical: '#7C2D12',
};

export const FeedbackAnalyticsDashboard: React.FC = () => {
  const { toast aria-live="polite" aria-atomic="true" } = useToast();
  const { analytics, loading: analyticsLoading, refresh: refreshAnalytics, getSummaryStats } = useFeedbackAnalytics('month');
  const { feedback } = useFeedback();
  const { getNPSScore } = useNPSSurvey();

  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'quarter'>('month');
  const [activeTab, setActiveTab] = useState('overview');
  const [npsData, setNpsData] = useState<any>(null);
  const [topIssues, setTopIssues] = useState<TopIssue[]>([]);
  const [trends, setTrends] = useState<FeedbackTrends>({ daily: [], weekly: [], monthly: [] });
  const [breakdown, setBreakdown] = useState<any>({});

  useEffect(() => {
    loadAnalyticsData();
  }, [timeframe]);

  const loadAnalyticsData = async () => {
    try {
      // Load NPS data
      const nps = await getNPSScore(timeframe);
      setNpsData(nps);

      // Generate mock data for demonstration (in production, this would come from the analytics API)
      generateMockData();

    } catch (error: any) {
      toast aria-live="polite" aria-atomic="true"({
        title: 'Error',
        description: error.message || 'Failed to load analytics data',
        variant: 'destructive',
      });
    }
  };

  const generateMockData = () => {
    // Mock top issues
    const mockTopIssues: TopIssue[] = [
      { category: 'Customer Service', count: 45, avgRating: 3.2, sentiment: 'negative' },
      { category: 'Technical Issues', count: 32, avgRating: 2.8, sentiment: 'negative' },
      { category: 'Booking Process', count: 28, avgRating: 4.1, sentiment: 'neutral' },
      { category: 'Service Quality', count: 67, avgRating: 4.7, sentiment: 'positive' },
      { category: 'Cleanliness', count: 23, avgRating: 4.8, sentiment: 'positive' },
    ];

    // Mock trends
    const mockTrends: FeedbackTrends = {
      daily: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        count: Math.floor(Math.random() * 10) + 2,
        rating: Math.random() * 2 + 3,
      })),
      weekly: Array.from({ length: 12 }, (_, i) => ({
        week: `Week ${i + 1}`,
        count: Math.floor(Math.random() * 50) + 20,
        rating: Math.random() * 1.5 + 3.5,
      })),
      monthly: Array.from({ length: 6 }, (_, i) => ({
        month: new Date(Date.now() - (5 - i) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short' }),
        count: Math.floor(Math.random() * 200) + 100,
        rating: Math.random() * 1 + 4,
      })),
    };

    // Mock breakdown
    const mockBreakdown = {
      byType: {
        'service_rating': 156,
        'post_booking_review': 89,
        'bug_report': 34,
        'feature_request': 23,
        'general_feedback': 45,
      },
      byStatus: {
        'pending': 23,
        'in_review': 45,
        'addressed': 67,
        'resolved': 156,
        'dismissed': 12,
      },
      byPriority: {
        'low': 89,
        'medium': 145,
        'high': 56,
        'urgent': 23,
        'critical': 8,
      },
      bySentiment: {
        'positive': 234,
        'neutral': 67,
        'negative': 45,
        'mixed': 23,
      },
    };

    setTopIssues(mockTopIssues);
    setTrends(mockTrends);
    setBreakdown(mockBreakdown);
  };

  const summaryStats = getSummaryStats() || {
    totalEntries: 369,
    averageRating: 4.2,
    responseRate: 87.5,
    resolutionTime: 12.5,
    satisfactionScore: 84.2,
  };

  const handleExport = () => {
    toast aria-live="polite" aria-atomic="true"({
      title: 'Export Started',
      description: 'Your analytics data is being prepared for download.',
    });
  };

  const handleRefresh = () => {
    refreshAnalytics();
    loadAnalyticsData();
    toast aria-live="polite" aria-atomic="true"({
      title: 'Data Refreshed',
      description: 'Analytics data has been updated.',
    });
  };

  const StatCard = ({ title, value, icon: Icon, trend, color = 'blue' }: {
    title: string;
    value: string | number;
    icon: any;
    trend?: { value: number; direction: 'up' | 'down' };
    color?: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <Icon className={cn('w-4 h-4', `text-${color}-600`)} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <div className={cn(
            'flex items-center text-xs',
            trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
          )}>
            {trend.direction === 'up' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
            {trend.value}% from last period
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Feedback Analytics</h2>
          <p className="text-gray-600">Monitor and analyze customer feedback across all channels</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeframe} onValueChange={(value: any) => setTimeframe(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Feedback"
          value={summaryStats.totalEntries}
          icon={MessageSquare}
          trend={{ value: 12, direction: 'up' }}
          color="blue"
        />
        <StatCard
          title="Average Rating"
          value={summaryStats.averageRating.toFixed(1)}
          icon={Star}
          trend={{ value: 5, direction: 'up' }}
          color="yellow"
        />
        <StatCard
          title="Response Rate"
          value={`${summaryStats.responseRate}%`}
          icon={Users}
          trend={{ value: 8, direction: 'up' }}
          color="green"
        />
        <StatCard
          title="Avg Resolution Time"
          value={`${summaryStats.resolutionTime}h`}
          icon={Clock}
          trend={{ value: 15, direction: 'down' }}
          color="orange"
        />
        <StatCard
          title="Satisfaction Score"
          value={`${summaryStats.satisfactionScore}%`}
          icon={Target}
          trend={{ value: 3, direction: 'up' }}
          color="purple"
        />
      </div>

      {/* NPS Score */}
      {npsData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              Net Promoter Score (NPS)
            </CardTitle>
            <CardDescription>
              Customer loyalty and satisfaction metric based on {npsData.totalResponses} responses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className={cn(
                  'text-4xl font-bold',
                  npsData.score >= 50 ? 'text-green-600' :
                  npsData.score >= 0 ? 'text-yellow-600' : 'text-red-600'
                )}>
                  {npsData.score}
                </div>
                <div className="text-sm text-gray-600">NPS Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{npsData.promoters.toFixed(0)}%</div>
                <div className="text-sm text-gray-600">Promoters</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{npsData.passives.toFixed(0)}%</div>
                <div className="text-sm text-gray-600">Passives</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{npsData.detractors.toFixed(0)}%</div>
                <div className="text-sm text-gray-600">Detractors</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="issues">Top Issues</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Feedback Volume Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Feedback Volume</CardTitle>
                <CardDescription>Daily feedback submissions over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={trends.daily}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="count" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Rating Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Rating Distribution</CardTitle>
                <CardDescription>Distribution of customer ratings</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { rating: '5 Stars', count: 145 },
                    { rating: '4 Stars', count: 89 },
                    { rating: '3 Stars', count: 67 },
                    { rating: '2 Stars', count: 34 },
                    { rating: '1 Star', count: 23 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="rating" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Feedback */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Feedback</CardTitle>
              <CardDescription>Latest customer feedback entries</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {feedback.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{item.title}</div>
                      <div className="text-sm text-gray-600 line-clamp-1">{item.content}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{item.feedback_type}</Badge>
                        <Badge variant={item.status === 'resolved' ? 'default' : 'secondary'}>
                          {item.status}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {item.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{item.rating}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Trends</CardTitle>
                <CardDescription>Feedback volume and ratings over months</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trends.monthly}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Line yAxisId="left" type="monotone" dataKey="count" stroke="#3B82F6" name="Volume" />
                    <Line yAxisId="right" type="monotone" dataKey="rating" stroke="#10B981" name="Rating" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Weekly Patterns */}
            <Card>
              <CardHeader>
                <CardTitle>Weekly Patterns</CardTitle>
                <CardDescription>Feedback patterns by week</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={trends.weekly}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* By Type */}
            <Card>
              <CardHeader>
                <CardTitle>Feedback by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={Object.entries(breakdown.byType || {}).map(([key, value]) => ({
                        name: key.replace('_', ' '),
                        value: value as number,
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {Object.keys(breakdown.byType || {}).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* By Status */}
            <Card>
              <CardHeader>
                <CardTitle>Feedback by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={Object.entries(breakdown.byStatus || {}).map(([key, value]) => ({
                    status: key,
                    count: value as number,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* By Priority */}
            <Card>
              <CardHeader>
                <CardTitle>Feedback by Priority</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(breakdown.byPriority || {}).map(([priority, count]) => (
                    <div key={priority} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: priorityColors[priority as keyof typeof priorityColors] }}
                        />
                        <span className="capitalize">{priority}</span>
                      </div>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* By Sentiment */}
            <Card>
              <CardHeader>
                <CardTitle>Sentiment Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={Object.entries(breakdown.bySentiment || {}).map(([key, value]) => ({
                        name: key,
                        value: value as number,
                      }))}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {Object.keys(breakdown.bySentiment || {}).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={sentimentColors[entry as keyof typeof sentimentColors]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="issues" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Issues & Categories</CardTitle>
              <CardDescription>Most frequently mentioned issues and their sentiment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topIssues.map((issue, index) => (
                  <div key={issue.category} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full text-blue-600 font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{issue.category}</div>
                        <div className="text-sm text-gray-600">
                          {issue.count} mentions • Avg rating: {issue.avgRating.toFixed(1)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={issue.sentiment === 'positive' ? 'default' :
                                  issue.sentiment === 'negative' ? 'destructive' : 'secondary'}
                      >
                        {issue.sentiment}
                      </Badge>
                      <div className="flex items-center gap-1">
                        {issue.avgRating >= 4 ? (
                          <ThumbsUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <ThumbsDown className="w-4 h-4 text-red-600" />
                        )}
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

export default FeedbackAnalyticsDashboard;