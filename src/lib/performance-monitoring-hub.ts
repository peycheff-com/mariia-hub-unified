import { supabase } from '@/integrations/supabase';

export interface SystemHealthMetrics {
  overall: 'healthy' | 'degraded' | 'critical';
  uptime: number;
  responseTime: number;
  errorRate: number;
  throughput: number;
  components: Array<{
    name: string;
    status: 'healthy' | 'degraded' | 'critical';
    responseTime: number;
    errorRate: number;
    lastCheck: string;
    dependencies: string[];
  }>;
  alerts: Array<{
    type: 'performance' | 'availability' | 'capacity' | 'security';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    component: string;
    timestamp: string;
  }>;
}

export interface PerformanceMetrics {
  userExperience: {
    pageLoadTime: number;
    timeToInteractive: number;
    coreWebVitals: {
      lcp: number; // Largest Contentful Paint
      fid: number; // First Input Delay
      cls: number; // Cumulative Layout Shift
    };
    errorRate: number;
    userSatisfaction: number;
  };
  application: {
    responseTime: number;
    throughput: number;
    errorRate: number;
    availability: number;
    resourceUtilization: {
      cpu: number;
      memory: number;
      storage: number;
      network: number;
    };
  };
  business: {
    conversionRate: number;
    supportEfficiency: number;
    clientSatisfaction: number;
    revenueImpact: number;
    operationalCosts: number;
  };
  luxury: {
    vipResponseTime: number;
    luxuryExperienceScore: number;
    personalizationEffectiveness: number;
    brandConsistency: number;
    exclusiveAccessUptime: number;
  };
}

export interface PerformanceAlert {
  id: string;
  type: 'threshold' | 'anomaly' | 'trend' | 'capacity';
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  description: string;
  metric: string;
  currentValue: number;
  threshold: number;
  trend: 'improving' | 'stable' | 'degrading';
  impact: {
    affectedSystems: string[];
    userImpact: 'none' | 'minor' | 'moderate' | 'major' | 'critical';
    businessImpact: 'low' | 'medium' | 'high' | 'critical';
  };
  resolution: {
    steps: string[];
    owner?: string;
    estimatedTime?: string;
    dependencies: string[];
  };
  timestamp: string;
  status: 'active' | 'acknowledged' | 'resolved';
}

export interface PerformanceBenchmark {
  id: string;
  name: string;
  category: 'user_experience' | 'application' | 'business' | 'luxury';
  metric: string;
  currentValue: number;
  baseline: number;
  target: number;
  industry: {
    average: number;
    topQuartile: number;
    best: number;
  };
  trend: {
    direction: 'up' | 'down' | 'stable';
    change: number;
    timeframe: string;
  };
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  improvement: {
    potential: number;
    effort: 'low' | 'medium' | 'high';
    priority: number;
    recommendations: string[];
  };
}

export interface PerformanceOptimization {
  id: string;
  title: string;
  description: string;
  category: 'front_end' | 'back_end' | 'database' | 'infrastructure' | 'process';
  impact: {
    performanceGain: number;
    userExperienceImprovement: number;
    businessImpact: number;
  };
  effort: {
    development: 'low' | 'medium' | 'high';
    complexity: 'low' | 'medium' | 'high';
    risk: 'low' | 'medium' | 'high';
  };
  priority: number;
  status: 'identified' | 'planned' | 'in_progress' | 'completed' | 'cancelled';
  implementation: {
    owner?: string;
    startDate?: string;
    targetDate?: string;
    actualDate?: string;
  };
  results?: {
    beforeMetrics: Record<string, number>;
    afterMetrics: Record<string, number>;
    actualImprovement: number;
    successCriteria: string[];
  };
}

