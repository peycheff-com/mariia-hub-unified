import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui';
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
  Radar
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  Users,
  CheckCircle,
  AlertTriangle,
  Award,
  Activity,
  Calendar,
  Filter,
  Download,
  Settings,
  Zap,
  Timer,
  UserCheck,
  BarChart3,
  Star,
  ThumbsUp,
  AlertCircle,
  RefreshCw,
  Eye,
  MessageSquare,
  Phone,
  Mail,
  HeadphonesIcon
} from 'lucide-react';

interface KPIData {
  id: string;
  name: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  category: 'response' | 'resolution' | 'satisfaction' | 'efficiency' | 'quality';
  description: string;
}

interface AgentKPITracking {
  agentId: string;
  agentName: string;
  kpis: {
    ticketsHandled: number;
    avgResponseTime: number;
    resolutionRate: number;
    satisfactionScore: number;
    qualityScore: number;
    utilizationRate: number;
  };
  ranking: number;
  trend: 'improving' | 'declining' | 'stable';
}

interface KPIAlert {
  id: string;
  kpiName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

interface PerformanceBenchmark {
  metric: string;
  current: number;
  teamAverage: number;
  industryStandard: number;
  bestInClass: number;
  percentile: number;
}

const PerformanceTrackingSystem: React.FC = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [selectedKPI, setSelectedKPI] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [kpiData, setKPIData] = useState<KPIData[]>([]);
  const [agentPerformance, setAgentPerformance] = useState<AgentKPITracking[]>([]);
  const [kpiAlerts, setKPIAlerts] = useState<KPIAlert[]>([]);
  const [benchmarks, setBenchmarks] = useState<PerformanceBenchmark[]>([]);

  // Mock KPI data - in real app this would come from the analytics service
  const mockKPIData: KPIData[] = [
    {
      id: '1',
      name: 'Average Response Time',
      currentValue: 12.5,
      targetValue: 15,
      unit: 'minutes',
      trend: 'down',
      trendPercentage: -8.3,
      status: 'excellent',
      category: 'response',
      description: 'Time to first response for customer inquiries'
    },
    {
      id: '2',
      name: 'Resolution Rate',
      currentValue: 94.2,
      targetValue: 90,
      unit: '%',
      trend: 'up',
      trendPercentage: 2.1,
      status: 'excellent',
      category: 'resolution',
      description: 'Percentage of tickets resolved on first contact'
    },
    {
      id: '3',
      name: 'Customer Satisfaction',
      currentValue: 4.6,
      targetValue: 4.5,
      unit: '/5.0',
      trend: 'up',
      trendPercentage: 4.5,
      status: 'excellent',
      category: 'satisfaction',
      description: 'Average customer satisfaction score'
    },
    {
      id: '4',
      name: 'Agent Utilization',
      currentValue: 78.5,
      targetValue: 85,
      unit: '%',
      trend: 'up',
      trendPercentage: 3.2,
      status: 'good',
      category: 'efficiency',
      description: 'Percentage of agent time spent on productive activities'
    },
    {
      id: '5',
      name: 'Quality Score',
      currentValue: 92.8,
      targetValue: 90,
      unit: '%',
      trend: 'stable',
      trendPercentage: 0.5,
      status: 'excellent',
      category: 'quality',
      description: 'Overall quality assessment score'
    },
    {
      id: '6',
      name: 'SLA Compliance',
      currentValue: 96.3,
      targetValue: 95,
      unit: '%',
      trend: 'up',
      trendPercentage: 1.8,
      status: 'excellent',
      category: 'response',
      description: 'Percentage of tickets meeting SLA requirements'
    }
  ];

  const mockAgentPerformance: AgentKPITracking[] = [
    {
      agentId: '1',
      agentName: 'Anna Kowalska',
      kpis: {
        ticketsHandled: 145,
        avgResponseTime: 8.2,
        resolutionRate: 96.5,
        satisfactionScore: 4.8,
        qualityScore: 95.2,
        utilizationRate: 82.3
      },
      ranking: 1,
      trend: 'improving'
    },
    {
      agentId: '2',
      agentName: 'Piotr Nowak',
      kpis: {
        ticketsHandled: 132,
        avgResponseTime: 11.5,
        resolutionRate: 92.8,
        satisfactionScore: 4.6,
        qualityScore: 91.7,
        utilizationRate: 79.8
      },
      ranking: 2,
      trend: 'stable'
    },
    {
      agentId: '3',
      agentName: 'Ewa Wiśniewska',
      kpis: {
        ticketsHandled: 128,
        avgResponseTime: 14.2,
        resolutionRate: 94.1,
        satisfactionScore: 4.7,
        qualityScore: 93.5,
        utilizationRate: 76.5
      },
      ranking: 3,
      trend: 'improving'
    }
  ];

