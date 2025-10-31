/**
 * AI-Powered Intelligent Alerting and Anomaly Detection System
 * Advanced ML-based alerting with predictive capabilities for mariiaborysevych platform
 */

interface AIAlertConfig {
  sensitivity: 'low' | 'medium' | 'high';
  baselineWindow: number; // hours of historical data
  alertCooldown: number; // minutes between similar alerts
  enablePredictiveAlerts: boolean;
  enableCorrelationAnalysis: boolean;
  enableAutoRemediation: boolean;
  learningMode: boolean;
  multiLevelEscalation: boolean;
  noiseReduction: boolean;
  businessImpactAnalysis: boolean;
}

interface PerformanceContext {
  sessionId: string;
  userId?: string;
  url: string;
  userAgent: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  connectionType: string;
  geographicRegion: string;
  pageType: string;
  platform: string;
}

interface AIMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  context: PerformanceContext;
  tags: string[];
  category: 'cwv' | 'business' | 'technical' | 'user-experience' | 'infrastructure';
}

interface AIAnomalyResult {
  isAnomaly: boolean;
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  anomalyType: 'spike' | 'drop' | 'trend' | 'pattern' | 'outlier' | 'seasonal';
  expectedValue: number;
  actualValue: number;
  deviationPercentage: number;
  businessImpact: BusinessImpact;
  explanation: string;
  recommendations: string[];
  correlatedMetrics: string[];
  predictiveScore: number;
}

interface BusinessImpact {
  revenueImpact: number; // estimated revenue impact in percentage
  userExperienceImpact: 'low' | 'medium' | 'high' | 'critical';
  conversionImpact: number; // estimated conversion impact
  supportTicketImpact: number; // estimated increase in support tickets
  operationalImpact: 'low' | 'medium' | 'high' | 'critical';
}

interface IntelligentAlertRule {
  id: string;
  name: string;
  metricPattern: RegExp;
  category: string;
  conditions: AlertCondition[];
  thresholds: DynamicThresholds;
  enabled: boolean;
  priority: number;
  escalation: EscalationPolicy[];
  autoRemediation?: AutoRemediationPolicy;
  businessContext?: BusinessContext;
  correlationRules?: CorrelationRule[];
}

interface AlertCondition {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'ne' | 'gte' | 'lte' | 'rate-of-change' | 'pattern-match';
  value: number | string;
  duration?: number; // minutes
  window?: number; // time window for analysis
  aggregation?: 'avg' | 'sum' | 'max' | 'min' | 'p95' | 'p99';
}

interface DynamicThresholds {
  warning: number;
  critical: number;
  predictive: number;
  adaptive: boolean;
  seasonalAdjustment: boolean;
  geographicAdjustment: boolean;
  deviceAdjustment: boolean;
}

interface EscalationPolicy {
  level: number;
  trigger: string; // condition to trigger this level
  channels: NotificationChannel[];
  delay: number; // minutes
  autoEscalate: boolean;
  businessHoursOnly: boolean;
  onCallRotation?: string[];
}

interface NotificationChannel {
  type: 'email' | 'slack' | 'pagerduty' | 'webhook' | 'sms' | 'in-app' | 'teams';
  config: any;
  enabled: boolean;
  priority: number;
  rateLimit?: {
    maxPerHour: number;
    currentCount: number;
    resetTime: number;
  };
}

interface AutoRemediationPolicy {
  enabled: boolean;
  actions: RemediationAction[];
  conditions: string[];
  rollbackPolicy?: RollbackPolicy;
  successCriteria: string[];
  timeout: number;
}

interface RemediationAction {
  type: 'clear-cache' | 'restart-service' | 'scale-up' | 'scale-down' | 'rollback' | 'enable-cdn' | 'disable-feature' | 'throttle-traffic' | 'circuit-breaker';
  config: any;
  order: number;
  timeout: number;
  rollbackAction?: RemediationAction;
}

interface RollbackPolicy {
  enabled: boolean;
  triggers: string[];
  automatic: boolean;
  timeout: number;
}

interface BusinessContext {
  businessHours: { start: string; end: string; timezone: string };
  peakHours: number[];
  seasonalFactors: string[];
  businessCriticality: 'low' | 'medium' | 'high' | 'critical';
  revenueDependency: number; // 0-1 scale
  userImpactWeight: number; // 0-1 scale
}

interface CorrelationRule {
  primaryMetric: string;
  correlatedMetrics: string[];
  correlationThreshold: number;
  timeWindow: number;
  action: 'group' | 'escalate' | 'suppress' | 'prioritize';
}

interface PredictiveAlert {
  id: string;
  metric: string;
  predictedValue: number;
  timeToThreshold: number; // minutes
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  predictionModel: string;
  factors: PredictionFactor[];
  recommendations: string[];
  preventiveActions?: PreventiveAction[];
}

interface PredictionFactor {
  factor: string;
  weight: number;
  value: number;
  impact: 'positive' | 'negative' | 'neutral';
}

interface PreventiveAction {
  action: string;
  priority: number;
  estimatedEffectiveness: number;
  cost: 'low' | 'medium' | 'high';
  timeToImplement: number;
}

interface AlertGroup {
  id: string;
  name: string;
  alerts: string[];
  rootCause: string;
  businessImpact: BusinessImpact;
  status: 'active' | 'investigating' | 'resolved';
  assignedTo?: string;
  estimatedResolution: number;
}

interface AlertCorrelation {
  primaryAlertId: string;
  correlatedAlerts: string[];
  correlationScore: number;
  correlationType: 'causal' | 'coincidence' | 'cascading';
  timeWindow: number;
  confidence: number;
}

class AIPoweredAlertingSystem {
  private config: AIAlertConfig;
  private metricHistory: Map<string, AIMetric[]> = new Map();
  private alertRules: Map<string, IntelligentAlertRule> = new Map();
  private activeAlerts: Map<string, IntelligentAlert> = new Map();
  private alertHistory: IntelligentAlert[] = [];
  private alertCooldowns: Map<string, number> = new Map();
  private baselines: Map<string, AIBaselineModel> = new Map();
  private predictiveModels: Map<string, PredictiveModel> = new Map();
  private correlationEngine: CorrelationEngine;
  private noiseReductionEngine: NoiseReductionEngine;
  private businessImpactAnalyzer: BusinessImpactAnalyzer;
  private autoRemediationEngine: AutoRemediationEngine;
  private alertGroups: Map<string, AlertGroup> = new Map();
  private isInitialized = false;
  private monitoringIntervals: NodeJS.Timeout[] = [];

  constructor(config: Partial<AIAlertConfig> = {}) {
    this.config = {
      sensitivity: 'medium',
      baselineWindow: 48, // 48 hours
      alertCooldown: 10, // 10 minutes
      enablePredictiveAlerts: true,
      enableCorrelationAnalysis: true,
      enableAutoRemediation: true,
      learningMode: true,
      multiLevelEscalation: true,
      noiseReduction: true,
      businessImpactAnalysis: true,
      ...config
    };

    this.correlationEngine = new CorrelationEngine();
    this.noiseReductionEngine = new NoiseReductionEngine();
    this.businessImpactAnalyzer = new BusinessImpactAnalyzer();
    this.autoRemediationEngine = new AutoRemediationEngine();
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🤖 Initializing AI-Powered Alerting System...');

    try {
      // Initialize intelligent alert rules
      await this.initializeIntelligentAlertRules();

      // Load historical data for baseline and training
      await this.loadHistoricalData();

      // Initialize ML models
      await this.initializeMLModels();

      // Start continuous monitoring
      this.startContinuousMonitoring();

      // Initialize correlation analysis
      if (this.config.enableCorrelationAnalysis) {
        this.startCorrelationAnalysis();
      }

      // Initialize predictive monitoring
      if (this.config.enablePredictiveAlerts) {
        this.startPredictiveMonitoring();
      }

      // Start alert grouping and analysis
      this.startAlertAnalysis();

      this.isInitialized = true;
      console.log('✅ AI-Powered Alerting System initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize AI-Powered Alerting System:', error);
      throw error;
    }
  }

