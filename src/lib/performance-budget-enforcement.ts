/**
 * Performance Budget Enforcement and Automated Regression Detection
 * Automated performance monitoring with budget enforcement for Mariia Hub platform
 */

interface PerformanceBudgetConfig {
  enabled: boolean;
  enforcementLevel: 'passive' | 'warning' | 'blocking'; // How strictly to enforce budgets
  autoRegressionDetection: boolean;
  regressionThreshold: number; // percentage change considered regression
  rollbackOnRegression: boolean;
  notificationChannels: string[];
  budgets: PerformanceBudgets;
  adaptiveThresholds: boolean;
  seasonalAdjustments: boolean;
  geographicAdjustments: boolean;
}

interface PerformanceBudgets {
  // Bundle size budgets (in bytes)
  bundles: {
    main: number;
    vendor: number;
    total: number;
    css: number;
    fonts: number;
    images: {
      hero: number;
      gallery: number;
      thumbnails: number;
    };
  };

  // Core Web Vitals budgets (in milliseconds)
  coreWebVitals: {
    lcp: { desktop: number; mobile: number };
    fid: { desktop: number; mobile: number };
    cls: { desktop: number; mobile: number };
    fcp: { desktop: number; mobile: number };
    ttfb: { desktop: number; mobile: number };
    inp: { desktop: number; mobile: number };
  };

  // Resource loading budgets
  resourceLoading: {
    apiResponse: number;
    imageLoad: number;
    fontLoad: number;
    scriptLoad: number;
    styleLoad: number;
  };

  // User experience budgets
  userExperience: {
    timeToInteractive: number;
    firstInputDelay: number;
    blockingTime: number;
    cummulativeLayoutShift: number;
  };

  // Business-specific budgets
  businessMetrics: {
    bookingFlowComplete: number; // milliseconds
    paymentProcessing: number; // milliseconds
    serviceDiscovery: number; // milliseconds
  };
}

interface BudgetViolation {
  id: string;
  budgetType: string;
  metricName: string;
  actualValue: number;
  budgetLimit: number;
  percentageOverBudget: number;
  severity: 'warning' | 'error' | 'critical';
  impact: BudgetImpact;
  recommendations: BudgetRecommendation[];
  timestamp: number;
  resolved: boolean;
  rollbackTriggered: boolean;
}

interface BudgetImpact {
  userExperience: 'low' | 'medium' | 'high' | 'critical';
  businessImpact: 'low' | 'medium' | 'high' | 'critical';
  technicalDebt: 'low' | 'medium' | 'high' | 'critical';
  conversionImpact: number; // percentage
}

interface BudgetRecommendation {
  priority: number;
  category: 'immediate' | 'short-term' | 'medium-term' | 'long-term';
  action: string;
  expectedImprovement: number; // percentage
  effort: 'low' | 'medium' | 'high';
  cost: 'low' | 'medium' | 'high';
  codeSnippet?: string;
}

interface BaselineMetric {
  metricName: string;
  value: number;
  unit: string;
  timestamp: number;
  context: PerformanceContext;
  sampleSize: number;
  confidence: number;
}

interface RegressionAnalysis {
  metricName: string;
  currentValue: number;
  baselineValue: number;
  percentageChange: number;
  isRegression: boolean;
  confidence: number;
  impact: RegressionImpact;
  factors: RegressionFactor[];
  recommendations: RegressionRecommendation[];
}

interface RegressionFactor {
  factor: string;
  influence: number; // 0-1 scale
  category: 'code-change' | 'asset-change' | 'config-change' | 'infrastructure' | 'external';
  evidence: string[];
}

interface RegressionImpact {
  businessImpact: string;
  userImpact: string;
  technicalImpact: string;
  affectedFeatures: string[];
  estimatedUsers: number;
}

interface RegressionRecommendation {
  priority: number;
  action: string;
  category: 'rollback' | 'optimization' | 'investigation' | 'monitoring';
  urgency: 'immediate' | 'high' | 'medium' | 'low';
  estimatedResolution: number; // hours
}

interface PerformanceContext {
  buildNumber?: string;
  gitCommit?: string;
  deploymentId?: string;
  environment: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  connectionType: string;
  geographicRegion: string;
  timestamp: number;
}

interface BudgetReport {
  id: string;
  timestamp: number;
  buildNumber: string;
  environment: string;
  overallScore: number;
  totalBudgets: number;
  violations: BudgetViolation[];
  complianceScore: number;
  trends: BudgetTrend[];
  recommendations: BudgetRecommendation[];
  executiveSummary: string;
  actionItems: ActionItem[];
}

interface BudgetTrend {
  metricName: string;
  trend: 'improving' | 'stable' | 'degrading';
  changeRate: number;
  timeframe: string;
  significance: 'low' | 'medium' | 'high';
}

interface ActionItem {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  assignee?: string;
  dueDate?: number;
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  estimatedEffort: number;
}

class PerformanceBudgetEnforcement {
  private config: PerformanceBudgetConfig;
  private baselines: Map<string, BaselineMetric[]> = new Map();
  private violations: Map<string, BudgetViolation> = new Map();
  private reports: BudgetReport[] = [];
  private regressionHistory: RegressionAnalysis[] = [];
  private budgetHistory: Map<string, { value: number; timestamp: number }[]> = new Map();
  private isInitialized = false;

