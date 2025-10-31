import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  Star,
  Activity,
  Download,
  RefreshCw,
  AlertCircle,
  BarChart3,
  PieChart,
  LineChart,
  Funnel,
  User,
  MapPin,
  Clock,
  Target
} from 'lucide-react';
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { RevenueChart } from '@/components/admin/analytics/RevenueChart';
import { BookingFunnel } from '@/components/admin/analytics/BookingFunnel';
import { ServicePopularity } from '@/components/admin/analytics/ServicePopularity';
import { ClientDemographics } from '@/components/admin/analytics/ClientDemographics';
import { ProviderPerformance } from '@/components/admin/analytics/ProviderPerformance';
import { TimeAnalysis } from '@/components/admin/analytics/TimeAnalysis';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface KPICard {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'champagne' | 'green' | 'red' | 'blue';
}

interface DateRange {
  from: Date;
  to: Date;
}

export default function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [kpis, setKpis] = useState<KPICard[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<number>(60000); // 1 minute
  const { toast } = useToast();

  useEffect(() => {
    fetchKPIData();
  }, [dateRange]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchKPIData();
      }, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, dateRange]);

  const fetchKPIData = async () => {
    setLoading(true);
    try {
      // Get previous period data for comparison
      const previousDateRange = {
        from: subDays(dateRange.from, (dateRange.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)),
        to: dateRange.from,
      };

      // Fetch current period data
      const [
        { count: currentBookings },
        { count: currentUsers },
        bookingsData,
        servicesData,
        profilesData
      ] = await Promise.all([
        supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .gte('booking_date', dateRange.from.toISOString())
          .lte('booking_date', dateRange.to.toISOString())
          .in('status', ['confirmed', 'completed']),
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', dateRange.from.toISOString())
          .lte('created_at', dateRange.to.toISOString()),
        supabase
          .from('bookings')
          .select('total_amount, status, booking_date')
          .gte('booking_date', dateRange.from.toISOString())
          .lte('booking_date', dateRange.to.toISOString())
          .in('status', ['confirmed', 'completed']),
        supabase
          .from('services')
          .select('price, id'),
        supabase
          .from('profiles')
          .select('city')
      ]);

      // Fetch previous period data
      const [{ count: previousBookings }] = await Promise.all([
        supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .gte('booking_date', previousDateRange.from.toISOString())
          .lte('booking_date', previousDateRange.to.toISOString())
          .in('status', ['confirmed', 'completed']),
      ]);

      // Calculate metrics
      const currentRevenue = bookingsData?.reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0) || 0;
      const averageBookingValue = (bookingsData?.length || 0) > 0 ? currentRevenue / (bookingsData?.length || 0) : 0;

      // Calculate top location
      const locationMap = new Map<string, number>();
      profilesData?.forEach(profile => {
        if (profile.city) {
          locationMap.set(profile.city, (locationMap.get(profile.city) || 0) + 1);
        }
      });
      const topLocation = Array.from(locationMap.entries())
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

      // Calculate conversion rate (bookings / total views - simulated)
      const totalViews = 10000; // Placeholder - would come from analytics
      const conversionRate = totalViews > 0 ? ((currentBookings || 0) / totalViews) * 100 : 0;

      const newKpis: KPICard[] = [
        {
          title: 'Total Revenue',
          value: `$${currentRevenue.toFixed(2)}`,
          change: 12.5, // Placeholder
          changeLabel: 'vs last period',
          icon: DollarSign,
          color: 'champagne',
        },
        {
          title: 'Total Bookings',
          value: currentBookings?.toLocaleString() || 0,
          change: previousBookings && currentBookings ? ((currentBookings - previousBookings) / previousBookings) * 100 : 0,
          changeLabel: 'vs last period',
          icon: Calendar,
          color: 'green',
        },
        {
          title: 'New Clients',
          value: currentUsers?.toLocaleString() || 0,
          change: 8.2, // Placeholder
          changeLabel: 'vs last period',
          icon: Users,
          color: 'blue',
        },
        {
          title: 'Conversion Rate',
          value: `${conversionRate.toFixed(1)}%`,
          change: -2.4, // Placeholder
          changeLabel: 'vs last period',
          icon: Target,
          color: 'champagne',
        },
        {
          title: 'Avg Booking Value',
          value: `$${averageBookingValue.toFixed(2)}`,
          change: 5.1, // Placeholder
          changeLabel: 'vs last period',
          icon: TrendingUp,
          color: 'green',
        },
        {
          title: 'Top Location',
          value: topLocation,
          icon: MapPin,
          color: 'blue',
        },
        {
          title: 'Active Services',
          value: servicesData?.length || 0,
          icon: Star,
          color: 'champagne',
        },
        {
          title: 'Completion Rate',
          value: '94.2%', // Placeholder
          change: 1.3, // Placeholder
          changeLabel: 'vs last period',
          icon: Activity,
          color: 'green',
        },
      ];

      setKpis(newKpis);
    } catch (error) {
      console.error('Error fetching KPI data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch KPI data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (range) {
      setDateRange(range);
    }
  };

  const handleQuickDateRange = (preset: string) => {
    const now = new Date();
    let range: DateRange;

    switch (preset) {
      case 'today':
        range = {
          from: startOfDay(now),
          to: endOfDay(now),
        };
        break;
      case 'yesterday':
        const yesterday = subDays(now, 1);
        range = {
          from: startOfDay(yesterday),
          to: endOfDay(yesterday),
        };
        break;
      case '7days':
        range = {
          from: subDays(now, 7),
          to: now,
        };
        break;
      case '30days':
        range = {
          from: subDays(now, 30),
          to: now,
        };
        break;
      case 'thisMonth':
        range = {
          from: startOfMonth(now),
          to: endOfMonth(now),
        };
        break;
      case 'lastMonth':
        const lastMonth = subMonths(now, 1);
        range = {
          from: startOfMonth(lastMonth),
          to: endOfMonth(lastMonth),
        };
        break;
      default:
        return;
    }

    setDateRange(range);
  };

  const exportAllData = async () => {
    try {
      // In a real implementation, this would generate a comprehensive report
      const reportData = {
        dateRange: {
          from: format(dateRange.from, 'yyyy-MM-dd'),
          to: format(dateRange.to, 'yyyy-MM-dd'),
        },
        kpis: kpis,
        exportedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-report-${format(dateRange.from, 'yyyy-MM-dd')}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: 'Analytics data exported successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export data',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-charcoal p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-serif text-pearl">Analytics Dashboard</h1>
            <p className="text-champagne/70 mt-2">
              Comprehensive insights into your business performance
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`border-graphite/50 hover:bg-champagne/10 ${
                autoRefresh ? 'bg-champagne/20' : ''
              }`}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              Auto-refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportAllData}
              className="border-graphite/50 hover:bg-champagne/10"
            >
              <Download className="w-4 h-4 mr-2" />
              Export All
            </Button>
          </div>
        </div>

        {/* Date Range Selector */}
        <Card className="bg-charcoal/50 border-graphite/30">
          <CardHeader>
            <CardTitle className="text-pearl">Date Range</CardTitle>
            <CardDescription className="text-champagne/70">
              Select the period for analytics data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4">
              <DateRangePicker
                value={dateRange}
                onChange={handleDateRangeChange}
                className="bg-charcoal border-graphite/50"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickDateRange('today')}
                  className="border-graphite/50 hover:bg-champagne/10"
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickDateRange('7days')}
                  className="border-graphite/50 hover:bg-champagne/10"
                >
                  Last 7 days
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickDateRange('30days')}
                  className="border-graphite/50 hover:bg-champagne/10"
                >
                  Last 30 days
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickDateRange('thisMonth')}
                  className="border-graphite/50 hover:bg-champagne/10"
                >
                  This month
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, index) => (
            <Card key={index} className="bg-charcoal/50 border-graphite/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <kpi.icon className={`w-5 h-5 text-${kpi.color}`} />
                  {kpi.change !== undefined && (
                    <Badge
                      variant={kpi.change > 0 ? 'default' : 'secondary'}
                      className={`${
                        kpi.change > 0
                          ? 'bg-green-500/20 text-green-500 border-green-500/50'
                          : 'bg-red-500/20 text-red-500 border-red-500/50'
                      }`}
                    >
                      {kpi.change > 0 ? (
                        <TrendingUp className="w-3 h-3 mr-1" />
                      ) : (
                        <TrendingDown className="w-3 h-3 mr-1" />
                      )}
                      {Math.abs(kpi).toFixed(1)}%
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-pearl">{kpi.value}</p>
                <p className="text-champagne/70 text-sm">{kpi.title}</p>
                {kpi.changeLabel && (
                  <p className="text-champagne/50 text-xs mt-1">{kpi.changeLabel}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Analytics Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-charcoal/50 border-graphite/30">
            <TabsTrigger value="overview" className="data-[state=active]:bg-champagne/20">
              Overview
            </TabsTrigger>
            <TabsTrigger value="revenue" className="data-[state=active]:bg-champagne/20">
              <DollarSign className="w-4 h-4 mr-2" />
              Revenue
            </TabsTrigger>
            <TabsTrigger value="funnel" className="data-[state=active]:bg-champagne/20">
              <Funnel className="w-4 h-4 mr-2" />
              Funnel
            </TabsTrigger>
            <TabsTrigger value="services" className="data-[state=active]:bg-champagne/20">
              <Star className="w-4 h-4 mr-2" />
              Services
            </TabsTrigger>
            <TabsTrigger value="clients" className="data-[state=active]:bg-champagne/20">
              <User className="w-4 h-4 mr-2" />
              Clients
            </TabsTrigger>
            <TabsTrigger value="time" className="data-[state=active]:bg-champagne/20">
              <Clock className="w-4 h-4 mr-2" />
              Time
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RevenueChart dateRange={dateRange} onDateRangeChange={setDateRange} />
              <BookingFunnel dateRange={dateRange} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TimeAnalysis dateRange={dateRange} />
              <ServicePopularity dateRange={dateRange} />
            </div>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            <RevenueChart dateRange={dateRange} onDateRangeChange={setDateRange} />
          </TabsContent>

          <TabsContent value="funnel" className="space-y-6">
            <BookingFunnel dateRange={dateRange} />
          </TabsContent>

          <TabsContent value="services" className="space-y-6">
            <ServicePopularity dateRange={dateRange} />
            <ProviderPerformance dateRange={dateRange} />
          </TabsContent>

          <TabsContent value="clients" className="space-y-6">
            <ClientDemographics dateRange={dateRange} />
          </TabsContent>

          <TabsContent value="time" className="space-y-6">
            <TimeAnalysis dateRange={dateRange} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}