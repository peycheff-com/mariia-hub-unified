/**
 * Comprehensive User Experience Monitoring System
 *
 * Advanced UX monitoring with Core Web Vitals, user segmentation,
 * geographical analysis, device-specific monitoring, and satisfaction correlation.
 *
 * @author Performance Team
 * @version 1.0.0
 */

import { performance } from './performance-monitoring-system';

// ===== TYPE DEFINITIONS =====

interface UserSegment {
  id: string;
  name: string;
  criteria: {
    deviceType?: 'mobile' | 'tablet' | 'desktop';
    connectionType?: 'slow-2g' | '2g' | '3g' | '4g' | '5g' | 'wifi' | 'ethernet';
    browser?: string[];
    location?: string[];
    userType?: 'new' | 'returning' | 'vip';
    language?: string[];
  };
  weight: number; // Weight for business impact calculation
}

interface CoreWebVitalsMetrics {
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
  inp: number; // Interaction to Next Paint
  customMetrics: {
    bookingFlowCompletion: number;
    formInteractionTime: number;
    imageLoadTime: number;
    serviceSearchTime: number;
  };
}

interface UserExperienceMetrics {
  sessionId: string;
  userId?: string;
  segment: UserSegment;
  vitals: CoreWebVitalsMetrics;
  geographic: {
    country: string;
    city: string;
    region: string;
    timezone: string;
  };
  device: {
    type: 'mobile' | 'tablet' | 'desktop';
    os: string;
    browser: string;
    version: string;
    screenResolution: string;
    hardwareConcurrency: number;
    deviceMemory?: number;
  };
  network: {
    effectiveType: string;
    downlink: number;
    rtt: number;
    saveData: boolean;
  };
  session: {
    duration: number;
    pageViews: number;
    bounceRate: number;
    conversionEvents: string[];
    satisfaction?: {
      overall: number; // 1-5 scale
      performance: number; // 1-5 scale
      easeOfUse: number; // 1-5 scale;
      visualAppeal: number; // 1-5 scale;
    };
  };
  bookingFlow: {
    initiated: boolean;
    completed: boolean;
    stepsCompleted: number;
    totalTime: number;
    dropOffPoint?: string;
    frictionPoints: string[];
  };
  timestamp: number;
}

interface PerformanceInsight {
  type: 'critical' | 'warning' | 'opportunity' | 'positive';
  metric: keyof CoreWebVitalsMetrics;
  title: string;
  description: string;
  impact: {
    level: 'high' | 'medium' | 'low';
    business: string;
    userExperience: string;
  };
  recommendations: string[];
  affectedSegments: string[];
  estimatedConversionImpact: number;
}

interface SatisfactionCorrelation {
  metric: keyof CoreWebVitalsMetrics;
  correlation: number; // -1 to 1
  statisticalSignificance: number; // p-value
  insight: string;
  threshold: {
    poor: number;
    needsImprovement: number;
    good: number;
  };
  impactOnSatisfaction: {
    per100ms: number;
    businessImpact: string;
  };
}

interface GeographicalPerformance {
  location: {
    country: string;
    city: string;
    region: string;
  };
  metrics: {
    averageLCP: number;
    averageFID: number;
    averageCLS: number;
    userCount: number;
    satisfaction: number;
    conversionRate: number;
  };
  issues: Array<{
    type: 'network' | 'infrastructure' | 'content';
    description: string;
    severity: 'high' | 'medium' | 'low';
  }>;
  recommendations: string[];
}

interface DevicePerformanceReport {
  deviceType: 'mobile' | 'tablet' | 'desktop';
  sampleSize: number;
  metrics: {
    lcp: { avg: number; p50: number; p75: number; p90: number; p95: number };
    fid: { avg: number; p50: number; p75: number; p90: number; p95: number };
    cls: { avg: number; p50: number; p75: number; p90: number; p95: number };
  };
  topIssues: Array<{
    type: string;
    frequency: number;
    impact: string;
    solution: string;
  }>;
  optimizationOpportunities: string[];
}

// ===== USER EXPERIENCE MONITORING CLASS =====

class UserExperienceMonitoring {
  private static instance: UserExperienceMonitoring;
  private segments: Map<string, UserSegment> = new Map();
  private metrics: UserExperienceMetrics[] = [];
  private insights: PerformanceInsight[] = [];
  private satisfactionCorrelations: SatisfactionCorrelation[] = [];
  private geographicalData: Map<string, GeographicalPerformance> = new Map();
  private deviceReports: Map<string, DevicePerformanceReport> = new Map();
  private isInitialized = false;

  private constructor() {
    this.initializeDefaultSegments();
  }

  static getInstance(): UserExperienceMonitoring {
    if (!UserExperienceMonitoring.instance) {
      UserExperienceMonitoring.instance = new UserExperienceMonitoring();
    }
    return UserExperienceMonitoring.instance;
  }

  // ===== INITIALIZATION =====

