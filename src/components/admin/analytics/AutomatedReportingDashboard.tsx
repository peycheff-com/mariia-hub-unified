import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import
  BarChart3,
  Bell,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  Edit,
  FileText,
  Mail,
  Plus,
  RefreshCw,
  Send,
  Settings,
  TrendingUp,
  Users,
  AlertTriangle,
  Zap,
  Activity,
  Target,
  PieChart,
  LineChart,
  Eye,
  Trash2,
  Filter,
  Search
} from 'lucide-react';

// Types
interface Report {
  id: string;
  name: string;
  description: string;
  type: 'financial' | 'operational' | 'marketing' | 'customer' | 'custom';
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'on_demand';
  recipients: string[];
  status: 'active' | 'paused' | 'draft';
  lastRun?: Date;
  nextRun?: Date;
  format: 'pdf' | 'excel' | 'powerpoint' | 'csv' | 'dashboard';
  metrics: string[];
  filters: Record<string, any>;
  createdBy: string;
  createdAt: Date;
  schedule: {
    hour: number;
    minute: number;
    dayOfWeek?: number;
    dayOfMonth?: number;
  };
}

interface Alert {
  id: string;
  name: string;
  description: string;
  type: 'kpi' | 'anomaly' | 'threshold' | 'trend' | 'custom';
  status: 'active' | 'paused' | 'triggered';
  severity: 'low' | 'medium' | 'high' | 'critical';
  metric: string;
  condition: 'greater_than' | 'less_than' | 'equals' | 'not_equals' | 'changes_by' | 'no_change_for';
  threshold: number;
  recipients: string[];
  channels: ('email' | 'sms' | 'slack' | 'dashboard')[];
  lastTriggered?: Date;
  triggeredCount: number;
  isAcknowledged?: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  createdBy: string;
  createdAt: Date;
}

interface ReportExecution {
  id: string;
  reportId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  fileSize?: number;
  downloadUrl?: string;
  errorMessage?: string;
  triggeredBy: 'schedule' | 'manual' | 'api';
}

const AutomatedReportingDashboard: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [executions, setExecutions] = useState<ReportExecution[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('reports');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Mock data generation
  useEffect(() => {
    const generateMockData = () => {
      const mockReports: Report[] = [
        {
          id: 'r1',
          name: 'Daily Revenue Report',
          description: 'Comprehensive daily revenue analysis with breakdown by service category and payment method',
          type: 'financial',
          frequency: 'daily',
          recipients: ['ceo@mariia.com', 'finance@mariia.com'],
          status: 'active',
          lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000),
          nextRun: new Date(Date.now() + 22 * 60 * 60 * 1000),
          format: 'pdf',
          metrics: ['revenue', 'bookings', 'avg_ticket_value', 'conversion_rate'],
          filters: { dateRange: 'last_24_hours' },
          createdBy: 'admin',
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          schedule: { hour: 8, minute: 0 }
        },
        {
          id: 'r2',
          name: 'Weekly Customer Analytics',
          description: 'Detailed customer behavior analysis including CLV, churn risk, and segmentation',
          type: 'customer',
          frequency: 'weekly',
          recipients: ['marketing@mariia.com', 'customer-service@mariia.com'],
          status: 'active',
          lastRun: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          nextRun: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
          format: 'dashboard',
          metrics: ['customer_acquisition', 'retention_rate', 'clv', 'satisfaction_score'],
          filters: { segment: 'all', dateRange: 'last_7_days' },
          createdBy: 'admin',
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          schedule: { hour: 9, minute: 0, dayOfWeek: 1 }
        },
        {
          id: 'r3',
          name: 'Monthly Performance Dashboard',
          description: 'Executive dashboard with KPIs, trends, and strategic insights',
          type: 'operational',
          frequency: 'monthly',
          recipients: ['ceo@mariia.com', 'coo@mariia.com', 'board@mariia.com'],
          status: 'active',
          lastRun: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          nextRun: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000),
          format: 'powerpoint',
          metrics: ['revenue', 'profit_margin', 'customer_growth', 'operational_efficiency'],
          filters: { dateRange: 'last_month' },
          createdBy: 'admin',
          createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          schedule: { hour: 10, minute: 0, dayOfMonth: 1 }
        },
        {
          id: 'r4',
          name: 'Marketing Campaign Analysis',
          description: 'Performance analysis of marketing campaigns with ROI and attribution',
          type: 'marketing',
          frequency: 'weekly',
          recipients: ['marketing@mariia.com'],
          status: 'paused',
          lastRun: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          format: 'excel',
          metrics: ['campaign_performance', 'roi', 'conversion_rates', 'acquisition_cost'],
          filters: { dateRange: 'last_7_days', channel: 'all' },
          createdBy: 'marketing',
          createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
          schedule: { hour: 11, minute: 0, dayOfWeek: 5 }
        }
      ];

      const mockAlerts: Alert[] = [
        {
          id: 'a1',
          name: 'Revenue Drop Alert',
          description: 'Alert when daily revenue drops by more than 20% compared to previous week',
          type: 'threshold',
          status: 'active',
          severity: 'high',
          metric: 'daily_revenue',
          condition: 'less_than',
          threshold: -20,
          recipients: ['ceo@mariia.com', 'finance@mariia.com'],
          channels: ['email', 'dashboard'],
          lastTriggered: new Date(Date.now() - 24 * 60 * 60 * 1000),
          triggeredCount: 2,
          createdBy: 'admin',
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        },
        {
          id: 'a2',
          name: 'Customer Satisfaction Threshold',
          description: 'Alert when customer satisfaction score falls below 4.5 stars',
          type: 'kpi',
          status: 'active',
          severity: 'medium',
          metric: 'satisfaction_score',
          condition: 'less_than',
          threshold: 4.5,
          recipients: ['customer-service@mariia.com', 'quality@mariia.com'],
          channels: ['email', 'sms'],
          lastTriggered: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          triggeredCount: 1,
          createdBy: 'admin',
          createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)
        },
        {
          id: 'a3',
          name: 'Booking Anomaly Detection',
          description: 'Detect unusual booking patterns that might indicate system issues or fraud',
          type: 'anomaly',
          status: 'active',
          severity: 'critical',
          metric: 'booking_pattern',
          condition: 'changes_by',
          threshold: 50,
          recipients: ['tech@mariia.com', 'security@mariia.com'],
          channels: ['email', 'slack', 'sms'],
          lastTriggered: new Date(Date.now() - 6 * 60 * 60 * 1000),
          triggeredCount: 1,
          isAcknowledged: true,
          acknowledgedBy: 'tech-lead',
          acknowledgedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
          createdBy: 'admin',
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
        },
        {
          id: 'a4',
          name: 'Weekly Growth Target',
          description: 'Alert when weekly bookings growth doesn\'t meet 10% target',
          type: 'trend',
          status: 'paused',
          severity: 'low',
          metric: 'weekly_booking_growth',
          condition: 'greater_than',
          threshold: 10,
          recipients: ['marketing@mariia.com'],
          channels: ['email'],
          lastTriggered: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          triggeredCount: 3,
          createdBy: 'marketing',
          createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000)
        }
      ];

      const mockExecutions: ReportExecution[] = [
        {
          id: 'e1',
          reportId: 'r1',
          status: 'completed',
          startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
          endTime: new Date(Date.now() - 1.8 * 60 * 60 * 1000),
          fileSize: 2048576,
          downloadUrl: '/api/reports/download/daily-revenue-2024-01-30.pdf',
          triggeredBy: 'schedule'
        },
        {
          id: 'e2',
          reportId: 'r3',
          status: 'completed',
          startTime: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          endTime: new Date(Date.now() - 14.9 * 24 * 60 * 60 * 1000),
          fileSize: 5242880,
          downloadUrl: '/api/reports/download/monthly-performance-2024-01.pptx',
          triggeredBy: 'schedule'
        },
        {
          id: 'e3',
          reportId: 'r2',
          status: 'failed',
          startTime: new Date(Date.now() - 30 * 60 * 1000),
          endTime: new Date(Date.now() - 25 * 60 * 1000),
          errorMessage: 'Database connection timeout',
          triggeredBy: 'manual'
        }
      ];

      setReports(mockReports);
      setAlerts(mockAlerts);
      setExecutions(mockExecutions);
      setLoading(false);
    };

    setTimeout(generateMockData, 1000);
  }, []);

  // Filter functions
  const filteredReports = reports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || report.type === filterType;
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Handler functions
  const handleRunReport = async (reportId: string) => {
    const newExecution: ReportExecution = {
      id: `e${Date.now()}`,
      reportId,
      status: 'running',
      startTime: new Date(),
      triggeredBy: 'manual'
    };
    setExecutions([newExecution, ...executions]);

    // Simulate execution
    setTimeout(() => {
      setExecutions(prev => prev.map(exec =>
        exec.id === newExecution.id
          ? {
              ...exec,
              status: 'completed',
              endTime: new Date(),
              fileSize: Math.floor(Math.random() * 5000000) + 1000000,
              downloadUrl: `/api/reports/download/report-${reportId}-${Date.now()}.pdf`
            }
          : exec
      ));
    }, 3000);
  };

  const handleToggleAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert =>
      alert.id === alertId
        ? { ...alert, status: alert.status === 'active' ? 'paused' : 'active' }
        : alert
    ));
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert =>
      alert.id === alertId
        ? {
            ...alert,
            isAcknowledged: true,
            acknowledgedBy: 'current-user',
            acknowledgedAt: new Date()
          }
        : alert
    ));
  };

  // Format functions
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'completed': return 'bg-green-500';
      case 'running': return 'bg-blue-500';
      case 'failed': return 'bg-red-500';
      case 'triggered': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-lg font-medium">Loading Automated Reporting System...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Automated Reporting & Alerts</h1>
          <p className="text-muted-foreground">
            Schedule automated reports and set up intelligent alerts for key business metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Report
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Automated Report</DialogTitle>
                <DialogDescription>
                  Set up a new automated report with custom metrics and schedule
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="report-name" className="text-right">
                    Report Name
                  </Label>
                  <Input id="report-name" className="col-span-3" placeholder="Enter report name" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="report-type" className="text-right">
                    Type
                  </Label>
                  <Select>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="financial">Financial</SelectItem>
                      <SelectItem value="operational">Operational</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="frequency" className="text-right">
                    Frequency
                  </Label>
                  <Select>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                      <SelectItem value="on_demand">On Demand</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="format" className="text-right">
                    Format
                  </Label>
                  <Select>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select output format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                      <SelectItem value="powerpoint">PowerPoint</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="dashboard">Interactive Dashboard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="recipients" className="text-right">
                    Recipients
                  </Label>
                  <Input id="recipients" className="col-span-3" placeholder="Enter email addresses separated by commas" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Textarea id="description" className="col-span-3" placeholder="Describe what this report contains" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline">Cancel</Button>
                <Button>Create Report</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Bell className="h-4 w-4 mr-2" />
                New Alert
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Alert</DialogTitle>
                <DialogDescription>
                  Set up an intelligent alert for key business metrics
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="alert-name" className="text-right">
                    Alert Name
                  </Label>
                  <Input id="alert-name" className="col-span-3" placeholder="Enter alert name" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="metric" className="text-right">
                    Metric
                  </Label>
                  <Select>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select metric to monitor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="revenue">Revenue</SelectItem>
                      <SelectItem value="bookings">Bookings</SelectItem>
                      <SelectItem value="customer_satisfaction">Customer Satisfaction</SelectItem>
                      <SelectItem value="conversion_rate">Conversion Rate</SelectItem>
                      <SelectItem value="website_traffic">Website Traffic</SelectItem>
                      <SelectItem value="churn_rate">Churn Rate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="condition" className="text-right">
                    Condition
                  </Label>
                  <Select>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="greater_than">Greater Than</SelectItem>
                      <SelectItem value="less_than">Less Than</SelectItem>
                      <SelectItem value="equals">Equals</SelectItem>
                      <SelectItem value="changes_by">Changes By</SelectItem>
                      <SelectItem value="no_change_for">No Change For</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="threshold" className="text-right">
                    Threshold
                  </Label>
                  <Input id="threshold" className="col-span-3" type="number" placeholder="Enter threshold value" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="severity" className="text-right">
                    Severity
                  </Label>
                  <Select>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select severity level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="channels" className="text-right">
                    Channels
                  </Label>
                  <Select>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select notification aria-live="polite" aria-atomic="true" channels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="slack">Slack</SelectItem>
                      <SelectItem value="dashboard">Dashboard Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline">Cancel</Button>
                <Button>Create Alert</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reports and alerts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="financial">Financial</SelectItem>
            <SelectItem value="operational">Operational</SelectItem>
            <SelectItem value="marketing">Marketing</SelectItem>
            <SelectItem value="customer">Customer</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="reports">Automated Reports</TabsTrigger>
          <TabsTrigger value="alerts">Smart Alerts</TabsTrigger>
          <TabsTrigger value="executions">Execution History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredReports.map((report) => (
              <Card key={report.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <CardTitle className="text-lg">{report.name}</CardTitle>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(report.status)}`} />
                  </div>
                  <CardDescription>{report.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Type:</span>
                    <Badge variant="secondary">{report.type}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Frequency:</span>
                    <span className="font-medium">{report.frequency}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Format:</span>
                    <span className="font-medium uppercase">{report.format}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Recipients:</span>
                    <span className="font-medium">{report.recipients.length}</span>
                  </div>
                  {report.lastRun && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Last run:</span>
                      <span className="font-medium">{formatDate(report.lastRun)}</span>
                    </div>
                  )}
                  {report.nextRun && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Next run:</span>
                      <span className="font-medium">{formatDate(report.nextRun)}</span>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleRunReport(report.id)}
                      disabled={executions.some(e => e.reportId === report.id && e.status === 'running')}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Run Now
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {filteredAlerts.map((alert) => (
              <Card key={alert.id} className={`border-l-4 ${
                alert.severity === 'critical' ? 'border-l-red-500' :
                alert.severity === 'high' ? 'border-l-orange-500' :
                alert.severity === 'medium' ? 'border-l-yellow-500' : 'border-l-blue-500'
              }`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={`h-5 w-5 ${
                        alert.severity === 'critical' ? 'text-red-500' :
                        alert.severity === 'high' ? 'text-orange-500' :
                        alert.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                      }`} />
                      <CardTitle className="text-lg">{alert.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(alert.status)}`} />
                      <Switch
                        checked={alert.status === 'active'}
                        onCheckedChange={() => handleToggleAlert(alert.id)}
                      />
                    </div>
                  </div>
                  <CardDescription>{alert.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Metric:</span>
                    <span className="font-medium">{alert.metric.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Condition:</span>
                    <span className="font-medium">{alert.condition.replace('_', ' ')} {alert.threshold}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Severity:</span>
                    <Badge className={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Channels:</span>
                    <div className="flex gap-1">
                      {alert.channels.map((channel) => (
                        <Badge key={channel} variant="outline" className="text-xs">
                          {channel}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {alert.lastTriggered && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Last triggered:</span>
                      <span className="font-medium">{formatDate(alert.lastTriggered)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Triggered count:</span>
                    <span className="font-medium">{alert.triggeredCount} times</span>
                  </div>
                  {alert.isAcknowledged ? (
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        Acknowledged by {alert.acknowledgedBy} at {formatDate(alert.acknowledgedAt!)}
                      </AlertDescription>
                    </Alert>
                  ) : alert.status === 'triggered' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAcknowledgeAlert(alert.id)}
                      className="w-full"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Acknowledge Alert
                    </Button>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="executions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Report Execution History</CardTitle>
              <CardDescription>
                Monitor the status and results of automated report executions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>File Size</TableHead>
                    <TableHead>Triggered By</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {executions.map((execution) => {
                    const report = reports.find(r => r.id === execution.reportId);
                    const duration = execution.endTime
                      ? Math.round((execution.endTime.getTime() - execution.startTime.getTime()) / 1000)
                      : null;

                    return (
                      <TableRow key={execution.id}>
                        <TableCell className="font-medium">{report?.name || 'Unknown'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(execution.status)}`} />
                            <span className="capitalize">{execution.status}</span>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(execution.startTime)}</TableCell>
                        <TableCell>
                          {duration ? `${duration}s` : execution.status === 'running' ? (
                            <div className="flex items-center gap-1">
                              <RefreshCw className="h-3 w-3 animate-spin" />
                              <span>Running</span>
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {execution.fileSize ? formatFileSize(execution.fileSize) : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {execution.triggeredBy.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {execution.downloadUrl ? (
                            <Button size="sm" variant="outline">
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                          ) : execution.status === 'failed' ? (
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-1" />
                              View Error
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" disabled>
                              <Clock className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reports.length}</div>
                <p className="text-xs text-muted-foreground">
                  {reports.filter(r => r.status === 'active').length} active
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                <Bell className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{alerts.filter(a => a.status === 'active').length}</div>
                <p className="text-xs text-muted-foreground">
                  {alerts.filter(a => a.status === 'triggered').length} triggered
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Executions Today</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {executions.filter(e => e.startTime > new Date(Date.now() - 24 * 60 * 60 * 1000)).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {executions.filter(e => e.status === 'completed').length} successful
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {executions.length > 0
                    ? Math.round((executions.filter(e => e.status === 'completed').length / executions.length) * 100)
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Last 30 days
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Report Execution Trends</CardTitle>
                <CardDescription>
                  Daily report execution volume and success rates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  <LineChart className="h-8 w-8 mr-2" />
                  Chart visualization would be implemented here
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Alert Trigger Patterns</CardTitle>
                <CardDescription>
                  Alert frequency and response times
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  <BarChart3 className="h-8 w-8 mr-2" />
                  Chart visualization would be implemented here
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AutomatedReportingDashboard;