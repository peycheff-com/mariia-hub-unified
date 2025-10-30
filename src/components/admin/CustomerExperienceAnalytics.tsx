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
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ScatterChart,
  Scatter
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Heart,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertTriangle,
  Star,
  Route,
  Eye,
  Calendar,
  Filter,
  Download,
  UserCheck,
  Activity,
  Zap,
  Target,
  ThumbsUp,
  ThumbsDown,
  Smile,
  Frown,
  Meh,
  User,
  Navigation,
  BarChart3,
  PieChart as PieChartIcon,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface CustomerJourneyData {
  journeyId: string;
  customerId: string;
  customerName: string;
  touchpoints: {
    id: string;
    type: 'support_ticket' | 'booking' | 'knowledge_base' | 'payment' | 'feedback';
    channel: string;
    timestamp: string;
    duration?: number;
    satisfaction?: number;
    outcome: 'positive' | 'neutral' | 'negative';
    description: string;
  }[];
  overallSatisfaction: number;
  journeyValue: number;
  frictionPoints: number;
  completedSuccessfully: boolean;
}

interface ExperienceMetrics {
  metricName: string;
  currentValue: number;
  targetValue: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

interface SatisfactionDriver {
  factor: string;
  impact: number;
  correlation: number;
  recommendations: string[];
}

interface CustomerSegment {
  segment: string;
  count: number;
  avgSatisfaction: number;
  avgJourneyValue: number;
  churnRisk: number;
  characteristics: string[];
}

const CustomerExperienceAnalytics: React.FC = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [journeyData, setJourneyData] = useState<CustomerJourneyData[]>([]);
  const [experienceMetrics, setExperienceMetrics] = useState<ExperienceMetrics[]>([]);
  const [satisfactionDrivers, setSatisfactionDrivers] = useState<SatisfactionDriver[]>([]);
  const [customerSegments, setCustomerSegments] = useState<CustomerSegment[]>([]);

  // Mock data - in real app this would come from the analytics service
  const mockJourneyData: CustomerJourneyData[] = [
    {
      journeyId: '1',
      customerId: 'c1',
      customerName: 'Anna Kowalska',
      touchpoints: [
        {
          id: 't1',
          type: 'support_ticket',
          channel: 'chat',
          timestamp: '2024-01-15T10:00:00Z',
          duration: 15,
          satisfaction: 4,
          outcome: 'positive',
          description: 'Booking assistance for facial treatment'
        },
        {
          id: 't2',
          type: 'booking',
          channel: 'online',
          timestamp: '2024-01-15T10:15:00Z',
          duration: 5,
          satisfaction: 5,
          outcome: 'positive',
          description: 'Successfully booked appointment'
        },
        {
          id: 't3',
          type: 'feedback',
          channel: 'email',
          timestamp: '2024-01-17T09:00:00Z',
          satisfaction: 5,
          outcome: 'positive',
          description: 'Post-appointment satisfaction survey'
        }
      ],
      overallSatisfaction: 4.7,
      journeyValue: 850,
      frictionPoints: 0,
      completedSuccessfully: true
    },
    {
      journeyId: '2',
      customerId: 'c2',
      customerName: 'Piotr Nowak',
      touchpoints: [
        {
          id: 't4',
          type: 'support_ticket',
          channel: 'email',
          timestamp: '2024-01-15T14:00:00Z',
          duration: 180,
          satisfaction: 2,
          outcome: 'negative',
          description: 'Payment processing issue'
        },
        {
          id: 't5',
          type: 'support_ticket',
          channel: 'phone',
          timestamp: '2024-01-15T17:00:00Z',
          duration: 25,
          satisfaction: 3,
          outcome: 'neutral',
          description: 'Follow-up call for payment resolution'
        },
        {
          id: 't6',
          type: 'payment',
          channel: 'online',
          timestamp: '2024-01-15T17:30:00Z',
          satisfaction: 4,
          outcome: 'positive',
          description: 'Payment completed successfully'
        }
      ],
      overallSatisfaction: 3.0,
      journeyValue: 450,
      frictionPoints: 2,
      completedSuccessfully: true
    }
  ];

