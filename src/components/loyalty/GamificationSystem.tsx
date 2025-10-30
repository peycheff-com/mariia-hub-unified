import React, { useState } from 'react';
import {
  Trophy,
  Award,
  Target,
  Star,
  Zap,
  Heart,
  TrendingUp,
  Calendar,
  Users,
  MessageSquare,
  Gift,
  Crown,
  Shield,
  Gem,
  Sparkles,
  CheckCircle,
  Lock,
  Clock,
  Fire,
  Gamepad2,
  Medal,
  Flag,
  Rocket
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useLoyaltyContext } from '@/contexts/LoyaltyContext';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Achievement, MemberAchievement } from '@/contexts/LoyaltyContext';

interface GamificationSystemProps {
  className?: string;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'monthly' | 'weekly' | 'special' | 'seasonal';
  category: 'booking' | 'referral' | 'social' | 'wellness' | 'learning';
  startDate: string;
  endDate: string;
  requirements: {
    type: string;
    target: number;
    current: number;
  };
  rewards: {
    points: number;
    badge?: string;
    experience?: string;
  };
  isCompleted: boolean;
  progress: number;
}

interface StreakData {
  type: string;
  current: number;
  longest: number;
  lastActivity: string;
  nextMilestone: number;
  bonusMultiplier: number;
}

