import React, { useState, useMemo, useCallback } from 'react';
import {
  LineChart,
  Line,
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
  Area,
  AreaChart
} from 'recharts';
import {
  MapPin,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Building,
  Target,
  AlertTriangle,
  CheckCircle,
  Star,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Globe,
  City,
  Navigation,
  Lightbulb
} from 'lucide-react';
import { format, subDays } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

// Types for multi-city analytics
interface CityData {
  id: string;
  name: string;
  country: string;
  population: number;
  incomeLevel: 'high' | 'medium' | 'low';
  competition: 'high' | 'medium' | 'low';
  marketPotential: number;
  operationalCost: number;
  currentRevenue: number;
  projectedRevenue: number;
  growthRate: number;
  marketShare: number;
  customers: number;
  bookings: number;
  averageBookingValue: number;
  satisfaction: number;
  expansionReadiness: number;
  coordinates: {
    lat: number;
    lng: number;
  };
  demographics: {
    ageGroups: Record<string, number>;
    genderRatio: number;
    incomeDistribution: Record<string, number>;
  };
  marketInsights: {
    trends: string[];
    opportunities: string[];
    risks: string[];
  };
}

interface ExpansionRecommendation {
  cityId: string;
  cityName: string;
  priority: 'high' | 'medium' | 'low';
  investmentRequired: number;
  expectedROI: number;
  timeToProfit: number;
  riskLevel: 'low' | 'medium' | 'high';
  marketSize: number;
  competitiveAdvantage: string;
  actionPlan: string[];
}

interface ComparisonMetric {
  id: string;
  name: string;
  type: 'revenue' | 'growth' | 'operational' | 'market' | 'customer';
  weight: number;
  higherIsBetter: boolean;
}

