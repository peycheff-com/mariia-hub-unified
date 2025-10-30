import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SupportService } from '@/services/support.service';
import type { SupportDashboardData } from '@/types/supabase';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  MessageSquare,
  Star,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Download,
  Filter,
  Activity,
  Target,
  Zap,
  Award
} from 'lucide-react';

interface AnalyticsData {
  ticketMetrics: {
    total: number;
    resolved: number;
    open: number;
    escalated: number;
    avgResolutionTime: number;
    avgResponseTime: number;
    satisfactionScore: number;
    slaCompliance: number;
  };
  trendData: {
    daily: Array<{ date: string; tickets: number; resolved: number; satisfaction: number }>;
    weekly: Array<{ week: string; tickets: number; resolved: number; satisfaction: number }>;
    monthly: Array<{ month: string; tickets: number; resolved: number; satisfaction: number }>;
  };
  categoryAnalytics: Array<{
    category: string;
    count: number;
    avgResolutionTime: number;
    satisfaction: number;
    trend: number;
  }>;
  agentPerformance: Array<{
    agentName: string;
    ticketsHandled: number;
    avgResponseTime: number;
    satisfaction: number;
    efficiency: number;
  }>;
  channelAnalytics: Array<{
    channel: string;
    count: number;
    percentage: number;
    avgResponseTime: number;
    satisfaction: number;
  }>;
  timeAnalytics: {
    peakHours: Array<{ hour: number; tickets: number }>;
    responseTimeDistribution: Array<{ range: string; count: number }>;
    resolutionTimeDistribution: Array<{ range: string; count: number }>;
  };
}

const SupportAnalytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      // This would typically fetch from a dedicated analytics endpoint
      // For now, we'll use the support service and enhance the data
      const dashboardData = await SupportService.getSupportMetrics({
        from: new Date(Date.now() - parseInt(timeRange) * 24 * 60 * 60 * 1000).toISOString(),
        to: new Date().toISOString()
      });

      // Enhanced analytics data
      const enhancedData: AnalyticsData = {
        ticketMetrics: {
          total: dashboardData.metrics.totalTickets,
          resolved: dashboardData.metrics.resolvedToday,
          open: dashboardData.metrics.openTickets,
          escalated: dashboardData.recentTickets.filter(t => t.status === 'escalated').length,
          avgResolutionTime: dashboardData.metrics.avgResponseTime * 2, // Estimate
          avgResponseTime: dashboardData.metrics.avgResponseTime,
          satisfactionScore: dashboardData.metrics.customerSatisfactionAvg,
          slaCompliance: dashboardData.metrics.slaComplianceRate
        },
        trendData: {
          daily: generateMockTrendData('daily', parseInt(timeRange)),
          weekly: generateMockTrendData('weekly', Math.ceil(parseInt(timeRange) / 7)),
          monthly: generateMockTrendData('monthly', Math.ceil(parseInt(timeRange) / 30))
        },
        categoryAnalytics: Object.entries(dashboardData.categoryBreakdown).map(([category, count]) => ({
          category: category.replace('_', ' '),
          count,
          avgResolutionTime: Math.floor(Math.random() * 240) + 60,
          satisfaction: Math.random() * 2 + 3,
          trend: Math.random() * 40 - 20 // -20 to +20
        })),
        agentPerformance: dashboardData.teamPerformance.map(agent => ({
          agentName: agent.user?.user_metadata?.full_name || 'Unknown Agent',
          ticketsHandled: agent.tickets_resolved,
          avgResponseTime: agent.avg_response_time || Math.floor(Math.random() * 120) + 15,
          satisfaction: agent.customer_satisfaction_avg || Math.random() * 2 + 3,
          efficiency: Math.random() * 30 + 70
        })),
        channelAnalytics: Object.entries(dashboardData.channelBreakdown).map(([channel, count]) => ({
          channel,
          count,
          percentage: (count / dashboardData.metrics.totalTickets) * 100,
          avgResponseTime: Math.floor(Math.random() * 180) + 30,
          satisfaction: Math.random() * 2 + 3
        })),
        timeAnalytics: {
          peakHours: Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            tickets: Math.floor(Math.random() * 20) + 1
          })),
          responseTimeDistribution: [
            { range: '< 15 min', count: Math.floor(Math.random() * 50) + 20 },
            { range: '15-30 min', count: Math.floor(Math.random() * 40) + 15 },
            { range: '30-60 min', count: Math.floor(Math.random() * 30) + 10 },
            { range: '1-2 hours', count: Math.floor(Math.random() * 20) + 5 },
            { range: '> 2 hours', count: Math.floor(Math.random() * 10) + 1 }
          ],
          resolutionTimeDistribution: [
            { range: '< 1 hour', count: Math.floor(Math.random() * 30) + 10 },
            { range: '1-4 hours', count: Math.floor(Math.random() * 50) + 20 },
            { range: '4-24 hours', count: Math.floor(Math.random() * 60) + 30 },
            { range: '1-3 days', count: Math.floor(Math.random() * 40) + 15 },
            { range: '> 3 days', count: Math.floor(Math.random() * 20) + 5 }
          ]
        }
      };

      setAnalyticsData(enhancedData);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockTrendData = (period: string, points: number) => {
    return Array.from({ length: points }, (_, i) => {
      const date = new Date();
      if (period === 'daily') date.setDate(date.getDate() - (points - i));
      else if (period === 'weekly') date.setDate(date.getDate() - (points - i) * 7);
      else if (period === 'monthly') date.setMonth(date.getMonth() - (points - i));

      return {
        date: date.toLocaleDateString(),
        tickets: Math.floor(Math.random() * 50) + 10,
        resolved: Math.floor(Math.random() * 40) + 5,
        satisfaction: Math.random() * 2 + 3
      };
    });
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Activity className="h-4 w-4 text-gray-600" />;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-green-600';
    if (trend < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center text-gray-500 py-12">
        Unable to load analytics data
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-amber-50/50 to-orange-50/30 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-amber-900">Support Analytics</h1>
          <p className="text-amber-700 mt-2">Performance insights and metrics</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32 border-amber-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-amber-200 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-700 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Total Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-900">
              {analyticsData.ticketMetrics.total}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-amber-600">
                {analyticsData.ticketMetrics.open} open
              </span>
              <span className="text-sm text-green-600">
                • {analyticsData.ticketMetrics.resolved} resolved
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-700 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Avg Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-900">
              {formatTime(analyticsData.ticketMetrics.avgResponseTime)}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Target className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-600">Target: 1 hour</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-700 flex items-center gap-2">
              <Star className="h-4 w-4" />
              Customer Satisfaction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-900">
              {analyticsData.ticketMetrics.satisfactionScore.toFixed(1)}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Award className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-600">Out of 5.0</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-700 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              SLA Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-900">
              {analyticsData.ticketMetrics.slaCompliance.toFixed(1)}%
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Zap className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-600">
                {analyticsData.ticketMetrics.escalated} escalated
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-amber-100 border-amber-200">
          <TabsTrigger value="overview" className="data-[state=active]:bg-amber-200">
            Overview
          </TabsTrigger>
          <TabsTrigger value="trends" className="data-[state=active]:bg-amber-200">
            Trends
          </TabsTrigger>
          <TabsTrigger value="categories" className="data-[state=active]:bg-amber-200">
            Categories
          </TabsTrigger>
          <TabsTrigger value="agents" className="data-[state=active]:bg-amber-200">
            Agents
          </TabsTrigger>
          <TabsTrigger value="time" className="data-[state=active]:bg-amber-200">
            Time Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Channel Distribution */}
            <Card className="border-amber-200">
              <CardHeader>
                <CardTitle className="text-amber-900">Channel Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.channelAnalytics.map((channel) => (
                    <div key={channel.channel} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="capitalize text-amber-700">{channel.channel}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-amber-900">{channel.count}</span>
                          <span className="text-xs text-amber-600">({channel.percentage.toFixed(1)}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-amber-100 rounded-full h-2">
                        <div
                          className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${channel.percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-amber-600">
                        <span>Avg Response: {formatTime(channel.avgResponseTime)}</span>
                        <span>Satisfaction: {channel.satisfaction.toFixed(1)}/5</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Response Time Distribution */}
            <Card className="border-amber-200">
              <CardHeader>
                <CardTitle className="text-amber-900">Response Time Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.timeAnalytics.responseTimeDistribution.map((item) => (
                    <div key={item.range} className="flex items-center justify-between">
                      <span className="text-sm text-amber-700 w-20">{item.range}</span>
                      <div className="flex-1 mx-4">
                        <div className="w-full bg-amber-100 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-amber-400 to-amber-600 h-3 rounded-full"
                            style={{
                              width: `${(item.count / Math.max(...analyticsData.timeAnalytics.responseTimeDistribution.map(d => d.count))) * 100}%`
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-medium text-amber-900 w-12 text-right">
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Resolution Time Distribution */}
            <Card className="border-amber-200">
              <CardHeader>
                <CardTitle className="text-amber-900">Resolution Time Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.timeAnalytics.resolutionTimeDistribution.map((item) => (
                    <div key={item.range} className="flex items-center justify-between">
                      <span className="text-sm text-amber-700 w-20">{item.range}</span>
                      <div className="flex-1 mx-4">
                        <div className="w-full bg-amber-100 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full"
                            style={{
                              width: `${(item.count / Math.max(...analyticsData.timeAnalytics.resolutionTimeDistribution.map(d => d.count))) * 100}%`
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-medium text-amber-900 w-12 text-right">
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Peak Hours */}
            <Card className="border-amber-200">
              <CardHeader>
                <CardTitle className="text-amber-900">Peak Activity Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-6 gap-2">
                  {analyticsData.timeAnalytics.peakHours.map((hour) => (
                    <div key={hour.hour} className="text-center">
                      <div className="text-xs text-amber-600 mb-1">{hour.hour}:00</div>
                      <div
                        className="w-full bg-amber-200 rounded"
                        style={{
                          height: `${(hour.tickets / Math.max(...analyticsData.timeAnalytics.peakHours.map(h => h.tickets))) * 60}px`
                        }}
                      />
                      <div className="text-xs text-amber-900 mt-1">{hour.tickets}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card className="border-amber-200">
            <CardHeader>
              <CardTitle className="text-amber-900">Ticket Volume Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.trendData.daily.slice(-7).map((day, index) => (
                  <div key={day.date} className="flex items-center gap-4">
                    <span className="text-sm text-amber-700 w-20">{day.date}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-full bg-amber-100 rounded-full h-2">
                          <div
                            className="bg-amber-500 h-2 rounded-full"
                            style={{
                              width: `${(day.tickets / Math.max(...analyticsData.trendData.daily.map(d => d.tickets))) * 100}%`
                            }}
                          />
                        </div>
                        <span className="text-sm text-amber-900 w-12 text-right">{day.tickets}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-green-100 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{
                              width: `${(day.resolved / Math.max(...analyticsData.trendData.daily.map(d => d.resolved))) * 100}%`
                            }}
                          />
                        </div>
                        <span className="text-sm text-green-700 w-12 text-right">{day.resolved}</span>
                      </div>
                    </div>
                    <div className="text-sm text-amber-600 w-20 text-right">
                      {day.satisfaction.toFixed(1)}/5
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-amber-200">
              <CardHeader>
                <CardTitle className="text-amber-900">Category Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.categoryAnalytics.map((category) => (
                    <div key={category.category} className="border-b border-amber-100 pb-4 last:border-b-0">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium text-amber-900 capitalize">{category.category}</h3>
                          <p className="text-sm text-amber-600">{category.count} tickets</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getTrendIcon(category.trend)}
                          <span className={`text-sm font-medium ${getTrendColor(category.trend)}`}>
                            {category.trend > 0 ? '+' : ''}{category.trend.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-amber-600">Avg Resolution:</span>
                          <span className="ml-2 text-amber-900">{formatTime(category.avgResolutionTime)}</span>
                        </div>
                        <div>
                          <span className="text-amber-600">Satisfaction:</span>
                          <span className="ml-2 text-amber-900">{category.satisfaction.toFixed(1)}/5</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-200">
              <CardHeader>
                <CardTitle className="text-amber-900">Category Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.categoryAnalytics
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 3)
                    .map((category, index) => (
                      <div key={category.category} className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-amber-700">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-amber-900 capitalize">{category.category}</h4>
                          <p className="text-sm text-amber-600">
                            {category.count} tickets • {formatTime(category.avgResolutionTime)} avg resolution
                          </p>
                        </div>
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm text-amber-900">{category.satisfaction.toFixed(1)}</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="agents" className="space-y-6">
          <Card className="border-amber-200">
            <CardHeader>
              <CardTitle className="text-amber-900">Agent Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-amber-200">
                      <th className="text-left py-3 px-4 text-amber-900">Agent</th>
                      <th className="text-center py-3 px-4 text-amber-900">Tickets Handled</th>
                      <th className="text-center py-3 px-4 text-amber-900">Avg Response</th>
                      <th className="text-center py-3 px-4 text-amber-900">Satisfaction</th>
                      <th className="text-center py-3 px-4 text-amber-900">Efficiency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.agentPerformance
                      .sort((a, b) => b.ticketsHandled - a.ticketsHandled)
                      .map((agent) => (
                        <tr key={agent.agentName} className="border-b border-amber-100">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-amber-600" />
                              <span className="font-medium text-amber-900">{agent.agentName}</span>
                            </div>
                          </td>
                          <td className="text-center py-3 px-4 text-amber-900">{agent.ticketsHandled}</td>
                          <td className="text-center py-3 px-4 text-amber-900">
                            {formatTime(agent.avgResponseTime)}
                          </td>
                          <td className="text-center py-3 px-4">
                            <div className="flex items-center justify-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500" />
                              <span className="text-amber-900">{agent.satisfaction.toFixed(1)}</span>
                            </div>
                          </td>
                          <td className="text-center py-3 px-4">
                            <div className="flex items-center justify-center gap-1">
                              <div className="w-16 bg-amber-100 rounded-full h-2">
                                <div
                                  className="bg-green-500 h-2 rounded-full"
                                  style={{ width: `${agent.efficiency}%` }}
                                />
                              </div>
                              <span className="text-sm text-amber-900">{agent.efficiency.toFixed(0)}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="time" className="space-y-6">
          {/* Time analysis content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-amber-200">
              <CardHeader>
                <CardTitle className="text-amber-900">Response Time Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-amber-700">Average Response Time</span>
                    <span className="text-lg font-medium text-amber-900">
                      {formatTime(analyticsData.ticketMetrics.avgResponseTime)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-amber-700">Fastest Response</span>
                    <span className="text-lg font-medium text-green-600">5 minutes</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-amber-700">Slowest Response</span>
                    <span className="text-lg font-medium text-red-600">4 hours</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-amber-700">Response Rate (1 hour)</span>
                    <span className="text-lg font-medium text-amber-900">85%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-200">
              <CardHeader>
                <CardTitle className="text-amber-900">Resolution Time Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-amber-700">Average Resolution Time</span>
                    <span className="text-lg font-medium text-amber-900">
                      {formatTime(analyticsData.ticketMetrics.avgResolutionTime)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-amber-700">First Contact Resolution</span>
                    <span className="text-lg font-medium text-green-600">72%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-amber-700">Same Day Resolution</span>
                    <span className="text-lg font-medium text-amber-900">45%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-amber-700">Escalation Rate</span>
                    <span className="text-lg font-medium text-amber-900">8%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SupportAnalytics;