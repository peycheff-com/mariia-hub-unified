import React from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, Users, Clock, Share2, Heart, MessageCircle, TrendingUp, Target, DollarSign } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

import { ContentAnalytics as ContentAnalyticsType } from './types';

interface ContentAnalyticsProps {
  analytics: ContentAnalyticsType;
  contentTitle: string;
}

export function ContentAnalytics({ analytics, contentTitle }: ContentAnalyticsProps) {
  const { t } = useTranslation();

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const engagementScore = Math.round(
    (analytics.engagementRate * 0.4) +
    (Math.min(analytics.averageReadTime / 180, 1) * 100 * 0.3) +
    ((100 - analytics.bounceRate) * 0.3)
  );

  const topSource = Object.entries(analytics.sourceBreakdown).reduce((a, b) =>
    analytics.sourceBreakdown[a[0] as keyof typeof analytics.sourceBreakdown] >
    analytics.sourceBreakdown[b[0] as keyof typeof analytics.sourceBreakdown] ? a : b
  )[0];

  const topLocation = Object.entries(analytics.locationBreakdown).reduce((a, b) =>
    analytics.locationBreakdown[a[0]] > analytics.locationBreakdown[b[0]] ? a : b
  )[0];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">{t('admin.ai.contentManager.analytics')}</h3>
        <p className="text-sm text-muted-foreground">{contentTitle}</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.ai.contentManager.totalViews')}</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analytics.views)}</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(analytics.uniqueViews)} {t('admin.ai.contentManager.unique')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.ai.contentManager.engagement')}</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.engagementRate}%</div>
            <Progress value={analytics.engagementRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.ai.contentManager.avgReadTime')}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(analytics.averageReadTime)}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.bounceRate}% {t('admin.ai.contentManager.bounceRate')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.ai.contentManager.conversions')}</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.conversions}</div>
            {analytics.revenue && (
              <p className="text-xs text-muted-foreground">
                ${formatNumber(analytics.revenue)} {t('admin.ai.contentManager.revenue')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Engagement Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t('admin.ai.contentManager.engagementScore')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <span className="text-3xl font-bold">{engagementScore}/100</span>
            <Badge variant={engagementScore >= 80 ? 'default' : engagementScore >= 60 ? 'secondary' : 'destructive'}>
              {engagementScore >= 80 ? t('admin.ai.contentManager.excellent') :
               engagementScore >= 60 ? t('admin.ai.contentManager.good') :
               t('admin.ai.contentManager.needsImprovement')}
            </Badge>
          </div>
          <Progress value={engagementScore} className="h-2" />
          <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="font-medium">{Math.round(analytics.engagementRate * 0.4)}%</div>
              <div className="text-muted-foreground">{t('admin.ai.contentManager.engagement')}</div>
            </div>
            <div className="text-center">
              <div className="font-medium">{Math.round(Math.min(analytics.averageReadTime / 180, 1) * 100 * 0.3)}%</div>
              <div className="text-muted-foreground">{t('admin.ai.contentManager.readTime')}</div>
            </div>
            <div className="text-center">
              <div className="font-medium">{Math.round((100 - analytics.bounceRate) * 0.3)}%</div>
              <div className="text-muted-foreground">{t('admin.ai.contentManager.retention')}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.ai.contentManager.deviceBreakdown')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(analytics.deviceBreakdown).map(([device, count]) => {
              const percentage = (count / analytics.views) * 100;
              return (
                <div key={device} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="capitalize">{device}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-12 text-right">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Source Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.ai.contentManager.trafficSources')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(analytics.sourceBreakdown).map(([source, count]) => {
              const percentage = (count / analytics.views) * 100;
              return (
                <div key={source} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      source === 'organic' ? 'bg-green-500' :
                      source === 'social' ? 'bg-blue-500' :
                      source === 'email' ? 'bg-purple-500' :
                      source === 'direct' ? 'bg-orange-500' :
                      'bg-gray-500'
                    }`} />
                    <span className="capitalize">{source}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          source === 'organic' ? 'bg-green-500' :
                          source === 'social' ? 'bg-blue-500' :
                          source === 'email' ? 'bg-purple-500' :
                          source === 'direct' ? 'bg-orange-500' :
                          'bg-gray-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-12 text-right">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Social Interactions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.ai.contentManager.likes')}</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analytics.likes)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.ai.contentManager.comments')}</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analytics.comments)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.ai.contentManager.shares')}</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analytics.shares)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.ai.contentManager.topSource')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold capitalize">{topSource}</div>
            <p className="text-xs text-muted-foreground">{t('admin.ai.contentManager.topSourceLabel')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Location */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.ai.contentManager.topLocation')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-bold">{topLocation}</div>
              <p className="text-sm text-muted-foreground">
                {formatNumber(analytics.locationBreakdown[topLocation])} {t('admin.ai.contentManager.views')}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">
                {((analytics.locationBreakdown[topLocation] / analytics.views) * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">{t('admin.ai.contentManager.ofTotal')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}