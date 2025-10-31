import React, { useState, useEffect } from 'react';
import { Clock, Calendar, TrendingUp, Users, Download, BarChart3, Activity } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, PieChart, Pie, Cell } from 'recharts';
import { format, eachDayOfInterval, startOfWeek, endOfWeek, eachHourOfInterval, startOfDay, endOfDay, setHours, setMinutes } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface HourlyData {
  hour: number;
  hourLabel: string;
  bookings: number;
  revenue: number;
  clients: number;
}

interface DailyData {
  day: string;
  bookings: number;
  revenue: number;
  clients: number;
  peakHour: string;
}

interface MonthlyData {
  month: string;
  bookings: number;
  revenue: number;
  avgDailyBookings: number;
  busiestDay: string;
}

interface SeasonalData {
  season: string;
  bookings: number;
  revenue: number;
  percentage: number;
}

interface TimeAnalysisProps {
  dateRange: { from: Date; to: Date };
}

export function TimeAnalysis({ dateRange }: TimeAnalysisProps) {
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [seasonalData, setSeasonalData] = useState<SeasonalData[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'hourly' | 'daily' | 'monthly' | 'seasonal'>('hourly');
  const [analysisType, setAnalysisType] = useState<'bookings' | 'revenue' | 'clients'>('bookings');
  const { toast } = useToast();

  useEffect(() => {
    fetchTimeAnalysisData();
  }, [dateRange, viewMode]);

  const fetchTimeAnalysisData = async () => {
    setLoading(true);
    try {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          booking_date,
          start_time,
          end_time,
          total_amount,
          client_id,
          status
        `)
        .gte('booking_date', dateRange.from.toISOString())
        .lte('booking_date', dateRange.to.toISOString())
        .in('status', ['confirmed', 'completed']);

      if (error) throw error;

      const processedBookings = bookings || [];

      // Process hourly data
      const hourlyMap = new Map<number, { bookings: number; revenue: number; clients: Set<string> }>();

      for (let hour = 0; hour < 24; hour++) {
        hourlyMap.set(hour, { bookings: 0, revenue: 0, clients: new Set() });
      }

      processedBookings.forEach(booking => {
        if (booking.start_time) {
          const hour = parseInt(booking.start_time.split(':')[0]);
          const existing = hourlyMap.get(hour) || { bookings: 0, revenue: 0, clients: new Set() };
          existing.bookings += 1;
          existing.revenue += parseFloat(booking.total_amount) || 0;
          existing.clients.add(booking.client_id);
          hourlyMap.set(hour, existing);
        }
      });

      const hourlyDataArray = Array.from(hourlyMap.entries()).map(([hour, data]) => ({
        hour,
        hourLabel: `${hour.toString().padStart(2, '0')}:00`,
        bookings: data.bookings,
        revenue: data.revenue,
        clients: data.clients.size,
      }));

      setHourlyData(hourlyDataArray);

      // Process daily data
      const dailyMap = new Map<string, { bookings: number; revenue: number; clients: Set<string>; hourlyData: Map<number, number> }>();

      processedBookings.forEach(booking => {
        const date = format(new Date(booking.booking_date), 'yyyy-MM-dd');
        const existing = dailyMap.get(date) || { bookings: 0, revenue: 0, clients: new Set(), hourlyData: new Map() };
        existing.bookings += 1;
        existing.revenue += parseFloat(booking.total_amount) || 0;
        existing.clients.add(booking.client_id);

        if (booking.start_time) {
          const hour = parseInt(booking.start_time.split(':')[0]);
          existing.hourlyData.set(hour, (existing.hourlyData.get(hour) || 0) + 1);
        }

        dailyMap.set(date, existing);
      });

      const dailyDataArray = Array.from(dailyMap.entries()).map(([date, data]) => {
        // Find peak hour
        let peakHour = 0;
        let maxBookings = 0;
        data.hourlyData.forEach((count, hour) => {
          if (count > maxBookings) {
            maxBookings = count;
            peakHour = hour;
          }
        });

        return {
          day: format(new Date(date), 'EEE'),
          bookings: data.bookings,
          revenue: data.revenue,
          clients: data.clients.size,
          peakHour: `${peakHour.toString().padStart(2, '0')}:00`,
        };
      });

      setDailyData(dailyDataArray);

      // Process monthly data
      const monthlyMap = new Map<string, { bookings: number; revenue: number; dailyData: Map<string, number> }>();

      processedBookings.forEach(booking => {
        const month = format(new Date(booking.booking_date), 'MMM yyyy');
        const existing = monthlyMap.get(month) || { bookings: 0, revenue: 0, dailyData: new Map() };
        existing.bookings += 1;
        existing.revenue += parseFloat(booking.total_amount) || 0;
        monthlyMap.set(month, existing);
      });

      const monthlyDataArray = Array.from(monthlyMap.entries()).map(([month, data]) => ({
        month,
        bookings: data.bookings,
        revenue: data.revenue,
        avgDailyBookings: Math.round(data.bookings / 30), // Approximate
        busiestDay: 'Monday', // Placeholder
      }));

      setMonthlyData(monthlyDataArray);

      // Process seasonal data
      const seasonalMap = new Map<string, { bookings: number; revenue: number }>();

      processedBookings.forEach(booking => {
        const month = new Date(booking.booking_date).getMonth();
        let season = '';
        if (month >= 2 && month <= 4) season = 'Spring';
        else if (month >= 5 && month <= 7) season = 'Summer';
        else if (month >= 8 && month <= 10) season = 'Fall';
        else season = 'Winter';

        const existing = seasonalMap.get(season) || { bookings: 0, revenue: 0 };
        existing.bookings += 1;
        existing.revenue += parseFloat(booking.total_amount) || 0;
        seasonalMap.set(season, existing);
      });

      const totalSeasonalBookings = Array.from(seasonalMap.values()).reduce((sum, s) => sum + s.bookings, 0);

      const seasonalDataArray = Array.from(seasonalMap.entries()).map(([season, data]) => ({
        season,
        bookings: data.bookings,
        revenue: data.revenue,
        percentage: totalSeasonalBookings > 0 ? (data.bookings / totalSeasonalBookings) * 100 : 0,
      }));

      setSeasonalData(seasonalDataArray);
    } catch (error) {
      console.error('Error fetching time analysis data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch time analysis data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const data = viewMode === 'hourly' ? hourlyData : viewMode === 'daily' ? dailyData : viewMode === 'monthly' ? monthlyData : seasonalData;

    const csv = [
      viewMode === 'hourly' ? ['Hour', 'Bookings', 'Revenue', 'Clients'] :
      viewMode === 'daily' ? ['Day', 'Bookings', 'Revenue', 'Clients', 'Peak Hour'] :
      viewMode === 'monthly' ? ['Month', 'Bookings', 'Revenue', 'Avg Daily', 'Busiest Day'] :
      ['Season', 'Bookings', 'Revenue', 'Percentage'],
      ...data.map(item =>
        viewMode === 'hourly' ? [item.hourLabel, item.bookings, item.revenue.toFixed(2), item.clients] :
        viewMode === 'daily' ? [(item as any).day, item.bookings, item.revenue.toFixed(2), item.clients, (item as any).peakHour] :
        viewMode === 'monthly' ? [(item as any).month, item.bookings, item.revenue.toFixed(2), (item as any).avgDailyBookings, (item as any).busiestDay] :
        [(item as any).season, item.bookings, item.revenue.toFixed(2), (item as any).percentage.toFixed(1)]
      )
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `time-analysis-${viewMode}-${format(dateRange.from, 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const COLORS = ['#8B4513', '#D2691E', '#F5DEB3', '#228B22'];

  const findPeakBookingHour = () => {
    let peakHour = 0;
    let maxBookings = 0;
    hourlyData.forEach(data => {
      if (data.bookings > maxBookings) {
        maxBookings = data.bookings;
        peakHour = data.hour;
      }
    });
    return peakHour;
  };

  const findPeakDay = () => {
    const dayMap = new Map<string, number>();
    dailyData.forEach(data => {
      dayMap.set(data.day, (dayMap.get(data.day) || 0) + data.bookings);
    });

    let peakDay = '';
    let maxBookings = 0;
    dayMap.forEach((bookings, day) => {
      if (bookings > maxBookings) {
        maxBookings = bookings;
        peakDay = day;
      }
    });
    return peakDay;
  };

  const peakHour = findPeakBookingHour();
  const peakDay = findPeakDay();
  const totalBookings = hourlyData.reduce((sum, h) => sum + h.bookings, 0);

  const renderChart = () => {
    const data = viewMode === 'hourly' ? hourlyData : viewMode === 'daily' ? dailyData : viewMode === 'monthly' ? monthlyData : seasonalData;
    const chartHeight = 300;

    if (viewMode === 'seasonal') {
      return (
        <PieChart>
          <Pie
            data={data}
            dataKey="bookings"
            nameKey="season"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={({ season, percentage }) => `${season}: ${percentage.toFixed(1)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
            labelStyle={{ color: '#fff' }}
            formatter={(value: any, name: string) => [
              name === 'bookings' ? `${value} bookings` : `$${value.toFixed(2)}`,
              name === 'bookings' ? 'Bookings' : 'Revenue'
            ]}
          />
        </PieChart>
      );
    }

    const xKey = viewMode === 'hourly' ? 'hourLabel' : viewMode === 'daily' ? 'day' : 'month';
    const yKey = analysisType === 'revenue' ? 'revenue' : analysisType === 'clients' ? 'clients' : 'bookings';

    return (
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis dataKey={xKey} />
        <YAxis />
        <Tooltip
          contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
          labelStyle={{ color: '#fff' }}
          formatter={(value: any, name: string) => [
            analysisType === 'revenue' ? `$${value.toFixed(2)}` : value,
            analysisType === 'revenue' ? 'Revenue' : analysisType === 'clients' ? 'Clients' : 'Bookings'
          ]}
        />
        <Bar
          dataKey={yKey}
          fill="#8B4513"
          radius={viewMode === 'hourly' ? [0, 4, 4, 0] : [4, 4, 0, 0]}
        />
      </BarChart>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-charcoal/50 border-graphite/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-champagne flex items-center gap-2 text-lg">
              <Clock className="w-4 h-4" />
              Peak Hour
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-pearl">{`${peakHour.toString().padStart(2, '0')}:00`}</p>
            <p className="text-champagne/70 text-sm">Most bookings</p>
          </CardContent>
        </Card>

        <Card className="bg-charcoal/50 border-graphite/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-champagne flex items-center gap-2 text-lg">
              <Calendar className="w-4 h-4" />
              Peak Day
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-pearl">{peakDay}</p>
            <p className="text-champagne/70 text-sm">Most busy</p>
          </CardContent>
        </Card>

        <Card className="bg-charcoal/50 border-graphite/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-champagne flex items-center gap-2 text-lg">
              <Activity className="w-4 h-4" />
              Total Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-pearl">{totalBookings.toLocaleString()}</p>
            <p className="text-champagne/70 text-sm">In period</p>
          </CardContent>
        </Card>

        <Card className="bg-charcoal/50 border-graphite/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-champagne flex items-center gap-2 text-lg">
              <TrendingUp className="w-4 h-4" />
              Avg per Hour
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-pearl">
              {totalBookings > 0 ? Math.round(totalBookings / 24) : 0}
            </p>
            <p className="text-champagne/70 text-sm">Bookings hourly</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Chart */}
      <Card className="bg-charcoal/50 border-graphite/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-pearl">Time-Based Analysis</CardTitle>
              <CardDescription className="text-champagne/70">
                Booking patterns and trends over time
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
                <SelectTrigger className="w-40 bg-charcoal border-graphite/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="seasonal">Seasonal</SelectItem>
                </SelectContent>
              </Select>
              {viewMode !== 'seasonal' && (
                <Select value={analysisType} onValueChange={(value: any) => setAnalysisType(value)}>
                  <SelectTrigger className="w-40 bg-charcoal border-graphite/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bookings">Bookings</SelectItem>
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="clients">Clients</SelectItem>
                  </SelectContent>
                </Select>
              )}
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
          <div className="h-80">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-champagne">Loading...</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {renderChart()}
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Hourly Breakdown */}
      {viewMode === 'hourly' && (
        <Card className="bg-charcoal/50 border-graphite/30">
          <CardHeader>
            <CardTitle className="text-pearl">Hourly Breakdown</CardTitle>
            <CardDescription className="text-champagne/70">
              Detailed metrics for each hour of the day
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {hourlyData.map((hour) => (
                <div
                  key={hour.hour}
                  className={`p-3 rounded-lg border ${
                    hour.hour === peakHour
                      ? 'bg-champagne/10 border-champagne/50'
                      : 'bg-charcoal/30 border-graphite/30'
                  }`}
                >
                  <div className="text-center">
                    <p className="text-champagne font-medium">{hour.hourLabel}</p>
                    <p className="text-2xl font-bold text-pearl">{hour.bookings}</p>
                    <p className="text-champagne/70 text-sm">bookings</p>
                    <p className="text-sm text-champagne">{hour.clients}</p>
                    <p className="text-champagne/70 text-xs">clients</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Day of Week Analysis */}
      {viewMode === 'daily' && (
        <Card className="bg-charcoal/50 border-graphite/30">
          <CardHeader>
            <CardTitle className="text-pearl">Day of Week Analysis</CardTitle>
            <CardDescription className="text-champagne/70">
              Average bookings and peak times by day
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-4">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                const dayData = dailyData.filter(d => d.day === day);
                const avgBookings = dayData.length > 0 ? Math.round(dayData.reduce((sum, d) => sum + d.bookings, 0) / dayData.length) : 0;
                const totalRevenue = dayData.reduce((sum, d) => sum + d.revenue, 0);

                return (
                  <div key={day} className="text-center p-3 rounded-lg bg-charcoal/30">
                    <p className="text-champagne font-medium mb-2">{day}</p>
                    <p className="text-xl font-bold text-pearl">{avgBookings}</p>
                    <p className="text-champagne/70 text-sm">avg bookings</p>
                    {totalRevenue > 0 && (
                      <p className="text-sm text-champagne mt-1">${totalRevenue.toFixed(0)}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}