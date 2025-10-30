import { supabase } from '@/integrations/supabase/client-optimized';
import { Database } from '@/integrations/supabase/types';

type CustomerLifetimeValue = Database['public']['Tables']['customer_lifetime_value']['Row'];
type ChurnRiskAssessment = Database['public']['Tables']['churn_risk_assessments']['Row'];
type Booking = Database['public']['Tables']['bookings']['Row'];

export interface CLVCalculationResult {
  historicalRevenue: number;
  predictedRevenue12m: number;
  predictedRevenue24m: number;
  totalCLV: number;
  averageOrderValue: number;
  purchaseFrequency: number;
  customerTenureMonths: number;
  profitMargin: number;
  clvTier: 'platinum' | 'gold' | 'silver' | 'bronze' | 'new';
  valueScore: number;
  predictionConfidence: number;
  monthlyBreakdown: MonthlyCLVBreakdown[];
  growthTrajectory: GrowthTrajectory;
  segmentation: CustomerSegmentation;
}

export interface MonthlyCLVBreakdown {
  month: string;
  revenue: number;
  predictedRevenue: number;
  bookings: number;
  averageValue: number;
}

export interface GrowthTrajectory {
  trend: 'increasing' | 'stable' | 'decreasing';
  growthRate: number;
  confidenceInterval: [number, number];
  projectedValues: number[];
}

export interface CustomerSegmentation {
  behavioral: string;
  demographic: string;
  value: string;
  lifecycle: string;
  predictedNextSegment: string;
}

export interface CLVPredictionModel {
  modelType: 'linear_regression' | 'random_forest' | 'neural_network' | 'ensemble';
  features: string[];
  accuracy: number;
  lastTrained: Date;
  predictionHorizon: number; // months
}

class CLVEngine {
  private readonly models: Map<string, CLVPredictionModel> = new Map();
  private readonly featureWeights = {
    recency: 0.3,
    frequency: 0.25,
    monetary: 0.25,
    tenure: 0.1,
    engagement: 0.05,
    satisfaction: 0.05
  };

  constructor() {
    this.initializeModels();
  }

  private initializeModels(): void {
    this.models.set('simple', {
      modelType: 'linear_regression',
      features: ['avg_order_value', 'purchase_frequency', 'tenure_months'],
      accuracy: 0.75,
      lastTrained: new Date(),
      predictionHorizon: 24
    });

    this.models.set('advanced', {
      modelType: 'random_forest',
      features: [
        'avg_order_value', 'purchase_frequency', 'tenure_months',
        'booking_patterns', 'seasonal_preferences', 'service_diversity',
        'engagement_score', 'satisfaction_trend', 'price_sensitivity'
      ],
      accuracy: 0.85,
      lastTrained: new Date(),
      predictionHorizon: 24
    });

    this.models.set('premium', {
      modelType: 'ensemble',
      features: [
        'all_behavioral_features', 'demographic_features', 'contextual_features',
        'economic_indicators', 'seasonal_factors', 'competitive_landscape'
      ],
      accuracy: 0.92,
      lastTrained: new Date(),
      predictionHorizon: 36
    });
  }

  async calculateCLV(
    userId: string,
    modelType: 'simple' | 'advanced' | 'premium' = 'advanced',
    calculationDate?: Date
  ): Promise<CLVCalculationResult> {
    const date = calculationDate || new Date();

    // Get customer booking history
    const { data: bookings, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: true });

    if (bookingError) {
      throw new Error(`Failed to fetch booking history: ${bookingError.message}`);
    }

    if (!bookings || bookings.length === 0) {
      return this.getNewCustomerCLV(userId, date);
    }

    // Calculate historical metrics
    const historicalMetrics = this.calculateHistoricalMetrics(bookings, date);

    // Calculate features for prediction
    const features = await this.calculateFeatures(userId, bookings, date);

    // Select and run prediction model
    const model = this.models.get(modelType) || this.models.get('advanced')!;
    const predictions = await this.runPredictionModel(model, features, historicalMetrics);

