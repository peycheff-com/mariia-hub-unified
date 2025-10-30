/**
 * Unified Monitoring System Integration
 * Main entry point for all UX monitoring and analytics functionality
 */

// Import all monitoring modules
import { initializeRUM, getRUMMetrics, trackRUMEvent } from './rum';
import { initializeCoreWebVitals, getCoreWebVitalsSummary } from './core-web-vitals';
import { initializeUserJourneyAnalytics, getJourneyAnalytics, trackJourneyEvent } from './user-journey-analytics';
import { initializeErrorTracking, reportCustomError, collectUserFeedback } from './error-tracking-feedback';
import { initializeAccessibilityMonitoring, getAccessibilityAnalytics } from './accessibility-monitoring';
import { initializeMobileExperienceTracking, getMobileExperienceAnalytics } from './mobile-experience-tracking';
import { initializePagePerformanceMonitoring, getPerformanceSummary } from './page-performance-monitoring';
import { initializeUserSatisfactionAnalytics, triggerSatisfactionSurvey } from './user-satisfaction-analytics';
import { initializeGDPRCompliance, hasGDPRConsent, getGDPRComplianceStatus } from './gdpr-compliance-manager';
import { showUXMonitoringDashboard, toggleUXMonitoringDashboard } from './ux-monitoring-dashboard';

// Export all types and interfaces
export * from './rum';
export * from './core-web-vitals';
export * from './user-journey-analytics';
export * from './error-tracking-feedback';
export * from './accessibility-monitoring';
export * from './mobile-experience-tracking';
export * from './page-performance-monitoring';
export * from './user-satisfaction-analytics';
export * from './gdpr-compliance-manager';
export * from './ux-monitoring-dashboard';

// Unified Monitoring System Configuration
export interface MonitoringConfig {
  enableRUM: boolean;
  enableCoreWebVitals: boolean;
  enableUserJourney: boolean;
  enableErrorTracking: boolean;
  enableAccessibility: boolean;
  enableMobileTracking: boolean;
  enablePerformanceMonitoring: boolean;
  enableSatisfactionTracking: boolean;
  enableGDPRCompliance: boolean;
  enableDashboard: boolean;
  environment: 'development' | 'staging' | 'production';
  samplingRate: number;
  debug: boolean;
}

// Default configuration
const DEFAULT_CONFIG: MonitoringConfig = {
  enableRUM: true,
  enableCoreWebVitals: true,
  enableUserJourney: true,
  enableErrorTracking: true,
  enableAccessibility: true,
  enableMobileTracking: true,
  enablePerformanceMonitoring: true,
  enableSatisfactionTracking: true,
  enableGDPRCompliance: true,
  enableDashboard: true,
  environment: (import.meta.env.MODE as any) || 'development',
  samplingRate: import.meta.env.PROD ? 0.1 : 1.0,
  debug: import.meta.env.DEV
};

