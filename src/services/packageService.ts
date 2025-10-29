import { z } from 'zod';

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

import { BaseService } from './api/base.service';

// Types for packages
export interface ServicePackage {
  id: string;
  name: string;
  slug: string;
  description?: string;
  service_id: string;
  session_count: number;
  original_price?: number;
  package_price: number;
  savings_amount?: number;
  savings_percentage?: number;
  validity_days: number;
  is_active: boolean;
  is_featured: boolean;
  display_order: number;
  features?: Record<string, any>;
  benefits?: string[];
  inclusions?: Record<string, any>;
  image_url?: string;
  badge_text?: string;
  max_purchases_per_client?: number;
  valid_from?: string;
  valid_until?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;

  // Joined fields from services
  service?: {
    id: string;
    title: string;
    slug: string;
    service_type: 'beauty' | 'fitness' | 'lifestyle';
    duration_minutes?: number;
    image_url?: string;
  };
}

export interface ClientPackage {
  id: string;
  client_id: string;
  package_id: string;
  purchase_date: string;
  expiry_date: string;
  total_sessions: number;
  sessions_used: number;
  sessions_remaining: number;
  payment_id?: string;
  amount_paid: number;
  currency: string;
  status: 'active' | 'expired' | 'depleted' | 'cancelled' | 'suspended';
  auto_renew: boolean;
  can_be_gifted: boolean;
  transfer_count: number;
  max_transfers: number;
  purchase_notes?: string;
  admin_notes?: string;
  gift_message?: string;
  gift_from?: string;
  created_at: string;
  updated_at: string;

  // Joined fields
  package?: ServicePackage;
  service?: {
    id: string;
    title: string;
    service_type: 'beauty' | 'fitness' | 'lifestyle';
  };
}

export interface PackageSession {
  id: string;
  client_package_id: string;
  booking_id?: string;
  session_number: number;
  used_at?: string;
  scheduled_for?: string;
  status: 'available' | 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  feedback_rating?: number;
  feedback_text?: string;
  actual_service_id?: string;
  price_difference?: number;
  created_at: string;
  updated_at: string;
}

export interface PackagePurchaseData {
  client_id: string;
  package_id: string;
  payment_method: 'stripe' | 'cash' | 'bank_transfer';
  gift_to?: string;
  gift_message?: string;
  purchase_notes?: string;
}

export interface PackageAnalytics {
  total_packages_sold: number;
  total_revenue: number;
  average_sessions_per_package: number;
  most_popular_service?: string;
  packages_expiring_soon: number;
  unused_sessions: number;
  client_retention_rate: number;
}

// Validation schemas
const CreateServicePackageSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  description: z.string().optional(),
  service_id: z.string().uuid(),
  session_count: z.number().int().min(1),
  original_price: z.number().positive().optional(),
  package_price: z.number().positive(),
  validity_days: z.number().int().min(1).default(365),
  is_featured: z.boolean().default(false),
  display_order: z.number().int().default(0),
  features: z.record(z.any()).optional(),
  benefits: z.array(z.string()).optional(),
  inclusions: z.record(z.any()).optional(),
  image_url: z.string().url().optional(),
  badge_text: z.string().max(50).optional(),
  max_purchases_per_client: z.number().int().positive().optional(),
  valid_from: z.string().datetime().optional(),
  valid_until: z.string().datetime().optional(),
});

const PackagePurchaseSchema = z.object({
  client_id: z.string().uuid(),
  package_id: z.string().uuid(),
  payment_method: z.enum(['stripe', 'cash', 'bank_transfer']),
  gift_to: z.string().uuid().optional(),
  gift_message: z.string().max(500).optional(),
  purchase_notes: z.string().max(1000).optional(),
});

class PackageService extends BaseService {
  private readonly tableName = 'service_packages';
  private readonly clientPackagesTable = 'client_packages';
  private readonly packageSessionsTable = 'package_sessions';

