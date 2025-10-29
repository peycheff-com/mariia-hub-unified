import React, { useState } from 'react';
import { TrendingUp, Users, Gift, Target, Award, Calendar, DollarSign, Activity, BarChart3, PieChart, Download, Filter } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';


export function LoyaltyAnalytics() {
  const [dateRange, setDateRange] = useState('30');
  const [selectedMetric, setSelectedMetric] = useState('overview');

  // Calculate date range
  const endDate = new Date();
  const startDate = subDays(endDate, parseInt(dateRange));

  // Fetch overview stats
  const { data: overviewStats } = useQuery({
    queryKey: ['loyalty-analytics-overview', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loyalty_summary')
        .select('*');

      if (error) throw error;

      return {
        totalMembers: data?.length || 0,
        activeMembers: data?.filter(m => m.last_activity && new Date(m.last_activity) > subDays(new Date(), 30)).length || 0,
        totalPointsEarned: data?.reduce((sum, m) => sum + m.total_earned, 0) || 0,
        totalPointsRedeemed: data?.reduce((sum, m) => sum + m.total_redeemed, 0) || 0,
        averagePointsPerMember: data?.length ? Math.round(data.reduce((sum, m) => sum + m.current_points, 0) / data.length) : 0
      };
    }
  });

  // Fetch tier distribution
  const { data: tierDistribution } = useQuery({
    queryKey: ['loyalty-tier-distribution'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tier_distribution')
        .select('*')
        .order('level');

      if (error) throw error;

      return data.map(tier => ({
        name: tier.tier_name,
        value: tier.customer_count,
        color: tier.name === 'platinum' ? '#E5E4E2' :
               tier.name === 'gold' ? '#FFD700' :
               tier.name === 'silver' ? '#C0C0C0' : '#CD7F32'
      }));
    }
  });

  // Fetch points trend data
  const { data: pointsTrend } = useQuery({
    queryKey: ['loyalty-points-trend', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('point_transactions')
        .select('created_at, points, transaction_type')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at');

      if (error) throw error;

      // Group by date
      const grouped = data?.reduce((acc: any, transaction) => {
        const date = format(new Date(transaction.created_at), 'MMM dd');
        if (!acc[date]) {
          acc[date] = { earned: 0, redeemed: 0 };
        }
        if (transaction.transaction_type === 'earned') {
          acc[date].earned += Math.abs(transaction.points);
        } else if (transaction.transaction_type === 'redeemed') {
          acc[date].redeemed += Math.abs(transaction.points);
        }
        return acc;
      }, {});

      return Object.entries(grouped || {}).map(([date, values]: [string, any]) => ({
        date,
        ...values
      }));
    }
  });

  // Fetch top performers
  const { data: topPerformers } = useQuery({
    queryKey: ['loyalty-top-performers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loyalty_summary')
        .select('*')
        .order('total_earned', { ascending: false })
        .limit(10);

      if (error) throw error;

      return data.map(member => ({
        name: `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.email,
        points: member.total_earned,
        tier: member.tier,
        achievements: member.achievement_count
      }));
    }
  });

  // Fetch rewards analytics
  const { data: rewardsAnalytics } = useQuery({
    queryKey: ['loyalty-rewards-analytics', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_rewards')
        .select(`
          points_used,
          created_at,
          rewards_catalog!inner (
            name,
            category,
            points_cost
          )
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) throw error;

      const categoryTotals = data?.reduce((acc: any, reward) => {
        const category = reward.rewards_catalog.category;
        if (!acc[category]) {
          acc[category] = { count: 0, points: 0 };
        }
        acc[category].count += 1;
        acc[category].points += reward.points_used;
        return acc;
      }, {});

      return {
        totalRedemptions: data?.length || 0,
        totalPointsRedeemed: data?.reduce((sum, r) => sum + r.points_used, 0) || 0,
        categories: Object.entries(categoryTotals || {}).map(([category, values]: [string, any]) => ({
          category,
          ...values
        })),
        topRewards: data?.reduce((acc: any, reward) => {
          const name = reward.rewards_catalog.name;
          acc[name] = (acc[name] || 0) + 1;
          return acc;
        }, {})
      };
    }
  });

  // Fetch referral analytics
  const { data: referralAnalytics } = useQuery({
    queryKey: ['loyalty-referral-analytics', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) throw error;

      const total = data?.length || 0;
      const completed = data?.filter(r => r.status === 'completed').length || 0;
      const pending = data?.filter(r => r.status === 'pending').length || 0;

      return {
        total,
        completed,
        pending,
        conversionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        pointsAwarded: data?.filter(r => r.status === 'completed').reduce((sum, r) => sum + r.reward_points + r.referrer_reward_points, 0) || 0
      };
    }
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  const exportReport = () => {
    const reportData = {
      overview: overviewStats,
      tierDistribution,
      topPerformers,
      rewardsAnalytics,
      referralAnalytics,
      generatedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `loyalty-analytics-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Loyalty Analytics</h2>
          <p className="text-muted-foreground">Track program performance and customer engagement</p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
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
          <Button variant="outline" onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{overviewStats?.totalMembers || 0}</p>
                <p className="text-sm text-muted-foreground">Total Members</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{overviewStats?.activeMembers || 0}</p>
                <p className="text-sm text-muted-foreground">Active Members</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{(overviewStats?.totalPointsEarned || 0).toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Points Earned</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-2xl font-bold">{(overviewStats?.totalPointsRedeemed || 0).toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Points Redeemed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-rose-600" />
              <div>
                <p className="text-2xl font-bold">{overviewStats?.averagePointsPerMember || 0}</p>
                <p className="text-sm text-muted-foreground">Avg Points/Member</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Points Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Points Trend</CardTitle>
            <CardDescription>Daily points earned vs redeemed</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={pointsTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="earned" stroke="#10b981" name="Earned" />
                <Line type="monotone" dataKey="redeemed" stroke="#ef4444" name="Redeemed" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tier Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Tier Distribution</CardTitle>
            <CardDescription>Customer distribution across tiers</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RePieChart>
                <Pie
                  data={tierDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {tierDistribution?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Detailed Analytics */}
      <Tabs value={selectedMetric} onValueChange={setSelectedMetric} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
          <TabsTrigger value="performers">Top Members</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Engagement Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Engagement Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Redemption Rate</span>
                    <Badge variant="secondary">
                      {overviewStats?.totalPointsEarned > 0
                        ? Math.round((overviewStats.totalPointsRedeemed / overviewStats.totalPointsEarned) * 100)
                        : 0}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Active Rate</span>
                    <Badge variant="secondary">
                      {overviewStats?.totalMembers > 0
                        ? Math.round((overviewStats.activeMembers / overviewStats.totalMembers) * 100)
                        : 0}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Points Velocity</span>
                    <Badge variant="secondary">
                      {Math.round((overviewStats?.totalPointsEarned || 0) / parseInt(dateRange))} pts/day
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Program Health */}
            <Card>
              <CardHeader>
                <CardTitle>Program Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                    <span className="text-sm">Excellent tier progression</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                    <span className="text-sm">High engagement rate</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full" />
                    <span className="text-sm">Stable redemption patterns</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Rewards Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Rewards Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total Redemptions</span>
                    <span className="font-bold">{rewardsAnalytics?.totalRedemptions || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Points Redeemed</span>
                    <span className="font-bold">{(rewardsAnalytics?.totalPointsRedeemed || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Points per Redemption</span>
                    <span className="font-bold">
                      {rewardsAnalytics?.totalRedemptions
                        ? Math.round(rewardsAnalytics.totalPointsRedeemed / rewardsAnalytics.totalRedemptions)
                        : 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Popular Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Popular Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {rewardsAnalytics?.categories.map((category, index) => (
                    <div key={category.category} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS[index] }} />
                        <span className="capitalize">{category.category}</span>
                      </div>
                      <span className="font-bold">{category.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="referrals" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Referral Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Referral Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total Referrals</span>
                    <span className="font-bold">{referralAnalytics?.total || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Conversion Rate</span>
                    <span className="font-bold">{referralAnalytics?.conversionRate || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Points Awarded</span>
                    <span className="font-bold">{referralAnalytics?.pointsAwarded || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Referral Funnel */}
            <Card>
              <CardHeader>
                <CardTitle>Referral Funnel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Initiated</span>
                      <span className="text-sm">{referralAnalytics?.total || 0}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '100%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Pending</span>
                      <span className="text-sm">{referralAnalytics?.pending || 0}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-600 h-2 rounded-full"
                        style={{ width: `${referralAnalytics?.total ? (referralAnalytics.pending / referralAnalytics.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Completed</span>
                      <span className="text-sm">{referralAnalytics?.completed || 0}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${referralAnalytics?.conversionRate || 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
              <CardDescription>Members with highest engagement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topPerformers?.map((member, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {member.tier}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {member.achievements} achievements
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{member.points.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">points</p>
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
}