import React, { useState, useEffect } from 'react'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Settings,
  Plus,
  Eye,
  Edit,
  Trash2,
  Copy,
  Activity,
  Calendar,
  Users,
  Zap
} from 'lucide-react'
import { format, subDays } from 'date-fns'
import { useTranslation } from 'react-i18next'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { pricingService, PricingRule, PricingAnalytics, PricingDashboardStats } from '@/services/pricing.service'
import { servicesService } from '@/services/services.service'

interface PriceHistoryData {
  date: string
  basePrice: number
  finalPrice: number
  demand: number
}

interface RulePerformanceData {
  name: string
  usage: number
  revenue: number
  color: string
}

const COLORS = ['#8B4513', '#D2691E', '#F5DEB3', '#CD853F', '#DEB887', '#BC8F8F']

export function PricingDashboard() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<PricingDashboardStats | null>(null)
  const [rules, setRules] = useState<PricingRule[]>([])
  const [analytics, setAnalytics] = useState<PricingAnalytics[]>([])
  const [priceHistory, setPriceHistory] = useState<PriceHistoryData[]>([])
  const [rulePerformance, setRulePerformance] = useState<RulePerformanceData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedService, setSelectedService] = useState<string>('')
  const [showRuleDialog, setShowRuleDialog] = useState(false)
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Load all data in parallel
      const [statsData, rulesData, services] = await Promise.all([
        pricingService.getDashboardStats(),
        pricingService.getPricingRules(),
        servicesService.getServices()
      ])

      setStats(statsData)
      setRules(rulesData)

      if (services.length > 0) {
        const serviceIds = services.map(s => s.id)
        const analyticsData = await pricingService.getPricingAnalytics(serviceIds)
        setAnalytics(analyticsData)

        // Generate mock price history for demonstration
        const history = generatePriceHistory()
        setPriceHistory(history)

        // Generate mock rule performance
        const performance = generateRulePerformance(rulesData)
        setRulePerformance(performance)
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generatePriceHistory = (): PriceHistoryData[] => {
    const data: PriceHistoryData[] = []
    const basePrice = 299

    for (let i = 30; i >= 0; i--) {
      const date = subDays(new Date(), i)
      const demand = Math.floor(Math.random() * 10) + 1
      const priceModifier = demand > 7 ? 1.2 : demand > 5 ? 1.1 : 1.0
      const weekendModifier = [0, 6].includes(date.getDay()) ? 1.15 : 1.0
      const finalPrice = Math.round(basePrice * priceModifier * weekendModifier)

      data.push({
        date: format(date, 'MMM dd'),
        basePrice,
        finalPrice,
        demand
      })
    }

    return data
  }

  const generateRulePerformance = (rules: PricingRule[]): RulePerformanceData[] => {
    return rules.slice(0, 5).map((rule, index) => ({
      name: rule.name,
      usage: Math.floor(Math.random() * 100) + 20,
      revenue: Math.floor(Math.random() * 10000) + 2000,
      color: COLORS[index % COLORS.length]
    }))
  }

  const handleDeleteRule = async (ruleId: string) => {
    if (window.confirm(t('pricing.confirmDeleteRule'))) {
      try {
        await pricingService.deletePricingRule(ruleId)
        loadDashboardData()
      } catch (error) {
        console.error('Error deleting rule:', error)
      }
    }
  }

  const handleToggleRule = async (rule: PricingRule) => {
    try {
      await pricingService.updatePricingRule(rule.id, { is_active: !rule.is_active })
      loadDashboardData()
    } catch (error) {
      console.error('Error toggling rule:', error)
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#8B4513]">{t('pricing.dashboard')}</h1>
          <p className="text-muted-foreground">{t('pricing.dashboardDescription')}</p>
        </div>
        <Dialog open={showRuleDialog} onOpenChange={setShowRuleDialog}>
          <DialogTrigger asChild>
            <Button className="bg-[#8B4513] hover:bg-[#6B3410]">
              <Plus className="w-4 h-4 mr-2" />
              {t('pricing.addRule')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingRule ? t('pricing.editRule') : t('pricing.createRule')}</DialogTitle>
            </DialogHeader>
            {/* Rule creation form will go here */}
            <div className="p-4 text-center text-muted-foreground">
              Rule creation component will be implemented here
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('pricing.totalRules')}</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_rules || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.active_rules || 0} {t('pricing.active')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('pricing.avgPriceChange')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.average_price_change?.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {t('pricing.last30Days')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('pricing.revenueImpact')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+24%</div>
            <p className="text-xs text-muted-foreground">
              {t('pricing.vsBaseline')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('pricing.calculations')}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_calculations || 0}</div>
            <p className="text-xs text-muted-foreground">
              {t('pricing.allTime')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">{t('pricing.overview')}</TabsTrigger>
          <TabsTrigger value="rules">{t('pricing.rules')}</TabsTrigger>
          <TabsTrigger value="analytics">{t('pricing.analytics')}</TabsTrigger>
          <TabsTrigger value="simulation">{t('pricing.simulation')}</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Price History Chart */}
            <Card>
              <CardHeader>
                <CardTitle>{t('pricing.priceHistory')}</CardTitle>
                <CardDescription>{t('pricing.priceHistoryDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={priceHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="basePrice"
                      stackId="1"
                      stroke="#8B4513"
                      fill="#F5DEB3"
                      name={t('pricing.basePrice')}
                    />
                    <Area
                      type="monotone"
                      dataKey="finalPrice"
                      stackId="2"
                      stroke="#D2691E"
                      fill="#DEB887"
                      name={t('pricing.finalPrice')}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Rule Performance */}
            <Card>
              <CardHeader>
                <CardTitle>{t('pricing.rulePerformance')}</CardTitle>
                <CardDescription>{t('pricing.rulePerformanceDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={rulePerformance}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="usage"
                    >
                      {rulePerformance.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Analytics */}
          <Card>
            <CardHeader>
              <CardTitle>{t('pricing.serviceAnalytics')}</CardTitle>
              <CardDescription>{t('pricing.serviceAnalyticsDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.slice(0, 5).map((service) => (
                  <div key={service.service_id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-semibold">{service.service_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {t('pricing.currentPrice')}: ${service.current_price} → {t('pricing.suggested')}: ${service.suggested_price}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">{t('pricing.occupancy')}</p>
                        <p className="font-semibold">{service.occupancy_rate.toFixed(1)}%</p>
                      </div>
                      <Badge variant={service.price_trend === 'increasing' ? 'default' :
                                   service.price_trend === 'decreasing' ? 'destructive' : 'secondary'}>
                        {service.price_trend}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rules Tab */}
        <TabsContent value="rules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('pricing.pricingRules')}</CardTitle>
              <CardDescription>{t('pricing.pricingRulesDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {rules.map((rule) => (
                    <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold">{rule.name}</h4>
                          <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                            {rule.is_active ? t('pricing.active') : t('pricing.inactive')}
                          </Badge>
                          <Badge variant="outline">{rule.rule_type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {rule.description}
                        </p>
                        <p className="text-sm mt-1">
                          {t('pricing.modifier')}: {rule.modifier_type} {rule.modifier_value > 0 ? '+' : ''}{rule.modifier_value}
                          {rule.modifier_type === 'percentage' ? '%' : ''}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center">
                            <Target className="w-3 h-3 mr-1" />
                            {t('pricing.priority')}: {rule.priority}
                          </span>
                          <span className="flex items-center">
                            <Zap className="w-3 h-3 mr-1" />
                            {t('pricing.used')}: {rule.current_uses}
                          </span>
                          {rule.valid_from && (
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {format(new Date(rule.valid_from), 'MMM dd, yyyy')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleRule(rule)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingRule(rule)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRule(rule.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Demand vs Price */}
            <Card>
              <CardHeader>
                <CardTitle>{t('pricing.demandVsPrice')}</CardTitle>
                <CardDescription>{t('pricing.demandVsPriceDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={priceHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="finalPrice"
                      stroke="#8B4513"
                      name={t('pricing.price')}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="demand"
                      stroke="#D2691E"
                      name={t('pricing.demand')}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Service Performance */}
            <Card>
              <CardHeader>
                <CardTitle>{t('pricing.servicePerformance')}</CardTitle>
                <CardDescription>{t('pricing.servicePerformanceDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="service_name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="occupancy_rate" fill="#8B4513" name={t('pricing.occupancyRate')} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Simulation Tab */}
        <TabsContent value="simulation" className="space-y-6">
          <Alert>
            <Zap className="h-4 w-4" />
            <AlertDescription>
              {t('pricing.simulationDescription')}
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>{t('pricing.pricingSimulator')}</CardTitle>
              <CardDescription>{t('pricing.pricingSimulatorDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="text-center p-8">
              <div className="text-muted-foreground">
                <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{t('pricing.simulatorComingSoon')}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}