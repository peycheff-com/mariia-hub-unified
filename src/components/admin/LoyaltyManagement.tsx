import { useState, useEffect } from "react";
import { Trophy, Star, Gift, Users } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface LoyaltyStats {
  userId: string;
  fullName: string;
  email: string;
  totalBookings: number;
  totalSpent: number;
  tier: string;
}

const LOYALTY_TIERS = {
  bronze: { min: 0, max: 999, name: "Bronze", color: "#CD7F32" },
  silver: { min: 1000, max: 2999, name: "Silver", color: "#C0C0C0" },
  gold: { min: 3000, max: 9999, name: "Gold", color: "#FFD700" },
  platinum: { min: 10000, max: Infinity, name: "Platinum", color: "#E5E4E2" },
};

const LoyaltyManagement = () => {
  const [stats, setStats] = useState<LoyaltyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadLoyaltyStats();
  }, []);

  const loadLoyaltyStats = async () => {
    try {
      // Get all users with their booking stats
      const { data: bookings, error } = await supabase
        .from("bookings")
        .select(`
          user_id,
          amount_paid,
          profiles (
            full_name,
            email
          )
        `)
        .eq("payment_status", "paid");

      if (error) throw error;

      // Aggregate by user
      const userStats = new Map<string, LoyaltyStats>();
      
      bookings?.forEach((booking: any) => {
        const userId = booking.user_id;
        if (!userStats.has(userId)) {
          userStats.set(userId, {
            userId,
            fullName: booking.profiles?.full_name || "Unknown",
            email: booking.profiles?.email || "",
            totalBookings: 0,
            totalSpent: 0,
            tier: "bronze",
          });
        }

        const stats = userStats.get(userId)!;
        stats.totalBookings++;
        stats.totalSpent += Number(booking.amount_paid || 0);
      });

      // Calculate tiers
      const statsArray = Array.from(userStats.values()).map((stat) => {
        if (stat.totalSpent >= LOYALTY_TIERS.platinum.min) stat.tier = "platinum";
        else if (stat.totalSpent >= LOYALTY_TIERS.gold.min) stat.tier = "gold";
        else if (stat.totalSpent >= LOYALTY_TIERS.silver.min) stat.tier = "silver";
        else stat.tier = "bronze";
        return stat;
      });

      // Sort by total spent
      statsArray.sort((a, b) => b.totalSpent - a.totalSpent);
      setStats(statsArray);
    } catch (error: any) {
      toast({
        title: "Error loading loyalty stats",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier: string) => {
    return LOYALTY_TIERS[tier as keyof typeof LOYALTY_TIERS]?.color || "#CD7F32";
  };

  const getTierName = (tier: string) => {
    return LOYALTY_TIERS[tier as keyof typeof LOYALTY_TIERS]?.name || "Bronze";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-pearl">Loading loyalty stats...</div>
      </div>
    );
  }

  const tierCounts = {
    bronze: stats.filter((s) => s.tier === "bronze").length,
    silver: stats.filter((s) => s.tier === "silver").length,
    gold: stats.filter((s) => s.tier === "gold").length,
    platinum: stats.filter((s) => s.tier === "platinum").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="w-8 h-8 text-champagne" />
        <h2 className="text-3xl font-serif text-pearl">VIP Loyalty Program</h2>
      </div>

      {/* Tier Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(LOYALTY_TIERS).map(([key, tier]) => (
          <Card key={key} className="bg-charcoal/50 border-graphite/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-pearl/70">
                {tier.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-pearl">
                  {tierCounts[key as keyof typeof tierCounts]}
                </div>
                <Star
                  className="w-8 h-8"
                  style={{ color: tier.color }}
                  fill={tier.color}
                />
              </div>
              <p className="text-xs text-pearl/60 mt-2">
                {tier.min === 0
                  ? `Up to ${tier.max} PLN`
                  : tier.max === Infinity
                  ? `${tier.min}+ PLN`
                  : `${tier.min} - ${tier.max} PLN`}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Members List */}
      <Card className="bg-charcoal/50 border-graphite/30">
        <CardHeader>
          <CardTitle className="text-pearl flex items-center gap-2">
            <Users className="w-5 h-5" />
            VIP Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.length === 0 ? (
            <p className="text-pearl/60 text-center py-8">No loyalty members yet</p>
          ) : (
            <div className="space-y-3">
              {stats.map((stat) => (
                <div
                  key={stat.userId}
                  className="flex items-center justify-between p-4 bg-cocoa/50 rounded-2xl border border-graphite/20"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-medium text-pearl">{stat.fullName}</p>
                      <Badge
                        style={{
                          backgroundColor: `${getTierColor(stat.tier)}20`,
                          color: getTierColor(stat.tier),
                          borderColor: getTierColor(stat.tier),
                        }}
                        className="border"
                      >
                        <Star
                          className="w-3 h-3 mr-1"
                          fill={getTierColor(stat.tier)}
                        />
                        {getTierName(stat.tier)}
                      </Badge>
                    </div>
                    <p className="text-sm text-pearl/60">{stat.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-pearl">
                      {stat.totalSpent.toFixed(2)} PLN
                    </p>
                    <p className="text-xs text-pearl/60">
                      {stat.totalBookings} bookings
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tier Benefits Info */}
      <Card className="bg-charcoal/50 border-graphite/30">
        <CardHeader>
          <CardTitle className="text-pearl flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Tier Benefits
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="p-4 bg-cocoa/30 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4" style={{ color: LOYALTY_TIERS.bronze.color }} />
                <h4 className="font-medium text-pearl">Bronze</h4>
              </div>
              <p className="text-sm text-pearl/70">Welcome bonus, birthday discount</p>
            </div>
            <div className="p-4 bg-cocoa/30 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4" style={{ color: LOYALTY_TIERS.silver.color }} />
                <h4 className="font-medium text-pearl">Silver</h4>
              </div>
              <p className="text-sm text-pearl/70">10% discount on all services, priority booking</p>
            </div>
            <div className="p-4 bg-cocoa/30 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4" style={{ color: LOYALTY_TIERS.gold.color }} />
                <h4 className="font-medium text-pearl">Gold</h4>
              </div>
              <p className="text-sm text-pearl/70">15% discount, free touch-ups, exclusive events</p>
            </div>
            <div className="p-4 bg-cocoa/30 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4" style={{ color: LOYALTY_TIERS.platinum.color }} />
                <h4 className="font-medium text-pearl">Platinum</h4>
              </div>
              <p className="text-sm text-pearl/70">20% discount, complimentary services, VIP access</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoyaltyManagement;
