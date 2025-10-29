import { supabase } from '@/integrations/supabase/client';

import { aiService } from './config';

// Advanced recommendation algorithms
export interface UserBehaviorData {
  userId: string;
  viewHistory: Array<{
    serviceId: string;
    timestamp: string;
    duration: number;
    source: string;
  }>;
  bookingHistory: Array<{
    serviceId: string;
    timestamp: string;
    rating?: number;
    review?: string;
    category: string;
  }>;
  searchHistory: Array<{
    query: string;
    timestamp: string;
    resultsClicked: string[];
  }>;
  preferences: {
    categories: string[];
    priceRange: { min: number; max: number };
    preferredTimes: string[];
    location: string;
    language: string;
  };
  demographics?: {
    age?: number;
    gender?: string;
    location?: string;
    interests?: string[];
  };
}

export interface RecommendationWeights {
  collaborative: number; // 0-1
  content: number; // 0-1
  contextual: number; // 0-1
  popularity: number; // 0-1
  seasonal: number; // 0-1
  personal: number; // 0-1
}

export interface AdvancedRecommendation {
  serviceId: string;
  score: number; // 0-1
  confidence: number; // 0-1
  reasoning: {
    collaborative?: string;
    content?: string;
    contextual?: string;
    popularity?: string;
    seasonal?: string;
    personal?: string;
  };
  metadata: {
    algorithm: string;
    version: string;
    generatedAt: string;
    expiresAt: string;
  };
}

export class AdvancedRecommendationEngine {
  private static instance: AdvancedRecommendationEngine;
  private weights: RecommendationWeights = {
    collaborative: 0.25,
    content: 0.20,
    contextual: 0.20,
    popularity: 0.15,
    seasonal: 0.10,
    personal: 0.10,
  };

  static getInstance(): AdvancedRecommendationEngine {
    if (!AdvancedRecommendationEngine.instance) {
      AdvancedRecommendationEngine.instance = new AdvancedRecommendationEngine();
    }
    return AdvancedRecommendationEngine.instance;
  }

  async generatePersonalizedRecommendations(
    userId: string,
    limit: number = 10,
    context?: {
      currentPage?: string;
      timeOfDay?: string;
      season?: string;
      specialOffers?: string[];
    }
  ): Promise<AdvancedRecommendation[]> {
    try {
      // Fetch user behavior data
      const userData = await this.getUserBehaviorData(userId);

      // Fetch all available services
      const { data: services } = await supabase
        .from('services')
        .select('*')
        .eq('active', true);

      if (!services || services.length === 0) {
        return [];
      }

      // Generate recommendations using multiple algorithms
      const recommendations: AdvancedRecommendation[] = [];

      for (const service of services) {
        const score = await this.calculateServiceScore(service, userData, context);

        if (score.score > 0.3) { // Only include relevant recommendations
          recommendations.push({
            serviceId: service.id,
            ...score,
            metadata: {
              algorithm: 'hybrid-v2',
              version: '2.0.0',
              generatedAt: new Date().toISOString(),
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
            },
          });
        }
      }

      // Sort by score and limit
      return recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
      return [];
    }
  }

  private async calculateServiceScore(
    service: any,
    userData: UserBehaviorData,
    context?: any
  ): Promise<{
    score: number;
    confidence: number;
    reasoning: AdvancedRecommendation['reasoning'];
  }> {
    let totalScore = 0;
    const reasoning: AdvancedRecommendation['reasoning'] = {};
    let confidenceFactors = 0;

    // 1. Collaborative filtering
    const collaborativeScore = await this.calculateCollaborativeScore(service, userData);
    if (collaborativeScore.score > 0) {
      totalScore += collaborativeScore.score * this.weights.collaborative;
      reasoning.collaborative = collaborativeScore.reasoning;
      confidenceFactors++;
    }

    // 2. Content-based filtering
    const contentScore = this.calculateContentScore(service, userData);
    if (contentScore.score > 0) {
      totalScore += contentScore.score * this.weights.content;
      reasoning.content = contentScore.reasoning;
      confidenceFactors++;
    }

    // 3. Contextual scoring
    const contextualScore = this.calculateContextualScore(service, userData, context);
    if (contextualScore.score > 0) {
      totalScore += contextualScore.score * this.weights.contextual;
      reasoning.contextual = contextualScore.reasoning;
      confidenceFactors++;
    }

    // 4. Popularity scoring
    const popularityScore = await this.calculatePopularityScore(service);
    if (popularityScore.score > 0) {
      totalScore += popularityScore.score * this.weights.popularity;
      reasoning.popularity = popularityScore.reasoning;
      confidenceFactors++;
    }

    // 5. Seasonal scoring
    const seasonalScore = this.calculateSeasonalScore(service, context);
    if (seasonalScore.score > 0) {
      totalScore += seasonalScore.score * this.weights.seasonal;
      reasoning.seasonal = seasonalScore.reasoning;
      confidenceFactors++;
    }

    // 6. Personal preference scoring
    const personalScore = this.calculatePersonalScore(service, userData);
    if (personalScore.score > 0) {
      totalScore += personalScore.score * this.weights.personal;
      reasoning.personal = personalScore.reasoning;
      confidenceFactors++;
    }

    return {
      score: Math.min(totalScore, 1),
      confidence: confidenceFactors > 0 ? confidenceFactors / 6 : 0,
      reasoning,
    };
  }

  private async calculateCollaborativeScore(
    service: any,
    userData: UserBehaviorData
  ): Promise<{ score: number; reasoning: string }> {
    // Find similar users based on booking history
    const { data: similarUsers } = await supabase
      .from('bookings')
      .select('user_id, service_id')
      .in('service_id', userData.bookingHistory.map(b => b.serviceId));

    if (!similarUsers || similarUsers.length === 0) {
      return { score: 0, reasoning: '' };
    }

    // Calculate similarity score
    const userServices = new Set(userData.bookingHistory.map(b => b.serviceId));
    const similarUsersMap = new Map<string, number>();

    similarUsers.forEach(booking => {
      const similarity = userServices.has(booking.service_id) ? 1 : 0;
      similarUsersMap.set(booking.user_id, (similarUsersMap.get(booking.user_id) || 0) + similarity);
    });

    // Get recommendations from similar users
    const recommendations = await supabase
      .from('bookings')
      .select('service_id')
      .in('user_id', Array.from(similarUsersMap.keys()))
      .neq('service_id', service.id);

    const score = recommendations?.data?.filter(b => b.service_id === service.id).length || 0;
    const normalizedScore = Math.min(score / 10, 1); // Normalize to 0-1

    return {
      score: normalizedScore,
      reasoning: score > 0
        ? `${score} users with similar preferences booked this service`
        : 'No collaborative data available',
    };
  }

  private calculateContentScore(
    service: any,
    userData: UserBehaviorData
  ): { score: number; reasoning: string } {
    let score = 0;
    const reasons: string[] = [];

    // Category preference
    if (userData.preferences.categories.includes(service.category)) {
      score += 0.3;
      reasons.push('Matches preferred category');
    }

    // Price preference
    const priceInRange = service.price_pln >= userData.preferences.priceRange.min &&
                        service.price_pln <= userData.preferences.priceRange.max;
    if (priceInRange) {
      score += 0.3;
      reasons.push('Within preferred price range');
    }

    // Past category engagement
    const categoryEngagement = userData.bookingHistory.filter(
      b => b.category === service.category
    ).length;
    if (categoryEngagement > 0) {
      score += Math.min(categoryEngagement * 0.1, 0.4);
      reasons.push(`Booked ${categoryEngagement} services in this category before`);
    }

    return {
      score: Math.min(score, 1),
      reasoning: reasons.join(', ') || 'No strong content preferences match',
    };
  }