export function GamificationSystem({ className }: GamificationSystemProps) {
  const { state } = useLoyaltyContext();
  const [activeTab, setActiveTab] = useState('achievements');
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  const achievements = state.achievements || [];
  const memberAchievements = state.memberAchievements || [];
  const gamification = state.gamification;

  // Sample challenges data
  const challenges: Challenge[] = [
    {
      id: '1',
      title: 'Beauty Explorer',
      description: 'Try 5 different beauty services this month',
      type: 'monthly',
      category: 'booking',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      requirements: {
        type: 'different_services',
        target: 5,
        current: 2
      },
      rewards: {
        points: 200,
        badge: 'Beauty Explorer',
        experience: 'Free consultation'
      },
      isCompleted: false,
      progress: 40
    },
    {
      id: '2',
      title: 'Referral Champion',
      description: 'Refer 3 friends who complete their first booking',
      type: 'monthly',
      category: 'referral',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      requirements: {
        type: 'successful_referrals',
        target: 3,
        current: 1
      },
      rewards: {
        points: 300,
        badge: 'Referral Master',
        experience: 'VIP treatment upgrade'
      },
      isCompleted: false,
      progress: 33
    },
    {
      id: '3',
      title: 'Social Butterfly',
      description: 'Share 3 reviews and tag us on social media',
      type: 'weekly',
      category: 'social',
      startDate: '2024-01-15',
      endDate: '2024-01-21',
      requirements: {
        type: 'social_shares',
        target: 3,
        current: 2
      },
      rewards: {
        points: 100,
        badge: 'Social Star'
      },
      isCompleted: false,
      progress: 67
    },
    {
      id: '4',
      title: 'Wellness Warrior',
      description: 'Complete 8 fitness sessions this month',
      type: 'monthly',
      category: 'wellness',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      requirements: {
        type: 'fitness_sessions',
        target: 8,
        current: 5
      },
      rewards: {
        points: 250,
        badge: 'Fitness Enthusiast'
      },
      isCompleted: false,
      progress: 62
    }
  ];

  // Sample streaks data
  const streaks: StreakData[] = [
    {
      type: 'booking',
      current: 3,
      longest: 6,
      lastActivity: '2024-01-20',
      nextMilestone: 12,
      bonusMultiplier: 1.2
    },
    {
      type: 'referral',
      current: 1,
      longest: 3,
      lastActivity: '2024-01-18',
      nextMilestone: 5,
      bonusMultiplier: 1.5
    },
    {
      type: 'review',
      current: 2,
      longest: 4,
      lastActivity: '2024-01-19',
      nextMilestone: 8,
      bonusMultiplier: 1.3
    }
  ];

  // Calculate statistics
  const totalAchievements = memberAchievements.length;
  const totalPointsFromAchievements = memberAchievements.reduce((sum, ma) => sum + (ma.points_awarded || 0), 0);
  const completedChallenges = challenges.filter(c => c.isCompleted).length;
  const activeStreaks = streaks.filter(s => s.current > 0).length;

  const getAchievementIcon = (category: string) => {
    switch (category) {
      case 'milestone':
        return <Trophy className="h-6 w-6" />;
      case 'streak':
        return <Fire className="h-6 w-6" />;
      case 'engagement':
        return <Heart className="h-6 w-6" />;
      case 'social':
        return <MessageSquare className="h-6 w-6" />;
      case 'learning':
        return <Star className="h-6 w-6" />;
      case 'special':
        return <Sparkles className="h-6 w-6" />;
      default:
        return <Award className="h-6 w-6" />;
    }
  };

  const getChallengeIcon = (category: string) => {
    switch (category) {
      case 'booking':
        return <Calendar className="h-5 w-5" />;
      case 'referral':
        return <Users className="h-5 w-5" />;
      case 'social':
        return <MessageSquare className="h-5 w-5" />;
      case 'wellness':
        return <Heart className="h-5 w-5" />;
      case 'learning':
        return <Star className="h-5 w-5" />;
      default:
        return <Target className="h-5 w-5" />;
    }
  };

  const getChallengeColor = (type: string) => {
    switch (type) {
      case 'monthly':
        return 'bg-blue-50 border-blue-200';
      case 'weekly':
        return 'bg-green-50 border-green-200';
      case 'special':
        return 'bg-purple-50 border-purple-200';
      case 'seasonal':
        return 'bg-amber-50 border-amber-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStreakIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return <Calendar className="h-4 w-4" />;
      case 'referral':
        return <Users className="h-4 w-4" />;
      case 'review':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  const isAchievementUnlocked = (achievementId: string) => {
    return memberAchievements.some(ma => ma.achievement_id === achievementId);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Gamification Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
          <CardContent className="p-4 text-center">
            <Trophy className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-yellow-900">{totalAchievements}</p>
            <p className="text-sm text-yellow-700">Achievements</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-4 text-center">
            <Target className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-900">{completedChallenges}</p>
            <p className="text-sm text-purple-700">Challenges</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4 text-center">
            <Fire className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-900">{activeStreaks}</p>
            <p className="text-sm text-green-700">Active Streaks</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <Star className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-900">{totalPointsFromAchievements}</p>
            <p className="text-sm text-blue-700">Points Earned</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="achievements" className="gap-2">
            <Trophy className="h-4 w-4" />
            Achievements
          </TabsTrigger>
          <TabsTrigger value="challenges" className="gap-2">
            <Target className="h-4 w-4" />
            Challenges
          </TabsTrigger>
          <TabsTrigger value="streaks" className="gap-2">
            <Fire className="h-4 w-4" />
            Streaks
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="gap-2">
            <Award className="h-4 w-4" />
            Leaderboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="achievements" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => {
              const isUnlocked = isAchievementUnlocked(achievement.id);
              const memberAchievement = memberAchievements.find(ma => ma.achievement_id === achievement.id);

              return (
                <Card
                  key={achievement.id}
                  className={cn(
                    'relative overflow-hidden transition-all',
                    isUnlocked
                      ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200'
                      : 'bg-gray-50 border-gray-200 opacity-60'
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'p-3 rounded-full',
                          isUnlocked ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-400'
                        )}
                      >
                        {getAchievementIcon(achievement.achievement_type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{achievement.name}</h3>
                          {isUnlocked && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {achievement.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {achievement.category}
                          </Badge>
                          <span className="text-xs font-medium text-yellow-600">
                            +{achievement.points_awarded} pts
                          </span>
                        </div>
                        {memberAchievement && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Earned {format(new Date(memberAchievement.completed_at), 'MMM d, yyyy')}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  {isUnlocked && (
                    <div className="absolute top-2 right-2">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                    </div>
                  )}
                  {!isUnlocked && (
                    <div className="absolute top-2 right-2">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="challenges" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {challenges.map((challenge) => (
              <Card
                key={challenge.id}
                className={cn(
                  'overflow-hidden',
                  challenge.isCompleted
                    ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
                    : getChallengeColor(challenge.type)
                )}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getChallengeIcon(challenge.category)}
                      <CardTitle className="text-lg">{challenge.title}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="text-xs">
                        {challenge.type}
                      </Badge>
                      {challenge.isCompleted && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {challenge.description}
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progress</span>
                      <span>{challenge.requirements.current}/{challenge.requirements.target}</span>
                    </div>
                    <Progress value={challenge.progress} className="h-2" />
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Ends {format(new Date(challenge.endDate), 'MMM d, yyyy')}
                    </span>
                    <span className="font-medium text-green-600">
                      +{challenge.rewards.points} pts
                    </span>
                  </div>

                  {challenge.rewards.badge && (
                    <div className="flex items-center gap-2 text-xs text-amber-600">
                      <Medal className="h-3 w-3" />
                      <span>{challenge.rewards.badge}</span>
                    </div>
                  )}

                  {challenge.isCompleted && (
                    <div className="text-center p-2 bg-green-100 rounded-lg">
                      <p className="text-sm font-semibold text-green-800">Challenge Completed!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="streaks" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {streaks.map((streak) => (
              <Card key={streak.type} className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-full bg-orange-100 text-orange-600">
                        {getStreakIcon(streak.type)}
                      </div>
                      <div>
                        <h3 className="font-semibold capitalize">{streak.type} Streak</h3>
                        <p className="text-xs text-muted-foreground">
                          Last: {format(new Date(streak.lastActivity), 'MMM d')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-orange-900">{streak.current}</p>
                      <p className="text-xs text-muted-foreground">current</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>Longest streak</span>
                      <span className="font-medium">{streak.longest}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Next milestone</span>
                      <span className="font-medium">{streak.nextMilestone}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Bonus multiplier</span>
                      <span className="font-medium text-green-600">×{streak.bonusMultiplier}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-orange-200">
                    <Progress
                      value={(streak.current / streak.nextMilestone) * 100}
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {streak.nextMilestone - streak.current} to next bonus
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Monthly Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { rank: 1, name: 'Anna K.', points: 2850, tier: 'Diamond', change: 'up' },
                  { rank: 2, name: 'Maria S.', points: 2420, tier: 'Platinum', change: 'up' },
                  { rank: 3, name: 'Ewa D.', points: 2180, tier: 'Gold', change: 'down' },
                  { rank: 4, name: 'You', points: 1920, tier: 'Gold', change: 'up', isCurrentUser: true },
                  { rank: 5, name: 'Katarzyna W.', points: 1850, tier: 'Gold', change: 'same' },
                ].map((entry) => (
                  <div
                    key={entry.rank}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg border',
                      entry.isCurrentUser ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                        {entry.rank}
                      </div>
                      <div>
                        <p className="font-medium">
                          {entry.name}
                          {entry.isCurrentUser && <span className="text-xs text-blue-600"> (You)</span>}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {entry.tier}
                          </Badge>
                          {entry.change === 'up' && <TrendingUp className="h-3 w-3 text-green-600" />}
                          {entry.change === 'down' && <TrendingUp className="h-3 w-3 text-red-600 rotate-180" />}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{entry.points.toLocaleString()}</p>
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