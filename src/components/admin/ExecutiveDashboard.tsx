/**
 * Executive Dashboard
 *
 * High-level dashboard for executives with KPIs, business metrics,
 * financial insights, and strategic indicators for the luxury beauty/fitness platform.
 */

import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, Treemap
} from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, Users, Target, Calendar,
  Award, AlertTriangle, CheckCircle, Clock, Eye, ShoppingCart,
  Star, Zap, Globe, CreditCard, Building2, Megaphone,
  Crown, Gem, ChevronUp, ChevronDown, Activity
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { businessIntelligenceService } from "@/services/business-intelligence.service";
import { ExecutiveDashboardData, AnalyticsFilters } from "@/types/analytics";

interface ExecutiveMetrics {
  overview: {
    totalRevenue: number;
    revenueGrowth: number;
    totalBookings: number;
    bookingGrowth: number;
    totalCustomers: number;
    customerGrowth: number;
    averageOrderValue: number;
    marketShare: number;
  };
  financial: {
    grossProfit: number;
    netProfit: number;
    profitMargin: number;
    operatingExpenses: number;
    cashFlow: number;
    customerAcquisitionCost: number;
    customerLifetimeValue: number;
    returnOnInvestment: number;
  };
  operational: {
    staffUtilization: number;
    serviceCapacity: number;
    bookingConversionRate: number;
    averageServiceRating: number;
    customerSatisfaction: number;
    netPromoterScore: number;
    operationalEfficiency: number;
    resourceUtilization: number;
  };
  strategic: {
    marketPenetration: number;
    competitivePosition: number;
    brandRecognition: number;
    innovationIndex: number;
    digitalTransformation: number;
    sustainabilityScore: number;
    marketExpansion: number;
    strategicGoals: number;
  };
}

interface PerformanceAlert {
  id: string;
  type: 'opportunity' | 'risk' | 'achievement' | 'trend';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  metric: string;
  currentValue: number;
  targetValue: number;
  trend: 'up' | 'down' | 'stable';
  timestamp: Date;
  actionRequired?: boolean;
}

