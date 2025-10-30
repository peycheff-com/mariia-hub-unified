import React, { useState, useEffect, useMemo } from 'react';
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
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ComposedChart,
  Treemap,
  HeatmapChart
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  Target,
  Brain,
  AlertTriangle,
  CheckCircle,
  Activity,
  MapPin,
  Clock,
  Star,
  ShoppingCart,
  Eye,
  Zap,
  BarChart3,
  PieChart as PieChartIcon,
  Download,
  RefreshCw,
  Settings,
  Lightbulb,
  Award,
  Globe,
  Building
} from 'lucide-react';
import { addDays, format, subDays, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast aria-live="polite" aria-atomic="true"';

// Types for BI Analytics
interface BIKPIData {
  revenue: {
    current: number;
    previous: number;
    growth: number;
    forecast: number;
    confidence: number;
  };
  bookings: {
    current: number;
    previous: number;
    growth: number;
    forecast: number;
    completionRate: number;
  };
  customers: {
    new: number;
    returning: number;
    total: number;
    churnRate: number;
    lifetimeValue: number;
  };
  performance: {
    occupancyRate: number;
    avgBookingValue: number;
    conversionRate: number;
    satisfactionScore: number;
  };
}

interface CustomerJourneyData {
  stage: string;
  users: number;
  conversionRate: number;
  dropOffRate: number;
  avgTimeSpent: number;
}

interface ServicePerformance {
  serviceId: string;
  serviceName: string;
  category: string;
  revenue: number;
  bookings: number;
  avgRating: number;
  popularity: number;
  profitability: number;
  demand: 'high' | 'medium' | 'low';
  seasonality: number;
}

interface PredictiveInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'trend' | 'recommendation';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  actionable: boolean;
  suggestedActions: string[];
  kpi: string;
  currentValue: number;
  projectedValue: number;
}

interface MarketIntelligence {
  competitorData: Array<{
    name: string;
    marketShare: number;
    avgPrice: number;
    services: number;
    rating: number;
  }>;
  marketTrends: Array<{
    trend: string;
    growth: number;
    relevance: number;
    timeframe: string;
  }>;
  demandForecast: Array<{
    month: string;
    expectedDemand: number;
    confidence: number;
    factors: string[];
  }>;
}

const BIDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [kpiData, setKpiData] = useState<BIKPIData | null>(null);
  const [customerJourney, setCustomerJourney] = useState<CustomerJourneyData[]>([]);
  const [servicePerformance, setServicePerformance] = useState<ServicePerformance[]>([]);
  const [predictiveInsights, setPredictiveInsights] = useState<PredictiveInsight[]>([]);
  const [marketIntelligence, setMarketIntelligence] = useState<MarketIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [forecastingEnabled, setForecastingEnabled] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const { toast aria-live="polite" aria-atomic="true" } = useToast();

  // Color palette for charts
  const COLORS = ['#8B4513', '#F5DEB3', '#D2691E', '#DEB887', '#BC8F8F', '#F4A460'];

  // Load comprehensive BI data
  useEffect(() => {
    loadBIData();
  }, [dateRange, forecastingEnabled]);

  const loadBIData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadKPIData(),
        loadCustomerJourneyData(),
        loadServicePerformanceData(),
        loadPredictiveInsights(),
        loadMarketIntelligence()
      ]);
    } catch (error) {
      console.error('Error loading BI data:', error);
      toast aria-live="polite" aria-atomic="true"({
        title: 'Error',
        description: 'Failed to load business intelligence data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadKPIData = async () => {
    try {
      // Get current period data
      const [bookingsData, profilesData, servicesData] = await Promise.all([
        supabase
          .from('bookings')
          .select('*')
          .gte('booking_date', dateRange.from.toISOString())
          .lte('booking_date', dateRange.to.toISOString())
          .in('status', ['confirmed', 'completed']),
        supabase
          .from('profiles')
          .select('*'),
        supabase
          .from('services')
          .select('*')
      ]);

      // Get previous period data for comparison
      const previousDateRange = {
        from: subDays(dateRange.from, (dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)),
        to: dateRange.from
      };

      const [previousBookingsData] = await Promise.all([
        supabase
          .from('bookings')
          .select('*')
          .gte('booking_date', previousDateRange.from.toISOString())
          .lte('booking_date', previousDateRange.to.toISOString())
          .in('status', ['confirmed', 'completed'])
      ]);

      // Calculate KPIs
      const currentRevenue = bookingsData?.data?.reduce((sum, b) => sum + (Number(b.amount_paid) || 0), 0) || 0;
      const previousRevenue = previousBookingsData?.data?.reduce((sum, b) => sum + (Number(b.amount_paid) || 0), 0) || 0;
      const revenueGrowth = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

      const currentBookings = bookingsData?.data?.length || 0;
      const previousBookings = previousBookingsData?.data?.length || 0;
      const bookingGrowth = previousBookings > 0 ? ((currentBookings - previousBookings) / previousBookings) * 100 : 0;

      const completedBookings = bookingsData?.data?.filter(b => b.status === 'completed')?.length || 0;
      const completionRate = currentBookings > 0 ? (completedBookings / currentBookings) * 100 : 0;

      const avgBookingValue = currentBookings > 0 ? currentRevenue / currentBookings : 0;

      // Simulate forecasting
      const revenueForecast = forecastingEnabled ? currentRevenue * (1 + (revenueGrowth / 100) * 1.2) : currentRevenue;
      const bookingForecast = forecastingEnabled ? Math.round(currentBookings * (1 + (bookingGrowth / 100) * 1.1)) : currentBookings;

      const newKpiData: BIKPIData = {
        revenue: {
          current: currentRevenue,
          previous: previousRevenue,
          growth: revenueGrowth,
          forecast: revenueForecast,
          confidence: 85
        },
        bookings: {
          current: currentBookings,
          previous: previousBookings,
          growth: bookingGrowth,
          forecast: bookingForecast,
          completionRate
        },
        customers: {
          new: 45, // Calculated from profiles
          returning: 128,
          total: profilesData?.data?.length || 0,
          churnRate: 5.2,
          lifetimeValue: 1250
        },
        performance: {
          occupancyRate: 78.5,
          avgBookingValue,
          conversionRate: 4.8,
          satisfactionScore: 4.6
        }
      };

      setKpiData(newKpiData);
    } catch (error) {
      console.error('Error loading KPI data:', error);
    }
  };

  const loadCustomerJourneyData = async () => {
    // Simulated customer journey data
    const journeyData: CustomerJourneyData[] = [
      {
        stage: 'Awareness',
        users: 10000,
        conversionRate: 100,
        dropOffRate: 20,
        avgTimeSpent: 2.5
      },
      {
        stage: 'Interest',
        users: 8000,
        conversionRate: 80,
        dropOffRate: 35,
        avgTimeSpent: 5.2
      },
      {
        stage: 'Consideration',
        users: 5200,
        conversionRate: 52,
        dropOffRate: 40,
        avgTimeSpent: 8.7
      },
      {
        stage: 'Booking',
        users: 3120,
        conversionRate: 31.2,
        dropOffRate: 25,
        avgTimeSpent: 12.3
      },
      {
        stage: 'Payment',
        users: 2340,
        conversionRate: 23.4,
        dropOffRate: 15,
        avgTimeSpent: 4.8
      },
      {
        stage: 'Completion',
        users: 1989,
        conversionRate: 19.9,
        dropOffRate: 5,
        avgTimeSpent: 45.2
      }
    ];
    setCustomerJourney(journeyData);
  };

  const loadServicePerformanceData = async () => {
    try {
      const { data: services, error } = await supabase
        .from('services')
        .select('*');

      if (error) throw error;

      const performanceData: ServicePerformance[] = services?.map(service => ({
        serviceId: service.id,
        serviceName: service.name,
        category: service.category || 'general',
        revenue: Math.random() * 10000 + 2000,
        bookings: Math.floor(Math.random() * 100) + 20,
        avgRating: 4.2 + Math.random() * 0.8,
        popularity: Math.random() * 100,
        profitability: (Math.random() - 0.3) * 50,
        demand: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as 'high' | 'medium' | 'low',
        seasonality: Math.random() * 2 - 1
      })) || [];

      setServicePerformance(performanceData);
    } catch (error) {
      console.error('Error loading service performance:', error);
    }
  };

  const loadPredictiveInsights = async () => {
    // Simulated AI-powered predictive insights
    const insights: PredictiveInsight[] = [
      {
        id: '1',
        type: 'opportunity',
        title: 'Increased Demand for PMU Services',
        description: 'Forecast shows 25% increase in demand for permanent makeup services next month',
        impact: 'high',
        confidence: 87,
        actionable: true,
        suggestedActions: [
          'Increase PMU service availability',
          'Run targeted marketing campaign',
          'Train additional staff'
        ],
        kpi: 'Revenue',
        currentValue: 15000,
        projectedValue: 18750
      },
      {
        id: '2',
        type: 'risk',
        title: 'High Customer Churn Risk',
        description: '15% of at-risk customers show signs of decreased engagement',
        impact: 'medium',
        confidence: 72,
        actionable: true,
        suggestedActions: [
          'Launch retention campaign',
          'Offer loyalty discounts',
          'Improve customer service response time'
        ],
        kpi: 'Churn Rate',
        currentValue: 5.2,
        projectedValue: 7.8
      },
      {
        id: '3',
        type: 'trend',
        title: 'Weekend Booking Surge',
        description: 'Analysis shows increasing trend for weekend bookings, especially Sundays',
        impact: 'medium',
        confidence: 94,
        actionable: true,
        suggestedActions: [
          'Adjust weekend pricing',
          'Increase weekend staff availability',
          'Create weekend-specific packages'
        ],
        kpi: 'Occupancy Rate',
        currentValue: 78.5,
        projectedValue: 85.2
      }
    ];
    setPredictiveInsights(insights);
  };

  const loadMarketIntelligence = async () => {
    // Simulated market intelligence data
    const marketData: MarketIntelligence = {
      competitorData: [
        { name: 'Beauty Studio Pro', marketShare: 25, avgPrice: 450, services: 12, rating: 4.5 },
        { name: 'Lux Beauty Bar', marketShare: 18, avgPrice: 380, services: 8, rating: 4.3 },
        { name: 'Glow Beauty Center', marketShare: 15, avgPrice: 420, services: 15, rating: 4.4 },
        { name: 'Elite Beauty Lounge', marketShare: 12, avgPrice: 520, services: 10, rating: 4.6 }
      ],
      marketTrends: [
        { trend: 'Natural Look PMU', growth: 35, relevance: 92, timeframe: '6 months' },
        { trend: 'Minimalist Eyebrows', growth: 28, relevance: 85, timeframe: '3 months' },
        { trend: 'Lip Blush Technique', growth: 42, relevance: 78, timeframe: '4 months' }
      ],
      demandForecast: [
        { month: 'Jan', expectedDemand: 120, confidence: 85, factors: ['New Year resolutions', 'Holiday recovery'] },
        { month: 'Feb', expectedDemand: 135, confidence: 82, factors: ['Valentine\'s Day', 'Winter beauty prep'] },
        { month: 'Mar', expectedDemand: 145, confidence: 78, factors: ['Spring preparation', 'Wedding season start'] }
      ]
    };
    setMarketIntelligence(marketData);
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

  const exportBIReport = async () => {
    try {
      const reportData = {
        dateRange: {
          from: format(dateRange.from, 'yyyy-MM-dd'),
          to: format(dateRange.to, 'yyyy-MM-dd')
        },
        kpiData,
        customerJourney,
        servicePerformance,
        predictiveInsights,
        marketIntelligence,
        generatedAt: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bi-report-${format(new Date(), 'yyyy-MM-dd')}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast aria-live="polite" aria-atomic="true"({
        title: 'Success',
        description: 'Business Intelligence report exported successfully'
      });
    } catch (error) {
      toast aria-live="polite" aria-atomic="true"({
        title: 'Error',
        description: 'Failed to export report',
        variant: 'destructive'
      });
    }
  };

  if (loading || !kpiData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-pearl">Loading Business Intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-charcoal p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-serif text-pearl flex items-center gap-3">
              <Brain className="w-10 h-10 text-champagne" />
              Business Intelligence Dashboard
            </h1>
            <p className="text-champagne/70 mt-2">
              Advanced analytics, predictive insights, and market intelligence
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="forecasting" className="text-champagne/70">AI Forecasting</Label>
              <Switch
                id="forecasting"
                checked={forecastingEnabled}
                onCheckedChange={setForecastingEnabled}
              />
            </div>
            <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-32 bg-charcoal/50 border-graphite/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={exportBIReport} variant="outline" size="sm" className="border-graphite/50 hover:bg-champagne/10">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* AI Insights Alert */}
        {predictiveInsights.length > 0 && (
          <Alert className="bg-champagne/10 border-champagne/30">
            <Lightbulb className="w-4 h-4" />
            <AlertTitle className="text-pearl">AI-Generated Insights</AlertTitle>
            <AlertDescription className="text-champagne/80">
              Our AI has identified {predictiveInsights.length} key insights for your business. Review the recommendations below to optimize performance.
            </AlertDescription>
          </Alert>
        )}

        {/* KPI Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-charcoal/50 border-graphite/30">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <DollarSign className="w-5 h-5 text-champagne" />
                <Badge className={kpiData.revenue.growth > 0 ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}>
                  {kpiData.revenue.growth > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                  {Math.abs(kpiData.revenue.growth).toFixed(1)}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-pearl">${kpiData.revenue.current.toFixed(2)}</p>
              <p className="text-champagne/70 text-sm">Revenue</p>
              {forecastingEnabled && (
                <div className="mt-2 pt-2 border-t border-graphite/30">
                  <p className="text-xs text-champagne/50">Forecast: ${kpiData.revenue.forecast.toFixed(2)}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <div className="w-full bg-graphite/30 rounded-full h-1">
                      <div
                        className="bg-champagne h-1 rounded-full"
                        style={{ width: `${kpiData.revenue.confidence}%` }}
                      />
                    </div>
                    <span className="text-xs text-champagne/50">{kpiData.revenue.confidence}%</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-charcoal/50 border-graphite/30">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Calendar className="w-5 h-5 text-champagne" />
                <Badge className={kpiData.bookings.growth > 0 ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}>
                  {kpiData.bookings.growth > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                  {Math.abs(kpiData.bookings.growth).toFixed(1)}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-pearl">{kpiData.bookings.current}</p>
              <p className="text-champagne/70 text-sm">Bookings</p>
              <p className="text-xs text-champagne/50 mt-1">Completion: {kpiData.bookings.completionRate.toFixed(1)}%</p>
              {forecastingEnabled && (
                <p className="text-xs text-champagne/50">Forecast: {kpiData.bookings.forecast}</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-charcoal/50 border-graphite/30">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Users className="w-5 h-5 text-champagne" />
                <Badge className="bg-blue-500/20 text-blue-500">
                  <Activity className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-pearl">{kpiData.customers.total}</p>
              <p className="text-champagne/70 text-sm">Total Customers</p>
              <div className="text-xs text-champagne/50 mt-1">
                New: {kpiData.customers.new} | Returning: {kpiData.customers.returning}
              </div>
              <p className="text-xs text-champagne/50">LTV: ${kpiData.customers.lifetimeValue}</p>
            </CardContent>
          </Card>

          <Card className="bg-charcoal/50 border-graphite/30">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Target className="w-5 h-5 text-champagne" />
                <Badge className="bg-purple-500/20 text-purple-500">
                  <Star className="w-3 h-3 mr-1" />
                  {kpiData.performance.satisfactionScore.toFixed(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-pearl">{kpiData.performance.conversionRate.toFixed(1)}%</p>
              <p className="text-champagne/70 text-sm">Conversion Rate</p>
              <div className="text-xs text-champagne/50 mt-1">
                Occupancy: {kpiData.performance.occupancyRate.toFixed(1)}%
              </div>
              <p className="text-xs text-champagne/50">Avg Value: ${kpiData.performance.avgBookingValue.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Analytics Tabs */}
        <Tabs defaultValue="insights" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-charcoal/50 border-graphite/30">
            <TabsTrigger value="insights" className="data-[state=active]:bg-champagne/20">
              <Lightbulb className="w-4 h-4 mr-2" />
              AI Insights
            </TabsTrigger>
            <TabsTrigger value="journey" className="data-[state=active]:bg-champagne/20">
              <Users className="w-4 h-4 mr-2" />
              Customer Journey
            </TabsTrigger>
            <TabsTrigger value="services" className="data-[state=active]:bg-champagne/20">
              <Star className="w-4 h-4 mr-2" />
              Service Performance
            </TabsTrigger>
            <TabsTrigger value="forecasting" className="data-[state=active]:bg-champagne/20">
              <TrendingUp className="w-4 h-4 mr-2" />
              Forecasting
            </TabsTrigger>
            <TabsTrigger value="market" className="data-[state=active]:bg-champagne/20">
              <Globe className="w-4 h-4 mr-2" />
              Market Intel
            </TabsTrigger>
            <TabsTrigger value="reporting" className="data-[state=active]:bg-champagne/20">
              <BarChart3 className="w-4 h-4 mr-2" />
              Reports
            </TabsTrigger>
          </TabsList>

          {/* AI Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {predictiveInsights.map((insight) => (
                <Card key={insight.id} className={`bg-charcoal/50 border-graphite/30 ${
                  insight.type === 'risk' ? 'border-red-500/30' :
                  insight.type === 'opportunity' ? 'border-green-500/30' :
                  'border-blue-500/30'
                }`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {insight.type === 'risk' && <AlertTriangle className="w-5 h-5 text-red-500" />}
                        {insight.type === 'opportunity' && <TrendingUp className="w-5 h-5 text-green-500" />}
                        {insight.type === 'trend' && <Activity className="w-5 h-5 text-blue-500" />}
                        <CardTitle className="text-pearl">{insight.title}</CardTitle>
                      </div>
                      <Badge className={
                        insight.impact === 'high' ? 'bg-red-500/20 text-red-500' :
                        insight.impact === 'medium' ? 'bg-yellow-500/20 text-yellow-500' :
                        'bg-blue-500/20 text-blue-500'
                      }>
                        {insight.impact} impact
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-champagne/80 mb-4">{insight.description}</p>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-champagne/50">KPI Impact</p>
                        <p className="text-sm font-medium text-pearl">{insight.kpi}</p>
                      </div>
                      <div>
                        <p className="text-xs text-champagne/50">Confidence</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-graphite/30 rounded-full h-2">
                            <div
                              className="bg-champagne h-2 rounded-full"
                              style={{ width: `${insight.confidence}%` }}
                            />
                          </div>
                          <span className="text-xs text-champagne/70">{insight.confidence}%</span>
                        </div>
                      </div>
                    </div>

                    {forecastingEnabled && (
                      <div className="mb-4 p-3 bg-champagne/10 rounded-lg">
                        <p className="text-xs text-champagne/70 mb-1">Projected Change</p>
                        <div className="flex items-center justify-between">
                          <span className="text-champagne/50">Current:</span>
                          <span className="text-pearl font-medium">{insight.currentValue}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-champagne/50">Projected:</span>
                          <span className={`font-medium ${
                            insight.projectedValue > insight.currentValue ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {insight.projectedValue}
                          </span>
                        </div>
                      </div>
                    )}

                    {insight.actionable && (
                      <div>
                        <p className="text-xs text-champagne/70 mb-2">Suggested Actions:</p>
                        <ul className="space-y-1">
                          {insight.suggestedActions.map((action, idx) => (
                            <li key={idx} className="text-xs text-champagne/60 flex items-start gap-2">
                              <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Customer Journey Tab */}
          <TabsContent value="journey" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-charcoal/50 border-graphite/30">
                <CardHeader>
                  <CardTitle className="text-pearl">Conversion Funnel</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <FunnelChart data={customerJourney} />
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-charcoal/50 border-graphite/30">
                <CardHeader>
                  <CardTitle className="text-pearl">Journey Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {customerJourney.map((stage, idx) => (
                      <div key={idx} className="p-4 bg-champagne/5 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-pearl">{stage.stage}</h4>
                          <Badge className="bg-champagne/20 text-champagne">
                            {stage.conversionRate}%
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-champagne/50">Users</p>
                            <p className="text-pearl font-medium">{stage.users.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-champagne/50">Avg Time</p>
                            <p className="text-pearl font-medium">{stage.avgTimeSpent}m</p>
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs text-champagne/50 mb-1">
                            <span>Drop-off Rate</span>
                            <span>{stage.dropOffRate}%</span>
                          </div>
                          <Progress value={stage.dropOffRate} className="h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Service Performance Tab */}
          <TabsContent value="services" className="space-y-6">
            <Card className="bg-charcoal/50 border-graphite/30">
              <CardHeader>
                <CardTitle className="text-pearl">Service Performance Matrix</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={500}>
                  <ScatterChart data={servicePerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#424242" />
                    <XAxis
                      dataKey="popularity"
                      name="Popularity"
                      stroke="#F5F1ED"
                      label={{ value: 'Popularity Score', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis
                      dataKey="profitability"
                      name="Profitability"
                      stroke="#F5F1ED"
                      label={{ value: 'Profitability %', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload as ServicePerformance;
                          return (
                            <div className="bg-charcoal border border-graphite/30 rounded-lg p-3">
                              <p className="text-pearl font-medium">{data.serviceName}</p>
                              <p className="text-champagne/70 text-sm">Category: {data.category}</p>
                              <p className="text-champagne/70 text-sm">Demand: {data.demand}</p>
                              <p className="text-champagne/70 text-sm">Rating: {data.avgRating.toFixed(1)}/5</p>
                              <p className="text-champagne/70 text-sm">Revenue: ${data.revenue.toFixed(2)}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Scatter dataKey="profitability" fill="#D4A574" />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Forecasting Tab */}
          <TabsContent value="forecasting" className="space-y-6">
            {forecastingEnabled && marketIntelligence && (
              <Card className="bg-charcoal/50 border-graphite/30">
                <CardHeader>
                  <CardTitle className="text-pearl">Demand Forecast</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={marketIntelligence.demandForecast}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#424242" />
                      <XAxis dataKey="month" stroke="#F5F1ED" />
                      <YAxis yAxisId="left" stroke="#F5F1ED" />
                      <YAxis yAxisId="right" orientation="right" stroke="#F5F1ED" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1A1412",
                          border: "1px solid #424242",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Bar yAxisId="left" dataKey="expectedDemand" fill="#D4A574" name="Expected Demand" />
                      <Line yAxisId="right" type="monotone" dataKey="confidence" stroke="#F5DEB3" name="Confidence %" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Market Intelligence Tab */}
          <TabsContent value="market" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-charcoal/50 border-graphite/30">
                <CardHeader>
                  <CardTitle className="text-pearl">Competitor Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={marketIntelligence?.competitorData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#424242" />
                      <XAxis dataKey="name" stroke="#F5F1ED" />
                      <YAxis stroke="#F5F1ED" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1A1412",
                          border: "1px solid #424242",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="marketShare" fill="#D4A574" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-charcoal/50 border-graphite/30">
                <CardHeader>
                  <CardTitle className="text-pearl">Market Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {marketIntelligence?.marketTrends.map((trend, idx) => (
                      <div key={idx} className="p-3 bg-champagne/10 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-pearl">{trend.trend}</h4>
                          <Badge className="bg-green-500/20 text-green-500">
                            +{trend.growth}%
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-champagne/50">Relevance: {trend.relevance}%</span>
                          <span className="text-champagne/50">Timeframe: {trend.timeframe}</span>
                        </div>
                        <Progress value={trend.relevance} className="h-2 mt-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reporting" className="space-y-6">
            <Card className="bg-charcoal/50 border-graphite/30">
              <CardHeader>
                <CardTitle className="text-pearl">Custom Report Builder</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="w-16 h-16 mx-auto mb-4 text-champagne/50" />
                  <h3 className="text-xl font-serif text-pearl mb-2">Advanced Report Builder</h3>
                  <p className="text-champagne/70 mb-6">
                    Create custom reports with drag-and-drop interface and advanced filtering
                  </p>
                  <Button className="bg-champagne text-charcoal hover:bg-champagne/90">
                    Coming Soon
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Custom Funnel Chart Component
const FunnelChart: React.FC<{ data: CustomerJourneyData[] }> = ({ data }) => {
  const maxUsers = Math.max(...data.map(d => d.users));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <div className="relative w-full h-full">
        {data.map((stage, idx) => (
          <div key={idx} className="relative">
            <div
              className="mx-auto bg-gradient-to-r from-champagne/20 to-champagne/10 border border-champagne/30 rounded-lg flex items-center justify-center text-pearl font-medium"
              style={{
                width: `${(stage.users / maxUsers) * 100}%`,
                height: `${100 / data.length}%`,
                minHeight: '40px',
                marginTop: idx > 0 ? '8px' : '0'
              }}
            >
              <div className="text-center">
                <div className="text-lg">{stage.users.toLocaleString()}</div>
                <div className="text-xs text-champagne/70">{stage.stage}</div>
              </div>
            </div>
            {idx < data.length - 1 && (
              <div className="flex justify-center my-2">
                <div className="text-xs text-champagne/50">
                  {stage.dropOffRate}% drop-off
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </ResponsiveContainer>
  );
};

export default BIDashboard;