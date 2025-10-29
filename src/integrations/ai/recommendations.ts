import { aiService, isAIFeatureEnabled } from './config';

export interface UserProfile {
  id: string;
  preferences: {
    serviceCategories: string[];
    preferredTimes: string[];
    priceRange: { min: number; max: number };
    location: string;
    language: string;
  };
  history: {
    bookedServices: string[];
    cancelledServices: string[];
    ratings: { serviceId: string; rating: number }[];
    bookingFrequency: number;
    lastBooking: string;
  };
  behavior: {
    averageAdvanceBooking: number;
    preferredDuration: number;
    seasonalPreferences: string[];
    respondsToPromotions: boolean;
  };
}

export interface ServiceRecommendation {
  serviceId: string;
  serviceName: string;
  category: string;
  score: number; // 0-1
  reasoning: string[];
  price: number;
  duration: number;
  matchFactors: {
    category: number;
    price: number;
    time: number;
    location: number;
    popularity: number;
  };
}

export interface PersonalizedRecommendation {
  userId: string;
  services: ServiceRecommendation[];
  timeSlots: Array<{
    date: string;
    time: string;
    serviceId: string;
    confidence: number;
  }>;
  promotions: Array<{
    type: 'discount' | 'package' | 'upgrade';
    value: number;
    description: string;
    validUntil: string;
  }>;
  insights: string[];
}

export class AIRecommendationEngine {
  private userProfiles: Map<string, UserProfile> = new Map();
  private servicePopularity: Map<string, number> = new Map();
  private seasonalTrends: Map<string, number> = new Map();

  constructor() {
    this.loadPopularityData();
  }

  private async loadPopularityData() {
    // Load service popularity and seasonal trends
    // This would typically come from your analytics database
    try {
      console.log('Loading recommendation data...');
    } catch (error) {
      console.error('Failed to load recommendation data:', error);
    }
  }

  async generatePersonalizedRecommendations(userId: string): Promise<PersonalizedRecommendation> {
    if (!aiService || !isAIFeatureEnabled('RECOMMENDATIONS')) {
      throw new Error('AI recommendations are not available');
    }

    const userProfile = this.userProfiles.get(userId);
    if (!userProfile) {
      throw new Error(`No profile found for user ${userId}`);
    }

    const prompt = `Generate personalized recommendations for user based on their profile:

    User Preferences:
    - Categories: ${userProfile.preferences.serviceCategories.join(', ')}
    - Preferred times: ${userProfile.preferences.preferredTimes.join(', ')}
    - Price range: ${userProfile.preferences.priceRange.min} - ${userProfile.preferences.priceRange.max}
    - Location: ${userProfile.preferences.location}

    Booking History:
    - Previously booked: ${userProfile.history.bookedServices.join(', ')}
    - Cancelled: ${userProfile.history.cancelledServices.join(', ')}
    - Average rating given: ${this.calculateAverageRating(userProfile.history.ratings)}
    - Booking frequency: ${userProfile.history.bookingFrequency} per month

    Behavior:
    - Books ${userProfile.behavior.averageAdvanceBooking} days in advance
    - Prefers ${userProfile.behavior.preferredDuration} minute sessions
    - Interested in: ${userProfile.behavior.seasonalPreferences.join(', ')}
    - Responds to promotions: ${userProfile.behavior.respondsToPromotions}

    Available services (sample data):
    - Beauty: Lip enhancement, Brow lamination, Facials, Makeup
    - Fitness: Personal training, Yoga classes, Pilates, Glute program

    Generate recommendations with:
    1. Top 5 recommended services with scores (0-1) and reasoning
    2. Optimal time slots for each recommendation
    3. Relevant promotions if user responds to them
    4. Personalized insights about their preferences

    Return JSON format with services, timeSlots, promotions, and insights arrays.`;

    try {
      const response = await aiService['generateContent'](
        prompt,
        'You are an AI recommendation specialist for beauty and fitness services.',
        0.6,
        2000
      );

      const recommendations = JSON.parse(response);

      return {
        userId,
        services: recommendations.services || [],
        timeSlots: recommendations.timeSlots || [],
        promotions: recommendations.promotions || [],
        insights: recommendations.insights || [],
      };
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
      throw error;
    }
  }

