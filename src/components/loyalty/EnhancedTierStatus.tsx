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

export function EnhancedTierStatus({ className, showAllTiers = true }: TierStatusProps) {
  const { state } = useLoyaltyContext();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [showBenefits, setShowBenefits] = useState(false);

  const currentTier = state.member?.tier;
  const currentTierConfig = currentTier ? tierConfigs[currentTier.name] : tierConfigs.Bronze;
  const tierProgress = state.stats?.tierProgress || 0;
  const pointsToNextTier = state.stats?.pointsToNextTier || 0;

  const getNextTier = () => {
    if (!currentTier) return tierConfigs.Silver;

    const nextTierName = Object.keys(tierConfigs).find(
      (name) => tierConfigs[name].level === currentTier.level + 1
    );

    return nextTierName ? tierConfigs[nextTierName] : null;
  };

  const nextTier = getNextTier();

  return (
    <Card className={cn('overflow-hidden', currentTierConfig.bgColor, currentTierConfig.borderColor, className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="p-3 rounded-full text-white"
              style={{ backgroundColor: currentTierConfig.color }}
            >
              {currentTierConfig.icon}
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                {currentTier?.name || 'Bronze'} Member
                <Badge
                  variant="secondary"
                  className="ml-2"
                  style={{ backgroundColor: currentTierConfig.color, color: 'white' }}
                >
                  Level {currentTier?.level || 1}
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {currentTierConfig.description}
              </p>
            </div>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Info className="h-4 w-4" />
                View All Tiers
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Loyalty Program Tiers</DialogTitle>
              </DialogHeader>
              <AllTiersComparison currentLevel={currentTier?.level || 1} />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress to Next Tier */}
        {nextTier && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-sm">Progress to {nextTier.name}</h4>
                <p className="text-xs text-muted-foreground">
                  {pointsToNextTier.toLocaleString()} points to next tier
                </p>
              </div>
              <Badge variant="outline" className="text-xs">
                {Math.round(tierProgress)}%
              </Badge>
            </div>
            <Progress value={tierProgress} className="h-3" />

            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {state.stats?.totalSpend?.toLocaleString() || 0} PLN
                </p>
                <p className="text-xs text-muted-foreground">Total Spend</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {state.stats?.totalVisits || 0}
                </p>
                <p className="text-xs text-muted-foreground">Total Visits</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {state.stats?.lifetimePoints?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-muted-foreground">Lifetime Points</p>
              </div>
            </div>
          </div>
        )}

        {/* Current Tier Benefits */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Current Benefits</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBenefits(!showBenefits)}
              className="text-xs"
            >
              {showBenefits ? 'Hide' : 'Show'} All
            </Button>
          </div>

          <div className={cn('space-y-2', !showBenefits && 'max-h-32 overflow-hidden')}>
            {currentTierConfig.benefits.slice(0, showBenefits ? undefined : 3).map((benefit, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* VIP Status Indicator */}
        {currentTier && currentTier.level >= 3 && (
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center gap-3">
              <Crown className="h-6 w-6 text-purple-600" />
              <div>
                <h4 className="font-semibold text-purple-900">VIP Status</h4>
                <p className="text-sm text-purple-700">
                  You enjoy exclusive VIP benefits and priority service
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Diamond Tier Special Features */}
        {currentTier && currentTier.level === 5 && (
          <div className="bg-gradient-to-r from-blue-100 to-cyan-100 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-blue-600" />
              <div>
                <h4 className="font-semibold text-blue-900">Diamond Elite</h4>
                <p className="text-sm text-blue-700">
                  Ultimate luxury with personal concierge and custom experiences
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AllTiersComparison({ currentLevel }: { currentLevel: number }) {
  const [activeTab, setActiveTab] = useState('overview');

  const allTiers = Object.values(tierConfigs);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="comparison">Detailed Comparison</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4">
        <div className="grid gap-4">
          {allTiers.map((tier) => {
            const isCurrent = tier.level === currentLevel;
            const isAchieved = tier.level <= currentLevel;

            return (
              <Card
                key={tier.name}
                className={cn(
                  'relative overflow-hidden transition-all',
                  isCurrent && 'ring-2 ring-primary',
                  isAchieved ? tier.bgColor : 'opacity-60'
                )}
              >
                <CardContent className="p-4">
                  {isCurrent && (
                    <Badge className="absolute top-2 right-2 bg-primary">
                      Current
                    </Badge>
                  )}

                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        'p-3 rounded-full text-white',
                        isAchieved ? '' : 'opacity-50'
                      )}
                      style={{ backgroundColor: tier.color }}
                    >
                      {tier.icon}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{tier.name}</h3>
                        {isAchieved && (
                          <Check className="h-4 w-4 text-green-600" />
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground mb-3">
                        {tier.description}
                      </p>

                      <div className="space-y-2">
                        <p className="text-xs font-semibold">Requirements:</p>
                        <div className="grid grid-cols-3 gap-4 text-xs">
                          <div>
                            <span className="font-medium">Spend:</span>{' '}
                            {tier.requirements.minSpend} PLN
                          </div>
                          <div>
                            <span className="font-medium">Visits:</span>{' '}
                            {tier.requirements.minVisits}
                          </div>
                          <div>
                            <span className="font-medium">Points:</span>{' '}
                            {tier.requirements.minPoints}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </TabsContent>

      <TabsContent value="comparison" className="space-y-4">
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-semibold">Benefits</th>
                {allTiers.map((tier) => (
                  <th key={tier.name} className="text-center p-3 font-semibold">
                    {tier.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Extract all unique benefits from all tiers */}
              {Array.from(
                new Set(allTiers.flatMap((tier) => tier.benefits))
              ).map((benefit, index) => (
                <tr key={index} className="border-t">
                  <td className="p-3 text-sm">{benefit}</td>
                  {allTiers.map((tier) => (
                    <td key={tier.name} className="p-3 text-center">
                      {tier.benefits.includes(benefit) ? (
                        <Check
                          className={cn(
                            'h-4 w-4 mx-auto',
                            tier.level <= currentLevel
                              ? 'text-green-600'
                              : 'text-gray-400'
                          )}
                        />
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}

              {/* Point Multipliers Row */}
              <tr className="border-t bg-muted/30">
                <td className="p-3 font-semibold">Points Multiplier</td>
                {allTiers.map((tier) => (
                  <td key={tier.name} className="p-3 text-center font-semibold">
                    {tier.level}x
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </TabsContent>
    </Tabs>
  );
}