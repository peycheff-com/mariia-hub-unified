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
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Award,
  Users,
  Star,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  Eye,
  Target,
  Activity,
  Calendar,
  Filter,
  Download,
  Settings,
  Clock,
  UserCheck,
  BarChart3,
  ThumbsUp,
  BookOpen,
  HeadphonesIcon,
  Heart,
  Zap,
  RefreshCw,
  AlertCircle,
  FileText,
  Clipboard,
  GraduationCap
} from 'lucide-react';

interface QualityScore {
  id: string;
  agentId: string;
  agentName: string;
  ticketId: string;
  evaluationDate: string;
  evaluatorId: string;
  evaluatorName: string;

  // Quality criteria (0-10)
  empathy: number;
  clarity: number;
  efficiency: number;
  knowledge: number;
  professionalism: number;

  // Overall metrics
  overallScore: number;
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';

  // Feedback
  strengths: string[];
  improvementAreas: string[];
  specificFeedback: string;

  // Context
  ticketCategory: string;
  ticketComplexity: 'low' | 'medium' | 'high';
  customerSatisfaction: number;
}

interface AgentQualitySummary {
  agentId: string;
  agentName: string;
  totalEvaluations: number;
  averageScore: number;
  averageGrade: string;
  trend: 'improving' | 'declining' | 'stable';
  lastEvaluationDate: string;

  // Category averages
  empathyAvg: number;
  clarityAvg: number;
  efficiencyAvg: number;
  knowledgeAvg: number;
  professionalismAvg: number;

  // Performance distribution
  gradeDistribution: Record<string, number>;

  // Top areas
  topStrength: string;
  topImprovementArea: string;
}

interface QualityMetrics {
  metricName: string;
  currentValue: number;
  targetValue: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  description: string;
}

interface TrainingOpportunity {
  skill: string;
  currentAverage: number;
  targetLevel: number;
  gap: number;
  affectedAgents: number;
  businessImpact: 'high' | 'medium' | 'low';
  recommendedTraining: string[];
  estimatedImprovement: number;
  investmentRequired: 'low' | 'medium' | 'high';
  roi: number;
}

