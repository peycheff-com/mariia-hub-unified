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
  Scatter,
  ComposedChart
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Target,
  AlertTriangle,
  Award,
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
  Brain,
  Building,
  ShoppingCart,
  Heart,
  Star,
  Globe,
  HeadphonesIcon,
  MessageSquare,
  FileText,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';

interface BusinessMetrics {
  revenue: {
    total: number;
    supportAttributed: number;
    retentionRevenue: number;
    upsellRevenue: number;
    growth: number;
  };
  costs: {
    total: number;
    agentCosts: number;
    technologyCosts: number;
    trainingCosts: number;
    reduction: number;
  };
  roi: {
    supportROI: number;
    customerLifetimeValue: number;
    costPerAcquisition: number;
    costPerRetention: number;
  };
  operational: {
    ticketVolume: number;
    resolutionRate: number;
    satisfactionScore: number;
    agentProductivity: number;
  };
}

interface StrategicInsight {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  category: 'revenue' | 'cost' | 'efficiency' | 'customer';
  timeframe: 'immediate' | 'short-term' | 'long-term';
  metrics: {
    current: number;
    projected: number;
    unit: string;
  }[];
  actions: string[];
  owner: string;
  status: 'planned' | 'in-progress' | 'completed';
}

interface MarketComparison {
  metric: string;
  yourValue: number;
  industryAverage: number;
  topQuartile: number;
  percentile: number;
  trend: 'improving' | 'declining' | 'stable';
}

interface CostOptimization {
  area: string;
  currentCost: number;
  optimizedCost: number;
  savings: number;
  savingsPercentage: number;
  implementationComplexity: 'low' | 'medium' | 'high';
  timeframe: string;
  risk: 'low' | 'medium' | 'high';
  description: string;
}

interface RevenueOpportunity {
  source: string;
  currentRevenue: number;
  potentialRevenue: number;
  uplift: number;
  upliftPercentage: number;
  confidence: number;
  requiredInvestment: number;
  expectedROI: number;
  timeframe: string;
  description: string;
}

const BusinessIntelligence: React.FC = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('90d');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [businessMetrics, setBusinessMetrics] = useState<BusinessMetrics | null>(null);
  const [strategicInsights, setStrategicInsights] = useState<StrategicInsight[]>([]);
  const [marketComparison, setMarketComparison] = useState<MarketComparison[]>([]);
  const [costOptimizations, setCostOptimizations] = useState<CostOptimization[]>([]);
  const [revenueOpportunities, setRevenueOpportunities] = useState<RevenueOpportunity[]>([]);

  // Mock data - in real app this would come from the analytics service
  const mockBusinessMetrics: BusinessMetrics = {
    revenue: {
      total: 2500000,
      supportAttributed: 375000,
      retentionRevenue: 285000,
      upsellRevenue: 90000,
      growth: 12.5
    },
    costs: {
      total: 850000,
      agentCosts: 420000,
      technologyCosts: 180000,
      trainingCosts: 85000,
      reduction: 8.2
    },
    roi: {
      supportROI: 245,
      customerLifetimeValue: 8500,
      costPerAcquisition: 450,
      costPerRetention: 125
    },
    operational: {
      ticketVolume: 12500,
      resolutionRate: 94.2,
      satisfactionScore: 4.6,
      agentProductivity: 87.5
    }
  };

  const mockStrategicInsights: StrategicInsight[] = [
    {
      id: '1',
      title: 'Premium Support Package Launch',
      description: 'Launch VIP support tier with dedicated agents and priority response for high-value customers',
      impact: 'high',
      effort: 'medium',
      category: 'revenue',
      timeframe: 'short-term',
      metrics: [
        { current: 0, projected: 150000, unit: '$' },
        { current: 0, projected: 45, unit: 'customers' }
      ],
      actions: [
        'Define service level agreements',
        'Train dedicated support agents',
        'Develop pricing strategy',
        'Create marketing materials'
      ],
      owner: 'Support Director',
      status: 'planned'
    },
    {
      id: '2',
      title: 'AI-Powered Response Optimization',
      description: 'Implement AI assistance for agents to improve response quality and reduce handling time',
      impact: 'medium',
      effort: 'high',
      category: 'efficiency',
      timeframe: 'long-term',
      metrics: [
        { current: 15.2, projected: 11.5, unit: 'min avg response' },
        { current: 94.2, projected: 96.8, unit: '% resolution rate' }
      ],
      actions: [
        'Evaluate AI vendors',
        'Pilot with small team',
        'Integration with existing systems',
        'Full rollout plan'
      ],
      owner: 'CTO',
      status: 'planned'
    },
    {
      id: '3',
      title: 'Knowledge Base Self-Service Optimization',
      description: 'Enhance self-service capabilities to reduce ticket volume and improve customer satisfaction',
      impact: 'high',
      effort: 'low',
      category: 'cost',
      timeframe: 'immediate',
      metrics: [
        { current: 12500, projected: 9500, unit: 'monthly tickets' },
        { current: 24, projected: 35, unit: '% self-service rate' }
      ],
      actions: [
        'Analyze common inquiries',
        'Create comprehensive articles',
        'Improve search functionality',
        'Promote self-service options'
      ],
      owner: 'Knowledge Manager',
      status: 'in-progress'
    }
  ];

  const mockMarketComparison: MarketComparison[] = [
    {
      metric: 'Customer Satisfaction',
      yourValue: 4.6,
      industryAverage: 4.2,
      topQuartile: 4.7,
      percentile: 85,
      trend: 'improving'
    },
    {
      metric: 'First Response Time',
      yourValue: 12.5,
      industryAverage: 18.5,
      topQuartile: 8.0,
      percentile: 90,
      trend: 'improving'
    },
    {
      metric: 'Support Cost per Ticket',
      yourValue: 68,
      industryAverage: 85,
      topQuartile: 45,
      percentile: 75,
      trend: 'improving'
    },
    {
      metric: 'Agent Utilization',
      yourValue: 87.5,
      industryAverage: 78.0,
      topQuartile: 92.0,
      percentile: 80,
      trend: 'stable'
    }
  ];

  const mockCostOptimizations: CostOptimization[] = [
    {
      area: 'Staffing Optimization',
      currentCost: 420000,
      optimizedCost: 378000,
      savings: 42000,
      savingsPercentage: 10,
      implementationComplexity: 'medium',
      timeframe: '3-6 months',
      risk: 'low',
      description: 'Optimize agent scheduling based on predictive analytics to reduce overstaffing during low-volume periods'
    },
    {
      area: 'Technology Consolidation',
      currentCost: 180000,
      optimizedCost: 144000,
      savings: 36000,
      savingsPercentage: 20,
      implementationComplexity: 'high',
      timeframe: '6-12 months',
      risk: 'medium',
      description: 'Consolidate multiple support tools into unified platform to reduce licensing and maintenance costs'
    },
    {
      area: 'Process Automation',
      currentCost: 85000,
      optimizedCost: 68000,
      savings: 17000,
      savingsPercentage: 20,
      implementationComplexity: 'low',
      timeframe: '1-3 months',
      risk: 'low',
      description: 'Automate routine tasks like ticket categorization and basic responses using AI and workflows'
    }
  ];

  const mockRevenueOpportunities: RevenueOpportunity[] = [
    {
      source: 'Premium Support Tier',
      currentRevenue: 0,
      potentialRevenue: 150000,
      uplift: 150000,
      upliftPercentage: 100,
      confidence: 75,
      requiredInvestment: 25000,
      expectedROI: 500,
      timeframe: '6 months',
      description: 'Launch premium support with dedicated agents and SLA guarantees for enterprise customers'
    },
    {
      source: 'Cross-Sell Integration',
      currentRevenue: 90000,
      potentialRevenue: 165000,
      uplift: 75000,
      upliftPercentage: 83,
      confidence: 85,
      requiredInvestment: 15000,
      expectedROI: 400,
      timeframe: '3 months',
      description: 'Integrate proactive service recommendations during support interactions'
    },
    {
      source: 'Training & Consulting',
      currentRevenue: 0,
      potentialRevenue: 85000,
      uplift: 85000,
      upliftPercentage: 100,
      confidence: 60,
      requiredInvestment: 20000,
      expectedROI: 325,
      timeframe: '9 months',
      description: 'Offer paid training sessions and best practices consulting for premium customers'
    }
  ];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setBusinessMetrics(mockBusinessMetrics);
      setStrategicInsights(mockStrategicInsights);
      setMarketComparison(mockMarketComparison);
      setCostOptimizations(mockCostOptimizations);
      setRevenueOpportunities(mockRevenueOpportunities);
      setIsLoading(false);
    }, 1000);
  }, [selectedTimeRange]);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <ArrowUpRight className="h-4 w-4 text-green-500" />;
      case 'declining': return <ArrowDownRight className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const COLORS = ['#8B4513', '#F5DEB3', '#CD853F', '#DEB887'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B4513]"></div>
      </div>
    );
  }

  if (!businessMetrics) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">No business intelligence data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#8B4513]">Business Intelligence & Strategic Insights</h1>
          <p className="text-muted-foreground">Executive dashboard for strategic decision making and business impact analysis</p>
        </div>

        <div className="flex items-center gap-4">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="180d">Last 180 Days</option>
            <option value="365d">Last Year</option>
          </select>

          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>

          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>

      {/* Key Business Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Support-Attributed Revenue */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Support Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(businessMetrics.revenue.supportAttributed)}</div>
            <div className="flex items-center gap-2 mt-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-600">+{businessMetrics.revenue.growth}% growth</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {((businessMetrics.revenue.supportAttributed / businessMetrics.revenue.total) * 100).toFixed(1)}% of total revenue
            </div>
          </CardContent>
        </Card>

        {/* Support ROI */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Support ROI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{businessMetrics.roi.supportROI}%</div>
            <div className="flex items-center gap-2 mt-2">
              <Award className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-blue-600">Industry Leading</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Every $1 invested returns ${businessMetrics.roi.supportROI / 100}
            </div>
          </CardContent>
        </Card>

        {/* Customer Lifetime Value */}
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Customer LTV
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(businessMetrics.roi.customerLifetimeValue)}</div>
            <div className="flex items-center gap-2 mt-2">
              <Heart className="h-4 w-4 text-purple-500" />
              <span className="text-sm text-purple-600">Premium Segment</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Driven by exceptional support experience
            </div>
          </CardContent>
        </Card>

        {/* Cost Reduction */}
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Cost Reduction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{businessMetrics.costs.reduction}%</div>
            <div className="flex items-center gap-2 mt-2">
              <TrendingDown className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-orange-600">Optimized</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {formatCurrency(businessMetrics.costs.total * (businessMetrics.costs.reduction / 100))} saved annually
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Business Intelligence Tabs */}
      <Tabs defaultValue="insights" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="insights">Strategic Insights</TabsTrigger>
          <TabsTrigger value="financial">Financial Analysis</TabsTrigger>
          <TabsTrigger value="benchmarking">Competitive Benchmarking</TabsTrigger>
          <TabsTrigger value="optimization">Optimization Opportunities</TabsTrigger>
          <TabsTrigger value="executive">Executive Summary</TabsTrigger>
        </TabsList>

        {/* Strategic Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Strategic Initiatives */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-[#8B4513]" />
                  Strategic Initiatives
                </CardTitle>
                <CardDescription>High-impact opportunities for business growth and optimization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {strategicInsights.map((insight) => (
                    <div key={insight.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{insight.title}</h4>
                        <div className="flex items-center gap-2">
                          <Badge className={getImpactColor(insight.impact)}>
                            {insight.impact} impact
                          </Badge>
                          <Badge className={getEffortColor(insight.effort)}>
                            {insight.effort} effort
                          </Badge>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>

                      <div className="grid grid-cols-2 gap-3 mb-3">
                        {insight.metrics.map((metric, index) => (
                          <div key={index} className="text-center p-2 bg-gray-50 rounded">
                            <p className="text-xs text-muted-foreground">{metric.unit}</p>
                            <p className="font-medium">
                              {metric.unit === '$' ? formatCurrency(metric.current) : metric.current}
                              {metric.projected > metric.current && ' → '}
                              {metric.unit === '$' ? formatCurrency(metric.projected) : metric.projected}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          Owner: {insight.owner} • {insight.timeframe}
                        </span>
                        <Badge variant={insight.status === 'completed' ? 'default' : 'outline'}>
                          {insight.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Impact Matrix */}
            <Card>
              <CardHeader>
                <CardTitle>Impact-Effort Matrix</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Quick Wins */}
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h5 className="font-medium text-green-800 mb-2">Quick Wins</h5>
                      <p className="text-sm text-green-700 mb-3">High impact, low effort initiatives</p>
                      <div className="space-y-2">
                        {strategicInsights
                          .filter(i => i.impact === 'high' && i.effort === 'low')
                          .map(insight => (
                            <div key={insight.id} className="text-sm">
                              • {insight.title}
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Major Projects */}
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h5 className="font-medium text-blue-800 mb-2">Major Projects</h5>
                      <p className="text-sm text-blue-700 mb-3">High impact, high effort initiatives</p>
                      <div className="space-y-2">
                        {strategicInsights
                          .filter(i => i.impact === 'high' && i.effort === 'high')
                          .map(insight => (
                            <div key={insight.id} className="text-sm">
                              • {insight.title}
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Fill-ins */}
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h5 className="font-medium text-yellow-800 mb-2">Fill-ins</h5>
                      <p className="text-sm text-yellow-700 mb-3">Low impact, low effort initiatives</p>
                      <div className="space-y-2">
                        {strategicInsights
                          .filter(i => i.impact === 'low' && i.effort === 'low')
                          .map(insight => (
                            <div key={insight.id} className="text-sm">
                              • {insight.title}
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Thankless Tasks */}
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h5 className="font-medium text-red-800 mb-2">Avoid</h5>
                      <p className="text-sm text-red-700 mb-3">Low impact, high effort initiatives</p>
                      <div className="space-y-2">
                        {strategicInsights
                          .filter(i => i.impact === 'low' && i.effort === 'high')
                          .map(insight => (
                            <div key={insight.id} className="text-sm">
                              • {insight.title}
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Financial Analysis Tab */}
        <TabsContent value="financial" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Support Revenue Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Direct Retention', value: businessMetrics.revenue.retentionRevenue },
                        { name: 'Upsell/Cross-sell', value: businessMetrics.revenue.upsellRevenue },
                        { name: 'New Customer Acquisition', value: businessMetrics.revenue.supportAttributed - businessMetrics.revenue.retentionRevenue - businessMetrics.revenue.upsellRevenue }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    >
                      {[
                        { name: 'Direct Retention', value: businessMetrics.revenue.retentionRevenue },
                        { name: 'Upsell/Cross-sell', value: businessMetrics.revenue.upsellRevenue },
                        { name: 'New Customer Acquisition', value: businessMetrics.revenue.supportAttributed - businessMetrics.revenue.retentionRevenue - businessMetrics.revenue.upsellRevenue }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Cost Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Support Cost Structure</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Agent Costs</span>
                        <span className="font-medium">{formatCurrency(businessMetrics.costs.agentCosts)}</span>
                      </div>
                      <Progress
                        value={(businessMetrics.costs.agentCosts / businessMetrics.costs.total) * 100}
                        className="h-2"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Technology Costs</span>
                        <span className="font-medium">{formatCurrency(businessMetrics.costs.technologyCosts)}</span>
                      </div>
                      <Progress
                        value={(businessMetrics.costs.technologyCosts / businessMetrics.costs.total) * 100}
                        className="h-2"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Training & Development</span>
                        <span className="font-medium">{formatCurrency(businessMetrics.costs.trainingCosts)}</span>
                      </div>
                      <Progress
                        value={(businessMetrics.costs.trainingCosts / businessMetrics.costs.total) * 100}
                        className="h-2"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Other Costs</span>
                        <span className="font-medium">
                          {formatCurrency(businessMetrics.costs.total - businessMetrics.costs.agentCosts - businessMetrics.costs.technologyCosts - businessMetrics.costs.trainingCosts)}
                        </span>
                      </div>
                      <Progress
                        value={((businessMetrics.costs.total - businessMetrics.costs.agentCosts - businessMetrics.costs.technologyCosts - businessMetrics.costs.trainingCosts) / businessMetrics.costs.total) * 100}
                        className="h-2"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex justify-between">
                      <span className="font-medium">Total Costs</span>
                      <span className="font-bold text-lg">{formatCurrency(businessMetrics.costs.total)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Opportunities */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Growth Opportunities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {revenueOpportunities.map((opportunity, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{opportunity.source}</h4>
                      <Badge variant="outline">{opportunity.timeframe}</Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Current Revenue</p>
                        <p className="font-medium">{formatCurrency(opportunity.currentRevenue)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Potential Revenue</p>
                        <p className="font-medium text-green-600">{formatCurrency(opportunity.potentialRevenue)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Uplift</p>
                        <p className="font-medium text-green-600">+{opportunity.upliftPercentage}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Expected ROI</p>
                        <p className="font-medium">{opportunity.expectedROI}%</p>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground">{opportunity.description}</p>

                    <div className="flex items-center justify-between mt-3">
                      <div className="text-xs text-muted-foreground">
                        Investment: {formatCurrency(opportunity.requiredInvestment)} • Confidence: {opportunity.confidence}%
                      </div>
                      <Button size="sm" variant="outline">
                        View Plan
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Competitive Benchmarking Tab */}
        <TabsContent value="benchmarking" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-[#8B4513]" />
                Competitive Performance Benchmarking
              </CardTitle>
              <CardDescription>Compare your support performance against industry standards and top performers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {marketComparison.map((metric, index) => (
                  <div key={index} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium">{metric.metric}</h4>
                        {getTrendIcon(metric.trend)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          Top {100 - metric.percentile}th Percentile
                        </Badge>
                        <span className="text-sm font-medium">{metric.yourValue}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Your Performance</p>
                        <p className="text-lg font-bold text-blue-600">{metric.yourValue}</p>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Industry Average</p>
                        <p className="text-lg font-bold text-yellow-600">{metric.industryAverage}</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Top Quartile</p>
                        <p className="text-lg font-bold text-green-600">{metric.topQuartile}</p>
                      </div>
                    </div>

                    <Progress
                      value={metric.percentile}
                      className="h-3"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Optimization Opportunities Tab */}
        <TabsContent value="optimization" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cost Optimization */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-[#8B4513]" />
                  Cost Optimization Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {costOptimizations.map((optimization, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">{optimization.area}</h4>
                        <Badge variant="outline">{optimization.timeframe}</Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Current Cost</p>
                          <p className="font-medium">{formatCurrency(optimization.currentCost)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Optimized Cost</p>
                          <p className="font-medium text-green-600">{formatCurrency(optimization.optimizedCost)}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-green-600 font-medium">
                          Savings: {formatCurrency(optimization.savings)} ({optimization.savingsPercentage}%)
                        </span>
                        <Badge variant={optimization.risk === 'low' ? 'default' : 'destructive'}>
                          {optimization.risk} risk
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground">{optimization.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Total Savings Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Potential Savings Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center p-6 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-600 mb-2">Total Annual Savings Potential</p>
                    <p className="text-3xl font-bold text-green-700">
                      {formatCurrency(costOptimizations.reduce((sum, opt) => sum + opt.savings, 0))}
                    </p>
                    <p className="text-sm text-green-600 mt-2">
                      {((costOptimizations.reduce((sum, opt) => sum + opt.savings, 0) / businessMetrics.costs.total) * 100).toFixed(1)}% of total costs
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h5 className="font-medium">Implementation Priority</h5>
                    <div className="space-y-2">
                      {costOptimizations
                        .filter(opt => opt.implementationComplexity === 'low')
                        .map((opt, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded">
                            <span className="text-sm font-medium">{opt.area}</span>
                            <span className="text-sm text-green-600">
                              {formatCurrency(opt.savings)} savings
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

        {/* Executive Summary Tab */}
        <TabsContent value="executive" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Key Performance Summary */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Executive Performance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h5 className="font-medium mb-3 text-green-600">Strengths</h5>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>Industry-leading customer satisfaction (4.6/5.0)</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>Exceptional support ROI (245%)</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>Top-quartile response time performance</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>Strong revenue growth attribution (15% of total)</span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h5 className="font-medium mb-3 text-orange-600">Opportunities</h5>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2 text-sm">
                          <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                          <span>Premium support tier launch ($150K potential)</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                          <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                          <span>AI-powered efficiency improvements (20% uplift)</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                          <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                          <span>Self-service optimization ($95K annual savings)</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                          <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                          <span>Cross-sell integration enhancement ($75K uplift)</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h5 className="font-medium text-blue-800 mb-2">Strategic Recommendations</h5>
                    <ol className="space-y-2 text-sm text-blue-700">
                      <li>1. Launch premium support tier within Q2 2024</li>
                      <li>2. Invest in AI-powered agent assistance tools</li>
                      <li>3. Expand knowledge base self-service capabilities</li>
                      <li>4. Implement advanced analytics for churn prediction</li>
                      <li>5. Develop proactive customer success programs</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-[#8B4513]">{businessMetrics.roi.supportROI}%</p>
                      <p className="text-sm text-muted-foreground">Support ROI</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(businessMetrics.revenue.supportAttributed)}</p>
                      <p className="text-sm text-muted-foreground">Attributed Revenue</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{formatCurrency(businessMetrics.roi.customerLifetimeValue)}</p>
                      <p className="text-sm text-muted-foreground">Customer LTV</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Next Steps</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button className="w-full" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download Executive Report
                    </Button>
                    <Button className="w-full" variant="outline">
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule Strategy Review
                    </Button>
                    <Button className="w-full">
                      <Target className="h-4 w-4 mr-2" />
                      Implement Priority Initiatives
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BusinessIntelligence;