  const mockExperienceMetrics: ExperienceMetrics[] = [
    {
      metricName: 'Customer Satisfaction Score (CSAT)',
      currentValue: 4.6,
      targetValue: 4.5,
      trend: 'up',
      trendPercentage: 3.5,
      status: 'excellent'
    },
    {
      metricName: 'Net Promoter Score (NPS)',
      currentValue: 72,
      targetValue: 70,
      trend: 'up',
      trendPercentage: 5.2,
      status: 'excellent'
    },
    {
      metricName: 'Customer Effort Score (CES)',
      currentValue: 2.1,
      targetValue: 2.5,
      trend: 'down',
      trendPercentage: -8.3,
      status: 'excellent'
    },
    {
      metricName: 'Journey Completion Rate',
      currentValue: 94.5,
      targetValue: 90,
      trend: 'up',
      trendPercentage: 2.8,
      status: 'excellent'
    },
    {
      metricName: 'First Contact Resolution',
      currentValue: 88.2,
      targetValue: 85,
      trend: 'up',
      trendPercentage: 1.5,
      status: 'good'
    }
  ];

  const mockSatisfactionDrivers: SatisfactionDriver[] = [
    {
      factor: 'Response Time',
      impact: 0.82,
      correlation: -0.68,
      recommendations: [
        'Maintain current response time performance',
        'Focus on real-time chat improvements',
        'Monitor peak hours for staffing adjustments'
      ]
    },
    {
      factor: 'Agent Empathy',
      impact: 0.76,
      correlation: 0.71,
      recommendations: [
        'Continue empathy training programs',
        'Share best practices across team',
        'Recognize agents with high empathy scores'
      ]
    },
    {
      factor: 'Resolution Quality',
      impact: 0.91,
      correlation: 0.78,
      recommendations: [
        'Enhance knowledge base accessibility',
        'Provide advanced technical training',
        'Implement peer review processes'
      ]
    },
    {
      factor: 'Channel Preference Match',
      impact: 0.65,
      correlation: 0.54,
      recommendations: [
        'Analyze channel preference patterns',
        'Improve cross-channel consistency',
        'Offer personalized channel options'
      ]
    }
  ];

  const mockCustomerSegments: CustomerSegment[] = [
    {
      segment: 'VIP Clients',
      count: 45,
      avgSatisfaction: 4.8,
      avgJourneyValue: 1250,
      churnRisk: 5,
      characteristics: ['High-value', 'Frequent visitors', 'Multiple services']
    },
    {
      segment: 'Regular Clients',
      count: 280,
      avgSatisfaction: 4.5,
      avgJourneyValue: 450,
      churnRisk: 12,
      characteristics: ['Repeat bookings', 'Medium value', 'Loyal']
    },
    {
      segment: 'New Clients',
      count: 156,
      avgSatisfaction: 4.2,
      avgJourneyValue: 280,
      churnRisk: 25,
      characteristics: ['First-time visitors', 'Trial bookings', 'Price sensitive']
    },
    {
      segment: 'At-Risk Clients',
      count: 23,
      avgSatisfaction: 2.8,
      avgJourneyValue: 320,
      churnRisk: 68,
      characteristics: ['Recent issues', 'Declining satisfaction', 'Reduced engagement']
    }
  ];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setJourneyData(mockJourneyData);
      setExperienceMetrics(mockExperienceMetrics);
      setSatisfactionDrivers(mockSatisfactionDrivers);
      setCustomerSegments(mockCustomerSegments);
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

