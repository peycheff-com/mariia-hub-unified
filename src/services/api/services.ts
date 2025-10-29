import { supabase } from '@/integrations/supabase/client';

import { ApiService } from './index';

export interface Service {
  id: string;
  title: string;
  description?: string;
  service_type: 'beauty' | 'fitness' | 'lifestyle';
  duration_minutes: number;
  price_from: number;
  price_to?: number;
  category: string;
  display_order?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceFilters {
  type?: 'beauty' | 'fitness' | 'lifestyle';
  category?: string;
  active?: boolean;
}

export class ServicesApi {
  // Get all services with optional filters
  static async getServices(filters?: ServiceFilters): Promise<Service[] | null> {
    let query = supabase
      .from('services')
      .select('*')
      .order('display_order', { ascending: true });

    // Apply filters
    if (filters?.type) {
      query = query.eq('service_type', filters.type);
    }
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.active !== undefined) {
      query = query.eq('is_active', filters.active);
    }

    return ApiService.handleRequest(
      query,
      'Failed to load services'
    );
  }

  // Get a single service by ID
  static async getService(id: string): Promise<Service | null> {
    return ApiService.handleRequest(
      supabase
        .from('services')
        .select('*')
        .eq('id', id)
        .single(),
      'Failed to load service'
    );
  }

  // Get a service by slug
  static async getServiceBySlug(slug: string): Promise<Service | null> {
    return ApiService.handleRequest(
      supabase
        .from('services')
        .select('*')
        .eq('slug', slug)
        .single(),
      'Failed to load service'
    );
  }

  // Get services with all related data (gallery, FAQs, content)
  static async getServiceWithDetails(id: string): Promise<any> {
    return ApiService.handleRequest(
      supabase
        .from('services_comprehensive')
        .select(`
          *,
          service_gallery(*),
          service_faqs(*),
          service_content(*),
          reviews(*)
        `)
        .eq('id', id)
        .single(),
      'Failed to load service details'
    );
  }

  // Get service categories
  static async getServiceCategories(type?: string): Promise<string[] | null> {
    const query = supabase
      .from('services')
      .select('category')
      .eq('is_active', true);

    if (type) {
      query.eq('service_type', type);
    }

    const { data, error } = await query;

    if (error) {
      ApiService.handleRequest(Promise.resolve({ data: null, error }), 'Failed to load categories');
      return null;
    }

    // Extract unique categories
    const categories = [...new Set(data?.map(s => s.category).filter(Boolean))];
    return categories;
  }

  // Search services
  static async searchServices(query: string, type?: string): Promise<Service[] | null> {
    let dbQuery = supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`);

    if (type) {
      dbQuery = dbQuery.eq('service_type', type);
    }

    return ApiService.handleRequest(
      dbQuery,
      'Failed to search services'
    );
  }
}