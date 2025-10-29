import { useState, useEffect } from "react";
import { addDays, format } from "date-fns";
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
  ResponsiveContainer
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  Zap,
  Clock,
  Users,
  Target,
  BarChart3,
  Download,
  RefreshCw,
  Activity,
  AlertTriangle,
  CheckCircle,
  Settings
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

interface AnalyticsData {
  overview: {
    totalGenerations: number;
    totalTokens: number;
    totalCost: number;
    avgQualityScore: number;
    avgSeoScore: number;
    activeUsers: number;
    mostUsedType: string;
    successRate: number;
  };
  dailyUsage: Array<{
    date: string;
    generations: number;
    tokens: number;
    cost: number;
    users: number;
  }>;
  contentTypeStats: Array<{
    type: string;
    count: number;
    avgQuality: number;
    avgTokens: number;
  }>;
  userActivity: Array<{
    userId: string;
    userName: string;
    generations: number;
    tokens: number;
    cost: number;
    lastActive: string;
  }>;
  performanceMetrics: {
    avgResponseTime: number;
    errorRate: number;
    rateLimitHits: number;
    cacheHitRate: number;
  };
  costBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
}

const AIAnalyticsDashboard = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: addDays(new Date(), -30),
    to: new Date()
  });
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [refreshing, setRefreshing] = useState(false);

  // Load analytics data
  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      // Fetch AI usage events
      const { data: usageEvents, error } = await supabase
        .from('ai_usage_events')
        .select('*')
        .gte('timestamp', dateRange.from.toISOString())
        .lte('timestamp', dateRange.to.toISOString())
        .order('timestamp', { ascending: true });

      if (error) throw error;

      // Process data (in real implementation, this would be more sophisticated)
      const processedData: AnalyticsData = {
        overview: {
          totalGenerations: usageEvents?.length || 0,
          totalTokens: 0, // Calculate from events
          totalCost: 0, // Calculate from events
          avgQualityScore: 85, // Calculate from generated content
          avgSeoScore: 82, // Calculate from generated content
          activeUsers: 5, // Calculate unique users
          mostUsedType: 'blog', // Most common content type
          successRate: 95 // Calculate from events
        },
        dailyUsage: generateDailyUsageData(),
        contentTypeStats: [
          { type: 'Blog Posts', count: 45, avgQuality: 87, avgTokens: 1200 },
          { type: 'Service Descriptions', count: 32, avgQuality: 92, avgTokens: 800 },
          { type: 'Email Templates', count: 28, avgQuality: 85, avgTokens: 600 },
          { type: 'Social Media', count: 51, avgQuality: 83, avgTokens: 300 }
        ],
        userActivity: [
          { userId: '1', userName: 'Admin User', generations: 25, tokens: 15000, cost: 2.50, lastActive: '2024-01-15' },
          { userId: '2', userName: 'Content Manager', generations: 18, tokens: 12000, cost: 2.00, lastActive: '2024-01-14' }
        ],
        performanceMetrics: {
          avgResponseTime: 2.3,
          errorRate: 2.1,
          rateLimitHits: 5,
          cacheHitRate: 78
        },
        costBreakdown: [
          { category: 'Blog Generation', amount: 12.50, percentage: 45 },
          { category: 'Service Descriptions', amount: 8.30, percentage: 30 },
          { category: 'Content Improvement', amount: 4.20, percentage: 15 },
          { category: 'Other', amount: 2.70, percentage: 10 }
        ]
      };

      setData(processedData);
    } catch (error) {
      logger.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateDailyUsageData = () => {
    const data = [];
    for (let i = 29; i >= 0; i--) {
      const date = addDays(new Date(), -i);
      data.push({
        date: format(date, 'MMM dd'),
        generations: Math.floor(Math.random() * 20) + 5,
        tokens: Math.floor(Math.random() * 10000) + 2000,
        cost: Math.random() * 2 + 0.5,
        users: Math.floor(Math.random() * 5) + 1
      });
    }
    return data;
  };

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    let days = 30;
    switch (period) {
      case '7d': days = 7; break;
      case '30d': days = 30; break;
      case '90d': days = 90; break;
      case '1y': days = 365; break;
    }
    setDateRange({
      from: addDays(new Date(), -days),
      to: new Date()
    });
  };

  const exportData = async () => {
    // Export analytics data to CSV
    logger.info('Exporting analytics data...');
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadAnalyticsData();
    setRefreshing(false);
  };

  const COLORS = ['#8B4513', '#F5DEB3', '#D2691E', '#DEB887'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-primary" />
          <h2 className="text-3xl font-serif">AI Analytics Dashboard</h2>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={refreshData} variant="outline" size="sm" disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={exportData} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Generations</p>
                <p className="text-2xl font-bold">{data.overview.totalGenerations}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-500">+12%</span>
                </div>
              </div>
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
                <p className="text-2xl font-bold">${data.overview.totalCost.toFixed(2)}</p>
                <div className="flex items-center mt-2">
                  <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  <span className="text-sm text-red-500">-5%</span>
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Quality Score</p>
                <p className="text-2xl font-bold">{data.overview.avgQualityScore}/100</p>
                <div className="flex items-center mt-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-500">Good</span>
                </div>
              </div>
              <Target className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">{data.overview.successRate}%</p>
                <div className="flex items-center mt-2">
                  <Activity className="w-4 h-4 text-blue-500 mr-1" />
                  <span className="text-sm text-blue-500">Stable</span>
                </div>
              </div>
              <Zap className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="usage" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="usage">Usage Trends</TabsTrigger>
          <TabsTrigger value="content">Content Analysis</TabsTrigger>
          <TabsTrigger value="users">User Activity</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Usage Trends */}
        <TabsContent value="usage" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Daily Generations</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.dailyUsage}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="generations" stroke="#8B4513" fill="#F5DEB3" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Daily Costs</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.dailyUsage}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="cost" stroke="#8B4513" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cost Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.costBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, percentage }) => `${category}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                    >
                      {data.costBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3">
                  {data.costBreakdown.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        />
                        <span className="text-sm">{item.category}</span>
                      </div>
                      <span className="font-medium">${item.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Analysis */}
        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Type Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data.contentTypeStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="count" fill="#8B4513" name="Generations" />
                  <Bar yAxisId="right" dataKey="avgQuality" fill="#F5DEB3" name="Avg Quality" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Quality Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Excellent (90-100)</span>
                    <Badge>35%</Badge>
                  </div>
                  <Progress value={35} className="h-2" />
                  <div className="flex justify-between">
                    <span>Good (70-89)</span>
                    <Badge>45%</Badge>
                  </div>
                  <Progress value={45} className="h-2" />
                  <div className="flex justify-between">
                    <span>Needs Improvement (50-69)</span>
                    <Badge>15%</Badge>
                  </div>
                  <Progress value={15} className="h-2" />
                  <div className="flex justify-between">
                    <span>Poor (&lt;50)</span>
                    <Badge variant="destructive">5%</Badge>
                  </div>
                  <Progress value={5} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Most Generated Topics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Skincare Tips</span>
                    <span className="font-medium">24</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Permanent Makeup</span>
                    <span className="font-medium">18</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Wellness Routines</span>
                    <span className="font-medium">15</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Beauty Trends</span>
                    <span className="font-medium">12</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* User Activity */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.userActivity.map((user, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium">{user.userName}</p>
                        <p className="text-sm text-muted-foreground">Last active: {user.lastActive}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{user.generations} generations</p>
                      <p className="text-sm text-muted-foreground">${user.cost.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Average</span>
                    <span className="font-medium">{data.performanceMetrics.avgResponseTime}s</span>
                  </div>
                  <Progress value={(data.performanceMetrics.avgResponseTime / 5) * 100} className="h-2" />
                  <p className="text-sm text-muted-foreground">Target: &lt;3s</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Error Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Current</span>
                    <span className="font-medium">{data.performanceMetrics.errorRate}%</span>
                  </div>
                  <Progress value={data.performanceMetrics.errorRate} className="h-2" />
                  <p className="text-sm text-muted-foreground">Target: &lt;5%</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cache Hit Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Current</span>
                    <span className="font-medium">{data.performanceMetrics.cacheHitRate}%</span>
                  </div>
                  <Progress value={data.performanceMetrics.cacheHitRate} className="h-2" />
                  <p className="text-sm text-muted-foreground">Target: &gt;80%</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rate Limit Hits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {data.performanceMetrics.rateLimitHits > 0 ? (
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  <span className="font-medium">{data.performanceMetrics.rateLimitHits} hits</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {data.performanceMetrics.rateLimitHits > 0
                    ? 'Consider increasing rate limits'
                    : 'Rate limits are healthy'}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIAnalyticsDashboard;