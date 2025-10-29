import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  TrendingUp,
  TrendingDown,
  Info,
  Calendar,
  Users,
  Clock,
  Target,
  Zap
} from 'lucide-react'
import { format } from 'date-fns'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { pricingService, PriceBreakdown } from '@/services/pricing.service'

import { Service } from '@/types'

interface DynamicPriceDisplayProps {
  service: Service
  selectedDate?: string
  groupSize?: number
  showDetails?: boolean
  className?: string
}

export function DynamicPriceDisplay({
  service,
  selectedDate,
  groupSize = 1,
  showDetails = true,
  className
}: DynamicPriceDisplayProps) {
  const { t } = useTranslation()
  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown | null>(null)
  const [loading, setLoading] = useState(false)
  const [showBreakdown, setShowBreakdown] = useState(false)

  useEffect(() => {
    calculatePrice()
  }, [service.id, selectedDate, groupSize])

  const calculatePrice = async () => {
    if (!service.id) return

    setLoading(true)
    try {
      const breakdown = await pricingService.calculateDynamicPrice(
        service.id,
        selectedDate || format(new Date(), 'yyyy-MM-dd'),
        groupSize,
        {
          customer_id: null, // Would get from auth context
          location_id: null,
          custom_data: {}
        }
      )
      setPriceBreakdown(breakdown)
    } catch (error) {
      console.error('Error calculating price:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPriceChange = () => {
    if (!priceBreakdown) return 0
    return ((priceBreakdown.final_price - priceBreakdown.base_price) / priceBreakdown.base_price) * 100
  }

  const getPriceChangeColor = () => {
    const change = getPriceChange()
    if (change > 0) return 'text-red-600'
    if (change < 0) return 'text-green-600'
    return 'text-gray-600'
  }

  const getPriceChangeIcon = () => {
    const change = getPriceChange()
    if (change > 0) return <TrendingUp className="w-4 h-4" />
    if (change < 0) return <TrendingDown className="w-4 h-4" />
    return null
  }

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#8B4513]" />
        <span className="text-sm text-muted-foreground">{t('pricing.calculating')}</span>
      </div>
    )
  }

  if (!priceBreakdown) {
    return (
      <div className={`space-y-1 ${className}`}>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-bold">${service.price}</span>
          <span className="text-sm text-muted-foreground">/ {t('common.session')}</span>
        </div>
      </div>
    )
  }

  const priceChange = getPriceChange()
  const hasDynamicPrice = Math.abs(priceChange) > 0.01

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-baseline space-x-2">
        <span className="text-2xl font-bold text-[#8B4513]">
          ${priceBreakdown.final_price}
        </span>
        <span className="text-sm text-muted-foreground">/ {t('common.session')}</span>

        {hasDynamicPrice && (
          <Badge variant="secondary" className={`ml-2 ${getPriceChangeColor()}`}>
            <span className="flex items-center space-x-1">
              {getPriceChangeIcon()}
              <span>{priceChange > 0 ? '+' : ''}{priceChange.toFixed(1)}%</span>
            </span>
          </Badge>
        )}
      </div>

      {hasDynamicPrice && showDetails && (
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <Info className="w-3 h-3" />
          <span>{t('pricing.dynamicPriceApplied')}</span>
          {showDetails && (
            <Dialog open={showBreakdown} onOpenChange={setShowBreakdown}>
              <DialogTrigger asChild>
                <Button variant="link" className="h-auto p-0 text-xs">
                  {t('pricing.seeDetails')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{t('pricing.priceBreakdown')}</DialogTitle>
                </DialogHeader>
                <PriceBreakdownDetails breakdown={priceBreakdown} />
              </DialogContent>
            </Dialog>
          )}
        </div>
      )}
    </div>
  )
}

interface PriceBreakdownDetailsProps {
  breakdown: PriceBreakdown
}

function PriceBreakdownDetails({ breakdown }: PriceBreakdownDetailsProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{t('pricing.basePrice')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${breakdown.base_price}</div>
        </CardContent>
      </Card>

      {breakdown.applied_rules.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{t('pricing.appliedRules')}</CardTitle>
            <CardDescription>{t('pricing.appliedRulesDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {breakdown.applied_rules.map((rule, index) => (
              <div key={rule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{rule.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t('pricing.modifier')}: {rule.modifier_value > 0 ? '+' : ''}{rule.modifier_value}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${rule.modified_price.toFixed(2)}</p>
                  <Badge variant="outline" className="text-xs">
                    {rule.type}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{t('pricing.finalPrice')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-[#8B4513]">
              ${breakdown.final_price}
            </span>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                {t('pricing.totalModifier')}: {breakdown.total_modifier > 0 ? '+' : ''}{breakdown.total_modifier.toFixed(1)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="space-y-2">
        <h4 className="font-medium flex items-center">
          <Target className="w-4 h-4 mr-2" />
          {t('pricing.calculationContext')}
        </h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center">
            <Calendar className="w-3 h-3 mr-1" />
            {breakdown.calculation_context.date}
          </div>
          {breakdown.calculation_context.group_size && (
            <div className="flex items-center">
              <Users className="w-3 h-3 mr-1" />
              {breakdown.calculation_context.group_size} {t('pricing.people')}
            </div>
          )}
          {breakdown.calculation_context.demand_level && (
            <div className="flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              {t('pricing.demand')}: {breakdown.calculation_context.demand_level}/10
            </div>
          )}
        </div>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          {t('pricing.priceCalculationNote')}
        </AlertDescription>
      </Alert>
    </div>
  )
}