import { supabase } from '@/integrations/supabase/client-optimized';
import { Database } from '@/integrations/supabase/types';

type ChurnRiskAssessment = Database['public']['Tables']['churn_risk_assessments']['Row'];
type Booking = Database['public']['Tables']['bookings']['Row'];
type CustomerJourneyEvent = Database['public']['Tables']['customer_journey_events']['Row'];
type CustomerSatisfaction = Database['public']['Tables']['customer_satisfaction']['Row'];

export interface ChurnRiskProfile {
  userId: string;
  churnProbability: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low' | 'minimal';
  riskScore: number;
  riskFactors: RiskFactor[];
  behavioralIndicators: BehavioralIndicators;
  predictiveFeatures: PredictiveFeatures;
  interventionRecommendations: InterventionRecommendation[];
  retentionProbability: number;
  nextAssessmentDate: Date;
}

export interface RiskFactor {
  factor: string;
  impact: 'high' | 'medium' | 'low';
  description: string;
  value: number;
  threshold: number;
}

export interface BehavioralIndicators {
  bookingFrequencyDecline: number;
  daysSinceLastBooking: number;
  engagementScore: number;
  satisfactionTrend: 'improving' | 'stable' | 'declining';
  interactionPatterns: InteractionPattern[];
  servicePreferenceChanges: ServicePreferenceChange[];
  paymentBehaviorChanges: PaymentBehaviorChange[];
}

export interface InteractionPattern {
  pattern: string;
  frequency: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  lastSeen: Date;
}

export interface ServicePreferenceChange {
  serviceId: string;
  serviceName: string;
  changeType: 'new_preference' | 'abandoned' | 'reduced_frequency';
  confidence: number;
  detectedAt: Date;
}

export interface PaymentBehaviorChange {
  changeType: 'payment_method' | 'booking_value' | 'cancellation_rate';
  oldValue: any;
  newValue: any;
  changeDate: Date;
  impact: number;
}

export interface PredictiveFeatures {
  recencyScore: number;
  frequencyScore: number;
  monetaryScore: number;
  engagementScore: number;
  satisfactionScore: number;
  loyaltyScore: number;
  seasonalFactors: SeasonalFactor[];
  externalFactors: ExternalFactor[];
}

export interface SeasonalFactor {
  factor: string;
  impact: number;
  seasonal: boolean;
  confidence: number;
}

export interface ExternalFactor {
  factor: string;
  impact: number;
  source: string;
  confidence: number;
}

export interface InterventionRecommendation {
  type: 'email_campaign' | 'special_offer' | 'personal_call' | 'service_recommendation' | 'loyalty_program';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  estimatedImpact: number;
  cost: number;
  timing: 'immediate' | 'within_week' | 'within_month';
  description: string;
  parameters: Record<string, any>;
}

export interface ChurnModel {
  modelType: 'logistic_regression' | 'random_forest' | 'gradient_boosting' | 'neural_network';
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  featureImportance: FeatureImportance[];
  lastTrained: Date;
  trainingDataSize: number;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
  description: string;
}

class ChurnPredictionEngine {
  private readonly riskThresholds = {
    critical: 0.8,
    high: 0.6,
    medium: 0.3,
    low: 0.1,
    minimal: 0
  };

  private readonly models: Map<string, ChurnModel> = new Map();
  private readonly featureWeights = {
    recency: 0.25,
    frequency: 0.20,
    monetary: 0.15,
    engagement: 0.15,
    satisfaction: 0.10,
    loyalty: 0.10,
    seasonal: 0.03,
    external: 0.02
  };

  constructor() {
    this.initializeModels();
  }