  constructor(config: Partial<PerformanceBudgetConfig> = {}) {
    this.config = {
      enabled: true,
      enforcementLevel: 'warning',
      autoRegressionDetection: true,
      regressionThreshold: 10, // 10% regression threshold
      rollbackOnRegression: false,
      notificationChannels: ['slack', 'email', 'dashboard'],
      budgets: this.getDefaultBudgets(),
      adaptiveThresholds: true,
      seasonalAdjustments: true,
      geographicAdjustments: true,
      ...config
    };
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('📏 Initializing Performance Budget Enforcement System...');

    try {
      // Load historical baselines
      await this.loadBaselines();

      // Initialize budget monitoring
      this.startBudgetMonitoring();

      // Set up regression detection
      if (this.config.autoRegressionDetection) {
        this.startRegressionDetection();
      }

      // Initialize adaptive thresholds
      if (this.config.adaptiveThresholds) {
        this.initializeAdaptiveThresholds();
      }

      this.isInitialized = true;
      console.log('✅ Performance Budget Enforcement System initialized');

    } catch (error) {
      console.error('❌ Failed to initialize Performance Budget Enforcement System:', error);
      throw error;
    }
  }

  private getDefaultBudgets(): PerformanceBudgets {
    return {
      bundles: {
        main: 50 * 1024,      // 50KB
        vendor: 150 * 1024,   // 150KB
        total: 300 * 1024,    // 300KB
        css: 50 * 1024,       // 50KB
        fonts: 100 * 1024,     // 100KB
        images: {
          hero: 500 * 1024,    // 500KB
          gallery: 200 * 1024, // 200KB
          thumbnails: 50 * 1024 // 50KB
        }
      },
      coreWebVitals: {
        lcp: { desktop: 2500, mobile: 4000 },
        fid: { desktop: 100, mobile: 200 },
        cls: { desktop: 0.1, mobile: 0.15 },
        fcp: { desktop: 1800, mobile: 3000 },
        ttfb: { desktop: 600, mobile: 1000 },
        inp: { desktop: 200, mobile: 300 }
      },
      resourceLoading: {
        apiResponse: 2000,
        imageLoad: 3000,
        fontLoad: 1000,
        scriptLoad: 1500,
        styleLoad: 800
      },
      userExperience: {
        timeToInteractive: 3800,
        firstInputDelay: 100,
        blockingTime: 300,
        cummulativeLayoutShift: 0.1
      },
      businessMetrics: {
        bookingFlowComplete: 30000, // 30 seconds
        paymentProcessing: 5000,   // 5 seconds
        serviceDiscovery: 5000     // 5 seconds
      }
    };
  }

  private async loadBaselines(): Promise<void> {
    try {
      const response = await fetch('/api/analytics/performance-baselines');
      const baselineData = await response.json();

      Object.entries(baselineData).forEach(([metricName, data]: [string, any]) => {
        const baselines: BaselineMetric[] = data.map((item: any) => ({
          metricName,
          value: item.value,
          unit: item.unit || 'ms',
          timestamp: new Date(item.timestamp).getTime(),
          context: item.context,
          sampleSize: item.sampleSize || 1,
          confidence: item.confidence || 0.8
        }));

        this.baselines.set(metricName, baselines);
      });

      console.log(`✅ Loaded ${this.baselines.size} baseline metrics`);

    } catch (error) {
      console.warn('Could not load baselines, using default values:', error);
      this.initializeDefaultBaselines();
    }
  }

  private initializeDefaultBaselines(): void {
    // Create default baselines for key metrics
    const defaultMetrics = [
      { name: 'Largest Contentful Paint', value: 2000, unit: 'ms' },
      { name: 'First Contentful Paint', value: 1500, unit: 'ms' },
      { name: 'Cumulative Layout Shift', value: 0.08, unit: 'score' },
      { name: 'Interaction to Next Paint', value: 120, unit: 'ms' },
      { name: 'Main Bundle Size', value: 45000, unit: 'bytes' },
      { name: 'API Response Time', value: 800, unit: 'ms' }
    ];

    defaultMetrics.forEach(metric => {
      const baseline: BaselineMetric = {
        metricName: metric.name,
        value: metric.value,
        unit: metric.unit,
        timestamp: Date.now(),
        context: this.getDefaultContext(),
        sampleSize: 100,
        confidence: 0.8
      };

      this.baselines.set(metric.name, [baseline]);
    });
  }

  private startBudgetMonitoring(): void {
    // Monitor performance metrics against budgets
    window.addEventListener('performance-metric', async (event: CustomEvent) => {
      await this.checkBudgetViolation(event.detail);
    });

    // Periodic budget analysis
    setInterval(() => {
      this.performBudgetAnalysis();
    }, 10 * 60 * 1000); // Every 10 minutes

    console.log('✅ Budget monitoring started');
  }

  private startRegressionDetection(): void {
    // Detect performance regressions
    setInterval(() => {
      this.detectRegressions();
    }, 30 * 60 * 1000); // Every 30 minutes

    console.log('✅ Regression detection started');
  }

  private initializeAdaptiveThresholds(): void {
    // Continuously adjust thresholds based on historical data
    setInterval(() => {
      this.updateAdaptiveThresholds();
    }, 60 * 60 * 1000); // Every hour

    console.log('✅ Adaptive thresholds initialized');
  }

  public async checkBudgetViolation(metric: any): Promise<void> {
    if (!this.config.enabled) return;

    const violations = await this.evaluateBudgetCompliance(metric);

    for (const violation of violations) {
      await this.handleBudgetViolation(violation);
    }
  }

  private async evaluateBudgetCompliance(metric: any): Promise<BudgetViolation[]> {
    const violations: BudgetViolation[] = [];

    // Check against appropriate budget based on metric name
    const budgetViolation = await this.checkSpecificBudget(metric);
    if (budgetViolation) {
      violations.push(budgetViolation);
    }

    return violations;
  }

