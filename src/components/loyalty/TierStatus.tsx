import React from 'react';
import { Trophy, Lock, Star, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useLoyalty } from '@/hooks/useLoyalty';
import { Skeleton } from '@/components/ui/skeleton';

interface TierStatusProps {
  className?: string;
  showAllTiers?: boolean;
}

export function TierStatus({ className, showAllTiers = true }: TierStatusProps) {
  const {
    currentTier,
    nextTier,
    progressToNextTier,
    customerLoyalty,
    tiers,
    isTierExpiringSoon,
    isLoadingLoyalty
  } = useLoyalty();

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