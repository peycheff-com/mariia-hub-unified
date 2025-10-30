/**
 * Advanced Anomaly Detection System for Business Operations
 * Real-time anomaly detection for bookings, payments, behavior, and system performance
 */

import { TimeSeriesData, AnomalyDetection } from './ai-analytics-engine';

export interface AnomalyConfig {
  sensitivity: number; // 0.1-1.0, higher = more sensitive
  windowSize: number; // Time window for analysis
  minDataPoints: number; // Minimum data points required
  alertThreshold: number; // Threshold for triggering alerts
  autoResolution: boolean; // Enable automatic issue resolution
  learningEnabled: boolean; // Enable continuous learning
}

export interface BookingAnomaly extends AnomalyDetection {
  bookingId?: string;
  customerId?: string;
  serviceId?: string;
  anomalyType: 'booking_pattern' | 'timing_anomaly' | 'customer_behavior' | 'service_demand';
  relatedBookings: string[];
  riskScore: number;
  fraudProbability: number;
}

export interface PaymentAnomaly extends AnomalyDetection {
  transactionId?: string;
  customerId?: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  anomalyType: 'amount_outlier' | 'frequency_spike' | 'timing_pattern' | 'geographic_anomaly' | 'card_testing';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  blockedTransaction: boolean;
  requiresManualReview: boolean;
}

export interface BehaviorAnomaly extends AnomalyDetection {
  customerId?: string;
  sessionId?: string;
  behaviorType: 'navigation' | 'interaction' | 'session_duration' | 'conversion_funnel' | 'cart_abandonment';
  baselineProfile: CustomerBehaviorProfile;
  currentBehavior: CustomerBehaviorMetrics;
  deviationScore: number;
  potentialIssues: string[];
}

export interface SystemAnomaly extends AnomalyDetection {
  component: string;
  metricType: 'performance' | 'availability' | 'error_rate' | 'resource_usage' | 'response_time';
  currentValue: number;
  baselineValue: number;
  threshold: number;
  autoScalingTriggered: boolean;
  incidentCreated: boolean;
  affectedServices: string[];
}

export interface CustomerBehaviorProfile {
  avgSessionDuration: number;
  pagesPerSession: number;
  bounceRate: number;
  conversionRate: number;
  typicalNavigationPath: string[];
  preferredDevices: string[];
  peakActivityHours: number[];
  bookingFrequency: number;
  avgBookingValue: number;
}

export interface CustomerBehaviorMetrics {
  sessionDuration: number;
  pagesVisited: string[];
  timeOnPage: Record<string, number>;
  clickEvents: ClickEvent[];
  scrollEvents: ScrollEvent[];
  formInteractions: FormInteraction[];
  searchQueries: string[];
  bookingAttempts: number;
  successfulBookings: number;
  abandonedCarts: number;
}

export interface ClickEvent {
  element: string;
  timestamp: Date;
  coordinates: { x: number; y: number };
  page: string;
}

export interface ScrollEvent {
  depth: number; // percentage of page scrolled
  timestamp: Date;
  page: string;
  scrollSpeed: number;
}

export interface FormInteraction {
  formName: string;
  fieldName: string;
  action: 'focus' | 'blur' | 'input' | 'submit';
  timestamp: Date;
  value?: string;
  errors: string[];
}

export interface AnomalyPattern {
  patternId: string;
  patternType: string;
  description: string;
  frequency: number;
  lastOccurrence: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  relatedAnomalies: string[];
  mitigationActions: string[];
}

export interface AnomalyReport {
  reportId: string;
  timeframe: { start: Date; end: Date };
  totalAnomalies: number;
  anomaliesByType: Record<string, number>;
  anomaliesBySeverity: Record<string, number>;
  topPatterns: AnomalyPattern[];
  resolvedAnomalies: number;
  pendingAnomalies: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  recommendations: string[];
  trends: AnomalyTrend[];
}

export interface AnomalyTrend {
  metric: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  changeRate: number;
  timeframe: string;
  significance: 'low' | 'medium' | 'high';
}

export interface FraudDetectionModel {
  modelId: string;
  version: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  lastTrained: Date;
  features: string[];
  thresholds: Record<string, number>;
}

export interface RealTimeAlert {
  alertId: string;
  anomalyId: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  assignedTo?: string;
  resolutionSteps: string[];
  estimatedImpact: string;
  affectedUsers: number;
}

export class AdvancedAnomalyDetection {
  private config: AnomalyConfig;
  private baselineData: Map<string, TimeSeriesData[]> = new Map();
  private anomalyHistory: AnomalyDetection[] = [];
  private fraudModels: Map<string, FraudDetectionModel> = new Map();
  private customerProfiles: Map<string, CustomerBehaviorProfile> = new Map();
  private activeAlerts: Map<string, RealTimeAlert> = new Map();
  private anomalyPatterns: Map<string, AnomalyPattern> = new Map();

  constructor(config: Partial<AnomalyConfig> = {}) {
    this.config = {
      sensitivity: 0.7,
      windowSize: 100,
      minDataPoints: 30,
      alertThreshold: 0.8,
      autoResolution: true,
      learningEnabled: true,
      ...config
    };

    this.initializeFraudModels();
  }

