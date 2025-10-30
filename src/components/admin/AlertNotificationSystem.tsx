import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Bar
} from 'recharts';
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  Clock,
  Settings,
  Filter,
  Download,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  MessageSquare,
  Phone,
  Mail,
  Zap,
  Target,
  Eye,
  Calendar,
  UserCheck,
  Volume2,
  Wifi,
  WifiOff,
  AlertOctagon,
  Info,
  X
} from 'lucide-react';
import { supportAnalyticsServiceEnhanced } from '@/services/support-analytics-enhanced.service';

interface PerformanceAlert {
  id: string;
  alertType: string;
  alertSeverity: 'low' | 'medium' | 'high' | 'critical';
  alertTitle: string;
  alertDescription: string;
  currentValue: number;
  thresholdValue: number;
  variancePercentage: number;
  affectedAgents: string[];
  affectedTimePeriod: string;
  metricCategory: string;
  alertStatus: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
  assignedTo?: string;
  resolutionNotes?: string;
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
}

interface AlertRule {
  id: string;
  name: string;
  description: string;
  metric: string;
  condition: 'greater_than' | 'less_than' | 'equals' | 'not_equals';
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  notification aria-live="polite" aria-atomic="true"Channels: string[];
  cooldownPeriod: number;
  lastTriggered?: string;
  triggerCount: number;
}

interface NotificationChannel {
  id: string;
  name: string;
  type: 'email' | 'slack' | 'sms' | 'webhook' | 'in_app';
  enabled: boolean;
  configuration: Record<string, any>;
  testStatus: 'success' | 'failure' | 'not_tested';
  lastTest?: string;
}

interface AlertMetrics {
  totalAlerts: number;
  activeAlerts: number;
  criticalAlerts: number;
  resolvedToday: number;
  avgResolutionTime: number;
  escalatedAlerts: number;
  falsePositives: number;
}

