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
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  ComposedChart
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Brain,
  Users,
  Clock,
  Target,
  AlertTriangle,
  Calendar,
  Filter,
  Download,
  Settings,
  Zap,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  RefreshCw,
  AlertCircle,
  Cpu,
  Database,
  Globe,
  UserCheck,
  UserX,
  MessageSquare,
  DollarSign,
  HeadphonesIcon
} from 'lucide-react';
import { supportAnalyticsServiceEnhanced } from '@/services/support-analytics-enhanced.service';

interface VolumeForecast {
  date: string;
  predicted: number;
  confidenceUpper: number;
  confidenceLower: number;
  actual?: number;
  accuracy?: number;
}

interface StaffingPrediction {
  timeSlot: string;
  predictedVolume: number;
  recommendedAgents: number;
  currentAgents: number;
  utilizationRate: number;
  predictedWaitTime: number;
  serviceLevel: number;
}

interface ChurnRiskCustomer {
  id: string;
  name: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
  recommendations: string[];
  lifetimeValue: number;
  recentIssues: number;
  satisfactionTrend: 'improving' | 'declining' | 'stable';
}

interface SeasonalityPattern {
  month: string;
  avgVolume: number;
  seasonalityIndex: number;
  contributingFactors: string[];
}

interface PredictionAccuracy {
  model: string;
  metric: string;
  accuracy: number;
  mae: number; // Mean Absolute Error
  mape: number; // Mean Absolute Percentage Error
  lastUpdated: string;
}

