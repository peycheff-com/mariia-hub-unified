import React, { useState, useEffect } from 'react'
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
  Area,
  AreaChart
} from 'recharts'
import {
  Mail,
  MessageSquare,
  Smartphone,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  Download,
  Calendar,
  Filter
} from 'lucide-react'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { enUS, pl } from 'date-fns/locale'
import { useTranslation } from 'react-i18next'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'


interface CommunicationAnalyticsProps {
  className?: string
}

interface AnalyticsData {
  overview: {
    totalMessages: number
    totalConversations: number
    averageResponseTime: number
    satisfactionScore: number
  }
  channelStats: Array<{
    channel: string
    sent: number
    delivered: number
    opened: number
    clicked: number
    failed: number
  }>
  timeSeriesData: Array<{
    date: string
    email: number
    sms: number
    whatsapp: number
    in_app: number
  }>
  responseTimeData: Array<{
    timeRange: string
    count: number
    percentage: number
  }>
  sentimentData: Array<{
    sentiment: string
    count: number
    percentage: number
  }>
  topTemplates: Array<{
    name: string
    usage: number
    openRate: number
    clickRate: number
  }>
  agentPerformance: Array<{
    agent: string
    conversations: number
    avgResponseTime: number
    satisfaction: number
  }>
}

const COLORS = {
  primary: '#8B4513',
  secondary: '#F5DEB3',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  muted: '#6b7280'
}