  private calculateContextualScore(
    service: any,
    userData: UserBehaviorData,
    context?: any
  ): { score: number; reasoning: string } {
    let score = 0;
    const reasons: string[] = [];

    // Time of day preferences
    if (context?.timeOfDay && userData.preferences.preferredTimes.includes(context.timeOfDay)) {
      score += 0.2;
      reasons.push('Available at preferred time');
    }

    // Location proximity
    if (userData.preferences.location && service.location) {
      // Simplified - would use geolocation in real implementation
      score += 0.2;
      reasons.push('Near your preferred location');
    }

    // Special offers
    if (context?.specialOffers?.includes(service.id)) {
      score += 0.3;
      reasons.push('Special discount available');
    }

    // Recently viewed
    const recentlyViewed = userData.viewHistory.find(
      v => v.serviceId === service.id &&
      Date.now() - new Date(v.timestamp).getTime() < 7 * 24 * 60 * 60 * 1000
    );
    if (recentlyViewed) {
      score += 0.3;
      reasons.push('Recently viewed');
    }

    return {
      score: Math.min(score, 1),
      reasoning: reasons.join(', ') || 'No specific context match',
    };
  }

  private async calculatePopularityScore(service: any): Promise<{ score: number; reasoning: string }> {
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id, rating')
      .eq('service_id', service.id);

    if (!bookings || bookings.length === 0) {
      return { score: 0, reasoning: 'No booking data available' };
    }

    const bookingCount = bookings.length;
    const avgRating = bookings.reduce((sum, b) => sum + (b.rating || 0), 0) / bookings.length;

    // Normalize booking count (assuming 100 bookings is max)
    const normalizedBookings = Math.min(bookingCount / 100, 1);

    // Rating bonus
    const ratingBonus = avgRating / 5;

    const score = (normalizedBookings * 0.7) + (ratingBonus * 0.3);

    return {
      score: Math.min(score, 1),
      reasoning: `Popular with ${bookingCount} bookings, ${avgRating.toFixed(1)} average rating`,
    };
  }

  private calculateSeasonalScore(service: any, context?: any): { score: number; reasoning: string } {
    const season = context?.season || this.getCurrentSeason();
    let score = 0;

    // Define seasonal preferences for different services
    const seasonalPreferences: Record<string, Record<string, number>> = {
      winter: {
        'beauty': 0.7, // People want beauty treatments for holidays/events
        'fitness': 0.9, // New Year resolutions
      },
      spring: {
        'beauty': 0.9, // Spring refresh
        'fitness': 0.8, // Summer body prep
      },
      summer: {
        'beauty': 0.6, // Vacation ready
        'fitness': 0.7, // Outdoor activities
      },
      autumn: {
        'beauty': 0.8, // Pre-holiday prep
        'fitness': 0.6, // Indoor season start
      },
    };

    score = seasonalPreferences[season]?.[service.category] || 0.5;

    return {
      score,
      reasoning: score > 0.7 ? 'High demand this season' : 'Seasonal preference moderate',
    };
  }

  private calculatePersonalScore(service: any, userData: UserBehaviorData): { score: number; reasoning: string } {
    let score = 0;
    const reasons: string[] = [];

    // Language preference
    if (userData.preferences.language === 'pl' && service.description_pl) {
      score += 0.2;
      reasons.push('Available in preferred language');
    }

    // Duration preference (based on average booking duration)
    const avgDuration = userData.bookingHistory.length > 0
      ? userData.bookingHistory.reduce((sum, b) => sum + (b.duration || 60), 0) / userData.bookingHistory.length
      : 60;

    if (Math.abs(service.duration_minutes - avgDuration) < 15) {
      score += 0.3;
      reasons.push('Preferred duration');
    }

    // Search history match
    const searchMatches = userData.searchHistory.filter(search =>
      search.query.toLowerCase().split(' ').some(word =>
        service.name.toLowerCase().includes(word) ||
        service.description?.toLowerCase().includes(word)
      )
    ).length;

    if (searchMatches > 0) {
      score += Math.min(searchMatches * 0.2, 0.5);
      reasons.push(`Matches ${searchMatches} previous searches`);
    }

    return {
      score: Math.min(score, 1),
      reasoning: reasons.join(', ') || 'No specific personal preferences match',
    };
  }

