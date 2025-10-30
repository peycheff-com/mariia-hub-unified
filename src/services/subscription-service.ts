/**
 * Subscription Service
 *
 * Comprehensive subscription management for:
 * - Membership plans for regular clients
 * - Service package subscriptions
 * - Automatic payment processing
 * - Dunning and failed payment recovery
 * - Subscription lifecycle management
 */

import { SubscriptionPlan, Subscription } from './payment-factory';
import { createClient } from '@supabase/supabase-js';

interface SubscriptionTier {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingInterval: 'month' | 'quarter' | 'year';
  features: SubscriptionFeature[];
  benefits: string[];
  maxBookingsPerMonth?: number;
  discountPercentage?: number;
  priorityBooking?: boolean;
  freeServices?: string[];
  metadata: Record<string, any>;
}

interface SubscriptionFeature {
  id: string;
  name: string;
  description: string;
  value: string | number | boolean;
  category: 'booking' | 'discount' | 'service' | 'priority' | 'access';
}

interface SubscriptionAddOn {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingInterval: 'month' | 'year';
  applicableTiers: string[];
  isActive: boolean;
}

interface SubscriptionUsage {
  subscriptionId: string;
  feature: string;
  currentUsage: number;
  limit: number;
  resetDate: string;
  period: 'monthly' | 'quarterly' | 'yearly';
}

interface SubscriptionInvoice {
  id: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  dueDate: string;
  paidAt?: string;
  attemptCount: number;
  nextAttemptDate?: string;
  paymentMethodId?: string;
  lineItems: SubscriptionInvoiceLineItem[];
  metadata: Record<string, any>;
}

interface SubscriptionInvoiceLineItem {
  id: string;
  description: string;
  amount: number;
  currency: string;
  quantity: number;
  type: 'plan' | 'addon' | 'discount' | 'tax';
}

interface SubscriptionDiscount {
  id: string;
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
  currency?: string;
  duration: 'once' | 'repeating' | 'forever';
  durationInMonths?: number;
  applicableTiers: string[];
  couponCode?: string;
  isActive: boolean;
  metadata: Record<string, any>;
}

interface DunningConfig {
  attemptDays: number[];
  maxAttempts: number;
  gracePeriodDays: number;
  actionOnFailure: 'cancel' | 'pause' | 'grace_period';
  templateIds: {
    paymentFailed: string;
    finalNotice: string;
    subscriptionCancelled: string;
  };
}

interface SubscriptionAnalytics {
  totalSubscriptions: number;
  activeSubscriptions: number;
  churnedSubscriptions: number;
  monthlyRecurringRevenue: number;
  averageRevenuePerUser: number;
  customerLifetimeValue: number;
  churnRate: number;
  mrrGrowth: number;
  tierDistribution: Record<string, number>;
  subscriptionMetrics: {
    newSubscriptions: number;
    cancellations: number;
    upgrades: number;
    downgrades: number;
  };
}

