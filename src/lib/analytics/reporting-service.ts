/**
 * Analytics Reporting Service
 * Comprehensive reporting system with data export and scheduled reports
 */

import { supabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'

type AnalyticsReport = Database['public']['Tables']['analytics_reports']['Row']
type AnalyticsReportExecution = Database['public']['Tables']['analytics_report_executions']['Row']

interface ReportConfig {
  name: string
  description: string
  reportType: 'dashboard' | 'export' | 'scheduled' | 'ad_hoc'
  queryConfig: {
    dataSource: string // 'bookings', 'revenue', 'customers', 'events'
    metrics: string[]
    dimensions?: string[]
    filters?: Record<string, any>
    aggregations?: Record<string, string>
    timeRange?: {
      start: string
      end: string
    }
  }
  visualizationConfig: {
    chartTypes: string[]
    groupBy?: string[]
    sortBy?: string[]
    limit?: number
  }
  exportConfig: {
    format: 'csv' | 'excel' | 'pdf' | 'json'
    template?: string
    includeCharts?: boolean
    emailRecipients?: string[]
  }
  scheduleConfig?: {
    frequency: 'hourly' | 'daily' | 'weekly' | 'monthly'
    timezone: string
    nextRun: string
  }
  accessLevel: 'admin' | 'manager' | 'staff' | 'viewer'
}

interface ReportData {
  headers: string[]
  rows: any[][]
  metadata: {
    totalRows: number
    generatedAt: string
    dataSource: string
    filters: Record<string, any>
  }
  charts?: Array<{
    type: string
    data: any[]
    title: string
  }>
}

interface ExportResult {
  success: boolean
  filePath?: string
  fileSize?: number
  error?: string
  downloadUrl?: string
}

class AnalyticsReportingService {
  private static instance: AnalyticsReportingService
  private scheduledReports = new Map<string, NodeJS.Timeout>()
  private exportCache = new Map<string, { data: any; timestamp: number; ttl: number }>()

  private constructor() {}

  public static getInstance(): AnalyticsReportingService {
    if (!AnalyticsReportingService.instance) {
      AnalyticsReportingService.instance = new AnalyticsReportingService()
    }
    return AnalyticsReportingService.instance
  }

  /**
   * Initialize predefined reports
   */
  public async initializeReports(): Promise<void> {
    const predefinedReports: ReportConfig[] = [
      {
        name: 'Monthly Revenue Report',
        description: 'Comprehensive monthly revenue analysis with trends and forecasts',
        reportType: 'scheduled',
        queryConfig: {
          dataSource: 'revenue',
          metrics: ['total_revenue', 'bookings_count', 'average_booking_value'],
          dimensions: ['service_type', 'location_type'],
          timeRange: {
            start: this.getDateOffset(-30, 'days'),
            end: this.getDateOffset(0, 'days')
          }
        },
        visualizationConfig: {
          chartTypes: ['line', 'bar', 'pie'],
          groupBy: ['service_type'],
          sortBy: ['total_revenue'],
          limit: 100
        },
        exportConfig: {
          format: 'excel',
          includeCharts: true,
          emailRecipients: ['admin@mariaborysevych.com']
        },
        scheduleConfig: {
          frequency: 'monthly',
          timezone: 'Europe/Warsaw',
          nextRun: this.getNextRunDate('monthly')
        },
        accessLevel: 'admin'
      },
      {
        name: 'Customer Segmentation Report',
        description: 'Detailed customer segment analysis and insights',
        reportType: 'scheduled',
        queryConfig: {
          dataSource: 'customers',
          metrics: ['segment_size', 'average_value', 'retention_rate', 'lifetime_value'],
          dimensions: ['segment_name', 'customer_type'],
          filters: {
            active_segments_only: true
          }
        },
        visualizationConfig: {
          chartTypes: ['pie', 'bar', 'heatmap'],
          groupBy: ['segment_name'],
          sortBy: ['segment_size'],
          limit: 50
        },
        exportConfig: {
          format: 'pdf',
          includeCharts: true,
          emailRecipients: ['manager@mariaborysevych.com']
        },
        scheduleConfig: {
          frequency: 'weekly',
          timezone: 'Europe/Warsaw',
          nextRun: this.getNextRunDate('weekly')
        },
        accessLevel: 'manager'
      },
      {
        name: 'Booking Performance Dashboard',
        description: 'Real-time booking performance metrics and conversion analysis',
        reportType: 'dashboard',
        queryConfig: {
          dataSource: 'bookings',
          metrics: ['conversion_rate', 'completion_rate', 'average_value', 'funnel_metrics'],
          dimensions: ['service_type', 'booking_source', 'time_of_day'],
          timeRange: {
            start: this.getDateOffset(-7, 'days'),
            end: this.getDateOffset(0, 'days')
          }
        },
        visualizationConfig: {
          chartTypes: ['funnel', 'line', 'gauge'],
          groupBy: ['service_type'],
          sortBy: ['conversion_rate'],
          limit: 200
        },
        exportConfig: {
          format: 'csv',
          emailRecipients: ['staff@mariaborysevych.com']
        },
        accessLevel: 'staff'
      },
      {
        name: 'Annual Performance Summary',
        description: 'Comprehensive annual business performance review',
        reportType: 'scheduled',
        queryConfig: {
          dataSource: 'combined',
          metrics: [
            'total_revenue', 'total_bookings', 'customer_growth', 'profitability',
            'market_share', 'satisfaction_scores', 'operational_efficiency'
          ],
          dimensions: ['month', 'quarter', 'service_category'],
          timeRange: {
            start: this.getDateOffset(-365, 'days'),
            end: this.getDateOffset(0, 'days')
          }
        },
        visualizationConfig: {
          chartTypes: ['line', 'bar', 'area', 'scatter'],
          groupBy: ['month', 'quarter'],
          sortBy: ['month'],
          limit: 500
        },
        exportConfig: {
          format: 'excel',
          includeCharts: true,
          emailRecipients: ['admin@mariaborysevych.com', 'manager@mariaborysevych.com']
        },
        scheduleConfig: {
          frequency: 'monthly',
          timezone: 'Europe/Warsaw',
          nextRun: this.getNextRunDate('yearly')
        },
        accessLevel: 'admin'
      },
      {
        name: 'Service Performance Analysis',
        description: 'Individual service performance and profitability analysis',
        reportType: 'ad_hoc',
        queryConfig: {
          dataSource: 'services',
          metrics: [
            'revenue', 'bookings', 'profit_margin', 'customer_rating',
            'utilization_rate', 'growth_rate', 'demand_forecast'
          ],
          dimensions: ['service_name', 'category', 'price_tier'],
          filters: {
            active_services_only: true,
            minimum_bookings: 10
          }
        },
        visualizationConfig: {
          chartTypes: ['bar', 'scatter', 'heatmap'],
          groupBy: ['category'],
          sortBy: ['revenue'],
          limit: 100
        },
        exportConfig: {
          format: 'excel',
          includeCharts: true
        },
        accessLevel: 'manager'
      }
    ]

    for (const report of predefinedReports) {
      try {
        const { error } = await supabase
          .from('analytics_reports')
          .upsert({
            report_name: report.name,
            report_type: report.reportType,
            description: report.description,
            query_config: report.queryConfig,
            visualization_config: report.visualizationConfig,
            export_config: report.exportConfig,
            schedule_config: report.scheduleConfig,
            access_level: report.accessLevel,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'report_name'
          })

        if (error) {
          console.error(`Error initializing report ${report.name}:`, error)
        }
      } catch (error) {
        console.error(`Error initializing report ${report.name}:`, error)
      }
    }
  }

  /**
   * Generate report data
   */
  public async generateReportData(reportId: string, parameters?: Record<string, any>): Promise<ReportData> {
    try {
      // Get report configuration
      const { data: report, error } = await supabase
        .from('analytics_reports')
        .select('*')
        .eq('id', reportId)
        .single()

      if (error) throw error

      const queryConfig = { ...report.query_config, ...parameters }

      // Execute query based on data source
      let data: any[] = []
      let headers: string[] = []

      switch (queryConfig.dataSource) {
        case 'revenue':
          ({ data, headers } = await this.executeRevenueQuery(queryConfig))
          break
        case 'bookings':
          ({ data, headers } = await this.executeBookingsQuery(queryConfig))
          break
        case 'customers':
          ({ data, headers } = await this.executeCustomersQuery(queryConfig))
          break
        case 'services':
          ({ data, headers } = await this.executeServicesQuery(queryConfig))
          break
        case 'combined':
          ({ data, headers } = await this.executeCombinedQuery(queryConfig))
          break
        default:
          throw new Error(`Unknown data source: ${queryConfig.dataSource}`)
      }

      // Apply aggregations
      if (queryConfig.aggregations) {
        data = this.applyAggregations(data, queryConfig.aggregations)
      }

      // Apply sorting and limiting
      if (queryConfig.sortBy) {
        data = this.sortData(data, queryConfig.sortBy)
      }

      if (queryConfig.limit) {
        data = data.slice(0, queryConfig.limit)
      }

      // Generate chart data
      const charts = this.generateChartData(data, report.visualization_config)

      return {
        headers,
        rows: data.map(row => headers.map(header => row[header] || '')),
        metadata: {
          totalRows: data.length,
          generatedAt: new Date().toISOString(),
          dataSource: queryConfig.dataSource,
          filters: queryConfig.filters || {}
        },
        charts
      }

    } catch (error) {
      console.error('Error generating report data:', error)
      throw error
    }
  }

  /**
   * Execute revenue query
   */
  private async executeRevenueQuery(config: any): Promise<{ data: any[]; headers: string[] }> {
    let query = supabase
      .from('revenue_analytics')
      .select('*')

    // Apply time range
    if (config.timeRange) {
      if (config.timeRange.start) {
        query = query.gte('date', config.timeRange.start)
      }
      if (config.timeRange.end) {
        query = query.lte('date', config.timeRange.end)
      }
    }

    // Apply filters
    if (config.filters) {
      Object.entries(config.filters).forEach(([key, value]) => {
        if (value !== undefined) {
          query = query.eq(key, value)
        }
      })
    }

    const { data, error } = await query.order('date', { ascending: false })

    if (error) throw error

    const headers = [
      'date', 'service_type', 'location_type', 'total_revenue',
      'bookings_count', 'average_booking_value', 'currency'
    ]

    return { data: data || [], headers }
  }

  /**
   * Execute bookings query
   */
  private async executeBookingsQuery(config: any): Promise<{ data: any[]; headers: string[] }> {
    let query = supabase
      .from('bookings')
      .select(`
        *,
        services(service_type, title, price),
        profiles(full_name, email)
      `)

    // Apply time range
    if (config.timeRange) {
      if (config.timeRange.start) {
        query = query.gte('booking_date', config.timeRange.start)
      }
      if (config.timeRange.end) {
        query = query.lte('booking_date', config.timeRange.end)
      }
    }

    // Apply filters
    if (config.filters) {
      Object.entries(config.filters).forEach(([key, value]) => {
        if (value !== undefined) {
          query = query.eq(key, value)
        }
      })
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    const headers = [
      'id', 'client_name', 'client_email', 'booking_date', 'start_time',
      'total_amount', 'currency', 'status', 'payment_status',
      'service_type', 'service_title'
    ]

    const processedData = (data || []).map(booking => ({
      ...booking,
      service_type: booking.services?.service_type,
      service_title: booking.services?.title
    }))

    return { data: processedData, headers }
  }

  /**
   * Execute customers query
   */
  private async executeCustomersQuery(config: any): Promise<{ data: any[]; headers: string[] }> {
    // Get customer segments with member counts
    const { data: segments, error: segmentsError } = await supabase
      .from('customer_segments')
      .select(`
        *,
        customer_segment_memberships(
          user_id,
          confidence_score,
          profiles(full_name, email)
        )
      `)
      .eq('is_active', true)

    if (segmentsError) throw segmentsError

    const headers = [
      'segment_name', 'segment_type', 'member_count', 'average_confidence',
      'description', 'priority', 'created_at'
    ]

    const data = (segments || []).map(segment => ({
      ...segment,
      member_count: segment.customer_segment_memberships?.length || 0,
      average_confidence: segment.customer_segment_memberships?.length > 0
        ? (segment.customer_segment_memberships.reduce((sum, m) => sum + m.confidence_score, 0) /
           segment.customer_segment_memberships.length)
        : 0
    }))

    return { data, headers }
  }

  /**
   * Execute services query
   */
  private async executeServicesQuery(config: any): Promise<{ data: any[]; headers: string[] }> {
    let query = supabase
      .from('services')
      .select(`
        *,
        service_gallery(count),
        reviews(rating),
        revenue:revenue_analytics(total_revenue, bookings_count)
      `)
      .eq('is_active', true)

    // Apply filters
    if (config.filters) {
      Object.entries(config.filters).forEach(([key, value]) => {
        if (value !== undefined) {
          query = query.eq(key, value)
        }
      })
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    const headers = [
      'id', 'title', 'service_type', 'category', 'price', 'duration_minutes',
      'is_active', 'total_revenue', 'total_bookings', 'average_rating',
      'gallery_count', 'created_at', 'updated_at'
    ]

    const processedData = (data || []).map(service => ({
      ...service,
      total_revenue: service.revenue?.reduce((sum: number, r: any) => sum + r.total_revenue, 0) || 0,
      total_bookings: service.revenue?.reduce((sum: number, r: any) => sum + r.bookings_count, 0) || 0,
      average_rating: service.reviews?.length > 0
        ? (service.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / service.reviews.length)
        : 0,
      gallery_count: service.service_gallery?.length || 0
    }))

    return { data: processedData, headers }
  }

  /**
   * Execute combined query for comprehensive reports
   */
  private async executeCombinedQuery(config: any): Promise<{ data: any[]; headers: string[] }> {
    // This would combine data from multiple sources
    // For now, return revenue data as default
    return this.executeRevenueQuery(config)
  }

  /**
   * Apply aggregations to data
   */
  private applyAggregations(data: any[], aggregations: Record<string, string>): any[] {
    if (!aggregations || data.length === 0) return data

    // Group by dimensions and apply aggregations
    const groups = new Map<string, any[]>()

    data.forEach(row => {
      const key = Object.keys(aggregations)
        .filter(dim => !['sum', 'avg', 'count', 'min', 'max'].includes(dim))
        .map(dim => row[dim])
        .join('|')

      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(row)
    })

    const aggregatedData = Array.from(groups.entries()).map(([key, rows]) => {
      const dimensions = key.split('|')
      const result: any = {}

      // Set dimensions
      Object.keys(aggregations).forEach((dim, index) => {
        if (!['sum', 'avg', 'count', 'min', 'max'].includes(dim)) {
          result[dim] = dimensions[index]
        }
      })

      // Apply aggregations
      Object.entries(aggregations).forEach(([field, aggType]) => {
        if (['sum', 'avg', 'count', 'min', 'max'].includes(field)) {
          const metricField = Object.keys(rows[0]).find(key =>
            key.includes('revenue') || key.includes('value') || key.includes('count')
          )

          if (metricField) {
            const values = rows.map(row => parseFloat(row[metricField]) || 0)

            switch (aggType) {
              case 'sum':
                result[`${field}_${metricField}`] = values.reduce((sum, val) => sum + val, 0)
                break
              case 'avg':
                result[`${field}_${metricField}`] = values.reduce((sum, val) => sum + val, 0) / values.length
                break
              case 'count':
                result[`${field}_count`] = rows.length
                break
              case 'min':
                result[`${field}_${metricField}`] = Math.min(...values)
                break
              case 'max':
                result[`${field}_${metricField}`] = Math.max(...values)
                break
            }
          }
        }
      })

      return result
    })

    return aggregatedData
  }

  /**
   * Sort data
   */
  private sortData(data: any[], sortBy: string[]): any[] {
    return data.sort((a, b) => {
      for (const field of sortBy) {
        const aVal = a[field]
        const bVal = b[field]

        if (aVal !== bVal) {
          if (typeof aVal === 'number' && typeof bVal === 'number') {
            return bVal - aVal // Descending order for numbers
          }
          return String(bVal).localeCompare(String(aVal)) // Descending order for strings
        }
      }
      return 0
    })
  }

  /**
   * Generate chart data based on visualization config
   */
  private generateChartData(data: any[], vizConfig: any): any[] {
    const charts: any[] = []

    vizConfig.chartTypes?.forEach((chartType: string) => {
      switch (chartType) {
        case 'line':
          charts.push(this.generateLineChart(data, vizConfig))
          break
        case 'bar':
          charts.push(this.generateBarChart(data, vizConfig))
          break
        case 'pie':
          charts.push(this.generatePieChart(data, vizConfig))
          break
        case 'funnel':
          charts.push(this.generateFunnelChart(data, vizConfig))
          break
      }
    })

    return charts
  }

  private generateLineChart(data: any[], vizConfig: any): any {
    return {
      type: 'line',
      title: 'Trend Analysis',
      data: data.map(item => ({
        x: item.date || item.month || item.name,
        y: item.total_revenue || item.value || 0
      }))
    }
  }

  private generateBarChart(data: any[], vizConfig: any): any {
    return {
      type: 'bar',
      title: 'Comparison Analysis',
      data: data.slice(0, 10).map(item => ({
        label: item.service_type || item.category || item.name,
        value: item.total_revenue || item.count || 0
      }))
    }
  }

  private generatePieChart(data: any[], vizConfig: any): any {
    return {
      type: 'pie',
      title: 'Distribution Analysis',
      data: data.slice(0, 8).map(item => ({
        label: item.service_type || item.category || item.name,
        value: item.total_revenue || item.count || 0
      }))
    }
  }

  private generateFunnelChart(data: any[], vizConfig: any): any {
    return {
      type: 'funnel',
      title: 'Conversion Funnel',
      data: [
        { stage: 'Views', value: data.reduce((sum, item) => sum + (item.views || 0), 0) },
        { stage: 'Initiated', value: data.reduce((sum, item) => sum + (item.initiated || 0), 0) },
        { stage: 'Completed', value: data.reduce((sum, item) => sum + (item.completed || 0), 0) }
      ]
    }
  }

  /**
   * Export report to file
   */
  public async exportReport(
    reportId: string,
    format: 'csv' | 'excel' | 'pdf' | 'json',
    parameters?: Record<string, any>
  ): Promise<ExportResult> {
    try {
      // Generate report data
      const reportData = await this.generateReportData(reportId, parameters)

      // Create report execution record
      const { data: execution, error: executionError } = await supabase
        .from('analytics_report_executions')
        .insert({
          report_id: reportId,
          execution_type: 'manual',
          status: 'running',
          started_at: new Date().toISOString(),
          parameters: parameters || {}
        })
        .select()
        .single()

      if (executionError) throw executionError

      // Generate file based on format
      let filePath: string
      let fileSize: number

      switch (format) {
        case 'csv':
          filePath = await this.exportToCSV(reportData)
          break
        case 'excel':
          filePath = await this.exportToExcel(reportData)
          break
        case 'pdf':
          filePath = await this.exportToPDF(reportData)
          break
        case 'json':
          filePath = await this.exportToJSON(reportData)
          break
        default:
          throw new Error(`Unsupported export format: ${format}`)
      }

      // Get file size
      const fs = require('fs')
      fileSize = fs.statSync(filePath).size

      // Update execution record
      await supabase
        .from('analytics_report_executions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          execution_time_seconds: Math.floor((Date.now() - new Date(execution.started_at).getTime()) / 1000),
          file_path: filePath,
          file_size_bytes: fileSize
        })
        .eq('id', execution.id)

      return {
        success: true,
        filePath,
        fileSize,
        downloadUrl: `/api/reports/download/${execution.id}`
      }

    } catch (error) {
      console.error('Error exporting report:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Export to CSV
   */
  private async exportToCSV(reportData: ReportData): Promise<string> {
    const fs = require('fs')
    const path = require('path')

    const csvContent = [
      reportData.headers.join(','),
      ...reportData.rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const fileName = `report_${Date.now()}.csv`
    const filePath = path.join('/tmp', fileName)

    fs.writeFileSync(filePath, csvContent)
    return filePath
  }

  /**
   * Export to Excel
   */
  private async exportToExcel(reportData: ReportData): Promise<string> {
    // This would use a library like xlsx to generate Excel files
    // For now, return a CSV path as placeholder
    return this.exportToCSV(reportData)
  }

  /**
   * Export to PDF
   */
  private async exportToPDF(reportData: ReportData): Promise<string> {
    // This would use a library like puppeteer to generate PDF files
    // For now, return a text file path as placeholder
    const fs = require('fs')
    const path = require('path')

    const textContent = [
      `Report Generated: ${reportData.metadata.generatedAt}`,
      `Total Rows: ${reportData.metadata.totalRows}`,
      `Data Source: ${reportData.metadata.dataSource}`,
      '',
      ...reportData.rows.map(row => row.join('\t'))
    ].join('\n')

    const fileName = `report_${Date.now()}.txt`
    const filePath = path.join('/tmp', fileName)

    fs.writeFileSync(filePath, textContent)
    return filePath
  }

  /**
   * Export to JSON
   */
  private async exportToJSON(reportData: ReportData): Promise<string> {
    const fs = require('fs')
    const path = require('path')

    const jsonData = {
      metadata: reportData.metadata,
      headers: reportData.headers,
      data: reportData.rows.map(row => {
        const obj: any = {}
        reportData.headers.forEach((header, index) => {
          obj[header] = row[index]
        })
        return obj
      }),
      charts: reportData.charts
    }

    const fileName = `report_${Date.now()}.json`
    const filePath = path.join('/tmp', fileName)

    fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2))
    return filePath
  }

  /**
   * Schedule report execution
   */
  public async scheduleReport(reportId: string): Promise<void> {
    try {
      // Get report configuration
      const { data: report, error } = await supabase
        .from('analytics_reports')
        .select('*')
        .eq('id', reportId)
        .single()

      if (error) throw error

      if (!report.schedule_config) {
        throw new Error('Report does not have schedule configuration')
      }

      // Calculate next run time
      const nextRun = new Date(report.schedule_config.nextRun)
      const delay = nextRun.getTime() - Date.now()

      if (delay > 0) {
        // Schedule execution
        const timer = setTimeout(() => {
          this.executeScheduledReport(reportId)
        }, delay)

        this.scheduledReports.set(reportId, timer)

        console.log(`Report ${report.report_name} scheduled for ${nextRun.toISOString()}`)
      }

    } catch (error) {
      console.error('Error scheduling report:', error)
    }
  }

  /**
   * Execute scheduled report
   */
  private async executeScheduledReport(reportId: string): Promise<void> {
    try {
      // Get report configuration
      const { data: report, error } = await supabase
        .from('analytics_reports')
        .select('*')
        .eq('id', reportId)
        .single()

      if (error) throw error

      // Execute report
      const { data: execution } = await supabase
        .from('analytics_report_executions')
        .insert({
          report_id: reportId,
          execution_type: 'scheduled',
          status: 'running',
          started_at: new Date().toISOString()
        })
        .select()
        .single()

      // Generate and export report
      const exportResult = await this.exportReport(
        reportId,
        report.export_config.format as any,
        report.queryConfig.filters
      )

      if (exportResult.success) {
        // Send email notifications
        await this.sendReportEmail(report, exportResult.downloadUrl!)

        // Update next run time
        const nextRun = this.calculateNextRunTime(report.schedule_config!.frequency)
        await supabase
          .from('analytics_reports')
          .update({
            schedule_config: {
              ...report.schedule_config,
              nextRun: nextRun.toISOString()
            }
          })
          .eq('id', reportId)

        // Schedule next execution
        await this.scheduleReport(reportId)
      }

      // Update execution record
      await supabase
        .from('analytics_report_executions')
        .update({
          status: exportResult.success ? 'completed' : 'failed',
          completed_at: new Date().toISOString(),
          execution_time_seconds: Math.floor((Date.now() - new Date(execution!.started_at).getTime()) / 1000),
          error_message: exportResult.error
        })
        .eq('id', execution!.id)

    } catch (error) {
      console.error('Error executing scheduled report:', error)
    }
  }

  /**
   * Send report email
   */
  private async sendReportEmail(report: AnalyticsReport, downloadUrl: string): Promise<void> {
    // Implementation would depend on your email service
    console.log(`Sending report email for ${report.report_name}: ${downloadUrl}`)
  }

  /**
   * Calculate next run time
   */
  private calculateNextRunTime(frequency: string): Date {
    const now = new Date()

    switch (frequency) {
      case 'hourly':
        return new Date(now.getTime() + 60 * 60 * 1000)
      case 'daily':
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(9, 0, 0, 0) // 9 AM
        return tomorrow
      case 'weekly':
        const nextWeek = new Date(now)
        nextWeek.setDate(nextWeek.getDate() + 7)
        nextWeek.setHours(9, 0, 0, 0) // 9 AM
        return nextWeek
      case 'monthly':
        const nextMonth = new Date(now)
        nextMonth.setMonth(nextMonth.getMonth() + 1)
        nextMonth.setDate(1)
        nextMonth.setHours(9, 0, 0, 0) // 9 AM
        return nextMonth
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000) // Default to daily
    }
  }

  /**
   * Get next run date for initial setup
   */
  private getNextRunDate(frequency: string): string {
    return this.calculateNextRunTime(frequency).toISOString()
  }

  /**
   * Get date offset
   */
  private getDateOffset(offset: number, unit: 'days' | 'months' | 'years'): string {
    const date = new Date()

    switch (unit) {
      case 'days':
        date.setDate(date.getDate() + offset)
        break
      case 'months':
        date.setMonth(date.getMonth() + offset)
        break
      case 'years':
        date.setFullYear(date.getFullYear() + offset)
        break
    }

    return date.toISOString().split('T')[0]
  }

  /**
   * Get available reports
   */
  public async getAvailableReports(accessLevel: string): Promise<AnalyticsReport[]> {
    try {
      const { data, error } = await supabase
        .from('analytics_reports')
        .select('*')
        .eq('is_active', true)
        .order('report_name')

      if (error) throw error

      // Filter by access level
      return (data || []).filter(report => {
        const accessLevels = ['viewer', 'staff', 'manager', 'admin']
        const userAccessIndex = accessLevels.indexOf(accessLevel)
        const reportAccessIndex = accessLevels.indexOf(report.access_level)

        return userAccessIndex >= reportAccessIndex
      })

    } catch (error) {
      console.error('Error getting available reports:', error)
      return []
    }
  }

  /**
   * Get report execution history
   */
  public async getReportHistory(reportId: string, limit: number = 10): Promise<AnalyticsReportExecution[]> {
    try {
      const { data, error } = await supabase
        .from('analytics_report_executions')
        .select('*')
        .eq('report_id', reportId)
        .order('started_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting report history:', error)
      return []
    }
  }
}

// Export singleton instance
export const reportingService = AnalyticsReportingService.getInstance()

// Export types
export type {
  ReportConfig,
  ReportData,
  ExportResult
}