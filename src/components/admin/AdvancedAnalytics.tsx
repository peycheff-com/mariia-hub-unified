import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Download, TrendingUp, Users, DollarSign, Activity, Eye, ShoppingCart, MessageSquare, Smartphone } from "lucide-react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface AnalyticsData {
  overview: {
    totalUsers: number;
    totalSessions: number;
    totalRevenue: number;
    totalBookings: number;
    conversionRate: number;
    averageSessionDuration: number;
    bounceRate: number;
    returningUsers: number;
  };
  traffic: {
    sources: Array<{ source: string; users: number; sessions: number; percentage: number }>;
    devices: Array<{ device: string; users: number; percentage: number }>;
    pages: Array<{ page: string; views: number; uniqueViews: number; avgTime: number }>;
  };
  bookings: {
    byDate: Array<{ date: string; bookings: number; revenue: number }>;
    byService: Array<{ service: string; count: number; revenue: number }>;
    byStatus: Array<{ status: string; count: number; percentage: number }>;
    funnel: Array<{ step: string; users: number; dropoff: number; conversion: number }>;
  };
  communications: {
    byType: Array<{ type: string; sent: number; delivered: number; failed: number }>;
    byDate: Array<{ date: string; whatsapp: number; sms: number; email: number }>;
  };
  realTime: {
    activeUsers: number;
    currentSessions: Array<{
      id: string;
      page: string;
      duration: number;
      source: string;
      device: string;
    }>;
  };
}

const COLORS = ['#D4A574', '#8B4513', '#F5DEB3', '#DEB887', '#D2691E', '#BC8F8F'];

