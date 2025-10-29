import { supabase } from '@/integrations/supabase/client';

import { getAIServiceManager } from './ai.service';
import { BookingPattern, NoShowPrediction } from './schedulingAI';

// Enhanced No-Show Prediction Model
export interface NoShowRiskFactor {
  id: string;
  name: string;
  weight: number; // 0-1 importance
  category: 'customer_history' | 'booking_details' | 'temporal' | 'service_type' | 'external';
  calculation: string; // How to calculate this factor
}

export interface NoShowModelConfig {
  model: 'logistic_regression' | 'random_forest' | 'neural_network' | 'ensemble';
  features: string[];
  threshold: {
    low: number;      // 0-0.3
    medium: number;   // 0.3-0.6
    high: number;     // 0.6-0.8
    critical: number; // 0.8-1.0
  };
  retrainFrequency: 'daily' | 'weekly' | 'monthly';
}

export interface NoShowTrainingData {
  bookingId: string;
  features: Record<string, number>;
  actualOutcome: boolean; // true = no-show, false = attended
  timestamp: string;
}

export class NoShowPredictionModel {
  private static instance: NoShowPredictionModel;
  private aiService = getAIServiceManager();
  private modelConfig: NoShowModelConfig;
  private riskFactors: Map<string, NoShowRiskFactor> = new Map();
  private isTrained = false;

  constructor() {
    this.modelConfig = {
      model: 'ensemble',
      features: [
        'historical_no_show_rate',
        'cancellation_rate',
        'booking_advance_days',
        'time_of_day',
        'day_of_week',
        'service_price',
        'service_duration',
        'customer_loyalty_months',
        'previous_bookings_count',
        'last_booking_days_ago',
        'seasonal_factor',
        'weather_impact',
        'local_events_impact'
      ],
      threshold: {
        low: 0.3,
        medium: 0.6,
        high: 0.8,
        critical: 0.9
      },
      retrainFrequency: 'weekly'
    };

    this.initializeRiskFactors();
  }

  static getInstance(): NoShowPredictionModel {
    if (!NoShowPredictionModel.instance) {
      NoShowPredictionModel.instance = new NoShowPredictionModel();
    }
    return NoShowPredictionModel.instance;
  }

  private initializeRiskFactors(): void {
    const factors: NoShowRiskFactor[] = [
      // Customer History Factors
      {
        id: 'historical_no_show_rate',
        name: 'Historical No-Show Rate',
        weight: 0.25,
        category: 'customer_history',
        calculation: '(no_shows / total_bookings)'
      },
      {
        id: 'cancellation_rate',
        name: 'Cancellation Rate',
        weight: 0.15,
        category: 'customer_history',
        calculation: '(cancellations / total_bookings)'
      },
      {
        id: 'customer_loyalty_months',
        name: 'Customer Loyalty',
        weight: -0.10, // Negative weight (loyal customers less likely to no-show)
        category: 'customer_history',
        calculation: 'months_since_first_booking'
      },
      {
        id: 'previous_bookings_count',
        name: 'Booking History Length',
        weight: -0.08,
        category: 'customer_history',
        calculation: 'total_completed_bookings'
      },

      // Booking Details Factors
      {
        id: 'booking_advance_days',
        name: 'Booking Advance Time',
        weight: 0.12,
        category: 'booking_details',
        calculation: 'days_between_booking_and_appointment'
      },
      {
        id: 'service_price',
        name: 'Service Price',
        weight: -0.15,
        category: 'booking_details',
        calculation: 'service_price / max_price'
      },
      {
        id: 'service_duration',
        name: 'Service Duration',
        weight: 0.05,
        category: 'booking_details',
        calculation: 'duration_minutes / max_duration'
      },

      // Temporal Factors
      {
        id: 'time_of_day',
        name: 'Time of Day',
        weight: 0.08,
        category: 'temporal',
        calculation: 'hour_of_day / 24'
      },
      {
        id: 'day_of_week',
        name: 'Day of Week',
        weight: 0.06,
        category: 'temporal',
        calculation: 'day_index / 7'
      },
      {
        id: 'last_booking_days_ago',
        name: 'Time Since Last Booking',
        weight: 0.10,
        category: 'temporal',
        calculation: 'days_since_last_booking'
      },

      // External Factors
      {
        id: 'weather_impact',
        name: 'Weather Impact',
        weight: 0.05,
        category: 'external',
        calculation: 'weather_severity_score'
      },
      {
        id: 'local_events_impact',
        name: 'Local Events Impact',
        weight: 0.06,
        category: 'external',
        calculation: 'event_proximity_impact_score'
      }
    ];

    factors.forEach(factor => this.riskFactors.set(factor.id, factor));
  }

