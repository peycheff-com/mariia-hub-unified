/**
 * Supabase Integration
 * Database client for the API ecosystem
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { apiConfig } from '../config';
import { logger } from '../utils/logger';
import { DatabaseError, ExternalServiceError } from '../middleware/errorHandler';

export class SupabaseService {
  private client: SupabaseClient<Database>;
  private static instance: SupabaseService;

  constructor() {
    if (!apiConfig.supabaseUrl || !apiConfig.supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    this.client = createClient<Database>(
      apiConfig.supabaseUrl,
      apiConfig.supabaseServiceKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        db: {
          schema: 'public',
        },
      }
    );

    this.initializeConnection();
  }

  public static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService();
    }
    return SupabaseService.instance;
  }

  private initializeConnection(): void {
    // Test connection
    this.client
      .from('services')
      .select('count', { count: 'exact', head: true })
      .then(({ count, error }) => {
        if (error) {
          logger.error('Supabase connection failed', { error: error.message });
          throw new ExternalServiceError('Supabase', 'Connection failed');
        } else {
          logger.info('Supabase connection established', { count });
        }
      })
      .catch((error) => {
        logger.error('Supabase initialization failed', { error });
      });
  }

  public getClient(): SupabaseClient<Database> {
    return this.client;
  }

  // Generic query methods
  public async findById<T extends keyof Database['public']['Tables']>(
    table: T,
    id: string,
    columns: string = '*'
  ): Promise<Database['public']['Tables'][T]['Row'] | null> {
    try {
      const { data, error } = await this.client
        .from(table)
        .select(columns)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw new DatabaseError(`Failed to find ${table} by ID`, error);
      }

      return data;
    } catch (error) {
      logger.error('Database findById error', { table, id, error });
      throw error instanceof DatabaseError ? error : new DatabaseError('Database query failed');
    }
  }

  public async findMany<T extends keyof Database['public']['Tables']>(
    table: T,
    filters: Record<string, any> = {},
    options: {
      columns?: string;
      orderBy?: { column: string; ascending?: boolean };
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<Database['public']['Tables'][T]['Row'][]> {
    try {
      let query = this.client
        .from(table)
        .select(options.columns || '*');

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      // Apply ordering
      if (options.orderBy) {
        query = query.order(options.orderBy.column, {
          ascending: options.orderBy.ascending ?? true,
        });
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        throw new DatabaseError(`Failed to find many ${table}`, error);
      }

      return data || [];
    } catch (error) {
      logger.error('Database findMany error', { table, filters, options, error });
      throw error instanceof DatabaseError ? error : new DatabaseError('Database query failed');
    }
  }

  public async create<T extends keyof Database['public']['Tables']>(
    table: T,
    data: Database['public']['Tables'][T]['Insert']
  ): Promise<Database['public']['Tables'][T]['Row']> {
    try {
      const { data: result, error } = await this.client
        .from(table)
        .insert(data)
        .select()
        .single();

      if (error) {
        throw new DatabaseError(`Failed to create ${table}`, error);
      }

      return result;
    } catch (error) {
      logger.error('Database create error', { table, data, error });
      throw error instanceof DatabaseError ? error : new DatabaseError('Database insert failed');
    }
  }

  public async update<T extends keyof Database['public']['Tables']>(
    table: T,
    id: string,
    data: Database['public']['Tables'][T]['Update']
  ): Promise<Database['public']['Tables'][T]['Row']> {
    try {
      const { data: result, error } = await this.client
        .from(table)
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new DatabaseError(`${table} not found`, { id });
        }
        throw new DatabaseError(`Failed to update ${table}`, error);
      }

      return result;
    } catch (error) {
      logger.error('Database update error', { table, id, data, error });
      throw error instanceof DatabaseError ? error : new DatabaseError('Database update failed');
    }
  }

  public async delete<T extends keyof Database['public']['Tables']>(
    table: T,
    id: string
  ): Promise<void> {
    try {
      const { error } = await this.client.from(table).delete().eq('id', id);

      if (error) {
        throw new DatabaseError(`Failed to delete ${table}`, error);
      }
    } catch (error) {
      logger.error('Database delete error', { table, id, error });
      throw error instanceof DatabaseError ? error : new DatabaseError('Database delete failed');
    }
  }

  public async count<T extends keyof Database['public']['Tables']>(
    table: T,
    filters: Record<string, any> = {}
  ): Promise<number> {
    try {
      let query = this.client.from(table).select('*', { count: 'exact', head: true });

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      const { count, error } = await query;

      if (error) {
        throw new DatabaseError(`Failed to count ${table}`, error);
      }

      return count || 0;
    } catch (error) {
      logger.error('Database count error', { table, filters, error });
      throw error instanceof DatabaseError ? error : new DatabaseError('Database count failed');
    }
  }

  // Business logic specific methods
  public async findAvailableSlots(
    serviceId: string,
    date: string
  ): Promise<Database['public']['Tables']['availability_slots']['Row'][]> {
    try {
      const { data, error } = await this.client
        .from('availability_slots')
        .select('*')
        .eq('service_id', serviceId)
        .eq('date', date)
        .eq('is_available', true)
        .gt('current_bookings', 0) // Has available capacity
        .order('start_time', { ascending: true });

      if (error) {
        throw new DatabaseError('Failed to find available slots', error);
      }

      return data || [];
    } catch (error) {
      logger.error('Find available slots error', { serviceId, date, error });
      throw error instanceof DatabaseError ? error : new DatabaseError('Failed to find available slots');
    }
  }

  public async createBookingHold(
    serviceId: string,
    date: string,
    timeSlot: string,
    sessionId: string,
    userId?: string
  ): Promise<Database['public']['Tables']['holds']['Row']> {
    try {
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      const { data, error } = await this.client
        .from('holds')
        .insert({
          service_id: serviceId,
          date,
          time_slot: timeSlot,
          session_id: sessionId,
          user_id: userId,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new DatabaseError('Failed to create booking hold', error);
      }

      return data;
    } catch (error) {
      logger.error('Create booking hold error', { serviceId, date, timeSlot, sessionId, error });
      throw error instanceof DatabaseError ? error : new DatabaseError('Failed to create booking hold');
    }
  }

  public async releaseHold(sessionId: string): Promise<void> {
    try {
      const { error } = await this.client
        .from('holds')
        .delete()
        .eq('session_id', sessionId);

      if (error) {
        throw new DatabaseError('Failed to release hold', error);
      }
    } catch (error) {
      logger.error('Release hold error', { sessionId, error });
      throw error instanceof DatabaseError ? error : new DatabaseError('Failed to release hold');
    }
  }

  public async cleanupExpiredHolds(): Promise<number> {
    try {
      const { data, error } = await this.client
        .from('holds')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select('id');

      if (error) {
        throw new DatabaseError('Failed to cleanup expired holds', error);
      }

      return data?.length || 0;
    } catch (error) {
      logger.error('Cleanup expired holds error', { error });
      throw error instanceof DatabaseError ? error : new DatabaseError('Failed to cleanup expired holds');
    }
  }

  public async getUserBookings(
    userId: string,
    status?: Database['public']['Enums']['booking_status']
  ): Promise<Database['public']['Tables']['bookings']['Row'][]> {
    try {
      let query = this.client
        .from('bookings')
        .select(`
          *,
          services (
            id,
            title,
            service_type,
            duration_minutes,
            price,
            currency
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        throw new DatabaseError('Failed to get user bookings', error);
      }

      return data || [];
    } catch (error) {
      logger.error('Get user bookings error', { userId, status, error });
      throw error instanceof DatabaseError ? error : new DatabaseError('Failed to get user bookings');
    }
  }

  public async getServiceWithContent(
    serviceId: string
  ): Promise<(Database['public']['Tables']['services']['Row'] & {
    content: Database['public']['Tables']['service_content']['Row'][];
    gallery: Database['public']['Tables']['service_gallery']['Row'][];
  }) | null> {
    try {
      const { data, error } = await this.client
        .from('services')
        .select(`
          *,
          service_content (*),
          service_gallery (*)
        `)
        .eq('id', serviceId)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new DatabaseError('Failed to get service with content', error);
      }

      return data;
    } catch (error) {
      logger.error('Get service with content error', { serviceId, error });
      throw error instanceof DatabaseError ? error : new DatabaseError('Failed to get service with content');
    }
  }

  public async getAnalyticsData(
    startDate: string,
    endDate: string,
    filters: {
      serviceType?: Database['public']['Enums']['service_type'];
      status?: Database['public']['Enums']['booking_status'];
    } = {}
  ): Promise<any> {
    try {
      let query = this.client
        .from('bookings')
        .select(`
          *,
          services (
            service_type,
            price,
            currency
          )
        `)
        .gte('booking_date', startDate)
        .lte('booking_date', endDate);

      if (filters.serviceType) {
        query = query.eq('services.service_type', filters.serviceType);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;

      if (error) {
        throw new DatabaseError('Failed to get analytics data', error);
      }

      return data || [];
    } catch (error) {
      logger.error('Get analytics data error', { startDate, endDate, filters, error });
      throw error instanceof DatabaseError ? error : new DatabaseError('Failed to get analytics data');
    }
  }
}

// Export singleton instance
export const supabase = SupabaseService.getInstance().getClient();
export const supabaseService = SupabaseService.getInstance();

export default supabaseService;