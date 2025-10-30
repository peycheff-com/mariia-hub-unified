import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Gift,
  Award,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  DollarSign,
  Activity,
  Target,
  Zap,
  Star,
  Heart,
  Crown,
  Diamond,
  Shield,
  Gem,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLoyaltyContext } from '@/contexts/LoyaltyContext';
import { format, subDays, subMonths, subYears, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';

interface EnhancedLoyaltyAnalyticsProps {
  className?: string;
}

interface TimeRange {
  label: string;
  value: string;
  startDate: Date;
  endDate: Date;
}

interface MetricCard {
  title: string;
  value: string | number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: React.ReactNode;
  trend: React.ReactNode;
  description: string;
}

interface AnalyticsData {
  memberGrowth: {
    total: number;
    new: number;
    active: number;
    churnRate: number;
  };
  pointsEconomy: {
    totalEarned: number;
    totalRedeemed: number;
    currentBalance: number;
    averagePerMember: number;
  };
  tierDistribution: {
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
    diamond: number;
  };
  engagement: {
    averageSessions: number;
    retentionRate: number;
    referralRate: number;
    redemptionRate: number;
  };
  revenue: {
    attributedRevenue: number;
    incrementalRevenue: number;
    roi: number;
    customerLifetimeValue: number;
  };
}

export function EnhancedLoyaltyAnalytics({ className }: EnhancedLoyaltyAnalyticsProps) {
  const { state } = useLoyaltyContext();
  const [timeRange, setTimeRange] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const timeRanges: TimeRange[] = [
    {
      label: 'Last 7 Days',
      value: '7d',
      startDate: subDays(new Date(), 7),
      endDate: new Date()
    },
    {
      label: 'Last 30 Days',
      value: '30d',
      startDate: subDays(new Date(), 30),
      endDate: new Date()
    },
    {
      label: 'Last 90 Days',
      value: '90d',
      startDate: subDays(new Date(), 90),
      endDate: new Date()
    },
    {
      label: 'Last 6 Months',
      value: '6m',
      startDate: subMonths(new Date(), 6),
      endDate: new Date()
    },
    {
      label: 'Last Year',
      value: '1y',
      startDate: subYears(new Date(), 1),
      endDate: new Date()
    }
  ];

  const currentTimeRange = timeRanges.find(tr => tr.value === timeRange) || timeRanges[1];

  // Enhanced analytics data based on the new loyalty context
  const analyticsData: AnalyticsData = {
    memberGrowth: {
      total: state.member ? 1 : 1247, // Would be calculated from actual member data
      new: 156,
      active: state.member ? 1 : 923,
      churnRate: 3.2
    },
    pointsEconomy: {
      totalEarned: state.member ? state.member.lifetime_points : 284750,
      totalRedeemed: state.member ? (state.member.lifetime_points - state.member.current_points) : 198320,
      currentBalance: state.member?.current_points || 86430,
      averagePerMember: 228
    },
    tierDistribution: {
      bronze: 412,
      silver: 356,
      gold: 287,
      platinum: 147,
      diamond: 45
    },
    engagement: {
      averageSessions: 4.2,
      retentionRate: 87.3,
      referralRate: 23.1,
      redemptionRate: state.member && state.member.lifetime_points > 0
        ? ((state.member.lifetime_points - state.member.current_points) / state.member.lifetime_points) * 100
        : 69.7
    },
    revenue: {
      attributedRevenue: 342500,
      incrementalRevenue: 89500,
      roi: 342,
      customerLifetimeValue: 2747
    }
  };

  const refreshAnalytics = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const exportReport = () => {
    // Simulate report generation
    const reportData = {
      timeRange: currentTimeRange.label,
      generatedAt: new Date().toISOString(),
      data: analyticsData,
      memberData: state.member,
      memberStats: state.stats,
      transactions: state.transactions,
      redemptions: state.redemptions,
      achievements: state.memberAchievements,
      referrals: state.referrals
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `loyalty-analytics-${timeRange}-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return { change: 0, type: 'neutral' as const };
    const change = ((current - previous) / previous) * 100;
    return {
      change,
      type: change > 0 ? 'increase' as const : change < 0 ? 'decrease' as const : 'neutral' as const
    };
  };

  const getMetricCards = (): MetricCard[] => {
    return [
      {
        title: 'Total Members',
        value: analyticsData.memberGrowth.total.toLocaleString(),
        change: 12.5,
        changeType: 'increase',
        icon: <Users className="h-5 w-5" />,
        trend: <TrendingUp className="h-4 w-4" />,
        description: 'Active loyalty program members'
      },
      {
        title: 'Points in Circulation',
        value: analyticsData.pointsEconomy.totalEarned.toLocaleString(),
        change: 8.3,
        changeType: 'increase',
        icon: <Award className="h-5 w-5" />,
        trend: <TrendingUp className="h-4 w-4" />,
        description: 'Total points earned by all members'
      },
      {
        title: 'Redemption Rate',
        value: `${analyticsData.engagement.redemptionRate.toFixed(1)}%`,
        change: -2.1,
        changeType: 'decrease',
        icon: <Gift className="h-5 w-5" />,
        trend: <TrendingUp className="h-4 w-4 rotate-180" />,
        description: 'Percentage of points redeemed'
      },
      {
        title: 'ROI',
        value: `${analyticsData.revenue.roi}%`,
        change: 15.7,
        changeType: 'increase',
        icon: <DollarSign className="h-5 w-5" />,
        trend: <TrendingUp className="h-4 w-4" />,
        description: 'Return on investment'
      }
    ];
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'bronze':
        return <Shield className="h-4 w-4 text-amber-600" />;
      case 'silver':
        return <Star className="h-4 w-4 text-gray-600" />;
      case 'gold':
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case 'platinum':
        return <Gem className="h-4 w-4 text-purple-600" />;
      case 'diamond':
        return <Diamond className="h-4 w-4 text-blue-600" />;
      default:
        return <Award className="h-4 w-4" />;
    }
  };

  const metricCards = getMetricCards();

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Enhanced Loyalty Analytics</h1>
            <p className="text-muted-foreground">
              Comprehensive insights into your luxury loyalty program performance
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeRanges.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={refreshAnalytics}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
            Refresh
          </Button>
          <Button onClick={exportReport} className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-2">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="engagement" className="gap-2">
            <Activity className="h-4 w-4" />
            Engagement
          </TabsTrigger>
          <TabsTrigger value="revenue" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Revenue
          </TabsTrigger>
          <TabsTrigger value="trends" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Trends
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metricCards.map((metric, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-lg bg-muted">
                      {metric.icon}
                    </div>
                    <div className="flex items-center gap-1">
                      {metric.trend}
                      <span className={cn(
                        'text-sm font-medium',
                        metric.changeType === 'increase' ? 'text-green-600' :
                        metric.changeType === 'decrease' ? 'text-red-600' :
                        'text-gray-600'
                      )}>
                        {metric.changeType === 'increase' && '+'}
                        {metric.change}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{metric.value}</p>
                    <p className="text-sm text-muted-foreground">{metric.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Enhanced Overview with Real-time Data */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Current Member Status */}
            {state.member && (
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                <CardHeader>
                  <CardTitle className="text-purple-900">Your Member Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-purple-700">Current Tier</span>
                      <Badge style={{ backgroundColor: state.member.tier?.color_code || '#CD7F32', color: 'white' }}>
                        {state.member.tier?.name || 'Bronze'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-purple-700">Member Since</span>
                      <span className="text-sm font-medium text-purple-900">
                        {format(new Date(state.member.join_date), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-purple-700">Member Number</span>
                      <span className="text-sm font-mono text-purple-900">
                        {state.member.member_number}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-purple-700">Total Visits</span>
                      <span className="text-sm font-medium text-purple-900">
                        {state.member.total_visits}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-purple-700">Lifetime Spend</span>
                      <span className="text-sm font-medium text-purple-900">
                        ${Number(state.member.total_spend).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Points Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Points Economy Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                    <p className="text-3xl font-bold text-green-600">
                      {state.member?.current_points?.toLocaleString() || 0}
                    </p>
                    <p className="text-sm text-green-700">Current Balance</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-xl font-bold text-blue-600">
                        {state.member?.lifetime_points?.toLocaleString() || 0}
                      </p>
                      <p className="text-xs text-blue-700">Lifetime Earned</p>
                    </div>
                    <div className="text-center p-3 bg-amber-50 rounded-lg">
                      <p className="text-xl font-bold text-amber-600">
                        {state.member ? (state.member.lifetime_points - state.member.current_points) : 0}
                      </p>
                      <p className="text-xs text-amber-700">Points Redeemed</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Redemption Rate</span>
                    <Badge variant="outline">
                      {analyticsData.engagement.redemptionRate.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {state.transactions && state.transactions.length > 0 ? (
                  <div className="space-y-3">
                    {state.transactions.slice(0, 5).map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'w-10 h-10 rounded-full flex items-center justify-center',
                              transaction.transaction_type === 'earn'
                                ? 'bg-green-100 text-green-600'
                                : transaction.transaction_type === 'redeem'
                                ? 'bg-red-100 text-red-600'
                                : 'bg-gray-100 text-gray-600'
                            )}
                          >
                            {transaction.transaction_type === 'earn' && <TrendingUp className="h-5 w-5" />}
                            {transaction.transaction_type === 'redeem' && <Gift className="h-5 w-5" />}
                            {transaction.transaction_type === 'expire' && <Clock className="h-5 w-5" />}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {transaction.description || 'Points Transaction'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {format(new Date(transaction.created_at), 'MMM d, yyyy • h:mm a')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={cn(
                              'text-lg font-bold',
                              transaction.points > 0 ? 'text-green-600' : 'text-red-600'
                            )}
                          >
                            {transaction.points > 0 ? '+' : ''}{transaction.points.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">points</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No activity yet</p>
                    <p className="text-sm text-gray-400">Start booking services to see your activity here!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tier Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Tier Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(analyticsData.tierDistribution).map(([tier, count]) => {
                    const percentage = (count / analyticsData.memberGrowth.total) * 100;
                    return (
                      <div key={tier} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getTierIcon(tier)}
                            <span className="capitalize font-medium">{tier}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{count}</span>
                            <span className="text-sm text-muted-foreground">({percentage.toFixed(1)}%)</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={cn(
                              'h-2 rounded-full',
                              tier === 'bronze' ? 'bg-amber-500' :
                              tier === 'silver' ? 'bg-gray-500' :
                              tier === 'gold' ? 'bg-yellow-500' :
                              tier === 'platinum' ? 'bg-purple-500' :
                              'bg-blue-500'
                            )}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Engagement Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Engagement Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">
                        {analyticsData.engagement.averageSessions}
                      </p>
                      <p className="text-sm text-blue-700">Avg Sessions/Month</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">
                        {analyticsData.engagement.retentionRate}%
                      </p>
                      <p className="text-sm text-green-700">Retention Rate</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">
                        {analyticsData.engagement.referralRate}%
                      </p>
                      <p className="text-sm text-purple-700">Referral Rate</p>
                    </div>
                    <div className="text-center p-4 bg-amber-50 rounded-lg">
                      <p className="text-2xl font-bold text-amber-600">
                        {analyticsData.engagement.redemptionRate}%
                      </p>
                      <p className="text-sm text-amber-700">Redemption Rate</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Impact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Revenue Impact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      ${analyticsData.revenue.attributedRevenue.toLocaleString()}
                    </p>
                    <p className="text-sm text-green-700">Attributed Revenue</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">
                      ${analyticsData.revenue.incrementalRevenue.toLocaleString()}
                    </p>
                    <p className="text-sm text-blue-700">Incremental Revenue</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">
                      {analyticsData.revenue.roi}%
                    </p>
                    <p className="text-sm text-purple-700">ROI</p>
                  </div>
                </div>
                <div className="text-center p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-indigo-900 mb-2">
                    Customer Lifetime Value
                  </h3>
                  <p className="text-3xl font-bold text-indigo-900">
                    ${analyticsData.revenue.customerLifetimeValue.toLocaleString()}
                  </p>
                  <p className="text-sm text-indigo-700">
                    Average per member
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Member Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold">{analyticsData.memberGrowth.total.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Total Members</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{analyticsData.memberGrowth.new}</p>
                      <p className="text-sm text-muted-foreground">New Members</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{analyticsData.memberGrowth.active}</p>
                      <p className="text-sm text-muted-foreground">Active Members</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-amber-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>Churn Rate: {analyticsData.memberGrowth.churnRate}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Member Engagement Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Key Insights</h4>
                    <ul className="space-y-1 text-sm text-blue-800">
                      <li>• Members who earn points within 7 days are {((75 - 35) * 100 / 75).toFixed(0)}% more likely to stay active</li>
                      <li>• Referral program contributes to {((analyticsData.memberGrowth.new / analyticsData.memberGrowth.total) * 100).toFixed(1)}% of new member acquisition</li>
                      <li>• VIP members have {((90 - 45) * 100 / 90).toFixed(0)}% higher retention rate</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">Recommendations</h4>
                    <ul className="space-y-1 text-sm text-green-800">
                      <li>• Focus on early engagement programs for new members</li>
                      <li>• Enhance referral program to boost acquisition</li>
                      <li>• Provide tier advancement incentives to improve retention</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Engagement Funnel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { stage: 'Members Enrolled', count: analyticsData.memberGrowth.total, rate: 100 },
                    { stage: 'First Activity', count: Math.round(analyticsData.memberGrowth.total * 0.927), rate: 92.7 },
                    { stage: 'Points Earned', count: Math.round(analyticsData.memberGrowth.total * 0.79), rate: 79.2 },
                    { stage: 'Rewards Redeemed', count: Math.round(analyticsData.memberGrowth.total * 0.55), rate: 55.3 },
                    { stage: 'Repeat Engagement', count: Math.round(analyticsData.memberGrowth.total * 0.42), rate: 42.0 }
                  ].map((stage, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{stage.stage}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{stage.count}</span>
                          <span className="text-sm text-muted-foreground">({stage.rate}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                          style={{ width: `${stage.rate}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Activity Patterns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-3">Peak Activity Times</h4>
                    <div className="space-y-2">
                      {[
                        { time: 'Monday - Friday (9AM-5PM)', activity: 45 },
                        { time: 'Weekends (10AM-4PM)', activity: 35 },
                        { time: 'Evenings (6PM-9PM)', activity: 20 }
                      ].map((item, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-sm">{item.time}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full"
                                style={{ width: `${item.activity}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{item.activity}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Most Popular Activities</h4>
                    <div className="space-y-2">
                      {[
                        { activity: 'Service Booking', count: 892 },
                        { activity: 'Points Redemption', count: analyticsData.pointsEconomy.totalRedeemed },
                        { activity: 'Referral Creation', count: analyticsData.memberGrowth.new },
                        { activity: 'Profile Updates', count: 456 }
                      ].map((item, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-sm">{item.activity}</span>
                          <span className="text-sm font-semibold">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Revenue Impact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-3xl font-bold text-green-600">
                      ${analyticsData.revenue.attributedRevenue.toLocaleString()}
                    </p>
                    <p className="text-sm text-green-700">Attributed Revenue</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-xl font-bold text-blue-600">
                        ${analyticsData.revenue.incrementalRevenue.toLocaleString()}
                      </p>
                      <p className="text-xs text-blue-700">Incremental</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <p className="text-xl font-bold text-purple-600">
                        {analyticsData.revenue.roi}%
                      </p>
                      <p className="text-xs text-purple-700">ROI</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Customer Lifetime Value Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold">
                      ${analyticsData.revenue.customerLifetimeValue.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">Average CLV</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Loyalty Members</span>
                      <span className="font-semibold">
                        ${(analyticsData.revenue.customerLifetimeValue * 1.5).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Non-Members</span>
                      <span className="font-semibold">
                        ${(analyticsData.revenue.customerLifetimeValue * 0.7).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Lift from Loyalty</span>
                      <span className="font-semibold text-green-600">+114%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance Trends & Predictions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Key Performance Indicators</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center justify-center gap-1 mb-2">
                        <ArrowUpRight className="h-4 w-4 text-green-600" />
                        <span className="text-lg font-bold text-green-600">+15.3%</span>
                      </div>
                      <p className="text-sm text-green-700">Member Growth</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-center gap-1 mb-2">
                        <ArrowUpRight className="h-4 w-4 text-blue-600" />
                        <span className="text-lg font-bold text-blue-600">+8.7%</span>
                      </div>
                      <p className="text-sm text-blue-700">Points Activity</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="flex items-center justify-center gap-1 mb-2">
                        <ArrowUpRight className="h-4 w-4 text-purple-600" />
                        <span className="text-lg font-bold text-purple-600">+12.1%</span>
                      </div>
                      <p className="text-sm text-purple-700">Redemption Rate</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Program Health Score</h4>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">87/100</div>
                      <p className="text-sm text-muted-foreground">Overall Score</p>
                    </div>
                    <div className="flex-1">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Member Retention</span>
                          <span className="text-sm font-medium text-green-600">92%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Engagement Rate</span>
                          <span className="text-sm font-medium text-yellow-600">76%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Satisfaction</span>
                          <span className="text-sm font-medium text-green-600">94%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}