// Unified Monitoring System Class
export class UnifiedMonitoringSystem {
  private config: MonitoringConfig;
  private isInitialized = false;

  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // Initialize all monitoring systems
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      if (this.config.debug) {
        console.log('[Monitoring] Already initialized');
      }
      return;
    }

    try {
      const startTime = performance.now();

      // Initialize in dependency order
      if (this.config.enableGDPRCompliance) {
        await this.initializeGDPR();
      }

      if (this.config.enableRUM) {
        await this.initializeRUM();
      }

      if (this.config.enableCoreWebVitals) {
        await this.initializeCoreWebVitals();
      }

      if (this.config.enableUserJourney) {
        await this.initializeUserJourney();
      }

      if (this.config.enableErrorTracking) {
        await this.initializeErrorTracking();
      }

      if (this.config.enableAccessibility) {
        await this.initializeAccessibility();
      }

      if (this.config.enableMobileTracking) {
        await this.initializeMobileTracking();
      }

      if (this.config.enablePerformanceMonitoring) {
        await this.initializePerformanceMonitoring();
      }

      if (this.config.enableSatisfactionTracking) {
        await this.initializeSatisfactionTracking();
      }

      if (this.config.enableDashboard) {
        await this.initializeDashboard();
      }

      this.isInitialized = true;
      const initTime = performance.now() - startTime;

      if (this.config.debug) {
        console.log(`[Monitoring] All systems initialized in ${initTime.toFixed(2)}ms`);
      }

      // Track initialization completion
      this.trackEvent('monitoring-initialized', {
        initTime: initTime,
        environment: this.config.environment,
        systemsEnabled: this.getEnabledSystems()
      });

    } catch (error) {
      console.error('[Monitoring] Failed to initialize:', error);
      this.trackError('Monitoring initialization failed', error as Error);
    }
  }

  // Initialize GDPR compliance
  private async initializeGDPR(): Promise<void> {
    try {
      initializeGDPRCompliance();
      if (this.config.debug) {
        console.log('[Monitoring] GDPR compliance initialized');
      }
    } catch (error) {
      console.error('[Monitoring] Failed to initialize GDPR compliance:', error);
      throw error;
    }
  }

  // Initialize RUM
  private async initializeRUM(): Promise<void> {
    try {
      initializeRUM();
      if (this.config.debug) {
        console.log('[Monitoring] RUM initialized');
      }
    } catch (error) {
      console.error('[Monitoring] Failed to initialize RUM:', error);
      throw error;
    }
  }

  // Initialize Core Web Vitals
  private async initializeCoreWebVitals(): Promise<void> {
    try {
      initializeCoreWebVitals();
      if (this.config.debug) {
        console.log('[Monitoring] Core Web Vitals initialized');
      }
    } catch (error) {
      console.error('[Monitoring] Failed to initialize Core Web Vitals:', error);
      throw error;
    }
  }

  // Initialize User Journey Analytics
  private async initializeUserJourney(): Promise<void> {
    try {
      initializeUserJourneyAnalytics();
      if (this.config.debug) {
        console.log('[Monitoring] User Journey Analytics initialized');
      }
    } catch (error) {
      console.error('[Monitoring] Failed to initialize User Journey Analytics:', error);
      throw error;
    }
  }

  // Initialize Error Tracking
  private async initializeErrorTracking(): Promise<void> {
    try {
      initializeErrorTracking();
      if (this.config.debug) {
        console.log('[Monitoring] Error Tracking initialized');
      }
    } catch (error) {
      console.error('[Monitoring] Failed to initialize Error Tracking:', error);
      throw error;
    }
  }

  // Initialize Accessibility Monitoring
  private async initializeAccessibility(): Promise<void> {
    try {
      initializeAccessibilityMonitoring();
      if (this.config.debug) {
        console.log('[Monitoring] Accessibility Monitoring initialized');
      }
    } catch (error) {
      console.error('[Monitoring] Failed to initialize Accessibility Monitoring:', error);
      throw error;
    }
  }

  // Initialize Mobile Experience Tracking
  private async initializeMobileTracking(): Promise<void> {
    try {
      initializeMobileExperienceTracking();
      if (this.config.debug) {
        console.log('[Monitoring] Mobile Experience Tracking initialized');
      }
    } catch (error) {
      console.error('[Monitoring] Failed to initialize Mobile Experience Tracking:', error);
      throw error;
    }
  }

  // Initialize Performance Monitoring
  private async initializePerformanceMonitoring(): Promise<void> {
    try {
      initializePagePerformanceMonitoring();
      if (this.config.debug) {
        console.log('[Monitoring] Performance Monitoring initialized');
      }
    } catch (error) {
      console.error('[Monitoring] Failed to initialize Performance Monitoring:', error);
      throw error;
    }
  }

  // Initialize User Satisfaction Tracking
  private async initializeSatisfactionTracking(): Promise<void> {
    try {
      initializeUserSatisfactionAnalytics();
      if (this.config.debug) {
        console.log('[Monitoring] User Satisfaction Tracking initialized');
      }
    } catch (error) {
      console.error('[Monitoring] Failed to initialize User Satisfaction Tracking:', error);
      throw error;
    }
  }

  // Initialize Dashboard
  private async initializeDashboard(): Promise<void> {
    try {
      // Dashboard is available but not auto-initialized
      if (this.config.debug) {
        console.log('[Monitoring] Dashboard available (call showDashboard() to display)');
      }
    } catch (error) {
      console.error('[Monitoring] Failed to initialize Dashboard:', error);
      throw error;
    }
  }

  // Get enabled systems
  private getEnabledSystems(): string[] {
    const systems = [];
    if (this.config.enableRUM) systems.push('RUM');
    if (this.config.enableCoreWebVitals) systems.push('CoreWebVitals');
    if (this.config.enableUserJourney) systems.push('UserJourney');
    if (this.config.enableErrorTracking) systems.push('ErrorTracking');
    if (this.config.enableAccessibility) systems.push('Accessibility');
    if (this.config.enableMobileTracking) systems.push('MobileTracking');
    if (this.config.enablePerformanceMonitoring) systems.push('PerformanceMonitoring');
    if (this.config.enableSatisfactionTracking) systems.push('SatisfactionTracking');
    if (this.config.enableGDPRCompliance) systems.push('GDPRCompliance');
    if (this.config.enableDashboard) systems.push('Dashboard');
    return systems;
  }

  // Public API methods

  // Track custom event
  trackEvent(eventName: string, data?: any): void {
    if (!this.isInitialized) return;

    try {
      trackRUMEvent(eventName, data);
    } catch (error) {
      console.error('[Monitoring] Failed to track event:', error);
    }
  }

  // Track custom error
  trackError(message: string, error?: Error, context?: any): void {
    if (!this.isInitialized) return;

    try {
      reportCustomError(message, error || new Error(message), context);
    } catch (err) {
      console.error('[Monitoring] Failed to track error:', err);
    }
  }

  // Track user journey event
  trackJourney(eventName: string, data?: any): void {
    if (!this.isInitialized) return;

    try {
      trackJourneyEvent(eventName, data);
    } catch (error) {
      console.error('[Monitoring] Failed to track journey event:', error);
    }
  }

  // Trigger satisfaction survey
  triggerSurvey(type?: string, context?: any): void {
    if (!this.isInitialized) return;

    try {
      // Convert string type to enum if needed
      const surveyType = type as any;
      triggerSatisfactionSurvey(surveyType, context);
    } catch (error) {
      console.error('[Monitoring] Failed to trigger survey:', error);
    }
  }

  // Collect user feedback
  collectFeedback(feedback: string, rating?: number): void {
    if (!this.isInitialized) return;

    try {
      collectUserFeedback(feedback, rating);
    } catch (error) {
      console.error('[Monitoring] Failed to collect feedback:', error);
    }
  }

  // Get comprehensive analytics
  getAnalytics(): any {
    if (!this.isInitialized) return null;

    try {
      return {
        timestamp: Date.now(),
        environment: this.config.environment,
        rum: getRUMMetrics(),
        coreWebVitals: getCoreWebVitalsSummary(),
        userJourney: getJourneyAnalytics(),
        performance: getPerformanceSummary(),
        accessibility: getAccessibilityAnalytics(),
        mobile: getMobileExperienceAnalytics(),
        satisfaction: getSatisfactionAnalytics(),
        gdpr: getGDPRComplianceStatus()
      };
    } catch (error) {
      console.error('[Monitoring] Failed to get analytics:', error);
      return null;
    }
  }

  // Get health status
  getHealthStatus(): any {
    if (!this.isInitialized) {
      return { status: 'not_initialized', systems: [] };
    }

    try {
      const analytics = this.getAnalytics();
      const health = {
        status: 'healthy',
        systems: this.getEnabledSystems(),
        overallScore: 0,
        issues: [],
        recommendations: []
      };

      // Calculate overall health score
      if (analytics) {
        let totalScore = 0;
        let scoreCount = 0;

        // Performance score
        if (analytics.performance?.overallScore) {
          totalScore += analytics.performance.overallScore;
          scoreCount++;
          if (analytics.performance.overallScore < 70) {
            health.issues.push('Low performance score detected');
            health.recommendations.push('Optimize performance to improve user experience');
          }
        }

        // Accessibility score
        if (analytics.accessibility?.wcagComplianceScore) {
          totalScore += analytics.accessibility.wcagComplianceScore;
          scoreCount++;
          if (analytics.accessibility.wcagComplianceScore < 80) {
            health.issues.push('Accessibility issues detected');
            health.recommendations.push('Address accessibility issues for inclusive design');
          }
        }

        // Mobile score
        if (analytics.mobile?.overallScore) {
          totalScore += analytics.mobile.overallScore;
          scoreCount++;
          if (analytics.mobile.overallScore < 70) {
            health.issues.push('Mobile experience issues detected');
            health.recommendations.push('Improve mobile experience for better user satisfaction');
          }
        }

        // Calculate overall score
        health.overallScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;

        // Determine health status
        if (health.overallScore >= 85) {
          health.status = 'excellent';
        } else if (health.overallScore >= 70) {
          health.status = 'good';
        } else if (health.overallScore >= 50) {
          health.status = 'warning';
        } else {
          health.status = 'critical';
        }
      }

      return health;
    } catch (error) {
      console.error('[Monitoring] Failed to get health status:', error);
      return { status: 'error', error: error.message };
    }
  }

  // Show monitoring dashboard
  showDashboard(): void {
    if (!this.isInitialized) return;

    try {
      showUXMonitoringDashboard();
    } catch (error) {
      console.error('[Monitoring] Failed to show dashboard:', error);
    }
  }

  // Toggle monitoring dashboard
  toggleDashboard(): void {
    if (!this.isInitialized) return;

    try {
      toggleUXMonitoringDashboard();
    } catch (error) {
      console.error('[Monitoring] Failed to toggle dashboard:', error);
    }
  }

  // Update configuration
  updateConfig(newConfig: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (this.config.debug) {
      console.log('[Monitoring] Configuration updated:', newConfig);
    }

    // Reinitialize if needed
    if (this.isInitialized) {
      // Systems that might need reconfiguration
      if (newConfig.enableGDPRCompliance !== undefined) {
        initializeGDPRCompliance();
      }
    }
  }

  // Get current configuration
  getConfig(): MonitoringConfig {
    return { ...this.config };
  }

  // Check if monitoring is initialized
  isReady(): boolean {
    return this.isInitialized;
  }

  // Get privacy consent status
  hasConsent(type?: string): boolean {
    if (!this.config.enableGDPRCompliance) return true;

    try {
      if (type) {
        return hasGDPRConsent(type as any);
      }
      return getGDPRComplianceStatus().hasConsent || false;
    } catch (error) {
      console.error('[Monitoring] Failed to check consent:', error);
      return false;
    }
  }

  // Export monitoring data
  exportData(): any {
    if (!this.isInitialized) return null;

    try {
      return {
        config: this.config,
        analytics: this.getAnalytics(),
        health: this.getHealthStatus(),
        exportedAt: Date.now()
      };
    } catch (error) {
      console.error('[Monitoring] Failed to export data:', error);
      return null;
    }
  }

  // Disconnect monitoring
  disconnect(): void {
    if (!this.isInitialized) return;

    try {
      // Clean up all monitoring systems
      // This would be implemented by each monitoring module
      this.isInitialized = false;

      if (this.config.debug) {
        console.log('[Monitoring] All systems disconnected');
      }
    } catch (error) {
      console.error('[Monitoring] Failed to disconnect:', error);
    }
  }
}

