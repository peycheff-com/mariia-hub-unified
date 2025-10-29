import { aiService, isAIFeatureEnabled } from './config';
import type { SchedulingInsightRequest, SchedulingInsightResponse } from './service';

export interface ServicePattern {
  serviceId: string;
  serviceName: string;
  category: string;
  duration: number;
  averageRating: number;
  bookingFrequency: number;
  peakTimes: string[];
  seasonalTrends: number[];
}

export interface BookingPattern {
  customerId: string;
  preferredDays: string[];
  preferredTimes: string[];
  bookingFrequency: number;
  lastBooking: string;
  averageAdvanceBooking: number;
  cancellations: number;
}

export interface DemandPrediction {
  serviceId: string;
  date: string;
  demandLevel: 'low' | 'medium' | 'high';
  predictedBookings: number;
  confidence: number;
  factors: string[];
}

export interface SchedulingRecommendation {
  type: 'time_slot' | 'price_adjustment' | 'resource_allocation' | 'promotion';
  priority: 'low' | 'medium' | 'high';
  action: string;
  reasoning: string;
  impact: {
    revenue: number;
    efficiency: number;
    satisfaction: number;
  };
}

export class SmartSchedulingEngine {
  private servicePatterns: Map<string, ServicePattern> = new Map();
  private bookingPatterns: Map<string, BookingPattern> = new Map();
  private demandPredictions: Map<string, DemandPrediction[]> = new Map();

  constructor() {
    this.loadHistoricalData();
  }

  private async loadHistoricalData() {
    // Load service patterns from database or API
    // This would typically fetch from your backend
    try {
      // Placeholder for actual data loading
      console.log('Loading historical scheduling data...');
    } catch (error) {
      console.error('Failed to load historical data:', error);
    }
  }

  async generateSchedulingInsights(request: SchedulingInsightRequest): Promise<SchedulingInsightResponse> {
    if (!aiService || !isAIFeatureEnabled('SMART_SCHEDULING')) {
      throw new Error('AI smart scheduling is not available');
    }

    try {
      const response = await aiService.generateSchedulingInsights(request);
      return response;
    } catch (error) {
      console.error('Failed to generate scheduling insights:', error);
      throw error;
    }
  }

  async predictDemand(
    serviceId: string,
    startDate: string,
    endDate: string
  ): Promise<DemandPrediction[]> {
    if (!aiService || !isAIFeatureEnabled('SMART_SCHEDULING')) {
      throw new Error('AI demand prediction is not available');
    }

    const servicePattern = this.servicePatterns.get(serviceId);
    if (!servicePattern) {
      throw new Error(`No pattern data found for service ${serviceId}`);
    }

    const prompt = `Predict demand for service "${servicePattern.serviceName}" (${servicePattern.category})
    from ${startDate} to ${endDate}.

    Historical data:
    - Average rating: ${servicePattern.averageRating}
    - Booking frequency: ${servicePattern.bookingFrequency} per week
    - Peak times: ${servicePattern.peakTimes.join(', ')}
    - Duration: ${servicePattern.duration} minutes

    Consider factors like:
    - Day of week patterns
    - Seasonal trends
    - Local events in Warsaw
    - Weather patterns
    - Previous booking patterns

    Return JSON with array of predictions for each date including:
    - demandLevel (low/medium/high)
    - predictedBookings (number)
    - confidence (0-1)
    - factors (array of influencing factors)`;

    try {
      const response = await aiService['generateContent'](
        prompt,
        'You are an AI demand prediction specialist for beauty and fitness services.',
        0.4,
        2000
      );

      const predictions = JSON.parse(response);
      const demandPredictions: DemandPrediction[] = predictions.map((p: any) => ({
        serviceId,
        date: p.date,
        demandLevel: p.demandLevel,
        predictedBookings: p.predictedBookings,
        confidence: p.confidence,
        factors: p.factors,
      }));

      // Cache predictions
      this.demandPredictions.set(serviceId, demandPredictions);

      return demandPredictions;
    } catch (error) {
      console.error('Failed to predict demand:', error);
      throw error;
    }
  }

  async generateRecommendations(
    serviceIds: string[],
    timeframe: 'week' | 'month' | 'quarter' = 'week'
  ): Promise<SchedulingRecommendation[]> {
    if (!aiService || !isAIFeatureEnabled('RECOMMENDATIONS')) {
      throw new Error('AI recommendations are not available');
    }

    const services = serviceIds.map(id => this.servicePatterns.get(id)).filter(Boolean) as ServicePattern[];

    const prompt = `Generate scheduling recommendations for the following services over the next ${timeframe}:

    ${services.map(s => `
    - ${s.serviceName} (${s.category}): ${s.duration}min, Rating: ${s.averageRating}, Frequency: ${s.bookingFrequency}/week
    `).join('')}

    Analyze and provide recommendations for:
    1. Optimal time slot allocation
    2. Price adjustments based on demand
    3. Resource allocation
    4. Promotional opportunities
    5. Efficiency improvements

    Return JSON array of recommendations with:
    - type (time_slot/price_adjustment/resource_allocation/promotion)
    - priority (low/medium/high)
    - action (specific recommendation)
    - reasoning (why this recommendation)
    - impact (revenue/efficiency/satisfaction scores 0-100)`;

    try {
      const response = await aiService['generateContent'](
        prompt,
        'You are an expert business analyst for beauty and fitness scheduling optimization.',
        0.5,
        2000
      );

      const recommendations = JSON.parse(response);
      return recommendations;
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
      throw error;
    }
  }

