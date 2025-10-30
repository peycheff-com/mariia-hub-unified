import React, { useState, useEffect } from 'react';
import {
  Brain,
  Sparkles,
  Target,
  TrendingUp,
  Gift,
  Star,
  Heart,
  Clock,
  Lightbulb,
  Zap,
  Award,
  Users,
  BarChart3,
  Calendar,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useLoyaltyContext } from '@/contexts/LoyaltyContext';
import { useToast } from '@/hooks/use-toast aria-live="polite" aria-atomic="true"';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { Reward, PointsTransaction } from '@/contexts/LoyaltyContext';

interface PersonalizedRewardsEngineProps {
  className?: string;
}

interface Recommendation {
  id: string;
  reward: Reward;
  score: number;
  reasons: string[];
  urgency: 'high' | 'medium' | 'low';
  optimalTiming: string;
  category: 'usage_pattern' | 'seasonal' | 'tier_upgrade' | 'points_optimization' | 'social_proof';
}

interface Insight {
  type: 'points_optimization' | 'tier_progress' | 'engagement' | 'expiration';
  title: string;
  description: string;
  actionText?: string;
  action?: () => void;
  priority: 'high' | 'medium' | 'low';
  impact: number;
}

interface BonusOpportunity {
  id: string;
  title: string;
  description: string;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  timeEstimate: string;
  category: 'review' | 'referral' | 'social' | 'booking' | 'learning';
}

export function PersonalizedRewardsEngine({ className }: PersonalizedRewardsEngineProps) {
  const { state, earnPoints } = useLoyaltyContext();
  const { toast aria-live="polite" aria-atomic="true" } = useToast();

  const [activeTab, setActiveTab] = useState('recommendations');
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [bonusOpportunities, setBonusOpportunities] = useState<BonusOpportunity[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const member = state.member;
  const transactions = state.transactions || [];
  const rewards = state.rewards || [];
  const currentPoints = member?.current_points || 0;
  const memberTier = member?.tier?.level || 1;

  // Generate personalized recommendations based on user behavior
  const generateRecommendations = async () => {
    setIsGenerating(true);

    try {
      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      const userRecommendations: Recommendation[] = [];

      // Analyze user's transaction patterns
      const earningPatterns = analyzeEarningPatterns();
      const redemptionPatterns = analyzeRedemptionPatterns();
      const seasonalTrends = analyzeSeasonalTrends();
      const tierProgression = analyzeTierProgression();

      // Generate recommendations based on patterns
      userRecommendations.push(...generateUsageBasedRecommendations(earningPatterns));
      userRecommendations.push(...generateSeasonalRecommendations(seasonalTrends));
      userRecommendations.push(...generateTierBasedRecommendations(tierProgression));

      // Sort by score and urgency
      userRecommendations.sort((a, b) => {
        const urgencyScore = { high: 3, medium: 2, low: 1 };
        return (b.score + urgencyScore[b.urgency]) - (a.score + urgencyScore[a.urgency]);
      });

      setRecommendations(userRecommendations.slice(0, 6));
    } catch (error) {
      console.error('Error generating recommendations:', error);
      toast aria-live="polite" aria-atomic="true"({
        title: "Error",
        description: "Failed to generate personalized recommendations",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const analyzeEarningPatterns = () => {
    const earningTransactions = transactions.filter(t => t.transaction_type === 'earn');
    const redemptionTransactions = transactions.filter(t => t.transaction_type === 'redeem');

    const recentEarnings = earningTransactions.filter(t =>
      differenceInDays(new Date(), new Date(t.created_at)) <= 30
    );

    const recentRedemptions = redemptionTransactions.filter(t =>
      differenceInDays(new Date(), new Date(t.created_at)) <= 30
    );

    return {
      earningFrequency: recentEarnings.length,
      redemptionFrequency: recentRedemptions.length,
      averageEarning: recentEarnings.length > 0
        ? recentEarnings.reduce((sum, t) => sum + t.points, 0) / recentEarnings.length
        : 0,
      preferredCategories: getPreferredCategories(earningTransactions),
      lastActivity: earningTransactions.length > 0
        ? earningTransactions[0].created_at
        : null
    };
  };

  const analyzeRedemptionPatterns = () => {
    const redemptions = state.redemptions || [];
    const recentRedemptions = redemptions.filter(r =>
      differenceInDays(new Date(), new Date(r.redemption_date)) <= 90
    );

    return {
      redemptionFrequency: recentRedemptions.length,
      preferredRewardTypes: getPreferredRewardTypes(recentRedemptions),
      averagePointsSpent: recentRedemptions.length > 0
        ? recentRedemptions.reduce((sum, r) => sum + r.points_used, 0) / recentRedemptions.length
        : 0,
      redemptionTiming: getRedemptionTiming(recentRedemptions)
    };
  };

  const analyzeSeasonalTrends = () => {
    const currentMonth = new Date().getMonth();
    const currentSeason = currentMonth >= 2 && currentMonth <= 4 ? 'spring' :
                         currentMonth >= 5 && currentMonth <= 7 ? 'summer' :
                         currentMonth >= 8 && currentMonth <= 10 ? 'fall' : 'winter';

    return {
      currentSeason,
      seasonalPreferences: getSeasonalPreferences(currentSeason),
      upcomingEvents: getUpcomingEvents()
    };
  };

  const analyzeTierProgression = () => {
    const tierProgress = state.stats?.tierProgress || 0;
    const pointsToNextTier = state.stats?.pointsToNextTier || 0;

    return {
      currentTier: memberTier,
      tierProgress,
      pointsToNextTier,
      nextTierName: memberTier === 1 ? 'Silver' :
                     memberTier === 2 ? 'Gold' :
                     memberTier === 3 ? 'Platinum' :
                     memberTier === 4 ? 'Diamond' : 'Diamond',
      tierBenefits: getTierBenefits(memberTier)
    };
  };

  const generateUsageBasedRecommendations = (patterns: any) => {
    const recommendations: Recommendation[] = [];

    rewards.forEach(reward => {
      let score = 0;
      const reasons: string[] = [];

      // Score based on user's preferred categories
      if (patterns.preferredCategories.includes(reward.category)) {
        score += 30;
        reasons.push(`Matches your interest in ${reward.category}`);
      }

      // Score based on points availability
      if (currentPoints >= reward.points_cost) {
        score += 25;
        reasons.push('You have enough points to redeem');
      } else if (currentPoints >= reward.points_cost * 0.8) {
        score += 15;
        reasons.push('Almost enough points to redeem');
      }

      // Score based on redemption patterns
      if (patterns.preferredRewardTypes.includes(reward.reward_type)) {
        score += 20;
        reasons.push(`Similar to rewards you've redeemed before`);
      }

      // Score based on value
      const valueScore = (reward.value || 0) / reward.points_cost * 10;
      score += Math.min(valueScore, 25);
      reasons.push('Great value for points');

      if (score > 40) {
        recommendations.push({
          id: `usage-${reward.id}`,
          reward,
          score,
          reasons,
          urgency: currentPoints >= reward.points_cost ? 'high' : 'medium',
          optimalTiming: 'Now',
          category: 'usage_pattern'
        });
      }
    });

    return recommendations;
  };

  const generateSeasonalRecommendations = (trends: any) => {
    const recommendations: Recommendation[] = [];

    rewards.forEach(reward => {
      let score = 0;
      const reasons: string[] = [];

      // Seasonal recommendations
      if (trends.currentSeason === 'spring' && reward.category === 'treatments') {
        score += 35;
        reasons.push('Perfect for spring renewal');
      } else if (trends.currentSeason === 'summer' && reward.category === 'wellness') {
        score += 35;
        reasons.push('Ideal for summer wellness');
      } else if (trends.currentSeason === 'fall' && reward.category === 'products') {
        score += 35;
        reasons.push('Great for fall skincare routine');
      } else if (trends.currentSeason === 'winter' && reward.category === 'experiences') {
        score += 35;
        reasons.push('Perfect winter self-care');
      }

      // Limited time offers
      if (reward.valid_until) {
        const daysUntilExpiry = differenceInDays(new Date(reward.valid_until), new Date());
        if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
          score += 40;
          reasons.push(`Limited time - expires in ${daysUntilExpiry} days`);
        }
      }

      if (score > 30) {
        recommendations.push({
          id: `seasonal-${reward.id}`,
          reward,
          score,
          reasons,
          urgency: score > 60 ? 'high' : 'medium',
          optimalTiming: trends.currentSeason,
          category: 'seasonal'
        });
      }
    });

    return recommendations;
  };

  const generateTierBasedRecommendations = (progress: any) => {
    const recommendations: Recommendation[] = [];

    // Recommend rewards that help maintain or advance tier status
    rewards.forEach(reward => {
      let score = 0;
      const reasons: string[] = [];

      // Tier-appropriate rewards
      if (reward.min_tier_level <= progress.currentTier) {
        score += 20;
        reasons.push(`Available for your ${progress.nextTierName.toLowerCase()} status`);
      }

      // High-value rewards for tier maintenance
      if (reward.points_cost >= 500 && progress.tierProgress < 80) {
        score += 15;
        reasons.push('High-value reward to enjoy your benefits');
      }

      // Rewards that complement tier benefits
      if (progress.currentTier >= 3 && reward.category === 'experiences') {
        score += 25;
        reasons.push('Enhances your VIP experience');
      }

      if (score > 35) {
        recommendations.push({
          id: `tier-${reward.id}`,
          reward,
          score,
          reasons,
          urgency: 'medium',
          optimalTiming: 'This month',
          category: 'tier_upgrade'
        });
      }
    });

    return recommendations;
  };

  // Generate insights
  const generateInsights = () => {
    const userInsights: Insight[] = [];

    // Points optimization insights
    const expiringPoints = state.stats?.expiringPoints || 0;
    if (expiringPoints > 0) {
      userInsights.push({
        type: 'points_optimization',
        title: 'Points Expiring Soon',
        description: `You have ${expiringPoints} points expiring in the next 30 days. Redeem rewards to avoid losing them.`,
        priority: 'high',
        impact: expiringPoints
      });
    }

    // Tier progress insights
    const tierProgress = state.stats?.tierProgress || 0;
    if (tierProgress > 70 && tierProgress < 100) {
      userInsights.push({
        type: 'tier_progress',
        title: 'Almost at Next Tier!',
        description: `You're ${Math.round(tierProgress)}% of the way to the next tier. Keep earning points to unlock new benefits!`,
        priority: 'medium',
        impact: 100
      });
    }

    // Engagement insights
    const lastActivity = transactions.length > 0 ? transactions[0].created_at : null;
    if (lastActivity && differenceInDays(new Date(), new Date(lastActivity)) > 30) {
      userInsights.push({
        type: 'engagement',
        title: 'Time for a Visit',
        description: 'It\'s been over 30 days since your last activity. Book a treatment to keep your momentum going!',
        actionText: 'Book Now',
        priority: 'medium',
        impact: 50
      });
    }

    setInsights(userInsights);
  };

  // Generate bonus opportunities
  const generateBonusOpportunities = () => {
    const opportunities: BonusOpportunity[] = [
      {
        id: 'review',
        title: 'Leave a Review',
        description: 'Share your experience and earn bonus points',
        points: 25,
        difficulty: 'easy',
        timeEstimate: '5 minutes',
        category: 'review'
      },
      {
        id: 'referral',
        title: 'Refer a Friend',
        description: 'Invite friends and earn rewards when they book',
        points: 100,
        difficulty: 'medium',
        timeEstimate: '10 minutes',
        category: 'referral'
      },
      {
        id: 'social',
        title: 'Share on Social Media',
        description: 'Post about your experience and earn social points',
        points: 15,
        difficulty: 'easy',
        timeEstimate: '5 minutes',
        category: 'social'
      },
      {
        id: 'booking',
        title: 'Book a New Service',
        description: 'Try a new service type and earn bonus points',
        points: 50,
        difficulty: 'medium',
        timeEstimate: '30 minutes',
        category: 'booking'
      },
      {
        id: 'learning',
        title: 'Complete Beauty Quiz',
        description: 'Test your knowledge and earn learning points',
        points: 30,
        difficulty: 'easy',
        timeEstimate: '10 minutes',
        category: 'learning'
      }
    ];

    setBonusOpportunities(opportunities);
  };

  // Helper functions
  const getPreferredCategories = (transactions: PointsTransaction[]) => {
    const categories = new Map<string, number>();
    transactions.forEach(t => {
      if (t.reference_type) {
        categories.set(t.reference_type, (categories.get(t.reference_type) || 0) + 1);
      }
    });
    return Array.from(categories.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat]) => cat);
  };

  const getPreferredRewardTypes = (redemptions: any[]) => {
    const types = new Map<string, number>();
    redemptions.forEach(r => {
      if (r.reward) {
        types.set(r.reward.reward_type, (types.get(r.reward.reward_type) || 0) + 1);
      }
    });
    return Array.from(types.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([type]) => type);
  };

  const getRedemptionTiming = (redemptions: any[]) => {
    // Analyze when user typically redeems rewards
    return 'immediate'; // Simplified for now
  };

  const getSeasonalPreferences = (season: string) => {
    // Return seasonal preferences based on user history
    return [];
  };

  const getUpcomingEvents = () => {
    // Return upcoming events that might affect rewards
    return [];
  };

  const getTierBenefits = (tier: number) => {
    // Return benefits for the given tier
    return [];
  };

  // Initialize data
  useEffect(() => {
    generateRecommendations();
    generateInsights();
    generateBonusOpportunities();
  }, [state.rewards, state.transactions, member]);

  const handleClaimBonus = async (opportunity: BonusOpportunity) => {
    try {
      await earnPoints(
        opportunity.points,
        `Bonus: ${opportunity.title}`,
        'bonus',
        'opportunity',
        opportunity.id
      );

      toast aria-live="polite" aria-atomic="true"({
        title: "Bonus Points Earned!",
        description: `You earned ${opportunity.points} bonus points!`,
      });
    } catch (error) {
      toast aria-live="polite" aria-atomic="true"({
        title: "Error",
        description: "Failed to claim bonus points",
        variant: "destructive"
      });
    }
  };

  const getRecommendationColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'border-red-200 bg-red-50';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50';
      case 'low':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white">
            <Brain className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Personalized Rewards Engine</h2>
            <p className="text-muted-foreground">
              AI-powered recommendations tailored to your preferences and behavior
            </p>
          </div>
        </div>
        <Button
          onClick={generateRecommendations}
          disabled={isGenerating}
          className="gap-2"
        >
          {isGenerating ? (
            <>
              <Sparkles className="h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Lightbulb className="h-4 w-4" />
              Refresh Insights
            </>
          )}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="recommendations" className="gap-2">
            <Target className="h-4 w-4" />
            Recommendations
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="opportunities" className="gap-2">
            <Zap className="h-4 w-4" />
            Bonus Points
          </TabsTrigger>
          <TabsTrigger value="optimization" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Optimization
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="space-y-4">
          {recommendations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.map((rec) => (
                <Card
                  key={rec.id}
                  className={cn('overflow-hidden', getRecommendationColor(rec.urgency))}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold">{rec.reward.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {rec.reward.description}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs',
                            rec.urgency === 'high' ? 'border-red-500 text-red-700' :
                            rec.urgency === 'medium' ? 'border-yellow-500 text-yellow-700' :
                            'border-green-500 text-green-700'
                          )}
                        >
                          {rec.urgency} priority
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium">Why it's recommended:</span>
                          <ul className="mt-1 space-y-1">
                            {rec.reasons.slice(0, 2).map((reason, index) => (
                              <li key={index} className="flex items-center gap-2 text-muted-foreground">
                                <CheckCircle className="h-3 w-3" />
                                {reason}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-lg font-bold">{rec.reward.points_cost.toLocaleString()}</span>
                          <span className="text-xs text-muted-foreground">points</span>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Optimal timing:</p>
                          <p className="text-sm font-medium">{rec.optimalTiming}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Recommendations Yet</h3>
                <p className="text-muted-foreground">
                  Complete more activities to receive personalized recommendations
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {insights.length > 0 ? (
            <div className="space-y-4">
              {insights.map((insight, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'p-2 rounded-full',
                        insight.priority === 'high' ? 'bg-red-100 text-red-600' :
                        insight.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-blue-100 text-blue-600'
                      )}>
                        {insight.type === 'points_optimization' && <TrendingUp className="h-4 w-4" />}
                        {insight.type === 'tier_progress' && <Award className="h-4 w-4" />}
                        {insight.type === 'engagement' && <Calendar className="h-4 w-4" />}
                        {insight.type === 'expiration' && <Clock className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{insight.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                        {insight.actionText && (
                          <Button variant="outline" size="sm" onClick={insight.action}>
                            {insight.actionText}
                          </Button>
                        )}
                      </div>
                      <div className="text-right">
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs',
                            insight.priority === 'high' ? 'border-red-500 text-red-700' :
                            insight.priority === 'medium' ? 'border-yellow-500 text-yellow-700' :
                            'border-blue-500 text-blue-700'
                          )}
                        >
                          {insight.priority} impact
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Insights Available</h3>
                <p className="text-muted-foreground">
                  Continue using the program to receive personalized insights
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bonusOpportunities.map((opportunity) => (
              <Card key={opportunity.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{opportunity.title}</h3>
                        <p className="text-sm text-muted-foreground">{opportunity.description}</p>
                      </div>
                      <Badge className={getDifficultyColor(opportunity.difficulty)}>
                        {opportunity.difficulty}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-amber-600" />
                        <span className="text-lg font-bold text-amber-600">+{opportunity.points}</span>
                        <span className="text-xs text-muted-foreground">points</span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">{opportunity.timeEstimate}</p>
                        <Button
                          size="sm"
                          onClick={() => handleClaimBonus(opportunity)}
                          className="mt-1"
                        >
                          Claim Bonus
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Info className="h-3 w-3" />
                      <span>Category: {opportunity.category}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Points Optimization Strategy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Current balance</span>
                    <span className="font-semibold">{currentPoints.toLocaleString()} pts</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Optimal redemption rate</span>
                    <span className="font-semibold text-green-600">85%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Monthly earning potential</span>
                    <span className="font-semibold">{Math.round(currentPoints * 0.3)} pts</span>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Optimization Tips</h4>
                  <ul className="space-y-1 text-sm text-blue-800">
                    <li>• Redeem rewards when you have 20% more points than needed</li>
                    <li>• Save points for high-value limited-time offers</li>
                    <li>• Take advantage of bonus point opportunities</li>
                    <li>• Plan redemptions around tier advancement</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Tier Progress Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Progress to next tier</span>
                      <span className="text-sm font-semibold">{Math.round(state.stats?.tierProgress || 0)}%</span>
                    </div>
                    <Progress value={state.stats?.tierProgress || 0} className="h-2" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Points needed</span>
                    <span className="font-semibold">{state.stats?.pointsToNextTier || 0} pts</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Estimated time</span>
                    <span className="font-semibold">
                      {state.stats?.pointsToNextTier ?
                        Math.ceil((state.stats.pointsToNextTier / 100)) : 0} months
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">Next Tier Benefits</h4>
                  <ul className="space-y-1 text-sm text-green-800">
                    <li>• Enhanced points earning rate</li>
                    <li>• Priority booking access</li>
                    <li>• Exclusive member events</li>
                    <li>• Personalized offers</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}