  private getCurrentSeason(): string {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }

  private async getUserBehaviorData(userId: string): Promise<UserBehaviorData> {
    // Fetch comprehensive user behavior data
    const [viewHistory, bookingHistory, searchHistory, userPrefs] = await Promise.all([
      this.fetchViewHistory(userId),
      this.fetchBookingHistory(userId),
      this.fetchSearchHistory(userId),
      this.fetchUserPreferences(userId),
    ]);

    return {
      userId,
      viewHistory: viewHistory || [],
      bookingHistory: bookingHistory || [],
      searchHistory: searchHistory || [],
      preferences: userPrefs || {
        categories: [],
        priceRange: { min: 0, max: 1000 },
        preferredTimes: [],
        location: '',
        language: 'en',
      },
    };
  }

  private async fetchViewHistory(userId: string) {
    // Implementation would fetch from analytics or view tracking table
    return [];
  }

  private async fetchBookingHistory(userId: string) {
    const { data } = await supabase
      .from('bookings')
      .select(`
        *,
        services(category, duration_minutes)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    return data?.map(booking => ({
      serviceId: booking.service_id,
      timestamp: booking.created_at,
      rating: booking.rating,
      category: booking.services?.category,
      duration: booking.services?.duration_minutes,
    })) || [];
  }

  private async fetchSearchHistory(userId: string) {
    // Implementation would fetch from search tracking
    return [];
  }

  private async fetchUserPreferences(userId: string) {
    const { data } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    return data;
  }

  // Machine learning model update
  async updateRecommendationModel(
    feedbackData: Array<{
      userId: string;
      serviceId: string;
      recommended: boolean;
      clicked: boolean;
      booked: boolean;
      rating?: number;
    }>
  ): Promise<void> {
    // Collect feedback for model improvement
    try {
      for (const feedback of feedbackData) {
        await supabase
          .from('recommendation_feedback')
          .insert({
            ...feedback,
            created_at: new Date().toISOString(),
          });
      }

      // In a real implementation, this would trigger a model retraining process
      console.log(`Collected ${feedbackData.length} feedback entries for model improvement`);
    } catch (error) {
      console.error('Failed to update recommendation model:', error);
    }
  }

  // A/B testing for recommendations
  async getABTestRecommendations(
    userId: string,
    testGroup: 'control' | 'variant_a' | 'variant_b'
  ): Promise<AdvancedRecommendation[]> {
    const baseRecommendations = await this.generatePersonalizedRecommendations(userId);

    if (testGroup === 'control') {
      return baseRecommendations;
    }

    // Apply different algorithms for variants
    if (testGroup === 'variant_a') {
      // Emphasize collaborative filtering more
      this.weights.collaborative = 0.4;
      this.weights.content = 0.2;
    } else if (testGroup === 'variant_b') {
      // Emphasize popularity more
      this.weights.popularity = 0.3;
      this.weights.collaborative = 0.2;
    }

    return this.generatePersonalizedRecommendations(userId);
  }
}

// Export singleton instance
export const advancedRecommendationEngine = AdvancedRecommendationEngine.getInstance();

// React hook for advanced recommendations
import { useQuery, useMutation } from '@tanstack/react-query';

export function useAdvancedRecommendations(userId: string) {
  const {
    data: recommendations,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['advanced-recommendations', userId],
    queryFn: () => advancedRecommendationEngine.generatePersonalizedRecommendations(userId),
    staleTime: 1000 * 60 * 15, // 15 minutes
  });

  const feedbackMutation = useMutation({
    mutationFn: (feedback: {
      serviceId: string;
      recommended: boolean;
      clicked: boolean;
      booked: boolean;
      rating?: number;
    }) => advancedRecommendationEngine.updateRecommendationModel([{
      userId,
      ...feedback,
    }]),
  });

  return {
    recommendations,
    isLoading,
    error,
    refetch,
    sendFeedback: feedbackMutation.mutateAsync,
  };
}