// Create and export singleton instance
export const monitoringSystem = new UnifiedMonitoringSystem();

// Auto-initialize in production
if (import.meta.env.PROD) {
  monitoringSystem.initialize().catch(error => {
    console.error('[Monitoring] Auto-initialization failed:', error);
  });
}

// Export convenient functions for direct use
export const initializeMonitoring = (config?: Partial<MonitoringConfig>) =>
  monitoringSystem.initialize();

export const trackEvent = (eventName: string, data?: any) =>
  monitoringSystem.trackEvent(eventName, data);

export const trackError = (message: string, error?: Error, context?: any) =>
  monitoringSystem.trackError(message, error, context);

export const trackJourney = (eventName: string, data?: any) =>
  monitoringSystem.trackJourney(eventName, data);

export const triggerSurvey = (type?: string, context?: any) =>
  monitoringSystem.triggerSurvey(type, context);

export const collectFeedback = (feedback: string, rating?: number) =>
  monitoringSystem.collectFeedback(feedback, rating);

export const getMonitoringAnalytics = () =>
  monitoringSystem.getAnalytics();

export const getMonitoringHealth = () =>
  monitoringSystem.getHealthStatus();

export const showMonitoringDashboard = () =>
  monitoringSystem.showDashboard();

export const toggleMonitoringDashboard = () =>
  monitoringSystem.toggleDashboard();

