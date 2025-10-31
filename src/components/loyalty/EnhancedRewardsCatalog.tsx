import React, { useState } from 'react';
import {
  Gift,
  Search,
  Filter,
  Star,
  Clock,
  Calendar,
  Tag,
  Heart,
  ShoppingBag,
  Sparkles,
  Award,
  TrendingUp,
  Zap,
  Info,
  Check,
  AlertCircle,
  Diamond,
  Crown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useLoyaltyContext } from '@/contexts/LoyaltyContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Reward, RewardRedemption } from '@/contexts/LoyaltyContext';

interface RewardsCatalogProps {
  className?: string;
}

interface FilterOptions {
  category: string;
  rewardType: string;
  pointsRange: string;
  availability: string;
}

export function EnhancedRewardsCatalog({ className }: RewardsCatalogProps) {
  const { state, redeemReward } = useLoyaltyContext();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('catalog');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    category: 'all',
    rewardType: 'all',
    pointsRange: 'all',
    availability: 'all'
  });
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [showRedemptionDialog, setShowRedemptionDialog] = useState(false);
  const [redemptionNotes, setRedemptionNotes] = useState('');

  const rewards = state.rewards || [];
  const redemptions = state.redemptions || [];
  const currentPoints = state.member?.current_points || 0;
  const memberTier = state.member?.tier?.level || 1;

  // Filter rewards based on search and filters
  const filteredRewards = rewards.filter(reward => {
    const matchesSearch = reward.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reward.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = filters.category === 'all' || reward.category === filters.category;
    const matchesType = filters.rewardType === 'all' || reward.reward_type === filters.rewardType;
    const matchesAvailability = filters.availability === 'all' ||
      (filters.availability === 'available' && reward.is_active && (!reward.is_limited || (reward.quantity_available || 0) > 0)) ||
      (filters.availability === 'limited' && reward.is_limited) ||
      (filters.availability === 'unlimited' && !reward.is_limited);

    const matchesPointsRange = filters.pointsRange === 'all' ||
      (filters.pointsRange === '0-500' && reward.points_cost <= 500) ||
      (filters.pointsRange === '501-1000' && reward.points_cost > 500 && reward.points_cost <= 1000) ||
      (filters.pointsRange === '1001-2000' && reward.points_cost > 1000 && reward.points_cost <= 2000) ||
      (filters.pointsRange === '2000+' && reward.points_cost > 2000);

    const matchesTier = reward.min_tier_level <= memberTier;

    return matchesSearch && matchesCategory && matchesType && matchesAvailability && matchesPointsRange && matchesTier;
  });

  // Get popular rewards (most redeemed)
  const popularRewards = [...rewards]
    .sort((a, b) => {
      const aRedemptions = redemptions.filter(r => r.reward_id === a.id).length;
      const bRedemptions = redemptions.filter(r => r.reward_id === b.id).length;
      return bRedemptions - aRedemptions;
    })
    .slice(0, 6);

  // Get recently redeemed rewards
  const recentRedemptions = redemptions
    .filter(r => r.status === 'used' || r.status === 'confirmed')
    .slice(0, 5);

  const handleRedeemReward = async (reward: Reward) => {
    if (currentPoints < reward.points_cost) {
      toast({
        title: "Insufficient Points",
        description: `You need ${reward.points_cost - currentPoints} more points to redeem this reward.`,
        variant: "destructive"
      });
      return;
    }

    try {
      const redemption = await redeemReward(reward.id, redemptionNotes);
      if (redemption) {
        toast({
          title: "Reward Redeemed!",
          description: `You've successfully redeemed ${reward.title}. Your redemption code is ${redemption.redemption_code}`,
        });
        setShowRedemptionDialog(false);
        setRedemptionNotes('');
        setSelectedReward(null);
      }
    } catch (error: any) {
      toast({
        title: "Redemption Failed",
        description: error.message || "Failed to redeem reward. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getRewardIcon = (rewardType: string) => {
    switch (rewardType) {
      case 'discount':
        return <Tag className="h-5 w-5" />;
      case 'service':
        return <Heart className="h-5 w-5" />;
      case 'product':
        return <ShoppingBag className="h-5 w-5" />;
      case 'experience':
        return <Sparkles className="h-5 w-5" />;
      case 'gift_card':
        return <Gift className="h-5 w-5" />;
      case 'upgrade':
        return <TrendingUp className="h-5 w-5" />;
      default:
        return <Award className="h-5 w-5" />;
    }
  };

  const getRewardColor = (rewardType: string) => {
    switch (rewardType) {
      case 'discount':
        return 'bg-green-50 border-green-200';
      case 'service':
        return 'bg-pink-50 border-pink-200';
      case 'product':
        return 'bg-blue-50 border-blue-200';
      case 'experience':
        return 'bg-purple-50 border-purple-200';
      case 'gift_card':
        return 'bg-amber-50 border-amber-200';
      case 'upgrade':
        return 'bg-indigo-50 border-indigo-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const canAffordReward = (reward: Reward) => {
    return currentPoints >= reward.points_cost;
  };

  const isRewardAvailable = (reward: Reward) => {
    return reward.is_active && (!reward.is_limited || (reward.quantity_available || 0) > 0);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Catalog Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Rewards Catalog</h2>
          <p className="text-muted-foreground">
            Redeem your points for exclusive treatments, products, and experiences
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Available Points</p>
            <p className="text-2xl font-bold">{currentPoints.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="catalog" className="gap-2">
            <Gift className="h-4 w-4" />
            All Rewards
          </TabsTrigger>
          <TabsTrigger value="popular" className="gap-2">
            <Star className="h-4 w-4" />
            Popular
          </TabsTrigger>
          <TabsTrigger value="my-rewards" className="gap-2">
            <Award className="h-4 w-4" />
            My Rewards
          </TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search rewards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2">
              <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="treatments">Treatments</SelectItem>
                  <SelectItem value="products">Products</SelectItem>
                  <SelectItem value="experiences">Experiences</SelectItem>
                  <SelectItem value="wellness">Wellness</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.rewardType} onValueChange={(value) => setFilters(prev => ({ ...prev, rewardType: value }))}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="discount">Discounts</SelectItem>
                  <SelectItem value="service">Services</SelectItem>
                  <SelectItem value="product">Products</SelectItem>
                  <SelectItem value="experience">Experiences</SelectItem>
                  <SelectItem value="gift_card">Gift Cards</SelectItem>
                  <SelectItem value="upgrade">Upgrades</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.pointsRange} onValueChange={(value) => setFilters(prev => ({ ...prev, pointsRange: value }))}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Points</SelectItem>
                  <SelectItem value="0-500">0-500 pts</SelectItem>
                  <SelectItem value="501-1000">501-1000 pts</SelectItem>
                  <SelectItem value="1001-2000">1001-2000 pts</SelectItem>
                  <SelectItem value="2000+">2000+ pts</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Rewards Grid */}
          {filteredRewards.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRewards.map((reward) => {
                const canAfford = canAffordReward(reward);
                const isAvailable = isRewardAvailable(reward);

                return (
                  <Card
                    key={reward.id}
                    className={cn(
                      'overflow-hidden transition-all hover:shadow-lg',
                      !canAfford && 'opacity-60',
                      !isAvailable && 'opacity-40'
                    )}
                  >
                    {reward.image_url && (
                      <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <Gift className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {getRewardIcon(reward.reward_type)}
                              <h3 className="font-semibold">{reward.title}</h3>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {reward.reward_type}
                            </Badge>
                          </div>
                          {reward.min_tier_level > 1 && (
                            <div className="flex items-center gap-1">
                              {reward.min_tier_level >= 5 && <Diamond className="h-4 w-4 text-blue-600" />}
                              {reward.min_tier_level >= 4 && reward.min_tier_level < 5 && <Crown className="h-4 w-4 text-purple-600" />}
                              {reward.min_tier_level >= 3 && reward.min_tier_level < 4 && <Star className="h-4 w-4 text-yellow-600" />}
                              <span className="text-xs text-muted-foreground">
                                {reward.min_tier_level === 2 ? 'Silver' :
                                 reward.min_tier_level === 3 ? 'Gold' :
                                 reward.min_tier_level === 4 ? 'Platinum' : 'Diamond'}+
                              </span>
                            </div>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {reward.description}
                        </p>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-2xl font-bold">{reward.points_cost.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">points</p>
                          </div>

                          {reward.is_limited && (
                            <div className="text-right">
                              <p className="text-sm font-medium text-orange-600">
                                {reward.quantity_available || 0} left
                              </p>
                              <p className="text-xs text-muted-foreground">Limited</p>
                            </div>
                          )}
                        </div>

                        {reward.valid_until && (
                          <div className="flex items-center gap-2 text-xs text-amber-600">
                            <Clock className="h-3 w-3" />
                            <span>Expires {format(new Date(reward.valid_until), 'MMM d, yyyy')}</span>
                          </div>
                        )}

                        {!canAfford && (
                          <div className="flex items-center gap-2 text-xs text-red-600">
                            <AlertCircle className="h-3 w-3" />
                            <span>Need {reward.points_cost - currentPoints} more points</span>
                          </div>
                        )}

                        {!isAvailable && (
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <AlertCircle className="h-3 w-3" />
                            <span>Currently unavailable</span>
                          </div>
                        )}

                        <Button
                          className="w-full"
                          disabled={!canAfford || !isAvailable}
                          onClick={() => {
                            setSelectedReward(reward);
                            setShowRedemptionDialog(true);
                          }}
                        >
                          {canAfford && isAvailable ? 'Redeem Reward' :
                           !canAfford ? 'Insufficient Points' : 'Unavailable'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Rewards Found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || filters.category !== 'all' || filters.rewardType !== 'all'
                    ? 'Try adjusting your filters or search terms'
                    : 'Check back soon for new rewards!'}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="popular" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {popularRewards.slice(0, 6).map((reward) => (
              <Card key={reward.id} className={cn(getRewardColor(reward.reward_type))}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-white">
                      {getRewardIcon(reward.reward_type)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{reward.title}</h3>
                      <p className="text-sm text-muted-foreground">{reward.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-bold">{reward.points_cost.toLocaleString()} pts</span>
                        <Badge variant="outline">
                          {redemptions.filter(r => r.reward_id === reward.id).length} redeemed
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="my-rewards" className="space-y-4">
          {recentRedemptions.length > 0 ? (
            <div className="space-y-4">
              {recentRedemptions.map((redemption) => (
                <Card key={redemption.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-muted">
                          <Gift className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{redemption.reward?.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            Redeemed {format(new Date(redemption.redemption_date), 'MMM d, yyyy')}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={cn(
                              redemption.status === 'used' ? 'bg-green-100 text-green-800' :
                              redemption.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                              redemption.status === 'expired' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            )}>
                              {redemption.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Code: {redemption.redemption_code}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600">-{redemption.points_used.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">points</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Rewards Yet</h3>
                <p className="text-muted-foreground">Start redeeming rewards to see them here!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Redemption Dialog */}
      <Dialog open={showRedemptionDialog} onOpenChange={setShowRedemptionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redeem Reward</DialogTitle>
          </DialogHeader>
          {selectedReward && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">{selectedReward.title}</h3>
                <p className="text-sm text-muted-foreground mb-2">{selectedReward.description}</p>
                <div className="flex items-center justify-between">
                  <span className="font-bold">{selectedReward.points_cost.toLocaleString()} points</span>
                  <span className="text-sm text-muted-foreground">
                    You'll have {currentPoints - selectedReward.points_cost} points left
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium" htmlFor="additional-notes-optional">Additional Notes (Optional)</label>
                <textarea
                  placeholder="Any special requests or preferences..."
                  value={redemptionNotes}
                  onChange={(e) => setRedemptionNotes(e.target.value)}
                  className="mt-1 w-full p-2 border rounded-md"
                  rows={3}
                />
              </div>

              {selectedReward.terms_conditions && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <h4 className="font-semibold text-amber-900 mb-1">Terms & Conditions</h4>
                  <p className="text-sm text-amber-800">{selectedReward.terms_conditions}</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowRedemptionDialog(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={() => handleRedeemReward(selectedReward)} className="flex-1">
                  Confirm Redemption
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}