  async optimizeSchedule(
    serviceId: string,
    date: string,
    constraints: {
      workingHours: { start: string; end: string };
      breaks: { start: string; end: string }[];
      maxConcurrent: number;
      bufferTime: number;
    }
  ): Promise<{ slots: Array<{ time: string; confidence: number } }> {
    if (!aiService || !isAIFeatureEnabled('SMART_SCHEDULING')) {
      throw new Error('AI schedule optimization is not available');
    }

    const servicePattern = this.servicePatterns.get(serviceId);
    const demandData = this.demandPredictions.get(serviceId) || [];

    const prompt = `Optimize the schedule for ${servicePattern?.serviceName || 'service'} on ${date}.

    Constraints:
    - Working hours: ${constraints.workingHours.start} - ${constraints.workingHours.end}
    - Breaks: ${constraints.breaks.map(b => `${b.start}-${b.end}`).join(', ')}
    - Max concurrent bookings: ${constraints.maxConcurrent}
    - Buffer time between appointments: ${constraints.bufferTime} minutes
    - Service duration: ${servicePattern?.duration || 60} minutes

    Demand data: ${demandData.find(d => d.date === date)?.demandLevel || 'unknown'}

    Generate optimal time slots with confidence scores (0-1).
    Consider:
    - Historical booking patterns
    - Peak demand times
    - Staff efficiency
    - Customer preferences
    - Resource utilization

    Return JSON with array of slots:
    [{ "time": "HH:MM", "confidence": 0.85 }]`;

    try {
      const response = await aiService['generateContent'](
        prompt,
        'You are an AI schedule optimization specialist for service businesses.',
        0.3,
        1500
      );

      const optimized = JSON.parse(response);
      return optimized;
    } catch (error) {
      console.error('Failed to optimize schedule:', error);
      throw error;
    }
  }

  async detectAnomalies(serviceId: string, dateRange: { start: string; end: string }) {
    const prompt = `Analyze booking data for service ID ${serviceId} from ${dateRange.start} to ${dateRange.end}.

    Look for anomalies such as:
    - Unusual booking patterns
    - Sudden demand spikes or drops
    - High cancellation rates
    - Strange time preferences
    - Price sensitivity changes

    Return JSON with:
    - anomalies: Array of detected anomalies
    - severity: low/medium/high for each
    - recommendations: How to address each anomaly
    - confidence: How certain about the anomaly (0-1)`;

    if (!aiService || !isAIFeatureEnabled('SMART_SCHEDULING')) {
      throw new Error('AI anomaly detection is not available');
    }

    try {
      const response = await aiService['generateContent'](
        prompt,
        'You are an AI anomaly detection specialist for booking systems.',
        0.4,
        1500
      );

      return JSON.parse(response);
    } catch (error) {
      console.error('Failed to detect anomalies:', error);
      throw error;
    }
  }

  // Helper methods
  updateServicePattern(pattern: ServicePattern) {
    this.servicePatterns.set(pattern.serviceId, pattern);
  }

  updateBookingPattern(customerId: string, pattern: BookingPattern) {
    this.bookingPatterns.set(customerId, pattern);
  }

  getServicePattern(serviceId: string): ServicePattern | undefined {
    return this.servicePatterns.get(serviceId);
  }

  getBookingPattern(customerId: string): BookingPattern | undefined {
    return this.bookingPatterns.get(customerId);
  }

  clearCache() {
    this.demandPredictions.clear();
  }
}

// Export singleton instance
export const smartSchedulingEngine = new SmartSchedulingEngine();

// React hook for scheduling insights
import { useState } from 'react';

export function useSmartScheduling() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateInsights = async (request: SchedulingInsightRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const insights = await smartSchedulingEngine.generateSchedulingInsights(request);
      return insights;
    } catch (err) {
      setError(err.message || 'Failed to generate insights');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const predictDemand = async (serviceId: string, startDate: string, endDate: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const predictions = await smartSchedulingEngine.predictDemand(serviceId, startDate, endDate);
      return predictions;
    } catch (err) {
      setError(err.message || 'Failed to predict demand');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getRecommendations = async (serviceIds: string[], timeframe?: 'week' | 'month' | 'quarter') => {
    setIsLoading(true);
    setError(null);

    try {
      const recommendations = await smartSchedulingEngine.generateRecommendations(serviceIds, timeframe);
      return recommendations;
    } catch (err) {
      setError(err.message || 'Failed to get recommendations');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    generateInsights,
    predictDemand,
    getRecommendations,
    isLoading,
    error,
    clearError: () => setError(null),
  };
}