  private initializeDefaultSegments(): void {
    const defaultSegments: UserSegment[] = [
      {
        id: 'mobile-premium',
        name: 'Premium Mobile Users',
        criteria: {
          deviceType: 'mobile',
          userType: 'vip',
          location: ['Warsaw', 'Kraków', 'Wrocław', 'Gdańsk']
        },
        weight: 1.5
      },
      {
        id: 'desktop-new',
        name: 'New Desktop Users',
        criteria: {
          deviceType: 'desktop',
          userType: 'new'
        },
        weight: 1.2
      },
      {
        id: 'mobile-slow-connection',
        name: 'Mobile Slow Connection',
        criteria: {
          deviceType: 'mobile',
          connectionType: ['slow-2g', '2g', '3g']
        },
        weight: 0.8
      },
      {
        id: 'returning-polish',
        name: 'Returning Polish Users',
        criteria: {
          userType: 'returning',
          location: ['Poland'],
          language: ['pl']
        },
        weight: 1.3
      },
      {
        id: 'beauty-booking',
        name: 'Beauty Service Bookers',
        criteria: {
          deviceType: 'mobile', // Most beauty bookings are mobile
        },
        weight: 1.4
      },
      {
        id: 'fitness-interested',
        name: 'Fitness Program Interests',
        criteria: {
          deviceType: 'desktop', // Fitness research often desktop
        },
        weight: 1.1
      }
    ];

    defaultSegments.forEach(segment => {
      this.segments.set(segment.id, segment);
    });
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load existing data
      await this.loadStoredMetrics();

      // Initialize Core Web Vitals monitoring
      this.initializeCoreWebVitalsMonitoring();

      // Set up real-time monitoring
      this.setupRealTimeMonitoring();

      // Start periodic analysis
      this.startPeriodicAnalysis();

      // Set up booking flow monitoring
      this.initializeBookingFlowMonitoring();

      this.isInitialized = true;

      performance.trackMetric('ux_monitoring_initialized', {
        segmentsCount: this.segments.size,
        historicalMetricsCount: this.metrics.length
      });

    } catch (error) {
      console.error('Failed to initialize UX monitoring:', error);
      performance.trackError(error as Error, {
        context: 'ux_monitoring_initialization'
      });
    }
  }

  // ===== CORE WEB VITALS MONITORING =====

  private initializeCoreWebVitalsMonitoring(): void {
    // Set up PerformanceObserver for Core Web Vitals
    if ('PerformanceObserver' in window) {
      // LCP monitoring
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.recordCoreWebVital('lcp', lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // FID monitoring
      const fidObserver = new PerformanceObserver((entryList) => {
        entryList.getEntries().forEach(entry => {
          if (entry instanceof PerformanceEventTiming) {
            this.recordCoreWebVital('fid', entry.processingStart - entry.startTime);
          }
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // CLS monitoring
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((entryList) => {
        entryList.getEntries().forEach(entry => {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
            this.recordCoreWebVital('cls', clsValue);
          }
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

      // INP monitoring (if supported)
      if ('InteractionCount' in PerformanceObserver.supportedEntryTypes) {
        const inpObserver = new PerformanceObserver((entryList) => {
          entryList.getEntries().forEach(entry => {
            if (entry instanceof PerformanceEventTiming) {
              this.recordCoreWebVital('inp', entry.duration);
            }
          });
        });
        inpObserver.observe({ entryTypes: ['event'] });
      }
    }

    // Custom metrics monitoring
    this.initializeCustomMetrics();
  }

  private initializeCustomMetrics(): void {
    // Booking flow completion time
    this.monitorBookingFlowMetrics();

    // Form interaction time
    this.monitorFormInteractions();

    // Image load performance
    this.monitorImagePerformance();

    // Service search performance
    this.monitorServiceSearchPerformance();
  }

  private recordCoreWebVital(metric: keyof CoreWebVitalsMetrics, value: number): void {
    const currentSession = this.getCurrentSessionData();
    if (currentSession) {
      currentSession.vitals[metric] = value;
      this.analyzeRealTimePerformance(currentSession);
    }
  }

  // ===== USER SEGMENTATION =====

  private getUserSegments(userData: any): UserSegment[] {
    const matchingSegments: UserSegment[] = [];

    this.segments.forEach(segment => {
      if (this.userMatchesSegment(userData, segment)) {
        matchingSegments.push(segment);
      }
    });

    return matchingSegments.length > 0 ? matchingSegments : [this.getDefaultSegment()];
  }

  private userMatchesSegment(userData: any, segment: UserSegment): boolean {
    const { criteria } = segment;

    if (criteria.deviceType && userData.device?.type !== criteria.deviceType) {
      return false;
    }

    if (criteria.connectionType && userData.network?.effectiveType !== criteria.connectionType) {
      return false;
    }

    if (criteria.browser && !criteria.browser.includes(userData.device?.browser)) {
      return false;
    }

    if (criteria.location && userData.geographic?.country &&
        !criteria.location.includes(userData.geographic.country)) {
      return false;
    }

    if (criteria.userType && userData.userType !== criteria.userType) {
      return false;
    }

    if (criteria.language && !criteria.language.includes(userData.language)) {
      return false;
    }

    return true;
  }

  private getDefaultSegment(): UserSegment {
    return {
      id: 'default',
      name: 'Default Segment',
      criteria: {},
      weight: 1.0
    };
  }

  // ===== BOOKING FLOW MONITORING =====

  private initializeBookingFlowMonitoring(): void {
    // Track booking funnel steps
    const funnelSteps = [
      'service-selection',
      'time-slot-selection',
      'personal-details',
      'payment-processing',
      'booking-confirmed'
    ];

    funnelSteps.forEach(step => {
      this.trackFunnelStep(step);
    });

    // Monitor friction points
    this.detectFrictionPoints();
  }

  private trackFunnelStep(step: string): void {
    // Track when users enter each step
    const startTime = performance.now();

    // Store step entry time
    sessionStorage.setItem(`funnel_${step}_start`, startTime.toString());

    // Track completion
    const trackCompletion = () => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      this.recordBookingFlowStep(step, duration);
      sessionStorage.removeItem(`funnel_${step}_start`);
    };

    // Set up completion tracking
    this.setupStepCompletionTracking(step, trackCompletion);
  }

  private recordBookingFlowStep(step: string, duration: number): void {
    const currentSession = this.getCurrentSessionData();
    if (currentSession) {
      currentSession.bookingFlow.stepsCompleted++;
      currentSession.bookingFlow.totalTime += duration;

      // Check for step-specific thresholds
      this.checkStepPerformance(step, duration, currentSession);
    }
  }

  private checkStepPerformance(step: string, duration: number, session: UserExperienceMetrics): void {
    const thresholds: Record<string, { good: number; poor: number }> = {
      'service-selection': { good: 2000, poor: 5000 },
      'time-slot-selection': { good: 1500, poor: 4000 },
      'personal-details': { good: 3000, poor: 8000 },
      'payment-processing': { good: 2000, poor: 6000 }
    };

    const threshold = thresholds[step];
    if (threshold) {
      if (duration > threshold.poor) {
        session.bookingFlow.frictionPoints.push(`${step}-slow`);
        this.generateFrictionAlert(step, duration, session.segment);
      } else if (duration > threshold.good) {
        session.bookingFlow.frictionPoints.push(`${step}-moderate`);
      }
    }
  }

  private detectFrictionPoints(): void {
    // Monitor for repeated form validation errors
    let validationErrorCount = 0;

    document.addEventListener('invalid', (event) => {
      validationErrorCount++;

      if (validationErrorCount > 3) {
        this.recordFrictionPoint('form-validation-errors', validationErrorCount);
      }
    }, true);

    // Monitor for rage clicks
    let clickCount = 0;
    let lastClickTime = 0;

    document.addEventListener('click', (event) => {
      const currentTime = performance.now();

      if (currentTime - lastClickTime < 100) {
        clickCount++;

        if (clickCount > 5) {
          this.recordFrictionPoint('rage-clicks', clickCount);
          clickCount = 0;
        }
      } else {
        clickCount = 1;
      }

      lastClickTime = currentTime;
    });

    // Monitor for excessive scrolling
    let scrollCount = 0;
    let scrollDistance = 0;

    document.addEventListener('scroll', () => {
      scrollCount++;
      scrollDistance += window.scrollY;

      if (scrollCount > 50) {
        this.recordFrictionPoint('excessive-scrolling', { count: scrollCount, distance: scrollDistance });
      }
    }, { passive: true });
  }

  // ===== GEOGRAPHICAL PERFORMANCE MONITORING =====

  private async updateUserGeographicData(session: UserExperienceMetrics): Promise<void> {
    try {
      // Get location from IP geolocation API
      const response = await fetch('/api/geolocation');
      const locationData = await response.json();

      session.geographic = {
        country: locationData.country || 'Unknown',
        city: locationData.city || 'Unknown',
        region: locationData.region || 'Unknown',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };

      // Update geographical performance data
      this.updateGeographicalPerformance(session);

    } catch (error) {
      console.warn('Failed to get geographic data:', error);

      // Fallback to timezone detection
      session.geographic = {
        country: 'Unknown',
        city: 'Unknown',
        region: 'Unknown',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };
    }
  }

  private updateGeographicalPerformance(session: UserExperienceMetrics): void {
    const locationKey = `${session.geographic.country}-${session.geographic.city}`;

    let geoData = this.geographicalData.get(locationKey);
    if (!geoData) {
      geoData = {
        location: {
          country: session.geographic.country,
          city: session.geographic.city,
          region: session.geographic.region
        },
        metrics: {
          averageLCP: 0,
          averageFID: 0,
          averageCLS: 0,
          userCount: 0,
          satisfaction: 0,
          conversionRate: 0
        },
        issues: [],
        recommendations: []
      };
      this.geographicalData.set(locationKey, geoData);
    }

    // Update running averages
    const userCount = geoData.metrics.userCount;
    geoData.metrics.userCount++;
    geoData.metrics.averageLCP = (geoData.metrics.averageLCP * userCount + session.vitals.lcp) / (userCount + 1);
    geoData.metrics.averageFID = (geoData.metrics.averageFID * userCount + session.vitals.fid) / (userCount + 1);
    geoData.metrics.averageCLS = (geoData.metrics.averageCLS * userCount + session.vitals.cls) / (userCount + 1);

    if (session.session.satisfaction) {
      geoData.metrics.satisfaction = (geoData.metrics.satisfaction * userCount + session.session.satisfaction.overall) / (userCount + 1);
    }

    if (session.bookingFlow.completed) {
      geoData.metrics.conversionRate = (geoData.metrics.conversionRate * userCount + 1) / (userCount + 1);
    }

    // Detect location-specific issues
    this.detectGeographicalIssues(geoData, session);
  }

  private detectGeographicalIssues(geoData: GeographicalPerformance, session: UserExperienceMetrics): void {
    if (session.vitals.lcp > 4000) {
      geoData.issues.push({
        type: 'network',
        description: 'Slow LCP detected for users in this location',
        severity: session.vitals.lcp > 6000 ? 'high' : 'medium'
      });
    }

    if (session.network.effectiveType === 'slow-2g' || session.network.effectiveType === '2g') {
      geoData.issues.push({
        type: 'network',
        description: 'Users on very slow connections in this location',
        severity: 'high'
      });
    }

    // Generate location-specific recommendations
    if (geoData.issues.length > 0) {
      geoData.recommendations = this.generateGeographicalRecommendations(geoData);
    }
  }

  private generateGeographicalRecommendations(geoData: GeographicalPerformance): string[] {
    const recommendations: string[] = [];

    const networkIssues = geoData.issues.filter(i => i.type === 'network');
    if (networkIssues.length > 0) {
      recommendations.push('Consider implementing regional CDN endpoints');
      recommendations.push('Optimize image delivery for this region');
      recommendations.push('Implement adaptive loading strategies');
    }

    const infrastructureIssues = geoData.issues.filter(i => i.type === 'infrastructure');
    if (infrastructureIssues.length > 0) {
      recommendations.push('Review server capacity for this region');
      recommendations.push('Consider geographic load balancing');
    }

    if (geoData.metrics.conversionRate < 0.05) {
      recommendations.push('Investigate localization issues for this market');
      recommendations.push('Review payment methods available in this region');
    }

    return recommendations;
  }

  // ===== DEVICE-SPECIFIC MONITORING =====

  private updateDevicePerformance(session: UserExperienceMetrics): void {
    const deviceType = session.device.type;

    let deviceReport = this.deviceReports.get(deviceType);
    if (!deviceReport) {
      deviceReport = {
        deviceType,
        sampleSize: 0,
        metrics: {
          lcp: { avg: 0, p50: 0, p75: 0, p90: 0, p95: 0 },
          fid: { avg: 0, p50: 0, p75: 0, p90: 0, p95: 0 },
          cls: { avg: 0, p50: 0, p75: 0, p90: 0, p95: 0 }
        },
        topIssues: [],
        optimizationOpportunities: []
      };
      this.deviceReports.set(deviceType, deviceReport);
    }

    // Update metrics
    deviceReport.sampleSize++;
    this.updatePercentiles(deviceReport.metrics.lcp, session.vitals.lcp);
    this.updatePercentiles(deviceReport.metrics.fid, session.vitals.fid);
    this.updatePercentiles(deviceReport.metrics.cls, session.vitals.cls);

    // Analyze device-specific issues
    this.analyzeDeviceSpecificIssues(session, deviceReport);
  }

  private updatePercentiles(metric: any, value: number): void {
    // Store values for percentile calculation
    const values = metric._values || [];
    values.push(value);

    // Sort for percentile calculation
    values.sort((a, b) => a - b);
    metric._values = values;

    // Calculate percentiles
    metric.avg = values.reduce((sum: number, val: number) => sum + val, 0) / values.length;
    metric.p50 = this.getPercentile(values, 0.5);
    metric.p75 = this.getPercentile(values, 0.75);
    metric.p90 = this.getPercentile(values, 0.9);
    metric.p95 = this.getPercentile(values, 0.95);
  }

  private getPercentile(sortedValues: number[], percentile: number): number {
    const index = Math.floor(sortedValues.length * percentile);
    return sortedValues[Math.min(index, sortedValues.length - 1)];
  }

  private analyzeDeviceSpecificIssues(session: UserExperienceMetrics, deviceReport: DevicePerformanceReport): void {
    const issues = deviceReport.topIssues;

    // Mobile-specific issues
    if (session.device.type === 'mobile') {
      if (session.vitals.fid > 300) {
        this.addOrUpdateIssue(issues, 'Mobile Responsiveness', 'High input delay on mobile', 'Optimize touch interactions and reduce JavaScript execution time');
      }

      if (session.vitals.lcp > 4000) {
        this.addOrUpdateIssue(issues, 'Mobile Loading', 'Slow LCP on mobile devices', 'Implement mobile-specific image optimization and lazy loading');
      }
    }

    // Memory-related issues
    if (session.device.deviceMemory && session.device.deviceMemory < 4) {
      if (session.vitals.cls > 0.25) {
        this.addOrUpdateIssue(issues, 'Low Memory Performance', 'High CLS on low-memory devices', 'Reduce animation complexity and optimize memory usage');
      }
    }

    // Network-related issues
    if (session.network.effectiveType === 'slow-2g' || session.network.effectiveType === '2g') {
      this.addOrUpdateIssue(issues, 'Slow Network', 'Poor performance on slow connections', 'Implement data-saving mode and critical resource prioritization');
    }

    // Update optimization opportunities
    deviceReport.optimizationOpportunities = this.generateDeviceOptimizationOpportunities(deviceReport);
  }

  private addOrUpdateIssue(issues: any[], type: string, description: string, solution: string): void {
    const existingIssue = issues.find(issue => issue.type === type);

    if (existingIssue) {
      existingIssue.frequency++;
    } else {
      issues.push({
        type,
        frequency: 1,
        impact: description,
        solution
      });
    }
  }

  private generateDeviceOptimizationOpportunities(deviceReport: DevicePerformanceReport): string[] {
    const opportunities: string[] = [];

    if (deviceReport.metrics.lcp.p75 > 3000) {
      opportunities.push('Optimize critical rendering path for faster LCP');
      opportunities.push('Implement resource hints (preload, prefetch)');
    }

    if (deviceReport.metrics.fid.p75 > 200) {
      opportunities.push('Reduce JavaScript execution time');
      opportunities.push('Implement code splitting and lazy loading');
    }

    if (deviceReport.metrics.cls.p75 > 0.1) {
      opportunities.push('Reserve space for dynamic content');
      opportunities.push('Optimize font loading strategies');
    }

    if (deviceReport.deviceType === 'mobile') {
      opportunities.push('Optimize touch targets and interactions');
      opportunities.push('Implement mobile-specific performance optimizations');
    }

    return opportunities;
  }

  // ===== SATISFACTION CORRELATION =====

  private async updateSatisfactionCorrelation(session: UserExperienceMetrics): Promise<void> {
    if (!session.session.satisfaction) return;

    // Update correlation data for each metric
    Object.keys(session.vitals).forEach(metric => {
      this.updateMetricCorrelation(
        metric as keyof CoreWebVitalsMetrics,
        session.vitals[metric as keyof CoreWebVitalsMetrics],
        session.session.satisfaction!.overall
      );
    });

    // Analyze correlation patterns
    await this.analyzeSatisfactionPatterns();
  }

  private updateMetricCorrelation(
    metric: keyof CoreWebVitalsMetrics,
    value: number,
    satisfaction: number
  ): void {
    let correlation = this.satisfactionCorrelations.find(c => c.metric === metric);

    if (!correlation) {
      correlation = {
        metric,
        correlation: 0,
        statisticalSignificance: 1,
        insight: '',
        threshold: {
          poor: this.getPoorThreshold(metric),
          needsImprovement: this.getNeedsImprovementThreshold(metric),
          good: this.getGoodThreshold(metric)
        },
        impactOnSatisfaction: {
          per100ms: 0,
          businessImpact: ''
        }
      };
      this.satisfactionCorrelations.push(correlation);
    }

    // Store data points for correlation analysis
    if (!correlation._dataPoints) {
      correlation._dataPoints = [];
    }

    correlation._dataPoints.push({ metricValue: value, satisfaction });

    // Calculate correlation if we have enough data
    if (correlation._dataPoints.length >= 10) {
      correlation.correlation = this.calculateCorrelation(correlation._dataPoints);
      correlation.statisticalSignificance = this.calculateSignificance(correlation._dataPoints);
      correlation.insight = this.generateCorrelationInsight(correlation);
      correlation.impactOnSatisfaction = this.calculateSatisfactionImpact(correlation);
    }
  }

  private calculateCorrelation(dataPoints: Array<{ metricValue: number; satisfaction: number }>): number {
    const n = dataPoints.length;
    if (n < 2) return 0;

    const sumX = dataPoints.reduce((sum, point) => sum + point.metricValue, 0);
    const sumY = dataPoints.reduce((sum, point) => sum + point.satisfaction, 0);
    const sumXY = dataPoints.reduce((sum, point) => sum + point.metricValue * point.satisfaction, 0);
    const sumX2 = dataPoints.reduce((sum, point) => sum + point.metricValue * point.metricValue, 0);
    const sumY2 = dataPoints.reduce((sum, point) => sum + point.satisfaction * point.satisfaction, 0);

    const correlation = (n * sumXY - sumX * sumY) /
      Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return isNaN(correlation) ? 0 : correlation;
  }

  private calculateSignificance(dataPoints: Array<{ metricValue: number; satisfaction: number }>): number {
    // Simplified significance calculation
    // In a real implementation, this would use proper statistical tests
    const n = dataPoints.length;
    if (n < 10) return 1;

    // Return p-value (lower is more significant)
    return Math.max(0.05, 1 / Math.sqrt(n));
  }

  private generateCorrelationInsight(correlation: SatisfactionCorrelation): string {
    const { metric, correlation: corr } = correlation;

    if (Math.abs(corr) < 0.3) {
      return `No strong correlation found between ${metric} and user satisfaction.`;
    } else if (corr < -0.3) {
      return `Higher ${metric} values are correlated with lower user satisfaction.`;
    } else {
      return `Higher ${metric} values are correlated with higher user satisfaction.`;
    }
  }

  private calculateSatisfactionImpact(correlation: SatisfactionCorrelation): {
    per100ms: number;
    businessImpact: string;
  } {
    const dataPoints = correlation._dataPoints || [];
    if (dataPoints.length < 10) {
      return { per100ms: 0, businessImpact: 'Insufficient data' };
    }

    // Calculate impact per 100ms change
    const avgMetric = dataPoints.reduce((sum, point) => sum + point.metricValue, 0) / dataPoints.length;
    const avgSatisfaction = dataPoints.reduce((sum, point) => sum + point.satisfaction, 0) / dataPoints.length;

    const impactPerUnit = correlation.correlation * (5 / 1); // Scale to 1-5 satisfaction range
    const per100ms = impactPerUnit * 100;

    let businessImpact = '';
    if (Math.abs(per100ms) < 0.1) {
      businessImpact = 'Minimal business impact';
    } else if (Math.abs(per100ms) < 0.3) {
      businessImpact = 'Moderate business impact';
    } else {
      businessImpact = 'Significant business impact on conversions';
    }

    return { per100ms, businessImpact };
  }

  // ===== HELPER METHODS =====

  private getCurrentSessionData(): UserExperienceMetrics | null {
    // In a real implementation, this would get the current session data
    // For now, create a mock session
    return {
      sessionId: this.generateSessionId(),
      segment: this.getDefaultSegment(),
      vitals: {
        lcp: 0, fid: 0, cls: 0, fcp: 0, ttfb: 0, inp: 0,
        customMetrics: {
          bookingFlowCompletion: 0,
          formInteractionTime: 0,
          imageLoadTime: 0,
          serviceSearchTime: 0
        }
      },
      geographic: {
        country: 'Unknown',
        city: 'Unknown',
        region: 'Unknown',
        timezone: 'Unknown'
      },
      device: this.getDeviceInfo(),
      network: this.getNetworkInfo(),
      session: {
        duration: 0,
        pageViews: 1,
        bounceRate: 0,
        conversionEvents: []
      },
      bookingFlow: {
        initiated: false,
        completed: false,
        stepsCompleted: 0,
        totalTime: 0,
        frictionPoints: []
      },
      timestamp: Date.now()
    };
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDeviceInfo() {
    return {
      type: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop',
      os: this.detectOS(),
      browser: this.detectBrowser(),
      version: this.detectBrowserVersion(),
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      hardwareConcurrency: navigator.hardwareConcurrency || 4,
      deviceMemory: (navigator as any).deviceMemory
    };
  }

  private getNetworkInfo() {
    const connection = (navigator as any).connection ||
                     (navigator as any).mozConnection ||
                     (navigator as any).webkitConnection;

    return {
      effectiveType: connection?.effectiveType || '4g',
      downlink: connection?.downlink || 10,
      rtt: connection?.rtt || 100,
      saveData: connection?.saveData || false
    };
  }

  private detectOS(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.indexOf('Windows') !== -1) return 'Windows';
    if (userAgent.indexOf('Mac') !== -1) return 'macOS';
    if (userAgent.indexOf('Linux') !== -1) return 'Linux';
    if (userAgent.indexOf('Android') !== -1) return 'Android';
    if (userAgent.indexOf('iOS') !== -1) return 'iOS';
    return 'Unknown';
  }

  private detectBrowser(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.indexOf('Chrome') !== -1) return 'Chrome';
    if (userAgent.indexOf('Firefox') !== -1) return 'Firefox';
    if (userAgent.indexOf('Safari') !== -1) return 'Safari';
    if (userAgent.indexOf('Edge') !== -1) return 'Edge';
    return 'Unknown';
  }

  private detectBrowserVersion(): string {
    const match = navigator.userAgent.match(/(Chrome|Firefox|Safari|Edge)\/(\d+)/);
    return match ? match[2] : 'Unknown';
  }

  private getPoorThreshold(metric: keyof CoreWebVitalsMetrics): number {
    const thresholds: Record<keyof CoreWebVitalsMetrics, number> = {
      lcp: 4000,
      fid: 300,
      cls: 0.25,
      fcp: 3000,
      ttfb: 800,
      inp: 200,
      customMetrics: 0
    };
    return thresholds[metric] || 0;
  }

  private getNeedsImprovementThreshold(metric: keyof CoreWebVitalsMetrics): number {
    const thresholds: Record<keyof CoreWebVitalsMetrics, number> = {
      lcp: 2500,
      fid: 100,
      cls: 0.1,
      fcp: 1800,
      ttfb: 600,
      inp: 100,
      customMetrics: 0
    };
    return thresholds[metric] || 0;
  }

  private getGoodThreshold(metric: keyof CoreWebVitalsMetrics): number {
    const thresholds: Record<keyof CoreWebVitalsMetrics, number> = {
      lcp: 1200,
      fid: 50,
      cls: 0.025,
      fcp: 1000,
      ttfb: 200,
      inp: 50,
      customMetrics: 0
    };
    return thresholds[metric] || 0;
  }

  // ===== ANALYSIS METHODS =====

  private analyzeRealTimePerformance(session: UserExperienceMetrics): void {
    // Check for performance issues in real-time
    this.checkPerformanceThresholds(session);
    this.generateRealTimeInsights(session);
  }

  private checkPerformanceThresholds(session: UserExperienceMetrics): void {
    const vitals = session.vitals;

    // Check LCP
    if (vitals.lcp > this.getPoorThreshold('lcp')) {
      this.generateAlert('slow-lcp', `Slow LCP detected: ${vitals.lcp}ms`, session);
    }

    // Check FID
    if (vitals.fid > this.getPoorThreshold('fid')) {
      this.generateAlert('slow-fid', `Slow FID detected: ${vitals.fid}ms`, session);
    }

    // Check CLS
    if (vitals.cls > this.getPoorThreshold('cls')) {
      this.generateAlert('high-cls', `High CLS detected: ${vitals.cls}`, session);
    }
  }

  private generateRealTimeInsights(session: UserExperienceMetrics): void {
    // Generate insights based on current performance
    const insights: PerformanceInsight[] = [];

    // LCP insights
    if (session.vitals.lcp > 3000) {
      insights.push({
        type: 'critical',
        metric: 'lcp',
        title: 'Slow Largest Contentful Paint',
        description: `LCP of ${session.vitals.lcp}ms is affecting user experience`,
        impact: {
          level: 'high',
          business: 'Potential loss of bookings due to slow loading',
          userExperience: 'Users may abandon booking process'
        },
        recommendations: [
          'Optimize critical images',
          'Remove render-blocking resources',
          'Implement resource preloading'
        ],
        affectedSegments: [session.segment.id],
        estimatedConversionImpact: -0.05
      });
    }

    // Add insights to global list
    this.insights.push(...insights);
  }

  private generateAlert(type: string, message: string, session: UserExperienceMetrics): void {
    // Send alert to monitoring system
    performance.trackError(new Error(message), {
      context: 'ux_monitoring_alert',
      alertType: type,
      segment: session.segment.id,
      sessionId: session.sessionId
    });
  }

  private recordFrictionPoint(type: string, data: any): void {
    const session = this.getCurrentSessionData();
    if (session) {
      session.bookingFlow.frictionPoints.push(`${type}-${JSON.stringify(data)}`);

      performance.trackMetric('user_friction_point', {
        type,
        data,
        sessionId: session.sessionId,
        segment: session.segment.id
      });
    }
  }

  private async loadStoredMetrics(): Promise<void> {
    try {
      const stored = localStorage.getItem('ux_metrics');
      if (stored) {
        const parsedData = JSON.parse(stored);
        this.metrics = parsedData.metrics || [];
        this.insights = parsedData.insights || [];
        this.satisfactionCorrelations = parsedData.correlations || [];
      }
    } catch (error) {
      console.warn('Failed to load stored UX metrics:', error);
    }
  }

  private setupRealTimeMonitoring(): void {
    // Set up interval for real-time analysis
    setInterval(() => {
      this.performRealTimeAnalysis();
    }, 30000); // Every 30 seconds
  }

  private startPeriodicAnalysis(): void {
    // Set up hourly analysis
    setInterval(() => {
      this.performHourlyAnalysis();
    }, 3600000); // Every hour

    // Set up daily analysis
    setInterval(() => {
      this.performDailyAnalysis();
    }, 86400000); // Every 24 hours
  }

  private performRealTimeAnalysis(): void {
    // Analyze current active sessions
    // Generate real-time insights
    this.updatePerformanceDashboard();
  }

  private performHourlyAnalysis(): void {
    // Analyze trends over the past hour
    // Update geographical and device reports
    this.generateHourlyReport();
  }

  private performDailyAnalysis(): void {
    // Comprehensive daily analysis
    // Generate daily performance report
    // Update long-term trends
    this.generateDailyReport();
  }

  // ===== MONITORING SPECIFIC METRICS =====

  private monitorBookingFlowMetrics(): void {
    // Track booking completion time
    let bookingStartTime = 0;

    const startBookingTracking = () => {
      bookingStartTime = performance.now();
    };

    const completeBookingTracking = () => {
      if (bookingStartTime > 0) {
        const duration = performance.now() - bookingStartTime;
        const session = this.getCurrentSessionData();
        if (session) {
          session.vitals.customMetrics.bookingFlowCompletion = duration;
          session.bookingFlow.completed = true;
        }
        bookingStartTime = 0;
      }
    };

    // Set up event listeners for booking tracking
    document.addEventListener('booking-started', startBookingTracking);
    document.addEventListener('booking-completed', completeBookingTracking);
  }

  private monitorFormInteractions(): void {
    document.addEventListener('focusin', (event) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        const startTime = performance.now();

        const trackInteractionEnd = () => {
          const duration = performance.now() - startTime;
          const session = this.getCurrentSessionData();
          if (session) {
            session.vitals.customMetrics.formInteractionTime += duration;
          }
        };

        target.addEventListener('focusout', trackInteractionEnd, { once: true });
      }
    });
  }

  private monitorImagePerformance(): void {
    if ('PerformanceObserver' in window) {
      const imageObserver = new PerformanceObserver((entryList) => {
        entryList.getEntries().forEach(entry => {
          if (entry.name.includes('.jpg') || entry.name.includes('.png') || entry.name.includes('.webp')) {
            const session = this.getCurrentSessionData();
            if (session) {
              session.vitals.customMetrics.imageLoadTime += entry.duration;
            }
          }
        });
      });

      imageObserver.observe({ entryTypes: ['resource'] });
    }
  }

  private monitorServiceSearchPerformance(): void {
    let searchStartTime = 0;

    const startSearchTracking = () => {
      searchStartTime = performance.now();
    };

    const completeSearchTracking = () => {
      if (searchStartTime > 0) {
        const duration = performance.now() - searchStartTime;
        const session = this.getCurrentSessionData();
        if (session) {
          session.vitals.customMetrics.serviceSearchTime = duration;
        }
        searchStartTime = 0;
      }
    };

    // Set up search tracking
    document.addEventListener('search-started', startSearchTracking);
    document.addEventListener('search-completed', completeSearchTracking);
  }

  // ===== DASHBOARD AND REPORTING =====

  private updatePerformanceDashboard(): void {
    // Update dashboard with latest metrics
    performance.trackMetric('ux_dashboard_update', {
      totalSessions: this.metrics.length,
      activeInsights: this.insights.length,
      geographicalLocations: this.geographicalData.size,
      deviceReports: this.deviceReports.size
    });
  }

  private generateHourlyReport(): void {
    const lastHour = Date.now() - 3600000;
    const recentMetrics = this.metrics.filter(m => m.timestamp > lastHour);

    const report = {
      timestamp: Date.now(),
      period: 'hourly',
      totalSessions: recentMetrics.length,
      averageMetrics: this.calculateAverageMetrics(recentMetrics),
      topIssues: this.getTopIssues(recentMetrics),
      recommendations: this.generateRecommendations(recentMetrics)
    };

    performance.trackMetric('ux_hourly_report', report);
  }

  private generateDailyReport(): void {
    const lastDay = Date.now() - 86400000;
    const recentMetrics = this.metrics.filter(m => m.timestamp > lastDay);

    const report = {
      timestamp: Date.now(),
      period: 'daily',
      totalSessions: recentMetrics.length,
      averageMetrics: this.calculateAverageMetrics(recentMetrics),
      geographicalBreakdown: this.getGeographicalBreakdown(),
      deviceBreakdown: this.getDeviceBreakdown(),
      satisfactionCorrelations: this.satisfactionCorrelations,
      topIssues: this.getTopIssues(recentMetrics),
      recommendations: this.generateRecommendations(recentMetrics),
      businessImpact: this.calculateBusinessImpact(recentMetrics)
    };

    performance.trackMetric('ux_daily_report', report);
  }

  private calculateAverageMetrics(metrics: UserExperienceMetrics[]) {
    if (metrics.length === 0) return null;

    const totals = metrics.reduce((acc, metric) => {
      acc.lcp += metric.vitals.lcp;
      acc.fid += metric.vitals.fid;
      acc.cls += metric.vitals.cls;
      return acc;
    }, { lcp: 0, fid: 0, cls: 0 });

    return {
      lcp: totals.lcp / metrics.length,
      fid: totals.fid / metrics.length,
      cls: totals.cls / metrics.length,
      sampleSize: metrics.length
    };
  }

  private getTopIssues(metrics: UserExperienceMetrics[]) {
    const issueCount = new Map<string, number>();

    metrics.forEach(metric => {
      metric.bookingFlow.frictionPoints.forEach(point => {
        const issueType = point.split('-')[0];
        issueCount.set(issueType, (issueCount.get(issueType) || 0) + 1);
      });
    });

    return Array.from(issueCount.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([issue, count]) => ({ issue, count }));
  }

  private generateRecommendations(metrics: UserExperienceMetrics[]): string[] {
    const recommendations: string[] = [];
    const avgMetrics = this.calculateAverageMetrics(metrics);

    if (!avgMetrics) return recommendations;

    if (avgMetrics.lcp > 3000) {
      recommendations.push('Optimize LCP by reducing server response time and optimizing critical resources');
    }

    if (avgMetrics.fid > 200) {
      recommendations.push('Reduce FID by minimizing JavaScript execution time and breaking up long tasks');
    }

    if (avgMetrics.cls > 0.1) {
      recommendations.push('Reduce CLS by ensuring proper dimensions for images and avoiding content shifts');
    }

    return recommendations;
  }

  private getGeographicalBreakdown() {
    const breakdown: Record<string, any> = {};

    this.geographicalData.forEach((data, location) => {
      breakdown[location] = {
        userCount: data.metrics.userCount,
        averageLCP: data.metrics.averageLCP,
        satisfaction: data.metrics.satisfaction,
        conversionRate: data.metrics.conversionRate
      };
    });

    return breakdown;
  }

  private getDeviceBreakdown() {
    const breakdown: Record<string, any> = {};

    this.deviceReports.forEach((report, deviceType) => {
      breakdown[deviceType] = {
        sampleSize: report.sampleSize,
        averageLCP: report.metrics.lcp.avg,
        averageFID: report.metrics.fid.avg,
        averageCLS: report.metrics.cls.avg
      };
    });

    return breakdown;
  }

  private calculateBusinessImpact(metrics: UserExperienceMetrics[]) {
    // Calculate estimated business impact based on performance
    const completedBookings = metrics.filter(m => m.bookingFlow.completed).length;
    const totalSessions = metrics.length;
    const conversionRate = totalSessions > 0 ? completedBookings / totalSessions : 0;

    // Estimate potential improvement
    const avgMetrics = this.calculateAverageMetrics(metrics);
    let potentialImprovement = 0;

    if (avgMetrics && avgMetrics.lcp > 2500) {
      potentialImprovement += 0.02; // 2% improvement if LCP optimized
    }

    if (avgMetrics && avgMetrics.fid > 150) {
      potentialImprovement += 0.01; // 1% improvement if FID optimized
    }

    return {
      currentConversionRate: conversionRate,
      potentialImprovement,
      estimatedAdditionalBookings: Math.floor(totalSessions * potentialImprovement)
    };
  }

  // ===== SETUP METHODS =====

  private setupStepCompletionTracking(step: string, callback: () => void): void {
    // This would be implemented based on specific application events
    // For now, it's a placeholder for the tracking setup
  }

  // ===== PUBLIC API =====

  public getUserSegmentById(segmentId: string): UserSegment | undefined {
    return this.segments.get(segmentId);
  }

  public getGeographicalPerformance(location: string): GeographicalPerformance | undefined {
    return this.geographicalData.get(location);
  }

  public getDevicePerformance(deviceType: string): DevicePerformanceReport | undefined {
    return this.deviceReports.get(deviceType);
  }

  public getSatisfactionCorrelations(): SatisfactionCorrelation[] {
    return this.satisfactionCorrelations;
  }

  public getPerformanceInsights(): PerformanceInsight[] {
    return this.insights;
  }

  public addCustomSegment(segment: UserSegment): void {
    this.segments.set(segment.id, segment);
  }

  public async recordUserSatisfaction(satisfaction: {
    overall: number;
    performance: number;
    easeOfUse: number;
    visualAppeal: number;
  }): Promise<void> {
    const session = this.getCurrentSessionData();
    if (session) {
      session.session.satisfaction = satisfaction;
      await this.updateSatisfactionCorrelation(session);
    }
  }
}

// Initialize and export the monitoring system
export const userExperienceMonitoring = UserExperienceMonitoring.getInstance();

export type {
  UserSegment,
  CoreWebVitalsMetrics,
  UserExperienceMetrics,
  PerformanceInsight,
  SatisfactionCorrelation,
  GeographicalPerformance,
  DevicePerformanceReport
};

// Initialize the monitoring system
if (typeof window !== 'undefined') {
  userExperienceMonitoring.initialize().catch(console.error);
}