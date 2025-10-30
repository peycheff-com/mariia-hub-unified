import { supabase } from '@/integrations/supabase/client-optimized';
import { Database } from '@/integrations/supabase/types';

type CustomerJourneyEvent = Database['public']['Tables']['customer_journey_events']['Row'];
type Booking = Database['public']['Tables']['bookings']['Row'];

export interface CustomerJourneyMap {
  userId: string;
  journeyId: string;
  overallJourney: JourneyOverview;
  touchpoints: Touchpoint[];
  conversionFunnel: ConversionFunnel;
  dropoffAnalysis: DropoffAnalysis;
  pathAnalysis: PathAnalysis;
  channelAttribution: ChannelAttribution;
  journeyOptimization: JourneyOptimization[];
  insights: JourneyInsight[];
}

export interface JourneyOverview {
  totalDuration: number; // minutes
  totalTouchpoints: number;
  conversionRate: number;
  averageTimeBetweenTouchpoints: number;
  journeyStartDate: Date;
  journeyEndDate?: Date;
  journeyStatus: 'active' | 'converted' | 'abandoned' | 'stalled';
  primaryGoal: string;
  goalValue?: number;
  customerSegment: string;
}

export interface Touchpoint {
  id: string;
  sequence: number;
  eventType: string;
  eventCategory: string;
  eventName: string;
  touchpoint: string;
  channel: string;
  timestamp: Date;
  duration?: number; // seconds
  properties: Record<string, any>;
  conversionValue?: number;
  isConversionEvent: boolean;
  sentiment?: 'positive' | 'neutral' | 'negative';
  effectiveness: number; // 0-1 score
  previousTouchpointId?: string;
  nextTouchpointId?: string;
  journeyPath: string;
}

export interface ConversionFunnel {
  funnelName: string;
  stages: FunnelStage[];
  overallConversionRate: number;
  stageConversionRates: { [stageName: string]: number };
  bottleneckStages: string[];
  optimizedConversionRate: number;
  upliftPotential: number;
}

export interface FunnelStage {
  stageName: string;
  stageDescription: string;
  users: number;
  conversionRate: number;
  averageTimeInStage: number; // minutes
  dropoffReasons?: DropoffReason[];
  optimizationSuggestions: OptimizationSuggestion[];
}

export interface DropoffReason {
  reason: string;
  frequency: number;
  percentage: number;
  impact: 'high' | 'medium' | 'low';
  description: string;
}

export interface OptimizationSuggestion {
  suggestion: string;
  expectedImpact: number;
  implementationEffort: 'low' | 'medium' | 'high';
  priority: 'high' | 'medium' | 'low';
  description: string;
}

export interface DropoffAnalysis {
  totalDropoffs: number;
  dropoffRate: number;
  criticalDropoffPoints: DropoffPoint[];
  dropoffPatterns: DropoffPattern[];
  recoveryOpportunities: RecoveryOpportunity[];
  dropoffTrends: DropoffTrend[];
}

export interface DropoffPoint {
  touchpointId: string;
  touchpointName: string;
  dropoffCount: number;
  dropoffRate: number;
  averageTimeBeforeDropoff: number;
  primaryReasons: string[];
  recoveryActions: string[];
  businessImpact: number;
}

export interface DropoffPattern {
  pattern: string;
  frequency: number;
  description: string;
  commonCharacteristics: string[];
  preventionStrategies: string[];
}

export interface RecoveryOpportunity {
  opportunity: string;
  touchpointId: string;
  expectedRecoveryRate: number;
  implementationCost: number;
  roi: number;
  timeline: string;
}

export interface DropoffTrend {
  period: string;
  dropoffRate: number;
  volume: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  factors: string[];
}

export interface PathAnalysis {
  commonPaths: JourneyPath[];
  optimalPath: JourneyPath;
  pathEfficiency: { [pathName: string]: number };
  pathVariations: PathVariation[];
  pathOptimizations: PathOptimization[];
}

export interface JourneyPath {
  pathId: string;
  pathName: string;
  touchpoints: string[];
  conversionRate: number;
  averageDuration: number;
  frequency: number;
  efficiency: number;
  userSegment: string;
  characteristics: string[];
}

export interface PathVariation {
  variationType: string;
  originalPath: string;
  variationPath: string;
  performanceDifference: number;
  statisticalSignificance: number;
  recommendation: string;
}

export interface PathOptimization {
  optimizationType: string;
  currentPerformance: number;
  expectedPerformance: number;
  implementationSteps: string[];
  estimatedCost: number;
  expectedROI: number;
}

export interface ChannelAttribution {
  attributionModel: 'first_touch' | 'last_touch' | 'linear' | 'time_decay' | 'position_based' | 'data_driven';
  channelPerformance: ChannelPerformance[];
  channelInteractions: ChannelInteraction[];
  crossChannelInfluence: CrossChannelInfluence[];
  budgetOptimization: BudgetOptimization[];
}

export interface ChannelPerformance {
  channel: string;
  touchpoints: number;
  conversions: number;
  conversionRate: number;
  attributedRevenue: number;
  costPerAcquisition: number;
  returnOnAdSpend: number;
  customerLifetimeValue: number;
  influenceStrength: number;
}

export interface ChannelInteraction {
  fromChannel: string;
  toChannel: string;
  interactionCount: number;
  conversionRate: number;
  averageTimeBetween: number;
  synergyScore: number;
}

export interface CrossChannelInfluence {
  channelCombination: string[];
  influenceStrength: number;
  conversionLift: number;
  recommendedStrategy: string;
}

