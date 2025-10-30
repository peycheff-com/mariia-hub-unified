// Comprehensive communication dashboard for staff

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  MessageSquare,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  Mail,
  Phone,
  MessageCircle,
  BarChart3,
  TrendingUp,
  Calendar,
  Settings,
  Bell,
  Filter
} from 'lucide-react';
import { useCommunicationDashboard, useRealtimeMessages } from '@/lib/communication/hooks/use-communication';
import { formatDistanceToNow } from 'date-fns';
import { enUS, pl } from 'date-fns/locale';

interface CommunicationDashboardProps {
  userId?: string;
  className?: string;
}

export function CommunicationDashboard({ userId, className }: CommunicationDashboardProps) {
  const { dashboard, isLoading, error, refetch } = useCommunicationDashboard(userId);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const { messages } = useRealtimeMessages(selectedThread || undefined);
  const [activeTab, setActiveTab] = useState('overview');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>Failed to load communication dashboard</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <MessageSquare className="h-4 w-4 text-gray-500" />;
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'sms':
        return <Phone className="h-4 w-4" />;
      case 'whatsapp':
        return <MessageCircle className="h-4 w-4" />;
      case 'in_app':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Communication Center</h1>
          <p className="text-muted-foreground">
            Manage client communications and monitor messaging activity
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button size="sm">
            <Send className="h-4 w-4 mr-2" />
            New Message
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.overview.totalMessages}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12%</span> from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Threads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.overview.activeThreads}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-blue-600">+5</span> new today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.overview.deliveryRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+2.3%</span> improvement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Messages</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.overview.pendingMessages}</div>
            <p className="text-xs text-muted-foreground">
              2 require immediate attention
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Messages */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Messages</CardTitle>
                <CardDescription>Latest client communications</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-80">
                  <div className="space-y-4">
                    {dashboard.recentMessages.slice(0, 10).map((message) => (
                      <div key={message.id} className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div className="flex-shrink-0">
                          {getChannelIcon(message.channel)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium truncate">
                              {message.content.substring(0, 50)}...
                            </p>
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(message.status)}
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(message.created_at), {
                                  addSuffix: true,
                                  locale: enUS
                                })}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {message.channel}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {message.direction}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Channel Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Channel Performance</CardTitle>
                <CardDescription>Delivery rates by communication channel</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboard.channelMetrics.map((metric) => (
                    <div key={metric.channel} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getChannelIcon(metric.channel)}
                          <span className="text-sm font-medium capitalize">{metric.channel}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {metric.metrics.deliveryRate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${metric.metrics.deliveryRate}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{metric.metrics.totalSent} sent</span>
                        <span>{metric.metrics.totalDelivered} delivered</span>
                        <span>{metric.metrics.totalFailed} failed</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Message Threads */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Active Conversations</CardTitle>
                <CardDescription>Client message threads</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {dashboard.recentMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedThread === message.thread_id
                            ? 'bg-primary/10 border-primary'
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedThread(message.thread_id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={`/api/avatars/${message.recipient_id}`} />
                              <AvatarFallback>
                                {message.recipient_id?.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">Client</p>
                              <p className="text-xs text-muted-foreground">
                                {message.channel}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-1">
                            {getStatusIcon(message.status)}
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(message.created_at), {
                                addSuffix: false
                              })}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2 truncate">
                          {message.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Message Thread Detail */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Conversation</CardTitle>
                <CardDescription>
                  {selectedThread ? 'Thread messages' : 'Select a conversation to view messages'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedThread ? (
                  <div className="space-y-4">
                    <ScrollArea className="h-96 p-4 border rounded-lg">
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                message.direction === 'outbound'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-xs opacity-70">
                                  {formatDistanceToNow(new Date(message.created_at), {
                                    addSuffix: false
                                  })}
                                </span>
                                {getStatusIcon(message.status)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Type your message..."
                        className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <Button size="sm">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-96 text-muted-foreground">
                    <div className="text-center">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Select a conversation to start messaging</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Messages</CardTitle>
              <CardDescription>Messages scheduled for future delivery</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboard.upcomingScheduled.map((scheduled) => (
                  <div key={scheduled.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{scheduled.content.substring(0, 100)}...</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="secondary">{scheduled.channel}</Badge>
                          <span className="text-xs text-muted-foreground">
                            Scheduled for {formatDistanceToNow(new Date(scheduled.scheduled_for), {
                              addSuffix: true
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        Cancel
                      </Button>
                    </div>
                  </div>
                ))}
                {dashboard.upcomingScheduled.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No scheduled messages</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Campaigns</CardTitle>
                <CardDescription>Best performing marketing campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboard.topCampaigns.map((campaign) => (
                    <div key={campaign.campaignId} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{campaign.campaignName}</span>
                        <Badge variant={campaign.status === 'sent' ? 'default' : 'secondary'}>
                          {campaign.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-xs">
                        <div>
                          <p className="text-muted-foreground">Sent</p>
                          <p className="font-medium">{campaign.sentCount}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Open Rate</p>
                          <p className="font-medium">{campaign.openRate.toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Click Rate</p>
                          <p className="font-medium">{campaign.clickRate.toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Communication Trends</CardTitle>
                <CardDescription>Messaging volume over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Analytics visualization coming soon</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}