const MultiCityAnalytics: React.FC = () => {
  const [selectedCities, setSelectedCities] = useState<string[]>(['warsaw', 'krakow']);
  const [comparisonMetric, setComparisonMetric] = useState('revenue');
  const [timeframe, setTimeframe] = useState('12m');
  const [showProjections, setShowProjections] = useState(true);
  const [analysisMode, setAnalysisMode] = useState<'compare' | 'expand' | 'optimize'>('compare');
  const { toast } = useToast();

  // City data with comprehensive metrics
  const cityData: CityData[] = useMemo(() => [
    {
      id: 'warsaw',
      name: 'Warsaw',
      country: 'Poland',
      population: 1700000,
      incomeLevel: 'high',
      competition: 'high',
      marketPotential: 85,
      operationalCost: 75000,
      currentRevenue: 125000,
      projectedRevenue: 180000,
      growthRate: 12.5,
      marketShare: 15.2,
      customers: 850,
      bookings: 1250,
      averageBookingValue: 280,
      satisfaction: 4.6,
      expansionReadiness: 90,
      coordinates: { lat: 52.2297, lng: 21.0122 },
      demographics: {
        ageGroups: { '18-25': 20, '26-35': 35, '36-45': 25, '46-55': 15, '55+': 5 },
        genderRatio: 52,
        incomeDistribution: { 'low': 25, 'medium': 50, 'high': 25 }
      },
      marketInsights: {
        trends: ['Premium beauty services', 'Corporate wellness', 'Sustainable beauty'],
        opportunities: ['Luxury segment', 'Mobile services', 'International tourists'],
        risks: ['High competition', 'Rising costs', 'Market saturation']
      }
    },
    {
      id: 'krakow',
      name: 'Krakow',
      country: 'Poland',
      population: 770000,
      incomeLevel: 'medium',
      competition: 'medium',
      marketPotential: 75,
      operationalCost: 55000,
      currentRevenue: 95000,
      projectedRevenue: 135000,
      growthRate: 18.2,
      marketShare: 22.1,
      customers: 620,
      bookings: 890,
      averageBookingValue: 240,
      satisfaction: 4.5,
      expansionReadiness: 75,
      coordinates: { lat: 50.0647, lng: 19.9450 },
      demographics: {
        ageGroups: { '18-25': 25, '26-35': 40, '36-45': 20, '46-55': 10, '55+': 5 },
        genderRatio: 48,
        incomeDistribution: { 'low': 35, 'medium': 45, 'high': 20 }
      },
      marketInsights: {
        trends: ['Student market', 'Historical tourism', 'Affordable luxury'],
        opportunities: ['Student packages', 'Tourist services', 'Group bookings'],
        risks: ['Seasonal demand', 'Price sensitivity', 'Tourism dependency']
      }
    },
    {
      id: 'gdansk',
      name: 'Gdansk',
      country: 'Poland',
      population: 460000,
      incomeLevel: 'medium',
      competition: 'low',
      marketPotential: 65,
      operationalCost: 45000,
      currentRevenue: 0,
      projectedRevenue: 85000,
      growthRate: 25.0,
      marketShare: 0,
      customers: 0,
      bookings: 0,
      averageBookingValue: 220,
      satisfaction: 0,
      expansionReadiness: 60,
      coordinates: { lat: 54.3520, lng: 18.6466 },
      demographics: {
        ageGroups: { '18-25': 30, '26-35': 35, '36-45': 20, '46-55': 10, '55+': 5 },
        genderRatio: 50,
        incomeDistribution: { 'low': 40, 'medium': 45, 'high': 15 }
      },
      marketInsights: {
        trends: ['Coastal tourism', 'Maritime industry', 'Port city services'],
        opportunities: ['Tourist market', 'Maritime professionals', 'Coastal luxury'],
        risks: ['Seasonal business', 'Weather dependency', 'Smaller market']
      }
    },
    {
      id: 'wroclaw',
      name: 'Wroclaw',
      country: 'Poland',
      population: 640000,
      incomeLevel: 'medium',
      competition: 'low',
      marketPotential: 70,
      operationalCost: 48000,
      currentRevenue: 0,
      projectedRevenue: 95000,
      growthRate: 22.0,
      marketShare: 0,
      customers: 0,
      bookings: 0,
      averageBookingValue: 250,
      satisfaction: 0,
      expansionReadiness: 65,
      coordinates: { lat: 51.1079, lng: 17.0385 },
      demographics: {
        ageGroups: { '18-25': 28, '26-35': 38, '36-45': 18, '46-55': 10, '55+': 6 },
        genderRatio: 49,
        incomeDistribution: { 'low': 30, 'medium': 50, 'high': 20 }
      },
      marketInsights: {
        trends: ['IT professionals', 'University city', 'Growing tech sector'],
        opportunities: ['Corporate packages', 'Student services', 'Tech industry wellness'],
        risks: ['Economic dependence', 'Competition from existing businesses', 'Market education']
      }
    },
    {
      id: 'berlin',
      name: 'Berlin',
      country: 'Germany',
      population: 3660000,
      incomeLevel: 'high',
      competition: 'high',
      marketPotential: 95,
      operationalCost: 120000,
      currentRevenue: 0,
      projectedRevenue: 250000,
      growthRate: 15.0,
      marketShare: 0,
      customers: 0,
      bookings: 0,
      averageBookingValue: 350,
      satisfaction: 0,
      expansionReadiness: 80,
      coordinates: { lat: 52.5200, lng: 13.4050 },
      demographics: {
        ageGroups: { '18-25': 22, '26-35': 38, '36-45': 22, '46-55': 12, '55+': 6 },
        genderRatio: 51,
        incomeDistribution: { 'low': 20, 'medium': 45, 'high': 35 }
      },
      marketInsights: {
        trends: ['International clientele', 'High-end services', 'Tech integration'],
        opportunities: ['Premium market', 'International tourists', 'Corporate wellness'],
        risks: ['High operational costs', 'Complex regulations', 'Intense competition']
      }
    },
    {
      id: 'prague',
      name: 'Prague',
      country: 'Czech Republic',
      population: 1300000,
      incomeLevel: 'medium',
      competition: 'medium',
      marketPotential: 80,
      operationalCost: 65000,
      currentRevenue: 0,
      projectedRevenue: 145000,
      growthRate: 20.0,
      marketShare: 0,
      customers: 0,
      bookings: 0,
      averageBookingValue: 260,
      satisfaction: 0,
      expansionReadiness: 70,
      coordinates: { lat: 50.0755, lng: 14.4378 },
      demographics: {
        ageGroups: { '18-25': 24, '26-35': 36, '36-45': 22, '46-55': 12, '55+': 6 },
        genderRatio: 50,
        incomeDistribution: { 'low': 25, 'medium': 55, 'high': 20 }
      },
      marketInsights: {
        trends: ['Medical tourism', 'Historical tourism', 'Central European hub'],
        opportunities: ['Medical beauty services', 'Tourist packages', 'International clientele'],
        risks: ['Language barriers', 'Regulatory differences', 'Market adaptation']
      }
    }
  ], []);

  // Comparison metrics
  const comparisonMetrics: ComparisonMetric[] = [
    { id: 'revenue', name: 'Revenue Performance', type: 'revenue', weight: 0.25, higherIsBetter: true },
    { id: 'growth', name: 'Growth Rate', type: 'growth', weight: 0.20, higherIsBetter: true },
    { id: 'market', name: 'Market Share', type: 'market', weight: 0.15, higherIsBetter: true },
    { id: 'customers', name: 'Customer Base', type: 'customer', weight: 0.15, higherIsBetter: true },
    { id: 'efficiency', name: 'Operational Efficiency', type: 'operational', weight: 0.15, higherIsBetter: true },
    { id: 'satisfaction', name: 'Customer Satisfaction', type: 'customer', weight: 0.10, higherIsBetter: true }
  ];

  // Expansion recommendations
  const expansionRecommendations: ExpansionRecommendation[] = useMemo(() => {
    return [
      {
        cityId: 'berlin',
        cityName: 'Berlin',
        priority: 'high',
        investmentRequired: 250000,
        expectedROI: 185,
        timeToProfit: 18,
        riskLevel: 'medium',
        marketSize: 1200000,
        competitiveAdvantage: 'Premium positioning and international appeal',
        actionPlan: [
          'Market research and regulatory compliance',
          'Secure premium location in central district',
          'Hire German-speaking staff and management',
          'Launch targeted marketing campaign',
          'Partner with local hotels and businesses'
        ]
      },
      {
        cityId: 'gdansk',
        cityName: 'Gdansk',
        priority: 'medium',
        investmentRequired: 85000,
        expectedROI: 220,
        timeToProfit: 12,
        riskLevel: 'low',
        marketSize: 380000,
        competitiveAdvantage: 'First-mover advantage in coastal market',
        actionPlan: [
          'Develop tourism-focused service packages',
          'Partner with hotels and cruise companies',
          'Seasonal marketing campaigns',
          'Hire bilingual staff (Polish/English)',
          'Focus on coastal beauty trends'
        ]
      },
      {
        cityId: 'prague',
        cityName: 'Prague',
        priority: 'medium',
        investmentRequired: 145000,
        expectedROI: 195,
        timeToProfit: 15,
        riskLevel: 'medium',
        marketSize: 750000,
        competitiveAdvantage: 'Central European hub with medical tourism potential',
        actionPlan: [
          'Medical beauty certifications and partnerships',
          'International marketing strategy',
          'Multi-language support systems',
          'Regulatory compliance preparation',
          'Tourist industry partnerships'
        ]
      }
    ];
  }, []);

  // Time series data for comparison
  const timeSeriesData = useMemo(() => {
    const months = timeframe === '3m' ? 3 : timeframe === '6m' ? 6 : timeframe === '12m' ? 12 : 24;

    return Array.from({ length: months }, (_, i) => {
      const date = subDays(new Date(), (months - i - 1) * 30);
      return {
        date: format(date, 'MMM yyyy'),
        ...selectedCities.reduce((acc, cityId) => {
          const city = cityData.find(c => c.id === cityId);
          if (city) {
            const baseValue = city.currentRevenue / months;
            const growthFactor = 1 + (city.growthRate / 100) * (i / months);
            acc[cityId] = baseValue * growthFactor + (Math.random() - 0.5) * baseValue * 0.1;
          }
          return acc;
        }, {} as Record<string, number>)
      };
    });
  }, [selectedCities, timeframe, cityData]);

  // Radar comparison data
  const radarData = useMemo(() => {
    return comparisonMetrics.map(metric => {
      const dataPoint: any = { metric: metric.name };

      selectedCities.forEach(cityId => {
        const city = cityData.find(c => c.id === cityId);
        if (city) {
          let value = 0;
          switch (metric.id) {
            case 'revenue':
              value = (city.currentRevenue / 100000) * 100;
              break;
            case 'growth':
              value = city.growthRate * 5;
              break;
            case 'market':
              value = city.marketShare * 5;
              break;
            case 'customers':
              value = (city.customers / 1000) * 100;
              break;
            case 'efficiency':
              value = (city.currentRevenue / city.operationalCost) * 50;
              break;
            case 'satisfaction':
              value = (city.satisfaction / 5) * 100;
              break;
          }
          dataPoint[cityId] = Math.min(100, Math.max(0, value));
        }
      });

      return dataPoint;
    });
  }, [selectedCities, comparisonMetrics, cityData]);

  const COLORS = ['#8B4513', '#F5DEB3', '#D2691E', '#DEB887', '#BC8F8F', '#F4A460'];

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-charcoal border border-champagne/30 rounded-lg p-3 shadow-lg">
          <p className="text-pearl font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(0) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const handleCityToggle = (cityId: string) => {
    setSelectedCities(prev =>
      prev.includes(cityId)
        ? prev.filter(id => id !== cityId)
        : [...prev, cityId]
    );
  };

  const calculateCityScore = (city: CityData): number => {
    let score = 0;
    comparisonMetrics.forEach(metric => {
      let value = 0;
      switch (metric.id) {
        case 'revenue':
          value = (city.currentRevenue / 100000) * 100;
          break;
        case 'growth':
          value = city.growthRate * 5;
          break;
        case 'market':
          value = city.marketShare * 5;
          break;
        case 'customers':
          value = (city.customers / 1000) * 100;
          break;
        case 'efficiency':
          value = (city.currentRevenue / city.operationalCost) * 50;
          break;
        case 'satisfaction':
          value = (city.satisfaction / 5) * 100;
          break;
      }
      score += (Math.min(100, value) * metric.weight);
    });
    return score;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-500';
      case 'medium': return 'bg-yellow-500/20 text-yellow-500';
      case 'low': return 'bg-green-500/20 text-green-500';
      default: return 'bg-gray-500/20 text-gray-500';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-charcoal p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-serif text-pearl flex items-center gap-3">
              <Globe className="w-10 h-10 text-champagne" />
              Multi-City Analytics
            </h1>
            <p className="text-champagne/70 mt-2">
              Comparative analysis and expansion planning for multiple locations
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-32 bg-charcoal/50 border-graphite/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3m">3 Months</SelectItem>
                <SelectItem value="6m">6 Months</SelectItem>
                <SelectItem value="12m">12 Months</SelectItem>
                <SelectItem value="24m">24 Months</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Label htmlFor="projections" className="text-champagne/70">Show Projections</Label>
              <Switch
                id="projections"
                checked={showProjections}
                onCheckedChange={setShowProjections}
              />
            </div>
          </div>
        </div>

        {/* Analysis Mode Tabs */}
        <Tabs value={analysisMode} onValueChange={(value: any) => setAnalysisMode(value)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-charcoal/50 border-graphite/30">
            <TabsTrigger value="compare" className="data-[state=active]:bg-champagne/20">
              <BarChart3 className="w-4 h-4 mr-2" />
              Compare Cities
            </TabsTrigger>
            <TabsTrigger value="expand" className="data-[state=active]:bg-champagne/20">
              <Navigation className="w-4 h-4 mr-2" />
              Expansion Analysis
            </TabsTrigger>
            <TabsTrigger value="optimize" className="data-[state=active]:bg-champagne/20">
              <TrendingUp className="w-4 h-4 mr-2" />
              Optimization
            </TabsTrigger>
          </TabsList>

          {/* City Comparison Tab */}
          <TabsContent value="compare" className="space-y-6">
            {/* City Selection */}
            <Card className="bg-charcoal/50 border-graphite/30">
              <CardHeader>
                <CardTitle className="text-pearl">Select Cities to Compare</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {cityData.map((city) => (
                    <div
                      key={city.id}
                      onClick={() => handleCityToggle(city.id)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedCities.includes(city.id)
                          ? 'bg-champagne/20 border-champagne/50'
                          : 'bg-charcoal/30 border-graphite/30 hover:border-champagne/30'
                      }`}
                    >
                      <div className="text-center">
                        <City className="w-6 h-6 mx-auto mb-2 text-champagne" />
                        <p className="text-pearl font-medium text-sm">{city.name}</p>
                        <p className="text-champagne/50 text-xs">{city.country}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Trend */}
              <Card className="bg-charcoal/50 border-graphite/30">
                <CardHeader>
                  <CardTitle className="text-pearl">Revenue Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={timeSeriesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#424242" />
                      <XAxis dataKey="date" stroke="#F5F1ED" />
                      <YAxis stroke="#F5F1ED" />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      {selectedCities.map((cityId, index) => {
                        const city = cityData.find(c => c.id === cityId);
                        return city ? (
                          <Line
                            key={cityId}
                            type="monotone"
                            dataKey={cityId}
                            stroke={COLORS[index % COLORS.length]}
                            strokeWidth={2}
                            name={city.name}
                            dot={false}
                          />
                        ) : null;
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Performance Radar */}
              <Card className="bg-charcoal/50 border-graphite/30">
                <CardHeader>
                  <CardTitle className="text-pearl">Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#424242" />
                      <PolarAngleAxis dataKey="metric" stroke="#F5F1ED" />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#F5F1ED" />
                      {selectedCities.map((cityId, index) => {
                        const city = cityData.find(c => c.id === cityId);
                        return city ? (
                          <Radar
                            key={cityId}
                            name={city.name}
                            dataKey={cityId}
                            stroke={COLORS[index % COLORS.length]}
                            fill={COLORS[index % COLORS.length]}
                            fillOpacity={0.3}
                          />
                        ) : null;
                      })}
                      <Legend />
                      <Tooltip content={<CustomTooltip />} />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* City Comparison Table */}
            <Card className="bg-charcoal/50 border-graphite/30">
              <CardHeader>
                <CardTitle className="text-pearl">City Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-graphite/30">
                        <th className="p-3 text-champagne">City</th>
                        <th className="p-3 text-champagne text-right">Revenue</th>
                        <th className="p-3 text-champagne text-right">Growth</th>
                        <th className="p-3 text-champagne text-right">Market Share</th>
                        <th className="p-3 text-champagne text-right">Customers</th>
                        <th className="p-3 text-champagne text-right">Avg Value</th>
                        <th className="p-3 text-champagne text-right">Satisfaction</th>
                        <th className="p-3 text-champagne text-right">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cityData
                        .filter(city => selectedCities.includes(city.id))
                        .sort((a, b) => calculateCityScore(b) - calculateCityScore(a))
                        .map((city, index) => (
                          <tr key={city.id} className="border-b border-graphite/20">
                            <td className="p-3">
                              <div>
                                <p className="text-pearl font-medium">{city.name}</p>
                                <p className="text-champagne/50 text-sm">{city.country}</p>
                              </div>
                            </td>
                            <td className="p-3 text-right text-pearl">
                              ${city.currentRevenue.toLocaleString()}
                            </td>
                            <td className="p-3 text-right">
                              <span className={`inline-flex items-center gap-1 ${
                                city.growthRate > 15 ? 'text-green-500' :
                                city.growthRate > 5 ? 'text-yellow-500' : 'text-red-500'
                              }`}>
                                {city.growthRate > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                {city.growthRate.toFixed(1)}%
                              </span>
                            </td>
                            <td className="p-3 text-right text-champagne">
                              {city.marketShare.toFixed(1)}%
                            </td>
                            <td className="p-3 text-right text-champagne">
                              {city.customers.toLocaleString()}
                            </td>
                            <td className="p-3 text-right text-champagne">
                              ${city.averageBookingValue}
                            </td>
                            <td className="p-3 text-right text-champagne">
                              {city.satisfaction > 0 ? (
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />
                                  {city.satisfaction.toFixed(1)}
                                </div>
                              ) : (
                                <span className="text-champagne/50">-</span>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              <Badge className="bg-champagne/20 text-champagne">
                                {calculateCityScore(city).toFixed(0)}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Expansion Analysis Tab */}
          <TabsContent value="expand" className="space-y-6">
            {/* Expansion Recommendations */}
            <Card className="bg-charcoal/50 border-graphite/30">
              <CardHeader>
                <CardTitle className="text-pearl">Expansion Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {expansionRecommendations.map((rec, index) => (
                    <div key={index} className="p-6 bg-champagne/10 rounded-lg border border-champagne/30">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <MapPin className="w-6 h-6 text-champagne" />
                          <div>
                            <h3 className="text-xl font-serif text-pearl">{rec.cityName}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={getPriorityColor(rec.priority)}>
                                {rec.priority.toUpperCase()} PRIORITY
                              </Badge>
                              <span className={`text-sm font-medium ${getRiskColor(rec.risk)}`}>
                                {rec.risk.toUpperCase()} RISK
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-pearl">{rec.expectedROI}%</p>
                          <p className="text-champagne/50 text-sm">Expected ROI</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-champagne/50 text-sm">Investment Required</p>
                          <p className="text-xl font-semibold text-pearl">
                            ${rec.investmentRequired.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-champagne/50 text-sm">Time to Profit</p>
                          <p className="text-xl font-semibold text-pearl">
                            {rec.timeToProfit} months
                          </p>
                        </div>
                        <div>
                          <p className="text-champagne/50 text-sm">Market Size</p>
                          <p className="text-xl font-semibold text-pearl">
                            ${(rec.marketSize / 1000000).toFixed(1)}M
                          </p>
                        </div>
                        <div>
                          <p className="text-champagne/50 text-sm">Competitive Advantage</p>
                          <p className="text-sm text-pearl">{rec.competitiveAdvantage}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-champagne/70 text-sm mb-2">Action Plan:</p>
                        <ul className="space-y-1">
                          {rec.actionPlan.map((action, actionIndex) => (
                            <li key={actionIndex} className="text-champagne/60 text-sm flex items-start gap-2">
                              <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Market Opportunity Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-charcoal/50 border-graphite/30">
                <CardHeader>
                  <CardTitle className="text-pearl">Market Potential</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={expansionRecommendations}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#424242" />
                      <XAxis dataKey="cityName" stroke="#F5F1ED" />
                      <YAxis stroke="#F5F1ED" />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="expectedROI" fill="#D4A574" />
                      <Bar dataKey="marketSize" fill="#F5DEB3" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-charcoal/50 border-graphite/30">
                <CardHeader>
                  <CardTitle className="text-pearl">Investment Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {expansionRecommendations.map((rec, index) => {
                      const roiPerMonth = rec.expectedROI / rec.timeToProfit;
                      const maxROI = Math.max(...expansionRecommendations.map(r => r.expectedROI / r.timeToProfit));

                      return (
                        <div key={index} className="p-4 bg-charcoal/30 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-pearl font-medium">{rec.cityName}</span>
                            <Badge className={getPriorityColor(rec.priority)}>
                              {rec.priority}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-champagne/50">Investment:</span>
                            <span className="text-pearl">${rec.investmentRequired.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-champagne/50">ROI/Month:</span>
                            <span className="text-pearl">{roiPerMonth.toFixed(1)}%</span>
                          </div>
                          <div className="mt-2">
                            <div className="w-full bg-graphite/30 rounded-full h-2">
                              <div
                                className="bg-champagne h-2 rounded-full"
                                style={{ width: `${(roiPerMonth / maxROI) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Optimization Tab */}
          <TabsContent value="optimize" className="space-y-6">
            <Alert className="bg-champagne/10 border-champagne/30">
              <Lightbulb className="w-4 h-4" />
              <AlertDescription className="text-champagne/80">
                Optimization recommendations based on current city performance and market data.
                Implement these suggestions to improve efficiency and profitability across all locations.
              </AlertDescription>
            </Alert>

            {/* Performance Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-charcoal/50 border-graphite/30">
                <CardHeader>
                  <CardTitle className="text-pearl">Revenue Optimization</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <h4 className="text-green-500 font-medium mb-1">Increase Premium Services</h4>
                      <p className="text-champagne/70 text-sm">
                        Warsaw shows 22% higher revenue per customer for premium packages
                      </p>
                    </div>
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <h4 className="text-yellow-500 font-medium mb-1">Dynamic Pricing</h4>
                      <p className="text-champagne/70 text-sm">
                        Implement weekend pricing for 15% revenue increase
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-charcoal/50 border-graphite/30">
                <CardHeader>
                  <CardTitle className="text-pearl">Operational Efficiency</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <h4 className="text-blue-500 font-medium mb-1">Staff Optimization</h4>
                      <p className="text-champagne/70 text-sm">
                        Cross-train staff for 20% cost reduction in low-demand periods
                      </p>
                    </div>
                    <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                      <h4 className="text-purple-500 font-medium mb-1">Resource Allocation</h4>
                      <p className="text-champagne/70 text-sm">
                        Reallocate resources from Krakow to new expansion cities
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-charcoal/50 border-graphite/30">
                <CardHeader>
                  <CardTitle className="text-pearl">Customer Experience</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                      <h4 className="text-orange-500 font-medium mb-1">Loyalty Program</h4>
                      <p className="text-champagne/70 text-sm">
                        Implement cross-city loyalty for 35% retention improvement
                      </p>
                    </div>
                    <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-lg">
                      <h4 className="text-teal-500 font-medium mb-1">Mobile Booking</h4>
                      <p className="text-champagne/70 text-sm">
                        Mobile app could increase booking frequency by 25%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Implementation Timeline */}
            <Card className="bg-charcoal/50 border-graphite/30">
              <CardHeader>
                <CardTitle className="text-pearl">Optimization Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { phase: 'Immediate', timeframe: '0-30 days', actions: ['Implement dynamic pricing', 'Launch loyalty program beta', 'Optimize staff scheduling'] },
                    { phase: 'Short-term', timeframe: '1-3 months', actions: ['Mobile app development', 'Cross-city marketing campaign', 'Premium service expansion'] },
                    { phase: 'Long-term', timeframe: '3-12 months', actions: ['Complete city expansions', 'Advanced AI analytics', 'International market entry'] }
                  ].map((phase, index) => (
                    <div key={index} className="flex gap-6">
                      <div className="flex-shrink-0 w-32">
                        <h4 className="text-pearl font-medium">{phase.phase}</h4>
                        <p className="text-champagne/50 text-sm">{phase.timeframe}</p>
                      </div>
                      <div className="flex-1">
                        <div className="space-y-2">
                          {phase.actions.map((action, actionIndex) => (
                            <div key={actionIndex} className="flex items-center gap-2 p-3 bg-charcoal/30 rounded-lg">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className="text-champagne/70">{action}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MultiCityAnalytics;