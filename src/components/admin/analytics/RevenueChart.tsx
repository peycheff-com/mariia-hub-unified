import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Download, Calendar } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval, eachMonthOfInterval, eachWeekOfInterval, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RevenueData {
  date: string;
  revenue: number;
  bookings: number;
  averageOrderValue: number;
  refunds: number;
  netRevenue: number;
}

interface RevenueChartProps {
  dateRange: { from: Date; to: Date };
  onDateRangeChange: (range: { from: Date; to: Date }) => void;
}

export function RevenueChart({ dateRange, onDateRangeChange }: RevenueChartProps) {
  const [data, setData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(false);
  const [timeGranularity, setTimeGranularity] = useState<'day' | 'week' | 'month'>('day');
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('line');
  const { toast } = useToast();

  useEffect(() => {
    fetchRevenueData();
  }, [dateRange, timeGranularity]);

  const fetchRevenueData = async () => {
    setLoading(true);
    try {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          booking_date,
          total_amount,
          amount_paid,
          refund_amount,
          status,
          currency
        `)
        .gte('booking_date', dateRange.from.toISOString())
        .lte('booking_date', dateRange.to.toISOString())
        .in('status', ['confirmed', 'completed', 'refunded']);

      if (error) throw error;

      const processedData = processRevenueData(bookings || [], timeGranularity);
      setData(processedData);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch revenue data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const processRevenueData = (bookings: any[], granularity: 'day' | 'week' | 'month'): RevenueData[] => {
    const groupedData = new Map<string, RevenueData>();

    bookings.forEach(booking => {
      const date = new Date(booking.booking_date);
      let key: string;

      switch (granularity) {
        case 'week':
          const weekStart = startOfWeek(date);
          key = format(weekStart, 'yyyy-MM-dd');
          break;
        case 'month':
          const monthStart = startOfMonth(date);
          key = format(monthStart, 'yyyy-MM');
          break;
        default:
          key = format(date, 'yyyy-MM-dd');
      }

      if (!groupedData.has(key)) {
        groupedData.set(key, {
          date: key,
          revenue: 0,
          bookings: 0,
          averageOrderValue: 0,
          refunds: 0,
          netRevenue: 0,
        });
      }

      const current = groupedData.get(key)!;
      const bookingRevenue = parseFloat(booking.total_amount) || 0;
      const refundAmount = parseFloat(booking.refund_amount) || 0;

      current.revenue += bookingRevenue;
      current.bookings += 1;
      current.refunds += refundAmount;
      current.netRevenue += (bookingRevenue - refundAmount);
    });

    // Calculate AOV and sort by date
    return Array.from(groupedData.values())
      .map(item => ({
        ...item,
        averageOrderValue: item.bookings > 0 ? item.revenue / item.bookings : 0,
        date: granularity === 'month'
          ? format(new Date(item.date + '-01'), 'MMM yyyy')
          : granularity === 'week'
          ? `Week of ${format(new Date(item.date), 'MMM dd')}`
          : format(new Date(item.date), 'MMM dd'),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  const exportToCSV = () => {
    const csv = [
      ['Date', 'Revenue', 'Bookings', 'AOV', 'Refunds', 'Net Revenue'],
      ...data.map(d => [
        d.date,
        d.revenue.toFixed(2),
        d.bookings.toString(),
        d.averageOrderValue.toFixed(2),
        d.refunds.toFixed(2),
        d.netRevenue.toFixed(2),
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue-${format(dateRange.from, 'yyyy-MM-dd')}-to-${format(dateRange.to, 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const totalBookings = data.reduce((sum, d) => sum + d.bookings, 0);
  const averageOrderValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
  const totalRefunds = data.reduce((sum, d) => sum + d.refunds, 0);
  const netRevenue = totalRevenue - totalRefunds;

  const renderChart = () => {
    const chartProps = {
      data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    };

    switch (chartType) {
      case 'bar':
        return (
          <BarChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
              labelStyle={{ color: '#fff' }}
              formatter={(value: any) => [`$${value.toFixed(2)}`, '']}
            />
            <Legend />
            <Bar dataKey="revenue" fill="#8B4513" name="Revenue" />
            <Bar dataKey="netRevenue" fill="#D2691E" name="Net Revenue" />
          </BarChart>
        );
      case 'area':
        return (
          <AreaChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
              labelStyle={{ color: '#fff' }}
              formatter={(value: any) => [`$${value.toFixed(2)}`, '']}
            />
            <Legend />
            <Area type="monotone" dataKey="revenue" stackId="1" stroke="#8B4513" fill="#8B4513" fillOpacity={0.6} name="Revenue" />
            <Area type="monotone" dataKey="refunds" stackId="2" stroke="#dc2626" fill="#dc2626" fillOpacity={0.6} name="Refunds" />
          </AreaChart>
        );
      default:
        return (
          <LineChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
              labelStyle={{ color: '#fff' }}
              formatter={(value: any) => [`$${value.toFixed(2)}`, '']}
            />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#8B4513" strokeWidth={2} name="Revenue" />
            <Line type="monotone" dataKey="netRevenue" stroke="#D2691E" strokeWidth={2} name="Net Revenue" />
            <Line type="monotone" dataKey="averageOrderValue" stroke="#F5DEB3" strokeWidth={2} name="AOV" />
          </LineChart>
        );
    }
  };

  return (
    <Card className="bg-charcoal/50 border-graphite/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-pearl flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Revenue Analysis
            </CardTitle>
            <CardDescription className="text-champagne/70">
              Track revenue, bookings, and average order value over time
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={timeGranularity} onValueChange={(value: any) => setTimeGranularity(value)}>
              <SelectTrigger className="w-32 bg-charcoal border-graphite/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Daily</SelectItem>
                <SelectItem value="week">Weekly</SelectItem>
                <SelectItem value="month">Monthly</SelectItem>
              </SelectContent>
            </Select>
            <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
              <SelectTrigger className="w-32 bg-charcoal border-graphite/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="line">Line</SelectItem>
                <SelectItem value="bar">Bar</SelectItem>
                <SelectItem value="area">Area</SelectItem>
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="space-y-1">
            <p className="text-champagne/70 text-sm">Total Revenue</p>
            <p className="text-2xl font-bold text-pearl">${totalRevenue.toFixed(2)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-champagne/70 text-sm">Net Revenue</p>
            <p className="text-2xl font-bold text-champagne">${netRevenue.toFixed(2)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-champagne/70 text-sm">Total Bookings</p>
            <p className="text-2xl font-bold text-pearl">{totalBookings}</p>
          </div>
          <div className="space-y-1">
            <p className="text-champagne/70 text-sm">Avg Order Value</p>
            <p className="text-2xl font-bold text-pearl">${averageOrderValue.toFixed(2)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-champagne/70 text-sm">Refunds</p>
            <p className="text-2xl font-bold text-red-400">${totalRefunds.toFixed(2)}</p>
          </div>
        </div>

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
  );
}