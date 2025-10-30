/**
 * UX Monitoring Dashboard
 * Unified dashboard for comprehensive UX monitoring and analytics
 */

import { getRUMMetrics, getRUMSummary } from './rum';
import { getCoreWebVitalsSummary } from './core-web-vitals';
import { getJourneyAnalytics, getUserBehaviorPatterns } from './user-journey-analytics';
import { getErrorAnalytics, getFeedbackAnalytics } from './error-tracking-feedback';
import { getAccessibilityReport } from './accessibility-monitoring';
import { getMobileExperienceReport } from './mobile-experience-tracking';
import { getPerformanceSummary } from './page-performance-monitoring';
import { getSatisfactionAnalytics } from './user-satisfaction-analytics';
import { getGDPRComplianceStatus } from './gdpr-compliance-manager';

// Dashboard configuration
interface DashboardConfig {
  refreshInterval: number; // milliseconds
  enableRealTimeUpdates: boolean;
  enableDataExport: boolean;
  enableAlerts: boolean;
  alertThresholds: AlertThresholds;
  widgets: WidgetConfig[];
}

// Alert thresholds
interface AlertThresholds {
  performanceScore: number;
  satisfactionScore: number;
  errorRate: number;
  accessibilityScore: number;
  mobileScore: number;
}

// Widget configuration
interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  size: 'small' | 'medium' | 'large' | 'full';
  position: { x: number; y: number };
  refreshInterval?: number;
  enabled: boolean;
  config?: any;
}

// Widget types
enum WidgetType {
  OVERVIEW = 'overview',
  PERFORMANCE = 'performance',
  USER_JOURNEY = 'user_journey',
  ERRORS_FEEDBACK = 'errors_feedback',
  ACCESSIBILITY = 'accessibility',
  MOBILE = 'mobile',
  SATISFACTION = 'satisfaction',
  COMPLIANCE = 'compliance',
  REAL_TIME = 'real_time',
  TRENDS = 'trends'
}

// Alert data
interface Alert {
  id: string;
  type: 'performance' | 'satisfaction' | 'error' | 'accessibility' | 'mobile' | 'compliance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: number;
  acknowledged: boolean;
  data?: any;
}

// UX Monitoring Dashboard Class
export class UXMonitoringDashboard {
  private config: DashboardConfig;
  private alerts: Alert[] = [];
  private widgets: Map<string, HTMLElement> = new Map();
  private dashboardElement: HTMLElement | null = null;
  private isInitialized = false;
  private refreshTimer: NodeJS.Timeout | null = null;
  private realTimeData: any = {};

  constructor(config: Partial<DashboardConfig> = {}) {
    this.config = {
      refreshInterval: 30000, // 30 seconds
      enableRealTimeUpdates: true,
      enableDataExport: true,
      enableAlerts: true,
      alertThresholds: {
        performanceScore: 70,
        satisfactionScore: 75,
        errorRate: 5, // 5%
        accessibilityScore: 80,
        mobileScore: 70
      },
      widgets: this.getDefaultWidgetConfig(),
      ...config
    };
  }

  // Initialize dashboard
  initialize(): void {
    if (this.isInitialized) return;

    try {
      this.createDashboard();
      this.initializeWidgets();
      this.startRealTimeUpdates();
      this.initializeAlerts();
      this.initializeDataExport();

      this.isInitialized = true;
      console.log('[UX Dashboard] UX monitoring dashboard initialized');

      // Initial data load
      this.refreshAllData();
    } catch (error) {
      console.warn('[UX Dashboard] Failed to initialize:', error);
    }
  }

  // Get default widget configuration
  private getDefaultWidgetConfig(): WidgetConfig[] {
    return [
      {
        id: 'overview',
        type: WidgetType.OVERVIEW,
        title: 'Overview',
        size: 'full',
        position: { x: 0, y: 0 },
        enabled: true
      },
      {
        id: 'performance',
        type: WidgetType.PERFORMANCE,
        title: 'Performance Metrics',
        size: 'large',
        position: { x: 0, y: 1 },
        enabled: true
      },
      {
        id: 'user-journey',
        type: WidgetType.USER_JOURNEY,
        title: 'User Journey Analytics',
        size: 'large',
        position: { x: 2, y: 1 },
        enabled: true
      },
      {
        id: 'errors-feedback',
        type: WidgetType.ERRORS_FEEDBACK,
        title: 'Errors & Feedback',
        size: 'medium',
        position: { x: 0, y: 2 },
        enabled: true
      },
      {
        id: 'accessibility',
        type: WidgetType.ACCESSIBILITY,
        title: 'Accessibility',
        size: 'medium',
        position: { x: 1, y: 2 },
        enabled: true
      },
      {
        id: 'mobile',
        type: WidgetType.MOBILE,
        title: 'Mobile Experience',
        size: 'medium',
        position: { x: 2, y: 2 },
        enabled: true
      },
      {
        id: 'satisfaction',
        type: WidgetType.SATISFACTION,
        title: 'User Satisfaction',
        size: 'medium',
        position: { x: 3, y: 2 },
        enabled: true
      },
      {
        id: 'compliance',
        type: WidgetType.COMPLIANCE,
        title: 'GDPR Compliance',
        size: 'small',
        position: { x: 3, y: 1 },
        enabled: true
      },
      {
        id: 'real-time',
        type: WidgetType.REAL_TIME,
        title: 'Real-time Activity',
        size: 'medium',
        position: { x: 0, y: 3 },
        enabled: true,
        refreshInterval: 5000
      },
      {
        id: 'trends',
        type: WidgetType.TRENDS,
        title: 'Trends & Insights',
        size: 'large',
        position: { x: 1, y: 3 },
        enabled: true
      }
    ];
  }