  private async checkSpecificBudget(metric: any): Promise<BudgetViolation | null> {
    const metricName = metric.name || metric.metricName;
    const value = metric.value || metric.actualValue;
    const context = metric.context || this.getDefaultContext();

    // Determine which budget category this metric belongs to
    let budgetLimit: number | null = null;
    let budgetType = '';

    // Bundle size checks
    if (metricName.includes('Bundle Size') || metricName.includes('bundle')) {
      if (metricName.includes('Main')) {
        budgetLimit = this.getAdaptedBudget('bundles.main', context);
        budgetType = 'bundles.main';
      } else if (metricName.includes('Vendor')) {
        budgetLimit = this.getAdaptedBudget('bundles.vendor', context);
        budgetType = 'bundles.vendor';
      } else if (metricName.includes('Total')) {
        budgetLimit = this.getAdaptedBudget('bundles.total', context);
        budgetType = 'bundles.total';
      }
    }

    // Core Web Vitals checks
    else if (metricName.includes('Largest Contentful Paint') || metricName.includes('LCP')) {
      const deviceType = context.deviceType;
      budgetLimit = this.config.budgets.coreWebVitals.lcp[deviceType];
      budgetType = 'coreWebVitals.lcp';
    }
    else if (metricName.includes('First Contentful Paint') || metricName.includes('FCP')) {
      const deviceType = context.deviceType;
      budgetLimit = this.config.budgets.coreWebVitals.fcp[deviceType];
      budgetType = 'coreWebVitals.fcp';
    }
    else if (metricName.includes('Interaction to Next Paint') || metricName.includes('INP')) {
      const deviceType = context.deviceType;
      budgetLimit = this.config.budgets.coreWebVitals.inp[deviceType];
      budgetType = 'coreWebVitals.inp';
    }
    else if (metricName.includes('Cumulative Layout Shift') || metricName.includes('CLS')) {
      const deviceType = context.deviceType;
      budgetLimit = this.config.budgets.coreWebVitals.cls[deviceType];
      budgetType = 'coreWebVitals.cls';
    }
    else if (metricName.includes('Time to First Byte') || metricName.includes('TTFB')) {
      const deviceType = context.deviceType;
      budgetLimit = this.config.budgets.coreWebVitals.ttfb[deviceType];
      budgetType = 'coreWebVitals.ttfb';
    }

    // Resource loading checks
    else if (metricName.includes('API Response Time')) {
      budgetLimit = this.config.budgets.resourceLoading.apiResponse;
      budgetType = 'resourceLoading.apiResponse';
    }
    else if (metricName.includes('Image Load')) {
      budgetLimit = this.config.budgets.resourceLoading.imageLoad;
      budgetType = 'resourceLoading.imageLoad';
    }

    // Business metrics checks
    else if (metricName.includes('Booking Flow')) {
      budgetLimit = this.config.budgets.businessMetrics.bookingFlowComplete;
      budgetType = 'businessMetrics.bookingFlowComplete';
    }
    else if (metricName.includes('Payment Processing')) {
      budgetLimit = this.config.budgets.businessMetrics.paymentProcessing;
      budgetType = 'businessMetrics.paymentProcessing';
    }

    if (budgetLimit === null) {
      return null; // No budget defined for this metric
    }

    // Calculate violation
    const percentageOver = ((value - budgetLimit) / budgetLimit) * 100;
    if (percentageOver > 0) {
      const severity = this.calculateViolationSeverity(percentageOver, budgetType);
      const impact = await this.calculateBudgetImpact(metricName, percentageOver, context);

      const violation: BudgetViolation = {
        id: this.generateViolationId(),
        budgetType,
        metricName,
        actualValue: value,
        budgetLimit,
        percentageOverBudget: percentageOver,
        severity,
        impact,
        recommendations: await this.generateBudgetRecommendations(metricName, percentageOver, budgetType),
        timestamp: Date.now(),
        resolved: false,
        rollbackTriggered: false
      };

      return violation;
    }

    return null;
  }

  private getAdaptedBudget(budgetPath: string, context: PerformanceContext): number {
    let baseBudget = this.getNestedBudget(budgetPath);
    if (baseBudget === null) return 0;

    // Apply seasonal adjustments
    if (this.config.seasonalAdjustments) {
      baseBudget = this.applySeasonalAdjustment(baseBudget, context);
    }

    // Apply geographic adjustments
    if (this.config.geographicAdjustments) {
      baseBudget = this.applyGeographicAdjustment(baseBudget, context);
    }

    // Apply device-specific adjustments
    baseBudget = this.applyDeviceAdjustment(baseBudget, context);

    return baseBudget;
  }

  private getNestedBudget(path: string): number | null {
    const parts = path.split('.');
    let current: any = this.config.budgets;

    for (const part of parts) {
      if (current[part] !== undefined) {
        current = current[part];
      } else {
        return null;
      }
    }

    return typeof current === 'number' ? current : null;
  }

  private applySeasonalAdjustment(budget: number, context: PerformanceContext): number {
    // Adjust budget based on seasonal factors (e.g., holiday seasons)
    const month = new Date(context.timestamp).getMonth();

    // Holiday season (November-December) - allow more lenient budgets
    if (month >= 10) {
      return budget * 1.2;
    }

    // Summer season (June-August) - stricter budgets for travel/fitness apps
    if (month >= 5 && month <= 7) {
      return budget * 0.9;
    }

    return budget;
  }