    // Calculate monthly breakdown
    const monthlyBreakdown = this.calculateMonthlyBreakdown(bookings, predictions, date);

    // Analyze growth trajectory
    const growthTrajectory = this.analyzeGrowthTrajectory(bookings, predictions);

    // Determine segmentation
    const segmentation = await this.determineSegmentation(userId, features, historicalMetrics);

    // Calculate CLV tier and value score
    const { clvTier, valueScore } = this.calculateCLVTier(predictions.totalCLV, historicalMetrics);

    return {
      historicalRevenue: historicalMetrics.totalRevenue,
      predictedRevenue12m: predictions.predictedRevenue12m,
      predictedRevenue24m: predictions.predictedRevenue24m,
      totalCLV: predictions.totalCLV,
      averageOrderValue: historicalMetrics.averageOrderValue,
      purchaseFrequency: historicalMetrics.purchaseFrequency,
      customerTenureMonths: historicalMetrics.tenureMonths,
      profitMargin: historicalMetrics.profitMargin || 0.7, // Default 70% for luxury services
      clvTier,
      valueScore,
      predictionConfidence: predictions.confidence,
      monthlyBreakdown,
      growthTrajectory,
      segmentation
    };
  }

  private calculateHistoricalMetrics(bookings: Booking[], calculationDate: Date) {
    const totalRevenue = bookings.reduce((sum, booking) => sum + booking.total_amount, 0);
    const averageOrderValue = totalRevenue / bookings.length;

    const firstBooking = new Date(bookings[0].created_at);
    const lastBooking = new Date(bookings[bookings.length - 1].created_at);
    const tenureMonths = Math.floor((calculationDate.getTime() - firstBooking.getTime()) / (1000 * 60 * 60 * 24 * 30));

    const purchaseFrequency = bookings.length / Math.max(tenureMonths, 1);

    // Calculate profit margin (simplified - could be enhanced with actual cost data)
    const profitMargin = this.estimateProfitMargin(bookings);

    return {
      totalRevenue,
      averageOrderValue,
      tenureMonths,
      purchaseFrequency,
      profitMargin,
      firstBookingDate: firstBooking,
      lastBookingDate: lastBooking
    };
  }

  private async calculateFeatures(userId: string, bookings: Booking[], calculationDate: Date) {
    // Get customer profile and preferences
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // Get engagement data
    const { data: journeyEvents } = await supabase
      .from('customer_journey_events')
      .select('*')
      .eq('user_id', userId)
      .gte('occurred_at', new Date(calculationDate.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString());

    // Get satisfaction data
    const { data: satisfaction } = await supabase
      .from('customer_satisfaction')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    // Calculate behavioral features
    const recencyScore = this.calculateRecencyScore(bookings, calculationDate);
    const frequencyScore = this.calculateFrequencyScore(bookings);
    const monetaryScore = this.calculateMonetaryScore(bookings);
    const engagementScore = this.calculateEngagementScore(journeyEvents || []);
    const satisfactionScore = satisfaction?.overall_satisfaction || 5;

    // Calculate booking patterns
    const bookingPatterns = this.analyzeBookingPatterns(bookings);
    const serviceDiversity = this.calculateServiceDiversity(bookings);
    const seasonalPreferences = this.analyzeSeasonalPreferences(bookings);

    return {
      recencyScore,
      frequencyScore,
      monetaryScore,
      engagementScore,
      satisfactionScore,
      bookingPatterns,
      serviceDiversity,
      seasonalPreferences,
      customerProfile: profile,
      daysSinceLastBooking: this.calculateDaysSinceLastBooking(bookings, calculationDate)
    };
  }

  private calculateRecencyScore(bookings: Booking[], currentDate: Date): number {
    if (bookings.length === 0) return 0;

    const lastBooking = new Date(bookings[bookings.length - 1].created_at);
    const daysSinceLastBooking = (currentDate.getTime() - lastBooking.getTime()) / (1000 * 60 * 60 * 24);

    // Exponential decay function
    return Math.max(0, Math.exp(-daysSinceLastBooking / 30));
  }

  private calculateFrequencyScore(bookings: Booking[]): number {
    if (bookings.length === 0) return 0;

    const firstBooking = new Date(bookings[0].created_at);
    const lastBooking = new Date(bookings[bookings.length - 1].created_at);
    const monthsActive = Math.max(1, (lastBooking.getTime() - firstBooking.getTime()) / (1000 * 60 * 60 * 24 * 30));

    const frequency = bookings.length / monthsActive;

    // Normalize frequency score (0-1)
    return Math.min(1, frequency / 2); // 2 bookings per month = perfect score
  }

  private calculateMonetaryScore(bookings: Booking[]): number {
    const totalRevenue = bookings.reduce((sum, booking) => sum + booking.total_amount, 0);
    const averageOrderValue = totalRevenue / bookings.length;

    // Normalize based on luxury market standards (0-1)
    return Math.min(1, averageOrderValue / 1000); // 1000 PLN = perfect score
  }

  private calculateEngagementScore(journeyEvents: any[]): number {
    if (journeyEvents.length === 0) return 0;

    // Calculate engagement based on event diversity and frequency
    const uniqueEventTypes = new Set(journeyEvents.map(event => event.event_type)).size;
    const frequencyScore = Math.min(1, journeyEvents.length / 50); // 50 events = perfect score
    const diversityScore = Math.min(1, uniqueEventTypes / 10); // 10 unique events = perfect score

    return (frequencyScore + diversityScore) / 2;
  }

  private calculateDaysSinceLastBooking(bookings: Booking[], currentDate: Date): number {
    if (bookings.length === 0) return 999;

    const lastBooking = new Date(bookings[bookings.length - 1].created_at);
    return Math.floor((currentDate.getTime() - lastBooking.getTime()) / (1000 * 60 * 60 * 24));
  }

  private analyzeBookingPatterns(bookings: Booking[]) {
    // Analyze time patterns, service preferences, booking intervals
    const bookingIntervals: number[] = [];
    const serviceTypes: string[] = [];
    const bookingHours: number[] = [];
    const bookingDays: number[] = [];

    for (let i = 1; i < bookings.length; i++) {
      const current = new Date(bookings[i].created_at);
      const previous = new Date(bookings[i - 1].created_at);
      bookingIntervals.push((current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24));

      bookingHours.push(current.getHours());
      bookingDays.push(current.getDay());
    }

    bookings.forEach(booking => {
      serviceTypes.push(booking.service_id);
    });

    const avgInterval = bookingIntervals.length > 0
      ? bookingIntervals.reduce((a, b) => a + b, 0) / bookingIntervals.length
      : 0;

    return {
      averageIntervalDays: avgInterval,
      preferredHours: this.findPreferredTimes(bookingHours),
      preferredDays: this.findPreferredDays(bookingDays),
      serviceConsistency: this.calculateServiceConsistency(serviceTypes)
    };
  }

  private calculateServiceDiversity(bookings: Booking[]): number {
    const uniqueServices = new Set(bookings.map(booking => booking.service_id)).size;
    return uniqueServices / bookings.length;
  }

  private analyzeSeasonalPreferences(bookings: Booking[]) {
    const seasonalBookings = {
      winter: 0, // Dec-Feb
      spring: 0, // Mar-May
      summer: 0, // Jun-Aug
      autumn: 0  // Sep-Nov
    };

    bookings.forEach(booking => {
      const month = new Date(booking.created_at).getMonth();
      if (month >= 11 || month <= 1) seasonalBookings.winter++;
      else if (month >= 2 && month <= 4) seasonalBookings.spring++;
      else if (month >= 5 && month <= 7) seasonalBookings.summer++;
      else seasonalBookings.autumn++;
    });

    return seasonalBookings;
  }

  private findPreferredTimes(hours: number[]): number[] {
    if (hours.length === 0) return [];

    const hourCounts: { [key: number]: number } = {};
    hours.forEach(hour => {
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    return Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));
  }

  private findPreferredDays(days: number[]): number[] {
    if (days.length === 0) return [];

    const dayCounts: { [key: number]: number } = {};
    days.forEach(day => {
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });

    return Object.entries(dayCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([day]) => parseInt(day));
  }

  private calculateServiceConsistency(serviceIds: string[]): number {
    const uniqueServices = new Set(serviceIds).size;
    return uniqueServices === 1 ? 1 : 1 / uniqueServices;
  }

  private estimateProfitMargin(bookings: Booking[]): number {
    // Estimate profit margin based on service types and prices
    // Luxury beauty/fitness services typically have 60-80% margins
    const avgPrice = bookings.reduce((sum, b) => sum + b.total_amount, 0) / bookings.length;

    if (avgPrice >= 1000) return 0.8; // High-end services
    if (avgPrice >= 500) return 0.7;  // Mid-range services
    return 0.6; // Entry-level services
  }

  private async runPredictionModel(
    model: CLVPredictionModel,
    features: any,
    historicalMetrics: any
  ) {
    // Simplified prediction model - in production, this would call actual ML models
    const { averageOrderValue, purchaseFrequency, tenureMonths } = historicalMetrics;

    // Apply feature weights
    const weightedScore =
      features.recencyScore * this.featureWeights.recency +
      features.frequencyScore * this.featureWeights.frequency +
      features.monetaryScore * this.featureWeights.monetary +
      (tenureMonths / 60) * this.featureWeights.tenure + // Normalize to 5 years
      features.engagementScore * this.featureWeights.engagement +
      (features.satisfactionScore / 10) * this.featureWeights.satisfaction;

    // Predict future revenue with adjustments based on customer behavior
    const growthMultiplier = 1 + (weightedScore - 0.5) * 0.5; // ±25% growth
    const churnRisk = Math.max(0, 1 - weightedScore) * 0.3; // Max 30% churn risk

    const predictedRevenue12m = averageOrderValue * purchaseFrequency * 12 * growthMultiplier * (1 - churnRisk);
    const predictedRevenue24m = predictedRevenue12m * 2 * growthMultiplier;
    const totalCLV = historicalMetrics.totalRevenue + predictedRevenue24m;

    const confidence = model.accuracy * (1 - churnRisk) * Math.min(1, tenureMonths / 12);

    return {
      predictedRevenue12m,
      predictedRevenue24m,
      totalCLV,
      confidence: Math.min(0.95, Math.max(0.1, confidence)),
      growthMultiplier,
      churnRisk
    };
  }

  private calculateMonthlyBreakdown(bookings: Booking[], predictions: any, currentDate: Date): MonthlyCLVBreakdown[] {
    const breakdown: MonthlyCLVBreakdown[] = [];
    const monthlyHistoricalData = this.groupBookingsByMonth(bookings);

    // Generate 24-month projection
    for (let i = -6; i <= 18; i++) {
      const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const monthKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;

      const historicalData = monthlyHistoricalData[monthKey];
      const isHistorical = i <= 0;
      const isCurrent = i === 0;

      let revenue = 0;
      let bookings = 0;
      let averageValue = 0;

      if (historicalData) {
        revenue = historicalData.revenue;
        bookings = historicalData.bookings;
        averageValue = historicalData.averageValue;
      } else if (!isHistorical) {
        // Project future values
        const monthlyPrediction = predictions.predictedRevenue12m / 12;
        const seasonalMultiplier = this.getSeasonalMultiplier(targetDate.getMonth());
        const trendMultiplier = 1 + (predictions.growthMultiplier - 1) * (i / 12);

        revenue = monthlyPrediction * seasonalMultiplier * trendMultiplier;
        averageValue = revenue / 2; // Assume 2 bookings per month average
        bookings = Math.round(revenue / averageValue);
      }

      breakdown.push({
        month: monthKey,
        revenue,
        predictedRevenue: isHistorical ? revenue : revenue,
        bookings,
        averageValue
      });
    }

    return breakdown;
  }

  private groupBookingsByMonth(bookings: Booking[]): { [month: string]: { revenue: number; bookings: number; averageValue: number } } {
    const monthlyData: { [month: string]: { revenue: number; bookings: number; averageValue: number } } = {};

    bookings.forEach(booking => {
      const date = new Date(booking.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { revenue: 0, bookings: 0, averageValue: 0 };
      }

      monthlyData[monthKey].revenue += booking.total_amount;
      monthlyData[monthKey].bookings += 1;
    });

    // Calculate average values
    Object.values(monthlyData).forEach(data => {
      data.averageValue = data.bookings > 0 ? data.revenue / data.bookings : 0;
    });

    return monthlyData;
  }

  private getSeasonalMultiplier(month: number): number {
    // Seasonal patterns for beauty/fitness services in Warsaw
    const seasonalMultipliers = {
      0: 1.1,  // January - New Year resolutions
      1: 1.05, // February - Valentine's preparation
      2: 1.2,  // March - Spring preparation
      3: 1.15, // April - Pre-summer
      4: 1.3,  // May - Summer preparation
      5: 1.25, // June - Summer start
      6: 1.1,  // July - Vacation season
      7: 1.05, // August - End of summer
      8: 1.15, // September - Back to routine
      9: 1.1,  // October - Pre-holiday
      10: 1.25, // November - Holiday preparation
      11: 1.2   // December - Holiday season
    };

    return seasonalMultipliers[month] || 1;
  }

  private analyzeGrowthTrajectory(bookings: Booking[], predictions: any): GrowthTrajectory {
    if (bookings.length < 3) {
      return {
        trend: 'stable',
        growthRate: 0,
        confidenceInterval: [-0.1, 0.1],
        projectedValues: []
      };
    }

    // Calculate recent growth rate
    const recentBookings = bookings.slice(-6);
    const olderBookings = bookings.slice(-12, -6);

    const recentRevenue = recentBookings.reduce((sum, b) => sum + b.total_amount, 0);
    const olderRevenue = olderBookings.length > 0
      ? olderBookings.reduce((sum, b) => sum + b.total_amount, 0)
      : recentRevenue;

    const growthRate = olderRevenue > 0 ? (recentRevenue - olderRevenue) / olderRevenue : 0;

    let trend: 'increasing' | 'stable' | 'decreasing';
    if (growthRate > 0.05) trend = 'increasing';
    else if (growthRate < -0.05) trend = 'decreasing';
    else trend = 'stable';

    // Calculate confidence interval based on volatility
    const volatility = this.calculateBookingVolatility(bookings);
    const confidenceInterval: [number, number] = [
      growthRate - (volatility * 1.96),
      growthRate + (volatility * 1.96)
    ];

    // Project future values
    const projectedValues = [];
    let currentValue = recentRevenue;
    for (let i = 1; i <= 12; i++) {
      currentValue *= (1 + growthRate);
      projectedValues.push(currentValue);
    }

    return {
      trend,
      growthRate,
      confidenceInterval,
      projectedValues
    };
  }

  private calculateBookingVolatility(bookings: Booking[]): number {
    if (bookings.length < 2) return 0;

    const monthlyRevenues = this.groupBookingsByMonth(bookings);
    const revenues = Object.values(monthlyRevenues).map(data => data.revenue);

    if (revenues.length < 2) return 0;

    const mean = revenues.reduce((a, b) => a + b, 0) / revenues.length;
    const variance = revenues.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / revenues.length;

    return Math.sqrt(variance) / mean; // Coefficient of variation
  }

  private async determineSegmentation(
    userId: string,
    features: any,
    historicalMetrics: any
  ): Promise<CustomerSegmentation> {
    // Behavioral segmentation
    let behavioral: string;
    if (features.bookingPatterns.averageIntervalDays < 15) {
      behavioral = 'frequent';
    } else if (features.bookingPatterns.averageIntervalDays < 45) {
      behavioral = 'regular';
    } else if (features.bookingPatterns.averageIntervalDays < 90) {
      behavioral = 'occasional';
    } else {
      behavioral = 'dormant';
    }

    // Value segmentation based on CLV tier
    const clv = historicalMetrics.totalRevenue;
    let value: string;
    if (clv >= 10000) value = 'platinum';
    else if (clv >= 5000) value = 'gold';
    else if (clv >= 2000) value = 'silver';
    else if (clv >= 500) value = 'bronze';
    else value = 'new';

    // Lifecycle segmentation
    let lifecycle: string;
    if (historicalMetrics.tenureMonths < 3) lifecycle = 'new';
    else if (historicalMetrics.tenureMonths < 12) lifecycle = 'growing';
    else if (historicalMetrics.tenureMonths < 36) lifecycle = 'mature';
    else lifecycle = 'loyal';

    // Demographic segmentation (simplified - would be enhanced with actual demographic data)
    const demographic = 'premium'; // Default for luxury market

    // Predict next segment based on trends
    const predictedNextSegment = this.predictNextSegment(features, historicalMetrics);

    return {
      behavioral,
      demographic,
      value,
      lifecycle,
      predictedNextSegment
    };
  }

  private predictNextSegment(features: any, historicalMetrics: any): string {
    const { recencyScore, frequencyScore, monetaryScore, engagementScore } = features;

    if (recencyScore > 0.8 && frequencyScore > 0.7 && monetaryScore > 0.7) {
      return 'platinum';
    } else if (recencyScore > 0.6 && frequencyScore > 0.5) {
      return 'gold';
    } else if (recencyScore > 0.4 && frequencyScore > 0.3) {
      return 'silver';
    } else if (engagementScore > 0.5) {
      return 'bronze';
    } else {
      return 'at_risk';
    }
  }

  private calculateCLVTier(totalCLV: number, historicalMetrics: any): { clvTier: string; valueScore: number } {
    let clvTier: string;
    let valueScore: number;

    if (totalCLV >= 10000) {
      clvTier = 'platinum';
      valueScore = Math.min(100, 90 + (totalCLV - 10000) / 100);
    } else if (totalCLV >= 5000) {
      clvTier = 'gold';
      valueScore = 70 + (totalCLV - 5000) / 50;
    } else if (totalCLV >= 2000) {
      clvTier = 'silver';
      valueScore = 50 + (totalCLV - 2000) / 30;
    } else if (totalCLV >= 500) {
      clvTier = 'bronze';
      valueScore = 30 + (totalCLV - 500) / 15;
    } else {
      clvTier = 'new';
      valueScore = Math.min(30, totalCLV / 20);
    }

    // Adjust score based on tenure and loyalty
    const tenureBonus = Math.min(10, historicalMetrics.tenureMonths / 6);
    valueScore = Math.min(100, valueScore + tenureBonus);

    return { clvTier, valueScore: Math.round(valueScore) };
  }

  private getNewCustomerCLV(userId: string, date: Date): CLVCalculationResult {
    // Default CLV calculation for new customers
    const predictedRevenue12m = 3000; // Average expected first-year value
    const predictedRevenue24m = predictedRevenue12m * 1.5; // Growth expectation
    const totalCLV = predictedRevenue24m;

    return {
      historicalRevenue: 0,
      predictedRevenue12m,
      predictedRevenue24m,
      totalCLV,
      averageOrderValue: 0,
      purchaseFrequency: 0,
      customerTenureMonths: 0,
      profitMargin: 0.7,
      clvTier: 'new',
      valueScore: 15,
      predictionConfidence: 0.3,
      monthlyBreakdown: this.generateNewCustomerProjections(date, predictedRevenue12m),
      growthTrajectory: {
        trend: 'increasing',
        growthRate: 0.5,
        confidenceInterval: [0.2, 0.8],
        projectedValues: Array.from({ length: 12 }, (_, i) => predictedRevenue12m / 12 * (1 + 0.5 * i / 12))
      },
      segmentation: {
        behavioral: 'new',
        demographic: 'premium',
        value: 'new',
        lifecycle: 'new',
        predictedNextSegment: 'bronze'
      }
    };
  }

  private generateNewCustomerProjections(date: Date, predictedRevenue12m: number): MonthlyCLVBreakdown[] {
    const projections: MonthlyCLVBreakdown[] = [];
    const monthlyRevenue = predictedRevenue12m / 12;

    for (let i = 1; i <= 12; i++) {
      const targetDate = new Date(date.getFullYear(), date.getMonth() + i, 1);
      const monthKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;

      const seasonalMultiplier = this.getSeasonalMultiplier(targetDate.getMonth());
      const growthMultiplier = 1 + (0.5 * i / 12); // Gradual growth

      projections.push({
        month: monthKey,
        revenue: 0,
        predictedRevenue: monthlyRevenue * seasonalMultiplier * growthMultiplier,
        bookings: 2, // Assume 2 bookings per month for new customers
        averageValue: monthlyRevenue * seasonalMultiplier * growthMultiplier / 2
      });
    }

    return projections;
  }

  async updateCustomerCLV(userId: string, modelType: 'simple' | 'advanced' | 'premium' = 'advanced'): Promise<void> {
    const clvResult = await this.calculateCLV(userId, modelType);

    const { error } = await supabase
      .from('customer_lifetime_value')
      .upsert({
        user_id: userId,
        calculation_date: new Date().toISOString().split('T')[0],
        historical_revenue: clvResult.historicalRevenue,
        predicted_revenue_12m: clvResult.predictedRevenue12m,
        predicted_revenue_24m: clvResult.predictedRevenue24m,
        total_clv: clvResult.totalCLV,
        average_order_value: clvResult.averageOrderValue,
        purchase_frequency: clvResult.purchaseFrequency,
        customer_tenure_months: clvResult.customerTenureMonths,
        profit_margin: clvResult.profitMargin,
        clv_tier: clvResult.clvTier,
        value_score: clvResult.valueScore,
        prediction_confidence: clvResult.predictionConfidence
      });

    if (error) {
      throw new Error(`Failed to update CLV data: ${error.message}`);
    }
  }

  async batchUpdateCLVs(userIds: string[], modelType: 'simple' | 'advanced' | 'premium' = 'advanced'): Promise<void> {
    const BATCH_SIZE = 10;

    for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
      const batch = userIds.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(userId => this.updateCustomerCLV(userId, modelType).catch(error => {
          console.error(`Failed to update CLV for user ${userId}:`, error);
          return null;
        }))
      );

      // Add small delay to prevent overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  async getCLVTrends(userId: string, months: number = 12): Promise<any[]> {
    const { data, error } = await supabase
      .from('customer_lifetime_value')
      .select('*')
      .eq('user_id', userId)
      .order('calculation_date', { ascending: false })
      .limit(months);

    if (error) {
      throw new Error(`Failed to fetch CLV trends: ${error.message}`);
    }

    return data || [];
  }

  async getSegmentCustomers(clvTier: string, limit: number = 50): Promise<any[]> {
    const { data, error } = await supabase
      .from('customer_lifetime_value')
      .select(`
        *,
        profiles:user_id (
          full_name,
          email,
          phone
        )
      `)
      .eq('clv_tier', clvTier)
      .order('total_clv', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch segment customers: ${error.message}`);
    }

    return data || [];
  }

  async getTopCustomers(limit: number = 100): Promise<any[]> {
    const { data, error } = await supabase
      .from('customer_lifetime_value')
      .select(`
        *,
        profiles:user_id (
          full_name,
          email,
          phone
        )
      `)
      .order('total_clv', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch top customers: ${error.message}`);
    }

    return data || [];
  }
}

export const clvEngine = new CLVEngine();