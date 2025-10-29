import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { format, subDays, subMonths, startOfDay, endOfDay, isWithinInterval, parseISO } from 'date-fns';
import { pl, enUS } from 'date-fns/locale';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar as CalendarIcon2,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  Download,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  UserCheck,
  ShoppingCart,
  Target,
  Clock,
  MapPin,
  Smartphone,
  Monitor,
  Tablet,
  Zap,
  AlertCircle,
  CheckCircle,
  Info,
  Mail,
  Phone,
  MessageSquare,
  Heart,
  Share2,
  Star,
  ThumbsUp,
  CreditCard,
  Package,
  Repeat,
  Timer,
  Award,
  Gift,
  Tag,
  Percent,
  Layers,
  Network,
  Globe,
  Building,
  Map,
  Navigation,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Button,
} from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Badge,
} from '@/components/ui/badge';
import {
  Separator,
} from '@/components/ui/separator';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Progress,
} from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Calendar,
  Calendar as CalendarIcon,
} from '@/components/ui/calendar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';


// Recharts imports

// Icons

import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdownMenu';

// Types
interface AnalyticsData {
  revenue: RevenueData[];
  bookings: BookingData[];
  customers: CustomerData[];
  services: ServicePerformanceData[];
  providers: ProviderPerformanceData[];
  geographic: GeographicData[];
  devices: DeviceData[];
  sources: TrafficSourceData[];
  conversions: ConversionData[];
  retention: RetentionData[];
}

interface RevenueData {
  date: string;
  revenue: number;
  bookings: number;
  avgOrderValue: number;
  refunds: number;
  netRevenue: number;
  target: number;
  variance: number;
}

interface BookingData {
  date: string;
  total: number;
  completed: number;
  cancelled: number;
  noShows: number;
  rescheduled: number;
  revenue: number;
  conversionRate: number;
}

interface CustomerData {
  date: string;
  newCustomers: number;
  returningCustomers: number;
  totalCustomers: number;
  churnRate: number;
  retentionRate: number;
  lifetimeValue: number;
}

interface ServicePerformanceData {
  id: string;
  name: string;
  category: string;
  bookings: number;
  revenue: number;
  rating: number;
  completionRate: number;
  avgBookingValue: number;
  popularity: number;
  growth: number;
}

interface ProviderPerformanceData {
  id: string;
  name: string;
  services: number;
  bookings: number;
  revenue: number;
  rating: number;
  completionRate: number;
  avgRevenuePerBooking: number;
  utilization: number;
}

interface GeographicData {
  city: string;
  country: string;
  coordinates: [number, number];
  bookings: number;
  revenue: number;
  customers: number;
  growth: number;
}

interface DeviceData {
  device: 'desktop' | 'mobile' | 'tablet';
  sessions: number;
  users: number;
  bookings: number;
  revenue: number;
  conversionRate: number;
}

interface TrafficSourceData {
  source: string;
  medium: string;
  sessions: number;
  users: number;
  bookings: number;
  revenue: number;
  conversionRate: number;
  cost: number;
  roi: number;
}

interface ConversionData {
  stage: string;
  count: number;
  rate: number;
  dropOff: number;
  avgTime: number;
}

interface RetentionData {
  cohort: string;
  size: number;
  day1: number;
  day7: number;
  day30: number;
  day90: number;
}

interface AdvancedAnalyticsProps {
  className?: string;
}

const COLORS = ['#8B4513', '#F5DEB3', '#D2691E', '#DEB887', '#BC8F8F', '#F4A460', '#D2B48C', '#FFE4B5'];

const dateLocales = {
  en: enUS,
  pl: pl,
};