  private applyGeographicAdjustment(budget: number, context: PerformanceContext): number {
    // Adjust based on geographic region
    if (context.geographicRegion.includes('Asia') || context.geographicRegion.includes('India')) {
      return budget * 1.1; // Allow slightly larger budgets for regions with slower connectivity
    }

    return budget;
  }

  private applyDeviceAdjustment(budget: number, context: PerformanceContext): number {
    // Mobile devices often have different performance characteristics
    if (context.deviceType === 'mobile') {
      return budget * 1.3; // Allow larger budgets for mobile
    }

    return budget;
  }

  private calculateViolationSeverity(percentageOver: number, budgetType: string): BudgetViolation['severity'] {
    // Different budgets have different tolerance levels
    let toleranceMultiplier = 1;

    if (budgetType.includes('bundles')) {
      toleranceMultiplier = 1.2; // More lenient for bundle sizes
    } else if (budgetType.includes('coreWebVitals')) {
      toleranceMultiplier = 0.8; // Stricter for Core Web Vitals
    } else if (budgetType.includes('businessMetrics')) {
      toleranceMultiplier = 0.7; // Very strict for business metrics
    }

    const adjustedPercentage = percentageOver / toleranceMultiplier;

    if (adjustedPercentage >= 50) return 'critical';
    if (adjustedPercentage >= 25) return 'error';
    if (adjustedPercentage >= 10) return 'warning';
    return 'warning';
  }

  private async calculateBudgetImpact(
    metricName: string,
    percentageOver: number,
    context: PerformanceContext
  ): Promise<BudgetImpact> {
    const impact: BudgetImpact = {
      userExperience: 'low',
      businessImpact: 'low',
      technicalDebt: 'low',
      conversionImpact: Math.min(percentageOver * 0.5, 20) // Assume 0.5% conversion impact per 1% budget overage
    };

    // Adjust impact based on metric category
    if (metricName.includes('LCP') || metricName.includes('FCP')) {
      impact.userExperience = percentageOver > 50 ? 'critical' : percentageOver > 25 ? 'high' : 'medium';
      impact.businessImpact = percentageOver > 30 ? 'high' : 'medium';
    }

    if (metricName.includes('CLS')) {
      impact.userExperience = percentageOver > 100 ? 'critical' : percentageOver > 50 ? 'high' : 'medium';
    }

    if (metricName.includes('Bundle Size')) {
      impact.technicalDebt = percentageOver > 30 ? 'high' : 'medium';
      impact.userExperience = percentageOver > 40 ? 'medium' : 'low';
    }

    if (metricName.includes('Booking Flow') || metricName.includes('Payment')) {
      impact.businessImpact = percentageOver > 20 ? 'critical' : percentageOver > 10 ? 'high' : 'medium';
      impact.conversionImpact = percentageOver * 0.8; // Higher impact for business-critical metrics
    }

    return impact;
  }

  private async generateBudgetRecommendations(
    metricName: string,
    percentageOver: number,
    budgetType: string
  ): Promise<BudgetRecommendation[]> {
    const recommendations: BudgetRecommendation[] = [];

    // Generate specific recommendations based on metric type
    if (metricName.includes('Bundle Size')) {
      recommendations.push(
        {
          priority: 1,
          category: 'immediate',
          action: 'Analyze bundle composition and remove unused dependencies',
          expectedImprovement: 15,
          effort: 'medium',
          cost: 'low'
        },
        {
          priority: 2,
          category: 'short-term',
          action: 'Implement code splitting and lazy loading for non-critical features',
          expectedImprovement: 25,
          effort: 'high',
          cost: 'medium'
        },
        {
          priority: 3,
          category: 'medium-term',
          action: 'Optimize image assets and implement next-gen formats (WebP, AVIF)',
          expectedImprovement: 10,
          effort: 'medium',
          cost: 'low'
        }
      );
    }

    if (metricName.includes('Largest Contentful Paint')) {
      recommendations.push(
        {
          priority: 1,
          category: 'immediate',
          action: 'Optimize critical rendering path and resource prioritization',
          expectedImprovement: 30,
          effort: 'high',
          cost: 'medium'
        },
        {
          priority: 2,
          category: 'short-term',
          action: 'Implement resource hints (preload, prefetch) for critical resources',
          expectedImprovement: 20,
          effort: 'low',
          cost: 'low'
        }
      );
    }

    if (metricName.includes('Cumulative Layout Shift')) {
      recommendations.push(
        {
          priority: 1,
          category: 'immediate',
          action: 'Specify dimensions for dynamic content and reserve space for ads',
          expectedImprovement: 50,
          effort: 'medium',
          cost: 'low'
        },
        {
          priority: 2,
          category: 'short-term',
          action: 'Avoid layout shifts by using CSS transforms for animations',
          expectedImprovement: 20,
          effort: 'low',
          cost: 'low'
        }
      );
    }

    if (metricName.includes('API Response Time')) {
      recommendations.push(
        {
          priority: 1,
          category: 'immediate',
          action: 'Implement API response caching and database query optimization',
          expectedImprovement: 40,
          effort: 'medium',
          cost: 'medium'
        },
        {
          priority: 2,
          category: 'short-term',
          action: 'Review and optimize slow API endpoints',
          expectedImprovement: 25,
          effort: 'medium',
          cost: 'low'
        }
      );
    }

    return recommendations;
  }

  private async handleBudgetViolation(violation: BudgetViolation): Promise<void> {
    // Store violation
    this.violations.set(violation.id, violation);

    // Update history
    this.updateBudgetHistory(violation.metricName, violation.actualValue);

    // Determine action based on enforcement level
    if (this.config.enforcementLevel === 'blocking' && violation.severity === 'critical') {
      await this.handleBlockingViolation(violation);
    } else if (this.config.enforcementLevel === 'warning' || this.config.enforcementLevel === 'passive') {
      await this.handleWarningViolation(violation);
    }

    // Send notifications
    await this.sendViolationNotifications(violation);

    // Check if rollback should be triggered
    if (this.config.rollbackOnRegression && violation.severity === 'critical') {
      await this.triggerRollback(violation);
    }

    console.log(`📏 Budget violation detected: ${violation.metricName} - ${violation.percentageOverBudget.toFixed(1)}% over budget`);
  }

  private async handleBlockingViolation(violation: BudgetViolation): Promise<void> {
    // Block deployment or trigger immediate actions
    console.log(`🚫 Blocking action triggered for critical budget violation: ${violation.metricName}`);

    // This would integrate with CI/CD pipeline
    await this.notifyBlockingViolation(violation);
  }

  private async handleWarningViolation(violation: BudgetViolation): Promise<void> {
    // Send warnings and create action items
    console.log(`⚠️ Budget warning: ${violation.metricName} - ${violation.percentageOverBudget.toFixed(1)}% over budget`);

    await this.notifyWarningViolation(violation);
  }

  private async sendViolationNotifications(violation: BudgetViolation): Promise<void> {
    for (const channel of this.config.notificationChannels) {
      try {
        await this.sendNotification(channel, violation);
      } catch (error) {
        console.error(`Failed to send ${channel} notification:`, error);
      }
    }
  }

  private async sendNotification(channel: string, violation: BudgetViolation): Promise<void> {
    const notification = {
      type: 'budget_violation',
      channel,
      violation,
      timestamp: Date.now()
    };

    switch (channel) {
      case 'slack':
        await this.sendSlackNotification(notification);
        break;
      case 'email':
        await this.sendEmailNotification(notification);
        break;
      case 'dashboard':
        this.updateDashboard(notification);
        break;
    }
  }

  private async sendSlackNotification(notification: any): Promise<void> {
    const payload = {
      channel: '#performance-alerts',
      text: `📏 Budget Violation Alert`,
      attachments: [
        {
          color: this.getViolationColor(notification.violation.severity),
          fields: [
            { title: 'Metric', value: notification.violation.metricName, short: true },
            { title: 'Budget Type', value: notification.violation.budgetType, short: true },
            { title: 'Actual', value: `${notification.violation.actualValue}`, short: true },
            { title: 'Budget', value: `${notification.violation.budgetLimit}`, short: true },
            { title: 'Over Budget', value: `${notification.violation.percentageOverBudget.toFixed(1)}%`, short: true },
            { title: 'Severity', value: notification.violation.severity, short: true }
          ],
          text: `${notification.violation.metricName} exceeded budget by ${notification.violation.percentageOverBudget.toFixed(1)}%`,
          actions: [
            { type: 'button', text: 'View Details', url: `${window.location.origin}/budgets/${notification.violation.id}` },
            { type: 'button', text: 'Investigate', url: `${window.location.origin}/budgets/investigate/${notification.violation.id}` }
          ]
        }
      ]
    };

    console.log('Budget Slack notification:', payload);
  }

  private async sendEmailNotification(notification: any): Promise<void> {
    const email = {
      to: ['dev-team@mariaborysevych.com'],
      subject: `Budget Violation: ${notification.violation.metricName}`,
      body: this.generateBudgetViolationEmail(notification.violation)
    };

    console.log('Budget Email notification:', email);
  }

  private updateDashboard(notification: any): void {
    // Update performance dashboard with new violation
    window.dispatchEvent(new CustomEvent('budget-violation', {
      detail: notification.violation
    }));
  }

  private generateBudgetViolationEmail(violation: BudgetViolation): string {
    return `
Performance Budget Violation Alert

Metric: ${violation.metricName}
Budget Type: ${violation.budgetType}
Actual Value: ${violation.actualValue}
Budget Limit: ${violation.budgetLimit}
Over Budget: ${violation.percentageOverBudget.toFixed(1)}%
Severity: ${violation.severity}
Time: ${new Date(violation.timestamp).toLocaleString()}

Business Impact:
- User Experience: ${violation.impact.userExperience}
- Business Impact: ${violation.impact.businessImpact}
- Technical Debt: ${violation.impact.technicalDebt}
- Conversion Impact: ${violation.impact.conversionImpact}%

Recommendations:
${violation.recommendations.map(r => `- ${r.action} (${r.expectedImprovement}% improvement, ${r.effort} effort)`).join('\n')}

---
This alert was generated by the Mariia Hub Performance Budget Enforcement System
    `;
  }

  private getViolationColor(severity: string): string {
    const colors = {
      warning: '#ff9500',
      error: '#ff6600',
      critical: '#ff0000'
    };
    return colors[severity as keyof typeof colors] || '#808080';
  }

  private async notifyBlockingViolation(violation: BudgetViolation): Promise<void> {
    // Send PagerDuty alert for critical violations
    const incident = {
      service_key: 'performance-budgets',
      incident_key: violation.id,
      event_type: 'trigger',
      description: `Critical Budget Violation: ${violation.metricName}`,
      details: {
        violation,
        enforcementLevel: this.config.enforcementLevel
      }
    };

    console.log('PagerDuty notification for blocking violation:', incident);
  }

  private async notifyWarningViolation(violation: BudgetViolation): Promise<void> {
    // Create JIRA ticket or other issue tracking
    console.log(`Creating issue for budget violation: ${violation.metricName}`);
  }

