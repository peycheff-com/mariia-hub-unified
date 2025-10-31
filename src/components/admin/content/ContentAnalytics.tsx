import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { format, subDays, subMonths, startOfDay, endOfDay } from 'date-fns';

import { cn } from '@/lib/utils';
import { contentStrategyService } from '@/services/content-strategy.service';
import { ContentStrategyItem, ContentPillar, TargetAudienceSegment } from '@/types/content-strategy';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Progress,
} from '@/components/ui/progress';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
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
  BarChart3,
  TrendingUp,
  TrendingDown,
  Eye,
  Users,
  MessageSquare,
  Heart,
  Share2,
  Clock,
  Target,
  Zap,
  Award,
  Globe,
  Filter,
  Download,
  RefreshCw,
  Calendar,
  Settings,
  Info,
  AlertCircle,
  CheckCircle2,
  Star,
  Brain,
  Rocket,
  Shield,
  Lightbulb,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';

interface ContentAnalytics {
  id: string;
  content_id: string;
  date: string;
  views: number;
  unique_views: number;
  avg_time_on_page: number;
  bounce_rate: number;
  social_shares: number;
  comments: number;
  likes: number;
  conversions: number;
  revenue: number;
  authority_score: number;
  educational_score: number;
  warsaw_engagement_rate: number;
  local_business_traffic: number;
  seo_rankings: Record<string, number>;
}

interface ContentPerformance {
  content_id: string;
  title: string;
  content_type: string;
  total_views: number;
  total_engagement: number;
  conversion_rate: number;
  authority_score: number;
  trend_direction: 'up' | 'down' | 'stable';
  trend_percentage: number;
  revenue_impact: number;
  local_relevance: number;
}

interface ContentOptimization {
  id: string;
  content_id: string;
  optimization_type: 'seo' | 'engagement' | 'conversion' | 'authority' | 'local_seo';
  current_performance: number;
  potential_improvement: number;
  recommendations: string[];
  implementation_difficulty: 'low' | 'medium' | 'high';
  estimated_impact: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
}

