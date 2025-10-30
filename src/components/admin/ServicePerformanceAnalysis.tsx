import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Treemap
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Star,
  DollarSign,
  Users,
  Calendar,
  Target,
  Award,
  Zap,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Clock,
  ThumbsUp,
  AlertTriangle,
  Gem,
  Crown
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { businessIntelligenceService } from '@/services/business-intelligence.service';
import { ServiceProfitabilityData, AnalyticsFilters } from '@/types/analytics';
import { useToast } from '@/hooks/use-toast aria-live="polite" aria-atomic="true"';

interface ServicePerformanceMetrics {
  overview: {
    totalServices: number;
    activeServices: number;
    averageRating: number;
    totalRevenue: number;
    averageProfitMargin: number;
    topPerformingService: string;
    underperformingService: string;
  };
  serviceData: Array<{
    id: string;
    name: string;
    category: string;
    serviceType: string;
    price: number;
    bookings: number;
    revenue: number;
    costs: number;
    profit: number;
    profitMargin: number;
    rating: number;
    reviews: number;
    views: number;
    conversionRate: number;
    demandScore: number;
    profitabilityScore: number;
    utilization: number;
    averageDuration: number;
    cancellationRate: number;
  }>;
  categoryPerformance: Array<{
    category: string;
    serviceType: string;
    totalRevenue: number;
    totalBookings: number;
    averageMargin: number;
    averageRating: number;
    growthRate: number;
    topService: string;
  }>;
  profitabilityMatrix: Array<{
    service: string;
    revenue: number;
    profitMargin: number;
    demand: number;
    quadrant: 'star' | 'cashCow' | 'questionMark' | 'dog';
  }>;
  trends: Array<{
    serviceName: string;
    period: string;
    revenue: number;
    bookings: number;
    profitMargin: number;
  }>;
  utilizationData: Array<{
    service: string;
    utilization: number;
    capacity: number;
    efficiency: number;
    revenuePerHour: number;
  }>;
  competitivePositioning: Array<{
    service: string;
    ourPrice: number;
    marketAverage: number;
    competitorMin: number;
    competitorMax: number;
    position: 'premium' | 'competitive' | 'budget';
    valueScore: number;
  }>;
}

