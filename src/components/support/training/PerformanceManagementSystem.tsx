import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  LineChart,
  PieChart,
  Activity,
  Target,
  Users,
  User,
  Star,
  Award,
  Trophy,
  Medal,
  Calendar,
  Clock,
  Timer,
  MessageSquare,
  Phone,
  Mail,
  HeadphonesIcon,
  Download,
  Upload,
  Search,
  Filter,
  Edit,
  Trash2,
  Save,
  RefreshCw,
  Play,
  Pause,
  Eye,
  EyeOff,
  Bell,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Settings,
  Flag,
  ThumbsUp,
  ThumbsDown,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  Zap,
  Shield,
  Sword,
  Crown,
  Gem,
  Flame,
  Rocket,
  Hash,
  Tag,
  FileText,
  Clipboard,
  List,
  Grid,
  FilterIcon,
  Filter as FilterIcon2
} from 'lucide-react';

interface KPIMetric {
  id: string;
  name: string;
  description: string;
  category: 'productivity' | 'quality' | 'customer' | 'efficiency' | 'compliance' | 'development';
  type: 'percentage' | 'count' | 'time' | 'score' | 'rating';
  unit: string;
  target: number;
  current: number;
  previous: number;
  trend: 'up' | 'down' | 'stable';
  status: 'excellent' | 'good' | 'warning' | 'critical';
  weight: number;
  frequency: 'real-time' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  lastUpdated: Date;
  benchmarks: Benchmark[];
}

interface Benchmark {
  name: string;
  value: number;
  source: string;
  date: Date;
}

interface PerformanceGoal {
  id: string;
  title: string;
  description: string;
  category: string;
  type: 'individual' | 'team' | 'organizational';
  targetValue: number;
  currentValue: number;
  dueDate: Date;
  status: 'on-track' | 'at-risk' | 'achieved' | 'missed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string[];
  metrics: string[];
  milestones: Milestone[];
  progress: number;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  status: 'completed' | 'in-progress' | 'pending';
  value: number;
}

interface AgentPerformance {
  agentId: string;
  agentName: string;
  period: string;
  overallScore: number;
  rank: number;
  kpiScores: KPIScore[];
  goals: PerformanceGoal[];
  achievements: Achievement[];
  skillLevels: SkillLevel[];
  attendance: AttendanceRecord;
  customerFeedback: CustomerFeedback[];
  improvementAreas: string[];
  strengths: string[];
  trend: 'improving' | 'stable' | 'declining';
  lastReview: Date;
  nextReview: Date;
  reviewer: string;
}

interface KPIScore {
  metricId: string;
  metricName: string;
  value: number;
  target: number;
  score: number;
  rank: number;
  trend: 'up' | 'down' | 'stable';
  details: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  category: string;
  earnedAt: Date;
  points: number;
  level: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface SkillLevel {
  skill: string;
  level: number;
  maxLevel: number;
  experience: number;
  nextLevelExp: number;
  category: string;
  lastImproved: Date;
}

interface AttendanceRecord {
  presentDays: number;
  totalDays: number;
  punctuality: number;
  overtime: number;
  leaveTaken: number;
  sickDays: number;
}

interface CustomerFeedback {
  id: string;
  date: Date;
  rating: number;
  channel: string;
  interactionId: string;
  comment: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  vipClient: boolean;
  tags: string[];
}

interface PerformanceReview {
  id: string;
  agentId: string;
  agentName: string;
  reviewer: string;
  type: 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'ad-hoc';
  period: string;
  date: Date;
  status: 'scheduled' | 'in-progress' | 'completed' | 'overdue';
  overallScore?: number;
  categoryScores: CategoryScore[];
  goals: PerformanceGoal[];
  feedback: string;
  strengths: string[];
  improvements: string[];
  actionItems: ActionItem[];
  nextReviewDate: Date;
}

interface CategoryScore {
  category: string;
  score: number;
  weight: number;
  comments: string;
}

interface ActionItem {
  id: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: Date;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  assignedTo: string;
  notes: string;
  completedDate?: Date;
}

interface TeamPerformance {
  teamId: string;
  teamName: string;
  leader: string;
  members: string[];
  period: string;
  overallScore: number;
  kpiScores: KPIScore[];
  goals: PerformanceGoal[];
  collaboration: CollaborationMetric[];
  trends: TeamTrend[];
  achievements: TeamAchievement[];
}

interface CollaborationMetric {
  metric: string;
  value: number;
  target: number;
  description: string;
}

interface TeamTrend {
  period: string;
  score: number;
  change: number;
  highlights: string[];
}

interface TeamAchievement {
  name: string;
  description: string;
  earnedAt: Date;
  contributors: string[];
}

interface PerformanceDashboard {
  period: string;
  lastUpdated: Date;
  overallMetrics: {
    totalAgents: number;
    averageScore: number;
    topPerformer: string;
    improvementNeeded: number;
    goalsAchieved: number;
  };
  categoryBreakdown: CategoryBreakdown[];
  trends: PerformanceTrend[];
  alerts: PerformanceAlert[];
}

interface CategoryBreakdown {
  category: string;
  averageScore: number;
  topPerformer: string;
  improvementArea: string;
}

interface PerformanceTrend {
  period: string;
  overallScore: number;
  keyMetrics: { [key: string]: number };
  highlights: string[];
}

interface PerformanceAlert {
  id: string;
  type: 'performance' | 'attendance' | 'goal' | 'compliance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedAgents: string[];
  date: Date;
  status: 'active' | 'resolved' | 'acknowledged';
}

const PerformanceManagementSystem: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedPeriod, setSelectedPeriod] = useState('current-month');
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceDashboard | null>(null);
  const [agentPerformances, setAgentPerformances] = useState<AgentPerformance[]>([]);
  const [teamPerformances, setTeamPerformances] = useState<TeamPerformance[]>([]);
  const [kpiMetrics, setKpiMetrics] = useState<KPIMetric[]>([]);
  const [goals, setGoals] = useState<PerformanceGoal[]>([]);
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  // Mock data
  const mockKpiMetrics: KPIMetric[] = [
    {
      id: 'csat',
      name: 'Customer Satisfaction Score',
      description: 'Average customer satisfaction rating from post-interaction surveys',
      category: 'customer',
      type: 'rating',
      unit: '/5',
      target: 4.5,
      current: 4.7,
      previous: 4.6,
      trend: 'up',
      status: 'excellent',
      weight: 25,
      frequency: 'daily',
      lastUpdated: new Date('2024-10-28'),
      benchmarks: [
        { name: 'Industry Average', value: 4.2, source: 'Customer Service Institute', date: new Date('2024-10-01') },
        { name: 'Top Quartile', value: 4.8, source: 'Industry Report', date: new Date('2024-10-01') }
      ]
    },
    {
      id: 'first-response-time',
      name: 'First Response Time',
      description: 'Average time to first response across all channels',
      category: 'efficiency',
      type: 'time',
      unit: 'minutes',
      target: 2,
      current: 1.8,
      previous: 2.1,
      trend: 'up',
      status: 'excellent',
      weight: 20,
      frequency: 'hourly',
      lastUpdated: new Date('2024-10-28'),
      benchmarks: [
        { name: 'Industry Standard', value: 3, source: 'Service Level Benchmark', date: new Date('2024-10-01') }
      ]
    },
    {
      id: 'resolution-rate',
      name: 'First Contact Resolution',
      description: 'Percentage of issues resolved on first contact',
      category: 'quality',
      type: 'percentage',
      unit: '%',
      target: 85,
      current: 88,
      previous: 86,
      trend: 'up',
      status: 'excellent',
      weight: 20,
      frequency: 'daily',
      lastUpdated: new Date('2024-10-28')
    },
    {
      id: 'productivity',
      name: 'Cases Handled per Day',
      description: 'Average number of support cases handled per agent per day',
      category: 'productivity',
      type: 'count',
      unit: 'cases',
      target: 25,
      current: 23,
      previous: 22,
      trend: 'up',
      status: 'good',
      weight: 15,
      frequency: 'daily',
      lastUpdated: new Date('2024-10-28')
    },
    {
      id: 'compliance',
      name: 'Compliance Adherence',
      description: 'Percentage of interactions following compliance standards',
      category: 'compliance',
      type: 'percentage',
      unit: '%',
      target: 95,
      current: 92,
      previous: 94,
      trend: 'down',
      status: 'warning',
      weight: 20,
      frequency: 'weekly',
      lastUpdated: new Date('2024-10-28')
    }
  ];

  const mockAgentPerformances: AgentPerformance[] = [
    {
      agentId: 'agent-1',
      agentName: 'Sarah Johnson',
      period: '2024-10',
      overallScore: 94,
      rank: 1,
      kpiScores: [
        { metricId: 'csat', metricName: 'Customer Satisfaction', value: 4.8, target: 4.5, score: 98, rank: 1, trend: 'up', details: 'Consistently high ratings' },
        { metricId: 'first-response-time', metricName: 'First Response Time', value: 1.5, target: 2, score: 95, rank: 2, trend: 'up', details: 'Excellent response times' },
        { metricId: 'resolution-rate', metricName: 'First Contact Resolution', value: 92, target: 85, score: 96, rank: 1, trend: 'up', details: 'Strong problem-solving skills' }
      ],
      goals: [
        { id: 'goal-1', title: 'Achieve 95% CSAT', description: 'Maintain high customer satisfaction', category: 'customer', type: 'individual', targetValue: 95, currentValue: 94.8, dueDate: new Date('2024-10-31'), status: 'on-track', priority: 'high', metrics: ['csat'], milestones: [], progress: 97 }
      ],
      achievements: [
        { id: 'ach-1', name: 'Customer Service Champion', description: 'Top performer for 3 consecutive months', category: 'performance', earnedAt: new Date('2024-10-01'), points: 100, level: 'platinum', icon: '🏆', rarity: 'legendary' },
        { id: 'ach-2', name: 'Quick Responder', description: 'Maintained sub-2 minute response time', category: 'efficiency', earnedAt: new Date('2024-10-15'), points: 50, level: 'gold', icon: '⚡', rarity: 'epic' }
      ],
      skillLevels: [
        { skill: 'Customer Communication', level: 5, maxLevel: 5, experience: 1250, nextLevelExp: 1000, category: 'soft-skills', lastImproved: new Date('2024-10-25') },
        { skill: 'Technical Knowledge', level: 4, maxLevel: 5, experience: 680, nextLevelExp: 800, category: 'technical', lastImproved: new Date('2024-10-20') }
      ],
      attendance: { presentDays: 20, totalDays: 22, punctuality: 98, overtime: 5, leaveTaken: 2, sickDays: 0 },
      customerFeedback: [
        { id: 'fb-1', date: new Date('2024-10-27'), rating: 5, channel: 'phone', interactionId: 'INT-001', comment: 'Excellent service, very helpful!', sentiment: 'positive', vipClient: true, tags: ['excellent', 'professional'] }
      ],
      improvementAreas: ['Advanced technical troubleshooting'],
      strengths: ['Customer empathy', 'Brand voice consistency', 'Problem resolution'],
      trend: 'improving',
      lastReview: new Date('2024-10-25'),
      nextReview: new Date('2024-11-25'),
      reviewer: 'Jane Smith'
    },
    {
      agentId: 'agent-2',
      agentName: 'Michael Chen',
      period: '2024-10',
      overallScore: 87,
      rank: 3,
      kpiScores: [
        { metricId: 'csat', metricName: 'Customer Satisfaction', value: 4.3, target: 4.5, score: 82, rank: 5, trend: 'stable', details: 'Room for improvement' },
        { metricId: 'productivity', metricName: 'Productivity', value: 28, target: 25, score: 92, rank: 1, trend: 'up', details: 'High case handling volume' }
      ],
      goals: [
        { id: 'goal-2', title: 'Improve CSAT to 4.6', description: 'Focus on customer satisfaction improvement', category: 'customer', type: 'individual', targetValue: 4.6, currentValue: 4.3, dueDate: new Date('2024-11-30'), status: 'at-risk', priority: 'high', metrics: ['csat'], milestones: [], progress: 65 }
      ],
      achievements: [],
      skillLevels: [
        { skill: 'Technical Knowledge', level: 5, maxLevel: 5, experience: 1100, nextLevelExp: 1000, category: 'technical', lastImproved: new Date('2024-10-22') },
        { skill: 'Customer Communication', level: 3, maxLevel: 5, experience: 320, nextLevelExp: 500, category: 'soft-skills', lastImproved: new Date('2024-10-18') }
      ],
      attendance: { presentDays: 19, totalDays: 22, punctuality: 92, overtime: 8, leaveTaken: 3, sickDays: 1 },
      customerFeedback: [
        { id: 'fb-2', date: new Date('2024-10-26'), rating: 4, channel: 'chat', interactionId: 'INT-002', comment: 'Good technical help, but could be friendlier', sentiment: 'neutral', vipClient: false, tags: ['technical', 'communication'] }
      ],
      improvementAreas: ['Customer communication', 'Empathy', 'Brand consistency'],
      strengths: ['Technical expertise', 'Efficiency', 'Case documentation'],
      trend: 'stable',
      lastReview: new Date('2024-10-20'),
      nextReview: new Date('2024-11-20'),
      reviewer: 'Jane Smith'
    }
  ];

  const mockGoals: PerformanceGoal[] = [
    {
      id: 'team-goal-1',
      title: 'Achieve 90% Team Average CSAT',
      description: 'Team-wide customer satisfaction target for Q4 2024',
      category: 'customer',
      type: 'team',
      targetValue: 90,
      currentValue: 88.5,
      dueDate: new Date('2024-12-31'),
      status: 'on-track',
      priority: 'critical',
      assignedTo: ['agent-1', 'agent-2', 'agent-3'],
      metrics: ['csat'],
      milestones: [
        { id: 'm1', title: 'Reach 87% CSAT', description: 'Initial milestone', dueDate: new Date('2024-11-15'), status: 'completed', value: 87 },
        { id: 'm2', title: 'Reach 89% CSAT', description: 'Second milestone', dueDate: new Date('2024-12-15'), status: 'in-progress', value: 89 }
      ],
      progress: 82
    },
    {
      id: 'org-goal-1',
      title: 'Reduce Average Response Time by 20%',
      description: 'Organizational efficiency improvement target',
      category: 'efficiency',
      type: 'organizational',
      targetValue: 1.6,
      currentValue: 1.8,
      dueDate: new Date('2024-12-31'),
      status: 'on-track',
      priority: 'high',
      metrics: ['first-response-time'],
      milestones: [],
      progress: 60
    }
  ];

  const mockReviews: PerformanceReview[] = [
    {
      id: 'review-1',
      agentId: 'agent-1',
      agentName: 'Sarah Johnson',
      reviewer: 'Jane Smith',
      type: 'monthly',
      period: '2024-10',
      date: new Date('2024-10-25'),
      status: 'completed',
      overallScore: 94,
      categoryScores: [
        { category: 'Customer Service', score: 96, weight: 30, comments: 'Outstanding customer empathy' },
        { category: 'Technical Skills', score: 90, weight: 25, comments: 'Strong technical knowledge' },
        { category: 'Communication', score: 98, weight: 25, comments: 'Excellent brand voice' },
        { category: 'Efficiency', score: 92, weight: 20, comments: 'Good time management' }
      ],
      goals: mockGoals.filter(goal => goal.assignedTo?.includes('agent-1')),
      feedback: 'Sarah continues to be an outstanding performer with exceptional customer service skills and technical knowledge.',
      strengths: ['Customer empathy', 'Brand consistency', 'Problem-solving', 'VIP service excellence'],
      improvements: ['Advanced technical troubleshooting skills'],
      actionItems: [
        { id: 'ai-1', description: 'Complete advanced technical training module', priority: 'medium', dueDate: new Date('2024-11-15'), status: 'pending', assignedTo: 'Sarah Johnson', notes: 'Focus on complex troubleshooting scenarios' }
      ],
      nextReviewDate: new Date('2024-11-25')
    }
  ];

  const mockDashboard: PerformanceDashboard = {
    period: '2024-10',
    lastUpdated: new Date('2024-10-28'),
    overallMetrics: {
      totalAgents: 8,
      averageScore: 89.2,
      topPerformer: 'Sarah Johnson',
      improvementNeeded: 2,
      goalsAchieved: 12
    },
    categoryBreakdown: [
      { category: 'Customer Service', averageScore: 91.5, topPerformer: 'Sarah Johnson', improvementArea: 'Response consistency' },
      { category: 'Technical Skills', averageScore: 87.3, topPerformer: 'Michael Chen', improvementArea: 'Advanced troubleshooting' },
      { category: 'Communication', averageScore: 89.8, topPerformer: 'Sarah Johnson', improvementArea: 'Written communication' },
      { category: 'Efficiency', averageScore: 88.1, topPerformer: 'Emily Davis', improvementArea: 'Time management' }
    ],
    trends: [
      { period: '2024-08', overallScore: 87.5, keyMetrics: { csat: 4.5, responseTime: 2.2 }, highlights: ['Solid performance overall'] },
      { period: '2024-09', overallScore: 88.8, keyMetrics: { csat: 4.6, responseTime: 2.0 }, highlights: ['Improvement in response times'] },
      { period: '2024-10', overallScore: 89.2, keyMetrics: { csat: 4.7, responseTime: 1.8 }, highlights: ['Best CSAT this quarter', 'Improved efficiency'] }
    ],
    alerts: [
      { id: 'alert-1', type: 'performance', severity: 'medium', title: 'Compliance Adherence Decline', description: 'Team compliance rate dropped to 92%', affectedAgents: ['team-1'], date: new Date('2024-10-27'), status: 'active' },
      { id: 'alert-2', type: 'goal', severity: 'high', title: 'Goal at Risk', description: 'Michael Chen\'s CSAT goal needs attention', affectedAgents: ['agent-2'], date: new Date('2024-10-26'), status: 'active' }
    ]
  };

  useEffect(() => {
    setKpiMetrics(mockKpiMetrics);
    setAgentPerformances(mockAgentPerformances);
    setGoals(mockGoals);
    setReviews(mockReviews);
    setPerformanceData(mockDashboard);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'warning': case 'at-risk': return 'bg-yellow-100 text-yellow-800';
      case 'critical': case 'missed': return 'bg-red-100 text-red-800';
      case 'on-track': case 'achieved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <div className="h-4 w-4 bg-gray-400 rounded-full" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'diamond': return 'bg-gradient-to-r from-blue-500 to-purple-600 text-white';
      case 'platinum': return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
      case 'gold': return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 'silver': return 'bg-gradient-to-r from-gray-300 to-gray-400 text-white';
      case 'bronze': return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-2 border-yellow-600';
      case 'epic': return 'bg-purple-100 text-purple-800 border-2 border-purple-300';
      case 'rare': return 'bg-blue-100 text-blue-800 border-2 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border border-gray-300';
    }
  };

  const filteredAgents = agentPerformances.filter(agent =>
    agent.agentName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGoals = goals.filter(goal => {
    const matchesSearch = goal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         goal.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || goal.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/30 via-orange-50/20 to-rose-50/30">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md shadow-lg border-b border-amber-100">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <BarChart3 className="h-8 w-8 text-amber-600" />
              <div>
                <h1 className="text-3xl font-bold text-amber-900">Performance Management System</h1>
                <p className="text-amber-600">Comprehensive KPI tracking and performance analytics</p>
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
                  <SelectItem value="current-year">This Year</SelectItem>
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

      {/* Performance Alerts */}
      {performanceData?.alerts.filter(alert => alert.status === 'active').length > 0 && (
        <div className="bg-red-50 border-b border-red-200">
          <div className="max-w-7xl mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span className="text-sm font-medium text-red-900">
                  {performanceData.alerts.filter(alert => alert.status === 'active').length} active performance alerts require attention
                </span>
              </div>
              <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">
                View All Alerts
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-200">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="kpi" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <Target className="h-4 w-4 mr-2" />
              KPIs
            </TabsTrigger>
            <TabsTrigger value="agents" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <Users className="h-4 w-4 mr-2" />
              Agents
            </TabsTrigger>
            <TabsTrigger value="goals" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <Flag className="h-4 w-4 mr-2" />
              Goals
            </TabsTrigger>
            <TabsTrigger value="reviews" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <Star className="h-4 w-4 mr-2" />
              Reviews
            </TabsTrigger>
            <TabsTrigger value="achievements" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <Trophy className="h-4 w-4 mr-2" />
              Achievements
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <LineChart className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <Card className="border-amber-200 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-amber-600">Average Performance Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-900">
                    {performanceData?.overallMetrics.averageScore.toFixed(1) || '0'}
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    {getTrendIcon('improving')}
                    <span className="text-xs text-green-600">+2.3% from last month</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-amber-200 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-amber-600">Top Performer</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-amber-900 truncate">
                    {performanceData?.overallMetrics.topPerformer || 'N/A'}
                  </div>
                  <p className="text-xs text-amber-600 mt-1">94.2 performance score</p>
                </CardContent>
              </Card>

              <Card className="border-amber-200 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-amber-600">Goals Achieved</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-900">
                    {performanceData?.overallMetrics.goalsAchieved || 0}
                  </div>
                  <p className="text-xs text-amber-600 mt-1">This period</p>
                </CardContent>
              </Card>

              <Card className="border-amber-200 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-amber-600">Need Improvement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-900">
                    {performanceData?.overallMetrics.improvementNeeded || 0}
                  </div>
                  <p className="text-xs text-amber-600 mt-1">Require coaching</p>
                </CardContent>
              </Card>
            </div>

            {/* KPI Overview */}
            <Card className="border-amber-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <Target className="h-5 w-5 text-amber-600" />
                  Key Performance Indicators
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {kpiMetrics.map((kpi) => (
                    <div key={kpi.id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(kpi.status)}>
                            {kpi.status}
                          </Badge>
                          {getTrendIcon(kpi.trend)}
                        </div>
                        <span className="text-xs text-amber-500">{kpi.frequency}</span>
                      </div>
                      <h3 className="font-medium text-amber-900">{kpi.name}</h3>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-amber-900">
                          {kpi.type === 'time' ? `${kpi.current}${kpi.unit}` :
                           kpi.type === 'rating' ? `${kpi.current}${kpi.unit}` :
                           kpi.type === 'percentage' ? `${kpi.current}%` :
                           `${kpi.current} ${kpi.unit}`}
                        </span>
                        <span className="text-sm text-amber-600">
                          Target: {kpi.type === 'time' ? `${kpi.target}${kpi.unit}` :
                                  kpi.type === 'rating' ? `${kpi.target}${kpi.unit}` :
                                  `${kpi.target}${kpi.unit}`}
                        </span>
                      </div>
                      <Progress
                        value={Math.min((kpi.current / kpi.target) * 100, 100)}
                        className="h-2"
                      />
                      <div className="flex justify-between text-xs text-amber-500">
                        <span>Weight: {kpi.weight}%</span>
                        <span>{Math.round((kpi.current / kpi.target) * 100)}% of target</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance Trends */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-amber-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-900">
                    <TrendingUp className="h-5 w-5 text-amber-600" />
                    Performance Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-amber-50 rounded-lg flex items-center justify-center">
                    <div className="text-center text-amber-600">
                      <LineChart className="h-12 w-12 mx-auto mb-2" />
                      <p>Performance trend visualization</p>
                      <p className="text-sm">Chart showing monthly performance trends</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-amber-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-900">
                    <PieChart className="h-5 w-5 text-amber-600" />
                    Performance Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-amber-50 rounded-lg flex items-center justify-center">
                    <div className="text-center text-amber-600">
                      <PieChart className="h-12 w-12 mx-auto mb-2" />
                      <p>Performance score distribution</p>
                      <p className="text-sm">Pie chart showing score ranges</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Alerts */}
            <Card className="border-amber-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  Recent Performance Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {performanceData?.alerts.slice(0, 3).map((alert) => (
                    <div key={alert.id} className={`flex items-center justify-between p-3 rounded-lg border ${
                      alert.severity === 'critical' ? 'bg-red-50 border-red-200' :
                      alert.severity === 'high' ? 'bg-orange-50 border-orange-200' :
                      alert.severity === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                      'bg-blue-50 border-blue-200'
                    }`}>
                      <div className="flex items-center gap-3">
                        <AlertTriangle className={`h-5 w-5 ${
                          alert.severity === 'critical' ? 'text-red-600' :
                          alert.severity === 'high' ? 'text-orange-600' :
                          alert.severity === 'medium' ? 'text-yellow-600' :
                          'text-blue-600'
                        }`} />
                        <div>
                          <p className="font-medium text-amber-900">{alert.title}</p>
                          <p className="text-sm text-amber-600">{alert.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-amber-500">
                          {alert.date.toLocaleDateString()}
                        </span>
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* KPIs Tab */}
          <TabsContent value="kpi" className="space-y-6">
            <Card className="border-amber-200 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-amber-900">
                      <Target className="h-5 w-5 text-amber-600" />
                      Key Performance Indicators
                    </CardTitle>
                    <CardDescription>Track and monitor all performance metrics</CardDescription>
                  </div>
                  <Button className="bg-amber-600 hover:bg-amber-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add KPI
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {kpiMetrics.map((kpi) => (
                    <Card key={kpi.id} className="border-amber-200 shadow-md">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <Badge className={getStatusColor(kpi.status)}>
                              {kpi.status}
                            </Badge>
                            <h3 className="font-semibold text-amber-900">{kpi.name}</h3>
                          </div>
                          <div className="flex items-center gap-2">
                            {getTrendIcon(kpi.trend)}
                            <span className="text-sm text-amber-500">{kpi.frequency}</span>
                          </div>
                        </div>
                        <p className="text-sm text-amber-600 mb-4">{kpi.description}</p>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="text-center p-3 bg-amber-50 rounded-lg">
                            <p className="text-2xl font-bold text-amber-900">
                              {kpi.type === 'time' ? `${kpi.current}${kpi.unit}` :
                               kpi.type === 'rating' ? `${kpi.current}${kpi.unit}` :
                               kpi.type === 'percentage' ? `${kpi.current}%` :
                               `${kpi.current} ${kpi.unit}`}
                            </p>
                            <p className="text-xs text-amber-600">Current</p>
                          </div>
                          <div className="text-center p-3 bg-amber-50 rounded-lg">
                            <p className="text-2xl font-bold text-amber-900">
                              {kpi.type === 'time' ? `${kpi.target}${kpi.unit}` :
                               kpi.type === 'rating' ? `${kpi.target}${kpi.unit}` :
                               `${kpi.target}${kpi.unit}`}
                            </p>
                            <p className="text-xs text-amber-600">Target</p>
                          </div>
                          <div className="text-center p-3 bg-amber-50 rounded-lg">
                            <p className="text-2xl font-bold text-amber-900">
                              {Math.round((kpi.current / kpi.target) * 100)}%
                            </p>
                            <p className="text-xs text-amber-600">Achievement</p>
                          </div>
                          <div className="text-center p-3 bg-amber-50 rounded-lg">
                            <p className="text-2xl font-bold text-amber-900">{kpi.weight}%</p>
                            <p className="text-xs text-amber-600">Weight</p>
                          </div>
                        </div>
                        <Progress
                          value={Math.min((kpi.current / kpi.target) * 100, 100)}
                          className="mt-4"
                        />
                        {kpi.benchmarks.length > 0 && (
                          <div className="mt-4">
                            <p className="text-sm font-medium text-amber-900 mb-2">Benchmarks</p>
                            <div className="space-y-1">
                              {kpi.benchmarks.map((benchmark, index) => (
                                <div key={index} className="flex justify-between text-xs">
                                  <span className="text-amber-600">{benchmark.name}</span>
                                  <span className="font-medium text-amber-900">{benchmark.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Agents Tab */}
          <TabsContent value="agents" className="space-y-6">
            <Card className="border-amber-200 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-amber-900">
                      <Users className="h-5 w-5 text-amber-600" />
                      Agent Performance
                    </CardTitle>
                    <CardDescription>Individual performance metrics and rankings</CardDescription>
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
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredAgents.map((agent) => (
                    <Card key={agent.agentId} className="border-amber-200 shadow-md hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                              <User className="h-6 w-6 text-amber-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-amber-900">{agent.agentName}</h3>
                                <Badge className={getStatusColor(
                                  agent.overallScore >= 95 ? 'excellent' :
                                  agent.overallScore >= 85 ? 'good' :
                                  agent.overallScore >= 75 ? 'warning' : 'critical'
                                )}>
                                  Rank #{agent.rank}
                                </Badge>
                                {getTrendIcon(agent.trend)}
                              </div>
                              <div className="grid grid-cols-5 gap-4 mb-3">
                                <div className="text-center">
                                  <p className="text-lg font-bold text-amber-900">{agent.overallScore}</p>
                                  <p className="text-xs text-amber-600">Overall</p>
                                </div>
                                {agent.kpiScores.slice(0, 4).map((kpi) => (
                                  <div key={kpi.metricId} className="text-center">
                                    <p className="text-sm font-medium text-amber-900">{kpi.value}</p>
                                    <p className="text-xs text-amber-600">{kpi.metricName.split(' ')[0]}</p>
                                  </div>
                                ))}
                              </div>
                              <div className="flex items-center gap-4 text-xs text-amber-600">
                                <span>Next Review: {agent.nextReview.toLocaleDateString()}</span>
                                <span>•</span>
                                <span>Achievements: {agent.achievements.length}</span>
                                <span>•</span>
                                <span>Goals: {agent.goals.filter(g => g.status === 'achieved').length}/{agent.goals.length}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4 mr-2" />
                              Review
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

          {/* Goals Tab */}
          <TabsContent value="goals" className="space-y-6">
            <Card className="border-amber-200 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-amber-900">
                      <Flag className="h-5 w-5 text-amber-600" />
                      Performance Goals
                    </CardTitle>
                    <CardDescription>Track individual, team, and organizational goals</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-amber-500" />
                      <Input
                        placeholder="Search goals..."
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
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="efficiency">Efficiency</SelectItem>
                        <SelectItem value="quality">Quality</SelectItem>
                        <SelectItem value="development">Development</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button className="bg-amber-600 hover:bg-amber-700" onClick={() => setShowGoalDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Goal
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredGoals.map((goal) => (
                    <Card key={goal.id} className="border-amber-200 shadow-md hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Badge className={getStatusColor(goal.status)}>
                              {goal.status}
                            </Badge>
                            <Badge className={getPriorityColor(goal.priority)}>
                              {goal.priority}
                            </Badge>
                            <Badge variant="outline">
                              {goal.type}
                            </Badge>
                          </div>
                          <div className="text-sm text-amber-600">
                            Due: {goal.dueDate.toLocaleDateString()}
                          </div>
                        </div>
                        <h3 className="font-semibold text-amber-900 mb-2">{goal.title}</h3>
                        <p className="text-sm text-amber-600 mb-4">{goal.description}</p>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-amber-600">Progress</span>
                            <span className="text-sm font-medium text-amber-900">{goal.progress}%</span>
                          </div>
                          <Progress value={goal.progress} />
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-amber-600">
                              Current: {goal.currentValue} • Target: {goal.targetValue}
                            </span>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Button>
                              <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-6">
            <Card className="border-amber-200 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-amber-900">
                      <Star className="h-5 w-5 text-amber-600" />
                      Performance Reviews
                    </CardTitle>
                    <CardDescription>Manage and track performance reviews</CardDescription>
                  </div>
                  <Button className="bg-amber-600 hover:bg-amber-700" onClick={() => setShowReviewDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule Review
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <Card key={review.id} className="border-amber-200 shadow-md hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Badge className={getStatusColor(review.status)}>
                              {review.status}
                            </Badge>
                            <Badge variant="outline">{review.type}</Badge>
                          </div>
                          <div className="text-sm text-amber-600">
                            {review.date.toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-amber-900">{review.agentName}</h3>
                            <p className="text-sm text-amber-600">Reviewer: {review.reviewer} • Period: {review.period}</p>
                          </div>
                          {review.overallScore && (
                            <div className="text-right">
                              <p className="text-2xl font-bold text-amber-900">{review.overallScore}</p>
                              <p className="text-xs text-amber-600">Overall Score</p>
                            </div>
                          )}
                        </div>
                        {review.categoryScores.length > 0 && (
                          <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
                            {review.categoryScores.map((category, index) => (
                              <div key={index} className="text-center p-2 bg-amber-50 rounded">
                                <p className="font-medium text-amber-900">{category.score}</p>
                                <p className="text-xs text-amber-600">{category.category}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="mt-4 flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-2" />
                            View Review
                          </Button>
                          {review.status === 'scheduled' && (
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                              <Play className="h-4 w-4 mr-2" />
                              Start Review
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Achievements */}
              <Card className="border-amber-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-900">
                    <Trophy className="h-5 w-5 text-amber-600" />
                    Top Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {agentPerformances.flatMap(agent => agent.achievements)
                      .sort((a, b) => b.points - a.points)
                      .slice(0, 6)
                      .map((achievement, index) => (
                        <div key={achievement.id} className={`flex items-center gap-4 p-3 rounded-lg border ${getRarityColor(achievement.rarity)}`}>
                          <div className="text-2xl">{achievement.icon}</div>
                          <div className="flex-1">
                            <h4 className="font-medium text-amber-900">{achievement.name}</h4>
                            <p className="text-sm text-amber-600">{achievement.description}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <Badge className={getLevelColor(achievement.level)}>
                                {achievement.level}
                              </Badge>
                              <span className="text-xs text-amber-500">{achievement.points} points</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-amber-500">
                              {achievement.earnedAt.toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Achievement Statistics */}
              <Card className="border-amber-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-900">
                    <Award className="h-5 w-5 text-amber-600" />
                    Achievement Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-amber-50 rounded-lg">
                        <p className="text-2xl font-bold text-amber-900">47</p>
                        <p className="text-xs text-amber-600">Total Achievements</p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-900">12</p>
                        <p className="text-xs text-purple-600">Legendary Achievements</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-amber-900 mb-3">Achievement by Level</h4>
                      <div className="space-y-2">
                        {['diamond', 'platinum', 'gold', 'silver', 'bronze'].map((level) => (
                          <div key={level} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${getLevelColor(level).split(' ')[0]}`} />
                              <span className="text-sm capitalize">{level}</span>
                            </div>
                            <span className="text-sm font-medium text-amber-900">
                              {agentPerformances.flatMap(a => a.achievements).filter(ach => ach.level === level).length}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Over Time */}
              <Card className="border-amber-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-900">
                    <LineChart className="h-5 w-5 text-amber-600" />
                    Performance Over Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-amber-50 rounded-lg flex items-center justify-center">
                    <div className="text-center text-amber-600">
                      <LineChart className="h-12 w-12 mx-auto mb-2" />
                      <p>Performance trend line chart</p>
                      <p className="text-sm">Showing monthly performance trends</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* KPI Correlation */}
              <Card className="border-amber-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-900">
                    <Activity className="h-5 w-5 text-amber-600" />
                    KPI Correlation Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-amber-50 rounded-lg flex items-center justify-center">
                    <div className="text-center text-amber-600">
                      <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                      <p>KPI correlation matrix</p>
                      <p className="text-sm">Relationships between different metrics</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Team Comparison */}
              <Card className="border-amber-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-900">
                    <Users className="h-5 w-5 text-amber-600" />
                    Team Performance Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-amber-50 rounded-lg flex items-center justify-center">
                    <div className="text-center text-amber-600">
                      <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                      <p>Team comparison chart</p>
                      <p className="text-sm">Side-by-side team performance metrics</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Predictive Analytics */}
              <Card className="border-amber-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-900">
                    <TrendingUp className="h-5 w-5 text-amber-600" />
                    Predictive Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-amber-50 rounded-lg flex items-center justify-center">
                    <div className="text-center text-amber-600">
                      <Target className="h-12 w-12 mx-auto mb-2" />
                      <p>Performance predictions</p>
                      <p className="text-sm">AI-powered forecasting and insights</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Goal Creation Dialog */}
      <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Performance Goal</DialogTitle>
            <DialogDescription>
              Set up a new performance goal with targets and milestones
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Goal Title</Label>
                <Input className="mt-2" placeholder="Enter goal title" />
              </div>
              <div>
                <Label>Category</Label>
                <Select>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="efficiency">Efficiency</SelectItem>
                    <SelectItem value="quality">Quality</SelectItem>
                    <SelectItem value="development">Development</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea className="mt-2" placeholder="Describe the goal and its importance" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Target Value</Label>
                <Input className="mt-2" type="number" placeholder="0" />
              </div>
              <div>
                <Label>Due Date</Label>
                <Input className="mt-2" type="date" />
              </div>
              <div>
                <Label>Priority</Label>
                <Select>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline">Cancel</Button>
              <Button className="bg-amber-600 hover:bg-amber-700">Create Goal</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Performance Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Schedule Performance Review</DialogTitle>
            <DialogDescription>
              Set up a performance review for an agent
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Select Agent</Label>
                <Select>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Choose agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {agentPerformances.map((agent) => (
                      <SelectItem key={agent.agentId} value={agent.agentId}>
                        {agent.agentName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Review Type</Label>
                <Select>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Review Period</Label>
                <Input className="mt-2" placeholder="e.g., 2024-10" />
              </div>
              <div>
                <Label>Scheduled Date</Label>
                <Input className="mt-2" type="datetime-local" />
              </div>
            </div>
            <div>
              <Label>Reviewer</Label>
              <Select>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select reviewer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jane-smith">Jane Smith</SelectItem>
                  <SelectItem value="john-doe">John Doe</SelectItem>
                  <SelectItem value="sarah-wilson">Sarah Wilson</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline">Cancel</Button>
              <Button className="bg-amber-600 hover:bg-amber-700">Schedule Review</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PerformanceManagementSystem;