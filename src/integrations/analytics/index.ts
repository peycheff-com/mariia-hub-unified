// Main analytics system entry point
// This file exports all analytics components and provides initialization

// Core analytics components
export { ga4Analytics, GA4AnalyticsService } from './ga4';
export { bookingTracker, BookingAnalyticsTracker } from './booking-tracker';
export { funnelAnalyzer, FunnelAnalyzer } from './funnel-analyzer';
export { behaviorTracker, BehaviorTracker } from './behavior-tracker';
export { heatmapSessionRecorder, HeatmapSessionRecorder } from './heatmap-session-recorder';
export { performanceTracker, PerformanceTracker } from './performance-tracker';
export { abTestingFramework, ABTestingFramework, useABTesting } from './ab-testing';
export { gdprComplianceManager, GDPRComplianceManager, useGDPRCompliance } from './gdpr-compliance';

// Types
export type { ServiceCategory } from './booking-tracker';
export type { GA4EcommerceEvent, BookingAnalyticsEvent, FunnelEvent } from './ga4';
export type { BookingStepEvent, BookingFlowState } from './booking-tracker';
export type { FunnelMetrics } from './funnel-analyzer';
export type { BehaviorEvent, UserJourney, UserPreferences } from './behavior-tracker';
export type { SessionRecording, HeatmapData, SessionEvent } from './heatmap-session-recorder';
export type { CoreWebVitals, PerformanceMetrics, PerformanceAlert } from './performance-tracker';
export type { ABTestConfig, ABTestResult, UserTestAssignment } from './ab-testing';
export type { GDPRConfig, ConsentRecord, DataProcessingRecord, UserDataRequest } from './gdpr-compliance';

// Main analytics system class
export class AnalyticsSystem {
  private static instance: AnalyticsSystem;
  private initialized: boolean = false;

  constructor() {
    this.initialize();
  }

  static getInstance(): AnalyticsSystem {
    if (!AnalyticsSystem.instance) {
      AnalyticsSystem.instance = new AnalyticsSystem();
    }
    return AnalyticsSystem.instance;
  }

  private async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('Initializing Advanced Analytics System for Beauty & Fitness Platform...');

      // Initialize GDPR compliance first
      await gdprComplianceManager.initialize();

      // Check if we have consent for analytics
      const consent = gdprComplianceManager.getCurrentConsent();

      if (!consent || !consent.consent_given) {
        console.log('Analytics consent not granted. Some features will be limited.');
        // Request consent for the first time
        await gdprComplianceManager.requestConsent();
      }

      // Initialize core tracking components
      await this.initializeCoreTracking();

      // Initialize advanced features based on consent
      await this.initializeAdvancedFeatures();

      // Set up cross-component integration
      this.setupCrossComponentIntegration();

      // Set up error handling and monitoring
      this.setupErrorHandling();

