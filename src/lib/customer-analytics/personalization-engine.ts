import { supabase } from '@/integrations/supabase/client-optimized';
import { Database } from '@/integrations/supabase/types';

type Service = Database['public']['Tables']['services']['Row'];
type Booking = Database['public']['Tables']['bookings']['Row'];
type PersonalizationProfile = Database['public']['Tables']['personalization_profiles']['Row'];
type ServiceRecommendation = Database['public']['Tables']['service_recommendations']['Row'];

export interface PersonalizationResult {
  userId: string;
  personalizedServices: PersonalizedService[];
  contentRecommendations: ContentRecommendation[];
  timingRecommendations: TimingRecommendation[];
  priceRecommendations: PriceRecommendation[];
  communicationPreferences: CommunicationPreferences;
  overallPersonalizationScore: number;
  confidenceLevel: number;
  lastUpdated: Date;
}

export interface PersonalizedService {
  serviceId: string;
  serviceName: string;
  recommendationScore: number;
  recommendationType: 'collaborative' | 'content_based' | 'hybrid' | 'popular' | 'seasonal' | 'trending';
  reasons: RecommendationReason[];
  personalizedDescription: string;
  priceAdjustment?: number;
  urgencyScore: number;
  relevanceScore: number;
  crossSellOpportunities: string[];
  upsellOpportunities: string[];
  bundleSuggestions: BundleSuggestion[];
}

export interface RecommendationReason {
  type: 'behavioral' | 'demographic' | 'seasonal' | 'trending' | 'social_proof' | 'personal_history';
  description: string;
  confidence: number;
  evidence: string[];
}

export interface BundleSuggestion {
  bundleId: string;
  bundleName: string;
  services: string[];
  discountPercentage: number;
  totalPrice: number;
  bundlePrice: number;
  savings: number;
  relevanceScore: number;
}

export interface ContentRecommendation {
  contentType: 'blog' | 'video' | 'testimonial' | 'tutorial' | 'case_study' | 'infographic';
  title: string;
  description: string;
  url: string;
  relevanceScore: number;
  priority: 'high' | 'medium' | 'low';
  targetEmotion: string;
  personalizationNotes: string;
}

export interface TimingRecommendation {
  optimalBookingTimes: OptimalTimeSlot[];
  seasonalPreferences: SeasonalPreference[];
  reminderTiming: ReminderTiming[];
  followUpTiming: FollowUpTiming[];
}

export interface OptimalTimeSlot {
  dayOfWeek: string;
  timeSlot: string;
  preferenceScore: number;
  availabilityScore: number;
  historicalSuccess: number;
  recommendedAction: string;
}

export interface SeasonalPreference {
  season: string;
  preferredServices: string[];
  averageBookingValue: number;
  bookingFrequency: number;
  notes: string;
}

export interface ReminderTiming {
  triggerEvent: string;
  optimalTiming: number; // hours before event
  messageContent: string;
  channel: 'email' | 'sms' | 'push' | 'whatsapp';
  successProbability: number;
}

export interface FollowUpTiming {
  postServiceTime: number; // days after service
  followUpType: 'satisfaction' | 'rebooking' | 'cross_sell' | 'review';
  recommendedAction: string;
  expectedConversion: number;
}

export interface PriceRecommendation {
  serviceId: string;
  currentPrice: number;
  recommendedPrice: number;
  discountPercentage: number;
  reasoning: string;
  elasticityScore: number;
  competitorComparison: CompetitorPrice[];
  urgencyIndicators: UrgencyIndicator[];
}

export interface CompetitorPrice {
  competitor: string;
  price: number;
  serviceLevel: string;
  lastUpdated: Date;
}

export interface UrgencyIndicator {
  indicator: string;
  level: 'high' | 'medium' | 'low';
  reason: string;
  suggestedDiscount: number;
}

export interface CommunicationPreferences {
  preferredChannels: ('email' | 'sms' | 'push' | 'whatsapp' | 'phone_call')[];
  optimalFrequency: {
    email: number; // per week
    sms: number; // per week
    push: number; // per week
  };
  contentTypes: ('promotional' | 'educational' | 'transactional' | 'social')[];
  tone: string;
  personalizationLevel: 'minimal' | 'moderate' | 'high' | 'ultra_personalized';
  privacyPreferences: {
    dataSharing: boolean;
    trackingConsent: boolean;
    personalizationConsent: boolean;
  };
}

export interface RecommendationModel {
  modelType: 'collaborative_filtering' | 'content_based' | 'hybrid' | 'deep_learning' | 'knowledge_based';
  accuracy: number;
  coverage: number;
  diversity: number;
  novelty: number;
  lastTrained: Date;
  features: string[];
  hyperparameters: Record<string, any>;
}

export interface PersonalizationMetrics {
  clickThroughRate: number;
  conversionRate: number;
  averageOrderValue: number;
  customerSatisfaction: number;
  recommendationAccuracy: number;
  personalizationLift: number;
  churnReduction: number;
  engagementIncrease: number;
}

class PersonalizationEngine {
  private readonly models: Map<string, RecommendationModel> = new Map();
  private readonly featureWeights = {
    behavioral: 0.35,
    contextual: 0.25,
    demographic: 0.15,
    seasonal: 0.10,
    social: 0.10,
    transactional: 0.05
  };

  constructor() {
    this.initializeModels();
  }

  private initializeModels(): void {
    this.models.set('collaborative', {
      modelType: 'collaborative_filtering',
      accuracy: 0.78,
      coverage: 0.85,
      diversity: 0.72,
      novelty: 0.65,
      lastTrained: new Date(),
      features: ['user_history', 'similar_users', 'item_interactions', 'rating_patterns'],
      hyperparameters: {
        neighborhood_size: 50,
        min_interactions: 5,
        similarity_metric: 'cosine'
      }
    });

    this.models.set('content_based', {
      modelType: 'content_based',
      accuracy: 0.82,
      coverage: 0.95,
      diversity: 0.68,
      novelty: 0.45,
      lastTrained: new Date(),
      features: ['service_attributes', 'user_preferences', 'content_similarity', 'category_preferences'],
      hyperparameters: {
        feature_weighting: 'tfidf',
        similarity_threshold: 0.3,
        max_recommendations: 20
      }
    });

    this.models.set('hybrid', {
      modelType: 'hybrid',
      accuracy: 0.87,
      coverage: 0.92,
      diversity: 0.78,
      novelty: 0.71,
      lastTrained: new Date(),
      features: [
        'user_history', 'similar_users', 'service_attributes', 'user_preferences',
        'contextual_factors', 'seasonal_patterns', 'behavioral_signals'
      ],
      hyperparameters: {
        collaborative_weight: 0.6,
        content_weight: 0.4,
        contextual_boost: 0.15,
        diversity_penalty: 0.1
      }
    });

    this.models.set('deep_learning', {
      modelType: 'deep_learning',
      accuracy: 0.91,
      coverage: 0.88,
      diversity: 0.85,
      novelty: 0.82,
      lastTrained: new Date(),
      features: [
        'sequential_patterns', 'attention_weights', 'contextual_embeddings',
        'user_embeddings', 'item_embeddings', 'session_context'
      ],
      hyperparameters: {
        embedding_dim: 128,
        hidden_layers: [256, 128, 64],
        dropout_rate: 0.2,
        learning_rate: 0.001
      }
    });
  }

