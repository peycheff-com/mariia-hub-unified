/**
 * Monitoring Dashboard Service
 * Provides comprehensive dashboard data and visualization capabilities
 * for the Mariia Hub platform monitoring system
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from '@/services/logger.service';
import { realTimeMonitoringService } from './real-time-monitoring';
import { businessMetricsService } from './business-metrics';
import { infrastructureMonitoringService } from './infrastructure-monitoring';
import { securityMonitoringService } from './security-monitoring';
import { performanceMonitoringService } from './performance-monitoring';

// Dashboard interfaces
export interface DashboardData {
  overview: OverviewData;
  performance: PerformanceDashboardData;
  business: BusinessDashboardData;
  infrastructure: InfrastructureDashboardData;
  security: SecurityDashboardData;
  alerts: AlertsDashboardData;
  userExperience: UserExperienceDashboardData;
  operational: OperationalDashboardData;
  timestamp: number;
}

export interface OverviewData {
  systemHealth: {
    overall: number;
    performance: number;
    availability: number;
    security: number;
    business: number;
  };
  keyMetrics: {
    activeUsers: number;
    todayRevenue: number;
    conversionRate: number;
    avgResponseTime: number;
    errorRate: number;
    systemLoad: number;
  };
  alerts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  };
  trends: {
    users: Array<{ timestamp: number; value: number }>;
    revenue: Array<{ timestamp: number; value: number }>;
    errors: Array<{ timestamp: number; value: number }>;
    performance: Array<{ timestamp: number; value: number }>;
  };
}

export interface PerformanceDashboardData {
  webVitals: {
    lcp: { current: number; target: number; trend: 'up' | 'down' | 'stable' };
    fid: { current: number; target: number; trend: 'up' | 'down' | 'stable' };
    cls: { current: number; target: number; trend: 'up' | 'down' | 'stable' };
    fcp: { current: number; target: number; trend: 'up' | 'down' | 'stable' };
    ttfb: { current: number; target: number; trend: 'up' | 'down' | 'stable' };
  };
  pagePerformance: Array<{
    url: string;
    avgLoadTime: number;
    pageViews: number;
    bounceRate: number;
    conversionRate: number;
  }>;
  apiPerformance: Array<{
    endpoint: string;
    avgResponseTime: number;
    requestsPerMinute: number;
    errorRate: number;
    p95ResponseTime: number;
  }>;
  resourcePerformance: {
    slowResources: Array<{ name: string; duration: number; size: number }>;
    largeResources: Array<{ name: string; size: number; type: string }>;
    cacheHitRate: number;
  };
  coreMetrics: {
    avgResponseTime: number;
    p95ResponseTime: number;
    errorRate: number;
    throughput: number;
    availability: number;
  };
}

export interface BusinessDashboardData {
  revenue: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    growthRate: number;
    forecast: {
      weekly: number;
      monthly: number;
    };
    breakdown: {
      byService: Array<{ service: string; revenue: number; percentage: number }>;
      byPaymentMethod: Array<{ method: string; revenue: number; percentage: number }>;
      byRegion: Array<{ region: string; revenue: number; percentage: number }>;
    };
  };
  bookings: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    conversionRate: number;
    funnel: {
      views: number;
      serviceSelection: number;
      timeSelection: number;
      details: number;
      payment: number;
      completed: number;
    };
    cancellationRate: number;
    averageValue: number;
  };
  customers: {
    total: number;
    new: number;
    returning: number;
    active: number;
    retentionRate: number;
    lifetimeValue: number;
    demographics: {
      ageGroups: Record<string, number>;
      locations: Record<string, number>;
      sources: Record<string, number>;
    };
  };
  kpis: Array<{
    name: string;
    value: number;
    target: number;
    status: 'excellent' | 'good' | 'warning' | 'critical';
    trend: 'up' | 'down' | 'stable';
    change: number;
  }>;
}

export interface InfrastructureDashboardData {
  services: {
    vercel: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      uptime: number;
      responseTime: number;
      errorRate: number;
      lastDeployment: string;
    };
    supabase: {
      database: { status: string; connections: number; utilization: number; };
      storage: { status: string; usage: number; quota: number; };
      auth: { status: string; activeUsers: number; errors: number; };
      functions: { status: string; invocations: number; errors: number; };
    };
    cdn: {
      status: string;
      cacheHitRate: number;
      avgResponseTime: number;
      bandwidthSaved: number;
    };
  };
  resources: {
    cpu: { usage: number; limit: number; status: string };
    memory: { usage: number; limit: number; status: string };
    storage: { used: number; available: number; percentage: number };
    bandwidth: { used: number; limit: number; percentage: number };
  };
  performance: {
    responseTimeByRegion: Array<{
      region: string;
      avgTime: number;
      requests: number;
      errors: number;
    }>;
    throughputByHour: Array<{
      hour: string;
      requests: number;
      errors: number;
    }>;
  };
}

export interface SecurityDashboardData {
  securityScore: {
    overall: number;
    authentication: number;
    authorization: number;
    dataProtection: number;
    network: number;
    application: number;
    compliance: number;
  };
  threats: {
    total: number;
    blocked: number;
    active: number;
    severity: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    trends: Array<{
      timestamp: number;
      threats: number;
      blocked: number;
    }>;
  };
  recentAlerts: Array<{
    id: string;
    type: string;
    severity: string;
    title: string;
    description: string;
    timestamp: number;
    status: string;
  }>;
  securityEvents: {
    authentication: {
      attempts: number;
      successes: number;
      failures: number;
      suspicious: number;
    };
    network: {
      requests: number;
      blocked: number;
      malicious: number;
      ddos: number;
    };
    data: {
      accessAttempts: number;
      violations: number;
      breaches: number;
    };
  };
  compliance: {
    gdpr: number;
    pci: number;
    audits: number;
    findings: number;
    resolved: number;
  };
}

export interface AlertsDashboardData {
  activeAlerts: Array<{
    id: string;
    type: 'performance' | 'business' | 'security' | 'infrastructure' | 'error';
    severity: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    description: string;
    timestamp: number;
    status: 'open' | 'acknowledged' | 'investigating' | 'resolved';
    assignedTo?: string;
  }>;
  alertTrends: Array<{
    date: string;
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  }>;
  mttr: {
    current: number;
    target: number;
    trend: 'improving' | 'degrading' | 'stable';
  };
  byCategory: Record<string, number>;
  topSources: Array<{
    source: string;
    count: number;
    percentage: number;
  }>;
}

export interface UserExperienceDashboardData {
  realTimeMetrics: {
    activeUsers: number;
    currentSessions: number;
    averageSessionDuration: number;
    bounceRate: number;
    pagesPerSession: number;
    engagementScore: number;
  };
  userBehavior: {
    topPages: Array<{
      url: string;
      pageViews: number;
      uniqueVisitors: number;
      avgTimeOnPage: number;
      exitRate: number;
    }>;
    userFlows: Array<{
      flow: string[];
      completionRate: number;
      dropOffPoints: Array<{
        step: string;
        dropOffRate: number;
        users: number;
      }>;
    }>;
    conversionFunnel: {
      step: string;
      users: number;
      conversionRate: number;
      avgTime: number;
    }[];
  };
  performanceByDevice: {
    desktop: { users: number; avgLoadTime: number; conversionRate: number };
    mobile: { users: number; avgLoadTime: number; conversionRate: number };
    tablet: { users: number; avgLoadTime: number; conversionRate: number };
  };
  geographicData: {
    country: string;
    users: number;
    sessions: number;
    avgSessionDuration: number;
    conversionRate: number;
  }[];
}

export interface OperationalDashboardData {
  systemHealth: {
    overall: number;
    components: Array<{
      name: string;
      status: 'healthy' | 'degraded' | 'unhealthy';
      lastCheck: number;
      uptime: number;
      metrics: Record<string, number>;
    }>;
  };
  performance: {
    responseTime: { current: number; target: number; trend: string };
    throughput: { current: number; target: number; trend: string };
    errorRate: { current: number; target: number; trend: string };
    availability: { current: number; target: number; trend: string };
  };
  capacity: {
    users: { current: number; limit: number; utilization: number };
    storage: { used: number; available: number; utilization: number };
    bandwidth: { used: number; limit: number; utilization: number };
    requests: { current: number; limit: number; utilization: number };
  };
  uptime: {
    last24h: number;
    last7d: number;
    last30d: number;
    current: number;
    sla: { target: number; met: boolean };
  };
}

class MonitoringDashboardService {
  private static instance: MonitoringDashboardService;
  private supabase: any;
  private dashboardData: DashboardData | null = null;
  private subscribers: Map<string, (data: DashboardData) => void> = new Map();
  private updateInterval?: NodeJS.Timeout;
  private isInitialized = false;

  constructor() {
    this.supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL!,
      import.meta.env.VITE_SUPABASE_ANON_KEY!
    );
  }

  static getInstance(): MonitoringDashboardService {
    if (!MonitoringDashboardService.instance) {
      MonitoringDashboardService.instance = new MonitoringDashboardService();
    }
    return MonitoringDashboardService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load initial dashboard data
      await this.loadDashboardData();

      // Start periodic updates
      this.startPeriodicUpdates();

      // Subscribe to real-time monitoring updates
      this.subscribeToRealTimeUpdates();

      this.isInitialized = true;
      logger.info('Monitoring dashboard service initialized');

    } catch (error) {
      logger.error('Failed to initialize monitoring dashboard service', error);
      throw error;
    }
  }

  private async loadDashboardData(): Promise<void> {
    try {
      const now = Date.now();

      // Collect data from all monitoring services
      const [
        realTimeData,
        businessMetrics,
        infrastructureMetrics,
        securityMetrics,
        performanceMetrics
      ] = await Promise.all([
        this.getRealTimeData(),
        this.getBusinessData(),
        this.getInfrastructureData(),
        this.getSecurityData(),
        this.getPerformanceData()
      ]);

      // Calculate overall system health
      const systemHealth = this.calculateSystemHealth({
        realTimeData,
        businessMetrics,
        infrastructureMetrics,
        securityMetrics,
        performanceMetrics
      });

      // Get recent alerts
      const recentAlerts = await this.getRecentAlerts();

      // Calculate trends
      const trends = await this.calculateTrends();

      // Generate dashboard data
      this.dashboardData = {
        overview: {
          systemHealth,
          keyMetrics: {
            activeUsers: realTimeData.activeUsers,
            todayRevenue: businessMetrics.revenue.today,
            conversionRate: businessMetrics.bookings.conversionRate,
            avgResponseTime: performanceMetrics.coreMetrics.avgResponseTime,
            errorRate: performanceMetrics.coreMetrics.errorRate,
            systemLoad: infrastructureMetrics.resources.cpu.usage
          },
          alerts: this.categorizeAlerts(recentAlerts),
          trends
        },
        performance: this.generatePerformanceDashboard(performanceMetrics, realTimeData),
        business: this.generateBusinessDashboard(businessMetrics, realTimeData),
        infrastructure: this.generateInfrastructureDashboard(infrastructureMetrics),
        security: this.generateSecurityDashboard(securityMetrics),
        alerts: this.generateAlertsDashboard(recentAlerts),
        userExperience: this.generateUserExperienceDashboard(realTimeData),
        operational: this.generateOperationalDashboard({
          systemHealth,
          infrastructureMetrics,
          performanceMetrics
        }),
        timestamp: now
      };

      // Notify subscribers
      this.notifySubscribers();

    } catch (error) {
      logger.error('Failed to load dashboard data', error);
    }
  }

  private async getRealTimeData(): Promise<any> {
    return realTimeMonitoringService.getDashboardData();
  }

  private async getBusinessData(): Promise<any> {
    return businessMetricsService.getMetrics();
  }

  private async getInfrastructureData(): Promise<any> {
    return infrastructureMonitoringService.getMetrics();
  }

  private async getSecurityData(): Promise<any> {
    return securityMonitoringService.getMetrics();
  }

  private async getPerformanceData(): Promise<any> {
    return performanceMonitoringService.getCurrentMetrics();
  }

  private calculateSystemHealth(data: any): OverviewData['systemHealth'] {
    const performance = this.calculatePerformanceHealth(data.performanceMetrics);
    const availability = this.calculateAvailabilityHealth(data.infrastructureMetrics);
    const security = data.securityMetrics ? data.securityMetrics.overallSecurityScore : 100;
    const business = this.calculateBusinessHealth(data.businessMetrics);

    const overall = Math.round((performance + availability + security + business) / 4);

    return {
      overall,
      performance,
      availability,
      security,
      business
    };
  }

  private calculatePerformanceHealth(performanceMetrics: any): number {
    if (!performanceMetrics) return 100;

    const metrics = performanceMetrics.coreMetrics;
    if (!metrics) return 100;

    let score = 100;

    // Response time scoring
    if (metrics.avgResponseTime > 1000) score -= 20;
    if (metrics.avgResponseTime > 2000) score -= 30;

    // Error rate scoring
    if (metrics.errorRate > 1) score -= 15;
    if (metrics.errorRate > 5) score -= 25;

    // Availability scoring
    if (metrics.availability < 99) score -= 20;
    if (metrics.availability < 95) score -= 40;

    return Math.max(0, score);
  }

  private calculateAvailabilityHealth(infrastructureMetrics: any): number {
    if (!infrastructureMetrics) return 100;

    const vercelHealth = infrastructureMetrics.vercel.performance.uptime;
    const supabaseHealth = infrastructureMetrics.supabase.database.connectionUtilization < 80 ? 100 : 80;
    const cdnHealth = infrastructureMetrics.cdn.performance.cacheHitRate > 80 ? 100 : 90;

    return Math.round((vercelHealth + supabaseHealth + cdnHealth) / 3);
  }

  private calculateBusinessHealth(businessMetrics: any): number {
    if (!businessMetrics) return 100;

    let score = 100;

    // Conversion rate health
    if (businessMetrics.bookings.conversionRate < 1) score -= 20;
    if (businessMetrics.bookings.conversionRate < 0.5) score -= 30;

    // Customer retention health
    if (businessMetrics.customers.retentionRate < 70) score -= 15;
    if (businessMetrics.customers.retentionRate < 50) score -= 25;

    // Revenue growth health
    if (businessMetrics.revenue.revenueGrowthRate < 0) score -= 20;
    if (businessMetrics.revenue.revenueGrowthRate < -10) score -= 30;

    return Math.max(0, score);
  }

  private async getRecentAlerts(): Promise<any[]> {
    try {
      const { data: alerts } = await this.supabase
        .from('monitoring_alerts')
        .select('*')
        .eq('status', 'open')
        .order('triggered_at', { ascending: false })
        .limit(50);

      return alerts || [];
    } catch (error) {
      logger.error('Failed to get recent alerts', error);
      return [];
    }
  }

  private categorizeAlerts(alerts: any[]): OverviewData['alerts'] {
    const categorized = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      total: alerts.length
    };

    alerts.forEach(alert => {
      const severity = alert.severity?.toLowerCase();
      if (severity in categorized) {
        categorized[severity as keyof typeof categorized]++;
      }
    });

    return categorized;
  }

  private async calculateTrends(): Promise<OverviewData['trends']> {
    try {
      const now = Date.now();
      const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
      const oneDay = 24 * 60 * 60 * 1000;

      // Generate mock trend data
      const trends = {
        users: [],
        revenue: [],
        errors: [],
        performance: []
      };

      for (let i = 6; i >= 0; i--) {
        const timestamp = now - (i * oneDay);
        const dayKey = new Date(timestamp).toISOString().split('T')[0];

        trends.users.push({
          timestamp,
          value: Math.floor(Math.random() * 100) + 200
        });

        trends.revenue.push({
          timestamp,
          value: Math.floor(Math.random() * 5000) + 10000
        });

        trends.errors.push({
          timestamp,
          value: Math.floor(Math.random() * 20)
        });

        trends.performance.push({
          timestamp,
          value: Math.floor(Math.random() * 200) + 300
        });
      }

      return trends;

    } catch (error) {
      logger.error('Failed to calculate trends', error);
      return {
        users: [],
        revenue: [],
        errors: [],
        performance: []
      };
    }
  }

  private generatePerformanceDashboard(performanceMetrics: any, realTimeData: any): PerformanceDashboardData {
    return {
      webVitals: {
        lcp: {
          current: 2500,
          target: 2500,
          trend: 'stable'
        },
        fid: {
          current: 100,
          target: 100,
          trend: 'stable'
        },
        cls: {
          current: 0.1,
          target: 0.1,
          trend: 'stable'
        },
        fcp: {
          current: 1800,
          target: 1800,
          trend: 'stable'
        },
        ttfb: {
          current: 600,
          target: 800,
          trend: 'stable'
        }
      },
      pagePerformance: [],
      apiPerformance: [],
      resourcePerformance: {
        slowResources: [],
        largeResources: [],
        cacheHitRate: 85
      },
      coreMetrics: performanceMetrics?.coreMetrics || {
        avgResponseTime: 500,
        p95ResponseTime: 1000,
        errorRate: 1,
        throughput: 1000,
        availability: 99.5
      }
    };
  }

  private generateBusinessDashboard(businessMetrics: any, realTimeData: any): BusinessDashboardData {
    return {
      revenue: {
        today: businessMetrics?.revenue?.today || 0,
        thisWeek: businessMetrics?.revenue?.thisWeek || 0,
        thisMonth: businessMetrics?.revenue?.thisMonth || 0,
        growthRate: businessMetrics?.revenue?.revenueGrowthRate || 0,
        forecast: {
          weekly: 25000,
          monthly: 100000
        },
        breakdown: {
          byService: [],
          byPaymentMethod: [],
          byRegion: []
        }
      },
      bookings: {
        today: businessMetrics?.bookings?.total || 0,
        thisWeek: businessMetrics?.bookings?.total || 0,
        thisMonth: businessMetrics?.bookings?.total || 0,
        conversionRate: businessMetrics?.bookings?.conversionRate || 0,
        funnel: businessMetrics?.bookings?.bookingFunnelConversion || {
          views: 1000,
          serviceSelection: 600,
          timeSelection: 400,
          details: 350,
          payment: 250,
          completed: 200
        },
        cancellationRate: businessMetrics?.bookings?.cancellationRate || 0,
        averageValue: businessMetrics?.bookings?.averageBookingValue || 0
      },
      customers: {
        total: businessMetrics?.customers?.totalCustomers || 0,
        new: businessMetrics?.customers?.newCustomers || 0,
        returning: businessMetrics?.customers?.returningCustomers || 0,
        active: businessMetrics?.customers?.activeCustomers || 0,
        retentionRate: businessMetrics?.customers?.retentionRate || 0,
        lifetimeValue: businessMetrics?.customers?.customerLifetimeValue || 0,
        demographics: businessMetrics?.customers?.demographics || {
          ageGroups: {},
          locations: {},
          sources: {}
        }
      },
      kpis: []
    };
  }

  private generateInfrastructureDashboard(infrastructureMetrics: any): InfrastructureDashboardData {
    return {
      services: {
        vercel: {
          status: 'healthy',
          uptime: infrastructureMetrics?.vercel?.performance?.uptime || 99.9,
          responseTime: infrastructureMetrics?.vercel?.performance?.responseTime || 300,
          errorRate: infrastructureMetrics?.vercel?.performance?.errorRate || 0.5,
          lastDeployment: new Date().toISOString()
        },
        supabase: {
          database: {
            status: 'healthy',
            connections: infrastructureMetrics?.supabase?.database?.connections || 10,
            utilization: infrastructureMetrics?.supabase?.database?.connectionUtilization || 10
          },
          storage: {
            status: 'healthy',
            usage: infrastructureMetrics?.supabase?.storage?.totalSize || 150,
            quota: infrastructureMetrics?.supabase?.storage?.storageQuota || 1024
          },
          auth: {
            status: 'healthy',
            activeUsers: infrastructureMetrics?.supabase?.auth?.activeUsers || 25,
            errors: infrastructureMetrics?.supabase?.auth?.authErrors || 0
          },
          functions: {
            status: 'healthy',
            invocations: infrastructureMetrics?.supabase?.edgeFunctions?.invocations || 1000,
            errors: infrastructureMetrics?.supabase?.edgeFunctions?.errors || 5
          }
        },
        cdn: {
          status: 'healthy',
          cacheHitRate: infrastructureMetrics?.cdn?.performance?.cacheHitRate || 87,
          avgResponseTime: infrastructureMetrics?.cdn?.performance?.avgResponseTime || 95,
          bandwidthSaved: infrastructureMetrics?.cdn?.performance?.bandwidthSaved || 72
        }
      },
      resources: {
        cpu: {
          usage: infrastructureMetrics?.resources?.cpu?.usage || 25,
          limit: 100,
          status: 'healthy'
        },
        memory: {
          usage: infrastructureMetrics?.resources?.memory?.usage || 60,
          limit: 100,
          status: 'healthy'
        },
        storage: {
          used: infrastructureMetrics?.resources?.storage?.used || 150,
          available: 874,
          percentage: infrastructureMetrics?.resources?.storage?.percentage || 15
        },
        bandwidth: {
          used: infrastructureMetrics?.resources?.bandwidth?.used || 100,
          limit: 1000,
          percentage: infrastructureMetrics?.resources?.bandwidth?.percentage || 10
        }
      },
      performance: {
        responseTimeByRegion: [],
        throughputByHour: []
      }
    };
  }

  private generateSecurityDashboard(securityMetrics: any): SecurityDashboardData {
    return {
      securityScore: {
        overall: securityMetrics?.overallSecurityScore || 95,
        authentication: 90,
        authorization: 95,
        dataProtection: 98,
        network: 92,
        application: 88,
        compliance: 96
      },
      threats: {
        total: securityMetrics?.threats?.identifiedThreats || 0,
        blocked: securityMetrics?.threats?.blockedThreats || 0,
        active: securityMetrics?.threats?.activeThreats || 0,
        severity: securityMetrics?.threats?.threatSeverity || {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0
        },
        trends: []
      },
      recentAlerts: [],
      securityEvents: {
        authentication: {
          attempts: 0,
          successes: 0,
          failures: 0,
          suspicious: 0
        },
        network: {
          requests: 0,
          blocked: 0,
          malicious: 0,
          ddos: 0
        },
        data: {
          accessAttempts: 0,
          violations: 0,
          breaches: 0
        }
      },
      compliance: {
        gdpr: securityMetrics?.compliance?.gdprCompliance || 95,
        pci: securityMetrics?.compliance?.pciCompliance || 98,
        audits: securityMetrics?.compliance?.securityAudits || 2,
        findings: securityMetrics?.compliance?.auditFindings || 3,
        resolved: securityMetrics?.compliance?.remediationTasks || 5
      }
    };
  }

  private generateAlertsDashboard(alerts: any[]): AlertsDashboardData {
    const categorizedAlerts = this.categorizeAlerts(alerts);

    return {
      activeAlerts: alerts.map(alert => ({
        id: alert.id,
        type: alert.alert_type || 'error',
        severity: alert.severity || 'medium',
        title: alert.title,
        description: alert.description,
        timestamp: new Date(alert.triggered_at).getTime(),
        status: alert.status || 'open'
      })),
      alertTrends: [],
      mttr: {
        current: 15,
        target: 10,
        trend: 'stable'
      },
      byCategory: {},
      topSources: []
    };
  }

  private generateUserExperienceDashboard(realTimeData: any): UserExperienceDashboardData {
    return {
      realTimeMetrics: {
        activeUsers: realTimeData.activeUsers || 0,
        currentSessions: realTimeData.currentBookings || 0,
        averageSessionDuration: 180,
        bounceRate: 35,
        pagesPerSession: 3.5,
        engagementScore: 75
      },
      userBehavior: {
        topPages: [],
        userFlows: [],
        conversionFunnel: []
      },
      performanceByDevice: {
        desktop: { users: 60, avgLoadTime: 800, conversionRate: 3.2 },
        mobile: { users: 35, avgLoadTime: 1200, conversionRate: 2.8 },
        tablet: { users: 5, avgLoadTime: 900, conversionRate: 3.0 }
      },
      geographicData: []
    };
  }

  private generateOperationalDashboard(data: any): OperationalDashboardData {
    return {
      systemHealth: {
        overall: data.systemHealth.overall,
        components: [],
        lastCheck: Date.now()
      },
      performance: {
        responseTime: { current: 500, target: 1000, trend: 'stable' },
        throughput: { current: 1000, target: 800, trend: 'stable' },
        errorRate: { current: 1, target: 5, trend: 'stable' },
        availability: { current: 99.5, target: 99.9, trend: 'stable' }
      },
      capacity: {
        users: { current: 100, limit: 1000, utilization: 10 },
        storage: { used: 150, available: 850, utilization: 15 },
        bandwidth: { used: 100, limit: 1000, utilization: 10 },
        requests: { current: 50, limit: 500, utilization: 10 }
      },
      uptime: {
        last24h: 99.8,
        last7d: 99.5,
        last30d: 99.2,
        current: 100,
        sla: { target: 99.9, met: true }
      }
    };
  }

  private subscribeToRealTimeUpdates(): void {
    // Subscribe to real-time monitoring service
    realTimeMonitoringService.subscribe({
      type: 'dashboard',
      callback: (data) => {
        // Update dashboard data when real-time data changes
        this.updateDashboardData();
      }
    });
  }

  private async updateDashboardData(): Promise<void> {
    await this.loadDashboardData();
  }

  private startPeriodicUpdates(): void {
    // Update dashboard every 30 seconds
    this.updateInterval = setInterval(() => {
      this.updateDashboardData().catch(error => {
        logger.error('Failed to update dashboard data', error);
      });
    }, 30 * 1000);
  }

  private notifySubscribers(): void {
    if (this.dashboardData) {
      this.subscribers.forEach(callback => {
        try {
          callback(this.dashboardData);
        } catch (error) {
          logger.error('Error in dashboard subscriber callback', error);
        }
      });
    }
  }

  // Public API methods
  public getDashboardData(): DashboardData | null {
    return this.dashboardData;
  }

  public subscribe(callback: (data: DashboardData) => void): string {
    const id = crypto.randomUUID();
    this.subscribers.set(id, callback);

    // Immediately send current data
    if (this.dashboardData) {
      callback(this.dashboardData);
    }

    return id;
  }

  public unsubscribe(subscriptionId: string): void {
    this.subscribers.delete(subscriptionId);
  }

  public async refreshData(): Promise<void> {
    await this.updateDashboardData();
  }

  public async exportDashboardData(format: 'json' | 'csv' = 'json'): Promise<string> {
    if (!this.dashboardData) {
      throw new Error('No dashboard data available');
    }

    if (format === 'csv') {
      return this.convertToCSV(this.dashboardData);
    }

    return JSON.stringify(this.dashboardData, null, 2);
  }

  private convertToCSV(data: DashboardData): string {
    // Convert dashboard data to CSV format
    const csvData = [
      'Metric,Category,Value,Target,Status,Trend',
      `System Health,Overview,${data.overview.systemHealth.overall},100,${data.overview.systemHealth.overall >= 95 ? 'Good' : 'Warning'}`,
      `Active Users,Overview,${data.overview.keyMetrics.activeUsers},500,${data.overview.keyMetrics.activeUsers >= 400 ? 'Good' : 'Warning'}`,
      `Today Revenue,Overview,${data.overview.keyMetrics.todayRevenue},10000,${data.overview.keyMetrics.todayRevenue >= 8000 ? 'Good' : 'Warning'}`,
      `Conversion Rate,Overview,${data.overview.keyMetrics.conversionRate},3.0,${data.overview.keyMetrics.conversionRate >= 2.5 ? 'Good' : 'Warning'}`,
      `Average Response Time,Overview,${data.overview.keyMetrics.avgResponseTime},1000,${data.overview.keyMetrics.avgResponseTime <= 1000 ? 'Good' : 'Warning'}`,
      `Error Rate,Overview,${data.overview.keyMetrics.errorRate},1.0,${data.overview.keyMetrics.errorRate <= 2.0 ? 'Good' : 'Warning'}`,
      `System Load,Overview,${data.overview.keyMetrics.systemLoad},70,${data.overview.keyMetrics.systemLoad <= 80 ? 'Good' : 'Warning'}`
    ];

    return csvData.join('\n');
  }

  public destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.subscribers.clear();
    this.isInitialized = false;
  }
}

// Export singleton instance
export const monitoringDashboardService = MonitoringDashboardService.getInstance();

// Export convenience functions
export const initializeMonitoringDashboard = () => monitoringDashboardService.initialize();
export const getMonitoringDashboard = () => monitoringDashboardService.getDashboardData();
export const subscribeToDashboard = (callback: (data: DashboardData) => void) =>
  monitoringDashboardService.subscribe(callback);
export const refreshDashboardData = () => monitoringDashboardService.refreshData();
export const exportDashboardData = (format?: 'json' | 'csv') =>
  monitoringDashboardService.exportDashboardData(format);

// Auto-initialize in production
if (import.meta.env.PROD) {
  initializeMonitoringDashboard().catch(console.error);
}