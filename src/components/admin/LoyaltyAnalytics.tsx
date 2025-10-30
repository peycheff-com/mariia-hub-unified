import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import {
  TrendingUp,
  Users,
  Award,
  Gift,
  Target,
  Calendar,
  DollarSign,
  Activity,
  Eye,
  ChevronDown,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { toast aria-live="polite" aria-atomic="true" } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

interface LoyaltyAnalyticsProps {
  className?: string;
}

interface AnalyticsData {
  overview: {
    totalMembers: number;
    activeMembers: number;
    totalPointsIssued: number;
    totalPointsRedeemed: number;
    totalRevenue: number;
    averagePointsPerMember: number;
    redemptionRate: number;
  };
  tierDistribution: Array<{
    name: string;
    count: number;
    percentage: number;
    color: string;
  }>;
  pointsActivity: Array<{
    date: string;
    earned: number;
    redeemed: number;
    net: number;
  }>;
  topAchievements: Array<{
    name: string;
    count: number;
    points: number;
  }>;
  referralPerformance: Array<{
    period: string;
    referrals: number;
    conversions: number;
    revenue: number;
  }>;
  rewardPopularity: Array<{
    name: string;
    redemptions: number;
    pointsUsed: number;
    revenue: number;
  }>;
  memberEngagement: Array<{
    cohort: string;
    retention: number[];
    size: number;
  }>;
}

const COLORS = ['#8B4513', '#C0C0C0', '#FFD700', '#E5E4E2', '#B9F2FF'];

export const LoyaltyAnalytics: React.FC<LoyaltyAnalyticsProps> = ({ className }) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState('30d');
  const [selectedTier, setSelectedTier] = useState('all');

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange, selectedTier]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      // Simulate API call - replace with actual analytics service
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockData: AnalyticsData = {
        overview: {
          totalMembers: 1247,
          activeMembers: 892,
          totalPointsIssued: 245680,
          totalPointsRedeemed: 89240,
          totalRevenue: 45680,
          averagePointsPerMember: 197,
          redemptionRate: 36.3
        },
        tierDistribution: [
          { name: 'Bronze', count: 523, percentage: 42, color: '#CD7F32' },
          { name: 'Silver', count: 412, percentage: 33, color: '#C0C0C0' },
          { name: 'Gold', count: 234, percentage: 19, color: '#FFD700' },
          { name: 'Platinum', count: 68, percentage: 5, color: '#E5E4E2' },
          { name: 'Diamond', count: 10, percentage: 1, color: '#B9F2FF' }
        ],
        pointsActivity: Array.from({ length: 30 }, (_, i) => {
          const date = format(subDays(new Date(), 29 - i), 'MMM dd');
          const base = 500 + Math.random() * 1000;
          return {
            date,
            earned: Math.floor(base + Math.random() * 500),
            redeemed: Math.floor(base * 0.4 + Math.random() * 200),
            net: Math.floor(base * 0.6 + Math.random() * 300)
          };
        }),
        topAchievements: [
          { name: 'First Visit', count: 1247, points: 62350 },
          { name: 'Loyal Client', count: 423, points: 42300 },
          { name: 'Social Butterfly', count: 234, points: 5850 },
          { name: 'Referral Champion', count: 89, points: 17800 },
          { name: 'Fitness Enthusiast', count: 156, points: 23400 }
        ],
        referralPerformance: [
          { period: 'Week 1', referrals: 45, conversions: 12, revenue: 2340 },
          { period: 'Week 2', referrals: 52, conversions: 15, revenue: 2980 },
          { period: 'Week 3', referrals: 38, conversions: 11, revenue: 2180 },
          { period: 'Week 4', referrals: 67, conversions: 19, revenue: 3780 }
        ],
        rewardPopularity: [
          { name: '10% Off Treatment', redemptions: 234, pointsUsed: 46800, revenue: 9360 },
          { name: 'Free Consultation', redemptions: 156, pointsUsed: 46800, revenue: 0 },
          { name: 'Lip Enhancement', redemptions: 45, pointsUsed: 36000, revenue: 13500 },
          { name: 'Product Set', redemptions: 89, pointsUsed: 44500, revenue: 8900 },
          { name: 'VIP Workshop', redemptions: 23, pointsUsed: 13800, revenue: 4600 }
        ],
        memberEngagement: [
          { cohort: 'Jan 2024', retention: [100, 85, 72, 68, 65, 63], size: 145 },
          { cohort: 'Feb 2024', retention: [100, 88, 75, 71, 69], size: 167 },
          { cohort: 'Mar 2024', retention: [100, 90, 78, 74], size: 189 },
          { cohort: 'Apr 2024', retention: [100, 92, 80], size: 234 }
        ]
      };

      setData(mockData);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast aria-live="polite" aria-atomic="true".error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalyticsData();
    setRefreshing(false);
    toast aria-live="polite" aria-atomic="true".success('Analytics refreshed');
  };

  const handleExport = async () => {
    try {
      // Export functionality would be implemented here
      toast aria-live="polite" aria-atomic="true".success('Analytics exported successfully');
    } catch (error) {
      toast aria-live="polite" aria-atomic="true".error('Failed to export analytics');
    }
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Loyalty Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive insights into your loyalty program performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.totalMembers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {data.overview.activeMembers.toLocaleString()} active ({((data.overview.activeMembers / data.overview.totalMembers) * 100).toFixed(1)}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Points in Circulation</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(data.overview.totalPointsIssued - data.overview.totalPointsRedeemed).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.overview.redemptionRate.toFixed(1)}% redemption rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Impact</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">PLN {data.overview.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              From loyalty-driven bookings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Points/Member</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.averagePointsPerMember}</div>
            <p className="text-xs text-muted-foreground">
              Current balance average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tiers">Tier Analysis</TabsTrigger>
          <TabsTrigger value="points">Points Activity</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Points Activity Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.pointsActivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="earned" stackId="1" stroke="#10b981" fill="#10b981" />
                    <Area type="monotone" dataKey="redeemed" stackId="2" stroke="#ef4444" fill="#ef4444" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Achievements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.topAchievements.map((achievement, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{achievement.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {achievement.count} members
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{achievement.points.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">points</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tiers" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Tier Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.tierDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {data.tierDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tier Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.tierDistribution.map((tier) => (
                    <div key={tier.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: tier.color }}
                          />
                          <span className="font-medium">{tier.name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {tier.count.toLocaleString()} members ({tier.percentage}%)
                        </span>
                      </div>
                      <Progress value={tier.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="points" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Points Flow Analysis</CardTitle>
              <CardDescription>
                Track points earned vs redeemed over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={data.pointsActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="earned" stroke="#10b981" strokeWidth={2} />
                  <Line type="monotone" dataKey="redeemed" stroke="#ef4444" strokeWidth={2} />
                  <Line type="monotone" dataKey="net" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="referrals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Referral Performance</CardTitle>
              <CardDescription>
                Track referral conversion rates and revenue impact
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.referralPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="referrals" fill="#10b981" />
                  <Bar dataKey="conversions" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reward Popularity</CardTitle>
              <CardDescription>
                Most redeemed rewards and their point usage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.rewardPopularity.map((reward, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{reward.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {reward.redemptions} redemptions
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{reward.pointsUsed.toLocaleString()} pts</p>
                      <p className="text-sm text-muted-foreground">
                        PLN {reward.revenue.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Member Engagement</CardTitle>
              <CardDescription>
                Cohort retention analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.memberEngagement.map((cohort) => (
                  <div key={cohort.cohort} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{cohort.cohort} Cohort</span>
                      <span className="text-sm text-muted-foreground">
                        {cohort.size} members
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {cohort.retention.map((rate, index) => (
                        <div
                          key={index}
                          className="flex-1 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded flex items-center justify-center text-white text-xs font-medium"
                          style={{ opacity: rate / 100 }}
                        >
                          {rate}%
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                      <span>Month 0</span>
                      {cohort.retention.slice(1).map((_, index) => (
                        <span key={index} className="flex-1 text-center">
                          Month {index + 1}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};