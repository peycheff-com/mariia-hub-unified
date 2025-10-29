import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Wand2,
  Search,
  Languages,
  Calendar,
  BarChart3,
  Settings,
  Plus,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  Eye,
  MessageSquare,
  ThumbsUp,
  Share2,
  Download,
  Upload
} from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { ContentManagement } from '@/types/content';
import { blogService } from '@/services/blog.service';
import { cn } from '@/lib/utils';

import { AIContentGenerator } from './AIContentGenerator';
import { SEOOptimizer } from './SEOOptimizer';
import { TranslationWorkflow } from './TranslationWorkflow';
import { ContentScheduler } from './ContentScheduler';

interface ContentManagementDashboardProps {
  initialTab?: string;
  contentId?: string;
  className?: string;
}

interface ContentStats {
  total: number;
  published: number;
  draft: number;
  scheduled: number;
  views: number;
  shares: number;
  comments: number;
  avgEngagement: number;
}

export const ContentManagementDashboard: React.FC<ContentManagementDashboardProps> = ({
  initialTab = 'overview',
  contentId,
  className
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();

  // State
  const [activeTab, setActiveTab] = useState(initialTab);
  const [stats, setStats] = useState<ContentStats>({
    total: 0,
    published: 0,
    draft: 0,
    scheduled: 0,
    views: 0,
    shares: 0,
    comments: 0,
    avgEngagement: 0
  });
  const [recentContent, setRecentContent] = useState<ContentManagement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load stats and recent content
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Load content statistics
      const { posts, total } = await blogService.getBlogPosts({
        limit: 10,
        sort_by: 'updated_at',
        sort_order: 'desc'
      });

      const published = posts.filter(p => p.status === 'published').length;
      const draft = posts.filter(p => p.status === 'draft').length;
      const scheduled = posts.filter(p => p.status === 'scheduled').length;

      // Calculate stats (simulated)
      const contentStats: ContentStats = {
        total,
        published,
        draft,
        scheduled,
        views: posts.reduce((sum, p) => sum + (p.views || 0), 0),
        shares: posts.reduce((sum, p) => sum + (p.shares || 0), 0),
        comments: posts.reduce((sum, p) => sum + (p.comments_count || 0), 0),
        avgEngagement: posts.length > 0 ? posts.reduce((sum, p) => sum + (p.conversion_rate || 0), 0) / posts.length : 0
      };

      setStats(contentStats);
      setRecentContent(posts.slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: t('admin.dashboard.loadFailed'),
        description: t('admin.dashboard.loadFailedDesc'),
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle content generated
  const handleContentGenerated = (content: any, type: string) => {
    toast({
      title: t('admin.dashboard.contentGenerated'),
      description: t('admin.dashboard.contentGeneratedDesc')
    });
    loadDashboardData();
  };

  // Handle content saved
  const handleContentSaved = (content: any, type: string) => {
    toast({
      title: t('admin.dashboard.contentSaved'),
      description: t('admin.dashboard.contentSavedDesc')
    });
    loadDashboardData();
  };

  const tabs = [
    {
      value: 'overview',
      label: t('admin.dashboard.overview'),
      icon: <BarChart3 className="h-4 w-4" />
    },
    {
      value: 'ai-generator',
      label: t('admin.dashboard.aiGenerator'),
      icon: <Wand2 className="h-4 w-4" />
    },
    {
      value: 'seo-optimizer',
      label: t('admin.dashboard.seoOptimizer'),
      icon: <Search className="h-4 w-4" />
    },
    {
      value: 'translation',
      label: t('admin.dashboard.translation'),
      icon: <Languages className="h-4 w-4" />
    },
    {
      value: 'scheduler',
      label: t('admin.dashboard.scheduler'),
      icon: <Calendar className="h-4 w-4" />
    }
  ];

  return (
    <div className={cn('w-full space-y-6', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('admin.content.title')}</h1>
          <p className="text-muted-foreground">{t('admin.content.description')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            {t('admin.content.import')}
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            {t('admin.content.export')}
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {t('admin.content.newContent')}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
              {tab.icon}
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {t('admin.dashboard.totalContent')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('admin.dashboard.allTime')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  {t('admin.dashboard.published')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.published}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('admin.dashboard.liveContent')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  {t('admin.dashboard.scheduled')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.scheduled}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('admin.dashboard.queued')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Eye className="h-4 w-4 text-purple-600" />
                  {t('admin.dashboard.totalViews')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.views.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('admin.dashboard.allTimeViews')}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Engagement Stats */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Share2 className="h-4 w-4" />
                  {t('admin.dashboard.shares')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.shares.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('admin.dashboard.totalShares')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  {t('admin.dashboard.comments')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.comments.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('admin.dashboard.totalComments')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  {t('admin.dashboard.engagement')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.avgEngagement.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('admin.dashboard.avgEngagement')}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Content */}
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.dashboard.recentContent')}</CardTitle>
              <CardDescription>
                {t('admin.dashboard.recentContentDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentContent.length > 0 ? (
                <div className="space-y-4">
                  {recentContent.map((content) => (
                    <div key={content.id} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{content.title}</h4>
                          <Badge variant={content.status === 'published' ? 'default' : 'secondary'}>
                            {content.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {t('admin.dashboard.lastUpdated')}: {new Date(content.updated_at).toLocaleDateString()}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {content.views}
                          </span>
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" />
                            {content.likes}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {content.comments_count}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <BarChart3 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <FileText className="h-12 w-12 mx-auto mb-2" />
                  <p>{t('admin.dashboard.noContent')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Alert>
            <Wand2 className="h-4 w-4" />
            <AlertTitle>{t('admin.dashboard.quickActions')}</AlertTitle>
            <AlertDescription>
              {t('admin.dashboard.quickActionsDesc')}
            </AlertDescription>
          </Alert>
        </TabsContent>

        {/* AI Generator Tab */}
        <TabsContent value="ai-generator">
          <AIContentGenerator
            onContentGenerated={handleContentGenerated}
            onSaveContent={handleContentSaved}
          />
        </TabsContent>

        {/* SEO Optimizer Tab */}
        <TabsContent value="seo-optimizer">
          <SEOOptimizer
            contentId={contentId}
            onOptimized={(analysis, suggestions) => {
              toast({
                title: t('admin.seo.optimized'),
                description: t('admin.seo.optimizedDesc')
              });
            }}
          />
        </TabsContent>

        {/* Translation Tab */}
        <TabsContent value="translation">
          <TranslationWorkflow
            contentId={contentId}
            onTranslated={(content, language) => {
              toast({
                title: t('admin.translation.completed'),
                description: t('admin.translation.completedDesc')
              });
            }}
          />
        </TabsContent>

        {/* Scheduler Tab */}
        <TabsContent value="scheduler">
          <ContentScheduler
            contentId={contentId}
            onScheduled={(schedule) => {
              toast({
                title: t('admin.scheduler.scheduled'),
                description: t('admin.scheduler.scheduledDesc')
              });
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};