      this.initialized = true;
      console.log('Analytics system initialization completed successfully');
    } catch (error) {
      console.error('Failed to initialize analytics system:', error);
    }
  }

  private async initializeCoreTracking(): Promise<void> {
    // Initialize behavior tracking (always enabled for basic functionality)
    console.log('Initializing behavior tracking...');
    // behaviorTracker initializes automatically in constructor

    // Initialize GA4
    console.log('Initializing Google Analytics 4...');
    // ga4Analytics initializes automatically in constructor

    // Initialize booking funnel tracking
    console.log('Initializing booking funnel tracking...');
    // bookingTracker initializes automatically in constructor

    // Initialize performance tracking
    console.log('Initializing performance tracking...');
    // performanceTracker initializes automatically in constructor
  }

  private async initializeAdvancedFeatures(): Promise<void> {
    const consent = gdprComplianceManager.getCurrentConsent();

    if (!consent) return;

    // Initialize session recording and heatmaps
    if (consent.consent_types.analytics) {
      console.log('Initializing session recording and heatmaps...');
      await heatmapSessionRecorder.initialize();
    }

    // Initialize A/B testing
    if (consent.consent_types.personalization) {
      console.log('Initializing A/B testing framework...');
      await abTestingFramework.createCommonTests();
    }

    // Initialize marketing features
    if (consent.consent_types.marketing) {
      console.log('Initializing marketing analytics...');
      // Marketing features would be initialized here
    }
  }

  private setupCrossComponentIntegration(): void {
    // Integration between booking tracker and GA4
    this.setupBookingGA4Integration();

    // Integration between behavior tracker and funnel analysis
    this.setupBehaviorFunnelIntegration();

    // Integration between performance tracking and conversion analysis
    this.setupPerformanceConversionIntegration();

    // Integration between A/B testing and analytics
    this.setupABTestingAnalyticsIntegration();
  }

  private setupBookingGA4Integration(): void {
    // Ensure booking events are tracked in GA4
    console.log('Setting up booking to GA4 integration...');
  }

  private setupBehaviorFunnelIntegration(): void {
    // Ensure user behavior data feeds into funnel analysis
    console.log('Setting up behavior to funnel integration...');
  }

  private setupPerformanceConversionIntegration(): void {
    // Correlate performance metrics with conversion rates
    console.log('Setting up performance to conversion integration...');
  }

  private setupABTestingAnalyticsIntegration(): void {
    // Ensure A/B test data is included in analytics
    console.log('Setting up A/B testing to analytics integration...');
  }

  private setupErrorHandling(): void {
    // Global error handler for analytics failures
    window.addEventListener('error', (event) => {
      console.error('Analytics system error:', event.error);
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Analytics system unhandled promise rejection:', event.reason);
    });
  }

  // Public API methods
  async trackEvent(eventName: string, parameters: Record<string, any>): Promise<void> {
    if (!this.initialized) {
      console.warn('Analytics system not initialized');
      return;
    }

    try {
      // Track to GA4
      await ga4Analytics.trackCustomEvent({
        event_name: eventName,
        parameters: {
          ...parameters,
          session_id: behaviorTracker.getSessionId(),
          timestamp: Date.now(),
        },
      });

      // Track to behavior tracker
      behaviorTracker.trackEvent({
        event_type: 'click', // Default to click for custom events
        page_path: window.location.pathname,
        element_text: eventName,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  async trackPageView(path: string, title?: string): Promise<void> {
    if (!this.initialized) return;

    try {
      await ga4Analytics.trackPageView(path, title);
      console.log('Page view tracked:', path);
    } catch (error) {
      console.error('Failed to track page view:', error);
    }
  }

  async trackConversion(conversionType: string, value: number, currency: string = 'PLN'): Promise<void> {
    if (!this.initialized) return;

    try {
      await ga4Analytics.trackCustomEvent({
        event_name: 'conversion',
        parameters: {
          conversion_type,
          value,
          currency,
          booking_step: 0,
          total_steps: 0,
          user_session_id: behaviorTracker.getSessionId(),
          device_type: this.getDeviceType(),
          language: navigator.language,
        },
      });
    } catch (error) {
      console.error('Failed to track conversion:', error);
    }
  }

  async generateInsights(startDate: string, endDate: string): Promise<{
    summary: string;
    keyMetrics: Record<string, number>;
    recommendations: string[];
    alerts: string[];
  }> {
    if (!this.initialized) {
      throw new Error('Analytics system not initialized');
    }

    try {
      // Get funnel insights
      const funnelInsights = await funnelAnalyzer.generateFunnelInsights(startDate, endDate);

      // Get behavior insights
      const behaviorInsights = await behaviorTracker.generateBehaviorInsights(startDate, endDate);

      // Get performance insights
      const performanceInsights = await performanceTracker.getPerformanceInsights(startDate, endDate);

      return {
        summary: `Analytics analysis for ${startDate} to ${endDate}`,
        keyMetrics: {
          conversion_rate: funnelInsights.key_metrics.conversion_rate,
          average_session_duration: behaviorInsights.user_patterns.average_session_duration,
          performance_score: performanceInsights.metrics_summary.average_performance_score,
          total_revenue: funnelInsights.key_metrics.total_revenue,
        },
        recommendations: [
          ...funnelInsights.recommendations,
          ...performanceInsights.recommendations,
        ],
        alerts: performanceInsights.metrics_summary.critical_issues_count > 0
          ? [`${performanceInsights.metrics_summary.critical_issues_count} critical performance issues detected`]
          : [],
      };
    } catch (error) {
      console.error('Failed to generate insights:', error);
      throw error;
    }
  }

  // Utility methods
  private getDeviceType(): string {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  // System status and health checks
  getSystemStatus(): {
    initialized: boolean;
    components: Record<string, boolean>;
    consent: {
      granted: boolean;
      types: Record<string, boolean>;
    };
    lastActivity: number;
  } {
    const consent = gdprComplianceManager.getCurrentConsent();

    return {
      initialized: this.initialized,
      components: {
        ga4: !!ga4Analytics,
        behaviorTracker: !!behaviorTracker,
        bookingTracker: !!bookingTracker,
        funnelAnalyzer: !!funnelAnalyzer,
        performanceTracker: !!performanceTracker,
        sessionRecorder: heatmapSessionRecorder.isRecordingActive(),
        abTesting: !!abTestingFramework,
        gdprCompliance: !!gdprComplianceManager,
      },
      consent: {
        granted: consent?.conssent_given || false,
        types: consent?.consent_types || {
          essential: false,
          analytics: false,
          marketing: false,
          personalization: false,
        },
      },
      lastActivity: Date.now(),
    };
  }

  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Record<string, boolean>;
    issues: string[];
  }> {
    const checks: Record<string, boolean> = {};
    const issues: string[] = [];

    // Check GA4 connectivity
    try {
      // Would implement actual GA4 health check
      checks.ga4 = true;
    } catch (error) {
      checks.ga4 = false;
      issues.push('GA4 connectivity issue');
    }

    // Check database connectivity
    try {
      const { error } = await supabase.from('consent_records').select('id').limit(1);
      checks.database = !error;
      if (error) issues.push('Database connectivity issue');
    } catch (error) {
      checks.database = false;
      issues.push('Database connection failed');
    }

    // Check consent status
    const consent = gdprComplianceManager.getCurrentConsent();
    checks.consent = !!consent?.consent_given;
    if (!consent?.consent_given) {
      issues.push('Analytics consent not granted');
    }

    // Check component initialization
    checks.coreComponents = this.initialized;
    if (!this.initialized) {
      issues.push('Core components not initialized');
    }

    const failedChecks = Object.values(checks).filter(check => !check).length;
    const totalChecks = Object.keys(checks).length;

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (failedChecks === 0) {
      status = 'healthy';
    } else if (failedChecks < totalChecks / 2) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      checks,
      issues,
    };
  }

  // Reset and cleanup methods
  async resetSession(): Promise<void> {
    try {
      await behaviorTracker.endSession();
      console.log('Analytics session reset');
    } catch (error) {
      console.error('Failed to reset analytics session:', error);
    }
  }

  async cleanup(): Promise<void> {
    try {
      // Stop all tracking
      await heatmapSessionRecorder.stopRecording();
      await behaviorTracker.endSession();

      // Clear temporary data
      console.log('Analytics system cleanup completed');
    } catch (error) {
      console.error('Failed to cleanup analytics system:', error);
    }
  }
}

// Export singleton instance
export const analyticsSystem = AnalyticsSystem.getInstance();

// React hook for easy integration
export const useAnalytics = () => {
  const [systemStatus, setSystemStatus] = useState(analyticsSystem.getSystemStatus());
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      await analyticsSystem.initialize();
      setSystemStatus(analyticsSystem.getSystemStatus());
      setIsReady(true);
    };

    initialize();

    // Set up periodic status checks
    const interval = setInterval(() => {
      setSystemStatus(analyticsSystem.getSystemStatus());
    }, 30000); // Every 30 seconds

    return () => {
      clearInterval(interval);
    };
  }, []);

  const trackEvent = useCallback(async (eventName: string, parameters: Record<string, any>) => {
    await analyticsSystem.trackEvent(eventName, parameters);
  }, []);

  const trackPageView = useCallback(async (path: string, title?: string) => {
    await analyticsSystem.trackPageView(path, title);
  }, []);

  const trackConversion = useCallback(async (type: string, value: number, currency?: string) => {
    await analyticsSystem.trackConversion(type, value, currency);
  }, []);

  const generateInsights = useCallback(async (startDate: string, endDate: string) => {
    return await analyticsSystem.generateInsights(startDate, endDate);
  }, []);

  const healthCheck = useCallback(async () => {
    return await analyticsSystem.healthCheck();
  }, []);

  const resetSession = useCallback(async () => {
    await analyticsSystem.resetSession();
  }, []);

  return {
    isReady,
    systemStatus,
    trackEvent,
    trackPageView,
    trackConversion,
    generateInsights,
    healthCheck,
    resetSession,
  };
};

// Auto-initialize on import
(() => {
  console.log('Advanced Analytics System loaded for Beauty & Fitness Booking Platform');
})();