export const CommunicationAnalytics: React.FC<CommunicationAnalyticsProps> = ({ className }) => {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'pl' ? pl : enUS

  // State
  const [dateRange, setDateRange] = useState('7d')
  const [selectedChannel, setSelectedChannel] = useState('all')
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  // Mock data - replace with actual API calls
  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true)
      try {
        // NOTE: Analytics API integration pending - currently using mock data
        // TODO: Replace with actual API call to fetch communication analytics
        const mockData: AnalyticsData = {
          overview: {
            totalMessages: 12543,
            totalConversations: 3421,
            averageResponseTime: 4.2, // minutes
            satisfactionScore: 4.7
          },
          channelStats: [
            {
              channel: 'email',
              sent: 5432,
              delivered: 5201,
              opened: 3124,
              clicked: 782,
              failed: 231
            },
            {
              channel: 'sms',
              sent: 3211,
              delivered: 3198,
              opened: 2456,
              clicked: 543,
              failed: 13
            },
            {
              channel: 'whatsapp',
              sent: 2876,
              delivered: 2854,
              opened: 2341,
              clicked: 654,
              failed: 22
            },
            {
              channel: 'in-app',
              sent: 1024,
              delivered: 1024,
              opened: 876,
              clicked: 234,
              failed: 0
            }
          ],
          timeSeriesData: Array.from({ length: 30 }, (_, i) => ({
            date: format(subDays(new Date(), 29 - i), 'MM/dd'),
            email: Math.floor(Math.random() * 200) + 100,
            sms: Math.floor(Math.random() * 150) + 50,
            whatsapp: Math.floor(Math.random() * 120) + 40,
            in_app: Math.floor(Math.random() * 80) + 20
          })).reverse(),
          responseTimeData: [
            { timeRange: '< 1 min', count: 1234, percentage: 36 },
            { timeRange: '1-5 min', count: 1456, percentage: 42 },
            { timeRange: '5-15 min', count: 543, percentage: 16 },
            { timeRange: '15-60 min', count: 187, percentage: 5 },
            { timeRange: '> 1 hour', count: 23, percentage: 1 }
          ],
          sentimentData: [
            { sentiment: 'positive', count: 2876, percentage: 84 },
            { sentiment: 'neutral', count: 432, percentage: 13 },
            { sentiment: 'negative', count: 113, percentage: 3 }
          ],
          topTemplates: [
            { name: 'Welcome Email', usage: 543, openRate: 68, clickRate: 12 },
            { name: 'Appointment Reminder', usage: 432, openRate: 92, clickRate: 5 },
            { name: 'Promotional Offer', usage: 321, openRate: 45, clickRate: 18 },
            { name: 'Follow-up', usage: 287, openRate: 71, clickRate: 9 },
            { name: 'Feedback Request', usage: 198, openRate: 78, clickRate: 25 }
          ],
          agentPerformance: [
            { agent: 'Sarah Johnson', conversations: 234, avgResponseTime: 3.2, satisfaction: 4.8 },
            { agent: 'Mike Chen', conversations: 198, avgResponseTime: 4.1, satisfaction: 4.6 },
            { agent: 'Emma Wilson', conversations: 176, avgResponseTime: 5.3, satisfaction: 4.5 },
            { agent: 'James Brown', conversations: 154, avgResponseTime: 3.8, satisfaction: 4.7 }
          ]
        }

        setAnalyticsData(mockData)
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [dateRange, selectedChannel])

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Mail className="h-4 w-4" />
      case 'sms':
        return <Smartphone className="h-4 w-4" />
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4" />
      case 'in-app':
        return <MessageSquare className="h-4 w-4" />
      default:
        return <BarChart3 className="h-4 w-4" />
    }
  }

  const getDeliveryRate = (channel: any) => {
    if (channel.sent === 0) return 0
    return ((channel.delivered / channel.sent) * 100).toFixed(1)
  }

  const getOpenRate = (channel: any) => {
    if (channel.delivered === 0) return 0
    return ((channel.opened / channel.delivered) * 100).toFixed(1)
  }

  const getClickRate = (channel: any) => {
    if (channel.opened === 0) return 0
    return ((channel.clicked / channel.opened) * 100).toFixed(1)
  }

  const exportData = () => {
    // NOTE: Export functionality pending - requires file generation and download
    // TODO: Implement actual export functionality with CSV/PDF generation
    console.log('Exporting analytics data...')
  }

  if (loading || !analyticsData) {
    return (
      <div className={cn("flex items-center justify-center h-64", className)}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('communication_analytics', 'Communication Analytics')}</h2>
          <p className="text-muted-foreground">
            {t('analytics_description', 'Monitor and analyze your communication performance')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">{t('last_24_hours', 'Last 24 hours')}</SelectItem>
              <SelectItem value="7d">{t('last_7_days', 'Last 7 days')}</SelectItem>
              <SelectItem value="30d">{t('last_30_days', 'Last 30 days')}</SelectItem>
              <SelectItem value="90d">{t('last_90_days', 'Last 90 days')}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            {t('export', 'Export')}
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('total_messages', 'Total Messages')}</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.totalMessages.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              12% {t('from_last_period', 'from last period')}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('total_conversations', 'Total Conversations')}</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.totalConversations.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              8% {t('from_last_period', 'from last period')}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('avg_response_time', 'Avg Response Time')}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.averageResponseTime}m</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3 mr-1 text-green-500" />
              18% {t('faster', 'faster')}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('satisfaction_score', 'Satisfaction Score')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.satisfactionScore}/5.0</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              0.3 {t('increase', 'increase')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList>
          <TabsTrigger value="performance">{t('performance', 'Performance')}</TabsTrigger>
          <TabsTrigger value="channels">{t('channels', 'Channels')}</TabsTrigger>
          <TabsTrigger value="response">{t('response_times', 'Response Times')}</TabsTrigger>
          <TabsTrigger value="sentiment">{t('sentiment', 'Sentiment')}</TabsTrigger>
          <TabsTrigger value="templates">{t('templates', 'Templates')}</TabsTrigger>
          <TabsTrigger value="agents">{t('agents', 'Agents')}</TabsTrigger>
        </TabsList>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('message_volume_over_time', 'Message Volume Over Time')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analyticsData.timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="email" stackId="1" stroke={COLORS.info} fill={COLORS.info} />
                  <Area type="monotone" dataKey="sms" stackId="1" stroke={COLORS.success} fill={COLORS.success} />
                  <Area type="monotone" dataKey="whatsapp" stackId="1" stroke={COLORS.warning} fill={COLORS.warning} />
                  <Area type="monotone" dataKey="in_app" stackId="1" stroke={COLORS.muted} fill={COLORS.muted} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Channels Tab */}
        <TabsContent value="channels" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('channel_performance', 'Channel Performance')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={analyticsData.channelStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="channel" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sent" fill={COLORS.primary} />
                    <Bar dataKey="delivered" fill={COLORS.success} />
                    <Bar dataKey="opened" fill={COLORS.info} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('channel_metrics', 'Channel Metrics')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.channelStats.map((channel) => (
                    <div key={channel.channel} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getChannelIcon(channel.channel)}
                          <span className="capitalize font-medium">{channel.channel}</span>
                        </div>
                        <Badge variant="outline">
                          {channel.sent} {t('sent', 'sent')}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{t('delivery_rate', 'Delivery Rate')}</span>
                          <span>{getDeliveryRate(channel)}%</span>
                        </div>
                        <Progress value={parseFloat(getDeliveryRate(channel))} className="h-1" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{t('open_rate', 'Open Rate')}</span>
                          <span>{getOpenRate(channel)}%</span>
                        </div>
                        <Progress value={parseFloat(getOpenRate(channel))} className="h-1" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{t('click_rate', 'Click Rate')}</span>
                          <span>{getClickRate(channel)}%</span>
                        </div>
                        <Progress value={parseFloat(getClickRate(channel))} className="h-1" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Response Times Tab */}
        <TabsContent value="response" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('response_time_distribution', 'Response Time Distribution')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={analyticsData.responseTimeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ timeRange, percentage }) => `${timeRange}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analyticsData.responseTimeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS.primary} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('response_time_details', 'Response Time Details')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.responseTimeData.map((item) => (
                    <div key={item.timeRange} className="flex items-center justify-between">
                      <span className="text-sm">{item.timeRange}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32">
                          <Progress value={item.percentage} className="h-2" />
                        </div>
                        <span className="text-sm text-muted-foreground w-12 text-right">
                          {item.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sentiment Tab */}
        <TabsContent value="sentiment" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('sentiment_analysis', 'Sentiment Analysis')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={analyticsData.sentimentData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ sentiment, percentage }) => `${sentiment}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      <Cell fill={COLORS.success} />
                      <Cell fill={COLORS.muted} />
                      <Cell fill={COLORS.error} />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('sentiment_breakdown', 'Sentiment Breakdown')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.sentimentData.map((item) => (
                    <div key={item.sentiment} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {item.sentiment === 'positive' && <TrendingUp className="h-4 w-4 text-green-500" />}
                        {item.sentiment === 'neutral' && <AlertCircle className="h-4 w-4 text-gray-500" />}
                        {item.sentiment === 'negative' && <TrendingDown className="h-4 w-4 text-red-500" />}
                        <span className="capitalize">{item.sentiment}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-32">
                          <Progress
                            value={item.percentage}
                            className="h-2"
                            style={
                              item.sentiment === 'positive' ? {
                                ['--progress-background']: COLORS.success
                              } : item.sentiment === 'negative' ? {
                                ['--progress-background']: COLORS.error
                              } : {}
                            } as any
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-12 text-right">
                          {item.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('top_performing_templates', 'Top Performing Templates')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.topTemplates.map((template, index) => (
                  <div key={template.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                        <span className="text-sm font-bold text-primary">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{template.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {template.usage} {t('uses', 'uses')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-right">
                        <p className="font-medium">{template.openRate}%</p>
                        <p className="text-muted-foreground">{t('open_rate', 'Open Rate')}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{template.clickRate}%</p>
                        <p className="text-muted-foreground">{t('click_rate', 'Click Rate')}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Agents Tab */}
        <TabsContent value="agents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('agent_performance', 'Agent Performance')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.agentPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="agent" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="conversations" fill={COLORS.primary} name={t('conversations', 'Conversations')} />
                  <Bar dataKey="satisfaction" fill={COLORS.success} name={t('satisfaction', 'Satisfaction')} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('agent_details', 'Agent Details')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.agentPerformance.map((agent) => (
                  <div key={agent.agent} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{agent.agent}</p>
                      <p className="text-sm text-muted-foreground">
                        {agent.conversations} {t('conversations', 'conversations')}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-right">
                        <p className="font-medium">{agent.avgResponseTime}m</p>
                        <p className="text-muted-foreground">{t('avg_response', 'Avg Response')}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{agent.satisfaction}/5</p>
                        <p className="text-muted-foreground">{t('satisfaction', 'Satisfaction')}</p>
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
  )
}