  async getSimilarServices(serviceId: string, limit: number = 5): Promise<ServiceRecommendation[]> {
    if (!aiService || !isAIFeatureEnabled('RECOMMENDATIONS')) {
      throw new Error('AI recommendations are not available');
    }

    const prompt = `Find similar services to service ID ${serviceId}.

    Consider these similarity factors:
    - Same category
    - Similar duration (±30 minutes)
    - Similar price point (±20%)
    - Similar customer ratings
    - Complementary services

    Return top ${limit} similar services with:
    - serviceId, serviceName, category
    - similarity score (0-1)
    - reasoning for similarity
    - price and duration

    Format as JSON array.`;

    try {
      const response = await aiService['generateContent'](
        prompt,
        'You are an AI service recommendation specialist.',
        0.5,
        1500
      );

      const similar = JSON.parse(response);
      return similar;
    } catch (error) {
      console.error('Failed to get similar services:', error);
      throw error;
    }
  }

  async recommendCombinations(serviceIds: string[]): Promise<{
    combinations: Array<{
      services: string[];
      discount: number;
      reasoning: string;
      totalPrice: number;
      discountedPrice: number;
    }>;
  }> {
    if (!aiService || !isAIFeatureEnabled('RECOMMENDATIONS')) {
      throw new Error('AI recommendations are not available');
    }

    const prompt = `Create package combinations for these services: ${serviceIds.join(', ')}

    Consider:
    - Services that work well together
    - Logical treatment sequences
    - Time efficiency
    - Price optimization

    Generate 3-5 package combinations with:
    - Array of service IDs that go together
    - Discount percentage (5-20%)
    - Reasoning for the combination
    - Original total price
    - Discounted price

    Focus on treatments that complement each other and provide better results together.`;

    try {
      const response = await aiService['generateContent'](
        prompt,
        'You are an AI package recommendation specialist for beauty and fitness.',
        0.5,
        1500
      );

      const combinations = JSON.parse(response);
      return combinations;
    } catch (error) {
      console.error('Failed to generate combinations:', error);
      throw error;
    }
  }

  async predictNextBooking(userId: string): Promise<{
    likelyServices: string[];
    likelyTimeframe: string;
    confidence: number;
    factors: string[];
  }> {
    if (!aiService || !isAIFeatureEnabled('RECOMMENDATIONS')) {
      throw new Error('AI recommendations are not available');
    }

    const userProfile = this.userProfiles.get(userId);
    if (!userProfile) {
      throw new Error(`No profile found for user ${userId}`);
    }

    const prompt = `Predict next booking for user:

    Pattern Analysis:
    - Last booking: ${userProfile.history.lastBooking}
    - Booking frequency: ${userProfile.history.bookingFrequency} per month
    - Average advance booking: ${userProfile.behavior.averageAdvanceBooking} days
    - Preferred categories: ${userProfile.preferences.serviceCategories.join(', ')}

    History:
    - Previously booked: ${userProfile.history.bookedServices.slice(-5).join(', ')}
    - Ratings: ${userProfile.history.ratings.map(r => `${r.serviceId}: ${r.rating}`).join(', ')}

    Predict:
    1. Most likely services to book next
    2. Expected timeframe for booking
    3. Confidence level (0-1)
    4. Key factors influencing the prediction

    Consider seasonal trends, past patterns, and service completion cycles.`;

    try {
      const response = await aiService['generateContent'](
        prompt,
        'You are an AI predictive analytics specialist for service businesses.',
        0.4,
        1500
      );

      const prediction = JSON.parse(response);
      return prediction;
    } catch (error) {
      console.error('Failed to predict next booking:', error);
      throw error;
    }
  }

  // Utility methods
  updateUserProfile(profile: UserProfile) {
    this.userProfiles.set(profile.id, profile);
  }

  updateServicePopularity(serviceId: string, score: number) {
    this.servicePopularity.set(serviceId, score);
  }

  private calculateAverageRating(ratings: { serviceId: string; rating: number }[]): number {
    if (ratings.length === 0) return 0;
    return ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
  }

  getPopularityScore(serviceId: string): number {
    return this.servicePopularity.get(serviceId) || 0.5;
  }

  getSeasonalFactor(category: string, month: number): number {
    // Return seasonal multiplier (0.5 - 1.5)
    const key = `${category}-${month}`;
    return this.seasonalTrends.get(key) || 1.0;
  }
}

// Export singleton instance
export const aiRecommendationEngine = new AIRecommendationEngine();