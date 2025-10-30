/**
 * Data Visualization and Reporting Automation
 *
 * Provides automated report generation, data visualization,
 * and export functionality for all analytics components.
 */

import { supabase } from '../supabase/client-optimized';
import {
  CustomerSegment,
  KPIMetric,
  RevenueForecast,
  PredictiveModel,
  AnalyticsEvent
} from './types';

// Chart configuration types
export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'scatter' | 'heatmap' | 'funnel' | 'gauge' | 'area';
  title: string;
  subtitle?: string;
  xAxis: AxisConfig;
  yAxis: AxisConfig;
  series: SeriesConfig[];
  filters?: FilterConfig[];
  interactive?: boolean;
  animations?: boolean;
  theme?: 'light' | 'dark' | 'luxury';
}

export interface AxisConfig {
  label: string;
  type: 'category' | 'value' | 'time';
  format?: string;
  min?: number;
  max?: number;
  tickInterval?: number;
  angle?: number;
}

export interface SeriesConfig {
  name: string;
  dataKey: string;
  type?: 'line' | 'bar' | 'area' | 'scatter';
  color?: string;
  strokeWidth?: number;
  fillOpacity?: number;
  yAxisIndex?: number;
}

export interface FilterConfig {
  field: string;
  label: string;
  type: 'date' | 'select' | 'multiselect' | 'range';
  options?: Array<{ label: string; value: any }>;
  defaultValue?: any;
}

// Report configuration
export interface ReportConfig {
  id: string;
  name: string;
  description: string;
  category: 'executive' | 'operational' | 'marketing' | 'financial' | 'customer';
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'on-demand';
  recipients: string[];
  charts: ChartConfig[];
  dataSources: string[];
  exportFormats: ('pdf' | 'excel' | 'powerpoint' | 'csv' | 'json')[];
  branding?: {
    logo?: string;
    colors?: string[];
    fonts?: string[];
  };
  customSections?: ReportSection[];
}

export interface ReportSection {
  title: string;
  type: 'summary' | 'chart' | 'table' | 'text' | 'image';
  content: any;
  order: number;
}

export interface GeneratedReport {
  id: string;
  configId: string;
  generatedAt: Date;
  data: any;
  charts: ChartData[];
  insights: ReportInsight[];
  exportLinks: Record<string, string>;
  metadata: {
    dataRange: { start: Date; end: Date };
    recordCount: number;
    generatedBy: string;
    version: string;
  };
}

export interface ChartData {
  config: ChartConfig;
  data: any[];
  visualization: {
    svg?: string;
    canvas?: string;
    interactiveData?: any;
  };
  summary: {
    title: string;
    keyFindings: string[];
    trend: 'up' | 'down' | 'stable';
    change?: number;
    significance: 'high' | 'medium' | 'low';
  };
}

export interface ReportInsight {
  type: 'trend' | 'anomaly' | 'opportunity' | 'risk' | 'achievement';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  recommendations: string[];
  data: any;
}

// Dashboard widget types
export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'alert' | 'calendar' | 'list';
  title: string;
  size: { width: number; height: number };
  position: { x: number; y: number };
  config: any;
  refreshInterval?: number;
  dataSource: string;
}

export interface DashboardLayout {
  id: string;
  name: string;
  role: 'executive' | 'admin' | 'marketing' | 'service_provider';
  widgets: DashboardWidget[];
  layout: 'grid' | 'flex' | 'masonry';
  responsive: boolean;
  theme: 'light' | 'dark' | 'luxury';
}

/**
 * Main data visualization and reporting automation class
 */
export class DataVisualizationService {
  private reportConfigs: Map<string, ReportConfig> = new Map();
  private dashboardLayouts: Map<string, DashboardLayout> = new Map();

  constructor() {
    this.initializeDefaultReports();
    this.initializeDefaultDashboards();
  }

