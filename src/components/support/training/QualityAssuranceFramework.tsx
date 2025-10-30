import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Filter,
  Download,
  Upload,
  Calendar,
  Clock,
  User,
  Star,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  Target,
  Award,
  Shield,
  MessageSquare,
  Phone,
  Mail,
  HeadphonesIcon,
  Eye,
  Edit,
  Trash2,
  Save,
  RefreshCw,
  Play,
  Pause,
  Flag,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  FileText,
  Settings,
  Bell,
  Zap,
  Users,
  Timer,
  Clipboard,
  CheckSquare,
  AlertCircle,
  Info,
  Lightbulb,
  BookOpen,
  GraduationCap,
  Trophy,
  Medal,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  FileSearch,
  FilterIcon
} from 'lucide-react';

interface QualityMetric {
  id: string;
  name: string;
  description: string;
  category: 'communication' | 'efficiency' | 'satisfaction' | 'compliance' | 'performance';
  type: 'percentage' | 'score' | 'time' | 'count' | 'rating';
  target: number;
  current: number;
  previous: number;
  trend: 'up' | 'down' | 'stable';
  status: 'excellent' | 'good' | 'warning' | 'critical';
  weight: number; // for overall score calculation
  lastUpdated: Date;
  frequency: 'real-time' | 'hourly' | 'daily' | 'weekly' | 'monthly';
}

interface QualityScore {
  agentId: string;
  agentName: string;
  period: string;
  overallScore: number;
  categoryScores: {
    communication: number;
    efficiency: number;
    satisfaction: number;
    compliance: number;
    technical: number;
  };
  metrics: MetricScore[];
  reviews: QualityReview[];
  achievements: QualityAchievement[];
  areasForImprovement: string[];
  strengths: string[];
  lastReviewed: Date;
  reviewer: string;
}

interface MetricScore {
  metricId: string;
  score: number;
  target: number;
  samples: number;
  details: string;
}

interface QualityReview {
  id: string;
  type: 'call' | 'chat' | 'email' | 'ticket' | 'simulation';
  date: Date;
  reviewer: string;
  overallScore: number;
  categoryScores: any;
  feedback: string;
  strengths: string[];
  improvements: string[];
  actionItems: ActionItem[];
  status: 'pending' | 'completed' | 'escalated';
}

interface ActionItem {
  id: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: Date;
  status: 'pending' | 'in-progress' | 'completed';
  assignedTo?: string;
  completedDate?: Date;
}

interface QualityAchievement {
  id: string;
  name: string;
  description: string;
  earnedAt: Date;
  points: number;
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
  icon: string;
}

interface QualityStandard {
  id: string;
  name: string;
  description: string;
  category: string;
  criteria: QualityCriteria[];
  scoringMethod: string;
  weight: number;
  mandatory: boolean;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  lastUpdated: Date;
  approvedBy: string;
}

interface QualityCriteria {
  id: string;
  name: string;
  description: string;
  weight: number;
  measurementMethod: string;
  targetValue: number;
  scoringLevels: ScoringLevel[];
}

interface ScoringLevel {
  level: number;
  name: string;
  description: string;
  minScore: number;
  maxScore: number;
}

interface MonitoringSession {
  id: string;
  agentId: string;
  agentName: string;
  type: 'call' | 'chat' | 'email' | 'ticket';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: 'active' | 'completed' | 'paused';
  reviewer: string;
  notes: string;
  scores: Partial<QualityScore>;
  realTimeMetrics: any[];
}

interface CalibrationSession {
  id: string;
  title: string;
  description: string;
  date: Date;
  participants: string[];
  facilitator: string;
  status: 'scheduled' | 'in-progress' | 'completed';
  materials: any[];
  results?: CalibrationResults;
}

interface CalibrationResults {
  averageScore: number;
  scoreRange: number;
  agreementRate: number;
  discrepancies: any[];
  actionItems: ActionItem[];
}

