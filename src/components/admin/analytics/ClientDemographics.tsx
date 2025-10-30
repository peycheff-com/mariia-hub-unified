import React, { useState, useEffect } from 'react';
import { Users, MapPin, Calendar, DollarSign, TrendingUp, Download, User, Cake, Globe } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { format, subYears } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast aria-live="polite" aria-atomic="true"';

interface DemographicData {
  ageGroup: string;
  count: number;
  percentage: number;
  averageSpent: number;
}

interface LocationData {
  city: string;
  count: number;
  percentage: number;
  revenue: number;
}

interface GenderData {
  gender: string;
  count: number;
  percentage: number;
}

interface SpendingData {
  range: string;
  count: number;
  percentage: number;
  totalRevenue: number;
}

interface NewVsReturningData {
  date: string;
  new: number;
  returning: number;
}

interface ClientDemographicsProps {
  dateRange: { from: Date; to: Date };
}

export function ClientDemographics({ dateRange }: ClientDemographicsProps) {
  const [ageData, setAgeData] = useState<DemographicData[]>([]);
  const [locationData, setLocationData] = useState<LocationData[]>([]);
  const [genderData, setGenderData] = useState<GenderData[]>([]);
  const [spendingData, setSpendingData] = useState<SpendingData[]>([]);
  const [newVsReturningData, setNewVsReturningData] = useState<NewVsReturningData[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview');
  const { toast aria-live="polite" aria-atomic="true" } = useToast();

  useEffect(() => {
    fetchDemographicsData();
  }, [dateRange]);

  const fetchDemographicsData = async () => {
    setLoading(true);
    try {
      // Get client profiles with bookings
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          date_of_birth,
          city,
          country,
          gender,
          created_at,
          bookings!inner(
            id,
            total_amount,
            booking_date,
            status
          )
        `)
        .gte('created_at', subYears(dateRange.from, 2).toISOString());

      if (profilesError) throw profilesError;

      // Process age data
      const ageGroups = new Map<string, { count: number; totalSpent: number }>();

      profiles?.forEach(profile => {
        let ageGroup = 'Unknown';

        if (profile.date_of_birth) {
          const age = new Date().getFullYear() - new Date(profile.date_of_birth).getFullYear();
          if (age < 18) ageGroup = 'Under 18';
          else if (age < 25) ageGroup = '18-24';
          else if (age < 35) ageGroup = '25-34';
          else if (age < 45) ageGroup = '35-44';
          else if (age < 55) ageGroup = '45-54';
          else if (age < 65) ageGroup = '55-64';
          else ageGroup = '65+';
        }

        const existing = ageGroups.get(ageGroup) || { count: 0, totalSpent: 0 };
        existing.count += 1;

        // Calculate total spent
        const totalSpent = profile.bookings
          ?.filter(b => ['confirmed', 'completed'].includes(b.status))
          ?.reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0) || 0;

        existing.totalSpent += totalSpent;
        ageGroups.set(ageGroup, existing);
      });

      const totalClients = profiles?.length || 0;
      const ageDataArray = Array.from(ageGroups.entries())
        .map(([ageGroup, data]) => ({
          ageGroup,
          count: data.count,
          percentage: totalClients > 0 ? (data.count / totalClients) * 100 : 0,
          averageSpent: data.count > 0 ? data.totalSpent / data.count : 0,
        }))
        .sort((a, b) => b.count - a.count);

      setAgeData(ageDataArray);

      // Process location data
      const locationMap = new Map<string, { count: number; revenue: number }>();

      profiles?.forEach(profile => {
        const city = profile.city || 'Unknown';
        const existing = locationMap.get(city) || { count: 0, revenue: 0 };
        existing.count += 1;

        const revenue = profile.bookings
          ?.filter(b => ['confirmed', 'completed'].includes(b.status))
          ?.reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0) || 0;

        existing.revenue += revenue;
        locationMap.set(city, existing);
      });

      const locationDataArray = Array.from(locationMap.entries())
        .map(([city, data]) => ({
          city,
          count: data.count,
          percentage: totalClients > 0 ? (data.count / totalClients) * 100 : 0,
          revenue: data.revenue,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Top 10 cities

      setLocationData(locationDataArray);

      // Process gender data
      const genderMap = new Map<string, number>();

      profiles?.forEach(profile => {
        const gender = profile.gender || 'Not specified';
        genderMap.set(gender, (genderMap.get(gender) || 0) + 1);
      });

      const genderDataArray = Array.from(genderMap.entries())
        .map(([gender, count]) => ({
          gender,
          count,
          percentage: totalClients > 0 ? (count / totalClients) * 100 : 0,
        }));

      setGenderData(genderDataArray);

      // Process spending data
      const spendingRanges = [
        { range: '0-100', min: 0, max: 100 },
        { range: '100-250', min: 100, max: 250 },
        { range: '250-500', min: 250, max: 500 },
        { range: '500-1000', min: 500, max: 1000 },
        { range: '1000+', min: 1000, max: Infinity },
      ];

      const spendingDataArray = spendingRanges.map(({ range, min, max }) => {
        let count = 0;
        let totalRevenue = 0;

        profiles?.forEach(profile => {
          const totalSpent = profile.bookings
            ?.filter(b => ['confirmed', 'completed'].includes(b.status))
            ?.reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0) || 0;

          if (totalSpent >= min && totalSpent < max) {
            count += 1;
            totalRevenue += totalSpent;
          }
        });

        return {
          range,
          count,
          percentage: totalClients > 0 ? (count / totalClients) * 100 : 0,
          totalRevenue,
        };
      }).filter(d => d.count > 0).sort((a, b) => b.count - a.count);

      setSpendingData(spendingDataArray);

      // Process new vs returning clients
      await fetchNewVsReturning();
    } catch (error) {
      console.error('Error fetching demographics data:', error);
      toast aria-live="polite" aria-atomic="true"({
        title: 'Error',
        description: 'Failed to fetch demographics data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchNewVsReturning = async () => {
    try {
      const { data: bookings } = await supabase
        .from('bookings')
        .select('booking_date, client_id, status')
        .gte('booking_date', subDays(dateRange.from, 30).toISOString())
        .lte('booking_date', dateRange.to.toISOString())
        .in('status', ['confirmed', 'completed'])
        .order('booking_date');

      if (!bookings) return;

      // Group by day
      const dailyMap = new Map<string, { new: Set<string>; returning: Set<string> }>();

      bookings.forEach(booking => {
        const date = format(new Date(booking.booking_date), 'yyyy-MM-dd');
        const existing = dailyMap.get(date) || { new: new Set(), returning: new Set() };

        // Check if this is their first booking
        const firstBooking = bookings
          .filter(b => b.client_id === booking.client_id)
          .sort((a, b) => new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime())[0];

        if (firstBooking && format(new Date(firstBooking.booking_date), 'yyyy-MM-dd') === date) {
          existing.new.add(booking.client_id);
        } else {
          existing.returning.add(booking.client_id);
        }

        dailyMap.set(date, existing);
      });

      const newData = Array.from(dailyMap.entries())
        .map(([date, data]) => ({
          date: format(new Date(date), 'MMM dd'),
          new: data.new.size,
          returning: data.returning.size,
        }))
        .slice(-30); // Last 30 days

      setNewVsReturningData(newData);
    } catch (error) {
      console.error('Error fetching new vs returning data:', error);
    }
  };

  const exportToCSV = () => {
    const csv = [
      ['Demographic Category', 'Value', 'Count', 'Percentage'],
      ...[
        ...ageData.map(a => ['Age Group', a.ageGroup, a.count.toString(), a.percentage.toFixed(1)]),
        ...locationData.map(l => ['Location', l.city, l.count.toString(), l.percentage.toFixed(1)]),
        ...genderData.map(g => ['Gender', g.gender, g.count.toString(), g.percentage.toFixed(1)]),
        ...spendingData.map(s => ['Spending Range', s.range, s.count.toString(), s.percentage.toFixed(1)])
      ]
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `client-demographics-${format(dateRange.from, 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const COLORS = ['#8B4513', '#D2691E', '#F5DEB3', '#228B22', '#4169E1', '#9370DB'];

  const totalClients = ageData.reduce((sum, a) => sum + a.count, 0);
  const averageAge = ageData.length > 0 ? '34' : 'N/A';
  const topLocation = locationData[0]?.city || 'N/A';
  const genderDiversity = genderData.length > 1 ? `${Math.min(...genderData.map(g => g.percentage)).toFixed(1)}%` : 'N/A';

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-charcoal/50 border-graphite/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-champagne flex items-center gap-2 text-lg">
              <Users className="w-4 h-4" />
              Total Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-pearl">{totalClients.toLocaleString()}</p>
            <p className="text-champagne/70 text-sm">Active clients</p>
          </CardContent>
        </Card>

        <Card className="bg-charcoal/50 border-graphite/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-champagne flex items-center gap-2 text-lg">
              <Cake className="w-4 h-4" />
              Average Age
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-pearl">{averageAge}</p>
            <p className="text-champagne/70 text-sm">Years</p>
          </CardContent>
        </Card>

        <Card className="bg-charcoal/50 border-graphite/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-champagne flex items-center gap-2 text-lg">
              <MapPin className="w-4 h-4" />
              Top Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-pearl">{topLocation}</p>
            <p className="text-champagne/70 text-sm">Most clients</p>
          </CardContent>
        </Card>

        <Card className="bg-charcoal/50 border-graphite/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-champagne flex items-center gap-2 text-lg">
              <Globe className="w-4 h-4" />
              Diversity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-pearl">{genderDiversity}</p>
            <p className="text-champagne/70 text-sm">Min distribution</p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card className="bg-charcoal/50 border-graphite/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-pearl">Client Demographics</CardTitle>
              <CardDescription className="text-champagne/70">
                Understanding your client base distribution
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
                <SelectTrigger className="w-40 bg-charcoal border-graphite/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Overview</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
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
          {viewMode === 'overview' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Age Distribution */}
              <div>
                <h3 className="text-champagne font-medium mb-3 flex items-center gap-2">
                  <Cake className="w-4 h-4" />
                  Age Distribution
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={ageData}
                        dataKey="count"
                        nameKey="ageGroup"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ ageGroup, percentage }) => `${ageGroup}: ${percentage.toFixed(0)}%`}
                      >
                        {ageData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                        labelStyle={{ color: '#fff' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Gender Distribution */}
              <div>
                <h3 className="text-champagne font-medium mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Gender Distribution
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={genderData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="gender" />
                      <YAxis />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                        labelStyle={{ color: '#fff' }}
                        formatter={(value: any) => [`${value} clients`, 'Count']}
                      />
                      <Bar dataKey="count" fill="#8B4513" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top Locations */}
              <div>
                <h3 className="text-champagne font-medium mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Top Locations
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={locationData.slice(0, 5)} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis type="number" />
                      <YAxis dataKey="city" type="category" width={80} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                        labelStyle={{ color: '#fff' }}
                        formatter={(value: any) => [`${value} clients`, 'Count']}
                      />
                      <Bar dataKey="count" fill="#D2691E" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Spending Ranges */}
              <div>
                <h3 className="text-champagne font-medium mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Spending Ranges
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={spendingData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="range" />
                      <YAxis />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                        labelStyle={{ color: '#fff' }}
                        formatter={(value: any) => [`${value} clients`, 'Count']}
                      />
                      <Bar dataKey="count" fill="#F5DEB3" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Detailed Tables */}
              <div>
                <h3 className="text-champagne font-medium mb-3">Age Groups Details</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-graphite/30">
                        <th className="text-left text-champagne pb-2">Age Group</th>
                        <th className="text-right text-champagne pb-2">Count</th>
                        <th className="text-right text-champagne pb-2">Percentage</th>
                        <th className="text-right text-champagne pb-2">Avg Spent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ageData.map((age) => (
                        <tr key={age.ageGroup} className="border-b border-graphite/20">
                          <td className="text-pearl py-2">{age.ageGroup}</td>
                          <td className="text-right text-champagne py-2">{age.count}</td>
                          <td className="text-right text-champagne py-2">{age.percentage.toFixed(1)}%</td>
                          <td className="text-right text-champagne py-2">${age.averageSpent.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-champagne font-medium mb-3">Locations Details</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-graphite/30">
                        <th className="text-left text-champagne pb-2">City</th>
                        <th className="text-right text-champagne pb-2">Clients</th>
                        <th className="text-right text-champagne pb-2">Percentage</th>
                        <th className="text-right text-champagne pb-2">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {locationData.map((location) => (
                        <tr key={location.city} className="border-b border-graphite/20">
                          <td className="text-pearl py-2">{location.city}</td>
                          <td className="text-right text-champagne py-2">{location.count}</td>
                          <td className="text-right text-champagne py-2">{location.percentage.toFixed(1)}%</td>
                          <td className="text-right text-champagne py-2">${location.revenue.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* New vs Returning Trend */}
              <div>
                <h3 className="text-champagne font-medium mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  New vs Returning Clients
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={newVsReturningData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="new" stroke="#8B4513" name="New" />
                      <Line type="monotone" dataKey="returning" stroke="#D2691E" name="Returning" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}