import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Target,
  Clock,
  AlertTriangle,
  Filter,
  Download,
  Eye,
  MousePointer,
  ShoppingCart,
  CreditCard,
  CheckCircle,
  XCircle
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { businessIntelligenceService } from '@/services/business-intelligence.service';
import { AnalyticsFilters, AnalyticsQuery } from '@/types/analytics';
import { useToast } from '@/hooks/use-toast aria-live="polite" aria-atomic="true"';

interface ConversionFunnelData {
  stage: string;
  count: number;
  conversionRate: number;
  dropOffRate: number;
  avgTimeSpent: number;
  icon: React.ReactNode;
}

interface BookingConversionMetrics {
  overallConversionRate: number;
  totalVisitors: number;
  convertedBookings: number;
  revenueFromConversions: number;
  averageTimeToConvert: number;
  abandonmentRate: number;
  conversionBySource: Array<{
    source: string;
    visitors: number;
    conversions: number;
    conversionRate: number;
    revenue: number;
  }>;
  conversionByService: Array<{
    serviceName: string;
    visitors: number;
    conversions: number;
    conversionRate: number;
    revenue: number;
    avgOrderValue: number;
  }>;
  timeSeriesData: Array<{
    date: string;
    visitors: number;
    conversions: number;
    conversionRate: number;
    revenue: number;
  }>;
  funnelAnalysis: ConversionFunnelData[];
  dropOffPoints: Array<{
    stage: string;
    dropOffCount: number;
    dropOffRate: number;
    reasons: string[];
  }>;
}

