import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  BookOpen,
  HelpCircle,
  TrendingUp,
  Users,
  Search,
  MessageSquare,
  ThumbsUp,
  Eye,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  Settings,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import KnowledgeBaseService from '@/services/knowledge-base.service';
import FAQManagementService from '@/services/faq-management.service';
import type { KBDashboardMetrics, KBArticle, FAQItem } from '@/types/knowledge-base';

interface KBDashboardProps {
  userRole?: string;
}

export const KBDashboard: React.FC<KBDashboardProps> = ({ userRole = 'admin' }) => {
  const [metrics, setMetrics] = useState<KBDashboardMetrics | null>(null);
  const [recentArticles, setRecentArticles] = useState<KBArticle[]>([]);
  const [recentFAQs, setRecentFAQs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [metricsData, articlesData, faqsData] = await Promise.all([
        KnowledgeBaseService.getDashboardMetrics(),
        KnowledgeBaseService.getArticles({ limit: 5 }),
        FAQManagementService.getFAQs({ limit: 5 }),
      ]);

      setMetrics(metricsData);
      setRecentArticles(articlesData.articles);
      setRecentFAQs(faqsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error || 'Unable to load dashboard data'}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Knowledge Base Dashboard</h1>
          <p className="text-gray-600">Monitor and manage your knowledge base content</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Content
          </Button>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex gap-2">
        <Button
          variant={timeRange === '7d' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTimeRange('7d')}
        >
          Last 7 days
        </Button>
        <Button
          variant={timeRange === '30d' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTimeRange('30d')}
        >
          Last 30 days
        </Button>
        <Button
          variant={timeRange === '90d' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTimeRange('90d')}
        >
          Last 90 days
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.total_articles)}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total FAQs</CardTitle>
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.total_faqs)}</div>
            <p className="text-xs text-muted-foreground">
              +8% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.total_views)}</div>
            <p className="text-xs text-muted-foreground">
              +23% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Helpfulness Rating</CardTitle>
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avg_rating.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              +5% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="search">Search Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Top Performing Articles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Top Performing Articles
                </CardTitle>
                <CardDescription>Most viewed and helpful articles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.top_articles.slice(0, 5).map((article, index) => (
                    <div key={article.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-sm line-clamp-1">
                            {article.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {article.view_count} views
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {article.reading_time_minutes} min
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top FAQs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  Popular FAQs
                </CardTitle>
                <CardDescription>Most frequently accessed FAQs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.top_faqs.slice(0, 5).map((faq, index) => (
                    <div key={faq.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-semibold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-sm line-clamp-1">
                            {faq.question}
                          </p>
                          <p className="text-xs text-gray-500">
                            {faq.view_count} views
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {faq.helpful_count} helpful
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Searches */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Recent Searches
              </CardTitle>
              <CardDescription>Latest search queries from users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {metrics.recent_searches.slice(0, 15).map((search, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="cursor-pointer hover:bg-gray-100"
                  >
                    {search.search_query}
                    <span className="ml-1 text-xs text-gray-500">
                      ({search.results_count})
                    </span>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recent Articles */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Articles</CardTitle>
                <CardDescription>Latest published articles</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentArticles.map((article) => (
                      <TableRow key={article.id}>
                        <TableCell className="font-medium">
                          <div>
                            <p className="line-clamp-1">{article.title}</p>
                            <p className="text-xs text-gray-500">
                              {formatDate(article.published_at || article.created_at)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{article.view_count}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Recent FAQs */}
            <Card>
              <CardHeader>
                <CardTitle>Recent FAQs</CardTitle>
                <CardDescription>Latest added FAQ items</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Question</TableHead>
                      <TableHead>Helpful</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentFAQs.map((faq) => (
                      <TableRow key={faq.id}>
                        <TableCell className="font-medium">
                          <div>
                            <p className="line-clamp-1">{faq.question}</p>
                            <p className="text-xs text-gray-500">
                              {formatDate(faq.created_at)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{faq.helpful_count}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
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

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common content management tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Button className="h-20 flex-col">
                  <Plus className="h-6 w-6 mb-2" />
                  New Article
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Plus className="h-6 w-6 mb-2" />
                  New FAQ
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Upload className="h-6 w-6 mb-2" />
                  Import Content
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Settings className="h-6 w-6 mb-2" />
                  Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Performance Trend */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Performance Trend</CardTitle>
                <CardDescription>Content performance over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <BarChart3 className="h-12 w-12 mr-4" />
                  Performance chart would be displayed here
                </div>
              </CardContent>
            </Card>

            {/* Content Health */}
            <Card>
              <CardHeader>
                <CardTitle>Content Health</CardTitle>
                <CardDescription>Overall content quality metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Average Rating</span>
                    <span>{metrics.avg_rating.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.avg_rating} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Content Coverage</span>
                    <span>85%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Search Success Rate</span>
                    <span>78%</span>
                  </div>
                  <Progress value={78} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* User Engagement */}
            <Card>
              <CardHeader>
                <CardTitle>User Engagement</CardTitle>
                <CardDescription>How users interact with content</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">Total Views</span>
                  </div>
                  <span className="font-medium">{formatNumber(metrics.total_views)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ThumbsUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Helpful Votes</span>
                  </div>
                  <span className="font-medium">
                    {formatNumber(metrics.top_articles.reduce((sum, article) => sum + article.helpful_count, 0))}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-purple-600" />
                    <span className="text-sm">Total Searches</span>
                  </div>
                  <span className="font-medium">{formatNumber(metrics.total_searches)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-orange-600" />
                    <span className="text-sm">Unique Visitors</span>
                  </div>
                  <span className="font-medium">{formatNumber(Math.floor(metrics.total_views * 0.7))}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Search Insights Tab */}
        <TabsContent value="search" className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Advanced search analytics and insights would be displayed here.
              This includes search trends, failed searches, and optimization opportunities.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default KBDashboard;