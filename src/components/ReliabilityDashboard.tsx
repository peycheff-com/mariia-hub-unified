import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Clock,
  Server,
  Database,
  CreditCard,
  Calendar,
  RefreshCw,
  Download,
  AlertOctagon,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DashboardData {
  timestamp: string;
  health: {
    score: number;
    status: 'healthy' | 'degraded' | 'unhealthy';
    trend: 'improving' | 'stable' | 'degrading';
    components: Record<string, number>;
  };
  dependencies: {
    total: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
  };
  alerts: {
    active: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  slos: {
    total: number;
    healthy: number;
    warning: number;
    burning: number;
    exhausted: number;
  };
  audit: {
    totalEvents: number;
    failureRate: number;
  };
  recovery: {
    totalAttempts: number;
    successRate: number;
  };
}

export function ReliabilityDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/reliability/dashboard');
      const dashboardData = await response.json();
      setData(dashboardData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    if (autoRefresh) {
      const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'unhealthy':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Minus className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'degrading':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reliability Dashboard</h1>
          <p className="text-muted-foreground">
            Last updated: {new Date(data.timestamp).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            Auto-refresh: {autoRefresh ? 'On' : 'Off'}
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Health */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Health</CardTitle>
            <div className="flex items-center gap-1">
              {getHealthIcon(data.health.status)}
              {getTrendIcon(data.health.trend)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.health.score}%</div>
            <Progress value={data.health.score} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2 capitalize">
              {data.health.status} • {data.health.trend}
            </p>
          </CardContent>
        </Card>

        {/* Dependencies */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dependencies</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.dependencies.total}</div>
            <div className="space-y-1 mt-2">
              <div className="flex justify-between text-xs">
                <span className="text-green-600">Healthy: {data.dependencies.healthy}</span>
                <span className="text-yellow-600">Degraded: {data.dependencies.degraded}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-red-600">Unhealthy: {data.dependencies.unhealthy}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertOctagon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.alerts.active}</div>
            <div className="flex gap-1 mt-2">
              {data.alerts.critical > 0 && (
                <Badge variant="destructive">{data.alerts.critical} Critical</Badge>
              )}
              {data.alerts.high > 0 && (
                <Badge variant="destructive" className="bg-orange-500">
                  {data.alerts.high} High
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* SLO Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SLO Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.slos.healthy}/{data.slos.total}</div>
            <Progress value={(data.slos.healthy / data.slos.total) * 100} className="mt-2" />
            {data.slos.burning > 0 && (
              <p className="text-xs text-red-600 mt-2">
                {data.slos.burning} SLOs burning
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="dependencies" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="slos">SLOs</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
          <TabsTrigger value="recovery">Recovery</TabsTrigger>
        </TabsList>

        {/* Dependencies Tab */}
        <TabsContent value="dependencies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>External Dependencies Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(data.health.components).map(([name, score]) => {
                  if (name.startsWith('dep_')) {
                    const depName = name.replace('dep_', '');
                    const status = score >= 90 ? 'healthy' : score >= 70 ? 'degraded' : 'unhealthy';
                    return (
                      <div key={name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getHealthIcon(status)}
                          <span className="font-medium capitalize">{depName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">{score}%</span>
                          <Progress value={score} className="w-24" />
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Alert Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.alerts.critical > 0 && (
                    <div className="flex justify-between">
                      <span>Critical</span>
                      <Badge variant="destructive">{data.alerts.critical}</Badge>
                    </div>
                  )}
                  {data.alerts.high > 0 && (
                    <div className="flex justify-between">
                      <span>High</span>
                      <Badge variant="destructive" className="bg-orange-500">
                        {data.alerts.high}
                      </Badge>
                    </div>
                  )}
                  {data.alerts.medium > 0 && (
                    <div className="flex justify-between">
                      <span>Medium</span>
                      <Badge variant="secondary">{data.alerts.medium}</Badge>
                    </div>
                  )}
                  {data.alerts.low > 0 && (
                    <div className="flex justify-between">
                      <span>Low</span>
                      <Badge variant="outline">{data.alerts.low}</Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Response Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>MTTR (Mean Time to Resolve)</span>
                    <span className="font-medium">
                      {data.recovery.totalAttempts > 0 ? 'N/A' : 'N/A min'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Failure Rate</span>
                    <span className="font-medium">{data.audit.failureRate.toFixed(2)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* SLOs Tab */}
        <TabsContent value="slos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Service Level Objectives</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{data.slos.healthy}</div>
                  <div className="text-sm text-muted-foreground">Healthy</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{data.slos.warning}</div>
                  <div className="text-sm text-muted-foreground">Warning</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{data.slos.burning}</div>
                  <div className="text-sm text-muted-foreground">Burning</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{data.slos.exhausted}</div>
                  <div className="text-sm text-muted-foreground">Exhausted</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Tab */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Events (24h)</span>
                    <span className="font-medium">{data.audit.totalEvents}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Failure Rate</span>
                    <span className="font-medium">{data.audit.failureRate.toFixed(2)}%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Export Audit Logs
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Calendar className="h-4 w-4 mr-2" />
                    Compliance Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recovery Tab */}
        <TabsContent value="recovery" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automated Recovery</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Total Recovery Attempts</span>
                  <span className="font-medium">{data.recovery.totalAttempts}</span>
                </div>
                <div className="flex justify-between">
                  <span>Success Rate</span>
                  <span className="font-medium">{data.recovery.successRate.toFixed(1)}%</span>
                </div>
                <Button className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Run Recovery Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}