const QualityAssuranceAnalytics: React.FC = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [qualityScores, setQualityScores] = useState<QualityScore[]>([]);
  const [agentSummaries, setAgentSummaries] = useState<AgentQualitySummary[]>([]);
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetrics[]>([]);
  const [trainingOpportunities, setTrainingOpportunities] = useState<TrainingOpportunity[]>([]);

  // Mock data - in real app this would come from the analytics service
  const mockQualityScores: QualityScore[] = [
    {
      id: '1',
      agentId: '1',
      agentName: 'Anna Kowalska',
      ticketId: 'TK001',
      evaluationDate: '2024-01-15T10:00:00Z',
      evaluatorId: 'eval1',
      evaluatorName: 'Marek Zieliński',

      empathy: 9,
      clarity: 8,
      efficiency: 9,
      knowledge: 10,
      professionalism: 9,

      overallScore: 90,
      grade: 'A+',

      strengths: ['Excellent product knowledge', 'Empathetic communication', 'Quick problem resolution'],
      improvementAreas: ['Could provide more detailed explanations'],
      specificFeedback: 'Anna demonstrated exceptional customer service with deep product knowledge. Her empathetic approach made the customer feel valued. Minor improvement opportunity in providing more comprehensive explanations.',

      ticketCategory: 'Booking Inquiry',
      ticketComplexity: 'medium',
      customerSatisfaction: 5
    },
    {
      id: '2',
      agentId: '2',
      agentName: 'Piotr Nowak',
      ticketId: 'TK002',
      evaluationDate: '2024-01-15T11:30:00Z',
      evaluatorId: 'eval1',
      evaluatorName: 'Marek Zieliński',

      empathy: 7,
      clarity: 8,
      efficiency: 7,
      knowledge: 8,
      professionalism: 8,

      overallScore: 76,
      grade: 'B',

      strengths: ['Clear communication', 'Professional demeanor', 'Good technical knowledge'],
      improvementAreas: ['Show more empathy', 'Improve response efficiency', 'Better active listening'],
      specificFeedback: 'Piotr maintained professionalism throughout the interaction. Technical knowledge is solid, but opportunities exist to show more empathy and improve efficiency in responses.',

      ticketCategory: 'Payment Issue',
      ticketComplexity: 'high',
      customerSatisfaction: 4
    },
    {
      id: '3',
      agentId: '3',
      agentName: 'Ewa Wiśniewska',
      ticketId: 'TK003',
      evaluationDate: '2024-01-15T14:00:00Z',
      evaluatorId: 'eval2',
      evaluatorName: 'Katarzyna Kowalska',

      empathy: 10,
      clarity: 9,
      efficiency: 8,
      knowledge: 8,
      professionalism: 10,

      overallScore: 90,
      grade: 'A+',

      strengths: ['Outstanding empathy', 'Very professional', 'Clear communication'],
      improvementAreas: ['Expand technical knowledge base', 'Improve efficiency'],
      specificFeedback: 'Exceptional performance in customer empathy and professionalism. Clear, concise communication. Focus on expanding technical knowledge for more complex inquiries.',

      ticketCategory: 'Product Information',
      ticketComplexity: 'low',
      customerSatisfaction: 5
    }
  ];

  const mockAgentSummaries: AgentQualitySummary[] = [
    {
      agentId: '1',
      agentName: 'Anna Kowalska',
      totalEvaluations: 12,
      averageScore: 88.5,
      averageGrade: 'A',
      trend: 'improving',
      lastEvaluationDate: '2024-01-15T10:00:00Z',

      empathyAvg: 9.2,
      clarityAvg: 8.8,
      efficiencyAvg: 8.5,
      knowledgeAvg: 9.5,
      professionalismAvg: 9.1,

      gradeDistribution: {
        'A+': 4,
        'A': 6,
        'B+': 2,
        'B': 0,
        'C+': 0,
        'C': 0,
        'D': 0,
        'F': 0
      },

      topStrength: 'Product Knowledge',
      topImprovementArea: 'Efficiency'
    },
    {
      agentId: '2',
      agentName: 'Piotr Nowak',
      totalEvaluations: 10,
      averageScore: 78.2,
      averageGrade: 'B+',
      trend: 'stable',
      lastEvaluationDate: '2024-01-15T11:30:00Z',

      empathyAvg: 7.5,
      clarityAvg: 8.2,
      efficiencyAvg: 7.8,
      knowledgeAvg: 8.0,
      professionalismAvg: 8.3,

      gradeDistribution: {
        'A+': 0,
        'A': 1,
        'B+': 5,
        'B': 3,
        'C+': 1,
        'C': 0,
        'D': 0,
        'F': 0
      },

      topStrength: 'Professionalism',
      topImprovementArea: 'Empathy'
    },
    {
      agentId: '3',
      agentName: 'Ewa Wiśniewska',
      totalEvaluations: 8,
      averageScore: 91.3,
      averageGrade: 'A+',
      trend: 'improving',
      lastEvaluationDate: '2024-01-15T14:00:00Z',

      empathyAvg: 9.8,
      clarityAvg: 9.0,
      efficiencyAvg: 8.5,
      knowledgeAvg: 8.2,
      professionalismAvg: 9.7,

      gradeDistribution: {
        'A+': 5,
        'A': 2,
        'B+': 1,
        'B': 0,
        'C+': 0,
        'C': 0,
        'D': 0,
        'F': 0
      },

      topStrength: 'Empathy',
      topImprovementArea: 'Technical Knowledge'
    }
  ];

  const mockQualityMetrics: QualityMetrics[] = [
    {
      metricName: 'Average Quality Score',
      currentValue: 86.3,
      targetValue: 85,
      trend: 'up',
      trendPercentage: 2.1,
      status: 'excellent',
      description: 'Overall average quality score across all evaluations'
    },
    {
      metricName: 'A+ Grade Percentage',
      currentValue: 42.5,
      targetValue: 40,
      trend: 'up',
      trendPercentage: 5.8,
      status: 'excellent',
      description: 'Percentage of evaluations receiving A+ grade'
    },
    {
      metricName: 'Evaluation Coverage',
      currentValue: 78.2,
      targetValue: 75,
      trend: 'up',
      trendPercentage: 1.9,
      status: 'good',
      description: 'Percentage of interactions evaluated for quality'
    },
    {
      metricName: 'Improvement Rate',
      currentValue: 68.5,
      targetValue: 70,
      trend: 'down',
      trendPercentage: -2.3,
      status: 'warning',
      description: 'Percentage of agents showing improvement in scores'
    }
  ];

  const mockTrainingOpportunities: TrainingOpportunity[] = [
    {
      skill: 'Empathy & Emotional Intelligence',
      currentAverage: 7.8,
      targetLevel: 9.0,
      gap: 1.2,
      affectedAgents: 3,
      businessImpact: 'high',
      recommendedTraining: [
        'Advanced Customer Empathy Workshop',
        'Emotional Intelligence Training',
        'Role-playing Scenarios'
      ],
      estimatedImprovement: 15,
      investmentRequired: 'medium',
      roi: 220
    },
    {
      skill: 'Technical Product Knowledge',
      currentAverage: 8.2,
      targetLevel: 9.5,
      gap: 1.3,
      affectedAgents: 2,
      businessImpact: 'high',
      recommendedTraining: [
        'Advanced Product Training',
        'Technical Certification Program',
        'Knowledge Base Optimization'
      ],
      estimatedImprovement: 12,
      investmentRequired: 'high',
      roi: 180
    },
    {
      skill: 'Efficiency & Time Management',
      currentAverage: 8.1,
      targetLevel: 9.0,
      gap: 0.9,
      affectedAgents: 4,
      businessImpact: 'medium',
      recommendedTraining: [
        'Time Management Techniques',
        'Efficient Response Templates',
        'Workflow Optimization'
      ],
      estimatedImprovement: 10,
      investmentRequired: 'low',
      roi: 150
    }
  ];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setQualityScores(mockQualityScores);
      setAgentSummaries(mockAgentSummaries);
      setQualityMetrics(mockQualityMetrics);
      setTrainingOpportunities(mockTrainingOpportunities);
      setIsLoading(false);
    }, 1000);
  }, [selectedTimeRange]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+': return 'bg-green-100 text-green-800 border-green-200';
      case 'A': return 'bg-green-50 text-green-700 border-green-200';
      case 'B+': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'B': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'C+': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'C': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'D': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'F': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getBusinessImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const radarData = agentSummaries.map(agent => ({
    subject: agent.agentName.split(' ')[0],
    empathy: agent.empathyAvg * 10,
    clarity: agent.clarityAvg * 10,
    efficiency: agent.efficiencyAvg * 10,
    knowledge: agent.knowledgeAvg * 10,
    professionalism: agent.professionalismAvg * 10
  }));

  const gradeDistribution = Object.entries(
    agentSummaries.reduce((acc, agent) => {
      Object.entries(agent.gradeDistribution).forEach(([grade, count]) => {
        acc[grade] = (acc[grade] || 0) + count;
      });
      return acc;
    }, {} as Record<string, number>)
  ).map(([grade, count]) => ({ name: grade, value: count }));

  const COLORS = ['#8B4513', '#F5DEB3', '#CD853F', '#DEB887', '#D2691E', '#BC8F8F', '#F4A460', '#DAA520'];

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
          <h1 className="text-3xl font-bold text-[#8B4513]">Quality Assurance Analytics</h1>
          <p className="text-muted-foreground">Comprehensive quality monitoring and agent performance insights</p>
        </div>

        <div className="flex items-center gap-4">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>

          <select
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="all">All Agents</option>
            {agentSummaries.map(agent => (
              <option key={agent.agentId} value={agent.agentId}>{agent.agentName}</option>
            ))}
          </select>

          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>

          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Configure QA
          </Button>
        </div>
      </div>

      {/* Quality Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {qualityMetrics.map((metric, index) => (
          <Card key={index} className={`border-l-4 ${getStatusColor(metric.status)}`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{metric.metricName}</CardTitle>
              <CardDescription className="text-xs">{metric.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between mb-2">
                <div className="text-2xl font-bold">{metric.currentValue}</div>
                <div className="flex items-center gap-1">
                  {metric.trend === 'up' ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : metric.trend === 'down' ? (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  ) : (
                    <div className="h-4 w-4 bg-gray-300 rounded-full" />
                  )}
                  <span className={`text-xs font-medium ${
                    metric.trend === 'up' ? 'text-green-600' : metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {Math.abs(metric.trendPercentage)}%
                  </span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Target: {metric.targetValue}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quality Analytics Tabs */}
      <Tabs defaultValue="evaluations" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="evaluations">Recent Evaluations</TabsTrigger>
          <TabsTrigger value="performance">Agent Performance</TabsTrigger>
          <TabsTrigger value="training">Training Opportunities</TabsTrigger>
          <TabsTrigger value="trends">Quality Trends</TabsTrigger>
          <TabsTrigger value="calibration">Calibration</TabsTrigger>
        </TabsList>

        {/* Recent Evaluations Tab */}
        <TabsContent value="evaluations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clipboard className="h-5 w-5 text-[#8B4513]" />
                Recent Quality Evaluations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {qualityScores.map((score) => (
                  <div key={score.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4 text-[#8B4513]" />
                          <span className="font-medium">{score.agentName}</span>
                        </div>
                        <Badge className={getGradeColor(score.grade)}>
                          Grade: {score.grade}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">{score.overallScore}/100</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(score.evaluationDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Quality Criteria */}
                    <div className="grid grid-cols-5 gap-4 mb-4">
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <Heart className="h-4 w-4 text-pink-500 mr-1" />
                          <span className="text-xs text-muted-foreground">Empathy</span>
                        </div>
                        <div className="text-lg font-bold">{score.empathy}/10</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <MessageSquare className="h-4 w-4 text-blue-500 mr-1" />
                          <span className="text-xs text-muted-foreground">Clarity</span>
                        </div>
                        <div className="text-lg font-bold">{score.clarity}/10</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <Zap className="h-4 w-4 text-yellow-500 mr-1" />
                          <span className="text-xs text-muted-foreground">Efficiency</span>
                        </div>
                        <div className="text-lg font-bold">{score.efficiency}/10</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <BookOpen className="h-4 w-4 text-green-500 mr-1" />
                          <span className="text-xs text-muted-foreground">Knowledge</span>
                        </div>
                        <div className="text-lg font-bold">{score.knowledge}/10</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <Award className="h-4 w-4 text-purple-500 mr-1" />
                          <span className="text-xs text-muted-foreground">Professional</span>
                        </div>
                        <div className="text-lg font-bold">{score.professionalism}/10</div>
                      </div>
                    </div>

                    {/* Feedback */}
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-green-700 mb-1">Strengths:</p>
                        <ul className="text-sm space-y-1">
                          {score.strengths.map((strength, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {score.improvementAreas.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-orange-700 mb-1">Improvement Areas:</p>
                          <ul className="text-sm space-y-1">
                            {score.improvementAreas.map((area, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <AlertTriangle className="h-3 w-3 text-orange-500 mt-0.5 flex-shrink-0" />
                                {area}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="pt-3 border-t">
                        <p className="text-sm italic text-muted-foreground">
                          "{score.specificFeedback}"
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          — {score.evaluatorName}, Quality Analyst
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Agent Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-[#8B4513]" />
                  Agent Quality Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {agentSummaries.map((agent, index) => (
                    <div key={agent.agentId} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full text-white font-bold ${
                          index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-gray-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{agent.agentName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={getGradeColor(agent.averageGrade)}>
                              {agent.averageGrade}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {agent.totalEvaluations} evaluations
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{agent.averageScore.toFixed(1)}</p>
                        <div className="flex items-center gap-1 justify-end">
                          {agent.trend === 'improving' && <TrendingUp className="h-3 w-3 text-green-500" />}
                          {agent.trend === 'declining' && <TrendingDown className="h-3 w-3 text-red-500" />}
                          <span className="text-xs text-muted-foreground capitalize">{agent.trend}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Radar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-[#8B4513]" />
                  Quality Skills Comparison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    {agentSummaries.map((agent, index) => (
                      <Radar
                        key={agent.agentId}
                        name={agent.agentName}
                        dataKey="empathy"
                        stroke={['#8B4513', '#22c55e', '#3b82f6'][index]}
                        fill={['#8B4513', '#22c55e', '#3b82f6'][index]}
                        fillOpacity={0.3}
                      />
                    ))}
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Grade Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Overall Grade Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={gradeDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {gradeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3">
                  {gradeDistribution.map((grade) => (
                    <div key={grade.name} className="flex items-center justify-between">
                      <Badge className={getGradeColor(grade.name)}>
                        {grade.name}
                      </Badge>
                      <span className="font-medium">{grade.value} evaluations</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Training Opportunities Tab */}
        <TabsContent value="training" className="space-y-6">
          <Alert>
            <GraduationCap className="h-4 w-4" />
            <AlertTitle>Training Opportunities Analysis</AlertTitle>
            <AlertDescription>
              AI-powered identification of skill gaps and training recommendations with ROI estimates.
            </AlertDescription>
          </Alert>

          <div className="space-y-6">
            {trainingOpportunities.map((opportunity, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{opportunity.skill}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className={getBusinessImpactColor(opportunity.businessImpact)}>
                        {opportunity.businessImpact} impact
                      </Badge>
                      <Badge variant="outline">
                        {opportunity.affectedAgents} agents affected
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Current Performance */}
                    <div>
                      <h5 className="font-medium mb-3">Current Performance</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Current Average</span>
                          <span className="font-medium">{opportunity.currentAverage}/10</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Target Level</span>
                          <span className="font-medium">{opportunity.targetLevel}/10</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Skill Gap</span>
                          <span className="font-medium text-orange-600">{opportunity.gap} points</span>
                        </div>
                      </div>
                      <div className="mt-3">
                        <Progress
                          value={(opportunity.currentAverage / opportunity.targetLevel) * 100}
                          className="h-2"
                        />
                      </div>
                    </div>

                    {/* Training Recommendations */}
                    <div>
                      <h5 className="font-medium mb-3">Recommended Training</h5>
                      <ul className="space-y-2">
                        {opportunity.recommendedTraining.map((training, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                            {training}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Business Impact */}
                    <div>
                      <h5 className="font-medium mb-3">Business Impact</h5>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm">Est. Improvement</span>
                          <span className="font-medium text-green-600">+{opportunity.estimatedImprovement}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Investment Required</span>
                          <Badge variant="outline">{opportunity.investmentRequired}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">ROI</span>
                          <span className="font-medium text-green-600">{opportunity.roi}%</span>
                        </div>
                      </div>
                      <Button className="w-full mt-4">
                        <GraduationCap className="h-4 w-4 mr-2" />
                        Schedule Training
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Quality Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quality Score Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={['Week 1', 'Week 2', 'Week 3', 'Week 4']} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="value"
                      data={[82, 84, 86, 86.3]}
                      stroke="#8B4513"
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Grade Distribution Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={['Week 1', 'Week 2', 'Week 3', 'Week 4']} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="A+" stackId="a" fill="#22c55e" data={[2, 3, 4, 4]} />
                    <Bar dataKey="A" stackId="a" fill="#10b981" data={[3, 4, 3, 3]} />
                    <Bar dataKey="B+" stackId="a" fill="#3b82f6" data={[4, 3, 3, 3]} />
                    <Bar dataKey="B" stackId="a" fill="#6b7280" data={[2, 2, 1, 1]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Calibration Tab */}
        <TabsContent value="calibration" className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Calibration Management</AlertTitle>
            <AlertDescription>
              Ensure consistency and fairness in quality evaluations across all analysts.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Calibration Scores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Marek Zieliński</span>
                      <Badge variant="outline">Senior Analyst</Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Avg Calibration Score</span>
                        <span className="font-medium">92.5%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Evaluation Count</span>
                        <span className="font-medium">24</span>
                      </div>
                      <Progress value={92.5} className="h-2 mt-2" />
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Katarzyna Kowalska</span>
                      <Badge variant="outline">QA Analyst</Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Avg Calibration Score</span>
                        <span className="font-medium">88.2%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Evaluation Count</span>
                        <span className="font-medium">18</span>
                      </div>
                      <Progress value={88.2} className="h-2 mt-2" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Calibration Activities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h5 className="font-medium mb-2">Next Calibration Session</h5>
                    <p className="text-sm text-muted-foreground mb-3">
                      Scheduled for January 20, 2024 at 2:00 PM
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4" />
                        <span>3 sample tickets to review</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4" />
                        <span>All QA analysts participating</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full mt-3">
                      View Details
                    </Button>
                  </div>

                  <Button className="w-full">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Calibration Session
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QualityAssuranceAnalytics;