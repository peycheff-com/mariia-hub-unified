/**
 * Service Provider Dashboard
 *
 * Individual dashboard for service providers (beauty specialists, fitness trainers)
 * including personal performance metrics, schedule management, customer feedback,
 * and earnings insights.
 */

import { useState, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";
import {
  Calendar, Clock, DollarSign, Users, Star, TrendingUp, Award,
  Target, MessageSquare, Phone, Mail, Settings, Download, RefreshCw,
  Filter, CheckCircle, AlertCircle, User, TrendingDown, Activity,
  Eye, Heart, ThumbsUp, BarChart3, PieChart as PieChartIcon
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast aria-live="polite" aria-atomic="true"";

interface ProviderMetrics {
  profile: {
    id: string;
    name: string;
    role: string;
    avatar?: string;
    specialization: string[];
    rating: number;
    totalReviews: number;
    joinDate: string;
    status: 'available' | 'busy' | 'offline';
  };
  performance: {
    currentMonth: {
      bookings: number;
      revenue: number;
      hours: number;
      customers: number;
      rating: number;
      completionRate: number;
    };
    previousMonth: {
      bookings: number;
      revenue: number;
      hours: number;
      customers: number;
      rating: number;
    };
    trends: {
      bookings: Array<{ date: string; count: number }>;
      revenue: Array<{ date: string; amount: number }>;
      ratings: Array<{ date: string; rating: number }>;
    };
  };
  schedule: {
    today: Array<{
      id: string;
      time: string;
      customer: string;
      service: string;
      duration: number;
      status: 'upcoming' | 'in_progress' | 'completed' | 'cancelled';
      notes?: string;
    }>;
    week: Array<{
      date: string;
      bookings: number;
      hours: number;
      revenue: number;
    }>;
    availability: {
      totalSlots: number;
      bookedSlots: number;
      availableSlots: number;
      utilization: number;
    };
  };
  services: {
    performance: Array<{
      id: string;
      name: string;
      category: string;
      price: number;
      duration: number;
      bookings: number;
      revenue: number;
      rating: number;
      completionRate: number;
      profitability: number;
    }>;
    expertise: Array<{
      service: string;
      proficiency: number;
      demand: number;
      satisfaction: number;
    }>;
  };
  customers: {
    total: number;
    new: number;
    returning: number;
    retention: number;
    satisfaction: number;
    feedback: Array<{
      id: string;
      customer: string;
      rating: number;
      comment: string;
      date: string;
      service: string;
      response?: string;
    }>;
    demographics: {
      ageGroups: Array<{ range: string; count: number; percentage: number }>;
      gender: Array<{ gender: string; count: number; percentage: number }>;
      locations: Array<{ location: string; count: number; percentage: number }>;
    };
  };
  earnings: {
    currentMonth: {
      gross: number;
      net: number;
      commission: number;
      bonus: number;
      total: number;
    };
    ytd: {
      gross: number;
      net: number;
      commission: number;
      bonus: number;
      total: number;
    };
    projections: {
      month: Array<{ date: string; projected: number; actual?: number }>;
      quarterly: Array<{ quarter: string; projected: number; actual?: number }>;
    };
    performance: Array<{
      metric: string;
      current: number;
      target: number;
      achievement: number;
      bonus?: number;
    }>;
  };
}

const ServiceProviderDashboard = () => {
  const [metrics, setMetrics] = useState<ProviderMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month');
  const [selectedTab, setSelectedTab] = useState('overview');
  const { toast aria-live="polite" aria-atomic="true" } = useToast();

  useEffect(() => {
    loadProviderData();
    setupRealtimeUpdates();
  }, [selectedPeriod]);

  const loadProviderData = async () => {
    setLoading(true);
    try {
      // In a real implementation, get the current provider ID from auth context
      const mockProviderId = 'provider-123';

      const [profileData, performanceData, scheduleData, servicesData, customersData, earningsData] = await Promise.all([
        loadProviderProfile(mockProviderId),
        loadPerformanceMetrics(mockProviderId, selectedPeriod),
        loadScheduleData(mockProviderId),
        loadServicesData(mockProviderId),
        loadCustomersData(mockProviderId),
        loadEarningsData(mockProviderId, selectedPeriod)
      ]);

      setMetrics({
        profile: profileData,
        performance: performanceData,
        schedule: scheduleData,
        services: servicesData,
        customers: customersData,
        earnings: earningsData
      });

    } catch (error) {
      console.error('Failed to load provider data:', error);
      toast aria-live="polite" aria-atomic="true"({
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadProviderProfile = async (providerId: string) => {
    // Mock provider profile data
    return {
      id: providerId,
      name: 'Anna Kowalska',
      role: 'Beauty Specialist',
      avatar: '/avatars/anna.jpg',
      specialization: ['Lip Enhancements', 'Brow Lamination', 'Lash Lift'],
      rating: 4.9,
      totalReviews: 156,
      joinDate: '2023-01-15',
      status: 'available' as const
    };
  };

  const loadPerformanceMetrics = async (providerId: string, period: string) => {
    // Mock performance data based on period
    const multiplier = period === 'week' ? 0.25 : period === 'quarter' ? 3 : 1;

    return {
      currentMonth: {
        bookings: Math.floor(85 * multiplier),
        revenue: Math.floor(25500 * multiplier),
        hours: Math.floor(170 * multiplier),
        customers: Math.floor(65 * multiplier),
        rating: 4.8,
        completionRate: 96.5
      },
      previousMonth: {
        bookings: Math.floor(78 * multiplier),
        revenue: Math.floor(23400 * multiplier),
        hours: Math.floor(156 * multiplier),
        customers: Math.floor(60 * multiplier),
        rating: 4.7
      },
      trends: {
        bookings: Array.from({ length: period === 'week' ? 7 : period === 'quarter' ? 12 : 30 }, (_, i) => ({
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          count: Math.floor(Math.random() * 5) + 2
        })).reverse(),
        revenue: Array.from({ length: period === 'week' ? 7 : period === 'quarter' ? 12 : 30 }, (_, i) => ({
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          amount: Math.floor(Math.random() * 1000) + 500
        })).reverse(),
        ratings: Array.from({ length: period === 'week' ? 7 : period === 'quarter' ? 12 : 30 }, (_, i) => ({
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          rating: 4.5 + Math.random() * 0.5
        })).reverse()
      }
    };
  };

  const loadScheduleData = async (providerId: string) => {
    // Mock schedule data
    const today = new Date().toISOString().split('T')[0];

    return {
      today: [
        {
          id: '1',
          time: '09:00',
          customer: 'Ewa Nowak',
          service: 'Lip Enhancement',
          duration: 60,
          status: 'upcoming' as const,
          notes: 'First time client'
        },
        {
          id: '2',
          time: '10:30',
          customer: 'Anna Kowalczyk',
          service: 'Brow Lamination',
          duration: 45,
          status: 'upcoming' as const
        },
        {
          id: '3',
          time: '14:00',
          customer: 'Maria Wiśniewska',
          service: 'Lash Lift',
          duration: 90,
          status: 'upcoming' as const,
          notes: 'Returning client'
        }
      ],
      week: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        bookings: Math.floor(Math.random() * 5) + 3,
        hours: Math.floor(Math.random() * 4) + 2,
        revenue: Math.floor(Math.random() * 1500) + 800
      })),
      availability: {
        totalSlots: 40,
        bookedSlots: 28,
        availableSlots: 12,
        utilization: 70
      }
    };
  };

  const loadServicesData = async (providerId: string) => {
    // Mock services data
    return {
      performance: [
        {
          id: '1',
          name: 'Lip Enhancement',
          category: 'beauty',
          price: 500,
          duration: 60,
          bookings: 35,
          revenue: 17500,
          rating: 4.9,
          completionRate: 98,
          profitability: 0.75
        },
        {
          id: '2',
          name: 'Brow Lamination',
          category: 'beauty',
          price: 300,
          duration: 45,
          bookings: 28,
          revenue: 8400,
          rating: 4.8,
          completionRate: 96,
          profitability: 0.70
        },
        {
          id: '3',
          name: 'Lash Lift',
          category: 'beauty',
          price: 400,
          duration: 90,
          bookings: 22,
          revenue: 8800,
          rating: 4.7,
          completionRate: 95,
          profitability: 0.72
        }
      ],
      expertise: [
        { service: 'Lip Enhancement', proficiency: 95, demand: 90, satisfaction: 98 },
        { service: 'Brow Lamination', proficiency: 88, demand: 85, satisfaction: 96 },
        { service: 'Lash Lift', proficiency: 82, demand: 75, satisfaction: 94 }
      ]
    };
  };

  const loadCustomersData = async (providerId: string) => {
    // Mock customer data
    return {
      total: 156,
      new: 12,
      returning: 144,
      retention: 85,
      satisfaction: 96,
      feedback: [
        {
          id: '1',
          customer: 'Katarzyna Nowak',
          rating: 5,
          comment: 'Amazing service! Anna is very professional and the results exceeded my expectations.',
          date: '2024-06-28',
          service: 'Lip Enhancement',
          response: 'Thank you so much! It was a pleasure working with you.'
        },
        {
          id: '2',
          customer: 'Ewa Kowalska',
          rating: 4,
          comment: 'Great experience overall. The brow lamination looks fantastic.',
          date: '2024-06-27',
          service: 'Brow Lamination'
        }
      ],
      demographics: {
        ageGroups: [
          { range: '18-25', count: 25, percentage: 16 },
          { range: '26-35', count: 68, percentage: 44 },
          { range: '36-45', count: 45, percentage: 29 },
          { range: '46+', count: 18, percentage: 11 }
        ],
        gender: [
          { gender: 'Female', count: 148, percentage: 95 },
          { gender: 'Male', count: 8, percentage: 5 }
        ],
        locations: [
          { location: 'Warsaw', count: 120, percentage: 77 },
          { location: 'Kraków', count: 20, percentage: 13 },
          { location: 'Other', count: 16, percentage: 10 }
        ]
      }
    };
  };

  const loadEarningsData = async (providerId: string, period: string) => {
    // Mock earnings data
    const multiplier = period === 'week' ? 0.25 : period === 'quarter' ? 3 : 1;

    return {
      currentMonth: {
        gross: Math.floor(25500 * multiplier),
        net: Math.floor(17850 * multiplier),
        commission: Math.floor(5100 * multiplier),
        bonus: Math.floor(2500 * multiplier),
        total: Math.floor(22950 * multiplier)
      },
      ytd: {
        gross: 153000,
        net: 107100,
        commission: 30600,
        bonus: 12000,
        total: 137700
      },
      projections: {
        month: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          projected: Math.floor(Math.random() * 1000) + 500,
          actual: i < 25 ? Math.floor(Math.random() * 1200) + 400 : undefined
        })),
        quarterly: [
          { quarter: 'Q1', projected: 45000, actual: 48000 },
          { quarter: 'Q2', projected: 50000, actual: 51000 },
          { quarter: 'Q3', projected: 55000 },
          { quarter: 'Q4', projected: 60000 }
        ]
      },
      performance: [
        {
          metric: 'Bookings Target',
          current: 85,
          target: 80,
          achievement: 106,
          bonus: 500
        },
        {
          metric: 'Revenue Target',
          current: 25500,
          target: 24000,
          achievement: 106,
          bonus: 750
        },
        {
          metric: 'Customer Satisfaction',
          current: 96,
          target: 95,
          achievement: 101,
          bonus: 250
        },
        {
          metric: 'Completion Rate',
          current: 96.5,
          target: 95,
          achievement: 102,
          bonus: 500
        }
      ]
    };
  };

  const setupRealtimeUpdates = () => {
    // Set up real-time subscriptions for booking updates
    const subscription = supabase
      .channel('provider-updates')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
        },
        () => {
          loadProviderData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
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
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'upcoming': return 'text-yellow-600 bg-yellow-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPerformanceIcon = (current: number, target: number) => {
    const achievement = (current / target) * 100;
    if (achievement >= 100) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (achievement >= 80) return <Target className="h-4 w-4 text-yellow-600" />;
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
      </div>
    );
  }

  const COLORS = ['#8B4513', '#F5DEB3', '#CD853F', '#DEB887', '#D2691E'];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={metrics.profile.avatar} />
            <AvatarFallback>{metrics.profile.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{metrics.profile.name}</h1>
            <p className="text-slate-600">{metrics.profile.role}</p>
            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-medium">{metrics.profile.rating}</span>
                <span className="text-sm text-muted-foreground">({metrics.profile.totalReviews} reviews)</span>
              </div>
              <Badge className={metrics.profile.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                {metrics.profile.status}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Select value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as any)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule
          </Button>

          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>

          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Bookings</p>
                <p className="text-2xl font-bold text-slate-900">{metrics.performance.currentMonth.bookings}</p>
                <div className="flex items-center space-x-1 mt-1">
                  {metrics.performance.currentMonth.bookings > metrics.performance.previousMonth.bookings ? (
                    <TrendingUp className="h-3 w-3 text-green-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-600" />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {((metrics.performance.currentMonth.bookings - metrics.performance.previousMonth.bookings) / metrics.performance.previousMonth.bookings * 100).toFixed(1)}%
                  </span>
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
                <p className="text-sm font-medium text-slate-600">Revenue</p>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(metrics.performance.currentMonth.revenue)}</p>
                <div className="flex items-center space-x-1 mt-1">
                  {metrics.performance.currentMonth.revenue > metrics.performance.previousMonth.revenue ? (
                    <TrendingUp className="h-3 w-3 text-green-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-600" />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {((metrics.performance.currentMonth.revenue - metrics.performance.previousMonth.revenue) / metrics.performance.previousMonth.revenue * 100).toFixed(1)}%
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
                <p className="text-sm font-medium text-slate-600">Customers</p>
                <p className="text-2xl font-bold text-slate-900">{metrics.performance.currentMonth.customers}</p>
                <div className="flex items-center space-x-1 mt-1">
                  <Users className="h-3 w-3 text-purple-600" />
                  <span className="text-xs text-muted-foreground">
                    {metrics.customers.new} new, {metrics.customers.returning} returning
                  </span>
                </div>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Satisfaction</p>
                <div className="flex items-center space-x-1">
                  <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                  <span className="text-2xl font-bold text-slate-900">{metrics.performance.currentMonth.rating}</span>
                </div>
                <div className="flex items-center space-x-1 mt-1">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-muted-foreground">
                    {metrics.performance.currentMonth.completionRate}% completion rate
                  </span>
                </div>
              </div>
              <Award className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                  Revenue Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={metrics.performance.trends.revenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Area type="monotone" dataKey="amount" stroke="#8B4513" fill="#F5DEB3" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Service Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                  Service Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={metrics.services.performance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis yAxisId="bookings" orientation="left" />
                    <YAxis yAxisId="rating" orientation="right" domain={[0, 5]} />
                    <Tooltip />
                    <Bar yAxisId="bookings" dataKey="bookings" fill="#8B4513" name="Bookings" />
                    <Bar yAxisId="rating" dataKey="rating" fill="#F5DEB3" name="Rating" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Expertise Radar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2 text-purple-600" />
                  Expertise & Demand
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <RadarChart data={metrics.services.expertise}>
                    <PolarGrid strokeDasharray="3 3" />
                    <PolarAngleAxis dataKey="service" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Radar name="Proficiency" dataKey="proficiency" stroke="#8B4513" fill="#8B4513" fillOpacity={0.6} />
                    <Radar name="Demand" dataKey="demand" stroke="#CD853F" fill="#CD853F" fillOpacity={0.6} />
                    <Radar name="Satisfaction" dataKey="satisfaction" stroke="#F5DEB3" fill="#F5DEB3" fillOpacity={0.6} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Customer Demographics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-orange-600" />
                  Customer Demographics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Age Groups</h4>
                    <div className="space-y-2">
                      {metrics.customers.demographics.ageGroups.map((age) => (
                        <div key={age.range} className="flex items-center justify-between">
                          <span className="text-sm">{age.range}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${age.percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-xs w-10">{age.percentage}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Locations</h4>
                    <div className="space-y-2">
                      {metrics.customers.demographics.locations.map((location) => (
                        <div key={location.location} className="flex items-center justify-between">
                          <span className="text-sm">{location.location}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: `${location.percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-xs w-10">{location.percentage}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Today's Schedule */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                    Today's Schedule
                  </span>
                  <Badge className="bg-blue-100 text-blue-800">
                    {metrics.schedule.today.length} appointments
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.schedule.today.map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="text-center">
                          <p className="font-semibold">{appointment.time}</p>
                          <p className="text-xs text-muted-foreground">{formatDuration(appointment.duration)}</p>
                        </div>
                        <div className="border-l pl-3">
                          <p className="font-medium">{appointment.customer}</p>
                          <p className="text-sm text-muted-foreground">{appointment.service}</p>
                          {appointment.notes && (
                            <p className="text-xs text-blue-600 mt-1">{appointment.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(appointment.status)}>
                          {appointment.status}
                        </Badge>
                        <Button size="sm" variant="outline">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Contact
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Availability Stats */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Availability</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {metrics.schedule.availability.utilization}%
                      </div>
                      <p className="text-sm text-muted-foreground">Utilization Rate</p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-xl font-bold text-slate-900">
                          {metrics.schedule.availability.totalSlots}
                        </p>
                        <p className="text-xs text-muted-foreground">Total</p>
                      </div>
                      <div>
                        <p className="text-xl font-bold text-green-600">
                          {metrics.schedule.availability.bookedSlots}
                        </p>
                        <p className="text-xs text-muted-foreground">Booked</p>
                      </div>
                      <div>
                        <p className="text-xl font-bold text-orange-600">
                          {metrics.schedule.availability.availableSlots}
                        </p>
                        <p className="text-xs text-muted-foreground">Available</p>
                      </div>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-blue-600 h-3 rounded-full"
                        style={{ width: `${metrics.schedule.availability.utilization}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Week Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={metrics.schedule.week}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString('en', { weekday: 'short' })} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="bookings" fill="#8B4513" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Service Performance */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Service Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Service</th>
                        <th className="text-right p-2">Price</th>
                        <th className="text-right p-2">Bookings</th>
                        <th className="text-right p-2">Revenue</th>
                        <th className="text-right p-2">Rating</th>
                        <th className="text-right p-2">Completion</th>
                        <th className="text-right p-2">Profitability</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.services.performance.map((service) => (
                        <tr key={service.id} className="border-b hover:bg-slate-50">
                          <td className="p-2 font-medium">{service.name}</td>
                          <td className="text-right p-2">{formatCurrency(service.price)}</td>
                          <td className="text-right p-2">{service.bookings}</td>
                          <td className="text-right p-2">{formatCurrency(service.revenue)}</td>
                          <td className="text-right p-2">
                            <div className="flex items-center justify-end space-x-1">
                              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                              <span>{service.rating}</span>
                            </div>
                          </td>
                          <td className="text-right p-2">{formatPercentage(service.completionRate)}</td>
                          <td className="text-right p-2">
                            <span className={service.profitability > 0.7 ? 'text-green-600' : service.profitability > 0.5 ? 'text-yellow-600' : 'text-red-600'}>
                              {formatPercentage(service.profitability * 100)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Service Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <h4 className="font-medium text-green-900">Top Performer</h4>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      Lip Enhancement generates the highest revenue with excellent customer satisfaction.
                    </p>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Target className="h-4 w-4 text-blue-600" />
                      <h4 className="font-medium text-blue-900">Growth Opportunity</h4>
                    </div>
                    <p className="text-sm text-blue-700 mt-1">
                      Consider promoting Lash Lift more - it has high profit margins and growing demand.
                    </p>
                  </div>

                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <h4 className="font-medium text-yellow-900">Focus Area</h4>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">
                      Brow Lamination completion rates could be improved with better consultation process.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing Strategy */}
            <Card>
              <CardHeader>
                <CardTitle>Pricing Strategy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <h4 className="font-medium mb-2">Current Pricing Analysis</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span>Average Service Price</span>
                        <span className="font-medium">{formatCurrency(400)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Market Position</span>
                        <span className="font-medium text-green-600">Premium</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Price Elasticity</span>
                        <span className="font-medium">Low</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium mb-2">Recommendations</h4>
                    <ul className="space-y-1 text-sm text-blue-700">
                      <li>• Consider premium pricing for Lip Enhancement (+15%)</li>
                      <li>• Package deals for multiple services</li>
                      <li>• Seasonal promotions during slower periods</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-900">{metrics.customers.total}</p>
                    <p className="text-sm text-muted-foreground">Total Customers</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{metrics.customers.retention}%</p>
                    <p className="text-sm text-muted-foreground">Retention Rate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{metrics.customers.new}</p>
                    <p className="text-sm text-muted-foreground">New This Month</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{metrics.customers.returning}</p>
                    <p className="text-sm text-muted-foreground">Returning</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Feedback */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.customers.feedback.map((feedback) => (
                    <div key={feedback.id} className="border-b pb-4 last:border-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < feedback.rating
                                    ? 'text-yellow-500 fill-yellow-500'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="font-medium text-sm">{feedback.customer}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{feedback.date}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{feedback.comment}</p>
                      {feedback.response && (
                        <div className="p-2 bg-blue-50 rounded text-sm">
                          <p className="font-medium text-blue-900">Your response:</p>
                          <p className="text-blue-700">{feedback.response}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Customer Satisfaction */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Customer Satisfaction Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={metrics.performance.trends.ratings}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[4, 5]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="rating" stroke="#8B4513" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Earnings Tab */}
        <TabsContent value="earnings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Earnings Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Current Month Earnings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Gross Revenue</p>
                      <p className="text-xl font-bold">{formatCurrency(metrics.earnings.currentMonth.gross)}</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Net Earnings</p>
                      <p className="text-xl font-bold text-green-600">{formatCurrency(metrics.earnings.currentMonth.net)}</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Commission</p>
                      <p className="text-xl font-bold">{formatCurrency(metrics.earnings.currentMonth.commission)}</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Bonus</p>
                      <p className="text-xl font-bold">{formatCurrency(metrics.earnings.currentMonth.bonus)}</p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Total Earnings</span>
                      <span className="text-2xl font-bold text-green-600">
                        {formatCurrency(metrics.earnings.currentMonth.total)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Bonuses */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Bonuses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.earnings.performance.map((perf) => (
                    <div key={perf.metric} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        {getPerformanceIcon(perf.current, perf.target)}
                        <div>
                          <p className="font-medium text-sm">{perf.metric}</p>
                          <p className="text-xs text-muted-foreground">
                            {perf.current} / {perf.target} ({perf.achievement}%)
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          {formatCurrency(perf.bonus || 0)}
                        </p>
                        <Progress value={Math.min(perf.achievement, 100)} className="w-20 h-1 mt-1" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Revenue Projections */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Revenue Projections vs Actual</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metrics.earnings.projections.month}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                    <Line type="monotone" dataKey="projected" stroke="#8B4513" strokeDasharray="5 5" name="Projected" />
                    <Line type="monotone" dataKey="actual" stroke="#F5DEB3" strokeWidth={2} name="Actual" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Year-to-Date Summary */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Year-to-Date Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-900">
                      {formatCurrency(metrics.earnings.ytd.gross)}
                    </p>
                    <p className="text-sm text-muted-foreground">Gross Revenue</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(metrics.earnings.ytd.net)}
                    </p>
                    <p className="text-sm text-muted-foreground">Net Earnings</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(metrics.earnings.ytd.commission)}
                    </p>
                    <p className="text-sm text-muted-foreground">Commission</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {formatCurrency(metrics.earnings.ytd.bonus)}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Bonus</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Trends */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={metrics.performance.trends.bookings}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="count" stroke="#8B4513" fill="#F5DEB3" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Key Performance Indicators */}
            <Card>
              <CardHeader>
                <CardTitle>Key Performance Indicators</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Booking Success Rate</span>
                    <span className="font-semibold">{metrics.performance.currentMonth.completionRate}%</span>
                  </div>
                  <Progress value={metrics.performance.currentMonth.completionRate} className="h-2" />

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Customer Satisfaction</span>
                    <span className="font-semibold">{metrics.customers.satisfaction}%</span>
                  </div>
                  <Progress value={metrics.customers.satisfaction} className="h-2" />

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Schedule Utilization</span>
                    <span className="font-semibold">{metrics.schedule.availability.utilization}%</span>
                  </div>
                  <Progress value={metrics.schedule.availability.utilization} className="h-2" />

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Service Quality Score</span>
                    <span className="font-semibold">{metrics.performance.currentMonth.rating}/5.0</span>
                  </div>
                  <Progress value={(metrics.performance.currentMonth.rating / 5) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Goals & Achievements */}
            <Card>
              <CardHeader>
                <CardTitle>Goals & Achievements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Award className="h-4 w-4 text-green-600" />
                      <h4 className="font-medium text-green-900">Monthly Goals Achieved</h4>
                    </div>
                    <div className="space-y-1 text-sm text-green-700">
                      <p>✓ Booking target exceeded by 6%</p>
                      <p>✓ Revenue target exceeded by 6%</p>
                      <p>✓ Customer satisfaction maintained above 95%</p>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Target className="h-4 w-4 text-blue-600" />
                      <h4 className="font-medium text-blue-900">Next Month Goals</h4>
                    </div>
                    <div className="space-y-1 text-sm text-blue-700">
                      <p>• Increase bookings by 10%</p>
                      <p>• Maintain 95%+ satisfaction rating</p>
                      <p>• Add 5 new customers</p>
                      <p>• Complete advanced certification</p>
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

const formatPercentage = (value: number) => {
  return `${value.toFixed(1)}%`;
};

export default ServiceProviderDashboard;