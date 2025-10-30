import React, { useState, useEffect } from 'react';
import { Sparkles, Trophy, Gift, Star, Info, CheckCircle, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';

import { useLoyaltyContext } from '@/contexts/LoyaltyContext';
import { useToast } from '@/components/ui/use-toast aria-live="polite" aria-atomic="true"';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface Service {
  id: string;
  title: string;
  price_from?: number;
  duration_minutes?: number;
  service_type?: string;
}

interface LoyaltyBookingIntegrationProps {
  service: Service;
  date: Date;
  time: string;
  totalPrice: number;
  memberTier?: string;
  onPointsApplied?: (pointsUsed: number, discountAmount: number) => void;
  onRewardApplied?: (rewardId: string, discountAmount: number) => void;
  className?: string;
}

export const LoyaltyBookingIntegration: React.FC<LoyaltyBookingIntegrationProps> = ({
  service,
  date,
  time,
  totalPrice,
  memberTier,
  onPointsApplied,
  onRewardApplied,
  className
}) => {
  const { t } = useTranslation();
  const { state, actions } = useLoyaltyContext();
  const { toast aria-live="polite" aria-atomic="true" } = useToast();

  const [activeTab, setActiveTab] = useState('points');
  const [pointsToUse, setPointsToUse] = useState(0);
  const [selectedReward, setSelectedReward] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [estimatedPoints, setEstimatedPoints] = useState(0);

  const member = state.member;
  const stats = state.stats;
  const availablePoints = stats?.availablePoints || 0;
  const maxPointsRedemption = Math.floor(totalPrice * 100); // Max 100% with points (100 points = 1 PLN)

  // Calculate estimated points from this booking
  useEffect(() => {
    const basePoints = Math.floor(totalPrice * 10); // 10 points per PLN
    const tierMultiplier = member?.tier?.points_multiplier || 1;
    const serviceBonus = service.service_type === 'beauty' ? 20 : 15; // Service type bonus
    const totalPoints = Math.floor((basePoints + serviceBonus) * tierMultiplier);
    setEstimatedPoints(totalPoints);
  }, [totalPrice, service.service_type, member?.tier]);

  // Available member rewards for this service
  const eligibleRewards = state.rewards.filter(reward => {
    if (!member?.tier) return false;

    // Check tier eligibility
    const tierIndex = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'].indexOf(member.tier.name);
    const requiredTierIndex = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'].indexOf(reward.required_tier);

    if (tierIndex < requiredTierIndex) return false;

    // Check if reward is applicable to this service type
    if (reward.applicable_services && reward.applicable_services.length > 0) {
      return reward.applicable_services.includes(service.service_type || '');
    }

    // Check if reward is active and not expired
    const now = new Date();
    return reward.is_active && (!reward.expires_at || new Date(reward.expires_at) > now);
  });

  const handlePointsRedemption = async () => {
    if (pointsToUse <= 0 || pointsToUse > availablePoints) return;

    setLoading(true);
    try {
      const discountAmount = pointsToUse / 100; // 100 points = 1 PLN

      // Call loyalty service to redeem points
      await actions.redeemPoints(pointsToUse, {
        reference_type: 'booking_discount',
        reference_id: service.id,
        description: `Points redeemed for ${service.title} booking`
      });

      onPointsApplied?.(pointsToUse, discountAmount);

      toast aria-live="polite" aria-atomic="true"({
        title: 'Points applied successfully!',
        description: `${pointsToUse.toLocaleString()} points redeemed for ${discountAmount.toFixed(2)} PLN discount`,
      });

      setPointsToUse(0);
    } catch (error) {
      console.error('Failed to redeem points:', error);
      toast aria-live="polite" aria-atomic="true"({
        title: 'Failed to redeem points',
        description: 'Please try again or contact support.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRewardRedemption = async (rewardId: string) => {
    if (!selectedReward) return;

    setLoading(true);
    try {
      const reward = eligibleRewards.find(r => r.id === rewardId);
      if (!reward) throw new Error('Reward not found');

      // Apply reward discount
      await actions.redeemReward(rewardId, {
        booking_id: service.id,
        service_id: service.id,
        notes: `Applied to ${service.title} booking`
      });

      onRewardApplied?.(rewardId, reward.discount_value || 0);

      toast aria-live="polite" aria-atomic="true"({
        title: 'Reward applied successfully!',
        description: `${reward.name} - ${reward.description}`,
      });

      setSelectedReward(null);
    } catch (error) {
      console.error('Failed to redeem reward:', error);
      toast aria-live="polite" aria-atomic="true"({
        title: 'Failed to apply reward',
        description: 'Please try again or contact support.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getProgressToNextTier = () => {
    if (!member || !stats) return 0;

    const currentTierIndex = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'].indexOf(member.tier.name);
    if (currentTierIndex >= 4) return 100; // Diamond is max tier

    const nextTierThresholds = [0, 1000, 2500, 5000, 10000]; // Points needed for each tier
    const currentThreshold = nextTierThresholds[currentTierIndex];
    const nextThreshold = nextTierThresholds[currentTierIndex + 1];

    const progress = ((stats.lifetimePoints - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  const getNextTierPoints = () => {
    if (!member || !stats) return 0;

    const currentTierIndex = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'].indexOf(member.tier.name);
    if (currentTierIndex >= 4) return 0;

    const nextTierThresholds = [0, 1000, 2500, 5000, 10000];
    const nextThreshold = nextTierThresholds[currentTierIndex + 1];

    return Math.max(0, nextThreshold - stats.lifetimePoints);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Loyalty Status Header */}
      {member && (
        <Card className="bg-gradient-to-br from-champagne/10 to-bronze/10 border-champagne/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="h-5 w-5 text-champagne" />
              Your Loyalty Benefits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Tier Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge
                  className="px-3 py-1 text-white font-semibold"
                  style={{ backgroundColor: member.tier.color_code || '#CD7F32' }}
                >
                  {member.tier.name} Member
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {availablePoints.toLocaleString()} points available
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">Earn from this booking</p>
                <p className="text-lg font-bold text-champagne">+{estimatedPoints.toLocaleString()}</p>
              </div>
            </div>

            {/* Progress to Next Tier */}
            {member.tier.name !== 'Diamond' && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress to {(['Silver', 'Gold', 'Platinum', 'Diamond'][['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'].indexOf(member.tier.name)])}</span>
                  <span>{getNextTierPoints().toLocaleString()} points to go</span>
                </div>
                <Progress value={getProgressToNextTier()} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="points" className="gap-2">
            <Star className="h-4 w-4" />
            Use Points
          </TabsTrigger>
          <TabsTrigger value="rewards" className="gap-2">
            <Gift className="h-4 w-4" />
            Use Rewards
          </TabsTrigger>
        </TabsList>

        {/* Points Redemption */}
        <TabsContent value="points" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-champagne" />
                Redeem Points for Discount
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Available Points</span>
                  <span className="font-semibold">{availablePoints.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Maximum for this booking</span>
                  <span className="font-semibold">{maxPointsRedemption.toLocaleString()} points</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Exchange Rate</span>
                  <span className="font-semibold">100 points = 1 PLN</span>
                </div>
              </div>

              {availablePoints > 0 && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="points-to-redeem">Points to redeem:</label>
                    <input
                      type="range"
                      min="0"
                      max={Math.min(availablePoints, maxPointsRedemption)}
                      step="100"
                      value={pointsToUse}
                      onChange={(e) => setPointsToUse(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0</span>
                      <span className="font-semibold text-champagne">
                        {pointsToUse.toLocaleString()} points = {(pointsToUse / 100).toFixed(2)} PLN
                      </span>
                      <span>{Math.min(availablePoints, maxPointsRedemption).toLocaleString()}</span>
                    </div>
                  </div>

                  <Button
                    onClick={handlePointsRedemption}
                    disabled={pointsToUse <= 0 || loading}
                    className="w-full"
                  >
                    {loading ? 'Applying...' : `Apply ${(pointsToUse / 100).toFixed(2)} PLN Discount`}
                  </Button>
                </div>
              )}

              {availablePoints === 0 && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    You don't have enough points to redeem. Complete this booking to earn {estimatedPoints.toLocaleString()} points!
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rewards Redemption */}
        <TabsContent value="rewards" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-champagne" />
                Available Rewards
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {eligibleRewards.length > 0 ? (
                <div className="space-y-3">
                  {eligibleRewards.map((reward) => (
                    <div
                      key={reward.id}
                      className={cn(
                        "p-4 rounded-lg border-2 cursor-pointer transition-all",
                        selectedReward === reward.id
                          ? "border-champagne bg-champagne/5"
                          : "border-border hover:border-champagne/50"
                      )}
                      onClick={() => setSelectedReward(reward.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="font-medium">{reward.name}</h4>
                          <p className="text-sm text-muted-foreground">{reward.description}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {reward.type === 'percentage'
                                ? `${reward.discount_value}% OFF`
                                : `${reward.discount_value} PLN OFF`
                              }
                            </Badge>
                            {reward.points_cost > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {reward.points_cost} points
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {selectedReward === reward.id && (
                            <CheckCircle className="h-5 w-5 text-champagne" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {selectedReward && (
                    <Button
                      onClick={() => handleRewardRedemption(selectedReward)}
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? 'Applying...' : 'Apply Selected Reward'}
                    </Button>
                  )}
                </div>
              ) : (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    No rewards available for this service. Keep booking to unlock more rewards!
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Booking Benefits Info */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-medium text-blue-900">Booking Benefits</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Earn {estimatedPoints.toLocaleString()} points from this booking</li>
                <li>• Points multiplier: {member?.tier?.points_multiplier || 1}x ({member?.tier?.name} tier)</li>
                <li>• Contributes to tier progress and VIP benefits</li>
                <li>• Access to exclusive member rewards and experiences</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoyaltyBookingIntegration;