/**
 * Performance Budgets and Automated Alerting System
 * Monitors performance metrics against budgets and sends alerts for violations
 */

interface PerformanceBudget {
  name: string;
  type: 'bundle-size' | 'metric' | 'api' | 'resource' | 'custom';
  threshold: number;
  unit: 'bytes' | 'milliseconds' | 'percentage' | 'count';
  severity: 'critical' | 'warning' | 'info';
  description: string;
  tags?: string[];
  conditions?: BudgetCondition[];
}

interface BudgetCondition {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  value: number;
  context?: string; // device type, network condition, geography, etc.
}

interface PerformanceAlert {
  id: string;
  budgetName: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  currentValue: number;
  thresholdValue: number;
  overage: number;
  percentageOverage: number;
  timestamp: number;
  context: AlertContext;
  acknowledged: boolean;
  resolved: boolean;
  resolvedAt?: number;
  resolvedBy?: string;
}

interface AlertContext {
  sessionId: string;
  userId?: string;
  deviceInfo: DeviceInfo;
  networkInfo: NetworkInfo;
  geoData: GeoData;
  url: string;
  userAgent: string;
  buildVersion?: string;
}

interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet';
  cores: number;
  memory: number;
  hardwareConcurrency: number;
}

interface NetworkInfo {
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

interface GeoData {
  country: string;
  region: string;
  city: string;
  timezone: string;
}

interface AlertNotification {
  type: 'email' | 'slack' | 'webhook' | 'push' | 'in-app';
  enabled: boolean;
  config: NotificationConfig;
  conditions: NotificationCondition[];
}

interface NotificationConfig {
  recipients?: string[];
  webhookUrl?: string;
  template?: string;
  throttle?: number; // Minimum time between notifications in milliseconds
}

interface NotificationCondition {
  severity: 'critical' | 'warning' | 'info';
  budgetType?: string;
  minOverage?: number;
  timeWindow?: number; // Time window in milliseconds
}

const BUDGET_DEFINITIONS: PerformanceBudget[] = [
  // Core Web Vitals budgets
  {
    name: 'Largest Contentful Paint (LCP)',
    type: 'metric',
    threshold: 2500,
    unit: 'milliseconds',
    severity: 'critical',
    description: 'Largest content element should render within 2.5 seconds',
    tags: ['cwv', 'loading', 'critical'],
    conditions: [
      { metric: 'LCP', operator: 'gt', value: 2500, context: 'desktop' },
      { metric: 'LCP', operator: 'gt', value: 4000, context: 'mobile' },
    ]
  },
  {
    name: 'Interaction to Next Paint (INP)',
    type: 'metric',
    threshold: 200,
    unit: 'milliseconds',
    severity: 'critical',
    description: 'Page interactions should respond within 200ms',
    tags: ['cwv', 'interactivity', 'critical'],
  },
  {
    name: 'Cumulative Layout Shift (CLS)',
    type: 'metric',
    threshold: 0.1,
    unit: 'percentage',
    severity: 'critical',
    description: 'Layout shifts should be minimal (CLS < 0.1)',
    tags: ['cwv', 'stability', 'critical'],
  },
  {
    name: 'First Contentful Paint (FCP)',
    type: 'metric',
    threshold: 1800,
    unit: 'milliseconds',
    severity: 'warning',
    description: 'First content should paint within 1.8 seconds',
    tags: ['loading', 'performance'],
  },
  {
    name: 'Time to First Byte (TTFB)',
    type: 'metric',
    threshold: 600,
    unit: 'milliseconds',
    severity: 'warning',
    description: 'Server should respond within 600ms',
    tags: ['network', 'server'],
  },

  // Bundle size budgets
  {
    name: 'Main Bundle Size',
    type: 'bundle-size',
    threshold: 50 * 1024,
    unit: 'bytes',
    severity: 'critical',
    description: 'Main JavaScript bundle should be under 50KB',
    tags: ['bundle', 'javascript', 'critical'],
  },
  {
    name: 'Total Bundle Size',
    type: 'bundle-size',
    threshold: 300 * 1024,
    unit: 'bytes',
    severity: 'critical',
    description: 'Total JavaScript bundles should be under 300KB',
    tags: ['bundle', 'javascript', 'critical'],
  },
  {
    name: 'CSS Bundle Size',
    type: 'bundle-size',
    threshold: 50 * 1024,
    unit: 'bytes',
    severity: 'warning',
    description: 'CSS bundle should be under 50KB',
    tags: ['bundle', 'css', 'performance'],
  },

  // Vendor library budgets
  {
    name: 'React Bundle Size',
    type: 'bundle-size',
    threshold: 150 * 1024,
    unit: 'bytes',
    severity: 'warning',
    description: 'React and related libraries should be under 150KB',
    tags: ['bundle', 'vendor', 'react'],
  },
  {
    name: 'UI Library Bundle Size',
    type: 'bundle-size',
    threshold: 80 * 1024,
    unit: 'bytes',
    severity: 'warning',
    description: 'UI component libraries should be under 80KB',
    tags: ['bundle', 'vendor', 'ui'],
  },

  // API performance budgets
  {
    name: 'API Response Time',
    type: 'api',
    threshold: 2000,
    unit: 'milliseconds',
    severity: 'critical',
    description: 'API calls should complete within 2 seconds',
    tags: ['api', 'network', 'critical'],
    conditions: [
      { metric: 'api_response_time', operator: 'gt', value: 2000, context: '4g' },
      { metric: 'api_response_time', operator: 'gt', value: 4000, context: '3g' },
    ]
  },
  {
    name: 'API Error Rate',
    type: 'api',
    threshold: 1,
    unit: 'percentage',
    severity: 'critical',
    description: 'API error rate should be under 1%',
    tags: ['api', 'reliability', 'critical'],
  },

  // Resource loading budgets
  {
    name: 'Image Load Time',
    type: 'resource',
    threshold: 3000,
    unit: 'milliseconds',
    severity: 'warning',
    description: 'Images should load within 3 seconds',
    tags: ['resource', 'image', 'loading'],
  },
  {
    name: 'Font Load Time',
    type: 'resource',
    threshold: 1000,
    unit: 'milliseconds',
    severity: 'warning',
    description: 'Fonts should load within 1 second',
    tags: ['resource', 'font', 'loading'],
  },

  // Custom application budgets
  {
    name: 'Booking Flow Completion Time',
    type: 'custom',
    threshold: 30000,
    unit: 'milliseconds',
    severity: 'critical',
    description: 'Booking flow should complete within 30 seconds',
    tags: ['business', 'booking', 'critical'],
  },
  {
    name: 'Search Response Time',
    type: 'custom',
    threshold: 500,
    unit: 'milliseconds',
    severity: 'warning',
    description: 'Search functionality should respond within 500ms',
    tags: ['business', 'search', 'ux'],
  },
  {
    name: 'Form Validation Time',
    type: 'custom',
    threshold: 100,
    unit: 'milliseconds',
    severity: 'warning',
    description: 'Form validation should complete within 100ms',
    tags: ['business', 'forms', 'ux'],
  },
];

const NOTIFICATION_CONFIGURATIONS: AlertNotification[] = [
  {
    type: 'email',
    enabled: true,
    config: {
      recipients: ['performance-team@mariaborysevych.com', 'devops@mariaborysevych.com'],
      throttle: 300000, // 5 minutes
      template: 'performance-alert'
    },
    conditions: [
      { severity: 'critical' },
      { severity: 'warning', minOverage: 20 }
    ]
  },
  {
    type: 'slack',
    enabled: true,
    config: {
      webhookUrl: process.env.SLACK_PERFORMANCE_WEBHOOK || '',
      throttle: 600000, // 10 minutes
    },
    conditions: [
      { severity: 'critical' }
    ]
  },
  {
    type: 'webhook',
    enabled: true,
    config: {
      webhookUrl: '/api/webhooks/performance-alerts',
      throttle: 60000, // 1 minute
    },
    conditions: [
      { severity: 'critical' },
      { severity: 'warning' }
    ]
  },
  {
    type: 'in-app',
    enabled: true,
    config: {
      template: 'performance-toast',
      throttle: 300000, // 5 minutes
    },
    conditions: [
      { severity: 'critical' }
    ]
  }
];

class PerformanceBudgetsAndAlerting {
  private budgets: Map<string, PerformanceBudget> = new Map();
  private alerts: Map<string, PerformanceAlert> = new Map();
  private notifications: AlertNotification[] = [];
  private monitoringInterval: number | null = null;
  private isInitialized = false;
  private sessionId: string;
  private lastNotificationTime: Map<string, number> = new Map();

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeBudgets();
    this.initializeNotifications();
  }

