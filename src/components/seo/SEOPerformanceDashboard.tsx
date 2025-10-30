import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  Search,
  Globe,
  MapPin,
  Calendar,
  Target,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  Eye,
  MousePointer,
  Download,
  RefreshCw
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface KeywordData {
  keyword: string;
  currentRank: number;
  previousRank: number;
  targetRank: number;
  searchVolume: number;
  difficulty: number;
  traffic: number;
  trend: 'up' | 'down' | 'stable';
  lastUpdated: string;
  category: 'beauty' | 'fitness' | 'local' | 'branded';
  location: string;
  estimatedValue: number;
}

interface PageMetrics {
  url: string;
  title: string;
  organicTraffic: number;
  organicTrafficChange: number;
  keywordRankings: number;
  avgPosition: number;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  conversionRate: number;
}

interface CompetitorData {
  name: string;
  domain: string;
  sharedKeywords: number;
  competingKeywords: number;
  strongerKeywords: number;
  weakerKeywords: number;
  opportunityScore: number;
  trafficEstimate: number;
}

interface LocalSEOMetrics {
  district: string;
  impressions: number;
  clicks: number;
  avgPosition: number;
  localPackAppearances: number;
  reviewScore: number;
  reviewCount: number;
  gmbViews: number;
  directionRequests: number;
  calls: number;
}

interface AlertData {
  type: 'warning' | 'error' | 'success' | 'info';
  title: string;
  message: string;
  timestamp: string;
  action?: string;
  severity: 'high' | 'medium' | 'low';
}