  private async triggerRollback(violation: BudgetViolation): Promise<void> {
    console.log(`Triggering rollback due to critical budget violation: ${violation.metricName}`);
    violation.rollbackTriggered = true;

    // Integration with deployment system
    await this.executeRollback(violation);
  }

  private async executeRollback(violation: BudgetViolation): Promise<void> {
    // Execute rollback procedure
    try {
      await fetch('/api/deployment/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: `Budget violation: ${violation.metricName} over budget by ${violation.percentageOverBudget.toFixed(1)}%`,
          violationId: violation.id
        })
      });
    } catch (error) {
      console.error('Rollback failed:', error);
    }
  }

  private updateBudgetHistory(metricName: string, value: number): void {
    if (!this.budgetHistory.has(metricName)) {
      this.budgetHistory.set(metricName, []);
    }

    const history = this.budgetHistory.get(metricName)!;
    history.push({ value, timestamp: Date.now() });

    // Keep only last 100 data points
    if (history.length > 100) {
      history.shift();
    }
  }

  private performBudgetAnalysis(): void {
    console.log('📊 Performing budget analysis...');

    // Analyze current state against budgets
    const analysis = this.analyzeCurrentState();

    // Generate recommendations
    const recommendations = this.generateSystemRecommendations(analysis);

    // Update dashboard
    this.updateDashboardWithAnalysis(analysis, recommendations);

    // Store analysis in reports
    const report: BudgetReport = {
      id: this.generateReportId(),
      timestamp: Date.now(),
      buildNumber: this.getCurrentBuildNumber(),
      environment: this.getCurrentEnvironment(),
      overallScore: analysis.overallScore,
      totalBudgets: analysis.totalBudgets,
      violations: Array.from(this.violations.values()),
      complianceScore: analysis.complianceScore,
      trends: analysis.trends,
      recommendations,
      executiveSummary: this.generateExecutiveSummary(analysis),
      actionItems: this.generateActionItems(analysis.violations)
    };

    this.reports.push(report);

    // Clean up old reports
    if (this.reports.length > 50) {
      this.reports.shift();
    }
  }

  private analyzeCurrentState(): any {
    const totalBudgets = Object.keys(this.config.budgets).length;
    const activeViolations = Array.from(this.violations.values()).filter(v => !v.resolved);
    const overallScore = this.calculateOverallScore(activeViolations);
    const complianceScore = this.calculateComplianceScore(activeViolations);
    const trends = this.analyzeTrends();

    return {
      totalBudgets,
      activeViolations: activeViolations.length,
      overallScore,
      complianceScore,
      trends
    };
  }

  private calculateOverallScore(violations: BudgetViolation[]): number {
    if (violations.length === 0) return 100;

    let score = 100;
    violations.forEach(violation => {
      const severityWeight = {
        warning: 5,
        error: 15,
        critical: 30
      };

      score -= severityWeight[violation.severity];
    });

    return Math.max(0, score);
  }

  private calculateComplianceScore(violations: BudgetViolation[]): number {
    const totalBudgets = Object.keys(this.config.budgets).length * 10; // Each budget type has multiple sub-budgets
    const violationsCount = violations.length;

    return Math.max(0, 100 - (violationsCount / totalBudgets) * 10);
  }

  private analyzeTrends(): BudgetTrend[] {
    const trends: BudgetTrend[] = [];

    this.budgetHistory.forEach((history, metricName) => {
      if (history.length < 10) return;

      const recent = history.slice(-5);
      const older = history.slice(-10, -5);

      const recentAvg = recent.reduce((sum, point) => sum + point.value, 0) / recent.length;
      const olderAvg = older.reduce((sum, point) => sum + point.value, 0) / older.length;

      const changeRate = ((recentAvg - olderAvg) / olderAvg) * 100;
      const trend: BudgetTrend['trend'] = changeRate > 5 ? 'degrading' : changeRate < -5 ? 'improving' : 'stable';

      trends.push({
        metricName,
        trend,
        changeRate: Math.abs(changeRate),
        timeframe: 'last 10 readings',
        significance: Math.abs(changeRate) > 20 ? 'high' : Math.abs(changeRate) > 10 ? 'medium' : 'low'
      });
    });

    return trends;
  }

  private generateSystemRecommendations(analysis: any): BudgetRecommendation[] {
    const recommendations: BudgetRecommendation[] = [];

    if (analysis.activeViolations > 5) {
      recommendations.push({
        priority: 1,
        category: 'immediate',
        action: 'Address multiple budget violations to improve overall system performance',
        expectedImprovement: 25,
        effort: 'high',
        cost: 'high'
      });
    }

    if (analysis.overallScore < 70) {
      recommendations.push({
        priority: 1,
        category: 'short-term',
        action: 'Prioritize performance optimization to improve overall system health',
        expectedImprovement: 20,
        effort: 'high',
        cost: 'medium'
      });
    }

    return recommendations;
  }

  private generateExecutiveSummary(analysis: any): string {
    const severityCount = {
      critical: analysis.activeViolations.filter(v => v.severity === 'critical').length,
      warning: analysis.activeViolations.filter(v => v.severity === 'warning').length,
      error: analysis.activeViolations.filter(v => v.severity === 'error').length
    };

    return `
Performance Budget Executive Summary

Overall Score: ${analysis.overallScore}/100
Compliance Score: ${analysis.complianceScore}/100
Active Violations: ${analysis.activeViolations.length}

Severity Breakdown:
- Critical: ${severityCount.critical}
- Error: ${severityCount.error}
- Warning: ${severityCount.warning}

${analysis.trends.some(t => t.trend === 'degrading') ? '⚠️ Performance trends show degradation in multiple areas' : '✅ Performance trends are generally stable or improving'}
    `.trim();
  }

  private generateActionItems(violations: BudgetViolation[]): ActionItem[] {
    const actionItems: ActionItem[] = [];

    violations.forEach(violation => {
      if (violation.severity === 'critical' || violation.severity === 'error') {
        actionItems.push({
          id: this.generateActionItemId(),
          title: `Resolve ${violation.metricName} budget violation`,
          description: `Reduce ${violation.metricName} from ${violation.actualValue} to under ${violation.budgetLimit}`,
          priority: violation.severity === 'critical' ? 'critical' : 'high',
          dueDate: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
          status: 'pending',
          estimatedEffort: this.estimateEffort(violation)
        });
      }
    });

    return actionItems;
  }

  private estimateEffort(violation: BudgetViolation): number {
    // Estimate effort based on violation severity and type
    const baseEffort = {
      'bundles.main': 8,
      'bundles.total': 12,
      'coreWebVitals.lcp': 6,
      'coreWebVitals.fcp': 4,
      'coreWebVitals.cls': 10,
      'resourceLoading.apiResponse': 6,
      'businessMetrics.bookingFlowComplete': 8
    };

    const baseHours = baseEffort[violation.budgetType as keyof typeof baseEffort] || 4;
    const complexityMultiplier = violation.percentageOverBudget / 10;

    return Math.round(baseHours * complexityMultiplier);
  }

  private updateDashboardWithAnalysis(analysis: any, recommendations: BudgetRecommendation[]): void {
    window.dispatchEvent(new CustomEvent('budget-analysis', {
      detail: {
        analysis,
        recommendations,
        timestamp: Date.now()
      }
    }));
  }

  private detectRegressions(): void {
    console.log('🔍 Detecting performance regressions...');

    this.budgetHistory.forEach((history, metricName) => {
      if (history.length < 5) return;

      const current = history[history.length - 1];
      const baseline = history[Math.max(0, history.length - 5)];

      const percentageChange = ((current.value - baseline.value) / baseline.value) * 100;

      if (Math.abs(percentageChange) >= this.config.regressionThreshold) {
        this.handleRegression(metricName, current, baseline, percentageChange);
      }
    });
  }

  private async handleRegression(
    metricName: string,
    current: { value: number; timestamp: number },
    baseline: { value: number; timestamp: number },
    percentageChange: number
  ): Promise<void> {
    const regressionAnalysis: RegressionAnalysis = {
      metricName,
      currentValue: current.value,
      baselineValue: baseline.value,
      percentageChange,
      isRegression: percentageChange > 0,
      confidence: 0.8,
      impact: await this.analyzeRegressionImpact(metricName, percentageChange),
      factors: this.identifyRegressionFactors(metricName),
      recommendations: await this.generateRegressionRecommendations(metricName, percentageChange)
    };

    this.regressionHistory.push(regressionAnalysis);

    await this.sendRegressionNotification(regressionAnalysis);

    console.log(`📉 Regression detected: ${metricName} changed by ${percentageChange.toFixed(1)}%`);
  }

  private async analyzeRegressionImpact(
    metricName: string,
    percentageChange: number
  ): Promise<RegressionImpact> {
    const impact: RegressionImpact = {
      businessImpact: this.analyzeBusinessImpact(metricName, percentageChange),
      userImpact: this.analyzeUserImpact(metricName, percentageChange),
      technicalImpact: this.analyzeTechnicalImpact(metricName, percentageChange),
      affectedFeatures: this.getAffectedFeatures(metricName),
      estimatedUsers: Math.floor(Math.random() * 1000) + 100 // Mock data
    };

    return impact;
  }

  private analyzeBusinessImpact(metricName: string, percentageChange: number): string {
    if (percentageChange > 20) return 'Critical impact on revenue and conversion';
    if (percentageChange > 10) return 'Significant impact on business metrics';
    return 'Minor impact on business operations';
  }

  private analyzeUserImpact(metricName: string, percentageChange: number): string {
    if (percentageChange > 50) return 'Severe user experience degradation';
    if (percentageChange > 25) return 'Noticeable user experience issues';
    return 'Minor impact on user experience';
  }

  private analyzeTechnicalImpact(metricName: string, percentageChange: number): string {
    if (percentageChange > 30) return 'Major technical debt introduced';
    if (percentageChange > 15) return 'Technical performance regression';
    return 'Minor technical impact';
  }

  private getAffectedFeatures(metricName: string): string[] {
    // Mock implementation - in real system would analyze actual feature impact
    if (metricName.includes('Booking')) {
      return ['Service Discovery', 'Time Slot Selection', 'Payment Processing'];
    }
    if (metricName.includes('API')) {
      return ['User Authentication', 'Service Data', 'Payment Integration'];
    }
    return ['General Platform Features'];
  }

  private identifyRegressionFactors(metricName: string): RegressionFactor[] {
    const factors: RegressionFactor[] = [];

    // This would integrate with git/build systems to identify actual causes
    factors.push({
      factor: 'Code changes',
      influence: 0.7,
      category: 'code-change',
      evidence: ['Recent commits in performance-critical areas']
    });

    factors.push({
      factor: 'Asset updates',
      influence: 0.5,
      category: 'asset-change',
      evidence: ['Recent asset modifications detected']
    });

    return factors;
  }

  private async generateRegressionRecommendations(
    metricName: string,
    percentageChange: number
  ): Promise<RegressionRecommendation[]> {
    const recommendations: RegressionRecommendation[] = [];

    if (percentageChange > 30) {
      recommendations.push({
        priority: 1,
        action: 'Consider immediate rollback of recent changes',
        category: 'rollback',
        urgency: 'immediate',
        estimatedResolution: 2
      });
    }

    recommendations.push({
      priority: 2,
      action: 'Investigate recent code changes affecting ' + metricName,
      category: 'investigation',
      urgency: 'high',
      estimatedResolution: 8
    });

    recommendations.push({
      priority: 3,
      action: 'Implement performance monitoring to prevent future regressions',
      category: 'monitoring',
      urgency: 'medium',
      estimatedResolution: 16
    });

    return recommendations;
  }

  private async sendRegressionNotification(regression: RegressionAnalysis): Promise<void> {
    const notification = {
      type: 'regression',
      regression,
      timestamp: Date.now()
    };

    // Send to all configured notification channels
    for (const channel of this.config.notificationChannels) {
      try {
        await this.sendNotification(channel, notification);
      } catch (error) {
        console.error(`Failed to send regression notification to ${channel}:`, error);
      }
    }

    console.log(`📉 Regression notification sent: ${regression.metricName}`);
  }

  private updateAdaptiveThresholds(): void {
    // Continuously adjust thresholds based on historical performance
    console.log('🔄 Updating adaptive thresholds...');

    // This would analyze long-term performance patterns and adjust budgets accordingly
    this.budgetHistory.forEach((history, metricName) => {
      if (history.length >= 30) {
        const trend = this.calculateLongTermTrend(history);
        if (trend > 0.1) {
          // Performance is degrading, tighten budgets
          this.tightenBudget(metricName, 0.9);
        } else if (trend < -0.1) {
          // Performance is improving, loosen budgets slightly
          this.loosenBudget(metricName, 1.1);
        }
      }
    });
  }

  private calculateLongTermTrend(history: { value: number; timestamp: number }[]): number {
    if (history.length < 10) return 0;

    const n = history.length;
    const firstHalf = history.slice(0, Math.floor(n / 2));
    const secondHalf = history.slice(Math.floor(n / 2));

    const firstAvg = firstHalf.reduce((sum, point) => sum + point.value, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, point) => sum + point.value, 0) / secondHalf.length;

    return ((secondAvg - firstAvg) / firstAvg) * 100;
  }

  private tightenBudget(metricName: string, factor: number): void {
    // Reduce budget limits by specified factor
    // This would update the config.budgets appropriately
    console.log(`Tightening budget for ${metricName} by factor ${factor}`);
  }

  private loosenBudget(metricName: string, factor: number): number {
    // Increase budget limits by specified factor
    console.log(`Loosening budget for ${metricName} by factor ${factor}`);
    return factor;
  }

  private generateViolationId(): string {
    return `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateActionItemId(): string {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentBuildNumber(): string {
    // Get current build number from CI/CD system
    return process.env.BUILD_NUMBER || 'unknown';
  }

  private getCurrentEnvironment(): string {
    return process.env.NODE_ENV || 'development';
  }

  private getDefaultContext(): PerformanceContext {
    return {
      environment: this.getCurrentEnvironment(),
      deviceType: 'desktop',
      connectionType: 'unknown',
      geographicRegion: 'Unknown',
      timestamp: Date.now()
    };
  }

  // Public API methods
  public addBudgetCustomization(budgetType: string, adjustments: Partial<any>): void {
    // Customize specific budgets based on business needs
    console.log(`Customizing budget: ${budgetType}`, adjustments);
  }

  public updateBudgetConfig(updates: Partial<PerformanceBudgetConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  public getCurrentViolations(): BudgetViolation[] {
    return Array.from(this.violations.values());
  }

  public getBudgetComplianceReport(): BudgetReport | null {
    return this.reports.length > 0 ? this.reports[this.reports.length - 1] : null;
  }

  public getBudgetHistory(): Map<string, { value: number; timestamp: number }[]> {
    return new Map(this.budgetHistory);
  }

  public getRegressionHistory(): RegressionAnalysis[] {
    return this.regressionHistory;
  }

  public acknowledgeViolation(violationId: string): void {
    const violation = this.violations.get(violationId);
    if (violation) {
      violation.acknowledged = true;
    }
  }

  public resolveViolation(violationId: string, resolution?: string): void {
    const violation = this.violations.get(violationId);
    if (violation) {
      violation.resolved = true;
      if (resolution) {
        (violation as any).resolution = resolution;
        (violation as any).resolvedAt = Date.now();
      }
      this.violations.delete(violationId);
    }
  }

  public getMetrics(): { [key: string]: any } {
    return {
      enabled: this.config.enabled,
      enforcementLevel: this.config.enforcementLevel,
      totalViolations: this.violations.size,
      regressionHistory: this.regressionHistory.length,
      budgetHistorySize: this.budgetHistory.size,
      reportsGenerated: this.reports.length,
      adaptiveThresholds: this.config.adaptiveThresholds,
      seasonalAdjustments: this.config.seasonalAdjustments,
      geographicAdjustments: this.config.geographicAdjustments
    };
  }

  public destroy(): void {
    this.violations.clear();
    this.reports = [];
    this.regressionHistory = [];
    this.budgetHistory.clear();
    this.baselines.clear();

    this.isInitialized = false;
    console.log('✅ Performance Budget Enforcement System destroyed');
  }
}

export default PerformanceBudgetEnforcement;
export {
  PerformanceBudgetConfig,
  PerformanceBudgets,
  BudgetViolation,
  BudgetImpact,
  BudgetRecommendation,
  BudgetReport,
  RegressionAnalysis,
  PerformanceBudgetEnforcement
};