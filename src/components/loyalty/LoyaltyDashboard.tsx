import React, { useState } from 'react';
import { Heart, Star, Gift, Users, Award, TrendingUp, Calendar } from 'lucide-react';
import { format } from 'date-fns';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLoyalty } from '@/hooks/useLoyalty';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { RewardsCatalog } from './RewardsCatalog';
import { ReferralShare } from './ReferralShare';
import { AchievementBadges } from './AchievementBadge';
import { TierStatus } from './TierStatus';
import { PointsBalance } from './PointsBalance';

import { PageHeader } from '@/components/PageHeader';

export function LoyaltyDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const {
    customerLoyalty,
    currentTier,
    nextTier,
    transactions,
    achievements,
    referrals,
    customerRewards,
    streaks,
    isLoadingLoyalty
  } = useLoyalty();

  // Quick stats
  const totalEarned = customerLoyalty?.total_earned || 0;
  const totalRedeemed = customerLoyalty?.total_redeemed || 0;
  const successfulReferrals = referrals?.filter(r => r.status === 'completed').length || 0;
  const achievementsCount = achievements?.length || 0;

  // Get booking streak
  const bookingStreak = streaks?.find(s => s.streak_type === 'booking');
  const referralStreak = streaks?.find(s => s.streak_type === 'referral');

  if (isLoadingLoyalty) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageHeader
          title="Loyalty Rewards"
          subtitle="Earn points and unlock exclusive benefits"
          className="mb-8"
        />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title={
          <div className="flex items-center gap-3">
            <Heart className="h-8 w-8 text-rose-600" />
            <span>Loyalty Rewards</span>
            {currentTier && (
              <Badge
                className="ml-2 text-white px-3 py-1"
                style={{ backgroundColor: currentTier.color }}
              >
                {currentTier.icon} {currentTier.name}
              </Badge>
            )}
          </div>
        }
        subtitle="Earn points, unlock achievements, and enjoy exclusive rewards"
        className="mb-8"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:w-[600px] mx-auto mb-8">
          <TabsTrigger value="overview" className="gap-2">
            <Star className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="rewards" className="gap-2">
            <Gift className="h-4 w-4" />
            Rewards
          </TabsTrigger>
          <TabsTrigger value="achievements" className="gap-2">
            <Award className="h-4 w-4" />
            Achievements
          </TabsTrigger>
          <TabsTrigger value="referrals" className="gap-2">
            <Users className="h-4 w-4" />
            Referrals
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Welcome Section */}
          {customerLoyalty && (
            <Card className="bg-gradient-to-r from-rose-100 to-pink-100 border-rose-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-rose-900 mb-2">
                      Welcome back, Loyalty Member!
                    </h2>
                    <p className="text-rose-700">
                      You've earned {totalEarned.toLocaleString()} points and redeemed {totalRedeemed.toLocaleString()} points so far.
                    </p>
                  </div>
                  {currentTier && (
                    <div className="text-center">
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-2"
                        style={{ backgroundColor: currentTier.color }}
                      >
                        {currentTier.icon}
                      </div>
                      <p className="font-semibold text-rose-900">{currentTier.name}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PointsBalance />
            <TierStatus />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardContent className="p-4 text-center">
                <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-900">{successfulReferrals}</p>
                <p className="text-sm text-green-700">Successful Referrals</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
              <CardContent className="p-4 text-center">
                <Award className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-900">{achievementsCount}</p>
                <p className="text-sm text-purple-700">Achievements</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
              <CardContent className="p-4 text-center">
                <Gift className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-amber-900">{customerRewards?.length || 0}</p>
                <p className="text-sm text-amber-700">Rewards Redeemed</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-rose-50 to-pink-50 border-rose-200">
              <CardContent className="p-4 text-center">
                <Calendar className="h-8 w-8 text-rose-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-rose-900">
                  {bookingStreak?.current_streak || 0}
                </p>
                <p className="text-sm text-rose-700">Booking Streak</p>
              </CardContent>
            </Card>
          </div>

          {/* Progress to Next Tier */}
          {nextTier && customerLoyalty && (
            <Card className="bg-gradient-to-r from-indigo-100 to-purple-100 border-indigo-200">
              <CardHeader>
                <CardTitle className="text-indigo-900">Progress to {nextTier.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-indigo-700">Current: {customerLoyalty.total_earned.toLocaleString()} pts</span>
                    <span className="text-indigo-700">Next Tier: {nextTier.min_points.toLocaleString()} pts</span>
                  </div>
                  <Progress
                    value={((customerLoyalty.total_earned - (currentTier?.min_points || 0)) /
                      (nextTier.min_points - (currentTier?.min_points || 0))) * 100}
                    className="h-3"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="rewards" className="space-y-6">
          <RewardsCatalog />
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <AchievementBadges showLocked={true} />
        </TabsContent>

        <TabsContent value="referrals" className="space-y-6">
          <ReferralShare />
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-6 w-6" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transactions && transactions.length > 0 ? (
                <div className="space-y-3">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center',
                            transaction.transaction_type === 'earned'
                              ? 'bg-green-100 text-green-600'
                              : transaction.transaction_type === 'redeemed'
                              ? 'bg-red-100 text-red-600'
                              : 'bg-gray-100 text-gray-600'
                          )}
                        >
                          {transaction.transaction_type === 'earned' && <TrendingUp className="h-5 w-5" />}
                          {transaction.transaction_type === 'redeemed' && <Gift className="h-5 w-5" />}
                          {transaction.transaction_type === 'expired' && <Calendar className="h-5 w-5" />}
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
                            'font-bold',
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
                  <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No activity yet</p>
                  <p className="text-sm text-gray-400">Start booking to earn points!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Streaks */}
          {(bookingStreak || referralStreak) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {bookingStreak && (
                <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-900">
                      <Calendar className="h-6 w-6" />
                      Booking Streak
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-orange-700">Current Streak</span>
                        <span className="text-2xl font-bold text-orange-900">
                          {bookingStreak.current_streak} {bookingStreak.current_streak === 1 ? 'month' : 'months'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-orange-700">Longest Streak</span>
                        <span className="text-lg font-bold text-orange-900">
                          {bookingStreak.longest_streak} {bookingStreak.longest_streak === 1 ? 'month' : 'months'}
                        </span>
                      </div>
                      {bookingStreak.next_bonus_threshold && (
                        <div className="text-xs text-orange-600">
                          Next bonus at {bookingStreak.next_bonus_threshold} months
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {referralStreak && (
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-900">
                      <Users className="h-6 w-6" />
                      Referral Streak
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-green-700">Current Streak</span>
                        <span className="text-2xl font-bold text-green-900">
                          {referralStreak.current_streak}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-green-700">Longest Streak</span>
                        <span className="text-lg font-bold text-green-900">
                          {referralStreak.longest_streak}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}