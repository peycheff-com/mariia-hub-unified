import React, { useState, useEffect } from 'react';
import { Star, Users, DollarSign, Calendar, Clock, TrendingUp, Search, Download, Award, Target } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ScatterChart, Scatter } from 'recharts';
import { format, subDays } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast aria-live="polite" aria-atomic="true"';

interface ProviderData {
  id: string;
  name: string;
  email: string;
  totalBookings: number;
  completedBookings: number;
  revenue: number;
  averageRating: number;
  totalReviews: number;
  averageSessionDuration: number;
  utilizationRate: number;
  onTimeRate: number;
  cancellationRate: number;
  monthlyTrend: { month: string; bookings: number }[];
}

interface ProviderPerformanceProps {
  dateRange: { from: Date; to: Date };
}

export function ProviderPerformance({ dateRange }: ProviderPerformanceProps) {
  const [providerData, setProviderData] = useState<ProviderData[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'bookings' | 'revenue' | 'rating' | 'utilization'>('bookings');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const { toast aria-live="polite" aria-atomic="true" } = useToast();

  useEffect(() => {
    fetchProviderData();
  }, [dateRange, sortBy]);

  const fetchProviderData = async () => {
    setLoading(true);
    try {
      // Get provider profiles
      const { data: providers, error: providersError } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          role
        `)
        .eq('role', 'provider');

      if (providersError) throw providersError;

      // Get bookings for each provider
      const providerMap = new Map<string, ProviderData>();

      for (const provider of providers || []) {
        const { data: bookings, error: bookingsError } = await supabase
          .from('bookings')
          .select(`
            id,
            provider_id,
            total_amount,
            booking_date,
            start_time,
            end_time,
            status,
            reviews!inner(rating, created_at),
            availability_slots!inner(start_time, end_time)
          `)
          .eq('provider_id', provider.id)
          .gte('booking_date', dateRange.from.toISOString())
          .lte('booking_date', dateRange.to.toISOString())
          .in('status', ['confirmed', 'completed', 'cancelled']);

        if (bookingsError) continue;

        const completedBookings = bookings?.filter(b => b.status === 'completed') || [];
        const cancelledBookings = bookings?.filter(b => b.status === 'cancelled') || [];

        // Calculate metrics
        const totalBookings = bookings?.length || 0;
        const revenue = completedBookings.reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0);

        // Calculate average rating
        const ratings = bookings?.flatMap(b => b.reviews?.map(r => r.rating) || []) || [];
        const averageRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;

        // Calculate average session duration
        const durations = completedBookings
          .filter(b => b.start_time && b.end_time)
          .map(b => {
            const start = new Date(`${b.booking_date}T${b.start_time}`);
            const end = new Date(`${b.booking_date}T${b.end_time}`);
            return (end.getTime() - start.getTime()) / (1000 * 60); // minutes
          });
        const averageSessionDuration = durations.length > 0 ? durations.reduce((sum, d) => sum + d, 0) / durations.length : 0;

        // Calculate utilization rate (simplified - based on available slots vs booked)
        const totalSlots = bookings?.flatMap(b => b.availability_slots || []).length || 0;
        const utilizationRate = totalSlots > 0 ? (completedBookings.length / totalSlots) * 100 : 0;

        // Calculate on-time rate (simplified - assumes all completed are on-time)
        const onTimeRate = completedBookings.length > 0 ? 95 : 0; // Placeholder

        // Calculate cancellation rate
        const cancellationRate = totalBookings > 0 ? (cancelledBookings.length / totalBookings) * 100 : 0;

        // Get monthly trend
        const monthlyTrend = await getMonthlyTrend(provider.id);

        providerMap.set(provider.id, {
          id: provider.id,
          name: provider.full_name || provider.email,
          email: provider.email,
          totalBookings,
          completedBookings: completedBookings.length,
          revenue,
          averageRating,
          totalReviews: ratings.length,
          averageSessionDuration,
          utilizationRate,
          onTimeRate,
          cancellationRate,
          monthlyTrend,
        });
      }

      // Convert to array and sort
      let dataArray = Array.from(providerMap.values());

      // Filter by search term
      if (searchTerm) {
        dataArray = dataArray.filter(p =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Sort data
      dataArray.sort((a, b) => {
        switch (sortBy) {
          case 'revenue':
            return b.revenue - a.revenue;
          case 'rating':
            return b.averageRating - a.averageRating;
          case 'utilization':
            return b.utilizationRate - a.utilizationRate;
          default:
            return b.totalBookings - a.totalBookings;
        }
      });

      setProviderData(dataArray);
    } catch (error) {
      console.error('Error fetching provider data:', error);
      toast aria-live="polite" aria-atomic="true"({
        title: 'Error',
        description: 'Failed to fetch provider performance data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getMonthlyTrend = async (providerId: string) => {
    try {
      const { data: monthlyBookings } = await supabase
        .from('bookings')
        .select('booking_date, status')
        .eq('provider_id', providerId)
        .gte('booking_date', subDays(dateRange.from, 365).toISOString())
        .lte('booking_date', dateRange.to.toISOString())
        .in('status', ['confirmed', 'completed']);

      if (!monthlyBookings) return [];

      const monthlyMap = new Map<string, number>();

      monthlyBookings.forEach(booking => {
        const month = format(new Date(booking.booking_date), 'MMM yyyy');
        monthlyMap.set(month, (monthlyMap.get(month) || 0) + 1);
      });

      return Array.from(monthlyMap.entries())
        .map(([month, bookings]) => ({ month, bookings }))
        .slice(-6); // Last 6 months
    } catch (error) {
      console.error('Error fetching monthly trend:', error);
      return [];
    }
  };

  const exportToCSV = () => {
    const csv = [
      [
        'Provider',
        'Email',
        'Total Bookings',
        'Completed Bookings',
        'Revenue',
        'Avg Rating',
        'Total Reviews',
        'Avg Session (min)',
        'Utilization Rate (%)',
        'On-Time Rate (%)',
        'Cancellation Rate (%)'
      ],
      ...providerData.map(provider => [
        provider.name,
        provider.email,
        provider.totalBookings.toString(),
        provider.completedBookings.toString(),
        provider.revenue.toFixed(2),
        provider.averageRating.toFixed(1),
        provider.totalReviews.toString(),
        provider.averageSessionDuration.toFixed(0),
        provider.utilizationRate.toFixed(1),
        provider.onTimeRate.toFixed(1),
        provider.cancellationRate.toFixed(1),
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `provider-performance-${format(dateRange.from, 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedProviderData = providerData.find(p => p.id === selectedProvider);

  const totalRevenue = providerData.reduce((sum, p) => sum + p.revenue, 0);
  const totalBookings = providerData.reduce((sum, p) => sum + p.totalBookings, 0);
  const averageRating = providerData.length > 0
    ? providerData.reduce((sum, p) => sum + p.averageRating, 0) / providerData.length
    : 0;
  const averageUtilization = providerData.length > 0
    ? providerData.reduce((sum, p) => sum + p.utilizationRate, 0) / providerData.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-charcoal/50 border-graphite/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-champagne flex items-center gap-2 text-lg">
              <Users className="w-4 h-4" />
              Total Providers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-pearl">{providerData.length}</p>
            <p className="text-champagne/70 text-sm">Active providers</p>
          </CardContent>
        </Card>

        <Card className="bg-charcoal/50 border-graphite/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-champagne flex items-center gap-2 text-lg">
              <Calendar className="w-4 h-4" />
              Total Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-pearl">{totalBookings.toLocaleString()}</p>
            <p className="text-champagne/70 text-sm">All providers</p>
          </CardContent>
        </Card>

        <Card className="bg-charcoal/50 border-graphite/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-champagne flex items-center gap-2 text-lg">
              <DollarSign className="w-4 h-4" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-pearl">${totalRevenue.toFixed(2)}</p>
            <p className="text-champagne/70 text-sm">From all providers</p>
          </CardContent>
        </Card>

        <Card className="bg-charcoal/50 border-graphite/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-champagne flex items-center gap-2 text-lg">
              <Target className="w-4 h-4" />
              Avg Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-pearl">{averageUtilization.toFixed(1)}%</p>
            <p className="text-champagne/70 text-sm">Across providers</p>
          </CardContent>
        </Card>
      </div>

      {/* Provider List */}
      <Card className="bg-charcoal/50 border-graphite/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-pearl">Provider Performance</CardTitle>
              <CardDescription className="text-champagne/70">
                Individual provider metrics and performance analysis
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-champagne/70" />
                <Input
                  placeholder="Search providers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 bg-charcoal border-graphite/50"
                />
              </div>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-48 bg-charcoal border-graphite/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bookings">Sort by Bookings</SelectItem>
                  <SelectItem value="revenue">Sort by Revenue</SelectItem>
                  <SelectItem value="rating">Sort by Rating</SelectItem>
                  <SelectItem value="utilization">Sort by Utilization</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                className="border-graphite/50 hover:bg-champagne/10"
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {providerData.slice(0, 10).map((provider, index) => (
              <div
                key={provider.id}
                className={`p-4 rounded-lg border transition-all cursor-pointer ${
                  selectedProvider === provider.id
                    ? 'bg-champagne/10 border-champagne/50'
                    : 'bg-charcoal/30 border-graphite/30 hover:bg-charcoal/50'
                }`}
                onClick={() => setSelectedProvider(selectedProvider === provider.id ? null : provider.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold text-champagne">#{index + 1}</div>
                    <div>
                      <h4 className="text-pearl font-medium">{provider.name}</h4>
                      <p className="text-champagne/70 text-sm">{provider.email}</p>
                    </div>
                    {provider.averageRating >= 4.5 && (
                      <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/50">
                        <Award className="w-3 h-3 mr-1" />
                        Top Rated
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <p className="text-pearl font-bold text-lg">{provider.totalBookings}</p>
                      <p className="text-champagne/70 text-sm">Bookings</p>
                    </div>
                    <div className="text-center">
                      <p className="text-pearl font-bold text-lg">${provider.revenue.toFixed(2)}</p>
                      <p className="text-champagne/70 text-sm">Revenue</p>
                    </div>
                    {provider.totalReviews > 0 && (
                      <div className="text-center">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="text-pearl font-bold">{provider.averageRating.toFixed(1)}</span>
                        </div>
                        <p className="text-champagne/70 text-sm">({provider.totalReviews})</p>
                      </div>
                    )}
                    <div className="text-center">
                      <p className="text-pearl font-bold">{provider.utilizationRate.toFixed(0)}%</p>
                      <p className="text-champagne/70 text-sm">Utilization</p>
                    </div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-champagne/70">Completion Rate</span>
                      <span className="text-champagne">
                        {provider.totalBookings > 0
                          ? ((provider.completedBookings / provider.totalBookings) * 100).toFixed(1)
                          : 0}%
                      </span>
                    </div>
                    <Progress
                      value={provider.totalBookings > 0 ? (provider.completedBookings / provider.totalBookings) * 100 : 0}
                      className="h-2"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-champagne/70">On-Time Rate</span>
                      <span className="text-champagne">{provider.onTimeRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={provider.onTimeRate} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-champagne/70">Cancellation Rate</span>
                      <span className="text-red-400">{provider.cancellationRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={provider.cancellationRate} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-champagne/70">Avg Session</span>
                      <span className="text-champagne">{provider.averageSessionDuration.toFixed(0)}min</span>
                    </div>
                    <Progress value={(provider.averageSessionDuration / 120) * 100} className="h-2" />
                  </div>
                </div>

                {/* Detailed view */}
                {selectedProvider === provider.id && (
                  <div className="mt-6 pt-6 border-t border-graphite/30">
                    <h5 className="text-champagne font-medium mb-4">Monthly Booking Trend</h5>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={provider.monthlyTrend}>
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                            labelStyle={{ color: '#fff' }}
                          />
                          <Line
                            type="monotone"
                            dataKey="bookings"
                            stroke="#8B4513"
                            strokeWidth={2}
                            dot={{ fill: '#8B4513' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Provider Radar Comparison */}
      {selectedProviderData && (
        <Card className="bg-charcoal/50 border-graphite/30">
          <CardHeader>
            <CardTitle className="text-pearl">Performance Comparison</CardTitle>
            <CardDescription className="text-champagne/70">
              Comparing {selectedProviderData.name} against average performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={[
                  {
                    metric: 'Bookings',
                    [selectedProviderData.name]: selectedProviderData.totalBookings,
                    Average: totalBookings / providerData.length,
                  },
                  {
                    metric: 'Revenue',
                    [selectedProviderData.name]: selectedProviderData.revenue / 1000, // Convert to K
                    Average: (totalRevenue / providerData.length) / 1000,
                  },
                  {
                    metric: 'Rating',
                    [selectedProviderData.name]: selectedProviderData.averageRating * 20, // Scale to 100
                    Average: averageRating * 20,
                  },
                  {
                    metric: 'Utilization',
                    [selectedProviderData.name]: selectedProviderData.utilizationRate,
                    Average: averageUtilization,
                  },
                  {
                    metric: 'On-Time',
                    [selectedProviderData.name]: selectedProviderData.onTimeRate,
                    Average: 90, // Industry average
                  },
                ]}>
                  <PolarGrid stroke="#444" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: '#fff' }} />
                  <PolarRadiusAxis angle={90} domain={[0, 'dataMax']} tick={{ fill: '#fff' }} />
                  <Radar
                    name={selectedProviderData.name}
                    dataKey={selectedProviderData.name}
                    stroke="#8B4513"
                    fill="#8B4513"
                    fillOpacity={0.3}
                  />
                  <Radar
                    name="Average"
                    dataKey="Average"
                    stroke="#D2691E"
                    fill="#D2691E"
                    fillOpacity={0.3}
                  />
                  <Legend />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                    labelStyle={{ color: '#fff' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}