import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  GitBranch,
  Server,
  Shield,
  TrendingUp,
  Zap,
  Database,
  Globe,
  Lock,
  BarChart3,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Download,
  Upload,
  Eye,
  EyeOff,
  AlertCircle,
  Info,
  ChevronRight,
  Layers,
  Cpu,
  HardDrive,
  Wifi,
  WifiOff,
  RefreshCw,
  Save,
  Terminal,
  Code,
  TestTube,
  Rocket,
  Users,
  MapPin,
  Calendar,
  DollarSign,
  Target,
  Award,
  Flag,
  Filter,
  Search,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Battery,
  BatteryCharging,
  ZapOff,
  Power,
  PowerOff,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  FileText,
  Folder,
  FolderOpen,
  Archive,
  Trash2,
  Edit,
  Copy,
  Move,
  Plus,
  Minus,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Expand,
  Minimize2,
  Maximize2,
  Fullscreen,
  ExitFullscreen,
  Monitor,
  Smartphone,
  Tablet,
  Watch,
  Tv,
  Radio,
  Headphones,
  Camera,
  Video,
  Mic,
  MicOff,
  VideoOff,
  Phone,
  PhoneOff,
  Mail,
  MailOpen,
  Send,
  Paperclip,
  Link,
  Link2,
  Unlink,
  ExternalLink,
  Home,
  Star,
  Heart,
  Bookmark,
  Tag,
  Hash,
  AtSign,
  Slash,
  Backslash,
  Pipe,
  Underscore,
  Hyphen,
  PlusCircle,
  MinusCircle,
  XCircle,
  CheckCircle2,
  AlertCircle as AlertCircleIcon,
  HelpCircle,
  Info as InfoIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown,
  Activity as ActivityIcon,
  BarChart,
  PieChart,
  LineChart,
  AreaChart,
  ScatterChart,
  Heatmap,
  Gauge,
  Timer,
  Stopwatch,
  Sundial,
  CalendarDays,
  Clock as ClockIcon,
  Clock1,
  Clock2,
  Clock3,
  Clock4,
  Clock5,
  Clock6,
  Clock7,
  Clock8,
  Clock9,
  Clock10,
  Clock11,
  Clock12
} from 'lucide-react';

interface SystemStatus {
  name: string;
  status: 'healthy' | 'warning' | 'critical' | 'offline';
  uptime: number;
  lastCheck: string;
  metrics: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
  alerts: number;
  services: ServiceStatus[];
}

interface ServiceStatus {
  name: string;
  status: 'running' | 'stopped' | 'error';
  version: string;
  port?: number;
  url?: string;
}

interface DeploymentStatus {
  id: string;
  environment: 'development' | 'staging' | 'production';
  version: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'rolling_back';
  progress: number;
  startTime: string;
  estimatedDuration: number;
  commit: string;
  author: string;
  changes: number;
  testsPassed: number;
  testsTotal: number;
  performanceScore: number;
  securityScore: number;
}

interface SecurityAlert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  description: string;
  source: string;
  timestamp: string;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  assignedTo?: string;
  impact: string;
  remediation: string;
}

interface PerformanceMetrics {
  timestamp: string;
  responseTime: number;
  throughput: number;
  errorRate: number;
  availability: number;
  coreWebVitals: {
    lcp: number;
    fid: number;
    cls: number;
    fcp: number;
    ttfb: number;
  };
  userMetrics: {
    activeUsers: number;
    sessionDuration: number;
    bounceRate: number;
    conversionRate: number;
  };
  businessMetrics: {
    revenue: number;
    bookings: number;
    customerSatisfaction: number;
    supportTickets: number;
  };
}

interface CostAnalysis {
  period: string;
  totalCost: number;
  services: {
    name: string;
    cost: number;
    usage: number;
    trend: 'up' | 'down' | 'stable';
    optimization: string;
  }[];
  forecast: {
    nextMonth: number;
    nextQuarter: number;
    nextYear: number;
  };
  savings: {
    potential: number;
    realized: number;
    recommendations: string[];
  };
}