export function AdvancedAnalytics({ className }: AdvancedAnalyticsProps) {
  const { t, i18n } = useTranslation();
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [selectedProvider, setSelectedProvider] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonRange, setComparisonRange] = useState('previousPeriod');

  // Fetch analytics data
  const { data: analyticsData, isLoading, refetch } = useQuery({
    queryKey: ['advanced-analytics', dateRange],
    queryFn: async () => {
      // Mock data generation - in production, this would fetch from your analytics service
      const generateRevenueData = (): RevenueData[] => {
        const data: RevenueData[] = [];
        const days = Math.ceil((dateRange.to!.getTime() - dateRange.from!.getTime()) / (1000 * 60 * 60 * 24));

        for (let i = 0; i < days; i++) {
          const date = format(subDays(dateRange.to!, days - i - 1), 'yyyy-MM-dd');
          const revenue = Math.floor(Math.random() * 5000) + 10000;
          const bookings = Math.floor(Math.random() * 20) + 40;
          const target = 15000;

          data.push({
            date,
            revenue,
            bookings,
            avgOrderValue: revenue / bookings,
            refunds: Math.floor(Math.random() * 500),
            netRevenue: revenue - Math.floor(Math.random() * 500),
            target,
            variance: ((revenue - target) / target) * 100,
          });
        }

        return data.reverse();
      };

      const generateBookingData = (): BookingData[] => {
        const data: BookingData[] = [];
        const days = Math.ceil((dateRange.to!.getTime() - dateRange.from!.getTime()) / (1000 * 60 * 60 * 24));

        for (let i = 0; i < days; i++) {
          const date = format(subDays(dateRange.to!, days - i - 1), 'yyyy-MM-dd');
          const total = Math.floor(Math.random() * 20) + 40;
          const completed = Math.floor(total * 0.85);
          const cancelled = Math.floor(total * 0.05);
          const noShows = Math.floor(total * 0.05);
          const rescheduled = Math.floor(total * 0.05);

          data.push({
            date,
            total,
            completed,
            cancelled,
            noShows,
            rescheduled,
            revenue: completed * 250,
            conversionRate: Math.random() * 10 + 15,
          });
        }

        return data.reverse();
      };

      const generateServicePerformance = (): ServicePerformanceData[] => [
        {
          id: '1',
          name: 'Lip Enhancement',
          category: 'beauty',
          bookings: 125,
          revenue: 37500,
          rating: 4.8,
          completionRate: 98,
          avgBookingValue: 300,
          popularity: 92,
          growth: 15,
        },
        {
          id: '2',
          name: 'Personal Training',
          category: 'fitness',
          bookings: 89,
          revenue: 22250,
          rating: 4.9,
          completionRate: 96,
          avgBookingValue: 250,
          popularity: 88,
          growth: 22,
        },
        {
          id: '3',
          name: 'Brow Lamination',
          category: 'beauty',
          bookings: 167,
          revenue: 16700,
          rating: 4.7,
          completionRate: 99,
          avgBookingValue: 100,
          popularity: 95,
          growth: 8,
        },
      ];

      const generateGeographicData = (): GeographicData[] => [
        {
          city: 'Warsaw',
          country: 'Poland',
          coordinates: [52.2297, 21.0122],
          bookings: 342,
          revenue: 85500,
          customers: 189,
          growth: 18,
        },
        {
          city: 'Kraków',
          country: 'Poland',
          coordinates: [50.0647, 19.9450],
          bookings: 128,
          revenue: 32000,
          customers: 71,
          growth: 25,
        },
        {
          city: 'Wrocław',
          country: 'Poland',
          coordinates: [51.1079, 17.0385],
          bookings: 96,
          revenue: 24000,
          customers: 53,
          growth: 12,
        },
      ];

      return {
        revenue: generateRevenueData(),
        bookings: generateBookingData(),
        customers: [],
        services: generateServicePerformance(),
        providers: [],
        geographic: generateGeographicData(),
        devices: [
          { device: 'desktop', sessions: 1254, users: 892, bookings: 156, revenue: 39000, conversionRate: 12.4 },
          { device: 'mobile', sessions: 2341, users: 1876, bookings: 234, revenue: 58500, conversionRate: 10.0 },
          { device: 'tablet', sessions: 456, users: 321, bookings: 45, revenue: 11250, conversionRate: 9.9 },
        ],
        sources: [
          { source: 'organic', medium: 'search', sessions: 2341, users: 1876, bookings: 234, revenue: 58500, conversionRate: 10.0, cost: 0, roi: Infinity },
          { source: 'facebook', medium: 'social', sessions: 1234, users: 987, bookings: 123, revenue: 30750, conversionRate: 10.0, cost: 2500, roi: 1230 },
          { source: 'instagram', medium: 'social', sessions: 987, users: 789, bookings: 98, revenue: 24500, conversionRate: 9.9, cost: 1800, roi: 1261 },
        ],
        conversions: [
          { stage: 'Visit', count: 4051, rate: 100, dropOff: 35, avgTime: 0.5 },
          { stage: 'Browse', count: 2633, rate: 65, dropOff: 45, avgTime: 2.3 },
          { stage: 'Select Service', count: 1448, rate: 36, dropOff: 25, avgTime: 5.1 },
          { stage: 'Book', count: 1086, rate: 27, dropOff: 10, avgTime: 8.7 },
          { stage: 'Complete', count: 977, rate: 24, dropOff: 0, avgTime: 12.3 },
        ],
        retention: [],
      } as AnalyticsData;
    },
  });

  // Calculate KPIs
  const kpis = useMemo(() => {
    if (!analyticsData) return null;

    const totalRevenue = analyticsData.revenue.reduce((sum, r) => sum + r.netRevenue, 0);
    const totalBookings = analyticsData.revenue.reduce((sum, r) => sum + r.bookings, 0);
    const avgOrderValue = totalRevenue / totalBookings;
    const totalCustomers = analyticsData.geographic.reduce((sum, g) => sum + g.customers, 0);
    const conversionRate = (totalBookings / 4051) * 100; // Total visits from mock data

    return {
      totalRevenue,
      totalBookings,
      avgOrderValue,
      totalCustomers,
      conversionRate,
    };
  }, [analyticsData]);

  // Export functionality
  const handleExport = (format: 'csv' | 'pdf') => {
    toast.info(t('admin.analytics.exporting', { format }));
    // Implementation would go here
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name.includes('Rate') ? `${entry.value}%` : entry.name.includes('Revenue') || entry.name.includes('Value') ? `€${entry.value.toLocaleString()}` : entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className={cn("space-y-6", className)}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('admin.analytics.title')}</h1>
            <p className="text-muted-foreground mt-2">{t('admin.analytics.description')}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Date Range Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <CalendarIcon2 className="w-4 h-4 mr-2" />
                  {dateRange.from && dateRange.to
                    ? `${format(dateRange.from, 'dd MMM yyyy')} - ${format(dateRange.to, 'dd MMM yyyy')}`
                    : t('admin.analytics.selectDateRange')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => setDateRange(range || {})}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {/* Comparison Toggle */}
            <Button
              variant={showComparison ? "default" : "outline"}
              onClick={() => setShowComparison(!showComparison)}
            >
              <Activity className="w-4 h-4 mr-2" />
              {t('admin.analytics.compare')}
            </Button>

            {/* Export */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  {t('admin.analytics.export')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExport('csv')}>
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('pdf')}>
                  Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        {kpis && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  {t('admin.analytics.totalRevenue')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">€{kpis.totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3 text-green-500" />
                  +15.3% {t('admin.analytics.fromLastMonth')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CalendarIcon2 className="w-4 h-4" />
                  {t('admin.analytics.totalBookings')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.totalBookings.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3 text-green-500" />
                  +8.7% {t('admin.analytics.fromLastMonth')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  {t('admin.analytics.avgOrderValue')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">€{Math.round(kpis.avgOrderValue).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3 text-green-500" />
                  +5.2% {t('admin.analytics.fromLastMonth')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {t('admin.analytics.totalCustomers')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.totalCustomers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3 text-green-500" />
                  +12.4% {t('admin.analytics.fromLastMonth')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  {t('admin.analytics.conversionRate')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.conversionRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <ArrowDownRight className="w-3 h-3 text-red-500" />
                  -2.1% {t('admin.analytics.fromLastMonth')}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Charts */}
        <Tabs defaultValue="revenue" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="revenue">{t('admin.analytics.revenue')}</TabsTrigger>
            <TabsTrigger value="bookings">{t('admin.analytics.bookings')}</TabsTrigger>
            <TabsTrigger value="services">{t('admin.analytics.services')}</TabsTrigger>
            <TabsTrigger value="geographic">{t('admin.analytics.geographic')}</TabsTrigger>
            <TabsTrigger value="traffic">{t('admin.analytics.trafficSources')}</TabsTrigger>
            <TabsTrigger value="conversion">{t('admin.analytics.conversion')}</TabsTrigger>
          </TabsList>

          {/* Revenue Tab */}
          <TabsContent value="revenue" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('admin.analytics.revenueTrend')}</CardTitle>
                  <CardDescription>{t('admin.analytics.revenueTrendDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analyticsData?.revenue}>
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8B4513" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8B4513" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(value) => format(parseISO(value), 'dd MMM')}
                      />
                      <YAxis tickFormatter={(value) => `€${value/1000}k`} />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#8B4513"
                        fillOpacity={1}
                        fill="url(#revenueGradient)"
                        name="Revenue"
                      />
                      {showComparison && (
                        <Area
                          type="monotone"
                          dataKey="target"
                          stroke="#D2691E"
                          fillOpacity={0.3}
                          name="Target"
                        />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('admin.analytics.revenueByDay')}</CardTitle>
                  <CardDescription>{t('admin.analytics.revenueByDayDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData?.revenue.slice(-7)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(value) => format(parseISO(value), 'EEE')}
                      />
                      <YAxis tickFormatter={(value) => `€${value/1000}k`} />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Bar dataKey="netRevenue" fill="#8B4513" name="Net Revenue" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Revenue Table */}
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.analytics.revenueDetails')}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin.analytics.date')}</TableHead>
                      <TableHead>{t('admin.analytics.revenue')}</TableHead>
                      <TableHead>{t('admin.analytics.bookings')}</TableHead>
                      <TableHead>{t('admin.analytics.avgOrderValue')}</TableHead>
                      <TableHead>{t('admin.analytics.variance')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analyticsData?.revenue.slice(-10).map((row) => (
                      <TableRow key={row.date}>
                        <TableCell>{format(parseISO(row.date), 'dd MMM yyyy')}</TableCell>
                        <TableCell>€{row.revenue.toLocaleString()}</TableCell>
                        <TableCell>{row.bookings}</TableCell>
                        <TableCell>€{Math.round(row.avgOrderValue).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={row.variance > 0 ? 'default' : 'destructive'} className={row.variance > 0 ? 'bg-green-100 text-green-800' : ''}>
                            {row.variance > 0 ? '+' : ''}{row.variance.toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('admin.analytics.bookingTrend')}</CardTitle>
                  <CardDescription>{t('admin.analytics.bookingTrendDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analyticsData?.bookings}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(value) => format(parseISO(value), 'dd MMM')}
                      />
                      <YAxis />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line type="monotone" dataKey="total" stroke="#8B4513" name="Total" />
                      <Line type="monotone" dataKey="completed" stroke="#22c55e" name="Completed" />
                      <Line type="monotone" dataKey="cancelled" stroke="#ef4444" name="Cancelled" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('admin.analytics.bookingStatus')}</CardTitle>
                  <CardDescription>{t('admin.analytics.bookingStatusDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        {t('admin.analytics.completed')}
                      </span>
                      <span className="font-medium">85%</span>
                    </div>
                    <Progress value={85} className="h-2" />

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-500" />
                        {t('admin.analytics.cancelled')}
                      </span>
                      <span className="font-medium">5%</span>
                    </div>
                    <Progress value={5} className="h-2" />

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-500" />
                        {t('admin.analytics.noShows')}
                      </span>
                      <span className="font-medium">5%</span>
                    </div>
                    <Progress value={5} className="h-2" />

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 text-blue-500" />
                        {t('admin.analytics.rescheduled')}
                      </span>
                      <span className="font-medium">5%</span>
                    </div>
                    <Progress value={5} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('admin.analytics.topServices')}</CardTitle>
                  <CardDescription>{t('admin.analytics.topServicesDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData?.services} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Bar dataKey="revenue" fill="#8B4513" name="Revenue" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('admin.analytics.servicePerformance')}</CardTitle>
                  <CardDescription>{t('admin.analytics.servicePerformanceDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsData?.services.map((service) => (
                      <div key={service.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{service.name}</h4>
                          <Badge variant="outline">{service.category}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">{t('admin.analytics.bookings')}</p>
                            <p className="font-medium">{service.bookings}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">{t('admin.analytics.revenue')}</p>
                            <p className="font-medium">€{service.revenue.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">{t('admin.analytics.rating')}</p>
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              <span className="font-medium">{service.rating}</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-muted-foreground">{t('admin.analytics.growth')}</p>
                            <p className="font-medium text-green-600">+{service.growth}%</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Geographic Tab */}
          <TabsContent value="geographic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.analytics.bookingsByLocation')}</CardTitle>
                <CardDescription>{t('admin.analytics.bookingsByLocationDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Map Placeholder */}
                  <div className="lg:col-span-2">
                    <div className="bg-muted rounded-lg h-96 flex items-center justify-center">
                      <div className="text-center">
                        <Map className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">{t('admin.analytics.interactiveMap')}</p>
                        <p className="text-sm text-muted-foreground mt-1">{t('admin.analytics.mapComingSoon')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Location Stats */}
                  <div className="space-y-4">
                    {analyticsData?.geographic.map((location) => (
                      <div key={location.city} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{location.city}</h4>
                          <div className="flex items-center gap-1 text-green-600">
                            <ArrowUpRight className="w-4 h-4" />
                            <span className="text-sm">+{location.growth}%</span>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('admin.analytics.bookings')}</span>
                            <span className="font-medium">{location.bookings}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('admin.analytics.revenue')}</span>
                            <span className="font-medium">€{location.revenue.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('admin.analytics.customers')}</span>
                            <span className="font-medium">{location.customers}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Traffic Sources Tab */}
          <TabsContent value="traffic" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('admin.analytics.trafficBySource')}</CardTitle>
                  <CardDescription>{t('admin.analytics.trafficBySourceDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analyticsData?.sources}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ source, percent }) => `${source} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="sessions"
                      >
                        {analyticsData?.sources.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('admin.analytics.sourcePerformance')}</CardTitle>
                  <CardDescription>{t('admin.analytics.sourcePerformanceDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsData?.sources.map((source) => (
                      <div key={source.source} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium capitalize">{source.source}</h4>
                          <Badge variant="outline">{source.medium}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">{t('admin.analytics.sessions')}</p>
                            <p className="font-medium">{source.sessions.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">{t('admin.analytics.conversionRate')}</p>
                            <p className="font-medium">{source.conversionRate.toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">{t('admin.analytics.revenue')}</p>
                            <p className="font-medium">€{source.revenue.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">{t('admin.analytics.roi')}</p>
                            <p className="font-medium text-green-600">
                              {source.roi === Infinity ? '∞' : source.roi.toFixed(0)}%
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Device Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.analytics.deviceBreakdown')}</CardTitle>
                <CardDescription>{t('admin.analytics.deviceBreakdownDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {analyticsData?.devices.map((device) => {
                    const Icon = device.device === 'desktop' ? Monitor : device.device === 'mobile' ? Smartphone : Tablet;
                    return (
                      <div key={device.device} className="p-6 border rounded-lg text-center">
                        <Icon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="font-medium capitalize mb-2">{device.device}</h3>
                        <div className="space-y-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">{t('admin.analytics.sessions')}</p>
                            <p className="text-xl font-bold">{device.sessions.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">{t('admin.analytics.conversionRate')}</p>
                            <p className="font-medium">{device.conversionRate.toFixed(1)}%</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Conversion Funnel Tab */}
          <TabsContent value="conversion" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.analytics.conversionFunnel')}</CardTitle>
                <CardDescription>{t('admin.analytics.conversionFunnelDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData?.conversions.map((stage, index) => (
                    <div key={stage.stage} className="relative">
                      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-medium">{stage.stage}</h4>
                            <p className="text-sm text-muted-foreground">
                              {t('admin.analytics.avgTime')}: {stage.avgTime} {t('common.min')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">{stage.count.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">{stage.rate}% {t('admin.analytics.retention')}</p>
                        </div>
                      </div>
                      {index < analyticsData.conversions.length - 1 && (
                        <div className="flex items-center justify-center py-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <ArrowDownRight className="w-4 h-4" />
                            {stage.dropOff}% {t('admin.analytics.dropOff')}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}