  private initializeModels(): void {
    this.models.set('behavioral', {
      modelType: 'logistic_regression',
      accuracy: 0.78,
      precision: 0.75,
      recall: 0.72,
      f1Score: 0.73,
      featureImportance: [
        { feature: 'days_since_last_booking', importance: 0.35, description: 'Recency of last booking' },
        { feature: 'booking_frequency_decline', importance: 0.28, description: 'Change in booking frequency' },
        { feature: 'engagement_score', importance: 0.18, description: 'Overall engagement level' },
        { feature: 'satisfaction_trend', importance: 0.12, description: 'Satisfaction trend over time' },
        { feature: 'average_booking_value', importance: 0.07, description: 'Average monetary value' }
      ],
      lastTrained: new Date(),
      trainingDataSize: 1000
    });

    this.models.set('advanced', {
      modelType: 'random_forest',
      accuracy: 0.85,
      precision: 0.82,
      recall: 0.79,
      f1Score: 0.80,
      featureImportance: [
        { feature: 'days_since_last_booking', importance: 0.22, description: 'Recency of last booking' },
        { feature: 'booking_frequency_decline', importance: 0.18, description: 'Change in booking frequency' },
        { feature: 'engagement_score', importance: 0.15, description: 'Overall engagement level' },
        { feature: 'service_diversity_change', importance: 0.12, description: 'Changes in service preferences' },
        { feature: 'payment_behavior_change', importance: 0.10, description: 'Payment pattern changes' },
        { feature: 'seasonal_booking_patterns', importance: 0.08, description: 'Seasonal booking behavior' },
        { feature: 'satisfaction_trend', importance: 0.08, description: 'Satisfaction trend over time' },
        { feature: 'interaction_pattern_changes', importance: 0.07, description: 'Changes in interaction patterns' }
      ],
      lastTrained: new Date(),
      trainingDataSize: 2500
    });

    this.models.set('premium', {
      modelType: 'gradient_boosting',
      accuracy: 0.91,
      precision: 0.89,
      recall: 0.87,
      f1Score: 0.88,
      featureImportance: [
        { feature: 'days_since_last_booking', importance: 0.18, description: 'Recency of last booking' },
        { feature: 'booking_frequency_decline', importance: 0.15, description: 'Change in booking frequency' },
        { feature: 'engagement_score', importance: 0.12, description: 'Overall engagement level' },
        { feature: 'clv_tier', importance: 0.10, description: 'Customer lifetime value tier' },
        { feature: 'service_diversity_change', importance: 0.09, description: 'Changes in service preferences' },
        { feature: 'payment_behavior_change', importance: 0.08, description: 'Payment pattern changes' },
        { feature: 'seasonal_booking_patterns', importance: 0.07, description: 'Seasonal booking behavior' },
        { feature: 'competitive_activity', importance: 0.06, description: 'Competitive market activity' },
        { feature: 'economic_indicators', importance: 0.05, description: 'Economic factors affecting spend' },
        { feature: 'satisfaction_trend', importance: 0.05, description: 'Satisfaction trend over time' },
        { feature: 'social_media_sentiment', importance: 0.03, description: 'Social media sentiment' },
        { feature: 'referral_activity', importance: 0.02, description: 'Referral program activity' }
      ],
      lastTrained: new Date(),
      trainingDataSize: 5000
    });
  }

  async assessChurnRisk(
    userId: string,
    modelType: 'behavioral' | 'advanced' | 'premium' = 'advanced',
    assessmentDate?: Date
  ): Promise<ChurnRiskProfile> {
    const date = assessmentDate || new Date();

    // Get customer data
    const [bookings, journeyEvents, satisfactionData, clvData] = await Promise.all([
      this.getCustomerBookings(userId),
      this.getCustomerJourneyEvents(userId, date),
      this.getCustomerSatisfaction(userId),
      this.getCustomerCLV(userId)
    ]);

    // Calculate behavioral indicators
    const behavioralIndicators = await this.calculateBehavioralIndicators(
      userId, bookings, journeyEvents, satisfactionData, date
    );

    // Calculate predictive features
    const predictiveFeatures = await this.calculatePredictiveFeatures(
      userId, bookings, journeyEvents, satisfactionData, clvData, date
    );

    // Select and run prediction model
    const model = this.models.get(modelType) || this.models.get('advanced')!;
    const churnProbability = await this.runChurnModel(model, predictiveFeatures, behavioralIndicators);

    // Determine risk level and score
    const riskLevel = this.determineRiskLevel(churnProbability);
    const riskScore = Math.round(churnProbability * 100);

    // Identify risk factors
    const riskFactors = this.identifyRiskFactors(predictiveFeatures, behavioralIndicators);

    // Generate intervention recommendations
    const interventionRecommendations = this.generateInterventionRecommendations(
      riskLevel, riskFactors, behavioralIndicators, predictiveFeatures
    );

    // Calculate retention probability
    const retentionProbability = 1 - churnProbability;

    // Schedule next assessment
    const nextAssessmentDate = this.scheduleNextAssessment(riskLevel, date);

    const profile: ChurnRiskProfile = {
      userId,
      churnProbability,
      riskLevel,
      riskScore,
      riskFactors,
      behavioralIndicators,
      predictiveFeatures,
      interventionRecommendations,
      retentionProbability,
      nextAssessmentDate
    };

    // Save assessment to database
    await this.saveChurnAssessment(profile);

    return profile;
  }

