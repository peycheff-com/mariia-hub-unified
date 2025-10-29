import React, { useState, useEffect } from 'react';
import { Award, Lock, Sparkles, Trophy, Star, Target, Gift } from 'lucide-react';
import { format } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLoyalty, CustomerAchievement, AchievementBadge } from '@/hooks/useLoyalty';
import { Skeleton } from '@/components/ui/skeleton';

interface AchievementBadgeProps {
  className?: string;
  showLocked?: boolean;
  maxBadges?: number;
}

export function AchievementBadges({ className, showLocked = true, maxBadges }: AchievementBadgeProps) {
  const { achievements, availableBadges, isLoadingAchievements } = useLoyalty();
  const [newAchievement, setNewAchievement] = useState<CustomerAchievement | null>(null);

  // Check for newly earned achievements (last 5 seconds)
  useEffect(() => {
    if (achievements && achievements.length > 0) {
      const latest = achievements[0];
      const earnedTime = new Date(latest.earned_at).getTime();
      const now = Date.now();

      if (now - earnedTime < 5000) {
        setNewAchievement(latest);
        const timer = setTimeout(() => setNewAchievement(null), 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [achievements]);

  if (isLoadingAchievements) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const earnedBadgeIds = new Set(achievements?.map(a => a.badge_id) || []);
  const displayBadges = maxBadges
    ? availableBadges?.slice(0, maxBadges)
    : availableBadges;

  return (
    <>
      {/* New Achievement Celebration */}
      {newAchievement && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative bg-gradient-to-br from-yellow-100 to-amber-100 rounded-2xl p-8 max-w-md mx-4 border-2 border-yellow-300 shadow-2xl animate-bounce">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full mb-4 text-white animate-spin-slow">
                <Trophy className="h-10 w-10" />
              </div>
              <h2 className="text-2xl font-bold text-yellow-900 mb-2">
                Achievement Unlocked!
              </h2>
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-3xl">{newAchievement.badge.icon}</span>
                <h3 className="text-xl font-semibold text-yellow-800">
                  {newAchievement.badge.name}
                </h3>
              </div>
              <p className="text-sm text-yellow-700 mb-3">
                {newAchievement.badge.description}
              </p>
              {newAchievement.badge.points_awarded > 0 && (
                <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white">
                  +{newAchievement.badge.points_awarded} points
                </Badge>
              )}
              <div className="mt-4 flex justify-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Sparkles key={i} className="h-4 w-4 text-yellow-500 animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <Card className={cn('bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-indigo-900">
            <Award className="h-6 w-6" />
            Achievements
            {achievements && (
              <Badge variant="secondary">
                {achievements.length}/{availableBadges?.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayBadges?.map((badge) => {
              const isEarned = earnedBadgeIds.has(badge.id);
              const achievement = achievements?.find(a => a.badge_id === badge.id);

              return (
                <div
                  key={badge.id}
                  className={cn(
                    'relative p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105',
                    isEarned
                      ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-300 shadow-md'
                      : showLocked
                      ? 'bg-gray-50 border-gray-200 opacity-60'
                      : 'hidden'
                  )}
                >
                  {/* Badge Icon */}
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className={cn(
                        'flex items-center justify-center w-12 h-12 rounded-full text-2xl',
                        isEarned
                          ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-lg'
                          : 'bg-gray-200 text-gray-400'
                      )}
                    >
                      {isEarned ? (
                        <span className="animate-bounce-slow">{badge.icon}</span>
                      ) : (
                        <Lock className="h-6 w-6" />
                      )}
                    </div>
                    {isEarned && badge.points_awarded > 0 && (
                      <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs">
                        +{badge.points_awarded}
                      </Badge>
                    )}
                  </div>

                  {/* Badge Info */}
                  <div>
                    <h3 className={cn(
                      'font-semibold mb-1',
                      isEarned ? 'text-yellow-900' : 'text-gray-500'
                    )}>
                      {badge.name}
                    </h3>
                    <p className={cn(
                      'text-xs mb-2',
                      isEarned ? 'text-yellow-700' : 'text-gray-400'
                    )}>
                      {badge.description}
                    </p>

                    {isEarned && achievement && (
                      <div className="text-xs text-yellow-600">
                        Earned {format(new Date(achievement.earned_at), 'MMM d, yyyy')}
                      </div>
                    )}

                    {!isEarned && showLocked && (
                      <div className="text-xs text-gray-500">
                        <Badge variant="outline" className="text-xs">
                          {badge.category}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Sparkle Effects for Earned Badges */}
                  {isEarned && (
                    <>
                      <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-yellow-400 animate-pulse" />
                      <Sparkles className="absolute -bottom-1 -left-1 h-4 w-4 text-yellow-400 animate-pulse delay-75" />
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Achievement Categories Summary */}
          <div className="mt-6 p-4 bg-white/50 rounded-lg">
            <h4 className="font-semibold text-indigo-900 mb-3">Categories</h4>
            <div className="flex flex-wrap gap-2">
              {['milestone', 'category', 'social', 'streak', 'behavior', 'engagement', 'special'].map((category) => {
                const categoryBadges = availableBadges?.filter(b => b.category === category) || [];
                const earnedInCategory = categoryBadges.filter(b => earnedBadgeIds.has(b.id)).length;

                if (categoryBadges.length === 0) return null;

                return (
                  <div key={category} className="flex items-center gap-2">
                    <span className="text-sm text-indigo-700 capitalize">{category}:</span>
                    <div className="flex gap-1">
                      {categoryBadges.map((badge) => (
                        <div
                          key={badge.id}
                          className={cn(
                            'w-2 h-2 rounded-full',
                            earnedBadgeIds.has(badge.id)
                              ? 'bg-gradient-to-r from-yellow-400 to-amber-500'
                              : 'bg-gray-300'
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-indigo-600">
                      {earnedInCategory}/{categoryBadges.length}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Total Points from Achievements */}
          {achievements && achievements.length > 0 && (
            <div className="mt-4 p-4 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-purple-600" />
                  <span className="font-medium text-purple-900">Total Points from Achievements</span>
                </div>
                <span className="text-xl font-bold text-purple-900">
                  {achievements.reduce((sum, a) => sum + a.badge.points_awarded, 0).toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .delay-75 {
          animation-delay: 75ms;
        }
      `}</style>
    </>
  );
}