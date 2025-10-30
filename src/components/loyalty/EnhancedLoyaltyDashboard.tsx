import React, { useState } from 'react';
import { Heart, Star, Gift, Users, Award, TrendingUp, Calendar, Crown } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useLoyaltyContext } from '@/contexts/LoyaltyContext';
import { format } from 'date-fns';

// Import all the loyalty components
import { EnhancedTierStatus } from './EnhancedTierStatus';
import { PointsSystem } from './PointsSystem';
import { ReferralSystem } from './ReferralSystem';
import { VIPExperience } from './VIPExperience';
import { EnhancedRewardsCatalog } from './EnhancedRewardsCatalog';
import { GamificationSystem } from './GamificationSystem';

interface EnhancedLoyaltyDashboardProps {
  className?: string;
}

export function EnhancedLoyaltyDashboard({ className }: EnhancedLoyaltyDashboardProps) {
  const { state } = useLoyaltyContext();
  const [activeTab, setActiveTab] = useState('overview');

  const member = state.member;
  const stats = state.stats;
  const loading = state.loading;

  // Quick stats
  const totalEarned = stats?.lifetimePoints || 0;
  const totalRedeemed = stats?.rewardsRedeemed || 0;
  const successfulReferrals = stats?.referralCount || 0;
  const achievementsCount = state.memberAchievements?.length || 0;
  const availablePoints = stats?.availablePoints || 0;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Welcome to the Loyalty Program</h2>
            <p className="text-muted-foreground mb-6">
              Join our exclusive loyalty program to start earning points, rewards, and VIP benefits.
            </p>
            <p className="text-sm text-muted-foreground">
              Please complete your profile or make a booking to automatically enroll in the program.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn('container mx-auto px-4 py-8 space-y-8', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 text-white">
            <Heart className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Loyalty Rewards</h1>
            <p className="text-muted-foreground">
              Earn points, unlock exclusive benefits, and enjoy the VIP experience
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {member.tier && (
            <Badge
              className="px-4 py-2 text-white font-semibold"
              style={{ backgroundColor: member.tier.color_code || '#CD7F32' }}
            >
              {member.tier.name} Member
            </Badge>
          )}
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Member Since</p>
            <p className="font-semibold">{format(new Date(member.join_date), 'MMM yyyy')}</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-900">{availablePoints.toLocaleString()}</p>
            <p className="text-sm text-green-700">Available Points</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-900">{successfulReferrals}</p>
            <p className="text-sm text-purple-700">Successful Referrals</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <Award className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-900">{achievementsCount}</p>
            <p className="text-sm text-blue-700">Achievements</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
          <CardContent className="p-4 text-center">
            <Gift className="h-8 w-8 text-amber-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-amber-900">{totalRedeemed}</p>
            <p className="text-sm text-amber-700">Rewards Redeemed</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7 mb-8">
          <TabsTrigger value="overview" className="gap-2">
            <Star className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="points" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Points
          </TabsTrigger>
          <TabsTrigger value="rewards" className="gap-2">
            <Gift className="h-4 w-4" />
            Rewards
          </TabsTrigger>
          <TabsTrigger value="referrals" className="gap-2">
            <Users className="h-4 w-4" />
            Referrals
          </TabsTrigger>
          <TabsTrigger value="vip" className="gap-2">
            <Crown className="h-4 w-4" />
            VIP
          </TabsTrigger>
          <TabsTrigger value="achievements" className="gap-2">
            <Award className="h-4 w-4" />
            Gamification
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Calendar className="h-4 w-4" />
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EnhancedTierStatus />
            <VIPExperience />
          </div>

          {/* Recent Activity Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-6 w-6" />
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
                          {transaction.transaction_type === 'expire' && <Calendar className="h-5 w-5" />}
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
        </TabsContent>

        <TabsContent value="points" className="space-y-6">
          <PointsSystem />
        </TabsContent>

        <TabsContent value="rewards" className="space-y-6">
          <EnhancedRewardsCatalog />
        </TabsContent>

        <TabsContent value="referrals" className="space-y-6">
          <ReferralSystem />
        </TabsContent>

        <TabsContent value="vip" className="space-y-6">
          <VIPExperience />
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <GamificationSystem />
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-6 w-6" />
                Complete Activity History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {state.transactions && state.transactions.length > 0 ? (
                <div className="space-y-3">
                  {state.transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'w-12 h-12 rounded-full flex items-center justify-center',
                            transaction.transaction_type === 'earn'
                              ? 'bg-green-100 text-green-600'
                              : transaction.transaction_type === 'redeem'
                              ? 'bg-red-100 text-red-600'
                              : transaction.transaction_type === 'expire'
                              ? 'bg-orange-100 text-orange-600'
                              : 'bg-gray-100 text-gray-600'
                          )}
                        >
                          {transaction.transaction_type === 'earn' && <TrendingUp className="h-6 w-6" />}
                          {transaction.transaction_type === 'redeem' && <Gift className="h-6 w-6" />}
                          {transaction.transaction_type === 'expire' && <Calendar className="h-6 w-6" />}
                          {transaction.transaction_type === 'bonus' && <Star className="h-6 w-6" />}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {transaction.description || 'Points Transaction'}
                          </p>
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span>{format(new Date(transaction.created_at), 'MMM d, yyyy • h:mm a')}</span>
                            {transaction.reference_type && (
                              <Badge variant="outline" className="text-xs">
                                {transaction.reference_type}
                              </Badge>
                            )}
                            {transaction.expires_at && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Expires {format(new Date(transaction.expires_at), 'MMM d, yyyy')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={cn(
                            'text-xl font-bold',
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
                <div className="text-center py-12">
                  <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Activity Yet</h3>
                  <p className="text-gray-500">Start booking services and engaging with the program to see your activity here!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}