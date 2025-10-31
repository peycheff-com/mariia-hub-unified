import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Eye,
  MousePointer,
  Share2,
  Heart,
  MessageCircle,
  Clock,
  Calendar,
  Filter,
  Download,
  BarChart3,
  PieChart,
  Activity,
  Users,
  Target,
  Zap,
  Award,
  Globe,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Star,
  Bookmark
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

interface ContentPerformanceMetrics {
  id: string;
  title: string;
  type: 'blog' | 'service' | 'page' | 'gallery';
  url: string;
  publishedAt: Date;

  // Engagement metrics
  views: number;
  uniqueViews: number;
  averageTimeOnPage: number; // seconds
  bounceRate: number; // percentage
  scrollDepth: number; // percentage
  clickThroughRate: number; // percentage

  // Social metrics
  shares: number;
  likes: number;
  comments: number;
  saves: number;

  // Conversion metrics
  conversions: number;
  conversionRate: number; // percentage
  revenue: number;

  // SEO metrics
  organicSearchViews: number;
  keywordRankings: {
    keyword: string;
    position: number;
    searchVolume: number;
  }[];
  backlinks: number;

  // Performance trends
  trends: {
    date: string;
    views: number;
    engagement: number;
    conversions: number;
  }[];

  // Audience insights
  audience: {
    demographics: {
      age: string;
      gender: string;
      location: string;
    };
    source: string;
    device: string;
  };

  // Content quality score
  qualityScore: number; // 0-100
  readabilityScore: number; // 0-100
  seoScore: number; // 0-100

  // Popular sections
  hotspots: {
    section: string;
    engagement: number;
    clicks: number;
  }[];
}

interface ContentInsights {
  topPerforming: ContentPerformanceMetrics[];
  underperforming: ContentPerformanceMetrics[];
  trending: ContentPerformanceMetrics[];
  recommendations: {
    type: 'seo' | 'engagement' | 'conversion' | 'technical';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    expectedImpact: string;
  }[];
}

const ContentPerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<ContentPerformanceMetrics[]>([]);
  const [insights, setInsights] = useState<ContentInsights | null>(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [contentType, setContentType] = useState('all');
  const [sortBy, setSortBy] = useState('views');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMetric, setSelectedMetric] = useState<ContentPerformanceMetrics | null>(null);
  const { toast } = useToast();

  // Mock data - replace with actual analytics data
  useEffect(() => {
    const mockMetrics: ContentPerformanceMetrics[] = [
      {
        id: '1',
        title: 'Complete Guide to Lash Extensions',
        type: 'blog',
        url: '/blog/lash-extensions-guide',
        publishedAt: new Date('2024-01-15T10:00:00'),

        views: 15420,
        uniqueViews: 12350,
        averageTimeOnPage: 245, // 4+ minutes
        bounceRate: 32,
        scrollDepth: 78,
        clickThroughRate: 12,

        shares: 245,
        likes: 892,
        comments: 67,
        saves: 156,

        conversions: 89,
        conversionRate: 5.8,
        revenue: 12450,

        organicSearchViews: 8900,
        keywordRankings: [
          { keyword: 'lash extensions guide', position: 3, searchVolume: 2400 },
          { keyword: 'how long do lash extensions last', position: 5, searchVolume: 1800 },
          { keyword: 'lash extension aftercare', position: 7, searchVolume: 1200 }
        ],
        backlinks: 12,

        trends: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          views: Math.floor(Math.random() * 500) + 300,
          engagement: Math.floor(Math.random() * 100) + 50,
          conversions: Math.floor(Math.random() * 10) + 2
        })),

        audience: {
          demographics: {
            age: '25-34',
            gender: 'Female',
            location: 'Warsaw'
          },
          source: 'Organic Search',
          device: 'Mobile'
        },

        qualityScore: 92,
        readabilityScore: 88,
        seoScore: 95,

        hotspots: [
          { section: 'Before & After Gallery', engagement: 89, clicks: 234 },
          { section: 'Pricing Section', engagement: 76, clicks: 189 },
          { section: 'FAQ Section', engagement: 68, clicks: 145 }
        ]
      },
      {
        id: '2',
        title: 'Brow Lamination Service',
        type: 'service',
        url: '/services/brow-lamination',
        publishedAt: new Date('2024-01-10T14:00:00'),

        views: 8750,
        uniqueViews: 7200,
        averageTimeOnPage: 180,
        bounceRate: 45,
        scrollDepth: 65,
        clickThroughRate: 8,

        shares: 89,
        likes: 234,
        comments: 23,
        saves: 67,

        conversions: 156,
        conversionRate: 17.8,
        revenue: 23400,

        organicSearchViews: 3400,
        keywordRankings: [
          { keyword: 'brow lamination warsaw', position: 2, searchVolume: 890 },
          { keyword: 'brow lamination price', position: 4, searchVolume: 600 }
        ],
        backlinks: 8,

        trends: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          views: Math.floor(Math.random() * 300) + 200,
          engagement: Math.floor(Math.random() * 80) + 30,
          conversions: Math.floor(Math.random() * 8) + 3
        })),

        audience: {
          demographics: {
            age: '18-24',
            gender: 'Female',
            location: 'Warsaw'
          },
          source: 'Direct',
          device: 'Mobile'
        },

        qualityScore: 85,
        readabilityScore: 82,
        seoScore: 88,

        hotspots: [
          { section: 'Service Description', engagement: 72, clicks: 198 },
          { section: 'Gallery', engagement: 89, clicks: 267 },
          { section: 'Booking Button', engagement: 95, clicks: 445 }
        ]
      },
      {
        id: '3',
        title: 'Skincare Tips for Winter',
        type: 'blog',
        url: '/blog/winter-skincare-tips',
        publishedAt: new Date('2024-01-05T09:00:00'),

        views: 3200,
        uniqueViews: 2800,
        averageTimeOnPage: 95,
        bounceRate: 68,
        scrollDepth: 45,
        clickThroughRate: 3,

        shares: 23,
        likes: 67,
        comments: 8,
        saves: 34,

        conversions: 12,
        conversionRate: 3.8,
        revenue: 1800,

        organicSearchViews: 1200,
        keywordRankings: [
          { keyword: 'winter skincare tips', position: 15, searchVolume: 3400 },
          { keyword: 'dry skin winter', position: 18, searchVolume: 2100 }
        ],
        backlinks: 3,

        trends: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          views: Math.floor(Math.random() * 150) + 50,
          engagement: Math.floor(Math.random() * 40) + 10,
          conversions: Math.floor(Math.random() * 2) + 0
        })),

        audience: {
          demographics: {
            age: '35-44',
            gender: 'Female',
            location: 'Krakow'
          },
          source: 'Social Media',
          device: 'Desktop'
        },

        qualityScore: 78,
        readabilityScore: 85,
        seoScore: 72,

        hotspots: [
          { section: 'Introduction', engagement: 45, clicks: 56 },
          { section: 'Product Recommendations', engagement: 62, clicks: 89 }
        ]
      }
    ];

    const mockInsights: ContentInsights = {
      topPerforming: mockMetrics.filter(m => m.conversionRate > 10 || m.views > 5000),
      underperforming: mockMetrics.filter(m => m.conversionRate < 5 && m.bounceRate > 60),
      trending: mockMetrics.filter(m => {
        const recentViews = m.trends.slice(-7).reduce((sum, t) => sum + t.views, 0);
        const previousViews = m.trends.slice(-14, -7).reduce((sum, t) => sum + t.views, 0);
        return recentViews > previousViews * 1.2;
      }),
      recommendations: [
        {
          type: 'seo',
          priority: 'high',
          title: 'Improve keyword rankings for "winter skincare tips"',
          description: 'This content has high potential but ranks poorly for its target keywords.',
          expectedImpact: '+40% organic traffic'
        },
        {
          type: 'engagement',
          priority: 'medium',
          title: 'Add more visual content to "Skincare Tips for Winter"',
          description: 'Low scroll depth indicates readers are not engaged with the content.',
          expectedImpact: '+25% average time on page'
        },
        {
          type: 'conversion',
          priority: 'high',
          title: 'Optimize call-to-action on blog posts',
          description: 'Low click-through rates suggest CTAs need improvement.',
          expectedImpact: '+15% conversion rate'
        }
      ]
    };

    setMetrics(mockMetrics);
    setInsights(mockInsights);
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(amount);
  };

  const getPerformanceColor = (value: number, type: string) => {
    const thresholds = {
      views: { good: 10000, bad: 1000 },
      engagement: { good: 70, bad: 30 },
      conversionRate: { good: 10, bad: 3 },
      bounceRate: { good: 40, bad: 60 }
    };

    const threshold = thresholds[type as keyof typeof thresholds];
    if (!threshold) return 'text-gray-500';

    if (type === 'bounceRate') {
      if (value <= threshold.good) return 'text-green-600';
      if (value >= threshold.bad) return 'text-red-600';
      return 'text-amber-600';
    } else {
      if (value >= threshold.good) return 'text-green-600';
      if (value <= threshold.bad) return 'text-red-600';
      return 'text-amber-600';
    }
  };

  const MetricCard = ({ title, value, change, icon: Icon, format = 'number' }: {
    title: string;
    value: number;
    change?: number;
    icon: any;
    format?: 'number' | 'currency' | 'percentage' | 'duration';
  }) => {
    const formattedValue = format === 'currency' ? formatCurrency(value) :
                         format === 'percentage' ? `${value}%` :
                         format === 'duration' ? formatDuration(value) :
                         value.toLocaleString();

    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold">{formattedValue}</p>
              {change !== undefined && (
                <div className={`flex items-center text-sm ${
                  change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {change >= 0 ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
                  {Math.abs(change)}%
                </div>
              )}
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Icon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const ContentMetricRow = ({ metric }: { metric: ContentPerformanceMetrics }) => {
    return (
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold">{metric.title}</h3>
                <Badge variant="outline">{metric.type}</Badge>
                <div className="flex items-center gap-1">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium">{metric.qualityScore}/100</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Views</span>
                  <p className={`font-medium ${getPerformanceColor(metric.views, 'views')}`}>
                    {metric.views.toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Engagement</span>
                  <p className={`font-medium ${getPerformanceColor(metric.scrollDepth, 'engagement')}`}>
                    {metric.scrollDepth}%
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Bounce Rate</span>
                  <p className={`font-medium ${getPerformanceColor(metric.bounceRate, 'bounceRate')}`}>
                    {metric.bounceRate}%
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Conversion</span>
                  <p className={`font-medium ${getPerformanceColor(metric.conversionRate, 'conversionRate')}`}>
                    {metric.conversionRate}%
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Revenue</span>
                  <p className="font-medium">{formatCurrency(metric.revenue)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Avg Time</span>
                  <p className="font-medium">{formatDuration(metric.averageTimeOnPage)}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{metric.uniqueViews.toLocaleString()} unique</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  <span>{metric.likes} likes</span>
                </div>
                <div className="flex items-center gap-1">
                  <Share2 className="w-4 h-4" />
                  <span>{metric.shares} shares</span>
                </div>
                <div className="flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  <span>{metric.conversions} conversions</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 ml-4">
              <Button variant="outline" size="sm">
                <BarChart3 className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const totalViews = metrics.reduce((sum, m) => sum + m.views, 0);
  const totalConversions = metrics.reduce((sum, m) => sum + m.conversions, 0);
  const totalRevenue = metrics.reduce((sum, m) => sum + m.revenue, 0);
  const averageEngagement = metrics.length > 0 ? Math.round(metrics.reduce((sum, m) => sum + m.scrollDepth, 0) / metrics.length) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Content Performance Dashboard</h2>
          <p className="text-muted-foreground">Track and analyze your content performance</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Views"
          value={totalViews}
          change={12.5}
          icon={Eye}
        />
        <MetricCard
          title="Conversions"
          value={totalConversions}
          change={8.3}
          icon={Target}
        />
        <MetricCard
          title="Revenue"
          value={totalRevenue}
          change={15.7}
          icon={TrendingUp}
          format="currency"
        />
        <MetricCard
          title="Avg Engagement"
          value={averageEngagement}
          change={-2.1}
          icon={Activity}
          format="number"
        />
      </div>

      {/* Content Analysis Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="top-performing">Top Performing</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">All Content Performance</h3>
            <div className="flex items-center gap-3">
              <Select value={contentType} onValueChange={setContentType}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="blog">Blog</SelectItem>
                  <SelectItem value="service">Services</SelectItem>
                  <SelectItem value="page">Pages</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="views">Most Views</SelectItem>
                  <SelectItem value="conversions">Most Conversions</SelectItem>
                  <SelectItem value="engagement">Highest Engagement</SelectItem>
                  <SelectItem value="revenue">Most Revenue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            {metrics
              .filter(m => searchQuery === '' || m.title.toLowerCase().includes(searchQuery.toLowerCase()))
              .filter(m => contentType === 'all' || m.type === contentType)
              .sort((a, b) => {
                if (sortBy === 'views') return b.views - a.views;
                if (sortBy === 'conversions') return b.conversions - a.conversions;
                if (sortBy === 'engagement') return b.scrollDepth - a.scrollDepth;
                if (sortBy === 'revenue') return b.revenue - a.revenue;
                return 0;
              })
              .map(metric => (
                <ContentMetricRow key={metric.id} metric={metric} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="top-performing" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500" />
                  Top Performing Content
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {insights?.topPerforming.map(metric => (
                    <ContentMetricRow key={metric.id} metric={metric} />
                  ))}
                  {(!insights?.topPerforming || insights.topPerforming.length === 0) && (
                    <p className="text-muted-foreground text-center py-8">
                      No top performing content identified yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Trending Content
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {insights?.trending.map(metric => (
                    <ContentMetricRow key={metric.id} metric={metric} />
                  ))}
                  {(!insights?.trending || insights.trending.length === 0) && (
                    <p className="text-muted-foreground text-center py-8">
                      No trending content identified yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  Audience Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Top Demographics</h4>
                    <div className="space-y-2">
                      {metrics.reduce((acc, m) => {
                        const key = `${m.audience.demographics.age} - ${m.audience.demographics.gender}`;
                        acc[key] = (acc[key] || 0) + m.views;
                        return acc;
                      }, {} as Record<string, number>)}
                      {Object.entries(
                        metrics.reduce((acc, m) => {
                          const key = `${m.audience.demographics.age} - ${m.audience.demographics.gender}`;
                          acc[key] = (acc[key] || 0) + m.views;
                          return acc;
                        }, {} as Record<string, number>)
                      )
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 5)
                        .map(([demo, views]) => (
                          <div key={demo} className="flex justify-between items-center">
                            <span className="text-sm">{demo}</span>
                            <Badge variant="secondary">{views.toLocaleString()} views</Badge>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Top Locations</h4>
                    <div className="space-y-2">
                      {metrics.reduce((acc, m) => {
                        acc[m.audience.demographics.location] = (acc[m.audience.demographics.location] || 0) + m.views;
                        return acc;
                      }, {} as Record<string, number>)}
                      {Object.entries(
                        metrics.reduce((acc, m) => {
                          acc[m.audience.demographics.location] = (acc[m.audience.demographics.location] || 0) + m.views;
                          return acc;
                        }, {} as Record<string, number>)
                      )
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 5)
                        .map(([location, views]) => (
                          <div key={location} className="flex justify-between items-center">
                            <span className="text-sm">{location}</span>
                            <Badge variant="secondary">{views.toLocaleString()} views</Badge>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-green-500" />
                  SEO Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Top Keywords</h4>
                    <div className="space-y-2">
                      {metrics.flatMap(m => m.keywordRankings)
                        .sort((a, b) => b.searchVolume - a.searchVolume)
                        .slice(0, 5)
                        .map((keyword, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <div>
                              <div className="text-sm font-medium">{keyword.keyword}</div>
                              <div className="text-xs text-muted-foreground">
                                Position #{keyword.position} • {keyword.searchVolume} searches/month
                              </div>
                            </div>
                            <Badge variant={keyword.position <= 5 ? 'default' : 'secondary'}>
                              #{keyword.position}
                            </Badge>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Traffic Sources</h4>
                    <div className="space-y-2">
                      {metrics.reduce((acc, m) => {
                        acc[m.audience.source] = (acc[m.audience.source] || 0) + m.views;
                        return acc;
                      }, {} as Record<string, number>)}
                      {Object.entries(
                        metrics.reduce((acc, m) => {
                          acc[m.audience.source] = (acc[m.audience.source] || 0) + m.views;
                          return acc;
                        }, {} as Record<string, number>)
                      )
                        .sort(([,a], [,b]) => b - a)
                        .map(([source, views]) => (
                          <div key={source} className="flex justify-between items-center">
                            <span className="text-sm">{source}</span>
                            <div className="flex items-center gap-2">
                              <Progress
                                value={(views / totalViews) * 100}
                                className="w-16 h-2"
                              />
                              <span className="text-xs text-muted-foreground">
                                {Math.round((views / totalViews) * 100)}%
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                AI-Powered Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights?.recommendations.map((rec, index) => (
                  <Card key={index} className="border-l-4 border-l-amber-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{rec.title}</h4>
                            <Badge variant={
                              rec.priority === 'high' ? 'destructive' :
                              rec.priority === 'medium' ? 'default' : 'secondary'
                            }>
                              {rec.priority} priority
                            </Badge>
                            <Badge variant="outline">{rec.type}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {rec.description}
                          </p>
                          <p className="text-sm font-medium text-green-600">
                            Expected impact: {rec.expectedImpact}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          Apply
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {(!insights?.recommendations || insights.recommendations.length === 0) && (
                  <p className="text-muted-foreground text-center py-8">
                    No recommendations available at this time
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Underperforming Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-500" />
                Content That Needs Attention
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights?.underperforming.map(metric => (
                  <ContentMetricRow key={metric.id} metric={metric} />
                ))}
                {(!insights?.underperforming || insights.underperforming.length === 0) && (
                  <p className="text-muted-foreground text-center py-8">
                    All content is performing well!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContentPerformanceDashboard;