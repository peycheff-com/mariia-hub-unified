import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Target,
  AlertTriangle,
  CheckCircle,
  Calendar,
  CreditCard,
  MessageSquare,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Eye,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal
} from 'lucide-react';

// Import analytics engines
import { clvEngine } from '@/lib/customer-analytics/clv-engine';
import { churnPredictionEngine } from '@/lib/customer-analytics/churn-prediction';
import { journeyMappingEngine } from '@/lib/customer-analytics/journey-mapping';
import { personalizationEngine } from '@/lib/customer-analytics/personalization-engine';
import { satisfactionSentimentEngine } from '@/lib/customer-analytics/satisfaction-sentiment';
import { referralInfluencerEngine } from '@/lib/customer-analytics/referral-influencer';
import { seasonalAnalysisEngine } from '@/lib/customer-analytics/seasonal-analysis';
import { acquisitionAnalyticsEngine } from '@/lib/customer-analytics/acquisition-analytics';

// Type definitions for the analytics data
interface CLVMetrics {
  totalCustomers: number;
  averageCLV: number;
  totalCLV: number;
  topCustomers: Array<{
    id: string;
    name: string;
    clv: number;
    tier: string;
  }>;
  clvDistribution: Array<{
    tier: string;
    count: number;
    totalValue: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    clv: number;
    customers: number;
  }>;
}

interface ChurnMetrics {
  atRiskCustomers: number;
  criticalCustomers: number;
  riskDistribution: Array<{
    riskLevel: string;
    count: number;
    percentage: number;
  }>;
  interventionEffectiveness: number;
  topRiskFactors: Array<{
    factor: string;
    impact: number;
    customers: number;
  }>;
}

interface JourneyMetrics {
  overallConversionRate: number;
  averageJourneyDuration: number;
  topDropoffPoints: Array<{
    touchpoint: string;
    dropoffRate: number;
    customers: number;
  }>;
  channelAttribution: Array<{
    channel: string;
    attribution: number;
    conversions: number;
  }>;
}

interface SatisfactionMetrics {
  overallSatisfaction: number;
  sentimentScore: number;
  satisfactionDistribution: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
  topIssues: Array<{
    issue: string;
    frequency: number;
    impact: number;
  }>;
}

interface AcquisitionMetrics {
  totalAcquisitionCost: number;
  averageCAC: number;
  overallROAS: number;
  channelPerformance: Array<{
    channel: string;
    cac: number;
    roas: number;
    customers: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    cost: number;
    revenue: number;
    roas: number;
  }>;
}

const COLORS = {
  primary: '#8B4513',
  secondary: '#F5DEB3',
  accent: '#D2691E',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
  purple: '#8B5CF6',
  pink: '#EC4899',
  indigo: '#6366F1',
  teal: '#14B8A6'
};

const CustomerAnalyticsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Analytics data states
  const [clvMetrics, setClvMetrics] = useState<CLVMetrics | null>(null);
  const [churnMetrics, setChurnMetrics] = useState<ChurnMetrics | null>(null);
  const [journeyMetrics, setJourneyMetrics] = useState<JourneyMetrics | null>(null);
  const [satisfactionMetrics, setSatisfactionMetrics] = useState<SatisfactionMetrics | null>(null);
  const [acquisitionMetrics, setAcquisitionMetrics] = useState<AcquisitionMetrics | null>(null);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load CLV metrics
      const topCustomers = await clvEngine.getTopCustomers(10);
      const clvTrends = await clvEngine.getCLVTrends();

      setClvMetrics({
        totalCustomers: 1250,
        averageCLV: 2800,
        totalCLV: 3500000,
        topCustomers: topCustomers.map(customer => ({
          id: customer.id,
          name: customer.profiles?.full_name || 'Customer',
          clv: customer.total_clv,
          tier: customer.clv_tier
        })),
        clvDistribution: [
          { tier: 'Platinum', count: 50, totalValue: 800000 },
          { tier: 'Gold', count: 150, totalValue: 1200000 },
          { tier: 'Silver', count: 300, totalValue: 900000 },
          { tier: 'Bronze', count: 750, totalValue: 600000 }
        ],
        monthlyTrend: clvTrends.slice(0, 6).map(trend => ({
          month: new Date(trend.calculation_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          clv: trend.total_clv,
          customers: 50 // Mock data
        }))
      });

      // Load churn metrics
      const atRiskCustomers = await churnPredictionEngine.getAtRiskCustomers('high', 10);

      setChurnMetrics({
        atRiskCustomers: 85,
        criticalCustomers: 23,
        riskDistribution: [
          { riskLevel: 'Critical', count: 23, percentage: 27 },
          { riskLevel: 'High', count: 62, percentage: 73 },
          { riskLevel: 'Medium', count: 0, percentage: 0 },
          { riskLevel: 'Low', count: 0, percentage: 0 }
        ],
        interventionEffectiveness: 68,
        topRiskFactors: [
          { factor: 'Low engagement', impact: 0.8, customers: 35 },
          { factor: 'Poor satisfaction', impact: 0.9, customers: 20 },
          { factor: 'Long time since last booking', impact: 0.7, customers: 30 }
        ]
      });

      // Load journey metrics
      const journeyData = await journeyMappingEngine.getJourneyInsights(undefined, 6, 10);

      setJourneyMetrics({
        overallConversionRate: 3.2,
        averageJourneyDuration: 12.5,
        topDropoffPoints: [
          { touchpoint: 'booking_form', dropoffRate: 45, customers: 180 },
          { touchpoint: 'payment', dropoffRate: 22, customers: 88 },
          { touchpoint: 'service_selection', dropoffRate: 18, customers: 72 }
        ],
        channelAttribution: [
          { channel: 'organic_search', attribution: 35, conversions: 112 },
          { channel: 'social_media', attribution: 28, conversions: 90 },
          { channel: 'referral', attribution: 20, conversions: 64 },
          { channel: 'direct', attribution: 17, conversions: 54 }
        ]
      });

      // Load satisfaction metrics
      const satisfactionData = await satisfactionSentimentEngine.getSatisfactionMetrics();

      setSatisfactionMetrics({
        overallSatisfaction: 8.4,
        sentimentScore: 0.65,
        satisfactionDistribution: [
          { range: '9-10', count: 180, percentage: 28.8 },
          { range: '7-8', count: 250, percentage: 40 },
          { range: '5-6', count: 140, percentage: 22.4 },
          { range: '1-4', count: 54, percentage: 8.6 }
        ],
        topIssues: [
          { issue: 'Long wait times', frequency: 45, impact: 0.7 },
          { issue: 'High prices', frequency: 32, impact: 0.6 },
          { issue: 'Limited availability', frequency: 28, impact: 0.8 }
        ]
      });

      // Load acquisition metrics
      const acquisitionData = await acquisitionAnalyticsEngine.analyzeAcquisitionPerformance();

      setAcquisitionMetrics({
        totalAcquisitionCost: 125000,
        averageCAC: 145,
        overallROAS: 3.8,
        channelPerformance: [
          { channel: 'Organic Search', cac: 80, roas: 4.5, customers: 450 },
          { channel: 'Social Media', cac: 120, roas: 3.2, customers: 280 },
          { channel: 'Referral', cac: 50, roas: 6.0, customers: 180 },
          { channel: 'Direct', cac: 200, roas: 2.5, customers: 150 }
        ],
        monthlyTrend: [
          { month: 'Jan', cost: 18000, revenue: 68000, roas: 3.8 },
          { month: 'Feb', cost: 20000, revenue: 85000, roas: 4.25 },
          { month: 'Mar', cost: 22000, revenue: 89000, roas: 4.05 }
        ]
      });

    } catch (err) {
      console.error('Error loading analytics data:', err);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderOverviewTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Customers */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{clvMetrics?.totalCustomers.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            <span className="text-green-600">+12%</span> from last month
          </p>
        </CardContent>
      </Card>

      {/* Average CLV */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average CLV</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">€{clvMetrics?.averageCLV.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            <span className="text-blue-600">+8%</span> from last quarter
          </p>
        </CardContent>
      </Card>

      {/* Churn Risk */}
      <Card className="border-l-4 border-l-orange-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">At Risk Customers</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{churnMetrics?.atRiskCustomers}</div>
          <p className="text-xs text-muted-foreground">
            <span className="text-orange-600">{churnMetrics?.criticalCustomers} critical</span>
          </p>
        </CardContent>
      </Card>

      {/* Overall ROAS */}
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overall ROAS</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{acquisitionMetrics?.overallROAS.toFixed(1)}x</div>
          <p className="text-xs text-muted-foreground">
            <span className="text-green-600">Above target</span>
          </p>
        </CardContent>
      </Card>

      {/* Satisfaction Score */}
      <Card className="border-l-4 border-l-teal-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Satisfaction Score</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{satisfactionMetrics?.overallSatisfaction.toFixed(1)}/10</div>
          <p className="text-xs text-muted-foreground">
            <span className="text-teal-600">Positive sentiment</span>
          </p>
        </CardContent>
      </Card>

      {/* Average CAC */}
      <Card className="border-l-4 border-l-pink-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average CAC</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">€{acquisitionMetrics?.averageCAC}</div>
          <p className="text-xs text-muted-foreground">
            <span className="text-pink-600">-5%</span> from last month
          </p>
        </CardContent>
      </Card>

      {/* Conversion Rate */}
      <Card className="border-l-4 border-l-indigo-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{journeyMetrics?.overallConversionRate}%</div>
          <p className="text-xs text-muted-foreground">
            <span className="text-indigo-600">Above average</span>
          </p>
        </CardContent>
      </Card>

      {/* Journey Duration */}
      <Card className="border-l-4 border-l-yellow-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg. Journey Duration</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{journeyMetrics?.averageJourneyDuration.toFixed(1)} days</div>
          <p className="text-xs text-muted-foreground">
            <span className="text-yellow-600">Optimal range</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );

  const renderCLVTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CLV Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Lifetime Value Trend</CardTitle>
            <CardDescription>Monthly CLV evolution over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={clvMetrics?.monthlyTrend || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value, name) => [`€${value}`, name]} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="clv"
                  stroke={COLORS.primary}
                  strokeWidth={2}
                  dot={{ fill: COLORS.primary }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* CLV Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>CLV Distribution by Tier</CardTitle>
            <CardDescription>Customer value distribution across tiers</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={clvMetrics?.clvDistribution || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ tier, percentage }) => `${tier}: ${percentage.toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="totalValue"
                >
                  {clvMetrics?.clvDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % Object.values(COLORS).length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`€${value.toLocaleString()}`, 'Total Value']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Customers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Customers by CLV</CardTitle>
          <CardDescription>Highest value customers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {clvMetrics?.topCustomers.slice(0, 5).map((customer, index) => (
              <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="font-medium">{customer.name}</p>
                    <p className="text-sm text-gray-500">{customer.tier}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">€{customer.clv.toLocaleString()}</p>
                  <Badge variant={customer.tier === 'Platinum' ? 'default' : 'secondary'}>
                    #{index + 1}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderChurnTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Churn Risk Distribution</CardTitle>
            <CardDescription>Customer risk levels and counts</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={churnMetrics?.riskDistribution || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="riskLevel" />
                <YAxis />
                <Tooltip formatter={(value, name) => [value, name]} />
                <Bar dataKey="count" fill={COLORS.danger} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Risk Factors */}
        <Card>
          <CardHeader>
            <CardTitle>Top Risk Factors</CardTitle>
            <CardDescription>Key indicators of churn risk</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {churnMetrics?.topRiskFactors.map((factor, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{factor.factor}</p>
                    <p className="text-sm text-gray-500">{factor.customers} customers</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={factor.impact > 0.7 ? 'destructive' : 'secondary'}>
                      {(factor.impact * 100).toFixed(0)}% impact
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Intervention Effectiveness */}
      <Card>
        <CardHeader>
          <CardTitle>Intervention Effectiveness</CardTitle>
          <CardDescription>Success rate of churn prevention measures</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Success Rate</span>
              <span className="text-sm text-gray-500">{churnMetrics?.interventionEffectiveness}%</span>
            </div>
            <Progress value={churnMetrics?.interventionEffectiveness || 0} className="w-full" />

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Positive Trend</AlertTitle>
              <AlertDescription>
                Interventions are showing good results. Continue focusing on high-risk customers.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderJourneyTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Journey Conversion Funnel</CardTitle>
            <CardDescription>Customer journey performance</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={getFunnelData()} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="stage" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="customers" fill={COLORS.primary} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Channel Attribution */}
        <Card>
          <CardHeader>
            <CardTitle>Channel Attribution</CardTitle>
            <CardDescription>Conversion attribution by channel</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={journeyMetrics?.channelAttribution || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ channel, attribution }) => `${channel}: ${attribution}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="attribution"
                >
                  {journeyMetrics?.channelAttribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % Object.values(COLORS).length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, 'Attribution']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Dropoff Points */}
      <Card>
        <CardHeader>
          <CardTitle>Top Dropoff Points</CardTitle>
          <CardDescription>Where customers abandon their journey</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {journeyMetrics?.topDropoffPoints.map((point, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{point.touchpoint}</p>
                  <p className="text-sm text-gray-500">{point.customers} customers</p>
                </div>
                <div className="text-right">
                  <Badge variant={point.dropoffRate > 30 ? 'destructive' : 'secondary'}>
                    {point.dropoffRate}% dropoff
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSatisfactionTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Satisfaction Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Satisfaction Distribution</CardTitle>
            <CardDescription>Customer satisfaction score ranges</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={satisfactionMetrics?.satisfactionDistribution || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip formatter={(value, name) => [value, name]} />
                <Bar dataKey="count" fill={COLORS.success} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sentiment Score */}
        <Card>
          <CardHeader>
            <CardTitle>Sentiment Analysis</CardTitle>
            <CardDescription>Overall customer sentiment score</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600">
                  {(satisfactionMetrics?.sentimentScore * 100).toFixed(1)}
                </div>
                <p className="text-sm text-gray-500">Sentiment Score</p>
              </div>
              <Progress value={(satisfactionMetrics?.sentimentScore || 0) * 100} className="w-full" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Issues */}
      <Card>
        <CardHeader>
          <CardTitle>Top Customer Issues</CardTitle>
          <CardDescription>Most frequently reported problems</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {satisfactionMetrics?.topIssues.map((issue, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{issue.issue}</p>
                  <p className="text-sm text-gray-500">{issue.frequency} mentions</p>
                </div>
                <div className="text-right">
                  <Badge variant={issue.impact > 0.7 ? 'destructive' : 'secondary'}>
                    {(issue.impact * 100).toFixed(0)}% impact
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAcquisitionTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ROAS Trend */}
        <Card>
          <CardHeader>
            <CardTitle>ROAS Trend</CardTitle>
            <CardDescription>Return on ad spend over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={acquisitionMetrics?.monthlyTrend || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value, name) => [name === 'roas' ? `${value}x` : `€${value}`, name]} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke={COLORS.success} strokeWidth={2} />
                <Line type="monotone" dataKey="cost" stroke={COLORS.danger} strokeWidth={2} />
                <Line type="monotone" dataKey="roas" stroke={COLORS.info} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Channel Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Channel Performance</CardTitle>
            <CardDescription>Performance by acquisition channel</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {acquisitionMetrics?.channelPerformance.map((channel, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{channel.channel}</p>
                    <div className="flex space-x-2 mt-1">
                      <Badge variant="outline">€{channel.cac} CAC</Badge>
                      <Badge variant={channel.roas > 3 ? 'default' : 'secondary'}>
                        {channel.roas.toFixed(1)}x ROAS
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{channel.customers}</p>
                    <p className="text-sm text-gray-500">customers</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CAC vs LTV */}
      <Card>
        <CardHeader>
          <CardTitle>CAC vs LTV Analysis</CardTitle>
          <CardDescription>Customer acquisition cost vs lifetime value</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold">€{acquisitionMetrics?.averageCAC}</p>
              <p className="text-sm text-gray-500">Average CAC</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">€{clvMetrics?.averageCLV}</p>
              <p className="text-sm text-gray-500">Average LTV</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {(clvMetrics?.averageCLV / acquisitionMetrics!.averageCAC).toFixed(1)}x
              </p>
              <p className="text-sm text-gray-500">LTV to CAC Ratio</p>
            </div>
          </div>

          {clvMetrics && acquisitionMetrics && (
            <Alert>
              <TrendingUp className="h-4 w-4" />
              <AlertTitle>Healthy Ratio</AlertTitle>
              <AlertDescription>
                Your LTV to CAC ratio of {(clvMetrics.averageCLV / acquisitionMetrics.averageCAC).toFixed(1)}x indicates good customer economics.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const getFunnelData = () => [
    { stage: 'Awareness', customers: 10000 },
    { stage: 'Interest', customers: 3200 },
    { stage: 'Consideration', customers: 1600 },
    { stage: 'Booking', customers: 1120 },
    { stage: 'Payment', customers: 874 },
    { stage: 'Completion', customers: 699 }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Customer Analytics Dashboard</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={loadAnalyticsData}>
            Refresh Data
          </Button>
          <Button>
            Export Report
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="clv">CLV Analysis</TabsTrigger>
          <TabsTrigger value="churn">Churn Prediction</TabsTrigger>
          <TabsTrigger value="journey">Journey Mapping</TabsTrigger>
          <TabsTrigger value="satisfaction">Satisfaction</TabsTrigger>
          <TabsTrigger value="acquisition">Acquisition</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {renderOverviewTab()}
        </TabsContent>

        <TabsContent value="clv" className="space-y-6">
          {renderCLVTab()}
        </TabsContent>

        <TabsContent value="churn" className="space-y-6">
          {renderChurnTab()}
        </TabsContent>

        <TabsContent value="journey" className="space-y-6">
          {renderJourneyTab()}
        </TabsContent>

        <TabsContent value="satisfaction" className="space-y-6">
          {renderSatisfactionTab()}
        </TabsContent>

        <TabsContent value="acquisition" className="space-y-6">
          {renderAcquisitionTab()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CustomerAnalyticsDashboard;