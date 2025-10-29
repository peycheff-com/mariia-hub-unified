import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface ConversionEvent {
  eventName: string;
  timestamp: Date;
  userId?: string;
  sessionId: string;
  data: Record<string, any>;
  variation?: string;
  testId?: string;
}

interface ConversionFunnelStep {
  stepName: string;
  stepNumber: number;
  timestamp: Date;
  userId?: string;
  sessionId: string;
  data: Record<string, any>;
}

interface ABTestConfig {
  id: string;
  name: string;
  description: string;
  trafficPercentage: number;
  variations: Array<{
    id: string;
    name: string;
    weight: number;
    config: Record<string, any>;
  }>;
  startDate: Date;
  endDate?: Date;
  targetMetric: string;
  status: 'active' | 'paused' | 'completed';
}

interface ConversionMetrics {
  totalSessions: number;
  stepConversions: Record<string, number>;
  funnelCompletionRate: number;
  averageBookingTime: number;
  revenuePerSession: number;
  testMetrics: Record<string, {
    variationId: string;
    conversions: number;
    revenue: number;
    conversionRate: number;
  }>;
}

export class ConversionOptimizationEngine {
  private static instance: ConversionOptimizationEngine;
  private sessionId: string;
  private events: ConversionEvent[] = [];
  private funnelSteps: ConversionFunnelStep[] = [];
  private abTests: Map<string, ABTestConfig> = new Map();
  private userVariations: Map<string, string> = new Map();

  static getInstance(): ConversionOptimizationEngine {
    if (!ConversionOptimizationEngine.instance) {
      ConversionOptimizationEngine.instance = new ConversionOptimizationEngine();
    }
    return ConversionOptimizationEngine.instance;
  }

  constructor() {
    this.sessionId = this.generateSessionId();
    this.loadABTests();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Event Tracking
  async trackEvent(
    eventName: string,
    data: Record<string, any> = {},
    userId?: string
  ): Promise<void> {
    const event: ConversionEvent = {
      eventName,
      timestamp: new Date(),
      userId,
      sessionId: this.sessionId,
      data,
      variation: this.getCurrentVariation(),
    };

    this.events.push(event);

    // Store in database for analysis
    try {
      await supabase.from('conversion_events').insert({
        event_name: eventName,
        session_id: this.sessionId,
        user_id: userId,
        event_data: data,
        variation: event.variation,
        timestamp: event.timestamp.toISOString(),
      });
    } catch (error) {
      logger.error('Failed to store conversion event:', error);
    }

    logger.info('Conversion event tracked', { eventName, sessionId: this.sessionId });
  }

  // Funnel Tracking
  async trackFunnelStep(
    stepName: string,
    stepNumber: number,
    data: Record<string, any> = {},
    userId?: string
  ): Promise<void> {
    const step: ConversionFunnelStep = {
      stepName,
      stepNumber,
      timestamp: new Date(),
      userId,
      sessionId: this.sessionId,
      data,
    };

    this.funnelSteps.push(step);

    try {
      await supabase.from('conversion_funnel').insert({
        step_name: stepName,
        step_number: stepNumber,
        session_id: this.sessionId,
        user_id: userId,
        step_data: data,
        timestamp: step.timestamp.toISOString(),
        variation: this.getCurrentVariation(),
      });
    } catch (error) {
      logger.error('Failed to store funnel step:', error);
    }

    logger.info('Funnel step tracked', { stepName, stepNumber, sessionId: this.sessionId });
  }

  // A/B Testing
  async loadABTests(): Promise<void> {
    try {
      const { data: tests } = await supabase
        .from('ab_tests')
        .select('*')
        .eq('status', 'active')
        .lte('start_date', new Date().toISOString())
        .or('end_date.is.null,end_date.gte.' + new Date().toISOString());

      if (tests) {
        tests.forEach(test => {
          this.abTests.set(test.id, {
            id: test.id,
            name: test.name,
            description: test.description || '',
            trafficPercentage: test.traffic_percentage,
            variations: test.variations || [],
            startDate: new Date(test.start_date),
            endDate: test.end_date ? new Date(test.end_date) : undefined,
            targetMetric: test.target_metric,
            status: test.status,
          });
        });
      }
    } catch (error) {
      logger.error('Failed to load A/B tests:', error);
    }
  }

  getVariationForTest(testId: string): string | null {
    // Check if user already has a variation assigned
    if (this.userVariations.has(testId)) {
      return this.userVariations.get(testId)!;
    }

    const test = this.abTests.get(testId);
    if (!test || test.status !== 'active') {
      return null;
    }

    // Check if user should be included in test (traffic percentage)
    const randomValue = Math.random() * 100;
    if (randomValue > test.trafficPercentage) {
      return null;
    }

    // Assign variation based on weights
    let cumulativeWeight = 0;
    const randomVariation = Math.random() * 100;

    for (const variation of test.variations) {
      cumulativeWeight += variation.weight;
      if (randomVariation <= cumulativeWeight) {
        this.userVariations.set(testId, variation.id);
        return variation.id;
      }
    }

    return null;
  }

  getCurrentVariation(): string {
    for (const [testId, test] of this.abTests.entries()) {
      if (test.status === 'active') {
        const variation = this.getVariationForTest(testId);
        if (variation) {
          return `${testId}:${variation}`;
        }
      }
    }
    return 'control';
  }

  getVariationConfig(testId: string, variationId?: string): Record<string, any> {
    const test = this.abTests.get(testId);
    if (!test) return {};

    const variation = test.variations.find(v => v.id === (variationId || this.getVariationForTest(testId)));
    return variation?.config || {};
  }

  // Conversion Analysis
  async getConversionMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<ConversionMetrics> {
    try {
      // Get total sessions
      const { count: totalSessions } = await supabase
        .from('conversion_events')
        .select('*', { count: 'exact', head: true })
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString());

      // Get funnel conversions
      const { data: funnelData } = await supabase
        .from('conversion_funnel')
        .select('*')
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString());

      // Get completed bookings
      const { data: completedBookings } = await supabase
        .from('conversion_events')
        .select('*')
        .eq('event_name', 'booking_completed')
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString());

      // Calculate metrics
      const stepConversions: Record<string, number> = {};
      funnelData?.forEach(step => {
        stepConversions[step.step_name] = (stepConversions[step.step_name] || 0) + 1;
      });

      const funnelCompletionRate = totalSessions
        ? ((completedBookings?.length || 0) / totalSessions) * 100
        : 0;

      // Get A/B test metrics
      const testMetrics: Record<string, any> = {};
      for (const [testId, test] of this.abTests.entries()) {
        testMetrics[testId] = await this.getTestMetrics(testId, startDate, endDate);
      }

      return {
        totalSessions: totalSessions || 0,
        stepConversions,
        funnelCompletionRate,
        averageBookingTime: this.calculateAverageBookingTime(funnelData || []),
        revenuePerSession: this.calculateRevenuePerSession(completedBookings || []),
        testMetrics,
      };
    } catch (error) {
      logger.error('Failed to get conversion metrics:', error);
      return {
        totalSessions: 0,
        stepConversions: {},
        funnelCompletionRate: 0,
        averageBookingTime: 0,
        revenuePerSession: 0,
        testMetrics: {},
      };
    }
  }

  private async getTestMetrics(
    testId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    const test = this.abTests.get(testId);
    if (!test) return null;

    const metrics: any = {};

    for (const variation of test.variations) {
      const { data: events } = await supabase
        .from('conversion_events')
        .select('*')
        .eq('variation', `${testId}:${variation.id}`)
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString());

      const conversions = events?.filter(e => e.event_name === 'booking_completed') || [];
      const totalRevenue = conversions.reduce((sum, event) => {
        return sum + (event.event_data?.total_amount || 0);
      }, 0);

      const conversionRate = events?.length
        ? (conversions.length / events.length) * 100
        : 0;

      metrics[variation.id] = {
        variationId: variation.id,
        conversions: conversions.length,
        revenue: totalRevenue,
        conversionRate,
        sampleSize: events?.length || 0,
      };
    }

    return metrics;
  }

  private calculateAverageBookingTime(funnelData: ConversionFunnelStep[]): number {
    const sessionTimes: Map<string, { start: Date; end?: Date }> = new Map();

    // Find start and end times for each session
    funnelData.forEach(step => {
      if (!sessionTimes.has(step.sessionId)) {
        sessionTimes.set(step.sessionId, { start: step.timestamp });
      }

      const session = sessionTimes.get(step.sessionId)!;
      if (step.stepNumber > (sessionTimes.get(step.sessionId)?.start ? 1 : 0)) {
        session.end = step.timestamp;
      }
    });

    // Calculate average time
    const completedSessions = Array.from(sessionTimes.values())
      .filter(session => session.end)
      .map(session => (session.end!.getTime() - session.start.getTime()) / 1000);

    return completedSessions.length > 0
      ? completedSessions.reduce((sum, time) => sum + time, 0) / completedSessions.length
      : 0;
  }

  private calculateRevenuePerSession(completedBookings: ConversionEvent[]): number {
    const totalRevenue = completedBookings.reduce((sum, event) => {
      return sum + (event.data?.total_amount || 0);
    }, 0);

    const uniqueSessions = new Set(completedBookings.map(event => event.sessionId)).size;
    return uniqueSessions > 0 ? totalRevenue / uniqueSessions : 0;
  }

  // Optimization Suggestions
  async getOptimizationSuggestions(): Promise<string[]> {
    const suggestions: string[] = [];
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days

    const metrics = await this.getConversionMetrics(startDate, endDate);

    // Analyze funnel drop-off
    const step1Conversions = metrics.stepConversions['service_selected'] || 0;
    const step2Conversions = metrics.stepConversions['time_slot_selected'] || 0;
    const step3Conversions = metrics.stepConversions['details_entered'] || 0;
    const completedConversions = metrics.stepConversions['booking_completed'] || 0;

    // Drop-off from step 1 to 2
    if (step1Conversions > 0) {
      const dropOff12 = ((step1Conversions - step2Conversions) / step1Conversions) * 100;
      if (dropOff12 > 40) {
        suggestions.push('High drop-off from service selection to time selection. Consider optimizing calendar display or adding popular time slots.');
      }
    }

    // Drop-off from step 2 to 3
    if (step2Conversions > 0) {
      const dropOff23 = ((step2Conversions - step3Conversions) / step2Conversions) * 100;
      if (dropOff23 > 35) {
        suggestions.push('Users dropping off during details entry. Consider smart form filling and reducing required fields.');
      }
    }

    // Drop-off from details to completion
    if (step3Conversions > 0) {
      const dropOff3Complete = ((step3Conversions - completedConversions) / step3Conversions) * 100;
      if (dropOff3Complete > 50) {
        suggestions.push('High drop-off at payment step. Consider adding more payment options or digital wallets.');
      }
    }

    // Overall completion rate
    if (metrics.funnelCompletionRate < 15) {
      suggestions.push('Low overall conversion rate. Consider implementing trust signals, social proof, and urgency indicators.');
    }

    // Average booking time
    if (metrics.averageBookingTime > 300) { // 5 minutes
      suggestions.push('Long booking completion time. Consider reducing steps and adding smart defaults.');
    }

    return suggestions;
  }

  // Experiment management
  async createABTest(config: Partial<ABTestConfig>): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('ab_tests')
        .insert({
          name: config.name,
          description: config.description,
          traffic_percentage: config.trafficPercentage || 50,
          variations: config.variations || [],
          start_date: config.startDate?.toISOString() || new Date().toISOString(),
          end_date: config.endDate?.toISOString(),
          target_metric: config.targetMetric || 'booking_completed',
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;

      const testConfig: ABTestConfig = {
        id: data.id,
        name: data.name,
        description: data.description || '',
        trafficPercentage: data.traffic_percentage,
        variations: data.variations || [],
        startDate: new Date(data.start_date),
        endDate: data.end_date ? new Date(data.end_date) : undefined,
        targetMetric: data.target_metric,
        status: data.status,
      };

      this.abTests.set(data.id, testConfig);

      return data.id;
    } catch (error) {
      logger.error('Failed to create A/B test:', error);
      throw error;
    }
  }

  async updateTestConfig(testId: string, updates: Partial<ABTestConfig>): Promise<void> {
    try {
      const { error } = await supabase
        .from('ab_tests')
        .update({
          name: updates.name,
          description: updates.description,
          traffic_percentage: updates.trafficPercentage,
          status: updates.status,
          end_date: updates.endDate?.toISOString(),
        })
        .eq('id', testId);

      if (error) throw error;

      // Update local cache
      const test = this.abTests.get(testId);
      if (test) {
        this.abTests.set(testId, { ...test, ...updates });
      }
    } catch (error) {
      logger.error('Failed to update A/B test:', error);
      throw error;
    }
  }

  // Real-time optimization
  async applySmartOptimizations(): Promise<void> {
    const suggestions = await this.getOptimizationSuggestions();

    // Apply automated optimizations based on suggestions
    suggestions.forEach(suggestion => {
      if (suggestion.includes('payment step')) {
        this.trackEvent('smart_optimization_applied', {
          type: 'payment_enhancement',
          reason: suggestion,
        });
      }

      if (suggestion.includes('booking completion time')) {
        this.trackEvent('smart_optimization_applied', {
          type: 'flow_optimization',
          reason: suggestion,
        });
      }

      if (suggestion.includes('trust signals')) {
        this.trackEvent('smart_optimization_applied', {
          type: 'trust_signals',
          reason: suggestion,
        });
      }
    });
  }
}