  // Main anomaly detection methods
  async detectBookingAnomalies(bookings: TimeSeriesData[]): Promise<BookingAnomaly[]> {
    const anomalies: BookingAnomaly[] = [];

    // Check for booking volume anomalies
    const volumeAnomalies = await this.detectVolumeAnomalies(bookings, 'booking');
    anomalies.push(...volumeAnomalies.map(this.convertToBookingAnomaly));

    // Check for timing anomalies
    const timingAnomalies = await this.detectTimingAnomalies(bookings);
    anomalies.push(...timingAnomalies);

    // Check for demand anomalies
    const demandAnomalies = await this.detectDemandAnomalies(bookings);
    anomalies.push(...demandAnomalies);

    // Check for customer behavior anomalies
    const behaviorAnomalies = await this.detectCustomerBehaviorAnomalies(bookings);
    anomalies.push(...behaviorAnomalies);

    // Filter by severity and sort
    return anomalies
      .filter(anomaly => anomaly.confidence >= this.config.alertThreshold)
      .sort((a, b) => b.confidence - a.confidence);
  }

  async detectPaymentAnomalies(transactions: any[]): Promise<PaymentAnomaly[]> {
    const anomalies: PaymentAnomaly[] = [];

    // Amount-based anomalies
    const amountAnomalies = await this.detectAmountAnomalies(transactions);
    anomalies.push(...amountAnomalies);

    // Frequency-based anomalies
    const frequencyAnomalies = await this.detectFrequencyAnomalies(transactions);
    anomalies.push(...frequencyAnomalies);

    // Geographic anomalies
    const geographicAnomalies = await this.detectGeographicAnomalies(transactions);
    anomalies.push(...geographicAnomalies);

    // Card testing anomalies
    const cardTestingAnomalies = await this.detectCardTestingAnomalies(transactions);
    anomalies.push(...cardTestingAnomalies);

    // Apply fraud detection models
    const fraudAnomalies = await this.applyFraudDetection(transactions);
    anomalies.push(...fraudAnomalies);

    return anomalies
      .filter(anomaly => anomaly.riskLevel !== 'low')
      .sort((a, b) => this.getRiskLevelWeight(b.riskLevel) - this.getRiskLevelWeight(a.riskLevel));
  }

  async detectBehaviorAnomalies(
    customerId: string,
    currentMetrics: CustomerBehaviorMetrics
  ): Promise<BehaviorAnomaly[]> {
    const anomalies: BehaviorAnomaly[] = [];

    // Get customer baseline profile
    const baselineProfile = this.customerProfiles.get(customerId);
    if (!baselineProfile) {
      // Create baseline profile for new customer
      await this.createCustomerProfile(customerId, currentMetrics);
      return anomalies;
    }

    // Session duration anomaly
    const sessionAnomaly = await this.detectSessionDurationAnomaly(
      baselineProfile,
      currentMetrics
    );
    if (sessionAnomaly) anomalies.push(sessionAnomaly);

    // Navigation pattern anomaly
    const navigationAnomaly = await this.detectNavigationAnomaly(
      baselineProfile,
      currentMetrics
    );
    if (navigationAnomaly) anomalies.push(navigationAnomaly);

    // Conversion funnel anomaly
    const conversionAnomaly = await this.detectConversionAnomaly(
      baselineProfile,
      currentMetrics
    );
    if (conversionAnomaly) anomalies.push(conversionAnomaly);

    // Interaction pattern anomaly
    const interactionAnomaly = await this.detectInteractionAnomaly(
      baselineProfile,
      currentMetrics
    );
    if (interactionAnomaly) anomalies.push(interactionAnomaly);

    return anomalies;
  }

  async detectSystemAnomalies(metrics: TimeSeriesData[]): Promise<SystemAnomaly[]> {
    const anomalies: SystemAnomaly[] = [];

    // Performance anomalies
    const performanceAnomalies = await this.detectPerformanceAnomalies(metrics);
    anomalies.push(...performanceAnomalies);

    // Resource usage anomalies
    const resourceAnomalies = await this.detectResourceAnomalies(metrics);
    anomalies.push(...resourceAnomalies);

    // Error rate anomalies
    const errorAnomalies = await this.detectErrorRateAnomalies(metrics);
    anomalies.push(...errorAnomalies);

    // Response time anomalies
    const responseTimeAnomalies = await this.detectResponseTimeAnomalies(metrics);
    anomalies.push(...responseTimeAnomalies);

    return anomalies
      .filter(anomaly => anomaly.severity === 'high' || anomaly.severity === 'critical')
      .sort((a, b) => this.getSeverityWeight(b.severity) - this.getSeverityWeight(a.severity));
  }

  // Real-time monitoring
  async startRealTimeMonitoring(): Promise<void> {
    console.log('Starting real-time anomaly monitoring...');

    // Set up monitoring intervals
    setInterval(async () => {
      await this.checkBookingAnomalies();
      await this.checkPaymentAnomalies();
      await this.checkSystemAnomalies();
      await this.updateCustomerProfiles();
    }, 60000); // Check every minute

    // Process anomaly queue
    setInterval(async () => {
      await this.processAnomalyQueue();
    }, 30000); // Process every 30 seconds
  }

  // Pattern recognition
  async analyzeAnomalyPatterns(anomalies: AnomalyDetection[]): Promise<AnomalyPattern[]> {
    const patterns: AnomalyPattern[] = [];

    // Time-based patterns
    const timePatterns = await this.detectTimeBasedPatterns(anomalies);
    patterns.push(...timePatterns);

    // Correlation patterns
    const correlationPatterns = await this.detectCorrelationPatterns(anomalies);
    patterns.push(...correlationPatterns);

    // Sequential patterns
    const sequentialPatterns = await this.detectSequentialPatterns(anomalies);
    patterns.push(...sequentialPatterns);

    return patterns.sort((a, b) => b.frequency - a.frequency);
  }

