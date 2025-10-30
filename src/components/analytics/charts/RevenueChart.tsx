/**
 * Revenue Chart Component
 * Interactive line chart for revenue visualization with tooltips and zoom functionality
 */

import React, { useState, useMemo, useRef } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
  BarChart,
  Bar
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TrendingUp, TrendingDown, BarChart3, LineChart as LineChartIcon, AreaChartIcon } from 'lucide-react'
import { formatCurrency, formatNumber } from '@/lib/utils'

interface RevenueDataPoint {
  date: string
  revenue: number
  bookings: number
  averageValue: number
}

interface RevenueChartProps {
  data: RevenueDataPoint[]
  height?: number
  showControls?: boolean
  chartType?: 'line' | 'area' | 'bar'
}

export const RevenueChart: React.FC<RevenueChartProps> = ({
  data,
  height = 300,
  showControls = true,
  chartType = 'line'
}) => {
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'bookings' | 'averageValue'>('revenue')
  const [chartTypeState, setChartTypeState] = useState(chartType)
  const [timeRange, setTimeRange] = useState<'all' | '7d' | '30d' | '90d'>('all')

  // Filter data based on time range
  const filteredData = useMemo(() => {
    if (timeRange === 'all') return data

    const now = new Date()
    let cutoffDate: Date

    switch (timeRange) {
      case '7d':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      default:
        return data
    }

    return data.filter(item => new Date(item.date) >= cutoffDate)
  }, [data, timeRange])

  // Calculate trend
  const trend = useMemo(() => {
    if (filteredData.length < 2) return { direction: 'stable', percentage: 0 }

    const recent = filteredData.slice(-7)
    const previous = filteredData.slice(-14, -7)

    const recentSum = recent.reduce((sum, item) => sum + item[selectedMetric], 0)
    const previousSum = previous.reduce((sum, item) => sum + item[selectedMetric], 0)

    if (previousSum === 0) return { direction: 'stable', percentage: 0 }

    const percentage = ((recentSum - previousSum) / previousSum) * 100
    return {
      direction: percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'stable',
      percentage: Math.abs(percentage)
    }
  }, [filteredData, selectedMetric])

  // Calculate statistics
  const statistics = useMemo(() => {
    if (filteredData.length === 0) {
      return {
        total: 0,
        average: 0,
        max: 0,
        min: 0
      }
    }

    const values = filteredData.map(item => item[selectedMetric])
    const total = values.reduce((sum, value) => sum + value, 0)
    const average = total / values.length
    const max = Math.max(...values)
    const min = Math.min(...values)

    return { total, average, max, min }
  }, [filteredData, selectedMetric])

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload

      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{new Date(label).toLocaleDateString()}</p>
          <div className="space-y-1 mt-2">
            <p className="text-sm">
              <span className="text-muted-foreground">Revenue:</span>{' '}
              <span className="font-medium">{formatCurrency(data.revenue)}</span>
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Bookings:</span>{' '}
              <span className="font-medium">{formatNumber(data.bookings)}</span>
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Avg Value:</span>{' '}
              <span className="font-medium">{formatCurrency(data.averageValue)}</span>
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  // Format date for X-axis
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })
  }

  // Render chart based on type
  const renderChart = () => {
    const commonProps = {
      data: filteredData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    }

    switch (chartTypeState) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tickFormatter={(value) => {
                if (selectedMetric === 'revenue' || selectedMetric === 'averageValue') {
                  return `${(value / 1000).toFixed(0)}k`
                }
                return formatNumber(value)
              }}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey={selectedMetric}
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </AreaChart>
        )

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tickFormatter={(value) => {
                if (selectedMetric === 'revenue' || selectedMetric === 'averageValue') {
                  return `${(value / 1000).toFixed(0)}k`
                }
                return formatNumber(value)
              }}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey={selectedMetric}
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        )

      case 'line':
      default:
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tickFormatter={(value) => {
                if (selectedMetric === 'revenue' || selectedMetric === 'averageValue') {
                  return `${(value / 1000).toFixed(0)}k`
                }
                return formatNumber(value)
              }}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey={selectedMetric}
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        )
    }
  }

  return (
    <div className="space-y-4">
      {showControls && (
        <div className="flex flex-wrap items-center gap-4">
          {/* Metric Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Metric:</span>
            <Select value={selectedMetric} onValueChange={(value: any) => setSelectedMetric(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="bookings">Bookings</SelectItem>
                <SelectItem value="averageValue">Avg Value</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Chart Type Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Type:</span>
            <div className="flex gap-1">
              <Button
                variant={chartTypeState === 'line' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartTypeState('line')}
              >
                <LineChartIcon className="h-4 w-4" />
              </Button>
              <Button
                variant={chartTypeState === 'area' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartTypeState('area')}
              >
                <AreaChartIcon className="h-4 w-4" />
              </Button>
              <Button
                variant={chartTypeState === 'bar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartTypeState('bar')}
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Period:</span>
            <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="7d">7 Days</SelectItem>
                <SelectItem value="30d">30 Days</SelectItem>
                <SelectItem value="90d">90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">
              {selectedMetric === 'revenue' || selectedMetric === 'averageValue'
                ? formatCurrency(statistics.total)
                : formatNumber(statistics.total)
              }
            </div>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">
              {selectedMetric === 'revenue' || selectedMetric === 'averageValue'
                ? formatCurrency(statistics.average)
                : formatNumber(statistics.average)
              }
            </div>
            <p className="text-xs text-muted-foreground">Average</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">
              {selectedMetric === 'revenue' || selectedMetric === 'averageValue'
                ? formatCurrency(statistics.max)
                : formatNumber(statistics.max)
              }
            </div>
            <p className="text-xs text-muted-foreground">Peak</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">
                {trend.percentage.toFixed(1)}%
              </div>
              {trend.direction === 'up' && <TrendingUp className="h-5 w-5 text-green-600" />}
              {trend.direction === 'down' && <TrendingDown className="h-5 w-5 text-red-600" />}
            </div>
            <p className="text-xs text-muted-foreground">7-Day Trend</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Chart */}
      <Card>
        <CardContent className="pt-6">
          <div style={{ height: `${height}px` }}>
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}