const PredictiveAnalytics: React.FC = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [selectedModel, setSelectedModel] = useState('linear_regression');
  const [isLoading, setIsLoading] = useState(true);
  const [volumeForecasts, setVolumeForecasts] = useState<VolumeForecast[]>([]);
  const [staffingPredictions, setStaffingPredictions] = useState<StaffingPrediction[]>([]);
  const [churnRiskCustomers, setChurnRiskCustomers] = useState<ChurnRiskCustomer[]>([]);
  const [seasonalityPatterns, setSeasonalityPatterns] = useState<SeasonalityPattern[]>([]);
  const [modelAccuracy, setModelAccuracy] = useState<PredictionAccuracy[]>([]);
  const [isGeneratingForecast, setIsGeneratingForecast] = useState(false);

  // Mock data - in real app this would come from the analytics service
  const mockVolumeForecasts: VolumeForecast[] = [
    {
      date: '2024-01-31',
      predicted: 85,
      confidenceUpper: 102,
      confidenceLower: 68
    },
    {
      date: '2024-02-01',
      predicted: 92,
      confidenceUpper: 110,
      confidenceLower: 74
    },
    {
      date: '2024-02-02',
      predicted: 78,
      confidenceUpper: 94,
      confidenceLower: 62
    },
    {
      date: '2024-02-03',
      predicted: 88,
      confidenceUpper: 106,
      confidenceLower: 70
    },
    {
      date: '2024-02-04',
      predicted: 95,
      confidenceUpper: 114,
      confidenceLower: 76
    },
    {
      date: '2024-02-05',
      predicted: 103,
      confidenceUpper: 124,
      confidenceLower: 82
    },
    {
      date: '2024-02-06',
      predicted: 98,
      confidenceUpper: 118,
      confidenceLower: 78
    }
  ];

  const mockStaffingPredictions: StaffingPrediction[] = [
    {
      timeSlot: '06:00-09:00',
      predictedVolume: 15,
      recommendedAgents: 2,
      currentAgents: 1,
      utilizationRate: 125,
      predictedWaitTime: 12,
      serviceLevel: 75
    },
    {
      timeSlot: '09:00-12:00',
      predictedVolume: 35,
      recommendedAgents: 4,
      currentAgents: 3,
      utilizationRate: 117,
      predictedWaitTime: 8,
      serviceLevel: 82
    },
    {
      timeSlot: '12:00-15:00',
      predictedVolume: 42,
      recommendedAgents: 5,
      currentAgents: 4,
      utilizationRate: 105,
      predictedWaitTime: 6,
      serviceLevel: 88
    },
    {
      timeSlot: '15:00-18:00',
      predictedVolume: 38,
      recommendedAgents: 4,
      currentAgents: 4,
      utilizationRate: 95,
      predictedWaitTime: 4,
      serviceLevel: 92
    },
    {
      timeSlot: '18:00-21:00',
      predictedVolume: 25,
      recommendedAgents: 3,
      currentAgents: 3,
      utilizationRate: 83,
      predictedWaitTime: 3,
      serviceLevel: 95
    },
    {
      timeSlot: '21:00-00:00',
      predictedVolume: 12,
      recommendedAgents: 2,
      currentAgents: 2,
      utilizationRate: 60,
      predictedWaitTime: 2,
      serviceLevel: 98
    }
  ];

  const mockChurnRiskCustomers: ChurnRiskCustomer[] = [
    {
      id: '1',
      name: 'Marek Kowalski',
      riskScore: 85,
      riskLevel: 'critical',
      factors: [
        'Multiple unresolved issues',
        'Declining satisfaction scores',
        'Long resolution times',
        'Recent escalation'
      ],
      recommendations: [
        'Immediate manager outreach',
        'Dedicated senior agent assignment',
        'Service credit offer',
        'Personal follow-up schedule'
      ],
      lifetimeValue: 2500,
      recentIssues: 5,
      satisfactionTrend: 'declining'
    },
    {
      id: '2',
      name: 'Anna Nowak',
      riskScore: 65,
      riskLevel: 'high',
      factors: [
        'Wait time complaints',
        'Channel switching behavior',
        'Reduced engagement'
      ],
      recommendations: [
        'Proactive check-in call',
        'Priority support designation',
        'Process improvement feedback'
      ],
      lifetimeValue: 1800,
      recentIssues: 3,
      satisfactionTrend: 'stable'
    },
    {
      id: '3',
      name: 'Piotr Wiśniewski',
      riskScore: 35,
      riskLevel: 'medium',
      factors: [
        'Single recent issue',
        'Response time concerns'
      ],
      recommendations: [
        'Quality follow-up',
        'Monitor future interactions'
      ],
      lifetimeValue: 1200,
      recentIssues: 1,
      satisfactionTrend: 'stable'
    }
  ];

  const mockSeasonalityPatterns: SeasonalityPattern[] = [
    {
      month: 'January',
      avgVolume: 2850,
      seasonalityIndex: 0.95,
      contributingFactors: ['Post-holiday slowdown', 'New year resolutions']
    },
    {
      month: 'February',
      avgVolume: 2720,
      seasonalityIndex: 0.91,
      contributingFactors: ['Winter season', 'Valentine\'s day prep']
    },
    {
      month: 'March',
      avgVolume: 3150,
      seasonalityIndex: 1.05,
      contributingFactors: ['Spring preparation', 'Spring break travel']
    },
    {
      month: 'April',
      avgVolume: 3280,
      seasonalityIndex: 1.10,
      contributingFactors: ['Spring break peak', 'Easter holiday']
    },
    {
      month: 'May',
      avgVolume: 3420,
      seasonalityIndex: 1.14,
      contributingFactors: ['Mother\'s day', 'Pre-summer preparation']
    },
    {
      month: 'June',
      avgVolume: 3680,
      seasonalityIndex: 1.23,
      contributingFactors: ['Summer season start', 'School holidays']
    }
  ];

  const mockModelAccuracy: PredictionAccuracy[] = [
    {
      model: 'Linear Regression',
      metric: 'Volume Forecast',
      accuracy: 87.5,
      mae: 4.2,
      mape: 8.3,
      lastUpdated: '2024-01-15T10:00:00Z'
    },
    {
      model: 'Random Forest',
      metric: 'Volume Forecast',
      accuracy: 91.2,
      mae: 3.1,
      mape: 6.1,
      lastUpdated: '2024-01-15T10:00:00Z'
    },
    {
      model: 'Neural Network',
      metric: 'Churn Prediction',
      accuracy: 84.7,
      mae: 0.18,
      mape: 12.4,
      lastUpdated: '2024-01-15T10:00:00Z'
    },
    {
      model: 'Gradient Boosting',
      metric: 'Staffing Optimization',
      accuracy: 89.3,
      mae: 0.8,
      mape: 9.2,
      lastUpdated: '2024-01-15T10:00:00Z'
    }
  ];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setVolumeForecasts(mockVolumeForecasts);
      setStaffingPredictions(mockStaffingPredictions);
      setChurnRiskCustomers(mockChurnRiskCustomers);
      setSeasonalityPatterns(mockSeasonalityPatterns);
      setModelAccuracy(mockModelAccuracy);
      setIsLoading(false);
    }, 1000);
  }, [selectedTimeRange]);

  const generateNewForecast = async () => {
    setIsGeneratingForecast(true);
    try {
      // Call the analytics service to generate new forecasts
      const forecasts = await supportAnalyticsServiceEnhanced.generateVolumeForecast(7);
      if (forecasts.length > 0) {
        setVolumeForecasts(forecasts.map(f => ({
          date: f.forecast_date,
          predicted: f.predicted_ticket_volume,
          confidenceUpper: f.confidence_interval_upper,
          confidenceLower: f.confidence_interval_lower
        })));
      }
    } catch (error) {
      console.error('Error generating forecast:', error);
    } finally {
      setIsGeneratingForecast(false);
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getUtilizationColor = (rate: number) => {
    if (rate > 120) return 'text-red-600';
    if (rate > 100) return 'text-orange-600';
    if (rate < 70) return 'text-blue-600';
    return 'text-green-600';
  };

  const getServiceLevelColor = (level: number) => {
    if (level >= 90) return 'text-green-600';
    if (level >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

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
          <h1 className="text-3xl font-bold text-[#8B4513]">Predictive Analytics & Forecasting</h1>
          <p className="text-muted-foreground">AI-powered predictions and insights for proactive decision making</p>
        </div>

        <div className="flex items-center gap-4">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="linear_regression">Linear Regression</option>
            <option value="random_forest">Random Forest</option>
            <option value="neural_network">Neural Network</option>
            <option value="gradient_boosting">Gradient Boosting</option>
          </select>

          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Model Settings
          </Button>

          <Button
            variant="outline"
            onClick={generateNewForecast}
            disabled={isGeneratingForecast}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isGeneratingForecast ? 'animate-spin' : ''}`} />
            {isGeneratingForecast ? 'Generating...' : 'Generate Forecast'}
          </Button>
        </div>
      </div>

      {/* Model Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {modelAccuracy.map((model, index) => (
          <Card key={index} className="border-l-4 border-l-[#8B4513]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{model.model}</CardTitle>
              <CardDescription className="text-xs">{model.metric}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">{model.accuracy.toFixed(1)}%</div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>MAE:</span>
                  <span>{model.mae.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span>MAPE:</span>
                  <span>{model.mape.toFixed(1)}%</span>
                </div>
              </div>
              <Progress value={model.accuracy} className="h-2 mt-3" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="forecasting" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="forecasting">Volume Forecasting</TabsTrigger>
          <TabsTrigger value="staffing">Staffing Optimization</TabsTrigger>
          <TabsTrigger value="churn">Churn Prediction</TabsTrigger>
          <TabsTrigger value="seasonality">Seasonality Analysis</TabsTrigger>
          <TabsTrigger value="accuracy">Model Accuracy</TabsTrigger>
        </TabsList>

        {/* Volume Forecasting Tab */}
        <TabsContent value="forecasting" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Forecast Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-[#8B4513]" />
                  7-Day Volume Forecast
                </CardTitle>
                <CardDescription>
                  Predicted ticket volume with confidence intervals using {selectedModel.replace('_', ' ')} model
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={volumeForecasts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="confidenceUpper"
                      fill="#f5deb3"
                      stroke="none"
                    />
                    <Area
                      type="monotone"
                      dataKey="confidenceLower"
                      fill="#ffffff"
                      stroke="none"
                    />
                    <Line
                      type="monotone"
                      dataKey="predicted"
                      stroke="#8B4513"
                      strokeWidth={3}
                      dot={{ fill: '#8B4513', r: 6 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Forecast Summary */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Forecast Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Average Predicted Volume</span>
                        <span className="font-medium">
                          {Math.round(volumeForecasts.reduce((sum, f) => sum + f.predicted, 0) / volumeForecasts.length)}
                        </span>
                      </div>
                      <Progress
                        value={75}
                        className="h-2"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Peak Day</span>
                        <span className="font-medium">
                          {volumeForecasts.reduce((max, f) => f.predicted > max.predicted ? f : max).date}
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Confidence Level</span>
                        <span className="font-medium">85%</span>
                      </div>
                      <Progress value={85} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Forecast Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500 mt-0.5" />
                      <p className="text-sm">12% increase expected compared to last week</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 text-blue-500 mt-0.5" />
                      <p className="text-sm">Weekend (Feb 3-4) shows highest volume</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                      <p className="text-sm">Staffing adjustment recommended for peak hours</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Staffing Optimization Tab */}
        <TabsContent value="staffing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-[#8B4513]" />
                Staffing Recommendations
              </CardTitle>
              <CardDescription>
                AI-powered staffing optimization based on predicted volume and service level targets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {staffingPredictions.map((prediction, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-[#8B4513]" />
                        <span className="font-medium">{prediction.timeSlot}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={prediction.utilizationRate > 100 ? 'destructive' : 'default'}>
                          {prediction.utilizationRate > 100 ? 'Overstaffed Risk' : 'Optimal'}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Predicted Volume</p>
                        <p className="font-medium">{prediction.predictedVolume} tickets</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Staffing</p>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{prediction.currentAgents}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className="font-medium text-green-600">{prediction.recommendedAgents}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Utilization</p>
                        <p className={`font-medium ${getUtilizationColor(prediction.utilizationRate)}`}>
                          {prediction.utilizationRate}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Service Level</p>
                        <p className={`font-medium ${getServiceLevelColor(prediction.serviceLevel)}`}>
                          {prediction.serviceLevel}%
                        </p>
                      </div>
                    </div>

                    {prediction.utilizationRate > 100 && (
                      <Alert className="mt-3">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Staffing Adjustment Needed</AlertTitle>
                        <AlertDescription>
                          Current staffing may result in {prediction.predictedWaitTime}min average wait time.
                          Consider adding {prediction.recommendedAgents - prediction.currentAgents} agents.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Churn Prediction Tab */}
        <TabsContent value="churn" className="space-y-6">
          <Alert>
            <UserX className="h-4 w-4" />
            <AlertTitle>Churn Risk Analysis</AlertTitle>
            <AlertDescription>
              Machine learning predictions of customer churn risk based on support interaction patterns.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* High-Risk Customers */}
            <Card>
              <CardHeader>
                <CardTitle>High-Risk Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {churnRiskCustomers.map((customer) => (
                    <div key={customer.id} className={`border rounded-lg p-4 ${getRiskLevelColor(customer.riskLevel)}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-current"></div>
                          <span className="font-medium">{customer.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getRiskLevelColor(customer.riskLevel)}>
                            {customer.riskLevel.toUpperCase()}
                          </Badge>
                          <span className="font-bold">{customer.riskScore}%</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Lifetime Value</p>
                          <p className="font-medium">${customer.lifetimeValue}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Recent Issues</p>
                          <p className="font-medium">{customer.recentIssues}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-medium">Risk Factors:</p>
                        <ul className="text-xs space-y-1">
                          {customer.factors.slice(0, 2).map((factor, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <span>•</span>
                              <span>{factor}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <Button variant="outline" size="sm" className="w-full mt-3">
                        View Details
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Churn Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Churn Prevention Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <h5 className="font-medium text-orange-800 mb-2">Immediate Action Required</h5>
                    <p className="text-sm text-orange-700 mb-3">
                      1 customer at critical risk with $2,500 lifetime value
                    </p>
                    <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                      Take Action
                    </Button>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h5 className="font-medium text-blue-800 mb-2">Proactive Interventions</h5>
                    <p className="text-sm text-blue-700 mb-3">
                      2 customers at high risk, total value $3,000
                    </p>
                    <Button size="sm" variant="outline">
                      Schedule Interventions
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <h5 className="font-medium">Common Risk Factors</h5>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Multiple unresolved issues</span>
                        <span className="font-medium text-red-600">45%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Declining satisfaction scores</span>
                        <span className="font-medium text-orange-600">32%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Long resolution times</span>
                        <span className="font-medium text-yellow-600">23%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Seasonality Analysis Tab */}
        <TabsContent value="seasonality" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Seasonality Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[#8B4513]" />
                  Seasonal Patterns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={seasonalityPatterns}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="avgVolume" fill="#8B4513" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Seasonality Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Seasonal Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {seasonalityPatterns.slice(0, 4).map((pattern, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{pattern.month}</span>
                        <Badge variant="outline">
                          Index: {pattern.seasonalityIndex.toFixed(2)}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        Avg Volume: {pattern.avgVolume.toLocaleString()} tickets
                      </div>
                      <div className="space-y-1">
                        {pattern.contributingFactors.slice(0, 2).map((factor, idx) => (
                          <div key={idx} className="text-xs flex items-center gap-1">
                            <span>•</span>
                            <span>{factor}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Model Accuracy Tab */}
        <TabsContent value="accuracy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-[#8B4513]" />
                Model Performance Comparison
              </CardTitle>
              <CardDescription>
                Accuracy metrics and performance comparison across different ML models
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {modelAccuracy.map((model, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-medium">{model.model}</h4>
                        <p className="text-sm text-muted-foreground">{model.metric}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{model.accuracy.toFixed(1)}%</p>
                        <p className="text-xs text-muted-foreground">
                          Updated: {new Date(model.lastUpdated).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Accuracy</p>
                        <Progress value={model.accuracy} className="h-2 mt-1" />
                        <p className="text-sm font-medium mt-1">{model.accuracy.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">MAE</p>
                        <div className="h-2 bg-gray-200 rounded mt-1">
                          <div
                            className="h-2 bg-blue-500 rounded"
                            style={{ width: `${Math.min(model.mae * 10, 100)}%` }}
                          ></div>
                        </div>
                        <p className="text-sm font-medium mt-1">{model.mae.toFixed(1)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">MAPE</p>
                        <div className="h-2 bg-gray-200 rounded mt-1">
                          <div
                            className="h-2 bg-green-500 rounded"
                            style={{ width: `${Math.min(model.mape * 5, 100)}%` }}
                          ></div>
                        </div>
                        <p className="text-sm font-medium mt-1">{model.mape.toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                ))}

                <Alert>
                  <Brain className="h-4 w-4" />
                  <AlertTitle>Model Optimization</AlertTitle>
                  <AlertDescription>
                    Random Forest model shows the highest accuracy (91.2%) for volume forecasting.
                    Consider using Neural Network for churn prediction where specialized patterns are important.
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

export default PredictiveAnalytics;