export interface BudgetOptimization {
  currentAllocation: { [channel: string]: number };
  recommendedAllocation: { [channel: string]: number };
  expectedImpact: number;
  confidence: number;
  implementationPlan: string[];
}

export interface JourneyOptimization {
  optimizationId: string;
  optimizationType: string;
  description: string;
  expectedImpact: number;
  implementationEffort: 'low' | 'medium' | 'high';
  priority: 'high' | 'medium' | 'low';
  currentPerformance: number;
  targetPerformance: number;
  timeline: string;
  resources: string[];
  kpis: string[];
}

export interface JourneyInsight {
  insightId: string;
  insightType: 'pattern' | 'anomaly' | 'opportunity' | 'risk';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  data: Record<string, any>;
  recommendations: string[];
  relatedEvents: string[];
}

class JourneyMappingEngine {
  private readonly journeyGoals = [
    'service_booking',
    'appointment_scheduling',
    'purchase_completion',
    'consultation_booking',
    'membership_signup',
    'class_registration'
  ];

  private readonly funnelDefinitions = {
    service_booking: [
      { name: 'awareness', description: 'Customer becomes aware of service' },
      { name: 'interest', description: 'Customer shows interest in specific service' },
      { name: 'consideration', description: 'Customer evaluates service options' },
      { name: 'booking', description: 'Customer initiates booking process' },
      { name: 'payment', description: 'Customer completes payment' },
      { name: 'confirmation', description: 'Booking is confirmed' }
    ],
    consultation_booking: [
      { name: 'discovery', description: 'Customer discovers consultation option' },
      { name: 'education', description: 'Customer learns about consultation value' },
      { name: 'scheduling', description: 'Customer schedules consultation' },
      { name: 'preparation', description: 'Customer prepares for consultation' },
      { name: 'completion', description: 'Consultation is completed' }
    ]
  };

  private readonly channelDefinitions = [
    'organic_search',
    'paid_search',
    'social_media',
    'email_marketing',
    'referral',
    'direct',
    'display_ads',
    'content_marketing',
    'sms_marketing',
    'push_notifications'
  ];

  async mapCustomerJourney(
    userId: string,
    journeyGoal?: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<CustomerJourneyMap> {
    // Determine journey goal if not provided
    const primaryGoal = journeyGoal || await this.inferJourneyGoal(userId);

    // Get journey events
    const events = await this.getJourneyEvents(userId, dateRange);

    if (events.length === 0) {
      return this.createEmptyJourneyMap(userId, primaryGoal);
    }

    // Process and analyze journey
    const touchpoints = this.processTouchpoints(events);
    const overallJourney = this.analyzeOverallJourney(events, touchpoints, primaryGoal);
    const conversionFunnel = this.analyzeConversionFunnel(events, primaryGoal);
    const dropoffAnalysis = this.analyzeDropoffs(events, touchpoints);
    const pathAnalysis = this.analyzePaths(events, touchpoints);
    const channelAttribution = this.analyzeChannelAttribution(events);
    const journeyOptimization = this.generateOptimizations(overallJourney, conversionFunnel, dropoffAnalysis);
    const insights = this.generateInsights(events, touchpoints, conversionFunnel);

    const journeyMap: CustomerJourneyMap = {
      userId,
      journeyId: this.generateJourneyId(userId, primaryGoal),
      overallJourney,
      touchpoints,
      conversionFunnel,
      dropoffAnalysis,
      pathAnalysis,
      channelAttribution,
      journeyOptimization,
      insights
    };

    return journeyMap;
  }

  private async inferJourneyGoal(userId: string): Promise<string> {
    // Analyze recent events to determine the likely journey goal
    const { data: recentEvents } = await supabase
      .from('customer_journey_events')
      .select('*')
      .eq('user_id', userId)
      .order('occurred_at', { ascending: false })
      .limit(20);

    if (!recentEvents || recentEvents.length === 0) {
      return 'service_booking'; // Default goal
    }

    // Look for conversion events or goal-specific patterns
    const bookingEvents = recentEvents.filter(e => e.event_type === 'booking_completed');
    if (bookingEvents.length > 0) {
      return 'service_booking';
    }

    const consultationEvents = recentEvents.filter(e => e.event_category === 'consultation');
    if (consultationEvents.length > 0) {
      return 'consultation_booking';
    }

    // Analyze event patterns to infer goal
    const serviceViewEvents = recentEvents.filter(e => e.event_type === 'service_view');
    if (serviceViewEvents.length > 0) {
      return 'service_booking';
    }

    return 'service_booking'; // Default fallback
  }

  private async getJourneyEvents(
    userId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<CustomerJourneyEvent[]> {
    let query = supabase
      .from('customer_journey_events')
      .select('*')
      .eq('user_id', userId)
      .order('occurred_at', { ascending: true });

    if (dateRange) {
      query = query
        .gte('occurred_at', dateRange.start.toISOString())
        .lte('occurred_at', dateRange.end.toISOString());
    } else {
      // Default to last 90 days
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      query = query.gte('occurred_at', ninetyDaysAgo.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch journey events: ${error.message}`);
    }

    return data || [];
  }

  private createEmptyJourneyMap(userId: string, primaryGoal: string): CustomerJourneyMap {
    return {
      userId,
      journeyId: this.generateJourneyId(userId, primaryGoal),
      overallJourney: {
        totalDuration: 0,
        totalTouchpoints: 0,
        conversionRate: 0,
        averageTimeBetweenTouchpoints: 0,
        journeyStartDate: new Date(),
        journeyStatus: 'active',
        primaryGoal,
        customerSegment: 'new'
      },
      touchpoints: [],
      conversionFunnel: this.createEmptyFunnel(primaryGoal),
      dropoffAnalysis: {
        totalDropoffs: 0,
        dropoffRate: 0,
        criticalDropoffPoints: [],
        dropoffPatterns: [],
        recoveryOpportunities: [],
        dropoffTrends: []
      },
      pathAnalysis: {
        commonPaths: [],
        optimalPath: this.createEmptyPath(),
        pathEfficiency: {},
        pathVariations: [],
        pathOptimizations: []
      },
      channelAttribution: {
        attributionModel: 'last_touch',
        channelPerformance: [],
        channelInteractions: [],
        crossChannelInfluence: [],
        budgetOptimization: []
      },
      journeyOptimization: [],
      insights: []
    };
  }

  private createEmptyFunnel(primaryGoal: string): ConversionFunnel {
    const stages = this.funnelDefinitions[primaryGoal as keyof typeof this.funnelDefinitions] ||
                   this.funnelDefinitions.service_booking;

    return {
      funnelName: primaryGoal,
      stages: stages.map((stage, index) => ({
        stageName: stage.name,
        stageDescription: stage.description,
        users: index === 0 ? 1 : 0,
        conversionRate: 0,
        averageTimeInStage: 0,
        optimizationSuggestions: []
      })),
      overallConversionRate: 0,
      stageConversionRates: {},
      bottleneckStages: [],
      optimizedConversionRate: 0,
      upliftPotential: 0
    };
  }

  private createEmptyPath(): JourneyPath {
    return {
      pathId: 'empty',
      pathName: 'No Journey Data',
      touchpoints: [],
      conversionRate: 0,
      averageDuration: 0,
      frequency: 0,
      efficiency: 0,
      userSegment: 'unknown',
      characteristics: []
    };
  }

  private processTouchpoints(events: CustomerJourneyEvent[]): Touchpoint[] {
    const touchpoints: Touchpoint[] = [];

    events.forEach((event, index) => {
      const touchpoint: Touchpoint = {
        id: event.id,
        sequence: index + 1,
        eventType: event.event_type,
        eventCategory: event.event_category,
        eventName: event.event_name,
        touchpoint: event.touchpoint,
        channel: event.channel,
        timestamp: new Date(event.occurred_at),
        duration: event.session_duration_seconds,
        properties: event.properties || {},
        conversionValue: event.conversion_value || undefined,
        isConversionEvent: event.is_conversion_event || false,
        effectiveness: this.calculateTouchpointEffectiveness(event, index, events),
        previousTouchpointId: index > 0 ? events[index - 1].id : undefined,
        nextTouchpointId: index < events.length - 1 ? events[index + 1].id : undefined,
        journeyPath: this.generateJourneyPath(events.slice(0, index + 1))
      };

      touchpoints.push(touchpoint);
    });

    return touchpoints;
  }

  private calculateTouchpointEffectiveness(event: CustomerJourneyEvent, index: number, allEvents: CustomerJourneyEvent[]): number {
    let effectiveness = 0.5; // Base effectiveness

    // Conversion events are highly effective
    if (event.is_conversion_event) {
      effectiveness = 1.0;
    }
    // Events that lead to conversions within the next 3 steps
    else if (allEvents.slice(index + 1, index + 4).some(e => e.is_conversion_event)) {
      effectiveness = 0.8;
    }
    // Engagement events
    else if (event.event_category === 'engagement') {
      effectiveness = 0.6;
    }
    // Dropoff events are less effective
    else if (event.dropped_off_at_step) {
      effectiveness = 0.2;
    }

    return effectiveness;
  }

  private generateJourneyPath(events: CustomerJourneyEvent[]): string {
    return events.map(e => `${e.event_type}:${e.channel}`).join(' -> ');
  }

  private analyzeOverallJourney(events: CustomerJourneyEvent[], touchpoints: Touchpoint[], primaryGoal: string): JourneyOverview {
    if (events.length === 0) {
      return {
        totalDuration: 0,
        totalTouchpoints: 0,
        conversionRate: 0,
        averageTimeBetweenTouchpoints: 0,
        journeyStartDate: new Date(),
        journeyStatus: 'active',
        primaryGoal,
        customerSegment: 'new'
      };
    }

    const startDate = new Date(events[0].occurred_at);
    const endDate = events[events.length - 1].dropped_off_at_step ?
                   new Date(events[events.length - 1].occurred_at) :
                   new Date();

    const totalDuration = (endDate.getTime() - startDate.getTime()) / (1000 * 60); // minutes
    const totalTouchpoints = events.length;

    // Calculate conversion events
    const conversionEvents = events.filter(e => e.is_conversion_event);
    const conversionRate = conversionEvents.length / totalTouchpoints;

    // Calculate average time between touchpoints
    let averageTimeBetweenTouchpoints = 0;
    if (events.length > 1) {
      let totalTime = 0;
      for (let i = 1; i < events.length; i++) {
        totalTime += (new Date(events[i].occurred_at).getTime() -
                     new Date(events[i - 1].occurred_at).getTime()) / (1000 * 60);
      }
      averageTimeBetweenTouchpoints = totalTime / (events.length - 1);
    }

    // Determine journey status
    const lastEvent = events[events.length - 1];
    let journeyStatus: 'active' | 'converted' | 'abandoned' | 'stalled';

    if (conversionEvents.length > 0) {
      journeyStatus = 'converted';
    } else if (lastEvent.dropped_off_at_step) {
      journeyStatus = 'abandoned';
    } else if (totalDuration > 30 * 24 * 60) { // 30 days
      journeyStatus = 'stalled';
    } else {
      journeyStatus = 'active';
    }

    // Determine customer segment
    const customerSegment = this.determineCustomerSegment(events, touchpoints);

    // Calculate goal value
    const goalValue = conversionEvents.reduce((sum, event) => sum + (event.conversion_value || 0), 0);

    return {
      totalDuration,
      totalTouchpoints,
      conversionRate,
      averageTimeBetweenTouchpoints,
      journeyStartDate: startDate,
      journeyEndDate: journeyStatus === 'converted' || journeyStatus === 'abandoned' ? endDate : undefined,
      journeyStatus,
      primaryGoal,
      goalValue,
      customerSegment
    };
  }

  private determineCustomerSegment(events: CustomerJourneyEvent[], touchpoints: Touchpoint[]): string {
    // Simple segmentation logic - can be enhanced with ML
    const conversionEvents = events.filter(e => e.is_conversion_event);
    const totalDuration = events.length > 0 ?
      (new Date(events[events.length - 1].occurred_at).getTime() -
       new Date(events[0].occurred_at).getTime()) / (1000 * 60 * 60 * 24) : 0;

    if (conversionEvents.length > 0) {
      if (totalDuration <= 7) return 'quick_converter';
      if (totalDuration <= 30) return 'fast_converter';
      return 'considered_converter';
    } else {
      if (totalDuration <= 1) return 'new_visitor';
      if (totalDuration <= 7) return 'engaged_visitor';
      if (totalDuration <= 30) return 'returning_visitor';
      return 'stalled_visitor';
    }
  }

  private analyzeConversionFunnel(events: CustomerJourneyEvent[], primaryGoal: string): ConversionFunnel {
    const stages = this.funnelDefinitions[primaryGoal as keyof typeof this.funnelDefinitions] ||
                   this.funnelDefinitions.service_booking;

    const funnelStages: FunnelStage[] = stages.map((stage, index) => {
      // Count users at each stage (simplified for single user journey)
      const stageEvents = events.filter(e =>
        e.event_name === stage.name ||
        e.event_category === stage.name ||
        (index === 0 && e.event_type === 'page_view') // First stage - any page view
      );

      const users = stageEvents.length > 0 ? 1 : 0;
      const conversionRate = index === 0 ? 1 : (users / 1) * 100; // Simplified for single user

      // Calculate time in stage
      let averageTimeInStage = 0;
      if (stageEvents.length > 0 && index < stages.length - 1) {
        const nextStageEvents = events.filter(e =>
          e.event_name === stages[index + 1].name ||
          e.event_category === stages[index + 1].name
        );

        if (nextStageEvents.length > 0) {
          const stageTime = (new Date(nextStageEvents[0].occurred_at).getTime() -
                           new Date(stageEvents[0].occurred_at).getTime()) / (1000 * 60);
          averageTimeInStage = stageTime;
        }
      }

      return {
        stageName: stage.name,
        stageDescription: stage.description,
        users,
        conversionRate,
        averageTimeInStage,
        optimizationSuggestions: this.generateStageOptimizations(stage.name, events)
      };
    });

    // Calculate overall conversion rate
    const conversionEvents = events.filter(e => e.is_conversion_event);
    const overallConversionRate = conversionEvents.length > 0 ? 100 : 0;

    // Identify bottleneck stages
    const bottleneckStages = funnelStages
      .filter(stage => stage.conversionRate < 50)
      .map(stage => stage.stageName);

    const stageConversionRates = funnelStages.reduce((acc, stage) => {
      acc[stage.stageName] = stage.conversionRate;
      return acc;
    }, {} as { [stageName: string]: number });

    return {
      funnelName: primaryGoal,
      stages: funnelStages,
      overallConversionRate,
      stageConversionRates,
      bottleneckStages,
      optimizedConversionRate: Math.min(100, overallConversionRate * 1.5), // Assume 50% uplift potential
      upliftPotential: Math.min(50, (100 - overallConversionRate) * 0.5)
    };
  }

  private generateStageOptimizations(stageName: string, events: CustomerJourneyEvent[]): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    switch (stageName) {
      case 'awareness':
        suggestions.push({
          suggestion: 'Optimize content for targeted keywords',
          expectedImpact: 15,
          implementationEffort: 'medium',
          priority: 'high',
          description: 'Improve SEO and content relevance for better discovery'
        });
        break;

      case 'interest':
        suggestions.push({
          suggestion: 'Add social proof and testimonials',
          expectedImpact: 20,
          implementationEffort: 'low',
          priority: 'high',
          description: 'Build trust through customer reviews and success stories'
        });
        break;

      case 'consideration':
        suggestions.push({
          suggestion: 'Provide detailed service information and FAQs',
          expectedImpact: 25,
          implementationEffort: 'medium',
          priority: 'medium',
          description: 'Help customers make informed decisions with comprehensive information'
        });
        break;

      case 'booking':
        suggestions.push({
          suggestion: 'Simplify booking form and reduce friction',
          expectedImpact: 30,
          implementationEffort: 'high',
          priority: 'high',
          description: 'Streamline the booking process to reduce abandonment'
        });
        break;

      case 'payment':
        suggestions.push({
          suggestion: 'Offer multiple payment options',
          expectedImpact: 20,
          implementationEffort: 'medium',
          priority: 'medium',
          description: 'Provide flexibility in payment methods to increase completion'
        });
        break;
    }

    return suggestions;
  }

  private analyzeDropoffs(events: CustomerJourneyEvent[], touchpoints: Touchpoint[]): DropoffAnalysis {
    const dropoffEvents = events.filter(e => e.dropped_off_at_step);
    const totalDropoffs = dropoffEvents.length;
    const dropoffRate = events.length > 0 ? (totalDropoffs / events.length) * 100 : 0;

    // Analyze critical dropoff points
    const criticalDropoffPoints: DropoffPoint[] = dropoffEvents.map(event => ({
      touchpointId: event.id,
      touchpointName: event.event_name,
      dropoffCount: 1, // Single user journey
      dropoffRate: 100, // For single user, it's always 100% if they dropped off
      averageTimeBeforeDropoff: event.session_duration_seconds || 0,
      primaryReasons: this.inferDropoffReasons(event),
      recoveryActions: this.suggestRecoveryActions(event),
      businessImpact: this.calculateBusinessImpact(event)
    }));

    // Analyze dropoff patterns
    const dropoffPatterns = this.identifyDropoffPatterns(dropoffEvents);

    // Identify recovery opportunities
    const recoveryOpportunities = this.identifyRecoveryOpportunities(dropoffEvents, touchpoints);

    // Analyze dropoff trends
    const dropoffTrends = this.analyzeDropoffTrends(dropoffEvents);

    return {
      totalDropoffs,
      dropoffRate,
      criticalDropoffPoints,
      dropoffPatterns,
      recoveryOpportunities,
      dropoffTrends
    };
  }

  private inferDropoffReasons(event: CustomerJourneyEvent): string[] {
    const reasons: string[] = [];

    if (event.session_duration_seconds && event.session_duration_seconds < 30) {
      reasons.push('bounce');
    }

    if (event.event_category === 'booking' && event.event_name === 'payment') {
      reasons.push('payment_issues');
    }

    if (event.event_type === 'form abandonment') {
      reasons.push('form_complexity');
    }

    if (event.channel === 'mobile' && event.session_duration_seconds && event.session_duration_seconds > 600) {
      reasons.push('mobile_usability');
    }

    if (reasons.length === 0) {
      reasons.push('unknown');
    }

    return reasons;
  }

  private suggestRecoveryActions(event: CustomerJourneyEvent): string[] {
    const actions: string[] = [];

    const reasons = this.inferDropoffReasons(event);
    reasons.forEach(reason => {
      switch (reason) {
        case 'bounce':
          actions.push('improve_page_load_speed');
          actions.push('enhance_above_fold_content');
          break;
        case 'payment_issues':
          actions.push('offer_alternative_payment_methods');
          actions.push('provide_payment_assistance');
          break;
        case 'form_complexity':
          actions.push('simplify_form_fields');
          actions.push('add_progress_indicators');
          break;
        case 'mobile_usability':
          actions.push('optimize_mobile_experience');
          actions.push('improve_touch_interactions');
          break;
      }
    });

    return actions;
  }

  private calculateBusinessImpact(event: CustomerJourneyEvent): number {
    // Simplified business impact calculation
    let impact = 0;

    if (event.conversion_value) {
      impact = event.conversion_value;
    } else if (event.event_category === 'booking') {
      impact = 500; // Average booking value
    } else if (event.event_category === 'consultation') {
      impact = 200; // Average consultation value
    }

    return impact;
  }

  private identifyDropoffPatterns(dropoffEvents: CustomerJourneyEvent[]): DropoffPattern[] {
    const patterns: DropoffPattern[] = [];

    if (dropoffEvents.length > 1) {
      // Check for repeated dropoff at same stage
      const stageDropoffs: { [stage: string]: number } = {};
      dropoffEvents.forEach(event => {
        const stage = event.event_name;
        stageDropoffs[stage] = (stageDropoffs[stage] || 0) + 1;
      });

      Object.entries(stageDropoffs).forEach(([stage, count]) => {
        if (count > 1) {
          patterns.push({
            pattern: `repeated_dropoff_at_${stage}`,
            frequency: count,
            description: `Customer repeatedly drops off at ${stage} stage`,
            commonCharacteristics: [stage],
            preventionStrategies: this.getPreventionStrategies(stage)
          });
        }
      });
    }

    return patterns;
  }

  private getPreventionStrategies(stage: string): string[] {
    const strategies: { [key: string]: string[] } = {
      'booking_form': ['simplify_form', 'add_progress_save', 'provide_assistance'],
      'payment': ['multiple_payment_options', 'payment_security_badges', 'guest_checkout'],
      'service_selection': ['improve_search', 'add_recommendations', 'detailed_descriptions'],
      'scheduling': ['more_time_slots', 'reminder_notifications', 'easy_rescheduling']
    };

    return strategies[stage] || ['improve_user_experience', 'add_support_options'];
  }

  private identifyRecoveryOpportunities(dropoffEvents: CustomerJourneyEvent[], touchpoints: Touchpoint[]): RecoveryOpportunity[] {
    const opportunities: RecoveryOpportunity[] = [];

    dropoffEvents.forEach(event => {
      if (event.event_name === 'booking_form') {
        opportunities.push({
          opportunity: 'form_save_and_resume',
          touchpointId: event.id,
          expectedRecoveryRate: 35,
          implementationCost: 500,
          roi: 300,
          timeline: '2_weeks'
        });
      }

      if (event.event_name === 'payment') {
        opportunities.push({
          opportunity: 'payment_reminder_campaign',
          touchpointId: event.id,
          expectedRecoveryRate: 25,
          implementationCost: 200,
          roi: 400,
          timeline: '1_week'
        });
      }
    });

    return opportunities;
  }

  private analyzeDropoffTrends(dropoffEvents: CustomerJourneyEvent[]): DropoffTrend[] {
    // For single user journey, this is simplified
    if (dropoffEvents.length === 0) {
      return [];
    }

    return [{
      period: 'current_journey',
      dropoffRate: 100,
      volume: dropoffEvents.length,
      trend: 'stable',
      factors: ['single_user_journey']
    }];
  }

  private analyzePaths(events: CustomerJourneyEvent[], touchpoints: Touchpoint[]): PathAnalysis {
    // For single user journey, this is simplified
    const currentPath: JourneyPath = {
      pathId: this.generatePathId(events),
      pathName: 'Current Journey Path',
      touchpoints: events.map(e => e.event_name),
      conversionRate: events.some(e => e.is_conversion_event) ? 100 : 0,
      averageDuration: touchpoints.reduce((sum, t) => sum + (t.duration || 0), 0),
      frequency: 1,
      efficiency: this.calculatePathEfficiency(touchpoints),
      userSegment: this.determineCustomerSegment(events, touchpoints),
      characteristics: this.getPathCharacteristics(events)
    };

    return {
      commonPaths: [currentPath],
      optimalPath: currentPath,
      pathEfficiency: { [currentPath.pathId]: currentPath.efficiency },
      pathVariations: [],
      pathOptimizations: this.generatePathOptimizations(currentPath)
    };
  }

  private generatePathId(events: CustomerJourneyEvent[]): string {
    return events.map(e => e.event_type).join('_').substring(0, 50);
  }

  private calculatePathEfficiency(touchpoints: Touchpoint[]): number {
    if (touchpoints.length === 0) return 0;

    const totalDuration = touchpoints.reduce((sum, t) => sum + (t.duration || 0), 0);
    const conversionEvents = touchpoints.filter(t => t.isConversionEvent).length;
    const effectivenessScore = touchpoints.reduce((sum, t) => sum + t.effectiveness, 0) / touchpoints.length;

    // Efficiency = (conversion rate * effectiveness) / (time + 1)
    const conversionRate = conversionEvents / touchpoints.length;
    return (conversionRate * effectivenessScore) / (totalDuration / 3600 + 1); // Convert hours to denominator
  }

  private getPathCharacteristics(events: CustomerJourneyEvent[]): string[] {
    const characteristics: string[] = [];

    if (events.some(e => e.channel === 'mobile')) {
      characteristics.push('mobile_first');
    }

    if (events.some(e => e.event_category === 'social')) {
      characteristics.push('social_influenced');
    }

    if (events.length > 10) {
      characteristics.push('extended_research');
    }

    if (events.some(e => e.is_conversion_event)) {
      characteristics.push('converted');
    }

    return characteristics;
  }

  private generatePathOptimizations(path: JourneyPath): PathOptimization[] {
    const optimizations: PathOptimization[] = [];

    if (path.efficiency < 0.5) {
      optimizations.push({
        optimizationType: 'path_streamlining',
        currentPerformance: path.efficiency,
        expectedPerformance: Math.min(1, path.efficiency * 1.5),
        implementationSteps: [
          'Remove unnecessary touchpoints',
          'Combine similar steps',
          'Improve navigation between stages'
        ],
        estimatedCost: 1000,
        expectedROI: 250
      });
    }

    if (path.averageDuration > 1800) { // 30 minutes
      optimizations.push({
        optimizationType: 'duration_optimization',
        currentPerformance: path.averageDuration,
        expectedPerformance: path.averageDuration * 0.7,
        implementationSteps: [
          'Improve page load speed',
          'Simplify decision processes',
          'Provide better guidance'
        ],
        estimatedCost: 800,
        expectedROI: 200
      });
    }

    return optimizations;
  }

  private analyzeChannelAttribution(events: CustomerJourneyEvent[]): ChannelAttribution {
    // For single user journey, analyze channel performance
    const channelPerformance: ChannelPerformance[] = [];
    const channelInteractions: ChannelInteraction[] = [];
    const crossChannelInfluence: CrossChannelInfluence[] = [];

    // Analyze each channel's performance
    const channelGroups: { [channel: string]: CustomerJourneyEvent[] } = {};
    events.forEach(event => {
      if (!channelGroups[event.channel]) {
        channelGroups[event.channel] = [];
      }
      channelGroups[event.channel].push(event);
    });

    Object.entries(channelGroups).forEach(([channel, channelEvents]) => {
      const conversions = channelEvents.filter(e => e.is_conversion_event).length;
      const conversionValue = channelEvents.reduce((sum, e) => sum + (e.conversion_value || 0), 0);

      channelPerformance.push({
        channel,
        touchpoints: channelEvents.length,
        conversions,
        conversionRate: (conversions / channelEvents.length) * 100,
        attributedRevenue: conversionValue,
        costPerAcquisition: conversions > 0 ? 100 / conversions : 0, // Simplified
        returnOnAdSpend: conversionValue > 0 ? (conversionValue - 100) / 100 : 0, // Simplified
        customerLifetimeValue: conversionValue, // Simplified
        influenceStrength: conversions > 0 ? 1 : 0.5
      });
    });

    // Analyze channel interactions
    for (let i = 0; i < events.length - 1; i++) {
      const currentEvent = events[i];
      const nextEvent = events[i + 1];

      if (currentEvent.channel !== nextEvent.channel) {
        const existingInteraction = channelInteractions.find(
          ci => ci.fromChannel === currentEvent.channel && ci.toChannel === nextEvent.channel
        );

        if (existingInteraction) {
          existingInteraction.interactionCount++;
        } else {
          channelInteractions.push({
            fromChannel: currentEvent.channel,
            toChannel: nextEvent.channel,
            interactionCount: 1,
            conversionRate: nextEvent.is_conversion_event ? 100 : 0,
            averageTimeBetween: (new Date(nextEvent.occurred_at).getTime() -
                               new Date(currentEvent.occurred_at).getTime()) / (1000 * 60),
            synergyScore: nextEvent.is_conversion_event ? 0.8 : 0.3
          });
        }
      }
    }

    // Generate budget optimization recommendations
    const budgetOptimization = this.generateBudgetOptimization(channelPerformance);

    return {
      attributionModel: 'last_touch',
      channelPerformance,
      channelInteractions,
      crossChannelInfluence,
      budgetOptimization
    };
  }

  private generateBudgetOptimization(channelPerformance: ChannelPerformance[]): BudgetOptimization[] {
    if (channelPerformance.length === 0) {
      return [];
    }

    // Current allocation (equal distribution)
    const totalBudget = 1000; // Example budget
    const currentAllocation: { [channel: string]: number } = {};
    channelPerformance.forEach(cp => {
      currentAllocation[cp.channel] = totalBudget / channelPerformance.length;
    });

    // Recommended allocation based on performance
    const totalROAS = channelPerformance.reduce((sum, cp) => sum + Math.max(0, cp.returnOnAdSpend), 0);
    const recommendedAllocation: { [channel: string]: number } = {};

    channelPerformance.forEach(cp => {
      const weight = totalROAS > 0 ? Math.max(0, cp.returnOnAdSpend) / totalROAS : 1 / channelPerformance.length;
      recommendedAllocation[cp.channel] = totalBudget * weight;
    });

    return [{
      currentAllocation,
      recommendedAllocation,
      expectedImpact: 25, // Expected percentage improvement
      confidence: 0.7,
      implementationPlan: [
        'Phase budget reallocation over 4 weeks',
        'Monitor performance changes weekly',
        'Adjust allocations based on results'
      ]
    }];
  }

  private generateOptimizations(
    overallJourney: JourneyOverview,
    conversionFunnel: ConversionFunnel,
    dropoffAnalysis: DropoffAnalysis
  ): JourneyOptimization[] {
    const optimizations: JourneyOptimization[] = [];

    // High-priority optimizations based on journey status
    if (overallJourney.journeyStatus === 'stalled' || overallJourney.journeyStatus === 'abandoned') {
      optimizations.push({
        optimizationId: 're_engagement_campaign',
        optimizationType: 'campaign',
        description: 'Launch re-engagement campaign for stalled/abandoned journeys',
        expectedImpact: 30,
        implementationEffort: 'medium',
        priority: 'high',
        currentPerformance: overallJourney.conversionRate * 100,
        targetPerformance: Math.min(100, overallJourney.conversionRate * 100 * 1.5),
        timeline: '2_weeks',
        resources: ['marketing_team', 'email_platform'],
        kpis: ['re_engagement_rate', 'conversion_rate', 'journey_completion_rate']
      });
    }

    // Funnel bottleneck optimizations
    conversionFunnel.bottleneckStages.forEach(stageName => {
      const stage = conversionFunnel.stages.find(s => s.stageName === stageName);
      if (stage) {
        optimizations.push({
          optimizationId: `optimize_${stageName}_stage`,
          optimizationType: 'funnel_optimization',
          description: `Optimize ${stageName} stage to improve conversion`,
          expectedImpact: 20,
          implementationEffort: 'medium',
          priority: stageName === 'booking' ? 'high' : 'medium',
          currentPerformance: stage.conversionRate,
          targetPerformance: Math.min(100, stage.conversionRate * 1.3),
          timeline: '4_weeks',
          resources: ['product_team', 'ux_team', 'development_team'],
          kpis: ['stage_conversion_rate', 'overall_funnel_conversion', 'user_satisfaction']
        });
      }
    });

    // Dropoff recovery optimizations
    dropoffAnalysis.criticalDropoffPoints.forEach(dropoff => {
      optimizations.push({
        optimizationId: `reduce_dropoff_${dropoff.touchpointName}`,
        optimizationType: 'dropoff_reduction',
        description: `Reduce dropoff rate at ${dropoff.touchpointName}`,
        expectedImpact: Math.min(40, dropoff.dropoffRate * 0.5),
        implementationEffort: 'low',
        priority: dropoff.businessImpact > 500 ? 'high' : 'medium',
        currentPerformance: dropoff.dropoffRate,
        targetPerformance: Math.max(0, dropoff.dropoffRate * 0.5),
        timeline: '2_weeks',
        resources: ['ux_team', 'development_team'],
        kpis: ['dropoff_rate', 'completion_rate', 'user_satisfaction']
      });
    });

    return optimizations.sort((a, b) => {
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    });
  }

  private generateInsights(
    events: CustomerJourneyEvent[],
    touchpoints: Touchpoint[],
    conversionFunnel: ConversionFunnel
  ): JourneyInsight[] {
    const insights: JourneyInsight[] = [];

    // Journey length insight
    if (events.length > 10) {
      insights.push({
        insightId: 'extended_journey',
        insightType: 'pattern',
        title: 'Extended Customer Journey',
        description: 'Customer took longer than average to complete journey, indicating research-heavy behavior',
        impact: 'medium',
        confidence: 0.8,
        data: { journeyLength: events.length, averageLength: 6 },
        recommendations: [
          'Provide more comprehensive information upfront',
          'Offer consultation calls for complex decisions',
          'Implement guided selling tools'
        ],
        relatedEvents: events.map(e => e.id)
      });
    }

    // Channel hopping insight
    const uniqueChannels = new Set(events.map(e => e.channel)).size;
    if (uniqueChannels > 3) {
      insights.push({
        insightId: 'channel_hopping',
        insightType: 'pattern',
        title: 'Multi-Channel Engagement',
        description: 'Customer engaged across multiple channels, indicating cross-channel influence',
        impact: 'high',
        confidence: 0.9,
        data: { channelCount: uniqueChannels, channels: Array.from(uniqueChannels) },
        recommendations: [
          'Ensure consistent messaging across channels',
          'Implement cross-channel tracking',
          'Optimize budget allocation based on channel synergy'
        ],
        relatedEvents: events.map(e => e.id)
      });
    }

    // Mobile preference insight
    const mobileEvents = events.filter(e => e.channel === 'mobile');
    if (mobileEvents.length > events.length * 0.7) {
      insights.push({
        insightId: 'mobile_preference',
        insightType: 'pattern',
        title: 'Mobile-First Journey',
        description: 'Customer primarily used mobile devices throughout journey',
        impact: 'medium',
        confidence: 0.85,
        data: { mobileEvents: mobileEvents.length, totalEvents: events.length, mobilePercentage: (mobileEvents.length / events.length) * 100 },
        recommendations: [
          'Optimize mobile experience',
          'Implement mobile-specific features',
          'Ensure fast loading on mobile networks'
        ],
        relatedEvents: mobileEvents.map(e => e.id)
      });
    }

    // Conversion bottleneck insight
    if (conversionFunnel.bottleneckStages.length > 0) {
      insights.push({
        insightId: 'conversion_bottleneck',
        insightType: 'risk',
        title: 'Conversion Bottleneck Identified',
        description: `Journey shows bottlenecks at: ${conversionFunnel.bottleneckStages.join(', ')}`,
        impact: 'high',
        confidence: 0.95,
        data: { bottleneckStages: conversionFunnel.bottleneckStages },
        recommendations: [
          'Focus optimization efforts on bottleneck stages',
          'A/B test alternative approaches',
          'Provide additional support at critical stages'
        ],
        relatedEvents: conversionFunnel.bottleneckStages.map(stage =>
          events.find(e => e.event_name === stage)?.id || ''
        ).filter(Boolean)
      });
    }

    return insights;
  }

  async getJourneyInsights(
    userId?: string,
    dateRange?: { start: Date; end: Date },
    limit: number = 50
  ): Promise<JourneyInsight[]> {
    let query = supabase
      .from('customer_journey_events')
      .select('*')
      .order('occurred_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (dateRange) {
      query = query
        .gte('occurred_at', dateRange.start.toISOString())
        .lte('occurred_at', dateRange.end.toISOString());
    }

    const { data: events, error } = await query.limit(limit * 2); // Get more events for better analysis

    if (error) {
      throw new Error(`Failed to fetch journey events for insights: ${error.message}`);
    }

    if (!events || events.length === 0) {
      return [];
    }

    // Group events by user for analysis
    const userEvents: { [userId: string]: CustomerJourneyEvent[] } = {};
    events.forEach(event => {
      if (!userEvents[event.user_id]) {
        userEvents[event.user_id] = [];
      }
      userEvents[event.user_id].push(event);
    });

    const allInsights: JourneyInsight[] = [];

    // Analyze each user's journey
    Object.entries(userEvents).forEach(([userId, userJourneyEvents]) => {
      const touchpoints = this.processTouchpoints(userJourneyEvents);
      const conversionFunnel = this.analyzeConversionFunnel(userJourneyEvents, 'service_booking');
      const userInsights = this.generateInsights(userJourneyEvents, touchpoints, conversionFunnel);
      allInsights.push(...userInsights);
    });

    // Sort by impact and confidence, then limit
    return allInsights
      .sort((a, b) => {
        const impactWeight = { high: 3, medium: 2, low: 1 };
        const scoreA = impactWeight[a.impact] * a.confidence;
        const scoreB = impactWeight[b.impact] * b.confidence;
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }

  async trackJourneyEvent(eventData: Partial<CustomerJourneyEvent>): Promise<void> {
    const { error } = await supabase
      .from('customer_journey_events')
      .insert({
        user_id: eventData.user_id,
        session_id: eventData.session_id,
        event_type: eventData.event_type || 'unknown',
        event_category: eventData.event_category || 'general',
        event_name: eventData.event_name || 'unknown_event',
        event_properties: eventData.properties || {},
        touchpoint: eventData.touchpoint || 'unknown',
        channel: eventData.channel || 'direct',
        occurred_at: new Date().toISOString(),
        conversion_funnel_stage: eventData.conversion_funnel_stage,
        conversion_value: eventData.conversion_value,
        is_conversion_event: eventData.is_conversion_event || false,
        journey_step: eventData.journey_step || 0,
        total_journey_steps: eventData.total_journey_steps,
        dropped_off_at_step: eventData.dropped_off_at_step || false,
        dropoff_reason: eventData.dropoff_reason
      });

    if (error) {
      throw new Error(`Failed to track journey event: ${error.message}`);
    }
  }

  generateJourneyId(userId: string, primaryGoal: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${userId}_${primaryGoal}_${timestamp}`;
  }
}

export const journeyMappingEngine = new JourneyMappingEngine();