export function SEOPerformanceDashboard() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Mock data - in real app, this would come from API
  const [keywordData, setKeywordData] = useState<KeywordData[]>([
    {
      keyword: 'permanentny makijaż warszawa',
      currentRank: 3,
      previousRank: 5,
      targetRank: 3,
      searchVolume: 2400,
      difficulty: 45,
      traffic: 1250,
      trend: 'up',
      lastUpdated: '2024-01-15',
      category: 'beauty',
      location: 'warszawa',
      estimatedValue: 8500
    },
    {
      keyword: 'stylizacja brwi warszawa',
      currentRank: 2,
      previousRank: 4,
      targetRank: 3,
      searchVolume: 1900,
      difficulty: 38,
      traffic: 980,
      trend: 'up',
      lastUpdated: '2024-01-15',
      category: 'beauty',
      location: 'warszawa',
      estimatedValue: 6200
    },
    {
      keyword: 'trening personalny warszawa',
      currentRank: 8,
      previousRank: 7,
      targetRank: 3,
      searchVolume: 2200,
      difficulty: 52,
      traffic: 420,
      trend: 'down',
      lastUpdated: '2024-01-15',
      category: 'fitness',
      location: 'warszawa',
      estimatedValue: 3400
    },
    {
      keyword: 'salon urody śródmieście',
      currentRank: 1,
      previousRank: 2,
      targetRank: 3,
      searchVolume: 880,
      difficulty: 35,
      traffic: 680,
      trend: 'up',
      lastUpdated: '2024-01-15',
      category: 'local',
      location: 'śródmieście',
      estimatedValue: 2900
    }
  ]);

  const [pageMetrics, setPageMetrics] = useState<PageMetrics[]>([
    {
      url: '/services/permanentny-makijaz',
      title: 'Permanentny Makijaż Warszawa',
      organicTraffic: 2150,
      organicTrafficChange: 15.3,
      keywordRankings: 12,
      avgPosition: 4.2,
      impressions: 15600,
      clicks: 2150,
      ctr: 13.8,
      conversions: 45,
      conversionRate: 2.1
    },
    {
      url: '/services/stylizacja-brwi',
      title: 'Stylizacja Brwi Warszawa',
      organicTraffic: 1890,
      organicTrafficChange: -5.2,
      keywordRankings: 8,
      avgPosition: 3.8,
      impressions: 12100,
      clicks: 1890,
      ctr: 15.6,
      conversions: 38,
      conversionRate: 2.0
    }
  ]);

  const [competitorData, setCompetitorData] = useState<CompetitorData[]>([
    {
      name: 'Beauty Studio XYZ',
      domain: 'beautystudio.pl',
      sharedKeywords: 45,
      competingKeywords: 120,
      strongerKeywords: 23,
      weakerKeywords: 67,
      opportunityScore: 78,
      trafficEstimate: 8900
    },
    {
      name: 'Warsaw Beauty Center',
      domain: 'warsawbeauty.pl',
      sharedKeywords: 32,
      competingKeywords: 98,
      strongerKeywords: 18,
      weakerKeywords: 52,
      opportunityScore: 65,
      trafficEstimate: 6700
    }
  ]);

  const [localSEOMetrics, setLocalSEOMetrics] = useState<LocalSEOMetrics[]>([
    {
      district: 'Śródmieście',
      impressions: 4500,
      clicks: 890,
      avgPosition: 3.2,
      localPackAppearances: 145,
      reviewScore: 4.9,
      reviewCount: 234,
      gmbViews: 3200,
      directionRequests: 145,
      calls: 67
    },
    {
      district: 'Mokotów',
      impressions: 3200,
      clicks: 670,
      avgPosition: 4.1,
      localPackAppearances: 98,
      reviewScore: 4.8,
      reviewCount: 189,
      gmbViews: 2100,
      directionRequests: 89,
      calls: 45
    }
  ]);

  const [alerts, setAlerts] = useState<AlertData[]>([
    {
      type: 'warning',
      title: 'Ranking Drop Alert',
      message: 'Keyword "trening personalny warszawa" dropped from position 7 to 8',
      timestamp: '2024-01-15 14:30',
      action: 'Optimize content',
      severity: 'medium'
    },
    {
      type: 'success',
      title: 'New Top 3 Ranking',
      message: 'Achieved position 1 for "salon urody śródmieście"',
      timestamp: '2024-01-15 12:15',
      severity: 'high'
    }
  ]);

  const [trafficData] = useState([
    { date: '2024-01-01', traffic: 1800, conversions: 32 },
    { date: '2024-01-05', traffic: 2100, conversions: 38 },
    { date: '2024-01-10', traffic: 2400, conversions: 45 },
    { date: '2024-01-15', traffic: 2800, conversions: 56 }
  ]);

  const [rankingDistribution] = useState([
    { range: 'Top 3', count: 12, color: '#10b981' },
    { range: 'Top 5', count: 18, color: '#3b82f6' },
    { range: 'Top 10', count: 25, color: '#f59e0b' },
    { range: 'Top 20', count: 32, color: '#6b7280' }
  ]);

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    setLastUpdate(new Date());
    setTimeout(() => setLoading(false), 1000);
  };

  const getRankingTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4 bg-gray-300 rounded-full" />;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
    }
  };

  const exportData = (format: 'csv' | 'pdf') => {
    // Implementation for data export
    console.log(`Exporting data as ${format}`);
  };

  const totalTraffic = keywordData.reduce((sum, kw) => sum + kw.traffic, 0);
  const avgPosition = (keywordData.reduce((sum, kw) => sum + kw.currentRank, 0) / keywordData.length).toFixed(1);
  const top3Keywords = keywordData.filter(kw => kw.currentRank <= 3).length;
  const totalValue = keywordData.reduce((sum, kw) => sum + kw.estimatedValue, 0);

  return (
    <div className="p-6 space-y-6 bg-gray-50">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">SEO Performance Dashboard</h1>
          <p className="text-gray-600 mt-2">Warsaw Beauty & Fitness Market Analysis</p>
        </div>
        <div className="flex gap-4">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => exportData('csv')}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Organic Traffic</p>
                <p className="text-2xl font-bold text-gray-900">{totalTraffic.toLocaleString()}</p>
                <p className="text-xs text-green-600 mt-1">+12.5% vs last period</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Position</p>
                <p className="text-2xl font-bold text-gray-900">{avgPosition}</p>
                <p className="text-xs text-green-600 mt-1">+0.8 improvement</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Target className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Top 3 Keywords</p>
                <p className="text-2xl font-bold text-gray-900">{top3Keywords}</p>
                <p className="text-xs text-green-600 mt-1">+2 this week</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Search className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Estimated Value</p>
                <p className="text-2xl font-bold text-gray-900">€{totalValue.toLocaleString()}</p>
                <p className="text-xs text-green-600 mt-1">+18% growth</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="keywords" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
          <TabsTrigger value="pages">Pages</TabsTrigger>
          <TabsTrigger value="local">Local SEO</TabsTrigger>
          <TabsTrigger value="competitors">Competitors</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        {/* Keywords Tab */}
        <TabsContent value="keywords" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Keyword Performance Tracking
              </CardTitle>
              <CardDescription>
                Track rankings for Warsaw beauty and fitness keywords
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Keyword</th>
                      <th className="text-left p-2">Category</th>
                      <th className="text-left p-2">Location</th>
                      <th className="text-left p-2">Current</th>
                      <th className="text-left p-2">Previous</th>
                      <th className="text-left p-2">Target</th>
                      <th className="text-left p-2">Traffic</th>
                      <th className="text-left p-2">Volume</th>
                      <th className="text-left p-2">Value</th>
                      <th className="text-left p-2">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {keywordData.map((keyword, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{keyword.keyword}</td>
                        <td className="p-2">
                          <Badge variant={keyword.category === 'beauty' ? 'default' : 'secondary'}>
                            {keyword.category}
                          </Badge>
                        </td>
                        <td className="p-2 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {keyword.location}
                        </td>
                        <td className="p-2">
                          <span className={`font-bold ${
                            keyword.currentRank <= 3 ? 'text-green-600' :
                            keyword.currentRank <= 10 ? 'text-blue-600' : 'text-gray-600'
                          }`}>
                            #{keyword.currentRank}
                          </span>
                        </td>
                        <td className="p-2">#{keyword.previousRank}</td>
                        <td className="p-2">#{keyword.targetRank}</td>
                        <td className="p-2">{keyword.traffic.toLocaleString()}</td>
                        <td className="p-2">{keyword.searchVolume.toLocaleString()}</td>
                        <td className="p-2">€{keyword.estimatedValue.toLocaleString()}</td>
                        <td className="p-2">
                          {getRankingTrendIcon(keyword.trend)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pages Tab */}
        <TabsContent value="pages" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Page Performance</CardTitle>
                <CardDescription>Organic traffic and conversions by page</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pageMetrics.map((page, index) => (
                    <div key={index} className="border-b pb-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{page.title}</h4>
                          <p className="text-xs text-gray-500">{page.url}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{page.organicTraffic.toLocaleString()}</p>
                          <p className={`text-xs ${page.organicTrafficChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {page.organicTrafficChange > 0 ? '+' : ''}{page.organicTrafficChange}%
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div>
                          <p className="text-gray-500">Rankings</p>
                          <p className="font-medium">{page.keywordRankings}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Avg Position</p>
                          <p className="font-medium">{page.avgPosition}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">CTR</p>
                          <p className="font-medium">{page.ctr}%</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Conversions</p>
                          <p className="font-medium">{page.conversions}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Traffic Trends</CardTitle>
                <CardDescription>Organic traffic over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trafficData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="traffic" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Local SEO Tab */}
        <TabsContent value="local" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  District Performance
                </CardTitle>
                <CardDescription>Local SEO metrics by Warsaw district</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {localSEOMetrics.map((district, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium">{district.district}</h4>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm">{district.reviewScore}</span>
                          </div>
                          <span className="text-sm text-gray-500">({district.reviewCount} reviews)</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Impressions</p>
                          <p className="font-medium">{district.impressions.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Clicks</p>
                          <p className="font-medium">{district.clicks.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Avg Position</p>
                          <p className="font-medium">{district.avgPosition}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Local Pack</p>
                          <p className="font-medium">{district.localPackAppearances}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">GMB Views</p>
                          <p className="font-medium">{district.gmbViews.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Directions</p>
                          <p className="font-medium">{district.directionRequests}</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-500">Local Pack Performance</span>
                          <span>{((district.localPackAppearances / district.impressions) * 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={(district.localPackAppearances / district.impressions) * 100} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ranking Distribution</CardTitle>
                <CardDescription>Keyword positions breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={rankingDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      label={({ range, count }) => `${range}: ${count}`}
                    >
                      {rankingDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Competitors Tab */}
        <TabsContent value="competitors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Competitor Analysis</CardTitle>
              <CardDescription>Monitor competing beauty and fitness businesses in Warsaw</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Competitor</th>
                      <th className="text-left p-2">Domain</th>
                      <th className="text-left p-2">Shared Keywords</th>
                      <th className="text-left p-2">Stronger Keywords</th>
                      <th className="text-left p-2">Opportunity Score</th>
                      <th className="text-left p-2">Traffic Est.</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {competitorData.map((competitor, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{competitor.name}</td>
                        <td className="p-2 text-blue-600">{competitor.domain}</td>
                        <td className="p-2">{competitor.sharedKeywords}</td>
                        <td className="p-2">
                          <span className="text-red-600">{competitor.strongerKeywords}</span>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: `${competitor.opportunityScore}%` }}
                              ></div>
                            </div>
                            <span className="text-sm">{competitor.opportunityScore}%</span>
                          </div>
                        </td>
                        <td className="p-2">{competitor.trafficEstimate.toLocaleString()}</td>
                        <td className="p-2">
                          <Button size="sm" variant="outline">Analyze</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Traffic & Conversions</CardTitle>
                <CardDescription>Monthly performance trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trafficData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Bar yAxisId="right" dataKey="conversions" fill="#10b981" />
                    <Line yAxisId="left" type="monotone" dataKey="traffic" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Key SEO indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Organic CTR</span>
                    <span className="font-medium">14.2%</span>
                  </div>
                  <Progress value={14.2} className="h-2" />

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Conversion Rate</span>
                    <span className="font-medium">2.8%</span>
                  </div>
                  <Progress value={2.8} className="h-2" />

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Top 10 Position Rate</span>
                    <span className="font-medium">68%</span>
                  </div>
                  <Progress value={68} className="h-2" />

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Local Pack Appearance</span>
                    <span className="font-medium">45%</span>
                  </div>
                  <Progress value={45} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SEO Alerts & Notifications</CardTitle>
              <CardDescription>Real-time monitoring and recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.map((alert, index) => (
                  <div key={index} className={`border rounded-lg p-4 ${
                    alert.type === 'error' ? 'border-red-200 bg-red-50' :
                    alert.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                    alert.type === 'success' ? 'border-green-200 bg-green-50' :
                    'border-blue-200 bg-blue-50'
                  }`}>
                    <div className="flex items-start gap-3">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium">{alert.title}</h4>
                          <span className="text-xs text-gray-500">{alert.timestamp}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                        {alert.action && (
                          <Button size="sm" variant="outline" className="mt-2">
                            {alert.action}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer Info */}
      <div className="text-center text-sm text-gray-500">
        <p>Last updated: {lastUpdate.toLocaleString()} | Data refreshed every 6 hours</p>
      </div>
    </div>
  );
}

export default SEOPerformanceDashboard;