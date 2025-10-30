import React, { useState } from 'react';
import { Crown, Star, Shield, Gem, Sparkles, ChevronRight, Info, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useLoyaltyContext } from '@/contexts/LoyaltyContext';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface TierConfig {
  name: string;
  level: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  benefits: string[];
  requirements: {
    minSpend: number;
    minVisits: number;
    minPoints: number;
  };
}

const tierConfigs: Record<string, TierConfig> = {
  Bronze: {
    name: 'Bronze',
    level: 1,
    icon: <Shield className="h-6 w-6" />,
    color: '#CD7F32',
    bgColor: 'bg-gradient-to-br from-amber-50 to-orange-50',
    borderColor: 'border-amber-200',
    description: 'Start your luxury journey with exclusive member benefits',
    benefits: [
      'Welcome points on first visit',
      'Birthday gift',
      '5% member discount',
      'Exclusive member events',
      'Points earning on all purchases',
    ],
    requirements: {
      minSpend: 0,
      minVisits: 0,
      minPoints: 0,
    },
  },
  Silver: {
    name: 'Silver',
    level: 2,
    icon: <Star className="h-6 w-6" />,
    color: '#C0C0C0',
    bgColor: 'bg-gradient-to-br from-gray-50 to-slate-50',
    borderColor: 'border-gray-300',
    description: 'Enhanced rewards and priority service',
    benefits: [
      'Enhanced points earning (20% bonus)',
      'Priority support',
      'Seasonal exclusive offers',
      'Free consultation',
      'Early access to promotions',
      'Priority booking (48 hours)',
    ],
    requirements: {
      minSpend: 500,
      minVisits: 5,
      minPoints: 500,
    },
  },
  Gold: {
    name: 'Gold',
    level: 3,
    icon: <Crown className="h-6 w-6" />,
    color: '#FFD700',
    bgColor: 'bg-gradient-to-br from-yellow-50 to-amber-50',
    borderColor: 'border-yellow-300',
    description: 'Premium experience with VIP treatment',
    benefits: [
      'Exclusive events and workshops',
      'Free monthly treatment',
      'Personalized recommendations',
      'VIP booking priority (24 hours)',
      'Complimentary upgrades',
      'Partner discounts (15% off)',
      'Dedicated support specialist',
    ],
    requirements: {
      minSpend: 1500,
      minVisits: 15,
      minPoints: 1500,
    },
  },
  Platinum: {
    name: 'Platinum',
    level: 4,
    icon: <Gem className="h-6 w-6" />,
    color: '#E5E4E2',
    bgColor: 'bg-gradient-to-br from-slate-50 to-gray-50',
    borderColor: 'border-slate-300',
    description: 'Elite status with concierge service',
    benefits: [
      'Personal concierge service',
      'Exclusive products access',
      'Quarterly VIP events',
      'Custom treatment plans',
      'Unlimited priority booking',
      'White-glove service',
      'Complimentary enhancements',
      'First access to new services',
    ],
    requirements: {
      minSpend: 5000,
      minVisits: 50,
      minPoints: 5000,
    },
  },
  Diamond: {
    name: 'Diamond',
    level: 5,
    icon: <Sparkles className="h-6 w-6" />,
    color: '#B9F2FF',
    bgColor: 'bg-gradient-to-br from-blue-50 to-cyan-50',
    borderColor: 'border-blue-200',
    description: 'Ultimate luxury and exclusive experiences',
    benefits: [
      'Custom luxury experiences',
      'First access to innovations',
      'Personalized service creation',
      'Exclusive Diamond events',
      'Lifetime recognition',
      'Custom rewards program',
      'Unlimited complimentary treatments',
      'Personal luxury coordinator',
    ],
    requirements: {
      minSpend: 15000,
      minVisits: 100,
      minPoints: 15000,
    },
  },
};

interface TierStatusProps {
  className?: string;
  showAllTiers?: boolean;
}

