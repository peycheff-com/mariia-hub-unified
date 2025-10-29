import React, { useState, useEffect } from 'react';
import { Star, TrendingUp, DollarSign, Calendar, Search, Download, Filter } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { format } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ServiceData {
  id: string;
  name: string;
  category: string;
  totalBookings: number;
  revenue: number;
  averageRating: number;
  completionRate: number;
  totalReviews: number;
}

interface CategoryData {
  category: string;
  bookings: number;
  revenue: number;
  services: number;
}

interface ServicePopularityProps {
  dateRange: { from: Date; to: Date };
}

export function ServicePopularity({ dateRange }: ServicePopularityProps) {
  const [serviceData, setServiceData] = useState<ServiceData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'bookings' | 'revenue' | 'rating'>('bookings');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'chart'>('list');
  const { toast } = useToast();

  useEffect(() => {
    fetchServiceData();
  }, [dateRange, sortBy]);

  const fetchServiceData = async () => {
    setLoading(true);
    try {
      // Get services with booking counts
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select(`
          id,
          title,
          category,
          price,
          reviews!inner(rating)
        `);

      if (servicesError) throw servicesError;

      // Get bookings for the date range
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          service_id,
          total_amount,
          status,
          review_id
        `)
        .gte('booking_date', dateRange.from.toISOString())
        .lte('booking_date', dateRange.to.toISOString())
        .in('status', ['confirmed', 'completed']);

      if (bookingsError) throw bookingsError;

      // Process service data
      const serviceMap = new Map<string, ServiceData>();

      // Initialize with all services
      services?.forEach(service => {
        serviceMap.set(service.id, {
          id: service.id,
          name: service.title,
          category: service.category,
          totalBookings: 0,
          revenue: 0,
          averageRating: 0,
          completionRate: 0,
          totalReviews: 0,
        });
      });

      // Process bookings
      const completedBookings = bookings?.filter(b => b.status === 'completed') || [];
      const confirmedBookings = bookings || [];

      confirmedBookings.forEach(booking => {
        const service = serviceMap.get(booking.service_id);
        if (service) {
          service.totalBookings += 1;
          service.revenue += parseFloat(booking.total_amount) || 0;
        }
      });

      // Calculate completion rate
      serviceMap.forEach(service => {
        if (service.totalBookings > 0) {
          const completedCount = completedBookings.filter(b => b.service_id === service.id).length;
          service.completionRate = (completedCount / service.totalBookings) * 100;
        }
      });

      // Calculate average ratings
      services?.forEach(service => {
        const ratings = service.reviews?.map(r => r.rating).filter(Boolean) || [];
        const serviceData = serviceMap.get(service.id);
        if (serviceData && ratings.length > 0) {
          serviceData.averageRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
          serviceData.totalReviews = ratings.length;
        }
      });

      // Convert to array and sort
      let dataArray = Array.from(serviceMap.values());

      // Filter by category if selected
      if (filterCategory !== 'all') {
        dataArray = dataArray.filter(s => s.category === filterCategory);
      }

      // Filter by search term
      if (searchTerm) {
        dataArray = dataArray.filter(s =>
          s.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Sort data
      dataArray.sort((a, b) => {
        switch (sortBy) {
          case 'revenue':
            return b.revenue - a.revenue;
          case 'rating':
            return b.averageRating - a.averageRating;
          default:
            return b.totalBookings - a.totalBookings;
        }
      });

      setServiceData(dataArray);

      // Process category data
      const categoryMap = new Map<string, CategoryData>();

      dataArray.forEach(service => {
        const existing = categoryMap.get(service.category) || {
          category: service.category,
          bookings: 0,
          revenue: 0,
          services: 0,
        };

        existing.bookings += service.totalBookings;
        existing.revenue += service.revenue;
        existing.services += 1;

        categoryMap.set(service.category, existing);
      });

      const categoryArray = Array.from(categoryMap.values())
        .sort((a, b) => b.bookings - a.bookings);

      setCategoryData(categoryArray);
    } catch (error) {
      console.error('Error fetching service data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch service popularity data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const csv = [
      ['Service', 'Category', 'Bookings', 'Revenue', 'Avg Rating', 'Completion Rate', 'Reviews'],
      ...serviceData.map(service => [
        service.name,
        service.category,
        service.totalBookings.toString(),
        service.revenue.toFixed(2),
        service.averageRating.toFixed(1),
        `${service.completionRate.toFixed(1)}%`,
        service.totalReviews.toString(),
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `service-popularity-${format(dateRange.from, 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const COLORS = ['#8B4513', '#D2691E', '#F5DEB3', '#228B22', '#4169E1', '#9370DB'];

  const totalRevenue = serviceData.reduce((sum, s) => sum + s.revenue, 0);
  const totalBookings = serviceData.reduce((sum, s) => sum + s.totalBookings, 0);
  const averageRating = serviceData.length > 0
    ? serviceData.reduce((sum, s) => sum + s.averageRating, 0) / serviceData.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-charcoal/50 border-graphite/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-champagne flex items-center gap-2 text-lg">
              <Calendar className="w-4 h-4" />
              Total Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-pearl">{totalBookings.toLocaleString()}</p>
            <p className="text-champagne/70 text-sm">All services</p>
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
            <p className="text-champagne/70 text-sm">From all bookings</p>
          </CardContent>
        </Card>

        <Card className="bg-charcoal/50 border-graphite/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-champagne flex items-center gap-2 text-lg">
              <Star className="w-4 h-4" />
              Avg Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-pearl">{averageRating.toFixed(1)}</p>
            <p className="text-champagne/70 text-sm">Across all services</p>
          </CardContent>
        </Card>

        <Card className="bg-charcoal/50 border-graphite/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-champagne flex items-center gap-2 text-lg">
              <TrendingUp className="w-4 h-4" />
              Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-pearl">{serviceData.length}</p>
            <p className="text-champagne/70 text-sm">Active services</p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card className="bg-charcoal/50 border-graphite/30">
        <CardHeader>
          <CardTitle className="text-pearl">Service Popularity Analysis</CardTitle>
          <CardDescription className="text-champagne/70">
            Most booked services and revenue performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-champagne/70" />
              <Input
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 bg-charcoal border-graphite/50"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-48 bg-charcoal border-graphite/50">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categoryData.map(cat => (
                  <SelectItem key={cat.category} value={cat.category}>
                    {cat.category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-48 bg-charcoal border-graphite/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bookings">Sort by Bookings</SelectItem>
                <SelectItem value="revenue">Sort by Revenue</SelectItem>
                <SelectItem value="rating">Sort by Rating</SelectItem>
              </SelectContent>
            </Select>
            <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
              <SelectTrigger className="w-32 bg-charcoal border-graphite/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="list">List View</SelectItem>
                <SelectItem value="chart">Chart View</SelectItem>
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

          {/* Category Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-champagne font-medium mb-3">Bookings by Category</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="bookings"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div>
              <h3 className="text-champagne font-medium mb-3">Revenue by Category</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                      labelStyle={{ color: '#fff' }}
                      formatter={(value: any) => [`$${value.toFixed(2)}`, 'Revenue']}
                    />
                    <Bar dataKey="revenue" fill="#8B4513" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Service List */}
          {viewMode === 'list' ? (
            <div className="space-y-3">
              {serviceData.slice(0, 20).map((service, index) => (
                <div key={service.id} className="flex items-center justify-between p-4 rounded-lg bg-charcoal/30 hover:bg-charcoal/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-lg font-bold text-champagne">#{index + 1}</span>
                      <h4 className="text-pearl font-medium">{service.name}</h4>
                      <Badge variant="secondary" className="bg-graphite/50 text-champagne">
                        {service.category}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      {service.totalReviews > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="text-champagne">{service.averageRating.toFixed(1)}</span>
                          <span className="text-champagne/70">({service.totalReviews})</span>
                        </div>
                      )}
                      <span className="text-champagne/70">
                        {service.completionRate.toFixed(1)}% completion
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-pearl font-bold">{service.totalBookings}</p>
                      <p className="text-champagne/70 text-sm">bookings</p>
                    </div>
                    <div className="text-right">
                      <p className="text-champagne font-bold">${service.revenue.toFixed(2)}</p>
                      <p className="text-champagne/70 text-sm">revenue</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serviceData.slice(0, 10)} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={150} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                    labelStyle={{ color: '#fff' }}
                    formatter={(value: any, name: string) => [
                      name === 'totalBookings' ? value : `$${value.toFixed(2)}`,
                      name === 'totalBookings' ? 'Bookings' : 'Revenue'
                    ]}
                  />
                  <Bar dataKey="totalBookings" fill="#8B4513" name="Bookings" />
                  <Bar dataKey="revenue" fill="#D2691E" name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}