  const getTouchpointIcon = (type: string) => {
    switch (type) {
      case 'support_ticket': return <MessageSquare className="h-4 w-4" />;
      case 'booking': return <Calendar className="h-4 w-4" />;
      case 'knowledge_base': return <Eye className="h-4 w-4" />;
      case 'payment': return <Target className="h-4 w-4" />;
      case 'feedback': return <Star className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'positive': return 'text-green-600';
      case 'neutral': return 'text-yellow-600';
      case 'negative': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getOutcomeIcon = (outcome: string) => {
    switch (outcome) {
      case 'positive': return <ThumbsUp className="h-4 w-4" />;
      case 'neutral': return <Meh className="h-4 w-4" />;
      case 'negative': return <ThumbsDown className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getSatisfactionEmoji = (score: number) => {
    if (score >= 4.5) return <Smile className="h-5 w-5 text-green-500" />;
    if (score >= 3.5) return <Meh className="h-5 w-5 text-yellow-500" />;
    return <Frown className="h-5 w-5 text-red-500" />;
  };

  const journeyValueData = journeyData.map(journey => ({
    customerName: journey.customerName.split(' ')[0],
    journeyValue: journey.journeyValue,
    satisfaction: journey.overallSatisfaction,
    frictionPoints: journey.frictionPoints
  }));

  const segmentDistribution = customerSegments.map(segment => ({
    name: segment.segment,
    value: segment.count,
    satisfaction: segment.avgSatisfaction
  }));

  const COLORS = ['#8B4513', '#F5DEB3', '#CD853F', '#DEB887'];

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
          <h1 className="text-3xl font-bold text-[#8B4513]">Customer Experience Analytics</h1>
          <p className="text-muted-foreground">Comprehensive insights into customer journeys and satisfaction</p>
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

          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Insights
          </Button>

          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Experience Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {experienceMetrics.map((metric, index) => (
          <Card key={index} className={`border-l-4 ${getStatusColor(metric.status)}`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{metric.metricName}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between mb-2">
                <div className="text-2xl font-bold">
                  {metric.metricName.includes('Score') ? metric.currentValue.toFixed(1) : metric.currentValue}
                  {metric.metricName.includes('Score') && !metric.metricName.includes('NPS') && '/5.0'}
                  {metric.metricName.includes('CSAT') && ''}
                  {metric.metricName.includes('NPS') && ''}
                  {metric.metricName.includes('CES') && '/5.0'}
                  {!metric.metricName.includes('Score') && '%'}
                </div>
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
                Target: {metric.metricName.includes('Score') ? metric.targetValue.toFixed(1) : metric.targetValue}
                {metric.metricName.includes('Score') && !metric.metricName.includes('NPS') && '/5.0'}
                {metric.metricName.includes('Score') && !metric.metricName.includes('CES') && ''}
                {metric.metricName.includes('NPS') && ''}
                {metric.metricName.includes('CES') && '/5.0'}
                {!metric.metricName.includes('Score') && '%'}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Experience Analysis Tabs */}
      <Tabs defaultValue="journeys" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="journeys">Customer Journeys</TabsTrigger>
          <TabsTrigger value="segments">Segments</TabsTrigger>
          <TabsTrigger value="drivers">Satisfaction Drivers</TabsTrigger>
          <TabsTrigger value="friction">Friction Points</TabsTrigger>
          <TabsTrigger value="insights">Strategic Insights</TabsTrigger>
        </TabsList>

        {/* Customer Journeys Tab */}
        <TabsContent value="journeys" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Journey Map Visualization */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Route className="h-5 w-5 text-[#8B4513]" />
                  Customer Journey Map
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {journeyData.map((journey) => (
                    <div key={journey.journeyId} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-[#8B4513]" />
                          <span className="font-medium">{journey.customerName}</span>
                          <Badge variant={journey.completedSuccessfully ? 'default' : 'destructive'}>
                            {journey.completedSuccessfully ? 'Completed' : 'Incomplete'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          {getSatisfactionEmoji(journey.overallSatisfaction)}
                          <span className="text-sm font-medium">{journey.overallSatisfaction.toFixed(1)}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {journey.touchpoints.map((touchpoint, index) => (
                          <div key={touchpoint.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                            <div className="flex items-center gap-2">
                              {getTouchpointIcon(touchpoint.type)}
                              <span className="text-sm font-medium">{touchpoint.description}</span>
                            </div>
                            <div className="flex items-center gap-2 ml-auto">
                              {getOutcomeIcon(touchpoint.outcome)}
                              <span className={`text-xs ${getOutcomeColor(touchpoint.outcome)}`}>
                                {touchpoint.outcome}
                              </span>
                              {touchpoint.satisfaction && (
                                <span className="text-xs text-muted-foreground">
                                  ({touchpoint.satisfaction}/5)
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                        <span>Journey Value: ${journey.journeyValue}</span>
                        <span>Friction Points: {journey.frictionPoints}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Journey Value vs Satisfaction */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-[#8B4513]" />
                  Journey Value vs Satisfaction
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="journeyValue" name="Journey Value ($)" />
                    <YAxis dataKey="satisfaction" name="Satisfaction" domain={[0, 5]} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="Customers" data={journeyValueData} fill="#8B4513" />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Customer Segments Tab */}
        <TabsContent value="segments" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Segment Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-[#8B4513]" />
                  Customer Segment Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={segmentDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {segmentDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Segment Details */}
            <Card>
              <CardHeader>
                <CardTitle>Segment Performance Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {customerSegments.map((segment) => (
                    <div key={segment.segment} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">{segment.segment}</h4>
                        <Badge variant="outline">{segment.count} customers</Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Avg Satisfaction</p>
                          <div className="flex items-center gap-2">
                            {getSatisfactionEmoji(segment.avgSatisfaction)}
                            <span className="font-medium">{segment.avgSatisfaction.toFixed(1)}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Avg Journey Value</p>
                          <p className="font-medium">${segment.avgJourneyValue}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span>Churn Risk</span>
                          <span className={`font-medium ${
                            segment.churnRisk < 15 ? 'text-green-600' :
                            segment.churnRisk < 30 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {segment.churnRisk}%
                          </span>
                        </div>
                        <Progress
                          value={segment.churnRisk}
                          className={`h-2 ${
                            segment.churnRisk < 15 ? 'bg-green-100' :
                            segment.churnRisk < 30 ? 'bg-yellow-100' : 'bg-red-100'
                          }`}
                        />
                      </div>

                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-muted-foreground mb-2">Characteristics:</p>
                        <div className="flex flex-wrap gap-1">
                          {segment.characteristics.map((char, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {char}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Satisfaction Drivers Tab */}
        <TabsContent value="drivers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-[#8B4513]" />
                Customer Satisfaction Drivers
              </CardTitle>
              <CardDescription>Key factors influencing customer satisfaction and their impact</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {satisfactionDrivers.map((driver, index) => (
                  <div key={driver.factor} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-lg">{driver.factor}</h4>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Impact Score</p>
                          <p className="font-bold text-lg">{driver.impact.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Correlation</p>
                          <p className={`font-bold ${driver.correlation > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {driver.correlation > 0 ? '+' : ''}{driver.correlation.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Impact Level</p>
                        <Progress value={driver.impact * 100} className="h-3" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Correlation Strength</p>
                        <Progress value={Math.abs(driver.correlation) * 100} className="h-3" />
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Recommendations:</p>
                      <ul className="space-y-1">
                        {driver.recommendations.map((rec, recIndex) => (
                          <li key={recIndex} className="text-sm flex items-start gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Friction Points Tab */}
        <TabsContent value="friction" className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Friction Point Analysis</AlertTitle>
            <AlertDescription>
              Identification of common customer journey obstacles and improvement opportunities.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Processing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Occurrence Rate</span>
                    <span className="font-medium text-red-600">23%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Resolution Time</span>
                    <span className="font-medium">45 min</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Impact on CSAT</span>
                    <span className="font-medium text-red-600">-1.8</span>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-3">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Multi-channel Handoffs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Occurrence Rate</span>
                    <span className="font-medium text-yellow-600">15%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Resolution Time</span>
                    <span className="font-medium">28 min</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Impact on CSAT</span>
                    <span className="font-medium text-yellow-600">-0.9</span>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-3">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Knowledge Base Navigation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Occurrence Rate</span>
                    <span className="font-medium text-yellow-600">18%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Resolution Time</span>
                    <span className="font-medium">12 min</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Impact on CSAT</span>
                    <span className="font-medium text-yellow-600">-0.6</span>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-3">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Strategic Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-[#8B4513]" />
                  Quick Wins
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <h5 className="font-medium text-green-800 mb-1">Optimize Chat Response Time</h5>
                    <p className="text-sm text-green-700">
                      Current 8.2 min vs 15 min target. Already exceeding expectations - maintain current performance.
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <h5 className="font-medium text-blue-800 mb-1">Enhance Agent Empathy Training</h5>
                    <p className="text-sm text-blue-700">
                      High correlation with satisfaction. Consider monthly refresher courses.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="h-5 w-5 text-[#8B4513]" />
                  Strategic Initiatives
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <h5 className="font-medium text-orange-800 mb-1">Payment Process Optimization</h5>
                    <p className="text-sm text-orange-700">
                      Major friction point affecting 23% of customers. Requires immediate attention.
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <h5 className="font-medium text-purple-800 mb-1">At-Risk Customer Intervention</h5>
                    <p className="text-sm text-purple-700">
                      Implement proactive outreach program for 23 at-risk customers.
                    </p>
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

export default CustomerExperienceAnalytics;