export class SubscriptionService {
  private supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
  );

  private dunningConfig: DunningConfig = {
    attemptDays: [3, 7, 14, 21], // Days to retry payment
    maxAttempts: 4,
    gracePeriodDays: 7,
    actionOnFailure: 'pause',
    templateIds: {
      paymentFailed: 'sub_payment_failed',
      finalNotice: 'sub_final_notice',
      subscriptionCancelled: 'sub_cancelled'
    }
  };

  constructor() {
    this.initializeSubscriptionPlans();
  }

  private async initializeSubscriptionPlans(): Promise<void> {
    // Initialize default subscription plans if they don't exist
    const existingPlans = await this.supabase
      .from('subscription_tiers')
      .select('*');

    if (!existingPlans.data || existingPlans.data.length === 0) {
      await this.createDefaultPlans();
    }
  }

  private async createDefaultPlans(): Promise<void> {
    const defaultPlans: Omit<SubscriptionTier, 'id'>[] = [
      {
        name: 'Silver',
        description: 'Ideal for regular clients who visit monthly',
        price: 99,
        currency: 'PLN',
        billingInterval: 'month',
        features: [
          {
            id: 'silver_bookings',
            name: 'Monthly Bookings',
            description: 'Up to 2 bookings per month',
            value: 2,
            category: 'booking'
          },
          {
            id: 'silver_discount',
            name: 'Service Discount',
            description: '5% discount on all services',
            value: 5,
            category: 'discount'
          },
          {
            id: 'silver_priority',
            name: 'Priority Booking',
            description: 'Book 7 days in advance',
            value: true,
            category: 'priority'
          }
        ],
        benefits: [
          '5% discount on all services',
          'Priority booking (7 days advance)',
          'Monthly skin consultation',
          'Exclusive access to promotions'
        ],
        maxBookingsPerMonth: 2,
        discountPercentage: 5,
        priorityBooking: true,
        metadata: {
          popular: true,
          targetAudience: 'regular_clients'
        }
      },
      {
        name: 'Gold',
        description: 'Perfect for beauty enthusiasts with frequent visits',
        price: 199,
        currency: 'PLN',
        billingInterval: 'month',
        features: [
          {
            id: 'gold_bookings',
            name: 'Monthly Bookings',
            description: 'Up to 4 bookings per month',
            value: 4,
            category: 'booking'
          },
          {
            id: 'gold_discount',
            name: 'Service Discount',
            description: '10% discount on all services',
            value: 10,
            category: 'discount'
          },
          {
            id: 'gold_priority',
            name: 'Priority Booking',
            description: 'Book 14 days in advance',
            value: true,
            category: 'priority'
          },
          {
            id: 'gold_free_service',
            name: 'Free Monthly Service',
            description: '1 free basic service per month',
            value: 'basic',
            category: 'service'
          }
        ],
        benefits: [
          '10% discount on all services',
          'Priority booking (14 days advance)',
          '1 free basic service monthly',
          'Monthly skin consultation',
          'Exclusive product discounts',
          'Priority customer support'
        ],
        maxBookingsPerMonth: 4,
        discountPercentage: 10,
        priorityBooking: true,
        freeServices: ['basic_manicure', 'eyebrow_shaping'],
        metadata: {
          mostPopular: true,
          targetAudience: 'beauty_enthusiasts'
        }
      },
      {
        name: 'Platinum',
        description: 'Ultimate luxury experience for our most valued clients',
        price: 399,
        currency: 'PLN',
        billingInterval: 'month',
        features: [
          {
            id: 'platinum_bookings',
            name: 'Unlimited Bookings',
            description: 'Unlimited bookings per month',
            value: -1, // Unlimited
            category: 'booking'
          },
          {
            id: 'platinum_discount',
            name: 'Service Discount',
            description: '15% discount on all services',
            value: 15,
            category: 'discount'
          },
          {
            id: 'platinum_priority',
            name: 'VIP Priority Booking',
            description: 'Book 30 days in advance',
            value: true,
            category: 'priority'
          },
          {
            id: 'platinum_free_services',
            name: 'Free Monthly Services',
            description: '2 free services per month',
            value: 2,
            category: 'service'
          }
        ],
        benefits: [
          '15% discount on all services',
          'VIP priority booking (30 days advance)',
          '2 free services monthly',
          'Weekly skin consultation',
          'Exclusive product discounts (20%)',
          'VIP customer support',
          'Exclusive event invitations',
          'Personal beauty advisor'
        ],
        maxBookingsPerMonth: -1, // Unlimited
        discountPercentage: 15,
        priorityBooking: true,
        freeServices: ['basic_manicure', 'eyebrow_shaping', 'lips_enhancement'],
        metadata: {
          premium: true,
          targetAudience: 'luxury_clients'
        }
      }
    ];

    for (const plan of defaultPlans) {
      await this.supabase
        .from('subscription_tiers')
        .insert(plan);
    }
  }

  /**
   * Get available subscription plans
   */
  async getSubscriptionPlans(): Promise<SubscriptionTier[]> {
    const { data, error } = await this.supabase
      .from('subscription_tiers')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true });

    if (error) {
      console.error('Error fetching subscription plans:', error);
      return [];
    }

    return data as SubscriptionTier[];
  }

  /**
   * Get subscription plan by ID
   */
  async getSubscriptionPlan(planId: string): Promise<SubscriptionTier | null> {
    const { data, error } = await this.supabase
      .from('subscription_tiers')
      .select('*')
      .eq('id', planId)
      .single();

    if (error) {
      console.error('Error fetching subscription plan:', error);
      return null;
    }

    return data as SubscriptionTier;
  }

  /**
   * Create subscription for customer
   */
  async createSubscription(params: {
    customerId: string;
    tierId: string;
    paymentMethodId: string;
    addOns?: string[];
    discountCode?: string;
    trialPeriodDays?: number;
    metadata?: Record<string, any>;
  }): Promise<Subscription> {
    try {
      // Get tier details
      const tier = await this.getSubscriptionPlan(params.tierId);
      if (!tier) {
        throw new Error('Subscription tier not found');
      }

      // Check for existing active subscription
      const existingSubscription = await this.getActiveSubscription(params.customerId);
      if (existingSubscription) {
        throw new Error('Customer already has an active subscription');
      }

      // Calculate pricing
      let totalPrice = tier.price;
      let discountAmount = 0;

      // Apply discount if provided
      if (params.discountCode) {
        const discount = await this.getDiscountByCode(params.discountCode);
        if (discount && discount.isActive) {
          if (discount.type === 'percentage') {
            discountAmount = (totalPrice * discount.value) / 100;
          } else {
            discountAmount = discount.value;
          }
        }
      }

      // Calculate add-on prices
      let addOnPrice = 0;
      if (params.addOns && params.addOns.length > 0) {
        const addOns = await this.getAddOns(params.addOns);
        addOnPrice = addOns.reduce((sum, addOn) => sum + addOn.price, 0);
      }

      const finalPrice = Math.max(0, totalPrice - discountAmount + addOnPrice);

      // Create subscription record
      const { data: subscription, error } = await this.supabase
        .from('subscriptions')
        .insert({
          customer_id: params.customerId,
          tier_id: params.tierId,
          status: params.trialPeriodDays ? 'trialing' : 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: this.calculateNextBillingDate(tier.billingInterval, params.trialPeriodDays),
          cancel_at_period_end: false,
          payment_method_id: params.paymentMethodId,
          price: finalPrice,
          currency: tier.currency,
          billing_interval: tier.billingInterval,
          trial_end: params.trialPeriodDays ? new Date(Date.now() + params.trialPeriodDays * 24 * 60 * 60 * 1000).toISOString() : null,
          add_ons: params.addOns,
          discount_code: params.discountCode,
          discount_amount: discountAmount,
          metadata: params.metadata,
          created_at: new Date()
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create subscription: ${error.message}`);
      }

      // Initialize usage tracking
      await this.initializeUsageTracking(subscription.id, tier);

      // Create initial invoice if not on trial
      if (!params.trialPeriodDays) {
        await this.createSubscriptionInvoice(subscription.id);
      }

      // Send welcome email
      await this.sendSubscriptionWelcome(subscription.id);

      return subscription as Subscription;

    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  /**
   * Get active subscription for customer
   */
  async getActiveSubscription(customerId: string): Promise<Subscription | null> {
    const { data, error } = await this.supabase
      .from('subscriptions')
      .select(`
        *,
        subscription_tiers(*)
      `)
      .eq('customer_id', customerId)
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      return null;
    }

    return data as Subscription;
  }

  /**
   * Update subscription
   */
  async updateSubscription(
    subscriptionId: string,
    updates: Partial<{
      tierId: string;
      paymentMethodId: string;
      addOns: string[];
      status: 'active' | 'canceled' | 'paused';
      cancelAtPeriodEnd: boolean;
      metadata: Record<string, any>;
    }>
  ): Promise<Subscription> {
    try {
      const updateData: any = { ...updates, updated_at: new Date() };

      if (updates.tierId) {
        // Handle tier change (upgrade/downgrade)
        await this.handleTierChange(subscriptionId, updates.tierId);
      }

      const { data, error } = await this.supabase
        .from('subscriptions')
        .update(updateData)
        .eq('id', subscriptionId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update subscription: ${error.message}`);
      }

      return data as Subscription;

    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    reason: string,
    immediately: boolean = false
  ): Promise<void> {
    try {
      if (immediately) {
        // Cancel immediately
        await this.supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            canceled_at: new Date(),
            cancel_reason: reason,
            updated_at: new Date()
          })
          .eq('id', subscriptionId);
      } else {
        // Cancel at period end
        await this.supabase
          .from('subscriptions')
          .update({
            cancel_at_period_end: true,
            cancel_reason: reason,
            updated_at: new Date()
          })
          .eq('id', subscriptionId);
      }

      // Send cancellation confirmation
      await this.sendSubscriptionCancellation(subscriptionId, reason);

    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  /**
   * Pause subscription
   */
  async pauseSubscription(
    subscriptionId: string,
    pauseDurationMonths?: number
  ): Promise<void> {
    try {
      const pauseUntil = pauseDurationMonths
        ? new Date(Date.now() + pauseDurationMonths * 30 * 24 * 60 * 60 * 1000).toISOString()
        : null;

      await this.supabase
        .from('subscriptions')
        .update({
          status: 'paused',
          paused_at: new Date(),
          pause_until: pauseUntil,
          updated_at: new Date()
        })
        .eq('id', subscriptionId);

    } catch (error) {
      console.error('Error pausing subscription:', error);
      throw error;
    }
  }

  /**
   * Resume subscription
   */
  async resumeSubscription(subscriptionId: string): Promise<void> {
    try {
      await this.supabase
        .from('subscriptions')
        .update({
          status: 'active',
          resumed_at: new Date(),
          pause_until: null,
          updated_at: new Date()
        })
        .eq('id', subscriptionId);

    } catch (error) {
      console.error('Error resuming subscription:', error);
      throw error;
    }
  }

  /**
   * Process subscription billing
   */
  async processBilling(): Promise<{ processed: number; failed: number }> {
    try {
      // Get subscriptions due for billing
      const { data: subscriptions, error } = await this.supabase
        .from('subscriptions')
        .select('*')
        .eq('status', 'active')
        .lte('current_period_end', new Date().toISOString());

      if (error) {
        throw new Error(`Failed to fetch subscriptions for billing: ${error.message}`);
      }

      let processed = 0;
      let failed = 0;

      for (const subscription of subscriptions) {
        try {
          await this.processSingleSubscriptionBilling(subscription);
          processed++;
        } catch (error) {
          console.error(`Failed to process billing for subscription ${subscription.id}:`, error);
          failed++;
        }
      }

      return { processed, failed };

    } catch (error) {
      console.error('Error in billing process:', error);
      return { processed: 0, failed: 0 };
    }
  }

  /**
   * Get subscription usage
   */
  async getSubscriptionUsage(subscriptionId: string): Promise<SubscriptionUsage[]> {
    const { data, error } = await this.supabase
      .from('subscription_usage')
      .select('*')
      .eq('subscription_id', subscriptionId);

    if (error) {
      console.error('Error fetching subscription usage:', error);
      return [];
    }

    return data as SubscriptionUsage[];
  }

  /**
   * Update subscription usage
   */
  async updateUsage(
    subscriptionId: string,
    feature: string,
    increment: number = 1
  ): Promise<void> {
    try {
      // Get current usage
      const { data: currentUsage } = await this.supabase
        .from('subscription_usage')
        .select('*')
        .eq('subscription_id', subscriptionId)
        .eq('feature', feature)
        .single();

      if (currentUsage) {
        // Update existing usage
        const newUsage = currentUsage.current_usage + increment;
        await this.supabase
          .from('subscription_usage')
          .update({
            current_usage: newUsage,
            updated_at: new Date()
          })
          .eq('id', currentUsage.id);
      } else {
        // Create new usage record
        await this.supabase
          .from('subscription_usage')
          .insert({
            subscription_id: subscriptionId,
            feature,
            current_usage: increment,
            limit: this.getFeatureLimit(feature),
            reset_date: this.calculateResetDate(feature),
            period: this.getFeaturePeriod(feature),
            created_at: new Date()
          });
      }

    } catch (error) {
      console.error('Error updating subscription usage:', error);
      throw error;
    }
  }

  /**
   * Check if feature usage is allowed
   */
  async isUsageAllowed(subscriptionId: string, feature: string): Promise<boolean> {
    try {
      const usage = await this.getSubscriptionUsage(subscriptionId);
      const featureUsage = usage.find(u => u.feature === feature);

      if (!featureUsage) {
        return true; // No limit found, allow usage
      }

      // Check if usage needs to be reset
      if (new Date() > new Date(featureUsage.resetDate)) {
        await this.resetUsage(subscriptionId, feature);
        return true;
      }

      return featureUsage.limit === -1 || featureUsage.current_usage < featureUsage.limit;

    } catch (error) {
      console.error('Error checking usage allowance:', error);
      return true; // Allow usage on error
    }
  }

  /**
   * Get subscription analytics
   */
  async getSubscriptionAnalytics(startDate?: Date, endDate?: Date): Promise<SubscriptionAnalytics> {
    try {
      const query = this.supabase.from('subscriptions').select('*');

      if (startDate) {
        query.gte('created_at', startDate.toISOString());
      }
      if (endDate) {
        query.lte('created_at', endDate.toISOString());
      }

      const { data: subscriptions, error } = await query;

      if (error || !subscriptions) {
        throw new Error('Failed to fetch subscription data');
      }

      const activeSubscriptions = subscriptions.filter(s => s.status === 'active' || s.status === 'trialing');
      const churnedSubscriptions = subscriptions.filter(s => s.status === 'canceled');

      const monthlyRecurringRevenue = activeSubscriptions.reduce((sum, s) => sum + (s.price || 0), 0);
      const averageRevenuePerUser = activeSubscriptions.length > 0 ? monthlyRecurringRevenue / activeSubscriptions.length : 0;

      // Calculate tier distribution
      const tierDistribution: Record<string, number> = {};
      activeSubscriptions.forEach(sub => {
        const tier = sub.tier_id || 'unknown';
        tierDistribution[tier] = (tierDistribution[tier] || 0) + 1;
      });

      // Calculate churn rate (simplified)
      const totalCustomers = subscriptions.length;
      const churnRate = totalCustomers > 0 ? (churnedSubscriptions.length / totalCustomers) * 100 : 0;

      return {
        totalSubscriptions: subscriptions.length,
        activeSubscriptions: activeSubscriptions.length,
        churnedSubscriptions: churnedSubscriptions.length,
        monthlyRecurringRevenue,
        averageRevenuePerUser,
        customerLifetimeValue: averageRevenuePerUser * 12, // Simplified CLV
        churnRate,
        mrrGrowth: 0, // Would need historical data
        tierDistribution,
        subscriptionMetrics: {
          newSubscriptions: 0, // Would need time-based filtering
          cancellations: churnedSubscriptions.length,
          upgrades: 0,
          downgrades: 0
        }
      };

    } catch (error) {
      console.error('Error fetching subscription analytics:', error);
      return {
        totalSubscriptions: 0,
        activeSubscriptions: 0,
        churnedSubscriptions: 0,
        monthlyRecurringRevenue: 0,
        averageRevenuePerUser: 0,
        customerLifetimeValue: 0,
        churnRate: 0,
        mrrGrowth: 0,
        tierDistribution: {},
        subscriptionMetrics: {
          newSubscriptions: 0,
          cancellations: 0,
          upgrades: 0,
          downgrades: 0
        }
      };
    }
  }

  // Private helper methods

  private calculateNextBillingDate(
    interval: 'month' | 'quarter' | 'year',
    trialDays?: number
  ): string {
    const now = new Date();

    if (trialDays) {
      now.setDate(now.getDate() + trialDays);
    }

    switch (interval) {
      case 'month':
        now.setMonth(now.getMonth() + 1);
        break;
      case 'quarter':
        now.setMonth(now.getMonth() + 3);
        break;
      case 'year':
        now.setFullYear(now.getFullYear() + 1);
        break;
    }

    return now.toISOString();
  }

  private async initializeUsageTracking(subscriptionId: string, tier: SubscriptionTier): Promise<void> {
    const usageDefaults = [
      { feature: 'monthly_bookings', limit: tier.maxBookingsPerMonth || 0 },
      { feature: 'free_services', limit: tier.freeServices?.length || 0 },
      { feature: 'priority_booking', limit: 1 }, // Boolean feature
    ];

    for (const usage of usageDefaults) {
      await this.supabase
        .from('subscription_usage')
        .insert({
          subscription_id: subscriptionId,
          feature: usage.feature,
          current_usage: 0,
          limit: usage.limit,
          reset_date: this.calculateResetDate(usage.feature),
          period: this.getFeaturePeriod(usage.feature),
          created_at: new Date()
        });
    }
  }

  private calculateResetDate(feature: string): string {
    const now = new Date();

    switch (feature) {
      case 'monthly_bookings':
      case 'free_services':
        now.setMonth(now.getMonth() + 1);
        now.setDate(1);
        break;
      case 'quarterly_bookings':
        now.setMonth(now.getMonth() + 3);
        break;
      default:
        now.setMonth(now.getMonth() + 1);
    }

    return now.toISOString();
  }

  private getFeatureLimit(feature: string): number {
    const limits: Record<string, number> = {
      'monthly_bookings': 2,
      'free_services': 1,
      'priority_booking': 1,
      'quarterly_bookings': 6
    };

    return limits[feature] || 0;
  }

  private getFeaturePeriod(feature: string): 'monthly' | 'quarterly' | 'yearly' {
    if (feature.includes('monthly')) return 'monthly';
    if (feature.includes('quarterly')) return 'quarterly';
    return 'monthly';
  }

  private async handleTierChange(subscriptionId: string, newTierId: string): Promise<void> {
    // This would handle proration, billing adjustments, etc.
    // Implementation depends on business requirements
    console.log(`Handling tier change for subscription ${subscriptionId} to tier ${newTierId}`);
  }

  private async createSubscriptionInvoice(subscriptionId: string): Promise<void> {
    // Implementation for creating subscription invoices
    // This would integrate with the invoice service
    console.log(`Creating invoice for subscription ${subscriptionId}`);
  }

  private async processSingleSubscriptionBilling(subscription: any): Promise<void> {
    try {
      // Create invoice
      await this.createSubscriptionInvoice(subscription.id);

      // Process payment
      // This would integrate with payment service factory

      // Update billing period
      const newPeriodEnd = this.calculateNextBillingDate(subscription.billing_interval);

      await this.supabase
        .from('subscriptions')
        .update({
          current_period_end: newPeriodEnd,
          updated_at: new Date()
        })
        .eq('id', subscription.id);

      // Reset usage counters
      await this.resetAllUsage(subscription.id);

    } catch (error) {
      // Handle failed payment - initiate dunning process
      await this.initiateDunningProcess(subscription.id, error);
      throw error;
    }
  }

  private async initiateDunningProcess(subscriptionId: string, error: any): Promise<void> {
    console.log(`Initiating dunning process for subscription ${subscriptionId}:`, error);

    // Update subscription with billing failure
    await this.supabase
      .from('subscriptions')
      .update({
        billing_attempts: this.supabase.raw('billing_attempts + 1'),
        last_billing_failure: new Date(),
        next_billing_attempt: this.calculateNextBillingAttempt(1)
      })
      .eq('id', subscriptionId);

    // Send payment failure notification
    await this.sendBillingFailureNotification(subscriptionId);
  }

  private calculateNextBillingAttempt(attemptNumber: number): Date {
    const days = this.dunningConfig.attemptDays[attemptNumber - 1] || 7;
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }

  private async resetUsage(subscriptionId: string, feature: string): Promise<void> {
    await this.supabase
      .from('subscription_usage')
      .update({
        current_usage: 0,
        reset_date: this.calculateResetDate(feature),
        updated_at: new Date()
      })
      .eq('subscription_id', subscriptionId)
      .eq('feature', feature);
  }

  private async resetAllUsage(subscriptionId: string): Promise<void> {
    const usage = await this.getSubscriptionUsage(subscriptionId);

    for (const featureUsage of usage) {
      await this.resetUsage(subscriptionId, featureUsage.feature);
    }
  }

  private async getAddOns(addOnIds: string[]): Promise<SubscriptionAddOn[]> {
    const { data, error } = await this.supabase
      .from('subscription_add_ons')
      .select('*')
      .in('id', addOnIds)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching add-ons:', error);
      return [];
    }

    return data as SubscriptionAddOn[];
  }

  private async getDiscountByCode(code: string): Promise<SubscriptionDiscount | null> {
    const { data, error } = await this.supabase
      .from('subscription_discounts')
      .select('*')
      .eq('coupon_code', code)
      .eq('is_active', true)
      .single();

    if (error) {
      return null;
    }

    return data as SubscriptionDiscount;
  }

  // Email notification methods (placeholders)
  private async sendSubscriptionWelcome(subscriptionId: string): Promise<void> {
    console.log(`Sending welcome email for subscription ${subscriptionId}`);
    // Implementation would integrate with email service
  }

  private async sendSubscriptionCancellation(subscriptionId: string, reason: string): Promise<void> {
    console.log(`Sending cancellation email for subscription ${subscriptionId}, reason: ${reason}`);
    // Implementation would integrate with email service
  }

  private async sendBillingFailureNotification(subscriptionId: string): Promise<void> {
    console.log(`Sending billing failure notification for subscription ${subscriptionId}`);
    // Implementation would integrate with email service
  }
}

// Export singleton instance
export const subscriptionService = new SubscriptionService();