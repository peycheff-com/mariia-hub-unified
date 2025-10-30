/**
 * KPI Monitoring and Alerting System
 * Real-time monitoring of key performance indicators with automated alerting
 */

import { supabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'

type PerformanceKPI = Database['public']['Tables']['performance_kpis']['Row']
type AnalyticsAlert = Database['public']['Tables']['analytics_alerts']['Row']
type AnalyticsAlertHistory = Database['public']['Tables']['analytics_alert_history']['Row']

interface KPIDefinition {
  name: string
  category: 'operational' | 'financial' | 'customer' | 'growth'
  description: string
  measurementUnit: 'percentage' | 'currency' | 'count' | 'rating' | 'time'
  targetValue: number
  thresholds: {
    critical: number
    warning: number
    good: number
  }
  frequency: 'real_time' | 'hourly' | 'daily' | 'weekly' | 'monthly'
  calculationMethod: string // SQL or function reference
  isActive: boolean
}

interface AlertRule {
  name: string
  type: 'kpi_threshold' | 'anomaly' | 'trend' | 'composite'
  severity: 'low' | 'medium' | 'high' | 'critical'
  conditions: {
    kpiName?: string
    operator: 'gt' | 'lt' | 'eq' | 'change' | 'anomaly'
    threshold?: number
    changePercentage?: number
    timeWindow?: number
  }
  notificationChannels: string[]
  cooldownMinutes: number
  isActive: boolean
}

interface KPIValue {
  name: string
  value: number
  previousValue?: number
  changePercentage?: number
  timestamp: Date
  status: 'critical' | 'warning' | 'normal' | 'good' | 'excellent'
  trend: 'up' | 'down' | 'stable'
}

interface MonitoringConfig {
  checkInterval: number // milliseconds
  enableAnomalyDetection: boolean
  enableTrendAnalysis: boolean
  notificationRetries: number
  batchAlerts: boolean
  debugMode: boolean
}

class KPIMonitoringEngine {
  private static instance: KPIMonitoringEngine
  private config: MonitoringConfig
  private monitoringTimer: NodeJS.Timeout | null = null
  private isRunning = false
  private alertCooldowns = new Map<string, Date>()

  private constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = {
      checkInterval: 60000, // 1 minute
      enableAnomalyDetection: true,
      enableTrendAnalysis: true,
      notificationRetries: 3,
      batchAlerts: true,
      debugMode: process.env.NODE_ENV === 'development',
      ...config
    }
  }

  public static getInstance(config?: Partial<MonitoringConfig>): KPIMonitoringEngine {
    if (!KPIMonitoringEngine.instance) {
      KPIMonitoringEngine.instance = new KPIMonitoringEngine(config)
    }
    return KPIMonitoringEngine.instance
  }

  /**
   * Initialize predefined KPIs
   */
  public async initializeKPIs(): Promise<void> {
    const kpiDefinitions: KPIDefinition[] = [
      // Financial KPIs
      {
        name: 'daily_revenue',
        category: 'financial',
        description: 'Total revenue generated per day',
        measurementUnit: 'currency',
        targetValue: 5000,
        thresholds: { critical: 1000, warning: 2500, good: 4500 },
        frequency: 'daily',
        calculationMethod: 'SELECT COALESCE(SUM(total_revenue), 0) as value FROM revenue_analytics WHERE date = CURRENT_DATE',
        isActive: true
      },
      {
        name: 'monthly_revenue',
        category: 'financial',
        description: 'Total revenue generated per month',
        measurementUnit: 'currency',
        targetValue: 100000,
        thresholds: { critical: 50000, warning: 75000, good: 90000 },
        frequency: 'monthly',
        calculationMethod: 'SELECT COALESCE(SUM(total_revenue), 0) as value FROM revenue_analytics WHERE date >= date_trunc(\'month\', CURRENT_DATE)',
        isActive: true
      },
      {
        name: 'average_booking_value',
        category: 'financial',
        description: 'Average value per booking',
        measurementUnit: 'currency',
        targetValue: 350,
        thresholds: { critical: 150, warning: 250, good: 320 },
        frequency: 'daily',
        calculationMethod: 'SELECT COALESCE(AVG(total_amount), 0) as value FROM bookings WHERE status = \'completed\' AND created_at >= CURRENT_DATE',
        isActive: true
      },

      // Customer KPIs
      {
        name: 'booking_conversion_rate',
        category: 'customer',
        description: 'Percentage of booking views that convert to completed bookings',
        measurementUnit: 'percentage',
        targetValue: 25,
        thresholds: { critical: 10, warning: 15, good: 22 },
        frequency: 'daily',
        calculationMethod: 'SELECT CASE WHEN views.count > 0 THEN (completed.count::float / views.count) * 100 ELSE 0 END as value FROM (SELECT COUNT(*) as count FROM analytics_events WHERE event_type = \'booking_viewed\' AND timestamp >= CURRENT_DATE) views CROSS JOIN (SELECT COUNT(*) as count FROM bookings WHERE status = \'completed\' AND created_at >= CURRENT_DATE) completed',
        isActive: true
      },
      {
        name: 'customer_retention_rate',
        category: 'customer',
        description: 'Percentage of customers who return for additional bookings',
        measurementUnit: 'percentage',
        targetValue: 60,
        thresholds: { critical: 30, warning: 45, good: 55 },
        frequency: 'monthly',
        calculationMethod: 'SELECT retention_rate FROM calculate_customer_retention_rate()',
        isActive: true
      },
      {
        name: 'customer_satisfaction_score',
        category: 'customer',
        description: 'Average customer rating from reviews',
        measurementUnit: 'rating',
        targetValue: 4.5,
        thresholds: { critical: 3.0, warning: 3.5, good: 4.2 },
        frequency: 'weekly',
        calculationMethod: 'SELECT COALESCE(AVG(rating), 0) as value FROM reviews WHERE created_at >= CURRENT_DATE - INTERVAL \'7 days\'',
        isActive: true
      },

      // Operational KPIs
      {
        name: 'booking_completion_rate',
        category: 'operational',
        description: 'Percentage of bookings that are completed (not cancelled)',
        measurementUnit: 'percentage',
        targetValue: 90,
        thresholds: { critical: 70, warning: 80, good: 87 },
        frequency: 'daily',
        calculationMethod: 'SELECT CASE WHEN total.count > 0 THEN (completed.count::float / total.count) * 100 ELSE 0 END as value FROM (SELECT COUNT(*) as count FROM bookings WHERE created_at >= CURRENT_DATE) total CROSS JOIN (SELECT COUNT(*) as count FROM bookings WHERE status = \'completed\' AND created_at >= CURRENT_DATE) completed',
        isActive: true
      },
      {
        name: 'average_response_time',
        category: 'operational',
        description: 'Average time to respond to customer inquiries',
        measurementUnit: 'time',
        targetValue: 60, // minutes
        thresholds: { critical: 180, warning: 120, good: 90 },
        frequency: 'hourly',
        calculationMethod: 'SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (response_time - created_at))/60), 0) as value FROM customer_inquiries WHERE created_at >= CURRENT_DATE - INTERVAL \'1 hour\'',
        isActive: true
      },
      {
        name: 'service_utilization_rate',
        category: 'operational',
        description: 'Percentage of available time slots that are booked',
        measurementUnit: 'percentage',
        targetValue: 75,
        thresholds: { critical: 40, warning: 55, good: 70 },
        frequency: 'daily',
        calculationMethod: 'SELECT utilization_rate FROM calculate_service_utilization_rate(CURRENT_DATE)',
        isActive: true
      },

      // Growth KPIs
      {
        name: 'new_customer_acquisition',
        category: 'growth',
        description: 'Number of new customers acquired',
        measurementUnit: 'count',
        targetValue: 50,
        thresholds: { critical: 20, warning: 35, good: 45 },
        frequency: 'daily',
        calculationMethod: 'SELECT COUNT(DISTINCT user_id) as value FROM bookings WHERE user_id NOT IN (SELECT DISTINCT user_id FROM bookings WHERE created_at < CURRENT_DATE) AND created_at >= CURRENT_DATE',
        isActive: true
      },
      {
        name: 'revenue_growth_rate',
        category: 'growth',
        description: 'Month-over-month revenue growth rate',
        measurementUnit: 'percentage',
        targetValue: 15,
        thresholds: { critical: -5, warning: 5, good: 12 },
        frequency: 'monthly',
        calculationMethod: 'SELECT growth_rate FROM calculate_monthly_revenue_growth()',
        isActive: true
      },
      {
        name: 'website_conversion_rate',
        category: 'growth',
        description: 'Percentage of website visitors who make a booking',
        measurementUnit: 'percentage',
        targetValue: 3,
        thresholds: { critical: 1, warning: 1.5, good: 2.5 },
        frequency: 'daily',
        calculationMethod: 'SELECT conversion_rate FROM calculate_website_conversion_rate(CURRENT_DATE)',
        isActive: true
      }
    ]

    for (const kpi of kpiDefinitions) {
      try {
        const { error } = await supabase
          .from('performance_kpis')
          .upsert({
            kpi_name: kpi.name,
            kpi_category: kpi.category,
            description: kpi.description,
            target_value: kpi.targetValue,
            current_value: 0,
            measurement_unit: kpi.measurementUnit,
            frequency: kpi.frequency,
            status: 'normal',
            threshold_critical: kpi.thresholds.critical,
            threshold_warning: kpi.thresholds.warning,
            threshold_good: kpi.thresholds.good,
            trend_direction: 'stable',
            last_updated: new Date().toISOString(),
            metadata: {
              calculationMethod: kpi.calculationMethod
            }
          }, {
            onConflict: 'kpi_name'
          })

        if (error) {
          console.error(`Error initializing KPI ${kpi.name}:`, error)
        }
      } catch (error) {
        console.error(`Error initializing KPI ${kpi.name}:`, error)
      }
    }
  }

  /**
   * Initialize predefined alert rules
   */
  public async initializeAlertRules(): Promise<void> {
    const alertRules: AlertRule[] = [
      {
        name: 'Critical Revenue Drop',
        type: 'kpi_threshold',
        severity: 'critical',
        conditions: {
          kpiName: 'daily_revenue',
          operator: 'lt',
          threshold: 1000
        },
        notificationChannels: ['email', 'sms'],
        cooldownMinutes: 15,
        isActive: true
      },
      {
        name: 'Low Conversion Rate',
        type: 'kpi_threshold',
        severity: 'high',
        conditions: {
          kpiName: 'booking_conversion_rate',
          operator: 'lt',
          threshold: 10
        },
        notificationChannels: ['email'],
        cooldownMinutes: 60,
        isActive: true
      },
      {
        name: 'High Cancellation Rate',
        type: 'trend',
        severity: 'medium',
        conditions: {
          kpiName: 'booking_completion_rate',
          operator: 'change',
          changePercentage: -20,
          timeWindow: 24 // hours
        },
        notificationChannels: ['email'],
        cooldownMinutes: 120,
        isActive: true
      },
      {
        name: 'Customer Satisfaction Drop',
        type: 'kpi_threshold',
        severity: 'high',
        conditions: {
          kpiName: 'customer_satisfaction_score',
          operator: 'lt',
          threshold: 3.5
        },
        notificationChannels: ['email'],
        cooldownMinutes: 180,
        isActive: true
      },
      {
        name: 'Anomalous Booking Pattern',
        type: 'anomaly',
        severity: 'medium',
        conditions: {
          kpiName: 'new_customer_acquisition',
          operator: 'anomaly',
          timeWindow: 24
        },
        notificationChannels: ['email'],
        cooldownMinutes: 240,
        isActive: true
      }
    ]

    for (const rule of alertRules) {
      try {
        const { error } = await supabase
          .from('analytics_alerts')
          .upsert({
            alert_name: rule.name,
            alert_type: rule.type,
            severity: rule.severity,
            description: `Alert for ${rule.name}`,
            conditions: rule.conditions,
            is_active: rule.isActive,
            notification_channels: rule.notificationChannels,
            cooldown_minutes: rule.cooldownMinutes,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'alert_name'
          })

        if (error) {
          console.error(`Error initializing alert rule ${rule.name}:`, error)
        }
      } catch (error) {
        console.error(`Error initializing alert rule ${rule.name}:`, error)
      }
    }
  }

  /**
   * Start KPI monitoring
   */
  public startMonitoring(): void {
    if (this.isRunning) {
      console.log('KPI monitoring is already running')
      return
    }

    console.log('Starting KPI monitoring...')
    this.isRunning = true

    // Run initial check
    this.checkAllKPIs()

    // Set up recurring checks
    this.monitoringTimer = setInterval(() => {
      this.checkAllKPIs()
    }, this.config.checkInterval)
  }

  /**
   * Stop KPI monitoring
   */
  public stopMonitoring(): void {
    if (!this.isRunning) {
      console.log('KPI monitoring is not running')
      return
    }

    console.log('Stopping KPI monitoring...')
    this.isRunning = false

    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer)
      this.monitoringTimer = null
    }
  }

  /**
   * Check all active KPIs
   */
  private async checkAllKPIs(): Promise<void> {
    try {
      // Get all active KPIs
      const { data: kpis, error: kpisError } = await supabase
        .from('performance_kpis')
        .select('*')
        .eq('is_active', true)

      if (kpisError) throw kpisError

      if (!kpis || kpis.length === 0) {
        return
      }

      // Check each KPI based on its frequency
      const now = new Date()
      const promises = kpis.map(kpi => {
        if (this.shouldCheckKPI(kpi, now)) {
          return this.checkKPI(kpi)
        }
        return Promise.resolve()
      })

      await Promise.all(promises)

    } catch (error) {
      console.error('Error checking KPIs:', error)
    }
  }

  /**
   * Check if a KPI should be checked based on its frequency
   */
  private shouldCheckKPI(kpi: PerformanceKPI, now: Date): boolean {
    if (!kpi.last_updated) return true

    const lastUpdated = new Date(kpi.last_updated)
    const diffMs = now.getTime() - lastUpdated.getTime()

    switch (kpi.frequency) {
      case 'real_time':
        return diffMs >= 60000 // 1 minute
      case 'hourly':
        return diffMs >= 3600000 // 1 hour
      case 'daily':
        return diffMs >= 86400000 // 24 hours
      case 'weekly':
        return diffMs >= 604800000 // 7 days
      case 'monthly':
        return diffMs >= 2592000000 // 30 days
      default:
        return false
    }
  }

  /**
   * Check a single KPI
   */
  private async checkKPI(kpi: PerformanceKPI): Promise<void> {
    try {
      const newValue = await this.calculateKPIValue(kpi)
      const previousValue = kpi.current_value

      // Calculate change and trend
      const changePercentage = previousValue > 0
        ? ((newValue - previousValue) / previousValue) * 100
        : 0

      const trend = this.calculateTrend(newValue, previousValue)
      const status = this.calculateKPIStatus(newValue, kpi)

      // Update KPI in database
      const { error: updateError } = await supabase
        .from('performance_kpis')
        .update({
          current_value: newValue,
          previous_value: previousValue,
          change_percentage: changePercentage,
          status: status,
          trend_direction: trend,
          last_updated: new Date().toISOString()
        })
        .eq('id', kpi.id)

      if (updateError) throw updateError

      // Check for alerts
      await this.checkAlerts(kpi, newValue, previousValue)

      if (this.config.debugMode) {
        console.log(`KPI ${kpi.kpi_name}: ${newValue} (${status}, ${trend})`)
      }

    } catch (error) {
      console.error(`Error checking KPI ${kpi.kpi_name}:`, error)
    }
  }

  /**
   * Calculate KPI value using its calculation method
   */
  private async calculateKPIValue(kpi: PerformanceKPI): Promise<number> {
    try {
      // If calculation method is stored in metadata, use it
      if (kpi.metadata?.calculationMethod) {
        const { data, error } = await supabase
          .rpc('execute_sql_query', { query: kpi.metadata.calculationMethod })

        if (error) throw error
        return data?.[0]?.value || 0
      }

      // Fallback to predefined calculations based on KPI name
      switch (kpi.kpi_name) {
        case 'daily_revenue':
          return await this.getDailyRevenue()
        case 'monthly_revenue':
          return await this.getMonthlyRevenue()
        case 'booking_conversion_rate':
          return await this.getBookingConversionRate()
        case 'customer_satisfaction_score':
          return await this.getCustomerSatisfactionScore()
        case 'booking_completion_rate':
          return await this.getBookingCompletionRate()
        case 'new_customer_acquisition':
          return await this.getNewCustomerAcquisition()
        default:
          console.warn(`Unknown calculation method for KPI: ${kpi.kpi_name}`)
          return 0
      }
    } catch (error) {
      console.error(`Error calculating KPI value for ${kpi.kpi_name}:`, error)
      return 0
    }
  }

  // Specific KPI calculation methods
  private async getDailyRevenue(): Promise<number> {
    const { data, error } = await supabase
      .from('revenue_analytics')
      .select('total_revenue')
      .eq('date', new Date().toISOString().split('T')[0])
      .single()

    return data?.total_revenue || 0
  }

  private async getMonthlyRevenue(): Promise<number> {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { data, error } = await supabase
      .from('revenue_analytics')
      .select('total_revenue')
      .gte('date', startOfMonth.toISOString().split('T')[0])

    return data?.reduce((sum, item) => sum + item.total_revenue, 0) || 0
  }

  private async getBookingConversionRate(): Promise<number> {
    const today = new Date().toISOString().split('T')[0]

    const [{ data: views }, { data: completed }] = await Promise.all([
      supabase
        .from('analytics_events')
        .select('*')
        .eq('event_type', 'booking_viewed')
        .gte('timestamp', today),
      supabase
        .from('bookings')
        .select('*')
        .eq('status', 'completed')
        .gte('created_at', today)
    ])

    const viewCount = views?.length || 0
    const completedCount = completed?.length || 0

    return viewCount > 0 ? (completedCount / viewCount) * 100 : 0
  }

  private async getCustomerSatisfactionScore(): Promise<number> {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const { data, error } = await supabase
      .from('reviews')
      .select('rating')
      .gte('created_at', weekAgo.toISOString())

    if (!data || data.length === 0) return 0

    return data.reduce((sum, review) => sum + review.rating, 0) / data.length
  }

  private async getBookingCompletionRate(): Promise<number> {
    const today = new Date().toISOString().split('T')[0]

    const [{ data: total }, { data: completed }] = await Promise.all([
      supabase
        .from('bookings')
        .select('*')
        .gte('created_at', today),
      supabase
        .from('bookings')
        .select('*')
        .eq('status', 'completed')
        .gte('created_at', today)
    ])

    const totalCount = total?.length || 0
    const completedCount = completed?.length || 0

    return totalCount > 0 ? (completedCount / totalCount) * 100 : 0
  }

  private async getNewCustomerAcquisition(): Promise<number> {
    const today = new Date().toISOString().split('T')[0]

    // Get all users who have bookings today
    const { data: todayUsers } = await supabase
      .from('bookings')
      .select('user_id')
      .eq('created_at', today)
      .not('user_id', 'is', null)

    if (!todayUsers || todayUsers.length === 0) return 0

    // Get users who had bookings before today
    const { data: previousUsers } = await supabase
      .from('bookings')
      .select('user_id')
      .lt('created_at', today)
      .not('user_id', 'is', null)

    const previousUserIds = new Set(previousUsers?.map(u => u.user_id) || [])

    // Count new users (today's users not in previous users)
    const newUsers = todayUsers.filter(u => !previousUserIds.has(u.user_id))
    return newUsers.length
  }

  /**
   * Calculate KPI status based on thresholds
   */
  private calculateKPIStatus(value: number, kpi: PerformanceKPI): 'critical' | 'warning' | 'normal' | 'good' | 'excellent' {
    const { threshold_critical, threshold_warning, threshold_good, target_value } = kpi

    // For most KPIs, higher is better
    const isHigherBetter = !kpi.kpi_name.includes('time') &&
                          !kpi.kpi_name.includes('cancellation') &&
                          !kpi.kpi_name.includes('dropout')

    if (isHigherBetter) {
      if (value <= threshold_critical!) return 'critical'
      if (value <= threshold_warning!) return 'warning'
      if (value <= threshold_good!) return 'normal'
      if (value >= target_value) return 'excellent'
      return 'good'
    } else {
      // For time-based or negative metrics, lower is better
      if (value >= threshold_critical!) return 'critical'
      if (value >= threshold_warning!) return 'warning'
      if (value >= threshold_good!) return 'normal'
      if (value <= target_value) return 'excellent'
      return 'good'
    }
  }

  /**
   * Calculate trend direction
   */
  private calculateTrend(newValue: number, previousValue: number): 'up' | 'down' | 'stable' {
    if (previousValue === 0) return 'stable'

    const change = ((newValue - previousValue) / previousValue) * 100

    if (Math.abs(change) < 1) return 'stable'
    return change > 0 ? 'up' : 'down'
  }

  /**
   * Check alerts for a KPI
   */
  private async checkAlerts(kpi: PerformanceKPI, newValue: number, previousValue: number): Promise<void> {
    try {
      // Get active alerts for this KPI
      const { data: alerts, error: alertsError } = await supabase
        .from('analytics_alerts')
        .select('*')
        .eq('is_active', true)

      if (alertsError) throw alertsError

      if (!alerts || alerts.length === 0) return

      for (const alert of alerts) {
        const shouldTrigger = await this.evaluateAlertCondition(alert, kpi, newValue, previousValue)

        if (shouldTrigger) {
          await this.triggerAlert(alert, kpi, newValue, previousValue)
        }
      }
    } catch (error) {
      console.error(`Error checking alerts for KPI ${kpi.kpi_name}:`, error)
    }
  }

  /**
   * Evaluate if an alert condition is met
   */
  private async evaluateAlertCondition(
    alert: AnalyticsAlert,
    kpi: PerformanceKPI,
    newValue: number,
    previousValue: number
  ): Promise<boolean> {
    try {
      const conditions = alert.conditions as any

      // Check cooldown
      const cooldownKey = `${alert.id}_${kpi.id}`
      const lastTriggered = this.alertCooldowns.get(cooldownKey)
      if (lastTriggered) {
        const timeSinceLastTrigger = Date.now() - lastTriggered.getTime()
        if (timeSinceLastTrigger < alert.cooldown_minutes * 60 * 1000) {
          return false
        }
      }

      // Check if alert applies to this KPI
      if (conditions.kpiName && conditions.kpiName !== kpi.kpi_name) {
        return false
      }

      switch (conditions.operator) {
        case 'gt':
          return newValue > conditions.threshold
        case 'lt':
          return newValue < conditions.threshold
        case 'eq':
          return Math.abs(newValue - conditions.threshold) < 0.01
        case 'change':
          const changePercentage = previousValue > 0
            ? ((newValue - previousValue) / previousValue) * 100
            : 0
          return changePercentage < conditions.changePercentage
        case 'anomaly':
          return await this.detectAnomaly(kpi, newValue)
        default:
          return false
      }
    } catch (error) {
      console.error('Error evaluating alert condition:', error)
      return false
    }
  }

  /**
   * Detect anomalies in KPI values
   */
  private async detectAnomaly(kpi: PerformanceKPI, currentValue: number): Promise<boolean> {
    try {
      // Get historical values for the same time period
      const { data: historicalData } = await supabase
        .from('analytics_metrics')
        .select('value')
        .eq('metric_name', kpi.kpi_name)
        .order('period_start', { ascending: false })
        .limit(30)

      if (!historicalData || historicalData.length < 5) {
        return false
      }

      const values = historicalData.map(d => d.value)
      const mean = values.reduce((sum, v) => sum + v, 0) / values.length
      const stdDev = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length)

      // Check if current value is more than 2 standard deviations from mean
      const zScore = Math.abs((currentValue - mean) / stdDev)
      return zScore > 2
    } catch (error) {
      console.error('Error detecting anomaly:', error)
      return false
    }
  }

  /**
   * Trigger an alert
   */
  private async triggerAlert(
    alert: AnalyticsAlert,
    kpi: PerformanceKPI,
    newValue: number,
    previousValue: number
  ): Promise<void> {
    try {
      const changePercentage = previousValue > 0
        ? ((newValue - previousValue) / previousValue) * 100
        : 0

      // Create alert history record
      const { error: historyError } = await supabase
        .from('analytics_alert_history')
        .insert({
          alert_id: alert.id,
          severity: alert.severity,
          message: `${alert.alert_name}: ${kpi.kpi_name} is ${newValue} (${kpi.status})`,
          details: {
            kpiName: kpi.kpi_name,
            currentValue: newValue,
            previousValue: previousValue,
            changePercentage: changePercentage,
            status: kpi.status,
            threshold: alert.conditions?.threshold
          },
          triggered_at: new Date().toISOString(),
          status: 'active'
        })

      if (historyError) throw historyError

      // Update cooldown
      const cooldownKey = `${alert.id}_${kpi.id}`
      this.alertCooldowns.set(cooldownKey, new Date())

      // Send notifications
      await this.sendNotifications(alert, kpi, newValue, previousValue)

      // Update last triggered time
      await supabase
        .from('analytics_alerts')
        .update({
          last_triggered: new Date().toISOString(),
          trigger_count: (alert.trigger_count || 0) + 1
        })
        .eq('id', alert.id)

      if (this.config.debugMode) {
        console.log(`Alert triggered: ${alert.alert_name} for KPI ${kpi.kpi_name}`)
      }

    } catch (error) {
      console.error('Error triggering alert:', error)
    }
  }

  /**
   * Send notifications for an alert
   */
  private async sendNotifications(
    alert: AnalyticsAlert,
    kpi: PerformanceKPI,
    newValue: number,
    previousValue: number
  ): Promise<void> {
    const notificationChannels = alert.notification_channels as string[]

    for (const channel of notificationChannels) {
      try {
        switch (channel) {
          case 'email':
            await this.sendEmailNotification(alert, kpi, newValue, previousValue)
            break
          case 'sms':
            await this.sendSMSNotification(alert, kpi, newValue, previousValue)
            break
          case 'slack':
            await this.sendSlackNotification(alert, kpi, newValue, previousValue)
            break
          case 'webhook':
            await this.sendWebhookNotification(alert, kpi, newValue, previousValue)
            break
          default:
            console.warn(`Unknown notification channel: ${channel}`)
        }
      } catch (error) {
        console.error(`Error sending ${channel} notification:`, error)
      }
    }
  }

  // Notification methods (simplified implementations)
  private async sendEmailNotification(
    alert: AnalyticsAlert,
    kpi: PerformanceKPI,
    newValue: number,
    previousValue: number
  ): Promise<void> {
    // Implementation would depend on your email service
    console.log(`Email notification: ${alert.alert_name} - ${kpi.kpi_name} = ${newValue}`)
  }

  private async sendSMSNotification(
    alert: AnalyticsAlert,
    kpi: PerformanceKPI,
    newValue: number,
    previousValue: number
  ): Promise<void> {
    // Implementation would depend on your SMS service
    console.log(`SMS notification: ${alert.alert_name} - ${kpi.kpi_name} = ${newValue}`)
  }

  private async sendSlackNotification(
    alert: AnalyticsAlert,
    kpi: PerformanceKPI,
    newValue: number,
    previousValue: number
  ): Promise<void> {
    // Implementation would depend on your Slack integration
    console.log(`Slack notification: ${alert.alert_name} - ${kpi.kpi_name} = ${newValue}`)
  }

  private async sendWebhookNotification(
    alert: AnalyticsAlert,
    kpi: PerformanceKPI,
    newValue: number,
    previousValue: number
  ): Promise<void> {
    // Implementation would depend on your webhook configuration
    console.log(`Webhook notification: ${alert.alert_name} - ${kpi.kpi_name} = ${newValue}`)
  }

  /**
   * Get current KPI values
   */
  public async getCurrentKPIs(): Promise<KPIValue[]> {
    try {
      const { data: kpis, error } = await supabase
        .from('performance_kpis')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false })

      if (error) throw error

      return (kpis || []).map(kpi => ({
        name: kpi.kpi_name,
        value: kpi.current_value,
        previousValue: kpi.previous_value || undefined,
        changePercentage: kpi.change_percentage || undefined,
        timestamp: new Date(kpi.last_updated || Date.now()),
        status: kpi.status as any,
        trend: kpi.trend_direction as any
      }))
    } catch (error) {
      console.error('Error getting current KPIs:', error)
      return []
    }
  }

  /**
   * Get recent alerts
   */
  public async getRecentAlerts(hours: number = 24): Promise<AnalyticsAlertHistory[]> {
    try {
      const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000)

      const { data, error } = await supabase
        .from('analytics_alert_history')
        .select('*')
        .gte('triggered_at', cutoff.toISOString())
        .order('triggered_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting recent alerts:', error)
      return []
    }
  }

  /**
   * Update monitoring configuration
   */
  public updateConfig(newConfig: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig }

    // Restart monitoring with new configuration
    if (this.isRunning) {
      this.stopMonitoring()
      this.startMonitoring()
    }
  }

  /**
   * Get monitoring status
   */
  public getMonitoringStatus(): {
    isRunning: boolean
    checkInterval: number
    lastCheck?: Date
    activeKPIs: number
    activeAlerts: number
  } {
    return {
      isRunning: this.isRunning,
      checkInterval: this.config.checkInterval,
      activeKPIs: 0, // Would need to query database
      activeAlerts: 0 // Would need to query database
    }
  }
}

// Export singleton instance
export const kpiMonitoring = KPIMonitoringEngine.getInstance()

// Export types
export type {
  KPIDefinition,
  AlertRule,
  KPIValue,
  MonitoringConfig
}