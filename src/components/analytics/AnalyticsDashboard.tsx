/**
 * Advanced Analytics Dashboard
 * Comprehensive analytics dashboard with real-time data visualization
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  CalendarDays,
  Activity,
  AlertTriangle,
  Download,
  RefreshCw,
  Filter,
  BarChart3,
  PieChart,
  LineChart,
  Eye,
  Target
} from 'lucide-react'

import { analyticsService, type RevenueMetrics, type BookingMetrics, type CustomerMetrics, type PerformanceMetrics } from '@/lib/analytics/analytics-service'
import { realtimeManager, subscribeToDashboardUpdates } from '@/lib/analytics/realtime-manager'
import { RevenueChart } from './charts/RevenueChart'
import { BookingFunnelChart } from './charts/BookingFunnelChart'
import { KPICards } from './KPICards'
import { CustomerSegmentsChart } from './charts/CustomerSegmentsChart'
import { ServicePerformanceChart } from './charts/ServicePerformanceChart'
import { AlertsPanel } from './AlertsPanel'
import { DateRangePicker } from './DateRangePicker'

interface DashboardState {
  selectedPeriod: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom'
  customDateRange: { start: string; end: string } | null
  serviceType: string
  locationType: string
  isLoading: boolean
  lastUpdated: Date | null
  realTimeUpdates: boolean
}

interface DashboardData {
  revenue: RevenueMetrics | null
  bookings: BookingMetrics | null
  customers: CustomerMetrics | null
  performance: PerformanceMetrics | null
  alerts: any[]
}

export const AnalyticsDashboard: React.FC = () => {
  const [state, setState] = useState<DashboardState>({
    selectedPeriod: 'month',
    customDateRange: null,
    serviceType: 'all',
    locationType: 'all',
    isLoading: true,
    lastUpdated: null,
    realTimeUpdates: true
  })

  const [data, setData] = useState<DashboardData>({
    revenue: null,
    bookings: null,
    customers: null,
    performance: null,
    alerts: []
  })

  const [subscription, setSubscription] = useState<string | null>(null)

  // Calculate date range based on selected period
  const dateRange = useMemo(() => {
    if (state.customDateRange) {
      return {
        startDate: state.customDateRange.start,
        endDate: state.customDateRange.end
      }
    }

    const now = new Date()
    let startDate: Date
    let endDate: Date = now

    switch (state.selectedPeriod) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3)
        startDate = new Date(now.getFullYear(), quarter * 3, 1)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    }
  }, [state.selectedPeriod, state.customDateRange])

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }))

    try {
      const queryOptions = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        serviceType: state.serviceType !== 'all' ? state.serviceType : undefined,
        locationType: state.locationType !== 'all' ? state.locationType : undefined
      }

      const [revenue, bookings, customers, performance] = await Promise.all([
        analyticsService.getRevenueMetrics(queryOptions),
        analyticsService.getBookingMetrics(queryOptions),
        analyticsService.getCustomerMetrics(queryOptions),
        analyticsService.getPerformanceMetrics(queryOptions)
      ])

      setData({
        revenue,
        bookings,
        customers,
        performance,
        alerts: performance?.alerts || []
      })

      setState(prev => ({
        ...prev,
        isLoading: false,
        lastUpdated: new Date()
      }))
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [dateRange, state.serviceType, state.locationType])

  // Handle real-time updates
  const handleRealtimeUpdate = useCallback((event: any) => {
    console.log('Real-time update received:', event)

    // Refresh data when significant changes occur
    if (event.type === 'analytics_update' || event.type === 'kpi_alert') {
      fetchDashboardData()
    }
  }, [fetchDashboardData])

  // Initialize real-time subscription
  useEffect(() => {
    if (state.realTimeUpdates && !subscription) {
      const subId = subscribeToDashboardUpdates(handleRealtimeUpdate)
      setSubscription(subId)
    }

    return () => {
      if (subscription) {
        realtimeManager.unsubscribe(subscription)
        setSubscription(null)
      }
    }
  }, [state.realTimeUpdates, subscription, handleRealtimeUpdate])

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // Auto-refresh interval
  useEffect(() => {
    const interval = setInterval(() => {
      if (state.realTimeUpdates) {
        fetchDashboardData()
      }
    }, 60000) // Refresh every minute

    return () => clearInterval(interval)
  }, [state.realTimeUpdates, fetchDashboardData])

  const handlePeriodChange = (period: string) => {
    setState(prev => ({ ...prev, selectedPeriod: period as any, customDateRange: null }))
  }

  const handleCustomDateRange = (range: { start: string; end: string }) => {
    setState(prev => ({ ...prev, selectedPeriod: 'custom', customDateRange: range }))
  }

  const handleRefresh = () => {
    fetchDashboardData()
  }

  const handleExport = async () => {
    // Implement export functionality
    console.log('Exporting dashboard data...')
  }

  const toggleRealTimeUpdates = () => {
    setState(prev => ({ ...prev, realTimeUpdates: !prev.realTimeUpdates }))
  }

  const formatCurrency = (amount: number, currency: string = 'PLN') => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('pl-PL').format(num)
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time insights for your luxury beauty & fitness business
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={state.realTimeUpdates ? 'default' : 'secondary'}>
            {state.realTimeUpdates ? 'Live' : 'Paused'}
          </Badge>
          {state.lastUpdated && (
            <span className="text-sm text-muted-foreground">
              Last updated: {state.lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleRealTimeUpdates}
          >
            <Activity className="h-4 w-4 mr-2" />
            {state.realTimeUpdates ? 'Pause' : 'Resume'} Updates
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={state.isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${state.isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <Select value={state.selectedPeriod} onValueChange={handlePeriodChange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {state.selectedPeriod === 'custom' && (
              <DateRangePicker
                value={state.customDateRange}
                onChange={handleCustomDateRange}
              />
            )}

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={state.serviceType} onValueChange={(value) => setState(prev => ({ ...prev, serviceType: value }))}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Services" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  <SelectItem value="beauty">Beauty</SelectItem>
                  <SelectItem value="fitness">Fitness</SelectItem>
                  <SelectItem value="lifestyle">Lifestyle</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Select value={state.locationType} onValueChange={(value) => setState(prev => ({ ...prev, locationType: value }))}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="studio">Studio</SelectItem>
                  <SelectItem value="mobile">Mobile</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="salon">Salon</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {data.alerts && data.alerts.length > 0 && (
        <AlertsPanel alerts={data.alerts} />
      )}

      {/* KPI Cards */}
      {data.performance && (
        <KPICards
          kpis={data.performance.kpis}
          overallScore={data.performance.overallScore}
          isLoading={state.isLoading}
        />
      )}

      {/* Main Dashboard Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Quick Stats Cards */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.revenue ? formatCurrency(data.revenue.totalRevenue) : '-'}
                </div>
                {data.revenue && (
                  <p className="text-xs text-muted-foreground">
                    {data.revenue.growthRate >= 0 ? (
                      <TrendingUp className="inline h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="inline h-3 w-3 mr-1" />
                    )}
                    {Math.abs(data.revenue.growthRate).toFixed(1)}% from last period
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.bookings ? formatNumber(data.bookings.totalBookings) : '-'}
                </div>
                {data.bookings && (
                  <p className="text-xs text-muted-foreground">
                    {data.bookings.conversionRate.toFixed(1)}% conversion rate
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.customers ? formatNumber(data.customers.totalCustomers) : '-'}
                </div>
                {data.customers && (
                  <p className="text-xs text-muted-foreground">
                    {data.customers.retentionRate.toFixed(1)}% retention rate
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Booking Value</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.revenue ? formatCurrency(data.revenue.averageBookingValue) : '-'}
                </div>
                {data.bookings && (
                  <p className="text-xs text-muted-foreground">
                    {formatNumber(data.bookings.totalBookings)} bookings
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Charts Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Daily revenue over selected period</CardDescription>
              </CardHeader>
              <CardContent>
                {data.revenue ? (
                  <RevenueChart data={data.revenue.dailyRevenue} />
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    No revenue data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Booking Funnel</CardTitle>
                <CardDescription>Conversion through booking stages</CardDescription>
              </CardHeader>
              <CardContent>
                {data.bookings ? (
                  <BookingFunnelChart metrics={data.bookings.funnelMetrics} />
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    No booking data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Service Type</CardTitle>
                <CardDescription>Revenue distribution across service categories</CardDescription>
              </CardHeader>
              <CardContent>
                {data.revenue ? (
                  <ServicePerformanceChart
                    data={data.revenue.revenueByServiceType}
                    type="service"
                  />
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    No revenue data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue by Location</CardTitle>
                <CardDescription>Revenue distribution across locations</CardDescription>
              </CardHeader>
              <CardContent>
                {data.revenue ? (
                  <ServicePerformanceChart
                    data={data.revenue.revenueByLocation}
                    type="location"
                  />
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    No revenue data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Analytics</CardTitle>
              <CardDescription>Detailed revenue metrics and trends</CardDescription>
            </CardHeader>
            <CardContent>
              {data.revenue && (
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{formatCurrency(data.revenue.totalRevenue)}</div>
                    <div className="text-sm text-muted-foreground">Total Revenue</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{formatNumber(data.revenue.totalBookings)}</div>
                    <div className="text-sm text-muted-foreground">Total Bookings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{formatCurrency(data.revenue.averageBookingValue)}</div>
                    <div className="text-sm text-muted-foreground">Average Value</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${data.revenue.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {data.revenue.growthRate >= 0 ? '+' : ''}{data.revenue.growthRate.toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Growth Rate</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-6">
          {/* Booking-specific analytics would go here */}
          <Card>
            <CardHeader>
              <CardTitle>Booking Analytics</CardTitle>
              <CardDescription>Comprehensive booking metrics and analysis</CardDescription>
            </CardHeader>
            <CardContent>
              {data.bookings ? (
                <div className="space-y-4">
                  {/* Bookings by Status */}
                  <div>
                    <h4 className="font-medium mb-2">Bookings by Status</h4>
                    <div className="grid gap-2">
                      {data.bookings.bookingsByStatus.map((status, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm capitalize">{status.status}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{status.count} ({status.percentage.toFixed(1)}%)</span>
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${status.percentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Funnel Dropoff Rates */}
                  <div>
                    <h4 className="font-medium mb-2">Funnel Dropoff Rates</h4>
                    <div className="grid gap-2">
                      {data.bookings.funnelMetrics.dropoffRates.map((rate, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm">{rate.step.replace('_', ' → ')}</span>
                          <span className={`text-sm font-medium ${rate.rate > 50 ? 'text-red-600' : 'text-yellow-600'}`}>
                            {rate.rate.toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No booking data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Segments</CardTitle>
              <CardDescription>Distribution of customers across segments</CardDescription>
            </CardHeader>
            <CardContent>
              {data.customers ? (
                <CustomerSegmentsChart segments={data.customers.customerSegments} />
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No customer data available
                </div>
              )}
            </CardContent>
          </Card>

          {data.customers && (
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Lifetime Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(data.customers.customerLifetimeValue)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Retention Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {data.customers.retentionRate.toFixed(1)}%
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Churn Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${data.customers.churnRate > 20 ? 'text-red-600' : 'text-yellow-600'}`}>
                    {data.customers.churnRate.toFixed(1)}%
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance KPIs</CardTitle>
              <CardDescription>Key performance indicators and metrics</CardDescription>
            </CardHeader>
            <CardContent>
              {data.performance ? (
                <div className="space-y-4">
                  {data.performance.kpis.map((kpi, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{kpi.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Target: {formatNumber(kpi.target)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          {formatNumber(kpi.value)}
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          {kpi.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-600" />}
                          {kpi.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-600" />}
                          <span className={`font-medium ${
                            kpi.achievement >= 100 ? 'text-green-600' :
                            kpi.achievement >= 80 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {kpi.achievement.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No performance data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}