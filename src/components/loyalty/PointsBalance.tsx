import React from 'react';
import { Coins, TrendingUp, Calendar, Gift } from 'lucide-react';
import { format } from 'date-fns';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLoyalty } from '@/hooks/useLoyalty';
import { Skeleton } from '@/components/ui/skeleton';

interface PointsBalanceProps {
  className?: string;
  showDetails?: boolean;
}

export function PointsBalance({ className, showDetails = true }: PointsBalanceProps) {
  const { customerLoyalty, currentTier, isLoadingLoyalty } = useLoyalty();

  if (isLoadingLoyalty) {
    return (
      <Card className={cn('bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200', className)}>
        <CardContent className="p-6">
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!customerLoyalty) {
    return null;
  }

  const expiringPoints = 200; // This would come from an API call to check expiring points

  return (
    <Card className={cn(
      'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200',
      'shadow-lg hover:shadow-xl transition-all duration-300',
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Coins className="h-8 w-8 text-amber-600" />
              <h3 className="text-2xl font-bold text-amber-900">Points Balance</h3>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold text-amber-800">
                {customerLoyalty.current_points.toLocaleString()}
              </span>
              <span className="text-sm text-amber-600">points</span>
            </div>
          </div>
          {currentTier && (
            <Badge
              variant="secondary"
              className={cn(
                'text-white font-semibold px-3 py-1',
                'bg-gradient-to-r from-amber-500 to-amber-600'
              )}
              style={{ backgroundColor: currentTier.color }}
            >
              {currentTier.icon} {currentTier.name}
            </Badge>
          )}
        </div>

        {showDetails && (
          <div className="space-y-4">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-amber-700 mb-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs font-medium">Total Earned</span>
                </div>
                <p className="text-lg font-bold text-amber-900">
                  {customerLoyalty.total_earned.toLocaleString()}
                </p>
              </div>

              <div className="bg-white/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-amber-700 mb-1">
                  <Gift className="h-4 w-4" />
                  <span className="text-xs font-medium">Redeemed</span>
                </div>
                <p className="text-lg font-bold text-amber-900">
                  {customerLoyalty.total_redeemed.toLocaleString()}
                </p>
              </div>

              <div className="bg-white/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-amber-700 mb-1">
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs font-medium">Last Activity</span>
                </div>
                <p className="text-sm font-bold text-amber-900">
                  {format(new Date(customerLoyalty.last_activity), 'MMM d')}
                </p>
              </div>

              {expiringPoints > 0 && (
                <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                  <div className="flex items-center gap-2 text-red-700 mb-1">
                    <Calendar className="h-4 w-4" />
                    <span className="text-xs font-medium">Expiring Soon</span>
                  </div>
                  <p className="text-lg font-bold text-red-900">
                    {expiringPoints.toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            {/* Point Multiplier */}
            {currentTier && currentTier.point_multiplier > 1 && (
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-900">Points Multiplier</p>
                    <p className="text-xs text-purple-700">
                      Earn {currentTier.point_multiplier}x points on all bookings
                    </p>
                  </div>
                  <div className="text-2xl font-bold text-purple-900">
                    ×{currentTier.point_multiplier}
                  </div>
                </div>
              </div>
            )}

            {/* Benefits Preview */}
            {currentTier && currentTier.benefits && (
              <div className="bg-white/30 rounded-lg p-4">
                <p className="text-sm font-medium text-amber-900 mb-2">Current Benefits</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(currentTier.benefits).map(([key, value]) => {
                    if (typeof value === 'boolean' && value) {
                      return (
                        <Badge key={key} variant="outline" className="text-xs">
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                      );
                    }
                    if (key === 'birthday_bonus' && typeof value === 'number') {
                      return (
                        <Badge key={key} variant="outline" className="text-xs">
                          Birthday Bonus: {value} pts
                        </Badge>
                      );
                    }
                    if (key === 'referral_bonus' && typeof value === 'number') {
                      return (
                        <Badge key={key} variant="outline" className="text-xs">
                          Referral Bonus: {value} pts
                        </Badge>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}