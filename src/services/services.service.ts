import { z } from 'zod';

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

import { BaseService } from './api/base.service';

// Types
export interface Service {
  id: string;
  title: Record<string, string>;
  description: Record<string, string>;
  price_from: number;
  price_to?: number;
  duration_minutes: number;
  category: string;
  service_type: 'beauty' | 'fitness' | 'lifestyle';
  image_url?: string;
  slug: string;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  location_id?: string;
  practitioner_id?: string;
  max_participants?: number;
  requirements?: Record<string, any>;
  inclusions?: string[];
  exclusions?: string[];
  preparation?: Record<string, string>;
  aftercare?: Record<string, string>;
  faq?: Record<string, any>[];
  gallery?: ServiceGalleryItem[];
}

export interface ServiceGalleryItem {
  id: string;
  service_id: string;
  image_url: string;
  caption?: Record<string, string>;
  sort_order: number;
  is_before_after: boolean;
  tags?: string[];
}

export interface ServiceContent {
  id: string;
  service_id: string;
  content_type: 'preparation' | 'aftercare' | 'expectations' | 'contraindications' | 'benefits';
  title: Record<string, string>;
  content: Record<string, string>;
  sort_order: number;
}

export interface ServiceCategory {
  id: string;
  name: Record<string, string>;
  description: Record<string, string>;
  icon: string;
  service_type: 'beauty' | 'fitness' | 'lifestyle';
  sort_order: number;
  is_active: boolean;
}

// Validation schemas
const ServiceFiltersSchema = z.object({
  service_type: z.enum(['beauty', 'fitness', 'lifestyle']).optional(),
  category: z.string().optional(),
  price_min: z.number().optional(),
  price_max: z.number().optional(),
  duration_min: z.number().optional(),
  duration_max: z.number().optional(),
  featured: z.boolean().optional(),
  location_id: z.string().optional(),
  practitioner_id: z.string().optional(),
  search: z.string().optional(),
});

export type ServiceFilters = z.infer<typeof ServiceFiltersSchema>;

export class ServicesService extends BaseService {
  private static instance: ServicesService;

  static getInstance(): ServicesService {
    if (!ServicesService.instance) {
      ServicesService.instance = new ServicesService();
    }
    return ServicesService.instance;
  }

  // Get all services with optional filtering
  async getServices(filters?: ServiceFilters): Promise<{ data: Service[]; error: any }> {
    try {
      const validatedFilters = filters ? ServiceFiltersSchema.parse(filters) : {};

      let query = supabase
        .from('services')
        .select(`
          *,
          service_gallery(
            id,
            image_url,
            caption,
            sort_order,
            is_before_after,
            tags
          )
        `)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      // Apply filters
      if (validatedFilters.service_type) {
        query = query.eq('service_type', validatedFilters.service_type);
      }
      if (validatedFilters.category) {
        query = query.eq('category', validatedFilters.category);
      }
      if (validatedFilters.featured !== undefined) {
        query = query.eq('is_featured', validatedFilters.featured);
      }
      if (validatedFilters.location_id) {
        query = query.eq('location_id', validatedFilters.location_id);
      }
      if (validatedFilters.practitioner_id) {
        query = query.eq('practitioner_id', validatedFilters.practitioner_id);
      }
      if (validatedFilters.price_min !== undefined) {
        query = query.gte('price_from', validatedFilters.price_min);
      }
      if (validatedFilters.price_max !== undefined) {
        query = query.lte('price_from', validatedFilters.price_max);
      }
      if (validatedFilters.duration_min !== undefined) {
        query = query.gte('duration_minutes', validatedFilters.duration_min);
      }
      if (validatedFilters.duration_max !== undefined) {
        query = query.lte('duration_minutes', validatedFilters.duration_max);
      }
      if (validatedFilters.search) {
        query = query.or(`
          title.ilike.%${validatedFilters.search}%,
          description.ilike.%${validatedFilters.search}%
        `);
      }

      const { data, error } = await query;

      if (error) {
        return { data: [], error: this.handleError(error) };
      }

      // Transform data to match interface
      const transformedData: Service[] = (data || []).map(item => ({
        ...item,
        gallery: item.service_gallery || []
      }));

      return { data: transformedData, error: null };
    } catch (error) {
      return { data: [], error: this.handleError(error) };
    }
  }