const ExecutiveDashboard = () => {
  const [dashboardData, setDashboardData] = useState<ExecutiveDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'year'>('month');
  const { toast } = useToast();

  useEffect(() => {
    loadExecutiveData();
  }, [selectedPeriod]);

  const loadExecutiveData = async () => {
    try {
      setLoading(true);
      const filters: AnalyticsFilters = {
        dateRange: getDateRangeForPeriod(selectedPeriod)
      };

      const response = await businessIntelligenceService.getExecutiveDashboardData(filters);

      if (response.success) {
        setDashboardData(response.data);
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load executive dashboard data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getDateRangeForPeriod = (period: string) => {
    const now = new Date();
    const start = new Date();

    switch (period) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setDate(now.getDate() - 30);
        break;
      case 'year':
        start.setFullYear(now.getFullYear() - 1);
        break;
    }

    return {
      start: start.toISOString(),
      end: now.toISOString()
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(amount);
  };

  const getGrowthIndicator = (growth: number) => {
    if (growth > 0) {
      return (
        <div className="flex items-center gap-1 text-green-400">
          <ChevronUp className="w-4 h-4" />
          <span className="text-sm">+{growth.toFixed(1)}%</span>
        </div>
      );
    } else if (growth < 0) {
      return (
        <div className="flex items-center gap-1 text-red-400">
          <ChevronDown className="w-4 h-4" />
          <span className="text-sm">{growth.toFixed(1)}%</span>
        </div>
      );
    }
    return <span className="text-sm text-pearl/60">0%</span>;
  };

  const getAlertColor = (severity: 'critical' | 'warning' | 'info') => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 border-red-500/50 text-red-400';
      case 'warning': return 'bg-amber-500/20 border-amber-500/50 text-amber-400';
      case 'info': return 'bg-blue-500/20 border-blue-500/50 text-blue-400';
    }
  };

  const formatLargeNumber = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  const ExecutiveMetricCard = ({
    title,
    value,
    change,
    icon: Icon,
    format = 'number',
    color = 'default',
    subtitle,
    trend
  }: {
    title: string;
    value: number | string;
    change?: number;
    icon: any;
    format?: 'number' | 'currency' | 'percentage' | 'large-number';
    color?: 'success' | 'warning' | 'error' | 'info';
    subtitle?: string;
    trend?: 'up' | 'down' | 'stable';
  }) => {
    const formatValue = (val: number) => {
      switch (format) {
        case 'currency':
          return formatCurrency(val);
        case 'percentage':
          return `${val.toFixed(1)}%`;
        case 'large-number':
          return formatLargeNumber(val);
        default:
          return val.toLocaleString();
      }
    };

    const getCardColor = () => {
      switch (color) {
        case 'success': return 'bg-gradient-to-br from-green-50 to-green-100 border-green-200';
        case 'warning': return 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200';
        case 'error': return 'bg-gradient-to-br from-red-50 to-red-100 border-red-200';
        case 'info': return 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200';
        default: return 'bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200';
      }
    };

    const getIconColor = () => {
      switch (color) {
        case 'success': return 'text-green-600';
        case 'warning': return 'text-yellow-600';
        case 'error': return 'text-red-600';
        case 'info': return 'text-blue-600';
        default: return 'text-slate-600';
      }
    };

    const getTrendIcon = () => {
      if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-600" />;
      if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-600" />;
      return <div className="h-4 w-4 bg-gray-300 rounded-full" />;
    };

    return (
      <Card className={`${getCardColor()} border-2 shadow-lg hover:shadow-xl transition-shadow duration-300`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold text-slate-700">{title}</CardTitle>
          <Icon className={`h-5 w-5 ${getIconColor()}`} />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-slate-900 mb-1">
            {formatValue(value as number)}
          </div>
          <div className="flex items-center justify-between">
            {change !== undefined && (
              <div className="flex items-center text-sm">
                {getTrendIcon()}
                <span className={`ml-1 ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(change).toFixed(1)}%
                </span>
                <span className="text-muted-foreground ml-1">vs last period</span>
              </div>
            )}
            {subtitle && (
              <span className="text-xs text-muted-foreground">{subtitle}</span>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-champagne animate-pulse" />
          <span className="text-pearl">Loading executive insights...</span>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-pearl/60">No dashboard data available</p>
      </div>
    );
  }

  // Prepare chart data
  const revenueChart = [
    { name: 'Today', revenue: dashboardData.revenueMetrics.today },
    { name: 'This Week', revenue: dashboardData.revenueMetrics.thisWeek },
    { name: 'This Month', revenue: dashboardData.revenueMetrics.thisMonth },
    { name: 'This Year', revenue: dashboardData.revenueMetrics.thisYear / 12 } // Monthly average
  ];

  const bookingChart = [
    { name: 'Completed', value: dashboardData.bookingMetrics.thisMonth, color: '#10b981' },
    { name: 'Cancelled', value: dashboardData.bookingMetrics.thisMonth * (1 - dashboardData.bookingMetrics.completionRate / 100), color: '#ef4444' }
  ];

  const customerSegmentData = [
    { name: 'New Customers', value: dashboardData.customerMetrics.newCustomers.thisMonth, color: '#3b82f6' },
    { name: 'Returning', value: dashboardData.customerMetrics.returningCustomers.thisMonth, color: '#10b981' }
  ];

  const categoryData = dashboardData.servicePerformance.categoryBreakdown.slice(0, 6);

  const COLORS = ['#8B4513', '#F5DEB3', '#CD853F', '#DEB887', '#D2691E'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Crown className="w-8 h-8 text-champagne" />
          <div>
            <h1 className="text-3xl font-serif text-pearl">Executive Dashboard</h1>
            <p className="text-pearl/60">Luxury market insights and performance metrics</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Tabs value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as any)}>
            <TabsList className="bg-charcoal/50 border border-graphite/30">
              <TabsTrigger value="today" className="data-[state=active]:bg-champagne data-[state=active]:text-charcoal">Today</TabsTrigger>
              <TabsTrigger value="week" className="data-[state=active]:bg-champagne data-[state=active]:text-charcoal">Week</TabsTrigger>
              <TabsTrigger value="month" className="data-[state=active]:bg-champagne data-[state=active]:text-charcoal">Month</TabsTrigger>
              <TabsTrigger value="year" className="data-[state=active]:bg-champagne data-[state=active]:text-charcoal">Year</TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            variant="outline"
            size="sm"
            onClick={loadExecutiveData}
            className="border-champagne/30 text-pearl hover:bg-champagne/10"
          >
            <Activity className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Alerts Section */}
      {(dashboardData.alerts.critical > 0 || dashboardData.alerts.warning > 0) && (
        <Card className="bg-charcoal/50 border-graphite/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <CardTitle className="text-pearl">Active Alerts</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              {dashboardData.alerts.critical > 0 && (
                <Badge className={getAlertColor('critical')}>
                  {dashboardData.alerts.critical} Critical
                </Badge>
              )}
              {dashboardData.alerts.warning > 0 && (
                <Badge className={getAlertColor('warning')}>
                  {dashboardData.alerts.warning} Warnings
                </Badge>
              )}
              {dashboardData.alerts.info > 0 && (
                <Badge className={getAlertColor('info')}>
                  {dashboardData.alerts.info} Info
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue Card */}
        <Card className="bg-gradient-to-br from-charcoal/50 to-charcoal/70 border-graphite/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-pearl/70 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Revenue
              </CardTitle>
              <Crown className="w-4 h-4 text-champagne" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-pearl">
                {formatCurrency(
                  selectedPeriod === 'today' ? dashboardData.revenueMetrics.today :
                  selectedPeriod === 'week' ? dashboardData.revenueMetrics.thisWeek :
                  selectedPeriod === 'month' ? dashboardData.revenueMetrics.thisMonth :
                  dashboardData.revenueMetrics.thisYear
                )}
              </div>
              {getGrowthIndicator(
                selectedPeriod === 'today' ? dashboardData.revenueMetrics.growthRate.daily :
                selectedPeriod === 'week' ? dashboardData.revenueMetrics.growthRate.weekly :
                selectedPeriod === 'month' ? dashboardData.revenueMetrics.growthRate.monthly :
                dashboardData.revenueMetrics.growthRate.yearly
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bookings Card */}
        <Card className="bg-gradient-to-br from-charcoal/50 to-charcoal/70 border-graphite/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-pearl/70 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Bookings
              </CardTitle>
              <Target className="w-4 h-4 text-bronze" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-pearl">
                {
                  selectedPeriod === 'today' ? dashboardData.bookingMetrics.today :
                  selectedPeriod === 'week' ? dashboardData.bookingMetrics.thisWeek :
                  selectedPeriod === 'month' ? dashboardData.bookingMetrics.thisMonth :
                  dashboardData.bookingMetrics.thisYear
                }
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-green-400">{dashboardData.bookingMetrics.completionRate.toFixed(1)}% completion</span>
                <span className="text-pearl/40">•</span>
                <span className="text-red-400">{dashboardData.bookingMetrics.cancellationRate.toFixed(1)}% cancellation</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customers Card */}
        <Card className="bg-gradient-to-br from-charcoal/50 to-charcoal/70 border-graphite/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-pearl/70 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Customers
              </CardTitle>
              <Gem className="w-4 h-4 text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-pearl">
                {dashboardData.customerMetrics.newCustomers.thisMonth + dashboardData.customerMetrics.returningCustomers.thisMonth}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-blue-400">{dashboardData.customerMetrics.newCustomers.thisMonth} new</span>
                <span className="text-pearl/40">•</span>
                <span className="text-green-400">{dashboardData.customerMetrics.returningCustomers.thisMonth} returning</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lifetime Value Card */}
        <Card className="bg-gradient-to-br from-charcoal/50 to-charcoal/70 border-graphite/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-pearl/70 flex items-center gap-2">
                <Award className="w-4 h-4" />
                LTV
              </CardTitle>
              <TrendingUp className="w-4 h-4 text-champagne" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-pearl">
                {formatCurrency(dashboardData.customerMetrics.averageLifetimeValue)}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-green-400">{dashboardData.customerMetrics.retentionRate.toFixed(1)}% retention</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="financial" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="financial">Financial Performance</TabsTrigger>
          <TabsTrigger value="operational">Operational Excellence</TabsTrigger>
          <TabsTrigger value="strategic">Strategic Initiatives</TabsTrigger>
          <TabsTrigger value="forecasting">Forecasting & Trends</TabsTrigger>
          <TabsTrigger value="comparison">Benchmark Comparison</TabsTrigger>
        </TabsList>

        {/* Financial Performance Tab */}
        <TabsContent value="financial" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trends */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                  Revenue Performance vs Target
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => formatLargeNumber(value)} />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#8B4513"
                      fill="#F5DEB3"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="target"
                      stroke="#CD853F"
                      fill="transparent"
                      strokeDasharray="5 5"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Financial KPIs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
                  Financial KPIs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Gross Profit</span>
                    <span className="font-semibold">{formatCurrency(metrics.financial.grossProfit)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Net Profit</span>
                    <span className="font-semibold">{formatCurrency(metrics.financial.netProfit)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Profit Margin</span>
                    <span className="font-semibold">{metrics.financial.profitMargin.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Cash Flow</span>
                    <span className="font-semibold">{formatCurrency(metrics.financial.cashFlow)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">ROI</span>
                    <span className="font-semibold">{metrics.financial.returnOnInvestment.toFixed(1)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Economics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-purple-600" />
                  Customer Economics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Avg Order Value</span>
                    <span className="font-semibold">{formatCurrency(metrics.overview.averageOrderValue)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Customer Lifetime Value</span>
                    <span className="font-semibold">{formatCurrency(metrics.financial.customerLifetimeValue)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Customer Acquisition Cost</span>
                    <span className="font-semibold">{formatCurrency(metrics.financial.customerAcquisitionCost)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">LTV:CAC Ratio</span>
                    <span className="font-semibold text-green-600">
                      {(metrics.financial.customerLifetimeValue / metrics.financial.customerAcquisitionCost).toFixed(1)}x
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Operational Excellence Tab */}
        <TabsContent value="operational" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Service Performance */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="h-5 w-5 mr-2 text-yellow-600" />
                  Service Performance Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={servicePerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="service" angle={-45} textAnchor="end" height={80} />
                    <YAxis yAxisId="revenue" orientation="left" tickFormatter={(value) => formatLargeNumber(value)} />
                    <YAxis yAxisId="rating" orientation="right" domain={[0, 5]} />
                    <Tooltip
                      formatter={(value, name) => [
                        name === 'rating' ? `${value}/5` : formatLargeNumber(value as number),
                        name === 'rating' ? 'Rating' : name === 'revenue' ? 'Revenue' : 'Bookings'
                      ]}
                    />
                    <Legend />
                    <Bar yAxisId="revenue" dataKey="revenue" fill="#8B4513" name="Revenue" />
                    <Bar yAxisId="rating" dataKey="rating" fill="#F5DEB3" name="Rating" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Operational Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2 text-green-600" />
                  Operational Efficiency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Staff Utilization</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${metrics.operational.staffUtilization}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{metrics.operational.staffUtilization.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Service Capacity</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${metrics.operational.serviceCapacity}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{metrics.operational.serviceCapacity.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Conversion Rate</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${metrics.operational.bookingConversionRate}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{metrics.operational.bookingConversionRate.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Resource Utilization</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-orange-600 h-2 rounded-full"
                          style={{ width: `${metrics.operational.resourceUtilization}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{metrics.operational.resourceUtilization.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Satisfaction */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="h-5 w-5 mr-2 text-blue-600" />
                  Customer Satisfaction
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Customer Satisfaction</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${metrics.operational.customerSatisfaction}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{metrics.operational.customerSatisfaction.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Net Promoter Score</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${(metrics.operational.netPromoterScore / 100) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{metrics.operational.netPromoterScore}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Average Rating</span>
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(metrics.operational.averageServiceRating)
                              ? 'text-yellow-500 fill-yellow-500'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="text-sm font-medium ml-2">
                        {metrics.operational.averageServiceRating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Operational Efficiency</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${metrics.operational.operationalEfficiency}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{metrics.operational.operationalEfficiency.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Strategic Initiatives Tab */}
        <TabsContent value="strategic" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Market Position */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="h-5 w-5 mr-2 text-blue-600" />
                  Market Position Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={marketPositionData}>
                    <PolarGrid strokeDasharray="3 3" />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Radar
                      name="Current"
                      dataKey="current"
                      stroke="#8B4513"
                      fill="#8B4513"
                      fillOpacity={0.6}
                      strokeWidth={2}
                    />
                    <Radar
                      name="Target"
                      dataKey="target"
                      stroke="#CD853F"
                      fill="transparent"
                      strokeDasharray="5 5"
                    />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Strategic KPIs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-purple-600" />
                  Strategic KPIs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Market Penetration</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${metrics.strategic.marketPenetration}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{metrics.strategic.marketPenetration.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Brand Recognition</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${metrics.strategic.brandRecognition}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{metrics.strategic.brandRecognition.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Innovation Index</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${metrics.strategic.innovationIndex}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{metrics.strategic.innovationIndex.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Digital Transformation</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-orange-600 h-2 rounded-full"
                          style={{ width: `${metrics.strategic.digitalTransformation}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{metrics.strategic.digitalTransformation.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Sustainability Score</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${metrics.strategic.sustainabilityScore}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{metrics.strategic.sustainabilityScore.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Strategic Goals Progress */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2 text-green-600" />
                  Strategic Goals Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="relative inline-flex items-center justify-center">
                      <svg className="w-24 h-24">
                        <circle
                          className="text-gray-200"
                          strokeWidth="8"
                          stroke="currentColor"
                          fill="transparent"
                          r="36"
                          cx="48"
                          cy="48"
                        />
                        <circle
                          className="text-blue-600"
                          strokeWidth="8"
                          strokeDasharray={`${metrics.strategic.marketExpansion * 2.26} 226`}
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="transparent"
                          r="36"
                          cx="48"
                          cy="48"
                          transform="rotate(-90 48 48)"
                        />
                      </svg>
                      <span className="absolute text-xl font-bold">
                        {metrics.strategic.marketExpansion.toFixed(0)}%
                      </span>
                    </div>
                    <h4 className="mt-3 font-semibold">Market Expansion</h4>
                    <p className="text-sm text-muted-foreground">Target: 25%</p>
                  </div>

                  <div className="text-center">
                    <div className="relative inline-flex items-center justify-center">
                      <svg className="w-24 h-24">
                        <circle
                          className="text-gray-200"
                          strokeWidth="8"
                          stroke="currentColor"
                          fill="transparent"
                          r="36"
                          cx="48"
                          cy="48"
                        />
                        <circle
                          className="text-green-600"
                          strokeWidth="8"
                          strokeDasharray={`${metrics.strategic.strategicGoals * 2.26} 226`}
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="transparent"
                          r="36"
                          cx="48"
                          cy="48"
                          transform="rotate(-90 48 48)"
                        />
                      </svg>
                      <span className="absolute text-xl font-bold">
                        {metrics.strategic.strategicGoals.toFixed(0)}%
                      </span>
                    </div>
                    <h4 className="mt-3 font-semibold">Overall Goals</h4>
                    <p className="text-sm text-muted-foreground">Target: 80%</p>
                  </div>

                  <div className="text-center">
                    <div className="relative inline-flex items-center justify-center">
                      <svg className="w-24 h-24">
                        <circle
                          className="text-gray-200"
                          strokeWidth="8"
                          stroke="currentColor"
                          fill="transparent"
                          r="36"
                          cx="48"
                          cy="48"
                        />
                        <circle
                          className="text-purple-600"
                          strokeWidth="8"
                          strokeDasharray={`${(metrics.strategic.competitivePosition / 5) * 100 * 2.26} 226`}
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="transparent"
                          r="36"
                          cx="48"
                          cy="48"
                          transform="rotate(-90 48 48)"
                        />
                      </svg>
                      <span className="absolute text-xl font-bold">
                        {metrics.strategic.competitivePosition.toFixed(1)}
                      </span>
                    </div>
                    <h4 className="mt-3 font-semibold">Competitive Position</h4>
                    <p className="text-sm text-muted-foreground">Target: 4.5/5</p>
                  </div>

                  <div className="text-center">
                    <div className="relative inline-flex items-center justify-center">
                      <svg className="w-24 h-24">
                        <circle
                          className="text-gray-200"
                          strokeWidth="8"
                          stroke="currentColor"
                          fill="transparent"
                          r="36"
                          cx="48"
                          cy="48"
                        />
                        <circle
                          className="text-orange-600"
                          strokeWidth="8"
                          strokeDasharray={`${((metrics.strategic.marketShare / 20) * 100) * 2.26} 226`}
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="transparent"
                          r="36"
                          cx="48"
                          cy="48"
                          transform="rotate(-90 48 48)"
                        />
                      </svg>
                      <span className="absolute text-xl font-bold">
                        {metrics.strategic.marketShare.toFixed(1)}%
                      </span>
                    </div>
                    <h4 className="mt-3 font-semibold">Market Share</h4>
                    <p className="text-sm text-muted-foreground">Target: 20%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Forecasting & Trends Tab */}
        <TabsContent value="forecasting" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Forecast (Next 30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600">
                    {formatCurrency(52000)}
                  </div>
                  <p className="text-muted-foreground mt-2">Projected Revenue</p>
                  <div className="flex items-center justify-center mt-4 space-x-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm">+8.3% vs last period</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Booking Forecast (Next 30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600">
                    186
                  </div>
                  <p className="text-muted-foreground mt-2">Projected Bookings</p>
                  <div className="flex items-center justify-center mt-4 space-x-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">+12.5% vs last period</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Seasonal Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={[
                    { month: 'Jan', bookings: 120 },
                    { month: 'Feb', bookings: 135 },
                    { month: 'Mar', bookings: 155 },
                    { month: 'Apr', bookings: 175 },
                    { month: 'May', bookings: 165 },
                    { month: 'Jun', bookings: 180 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="bookings" stroke="#8B4513" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Growth Opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Evening Slots (6-9 PM)</span>
                    <Badge className="bg-green-100 text-green-800">High Demand</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Weekend Appointments</span>
                    <Badge className="bg-blue-100 text-blue-800">Growing</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Premium Services</span>
                    <Badge className="bg-purple-100 text-purple-800">Upsell Opportunity</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Benchmark Comparison Tab */}
        <TabsContent value="comparison" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Industry Benchmarks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Revenue Growth</span>
                      <span className="text-sm text-muted-foreground">Industry: 15%</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '20%' }}></div>
                      </div>
                      <span className="text-sm font-medium">{metrics.overview.revenueGrowth.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Customer Satisfaction</span>
                      <span className="text-sm text-muted-foreground">Industry: 85%</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '92.3%' }}></div>
                      </div>
                      <span className="text-sm font-medium">{metrics.operational.customerSatisfaction.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Net Promoter Score</span>
                      <span className="text-sm text-muted-foreground">Industry: 45</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: '72%' }}></div>
                      </div>
                      <span className="text-sm font-medium">{metrics.operational.netPromoterScore}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Competitive Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={[
                    { competitor: 'Us', revenue: 48000, satisfaction: 92.3 },
                    { competitor: 'Competitor A', revenue: 55000, satisfaction: 88.5 },
                    { competitor: 'Competitor B', revenue: 42000, satisfaction: 85.2 },
                    { competitor: 'Competitor C', revenue: 38000, satisfaction: 90.1 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="competitor" />
                    <YAxis yAxisId="revenue" orientation="left" />
                    <YAxis yAxisId="satisfaction" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="revenue" dataKey="revenue" fill="#8B4513" name="Revenue" />
                    <Bar yAxisId="satisfaction" dataKey="satisfaction" fill="#F5DEB3" name="Satisfaction %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const Download = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

export default ExecutiveDashboard;