  /**
   * Initialize default report configurations
   */
  private initializeDefaultReports(): void {
    // Executive Summary Report
    this.reportConfigs.set('executive-summary', {
      id: 'executive-summary',
      name: 'Executive Summary Report',
      description: 'High-level overview of business performance for executive leadership',
      category: 'executive',
      frequency: 'weekly',
      recipients: ['executive@mariaborysevych.com'],
      charts: [
        {
          type: 'line',
          title: 'Revenue Trend',
          subtitle: 'Monthly revenue with forecast',
          xAxis: { label: 'Month', type: 'time' },
          yAxis: { label: 'Revenue (PLN)', type: 'value' },
          series: [
            { name: 'Actual Revenue', dataKey: 'actual' },
            { name: 'Forecast', dataKey: 'forecast' }
          ],
          interactive: true,
          animations: true
        },
        {
          type: 'gauge',
          title: 'Overall Performance Score',
          subtitle: 'Composite KPI score',
          xAxis: { label: '', type: 'category' },
          yAxis: { label: 'Score', type: 'value', min: 0, max: 100 },
          series: [{ name: 'Score', dataKey: 'value' }],
          interactive: false,
          animations: true
        },
        {
          type: 'pie',
          title: 'Revenue by Service Category',
          subtitle: 'Distribution across beauty, fitness, and lifestyle',
          xAxis: { label: 'Category', type: 'category' },
          yAxis: { label: 'Revenue %', type: 'value' },
          series: [{ name: 'Revenue', dataKey: 'value' }],
          interactive: true,
          animations: true
        }
      ],
      dataSources: ['revenue_metrics', 'kpi_metrics', 'booking_analytics'],
      exportFormats: ['pdf', 'powerpoint', 'excel'],
      branding: {
        colors: ['#8B4513', '#F5DEB3', '#D4A574', '#FFF8DC'],
        fonts: ['Inter', 'Space Grotesk']
      }
    });

    // Marketing Performance Report
    this.reportConfigs.set('marketing-performance', {
      id: 'marketing-performance',
      name: 'Marketing Performance Report',
      description: 'Detailed analysis of marketing campaigns and customer acquisition',
      category: 'marketing',
      frequency: 'weekly',
      recipients: ['marketing@mariaborysevych.com'],
      charts: [
        {
          type: 'funnel',
          title: 'Customer Acquisition Funnel',
          subtitle: 'Conversion rates through the marketing funnel',
          xAxis: { label: 'Stage', type: 'category' },
          yAxis: { label: 'Users', type: 'value' },
          series: [{ name: 'Users', dataKey: 'count' }],
          interactive: true,
          animations: true
        },
        {
          type: 'bar',
          title: 'Campaign ROI by Channel',
          subtitle: 'Return on investment across marketing channels',
          xAxis: { label: 'Channel', type: 'category' },
          yAxis: { label: 'ROI %', type: 'value' },
          series: [{ name: 'ROI', dataKey: 'roi' }],
          interactive: true,
          animations: true
        },
        {
          type: 'scatter',
          title: 'Customer Lifetime Value vs Acquisition Cost',
          subtitle: 'Customer profitability analysis',
          xAxis: { label: 'Acquisition Cost', type: 'value' },
          yAxis: { label: 'Lifetime Value', type: 'value' },
          series: [{ name: 'Customers', dataKey: 'value' }],
          interactive: true,
          animations: false
        }
      ],
      dataSources: ['campaign_analytics', 'customer_segments', 'acquisition_metrics'],
      exportFormats: ['pdf', 'excel', 'csv']
    });

    // Financial Performance Report
    this.reportConfigs.set('financial-performance', {
      id: 'financial-performance',
      name: 'Financial Performance Report',
      description: 'Comprehensive financial analysis and revenue optimization insights',
      category: 'financial',
      frequency: 'monthly',
      recipients: ['finance@mariaborysevych.com', 'executive@mariaborysevych.com'],
      charts: [
        {
          type: 'area',
          title: 'Revenue Breakdown',
          subtitle: 'Revenue by service type and time period',
          xAxis: { label: 'Date', type: 'time' },
          yAxis: { label: 'Revenue (PLN)', type: 'value' },
          series: [
            { name: 'Beauty Services', dataKey: 'beauty' },
            { name: 'Fitness Programs', dataKey: 'fitness' },
            { name: 'Lifestyle Services', dataKey: 'lifestyle' }
          ],
          interactive: true,
          animations: true
        },
        {
          type: 'line',
          title: 'Profit Margin Trend',
          subtitle: 'Monthly profit margins over time',
          xAxis: { label: 'Month', type: 'time' },
          yAxis: { label: 'Margin %', type: 'value' },
          series: [{ name: 'Profit Margin', dataKey: 'margin' }],
          interactive: true,
          animations: true
        }
      ],
      dataSources: ['financial_metrics', 'service_revenue', 'cost_analysis'],
      exportFormats: ['pdf', 'excel', 'powerpoint']
    });
  }

  /**
   * Initialize default dashboard layouts
   */
  private initializeDefaultDashboards(): void {
    // Executive Dashboard Layout
    this.dashboardLayouts.set('executive', {
      id: 'executive',
      name: 'Executive Dashboard',
      role: 'executive',
      widgets: [
        {
          id: 'revenue-growth',
          type: 'metric',
          title: 'Revenue Growth',
          size: { width: 2, height: 1 },
          position: { x: 0, y: 0 },
          config: {
            primaryMetric: 'revenue_growth',
            trend: 'monthly',
            target: 15
          },
          refreshInterval: 3600000,
          dataSource: 'kpi_metrics'
        },
        {
          id: 'booking-funnel',
          type: 'chart',
          title: 'Booking Conversion Funnel',
          size: { width: 2, height: 2 },
          position: { x: 2, y: 0 },
          config: {
            chartType: 'funnel',
            dataKey: 'booking_stages'
          },
          refreshInterval: 1800000,
          dataSource: 'booking_analytics'
        },
        {
          id: 'performance-alerts',
          type: 'alert',
          title: 'Performance Alerts',
          size: { width: 2, height: 1 },
          position: { x: 4, y: 0 },
          config: {
            severity: 'high',
            categories: ['performance', 'financial', 'operational']
          },
          refreshInterval: 600000,
          dataSource: 'system_alerts'
        }
      ],
      layout: 'grid',
      responsive: true,
      theme: 'luxury'
    });
  }

  /**
   * Generate a report based on configuration
   */
  public async generateReport(configId: string, options?: {
    dateRange?: { start: Date; end: Date };
    format?: 'pdf' | 'excel' | 'powerpoint' | 'csv' | 'json';
    language?: 'en' | 'pl';
    customFilters?: Record<string, any>;
  }): Promise<GeneratedReport> {
    const config = this.reportConfigs.get(configId);
    if (!config) {
      throw new Error(`Report configuration ${configId} not found`);
    }

    try {
      // Fetch data from all configured sources
      const reportData = await this.fetchReportData(config.dataSources, options);

      // Generate charts
      const charts: ChartData[] = [];
      for (const chartConfig of config.charts) {
        const chartData = await this.generateChart(chartConfig, reportData);
        charts.push(chartData);
      }

      // Generate insights
      const insights = await this.generateReportInsights(reportData, charts);

      // Create report metadata
      const metadata = {
        dataRange: options?.dateRange || {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          end: new Date()
        },
        recordCount: this.calculateRecordCount(reportData),
        generatedBy: 'automated',
        version: '1.0'
      };

      const report: GeneratedReport = {
        id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        configId,
        generatedAt: new Date(),
        data: reportData,
        charts,
        insights,
        exportLinks: {}, // Will be populated when exports are generated
        metadata
      };

      // Save report to database
      await this.saveReport(report);

      // Generate exports if specified
      if (options?.format) {
        const exportLinks = await this.generateReportExports(report, [options.format]);
        report.exportLinks = exportLinks;
      }

      return report;

    } catch (error) {
      console.error(`Error generating report ${configId}:`, error);
      throw error;
    }
  }

  /**
   * Fetch data for report from multiple sources
   */
  private async fetchReportData(dataSources: string[], options?: {
    dateRange?: { start: Date; end: Date };
    customFilters?: Record<string, any>;
  }): Promise<Record<string, any[]>> {
    const data: Record<string, any[]> = {};

    for (const source of dataSources) {
      try {
        switch (source) {
          case 'revenue_metrics':
            data[source] = await this.fetchRevenueMetrics(options?.dateRange);
            break;
          case 'kpi_metrics':
            data[source] = await this.fetchKPIMetrics(options?.dateRange);
            break;
          case 'booking_analytics':
            data[source] = await this.fetchBookingAnalytics(options?.dateRange);
            break;
          case 'customer_segments':
            data[source] = await this.fetchCustomerSegments();
            break;
          case 'campaign_analytics':
            data[source] = await this.fetchCampaignAnalytics(options?.dateRange);
            break;
          case 'financial_metrics':
            data[source] = await this.fetchFinancialMetrics(options?.dateRange);
            break;
          case 'service_revenue':
            data[source] = await this.fetchServiceRevenue(options?.dateRange);
            break;
          case 'system_alerts':
            data[source] = await this.fetchSystemAlerts();
            break;
          default:
            console.warn(`Unknown data source: ${source}`);
        }
      } catch (error) {
        console.error(`Error fetching data from source ${source}:`, error);
        data[source] = [];
      }
    }

    return data;
  }

  /**
   * Generate chart data and visualization
   */
  private async generateChart(config: ChartConfig, data: Record<string, any[]>): Promise<ChartData> {
    try {
      // Process data based on chart type
      const processedData = this.processChartData(config, data);

      // Generate visualization (simplified - in production would use D3.js, Chart.js, etc.)
      const visualization = await this.createVisualization(config, processedData);

      // Generate summary insights
      const summary = await this.generateChartSummary(config, processedData);

      return {
        config,
        data: processedData,
        visualization,
        summary
      };

    } catch (error) {
      console.error('Error generating chart:', error);
      throw error;
    }
  }

  /**
   * Process data for specific chart type
   */
  private processChartData(config: ChartConfig, rawData: Record<string, any[]>): any[] {
    // This is a simplified implementation
    // In production, would have sophisticated data processing for each chart type

    switch (config.type) {
      case 'line':
      case 'area':
        return this.processTimeSeriesData(config, rawData);
      case 'bar':
        return this.processBarChartData(config, rawData);
      case 'pie':
        return this.processPieChartData(config, rawData);
      case 'scatter':
        return this.processScatterData(config, rawData);
      case 'funnel':
        return this.processFunnelData(config, rawData);
      case 'gauge':
        return this.processGaugeData(config, rawData);
      default:
        return this.processGenericData(config, rawData);
    }
  }

  /**
   * Create visualization for chart
   */
  private async createVisualization(config: ChartConfig, data: any[]): Promise<ChartData['visualization']> {
    // This would integrate with a charting library like D3.js, Chart.js, or Recharts
    // For now, return placeholder data structure

    return {
      // SVG representation would be generated here
      svg: '<svg><!-- Chart SVG would be generated here --></svg>',
      // Interactive data for web rendering
      interactiveData: {
        config,
        data,
        options: {
          responsive: true,
          animations: config.animations,
          theme: config.theme || 'luxury'
        }
      }
    };
  }

  /**
   * Generate insights from charts and data
   */
  private async generateReportInsights(
    data: Record<string, any[]>,
    charts: ChartData[]
  ): Promise<ReportInsight[]> {
    const insights: ReportInsight[] = [];

    try {
      // Analyze revenue trends
      if (data.revenue_metrics) {
        const revenueInsight = await this.analyzeRevenueTrends(data.revenue_metrics);
        if (revenueInsight) insights.push(revenueInsight);
      }

      // Analyze booking patterns
      if (data.booking_analytics) {
        const bookingInsight = await this.analyzeBookingPatterns(data.booking_analytics);
        if (bookingInsight) insights.push(bookingInsight);
      }

      // Analyze customer segments
      if (data.customer_segments) {
        const segmentInsight = await this.analyzeCustomerSegments(data.customer_segments);
        if (segmentInsight) insights.push(segmentInsight);
      }

      // Analyze campaign performance
      if (data.campaign_analytics) {
        const campaignInsight = await this.analyzeCampaignPerformance(data.campaign_analytics);
        if (campaignInsight) insights.push(campaignInsight);
      }

      // Generate chart-specific insights
      for (const chart of charts) {
        if (chart.summary.trend !== 'stable' && chart.summary.significance === 'high') {
          insights.push({
            type: chart.summary.trend === 'up' ? 'achievement' : 'risk',
            title: `Significant ${chart.summary.trend} in ${chart.config.title}`,
            description: `${chart.config.title} shows a ${chart.summary.trend}ward trend with ${chart.summary.change}% change`,
            impact: chart.summary.significance,
            confidence: 0.85,
            recommendations: [
              chart.summary.trend === 'up'
                ? `Continue strategies driving growth in ${chart.config.title}`
                : `Investigate causes of decline in ${chart.config.title}`
            ],
            data: chart.summary
          });
        }
      }

    } catch (error) {
      console.error('Error generating insights:', error);
    }

    return insights;
  }

  /**
   * Generate exports for report in different formats
   */
  public async generateReportExports(
    report: GeneratedReport,
    formats: string[]
  ): Promise<Record<string, string>> {
    const exportLinks: Record<string, string> = {};

    try {
      for (const format of formats) {
        switch (format) {
          case 'pdf':
            exportLinks.pdf = await this.generatePDFExport(report);
            break;
          case 'excel':
            exportLinks.excel = await this.generateExcelExport(report);
            break;
          case 'powerpoint':
            exportLinks.powerpoint = await this.generatePowerPointExport(report);
            break;
          case 'csv':
            exportLinks.csv = await this.generateCSVExport(report);
            break;
          case 'json':
            exportLinks.json = await this.generateJSONExport(report);
            break;
        }
      }
    } catch (error) {
      console.error('Error generating exports:', error);
    }

    return exportLinks;
  }

  /**
   * Create custom dashboard layout
   */
  public async createDashboardLayout(config: Omit<DashboardLayout, 'id'>): Promise<DashboardLayout> {
    const layout: DashboardLayout = {
      ...config,
      id: `dashboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    this.dashboardLayouts.set(layout.id, layout);
    await this.saveDashboardLayout(layout);

    return layout;
  }

  /**
   * Get dashboard layout for role
   */
  public getDashboardLayout(role: string): DashboardLayout | null {
    for (const layout of this.dashboardLayouts.values()) {
      if (layout.role === role) {
        return layout;
      }
    }
    return null;
  }

  /**
   * Schedule automated report generation
   */
  public async scheduleReport(configId: string, schedule: {
    frequency: 'daily' | 'weekly' | 'monthly';
    dayOfWeek?: number;
    dayOfMonth?: number;
    time: string; // HH:MM format
    timezone?: string;
    enabled: boolean;
  }): Promise<void> {
    try {
      // Save schedule to database
      const { error } = await supabase
        .from('report_schedules')
        .insert({
          config_id: configId,
          frequency: schedule.frequency,
          day_of_week: schedule.dayOfWeek,
          day_of_month: schedule.dayOfMonth,
          time: schedule.time,
          timezone: schedule.timezone || 'Europe/Warsaw',
          enabled: schedule.enabled,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

    } catch (error) {
      console.error('Error scheduling report:', error);
      throw error;
    }
  }

  // Private helper methods for data fetching and processing

  private async fetchRevenueMetrics(dateRange?: { start: Date; end: Date }): Promise<any[]> {
    const query = supabase
      .from('revenue_analytics')
      .select('*')
      .order('date', { ascending: true });

    if (dateRange) {
      query
        .gte('date', dateRange.start.toISOString())
        .lte('date', dateRange.end.toISOString());
    }

    const { data, error } = await query;
    return data || [];
  }

  private async fetchKPIMetrics(dateRange?: { start: Date; end: Date }): Promise<any[]> {
    const query = supabase
      .from('kpi_metrics')
      .select('*')
      .order('recorded_at', { ascending: true });

    if (dateRange) {
      query
        .gte('recorded_at', dateRange.start.toISOString())
        .lte('recorded_at', dateRange.end.toISOString());
    }

    const { data, error } = await query;
    return data || [];
  }

  private async fetchBookingAnalytics(dateRange?: { start: Date; end: Date }): Promise<any[]> {
    // Query booking analytics
    const { data, error } = await supabase
      .from('analytics_events')
      .select('*')
      .eq('event_type', 'booking_journey')
      .order('timestamp', { ascending: true });

    return data || [];
  }

  private async fetchCustomerSegments(): Promise<any[]> {
    const { data, error } = await supabase
      .from('customer_segments')
      .select('*')
      .order('updated_at', { ascending: false });

    return data || [];
  }

  private async fetchCampaignAnalytics(dateRange?: { start: Date; end: Date }): Promise<any[]> {
    // This would fetch from campaign analytics tables
    return [];
  }

  private async fetchFinancialMetrics(dateRange?: { start: Date; end: Date }): Promise<any[]> {
    // This would fetch from financial metrics tables
    return [];
  }

  private async fetchServiceRevenue(dateRange?: { start: Date; end: Date }): Promise<any[]> {
    const query = supabase
      .from('services')
      .select(`
        id,
        title,
        category,
        base_price,
        bookings!inner(
          id,
          status,
          created_at,
          total_price
        )
      `);

    if (dateRange) {
      query
        .gte('bookings.created_at', dateRange.start.toISOString())
        .lte('bookings.created_at', dateRange.end.toISOString());
    }

    const { data, error } = await query;
    return data || [];
  }

  private async fetchSystemAlerts(): Promise<any[]> {
    const { data, error } = await supabase
      .from('system_alerts')
      .select('*')
      .eq('resolved', false)
      .order('created_at', { ascending: false });

    return data || [];
  }

  // Chart data processing methods
  private processTimeSeriesData(config: ChartConfig, data: Record<string, any[]>): any[] {
    // Simplified time series processing
    return data.revenue_metrics || [];
  }

  private processBarChartData(config: ChartConfig, data: Record<string, any[]>): any[] {
    // Simplified bar chart processing
    return data.service_revenue || [];
  }

  private processPieChartData(config: ChartConfig, data: Record<string, any[]>): any[] {
    // Simplified pie chart processing
    return data.service_revenue || [];
  }

  private processScatterData(config: ChartConfig, data: Record<string, any[]>): any[] {
    // Simplified scatter plot processing
    return data.customer_segments || [];
  }

  private processFunnelData(config: ChartConfig, data: Record<string, any[]>): any[] {
    // Simplified funnel chart processing
    return data.booking_analytics || [];
  }

  private processGaugeData(config: ChartConfig, data: Record<string, any[]>): any[] {
    // Simplified gauge chart processing
    return data.kpi_metrics || [];
  }

  private processGenericData(config: ChartConfig, data: Record<string, any[]>): any[] {
    // Generic data processing
    const firstDataArray = Object.values(data).find(arr => arr.length > 0);
    return firstDataArray || [];
  }

  // Chart summary generation
  private async generateChartSummary(config: ChartConfig, data: any[]): Promise<ChartData['summary']> {
    // Simplified summary generation
    const summary: ChartData['summary'] = {
      title: config.title,
      keyFindings: [],
      trend: 'stable',
      change: 0,
      significance: 'low'
    };

    if (data.length > 1) {
      // Simple trend calculation
      const firstValue = data[0].value || 0;
      const lastValue = data[data.length - 1].value || 0;
      const change = ((lastValue - firstValue) / firstValue) * 100;

      summary.change = Math.abs(change);
      summary.trend = change > 5 ? 'up' : change < -5 ? 'down' : 'stable';
      summary.significance = Math.abs(change) > 10 ? 'high' : Math.abs(change) > 5 ? 'medium' : 'low';

      summary.keyFindings.push(
        `${Math.abs(change).toFixed(1)}% ${summary.trend === 'up' ? 'increase' : summary.trend === 'down' ? 'decrease' : 'change'} observed`
      );
    }

    return summary;
  }

  // Insight analysis methods
  private async analyzeRevenueTrends(data: any[]): Promise<ReportInsight | null> {
    if (data.length < 2) return null;

    const revenue = data.map(d => d.revenue);
    const avgRevenue = revenue.reduce((a, b) => a + b, 0) / revenue.length;
    const recentRevenue = revenue.slice(-7).reduce((a, b) => a + b, 0) / Math.min(7, revenue.length);

    const growth = ((recentRevenue - avgRevenue) / avgRevenue) * 100;

    if (Math.abs(growth) > 10) {
      return {
        type: growth > 0 ? 'achievement' : 'risk',
        title: `Revenue ${growth > 0 ? 'Growth' : 'Decline'} Detected`,
        description: `Recent revenue is ${Math.abs(growth).toFixed(1)}% ${growth > 0 ? 'above' : 'below'} average`,
        impact: Math.abs(growth) > 20 ? 'high' : 'medium',
        confidence: 0.8,
        recommendations: [
          growth > 0
            ? 'Analyze drivers of growth to replicate success'
            : 'Investigate causes of revenue decline'
        ],
        data: { growth, avgRevenue, recentRevenue }
      };
    }

    return null;
  }

  private async analyzeBookingPatterns(data: any[]): Promise<ReportInsight | null> {
    // Analyze booking patterns and generate insights
    return null;
  }

  private async analyzeCustomerSegments(data: any[]): Promise<ReportInsight | null> {
    // Analyze customer segments and generate insights
    return null;
  }

  private async analyzeCampaignPerformance(data: any[]): Promise<ReportInsight | null> {
    // Analyze campaign performance and generate insights
    return null;
  }

  // Export generation methods
  private async generatePDFExport(report: GeneratedReport): Promise<string> {
    // This would generate PDF using a library like PDFKit or Puppeteer
    return `#reports/${report.id}.pdf`;
  }

  private async generateExcelExport(report: GeneratedReport): Promise<string> {
    // This would generate Excel using a library like ExcelJS
    return `#reports/${report.id}.xlsx`;
  }

  private async generatePowerPointExport(report: GeneratedReport): Promise<string> {
    // This would generate PowerPoint using a library like PptxGenJS
    return `#reports/${report.id}.pptx`;
  }

  private async generateCSVExport(report: GeneratedReport): Promise<string> {
    // This would generate CSV from report data
    return `#reports/${report.id}.csv`;
  }

  private async generateJSONExport(report: GeneratedReport): Promise<string> {
    // This would generate JSON export of report data
    return `#reports/${report.id}.json`;
  }

  // Database operations
  private async saveReport(report: GeneratedReport): Promise<void> {
    try {
      const { error } = await supabase
        .from('generated_reports')
        .insert({
          id: report.id,
          config_id: report.configId,
          generated_at: report.generatedAt.toISOString(),
          data: report.data,
          insights: report.insights,
          metadata: report.metadata
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving report:', error);
    }
  }

  private async saveDashboardLayout(layout: DashboardLayout): Promise<void> {
    try {
      const { error } = await supabase
        .from('dashboard_layouts')
        .insert({
          id: layout.id,
          name: layout.name,
          role: layout.role,
          widgets: layout.widgets,
          layout: layout.layout,
          responsive: layout.responsive,
          theme: layout.theme
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving dashboard layout:', error);
    }
  }

  private calculateRecordCount(data: Record<string, any[]>): number {
    return Object.values(data).reduce((total, array) => total + array.length, 0);
  }
}

// Export singleton instance
export const dataVisualizationService = new DataVisualizationService();

// Export types for use in components
export type {
  ChartConfig,
  ReportConfig,
  DashboardLayout,
  GeneratedReport,
  ChartData,
  ReportInsight,
  DashboardWidget
};