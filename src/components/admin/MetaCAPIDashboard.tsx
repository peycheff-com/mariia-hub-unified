import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  DollarSign,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Target
} from 'lucide-react';
import { format, subDays } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useToast } from '@/hooks/use-toast aria-live="polite" aria-atomic="true"';
import { supabase } from '@/integrations/supabase/client';
import { getMetaConversionsAPI } from '@/lib/meta-conversions-api';
import { logger } from '@/lib/logger';


interface ConversionAnalytics {
  eventName: string;
  totalEvents: number;
  successfulEvents: number;
  failedEvents: number;
  totalConversionValue: number;
  averageConversionValue: number;
  successRate: number;
}

interface DailyTrend {
  eventDate: string;
  totalEvents: number;
  successfulEvents: number;
  totalConversionValue: number;
  uniqueEvents: number;
}

interface FunnelStep {
  eventName: string;
  eventCount: number;
  conversionRate: number;
  dropOffRate: number;
  avgTimeToConversionMinutes: number;
}

interface RetryStatus {
  queueLength: number;
  isProcessing: boolean;
  nextRetryCount: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const MetaCAPIDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<ConversionAnalytics[]>([]);
  const [dailyTrends, setDailyTrends] = useState<DailyTrend[]>([]);
  const [funnelData, setFunnelData] = useState<FunnelStep[]>([]);
  const [retryStatus, setRetryStatus] = useState<RetryStatus | null>(null);
  const [dateRange, setDateRange] = useState(30);
  const { toast aria-live="polite" aria-atomic="true" } = useToast();

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Fetch conversion analytics
      const { data: analyticsData, error: analyticsError } = await supabase
        .rpc('get_conversion_analytics', {
          start_date: subDays(new Date(), dateRange),
          end_date: new Date()
        });

      if (analyticsError) throw analyticsError;
      setAnalytics(analyticsData || []);

      // Fetch daily trends
      const { data: trendsData, error: trendsError } = await supabase
        .rpc('get_daily_conversion_trends', {
          start_date: subDays(new Date(), 7),
          end_date: new Date()
        });

      if (trendsError) throw trendsError;
      setDailyTrends(trendsData || []);

      // Fetch funnel data
      const { data: funnelData, error: funnelError } = await supabase
        .rpc('get_conversion_funnel');

      if (funnelError) throw funnelError;
      setFunnelData(funnelData || []);

