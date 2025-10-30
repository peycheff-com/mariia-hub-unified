import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Database,
  FileText,
  Eye,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  RefreshCw,
  Download,
  Settings,
  Bell,
  Lock,
  Globe,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ComplianceMetric {
  id: string;
  name: string;
  category: 'gdpr' | 'security' | 'privacy' | 'legal';
  status: 'compliant' | 'warning' | 'non_compliant' | 'not_applicable';
  score: number;
  lastChecked: string;
  description: string;
  remediation?: string;
  dueDate?: string;
}

interface AuditLog {
  id: string;
  timestamp: string;
  category: 'access' | 'modification' | 'deletion' | 'consent' | 'security';
  action: string;
  user: string;
  ipAddress: string;
  status: 'success' | 'failure' | 'warning';
  details: string;
}

interface ComplianceAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  timestamp: string;
  category: string;
  assignedTo?: string;
  status: 'open' | 'in_progress' | 'resolved';
}

export function ComplianceMonitoringDashboard() {
  const { t } = useTranslation();
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');
  const [complianceScore, setComplianceScore] = useState(92);

  const complianceMetrics: ComplianceMetric[] = [
    {
      id: '1',
      name: t('metrics.cookie_consent', 'Cookie Consent Management'),
      category: 'gdpr',
      status: 'compliant',
      score: 100,
      lastChecked: '2024-01-15T10:30:00Z',
      description: t('metrics.cookie_consent_desc', 'All cookie consent mechanisms are properly implemented and documented'),
    },
    {
      id: '2',
      name: t('metrics.data_subject_requests', 'Data Subject Requests'),
      category: 'gdpr',
      status: 'warning',
      score: 85,
      lastChecked: '2024-01-15T09:15:00Z',
      description: t('metrics.data_subject_requests_desc', 'Response time for data subject requests needs improvement'),
      remediation: t('metrics.data_subject_requests_fix', 'Implement automated response tracking and reminders'),
      dueDate: '2024-01-30',
    },
    {
      id: '3',
      name: t('metrics.breach_procedures', 'Data Breach Procedures'),
      category: 'security',
      status: 'compliant',
      score: 95,
      lastChecked: '2024-01-15T08:00:00Z',
      description: t('metrics.breach_procedures_desc', 'Breach detection and notification aria-live="polite" aria-atomic="true" procedures are in place'),
    },
    {
      id: '4',
      name: t('metrics.encryption_standards', 'Encryption Standards'),
      category: 'security',
      status: 'compliant',
      score: 100,
      lastChecked: '2024-01-15T07:30:00Z',
      description: t('metrics.encryption_standards_desc', 'All data encrypted at rest and in transit with industry standards'),
    },
    {
      id: '5',
      name: t('metrics.privacy_policy', 'Privacy Policy Updates'),
      category: 'privacy',
      status: 'warning',
      score: 75,
      lastChecked: '2024-01-14T16:45:00Z',
      description: t('metrics.privacy_policy_desc', 'Privacy policy needs updating for new service categories'),
      remediation: t('metrics.privacy_policy_fix', 'Review and update privacy policy for fitness services'),
      dueDate: '2024-02-01',
    },
    {
      id: '6',
      name: t('metrics.vendor_compliance', 'Third-Party Vendor Compliance'),
      category: 'legal',
      status: 'compliant',
      score: 90,
      lastChecked: '2024-01-14T15:20:00Z',
      description: t('metrics.vendor_compliance_desc', 'All vendors have valid DPAs and compliance documentation'),
    },
  ];

  const auditLogs: AuditLog[] = [
    {
      id: '1',
      timestamp: '2024-01-15T10:30:00Z',
      category: 'consent',
      action: t('audit.cookie_consent_given', 'Cookie consent recorded'),
      user: 'user@example.com',
      ipAddress: '192.168.1.100',
      status: 'success',
      details: t('audit.cookie_consent_details', 'User accepted all cookie categories'),
    },
    {
      id: '2',
      timestamp: '2024-01-15T10:15:00Z',
      category: 'access',
      action: t('audit.data_access_request', 'Data access request processed'),
      user: 'admin@mariaborysevych.com',
      ipAddress: '192.168.1.50',
      status: 'success',
      details: t('audit.data_access_details', 'User data export completed and sent'),
    },
    {
      id: '3',
      timestamp: '2024-01-15T09:45:00Z',
      category: 'security',
      action: t('audit.failed_login', 'Failed login attempt'),
      user: 'unknown',
      ipAddress: '192.168.1.200',
      status: 'failure',
      details: t('audit.failed_login_details', 'Multiple failed login attempts detected'),
    },
    {
      id: '4',
      timestamp: '2024-01-15T09:30:00Z',
      category: 'modification',
      action: t('audit.data_updated', 'User data updated'),
      user: 'user@example.com',
      ipAddress: '192.168.1.100',
      status: 'success',
      details: t('audit.data_updated_details', 'Profile information updated'),
    },
    {
      id: '5',
      timestamp: '2024-01-15T09:00:00Z',
      category: 'deletion',
      action: t('audit.data_deleted', 'Data deletion request processed'),
      user: 'admin@mariaborysevych.com',
      ipAddress: '192.168.1.50',
      status: 'success',
      details: t('audit.data_deleted_details', 'User account deleted as per GDPR request'),
    },
  ];

  const complianceAlerts: ComplianceAlert[] = [
    {
      id: '1',
      type: 'warning',
      title: t('alerts.dsar_response_time', 'DSAR Response Time Warning'),
      description: t('alerts.dsar_description', 'Two data subject requests are approaching the 30-day deadline'),
      timestamp: '2024-01-15T08:00:00Z',
      category: 'GDPR',
      assignedTo: 'privacy@mariaborysevych.com',
      status: 'open',
    },
    {
      id: '2',
      type: 'info',
      title: t('alerts.policy_review', 'Privacy Policy Review Due'),
      description: t('alerts.policy_description', 'Quarterly privacy policy review scheduled for next week'),
      timestamp: '2024-01-14T16:30:00Z',
      category: 'Privacy',
      status: 'open',
    },
    {
      id: '3',
      type: 'critical',
      title: t('alerts.security_update', 'Security Update Required'),
      description: t('alerts.security_description', 'SSL certificate expiring in 7 days'),
      timestamp: '2024-01-14T14:15:00Z',
      category: 'Security',
      assignedTo: 'tech@mariaborysevych.com',
      status: 'in_progress',
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'non_compliant':
      case 'failure':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'non_compliant':
      case 'failure':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAlertTypeColor = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const categoryCounts = {
    gdpr: complianceMetrics.filter(m => m.category === 'gdpr').length,
    security: complianceMetrics.filter(m => m.category === 'security').length,
    privacy: complianceMetrics.filter(m => m.category === 'privacy').length,
    legal: complianceMetrics.filter(m => m.category === 'legal').length,
  };

  const statusCounts = {
    compliant: complianceMetrics.filter(m => m.status === 'compliant').length,
    warning: complianceMetrics.filter(m => m.status === 'warning').length,
    non_compliant: complianceMetrics.filter(m => m.status === 'non_compliant').length,
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold">
                {t('monitoring.title', 'Compliance Monitoring Dashboard')}
              </h1>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                {t('monitoring.refresh', 'Refresh')}
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                {t('monitoring.export', 'Export Report')}
              </Button>
              <Button size="sm">
                <Settings className="w-4 h-4 mr-2" />
                {t('monitoring.settings', 'Settings')}
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground mt-2">
            {t('monitoring.description',
              'Real-time monitoring of GDPR compliance, security posture, and privacy controls. ' +
              'Track compliance metrics, audit trails, and remediation activities.')}
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-6 mb-8 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                {t('monitoring.overall_score', 'Overall Score')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${getScoreColor(complianceScore)}`}>
                {complianceScore}%
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                {complianceScore > 90 ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
                <span>{t('monitoring.vs_last_month', 'vs 92% last month')}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                {t('monitoring.compliant_controls', 'Compliant Controls')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {statusCounts.compliant}
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                {t('monitoring.of_total', 'of {{total}} controls', { total: complianceMetrics.length })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                {t('monitoring.active_alerts', 'Active Alerts')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">
                {complianceAlerts.filter(a => a.status === 'open').length}
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                {t('monitoring.need_attention', 'need attention')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                {t('monitoring.last_audit', 'Last Audit')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {new Date('2024-01-15').toLocaleDateString()}
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                {t('monitoring.next_scheduled', 'Next: 2024-02-15')}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">{t('monitoring.overview', 'Overview')}</TabsTrigger>
            <TabsTrigger value="metrics">{t('monitoring.metrics', 'Metrics')}</TabsTrigger>
            <TabsTrigger value="audit">{t('monitoring.audit_log', 'Audit Log')}</TabsTrigger>
            <TabsTrigger value="alerts">{t('monitoring.alerts', 'Alerts')}</TabsTrigger>
            <TabsTrigger value="reports">{t('monitoring.reports', 'Reports')}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>{t('monitoring.compliance_by_category', 'Compliance by Category')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(categoryCounts).map(([category, count]) => {
                    const categoryMetrics = complianceMetrics.filter(m => m.category === category);
                    const avgScore = Math.round(categoryMetrics.reduce((sum, m) => sum + m.score, 0) / categoryMetrics.length);

                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{t(`monitoring.category.${category}`, category)}</span>
                          <span className={getScoreColor(avgScore)}>{avgScore}%</span>
                        </div>
                        <Progress value={avgScore} className="h-2" />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('monitoring.recent_activities', 'Recent Activities')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {auditLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex items-center gap-3">
                      {getStatusIcon(log.status)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{log.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString()} • {log.user}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{t('monitoring.open_alerts', 'Open Alerts')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {complianceAlerts.filter(alert => alert.status === 'open').map((alert) => (
                    <div key={alert.id} className={`border rounded-lg p-4 ${getAlertTypeColor(alert.type)}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getAlertTypeColor(alert.type)}>
                              {t(`monitoring.alert_type.${alert.type}`, alert.type)}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {new Date(alert.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                          <h4 className="font-medium mb-1">{alert.title}</h4>
                          <p className="text-sm mb-2">{alert.description}</p>
                          {alert.assignedTo && (
                            <p className="text-xs">
                              {t('monitoring.assigned_to', 'Assigned to')}: {alert.assignedTo}
                            </p>
                          )}
                        </div>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          {t('monitoring.view', 'View')}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{t('monitoring.compliance_metrics', 'Compliance Metrics')}</CardTitle>
                  <div className="flex gap-2">
                    <select
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(e.target.value)}
                      className="px-3 py-1 border rounded text-sm"
                    >
                      <option value="7d">{t('monitoring.last_7_days', 'Last 7 days')}</option>
                      <option value="30d">{t('monitoring.last_30_days', 'Last 30 days')}</option>
                      <option value="90d">{t('monitoring.last_90_days', 'Last 90 days')}</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('monitoring.control', 'Control')}</TableHead>
                      <TableHead>{t('monitoring.category', 'Category')}</TableHead>
                      <TableHead>{t('monitoring.score', 'Score')}</TableHead>
                      <TableHead>{t('monitoring.status', 'Status')}</TableHead>
                      <TableHead>{t('monitoring.last_checked', 'Last Checked')}</TableHead>
                      <TableHead>{t('monitoring.actions', 'Actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {complianceMetrics.map((metric) => (
                      <TableRow key={metric.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{metric.name}</div>
                            <div className="text-sm text-muted-foreground max-w-xs truncate">
                              {metric.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {t(`monitoring.category.${metric.category}`, metric.category)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${getScoreColor(metric.score)}`}>
                              {metric.score}%
                            </span>
                            <Progress value={metric.score} className="w-16 h-2" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(metric.status)}
                            <Badge className={getStatusColor(metric.status)}>
                              {t(`monitoring.status.${metric.status}`, metric.status)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(metric.lastChecked).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            {metric.remediation && (
                              <Button variant="ghost" size="sm">
                                <Settings className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('monitoring.audit_log', 'Audit Log')}</CardTitle>
                <CardDescription>
                  {t('monitoring.audit_description', 'Comprehensive log of all compliance-related activities')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('monitoring.timestamp', 'Timestamp')}</TableHead>
                      <TableHead>{t('monitoring.category', 'Category')}</TableHead>
                      <TableHead>{t('monitoring.action', 'Action')}</TableHead>
                      <TableHead>{t('monitoring.user', 'User')}</TableHead>
                      <TableHead>{t('monitoring.ip_address', 'IP Address')}</TableHead>
                      <TableHead>{t('monitoring.status', 'Status')}</TableHead>
                      <TableHead>{t('monitoring.details', 'Details')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {new Date(log.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {t(`monitoring.category.${log.category}`, log.category)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{log.action}</TableCell>
                        <TableCell className="text-sm">{log.user}</TableCell>
                        <TableCell className="text-sm font-mono">{log.ipAddress}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(log.status)}
                            <Badge className={getStatusColor(log.status)}>
                              {t(`monitoring.status.${log.status}`, log.status)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                          {log.details}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">
                {t('monitoring.compliance_alerts', 'Compliance Alerts')}
              </h2>
              <Button>
                <Bell className="w-4 h-4 mr-2" />
                {t('monitoring.configure_alerts', 'Configure Alerts')}
              </Button>
            </div>

            <div className="grid gap-4">
              {complianceAlerts.map((alert) => (
                <Card key={alert.id} className={`border-l-4 ${getAlertTypeColor(alert.type)}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={getAlertTypeColor(alert.type)}>
                            {t(`monitoring.alert_type.${alert.type}`, alert.type)}
                          </Badge>
                          <Badge variant="outline">
                            {alert.category}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(alert.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <h3 className="font-semibold text-lg mb-2">{alert.title}</h3>
                        <p className="text-muted-foreground mb-3">{alert.description}</p>
                        {alert.assignedTo && (
                          <p className="text-sm">
                            {t('monitoring.assigned_to', 'Assigned to')}: {alert.assignedTo}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          {t('monitoring.assign', 'Assign')}
                        </Button>
                        <Button variant="outline" size="sm">
                          {t('monitoring.resolve', 'Resolve')}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <h2 className="text-2xl font-semibold mb-4">
              {t('monitoring.compliance_reports', 'Compliance Reports')}
            </h2>

            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    {t('monitoring.monthly_report', 'Monthly Compliance Report')}
                  </CardTitle>
                  <CardDescription>
                    {t('monitoring.monthly_report_desc', 'Comprehensive monthly compliance status and metrics')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    {t('monitoring.generate_report', 'Generate Report')}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    {t('monitoring.gdpr_report', 'GDPR Article 30 Report')}
                  </CardTitle>
                  <CardDescription>
                    {t('monitoring.gdpr_report_desc', 'Data processing register for supervisory authorities')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    {t('monitoring.generate_report', 'Generate Report')}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    {t('monitoring.audit_report', 'Audit Trail Report')}
                  </CardTitle>
                  <CardDescription>
                    {t('monitoring.audit_report_desc', 'Complete audit log for specified period')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    {t('monitoring.generate_report', 'Generate Report')}
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {t('monitoring.report_note',
                  'All reports are generated in compliance with GDPR and include only necessary compliance information. ' +
                  'Reports are stored securely and available for authorized personnel only.')}
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}