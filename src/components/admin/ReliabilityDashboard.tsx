import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  reliabilityManager,
  performanceMonitor,
  recoveryAutomation,
  circuitBreakerRegistry,
  Priority
} from '@/lib/reliability';
import {
  SystemStatus,
  PerformanceMetrics,
  RecoveryExecution
} from '@/lib/reliability';
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  Server,
  Database,
  Wifi,
  HardDrive,
  RefreshCw,
  AlertTriangle,
  Power,
  Settings
} from 'lucide-react';

interface ReliabilityDashboardProps {
  className?: string;
}

export const ReliabilityDashboard: React.FC<ReliabilityDashboardProps> = ({ className }) => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [currentMetrics, setCurrentMetrics] = useState<PerformanceMetrics | null>(null);
  const [metricsHistory, setMetricsHistory] = useState<PerformanceMetrics[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [recentErrors, setRecentErrors] = useState<any[]>([]);
  const [recoveryExecutions, setRecoveryExecutions] = useState<RecoveryExecution[]>([]);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Get system status
        const status = reliabilityManager.getSystemStatus();
        setSystemStatus(status);

        // Get current metrics
        const metrics = performanceMonitor.getCurrentMetrics();
        setCurrentMetrics(metrics);

        // Get metrics history (last hour)
        const history = performanceMonitor.getMetricsHistory(60 * 60 * 1000);
        setMetricsHistory(history);

        // Get alerts
        const healthAlerts = reliabilityManager.getHealthStatus().then(h => h.checks || []);
        const perfAlerts = performanceMonitor.getAlerts('open');
        setActiveAlerts([...(await healthAlerts), ...perfAlerts]);

        // Get recent errors
        const errors = reliabilityManager.getRecentErrors(10);
        setRecentErrors(errors);

        // Get recovery executions
        const executions = recoveryAutomation.getExecutions();
        setRecoveryExecutions(executions);

        setLastUpdate(new Date());
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchDashboardData();

    let interval: NodeJS.Timeout;
    if (isAutoRefresh) {
      interval = setInterval(fetchDashboardData, 5000); // Refresh every 5 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAutoRefresh]);

  const handleManualRecovery = async () => {
    try {
      await reliabilityManager.attemptRecovery();
      console.log('Manual recovery initiated');
    } catch (error) {
      console.error('Error initiating recovery:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'degraded':
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'unhealthy':
      case 'failed':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const formatBytes = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  if (!systemStatus || !currentMetrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Reliability Dashboard</h2>
          <p className="text-sm text-gray-500">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
          >
            {isAutoRefresh ? (
              <>
                <Activity className="h-4 w-4 mr-2" />
                Auto Refresh: ON
              </>
            ) : (
              <>
                <Clock className="h-4 w-4 mr-2" />
                Auto Refresh: OFF
              </>
            )}
          </Button>
          <Button onClick={handleManualRecovery}>
            <Power className="h-4 w-4 mr-2" />
            Manual Recovery
          </Button>
        </div>
      </div>

      {/* Overall Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`text-3xl font-bold ${getScoreColor(systemStatus.score)}`}>
                {systemStatus.score.toFixed(0)}%
              </div>
              <div className="text-sm text-gray-500">Health Score</div>
              <Badge className={getStatusColor(systemStatus.overall)}>
                {systemStatus.overall.toUpperCase()}
              </Badge>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {systemStatus.components.circuitBreakers.healthy}
              </div>
              <div className="text-sm text-gray-500">Healthy Services</div>
              <div className="text-xs text-gray-400">
                of {systemStatus.components.circuitBreakers.total} total
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {systemStatus.components.retries.successRate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500">Success Rate</div>
              <div className="text-xs text-gray-400">
                {systemStatus.components.retries.failed} failures
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {systemStatus.components.requestQueues.pending}
              </div>
              <div className="text-sm text-gray-500">Queue Length</div>
              <div className="text-xs text-gray-400">
                {systemStatus.components.requestQueues.processing} processing
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Charts */}
      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="recovery">Recovery</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Response Time Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Response Time (ms)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={metricsHistory.slice(-20)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                    />
                    <Line
                      type="monotone"
                      dataKey="latency.p95"
                      stroke="#8884d8"
                      strokeWidth={2}
                      dot={false}
                      name="P95"
                    />
                    <Line
                      type="monotone"
                      dataKey="latency.p50"
                      stroke="#82ca9d"
                      strokeWidth={1}
                      dot={false}
                      name="P50"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Throughput Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Throughput (req/s)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={metricsHistory.slice(-20)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                    />
                    <Area
                      type="monotone"
                      dataKey="throughput"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Error Rate */}
            <Card>
              <CardHeader>
                <CardTitle>Error Rate (%)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Current Error Rate</span>
                    <span className={`text-2xl font-bold ${
                      currentMetrics.errorRate > 5 ? 'text-red-600' :
                      currentMetrics.errorRate > 1 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {currentMetrics.errorRate.toFixed(2)}%
                    </span>
                  </div>
                  <Progress
                    value={Math.min(currentMetrics.errorRate * 10, 100)}
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Recent Errors */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Errors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {recentErrors.length === 0 ? (
                    <p className="text-sm text-gray-500">No recent errors</p>
                  ) : (
                    recentErrors.map((error, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 p-2 bg-gray-50 rounded"
                      {
                        /* @ts-ignore */
                      }>
                        <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                        <div className="flex-1">
                          <div className="text-sm font-medium">
                            {error.classification?.category}
                          </div>
                          <div className="text-xs text-gray-500">
                            {error.error.message.substring(0, 100)}...
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(error.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Memory Usage */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  Memory Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${
                      currentMetrics.memory.percentage > 90 ? 'text-red-600' :
                      currentMetrics.memory.percentage > 70 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {currentMetrics.memory.percentage.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatBytes(currentMetrics.memory.used)} / {formatBytes(currentMetrics.memory.total)}
                    </div>
                  </div>
                  <Progress value={currentMetrics.memory.percentage} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Database Connections */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Connections</span>
                    <span className="font-mono">{currentMetrics.dbConnections}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Avg Query Time</span>
                    <span className="font-mono">{currentMetrics.dbQueryTime.toFixed(1)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Slow Queries</span>
                    <span className="font-mono text-red-600">{currentMetrics.dbSlowQueries}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cache Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Cache
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Hit Rate</span>
                    <span className={`font-mono ${
                      currentMetrics.cacheHitRate > 80 ? 'text-green-600' :
                      currentMetrics.cacheHitRate > 50 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {currentMetrics.cacheHitRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Size</span>
                    <span className="font-mono">{formatBytes(currentMetrics.cacheSize)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recovery" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recovery Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recoveryExecutions.length === 0 ? (
                  <p className="text-sm text-gray-500">No recovery actions executed</p>
                ) : (
                  recoveryExecutions.slice(-10).reverse().map((execution) => (
                    <div
                      key={execution.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded"
                    >
                      <div>
                        <div className="font-medium">{execution.actionId}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(execution.startTime).toLocaleString()}
                        </div>
                      </div>
                      <Badge className={getStatusColor(execution.status)}>
                        {execution.status.toUpperCase()}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Active Alerts ({activeAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activeAlerts.map((alert, idx) => (
                <Alert key={idx} severity={alert.severity === 'critical' ? 'destructive' : 'default'}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium">{alert.message}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(alert.timestamp).toLocaleString()}
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};