interface ContentAnalyticsProps {
  className?: string;
  dateRange?: '7d' | '30d' | '90d' | '1y';
  defaultView?: 'overview' | 'performance' | 'optimization' | 'reports';
}

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export const ContentAnalytics = ({
  className,
  dateRange = '30d',
  defaultView = 'overview'
}: ContentAnalyticsProps) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(defaultView);
  const [selectedDateRange, setSelectedDateRange] = useState(dateRange);
  const [contentAnalytics, setContentAnalytics] = useState<ContentAnalytics[]>([]);
  const [contentPerformance, setContentPerformance] = useState<ContentPerformance[]>([]);
  const [contentOptimizations, setContentOptimizations] = useState<ContentOptimization[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ContentPerformance | null>(null);
  const [showOptimizationDialog, setShowOptimizationDialog] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    loadAnalyticsData();
  }, [selectedDateRange]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadAnalyticsData();
      }, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, selectedDateRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);

      // Generate mock analytics data
      const mockAnalytics: ContentAnalytics[] = [];
      const mockPerformance: ContentPerformance[] = [];
      const mockOptimizations: ContentOptimization[] = [];

      // Generate analytics for the last 30 days
      for (let i = 0; i < 30; i++) {
        const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
        mockAnalytics.push({
          id: `analytics-${i}`,
          content_id: `content-${Math.floor(Math.random() * 10)}`,
          date,
          views: Math.floor(Math.random() * 1000) + 100,
          unique_views: Math.floor(Math.random() * 500) + 50,
          avg_time_on_page: Math.floor(Math.random() * 300) + 60,
          bounce_rate: Math.random() * 100,
          social_shares: Math.floor(Math.random() * 50) + 5,
          comments: Math.floor(Math.random() * 20) + 2,
          likes: Math.floor(Math.random() * 100) + 10,
          conversions: Math.floor(Math.random() * 10) + 1,
          revenue: Math.random() * 500 + 50,
          authority_score: Math.random() * 40 + 60,
          educational_score: Math.random() * 30 + 70,
          warsaw_engagement_rate: Math.random() * 100,
          local_business_traffic: Math.floor(Math.random() * 50) + 5,
          seo_rankings: {
            'lip enhancement warsaw': Math.floor(Math.random() * 10) + 1,
            'beauty salon warsaw': Math.floor(Math.random() * 10) + 1,
            'permanent makeup warsaw': Math.floor(Math.random() * 10) + 1
          }
        });
      }

      // Generate performance data for different content types
      const contentTypes = ['blog_post', 'social_media', 'video_script', 'email_newsletter'];
      const contentTitles = [
        'Warsaw Beauty Trends 2025',
        'Advanced Lip Enhancement Techniques',
        'Natural Brow Artistry Guide',
        'Seasonal Skincare for Warsaw Climate',
        'Client Consultation Best Practices',
        'Marketing Strategies for Beauty Salons',
        'Social Media Success Stories',
        'Client Retention Strategies'
      ];

      contentTitles.forEach((title, index) => {
        const trend = Math.random() > 0.5 ? 'up' : Math.random() > 0.7 ? 'down' : 'stable';
        const trendPercentage = trend === 'stable' ? Math.random() * 5 : Math.random() * 30 + 10;

        mockPerformance.push({
          content_id: `content-${index}`,
          title,
          content_type: contentTypes[Math.floor(Math.random() * contentTypes.length)],
          total_views: Math.floor(Math.random() * 10000) + 1000,
          total_engagement: Math.floor(Math.random() * 500) + 100,
          conversion_rate: Math.random() * 10 + 2,
          authority_score: Math.random() * 40 + 60,
          trend_direction: trend,
          trend_percentage: trend === 'stable' ? 0 : (trend === 'up' ? trendPercentage : -trendPercentage),
          revenue_impact: Math.random() * 5000 + 500,
          local_relevance: Math.random() * 100
        });
      });

      // Generate optimization suggestions
      const optimizationTypes = ['seo', 'engagement', 'conversion', 'authority', 'local_seo'];
      contentTitles.slice(0, 5).forEach((title, index) => {
        const optimizationType = optimizationTypes[Math.floor(Math.random() * optimizationTypes.length)];

        mockOptimizations.push({
          id: `optimization-${index}`,
          content_id: `content-${index}`,
          optimization_type: optimizationType as any,
          current_performance: Math.random() * 50 + 40,
          potential_improvement: Math.random() * 30 + 10,
          recommendations: generateOptimizationRecommendations(optimizationType),
          implementation_difficulty: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any,
          estimated_impact: Math.random() * 25 + 5,
          priority: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as any,
          status: ['pending', 'in_progress', 'completed'][Math.floor(Math.random() * 3)] as any,
          created_at: new Date().toISOString()
        });
      });

      setContentAnalytics(mockAnalytics);
      setContentPerformance(mockPerformance);
      setContentOptimizations(mockOptimizations);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const generateOptimizationRecommendations = (type: string): string[] => {
    const recommendations: Record<string, string[]> = {
      seo: [
        'Add target keywords to title and headings',
        'Optimize meta description for better CTR',
        'Improve internal linking structure',
        'Add local SEO terms for Warsaw market'
      ],
      engagement: [
        'Add more visual content and images',
        'Include interactive elements or polls',
        'Add compelling call-to-action',
        'Improve content readability'
      ],
      conversion: [
        'Add clearer service CTAs',
        'Include testimonials and social proof',
        'Optimize landing page elements',
        'Add urgency indicators'
      ],
      authority: [
        'Add expert quotes and citations',
        'Include data-driven insights',
        'Add relevant case studies',
        'Cite reputable sources'
      ],
      local_seo: [
        'Add Warsaw-specific examples',
        'Include local landmarks references',
        'Mention local events and seasons',
        'Add Polish language keywords'
      ]
    };

    return recommendations[type] || ['Improve overall content quality'];
  };

  const calculateTotalMetrics = () => {
    const totalViews = contentAnalytics.reduce((acc, item) => acc + item.views, 0);
    const totalEngagement = contentAnalytics.reduce((acc, item) => acc + item.social_shares + item.comments + item.likes, 0);
    const totalConversions = contentAnalytics.reduce((acc, item) => acc + item.conversions, 0);
    const totalRevenue = contentAnalytics.reduce((acc, item) => acc + item.revenue, 0);
    const avgAuthorityScore = contentAnalytics.length > 0
      ? contentAnalytics.reduce((acc, item) => acc + item.authority_score, 0) / contentAnalytics.length
      : 0;

    return {
      totalViews,
      totalEngagement,
      totalConversions,
      totalRevenue,
      avgAuthorityScore
    };
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowUp className="h-4 w-4 text-green-500" />;
      case 'down': return <ArrowDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const prepareChartTimeData = () => {
    return contentAnalytics.slice(0, 7).reverse().map(item => ({
      date: format(new Date(item.date), 'MMM dd'),
      views: item.views,
      engagement: item.social_shares + item.comments + item.likes,
      conversions: item.conversions
    }));
  };

  const prepareContentTypeData = () => {
    const typeCounts: Record<string, number> = {};
    contentPerformance.forEach(item => {
      typeCounts[item.content_type] = (typeCounts[item.content_type] || 0) + 1;
    });

    return Object.entries(typeCounts).map(([type, count]) => ({
      type: type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      count,
      fill: COLORS[Object.keys(typeCounts).indexOf(type)]
    }));
  };

  const prepareLocalEngagementData = () => {
    const avgWarsawEngagement = contentAnalytics.length > 0
      ? contentAnalytics.reduce((acc, item) => acc + item.warsaw_engagement_rate, 0) / contentAnalytics.length
      : 0;

    return [
      { name: 'Warsaw Engagement', value: avgWarsawEngagement, fill: '#8b5cf6' },
      { name: 'Other Regions', value: 100 - avgWarsawEngagement, fill: '#e5e7eb' }
    ];
  };

  const metrics = calculateTotalMetrics();

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{metrics.totalViews.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Total Views</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Heart className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{metrics.totalEngagement.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Total Engagement</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{metrics.totalConversions}</p>
                <p className="text-sm text-gray-600">Conversions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">${(metrics.totalRevenue).toLocaleString()}</p>
                <p className="text-sm text-gray-600">Revenue Impact</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Award className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{Math.round(metrics.avgAuthorityScore)}</p>
                <p className="text-sm text-gray-600">Authority Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance Trends</CardTitle>
            <CardDescription>Last 7 days performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={prepareChartTimeData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="views" stroke="#3b82f6" name="Views" />
                <Line type="monotone" dataKey="engagement" stroke="#ef4444" name="Engagement" />
                <Line type="monotone" dataKey="conversions" stroke="#10b981" name="Conversions" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content Type Distribution</CardTitle>
            <CardDescription>Performance by content type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={prepareContentTypeData()}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="count"
                  label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                >
                  {prepareContentTypeData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Local Engagement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Warsaw Market Engagement
          </CardTitle>
          <CardDescription>Local vs. international audience engagement</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={prepareLocalEngagementData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );

  const renderPerformance = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Content Performance</h3>
          <p className="text-sm text-gray-600">
            Detailed performance metrics for all content
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => loadAnalyticsData()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Content Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Engagement</TableHead>
                <TableHead>Conversion Rate</TableHead>
                <TableHead>Authority Score</TableHead>
                <TableHead>Trend</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contentPerformance.map((content) => (
                <TableRow key={content.content_id}>
                  <TableCell className="font-medium max-w-xs">
                    <div className="truncate">{content.title}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{content.content_type}</Badge>
                  </TableCell>
                  <TableCell>{content.total_views.toLocaleString()}</TableCell>
                  <TableCell>{content.total_engagement.toLocaleString()}</TableCell>
                  <TableCell>{content.conversion_rate.toFixed(1)}%</TableCell>
                  <TableCell>{Math.round(content.authority_score)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {getTrendIcon(content.trend_direction)}
                      <span className={getTrendColor(content.trend_direction)}>
                        {Math.abs(content.trend_percentage).toFixed(1)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>${(content.revenue_impact).toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <BarChart3 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const renderOptimization = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Content Optimization</h3>
          <p className="text-sm text-gray-600">
            AI-powered suggestions to improve content performance
          </p>
        </div>
        <Button onClick={() => setShowOptimizationDialog(true)}>
          <Lightbulb className="h-4 w-4 mr-2" />
          Generate Optimizations
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {contentOptimizations.map((optimization) => (
          <Card key={optimization.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getPriorityColor(optimization.priority)}>
                      {optimization.priority}
                    </Badge>
                    <Badge variant="outline">{optimization.optimization_type}</Badge>
                    <Badge variant={optimization.status === 'completed' ? 'default' : 'secondary'}>
                      {optimization.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">
                    Optimization Opportunities
                  </CardTitle>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    +{optimization.potential_improvement.toFixed(0)}%
                  </div>
                  <div className="text-sm text-gray-600">Potential Improvement</div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Performance Comparison */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Current Performance</span>
                    <span className="text-sm">{optimization.current_performance.toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Potential Performance</span>
                    <span className="text-sm font-bold text-green-600">
                      {(optimization.current_performance + optimization.potential_improvement).toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={optimization.current_performance} className="h-2 mb-2" />
                  <Progress
                    value={optimization.current_performance + optimization.potential_improvement}
                    className="h-2 bg-green-100"
                  />
                </div>

                {/* Recommendations */}
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Recommendations:
                  </h4>
                  <ul className="space-y-1">
                    {optimization.recommendations.slice(0, 3).map((rec, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <ChevronRight className="h-3 w-3 text-blue-500 mt-0.5" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Implementation Details */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-xs text-gray-500">Difficulty:</span>
                      <Badge variant="outline" className="ml-1">
                        {optimization.implementation_difficulty}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Est. Impact:</span>
                      <span className="ml-1 text-sm font-medium">
                        {optimization.estimated_impact.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    <Button size="sm" disabled={optimization.status === 'completed'}>
                      Implement
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Analytics Reports</h3>
          <p className="text-sm text-gray-600">
            Comprehensive reports and insights for strategic decision making
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setAutoRefresh(!autoRefresh)}>
            <RefreshCw className={cn("h-4 w-4 mr-2", autoRefresh && "animate-spin")} />
            {autoRefresh ? 'Auto-refresh On' : 'Auto-refresh Off'}
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Performing Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Top Performing Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {contentPerformance
                .sort((a, b) => b.total_views - a.total_views)
                .slice(0, 5)
                .map((content, index) => (
                  <div key={content.content_id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                      <div>
                        <p className="font-medium">{content.title}</p>
                        <p className="text-xs text-gray-500">{content.content_type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{content.total_views.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">views</div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Optimization Opportunities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5" />
              Quick Win Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {contentOptimizations
                .filter(opt => opt.implementation_difficulty === 'low' && opt.status !== 'completed')
                .slice(0, 5)
                .map((optimization, index) => (
                  <div key={optimization.id} className="border rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getPriorityColor(optimization.priority)}>
                            {optimization.priority}
                          </Badge>
                          <span className="text-sm font-medium">
                            +{optimization.potential_improvement.toFixed(0)}% improvement
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">
                          {optimization.optimization_type} optimization
                        </p>
                      </div>
                      <Button size="sm">Apply</Button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Local Market Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Warsaw Market Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Average Local Engagement</span>
                <span className="text-lg font-bold text-purple-600">
                  {(contentAnalytics.reduce((acc, item) => acc + item.warsaw_engagement_rate, 0) / (contentAnalytics.length || 1)).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Local Traffic Share</span>
                <span className="text-lg font-bold text-green-600">67%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Top Local Keyword</span>
                <span className="text-sm font-medium">"beauty salon warsaw"</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Conversion Rate (Local)</span>
                <span className="text-lg font-bold text-blue-600">8.5%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Authority Building Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Authority Building Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Overall Authority Score</span>
                  <span className="text-lg font-bold text-orange-600">
                    {Math.round(metrics.avgAuthorityScore)}/100
                  </span>
                </div>
                <Progress value={metrics.avgAuthorityScore} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Expert Citations</span>
                  <Badge>12</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Backlinks Earned</span>
                  <Badge>28</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Media Mentions</span>
                  <Badge>5</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Industry Recognition</span>
                  <Badge>3</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Report */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
          <CardDescription>
            Key insights and recommendations for the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <TrendingUp className="h-4 w-4" />
              <AlertDescription>
                <strong>Positive Trend:</strong> Overall content performance is up 15% compared to the previous period, with particularly strong growth in Warsaw market engagement.
              </AlertDescription>
            </Alert>

            <Alert>
              <Target className="h-4 w-4" />
              <AlertDescription>
                <strong>Conversion Opportunity:</strong> Content with educational focus shows 40% higher conversion rates. Consider expanding educational content series.
              </AlertDescription>
            </Alert>

            <Alert>
              <Globe className="h-4 w-4" />
              <AlertDescription>
                <strong>Local Success:</strong> Warsaw-specific content significantly outperforms general content. Local relevance drives 2x higher engagement rates.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-primary" />
            Content Analytics & Optimization
          </h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive analytics and AI-powered optimization for content performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setAutoRefresh(!autoRefresh)}>
            <RefreshCw className={cn("h-4 w-4 mr-2", autoRefresh && "animate-spin")} />
            {autoRefresh ? 'Auto-refresh On' : 'Auto-refresh'}
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="text-center py-8">
            <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin text-primary" />
            <p className="text-lg font-medium">Loading analytics data...</p>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      {!loading && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="optimization" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Optimization
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {renderOverview()}
          </TabsContent>

          <TabsContent value="performance">
            {renderPerformance()}
          </TabsContent>

          <TabsContent value="optimization">
            {renderOptimization()}
          </TabsContent>

          <TabsContent value="reports">
            {renderReports()}
          </TabsContent>
        </Tabs>
      )}

      {/* Optimization Dialog */}
      <Dialog open={showOptimizationDialog} onOpenChange={setShowOptimizationDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generate Content Optimizations</DialogTitle>
            <DialogDescription>
              AI-powered analysis to identify improvement opportunities
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <Brain className="h-4 w-4" />
              <AlertDescription>
                Our AI will analyze your content performance and generate personalized optimization recommendations based on industry best practices and Warsaw market insights.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Analysis Focus</Label>
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Areas</SelectItem>
                    <SelectItem value="seo">SEO Optimization</SelectItem>
                    <SelectItem value="engagement">Engagement</SelectItem>
                    <SelectItem value="conversion">Conversion</SelectItem>
                    <SelectItem value="authority">Authority Building</SelectItem>
                    <SelectItem value="local_seo">Local SEO</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priority Content</Label>
                <Select defaultValue="underperforming">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="underperforming">Underperforming Content</SelectItem>
                    <SelectItem value="high_potential">High Potential Content</SelectItem>
                    <SelectItem value="all_content">All Content</SelectItem>
                    <SelectItem value="recent">Recent Content</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowOptimizationDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              toast.success('Optimization analysis started');
              setShowOptimizationDialog(false);
            }}>
              Generate Optimizations
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContentAnalytics;