import React, { useState } from 'react';
import { Gift, Coins, Clock, Tag, ShoppingCart, Star, Zap, Crown, Ticket } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useLoyalty, Reward } from '@/hooks/useLoyalty';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface RewardsCatalogProps {
  className?: string;
}

export function RewardsCatalog({ className }: RewardsCatalogProps) {
  const {
    rewardsCatalog,
    customerRewards,
    customerLoyalty,
    redeemReward,
    isLoadingRewards,
    isLoadingCustomerRewards
  } = useLoyalty();

  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Group rewards by category
  const categories = rewardsCatalog
    ? Array.from(new Set(rewardsCatalog.map(r => r.category))).sort()
    : [];

  const filteredRewards = rewardsCatalog?.filter(r =>
    selectedCategory === 'all' || r.category === selectedCategory
  ) || [];

  const redeemedRewardIds = new Set(customerRewards?.map(cr => cr.reward_id) || []);

  const handleRedeemReward = async (reward: Reward) => {
    if (!customerLoyalty || customerLoyalty.current_points < reward.points_cost) {
      toast.error('Insufficient points');
      return;
    }

    setIsRedeeming(true);
    try {
      await redeemReward(reward.id, reward.points_cost);
      setSelectedReward(null);
      toast.success('Reward redeemed successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to redeem reward');
    } finally {
      setIsRedeeming(false);
    }
  };

  const getRewardIcon = (category: string) => {
    const icons: Record<string, React.ReactNode> = {
      discount: <Tag className="h-5 w-5" />,
      service: <Gift className="h-5 w-5" />,
      privilege: <Crown className="h-5 w-5" />,
      upgrade: <Zap className="h-5 w-5" />,
      product: <ShoppingCart className="h-5 w-5" />
    };
    return icons[category] || <Gift className="h-5 w-5" />;
  };

  const formatDiscount = (reward: Reward) => {
    if (!reward.discount_value) return '';
    return reward.discount_type === 'percentage'
      ? `${reward.discount_value}% OFF`
      : `${reward.discount_value} PLN OFF`;
  };

  const getRemainingUses = (reward: Reward) => {
    if (!reward.max_uses) return null;
    return reward.max_uses - reward.current_uses;
  };

  const isLimitedTime = (reward: Reward) => {
    if (!reward.available_from && !reward.available_until) return false;
    const now = new Date();
    if (reward.available_from && new Date(reward.available_from) > now) return true;
    if (reward.available_until && new Date(reward.available_until) < now) return true;
    return reward.is_limited;
  };

  if (isLoadingRewards || isLoadingCustomerRewards) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-pink-900">
          <Gift className="h-6 w-6" />
          Rewards Catalog
          {customerLoyalty && (
            <Badge variant="secondary" className="ml-2">
              {customerLoyalty.current_points.toLocaleString()} pts
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 mb-6">
            <TabsTrigger value="all" className="text-xs">
              All Rewards
            </TabsTrigger>
            {categories.slice(0, 5).map(category => (
              <TabsTrigger key={category} value={category} className="text-xs capitalize">
                {category}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRewards.map((reward) => {
                const isRedeemed = redeemedRewardIds.has(reward.id);
                const canAfford = customerLoyalty && customerLoyalty.current_points >= reward.points_cost;
                const remainingUses = getRemainingUses(reward);
                const isExpired = reward.available_until && new Date(reward.available_until) < new Date();
                const isNotYetAvailable = reward.available_from && new Date(reward.available_from) > new Date();

                return (
                  <Card
                    key={reward.id}
                    className={cn(
                      'relative overflow-hidden transition-all duration-300 hover:scale-105',
                      isRedeemed
                        ? 'bg-gray-50 border-gray-200 opacity-60'
                        : isExpired || isNotYetAvailable
                        ? 'bg-red-50 border-red-200 opacity-60'
                        : 'bg-white border-pink-200 shadow-md hover:shadow-lg'
                    )}
                  >
                    {/* Reward Header */}
                    <div className="p-4 pb-2">
                      <div className="flex items-start justify-between mb-3">
                        <div
                          className="p-2 rounded-lg text-white"
                          style={{ backgroundColor: '#ec4899' }}
                        >
                          {getRewardIcon(reward.category)}
                        </div>
                        <div className="flex flex-col gap-1">
                          {isLimitedTime(reward) && (
                            <Badge variant="destructive" className="text-xs">
                              Limited Time
                            </Badge>
                          )}
                          {isRedeemed && (
                            <Badge variant="secondary" className="text-xs">
                              Redeemed
                            </Badge>
                          )}
                        </div>
                      </div>

                      <h3 className="font-semibold text-pink-900 mb-1">{reward.name}</h3>
                      <p className="text-sm text-pink-700 mb-3 line-clamp-2">
                        {reward.description}
                      </p>

                      {/* Discount Display */}
                      {reward.discount_value && (
                        <div className="bg-gradient-to-r from-pink-100 to-rose-100 rounded-lg p-3 mb-3">
                          <div className="text-2xl font-bold text-pink-900">
                            {formatDiscount(reward)}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Reward Footer */}
                    <div className="px-4 pb-4 space-y-3">
                      {/* Points Cost */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Coins className="h-4 w-4 text-amber-600" />
                          <span className="font-bold text-pink-900">
                            {reward.points_cost.toLocaleString()}
                          </span>
                          <span className="text-xs text-pink-600">points</span>
                        </div>
                        {!canAfford && !isRedeemed && (
                          <span className="text-xs text-red-600">
                            Need {(reward.points_cost - (customerLoyalty?.current_points || 0)).toLocaleString()} more
                          </span>
                        )}
                      </div>

                      {/* Availability Info */}
                      {remainingUses !== null && (
                        <div className="text-xs text-pink-600">
                          {remainingUses} of {reward.max_uses} remaining
                        </div>
                      )}

                      {reward.available_until && (
                        <div className="flex items-center gap-1 text-xs text-pink-600">
                          <Clock className="h-3 w-3" />
                          Expires {new Date(reward.available_until).toLocaleDateString()}
                        </div>
                      )}

                      {/* Action Button */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            className="w-full"
                            disabled={isRedeemed || isExpired || isNotYetAvailable || !canAfford}
                            variant={isRedeemed ? 'secondary' : 'default'}
                            onClick={() => setSelectedReward(reward)}
                          >
                            {isRedeemed
                              ? 'Redeemed'
                              : isExpired
                              ? 'Expired'
                              : isNotYetAvailable
                              ? 'Not Available'
                              : !canAfford
                              ? 'Insufficient Points'
                              : 'Redeem Reward'}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Gift className="h-5 w-5" />
                              Redeem Reward
                            </DialogTitle>
                          </DialogHeader>
                          {selectedReward && (
                            <div className="space-y-4">
                              <div className="bg-gradient-to-r from-pink-100 to-rose-100 rounded-lg p-4">
                                <h3 className="font-semibold text-pink-900 mb-2">
                                  {selectedReward.name}
                                </h3>
                                <p className="text-sm text-pink-700 mb-3">
                                  {selectedReward.description}
                                </p>
                                {selectedReward.discount_value && (
                                  <div className="text-xl font-bold text-pink-900">
                                    {formatDiscount(selectedReward)}
                                  </div>
                                )}
                              </div>

                              {selectedReward.terms && (
                                <Alert>
                                  <AlertDescription className="text-xs">
                                    <strong>Terms:</strong> {selectedReward.terms}
                                  </AlertDescription>
                                </Alert>
                              )}

                              <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
                                <span className="font-medium text-pink-900">Cost:</span>
                                <div className="flex items-center gap-1">
                                  <Coins className="h-4 w-4 text-amber-600" />
                                  <span className="font-bold text-pink-900">
                                    {selectedReward.points_cost.toLocaleString()} points
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                <span className="font-medium text-green-900">Your Balance:</span>
                                <div className="flex items-center gap-1">
                                  <Coins className="h-4 w-4 text-amber-600" />
                                  <span className="font-bold text-green-900">
                                    {customerLoyalty?.current_points.toLocaleString() || 0} points
                                  </span>
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  className="flex-1"
                                  onClick={() => setSelectedReward(null)}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
                                  onClick={() => handleRedeemReward(selectedReward)}
                                  disabled={isRedeeming || !canAfford}
                                >
                                  {isRedeeming ? 'Redeeming...' : 'Confirm Redemption'}
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>

                    {/* Special Badges */}
                    {isLimitedTime(reward) && !isRedeemed && (
                      <div className="absolute top-2 right-2">
                        <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                          Limited
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>

            {filteredRewards.length === 0 && (
              <div className="text-center py-12">
                <Gift className="h-12 w-12 text-pink-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-pink-900 mb-2">
                  No rewards available
                </h3>
                <p className="text-sm text-pink-700">
                  Check back soon for new rewards and special offers!
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* My Redeemed Rewards */}
        {customerRewards && customerRewards.length > 0 && (
          <div className="mt-8 space-y-4">
            <h3 className="font-semibold text-pink-900">My Redeemed Rewards</h3>
            <div className="space-y-2">
              {customerRewards.slice(0, 5).map((customerReward) => (
                <div
                  key={customerReward.id}
                  className="flex items-center justify-between p-3 bg-white/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Ticket className="h-5 w-5 text-pink-600" />
                    <div>
                      <p className="font-medium text-pink-900">
                        {customerReward.reward.name}
                      </p>
                      <p className="text-xs text-pink-700">
                        Code: {customerReward.redemption_code}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={customerReward.status === 'active' ? 'default' : 'secondary'}
                      className={cn(
                        'text-xs',
                        customerReward.status === 'active'
                          ? 'bg-green-100 text-green-900'
                          : 'bg-gray-100 text-gray-900'
                      )}
                    >
                      {customerReward.status}
                    </Badge>
                    {customerReward.expires_at && (
                      <p className="text-xs text-pink-600 mt-1">
                        Expires {new Date(customerReward.expires_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}