  private async initializeIntelligentAlertRules(): Promise<void> {
    // Core Web Vitals with business context
    this.addAlertRule({
      id: 'lcp-business-impact',
      name: 'LCP Business Impact Alert',
      metricPattern: /Largest Contentful Paint/i,
      category: 'cwv',
      conditions: [
        {
          metric: 'Largest Contentful Paint',
          operator: 'gt',
          value: 4000,
          duration: 5,
          aggregation: 'p95'
        }
      ],
      thresholds: {
        warning: 3000,
        critical: 4000,
        predictive: 3500,
        adaptive: true,
        seasonalAdjustment: true,
        geographicAdjustment: true,
        deviceAdjustment: true
      },
      enabled: true,
      priority: 1,
      escalation: [
        {
          level: 1,
          trigger: 'severity === "critical"',
          channels: [
            { type: 'slack', config: { channel: '#performance-alerts' }, enabled: true, priority: 1 },
            { type: 'in-app', config: { priority: 'high' }, enabled: true, priority: 1 }
          ],
          delay: 0,
          autoEscalate: true,
          businessHoursOnly: false
        },
        {
          level: 2,
          trigger: 'duration > 15 AND severity === "critical"',
          channels: [
            { type: 'pagerduty', config: { serviceKey: 'performance-critical' }, enabled: true, priority: 1 },
            { type: 'email', config: { recipients: ['oncall@mariaborysevych.com'] }, enabled: true, priority: 1 }
          ],
          delay: 15,
          autoEscalate: true,
          businessHoursOnly: false,
          onCallRotation: ['performance-team']
        }
      ],
      autoRemediation: {
        enabled: true,
        actions: [
          { type: 'enable-cdn', config: { aggressive: true }, order: 1, timeout: 300 },
          { type: 'clear-cache', config: { levels: ['browser', 'cdn', 'server'] }, order: 2, timeout: 600 }
        ],
        conditions: ['severity === "critical"', 'deviationPercentage > 50'],
        rollbackPolicy: {
          enabled: true,
          triggers: ['userComplaints > 5', 'conversionRate < 50'],
          automatic: false,
          timeout: 1800
        },
        successCriteria: ['lcpImprovement > 20', 'userSatisfactionStable'],
        timeout: 900
      },
      businessContext: {
        businessHours: { start: '09:00', end: '21:00', timezone: 'Europe/Warsaw' },
        peakHours: [10, 11, 14, 15, 16, 19, 20],
        seasonalFactors: ['holiday-season', 'summer-peak'],
        businessCriticality: 'critical',
        revenueDependency: 0.8,
        userImpactWeight: 0.9
      },
      correlationRules: [
        {
          primaryMetric: 'Largest Contentful Paint',
          correlatedMetrics: ['First Contentful Paint', 'Time to First Byte', 'API Response Time'],
          correlationThreshold: 0.7,
          timeWindow: 300,
          action: 'group'
        }
      ]
    });

    // Business metrics with intelligent thresholds
    this.addAlertRule({
      id: 'booking-funnel-decline',
      name: 'Booking Funnel Decline Detection',
      metricPattern: /Booking Funnel/i,
      category: 'business',
      conditions: [
        {
          metric: 'Booking Funnel Conversion',
          operator: 'rate-of-change',
          value: -20,
          duration: 10,
          window: 30,
          aggregation: 'avg'
        }
      ],
      thresholds: {
        warning: 60,
        critical: 40,
        predictive: 55,
        adaptive: true,
        seasonalAdjustment: true,
        geographicAdjustment: false,
        deviceAdjustment: true
      },
      enabled: true,
      priority: 1,
      escalation: [
        {
          level: 1,
          trigger: 'severity === "critical" OR conversionRate < 30',
          channels: [
            { type: 'slack', config: { channel: '#business-alerts' }, enabled: true, priority: 1 },
            { type: 'email', config: { recipients: ['product-team@mariaborysevych.com'] }, enabled: true, priority: 1 }
          ],
          delay: 0,
          autoEscalate: true,
          businessHoursOnly: true
        }
      ],
      businessContext: {
        businessHours: { start: '09:00', end: '21:00', timezone: 'Europe/Warsaw' },
        peakHours: [10, 11, 14, 15, 16, 19, 20],
        seasonalFactors: ['holiday-season', 'weekend-peak'],
        businessCriticality: 'critical',
        revenueDependency: 1.0,
        userImpactWeight: 0.8
      }
    });

    // Infrastructure metrics with auto-remediation
    this.addAlertRule({
      id: 'api-error-spike',
      name: 'API Error Rate Spike',
      metricPattern: /API Error Rate/i,
      category: 'infrastructure',
      conditions: [
        {
          metric: 'API Error Rate',
          operator: 'gt',
          value: 5,
          duration: 2,
          aggregation: 'avg'
        }
      ],
      thresholds: {
        warning: 2,
        critical: 5,
        predictive: 3,
        adaptive: true,
        seasonalAdjustment: false,
        geographicAdjustment: false,
        deviceAdjustment: false
      },
      enabled: true,
      priority: 1,
      escalation: [
        {
          level: 1,
          trigger: 'severity === "critical"',
          channels: [
            { type: 'pagerduty', config: { serviceKey: 'api-errors' }, enabled: true, priority: 1 },
            { type: 'slack', config: { channel: '#incidents' }, enabled: true, priority: 1 }
          ],
          delay: 0,
          autoEscalate: true,
          businessHoursOnly: false
        }
      ],
      autoRemediation: {
        enabled: true,
        actions: [
          { type: 'circuit-breaker', config: { service: 'booking-api' }, order: 1, timeout: 60 },
          { type: 'scale-up', config: { service: 'booking-api', factor: 2 }, order: 2, timeout: 300 },
          { type: 'restart-service', config: { service: 'booking-api' }, order: 3, timeout: 600 }
        ],
        conditions: ['errorRate > 10', 'responseTime > 5000'],
        rollbackPolicy: {
          enabled: true,
          triggers: ['manualIntervention', 'healthCheckFails'],
          automatic: true,
          timeout: 600
        },
        successCriteria: ['errorRate < 2', 'responseTime < 1000'],
        timeout: 900
      }
    });

    console.log('✅ Intelligent alert rules initialized');
  }

  private async loadHistoricalData(): Promise<void> {
    try {
      // Load comprehensive historical data
      const response = await fetch('/api/analytics/historical-metrics-comprehensive?hours=' + this.config.baselineWindow);
      const historicalData = await response.json();

      // Process data for ML models
      Object.entries(historicalData).forEach(([metricName, data]: [string, any]) => {
        const processedData: AIMetric[] = data.map((item: any) => ({
          id: this.generateId(),
          name: item.name,
          value: item.value,
          unit: item.unit || 'count',
          timestamp: new Date(item.timestamp).getTime(),
          context: item.context || this.getDefaultContext(),
          tags: item.tags || [],
          category: item.category || 'technical'
        }));

        this.metricHistory.set(metricName, processedData);

        // Train baseline models
        const baseline = this.baselines.get(metricName) || new AIBaselineModel(metricName);
        baseline.train(processedData);
        this.baselines.set(metricName, baseline);

        // Train predictive models
        if (this.config.enablePredictiveAlerts) {
          const predictive = this.predictiveModels.get(metricName) || new PredictiveModel(metricName);
          predictive.train(processedData);
          this.predictiveModels.set(metricName, predictive);
        }
      });

      console.log(`✅ Loaded and processed historical data for ${this.metricHistory.size} metrics`);

    } catch (error) {
      console.warn('Could not load historical data, starting with empty baselines:', error);
    }
  }

  private async initializeMLModels(): Promise<void> {
    // Initialize models for all key metric categories
    const keyMetrics = [
      'Largest Contentful Paint',
      'First Contentful Paint',
      'Interaction to Next Paint',
      'Cumulative Layout Shift',
      'Time to First Byte',
      'API Response Time',
      'API Error Rate',
      'Booking Funnel Conversion',
      'Memory Usage',
      'Frame Rate',
      'CPU Usage'
    ];

    keyMetrics.forEach(metricName => {
      if (!this.baselines.has(metricName)) {
        this.baselines.set(metricName, new AIBaselineModel(metricName));
      }

      if (this.config.enablePredictiveAlerts && !this.predictiveModels.has(metricName)) {
        this.predictiveModels.set(metricName, new PredictiveModel(metricName));
      }
    });

    console.log('✅ Machine learning models initialized');
  }

  private startContinuousMonitoring(): void {
    // Monitor incoming metrics
    window.addEventListener('performance-metric', async (event: CustomEvent) => {
      const metric = this.convertToAIMetric(event.detail);
      await this.processMetric(metric);
    });

    // Periodic analysis and cleanup
    const analysisInterval = setInterval(() => {
      this.performPeriodicAnalysis();
    }, 5 * 60 * 1000); // Every 5 minutes

    this.monitoringIntervals.push(analysisInterval);

    console.log('✅ Continuous monitoring started');
  }

  private startCorrelationAnalysis(): void {
    const correlationInterval = setInterval(() => {
      this.performCorrelationAnalysis();
    }, 10 * 60 * 1000); // Every 10 minutes

    this.monitoringIntervals.push(correlationInterval);
    console.log('✅ Correlation analysis started');
  }

  private startPredictiveMonitoring(): void {
    const predictionInterval = setInterval(() => {
      this.performPredictiveAnalysis();
    }, 15 * 60 * 1000); // Every 15 minutes

    this.monitoringIntervals.push(predictionInterval);
    console.log('✅ Predictive monitoring started');
  }

  private startAlertAnalysis(): void {
    const analysisInterval = setInterval(() => {
      this.analyzeActiveAlerts();
      this.performNoiseReduction();
      this.updateAlertGroups();
    }, 2 * 60 * 1000); // Every 2 minutes

    this.monitoringIntervals.push(analysisInterval);
    console.log('✅ Alert analysis started');
  }

  public async processMetric(metric: AIMetric): Promise<void> {
    // Add to history
    if (!this.metricHistory.has(metric.name)) {
      this.metricHistory.set(metric.name, []);
    }

    this.metricHistory.get(metric.name)!.push(metric);

    // Keep history size manageable
    const history = this.metricHistory.get(metric.name)!;
    if (history.length > 2000) {
      history.splice(0, history.length - 2000);
    }

    // Perform anomaly detection
    const anomalyResult = await this.detectAnomaly(metric);

    if (anomalyResult.isAnomaly) {
      await this.handleAnomaly(metric, anomalyResult);
    }

    // Check against intelligent alert rules
    await this.evaluateAlertRules(metric);

    // Update ML models
    this.updateMLModels(metric);

    // Check for correlations
    if (this.config.enableCorrelationAnalysis) {
      this.correlationEngine.addMetric(metric);
    }
  }

  private async detectAnomaly(metric: AIMetric): Promise<AIAnomalyResult> {
    const baseline = this.baselines.get(metric.name);
    if (!baseline || !baseline.isTrained()) {
      return this.getDefaultAnomalyResult(metric);
    }

    // Get baseline prediction
    const expectedValue = baseline.predict(metric.timestamp, metric.context);
    const deviation = Math.abs(metric.value - expectedValue);
    const deviationPercentage = (deviation / expectedValue) * 100;

    // Advanced anomaly detection with multiple algorithms
    const anomalyScores = [
      this.detectStatisticalAnomaly(metric, expectedValue),
      this.detectSeasonalAnomaly(metric),
      this.detectPatternAnomaly(metric),
      this.detectContextualAnomaly(metric)
    ];

    const maxScore = Math.max(...anomalyScores);
    const confidence = Math.min(95, maxScore * 100);

    // Determine if it's an anomaly
    const sensitivityThresholds = {
      low: 0.3,
      medium: 0.5,
      high: 0.7
    };

    const threshold = sensitivityThresholds[this.config.sensitivity];
    const isAnomaly = maxScore > threshold;

    // Determine anomaly type
    const anomalyType = this.classifyAnomalyType(metric, expectedValue, anomalyScores);

    // Calculate business impact
    const businessImpact = await this.businessImpactAnalyzer.analyzeImpact(metric, anomalyResult);

    // Generate explanation and recommendations
    const { explanation, recommendations } = await this.generateAnomalyInsights(
      metric,
      anomalyType,
      deviationPercentage,
      businessImpact
    );

    // Find correlated metrics
    const correlatedMetrics = await this.findCorrelatedMetrics(metric);

    return {
      isAnomaly,
      confidence,
      severity: this.calculateSeverity(deviationPercentage, businessImpact),
      anomalyType,
      expectedValue,
      actualValue: metric.value,
      deviationPercentage,
      businessImpact,
      explanation,
      recommendations,
      correlatedMetrics,
      predictiveScore: this.calculatePredictiveScore(metric)
    };
  }

  private detectStatisticalAnomaly(metric: AIMetric, expectedValue: number): number {
    const history = this.metricHistory.get(metric.name) || [];
    if (history.length < 10) return 0;

    const values = history.slice(-50).map(m => m.value);
    const { mean, stdDev } = this.calculateStatistics(values);

    const zScore = Math.abs((metric.value - mean) / stdDev);
    return Math.min(1, zScore / 3); // Normalize to 0-1
  }

  private detectSeasonalAnomaly(metric: AIMetric): number {
    const hour = new Date(metric.timestamp).getHours();
    const dayOfWeek = new Date(metric.timestamp).getDay();

    const history = this.metricHistory.get(metric.name) || [];
    const sameHourSameDay = history.filter(m => {
      const mDate = new Date(m.timestamp);
      return mDate.getHours() === hour && mDate.getDay() === dayOfWeek;
    });

    if (sameHourSameDay.length < 5) return 0;

    const values = sameHourSameDay.map(m => m.value);
    const { mean, stdDev } = this.calculateStatistics(values);

    const zScore = Math.abs((metric.value - mean) / stdDev);
    return Math.min(1, zScore / 2.5);
  }

  private detectPatternAnomaly(metric: AIMetric): number {
    const history = this.metricHistory.get(metric.name) || [];
    if (history.length < 20) return 0;

    const recent = history.slice(-10);
    const historical = history.slice(-20, -10);

    const recentVariance = this.calculateVariance(recent.map(m => m.value));
    const historicalVariance = this.calculateVariance(historical.map(m => m.value));

    if (historicalVariance === 0) return 0;

    const varianceChange = Math.abs(recentVariance - historicalVariance) / historicalVariance;
    return Math.min(1, varianceChange);
  }

  private detectContextualAnomaly(metric: AIMetric): number {
    // Contextual anomaly detection based on device, geography, etc.
    const history = this.metricHistory.get(metric.name) || [];
    const similarContext = history.filter(m =>
      m.context.deviceType === metric.context.deviceType &&
      m.context.geographicRegion === metric.context.geographicRegion
    );

    if (similarContext.length < 5) return 0;

    const values = similarContext.map(m => m.value);
    const { mean, stdDev } = this.calculateStatistics(values);

    const zScore = Math.abs((metric.value - mean) / stdDev);
    return Math.min(1, zScore / 2);
  }

  private classifyAnomalyType(
    metric: AIMetric,
    expectedValue: number,
    scores: number[]
  ): AIAnomalyResult['anomalyType'] {
    if (metric.value > expectedValue * 1.5) return 'spike';
    if (metric.value < expectedValue * 0.5) return 'drop';
    if (scores[2] > 0.7) return 'pattern'; // Pattern anomaly score
    if (scores[1] > 0.7) return 'seasonal'; // Seasonal anomaly score
    return 'outlier';
  }

  private calculateSeverity(deviationPercentage: number, businessImpact: BusinessImpact): AIAnomalyResult['severity'] {
    let baseScore = 0;

    if (deviationPercentage > 100) baseScore = 4;
    else if (deviationPercentage > 75) baseScore = 3;
    else if (deviationPercentage > 50) baseScore = 2;
    else if (deviationPercentage > 25) baseScore = 1;

    // Adjust based on business impact
    if (businessImpact.operationalImpact === 'critical') baseScore += 1;
    if (businessImpact.revenueImpact > 20) baseScore += 1;
    if (businessImpact.userExperienceImpact === 'critical') baseScore += 1;

    if (baseScore >= 4) return 'critical';
    if (baseScore >= 3) return 'high';
    if (baseScore >= 2) return 'medium';
    return 'low';
  }

  private async generateAnomalyInsights(
    metric: AIMetric,
    anomalyType: AIAnomalyResult['anomalyType'],
    deviationPercentage: number,
    businessImpact: BusinessImpact
  ): Promise<{ explanation: string; recommendations: string[] }> {
    const insights = {
      explanation: '',
      recommendations: [] as string[]
    };

    // Generate detailed explanation
    insights.explanation = `${metric.name} shows ${anomalyType} with ${deviationPercentage.toFixed(1)}% deviation from expected behavior. `;

    if (businessImpact.revenueImpact > 10) {
      insights.explanation += `This is estimated to impact revenue by ${businessImpact.revenueImpact.toFixed(1)}%. `;
    }

    if (businessImpact.userExperienceImpact !== 'low') {
      insights.explanation += `User experience impact is ${businessImpact.userExperienceImpact}. `;
    }

    // Generate contextual recommendations
    insights.recommendations = await this.generateContextualRecommendations(metric, anomalyType, businessImpact);

    return insights;
  }

  private async generateContextualRecommendations(
    metric: AIMetric,
    anomalyType: AIAnomalyResult['anomalyType'],
    businessImpact: BusinessImpact
  ): Promise<string[]> {
    const recommendations: string[] = [];

    // Base recommendations by metric category
    switch (metric.category) {
      case 'cwv':
        recommendations.push(...this.getCWVRecommendations(metric, anomalyType));
        break;
      case 'business':
        recommendations.push(...this.getBusinessRecommendations(metric, businessImpact));
        break;
      case 'infrastructure':
        recommendations.push(...this.getInfrastructureRecommendations(metric, anomalyType));
        break;
      case 'user-experience':
        recommendations.push(...this.getUserExperienceRecommendations(metric, anomalyType));
        break;
    }

    // Add business-context-specific recommendations
    if (businessImpact.revenueImpact > 20) {
      recommendations.push('Consider immediate mitigation due to high revenue impact');
    }

    if (businessImpact.operationalImpact === 'critical') {
      recommendations.push('Escalate to operations team for immediate response');
    }

    return recommendations;
  }

  private getCWVRecommendations(metric: AIMetric, anomalyType: AIAnomalyResult['anomalyType']): string[] {
    const recommendations: string[] = [];

    switch (metric.name) {
      case 'Largest Contentful Paint':
        recommendations.push(
          'Optimize image loading and compression',
          'Implement resource hints (preload, prefetch)',
          'Review and optimize critical rendering path',
          'Consider lazy loading for below-fold content'
        );
        break;
      case 'Interaction to Next Paint':
        recommendations.push(
          'Identify and optimize long-running JavaScript tasks',
          'Implement code splitting for better performance',
          'Consider web workers for heavy computations',
          'Optimize event handlers and reduce main thread blocking'
        );
        break;
      case 'Cumulative Layout Shift':
        recommendations.push(
          'Specify dimensions for images and videos',
          'Reserve space for dynamic content and ads',
          'Avoid inserting content above existing content',
          'Use transform animations instead of animated properties'
        );
        break;
    }

    return recommendations;
  }