const BookingConversionAnalytics = () => {
  const [metrics, setMetrics] = useState<BookingConversionMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedService, setSelectedService] = useState('all');
  const { toast aria-live="polite" aria-atomic="true" } = useToast();

  useEffect(() => {
    loadConversionData();
  }, [selectedPeriod, selectedService]);

  const loadConversionData = async () => {
    try {
      setLoading(true);

      // In a real implementation, this would call the BI service
      // For now, we'll create comprehensive mock data
      const mockData: BookingConversionMetrics = {
        overallConversionRate: 23.4,
        totalVisitors: 12450,
        convertedBookings: 2913,
        revenueFromConversions: 485750,
        averageTimeToConvert: 8.5, // minutes
        abandonmentRate: 76.6,
        conversionBySource: [
          {
            source: 'Direct',
            visitors: 3200,
            conversions: 896,
            conversionRate: 28.0,
            revenue: 149750
          },
          {
            source: 'Instagram',
            visitors: 4100,
            conversions: 902,
            conversionRate: 22.0,
            revenue: 150250
          },
          {
            source: 'Google',
            visitors: 2800,
            conversions: 588,
            conversionRate: 21.0,
            revenue: 98000
          },
          {
            source: 'Referral',
            visitors: 1500,
            conversions: 375,
            conversionRate: 25.0,
            revenue: 62500
          },
          {
            source: 'Facebook',
            visitors: 850,
            conversions: 152,
            conversionRate: 17.9,
            revenue: 25250
          }
        ],
        conversionByService: [
          {
            serviceName: 'Lip Enhancements',
            visitors: 3200,
            conversions: 864,
            conversionRate: 27.0,
            revenue: 216000,
            avgOrderValue: 250
          },
          {
            serviceName: 'Brow Lamination',
            visitors: 2800,
            conversions: 728,
            conversionRate: 26.0,
            revenue: 145600,
            avgOrderValue: 200
          },
          {
            serviceName: 'Glutes Training',
            visitors: 2100,
            conversions: 378,
            conversionRate: 18.0,
            revenue: 75600,
            avgOrderValue: 200
          },
          {
            serviceName: 'Starter Program',
            visitors: 1800,
            conversions: 306,
            conversionRate: 17.0,
            revenue: 45900,
            avgOrderValue: 150
          },
          {
            serviceName: 'Premium Package',
            visitors: 950,
            conversions: 285,
            conversionRate: 30.0,
            revenue: 85500,
            avgOrderValue: 300
          }
        ],
        timeSeriesData: generateTimeSeriesData(),
        funnelAnalysis: [
          {
            stage: 'Page View',
            count: 12450,
            conversionRate: 100,
            dropOffRate: 0,
            avgTimeSpent: 2.5,
            icon: <Eye className="w-4 h-4" />
          },
          {
            stage: 'Service Selection',
            count: 8900,
            conversionRate: 71.5,
            dropOffRate: 28.5,
            avgTimeSpent: 4.2,
            icon: <MousePointer className="w-4 h-4" />
          },
          {
            stage: 'Time Slot Selection',
            count: 5200,
            conversionRate: 41.8,
            dropOffRate: 41.6,
            avgTimeSpent: 3.8,
            icon: <Calendar className="w-4 h-4" />
          },
          {
            stage: 'Customer Details',
            count: 3500,
            conversionRate: 28.1,
            dropOffRate: 32.7,
            avgTimeSpent: 6.5,
            icon: <Users className="w-4 h-4" />
          },
          {
            stage: 'Payment',
            count: 3100,
            conversionRate: 24.9,
            dropOffRate: 11.4,
            avgTimeSpent: 4.2,
            icon: <CreditCard className="w-4 h-4" />
          },
          {
            stage: 'Confirmation',
            count: 2913,
            conversionRate: 23.4,
            dropOffRate: 6.0,
            avgTimeSpent: 1.2,
            icon: <CheckCircle className="w-4 h-4" />
          }
        ],
        dropOffPoints: [
          {
            stage: 'Service Selection',
            dropOffCount: 3550,
            dropOffRate: 28.5,
            reasons: ['Price concerns', 'Unclear service description', 'Looking for alternatives']
          },
          {
            stage: 'Time Slot Selection',
            dropOffCount: 3700,
            dropOffRate: 41.6,
            reasons: ['No available slots', 'Unsuitable times', 'Technical issues']
          },
          {
            stage: 'Customer Details',
            dropOffCount: 1700,
            dropOffRate: 32.7,
            reasons: ['Form too long', 'Privacy concerns', 'Technical issues']
          },
          {
            stage: 'Payment',
            dropOffCount: 400,
            dropOffRate: 11.4,
            reasons: ['Payment issues', 'Changed mind', 'Technical problems']
          }
        ]
      };

      setMetrics(mockData);

    } catch (error) {
      toast aria-live="polite" aria-atomic="true"({
        title: 'Error',
        description: 'Failed to load conversion analytics data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const generateTimeSeriesData = () => {
    const data = [];
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      const baseVisitors = 400 + Math.random() * 200;
      const baseConversionRate = 20 + Math.random() * 10;
      const visitors = Math.floor(baseVisitors);
      const conversions = Math.floor(visitors * (baseConversionRate / 100));
      const revenue = conversions * (150 + Math.random() * 100);

      data.push({
        date: date.toISOString().split('T')[0],
        visitors,
        conversions,
        conversionRate: baseConversionRate,
        revenue: Math.floor(revenue)
      });
    }

    return data;
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

  const getConversionColor = (rate: number) => {
    if (rate >= 25) return 'text-green-400';
    if (rate >= 15) return 'text-yellow-400';
    return 'text-red-400';
  };

  const COLORS = ['#8B4513', '#F5DEB3', '#CD853F', '#DEB887', '#D2691E', '#BC8F8F'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3">
          <Target className="w-6 h-6 text-champagne animate-pulse" />
          <span className="text-pearl">Analyzing conversion data...</span>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-pearl/60">No conversion data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Target className="w-8 h-8 text-champagne" />
          <div>
            <h1 className="text-3xl font-serif text-pearl">Booking Conversion Analytics</h1>
            <p className="text-pearl/60">Comprehensive funnel analysis and conversion optimization insights</p>
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
              <SelectItem value="1y">Last Year</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedService} onValueChange={setSelectedService}>
            <SelectTrigger className="w-48 bg-charcoal/50 border-champagne/30 text-pearl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              <SelectItem value="beauty">Beauty Services</SelectItem>
              <SelectItem value="fitness">Fitness Programs</SelectItem>
              <SelectItem value="lifestyle">Lifestyle</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={loadConversionData}
            className="border-champagne/30 text-pearl hover:bg-champagne/10"
          >
            <Filter className="w-4 h-4 mr-2" />
            Apply Filters
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="border-champagne/30 text-pearl hover:bg-champagne/10"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Conversion Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-charcoal/50 border-graphite/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-pearl/70 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-pearl">
              {formatPercentage(metrics.overallConversionRate)}
            </div>
            <div className="text-xs text-pearl/60 mt-1">
              {metrics.convertedBookings} of {metrics.totalVisitors} visitors
            </div>
          </CardContent>
        </Card>

        <Card className="bg-charcoal/50 border-graphite/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-pearl/70 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total Visitors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-pearl">
              {metrics.totalVisitors.toLocaleString()}
            </div>
            <div className="text-xs text-pearl/60 mt-1">
              Unique sessions
            </div>
          </CardContent>
        </Card>

        <Card className="bg-charcoal/50 border-graphite/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-pearl/70 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Converted Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {metrics.convertedBookings.toLocaleString()}
            </div>
            <div className="text-xs text-pearl/60 mt-1">
              Successful conversions
            </div>
          </CardContent>
        </Card>

        <Card className="bg-charcoal/50 border-graphite/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-pearl/70 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-champagne">
              {formatCurrency(metrics.revenueFromConversions)}
            </div>
            <div className="text-xs text-pearl/60 mt-1">
              From conversions
            </div>
          </CardContent>
        </Card>

        <Card className="bg-charcoal/50 border-graphite/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-pearl/70 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Avg Time to Convert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-pearl">
              {metrics.averageTimeToConvert}m
            </div>
            <div className="text-xs text-pearl/60 mt-1">
              Minutes per conversion
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="funnel" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="funnel">Conversion Funnel</TabsTrigger>
          <TabsTrigger value="trends">Trends & Patterns</TabsTrigger>
          <TabsTrigger value="sources">Traffic Sources</TabsTrigger>
          <TabsTrigger value="services">Service Performance</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        {/* Conversion Funnel Tab */}
        <TabsContent value="funnel" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Funnel Visualization */}
            <Card className="bg-charcoal/50 border-graphite/30">
              <CardHeader>
                <CardTitle className="text-pearl flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Conversion Funnel Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <FunnelChart>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1A1412",
                        border: "1px solid #424242",
                        borderRadius: "8px",
                      }}
                      formatter={(value: any, name: string) => [
                        `${value.toLocaleString()} (${formatPercentage((value / metrics.totalVisitors) * 100)})`,
                        name
                      ]}
                    />
                    <Funnel
                      data={metrics.funnelAnalysis.map(stage => ({
                        name: stage.stage,
                        value: stage.count,
                        fill: COLORS[metrics.funnelAnalysis.indexOf(stage) % COLORS.length]
                      }))}
                      dataKey="value"
                      isAnimationActive={true}
                    >
                      <LabelList
                        dataKey="name"
                        position="right"
                        fill="#F5F1ED"
                        style={{ fontSize: '12px' }}
                      />
                      <LabelList
                        dataKey="value"
                        position="center"
                        fill="#F5F1ED"
                        style={{ fontSize: '14px', fontWeight: 'bold' }}
                      />
                    </Funnel>
                  </FunnelChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Drop-off Analysis */}
            <Card className="bg-charcoal/50 border-graphite/30">
              <CardHeader>
                <CardTitle className="text-pearl flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  Drop-off Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.dropOffPoints.map((point, index) => (
                    <div key={index} className="p-3 bg-charcoal/30 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-pearl font-medium">{point.stage}</h4>
                        <Badge className={getConversionColor(point.dropOffRate)}>
                          {formatPercentage(point.dropOffRate)} drop-off
                        </Badge>
                      </div>
                      <div className="text-pearl/80 text-sm mb-2">
                        {point.dropOffCount.toLocaleString()} users lost at this stage
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-pearl/60">Common reasons:</div>
                        {point.reasons.map((reason, i) => (
                          <div key={i} className="text-xs text-pearl/80 flex items-center gap-1">
                            <XCircle className="w-3 h-3 text-red-400" />
                            {reason}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trends & Patterns Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card className="bg-charcoal/50 border-graphite/30">
            <CardHeader>
              <CardTitle className="text-pearl">Conversion Trends Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={metrics.timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#424242" />
                  <XAxis
                    dataKey="date"
                    stroke="#F5F1ED"
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis yAxisId="left" stroke="#F5F1ED" />
                  <YAxis yAxisId="right" orientation="right" stroke="#F5F1ED" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1A1412",
                      border: "1px solid #424242",
                      borderRadius: "8px",
                    }}
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value: any, name: string) => [
                      name === 'conversionRate' ? `${value.toFixed(1)}%` :
                      name === 'revenue' ? formatCurrency(value) :
                      value.toLocaleString(),
                      name === 'conversionRate' ? 'Conversion Rate' :
                      name === 'revenue' ? 'Revenue' :
                      name === 'visitors' ? 'Visitors' : 'Conversions'
                    ]}
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="visitors"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Visitors"
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="conversions"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Conversions"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="conversionRate"
                    stroke="#D4A574"
                    strokeWidth={2}
                    name="Conversion Rate"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Traffic Sources Tab */}
        <TabsContent value="sources" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Conversion by Source */}
            <Card className="bg-charcoal/50 border-graphite/30">
              <CardHeader>
                <CardTitle className="text-pearl">Conversion by Traffic Source</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metrics.conversionBySource}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#424242" />
                    <XAxis dataKey="source" stroke="#F5F1ED" angle={-45} textAnchor="end" height={80} />
                    <YAxis stroke="#F5F1ED" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1A1412",
                        border: "1px solid #424242",
                        borderRadius: "8px",
                      }}
                      formatter={(value: any, name: string) => [
                        name === 'conversionRate' ? `${value.toFixed(1)}%` :
                        name === 'revenue' ? formatCurrency(value) :
                        value.toLocaleString(),
                        name === 'conversionRate' ? 'Conversion Rate' :
                        name === 'revenue' ? 'Revenue' :
                        name === 'visitors' ? 'Visitors' : 'Conversions'
                      ]}
                    />
                    <Legend />
                    <Bar dataKey="visitors" fill="#3b82f6" name="Visitors" />
                    <Bar dataKey="conversions" fill="#10b981" name="Conversions" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Source Performance Table */}
            <Card className="bg-charcoal/50 border-graphite/30">
              <CardHeader>
                <CardTitle className="text-pearl">Source Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.conversionBySource.map((source, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-charcoal/30 rounded-lg">
                      <div>
                        <div className="text-pearl font-medium">{source.source}</div>
                        <div className="text-pearl/60 text-sm">
                          {source.visitors.toLocaleString()} visitors → {source.conversions} conversions
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${getConversionColor(source.conversionRate)}`}>
                          {formatPercentage(source.conversionRate)}
                        </div>
                        <div className="text-champagne text-sm">
                          {formatCurrency(source.revenue)}
                        </div>
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
              <CardTitle className="text-pearl">Service Conversion Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={metrics.conversionByService} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#424242" />
                  <XAxis type="number" stroke="#F5F1ED" />
                  <YAxis dataKey="serviceName" type="category" stroke="#F5F1ED" width={120} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1A1412",
                      border: "1px solid #424242",
                      borderRadius: "8px",
                    }}
                    formatter={(value: any, name: string) => [
                      name === 'conversionRate' ? `${value.toFixed(1)}%` :
                      name === 'avgOrderValue' ? formatCurrency(value) :
                      value.toLocaleString(),
                      name === 'conversionRate' ? 'Conversion Rate' :
                      name === 'avgOrderValue' ? 'Avg Order Value' :
                      name === 'visitors' ? 'Visitors' : 'Conversions'
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="conversionRate" fill="#D4A574" name="Conversion Rate %" />
                  <Bar dataKey="avgOrderValue" fill="#10b981" name="Avg Order Value" />
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
                  <TrendingUp className="w-5 h-5 text-champagne" />
                  AI-Powered Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <h4 className="text-green-400 font-medium mb-2">🎯 Optimization Opportunity</h4>
                    <p className="text-pearl/80 text-sm">
                      Time slot selection has the highest drop-off rate (41.6%). Consider expanding availability or implementing a waitlist feature to capture these bookings.
                    </p>
                  </div>
                  <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <h4 className="text-blue-400 font-medium mb-2">📊 Performance Highlight</h4>
                    <p className="text-pearl/80 text-sm">
                      Direct traffic shows the highest conversion rate at 28%. Focus on brand building and direct marketing campaigns to maximize quality traffic.
                    </p>
                  </div>
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <h4 className="text-amber-400 font-medium mb-2">⚠️ Action Required</h4>
                    <p className="text-pearl/80 text-sm">
                      Facebook conversions are below average at 17.9%. Review ad creative and targeting to improve ROI on this channel.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-charcoal/50 border-graphite/30">
              <CardHeader>
                <CardTitle className="text-pearl flex items-center gap-2">
                  <Target className="w-5 h-5 text-bronze" />
                  Recommended Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    {
                      priority: 'High',
                      action: 'Implement real-time availability updates',
                      impact: 'Could reduce time slot drop-off by 25%',
                      effort: 'Medium'
                    },
                    {
                      priority: 'Medium',
                      action: 'Optimize mobile booking flow',
                      impact: 'Expected 15% increase in mobile conversions',
                      effort: 'Low'
                    },
                    {
                      priority: 'High',
                      action: 'Add customer testimonials at payment stage',
                      impact: 'Potential 10% reduction in payment abandonment',
                      effort: 'Low'
                    },
                    {
                      priority: 'Medium',
                      action: 'Create exit-intent popups with special offers',
                      impact: 'Recover 5-8% of abandoning users',
                      effort: 'Low'
                    }
                  ].map((recommendation, index) => (
                    <div key={index} className="p-3 bg-charcoal/30 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <Badge className={
                          recommendation.priority === 'High' ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }>
                          {recommendation.priority} Priority
                        </Badge>
                        <Badge className="bg-blue-500/20 text-blue-400">
                          {recommendation.effort} Effort
                        </Badge>
                      </div>
                      <h4 className="text-pearl font-medium mb-1">{recommendation.action}</h4>
                      <p className="text-pearl/60 text-sm">{recommendation.impact}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BookingConversionAnalytics;