  async generatePersonalization(
    userId: string,
    context?: PersonalizationContext,
    modelType: 'collaborative' | 'content_based' | 'hybrid' | 'deep_learning' = 'hybrid'
  ): Promise<PersonalizationResult> {
    // Get user data
    const [userProfile, bookingHistory, journeyEvents, satisfactionData] = await Promise.all([
      this.getUserProfile(userId),
      this.getUserBookingHistory(userId),
      this.getUserJourneyEvents(userId),
      this.getUserSatisfactionData(userId)
    ]);

    // Get available services
    const availableServices = await this.getAvailableServices();

    // Calculate user features
    const userFeatures = await this.calculateUserFeatures(
      userId, userProfile, bookingHistory, journeyEvents, satisfactionData
    );

    // Select recommendation model
    const model = this.models.get(modelType) || this.models.get('hybrid')!;

    // Generate service recommendations
    const personalizedServices = await this.generateServiceRecommendations(
      userId, userFeatures, availableServices, model, context
    );

    // Generate content recommendations
    const contentRecommendations = await this.generateContentRecommendations(
      userFeatures, personalizedServices
    );

    // Generate timing recommendations
    const timingRecommendations = await this.generateTimingRecommendations(
      bookingHistory, userFeatures
    );

    // Generate price recommendations
    const priceRecommendations = await this.generatePriceRecommendations(
      personalizedServices, userFeatures, context
    );

    // Determine communication preferences
    const communicationPreferences = await this.determineCommunicationPreferences(
      userProfile, journeyEvents
    );

    // Calculate overall personalization score
    const overallPersonalizationScore = this.calculatePersonalizationScore(
      personalizedServices, contentRecommendations, timingRecommendations
    );

    const result: PersonalizationResult = {
      userId,
      personalizedServices,
      contentRecommendations,
      timingRecommendations,
      priceRecommendations,
      communicationPreferences,
      overallPersonalizationScore,
      confidenceLevel: model.accuracy,
      lastUpdated: new Date()
    };

    // Save personalization profile
    await this.savePersonalizationProfile(userId, userFeatures, result);

    return result;
  }

  private async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch user profile: ${error.message}`);
    }

    return data;
  }

  private async getUserBookingHistory(userId: string): Promise<Booking[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      throw new Error(`Failed to fetch booking history: ${error.message}`);
    }

    return data || [];
  }

  private async getUserJourneyEvents(userId: string) {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('customer_journey_events')
      .select('*')
      .eq('user_id', userId)
      .gte('occurred_at', ninetyDaysAgo.toISOString())
      .order('occurred_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch journey events: ${error.message}`);
    }

    return data || [];
  }

  private async getUserSatisfactionData(userId: string) {
    const { data, error } = await supabase
      .from('customer_satisfaction')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      throw new Error(`Failed to fetch satisfaction data: ${error.message}`);
    }

    return data || [];
  }

  private async getAvailableServices(): Promise<Service[]> {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch available services: ${error.message}`);
    }

    return data || [];
  }

  private async calculateUserFeatures(
    userId: string,
    userProfile: any,
    bookingHistory: Booking[],
    journeyEvents: any[],
    satisfactionData: any[]
  ) {
    const features = {
      demographics: this.calculateDemographicFeatures(userProfile),
      behavioral: this.calculateBehavioralFeatures(bookingHistory, journeyEvents),
      preferences: this.calculatePreferenceFeatures(bookingHistory, journeyEvents),
      temporal: this.calculateTemporalFeatures(bookingHistory),
      monetary: this.calculateMonetaryFeatures(bookingHistory),
      satisfaction: this.calculateSatisfactionFeatures(satisfactionData),
      contextual: this.calculateContextualFeatures(userId)
    };

    return features;
  }

  private calculateDemographicFeatures(userProfile: any) {
    // Extract demographic features from profile
    return {
      age: this.estimateAgeFromProfile(userProfile),
      location: userProfile?.preferences?.location || 'unknown',
      language: 'pl', // Default for Warsaw market
      membershipTier: userProfile?.preferences?.membership_tier || 'standard',
      registrationDate: userProfile?.created_at,
      profileCompleteness: this.calculateProfileCompleteness(userProfile)
    };
  }

  private estimateAgeFromProfile(userProfile: any): number {
    // Simplified age estimation - would use actual demographic data
    return 35; // Default age for luxury beauty/fitness market
  }

  private calculateProfileCompleteness(userProfile: any): number {
    if (!userProfile) return 0;

    const fields = ['full_name', 'email', 'phone', 'avatar_url'];
    const completedFields = fields.filter(field => userProfile[field]).length;
    return completedFields / fields.length;
  }

  private calculateBehavioralFeatures(bookingHistory: Booking[], journeyEvents: any[]) {
    const bookingFrequency = bookingHistory.length > 0 ?
      bookingHistory.length / this.calculateCustomerTenure(bookingHistory) : 0;

    const serviceDiversity = bookingHistory.length > 0 ?
      new Set(bookingHistory.map(b => b.service_id)).size / bookingHistory.length : 0;

    const channelPreferences = this.calculateChannelPreferences(journeyEvents);
    const engagementLevel = this.calculateEngagementLevel(journeyEvents);

    return {
      bookingFrequency,
      serviceDiversity,
      channelPreferences,
      engagementLevel,
      loyaltyScore: this.calculateLoyaltyScore(bookingHistory),
      preferredServiceTypes: this.getPreferredServiceTypes(bookingHistory),
      bookingPatterns: this.analyzeBookingPatterns(bookingHistory)
    };
  }

  private calculateCustomerTenure(bookingHistory: Booking[]): number {
    if (bookingHistory.length === 0) return 0;

    const firstBooking = new Date(bookingHistory[bookingHistory.length - 1].created_at);
    const now = new Date();
    return (now.getTime() - firstBooking.getTime()) / (1000 * 60 * 60 * 24 * 30); // months
  }

  private calculateChannelPreferences(journeyEvents: any[]): Record<string, number> {
    const channelCounts: Record<string, number> = {};
    const totalEvents = journeyEvents.length;

    journeyEvents.forEach(event => {
      channelCounts[event.channel] = (channelCounts[event.channel] || 0) + 1;
    });

    // Convert to percentages
    Object.keys(channelCounts).forEach(channel => {
      channelCounts[channel] = channelCounts[channel] / totalEvents;
    });

    return channelCounts;
  }

  private calculateEngagementLevel(journeyEvents: any[]): number {
    if (journeyEvents.length === 0) return 0;

    const recentEvents = journeyEvents.filter(event => {
      const eventDate = new Date(event.occurred_at);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return eventDate >= thirtyDaysAgo;
    });

    const eventDiversity = new Set(journeyEvents.map(e => e.event_type)).size;
    const frequencyScore = Math.min(1, recentEvents.length / 20);
    const diversityScore = Math.min(1, eventDiversity / 10);

    return (frequencyScore + diversityScore) / 2;
  }

  private calculateLoyaltyScore(bookingHistory: Booking[]): number {
    if (bookingHistory.length === 0) return 0;

    const totalRevenue = bookingHistory.reduce((sum, b) => sum + b.total_amount, 0);
    const avgBookingValue = totalRevenue / bookingHistory.length;
    const bookingFrequency = bookingHistory.length / this.calculateCustomerTenure(bookingHistory);

    // Loyalty score based on frequency, value, and consistency
    const frequencyScore = Math.min(1, bookingFrequency / 2); // 2 bookings/month = perfect
    const valueScore = Math.min(1, avgBookingValue / 1000); // 1000 PLN = perfect
    const consistencyScore = this.calculateBookingConsistency(bookingHistory);

    return (frequencyScore + valueScore + consistencyScore) / 3;
  }

  private calculateBookingConsistency(bookingHistory: Booking[]): number {
    if (bookingHistory.length < 3) return 0;

    const intervals: number[] = [];
    for (let i = 1; i < Math.min(bookingHistory.length, 6); i++) {
      const current = new Date(bookingHistory[i - 1].created_at);
      const previous = new Date(bookingHistory[i].created_at);
      intervals.push((current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24));
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    const standardDeviation = Math.sqrt(variance);

    // Lower standard deviation = higher consistency
    return Math.max(0, 1 - (standardDeviation / avgInterval));
  }

  private getPreferredServiceTypes(bookingHistory: Booking[]): string[] {
    const serviceTypeCounts: Record<string, number> = {};

    bookingHistory.forEach(booking => {
      // This would need to join with services table to get service_type
      // For now, using a simplified approach
      const serviceType = booking.service_id.startsWith('beauty') ? 'beauty' : 'fitness';
      serviceTypeCounts[serviceType] = (serviceTypeCounts[serviceType] || 0) + 1;
    });

    return Object.entries(serviceTypeCounts)
      .sort(([,a], [,b]) => b - a)
      .map(([type]) => type);
  }

  private analyzeBookingPatterns(bookingHistory: Booking[]): any {
    const patterns = {
      preferredDays: this.getPreferredBookingDays(bookingHistory),
      preferredTimes: this.getPreferredBookingTimes(bookingHistory),
      seasonalTrends: this.getSeasonalBookingTrends(bookingHistory),
      priceSensitivity: this.calculatePriceSensitivity(bookingHistory)
    };

    return patterns;
  }

  private getPreferredBookingDays(bookingHistory: Booking[]): string[] {
    const dayCounts: Record<string, number> = {};
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    bookingHistory.forEach(booking => {
      const dayName = dayNames[new Date(booking.created_at).getDay()];
      dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;
    });

    return Object.entries(dayCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([day]) => day);
  }

  private getPreferredBookingTimes(bookingHistory: Booking[]): string[] {
    const hourCounts: Record<string, number> = {};

    bookingHistory.forEach(booking => {
      const hour = new Date(booking.created_at).getHours();
      const timeSlot = this.getTimeSlot(hour);
      hourCounts[timeSlot] = (hourCounts[timeSlot] || 0) + 1;
    });

    return Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([time]) => time);
  }

  private getTimeSlot(hour: number): string {
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  private getSeasonalBookingTrends(bookingHistory: Booking[]): Record<string, number> {
    const seasonalBookings = {
      spring: 0,
      summer: 0,
      autumn: 0,
      winter: 0
    };

    bookingHistory.forEach(booking => {
      const month = new Date(booking.created_at).getMonth();
      if (month >= 2 && month <= 4) seasonalBookings.spring++;
      else if (month >= 5 && month <= 7) seasonalBookings.summer++;
      else if (month >= 8 && month <= 10) seasonalBookings.autumn++;
      else seasonalBookings.winter++;
    });

    return seasonalBookings;
  }

  private calculatePriceSensitivity(bookingHistory: Booking[]): 'low' | 'medium' | 'high' {
    if (bookingHistory.length < 3) return 'medium';

    const prices = bookingHistory.map(b => b.total_amount).sort((a, b) => a - b);
    const priceRange = prices[prices.length - 1] - prices[0];
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

    const priceVariability = priceRange / avgPrice;

    if (priceVariability < 0.2) return 'low';
    if (priceVariability < 0.5) return 'medium';
    return 'high';
  }

  private calculatePreferenceFeatures(bookingHistory: Booking[], journeyEvents: any[]) {
    return {
      preferredServiceCategories: this.extractServiceCategories(bookingHistory),
      interactionPreferences: this.analyzeInteractionPreferences(journeyEvents),
      contentPreferences: this.analyzeContentPreferences(journeyEvents),
      devicePreferences: this.analyzeDevicePreferences(journeyEvents)
    };
  }

  private extractServiceCategories(bookingHistory: Booking[]): string[] {
    // Simplified - would join with services table
    return bookingHistory.map(b => b.service_id.substring(0, 10)).slice(0, 5);
  }

  private analyzeInteractionPreferences(journeyEvents: any[]): any {
    const interactionTypes: Record<string, number> = {};

    journeyEvents.forEach(event => {
      interactionTypes[event.event_type] = (interactionTypes[event.event_type] || 0) + 1;
    });

    return interactionTypes;
  }

  private analyzeContentPreferences(journeyEvents: any[]): string[] {
    const contentTypes = journeyEvents
      .filter(e => e.event_category === 'content')
      .map(e => e.event_name);

    return [...new Set(contentTypes)];
  }

  private analyzeDevicePreferences(journeyEvents: any[]): Record<string, number> {
    const deviceCounts: Record<string, number> = {};

    journeyEvents.forEach(event => {
      const device = event.properties?.device_type || 'unknown';
      deviceCounts[device] = (deviceCounts[device] || 0) + 1;
    });

    return deviceCounts;
  }

  private calculateTemporalFeatures(bookingHistory: Booking[]) {
    const now = new Date();
    const lastBooking = bookingHistory.length > 0 ? new Date(bookingHistory[0].created_at) : null;

    return {
      daysSinceLastBooking: lastBooking ? Math.floor((now.getTime() - lastBooking.getTime()) / (1000 * 60 * 60 * 24)) : 999,
      bookingRecencyScore: lastBooking ? Math.exp(-Math.floor((now.getTime() - lastBooking.getTime()) / (1000 * 60 * 60 * 24)) / 30) : 0,
      preferredBookingFrequency: this.calculatePreferredFrequency(bookingHistory),
      seasonalPreferences: this.calculateSeasonalPreferences(bookingHistory)
    };
  }

  private calculatePreferredFrequency(bookingHistory: Booking[]): string {
    if (bookingHistory.length < 2) return 'unknown';

    const intervals: number[] = [];
    for (let i = 1; i < bookingHistory.length; i++) {
      const current = new Date(bookingHistory[i - 1].created_at);
      const previous = new Date(bookingHistory[i].created_at);
      intervals.push((current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24));
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

    if (avgInterval <= 7) return 'weekly';
    if (avgInterval <= 14) return 'bi_weekly';
    if (avgInterval <= 30) return 'monthly';
    if (avgInterval <= 90) return 'quarterly';
    return 'occasional';
  }

  private calculateSeasonalPreferences(bookingHistory: Booking[]): Record<string, number> {
    const preferences = {
      spring: 0,
      summer: 0,
      autumn: 0,
      winter: 0
    };

    const totalBookings = bookingHistory.length;
    if (totalBookings === 0) return preferences;

    bookingHistory.forEach(booking => {
      const month = new Date(booking.created_at).getMonth();
      if (month >= 2 && month <= 4) preferences.spring++;
      else if (month >= 5 && month <= 7) preferences.summer++;
      else if (month >= 8 && month <= 10) preferences.autumn++;
      else preferences.winter++;
    });

    // Convert to percentages
    Object.keys(preferences).forEach(season => {
      preferences[season] = preferences[season] / totalBookings;
    });

    return preferences;
  }

  private calculateMonetaryFeatures(bookingHistory: Booking[]) {
    if (bookingHistory.length === 0) {
      return {
        averageOrderValue: 0,
        totalLifetimeValue: 0,
        priceSensitivity: 'medium',
        preferredPriceRange: { min: 0, max: 1000 },
        valueSegment: 'standard'
      };
    }

    const totalRevenue = bookingHistory.reduce((sum, b) => sum + b.total_amount, 0);
    const averageOrderValue = totalRevenue / bookingHistory.length;
    const prices = bookingHistory.map(b => b.total_amount).sort((a, b) => a - b);

    return {
      averageOrderValue,
      totalLifetimeValue: totalRevenue,
      priceSensitivity: this.calculatePriceSensitivity(bookingHistory),
      preferredPriceRange: {
        min: prices[0],
        max: prices[prices.length - 1]
      },
      valueSegment: this.determineValueSegment(averageOrderValue)
    };
  }

  private determineValueSegment(averageOrderValue: number): string {
    if (averageOrderValue >= 1000) return 'premium';
    if (averageOrderValue >= 500) return 'high_value';
    if (averageOrderValue >= 200) return 'standard';
    return 'budget_conscious';
  }

  private calculateSatisfactionFeatures(satisfactionData: any[]) {
    if (satisfactionData.length === 0) {
      return {
        averageSatisfaction: 5,
        satisfactionTrend: 'stable',
        preferredServiceRatings: {},
        feedbackThemes: []
      };
    }

    const averageSatisfaction = satisfactionData.reduce((sum, s) => sum + (s.overall_satisfaction || 5), 0) / satisfactionData.length;
    const satisfactionTrend = this.calculateSatisfactionTrend(satisfactionData);
    const preferredServiceRatings = this.extractServiceRatings(satisfactionData);
    const feedbackThemes = this.extractFeedbackThemes(satisfactionData);

    return {
      averageSatisfaction,
      satisfactionTrend,
      preferredServiceRatings,
      feedbackThemes
    };
  }

  private calculateSatisfactionTrend(satisfactionData: any[]): 'improving' | 'stable' | 'declining' {
    if (satisfactionData.length < 3) return 'stable';

    const recent = satisfactionData.slice(0, 2);
    const older = satisfactionData.slice(2, 4);

    const recentAvg = recent.reduce((sum, s) => sum + (s.overall_satisfaction || 5), 0) / recent.length;
    const olderAvg = older.length > 0 ? older.reduce((sum, s) => sum + (s.overall_satisfaction || 5), 0) / older.length : recentAvg;

    if (recentAvg > olderAvg + 0.5) return 'improving';
    if (recentAvg < olderAvg - 0.5) return 'declining';
    return 'stable';
  }

  private extractServiceRatings(satisfactionData: any[]): Record<string, number> {
    const ratings: Record<string, number> = {};

    satisfactionData.forEach(satisfaction => {
      if (satisfaction.service_id) {
        ratings[satisfaction.service_id] = satisfaction.overall_satisfaction || 5;
      }
    });

    return ratings;
  }

  private extractFeedbackThemes(satisfactionData: any[]): string[] {
    const themes: string[] = [];

    satisfactionData.forEach(satisfaction => {
      if (satisfaction.feedback_keywords && Array.isArray(satisfaction.feedback_keywords)) {
        themes.push(...satisfaction.feedback_keywords);
      }
    });

    return [...new Set(themes)];
  }

  private calculateContextualFeatures(userId: string) {
    return {
      currentSeason: this.getCurrentSeason(),
      currentDayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
      currentTimeOfDay: this.getTimeOfDay(new Date()),
      currentLocation: 'Warsaw', // Default for this platform
      weatherCondition: 'unknown', // Would integrate with weather API
      localEvents: [], // Would integrate with events API
      competitorActivity: [] // Would integrate with competitive intelligence
    };
  }

  private getCurrentSeason(): string {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }

  private getTimeOfDay(date: Date): string {
    const hour = date.getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  private async generateServiceRecommendations(
    userId: string,
    userFeatures: any,
    availableServices: Service[],
    model: RecommendationModel,
    context?: PersonalizationContext
  ): Promise<PersonalizedService[]> {
    const recommendations: PersonalizedService[] = [];

    // Generate collaborative filtering recommendations
    if (model.modelType === 'collaborative_filtering' || model.modelType === 'hybrid') {
      const collaborativeRecs = await this.generateCollaborativeRecommendations(
        userId, userFeatures, availableServices
      );
      recommendations.push(...collaborativeRecs);
    }

    // Generate content-based recommendations
    if (model.modelType === 'content_based' || model.modelType === 'hybrid') {
      const contentBasedRecs = await this.generateContentBasedRecommendations(
        userFeatures, availableServices
      );
      recommendations.push(...contentBasedRecs);
    }

    // Generate contextual recommendations
    const contextualRecs = this.generateContextualRecommendations(userFeatures, availableServices, context);
    recommendations.push(...contextualRecs);

    // Generate trending recommendations
    const trendingRecs = await this.generateTrendingRecommendations(availableServices);
    recommendations.push(...trendingRecs);

    // Remove duplicates and sort by score
    const uniqueRecommendations = this.deduplicateRecommendations(recommendations);
    return uniqueRecommendations
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, 10); // Top 10 recommendations
  }

  private async generateCollaborativeRecommendations(
    userId: string,
    userFeatures: any,
    availableServices: Service[]
  ): Promise<PersonalizedService[]> {
    // Simplified collaborative filtering
    // In production, this would use actual user-user and item-item similarity algorithms

    const recommendations: PersonalizedService[] = [];

    // Find similar users based on behavioral features
    const similarUsers = await this.findSimilarUsers(userId, userFeatures);

    // Get services booked by similar users
    const similarUserServices = await this.getServicesBookedBySimilarUsers(similarUsers);

    // Score services based on similar user preferences
    similarUserServices.forEach(service => {
      const score = this.calculateCollaborativeScore(service, similarUsers, userFeatures);

      if (score > 0.3) { // Threshold for recommendation
        recommendations.push({
          serviceId: service.id,
          serviceName: service.title,
          recommendationScore: score,
          recommendationType: 'collaborative',
          reasons: [{
            type: 'social_proof',
            description: 'Recommended based on similar customers',
            confidence: score,
            evidence: [`${similarUsers.length} similar customers booked this service`]
          }],
          personalizedDescription: this.generatePersonalizedDescription(service, userFeatures, 'collaborative'),
          urgencyScore: this.calculateUrgencyScore(service, userFeatures),
          relevanceScore: score,
          crossSellOpportunities: [],
          upsellOpportunities: [],
          bundleSuggestions: []
        });
      }
    });

    return recommendations;
  }

  private async findSimilarUsers(userId: string, userFeatures: any): Promise<string[]> {
    // Simplified similarity search
    // In production, this would use vector similarity or clustering algorithms

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .neq('id', userId)
      .limit(50);

    return profiles?.map(p => p.id) || [];
  }

  private async getServicesBookedBySimilarUsers(similarUserIds: string[]): Promise<Service[]> {
    if (similarUserIds.length === 0) return [];

    const { data: bookings } = await supabase
      .from('bookings')
      .select('service_id')
      .in('user_id', similarUserIds)
      .eq('status', 'completed');

    if (!bookings || bookings.length === 0) return [];

    const serviceIds = [...new Set(bookings.map(b => b.service_id))];

    const { data: services } = await supabase
      .from('services')
      .select('*')
      .in('id', serviceIds)
      .eq('is_active', true);

    return services || [];
  }

  private calculateCollaborativeScore(service: Service, similarUsers: string[], userFeatures: any): number {
    // Simplified collaborative scoring
    // In production, this would use sophisticated similarity metrics

    let score = 0.5; // Base score

    // Boost based on service popularity among similar users
    score += 0.2;

    // Boost based on user's service type preferences
    if (userFeatures.behavioral.preferredServiceTypes.includes(service.service_type)) {
      score += 0.3;
    }

    // Boost based on price range match
    const userPriceRange = userFeatures.monetary.preferredPriceRange;
    if (service.price >= userPriceRange.min && service.price <= userPriceRange.max) {
      score += 0.2;
    }

    return Math.min(1, score);
  }

  private async generateContentBasedRecommendations(
    userFeatures: any,
    availableServices: Service[]
  ): Promise<PersonalizedService[]> {
    const recommendations: PersonalizedService[] = [];

    availableServices.forEach(service => {
      const score = this.calculateContentBasedScore(service, userFeatures);

      if (score > 0.4) { // Threshold for recommendation
        recommendations.push({
          serviceId: service.id,
          serviceName: service.title,
          recommendationScore: score,
          recommendationType: 'content_based',
          reasons: [{
            type: 'personal_history',
            description: 'Matches your preferences and booking history',
            confidence: score,
            evidence: [`Service type: ${service.service_type}`, `Price range: ${service.price} PLN`]
          }],
          personalizedDescription: this.generatePersonalizedDescription(service, userFeatures, 'content_based'),
          urgencyScore: this.calculateUrgencyScore(service, userFeatures),
          relevanceScore: score,
          crossSellOpportunities: [],
          upsellOpportunities: [],
          bundleSuggestions: []
        });
      }
    });

    return recommendations;
  }

  private calculateContentBasedScore(service: Service, userFeatures: any): number {
    let score = 0;

    // Service type match
    if (userFeatures.behavioral.preferredServiceTypes.includes(service.service_type)) {
      score += 0.4;
    }

    // Price range match
    const userPriceRange = userFeatures.monetary.preferredPriceRange;
    if (service.price >= userPriceRange.min && service.price <= userPriceRange.max) {
      score += 0.3;
    }

    // Category match
    if (userFeatures.preferences.preferredServiceCategories.some(cat =>
      service.category && service.category.includes(cat)
    )) {
      score += 0.2;
    }

    // Seasonal relevance
    const currentSeason = userFeatures.contextual.currentSeason;
    if (this.isServiceSeasonallyRelevant(service, currentSeason)) {
      score += 0.1;
    }

    return Math.min(1, score);
  }

  private isServiceSeasonallyRelevant(service: Service, season: string): boolean {
    // Simplified seasonal relevance check
    const seasonalServices = {
      spring: ['lips', 'brows', 'preparation'],
      summer: ['body', 'preparation'],
      autumn: ['glutes', 'fitness'],
      winter: ['wellness', 'maintenance']
    };

    const serviceKeywords = seasonalServices[season as keyof typeof seasonalServices] || [];
    return serviceKeywords.some(keyword =>
      service.title.toLowerCase().includes(keyword) ||
      service.description?.toLowerCase().includes(keyword)
    );
  }

  private generateContextualRecommendations(
    userFeatures: any,
    availableServices: Service[],
    context?: PersonalizationContext
  ): PersonalizedService[] {
    const recommendations: PersonalizedService[] = [];

    const currentSeason = userFeatures.contextual.currentSeason;
    const timeOfDay = userFeatures.contextual.currentTimeOfDay;

    availableServices.forEach(service => {
      let score = 0;
      let reasons: RecommendationReason[] = [];

      // Seasonal relevance
      if (this.isServiceSeasonallyRelevant(service, currentSeason)) {
        score += 0.3;
        reasons.push({
          type: 'seasonal',
          description: `Perfect for ${currentSeason}`,
          confidence: 0.8,
          evidence: [`${currentSeason} season recommendation`]
        });
      }

      // Time of day relevance
      if (this.isServiceTimeRelevant(service, timeOfDay)) {
        score += 0.2;
        reasons.push({
          type: 'contextual',
          description: `Great for ${timeOfDay} appointments`,
          confidence: 0.7,
          evidence: [`${timeOfDay} timing recommendation`]
        });
      }

      // Context-specific scoring
      if (context) {
        if (context.purpose === 'special_occasion' && this.isServiceSpecialOccasion(service)) {
          score += 0.4;
          reasons.push({
            type: 'contextual',
            description: 'Perfect for special occasions',
            confidence: 0.9,
            evidence: ['Special occasion matching']
          });
        }

        if (context.budget && service.price <= context.budget) {
          score += 0.2;
          reasons.push({
            type: 'contextual',
            description: 'Fits within your budget',
            confidence: 0.8,
            evidence: [`Budget: ${context.budget} PLN`]
          });
        }
      }

      if (score > 0.3) {
        recommendations.push({
          serviceId: service.id,
          serviceName: service.title,
          recommendationScore: score,
          recommendationType: 'content_based',
          reasons,
          personalizedDescription: this.generatePersonalizedDescription(service, userFeatures, 'contextual'),
          urgencyScore: this.calculateUrgencyScore(service, userFeatures),
          relevanceScore: score,
          crossSellOpportunities: [],
          upsellOpportunities: [],
          bundleSuggestions: []
        });
      }
    });

    return recommendations;
  }

  private isServiceTimeRelevant(service: Service, timeOfDay: string): boolean {
    // Simplified time relevance check
    const timeRelevantServices = {
      morning: ['preparation', 'start', 'energy'],
      afternoon: ['maintenance', 'relaxation'],
      evening: ['prep', 'special'],
      night: ['relaxation', 'wellness']
    };

    const keywords = timeRelevantServices[timeOfDay as keyof typeof timeRelevantServices] || [];
    return keywords.some(keyword =>
      service.title.toLowerCase().includes(keyword) ||
      service.description?.toLowerCase().includes(keyword)
    );
  }

  private isServiceSpecialOccasion(service: Service): boolean {
    const specialKeywords = ['bridal', 'wedding', 'special', 'event', 'occasion'];
    return specialKeywords.some(keyword =>
      service.title.toLowerCase().includes(keyword) ||
      service.description?.toLowerCase().includes(keyword) ||
      service.tags?.some(tag => tag.toLowerCase().includes(keyword))
    );
  }

  private async generateTrendingRecommendations(availableServices: Service[]): Promise<PersonalizedService[]> {
    // Simplified trending calculation
    // In production, this would analyze recent booking trends, social media trends, etc.

    const recommendations: PersonalizedService[] = [];

    // Mock trending services (would be calculated from real data)
    const trendingServices = availableServices.slice(0, 5);

    trendingServices.forEach((service, index) => {
      const score = 0.8 - (index * 0.1); // Decreasing scores

      recommendations.push({
        serviceId: service.id,
        serviceName: service.title,
        recommendationScore: score,
        recommendationType: 'trending',
        reasons: [{
          type: 'trending',
          description: 'Popular this month',
          confidence: 0.7,
          evidence: ['High booking volume', 'Positive customer feedback']
        }],
        personalizedDescription: `Join many customers enjoying ${service.title}`,
        urgencyScore: 0.6,
        relevanceScore: score,
        crossSellOpportunities: [],
        upsellOpportunities: [],
        bundleSuggestions: []
      });
    });

    return recommendations;
  }

  private generatePersonalizedDescription(
    service: Service,
    userFeatures: any,
    recommendationType: string
  ): string {
    let description = service.description || service.title;

    // Add personalization based on user features
    if (userFeatures.behavioral.preferredServiceTypes.includes(service.service_type)) {
      description += ` Based on your interest in ${service.service_type} services.`;
    }

    if (recommendationType === 'collaborative') {
      description += ' Customers like you also love this service.';
    } else if (recommendationType === 'trending') {
      description += ' This is one of our most popular services this month.';
    }

    return description;
  }

  private calculateUrgencyScore(service: Service, userFeatures: any): number {
    let urgency = 0.5;

    // Seasonal urgency
    const currentSeason = userFeatures.contextual.currentSeason;
    if (this.isServiceSeasonallyRelevant(service, currentSeason)) {
      urgency += 0.2;
    }

    // Price urgency (if there's a special offer)
    if (service.metadata?.special_offer) {
      urgency += 0.3;
    }

    // Availability urgency (if limited slots)
    urgency += 0.1; // Would check actual availability

    return Math.min(1, urgency);
  }

  private deduplicateRecommendations(recommendations: PersonalizedService[]): PersonalizedService[] {
    const seen = new Set<string>();
    const unique: PersonalizedService[] = [];

    recommendations.forEach(rec => {
      if (!seen.has(rec.serviceId)) {
        seen.add(rec.serviceId);
        unique.push(rec);
      } else {
        // Merge with existing recommendation
        const existing = unique.find(r => r.serviceId === rec.serviceId);
        if (existing && rec.recommendationScore > existing.recommendationScore) {
          existing.recommendationScore = rec.recommendationScore;
          existing.recommendationType = rec.recommendationType;
          existing.reasons.push(...rec.reasons);
        }
      }
    });

    return unique;
  }

  private async generateContentRecommendations(
    userFeatures: any,
    personalizedServices: PersonalizedService[]
  ): Promise<ContentRecommendation[]> {
    const recommendations: ContentRecommendation[] = [];

    // Generate educational content based on recommended services
    personalizedServices.forEach(service => {
      recommendations.push({
        contentType: 'blog',
        title: `How to Prepare for Your ${service.serviceName}`,
        description: `Everything you need to know before your ${service.serviceName.toLowerCase()} appointment`,
        url: `/blog/prepare-${service.serviceId}`,
        relevanceScore: service.relevanceScore * 0.8,
        priority: 'medium',
        targetEmotion: 'informed',
        personalizationNotes: `Based on your interest in ${service.serviceName}`
      });
    });

    // Generate trending content
    recommendations.push({
      contentType: 'video',
      title: 'Latest Beauty Trends in Warsaw',
      description: 'Discover the hottest beauty treatments this season',
      url: '/video/trends-warsaw',
      relevanceScore: 0.7,
      priority: 'high',
      targetEmotion: 'inspired',
      personalizationNotes: 'Popular content in your area'
    });

    return recommendations.slice(0, 5);
  }

  private async generateTimingRecommendations(
    bookingHistory: Booking[],
    userFeatures: any
  ): Promise<TimingRecommendation> {
    const optimalBookingTimes = this.calculateOptimalBookingTimes(bookingHistory);
    const seasonalPreferences = this.calculateSeasonalPreferences(bookingHistory);
    const reminderTiming = this.calculateReminderTiming(userFeatures);
    const followUpTiming = this.calculateFollowUpTiming(userFeatures);

    return {
      optimalBookingTimes,
      seasonalPreferences,
      reminderTiming,
      followUpTiming
    };
  }

  private calculateOptimalBookingTimes(bookingHistory: Booking[]): OptimalTimeSlot[] {
    const timeSlotCounts: Record<string, { count: number; satisfaction: number }> = {};

    bookingHistory.forEach(booking => {
      const date = new Date(booking.created_at);
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
      const timeSlot = this.getTimeSlot(date.getHours());
      const key = `${dayOfWeek}-${timeSlot}`;

      if (!timeSlotCounts[key]) {
        timeSlotCounts[key] = { count: 0, satisfaction: 0 };
      }
      timeSlotCounts[key].count++;
    });

    return Object.entries(timeSlotCounts)
      .map(([key, data]) => {
        const [dayOfWeek, timeSlot] = key.split('-');
        return {
          dayOfWeek,
          timeSlot,
          preferenceScore: data.count / bookingHistory.length,
          availabilityScore: 0.8, // Would check real availability
          historicalSuccess: 0.9,
          recommendedAction: `Book on ${dayOfWeek} ${timeSlot}`
        };
      })
      .sort((a, b) => b.preferenceScore - a.preferenceScore)
      .slice(0, 5);
  }

  private calculateSeasonalPreferences(bookingHistory: Booking[]): SeasonalPreference[] {
    const seasonalData: Record<string, { bookings: number; revenue: number }> = {
      spring: { bookings: 0, revenue: 0 },
      summer: { bookings: 0, revenue: 0 },
      autumn: { bookings: 0, revenue: 0 },
      winter: { bookings: 0, revenue: 0 }
    };

    bookingHistory.forEach(booking => {
      const month = new Date(booking.created_at).getMonth();
      let season: string;

      if (month >= 2 && month <= 4) season = 'spring';
      else if (month >= 5 && month <= 7) season = 'summer';
      else if (month >= 8 && month <= 10) season = 'autumn';
      else season = 'winter';

      seasonalData[season].bookings++;
      seasonalData[season].revenue += booking.total_amount;
    });

    return Object.entries(seasonalData).map(([season, data]) => ({
      season,
      preferredServices: [], // Would analyze actual service preferences per season
      averageBookingValue: data.bookings > 0 ? data.revenue / data.bookings : 0,
      bookingFrequency: data.bookings / bookingHistory.length,
      notes: `${data.bookings} bookings in ${season}`
    }));
  }

  private calculateReminderTiming(userFeatures: any): ReminderTiming[] {
    return [
      {
        triggerEvent: 'booking_confirmed',
        optimalTiming: 24,
        messageContent: 'Prepare for your upcoming appointment',
        channel: 'email',
        successProbability: 0.8
      },
      {
        triggerEvent: 'booking_confirmed',
        optimalTiming: 2,
        messageContent: 'Reminder: Your appointment is tomorrow',
        channel: 'sms',
        successProbability: 0.9
      },
      {
        triggerEvent: 'service_completed',
        optimalTiming: 168,
        messageContent: 'Time to book your next appointment?',
        channel: 'email',
        successProbability: 0.6
      }
    ];
  }

  private calculateFollowUpTiming(userFeatures: any): FollowUpTiming[] {
    return [
      {
        postServiceTime: 1,
        followUpType: 'satisfaction',
        recommendedAction: 'Send satisfaction survey',
        expectedConversion: 0.7
      },
      {
        postServiceTime: 7,
        followUpType: 'rebooking',
        recommendedAction: 'Schedule next appointment',
        expectedConversion: 0.4
      },
      {
        postServiceTime: 30,
        followUpType: 'review',
        recommendedAction: 'Request service review',
        expectedConversion: 0.3
      }
    ];
  }

  private async generatePriceRecommendations(
    personalizedServices: PersonalizedService[],
    userFeatures: any,
    context?: PersonalizationContext
  ): Promise<PriceRecommendation[]> {
    const recommendations: PriceRecommendation[] = [];

    personalizedServices.forEach(service => {
      let recommendedPrice = service.serviceId ? 500 : 300; // Mock price
      let discountPercentage = 0;
      let reasoning = '';

      // Price sensitivity based adjustments
      if (userFeatures.monetary.priceSensitivity === 'high') {
        discountPercentage = 15;
        reasoning = 'Price-sensitive customer discount';
      } else if (userFeatures.monetary.priceSensitivity === 'medium') {
        discountPercentage = 10;
        reasoning = 'Standard promotional discount';
      }

      // Loyalty based adjustments
      if (userFeatures.behavioral.loyaltyScore > 0.8) {
        discountPercentage += 5;
        reasoning += ' + Loyalty reward';
      }

      // Seasonal adjustments
      if (userFeatures.contextual.currentSeason === 'winter') {
        discountPercentage += 5;
        reasoning += ' + Winter promotion';
      }

      recommendedPrice = recommendedPrice * (1 - discountPercentage / 100);

      recommendations.push({
        serviceId: service.serviceId,
        currentPrice: recommendedPrice / (1 - discountPercentage / 100),
        recommendedPrice,
        discountPercentage,
        reasoning,
        elasticityScore: 0.7, // Mock elasticity
        competitorComparison: [], // Would fetch real competitor data
        urgencyIndicators: []
      });
    });

    return recommendations;
  }

  private async determineCommunicationPreferences(
    userProfile: any,
    journeyEvents: any[]
  ): Promise<CommunicationPreferences> {
    // Analyze user's preferred communication channels from journey events
    const channelCounts: Record<string, number> = {};
    journeyEvents.forEach(event => {
      if (event.channel) {
        channelCounts[event.channel] = (channelCounts[event.channel] || 0) + 1;
      }
    });

    const preferredChannels = Object.entries(channelCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([channel]) => channel as any);

    return {
      preferredChannels: preferredChannels.length > 0 ? preferredChannels : ['email'],
      optimalFrequency: {
        email: 2,
        sms: 1,
        push: 3
      },
      contentTypes: ['promotional', 'educational'],
      tone: 'professional_friendly',
      personalizationLevel: 'high',
      privacyPreferences: {
        dataSharing: true,
        trackingConsent: true,
        personalizationConsent: true
      }
    };
  }

  private calculatePersonalizationScore(
    services: PersonalizedService[],
    content: ContentRecommendation[],
    timing: TimingRecommendation
  ): number {
    const serviceScore = services.length > 0 ?
      services.reduce((sum, s) => sum + s.recommendationScore, 0) / services.length : 0;

    const contentScore = content.length > 0 ?
      content.reduce((sum, c) => sum + c.relevanceScore, 0) / content.length : 0;

    const timingScore = timing.optimalBookingTimes.length > 0 ?
      timing.optimalBookingTimes.reduce((sum, t) => sum + t.preferenceScore, 0) / timing.optimalBookingTimes.length : 0;

    return (serviceScore * 0.5 + contentScore * 0.3 + timingScore * 0.2);
  }

  private async savePersonalizationProfile(
    userId: string,
    userFeatures: any,
    result: PersonalizationResult
  ): Promise<void> {
    const { error } = await supabase
      .from('personalization_profiles')
      .upsert({
        user_id: userId,
        preference_cluster: this.determinePreferenceCluster(userFeatures),
        behavioral_segment: this.determineBehavioralSegment(userFeatures),
        demographic_segment: userFeatures.demographics.location,
        preferred_service_types: userFeatures.behavioral.preferredServiceTypes,
        preferred_time_slots: result.timingRecommendations.optimalBookingTimes.map(t => `${t.dayOfWeek}-${t.timeSlot}`),
        preferred_locations: ['Warsaw'], // Would be dynamic
        price_sensitivity_level: userFeatures.monetary.priceSensitivity,
        booking_patterns: userFeatures.behavioral.bookingPatterns,
        interaction_patterns: userFeatures.preferences.interactionPreferences,
        content_preferences: userFeatures.preferences.contentPreferences,
        collaborative_filtering_weights: { /* simplified */ },
        content_based_weights: { /* simplified */ },
        hybrid_weights: { /* simplified */ },
        recommendation_ctr: result.overallPersonalizationScore,
        personalization_lift: result.overallPersonalizationScore * 20 // Mock lift percentage
      });

    if (error) {
      console.error('Failed to save personalization profile:', error);
    }
  }

  private determinePreferenceCluster(userFeatures: any): string {
    const { behavioral, monetary, satisfaction } = userFeatures;

    if (behavioral.bookingFrequency > 2 && monetary.valueSegment === 'premium') {
      return 'vip_enthusiast';
    } else if (behavioral.bookingFrequency > 1 && satisfaction.averageSatisfaction > 8) {
      return 'loyal_advocate';
    } else if (monetary.priceSensitivity === 'high') {
      return 'value_seeker';
    } else if (behavioral.serviceDiversity > 0.7) {
      return 'experimenter';
    } else {
      return 'standard';
    }
  }

  private determineBehavioralSegment(userFeatures: any): string {
    const { behavioral, temporal } = userFeatures;

    if (behavioral.bookingFrequency > 3) {
      return 'power_user';
    } else if (temporal.daysSinceLastBooking < 14) {
      return 'active';
    } else if (temporal.daysSinceLastBooking < 60) {
      return 'returning';
    } else {
      return 'dormant';
    }
  }

  async trackRecommendationPerformance(
    userId: string,
    recommendationId: string,
    action: 'clicked' | 'converted' | 'dismissed',
    metadata?: Record<string, any>
  ): Promise<void> {
    const { error } = await supabase
      .from('service_recommendations')
      .update({
        [action === 'clicked' ? 'clicked_at' :
         action === 'converted' ? 'converted_at' : null]: new Date().toISOString(),
        feedback_score: action === 'dismissed' ? 1 : undefined
      })
      .eq('user_id', userId)
      .eq('id', recommendationId);

    if (error) {
      throw new Error(`Failed to track recommendation performance: ${error.message}`);
    }
  }

  async getPersonalizationMetrics(userId: string): Promise<PersonalizationMetrics> {
    // Get user's recommendation performance
    const { data: recommendations } = await supabase
      .from('service_recommendations')
      .select('*')
      .eq('user_id', userId);

    const totalRecommendations = recommendations?.length || 0;
    const clickedRecommendations = recommendations?.filter(r => r.clicked_at).length || 0;
    const convertedRecommendations = recommendations?.filter(r => r.converted_at).length || 0;

    return {
      clickThroughRate: totalRecommendations > 0 ? clickedRecommendations / totalRecommendations : 0,
      conversionRate: clickedRecommendations > 0 ? convertedRecommendations / clickedRecommendations : 0,
      averageOrderValue: 0, // Would calculate from actual bookings
      customerSatisfaction: 0, // Would get from satisfaction data
      recommendationAccuracy: 0.8, // Mock value
      personalizationLift: 25, // Mock percentage
      churnReduction: 15, // Mock percentage
      engagementIncrease: 30 // Mock percentage
    };
  }
}

export interface PersonalizationContext {
  purpose?: 'routine' | 'special_occasion' | 'gift' | 'first_time' | 'maintenance';
  budget?: number;
  location?: string;
  timeConstraint?: number; // days
  companions?: number;
  specificConcerns?: string[];
}

export const personalizationEngine = new PersonalizationEngine();