  private getBusinessRecommendations(metric: AIMetric, businessImpact: BusinessImpact): string[] {
    const recommendations: string[] = [];

    if (metric.name.includes('Booking Funnel')) {
      recommendations.push(
        'Analyze user behavior at drop-off points',
        'Review booking process for friction points',
        'Test payment processing functionality',
        'Consider A/B testing for conversion optimization'
      );
    }

    if (businessImpact.revenueImpact > 15) {
      recommendations.push(
        'Prioritize fixes based on revenue impact',
        'Consider temporary workarounds if available',
        'Communicate with stakeholders about potential revenue impact'
      );
    }

    return recommendations;
  }

  private getInfrastructureRecommendations(metric: AIMetric, anomalyType: AIAnomalyResult['anomalyType']): string[] {
    const recommendations: string[] = [];

    if (metric.name.includes('API')) {
      recommendations.push(
        'Check service health and dependencies',
        'Review recent deployments for potential issues',
        'Monitor database performance and query optimization',
        'Check rate limiting and authentication systems'
      );
    }

    if (metric.name.includes('Memory') || metric.name.includes('CPU')) {
      recommendations.push(
        'Analyze resource usage patterns',
        'Check for memory leaks or inefficient code',
        'Consider scaling up resources if needed',
        'Profile application to identify bottlenecks'
      );
    }

    return recommendations;
  }

  private getUserExperienceRecommendations(metric: AIMetric, anomalyType: AIAnomalyResult['anomalyType']): string[] {
    const recommendations: string[] = [
      'Monitor user feedback and support tickets',
      'Check for increased error rates or crashes',
      'Review user session data for patterns',
      'Consider user experience testing for affected flows'
    ];

    return recommendations;
  }

  private async findCorrelatedMetrics(metric: AIMetric): Promise<string[]> {
    const correlatedMetrics: string[] = [];

    for (const [metricName, history] of this.metricHistory.entries()) {
      if (metricName === metric.name) continue;

      const correlation = this.calculateCorrelation(metric, history);
      if (correlation > 0.7) {
        correlatedMetrics.push(metricName);
      }
    }

    return correlatedMetrics;
  }

  private calculateCorrelation(metric1: AIMetric, history2: AIMetric[]): number {
    const history1 = this.metricHistory.get(metric1.name) || [];
    if (history1.length < 10 || history2.length < 10) return 0;

    const n = Math.min(history1.length, history2.length);
    const values1 = history1.slice(-n).map(m => m.value);
    const values2 = history2.slice(-n).map(m => m.value);

    const mean1 = values1.reduce((a, b) => a + b, 0) / n;
    const mean2 = values2.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let sum1Sq = 0;
    let sum2Sq = 0;

    for (let i = 0; i < n; i++) {
      const diff1 = values1[i] - mean1;
      const diff2 = values2[i] - mean2;
      numerator += diff1 * diff2;
      sum1Sq += diff1 * diff1;
      sum2Sq += diff2 * diff2;
    }

    if (sum1Sq === 0 || sum2Sq === 0) return 0;

    return Math.abs(numerator / Math.sqrt(sum1Sq * sum2Sq));
  }

  private calculatePredictiveScore(metric: AIMetric): number {
    const predictiveModel = this.predictiveModels.get(metric.name);
    if (!predictiveModel || !predictiveModel.isTrained()) {
      return 0;
    }

    return predictiveModel.calculatePredictiveScore(metric);
  }

  private async handleAnomaly(metric: AIMetric, anomalyResult: AIAnomalyResult): Promise<void> {
    const alertId = `anomaly_${metric.name}_${Date.now()}`;

    // Apply noise reduction
    if (this.config.noiseReduction && this.noiseReductionEngine.shouldSuppress(alertId, anomalyResult)) {
      console.log(`Anomaly suppressed by noise reduction: ${metric.name}`);
      return;
    }

    // Check cooldown
    if (this.isInCooldown(metric.name)) {
      console.log(`Anomaly detected for ${metric.name} but in cooldown period`);
      return;
    }

    // Create intelligent alert
    const alert: IntelligentAlert = {
      id: alertId,
      type: 'anomaly',
      metricName: metric.name,
      severity: anomalyResult.severity,
      title: `AI Anomaly Detected: ${metric.name}`,
      message: anomalyResult.explanation,
      anomalyResult,
      metric,
      timestamp: Date.now(),
      acknowledged: false,
      resolved: false,
      businessImpact: anomalyResult.businessImpact,
      correlatedAlerts: [],
      groupId: null,
      priority: this.calculateAlertPriority(anomalyResult),
      predictiveScore: anomalyResult.predictiveScore
    };

    this.activeAlerts.set(alertId, alert);
    this.alertHistory.push(alert);
    this.setCooldown(metric.name);

    // Check for alert correlation
    await this.checkAlertCorrelation(alert);

    // Send notifications
    await this.sendIntelligentAlert(alert);

    // Attempt auto-remediation
    if (this.config.enableAutoRemediation) {
      await this.attemptAutoRemediation(alert);
    }

    // Emit anomaly event
    window.dispatchEvent(new CustomEvent('ai-performance-anomaly', {
      detail: alert
    }));

    console.log(`🤖 AI Anomaly detected: ${metric.name} - ${anomalyResult.explanation}`);
  }

  private async evaluateAlertRules(metric: AIMetric): Promise<void> {
    const applicableRules = Array.from(this.alertRules.values()).filter(rule =>
      rule.enabled && rule.metricPattern.test(metric.name)
    );

    for (const rule of applicableRules) {
      await this.evaluateAlertRule(rule, metric);
    }
  }

  private async evaluateAlertRule(rule: IntelligentAlertRule, metric: AIMetric): Promise<void> {
    const conditionsMet = await this.evaluateConditions(rule.conditions, metric);

    if (!conditionsMet) return;

    // Check cooldown
    if (this.isInCooldown(rule.id)) {
      return;
    }

    // Create alert
    const alert: IntelligentAlert = {
      id: `rule_${rule.id}_${Date.now()}`,
      type: 'rule',
      ruleId: rule.id,
      ruleName: rule.name,
      metricName: metric.name,
      severity: 'medium', // Will be calculated below
      title: `Alert: ${rule.name}`,
      message: `${metric.name} triggered alert condition`,
      metric,
      timestamp: Date.now(),
      acknowledged: false,
      resolved: false,
      businessImpact: await this.businessImpactAnalyzer.analyzeImpact(metric, null),
      correlatedAlerts: [],
      groupId: null,
      priority: rule.priority,
      predictiveScore: 0
    };

    // Determine severity based on rule thresholds and context
    alert.severity = this.determineRuleSeverity(rule, metric);

    this.activeAlerts.set(alert.id, alert);
    this.setCooldown(rule.id);

    // Send notifications
    await this.sendRuleAlert(rule, alert);

    // Attempt auto-remediation
    if (rule.autoRemediation && rule.autoRemediation.enabled) {
      await this.attemptRuleAutoRemediation(rule, alert);
    }

    console.log(`🤖 Alert rule triggered: ${rule.name} - ${metric.name}`);
  }

  private async evaluateConditions(conditions: AlertCondition[], metric: AIMetric): Promise<boolean> {
    for (const condition of conditions) {
      if (!(await this.evaluateCondition(condition, metric))) {
        return false;
      }
    }
    return true;
  }

  private async evaluateCondition(condition: AlertCondition, metric: AIMetric): Promise<boolean> {
    // Get metric value based on aggregation
    let value = metric.value;

    if (condition.window && condition.aggregation) {
      const history = this.metricHistory.get(metric.name) || [];
      const recentHistory = history.filter(m =>
        metric.timestamp - m.timestamp <= condition.window! * 60 * 1000
      );

      if (recentHistory.length === 0) return false;

      switch (condition.aggregation) {
        case 'avg':
          value = recentHistory.reduce((sum, m) => sum + m.value, 0) / recentHistory.length;
          break;
        case 'max':
          value = Math.max(...recentHistory.map(m => m.value));
          break;
        case 'min':
          value = Math.min(...recentHistory.map(m => m.value));
          break;
        case 'p95':
          value = this.calculatePercentile(recentHistory.map(m => m.value), 95);
          break;
        case 'p99':
          value = this.calculatePercentile(recentHistory.map(m => m.value), 99);
          break;
      }
    }

    // Evaluate condition
    switch (condition.operator) {
      case 'gt':
        return value > (condition.value as number);
      case 'lt':
        return value < (condition.value as number);
      case 'gte':
        return value >= (condition.value as number);
      case 'lte':
        return value <= (condition.value as number);
      case 'eq':
        return value === (condition.value as number);
      case 'ne':
        return value !== (condition.value as number);
      case 'rate-of-change':
        return this.evaluateRateOfChange(metric, condition.value as number);
      case 'pattern-match':
        return new RegExp(condition.value as string).test(metric.name);
      default:
        return false;
    }
  }