      // Get retry status
      const api = getMetaConversionsAPI();
      setRetryStatus(api.getRetryQueueStatus());

    } catch (error) {
      logger.error('Failed to fetch CAPI analytics', error);
      toast aria-live="polite" aria-atomic="true"({
        title: 'Error',
        description: 'Failed to load conversion analytics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const handleRetryFailedEvents = async () => {
    try {
      const { data, error } = await supabase.rpc('retry_failed_events');

      if (error) throw error;

      toast aria-live="polite" aria-atomic="true"({
        title: 'Success',
        description: `Retried ${data} failed events`,
      });

      fetchAnalytics();
    } catch (error) {
      logger.error('Failed to retry events', error);
      toast aria-live="polite" aria-atomic="true"({
        title: 'Error',
        description: 'Failed to retry events',
        variant: 'destructive',
      });
    }
  };

  const handleClearRetryQueue = () => {
    const api = getMetaConversionsAPI();
    api.clearRetryQueue();
    setRetryStatus(api.getRetryQueueStatus());

    toast aria-live="polite" aria-atomic="true"({
      title: 'Success',
      description: 'Retry queue cleared',
    });
  };

  const totalEvents = analytics.reduce((sum, item) => sum + item.totalEvents, 0);
  const totalValue = analytics.reduce((sum, item) => sum + item.totalConversionValue, 0);
  const overallSuccessRate = totalEvents > 0
    ? (analytics.reduce((sum, item) => sum + item.successfulEvents, 0) / totalEvents) * 100
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Meta Conversions API</h2>
          <p className="text-muted-foreground">
            Track and analyze conversion events across your marketing funnels
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(Number(e.target.value))}
            className="px-3 py-2 border rounded-md"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <Button onClick={fetchAnalytics} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEvents.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              In the last {dateRange} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalValue.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}</div>
            <p className="text-xs text-muted-foreground">
              Conversion value tracked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallSuccessRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Events delivered successfully
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retry Queue</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{retryStatus?.queueLength || 0}</div>
            <div className="flex items-center gap-2">
              <Badge variant={retryStatus?.isProcessing ? "default" : "secondary"}>
                {retryStatus?.isProcessing ? "Processing" : "Idle"}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearRetryQueue}
                disabled={!retryStatus?.queueLength}
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main content tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Event Breakdown</TabsTrigger>
          <TabsTrigger value="funnel">Conversion Funnel</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="troubleshoot">Troubleshoot</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Event Types Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Events by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics}
                      dataKey="totalEvents"
                      nameKey="eventName"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ eventName, totalEvents }) => `${eventName}: ${totalEvents}`}
                    >
                      {analytics.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Success Rate Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Success Rates by Event</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="eventName" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="successRate" fill="#00C49F" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Event Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.map((event) => (
                  <div key={event.eventName} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div>
                        <h3 className="font-semibold">{event.eventName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {event.totalEvents} total events
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {event.successfulEvents} / {event.totalEvents}
                        </p>
                        <Badge variant={event.successRate > 90 ? "default" : "destructive"}>
                          {event.successRate.toFixed(1)}% success
                        </Badge>
                      </div>
                      {event.totalConversionValue > 0 && (
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {event.totalConversionValue.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            avg: {event.averageConversionValue.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="funnel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {funnelData.map((step, index) => (
                  <div key={step.eventName} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <h3 className="font-semibold">{step.eventName}</h3>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm">{step.eventCount.toLocaleString()} events</span>
                        <Badge variant="outline">
                          {step.conversionRate.toFixed(1)}% conversion
                        </Badge>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${step.conversionRate}%` }}
                      />
                    </div>
                    {step.dropOffRate > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {step.dropOffRate.toFixed(1)}% drop-off rate
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Trends (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={dailyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="eventDate"
                    tickFormatter={(date) => format(new Date(date), 'MMM dd')}
                  />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <ChartTooltip
                    labelFormatter={(date) => format(new Date(date), 'MMM dd, yyyy')}
                    content={<ChartTooltipContent />}
                  />
                  <Bar yAxisId="left" dataKey="totalEvents" fill="#8884d8" name="Total Events" />
                  <Line yAxisId="right" type="monotone" dataKey="totalConversionValue" stroke="#82ca9d" name="Value (PLN)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="troubleshoot" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Retry Queue Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Queue Length:</span>
                  <Badge variant={retryStatus?.queueLength ? "destructive" : "default"}>
                    {retryStatus?.queueLength || 0} events
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Processing Status:</span>
                  <Badge variant={retryStatus?.isProcessing ? "default" : "secondary"}>
                    {retryStatus?.isProcessing ? "Processing" : "Idle"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Ready for Retry:</span>
                  <span>{retryStatus?.nextRetryCount || 0} events</span>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleRetryFailedEvents} size="sm">
                    Retry Failed Events
                  </Button>
                  <Button onClick={handleClearRetryQueue} variant="outline" size="sm">
                    Clear Queue
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Failed Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics
                    .filter(event => event.failedEvents > 0)
                    .map(event => (
                      <div key={event.eventName} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-500" />
                          <span className="text-sm">{event.eventName}</span>
                        </div>
                        <Badge variant="destructive">
                          {event.failedEvents} failed
                        </Badge>
                      </div>
                    ))}
                  {analytics.filter(event => event.failedEvents > 0).length === 0 && (
                    <p className="text-sm text-muted-foreground">No failed events in the selected period</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};