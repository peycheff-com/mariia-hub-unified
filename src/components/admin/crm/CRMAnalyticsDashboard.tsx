/**
 * Comprehensive CRM Analytics Dashboard
 * Business intelligence, client metrics, and performance insights
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  Cell,
  AreaChart,
  Area
} from 'recharts';

import { crmService } from '@/services/crm.service';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Star,
  Target,
  Award,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Crown,
  Diamond,
  Gem,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  Heart,
  ShoppingCart,
  MessageSquare,
  Eye,
  MousePointer,
  UserPlus,
  UserMinus,
  Zap
} from 'lucide-react';

import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { pl } from 'date-fns/locale';

interface CRMAnalyticsDashboardProps {
  viewMode?: 'full' | 'compact';
  timeRange?: '7d' | '30d' | '90d' | '1y' | 'custom';
  customDateRange?: { start: Date; end: Date };
}

interface AnalyticsData {
  summary: {
    total_clients: number;
    vip_clients: number;
    active_clients: number;
    new_clients_this_period: number;
    total_revenue: number;
    average_lifetime_value: number;
    average_satisfaction_score: number;
    churn_risk_clients: number;
  };
  trends: {
    client_growth: Array<{ date: string; clients: number; new_clients: number }>;
    revenue_trend: Array<{ date: string; revenue: number; bookings: number }>;
    satisfaction_trend: Array<{ date: string; score: number }>;
  };
  segments: {
    tier_distribution: Array<{ tier: string; count: number; percentage: number }>;
    segment_distribution: Array<{ segment: string; count: number; percentage: number }>;
    risk_distribution: Array<{ risk: string; count: number; percentage: number }>;
  };
  performance: {
    top_services: Array<{ name: string; bookings: number; revenue: number; satisfaction: number }>;
    top_staff: Array<{ name: string; bookings: number; revenue: number; satisfaction: number }>;
    acquisition_channels: Array<{ channel: string; clients: number; cost: number; revenue: number }>;
  };
  predictions: {
    churn_predictions: Array<{ client_id: string; name: string; probability: number; risk_factors: string[] }>;
    revenue_forecast: Array<{ period: string; predicted: number; confidence: number }>;
    recommendations: Array<{ type: string; impact: string; effort: string; priority: number }>;
  };
}

const TIER_COLORS = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2'
};

const SEGMENT_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];

export const CRMAnalyticsDashboard: React.FC<CRMAnalyticsDashboardProps> = ({
  viewMode = 'full',
  timeRange = '30d',
  customDateRange
}) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedTimeRange, customDateRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);

      // Load comprehensive analytics data
      const summaryMetrics = await crmService.getClientsSummaryMetrics();

      // Mock detailed analytics data (in production, this would come from dedicated analytics endpoints)
      const mockAnalyticsData: AnalyticsData = {
        summary: {
          total_clients: summaryMetrics?.total_clients || 1248,
          vip_clients: summaryMetrics?.vip_clients || 87,
          active_clients: summaryMetrics?.active_clients || 892,
          new_clients_this_period: 156,
          total_revenue: summaryMetrics?.total_revenue || 284750,
          average_lifetime_value: summaryMetrics?.average_lifetime_value || 892,
          average_satisfaction_score: summaryMetrics?.average_satisfaction_score || 4.6,
          churn_risk_clients: summaryMetrics?.churn_risk_clients || 42
        },
        trends: {
          client_growth: generateClientGrowthData(selectedTimeRange),
          revenue_trend: generateRevenueTrendData(selectedTimeRange),
          satisfaction_trend: generateSatisfactionTrendData(selectedTimeRange)
        },
        segments: {
          tier_distribution: [
            { tier: 'bronze', count: 624, percentage: 50 },
            { tier: 'silver', count: 374, percentage: 30 },
            { tier: 'gold', count: 187, percentage: 15 },
            { tier: 'platinum', count: 63, percentage: 5 }
          ],
          segment_distribution: [
            { segment: 'loyal', count: 435, percentage: 35 },
            { segment: 'new', count: 312, percentage: 25 },
            { segment: 'vip', count: 187, percentage: 15 },
            { segment: 'at_risk', count: 156, percentage: 12.5 },
            { segment: 'dormant', count: 125, percentage: 10 },
            { segment: 'corporate', count: 33, percentage: 2.5 }
          ],
          risk_distribution: [
            { risk: 'low', count: 842, percentage: 67.5 },
            { risk: 'medium', count: 312, percentage: 25 },
            { risk: 'high', count: 87, percentage: 7 },
            { risk: 'critical', count: 7, percentage: 0.5 }
          ]
        },
        performance: {
          top_services: [
            { name: 'Anti-aging Facial', bookings: 234, revenue: 46800, satisfaction: 4.8 },
            { name: 'Deep Tissue Massage', bookings: 187, revenue: 37400, satisfaction: 4.7 },
            { name: 'Hydrafacial', bookings: 156, revenue: 46800, satisfaction: 4.9 },
            { name: 'Laser Hair Removal', bookings: 143, revenue: 71500, satisfaction: 4.6 },
            { name: 'Personal Training', bookings: 98, revenue: 29400, satisfaction: 4.8 }
          ],
          top_staff: [
            { name: 'Anna Kowalska', bookings: 156, revenue: 62400, satisfaction: 4.9 },
            { name: 'Maria Nowak', bookings: 134, revenue: 53600, satisfaction: 4.8 },
            { name: 'Ewa Wiśniewska', bookings: 98, revenue: 39200, satisfaction: 4.7 },
            { name: 'Katarzyna Dąbrowska', bookings: 87, revenue: 34800, satisfaction: 4.8 },
            { name: 'Joanna Lewandowska', bookings: 76, revenue: 30400, satisfaction: 4.6 }
          ],
          acquisition_channels: [
            { channel: 'Referral', clients: 435, cost: 0, revenue: 156600 },
            { channel: 'Google Ads', clients: 312, cost: 23400, revenue: 112320 },
            { channel: 'Instagram', clients: 234, cost: 11700, revenue: 84240 },
            { channel: 'Facebook', clients: 187, cost: 9350, revenue: 67320 },
            { channel: 'Organic', clients: 80, cost: 0, revenue: 28800 }
          ]
        },
        predictions: {
          churn_predictions: [
            { client_id: '1', name: 'Jan Kowalski', probability: 0.85, risk_factors: ['90+ days inactive', 'low satisfaction'] },
            { client_id: '2', name: 'Anna Nowak', probability: 0.78, risk_factors: ['60+ days inactive', 'cancellation pattern'] },
            { client_id: '3', name: 'Maria Wiśniewska', probability: 0.72, risk_factors: ['decreased booking frequency'] },
            { client_id: '4', name: 'Ewa Dąbrowska', probability: 0.68, risk_factors: ['negative feedback', 'price sensitivity'] },
            { client_id: '5', name: 'Katarzyna Lewandowska', probability: 0.65, risk_factors: ['competitor engagement'] }
          ],
          revenue_forecast: [
            { period: 'Next Month', predicted: 32000, confidence: 0.85 },
            { period: 'Next Quarter', predicted: 98000, confidence: 0.78 },
            { period: 'Next 6 Months', predicted: 198000, confidence: 0.72 },
            { period: 'Next Year', predicted: 425000, confidence: 0.65 }
          ],
          recommendations: [
            { type: 'Retention Campaign', impact: 'High', effort: 'Medium', priority: 1 },
            { type: 'VIP Upgrade Program', impact: 'High', effort: 'Low', priority: 2 },
            { type: 'Referral Incentive', impact: 'Medium', effort: 'Low', priority: 3 },
            { type: 'Service Bundle Creation', impact: 'Medium', effort: 'High', priority: 4 },
            { type: 'Staff Training', impact: 'Low', effort: 'Medium', priority: 5 }
          ]
        }
      };

      setAnalyticsData(mockAnalyticsData);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadAnalyticsData();
  };

  const handleExport = () => {
    // Export functionality would be implemented here
    console.log('Exporting analytics data...');
  };

  const generateClientGrowthData = (range: string) => {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365;
    const data = [];
    let totalClients = 1000;

    for (let i = days; i >= 0; i--) {
      const date = format(subDays(new Date(), i), 'MMM dd', { locale: pl });
      const newClients = Math.floor(Math.random() * 10) + 2;
      totalClients += newClients;

      data.push({
        date,
        clients: totalClients,
        new_clients: newClients
      });
    }

    return data;
  };

  const generateRevenueTrendData = (range: string) => {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365;
    const data = [];

    for (let i = days; i >= 0; i--) {
      const date = format(subDays(new Date(), i), 'MMM dd', { locale: pl });
      const revenue = Math.floor(Math.random() * 2000) + 800;
      const bookings = Math.floor(Math.random() * 15) + 5;

      data.push({ date, revenue, bookings });
    }

    return data;
  };

  const generateSatisfactionTrendData = (range: string) => {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365;
    const data = [];

    for (let i = days; i >= 0; i--) {
      const date = format(subDays(new Date(), i), 'MMM dd', { locale: pl });
      const score = 4 + Math.random();

      data.push({ date, score: parseFloat(score.toFixed(1)) });
    }

    return data;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(amount);
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('pl-PL').format(num);
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) {
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    } else if (current < previous) {
      return <TrendingDown className="w-4 h-4 text-red-600" />;
    }
    return <div className="w-4 h-4 bg-gray-300 rounded-full" />;
  };

  const getRiskColor = (probability: number) => {
    if (probability >= 0.8) return 'text-red-600 bg-red-50';
    if (probability >= 0.6) return 'text-orange-600 bg-orange-50';
    if (probability >= 0.4) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analyticsData) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Analytics data not available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">CRM Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive insights into client relationships and business performance
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Clients</p>
                <p className="text-2xl font-bold">{formatNumber(analyticsData.summary.total_clients)}</p>
                <div className="flex items-center space-x-1 mt-1">
                  <TrendingUp className="w-3 h-3 text-green-600" />
                  <span className="text-xs text-green-600">+{analyticsData.summary.new_clients_this_period} this period</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(analyticsData.summary.total_revenue)}</p>
                <div className="flex items-center space-x-1 mt-1">
                  <TrendingUp className="w-3 h-3 text-green-600" />
                  <span className="text-xs text-green-600">+12.5% vs last period</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Satisfaction</p>
                <p className="text-2xl font-bold">{analyticsData.summary.average_satisfaction_score.toFixed(1)}</p>
                <div className="flex items-center space-x-1 mt-1">
                  <Star className="w-3 h-3 text-yellow-500" />
                  <span className="text-xs text-muted-foreground">Out of 5.0</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Churn Risk</p>
                <p className="text-2xl font-bold">{analyticsData.summary.churn_risk_clients}</p>
                <div className="flex items-center space-x-1 mt-1">
                  <AlertTriangle className="w-3 h-3 text-orange-600" />
                  <span className="text-xs text-orange-600">Require attention</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="segments">Segments</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="recommendations">Actions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Client Growth Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserPlus className="w-5 h-5 mr-2" />
                  Client Growth
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analyticsData.trends.client_growth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="clients"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Revenue Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Revenue Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.trends.revenue_trend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#82ca9d"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Tier Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="w-5 h-5 mr-2" />
                  Tier Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.segments.tier_distribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ tier, percentage }) => `${tier} ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analyticsData.segments.tier_distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={TIER_COLORS[entry.tier as keyof typeof TIER_COLORS]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Satisfaction Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="w-5 h-5 mr-2" />
                  Satisfaction Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.trends.satisfaction_trend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[3.5, 5]} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#ffc658"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Segments Tab */}
        <TabsContent value="segments" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Segment Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Client Segments</CardTitle>
                <CardDescription>Distribution across behavioral and value-based segments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.segments.segment_distribution.map((segment, index) => (
                    <div key={segment.segment} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: SEGMENT_COLORS[index % SEGMENT_COLORS.length] }}
                        />
                        <span className="font-medium capitalize">{segment.segment}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-24">
                          <Progress value={segment.percentage} className="h-2" />
                        </div>
                        <span className="text-sm text-muted-foreground w-12 text-right">
                          {segment.percentage}%
                        </span>
                        <span className="text-sm font-medium w-12 text-right">
                          {segment.count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Risk Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Churn Risk Distribution</CardTitle>
                <CardDescription>Clients categorized by churn probability</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.segments.risk_distribution.map((risk) => (
                    <div key={risk.risk} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded ${
                          risk.risk === 'critical' ? 'bg-red-500' :
                          risk.risk === 'high' ? 'bg-orange-500' :
                          risk.risk === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`} />
                        <span className="font-medium capitalize">{risk.risk} Risk</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-24">
                          <Progress
                            value={risk.percentage}
                            className={`h-2 ${
                              risk.risk === 'critical' ? 'bg-red-100' :
                              risk.risk === 'high' ? 'bg-orange-100' :
                              risk.risk === 'medium' ? 'bg-yellow-100' : 'bg-green-100'
                            }`}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-12 text-right">
                          {risk.percentage}%
                        </span>
                        <span className="text-sm font-medium w-12 text-right">
                          {risk.count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Risk Mitigation Actions</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• High-risk clients: Immediate outreach with special offers</li>
                    <li>• Medium-risk clients: Enhanced engagement campaign</li>
                    <li>• Low-risk clients: Regular relationship nurturing</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Services */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Services</CardTitle>
                <CardDescription>Services by bookings, revenue, and satisfaction</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead className="text-right">Bookings</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Rating</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analyticsData.performance.top_services.map((service) => (
                      <TableRow key={service.name}>
                        <TableCell className="font-medium">{service.name}</TableCell>
                        <TableCell className="text-right">{service.bookings}</TableCell>
                        <TableCell className="text-right">{formatCurrency(service.revenue)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span>{service.satisfaction}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Top Staff */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Staff</CardTitle>
                <CardDescription>Staff members by bookings, revenue, and satisfaction</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff Member</TableHead>
                      <TableHead className="text-right">Bookings</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Rating</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analyticsData.performance.top_staff.map((staff) => (
                      <TableRow key={staff.name}>
                        <TableCell className="font-medium">{staff.name}</TableCell>
                        <TableCell className="text-right">{staff.bookings}</TableCell>
                        <TableCell className="text-right">{formatCurrency(staff.revenue)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span>{staff.satisfaction}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Acquisition Channels */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Acquisition Channel Performance</CardTitle>
                <CardDescription>Client acquisition effectiveness by channel</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Channel</TableHead>
                      <TableHead className="text-right">Clients</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">CAC</TableHead>
                      <TableHead className="text-right">ROI</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analyticsData.performance.acquisition_channels.map((channel) => {
                      const cac = channel.clients > 0 ? channel.cost / channel.clients : 0;
                      const roi = channel.cost > 0 ? ((channel.revenue - channel.cost) / channel.cost) * 100 : 0;

                      return (
                        <TableRow key={channel.channel}>
                          <TableCell className="font-medium">{channel.channel}</TableCell>
                          <TableCell className="text-right">{channel.clients}</TableCell>
                          <TableCell className="text-right">{formatCurrency(channel.cost)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(channel.revenue)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(cac)}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={roi > 0 ? "default" : "secondary"}>
                              {roi.toFixed(1)}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Churn Predictions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  High Churn Risk Clients
                </CardTitle>
                <CardDescription>Clients requiring immediate attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.predictions.churn_predictions.map((prediction) => (
                    <div key={prediction.client_id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{prediction.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {prediction.risk_factors.join(', ')}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className={getRiskColor(prediction.probability)}>
                          {(prediction.probability * 100).toFixed(0)}% risk
                        </Badge>
                        <Button size="sm" variant="outline" className="ml-2">
                          Take Action
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Revenue Forecast */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Revenue Forecast
                </CardTitle>
                <CardDescription>Predicted revenue with confidence intervals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.predictions.revenue_forecast.map((forecast) => (
                    <div key={forecast.period} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{forecast.period}</p>
                        <p className="text-sm text-muted-foreground">
                          Confidence: {(forecast.confidence * 100).toFixed(0)}%
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(forecast.predicted)}</p>
                        <div className="w-24">
                          <Progress value={forecast.confidence * 100} className="h-2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Recommended Actions
              </CardTitle>
              <CardDescription>AI-powered recommendations for business improvement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.predictions.recommendations.map((rec, index) => (
                  <div key={rec.type} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-bold">{rec.priority}</span>
                      </div>
                      <div>
                        <p className="font-medium">{rec.type}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline">Impact: {rec.impact}</Badge>
                          <Badge variant="outline">Effort: {rec.effort}</Badge>
                        </div>
                      </div>
                    </div>
                    <Button>
                      Implement
                    </Button>
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

export default CRMAnalyticsDashboard;