  // Get all active service packages with service details
  async getServicePackages(options: {
    category?: 'beauty' | 'fitness' | 'lifestyle' | 'all';
    is_featured?: boolean;
    limit?: number;
    offset?: number;
    sort_by?: 'name' | 'price' | 'savings' | 'popularity';
    sort_order?: 'asc' | 'desc';
  } = {}): Promise<ServicePackage[]> {
    const {
      category = 'all',
      is_featured,
      limit = 50,
      offset = 0,
      sort_by = 'display_order',
      sort_order = 'asc'
    } = options;

    try {
      let query = supabase
        .from(this.tableName)
        .select(`
          *,
          service!inner (
            id,
            title,
            slug,
            service_type,
            duration_minutes,
            image_url
          )
        `)
        .eq('is_active', true);

      // Apply category filter
      if (category !== 'all') {
        query = query.eq('service.service_type', category);
      }

      // Apply featured filter
      if (is_featured !== undefined) {
        query = query.eq('is_featured', is_featured);
      }

      // Apply date validity filter
      const now = new Date().toISOString();
      query = query.or(`valid_from.is.null,valid_from.lte.${now},valid_until.is.null,valid_until.gte.${now}`);

      // Apply sorting
      const sortColumn = sort_by === 'price' ? 'package_price' : sort_by;
      query = query.order(sortColumn as any, { ascending: sort_order === 'asc' });

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching service packages:', error);
        throw new Error(`Failed to fetch packages: ${error.message}`);
      }

      return data as ServicePackage[] || [];
    } catch (error) {
      logger.error('PackageService.getServicePackages error:', error);
      throw error;
    }
  }

  // Get a single service package by slug or ID
  async getServicePackage(idOrSlug: string): Promise<ServicePackage | null> {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idOrSlug);

      const { data, error } = await supabase
        .from(this.tableName)
        .select(`
          *,
          service!inner (
            id,
            title,
            slug,
            service_type,
            duration_minutes,
            image_url,
            description
          )
        `)
        .eq(isUuid ? 'id' : 'slug', idOrSlug)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        logger.error('Error fetching service package:', error);
        throw new Error(`Failed to fetch package: ${error.message}`);
      }

      return data as ServicePackage;
    } catch (error) {
      logger.error('PackageService.getServicePackage error:', error);
      throw error;
    }
  }

  // Get client packages
  async getClientPackages(clientId: string, options: {
    status?: 'active' | 'expired' | 'depleted' | 'all';
    include_sessions?: boolean;
  } = {}): Promise<ClientPackage[]> {
    const { status = 'active', include_sessions = false } = options;

    try {
      let query = supabase
        .from(this.clientPackagesTable)
        .select(`
          *,
          package!inner (
            *,
            service!inner (
              id,
              title,
              service_type
            )
          )
          ${include_sessions ? `,
          package_sessions (
            id,
            session_number,
            status,
            used_at,
            scheduled_for,
            notes
          )` : ''}
        `)
        .eq('client_id', clientId);

      if (status !== 'all') {
        query = query.eq('status', status);
      }

      query = query.order('purchase_date', { ascending: false });

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching client packages:', error);
        throw new Error(`Failed to fetch client packages: ${error.message}`);
      }

      return data as ClientPackage[] || [];
    } catch (error) {
      logger.error('PackageService.getClientPackages error:', error);
      throw error;
    }
  }

  // Purchase a package
  async purchasePackage(data: PackagePurchaseData, paymentId?: string): Promise<ClientPackage> {
    try {
      const validatedData = PackagePurchaseSchema.parse(data);

      // First, get the package details
      const packageDetails = await this.getServicePackage(validatedData.package_id);
      if (!packageDetails) {
        throw new Error('Package not found');
      }

      // Check if package is still valid
      if (packageDetails.valid_from && new Date(packageDetails.valid_from) > new Date()) {
        throw new Error('Package is not yet available for purchase');
      }

      if (packageDetails.valid_until && new Date(packageDetails.valid_until) < new Date()) {
        throw new Error('Package is no longer available for purchase');
      }

      // Check max purchases per client
      if (packageDetails.max_purchases_per_client) {
        const existingPackages = await this.getClientPackages(validatedData.client_id, { status: 'active' });
        const packagesOfSameType = existingPackages.filter(cp => cp.package_id === validatedData.package_id);

        if (packagesOfSameType.length >= packageDetails.max_purchases_per_client) {
          throw new Error(`Maximum purchases per client exceeded for this package (${packageDetails.max_purchases_per_client})`);
        }
      }

      // Calculate final price
      const finalPrice = packageDetails.package_price;

      // Call the database function to create the package
      const { data: result, error } = await supabase.rpc('purchase_package', {
        p_client_id: validatedData.client_id,
        p_package_id: validatedData.package_id,
        p_payment_id: paymentId,
        p_amount_paid: finalPrice,
        p_currency: 'pln',
        p_gift_to: validatedData.gift_to || null,
        p_gift_message: validatedData.gift_message || null,
        p_purchase_notes: validatedData.purchase_notes || null
      });

      if (error) {
        logger.error('Error purchasing package:', error);
        throw new Error(`Failed to purchase package: ${error.message}`);
      }

      // Fetch the created client package
      const clientPackage = await supabase
        .from(this.clientPackagesTable)
        .select(`
          *,
          package!inner (
            *,
            service!inner (
              id,
              title,
              service_type
            )
          )
        `)
        .eq('id', result)
        .single();

      if (clientPackage.error) {
        throw new Error(`Failed to fetch created package: ${clientPackage.error.message}`);
      }

      logger.info(`Package purchased: ${validatedData.package_id} by client: ${validatedData.client_id}`);

      return clientPackage.data as ClientPackage;
    } catch (error) {
      logger.error('PackageService.purchasePackage error:', error);
      throw error;
    }
  }

  // Use a package session
  async usePackageSession(clientId: string, bookingId: string, notes?: string): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('use_package_session', {
        p_client_id: clientId,
        p_booking_id: bookingId,
        p_notes: notes || null
      });

      if (error) {
        logger.error('Error using package session:', error);
        throw new Error(`Failed to use package session: ${error.message}`);
      }

      logger.info(`Package session used: ${data} for booking: ${bookingId}`);
      return data;
    } catch (error) {
      logger.error('PackageService.usePackageSession error:', error);
      throw error;
    }
  }

  // Check package balance
  async checkPackageBalance(clientId: string, serviceId?: string): Promise<ServicePackage['balance'][]> {
    try {
      const { data, error } = await supabase.rpc('check_package_balance', {
        p_client_id: clientId,
        p_service_id: serviceId || null
      });

      if (error) {
        logger.error('Error checking package balance:', error);
        throw new Error(`Failed to check package balance: ${error.message}`);
      }

      return data as ServicePackage['balance'][] || [];
    } catch (error) {
      logger.error('PackageService.checkPackageBalance error:', error);
      throw error;
    }
  }

  // Get package analytics (for admin)
  async getPackageAnalytics(startDate?: Date, endDate?: Date): Promise<PackageAnalytics> {
    try {
      const { data, error } = await supabase.rpc('get_package_statistics', {
        p_start_date: startDate?.toISOString().split('T')[0] || null,
        p_end_date: endDate?.toISOString().split('T')[0] || null
      });

      if (error) {
        logger.error('Error fetching package analytics:', error);
        throw new Error(`Failed to fetch package analytics: ${error.message}`);
      }

      return data?.[0] as PackageAnalytics || {
        total_packages_sold: 0,
        total_revenue: 0,
        average_sessions_per_package: 0,
        packages_expiring_soon: 0,
        unused_sessions: 0,
        client_retention_rate: 0
      };
    } catch (error) {
      logger.error('PackageService.getPackageAnalytics error:', error);
      throw error;
    }
  }

  // Transfer a package
  async transferPackage(packageId: string, fromClientId: string, toClientId: string, notes?: string): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('transfer_package', {
        p_client_package_id: packageId,
        p_from_client_id: fromClientId,
        p_to_client_id: toClientId,
        p_transfer_notes: notes || null
      });

      if (error) {
        logger.error('Error transferring package:', error);
        throw new Error(`Failed to transfer package: ${error.message}`);
      }

      logger.info(`Package transferred: ${packageId} from ${fromClientId} to ${toClientId}`);
      return true;
    } catch (error) {
      logger.error('PackageService.transferPackage error:', error);
      throw error;
    }
  }

  // Schedule a package session
  async schedulePackageSession(clientId: string, sessionId: string, scheduledFor: Date, notes?: string): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('schedule_package_session', {
        p_client_id: clientId,
        p_session_id: sessionId,
        p_scheduled_for: scheduledFor.toISOString(),
        p_notes: notes || null
      });

      if (error) {
        logger.error('Error scheduling package session:', error);
        throw new Error(`Failed to schedule package session: ${error.message}`);
      }

      logger.info(`Package session scheduled: ${sessionId} for ${scheduledFor.toISOString()}`);
      return true;
    } catch (error) {
      logger.error('PackageService.schedulePackageSession error:', error);
      throw error;
    }
  }

  // Get package sessions for a client package
  async getPackageSessions(clientPackageId: string): Promise<PackageSession[]> {
    try {
      const { data, error } = await supabase
        .from(this.packageSessionsTable)
        .select('*')
        .eq('client_package_id', clientPackageId)
        .order('session_number', { ascending: true });

      if (error) {
        logger.error('Error fetching package sessions:', error);
        throw new Error(`Failed to fetch package sessions: ${error.message}`);
      }

      return data as PackageSession[] || [];
    } catch (error) {
      logger.error('PackageService.getPackageSessions error:', error);
      throw error;
    }
  }

  // Create a new service package (admin only)
  async createServicePackage(data: z.infer<typeof CreateServicePackageSchema>): Promise<ServicePackage> {
    try {
      const validatedData = CreateServicePackageSchema.parse(data);

      const { data: result, error } = await supabase
        .from(this.tableName)
        .insert(validatedData)
        .select(`
          *,
          service!inner (
            id,
            title,
            slug,
            service_type,
            duration_minutes,
            image_url
          )
        `)
        .single();

      if (error) {
        logger.error('Error creating service package:', error);
        throw new Error(`Failed to create service package: ${error.message}`);
      }

      logger.info(`Service package created: ${result.id}`);
      return result as ServicePackage;
    } catch (error) {
      logger.error('PackageService.createServicePackage error:', error);
      throw error;
    }
  }

  // Update a service package (admin only)
  async updateServicePackage(id: string, data: Partial<ServicePackage>): Promise<ServicePackage> {
    try {
      const { data: result, error } = await supabase
        .from(this.tableName)
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select(`
          *,
          service!inner (
            id,
            title,
            slug,
            service_type,
            duration_minutes,
            image_url
          )
        `)
        .single();

      if (error) {
        logger.error('Error updating service package:', error);
        throw new Error(`Failed to update service package: ${error.message}`);
      }

      logger.info(`Service package updated: ${id}`);
      return result as ServicePackage;
    } catch (error) {
      logger.error('PackageService.updateServicePackage error:', error);
      throw error;
    }
  }

  // Delete a service package (admin only)
  async deleteServicePackage(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        logger.error('Error deleting service package:', error);
        throw new Error(`Failed to delete service package: ${error.message}`);
      }

      logger.info(`Service package deleted: ${id}`);
    } catch (error) {
      logger.error('PackageService.deleteServicePackage error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const packageService = new PackageService();

// Export types and schema for use in components
export type { CreateServicePackageSchema };
export { PackagePurchaseSchema };