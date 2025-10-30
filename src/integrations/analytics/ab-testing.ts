import { supabase } from '@/integrations/supabase/client';
import { ga4Analytics } from './ga4';
import { behaviorTracker } from './behavior-tracker';

// A/B Test Configuration
export interface ABTestConfig {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  start_date?: string;
  end_date?: string;
  target_audience: {
    percentage: number; // Percentage of traffic to include
    criteria: {
      device_types?: string[];
      service_categories?: string[];
      new_vs_returning?: 'new' | 'returning' | 'all';
      geographic_locations?: string[];
    };
  };
  variants: Array<{
    id: string;
    name: string;
    description: string;
    traffic_allocation: number; // Percentage of traffic (should sum to 100)
    changes: {
      component?: string; // Component to modify
      css_classes?: string; // CSS classes to add/modify
      content?: Record<string, any>; // Content changes
      layout?: string; // Layout changes
      pricing?: any; // Pricing changes
    };
  };
  success_metrics: Array<{
    name: string;
    type: 'conversion_rate' | 'revenue_per_visitor' | 'click_through_rate' | 'time_on_page' | 'booking_completion';
    weight: number; // Importance weight for overall success calculation
    target_improvement?: number; // Target improvement percentage
  }>;
  statistical_settings: {
    confidence_level: number; // 95, 99, etc.
    minimum_sample_size: number;
    test_duration_days: number;
  };
}

// Test Result Interface
export interface ABTestResult {
  test_id: string;
  variant_id: string;
  participants: number;
  conversions: number;
  conversion_rate: number;
  revenue: number;
  revenue_per_visitor: number;
  average_session_duration: number;
  confidence_level: number;
  statistical_significance: boolean;
    confidence_interval: {
    lower: number;
    upper: number;
  };
  improvement_vs_control?: {
    absolute: number;
    relative: number;
  };
}

// User Test Assignment
export interface UserTestAssignment {
  user_id?: string;
  session_id: string;
  test_id: string;
  variant_id: string;
  assigned_at: string;
  has_converted: boolean;
  conversion_value?: number;
  exposure_count: number;
  last_seen_at: string;
}

export class ABTestingFramework {
  private static instance: ABTestingFramework;
  private activeTests: Map<string, ABTestConfig> = new Map();
  private userAssignments: Map<string, Map<string, string>> = new Map(); // sessionId -> testId -> variantId
  private isInitialized: boolean = false;

  constructor() {
    this.initialize();
  }