export class PerformanceMonitoringHub {
  private alerts: Map<string, PerformanceAlert> = new Map();
  private benchmarks: Map<string, PerformanceBenchmark> = new Map();
  private optimizations: Map<string, PerformanceOptimization> = new Map();
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.initializePerformanceMonitoring();
  }

  /**
   * Get comprehensive system health metrics
   */
  async getSystemHealth(): Promise<SystemHealthMetrics> {
    try {
      const [
        uptime,
        responseTime,
        errorRate,
        throughput,
        components,
        alerts
      ] = await Promise.all([
        this.calculateUptime(),
        this.getAverageResponseTime(),
        this.getErrorRate(),
        this.getThroughput(),
        this.getComponentHealth(),
        this.getActivePerformanceAlerts()
      ]);

      const overall = this.determineOverallHealth(components, alerts);

      return {
        overall,
        uptime,
        responseTime,
        errorRate,
        throughput,
        components,
        alerts
      };
    } catch (error) {
      console.error('Failed to get system health:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive performance metrics
   */
  async getPerformanceMetrics(timeRange: string = '1h'): Promise<PerformanceMetrics> {
    try {
      const [
        userExperience,
        application,
        business,
        luxury
      ] = await Promise.all([
        this.getUserExperienceMetrics(timeRange),
        this.getApplicationMetrics(timeRange),
        this.getBusinessMetrics(timeRange),
        this.getLuxuryMetrics(timeRange)
      ]);

      return {
        userExperience,
        application,
        business,
        luxury
      };
    } catch (error) {
      console.error('Failed to get performance metrics:', error);
      throw error;
    }
  }

  /**
   * Get performance benchmarks and grades
   */
  async getPerformanceBenchmarks(): Promise<PerformanceBenchmark[]> {
    try {
      if (this.benchmarks.size === 0) {
        await this.loadBenchmarks();
      }

      // Update benchmark data with current values
      const updatedBenchmarks = await Promise.all(
        Array.from(this.benchmarks.values()).map(async (benchmark) => {
          const currentValue = await this.getCurrentMetricValue(benchmark.metric);
          const grade = this.calculateGrade(currentValue, benchmark.target, benchmark.industry);
          const trend = await this.calculateTrend(benchmark.metric);

          return {
            ...benchmark,
            currentValue,
            grade,
            trend
          };
        })
      );

      return updatedBenchmarks.sort((a, b) => b.priority - a.priority);
    } catch (error) {
      console.error('Failed to get performance benchmarks:', error);
      return [];
    }
  }

  /**
   * Get performance optimization opportunities
   */
  async getOptimizationOpportunities(): Promise<{
    quickWins: PerformanceOptimization[];
    strategicImprovements: PerformanceOptimization[];
    highImpactItems: PerformanceOptimization[];
  }> {
    try {
      if (this.optimizations.size === 0) {
        await this.loadOptimizations();
      }

      const optimizations = Array.from(this.optimizations.values());

      const quickWins = optimizations
        .filter(opt => opt.effort.development === 'low' && opt.impact.performanceGain > 10)
        .sort((a, b) => b.impact.performanceGain - a.impact.performanceGain);

      const strategicImprovements = optimizations
        .filter(opt => opt.effort.development === 'high' && opt.impact.businessImpact > 50)
        .sort((a, b) => b.impact.businessImpact - a.impact.businessImpact);

      const highImpactItems = optimizations
        .filter(opt => opt.priority > 80)
        .sort((a, b) => b.priority - a.priority);

      return {
        quickWins,
        strategicImprovements,
        highImpactItems
      };
    } catch (error) {
      console.error('Failed to get optimization opportunities:', error);
      return {
        quickWins: [],
        strategicImprovements: [],
        highImpactItems: []
      };
    }
  }

  /**
   * Create performance alert
   */
  async createPerformanceAlert(alert: Omit<PerformanceAlert, 'id' | 'timestamp' | 'status'>): Promise<PerformanceAlert> {
    try {
      const performanceAlert: PerformanceAlert = {
        ...alert,
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        status: 'active'
      };

      // Save alert to database
      await supabase
        .from('performance_alerts')
        .insert({
          id: performanceAlert.id,
          alert_type: alert.type,
          severity: alert.severity,
          title: alert.title,
          description: alert.description,
          metric: alert.metric,
          current_value: alert.currentValue,
          threshold: alert.threshold,
          trend: alert.trend,
          impact: alert.impact,
          resolution: alert.resolution,
          created_at: new Date().toISOString(),
          status: 'active'
        });

      // Cache alert
      this.alerts.set(performanceAlert.id, performanceAlert);

      // Trigger alert notifications
      await this.triggerAlertNotifications(performanceAlert);

      return performanceAlert;
    } catch (error) {
      console.error('Failed to create performance alert:', error);
      throw error;
    }
  }

  /**
   * Start performance monitoring for specific metrics
   */
  async startPerformanceMonitoring(metrics: string[], interval: number = 60000): Promise<void> {
    try {
      metrics.forEach(metric => {
        // Clear existing interval if any
        if (this.monitoringIntervals.has(metric)) {
          clearInterval(this.monitoringIntervals.get(metric)!);
        }

        // Start new monitoring interval
        const intervalId = setInterval(async () => {
          await this.checkMetricThresholds(metric);
        }, interval);

        this.monitoringIntervals.set(metric, intervalId);
      });

      console.log(`Started performance monitoring for metrics: ${metrics.join(', ')}`);
    } catch (error) {
      console.error('Failed to start performance monitoring:', error);
      throw error;
    }
  }

  /**
   * Generate performance report
   */
  async generatePerformanceReport(timeRange: string = '24h'): Promise<{
    summary: {
      overallScore: number;
      systemHealth: string;
      criticalAlerts: number;
      improvements: number;
    };
    metrics: PerformanceMetrics;
    benchmarks: PerformanceBenchmark[];
    alerts: PerformanceAlert[];
    recommendations: Array<{
      category: string;
      recommendation: string;
      impact: string;
      effort: string;
      priority: number;
    }>;
    trends: Array<{
      metric: string;
      direction: 'improving' | 'stable' | 'degrading';
      change: number;
      significance: 'high' | 'medium' | 'low';
    }>;
  }> {
    try {
      const [
        metrics,
        benchmarks,
        alerts,
        systemHealth
      ] = await Promise.all([
        this.getPerformanceMetrics(timeRange),
        this.getPerformanceBenchmarks(),
        this.getActivePerformanceAlerts(),
        this.getSystemHealth()
      ]);

      const criticalAlerts = alerts.filter(alert => alert.severity === 'critical').length;
      const overallScore = this.calculateOverallScore(metrics, benchmarks);
      const improvements = await this.getOptimizationOpportunities();

      const recommendations = await this.generateRecommendations(metrics, benchmarks, alerts);
      const trends = await this.analyzeTrends(metrics);

      return {
        summary: {
          overallScore,
          systemHealth: systemHealth.overall,
          criticalAlerts,
          improvements: improvements.quickWins.length + improvements.strategicImprovements.length
        },
        metrics,
        benchmarks,
        alerts,
        recommendations,
        trends
      };
    } catch (error) {
      console.error('Failed to generate performance report:', error);
      throw error;
    }
  }

  /**
   * Track optimization implementation
   */
  async trackOptimization(
    optimizationId: string,
    implementation: {
      owner: string;
      actualDate: string;
      beforeMetrics: Record<string, number>;
      afterMetrics: Record<string, number>;
      successCriteria: string[];
    }
  ): Promise<PerformanceOptimization> {
    try {
      const optimization = this.optimizations.get(optimizationId);
      if (!optimization) {
        throw new Error('Optimization not found');
      }

      const actualImprovement = this.calculateActualImprovement(
        implementation.beforeMetrics,
        implementation.afterMetrics
      );

      const updatedOptimization: PerformanceOptimization = {
        ...optimization,
        status: 'completed',
        implementation: {
          ...optimization.implementation,
          owner: implementation.owner,
          actualDate: implementation.actualDate
        },
        results: {
          beforeMetrics: implementation.beforeMetrics,
          afterMetrics: implementation.afterMetrics,
          actualImprovement,
          successCriteria: implementation.successCriteria
        }
      };

      // Update database
      await supabase
        .from('performance_optimizations')
        .update({
          status: 'completed',
          implementation_owner: implementation.owner,
          actual_date: implementation.actualDate,
          before_metrics: implementation.beforeMetrics,
          after_metrics: implementation.afterMetrics,
          actual_improvement: actualImprovement,
          success_criteria: implementation.successCriteria,
          updated_at: new Date().toISOString()
        })
        .eq('id', optimizationId);

      // Update cache
      this.optimizations.set(optimizationId, updatedOptimization);

      return updatedOptimization;
    } catch (error) {
      console.error('Failed to track optimization:', error);
      throw error;
    }
  }

  // Private helper methods
  private async initializePerformanceMonitoring(): Promise<void> {
    await this.loadBenchmarks();
    await this.loadOptimizations();
    await this.setupDefaultMonitoring();
    await this.startHealthChecks();
  }

  private async loadBenchmarks(): Promise<void> {
    // Load performance benchmarks from database or define defaults
    const defaultBenchmarks: PerformanceBenchmark[] = [
      {
        id: 'page-load-time',
        name: 'Page Load Time',
        category: 'user_experience',
        metric: 'page_load_time',
        currentValue: 0,
        baseline: 3.0,
        target: 1.5,
        industry: { average: 2.5, topQuartile: 1.8, best: 1.2 },
        trend: { direction: 'stable', change: 0, timeframe: '24h' },
        grade: 'A',
        improvement: {
          potential: 15,
          effort: 'medium',
          priority: 85,
          recommendations: ['Optimize images', 'Minimize JavaScript', 'Enable compression']
        }
      },
      {
        id: 'vip-response-time',
        name: 'VIP Response Time',
        category: 'luxury',
        metric: 'vip_response_time',
        currentValue: 0,
        baseline: 120,
        target: 30,
        industry: { average: 90, topQuartile: 45, best: 20 },
        trend: { direction: 'stable', change: 0, timeframe: '24h' },
        grade: 'A',
        improvement: {
          potential: 25,
          effort: 'high',
          priority: 95,
          recommendations: ['Implement VIP routing', 'Dedicated support team', 'Proactive monitoring']
        }
      }
    ];

    defaultBenchmarks.forEach(benchmark => {
      this.benchmarks.set(benchmark.id, benchmark);
    });
  }

  private async loadOptimizations(): Promise<void> {
    // Load optimization opportunities from database or define defaults
    const defaultOptimizations: PerformanceOptimization[] = [
      {
        id: 'image-optimization',
        title: 'Image Optimization',
        description: 'Optimize and compress images for faster loading',
        category: 'front_end',
        impact: {
          performanceGain: 20,
          userExperienceImprovement: 15,
          businessImpact: 10
        },
        effort: {
          development: 'low',
          complexity: 'low',
          risk: 'low'
        },
        priority: 75,
        status: 'identified'
      },
      {
        id: 'database-indexing',
        title: 'Database Query Optimization',
        description: 'Add indexes and optimize database queries',
        category: 'database',
        impact: {
          performanceGain: 35,
          userExperienceImprovement: 25,
          businessImpact: 20
        },
        effort: {
          development: 'medium',
          complexity: 'medium',
          risk: 'medium'
        },
        priority: 85,
        status: 'identified'
      }
    ];

    defaultOptimizations.forEach(optimization => {
      this.optimizations.set(optimization.id, optimization);
    });
  }

  private async setupDefaultMonitoring(): Promise<void> {
    const defaultMetrics = [
      'page_load_time',
      'api_response_time',
      'error_rate',
      'vip_response_time',
      'support_efficiency'
    ];

    await this.startPerformanceMonitoring(defaultMetrics, 60000); // Check every minute
  }

  private async startHealthChecks(): Promise<void> {
    // Start comprehensive health checks
    setInterval(async () => {
      await this.performHealthCheck();
    }, 300000); // Every 5 minutes
  }

  private async calculateUptime(): Promise<number> {
    // Implementation for uptime calculation
    return 99.97;
  }

  private async getAverageResponseTime(): Promise<number> {
    // Implementation for response time calculation
    return 245; // milliseconds
  }

  private async getErrorRate(): Promise<number> {
    // Implementation for error rate calculation
    return 0.02; // 2%
  }

  private async getThroughput(): Promise<number> {
    // Implementation for throughput calculation
    return 1250; // requests per minute
  }

  private async getComponentHealth(): Promise<SystemHealthMetrics['components']> {
    // Implementation for component health check
    return [
      {
        name: 'API Gateway',
        status: 'healthy',
        responseTime: 120,
        errorRate: 0.01,
        lastCheck: new Date().toISOString(),
        dependencies: ['Database', 'Authentication Service']
      },
      {
        name: 'Database',
        status: 'healthy',
        responseTime: 45,
        errorRate: 0.001,
        lastCheck: new Date().toISOString(),
        dependencies: []
      }
    ];
  }

  private async getActivePerformanceAlerts(): Promise<PerformanceAlert[]> {
    const { data } = await supabase
      .from('performance_alerts')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    return data || [];
  }

  private determineOverallHealth(
    components: SystemHealthMetrics['components'],
    alerts: PerformanceAlert[]
  ): SystemHealthMetrics['overall'] {
    const criticalComponents = components.filter(c => c.status === 'critical').length;
    const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;

    if (criticalComponents > 0 || criticalAlerts > 0) {
      return 'critical';
    }

    const degradedComponents = components.filter(c => c.status === 'degraded').length;
    const highAlerts = alerts.filter(a => a.severity === 'high').length;

    if (degradedComponents > 0 || highAlerts > 0) {
      return 'degraded';
    }

    return 'healthy';
  }

  private async getUserExperienceMetrics(timeRange: string): Promise<PerformanceMetrics['userExperience']> {
    return {
      pageLoadTime: 1.8,
      timeToInteractive: 2.1,
      coreWebVitals: {
        lcp: 2.1,
        fid: 45,
        cls: 0.08
      },
      errorRate: 0.015,
      userSatisfaction: 4.6
    };
  }

  private async getApplicationMetrics(timeRange: string): Promise<PerformanceMetrics['application']> {
    return {
      responseTime: 245,
      throughput: 1250,
      errorRate: 0.02,
      availability: 99.97,
      resourceUtilization: {
        cpu: 45,
        memory: 67,
        storage: 32,
        network: 28
      }
    };
  }

  private async getBusinessMetrics(timeRange: string): Promise<PerformanceMetrics['business']> {
    return {
      conversionRate: 3.8,
      supportEfficiency: 87,
      clientSatisfaction: 4.6,
      revenueImpact: 125000,
      operationalCosts: 45000
    };
  }

  private async getLuxuryMetrics(timeRange: string): Promise<PerformanceMetrics['luxury']> {
    return {
      vipResponseTime: 25,
      luxuryExperienceScore: 94.5,
      personalizationEffectiveness: 89,
      brandConsistency: 92,
      exclusiveAccessUptime: 99.99
    };
  }

  private async getCurrentMetricValue(metric: string): Promise<number> {
    // Implementation for getting current metric value
    switch (metric) {
      case 'page_load_time': return 1.8;
      case 'vip_response_time': return 25;
      default: return 0;
    }
  }

  private calculateGrade(current: number, target: number, industry: PerformanceBenchmark['industry']): PerformanceBenchmark['grade'] {
    if (current <= target) return 'A+';
    if (current <= industry.best) return 'A';
    if (current <= industry.topQuartile) return 'B';
    if (current <= industry.average) return 'C';
    return 'D';
  }

  private async calculateTrend(metric: string): Promise<PerformanceBenchmark['trend']> {
    // Implementation for trend calculation
    return {
      direction: 'improving',
      change: -5.2,
      timeframe: '24h'
    };
  }

  private calculateOverallScore(
    metrics: PerformanceMetrics,
    benchmarks: PerformanceBenchmark[]
  ): number {
    let totalScore = 0;
    let weightSum = 0;

    // User Experience (40%)
    totalScore += (metrics.userExperience.pageLoadTime <= 2 ? 100 : 50) * 0.15;
    totalScore += (metrics.userExperience.coreWebVitals.lcp <= 2.5 ? 100 : 60) * 0.15;
    totalScore += (metrics.userExperience.userSatisfaction >= 4.5 ? 100 : 70) * 0.1;

    // Application Performance (30%)
    totalScore += (metrics.application.responseTime <= 300 ? 100 : 70) * 0.15;
    totalScore += (metrics.application.availability >= 99.9 ? 100 : 80) * 0.15;

    // Business Metrics (20%)
    totalScore += (metrics.business.clientSatisfaction >= 4.5 ? 100 : 75) * 0.1;
    totalScore += (metrics.business.supportEfficiency >= 85 ? 100 : 70) * 0.1;

    // Luxury Standards (10%)
    totalScore += (metrics.luxury.luxuryExperienceScore >= 90 ? 100 : 80) * 0.1;

    return Math.round(totalScore);
  }

  private async generateRecommendations(
    metrics: PerformanceMetrics,
    benchmarks: PerformanceBenchmark[],
    alerts: PerformanceAlert[]
  ): Promise<any[]> {
    const recommendations: any[] = [];

    // Generate recommendations based on metrics
    if (metrics.userExperience.pageLoadTime > 2.0) {
      recommendations.push({
        category: 'User Experience',
        recommendation: 'Optimize page load time through image compression and code minification',
        impact: 'Improve user satisfaction by 15%',
        effort: 'medium',
        priority: 85
      });
    }

    if (metrics.luxury.vipResponseTime > 30) {
      recommendations.push({
        category: 'Luxury Experience',
        recommendation: 'Implement VIP priority routing to reduce response time',
        impact: 'Enhance VIP client satisfaction',
        effort: 'high',
        priority: 95
      });
    }

    return recommendations.sort((a, b) => b.priority - a.priority);
  }

  private async analyzeTrends(metrics: PerformanceMetrics): Promise<any[]> {
    return [
      {
        metric: 'Page Load Time',
        direction: 'improving',
        change: -12.5,
        significance: 'high'
      },
      {
        metric: 'VIP Response Time',
        direction: 'stable',
        change: -2.1,
        significance: 'low'
      }
    ];
  }

  private async triggerAlertNotifications(alert: PerformanceAlert): Promise<void> {
    // Implementation for alert notifications
    console.log(`Performance alert triggered: ${alert.title}`);
  }

  private async checkMetricThresholds(metric: string): Promise<void> {
    // Implementation for checking metric thresholds
    const currentValue = await this.getCurrentMetricValue(metric);
    const benchmark = Array.from(this.benchmarks.values()).find(b => b.metric === metric);

    if (benchmark && currentValue > benchmark.target * 1.5) {
      await this.createPerformanceAlert({
        type: 'threshold',
        severity: 'warning',
        title: `${metric} exceeds threshold`,
        description: `Current value ${currentValue} exceeds target ${benchmark.target}`,
        metric,
        currentValue,
        threshold: benchmark.target,
        trend: 'stable',
        impact: {
          affectedSystems: ['Application'],
          userImpact: 'moderate',
          businessImpact: 'medium'
        },
        resolution: {
          steps: ['Investigate root cause', 'Implement optimization'],
          dependencies: []
        }
      });
    }
  }

  private async performHealthCheck(): Promise<void> {
    // Comprehensive health check implementation
    try {
      const health = await this.getSystemHealth();

      if (health.overall === 'critical') {
        await this.createPerformanceAlert({
          type: 'availability',
          severity: 'critical',
          title: 'Critical System Health Issue',
          description: 'System health is critical - immediate attention required',
          metric: 'system_health',
          currentValue: 0,
          threshold: 80,
          trend: 'degrading',
          impact: {
            affectedSystems: health.components.filter(c => c.status === 'critical').map(c => c.name),
            userImpact: 'critical',
            businessImpact: 'critical'
          },
          resolution: {
            steps: ['Investigate critical components', 'Implement emergency fixes'],
            dependencies: []
          }
        });
      }
    } catch (error) {
      console.error('Health check failed:', error);
    }
  }

  private calculateActualImprovement(
    before: Record<string, number>,
    after: Record<string, number>
  ): number {
    // Calculate overall improvement percentage
    const metrics = Object.keys(before);
    if (metrics.length === 0) return 0;

    const improvements = metrics.map(metric => {
      const beforeValue = before[metric];
      const afterValue = after[metric];

      // For metrics where lower is better (response time, error rate)
      if (metric.includes('time') || metric.includes('error')) {
        return ((beforeValue - afterValue) / beforeValue) * 100;
      }

      // For metrics where higher is better (satisfaction, conversion)
      return ((afterValue - beforeValue) / beforeValue) * 100;
    });

    return improvements.reduce((sum, improvement) => sum + improvement, 0) / improvements.length;
  }

  /**
   * Cleanup method for stopping monitoring intervals
   */
  cleanup(): void {
    this.monitoringIntervals.forEach((interval, metric) => {
      clearInterval(interval);
      this.monitoringIntervals.delete(metric);
    });
  }
}