  private evaluateRateOfChange(metric: AIMetric, threshold: number): boolean {
    const history = this.metricHistory.get(metric.name) || [];
    if (history.length < 2) return false;

    const previousValue = history[history.length - 2].value;
    const currentValue = metric.value;
    const rateOfChange = ((currentValue - previousValue) / previousValue) * 100;

    return Math.abs(rateOfChange) > Math.abs(threshold);
  }

  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  private determineRuleSeverity(rule: IntelligentAlertRule, metric: AIMetric): IntelligentAlert['severity'] {
    // Use dynamic thresholds if available
    const thresholds = rule.thresholds;
    const value = metric.value;

    if (value >= thresholds.critical) return 'critical';
    if (value >= thresholds.warning) return 'high';
    return 'medium';
  }

  private calculateAlertPriority(anomalyResult: AIAnomalyResult): number {
    let priority = 1;

    // Base priority from severity
    const severityWeights = { low: 1, medium: 2, high: 3, critical: 4 };
    priority += severityWeights[anomalyResult.severity];

    // Adjust for business impact
    if (anomalyResult.businessImpact.revenueImpact > 20) priority += 2;
    if (anomalyResult.businessImpact.operationalImpact === 'critical') priority += 2;
    if (anomalyResult.businessImpact.userExperienceImpact === 'critical') priority += 1;

    // Adjust for predictive score
    if (anomalyResult.predictiveScore > 0.8) priority += 1;

    return priority;
  }

  private async checkAlertCorrelation(alert: IntelligentAlert): Promise<void> {
    const correlations = await this.correlationEngine.findCorrelations(alert, Array.from(this.activeAlerts.values()));

    for (const correlation of correlations) {
      if (correlation.confidence > 0.8) {
        // Group related alerts
        await this.groupAlerts(alert, correlation.relatedAlerts);
      }
    }
  }

  private async groupAlerts(alert: IntelligentAlert, relatedAlertIds: string[]): Promise<void> {
    const groupId = `group_${Date.now()}`;

    // Create or update alert group
    const group: AlertGroup = {
      id: groupId,
      name: `Alert Group: ${alert.metricName}`,
      alerts: [alert.id, ...relatedAlertIds],
      rootCause: 'Under investigation',
      businessImpact: alert.businessImpact,
      status: 'active',
      estimatedResolution: 30 // minutes
    };

    this.alertGroups.set(groupId, group);

    // Update alerts with group ID
    alert.groupId = groupId;
    relatedAlertIds.forEach(alertId => {
      const relatedAlert = this.activeAlerts.get(alertId);
      if (relatedAlert) {
        relatedAlert.groupId = groupId;
        relatedAlert.correlatedAlerts.push(alert.id);
      }
    });
  }