interface AutomationWorkflow {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'disabled' | 'error';
  schedule: string;
  lastRun: string;
  nextRun: string;
  successRate: number;
  duration: number;
  triggers: string[];
  actions: string[];
  dependencies: string[];
  notification aria-live="polite" aria-atomic="true"s: string[];
  logs: WorkflowLog[];
}

interface WorkflowLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  details?: any;
}

interface BackupStatus {
  id: string;
  type: 'database' | 'files' | 'configuration' | 'full';
  environment: 'development' | 'staging' | 'production';
  status: 'running' | 'completed' | 'failed' | 'scheduled';
  size: number;
  duration: number;
  location: string;
  retention: string;
  lastBackup: string;
  nextBackup: string;
  verification: 'passed' | 'failed' | 'pending';
}

interface ComplianceReport {
  id: string;
  framework: string;
  status: 'compliant' | 'non_compliant' | 'partial' | 'pending';
  score: number;
  lastAssessment: string;
  requirements: {
    name: string;
    status: 'compliant' | 'non_compliant' | 'not_applicable';
    evidence: string;
    lastVerified: string;
  }[];
  exceptions: string[];
  remediation: string[];
}

const DevOpsCommandCenter: React.FC = () => {
  const [selectedView, setSelectedView] = useState('overview');
  const [systems, setSystems] = useState<SystemStatus[]>([]);
  const [deployments, setDeployments] = useState<DeploymentStatus[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [performance, setPerformance] = useState<PerformanceMetrics[]>([]);
  const [costs, setCosts] = useState<CostAnalysis | null>(null);
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>([]);
  const [backups, setBackups] = useState<BackupStatus[]>([]);
  const [compliance, setCompliance] = useState<ComplianceReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [notification aria-live="polite" aria-atomic="true"s, setNotifications] = useState(true);

  // Initialize mock data
  useEffect(() => {
    initializeData();
    const interval = setInterval(() => {
      if (autoRefresh) {
        refreshData();
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const initializeData = () => {
    // Initialize system statuses
    setSystems([
      {
        name: 'Web Application',
        status: 'healthy',
        uptime: 99.9,
        lastCheck: new Date().toISOString(),
        metrics: { cpu: 45, memory: 62, disk: 78, network: 23 },
        alerts: 0,
        services: [
          { name: 'Frontend', status: 'running', version: '1.2.0', url: 'https://mariaborysevych.com' },
          { name: 'API', status: 'running', version: '2.1.4', port: 3000 },
          { name: 'CDN', status: 'running', version: 'edge', url: 'https://cdn.mariaborysevych.com' }
        ]
      },
      {
        name: 'Database',
        status: 'healthy',
        uptime: 99.95,
        lastCheck: new Date().toISOString(),
        metrics: { cpu: 32, memory: 71, disk: 65, network: 15 },
        alerts: 0,
        services: [
          { name: 'PostgreSQL', status: 'running', version: '15.4', port: 5432 },
          { name: 'Connection Pool', status: 'running', version: '1.5.0' },
          { name: 'Backup Service', status: 'running', version: '2.0.1' }
        ]
      },
      {
        name: 'Authentication',
        status: 'healthy',
        uptime: 99.8,
        lastCheck: new Date().toISOString(),
        metrics: { cpu: 28, memory: 45, disk: 52, network: 18 },
        alerts: 0,
        services: [
          { name: 'Supabase Auth', status: 'running', version: '3.2.0', url: 'https://auth.supabase.co' },
          { name: 'JWT Service', status: 'running', version: '1.8.0' },
          { name: 'Session Store', status: 'running', version: '2.1.0' }
        ]
      },
      {
        name: 'Monitoring',
        status: 'warning',
        uptime: 98.5,
        lastCheck: new Date().toISOString(),
        metrics: { cpu: 68, memory: 82, disk: 71, network: 45 },
        alerts: 2,
        services: [
          { name: 'Sentry', status: 'running', version: '4.12.0', url: 'https://sentry.io' },
          { name: 'Metrics Collector', status: 'error', version: '3.5.0' },
          { name: 'Log Aggregator', status: 'running', version: '2.8.0' }
        ]
      }
    ]);

    // Initialize deployments
    setDeployments([
      {
        id: 'deploy-001',
        environment: 'production',
        version: 'v1.2.0',
        status: 'success',
        progress: 100,
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        estimatedDuration: 15,
        commit: 'abc1234',
        author: 'ivan',
        changes: 24,
        testsPassed: 142,
        testsTotal: 145,
        performanceScore: 94,
        securityScore: 96
      },
      {
        id: 'deploy-002',
        environment: 'staging',
        version: 'v1.2.1-beta',
        status: 'running',
        progress: 65,
        startTime: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        estimatedDuration: 20,
        commit: 'def5678',
        author: 'maria',
        changes: 18,
        testsPassed: 98,
        testsTotal: 105,
        performanceScore: 91,
        securityScore: 94
      }
    ]);

    // Initialize security alerts
    setSecurityAlerts([
      {
        id: 'sec-001',
        severity: 'high',
        type: 'Suspicious Login Pattern',
        description: 'Multiple failed login attempts detected from unusual IP range',
        source: 'Authentication Service',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        status: 'investigating',
        assignedTo: 'security-team',
        impact: 'User authentication security',
        remediation: 'Review and block suspicious IP addresses'
      },
      {
        id: 'sec-002',
        severity: 'medium',
        type: 'Outdated Dependency',
        description: 'Security vulnerability detected in lodash package',
        source: 'Dependency Scanner',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        status: 'open',
        impact: 'Potential security risk',
        remediation: 'Update lodash to latest version'
      }
    ]);

    // Initialize performance metrics
    const now = new Date();
    setPerformance(Array.from({ length: 24 }, (_, i) => ({
      timestamp: new Date(now.getTime() - i * 60 * 60 * 1000).toISOString(),
      responseTime: 120 + Math.random() * 80,
      throughput: 450 + Math.random() * 200,
      errorRate: Math.random() * 2,
      availability: 99 + Math.random(),
      coreWebVitals: {
        lcp: 1.8 + Math.random() * 0.7,
        fid: 45 + Math.random() * 55,
        cls: 0.05 + Math.random() * 0.1,
        fcp: 1.2 + Math.random() * 0.6,
        ttfb: 150 + Math.random() * 100
      },
      userMetrics: {
        activeUsers: 120 + Math.floor(Math.random() * 50),
        sessionDuration: 4.5 + Math.random() * 2.5,
        bounceRate: 20 + Math.random() * 15,
        conversionRate: 3.2 + Math.random() * 1.8
      },
      businessMetrics: {
        revenue: 1250 + Math.random() * 750,
        bookings: 15 + Math.floor(Math.random() * 10),
        customerSatisfaction: 4.2 + Math.random() * 0.8,
        supportTickets: 2 + Math.floor(Math.random() * 3)
      }
    })));

    // Initialize cost analysis
    setCosts({
      period: 'November 2024',
      totalCost: 189.50,
      services: [
        { name: 'Vercel Pro', cost: 20.00, usage: 85, trend: 'stable', optimization: 'Optimize edge functions' },
        { name: 'Supabase Pro', cost: 45.00, usage: 72, trend: 'up', optimization: 'Optimize database queries' },
        { name: 'Sentry', cost: 26.00, usage: 60, trend: 'stable', optimization: 'Reduce error volume' },
        { name: 'Stripe Processing', cost: 78.50, usage: 90, trend: 'up', optimization: 'Reduce failed transactions' },
        { name: 'Domain & SSL', cost: 20.00, usage: 100, trend: 'stable', optimization: 'Consolidate domains' }
      ],
      forecast: {
        nextMonth: 195.00,
        nextQuarter: 585.00,
        nextYear: 2340.00
      },
      savings: {
        potential: 25.00,
        realized: 12.50,
        recommendations: [
          'Optimize database query performance',
          'Reduce CDN bandwidth usage',
          'Consolidate monitoring tools',
          'Implement better error handling'
        ]
      }
    });

    // Initialize automation workflows
    setWorkflows([
      {
        id: 'workflow-001',
        name: 'Nightly Backup',
        description: 'Automated database and file backups',
        status: 'active',
        schedule: '0 2 * * *',
        lastRun: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        nextRun: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
        successRate: 99.2,
        duration: 12,
        triggers: ['schedule'],
        actions: ['database_backup', 'file_backup', 'verification'],
        dependencies: [],
        notification aria-live="polite" aria-atomic="true"s: ['email', 'slack'],
        logs: []
      },
      {
        id: 'workflow-002',
        name: 'Security Scan',
        description: 'Automated security vulnerability scanning',
        status: 'active',
        schedule: '0 6 * * 1',
        lastRun: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        nextRun: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        successRate: 100,
        duration: 8,
        triggers: ['schedule'],
        actions: ['dependency_check', 'code_analysis', 'report_generation'],
        dependencies: [],
        notification aria-live="polite" aria-atomic="true"s: ['email', 'slack'],
        logs: []
      },
      {
        id: 'workflow-003',
        name: 'Performance Testing',
        description: 'Automated performance and load testing',
        status: 'paused',
        schedule: '0 4 * * *',
        lastRun: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        nextRun: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        successRate: 95.5,
        duration: 25,
        triggers: ['schedule', 'deployment'],
        actions: ['load_test', 'lighthouse_audit', 'report_generation'],
        dependencies: ['staging_deployment'],
        notification aria-live="polite" aria-atomic="true"s: ['slack'],
        logs: []
      }
    ]);

    // Initialize backup statuses
    setBackups([
      {
        id: 'backup-001',
        type: 'database',
        environment: 'production',
        status: 'completed',
        size: 245.6,
        duration: 8,
        location: 's3://backups/production/db/',
        retention: '90 days',
        lastBackup: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        nextBackup: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
        verification: 'passed'
      },
      {
        id: 'backup-002',
        type: 'files',
        environment: 'production',
        status: 'running',
        size: 1024.8,
        duration: 15,
        location: 's3://backups/production/files/',
        retention: '30 days',
        lastBackup: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        nextBackup: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
        verification: 'pending'
      },
      {
        id: 'backup-003',
        type: 'full',
        environment: 'staging',
        status: 'scheduled',
        size: 512.3,
        duration: 20,
        location: 's3://backups/staging/full/',
        retention: '7 days',
        lastBackup: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        nextBackup: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
        verification: 'passed'
      }
    ]);

    // Initialize compliance reports
    setCompliance([
      {
        id: 'compliance-001',
        framework: 'GDPR',
        status: 'compliant',
        score: 94,
        lastAssessment: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        requirements: [
          {
            name: 'Data Protection Impact Assessment',
            status: 'compliant',
            evidence: 'DPIA documentation available',
            lastVerified: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            name: 'User Consent Management',
            status: 'compliant',
            evidence: 'Consent tracking system implemented',
            lastVerified: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            name: 'Data Breach Notification',
            status: 'compliant',
            evidence: 'Automated notification aria-live="polite" aria-atomic="true" procedures',
            lastVerified: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
          }
        ],
        exceptions: [],
        remediation: []
      },
      {
        id: 'compliance-002',
        framework: 'SOC 2 Type II',
        status: 'partial',
        score: 87,
        lastAssessment: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        requirements: [
          {
            name: 'Security Controls',
            status: 'compliant',
            evidence: 'Security framework implemented',
            lastVerified: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            name: 'Availability Monitoring',
            status: 'non_compliant',
            evidence: 'Monitoring coverage incomplete',
            lastVerified: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
          }
        ],
        exceptions: ['Monitoring coverage needs improvement'],
        remediation: ['Implement comprehensive monitoring across all services']
      }
    ]);

    setIsLoading(false);
  };

  const refreshData = () => {
    // In a real implementation, this would fetch fresh data from APIs
    console.log('Refreshing DevOps data...');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'running':
      case 'success':
      case 'completed':
      case 'compliant':
        return 'text-green-600 bg-green-100';
      case 'warning':
      case 'pending':
      case 'partial':
        return 'text-yellow-600 bg-yellow-100';
      case 'critical':
      case 'error':
      case 'failed':
      case 'non_compliant':
        return 'text-red-600 bg-red-100';
      case 'offline':
      case 'stopped':
      case 'disabled':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'running':
      case 'success':
      case 'completed':
      case 'compliant':
        return <CheckCircle className="h-4 w-4" />;
      case 'warning':
      case 'pending':
      case 'partial':
        return <AlertTriangle className="h-4 w-4" />;
      case 'critical':
      case 'error':
      case 'failed':
      case 'non_compliant':
        return <XCircle className="h-4 w-4" />;
      case 'offline':
      case 'stopped':
      case 'disabled':
        return <PowerOff className="h-4 w-4" />;
      default:
        return <ActivityIcon className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <RefreshCw className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Loading DevOps Command Center...</h3>
              <p className="text-gray-600 mt-2">Initializing systems and gathering metrics</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">DevOps Command Center</h1>
            <p className="text-gray-600 mt-1">Enterprise-grade infrastructure orchestration and monitoring</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="flex items-center space-x-2"
            >
              {autoRefresh ? <RefreshCw className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              <span>{autoRefresh ? 'Auto Refresh' : 'Manual'}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNotifications(!notification aria-live="polite" aria-atomic="true"s)}
              className="flex items-center space-x-2"
            >
              {notification aria-live="polite" aria-atomic="true"s ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
              <span>{notification aria-live="polite" aria-atomic="true"s ? 'Notifications On' : 'Notifications Off'}</span>
            </Button>
            <Button variant="outline" size="sm" onClick={refreshData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">System Health</p>
                  <p className="text-2xl font-bold text-green-600">99.2%</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Activity className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Deployments</p>
                  <p className="text-2xl font-bold text-blue-600">{deployments.filter(d => d.status === 'running').length}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Rocket className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Security Alerts</p>
                  <p className="text-2xl font-bold text-orange-600">{securityAlerts.filter(a => a.status === 'open').length}</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <Shield className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Monthly Cost</p>
                  <p className="text-2xl font-bold text-purple-600">${costs?.totalCost.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={selectedView} onValueChange={setSelectedView} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="systems">Systems</TabsTrigger>
            <TabsTrigger value="deployments">Deployments</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="automation">Automation</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* System Status Overview */}
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Server className="h-5 w-5" />
                    <span>System Status</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {systems.map((system) => (
                      <div key={system.name} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(system.status)}
                          <div>
                            <p className="font-medium">{system.name}</p>
                            <p className="text-sm text-gray-600">{system.services.filter(s => s.status === 'running').length}/{system.services.length} services</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(system.status)}>{system.status}</Badge>
                          <p className="text-sm text-gray-600 mt-1">{system.uptime}% uptime</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5" />
                    <span>Recent Activity</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 border rounded-lg">
                      <div className="p-2 bg-green-100 rounded-full">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Production Deployment Completed</p>
                        <p className="text-sm text-gray-600">v1.2.0 deployed successfully by ivan</p>
                      </div>
                      <span className="text-sm text-gray-500">2 hours ago</span>
                    </div>

                    <div className="flex items-center space-x-3 p-3 border rounded-lg">
                      <div className="p-2 bg-yellow-100 rounded-full">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Security Alert Triggered</p>
                        <p className="text-sm text-gray-600">Suspicious login pattern detected</p>
                      </div>
                      <span className="text-sm text-gray-500">30 minutes ago</span>
                    </div>

                    <div className="flex items-center space-x-3 p-3 border rounded-lg">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <Database className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Database Backup Completed</p>
                        <p className="text-sm text-gray-600">245.6MB backed up successfully</p>
                      </div>
                      <span className="text-sm text-gray-500">6 hours ago</span>
                    </div>

                    <div className="flex items-center space-x-3 p-3 border rounded-lg">
                      <div className="p-2 bg-purple-100 rounded-full">
                        <Zap className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Performance Test Passed</p>
                        <p className="text-sm text-gray-600">All benchmarks within thresholds</p>
                      </div>
                      <span className="text-sm text-gray-500">12 hours ago</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Overview */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Performance Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Response Time</p>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                      </div>
                      <span className="text-sm font-medium">156ms</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Error Rate</p>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '15%' }}></div>
                      </div>
                      <span className="text-sm font-medium">0.8%</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Availability</p>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '99.2%' }}></div>
                      </div>
                      <span className="text-sm font-medium">99.2%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Systems Tab */}
          <TabsContent value="systems" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {systems.map((system) => (
                <Card key={system.name} className="bg-white">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center space-x-2">
                        {getStatusIcon(system.status)}
                        <span>{system.name}</span>
                      </CardTitle>
                      <Badge className={getStatusColor(system.status)}>{system.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Metrics */}
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-2">Resource Usage</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="flex justify-between text-sm">
                              <span>CPU</span>
                              <span>{system.metrics.cpu}%</span>
                            </div>
                            <Progress value={system.metrics.cpu} className="h-2" />
                          </div>
                          <div>
                            <div className="flex justify-between text-sm">
                              <span>Memory</span>
                              <span>{system.metrics.memory}%</span>
                            </div>
                            <Progress value={system.metrics.memory} className="h-2" />
                          </div>
                          <div>
                            <div className="flex justify-between text-sm">
                              <span>Disk</span>
                              <span>{system.metrics.disk}%</span>
                            </div>
                            <Progress value={system.metrics.disk} className="h-2" />
                          </div>
                          <div>
                            <div className="flex justify-between text-sm">
                              <span>Network</span>
                              <span>{system.metrics.network}%</span>
                            </div>
                            <Progress value={system.metrics.network} className="h-2" />
                          </div>
                        </div>
                      </div>

                      {/* Services */}
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-2">Services</p>
                        <div className="space-y-2">
                          {system.services.map((service) => (
                            <div key={service.name} className="flex items-center justify-between text-sm">
                              <div className="flex items-center space-x-2">
                                {getStatusIcon(service.status)}
                                <span>{service.name}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-gray-600">{service.version}</span>
                                {service.url && (
                                  <Button variant="ghost" size="sm" asChild>
                                    <a href={service.url} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* System Info */}
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Uptime: {system.uptime}%</span>
                        <span>Last check: {new Date(system.lastCheck).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Deployments Tab */}
          <TabsContent value="deployments" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {deployments.map((deployment) => (
                <Card key={deployment.id} className="bg-white">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center space-x-2">
                        <GitBranch className="h-5 w-5" />
                        <span>Deployment #{deployment.id}</span>
                      </CardTitle>
                      <Badge className={getStatusColor(deployment.status)}>
                        {deployment.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Deployment Info */}
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-3">Deployment Details</p>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Environment:</span>
                            <Badge variant="outline">{deployment.environment}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Version:</span>
                            <span className="font-medium">{deployment.version}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Commit:</span>
                            <span className="font-mono">{deployment.commit}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Author:</span>
                            <span>{deployment.author}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Changes:</span>
                            <span>{deployment.changes} files</span>
                          </div>
                        </div>
                      </div>

                      {/* Progress */}
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-3">Progress</p>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Deployment Progress</span>
                              <span>{deployment.progress}%</span>
                            </div>
                            <Progress value={deployment.progress} className="h-2" />
                          </div>
                          <div className="text-sm text-gray-600">
                            <p>Started: {new Date(deployment.startTime).toLocaleString()}</p>
                            <p>Duration: {Math.round((Date.now() - new Date(deployment.startTime).getTime()) / 60000)}min</p>
                            <p>Estimated: {deployment.estimatedDuration}min</p>
                          </div>
                        </div>
                      </div>

                      {/* Quality Metrics */}
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-3">Quality Metrics</p>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Tests:</span>
                            <span className="text-sm font-medium">{deployment.testsPassed}/{deployment.testsTotal}</span>
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Performance Score</span>
                              <span>{deployment.performanceScore}/100</span>
                            </div>
                            <Progress value={deployment.performanceScore} className="h-2" />
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Security Score</span>
                              <span>{deployment.securityScore}/100</span>
                            </div>
                            <Progress value={deployment.securityScore} className="h-2" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Security Alerts */}
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Security Alerts</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {securityAlerts.map((alert) => (
                      <div key={alert.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Badge className={getSeverityColor(alert.severity)}>
                              {alert.severity.toUpperCase()}
                            </Badge>
                            <span className="font-medium">{alert.type}</span>
                          </div>
                          <Badge variant="outline">{alert.status}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Source: {alert.source}</span>
                          <span>{new Date(alert.timestamp).toLocaleString()}</span>
                        </div>
                        {alert.assignedTo && (
                          <div className="mt-2 text-sm">
                            <span className="text-gray-600">Assigned to: </span>
                            <span className="font-medium">{alert.assignedTo}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Compliance Status */}
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5" />
                    <span>Compliance Status</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {compliance.map((report) => (
                      <div key={report.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium">{report.framework}</h4>
                            <Badge className={getStatusColor(report.status)}>
                              {report.status}
                            </Badge>
                          </div>
                          <span className="text-sm font-medium">{report.score}/100</span>
                        </div>
                        <div className="space-y-2">
                          {report.requirements.slice(0, 3).map((req, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <div className="flex items-center space-x-2">
                                {getStatusIcon(req.status)}
                                <span className="text-gray-600">{req.name}</span>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {req.status.replace('_', ' ')}
                              </Badge>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 text-xs text-gray-500">
                          Last assessed: {new Date(report.lastAssessment).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Automation Tab */}
          <TabsContent value="automation" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Automation Workflows */}
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="h-5 w-5" />
                    <span>Automation Workflows</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {workflows.map((workflow) => (
                      <div key={workflow.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Badge className={getStatusColor(workflow.status)}>
                              {workflow.status}
                            </Badge>
                            <h4 className="font-medium">{workflow.name}</h4>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-green-600">{workflow.successRate}%</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{workflow.description}</p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Schedule:</span>
                            <span className="ml-2 font-mono">{workflow.schedule}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Duration:</span>
                            <span className="ml-2">{workflow.duration}min</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Last run:</span>
                            <span className="ml-2">{new Date(workflow.lastRun).toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Next run:</span>
                            <span className="ml-2">{new Date(workflow.nextRun).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="mt-3 flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Play className="h-3 w-3 mr-1" />
                            Run Now
                          </Button>
                          <Button variant="outline" size="sm">
                            <Eye className="h-3 w-3 mr-1" />
                            View Logs
                          </Button>
                          <Button variant="outline" size="sm">
                            <Settings className="h-3 w-3 mr-1" />
                            Configure
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Backup Status */}
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <HardDrive className="h-5 w-5" />
                    <span>Backup Status</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {backups.map((backup) => (
                      <div key={backup.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Badge className={getStatusColor(backup.status)}>
                              {backup.status}
                            </Badge>
                            <span className="font-medium capitalize">{backup.type} Backup</span>
                            <Badge variant="outline">{backup.environment}</Badge>
                          </div>
                          {backup.verification === 'passed' && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Size:</span>
                            <span className="ml-2">{backup.size} MB</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Duration:</span>
                            <span className="ml-2">{backup.duration} min</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Location:</span>
                            <span className="ml-2 font-mono text-xs">{backup.location}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Retention:</span>
                            <span className="ml-2">{backup.retention}</span>
                          </div>
                        </div>
                        <div className="mt-3 text-xs text-gray-500">
                          <div>Last backup: {new Date(backup.lastBackup).toLocaleString()}</div>
                          <div>Next backup: {new Date(backup.nextBackup).toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Cost Analysis */}
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5" />
                    <span>Cost Analysis</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-purple-600">${costs?.totalCost.toFixed(2)}</p>
                      <p className="text-gray-600">Total Cost for {costs?.period}</p>
                    </div>

                    <div className="space-y-2">
                      {costs?.services.map((service, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <p className="font-medium">{service.name}</p>
                            <p className="text-sm text-gray-600">{service.usage}% utilization</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${service.cost.toFixed(2)}</p>
                            <div className="flex items-center justify-center">
                              {service.trend === 'up' && <TrendingUp className="h-3 w-3 text-red-500" />}
                              {service.trend === 'down' && <TrendingDown className="h-3 w-3 text-green-500" />}
                              {service.trend === 'stable' && <Minus className="h-3 w-3 text-gray-500" />}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-4">
                      <p className="text-sm font-medium text-gray-600 mb-2">Forecast</p>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                          <p className="font-medium">Next Month</p>
                          <p className="text-lg">${costs?.forecast.nextMonth.toFixed(0)}</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium">Next Quarter</p>
                          <p className="text-lg">${costs?.forecast.nextQuarter.toFixed(0)}</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium">Next Year</p>
                          <p className="text-lg">${costs?.forecast.nextYear.toFixed(0)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Performance Metrics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Core Web Vitals */}
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-3">Core Web Vitals</p>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>LCP (Largest Contentful Paint)</span>
                            <span className={performance[0]?.coreWebVitals.lcp < 2.5 ? 'text-green-600' : 'text-red-600'}>
                              {performance[0]?.coreWebVitals.lcp.toFixed(1)}s
                            </span>
                          </div>
                          <Progress value={Math.min((performance[0]?.coreWebVitals.lcp || 0) / 2.5 * 100, 100)} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>FID (First Input Delay)</span>
                            <span className={performance[0]?.coreWebVitals.fid < 100 ? 'text-green-600' : 'text-red-600'}>
                              {performance[0]?.coreWebVitals.fid.toFixed(0)}ms
                            </span>
                          </div>
                          <Progress value={Math.min((performance[0]?.coreWebVitals.fid || 0) / 100 * 100, 100)} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>CLS (Cumulative Layout Shift)</span>
                            <span className={performance[0]?.coreWebVitals.cls < 0.1 ? 'text-green-600' : 'text-red-600'}>
                              {performance[0]?.coreWebVitals.cls.toFixed(3)}
                            </span>
                          </div>
                          <Progress value={Math.min((performance[0]?.coreWebVitals.cls || 0) / 0.1 * 100, 100)} className="h-2" />
                        </div>
                      </div>
                    </div>

                    {/* Business Metrics */}
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-3">Business Metrics</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Active Users</p>
                          <p className="text-lg font-medium">{performance[0]?.userMetrics.activeUsers}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Session Duration</p>
                          <p className="text-lg font-medium">{performance[0]?.userMetrics.sessionDuration.toFixed(1)}min</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Conversion Rate</p>
                          <p className="text-lg font-medium">{performance[0]?.userMetrics.conversionRate.toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Satisfaction</p>
                          <p className="text-lg font-medium">{performance[0]?.businessMetrics.customerSatisfaction.toFixed(1)}/5</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DevOpsCommandCenter;