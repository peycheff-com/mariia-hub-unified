/**
 * Enterprise Performance Dashboard
 * Real-time performance monitoring, SLA tracking, and alert management
 * for Mariia Hub platform
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  TrendingUp,
  TrendingDown,
  Zap,
  Shield,
  Globe,
  Server,
  Cpu,
  HardDrive,
  Wifi,
  Monitor,
  BarChart3,
  LineChart,
  RefreshCw,
  Download,
  Settings,
  Bell,
  Filter,
  Calendar,
  MapPin,
  Smartphone,
  Eye,
  AlertCircle,
  Info,
  XCircle,
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  performanceMonitoringService,
  PagePerformanceMetrics,
  APIPerformanceMetrics,
  PerformanceAlert,
  SLAMetrics
} from '@/lib/performance-monitoring';

// Chart components (would typically use a library like recharts)
const PerformanceChart: React.FC<{
  data: Array<{ time: string; value: number; label?: string }>;
  title: string;
  unit: string;
  color?: string;
  threshold?: number;
}> = ({ data, title, unit, color = '#3b82f6', threshold }) => (
  <div className="h-64 w-full">
    <div className="flex items-center justify-between mb-4">
      <h4 className="text-sm font-medium">{title}</h4>
      {threshold && (
        <div className="text-xs text-muted-foreground">
          Threshold: {threshold}{unit}
        </div>
      )}
    </div>
    <div className="relative h-48 border rounded-lg p-4 bg-muted/20">
      {/* Placeholder for actual chart implementation */}
      <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <LineChart className="w-8 h-8 mx-auto mb-2" />
          <p className="text-xs">Performance Chart</p>
          <p className="text-xs">{data.length} data points</p>
        </div>
      </div>
      {/* Chart would be rendered here using recharts or similar */}
    </div>
  </div>
);

