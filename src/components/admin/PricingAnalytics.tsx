import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Calendar,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react'
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { pricingService, PricingAnalytics, PriceOptimizationSuggestion } from '@/services/pricing.service'
import { servicesService } from '@/services/services.service'

interface RevenueData {
  date: string
  revenue: number
  bookings: number
  avgPrice: number
  projected: boolean
}

interface DemandPriceData {
  demand: number
  price: number
  bookings: number
  date: string
}

interface ServicePerformance {
  name: string
  revenue: number
  bookings: number
  avgPrice: number
  occupancy: number
  satisfaction: number
}

const timeRanges = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '1y', label: 'Last year' }
]

export function PricingAnalytics() {
  const { t } = useTranslation()
  const [timeRange, setTimeRange] = useState('30d')
  const [analytics, setAnalytics] = useState<PricingAnalytics[]>([])
  const [suggestions, setSuggestions] = useState<PriceOptimizationSuggestion[]>([])
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [demandPriceData, setDemandPriceData] = useState<DemandPriceData[]>([])
  const [servicePerformance, setServicePerformance] = useState<ServicePerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadAnalytics()
  }, [timeRange])

  const loadAnalytics = async () => {
    try {
      setLoading(true)

      // Load services first
      const services = await servicesService.getServices()
      if (services.length === 0) return

      const serviceIds = services.map(s => s.id)

      // Load all analytics data
      const [analyticsData, suggestionsData] = await Promise.all([
        pricingService.getPricingAnalytics(serviceIds),
        loadOptimizationSuggestions(serviceIds)
      ])

      setAnalytics(analyticsData)
      setSuggestions(suggestionsData)

      // Generate mock data for demonstration
      setRevenueData(generateRevenueData(timeRange))
      setDemandPriceData(generateDemandPriceData())
      setServicePerformance(generateServicePerformance(services))

    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadOptimizationSuggestions = async (serviceIds: string[]): Promise<PriceOptimizationSuggestion[]> => {
    // This would call a service to get optimization suggestions
    // For now, generate mock data
    return serviceIds.slice(0, 3).map((id, index) => ({
      service_id: id,
      current_price: 100 + index * 50,
      suggested_price: 95 + index * 55,
      potential_change: -5 + index * 5,
      potential_change_percent: -5 + index * 2,
      occupancy_rate: 0.75 + index * 0.05,
      target_occupancy: 0.85,
      expected_revenue_change: 1000 * (index + 1),
      confidence: 85 - index * 5,
      reasoning: [
        'Demand is trending upward',
        'Competitor prices increased',
        'Seasonal demand expected'
      ],
      implementation_date: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
    }))
  }

  const generateRevenueData = (range: string): RevenueData[] => {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365
    const data: RevenueData[] = []
    const baseRevenue = 5000
    const baseBookings = 20
    const basePrice = 250

    for (let i = days; i >= 0; i--) {
      const date = subDays(new Date(), i)
      const isProjected = i > 7 // Future dates are projected
      const seasonalFactor = 1 + 0.2 * Math.sin((date.getMonth() + 1) * Math.PI / 6)
      const weekendFactor = [0, 6].includes(date.getDay()) ? 1.3 : 1.0

      const revenue = Math.round(baseRevenue * seasonalFactor * weekendFactor * (0.8 + Math.random() * 0.4))
      const bookings = Math.round(baseBookings * seasonalFactor * weekendFactor * (0.8 + Math.random() * 0.4))
      const avgPrice = Math.round(basePrice * (0.9 + Math.random() * 0.2))

      data.push({
        date: format(date, 'MMM dd'),
        revenue: isProjected ? Math.round(revenue * 1.1) : revenue,
        bookings: isProjected ? Math.round(bookings * 1.05) : bookings,
        avgPrice,
        projected: isProjected
      })
    }

    return data
  }

  const generateDemandPriceData = (): DemandPriceData[] => {
    const data: DemandPriceData[] = []
    for (let i = 0; i < 100; i++) {
      const demand = Math.random() * 10
      const basePrice = 250
      const priceModifier = 1 + (demand / 10) * 0.3 // Price increases with demand
      const price = Math.round(basePrice * priceModifier)
      const bookings = Math.round(5 + demand * 3 + Math.random() * 5)

      data.push({
        demand: Math.round(demand * 10) / 10,
        price,
        bookings,
        date: format(subDays(new Date(), Math.floor(Math.random() * 30)), 'yyyy-MM-dd')
      })
    }
    return data
  }

  const generateServicePerformance = (services: any[]): ServicePerformance[] => {
    return services.slice(0, 5).map((service, index) => ({
      name: service.name,
      revenue: Math.round((1000 + index * 500) * (0.8 + Math.random() * 0.4)),
      bookings: Math.round((20 + index * 10) * (0.8 + Math.random() * 0.4)),
      avgPrice: service.price || 200 + index * 50,
      occupancy: Math.round((0.7 + Math.random() * 0.25) * 100),
      satisfaction: Math.round((4.0 + Math.random() * 1.0) * 10) / 10
    }))
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadAnalytics()
    setRefreshing(false)
  }

  const exportData = () => {
    // Implement export functionality
    console.log('Exporting analytics data...')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#8B4513]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#8B4513]">{t('pricing.analytics')}</h1>
          <p className="text-muted-foreground">{t('pricing.analyticsDescription')}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeRanges.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportData}>
            <Download className="w-4 h-4 mr-2" />
            {t('common.export')}
          </Button>
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {t('common.refresh')}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('pricing.totalRevenue')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${revenueData.reduce((sum, d) => sum + d.revenue, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              +12.5% {t('pricing.fromLastPeriod')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('pricing.avgBookingValue')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${Math.round(revenueData.reduce((sum, d) => sum + d.avgPrice * d.bookings, 0) / revenueData.reduce((sum, d) => sum + d.bookings, 0) || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              +5.2% {t('pricing.fromLastPeriod')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('pricing.occupancyRate')}</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78.5%</div>
            <p className="text-xs text-muted-foreground">
              +2.1% {t('pricing.fromLastPeriod')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('pricing.dynamicPricingImpact')}</CardTitle>
            <Info className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+18.3%</div>
            <p className="text-xs text-muted-foreground">
              {t('pricing.revenueIncrease')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue">{t('pricing.revenueAnalysis')}</TabsTrigger>
          <TabsTrigger value="demand">{t('pricing.demandAnalysis')}</TabsTrigger>
          <TabsTrigger value="performance">{t('pricing.servicePerformance')}</TabsTrigger>
          <TabsTrigger value="optimization">{t('pricing.optimization')}</TabsTrigger>
        </TabsList>

        {/* Revenue Analysis */}
        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('pricing.revenueTrend')}</CardTitle>
              <CardDescription>{t('pricing.revenueTrendDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <ReferenceLine x={revenueData.find(d => !d.projected)?.date} stroke="#666" strokeDasharray="3 3" />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#8B4513"
                    fill="#8B4513"
                    fillOpacity={0.3}
                    name={t('pricing.revenue')}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#D2691E"
                    fill="#D2691E"
                    fillOpacity={0.2}
                    strokeDasharray="5 5"
                    data={revenueData.filter(d => d.projected)}
                    name={t('pricing.projected')}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Demand Analysis */}
        <TabsContent value="demand" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('pricing.demandVsPrice')}</CardTitle>
                <CardDescription>{t('pricing.demandVsPriceDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart data={demandPriceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="demand" name={t('pricing.demandLevel')} />
                    <YAxis dataKey="price" name={t('pricing.price')} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name={t('pricing.bookings')} data={demandPriceData} fill="#8B4513" />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('pricing.elasticityAnalysis')}</CardTitle>
                <CardDescription>{t('pricing.elasticityAnalysisDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>{t('pricing.priceElasticity')}</span>
                    <Badge variant="secondary">-1.35</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t('pricing.elasticityExplanation')}
                  </p>
                  <Progress value={65} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {t('pricing.recommendation')}: {t('pricing.elasticRecommendation')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Service Performance */}
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('pricing.servicePerformance')}</CardTitle>
              <CardDescription>{t('pricing.servicePerformanceDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={servicePerformance} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" fill="#8B4513" name={t('pricing.revenue')} />
                  <Bar dataKey="avgPrice" fill="#D2691E" name={t('pricing.avgPrice')} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Optimization Suggestions */}
        <TabsContent value="optimization" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {suggestions.map((suggestion, index) => (
              <Card key={suggestion.service_id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{t('pricing.optimizationForService')} {index + 1}</span>
                    <Badge variant={suggestion.potential_change > 0 ? 'default' : 'secondary'}>
                      {suggestion.potential_change > 0 ? '+' : ''}{suggestion.potential_change_percent.toFixed(1)}%
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">{t('pricing.currentPrice')}</p>
                      <p className="font-semibold">${suggestion.current_price}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t('pricing.suggestedPrice')}</p>
                      <p className="font-semibold">${suggestion.suggested_price}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t('pricing.occupancy')}</p>
                      <p className="font-semibold">{(suggestion.occupancy_rate * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t('pricing.confidence')}</p>
                      <p className="font-semibold">{suggestion.confidence}%</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <p className="text-sm font-medium mb-2">{t('pricing.reasoning')}</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {suggestion.reasoning.map((reason, i) => (
                        <li key={i} className="flex items-start">
                          <CheckCircle className="w-3 h-3 mr-2 mt-0.5 text-green-500" />
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {t('pricing.expectedRevenueChange')}: ${suggestion.expected_revenue_change.toLocaleString()}
                    </p>
                    <Button size="sm">
                      {t('pricing.applySuggestion')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t('pricing.optimizationNote')}
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  )
}