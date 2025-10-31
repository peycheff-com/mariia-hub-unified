import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, FunnelChart, Funnel, LabelList, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";
import {
  TrendingUp, Users, Calendar, DollarSign, Target,
  Clock, Activity, Eye, ShoppingCart, Filter, ArrowUpRight,
  ArrowDownRight, AlertCircle, CheckCircle, XCircle
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { funnelAnalyzer } from "@/integrations/analytics/funnel-analyzer";
import { behaviorTracker } from "@/integrations/analytics/behavior-tracker";
import { ga4Analytics } from "@/integrations/analytics/ga4";
import type { ServiceCategory } from "@/integrations/analytics/booking-tracker";

interface DashboardMetrics {
  overview: {
    totalRevenue: number;
    totalBookings: number;
    conversionRate: number;
    averageOrderValue: number;
    customerRetention: number;
    netPromoterScore: number;
  };
  performance: {
    revenueGrowth: number;
    bookingGrowth: number;
    customerGrowth: number;
    satisfactionScore: number;
  };
  funnel: {
    completionRate: number;
    dropOffRate: number;
    averageTimeToComplete: number;
    abandonmentReasons: Array<{ reason: string; count: number; percentage: number }>;
  };
  behavior: {
    averageSessionDuration: number;
    pagesPerSession: number;
    bounceRate: number;
    returnVisitorRate: number;
  };
}

const COLORS = ['#8B4513', '#F5DEB3', '#CD853F', '#DEB887', '#D2691E', '#BC8F8F'];

const AdvancedAnalyticsDashboard = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | 'all'>('all');
  const [selectedDevice, setSelectedDevice] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, [dateRange, selectedCategory, selectedDevice]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const startDate = dateRange.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = dateRange.end || new Date().toISOString();

      // Load funnel metrics
      const funnelMetrics = await funnelAnalyzer.analyzeBookingFunnel(
        startDate,
        endDate,
        {
          service_category: selectedCategory !== 'all' ? selectedCategory : undefined,
          device_type: selectedDevice !== 'all' ? selectedDevice : undefined,
        }
      );

      // Load behavior insights
      const behaviorInsights = await behaviorTracker.generateBehaviorInsights(startDate, endDate);

      // Load business metrics
      const businessMetrics = await loadBusinessMetrics(startDate, endDate);

      // Generate insights
      const insights = await funnelAnalyzer.generateFunnelInsights(
        startDate,
        endDate,
        {
          service_category: selectedCategory !== 'all' ? selectedCategory : undefined,
          device_type: selectedDevice !== 'all' ? selectedDevice : undefined,
        }
      );

      setMetrics({
        overview: {
          totalRevenue: funnelMetrics.value_metrics.total_revenue,
          totalBookings: funnelMetrics.total_sessions,
          conversionRate: funnelMetrics.completion_rate,
          averageOrderValue: funnelMetrics.value_metrics.average_booking_value,
          customerRetention: behaviorInsights.user_patterns.return_visitor_rate,
          netPromoterScore: businessMetrics.nps || 0,
        },
        performance: {
          revenueGrowth: businessMetrics.revenueGrowth || 0,
          bookingGrowth: businessMetrics.bookingGrowth || 0,
          customerGrowth: businessMetrics.customerGrowth || 0,
          satisfactionScore: businessMetrics.satisfactionScore || 0,
        },
        funnel: {
          completionRate: funnelMetrics.completion_rate,
          dropOffRate: 100 - funnelMetrics.completion_rate,
          averageTimeToComplete: funnelMetrics.time_analysis.average_total_time_seconds,
          abandonmentReasons: funnelMetrics.drop_off_analysis.drop_off_reasons.slice(0, 5),
        },
        behavior: {
          averageSessionDuration: behaviorInsights.user_patterns.average_session_duration,
          pagesPerSession: behaviorInsights.user_patterns.pages_per_session,
          bounceRate: behaviorInsights.user_patterns.bounce_rate,
          returnVisitorRate: behaviorInsights.user_patterns.return_visitor_rate,
        },
      });

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadBusinessMetrics = async (startDate: string, endDate: string) => {
    // Calculate previous period for comparison
    const start = new Date(startDate);
    const end = new Date(endDate);
    const periodLength = end.getTime() - start.getTime();

    const previousStart = new Date(start.getTime() - periodLength).toISOString();
    const previousEnd = startDate;

    try {
      // Current period data
      const { data: currentBookings } = await supabase
        .from('booking_journeys')
        .select('service_selected, created_at')
        .eq('is_completed', true)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      // Previous period data
      const { data: previousBookings } = await supabase
        .from('booking_journeys')
        .select('service_selected, created_at')
        .eq('is_completed', true)
        .gte('created_at', previousStart)
        .lte('created_at', previousEnd);

      // Calculate revenue and growth
      const currentRevenue = currentBookings?.reduce((sum, booking) =>
        sum + (booking.service_selected?.price || 0), 0) || 0;
      const previousRevenue = previousBookings?.reduce((sum, booking) =>
        sum + (booking.service_selected?.price || 0), 0) || 0;

      const revenueGrowth = previousRevenue > 0
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
        : 0;

      const bookingGrowth = previousBookings?.length > 0
        ? ((currentBookings?.length || 0) - previousBookings.length) / previousBookings.length * 100
        : 0;

      // Get customer growth
      const { data: currentUsers } = await supabase
        .from('profiles')
        .select('id, created_at')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      const { data: previousUsers } = await supabase
        .from('profiles')
        .select('id, created_at')
        .gte('created_at', previousStart)
        .lte('created_at', previousEnd);

      const customerGrowth = previousUsers?.length > 0
        ? ((currentUsers?.length || 0) - previousUsers.length) / previousUsers.length * 100
        : 0;

      return {
        revenueGrowth,
        bookingGrowth,
        customerGrowth,
        satisfactionScore: 4.5, // Placeholder - would come from reviews
        nps: 72, // Placeholder - would come from NPS surveys
      };
    } catch (error) {
      console.error('Failed to load business metrics:', error);
      return {
        revenueGrowth: 0,
        bookingGrowth: 0,
        customerGrowth: 0,
        satisfactionScore: 0,
        nps: 0,
      };
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
    }).format(value);
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const MetricCard = ({
    title,
    value,
    change,
    icon: Icon,
    format = 'number',
    color = 'default'
  }: {
    title: string;
    value: number | string;
    change?: number;
    icon: any;
    format?: 'number' | 'currency' | 'duration' | 'percentage';
    color?: 'default' | 'success' | 'warning' | 'error';
  }) => {
    const formatValue = (val: number) => {
      switch (format) {
        case 'currency':
          return formatCurrency(val);
        case 'duration':
          return formatDuration(val);
        case 'percentage':
          return `${val.toFixed(1)}%`;
        default:
          return val.toLocaleString();
      }
    };

    const getChangeColor = (change: number) => {
      if (change > 0) return 'text-green-600';
      if (change < 0) return 'text-red-600';
      return 'text-gray-600';
    };

    const getCardColor = () => {
      switch (color) {
        case 'success': return 'bg-green-50 border-green-200';
        case 'warning': return 'bg-yellow-50 border-yellow-200';
        case 'error': return 'bg-red-50 border-red-200';
        default: return 'bg-white';
      }
    };

    return (
      <Card className={getCardColor()}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatValue(value as number)}</div>
          {change !== undefined && (
            <div className={`flex items-center text-xs ${getChangeColor(change)}`}>
              {change > 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
              {Math.abs(change).toFixed(1)}% from last period
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Advanced Analytics Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive insights for beauty & fitness booking platform</p>
        </div>

        <div className="flex items-center space-x-4">
          <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as ServiceCategory | 'all')}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="beauty">Beauty</SelectItem>
              <SelectItem value="fitness">Fitness</SelectItem>
              <SelectItem value="lifestyle">Lifestyle</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedDevice} onValueChange={setSelectedDevice}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Device" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Devices</SelectItem>
              <SelectItem value="mobile">Mobile</SelectItem>
              <SelectItem value="desktop">Desktop</SelectItem>
              <SelectItem value="tablet">Tablet</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={loadDashboardData} variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value={metrics.overview.totalRevenue}
          change={metrics.performance.revenueGrowth}
          icon={DollarSign}
          format="currency"
          color={metrics.performance.revenueGrowth > 0 ? 'success' : 'error'}
        />

        <MetricCard
          title="Total Bookings"
          value={metrics.overview.totalBookings}
          change={metrics.performance.bookingGrowth}
          icon={Calendar}
          format="number"
          color={metrics.performance.bookingGrowth > 0 ? 'success' : 'error'}
        />

        <MetricCard
          title="Conversion Rate"
          value={metrics.overview.conversionRate}
          icon={Target}
          format="percentage"
        />

        <MetricCard
          title="Avg Order Value"
          value={metrics.overview.averageOrderValue}
          icon={ShoppingCart}
          format="currency"
        />
      </div>

      <Tabs defaultValue="funnel" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="funnel">Booking Funnel</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="behavior">User Behavior</TabsTrigger>
          <TabsTrigger value="revenue">Revenue Analysis</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        {/* Booking Funnel Tab */}
        <TabsContent value="funnel" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Funnel Visualization */}
            <Card>
              <CardHeader>
                <CardTitle>Booking Conversion Funnel</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <FunnelChart>
                    <Funnel
                      data={[
                        { name: 'Service Selection', value: 1000, fill: '#8B4513' },
                        { name: 'Time Selection', value: 750, fill: '#F5DEB3' },
                        { name: 'Customer Details', value: 500, fill: '#CD853F' },
                        { name: 'Payment', value: 350, fill: '#DEB887' },
                      ]}
                      labelKey="name"
                      valueKey="value"
                    >
                      <LabelList position="center" fill="#000" fontSize={12} />
                    </Funnel>
                  </FunnelChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Drop-off Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Common Drop-off Reasons</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.funnel.abandonmentReasons.map((reason, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">Step {reason.step}</Badge>
                        <span className="text-sm">{reason.reason}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{reason.count}</span>
                        <span className="text-xs text-muted-foreground">({reason.percentage.toFixed(1)}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Funnel Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="Completion Rate"
              value={metrics.funnel.completionRate}
              icon={CheckCircle}
              format="percentage"
              color={metrics.funnel.completionRate > 50 ? 'success' : 'warning'}
            />

            <MetricCard
              title="Drop-off Rate"
              value={metrics.funnel.dropOffRate}
              icon={XCircle}
              format="percentage"
              color={metrics.funnel.dropOffRate > 50 ? 'error' : 'default'}
            />

            <MetricCard
              title="Avg Time to Complete"
              value={metrics.funnel.averageTimeToComplete}
              icon={Clock}
              format="duration"
            />
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Growth Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Growth Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Revenue Growth</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{metrics.performance.revenueGrowth.toFixed(1)}%</span>
                      {metrics.performance.revenueGrowth > 0 ?
                        <TrendingUp className="h-4 w-4 text-green-600" /> :
                        <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
                      }
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Booking Growth</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{metrics.performance.bookingGrowth.toFixed(1)}%</span>
                      {metrics.performance.bookingGrowth > 0 ?
                        <TrendingUp className="h-4 w-4 text-green-600" /> :
                        <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
                      }
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Customer Growth</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{metrics.performance.customerGrowth.toFixed(1)}%</span>
                      {metrics.performance.customerGrowth > 0 ?
                        <TrendingUp className="h-4 w-4 text-green-600" /> :
                        <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
                      }
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Satisfaction */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Satisfaction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Satisfaction Score</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{metrics.performance.satisfactionScore}/5.0</span>
                      <Star className="h-4 w-4 text-yellow-500" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Net Promoter Score</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{metrics.overview.netPromoterScore}</span>
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Customer Retention</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{metrics.overview.customerRetention.toFixed(1)}%</span>
                      <Activity className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* User Behavior Tab */}
        <TabsContent value="behavior" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Session Analytics */}
            <Card>
              <CardHeader>
                <CardTitle>Session Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Avg Session Duration</span>
                    <span className="font-medium">{formatDuration(Math.round(metrics.behavior.averageSessionDuration / 1000))}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Pages per Session</span>
                    <span className="font-medium">{metrics.behavior.pagesPerSession.toFixed(1)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Bounce Rate</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{metrics.behavior.bounceRate.toFixed(1)}%</span>
                      {metrics.behavior.bounceRate > 50 ?
                        <AlertCircle className="h-4 w-4 text-red-600" /> :
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      }
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Return Visitor Rate</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{metrics.behavior.returnVisitorRate.toFixed(1)}%</span>
                      <Eye className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Device Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Device Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Mobile', value: 45, fill: '#8B4513' },
                        { name: 'Desktop', value: 35, fill: '#F5DEB3' },
                        { name: 'Tablet', value: 20, fill: '#CD853F' },
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Revenue Analysis Tab */}
        <TabsContent value="revenue" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue by Category */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={[
                    { category: 'Beauty', revenue: 15000 },
                    { category: 'Fitness', revenue: 12000 },
                    { category: 'Lifestyle', revenue: 8000 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Bar dataKey="revenue" fill="#8B4513" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Revenue Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={[
                    { month: 'Jan', revenue: 30000 },
                    { month: 'Feb', revenue: 35000 },
                    { month: 'Mar', revenue: 32000 },
                    { month: 'Apr', revenue: 38000 },
                    { month: 'May', revenue: 42000 },
                    { month: 'Jun', revenue: 45000 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Area type="monotone" dataKey="revenue" stroke="#8B4513" fill="#F5DEB3" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>AI-Generated Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Performance Insight</h4>
                    <p className="text-sm text-blue-700">
                      Mobile bookings have increased by 25% this month, while desktop bookings remain stable.
                      Consider optimizing the mobile experience further.
                    </p>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">Positive Trend</h4>
                    <p className="text-sm text-green-700">
                      Beauty services are showing strong growth with a 40% increase in conversions.
                      Consider expanding beauty service offerings.
                    </p>
                  </div>

                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h4 className="font-medium text-yellow-900 mb-2">Opportunity</h4>
                    <p className="text-sm text-yellow-700">
                      Evening slots (6-9 PM) have the highest conversion rates but limited availability.
                      Consider extending evening hours.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Target className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Optimize Booking Funnel</h4>
                      <p className="text-sm text-muted-foreground">
                        Reduce drop-off at payment step by offering more payment options.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Users className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Improve Mobile Experience</h4>
                      <p className="text-sm text-muted-foreground">
                        60% of users access via mobile - ensure seamless experience.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <DollarSign className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Dynamic Pricing</h4>
                      <p className="text-sm text-muted-foreground">
                        Implement time-based pricing to maximize revenue during peak hours.
                      </p>
                    </div>
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

const Star = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

export default AdvancedAnalyticsDashboard;