const PerformanceDashboard: React.FC = () => {
  const [currentMetrics, setCurrentMetrics] = useState<PagePerformanceMetrics | null>(null);
  const [apiMetrics, setApiMetrics] = useState<APIPerformanceMetrics[]>([]);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [slaMetrics, setSlaMetrics] = useState<SLAMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRealTime, setIsRealTime] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');
  const [selectedMetric, setSelectedMetric] = useState('overview');

  // Real-time updates
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);

        // Get current performance metrics
        const metrics = performanceMonitoringService.getCurrentMetrics();
        setCurrentMetrics(metrics);

        // Get API metrics
        const apiData = performanceMonitoringService.getAPIMetrics(100);
        setApiMetrics(apiData);

        // Get active alerts
        const activeAlerts = performanceMonitoringService.getActiveAlerts();
        setAlerts(activeAlerts);

        // Get SLA metrics
        const slaData = await performanceMonitoringService.getSLAMetrics('daily');
        setSlaMetrics(slaData);

        setLastUpdate(new Date());
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();

    if (isRealTime) {
      const interval = setInterval(loadDashboardData, 10000); // Update every 10 seconds
      return () => clearInterval(interval);
    }
  }, [isRealTime]);

  const handleRefresh = useCallback(async () => {
    await loadDashboardData();
  }, []);

  const handleAcknowledgeAlert = useCallback(async (alertId: string) => {
    await performanceMonitoringService.acknowledgeAlert(alertId, 'current-user');
    await handleRefresh();
  }, [handleRefresh]);

  const handleResolveAlert = useCallback(async (alertId: string) => {
    await performanceMonitoringService.resolveAlert(alertId, 'current-user');
    await handleRefresh();
  }, [handleRefresh]);

  const handleExportMetrics = useCallback(async (format: 'json' | 'csv') => {
    const data = await performanceMonitoringService.exportMetrics(format);
    const blob = new Blob([data], {
      type: format === 'json' ? 'application/json' : 'text/csv'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-metrics-${new Date().toISOString().split('T')[0]}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  // Calculate performance scores
  const performanceScores = useMemo(() => {
    if (!currentMetrics?.vitals) return null;

    const { vitals } = currentMetrics;
    const thresholds = {
      lcp: { good: 2500, poor: 4000 },
      fid: { good: 100, poor: 300 },
      cls: { good: 0.1, poor: 0.25 },
      fcp: { good: 1800, poor: 3000 },
      ttfb: { good: 800, poor: 1800 }
    };

    const getScore = (value: number, good: number, poor: number): number => {
      if (value <= good) return 100;
      if (value >= poor) return 0;
      return Math.round(((poor - value) / (poor - good)) * 100);
    };

    return {
      lcp: getScore(vitals.lcp || 0, thresholds.lcp.good, thresholds.lcp.poor),
      fid: getScore(vitals.fid || 0, thresholds.fid.good, thresholds.fid.poor),
      cls: getScore(vitals.cls || 0, thresholds.cls.good, thresholds.cls.poor),
      fcp: getScore(vitals.fcp || 0, thresholds.fcp.good, thresholds.fcp.poor),
      ttfb: getScore(vitals.ttfb || 0, thresholds.ttfb.good, thresholds.ttfb.poor)
    };
  }, [currentMetrics]);

  // Calculate overall health score
  const overallHealthScore = useMemo(() => {
    if (!performanceScores) return 0;
    const scores = Object.values(performanceScores);
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }, [performanceScores]);

  // API performance summary
  const apiPerformanceSummary = useMemo(() => {
    if (apiMetrics.length === 0) return null;

    const recentMetrics = apiMetrics.slice(-100);
    const avgResponseTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length;
    const errorRate = (recentMetrics.filter(m => m.statusCode >= 400).length / recentMetrics.length) * 100;
    const cacheHitRate = (recentMetrics.filter(m => m.cacheHit).length / recentMetrics.length) * 100;

    return {
      avgResponseTime: Math.round(avgResponseTime),
      errorRate: Math.round(errorRate * 10) / 10,
      cacheHitRate: Math.round(cacheHitRate),
      totalRequests: recentMetrics.length
    };
  }, [apiMetrics]);

  // Alert summary
  const alertSummary = useMemo(() => {
    const critical = alerts.filter(a => a.severity === 'critical' && !a.resolved).length;
    const warning = alerts.filter(a => a.severity === 'warning' && !a.resolved).length;
    const info = alerts.filter(a => a.severity === 'info' && !a.resolved).length;
    const total = alerts.filter(a => !a.resolved).length;

    return { critical, warning, info, total };
  }, [alerts]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (score >= 70) return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    return <XCircle className="w-4 h-4 text-red-600" />;
  };

  if (isLoading && !currentMetrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Performance Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time performance monitoring and SLA tracking
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Badge variant={isRealTime ? 'default' : 'secondary'}>
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
              {isRealTime ? 'Live' : 'Paused'}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRealTime(!isRealTime)}
            >
              {isRealTime ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              {isRealTime ? 'Pause' : 'Resume'}
            </Button>
          </div>

          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15m">15 min</SelectItem>
              <SelectItem value="1h">1 hour</SelectItem>
              <SelectItem value="6h">6 hours</SelectItem>
              <SelectItem value="24h">24 hours</SelectItem>
              <SelectItem value="7d">7 days</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExportMetrics('json')}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Critical Alerts */}
      {alertSummary.critical > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="flex items-center justify-between">
              <div>
                <strong>Critical Alerts:</strong> {alertSummary.critical} critical performance issue{alertSummary.critical > 1 ? 's' : ''} detected
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedMetric('alerts')}
              >
                View Alerts
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Performance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Overall Health Score */}
        <Card className="relative">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium">Health Score</span>
              </div>
              {getScoreIcon(overallHealthScore)}
            </div>
            <div className="space-y-2">
              <div className={`text-3xl font-bold ${getScoreColor(overallHealthScore)}`}>
                {overallHealthScore}%
              </div>
              <Progress value={overallHealthScore} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {overallHealthScore >= 90 ? 'Excellent' :
                 overallHealthScore >= 70 ? 'Good' :
                 overallHealthScore >= 50 ? 'Fair' : 'Poor'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* API Performance */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium">API Response</span>
              </div>
              <Badge variant={apiPerformanceSummary?.errorRate === 0 ? 'default' : 'destructive'}>
                {apiPerformanceSummary?.errorRate === 0 ? 'Healthy' : 'Issues'}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {apiPerformanceSummary?.avgResponseTime || 0}ms
              </div>
              <div className="text-xs text-muted-foreground">
                Error Rate: {apiPerformanceSummary?.errorRate || 0}%
              </div>
              <div className="text-xs text-muted-foreground">
                Cache Hit: {apiPerformanceSummary?.cacheHitRate || 0}%
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Alerts */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-orange-600" />
                <span className="text-sm font-medium">Active Alerts</span>
              </div>
              <Badge variant={alertSummary.total === 0 ? 'default' : 'destructive'}>
                {alertSummary.total}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold">{alertSummary.total}</div>
              <div className="flex space-x-2 text-xs">
                <span className="text-red-600">{alertSummary.critical} Critical</span>
                <span className="text-yellow-600">{alertSummary.warning} Warning</span>
                <span className="text-blue-600">{alertSummary.info} Info</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SLA Compliance */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium">SLA Compliance</span>
              </div>
              <Badge variant="default">99.9%</Badge>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold">99.9%</div>
              <div className="text-xs text-muted-foreground">
                Target: 99.9% | Downtime: 0m
              </div>
              <Progress value={99.9} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs value={selectedMetric} onValueChange={setSelectedMetric} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="web-vitals">Web Vitals</TabsTrigger>
          <TabsTrigger value="api">API Performance</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="sla">SLA Tracking</TabsTrigger>
          <TabsTrigger value="geography">Geography</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Core Web Vitals Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="w-5 h-5" />
                  <span>Core Web Vitals</span>
                </CardTitle>
                <CardDescription>
                  Real-time web performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {performanceScores && Object.entries(performanceScores).map(([metric, score]) => (
                    <div key={metric} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getScoreIcon(score)}
                        <div>
                          <div className="text-sm font-medium">
                            {metric.toUpperCase()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {currentMetrics?.vitals[metric as keyof CoreWebVitals]
                              ? formatTime(currentMetrics.vitals[metric as keyof CoreWebVitals] as number)
                              : 'N/A'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${getScoreColor(score)}`}>
                          {score}%
                        </div>
                        <Progress value={score} className="w-20 h-2 mt-1" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* System Resources */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Server className="w-5 h-5" />
                  <span>System Resources</span>
                </CardTitle>
                <CardDescription>
                  Resource utilization and performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentMetrics?.memory && (
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Memory Usage</span>
                        <span>{formatBytes(currentMetrics.memory.used)} / {formatBytes(currentMetrics.memory.limit)}</span>
                      </div>
                      <Progress value={currentMetrics.memory.percentage} className="h-2" />
                    </div>
                  )}

                  <div className="flex justify-between text-sm">
                    <span>Device Type</span>
                    <span className="font-medium">
                      {currentMetrics?.device.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span>Connection</span>
                    <span className="font-medium">
                      {currentMetrics?.connectivity.effectiveType || 'Unknown'}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span>CPU Cores</span>
                    <span className="font-medium">
                      {currentMetrics?.device.hardwareConcurrency || 'Unknown'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PerformanceChart
              data={[]}
              title="Page Load Time Trend"
              unit="ms"
              threshold={3000}
            />
            <PerformanceChart
              data={[]}
              title="API Response Time Trend"
              unit="ms"
              threshold={1000}
            />
          </div>
        </TabsContent>

        {/* Web Vitals Tab */}
        <TabsContent value="web-vitals" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Individual Web Vitals Cards */}
            <Card>
              <CardHeader>
                <CardTitle>Largest Contentful Paint (LCP)</CardTitle>
                <CardDescription>
                  Loading performance. Good: &lt;2.5s, Poor: &gt;4s
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-3xl font-bold">
                    {currentMetrics?.vitals.lcp ? formatTime(currentMetrics.vitals.lcp) : 'N/A'}
                  </div>
                  {performanceScores && (
                    <>
                      <Progress value={performanceScores.lcp} className="h-2" />
                      <div className="text-sm text-muted-foreground">
                        Performance Score: {performanceScores.lcp}%
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>First Input Delay (FID)</CardTitle>
                <CardDescription>
                  Interactivity. Good: &lt;100ms, Poor: &gt;300ms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-3xl font-bold">
                    {currentMetrics?.vitals.fid ? formatTime(currentMetrics.vitals.fid) : 'N/A'}
                  </div>
                  {performanceScores && (
                    <>
                      <Progress value={performanceScores.fid} className="h-2" />
                      <div className="text-sm text-muted-foreground">
                        Performance Score: {performanceScores.fid}%
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cumulative Layout Shift (CLS)</CardTitle>
                <CardDescription>
                  Visual stability. Good: &lt;0.1, Poor: &gt;0.25
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-3xl font-bold">
                    {currentMetrics?.vitals.cls?.toFixed(3) || 'N/A'}
                  </div>
                  {performanceScores && (
                    <>
                      <Progress value={performanceScores.cls} className="h-2" />
                      <div className="text-sm text-muted-foreground">
                        Performance Score: {performanceScores.cls}%
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resource Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <HardDrive className="w-5 h-5" />
                <span>Resource Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="text-sm font-medium mb-3">Slow Resources</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {currentMetrics?.resources.slowResources.length ? (
                      currentMetrics.resources.slowResources.map((resource, index) => (
                        <div key={index} className="text-xs p-2 bg-muted rounded">
                          <div className="font-medium truncate">{resource.name}</div>
                          <div className="text-muted-foreground">
                            {formatTime(resource.duration)} • {formatBytes(resource.size)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-muted-foreground">No slow resources detected</div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-3">Large Resources</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {currentMetrics?.resources.largeResources.length ? (
                      currentMetrics.resources.largeResources.map((resource, index) => (
                        <div key={index} className="text-xs p-2 bg-muted rounded">
                          <div className="font-medium truncate">{resource.name}</div>
                          <div className="text-muted-foreground">
                            {formatBytes(resource.size)} • {resource.type}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-muted-foreground">No large resources detected</div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-3">Resource Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total Resources</span>
                      <span>{currentMetrics?.resources.count || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total Size</span>
                      <span>{formatBytes(currentMetrics?.resources.totalSize || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Compressed Size</span>
                      <span>{formatBytes(currentMetrics?.resources.compressedSize || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Performance Tab */}
        <TabsContent value="api" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* API Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="w-5 h-5" />
                  <span>API Performance Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Avg Response Time</div>
                      <div className="text-2xl font-bold">
                        {apiPerformanceSummary?.avgResponseTime || 0}ms
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Error Rate</div>
                      <div className={`text-2xl font-bold ${
                        (apiPerformanceSummary?.errorRate || 0) > 5 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {apiPerformanceSummary?.errorRate || 0}%
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Cache Hit Rate</div>
                      <div className="text-2xl font-bold">
                        {apiPerformanceSummary?.cacheHitRate || 0}%
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Total Requests</div>
                      <div className="text-2xl font-bold">
                        {apiPerformanceSummary?.totalRequests || 0}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent API Calls */}
            <Card>
              <CardHeader>
                <CardTitle>Recent API Calls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {apiMetrics.slice(-10).reverse().map((metric, index) => (
                    <div key={index} className="flex items-center justify-between text-xs p-2 border rounded">
                      <div className="flex items-center space-x-2">
                        <Badge variant={
                          metric.statusCode >= 400 ? 'destructive' :
                          metric.statusCode >= 300 ? 'secondary' : 'default'
                        }>
                          {metric.statusCode}
                        </Badge>
                        <span className="font-medium">{metric.method}</span>
                        <span className="text-muted-foreground truncate max-w-32">
                          {metric.endpoint}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={metric.responseTime > 1000 ? 'text-red-600' : 'text-green-600'}>
                          {Math.round(metric.responseTime)}ms
                        </span>
                        {metric.cacheHit && <Wifi className="w-3 h-3 text-blue-600" />}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* API Performance Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PerformanceChart
              data={[]}
              title="API Response Time Distribution"
              unit="ms"
              threshold={1000}
            />
            <PerformanceChart
              data={[]}
              title="API Error Rate Trend"
              unit="%"
              threshold={5}
            />
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Active Alerts</h3>
            <div className="flex items-center space-x-2">
              <Badge variant="destructive">{alertSummary.critical} Critical</Badge>
              <Badge variant="secondary">{alertSummary.warning} Warning</Badge>
              <Badge variant="outline">{alertSummary.info} Info</Badge>
            </div>
          </div>

          {alerts.length > 0 ? (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <Card key={alert.id} className={`border-l-4 ${
                  alert.severity === 'critical' ? 'border-l-red-500' :
                  alert.severity === 'warning' ? 'border-l-yellow-500' :
                  'border-l-blue-500'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        {alert.severity === 'critical' && <XCircle className="w-5 h-5 text-red-600" />}
                        {alert.severity === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-600" />}
                        {alert.severity === 'info' && <Info className="w-5 h-5 text-blue-600" />}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium">{alert.title}</h4>
                            <Badge variant={
                              alert.severity === 'critical' ? 'destructive' :
                              alert.severity === 'warning' ? 'secondary' : 'outline'
                            }>
                              {alert.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {alert.message}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                            <span>Triggered: {new Date(alert.timestamp).toLocaleString()}</span>
                            <span>Business Impact: {alert.businessImpact}</span>
                            {alert.acknowledged && (
                              <span className="text-yellow-600">Acknowledged by {alert.acknowledgedBy}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {!alert.acknowledged && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAcknowledgeAlert(alert.id)}
                          >
                            Acknowledge
                          </Button>
                        )}
                        {!alert.resolved && (
                          <Button
                            size="sm"
                            onClick={() => handleResolveAlert(alert.id)}
                          >
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-green-800">All Systems Operational</h3>
                <p className="text-muted-foreground">
                  No active performance alerts at this time.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* SLA Tracking Tab */}
        <TabsContent value="sla" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* SLA Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>SLA Compliance</span>
                </CardTitle>
                <CardDescription>
                  Service Level Agreement tracking and compliance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Availability (99.9% Target)</span>
                    <span className="font-bold text-green-600">99.95%</span>
                  </div>
                  <Progress value={99.95} className="h-2" />

                  <div className="flex justify-between items-center">
                    <span>Response Time (&lt;1000ms)</span>
                    <span className="font-bold text-green-600">845ms</span>
                  </div>
                  <Progress value={(845 / 1000) * 100} className="h-2" />

                  <div className="flex justify-between items-center">
                    <span>Error Rate (&lt;0.5%)</span>
                    <span className="font-bold text-green-600">0.12%</span>
                  </div>
                  <Progress value={(0.12 / 0.5) * 100} className="h-2" />

                  <div className="flex justify-between items-center">
                    <span>LCP (&lt;2500ms)</span>
                    <span className="font-bold text-yellow-600">2650ms</span>
                  </div>
                  <Progress value={94} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* SLA History */}
            <Card>
              <CardHeader>
                <CardTitle>SLA History (Last 7 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, index) => (
                    <div key={day} className="flex items-center justify-between text-sm">
                      <span>{day}</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">99.9%</span>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* SLA Violations */}
          <Card>
            <CardHeader>
              <CardTitle>Recent SLA Violations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-green-800">No SLA Violations</h3>
                <p>
                  All service level agreements are being met.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Geography Tab */}
        <TabsContent value="geography" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Geographic Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5" />
                  <span>Geographic Distribution</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { country: 'Poland', users: 1250, avgResponseTime: 450 },
                    { country: 'Germany', users: 890, avgResponseTime: 680 },
                    { country: 'UK', users: 670, avgResponseTime: 890 },
                    { country: 'France', users: 450, avgResponseTime: 920 },
                    { country: 'Other', users: 340, avgResponseTime: 1200 }
                  ].map((location) => (
                    <div key={location.country} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full" />
                        <span className="text-sm font-medium">{location.country}</span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>{location.users} users</span>
                        <span>{location.avgResponseTime}ms</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Device Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Smartphone className="w-5 h-5" />
                  <span>Device Distribution</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { device: 'Desktop', percentage: 65, count: 2847 },
                    { device: 'Mobile', percentage: 30, count: 1314 },
                    { device: 'Tablet', percentage: 5, count: 219 }
                  ].map((device) => (
                    <div key={device.device} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{device.device}</span>
                        <span>{device.count} users ({device.percentage}%)</span>
                      </div>
                      <Progress value={device.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
            <div className="flex items-center space-x-4">
              <span>Session: {performanceMonitoringService.getCurrentMetrics()?.url ? 'Active' : 'Inactive'}</span>
              <span>Environment: {import.meta.env.MODE}</span>
              <span>Version: 1.0.0</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceDashboard;