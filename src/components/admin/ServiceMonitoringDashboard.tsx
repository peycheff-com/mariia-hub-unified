/**
 * Service Monitoring Dashboard
 *
 * Real-time monitoring dashboard for all third-party service integrations
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  AlertTriangle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Zap,
  Database,
  MessageSquare,
  CreditCard,
  Mail,
  Bot
} from 'lucide-react';

// Types
interface ServiceHealth {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  responseTime: number;
  lastChecked: Date;
  errorMessage?: string;
  uptime: number;
  consecutiveFailures: number;
}

interface ServiceMetrics {
  service: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  requestsPerMinute: number;
  errorRate: number;
  lastHourRequests: number;
}

interface Alert {
  id: string;
  service: string;
  type: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: Date;
}

const COLORS = {
  healthy: '#10b981',
  degraded: '#f59e0b',
  unhealthy: '#ef4444',
  unknown: '#6b7280'
};

const SERVICE_ICONS = {
  stripe: CreditCard,
  booksy: Calendar,
  whatsapp: MessageSquare,
  resend: Mail,
  supabase: Database,
  openai: Bot,
  anthropic: Bot
};

export default function ServiceMonitoringDashboard() {
  const [healthData, setHealthData] = useState<ServiceHealth[]>([]);
  const [metrics, setMetrics] = useState<ServiceMetrics[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Fetch data
  useEffect(() => {
    fetchMonitoringData();

    if (autoRefresh) {
      const interval = setInterval(fetchMonitoringData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchMonitoringData = async () => {
    try {
      // Fetch health data
      const healthResponse = await fetch('/api/admin/service-health');
      const health = await healthResponse.json();
      setHealthData(health);

      // Fetch metrics
      const metricsResponse = await fetch('/api/admin/service-metrics');
      const metricsData = await metricsResponse.json();
      setMetrics(metricsData);

      // Fetch recent alerts
      const alertsResponse = await fetch('/api/admin/service-alerts?limit=10');
      const alertsData = await alertsResponse.json();
      setAlerts(alertsData);

      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'unhealthy':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getOverallHealth = () => {
    if (healthData.length === 0) return 'unknown';
    const unhealthyCount = healthData.filter(h => h.status === 'unhealthy').length;
    const degradedCount = healthData.filter(h => h.status === 'degraded').length;

    if (unhealthyCount > 0) return 'unhealthy';
    if (degradedCount > 0) return 'degraded';
    return 'healthy';
  };

  const getServiceIcon = (service: string) => {
    const Icon = SERVICE_ICONS[service as keyof typeof SERVICE_ICONS] || Activity;
    return <Icon className="h-5 w-5" />;
  };

  const chartData = healthData.map(service => ({
    name: service.service,
    responseTime: service.responseTime,
    uptime: service.uptime,
    status: service.status
  }));

  const pieData = healthData.reduce((acc, service) => {
    const status = service.status;
    const existing = acc.find(item => item.name === status);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: status, value: 1 });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Service Monitoring</h1>
          <p className="text-muted-foreground">
            Real-time monitoring of all third-party integrations
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh: {autoRefresh ? 'On' : 'Off'}
          </Button>
          <Button onClick={fetchMonitoringData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Now
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {getStatusIcon(getOverallHealth())}
            <span>Overall System Health</span>
            <Badge variant="outline" className="ml-auto">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {healthData.filter(h => h.status === 'healthy').length}
              </div>
              <div className="text-sm text-muted-foreground">Healthy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {healthData.filter(h => h.status === 'degraded').length}
              </div>
              <div className="text-sm text-muted-foreground">Degraded</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {healthData.filter(h => h.status === 'unhealthy').length}
              </div>
              <div className="text-sm text-muted-foreground">Unhealthy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {healthData.length > 0
                  ? Math.round(
                      healthData.reduce((sum, h) => sum + h.uptime, 0) / healthData.length
                    )
                  : 0}%
              </div>
              <div className="text-sm text-muted-foreground">Avg Uptime</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5" />
              <span>Recent Alerts</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.slice(0, 3).map((alert) => (
                <Alert
                  key={alert.id}
                  variant={alert.severity === 'critical' ? 'destructive' : 'default'}
                >
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle className="flex items-center justify-between">
                    <span>{alert.service}: {alert.type}</span>
                    <Badge variant="outline">{alert.severity}</Badge>
                  </AlertTitle>
                  <AlertDescription>{alert.message}</AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Response Time Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Response Times</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="responseTime" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Service Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle>Service Status</CardTitle>
            </CardHeader>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Response Time</TableHead>
                  <TableHead>Uptime (24h)</TableHead>
                  <TableHead>Last Check</TableHead>
                  <TableHead>Failures</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {healthData.map((service) => (
                  <TableRow
                    key={service.service}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedService(service.service)}
                  >
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getServiceIcon(service.service)}
                        <span className="font-medium">{service.service}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(service.status)}
                        <Badge variant="outline" className={
                          service.status === 'healthy' ? 'border-green-500 text-green-700' :
                          service.status === 'degraded' ? 'border-yellow-500 text-yellow-700' :
                          'border-red-500 text-red-700'
                        }>
                          {service.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span>{service.responseTime}ms</span>
                        {service.responseTime > 1000 && (
                          <TrendingUp className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Progress value={service.uptime} className="w-16" />
                        <span className="text-sm">{service.uptime.toFixed(1)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{new Date(service.lastChecked).toLocaleTimeString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {service.consecutiveFailures > 0 && (
                        <Badge variant="destructive">
                          {service.consecutiveFailures}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle manual health check
                        }}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.map((metric) => (
              <Card key={metric.service}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-base">
                    <div className="flex items-center space-x-2">
                      {getServiceIcon(metric.service)}
                      <span>{metric.service}</span>
                    </div>
                    <Badge variant="outline">
                      {metric.requestsPerMinute.toFixed(1)}/min
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total Requests</span>
                      <span className="font-medium">{metric.totalRequests}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Success Rate</span>
                      <span className="font-medium text-green-600">
                        {(100 - metric.errorRate).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Avg Response</span>
                      <span className="font-medium">{metric.averageResponseTime}ms</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Last Hour</span>
                      <span className="font-medium">{metric.lastHourRequests}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 font-mono text-sm">
                {/* Log entries would be displayed here */}
                <div className="text-muted-foreground">
                  [2024-02-08 10:30:45] INFO: Stripe health check passed (125ms)
                </div>
                <div className="text-yellow-600">
                  [2024-02-08 10:29:30] WARN: Booksy API response time elevated (2500ms)
                </div>
                <div className="text-green-600">
                  [2024-02-08 10:28:15] INFO: WhatsApp service recovered
                </div>
                <div className="text-red-600">
                  [2024-02-08 10:27:00] ERROR: Supabase connection timeout
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}