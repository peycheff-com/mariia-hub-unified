/**
 * Customer Segmentation and Behavior Analysis System
 *
 * Advanced customer segmentation based on:
 * - Behavioral patterns and booking history
 * - Demographic characteristics
 * - Value-based metrics (CLV, frequency, recency)
 * - Predictive churn probability
 * - Service preferences and loyalty
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';

export interface CustomerSegment {
  id: string;
  name: string;
  description: string;
  segmentType: 'behavioral' | 'demographic' | 'value_based' | 'predictive' | 'lifecycle';
  criteria: Record<string, any>;
  customerIds: string[];
  size: number;
  characteristics: {
    averageOrderValue: number;
    bookingFrequency: number;
    totalRevenue: number;
    satisfactionScore: number;
    churnProbability: number;
    preferredServices: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerProfile {
  id: string;
  userId: string;
  segmentIds: string[];
  behavior: {
    totalBookings: number;
    totalRevenue: number;
    averageOrderValue: number;
    bookingFrequency: number;
    lastBookingDate?: string;
    daysSinceLastBooking: number;
    preferredServices: string[];
    bookingPatterns: {
      preferredDays: string[];
      preferredTimes: string[];
      seasonality: string[];
      serviceMix: Record<string, number>;
    };
    engagement: {
      emailOpenRate: number;
      emailClickRate: number;
      websiteVisits: number;
      mobileAppUsage: number;
      socialMediaEngagement: number;
    };
    satisfaction: {
      averageRating: number;
      totalReviews: number;
      complaintCount: number;
      netPromoterScore: number;
      feedbackSentiment: number;
    };
  };
  demographics: {
    age?: number;
    ageGroup?: string;
    gender?: string;
    location?: string;
    distance?: number;
    language?: string;
  };
  value: {
    customerLifetimeValue: number;
    averageOrderValue: number;
    purchaseFrequency: number;
    acquisitionCost: number;
    profitMargin: number;
    churnProbability: number;
    loyaltyScore: number;
  };
  predictive: {
    nextBookingProbability: number;
    preferredNextService?: string;
    likelyChurnDate?: string;
    upsellOpportunity: number;
    crossSellOpportunity: number;
    lifetimeValueProjection: number;
  };
  lastUpdated: Date;
}

export interface SegmentationRule {
  id: string;
  name: string;
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'between' | 'contains' | 'in' | 'not_in';
  value: any;
  weight?: number;
  description?: string;
}

export interface SegmentAnalysis {
  segmentId: string;
  insights: {
    growthTrend: 'increasing' | 'stable' | 'decreasing';
    averageLifetimeValue: number;
    churnRate: number;
    revenuePerCustomer: number;
    bookingFrequency: number;
    satisfactionScore: number;
    responseRate: number;
  };
  recommendations: string[];
  opportunities: Array<{
    type: 'upsell' | 'cross_sell' | 'retention' | 'acquisition';
    description: string;
    priority: 'high' | 'medium' | 'low';
    potentialValue: number;
  }>;
  trends: {
    monthlyGrowth: Array<{ month: string; customers: number; revenue: number }>;
    servicePreferences: Array<{ service: string; percentage: number; growth: number }>;
    behaviorPatterns: Record<string, any>;
  };
}

class CustomerSegmentation {
  private supabase: SupabaseClient;
  private segments: Map<string, CustomerSegment> = new Map();
  private customerProfiles: Map<string, CustomerProfile> = new Map();
  private segmentationRules: Map<string, SegmentationRule[]> = new Map();

  constructor() {
    this.supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL!,
      import.meta.env.VITE_SUPABASE_ANON_KEY!
    );

    this.initializeDefaultSegments();
    this.initializeSegmentationRules();
  }

  private initializeDefaultSegments(): void {
    // Value-based segments
    const vipCustomers: CustomerSegment = {
      id: 'vip_customers',
      name: 'VIP Customers',
      description: 'High-value customers with significant lifetime value and frequent bookings',
      segmentType: 'value_based',
      criteria: {
        customerLifetimeValue: { operator: 'greater_than', value: 5000 },
        totalBookings: { operator: 'greater_than', value: 10 },
        averageRating: { operator: 'greater_than', value: 4.5 }
      },
      customerIds: [],
      size: 0,
      characteristics: {
        averageOrderValue: 600,
        bookingFrequency: 2.5,
        totalRevenue: 15000,
        satisfactionScore: 4.8,
        churnProbability: 0.05,
        preferredServices: ['Lip Enhancement', 'Premium Packages']
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const atRiskCustomers: CustomerSegment = {
      id: 'at_risk_customers',
      name: 'At Risk Customers',
      description: 'Customers showing signs of potential churn',
      segmentType: 'predictive',
      criteria: {
        daysSinceLastBooking: { operator: 'greater_than', value: 90 },
        churnProbability: { operator: 'greater_than', value: 0.3 },
        bookingFrequency: { operator: 'less_than', value: 0.5 }
      },
      customerIds: [],
      size: 0,
      characteristics: {
        averageOrderValue: 300,
        bookingFrequency: 0.3,
        totalRevenue: 1200,
        satisfactionScore: 3.5,
        churnProbability: 0.45,
        preferredServices: ['Basic Services']
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const newCustomers: CustomerSegment = {
      id: 'new_customers',
      name: 'New Customers',
      description: 'Recently acquired customers in their first 90 days',
      segmentType: 'lifecycle',
      criteria: {
        daysSinceFirstBooking: { operator: 'less_than', value: 90 },
        totalBookings: { operator: 'less_than', value: 3 }
      },
      customerIds: [],
      size: 0,
      characteristics: {
        averageOrderValue: 350,
        bookingFrequency: 0.8,
        totalRevenue: 350,
        satisfactionScore: 4.2,
        churnProbability: 0.15,
        preferredServices: ['Introductory Services', 'Popular Treatments']
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const loyalCustomers: CustomerSegment = {
      id: 'loyal_customers',
      name: 'Loyal Customers',
      description: 'Long-term customers with high retention and advocacy',
      segmentType: 'behavioral',
      criteria: {
        daysSinceLastBooking: { operator: 'less_than', value: 30 },
        totalBookings: { operator: 'greater_than', value: 8 },
        retentionRate: { operator: 'greater_than', value: 0.8 }
      },
      customerIds: [],
      size: 0,
      characteristics: {
        averageOrderValue: 450,
        bookingFrequency: 1.8,
        totalRevenue: 8000,
        satisfactionScore: 4.7,
        churnProbability: 0.08,
        preferredServices: ['Full Treatment Plans', 'Maintenance Services']
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const beautyEnthusiasts: CustomerSegment = {
      id: 'beauty_enthusiasts',
      name: 'Beauty Enthusiasts',
      description: 'Customers primarily interested in beauty services',
      segmentType: 'behavioral',
      criteria: {
        beautyServicePercentage: { operator: 'greater_than', value: 0.7 },
        totalBeautyBookings: { operator: 'greater_than', value: 5 }
      },
      customerIds: [],
      size: 0,
      characteristics: {
        averageOrderValue: 400,
        bookingFrequency: 1.5,
        totalRevenue: 6000,
        satisfactionScore: 4.6,
        churnProbability: 0.12,
        preferredServices: ['Lip Enhancement', 'Brow Services', 'Skincare']
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const fitnessDevotees: CustomerSegment = {
      id: 'fitness_devotees',
      name: 'Fitness Devotees',
      description: 'Customers focused on fitness and training programs',
      segmentType: 'behavioral',
      criteria: {
        fitnessServicePercentage: { operator: 'greater_than', value: 0.7 },
        totalFitnessBookings: { operator: 'greater_than', value: 5 }
      },
      customerIds: [],
      size: 0,
      characteristics: {
        averageOrderValue: 500,
        bookingFrequency: 2.0,
        totalRevenue: 7500,
        satisfactionScore: 4.5,
        churnProbability: 0.10,
        preferredServices: ['Personal Training', 'Group Classes', 'Wellness Programs']
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.segments.set('vip_customers', vipCustomers);
    this.segments.set('at_risk_customers', atRiskCustomers);
    this.segments.set('new_customers', newCustomers);
    this.segments.set('loyal_customers', loyalCustomers);
    this.segments.set('beauty_enthusiasts', beautyEnthusiasts);
    this.segments.set('fitness_devotees', fitnessDevotees);
  }

  private initializeSegmentationRules(): void {
    // Value-based rules
    this.segmentationRules.set('value_based', [
      {
        id: 'high_clv',
        name: 'High Customer Lifetime Value',
        field: 'customerLifetimeValue',
        operator: 'greater_than',
        value: 5000,
        weight: 0.8,
        description: 'Customer lifetime value above 5000 PLN'
      },
      {
        id: 'high_frequency',
        name: 'High Booking Frequency',
        field: 'bookingFrequency',
        operator: 'greater_than',
        value: 2,
        weight: 0.6,
        description: 'More than 2 bookings per month'
      },
      {
        id: 'high_aov',
        name: 'High Average Order Value',
        field: 'averageOrderValue',
        operator: 'greater_than',
        value: 500,
        weight: 0.5,
        description: 'Average order value above 500 PLN'
      }
    ]);

    // Behavioral rules
    this.segmentationRules.set('behavioral', [
      {
        id: 'recent_booking',
        name: 'Recent Booking',
        field: 'daysSinceLastBooking',
        operator: 'less_than',
        value: 30,
        weight: 0.7,
        description: 'Last booking within 30 days'
      },
      {
        id: 'multiple_services',
        name: 'Multiple Service Types',
        field: 'serviceDiversity',
        operator: 'greater_than',
        value: 2,
        weight: 0.5,
        description: 'Uses multiple service categories'
      },
      {
        id: 'seasonal_pattern',
        name: 'Seasonal Booking Pattern',
        field: 'hasSeasonalPattern',
        operator: 'equals',
        value: true,
        weight: 0.4,
        description: 'Shows seasonal booking patterns'
      }
    ]);

    // Predictive rules
    this.segmentationRules.set('predictive', [
      {
        id: 'high_churn_risk',
        name: 'High Churn Risk',
        field: 'churnProbability',
        operator: 'greater_than',
        value: 0.3,
        weight: 0.9,
        description: 'High probability of churn'
      },
      {
        id: 'low_engagement',
        name: 'Low Engagement',
        field: 'engagementScore',
        operator: 'less_than',
        value: 0.3,
        weight: 0.6,
        description: 'Low engagement across channels'
      },
      {
        id: 'declining_satisfaction',
        name: 'Declining Satisfaction',
        field: 'satisfactionTrend',
        operator: 'less_than',
        value: -0.1,
        weight: 0.7,
        description: 'Declining satisfaction trend'
      }
    ]);
  }

  public async analyzeCustomerBehavior(customerId: string): Promise<CustomerProfile> {
    try {
      // Fetch customer's booking history
      const { data: bookings } = await this.supabase
        .from('bookings')
        .select('*')
        .eq('user_id', customerId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      // Fetch customer's reviews
      const { data: reviews } = await this.supabase
        .from('reviews')
        .select('*')
        .eq('user_id', customerId);

      // Fetch customer's profile
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', customerId)
        .single();

      // Calculate behavioral metrics
      const behavior = this.calculateBehavioralMetrics(bookings || [], customerId);

      // Calculate value metrics
      const value = this.calculateValueMetrics(bookings || [], behavior);

      // Calculate predictive metrics
      const predictive = this.calculatePredictiveMetrics(behavior, value, reviews || []);

      const customerProfile: CustomerProfile = {
        id: crypto.randomUUID(),
        userId: customerId,
        segmentIds: [],
        behavior,
        demographics: {
          age: profile?.metadata?.age,
          ageGroup: this.getAgeGroup(profile?.metadata?.age),
          gender: profile?.metadata?.gender,
          location: profile?.metadata?.location,
          language: profile?.preferences?.language || 'pl'
        },
        value,
        predictive,
        lastUpdated: new Date()
      };

      // Store profile
      this.customerProfiles.set(customerId, customerProfile);

      // Assign to segments
      await this.assignCustomerToSegments(customerProfile);

      return customerProfile;

    } catch (error) {
      console.error(`Failed to analyze customer behavior for ${customerId}:`, error);
      throw error;
    }
  }

  private calculateBehavioralMetrics(bookings: any[], customerId: string): CustomerProfile['behavior'] {
    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
    const averageOrderValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

    // Calculate booking frequency (bookings per month)
    const firstBooking = bookings[bookings.length - 1];
    const lastBooking = bookings[0];
    const monthsActive = firstBooking && lastBooking
      ? Math.max(1, (new Date(lastBooking.created_at).getTime() - new Date(firstBooking.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30))
      : 1;
    const bookingFrequency = totalBookings / monthsActive;

    // Calculate days since last booking
    const daysSinceLastBooking = lastBooking
      ? Math.floor((Date.now() - new Date(lastBooking.created_at).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    // Analyze preferred services
    const serviceCounts = bookings.reduce((acc, booking) => {
      const service = booking.service_type || 'unknown';
      acc[service] = (acc[service] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const preferredServices = Object.entries(serviceCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([service]) => service);

    // Analyze booking patterns
    const bookingPatterns = this.analyzeBookingPatterns(bookings);

    return {
      totalBookings,
      totalRevenue,
      averageOrderValue,
      bookingFrequency,
      lastBookingDate: lastBooking?.created_at,
      daysSinceLastBooking,
      preferredServices,
      bookingPatterns,
      engagement: {
        emailOpenRate: 0.65, // Mock data - would come from email platform
        emailClickRate: 0.15,
        websiteVisits: 12,
        mobileAppUsage: 0.4,
        socialMediaEngagement: 0.3
      },
      satisfaction: this.calculateSatisfactionMetrics(preferredServices)
    };
  }

  private calculateValueMetrics(bookings: any[], behavior: CustomerProfile['behavior']): CustomerProfile['value'] {
    const totalRevenue = behavior.totalRevenue;
    const averageOrderValue = behavior.averageOrderValue;
    const bookingFrequency = behavior.bookingFrequency;

    // Simple CLV calculation
    const customerLifetimeValue = averageOrderValue * bookingFrequency * 24; // 24 months average lifetime

    // Calculate churn probability
    const churnProbability = this.calculateChurnProbability(behavior);

    // Calculate loyalty score
    const loyaltyScore = this.calculateLoyaltyScore(behavior, totalRevenue);

    // Calculate acquisition cost (mock data)
    const acquisitionCost = 150; // Would come from marketing data

    return {
      customerLifetimeValue,
      averageOrderValue,
      purchaseFrequency: bookingFrequency,
      acquisitionCost,
      profitMargin: 0.7, // 70% margin on services
      churnProbability,
      loyaltyScore
    };
  }

  private calculatePredictiveMetrics(behavior: CustomerProfile['behavior'], value: CustomerProfile['value'], reviews: any[]): CustomerProfile['predictive'] {
    // Next booking probability based on recency and frequency
    const recencyScore = Math.max(0, 1 - (behavior.daysSinceLastBooking / 180)); // Decay over 6 months
    const frequencyScore = Math.min(1, behavior.bookingFrequency / 2); // Normalize to 2 bookings/month
    const nextBookingProbability = recencyScore * frequencyScore * 0.8; // Apply confidence factor

    // Predict preferred next service
    const preferredNextService = behavior.preferredServices[0];

    // Predict likely churn date
    const likelyChurnDate = value.churnProbability > 0.5
      ? new Date(Date.now() + (90 * 24 * 60 * 60 * 1000)).toISOString() // 90 days if high risk
      : undefined;

    // Calculate upsell/cross-sell opportunities
    const upsellOpportunity = value.averageOrderValue < 500 ? 0.7 : 0.3;
    const crossSellOpportunity = behavior.preferredServices.length < 3 ? 0.8 : 0.4;

    // Project lifetime value
    const lifetimeValueProjection = value.customerLifetimeValue * (1 + (nextBookingProbability - 0.5));

    return {
      nextBookingProbability,
      preferredNextService,
      likelyChurnDate,
      upsellOpportunity,
      crossSellOpportunity,
      lifetimeValueProjection
    };
  }

  private analyzeBookingPatterns(bookings: any[]): CustomerProfile['behavior']['bookingPatterns'] {
    const daysOfWeek = bookings.map(b => new Date(b.created_at).getDay());
    const hours = bookings.map(b => new Date(b.created_at).getHours());

    // Most preferred days
    const dayCounts = daysOfWeek.reduce((acc, day) => {
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const preferredDays = Object.entries(dayCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([day]) => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][parseInt(day)]);

    // Most preferred times
    const hourCounts = hours.reduce((acc, hour) => {
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const preferredTimes = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => `${hour}:00`);

    // Service mix
    const serviceMix = bookings.reduce((acc, booking) => {
      const service = booking.service_type || 'unknown';
      acc[service] = (acc[service] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      preferredDays,
      preferredTimes,
      seasonality: ['Spring', 'Summer'], // Mock data - would analyze actual patterns
      serviceMix
    };
  }

  private calculateSatisfactionMetrics(preferredServices: string[]): CustomerProfile['behavior']['satisfaction'] {
    // Mock satisfaction data - would calculate from actual reviews
    return {
      averageRating: 4.5,
      totalReviews: 8,
      complaintCount: 1,
      netPromoterScore: 72,
      feedbackSentiment: 0.85
    };
  }

  private calculateChurnProbability(behavior: CustomerProfile['behavior']): number {
    let probability = 0;

    // Factor in recency
    if (behavior.daysSinceLastBooking > 90) probability += 0.4;
    else if (behavior.daysSinceLastBooking > 60) probability += 0.2;
    else if (behavior.daysSinceLastBooking > 30) probability += 0.1;

    // Factor in frequency
    if (behavior.bookingFrequency < 0.5) probability += 0.3;
    else if (behavior.bookingFrequency < 1) probability += 0.15;

    // Factor in satisfaction
    if (behavior.satisfaction.averageRating < 3.5) probability += 0.3;
    else if (behavior.satisfaction.averageRating < 4.0) probability += 0.15;

    // Factor in engagement
    if (behavior.engagement.emailOpenRate < 0.2) probability += 0.2;
    if (behavior.satisfaction.complaintCount > 2) probability += 0.2;

    return Math.min(1, probability);
  }

  private calculateLoyaltyScore(behavior: CustomerProfile['behavior'], totalRevenue: number): number {
    let score = 0.5; // Base score

    // Frequency factor
    score += Math.min(0.3, behavior.bookingFrequency * 0.15);

    // Value factor
    score += Math.min(0.2, totalRevenue / 10000);

    // Recency factor
    if (behavior.daysSinceLastBooking < 30) score += 0.2;
    else if (behavior.daysSinceLastBooking < 60) score += 0.1;

    // Service diversity factor
    score += Math.min(0.2, (behavior.preferredServices.length - 1) * 0.1);

    return Math.min(1, score);
  }

  private getAgeGroup(age?: number): string {
    if (!age) return 'unknown';
    if (age < 25) return '18-24';
    if (age < 35) return '25-34';
    if (age < 45) return '35-44';
    if (age < 55) return '45-54';
    return '55+';
  }

  private async assignCustomerToSegments(customerProfile: CustomerProfile): Promise<void> {
    const matchingSegments: string[] = [];

    // Check each segment's criteria
    for (const [segmentId, segment] of this.segments) {
      if (this.evaluateSegmentCriteria(customerProfile, segment)) {
        matchingSegments.push(segmentId);
      }
    }

    customerProfile.segmentIds = matchingSegments;

    // Update segment membership in database
    for (const segmentId of matchingSegments) {
      await this.supabase
        .from('customer_segment_assignments')
        .upsert({
          customer_id: customerProfile.userId,
          segment_id: segmentId,
          confidence_score: 0.8, // Would calculate based on criteria match strength
          assigned_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        }, {
          onConflict: 'customer_id,segment_id'
        });
    }
  }

  private evaluateSegmentCriteria(customerProfile: CustomerProfile, segment: CustomerSegment): boolean {
    const { criteria } = segment;

    // Simple rule evaluation - in production would be more sophisticated
    for (const [field, rule] of Object.entries(criteria)) {
      const fieldValue = this.getFieldValue(customerProfile, field);

      if (!this.evaluateRule(fieldValue, rule)) {
        return false;
      }
    }

    return true;
  }

  private getFieldValue(customerProfile: CustomerProfile, field: string): any {
    const fieldPath = field.split('.');
    let value: any = customerProfile;

    for (const part of fieldPath) {
      value = value?.[part];
    }

    return value;
  }

  private evaluateRule(fieldValue: any, rule: any): boolean {
    if (rule.operator === 'greater_than') {
      return fieldValue > rule.value;
    } else if (rule.operator === 'less_than') {
      return fieldValue < rule.value;
    } else if (rule.operator === 'equals') {
      return fieldValue === rule.value;
    } else if (rule.operator === 'between') {
      return fieldValue >= rule.value.min && fieldValue <= rule.value.max;
    }

    return false;
  }

  public async segmentAllCustomers(): Promise<CustomerSegment[]> {
    try {
      // Get all customers
      const { data: customers } = await this.supabase
        .from('profiles')
        .select('id');

      if (!customers) return [];

      // Analyze each customer
      for (const customer of customers) {
        try {
          await this.analyzeCustomerBehavior(customer.id);
        } catch (error) {
          console.error(`Failed to analyze customer ${customer.id}:`, error);
        }
      }

      // Update segment sizes
      for (const [segmentId, segment] of this.segments) {
        segment.size = this.getSegmentSize(segmentId);
        segment.updatedAt = new Date();
      }

      return Array.from(this.segments.values());

    } catch (error) {
      console.error('Failed to segment all customers:', error);
      throw error;
    }
  }

  private getSegmentSize(segmentId: string): number {
    return Array.from(this.customerProfiles.values())
      .filter(profile => profile.segmentIds.includes(segmentId))
      .length;
  }

  public async analyzeSegment(segmentId: string): Promise<SegmentAnalysis> {
    const segment = this.segments.get(segmentId);
    if (!segment) {
      throw new Error(`Segment ${segmentId} not found`);
    }

    const segmentCustomers = Array.from(this.customerProfiles.values())
      .filter(profile => profile.segmentIds.includes(segmentId));

    // Calculate insights
    const insights = this.calculateSegmentInsights(segmentCustomers);

    // Generate recommendations
    const recommendations = this.generateSegmentRecommendations(segment, segmentCustomers, insights);

    // Identify opportunities
    const opportunities = this.identifySegmentOpportunities(segmentCustomers);

    // Analyze trends
    const trends = await this.analyzeSegmentTrends(segmentId);

    return {
      segmentId,
      insights,
      recommendations,
      opportunities,
      trends
    };
  }

  private calculateSegmentInsights(customers: CustomerProfile[]): SegmentAnalysis['insights'] {
    if (customers.length === 0) {
      return {
        growthTrend: 'stable',
        averageLifetimeValue: 0,
        churnRate: 0,
        revenuePerCustomer: 0,
        bookingFrequency: 0,
        satisfactionScore: 0,
        responseRate: 0
      };
    }

    const totalCLV = customers.reduce((sum, c) => sum + c.value.customerLifetimeValue, 0);
    const totalRevenue = customers.reduce((sum, c) => sum + c.behavior.totalRevenue, 0);
    const totalFrequency = customers.reduce((sum, c) => sum + c.behavior.bookingFrequency, 0);
    const totalSatisfaction = customers.reduce((sum, c) => sum + c.behavior.satisfaction.averageRating, 0);
    const churnedCustomers = customers.filter(c => c.value.churnProbability > 0.5).length;

    return {
      growthTrend: 'increasing', // Would analyze actual trends
      averageLifetimeValue: totalCLV / customers.length,
      churnRate: (churnedCustomers / customers.length) * 100,
      revenuePerCustomer: totalRevenue / customers.length,
      bookingFrequency: totalFrequency / customers.length,
      satisfactionScore: totalSatisfaction / customers.length,
      responseRate: 65 // Mock data - would calculate from engagement metrics
    };
  }

  private generateSegmentRecommendations(
    segment: CustomerSegment,
    customers: CustomerProfile[],
    insights: SegmentAnalysis['insights']
  ): string[] {
    const recommendations: string[] = [];

    switch (segment.segmentType) {
      case 'value_based':
        recommendations.push('Offer exclusive premium packages and VIP experiences');
        recommendations.push('Provide early access to new services and special events');
        recommendations.push('Create loyalty rewards program with tiered benefits');
        break;

      case 'predictive':
        if (segment.id === 'at_risk_customers') {
          recommendations.push('Launch targeted retention campaigns with special offers');
          recommendations.push('Schedule proactive check-in calls or messages');
          recommendations.push('Offer service packages to increase commitment');
        }
        break;

      case 'lifecycle':
        if (segment.id === 'new_customers') {
          recommendations.push('Implement comprehensive onboarding sequence');
          recommendations.push('Offer introductory discounts for additional services');
          recommendations.push('Provide educational content about service benefits');
        }
        break;

      case 'behavioral':
        recommendations.push('Personalize communication based on service preferences');
        recommendations.push('Create bundled offers for complementary services');
        recommendations.push('Send targeted content related to their interests');
        break;
    }

    // Add general recommendations based on insights
    if (insights.churnRate > 20) {
      recommendations.push('Implement customer satisfaction surveys to identify issues');
    }

    if (insights.averageLifetimeValue < 2000) {
      recommendations.push('Focus on upselling and cross-selling strategies');
    }

    return recommendations;
  }

  private identifySegmentOpportunities(customers: CustomerProfile[]): SegmentAnalysis['opportunities'] {
    const opportunities: SegmentAnalysis['opportunities'] = [];

    // Upsell opportunities
    const lowValueCustomers = customers.filter(c => c.value.averageOrderValue < 400);
    if (lowValueCustomers.length > 0) {
      opportunities.push({
        type: 'upsell',
        description: `Target ${lowValueCustomers.length} customers with premium service packages`,
        priority: 'high',
        potentialValue: lowValueCustomers.length * 200 // Estimated additional revenue
      });
    }

    // Cross-sell opportunities
    const singleServiceCustomers = customers.filter(c => c.behavior.preferredServices.length === 1);
    if (singleServiceCustomers.length > 0) {
      opportunities.push({
        type: 'cross_sell',
        description: `Introduce ${singleServiceCustomers.length} customers to complementary services`,
        priority: 'medium',
        potentialValue: singleServiceCustomers.length * 150
      });
    }

    // Retention opportunities
    const atRiskCustomers = customers.filter(c => c.value.churnProbability > 0.3);
    if (atRiskCustomers.length > 0) {
      opportunities.push({
        type: 'retention',
        description: `Run retention campaign for ${atRiskCustomers.length} at-risk customers`,
        priority: 'high',
        potentialValue: atRiskCustomers.length * 300 // Value of retained customers
      });
    }

    return opportunities;
  }

  private async analyzeSegmentTrends(segmentId: string): Promise<SegmentAnalysis['trends']> {
    // Mock trend analysis - would analyze historical data
    const monthlyGrowth = Array.from({ length: 6 }, (_, i) => ({
      month: new Date(Date.now() - (5 - i) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en', { month: 'short' }),
      customers: Math.floor(Math.random() * 20) + 10,
      revenue: Math.floor(Math.random() * 5000) + 2000
    })).reverse();

    const servicePreferences = [
      { service: 'Lip Enhancement', percentage: 35, growth: 15 },
      { service: 'Brow Lamination', percentage: 28, growth: 8 },
      { service: 'Lash Lift', percentage: 22, growth: 12 },
      { service: 'Skincare', percentage: 15, growth: 20 }
    ];

    return {
      monthlyGrowth,
      servicePreferences,
      behaviorPatterns: {
        preferredBookingDays: ['Wednesday', 'Saturday', 'Sunday'],
        averageBookingAdvance: 7, // days in advance
        peakSeasonality: 'Summer'
      }
    };
  }

  public async getCustomerSegment(customerId: string): Promise<CustomerSegment[]> {
    const profile = this.customerProfiles.get(customerId);
    if (!profile) {
      throw new Error(`Customer profile not found for ${customerId}`);
    }

    return profile.segmentIds.map(segmentId => this.segments.get(segmentId)!).filter(Boolean);
  }

  public async updateSegmentCriteria(segmentId: string, criteria: Record<string, any>): Promise<void> {
    const segment = this.segments.get(segmentId);
    if (!segment) {
      throw new Error(`Segment ${segmentId} not found`);
    }

    segment.criteria = criteria;
    segment.updatedAt = new Date();

    // Re-assign customers based on new criteria
    await this.segmentAllCustomers();
  }

  public async createCustomSegment(
    name: string,
    description: string,
    segmentType: CustomerSegment['segmentType'],
    criteria: Record<string, any>
  ): Promise<CustomerSegment> {
    const segment: CustomerSegment = {
      id: crypto.randomUUID(),
      name,
      description,
      segmentType,
      criteria,
      customerIds: [],
      size: 0,
      characteristics: {
        averageOrderValue: 0,
        bookingFrequency: 0,
        totalRevenue: 0,
        satisfactionScore: 0,
        churnProbability: 0,
        preferredServices: []
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save to database
    await this.supabase
      .from('customer_segments')
      .insert({
        id: segment.id,
        name,
        description,
        segment_type: segmentType,
        criteria,
        is_active: true
      });

    this.segments.set(segment.id, segment);
    return segment;
  }

  public getSegments(): CustomerSegment[] {
    return Array.from(this.segments.values());
  }

  public getCustomerProfiles(): CustomerProfile[] {
    return Array.from(this.customerProfiles.values());
  }

  public async generateSegmentReport(segmentId: string): Promise<{
    segment: CustomerSegment;
    analysis: SegmentAnalysis;
    customers: CustomerProfile[];
  }> {
    const segment = this.segments.get(segmentId);
    if (!segment) {
      throw new Error(`Segment ${segmentId} not found`);
    }

    const analysis = await this.analyzeSegment(segmentId);
    const customers = Array.from(this.customerProfiles.values())
      .filter(profile => profile.segmentIds.includes(segmentId));

    return {
      segment,
      analysis,
      customers
    };
  }
}

// Create singleton instance
export const customerSegmentation = new CustomerSegmentation();

// Export convenience functions
export const analyzeCustomer = (customerId: string) => customerSegmentation.analyzeCustomerBehavior(customerId);
export const segmentAllCustomers = () => customerSegmentation.segmentAllCustomers();
export const analyzeSegment = (segmentId: string) => customerSegmentation.analyzeSegment(segmentId);
export const createCustomSegment = (
  name: string,
  description: string,
  segmentType: CustomerSegment['segmentType'],
  criteria: Record<string, any>
) => customerSegmentation.createCustomSegment(name, description, segmentType, criteria);

export default customerSegmentation;