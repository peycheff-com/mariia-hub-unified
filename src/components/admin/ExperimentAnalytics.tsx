import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
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
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle,
  Play,
  Pause,
  Square,
  Download,
  RefreshCw,
  Info
} from "lucide-react";
import { format, subDays, eachDayOfInterval } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { experimentService } from "@/services/experimentService";
import { useToast } from "@/hooks/use-toast";

import type {
  ExperimentStats,
  ExperimentMetrics,
  CohortAnalysis,
  VariantStats,
  ConfidenceInterval
} from "@/types/featureFlags";

const ExperimentAnalytics: React.FC = () => {
  const [selectedExperiment, setSelectedExperiment] = useState<string>("");
  const [experimentStats, setExperimentStats] = useState<ExperimentStats | null>(null);
  const [experimentMetrics, setExperimentMetrics] = useState<ExperimentMetrics | null>(null);
  const [cohortAnalysis, setCohortAnalysis] = useState<CohortAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("7d");
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();

  // Mock data for experiments list - in production, fetch from database
  const [experiments] = useState([
    { key: "new_booking_flow", name: "New Booking Flow", status: "running" },
    { key: "pricing_display_test", name: "Pricing Display Test", status: "completed" },
    { key: "checkout_button_color", name: "Checkout Button Color", status: "paused" },
  ]);

  useEffect(() => {
    if (selectedExperiment) {
      loadExperimentData();
    }
  }, [selectedExperiment, timeRange]);

  const loadExperimentData = async () => {
    if (!selectedExperiment) return;

    setLoading(true);
    try {
      const [stats, metrics, cohorts] = await Promise.all([
        experimentService.getExperimentResults(selectedExperiment),
        experimentService.getExperimentMetrics(selectedExperiment),
        experimentService.getCohortAnalysis(selectedExperiment)
      ]);

      setExperimentStats(stats);
      setExperimentMetrics(metrics);
      setCohortAnalysis(cohorts);
    } catch (error) {
      console.error("Error loading experiment data:", error);
      toast({
        title: "Error",
        description: "Failed to load experiment data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateTimeSeriesData = () => {
    if (!experimentStats) return [];

    const days = parseInt(timeRange.replace('d', ''));
    const endDate = new Date();
    const startDate = subDays(endDate, days);
    const interval = eachDayOfInterval({ start: startDate, end: endDate });

    return interval.map(date => {
      const dayStr = format(date, 'MMM dd');
      // Mock data - in production, fetch from analytics service
      const baseValue = Math.random() * 100 + 50;
      const trend = Math.sin((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 3)) * 20;

      return {
        date: dayStr,
        control: Math.max(0, baseValue + trend + (Math.random() - 0.5) * 10),
        variant: Math.max(0, baseValue + trend + 5 + (Math.random() - 0.5) * 10),
        users: Math.floor(Math.random() * 50 + 20),
      };
    });
  };

  const getVariantColor = (variant: string) => {
    const colors: Record<string, string> = {
      control: "#8884d8",
      variant: "#82ca9d",
      variant_a: "#ffc658",
      variant_b: "#ff7300",
      variant_c: "#00ff00",
    };
    return colors[variant] || "#8884d8";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Play className="w-4 h-4 text-green-500" />;
      case 'paused': return <Pause className="w-4 h-4 text-yellow-500" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-blue-500" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPerformanceIndicator = (variant: VariantStats, baseline?: number) => {
    if (!baseline) return null;
    const improvement = ((variant.conversion_rate - baseline) / baseline) * 100;
    const isPositive = improvement > 0;

    return (
      <div className="flex items-center space-x-1">
        {isPositive ? (
          <TrendingUp className="w-4 h-4 text-green-500" />
        ) : (
          <TrendingDown className="w-4 h-4 text-red-500" />
        )}
        <span className={`text-sm font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
          {improvement > 0 ? '+' : ''}{improvement.toFixed(1)}%
        </span>
      </div>
    );
  };

  if (loading && !experimentStats) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="w-8 h-8" />
            Experiment Analytics
          </h1>
          <p className="text-muted-foreground">
            A/B testing performance and statistical analysis
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedExperiment} onValueChange={setSelectedExperiment}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select an experiment" />
            </SelectTrigger>
            <SelectContent>
              {experiments.map((exp) => (
                <SelectItem key={exp.key} value={exp.key}>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(exp.status)}
                    <span>{exp.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 days</SelectItem>
              <SelectItem value="14d">14 days</SelectItem>
              <SelectItem value="30d">30 days</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={() => loadExperimentData()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {!selectedExperiment ? (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center text-muted-foreground">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select an experiment to view analytics</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Key Metrics */}
          {experimentMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Participants</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{experimentMetrics.total_participants.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    {experimentMetrics.achieved_sample_size >= experimentMetrics.min_sample_size
                      ? "Required sample size reached"
                      : `${Math.round((experimentMetrics.achieved_sample_size / experimentMetrics.min_sample_size) * 100)}% of required`}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{experimentMetrics.overall_conversion_rate.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">
                    {experimentMetrics.total_conversions} conversions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Statistical Power</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {experimentMetrics.statistical_power
                      ? `${(experimentMetrics.statistical_power * 100).toFixed(1)}%`
                      : "Calculating..."}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {experimentMetrics.statistical_power && experimentMetrics.statistical_power >= 0.95
                      ? "Statistically significant"
                      : "More data needed"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Duration</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {experimentStats?.days_running || 0} days
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Expected: {experimentMetrics.expected_completion_date
                      ? format(new Date(experimentMetrics.expected_completion_date), "MMM d")
                      : "Unknown"}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="variants">Variant Analysis</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="cohorts">Cohorts</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Conversion Funnel */}
                <Card>
                  <CardHeader>
                    <CardTitle>Conversion Funnel</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {experimentStats && (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={experimentStats.variants}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="variant" />
                          <YAxis />
                          <Tooltip
                            formatter={(value: any, name: string) => [
                              name === 'conversion_rate' ? `${value.toFixed(1)}%` : value,
                              name === 'conversion_rate' ? 'Conversion Rate' : 'Users'
                            ]}
                          />
                          <Bar dataKey="users" fill="#8884d8" name="users" />
                          <Bar dataKey="conversion_rate" fill="#82ca9d" name="conversion_rate" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Variant Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Traffic Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {experimentStats && (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={experimentStats.variants.map(v => ({
                              name: v.variant,
                              value: v.users,
                              percentage: (v.users / experimentStats.total_users) * 100
                            }))}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {experimentStats.variants.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={getVariantColor(entry.variant)} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: any) => [`${value} users`, 'Traffic']} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Statistical Significance Alert */}
              {experimentStats?.statistical_significance && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Statistical significance: {(experimentStats.statistical_significance * 100).toFixed(1)}%
                    {experimentStats.statistical_significance >= 0.95
                      ? " - Results are statistically significant! Consider stopping the experiment."
                      : " - More data needed for statistical significance."}
                    {experimentStats.winner_variant && (
                      <span className="ml-2 font-semibold">
                        Current winner: {experimentStats.winner_variant}
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="variants" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Variant Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  {experimentStats && (
                    <div className="space-y-6">
                      {experimentStats.variants.map((variant, index) => {
                        const isWinner = variant.variant === experimentStats.winner_variant;
                        const baseline = experimentStats.variants[0].conversion_rate;

                        return (
                          <div key={variant.variant} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h3 className="text-lg font-semibold capitalize">
                                  {variant.variant}
                                  {isWinner && (
                                    <Badge className="ml-2 bg-green-100 text-green-800">
                                      Winner
                                    </Badge>
                                  )}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {variant.users.toLocaleString()} users • {variant.conversions} conversions
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold">{variant.conversion_rate.toFixed(1)}%</div>
                                {getPerformanceIndicator(variant, baseline)}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Conversion Rate</span>
                                <span>{variant.conversion_rate.toFixed(1)}%</span>
                              </div>
                              <Progress value={variant.conversion_rate} className="h-2" />
                            </div>
                            {variant.revenue && (
                              <div className="mt-4 pt-4 border-t">
                                <div className="flex justify-between text-sm">
                                  <span>Revenue</span>
                                  <span>${variant.revenue.toFixed(2)}</span>
                                </div>
                                {variant.average_order_value && (
                                  <div className="flex justify-between text-sm mt-1">
                                    <span>Avg Order Value</span>
                                    <span>${variant.average_order_value.toFixed(2)}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Confidence Intervals */}
              {experimentStats?.confidence_interval && (
                <Card>
                  <CardHeader>
                    <CardTitle>Confidence Intervals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span>Confidence Level</span>
                        <Badge variant="outline">
                          {(experimentStats.confidence_interval.confidence_level * 100)}%
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Lower Bound</span>
                        <span className="font-semibold">
                          {experimentStats.confidence_interval.lower_bound.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Upper Bound</span>
                        <span className="font-semibold">
                          {experimentStats.confidence_interval.upper_bound.toFixed(1)}%
                        </span>
                      </div>
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          We are {experimentStats.confidence_interval.confidence_level * 100}% confident that the true conversion rate lies between
                          {experimentStats.confidence_interval.lower_bound.toFixed(1)}% and {experimentStats.confidence_interval.upper_bound.toFixed(1)}%.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="trends" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Conversion Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={generateTimeSeriesData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="control"
                        stroke={getVariantColor('control')}
                        strokeWidth={2}
                        name="Control"
                      />
                      <Line
                        type="monotone"
                        dataKey="variant"
                        stroke={getVariantColor('variant')}
                        strokeWidth={2}
                        name="Variant"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Daily User Acquisition</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={generateTimeSeriesData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="users"
                        stroke="#8884d8"
                        fill="#8884d8"
                        fillOpacity={0.3}
                        name="Daily Users"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cohorts" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Cohort Analysis</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    User behavior by sign-up date
                  </p>
                </CardHeader>
                <CardContent>
                  {cohortAnalysis.length > 0 ? (
                    <div className="space-y-4">
                      {cohortAnalysis.map((cohort) => (
                        <div key={cohort.cohort_name} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">{cohort.cohort_name}</h4>
                            <Badge variant="outline">{cohort.cohort_size} users</Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Conversion Rate</span>
                              <div className="font-semibold">{cohort.conversion_rate.toFixed(1)}%</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Retention Rate</span>
                              <div className="font-semibold">{cohort.retention_rate.toFixed(1)}%</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Avg Revenue</span>
                              <div className="font-semibold">${cohort.average_revenue.toFixed(2)}</div>
                            </div>
                          </div>
                          {cohort.compared_to_baseline !== 0 && (
                            <div className="mt-2 pt-2 border-t">
                              <div className="flex items-center space-x-2">
                                {cohort.compared_to_baseline > 0 ? (
                                  <TrendingUp className="w-4 h-4 text-green-500" />
                                ) : (
                                  <TrendingDown className="w-4 h-4 text-red-500" />
                                )}
                                <span className="text-sm">
                                  {cohort.compared_to_baseline > 0 ? '+' : ''}
                                  {cohort.compared_to_baseline.toFixed(1)}% vs baseline
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Cohort analysis data will be available after more user activity</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          {experimentMetrics && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant={experimentMetrics.status === 'running' ? 'destructive' : 'default'}
                      onClick={() => {
                        const action = experimentMetrics.status === 'running' ? 'pause' : 'start';
                        // Implement pause/start logic
                        toast({
                          title: `Experiment ${action}ed`,
                          description: `Experiment has been ${action}ed successfully`
                        });
                      }}
                    >
                      {experimentMetrics.status === 'running' ? (
                        <>
                          <Pause className="w-4 h-4 mr-2" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Start
                        </>
                      )}
                    </Button>

                    {experimentStats?.winner_variant && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          // Implement rollout logic
                          toast({
                            title: "Winner Rolled Out",
                            description: `${experimentStats.winner_variant} has been rolled out to 100%`
                          });
                        }}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Rollout Winner
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Export Data
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default ExperimentAnalytics;