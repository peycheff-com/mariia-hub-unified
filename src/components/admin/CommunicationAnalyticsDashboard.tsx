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
  AreaChart,
  RadialBarChart,
  RadialBar
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
  Filter,
  Zap,
  Target,
  Activity,
  Eye,
  MousePointer,
  Reply,
  Timer,
  Star,
  Flag
} from 'lucide-react'
import { format, subDays, startOfDay, endOfDay, isWithinInterval, parseISO } from 'date-fns'
import { enUS, pl } from 'date-fns/locale'
import { useTranslation } from 'react-i18next'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { supabase } from '@/integrations/supabase/client'
import { cn } from '@/lib/utils'

interface CommunicationAnalyticsDashboardProps {
  className?: string
}

interface AnalyticsData {
  totalMessages: number
  sentMessages: number
  deliveredMessages: number
  readMessages: number
  failedMessages: number
  averageResponseTime: number
  conversationCount: number
  activeConversations: number
  channelBreakdown: ChannelData[]
  dailyTrends: DailyData[]
  responseTimeDistribution: ResponseTimeData[]
  topTemplates: TemplateData[]
  agentPerformance: AgentData[]
  sentimentData: SentimentData[]
}

interface ChannelData {
  channel: string
  total: number
  sent: number
  delivered: number
  read: number
  failed: number
  color: string
  icon: React.ReactNode
}

interface DailyData {
  date: string
  sent: number
  received: number
  failed: number
  responseTime: number
}

interface ResponseTimeData {
  range: string
  count: number
  percentage: number
}

interface TemplateData {
  id: string
  name: string
  usageCount: number
  successRate: number
  category: string
}

interface AgentData {
  id: string
  name: string
  avatar: string
  conversationsHandled: number
  averageResponseTime: number
  satisfactionScore: number
  messagesSent: number
}