  private async sendIntelligentAlert(alert: IntelligentAlert): Promise<void> {
    // Determine appropriate channels based on severity, priority, and business context
    const channels = await this.selectNotificationChannels(alert);

    for (const channel of channels) {
      try {
        await this.sendNotification(channel, alert);
      } catch (error) {
        console.error(`Failed to send alert to ${channel.type}:`, error);
      }
    }

    // Store in analytics
    try {
      await fetch('/api/analytics/ai-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert)
      });
    } catch (error) {
      console.warn('Could not store alert in analytics:', error);
    }
  }

  private async sendRuleAlert(rule: IntelligentAlertRule, alert: IntelligentAlert): Promise<void> {
    // Use rule-specific escalation policy
    const applicableEscalations = rule.escalation.filter(level =>
      this.evaluateEscalationTrigger(level.trigger, alert)
    );

    for (const escalation of applicableEscalations) {
      // Check business hours restriction
      if (escalation.businessHoursOnly && !this.isBusinessHours(rule.businessContext)) {
        continue;
      }

      for (const channel of escalation.channels) {
        if (channel.enabled && this.checkRateLimit(channel)) {
          try {
            await this.sendNotification(channel, alert);
          } catch (error) {
            console.error(`Failed to send rule alert to ${channel.type}:`, error);
          }
        }
      }
    }
  }

  private async selectNotificationChannels(alert: IntelligentAlert): Promise<NotificationChannel[]> {
    const channels: NotificationChannel[] = [];

    // Base channels by severity
    if (alert.severity === 'critical') {
      channels.push(
        { type: 'pagerduty', config: { serviceKey: 'ai-alerts-critical' }, enabled: true, priority: 1 },
        { type: 'slack', config: { channel: '#critical-alerts' }, enabled: true, priority: 1 },
        { type: 'email', config: { recipients: ['oncall@mariaborysevych.com'] }, enabled: true, priority: 1 }
      );
    } else if (alert.severity === 'high') {
      channels.push(
        { type: 'slack', config: { channel: '#performance-alerts' }, enabled: true, priority: 2 },
        { type: 'in-app', config: { priority: 'high' }, enabled: true, priority: 2 }
      );
    } else {
      channels.push(
        { type: 'in-app', config: { priority: 'medium' }, enabled: true, priority: 3 }
      );
    }

    // Add channels based on business impact
    if (alert.businessImpact.revenueImpact > 15) {
      channels.push(
        { type: 'email', config: { recipients: ['leadership@mariaborysevych.com'] }, enabled: true, priority: 1 }
      );
    }

    return channels;
  }

  private evaluateEscalationTrigger(trigger: string, alert: IntelligentAlert): boolean {
    // Simple trigger evaluation - can be made more sophisticated
    if (trigger.includes('severity')) {
      const severity = trigger.split('===')[1]?.trim().replace(/['"]/g, '');
      return alert.severity === severity;
    }

    if (trigger.includes('duration')) {
      const duration = parseInt(trigger.split('>')[1]?.trim());
      const elapsed = (Date.now() - alert.timestamp) / (1000 * 60); // minutes
      return elapsed > duration;
    }

    return false;
  }

  private isBusinessHours(businessContext?: BusinessContext): boolean {
    if (!businessContext) return true;

    const now = new Date();
    const [startHour, startMin] = businessContext.businessHours.start.split(':').map(Number);
    const [endHour, endMin] = businessContext.businessHours.end.split(':').map(Number);

    const currentTime = now.getHours() * 60 + now.getMinutes();
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    return currentTime >= startTime && currentTime <= endTime;
  }

  private checkRateLimit(channel: NotificationChannel): boolean {
    if (!channel.rateLimit) return true;

    const now = Date.now();
    if (now > channel.rateLimit.resetTime) {
      channel.rateLimit.currentCount = 0;
      channel.rateLimit.resetTime = now + (60 * 60 * 1000); // 1 hour
    }

    if (channel.rateLimit.currentCount >= channel.rateLimit.maxPerHour) {
      return false;
    }

    channel.rateLimit.currentCount++;
    return true;
  }

  private async sendNotification(channel: NotificationChannel, alert: IntelligentAlert): Promise<void> {
    const notification = {
      alert,
      channel: channel.type,
      config: channel.config,
      timestamp: Date.now()
    };

    switch (channel.type) {
      case 'slack':
        await this.sendSlackNotification(channel.config, alert);
        break;
      case 'email':
        await this.sendEmailNotification(channel.config, alert);
        break;
      case 'pagerduty':
        await this.sendPagerDutyNotification(channel.config, alert);
        break;
      case 'webhook':
        await this.sendWebhookNotification(channel.config, alert);
        break;
      case 'sms':
        await this.sendSMSNotification(channel.config, alert);
        break;
      case 'in-app':
        this.sendInAppNotification(alert);
        break;
      case 'teams':
        await this.sendTeamsNotification(channel.config, alert);
        break;
    }
  }

  private async sendSlackNotification(config: any, alert: IntelligentAlert): Promise<void> {
    const payload = {
      channel: config.channel,
      text: `🤖 AI Alert: ${alert.title}`,
      attachments: [
        {
          color: this.getSeverityColor(alert.severity),
          fields: [
            { title: 'Metric', value: alert.metricName, short: true },
            { title: 'Value', value: alert.metric.value.toString(), short: true },
            { title: 'Severity', value: alert.severity, short: true },
            { title: 'Priority', value: alert.priority.toString(), short: true },
            { title: 'Predictive Score', value: `${(alert.predictiveScore * 100).toFixed(1)}%`, short: true }
          ],
          text: alert.message,
          actions: [
            { type: 'button', text: 'Acknowledge', url: `${window.location.origin}/alerts/${alert.id}/acknowledge` },
            { type: 'button', text: 'View Details', url: `${window.location.origin}/alerts/${alert.id}` }
          ]
        }
      ]
    };

    console.log('AI Slack notification:', payload);
  }

  private async sendEmailNotification(config: any, alert: IntelligentAlert): Promise<void> {
    const email = {
      to: config.recipients,
      subject: `AI Alert: ${alert.title}`,
      body: this.generateAIEmailBody(alert)
    };

    console.log('AI Email notification:', email);
  }

  private async sendPagerDutyNotification(config: any, alert: IntelligentAlert): Promise<void> {
    const incident = {
      service_key: config.serviceKey,
      incident_key: alert.id,
      event_type: 'trigger',
      description: alert.title,
      details: {
        alert,
        businessImpact: alert.businessImpact,
        predictiveScore: alert.predictiveScore
      }
    };

    console.log('AI PagerDuty notification:', incident);
  }

  private async sendWebhookNotification(config: any, alert: IntelligentAlert): Promise<void> {
    const payload = {
      ...config.payload,
      alert,
      businessImpact: alert.businessImpact,
      timestamp: Date.now()
    };

    await fetch(config.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  private async sendSMSNotification(config: any, alert: IntelligentAlert): Promise<void> {
    console.log('AI SMS notification:', { to: config.phoneNumber, message: alert.title });
  }

  private sendInAppNotification(alert: IntelligentAlert): void {
    window.dispatchEvent(new CustomEvent('ai-performance-alert', {
      detail: {
        type: 'notification',
        title: alert.title,
        message: alert.message,
        severity: alert.severity,
        priority: alert.priority,
        businessImpact: alert.businessImpact,
        predictiveScore: alert.predictiveScore,
        timestamp: alert.timestamp,
        actions: [
          { label: 'View Details', action: 'view-details' },
          { label: 'Acknowledge', action: 'acknowledge' },
          { label: 'Investigate', action: 'investigate' }
        ]
      }
    }));
  }

  private async sendTeamsNotification(config: any, alert: IntelligentAlert): Promise<void> {
    const payload = {
      type: 'message',
      attachments: [
        {
          contentType: 'application/vnd.microsoft.card.adaptive',
          content: {
            type: 'AdaptiveCard',
            version: '1.0',
            body: [
              {
                type: 'TextBlock',
                text: `🤖 AI Alert: ${alert.title}`,
                size: 'large',
                weight: 'bolder',
                color: this.getSeverityColor(alert.severity).replace('#', '')
              },
              {
                type: 'TextBlock',
                text: alert.message,
                wrap: true
              }
            ]
          }
        }
      ]
    };

    console.log('AI Teams notification:', payload);
  }

  private generateAIEmailBody(alert: IntelligentAlert): string {
    const body = `
AI-Powered Performance Alert - ${alert.title}

Metric: ${alert.metricName}
Value: ${alert.metric.value}
Severity: ${alert.severity}
Priority: ${alert.priority}
Predictive Score: ${(alert.predictiveScore * 100).toFixed(1)}%
Time: ${new Date(alert.timestamp).toLocaleString()}

${alert.message}

Business Impact:
- Revenue Impact: ${alert.businessImpact.revenueImpact.toFixed(1)}%
- User Experience Impact: ${alert.businessImpact.userExperienceImpact}
- Operational Impact: ${alert.businessImpact.operationalImpact}

${alert.anomalyResult?.recommendations ? '\nAI Recommendations:\n' + alert.anomalyResult.recommendations.map(r => `- ${r}`).join('\n') : ''}

---
This alert was generated by the mariiaborysevych AI Performance Monitoring System
    `;

    return body;
  }

  private getSeverityColor(severity: string): string {
    const colors = {
      low: '#36a64f',     // green
      medium: '#ff9500',  // orange
      high: '#ff6600',    // red-orange
      critical: '#ff0000' // red
    };
    return colors[severity as keyof typeof colors] || '#808080';
  }

  private async attemptAutoRemediation(alert: IntelligentAlert): Promise<void> {
    if (!this.config.enableAutoRemediation) return;

    try {
      const remediationPlan = await this.autoRemediationEngine.createPlan(alert);
      if (remediationPlan) {
        await this.autoRemediationEngine.executePlan(remediationPlan);
      }
    } catch (error) {
      console.error('Auto-remediation failed:', error);
    }
  }

  private async attemptRuleAutoRemediation(rule: IntelligentAlertRule, alert: IntelligentAlert): Promise<void> {
    if (!rule.autoRemediation || !rule.autoRemediation.enabled) return;

    try {
      const remediationPlan = this.autoRemediationEngine.createPlanFromRule(rule, alert);
      if (remediationPlan) {
        await this.autoRemediationEngine.executePlan(remediationPlan);
      }
    } catch (error) {
      console.error('Rule auto-remediation failed:', error);
    }
  }

  private updateMLModels(metric: AIMetric): void {
    // Update baseline model
    const baseline = this.baselines.get(metric.name);
    if (baseline) {
      baseline.addMetric(metric);
    }

    // Update predictive model
    if (this.config.enablePredictiveAlerts) {
      const predictive = this.predictiveModels.get(metric.name);
      if (predictive) {
        predictive.addMetric(metric);
      }
    }
  }

  private async performPeriodicAnalysis(): Promise<void> {
    // Update baselines
    this.baselines.forEach(baseline => baseline.update());

    // Update predictive models
    if (this.config.enablePredictiveAlerts) {
      this.predictiveModels.forEach(model => model.update());
    }

    // Clean up old data
    this.cleanupOldData();
  }

  private async performCorrelationAnalysis(): Promise<void> {
    await this.correlationEngine.analyzeCorrelations(Array.from(this.activeAlerts.values()));
  }

  private async performPredictiveAnalysis(): Promise<void> {
    for (const [metricName, model] of this.predictiveModels) {
      try {
        const prediction = await model.predict(60); // Predict 60 minutes ahead
        if (prediction.alert) {
          await this.sendPredictiveAlert(metricName, prediction);
        }
      } catch (error) {
        console.error(`Predictive analysis failed for ${metricName}:`, error);
      }
    }
  }

  private async sendPredictiveAlert(metricName: string, prediction: any): Promise<void> {
    const alert: IntelligentAlert = {
      id: `predictive_${metricName}_${Date.now()}`,
      type: 'predictive',
      metricName,
      severity: prediction.severity,
      title: `Predictive Alert: ${metricName}`,
      message: `Predicted to exceed threshold in ${prediction.timeToThreshold} minutes`,
      metric: this.createMockMetric(metricName, prediction.predictedValue),
      timestamp: Date.now(),
      acknowledged: false,
      resolved: false,
      businessImpact: await this.businessImpactAnalyzer.analyzePredictionImpact(prediction),
      correlatedAlerts: [],
      groupId: null,
      priority: this.calculatePredictiveAlertPriority(prediction),
      predictiveScore: prediction.confidence
    };

    this.activeAlerts.set(alert.id, alert);
    await this.sendIntelligentAlert(alert);

    console.log(`🔮 Predictive alert: ${metricName} - ${prediction.timeToThreshold} minutes to threshold`);
  }

  private calculatePredictiveAlertPriority(prediction: any): number {
    let priority = 2; // Base priority for predictive alerts

    if (prediction.severity === 'critical') priority += 2;
    if (prediction.timeToThreshold < 30) priority += 1; // Soon to occur
    if (prediction.confidence > 0.8) priority += 1; // High confidence

    return priority;
  }

  private async analyzeActiveAlerts(): Promise<void> {
    // Analyze active alerts for patterns and insights
    const activeAlerts = Array.from(this.activeAlerts.values());

    // Check for alert fatigue
    const alertFatigue = this.detectAlertFatigue(activeAlerts);
    if (alertFatigue) {
      await this.handleAlertFatigue(alertFatigue);
    }

    // Update alert statuses
    activeAlerts.forEach(alert => {
      if (alert.timestamp < Date.now() - (24 * 60 * 60 * 1000)) {
        // Auto-resolve old alerts
        alert.resolved = true;
        this.activeAlerts.delete(alert.id);
      }
    });
  }

  private detectAlertFatigue(alerts: IntelligentAlert[]): { type: string; affectedUsers: number } | null {
    // Detect patterns that might indicate alert fatigue
    const recentAlerts = alerts.filter(a =>
      Date.now() - a.timestamp < (60 * 60 * 1000) // Last hour
    );

    if (recentAlerts.length > 10) {
      return { type: 'high-frequency', affectedUsers: recentAlerts.length };
    }

    return null;
  }

  private async handleAlertFatigue(fatigue: { type: string; affectedUsers: number }): Promise<void> {
    console.log(`Alert fatigue detected: ${fatigue.type}, affecting ${fatigue.affectedUsers} users`);

    // Implement fatigue mitigation strategies
    // This could include grouping alerts, adjusting sensitivity, etc.
  }

  private performNoiseReduction(): void {
    if (!this.config.noiseReduction) return;

    this.noiseReductionEngine.analyzeAndFilter(Array.from(this.activeAlerts.values()));
  }

  private updateAlertGroups(): void {
    // Update alert group statuses and estimated resolutions
    this.alertGroups.forEach(group => {
      const groupAlerts = group.alerts.map(id => this.activeAlerts.get(id)).filter(Boolean) as IntelligentAlert[];

      if (groupAlerts.length === 0 || groupAlerts.every(a => a.resolved)) {
        group.status = 'resolved';
      } else if (groupAlerts.some(a => a.assignedTo)) {
        group.status = 'investigating';
      }

      // Update estimated resolution time based on alert severity and priority
      const maxSeverity = groupAlerts.reduce((max, alert) =>
        this.getSeverityWeight(alert.severity) > this.getSeverityWeight(max) ? alert.severity : max,
        'low'
      );

      group.estimatedResolution = this.calculateEstimatedResolution(maxSeverity, groupAlerts.length);
    });
  }

  private getSeverityWeight(severity: string): number {
    const weights = { low: 1, medium: 2, high: 3, critical: 4 };
    return weights[severity as keyof typeof weights] || 0;
  }

  private calculateEstimatedResolution(severity: string, alertCount: number): number {
    const baseTime = { low: 30, medium: 60, high: 120, critical: 240 }[severity as keyof typeof] || 60;
    return baseTime + (alertCount - 1) * 15; // Add 15 minutes per additional alert
  }

  private cleanupOldData(): void {
    // Clean up old metric history data
    const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days

    this.metricHistory.forEach((history, metricName) => {
      const filtered = history.filter(metric => metric.timestamp > cutoffTime);
      this.metricHistory.set(metricName, filtered);
    });

    // Clean up old alert history
    this.alertHistory = this.alertHistory.filter(alert => alert.timestamp > cutoffTime);
  }

  private isInCooldown(key: string): boolean {
    const cooldownEnd = this.alertCooldowns.get(key);
    return cooldownEnd ? Date.now() < cooldownEnd : false;
  }

  private setCooldown(key: string): void {
    const cooldownEnd = Date.now() + (this.config.alertCooldown * 60 * 1000);
    this.alertCooldowns.set(key, cooldownEnd);
  }

  private convertToAIMetric(detail: any): AIMetric {
    return {
      id: this.generateId(),
      name: detail.name,
      value: detail.value,
      unit: detail.unit || 'count',
      timestamp: detail.timestamp || Date.now(),
      context: detail.context || this.getDefaultContext(),
      tags: detail.tags || [],
      category: detail.category || 'technical'
    };
  }

  private createMockMetric(name: string, value: number): AIMetric {
    return {
      id: this.generateId(),
      name,
      value,
      unit: 'count',
      timestamp: Date.now(),
      context: this.getDefaultContext(),
      tags: ['predictive'],
      category: 'predictive'
    };
  }

  private getDefaultContext(): PerformanceContext {
    return {
      sessionId: this.generateId(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      deviceType: this.getDeviceType(),
      connectionType: 'unknown',
      geographicRegion: 'Unknown',
      pageType: 'unknown',
      platform: 'web'
    };
  }

  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  private getDefaultAnomalyResult(metric: AIMetric): AIAnomalyResult {
    return {
      isAnomaly: false,
      confidence: 0,
      severity: 'low',
      anomalyType: 'outlier',
      expectedValue: metric.value,
      actualValue: metric.value,
      deviationPercentage: 0,
      businessImpact: {
        revenueImpact: 0,
        userExperienceImpact: 'low',
        conversionImpact: 0,
        supportTicketImpact: 0,
        operationalImpact: 'low'
      },
      explanation: 'Insufficient data for anomaly detection',
      recommendations: ['Continue monitoring to establish baseline'],
      correlatedMetrics: [],
      predictiveScore: 0
    };
  }

  private calculateStatistics(values: number[]): { mean: number; stdDev: number } {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    return { mean, stdDev };
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  }

  private generateId(): string {
    return `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API methods
  public addAlertRule(rule: IntelligentAlertRule): void {
    this.alertRules.set(rule.id, rule);
  }

  public removeAlertRule(ruleId: string): void {
    this.alertRules.delete(ruleId);
  }

  public updateAlertRule(ruleId: string, updates: Partial<IntelligentAlertRule>): void {
    const rule = this.alertRules.get(ruleId);
    if (rule) {
      this.alertRules.set(ruleId, { ...rule, ...updates });
    }
  }

  public getActiveAlerts(): IntelligentAlert[] {
    return Array.from(this.activeAlerts.values());
  }

  public getAlertGroups(): AlertGroup[] {
    return Array.from(this.alertGroups.values());
  }

  public acknowledgeAlert(alertId: string, userId?: string): void {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      if (userId) alert.assignedTo = userId;
    }
  }

  public resolveAlert(alertId: string, resolution?: string): void {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      if (resolution) {
        (alert as any).resolution = resolution;
        (alert as any).resolvedAt = Date.now();
      }
      this.activeAlerts.delete(alertId);
    }
  }

  public getMetrics(): { [key: string]: any } {
    return {
      activeAlerts: this.activeAlerts.size,
      alertGroups: this.alertGroups.size,
      alertRules: this.alertRules.size,
      baselinesTrained: Array.from(this.baselines.values()).filter(b => b.isTrained()).length,
      predictiveModels: this.predictiveModels.size,
      correlationEngine: this.correlationEngine.getMetrics(),
      noiseReductionEngine: this.noiseReductionEngine.getMetrics()
    };
  }

  public updateConfig(updates: Partial<AIAlertConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  public destroy(): void {
    // Stop all monitoring intervals
    this.monitoringIntervals.forEach(interval => clearInterval(interval));
    this.monitoringIntervals = [];

    // Clear all data
    this.metricHistory.clear();
    this.alertRules.clear();
    this.activeAlerts.clear();
    this.alertHistory = [];
    this.alertCooldowns.clear();
    this.baselines.clear();
    this.predictiveModels.clear();
    this.alertGroups.clear();

    // Destroy engines
    this.correlationEngine.destroy();
    this.noiseReductionEngine.destroy();
    this.businessImpactAnalyzer.destroy();
    this.autoRemediationEngine.destroy();

    this.isInitialized = false;
    console.log('✅ AI-Powered Alerting System destroyed');
  }
}

// Supporting classes
class AIBaselineModel {
  private metricName: string;
  private data: AIMetric[] = [];
  private patterns: Map<string, number> = new Map();
  private isTrainedFlag = false;

  constructor(metricName: string) {
    this.metricName = metricName;
  }

  public train(data: AIMetric[]): void {
    this.data = data;
    this.calculatePatterns();
    this.isTrainedFlag = true;
  }

  public addMetric(metric: AIMetric): void {
    this.data.push(metric);
    if (this.data.length > 1000) {
      this.data.shift();
    }
    this.calculatePatterns();
  }

  private calculatePatterns(): void {
    // Calculate hourly patterns
    const hourlyData = new Map<number, number[]>();

    this.data.forEach(point => {
      const hour = new Date(point.timestamp).getHours();
      if (!hourlyData.has(hour)) {
        hourlyData.set(hour, []);
      }
      hourlyData.get(hour)!.push(point.value);
    });

    hourlyData.forEach((values, hour) => {
      const average = values.reduce((sum, val) => sum + val, 0) / values.length;
      this.patterns.set(`hour_${hour}`, average);
    });
  }

  public predict(timestamp: number, context: PerformanceContext): number {
    const hour = new Date(timestamp).getHours();
    const hourlyPattern = this.patterns.get(`hour_${hour}`);

    if (hourlyPattern) {
      return hourlyPattern;
    }

    // Fallback to overall average
    if (this.data.length > 0) {
      return this.data.reduce((sum, m) => sum + m.value, 0) / this.data.length;
    }

    return 0;
  }

  public update(): void {
    this.calculatePatterns();
  }

  public isTrained(): boolean {
    return this.isTrainedFlag;
  }
}

class PredictiveModel {
  private metricName: string;
  private data: { timestamp: number; value: number }[] = [];
  private trend: number = 0;
  private seasonality: number = 0;
  private isTrainedFlag = false;

  constructor(metricName: string) {
    this.metricName = metricName;
  }

  public train(data: AIMetric[]): void {
    this.data = data.map(point => ({
      timestamp: point.timestamp,
      value: point.value
    }));

    this.calculateTrend();
    this.calculateSeasonality();
    this.isTrainedFlag = true;
  }

  public addMetric(metric: AIMetric): void {
    this.data.push({ timestamp: metric.timestamp, value: metric.value });

    if (this.data.length > 500) {
      this.data.shift();
    }

    this.calculateTrend();
    this.calculateSeasonality();
  }

  private calculateTrend(): void {
    if (this.data.length < 10) return;

    const n = this.data.length;
    const firstValue = this.data[0].value;
    const lastValue = this.data[n - 1].value;
    const timeSpan = this.data[n - 1].timestamp - this.data[0].timestamp;

    this.trend = (lastValue - firstValue) / (timeSpan / (1000 * 60)); // Change per minute
  }

  private calculateSeasonality(): void {
    // Simple seasonality detection based on time patterns
    const hourlyValues = new Map<number, number[]>();

    this.data.forEach(point => {
      const hour = new Date(point.timestamp).getHours();
      if (!hourlyValues.has(hour)) {
        hourlyValues.set(hour, []);
      }
      hourlyValues.get(hour)!.push(point.value);
    });

    let totalVariation = 0;
    let count = 0;

    hourlyValues.forEach(values => {
      if (values.length > 1) {
        const average = values.reduce((a, b) => a + b, 0) / values.length;
        const variation = Math.max(...values) - Math.min(...values);
        totalVariation += variation;
        count++;
      }
    });

    this.seasonality = count > 0 ? totalVariation / count : 0;
  }

  public async predict(minutesAhead: number): Promise<any> {
    if (!this.isTrainedFlag || this.data.length === 0) {
      return { alert: false };
    }

    const currentTimestamp = Date.now();
    const currentValue = this.data[this.data.length - 1].value;

    // Predict future value
    const predictedValue = currentValue + (this.trend * minutesAhead);

    // Add seasonal variation
    const seasonalVariation = Math.sin((minutesAhead / 60) * Math.PI * 2) * (this.seasonality / 4);
    const finalPrediction = predictedValue + seasonalVariation;

    // Determine if alert is needed
    const thresholds = this.getThresholds();
    const threshold = thresholds.warning;

    const timeToThreshold = this.calculateTimeToThreshold(currentValue, finalPrediction, threshold, minutesAhead);
    const willExceedThreshold = timeToThreshold >= 0 && timeToThreshold <= minutesAhead;

    return {
      alert: willExceedThreshold,
      predictedValue: finalPrediction,
      timeToThreshold: Math.max(0, timeToThreshold),
      confidence: Math.min(90, this.data.length / 10),
      severity: willExceedThreshold ? this.getSeverity(finalPrediction, thresholds) : 'low',
      factors: [
        { factor: 'trend', weight: 0.4, value: this.trend, impact: this.trend > 0 ? 'negative' : 'positive' },
        { factor: 'seasonality', weight: 0.3, value: this.seasonality, impact: 'neutral' },
        { factor: 'volatility', weight: 0.3, value: this.calculateVolatility(), impact: 'negative' }
      ]
    };
  }

  private getThresholds(): { warning: number; critical: number } {
    // Get appropriate thresholds based on metric type
    if (this.metricName.includes('Paint')) {
      return { warning: 3000, critical: 4000 };
    } else if (this.metricName.includes('Error Rate')) {
      return { warning: 2, critical: 5 };
    } else if (this.metricName.includes('Conversion')) {
      return { warning: 60, critical: 40 };
    } else {
      return { warning: 100, critical: 200 };
    }
  }

  private calculateTimeToThreshold(currentValue: number, predictedValue: number, threshold: number, timeHorizon: number): number {
    if (currentValue >= threshold) return 0;
    if (predictedValue < threshold) return -1;

    const rate = (predictedValue - currentValue) / timeHorizon;
    return (threshold - currentValue) / rate;
  }

  private getSeverity(value: number, thresholds: { warning: number; critical: number }): string {
    if (value >= thresholds.critical) return 'critical';
    if (value >= thresholds.warning) return 'high';
    return 'medium';
  }

  private calculateVolatility(): number {
    if (this.data.length < 10) return 0;

    const values = this.data.slice(-50).map(d => d.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;

    return Math.sqrt(variance) / mean; // Coefficient of variation
  }

  public update(): void {
    this.calculateTrend();
    this.calculateSeasonality();
  }

  public isTrained(): boolean {
    return this.isTrainedFlag;
  }

  public calculatePredictiveScore(metric: AIMetric): number {
    if (!this.isTrainedFlag) return 0;

    // Calculate how unusual the current metric is based on the model
    const prediction = this.predict(0); // Predict current time
    const deviation = Math.abs(metric.value - prediction.predictedValue) / prediction.predictedValue;

    return Math.min(1, deviation);
  }
}

class CorrelationEngine {
  private correlations: Map<string, number> = new Map();

  public async findCorrelations(alert: IntelligentAlert, otherAlerts: IntelligentAlert[]): Promise<any[]> {
    const correlations = [];

    for (const otherAlert of otherAlerts) {
      if (otherAlert.id === alert.id) continue;

      const correlation = this.calculateCorrelation(alert, otherAlert);
      if (correlation > 0.7) {
        correlations.push({
          relatedAlerts: [otherAlert.id],
          correlation,
          type: 'similarity'
        });
      }
    }

    return correlations;
  }

  private calculateCorrelation(alert1: IntelligentAlert, alert2: IntelligentAlert): number {
    // Simple correlation based on metric type and timing
    let correlation = 0;

    if (alert1.metricName === alert2.metricName) {
      correlation += 0.5;
    }

    const timeDiff = Math.abs(alert1.timestamp - alert2.timestamp);
    if (timeDiff < 5 * 60 * 1000) { // Within 5 minutes
      correlation += 0.3;
    }

    if (alert1.severity === alert2.severity) {
      correlation += 0.2;
    }

    return Math.min(1, correlation);
  }

  public async analyzeCorrelations(alerts: IntelligentAlert[]): Promise<void> {
    // Analyze correlations between all active alerts
    for (let i = 0; i < alerts.length; i++) {
      for (let j = i + 1; j < alerts.length; j++) {
        const correlation = this.calculateCorrelation(alerts[i], alerts[j]);
        if (correlation > 0.8) {
          this.correlations.set(`${alerts[i].id}_${alerts[j].id}`, correlation);
        }
      }
    }
  }

  public getMetrics(): any {
    return {
      activeCorrelations: this.correlations.size
    };
  }

  public destroy(): void {
    this.correlations.clear();
  }
}

class NoiseReductionEngine {
  private alertHistory: Map<string, number[]> = new Map();

  public shouldSuppress(alertId: string, anomalyResult: AIAnomalyResult): boolean {
    const history = this.alertHistory.get(alertId) || [];

    // Check for similar recent alerts
    const recentSimilar = history.filter(timestamp =>
      Date.now() - timestamp < (30 * 60 * 1000) // Last 30 minutes
    );

    if (recentSimilar.length > 3) {
      return true; // Suppress due to high frequency
    }

    return false;
  }

  public analyzeAndFilter(alerts: IntelligentAlert[]): void {
    // Implement more sophisticated noise reduction logic
    alerts.forEach(alert => {
      const history = this.alertHistory.get(alert.id) || [];
      history.push(Date.now());

      // Keep only recent history
      const recent = history.filter(timestamp =>
        Date.now() - timestamp < (24 * 60 * 60 * 1000) // Last 24 hours
      );
      this.alertHistory.set(alert.id, recent);
    });
  }

  public getMetrics(): any {
    return {
      alertHistorySize: this.alertHistory.size
    };
  }

  public destroy(): void {
    this.alertHistory.clear();
  }
}

class BusinessImpactAnalyzer {
  public async analyzeImpact(metric: AIMetric, anomalyResult: AIAnomalyResult | null): Promise<BusinessImpact> {
    // Mock implementation - in real system would analyze actual business metrics
    const impact: BusinessImpact = {
      revenueImpact: Math.random() * 30, // 0-30%
      userExperienceImpact: 'medium' as const,
      conversionImpact: Math.random() * 20, // 0-20%
      supportTicketImpact: Math.floor(Math.random() * 10), // 0-10 tickets
      operationalImpact: 'medium' as const
    };

    // Adjust impact based on metric category and severity
    if (metric.category === 'cwv' && metric.name.includes('Paint')) {
      impact.revenueImpact *= 1.5;
      impact.userExperienceImpact = 'high';
    }

    if (metric.category === 'business') {
      impact.revenueImpact *= 2;
      impact.operationalImpact = 'high';
    }

    return impact;
  }

  public async analyzePredictionImpact(prediction: any): Promise<BusinessImpact> {
    // Similar to analyzeImpact but for predictions
    return this.analyzeImpact({} as AIMetric, null);
  }

  public destroy(): void {
    // Clean up resources
  }
}

class AutoRemediationEngine {
  public async createPlan(alert: IntelligentAlert): Promise<any> {
    // Create remediation plan based on alert type and severity
    if (alert.severity === 'critical') {
      return {
        actions: [
          { type: 'circuit-breaker', config: { service: 'affected-service' } },
          { type: 'scale-up', config: { factor: 2 } }
        ]
      };
    }

    return null;
  }

  public async createPlanFromRule(rule: IntelligentAlertRule, alert: IntelligentAlert): Promise<any> {
    if (rule.autoRemediation) {
      return {
        actions: rule.autoRemediation.actions
      };
    }

    return null;
  }

  public async executePlan(plan: any): Promise<void> {
    // Execute remediation actions
    console.log('Executing auto-remediation plan:', plan);
  }

  public destroy(): void {
    // Clean up resources
  }
}

// Interfaces
interface IntelligentAlert {
  id: string;
  type: 'anomaly' | 'rule' | 'predictive';
  ruleId?: string;
  ruleName?: string;
  metricName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  anomalyResult?: AIAnomalyResult;
  metric: AIMetric;
  timestamp: number;
  acknowledged: boolean;
  resolved: boolean;
  businessImpact: BusinessImpact;
  correlatedAlerts: string[];
  groupId?: string;
  priority: number;
  predictiveScore: number;
}

export default AIPoweredAlertingSystem;
export {
  AIAlertConfig,
  AIMetric,
  AIAnomalyResult,
  IntelligentAlertRule,
  BusinessImpact,
  PredictiveAlert,
  AlertGroup,
  AIPoweredAlertingSystem
};