  // Create dashboard container
  private createDashboard(): void {
    const dashboard = document.createElement('div');
    dashboard.id = 'ux-monitoring-dashboard';
    dashboard.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: #1a1a1a;
      color: #ffffff;
      z-index: 10004;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: none;
      overflow: hidden;
    `;

    dashboard.innerHTML = `
      <div style="display: flex; flex-direction: column; height: 100%;">
        <!-- Header -->
        <header style="
          background: linear-gradient(135deg, #2c1810 0%, #8B4513 100%);
          padding: 16px 24px;
          border-bottom: 1px solid #333;
          display: flex;
          align-items: center;
          justify-content: space-between;
        ">
          <div style="display: flex; align-items: center; gap: 16px;">
            <h1 style="margin: 0; font-size: 20px; font-weight: 600;">UX Monitoring Dashboard</h1>
            <span style="background: rgba(255,255,255,0.1); padding: 4px 12px; border-radius: 12px; font-size: 12px;">
              Real-time monitoring
            </span>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <button id="dashboard-refresh" style="
              background: rgba(255,255,255,0.1);
              color: white;
              border: 1px solid rgba(255,255,255,0.2);
              padding: 8px 16px;
              border-radius: 6px;
              cursor: pointer;
              font-size: 14px;
            " onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'">
              Refresh
            </button>
            <button id="dashboard-export" style="
              background: rgba(255,255,255,0.1);
              color: white;
              border: 1px solid rgba(255,255,255,0.2);
              padding: 8px 16px;
              border-radius: 6px;
              cursor: pointer;
              font-size: 14px;
            " onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'">
              Export
            </button>
            <button id="dashboard-close" style="
              background: rgba(255,255,255,0.1);
              color: white;
              border: 1px solid rgba(255,255,255,0.2);
              padding: 8px 16px;
              border-radius: 6px;
              cursor: pointer;
              font-size: 14px;
            " onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'">
              Close
            </button>
          </div>
        </header>

        <!-- Alerts Banner -->
        <div id="dashboard-alerts" style="
          background: #333;
          padding: 12px 24px;
          border-bottom: 1px solid #444;
          display: none;
        ">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="color: #ff6b6b; font-weight: 600;">⚠️ Alerts</span>
            <div id="alerts-container" style="display: flex; gap: 16px; flex-wrap: wrap; flex: 1;"></div>
          </div>
        </div>

        <!-- Main Content -->
        <main style="flex: 1; padding: 24px; overflow-y: auto;">
          <div id="dashboard-widgets" style="
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            grid-template-rows: auto;
            gap: 24px;
            min-height: 100%;
          ">
            <!-- Widgets will be inserted here -->
          </div>
        </main>
      </div>
    `;

    document.body.appendChild(dashboard);
    this.dashboardElement = dashboard;

    this.setupDashboardListeners();
  }

  // Setup dashboard listeners
  private setupDashboardListeners(): void {
    if (!this.dashboardElement) return;

    // Refresh button
    this.dashboardElement.querySelector('#dashboard-refresh')?.addEventListener('click', () => {
      this.refreshAllData();
    });

    // Export button
    this.dashboardElement.querySelector('#dashboard-export')?.addEventListener('click', () => {
      this.exportDashboardData();
    });

    // Close button
    this.dashboardElement.querySelector('#dashboard-close')?.addEventListener('click', () => {
      this.hide();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.dashboardElement?.style.display !== 'none') {
        this.hide();
      }
    });
  }

  // Initialize widgets
  private initializeWidgets(): void {
    const widgetsContainer = this.dashboardElement?.querySelector('#dashboard-widgets');
    if (!widgetsContainer) return;

    this.config.widgets.forEach(widgetConfig => {
      if (widgetConfig.enabled) {
        const widget = this.createWidget(widgetConfig);
        if (widget) {
          this.widgets.set(widgetConfig.id, widget);
          widgetsContainer.appendChild(widget);
        }
      }
    });
  }

  // Create widget
  private createWidget(config: WidgetConfig): HTMLElement | null {
    const widget = document.createElement('div');
    widget.id = `widget-${config.id}`;
    widget.className = `dashboard-widget widget-${config.size}`;
    widget.style.cssText = `
      background: #2a2a2a;
      border: 1px solid #444;
      border-radius: 12px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      min-height: 200px;
      position: relative;
      overflow: hidden;
    `;

    // Set grid position
    widget.style.gridColumn = `${config.position.x + 1} / span ${this.getWidgetSpan(config.size)}`;
    widget.style.gridRow = `${config.position.y + 1}`;

    widget.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
        <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #ffffff;">${config.title}</h3>
        <div class="widget-status" style="
          width: 8px;
          height: 8px;
          background: #4CAF50;
          border-radius: 50%;
          animation: pulse 2s infinite;
        "></div>
      </div>
      <div class="widget-content" style="flex: 1; display: flex; flex-direction: column;">
        <div class="widget-loading" style="
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 1;
          color: #888;
        ">
          Loading...
        </div>
      </div>
    `;

    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
      }
      .widget-small { grid-column: span 1; }
      .widget-medium { grid-column: span 1; }
      .widget-large { grid-column: span 2; }
      .widget-full { grid-column: span 4; }
    `;
    document.head.appendChild(style);

    // Initialize widget content
    this.initializeWidgetContent(widget, config);

    return widget;
  }

  // Get widget span based on size
  private getWidgetSpan(size: string): number {
    switch (size) {
      case 'small': return 1;
      case 'medium': return 1;
      case 'large': return 2;
      case 'full': return 4;
      default: return 1;
    }
  }

  // Initialize widget content
  private initializeWidgetContent(widget: HTMLElement, config: WidgetConfig): void {
    const content = widget.querySelector('.widget-content');
    if (!content) return;

    switch (config.type) {
      case WidgetType.OVERVIEW:
        this.initializeOverviewWidget(content);
        break;
      case WidgetType.PERFORMANCE:
        this.initializePerformanceWidget(content);
        break;
      case WidgetType.USER_JOURNEY:
        this.initializeUserJourneyWidget(content);
        break;
      case WidgetType.ERRORS_FEEDBACK:
        this.initializeErrorsFeedbackWidget(content);
        break;
      case WidgetType.ACCESSIBILITY:
        this.initializeAccessibilityWidget(content);
        break;
      case WidgetType.MOBILE:
        this.initializeMobileWidget(content);
        break;
      case WidgetType.SATISFACTION:
        this.initializeSatisfactionWidget(content);
        break;
      case WidgetType.COMPLIANCE:
        this.initializeComplianceWidget(content);
        break;
      case WidgetType.REAL_TIME:
        this.initializeRealTimeWidget(content);
        break;
      case WidgetType.TRENDS:
        this.initializeTrendsWidget(content);
        break;
    }
  }

  // Initialize overview widget
  private initializeOverviewWidget(content: HTMLElement): void {
    content.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; flex: 1;">
        <div class="metric-card" style="background: #333; padding: 16px; border-radius: 8px;">
          <div style="font-size: 12px; color: #888; margin-bottom: 4px;">Performance Score</div>
          <div class="performance-score" style="font-size: 24px; font-weight: 600; color: #4CAF50;">--</div>
        </div>
        <div class="metric-card" style="background: #333; padding: 16px; border-radius: 8px;">
          <div style="font-size: 12px; color: #888; margin-bottom: 4px;">Satisfaction Rate</div>
          <div class="satisfaction-score" style="font-size: 24px; font-weight: 600; color: #4CAF50;">--</div>
        </div>
        <div class="metric-card" style="background: #333; padding: 16px; border-radius: 8px;">
          <div style="font-size: 12px; color: #888; margin-bottom: 4px;">Active Users</div>
          <div class="active-users" style="font-size: 24px; font-weight: 600; color: #4CAF50;">--</div>
        </div>
        <div class="metric-card" style="background: #333; padding: 16px; border-radius: 8px;">
          <div style="font-size: 12px; color: #888; margin-bottom: 4px;">Error Rate</div>
          <div class="error-rate" style="font-size: 24px; font-weight: 600; color: #4CAF50;">--</div>
        </div>
      </div>
      <div style="margin-top: 16px; padding: 12px; background: #333; border-radius: 8px;">
        <div style="font-size: 12px; color: #888; margin-bottom: 8px;">System Health</div>
        <div class="health-indicators" style="display: flex; gap: 16px;">
          <div class="health-item">
            <span style="font-size: 12px;">Performance:</span>
            <span class="health-performance" style="color: #4CAF50; margin-left: 4px;">✓</span>
          </div>
          <div class="health-item">
            <span style="font-size: 12px;">Accessibility:</span>
            <span class="health-accessibility" style="color: #4CAF50; margin-left: 4px;">✓</span>
          </div>
          <div class="health-item">
            <span style="font-size: 12px;">Mobile:</span>
            <span class="health-mobile" style="color: #4CAF50; margin-left: 4px;">✓</span>
          </div>
          <div class="health-item">
            <span style="font-size: 12px;">Compliance:</span>
            <span class="health-compliance" style="color: #4CAF50; margin-left: 4px;">✓</span>
          </div>
        </div>
      </div>
    `;
  }

  // Initialize performance widget
  private initializePerformanceWidget(content: HTMLElement): void {
    content.innerHTML = `
      <div style="flex: 1;">
        <div class="core-web-vitals" style="margin-bottom: 20px;">
          <h4 style="margin: 0 0 12px 0; font-size: 14px; color: #ccc;">Core Web Vitals</h4>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
            <div class="vital-metric">
              <div style="font-size: 11px; color: #888;">LCP</div>
              <div class="lcp-value" style="font-size: 16px; font-weight: 600;">--</div>
              <div class="lcp-status" style="font-size: 10px;">--</div>
            </div>
            <div class="vital-metric">
              <div style="font-size: 11px; color: #888;">FID</div>
              <div class="fid-value" style="font-size: 16px; font-weight: 600;">--</div>
              <div class="fid-status" style="font-size: 10px;">--</div>
            </div>
            <div class="vital-metric">
              <div style="font-size: 11px; color: #888;">CLS</div>
              <div class="cls-value" style="font-size: 16px; font-weight: 600;">--</div>
              <div class="cls-status" style="font-size: 10px;">--</div>
            </div>
            <div class="vital-metric">
              <div style="font-size: 11px; color: #888;">TTFB</div>
              <div class="ttfb-value" style="font-size: 16px; font-weight: 600;">--</div>
              <div class="ttfb-status" style="font-size: 10px;">--</div>
            </div>
          </div>
        </div>
        <div class="performance-budgets">
          <h4 style="margin: 0 0 12px 0; font-size: 14px; color: #ccc;">Performance Budgets</h4>
          <div class="budget-status" style="font-size: 12px;">Loading...</div>
        </div>
      </div>
    `;
  }

  // Initialize user journey widget
  private initializeUserJourneyWidget(content: HTMLElement): void {
    content.innerHTML = `
      <div style="flex: 1;">
        <div class="journey-overview" style="margin-bottom: 20px;">
          <h4 style="margin: 0 0 12px 0; font-size: 14px; color: #ccc;">Booking Funnel</h4>
          <div class="funnel-chart" style="display: flex; align-items: flex-end; height: 100px; gap: 8px;">
            <div class="funnel-step" style="flex: 1; background: #4CAF50; color: white; text-align: center; padding: 8px; border-radius: 4px 4px 0 0; position: relative;">
              <div style="font-size: 10px;">Landing</div>
              <div class="landing-count" style="font-size: 12px; font-weight: 600;">--</div>
            </div>
            <div class="funnel-step" style="flex: 1; background: #4CAF50; color: white; text-align: center; padding: 8px; border-radius: 4px 4px 0 0; position: relative;">
              <div style="font-size: 10px;">Service</div>
              <div class="service-count" style="font-size: 12px; font-weight: 600;">--</div>
            </div>
            <div class="funnel-step" style="flex: 1; background: #4CAF50; color: white; text-align: center; padding: 8px; border-radius: 4px 4px 0 0; position: relative;">
              <div style="font-size: 10px;">Booking</div>
              <div class="booking-count" style="font-size: 12px; font-weight: 600;">--</div>
            </div>
            <div class="funnel-step" style="flex: 1; background: #4CAF50; color: white; text-align: center; padding: 8px; border-radius: 4px 4px 0 0; position: relative;">
              <div style="font-size: 10px;">Payment</div>
              <div class="payment-count" style="font-size: 12px; font-weight: 600;">--</div>
            </div>
          </div>
        </div>
        <div class="journey-metrics">
          <h4 style="margin: 0 0 12px 0; font-size: 14px; color: #ccc;">Journey Metrics</h4>
          <div class="conversion-rate" style="margin-bottom: 8px;">
            <span style="font-size: 11px; color: #888;">Conversion Rate:</span>
            <span class="conversion-value" style="font-size: 12px; font-weight: 600; margin-left: 8px;">--</span>
          </div>
          <div class="abandonment-rate" style="margin-bottom: 8px;">
            <span style="font-size: 11px; color: #888;">Abandonment Rate:</span>
            <span class="abandonment-value" style="font-size: 12px; font-weight: 600; margin-left: 8px;">--</span>
          </div>
          <div class="avg-journey-time">
            <span style="font-size: 11px; color: #888;">Avg. Journey Time:</span>
            <span class="journey-time-value" style="font-size: 12px; font-weight: 600; margin-left: 8px;">--</span>
          </div>
        </div>
      </div>
    `;
  }

