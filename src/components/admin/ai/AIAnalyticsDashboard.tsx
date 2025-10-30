/**
 * AI Analytics Dashboard - Comprehensive AI-powered analytics interface
 * Features advanced visualizations, real-time insights, and predictive analytics
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
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
  Scatter,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Brain,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  DollarSign,
  Activity,
  Eye,
  Settings,
  Download,
  RefreshCw,
  Filter,
  Calendar,
  MapPin,
  Zap,
  Shield,
  BarChart3,
  PieChartIcon,
  LineChartIcon
} from 'lucide-react';

// Mock data and interfaces
interface AIInsight {
  id: string;
  title: string;
  description: string;
  category: 'demand' | 'pricing' | 'customer' | 'operational' | 'financial';
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  timestamp: Date;
  metrics: {
    current: number;
    previous: number;
    change: number;
    changePercent: number;
  };
  recommendations: string[];
  visualizations: string[];
}

interface PredictionData {
  serviceId: string;
  serviceName: string;
  predictedDemand: number;
  confidence: number;
  factors: string[];
  timeframe: string;
}

interface AnomalyData {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: Date;
  affectedMetrics: string[];
  recommendedActions: string[];
}

interface SentimentData {
  date: string;
  positive: number;
  negative: number;
  neutral: number;
  overall: number;
  volume: number;
}

interface PerformanceMetrics {
  predictionAccuracy: number;
  anomalyDetectionRate: number;
  recommendationSuccess: number;
  customerSatisfaction: number;
  revenueImpact: number;
  costSavings: number;
}

const AIAnalyticsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyData[]>([]);
  const [sentimentData, setSentimentData] = useState<SentimentData[]>([]);
  const [performance, setPerformance] = useState<PerformanceMetrics>({
    predictionAccuracy: 0,
    anomalyDetectionRate: 0,
    recommendationSuccess: 0,
    customerSatisfaction: 0,
    revenueImpact: 0,
    costSavings: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Load initial data
  useEffect(() => {
    loadDashboardData();
  }, [selectedTimeframe]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Simulate API calls
      await Promise.all([
        loadInsights(),
        loadPredictions(),
        loadAnomalies(),
        loadSentimentData(),
        loadPerformanceMetrics()
      ]);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadInsights = async () => {
    // Mock insights data
    const mockInsights: AIInsight[] = [
      {
        id: '1',
        title: 'Demand Spike Detected for Lip Enhancement Services',
        description: 'AI predicts 35% increase in demand for lip enhancement services over the next 14 days, driven by seasonal trends and social media influence.',
        category: 'demand',
        priority: 'high',
        confidence: 0.92,
        impact: 'high',
        timestamp: new Date(),
        metrics: {
          current: 145,
          previous: 107,
          change: 38,
          changePercent: 35.5
        },
        recommendations: [
          'Increase staff availability for aesthetic services',
          'Adjust pricing to optimize revenue during high demand',
          'Launch targeted marketing campaign',
          'Ensure sufficient inventory of related products'
        ],
        visualizations: ['demand_forecast', 'revenue_projection']
      },
      {
        id: '2',
        title: 'Customer Sentiment Declining in Evening Hours',
        description: 'Analysis of customer feedback shows 15% decrease in satisfaction scores for appointments after 6 PM, likely due to staff fatigue.',
        category: 'customer',
        priority: 'medium',
        confidence: 0.87,
        impact: 'medium',
        timestamp: new Date(),
        metrics: {
          current: 4.2,
          previous: 4.9,
          change: -0.7,
          changePercent: -14.3
        },
        recommendations: [
          'Implement staff rotation schedules',
          'Provide evening shift incentives',
          'Monitor service quality during peak hours',
          'Consider adjusted pricing for premium evening slots'
        ],
        visualizations: ['sentiment_trend', 'hourly_satisfaction']
      },
      {
        id: '3',
        title: 'Optimal Pricing Opportunity for Premium Services',
        description: 'Dynamic pricing analysis suggests 12% price increase opportunity for premium services with minimal impact on demand.',
        category: 'pricing',
        priority: 'medium',
        confidence: 0.78,
        impact: 'high',
        timestamp: new Date(),
        metrics: {
          current: 280,
          previous: 250,
          change: 30,
          changePercent: 12.0
        },
        recommendations: [
          'Implement tiered pricing structure',
          'A/B test price increases',
          'Communicate value proposition effectively',
          'Monitor competitor responses'
        ],
        visualizations: ['price_elasticity', 'revenue_simulation']
      },
      {
        id: '4',
        title: 'Equipment Maintenance Predicted for Laser Device #3',
        description: 'Predictive maintenance model indicates 78% probability of equipment failure within 30 days for laser device #3.',
        category: 'operational',
        priority: 'high',
        confidence: 0.89,
        impact: 'high',
        timestamp: new Date(),
        metrics: {
          current: 0,
          previous: 0,
          change: 0,
          changePercent: 0
        },
        recommendations: [
          'Schedule preventive maintenance immediately',
          'Arrange backup equipment',
          'Notify affected customers',
          'Update maintenance schedules'
        ],
        visualizations: ['equipment_health', 'maintenance_timeline']
      }
    ];
    setInsights(mockInsights);
  };

  const loadPredictions = async () => {
    // Mock prediction data
    const mockPredictions: PredictionData[] = [
      { serviceId: 'lip_enhancement', serviceName: 'Lip Enhancement', predictedDemand: 186, confidence: 0.92, factors: ['seasonal_trend', 'social_media', 'local_events'], timeframe: '14d' },
      { serviceId: 'brow_lamination', serviceName: 'Brow Lamination', predictedDemand: 124, confidence: 0.87, factors: ['seasonal_trend', 'customer_preferences'], timeframe: '14d' },
      { serviceId: 'facial_treatment', serviceName: 'Advanced Facial', predictedDemand: 98, confidence: 0.78, factors: ['weather_conditions', 'promotions'], timeframe: '14d' },
      { serviceId: 'massage_therapy', serviceName: 'Massage Therapy', predictedDemand: 87, confidence: 0.85, factors: ['stress_levels', 'seasonal_demand'], timeframe: '14d' },
      { serviceId: 'body_contouring', serviceName: 'Body Contouring', predictedDemand: 76, confidence: 0.81, factors: ['fitness_trends', 'seasonal_goals'], timeframe: '14d' }
    ];
    setPredictions(mockPredictions);
  };

  const loadAnomalies = async () => {
    // Mock anomaly data
    const mockAnomalies: AnomalyData[] = [
      {
        id: '1',
        type: 'booking_pattern',
        severity: 'medium',
        description: 'Unusual booking pattern detected - 40% increase in cancellations for Thursday appointments',
        timestamp: new Date(),
        affectedMetrics: ['cancellation_rate', 'booking_conversion'],
        recommendedActions: ['Investigate customer feedback', 'Review Thursday staffing', 'Check promotional conflicts']
      },
      {
        id: '2',
        type: 'payment_anomaly',
        severity: 'low',
        description: 'Multiple small-value transactions from same IP address detected',
        timestamp: new Date(),
        affectedMetrics: ['transaction_patterns', 'fraud_risk'],
        recommendedActions: ['Monitor for further activity', 'Verify customer identities', 'Consider temporary restrictions']
      },
      {
        id: '3',
        type: 'performance_anomaly',
        severity: 'high',
        description: 'Response time increased by 300% for booking system during peak hours',
        timestamp: new Date(),
        affectedMetrics: ['system_performance', 'user_experience'],
        recommendedActions: ['Scale server resources', 'Optimize database queries', 'Implement caching']
      }
    ];
    setAnomalies(mockAnomalies);
  };

  const loadSentimentData = async () => {
    // Mock sentiment data
    const mockSentimentData: SentimentData[] = [
      { date: '2024-01-01', positive: 0.65, negative: 0.15, neutral: 0.20, overall: 0.75, volume: 145 },
      { date: '2024-01-02', positive: 0.70, negative: 0.12, neutral: 0.18, overall: 0.82, volume: 152 },
      { date: '2024-01-03', positive: 0.68, negative: 0.18, neutral: 0.14, overall: 0.78, volume: 138 },
      { date: '2024-01-04', positive: 0.72, negative: 0.10, neutral: 0.18, overall: 0.86, volume: 167 },
      { date: '2024-01-05', positive: 0.58, negative: 0.22, neutral: 0.20, overall: 0.68, volume: 124 },
      { date: '2024-01-06', positive: 0.63, negative: 0.17, neutral: 0.20, overall: 0.73, volume: 156 },
      { date: '2024-01-07', positive: 0.75, negative: 0.08, neutral: 0.17, overall: 0.89, volume: 189 }
    ];
    setSentimentData(mockSentimentData);
  };

  const loadPerformanceMetrics = async () => {
    // Mock performance data
    setPerformance({
      predictionAccuracy: 0.92,
      anomalyDetectionRate: 0.87,
      recommendationSuccess: 0.78,
      customerSatisfaction: 0.85,
      revenueImpact: 0.15,
      costSavings: 0.22
    });
  };

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      demand: '#3b82f6',
      pricing: '#10b981',
      customer: '#f59e0b',
      operational: '#ef4444',
      financial: '#8b5cf6'
    };
    return colors[category] || '#6b7280';
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'high': return <TrendingUp className="h-4 w-4 text-orange-500" />;
      case 'medium': return <Activity className="h-4 w-4 text-yellow-500" />;
      case 'low': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(value);
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Key Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prediction Accuracy</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(performance.predictionAccuracy * 100).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +2.3% from last month
            </p>
            <Progress value={performance.predictionAccuracy * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Anomaly Detection</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(performance.anomalyDetectionRate * 100).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +5.1% detection rate
            </p>
            <Progress value={performance.anomalyDetectionRate * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Impact</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{(performance.revenueImpact * 100).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              {formatCurrency(45780)} increase
            </p>
            <Progress value={performance.revenueImpact * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost Savings</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(28450)}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              {formatCurrency(5230)} this week
            </p>
            <Progress value={performance.costSavings * 100} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Insights & Recommendations
            </CardTitle>
            <CardDescription>
              Real-time AI-powered insights for business optimization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.slice(0, 3).map((insight) => (
                <div key={insight.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getPriorityIcon(insight.priority)}
                      <Badge variant="secondary" style={{ backgroundColor: getCategoryColor(insight.category) }}>
                        {insight.category}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {(insight.confidence * 100).toFixed(0)}% confidence
                    </span>
                  </div>
                  <h4 className="font-semibold">{insight.title}</h4>
                  <p className="text-sm text-muted-foreground">{insight.description}</p>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1">
                      {insight.metrics.changePercent > 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-500" />
                      )}
                      {insight.metrics.changePercent > 0 ? '+' : ''}{insight.metrics.changePercent}%
                    </span>
                    <span>Impact: {insight.impact}</span>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              View All Insights
            </Button>
          </CardContent>
        </Card>

        {/* Demand Forecast Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Service Demand Forecast
            </CardTitle>
            <CardDescription>
              AI-predicted demand for next 14 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={predictions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="serviceName" angle={-45} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="predictedDemand" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Anomalies Alert */}
      {anomalies.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-800">Active Anomalies Detected</AlertTitle>
          <AlertDescription className="text-orange-700">
            {anomalies.length} anomalies require attention.
            <Button variant="link" className="p-0 h-auto text-orange-800 underline">
              View Details
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  const renderPredictionsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">AI Demand Predictions</h3>
          <p className="text-sm text-muted-foreground">
            Machine learning-powered demand forecasting for service optimization
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            Last updated: {lastUpdated.toLocaleTimeString()}
          </Badge>
          <Button size="sm" variant="outline" onClick={loadDashboardData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Prediction Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {predictions.map((prediction) => (
          <Card key={prediction.serviceId}>
            <CardHeader>
              <CardTitle className="text-base">{prediction.serviceName}</CardTitle>
              <CardDescription>
                Next {prediction.timeframe} forecast
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Predicted Demand</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {prediction.predictedDemand}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Confidence</span>
                    <span>{(prediction.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <Progress value={prediction.confidence * 100} />
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Key Factors:</p>
                  <div className="flex flex-wrap gap-1">
                    {prediction.factors.map((factor, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {factor.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Recommended Action</span>
                  <Badge variant={prediction.predictedDemand > 100 ? "default" : "secondary"}>
                    {prediction.predictedDemand > 100 ? "Scale Up" : "Maintain"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderSentimentTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Customer Sentiment Analysis</h3>
          <p className="text-sm text-muted-foreground">
            NLP-powered analysis of customer feedback and reviews
          </p>
        </div>
        <Button size="sm" variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Sentiment Trend Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChartIcon className="h-5 w-5" />
              Sentiment Trend Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={sentimentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 1]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="positive" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="negative" stroke="#ef4444" strokeWidth={2} />
                <Line type="monotone" dataKey="neutral" stroke="#6b7280" strokeWidth={2} />
                <Line type="monotone" dataKey="overall" stroke="#3b82f6" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sentiment Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Sentiment Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Positive', value: 0.68, fill: '#10b981' },
                    { name: 'Neutral', value: 0.18, fill: '#6b7280' },
                    { name: 'Negative', value: 0.14, fill: '#ef4444' }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Sentiment Insights</CardTitle>
          <CardDescription>
            Key patterns and trends from customer feedback analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">68%</div>
              <p className="text-sm text-muted-foreground">Positive Sentiment</p>
              <p className="text-xs text-green-600 mt-1">↑ 5% from last week</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">75%</div>
              <p className="text-sm text-muted-foreground">Overall Satisfaction</p>
              <p className="text-xs text-blue-600 mt-1">↑ 3% from last week</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-gray-600">156</div>
              <p className="text-sm text-muted-foreground">Reviews Analyzed</p>
              <p className="text-xs text-gray-600 mt-1">Last 7 days</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAnomaliesTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Anomaly Detection</h3>
          <p className="text-sm text-muted-foreground">
            Real-time monitoring and alerting for unusual patterns
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={anomalies.some(a => a.severity === 'critical') ? "destructive" : "secondary"}>
            {anomalies.length} Active Anomalies
          </Badge>
          <Button size="sm" variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Anomaly List */}
      <div className="space-y-4">
        {anomalies.map((anomaly) => (
          <Card key={anomaly.id} className={`border-l-4 ${
            anomaly.severity === 'critical' ? 'border-l-red-500' :
            anomaly.severity === 'high' ? 'border-l-orange-500' :
            anomaly.severity === 'medium' ? 'border-l-yellow-500' :
            'border-l-blue-500'
          }`}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      anomaly.severity === 'critical' ? 'destructive' :
                      anomaly.severity === 'high' ? 'destructive' :
                      anomaly.severity === 'medium' ? 'default' :
                      'secondary'
                    }>
                      {anomaly.severity.toUpperCase()}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {anomaly.type.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {anomaly.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <h4 className="font-semibold">{anomaly.description}</h4>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Affected metrics:</p>
                    <div className="flex flex-wrap gap-1">
                      {anomaly.affectedMetrics.map((metric, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {metric.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Recommended actions:</p>
                    <ul className="text-sm text-muted-foreground list-disc list-inside">
                      {anomaly.recommendedActions.map((action, index) => (
                        <li key={index}>{action}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline">
                    Investigate
                  </Button>
                  <Button size="sm" variant="ghost">
                    Dismiss
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Advanced AI-powered insights and predictions for business optimization
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <Button size="sm" variant="outline" onClick={loadDashboardData}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
          <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {renderOverviewTab()}
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          {renderPredictionsTab()}
        </TabsContent>

        <TabsContent value="sentiment" className="space-y-4">
          {renderSentimentTab()}
        </TabsContent>

        <TabsContent value="anomalies" className="space-y-4">
          {renderAnomaliesTab()}
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>Powered by Advanced AI Models</span>
          <Separator orientation="vertical" className="h-4" />
          <span>ML Models: 12 Active</span>
          <Separator orientation="vertical" className="h-4" />
          <span>Data Processing: Real-time</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Last updated: {lastUpdated.toLocaleString()}</span>
          <Separator orientation="vertical" className="h-4" />
          <span>Status: All systems operational</span>
        </div>
      </div>
    </div>
  );
};

export default AIAnalyticsDashboard;