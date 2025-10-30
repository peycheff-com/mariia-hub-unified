import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Play,
  Pause,
  Settings,
  RefreshCw,
  FileText,
  Download,
  Activity,
  TrendingUp,
  TrendingDown,
  Zap,
  Calendar,
  BarChart3,
  Bell,
  Eye,
  Filter
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { complianceChecker, ComplianceReport } from '@/lib/automated-compliance-checker';

interface ComplianceSchedule {
  id: string;
  ruleId: string;
  ruleName: string;
  category: string;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  enabled: boolean;
  lastRun: string;
  nextRun: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
}

interface ComplianceMetric {
  date: string;
  overallScore: number;
  passedChecks: number;
  totalChecks: number;
  criticalIssues: number;
}

export function ComplianceAutomationDashboard() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isRunning, setIsRunning] = useState(false);
  const [currentReport, setCurrentReport] = useState<ComplianceReport | null>(null);
  const [schedules, setSchedules] = useState<ComplianceSchedule[]>([
    {
      id: '1',
      ruleId: 'gdpr_cookie_consent',
      ruleName: 'Cookie Consent Implementation',
      category: 'gdpr',
      frequency: 'daily',
      enabled: true,
      lastRun: '2024-01-15T10:00:00Z',
      nextRun: '2024-01-16T10:00:00Z',
      status: 'completed',
    },
    {
      id: '2',
      ruleId: 'security_https',
      ruleName: 'HTTPS Implementation',
      category: 'security',
      frequency: 'hourly',
      enabled: true,
      lastRun: '2024-01-15T15:30:00Z',
      nextRun: '2024-01-15T16:30:00Z',
      status: 'completed',
    },
    {
      id: '3',
      ruleId: 'polish_currency',
      ruleName: 'Polish Currency Display',
      category: 'polish',
      frequency: 'daily',
      enabled: false,
      lastRun: '2024-01-14T12:00:00Z',
      nextRun: '2024-01-15T12:00:00Z',
      status: 'idle',
    },
  ]);

  const [historicalMetrics] = useState<ComplianceMetric[]>([
    {
      date: '2024-01-15',
      overallScore: 92,
      passedChecks: 18,
      totalChecks: 20,
      criticalIssues: 0,
    },
    {
      date: '2024-01-14',
      overallScore: 89,
      passedChecks: 17,
      totalChecks: 20,
      criticalIssues: 1,
    },
    {
      date: '2024-01-13',
      overallScore: 94,
      passedChecks: 19,
      totalChecks: 20,
      criticalIssues: 0,
    },
    {
      date: '2024-01-12',
      overallScore: 91,
      passedChecks: 18,
      totalChecks: 20,
      criticalIssues: 0,
    },
  ]);

  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    // Initialize with a sample report
    const sampleReport: ComplianceReport = {
      id: 'sample-report-123',
      timestamp: new Date().toISOString(),
      duration: 2500,
      totalChecks: 20,
      passedChecks: 18,
      failedChecks: 1,
      warningChecks: 1,
      errorChecks: 0,
      overallScore: 92,
      results: [
        {
          ruleId: 'gdpr_cookie_consent',
          ruleName: 'Cookie Consent Implementation',
          category: 'gdpr',
          severity: 'high',
          status: 'pass',
          message: 'Cookie consent properly implemented',
          timestamp: new Date().toISOString(),
          details: { hasCookieBanner: true, hasManager: true },
        },
        {
          ruleId: 'security_https',
          ruleName: 'HTTPS Implementation',
          category: 'security',
          severity: 'critical',
          status: 'pass',
          message: 'HTTPS properly implemented',
          timestamp: new Date().toISOString(),
          details: { isHTTPS: true, hasSecureCookies: true },
        },
      ],
      summary: 'Compliance check completed successfully',
    };
    setCurrentReport(sampleReport);
  }, []);

  const runComplianceCheck = async () => {
    setIsRunning(true);
    try {
      // In a real implementation, this would run the actual compliance checker
      const report = await complianceChecker.runAllChecks();
      setCurrentReport(report);

      // Update schedule status
      setSchedules(prev => prev.map(schedule =>
        schedule.enabled ? {
          ...schedule,
          lastRun: new Date().toISOString(),
          status: 'completed' as const,
        } : schedule
      ));
    } catch (error) {
      console.error('Compliance check failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const toggleSchedule = (scheduleId: string) => {
    setSchedules(prev => prev.map(schedule =>
      schedule.id === scheduleId
        ? { ...schedule, enabled: !schedule.enabled, status: !schedule.enabled ? 'idle' : 'completed' }
        : schedule
    ));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'pass': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
      case 'fail': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'running': return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'pass': return 'bg-green-100 text-green-800';
      case 'failed':
      case 'fail': return 'bg-red-100 text-red-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const categories = [
    { value: 'all', label: t('automation.all_categories', 'All Categories') },
    { value: 'gdpr', label: 'GDPR' },
    { value: 'security', label: t('automation.security', 'Security') },
    { value: 'polish', label: t('automation.polish', 'Polish Compliance') },
    { value: 'accessibility', label: t('automation.accessibility', 'Accessibility') },
  ];

  const filteredSchedules = schedules.filter(schedule =>
    selectedCategory === 'all' || schedule.category === selectedCategory
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold">
                {t('automation.title', 'Compliance Automation Dashboard')}
              </h1>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={runComplianceCheck}
                disabled={isRunning}
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    {t('automation.running', 'Running...')}
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    {t('automation.run_check', 'Run Check')}
                  </>
                )}
              </Button>
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                {t('automation.configure', 'Configure')}
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground mt-2">
            {t('automation.description',
              'Automated compliance checking system with scheduled monitoring, real-time alerts, ' +
              'and comprehensive reporting for GDPR, security, and Polish market compliance.')}
          </p>
        </div>

        {/* Overview Cards */}
        {currentReport && (
          <div className="grid gap-6 mb-8 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  {t('automation.overall_score', 'Overall Score')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${getScoreColor(currentReport.overallScore)}`}>
                  {currentReport.overallScore}%
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                  {currentReport.overallScore > 90 ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  )}
                  <span>{t('automation.vs_previous', 'vs previous check')}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  {t('automation.passed_checks', 'Passed Checks')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {currentReport.passedChecks}
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  {t('automation.of_total', 'of {{total}} checks', { total: currentReport.totalChecks })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  {t('automation.issues', 'Issues Found')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">
                  {currentReport.failedChecks + currentReport.warningChecks}
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  {t('automation.need_attention', 'need attention')}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  {t('automation.last_check', 'Last Check')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">
                  {new Date(currentReport.timestamp).toLocaleTimeString()}
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  {new Date(currentReport.timestamp).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">{t('automation.dashboard', 'Dashboard')}</TabsTrigger>
            <TabsTrigger value="schedules">{t('automation.schedules', 'Schedules')}</TabsTrigger>
            <TabsTrigger value="results">{t('automation.results', 'Results')}</TabsTrigger>
            <TabsTrigger value="trends">{t('automation.trends', 'Trends')}</TabsTrigger>
            <TabsTrigger value="alerts">{t('automation.alerts', 'Alerts')}</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    {t('automation.recent_activity', 'Recent Activity')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {schedules.slice(0, 5).map((schedule) => (
                    <div key={schedule.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(schedule.status)}
                        <div>
                          <div className="font-medium text-sm">{schedule.ruleName}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(schedule.lastRun).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className={getStatusColor(schedule.status)}>
                        {schedule.status}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    {t('automation.compliance_breakdown', 'Compliance Breakdown')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentReport && (
                    <>
                      {[
                        { category: 'GDPR', score: 95, color: 'bg-blue-500' },
                        { category: t('automation.security', 'Security'), score: 100, color: 'bg-green-500' },
                        { category: t('automation.polish', 'Polish'), score: 88, color: 'bg-red-500' },
                        { category: t('automation.accessibility', 'Accessibility'), score: 92, color: 'bg-yellow-500' },
                      ].map((item) => (
                        <div key={item.category} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>{item.category}</span>
                            <span className={getScoreColor(item.score)}>{item.score}%</span>
                          </div>
                          <Progress value={item.score} className="h-2" />
                        </div>
                      ))}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {currentReport && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('automation.latest_results', 'Latest Check Results')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('automation.rule', 'Rule')}</TableHead>
                        <TableHead>{t('automation.category', 'Category')}</TableHead>
                        <TableHead>{t('automation.severity', 'Severity')}</TableHead>
                        <TableHead>{t('automation.status', 'Status')}</TableHead>
                        <TableHead>{t('automation.actions', 'Actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentReport.results.slice(0, 10).map((result) => (
                        <TableRow key={result.ruleId}>
                          <TableCell className="font-medium">{result.ruleName}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{result.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{result.severity}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(result.status)}
                              <Badge className={getStatusColor(result.status)}>
                                {result.status}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="schedules" className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">
                {t('automation.automated_schedules', 'Automated Schedules')}
              </h2>
              <div className="flex gap-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border rounded text-sm"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  {t('automation.filter', 'Filter')}
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="p-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('automation.rule_name', 'Rule Name')}</TableHead>
                      <TableHead>{t('automation.category', 'Category')}</TableHead>
                      <TableHead>{t('automation.frequency', 'Frequency')}</TableHead>
                      <TableHead>{t('automation.enabled', 'Enabled')}</TableHead>
                      <TableHead>{t('automation.last_run', 'Last Run')}</TableHead>
                      <TableHead>{t('automation.next_run', 'Next Run')}</TableHead>
                      <TableHead>{t('automation.status', 'Status')}</TableHead>
                      <TableHead>{t('automation.actions', 'Actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSchedules.map((schedule) => (
                      <TableRow key={schedule.id}>
                        <TableCell className="font-medium">{schedule.ruleName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{schedule.category}</Badge>
                        </TableCell>
                        <TableCell>{schedule.frequency}</TableCell>
                        <TableCell>
                          <Switch
                            checked={schedule.enabled}
                            onCheckedChange={() => toggleSchedule(schedule.id)}
                          />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(schedule.lastRun).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(schedule.nextRun).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(schedule.status)}
                            <Badge className={getStatusColor(schedule.status)}>
                              {schedule.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm">
                              <Play className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Settings className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">
                {t('automation.historical_results', 'Historical Results')}
              </h2>
              <div className="flex gap-2">
                <Button variant="outline">
                  <Calendar className="w-4 h-4 mr-2" />
                  {t('automation.date_range', 'Date Range')}
                </Button>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  {t('automation.export', 'Export')}
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {historicalMetrics.map((metric) => (
                    <div key={metric.date} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold">{new Date(metric.date).toLocaleDateString()}</h3>
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-bold ${getScoreColor(metric.overallScore)}`}>
                            {metric.overallScore}%
                          </span>
                          <Badge className={getStatusColor(metric.criticalIssues > 0 ? 'failed' : 'pass')}>
                            {metric.criticalIssues === 0 ? 'Pass' : 'Fail'}
                          </Badge>
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-3 text-sm">
                        <div className="flex justify-between">
                          <span>{t('automation.passed', 'Passed')}:</span>
                          <span className="font-medium">{metric.passedChecks}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t('automation.total', 'Total')}:</span>
                          <span className="font-medium">{metric.totalChecks}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t('automation.critical_issues', 'Critical Issues')}:</span>
                          <span className="font-medium text-red-600">{metric.criticalIssues}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <h2 className="text-2xl font-semibold mb-4">
              {t('automation.compliance_trends', 'Compliance Trends')}
            </h2>

            <Card>
              <CardHeader>
                <CardTitle>{t('automation.score_trend', 'Overall Score Trend')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-end h-32">
                    {historicalMetrics.map((metric, index) => (
                      <div key={metric.date} className="flex-1 flex flex-col items-center">
                        <div
                          className="w-full bg-primary rounded-t"
                          style={{ height: `${metric.overallScore}%` }}
                        />
                        <span className="text-xs mt-2">
                          {new Date(metric.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{t('automation.average_score', 'Average Score')}: 91.5%</span>
                    <span>{t('automation.trend', 'Trend')}: +2%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <h2 className="text-2xl font-semibold mb-4">
              {t('automation.alert_notification aria-live="polite" aria-atomic="true"s', 'Alert Notifications')}
            </h2>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  {t('automation.recent_alerts', 'Recent Alerts')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-l-4 border-red-500 bg-red-50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-red-800">
                          {t('automation.critical_alert', 'Critical Compliance Issue')}
                        </h4>
                        <p className="text-red-700 text-sm mt-1">
                          {t('automation.cookie_consent_critical', 'Cookie consent implementation may not be GDPR compliant')}
                        </p>
                        <p className="text-red-600 text-xs mt-2">
                          {new Date().toLocaleString()}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        {t('automation.investigate', 'Investigate')}
                      </Button>
                    </div>
                  </div>

                  <div className="border-l-4 border-yellow-500 bg-yellow-50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-yellow-800">
                          {t('automation.warning_alert', 'Warning')}
                        </h4>
                        <p className="text-yellow-700 text-sm mt-1">
                          {t('automation.polish_compliance_warning', 'Polish currency display needs attention')}
                        </p>
                        <p className="text-yellow-600 text-xs mt-2">
                          {new Date(Date.now() - 3600000).toLocaleString()}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        {t('automation.review', 'Review')}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {t('automation.alert_configuration',
                  'Configure alert thresholds and notification aria-live="polite" aria-atomic="true" preferences in the settings. ' +
                  'Critical issues trigger immediate notification aria-live="polite" aria-atomic="true"s to the compliance team.')}
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}