  // Get service by slug
  async getServiceBySlug(slug: string): Promise<{ data: Service | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          service_gallery(
            id,
            image_url,
            caption,
            sort_order,
            is_before_after,
            tags
          ),
          service_content(
            id,
            content_type,
            title,
            content,
            sort_order
          )
        `)
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (error) {
        return { data: null, error: this.handleError(error) };
      }

      const transformedData: Service = {
        ...data,
        gallery: data.service_gallery || [],
        // Transform service_content into structured properties
        ...(data.service_content || []).reduce((acc: any, content: any) => {
          acc[content.content_type] = {
            title: content.title,
            content: content.content,
            sort_order: content.sort_order
          };
          return acc;
        }, {})
      };

      return { data: transformedData, error: null };
    } catch (error) {
      return { data: null, error: this.handleError(error) };
    }
  }

  // Get service by ID
  async getServiceById(id: string): Promise<{ data: Service | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          service_gallery(
            id,
            image_url,
            caption,
            sort_order,
            is_before_after,
            tags
          ),
          service_content(
            id,
            content_type,
            title,
            content,
            sort_order
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        return { data: null, error: this.handleError(error) };
      }

      const transformedData: Service = {
        ...data,
        gallery: data.service_gallery || []
      };

      return { data: transformedData, error: null };
    } catch (error) {
      return { data: null, error: this.handleError(error) };
    }
  }

  // Get service categories
  async getServiceCategories(serviceType?: string): Promise<{ data: ServiceCategory[]; error: any }> {
    try {
      let query = supabase
        .from('service_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (serviceType) {
        query = query.eq('service_type', serviceType);
      }

      const { data, error } = await query;

      if (error) {
        return { data: [], error: this.handleError(error) };
      }

      return { data: data || [], error: null };
    } catch (error) {
      return { data: [], error: this.handleError(error) };
    }
  }

  // Get related services
  async getRelatedServices(serviceId: string, limit: number = 3): Promise<{ data: Service[]; error: any }> {
    try {
      // First get the current service to determine its type and category
      const { data: currentService } = await this.getServiceById(serviceId);
      if (!currentService) {
        return { data: [], error: { message: 'Service not found' } };
      }

      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          service_gallery(
            id,
            image_url,
            caption,
            sort_order,
            is_before_after,
            tags
          )
        `)
        .eq('service_type', currentService.service_type)
        .eq('is_active', true)
        .neq('id', serviceId)
        .order('is_featured', { ascending: false })
        .order('sort_order', { ascending: true })
        .limit(limit);

      if (error) {
        return { data: [], error: this.handleError(error) };
      }

      const transformedData: Service[] = (data || []).map(item => ({
        ...item,
        gallery: item.service_gallery || []
      }));

      return { data: transformedData, error: null };
    } catch (error) {
      return { data: [], error: this.handleError(error) };
    }
  }

  // Get featured services
  async getFeaturedServices(serviceType?: string, limit: number = 6): Promise<{ data: Service[]; error: any }> {
    try {
      let query = supabase
        .from('services')
        .select(`
          *,
          service_gallery(
            id,
            image_url,
            caption,
            sort_order,
            is_before_after,
            tags
          )
        `)
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('sort_order', { ascending: true })
        .limit(limit);

      if (serviceType) {
        query = query.eq('service_type', serviceType);
      }

      const { data, error } = await query;

      if (error) {
        return { data: [], error: this.handleError(error) };
      }

      const transformedData: Service[] = (data || []).map(item => ({
        ...item,
        gallery: item.service_gallery || []
      }));

      return { data: transformedData, error: null };
    } catch (error) {
      return { data: [], error: this.handleError(error) };
    }
  }

  // Search services
  async searchServices(query: string, filters?: ServiceFilters): Promise<{ data: Service[]; error: any }> {
    return this.getServices({
      ...filters,
      search: query
    });
  }

  // Get service price range
  async getPriceRange(serviceType?: string): Promise<{ min: number; max: number } | null> {
    try {
      let supabaseQuery = supabase
        .from('services')
        .select('price_from, price_to')
        .eq('is_active', true);

      if (serviceType) {
        supabaseQuery = supabaseQuery.eq('service_type', serviceType);
      }

      const { data, error } = await supabaseQuery;

      if (error || !data || data.length === 0) {
        return null;
      }

      const prices = data.flatMap(item => [
        item.price_from,
        ...(item.price_to ? [item.price_to] : [])
      ]);

      return {
        min: Math.min(...prices),
        max: Math.max(...prices)
      };
    } catch (error) {
      logger.error('Error getting price range:', error);
      return null;
    }
  }
}

// Export singleton instance
export const servicesService = ServicesService.getInstance();