  const mockBenchmarks: PerformanceBenchmark[] = [
    {
      metric: 'Response Time',
      current: 12.5,
      teamAverage: 15.2,
      industryStandard: 18.5,
      bestInClass: 8.0,
      percentile: 85
    },
    {
      metric: 'Resolution Rate',
      current: 94.2,
      teamAverage: 89.5,
      industryStandard: 85.0,
      bestInClass: 98.5,
      percentile: 92
    },
    {
      metric: 'Satisfaction Score',
      current: 4.6,
      teamAverage: 4.3,
      industryStandard: 4.1,
      bestInClass: 4.9,
      percentile: 88
    }
  ];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setKPIData(mockKPIData);
      setAgentPerformance(mockAgentPerformance);
      setBenchmarks(mockBenchmarks);
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

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'excellent': return 'default';
      case 'good': return 'secondary';
      case 'warning': return 'outline';
      case 'critical': return 'destructive';
      default: return 'outline';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <div className="h-4 w-4 bg-gray-300 rounded-full" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'response': return <Clock className="h-5 w-5" />;
      case 'resolution': return <CheckCircle className="h-5 w-5" />;
      case 'satisfaction': return <Star className="h-5 w-5" />;
      case 'efficiency': return <Zap className="h-5 w-5" />;
      case 'quality': return <Award className="h-5 w-5" />;
      default: return <Activity className="h-5 w-5" />;
    }
  };

  const radarData = agentPerformance.map(agent => ({
    subject: agent.agentName.split(' ')[0],
    response: 100 - (agent.kpis.avgResponseTime / 20) * 100,
    resolution: agent.kpis.resolutionRate,
    satisfaction: (agent.kpis.satisfactionScore / 5) * 100,
    quality: agent.kpis.qualityScore,
    utilization: agent.kpis.utilizationRate
  }));

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
          <h1 className="text-3xl font-bold text-[#8B4513]">Performance Tracking & KPIs</h1>
          <p className="text-muted-foreground">Real-time monitoring of key performance indicators</p>
        </div>

        <div className="flex items-center gap-4">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>

          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>

          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Configure KPIs
          </Button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpiData.map((kpi) => (
          <Card key={kpi.id} className={`border-l-4 ${getStatusColor(kpi.status)}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(kpi.category)}
                  <CardTitle className="text-lg">{kpi.name}</CardTitle>
                </div>
                <Badge variant={getStatusBadgeVariant(kpi.status)}>
                  {kpi.status.toUpperCase()}
                </Badge>
              </div>
              <CardDescription>{kpi.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between mb-4">
                <div>
                  <span className="text-3xl font-bold">{kpi.currentValue}</span>
                  <span className="text-sm text-muted-foreground ml-1">{kpi.unit}</span>
                </div>
                <div className="flex items-center gap-2">
                  {getTrendIcon(kpi.trend)}
                  <span className={`text-sm font-medium ${
                    kpi.trend === 'up' ? 'text-green-600' : kpi.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {Math.abs(kpi.trendPercentage)}%
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress to Target</span>
                  <span>{kpi.targetValue} {kpi.unit}</span>
                </div>
                <Progress
                  value={Math.min((kpi.currentValue / kpi.targetValue) * 100, 100)}
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Details */}
      <Tabs defaultValue="agents" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="agents">Agent Performance</TabsTrigger>
          <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
          <TabsTrigger value="trends">Trend Analysis</TabsTrigger>
          <TabsTrigger value="alerts">KPI Alerts</TabsTrigger>
        </TabsList>

        {/* Agent Performance Tab */}
        <TabsContent value="agents" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-[#8B4513]" />
                  Performance Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {agentPerformance.map((agent, index) => (
                    <div key={agent.agentId} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full text-white font-bold ${
                          index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-gray-600'
                        }`}>
                          {agent.ranking}
                        </div>
                        <div>
                          <p className="font-medium">{agent.agentName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {getTrendIcon(agent.trend)}
                            <span className="text-xs text-muted-foreground capitalize">{agent.trend}</span>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-right">
                        <div>
                          <p className="text-sm font-medium">{agent.kpis.ticketsHandled}</p>
                          <p className="text-xs text-muted-foreground">Tickets</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{agent.kpis.satisfactionScore.toFixed(1)}</p>
                          <p className="text-xs text-muted-foreground">Satisfaction</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{agent.kpis.resolutionRate.toFixed(1)}%</p>
                          <p className="text-xs text-muted-foreground">Resolution</p>
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
                  Team Performance Comparison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    {agentPerformance.map((agent, index) => (
                      <Radar
                        key={agent.agentId}
                        name={agent.agentName}
                        dataKey="response"
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
        </TabsContent>

        {/* Benchmarks Tab */}
        <TabsContent value="benchmarks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-[#8B4513]" />
                Performance Benchmarks
              </CardTitle>
              <CardDescription>Compare your performance against team, industry, and best-in-class standards</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {benchmarks.map((benchmark, index) => (
                  <div key={benchmark.metric} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{benchmark.metric}</h4>
                      <Badge variant="outline">Top {100 - benchmark.percentile}th Percentile</Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">{benchmark.current}</p>
                        <p className="text-sm text-blue-600">Current</p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-lg font-semibold">{benchmark.teamAverage}</p>
                        <p className="text-sm text-muted-foreground">Team Avg</p>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <p className="text-lg font-semibold text-yellow-600">{benchmark.industryStandard}</p>
                        <p className="text-sm text-yellow-600">Industry</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-lg font-semibold text-green-600">{benchmark.bestInClass}</p>
                        <p className="text-sm text-green-600">Best in Class</p>
                      </div>
                    </div>

                    <Progress value={benchmark.percentile} className="h-3" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Response Time Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Response Time Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']} />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="value"
                      data={[15, 14, 12, 13, 12.5, 11, 12.5]}
                      stroke="#8B4513"
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Satisfaction Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Satisfaction Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']} />
                    <YAxis domain={[4, 5]} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="value"
                      data={[4.2, 4.3, 4.5, 4.4, 4.6, 4.7, 4.6]}
                      stroke="#22c55e"
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-[#8B4513]" />
                KPI Alerts
              </CardTitle>
              <CardDescription>Active alerts and notification aria-live="polite" aria-atomic="true"s for KPI performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Agent Utilization Below Target</AlertTitle>
                  <AlertDescription>
                    Current utilization rate is 78.5%, below the 85% target. Consider adjusting staffing levels.
                  </AlertDescription>
                </Alert>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Response Time Improvement Opportunity</AlertTitle>
                  <AlertDescription>
                    Response time has improved by 8.3% this week. Current performance exceeds targets.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PerformanceTrackingSystem;