export const hasMonitoringConsent = (type?: string) =>
  monitoringSystem.hasConsent(type);

export const exportMonitoringData = () =>
  monitoringSystem.exportData();

// Export the monitoring system instance for advanced usage
export { monitoringSystem };

// Development helper - add monitoring controls to page in development
if (import.meta.env.DEV) {
  // Add monitoring controls to the page
  setTimeout(() => {
    const controls = document.createElement('div');
    controls.id = 'monitoring-controls';
    controls.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      background: #2a2a2a;
      color: white;
      padding: 12px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 12px;
      z-index: 9999;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;

    controls.innerHTML = `
      <div style="margin-bottom: 8px; font-weight: bold;">Monitoring Controls</div>
      <button id="toggle-dashboard" style="
        background: #4CAF50;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        margin-right: 8px;
      ">Dashboard</button>
      <button id="export-data" style="
        background: #2196F3;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        margin-right: 8px;
      ">Export</button>
      <button id="health-check" style="
        background: #ff9800;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
      ">Health</button>
    `;

    document.body.appendChild(controls);

    // Add event listeners
    document.getElementById('toggle-dashboard')?.addEventListener('click', () => {
      toggleMonitoringDashboard();
    });

    document.getElementById('export-data')?.addEventListener('click', () => {
      const data = exportMonitoringData();
      if (data) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `monitoring-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    });

    document.getElementById('health-check')?.addEventListener('click', () => {
      const health = getMonitoringHealth();
      console.log('[Monitoring] Health Status:', health);
      alert(`Health Status: ${health.status}\nOverall Score: ${health.overallScore}\nSystems: ${health.systems.join(', ')}\n${health.issues.length > 0 ? 'Issues: ' + health.issues.join(', ') : 'No issues'}`);
    });

    console.log('[Monitoring] Development controls added to page');
  }, 1000);
}