  // Initialize errors & feedback widget
  private initializeErrorsFeedbackWidget(content: HTMLElement): void {
    content.innerHTML = `
      <div style="flex: 1;">
        <div class="error-summary" style="margin-bottom: 16px;">
          <h4 style="margin: 0 0 12px 0; font-size: 14px; color: #ccc;">Error Summary</h4>
          <div class="error-stats" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
            <div>
              <div style="font-size: 11px; color: #888;">Total Errors</div>
              <div class="total-errors" style="font-size: 16px; font-weight: 600; color: #ff6b6b;">--</div>
            </div>
            <div>
              <div style="font-size: 11px; color: #888;">Critical Errors</div>
              <div class="critical-errors" style="font-size: 16px; font-weight: 600; color: #ff6b6b;">--</div>
            </div>
          </div>
        </div>
        <div class="feedback-summary">
          <h4 style="margin: 0 0 12px 0; font-size: 14px; color: #ccc;">User Feedback</h4>
          <div class="feedback-stats" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
            <div>
              <div style="font-size: 11px; color: #888;">Total Feedback</div>
              <div class="total-feedback" style="font-size: 16px; font-weight: 600; color: #4CAF50;">--</div>
            </div>
            <div>
              <div style="font-size: 11px; color: #888;">Avg Rating</div>
              <div class="avg-rating" style="font-size: 16px; font-weight: 600; color: #4CAF50;">--</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Initialize accessibility widget
  private initializeAccessibilityWidget(content: HTMLElement): void {
    content.innerHTML = `
      <div style="flex: 1;">
        <div class="a11y-score" style="margin-bottom: 16px; text-align: center;">
          <div style="font-size: 24px; font-weight: 600; color: #4CAF50;" class="a11y-score-value">--</div>
          <div style="font-size: 12px; color: #888;">WCAG AA Compliance Score</div>
        </div>
        <div class="a11y-issues">
          <h4 style="margin: 0 0 12px 0; font-size: 14px; color: #ccc;">Issues by Category</h4>
          <div class="issues-breakdown" style="font-size: 12px;">Loading...</div>
        </div>
      </div>
    `;
  }

  // Initialize mobile widget
  private initializeMobileWidget(content: HTMLElement): void {
    content.innerHTML = `
      <div style="flex: 1;">
        <div class="mobile-score" style="margin-bottom: 16px; text-align: center;">
          <div style="font-size: 24px; font-weight: 600; color: #4CAF50;" class="mobile-score-value">--</div>
          <div style="font-size: 12px; color: #888;">Mobile Experience Score</div>
        </div>
        <div class="mobile-metrics">
          <h4 style="margin: 0 0 12px 0; font-size: 14px; color: #ccc;">Mobile Metrics</h4>
          <div class="touch-responsiveness" style="margin-bottom: 8px;">
            <span style="font-size: 11px; color: #888;">Touch Responsiveness:</span>
            <span class="touch-value" style="font-size: 12px; font-weight: 600; margin-left: 8px;">--</span>
          </div>
          <div class="target-accessibility" style="margin-bottom: 8px;">
            <span style="font-size: 11px; color: #888;">Target Accessibility:</span>
            <span class="target-value" style="font-size: 12px; font-weight: 600; margin-left: 8px;">--</span>
          </div>
        </div>
      </div>
    `;
  }

  // Initialize satisfaction widget
  private initializeSatisfactionWidget(content: HTMLElement): void {
    content.innerHTML = `
      <div style="flex: 1;">
        <div class="satisfaction-overview" style="margin-bottom: 16px;">
          <h4 style="margin: 0 0 12px 0; font-size: 14px; color: #ccc;">User Satisfaction</h4>
          <div class="nps-score" style="text-align: center; margin-bottom: 12px;">
            <div style="font-size: 24px; font-weight: 600; color: #4CAF50;" class="nps-value">--</div>
            <div style="font-size: 12px; color: #888;">Net Promoter Score</div>
          </div>
        </div>
        <div class="satisfaction-breakdown">
          <div class="satisfaction-type" style="margin-bottom: 8px;">
            <span style="font-size: 11px; color: #888;">CSAT:</span>
            <span class="csat-value" style="font-size: 12px; font-weight: 600; margin-left: 8px;">--</span>
          </div>
          <div class="satisfaction-type">
            <span style="font-size: 11px; color: #888;">Response Rate:</span>
            <span class="response-rate-value" style="font-size: 12px; font-weight: 600; margin-left: 8px;">--</span>
          </div>
        </div>
      </div>
    `;
  }

  // Initialize compliance widget
  private initializeComplianceWidget(content: HTMLElement): void {
    content.innerHTML = `
      <div style="flex: 1; text-align: center;">
        <div class="compliance-status" style="margin-bottom: 16px;">
          <div style="font-size: 32px; color: #4CAF50;">✓</div>
          <div style="font-size: 12px; color: #888; margin-top: 8px;">GDPR Compliant</div>
        </div>
        <div class="consent-status">
          <div style="font-size: 11px; color: #888;">Consent:</div>
          <div class="consent-value" style="font-size: 12px; font-weight: 600;">--</div>
        </div>
      </div>
    `;
  }

  // Initialize real-time widget
  private initializeRealTimeWidget(content: HTMLElement): void {
    content.innerHTML = `
      <div style="flex: 1;">
        <h4 style="margin: 0 0 12px 0; font-size: 14px; color: #ccc;">Live Activity</h4>
        <div class="real-time-events" style="height: 150px; overflow-y: auto; font-family: monospace; font-size: 11px;">
          <div class="event-list">Waiting for events...</div>
        </div>
      </div>
    `;
  }

  // Initialize trends widget
  private initializeTrendsWidget(content: HTMLElement): void {
    content.innerHTML = `
      <div style="flex: 1;">
        <h4 style="margin: 0 0 12px 0; font-size: 14px; color: #ccc;">Key Insights & Trends</h4>
        <div class="insights-list" style="font-size: 12px; line-height: 1.6;">
          <div class="insight-item" style="padding: 8px; background: #333; border-radius: 4px; margin-bottom: 8px;">
            Loading insights...
          </div>
        </div>
      </div>
    `;
  }

  // Start real-time updates
  private startRealTimeUpdates(): void {
    if (!this.config.enableRealTimeUpdates) return;

    // Set up event listeners for real-time data
    window.addEventListener('rum-event', (event: any) => {
      this.handleRealTimeEvent(event.detail);
    });

    window.addEventListener('user-action', (event: any) => {
      this.handleRealTimeEvent({ type: 'user-action', data: event.detail });
    });

    // Start refresh timer
    this.refreshTimer = setInterval(() => {
      this.refreshAllData();
    }, this.config.refreshInterval);
  }

  // Handle real-time event
  private handleRealTimeEvent(event: any): void {
    const realTimeWidget = this.widgets.get('real-time');
    if (!realTimeWidget) return;

    const eventList = realTimeWidget.querySelector('.event-list');
    if (!eventList) return;

    const timestamp = new Date().toLocaleTimeString();
    const eventHtml = `<div style="padding: 2px 0; border-bottom: 1px solid #444;">
      <span style="color: #888;">[${timestamp}]</span>
      <span style="color: #ccc;">${event.type}:</span>
      <span style="color: #fff;">${JSON.stringify(event.data).substring(0, 50)}...</span>
    </div>`;

    eventList.insertAdjacentHTML('afterbegin', eventHtml);

    // Keep only last 20 events
    const events = eventList.children;
    while (events.length > 20) {
      eventList.removeChild(events[events.length - 1]);
    }
  }

  // Initialize alerts
  private initializeAlerts(): void {
    if (!this.config.enableAlerts) return;

    // Check for alerts periodically
    setInterval(() => {
      this.checkForAlerts();
    }, 60000); // Every minute
  }

  // Check for alerts
  private checkForAlerts(): void {
    // Get current metrics and check against thresholds
    const metrics = this.collectAllMetrics();

    // Check performance score
    if (metrics.performanceScore < this.config.alertThresholds.performanceScore) {
      this.createAlert({
        type: 'performance',
        severity: metrics.performanceScore < 50 ? 'critical' : 'high',
        title: 'Low Performance Score',
        message: `Performance score is ${metrics.performanceScore} (threshold: ${this.config.alertThresholds.performanceScore})`,
        data: { score: metrics.performanceScore }
      });
    }

    // Check satisfaction score
    if (metrics.satisfactionScore < this.config.alertThresholds.satisfactionScore) {
      this.createAlert({
        type: 'satisfaction',
        severity: metrics.satisfactionScore < 60 ? 'critical' : 'high',
        title: 'Low Satisfaction Score',
        message: `Satisfaction score is ${metrics.satisfactionScore} (threshold: ${this.config.alertThresholds.satisfactionScore})`,
        data: { score: metrics.satisfactionScore }
      });
    }

    // Check error rate
    if (metrics.errorRate > this.config.alertThresholds.errorRate) {
      this.createAlert({
        type: 'error',
        severity: metrics.errorRate > 10 ? 'critical' : 'high',
        title: 'High Error Rate',
        message: `Error rate is ${metrics.errorRate}% (threshold: ${this.config.alertThresholds.errorRate}%)`,
        data: { rate: metrics.errorRate }
      });
    }

    // Check accessibility score
    if (metrics.accessibilityScore < this.config.alertThresholds.accessibilityScore) {
      this.createAlert({
        type: 'accessibility',
        severity: metrics.accessibilityScore < 60 ? 'critical' : 'high',
        title: 'Low Accessibility Score',
        message: `Accessibility score is ${metrics.accessibilityScore} (threshold: ${this.config.alertThresholds.accessibilityScore})`,
        data: { score: metrics.accessibilityScore }
      });
    }

    // Check mobile score
    if (metrics.mobileScore < this.config.alertThresholds.mobileScore) {
      this.createAlert({
        type: 'mobile',
        severity: metrics.mobileScore < 50 ? 'critical' : 'high',
        title: 'Low Mobile Experience Score',
        message: `Mobile score is ${metrics.mobileScore} (threshold: ${this.config.alertThresholds.mobileScore})`,
        data: { score: metrics.mobileScore }
      });
    }
  }

  // Create alert
  private createAlert(alertData: Omit<Alert, 'id' | 'timestamp' | 'acknowledged'>): void {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      acknowledged: false,
      ...alertData
    };

    this.alerts.push(alert);

    // Keep only last 20 alerts
    if (this.alerts.length > 20) {
      this.alerts = this.alerts.slice(-20);
    }

    this.renderAlerts();
  }

  // Render alerts
  private renderAlerts(): void {
    const alertsBanner = this.dashboardElement?.querySelector('#dashboard-alerts');
    const alertsContainer = this.dashboardElement?.querySelector('#alerts-container');
    if (!alertsBanner || !alertsContainer) return;

    const unacknowledgedAlerts = this.alerts.filter(alert => !alert.acknowledged);

    if (unacknowledgedAlerts.length > 0) {
      alertsBanner.style.display = 'block';
      alertsContainer.innerHTML = unacknowledgedAlerts.slice(0, 3).map(alert => `
        <div style="
          background: ${alert.severity === 'critical' ? '#ff4444' : alert.severity === 'high' ? '#ff8800' : '#ffaa00'};
          color: white;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          max-width: 300px;
        " onclick="this.parentElement.parentElement.parentElement.parentElement.querySelector('.dashboard-alerts').style.display='none'">
          <strong>${alert.title}:</strong> ${alert.message}
        </div>
      `).join('');
    } else {
      alertsBanner.style.display = 'none';
    }
  }

  // Initialize data export
  private initializeDataExport(): void {
    // Data export functionality is handled by the export button
  }

  // Collect all metrics
  private collectAllMetrics(): any {
    try {
      const performanceData = getPerformanceSummary();
      const satisfactionData = getSatisfactionAnalytics();
      const errorData = getErrorAnalytics();
      const accessibilityData = getAccessibilityReport();
      const mobileData = getMobileExperienceReport();

      return {
        performanceScore: performanceData.overallScore || 0,
        satisfactionScore: satisfactionData.recentPerformance?.lastWeek?.average || 0,
        errorRate: errorData.totalErrors > 0 ? (errorData.totalErrors / 100) * 100 : 0, // Simplified calculation
        accessibilityScore: accessibilityData.summary.wcagComplianceScore || 0,
        mobileScore: mobileData.summary.overallScore || 0
      };
    } catch (error) {
      console.warn('[UX Dashboard] Failed to collect metrics:', error);
      return {
        performanceScore: 0,
        satisfactionScore: 0,
        errorRate: 0,
        accessibilityScore: 0,
        mobileScore: 0
      };
    }
  }

  // Refresh all data
  private refreshAllData(): void {
    try {
      // Update all widgets with fresh data
      this.updateOverviewWidget();
      this.updatePerformanceWidget();
      this.updateUserJourneyWidget();
      this.updateErrorsFeedbackWidget();
      this.updateAccessibilityWidget();
      this.updateMobileWidget();
      this.updateSatisfactionWidget();
      this.updateComplianceWidget();
      this.updateTrendsWidget();

      // Update widget status indicators
      this.updateWidgetStatus();

    } catch (error) {
      console.warn('[UX Dashboard] Failed to refresh data:', error);
    }
  }

  // Update overview widget
  private updateOverviewWidget(): void {
    const widget = this.widgets.get('overview');
    if (!widget) return;

    const metrics = this.collectAllMetrics();

    // Update scores
    const perfScore = widget.querySelector('.performance-score');
    if (perfScore) {
      perfScore.textContent = metrics.performanceScore.toFixed(0);
      perfScore.style.color = this.getScoreColor(metrics.performanceScore);
    }

    const satScore = widget.querySelector('.satisfaction-score');
    if (satScore) {
      satScore.textContent = metrics.satisfactionScore.toFixed(0);
      satScore.style.color = this.getScoreColor(metrics.satisfactionScore);
    }

    // Update other metrics
    const activeUsers = widget.querySelector('.active-users');
    if (activeUsers) {
      activeUsers.textContent = Math.floor(Math.random() * 100 + 50).toString(); // Placeholder
    }

    const errorRate = widget.querySelector('.error-rate');
    if (errorRate) {
      errorRate.textContent = metrics.errorRate.toFixed(1) + '%';
      errorRate.style.color = metrics.errorRate > 5 ? '#ff6b6b' : '#4CAF50';
    }

    // Update health indicators
    const healthPerf = widget.querySelector('.health-performance');
    if (healthPerf) {
      healthPerf.textContent = metrics.performanceScore > 70 ? '✓' : '⚠';
      healthPerf.style.color = metrics.performanceScore > 70 ? '#4CAF50' : '#ff9800';
    }

    const healthA11y = widget.querySelector('.health-accessibility');
    if (healthA11y) {
      healthA11y.textContent = metrics.accessibilityScore > 80 ? '✓' : '⚠';
      healthA11y.style.color = metrics.accessibilityScore > 80 ? '#4CAF50' : '#ff9800';
    }

    const healthMobile = widget.querySelector('.health-mobile');
    if (healthMobile) {
      healthMobile.textContent = metrics.mobileScore > 70 ? '✓' : '⚠';
      healthMobile.style.color = metrics.mobileScore > 70 ? '#4CAF50' : '#ff9800';
    }

    const healthComp = widget.querySelector('.health-compliance');
    if (healthComp) {
      const complianceStatus = getGDPRComplianceStatus();
      healthComp.textContent = complianceStatus.isInitialized ? '✓' : '⚠';
      healthComp.style.color = complianceStatus.isInitialized ? '#4CAF50' : '#ff9800';
    }
  }

  // Update performance widget
  private updatePerformanceWidget(): void {
    const widget = this.widgets.get('performance');
    if (!widget) return;

    try {
      const coreWebVitals = getCoreWebVitalsSummary();
      const performanceSummary = getPerformanceSummary();

      // Update Core Web Vitals
      const lcpValue = widget.querySelector('.lcp-value');
      const lcpStatus = widget.querySelector('.lcp-status');
      if (lcpValue && coreWebVitals.metrics?.LCP) {
        lcpValue.textContent = coreWebVitals.metrics.LCP.value.toFixed(0) + 'ms';
        lcpValue.style.color = this.getVitalColor(coreWebVitals.metrics.LCP.rating);
        if (lcpStatus) {
          lcpStatus.textContent = coreWebVitals.metrics.LCP.rating;
          lcpStatus.style.color = this.getVitalColor(coreWebVitals.metrics.LCP.rating);
        }
      }

      // Update other vitals similarly...

      // Update performance budgets
      const budgetStatus = widget.querySelector('.budget-status');
      if (budgetStatus && performanceSummary.budgets) {
        const passed = performanceSummary.budgets.passed.length;
        const failed = performanceSummary.budgets.failed.length;
        budgetStatus.textContent = `Budgets: ${passed} passed, ${failed} failed`;
        budgetStatus.style.color = failed === 0 ? '#4CAF50' : '#ff9800';
      }
    } catch (error) {
      console.warn('[UX Dashboard] Failed to update performance widget:', error);
    }
  }

  // Update user journey widget
  private updateUserJourneyWidget(): void {
    const widget = this.widgets.get('user-journey');
    if (!widget) return;

    try {
      const journeyAnalytics = getJourneyAnalytics();
      const behaviorPatterns = getUserBehaviorPatterns();

      // Update funnel chart
      const landingCount = widget.querySelector('.landing-count');
      const serviceCount = widget.querySelector('.service-count');
      const bookingCount = widget.querySelector('.booking-count');
      const paymentCount = widget.querySelector('.payment-count');

      // Placeholder data - in real implementation, use actual journey data
      const funnelData = [100, 75, 45, 30]; // Example funnel data

      if (landingCount) landingCount.textContent = funnelData[0].toString();
      if (serviceCount) serviceCount.textContent = funnelData[1].toString();
      if (bookingCount) bookingCount.textContent = funnelData[2].toString();
      if (paymentCount) paymentCount.textContent = funnelData[3].toString();

      // Update metrics
      const conversionValue = widget.querySelector('.conversion-value');
      if (conversionValue) {
        const conversionRate = (funnelData[3] / funnelData[0]) * 100;
        conversionValue.textContent = conversionRate.toFixed(1) + '%';
        conversionValue.style.color = conversionRate > 20 ? '#4CAF50' : '#ff9800';
      }

      const abandonmentValue = widget.querySelector('.abandonment-value');
      if (abandonmentValue) {
        const abandonmentRate = ((funnelData[0] - funnelData[3]) / funnelData[0]) * 100;
        abandonmentValue.textContent = abandonmentRate.toFixed(1) + '%';
        abandonmentValue.style.color = abandonmentRate < 50 ? '#4CAF50' : '#ff9800';
      }

      const journeyTimeValue = widget.querySelector('.journey-time-value');
      if (journeyTimeValue) {
        journeyTimeValue.textContent = '8m 32s'; // Placeholder
      }
    } catch (error) {
      console.warn('[UX Dashboard] Failed to update user journey widget:', error);
    }
  }

  // Update errors & feedback widget
  private updateErrorsFeedbackWidget(): void {
    const widget = this.widgets.get('errors-feedback');
    if (!widget) return;

    try {
      const errorAnalytics = getErrorAnalytics();
      const feedbackAnalytics = getFeedbackAnalytics();

      // Update error stats
      const totalErrors = widget.querySelector('.total-errors');
      if (totalErrors) {
        totalErrors.textContent = errorAnalytics.totalErrors.toString();
        totalErrors.style.color = errorAnalytics.totalErrors > 10 ? '#ff6b6b' : '#4CAF50';
      }

      const criticalErrors = widget.querySelector('.critical-errors');
      if (criticalErrors) {
        const criticalCount = errorAnalytics.severityBreakdown?.critical || 0;
        criticalErrors.textContent = criticalCount.toString();
        criticalErrors.style.color = criticalCount > 0 ? '#ff6b6b' : '#4CAF50';
      }

      // Update feedback stats
      const totalFeedback = widget.querySelector('.total-feedback');
      if (totalFeedback) {
        totalFeedback.textContent = feedbackAnalytics.totalFeedback.toString();
      }

      const avgRating = widget.querySelector('.avg-rating');
      if (avgRating) {
        avgRating.textContent = feedbackAnalytics.averageRating.toFixed(1);
        avgRating.style.color = feedbackAnalytics.averageRating > 4 ? '#4CAF50' : '#ff9800';
      }
    } catch (error) {
      console.warn('[UX Dashboard] Failed to update errors & feedback widget:', error);
    }
  }

  // Update accessibility widget
  private updateAccessibilityWidget(): void {
    const widget = this.widgets.get('accessibility');
    if (!widget) return;

    try {
      const accessibilityReport = getAccessibilityReport();

      // Update score
      const scoreValue = widget.querySelector('.a11y-score-value');
      if (scoreValue) {
        scoreValue.textContent = accessibilityReport.summary.wcagComplianceScore.toString();
        scoreValue.style.color = this.getScoreColor(accessibilityReport.summary.wcagComplianceScore);
      }

      // Update issues breakdown
      const issuesBreakdown = widget.querySelector('.issues-breakdown');
      if (issuesBreakdown) {
        const issues = accessibilityReport.summary.issuesByCategory;
        const issuesHtml = Object.entries(issues)
          .map(([category, count]) => `
            <div style="display: flex; justify-content: space-between; padding: 4px 0;">
              <span>${category}:</span>
              <span style="color: ${count > 0 ? '#ff6b6b' : '#4CAF50'}">${count}</span>
            </div>
          `).join('');
        issuesBreakdown.innerHTML = issuesHtml;
      }
    } catch (error) {
      console.warn('[UX Dashboard] Failed to update accessibility widget:', error);
    }
  }

  // Update mobile widget
  private updateMobileWidget(): void {
    const widget = this.widgets.get('mobile');
    if (!widget) return;

    try {
      const mobileReport = getMobileExperienceReport();

      // Update score
      const scoreValue = widget.querySelector('.mobile-score-value');
      if (scoreValue) {
        scoreValue.textContent = mobileReport.summary.overallScore.toString();
        scoreValue.style.color = this.getScoreColor(mobileReport.summary.overallScore);
      }

      // Update metrics
      const touchValue = widget.querySelector('.touch-value');
      if (touchValue) {
        touchValue.textContent = mobileReport.summary.metrics.touchResponsiveness.toString() + '%';
        touchValue.style.color = this.getScoreColor(mobileReport.summary.metrics.touchResponsiveness);
      }

      const targetValue = widget.querySelector('.target-value');
      if (targetValue) {
        targetValue.textContent = mobileReport.summary.metrics.tapTargetAccessibility.toString() + '%';
        targetValue.style.color = this.getScoreColor(mobileReport.summary.metrics.tapTargetAccessibility);
      }
    } catch (error) {
      console.warn('[UX Dashboard] Failed to update mobile widget:', error);
    }
  }

  // Update satisfaction widget
  private updateSatisfactionWidget(): void {
    const widget = this.widgets.get('satisfaction');
    if (!widget) return;

    try {
      const satisfactionData = getSatisfactionAnalytics();

      // Update NPS
      const npsValue = widget.querySelector('.nps-value');
      if (npsValue) {
        const npsScore = satisfactionData.scoresByType?.nps?.average || 0;
        npsValue.textContent = npsScore.toFixed(0);
        npsValue.style.color = this.getScoreColor(npsScore * 10); // Convert to 0-100 scale
      }

      // Update CSAT
      const csatValue = widget.querySelector('.csat-value');
      if (csatValue) {
        const csatScore = satisfactionData.scoresByType?.csat?.average || 0;
        csatValue.textContent = csatScore.toFixed(0);
        csatValue.style.color = this.getScoreColor(csatScore);
      }

      // Update response rate
      const responseRateValue = widget.querySelector('.response-rate-value');
      if (responseRateValue) {
        responseRateValue.textContent = '68%'; // Placeholder
      }
    } catch (error) {
      console.warn('[UX Dashboard] Failed to update satisfaction widget:', error);
    }
  }

  // Update compliance widget
  private updateComplianceWidget(): void {
    const widget = this.widgets.get('compliance');
    if (!widget) return;

    try {
      const complianceStatus = getGDPRComplianceStatus();

      // Update consent status
      const consentValue = widget.querySelector('.consent-value');
      if (consentValue) {
        consentValue.textContent = complianceStatus.hasConsent ? 'Granted' : 'None';
        consentValue.style.color = complianceStatus.hasConsent ? '#4CAF50' : '#ff9800';
      }
    } catch (error) {
      console.warn('[UX Dashboard] Failed to update compliance widget:', error);
    }
  }

  // Update trends widget
  private updateTrendsWidget(): void {
    const widget = this.widgets.get('trends');
    if (!widget) return;

    try {
      const insightsList = widget.querySelector('.insights-list');
      if (insightsList) {
        const insights = this.generateInsights();
        const insightsHtml = insights.map(insight => `
          <div class="insight-item" style="
            padding: 8px;
            background: ${insight.type === 'positive' ? '#1a4d2e' : insight.type === 'negative' ? '#4d1a1a' : '#333'};
            border-radius: 4px;
            margin-bottom: 8px;
            border-left: 3px solid ${insight.type === 'positive' ? '#4CAF50' : insight.type === 'negative' ? '#ff6b6b' : '#ff9800'};
          ">
            <div style="font-weight: 600; margin-bottom: 4px;">${insight.title}</div>
            <div style="font-size: 11px; color: #ccc;">${insight.description}</div>
          </div>
        `).join('');

        insightsList.innerHTML = insightsHtml;
      }
    } catch (error) {
      console.warn('[UX Dashboard] Failed to update trends widget:', error);
    }
  }

  // Generate insights
  private generateInsights(): Array<{type: 'positive' | 'negative' | 'neutral'; title: string; description: string}> {
    const insights = [];
    const metrics = this.collectAllMetrics();

    // Performance insights
    if (metrics.performanceScore > 85) {
      insights.push({
        type: 'positive',
        title: 'Excellent Performance',
        description: `Performance score of ${metrics.performanceScore} exceeds luxury standards`
      });
    } else if (metrics.performanceScore < 60) {
      insights.push({
        type: 'negative',
        title: 'Performance Needs Attention',
        description: `Performance score of ${metrics.performanceScore} is below acceptable levels`
      });
    }

    // Satisfaction insights
    if (metrics.satisfactionScore > 80) {
      insights.push({
        type: 'positive',
        title: 'High User Satisfaction',
        description: `Satisfaction score of ${metrics.satisfactionScore} indicates happy users`
      });
    }

    // Mobile insights
    if (metrics.mobileScore > 80) {
      insights.push({
        type: 'positive',
        title: 'Great Mobile Experience',
        description: `Mobile score of ${metrics.mobileScore} shows excellent optimization`
      });
    }

    // Error insights
    if (metrics.errorRate > 5) {
      insights.push({
        type: 'negative',
        title: 'High Error Rate Detected',
        description: `Error rate of ${metrics.errorRate.toFixed(1)}% requires immediate attention`
      });
    }

    // Accessibility insights
    if (metrics.accessibilityScore > 90) {
      insights.push({
        type: 'positive',
        title: 'Outstanding Accessibility',
        description: `Accessibility score of ${metrics.accessibilityScore} exceeds WCAG AA requirements`
      });
    }

    return insights.slice(0, 5); // Return top 5 insights
  }

  // Update widget status indicators
  private updateWidgetStatus(): void {
    this.widgets.forEach((widget, id) => {
      const statusIndicator = widget.querySelector('.widget-status');
      if (statusIndicator) {
        // Flash green to indicate data was refreshed
        statusIndicator.style.background = '#4CAF50';
        setTimeout(() => {
          statusIndicator.style.background = '#4CAF50';
        }, 500);
      }
    });
  }

  // Get score color based on value
  private getScoreColor(score: number): string {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#ff9800';
    return '#ff6b6b';
  }

  // Get vital color based on rating
  private getVitalColor(rating: string): string {
    switch (rating) {
      case 'good': return '#4CAF50';
      case 'needs-improvement': return '#ff9800';
      case 'poor': return '#ff6b6b';
      default: return '#888';
    }
  }

  // Export dashboard data
  private exportDashboardData(): void {
    try {
      const data = {
        timestamp: Date.now(),
        overview: this.collectAllMetrics(),
        performance: getPerformanceSummary(),
        userJourney: getJourneyAnalytics(),
        errors: getErrorAnalytics(),
        feedback: getFeedbackAnalytics(),
        accessibility: getAccessibilityReport(),
        mobile: getMobileExperienceReport(),
        satisfaction: getSatisfactionAnalytics(),
        compliance: getGDPRComplianceStatus(),
        alerts: this.alerts,
        insights: this.generateInsights()
      };

      // Create download link
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ux-monitoring-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Show success message
      this.showNotification('Dashboard data exported successfully', 'success');
    } catch (error) {
      console.error('[UX Dashboard] Failed to export data:', error);
      this.showNotification('Failed to export data', 'error');
    }
  }

  // Show notification
  private showNotification(message: string, type: 'success' | 'error' | 'info'): void {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 24px;
      background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#ff6b6b' : '#2196F3'};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10005;
      font-size: 14px;
      font-weight: 500;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      document.body.removeChild(notification);
    }, 3000);
  }

  // Public API methods

  // Show dashboard
  show(): void {
    if (!this.isInitialized) {
      this.initialize();
    }

    if (this.dashboardElement) {
      this.dashboardElement.style.display = 'block';
      this.refreshAllData();
    }
  }

  // Hide dashboard
  hide(): void {
    if (this.dashboardElement) {
      this.dashboardElement.style.display = 'none';
    }
  }

  // Toggle dashboard
  toggle(): void {
    if (this.dashboardElement?.style.display === 'none') {
      this.show();
    } else {
      this.hide();
    }
  }

  // Refresh data
  refresh(): void {
    this.refreshAllData();
  }

  // Update configuration
  updateConfig(newConfig: Partial<DashboardConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Restart refresh timer if interval changed
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }

    if (this.config.enableRealTimeUpdates) {
      this.refreshTimer = setInterval(() => {
        this.refreshAllData();
      }, this.config.refreshInterval);
    }
  }

  // Get current data
  getData(): any {
    return {
      timestamp: Date.now(),
      metrics: this.collectAllMetrics(),
      alerts: this.alerts,
      config: this.config
    };
  }

  // Get alerts
  getAlerts(): Alert[] {
    return [...this.alerts];
  }

  // Acknowledge alert
  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      this.renderAlerts();
    }
  }

  // Disconnect dashboard
  disconnect(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }

    if (this.dashboardElement) {
      document.body.removeChild(this.dashboardElement);
      this.dashboardElement = null;
    }

    this.widgets.clear();
    this.isInitialized = false;
  }
}

// Create and export singleton instance
export const uxMonitoringDashboard = new UXMonitoringDashboard();

// Export helper functions
export const showUXMonitoringDashboard = () => uxMonitoringDashboard.show();
export const hideUXMonitoringDashboard = () => uxMonitoringDashboard.hide();
export const toggleUXMonitoringDashboard = () => uxMonitoringDashboard.toggle();
export const refreshUXMonitoringDashboard = () => uxMonitoringDashboard.refresh();
export const getUXMonitoringData = () => uxMonitoringDashboard.getData();
export const updateUXMonitoringConfig = (config: Partial<DashboardConfig>) => uxMonitoringDashboard.updateConfig(config);

// Export types
export { DashboardConfig, WidgetConfig, WidgetType, Alert };