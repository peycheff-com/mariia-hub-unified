import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Crown, Star, Gift, Users, Trophy, TrendingUp, Calendar } from 'lucide-react';

import { useLoyaltyContext } from '@/contexts/LoyaltyContext';
import { EnhancedLoyaltyDashboard } from '@/components/loyalty/EnhancedLoyaltyDashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/PageHeader';

const LoyaltyDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, actions } = useLoyaltyContext();

  useEffect(() => {
    // Load loyalty data when page mounts
    if (!state.member && !state.loading) {
      actions.loadMemberData();
    }
  }, [state.member, state.loading, actions]);

  const handleBack = () => {
    navigate(-1);
  };

  if (state.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="lg:hidden"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Skeleton className="h-8 w-48" />
          </div>

          {/* Loading Skeleton */}
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-8 w-8 mx-auto mb-2" />
                    <Skeleton className="h-6 w-16 mx-auto" />
                    <Skeleton className="h-4 w-20 mx-auto mt-1" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50">
      <PageHeader
        title={
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 text-white">
              <Crown className="h-6 w-6" />
            </div>
            <span>Loyalty Rewards</span>
          </div>
        }
        subtitle="Earn points, unlock exclusive benefits, and enjoy the VIP experience"
        className="mb-8"
      />

      <EnhancedLoyaltyDashboard />
    </div>
  );
};

export default LoyaltyDashboardPage;