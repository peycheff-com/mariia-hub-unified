/**
 * Comprehensive CRM Service for Luxury Beauty/Fitness Platform
 * Handles client profile management, loyalty programs, and advanced analytics
 */

import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type CRMClientProfile = Database['public']['Tables']['crm_client_profiles']['Row'];
type CRMClientGallery = Database['public']['Tables']['crm_client_gallery']['Row'];
type CRMServiceHistory = Database['public']['Tables']['crm_service_history']['Row'];
type CRMClientLoyalty = Database['public']['Tables']['crm_client_loyalty']['Row'];
type CRMLoyaltyTransaction = Database['public']['Tables']['crm_loyalty_transactions']['Row'];
type CRMRecommendation = Database['public']['Tables']['crm_recommendations']['Row'];
type CRMAnalytics = Database['public']['Tables']['crm_analytics']['Row'];

export interface ClientProfileData {
  user_id: string;
  preferred_name?: string;
  birth_date?: string;
  preferred_language?: string;
  communication_preferences?: string[];
  skin_type?: 'normal' | 'dry' | 'oily' | 'combination' | 'sensitive';
  beauty_goals?: string[];
  fitness_goals?: string[];
  allergies?: string[];
  medical_conditions?: string[];
  preferred_service_duration?: number;
  is_vip?: boolean;
  special_occasions?: Record<string, string>;
  personal_interests?: string[];
  preferred_payment_method?: string;
  relationship_strength?: 'very_strong' | 'strong' | 'moderate' | 'weak' | 'very_weak';
  client_notes?: string;
  internal_tags?: string[];
}

export interface ServiceHistoryData {
  client_id: string;
  booking_id?: string;
  service_id: string;
  service_date: string;
  service_duration?: number;
  service_status: 'completed' | 'cancelled' | 'no_show' | 'rescheduled';
  primary_staff?: string;
  staff_rating?: number;
  staff_feedback?: string;
  treatment_results?: Record<string, any>;
  client_reaction?: string;
  immediate_satisfaction?: number;
  products_used?: Record<string, any>;
  products_recommended?: string[];
  products_purchased?: string[];
  progress_notes?: string;
  follow_up_required?: boolean;
  follow_up_date?: string;
  next_recommended_date?: string;
  actual_price?: number;
  discount_applied?: number;
  payment_method?: string;
  tip_amount?: number;
  is_no_show?: boolean;
  is_last_minute_cancellation?: boolean;
  cancellation_reason?: string;
  cancellation_hours_notice?: number;
  post_treatment_feedback?: string;
  satisfaction_score?: number;
  would_recommend?: boolean;
  metadata?: Record<string, any>;
}

export interface GalleryImageData {
  client_id: string;
  service_id?: string;
  booking_id?: string;
  image_url: string;
  thumbnail_url?: string;
  caption?: string;
  description?: string;
  progress_category?: string;
  progress_notes?: string;
  treatment_date?: string;
  treatment_number?: number;
  skin_analysis?: Record<string, any>;
  progress_metrics?: Record<string, any>;
  improvement_areas?: string[];
  taken_by_staff?: string;
  consent_granted?: boolean;
  consent_date?: string;
  is_public?: boolean;
  is_featured?: boolean;
  order_index?: number;
}

export interface RecommendationData {
  client_id: string;
  recommendation_type: 'service' | 'product' | 'treatment_plan' | 'upgrade' | 'maintenance';
  title: string;
  description: string;
  service_id?: string;
  product_ids?: string[];
  treatment_plan?: Record<string, any>;
  confidence_score: number;
  priority_score: number;
  recommendation_reason: string;
  personalization_factors?: Record<string, any>;
  behavioral_triggers?: string[];
  seasonal_relevance?: boolean;
  urgency_level?: 'low' | 'medium' | 'high' | 'critical';
  booking_window_days?: number;
  presentation_style?: string;
  discount_offer?: Record<string, any>;
  special_terms?: string;
}