const QualityAssuranceFramework: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('current-month');
  const [qualityScores, setQualityScores] = useState<QualityScore[]>([]);
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetric[]>([]);
  const [monitoringSessions, setMonitoringSessions] = useState<MonitoringSession[]>([]);
  const [calibrationSessions, setCalibrationSessions] = useState<CalibrationSession[]>([]);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [selectedReview, setSelectedReview] = useState<QualityReview | null>(null);
  const [reviewData, setReviewData] = useState<any>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  // Mock data
  const mockQualityMetrics: QualityMetric[] = [
    {
      id: 'csat',
      name: 'Customer Satisfaction Score',
      description: 'Average customer satisfaction rating from post-interaction surveys',
      category: 'satisfaction',
      type: 'rating',
      target: 4.5,
      current: 4.7,
      previous: 4.6,
      trend: 'up',
      status: 'excellent',
      weight: 25,
      lastUpdated: new Date('2024-10-28'),
      frequency: 'daily'
    },
    {
      id: 'first-contact-resolution',
      name: 'First Contact Resolution',
      description: 'Percentage of issues resolved on first contact',
      category: 'efficiency',
      type: 'percentage',
      target: 85,
      current: 88,
      previous: 86,
      trend: 'up',
      status: 'excellent',
      weight: 20,
      lastUpdated: new Date('2024-10-28'),
      frequency: 'daily'
    },
    {
      id: 'response-time',
      name: 'Average Response Time',
      description: 'Average time to first response across all channels',
      category: 'efficiency',
      type: 'time',
      target: 2, // minutes
      current: 1.8,
      previous: 2.1,
      trend: 'up',
      status: 'excellent',
      weight: 15,
      lastUpdated: new Date('2024-10-28'),
      frequency: 'hourly'
    },
    {
      id: 'compliance-score',
      name: 'Compliance Adherence',
      description: 'Percentage of interactions following compliance standards',
      category: 'compliance',
      type: 'percentage',
      target: 95,
      current: 92,
      previous: 94,
      trend: 'down',
      status: 'warning',
      weight: 20,
      lastUpdated: new Date('2024-10-28'),
      frequency: 'weekly'
    },
    {
      id: 'communication-quality',
      name: 'Communication Quality Score',
      description: 'Average quality score based on communication standards',
      category: 'communication',
      type: 'score',
      target: 90,
      current: 94,
      previous: 92,
      trend: 'up',
      status: 'excellent',
      weight: 20,
      lastUpdated: new Date('2024-10-28'),
      frequency: 'daily'
    }
  ];

  const mockQualityScores: QualityScore[] = [
    {
      agentId: 'agent-1',
      agentName: 'Sarah Johnson',
      period: '2024-10',
      overallScore: 94,
      categoryScores: {
        communication: 96,
        efficiency: 92,
        satisfaction: 95,
        compliance: 93,
        technical: 94
      },
      metrics: [
        { metricId: 'csat', score: 4.8, target: 4.5, samples: 45, details: 'Consistently high ratings' },
        { metricId: 'first-contact-resolution', score: 90, target: 85, samples: 45, details: 'Excellent problem resolution' }
      ],
      reviews: [
        {
          id: 'review-1',
          type: 'call',
          date: new Date('2024-10-27'),
          reviewer: 'Jane Smith',
          overallScore: 95,
          categoryScores: { communication: 96, efficiency: 94, satisfaction: 95 },
          feedback: 'Excellent empathy and problem-solving skills',
          strengths: ['Active listening', 'Product knowledge', 'Professional tone'],
          improvements: ['Could be more concise in explanations'],
          actionItems: [
            { id: 'ai-1', description: 'Review call handling efficiency tips', priority: 'low', dueDate: new Date('2024-11-05'), status: 'pending' }
          ],
          status: 'completed'
        }
      ],
      achievements: [
        {
          id: 'ach-1',
          name: 'Customer Satisfaction Champion',
          description: 'Maintained 4.8+ CSAT for 3 consecutive months',
          earnedAt: new Date('2024-10-01'),
          points: 50,
          level: 'gold',
          icon: '🏆'
        }
      ],
      areasForImprovement: ['Call efficiency', 'Technical troubleshooting depth'],
      strengths: ['Customer empathy', 'Brand voice consistency', 'VIP service excellence'],
      lastReviewed: new Date('2024-10-27'),
      reviewer: 'Jane Smith'
    },
    {
      agentId: 'agent-2',
      agentName: 'Michael Chen',
      period: '2024-10',
      overallScore: 87,
      categoryScores: {
        communication: 85,
        efficiency: 90,
        satisfaction: 88,
        compliance: 85,
        technical: 87
      },
      metrics: [
        { metricId: 'csat', score: 4.3, target: 4.5, samples: 38, details: 'Room for improvement in satisfaction' },
        { metricId: 'first-contact-resolution', score: 82, target: 85, samples: 38, details: 'Need better first-contact handling' }
      ],
      reviews: [],
      achievements: [],
      areasForImprovement: ['Customer satisfaction', 'Communication clarity', 'Compliance adherence'],
      strengths: ['Technical knowledge', 'Efficiency', 'Problem documentation'],
      lastReviewed: new Date('2024-10-25'),
      reviewer: 'Jane Smith'
    }
  ];

  const mockMonitoringSessions: MonitoringSession[] = [
    {
      id: 'session-1',
      agentId: 'agent-1',
      agentName: 'Sarah Johnson',
      type: 'call',
      startTime: new Date('2024-10-28T10:00:00'),
      endTime: new Date('2024-10-28T10:25:00'),
      duration: 25,
      status: 'completed',
      reviewer: 'Jane Smith',
      notes: 'Excellent call handling, maintained brand voice throughout',
      scores: {
        overallScore: 95,
        categoryScores: { communication: 96, efficiency: 94, satisfaction: 95 }
      },
      realTimeMetrics: [
        { timestamp: '10:05', metric: 'call_duration', value: 5 },
        { timestamp: '10:10', metric: 'customer_sentiment', value: 'positive' }
      ]
    },
    {
      id: 'session-2',
      agentId: 'agent-2',
      agentName: 'Michael Chen',
      type: 'chat',
      startTime: new Date('2024-10-28T14:30:00'),
      status: 'active',
      reviewer: 'John Doe',
      notes: 'In progress - handling technical issue',
      realTimeMetrics: []
    }
  ];

  const mockCalibrationSessions: CalibrationSession[] = [
    {
      id: 'cal-1',
      title: 'Monthly Call Quality Calibration',
      description: 'Review and align scoring standards for call quality assessments',
      date: new Date('2024-10-30T15:00:00'),
      participants: ['Jane Smith', 'John Doe', 'Emily Brown'],
      facilitator: 'Sarah Wilson',
      status: 'scheduled',
      materials: [
        { type: 'call_recording', name: 'Sample Call 1 - VIP Customer' },
        { type: 'scoring_guide', name: 'Updated Quality Standards v2.1' }
      ]
    }
  ];

  useEffect(() => {
    setQualityMetrics(mockQualityMetrics);
    setQualityScores(mockQualityScores);
    setMonitoringSessions(mockMonitoringSessions);
    setCalibrationSessions(mockCalibrationSessions);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number, target: number) => {
    const percentage = (score / target) * 100;
    if (percentage >= 95) return 'text-green-600';
    if (percentage >= 85) return 'text-blue-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <div className="h-4 w-4 bg-gray-400 rounded-full" />;
    }
  };

  const handleQualityReview = (review: QualityReview) => {
    setSelectedReview(review);
    setShowReviewDialog(true);
  };

  const filteredScores = qualityScores.filter(score =>
    score.agentName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const overallTeamScore = qualityScores.length > 0
    ? Math.round(qualityScores.reduce((sum, score) => sum + score.overallScore, 0) / qualityScores.length)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/30 via-orange-50/20 to-rose-50/30">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md shadow-lg border-b border-amber-100">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Shield className="h-8 w-8 text-amber-600" />
              <div>
                <h1 className="text-3xl font-bold text-amber-900">Quality Assurance Framework</h1>
                <p className="text-amber-600">Comprehensive monitoring and quality management system</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="current-week">This Week</SelectItem>
                  <SelectItem value="current-month">This Month</SelectItem>
                  <SelectItem value="current-quarter">This Quarter</SelectItem>
                </SelectContent>
              </Select>

              <Button className="bg-amber-600 hover:bg-amber-700">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-200">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <Eye className="h-4 w-4 mr-2" />
              Monitoring
            </TabsTrigger>
            <TabsTrigger value="reviews" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <Star className="h-4 w-4 mr-2" />
              Reviews
            </TabsTrigger>
            <TabsTrigger value="calibration" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <Users className="h-4 w-4 mr-2" />
              Calibration
            </TabsTrigger>
            <TabsTrigger value="standards" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <FileText className="h-4 w-4 mr-2" />
              Standards
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="improvement" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <Lightbulb className="h-4 w-4 mr-2" />
              Improvement
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Overall Score Overview */}
            <Card className="border-amber-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <Target className="h-5 w-5 text-amber-600" />
                  Team Quality Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-amber-900 mb-2">{overallTeamScore}</div>
                    <p className="text-sm text-amber-600">Overall Score</p>
                    <Progress value={overallTeamScore} className="mt-2" />
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">94%</div>
                    <p className="text-sm text-amber-600">CSAT Score</p>
                    <TrendingUp className="h-4 w-4 text-green-600 mx-auto mt-2" />
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">88%</div>
                    <p className="text-sm text-amber-600">First Contact Resolution</p>
                    <TrendingUp className="h-4 w-4 text-green-600 mx-auto mt-2" />
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">1.8m</div>
                    <p className="text-sm text-amber-600">Avg Response Time</p>
                    <TrendingUp className="h-4 w-4 text-green-600 mx-auto mt-2" />
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-600 mb-2">92%</div>
                    <p className="text-sm text-amber-600">Compliance Rate</p>
                    <TrendingDown className="h-4 w-4 text-red-600 mx-auto mt-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quality Metrics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {qualityMetrics.map((metric) => (
                <Card key={metric.id} className="border-amber-200 shadow-lg">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge className={getStatusColor(metric.status)}>
                        {metric.status}
                      </Badge>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(metric.trend)}
                        <span className="text-xs text-amber-500">
                          {metric.frequency}
                        </span>
                      </div>
                    </div>
                    <CardTitle className="text-lg text-amber-900">{metric.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {metric.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold text-amber-900">
                            {metric.type === 'time' ? `${metric.current}m` :
                             metric.type === 'rating' ? `${metric.current}/5` :
                             metric.type === 'percentage' ? `${metric.current}%` :
                             metric.current}
                          </div>
                          <div className="text-sm text-amber-600">
                            Target: {metric.type === 'time' ? `${metric.target}m` :
                                    metric.type === 'rating' ? `${metric.target}/5` :
                                    `${metric.target}%`}
                          </div>
                        </div>
                        <div className={`text-right ${getScoreColor(metric.current, metric.target)}`}>
                          <div className="text-lg font-bold">
                            {Math.round((metric.current / metric.target) * 100)}%
                          </div>
                          <div className="text-xs">of target</div>
                        </div>
                      </div>
                      <Progress
                        value={Math.min((metric.current / metric.target) * 100, 100)}
                        className="h-2"
                      />
                      <div className="flex justify-between text-xs text-amber-500">
                        <span>Weight: {metric.weight}%</span>
                        <span>Updated: {metric.lastUpdated.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Top Performers */}
            <Card className="border-amber-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <Trophy className="h-5 w-5 text-amber-600" />
                  Top Performers This Month
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {qualityScores
                    .sort((a, b) => b.overallScore - a.overallScore)
                    .slice(0, 5)
                    .map((score, index) => (
                      <div key={score.agentId} className="flex items-center gap-4 p-3 bg-amber-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                            index === 0 ? 'bg-yellow-500' :
                            index === 1 ? 'bg-gray-400' :
                            index === 2 ? 'bg-orange-600' :
                            'bg-amber-600'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-amber-900">{score.agentName}</p>
                            <p className="text-sm text-amber-600">Overall Score: {score.overallScore}%</p>
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="grid grid-cols-5 gap-2 text-xs">
                            <div className="text-center">
                              <p className="font-medium text-green-600">{score.categoryScores.communication}</p>
                              <p className="text-amber-500">Comm</p>
                            </div>
                            <div className="text-center">
                              <p className="font-medium text-blue-600">{score.categoryScores.efficiency}</p>
                              <p className="text-amber-500">Eff</p>
                            </div>
                            <div className="text-center">
                              <p className="font-medium text-purple-600">{score.categoryScores.satisfaction}</p>
                              <p className="text-amber-500">Sat</p>
                            </div>
                            <div className="text-center">
                              <p className="font-medium text-red-600">{score.categoryScores.compliance}</p>
                              <p className="text-amber-500">Comp</p>
                            </div>
                            <div className="text-center">
                              <p className="font-medium text-orange-600">{score.categoryScores.technical}</p>
                              <p className="text-amber-500">Tech</p>
                            </div>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Monitoring Tab */}
          <TabsContent value="monitoring" className="space-y-6">
            {/* Active Monitoring Sessions */}
            <Card className="border-amber-200 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-amber-900">
                      <Eye className="h-5 w-5 text-amber-600" />
                      Active Monitoring Sessions
                    </CardTitle>
                    <CardDescription>Real-time quality monitoring of support interactions</CardDescription>
                  </div>
                  <Button className="bg-amber-600 hover:bg-amber-700">
                    <Play className="h-4 w-4 mr-2" />
                    Start New Session
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {monitoringSessions.map((session) => (
                    <Card key={session.id} className={`border-2 ${
                      session.status === 'active' ? 'border-green-200 bg-green-50' :
                      session.status === 'completed' ? 'border-gray-200' :
                      'border-yellow-200 bg-yellow-50'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-3 h-3 rounded-full ${
                              session.status === 'active' ? 'bg-green-500 animate-pulse' :
                              session.status === 'completed' ? 'bg-gray-400' :
                              'bg-yellow-500'
                            }`} />
                            <div>
                              <p className="font-medium text-amber-900">{session.agentName}</p>
                              <div className="flex items-center gap-3 text-sm text-amber-600">
                                <span className="flex items-center gap-1">
                                  {session.type === 'call' && <Phone className="h-3 w-3" />}
                                  {session.type === 'chat' && <MessageCircle className="h-3 w-3" />}
                                  {session.type === 'email' && <Mail className="h-3 w-3" />}
                                  {session.type === 'ticket' && <FileText className="h-3 w-3" />}
                                  {session.type}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {session.status === 'active' ? 'Live' :
                                   session.duration ? `${session.duration} min` : 'Not started'}
                                </span>
                                <span>Reviewer: {session.reviewer}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {session.status === 'active' ? (
                              <>
                                <Button size="sm" variant="outline">
                                  <Pause className="h-4 w-4 mr-2" />
                                  Pause
                                </Button>
                                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                  <CheckSquare className="h-4 w-4 mr-2" />
                                  Complete
                                </Button>
                              </>
                            ) : session.status === 'completed' ? (
                              <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4 mr-2" />
                                View Results
                              </Button>
                            ) : (
                              <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700">
                                <Play className="h-4 w-4 mr-2" />
                                Resume
                              </Button>
                            )}
                          </div>
                        </div>
                        {session.notes && (
                          <div className="mt-3 p-3 bg-white rounded-lg border">
                            <p className="text-sm text-amber-700">{session.notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Monitoring Schedule */}
            <Card className="border-amber-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <Calendar className="h-5 w-5 text-amber-600" />
                  Monitoring Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-amber-900 mb-3">Today's Schedule</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                        <div>
                          <p className="font-medium text-amber-900">Sarah Johnson - Call Review</p>
                          <p className="text-sm text-amber-600">10:00 AM - 11:00 AM</p>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Completed</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div>
                          <p className="font-medium text-amber-900">Michael Chen - Chat Monitoring</p>
                          <p className="text-sm text-amber-600">2:00 PM - 3:00 PM</p>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-amber-900 mb-3">Upcoming This Week</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-amber-900">Emily Brown - Email Review</p>
                          <p className="text-sm text-amber-600">Tomorrow, 9:00 AM</p>
                        </div>
                        <Badge variant="outline">Scheduled</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-amber-900">Team Calibration Session</p>
                          <p className="text-sm text-amber-600">Friday, 3:00 PM</p>
                        </div>
                        <Badge variant="outline">Scheduled</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-6">
            {/* Review Queue */}
            <Card className="border-amber-200 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-amber-900">
                      <Star className="h-5 w-5 text-amber-600" />
                      Quality Reviews
                    </CardTitle>
                    <CardDescription>Agent performance reviews and assessments</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-amber-500" />
                      <Input
                        placeholder="Search agents..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 border-amber-200 w-64"
                      />
                    </div>
                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="communication">Communication</SelectItem>
                        <SelectItem value="efficiency">Efficiency</SelectItem>
                        <SelectItem value="satisfaction">Satisfaction</SelectItem>
                        <SelectItem value="compliance">Compliance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredScores.map((score) => (
                    <Card key={score.agentId} className="border-amber-200 shadow-md hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                              <User className="h-6 w-6 text-amber-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-amber-900">{score.agentName}</h3>
                              <p className="text-sm text-amber-600">
                                Last reviewed: {score.lastReviewed.toLocaleDateString()} by {score.reviewer}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-amber-900">{score.overallScore}%</div>
                            <Badge className={getStatusColor(
                              score.overallScore >= 95 ? 'excellent' :
                              score.overallScore >= 85 ? 'good' :
                              score.overallScore >= 75 ? 'warning' : 'critical'
                            )}>
                              {score.overallScore >= 95 ? 'Excellent' :
                               score.overallScore >= 85 ? 'Good' :
                               score.overallScore >= 75 ? 'Needs Improvement' : 'Critical'}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-5 gap-4 mb-4">
                          <div className="text-center p-2 bg-green-50 rounded">
                            <p className="font-medium text-green-700">{score.categoryScores.communication}</p>
                            <p className="text-xs text-green-600">Communication</p>
                          </div>
                          <div className="text-center p-2 bg-blue-50 rounded">
                            <p className="font-medium text-blue-700">{score.categoryScores.efficiency}</p>
                            <p className="text-xs text-blue-600">Efficiency</p>
                          </div>
                          <div className="text-center p-2 bg-purple-50 rounded">
                            <p className="font-medium text-purple-700">{score.categoryScores.satisfaction}</p>
                            <p className="text-xs text-purple-600">Satisfaction</p>
                          </div>
                          <div className="text-center p-2 bg-red-50 rounded">
                            <p className="font-medium text-red-700">{score.categoryScores.compliance}</p>
                            <p className="text-xs text-red-600">Compliance</p>
                          </div>
                          <div className="text-center p-2 bg-orange-50 rounded">
                            <p className="font-medium text-orange-700">{score.categoryScores.technical}</p>
                            <p className="text-xs text-orange-600">Technical</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                          <div>
                            <h4 className="font-medium text-green-700 mb-2">Strengths</h4>
                            <ul className="text-sm text-amber-700 space-y-1">
                              {score.strengths.slice(0, 3).map((strength, index) => (
                                <li key={index} className="flex items-center gap-2">
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                  {strength}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-medium text-yellow-700 mb-2">Areas for Improvement</h4>
                            <ul className="text-sm text-amber-700 space-y-1">
                              {score.areasForImprovement.slice(0, 3).map((area, index) => (
                                <li key={index} className="flex items-center gap-2">
                                  <AlertCircle className="h-3 w-3 text-yellow-500" />
                                  {area}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-amber-600">
                            <span>{score.reviews.length} reviews</span>
                            <span>{score.achievements.length} achievements</span>
                            <span>{score.metrics.length} metrics tracked</span>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-2" />
                              Full Profile
                            </Button>
                            <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
                              <Edit className="h-4 w-4 mr-2" />
                              New Review
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calibration Tab */}
          <TabsContent value="calibration" className="space-y-6">
            <Card className="border-amber-200 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-amber-900">
                      <Users className="h-5 w-5 text-amber-600" />
                      Calibration Sessions
                    </CardTitle>
                    <CardDescription>Team calibration exercises to ensure scoring consistency</CardDescription>
                  </div>
                  <Button className="bg-amber-600 hover:bg-amber-700">
                    <Users className="h-4 w-4 mr-2" />
                    Schedule Calibration
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {calibrationSessions.map((session) => (
                    <Card key={session.id} className="border-amber-200 shadow-md">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <Badge className={
                            session.status === 'completed' ? 'bg-green-100 text-green-800' :
                            session.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }>
                            {session.status}
                          </Badge>
                          <span className="text-sm text-amber-600">
                            {session.date.toLocaleDateString()}
                          </span>
                        </div>
                        <CardTitle className="text-lg text-amber-900">{session.title}</CardTitle>
                        <CardDescription>{session.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm font-medium text-amber-900 mb-2">Facilitator</p>
                            <p className="text-sm text-amber-600">{session.facilitator}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-amber-900 mb-2">Participants ({session.participants.length})</p>
                            <div className="flex flex-wrap gap-1">
                              {session.participants.map((participant, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {participant}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-amber-900 mb-2">Materials</p>
                            <div className="space-y-1">
                              {session.materials.map((material, index) => (
                                <div key={index} className="flex items-center gap-2 text-sm text-amber-600">
                                  <FileText className="h-3 w-3" />
                                  {material.name}
                                </div>
                              ))}
                            </div>
                          </div>
                          {session.results && (
                            <div className="p-3 bg-green-50 rounded-lg">
                              <p className="text-sm font-medium text-green-900 mb-1">Results Available</p>
                              <p className="text-xs text-green-700">
                                Agreement Rate: {session.results.agreementRate}%
                              </p>
                            </div>
                          )}
                          <div className="flex gap-2">
                            {session.status === 'scheduled' && (
                              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                                Start Session
                              </Button>
                            )}
                            {session.status === 'completed' && (
                              <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4 mr-2" />
                                View Results
                              </Button>
                            )}
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Calibration Guidelines */}
            <Card className="border-amber-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <BookOpen className="h-5 w-5 text-amber-600" />
                  Calibration Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-medium text-amber-900">Frequency</h4>
                    <ul className="text-sm text-amber-700 space-y-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Monthly team calibration
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Quarterly cross-team calibration
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Annual standards review
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium text-amber-900">Best Practices</h4>
                    <ul className="text-sm text-amber-700 space-y-2">
                      <li className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        Use diverse interaction samples
                      </li>
                      <li className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        Document scoring rationale
                      </li>
                      <li className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        Discuss discrepancies openly
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium text-amber-900">Success Metrics</h4>
                    <ul className="text-sm text-amber-700 space-y-2">
                      <li className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-blue-500" />
                        ≥85% scoring agreement
                      </li>
                      <li className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-blue-500" />
                        ≤10% score variance
                      </li>
                      <li className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-blue-500" />
                        100% facilitator participation
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Standards Tab */}
          <TabsContent value="standards" className="space-y-6">
            <Card className="border-amber-200 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-amber-900">
                      <FileText className="h-5 w-5 text-amber-600" />
                      Quality Standards
                    </CardTitle>
                    <CardDescription>Defined quality standards and evaluation criteria</CardDescription>
                  </div>
                  <Button className="bg-amber-600 hover:bg-amber-700">
                    <FileText className="h-4 w-4 mr-2" />
                    Create Standard
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Communication Standards */}
                  <Card className="border-amber-200">
                    <CardHeader>
                      <CardTitle className="text-lg text-amber-900">Communication Standards</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium text-amber-900 mb-3">Phone Communication</h4>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 p-2 bg-amber-50 rounded">
                              <CheckSquare className="h-4 w-4 text-amber-600" />
                              <span className="text-sm">Professional greeting within 3 rings</span>
                            </div>
                            <div className="flex items-center gap-2 p-2 bg-amber-50 rounded">
                              <CheckSquare className="h-4 w-4 text-amber-600" />
                              <span className="text-sm">Clear pronunciation and appropriate pace</span>
                            </div>
                            <div className="flex items-center gap-2 p-2 bg-amber-50 rounded">
                              <CheckSquare className="h-4 w-4 text-amber-600" />
                              <span className="text-sm">Active listening and confirmation</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-amber-900 mb-3">Written Communication</h4>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 p-2 bg-amber-50 rounded">
                              <CheckSquare className="h-4 w-4 text-amber-600" />
                              <span className="text-sm">Proper grammar and spelling</span>
                            </div>
                            <div className="flex items-center gap-2 p-2 bg-amber-50 rounded">
                              <CheckSquare className="h-4 w-4 text-amber-600" />
                              <span className="text-sm">Professional tone and formatting</span>
                            </div>
                            <div className="flex items-center gap-2 p-2 bg-amber-50 rounded">
                              <CheckSquare className="h-4 w-4 text-amber-600" />
                              <span className="text-sm">Clear and concise responses</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Service Quality Standards */}
                  <Card className="border-amber-200">
                    <CardHeader>
                      <CardTitle className="text-lg text-amber-900">Service Quality Standards</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div>
                          <h4 className="font-medium text-amber-900 mb-3">Response Time Standards</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between p-2 bg-amber-50 rounded">
                              <span>Phone Calls</span>
                              <span className="font-medium">≤ 2 min</span>
                            </div>
                            <div className="flex justify-between p-2 bg-amber-50 rounded">
                              <span>Live Chat</span>
                              <span className="font-medium">≤ 30 sec</span>
                            </div>
                            <div className="flex justify-between p-2 bg-amber-50 rounded">
                              <span>Email</span>
                              <span className="font-medium">≤ 2 hours</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-amber-900 mb-3">Resolution Standards</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between p-2 bg-amber-50 rounded">
                              <span>First Contact Resolution</span>
                              <span className="font-medium">≥ 85%</span>
                            </div>
                            <div className="flex justify-between p-2 bg-amber-50 rounded">
                              <span>Customer Satisfaction</span>
                              <span className="font-medium">≥ 4.5/5</span>
                            </div>
                            <div className="flex justify-between p-2 bg-amber-50 rounded">
                              <span>Escalation Rate</span>
                              <span className="font-medium">≤ 10%</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-amber-900 mb-3">VIP Service Standards</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between p-2 bg-purple-50 rounded">
                              <span>Priority Response</span>
                              <span className="font-medium text-purple-700">Immediate</span>
                            </div>
                            <div className="flex justify-between p-2 bg-purple-50 rounded">
                              <span>Dedicated Agent</span>
                              <span className="font-medium text-purple-700">Required</span>
                            </div>
                            <div className="flex justify-between p-2 bg-purple-50 rounded">
                              <span>Personalization</span>
                              <span className="font-medium text-purple-700">Expected</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quality Trends */}
              <Card className="border-amber-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-900">
                    <LineChart className="h-5 w-5 text-amber-600" />
                    Quality Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-amber-50 rounded-lg flex items-center justify-center">
                    <div className="text-center text-amber-600">
                      <LineChart className="h-12 w-12 mx-auto mb-2" />
                      <p>Quality score trends over time</p>
                      <p className="text-sm">Chart visualization would be implemented here</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Category Distribution */}
              <Card className="border-amber-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-900">
                    <PieChart className="h-5 w-5 text-amber-600" />
                    Performance by Category
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-amber-50 rounded-lg flex items-center justify-center">
                    <div className="text-center text-amber-600">
                      <PieChart className="h-12 w-12 mx-auto mb-2" />
                      <p>Category performance distribution</p>
                      <p className="text-sm">Pie chart visualization would be implemented here</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Improvements */}
              <Card className="border-amber-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-900">
                    <TrendingUp className="h-5 w-5 text-amber-600" />
                    Biggest Improvements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium text-amber-900">Response Time</p>
                          <p className="text-sm text-amber-600">15% improvement this month</p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">+15%</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium text-amber-900">Customer Satisfaction</p>
                          <p className="text-sm text-amber-600">8% improvement this month</p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">+8%</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Areas of Concern */}
              <Card className="border-amber-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-900">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    Areas of Concern
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <TrendingDown className="h-5 w-5 text-yellow-600" />
                        <div>
                          <p className="font-medium text-amber-900">Compliance Adherence</p>
                          <p className="text-sm text-amber-600">3% decrease this month</p>
                        </div>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800">-3%</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <TrendingDown className="h-5 w-5 text-red-600" />
                        <div>
                          <p className="font-medium text-amber-900">Escalation Rate</p>
                          <p className="text-sm text-amber-600">5% increase this month</p>
                        </div>
                      </div>
                      <Badge className="bg-red-100 text-red-800">-5%</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Improvement Tab */}
          <TabsContent value="improvement" className="space-y-6">
            <Card className="border-amber-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <Lightbulb className="h-5 w-5 text-amber-600" />
                  Quality Improvement Initiatives
                </CardTitle>
                <CardDescription>Active improvement programs and action plans</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Active Initiatives */}
                  <div>
                    <h4 className="font-medium text-amber-900 mb-4">Active Initiatives</h4>
                    <div className="space-y-3">
                      <Card className="border-blue-200 bg-blue-50">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-blue-900">Communication Excellence Program</h5>
                            <Badge className="bg-blue-100 text-blue-800">Active</Badge>
                          </div>
                          <p className="text-sm text-blue-700 mb-3">
                            4-week program to improve communication skills across all channels
                          </p>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-blue-600">Progress</span>
                              <span className="font-medium text-blue-900">Week 2 of 4</span>
                            </div>
                            <Progress value={50} />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-green-200 bg-green-50">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-green-900">VIP Service Enhancement</h5>
                            <Badge className="bg-green-100 text-green-800">On Track</Badge>
                          </div>
                          <p className="text-sm text-green-700 mb-3">
                            Specialized training for handling VIP clients with premium service
                          </p>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-green-600">Progress</span>
                              <span className="font-medium text-green-900">75% Complete</span>
                            </div>
                            <Progress value={75} />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Recommended Actions */}
                  <div>
                    <h4 className="font-medium text-amber-900 mb-4">Recommended Actions</h4>
                    <div className="space-y-3">
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Priority:</strong> Address compliance adherence decline with refresher training
                        </AlertDescription>
                      </Alert>
                      <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <h5 className="font-medium text-amber-900 mb-2">Coaching Focus Areas</h5>
                        <ul className="text-sm text-amber-700 space-y-1">
                          <li>• Michael Chen - Customer satisfaction improvement</li>
                          <li>• Team-wide - Compliance standards refresh</li>
                          <li>• New hires - Brand voice consistency</li>
                        </ul>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <h5 className="font-medium text-blue-900 mb-2">Training Opportunities</h5>
                        <ul className="text-sm text-blue-700 space-y-1">
                          <li>• Advanced de-escalation techniques workshop</li>
                          <li>• Cross-cultural communication training</li>
                          <li>• Technical troubleshooting deep dive</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Quality Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quality Review</DialogTitle>
            <DialogDescription>
              Comprehensive quality assessment and feedback
            </DialogDescription>
          </DialogHeader>

          {selectedReview && (
            <div className="space-y-6">
              {/* Review Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Review Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Interaction Type</Label>
                      <p className="font-medium">{selectedReview.type}</p>
                    </div>
                    <div>
                      <Label>Date</Label>
                      <p className="font-medium">{selectedReview.date.toLocaleDateString()}</p>
                    </div>
                    <div>
                      <Label>Reviewer</Label>
                      <p className="font-medium">{selectedReview.reviewer}</p>
                    </div>
                    <div>
                      <Label>Overall Score</Label>
                      <p className="text-2xl font-bold text-amber-900">{selectedReview.overallScore}%</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Category Scores</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(selectedReview.categoryScores).map(([category, score]) => (
                      <div key={category} className="space-y-2">
                        <div className="flex justify-between">
                          <Label className="capitalize">{category}</Label>
                          <span className="font-medium">{score}%</span>
                        </div>
                        <Progress value={score} />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Feedback */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Feedback & Assessment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label>Overall Feedback</Label>
                    <Textarea
                      value={reviewData.feedback || selectedReview.feedback}
                      onChange={(e) => setReviewData(prev => ({ ...prev, feedback: e.target.value }))}
                      className="mt-2"
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <Label>Strengths</Label>
                      <div className="mt-2 space-y-2">
                        {selectedReview.strengths.map((strength, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-green-50 rounded">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm">{strength}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Areas for Improvement</Label>
                      <div className="mt-2 space-y-2">
                        {selectedReview.improvements.map((improvement, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-yellow-50 rounded">
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                            <span className="text-sm">{improvement}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Action Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedReview.actionItems.map((action) => (
                      <div key={action.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Checkbox checked={action.status === 'completed'} />
                          <div>
                            <p className="font-medium text-amber-900">{action.description}</p>
                            <p className="text-sm text-amber-600">
                              Due: {action.dueDate.toLocaleDateString()} • Priority: {action.priority}
                            </p>
                          </div>
                        </div>
                        <Badge className={
                          action.status === 'completed' ? 'bg-green-100 text-green-800' :
                          action.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }>
                          {action.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-2">
                <Button variant="outline">Save Draft</Button>
                <Button className="bg-amber-600 hover:bg-amber-700">Complete Review</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QualityAssuranceFramework;