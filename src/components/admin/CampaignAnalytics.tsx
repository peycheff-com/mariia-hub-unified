import React, { useState, useEffect } from 'react'
import {
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
  TrendingDown,
  Users,
  Mail,
  MousePointer,
  DollarSign,
  Eye,
  Calendar,
  Download,
  Filter,
  Target,
  Clock,
  Smartphone,
  Globe,
  MapPin,
  Activity,
  Zap,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { enUS, pl } from 'date-fns/locale'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'


import type { CampaignAnalytics, CampaignMetrics, TimelineData, DeviceBreakdown, LocationBreakdown } from '@/types/marketing-automation'

interface CampaignAnalyticsProps {
  className?: string
}

// Mock data for demonstration
const mockAnalyticsData: CampaignAnalytics = {
  campaign_id: 'campaign-1',
  metrics: {
    total_sent: 5000,
    total_delivered: 4850,
    total_opened: 2910,
    total_clicked: 873,
    total_converted: 436,
    total_revenue: 21800,
    delivery_rate: 97,
    open_rate: 60,
    click_rate: 30,
    conversion_rate: 50,
    unsubscribe_rate: 0.5,
    bounce_rate: 2,
    spam_rate: 0.1,
    revenue_per_recipient: 4.36,
    revenue_per_conversion: 50
  },
  timeline: Array.from({ length: 30 }, (_, i) => ({
    date: format(subDays(new Date(), 29 - i), 'yyyy-MM-dd'),
    sent: Math.floor(Math.random() * 200) + 100,
    delivered: Math.floor(Math.random() * 180) + 90,
    opened: Math.floor(Math.random() * 100) + 50,
    clicked: Math.floor(Math.random() * 40) + 20,
    converted: Math.floor(Math.random() * 20) + 10
  })),
  device_breakdown: [
    { device: 'Desktop', count: 1455, percentage: 50 },
    { device: 'Mobile', count: 1164, percentage: 40 },
    { device: 'Tablet', count: 291, percentage: 10 }
  ],
  location_breakdown: [
    { location: 'Warsaw', count: 2000, percentage: 40 },
    { location: 'Krakow', count: 1250, percentage: 25 },
    { location: 'Gdansk', count: 750, percentage: 15 },
    { location: 'Wroclaw', count: 625, percentage: 12.5 },
    { location: 'Other', count: 375, percentage: 7.5 }
  ],
  performance: {
    best_performing_time: '10:00 AM',
    best_performing_day: 'Tuesday',
    average_engagement_time: 45,
    peak_engagement_hour: 14,
    subject_line_performance: [
      { subject: 'Special Offer Just for You!', open_rate: 65, count: 2500 },
      { subject: 'Last Chance - 50% Off', open_rate: 58, count: 2500 }
    ]
  }
}

export const CampaignAnalytics: React.FC<CampaignAnalyticsProps> = ({ className }) => {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'pl' ? pl : enUS
  const { toast } = useToast()

  const [analyticsData, setAnalyticsData] = useState<CampaignAnalytics>(mockAnalyticsData)
  const [selectedPeriod, setSelectedPeriod] = useState('30d')
  const [selectedCampaign, setSelectedCampaign] = useState('all')
  const [activeTab, setActiveTab] = useState('overview')

  // Mock campaigns
  const campaigns = [
    { id: 'all', name: 'All Campaigns' },
    { id: 'campaign-1', name: 'Welcome Series' },
    { id: 'campaign-2', name: 'Summer Promotion' },
    { id: 'campaign-3', name: 'Review Requests' },
    { id: 'campaign-4', name: 'Re-engagement' }
  ]

  // Calculate metrics change (mock data)
  const calculateChange = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100
    return {
      value: Math.abs(change).toFixed(1),
      isPositive: change >= 0,
      trend: change >= 0 ? 'up' : 'down'
    }
  }

  const exportReport = () => {
    const dataStr = JSON.stringify(analyticsData, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    const exportFileDefaultName = `campaign-analytics-${format(new Date(), 'yyyy-MM-dd')}.json`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()

    toast({
      title: t('report_exported', 'Report Exported'),
      description: t('analytics_report_exported', 'Analytics report has been exported successfully')
    })
  }

  const MetricCard: React.FC<{
    title: string
    value: string | number
    previousValue?: string | number
    icon: React.ReactNode
    color: string
    trend?: 'up' | 'down' | 'neutral'
    description?: string
  }> = ({ title, value, previousValue, icon, color, trend, description }) => {
    const change = previousValue ? calculateChange(Number(value), Number(previousValue)) : null

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <div className={cn("p-2 rounded-lg", color)}>
            {icon}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {change && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {change.isPositive ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={change.isPositive ? 'text-green-500' : 'text-red-500'}>
                {change.value}%
              </span>
              <span>{t('from_last_period', 'from last period')}</span>
            </div>
          )}
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </CardContent>
      </Card>
    )
  }

  const MetricProgress: React.FC<{
    label: string
    value: number
    total: number
    color?: string
    showPercentage?: boolean
  }> = ({ label, value, total, color = 'bg-blue-500', showPercentage = true }) => {
    const percentage = total > 0 ? (value / total) * 100 : 0

    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>{label}</span>
          <span className="font-medium">
            {showPercentage ? `${percentage.toFixed(1)}%` : `${value.toLocaleString()}`}
          </span>
        </div>
        <Progress value={percentage} className="h-2" />
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('campaign_analytics', 'Campaign Analytics')}</h2>
          <p className="text-muted-foreground">
            {t('analytics_description', 'Detailed performance metrics and insights for your campaigns')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">{t('last_7_days', 'Last 7 days')}</SelectItem>
              <SelectItem value="30d">{t('last_30_days', 'Last 30 days')}</SelectItem>
              <SelectItem value="90d">{t('last_90_days', 'Last 90 days')}</SelectItem>
              <SelectItem value="custom">{t('custom', 'Custom')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {campaigns.map(campaign => (
                <SelectItem key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            {t('export_report', 'Export Report')}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">{t('overview', 'Overview')}</TabsTrigger>
          <TabsTrigger value="engagement">{t('engagement', 'Engagement')}</TabsTrigger>
          <TabsTrigger value="conversions">{t('conversions', 'Conversions')}</TabsTrigger>
          <TabsTrigger value="audience">{t('audience', 'Audience')}</TabsTrigger>
          <TabsTrigger value="performance">{t('performance', 'Performance')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title={t('total_sent', 'Total Sent')}
              value={analyticsData.metrics.total_sent.toLocaleString()}
              previousValue={4500}
              icon={<Mail className="h-4 w-4 text-white" />}
              color="bg-blue-500"
              trend="up"
            />
            <MetricCard
              title={t('delivery_rate', 'Delivery Rate')}
              value={`${analyticsData.metrics.delivery_rate}%`}
              previousValue={95}
              icon={<CheckCircle className="h-4 w-4 text-white" />}
              color="bg-green-500"
              trend="up"
            />
            <MetricCard
              title={t('open_rate', 'Open Rate')}
              value={`${analyticsData.metrics.open_rate}%`}
              previousValue={55}
              icon={<Eye className="h-4 w-4 text-white" />}
              color="bg-purple-500"
              trend="up"
            />
            <MetricCard
              title={t('click_rate', 'Click Rate')}
              value={`${analyticsData.metrics.click_rate}%`}
              previousValue={28}
              icon={<MousePointer className="h-4 w-4 text-white" />}
              color="bg-orange-500"
              trend="up"
            />
          </div>

          {/* Funnel Overview */}
          <Card>
            <CardHeader>
              <CardTitle>{t('conversion_funnel', 'Conversion Funnel')}</CardTitle>
              <CardDescription>
                {t('funnel_description', 'See how recipients move through your campaign funnel')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <MetricProgress
                label={t('sent', 'Sent')}
                value={analyticsData.metrics.total_sent}
                total={analyticsData.metrics.total_sent}
                color="bg-blue-500"
                showPercentage={false}
              />
              <MetricProgress
                label={t('delivered', 'Delivered')}
                value={analyticsData.metrics.total_delivered}
                total={analyticsData.metrics.total_sent}
                color="bg-green-500"
              />
              <MetricProgress
                label={t('opened', 'Opened')}
                value={analyticsData.metrics.total_opened}
                total={analyticsData.metrics.total_delivered}
                color="bg-purple-500"
              />
              <MetricProgress
                label={t('clicked', 'Clicked')}
                value={analyticsData.metrics.total_clicked}
                total={analyticsData.metrics.total_opened}
                color="bg-orange-500"
              />
              <MetricProgress
                label={t('converted', 'Converted')}
                value={analyticsData.metrics.total_converted}
                total={analyticsData.metrics.total_clicked}
                color="bg-red-500"
              />
            </CardContent>
          </Card>

          {/* Revenue Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">{t('total_revenue', 'Total Revenue')}</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${analyticsData.metrics.total_revenue.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('from_conversions', 'from')} {analyticsData.metrics.total_converted} {t('conversions', 'conversions')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">{t('revenue_per_recipient', 'Revenue per Recipient')}</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${analyticsData.metrics.revenue_per_recipient.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('avg_revenue_per_person', 'Average revenue per person')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">{t('revenue_per_conversion', 'Revenue per Conversion')}</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${analyticsData.metrics.revenue_per_conversion.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('avg_revenue_per_conversion', 'Average revenue per conversion')}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          {/* Engagement Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>{t('engagement_timeline', 'Engagement Timeline')}</CardTitle>
              <CardDescription>
                {t('timeline_description', 'Track engagement over time')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <LineChart className="h-12 w-12 mx-auto mb-2" />
                  <p>{t('chart_placeholder', 'Engagement chart will be displayed here')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Device Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('device_breakdown', 'Device Breakdown')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {analyticsData.device_breakdown.map((device) => (
                  <div key={device.device} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {device.device === 'Desktop' && <Globe className="h-4 w-4" />}
                      {device.device === 'Mobile' && <Smartphone className="h-4 w-4" />}
                      {device.device === 'Tablet' && <Activity className="h-4 w-4" />}
                      <span className="text-sm font-medium">{device.device}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24">
                        <Progress value={device.percentage} className="h-2" />
                      </div>
                      <span className="text-sm text-muted-foreground w-12 text-right">
                        {device.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('best_performance_times', 'Best Performance Times')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t('best_day', 'Best Day')}</span>
                  <Badge>{analyticsData.performance.best_performing_day}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t('best_time', 'Best Time')}</span>
                  <Badge>{analyticsData.performance.best_performing_time}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t('peak_hour', 'Peak Engagement Hour')}</span>
                  <Badge>{analyticsData.performance.peak_engagement_hour}:00</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t('avg_engagement_time', 'Avg Engagement Time')}</span>
                  <Badge>{analyticsData.performance.average_engagement_time}s</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Subject Line Performance */}
          <Card>
            <CardHeader>
              <CardTitle>{t('subject_line_performance', 'Subject Line Performance')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.performance.subject_line_performance.map((subject, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">{subject.subject}</p>
                      <p className="text-sm text-muted-foreground">
                        {t('sent_to', 'Sent to')} {subject.count.toLocaleString()} {t('recipients', 'recipients')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{subject.open_rate}%</p>
                      <p className="text-sm text-muted-foreground">{t('open_rate', 'Open Rate')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversions" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title={t('total_conversions', 'Total Conversions')}
              value={analyticsData.metrics.total_converted.toLocaleString()}
              previousValue={385}
              icon={<Target className="h-4 w-4 text-white" />}
              color="bg-green-500"
              trend="up"
              description={t('successful_actions', 'Successful actions taken')}
            />
            <MetricCard
              title={t('conversion_rate', 'Conversion Rate')}
              value={`${analyticsData.metrics.conversion_rate}%`}
              previousValue={45}
              icon={<TrendingUp className="h-4 w-4 text-white" />}
              color="bg-blue-500"
              trend="up"
              description={t('of_clicks_converted', 'of clicks converted')}
            />
            <MetricCard
              title={t('unsubscribe_rate', 'Unsubscribe Rate')}
              value={`${analyticsData.metrics.unsubscribe_rate}%`}
              previousValue={0.7}
              icon={<XCircle className="h-4 w-4 text-white" />}
              color="bg-red-500"
              trend="down"
              description={t('users_unsubscribed', 'Users who unsubscribed')}
            />
            <MetricCard
              title={t('bounce_rate', 'Bounce Rate')}
              value={`${analyticsData.metrics.bounce_rate}%`}
              previousValue={2.5}
              icon={<AlertCircle className="h-4 w-4 text-white" />}
              color="bg-orange-500"
              trend="down"
              description={t('emails_bounced', 'Emails that bounced')}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('conversion_timeline', 'Conversion Timeline')}</CardTitle>
              <CardDescription>
                {t('conversion_tracking', 'Track when conversions happen after campaign sends')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                  <p>{t('conversion_chart_placeholder', 'Conversion timeline chart will be displayed here')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audience" className="space-y-6">
          {/* Location Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>{t('audience_by_location', 'Audience by Location')}</CardTitle>
              <CardDescription>
                {t('location_distribution', 'Geographic distribution of your audience')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  {analyticsData.location_breakdown.map((location) => (
                    <div key={location.location} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{location.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-20">
                          <Progress value={location.percentage} className="h-2" />
                        </div>
                        <span className="text-sm text-muted-foreground w-16 text-right">
                          {location.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="h-48 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <PieChart className="h-12 w-12 mx-auto mb-2" />
                    <p>{t('location_chart_placeholder', 'Location distribution chart')}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Audience Insights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">{t('new_subscribers', 'New Subscribers')}</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+234</div>
                <p className="text-xs text-green-600">+12% {t('from_last_month', 'from last month')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">{t('active_subscribers', 'Active Subscribers')}</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8,456</div>
                <p className="text-xs text-muted-foreground">{t('engaged_last_30d', 'Engaged in last 30 days')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">{t('list_growth', 'List Growth')}</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+3.2%</div>
                <p className="text-xs text-muted-foreground">{t('monthly_growth', 'Monthly growth rate')}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>{t('performance_indicators', 'Performance Indicators')}</CardTitle>
              <CardDescription>
                {t('key_performance_metrics', 'Key metrics to measure campaign success')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">{t('delivery_metrics', 'Delivery Metrics')}</h4>
                  <MetricProgress
                    label={t('delivered', 'Delivered')}
                    value={analyticsData.metrics.total_delivered}
                    total={analyticsData.metrics.total_sent}
                    color="bg-green-500"
                  />
                  <MetricProgress
                    label={t('bounced', 'Bounced')}
                    value={analyticsData.metrics.total_sent - analyticsData.metrics.total_delivered}
                    total={analyticsData.metrics.total_sent}
                    color="bg-red-500"
                  />
                  <MetricProgress
                    label={t('spam_complaints', 'Spam Complaints')}
                    value={Math.floor(analyticsData.metrics.total_sent * analyticsData.metrics.spam_rate / 100)}
                    total={analyticsData.metrics.total_sent}
                    color="bg-orange-500"
                  />
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">{t('engagement_metrics', 'Engagement Metrics')}</h4>
                  <MetricProgress
                    label={t('opened', 'Opened')}
                    value={analyticsData.metrics.total_opened}
                    total={analyticsData.metrics.total_delivered}
                    color="bg-blue-500"
                  />
                  <MetricProgress
                    label={t('clicked', 'Clicked')}
                    value={analyticsData.metrics.total_clicked}
                    total={analyticsData.metrics.total_opened}
                    color="bg-purple-500"
                  />
                  <MetricProgress
                    label={t('unsubscribed', 'Unsubscribed')}
                    value={Math.floor(analyticsData.metrics.total_sent * analyticsData.metrics.unsubscribe_rate / 100)}
                    total={analyticsData.metrics.total_sent}
                    color="bg-gray-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>{t('recommendations', 'Recommendations')}</CardTitle>
              <CardDescription>
                {t('ai_recommendations', 'AI-powered suggestions to improve your campaigns')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-800">{t('great_performance', 'Great Performance!')}</p>
                    <p className="text-sm text-green-700">
                      {t('open_rate_above_average', 'Your open rate of 60% is above the industry average of 45%. Keep up the good work!')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-800">{t('optimize_send_time', 'Optimize Send Time')}</p>
                    <p className="text-sm text-blue-700">
                      {t('best_send_time_suggestion', 'Consider sending campaigns on Tuesdays at 10:00 AM for maximum engagement.')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800">{t('improve_subject_lines', 'Improve Subject Lines')}</p>
                    <p className="text-sm text-yellow-700">
                      {t('subject_line_tip', 'A/B test different subject lines to potentially increase your open rate by 5-10%.')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}