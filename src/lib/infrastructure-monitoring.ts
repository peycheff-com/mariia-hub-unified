/**
 * Infrastructure Monitoring Service
 * Monitors Vercel, Supabase, and other infrastructure components
 * for performance, availability, and resource utilization
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from '@/services/logger.service';
import { realTimeMonitoringService } from './real-time-monitoring';

// Infrastructure monitoring interfaces
export interface InfrastructureMetrics {
  vercel: VercelMetrics;
  supabase: SupabaseMetrics;
  cdn: CDNMetrics;
  externalServices: ExternalServicesMetrics;
  timestamp: number;
  overallHealth: number; // 0-100
}

export interface VercelMetrics {
  deployment: {
    status: 'ready' | 'building' | 'error' | 'canceled';
    url: string;
    createdAt: string;
    readyAt?: string;
    buildTime: number; // seconds
    errorMessage?: string;
  };
  performance: {
    responseTime: number; // ms
    throughput: number; // requests per minute
    errorRate: number; // percentage
    uptime: number; // percentage
  };
  resources: {
    bandwidth: number; // MB per hour
    builds: number; // per month
    invocations: number; // per month
    duration: number; // ms per invocation
  };
  edge: {
    regions: Array<{
      region: string;
      latency: number; // ms
      requests: number;
      errors: number;
    }>;
    cacheHitRate: number; // percentage
    edgeFunctions: {
      invocations: number;
      errors: number;
      avgDuration: number; // ms
    };
  };
  security: {
    ddosAttacks: number;
    blockedRequests: number;
    securityScore: number; // 0-100
  };
}

export interface SupabaseMetrics {
  database: {
    connections: number;
    maxConnections: number;
    connectionUtilization: number; // percentage
    storageSize: number; // MB
    storageQuota: number; // MB
    storageUtilization: number; // percentage
    backupStatus: 'success' | 'failed' | 'running';
    lastBackup: string;
    queryPerformance: {
      avgExecutionTime: number; // ms
      slowQueries: number;
      totalQueries: number;
      errorQueries: number;
    };
  };
  auth: {
    activeUsers: number;
    newUsers: number;
    loginAttempts: number;
    successfulLogins: number;
    failedLogins: number;
    authErrors: number;
  };
  storage: {
    totalFiles: number;
    totalSize: number; // MB
    bandwidthUsage: number; // MB per day
    cacheHitRate: number; // percentage
    uploadErrors: number;
    downloadErrors: number;
  };
  realtime: {
    activeConnections: number;
    messagesPerSecond: number;
    disconnections: number;
    errors: number;
  };
  edgeFunctions: {
    invocations: number;
    errors: number;
    avgDuration: number; // ms
    maxDuration: number; // ms
    memoryUsage: number; // MB
  };
}

export interface CDNMetrics {
  provider: 'vercel' | 'cloudflare' | 'custom';
  performance: {
    cacheHitRate: number; // percentage
    avgResponseTime: number; // ms
    bandwidthSaved: number; // percentage
    compressionRatio: number; // percentage
  };
  traffic: {
    totalRequests: number;
    cachedRequests: number;
    uncachedRequests: number;
    bandwidthUsage: number; // GB
    bandwidthSaved: number; // GB
  };
  regions: Array<{
    region: string;
    requests: number;
    cacheHitRate: number;
    avgResponseTime: number;
  }>;
  security: {
    ddosAttacksBlocked: number;
    maliciousRequestsBlocked: number;
    threatsDetected: number;
  };
}

export interface ExternalServicesMetrics {
  stripe: {
    apiStatus: 'operational' | 'degraded' | 'down';
    responseTime: number; // ms
    errorRate: number; // percentage
    webhookStatus: 'operational' | 'failing';
    webhookLatency: number; // ms
  };
  email: {
    provider: string; // resend, sendgrid, etc.
    deliveryRate: number; // percentage
    bounceRate: number; // percentage
    spamComplaints: number;
    avgDeliveryTime: number; // ms
  };
  analytics: {
    provider: string; // google analytics, etc.
    dataCollection: boolean;
    eventsPerMinute: number;
    processingDelay: number; // ms
  };
  social: {
    instagram: {
      apiStatus: 'operational' | 'degraded' | 'down';
      rateLimitRemaining: number;
      lastSync: string;
      errors: number;
    };
    facebook: {
      apiStatus: 'operational' | 'degraded' | 'down';
      rateLimitRemaining: number;
      lastSync: string;
      errors: number;
    };
  };
}

export interface InfrastructureAlert {
  id: string;
  service: 'vercel' | 'supabase' | 'cdn' | 'stripe' | 'email' | 'analytics' | 'social';
  severity: 'info' | 'warning' | 'critical';
  type: 'performance' | 'availability' | 'security' | 'quota' | 'error';
  title: string;
  message: string;
  metric: string;
  value: number;
  threshold: number;
  timestamp: number;
  acknowledged: boolean;
  resolved: boolean;
}

export interface ServiceHealth {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  lastCheck: number;
  uptime: number; // percentage
  issues: string[];
}

class InfrastructureMonitoringService {
  private static instance: InfrastructureMonitoringService;
  private supabase: any;
  private metrics: InfrastructureMetrics | null = null;
  private alerts: InfrastructureAlert[] = [];
  private healthChecks: Map<string, ServiceHealth> = new Map();
  private monitoringInterval?: NodeJS.Timeout;
  private isInitialized = false;
  private endpoints: Map<string, string> = new Map();

  constructor() {
    this.supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL!,
      import.meta.env.VITE_SUPABASE_ANON_KEY!
    );

    // Initialize monitoring endpoints
    this.endpoints.set('vercel', 'https://api.vercel.com/v1');
    this.endpoints.set('supabase', import.meta.env.VITE_SUPABASE_URL!);
    this.endpoints.set('stripe', 'https://api.stripe.com/v1');
  }

  static getInstance(): InfrastructureMonitoringService {
    if (!InfrastructureMonitoringService.instance) {
      InfrastructureMonitoringService.instance = new InfrastructureMonitoringService();
    }
    return InfrastructureMonitoringService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load initial metrics
      await this.collectAllMetrics();

      // Initialize health checks
      this.initializeHealthChecks();

      // Start periodic monitoring
      this.startPeriodicMonitoring();

      this.isInitialized = true;
      logger.info('Infrastructure monitoring initialized');

    } catch (error) {
      logger.error('Failed to initialize infrastructure monitoring', error);
      throw error;
    }
  }

  private async collectAllMetrics(): Promise<void> {
    try {
      const [vercelMetrics, supabaseMetrics, cdnMetrics, externalServicesMetrics] = await Promise.all([
        this.collectVercelMetrics(),
        this.collectSupabaseMetrics(),
        this.collectCDNMetrics(),
        this.collectExternalServicesMetrics()
      ]);

      // Calculate overall health score
      const overallHealth = this.calculateOverallHealth({
        vercel: vercelMetrics,
        supabase: supabaseMetrics,
        cdn: cdnMetrics,
        externalServices: externalServicesMetrics
      });

      this.metrics = {
        vercel: vercelMetrics,
        supabase: supabaseMetrics,
        cdn: cdnMetrics,
        externalServices: externalServicesMetrics,
        timestamp: Date.now(),
        overallHealth
      };

      // Check for infrastructure alerts
      await this.checkInfrastructureAlerts();

      // Report to real-time monitoring
      realTimeMonitoringService.reportMetric({
        type: 'system',
        name: 'infrastructure_metrics',
        value: 'updated',
        metadata: this.metrics
      });

      // Store in database
      await this.storeInfrastructureMetrics();

    } catch (error) {
      logger.error('Failed to collect infrastructure metrics', error);
    }
  }

  private async collectVercelMetrics(): Promise<VercelMetrics> {
    try {
      // Check deployment status
      const deployment = await this.checkVercelDeployment();

      // Collect performance metrics
      const performance = await this.collectVercelPerformanceMetrics();

      // Collect resource usage
      const resources = await this.collectVercelResourceMetrics();

      // Collect edge performance
      const edge = await this.collectVercelEdgeMetrics();

      // Collect security metrics
      const security = await this.collectVercelSecurityMetrics();

      return {
        deployment,
        performance,
        resources,
        edge,
        security
      };

    } catch (error) {
      logger.error('Failed to collect Vercel metrics', error);
      return this.getDefaultVercelMetrics();
    }
  }

  private async checkVercelDeployment(): Promise<VercelMetrics['deployment']> {
    try {
      // In a real implementation, this would call Vercel API
      // For now, return current deployment info
      return {
        status: 'ready',
        url: import.meta.env.VITE_APP_URL || 'https://mariaborysevych.com',
        createdAt: new Date().toISOString(),
        readyAt: new Date().toISOString(),
        buildTime: 120 // Mock build time
      };
    } catch (error) {
      return {
        status: 'error',
        url: import.meta.env.VITE_APP_URL || 'https://mariaborysevych.com',
        createdAt: new Date().toISOString(),
        buildTime: 0,
        errorMessage: 'Failed to fetch deployment status'
      };
    }
  }

  private async collectVercelPerformanceMetrics(): Promise<VercelMetrics['performance']> {
    try {
      const startTime = Date.now();

      // Test API endpoint response time
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' }
      });

      const responseTime = Date.now() - startTime;

      return {
        responseTime,
        throughput: 100, // Mock data - would need real analytics
        errorRate: response.ok ? 0 : 100,
        uptime: response.ok ? 100 : 0
      };

    } catch (error) {
      return {
        responseTime: 9999,
        throughput: 0,
        errorRate: 100,
        uptime: 0
      };
    }
  }

  private async collectVercelResourceMetrics(): Promise<VercelMetrics['resources']> {
    // Mock data - would need Vercel API integration
    return {
      bandwidth: 500, // MB per hour
      builds: 150, // per month
      invocations: 10000, // per month
      duration: 250 // ms per invocation
    };
  }

  private async collectVercelEdgeMetrics(): Promise<VercelMetrics['edge']> {
    // Mock data - would need Vercel analytics
    return {
      regions: [
        { region: 'fra1', latency: 45, requests: 1000, errors: 2 },
        { region: 'iad1', latency: 120, requests: 800, errors: 1 },
        { region: 'hnd1', latency: 180, requests: 300, errors: 0 }
      ],
      cacheHitRate: 85,
      edgeFunctions: {
        invocations: 5000,
        errors: 25,
        avgDuration: 150
      }
    };
  }

  private async collectVercelSecurityMetrics(): Promise<VercelMetrics['security']> {
    // Mock data - would need security monitoring
    return {
      ddosAttacks: 0,
      blockedRequests: 150,
      securityScore: 95
    };
  }

  private async collectSupabaseMetrics(): Promise<SupabaseMetrics> {
    try {
      // Test database connectivity and performance
      const dbMetrics = await this.collectSupabaseDatabaseMetrics();

      // Collect auth metrics
      const auth = await this.collectSupabaseAuthMetrics();

      // Collect storage metrics
      const storage = await this.collectSupabaseStorageMetrics();

      // Collect realtime metrics
      const realtime = await this.collectSupabaseRealtimeMetrics();

      // Collect edge function metrics
      const edgeFunctions = await this.collectSupabaseEdgeFunctionMetrics();

      return {
        database: dbMetrics,
        auth,
        storage,
        realtime,
        edgeFunctions
      };

    } catch (error) {
      logger.error('Failed to collect Supabase metrics', error);
      return this.getDefaultSupabaseMetrics();
    }
  }

  private async collectSupabaseDatabaseMetrics(): Promise<SupabaseMetrics['database']> {
    try {
      const startTime = Date.now();

      // Test database query performance
      const { data, error } = await this.supabase
        .from('monitoring_health_checks')
        .select('score')
        .limit(1);

      const queryTime = Date.now() - startTime;

      // Get database size (mock - would need admin API)
      const storageSize = 150; // MB
      const storageQuota = 1024; // MB
      const storageUtilization = (storageSize / storageQuota) * 100;

      return {
        connections: 10, // Mock - would need monitoring
        maxConnections: 100,
        connectionUtilization: 10,
        storageSize,
        storageQuota,
        storageUtilization,
        backupStatus: 'success',
        lastBackup: new Date().toISOString(),
        queryPerformance: {
          avgExecutionTime: queryTime,
          slowQueries: 0,
          totalQueries: 1,
          errorQueries: error ? 1 : 0
        }
      };

    } catch (error) {
      return {
        connections: 0,
        maxConnections: 100,
        connectionUtilization: 0,
        storageSize: 0,
        storageQuota: 1024,
        storageUtilization: 0,
        backupStatus: 'failed',
        lastBackup: new Date().toISOString(),
        queryPerformance: {
          avgExecutionTime: 9999,
          slowQueries: 1,
          totalQueries: 1,
          errorQueries: 1
        }
      };
    }
  }

  private async collectSupabaseAuthMetrics(): Promise<SupabaseMetrics['auth']> {
    try {
      // Get recent auth activity (mock - would need auth logs)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

      return {
        activeUsers: 25,
        newUsers: 3,
        loginAttempts: 30,
        successfulLogins: 28,
        failedLogins: 2,
        authErrors: 0
      };

    } catch (error) {
      return {
        activeUsers: 0,
        newUsers: 0,
        loginAttempts: 0,
        successfulLogins: 0,
        failedLogins: 0,
        authErrors: 1
      };
    }
  }

  private async collectSupabaseStorageMetrics(): Promise<SupabaseMetrics['storage']> {
    try {
      // Test storage performance
      const testFilePath = 'monitoring/test-file.txt';
      const testData = 'test';

      // Upload test
      const { error: uploadError } = await this.supabase.storage
        .from('uploads')
        .upload(testFilePath, testData);

      // Download test
      const { error: downloadError } = await this.supabase.storage
        .from('uploads')
        .download(testFilePath);

      // Cleanup
      await this.supabase.storage
        .from('uploads')
        .remove([testFilePath]);

      const uploadErrors = uploadError ? 1 : 0;
      const downloadErrors = downloadError ? 1 : 0;

      return {
        totalFiles: 1000, // Mock
        totalSize: 250, // MB
        bandwidthUsage: 10, // MB per day
        cacheHitRate: 90,
        uploadErrors,
        downloadErrors
      };

    } catch (error) {
      return {
        totalFiles: 0,
        totalSize: 0,
        bandwidthUsage: 0,
        cacheHitRate: 0,
        uploadErrors: 1,
        downloadErrors: 1
      };
    }
  }

  private async collectSupabaseRealtimeMetrics(): Promise<SupabaseMetrics['realtime']> {
    // Mock data - would need realtime monitoring
    return {
      activeConnections: 5,
      messagesPerSecond: 10,
      disconnections: 1,
      errors: 0
    };
  }

  private async collectSupabaseEdgeFunctionMetrics(): Promise<SupabaseMetrics['edgeFunctions']> {
    try {
      const startTime = Date.now();

      // Test edge function
      const { data, error } = await this.supabase.functions.invoke('health-check');

      const duration = Date.now() - startTime;

      return {
        invocations: 100, // Mock
        errors: error ? 1 : 0,
        avgDuration: duration,
        maxDuration: duration,
        memoryUsage: 50 // MB
      };

    } catch (error) {
      return {
        invocations: 0,
        errors: 1,
        avgDuration: 9999,
        maxDuration: 9999,
        memoryUsage: 0
      };
    }
  }

  private async collectCDNMetrics(): Promise<CDNMetrics> {
    // Mock CDN metrics - would need CDN API integration
    return {
      provider: 'vercel',
      performance: {
        cacheHitRate: 87,
        avgResponseTime: 95,
        bandwidthSaved: 72,
        compressionRatio: 65
      },
      traffic: {
        totalRequests: 10000,
        cachedRequests: 8700,
        uncachedRequests: 1300,
        bandwidthUsage: 2.5, // GB
        bandwidthSaved: 6.5 // GB
      },
      regions: [
        { region: 'global', requests: 10000, cacheHitRate: 87, avgResponseTime: 95 }
      ],
      security: {
        ddosAttacksBlocked: 2,
        maliciousRequestsBlocked: 50,
        threatsDetected: 1
      }
    };
  }

  private async collectExternalServicesMetrics(): Promise<ExternalServicesMetrics> {
    try {
      // Test Stripe API
      const stripeMetrics = await this.testStripeAPI();

      // Test email service
      const emailMetrics = await this.testEmailService();

      // Test analytics
      const analyticsMetrics = await this.testAnalyticsService();

      // Test social APIs
      const socialMetrics = await this.testSocialAPIs();

      return {
        stripe: stripeMetrics,
        email: emailMetrics,
        analytics: analyticsMetrics,
        social: socialMetrics
      };

    } catch (error) {
      logger.error('Failed to collect external services metrics', error);
      return this.getDefaultExternalServicesMetrics();
    }
  }

  private async testStripeAPI(): Promise<ExternalServicesMetrics['stripe']> {
    try {
      const startTime = Date.now();

      // Test Stripe API health
      const response = await fetch('/api/stripe/health', {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' }
      });

      const responseTime = Date.now() - startTime;

      return {
        apiStatus: response.ok ? 'operational' : 'down',
        responseTime,
        errorRate: response.ok ? 0 : 100,
        webhookStatus: 'operational', // Would need webhook testing
        webhookLatency: responseTime
      };

    } catch (error) {
      return {
        apiStatus: 'down',
        responseTime: 9999,
        errorRate: 100,
        webhookStatus: 'failing',
        webhookLatency: 9999
      };
    }
  }

  private async testEmailService(): Promise<ExternalServicesMetrics['email']> {
    // Mock email metrics - would need email service API
    return {
      provider: 'resend',
      deliveryRate: 98.5,
      bounceRate: 1.2,
      spamComplaints: 0,
      avgDeliveryTime: 250
    };
  }

  private async testAnalyticsService(): Promise<ExternalServicesMetrics['analytics']> {
    // Mock analytics metrics - would need analytics API
    return {
      provider: 'google',
      dataCollection: true,
      eventsPerMinute: 50,
      processingDelay: 500
    };
  }

  private async testSocialAPIs(): Promise<ExternalServicesMetrics['social']> {
    // Mock social API metrics - would need API testing
    return {
      instagram: {
        apiStatus: 'operational',
        rateLimitRemaining: 180,
        lastSync: new Date().toISOString(),
        errors: 0
      },
      facebook: {
        apiStatus: 'operational',
        rateLimitRemaining: 190,
        lastSync: new Date().toISOString(),
        errors: 0
      }
    };
  }

  private calculateOverallHealth(metrics: Omit<InfrastructureMetrics, 'timestamp' | 'overallHealth'>): number {
    let totalScore = 0;
    let componentCount = 0;

    // Vercel health (40% weight)
    const vercelScore = this.calculateVercelHealth(metrics.vercel);
    totalScore += vercelScore * 0.4;
    componentCount++;

    // Supabase health (40% weight)
    const supabaseScore = this.calculateSupabaseHealth(metrics.supabase);
    totalScore += supabaseScore * 0.4;
    componentCount++;

    // CDN health (10% weight)
    const cdnScore = this.calculateCDNHealth(metrics.cdn);
    totalScore += cdnScore * 0.1;
    componentCount++;

    // External services health (10% weight)
    const externalScore = this.calculateExternalServicesHealth(metrics.externalServices);
    totalScore += externalScore * 0.1;
    componentCount++;

    return Math.round(totalScore / componentCount);
  }

  private calculateVercelHealth(vercel: VercelMetrics): number {
    let score = 100;

    // Deployment status
    if (vercel.deployment.status !== 'ready') score -= 30;

    // Performance
    if (vercel.performance.responseTime > 1000) score -= 20;
    if (vercel.performance.errorRate > 5) score -= 25;
    if (vercel.performance.uptime < 99) score -= 15;

    // Edge performance
    if (vercel.edge.cacheHitRate < 80) score -= 10;

    // Security
    if (vercel.security.securityScore < 80) score -= 10;

    return Math.max(0, score);
  }

  private calculateSupabaseHealth(supabase: SupabaseMetrics): number {
    let score = 100;

    // Database health
    if (supabase.database.connectionUtilization > 80) score -= 20;
    if (supabase.database.storageUtilization > 80) score -= 15;
    if (supabase.database.backupStatus !== 'success') score -= 25;
    if (supabase.database.queryPerformance.avgExecutionTime > 1000) score -= 15;

    // Auth health
    if (supabase.auth.authErrors > 0) score -= 10;

    // Storage health
    if (supabase.storage.uploadErrors > 0 || supabase.storage.downloadErrors > 0) score -= 10;

    // Realtime health
    if (supabase.realtime.errors > 0) score -= 5;

    return Math.max(0, score);
  }

  private calculateCDNHealth(cdn: CDNMetrics): number {
    let score = 100;

    if (cdn.performance.cacheHitRate < 80) score -= 30;
    if (cdn.performance.avgResponseTime > 500) score -= 25;
    if (cdn.security.ddosAttacksBlocked > 10) score -= 20;
    if (cdn.security.maliciousRequestsBlocked > 100) score -= 15;

    return Math.max(0, score);
  }

  private calculateExternalServicesHealth(services: ExternalServicesMetrics): number {
    let score = 100;

    // Stripe health
    if (services.stripe.apiStatus !== 'operational') score -= 40;
    if (services.stripe.responseTime > 2000) score -= 15;
    if (services.stripe.errorRate > 5) score -= 10;

    // Email health
    if (services.email.deliveryRate < 95) score -= 15;
    if (services.email.bounceRate > 5) score -= 10;

    // Analytics health
    if (!services.analytics.dataCollection) score -= 10;

    // Social API health
    if (services.social.instagram.apiStatus !== 'operational') score -= 5;
    if (services.social.facebook.apiStatus !== 'operational') score -= 5;

    return Math.max(0, score);
  }

  private initializeHealthChecks(): void {
    const services = ['vercel', 'supabase', 'stripe', 'email', 'analytics'];

    services.forEach(service => {
      this.healthChecks.set(service, {
        service,
        status: 'healthy',
        responseTime: 0,
        lastCheck: Date.now(),
        uptime: 100,
        issues: []
      });
    });
  }

  private async checkInfrastructureAlerts(): Promise<void> {
    if (!this.metrics) return;

    const newAlerts: InfrastructureAlert[] = [];

    // Check Vercel alerts
    if (this.metrics.vercel.performance.errorRate > 10) {
      newAlerts.push(this.createInfrastructureAlert('vercel', 'critical', 'error',
        'High Error Rate', `Vercel error rate (${this.metrics.vercel.performance.errorRate}%) is critical`,
        'error_rate', this.metrics.vercel.performance.errorRate, 5));
    }

    if (this.metrics.vercel.performance.responseTime > 2000) {
      newAlerts.push(this.createInfrastructureAlert('vercel', 'warning', 'performance',
        'Slow Response Time', `Vercel response time (${this.metrics.vercel.performance.responseTime}ms) is slow`,
        'response_time', this.metrics.vercel.performance.responseTime, 1000));
    }

    // Check Supabase alerts
    if (this.metrics.supabase.database.connectionUtilization > 80) {
      newAlerts.push(this.createInfrastructureAlert('supabase', 'warning', 'quota',
        'High Database Connection Usage', `Database connection utilization (${this.metrics.supabase.database.connectionUtilization}%) is high`,
        'connection_utilization', this.metrics.supabase.database.connectionUtilization, 80));
    }

    if (this.metrics.supabase.database.backupStatus !== 'success') {
      newAlerts.push(this.createInfrastructureAlert('supabase', 'critical', 'availability',
        'Database Backup Failed', `Database backup status is ${this.metrics.supabase.database.backupStatus}`,
        'backup_status', 1, 0));
    }

    // Check Stripe alerts
    if (this.metrics.externalServices.stripe.apiStatus !== 'operational') {
      newAlerts.push(this.createInfrastructureAlert('stripe', 'critical', 'availability',
        'Stripe API Down', `Stripe API status is ${this.metrics.externalServices.stripe.apiStatus}`,
        'api_status', 1, 0));
    }

    // Add new alerts
    newAlerts.forEach(alert => {
      if (!this.alerts.some(existing => existing.metric === alert.metric && existing.acknowledged === false)) {
        this.alerts.push(alert);
        realTimeMonitoringService.triggerAlert({
          type: 'system',
          severity: alert.severity,
          title: alert.title,
          message: alert.message,
          metadata: {
            service: alert.service,
            metric: alert.metric,
            value: alert.value,
            threshold: alert.threshold
          }
        });
      }
    });

    // Remove resolved alerts
    this.alerts = this.alerts.filter(alert => {
      const isResolved = this.isAlertResolved(alert);
      if (isResolved) {
        alert.resolved = true;
        alert.resolved = true;
      }
      return !isResolved;
    });
  }

  private isAlertResolved(alert: InfrastructureAlert): boolean {
    if (!this.metrics) return false;

    switch (alert.service) {
      case 'vercel':
        if (alert.metric === 'error_rate') return this.metrics.vercel.performance.errorRate <= alert.threshold;
        if (alert.metric === 'response_time') return this.metrics.vercel.performance.responseTime <= alert.threshold;
        break;

      case 'supabase':
        if (alert.metric === 'connection_utilization') return this.metrics.supabase.database.connectionUtilization <= alert.threshold;
        if (alert.metric === 'backup_status') return this.metrics.supabase.database.backupStatus === 'success';
        break;

      case 'stripe':
        if (alert.metric === 'api_status') return this.metrics.externalServices.stripe.apiStatus === 'operational';
        break;
    }

    return false;
  }

  private createInfrastructureAlert(
    service: InfrastructureAlert['service'],
    severity: InfrastructureAlert['severity'],
    type: InfrastructureAlert['type'],
    title: string,
    message: string,
    metric: string,
    value: number,
    threshold: number
  ): InfrastructureAlert {
    return {
      id: crypto.randomUUID(),
      service,
      severity,
      type,
      title,
      message,
      metric,
      value,
      threshold,
      timestamp: Date.now(),
      acknowledged: false,
      resolved: false
    };
  }

  private startPeriodicMonitoring(): void {
    // Update metrics every 2 minutes
    this.monitoringInterval = setInterval(() => {
      this.collectAllMetrics().catch(error => {
        logger.error('Failed to update infrastructure metrics', error);
      });
    }, 2 * 60 * 1000);
  }

  private async storeInfrastructureMetrics(): Promise<void> {
    if (!this.metrics) return;

    try {
      await this.supabase.from('monitoring_infrastructure').insert({
        vercel_metrics: this.metrics.vercel,
        supabase_metrics: this.metrics.supabase,
        cdn_metrics: this.metrics.cdn,
        external_services_metrics: this.metrics.externalServices,
        overall_health: this.metrics.overallHealth,
        timestamp: new Date(this.metrics.timestamp).toISOString()
      });

    } catch (error) {
      logger.error('Failed to store infrastructure metrics', error);
    }
  }

  // Default metrics methods (fallback values)
  private getDefaultVercelMetrics(): VercelMetrics {
    return {
      deployment: {
        status: 'error',
        url: import.meta.env.VITE_APP_URL || 'https://mariaborysevych.com',
        createdAt: new Date().toISOString(),
        buildTime: 0,
        errorMessage: 'Failed to collect metrics'
      },
      performance: {
        responseTime: 9999,
        throughput: 0,
        errorRate: 100,
        uptime: 0
      },
      resources: {
        bandwidth: 0,
        builds: 0,
        invocations: 0,
        duration: 0
      },
      edge: {
        regions: [],
        cacheHitRate: 0,
        edgeFunctions: {
          invocations: 0,
          errors: 0,
          avgDuration: 0
        }
      },
      security: {
        ddosAttacks: 0,
        blockedRequests: 0,
        securityScore: 0
      }
    };
  }

  private getDefaultSupabaseMetrics(): SupabaseMetrics {
    return {
      database: {
        connections: 0,
        maxConnections: 100,
        connectionUtilization: 0,
        storageSize: 0,
        storageQuota: 1024,
        storageUtilization: 0,
        backupStatus: 'failed',
        lastBackup: new Date().toISOString(),
        queryPerformance: {
          avgExecutionTime: 9999,
          slowQueries: 0,
          totalQueries: 0,
          errorQueries: 0
        }
      },
      auth: {
        activeUsers: 0,
        newUsers: 0,
        loginAttempts: 0,
        successfulLogins: 0,
        failedLogins: 0,
        authErrors: 1
      },
      storage: {
        totalFiles: 0,
        totalSize: 0,
        bandwidthUsage: 0,
        cacheHitRate: 0,
        uploadErrors: 1,
        downloadErrors: 1
      },
      realtime: {
        activeConnections: 0,
        messagesPerSecond: 0,
        disconnections: 0,
        errors: 1
      },
      edgeFunctions: {
        invocations: 0,
        errors: 1,
        avgDuration: 9999,
        maxDuration: 9999,
        memoryUsage: 0
      }
    };
  }

  private getDefaultExternalServicesMetrics(): ExternalServicesMetrics {
    return {
      stripe: {
        apiStatus: 'down',
        responseTime: 9999,
        errorRate: 100,
        webhookStatus: 'failing',
        webhookLatency: 9999
      },
      email: {
        provider: 'unknown',
        deliveryRate: 0,
        bounceRate: 100,
        spamComplaints: 0,
        avgDeliveryTime: 9999
      },
      analytics: {
        provider: 'unknown',
        dataCollection: false,
        eventsPerMinute: 0,
        processingDelay: 9999
      },
      social: {
        instagram: {
          apiStatus: 'down',
          rateLimitRemaining: 0,
          lastSync: new Date().toISOString(),
          errors: 1
        },
        facebook: {
          apiStatus: 'down',
          rateLimitRemaining: 0,
          lastSync: new Date().toISOString(),
          errors: 1
        }
      }
    };
  }

  // Public API methods
  public getMetrics(): InfrastructureMetrics | null {
    return this.metrics;
  }

  public getServiceHealth(serviceName: string): ServiceHealth | undefined {
    return this.healthChecks.get(serviceName);
  }

  public getAllServiceHealth(): Map<string, ServiceHealth> {
    return new Map(this.healthChecks);
  }

  public getActiveAlerts(): InfrastructureAlert[] {
    return this.alerts.filter(alert => !alert.acknowledged && !alert.resolved);
  }

  public acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
    }
  }

  public resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
    }
  }

  public async refreshMetrics(): Promise<void> {
    await this.collectAllMetrics();
  }

  public destroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    this.isInitialized = false;
  }
}

// Export singleton instance
export const infrastructureMonitoringService = InfrastructureMonitoringService.getInstance();

// Export convenience functions
export const initializeInfrastructureMonitoring = () => infrastructureMonitoringService.initialize();
export const getInfrastructureMetrics = () => infrastructureMonitoringService.getMetrics();
export const getServiceHealth = (serviceName: string) => infrastructureMonitoringService.getServiceHealth(serviceName);
export const getInfrastructureAlerts = () => infrastructureMonitoringService.getActiveAlerts();
export const refreshInfrastructureMetrics = () => infrastructureMonitoringService.refreshMetrics();

// Auto-initialize in production
if (import.meta.env.PROD) {
  initializeInfrastructureMonitoring().catch(console.error);
}