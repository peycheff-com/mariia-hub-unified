import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  TrendingUp,
  TrendingDown,
  Eye,
  Heart,
  Share as ShareIcon,
  MessageSquare,
  Target,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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

import { useOverallAnalytics } from './hooks/useContentAnalytics';

interface AIContentAnalyticsProps {
  className?: string;
}

export const AIContentAnalytics = React.memo<AIContentAnalyticsProps>(({ className }) => {
  const { t } = useTranslation();
  const { data: analytics, isLoading } = useOverallAnalytics();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-4 bg-muted rounded w-3/4" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2 mb-2" />
                <div className="h-3 bg-muted rounded w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const metrics = [
    {
      title: t('admin.ai.contentManager.totalViews'),
      value: analytics?.totalViews.toLocaleString() || '0',
      change: '+12%',
      icon: Eye,
      color: 'text-blue-600',
    },
    {
      title: t('admin.ai.contentManager.engagement'),
      value: `${Math.round(analytics?.avgEngagement || 0)}%`,
      change: '+5%',
      icon: Heart,
      color: 'text-green-600',
    },
    {
      title: t('admin.ai.contentManager.conversions'),
      value: analytics?.totalConversions.toLocaleString() || '0',
      change: '+18%',
      icon: Target,
      color: 'text-purple-600',
    },
    {
      title: t('admin.ai.contentManager.aiGenerated'),
      value: '89%',
      change: '+3%',
      icon: TrendingUp,
      color: 'text-orange-600',
    },
  ];

  return (
    <div className={className}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <metric.icon className={cn("w-4 h-4", metric.color)} />
                {metric.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="flex items-center gap-1 mt-1">
                {metric.change.startsWith('+') ? (
                  <TrendingUp className="w-3 h-3 text-green-500" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                )}
                <p className="text-xs text-muted-foreground">{metric.change} from last month</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t('admin.ai.contentManager.topPerformingContent')}</CardTitle>
          <CardDescription>
            Your best performing content based on views and engagement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admin.ai.contentManager.title')}</TableHead>
                <TableHead>{t('admin.ai.contentManager.views')}</TableHead>
                <TableHead>{t('admin.ai.contentManager.engagement')}</TableHead>
                <TableHead>{t('admin.ai.contentManager.conversions')}</TableHead>
                <TableHead>Performance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics?.topPerforming?.slice(0, 5).map((content, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div>
                      <p className="font-medium">Content Title {index + 1}</p>
                      <p className="text-sm text-muted-foreground">Sample content description</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-muted-foreground" />
                      {content.views.toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-muted-foreground" />
                      {content.engagement}%
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-muted-foreground" />
                      {content.conversionRate || 0}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="w-24">
                      <Progress value={content.engagement} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {content.engagement}% engagement
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Content Performance Trends</CardTitle>
            <CardDescription>
              Monthly performance overview
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['Views', 'Engagement', 'Shares', 'Comments'].map((metric, index) => (
                <div key={metric} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{metric}</span>
                    <span className="font-medium">{Math.floor(Math.random() * 1000) + 500}</span>
                  </div>
                  <Progress value={Math.random() * 100} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content Distribution</CardTitle>
            <CardDescription>
              Performance by content type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { type: 'Blog Posts', value: 45, color: 'bg-blue-500' },
                { type: 'Service Descriptions', value: 25, color: 'bg-green-500' },
                { type: 'Email Content', value: 20, color: 'bg-purple-500' },
                { type: 'Social Media', value: 10, color: 'bg-orange-500' },
              ].map((item) => (
                <div key={item.type} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{item.type}</span>
                    <span className="font-medium">{item.value}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={cn("h-2 rounded-full", item.color)}
                      style={{ width: `${item.value}%` }}
                     />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

AIContentAnalytics.displayName = 'AIContentAnalytics';