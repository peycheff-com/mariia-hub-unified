import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  LineChart, Line, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import {
  Users, Trophy, Target, TrendingUp, Clock, Star, MessageSquare,
  Award, AlertCircle, CheckCircle, Settings, Download, Filter,
  Eye, Calendar, BarChart3, Zap, UserCheck, UserX, Activity
} from 'lucide-react';

import { supportAnalyticsService } from '@/services/support-analytics.service';
import { customerSatisfactionAnalyticsService } from '@/services/customer-satisfaction-analytics.service';
import {
  AgentPerformanceDashboard,
  SupportTeamMetrics,
  SupportQAEvaluation,
  SupportTrainingRecord
} from '@/types/support-analytics';

interface TeamPerformanceDashboardProps {
  teamId?: string;
  timeRange?: {
    start: string;
    end: string;
  };
}

const TeamPerformanceDashboard: React.FC<TeamPerformanceDashboardProps> = ({
  teamId,
  timeRange
}) => {
  const [selectedTeam, setSelectedTeam] = useState<string>(teamId || 'all');
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange || {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [agents, setAgents] = useState<AgentPerformanceDashboard[]>([]);
  const [teamMetrics, setTeamMetrics] = useState<SupportTeamMetrics | null>(null);
  const [topPerformers, setTopPerformers] = useState<AgentPerformanceDashboard[]>([]);
  const [needsImprovement, setNeedsImprovement] = useState<AgentPerformanceDashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock team data - in real app, this would come from API
  const teams = [
    { id: 'all', name: 'All Teams' },
    { id: 'team1', name: 'Beauty Services' },
    { id: 'team2', name: 'Fitness Programs' },
    { id: 'team3', name: 'Technical Support' },
    { id: 'team4', name: 'Customer Success' }
  ];

  // Mock agent IDs for demonstration
  const agentIds = [
    '123e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174001',
    '123e4567-e89b-12d3-a456-426614174002',
    '123e4567-e89b-12d3-a456-426614174003',
    '123e4567-e89b-12d3-a456-426614174004'
  ];

  useEffect(() => {
    fetchTeamPerformanceData();
  }, [selectedTeam, selectedTimeRange]);

  const fetchTeamPerformanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      const filter = { date_range: selectedTimeRange };

      // Fetch performance data for each agent
      const agentPerformancePromises = agentIds.map(agentId =>
        supportAnalyticsService.getAgentPerformance(agentId, filter)
      );

      const agentData = await Promise.all(agentPerformancePromises);

      // Filter by team if specified
      const filteredAgents = selectedTeam === 'all'
        ? agentData
        : agentData.filter(agent => agent.agent_id.startsWith(selectedTeam)); // Mock team filtering

      setAgents(filteredAgents);

      // Sort and categorize agents
      const sortedAgents = [...filteredAgents].sort((a, b) =>
        b.current_satisfaction_score - a.current_satisfaction_score
      );

      setTopPerformers(sortedAgents.slice(0, 5));
      setNeedsImprovement(sortedAgents.slice(-3));

      // Mock team metrics - in real app, this would be calculated from team data
      setTeamMetrics({
        id: 'team-metrics',
        team_name: selectedTeam === 'all' ? 'All Teams' : teams.find(t => t.id === selectedTeam)?.name || 'Unknown Team',
        measurement_date: new Date().toISOString().split('T')[0],
        total_agents: filteredAgents.length,
        active_agents: Math.floor(filteredAgents.length * 0.8),
        tickets_handled: filteredAgents.reduce((sum, agent) => sum + agent.tickets_handled_today, 0),
        tickets_resolved: filteredAgents.reduce((sum, agent) => sum + agent.tickets_resolved_today, 0),
        avg_response_time_seconds: filteredAgents.reduce((sum, agent) => sum + agent.avg_response_time_current, 0) / filteredAgents.length,
        avg_resolution_time_seconds: filteredAgents.reduce((sum, agent) => sum + agent.performance_metrics.resolution_time, 0) / filteredAgents.length,
        team_satisfaction_avg: filteredAgents.reduce((sum, agent) => sum + agent.current_satisfaction_score, 0) / filteredAgents.length,
        team_utilization_rate: filteredAgents.reduce((sum, agent) => sum + agent.performance_metrics.utilization_rate, 0) / filteredAgents.length,
        team_adherence_rate: filteredAgents.reduce((sum, agent) => sum + agent.performance_metrics.adherence_percentage, 0) / filteredAgents.length,
        first_contact_resolution_rate: filteredAgents.reduce((sum, agent) => sum + agent.performance_metrics.quality_score, 0) / filteredAgents.length,
        escalation_rate: 0.05, // Mock data
        quality_score_avg: filteredAgents.reduce((sum, agent) => sum + agent.performance_metrics.quality_score, 0) / filteredAgents.length,
        created_at: new Date().toISOString()
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch team performance data');
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceColor = (score: number, thresholds: { excellent: number; good: number }) => {
    if (score >= thresholds.excellent) return 'text-green-600';
    if (score >= thresholds.good) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceBadge = (score: number, thresholds: { excellent: number; good: number }) => {
    if (score >= thresholds.excellent) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (score >= thresholds.good) return <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>;
    return <Badge className="bg-red-100 text-red-800">Needs Improvement</Badge>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <UserCheck className="w-4 h-4 text-green-600" />;
      case 'busy': return <Activity className="w-4 h-4 text-yellow-600" />;
      case 'away': return <Clock className="w-4 h-4 text-gray-600" />;
      default: return <UserX className="w-4 h-4 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-lg font-medium">Loading Team Performance...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600 mb-4">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Error</span>
            </div>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchTeamPerformanceData} className="w-full">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Performance Dashboard</h1>
          <p className="text-gray-600">Monitor and analyze team and individual agent performance</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            {teams.map(team => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Team Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMetrics?.active_agents || 0}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <span>of {teamMetrics?.total_agents || 0} total</span>
              <div className={`w-2 h-2 rounded-full ${
                (teamMetrics?.active_agents || 0) / (teamMetrics?.total_agents || 1) > 0.8 ? 'bg-green-500' : 'bg-yellow-500'
              }`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Satisfaction</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(teamMetrics?.team_satisfaction_avg || 0).toFixed(1)}
            </div>
            <div className={`text-xs ${getPerformanceColor(teamMetrics?.team_satisfaction_avg || 0, { excellent: 4.5, good: 4.0 })}`}>
              Target: 4.5
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Utilization</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((teamMetrics?.team_utilization_rate || 0) * 100).toFixed(0)}%
            </div>
            <Progress value={(teamMetrics?.team_utilization_rate || 0) * 100} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMetrics?.tickets_resolved || 0}</div>
            <div className="text-xs text-muted-foreground">
              Today • {teamMetrics?.tickets_handled} handled
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="individual">Individual</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Team Performance Radar */}
            <Card>
              <CardHeader>
                <CardTitle>Team Performance Overview</CardTitle>
                <CardDescription>Key performance metrics across dimensions</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={[
                    { metric: 'Satisfaction', value: (teamMetrics?.team_satisfaction_avg || 0) * 20, fullMark: 100 },
                    { metric: 'Utilization', value: (teamMetrics?.team_utilization_rate || 0) * 100, fullMark: 100 },
                    { metric: 'Quality', value: (teamMetrics?.quality_score_avg || 0) * 20, fullMark: 100 },
                    { metric: 'Adherence', value: (teamMetrics?.team_adherence_rate || 0), fullMark: 100 },
                    { metric: 'FCR Rate', value: (teamMetrics?.first_contact_resolution_rate || 0), fullMark: 100 },
                    { metric: 'Response Time', value: Math.max(0, 100 - (teamMetrics?.avg_response_time_seconds || 0) / 60), fullMark: 100 }
                  ]}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar name="Performance" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Performance Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Distribution</CardTitle>
                <CardDescription>Agent performance levels across the team</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { level: 'Excellent', count: agents.filter(a => a.current_satisfaction_score >= 4.5).length, color: 'bg-green-500' },
                    { level: 'Good', count: agents.filter(a => a.current_satisfaction_score >= 4.0 && a.current_satisfaction_score < 4.5).length, color: 'bg-blue-500' },
                    { level: 'Average', count: agents.filter(a => a.current_satisfaction_score >= 3.5 && a.current_satisfaction_score < 4.0).length, color: 'bg-yellow-500' },
                    { level: 'Needs Improvement', count: agents.filter(a => a.current_satisfaction_score < 3.5).length, color: 'bg-red-500' }
                  ].map((level) => (
                    <div key={level.level} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${level.color}`} />
                        <span className="text-sm font-medium">{level.level}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold">{level.count}</span>
                        <span className="text-xs text-gray-500">
                          ({((level.count / agents.length) * 100).toFixed(0)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Team Metrics Table */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Team Metrics Summary</CardTitle>
                <CardDescription>Key performance indicators for the selected team</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Avg Response Time', value: `${Math.round((teamMetrics?.avg_response_time_seconds || 0) / 60)}m`, unit: '' },
                    { label: 'Avg Resolution Time', value: `${Math.round((teamMetrics?.avg_resolution_time_seconds || 0) / 60)}m`, unit: '' },
                    { label: 'First Contact Resolution', value: `${((teamMetrics?.first_contact_resolution_rate || 0) * 100).toFixed(1)}%`, unit: '' },
                    { label: 'Quality Score', value: `${(teamMetrics?.quality_score_avg || 0).toFixed(1)}`, unit: '/5.0' },
                    { label: 'Schedule Adherence', value: `${((teamMetrics?.team_adherence_rate || 0) * 100).toFixed(1)}%`, unit: '' },
                    { label: 'Utilization Rate', value: `${((teamMetrics?.team_utilization_rate || 0) * 100).toFixed(1)}%`, unit: '' },
                    { label: 'Escalation Rate', value: `${((teamMetrics?.escalation_rate || 0) * 100).toFixed(1)}%`, unit: '' },
                    { label: 'Tickets per Agent', value: Math.round((teamMetrics?.tickets_handled || 0) / (teamMetrics?.active_agents || 1)), unit: '' }
                  ].map((metric, index) => (
                    <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {metric.value}{metric.unit}
                      </div>
                      <div className="text-sm text-gray-600">{metric.label}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Individual Performance Tab */}
        <TabsContent value="individual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Individual Agent Performance</CardTitle>
              <CardDescription>Detailed performance metrics for each team member</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tickets Today</TableHead>
                    <TableHead>Response Time</TableHead>
                    <TableHead>Satisfaction</TableHead>
                    <TableHead>Utilization</TableHead>
                    <TableHead>Quality Score</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agents.map((agent) => (
                    <TableRow key={agent.agent_id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={agent.agent_avatar} />
                            <AvatarFallback>{agent.agent_name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{agent.agent_name}</div>
                            <div className="text-sm text-gray-500">{agent.tickets_in_queue} in queue</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(agent.current_status)}
                          <span className="text-sm capitalize">{agent.current_status}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{agent.tickets_handled_today}</div>
                          <div className="text-gray-500">{agent.tickets_resolved_today} resolved</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`text-sm font-medium ${getPerformanceColor(
                          60 / (agent.avg_response_time_current / 60),
                          { excellent: 1.2, good: 1.0 }
                        )}`}>
                          {Math.round(agent.avg_response_time_current / 60)}m
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className={`font-medium ${getPerformanceColor(
                            agent.current_satisfaction_score,
                            { excellent: 4.5, good: 4.0 }
                          )}`}>
                            {agent.current_satisfaction_score.toFixed(1)}
                          </span>
                          {getPerformanceBadge(agent.current_satisfaction_score, { excellent: 4.5, good: 4.0 })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">{(agent.performance_metrics.utilization_rate * 100).toFixed(0)}%</span>
                          <Progress value={agent.performance_metrics.utilization_rate * 100} className="w-16 h-2" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`text-sm font-medium ${getPerformanceColor(
                          agent.performance_metrics.quality_score,
                          { excellent: 4.5, good: 4.0 }
                        )}`}>
                          {agent.performance_metrics.quality_score.toFixed(1)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
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

        {/* Quality Performance Tab */}
        <TabsContent value="quality" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quality Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Quality Score Trends</CardTitle>
                <CardDescription>Team quality performance over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={[
                    { date: 'Mon', quality: 4.2, target: 4.5 },
                    { date: 'Tue', quality: 4.3, target: 4.5 },
                    { date: 'Wed', quality: 4.1, target: 4.5 },
                    { date: 'Thu', quality: 4.4, target: 4.5 },
                    { date: 'Fri', quality: 4.5, target: 4.5 },
                    { date: 'Sat', quality: 4.6, target: 4.5 },
                    { date: 'Sun', quality: 4.4, target: 4.5 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[3.5, 5]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="quality" stroke="#8884d8" name="Quality Score" />
                    <Line type="monotone" dataKey="target" stroke="#82ca9d" name="Target" strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Quality Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Quality Breakdown</CardTitle>
                <CardDescription>Quality scores by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { category: 'Communication', score: 4.6, weight: 0.3 },
                    { category: 'Problem Solving', score: 4.4, weight: 0.25 },
                    { category: 'Product Knowledge', score: 4.7, weight: 0.2 },
                    { category: 'Empathy', score: 4.3, weight: 0.15 },
                    { category: 'Efficiency', score: 4.5, weight: 0.1 }
                  ].map((item) => (
                    <div key={item.category} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{item.category}</span>
                        <span className="text-sm font-bold">{item.score}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Progress value={(item.score / 5) * 100} className="flex-1 h-2" />
                        <span className="text-xs text-gray-500 w-12">{(item.weight * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Performers in Quality */}
            <Card>
              <CardHeader>
                <CardTitle>Quality Champions</CardTitle>
                <CardDescription>Agents with highest quality scores</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topPerformers.slice(0, 5).map((agent, index) => (
                    <div key={agent.agent_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                          index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-gray-400' :
                          index === 2 ? 'bg-orange-600' :
                          'bg-blue-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{agent.agent_name}</div>
                          <div className="text-xs text-gray-600">
                            {agent.tickets_resolved_today} tickets resolved
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          {agent.performance_metrics.quality_score.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-500">Quality Score</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quality Improvement Areas */}
            <Card>
              <CardHeader>
                <CardTitle>Quality Improvement Areas</CardTitle>
                <CardDescription>Areas where team can improve quality</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { area: 'Response Personalization', current: 3.8, target: 4.5, gap: 0.7 },
                    { area: 'Technical Accuracy', current: 4.2, target: 4.7, gap: 0.5 },
                    { area: 'Resolution Completeness', current: 4.0, target: 4.6, gap: 0.6 },
                    { area: 'Proactive Support', current: 3.5, target: 4.2, gap: 0.7 }
                  ].map((area) => (
                    <div key={area.area} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-sm">{area.area}</span>
                        <Badge variant="outline">Gap: {area.gap}</Badge>
                      </div>
                      <div className="flex items-center space-x-2 text-xs">
                        <span>Current: {area.current}</span>
                        <span>→</span>
                        <span>Target: {area.target}</span>
                      </div>
                      <Progress value={(area.current / 5) * 100} className="h-2 mt-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>Team Performance Trends</CardTitle>
                <CardDescription>Key metrics over the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={agents[0]?.weekly_performance || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="tickets_handled" stackId="1" stroke="#8884d8" fill="#8884d8" />
                    <Area type="monotone" dataKey="satisfaction" stackId="2" stroke="#82ca9d" fill="#82ca9d" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Utilization Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Utilization & Adherence Trends</CardTitle>
                <CardDescription>Team utilization and schedule adherence over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={[
                    { date: 'Week 1', utilization: 0.82, adherence: 0.88 },
                    { date: 'Week 2', utilization: 0.85, adherence: 0.91 },
                    { date: 'Week 3', utilization: 0.79, adherence: 0.85 },
                    { date: 'Week 4', utilization: 0.87, adherence: 0.92 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0.7, 1]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="utilization" stroke="#8884d8" name="Utilization %" />
                    <Line type="monotone" dataKey="adherence" stroke="#82ca9d" name="Adherence %" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <span>Top Performers</span>
                </CardTitle>
                <CardDescription>Best performing agents this week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topPerformers.map((agent, index) => (
                    <div key={agent.agent_id} className="flex items-center space-x-3 p-3 bg-gradient-to-r from-yellow-50 to-transparent rounded-lg">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-orange-600' :
                        'bg-blue-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{agent.agent_name}</div>
                        <div className="text-sm text-gray-600">
                          {agent.tickets_resolved_today} resolved • {agent.current_satisfaction_score.toFixed(1)} CSAT
                        </div>
                      </div>
                      <Trophy className="w-5 h-5 text-yellow-500" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Most Improved */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <span>Most Improved</span>
                </CardTitle>
                <CardDescription>Agents showing the most improvement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {agents.slice(0, 5).map((agent, index) => (
                    <div key={agent.agent_id} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">
                        {Math.floor(Math.random() * 20) + 5}%
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{agent.agent_name}</div>
                        <div className="text-sm text-gray-600">
                          Improved satisfaction this week
                        </div>
                      </div>
                      <TrendingUp className="w-5 h-5 text-green-500" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Needs Coaching */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span>Needs Coaching</span>
                </CardTitle>
                <CardDescription>Agents requiring additional support</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {needsImprovement.map((agent, index) => (
                    <div key={agent.agent_id} className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white font-bold">
                        {agent.current_satisfaction_score.toFixed(1)}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{agent.agent_name}</div>
                        <div className="text-sm text-gray-600">
                          Below target satisfaction score
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeamPerformanceDashboard;