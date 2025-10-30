/**
 * KPI Cards Component
 * Displays key performance indicators with visual indicators and trends
 */

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Award
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface KPI {
  name: string
  value: number
  target: number
  achievement: number
  trend: 'up' | 'down' | 'stable'
  status: 'critical' | 'warning' | 'normal' | 'good' | 'excellent'
  description?: string
  unit?: string
}

interface KPICardsProps {
  kpis: KPI[]
  overallScore: number
  isLoading?: boolean
  columns?: number
}

export const KPICards: React.FC<KPICardsProps> = ({
  kpis,
  overallScore,
  isLoading = false,
  columns = 4
}) => {
  const getStatusColor = (status: KPI['status']) => {
    switch (status) {
      case 'critical':
        return 'destructive'
      case 'warning':
        return 'secondary'
      case 'normal':
        return 'default'
      case 'good':
        return 'default'
      case 'excellent':
        return 'default'
      default:
        return 'default'
    }
  }

  const getStatusBgColor = (status: KPI['status']) => {
    switch (status) {
      case 'critical':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'normal':
        return 'bg-gray-50 border-gray-200'
      case 'good':
        return 'bg-green-50 border-green-200'
      case 'excellent':
        return 'bg-emerald-50 border-emerald-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getProgressColor = (achievement: number) => {
    if (achievement >= 100) return 'bg-green-600'
    if (achievement >= 80) return 'bg-blue-600'
    if (achievement >= 60) return 'bg-yellow-600'
    return 'bg-red-600'
  }

  const getTrendIcon = (trend: KPI['trend']) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      case 'stable':
        return <Minus className="h-4 w-4 text-gray-500" />
      default:
        return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusIcon = (status: KPI['status']) => {
    switch (status) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      case 'warning':
        return <Clock className="h-5 w-5 text-yellow-600" />
      case 'normal':
        return <Target className="h-5 w-5 text-blue-600" />
      case 'good':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'excellent':
        return <Award className="h-5 w-5 text-emerald-600" />
      default:
        return <Target className="h-5 w-5 text-gray-600" />
    }
  }

  const getOverallScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600'
    if (score >= 80) return 'text-green-600'
    if (score >= 70) return 'text-blue-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getOverallScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent'
    if (score >= 80) return 'Good'
    if (score >= 70) return 'Normal'
    if (score >= 60) return 'Warning'
    return 'Critical'
  }

  const formatValue = (value: number, unit?: string) => {
    if (unit === 'currency') {
      return new Intl.NumberFormat('pl-PL', {
        style: 'currency',
        currency: 'PLN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value)
    }

    if (unit === 'percentage') {
      return `${value.toFixed(1)}%`
    }

    if (unit === 'time') {
      // Format as minutes/hours
      if (value >= 60) {
        return `${(value / 60).toFixed(1)}h`
      }
      return `${value.toFixed(0)}m`
    }

    // Default number formatting
    return new Intl.NumberFormat('pl-PL').format(value)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: columns }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-2 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overall Score Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Overall Performance Score</h3>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className={cn("text-3xl font-bold", getOverallScoreColor(overallScore))}>
                  {overallScore.toFixed(1)}
                </span>
                <span className="text-sm text-muted-foreground">/ 100</span>
                <Badge variant="outline" className="ml-2">
                  {getOverallScoreLabel(overallScore)}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <Progress value={overallScore} className="w-32 h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                Based on {kpis.length} KPIs
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards Grid */}
      <div className={`grid gap-4 md:grid-cols-${Math.min(columns, kpis.length)}`}>
        {kpis.map((kpi, index) => (
          <Card
            key={index}
            className={cn(
              "relative overflow-hidden transition-all duration-200 hover:shadow-md",
              getStatusBgColor(kpi.status)
            )}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(kpi.status)}
                  <CardTitle className="text-sm font-medium text-gray-900">
                    {kpi.name}
                  </CardTitle>
                </div>
                <Badge variant={getStatusColor(kpi.status)} className="text-xs">
                  {kpi.status}
                </Badge>
              </div>
              {kpi.description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {kpi.description}
                </p>
              )}
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {/* Current Value */}
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-gray-900">
                    {formatValue(kpi.value, kpi.unit)}
                  </span>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(kpi.trend)}
                  </div>
                </div>

                {/* Target and Achievement */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Target:</span>
                    <span className="font-medium">
                      {formatValue(kpi.target, kpi.unit)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Achievement:</span>
                    <span className={cn(
                      "font-medium",
                      kpi.achievement >= 100 ? "text-green-600" :
                      kpi.achievement >= 80 ? "text-blue-600" :
                      kpi.achievement >= 60 ? "text-yellow-600" : "text-red-600"
                    )}>
                      {kpi.achievement.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <Progress
                    value={Math.min(kpi.achievement, 100)}
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>{Math.min(kpi.achievement, 100).toFixed(0)}%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Performance Indicator */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <span className="text-xs text-muted-foreground">Performance</span>
                  <div className="flex items-center gap-1">
                    {kpi.achievement >= 100 && (
                      <div className="flex items-center gap-1 text-green-600">
                        <Award className="h-3 w-3" />
                        <span className="text-xs font-medium">Target Met</span>
                      </div>
                    )}
                    {kpi.achievement < 100 && kpi.achievement >= 80 && (
                      <span className="text-xs font-medium text-blue-600">On Track</span>
                    )}
                    {kpi.achievement < 80 && kpi.achievement >= 60 && (
                      <span className="text-xs font-medium text-yellow-600">Needs Attention</span>
                    )}
                    {kpi.achievement < 60 && (
                      <span className="text-xs font-medium text-red-600">Critical</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">KPI Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {kpis.filter(kpi => kpi.achievement >= 100).length}
              </div>
              <p className="text-sm text-muted-foreground">Targets Met</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {kpis.filter(kpi => kpi.achievement >= 80 && kpi.achievement < 100).length}
              </div>
              <p className="text-sm text-muted-foreground">On Track</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {kpis.filter(kpi => kpi.achievement >= 60 && kpi.achievement < 80).length}
              </div>
              <p className="text-sm text-muted-foreground">Needs Attention</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {kpis.filter(kpi => kpi.achievement < 60).length}
              </div>
              <p className="text-sm text-muted-foreground">Critical</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}