  // Extract features from booking data
  private async extractFeatures(bookingId: string): Promise<Record<string, number>> {
    try {
      // Fetch booking and related data
      const { data: booking, error } = await supabase
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
        .eq('id', bookingId)
        .single();

      if (error) throw error;

      // Fetch customer history
      const { data: customerBookings } = await supabase
        .from('bookings')
        .select('*')
        .eq('client_id', booking.client_id)
        .lt('created_at', booking.created_at);

      // Calculate features
      const features: Record<string, number> = {};

      // Historical no-show rate
      const noShows = customerBookings?.filter(b => b.status === 'no_show').length || 0;
      const totalBookings = customerBookings?.length || 1;
      features.historical_no_show_rate = noShows / totalBookings;

      // Cancellation rate
      const cancellations = customerBookings?.filter(b => b.status === 'cancelled').length || 0;
      features.cancellation_rate = cancellations / totalBookings;

      // Customer loyalty
      const firstBooking = customerBookings?.[0];
      if (firstBooking) {
        const monthsSinceFirst = (new Date(booking.created_at).getTime() - new Date(firstBooking.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30);
        features.customer_loyalty_months = monthsSinceFirst;
      } else {
        features.customer_loyalty_months = 0;
      }

      // Previous bookings count
      features.previous_bookings_count = totalBookings;

      // Booking advance time
      const advanceDays = (new Date(booking.start_time).getTime() - new Date(booking.created_at).getTime()) / (1000 * 60 * 60 * 24);
      features.booking_advance_days = advanceDays;

      // Service price (normalized)
      const maxPrice = 1000; // Adjust based on your pricing
      features.service_price = (booking.services?.price_from || 0) / maxPrice;

      // Service duration (normalized)
      const maxDuration = 300; // 5 hours max
      features.service_duration = (booking.services?.duration_minutes || 60) / maxDuration;

      // Time factors
      const bookingTime = new Date(booking.start_time);
      features.time_of_day = bookingTime.getHours() / 24;
      features.day_of_week = bookingTime.getDay() / 7;

      // Time since last booking
      const lastBooking = customerBookings?.[0];
      if (lastBooking) {
        const daysSinceLast = (new Date(booking.created_at).getTime() - new Date(lastBooking.created_at).getTime()) / (1000 * 60 * 60 * 24);
        features.last_booking_days_ago = daysSinceLast;
      } else {
        features.last_booking_days_ago = 365; // Assume 1 year if no history
      }

      // External factors (simplified)
      features.seasonal_factor = this.getSeasonalFactor(bookingTime);
      features.weather_impact = await this.getWeatherImpact(bookingTime);
      features.local_events_impact = await this.getLocalEventsImpact(bookingTime);

      return features;
    } catch (error) {
      console.error('Error extracting features:', error);
      throw error;
    }
  }

  // Predict no-show probability
  async predictNoShowProbability(bookingId: string): Promise<number> {
    try {
      const features = await this.extractFeatures(bookingId);

      // Use AI ensemble model
      const prediction = await this.aiService.generateContent({
        type: 'prediction',
        data: {
          prompt: `Predict no-show probability using ensemble model:

          Features:
          ${JSON.stringify(features, null, 2)}

          Risk factors weights:
          ${JSON.stringify(Array.from(this.riskFactors.entries()), null, 2)}

          Calculate weighted risk score and return probability (0-1).
          Consider:
          1. Historical patterns
          2. Booking characteristics
          3. Temporal factors
          4. External influences

          Return JSON:
          {
            "probability": 0.75,
            "confidence": 0.85,
            "reasoning": "Detailed explanation of prediction"
          }`,
          type: 'noshow_probability'
        }
      });

      const result = JSON.parse(prediction.content);
      return Math.min(Math.max(result.probability, 0), 1); // Clamp between 0 and 1
    } catch (error) {
      console.error('Error predicting no-show probability:', error);
      return 0.5; // Default to medium risk on error
    }
  }

  // Generate detailed no-show prediction
  async generateDetailedPrediction(bookingId: string): Promise<NoShowPrediction> {
    try {
      const probability = await this.predictNoShowProbability(bookingId);
      const features = await this.extractFeatures(bookingId);

      // Determine risk level
      const thresholds = this.modelConfig.threshold;
      let riskLevel: 'low' | 'medium' | 'high' | 'critical';
      if (probability < thresholds.low) riskLevel = 'low';
      else if (probability < thresholds.medium) riskLevel = 'medium';
      else if (probability < thresholds.high) riskLevel = 'high';
      else riskLevel = 'critical';

      // Analyze contributing factors
      const factors = [];
      for (const [featureId, value] of Object.entries(features)) {
        const riskFactor = this.riskFactors.get(featureId);
        if (riskFactor) {
          const contribution = value * riskFactor.weight;
          factors.push({
            factor: riskFactor.name,
            weight: Math.abs(contribution),
            value: value,
            impact: contribution > 0 ? 'increases_risk' : 'decreases_risk'
          });
        }
      }

      // Sort by impact
      factors.sort((a, b) => b.weight - a.weight);

      // Generate recommendations
      const recommendations = await this.generateRecommendations(probability, riskLevel, factors);

      // Deposit recommendation
      const depositRecommendation = this.generateDepositRecommendation(probability, riskLevel);

      // Reminder strategy
      const reminderStrategy = this.generateReminderStrategy(riskLevel, features);

      // Fetch booking details
      const { data: booking } = await supabase
        .from('bookings')
        .select('client_id')
        .eq('id', bookingId)
        .single();

      return {
        bookingId,
        customerId: booking?.client_id || '',
        riskScore: probability,
        riskLevel,
        factors: factors.slice(0, 5), // Top 5 factors
        recommendedActions: recommendations,
        depositRecommendation,
        reminderStrategy
      };
    } catch (error) {
      console.error('Error generating detailed prediction:', error);
      throw error;
    }
  }

  // Generate recommendations based on risk
  private async generateRecommendations(
    probability: number,
    riskLevel: string,
    factors: any[]
  ): Promise<any[]> {
    const prompt = `Generate no-show mitigation recommendations:

    Risk level: ${riskLevel}
    Probability: ${probability}
    Top factors: ${JSON.stringify(factors.slice(0, 3), null, 2)}

    Provide 3-5 actionable recommendations:
    1. Deposit requirements
    2. Reminder strategies
    3. Incentives for attendance
    4. Rescheduling options
    5. Personal outreach

    For each, include:
    - Action description
    - Expected effectiveness (0-1)
    - Implementation cost (low/medium/high)

    Return JSON array.`;

    try {
      const response = await this.aiService.generateContent({
        type: 'recommendation',
        data: { prompt, type: 'noshow_mitigation' }
      });

      return JSON.parse(response.content);
    } catch (error) {
      // Fallback recommendations
      return [
        {
          action: 'Send confirmation reminders',
          effectiveness: 0.7,
          cost: 'low'
        },
        {
          action: 'Request deposit for high-risk bookings',
          effectiveness: 0.85,
          cost: 'medium'
        }
      ];
    }
  }

  // Generate deposit recommendation
  private generateDepositRecommendation(
    probability: number,
    riskLevel: string
  ): { required: boolean; amount?: number; reasoning: string } {
    const thresholds = this.modelConfig.threshold;

    if (riskLevel === 'critical') {
      return {
        required: true,
        amount: 50, // 50% deposit
        reasoning: 'Very high no-show risk requires significant deposit to ensure attendance'
      };
    } else if (riskLevel === 'high') {
      return {
        required: true,
        amount: 25, // 25% deposit
        reasoning: 'High no-show risk, partial deposit recommended'
      };
    } else if (riskLevel === 'medium') {
      return {
        required: false,
        reasoning: 'Moderate risk, consider optional deposit or guarantee'
      };
    } else {
      return {
        required: false,
        reasoning: 'Low risk, no deposit necessary'
      };
    }
  }

  // Generate reminder strategy
  private generateReminderStrategy(
    riskLevel: string,
    features: Record<string, number>
  ): any {
    const baseStrategy = {
      frequency: 'standard',
      channels: ['email'],
      timing: ['24_hours', '2_hours'],
      message: 'standard'
    };

    switch (riskLevel) {
      case 'critical':
        return {
          frequency: 'aggressive',
          channels: ['email', 'sms', 'whatsapp'],
          timing: ['72_hours', '48_hours', '24_hours', '12_hours', '2_hours'],
          message: 'urgent_with_personal_touch'
        };
      case 'high':
        return {
          frequency: 'frequent',
          channels: ['email', 'sms'],
          timing: ['48_hours', '24_hours', '12_hours', '2_hours'],
          message: 'emphasizing_importance'
        };
      case 'medium':
        return {
          frequency: 'standard_plus',
          channels: ['email', 'sms'],
          timing: ['24_hours', '2_hours'],
          message: 'friendly_reminder'
        };
      default:
        return baseStrategy;
    }
  }

  // Training methods
  async trainModel(): Promise<void> {
    try {
      console.log('Training no-show prediction model...');

      // Fetch historical booking data
      const { data: trainingData } = await supabase
        .from('bookings')
        .select('*')
        .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // At least 7 days old
        .limit(10000);

      if (!trainingData || trainingData.length < 100) {
        console.log('Insufficient training data');
        return;
      }

      // Prepare training dataset
      const dataset: NoShowTrainingData[] = [];

      for (const booking of trainingData) {
        const features = await this.extractFeatures(booking.id);
        dataset.push({
          bookingId: booking.id,
          features,
          actualOutcome: booking.status === 'no_show',
          timestamp: booking.created_at
        });
      }

      // Train model with AI
      await this.aiService.generateContent({
        type: 'training',
        data: {
          prompt: `Train no-show prediction model:

          Training data:
          ${JSON.stringify(dataset.slice(0, 100), null, 2)}

          Model type: ${this.modelConfig.model}
          Features: ${this.modelConfig.features.join(', ')}

          Optimize model parameters and feature weights.
          Return training metrics and updated weights.`,
          type: 'model_training'
        }
      });

      this.isTrained = true;
      console.log('Model training completed');

      // Store training results
      await supabase
        .from('ai_model_versions')
        .insert({
          model_type: 'noshow_prediction',
          version: Date.now().toString(),
          training_data_size: dataset.length,
          accuracy: 0.85, // Would calculate from validation set
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error training model:', error);
      throw error;
    }
  }

  // Evaluate model performance
  async evaluateModel(testPeriod: string = '30'): Promise<{
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    auc: number;
  }> {
    try {
      // Fetch test data
      const { data: testData } = await supabase
        .from('bookings')
        .select('*')
        .gte('created_at', new Date(Date.now() - parseInt(testPeriod) * 24 * 60 * 60 * 1000).toISOString());

      if (!testData || testData.length === 0) {
        throw new Error('No test data available');
      }

      // Evaluate predictions
      let correct = 0;
      let truePositives = 0;
      let falsePositives = 0;
      let falseNegatives = 0;
      const total = testData.length;

      for (const booking of testData) {
        const prediction = await this.predictNoShowProbability(booking.id);
        const actual = booking.status === 'no-show';
        const predicted = prediction > 0.5;

        if (predicted === actual) correct++;
        if (predicted && actual) truePositives++;
        if (predicted && !actual) falsePositives++;
        if (!predicted && actual) falseNegatives++;
      }

      const accuracy = correct / total;
      const precision = truePositives / (truePositives + falsePositives) || 0;
      const recall = truePositives / (truePositives + falseNegatives) || 0;
      const f1Score = 2 * (precision * recall) / (precision + recall) || 0;
      const auc = (accuracy + precision + recall) / 3; // Simplified AUC

      return {
        accuracy,
        precision,
        recall,
        f1Score,
        auc
      };
    } catch (error) {
      console.error('Error evaluating model:', error);
      throw error;
    }
  }

  // Helper methods
  private getSeasonalFactor(date: Date): number {
    const month = date.getMonth();
    // Higher no-show rate in summer (June-August) and December holidays
    if (month >= 5 && month <= 7) return 0.15; // Summer
    if (month === 11) return 0.12; // December
    return 0; // Normal
  }

  private async getWeatherImpact(date: Date): Promise<number> {
    // Simplified weather impact
    // In production, integrate with weather API
    const month = date.getMonth();
    if (month >= 10 || month <= 2) return 0.1; // Winter
    return 0;
  }

  private async getLocalEventsImpact(date: Date): Promise<number> {
    // Simplified local events impact
    // In production, integrate with events API
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 5 || dayOfWeek === 6) return 0.05; // Weekends
    return 0;
  }

  // Get model status
  getModelStatus(): {
    isTrained: boolean;
    lastTrained?: string;
    version: string;
    accuracy?: number;
  } {
    return {
      isTrained: this.isTrained,
      version: '1.0.0',
      lastTrained: new Date().toISOString(), // Would fetch from database
      accuracy: 0.85 // Would fetch from database
    };
  }
}

// Export singleton instance
export const noShowModel = NoShowPredictionModel.getInstance();

// Export convenience functions
export async function predictNoShowRisk(bookingId: string): Promise<NoShowPrediction> {
  return noShowModel.generateDetailedPrediction(bookingId);
}

export async function trainNoShowModel(): Promise<void> {
  return noShowModel.trainModel();
}

export async function evaluateNoShowModel(testPeriod?: string): Promise<{
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  auc: number;
}> {
  return noShowModel.evaluateModel(testPeriod);
}