  private generateSessionId(): string {
    return `budget_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeBudgets() {
    BUDGET_DEFINITIONS.forEach(budget => {
      this.budgets.set(budget.name, budget);
    });

    // Load custom budgets from configuration
    this.loadCustomBudgets();
  }

  private loadCustomBudgets() {
    try {
      // Load from environment variables or configuration file
      const customBudgets = process.env.CUSTOM_PERFORMANCE_BUDGETS;
      if (customBudgets) {
        const budgets = JSON.parse(customBudgets);
        budgets.forEach((budget: PerformanceBudget) => {
          this.budgets.set(budget.name, budget);
        });
      }
    } catch (error) {
      console.warn('Failed to load custom budgets:', error);
    }
  }

  private initializeNotifications() {
    this.notifications = NOTIFICATION_CONFIGURATIONS.filter(n => n.enabled);

    // Load custom notification configurations
    this.loadCustomNotifications();
  }

  private loadCustomNotifications() {
    try {
      const customNotifications = process.env.CUSTOM_NOTIFICATION_CONFIG;
      if (customNotifications) {
        const notifications = JSON.parse(customNotifications);
        notifications.forEach((notification: AlertNotification) => {
          this.notifications.push(notification);
        });
      }
    } catch (error) {
      console.warn('Failed to load custom notifications:', error);
    }
  }

  public initialize() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    console.log('🚨 Initializing Performance Budgets and Alerting...');

    // Start monitoring
    this.startMonitoring();

    // Set up global error tracking for budget violations
    this.setupBudgetViolationTracking();

    // Register with performance monitoring systems
    this.registerWithMonitoringSystems();

    console.log('✅ Performance budgets and alerting initialized');
  }

  private startMonitoring() {
    // Monitor metrics every 30 seconds
    this.monitoringInterval = window.setInterval(() => {
      this.checkBudgets();
    }, 30000);

    // Check budgets immediately on initialization
    this.checkBudgets();
  }

  private setupBudgetViolationTracking() {
    // Listen for performance metrics from other monitoring systems
    window.addEventListener('performance-metric', (event: any) => {
      this.evaluateMetric(event.detail);
    });
  }

  private registerWithMonitoringSystems() {
    // Register with APM system
    if (window.performanceAPM) {
      window.performanceAPM.onMetric((metric: any) => {
        this.evaluateMetric(metric);
      });
    }

    // Register with RUM system
    if (window.performanceRUM) {
      window.performanceRUM.onMetric((metric: any) => {
        this.evaluateMetric(metric);
      });
    }
  }

  private checkBudgets() {
    const currentMetrics = this.getCurrentMetrics();

    currentMetrics.forEach(metric => {
      this.evaluateMetric(metric);
    });
  }

  private getCurrentMetrics(): any[] {
    const metrics = [];

    // Get Core Web Vitals
    if (window.performance && window.performance.getEntriesByType) {
      // Navigation timing
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        metrics.push({
          name: 'TTFB',
          value: navigation.responseStart - navigation.requestStart,
          unit: 'milliseconds'
        });

        metrics.push({
          name: 'FCP',
          value: this.getFirstContentfulPaint(),
          unit: 'milliseconds'
        });

        metrics.push({
          name: 'LCP',
          value: this.getLargestContentfulPaint(),
          unit: 'milliseconds'
        });
      }

      // Resource timing
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      metrics.push(...this.analyzeResourceMetrics(resources));
    }

    // Get bundle sizes (would need to be provided by build system)
    metrics.push(...this.getBundleMetrics());

    // Get API metrics (would be collected from APM system)
    metrics.push(...this.getAPIMetrics());

    // Get custom application metrics
    metrics.push(...this.getCustomMetrics());

    return metrics;
  }

  private getFirstContentfulPaint(): number {
    const paintEntries = performance.getEntriesByType('paint');
    const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return fcpEntry ? fcpEntry.startTime : 0;
  }

  private getLargestContentfulPaint(): number {
    // This would need to be tracked by the RUM system
    // For now, return placeholder
    return 0;
  }

  private analyzeResourceMetrics(resources: PerformanceResourceTiming[]): any[] {
    const metrics = [];

    // Analyze image load times
    const images = resources.filter(r => /\.(jpg|jpeg|png|gif|webp|avif)$/i.test(r.name));
    if (images.length > 0) {
      const avgImageLoadTime = images.reduce((sum, img) => sum + img.duration, 0) / images.length;
      metrics.push({
        name: 'Image Load Time',
        value: avgImageLoadTime,
        unit: 'milliseconds'
      });
    }

    // Analyze font load times
    const fonts = resources.filter(r => /\.(woff|woff2|ttf|eot)$/i.test(r.name));
    if (fonts.length > 0) {
      const avgFontLoadTime = fonts.reduce((sum, font) => sum + font.duration, 0) / fonts.length;
      metrics.push({
        name: 'Font Load Time',
        value: avgFontLoadTime,
        unit: 'milliseconds'
      });
    }

    return metrics;
  }

  private getBundleMetrics(): any[] {
    // This would typically be provided by the build system
    // For now, return placeholder metrics
    return [
      { name: 'Main Bundle Size', value: 45 * 1024, unit: 'bytes' },
      { name: 'Total Bundle Size', value: 280 * 1024, unit: 'bytes' },
      { name: 'CSS Bundle Size', value: 35 * 1024, unit: 'bytes' },
    ];
  }

  private getAPIMetrics(): any[] {
    // This would be collected from the APM system
    return [
      { name: 'API Response Time', value: 850, unit: 'milliseconds' },
      { name: 'API Error Rate', value: 0.5, unit: 'percentage' },
    ];
  }

  private getCustomMetrics(): any[] {
    // Custom application metrics
    return [
      { name: 'Booking Flow Completion Time', value: 12000, unit: 'milliseconds' },
      { name: 'Search Response Time', value: 180, unit: 'milliseconds' },
      { name: 'Form Validation Time', value: 45, unit: 'milliseconds' },
    ];
  }

  private evaluateMetric(metric: { name: string; value: number; unit: string }) {
    const relevantBudgets = Array.from(this.budgets.values())
      .filter(budget => budget.name === metric.name);

    relevantBudgets.forEach(budget => {
      const violation = this.checkBudgetViolation(budget, metric);
      if (violation) {
        this.createAlert(budget, metric, violation);
      }
    });
  }

  private checkBudgetViolation(budget: PerformanceBudget, metric: { name: string; value: number; unit: string }): any {
    // Convert units if necessary
    const threshold = this.convertUnits(budget.threshold, budget.unit, metric.unit);
    const value = metric.value;

    let isViolation = false;
    let overage = 0;

    switch (budget.type) {
      case 'metric':
      case 'api':
      case 'resource':
      case 'custom':
        // For time-based metrics, lower is better
        if (value > threshold) {
          isViolation = true;
          overage = value - threshold;
        }
        break;

      case 'bundle-size':
        // For bundle sizes, lower is better
        if (value > threshold) {
          isViolation = true;
          overage = value - threshold;
        }
        break;
    }

    return isViolation ? { overage, threshold } : null;
  }

  private convertUnits(value: number, fromUnit: string, toUnit: string): number {
    if (fromUnit === toUnit) return value;

    // Simple unit conversions
    const conversions: Record<string, Record<string, number>> = {
      'bytes': {
        'KB': 1024,
        'MB': 1024 * 1024,
      },
      'milliseconds': {
        'seconds': 1000,
        'minutes': 60 * 1000,
      },
      'percentage': {
        'decimal': 100,
      }
    };

    if (conversions[fromUnit] && conversions[fromUnit][toUnit]) {
      return value * conversions[fromUnit][toUnit];
    }

    return value;
  }

  private createAlert(budget: PerformanceBudget, metric: { name: string; value: number; unit: string }, violation: { overage: number; threshold: number }) {
    const alertId = this.generateAlertId(budget.name);
    const context = this.getAlertContext();

    const alert: PerformanceAlert = {
      id: alertId,
      budgetName: budget.name,
      severity: budget.severity,
      title: `Performance Budget Violation: ${budget.name}`,
      message: this.generateAlertMessage(budget, metric, violation),
      currentValue: metric.value,
      thresholdValue: violation.threshold,
      overage: violation.overage,
      percentageOverage: (violation.overage / violation.threshold) * 100,
      timestamp: Date.now(),
      context,
      acknowledged: false,
      resolved: false,
    };

    // Store alert
    this.alerts.set(alertId, alert);

    // Send notifications
    this.sendNotifications(alert);

    // Store alert for persistence
    this.persistAlert(alert);
  }

  private generateAlertId(budgetName: string): string {
    return `${budgetName}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  private getAlertContext(): AlertContext {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

    return {
      sessionId: this.sessionId,
      userId: this.getUserId(),
      deviceInfo: {
        type: this.getDeviceType(),
        cores: navigator.hardwareConcurrency || 1,
        memory: (navigator as any).deviceMemory || 4,
        hardwareConcurrency: navigator.hardwareConcurrency || 1,
      },
      networkInfo: {
        effectiveType: connection?.effectiveType || 'unknown',
        downlink: connection?.downlink || 0,
        rtt: connection?.rtt || 0,
        saveData: connection?.saveData || false,
      },
      geoData: {
        country: 'unknown',
        region: 'unknown',
        city: 'unknown',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      url: window.location.href,
      userAgent: navigator.userAgent,
      buildVersion: process.env.BUILD_VERSION || 'unknown',
    };
  }

  private getUserId(): string | undefined {
    // Get user ID from authentication system
    return localStorage.getItem('user_id') || undefined;
  }

  private getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
    const width = window.innerWidth;
    const isTouch = 'ontouchstart' in window;

    if (isTouch && width < 768) return 'mobile';
    if (isTouch && width >= 768 && width < 1024) return 'tablet';
    return 'desktop';
  }

  private generateAlertMessage(budget: PerformanceBudget, metric: { name: string; value: number; unit: string }, violation: { overage: number; threshold: number }): string {
    const overagePercentage = ((violation.overage / violation.threshold) * 100).toFixed(1);
    return `${budget.name} exceeded budget by ${overagePercentage}% (${this.formatValue(metric.value, metric.unit)} > ${this.formatValue(violation.threshold, budget.unit)})`;
  }

  private formatValue(value: number, unit: string): string {
    switch (unit) {
      case 'bytes':
        return this.formatBytes(value);
      case 'milliseconds':
        return `${value}ms`;
      case 'percentage':
        return `${value}%`;
      case 'seconds':
        return `${value}s`;
      default:
        return `${value} ${unit}`;
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private sendNotifications(alert: PerformanceAlert) {
    const applicableNotifications = this.notifications.filter(notification =>
      this.shouldSendNotification(notification, alert)
    );

    applicableNotifications.forEach(notification => {
      this.sendNotification(notification, alert);
    });
  }

  private shouldSendNotification(notification: AlertNotification, alert: PerformanceAlert): boolean {
    // Check if alert severity matches notification conditions
    const severityMatch = notification.conditions.some(condition =>
      condition.severity === alert.severity
    );

    if (!severityMatch) return false;

    // Check throttling
    const throttleKey = `${notification.type}_${alert.budgetName}`;
    const lastSent = this.lastNotificationTime.get(throttleKey) || 0;
    const now = Date.now();

    if (notification.config.throttle && (now - lastSent) < notification.config.throttle) {
      return false;
    }

    // Check minimum overage for warnings
    if (alert.severity === 'warning') {
      const minOverageCondition = notification.conditions.find(c => c.minOverage);
      if (minOverageCondition && alert.percentageOverage < minOverageCondition.minOverage) {
        return false;
      }
    }

    this.lastNotificationTime.set(throttleKey, now);
    return true;
  }

  private async sendNotification(notification: AlertNotification, alert: PerformanceAlert) {
    try {
      switch (notification.type) {
        case 'email':
          await this.sendEmailNotification(notification, alert);
          break;
        case 'slack':
          await this.sendSlackNotification(notification, alert);
          break;
        case 'webhook':
          await this.sendWebhookNotification(notification, alert);
          break;
        case 'in-app':
          this.sendInAppNotification(notification, alert);
          break;
      }
    } catch (error) {
      console.error(`Failed to send ${notification.type} notification:`, error);
    }
  }

  private async sendEmailNotification(notification: AlertNotification, alert: PerformanceAlert) {
    const payload = {
      to: notification.config.recipients,
      subject: alert.title,
      template: notification.config.template,
      data: alert,
    };

    await fetch('/api/notifications/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  private async sendSlackNotification(notification: AlertNotification, alert: PerformanceAlert) {
    const payload = {
      text: alert.title,
      attachments: [
        {
          color: alert.severity === 'critical' ? 'danger' : alert.severity === 'warning' ? 'warning' : 'good',
          fields: [
            { title: 'Budget', value: alert.budgetName, short: true },
            { title: 'Current Value', value: this.formatValue(alert.currentValue, 'milliseconds'), short: true },
            { title: 'Threshold', value: this.formatValue(alert.thresholdValue, 'milliseconds'), short: true },
            { title: 'Overage', value: `${alert.percentageOverage.toFixed(1)}%`, short: true },
            { title: 'Device', value: alert.context.deviceInfo.type, short: true },
            { title: 'Network', value: alert.context.networkInfo.effectiveType, short: true },
          ],
          footer: `Session: ${alert.context.sessionId}`,
          ts: Math.floor(alert.timestamp / 1000),
        },
      ],
    };

    await fetch(notification.config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  private async sendWebhookNotification(notification: AlertNotification, alert: PerformanceAlert) {
    const payload = {
      alert,
      timestamp: Date.now(),
    };

    await fetch(notification.config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  private sendInAppNotification(notification: AlertNotification, alert: PerformanceAlert) {
    // Dispatch custom event for in-app notification
    window.dispatchEvent(new CustomEvent('performance-alert', {
      detail: {
        type: 'toast',
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        duration: alert.severity === 'critical' ? 10000 : 5000,
      }
    }));
  }

  private async persistAlert(alert: PerformanceAlert) {
    try {
      await fetch('/api/performance/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert),
      });
    } catch (error) {
      console.warn('Failed to persist alert:', error);
      // Store locally for retry
      this.storeFailedAlert(alert);
    }
  }

  private storeFailedAlert(alert: PerformanceAlert) {
    try {
      const failedAlerts = JSON.parse(localStorage.getItem('failed_performance_alerts') || '[]');
      failedAlerts.push(alert);

      // Keep only last 50 failed alerts
      if (failedAlerts.length > 50) {
        failedAlerts.splice(0, failedAlerts.length - 50);
      }

      localStorage.setItem('failed_performance_alerts', JSON.stringify(failedAlerts));
    } catch (error) {
      console.warn('Failed to store alert for retry:', error);
    }
  }

  // Public API methods
  public addBudget(budget: PerformanceBudget): void {
    this.budgets.set(budget.name, budget);
  }

  public removeBudget(budgetName: string): void {
    this.budgets.delete(budgetName);
  }

  public getBudget(budgetName: string): PerformanceBudget | undefined {
    return this.budgets.get(budgetName);
  }

  public getAllBudgets(): PerformanceBudget[] {
    return Array.from(this.budgets.values());
  }

  public getAlert(alertId: string): PerformanceAlert | undefined {
    return this.alerts.get(alertId);
  }

  public getAllAlerts(): PerformanceAlert[] {
    return Array.from(this.alerts.values());
  }

  public acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      this.updateAlert(alert);
    }
  }

  public resolveAlert(alertId: string, resolvedBy?: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = Date.now();
      alert.resolvedBy = resolvedBy;
      this.updateAlert(alert);
    }
  }

  private async updateAlert(alert: PerformanceAlert) {
    try {
      await fetch(`/api/performance/alerts/${alert.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert),
      });
    } catch (error) {
      console.warn('Failed to update alert:', error);
    }
  }

  public getActiveAlerts(): PerformanceAlert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }

  public getCriticalAlerts(): PerformanceAlert[] {
    return Array.from(this.alerts.values()).filter(alert =>
      alert.severity === 'critical' && !alert.resolved
    );
  }

  public destroy() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    // Send any remaining alerts
    this.alerts.forEach(alert => {
      if (!alert.resolved) {
        this.persistAlert(alert);
      }
    });

    this.isInitialized = false;
  }
}

// Global instance
let performanceBudgetsInstance: PerformanceBudgetsAndAlerting | null = null;

export const initializePerformanceBudgets = () => {
  if (!performanceBudgetsInstance && typeof window !== 'undefined') {
    performanceBudgetsInstance = new PerformanceBudgetsAndAlerting();
    performanceBudgetsInstance.initialize();
  }
  return performanceBudgetsInstance;
};

export const getPerformanceBudgets = () => performanceBudgetsInstance;

export { PerformanceBudgetsAndAlerting };
export default PerformanceBudgetsAndAlerting;