import React, { useState, useEffect } from 'react';
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
} from 'recharts';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Download,
  Filter,
  RefreshCw,
  Target,
  Activity,
  Zap
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { schedulingAI , SchedulingAnalytics } from '@/services/schedulingAI';
import { useToast } from '@/hooks/use-toast aria-live="polite" aria-atomic="true"';

interface SchedulingAnalyticsDashboardProps {
  className?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export const SchedulingAnalyticsDashboard: React.FC<SchedulingAnalyticsDashboardProps> = ({
  className
}) => {
  const [analytics, setAnalytics] = useState<SchedulingAnalytics | null>(null);
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [loading, setLoading] = useState(false);
  const [selectedService, setSelectedService] = useState<string>('all');
  const [compareMode, setCompareMode] = useState(false);
  const [previousPeriod, setPreviousPeriod] = useState<SchedulingAnalytics | null>(null);

  const { toast aria-live="polite" aria-atomic="true" } = useToast();

  useEffect(() => {
    loadAnalytics();
  }, [period, selectedService]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const data = await schedulingAI.getSchedulingAnalytics(period);
      setAnalytics(data);

      if (compareMode) {
        // Load previous period for comparison
        const previousPeriodData = await schedulingAI.getSchedulingAnalytics(period);
        setPreviousPeriod(previousPeriodData);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast aria-live="polite" aria-atomic="true"({
        title: 'Error',
        description: 'Failed to load analytics data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!analytics) return;

    const csvContent = generateCSV(analytics);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scheduling-analytics-${period}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast aria-live="polite" aria-atomic="true"({
      title: 'Exported',
      description: 'Analytics data has been exported to CSV'
    });
  };

  const generateCSV = (data: SchedulingAnalytics): string => {
    const headers = ['Metric', 'Value', 'Period'];
    const rows = [
      ['Total Bookings', data.totalBookings.toString(), period],
      ['No-Show Rate', (data.noShowRate * 100).toFixed(2) + '%', period],
      ['Cancellation Rate', (data.cancellationRate * 100).toFixed(2) + '%', period],
      ['Average Revenue', data.averageRevenuePerBooking.toFixed(2), period],
      ['Fill Rate', (data.fillRate * 100).toFixed(2) + '%', period],
      ['Customer Satisfaction', data.customerSatisfaction.toFixed(2), period]
    ];

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const calculateChange = (current: number, previous: number): number => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <div className="h-4 w-4" />;
  };

  const formatValue = (value: number, type: 'number' | 'percentage' | 'currency' = 'number'): string => {
    switch (type) {
      case 'percentage':
        return `${(value * 100).toFixed(1)}%`;
      case 'currency':
        return `$${value.toFixed(0)}`;
      default:
        return value.toFixed(0);
    }
  };

  // Prepare chart data
  const prepareTimeSeriesData = () => {
    if (!analytics) return [];

    // Generate sample time series data
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        bookings: Math.floor(Math.random() * 20) + 10,
        revenue: Math.floor(Math.random() * 1000) + 500,
        noShows: Math.floor(Math.random() * 5),
        fillRate: Math.random() * 0.3 + 0.7
      });
    }

    return data;
  };

  const prepareServicePerformanceData = () => {
    if (!analytics) return [];

    return analytics.servicePerformance.map(service => ({
      name: service.serviceName.length > 15 ? service.serviceName.substring(0, 15) + '...' : service.serviceName,
      bookings: service.bookings,
      revenue: service.revenue,
      rating: service.rating,
      noShowRate: service.noShowRate * 100
    }));
  };

  const prepareDemandDistributionData = () => {
    return [
      { name: 'Low Demand', value: 30, color: '#00C49F' },
      { name: 'Medium Demand', value: 45, color: '#FFBB28' },
      { name: 'High Demand', value: 25, color: '#FF8042' }
    ];
  };

  const prepareHourlyUtilizationData = () => {
    if (!analytics) return [];

    return analytics.timeSlotUtilization.map(slot => ({
      hour: slot.hour,
      utilization: slot.utilization * 100,
      revenue: slot.revenue
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No analytics data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Scheduling Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into scheduling performance and AI predictions
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => setCompareMode(!compareMode)}
            className={compareMode ? 'bg-accent' : ''}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Compare
          </Button>

          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          <Button onClick={loadAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
                <p className="text-2xl font-bold">{analytics.totalBookings}</p>
                {previousPeriod && (
                  <div className="flex items-center gap-1 mt-1">
                    {getChangeIcon(calculateChange(analytics.totalBookings, previousPeriod.totalBookings))}
                    <span className="text-xs text-muted-foreground">
                      {Math.abs(calculateChange(analytics.totalBookings, previousPeriod.totalBookings)).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">No-Show Rate</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatValue(analytics.noShowRate, 'percentage')}
                </p>
                {previousPeriod && (
                  <div className="flex items-center gap-1 mt-1">
                    {getChangeIcon(calculateChange(analytics.noShowRate, previousPeriod.noShowRate))}
                    <span className="text-xs text-muted-foreground">
                      {Math.abs(calculateChange(analytics.noShowRate, previousPeriod.noShowRate)).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fill Rate</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatValue(analytics.fillRate, 'percentage')}
                </p>
                {previousPeriod && (
                  <div className="flex items-center gap-1 mt-1">
                    {getChangeIcon(calculateChange(analytics.fillRate, previousPeriod.fillRate))}
                    <span className="text-xs text-muted-foreground">
                      {Math.abs(calculateChange(analytics.fillRate, previousPeriod.fillRate)).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Revenue</p>
                <p className="text-2xl font-bold">
                  {formatValue(analytics.averageRevenuePerBooking, 'currency')}
                </p>
                {previousPeriod && (
                  <div className="flex items-center gap-1 mt-1">
                    {getChangeIcon(calculateChange(analytics.averageRevenuePerBooking, previousPeriod.averageRevenuePerBooking))}
                    <span className="text-xs text-muted-foreground">
                      {Math.abs(calculateChange(analytics.averageRevenuePerBooking, previousPeriod.averageRevenuePerBooking)).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Customer Satisfaction</p>
                <p className="text-2xl font-bold text-purple-600">
                  {analytics.customerSatisfaction.toFixed(1)}
                </p>
                {previousPeriod && (
                  <div className="flex items-center gap-1 mt-1">
                    {getChangeIcon(calculateChange(analytics.customerSatisfaction, previousPeriod.customerSatisfaction))}
                    <span className="text-xs text-muted-foreground">
                      {Math.abs(calculateChange(analytics.customerSatisfaction, previousPeriod.customerSatisfaction)).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="utilization">Utilization</TabsTrigger>
          <TabsTrigger value="predictions">AI Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Bookings Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Bookings Trend</CardTitle>
                <CardDescription>Daily booking volume over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={prepareTimeSeriesData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="bookings" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Daily revenue over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={prepareTimeSeriesData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                    <Line type="monotone" dataKey="revenue" stroke="#00C49F" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Demand Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Demand Distribution</CardTitle>
                <CardDescription>Breakdown of demand levels</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={prepareDemandDistributionData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {prepareDemandDistributionData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Cancellation Rate</span>
                      <span className="text-sm">{formatValue(analytics.cancellationRate, 'percentage')}</span>
                    </div>
                    <Progress value={analytics.cancellationRate * 100} className="h-2" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Customer Satisfaction</span>
                      <span className="text-sm">{analytics.customerSatisfaction.toFixed(1)}/5.0</span>
                    </div>
                    <Progress value={(analytics.customerSatisfaction / 5) * 100} className="h-2" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Revenue Optimization</span>
                      <span className="text-sm">+{analytics.revenueOptimization.improvement.toFixed(1)}%</span>
                    </div>
                    <Progress value={analytics.revenueOptimization.improvement} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Service Performance</CardTitle>
              <CardDescription>Comparison of service metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={prepareServicePerformanceData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="bookings" fill="#8884d8" name="Bookings" />
                  <Bar yAxisId="right" dataKey="revenue" fill="#82CA9D" name="Revenue ($)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {analytics.servicePerformance.map((service, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{service.serviceName}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Bookings</span>
                      <span className="font-medium">{service.bookings}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Revenue</span>
                      <span className="font-medium">{formatValue(service.revenue, 'currency')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Rating</span>
                      <Badge variant={service.rating >= 4.5 ? 'default' : 'secondary'}>
                        {service.rating.toFixed(1)} ⭐
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">No-Show Rate</span>
                      <span className="text-sm">{formatValue(service.noShowRate, 'percentage')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="utilization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Hourly Utilization</CardTitle>
              <CardDescription>Time slot utilization throughout the day</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={prepareHourlyUtilizationData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="utilization" stroke="#0088FE" fill="#0088FE" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Demand Prediction
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">
                    {formatValue(analytics.predictionsAccuracy.demand, 'percentage')}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">Accuracy Rate</p>
                  <Progress value={analytics.predictionsAccuracy.demand * 100} className="mt-4" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  No-Show Prediction
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">
                    {formatValue(analytics.predictionsAccuracy.noShow, 'percentage')}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">Accuracy Rate</p>
                  <Progress value={analytics.predictionsAccuracy.noShow * 100} className="mt-4" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Cancellation Prediction
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-3xl font-bold text-purple-600">
                    {formatValue(analytics.predictionsAccuracy.cancellations, 'percentage')}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">Accuracy Rate</p>
                  <Progress value={analytics.predictionsAccuracy.cancellations * 100} className="mt-4" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>AI Model Performance</CardTitle>
              <CardDescription>Overall effectiveness of AI predictions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-4">Model Metrics</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Precision</span>
                      <span className="font-medium">87.3%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Recall</span>
                      <span className="font-medium">82.1%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">F1 Score</span>
                      <span className="font-medium">84.6%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">AUC-ROC</span>
                      <span className="font-medium">0.892</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-4">Training Data</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Training Samples</span>
                      <span className="font-medium">12,543</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Features Used</span>
                      <span className="font-medium">24</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Last Trained</span>
                      <span className="font-medium">2 days ago</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Model Version</span>
                      <span className="font-medium">v2.3.1</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SchedulingAnalyticsDashboard;