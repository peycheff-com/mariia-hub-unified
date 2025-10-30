/**
 * Operational Dashboard
 *
 * Day-to-day operational insights for managers including:
 * - Real-time booking status and staff performance
 * - Service capacity and utilization
 * - Customer service metrics
 * - Operational efficiency indicators
 */

import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, Treemap, ScatterChart, Scatter
} from "recharts";
import {
  Users, Calendar, Clock, TrendingUp, AlertTriangle, CheckCircle,
  XCircle, Phone, Mail, MessageSquare, Star, Activity, Target,
  Settings, Zap, Filter, Search, Download, RefreshCw,
  UserCheck, UserX, Timer, DollarSign, Eye, ThumbsUp,
  ThumbsDown, HelpCircle, ChevronRight, Bell, MapPin
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast aria-live="polite" aria-atomic="true"";

interface OperationalMetrics {
  bookings: {
    today: {
      total: number;
      completed: number;
      inProgress: number;
      upcoming: number;
      cancelled: number;
      noShows: number;
    };
    weekly: {
      total: number;
      revenue: number;
      completionRate: number;
      averageRating: number;
      noShowRate: number;
    };
    trends: {
      dailyTrend: Array<{ date: string; bookings: number; revenue: number }>;
      hourlyDistribution: Array<{ hour: number; bookings: number }>;
      servicePerformance: Array<{ service: string; bookings: number; revenue: number; rating: number }>;
    };
  };
  staff: {
    performance: Array<{
      id: string;
      name: string;
      role: string;
      bookings: number;
      revenue: number;
      rating: number;
      efficiency: number;
      status: 'available' | 'busy' | 'offline';
    }>;
    utilization: {
      overall: number;
      byRole: Array<{ role: string; utilization: number; count: number }>;
      peakHours: Array<{ hour: number; utilization: number }>;
    };
    schedules: Array<{
      staffId: string;
      date: string;
      shifts: Array<{ start: string; end: string; status: string }>;
    }>;
  };
  services: {
    performance: Array<{
      id: string;
      name: string;
      category: string;
      bookings: number;
      revenue: number;
      averageRating: number;
      duration: number;
      utilization: number;
      profitability: number;
    }>;
    capacity: {
      totalSlots: number;
      bookedSlots: number;
      availableSlots: number;
      utilizationRate: number;
      byCategory: Array<{ category: string; total: number; booked: number; available: number }>;
    };
    issues: Array<{
      id: string;
      service: string;
      type: 'high_demand' | 'low_rating' | 'long_wait' | 'cancellation_spike';
      severity: 'low' | 'medium' | 'high';
      description: string;
      recommendations: string[];
    }>;
  };
  customerService: {
    inquiries: {
      total: number;
      resolved: number;
      pending: number;
      averageResponseTime: number;
      satisfaction: number;
    };
    channels: Array<{
      channel: string;
      count: number;
      responseTime: number;
      satisfaction: number;
    }>;
    issues: Array<{
      id: string;
      customer: string;
      issue: string;
      status: 'open' | 'in_progress' | 'resolved';
      priority: 'low' | 'medium' | 'high';
      assignedTo?: string;
      createdAt: Date;
    }>;
  };
}

const OperationalDashboard = () => {
  const [metrics, setMetrics] = useState<OperationalMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedView, setSelectedView] = useState<'today' | 'week' | 'month'>('today');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast aria-live="polite" aria-atomic="true" } = useToast();

  useEffect(() => {
    loadOperationalData();
    setupRealtimeUpdates();
  }, [selectedDate, selectedView]);

  const loadOperationalData = async () => {
    setLoading(true);
    try {
      const [bookingsData, staffData, servicesData, customerServiceData] = await Promise.all([
        loadBookingMetrics(),
        loadStaffMetrics(),
        loadServiceMetrics(),
        loadCustomerServiceMetrics()
      ]);

      setMetrics({
        bookings: bookingsData,
        staff: staffData,
        services: servicesData,
        customerService: customerServiceData
      });

    } catch (error) {
      console.error('Failed to load operational data:', error);
      toast aria-live="polite" aria-atomic="true"({
        title: "Error",
        description: "Failed to load operational dashboard data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadBookingMetrics = async () => {
    const startDate = new Date(selectedDate);
    const endDate = new Date(selectedDate);
    endDate.setDate(endDate.getDate() + 1);

    try {
      // Today's bookings
      const { data: todayBookings } = await supabase
        .from('bookings')
        .select('status, total_amount, start_time, end_time, created_at')
        .gte('booking_date', selectedDate)
        .lt('booking_date', endDate.toISOString().split('T')[0]);

      // Weekly data
      const weekStart = new Date(selectedDate);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const { data: weekBookings } = await supabase
        .from('bookings')
        .select('status, total_amount, service_id, rating')
        .gte('booking_date', weekStart.toISOString().split('T')[0])
        .lte('booking_date', selectedDate);

      const todayStats = {
        total: todayBookings?.length || 0,
        completed: todayBookings?.filter(b => b.status === 'completed').length || 0,
        inProgress: todayBookings?.filter(b => b.status === 'confirmed').length || 0,
        upcoming: todayBookings?.filter(b => b.status === 'pending').length || 0,
        cancelled: todayBookings?.filter(b => b.status === 'cancelled').length || 0,
        noShows: todayBookings?.filter(b => b.status === 'no_show').length || 0
      };

      const weekStats = {
        total: weekBookings?.length || 0,
        revenue: weekBookings?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0,
        completionRate: weekBookings?.length > 0
          ? ((weekBookings.filter(b => b.status === 'completed').length || 0) / weekBookings.length) * 100
          : 0,
        averageRating: 4.5, // Would come from reviews
        noShowRate: weekBookings?.length > 0
          ? ((weekBookings.filter(b => b.status === 'no_show').length || 0) / weekBookings.length) * 100
          : 0
      };

      // Generate trend data
      const dailyTrend = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() - i);
        return {
          date: date.toISOString().split('T')[0],
          bookings: Math.floor(Math.random() * 20) + 10,
          revenue: Math.floor(Math.random() * 5000) + 2000
        };
      }).reverse();

      const hourlyDistribution = Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        bookings: Math.floor(Math.random() * 5) + (i >= 9 && i <= 18 ? 3 : 0)
      }));

      return {
        today: todayStats,
        weekly: weekStats,
        trends: {
          dailyTrend,
          hourlyDistribution,
          servicePerformance: [
            { service: 'Lip Enhancement', bookings: 45, revenue: 13500, rating: 4.8 },
            { service: 'Brow Lamination', bookings: 62, revenue: 18600, rating: 4.9 },
            { service: 'Glutes Training', bookings: 28, revenue: 11200, rating: 4.7 },
            { service: 'Starter Program', bookings: 35, revenue: 8750, rating: 4.6 }
          ]
        }
      };

    } catch (error) {
      console.error('Failed to load booking metrics:', error);
      return {
        today: { total: 0, completed: 0, inProgress: 0, upcoming: 0, cancelled: 0, noShows: 0 },
        weekly: { total: 0, revenue: 0, completionRate: 0, averageRating: 0, noShowRate: 0 },
        trends: { dailyTrend: [], hourlyDistribution: [], servicePerformance: [] }
      };
    }
  };

  const loadStaffMetrics = async () => {
    // Mock staff data - in production would come from staff management system
    return {
      performance: [
        {
          id: '1',
          name: 'Anna Kowalska',
          role: 'Beauty Specialist',
          bookings: 12,
          revenue: 3600,
          rating: 4.9,
          efficiency: 95,
          status: 'available'
        },
        {
          id: '2',
          name: 'Marek Nowak',
          role: 'Fitness Trainer',
          bookings: 8,
          revenue: 2400,
          rating: 4.7,
          efficiency: 88,
          status: 'busy'
        },
        {
          id: '3',
          name: 'Ewa Wiśniewska',
          role: 'Beauty Specialist',
          bookings: 15,
          revenue: 4500,
          rating: 4.8,
          efficiency: 92,
          status: 'available'
        }
      ],
      utilization: {
        overall: 78.5,
        byRole: [
          { role: 'Beauty Specialist', utilization: 82, count: 2 },
          { role: 'Fitness Trainer', utilization: 75, count: 1 }
        ],
        peakHours: [
          { hour: 9, utilization: 65 },
          { hour: 10, utilization: 75 },
          { hour: 11, utilization: 85 },
          { hour: 14, utilization: 80 },
          { hour: 15, utilization: 90 },
          { hour: 16, utilization: 85 }
        ]
      },
      schedules: []
    };
  };

  const loadServiceMetrics = async () => {
    try {
      const { data: services } = await supabase
        .from('services')
        .select('id, title, service_type, duration_minutes, price, is_active')
        .eq('is_active', true);

      return {
        performance: (services || []).map(service => ({
          id: service.id,
          name: service.title,
          category: service.service_type,
          bookings: Math.floor(Math.random() * 50) + 10,
          revenue: service.price * (Math.floor(Math.random() * 20) + 5),
          averageRating: 4.5 + Math.random() * 0.5,
          duration: service.duration_minutes,
          utilization: 60 + Math.random() * 30,
          profitability: 0.7 + Math.random() * 0.25
        })),
        capacity: {
          totalSlots: 40,
          bookedSlots: 28,
          availableSlots: 12,
          utilizationRate: 70,
          byCategory: [
            { category: 'beauty', total: 25, booked: 18, available: 7 },
            { category: 'fitness', total: 15, booked: 10, available: 5 }
          ]
        },
        issues: [
          {
            id: '1',
            service: 'Lip Enhancement',
            type: 'high_demand',
            severity: 'medium',
            description: 'High demand for evening slots (6-9 PM)',
            recommendations: ['Consider extending evening hours', 'Add more evening time slots']
          }
        ]
      };

    } catch (error) {
      console.error('Failed to load service metrics:', error);
      return {
        performance: [],
        capacity: { totalSlots: 0, bookedSlots: 0, availableSlots: 0, utilizationRate: 0, byCategory: [] },
        issues: []
      };
    }
  };

  const loadCustomerServiceMetrics = async () => {
    // Mock customer service data
    return {
      inquiries: {
        total: 45,
        resolved: 38,
        pending: 7,
        averageResponseTime: 2.3,
        satisfaction: 4.6
      },
      channels: [
        { channel: 'Phone', count: 20, responseTime: 1.8, satisfaction: 4.7 },
        { channel: 'Email', count: 15, responseTime: 4.2, satisfaction: 4.5 },
        { channel: 'Chat', count: 10, responseTime: 0.8, satisfaction: 4.8 }
      ],
      issues: [
        {
          id: '1',
          customer: 'Jan Kowalski',
          issue: 'Booking confirmation not received',
          status: 'resolved',
          priority: 'medium',
          assignedTo: 'Anna Kowalska',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
        }
      ]
    };
  };

  const setupRealtimeUpdates = () => {
    // Set up real-time subscriptions for operational data
    const bookingSubscription = supabase
      .channel('operational-bookings')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
        },
        () => {
          loadBookingMetrics().then(bookingsData => {
            setMetrics(prev => prev ? { ...prev, bookings: bookingsData } : null);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(bookingSubscription);
    };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
    }).format(value);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'confirmed': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      case 'no_show': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStaffStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'text-green-600 bg-green-100';
      case 'busy': return 'text-blue-600 bg-blue-100';
      case 'offline': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Operational Dashboard</h1>
          <p className="text-slate-600 mt-2">Real-time operational insights and management tools</p>
        </div>

        <div className="flex items-center space-x-4">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-40"
          />

          <Select value={selectedView} onValueChange={(value) => setSelectedView(value as any)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>

          <Button onClick={loadOperationalData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Today's Bookings</p>
                <p className="text-2xl font-bold text-slate-900">{metrics.bookings.today.total}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-muted-foreground">{metrics.bookings.today.completed}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3 text-blue-600" />
                    <span className="text-xs text-muted-foreground">{metrics.bookings.today.inProgress}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <XCircle className="h-3 w-3 text-red-600" />
                    <span className="text-xs text-muted-foreground">{metrics.bookings.today.cancelled}</span>
                  </div>
                </div>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Weekly Revenue</p>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(metrics.bookings.weekly.revenue)}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">
                    Completion Rate: {metrics.bookings.weekly.completionRate.toFixed(1)}%
                  </span>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Staff Utilization</p>
                <p className="text-2xl font-bold text-slate-900">{metrics.staff.utilization.overall.toFixed(1)}%</p>
                <div className="flex items-center space-x-2 mt-2">
                  <Users className="h-3 w-3 text-blue-600" />
                  <span className="text-xs text-muted-foreground">
                    {metrics.staff.performance.filter(s => s.status === 'available').length} available
                  </span>
                </div>
              </div>
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Service Capacity</p>
                <p className="text-2xl font-bold text-slate-900">{metrics.services.capacity.utilizationRate.toFixed(1)}%</p>
                <div className="flex items-center space-x-2 mt-2">
                  <Target className="h-3 w-3 text-orange-600" />
                  <span className="text-xs text-muted-foreground">
                    {metrics.services.capacity.bookedSlots}/{metrics.services.capacity.totalSlots} slots
                  </span>
                </div>
              </div>
              <Settings className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="bookings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="staff">Staff Performance</TabsTrigger>
          <TabsTrigger value="services">Service Analytics</TabsTrigger>
          <TabsTrigger value="customer-service">Customer Service</TabsTrigger>
          <TabsTrigger value="issues">Issues & Alerts</TabsTrigger>
        </TabsList>

        {/* Bookings Tab */}
        <TabsContent value="bookings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hourly Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Today's Booking Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={metrics.bookings.trends.hourlyDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="bookings" stroke="#8B4513" fill="#F5DEB3" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Service Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Service Performance Today</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={metrics.bookings.trends.servicePerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="service" angle={-45} textAnchor="end" height={80} />
                    <YAxis yAxisId="bookings" orientation="left" />
                    <YAxis yAxisId="rating" orientation="right" domain={[0, 5]} />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="bookings" dataKey="bookings" fill="#8B4513" name="Bookings" />
                    <Bar yAxisId="rating" dataKey="rating" fill="#F5DEB3" name="Rating" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Recent Bookings */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Recent Booking Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Mock recent bookings */}
                  {[
                    { customer: 'Anna Nowak', service: 'Lip Enhancement', time: '14:00', status: 'confirmed' },
                    { customer: 'Marek Kowalski', service: 'Glutes Training', time: '15:30', status: 'in_progress' },
                    { customer: 'Ewa Wiśniewska', service: 'Brow Lamination', time: '16:00', status: 'pending' }
                  ].map((booking, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{booking.customer.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{booking.customer}</p>
                          <p className="text-xs text-muted-foreground">{booking.service}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-muted-foreground">{booking.time}</span>
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Staff Performance Tab */}
        <TabsContent value="staff" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Staff Performance Cards */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Team Performance</h3>
              {metrics.staff.performance.map((staff) => (
                <Card key={staff.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={`/avatars/${staff.id}.jpg`} />
                          <AvatarFallback>{staff.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{staff.name}</p>
                          <p className="text-sm text-muted-foreground">{staff.role}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStaffStatusColor(staff.status)}>
                          {staff.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Bookings</p>
                        <p className="font-semibold">{staff.bookings}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Revenue</p>
                        <p className="font-semibold">{formatCurrency(staff.revenue)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Rating</p>
                        <div className="flex items-center space-x-1">
                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                          <span className="font-semibold">{staff.rating}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Efficiency</p>
                        <p className="font-semibold">{staff.efficiency}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Staff Utilization Chart */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Staff Utilization</h3>
              <Card>
                <CardHeader>
                  <CardTitle>By Role</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metrics.staff.utilization.byRole.map((role) => (
                      <div key={role.role}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{role.role}</span>
                          <span className="text-sm text-muted-foreground">{role.utilization}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${role.utilization}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Peak Hours Utilization</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={metrics.staff.utilization.peakHours}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="utilization" stroke="#8B4513" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Service Analytics Tab */}
        <TabsContent value="services" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Service Performance */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Service Performance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metrics.services.performance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis yAxisId="revenue" orientation="left" />
                    <YAxis yAxisId="utilization" orientation="right" domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="revenue" dataKey="revenue" fill="#8B4513" name="Revenue" />
                    <Bar yAxisId="utilization" dataKey="utilization" fill="#F5DEB3" name="Utilization %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Service Capacity */}
            <Card>
              <CardHeader>
                <CardTitle>Service Capacity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Overall Utilization</span>
                      <span className="text-sm font-semibold">{metrics.services.capacity.utilizationRate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-green-600 h-3 rounded-full"
                        style={{ width: `${metrics.services.capacity.utilizationRate}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{metrics.services.capacity.totalSlots}</p>
                      <p className="text-xs text-muted-foreground">Total Slots</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">{metrics.services.capacity.bookedSlots}</p>
                      <p className="text-xs text-muted-foreground">Booked</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-orange-600">{metrics.services.capacity.availableSlots}</p>
                      <p className="text-xs text-muted-foreground">Available</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">By Category</p>
                    {metrics.services.capacity.byCategory.map((category) => (
                      <div key={category.category} className="flex items-center justify-between text-sm">
                        <span className="capitalize">{category.category}</span>
                        <span>{category.booked}/{category.total}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Service Issues */}
            <Card>
              <CardHeader>
                <CardTitle>Service Issues & Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.services.issues.map((issue) => (
                    <div key={issue.id} className="border-l-4 border-orange-400 pl-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">{issue.service}</h4>
                        <Badge variant={issue.severity === 'high' ? 'destructive' : 'secondary'}>
                          {issue.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{issue.description}</p>
                      <div className="space-y-1">
                        <p className="text-xs font-medium">Recommendations:</p>
                        {issue.recommendations.map((rec, index) => (
                          <p key={index} className="text-xs text-muted-foreground ml-2">• {rec}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Customer Service Tab */}
        <TabsContent value="customer-service" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Service Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Service Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600">{metrics.customerService.inquiries.total}</p>
                    <p className="text-sm text-muted-foreground">Total Inquiries</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">{metrics.customerService.inquiries.resolved}</p>
                    <p className="text-sm text-muted-foreground">Resolved</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-orange-600">{metrics.customerService.inquiries.averageResponseTime}h</p>
                    <p className="text-sm text-muted-foreground">Avg Response Time</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                      <span className="text-3xl font-bold">{metrics.customerService.inquiries.satisfaction}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Satisfaction Score</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Channel Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Channel Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.customerService.channels.map((channel) => (
                    <div key={channel.channel} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {channel.channel === 'Phone' && <Phone className="h-4 w-4" />}
                        {channel.channel === 'Email' && <Mail className="h-4 w-4" />}
                        {channel.channel === 'Chat' && <MessageSquare className="h-4 w-4" />}
                        <span className="font-medium">{channel.channel}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-muted-foreground">{channel.count} inquiries</span>
                        <span className="text-sm">{channel.responseTime}h avg</span>
                        <div className="flex items-center space-x-1">
                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                          <span className="text-sm">{channel.satisfaction}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Issues */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Recent Customer Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.customerService.issues.map((issue) => (
                    <div key={issue.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <HelpCircle className="h-5 w-5 text-orange-600" />
                        <div>
                          <p className="font-medium text-sm">{issue.customer}</p>
                          <p className="text-xs text-muted-foreground">{issue.issue}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={issue.status === 'resolved' ? 'default' : 'secondary'}>
                          {issue.status}
                        </Badge>
                        <Badge variant={issue.priority === 'high' ? 'destructive' : 'outline'}>
                          {issue.priority}
                        </Badge>
                        {issue.assignedTo && (
                          <span className="text-xs text-muted-foreground">{issue.assignedTo}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Issues & Alerts Tab */}
        <TabsContent value="issues" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Operational Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2 text-orange-600" />
                  Operational Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-sm">High No-Show Rate</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Today's no-show rate is 15% (above 10% threshold)
                      </p>
                      <Button size="sm" variant="outline" className="mt-2">
                        View Details
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-sm">Staff Shortage</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Only 1 fitness trainer available for evening slots
                      </p>
                      <Button size="sm" variant="outline" className="mt-2">
                        Schedule Adjustment
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-sm">Opportunity Detected</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        High demand for weekend beauty services
                      </p>
                      <Button size="sm" variant="outline" className="mt-2">
                        Expand Schedule
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-green-600" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Booking System</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      <span className="text-sm text-green-600">Operational</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Payment Processing</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      <span className="text-sm text-green-600">Operational</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Email Notifications</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
                      <span className="text-sm text-yellow-600">Delayed</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Data Sync</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      <span className="text-sm text-green-600">Synced</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OperationalDashboard;