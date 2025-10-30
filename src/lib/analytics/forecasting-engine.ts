/**
 * AI-Powered Forecasting Engine
 * Advanced predictive analytics with multiple forecasting models for luxury beauty/fitness platform
 */

import { supabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'

type ForecastModel = Database['public']['Tables']['forecast_models']['Row']
type ForecastResult = Database['public']['Tables']['forecast_results']['Row']

interface TimeSeriesData {
  date: string
  value: number
  [key: string]: any
}

interface ForecastingOptions {
  horizon: number // Number of days to forecast
  confidenceLevel: number // 0.8, 0.9, 0.95
  seasonality: boolean
  includeWeekends: boolean
  modelType?: 'linear' | 'polynomial' | 'exponential' | 'arima' | 'prophet' | 'lstm'
}

interface ForecastResultExtended {
  predictions: Array<{
    date: string
    value: number
    confidenceInterval: [number, number]
    probability: number
  }>
  modelAccuracy: {
    mae: number // Mean Absolute Error
    rmse: number // Root Mean Square Error
    mape: number // Mean Absolute Percentage Error
    r2: number // R-squared
  }
  seasonality: {
    weekly: number[]
    monthly: number[]
    yearly: number[]
  }
  trends: {
    direction: 'up' | 'down' | 'stable'
    strength: number // 0-1
    changePoints: Array<{
      date: string
      changeRate: number
    }>
  }
  recommendations: Array<{
    type: 'opportunity' | 'warning' | 'optimization'
    message: string
    confidence: number
    potentialImpact: number
  }>
}

class ForecastingEngine {
  private static instance: ForecastingEngine
  private readonly DEFAULT_CONFIDENCE_LEVEL = 0.9
  private readonly DEFAULT_HORIZON = 30
  private readonly MIN_DATA_POINTS = 30

  private constructor() {}

  public static getInstance(): ForecastingEngine {
    if (!ForecastingEngine.instance) {
      ForecastingEngine.instance = new ForecastingEngine()
    }
    return ForecastingEngine.instance
  }

  /**
   * Generate revenue forecast using multiple models
   */
  public async forecastRevenue(
    options: Partial<ForecastingOptions> = {}
  ): Promise<ForecastResultExtended> {
    const mergedOptions: ForecastingOptions = {
      horizon: options.horizon || this.DEFAULT_HORIZON,
      confidenceLevel: options.confidenceLevel || this.DEFAULT_CONFIDENCE_LEVEL,
      seasonality: options.seasonality !== false,
      includeWeekends: options.includeWeekends !== false,
      modelType: options.modelType || 'linear'
    }

    try {
      // Get historical revenue data
      const historicalData = await this.getHistoricalRevenueData()

      if (historicalData.length < this.MIN_DATA_POINTS) {
        throw new Error(`Insufficient data for forecasting. Need at least ${this.MIN_DATA_POINTS} data points.`)
      }

      // Preprocess data
      const preprocessedData = this.preprocessTimeSeries(historicalData)

      // Generate forecasts using multiple models
      const forecasts = await Promise.all([
        this.linearRegression(preprocessedData, mergedOptions),
        this.exponentialSmoothing(preprocessedData, mergedOptions),
        this.movingAverage(preprocessedData, mergedOptions),
        this.seasonalDecomposition(preprocessedData, mergedOptions)
      ])

      // Ensemble predictions (weighted average based on model accuracy)
      const ensembleForecast = this.ensembleForecasts(forecasts)

      // Calculate accuracy metrics
      const modelAccuracy = this.calculateModelAccuracy(preprocessedData, ensembleForecast)

      // Analyze seasonality patterns
      const seasonality = this.analyzeSeasonality(preprocessedData)

      // Detect trends and change points
      const trends = this.analyzeTrends(preprocessedData)

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        ensembleForecast,
        seasonality,
        trends
      )

      // Save forecast results to database
      await this.saveForecastResults('revenue_forecast', ensembleForecast, modelAccuracy, mergedOptions)

      return {
        predictions: ensembleForecast,
        modelAccuracy,
        seasonality,
        trends,
        recommendations
      }
    } catch (error) {
      console.error('Error generating revenue forecast:', error)
      throw error
    }
  }

  /**
   * Generate demand forecast for specific services
   */
  public async forecastDemand(
    serviceId?: string,
    options: Partial<ForecastingOptions> = {}
  ): Promise<ForecastResultExtended> {
    const mergedOptions: ForecastingOptions = {
      horizon: options.horizon || this.DEFAULT_HORIZON,
      confidenceLevel: options.confidenceLevel || this.DEFAULT_CONFIDENCE_LEVEL,
      seasonality: options.seasonality !== false,
      includeWeekends: options.includeWeekends !== false,
      modelType: options.modelType || 'linear'
    }

    try {
      // Get historical booking/demand data
      const historicalData = await this.getHistoricalDemandData(serviceId)

      if (historicalData.length < this.MIN_DATA_POINTS) {
        throw new Error(`Insufficient demand data for forecasting. Need at least ${this.MIN_DATA_POINTS} data points.`)
      }

      // Similar forecasting logic as revenue but adapted for demand
      const preprocessedData = this.preprocessTimeSeries(historicalData)

      const forecasts = await Promise.all([
        this.linearRegression(preprocessedData, mergedOptions),
        this.exponentialSmoothing(preprocessedData, mergedOptions),
        this.seasonalDecomposition(preprocessedData, mergedOptions)
      ])

      const ensembleForecast = this.ensembleForecasts(forecasts)
      const modelAccuracy = this.calculateModelAccuracy(preprocessedData, ensembleForecast)
      const seasonality = this.analyzeSeasonality(preprocessedData)
      const trends = this.analyzeTrends(preprocessedData)
      const recommendations = this.generateDemandRecommendations(
        ensembleForecast,
        seasonality,
        trends,
        serviceId
      )

      await this.saveForecastResults('demand_forecast', ensembleForecast, modelAccuracy, mergedOptions, serviceId)

      return {
        predictions: ensembleForecast,
        modelAccuracy,
        seasonality,
        trends,
        recommendations
      }
    } catch (error) {
      console.error('Error generating demand forecast:', error)
      throw error
    }
  }

  /**
   * Predict customer churn probability
   */
  public async predictChurn(userId: string): Promise<{
    churnProbability: number
    riskFactors: Array<{
      factor: string
      impact: number
      description: string
    }>
    recommendations: Array<{
      action: string
      priority: 'high' | 'medium' | 'low'
      estimatedImpact: number
    }>
  }> {
    try {
      // Get customer's historical data
      const customerData = await this.getCustomerHistoricalData(userId)

      if (!customerData || customerData.bookings.length < 2) {
        return {
          churnProbability: 0.1, // Default low risk for new customers
          riskFactors: [],
          recommendations: [{
            action: 'Focus on customer onboarding experience',
            priority: 'medium',
            estimatedImpact: 0.1
          }]
        }
      }

      // Calculate churn risk factors
      const riskFactors = this.calculateChurnRiskFactors(customerData)

      // Calculate overall churn probability using logistic regression
      const churnProbability = this.calculateChurnProbability(riskFactors)

      // Generate personalized recommendations
      const recommendations = this.generateChurnPreventionRecommendations(
        churnProbability,
        riskFactors,
        customerData
      )

      // Save prediction to database
      await this.saveChurnPrediction(userId, churnProbability, riskFactors)

      return {
        churnProbability,
        riskFactors,
        recommendations
      }
    } catch (error) {
      console.error('Error predicting churn:', error)
      throw error
    }
  }

  /**
   * Optimize pricing based on demand forecasting and competitor analysis
   */
  public async optimizePricing(
    serviceId: string,
    options: {
      timeHorizon?: number
      minPrice?: number
      maxPrice?: number
      competitorPrices?: number[]
    } = {}
  ): Promise<{
    recommendedPrice: number
    expectedDemand: number
    expectedRevenue: number
    priceElasticity: number
    confidence: number
    strategy: 'penetration' | 'premium' | 'value' | 'dynamic'
  }> {
    try {
      // Get historical demand data for price elasticity calculation
      const demandHistory = await this.getHistoricalDemandData(serviceId)
      const pricingHistory = await this.getHistoricalPricingData(serviceId)

      // Calculate price elasticity
      const priceElasticity = this.calculatePriceElasticity(demandHistory, pricingHistory)

      // Get demand forecast
      const demandForecast = await this.forecastDemand(serviceId, {
        horizon: options.timeHorizon || 30
      })

      // Generate pricing scenarios
      const scenarios = this.generatePricingScenarios(
        demandForecast,
        priceElasticity,
        options.minPrice,
        options.maxPrice,
        options.competitorPrices
      )

      // Select optimal pricing strategy
      const optimalScenario = this.selectOptimalPricing(scenarios)

      // Save pricing optimization results
      await this.savePricingOptimization(serviceId, optimalScenario)

      return optimalScenario
    } catch (error) {
      console.error('Error optimizing pricing:', error)
      throw error
    }
  }

  // Private forecasting model implementations

  private async linearRegression(
    data: TimeSeriesData[],
    options: ForecastingOptions
  ): Promise<Array<{ date: string; value: number; confidenceInterval: [number, number] }>> {
    const n = data.length
    const x = data.map((_, i) => i)
    const y = data.map(d => d.value)

    // Calculate linear regression coefficients
    const sumX = x.reduce((a, b) => a + b, 0)
    const sumY = y.reduce((a, b) => a + b, 0)
    const sumXY = x.reduce((total, xi, i) => total + xi * y[i], 0)
    const sumXX = x.reduce((total, xi) => total + xi * xi, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    // Calculate confidence intervals
    const predictions = []
    const lastDate = new Date(data[data.length - 1].date)

    for (let i = 1; i <= options.horizon; i++) {
      const predictedValue = slope * (n + i - 1) + intercept
      const confidenceRange = this.calculateConfidenceInterval(
        data,
        predictedValue,
        options.confidenceLevel
      )

      const futureDate = new Date(lastDate)
      futureDate.setDate(futureDate.getDate() + i)

      predictions.push({
        date: futureDate.toISOString().split('T')[0],
        value: Math.max(0, predictedValue),
        confidenceInterval: confidenceRange
      })
    }

    return predictions
  }

  private async exponentialSmoothing(
    data: TimeSeriesData[],
    options: ForecastingOptions
  ): Promise<Array<{ date: string; value: number; confidenceInterval: [number, number] }>> {
    // Simple exponential smoothing with trend (Holt's method)
    const alpha = 0.3 // Smoothing factor for level
    const beta = 0.1 // Smoothing factor for trend

    let level = data[0].value
    let trend = data.length > 1 ? data[1].value - data[0].value : 0

    // Initialize level and trend
    for (let i = 1; i < data.length; i++) {
      const newLevel = alpha * data[i].value + (1 - alpha) * (level + trend)
      const newTrend = beta * (newLevel - level) + (1 - beta) * trend
      level = newLevel
      trend = newTrend
    }

    // Generate forecasts
    const predictions = []
    const lastDate = new Date(data[data.length - 1].date)

    for (let i = 1; i <= options.horizon; i++) {
      const forecast = level + i * trend
      const confidenceRange = this.calculateConfidenceInterval(
        data,
        forecast,
        options.confidenceLevel
      )

      const futureDate = new Date(lastDate)
      futureDate.setDate(futureDate.getDate() + i)

      predictions.push({
        date: futureDate.toISOString().split('T')[0],
        value: Math.max(0, forecast),
        confidenceInterval: confidenceRange
      })
    }

    return predictions
  }

  private async movingAverage(
    data: TimeSeriesData[],
    options: ForecastingOptions
  ): Promise<Array<{ date: string; value: number; confidenceInterval: [number, number] }>> {
    const windowSize = Math.min(7, Math.floor(data.length / 3)) // 7-day or 1/3 of data window
    const predictions = []
    const lastDate = new Date(data[data.length - 1].date)

    for (let i = 1; i <= options.horizon; i++) {
      // Calculate moving average of recent values
      const recentValues = data.slice(-windowSize).map(d => d.value)
      const average = recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length

      // Add seasonal adjustment if enabled
      let adjustedValue = average
      if (options.seasonality) {
        const seasonalFactor = this.getSeasonalFactor(data, i)
        adjustedValue = average * seasonalFactor
      }

      const confidenceRange = this.calculateConfidenceInterval(
        data,
        adjustedValue,
        options.confidenceLevel
      )

      const futureDate = new Date(lastDate)
      futureDate.setDate(futureDate.getDate() + i)

      predictions.push({
        date: futureDate.toISOString().split('T')[0],
        value: Math.max(0, adjustedValue),
        confidenceInterval: confidenceRange
      })
    }

    return predictions
  }

  private async seasonalDecomposition(
    data: TimeSeriesData[],
    options: ForecastingOptions
  ): Promise<Array<{ date: string; value: number; confidenceInterval: [number, number] }>> {
    // Simple seasonal decomposition using moving averages
    const seasonalPeriod = 7 // Weekly seasonality
    const trendData = this.calculateTrend(data, seasonalPeriod)
    const seasonalFactors = this.calculateSeasonalFactors(data, seasonalPeriod)

    const predictions = []
    const lastDate = new Date(data[data.length - 1].date)
    const lastTrend = trendData[trendData.length - 1]

    for (let i = 1; i <= options.horizon; i++) {
      // Project trend forward
      const trendValue = lastTrend + (trendData[trendData.length - 1] - trendData[trendData.length - 2]) * i

      // Apply seasonal factor
      const seasonalIndex = (data.length + i - 1) % seasonalPeriod
      const seasonalFactor = seasonalFactors[seasonalIndex]

      const forecast = trendValue * seasonalFactor

      const confidenceRange = this.calculateConfidenceInterval(
        data,
        forecast,
        options.confidenceLevel
      )

      const futureDate = new Date(lastDate)
      futureDate.setDate(futureDate.getDate() + i)

      predictions.push({
        date: futureDate.toISOString().split('T')[0],
        value: Math.max(0, forecast),
        confidenceInterval: confidenceRange
      })
    }

    return predictions
  }

  // Helper methods

  private preprocessTimeSeries(data: TimeSeriesData[]): TimeSeriesData[] {
    // Sort by date
    return data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  private ensembleForecasts(
    forecasts: Array<Array<{ date: string; value: number; confidenceInterval: [number, number] }>>
  ): Array<{ date: string; value: number; confidenceInterval: [number, number]; probability: number }> {
    if (forecasts.length === 0) return []

    const ensemble = forecasts[0].map((point, index) => {
      const values = forecasts.map(f => f[index]?.value || 0).filter(v => v > 0)
      const confidenceIntervals = forecasts.map(f => f[index]?.confidenceInterval).filter(Boolean)

      // Weighted average (simple average for now, could be enhanced with model performance weights)
      const ensembleValue = values.reduce((sum, val) => sum + val, 0) / values.length

      // Average confidence intervals
      const avgConfidenceInterval: [number, number] = [
        confidenceIntervals.reduce((sum, ci) => sum + ci[0], 0) / confidenceIntervals.length,
        confidenceIntervals.reduce((sum, ci) => sum + ci[1], 0) / confidenceIntervals.length
      ]

      // Calculate probability based on consensus
      const variance = values.reduce((sum, val) => sum + Math.pow(val - ensembleValue, 2), 0) / values.length
      const probability = Math.max(0.1, 1 - (variance / (ensembleValue * ensembleValue)))

      return {
        ...point,
        value: ensembleValue,
        confidenceInterval: avgConfidenceInterval,
        probability
      }
    })

    return ensemble
  }

  private calculateConfidenceInterval(
    data: TimeSeriesData[],
    prediction: number,
    confidenceLevel: number
  ): [number, number] {
    // Calculate standard deviation of historical data
    const values = data.map(d => d.value)
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    const stdDev = Math.sqrt(variance)

    // Calculate z-score for confidence level
    const zScore = confidenceLevel === 0.9 ? 1.645 : confidenceLevel === 0.95 ? 1.96 : 2.576

    const margin = zScore * stdDev

    return [
      Math.max(0, prediction - margin),
      prediction + margin
    ]
  }

  private calculateModelAccuracy(
    historicalData: TimeSeriesData[],
    forecast: Array<{ value: number }>
  ): { mae: number; rmse: number; mape: number; r2: number } {
    // Use last 20% of data for validation
    const validationSize = Math.floor(historicalData.length * 0.2)
    const actuals = historicalData.slice(-validationSize).map(d => d.value)
    const predictions = forecast.slice(0, validationSize).map(f => f.value)

    if (actuals.length === 0 || predictions.length === 0) {
      return { mae: 0, rmse: 0, mape: 0, r2: 1 }
    }

    // Mean Absolute Error
    const mae = actuals.reduce((sum, actual, i) => sum + Math.abs(actual - predictions[i]), 0) / actuals.length

    // Root Mean Square Error
    const mse = actuals.reduce((sum, actual, i) => sum + Math.pow(actual - predictions[i], 2), 0) / actuals.length
    const rmse = Math.sqrt(mse)

    // Mean Absolute Percentage Error
    const mape = actuals.reduce((sum, actual, i) => {
      if (actual === 0) return sum
      return sum + Math.abs((actual - predictions[i]) / actual)
    }, 0) / actuals.length * 100

    // R-squared
    const actualMean = actuals.reduce((sum, val) => sum + val, 0) / actuals.length
    const totalSumSquares = actuals.reduce((sum, actual) => sum + Math.pow(actual - actualMean, 2), 0)
    const residualSumSquares = actuals.reduce((sum, actual, i) => sum + Math.pow(actual - predictions[i], 2), 0)
    const r2 = 1 - (residualSumSquares / totalSumSquares)

    return { mae, rmse, mape, r2: Math.max(0, r2) }
  }

  private analyzeSeasonality(data: TimeSeriesData[]): {
    weekly: number[]
    monthly: number[]
    yearly: number[]
  } {
    // Extract seasonal patterns
    const weeklyPattern = new Array(7).fill(0)
    const monthlyPattern = new Array(12).fill(0)
    const yearlyPattern = new Array(52).fill(0) // Weekly pattern for year

    const weeklyCounts = new Array(7).fill(0)
    const monthlyCounts = new Array(12).fill(0)
    const yearlyCounts = new Array(52).fill(0)

    data.forEach(point => {
      const date = new Date(point.date)
      const dayOfWeek = date.getDay()
      const month = date.getMonth()
      const weekOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))

      weeklyPattern[dayOfWeek] += point.value
      weeklyCounts[dayOfWeek]++

      monthlyPattern[month] += point.value
      monthlyCounts[month]++

      if (weekOfYear < 52) {
        yearlyPattern[weekOfYear] += point.value
        yearlyCounts[weekOfYear]++
      }
    })

    // Normalize patterns
    const normalizePattern = (pattern: number[], counts: number[]) =>
      pattern.map((sum, i) => counts[i] > 0 ? sum / counts[i] : 0)

    return {
      weekly: normalizePattern(weeklyPattern, weeklyCounts),
      monthly: normalizePattern(monthlyPattern, monthlyCounts),
      yearly: normalizePattern(yearlyPattern, yearlyCounts)
    }
  }

  private analyzeTrends(data: TimeSeriesData[]): {
    direction: 'up' | 'down' | 'stable'
    strength: number
    changePoints: Array<{ date: string; changeRate: number }>
  } {
    if (data.length < 2) {
      return { direction: 'stable', strength: 0, changePoints: [] }
    }

    // Calculate trend using linear regression
    const x = data.map((_, i) => i)
    const y = data.map(d => d.value)

    const n = data.length
    const sumX = x.reduce((a, b) => a + b, 0)
    const sumY = y.reduce((a, b) => a + b, 0)
    const sumXY = x.reduce((total, xi, i) => total + xi * y[i], 0)
    const sumXX = x.reduce((total, xi) => total + xi * xi, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const avgY = sumY / n

    // Determine direction and strength
    const direction = slope > 0.1 ? 'up' : slope < -0.1 ? 'down' : 'stable'
    const strength = Math.min(Math.abs(slope) / avgY, 1)

    // Detect change points (simplified)
    const changePoints = this.detectChangePoints(data)

    return { direction, strength, changePoints }
  }

  private detectChangePoints(data: TimeSeriesData[]): Array<{ date: string; changeRate: number }> {
    const changePoints: Array<{ date: string; changeRate: number }> = []
    const windowSize = Math.min(7, Math.floor(data.length / 10))

    for (let i = windowSize; i < data.length - windowSize; i++) {
      const beforeWindow = data.slice(i - windowSize, i).map(d => d.value)
      const afterWindow = data.slice(i, i + windowSize).map(d => d.value)

      const beforeAvg = beforeWindow.reduce((sum, val) => sum + val, 0) / beforeWindow.length
      const afterAvg = afterWindow.reduce((sum, val) => sum + val, 0) / afterWindow.length

      const changeRate = beforeAvg > 0 ? (afterAvg - beforeAvg) / beforeAvg : 0

      // Detect significant changes (> 20% change)
      if (Math.abs(changeRate) > 0.2) {
        changePoints.push({
          date: data[i].date,
          changeRate
        })
      }
    }

    return changePoints
  }

  private getSeasonalFactor(data: TimeSeriesData, dayIndex: number): number {
    const dayOfWeek = (new Date(data[data.length - 1].date).getDay() + dayIndex) % 7
    const sameDayValues = data.filter(d => new Date(d.date).getDay() === dayOfWeek).map(d => d.value)

    if (sameDayValues.length === 0) return 1

    const avgForDay = sameDayValues.reduce((sum, val) => sum + val, 0) / sameDayValues.length
    const overallAvg = data.reduce((sum, d) => sum + d.value, 0) / data.length

    return overallAvg > 0 ? avgForDay / overallAvg : 1
  }

  private calculateTrend(data: TimeSeriesData[], seasonalPeriod: number): number[] {
    const trend: number[] = []
    const halfWindow = Math.floor(seasonalPeriod / 2)

    for (let i = 0; i < data.length; i++) {
      const startIdx = Math.max(0, i - halfWindow)
      const endIdx = Math.min(data.length - 1, i + halfWindow)

      const windowValues = data.slice(startIdx, endIdx + 1).map(d => d.value)
      const avg = windowValues.reduce((sum, val) => sum + val, 0) / windowValues.length

      trend.push(avg)
    }

    return trend
  }

  private calculateSeasonalFactors(data: TimeSeriesData[], seasonalPeriod: number): number[] {
    const factors = new Array(seasonalPeriod).fill(0)
    const counts = new Array(seasonalPeriod).fill(0)

    data.forEach((point, index) => {
      const seasonIndex = index % seasonalPeriod
      factors[seasonIndex] += point.value
      counts[seasonIndex]++
    })

    // Normalize and return factors
    return factors.map((sum, i) => {
      const count = counts[i]
      if (count === 0) return 1

      const avg = sum / count
      const overallAvg = data.reduce((sum, d) => sum + d.value, 0) / data.length

      return overallAvg > 0 ? avg / overallAvg : 1
    })
  }

  private generateRecommendations(
    forecast: Array<{ value: number; probability: number }>,
    seasonality: { weekly: number[]; monthly: number[]; yearly: number[] },
    trends: { direction: 'up' | 'down' | 'stable'; strength: number }
  ): Array<{ type: 'opportunity' | 'warning' | 'optimization'; message: string; confidence: number; potentialImpact: number }> {
    const recommendations = []

    // Trend-based recommendations
    if (trends.direction === 'up' && trends.strength > 0.3) {
      recommendations.push({
        type: 'opportunity',
        message: 'Strong upward trend detected. Consider increasing marketing spend and expanding capacity.',
        confidence: trends.strength,
        potentialImpact: 0.15
      })
    } else if (trends.direction === 'down' && trends.strength > 0.2) {
      recommendations.push({
        type: 'warning',
        message: 'Declining trend detected. Review pricing strategy and consider promotional campaigns.',
        confidence: trends.strength,
        potentialImpact: -0.1
      })
    }

    // Seasonal recommendations
    const peakDays = seasonality.weekday
      .map((val, i) => ({ day: i, value: val }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 2)

    if (peakDays.length > 0) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      recommendations.push({
        type: 'optimization',
        message: `Peak demand typically on ${dayNames[peakDays[0].day]}s and ${dayNames[peakDays[1]?.day || 0]}s. Optimize staffing and pricing accordingly.`,
        confidence: 0.7,
        potentialImpact: 0.08
      })
    }

    // Forecast confidence recommendations
    const avgProbability = forecast.reduce((sum, f) => sum + f.probability, 0) / forecast.length
    if (avgProbability < 0.5) {
      recommendations.push({
        type: 'warning',
        message: 'Low forecast confidence detected. Collect more historical data to improve accuracy.',
        confidence: 0.8,
        potentialImpact: 0.05
      })
    }

    return recommendations
  }

  private generateDemandRecommendations(
    forecast: Array<{ value: number; probability: number }>,
    seasonality: { weekly: number[]; monthly: number[]; yearly: number[] },
    trends: { direction: 'up' | 'down' | 'stable'; strength: number },
    serviceId?: string
  ): Array<{ type: 'opportunity' | 'warning' | 'optimization'; message: string; confidence: number; potentialImpact: number }> {
    // Similar to revenue recommendations but focused on demand
    const recommendations = []

    const avgForecast = forecast.reduce((sum, f) => sum + f.value, 0) / forecast.length

    if (avgForecast > 100) { // Assuming high demand threshold
      recommendations.push({
        type: 'opportunity',
        message: 'High demand expected. Consider increasing service capacity and availability.',
        confidence: 0.75,
        potentialImpact: 0.12
      })
    } else if (avgForecast < 20) { // Low demand threshold
      recommendations.push({
        type: 'warning',
        message: 'Low demand expected. Consider targeted marketing campaigns or special promotions.',
        confidence: 0.7,
        potentialImpact: -0.08
      })
    }

    return recommendations
  }

  // Database interaction methods

  private async getHistoricalRevenueData(): Promise<TimeSeriesData[]> {
    try {
      const { data, error } = await supabase
        .from('revenue_analytics')
        .select('date, total_revenue')
        .order('date', { ascending: true })
        .gte('date', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])

      if (error) throw error

      return (data || []).map(row => ({
        date: row.date,
        value: row.total_revenue
      }))
    } catch (error) {
      console.error('Error fetching historical revenue data:', error)
      throw error
    }
  }

  private async getHistoricalDemandData(serviceId?: string): Promise<TimeSeriesData[]> {
    try {
      let query = supabase
        .from('bookings')
        .select('booking_date, total_amount')
        .in('status', ['confirmed', 'completed'])
        .order('booking_date', { ascending: true })
        .gte('booking_date', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])

      if (serviceId) {
        query = query.eq('service_id', serviceId)
      }

      const { data, error } = await query

      if (error) throw error

      // Group by date and count bookings
      const groupedData = (data || []).reduce((acc, booking) => {
        const date = booking.booking_date
        if (!acc[date]) {
          acc[date] = { date, value: 0 }
        }
        acc[date].value += 1 // Count bookings as demand
        return acc
      }, {} as Record<string, TimeSeriesData>)

      return Object.values(groupedData)
    } catch (error) {
      console.error('Error fetching historical demand data:', error)
      throw error
    }
  }

  private async getHistoricalPricingData(serviceId: string): Promise<TimeSeriesData[]> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('booking_date, total_amount')
        .eq('service_id', serviceId)
        .in('status', ['confirmed', 'completed'])
        .order('booking_date', { ascending: true })
        .gte('booking_date', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])

      if (error) throw error

      // Group by date and calculate average price
      const groupedData = (data || []).reduce((acc, booking) => {
        const date = booking.booking_date
        if (!acc[date]) {
          acc[date] = { date, value: 0, count: 0 }
        }
        acc[date].value += booking.total_amount
        acc[date].count += 1
        return acc
      }, {} as Record<string, TimeSeriesData & { count: number }>)

      return Object.values(groupedData).map(item => ({
        date: item.date,
        value: item.value / item.count // Average price
      }))
    } catch (error) {
      console.error('Error fetching historical pricing data:', error)
      throw error
    }
  }

  private async getCustomerHistoricalData(userId: string) {
    try {
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['confirmed', 'completed'])
        .order('booking_date', { ascending: false })

      if (bookingsError) throw bookingsError

      const { data: events, error: eventsError } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(100)

      if (eventsError) throw eventsError

      return {
        bookings: bookings || [],
        events: events || []
      }
    } catch (error) {
      console.error('Error fetching customer historical data:', error)
      throw error
    }
  }

  private calculateChurnRiskFactors(customerData: { bookings: any[]; events: any[] }): Array<{
    factor: string
    impact: number
    description: string
  }> {
    const riskFactors = []
    const bookings = customerData.bookings

    if (bookings.length === 0) return riskFactors

    const lastBooking = new Date(bookings[0].booking_date)
    const daysSinceLastBooking = (Date.now() - lastBooking.getTime()) / (1000 * 60 * 60 * 24)

    // Recency risk factor
    if (daysSinceLastBooking > 90) {
      riskFactors.push({
        factor: 'booking_recency',
        impact: 0.3,
        description: 'No bookings in over 90 days'
      })
    } else if (daysSinceLastBooking > 60) {
      riskFactors.push({
        factor: 'booking_recency',
        impact: 0.2,
        description: 'No bookings in over 60 days'
      })
    }

    // Booking frequency risk factor
    const bookingSpan = (new Date(bookings[bookings.length - 1].booking_date).getTime() - lastBooking.getTime()) / (1000 * 60 * 60 * 24 * 30)
    const bookingFrequency = bookings.length / Math.max(bookingSpan, 1)

    if (bookingFrequency < 0.5) {
      riskFactors.push({
        factor: 'booking_frequency',
        impact: 0.25,
        description: 'Low booking frequency'
      })
    }

    // Engagement risk factor
    const recentEvents = customerData.events.filter(e =>
      new Date(e.timestamp) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    )

    if (recentEvents.length < 5) {
      riskFactors.push({
        factor: 'engagement_level',
        impact: 0.2,
        description: 'Low recent engagement'
      })
    }

    return riskFactors
  }

  private calculateChurnProbability(riskFactors: Array<{ factor: string; impact: number }>): number {
    // Logistic regression simplified
    const riskScore = riskFactors.reduce((sum, factor) => sum + factor.impact, 0)

    // Apply sigmoid function
    return 1 / (1 + Math.exp(-3 * (riskScore - 0.5)))
  }

  private generateChurnPreventionRecommendations(
    churnProbability: number,
    riskFactors: Array<{ factor: string; impact: number }>,
    customerData: { bookings: any[]; events: any[] }
  ): Array<{
    action: string
    priority: 'high' | 'medium' | 'low'
    estimatedImpact: number
  }> {
    const recommendations = []

    if (churnProbability > 0.7) {
      recommendations.push({
        action: 'Immediate personalized outreach with special offer',
        priority: 'high',
        estimatedImpact: 0.3
      })
    }

    const recencyFactor = riskFactors.find(f => f.factor === 'booking_recency')
    if (recencyFactor && recencyFactor.impact > 0.2) {
      recommendations.push({
        action: 'Send re-engagement campaign with personalized recommendations',
        priority: 'high',
        estimatedImpact: 0.2
      })
    }

    const frequencyFactor = riskFactors.find(f => f.factor === 'booking_frequency')
    if (frequencyFactor && frequencyFactor.impact > 0.2) {
      recommendations.push({
        action: 'Offer loyalty program or package deals',
        priority: 'medium',
        estimatedImpact: 0.15
      })
    }

    return recommendations
  }

  private calculatePriceElasticity(
    demandData: TimeSeriesData[],
    pricingData: TimeSeriesData[]
  ): number {
    // Simplified price elasticity calculation
    // Elasticity = % change in quantity demanded / % change in price

    if (demandData.length < 2 || pricingData.length < 2) return -1 // Default elasticity

    const demandChange = (demandData[demandData.length - 1].value - demandData[0].value) / demandData[0].value
    const priceChange = (pricingData[pricingData.length - 1].value - pricingData[0].value) / pricingData[0].value

    return priceChange !== 0 ? demandChange / priceChange : -1
  }

  private generatePricingScenarios(
    demandForecast: { predictions: Array<{ value: number }> },
    priceElasticity: number,
    minPrice?: number,
    maxPrice?: number,
    competitorPrices?: number[]
  ): Array<{
    price: number
    expectedDemand: number
    expectedRevenue: number
    confidence: number
    strategy: 'penetration' | 'premium' | 'value' | 'dynamic'
  }> {
    const scenarios = []
    const avgDemand = demandForecast.predictions.reduce((sum, p) => sum + p.value, 0) / demandForecast.predictions.length

    // Generate different price points
    const basePrice = 100 // Could be current price
    const pricePoints = [
      basePrice * 0.8,  // Penetration pricing
      basePrice,        // Current pricing
      basePrice * 1.2,  // Premium pricing
      basePrice * 1.1   // Value pricing
    ]

    pricePoints.forEach((price, index) => {
      // Calculate expected demand based on price elasticity
      const priceChange = (price - basePrice) / basePrice
      const demandChange = priceChange * priceElasticity
      const expectedDemand = Math.max(0, avgDemand * (1 + demandChange))
      const expectedRevenue = price * expectedDemand

      const strategies: Array<'penetration' | 'premium' | 'value' | 'dynamic'> = ['penetration', 'value', 'premium', 'dynamic']

      scenarios.push({
        price,
        expectedDemand,
        expectedRevenue,
        confidence: 0.7, // Simplified confidence
        strategy: strategies[index]
      })
    })

    return scenarios
  }

  private selectOptimalPricing(scenarios: Array<{
    price: number
    expectedDemand: number
    expectedRevenue: number
    confidence: number
    strategy: string
  }>): {
    recommendedPrice: number
    expectedDemand: number
    expectedRevenue: number
    priceElasticity: number
    confidence: number
    strategy: 'penetration' | 'premium' | 'value' | 'dynamic'
  } {
    // Select scenario with highest expected revenue * confidence
    const optimal = scenarios.reduce((best, current) => {
      const bestScore = best.expectedRevenue * best.confidence
      const currentScore = current.expectedRevenue * current.confidence
      return currentScore > bestScore ? current : best
    })

    return {
      recommendedPrice: optimal.price,
      expectedDemand: optimal.expectedDemand,
      expectedRevenue: optimal.expectedRevenue,
      priceElasticity: -1, // Would be calculated properly
      confidence: optimal.confidence,
      strategy: optimal.strategy as any
    }
  }

  private async saveForecastResults(
    modelType: string,
    forecast: Array<{ date: string; value: number; confidenceInterval: [number, number] }>,
    accuracy: { mae: number; rmse: number; mape: number; r2: number },
    options: ForecastingOptions,
    serviceId?: string
  ): Promise<void> {
    try {
      // Save model definition
      const { data: model, error: modelError } = await supabase
        .from('forecast_models')
        .upsert({
          model_name: `${modelType}_${serviceId || 'general'}_${Date.now()}`,
          model_type: modelType,
          target_variable: 'revenue',
          input_features: {},
          model_parameters: { options },
          accuracy_metrics: accuracy,
          prediction_horizon_days: options.horizon,
          is_active: true
        }, {
          onConflict: 'model_name'
        })
        .select()
        .single()

      if (modelError) throw modelError

      // Save forecast results
      const forecastResults = forecast.map(prediction => ({
        model_id: model.id,
        prediction_date: new Date().toISOString().split('T')[0],
        target_date: prediction.date,
        predicted_value: prediction.value,
        confidence_interval_lower: prediction.confidenceInterval[0],
        confidence_interval_upper: prediction.confidenceInterval[1]
      }))

      const { error: resultsError } = await supabase
        .from('forecast_results')
        .insert(forecastResults)

      if (resultsError) throw resultsError
    } catch (error) {
      console.error('Error saving forecast results:', error)
    }
  }

  private async saveChurnPrediction(
    userId: string,
    churnProbability: number,
    riskFactors: Array<{ factor: string; impact: number }>
  ): Promise<void> {
    try {
      // This would save to a customer_predictions table
      console.log(`Saving churn prediction for user ${userId}:`, {
        churnProbability,
        riskFactors
      })
    } catch (error) {
      console.error('Error saving churn prediction:', error)
    }
  }

  private async savePricingOptimization(
    serviceId: string,
    optimalScenario: any
  ): Promise<void> {
    try {
      // This would save to a pricing_optimizations table
      console.log(`Saving pricing optimization for service ${serviceId}:`, optimalScenario)
    } catch (error) {
      console.error('Error saving pricing optimization:', error)
    }
  }
}

// Export singleton instance
export const forecastingEngine = ForecastingEngine.getInstance()

// Export types
export type {
  ForecastingOptions,
  ForecastResultExtended,
  TimeSeriesData
}