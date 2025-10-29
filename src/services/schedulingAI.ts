import { supabase } from '@/integrations/supabase/client';

import { getAIServiceManager } from './ai.service';

// Types for AI Scheduling System
export interface BookingPattern {
  customerId: string;
  serviceId: string;
  preferredDays: number[]; // 0-6 (Sunday-Saturday)
  preferredTimes: number[]; // Hour of day (0-23)
  bookingFrequency: number; // Bookings per month
  averageAdvanceBooking: number; // Days in advance
  seasonalPreferences: number[]; // Monthly preferences (1-12)
  cancellationHistory: {
    total: number;
    reasons: string[];
    patterns: number[]; // Hours before cancellation
  };
  noShowHistory: {
    total: number;
    lastOccurrence?: string;
    riskFactors: string[];
  };
  packageBookings: boolean;
  loyaltyPoints: number;
  timeSinceLastBooking: number; // Days
}

export interface ServicePattern {
  serviceId: string;
  serviceName: string;
  category: 'beauty' | 'fitness' | 'lifestyle';
  duration: number;
  price: number;
  peakDemand: {
    days: number[];
    times: number[];
    months: number[];
  };
  seasonalTrends: {
    month: number;
    demandMultiplier: number;
  }[];
  bookingFrequency: number;
  averageRating: number;
  cancellationRate: number;
  noShowRate: number;
  popularAddons: string[];
  packageDeals: string[];
}

export interface SchedulingPrediction {
  date: string;
  timeSlots: TimeSlotPrediction[];
  overallDemand: 'low' | 'medium' | 'high';
  confidence: number;
  factors: string[];
  recommendations: SchedulingRecommendation[];
}

export interface TimeSlotPrediction {
  time: string;
  score: number; // 0-1
  predictedDemand: 'low' | 'medium' | 'high';
  fillProbability: number; // 0-1
  revenuePotential: number;
  reasoning: string;
}

export interface SchedulingRecommendation {
  type: 'optimal_time' | 'price_adjustment' | 'promotion' | 'resource_allocation' | 'reminder';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  action: {
    type: string;
    parameters: Record<string, any>;
  };
  expectedImpact: {
    revenue: number; // Percentage change
    efficiency: number; // Percentage change
    satisfaction: number; // Percentage change
  };
  confidence: number;
  validUntil: string;
}

export interface NoShowPrediction {
  bookingId: string;
  customerId: string;
  riskScore: number; // 0-1
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: {
    factor: string;
    weight: number;
    value: any;
  }[];
  recommendedActions: {
    action: string;
    effectiveness: number;
    cost?: number;
  }[];
  depositRecommendation: {
    required: boolean;
    amount?: number;
    reasoning: string;
  };
  reminderStrategy: {
    frequency: string;
    channels: string[];
    timing: string[];
    message: string;
  };
}

export interface SmartReminderConfig {
  bookingId: string;
  customerId: string;
  optimalTiming: {
    firstReminder: string; // ISO datetime
    finalReminder: string; // ISO datetime
    additionalReminders?: string[]; // ISO datetimes
  };
  channels: ('email' | 'sms' | 'whatsapp' | 'push')[];
  message: {
    template: string;
    personalization: Record<string, any>;
    tone: 'friendly' | 'professional' | 'urgent';
  };
  effectiveness: {
    predictedOpenRate: number;
    predictedConfirmationRate: number;
    reducedNoShowProbability: number;
  };
}

export interface SchedulingAnalytics {
  period: string;
  totalBookings: number;
  noShowRate: number;
  cancellationRate: number;
  averageRevenuePerBooking: number;
  fillRate: number;
  customerSatisfaction: number;
  predictionsAccuracy: {
    demand: number;
    noShow: number;
    cancellations: number;
  };
  revenueOptimization: {
    actual: number;
    predicted: number;
    improvement: number;
  };
  timeSlotUtilization: {
    hour: number;
    utilization: number;
    revenue: number;
  }[];
  servicePerformance: {
    serviceId: string;
    serviceName: string;
    bookings: number;
    revenue: number;
    rating: number;
    noShowRate: number;
  }[];
}

// Main Scheduling AI Service
export class SchedulingAIService {
  private static instance: SchedulingAIService;
  private aiService = getAIServiceManager();
  private patternCache = new Map<string, BookingPattern>();
  private serviceCache = new Map<string, ServicePattern>();
  private lastCacheUpdate = new Map<string, number>();

  static getInstance(): SchedulingAIService {
    if (!SchedulingAIService.instance) {
      SchedulingAIService.instance = new SchedulingAIService();
    }
    return SchedulingAIService.instance;
  }

