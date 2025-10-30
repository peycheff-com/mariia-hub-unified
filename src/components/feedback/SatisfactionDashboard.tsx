/**
 * Real-Time Satisfaction Dashboard
 * Live monitoring of client satisfaction metrics with interactive visualizations
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import {
  TrendingUp,
  TrendingDown,
  TrendingDownIcon as TrendingStable,
  AlertTriangle,
  CheckCircle,
  Users,
  Star,
  MessageSquare,
  Activity,
  Clock,
  DollarSign,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  Filter,
  Calendar,
  Download,
  Eye,
  User,
  Target,
  Zap
} from 'lucide-react';
import { toast aria-live="polite" aria-atomic="true" } from 'sonner';

import {
  SatisfactionDashboard,
  SatisfactionOverview,
  RealTimeMetrics,
  TrendAnalysis,
  StaffPerformanceOverview,
  ServiceRecoveryOverview,
  ClientInsights,
  AlertOverview,
  ServiceType,
  AlertSeverity
} from '@/types/feedback';
import { satisfactionDashboardService } from '@/services/satisfaction-dashboard.service';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SatisfactionDashboardProps {
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  initialFilters?: {
    serviceType?: ServiceType;
    staffIds?: string[];
    dateRange?: { start: string; end: string };
  };
}

export function SatisfactionDashboard({
  className = '',
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
  initialFilters = {}
}: SatisfactionDashboardProps) {
  const { t, i18n } = useTranslation();
  const [dashboard, setDashboard] = useState<SatisfactionDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState(initialFilters);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadDashboardData();
  }, [filters]);

  // Set up real-time updates
  useEffect(() => {
    if (autoRefresh && !subscriptionId) {
      const id = satisfactionDashboardService.subscribeToUpdates((data) => {
        setDashboard(data);
        setLastUpdated(new Date());
        setError(null);
      });
      setSubscriptionId(id);
    }

    return () => {
      if (subscriptionId) {
        satisfactionDashboardService.unsubscribe(subscriptionId);
        setSubscriptionId(null);
      }
    };
  }, [autoRefresh]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh || !refreshInterval) return;

    const interval = setInterval(() => {
      loadDashboardData(false);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, filters]);

  const loadDashboardData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);

      const data = await satisfactionDashboardService.getDashboardData(filters);
      setDashboard(data);
      setLastUpdated(new Date());

    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(t('feedback.dashboard.loadError'));
      toast aria-live="polite" aria-atomic="true".error(t('feedback.dashboard.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData(false);
    setRefreshing(false);
    toast aria-live="polite" aria-atomic="true".success(t('feedback.dashboard.refreshed'));
  }, [filters]);

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const formatScore = (score: number): string => {
    return (score * 20).toFixed(1); // Convert 0-5 to 0-100 scale
  };

  const getTrendIcon = (trend: 'improving' | 'stable' | 'declining') => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <TrendingStable className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: AlertSeverity): string => {
    switch (severity) {
      case 'emergency': return 'bg-red-500';
      case 'critical': return 'bg-orange-500';
      case 'warning': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive">{error || t('feedback.dashboard.noData')}</p>
            <Button onClick={handleRefresh} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('common.retry')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { overview, real_time_metrics, trend_analysis, staff_performance, service_recovery, client_insights, alerts } = dashboard;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{t('feedback.dashboard.title')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('feedback.dashboard.subtitle')}
            {lastUpdated && (
              <span className="ml-2 text-xs">
                {t('feedback.dashboard.lastUpdated', { time: lastUpdated.toLocaleTimeString() })}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filters */}
          <Select
            value={filters.serviceType || 'all'}
            onValueChange={(value) => handleFilterChange('serviceType', value === 'all' ? undefined : value)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t('feedback.dashboard.filterService')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('feedback.dashboard.allServices')}</SelectItem>
              <SelectItem value="beauty">{t('services.beauty')}</SelectItem>
              <SelectItem value="fitness">{t('services.fitness')}</SelectItem>
              <SelectItem value="lifestyle">{t('services.lifestyle')}</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {t('common.refresh')}
          </Button>

          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            {t('common.export')}
          </Button>
        </div>
      </div>

      {/* Real-Time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('feedback.dashboard.currentSatisfaction')}
                </p>
                <p className="text-2xl font-bold">
                  {formatScore(real_time_metrics.current_satisfaction_score)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {getTrendIcon(real_time_metrics.current_trend)}
                  <span className="text-sm text-muted-foreground">
                    {t(`feedback.dashboard.trend.${real_time_metrics.current_trend}`)}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <Star className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('feedback.dashboard.todaySubmissions')}
                </p>
                <p className="text-2xl font-bold">{real_time_metrics.today_submissions}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('feedback.dashboard.responseTime', { time: real_time_metrics.average_response_time })}
                </p>
              </div>
              <div className="p-3 bg-blue-10 rounded-full">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('feedback.dashboard.activeAlerts')}
                </p>
                <p className="text-2xl font-bold">{real_time_metrics.active_alerts}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('feedback.dashboard.pendingRecovery', { count: real_time_metrics.pending_recovery_cases })}
                </p>
              </div>
              <div className="p-3 bg-orange-10 rounded-full">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('feedback.dashboard.npsScore')}
                </p>
                <p className="text-2xl font-bold">{overview.nps_score}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('feedback.dashboard.cesScore', { score: overview.ces_score })}
                </p>
              </div>
              <div className="p-3 bg-green-10 rounded-full">
                <Target className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">{t('feedback.dashboard.tabs.trends')}</TabsTrigger>
          <TabsTrigger value="staff">{t('feedback.dashboard.tabs.staff')}</TabsTrigger>
          <TabsTrigger value="recovery">{t('feedback.dashboard.tabs.recovery')}</TabsTrigger>
          <TabsTrigger value="insights">{t('feedback.dashboard.tabs.insights')}</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6">
          {/* Satisfaction Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>{t('feedback.dashboard.satisfactionTrend')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trend_analysis.satisfaction_trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#8884d8"
                    strokeWidth={2}
                    name={t('feedback.dashboard.satisfactionScore')}
                  />
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    stroke="#82ca9d"
                    strokeDasharray="5 5"
                    name={t('feedback.dashboard.forecast')}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* NPS and Volume Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('feedback.dashboard.npsTrend')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={trend_analysis.nps_trend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.3}
                      name={t('feedback.dashboard.npsScore')}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('feedback.dashboard.feedbackVolume')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={trend_analysis.volume_trend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#82ca9d" name={t('feedback.dashboard.submissions')} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="staff" className="space-y-6">
          {/* Staff Performance Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('feedback.dashboard.topPerformers')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {staff_performance.top_performers.slice(0, 5).map((staff, index) => (
                    <div key={staff.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={`/avatars/${staff.id}.jpg`} />
                          <AvatarFallback>{staff.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{staff.name}</p>
                          <p className="text-sm text-muted-foreground">{staff.role}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatScore(staff.average_score)}</p>
                        <div className="flex items-center gap-1">
                          {getTrendIcon(staff.trend)}
                          <span className="text-xs text-muted-foreground">#{staff.ranking}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('feedback.dashboard.improvementNeeded')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {staff_performance.improvement_needed.slice(0, 5).map((staff, index) => (
                    <div key={staff.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={`/avatars/${staff.id}.jpg`} />
                          <AvatarFallback>{staff.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{staff.name}</p>
                          <p className="text-sm text-muted-foreground">{staff.role}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatScore(staff.average_score)}</p>
                        <div className="flex items-center gap-1">
                          {getTrendIcon(staff.trend)}
                          <span className="text-xs text-muted-foreground">#{staff.ranking}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>{t('feedback.dashboard.performanceDistribution')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-4">
                {Object.entries(staff_performance.performance_distribution).map(([category, count]) => (
                  <div key={category} className="text-center">
                    <div className="text-2xl font-bold">{count}</div>
                    <div className="text-sm text-muted-foreground capitalize">
                      {t(`feedback.dashboard.performance.${category}`)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={Object.entries(staff_performance.performance_distribution).map(([name, value]) => ({
                        name: t(`feedback.dashboard.performance.${name}`),
                        value
                      }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {Object.entries(staff_performance.performance_distribution).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recovery" className="space-y-6">
          {/* Service Recovery Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t('feedback.dashboard.activeCases')}
                    </p>
                    <p className="text-2xl font-bold">{service_recovery.active_cases}</p>
                  </div>
                  <AlertCircle className="h-6 w-6 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t('feedback.dashboard.resolvedToday')}
                    </p>
                    <p className="text-2xl font-bold">{service_recovery.resolved_today}</p>
                  </div>
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t('feedback.dashboard.successRate')}
                    </p>
                    <p className="text-2xl font-bold">{service_recovery.success_rate}%</p>
                  </div>
                  <Zap className="h-6 w-6 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Priority Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>{t('feedback.dashboard.priorityBreakdown')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(service_recovery.priority_breakdown).map(([priority, count]) => (
                  <div key={priority} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={priority === 'critical' ? 'destructive' : priority === 'high' ? 'destructive' : 'secondary'}>
                        {t(`feedback.dashboard.priority.${priority}`)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{count}</span>
                      <div className="w-24">
                        <Progress
                          value={(count / service_recovery.active_cases) * 100}
                          className="h-2"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {/* Client Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('feedback.dashboard.atRiskClients')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {client_insights.at_risk_clients.slice(0, 5).map((client, index) => (
                      <div key={client.client_id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium">{client.client_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {t('feedback.dashboard.satisfaction')}: {formatScore(client.last_satisfaction_score)}
                          </p>
                        </div>
                        <Badge variant="destructive">
                          {t(`feedback.dashboard.risk.${client.risk_level}`)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('feedback.dashboard.vipClients')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {client_insights.vip_clients.slice(0, 5).map((client, index) => (
                      <div key={client.client_id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{client.client_name}</p>
                            {client.special_attention_needed && (
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {t('feedback.dashboard.lifetimeValue')}: ${client.lifetime_value.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatScore(client.satisfaction_score)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Alerts Overview */}
          <Card>
            <CardHeader>
              <CardTitle>{t('feedback.dashboard.recentAlerts')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(alerts.by_severity).map(([severity, count]) => (
                  <div key={severity} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getSeverityColor(severity as AlertSeverity)}`} />
                      <span className="capitalize">{severity}</span>
                    </div>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}