export function TierStatus({ className, showAllTiers = true }: TierStatusProps) {
  const { state } = useLoyaltyContext();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [showBenefits, setShowBenefits] = useState(false);

  const currentTier = state.member?.tier;
  const currentTierConfig = currentTier ? tierConfigs[currentTier.name] : tierConfigs.Bronze;
  const tierProgress = state.stats?.tierProgress || 0;
  const pointsToNextTier = state.stats?.pointsToNextTier || 0;

  if (isLoadingLoyalty) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!tiers || tiers.length === 0) {
    return null;
  }

  const getTierIcon = (tierName: string) => {
    const icons: Record<string, React.ReactNode> = {
      bronze: <Trophy className="h-5 w-5" />,
      silver: <Star className="h-5 w-5" />,
      gold: <Trophy className="h-5 w-5" />,
      platinum: <Zap className="h-5 w-5" />
    };
    return icons[tierName.toLowerCase()] || <Trophy className="h-5 w-5" />;
  };

  const pointsToNextTier = nextTier && customerLoyalty
    ? Math.max(0, nextTier.min_points - customerLoyalty.total_earned)
    : 0;

  return (
    <Card className={cn('bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-900">
          <Trophy className="h-6 w-6" />
          Your Loyalty Tier
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Tier Display */}
        {currentTier && (
          <div className="bg-gradient-to-r from-purple-100 to-indigo-100 rounded-xl p-6 border border-purple-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="p-3 rounded-full text-white"
                  style={{ backgroundColor: currentTier.color }}
                >
                  {currentTier.icon || getTierIcon(currentTier.name)}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-purple-900">
                    {currentTier.name} Tier
                  </h3>
                  <p className="text-sm text-purple-700">
                    Level {currentTier.level} Member
                  </p>
                </div>
              </div>
              {currentTier.point_multiplier > 1 && (
                <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
                  ×{currentTier.point_multiplier} Points
                </Badge>
              )}
            </div>

            {/* Tier Benefits */}
            {currentTier.benefits && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(currentTier.benefits).map(([key, value]) => {
                  if (value === true) {
                    return (
                      <div key={key} className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span className="text-purple-900">
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                    );
                  }
                  if (typeof value === 'number' && (key.includes('bonus') || key.includes('points'))) {
                    return (
                      <div key={key} className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span className="text-purple-900">
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()}: {value} points
                        </span>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            )}

            {/* Tier Expiry Warning */}
            {isTierExpiringSoon && customerLoyalty?.tier_expires_at && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-900">
                  ⚠️ Your tier status expires on {format(new Date(customerLoyalty.tier_expires_at), 'MMMM d, yyyy')}
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  Earn more points to maintain your {currentTier.name} status
                </p>
              </div>
            )}
          </div>
        )}

        {/* Progress to Next Tier */}
        {nextTier && customerLoyalty && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-purple-900">Progress to {nextTier.name}</h4>
              <span className="text-sm text-purple-700">
                {pointsToNextTier.toLocaleString()} points to go
              </span>
            </div>
            <Progress
              value={Math.min(progressToNextTier, 100)}
              className="h-3"
              // Custom color for progress bar
              style={{
                '--progress-background': nextTier.color
              } as React.CSSProperties}
            />
            <div className="flex justify-between text-xs text-purple-600">
              <span>{currentTier?.min_points || 0} pts</span>
              <span>{nextTier.min_points} pts</span>
            </div>
          </div>
        )}

        {/* All Tiers Overview */}
        {showAllTiers && (
          <div className="space-y-3">
            <h4 className="font-semibold text-purple-900">All Tiers</h4>
            <div className="space-y-2">
              {tiers.map((tier) => {
                const isCurrentTier = tier.name === currentTier?.name;
                const isAchieved = customerLoyalty && customerLoyalty.total_earned >= tier.min_points;
                const isNextTier = tier.name === nextTier?.name;

                return (
                  <div
                    key={tier.id}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg border transition-all',
                      isCurrentTier
                        ? 'bg-gradient-to-r from-purple-100 to-indigo-100 border-purple-300'
                        : isAchieved
                        ? 'bg-purple-50 border-purple-200'
                        : 'bg-gray-50 border-gray-200 opacity-60'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'p-2 rounded-full text-white',
                          !isAchieved && 'grayscale'
                        )}
                        style={{ backgroundColor: tier.color }}
                      >
                        {tier.icon || getTierIcon(tier.name)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-purple-900">
                            {tier.name}
                          </span>
                          {isCurrentTier && (
                            <Badge variant="secondary" className="text-xs">
                              Current
                            </Badge>
                          )}
                          {isNextTier && (
                            <Badge variant="outline" className="text-xs">
                              Next
                            </Badge>
                          )}
                          {!isAchieved && (
                            <Lock className="h-3 w-3 text-gray-400" />
                          )}
                        </div>
                        <p className="text-xs text-purple-700">
                          {tier.min_points.toLocaleString()} points • ×{tier.point_multiplier} points rate
                        </p>
                      </div>
                    </div>
                    {tier.point_multiplier > 1 && (
                      <Badge
                        variant="secondary"
                        className={cn(
                          'text-xs',
                          isCurrentTier && 'bg-purple-200 text-purple-900'
                        )}
                      >
                        ×{tier.point_multiplier}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Max Tier Achievement */}
        {currentTier && !nextTier && (
          <div className="text-center p-6 bg-gradient-to-r from-yellow-100 to-amber-100 rounded-xl border border-yellow-200">
            <Trophy className="h-12 w-12 text-yellow-600 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-yellow-900 mb-2">
              Maximum Tier Achieved!
            </h3>
            <p className="text-sm text-yellow-800">
              Congratulations! You've reached the highest tier in our loyalty program.
              Enjoy all the exclusive benefits and continue earning amazing rewards.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}