export const AdvancedAnalytics = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    loadAnalytics();

    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        loadAnalytics();
      }, 30000); // Refresh every 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [dateRange, autoRefresh]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Simulate API call - replace with actual analytics API
      const mockData: AnalyticsData = {
        overview: {
          totalUsers: 12847,
          totalSessions: 45623,
          totalRevenue: 156780,
          totalBookings: 892,
          conversionRate: 3.2,
          averageSessionDuration: 245,
          bounceRate: 28.5,
          returningUsers: 5234
        },
        traffic: {
          sources: [
            { source: 'Organic Search', users: 4523, sessions: 12345, percentage: 35.2 },
            { source: 'Direct', users: 3211, sessions: 9876, percentage: 25.1 },
            { source: 'Social Media', users: 2134, sessions: 6543, percentage: 16.7 },
            { source: 'Referral', users: 1567, sessions: 4321, percentage: 12.3 },
            { source: 'Paid Ads', users: 1234, sessions: 3456, percentage: 9.8 },
            { source: 'Other', users: 178, sessions: 876, percentage: 0.9 }
          ],
          devices: [
            { device: 'Mobile', users: 8234, percentage: 64.1 },
            { device: 'Desktop', users: 3890, percentage: 30.3 },
            { device: 'Tablet', users: 723, percentage: 5.6 }
          ],
          pages: [
            { page: '/beauty', views: 12456, uniqueViews: 8234, avgTime: 156 },
            { page: '/fitness', views: 9876, uniqueViews: 6789, avgTime: 134 },
            { page: '/book', views: 5678, uniqueViews: 3456, avgTime: 423 },
            { page: '/beauty/services', views: 4567, uniqueViews: 3234, avgTime: 189 },
            { page: '/', views: 3456, uniqueViews: 2345, avgTime: 67 }
          ]
        },
        bookings: {
          byDate: Array.from({ length: 30 }, (_, i) => ({
            date: format(subDays(new Date(), 29 - i), 'MMM dd'),
            bookings: Math.floor(Math.random() * 30) + 15,
            revenue: Math.floor(Math.random() * 5000) + 2000
          })),
          byService: [
            { service: 'Lip Enhancement', count: 234, revenue: 58500 },
            { service: 'Brow Lamination', count: 198, revenue: 29700 },
            { service: 'Personal Training', count: 156, revenue: 39000 },
            { service: 'Makeup', count: 134, revenue: 26800 },
            { service: 'Glutes Program', count: 98, revenue: 14700 }
          ],
          byStatus: [
            { status: 'confirmed', count: 623, percentage: 69.8 },
            { status: 'completed', count: 198, percentage: 22.2 },
            { status: 'cancelled', count: 45, percentage: 5.0 },
            { status: 'pending', count: 26, percentage: 2.9 }
          ],
          funnel: [
            { step: 'Service View', users: 5678, dropoff: 0, conversion: 100 },
            { step: 'Time Selection', users: 2345, dropoff: 58.7, conversion: 41.3 },
            { step: 'Details Form', users: 1567, dropoff: 33.1, conversion: 27.6 },
            { step: 'Payment', users: 1234, dropoff: 21.3, conversion: 21.7 },
            { step: 'Booking Complete', users: 892, dropoff: 27.7, conversion: 15.7 }
          ]
        },
        communications: {
          byType: [
            { type: 'Email', sent: 3421, delivered: 3234, failed: 45 },
            { type: 'WhatsApp', sent: 1234, delivered: 1198, failed: 12 },
            { type: 'SMS', sent: 567, delivered: 543, failed: 8 }
          ],
          byDate: Array.from({ length: 7 }, (_, i) => ({
            date: format(subDays(new Date(), 6 - i), 'EEE'),
            whatsapp: Math.floor(Math.random() * 50) + 20,
            sms: Math.floor(Math.random() * 30) + 10,
            email: Math.floor(Math.random() * 100) + 50
          }))
        },
        realTime: {
          activeUsers: 23,
          currentSessions: [
            { id: '1', page: '/beauty', duration: 123, source: 'organic', device: 'mobile' },
            { id: '2', page: '/book', duration: 456, source: 'direct', device: 'desktop' },
            { id: '3', page: '/fitness', duration: 78, source: 'social', device: 'mobile' },
            { id: '4', page: '/beauty/services', duration: 234, source: 'referral', device: 'tablet' },
            { id: '5', page: '/', duration: 45, source: 'organic', device: 'mobile' }
          ]
        }
      };

      setData(mockData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    if (!data) return;

    const csvContent = [
      ['Metric', 'Value'],
      ['Total Users', data.overview.totalUsers],
      ['Total Sessions', data.overview.totalSessions],
      ['Total Revenue', data.overview.totalRevenue],
      ['Total Bookings', data.overview.totalBookings],
      ['Conversion Rate', `${data.overview.conversionRate}%`],
      ['Bounce Rate', `${data.overview.bounceRate}%`],
      ...data.bookings.byService.map(s => [s.service, s.count, `€${s.revenue}`])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Advanced Analytics</h2>
          <p className="text-muted-foreground">Comprehensive insights into your business performance</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant={autoRefresh ? "default" : "outline"}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className="w-4 h-4 mr-2" />
            Auto-refresh
          </Button>
          <Button onClick={exportData} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{Math.floor(Math.random() * 20 + 5)}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{data.overview.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{Math.floor(Math.random() * 15 + 8)}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bookings</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.totalBookings}</div>
            <p className="text-xs text-muted-foreground">
              Conversion rate: {data.overview.conversionRate}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Now</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.realTime.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              Real-time users
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="traffic" className="w-full">
        <TabsList>
          <TabsTrigger value="traffic">Traffic Analysis</TabsTrigger>
          <TabsTrigger value="bookings">Booking Analytics</TabsTrigger>
          <TabsTrigger value="communications">Communications</TabsTrigger>
          <TabsTrigger value="realtime">Real-time</TabsTrigger>
        </TabsList>

        <TabsContent value="traffic" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Traffic Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.traffic.sources}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="users"
                      label={({ source, percentage }) => `${source}: ${percentage}%`}
                    >
                      {data.traffic.sources.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Device Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.traffic.devices}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="device" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="users" fill="#D4A574" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top Pages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.traffic.pages.map((page, index) => (
                  <div key={page.page} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <div>
                        <p className="font-medium">{page.page}</p>
                        <p className="text-sm text-muted-foreground">
                          {page.uniqueViews} unique views • Avg: {Math.floor(page.avgTime / 60)}m {page.avgTime % 60}s
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{page.views.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">views</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Booking Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={data.bookings.byDate}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Area yAxisId="left" type="monotone" dataKey="bookings" stroke="#D4A574" fill="#D4A574" fillOpacity={0.6} />
                  <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#8B4513" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Service Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.bookings.byService} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="service" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#D4A574" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Booking Funnel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.bookings.funnel.map((step, index) => (
                    <div key={step.step}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{step.step}</span>
                        <span className="text-sm text-muted-foreground">
                          {step.users} users ({step.conversion}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${step.conversion}%` }}
                         />
                      </div>
                      {step.dropoff > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {step.dropoff}% dropoff
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="communications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Communication Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.communications.byDate}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="email" stroke="#8884d8" strokeWidth={2} />
                  <Line type="monotone" dataKey="whatsapp" stroke="#25D366" strokeWidth={2} />
                  <Line type="monotone" dataKey="sms" stroke="#007bff" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {data.communications.byType.map((type) => (
              <Card key={type.type}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium capitalize">{type.type}</CardTitle>
                  {type.type === 'email' && <Mail className="h-4 w-4 text-muted-foreground" />}
                  {type.type === 'whatsapp' && <MessageSquare className="h-4 w-4 text-muted-foreground" />}
                  {type.type === 'sms' && <Smartphone className="h-4 w-4 text-muted-foreground" />}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Sent</span>
                      <span className="font-semibold">{type.sent}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Delivered</span>
                      <span className="font-semibold text-green-600">{type.delivered}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Failed</span>
                      <span className="font-semibold text-red-600">{type.failed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Rate</span>
                      <span className="font-semibold">
                        {((type.delivered / type.sent) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="realtime" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{data.realTime.activeUsers}</div>
                <p className="text-sm text-muted-foreground">Currently online</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.realTime.currentSessions.length}</div>
                <p className="text-sm text-muted-foreground">Active sessions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Avg Duration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {Math.floor(
                    data.realTime.currentSessions.reduce((acc, s) => acc + s.duration, 0) /
                    data.realTime.currentSessions.length / 60
                  )}m
                </div>
                <p className="text-sm text-muted-foreground">Session length</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Live Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.realTime.currentSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <div>
                        <p className="font-medium">{session.page}</p>
                        <p className="text-sm text-muted-foreground">
                          {session.source} • {session.device} • {Math.floor(session.duration / 60)}m {session.duration % 60}s
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};