import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Users, MessageSquare, Brain, Calendar, Download, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { aiAnalyticsService, type AIUsageAnalytics } from '@/integrations/ai/analytics';


export function AIUsageDashboard() {
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [analytics, setAnalytics] = useState<AIUsageAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchAnalytics, 60000); // Refresh every minute
      return () => clearInterval(interval);
    }
  }, [autoRefresh, dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await aiAnalyticsService.getUsageAnalytics(
        dateRange.from.toISOString(),
        dateRange.to.toISOString()
      );
      setAnalytics(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async () => {
    try {
      const report = await aiAnalyticsService.generateReport(
        dateRange.from.toISOString(),
        dateRange.to.toISOString()
      );

      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-analytics-report-${format(dateRange.from, 'yyyy-MM-dd')}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download report:', err);
    }
  };

  if (loading && !analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalEvents = analytics?.daily_usage.reduce((sum, d) => sum + d.events, 0) || 0;
  const totalCost = analytics?.cost_analysis.monthly_projection || 0;
  const avgSuccessRate = analytics
    ? Object.values(analytics.feature_breakdown).reduce((sum, f) => sum + f.success_rate, 0) /
      Object.keys(analytics.feature_breakdown).length
    : 0;
  const avgQualityScore = analytics?.quality_metrics.average_score || 0;

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Usage Analytics</h2>
          <p className="text-muted-foreground">
            Monitor AI feature usage, costs, and performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={downloadReport}>
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total AI Events</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEvents.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estimated Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Monthly projection
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(avgSuccessRate * 100).toFixed(1)}%</div>
            <Progress value={avgSuccessRate * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quality Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(avgQualityScore * 100).toFixed(0)}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {analytics?.quality_metrics.improvement_trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
              {analytics?.quality_metrics.improvement_trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
              {analytics?.quality_metrics.improvement_trend}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="usage" className="space-y-4">
        <TabsList>
          <TabsTrigger value="usage">Usage Trends</TabsTrigger>
          <TabsTrigger value="features">Feature Breakdown</TabsTrigger>
          <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
          <TabsTrigger value="quality">Quality Metrics</TabsTrigger>
          <TabsTrigger value="users">Top Users</TabsTrigger>
        </TabsList>

        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Usage Trends</CardTitle>
              <CardDescription>AI events and token usage over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analytics?.daily_usage}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="events"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.3}
                    name="Events"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="tokens"
                    stroke="#82ca9d"
                    name="Tokens"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Feature Usage Breakdown</CardTitle>
              <CardDescription>Usage count by AI feature</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={Object.entries(analytics?.feature_breakdown || {}).map(([key, value]) => ({
                  feature: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                  usage: value.usage_count,
                  successRate: value.success_rate * 100,
                  avgTime: value.avg_processing_time,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="feature" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="usage" fill="#8884d8" name="Usage Count" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Daily Cost Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={analytics?.daily_usage}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                    <Line type="monotone" dataKey="cost" stroke="#ff7300" name="Daily Cost" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost by Feature</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={Object.entries(analytics?.cost_analysis.cost_per_feature || {}).map(([key, value]) => ({
                        name: key.replace(/_/g, ' '),
                        value: value,
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {Object.entries(analytics?.cost_analysis.cost_per_feature || {}).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="quality" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Quality Score Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Current Average</span>
                    <Badge variant={avgQualityScore > 0.8 ? 'default' : avgQualityScore > 0.6 ? 'secondary' : 'destructive'}>
                      {(avgQualityScore * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  <Progress value={avgQualityScore * 100} />
                  <p className="text-sm text-muted-foreground">
                    Trend: {analytics?.quality_metrics.improvement_trend}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Common Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics?.quality_metrics.common_issues.slice(0, 5).map((issue, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="truncate">{issue.issue}</span>
                      <Badge variant="outline">{issue.frequency}</Badge>
                    </div>
                  ))}
                  {analytics?.quality_metrics.common_issues.length === 0 && (
                    <p className="text-sm text-muted-foreground">No issues reported</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Users by Usage</CardTitle>
              <CardDescription>Most active AI feature users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics?.top_users.slice(0, 10).map((user, index) => (
                  <div key={user.user_id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{user.user_id}</p>
                        <p className="text-sm text-muted-foreground">
                          Prefers: {user.feature_preference.replace(/_/g, ' ')}
                        </p>
                      </div>
                    </div>
                    <Badge>{user.usage_count} uses</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Insights and Recommendations */}
      {analytics && (
        <Card>
          <CardHeader>
            <CardTitle>AI Insights & Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2">Key Insights</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Peak usage on weekdays between 9 AM - 5 PM</li>
                  <li>• Content generation is the most used feature</li>
                  <li>• Translation feature has highest success rate</li>
                  <li>• Average response time improving by 15%</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Recommendations</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Consider rate limiting during peak hours</li>
                  <li>• Invest more in content generation features</li>
                  <li>• Improve error handling for low-success features</li>
                  <li>• Implement user feedback collection</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}