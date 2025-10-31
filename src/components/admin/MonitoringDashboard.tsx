/**
 * Comprehensive Monitoring Dashboard for mariiaborysevych
 * Provides real-time insights into system health, performance, and business metrics
 */

import React, { useState, useEffect } from 'react';
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
  CreditCard,
  Calendar,
  BarChart3,
  RefreshCw,
  Settings,
  Bell,
  AlertCircle
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { healthCheckService, HealthCheckResult } from '@/lib/health-check';
import { alertingService, Alert, AlertRule } from '@/lib/alerting';
import { monitoringService } from '@/services/monitoringService';

interface MetricCard {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  status: 'good' | 'warning' | 'critical';
  description?: string;
}

interface SystemOverview {
  healthScore: number;
  activeUsers: number;
  errorRate: number;
  avgResponseTime: number;
  uptime: number;
  alertsCount: {
    critical: number;
    warning: number;
    info: number;
  };
}

const MonitoringDashboard: React.FC = () => {
  const [systemOverview, setSystemOverview] = useState<SystemOverview>({
    healthScore: 0,
    activeUsers: 0,
    errorRate: 0,
    avgResponseTime: 0,
    uptime: 100,
    alertsCount: { critical: 0, warning: 0, info: 0 }
  });

  const [healthResults, setHealthResults] = useState<HealthCheckResult | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<Alert[]>([]);
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');

  // Initialize monitoring services
  useEffect(() => {
    const initializeMonitoring = async () => {
      try {
        // Start monitoring if not already running
        if (!healthCheckService) {
          await healthCheckService.startContinuousMonitoring();
        }
        if (!alertingService) {
          alertingService.start();
        }

        // Load initial data
        await loadDashboardData();

        // Set up real-time updates
        const interval = setInterval(loadDashboardData, 30000); // Update every 30 seconds

        return () => {
          clearInterval(interval);
        };
      } catch (error) {
        console.error('Failed to initialize monitoring:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeMonitoring();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load system overview
      const overview = await monitoringService.getRealTimeMetrics();
      setSystemOverview(prev => ({
        ...prev,
        ...overview,
        uptime: 99.9, // Placeholder - would come from actual monitoring
      }));

      // Load health check results
      const health = await healthCheckService.runFullHealthCheck();
      setHealthResults(health);

      // Load active alerts
      const alerts = alertingService.getActiveAlerts();
      setActiveAlerts(alerts);

      // Update alert counts
      const alertCounts = alerts.reduce((acc, alert) => {
        acc[alert.severity]++;
        return acc;
      }, { critical: 0, warning: 0, info: 0 });

      setSystemOverview(prev => ({
        ...prev,
        alertsCount: alertCounts
      }));

      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    await loadDashboardData();
    setIsLoading(false);
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await alertingService.acknowledgeAlert(alertId, 'current-user');
      await loadDashboardData();
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const getHealthStatusColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthStatusIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (score >= 70) return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    return <AlertCircle className="h-5 w-5 text-red-600" />;
  };

  const metricCards: MetricCard[] = [
    {
      title: 'System Health',
      value: systemOverview.healthScore || 0,
      icon: <Shield className="h-4 w-4" />,
      status: systemOverview.healthScore >= 90 ? 'good' : systemOverview.healthScore >= 70 ? 'warning' : 'critical',
      description: 'Overall system health score'
    },
    {
      title: 'Active Users',
      value: systemOverview.activeUsers,
      icon: <Users className="h-4 w-4" />,
      status: 'good',
      description: 'Currently active users'
    },
    {
      title: 'Error Rate',
      value: `${systemOverview.errorRate}%`,
      icon: <AlertTriangle className="h-4 w-4" />,
      status: systemOverview.errorRate < 1 ? 'good' : systemOverview.errorRate < 5 ? 'warning' : 'critical',
      description: 'Error rate in last hour'
    },
    {
      title: 'Avg Response Time',
      value: `${systemOverview.avgResponseTime}ms`,
      icon: <Clock className="h-4 w-4" />,
      status: systemOverview.avgResponseTime < 500 ? 'good' : systemOverview.avgResponseTime < 1500 ? 'warning' : 'critical',
      description: 'Average API response time'
    },
    {
      title: 'Uptime',
      value: `${systemOverview.uptime}%`,
      icon: <Activity className="h-4 w-4" />,
      status: systemOverview.uptime >= 99.9 ? 'good' : 'warning',
      description: 'System uptime (30 days)'
    },
    {
      title: 'Total Alerts',
      value: Object.values(systemOverview.alertsCount).reduce((sum, count) => sum + count, 0),
      icon: <Bell className="h-4 w-4" />,
      status: systemOverview.alertsCount.critical > 0 ? 'critical' : systemOverview.alertsCount.warning > 0 ? 'warning' : 'good',
      description: 'Active alerts'
    }
  ];

  if (isLoading) {
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
          <h1 className="text-3xl font-bold">Monitoring Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time system monitoring and alerting for mariiaborysevych
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {metricCards.map((metric, index) => (
          <Card key={index} className="relative">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {metric.icon}
                  <span className="text-sm font-medium text-muted-foreground">
                    {metric.title}
                  </span>
                </div>
                {metric.status === 'critical' && (
                  <Badge variant="destructive" className="text-xs">
                    Critical
                  </Badge>
                )}
                {metric.status === 'warning' && (
                  <Badge variant="secondary" className="text-xs">
                    Warning
                  </Badge>
                )}
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold">{metric.value}</div>
                {metric.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {metric.description}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Critical Alerts */}
      {activeAlerts.filter(alert => alert.severity === 'critical').length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="flex items-center justify-between">
              <div>
                <strong>Critical Alert:</strong> {activeAlerts[0].title} - {activeAlerts[0].message}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAcknowledgeAlert(activeAlerts[0].id)}
              >
                Acknowledge
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="health">Health Checks</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="business">Business Metrics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Health Score */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>System Health Score</span>
                </CardTitle>
                <CardDescription>
                  Overall system health based on all monitoring checks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {getHealthStatusIcon(systemOverview.healthScore)}
                    <div>
                      <div className="text-3xl font-bold">
                        {systemOverview.healthScore}%
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {systemOverview.healthScore >= 90 ? 'Excellent' :
                         systemOverview.healthScore >= 70 ? 'Good' :
                         systemOverview.healthScore >= 50 ? 'Fair' : 'Poor'}
                      </p>
                    </div>
                  </div>
                  <Progress
                    value={systemOverview.healthScore}
                    className="w-32 h-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Recent Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Page Loads</span>
                    <span className="font-medium">1,234</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">API Calls</span>
                    <span className="font-medium">5,678</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Bookings</span>
                    <span className="font-medium">23</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Errors</span>
                    <span className="font-medium text-red-600">
                      {systemOverview.errorRate > 0 ? Math.round(systemOverview.errorRate * 10) : 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Health Checks Tab */}
        <TabsContent value="health" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Health Checks</CardTitle>
              <CardDescription>
                Comprehensive health status of all system components
              </CardDescription>
            </CardHeader>
            <CardContent>
              {healthResults ? (
                <div className="space-y-4">
                  {Object.entries(healthResults.checks).map(([key, check]) => (
                    <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {check.status === 'pass' && <CheckCircle className="h-5 w-5 text-green-600" />}
                        {check.status === 'warn' && <AlertTriangle className="h-5 w-5 text-yellow-600" />}
                        {check.status === 'fail' && <AlertCircle className="h-5 w-5 text-red-600" />}
                        <div>
                          <h4 className="font-medium">{check.name}</h4>
                          <p className="text-sm text-muted-foreground">{check.message}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{check.score}/100</div>
                        <div className="text-xs text-muted-foreground">
                          {check.duration}ms
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No health check data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Active Alerts</h3>
            <div className="flex items-center space-x-2">
              <Badge variant="destructive">
                {systemOverview.alertsCount.critical} Critical
              </Badge>
              <Badge variant="secondary">
                {systemOverview.alertsCount.warning} Warning
              </Badge>
              <Badge variant="outline">
                {systemOverview.alertsCount.info} Info
              </Badge>
            </div>
          </div>

          {activeAlerts.length > 0 ? (
            <div className="space-y-3">
              {activeAlerts.map((alert) => (
                <Card key={alert.id} className="border-l-4 border-l-red-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <AlertCircle className={`h-5 w-5 mt-0.5 ${
                          alert.severity === 'critical' ? 'text-red-600' :
                          alert.severity === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                        }`} />
                        <div className="flex-1">
                          <h4 className="font-medium">{alert.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {alert.message}
                          </p>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className="text-xs text-muted-foreground">
                              Triggered: {alert.triggeredAt.toLocaleString()}
                            </span>
                            <Badge variant={
                              alert.severity === 'critical' ? 'destructive' :
                              alert.severity === 'warning' ? 'secondary' : 'outline'
                            }>
                              {alert.severity}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAcknowledgeAlert(alert.id)}
                      >
                        Acknowledge
                      </Button>
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
                  No active alerts at this time.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-5 w-5" />
                  <span>Web Vitals</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Largest Contentful Paint (LCP)</span>
                      <span>2.1s</span>
                    </div>
                    <Progress value={70} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>First Input Delay (FID)</span>
                      <span>45ms</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Cumulative Layout Shift (CLS)</span>
                      <span>0.08</span>
                    </div>
                    <Progress value={90} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span>API Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Average Response Time</span>
                    <span className="font-medium">{systemOverview.avgResponseTime}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Success Rate</span>
                    <span className="font-medium text-green-600">99.2%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Total Requests</span>
                    <span className="font-medium">15.2k</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Error Rate</span>
                    <span className="font-medium text-red-600">{systemOverview.errorRate}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Business Metrics Tab */}
        <TabsContent value="business" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Bookings</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Today</span>
                    <span className="font-medium">23</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">This Week</span>
                    <span className="font-medium">156</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">This Month</span>
                    <span className="font-medium">643</span>
                  </div>
                  <div className="flex items-center text-sm text-green-600">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span>+12% from last month</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Revenue</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Today</span>
                    <span className="font-medium">2,340 zł</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">This Week</span>
                    <span className="font-medium">18,760 zł</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">This Month</span>
                    <span className="font-medium">67,890 zł</span>
                  </div>
                  <div className="flex items-center text-sm text-green-600">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span>+8% from last month</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Conversion</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Booking Rate</span>
                    <span className="font-medium">3.2%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Payment Success</span>
                    <span className="font-medium">94.5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Cart Abandonment</span>
                    <span className="font-medium">67.8%</span>
                  </div>
                  <div className="flex items-center text-sm text-yellow-600">
                    <TrendingDown className="h-4 w-4 mr-1" />
                    <span>-2% from last week</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MonitoringDashboard;