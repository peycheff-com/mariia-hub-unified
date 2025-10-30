/**
 * Loyalty Program Management Component
 * Multi-tier loyalty system with points, rewards, and tier progression
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Award,
  Crown,
  Diamond,
  Gem,
  Gift,
  Star,
  TrendingUp,
  Users,
  Coins,
  Calendar,
  Target,
  Zap,
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  Settings
} from 'lucide-react';

import { crmService } from '@/services/crm.service';
import { format, addDays, differenceInDays } from 'date-fns';
import { pl } from 'date-fns/locale';

interface LoyaltyProgramManagerProps {
  clientId?: string;
  viewMode?: 'full' | 'compact';
}

interface LoyaltyProgram {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  points_to_currency_rate: number;
  tier_requirements: Record<string, any>;
  tier_benefits: Record<string, any>;
  booking_points_multiplier: number;
  review_points: number;
  referral_points: number;
  birthday_points: number;
  anniversary_points: number;
  milestone_rewards: Record<string, any>;
}

interface ClientLoyalty {
  id: string;
  client_id: string;
  current_tier: string;
  current_points: number;
  lifetime_points: number;
  tier_progress_points: number;
  tier_upgrade_date?: string;
  current_tier_start_date?: string;
  previous_tier?: string;
  total_bookings: number;
  total_revenue: number;
  average_booking_value: number;
  days_since_last_booking: number;
  points_expiring_next_month: number;
  next_points_expiry?: string;
  is_anniversary_month: boolean;
  is_birthday_month: boolean;
}

interface LoyaltyReward {
  id: string;
  program_id: string;
  name: string;
  description: string;
  reward_type: string;
  points_cost: number;
  monetary_value: number;
  minimum_tier: string;
  required_bookings: number;
  max_redemptions_per_client: number;
  is_active: boolean;
  discount_percentage?: number;
  discount_amount?: number;
  total_quantity?: number;
  remaining_quantity?: number;
  terms_conditions?: string;
  image_url?: string;
}

interface LoyaltyTransaction {
  id: string;
  client_loyalty_id: string;
  booking_id?: string;
  transaction_type: string;
  points_change: number;
  points_balance_after: number;
  reason: string;
  reference_type?: string;
  reference_id?: string;
  description?: string;
  expires_at?: string;
  is_expired: boolean;
  created_at: string;
  created_by?: string;
}

const TIER_ICONS = {
  bronze: <Gem className="w-5 h-5" />,
  silver: <Award className="w-5 h-5" />,
  gold: <Crown className="w-5 h-5" />,
  platinum: <Diamond className="w-5 h-5" />
};

const TIER_COLORS = {
  bronze: 'bg-amber-100 text-amber-800 border-amber-200',
  silver: 'bg-gray-100 text-gray-800 border-gray-200',
  gold: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  platinum: 'bg-purple-100 text-purple-800 border-purple-200'
};

const REWARD_TYPES = {
  discount: 'Discount',
  free_service: 'Free Service',
  product: 'Product',
  upgrade: 'Upgrade',
  experience: 'Experience'
};

export const LoyaltyProgramManager: React.FC<LoyaltyProgramManagerProps> = ({
  clientId,
  viewMode = 'full'
}) => {
  const [loyaltyProgram, setLoyaltyProgram] = useState<LoyaltyProgram | null>(null);
  const [clientLoyalty, setClientLoyalty] = useState<ClientLoyalty | null>(null);
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Dialog states
  const [showRewardDialog, setShowRewardDialog] = useState(false);
  const [showPointsDialog, setShowPointsDialog] = useState(false);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [selectedReward, setSelectedReward] = useState<LoyaltyReward | null>(null);

  // Form states
  const [pointsAwardForm, setPointsAwardForm] = useState({
    points: 0,
    reason: '',
    reference_type: 'manual'
  });

  useEffect(() => {
    if (clientId) {
      loadLoyaltyData();
    }
  }, [clientId]);

  const loadLoyaltyData = async () => {
    try {
      setLoading(true);

      if (clientId) {
        const [loyaltyData, rewardsData, transactionsData] = await Promise.all([
          crmService.getClientLoyalty(clientId),
          loadRewards(),
          loadTransactions(clientId)
        ]);

        setClientLoyalty(loyaltyData);
        setRewards(rewardsData);
        setTransactions(transactionsData);
      }
    } catch (error) {
      console.error('Error loading loyalty data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRewards = async (): Promise<LoyaltyReward[]> => {
    try {
      // This would be implemented in crmService
      // For now, return mock data
      return [
        {
          id: '1',
          program_id: '1',
          name: '10% Discount',
          description: 'Get 10% off your next service',
          reward_type: 'discount',
          points_cost: 100,
          monetary_value: 50,
          minimum_tier: 'bronze',
          required_bookings: 0,
          max_redemptions_per_client: 2,
          is_active: true,
          discount_percentage: 10
        },
        {
          id: '2',
          program_id: '1',
          name: 'Free Facial Treatment',
          description: 'Complimentary 60-minute facial treatment',
          reward_type: 'free_service',
          points_cost: 500,
          monetary_value: 200,
          minimum_tier: 'silver',
          required_bookings: 3,
          max_redemptions_per_client: 1,
          is_active: true
        }
      ];
    } catch (error) {
      console.error('Error loading rewards:', error);
      return [];
    }
  };

  const loadTransactions = async (clientId: string): Promise<LoyaltyTransaction[]> => {
    try {
      const transactionsData = await crmService.getLoyaltyTransactions(clientId, 50);
      return transactionsData;
    } catch (error) {
      console.error('Error loading transactions:', error);
      return [];
    }
  };

  const handleAwardPoints = async () => {
    if (!clientId || !pointsAwardForm.reason || pointsAwardForm.points <= 0) return;

    try {
      await crmService.awardPoints(
        clientId,
        pointsAwardForm.points,
        pointsAwardForm.reason,
        pointsAwardForm.reference_type
      );

      // Reload data
      await loadLoyaltyData();

      // Reset form
      setPointsAwardForm({ points: 0, reason: '', reference_type: 'manual' });
      setShowPointsDialog(false);
    } catch (error) {
      console.error('Error awarding points:', error);
    }
  };

  const getTierProgress = (clientLoyalty: ClientLoyalty): number => {
    if (!loyaltyProgram) return 0;

    const tierThresholds = loyaltyProgram.tier_requirements;
    const currentTier = clientLoyalty.current_tier;
    const currentThreshold = tierThresholds[currentTier]?.points || 0;

    const tiers = ['bronze', 'silver', 'gold', 'platinum'];
    const currentIndex = tiers.indexOf(currentTier);

    if (currentIndex >= tiers.length - 1) return 100;

    const nextTier = tiers[currentIndex + 1];
    const nextThreshold = tierThresholds[nextTier]?.points || 0;

    if (nextThreshold <= currentThreshold) return 100;

    const progress = ((clientLoyalty.current_points - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  const getNextTierRequirements = (clientLoyalty: ClientLoyalty): { tier: string; pointsNeeded: number } | null => {
    if (!loyaltyProgram) return null;

    const tierThresholds = loyaltyProgram.tier_requirements;
    const currentTier = clientLoyalty.current_tier;

    const tiers = ['bronze', 'silver', 'gold', 'platinum'];
    const currentIndex = tiers.indexOf(currentTier);

    if (currentIndex >= tiers.length - 1) return null;

    const nextTier = tiers[currentIndex + 1];
    const nextThreshold = tierThresholds[nextTier]?.points || 0;

    return {
      tier: nextTier,
      pointsNeeded: Math.max(0, nextThreshold - clientLoyalty.current_points)
    };
  };

  const formatPoints = (points: number): string => {
    return points.toLocaleString('pl-PL');
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(amount);
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Client Loyalty Overview */}
      {clientLoyalty && (
        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center text-2xl">
                  {TIER_ICONS[clientLoyalty.current_tier as keyof typeof TIER_ICONS]}
                  <span className="ml-2 capitalize">{clientLoyalty.current_tier} Member</span>
                </CardTitle>
                <CardDescription className="mt-2">
                  Customer since {clientLoyalty.current_tier_start_date
                    ? format(new Date(clientLoyalty.current_tier_start_date), 'MMMM yyyy', { locale: pl })
                    : 'Unknown'
                  }
                </CardDescription>
              </div>

              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowPointsDialog(true)}
                >
                  <Coins className="w-4 h-4 mr-2" />
                  Award Points
                </Button>

                <Dialog open={showRewardDialog} onOpenChange={setShowRewardDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Gift className="w-4 h-4 mr-2" />
                      Redeem Rewards
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Available Rewards</DialogTitle>
                      <DialogDescription>
                        Redeem your points for exclusive rewards and benefits
                      </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 mt-4">
                      {rewards
                        .filter(reward => reward.is_active && clientLoyalty.current_points >= reward.points_cost)
                        .map(reward => (
                          <Card key={reward.id} className="cursor-pointer hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                                    <Gift className="w-6 h-6 text-purple-600" />
                                  </div>
                                  <div>
                                    <h3 className="font-semibold">{reward.name}</h3>
                                    <p className="text-sm text-muted-foreground">{reward.description}</p>
                                    <div className="flex items-center space-x-2 mt-1">
                                      <Badge variant="outline">{REWARD_TYPES[reward.reward_type as keyof typeof REWARD_TYPES]}</Badge>
                                      {reward.minimum_tier !== 'bronze' && (
                                        <Badge variant="secondary" className={TIER_COLORS[reward.minimum_tier as keyof typeof TIER_COLORS]}>
                                          {reward.minimum_tier}+
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="text-right">
                                  <p className="text-2xl font-bold text-purple-600">{formatPoints(reward.points_cost)}</p>
                                      <p className="text-sm text-muted-foreground">points</p>
                                      {reward.monetary_value > 0 && (
                                        <p className="text-sm text-green-600">Value: {formatCurrency(reward.monetary_value)}</p>
                                      )}
                                      <Button
                                        size="sm"
                                        className="mt-2"
                                        onClick={() => {
                                          // Handle reward redemption
                                          setSelectedReward(reward);
                                          setShowRewardDialog(false);
                                        }}
                                      >
                                        Redeem
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </DialogContent>
                      </Dialog>

                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <Coins className="w-4 h-4 text-yellow-600" />
                          <span className="font-medium">{formatPoints(clientLoyalty.current_points)} points</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="w-4 h-4 text-green-600" />
                          <span>{formatPoints(clientLoyalty.lifetime_points)} lifetime</span>
                        </div>
                        {clientLoyalty.points_expiring_next_month > 0 && (
                          <div className="flex items-center space-x-2 text-orange-600">
                            <AlertCircle className="w-4 h-4" />
                            <span>{formatPoints(clientLoyalty.points_expiring_next_month)} expiring next month</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              )}

              <CardContent className="pb-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Current Tier Progress */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Tier Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>Current Points</span>
                            <span className="font-medium">{formatPoints(clientLoyalty.current_points)}</span>
                          </div>
                          <Progress value={getTierProgress(clientLoyalty)} className="h-3" />
                          <p className="text-xs text-muted-foreground mt-1">
                            {getTierProgress(clientLoyalty)}% to next tier
                          </p>
                        </div>

                        {getNextTierRequirements(clientLoyalty) && (
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <p className="text-sm font-medium text-blue-800">
                              Next: {getNextTierRequirements(clientLoyalty)!.tier}
                            </p>
                            <p className="text-xs text-blue-600 mt-1">
                              {formatPoints(getNextTierRequirements(clientLoyalty)!.pointsNeeded)} more points needed
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Stats */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Member Stats</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Total Bookings</span>
                          <span className="font-medium">{clientLoyalty.total_bookings}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Total Revenue</span>
                          <span className="font-medium">{formatCurrency(clientLoyalty.total_revenue)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Avg. Booking Value</span>
                          <span className="font-medium">{formatCurrency(clientLoyalty.average_booking_value)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Days Since Last Visit</span>
                          <span className="font-medium">{clientLoyalty.days_since_last_booking}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Special Bonuses */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Special Bonuses</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Birthday Month</span>
                          <Badge variant={clientLoyalty.is_birthday_month ? "default" : "secondary"}>
                            {clientLoyalty.is_birthday_month ? 'Active' : 'Not Active'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Anniversary Month</span>
                          <Badge variant={clientLoyalty.is_anniversary_month ? "default" : "secondary"}>
                            {clientLoyalty.is_anniversary_month ? 'Active' : 'Not Active'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Points Expiring</span>
                          <span className="text-sm font-medium text-orange-600">
                            {clientLoyalty.next_points_expiry
                              ? format(new Date(clientLoyalty.next_points_expiry), 'MMM d', { locale: pl })
                              : 'None'
                            }
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detailed Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="rewards">Rewards</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="benefits">Benefits</TabsTrigger>
            </TabsList>

            {/* Rewards Tab */}
            <TabsContent value="rewards" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <Gift className="w-5 h-5 mr-2" />
                      Available Rewards
                    </CardTitle>
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Reward
                    </Button>
                  </div>
                  <CardDescription>
                    Rewards that can be redeemed with loyalty points
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {rewards.map(reward => (
                      <Card key={reward.id} className={`${!reward.is_active ? 'opacity-50' : ''}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                                <Gift className="w-6 h-6 text-purple-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold">{reward.name}</h3>
                                <p className="text-sm text-muted-foreground">{reward.description}</p>
                                <div className="flex items-center space-x-2 mt-1">
                                  <Badge variant="outline">
                                    {REWARD_TYPES[reward.reward_type as keyof typeof REWARD_TYPES]}
                                  </Badge>
                                  {reward.minimum_tier !== 'bronze' && (
                                    <Badge variant="secondary" className={TIER_COLORS[reward.minimum_tier as keyof typeof TIER_COLORS]}>
                                      {reward.minimum_tier}+
                                    </Badge>
                                  )}
                                  {reward.required_bookings > 0 && (
                                    <Badge variant="outline">
                                      {reward.required_bookings}+ bookings
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <p className="text-2xl font-bold text-purple-600">
                                {formatPoints(reward.points_cost)}
                              </p>
                              <p className="text-sm text-muted-foreground">points</p>
                              {reward.monetary_value > 0 && (
                                <p className="text-sm text-green-600">
                                  Value: {formatCurrency(reward.monetary_value)}
                                </p>
                              )}
                              <div className="flex items-center space-x-2 mt-2">
                                {clientLoyalty && clientLoyalty.current_points >= reward.points_cost ? (
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setSelectedReward(reward);
                                      // Handle reward redemption
                                    }}
                                  >
                                    Redeem
                                  </Button>
                                ) : (
                                  <Badge variant="outline" className="text-orange-600">
                                    {formatPoints(Math.max(0, reward.points_cost - (clientLoyalty?.current_points || 0)))} points needed
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          {reward.terms_conditions && (
                            <div className="mt-4 pt-4 border-t">
                              <p className="text-xs text-muted-foreground">
                                <strong>Terms:</strong> {reward.terms_conditions}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Transactions Tab */}
            <TabsContent value="transactions" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="w-5 h-5 mr-2" />
                    Points History
                  </CardTitle>
                  <CardDescription>
                    Recent points transactions and activity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Points</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map(transaction => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            {format(new Date(transaction.created_at), 'MMM d, yyyy', { locale: pl })}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={transaction.transaction_type === 'earned' ? 'default' : 'secondary'}
                            >
                              {transaction.transaction_type}
                            </Badge>
                          </TableCell>
                          <TableCell>{transaction.reason}</TableCell>
                          <TableCell className={`text-right font-medium ${
                            transaction.points_change > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.points_change > 0 ? '+' : ''}{formatPoints(transaction.points_change)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatPoints(transaction.points_balance_after)}
                          </TableCell>
                          <TableCell>
                            {transaction.is_expired ? (
                              <Badge variant="destructive">Expired</Badge>
                            ) : transaction.expires_at && new Date(transaction.expires_at) < new Date() ? (
                              <Badge variant="outline">Expiring Soon</Badge>
                            ) : (
                              <Badge variant="secondary">Active</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {transactions.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Coins className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No transactions yet</p>
                      <p className="text-sm">Start earning points with bookings and activities</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Benefits Tab */}
            <TabsContent value="benefits" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Crown className="w-5 h-5 mr-2" />
                    Tier Benefits
                  </CardTitle>
                  <CardDescription>
                    Exclusive benefits and privileges for each loyalty tier
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {['bronze', 'silver', 'gold', 'platinum'].map(tier => {
                      const tierBenefits = loyaltyProgram?.tier_benefits[tier];
                      const isCurrentTier = clientLoyalty?.current_tier === tier;

                      return (
                        <Card
                          key={tier}
                          className={`${
                            isCurrentTier ? 'ring-2 ring-primary border-primary' : ''
                          }`}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-center mb-2">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                isCurrentTier ? 'bg-primary text-primary-foreground' : 'bg-muted'
                              }`}>
                                {TIER_ICONS[tier as keyof typeof TIER_ICONS]}
                              </div>
                            </div>
                            <CardTitle className="text-center capitalize">{tier}</CardTitle>
                            {isCurrentTier && (
                              <Badge variant="secondary" className="w-fit mx-auto">
                                Current Tier
                              </Badge>
                            )}
                          </CardHeader>
                          <CardContent>
                            {tierBenefits ? (
                              <ul className="space-y-2 text-sm">
                                {tierBenefits.map((benefit: string, index: number) => (
                                  <li key={index} className="flex items-start">
                                    <CheckCircle className="w-4 h-4 mr-2 text-green-500 mt-0.5 flex-shrink-0" />
                                    {benefit}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-muted-foreground text-center">
                                No benefits defined
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Award Points Dialog */}
          <Dialog open={showPointsDialog} onOpenChange={setShowPointsDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Award Loyalty Points</DialogTitle>
                <DialogDescription>
                  Manually award points to this client for special occasions or exceptional service
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="points">Points Amount</Label>
                  <Input
                    id="points"
                    type="number"
                    value={pointsAwardForm.points}
                    onChange={(e) => setPointsAwardForm(prev => ({ ...prev, points: parseInt(e.target.value) || 0 }))}
                    placeholder="Enter points amount"
                    min="1"
                  />
                </div>

                <div>
                  <Label htmlFor="reason">Reason</Label>
                  <Textarea
                    id="reason"
                    value={pointsAwardForm.reason}
                    onChange={(e) => setPointsAwardForm(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Why are these points being awarded?"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="reference_type">Reference Type</Label>
                  <Select
                    value={pointsAwardForm.reference_type}
                    onValueChange={(value) => setPointsAwardForm(prev => ({ ...prev, reference_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual Award</SelectItem>
                      <SelectItem value="birthday">Birthday Bonus</SelectItem>
                      <SelectItem value="anniversary">Anniversary Bonus</SelectItem>
                      <SelectItem value="compensation">Service Compensation</SelectItem>
                      <SelectItem value="referral">Referral Reward</SelectItem>
                      <SelectItem value="review">Review Bonus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowPointsDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAwardPoints}
                  disabled={!pointsAwardForm.reason || pointsAwardForm.points <= 0}
                >
                  Award Points
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      );
    };

    export default LoyaltyProgramManager;