  private async getCustomerBookings(userId: string): Promise<Booking[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch customer bookings: ${error.message}`);
    }

    return data || [];
  }

  private async getCustomerJourneyEvents(userId: string, currentDate: Date): Promise<CustomerJourneyEvent[]> {
    const ninetyDaysAgo = new Date(currentDate.getTime() - 90 * 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('customer_journey_events')
      .select('*')
      .eq('user_id', userId)
      .gte('occurred_at', ninetyDaysAgo.toISOString())
      .order('occurred_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch customer journey events: ${error.message}`);
    }

    return data || [];
  }

  private async getCustomerSatisfaction(userId: string): Promise<CustomerSatisfaction[]> {
    const { data, error } = await supabase
      .from('customer_satisfaction')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      throw new Error(`Failed to fetch customer satisfaction data: ${error.message}`);
    }

    return data || [];
  }

  private async getCustomerCLV(userId: string) {
    const { data, error } = await supabase
      .from('customer_lifetime_value')
      .select('*')
      .eq('user_id', userId)
      .order('calculation_date', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found error
      throw new Error(`Failed to fetch customer CLV: ${error.message}`);
    }

    return data;
  }

  private async calculateBehavioralIndicators(
    userId: string,
    bookings: Booking[],
    journeyEvents: CustomerJourneyEvent[],
    satisfactionData: CustomerSatisfaction[],
    currentDate: Date
  ): Promise<BehavioralIndicators> {
    const daysSinceLastBooking = this.calculateDaysSinceLastBooking(bookings, currentDate);
    const bookingFrequencyDecline = this.calculateBookingFrequencyDecline(bookings, currentDate);
    const engagementScore = this.calculateEngagementScore(journeyEvents);
    const satisfactionTrend = this.calculateSatisfactionTrend(satisfactionData);
    const interactionPatterns = this.analyzeInteractionPatterns(journeyEvents);
    const servicePreferenceChanges = await this.analyzeServicePreferenceChanges(userId, bookings, currentDate);
    const paymentBehaviorChanges = this.analyzePaymentBehaviorChanges(bookings);

    return {
      bookingFrequencyDecline,
      daysSinceLastBooking,
      engagementScore,
      satisfactionTrend,
      interactionPatterns,
      servicePreferenceChanges,
      paymentBehaviorChanges
    };
  }

  private calculateDaysSinceLastBooking(bookings: Booking[], currentDate: Date): number {
    if (bookings.length === 0) return 999;

    const lastBooking = new Date(bookings[bookings.length - 1].created_at);
    return Math.floor((currentDate.getTime() - lastBooking.getTime()) / (1000 * 60 * 60 * 24));
  }

  private calculateBookingFrequencyDecline(bookings: Booking[], currentDate: Date): number {
    if (bookings.length < 4) return 0;

    const recentBookings = bookings.slice(-4);
    const olderBookings = bookings.slice(-8, -4);

    if (olderBookings.length === 0) return 0;

    const recentInterval = this.calculateAverageBookingInterval(recentBookings);
    const olderInterval = this.calculateAverageBookingInterval(olderBookings);

    if (olderInterval === 0) return 0;

    return ((recentInterval - olderInterval) / olderInterval) * 100;
  }

  private calculateAverageBookingInterval(bookings: Booking[]): number {
    if (bookings.length < 2) return 0;

    let totalInterval = 0;
    for (let i = 1; i < bookings.length; i++) {
      const current = new Date(bookings[i].created_at);
      const previous = new Date(bookings[i - 1].created_at);
      totalInterval += (current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24);
    }

    return totalInterval / (bookings.length - 1);
  }

  private calculateEngagementScore(journeyEvents: CustomerJourneyEvent[]): number {
    if (journeyEvents.length === 0) return 0;

    const recentEvents = journeyEvents.filter(event => {
      const eventDate = new Date(event.occurred_at);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return eventDate >= thirtyDaysAgo;
    });

    // Score based on frequency and diversity of interactions
    const frequencyScore = Math.min(1, recentEvents.length / 20); // 20 events = perfect score
    const diversityScore = this.calculateEventDiversityScore(recentEvents);

    return (frequencyScore + diversityScore) / 2;
  }

  private calculateEventDiversityScore(events: CustomerJourneyEvent[]): number {
    const uniqueEventTypes = new Set(events.map(event => event.event_type)).size;
    return Math.min(1, uniqueEventTypes / 8); // 8 unique types = perfect score
  }

  private calculateSatisfactionTrend(satisfactionData: CustomerSatisfaction[]): 'improving' | 'stable' | 'declining' {
    if (satisfactionData.length < 2) return 'stable';

    const recent = satisfactionData.slice(0, 3);
    const older = satisfactionData.slice(3, 6);

    if (older.length === 0) return 'stable';

    const recentAvg = recent.reduce((sum, s) => sum + (s.overall_satisfaction || 5), 0) / recent.length;
    const olderAvg = older.reduce((sum, s) => sum + (s.overall_satisfaction || 5), 0) / older.length;

    const difference = recentAvg - olderAvg;

    if (difference > 0.5) return 'improving';
    if (difference < -0.5) return 'declining';
    return 'stable';
  }

  private analyzeInteractionPatterns(journeyEvents: CustomerJourneyEvent[]): InteractionPattern[] {
    const patterns: InteractionPattern[] = [];
    const eventTypeGroups: { [key: string]: CustomerJourneyEvent[] } = {};

    journeyEvents.forEach(event => {
      if (!eventTypeGroups[event.event_type]) {
        eventTypeGroups[event.event_type] = [];
      }
      eventTypeGroups[event.event_type].push(event);
    });

    Object.entries(eventTypeGroups).forEach(([eventType, events]) => {
      const sortedEvents = events.sort((a, b) =>
        new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()
      );

      const frequency = events.length;
      const lastSeen = new Date(sortedEvents[0].occurred_at);
      const trend = this.calculateEventTrend(events);

      patterns.push({
        pattern: eventType,
        frequency,
        trend,
        lastSeen
      });
    });

    return patterns.sort((a, b) => b.frequency - a.frequency);
  }

  private calculateEventTrend(events: CustomerJourneyEvent[]): 'increasing' | 'stable' | 'decreasing' {
    if (events.length < 3) return 'stable';

    const recentEvents = events.slice(0, Math.ceil(events.length / 3));
    const olderEvents = events.slice(Math.ceil(events.length / 3));

    const recentFrequency = recentEvents.length;
    const olderFrequency = olderEvents.length;

    if (recentFrequency > olderFrequency * 1.2) return 'increasing';
    if (recentFrequency < olderFrequency * 0.8) return 'decreasing';
    return 'stable';
  }

  private async analyzeServicePreferenceChanges(
    userId: string,
    bookings: Booking[],
    currentDate: Date
  ): Promise<ServicePreferenceChange[]> {
    const changes: ServicePreferenceChange[] = [];
    const serviceFrequency: { [serviceId: string]: { count: number; recent: number; older: number } } = {};

    // Group bookings by service and time period
    const threeMonthsAgo = new Date(currentDate.getTime() - 90 * 24 * 60 * 60 * 1000);
    const sixMonthsAgo = new Date(currentDate.getTime() - 180 * 24 * 60 * 60 * 1000);

    bookings.forEach(booking => {
      const bookingDate = new Date(booking.created_at);
      const serviceId = booking.service_id;

      if (!serviceFrequency[serviceId]) {
        serviceFrequency[serviceId] = { count: 0, recent: 0, older: 0 };
      }

      serviceFrequency[serviceId].count++;

      if (bookingDate >= threeMonthsAgo) {
        serviceFrequency[serviceId].recent++;
      } else if (bookingDate >= sixMonthsAgo) {
        serviceFrequency[serviceId].older++;
      }
    });

    // Analyze changes in service preferences
    Object.entries(serviceFrequency).forEach(([serviceId, frequency]) => {
      const totalRecentBookings = Object.values(serviceFrequency).reduce((sum, f) => sum + f.recent, 0);

      // New preference
      if (frequency.recent > 0 && frequency.older === 0 && totalRecentBookings >= 3) {
        changes.push({
          serviceId,
          serviceName: `Service ${serviceId}`, // Would fetch actual service name
          changeType: 'new_preference',
          confidence: Math.min(1, frequency.recent / 3),
          detectedAt: currentDate
        });
      }

      // Abandoned service
      if (frequency.older > 0 && frequency.recent === 0 && frequency.count >= 2) {
        changes.push({
          serviceId,
          serviceName: `Service ${serviceId}`,
          changeType: 'abandoned',
          confidence: Math.min(1, frequency.older / 3),
          detectedAt: currentDate
        });
      }

      // Reduced frequency
      if (frequency.older > 0 && frequency.recent > 0 && frequency.recent < frequency.older * 0.5) {
        changes.push({
          serviceId,
          serviceName: `Service ${serviceId}`,
          changeType: 'reduced_frequency',
          confidence: 1 - (frequency.recent / frequency.older),
          detectedAt: currentDate
        });
      }
    });

    return changes;
  }

  private analyzePaymentBehaviorChanges(bookings: Booking[]): PaymentBehaviorChange[] {
    const changes: PaymentBehaviorChange[] = [];

    if (bookings.length < 4) return changes;

    const recentBookings = bookings.slice(-2);
    const olderBookings = bookings.slice(-4, -2);

    // Analyze booking value changes
    const recentAvgValue = recentBookings.reduce((sum, b) => sum + b.total_amount, 0) / recentBookings.length;
    const olderAvgValue = olderBookings.reduce((sum, b) => sum + b.total_amount, 0) / olderBookings.length;

    if (Math.abs(recentAvgValue - olderAvgValue) / olderAvgValue > 0.2) {
      changes.push({
        changeType: 'booking_value',
        oldValue: olderAvgValue,
        newValue: recentAvgValue,
        changeDate: new Date(recentBookings[recentBookings.length - 1].created_at),
        impact: (recentAvgValue - olderAvgValue) / olderAvgValue
      });
    }

    // Analyze cancellation rate
    const recentCancellations = recentBookings.filter(b => b.status === 'cancelled').length;
    const olderCancellations = olderBookings.filter(b => b.status === 'cancelled').length;

    if (recentCancellations > olderCancellations) {
      changes.push({
        changeType: 'cancellation_rate',
        oldValue: olderCancellations / olderBookings.length,
        newValue: recentCancellations / recentBookings.length,
        changeDate: new Date(),
        impact: (recentCancellations - olderCancellations) / olderBookings.length
      });
    }

    return changes;
  }

  private async calculatePredictiveFeatures(
    userId: string,
    bookings: Booking[],
    journeyEvents: CustomerJourneyEvent[],
    satisfactionData: CustomerSatisfaction[],
    clvData: any,
    currentDate: Date
  ): Promise<PredictiveFeatures> {
    const recencyScore = this.calculateRecencyScore(bookings, currentDate);
    const frequencyScore = this.calculateFrequencyScore(bookings, currentDate);
    const monetaryScore = this.calculateMonetaryScore(bookings);
    const engagementScore = this.calculateEngagementScore(journeyEvents);
    const satisfactionScore = this.calculateSatisfactionScore(satisfactionData);
    const loyaltyScore = this.calculateLoyaltyScore(bookings, clvData, currentDate);
    const seasonalFactors = await this.analyzeSeasonalFactors(userId, bookings, currentDate);
    const externalFactors = await this.analyzeExternalFactors(userId, currentDate);

    return {
      recencyScore,
      frequencyScore,
      monetaryScore,
      engagementScore,
      satisfactionScore,
      loyaltyScore,
      seasonalFactors,
      externalFactors
    };
  }

  private calculateRecencyScore(bookings: Booking[], currentDate: Date): number {
    const daysSinceLastBooking = this.calculateDaysSinceLastBooking(bookings, currentDate);
    return Math.max(0, Math.exp(-daysSinceLastBooking / 30)); // Exponential decay
  }

  private calculateFrequencyScore(bookings: Booking[], currentDate: Date): number {
    if (bookings.length === 0) return 0;

    const firstBooking = new Date(bookings[0].created_at);
    const monthsActive = Math.max(1, (currentDate.getTime() - firstBooking.getTime()) / (1000 * 60 * 60 * 24 * 30));
    const frequency = bookings.length / monthsActive;

    return Math.min(1, frequency / 2); // 2 bookings per month = perfect score
  }

  private calculateMonetaryScore(bookings: Booking[]): number {
    if (bookings.length === 0) return 0;

    const totalRevenue = bookings.reduce((sum, booking) => sum + booking.total_amount, 0);
    const averageOrderValue = totalRevenue / bookings.length;

    return Math.min(1, averageOrderValue / 1000); // 1000 PLN = perfect score
  }

  private calculateSatisfactionScore(satisfactionData: CustomerSatisfaction[]): number {
    if (satisfactionData.length === 0) return 0.5; // Neutral score

    const latestSatisfaction = satisfactionData[0];
    return (latestSatisfaction.overall_satisfaction || 5) / 10;
  }

  private calculateLoyaltyScore(bookings: Booking[], clvData: any, currentDate: Date): number {
    let score = 0;

    // Tenure bonus
    if (bookings.length > 0) {
      const firstBooking = new Date(bookings[0].created_at);
      const tenureMonths = (currentDate.getTime() - firstBooking.getTime()) / (1000 * 60 * 60 * 24 * 30);
      score += Math.min(0.3, tenureMonths / 60); // Max 0.3 for 5+ years
    }

    // CLV tier bonus
    if (clvData) {
      switch (clvData.clv_tier) {
        case 'platinum': score += 0.4; break;
        case 'gold': score += 0.3; break;
        case 'silver': score += 0.2; break;
        case 'bronze': score += 0.1; break;
        default: score += 0.05;
      }
    }

    // Frequency bonus
    const frequencyScore = this.calculateFrequencyScore(bookings, currentDate);
    score += frequencyScore * 0.3;

    return Math.min(1, score);
  }

  private async analyzeSeasonalFactors(userId: string, bookings: Booking[], currentDate: Date): Promise<SeasonalFactor[]> {
    const factors: SeasonalFactor[] = [];

    // Seasonal booking patterns
    const seasonalBookings = this.analyzeSeasonalBookingPatterns(bookings);
    const currentMonth = currentDate.getMonth();
    const currentSeason = this.getCurrentSeason(currentMonth);

    const seasonalImpact = seasonalBookings[currentSeason] || 0;
    const avgBookings = Object.values(seasonalBookings).reduce((a, b) => a + b, 0) / 4;

    if (seasonalImpact < avgBookings * 0.7) {
      factors.push({
        factor: 'seasonal_booking_decline',
        impact: (avgBookings - seasonalImpact) / avgBookings,
        seasonal: true,
        confidence: 0.8
      });
    }

    return factors;
  }

  private analyzeSeasonalBookingPatterns(bookings: Booking[]): { [season: string]: number } {
    const patterns = {
      winter: 0,
      spring: 0,
      summer: 0,
      autumn: 0
    };

    bookings.forEach(booking => {
      const month = new Date(booking.created_at).getMonth();
      const season = this.getCurrentSeason(month);
      patterns[season]++;
    });

    return patterns;
  }

  private getCurrentSeason(month: number): string {
    if (month >= 11 || month <= 1) return 'winter';
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    return 'autumn';
  }

  private async analyzeExternalFactors(userId: string, currentDate: Date): Promise<ExternalFactor[]> {
    const factors: ExternalFactor[] = [];

    // Economic indicators (simplified)
    factors.push({
      factor: 'economic_conditions',
      impact: 0.1, // Would be calculated based on actual economic data
      source: 'economic_indicators',
      confidence: 0.6
    });

    // Competitive activity (simplified)
    factors.push({
      factor: 'competitive_activity',
      impact: 0.05, // Would be calculated based on market analysis
      source: 'market_intelligence',
      confidence: 0.4
    });

    return factors;
  }

  private async runChurnModel(
    model: ChurnModel,
    features: PredictiveFeatures,
    behavioralIndicators: BehavioralIndicators
  ): Promise<number> {
    // Simplified model execution - in production, this would use actual ML models

    // Calculate weighted score based on feature importance
    let weightedScore = 0;

    model.featureImportance.forEach(({ feature, importance }) => {
      let featureValue = 0;

      switch (feature) {
        case 'days_since_last_booking':
          featureValue = 1 - Math.min(1, behavioralIndicators.daysSinceLastBooking / 180);
          break;
        case 'booking_frequency_decline':
          featureValue = 1 - Math.min(1, Math.abs(behavioralIndicators.bookingFrequencyDecline) / 50);
          break;
        case 'engagement_score':
          featureValue = features.engagementScore;
          break;
        case 'satisfaction_trend':
          featureValue = behavioralIndicators.satisfactionTrend === 'improving' ? 1 :
                         behavioralIndicators.satisfactionTrend === 'stable' ? 0.5 : 0;
          break;
        case 'average_booking_value':
          featureValue = features.monetaryScore;
          break;
        case 'service_diversity_change':
          const abandonedServices = behavioralIndicators.servicePreferenceChanges
            .filter(change => change.changeType === 'abandoned').length;
          featureValue = 1 - Math.min(1, abandonedServices / 3);
          break;
        case 'payment_behavior_change':
          const negativePaymentChanges = behavioralIndicators.paymentBehaviorChanges
            .filter(change => change.impact < 0).length;
          featureValue = 1 - Math.min(1, negativePaymentChanges / 2);
          break;
        case 'seasonal_booking_patterns':
          featureValue = 1 - Math.max(0, features.seasonalFactors.reduce((sum, f) => sum + f.impact, 0));
          break;
        case 'interaction_pattern_changes':
          const decliningPatterns = behavioralIndicators.interactionPatterns
            .filter(pattern => pattern.trend === 'decreasing').length;
          featureValue = 1 - Math.min(1, decliningPatterns / 5);
          break;
        case 'clv_tier':
          featureValue = features.loyaltyScore;
          break;
        case 'competitive_activity':
          featureValue = 1 - Math.max(0, features.externalFactors
            .filter(f => f.factor === 'competitive_activity')
            .reduce((sum, f) => sum + f.impact, 0));
          break;
        case 'economic_indicators':
          featureValue = 1 - Math.max(0, features.externalFactors
            .filter(f => f.factor === 'economic_conditions')
            .reduce((sum, f) => sum + f.impact, 0));
          break;
        case 'social_media_sentiment':
          featureValue = 0.8; // Placeholder - would come from social media analysis
          break;
        case 'referral_activity':
          featureValue = 0.7; // Placeholder - would come from referral tracking
          break;
        default:
          featureValue = 0.5; // Neutral value for unknown features
      }

      weightedScore += featureValue * importance;
    });

    // Convert weighted score to churn probability (inverse relationship)
    const churnProbability = 1 - weightedScore;

    // Apply model accuracy adjustment
    const adjustedProbability = churnProbability * (2 - model.accuracy);

    return Math.max(0, Math.min(1, adjustedProbability));
  }

  private determineRiskLevel(churnProbability: number): 'critical' | 'high' | 'medium' | 'low' | 'minimal' {
    if (churnProbability >= this.riskThresholds.critical) return 'critical';
    if (churnProbability >= this.riskThresholds.high) return 'high';
    if (churnProbability >= this.riskThresholds.medium) return 'medium';
    if (churnProbability >= this.riskThresholds.low) return 'low';
    return 'minimal';
  }

  private identifyRiskFactors(features: PredictiveFeatures, behavioralIndicators: BehavioralIndicators): RiskFactor[] {
    const factors: RiskFactor[] = [];

    // Recency risk factor
    if (behavioralIndicators.daysSinceLastBooking > 90) {
      factors.push({
        factor: 'days_since_last_booking',
        impact: behavioralIndicators.daysSinceLastBooking > 180 ? 'high' : 'medium',
        description: `Customer hasn't booked in ${behavioralIndicators.daysSinceLastBooking} days`,
        value: behavioralIndicators.daysSinceLastBooking,
        threshold: 90
      });
    }

    // Frequency decline risk factor
    if (behavioralIndicators.bookingFrequencyDecline > 30) {
      factors.push({
        factor: 'booking_frequency_decline',
        impact: behavioralIndicators.bookingFrequencyDecline > 50 ? 'high' : 'medium',
        description: `Booking frequency has declined by ${behavioralIndicators.bookingFrequencyDecline.toFixed(1)}%`,
        value: behavioralIndicators.bookingFrequencyDecline,
        threshold: 30
      });
    }

    // Engagement risk factor
    if (features.engagementScore < 0.3) {
      factors.push({
        factor: 'low_engagement',
        impact: features.engagementScore < 0.1 ? 'high' : 'medium',
        description: 'Customer engagement level is low',
        value: features.engagementScore,
        threshold: 0.3
      });
    }

    // Satisfaction risk factor
    if (features.satisfactionScore < 0.4) {
      factors.push({
        factor: 'low_satisfaction',
        impact: features.satisfactionScore < 0.2 ? 'high' : 'medium',
        description: 'Customer satisfaction score is below average',
        value: features.satisfactionScore,
        threshold: 0.4
      });
    }

    // Service abandonment risk factor
    const abandonedServices = behavioralIndicators.servicePreferenceChanges
      .filter(change => change.changeType === 'abandoned');
    if (abandonedServices.length > 0) {
      factors.push({
        factor: 'service_abandonment',
        impact: abandonedServices.length > 2 ? 'high' : 'medium',
        description: `Customer has abandoned ${abandonedServices.length} preferred services`,
        value: abandonedServices.length,
        threshold: 1
      });
    }

    return factors.sort((a, b) => {
      const impactWeight = { high: 3, medium: 2, low: 1 };
      return impactWeight[b.impact] - impactWeight[a.impact];
    });
  }

  private generateInterventionRecommendations(
    riskLevel: string,
    riskFactors: RiskFactor[],
    behavioralIndicators: BehavioralIndicators,
    features: PredictiveFeatures
  ): InterventionRecommendation[]> {
    const recommendations: InterventionRecommendation[] = [];

    // High-risk interventions
    if (riskLevel === 'critical' || riskLevel === 'high') {
      recommendations.push({
        type: 'personal_call',
        priority: 'urgent',
        estimatedImpact: 0.7,
        cost: 50,
        timing: 'immediate',
        description: 'Personal outreach call from customer relationship manager',
        parameters: {
          script: 'customer_retention_high_risk',
          caller: 'senioradvisor',
          offerDiscount: 15
        }
      });

      recommendations.push({
        type: 'special_offer',
        priority: 'urgent',
        estimatedImpact: 0.6,
        cost: 100,
        timing: 'immediate',
        description: 'Exclusive retention offer with significant discount',
        parameters: {
          discountPercent: 25,
          validDays: 14,
          services: 'all'
        }
      });
    }

    // Medium-risk interventions
    if (riskLevel === 'medium' || riskLevel === 'high') {
      recommendations.push({
        type: 'email_campaign',
        priority: 'high',
        estimatedImpact: 0.4,
        cost: 5,
        timing: 'within_week',
        description: 'Personalized re-engagement email campaign',
        parameters: {
          campaign: 'win_back_3_step',
          personalization: 'high',
          frequency: 'weekly'
        }
      });

      recommendations.push({
        type: 'service_recommendation',
        priority: 'medium',
        estimatedImpact: 0.3,
        cost: 10,
        timing: 'within_week',
        description: 'Personalized service recommendations based on history',
        parameters: {
          recommendationType: 'personalized',
          numberOfServices: 3,
          discountPercent: 10
        }
      });
    }

    // Low-risk interventions
    if (riskLevel === 'low') {
      recommendations.push({
        type: 'email_campaign',
        priority: 'medium',
        estimatedImpact: 0.2,
        cost: 2,
        timing: 'within_month',
        description: 'Standard nurture campaign with value content',
        parameters: {
          campaign: 'standard_nurture',
          frequency: 'bi_weekly'
        }
      });
    }

    // Targeted interventions based on risk factors
    riskFactors.forEach(factor => {
      switch (factor.factor) {
        case 'low_engagement':
          recommendations.push({
            type: 'email_campaign',
            priority: 'high',
            estimatedImpact: 0.35,
            cost: 8,
            timing: 'within_week',
            description: 'Re-engagement campaign with interactive content',
            parameters: {
              campaign: 're_engagement_interactive',
              contentType: 'quiz_survey'
            }
          });
          break;

        case 'low_satisfaction':
          recommendations.push({
            type: 'personal_call',
            priority: 'high',
            estimatedImpact: 0.5,
            cost: 30,
            timing: 'within_week',
            description: 'Customer service follow-up call to address concerns',
            parameters: {
              purpose: 'satisfaction_followup',
              department: 'customer_service'
            }
          });
          break;

        case 'service_abandonment':
          recommendations.push({
            type: 'special_offer',
            priority: 'medium',
            estimatedImpact: 0.4,
            cost: 20,
            timing: 'within_week',
            description: 'Special offer for abandoned services',
            parameters: {
              targetServices: behavioralIndicators.servicePreferenceChanges
                .filter(change => change.changeType === 'abandoned')
                .map(change => change.serviceId),
              discountPercent: 20
            }
          });
          break;
      }
    });

    // Remove duplicates and sort by priority
    const uniqueRecommendations = recommendations.filter((rec, index, self) =>
      index === self.findIndex(r => r.type === rec.type && r.priority === rec.priority)
    );

    return uniqueRecommendations.sort((a, b) => {
      const priorityWeight = { urgent: 4, high: 3, medium: 2, low: 1 };
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    });
  }

  private scheduleNextAssessment(riskLevel: string, currentDate: Date): Date {
    const assessmentIntervals = {
      critical: 7,    // 1 week
      high: 14,       // 2 weeks
      medium: 30,     // 1 month
      low: 60,        // 2 months
      minimal: 90     // 3 months
    };

    const daysToAdd = assessmentIntervals[riskLevel as keyof typeof assessmentIntervals] || 30;
    return new Date(currentDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
  }

  private async saveChurnAssessment(profile: ChurnRiskProfile): Promise<void> {
    const { error } = await supabase
      .from('churn_risk_assessments')
      .upsert({
        user_id: profile.userId,
        assessment_date: new Date().toISOString().split('T')[0],
        churn_probability: profile.churnProbability,
        risk_level: profile.riskLevel,
        risk_score: profile.riskScore,
        days_since_last_booking: profile.behavioralIndicators.daysSinceLastBooking,
        booking_frequency_decline: profile.behavioralIndicators.bookingFrequencyDecline,
        engagement_score: profile.behavioralIndicators.engagementScore,
        satisfaction_trend: profile.behavioralIndicators.satisfactionTrend,
        predictive_features: {
          recencyScore: profile.predictiveFeatures.recencyScore,
          frequencyScore: profile.predictiveFeatures.frequencyScore,
          monetaryScore: profile.predictiveFeatures.monetaryScore,
          engagementScore: profile.predictiveFeatures.engagementScore,
          satisfactionScore: profile.predictiveFeatures.satisfactionScore,
          loyaltyScore: profile.predictiveFeatures.loyaltyScore
        },
        model_version: 'v1.0',
        prediction_confidence: 0.8
      });

    if (error) {
      throw new Error(`Failed to save churn assessment: ${error.message}`);
    }
  }

  async getAtRiskCustomers(riskLevel?: string, limit: number = 50): Promise<any[]> {
    let query = supabase
      .from('churn_risk_assessments')
      .select(`
        *,
        profiles:user_id (
          full_name,
          email,
          phone
        ),
        customer_lifetime_value (
          total_clv,
          clv_tier,
          value_score
        )
      `)
      .order('churn_probability', { ascending: false })
      .limit(limit);

    if (riskLevel) {
      query = query.eq('risk_level', riskLevel);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch at-risk customers: ${error.message}`);
    }

    return data || [];
  }

  async batchAssessChurnRisk(userIds: string[], modelType: 'behavioral' | 'advanced' | 'premium' = 'advanced'): Promise<void> {
    const BATCH_SIZE = 5;

    for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
      const batch = userIds.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(userId =>
          this.assessChurnRisk(userId, modelType).catch(error => {
            console.error(`Failed to assess churn risk for user ${userId}:`, error);
            return null;
          })
        )
      );

      // Add delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  async triggerIntervention(userId: string, interventionType: string, parameters: Record<string, any>): Promise<void> {
    // This would integrate with your marketing automation or CRM system
    console.log(`Triggering ${interventionType} intervention for user ${userId}`, parameters);

    // Update intervention tracking in database
    const { error } = await supabase
      .from('churn_risk_assessments')
      .update({
        intervention_triggered: true,
        intervention_type: interventionType,
        intervention_date: new Date().toISOString(),
        intervention_result: 'initiated'
      })
      .eq('user_id', userId)
      .eq('assessment_date', new Date().toISOString().split('T')[0]);

    if (error) {
      throw new Error(`Failed to update intervention tracking: ${error.message}`);
    }
  }
}

export const churnPredictionEngine = new ChurnPredictionEngine();