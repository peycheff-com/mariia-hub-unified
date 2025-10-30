import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Scatter
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Calendar,
  Target,
  AlertTriangle,
  Download,
  RefreshCw,
  Zap,
  PieChart,
  Activity,
  Brain,
  FileText,
  Settings
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { businessIntelligenceService } from '@/services/business-intelligence.service';
import { AnalyticsFilters } from '@/types/analytics';
import { useToast } from '@/hooks/use-toast aria-live="polite" aria-atomic="true"';

interface RevenueForecastData {
  currentPeriod: {
    actualRevenue: number;
    projectedRevenue: number;
    variance: number;
    variancePercentage: number;
    completedBookings: number;
    totalBookings: number;
    averageOrderValue: number;
  };
  forecastPeriods: Array<{
    period: string;
    lowerBound: number;
    expected: number;
    upperBound: number;
    confidence: number;
    factors: string[];
  }>;
  revenueStreams: Array<{
    stream: string;
    current: number;
    projected: number;
    growth: number;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  stripeMetrics: {
    totalVolume: number;
    successfulPayments: number;
    failedPayments: number;
    refundRate: number;
    averageProcessingTime: number;
    topPaymentMethods: Array<{
      method: string;
      count: number;
      amount: number;
      percentage: number;
    }>;
  };
  predictiveInsights: Array<{
    type: 'opportunity' | 'risk' | 'trend';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    confidence: number;
    actionable: boolean;
  }>;
  seasonalityData: Array<{
    month: string;
    actual: number;
    seasonal: number;
    trend: number;
  }>;
  revenueByService: Array<{
    serviceName: string;
    current: number;
    projected: number;
    bookings: number;
    avgPrice: number;
    growthRate: number;
  }>;
}

const RevenueForecasting = () => {
  const [forecastData, setForecastData] = useState<RevenueForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [forecastHorizon, setForecastHorizon] = useState('90d');
  const { toast aria-live="polite" aria-atomic="true" } = useToast();

  useEffect(() => {
    loadForecastData();
  }, [selectedPeriod, forecastHorizon]);

  const loadForecastData = async () => {
    try {
      setLoading(true);

      // Mock comprehensive revenue forecasting data
      const mockData: RevenueForecastData = {
        currentPeriod: {
          actualRevenue: 145750,
          projectedRevenue: 160000,
          variance: -14250,
          variancePercentage: -8.9,
          completedBookings: 486,
          totalBookings: 520,
          averageOrderValue: 300
        },
        forecastPeriods: [
          {
            period: 'Week 1',
            lowerBound: 42000,
            expected: 45000,
            upperBound: 48000,
            confidence: 85,
            factors: ['Strong weekend demand', 'Seasonal trends', 'Marketing campaigns']
          },
          {
            period: 'Week 2',
            lowerBound: 44500,
            expected: 47000,
            upperBound: 50000,
            confidence: 82,
            factors: ['New service launch', 'Referral program', 'Holiday prep']
          },
          {
            period: 'Week 3',
            lowerBound: 46000,
            expected: 49000,
            upperBound: 53000,
            confidence: 78,
            factors: ['Peak season demand', 'Increased marketing', 'Price optimization']
          },
          {
            period: 'Week 4',
            lowerBound: 48000,
            expected: 52000,
            upperBound: 56000,
            confidence: 75,
            factors: ['Holiday rush', 'Premium services', 'Group bookings']
          }
        ],
        revenueStreams: [
          {
            stream: 'Beauty Services',
            current: 87450,
            projected: 96000,
            growth: 9.8,
            percentage: 60.0,
            trend: 'up'
          },
          {
            stream: 'Fitness Programs',
            current: 43725,
            projected: 48000,
            growth: 9.7,
            percentage: 30.0,
            trend: 'up'
          },
          {
            stream: 'Product Sales',
            current: 8737,
            projected: 9600,
            growth: 9.9,
            percentage: 6.0,
            trend: 'stable'
          },
          {
            stream: 'Premium Packages',
            current: 5838,
            projected: 6400,
            growth: 9.6,
            percentage: 4.0,
            trend: 'up'
          }
        ],
        stripeMetrics: {
          totalVolume: 145750,
          successfulPayments: 486,
          failedPayments: 34,
          refundRate: 2.1,
          averageProcessingTime: 1.2,
          topPaymentMethods: [
            { method: 'Card', count: 412, amount: 123600, percentage: 84.8 },
            { method: 'Apple Pay', count: 48, amount: 14400, percentage: 9.9 },
            { method: 'Google Pay', count: 18, amount: 5400, percentage: 3.7 },
            { method: 'Bank Transfer', count: 8, amount: 2350, percentage: 1.6 }
          ]
        },
        predictiveInsights: [
          {
            type: 'opportunity',
            title: 'Weekend Revenue Surge Expected',
            description: 'Historical data indicates 35% higher revenue on weekends. Consider increasing capacity and premium pricing.',
            impact: 'high',
            confidence: 89,
            actionable: true
          },
          {
            type: 'risk',
            title: 'Payment Processing Issues Detected',
            description: '6.5% payment failure rate is above industry average. Review payment gateway configuration.',
            impact: 'medium',
            confidence: 76,
            actionable: true
          },
          {
            type: 'trend',
            title: 'Beauty Services Outperforming Projections',
            description: 'Beauty services showing 15% higher than projected growth. Consider expanding offerings.',
            impact: 'high',
            confidence: 92,
            actionable: true
          },
          {
            type: 'opportunity',
            title: 'Premium Package Demand Rising',
            description: 'Premium packages showing strong uptake. Opportunity to create tiered pricing strategy.',
            impact: 'medium',
            confidence: 71,
            actionable: true
          }
        ],
        seasonalityData: [
          { month: 'Jan', actual: 120000, seasonal: 115000, trend: 105000 },
          { month: 'Feb', actual: 135000, seasonal: 125000, trend: 108000 },
          { month: 'Mar', actual: 145750, seasonal: 140000, trend: 112000 },
          { month: 'Apr', actual: 0, seasonal: 155000, trend: 125000 },
          { month: 'May', actual: 0, seasonal: 165000, trend: 138000 },
          { month: 'Jun', actual: 0, seasonal: 175000, trend: 152000 }
        ],
        revenueByService: [
          {
            serviceName: 'Lip Enhancements',
            current: 54000,
            projected: 58000,
            bookings: 216,
            avgPrice: 250,
            growthRate: 7.4
          },
          {
            serviceName: 'Brow Lamination',
            current: 33450,
            projected: 38000,
            bookings: 167,
            avgPrice: 200,
            growthRate: 13.7
          },
          {
            serviceName: 'Glutes Training',
            current: 27000,
            projected: 28500,
            bookings: 135,
            avgPrice: 200,
            growthRate: 5.6
          },
          {
            serviceName: 'Starter Program',
            current: 13500,
            projected: 12000,
            bookings: 90,
            avgPrice: 150,
            growthRate: -11.1
          },
          {
            serviceName: 'Premium Packages',
            current: 17800,
            projected: 23500,
            bookings: 35,
            avgPrice: 509,
            growthRate: 32.0
          }
        ]
      };

      setForecastData(mockData);

    } catch (error) {
      toast aria-live="polite" aria-atomic="true"({
        title: 'Error',
        description: 'Failed to load revenue forecasting data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getVarianceColor = (variance: number) => {
    if (variance > 5) return 'text-green-400';
    if (variance < -5) return 'text-red-400';
    return 'text-yellow-400';
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'opportunity': return 'bg-green-500/20 border-green-500/50 text-green-400';
      case 'risk': return 'bg-red-500/20 border-red-500/50 text-red-400';
      case 'trend': return 'bg-blue-500/20 border-blue-500/50 text-blue-400';
      default: return 'bg-gray-500/20 border-gray-500/50 text-gray-400';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-500/20 text-red-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'low': return 'bg-green-500/20 text-green-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3">
          <Brain className="w-6 h-6 text-champagne animate-pulse" />
          <span className="text-pearl">Analyzing revenue patterns and generating forecasts...</span>
        </div>
      </div>
    );
  }

  if (!forecastData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-pearl/60">No revenue data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="w-8 h-8 text-champagne" />
          <div>
            <h1 className="text-3xl font-serif text-pearl">Revenue Forecasting & Analytics</h1>
            <p className="text-pearl/60">AI-powered revenue predictions and Stripe payment insights</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40 bg-charcoal/50 border-champagne/30 text-pearl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>

          <Select value={forecastHorizon} onValueChange={setForecastHorizon}>
            <SelectTrigger className="w-40 bg-charcoal/50 border-champagne/30 text-pearl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
              <SelectItem value="180d">180 Days</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={loadForecastData}
            className="border-champagne/30 text-pearl hover:bg-champagne/10"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="border-champagne/30 text-pearl hover:bg-champagne/10"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Current Period Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-charcoal/50 border-graphite/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-pearl/70 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Actual Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-pearl">
              {formatCurrency(forecastData.currentPeriod.actualRevenue)}
            </div>
            <div className="text-xs text-pearl/60 mt-1">
              vs {formatCurrency(forecastData.currentPeriod.projectedRevenue)} projected
            </div>
          </CardContent>
        </Card>

        <Card className="bg-charcoal/50 border-graphite/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-pearl/70 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Variance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getVarianceColor(forecastData.currentPeriod.variancePercentage)}`}>
              {formatCurrency(forecastData.currentPeriod.variance)}
            </div>
            <div className={`text-xs mt-1 ${getVarianceColor(forecastData.currentPeriod.variancePercentage)}`}>
              {formatPercentage(forecastData.currentPeriod.variancePercentage)} variance
            </div>
          </CardContent>
        </Card>

        <Card className="bg-charcoal/50 border-graphite/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-pearl/70 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Booking Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-pearl">
              {formatPercentage((forecastData.currentPeriod.completedBookings / forecastData.currentPeriod.totalBookings) * 100)}
            </div>
            <div className="text-xs text-pearl/60 mt-1">
              {forecastData.currentPeriod.completedBookings} of {forecastData.currentPeriod.totalBookings} bookings
            </div>
          </CardContent>
        </Card>

        <Card className="bg-charcoal/50 border-graphite/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-pearl/70 flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Avg Order Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-champagne">
              {formatCurrency(forecastData.currentPeriod.averageOrderValue)}
            </div>
            <div className="text-xs text-pearl/60 mt-1">
              Per completed booking
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="forecast" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="forecast">Revenue Forecast</TabsTrigger>
          <TabsTrigger value="stripe">Stripe Analytics</TabsTrigger>
          <TabsTrigger value="streams">Revenue Streams</TabsTrigger>
          <TabsTrigger value="seasonality">Seasonality</TabsTrigger>
          <TabsTrigger value="services">Service Performance</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        {/* Revenue Forecast Tab */}
        <TabsContent value="forecast" className="space-y-6">
          <Card className="bg-charcoal/50 border-graphite/30">
            <CardHeader>
              <CardTitle className="text-pearl flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Revenue Forecast with Confidence Intervals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={forecastData.forecastPeriods}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#424242" />
                  <XAxis dataKey="period" stroke="#F5F1ED" />
                  <YAxis stroke="#F5F1ED" tickFormatter={(value) => `${value/1000}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1A1412",
                      border: "1px solid #424242",
                      borderRadius: "8px",
                    }}
                    formatter={(value: any, name: string) => [
                      formatCurrency(value),
                      name === 'lowerBound' ? 'Lower Bound' :
                      name === 'expected' ? 'Expected' :
                      name === 'upperBound' ? 'Upper Bound' : name
                    ]}
                    labelFormatter={(label) => {
                      const period = forecastData.forecastPeriods.find(p => p.period === label);
                      return `${label} (${period?.confidence}% confidence)`;
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="upperBound"
                    stroke="#10b981"
                    fill="transparent"
                    strokeWidth={1}
                    strokeDasharray="5 5"
                  />
                  <Area
                    type="monotone"
                    dataKey="expected"
                    stroke="#D4A574"
                    fill="#D4A574"
                    fillOpacity={0.6}
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="lowerBound"
                    stroke="#ef4444"
                    fill="transparent"
                    strokeWidth={1}
                    strokeDasharray="5 5"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Forecast Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-charcoal/50 border-graphite/30">
              <CardHeader>
                <CardTitle className="text-pearl">Forecast Periods</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {forecastData.forecastPeriods.map((period, index) => (
                    <div key={index} className="p-3 bg-charcoal/30 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-pearl font-medium">{period.period}</h4>
                        <Badge className="bg-blue-500/20 text-blue-400">
                          {period.confidence}% confidence
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <div className="text-red-400">{formatCurrency(period.lowerBound)}</div>
                          <div className="text-pearl/60 text-xs">Lower</div>
                        </div>
                        <div>
                          <div className="text-champagne font-medium">{formatCurrency(period.expected)}</div>
                          <div className="text-pearl/60 text-xs">Expected</div>
                        </div>
                        <div>
                          <div className="text-green-400">{formatCurrency(period.upperBound)}</div>
                          <div className="text-pearl/60 text-xs">Upper</div>
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="text-xs text-pearl/60">Key factors:</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {period.factors.map((factor, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {factor}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-charcoal/50 border-graphite/30">
              <CardHeader>
                <CardTitle className="text-pearl">Forecast Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-charcoal/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-pearl/80">Total Expected Revenue</span>
                      <span className="text-xl font-bold text-champagne">
                        {formatCurrency(forecastData.forecastPeriods.reduce((sum, p) => sum + p.expected, 0))}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 bg-charcoal/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-pearl/80">Best Case Scenario</span>
                      <span className="text-xl font-bold text-green-400">
                        {formatCurrency(forecastData.forecastPeriods.reduce((sum, p) => sum + p.upperBound, 0))}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 bg-charcoal/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-pearl/80">Worst Case Scenario</span>
                      <span className="text-xl font-bold text-red-400">
                        {formatCurrency(forecastData.forecastPeriods.reduce((sum, p) => sum + p.lowerBound, 0))}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 bg-charcoal/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-pearl/80">Average Confidence</span>
                      <span className="text-xl font-bold text-blue-400">
                        {formatPercentage(forecastData.forecastPeriods.reduce((sum, p) => sum + p.confidence, 0) / forecastData.forecastPeriods.length)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Stripe Analytics Tab */}
        <TabsContent value="stripe" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="bg-charcoal/50 border-graphite/30">
              <CardHeader>
                <CardTitle className="text-pearl flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Stripe Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-pearl/80">Total Volume</span>
                    <span className="text-champagne font-medium">
                      {formatCurrency(forecastData.stripeMetrics.totalVolume)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-pearl/80">Successful Payments</span>
                    <span className="text-green-400 font-medium">
                      {forecastData.stripeMetrics.successfulPayments}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-pearl/80">Failed Payments</span>
                    <span className="text-red-400 font-medium">
                      {forecastData.stripeMetrics.failedPayments}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-pearl/80">Refund Rate</span>
                    <span className="text-yellow-400 font-medium">
                      {formatPercentage(forecastData.stripeMetrics.refundRate)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-pearl/80">Avg Processing Time</span>
                    <span className="text-blue-400 font-medium">
                      {forecastData.stripeMetrics.averageProcessingTime}s
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 bg-charcoal/50 border-graphite/30">
              <CardHeader>
                <CardTitle className="text-pearl">Payment Methods Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={forecastData.stripeMetrics.topPaymentMethods}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#424242" />
                    <XAxis dataKey="method" stroke="#F5F1ED" />
                    <YAxis stroke="#F5F1ED" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1A1412",
                        border: "1px solid #424242",
                        borderRadius: "8px",
                      }}
                      formatter={(value: any, name: string) => [
                        name === 'amount' ? formatCurrency(value) :
                        name === 'percentage' ? `${value.toFixed(1)}%` :
                        value.toLocaleString(),
                        name === 'amount' ? 'Revenue' :
                        name === 'percentage' ? 'Percentage' : 'Transactions'
                      ]}
                    />
                    <Legend />
                    <Bar dataKey="count" fill="#3b82f6" name="Transactions" />
                    <Bar dataKey="amount" fill="#10b981" name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Revenue Streams Tab */}
        <TabsContent value="streams" className="space-y-6">
          <Card className="bg-charcoal/50 border-graphite/30">
            <CardHeader>
              <CardTitle className="text-pearl">Revenue Streams Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={forecastData.revenueStreams}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#424242" />
                  <XAxis dataKey="stream" stroke="#F5F1ED" />
                  <YAxis yAxisId="left" stroke="#F5F1ED" tickFormatter={(value) => `${value/1000}k`} />
                  <YAxis yAxisId="right" orientation="right" stroke="#F5F1ED" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1A1412",
                      border: "1px solid #424242",
                      borderRadius: "8px",
                    }}
                    formatter={(value: any, name: string) => [
                      name === 'growth' ? `${value.toFixed(1)}%` :
                      name === 'current' || name === 'projected' ? formatCurrency(value) :
                      name === 'percentage' ? `${value.toFixed(1)}%` :
                      value,
                      name === 'growth' ? 'Growth Rate' :
                      name === 'current' ? 'Current' :
                      name === 'projected' ? 'Projected' :
                      name === 'percentage' ? 'Share' : name
                    ]}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="current" fill="#3b82f6" name="Current Revenue" />
                  <Bar yAxisId="left" dataKey="projected" fill="#10b981" name="Projected Revenue" />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="growth"
                    stroke="#D4A574"
                    strokeWidth={3}
                    name="Growth Rate %"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Seasonality Tab */}
        <TabsContent value="seasonality" className="space-y-6">
          <Card className="bg-charcoal/50 border-graphite/30">
            <CardHeader>
              <CardTitle className="text-pearl">Seasonal Revenue Patterns</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={forecastData.seasonalityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#424242" />
                  <XAxis dataKey="month" stroke="#F5F1ED" />
                  <YAxis stroke="#F5F1ED" tickFormatter={(value) => `${value/1000}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1A1412",
                      border: "1px solid #424242",
                      borderRadius: "8px",
                    }}
                    formatter={(value: any) => [formatCurrency(value), 'Revenue']}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Actual"
                  />
                  <Line
                    type="monotone"
                    dataKey="seasonal"
                    stroke="#10b981"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Seasonal Average"
                  />
                  <Line
                    type="monotone"
                    dataKey="trend"
                    stroke="#D4A574"
                    strokeWidth={2}
                    name="Underlying Trend"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Service Performance Tab */}
        <TabsContent value="services" className="space-y-6">
          <Card className="bg-charcoal/50 border-graphite/30">
            <CardHeader>
              <CardTitle className="text-pearl">Service Revenue Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={forecastData.revenueByService}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#424242" />
                  <XAxis dataKey="serviceName" stroke="#F5F1ED" angle={-45} textAnchor="end" height={100} />
                  <YAxis stroke="#F5F1ED" tickFormatter={(value) => `${value/1000}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1A1412",
                      border: "1px solid #424242",
                      borderRadius: "8px",
                    }}
                    formatter={(value: any, name: string) => [
                      name === 'growthRate' ? `${value.toFixed(1)}%` :
                      name === 'avgPrice' ? formatCurrency(value) :
                      formatCurrency(value),
                      name === 'growthRate' ? 'Growth Rate' :
                      name === 'avgPrice' ? 'Avg Price' :
                      name === 'current' ? 'Current Revenue' : 'Projected Revenue'
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="current" fill="#3b82f6" name="Current Revenue" />
                  <Bar dataKey="projected" fill="#10b981" name="Projected Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-charcoal/50 border-graphite/30">
              <CardHeader>
                <CardTitle className="text-pearl flex items-center gap-2">
                  <Zap className="w-5 h-5 text-champagne" />
                  AI-Powered Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {forecastData.predictiveInsights.map((insight, index) => (
                    <div key={index} className={`p-4 rounded-lg border ${getInsightColor(insight.type)}`}>
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium">{insight.title}</h4>
                        <div className="flex items-center gap-2">
                          <Badge className={getImpactColor(insight.impact)}>
                            {insight.impact} impact
                          </Badge>
                          <Badge variant="outline">
                            {insight.confidence}% confidence
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm mb-2">{insight.description}</p>
                      {insight.actionable && (
                        <Button size="sm" variant="outline" className="mt-2">
                          <Settings className="w-3 h-3 mr-1" />
                          Take Action
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-charcoal/50 border-graphite/30">
              <CardHeader>
                <CardTitle className="text-pearl flex items-center gap-2">
                  <Activity className="w-5 h-5 text-bronze" />
                  Revenue Health Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="text-6xl font-bold text-champagne mb-2">87</div>
                    <div className="text-pearl/60">Overall Revenue Health</div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-pearl/80">Growth Trend</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-700 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                        </div>
                        <span className="text-green-400 text-sm">Strong</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-pearl/80">Forecast Accuracy</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-700 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: '82%' }}></div>
                        </div>
                        <span className="text-blue-400 text-sm">Good</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-pearl/80">Payment Health</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-700 rounded-full h-2">
                          <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                        </div>
                        <span className="text-yellow-400 text-sm">Fair</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-pearl/80">Diversification</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-700 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: '90%' }}></div>
                        </div>
                        <span className="text-green-400 text-sm">Excellent</span>
                      </div>
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

export default RevenueForecasting;