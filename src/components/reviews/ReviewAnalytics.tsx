import React, { useState, useEffect } from 'react';
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
  Area,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Star,
  MessageSquare,
  Users,
  Shield,
  AlertTriangle,
  Calendar,
  Filter,
  Download,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  Camera,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { ReviewAnalytics, ReviewStatistics } from '@/types/review';


interface ReviewAnalyticsProps {
  serviceId?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  className?: string;
}

export const ReviewAnalytics: React.FC<ReviewAnalyticsProps> = ({
  serviceId,
  dateRange,
  className = ''
}) => {
  const [analytics, setAnalytics] = useState<ReviewAnalytics[]>([]);
  const [statistics, setStatistics] = useState<ReviewStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [selectedMetric, setSelectedMetric] = useState('rating');

  useEffect(() => {
    loadAnalytics();
  }, [serviceId, dateRange, selectedPeriod]);

  const loadAnalytics = async () => {
    setLoading(true);

    try {
      // Load analytics data
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('review_analytics')
        .select('*')
        .gte('date', getDateRangeStart(selectedPeriod))
        .lte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (analyticsError) throw analyticsError;

      // Load current statistics
      const { data: statsData, error: statsError } = await supabase
        .from('review_statistics')
        .select('*')
        .single();

      if (statsError && statsError.code !== 'PGRST116') throw statsError;

      setAnalytics(analyticsData || []);
      setStatistics(statsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDateRangeStart = (period: string): string => {
    const now = new Date();
    const start = new Date();

    switch (period) {
      case '7':
        start.setDate(now.getDate() - 7);
        break;
      case '30':
        start.setDate(now.getDate() - 30);
        break;
      case '90':
        start.setDate(now.getDate() - 90);
        break;
      case '365':
        start.setFullYear(now.getFullYear() - 1);
        break;
      default:
        start.setDate(now.getDate() - 30);
    }

    return start.toISOString().split('T')[0];
  };

  const getRatingTrend = () => {
    if (analytics.length < 2) return null;

    const recent = analytics.slice(-7);
    const previous = analytics.slice(-14, -7);

    const recentAvg = recent.reduce((sum, a) => sum + a.average_rating, 0) / recent.length;
    const previousAvg = previous.length > 0
      ? previous.reduce((sum, a) => sum + a.average_rating, 0) / previous.length
      : recentAvg;

    return {
      trend: recentAvg > previousAvg ? 'up' : 'down',
      change: Math.abs(recentAvg - previousAvg).toFixed(2)
    };
  };

  const getSentimentData = () => {
    if (!statistics) return [];

    return [
      { name: 'Positive', value: statistics.rating_distribution[5] + statistics.rating_distribution[4], color: '#22c55e' },
      { name: 'Neutral', value: statistics.rating_distribution[3], color: '#eab308' },
      { name: 'Negative', value: statistics.rating_distribution[2] + statistics.rating_distribution[1], color: '#ef4444' }
    ];
  };

  const getRatingDistributionData = () => {
    if (!statistics) return [];

    return Object.entries(statistics.rating_distribution).map(([rating, count]) => ({
      rating: `${rating}★`,
      count,
      percentage: statistics.total_reviews > 0 ? (count / statistics.total_reviews) * 100 : 0
    }));
  };

  const getResponseRateData = () => {
    return analytics.map(a => ({
      date: format(new Date(a.date), 'MMM dd'),
      responseRate: a.response_rate * 100,
      averageResponseTime: parseInt(a.average_response_time) || 0
    }));
  };

  const getImprovementSuggestions = () => {
    const suggestions = [];

    if (statistics) {
      if (statistics.average_rating < 4.0) {
        suggestions.push({
          type: 'rating',
          title: 'Improve Service Quality',
          description: 'Your average rating is below 4.0. Focus on improving customer experience.',
          priority: 'high'
        });
      }

      if (statistics.verified_reviews / statistics.total_reviews < 0.5) {
        suggestions.push({
          type: 'verification',
          title: 'Increase Review Verification',
          description: 'Less than 50% of reviews are verified. Encourage customers to connect their bookings.',
          priority: 'medium'
        });
      }

      const photoRate = statistics.photo_reviews / statistics.total_reviews;
      if (photoRate < 0.1) {
        suggestions.push({
          type: 'engagement',
          title: 'Encourage Photo Reviews',
          description: 'Only 10% of reviews include photos. Offer incentives for photo reviews.',
          priority: 'low'
        });
      }

      if (statistics.suspected_fraud > statistics.total_reviews * 0.05) {
        suggestions.push({
          type: 'fraud',
          title: 'Review Fraud Alert',
          description: 'High number of suspected fraudulent reviews. Review verification processes.',
          priority: 'high'
        });
      }
    }

    return suggestions;
  };

  const exportAnalytics = async () => {
    const csvContent = [
      ['Date', 'Total Reviews', 'Average Rating', 'Verified Reviews', 'Response Rate'],
      ...analytics.map(a => [
        a.date,
        a.total_reviews,
        a.average_rating,
        a.verified_reviews,
        a.response_rate
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `review-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const ratingTrend = getRatingTrend();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Review Analytics</h2>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportAnalytics}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics?.average_rating.toFixed(1) || '0.0'}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {ratingTrend && (
                <>
                  {ratingTrend.trend === 'up' ? (
                    <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
                  )}
                  {ratingTrend.change} from last period
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics?.total_reviews || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {statistics?.verified_reviews || 0} verified
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Photo Reviews</CardTitle>
            <Camera className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics?.photo_reviews || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {statistics && statistics.total_reviews > 0
                ? `${((statistics.photo_reviews / statistics.total_reviews) * 100).toFixed(1)}%`
                : '0%'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.length > 0
                ? `${(analytics[analytics.length - 1].response_rate * 100).toFixed(1)}%`
                : '0%'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Avg response time: {analytics.length > 0 ? analytics[analytics.length - 1].average_response_time : 'N/A'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rating Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="average_rating"
                    stroke="#8884d8"
                    strokeWidth={2}
                    name="Average Rating"
                  />
                  <Line
                    type="monotone"
                    dataKey="verified_reviews"
                    stroke="#82ca9d"
                    strokeWidth={2}
                    name="Verified Reviews"
                    yAxisId="right"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rating Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getRatingDistributionData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="rating" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sentiment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sentiment Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getSentimentData()}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {getSentimentData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Improvement Suggestions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {getImprovementSuggestions().map((suggestion, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  <AlertTriangle
                    className={`w-5 h-5 mt-0.5 ${
                      suggestion.priority === 'high'
                        ? 'text-red-500'
                        : suggestion.priority === 'medium'
                        ? 'text-yellow-500'
                        : 'text-blue-500'
                    }`}
                  />
                  <div className="flex-1">
                    <h4 className="font-medium">{suggestion.title}</h4>
                    <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                    <Badge
                      variant={suggestion.priority === 'high' ? 'destructive' : 'secondary'}
                      className="mt-2"
                    >
                      {suggestion.priority} priority
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReviewAnalytics;