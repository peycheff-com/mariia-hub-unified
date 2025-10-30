/**
 * Multi-Source Data Integration Layer
 *
 * Integrates data from various sources:
 * - Bookings and payments
 * - User behavior and profiles
 * - Service performance
 * - External marketing platforms
 * - Real-time event streams
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';

export interface DataSource {
  name: string;
  type: 'database' | 'api' | 'file' | 'stream';
  connectionConfig: any;
  lastSync: Date | null;
  status: 'active' | 'inactive' | 'error';
  metrics: {
    recordsProcessed: number;
    errors: number;
    syncDuration: number;
  };
}

export interface DataValidationRule {
  field: string;
  rule: 'required' | 'format' | 'range' | 'custom';
  parameters?: any;
  errorMessage: string;
}

export interface DataTransformation {
  sourceField: string;
  targetField: string;
  transformation: 'copy' | 'format' | 'calculate' | 'lookup' | 'custom';
  parameters?: any;
}

export interface IntegratedData {
  source: string;
  data: any;
  timestamp: Date;
  validated: boolean;
  transformed: boolean;
  errors: string[];
}

class DataIntegrationService {
  private supabase: SupabaseClient;
  private dataSources: Map<string, DataSource> = new Map();
  private validationRules: Map<string, DataValidationRule[]> = new Map();
  private transformations: Map<string, DataTransformation[]> = new Map();
  private integrationCache: Map<string, any> = new Map();
  private isProcessing: boolean = false;

  constructor() {
    this.supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL!,
      import.meta.env.VITE_SUPABASE_ANON_KEY!
    );

    this.initializeDataSources();
    this.initializeValidationRules();
    this.initializeTransformations();
  }

  private initializeDataSources(): void {
    // Bookings data source
    this.dataSources.set('bookings', {
      name: 'Bookings Database',
      type: 'database',
      connectionConfig: {
        table: 'bookings',
        fields: ['*']
      },
      lastSync: null,
      status: 'active',
      metrics: {
        recordsProcessed: 0,
        errors: 0,
        syncDuration: 0
      }
    });

    // User profiles data source
    this.dataSources.set('profiles', {
      name: 'User Profiles',
      type: 'database',
      connectionConfig: {
        table: 'profiles',
        fields: ['*']
      },
      lastSync: null,
      status: 'active',
      metrics: {
        recordsProcessed: 0,
        errors: 0,
        syncDuration: 0
      }
    });

    // Services data source
    this.dataSources.set('services', {
      name: 'Services',
      type: 'database',
      connectionConfig: {
        table: 'services',
        fields: ['*']
      },
      lastSync: null,
      status: 'active',
      metrics: {
        recordsProcessed: 0,
        errors: 0,
        syncDuration: 0
      }
    });

    // Analytics events data source
    this.dataSources.set('analytics_events', {
      name: 'Analytics Events',
      type: 'database',
      connectionConfig: {
        table: 'analytics_events',
        fields: ['*']
      },
      lastSync: null,
      status: 'active',
      metrics: {
        recordsProcessed: 0,
        errors: 0,
        syncDuration: 0
      }
    });

    // Revenue data source (aggregated)
    this.dataSources.set('revenue', {
      name: 'Revenue Analytics',
      type: 'api',
      connectionConfig: {
        endpoint: '/api/analytics/revenue',
        method: 'GET'
      },
      lastSync: null,
      status: 'active',
      metrics: {
        recordsProcessed: 0,
        errors: 0,
        syncDuration: 0
      }
    });
  }

  private initializeValidationRules(): void {
    // Booking validation rules
    this.validationRules.set('bookings', [
      {
        field: 'client_email',
        rule: 'required',
        errorMessage: 'Client email is required'
      },
      {
        field: 'client_email',
        rule: 'format',
        parameters: { type: 'email' },
        errorMessage: 'Invalid email format'
      },
      {
        field: 'total_amount',
        rule: 'required',
        errorMessage: 'Total amount is required'
      },
      {
        field: 'total_amount',
        rule: 'range',
        parameters: { min: 0 },
        errorMessage: 'Total amount must be positive'
      },
      {
        field: 'booking_date',
        rule: 'required',
        errorMessage: 'Booking date is required'
      },
      {
        field: 'status',
        rule: 'custom',
        parameters: { values: ['draft', 'pending', 'confirmed', 'cancelled', 'completed', 'no_show', 'rescheduled'] },
        errorMessage: 'Invalid booking status'
      }
    ]);

    // Profile validation rules
    this.validationRules.set('profiles', [
      {
        field: 'id',
        rule: 'required',
        errorMessage: 'Profile ID is required'
      },
      {
        field: 'email',
        rule: 'format',
        parameters: { type: 'email' },
        errorMessage: 'Invalid email format'
      }
    ]);

    // Service validation rules
    this.validationRules.set('services', [
      {
        field: 'title',
        rule: 'required',
        errorMessage: 'Service title is required'
      },
      {
        field: 'price',
        rule: 'required',
        errorMessage: 'Service price is required'
      },
      {
        field: 'price',
        rule: 'range',
        parameters: { min: 0 },
        errorMessage: 'Price must be positive'
      },
      {
        field: 'duration_minutes',
        rule: 'required',
        errorMessage: 'Duration is required'
      },
      {
        field: 'duration_minutes',
        rule: 'range',
        parameters: { min: 1 },
        errorMessage: 'Duration must be at least 1 minute'
      }
    ]);
  }

  private initializeTransformations(): void {
    // Booking transformations
    this.transformations.set('bookings', [
      {
        sourceField: 'booking_date',
        targetField: 'booking_date_formatted',
        transformation: 'format',
        parameters: { format: 'YYYY-MM-DD' }
      },
      {
        sourceField: 'total_amount',
        targetField: 'total_amount_eur',
        transformation: 'calculate',
        parameters: { formula: 'total_amount * 0.22' } // PLN to EUR conversion
      },
      {
        sourceField: 'created_at',
        targetField: 'booking_hour',
        transformation: 'format',
        parameters: { format: 'HH' }
      },
      {
        sourceField: 'created_at',
        targetField: 'booking_day_of_week',
        transformation: 'format',
        parameters: { format: 'dddd' }
      }
    ]);

    // Revenue transformations
    this.transformations.set('revenue', [
      {
        sourceField: 'total_revenue',
        targetField: 'revenue_per_booking',
        transformation: 'calculate',
        parameters: { formula: 'total_revenue / booking_count' }
      },
      {
        sourceField: 'total_revenue',
        targetField: 'revenue_growth_rate',
        transformation: 'calculate',
        parameters: { formula: '(total_revenue - previous_revenue) / previous_revenue * 100' }
      }
    ]);
  }

  public async syncDataSource(sourceName: string, options?: {
    force?: boolean;
    dateRange?: { start: Date; end: Date };
    filters?: Record<string, any>;
  }): Promise<IntegratedData[]> {
    const dataSource = this.dataSources.get(sourceName);
    if (!dataSource) {
      throw new Error(`Data source '${sourceName}' not found`);
    }

    const startTime = Date.now();
    dataSource.metrics.errors = 0;

    try {
      let rawData: any[] = [];

      switch (dataSource.type) {
        case 'database':
          rawData = await this.syncDatabaseSource(dataSource, options);
          break;
        case 'api':
          rawData = await this.syncApiSource(dataSource, options);
          break;
        default:
          throw new Error(`Unsupported data source type: ${dataSource.type}`);
      }

      // Validate data
      const validatedData = await this.validateData(sourceName, rawData);

      // Transform data
      const transformedData = await this.transformData(sourceName, validatedData);

      // Store integrated data
      const integratedData = await this.storeIntegratedData(sourceName, transformedData);

      // Update source metrics
      dataSource.metrics.recordsProcessed = integratedData.length;
      dataSource.metrics.syncDuration = Date.now() - startTime;
      dataSource.lastSync = new Date();
      dataSource.status = 'active';

      // Cache the data
      this.integrationCache.set(sourceName, integratedData);

      return integratedData;

    } catch (error) {
      dataSource.metrics.errors++;
      dataSource.status = 'error';
      throw error;
    }
  }

  private async syncDatabaseSource(dataSource: DataSource, options?: any): Promise<any[]> {
    const { table, fields } = dataSource.connectionConfig;
    let query = this.supabase.from(table).select(fields.join(', '));

    // Apply date range filter
    if (options?.dateRange) {
      query = query.gte('created_at', options.dateRange.start.toISOString())
                   .lte('created_at', options.dateRange.end.toISOString());
    }

    // Apply custom filters
    if (options?.filters) {
      Object.entries(options.filters).forEach(([field, value]) => {
        query = query.eq(field, value);
      });
    }

    // Apply incremental sync if not forced
    if (!options?.force && dataSource.lastSync) {
      query = query.gte('updated_at', dataSource.lastSync.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Database sync error: ${error.message}`);
    }

    return data || [];
  }

  private async syncApiSource(dataSource: DataSource, options?: any): Promise<any[]> {
    const { endpoint, method } = dataSource.connectionConfig;

    let url = endpoint;
    if (options?.dateRange) {
      const params = new URLSearchParams({
        start_date: options.dateRange.start.toISOString(),
        end_date: options.dateRange.end.toISOString()
      });
      url += `?${params.toString()}`;
    }

    const response = await fetch(url, { method });

    if (!response.ok) {
      throw new Error(`API sync error: ${response.statusText}`);
    }

    return await response.json();
  }

  private async validateData(sourceName: string, data: any[]): Promise<any[]> {
    const rules = this.validationRules.get(sourceName) || [];
    const validatedData: any[] = [];

    for (const record of data) {
      const errors: string[] = [];

      for (const rule of rules) {
        const value = record[rule.field];

        switch (rule.rule) {
          case 'required':
            if (!value || value === '' || value === null) {
              errors.push(`${rule.field}: ${rule.errorMessage}`);
            }
            break;

          case 'format':
            if (rule.parameters?.type === 'email' && value) {
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailRegex.test(value)) {
                errors.push(`${rule.field}: ${rule.errorMessage}`);
              }
            }
            break;

          case 'range':
            if (value !== undefined && value !== null) {
              const { min, max } = rule.parameters;
              if ((min !== undefined && value < min) || (max !== undefined && value > max)) {
                errors.push(`${rule.field}: ${rule.errorMessage}`);
              }
            }
            break;

          case 'custom':
            if (rule.parameters?.values && value) {
              if (!rule.parameters.values.includes(value)) {
                errors.push(`${rule.field}: ${rule.errorMessage}`);
              }
            }
            break;
        }
      }

      validatedData.push({
        ...record,
        _validated: errors.length === 0,
        _validationErrors: errors
      });
    }

    return validatedData;
  }

  private async transformData(sourceName: string, data: any[]): Promise<any[]> {
    const transformations = this.transformations.get(sourceName) || [];
    const transformedData: any[] = [];

    for (const record of data) {
      const transformedRecord = { ...record };

      for (const transformation of transformations) {
        const sourceValue = record[transformation.sourceField];

        switch (transformation.transformation) {
          case 'copy':
            transformedRecord[transformation.targetField] = sourceValue;
            break;

          case 'format':
            if (sourceValue) {
              if (transformation.parameters?.format === 'YYYY-MM-DD') {
                transformedRecord[transformation.targetField] = new Date(sourceValue).toISOString().split('T')[0];
              } else if (transformation.parameters?.format === 'HH') {
                transformedRecord[transformation.targetField] = new Date(sourceValue).getHours().toString().padStart(2, '0');
              } else if (transformation.parameters?.format === 'dddd') {
                transformedRecord[transformation.targetField] = new Date(sourceValue).toLocaleDateString('en-US', { weekday: 'long' });
              }
            }
            break;

          case 'calculate':
            if (transformation.parameters?.formula) {
              try {
                // Simple formula evaluation (in production, use a proper expression parser)
                const formula = transformation.parameters.formula
                  .replace(/total_amount/g, record.total_amount || 0)
                  .replace(/previous_revenue/g, record.previous_revenue || 0)
                  .replace(/booking_count/g, record.booking_count || 1);

                if (formula.includes('* 0.22')) {
                  transformedRecord[transformation.targetField] = (record.total_amount || 0) * 0.22;
                } else if (formula.includes('/ booking_count')) {
                  transformedRecord[transformation.targetField] = (record.total_revenue || 0) / (record.booking_count || 1);
                } else if (formula.includes('/ previous_revenue')) {
                  const previous = record.previous_revenue || 1;
                  transformedRecord[transformation.targetField] = ((record.total_revenue || 0) - previous) / previous * 100;
                }
              } catch (error) {
                console.error(`Formula calculation error: ${error}`);
              }
            }
            break;
        }
      }

      transformedRecord._transformed = true;
      transformedData.push(transformedRecord);
    }

    return transformedData;
  }

  private async storeIntegratedData(sourceName: string, data: any[]): Promise<IntegratedData[]> {
    const integratedData: IntegratedData[] = [];

    for (const record of data) {
      const integrated: IntegratedData = {
        source: sourceName,
        data: record,
        timestamp: new Date(),
        validated: record._validated !== false,
        transformed: record._transformed === true,
        errors: record._validationErrors || []
      };

      // Store specific data based on source
      switch (sourceName) {
        case 'bookings':
          await this.storeBookingAnalytics(integrated);
          break;
        case 'revenue':
          await this.storeRevenueAnalytics(integrated);
          break;
      }

      integratedData.push(integrated);
    }

    return integratedData;
  }

  private async storeBookingAnalytics(integrated: IntegratedData): Promise<void> {
    const record = integrated.data;

    try {
      // Update revenue analytics
      await this.supabase
        .from('revenue_analytics')
        .upsert({
          date: record.booking_date,
          service_type: record.service_type || 'unknown',
          total_revenue: record.total_amount,
          booking_count: 1,
          unique_customers: record.user_id ? 1 : 0,
          average_booking_value: record.total_amount,
          revenue_source: 'booking',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'date,service_type,revenue_source',
          ignoreDuplicates: false
        });

      // Track booking journey
      if (record.user_id) {
        await this.supabase
          .from('customer_behaviors')
          .insert({
            user_id: record.user_id,
            behavior_type: 'booking_completed',
            behavior_data: {
              service_id: record.service_id,
              service_type: record.service_type,
              amount: record.total_amount,
              status: record.status
            },
            context: {
              source: 'data_integration',
              timestamp: record.created_at
            },
            timestamp: new Date()
          });
      }

    } catch (error) {
      console.error('Failed to store booking analytics:', error);
      integrated.errors.push(`Failed to store analytics: ${error}`);
    }
  }

  private async storeRevenueAnalytics(integrated: IntegratedData): Promise<void> {
    const record = integrated.data;

    try {
      await this.supabase
        .from('revenue_analytics')
        .upsert({
          date: record.date,
          service_type: record.service_type,
          total_revenue: record.total_revenue,
          booking_count: record.booking_count,
          unique_customers: record.unique_customers,
          average_booking_value: record.average_booking_value,
          forecast_revenue: record.forecast_revenue,
          forecast_accuracy: record.forecast_accuracy,
          revenue_source: record.revenue_source || 'aggregated',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'date,service_type,revenue_source',
          ignoreDuplicates: false
        });

    } catch (error) {
      console.error('Failed to store revenue analytics:', error);
      integrated.errors.push(`Failed to store revenue analytics: ${error}`);
    }
  }

  public async syncAllSources(options?: {
    force?: boolean;
    dateRange?: { start: Date; end: Date };
  }): Promise<Record<string, IntegratedData[]>> {
    if (this.isProcessing) {
      throw new Error('Sync already in progress');
    }

    this.isProcessing = true;

    try {
      const results: Record<string, IntegratedData[]> = {};

      for (const [sourceName] of this.dataSources) {
        try {
          results[sourceName] = await this.syncDataSource(sourceName, options);
        } catch (error) {
          console.error(`Failed to sync ${sourceName}:`, error);
          results[sourceName] = [];
        }
      }

      return results;
    } finally {
      this.isProcessing = false;
    }
  }

  public getCachedData(sourceName: string): any[] | null {
    return this.integrationCache.get(sourceName) || null;
  }

  public getDataSources(): DataSource[] {
    return Array.from(this.dataSources.values());
  }

  public getDataSourceMetrics(sourceName: string): DataSource['metrics'] | null {
    const source = this.dataSources.get(sourceName);
    return source ? source.metrics : null;
  }

  public async validateDataIntegrity(): Promise<{
    source: string;
    totalRecords: number;
    validRecords: number;
    invalidRecords: number;
    errorRate: number;
    commonErrors: Array<{ error: string; count: number }>;
  }[]> {
    const results: any[] = [];

    for (const [sourceName, source] of this.dataSources) {
      try {
        const data = await this.syncDataSource(sourceName);

        const totalRecords = data.length;
        const validRecords = data.filter(record => record.validated).length;
        const invalidRecords = totalRecords - validRecords;
        const errorRate = totalRecords > 0 ? (invalidRecords / totalRecords) * 100 : 0;

        // Aggregate common errors
        const errorCounts = new Map<string, number>();
        data.forEach(record => {
          if (record.errors) {
            record.errors.forEach((error: string) => {
              errorCounts.set(error, (errorCounts.get(error) || 0) + 1);
            });
          }
        });

        const commonErrors = Array.from(errorCounts.entries())
          .map(([error, count]) => ({ error, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        results.push({
          source: sourceName,
          totalRecords,
          validRecords,
          invalidRecords,
          errorRate,
          commonErrors
        });

      } catch (error) {
        console.error(`Failed to validate ${sourceName}:`, error);
        results.push({
          source: sourceName,
          totalRecords: 0,
          validRecords: 0,
          invalidRecords: 0,
          errorRate: 100,
          commonErrors: [{ error: `Sync failed: ${error}`, count: 1 }]
        });
      }
    }

    return results;
  }

  public async generateDataQualityReport(): Promise<{
    overall: {
      totalSources: number;
      activeSources: number;
      errorSources: number;
      totalRecords: number;
      overallQuality: number;
    };
    sources: Array<{
      name: string;
      status: string;
      lastSync: Date | null;
      recordsProcessed: number;
      errors: number;
      quality: number;
    }>;
  }> {
    const sources = this.getDataSources();
    const activeSources = sources.filter(s => s.status === 'active').length;
    const errorSources = sources.filter(s => s.status === 'error').length;
    const totalRecords = sources.reduce((sum, s) => sum + s.metrics.recordsProcessed, 0);
    const totalErrors = sources.reduce((sum, s) => sum + s.metrics.errors, 0);

    const overallQuality = totalRecords > 0 ? ((totalRecords - totalErrors) / totalRecords) * 100 : 0;

    const sourceDetails = sources.map(source => ({
      name: source.name,
      status: source.status,
      lastSync: source.lastSync,
      recordsProcessed: source.metrics.recordsProcessed,
      errors: source.metrics.errors,
      quality: source.metrics.recordsProcessed > 0
        ? ((source.metrics.recordsProcessed - source.metrics.errors) / source.metrics.recordsProcessed) * 100
        : 0
    }));

    return {
      overall: {
        totalSources: sources.length,
        activeSources,
        errorSources,
        totalRecords,
        overallQuality
      },
      sources: sourceDetails
    };
  }
}

// Create singleton instance
export const dataIntegration = new DataIntegrationService();

// Export convenience functions
export const syncBookings = (options?: any) => dataIntegration.syncDataSource('bookings', options);
export const syncProfiles = (options?: any) => dataIntegration.syncDataSource('profiles', options);
export const syncServices = (options?: any) => dataIntegration.syncDataSource('services', options);
export const syncRevenue = (options?: any) => dataIntegration.syncDataSource('revenue', options);
export const syncAllData = (options?: any) => dataIntegration.syncAllSources(options);

export default dataIntegration;