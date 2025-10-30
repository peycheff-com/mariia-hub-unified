/**
 * Revenue Forecasting and Prediction System
 * Advanced algorithms for revenue prediction, trend analysis, and forecasting
 */

import { supabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'

type RevenueAnalytics = Database['public']['Tables']['revenue_analytics']['Row']
type ForecastModel = Database['public']['Tables']['forecast_models']['Row']
type ForecastResult = Database['public']['Tables']['forecast_results']['Row']

interface ForecastDataPoint {
  date: string
  revenue: number
  bookings: number
  averageValue: number
  dayOfWeek: number
  month: number
  quarter: number
  year: number
  isWeekend: boolean
  isHoliday: boolean
  seasonality: string
}

interface ForecastConfig {
  modelType: 'linear_regression' | 'exponential_smoothing' | 'arima' | 'prophet' | 'lstm'
  predictionHorizon: number // days
  confidenceInterval: number // 0-1
  seasonalityFactors: boolean
  externalFactors: boolean
}

interface ForecastResult {
  predictions: Array<{
    date: string
    predicted: number
    confidenceUpper: number
    confidenceLower: number
    factors: {
      trend: number
      seasonal: number
      residual: number
    }
  }>
  accuracy: {
    mae: number // Mean Absolute Error
    rmse: number // Root Mean Square Error
    mape: number // Mean Absolute Percentage Error
    r2: number // R-squared
  }
  modelInfo: {
    type: string
    trainedAt: string
    dataPoints: number
    features: string[]
  }
}

class RevenueForecastingEngine {
  private static instance: RevenueForecastingEngine
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

  private constructor() {}

  public static getInstance(): RevenueForecastingEngine {
    if (!RevenueForecastingEngine.instance) {
      RevenueForecastingEngine.instance = new RevenueForecastingEngine()
    }
    return RevenueForecastingEngine.instance
  }

  /**
   * Prepare historical data for forecasting
   */
  public async prepareHistoricalData(days: number = 365): Promise<ForecastDataPoint[]> {
    const cacheKey = `historical_data_${days}`
    const cached = this.cache.get(cacheKey)

    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data
    }

    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data, error } = await supabase
        .from('revenue_analytics')
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true })

      if (error) throw error

      const processedData: ForecastDataPoint[] = (data || []).map(item => {
        const date = new Date(item.date)
        return {
          date: item.date,
          revenue: item.total_revenue,
          bookings: item.bookings_count,
          averageValue: item.average_booking_value,
          dayOfWeek: date.getDay(),
          month: date.getMonth(),
          quarter: Math.floor(date.getMonth() / 3) + 1,
          year: date.getFullYear(),
          isWeekend: date.getDay() === 0 || date.getDay() === 6,
          isHoliday: this.isHoliday(date),
          seasonality: this.getSeason(date.getMonth())
        }
      })

      // Cache the data
      this.cache.set(cacheKey, {
        data: processedData,
        timestamp: Date.now(),
        ttl: 3600000 // 1 hour
      })

      return processedData
    } catch (error) {
      console.error('Error preparing historical data:', error)
      return []
    }
  }

  /**
   * Generate revenue forecast using linear regression
   */
  public async generateForecast(config: ForecastConfig): Promise<ForecastResult> {
    try {
      // Get historical data
      const historicalData = await this.prepareHistoricalData(Math.min(365, config.predictionHorizon * 3))

      if (historicalData.length < 30) {
        throw new Error('Insufficient historical data for forecasting')
      }

      let predictions: any[] = []
      let accuracy: any = {}

      switch (config.modelType) {
        case 'linear_regression':
          ({ predictions, accuracy } = this.linearRegressionForecast(historicalData, config))
          break
        case 'exponential_smoothing':
          ({ predictions, accuracy } = this.exponentialSmoothingForecast(historicalData, config))
          break
        case 'arima':
          ({ predictions, accuracy } = this.arimaForecast(historicalData, config))
          break
        case 'prophet':
          ({ predictions, accuracy } = this.prophetForecast(historicalData, config))
          break
        case 'lstm':
          ({ predictions, accuracy } = this.lstmForecast(historicalData, config))
          break
        default:
          throw new Error(`Unsupported model type: ${config.modelType}`)
      }

      // Save forecast results to database
      await this.saveForecastResults(config, predictions, accuracy)

      return {
        predictions,
        accuracy,
        modelInfo: {
          type: config.modelType,
          trainedAt: new Date().toISOString(),
          dataPoints: historicalData.length,
          features: this.getFeatureNames(config)
        }
      }
    } catch (error) {
      console.error('Error generating forecast:', error)
      throw error
    }
  }

  /**
   * Linear regression forecasting
   */
  private linearRegressionForecast(data: ForecastDataPoint[], config: ForecastConfig): {
    predictions: any[]
    accuracy: any
  } {
    const n = data.length
    const lastDate = new Date(data[data.length - 1].date)

    // Simple linear regression with trend and seasonality
    const trend = this.calculateTrend(data)
    const seasonality = config.seasonalityFactors ? this.calculateSeasonality(data) : null

    const predictions = []
    for (let i = 1; i <= config.predictionHorizon; i++) {
      const futureDate = new Date(lastDate)
      futureDate.setDate(futureDate.getDate() + i)

      let predicted = trend.intercept + trend.slope * (n + i)

      // Add seasonality factor
      if (seasonality) {
        const dayOfWeek = futureDate.getDay()
        const month = futureDate.getMonth()
        predicted *= seasonality.dayOfWeek[dayOfWeek] * seasonality.month[month]
      }

      const confidence = this.calculateConfidenceInterval(predicted, trend.mse, i)

      predictions.push({
        date: futureDate.toISOString().split('T')[0],
        predicted: Math.max(0, predicted),
        confidenceUpper: Math.max(0, predicted + confidence),
        confidenceLower: Math.max(0, predicted - confidence),
        factors: {
          trend: trend.intercept + trend.slope * (n + i),
          seasonal: seasonality ? seasonality.dayOfWeek[futureDate.getDay()] * seasonality.month[futureDate.getMonth()] : 1,
          residual: 0
        }
      })
    }

    // Calculate accuracy metrics
    const accuracy = this.calculateAccuracy(data, predictions.slice(0, Math.min(30, predictions.length)))

    return { predictions, accuracy }
  }

  /**
   * Exponential smoothing forecasting
   */
  private exponentialSmoothingForecast(data: ForecastDataPoint[], config: ForecastConfig): {
    predictions: any[]
    accuracy: any
  } {
    const alpha = 0.3 // Smoothing factor
    const beta = 0.1 // Trend smoothing factor
    const gamma = 0.1 // Seasonality smoothing factor

    let level = data[0].revenue
    let trend = 0
    let seasonality: number[] = new Array(7).fill(1) // Weekly seasonality

    // Initialize Holt-Winters parameters
    for (let i = 1; i < data.length; i++) {
      const value = data[i].revenue
      const dayOfWeek = data[i].dayOfWeek

      const prevLevel = level
      const prevTrend = trend
      const prevSeasonality = seasonality[dayOfWeek]

      level = alpha * (value / prevSeasonality) + (1 - alpha) * (prevLevel + prevTrend)
      trend = beta * (level - prevLevel) + (1 - beta) * prevTrend
      seasonality[dayOfWeek] = gamma * (value / level) + (1 - gamma) * prevSeasonality
    }

    // Generate predictions
    const predictions = []
    for (let i = 1; i <= config.predictionHorizon; i++) {
      const futureDate = new Date(data[data.length - 1].date)
      futureDate.setDate(futureDate.getDate() + i)
      const dayOfWeek = futureDate.getDay()

      const predicted = (level + i * trend) * seasonality[dayOfWeek]
      const confidence = this.calculateConfidenceInterval(predicted, this.calculateVariance(data), i)

      predictions.push({
        date: futureDate.toISOString().split('T')[0],
        predicted: Math.max(0, predicted),
        confidenceUpper: Math.max(0, predicted + confidence),
        confidenceLower: Math.max(0, predicted - confidence),
        factors: {
          trend: level + i * trend,
          seasonal: seasonality[dayOfWeek],
          residual: 0
        }
      })
    }

    const accuracy = this.calculateAccuracy(data, predictions.slice(0, Math.min(30, predictions.length)))

    return { predictions, accuracy }
  }

  /**
   * ARIMA-like forecasting (simplified)
   */
  private arimaForecast(data: ForecastDataPoint[], config: ForecastConfig): {
    predictions: any[]
    accuracy: any
  } {
    // Simplified ARIMA implementation using moving averages and differencing
    const differences = this.differenceSeries(data.map(d => d.revenue))
    const movingAvg = this.calculateMovingAverage(differences, 7)

    const predictions = []
    let lastValue = data[data.length - 1].revenue

    for (let i = 1; i <= config.predictionHorizon; i++) {
      const trend = movingAvg[movingAvg.length - 1] || 0
      const seasonalFactor = config.seasonalityFactors ? this.getSeasonalFactor(data, i) : 1

      const predicted = lastValue + (trend * seasonalFactor)
      const confidence = this.calculateConfidenceInterval(predicted, this.calculateVariance(data), i)

      predictions.push({
        date: this.addDaysToDate(data[data.length - 1].date, i),
        predicted: Math.max(0, predicted),
        confidenceUpper: Math.max(0, predicted + confidence),
        confidenceLower: Math.max(0, predicted - confidence),
        factors: {
          trend: trend,
          seasonal: seasonalFactor,
          residual: 0
        }
      })

      lastValue = predicted
    }

    const accuracy = this.calculateAccuracy(data, predictions.slice(0, Math.min(30, predictions.length)))

    return { predictions, accuracy }
  }

  /**
   * Prophet-like forecasting (simplified)
   */
  private prophetForecast(data: ForecastDataPoint[], config: ForecastConfig): {
    predictions: any[]
    accuracy: any
  } {
    // Simplified Prophet-like model with trend, weekly seasonality, and yearly seasonality
    const trend = this.calculateTrend(data)
    const weeklySeasonality = this.calculateWeeklySeasonality(data)
    const yearlySeasonality = this.calculateYearlySeasonality(data)

    const predictions = []
    const lastDate = new Date(data[data.length - 1].date)

    for (let i = 1; i <= config.predictionHorizon; i++) {
      const futureDate = new Date(lastDate)
      futureDate.setDate(futureDate.getDate() + i)

      const dayOfYear = this.getDayOfYear(futureDate)
      const dayOfWeek = futureDate.getDay()

      const trendValue = trend.intercept + trend.slope * (data.length + i)
      const weeklyValue = weeklySeasonality[dayOfWeek] || 1
      const yearlyValue = yearlySeasonality[dayOfYear] || 1

      const predicted = trendValue * weeklyValue * yearlyValue
      const confidence = this.calculateConfidenceInterval(predicted, trend.mse, i)

      predictions.push({
        date: futureDate.toISOString().split('T')[0],
        predicted: Math.max(0, predicted),
        confidenceUpper: Math.max(0, predicted + confidence),
        confidenceLower: Math.max(0, predicted - confidence),
        factors: {
          trend: trendValue,
          seasonal: weeklyValue * yearlyValue,
          residual: 0
        }
      })
    }

    const accuracy = this.calculateAccuracy(data, predictions.slice(0, Math.min(30, predictions.length)))

    return { predictions, accuracy }
  }

  /**
   * LSTM-like forecasting (simplified neural network approach)
   */
  private lstmForecast(data: ForecastDataPoint[], config: ForecastConfig): {
    predictions: any[]
    accuracy: any
  } {
    // Simplified LSTM-like approach using weighted moving averages and patterns
    const sequenceLength = 14 // Use last 14 days to predict next day
    const patterns = this.extractPatterns(data, sequenceLength)

    const predictions = []
    let lastSequence = data.slice(-sequenceLength).map(d => d.revenue)

    for (let i = 1; i <= config.predictionHorizon; i++) {
      // Find similar patterns in historical data
      const similarity = this.findSimilarPattern(lastSequence, patterns)

      // Weighted prediction based on similar patterns
      let predicted = 0
      let totalWeight = 0

      similarity.forEach(({ pattern, weight, nextValue }) => {
        predicted += nextValue * weight
        totalWeight += weight
      })

      predicted = totalWeight > 0 ? predicted / totalWeight : lastSequence[lastSequence.length - 1]

      // Apply trend correction
      const trendCorrection = this.calculateTrendCorrection(lastSequence)
      predicted *= (1 + trendCorrection)

      const confidence = this.calculateConfidenceInterval(predicted, this.calculateVariance(data), i)

      predictions.push({
        date: this.addDaysToDate(data[data.length - 1].date, i),
        predicted: Math.max(0, predicted),
        confidenceUpper: Math.max(0, predicted + confidence),
        confidenceLower: Math.max(0, predicted - confidence),
        factors: {
          trend: trendCorrection,
          seasonal: 1,
          residual: 0
        }
      })

      // Update sequence for next prediction
      lastSequence = [...lastSequence.slice(1), predicted]
    }

    const accuracy = this.calculateAccuracy(data, predictions.slice(0, Math.min(30, predictions.length)))

    return { predictions, accuracy }
  }

  // Helper methods
  private calculateTrend(data: ForecastDataPoint[]): { intercept: number; slope: number; mse: number } {
    const n = data.length
    const x = Array.from({ length: n }, (_, i) => i)
    const y = data.map(d => d.revenue)

    const sumX = x.reduce((a, b) => a + b, 0)
    const sumY = y.reduce((a, b) => a + b, 0)
    const sumXY = x.reduce((total, xi, i) => total + xi * y[i], 0)
    const sumX2 = x.reduce((total, xi) => total + xi * xi, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    // Calculate MSE
    const predictions = x.map(xi => intercept + slope * xi)
    const mse = predictions.reduce((total, pred, i) => total + Math.pow(y[i] - pred, 2), 0) / n

    return { intercept, slope, mse }
  }

  private calculateSeasonality(data: ForecastDataPoint[]): { dayOfWeek: number[]; month: number[] } {
    const dayOfWeekSums = new Array(7).fill(0)
    const dayOfWeekCounts = new Array(7).fill(0)
    const monthSums = new Array(12).fill(0)
    const monthCounts = new Array(12).fill(0)

    // Calculate overall average
    const overallAvg = data.reduce((sum, d) => sum + d.revenue, 0) / data.length

    data.forEach(point => {
      const dayOfWeek = point.dayOfWeek
      const month = point.month

      dayOfWeekSums[dayOfWeek] += point.revenue / overallAvg
      dayOfWeekCounts[dayOfWeek]++
      monthSums[month] += point.revenue / overallAvg
      monthCounts[month]++
    })

    return {
      dayOfWeek: dayOfWeekSums.map((sum, i) => dayOfWeekCounts[i] > 0 ? sum / dayOfWeekCounts[i] : 1),
      month: monthSums.map((sum, i) => monthCounts[i] > 0 ? sum / monthCounts[i] : 1)
    }
  }

  private calculateWeeklySeasonality(data: ForecastDataPoint[]): number[] {
    const dayOfWeekAvg = new Array(7).fill(0)
    const dayOfWeekCounts = new Array(7).fill(0)

    data.forEach(point => {
      dayOfWeekAvg[point.dayOfWeek] += point.revenue
      dayOfWeekCounts[point.dayOfWeek]++
    })

    const overallAvg = data.reduce((sum, d) => sum + d.revenue, 0) / data.length

    return dayOfWeekAvg.map((avg, i) => dayOfWeekCounts[i] > 0 ? avg / dayOfWeekCounts[i] / overallAvg : 1)
  }

  private calculateYearlySeasonality(data: ForecastDataPoint[]): number[] {
    const dayOfYearAvg = new Array(366).fill(0)
    const dayOfYearCounts = new Array(366).fill(0)

    data.forEach(point => {
      const dayOfYear = this.getDayOfYear(new Date(point.date))
      dayOfYearAvg[dayOfYear] += point.revenue
      dayOfYearCounts[dayOfYear]++
    })

    const overallAvg = data.reduce((sum, d) => sum + d.revenue, 0) / data.length

    return dayOfYearAvg.map((avg, i) => dayOfYearCounts[i] > 0 ? avg / dayOfYearCounts[i] / overallAvg : 1)
  }

  private differenceSeries(series: number[]): number[] {
    return series.slice(1).map((value, index) => value - series[index])
  }

  private calculateMovingAverage(series: number[], window: number): number[] {
    const result = []
    for (let i = window - 1; i < series.length; i++) {
      const sum = series.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0)
      result.push(sum / window)
    }
    return result
  }

  private calculateVariance(data: ForecastDataPoint[]): number {
    const values = data.map(d => d.revenue)
    const mean = values.reduce((a, b) => a + b, 0) / values.length
    return values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length
  }

  private calculateConfidenceInterval(value: number, variance: number, horizon: number): number {
    // 95% confidence interval that widens with prediction horizon
    const stdDev = Math.sqrt(variance)
    const multiplier = 1.96 * Math.sqrt(horizon) // Widen with horizon
    return stdDev * multiplier
  }

  private calculateAccuracy(actual: ForecastDataPoint[], predictions: any[]): any {
    if (actual.length === 0 || predictions.length === 0) {
      return { mae: 0, rmse: 0, mape: 0, r2: 0 }
    }

    const n = Math.min(actual.length, predictions.length)
    let mae = 0
    let rmse = 0
    let mape = 0

    for (let i = 0; i < n; i++) {
      const actualValue = actual[i].revenue
      const predictedValue = predictions[i].predicted

      mae += Math.abs(actualValue - predictedValue)
      rmse += Math.pow(actualValue - predictedValue, 2)
      mape += Math.abs((actualValue - predictedValue) / actualValue)
    }

    mae /= n
    rmse = Math.sqrt(rmse / n)
    mape = (mape / n) * 100

    // Calculate R-squared
    const actualMean = actual.slice(0, n).reduce((sum, d) => sum + d.revenue, 0) / n
    let totalSumSquares = 0
    let residualSumSquares = 0

    for (let i = 0; i < n; i++) {
      const actualValue = actual[i].revenue
      const predictedValue = predictions[i].predicted

      totalSumSquares += Math.pow(actualValue - actualMean, 2)
      residualSumSquares += Math.pow(actualValue - predictedValue, 2)
    }

    const r2 = 1 - (residualSumSquares / totalSumSquares)

    return { mae, rmse, mape, r2 }
  }

  private getSeasonalFactor(data: ForecastDataPoint[], dayOffset: number): number {
    const dayOfWeek = (data[data.length - 1].dayOfWeek + dayOffset) % 7
    const dayOfWeekData = data.filter(d => d.dayOfWeek === dayOfWeek)

    if (dayOfWeekData.length === 0) return 1

    const avgForDay = dayOfWeekData.reduce((sum, d) => sum + d.revenue, 0) / dayOfWeekData.length
    const overallAvg = data.reduce((sum, d) => sum + d.revenue, 0) / data.length

    return overallAvg > 0 ? avgForDay / overallAvg : 1
  }

  private extractPatterns(data: ForecastDataPoint[], sequenceLength: number): Array<{
    pattern: number[]
    nextValue: number
  }> {
    const patterns = []
    const values = data.map(d => d.revenue)

    for (let i = 0; i <= values.length - sequenceLength - 1; i++) {
      patterns.push({
        pattern: values.slice(i, i + sequenceLength),
        nextValue: values[i + sequenceLength]
      })
    }

    return patterns
  }

  private findSimilarPattern(sequence: number[], patterns: Array<{ pattern: number[]; nextValue: number }>): Array<{
    pattern: number[]
    weight: number
    nextValue: number
  }> {
    const similarities = patterns.map(({ pattern, nextValue }) => {
      let similarity = 0
      const minLength = Math.min(sequence.length, pattern.length)

      for (let i = 0; i < minLength; i++) {
        const diff = Math.abs(sequence[i] - pattern[i])
        const maxVal = Math.max(Math.abs(sequence[i]), Math.abs(pattern[i]))
        similarity += maxVal > 0 ? 1 - (diff / maxVal) : 1
      }

      return {
        pattern,
        weight: similarity / minLength,
        nextValue
      }
    })

    // Return top 5 most similar patterns
    return similarities
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5)
      .filter(s => s.weight > 0.5) // Only use reasonably similar patterns
  }

  private calculateTrendCorrection(sequence: number[]): number {
    if (sequence.length < 2) return 0

    const recent = sequence.slice(-7) // Last 7 values
    const older = sequence.slice(-14, -7) // Previous 7 values

    if (older.length === 0) return 0

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length

    return olderAvg > 0 ? (recentAvg - olderAvg) / olderAvg : 0
  }

  private getDayOfYear(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 0)
    const diff = date.getTime() - start.getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24))
  }

  private addDaysToDate(dateString: string, days: number): string {
    const date = new Date(dateString)
    date.setDate(date.getDate() + days)
    return date.toISOString().split('T')[0]
  }

  private isHoliday(date: Date): boolean {
    // Simplified holiday detection - in a real implementation, this would check against a holiday calendar
    const month = date.getMonth()
    const day = date.getDate()

    // Polish holidays (simplified)
    if ((month === 0 && day === 1) || // New Year
        (month === 0 && day === 6) || // Epiphany
        (month === 4 && day === 1) || // Labor Day
        (month === 4 && day === 3) || // Constitution Day
        (month === 7 && day === 15) || // Assumption Day
        (month === 10 && day === 1) || // All Saints' Day
        (month === 10 && day === 11) || // Independence Day
        (month === 11 && day === 25) || // Christmas
        (month === 11 && day === 26)) { // Second Christmas Day
      return true
    }

    return false
  }

  private getSeason(month: number): string {
    if (month >= 2 && month <= 4) return 'spring'
    if (month >= 5 && month <= 7) return 'summer'
    if (month >= 8 && month <= 10) return 'autumn'
    return 'winter'
  }

  private getFeatureNames(config: ForecastConfig): string[] {
    const features = ['trend']
    if (config.seasonalityFactors) {
      features.push('day_of_week', 'month', 'seasonality')
    }
    if (config.externalFactors) {
      features.push('holidays', 'external_events')
    }
    return features
  }

  private async saveForecastResults(config: ForecastConfig, predictions: any[], accuracy: any): Promise<void> {
    try {
      // Save model information
      const { data: model, error: modelError } = await supabase
        .from('forecast_models')
        .upsert({
          model_name: `revenue_forecast_${config.modelType}`,
          model_type: config.modelType,
          target_variable: 'revenue',
          input_features: this.getFeatureNames(config),
          accuracy_metrics: accuracy,
          prediction_horizon_days: config.predictionHorizon,
          is_active: true
        }, {
          onConflict: 'model_name'
        })
        .select()
        .single()

      if (modelError) throw modelError

      // Save forecast results
      const forecastResults = predictions.map(pred => ({
        model_id: model.id,
        prediction_date: pred.date,
        target_date: pred.date,
        predicted_value: pred.predicted,
        confidence_interval_lower: pred.confidenceLower,
        confidence_interval_upper: pred.confidenceUpper,
        prediction_metadata: pred.factors
      }))

      const { error: resultsError } = await supabase
        .from('forecast_results')
        .insert(forecastResults)

      if (resultsError) throw resultsError

    } catch (error) {
      console.error('Error saving forecast results:', error)
    }
  }

  /**
   * Get forecast accuracy over time
   */
  public async getForecastAccuracy(modelId: string, days: number = 30): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('forecast_results')
        .select('*')
        .eq('model_id', modelId)
        .gte('target_date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .not('actual_value', 'is', null)
        .order('target_date', { ascending: true })

      if (error) throw error

      if (!data || data.length === 0) {
        return { accuracy: 0, predictions: [] }
      }

      const errors = data.map(d => ({
        date: d.target_date,
        predicted: d.predicted_value,
        actual: d.actual_value,
        error: Math.abs(d.predicted_value - d.actual_value!),
        errorPercentage: d.actual_value ? Math.abs((d.predicted_value - d.actual_value!) / d.actual_value) * 100 : 0
      }))

      const avgAccuracy = 100 - (errors.reduce((sum, e) => sum + e.errorPercentage, 0) / errors.length)

      return {
        accuracy: avgAccuracy,
        predictions: errors,
        mae: errors.reduce((sum, e) => sum + e.error, 0) / errors.length,
        mape: errors.reduce((sum, e) => sum + e.errorPercentage, 0) / errors.length
      }
    } catch (error) {
      console.error('Error getting forecast accuracy:', error)
      return { accuracy: 0, predictions: [] }
    }
  }

  /**
   * Get the best performing model
   */
  public async getBestModel(modelType?: string): Promise<ForecastModel | null> {
    try {
      let query = supabase
        .from('forecast_models')
        .select('*')
        .eq('is_active', true)

      if (modelType) {
        query = query.eq('model_type', modelType)
      }

      const { data, error } = await query
        .order('accuracy_metrics', { ascending: false })
        .limit(1)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error getting best model:', error)
      return null
    }
  }
}

// Export singleton instance
export const revenueForecasting = RevenueForecastingEngine.getInstance()

// Export types
export type {
  ForecastDataPoint,
  ForecastConfig,
  ForecastResult
}