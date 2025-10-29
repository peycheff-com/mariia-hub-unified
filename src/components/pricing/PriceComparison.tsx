import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, Calendar, Users, Clock } from 'lucide-react'
import { format, addDays } from 'date-fns'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { pricingService } from '@/services/pricing.service'

import { Service } from '@/types'

interface PriceComparisonProps {
  services: Service[]
  selectedDate?: string
  groupSize?: number
}

interface PriceComparisonData {
  serviceId: string
  serviceName: string
  basePrice: number
  currentPrice: number
  priceChange: number
  priceChangePercent: number
  appliedRules: number
}

interface TimeSlotPrice {
  time: string
  [key: string]: string | number
}

export function PriceComparison({ services, selectedDate, groupSize = 1 }: PriceComparisonProps) {
  const { t } = useTranslation()
  const [priceData, setPriceData] = useState<PriceComparisonData[]>([])
  const [timeSlotPrices, setTimeSlotPrices] = useState<TimeSlotPrice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (services.length > 0) {
      loadPriceComparison()
      loadTimeSlotPrices()
    }
  }, [services, selectedDate, groupSize])

  const loadPriceComparison = async () => {
    try {
      const data: PriceComparisonData[] = []

      for (const service of services) {
        const breakdown = await pricingService.calculateDynamicPrice(
          service.id,
          selectedDate || format(new Date(), 'yyyy-MM-dd'),
          groupSize
        )

        const priceChange = breakdown.final_price - breakdown.base_price
        const priceChangePercent = (priceChange / breakdown.base_price) * 100

        data.push({
          serviceId: service.id,
          serviceName: service.name,
          basePrice: breakdown.base_price,
          currentPrice: breakdown.final_price,
          priceChange,
          priceChangePercent,
          appliedRules: breakdown.applied_rules.length
        })
      }

      setPriceData(data)
    } catch (error) {
      console.error('Error loading price comparison:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTimeSlotPrices = async () => {
    try {
      const timeSlots = [
        '08:00', '09:00', '10:00', '11:00', '12:00',
        '14:00', '15:00', '16:00', '17:00', '18:00'
      ]

      const data: TimeSlotPrice[] = timeSlots.map(time => ({
        time
      }))

      // Calculate prices for each service at different times
      for (const service of services.slice(0, 3)) {
        for (let i = 0; i < timeSlots.length; i++) {
          const dateStr = selectedDate || format(new Date(), 'yyyy-MM-dd')
          const [hours, minutes] = timeSlots[i].split(':')
          const testDate = new Date(`${dateStr}T${hours}:${minutes}:00`)

          const breakdown = await pricingService.calculateDynamicPrice(
            service.id,
            format(testDate, 'yyyy-MM-dd'),
            groupSize,
            { time_slot: timeSlots[i] }
          )

          data[i][service.name] = breakdown.final_price
        }
      }

      setTimeSlotPrices(data)
    } catch (error) {
      console.error('Error loading time slot prices:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#8B4513]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Price Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {priceData.map((data) => (
          <PriceComparisonCard key={data.serviceId} data={data} />
        ))}
      </div>

      {/* Price Chart */}
      {timeSlotPrices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              {t('pricing.priceVariationByTime')}
            </CardTitle>
            <CardDescription>
              {t('pricing.priceVariationDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timeSlotPrices}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                {services.slice(0, 3).map((service, index) => (
                  <Bar
                    key={service.id}
                    dataKey={service.name}
                    fill={['#8B4513', '#D2691E', '#CD853F'][index]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>{t('pricing.pricingInsights')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <PricingInsights priceData={priceData} />
        </CardContent>
      </Card>
    </div>
  )
}

interface PriceComparisonCardProps {
  data: PriceComparisonData
}

function PriceComparisonCard({ data }: PriceComparisonCardProps) {
  const { t } = useTranslation()

  const isHigher = data.priceChange > 0
  const changeColor = isHigher ? 'text-red-600' : 'text-green-600'

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{data.serviceName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t('pricing.basePrice')}</span>
            <span className="font-medium">${data.basePrice}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t('pricing.currentPrice')}</span>
            <span className="font-bold text-lg text-[#8B4513]">${data.currentPrice}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{t('pricing.change')}</span>
          <Badge variant={isHigher ? 'destructive' : 'default'} className={changeColor}>
            <span className="flex items-center space-x-1">
              {isHigher ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{isHigher ? '+' : ''}{data.priceChangePercent.toFixed(1)}%</span>
            </span>
          </Badge>
        </div>

        {data.appliedRules > 0 && (
          <Alert>
            {data.appliedRules === 1 ? (
              <p className="text-sm">
                {t('pricing.oneRuleApplied')}
              </p>
            ) : (
              <p className="text-sm">
                {t('pricing.multipleRulesApplied', { count: data.appliedRules })}
              </p>
            )}
          </Alert>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>{t('pricing.savings')}</span>
            <span className={data.priceChange < 0 ? 'text-green-600' : 'text-muted-foreground'}>
              {data.priceChange < 0 ? `$${Math.abs(data.priceChange).toFixed(2)}` : '$0'}
            </span>
          </div>
          <Progress
            value={Math.abs(data.priceChangePercent)}
            className="h-2"
          />
        </div>
      </CardContent>
    </Card>
  )
}

interface PricingInsightsProps {
  priceData: PriceComparisonData[]
}

function PricingInsights({ priceData }: PricingInsightsProps) {
  const { t } = useTranslation()

  const insights = []

  // Find best deal
  const bestDeal = priceData.reduce((best, current) =>
    current.priceChangePercent < best.priceChangePercent ? current : best
  )

  if (bestDeal.priceChangePercent < 0) {
    insights.push({
      type: 'deal',
      title: t('pricing.bestDeal'),
      description: t('pricing.bestDealDescription', { service: bestDeal.serviceName, saving: Math.abs(bestDeal.priceChangePercent).toFixed(1) })
    })
  }

  // Find most expensive
  const mostExpensive = priceData.reduce((most, current) =>
    current.currentPrice > most.currentPrice ? current : most
  )

  insights.push({
    type: 'info',
    title: t('pricing.priceRange'),
    description: t('pricing.priceRangeDescription', {
      min: Math.min(...priceData.map(d => d.currentPrice)).toFixed(0),
      max: mostExpensive.currentPrice.toFixed(0),
      service: mostExpensive.serviceName
    })
  })

  // Check for dynamic pricing
  const hasDynamicPricing = priceData.some(d => Math.abs(d.priceChangePercent) > 0.01)
  if (hasDynamicPricing) {
    insights.push({
      type: 'info',
      title: t('pricing.dynamicPricingActive'),
      description: t('pricing.dynamicPricingActiveDescription')
    })
  }

  return (
    <div className="space-y-3">
      {insights.map((insight, index) => (
        <Alert key={index}>
          <div className="flex items-start space-x-2">
            {insight.type === 'deal' && <TrendingDown className="w-4 h-4 mt-0.5" />}
            <div className="flex-1">
              <h4 className="font-medium">{insight.title}</h4>
              <AlertDescription>{insight.description}</AlertDescription>
            </div>
          </div>
        </Alert>
      ))}
    </div>
  )
}