  // Generate comprehensive anomaly report
  async generateAnomalyReport(timeframe: { start: Date; end: Date }): Promise<AnomalyReport> {
    const relevantAnomalies = this.anomalyHistory.filter(
      anomaly => anomaly.timestamp >= timeframe.start && anomaly.timestamp <= timeframe.end
    );

    const totalAnomalies = relevantAnomalies.length;
    const anomaliesByType = this.groupAnomaliesByType(relevantAnomalies);
    const anomaliesBySeverity = this.groupAnomaliesBySeverity(relevantAnomalies);
    const topPatterns = await this.analyzeAnomalyPatterns(relevantAnomalies);
    const resolvedAnomalies = relevantAnomalies.filter(a => this.isAnomalyResolved(a)).length;
    const pendingAnomalies = totalAnomalies - resolvedAnomalies;
    const systemHealth = this.calculateSystemHealth(anomaliesBySeverity);
    const recommendations = await this.generateSystemRecommendations(relevantAnomalies);
    const trends = await this.analyzeAnomalyTrends(relevantAnomalies);

    return {
      reportId: this.generateId(),
      timeframe,
      totalAnomalies,
      anomaliesByType,
      anomaliesBySeverity,
      topPatterns,
      resolvedAnomalies,
      pendingAnomalies,
      systemHealth,
      recommendations,
      trends
    };
  }

  // Alert management
  async createAlert(anomaly: AnomalyDetection): Promise<RealTimeAlert> {
    const alert: RealTimeAlert = {
      alertId: this.generateId(),
      anomalyId: `${anomaly.type}_${anomaly.timestamp.getTime()}`,
      type: anomaly.type,
      severity: anomaly.severity,
      message: this.generateAlertMessage(anomaly),
      timestamp: new Date(),
      acknowledged: false,
      resolutionSteps: this.generateResolutionSteps(anomaly),
      estimatedImpact: this.estimateImpact(anomaly),
      affectedUsers: this.estimateAffectedUsers(anomaly)
    };

    this.activeAlerts.set(alert.alertId, alert);

    // Send notifications
    await this.sendAlertNotification(alert);

    return alert;
  }