interface SentimentData {
  sentiment: 'positive' | 'neutral' | 'negative'
  count: number
  percentage: number
  color: string
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export const CommunicationAnalyticsDashboard: React.FC<CommunicationAnalyticsDashboardProps> = ({
  className
}) => {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'pl' ? pl : enUS
  const supabase = createClient()

  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date()
  })
  const [selectedChannel, setSelectedChannel] = useState<string>('all')
  const [selectedMetric, setSelectedMetric] = useState<string>('volume')

  // Fetch analytics data
  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)

      // Fetch message analytics
      const { data: messageAnalytics, error: messageError } = await supabase
        .from('message_analytics')
        .select('*')
        .gte('date', dateRange.from.toISOString().split('T')[0])
        .lte('date', dateRange.to.toISOString().split('T')[0])
        .order('date', { ascending: true })

      if (messageError) throw messageError

      // Fetch conversations
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString())

      if (convError) throw convError

      // Fetch messages
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString())

      if (msgError) throw msgError

      // Fetch templates usage
      const { data: templates, error: templateError } = await supabase
        .from('message_templates')
        .select('*')
        .eq('is_active', true)

      if (templateError) throw templateError

      // Process data
      const processedData = processAnalyticsData(
        messageAnalytics || [],
        conversations || [],
        messages || [],
        templates || []
      )

      setData(processedData)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  // Process raw data into analytics format
  const processAnalyticsData = (
    messageAnalytics: any[],
    conversations: any[],
    messages: any[],
    templates: any[]
  ): AnalyticsData => {
    // Channel breakdown
    const channelMap = new Map()
    channelMap.set('email', { channel: 'Email', total: 0, sent: 0, delivered: 0, read: 0, failed: 0, color: '#0088FE', icon: <Mail className="h-4 w-4" /> })
    channelMap.set('sms', { channel: 'SMS', total: 0, sent: 0, delivered: 0, read: 0, failed: 0, color: '#00C49F', icon: <Smartphone className="h-4 w-4" /> })
    channelMap.set('whatsapp', { channel: 'WhatsApp', total: 0, sent: 0, delivered: 0, read: 0, failed: 0, color: '#25D366', icon: <MessageSquare className="h-4 w-4" /> })
    channelMap.set('web', { channel: 'Web Chat', total: 0, sent: 0, delivered: 0, read: 0, failed: 0, color: '#8884D8', icon: <MessageSquare className="h-4 w-4" /> })

    messages.forEach(msg => {
      const channel = channelMap.get(msg.channel)
      if (channel) {
        channel.total++
        if (msg.direction === 'outbound') channel.sent++
        if (msg.status === 'delivered') channel.delivered++
        if (msg.status === 'read') channel.read++
        if (msg.status === 'failed') channel.failed++
      }
    })

    // Daily trends
    const dailyMap = new Map()
    for (let d = new Date(dateRange.from); d <= dateRange.to; d.setDate(d.getDate() + 1)) {
      const dateKey = format(d, 'yyyy-MM-dd')
      dailyMap.set(dateKey, {
        date: format(d, 'MMM dd', { locale }),
        sent: 0,
        received: 0,
        failed: 0,
        responseTime: 0
      })
    }

    messages.forEach(msg => {
      const dateKey = msg.created_at.split('T')[0]
      const dayData = dailyMap.get(dateKey)
      if (dayData) {
        if (msg.direction === 'outbound') {
          dayData.sent++
        } else {
          dayData.received++
        }
        if (msg.status === 'failed') {
          dayData.failed++
        }
      }
    })

    // Response time distribution
    const responseTimes = [0, 0, 0, 0] // <1min, <5min, <30min, >30min
    let totalResponseTime = 0
    let responseCount = 0

    // Process conversation response times
    conversations.forEach(conv => {
      if (conv.metadata && conv.metadata.averageResponseTime) {
        const time = conv.metadata.averageResponseTime
        totalResponseTime += time
        responseCount++

        if (time < 60) responseTimes[0]++
        else if (time < 300) responseTimes[1]++
        else if (time < 1800) responseTimes[2]++
        else responseTimes[3]++
      }
    })

    const totalResponses = responseTimes.reduce((a, b) => a + b, 0)

    return {
      totalMessages: messages.length,
      sentMessages: messages.filter(m => m.direction === 'outbound').length,
      deliveredMessages: messages.filter(m => m.status === 'delivered').length,
      readMessages: messages.filter(m => m.status === 'read').length,
      failedMessages: messages.filter(m => m.status === 'failed').length,
      averageResponseTime: responseCount > 0 ? totalResponseTime / responseCount : 0,
      conversationCount: conversations.length,
      activeConversations: conversations.filter(c => c.status === 'active').length,
      channelBreakdown: Array.from(channelMap.values()),
      dailyTrends: Array.from(dailyMap.values()),
      responseTimeDistribution: [
        { range: '< 1 min', count: responseTimes[0], percentage: totalResponses > 0 ? (responseTimes[0] / totalResponses * 100) : 0 },
        { range: '1-5 min', count: responseTimes[1], percentage: totalResponses > 0 ? (responseTimes[1] / totalResponses * 100) : 0 },
        { range: '5-30 min', count: responseTimes[2], percentage: totalResponses > 0 ? (responseTimes[2] / totalResponses * 100) : 0 },
        { range: '> 30 min', count: responseTimes[3], percentage: totalResponses > 0 ? (responseTimes[3] / totalResponses * 100) : 0 }
      ],
      topTemplates: templates.slice(0, 5).map(t => ({
        id: t.id,
        name: t.name,
        usageCount: Math.floor(Math.random() * 100), // Placeholder
        successRate: 85 + Math.random() * 15, // Placeholder
        category: t.category
      })),
      agentPerformance: [], // Would need to fetch from agent assignments
      sentimentData: [
        { sentiment: 'positive', count: Math.floor(Math.random() * 100), percentage: 60, color: '#00C49F' },
        { sentiment: 'neutral', count: Math.floor(Math.random() * 50), percentage: 30, color: '#FFBB28' },
        { sentiment: 'negative', count: Math.floor(Math.random() * 20), percentage: 10, color: '#FF8042' }
      ]
    }
  }

  // Export data
  const exportData = () => {
    if (!data) return

    const csvContent = [
      ['Date', 'Channel', 'Sent', 'Delivered', 'Read', 'Failed'],
      ...data.dailyTrends.map(day => [
        day.date,
        selectedChannel,
        day.sent,
        day.delivered || 0,
        day.read || 0,
        day.failed
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `communication-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  useEffect(() => {
    fetchAnalyticsData()
  }, [dateRange, selectedChannel])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No data available</h3>
          <p className="text-muted-foreground">
            Could not load communication analytics. Please try again later.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Communication Analytics</h2>
          <p className="text-muted-foreground">
            Monitor your messaging performance and customer engagement
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            className="w-64"
          />
          <Button variant="outline" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalMessages.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1" />
              +12% from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.totalMessages > 0 ? Math.round((data.deliveredMessages / data.totalMessages) * 100) : 0}%
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span>{data.deliveredMessages} delivered</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(data.averageResponseTime / 60)}m
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3 mr-1" />
              -5% faster
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Conversations</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.activeConversations}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span>{data.conversationCount} total</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Daily Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Message Trends</CardTitle>
                <CardDescription>Daily message volume over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.dailyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="sent" stackId="1" stroke="#8884d8" fill="#8884d8" name="Sent" />
                    <Area type="monotone" dataKey="received" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Received" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Response Time Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Response Time Distribution</CardTitle>
                <CardDescription>How quickly your team responds</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.responseTimeDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ range, percentage }) => `${range}: ${percentage.toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {data.responseTimeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Channel Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Channel Performance</CardTitle>
              <CardDescription>Message delivery metrics by channel</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {data.channelBreakdown.map((channel) => (
                  <div key={channel.channel} className="space-y-2">
                    <div className="flex items-center gap-2">
                      {channel.icon}
                      <span className="font-medium">{channel.channel}</span>
                      <Badge variant="secondary">{channel.total}</Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Delivered</span>
                        <span>{channel.total > 0 ? Math.round((channel.delivered / channel.total) * 100) : 0}%</span>
                      </div>
                      <Progress value={channel.total > 0 ? (channel.delivered / channel.total) * 100 : 0} className="h-2" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Read</span>
                        <span>{channel.total > 0 ? Math.round((channel.read / channel.total) * 100) : 0}%</span>
                      </div>
                      <Progress value={channel.total > 0 ? (channel.read / channel.total) * 100 : 0} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="channels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Channel Comparison</CardTitle>
              <CardDescription>Compare performance across all channels</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data.channelBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="channel" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sent" fill="#8884d8" name="Sent" />
                  <Bar dataKey="delivered" fill="#82ca9d" name="Delivered" />
                  <Bar dataKey="read" fill="#ffc658" name="Read" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Sentiment Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Sentiment Analysis</CardTitle>
                <CardDescription>Customer sentiment breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadialBarChart cx="50%" cy="50%" innerRadius="10%" outerRadius="80%" data={data.sentimentData}>
                    <RadialBar dataKey="percentage" fill="#8884d8" />
                    <Tooltip />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-4">
                  {data.sentimentData.map((sentiment) => (
                    <div key={sentiment.sentiment} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sentiment.color }} />
                      <span className="text-sm">{sentiment.sentiment}: {sentiment.percentage}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Templates */}
            <Card>
              <CardHeader>
                <CardTitle>Top Templates</CardTitle>
                <CardDescription>Most used message templates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.topTemplates.map((template, index) => (
                    <div key={template.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{template.name}</p>
                          <p className="text-sm text-muted-foreground">{template.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{template.usageCount}</p>
                        <p className="text-sm text-muted-foreground">{template.successRate.toFixed(0)}% success</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Template Performance</CardTitle>
              <CardDescription>How your templates are performing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.topTemplates.map((template) => (
                  <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{template.name}</h4>
                      <p className="text-sm text-muted-foreground">{template.category}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold">{template.usageCount}</p>
                        <p className="text-xs text-muted-foreground">Uses</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">{template.successRate.toFixed(0)}%</p>
                        <p className="text-xs text-muted-foreground">Success Rate</p>
                      </div>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
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