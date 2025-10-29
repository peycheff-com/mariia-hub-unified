import { supabase } from '@/integrations/supabase/client';
import { Service } from '@/types/booking';

export const searchService = {
  async advancedSearch(params: {
    query?: string;
    type?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    minDuration?: number;
    maxDuration?: number;
    minRating?: number;
    location?: string;
    features?: string[];
    availability?: string;
    sortBy?: string;
  }): Promise<Service[]> {
    let query = supabase
      .from('services')
      .select('*')
      .eq('status', 'active');

    // Text search - sanitized to prevent SQL injection
    if (params.query) {
      // Sanitize input to prevent SQL injection
      const sanitizedQuery = params.query
        .replace(/[%_\\]/g, '\\$&') // Escape SQL wildcards
        .replace(/['"]/g, '') // Remove quotes
        .trim()
        .substring(0, 100); // Limit length

      if (sanitizedQuery) {
        query = query.or(`name.ilike.%${sanitizedQuery}%,description.ilike.%${sanitizedQuery}%`);
      }
    }

    // Type filter
    if (params.type) {
      query = query.eq('type', params.type);
    }

    // Category filter
    if (params.category) {
      query = query.eq('category', params.category);
    }

    // Price range
    if (params.minPrice !== undefined) {
      query = query.gte('price', params.minPrice);
    }
    if (params.maxPrice !== undefined) {
      query = query.lte('price', params.maxPrice);
    }

    // Duration range
    if (params.minDuration !== undefined) {
      query = query.gte('duration', params.minDuration);
    }
    if (params.maxDuration !== undefined) {
      query = query.lte('duration', params.maxDuration);
    }

    // Location
    if (params.location) {
      query = query.ilike('location_id', `%${params.location}%`);
    }

    // Features
    if (params.features && params.features.length > 0) {
      query = query.contains('features', params.features);
    }

    // Sort
    switch (params.sortBy) {
      case 'price_low':
        query = query.order('price', { ascending: true });
        break;
      case 'price_high':
        query = query.order('price', { ascending: false });
        break;
      case 'rating':
        query = query.order('rating', { ascending: false });
        break;
      case 'popularity':
        query = query.order('bookings_count', { ascending: false });
        break;
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      default:
        // Relevance - would use full-text search in production
        query = query.order('name', { ascending: true });
    }

    const { data, error } = await query.limit(50);

    if (error) throw error;

    return data || [];
  },

  async getSuggestions(query: string): Promise<string[]> {
    if (!query || query.length < 2) return [];

    const { data, error } = await supabase
      .from('services')
      .select('name')
      .eq('status', 'active')
      .ilike('name', `%${query}%`)
      .limit(5);

    if (error) return [];

    return data?.map(s => s.name) || [];
  },

  async getPopularSearches(): Promise<string[]> {
    // In production, this would come from analytics
    return [
      'Lash extensions',
      'Brow lamination',
      'Personal training',
      'Massage',
      'PMU eyebrows',
      'Fitness classes',
      'Beauty treatments',
    ];
  },

  async getCategories(): Promise<string[]> {
    const { data, error } = await supabase
      .from('services')
      .select('category')
      .eq('status', 'active')
      .not('category', 'is', null);

    if (error) return [];

    const categories = [...new Set(data?.map(s => s.category) || [])];
    return categories.filter(Boolean);
  },

  async getFeatures(): Promise<string[]> {
    // In production, this would be a separate features table
    return [
      'Free consultation',
      'Parking available',
      'Wi-Fi',
      'Air conditioning',
      'Accessibility',
      'Aftercare included',
      'Package deals',
      'Gift cards',
    ];
  },
};