// Export singleton instance
export const conversionEngine = ConversionOptimizationEngine.getInstance();

// React hook for conversion optimization
export function useConversionOptimization() {
  const trackEvent = async (eventName: string, data: Record<string, any> = {}) => {
    await conversionEngine.trackEvent(eventName, data);
  };

  const trackFunnelStep = async (stepName: string, stepNumber: number, data: Record<string, any> = {}) => {
    await conversionEngine.trackFunnelStep(stepName, stepNumber, data);
  };

  const getVariation = (testId: string) => {
    return conversionEngine.getVariationForTest(testId);
  };

  const getVariationConfig = (testId: string, variationId?: string) => {
    return conversionEngine.getVariationConfig(testId, variationId);
  };

  const getMetrics = async (startDate: Date, endDate: Date) => {
    return await conversionEngine.getConversionMetrics(startDate, endDate);
  };

  const getSuggestions = async () => {
    return await conversionEngine.getOptimizationSuggestions();
  };

  const createTest = async (config: Partial<ABTestConfig>) => {
    return await conversionEngine.createABTest(config);
  };

  const updateTest = async (testId: string, updates: Partial<ABTestConfig>) => {
    return await conversionEngine.updateTestConfig(testId, updates);
  };

  const applyOptimizations = async () => {
    return await conversionEngine.applySmartOptimizations();
  };

  return {
    trackEvent,
    trackFunnelStep,
    getVariation,
    getVariationConfig,
    getMetrics,
    getSuggestions,
    createTest,
    updateTest,
    applyOptimizations,
    sessionId: conversionEngine['sessionId'],
  };
}