const ServicePerformanceAnalysis = () => {
  const [metrics, setMetrics] = useState<ServicePerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('revenue');
  const { toast aria-live="polite" aria-atomic="true" } = useToast();

  useEffect(() => {
    loadServiceData();
  }, [selectedPeriod, selectedCategory, sortBy]);

  const loadServiceData = async () => {
    try {
      setLoading(true);

      // Mock comprehensive service performance data
      const mockData: ServicePerformanceMetrics = {
        overview: {
          totalServices: 12,
          activeServices: 10,
          averageRating: 4.7,
          totalRevenue: 145750,
          averageProfitMargin: 65.2,
          topPerformingService: 'Lip Enhancements',
          underperformingService: 'Starter Program'
        },
        serviceData: [
          {
            id: '1',
            name: 'Lip Enhancements',
            category: 'Beauty',
            serviceType: 'beauty',
            price: 250,
            bookings: 216,
            revenue: 54000,
            costs: 16200,
            profit: 37800,
            profitMargin: 70.0,
            rating: 4.8,
            reviews: 180,
            views: 3420,
            conversionRate: 6.3,
            demandScore: 9.2,
            profitabilityScore: 9.5,
            utilization: 85.2,
            averageDuration: 60,
            cancellationRate: 8.3
          },
          {
            id: '2',
            name: 'Brow Lamination',
            category: 'Beauty',
            serviceType: 'beauty',
            price: 200,
            bookings: 167,
            revenue: 33450,
            costs: 10035,
            profit: 23415,
            profitMargin: 70.0,
            rating: 4.9,
            reviews: 145,
            views: 2890,
            conversionRate: 5.8,
            demandScore: 8.7,
            profitabilityScore: 9.0,
            utilization: 78.9,
            averageDuration: 45,
            cancellationRate: 6.0
          },
          {
            id: '3',
            name: 'Glutes Training',
            category: 'Fitness',
            serviceType: 'fitness',
            price: 200,
            bookings: 135,
            revenue: 27000,
            costs: 10800,
            profit: 16200,
            profitMargin: 60.0,
            rating: 4.7,
            reviews: 98,
            views: 2145,
            conversionRate: 6.3,
            demandScore: 7.8,
            profitabilityScore: 7.2,
            utilization: 72.5,
            averageDuration: 60,
            cancellationRate: 12.5
          },
          {
            id: '4',
            name: 'Starter Program',
            category: 'Fitness',
            serviceType: 'fitness',
            price: 150,
            bookings: 90,
            revenue: 13500,
            costs: 6075,
            profit: 7425,
            profitMargin: 55.0,
            rating: 4.6,
            reviews: 62,
            views: 1890,
            conversionRate: 4.8,
            demandScore: 6.2,
            profitabilityScore: 5.8,
            utilization: 55.8,
            averageDuration: 45,
            cancellationRate: 18.9
          },
          {
            id: '5',
            name: 'Premium Package',
            category: 'Beauty',
            serviceType: 'beauty',
            price: 500,
            bookings: 35,
            revenue: 17800,
            costs: 5340,
            profit: 12460,
            profitMargin: 70.0,
            rating: 4.9,
            reviews: 32,
            views: 890,
            conversionRate: 3.9,
            demandScore: 8.5,
            profitabilityScore: 9.2,
            utilization: 92.1,
            averageDuration: 120,
            cancellationRate: 5.7
          },
          {
            id: '6',
            name: 'Facial Treatment',
            category: 'Beauty',
            serviceType: 'beauty',
            price: 300,
            bookings: 78,
            revenue: 23400,
            costs: 8190,
            profit: 15210,
            profitMargin: 65.0,
            rating: 4.8,
            reviews: 71,
            views: 1654,
            conversionRate: 4.7,
            demandScore: 7.9,
            profitabilityScore: 8.1,
            utilization: 68.4,
            averageDuration: 75,
            cancellationRate: 9.2
          }
        ],
        categoryPerformance: [
          {
            category: 'Beauty',
            serviceType: 'beauty',
            totalRevenue: 108650,
            totalBookings: 496,
            averageMargin: 68.8,
            averageRating: 4.85,
            growthRate: 15.2,
            topService: 'Lip Enhancements'
          },
          {
            category: 'Fitness',
            serviceType: 'fitness',
            totalRevenue: 40500,
            totalBookings: 225,
            averageMargin: 57.5,
            averageRating: 4.65,
            growthRate: 8.7,
            topService: 'Glutes Training'
          }
        ],
        profitabilityMatrix: [
          {
            service: 'Lip Enhancements',
            revenue: 54000,
            profitMargin: 70.0,
            demand: 9.2,
            quadrant: 'star'
          },
          {
            service: 'Brow Lamination',
            revenue: 33450,
            profitMargin: 70.0,
            demand: 8.7,
            quadrant: 'star'
          },
          {
            service: 'Premium Package',
            revenue: 17800,
            profitMargin: 70.0,
            demand: 8.5,
            quadrant: 'cashCow'
          },
          {
            service: 'Facial Treatment',
            revenue: 23400,
            profitMargin: 65.0,
            demand: 7.9,
            quadrant: 'cashCow'
          },
          {
            service: 'Glutes Training',
            revenue: 27000,
            profitMargin: 60.0,
            demand: 7.8,
            quadrant: 'questionMark'
          },
          {
            service: 'Starter Program',
            revenue: 13500,
            profitMargin: 55.0,
            demand: 6.2,
            quadrant: 'dog'
          }
        ],
        trends: generateTrendData(),
        utilizationData: [
          {
            service: 'Lip Enhancements',
            utilization: 85.2,
            capacity: 252,
            efficiency: 85.7,
            revenuePerHour: 416.67
          },
          {
            service: 'Brow Lamination',
            utilization: 78.9,
            capacity: 212,
            efficiency: 78.8,
            revenuePerHour: 266.67
          },
          {
            service: 'Glutes Training',
            utilization: 72.5,
            capacity: 186,
            efficiency: 72.6,
            revenuePerHour: 333.33
          }
        ],
        competitivePositioning: [
          {
            service: 'Lip Enhancements',
            ourPrice: 250,
            marketAverage: 225,
            competitorMin: 180,
            competitorMax: 300,
            position: 'premium',
            valueScore: 8.5
          },
          {
            service: 'Brow Lamination',
            ourPrice: 200,
            marketAverage: 185,
            competitorMin: 150,
            competitorMax: 250,
            position: 'premium',
            valueScore: 8.2
          },
          {
            service: 'Glutes Training',
            ourPrice: 200,
            marketAverage: 195,
            competitorMin: 150,
            competitorMax: 250,
            position: 'competitive',
            valueScore: 7.8
          }
        ]
      };

      setMetrics(mockData);

    } catch (error) {
      toast aria-live="polite" aria-atomic="true"({
        title: 'Error',
        description: 'Failed to load service performance data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const generateTrendData = () => {
    const trends = [];
    const services = ['Lip Enhancements', 'Brow Lamination', 'Glutes Training', 'Starter Program', 'Premium Package'];
    const periods = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];

    services.forEach(service => {
      periods.forEach(period => {
        trends.push({
          serviceName: service,
          period,
          revenue: Math.floor(Math.random() * 10000 + 5000),
          bookings: Math.floor(Math.random() * 50 + 20),
          profitMargin: Math.random() * 20 + 60
        });
      });
    });

    return trends;
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

  const getQuadrantColor = (quadrant: string) => {
    switch (quadrant) {
      case 'star': return '#10b981';
      case 'cashCow': return '#3b82f6';
      case 'questionMark': return '#f59e0b';
      case 'dog': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getQuadrantLabel = (quadrant: string) => {
    switch (quadrant) {
      case 'star': return '⭐ Star';
      case 'cashCow': return '🐄 Cash Cow';
      case 'questionMark': return '❓ Question Mark';
      case 'dog': return '🐕 Dog';
      default: return 'Unknown';
    }
  };

  const getPositionColor = (position: string) => {
    switch (position) {
      case 'premium': return 'text-purple-400';
      case 'competitive': return 'text-blue-400';
      case 'budget': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 8) return 'text-green-400';
    if (score >= 6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const sortedServices = [...(metrics?.serviceData || [])].sort((a, b) => {
    switch (sortBy) {
      case 'revenue': return b.revenue - a.revenue;
      case 'profitMargin': return b.profitMargin - a.profitMargin;
      case 'rating': return b.rating - a.rating;
      case 'bookings': return b.bookings - a.bookings;
      case 'demand': return b.demandScore - a.demandScore;
      default: return b.revenue - a.revenue;
    }
  });

  const COLORS = ['#8B4513', '#F5DEB3', '#CD853F', '#DEB887', '#D2691E', '#BC8F8F'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3">
          <Award className="w-6 h-6 text-champagne animate-pulse" />
          <span className="text-pearl">Analyzing service performance...</span>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-pearl/60">No service data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Gem className="w-8 h-8 text-champagne" />
          <div>
            <h1 className="text-3xl font-serif text-pearl">Service Performance Analysis</h1>
            <p className="text-pearl/60">Comprehensive service profitability and performance insights</p>
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

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40 bg-charcoal/50 border-champagne/30 text-pearl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="beauty">Beauty</SelectItem>
              <SelectItem value="fitness">Fitness</SelectItem>
              <SelectItem value="lifestyle">Lifestyle</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40 bg-charcoal/50 border-champagne/30 text-pearl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="revenue">Sort by Revenue</SelectItem>
              <SelectItem value="profitMargin">Sort by Margin</SelectItem>
              <SelectItem value="rating">Sort by Rating</SelectItem>
              <SelectItem value="bookings">Sort by Bookings</SelectItem>
              <SelectItem value="demand">Sort by Demand</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={loadServiceData}
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
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="bg-charcoal/50 border-graphite/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-pearl/70 flex items-center gap-2">
              <Star className="w-4 h-4" />
              Avg Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-pearl">
              {metrics.overview.averageRating.toFixed(1)}
            </div>
            <div className="text-xs text-pearl/60 mt-1">
              Across all services
            </div>
          </CardContent>
        </Card>

        <Card className="bg-charcoal/50 border-graphite/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-pearl/70 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-champagne">
              {formatCurrency(metrics.overview.totalRevenue)}
            </div>
            <div className="text-xs text-pearl/60 mt-1">
              From services
            </div>
          </CardContent>
        </Card>

        <Card className="bg-charcoal/50 border-graphite/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-pearl/70 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Avg Margin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {formatPercentage(metrics.overview.averageProfitMargin)}
            </div>
            <div className="text-xs text-pearl/60 mt-1">
              Profit margin
            </div>
          </CardContent>
        </Card>

        <Card className="bg-charcoal/50 border-graphite/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-pearl/70 flex items-center gap-2">
              <Crown className="w-4 h-4" />
              Top Service
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold text-pearl">
              {metrics.overview.topPerformingService}
            </div>
            <div className="text-xs text-pearl/60 mt-1">
              Best performer
            </div>
          </CardContent>
        </Card>

        <Card className="bg-charcoal/50 border-graphite/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-pearl/70 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Underperformer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold text-amber-400">
              {metrics.overview.underperformingService}
            </div>
            <div className="text-xs text-pearl/60 mt-1">
              Needs attention
            </div>
          </CardContent>
        </Card>

        <Card className="bg-charcoal/50 border-graphite/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-pearl/70 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Active Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-pearl">
              {metrics.overview.activeServices}/{metrics.overview.totalServices}
            </div>
            <div className="text-xs text-pearl/60 mt-1">
              Services running
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="profitability">Profitability</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="utilization">Utilization</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performing Services */}
            <Card className="bg-charcoal/50 border-graphite/30">
              <CardHeader>
                <CardTitle className="text-pearl flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-champagne" />
                  Top Performing Services
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sortedServices.slice(0, 5).map((service, index) => (
                    <div key={service.id} className="flex items-center justify-between p-3 bg-charcoal/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="text-lg font-bold text-champagne">#{index + 1}</div>
                        <div>
                          <div className="text-pearl font-medium">{service.name}</div>
                          <div className="text-pearl/60 text-sm">{service.category}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-champagne font-medium">{formatCurrency(service.revenue)}</div>
                        <div className="text-xs text-pearl/60">{service.bookings} bookings</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Category Performance */}
            <Card className="bg-charcoal/50 border-graphite/30">
              <CardHeader>
                <CardTitle className="text-pearl flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Category Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={metrics.categoryPerformance}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, totalRevenue }) => `${category}: ${formatPercentage((totalRevenue / metrics.overview.totalRevenue) * 100)}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="totalRevenue"
                    >
                      {metrics.categoryPerformance.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1A1412",
                        border: "1px solid #424242",
                        borderRadius: "8px",
                      }}
                      formatter={(value: any) => [formatCurrency(value), 'Revenue']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Profitability Tab */}
        <TabsContent value="profitability" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profitability Matrix */}
            <Card className="bg-charcoal/50 border-graphite/30">
              <CardHeader>
                <CardTitle className="text-pearl">BCG Matrix Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="#424242" />
                    <XAxis
                      type="number"
                      dataKey="demand"
                      name="Market Demand"
                      domain={[0, 10]}
                      stroke="#F5F1ED"
                    />
                    <YAxis
                      type="number"
                      dataKey="profitMargin"
                      name="Profit Margin"
                      domain={[50, 75]}
                      stroke="#F5F1ED"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1A1412",
                        border: "1px solid #424242",
                        borderRadius: "8px",
                      }}
                      formatter={(value: any, name: string) => [
                        name === 'profitMargin' ? `${value.toFixed(1)}%` : value.toFixed(1),
                        name === 'profitMargin' ? 'Profit Margin' : 'Demand Score'
                      ]}
                      labelFormatter={(label) => {
                        const item = metrics.profitabilityMatrix.find(m => m.service === label);
                        return `${label} (${getQuadrantLabel(item?.quadrant || '')})`;
                      }}
                    />
                    <Scatter
                      name="Services"
                      data={metrics.profitabilityMatrix}
                      fill="#D4A574"
                    >
                      {metrics.profitabilityMatrix.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getQuadrantColor(entry.quadrant)} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-pearl/80">⭐ Stars (High demand, High margin)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-xs text-pearl/80">🐄 Cash Cows (Low demand, High margin)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-xs text-pearl/80">❓ Question Marks (High demand, Low margin)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-xs text-pearl/80">🐕 Dogs (Low demand, Low margin)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Service Profitability Details */}
            <Card className="bg-charcoal/50 border-graphite/30">
              <CardHeader>
                <CardTitle className="text-pearl">Service Profitability Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sortedServices.map((service) => (
                    <div key={service.id} className="p-3 bg-charcoal/30 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-pearl font-medium">{service.name}</h4>
                        <Badge className={getPerformanceColor(service.profitabilityScore)}>
                          Score: {service.profitabilityScore.toFixed(1)}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-pearl/60">Revenue:</span>
                          <span className="text-pearl ml-1">{formatCurrency(service.revenue)}</span>
                        </div>
                        <div>
                          <span className="text-pearl/60">Margin:</span>
                          <span className={`ml-1 ${getPerformanceColor(service.profitMargin)}`}>
                            {formatPercentage(service.profitMargin)}
                          </span>
                        </div>
                        <div>
                          <span className="text-pearl/60">Profit:</span>
                          <span className="text-green-400 ml-1">{formatCurrency(service.profit)}</span>
                        </div>
                        <div>
                          <span className="text-pearl/60">Bookings:</span>
                          <span className="text-pearl ml-1">{service.bookings}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <Card className="bg-charcoal/50 border-graphite/30">
            <CardHeader>
              <CardTitle className="text-pearl">Service Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={sortedServices}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#424242" />
                  <XAxis dataKey="name" stroke="#F5F1ED" angle={-45} textAnchor="end" height={80} />
                  <YAxis yAxisId="left" stroke="#F5F1ED" />
                  <YAxis yAxisId="right" orientation="right" stroke="#F5F1ED" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1A1412",
                      border: "1px solid #424242",
                      borderRadius: "8px",
                    }}
                    formatter={(value: any, name: string) => [
                      name === 'rating' ? `${value.toFixed(1)}/5` :
                      name === 'conversionRate' ? `${value.toFixed(1)}%` :
                      name === 'profitMargin' ? `${value.toFixed(1)}%` :
                      formatCurrency(value),
                      name === 'rating' ? 'Rating' :
                      name === 'conversionRate' ? 'Conversion Rate' :
                      name === 'profitMargin' ? 'Profit Margin' :
                      name === 'revenue' ? 'Revenue' : 'Price'
                    ]}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="revenue" fill="#3b82f6" name="Revenue" />
                  <Bar yAxisId="left" dataKey="price" fill="#10b981" name="Price" />
                  <Bar yAxisId="right" dataKey="rating" fill="#D4A574" name="Rating" />
                  <Bar yAxisId="right" dataKey="conversionRate" fill="#f59e0b" name="Conversion %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card className="bg-charcoal/50 border-graphite/30">
            <CardHeader>
              <CardTitle className="text-pearl">Service Revenue Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={metrics.trends}>
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
                      name === 'profitMargin' ? `${value.toFixed(1)}%` :
                      formatCurrency(value),
                      name === 'profitMargin' ? 'Profit Margin' : 'Revenue'
                    ]}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#D4A574" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Utilization Tab */}
        <TabsContent value="utilization" className="space-y-6">
          <Card className="bg-charcoal/50 border-graphite/30">
            <CardHeader>
              <CardTitle className="text-pearl">Service Utilization Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={metrics.utilizationData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#424242" />
                  <XAxis dataKey="service" stroke="#F5F1ED" angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="#F5F1ED" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1A1412",
                      border: "1px solid #424242",
                      borderRadius: "8px",
                    }}
                    formatter={(value: any, name: string) => [
                      name === 'utilization' || name === 'efficiency' ? `${value.toFixed(1)}%` :
                      formatCurrency(value),
                      name === 'utilization' ? 'Utilization' :
                      name === 'efficiency' ? 'Efficiency' :
                      name === 'revenuePerHour' ? 'Revenue/Hour' : name
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="utilization" fill="#3b82f6" name="Utilization %" />
                  <Bar dataKey="efficiency" fill="#10b981" name="Efficiency %" />
                  <Bar dataKey="revenuePerHour" fill="#D4A574" name="Revenue/Hour" />
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
                  AI Performance Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <h4 className="text-green-400 font-medium mb-2">🎯 Optimization Opportunity</h4>
                    <p className="text-pearl/80 text-sm">
                      Lip Enhancements shows 85% utilization with 70% margin. Consider increasing price by 10-15% to capture additional value.
                    </p>
                  </div>
                  <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <h4 className="text-blue-400 font-medium mb-2">📈 Growth Potential</h4>
                    <p className="text-pearl/80 text-sm">
                      Glutes Training has high demand but lower margins. Review cost structure or explore premium pricing tiers.
                    </p>
                  </div>
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <h4 className="text-amber-400 font-medium mb-2">⚠️ Performance Alert</h4>
                    <p className="text-pearl/80 text-sm">
                      Starter Program shows declining performance and high cancellation rate. Consider service redesign or marketing refresh.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-charcoal/50 border-graphite/30">
              <CardHeader>
                <CardTitle className="text-pearl flex items-center gap-2">
                  <Target className="w-5 h-5 text-bronze" />
                  Competitive Intelligence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.competitivePositioning.map((item, index) => (
                    <div key={index} className="p-3 bg-charcoal/30 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-pearl font-medium">{item.service}</h4>
                        <Badge className={getPositionColor(item.position)}>
                          {item.position.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-pearl/60">Our Price:</span>
                          <span className="text-pearl ml-1">{formatCurrency(item.ourPrice)}</span>
                        </div>
                        <div>
                          <span className="text-pearl/60">Market Avg:</span>
                          <span className="text-pearl ml-1">{formatCurrency(item.marketAverage)}</span>
                        </div>
                        <div>
                          <span className="text-pearl/60">Range:</span>
                          <span className="text-pearl ml-1">
                            {formatCurrency(item.competitorMin)} - {formatCurrency(item.competitorMax)}
                          </span>
                        </div>
                        <div>
                          <span className="text-pearl/60">Value Score:</span>
                          <span className={`ml-1 ${getPerformanceColor(item.valueScore)}`}>
                            {item.valueScore.toFixed(1)}/10
                          </span>
                        </div>
                      </div>
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

const Trophy = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10V7a5 5 0 0110 0v3m0 0v5a5 5 0 01-10 0v-5m0 0h10" />
  </svg>
);

export default ServicePerformanceAnalysis;