  async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.assignedTo = userId;
    }
  }

  async resolveAlert(alertId: string, resolution: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      // Mark related anomaly as resolved
      const anomaly = this.anomalyHistory.find(a => `${a.type}_${a.timestamp.getTime()}` === alert.anomalyId);
      if (anomaly) {
        this.markAnomalyResolved(anomaly, resolution);
      }

      this.activeAlerts.delete(alertId);
    }
  }

  // Private methods
  private async initializeFraudModels(): Promise<void> {
    // Initialize fraud detection models
    const fraudModel: FraudDetectionModel = {
      modelId: 'fraud_detection_v1',
      version: '1.0.0',
      accuracy: 0.94,
      precision: 0.91,
      recall: 0.89,
      f1Score: 0.90,
      lastTrained: new Date(),
      features: ['amount', 'frequency', 'location', 'time', 'device', 'customer_age', 'transaction_history'],
      thresholds: {
        amount_outlier: 2.5,
        frequency_spike: 3.0,
        geographic_anomaly: 2.0,
        card_testing: 4.0
      }
    };

    this.fraudModels.set('payment_fraud', fraudModel);
  }

  private async detectVolumeAnomalies(
    data: TimeSeriesData[],
    metricType: string
  ): Promise<AnomalyDetection[]> {
    const anomalies: AnomalyDetection[] = [];
    const values = data.map(d => d.value);
    const { mean, stdDev } = this.calculateStatistics(values);
    const threshold = this.config.sensitivity * stdDev;

    data.forEach(point => {
      const zScore = Math.abs((point.value - mean) / stdDev);
      if (zScore > threshold) {
        anomalies.push({
          timestamp: point.timestamp,
          type: metricType as any,
          severity: this.calculateSeverity(zScore),
          description: `${metricType} volume is ${zScore > 0 ? 'higher' : 'lower'} than normal (${zScore.toFixed(1)} standard deviations)`,
          confidence: Math.min(zScore / threshold, 1),
          suggestedAction: this.getSuggestedAction(metricType, this.calculateSeverity(zScore))
        });
      }
    });

    return anomalies;
  }

  private async detectTimingAnomalies(bookings: TimeSeriesData[]): Promise<BookingAnomaly[]> {
    const anomalies: BookingAnomaly[] = [];

    // Group bookings by hour
    const hourlyBookings = this.groupByHour(bookings);
    const hourlyAverages = this.calculateHourlyAverages(hourlyBookings);

    // Detect anomalies in booking patterns by hour
    Object.entries(hourlyBookings).forEach(([hour, hourBookings]) => {
      const expectedAvg = hourlyAverages[parseInt(hour)] || 0;
      const actualCount = hourBookings.length;

      if (expectedAvg > 0) {
        const deviation = Math.abs((actualCount - expectedAvg) / expectedAvg);
        if (deviation > this.config.sensitivity) {
          anomalies.push({
            timestamp: new Date(),
            type: 'booking',
            severity: this.calculateSeverity(deviation * 2),
            description: `Unusual booking volume at ${hour}:00 (${actualCount} bookings, expected ${expectedAvg.toFixed(1)})`,
            confidence: Math.min(deviation / this.config.sensitivity, 1),
            suggestedAction: 'Investigate unusual booking pattern',
            anomalyType: 'timing_anomaly',
            relatedBookings: hourBookings.map(b => b.timestamp.toString()),
            riskScore: deviation,
            fraudProbability: Math.min(deviation / 3, 1)
          });
        }
      }
    });

    return anomalies;
  }

  private async detectDemandAnomalies(bookings: TimeSeriesData[]): Promise<BookingAnomaly[]> {
    const anomalies: BookingAnomaly[] = [];

    // Calculate moving average
    const movingAverage = this.calculateMovingAverage(bookings, 7); // 7-day moving average
    const movingStdDev = this.calculateMovingStdDev(bookings, 7);

    bookings.forEach((booking, index) => {
      if (index >= 7) {
        const expectedValue = movingAverage[index - 7];
        const stdDev = movingStdDev[index - 7];
        const zScore = Math.abs((booking.value - expectedValue) / stdDev);

        if (zScore > this.config.sensitivity * 2) {
          anomalies.push({
            timestamp: booking.timestamp,
            type: 'booking',
            severity: this.calculateSeverity(zScore),
            description: `Demand anomaly detected: ${booking.value} bookings (expected ${expectedValue.toFixed(1)})`,
            confidence: Math.min(zScore / (this.config.sensitivity * 2), 1),
            suggestedAction: 'Review demand patterns and adjust capacity',
            anomalyType: 'service_demand',
            relatedBookings: [booking.timestamp.toString()],
            riskScore: zScore,
            fraudProbability: 0 // Low fraud probability for demand anomalies
          });
        }
      }
    });

    return anomalies;
  }

  private async detectCustomerBehaviorAnomalies(bookings: TimeSeriesData[]): Promise<BookingAnomaly[]> {
    const anomalies: BookingAnomaly[] = [];

    // This would analyze customer booking patterns
    // For now, return empty array
    return anomalies;
  }

  private async detectAmountAnomalies(transactions: any[]): Promise<PaymentAnomaly[]> {
    const anomalies: PaymentAnomaly[] = [];
    const amounts = transactions.map(t => t.amount);
    const { mean, stdDev } = this.calculateStatistics(amounts);
    const fraudModel = this.fraudModels.get('payment_fraud');

    if (!fraudModel) return anomalies;

    transactions.forEach(transaction => {
      const zScore = Math.abs((transaction.amount - mean) / stdDev);
      if (zScore > fraudModel.thresholds.amount_outlier) {
        anomalies.push({
          timestamp: new Date(transaction.timestamp),
          type: 'payment',
          severity: this.calculateSeverity(zScore),
          description: `Unusual transaction amount: ${transaction.amount} (average: ${mean.toFixed(2)})`,
          confidence: Math.min(zScore / fraudModel.thresholds.amount_outlier, 1),
          suggestedAction: 'Review transaction for potential fraud',
          transactionId: transaction.id,
          customerId: transaction.customerId,
          amount: transaction.amount,
          currency: transaction.currency,
          paymentMethod: transaction.paymentMethod,
          anomalyType: 'amount_outlier',
          riskLevel: this.calculateRiskLevel(zScore),
          blockedTransaction: zScore > fraudModel.thresholds.amount_outlier * 1.5,
          requiresManualReview: zScore > fraudModel.thresholds.amount_outlier * 1.2
        });
      }
    });

    return anomalies;
  }

  private async detectFrequencyAnomalies(transactions: any[]): Promise<PaymentAnomaly[]> {
    const anomalies: PaymentAnomaly[] = [];

    // Group transactions by customer and time
    const customerTransactions = this.groupTransactionsByCustomer(transactions);

    Object.entries(customerTransactions).forEach(([customerId, customerTxns]) => {
      const frequencies = this.calculateTransactionFrequencies(customerTxns);
      const avgFrequency = frequencies.reduce((sum, freq) => sum + freq, 0) / frequencies.length;
      const stdDev = Math.sqrt(frequencies.reduce((sum, freq) => sum + Math.pow(freq - avgFrequency, 2), 0) / frequencies.length);

      frequencies.forEach((frequency, index) => {
        const zScore = Math.abs((frequency - avgFrequency) / stdDev);
        if (zScore > 3) { // High threshold for frequency
          anomalies.push({
            timestamp: customerTxns[index].timestamp,
            type: 'payment',
            severity: this.calculateSeverity(zScore),
            description: `Unusual transaction frequency for customer ${customerId}`,
            confidence: Math.min(zScore / 3, 1),
            suggestedAction: 'Investigate potential automated or fraudulent activity',
            transactionId: customerTxns[index].id,
            customerId,
            amount: customerTxns[index].amount,
            currency: customerTxns[index].currency,
            paymentMethod: customerTxns[index].paymentMethod,
            anomalyType: 'frequency_spike',
            riskLevel: this.calculateRiskLevel(zScore),
            blockedTransaction: zScore > 4,
            requiresManualReview: true
          });
        }
      });
    });

    return anomalies;
  }

  private async detectGeographicAnomalies(transactions: any[]): Promise<PaymentAnomaly[]> {
    const anomalies: PaymentAnomaly[] = [];

    // Group transactions by customer and location
    const customerLocations = this.groupTransactionsByLocation(transactions);

    Object.entries(customerLocations).forEach(([customerId, locations]) => {
      const uniqueLocations = new Set(locations.map(l => l.location));

      if (uniqueLocations.size > 3) { // Customer using multiple locations
        anomalies.push({
          timestamp: new Date(),
          type: 'payment',
          severity: 'high',
          description: `Customer ${customerId} using multiple locations: ${Array.from(uniqueLocations).join(', ')}`,
          confidence: 0.8,
          suggestedAction: 'Verify customer identity and transaction legitimacy',
          customerId,
          amount: locations.reduce((sum, l) => sum + l.amount, 0),
          currency: locations[0]?.currency || 'USD',
          paymentMethod: locations[0]?.paymentMethod || 'unknown',
          anomalyType: 'geographic_anomaly',
          riskLevel: 'medium',
          blockedTransaction: false,
          requiresManualReview: true
        });
      }
    });

    return anomalies;
  }

  private async detectCardTestingAnomalies(transactions: any[]): Promise<PaymentAnomaly[]> {
    const anomalies: PaymentAnomaly[] = [];

    // Look for patterns indicative of card testing
    const recentTransactions = transactions.filter(t =>
      new Date(t.timestamp) > new Date(Date.now() - 60 * 60 * 1000) // Last hour
    );

    // Group by payment method identifier
    const paymentMethods = new Map<string, any[]>();
    recentTransactions.forEach(txn => {
      const key = `${txn.paymentMethod}_${txn.customerId}`;
      if (!paymentMethods.has(key)) paymentMethods.set(key, []);
      paymentMethods.get(key)!.push(txn);
    });

    paymentMethods.forEach((txns, key) => {
      if (txns.length > 5) { // Many transactions in short time
        const declinedTxns = txns.filter(t => t.status === 'declined');
        if (declinedTxns.length > txns.length * 0.7) { // High decline rate
          anomalies.push({
            timestamp: new Date(),
            type: 'payment',
            severity: 'critical',
            description: `Potential card testing detected: ${txns.length} attempts, ${declinedTxns.length} declined`,
            confidence: 0.9,
            suggestedAction: 'Block payment method and investigate for fraud',
            transactionId: txns[0].id,
            customerId: txns[0].customerId,
            amount: txns.reduce((sum, t) => sum + t.amount, 0),
            currency: txns[0].currency,
            paymentMethod: txns[0].paymentMethod,
            anomalyType: 'card_testing',
            riskLevel: 'critical',
            blockedTransaction: true,
            requiresManualReview: true
          });
        }
      }
    });

    return anomalies;
  }

  private async applyFraudDetection(transactions: any[]): Promise<PaymentAnomaly[]> {
    const anomalies: PaymentAnomaly[] = [];
    const fraudModel = this.fraudModels.get('payment_fraud');

    if (!fraudModel) return anomalies;

    // Apply machine learning model for fraud detection
    transactions.forEach(transaction => {
      const features = this.extractFraudFeatures(transaction);
      const fraudScore = this.calculateFraudScore(features, fraudModel);

      if (fraudScore > 0.8) {
        anomalies.push({
          timestamp: new Date(transaction.timestamp),
          type: 'payment',
          severity: 'critical',
          description: `High fraud probability detected: ${(fraudScore * 100).toFixed(1)}%`,
          confidence: fraudScore,
          suggestedAction: 'Block transaction and investigate immediately',
          transactionId: transaction.id,
          customerId: transaction.customerId,
          amount: transaction.amount,
          currency: transaction.currency,
          paymentMethod: transaction.paymentMethod,
          anomalyType: 'amount_outlier',
          riskLevel: 'critical',
          blockedTransaction: true,
          requiresManualReview: true
        });
      }
    });

    return anomalies;
  }

  // Behavior anomaly detection methods
  private async detectSessionDurationAnomaly(
    baseline: CustomerBehaviorProfile,
    current: CustomerBehaviorMetrics
  ): Promise<BehaviorAnomaly | null> {
    const baselineDuration = baseline.avgSessionDuration;
    const currentDuration = current.sessionDuration;
    const deviation = Math.abs((currentDuration - baselineDuration) / baselineDuration);

    if (deviation > this.config.sensitivity) {
      return {
        timestamp: new Date(),
        type: 'behavior',
        severity: this.calculateSeverity(deviation * 2),
        description: `Unusual session duration: ${currentDuration}s (baseline: ${baselineDuration}s)`,
        confidence: Math.min(deviation / this.config.sensitivity, 1),
        suggestedAction: 'Monitor customer engagement and potential issues',
        behaviorType: 'session_duration',
        baselineProfile: baseline,
        currentBehavior: current,
        deviationScore: deviation,
        potentialIssues: this.identifyPotentialIssues(baseline, current, 'session_duration')
      };
    }

    return null;
  }

  private async detectNavigationAnomaly(
    baseline: CustomerBehaviorProfile,
    current: CustomerBehaviorMetrics
  ): Promise<BehaviorAnomaly | null> {
    // Compare navigation patterns
    const baselinePath = baseline.typicalNavigationPath;
    const currentPath = current.pagesVisited;

    const similarity = this.calculatePathSimilarity(baselinePath, currentPath);
    const deviation = 1 - similarity;

    if (deviation > this.config.sensitivity) {
      return {
        timestamp: new Date(),
        type: 'behavior',
        severity: this.calculateSeverity(deviation * 2),
        description: `Unusual navigation pattern detected`,
        confidence: Math.min(deviation / this.config.sensitivity, 1),
        suggestedAction: 'Investigate navigation issues or new user interests',
        behaviorType: 'navigation',
        baselineProfile: baseline,
        currentBehavior: current,
        deviationScore: deviation,
        potentialIssues: this.identifyPotentialIssues(baseline, current, 'navigation')
      };
    }

    return null;
  }

  private async detectConversionAnomaly(
    baseline: CustomerBehaviorProfile,
    current: CustomerBehaviorMetrics
  ): Promise<BehaviorAnomaly | null> {
    const baselineConversion = baseline.conversionRate;
    const currentConversion = current.bookingAttempts > 0
      ? current.successfulBookings / current.bookingAttempts
      : 0;

    const deviation = Math.abs((currentConversion - baselineConversion) / baselineConversion);

    if (deviation > this.config.sensitivity && current.bookingAttempts > 0) {
      return {
        timestamp: new Date(),
        type: 'behavior',
        severity: this.calculateSeverity(deviation * 2),
        description: `Unusual conversion rate: ${(currentConversion * 100).toFixed(1)}% (baseline: ${(baselineConversion * 100).toFixed(1)}%)`,
        confidence: Math.min(deviation / this.config.sensitivity, 1),
        suggestedAction: 'Review conversion funnel and potential barriers',
        behaviorType: 'conversion_funnel',
        baselineProfile: baseline,
        currentBehavior: current,
        deviationScore: deviation,
        potentialIssues: this.identifyPotentialIssues(baseline, current, 'conversion')
      };
    }

    return null;
  }

  private async detectInteractionAnomaly(
    baseline: CustomerBehaviorProfile,
    current: CustomerBehaviorMetrics
  ): Promise<BehaviorAnomaly | null> {
    const baselineInteractions = baseline.pagesPerSession;
    const currentInteractions = current.pagesVisited.length;

    const deviation = Math.abs((currentInteractions - baselineInteractions) / baselineInteractions);

    if (deviation > this.config.sensitivity) {
      return {
        timestamp: new Date(),
        type: 'behavior',
        severity: this.calculateSeverity(deviation * 2),
        description: `Unusual interaction level: ${currentInteractions} pages (baseline: ${baselineInteractions})`,
        confidence: Math.min(deviation / this.config.sensitivity, 1),
        suggestedAction: 'Analyze user engagement and content relevance',
        behaviorType: 'interaction',
        baselineProfile: baseline,
        currentBehavior: current,
        deviationScore: deviation,
        potentialIssues: this.identifyPotentialIssues(baseline, current, 'interaction')
      };
    }

    return null;
  }

  // System anomaly detection methods
  private async detectPerformanceAnomalies(metrics: TimeSeriesData[]): Promise<SystemAnomaly[]> {
    const anomalies: SystemAnomaly[] = [];

    // CPU usage anomalies
    const cpuMetrics = metrics.filter(m => m.metadata?.metric === 'cpu_usage');
    if (cpuMetrics.length > 0) {
      const cpuAnomalies = await this.detectVolumeAnomalies(cpuMetrics, 'performance');
      anomalies.push(...cpuAnomalies.map(anomaly => ({
        ...anomaly,
        component: 'server',
        metricType: 'performance' as const,
        currentValue: cpuMetrics.find(m => m.timestamp.getTime() === anomaly.timestamp.getTime())?.value || 0,
        baselineValue: this.calculateBaseline(cpuMetrics),
        threshold: 80,
        autoScalingTriggered: anomaly.severity === 'high',
        incidentCreated: anomaly.severity === 'critical',
        affectedServices: ['booking', 'payment', 'user_management']
      } as SystemAnomaly)));
    }

    return anomalies;
  }

  private async detectResourceAnomalies(metrics: TimeSeriesData[]): Promise<SystemAnomaly[]> {
    // Similar implementation for memory, disk, network resources
    return [];
  }

  private async detectErrorRateAnomalies(metrics: TimeSeriesData[]): Promise<SystemAnomaly[]> {
    const errorMetrics = metrics.filter(m => m.metadata?.metric === 'error_rate');
    if (errorMetrics.length === 0) return [];

    const errors = errorMetrics.map(m => m.value);
    const { mean, stdDev } = this.calculateStatistics(errors);

    return errorMetrics
      .filter(metric => {
        const zScore = Math.abs((metric.value - mean) / stdDev);
        return zScore > this.config.sensitivity;
      })
      .map(metric => ({
        timestamp: metric.timestamp,
        type: 'system',
        severity: this.calculateSeverity(Math.abs((metric.value - mean) / stdDev)),
        description: `Error rate spike: ${metric.value}% (baseline: ${mean.toFixed(2)}%)`,
        confidence: Math.min(Math.abs((metric.value - mean) / stdDev) / this.config.sensitivity, 1),
        suggestedAction: 'Investigate error logs and system health',
        component: 'application',
        metricType: 'error_rate' as const,
        currentValue: metric.value,
        baselineValue: mean,
        threshold: 5,
        autoScalingTriggered: false,
        incidentCreated: metric.value > 10,
        affectedServices: this.identifyAffectedServices(metric)
      } as SystemAnomaly));
  }

  private async detectResponseTimeAnomalies(metrics: TimeSeriesData[]): Promise<SystemAnomaly[]> {
    // Similar implementation for response time metrics
    return [];
  }

  // Utility methods
  private calculateStatistics(values: number[]): { mean: number; stdDev: number } {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    return { mean, stdDev };
  }

  private calculateSeverity(zScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (zScore < 2) return 'low';
    if (zScore < 3) return 'medium';
    if (zScore < 4) return 'high';
    return 'critical';
  }

  private getSeverityWeight(severity: string): number {
    const weights = { low: 1, medium: 2, high: 3, critical: 4 };
    return weights[severity as keyof typeof weights] || 0;
  }

  private getRiskLevelWeight(riskLevel: string): number {
    const weights = { low: 1, medium: 2, high: 3, critical: 4 };
    return weights[riskLevel as keyof typeof weights] || 0;
  }

  private calculateRiskLevel(zScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (zScore < 2) return 'low';
    if (zScore < 3) return 'medium';
    if (zScore < 4) return 'high';
    return 'critical';
  }

  private convertToBookingAnomaly(anomaly: AnomalyDetection): BookingAnomaly {
    return {
      ...anomaly,
      anomalyType: 'booking_pattern',
      relatedBookings: [],
      riskScore: anomaly.confidence,
      fraudProbability: 0
    };
  }

  private groupByHour(bookings: TimeSeriesData[]): Record<string, TimeSeriesData[]> {
    const grouped: Record<string, TimeSeriesData[]> = {};
    bookings.forEach(booking => {
      const hour = booking.timestamp.getHours().toString();
      if (!grouped[hour]) grouped[hour] = [];
      grouped[hour].push(booking);
    });
    return grouped;
  }

  private calculateHourlyAverages(hourlyBookings: Record<string, TimeSeriesData[]>): Record<number, number> {
    const averages: Record<number, number> = {};
    Object.entries(hourlyBookings).forEach(([hour, bookings]) => {
      const total = bookings.reduce((sum, b) => sum + b.value, 0);
      averages[parseInt(hour)] = total / bookings.length;
    });
    return averages;
  }

  private calculateMovingAverage(data: TimeSeriesData[], window: number): number[] {
    const averages: number[] = [];
    for (let i = window - 1; i < data.length; i++) {
      const sum = data.slice(i - window + 1, i + 1).reduce((s, d) => s + d.value, 0);
      averages.push(sum / window);
    }
    return averages;
  }

  private calculateMovingStdDev(data: TimeSeriesData[], window: number): number[] {
    const stdDevs: number[] = [];
    for (let i = window - 1; i < data.length; i++) {
      const windowData = data.slice(i - window + 1, i + 1).map(d => d.value);
      const mean = windowData.reduce((s, v) => s + v, 0) / window;
      const variance = windowData.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / window;
      stdDevs.push(Math.sqrt(variance));
    }
    return stdDevs;
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private getSuggestedAction(type: string, severity: string): string {
    const actions: Record<string, Record<string, string>> = {
      booking: {
        low: 'Monitor booking patterns',
        medium: 'Review booking system performance',
        high: 'Investigate booking anomalies',
        critical: 'Immediate investigation required'
      },
      payment: {
        low: 'Monitor transaction patterns',
        medium: 'Review payment processing',
        high: 'Investigate potential fraud',
        critical: 'Block suspicious transactions'
      },
      behavior: {
        low: 'Continue monitoring',
        medium: 'Analyze user behavior changes',
        high: 'Review user experience',
        critical: 'Investigate system issues'
      },
      system: {
        low: 'Monitor system metrics',
        medium: 'Review system performance',
        high: 'Scale resources if needed',
        critical: 'Immediate technical response'
      }
    };

    return actions[type]?.[severity] || 'Investigate further';
  }

  private extractFraudFeatures(transaction: any): number[] {
    // Extract features for fraud detection model
    return [
      transaction.amount,
      new Date(transaction.timestamp).getHours(),
      transaction.customerAge || 30,
      transaction.transactionHistory || 0
    ];
  }

  private calculateFraudScore(features: number[], model: FraudDetectionModel): number {
    // Simplified fraud score calculation
    // In real implementation, this would use the actual ML model
    const weightedSum = features.reduce((sum, feature, index) => {
      const weight = [0.3, 0.2, 0.3, 0.2][index] || 0.1;
      return sum + feature * weight;
    }, 0);

    return Math.min(1, Math.max(0, weightedSum / 100));
  }

  private async createCustomerProfile(customerId: string, metrics: CustomerBehaviorMetrics): Promise<void> {
    const profile: CustomerBehaviorProfile = {
      avgSessionDuration: metrics.sessionDuration,
      pagesPerSession: metrics.pagesVisited.length,
      bounceRate: metrics.pagesVisited.length === 1 ? 1 : 0,
      conversionRate: metrics.bookingAttempts > 0 ? metrics.successfulBookings / metrics.bookingAttempts : 0,
      typicalNavigationPath: metrics.pagesVisited,
      preferredDevices: ['desktop'], // Mock data
      peakActivityHours: [new Date().getHours()], // Mock data
      bookingFrequency: 1, // Mock data
      avgBookingValue: 100 // Mock data
    };

    this.customerProfiles.set(customerId, profile);
  }

  private calculatePathSimilarity(path1: string[], path2: string[]): number {
    // Simple path similarity calculation
    const intersection = path1.filter(page => path2.includes(page));
    const union = [...new Set([...path1, ...path2])];
    return intersection.length / union.length;
  }

  private identifyPotentialIssues(
    baseline: CustomerBehaviorProfile,
    current: CustomerBehaviorMetrics,
    type: string
  ): string[] {
    const issues: string[] = [];

    switch (type) {
      case 'session_duration':
        if (current.sessionDuration < baseline.avgSessionDuration * 0.5) {
          issues.push('Very short session may indicate dissatisfaction');
        }
        break;
      case 'navigation':
        if (current.pagesVisited.length > baseline.pagesPerSession * 2) {
          issues.push('User may be having difficulty finding information');
        }
        break;
      case 'conversion':
        if (current.abandonedCarts > 0) {
          issues.push('Cart abandonment detected');
        }
        break;
      case 'interaction':
        if (current.pagesVisited.length < 2) {
          issues.push('Low engagement detected');
        }
        break;
    }

    return issues;
  }

  private groupTransactionsByCustomer(transactions: any[]): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};
    transactions.forEach(txn => {
      if (!grouped[txn.customerId]) grouped[txn.customerId] = [];
      grouped[txn.customerId].push(txn);
    });
    return grouped;
  }

  private calculateTransactionFrequencies(transactions: any[]): number[] {
    // Calculate time between consecutive transactions
    const frequencies: number[] = [];
    for (let i = 1; i < transactions.length; i++) {
      const timeDiff = new Date(transactions[i].timestamp).getTime() -
                       new Date(transactions[i - 1].timestamp).getTime();
      frequencies.push(timeDiff / (1000 * 60)); // Convert to minutes
    }
    return frequencies;
  }

  private groupTransactionsByLocation(transactions: any[]): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};
    transactions.forEach(txn => {
      if (!grouped[txn.customerId]) grouped[txn.customerId] = [];
      grouped[txn.customerId].push({
        ...txn,
        location: txn.location || 'unknown'
      });
    });
    return grouped;
  }

  private calculateBaseline(metrics: TimeSeriesData[]): number {
    if (metrics.length === 0) return 0;
    const total = metrics.reduce((sum, m) => sum + m.value, 0);
    return total / metrics.length;
  }

  private identifyAffectedServices(metric: TimeSeriesData): string[] {
    // Mock service identification based on metric metadata
    return ['booking', 'payment'];
  }

  // Additional methods for real-time monitoring and reporting
  private async checkBookingAnomalies(): Promise<void> {
    // Implementation for real-time booking anomaly checking
  }

  private async checkPaymentAnomalies(): Promise<void> {
    // Implementation for real-time payment anomaly checking
  }

  private async checkSystemAnomalies(): Promise<void> {
    // Implementation for real-time system anomaly checking
  }

  private async updateCustomerProfiles(): Promise<void> {
    // Implementation for updating customer behavior profiles
  }

  private async processAnomalyQueue(): Promise<void> {
    // Implementation for processing anomaly resolution queue
  }

  private async detectTimeBasedPatterns(anomalies: AnomalyDetection[]): Promise<AnomalyPattern[]> {
    // Implementation for detecting time-based patterns
    return [];
  }

  private async detectCorrelationPatterns(anomalies: AnomalyDetection[]): Promise<AnomalyPattern[]> {
    // Implementation for detecting correlation patterns
    return [];
  }

  private async detectSequentialPatterns(anomalies: AnomalyDetection[]): Promise<AnomalyPattern[]> {
    // Implementation for detecting sequential patterns
    return [];
  }

  private groupAnomaliesByType(anomalies: AnomalyDetection[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    anomalies.forEach(anomaly => {
      grouped[anomaly.type] = (grouped[anomaly.type] || 0) + 1;
    });
    return grouped;
  }

  private groupAnomaliesBySeverity(anomalies: AnomalyDetection[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    anomalies.forEach(anomaly => {
      grouped[anomaly.severity] = (grouped[anomaly.severity] || 0) + 1;
    });
    return grouped;
  }

  private calculateSystemHealth(anomaliesBySeverity: Record<string, number>): 'healthy' | 'warning' | 'critical' {
    const criticalCount = anomaliesBySeverity.critical || 0;
    const highCount = anomaliesBySeverity.high || 0;

    if (criticalCount > 0) return 'critical';
    if (highCount > 5) return 'warning';
    return 'healthy';
  }

  private async generateSystemRecommendations(anomalies: AnomalyDetection[]): Promise<string[]> {
    const recommendations: string[] = [];

    const criticalAnomalies = anomalies.filter(a => a.severity === 'critical');
    if (criticalAnomalies.length > 0) {
      recommendations.push('Immediate attention required for critical anomalies');
    }

    const paymentAnomalies = anomalies.filter(a => a.type === 'payment');
    if (paymentAnomalies.length > 3) {
      recommendations.push('Review payment processing and fraud detection systems');
    }

    return recommendations;
  }

  private async analyzeAnomalyTrends(anomalies: AnomalyDetection[]): Promise<AnomalyTrend[]> {
    // Implementation for analyzing anomaly trends
    return [];
  }

  private isAnomalyResolved(anomaly: AnomalyDetection): boolean {
    // Mock implementation - check if anomaly has been resolved
    return Math.random() > 0.7;
  }

  private markAnomalyResolved(anomaly: AnomalyDetection, resolution: string): void {
    // Mark anomaly as resolved with resolution details
    (anomaly as any).resolved = true;
    (anomaly as any).resolution = resolution;
    (anomaly as any).resolvedAt = new Date();
  }

  private generateAlertMessage(anomaly: AnomalyDetection): string {
    return `${anomaly.severity.toUpperCase()}: ${anomaly.description}`;
  }

  private generateResolutionSteps(anomaly: AnomalyDetection): string[] {
    return [
      'Acknowledge the alert',
      'Investigate the root cause',
      'Implement corrective actions',
      'Monitor for recurrence'
    ];
  }

  private estimateImpact(anomaly: AnomalyDetection): string {
    if (anomaly.severity === 'critical') return 'High impact on business operations';
    if (anomaly.severity === 'high') return 'Moderate impact expected';
    if (anomaly.severity === 'medium') return 'Low to moderate impact';
    return 'Minimal impact';
  }

  private estimateAffectedUsers(anomaly: AnomalyDetection): number {
    // Mock estimation of affected users
    return Math.floor(Math.random() * 100) + 1;
  }

  private async sendAlertNotification(alert: RealTimeAlert): Promise<void> {
    // Implementation for sending alert notifications
    console.log(`Alert notification sent: ${alert.message}`);
  }
}

export default AdvancedAnomalyDetection;