class CRMService {
  // Client Profile Management
  async createOrUpdateClientProfile(data: ClientProfileData): Promise<CRMClientProfile> {
    try {
      const { data: result, error } = await supabase.rpc('create_or_update_client_profile', {
        p_user_id: data.user_id,
        p_preferred_name: data.preferred_name || null,
        p_birth_date: data.birth_date || null,
        p_preferred_language: data.preferred_language || 'pl',
        p_communication_preferences: data.communication_preferences || null,
        p_skin_type: data.skin_type || null,
        p_beauty_goals: data.beauty_goals || null,
        p_fitness_goals: data.fitness_goals || null,
        p_allergies: data.allergies || null,
        p_notes: data.client_notes || null
      });

      if (error) throw error;

      // Update additional fields that aren't handled by the function
      if (Object.keys(data).length > 8) {
        const { error: updateError } = await supabase
          .from('crm_client_profiles')
          .update({
            preferred_service_duration: data.preferred_service_duration,
            is_vip: data.is_vip,
            special_occasions: data.special_occasions,
            personal_interests: data.personal_interests,
            preferred_payment_method: data.preferred_payment_method,
            relationship_strength: data.relationship_strength,
            internal_tags: data.internal_tags,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', data.user_id);

        if (updateError) throw updateError;
      }

      // Return the complete profile
      const { data: profile, error: fetchError } = await supabase
        .from('crm_client_profiles')
        .select('*')
        .eq('user_id', data.user_id)
        .single();

      if (fetchError) throw fetchError;
      return profile;
    } catch (error) {
      console.error('Error creating/updating client profile:', error);
      throw error;
    }
  }

  async getClientProfile(userId: string): Promise<CRMClientProfile | null> {
    try {
      const { data, error } = await supabase
        .from('crm_client_profiles')
        .select(`
          *,
          loyalty:crm_client_loyalty(
            current_tier,
            current_points,
            lifetime_points,
            tier_progress_points
          )
        `)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error fetching client profile:', error);
      return null;
    }
  }

  async getClientProfiles(filters?: {
    tier?: string;
    segment?: string;
    is_vip?: boolean;
    relationship_strength?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ profiles: CRMClientProfile[]; total: number }> {
    try {
      let query = supabase
        .from('crm_client_profiles')
        .select(`
          *,
          user:profiles(
            email,
            full_name,
            avatar_url,
            phone
          ),
          loyalty:crm_client_loyalty(
            current_tier,
            current_points,
            lifetime_points
          ),
          segment_memberships:crm_client_segment_memberships(
            segment:crm_client_segments(name, segment_type)
          )
        `, { count: 'exact' });

      // Apply filters
      if (filters?.tier) {
        query = query.eq('loyalty.current_tier', filters.tier);
      }
      if (filters?.is_vip !== undefined) {
        query = query.eq('is_vip', filters.is_vip);
      }
      if (filters?.relationship_strength) {
        query = query.eq('relationship_strength', filters.relationship_strength);
      }

      // Apply pagination
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      // Order by relationship strength and VIP status
      query = query.order('is_vip', { ascending: false })
        .order('relationship_strength', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      // Filter by segment if specified
      let filteredData = data || [];
      if (filters?.segment) {
        filteredData = data?.filter(profile =>
          profile.segment_memberships?.some((membership: any) =>
            membership.segment?.name === filters.segment
          )
        ) || [];
      }

      return {
        profiles: filteredData,
        total: filters?.segment ? filteredData.length : count || 0
      };
    } catch (error) {
      console.error('Error fetching client profiles:', error);
      return { profiles: [], total: 0 };
    }
  }

  // Service History Management
  async addServiceHistory(data: ServiceHistoryData): Promise<CRMServiceHistory> {
    try {
      const { data: result, error } = await supabase
        .from('crm_service_history')
        .insert({
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Error adding service history:', error);
      throw error;
    }
  }

  async getServiceHistory(clientId: string, limit?: number): Promise<CRMServiceHistory[]> {
    try {
      let query = supabase
        .from('crm_service_history')
        .select(`
          *,
          service:services(
            title,
            service_type,
            category,
            duration_minutes,
            price
          ),
          primary_staff_profile:profiles!crm_service_history_primary_staff_fkey(
            full_name,
            avatar_url
          ),
          booking:bookings(
            total_amount,
            currency,
            notes
          )
        `)
        .eq('client_id', clientId)
        .order('service_date', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching service history:', error);
      return [];
    }
  }

  async getServiceAnalytics(clientId: string, period: 'monthly' | 'quarterly' | 'yearly' = 'monthly'): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('crm_analytics')
        .select('*')
        .eq('client_id', clientId)
        .eq('period_type', period)
        .order('period_start', { ascending: false })
        .limit(12);

      if (error) throw error;

      // Calculate additional analytics
      const serviceHistory = await this.getServiceHistory(clientId, 50);

      const analytics = {
        period_data: data || [],
        summary: {
          total_bookings: serviceHistory.length,
          total_revenue: serviceHistory.reduce((sum, h) => sum + (h.actual_price || 0), 0),
          average_booking_value: serviceHistory.length > 0
            ? serviceHistory.reduce((sum, h) => sum + (h.actual_price || 0), 0) / serviceHistory.length
            : 0,
          average_satisfaction: serviceHistory.filter(h => h.satisfaction_score).length > 0
            ? serviceHistory.reduce((sum, h) => sum + (h.satisfaction_score || 0), 0) /
              serviceHistory.filter(h => h.satisfaction_score).length
            : 0,
          favorite_services: this.getFavoriteServices(serviceHistory),
          preferred_staff: this.getPreferredStaff(serviceHistory),
          cancellation_rate: this.getCancellationRate(serviceHistory),
          no_show_rate: this.getNoShowRate(serviceHistory)
        }
      };

      return analytics;
    } catch (error) {
      console.error('Error fetching service analytics:', error);
      return null;
    }
  }

  // Client Gallery Management
  async addGalleryImage(data: GalleryImageData): Promise<CRMClientGallery> {
    try {
      const { data: result, error } = await supabase
        .from('crm_client_gallery')
        .insert({
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Error adding gallery image:', error);
      throw error;
    }
  }

  async getClientGallery(clientId: string, category?: string): Promise<CRMClientGallery[]> {
    try {
      let query = supabase
        .from('crm_client_gallery')
        .select(`
          *,
          service:services(
            title,
            service_type,
            category
          ),
          taken_by_staff:profiles!crm_client_gallery_taken_by_staff_fkey(
            full_name,
            avatar_url
          )
        `)
        .eq('client_id', clientId)
        .order('treatment_date', { ascending: false })
        .order('order_index', { ascending: true });

      if (category) {
        query = query.eq('progress_category', category);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching client gallery:', error);
      return [];
    }
  }

  async getProgressTimeline(clientId: string): Promise<any[]> {
    try {
      const gallery = await this.getClientGallery(clientId);
      const serviceHistory = await this.getServiceHistory(clientId, 20);

      // Combine and sort timeline events
      const timeline = [
        ...gallery.map(item => ({
          id: item.id,
          date: item.treatment_date || item.created_at,
          type: 'photo',
          title: item.caption || 'Progress Photo',
          description: item.description,
          data: item,
          category: item.progress_category
        })),
        ...serviceHistory.map(item => ({
          id: item.id,
          date: item.service_date,
          type: 'service',
          title: item.service?.title || 'Service',
          description: item.treatment_results?.notes || item.progress_notes,
          data: item,
          satisfaction: item.satisfaction_score
        }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return timeline;
    } catch (error) {
      console.error('Error fetching progress timeline:', error);
      return [];
    }
  }

  // Loyalty Program Management
  async getClientLoyalty(clientId: string): Promise<CRMClientLoyalty | null> {
    try {
      const { data, error } = await supabase
        .from('crm_client_loyalty')
        .select(`
          *,
          program:crm_loyalty_program(
            name,
            points_to_currency_rate,
            tier_requirements,
            tier_benefits
          ),
          recent_transactions:crm_loyalty_transactions(
            points_change,
            reason,
            created_at
          ).order(created_at, { ascending: false }).limit(10)
        `)
        .eq('client_id', clientId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error fetching client loyalty:', error);
      return null;
    }
  }

  async getLoyaltyTransactions(clientId: string, limit: number = 50): Promise<CRMLoyaltyTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('crm_loyalty_transactions')
        .select(`
          *,
          client_loyalty:crm_client_loyalty(
            client:crm_client_profiles(
              user:profiles(full_name)
            )
          )
        `)
        .eq('client_loyalty.client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching loyalty transactions:', error);
      return [];
    }
  }

  async awardPoints(clientId: string, points: number, reason: string, referenceType?: string, referenceId?: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('award_loyalty_points', {
        p_client_id: clientId,
        p_points: points,
        p_reason: reason,
        p_reference_type: referenceType || null,
        p_reference_id: referenceId || null
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error awarding loyalty points:', error);
      throw error;
    }
  }

  // Recommendations Engine
  async generateRecommendations(clientId: string, limit: number = 5): Promise<CRMRecommendation[]> {
    try {
      const { data, error } = await supabase.rpc('generate_service_recommendations', {
        p_client_id: clientId,
        p_limit: limit
      });

      if (error) throw error;

      // Save recommendations to database
      if (data && data.length > 0) {
        const recommendationsToInsert = data.map((rec: any) => ({
          client_id: clientId,
          recommendation_type: 'service',
          title: rec.service_title,
          description: rec.reason,
          service_id: rec.service_id,
          confidence_score: rec.confidence_score,
          priority_score: rec.priority_score,
          recommendation_reason: rec.reason,
          personalization_factors: {
            generated_at: new Date().toISOString(),
            algorithm: 'hybrid_collaborative_content_based'
          },
          created_at: new Date().toISOString()
        }));

        const { error: insertError } = await supabase
          .from('crm_recommendations')
          .insert(recommendationsToInsert);

        if (insertError) console.error('Error saving recommendations:', insertError);
      }

      return data || [];
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [];
    }
  }

  async getRecommendations(clientId: string, status?: string): Promise<CRMRecommendation[]> {
    try {
      let query = supabase
        .from('crm_recommendations')
        .select(`
          *,
          service:services(
            title,
            description,
            price,
            duration_minutes,
            service_type,
            category
          )
        `)
        .eq('client_id', clientId)
        .order('priority_score', { ascending: false })
        .order('confidence_score', { ascending: false });

      if (status) {
        if (status === 'pending') {
          query = query.is('converted_at', null);
        } else if (status === 'converted') {
          query = query.not('converted_at', 'is', null);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      return [];
    }
  }

  async updateRecommendationInteraction(
    recommendationId: string,
    action: 'viewed' | 'clicked' | 'converted',
    bookingId?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (action === 'viewed') {
        updateData.viewed_at = new Date().toISOString();
      } else if (action === 'clicked') {
        updateData.clicked_at = new Date().toISOString();
      } else if (action === 'converted') {
        updateData.converted_at = new Date().toISOString();
        if (bookingId) {
          updateData.converted_booking_id = bookingId;
        }
      }

      const { error } = await supabase
        .from('crm_recommendations')
        .update(updateData)
        .eq('id', recommendationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating recommendation interaction:', error);
      throw error;
    }
  }

  // Analytics and Reporting
  async getClientAnalytics(clientId: string, period: string = 'monthly'): Promise<CRMAnalytics[]> {
    try {
      const { data, error } = await supabase
        .from('crm_analytics')
        .select('*')
        .eq('client_id', clientId)
        .eq('period_type', period)
        .order('period_start', { ascending: false })
        .limit(12);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching client analytics:', error);
      return [];
    }
  }

  async updateClientAnalytics(clientId: string, periodType: string = 'monthly'): Promise<void> {
    try {
      const { error } = await supabase.rpc('update_client_analytics', {
        p_client_id: clientId,
        p_period_type: periodType
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating client analytics:', error);
      throw error;
    }
  }

  async getClientsSummaryMetrics(filters?: {
    tier?: string;
    segment?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<any> {
    try {
      // This would typically be a more complex query with aggregations
      const { data: profiles, error } = await supabase
        .from('crm_client_profiles')
        .select(`
          id,
          user_id,
          is_vip,
          relationship_strength,
          relationship_score,
          loyalty:crm_client_loyalty(
            current_tier,
            current_points,
            lifetime_points,
            total_bookings,
            total_revenue
          ),
          analytics:crm_analytics(
            period_revenue,
            period_bookings,
            satisfaction_score,
            churn_probability
          )
        `);

      if (error) throw error;

      // Calculate summary metrics
      const totalClients = profiles?.length || 0;
      const vipClients = profiles?.filter(p => p.is_vip).length || 0;
      const activeClients = profiles?.filter(p =>
        p.loyalty?.total_bookings > 0
      ).length || 0;

      const totalRevenue = profiles?.reduce((sum, p) =>
        sum + (p.loyalty?.total_revenue || 0), 0
      ) || 0;

      const averageLifetimeValue = totalClients > 0 ? totalRevenue / totalClients : 0;

      const tierDistribution = profiles?.reduce((acc, p) => {
        const tier = p.loyalty?.current_tier || 'none';
        acc[tier] = (acc[tier] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const averageSatisfaction = profiles?.reduce((sum, p) => {
        const latestAnalytics = p.analytics?.[0];
        return sum + (latestAnalytics?.satisfaction_score || 0);
      }, 0) || 0;

      const totalAnalyticsRecords = profiles?.filter(p => p.analytics && p.analytics.length > 0).length || 0;
      const avgSatisfaction = totalAnalyticsRecords > 0 ? averageSatisfaction / totalAnalyticsRecords : 0;

      return {
        total_clients: totalClients,
        vip_clients: vipClients,
        active_clients: activeClients,
        client_acquisition_rate: 0, // Would need historical data
        client_retention_rate: 0, // Would need historical data
        total_revenue: totalRevenue,
        average_lifetime_value: averageLifetimeValue,
        average_satisfaction_score: avgSatisfaction,
        tier_distribution: tierDistribution,
        churn_risk_clients: profiles?.filter(p => {
          const latestAnalytics = p.analytics?.[0];
          return latestAnalytics?.churn_probability && latestAnalytics.churn_probability > 0.5;
        }).length || 0
      };
    } catch (error) {
      console.error('Error fetching clients summary metrics:', error);
      return null;
    }
  }

  // Helper methods
  private getFavoriteServices(serviceHistory: CRMServiceHistory[]): any[] {
    const serviceCounts = serviceHistory.reduce((acc, history) => {
      const serviceTitle = history.service?.title || 'Unknown Service';
      acc[serviceTitle] = (acc[serviceTitle] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(serviceCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([service, count]) => ({ service, count }));
  }

  private getPreferredStaff(serviceHistory: CRMServiceHistory[]): any[] {
    const staffCounts = serviceHistory.reduce((acc, history) => {
      if (history.primary_staff_profile?.full_name) {
        const staffName = history.primary_staff_profile.full_name;
        acc[staffName] = (acc[staffName] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(staffCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([staff, count]) => ({ staff, count }));
  }

  private getCancellationRate(serviceHistory: CRMServiceHistory[]): number {
    if (serviceHistory.length === 0) return 0;
    const cancellations = serviceHistory.filter(h => h.service_status === 'cancelled').length;
    return (cancellations / serviceHistory.length) * 100;
  }

  private getNoShowRate(serviceHistory: CRMServiceHistory[]): number {
    if (serviceHistory.length === 0) return 0;
    const noShows = serviceHistory.filter(h => h.is_no_show).length;
    return (noShows / serviceHistory.length) * 100;
  }
}

export const crmService = new CRMService();
export default crmService;