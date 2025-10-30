import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, Users, Clock, DollarSign, Target, AlertTriangle, CheckCircle, Activity, BarChart3, PieChart, Zap } from 'lucide-react';
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Pie, PieChart as RePieChart, Cell } from 'recharts';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast aria-live="polite" aria-atomic="true"';
import { useConversionOptimization } from '@/lib/conversion-optimization';
import { conversionTester, useConversionTesting } from '@/lib/conversion-optimization-testing';

interface ConversionMetrics {
  totalSessions: number;
  stepConversions: Record<string, number>;
  funnelCompletionRate: number;
  averageBookingTime: number;
  revenuePerSession: number;
  testMetrics: Record<string, any>;
}

export const ConversionOptimizationDashboard = () => {
  const { toast aria-live="polite" aria-atomic="true" } = useToast();
  const { getMetrics } = useConversionOptimization();
  const { validateFeatures, runTests, generateReport } = useConversionTesting();

  const [metrics, setMetrics] = useState<ConversionMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [report, setReport] = useState<string>('');
  const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, 90d

  // Load metrics on component mount
  useEffect(() => {
    loadMetrics();
  }, [timeRange]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const endDate = new Date();
      const startDate = new Date();

      switch (timeRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
      }

      const conversionMetrics = await getMetrics(startDate, endDate);
      setMetrics(conversionMetrics);
    } catch (error) {
      console.error('Failed to load conversion metrics:', error);
      toast aria-live="polite" aria-atomic="true"({
        title: 'Error Loading Metrics',
        description: 'Unable to load conversion optimization metrics.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Mock chart data based on metrics
  const chartData = useMemo(() => {
    if (!metrics) return [];

    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      // Generate realistic trending data
      const baseConversions = 50;
      const trend = (days - i) * 0.5; // Upward trend
      const randomVariation = Math.random() * 20 - 10;
      const conversions = Math.max(20, baseConversions + trend + randomVariation);

      const baseRevenue = 2500;
      const revenueTrend = (days - i) * 25;
      const revenueVariation = Math.random() * 500 - 250;
      const revenue = Math.max(1000, baseRevenue + revenueTrend + revenueVariation);

      data.push({
        date: date.toLocaleDateString(),
        conversions: Math.floor(conversions),
        revenue: Math.floor(revenue),
        sessions: Math.floor(conversions * 3.5),
        completionRate: 15 + (days - i) * 0.2 + (Math.random() * 5 - 2.5),
      });
    }

    return data;
  }, [metrics, timeRange]);

  // Funnel data for visualization
  const funnelData = useMemo(() => {
    if (!metrics) return [];

    const funnelSteps = [
      { name: 'Started', value: metrics.totalSessions, color: '#3B82F6' },
      { name: 'Service Selected', value: metrics.stepConversions['service_selected'] || 0, color: '#10B981' },
      { name: 'Time Selected', value: metrics.stepConversions['time_slot_selected'] || 0, color: '#F59E0B' },
      { name: 'Details Entered', value: metrics.stepConversions['details_entered'] || 0, color: '#8B5CF6' },
      { name: 'Booking Completed', value: metrics.stepConversions['booking_completed'] || 0, color: '#EF4444' },
    ];

    return funnelSteps;
  }, [metrics]);

  // Test results data
  const testResultsData = useMemo(() => {
    if (!metrics) return [];

    return Object.entries(metrics.testMetrics).map(([testId, testMetric]) => {
      const variations = Object.values(testMetric);
      return {
        testId,
        variations: variations.map((variation: any, index) => ({
          name: variation.variationId || `Variation ${index + 1}`,
          conversions: variation.conversions || 0,
          conversionRate: variation.conversionRate || 0,
          revenue: variation.revenue || 0,
          sampleSize: variation.sampleSize || 0,
        })),
      };
    });
  }, [metrics]);

  const handleRunTests = async () => {
    try {
      const results = await runTests();
      setTestResults(results);

      const successfulTests = results.filter(test => test.testStatus === 'completed');
      const averageImprovement = successfulTests.reduce((sum, test) => sum + (test.actualImprovement || 0), 0) / successfulTests.length;

      if (averageImprovement >= 25) {
        toast aria-live="polite" aria-atomic="true"({
          title: 'Tests Successful!',
          description: `Average improvement: ${averageImprovement.toFixed(1)}%`,
        });
      } else {
        toast aria-live="polite" aria-atomic="true"({
          title: 'Tests Completed',
          description: `Average improvement: ${averageImprovement.toFixed(1)}%. Target not met.`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast aria-live="polite" aria-atomic="true"({
        title: 'Test Failed',
        description: 'Unable to run conversion tests.',
        variant: 'destructive',
      });
    }
  };

  const handleGenerateReport = async () => {
    try {
      const report = await generateReport();
      setReport(report);

      // Download report
      const blob = new Blob([report], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conversion-optimization-report-${new Date().toISOString().split('T')[0]}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast aria-live="polite" aria-atomic="true"({
        title: 'Report Generated',
        description: 'Conversion optimization report downloaded successfully.',
      });
    } catch (error) {
      toast aria-live="polite" aria-atomic="true"({
        title: 'Report Generation Failed',
        description: 'Unable to generate conversion optimization report.',
        variant: 'destructive',
      });
    }
  };

  const handleValidateFeatures = async () => {
    try {
      const isValid = await validateFeatures();

      if (isValid) {
        toast aria-live="polite" aria-atomic="true"({
          title: 'Features Validated',
          description: 'All optimization features are working correctly.',
        });
      } else {
        toast aria-live="polite" aria-atomic="true"({
          title: 'Validation Failed',
          description: 'Some optimization features need attention.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast aria-live="polite" aria-atomic="true"({
        title: 'Validation Failed',
        description: 'Unable to validate optimization features.',
        variant: 'destructive',
      });
    }
  };

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-champagne-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Conversion Optimization</h1>
          <p className="text-gray-600">Monitor and optimize booking conversion rates</p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleValidateFeatures}
            className="gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Validate Features
          </Button>

          <Button
            variant="outline"
            onClick={handleRunTests}
            className="gap-2"
          >
            <Activity className="w-4 h-4" />
            Run Tests
          </Button>

          <Button
            onClick={handleGenerateReport}
            className="gap-2 bg-gradient-to-r from-champagne to-bronze text-white"
          >
            <BarChart3 className="w-4 h-4" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-lg w-fit">
        {['7d', '30d', '90d'].map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-colors",
              timeRange === range
                ? "bg-white text-champagne-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
          </button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalSessions.toLocaleString()}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.funnelCompletionRate.toFixed(1)}%</p>
            </div>
            <Target className="w-8 h-8 text-green-500" />
          </div>
          {metrics.funnelCompletionRate >= 25 && (
            <Badge className="mt-2 bg-green-100 text-green-700">Target Met</Badge>
          )}
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Booking Time</p>
              <p className="text-2xl font-bold text-gray-900">{Math.floor(metrics.averageBookingTime / 60)}m</p>
            </div>
            <Clock className="w-8 h-8 text-orange-500" />
          </div>
          {metrics.averageBookingTime < 300 && (
            <Badge className="mt-2 bg-green-100 text-green-700">Optimal</Badge>
          )}
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Revenue/Session</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.revenuePerSession.toFixed(0)} PLN</p>
            </div>
            <DollarSign className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Trend */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="conversions"
                stroke="#3B82F6"
                strokeWidth={2}
                name="Conversions"
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#10B981"
                strokeWidth={2}
                name="Revenue (PLN)"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Funnel Visualization */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion Funnel</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={funnelData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" />
              <Tooltip />
              <Bar dataKey="value" name="Users">
                {funnelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* A/B Test Results */}
      {testResultsData.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">A/B Test Results</h3>
          <div className="space-y-4">
            {testResultsData.map((test) => (
              <div key={test.testId} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">{test.testId}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {test.variations.map((variation: any) => (
                    <div key={variation.name} className="bg-gray-50 rounded p-3">
                      <div className="font-medium text-gray-900">{variation.name}</div>
                      <div className="text-sm text-gray-600 space-y-1 mt-2">
                        <div>Conversions: {variation.conversions}</div>
                        <div>Conversion Rate: {variation.conversionRate.toFixed(1)}%</div>
                        <div>Revenue: {variation.revenue} PLN</div>
                        <div>Sample Size: {variation.sampleSize}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Test Results */}
      {testResults.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Test Results</h3>
          <div className="space-y-3">
            {testResults.map((test, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{test.testName}</div>
                  <div className="text-sm text-gray-600">
                    Expected: {test.expectedImprovement}% |
                    Actual: {test.actualImprovement || 0}%
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className={cn(
                      test.testStatus === 'completed'
                        ? "bg-green-100 text-green-700"
                        : test.testStatus === 'failed'
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    )}
                  >
                    {test.testStatus.toUpperCase()}
                  </Badge>
                  {test.testStatus === 'completed' && test.actualImprovement && test.actualImprovement >= test.expectedImprovement && (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Performance Metrics */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Zap className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-700">
              {metrics.averageBookingTime < 180 ? 'Excellent' :
               metrics.averageBookingTime < 300 ? 'Good' : 'Needs Improvement'}
            </div>
            <div className="text-sm text-blue-600">Booking Speed</div>
          </div>

          <div className="text-center p-4 bg-green-50 rounded-lg">
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-700">
              {metrics.funnelCompletionRate >= 25 ? 'Target Met' : 'In Progress'}
            </div>
            <div className="text-sm text-green-600">Conversion Goal</div>
          </div>

          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <DollarSign className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-700">
              {metrics.revenuePerSession > 100 ? 'High Value' :
               metrics.revenuePerSession > 50 ? 'Medium Value' : 'Low Value'}
            </div>
            <div className="text-sm text-purple-600">Revenue per Session</div>
          </div>
        </div>
      </Card>
    </div>
  );
};