  static getInstance(): ABTestingFramework {
    if (!ABTestingFramework.instance) {
      ABTestingFramework.instance = new ABTestingFramework();
    }
    return ABTestingFramework.instance;
  }

  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.loadActiveTests();
      await this.loadUserAssignments();
      this.setupEventListeners();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize A/B testing framework:', error);
    }
  }

  private async loadActiveTests(): Promise<void> {
    try {
      const { data: tests, error } = await supabase
        .from('ab_tests')
        .select('*')
        .eq('status', 'running')
        .lte('start_date', new Date().toISOString())
        .or('end_date.is.null,end_date.gte.' + new Date().toISOString());

      if (error) throw error;

      tests?.forEach(test => {
        this.activeTests.set(test.id, test);
      });

      console.log(`Loaded ${tests?.length || 0} active A/B tests`);
    } catch (error) {
      console.error('Failed to load active tests:', error);
    }
  }

  private async loadUserAssignments(): Promise<void> {
    const sessionId = behaviorTracker.getSessionId();

    try {
      const { data: assignments, error } = await supabase
        .from('ab_test_assignments')
        .select('*')
        .eq('session_id', sessionId);

      if (error) throw error;

      const sessionAssignments = new Map<string, string>();
      assignments?.forEach(assignment => {
        sessionAssignments.set(assignment.test_id, assignment.variant_id);
      });

      this.userAssignments.set(sessionId, sessionAssignments);
    } catch (error) {
      console.error('Failed to load user assignments:', error);
    }
  }

  private setupEventListeners(): void {
    // Track conversions for active tests
    this.trackConversions();
  }

  // Test Management
  async createTest(config: Omit<ABTestConfig, 'id' | 'status'>): Promise<string> {
    try {
      const testId = this.generateTestId();

      const testConfig: ABTestConfig = {
        ...config,
        id: testId,
        status: 'draft',
      };

      // Validate test configuration
      this.validateTestConfig(testConfig);

      // Store in database
      const { error } = await supabase
        .from('ab_tests')
        .insert({
          id: testId,
          name: testConfig.name,
          description: testConfig.description,
          status: testConfig.status,
          start_date: testConfig.start_date,
          end_date: testConfig.end_date,
          target_audience: testConfig.target_audience,
          variants: testConfig.variants,
          success_metrics: testConfig.success_metrics,
          statistical_settings: testConfig.statistical_settings,
          created_at: new Date().toISOString(),
        });

      if (error) throw error;

      console.log(`Created A/B test: ${testConfig.name} (${testId})`);
      return testId;
    } catch (error) {
      console.error('Failed to create A/B test:', error);
      throw error;
    }
  }

  async startTest(testId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('ab_tests')
        .update({
          status: 'running',
          start_date: new Date().toISOString(),
        })
        .eq('id', testId);

      if (error) throw error;

      // Reload active tests
      await this.loadActiveTests();

      console.log(`Started A/B test: ${testId}`);
    } catch (error) {
      console.error('Failed to start A/B test:', error);
      throw error;
    }
  }

  async stopTest(testId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('ab_tests')
        .update({
          status: 'completed',
          end_date: new Date().toISOString(),
        })
        .eq('id', testId);

      if (error) throw error;

      // Remove from active tests
      this.activeTests.delete(testId);

      console.log(`Stopped A/B test: ${testId}`);
    } catch (error) {
      console.error('Failed to stop A/B test:', error);
      throw error;
    }
  }

  // User Assignment
  async assignUserToTest(testId: string): Promise<string | null> {
    const test = this.activeTests.get(testId);
    if (!test) return null;

    const sessionId = behaviorTracker.getSessionId();
    const sessionAssignments = this.userAssignments.get(sessionId) || new Map();

    // Check if already assigned
    if (sessionAssignments.has(testId)) {
      return sessionAssignments.get(testId)!;
    }

    // Check if user is in target audience
    if (!this.isUserInTargetAudience(test)) {
      return null;
    }

    // Assign variant based on traffic allocation
    const variantId = this.assignVariant(test);

    // Store assignment
    sessionAssignments.set(testId, variantId);
    this.userAssignments.set(sessionId, sessionAssignments);

    try {
      await supabase
        .from('ab_test_assignments')
        .insert({
          user_id: null, // Could be populated if user is logged in
          session_id: sessionId,
          test_id: testId,
          variant_id: variantId,
          assigned_at: new Date().toISOString(),
          has_converted: false,
          exposure_count: 1,
          last_seen_at: new Date().toISOString(),
        });

      // Track to GA4
      await ga4Analytics.trackCustomEvent({
        event_name: 'ab_test_assignment',
        parameters: {
          test_name: test.name,
          variant_name: test.variants.find(v => v.id === variantId)?.name,
          test_id: testId,
          variant_id: variantId,
          booking_step: 0,
          total_steps: 0,
          currency: 'PLN',
          user_session_id: sessionId,
          device_type: this.getDeviceType(),
          language: navigator.language,
        },
      });

      console.log(`Assigned user to variant ${variantId} for test ${testId}`);
      return variantId;
    } catch (error) {
      console.error('Failed to store test assignment:', error);
      return variantId;
    }
  }

  private isUserInTargetAudience(test: ABTestConfig): boolean {
    const criteria = test.target_audience.criteria;

    // Check device type
    if (criteria.device_types && criteria.device_types.length > 0) {
      const currentDevice = this.getDeviceType();
      if (!criteria.device_types.includes(currentDevice)) {
        return false;
      }
    }

    // Check service category (would need to be determined from current context)
    if (criteria.service_categories && criteria.service_categories.length > 0) {
      // This would need context from current page/session
      // For now, include all users
    }

    // Random percentage allocation
    const random = Math.random() * 100;
    return random <= test.target_audience.percentage;
  }

  private assignVariant(test: ABTestConfig): string {
    const random = Math.random() * 100;
    let cumulativePercentage = 0;

    for (const variant of test.variants) {
      cumulativePercentage += variant.traffic_allocation;
      if (random <= cumulativePercentage) {
        return variant.id;
      }
    }

    // Fallback to first variant
    return test.variants[0].id;
  }

  // Test Implementation
  async applyTestChanges(testId: string): Promise<void> {
    const test = this.activeTests.get(testId);
    if (!test) return;

    const variantId = await this.assignUserToTest(testId);
    if (!variantId) return;

    const variant = test.variants.find(v => v.id === variantId);
    if (!variant) return;

    // Apply variant changes
    await this.applyVariantChanges(variant.changes);

    // Track exposure
    await this.trackTestExposure(testId, variantId);
  }

  private async applyVariantChanges(changes: any): Promise<void> {
    // Apply CSS changes
    if (changes.css_classes) {
      this.applyCSSChanges(changes.css_classes);
    }

    // Apply content changes
    if (changes.content) {
      this.applyContentChanges(changes.content);
    }

    // Apply layout changes
    if (changes.layout) {
      this.applyLayoutChanges(changes.layout);
    }

    // Apply pricing changes
    if (changes.pricing) {
      this.applyPricingChanges(changes.pricing);
    }
  }

  private applyCSSChanges(cssClasses: string): void {
    // Add CSS classes to body or specific elements
    const styleElement = document.createElement('style');
    styleElement.textContent = cssClasses;
    document.head.appendChild(styleElement);
  }

  private applyContentChanges(content: Record<string, any>): void {
    // Update content based on selectors and new content
    Object.entries(content).forEach(([selector, newContent]) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        if (typeof newContent === 'string') {
          element.textContent = newContent;
        } else if (typeof newContent === 'object') {
          Object.assign(element, newContent);
        }
      });
    });
  }

  private applyLayoutChanges(layout: string): void {
    // Apply layout changes (this would be more complex in practice)
    console.log('Applying layout changes:', layout);
  }

  private applyPricingChanges(pricing: any): void {
    // Apply pricing changes (would need to integrate with pricing system)
    console.log('Applying pricing changes:', pricing);
  }

  // Conversion Tracking
  private trackConversions(): void {
    // Track booking completions
    const originalTrackBookingComplete = ga4Analytics.trackBookingComplete.bind(ga4Analytics);
    ga4Analytics.trackBookingComplete = async (booking) => {
      await originalTrackBookingComplete(booking);
      await this.trackConversionForTests('booking_complete', booking.price);
    };

    // Track other conversion events
    const originalTrackServiceInteraction = ga4Analytics.trackServiceInteraction.bind(ga4Analytics);
    ga4Analytics.trackServiceInteraction = async (interaction) => {
      await originalTrackServiceInteraction(interaction);
      if (interaction.interaction_type === 'add_favorites') {
        await this.trackConversionForTests('favorite_add', 0);
      }
    };
  }

  private async trackConversionForTests(conversionType: string, value: number): Promise<void> {
    const sessionId = behaviorTracker.getSessionId();
    const sessionAssignments = this.userAssignments.get(sessionId);

    if (!sessionAssignments) return;

    for (const [testId, variantId] of sessionAssignments) {
      try {
        await supabase
          .from('ab_test_assignments')
          .update({
            has_converted: true,
            conversion_value: (await supabase
              .from('ab_test_assignments')
              .select('conversion_value')
              .eq('session_id', sessionId)
              .eq('test_id', testId)
              .single()
            ).data?.conversion_value || 0) + value,
            last_seen_at: new Date().toISOString(),
          })
          .eq('session_id', sessionId)
          .eq('test_id', testId);

        // Track to GA4
        await ga4Analytics.trackCustomEvent({
          event_name: 'ab_test_conversion',
          parameters: {
            test_id: testId,
            variant_id: variantId,
            conversion_type: conversionType,
            conversion_value: value,
            booking_step: 0,
            total_steps: 0,
            currency: 'PLN',
            user_session_id: sessionId,
            device_type: this.getDeviceType(),
            language: navigator.language,
          },
        });
      } catch (error) {
        console.error('Failed to track conversion for test:', error);
      }
    }
  }

  private async trackTestExposure(testId: string, variantId: string): Promise<void> {
    const sessionId = behaviorTracker.getSessionId();

    try {
      await supabase
        .from('ab_test_assignments')
        .update({
          exposure_count: supabase.rpc('increment', { count: 1 }),
          last_seen_at: new Date().toISOString(),
        })
        .eq('session_id', sessionId)
        .eq('test_id', testId);
    } catch (error) {
      console.error('Failed to track test exposure:', error);
    }
  }

  // Analytics and Results
  async getTestResults(testId: string): Promise<ABTestResult[]> {
    try {
      const { data: assignments, error } = await supabase
        .from('ab_test_assignments')
        .select('*')
        .eq('test_id', testId);

      if (error) throw error;

      // Group by variant
      const variantData: Record<string, any[]> = {};
      assignments?.forEach(assignment => {
        if (!variantData[assignment.variant_id]) {
          variantData[assignment.variant_id] = [];
        }
        variantData[assignment.variant_id].push(assignment);
      });

      // Calculate results for each variant
      const results: ABTestResult[] = [];
      const controlConversionRate = this.calculateConversionRate(variantData['control'] || []);

      Object.entries(variantData).forEach(([variantId, variantAssignments]) => {
        const result: ABTestResult = {
          test_id: testId,
          variant_id: variantId,
          participants: variantAssignments.length,
          conversions: variantAssignments.filter(a => a.has_converted).length,
          conversion_rate: this.calculateConversionRate(variantAssignments),
          revenue: variantAssignments.reduce((sum, a) => sum + (a.conversion_value || 0), 0),
          revenue_per_visitor: this.calculateRevenuePerVisitor(variantAssignments),
          average_session_duration: this.calculateAverageSessionDuration(variantAssignments),
          confidence_level: 95,
          statistical_significance: false,
          confidence_interval: { lower: 0, upper: 0 },
        };

        // Calculate improvement vs control
        if (variantId !== 'control' && controlConversionRate > 0) {
          result.improvement_vs_control = {
            absolute: result.conversion_rate - controlConversionRate,
            relative: ((result.conversion_rate - controlConversionRate) / controlConversionRate) * 100,
          };
        }

        // Calculate statistical significance
        result.statistical_significance = this.calculateStatisticalSignificance(
          result,
          controlConversionRate,
          variantData['control'] || []
        );

        results.push(result);
      });

      return results.sort((a, b) => b.conversion_rate - a.conversion_rate);
    } catch (error) {
      console.error('Failed to get test results:', error);
      return [];
    }
  }

  private calculateConversionRate(assignments: any[]): number {
    if (assignments.length === 0) return 0;
    const conversions = assignments.filter(a => a.has_converted).length;
    return (conversions / assignments.length) * 100;
  }

  private calculateRevenuePerVisitor(assignments: any[]): number {
    if (assignments.length === 0) return 0;
    const totalRevenue = assignments.reduce((sum, a) => sum + (a.conversion_value || 0), 0);
    return totalRevenue / assignments.length;
  }

  private calculateAverageSessionDuration(assignments: any[]): number {
    // This would need session duration data
    return 0; // Placeholder
  }

  private calculateStatisticalSignificance(
    result: ABTestResult,
    controlRate: number,
    controlAssignments: any[]
  ): boolean {
    // Simplified statistical significance calculation
    // In practice, this would use proper statistical tests like Z-test or Chi-square
    const controlSize = controlAssignments.length;
    const variantSize = result.participants;

    if (controlSize < 30 || variantSize < 30) return false;

    // Basic significance check (simplified)
    const pooledRate = ((controlSize * controlRate) + (variantSize * result.conversion_rate)) / (controlSize + variantSize);
    const standardError = Math.sqrt(
      (pooledRate * (100 - pooledRate)) * ((1 / controlSize) + (1 / variantSize))
    );
    const zScore = Math.abs(result.conversion_rate - controlRate) / standardError;

    // Z-score > 1.96 for 95% confidence
    return zScore > 1.96;
  }

  // Predefined Tests
  async createCommonTests(): Promise<void> {
    // Test 1: Pricing Display
    await this.createTest({
      name: 'Pricing Display Test',
      description: 'Test different ways of displaying pricing to improve conversion',
      target_audience: {
        percentage: 50,
        criteria: {
          device_types: ['mobile', 'desktop'],
          new_vs_returning: 'all',
        },
      },
      variants: [
        {
          id: 'control',
          name: 'Current Pricing Display',
          description: 'Standard pricing display',
          traffic_allocation: 50,
          changes: {},
        },
        {
          id: 'variant1',
          name: 'Highlighted Savings',
          description: 'Emphasize savings and value',
          traffic_allocation: 50,
          changes: {
            css_classes: '.price-display { background: #f0f9ff; border: 2px solid #3b82f6; padding: 1rem; border-radius: 8px; }',
            content: {
              '.price-label': 'Save 15% Today!',
              '.original-price': 'text-decoration: line-through; opacity: 0.7;',
            },
          },
        },
      ],
      success_metrics: [
        {
          name: 'booking_completion',
          type: 'booking_completion',
          weight: 0.7,
          target_improvement: 10,
        },
        {
          name: 'revenue_per_visitor',
          type: 'revenue_per_visitor',
          weight: 0.3,
          target_improvement: 5,
        },
      ],
      statistical_settings: {
        confidence_level: 95,
        minimum_sample_size: 1000,
        test_duration_days: 14,
      },
    });

    // Test 2: Booking Flow Layout
    await this.createTest({
      name: 'Booking Flow Layout Test',
      description: 'Test single-page vs multi-page booking flow',
      target_audience: {
        percentage: 30,
        criteria: {
          device_types: ['mobile'],
          new_vs_returning: 'new',
        },
      },
      variants: [
        {
          id: 'control',
          name: 'Multi-step Booking',
          description: 'Current 4-step booking process',
          traffic_allocation: 50,
          changes: {},
        },
        {
          id: 'variant1',
          name: 'Single-page Booking',
          description: 'All booking steps on one page',
          traffic_allocation: 50,
          changes: {
            layout: 'single-page-booking',
          },
        },
      ],
      success_metrics: [
        {
          name: 'booking_completion',
          type: 'booking_completion',
          weight: 0.8,
          target_improvement: 15,
        },
        {
          name: 'time_on_page',
          type: 'time_on_page',
          weight: 0.2,
          target_improvement: -20, // Want to reduce time
        },
      ],
      statistical_settings: {
        confidence_level: 95,
        minimum_sample_size: 500,
        test_duration_days: 7,
      },
    });

    // Test 3: Service Card Design
    await this.createTest({
      name: 'Service Card Design Test',
      description: 'Test different service card layouts to improve engagement',
      target_audience: {
        percentage: 100,
        criteria: {
          device_types: ['mobile', 'desktop', 'tablet'],
          new_vs_returning: 'all',
        },
      },
      variants: [
        {
          id: 'control',
          name: 'Current Card Design',
          description: 'Standard service card layout',
          traffic_allocation: 33,
          changes: {},
        },
        {
          id: 'variant1',
          name: 'Image-focused Cards',
          description: 'Larger images, minimal text',
          traffic_allocation: 33,
          changes: {
            css_classes: '.service-card { aspect-ratio: 16/9; } .service-card img { height: 200px; object-fit: cover; }',
          },
        },
        {
          id: 'variant2',
          name: 'Information-rich Cards',
          description: 'More details, reviews, and pricing',
          traffic_allocation: 34,
          changes: {
            css_classes: '.service-card { padding: 1.5rem; }',
            content: {
              '.service-description': 'font-size: 0.9rem; color: #666;',
              '.service-price': 'font-weight: bold; color: #2563eb;',
            },
          },
        },
      ],
      success_metrics: [
        {
          name: 'click_through_rate',
          type: 'click_through_rate',
          weight: 0.6,
          target_improvement: 20,
        },
        {
          name: 'booking_completion',
          type: 'booking_completion',
          weight: 0.4,
          target_improvement: 10,
        },
      ],
      statistical_settings: {
        confidence_level: 95,
        minimum_sample_size: 2000,
        test_duration_days: 21,
      },
    });
  }

  // Helper Methods
  private generateTestId(): string {
    return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private validateTestConfig(config: ABTestConfig): void {
    // Validate traffic allocation sums to 100
    const totalAllocation = config.variants.reduce((sum, variant) => sum + variant.traffic_allocation, 0);
    if (Math.abs(totalAllocation - 100) > 0.1) {
      throw new Error('Variant traffic allocations must sum to 100%');
    }

    // Validate at least 2 variants
    if (config.variants.length < 2) {
      throw new Error('Test must have at least 2 variants');
    }

    // Validate success metrics
    if (config.success_metrics.length === 0) {
      throw new Error('Test must have at least one success metric');
    }

    // Validate statistical settings
    if (config.statistical_settings.minimum_sample_size < 100) {
      throw new Error('Minimum sample size must be at least 100');
    }
  }

  private getDeviceType(): string {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  // Public API Methods
  async getActiveTests(): Promise<ABTestConfig[]> {
    return Array.from(this.activeTests.values());
  }

  async getUserAssignments(): Promise<Map<string, string>> {
    const sessionId = behaviorTracker.getSessionId();
    return this.userAssignments.get(sessionId) || new Map();
  }

  isUserInTest(testId: string): boolean {
    const sessionId = behaviorTracker.getSessionId();
    const sessionAssignments = this.userAssignments.get(sessionId);
    return sessionAssignments?.has(testId) || false;
  }

  getUserVariant(testId: string): string | null {
    const sessionId = behaviorTracker.getSessionId();
    const sessionAssignments = this.userAssignments.get(sessionId);
    return sessionAssignments?.get(testId) || null;
  }

  async forceVariant(testId: string, variantId: string): Promise<void> {
    const sessionId = behaviorTracker.getSessionId();
    const sessionAssignments = this.userAssignments.get(sessionId) || new Map();
    sessionAssignments.set(testId, variantId);
    this.userAssignments.set(sessionId, sessionAssignments);

    // Store in database
    try {
      await supabase
        .from('ab_test_assignments')
        .upsert({
          user_id: null,
          session_id: sessionId,
          test_id: testId,
          variant_id: variantId,
          assigned_at: new Date().toISOString(),
          has_converted: false,
          exposure_count: 1,
          last_seen_at: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Failed to force variant assignment:', error);
    }
  }
}

// Export singleton instance
export const abTestingFramework = ABTestingFramework.getInstance();

// React Hook for easy integration
export const useABTesting = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      await abTestingFramework.initialize();
      setIsReady(true);
    };
    initialize();
  }, []);

  const runTest = async (testId: string): Promise<string | null> => {
    if (!isReady) return null;
    return await abTestingFramework.assignUserToTest(testId);
  };

  const getVariant = (testId: string): string | null => {
    if (!isReady) return null;
    return abTestingFramework.getUserVariant(testId);
  };

  const isInTest = (testId: string): boolean => {
    if (!isReady) return false;
    return abTestingFramework.isUserInTest(testId);
  };

  return {
    isReady,
    runTest,
    getVariant,
    isInTest,
  };
};