  // Analyze booking patterns for a customer
  async analyzeBookingPatterns(customerId: string): Promise<BookingPattern> {
    const cacheKey = `pattern_${customerId}`;
    const now = Date.now();

    // Check cache (valid for 1 hour)
    if (this.patternCache.has(cacheKey) &&
        this.lastCacheUpdate.get(cacheKey) &&
        now - this.lastCacheUpdate.get(cacheKey)! < 3600000) {
      return this.patternCache.get(cacheKey)!;
    }

    try {
      // Fetch customer's booking history
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          *,
          services(
            id,
            name,
            category,
            duration_minutes,
            price_from
          )
        `)
        .eq('client_id', customerId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Analyze patterns with AI
      const pattern = await this.aiService.generateContent({
        type: 'analysis',
        data: {
          prompt: `Analyze booking patterns for customer ID: ${customerId}

          Booking history:
          ${JSON.stringify(bookings, null, 2)}

          Extract and analyze:
          1. Preferred days of week
          2. Preferred times of day
          3. Booking frequency per month
          4. Average advance booking time
          5. Seasonal preferences
          6. Cancellation patterns and reasons
          7. No-show history and risk factors
          8. Package booking tendencies
          9. Time since last booking

          Return JSON with the BookingPattern structure.`,
          type: 'booking_pattern_analysis'
        }
      });

      const bookingPattern: BookingPattern = JSON.parse(pattern.content);

      // Cache the result
      this.patternCache.set(cacheKey, bookingPattern);
      this.lastCacheUpdate.set(cacheKey, now);

      return bookingPattern;
    } catch (error) {
      console.error('Error analyzing booking patterns:', error);
      throw error;
    }
  }

  // Analyze service patterns
  async analyzeServicePatterns(serviceId: string): Promise<ServicePattern> {
    const cacheKey = `service_${serviceId}`;
    const now = Date.now();

    // Check cache (valid for 6 hours)
    if (this.serviceCache.has(cacheKey) &&
        this.lastCacheUpdate.get(cacheKey) &&
        now - this.lastCacheUpdate.get(cacheKey)! < 21600000) {
      return this.serviceCache.get(cacheKey)!;
    }

    try {
      // Fetch service data and bookings
      const { data: service, error: serviceError } = await supabase
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .single();

      if (serviceError) throw serviceError;

      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('service_id', serviceId)
        .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()) // Last 90 days
        .limit(200);

      if (bookingsError) throw bookingsError;

      // Analyze with AI
      const analysis = await this.aiService.generateContent({
        type: 'analysis',
        data: {
          prompt: `Analyze service patterns for service: ${service.name}

          Service details:
          ${JSON.stringify(service, null, 2)}

          Recent bookings (last 90 days):
          ${JSON.stringify(bookings, null, 2)}

          Extract and analyze:
          1. Peak demand days and times
          2. Seasonal trends
          3. Booking frequency patterns
          4. Cancellation and no-show rates
          5. Popular add-ons and packages
          6. Revenue patterns

          Return JSON with the ServicePattern structure.`,
          type: 'service_pattern_analysis'
        }
      });

      const servicePattern: ServicePattern = JSON.parse(analysis.content);

      // Cache the result
      this.serviceCache.set(cacheKey, servicePattern);
      this.lastCacheUpdate.set(cacheKey, now);

      return servicePattern;
    } catch (error) {
      console.error('Error analyzing service patterns:', error);
      throw error;
    }
  }

  // Predict optimal scheduling for a date range
  async predictOptimalScheduling(
    serviceId: string,
    startDate: string,
    endDate: string,
    constraints?: {
      workingHours?: { start: string; end: string };
      breaks?: Array<{ start: string; end: string }>;
      maxConcurrent?: number;
      bufferTime?: number;
    }
  ): Promise<SchedulingPrediction[]> {
    try {
      const servicePattern = await this.analyzeServicePatterns(serviceId);
      const predictions: SchedulingPrediction[] = [];

      // Generate predictions for each day in range
      const start = new Date(startDate);
      const end = new Date(endDate);

      for (let date = start; date <= end; date.setDate(date.getDate() + 1)) {
        const dateStr = date.toISOString().split('T')[0];

        // Use AI to predict time slots for this date
        const prediction = await this.aiService.generateContent({
          type: 'prediction',
          data: {
            prompt: `Predict optimal time slots for ${servicePattern.serviceName} on ${dateStr}

            Service pattern data:
            ${JSON.stringify(servicePattern, null, 2)}

            Constraints:
            ${JSON.stringify(constraints, null, 2)}

            Date context:
            - Day of week: ${date.getDay()}
            - Month: ${date.getMonth() + 1}
            - Is weekend: ${date.getDay() === 0 || date.getDay() === 6}

            Generate time slots from 08:00 to 20:00 at ${servicePattern.duration} minute intervals.

            For each time slot, provide:
            - Score (0-1) based on historical demand
            - Predicted demand level
            - Fill probability
            - Revenue potential (0-1 scale)
            - Reasoning for the score

            Also provide:
            - Overall demand for the day
            - Key factors influencing demand
            - 3-5 specific recommendations

            Return JSON matching SchedulingPrediction structure.`,
            type: 'schedule_prediction'
          }
        });

        const dayPrediction: SchedulingPrediction = JSON.parse(prediction.content);
        predictions.push(dayPrediction);
      }

      return predictions;
    } catch (error) {
      console.error('Error predicting optimal scheduling:', error);
      throw error;
    }
  }

  // Predict no-show risk for a booking
  async predictNoShowRisk(bookingId: string): Promise<NoShowPrediction> {
    try {
      // Fetch booking details
      const { data: booking, error } = await supabase
        .from('bookings')
        .select(`
          *,
          services(
            id,
            name,
            category,
            price_from
          )
        `)
        .eq('id', bookingId)
        .single();

      if (error) throw error;

      // Get customer patterns
      const customerPattern = await this.analyzeBookingPatterns(booking.client_id);

      // Predict with AI
      const prediction = await this.aiService.generateContent({
        type: 'prediction',
        data: {
          prompt: `Predict no-show risk for booking:

          Booking details:
          ${JSON.stringify(booking, null, 2)}

          Customer pattern:
          ${JSON.stringify(customerPattern, null, 2)}

          Analyze risk factors:
          1. Historical no-show rate
          2. Cancellation patterns
          3. Booking advance time
          4. Time of day/day of week
          5. Service type and price
          6. Customer loyalty and history

          Provide:
          - Risk score (0-1)
          - Risk level classification
          - Key contributing factors with weights
          - Recommended actions with effectiveness
          - Deposit recommendation if needed
          - Optimal reminder strategy

          Return JSON matching NoShowPrediction structure.`,
          type: 'noshow_prediction'
        }
      });

      const noShowPrediction: NoShowPrediction = JSON.parse(prediction.content);

      // Store prediction for analytics
      await supabase
        .from('ai_predictions')
        .insert({
          type: 'noshow',
          target_id: bookingId,
          prediction: noShowPrediction,
          created_at: new Date().toISOString()
        });

      return noShowPrediction;
    } catch (error) {
      console.error('Error predicting no-show risk:', error);
      throw error;
    }
  }

  // Generate smart reminder configuration
  async generateSmartReminder(bookingId: string): Promise<SmartReminderConfig> {
    try {
      // Get no-show prediction
      const noShowRisk = await this.predictNoShowRisk(bookingId);

      // Fetch booking details
      const { data: booking, error } = await supabase
        .from('bookings')
        .select(`
          *,
          services(
            id,
            name,
            duration_minutes
          )
        `)
        .eq('id', bookingId)
        .single();

      if (error) throw error;

      // Generate optimal reminder strategy
      const reminderConfig = await this.aiService.generateContent({
        type: 'recommendation',
        data: {
          prompt: `Generate optimal reminder strategy for booking:

          Booking details:
          ${JSON.stringify(booking, null, 2)}

          No-show risk assessment:
          ${JSON.stringify(noShowRisk, null, 2)}

          Consider:
          1. Risk level and factors
          2. Time until appointment
          3. Customer preferences and history
          4. Service type and duration
          5. Best communication channels

          Provide:
          - Optimal timing for reminders
          - Best channels (email, SMS, WhatsApp, push)
          - Personalized message content
          - Predicted effectiveness metrics

          Return JSON matching SmartReminderConfig structure.`,
          type: 'reminder_optimization'
        }
      });

      const config: SmartReminderConfig = JSON.parse(reminderConfig.content);
      return config;
    } catch (error) {
      console.error('Error generating smart reminder:', error);
      throw error;
    }
  }

  // Get scheduling analytics
  async getSchedulingAnalytics(
    period: 'week' | 'month' | 'quarter' | 'year',
    startDate?: string,
    endDate?: string
  ): Promise<SchedulingAnalytics> {
    try {
      // Default date range if not provided
      const now = new Date();
      const start = startDate || new Date(now.getTime() - this.getPeriodMs(period));
      const end = endDate || now.toISOString();

      // Fetch analytics data
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          *,
          services(
            id,
            name,
            category,
            price_from
          )
        `)
        .gte('created_at', start)
        .lte('created_at', end);

      if (error) throw error;

      // Generate analytics with AI
      const analytics = await this.aiService.generateContent({
        type: 'analysis',
        data: {
          prompt: `Generate comprehensive scheduling analytics for period: ${period}

          Booking data:
          ${JSON.stringify(bookings, null, 2)}

          Calculate:
          1. Total bookings and revenue
          2. No-show and cancellation rates
          3. Fill rate and utilization
          4. Time slot performance
          5. Service performance breakdown
          6. Revenue optimization metrics
          7. Customer satisfaction indicators

          Return JSON matching SchedulingAnalytics structure.`,
          type: 'scheduling_analytics'
        }
      });

      const schedulingAnalytics: SchedulingAnalytics = JSON.parse(analytics.content);
      return schedulingAnalytics;
    } catch (error) {
      console.error('Error generating scheduling analytics:', error);
      throw error;
    }
  }

  // Get personalized scheduling recommendations
  async getPersonalizedRecommendations(
    customerId: string,
    serviceIds?: string[]
  ): Promise<SchedulingRecommendation[]> {
    try {
      const customerPattern = await this.analyzeBookingPatterns(customerId);

      // If no specific services, get favorites
      let services = serviceIds;
      if (!services || services.length === 0) {
        const { data: favorites } = await supabase
          .from('user_favorites')
          .select('service_id')
          .eq('user_id', customerId);
        services = favorites?.map(f => f.service_id) || [];
      }

      // Get service patterns
      const servicePatterns = await Promise.all(
        (services || []).map(id => this.analyzeServicePatterns(id))
      );

      // Generate recommendations
      const recommendations = await this.aiService.generateContent({
        type: 'recommendation',
        data: {
          prompt: `Generate personalized scheduling recommendations for customer:

          Customer pattern:
          ${JSON.stringify(customerPattern, null, 2)}

          Interested services:
          ${JSON.stringify(servicePatterns, null, 2)}

          Provide 5-7 recommendations covering:
          1. Optimal booking times
          2. Package deals
          3. Promotions
          4. New services they might like
          5. Loyalty benefits

          Each recommendation should include:
          - Type and priority
          - Clear title and description
          - Specific action to take
          - Expected impact metrics
          - Confidence score

          Return JSON array of SchedulingRecommendation objects.`,
          type: 'personalized_recommendations'
        }
      });

      return JSON.parse(recommendations.content);
    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
      throw error;
    }
  }

  // Batch process for updating all patterns
  async updateAllPatterns(): Promise<void> {
    try {
      console.log('Starting batch pattern update...');

      // Update service patterns
      const { data: services } = await supabase
        .from('services')
        .select('id')
        .eq('status', 'active');

      if (services) {
        for (const service of services) {
          try {
            await this.analyzeServicePatterns(service.id);
            console.log(`Updated pattern for service: ${service.id}`);
          } catch (error) {
            console.error(`Failed to update service ${service.id}:`, error);
          }
        }
      }

      // Update booking patterns for active customers
      const { data: customers } = await supabase
        .from('profiles')
        .select('id')
        .eq('active', true)
        .limit(100);

      if (customers) {
        for (const customer of customers) {
          try {
            await this.analyzeBookingPatterns(customer.id);
            console.log(`Updated pattern for customer: ${customer.id}`);
          } catch (error) {
            console.error(`Failed to update customer ${customer.id}:`, error);
          }
        }
      }

      console.log('Batch pattern update completed');
    } catch (error) {
      console.error('Error in batch pattern update:', error);
      throw error;
    }
  }

  // Clear cache
  clearCache(): void {
    this.patternCache.clear();
    this.serviceCache.clear();
    this.lastCacheUpdate.clear();
  }

  // Helper methods
  private getPeriodMs(period: string): number {
    switch (period) {
      case 'week': return 7 * 24 * 60 * 60 * 1000;
      case 'month': return 30 * 24 * 60 * 60 * 1000;
      case 'quarter': return 90 * 24 * 60 * 60 * 1000;
      case 'year': return 365 * 24 * 60 * 60 * 1000;
      default: return 30 * 24 * 60 * 60 * 1000;
    }
  }
}

// Export singleton instance
export const schedulingAI = SchedulingAIService.getInstance();

// Export convenience functions
export async function analyzeBookingPatterns(customerId: string): Promise<BookingPattern> {
  return schedulingAI.analyzeBookingPatterns(customerId);
}

export async function predictNoShowRisk(bookingId: string): Promise<NoShowPrediction> {
  return schedulingAI.predictNoShowRisk(bookingId);
}

export async function generateSmartReminder(bookingId: string): Promise<SmartReminderConfig> {
  return schedulingAI.generateSmartReminder(bookingId);
}

export async function getSchedulingAnalytics(
  period: 'week' | 'month' | 'quarter' | 'year',
  startDate?: string,
  endDate?: string
): Promise<SchedulingAnalytics> {
  return schedulingAI.getSchedulingAnalytics(period, startDate, endDate);
}

export async function getPersonalizedRecommendations(
  customerId: string,
  serviceIds?: string[]
): Promise<SchedulingRecommendation[]> {
  return schedulingAI.getPersonalizedRecommendations(customerId, serviceIds);
}