const AlertNotificationSystem: React.FC = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [notification aria-live="polite" aria-atomic="true"Channels, setNotificationChannels] = useState<NotificationChannel[]>([]);
  const [alertMetrics, setAlertMetrics] = useState<AlertMetrics | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mock data - in real app this would come from the analytics service
  const mockAlerts: PerformanceAlert[] = [
    {
      id: '1',
      alertType: 'sla_breach',
      alertSeverity: 'critical',
      alertTitle: 'SLA Compliance Critical Breach',
      alertDescription: 'SLA compliance has dropped to 75%, well below the 90% target threshold.',
      currentValue: 75,
      thresholdValue: 90,
      variancePercentage: -16.7,
      affectedAgents: ['agent_1', 'agent_2'],
      affectedTimePeriod: '09:00-10:00',
      metricCategory: 'sla',
      alertStatus: 'active',
      assignedTo: 'manager_1',
      createdAt: '2024-01-15T09:30:00Z'
    },
    {
      id: '2',
      alertType: 'response_time',
      alertSeverity: 'high',
      alertTitle: 'Response Time Degradation',
      alertDescription: 'Average response time has increased to 45 minutes, exceeding the 30-minute target.',
      currentValue: 45,
      thresholdValue: 30,
      variancePercentage: 50,
      affectedAgents: ['agent_3'],
      affectedTimePeriod: '10:00-11:00',
      metricCategory: 'response_time',
      alertStatus: 'acknowledged',
      assignedTo: 'supervisor_1',
      acknowledgedAt: '2024-01-15T10:15:00Z',
      createdAt: '2024-01-15T10:00:00Z'
    },
    {
      id: '3',
      alertType: 'volume_spike',
      alertSeverity: 'medium',
      alertTitle: 'Unusual Volume Spike Detected',
      alertDescription: 'Ticket volume is 80% above normal for this time period.',
      currentValue: 72,
      thresholdValue: 40,
      variancePercentage: 80,
      affectedAgents: [],
      affectedTimePeriod: '11:00-12:00',
      metricCategory: 'volume',
      alertStatus: 'resolved',
      resolutionNotes: 'Additional agents deployed to handle volume spike',
      resolvedAt: '2024-01-15T12:30:00Z',
      createdAt: '2024-01-15T11:00:00Z'
    },
    {
      id: '4',
      alertType: 'satisfaction',
      alertSeverity: 'medium',
      alertTitle: 'Customer Satisfaction Decline',
      alertDescription: 'Customer satisfaction score has dropped to 3.8, below the 4.0 target.',
      currentValue: 3.8,
      thresholdValue: 4.0,
      variancePercentage: -5,
      affectedAgents: ['agent_2', 'agent_4'],
      affectedTimePeriod: '13:00-14:00',
      metricCategory: 'satisfaction',
      alertStatus: 'active',
      createdAt: '2024-01-15T13:30:00Z'
    },
    {
      id: '5',
      alertType: 'agent_performance',
      alertSeverity: 'low',
      alertTitle: 'Agent Performance Variance',
      alertDescription: 'Agent resolution rate has dropped below the 85% threshold.',
      currentValue: 82,
      thresholdValue: 85,
      variancePercentage: -3.5,
      affectedAgents: ['agent_5'],
      affectedTimePeriod: '14:00-15:00',
      metricCategory: 'performance',
      alertStatus: 'acknowledged',
      assignedTo: 'team_lead_1',
      acknowledgedAt: '2024-01-15T14:45:00Z',
      createdAt: '2024-01-15T14:00:00Z'
    }
  ];

  const mockAlertRules: AlertRule[] = [
    {
      id: '1',
      name: 'SLA Compliance Monitor',
      description: 'Alert when SLA compliance drops below 90%',
      metric: 'sla_compliance_rate',
      condition: 'less_than',
      threshold: 90,
      severity: 'critical',
      enabled: true,
      notification aria-live="polite" aria-atomic="true"Channels: ['email', 'slack', 'sms'],
      cooldownPeriod: 300,
      triggerCount: 12,
      lastTriggered: '2024-01-15T09:30:00Z'
    },
    {
      id: '2',
      name: 'Response Time Alert',
      description: 'Alert when average response time exceeds 30 minutes',
      metric: 'avg_response_time',
      condition: 'greater_than',
      threshold: 30,
      severity: 'high',
      enabled: true,
      notification aria-live="polite" aria-atomic="true"Channels: ['email', 'slack'],
      cooldownPeriod: 600,
      triggerCount: 8,
      lastTriggered: '2024-01-15T10:00:00Z'
    },
    {
      id: '3',
      name: 'Volume Spike Detection',
      description: 'Alert when ticket volume exceeds normal by 50%',
      metric: 'ticket_volume',
      condition: 'greater_than',
      threshold: 50,
      severity: 'medium',
      enabled: true,
      notification aria-live="polite" aria-atomic="true"Channels: ['slack', 'in_app'],
      cooldownPeriod: 900,
      triggerCount: 3,
      lastTriggered: '2024-01-15T11:00:00Z'
    }
  ];

  const mockNotificationChannels: NotificationChannel[] = [
    {
      id: '1',
      name: 'Support Team Email',
      type: 'email',
      enabled: true,
      configuration: {
        recipients: ['support-team@company.com', 'manager@company.com'],
        template: 'standard_alert'
      },
      testStatus: 'success',
      lastTest: '2024-01-15T08:00:00Z'
    },
    {
      id: '2',
      name: 'Slack #alerts',
      type: 'slack',
      enabled: true,
      configuration: {
        webhook: 'https://hooks.slack.com/services/...',
        channel: '#alerts'
      },
      testStatus: 'success',
      lastTest: '2024-01-14T16:30:00Z'
    },
    {
      id: '3',
      name: 'Manager SMS',
      type: 'sms',
      enabled: true,
      configuration: {
        numbers: ['+1234567890'],
        provider: 'twilio'
      },
      testStatus: 'success',
      lastTest: '2024-01-15T09:00:00Z'
    },
    {
      id: '4',
      name: 'Webhook Integration',
      type: 'webhook',
      enabled: false,
      configuration: {
        url: 'https://api.company.com/alerts',
        method: 'POST',
        headers: {}
      },
      testStatus: 'not_tested'
    }
  ];

  const mockAlertMetrics: AlertMetrics = {
    totalAlerts: 47,
    activeAlerts: 3,
    criticalAlerts: 1,
    resolvedToday: 8,
    avgResolutionTime: 45,
    escalatedAlerts: 2,
    falsePositives: 3
  };

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setAlerts(mockAlerts);
      setAlertRules(mockAlertRules);
      setNotificationChannels(mockNotificationChannels);
      setAlertMetrics(mockAlertMetrics);
      setIsLoading(false);
    }, 1000);
  }, [selectedTimeRange]);

  const refreshAlerts = async () => {
    setIsRefreshing(true);
    try {
      // Check for new performance alerts
      const newAlerts = await supportAnalyticsServiceEnhanced.checkPerformanceAlerts();
      if (newAlerts.length > 0) {
        setAlerts(prev => [...newAlerts, ...prev]);
      }
    } catch (error) {
      console.error('Error refreshing alerts:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    setAlerts(prev => prev.map(alert =>
      alert.id === alertId
        ? {
            ...alert,
            alertStatus: 'acknowledged' as const,
            acknowledgedAt: new Date().toISOString()
          }
        : alert
    ));
  };

  const resolveAlert = async (alertId: string, resolutionNotes?: string) => {
    setAlerts(prev => prev.map(alert =>
      alert.id === alertId
        ? {
            ...alert,
            alertStatus: 'resolved' as const,
            resolvedAt: new Date().toISOString(),
            resolutionNotes: resolutionNotes
          }
        : alert
    ));
  };

  const dismissAlert = async (alertId: string) => {
    setAlerts(prev => prev.map(alert =>
      alert.id === alertId
        ? {
            ...alert,
            alertStatus: 'dismissed' as const
          }
        : alert
    ));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertOctagon className="h-5 w-5 text-red-500" />;
      case 'high': return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'medium': return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'low': return <Info className="h-5 w-5 text-blue-500" />;
      default: return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Wifi className="h-4 w-4 text-green-500" />;
      case 'acknowledged': return <Eye className="h-4 w-4 text-blue-500" />;
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'dismissed': return <X className="h-4 w-4 text-gray-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'slack': return <MessageSquare className="h-4 w-4" />;
      case 'sms': return <Phone className="h-4 w-4" />;
      case 'webhook': return <Wifi className="h-4 w-4" />;
      case 'in_app': return <Bell className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const getTestStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'failure': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (selectedSeverity !== 'all' && alert.alertSeverity !== selectedSeverity) return false;
    if (selectedStatus !== 'all' && alert.alertStatus !== selectedStatus) return false;
    return true;
  });

  const alertTrendData = [
    { time: '00:00', critical: 0, high: 1, medium: 2, low: 1 },
    { time: '04:00', critical: 0, high: 0, medium: 1, low: 2 },
    { time: '08:00', critical: 1, high: 2, medium: 3, low: 4 },
    { time: '12:00', critical: 1, high: 3, medium: 2, low: 3 },
    { time: '16:00', critical: 0, high: 2, medium: 4, low: 2 },
    { time: '20:00', critical: 0, high: 1, medium: 2, low: 1 }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B4513]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#8B4513]">Alert & Notification System</h1>
          <p className="text-muted-foreground">Real-time performance monitoring and intelligent alerting</p>
        </div>

        <div className="flex items-center gap-4">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>

          <Button
            variant="outline"
            onClick={refreshAlerts}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>

      {/* Alert Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Alerts */}
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{alertMetrics?.activeAlerts || 0}</div>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-red-600">Requires attention</span>
            </div>
          </CardContent>
        </Card>

        {/* Critical Alerts */}
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertOctagon className="h-4 w-4" />
              Critical
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{alertMetrics?.criticalAlerts || 0}</div>
            <div className="text-xs text-muted-foreground mt-1">Immediate action required</div>
          </CardContent>
        </Card>

        {/* Resolved Today */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Resolved Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{alertMetrics?.resolvedToday || 0}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Avg: {alertMetrics?.avgResolutionTime || 0} min
            </div>
          </CardContent>
        </Card>

        {/* Total Alerts */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Total Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{alertMetrics?.totalAlerts || 0}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {((alertMetrics?.falsePositives || 0) / (alertMetrics?.totalAlerts || 1) * 100).toFixed(1)}% false positives
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert System Tabs */}
      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="alerts">Active Alerts</TabsTrigger>
          <TabsTrigger value="rules">Alert Rules</TabsTrigger>
          <TabsTrigger value="channels">Notification Channels</TabsTrigger>
          <TabsTrigger value="analytics">Alert Analytics</TabsTrigger>
          <TabsTrigger value="settings">System Settings</TabsTrigger>
        </TabsList>

        {/* Active Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{filteredAlerts.length} alerts</span>
            </div>
          </div>

          <div className="space-y-4">
            {filteredAlerts.map((alert) => (
              <Card key={alert.id} className={`${getSeverityColor(alert.alertSeverity)} border-l-4`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      {getSeverityIcon(alert.alertSeverity)}
                      <div className="flex-1">
                        <h4 className="font-medium">{alert.alertTitle}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{alert.alertDescription}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getSeverityColor(alert.alertSeverity)}>
                        {alert.alertSeverity.toUpperCase()}
                      </Badge>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(alert.alertStatus)}
                        <span className="text-xs capitalize">{alert.alertStatus.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Current Value</p>
                      <p className="font-medium">{alert.currentValue}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Threshold</p>
                      <p className="font-medium">{alert.thresholdValue}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Variance</p>
                      <p className={`font-medium ${alert.variancePercentage > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {alert.variancePercentage > 0 ? '+' : ''}{alert.variancePercentage}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Time Period</p>
                      <p className="font-medium">{alert.affectedTimePeriod}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      Created: {new Date(alert.createdAt).toLocaleString()}
                      {alert.acknowledgedAt && ` • Acknowledged: ${new Date(alert.acknowledgedAt).toLocaleString()}`}
                      {alert.resolvedAt && ` • Resolved: ${new Date(alert.resolvedAt).toLocaleString()}`}
                    </div>

                    <div className="flex items-center gap-2">
                      {alert.alertStatus === 'active' && (
                        <Button size="sm" variant="outline" onClick={() => acknowledgeAlert(alert.id)}>
                          <Eye className="h-3 w-3 mr-1" />
                          Acknowledge
                        </Button>
                      )}
                      {alert.alertStatus === 'acknowledged' && (
                        <Button size="sm" variant="outline" onClick={() => resolveAlert(alert.id)}>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Resolve
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => dismissAlert(alert.id)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Alert Rules Tab */}
        <TabsContent value="rules" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Alert Configuration Rules</h3>
            <Button>
              <AlertTriangle className="h-4 w-4 mr-2" />
              Create New Rule
            </Button>
          </div>

          <div className="space-y-4">
            {alertRules.map((rule) => (
              <Card key={rule.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${rule.enabled ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <div>
                        <h4 className="font-medium">{rule.name}</h4>
                        <p className="text-sm text-muted-foreground">{rule.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getSeverityColor(rule.severity)}>
                        {rule.severity.toUpperCase()}
                      </Badge>
                      <Button size="sm" variant="outline">
                        <Settings className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Metric</p>
                      <p className="font-medium">{rule.metric.replace(/_/g, ' ')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Condition</p>
                      <p className="font-medium">{rule.condition.replace(/_/g, ' ')} {rule.threshold}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Cooldown</p>
                      <p className="font-medium">{rule.cooldownPeriod}s</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Triggers</p>
                      <p className="font-medium">{rule.triggerCount} times</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-sm text-muted-foreground">Channels:</span>
                    {rule.notification aria-live="polite" aria-atomic="true"Channels.map((channel, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {channel}
                      </Badge>
                    ))}
                  </div>

                  {rule.lastTriggered && (
                    <div className="text-xs text-muted-foreground mt-2">
                      Last triggered: {new Date(rule.lastTriggered).toLocaleString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Notification Channels Tab */}
        <TabsContent value="channels" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Notification Channels</h3>
            <Button>
              <Bell className="h-4 w-4 mr-2" />
              Add Channel
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {notification aria-live="polite" aria-atomic="true"Channels.map((channel) => (
              <Card key={channel.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getChannelIcon(channel.type)}
                      <div>
                        <h4 className="font-medium">{channel.name}</h4>
                        <p className="text-sm text-muted-foreground capitalize">{channel.type.replace(/_/g, ' ')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${channel.enabled ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <Button size="sm" variant="outline">
                        <Settings className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Status:</span>
                      <span className={getTestStatusColor(channel.testStatus)}>
                        {channel.testStatus.replace(/_/g, ' ')}
                      </span>
                    </div>
                    {channel.lastTest && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Last test:</span>
                        <span>{new Date(channel.lastTest).toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <Button size="sm" variant="outline">
                      Test Connection
                    </Button>
                    <Button size="sm" variant="ghost">
                      {channel.enabled ? 'Disable' : 'Enable'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Alert Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Alert Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Alert Trend Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={alertTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="critical" stroke="#dc2626" strokeWidth={2} />
                    <Line type="monotone" dataKey="high" stroke="#ea580c" strokeWidth={2} />
                    <Line type="monotone" dataKey="medium" stroke="#ca8a04" strokeWidth={2} />
                    <Line type="monotone" dataKey="low" stroke="#2563eb" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Alert Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Alert Distribution by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['sla', 'response_time', 'volume', 'satisfaction', 'performance'].map((category) => {
                    const categoryAlerts = alerts.filter(a => a.metricCategory === category).length;
                    const percentage = (categoryAlerts / alerts.length) * 100;
                    return (
                      <div key={category}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium capitalize">{category.replace(/_/g, ' ')}</span>
                          <span className="text-sm">{categoryAlerts} alerts</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alert Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Alert System Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">94%</p>
                  <p className="text-sm text-muted-foreground">True Positive Rate</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">6%</p>
                  <p className="text-sm text-muted-foreground">False Positive Rate</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">45min</p>
                  <p className="text-sm text-muted-foreground">Avg Resolution Time</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">98%</p>
                  <p className="text-sm text-muted-foreground">System Uptime</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Global Alert Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium" htmlFor="maximum-alerts-per-hour">Maximum Alerts Per Hour</label>
                    <input type="number" className="w-full mt-1 px-3 py-2 border rounded-md" defaultValue="50" />
                  </div>
                  <div>
                    <label className="text-sm font-medium" htmlFor="default-alert-severity">Default Alert Severity</label>
                    <select className="w-full mt-1 px-3 py-2 border rounded-md" defaultValue="medium">
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium" htmlFor="auto-acknowledge-timeout">Auto-acknowledge Timeout</label>
                    <input type="number" className="w-full mt-1 px-3 py-2 border rounded-md" defaultValue="300" />
                    <p className="text-xs text-muted-foreground">Seconds before auto-acknowledging alerts</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Maintenance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h5 className="font-medium text-blue-800 mb-2">System Health</h5>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Alert Engine Status</span>
                        <span className="text-green-600">Operational</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Last Maintenance</span>
                        <span>2 days ago</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Next Scheduled</span>
                        <span>In 5 days</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Button className="w-full" variant="outline">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Test Alert System
                    </Button>
                    <Button className="w-full" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export Configuration
                    </Button>
                    <Button className="w-full" variant="outline">
                      <Settings className="h-4 w-4 mr-2" />
                      Advanced Settings
                    </Button>
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

export default AlertNotificationSystem;