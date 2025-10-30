import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Users, Calendar, DollarSign } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast aria-live="polite" aria-atomic="true"";

const AnalyticsDashboard = () => {
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    totalUsers: 0,
    pendingBookings: 0,
  });
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast aria-live="polite" aria-atomic="true" } = useToast();

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      // Get total bookings
      const { data: bookings, count: bookingsCount } = await supabase
        .from("bookings")
        .select("*", { count: "exact" });

      // Calculate revenue
      const totalRevenue = bookings?.reduce(
        (sum, booking) => sum + (Number(booking.amount_paid) || 0),
        0
      ) || 0;

      // Get pending bookings
      const { count: pendingCount } = await supabase
        .from("bookings")
        .select("*", { count: "exact" })
        .eq("status", "pending");

      // Get total users
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact" });

      setStats({
        totalBookings: bookingsCount || 0,
        totalRevenue,
        totalUsers: usersCount || 0,
        pendingBookings: pendingCount || 0,
      });

      // Monthly bookings for chart
      if (bookings) {
        const monthlyMap = new Map<string, number>();
        bookings.forEach((booking) => {
          const month = new Date(booking.booking_date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
          });
          monthlyMap.set(month, (monthlyMap.get(month) || 0) + 1);
        });

        const chartData = Array.from(monthlyMap.entries())
          .map(([month, count]) => ({ month, bookings: count }))
          .slice(-6);
        
        setMonthlyData(chartData);
      }
    } catch (error) {
      toast aria-live="polite" aria-atomic="true"({
        title: "Error",
        description: "Could not load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-pearl">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="w-8 h-8 text-champagne" />
        <h2 className="text-3xl font-serif text-pearl">Analytics Dashboard</h2>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-charcoal/50 border-graphite/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-pearl/70 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Total Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-pearl">{stats.totalBookings}</div>
          </CardContent>
        </Card>

        <Card className="bg-charcoal/50 border-graphite/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-pearl/70 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-pearl">
              {stats.totalRevenue.toFixed(2)} PLN
            </div>
          </CardContent>
        </Card>

        <Card className="bg-charcoal/50 border-graphite/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-pearl/70 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-pearl">{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card className="bg-charcoal/50 border-graphite/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-pearl/70 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Pending Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-bronze">{stats.pendingBookings}</div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Bookings Chart */}
      <Card className="bg-charcoal/50 border-graphite/30">
        <CardHeader>
          <CardTitle className="text-pearl">Monthly Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#424242" />
                <XAxis dataKey="month" stroke="#F5F1ED" />
                <YAxis stroke="#F5F1ED" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1A1412",
                    border: "1px solid #424242",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="bookings" fill="#D4A574" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-pearl/60 text-center py-8">No booking data yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard;
