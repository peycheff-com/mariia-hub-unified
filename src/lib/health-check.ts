/**
 * Health Check System for mariiaborysevych
 * Monitors system health, performance, and business metrics
 */

import { createClient } from '@supabase/supabase-js';

import { monitoringService } from '../services/monitoringService';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    [key: string]: HealthCheck;
  };
  overall: {
    score: number; // 0-100
    issues: string[];
    recommendations: string[];
  };
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  score: number; // 0-100
  message: string;
  details?: any;
  duration: number; // Response time in ms
  lastChecked: string;
}

export interface SystemMetrics {
  performance: {
    lcp: number; // Largest Contentful Paint
    fid: number; // First Input Delay
    cls: number; // Cumulative Layout Shift
    ttfb: number; // Time to First Byte
    fcp: number; // First Contentful Paint
  };
  resources: {
    memoryUsage?: number;
    connectionCount?: number;
    cacheHitRate?: number;
    bundleSize?: number;
  };
  business: {
    activeUsers: number;
    recentBookings: number;
    conversionRate: number;
    errorRate: number;
    avgResponseTime: number;
  };
}

class HealthCheckService {
  private static instance: HealthCheckService;
  private supabase: any;
  private checkIntervals: Map<string, NodeJS.Timeout> = new Map();
  private lastResults: Map<string, HealthCheck> = new Map();
  private isRunning = false;

  constructor() {
    this.supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL!,
      import.meta.env.VITE_SUPABASE_ANON_KEY!
    );
  }

  static getInstance(): HealthCheckService {
    if (!HealthCheckService.instance) {
      HealthCheckService.instance = new HealthCheckService();
    }
    return HealthCheckService.instance;
  }

  /**
   * Start continuous health monitoring
   */
  startContinuousMonitoring() {
    if (this.isRunning) return;
    this.isRunning = true;

    // Core health checks (every 30 seconds)
    this.checkIntervals.set('core', setInterval(() => {
      this.runCoreHealthChecks();
    }, 30000));

    // Performance checks (every 60 seconds)
    this.checkIntervals.set('performance', setInterval(() => {
      this.runPerformanceChecks();
    }, 60000));

    // Business metrics checks (every 5 minutes)
    this.checkIntervals.set('business', setInterval(() => {
      this.runBusinessMetricsChecks();
    }, 300000));

    // Deep system checks (every 10 minutes)
    this.checkIntervals.set('deep', setInterval(() => {
      this.runDeepSystemChecks();
    }, 600000));

    console.log('Health monitoring started');
  }

  /**
   * Stop continuous monitoring
   */
  stopContinuousMonitoring() {
    this.checkIntervals.forEach(interval => clearInterval(interval));
    this.checkIntervals.clear();
    this.isRunning = false;
    console.log('Health monitoring stopped');
  }

  /**
   * Run comprehensive health check
   */
  async runFullHealthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const checks: { [key: string]: HealthCheck } = {};

    try {
      // Core connectivity checks
      checks.database = await this.checkDatabaseHealth();
      checks.supabaseAuth = await this.checkSupabaseAuth();
      checks.apiEndpoints = await this.checkApiEndpoints();

      // Performance checks
      checks.pagePerformance = await this.checkPagePerformance();
      checks.bundleSize = await this.checkBundleSize();
      checks.cdnPerformance = await this.checkCdnPerformance();

      // Business metrics
      checks.bookingFlow = await this.checkBookingFlowHealth();
      checks.paymentProcessing = await this.checkPaymentProcessing();
      checks.userServiceDiscovery = await this.checkUserServiceDiscovery();

      // Security checks
      checks.sslCertificate = await this.checkSslCertificate();
      checks.securityHeaders = await this.checkSecurityHeaders();
      checks.rateLimiting = await this.checkRateLimiting();

      // Calculate overall health
      const overall = this.calculateOverallHealth(checks);

      const result: HealthCheckResult = {
        status: this.getOverallStatus(overall.score),
        timestamp: new Date().toISOString(),
        checks,
        overall,
      };

      // Cache results
      Object.entries(checks).forEach(([key, check]) => {
        this.lastResults.set(key, check);
      });

      // Report to monitoring
      this.reportHealthResults(result);

      return result;

    } catch (error) {
      console.error('Health check failed:', error);

      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        checks: {
          system: {
            name: 'System Health Check',
            status: 'fail',
            score: 0,
            message: `Health check execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            duration: Date.now() - startTime,
            lastChecked: new Date().toISOString(),
          }
        },
        overall: {
          score: 0,
          issues: ['Health check system failure'],
          recommendations: ['Check monitoring configuration', 'Verify system connectivity'],
        },
      };
    }
  }

  /**
   * Core health checks
   */
  private async runCoreHealthChecks() {
    await Promise.allSettled([
      this.checkDatabaseHealth(),
      this.checkSupabaseAuth(),
      this.checkApiEndpoints(),
    ]);
  }

  /**
   * Performance checks
   */
  private async runPerformanceChecks() {
    await Promise.allSettled([
      this.checkPagePerformance(),
      this.checkBundleSize(),
      this.checkCdnPerformance(),
    ]);
  }

  /**
   * Business metrics checks
   */
  private async runBusinessMetricsChecks() {
    await Promise.allSettled([
      this.checkBookingFlowHealth(),
      this.checkPaymentProcessing(),
      this.checkUserServiceDiscovery(),
    ]);
  }

  /**
   * Deep system checks
   */
  private async runDeepSystemChecks() {
    await Promise.allSettled([
      this.checkSslCertificate(),
      this.checkSecurityHeaders(),
      this.checkRateLimiting(),
    ]);
  }

  /**
   * Check database connectivity and performance
   */
  private async checkDatabaseHealth(): Promise<HealthCheck> {
    const startTime = Date.now();
    const name = 'Database Connectivity';

    try {
      // Test basic connectivity
      const { data, error, time } = await this.timeQuery(async () => {
        return this.supabase.from('services').select('count').single();
      });

      if (error) {
        return {
          name,
          status: 'fail',
          score: 0,
          message: `Database connection failed: ${error.message}`,
          duration: Date.now() - startTime,
          lastChecked: new Date().toISOString(),
        };
      }

      // Check response time
      const duration = Date.now() - startTime;
      let status: 'pass' | 'warn' | 'fail' = 'pass';
      let score = 100;
      let message = 'Database connection healthy';

      if (duration > 2000) {
        status = 'fail';
        score = 30;
        message = `Database response slow: ${duration}ms`;
      } else if (duration > 1000) {
        status = 'warn';
        score = 70;
        message = `Database response degraded: ${duration}ms`;
      }

      return {
        name,
        status,
        score,
        message,
        details: { responseTime: duration, query: 'service count' },
        duration,
        lastChecked: new Date().toISOString(),
      };

    } catch (error) {
      return {
        name,
        status: 'fail',
        score: 0,
        message: `Database check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
      };
    }
  }

  /**
   * Check Supabase authentication
   */
  private async checkSupabaseAuth(): Promise<HealthCheck> {
    const startTime = Date.now();
    const name = 'Supabase Authentication';

    try {
      const { data: { session }, error } = await this.supabase.auth.getSession();

      if (error && error.message !== 'Invalid Refresh Token') {
        return {
          name,
          status: 'warn',
          score: 60,
          message: `Auth service warning: ${error.message}`,
          duration: Date.now() - startTime,
          lastChecked: new Date().toISOString(),
        };
      }

      return {
        name,
        status: 'pass',
        score: 100,
        message: 'Authentication service operational',
        details: { hasSession: !!session },
        duration: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
      };

    } catch (error) {
      return {
        name,
        status: 'fail',
        score: 0,
        message: `Auth check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
      };
    }
  }

  /**
   * Check API endpoint availability
   */
  private async checkApiEndpoints(): Promise<HealthCheck> {
    const startTime = Date.now();
    const name = 'API Endpoints';

    const endpoints = [
      '/api/health',
      '/api/services',
      '/api/availability',
    ];

    const results = await Promise.allSettled(
      endpoints.map(async endpoint => {
        try {
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });
          return { endpoint, status: response.status, ok: response.ok };
        } catch (error) {
          return { endpoint, status: 0, ok: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
      })
    );

    const healthyEndpoints = results.filter(
      result => result.status === 'fulfilled' && result.value.ok
    ).length;

    const score = (healthyEndpoints / endpoints.length) * 100;
    let status: 'pass' | 'warn' | 'fail' = 'pass';
    let message = `All endpoints healthy (${healthyEndpoints}/${endpoints.length})`;

    if (score < 50) {
      status = 'fail';
      message = `Multiple endpoints failing (${endpoints.length - healthyEndpoints} failures)`;
    } else if (score < 100) {
      status = 'warn';
      message = `Some endpoints degraded (${endpoints.length - healthyEndpoints} failures)`;
    }

    return {
      name,
      status,
      score,
      message,
      details: { endpoints: results.map(r => r.status === 'fulfilled' ? r.value : r.reason) },
      duration: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
    };
  }

  /**
   * Check page performance metrics
   */
  private async checkPagePerformance(): Promise<HealthCheck> {
    const startTime = Date.now();
    const name = 'Page Performance';

    try {
      const metrics = await this.getPageMetrics();

      // Calculate performance score based on Web Vitals
      let score = 100;
      const issues: string[] = [];

      // LCP (Largest Contentful Paint) - should be < 2.5s
      if (metrics.lcp > 4000) {
        score -= 30;
        issues.push(`LCP too slow: ${metrics.lcp}ms`);
      } else if (metrics.lcp > 2500) {
        score -= 15;
        issues.push(`LCP needs improvement: ${metrics.lcp}ms`);
      }

      // FID (First Input Delay) - should be < 100ms
      if (metrics.fid > 300) {
        score -= 25;
        issues.push(`FID too slow: ${metrics.fid}ms`);
      } else if (metrics.fid > 100) {
        score -= 10;
        issues.push(`FID needs improvement: ${metrics.fid}ms`);
      }

      // CLS (Cumulative Layout Shift) - should be < 0.1
      if (metrics.cls > 0.25) {
        score -= 20;
        issues.push(`CLS too high: ${metrics.cls.toFixed(3)}`);
      } else if (metrics.cls > 0.1) {
        score -= 10;
        issues.push(`CLS needs improvement: ${metrics.cls.toFixed(3)}`);
      }

      // TTFB (Time to First Byte) - should be < 600ms
      if (metrics.ttfb > 1000) {
        score -= 15;
        issues.push(`TTFB too slow: ${metrics.ttfb}ms`);
      } else if (metrics.ttfb > 600) {
        score -= 5;
        issues.push(`TTFB needs improvement: ${metrics.ttfb}ms`);
      }

      let status: 'pass' | 'warn' | 'fail' = 'pass';
      if (score < 60) status = 'fail';
      else if (score < 85) status = 'warn';

      return {
        name,
        status,
        score,
        message: issues.length > 0 ? `Performance issues detected: ${issues.join(', ')}` : 'Performance optimal',
        details: { metrics, issues },
        duration: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
      };

    } catch (error) {
      return {
        name,
        status: 'warn',
        score: 50,
        message: `Performance metrics unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
      };
    }
  }

  /**
   * Check bundle size and loading performance
   */
  private async checkBundleSize(): Promise<HealthCheck> {
    const startTime = Date.now();
    const name = 'Bundle Size';

    try {
      // Get performance entries for resources
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const jsResources = resources.filter(r => r.name.endsWith('.js'));

      let totalSize = 0;
      let largestFile = 0;
      let slowResources = 0;

      jsResources.forEach(resource => {
        const size = resource.transferSize || 0;
        totalSize += size;
        largestFile = Math.max(largestFile, size);
        if (resource.duration > 1000) slowResources++;
      });

      // Calculate score
      let score = 100;
      const issues: string[] = [];

      if (totalSize > 2 * 1024 * 1024) { // > 2MB
        score -= 30;
        issues.push(`Bundle too large: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
      } else if (totalSize > 1024 * 1024) { // > 1MB
        score -= 15;
        issues.push(`Bundle size suboptimal: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
      }

      if (largestFile > 500 * 1024) { // > 500KB
        score -= 15;
        issues.push(`Large chunk detected: ${(largestFile / 1024).toFixed(2)}KB`);
      }

      if (slowResources > 0) {
        score -= slowResources * 5;
        issues.push(`${slowResources} slow-loading resources detected`);
      }

      let status: 'pass' | 'warn' | 'fail' = 'pass';
      if (score < 60) status = 'fail';
      else if (score < 85) status = 'warn';

      return {
        name,
        status,
        score,
        message: issues.length > 0 ? `Bundle issues: ${issues.join(', ')}` : 'Bundle size optimal',
        details: {
          totalSize: totalSize / 1024 / 1024, // MB
          jsFiles: jsResources.length,
          largestFile: largestFile / 1024, // KB
          slowResources,
          issues
        },
        duration: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
      };

    } catch (error) {
      return {
        name,
        status: 'warn',
        score: 50,
        message: `Bundle analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
      };
    }
  }

  /**
   * Check CDN performance
   */
  private async checkCdnPerformance(): Promise<HealthCheck> {
    const startTime = Date.now();
    const name = 'CDN Performance';

    try {
      // Test loading common static assets
      const testUrls = [
        '/favicon.ico',
        '/manifest.json',
      ];

      const results = await Promise.allSettled(
        testUrls.map(async url => {
          const start = performance.now();
          try {
            const response = await fetch(url, { method: 'HEAD' });
            return {
              url,
              status: response.status,
              ok: response.ok,
              duration: performance.now() - start,
            };
          } catch (error) {
            return {
              url,
              status: 0,
              ok: false,
              duration: performance.now() - start,
              error: error instanceof Error ? error.message : 'Unknown error',
            };
          }
        })
      );

      const successful = results.filter(
        result => result.status === 'fulfilled' && result.value.ok
      ).length;

      const avgDuration = results
        .filter(r => r.status === 'fulfilled')
        .reduce((sum, r) => sum + r.value.duration, 0) / results.length;

      let score = (successful / testUrls.length) * 100;
      if (avgDuration > 2000) score -= 20;
      else if (avgDuration > 1000) score -= 10;

      let status: 'pass' | 'warn' | 'fail' = 'pass';
      if (score < 60) status = 'fail';
      else if (score < 85) status = 'warn';

      return {
        name,
        status,
        score,
        message: `CDN performance: ${avgDuration.toFixed(0)}ms average response`,
        details: { successRate: successful / testUrls.length, avgDuration },
        duration: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
      };

    } catch (error) {
      return {
        name,
        status: 'warn',
        score: 50,
        message: `CDN check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
      };
    }
  }

  /**
   * Check booking flow health
   */
  private async checkBookingFlowHealth(): Promise<HealthCheck> {
    const startTime = Date.now();
    const name = 'Booking Flow';

    try {
      // Check availability slots
      const { data: slots, error: slotsError } = await this.supabase
        .from('availability_slots')
        .select('id')
        .gte('start_time', new Date().toISOString())
        .limit(1);

      if (slotsError) {
        return {
          name,
          status: 'fail',
          score: 0,
          message: `Availability check failed: ${slotsError.message}`,
          duration: Date.now() - startTime,
          lastChecked: new Date().toISOString(),
        };
      }

      // Check recent bookings
      const { data: recentBookings, error: bookingsError } = await this.supabase
        .from('bookings')
        .select('id')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(10);

      let score = 100;
      const issues: string[] = [];

      if (!slots || slots.length === 0) {
        score -= 30;
        issues.push('No availability slots found');
      }

      if (bookingsError) {
        score -= 20;
        issues.push('Bookings query failed');
      }

      let status: 'pass' | 'warn' | 'fail' = 'pass';
      if (score < 60) status = 'fail';
      else if (score < 85) status = 'warn';

      return {
        name,
        status,
        score,
        message: issues.length > 0 ? `Booking flow issues: ${issues.join(', ')}` : 'Booking flow operational',
        details: {
          availableSlots: slots?.length || 0,
          recentBookings: recentBookings?.length || 0,
          issues
        },
        duration: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
      };

    } catch (error) {
      return {
        name,
        status: 'fail',
        score: 0,
        message: `Booking flow check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
      };
    }
  }

  /**
   * Check payment processing
   */
  private async checkPaymentProcessing(): Promise<HealthCheck> {
    const startTime = Date.now();
    const name = 'Payment Processing';

    try {
      // Check if Stripe is configured
      const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
      if (!stripeKey) {
        return {
          name,
          status: 'warn',
          score: 60,
          message: 'Stripe not configured',
          duration: Date.now() - startTime,
          lastChecked: new Date().toISOString(),
        };
      }

      // Check recent successful payments
      const { data: recentPayments, error: paymentsError } = await this.supabase
        .from('bookings')
        .select('id, payment_status')
        .eq('payment_status', 'completed')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(5);

      let score = 90;
      let status: 'pass' | 'warn' | 'fail' = 'pass';
      let message = 'Payment processing operational';

      if (paymentsError) {
        score -= 20;
        status = 'warn';
        message = `Payment check warning: ${paymentsError.message}`;
      }

      return {
        name,
        status,
        score,
        message,
        details: {
          stripeConfigured: !!stripeKey,
          recentPayments: recentPayments?.length || 0,
        },
        duration: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
      };

    } catch (error) {
      return {
        name,
        status: 'warn',
        score: 50,
        message: `Payment check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
      };
    }
  }

  /**
   * Check user service discovery
   */
  private async checkUserServiceDiscovery(): Promise<HealthCheck> {
    const startTime = Date.now();
    const name = 'Service Discovery';

    try {
      // Check if services are available
      const { data: services, error: servicesError } = await this.supabase
        .from('services')
        .select('id, name, category, is_active')
        .eq('is_active', true)
        .limit(10);

      if (servicesError) {
        return {
          name,
          status: 'fail',
          score: 0,
          message: `Service discovery failed: ${servicesError.message}`,
          duration: Date.now() - startTime,
          lastChecked: new Date().toISOString(),
        };
      }

      let score = 100;
      let status: 'pass' | 'warn' | 'fail' = 'pass';
      let message = 'Service discovery operational';

      if (!services || services.length === 0) {
        score = 0;
        status = 'fail';
        message = 'No active services found';
      } else if (services.length < 3) {
        score = 70;
        status = 'warn';
        message = 'Low number of active services';
      }

      return {
        name,
        status,
        score,
        message,
        details: {
          activeServices: services?.length || 0,
          categories: [...new Set(services?.map(s => s.category))].length,
        },
        duration: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
      };

    } catch (error) {
      return {
        name,
        status: 'fail',
        score: 0,
        message: `Service discovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
      };
    }
  }

  /**
   * Check SSL certificate
   */
  private async checkSslCertificate(): Promise<HealthCheck> {
    const startTime = Date.now();
    const name = 'SSL Certificate';

    try {
      if (window.location.protocol !== 'https:' && !import.meta.env.DEV) {
        return {
          name,
          status: 'fail',
          score: 0,
          message: 'SSL not enabled in production',
          duration: Date.now() - startTime,
          lastChecked: new Date().toISOString(),
        };
      }

      return {
        name,
        status: 'pass',
        score: 100,
        message: import.meta.env.DEV ? 'SSL not applicable in development' : 'SSL certificate valid',
        duration: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
      };

    } catch (error) {
      return {
        name,
        status: 'warn',
        score: 50,
        message: `SSL check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
      };
    }
  }

  /**
   * Check security headers
   */
  private async checkSecurityHeaders(): Promise<HealthCheck> {
    const startTime = Date.now();
    const name = 'Security Headers';

    try {
      const response = await fetch(window.location.href, { method: 'HEAD' });
      const headers = response.headers;

      const securityHeaders = [
        'content-security-policy',
        'x-frame-options',
        'x-content-type-options',
        'referrer-policy',
        'strict-transport-security',
      ];

      const presentHeaders = securityHeaders.filter(header => headers.get(header));
      const score = (presentHeaders.length / securityHeaders.length) * 100;

      let status: 'pass' | 'warn' | 'fail' = 'pass';
      if (score < 50) status = 'fail';
      else if (score < 80) status = 'warn';

      return {
        name,
        status,
        score,
        message: `${presentHeaders.length}/${securityHeaders.length} security headers present`,
        details: { presentHeaders, missingHeaders: securityHeaders.filter(h => !presentHeaders.includes(h)) },
        duration: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
      };

    } catch (error) {
      return {
        name,
        status: 'warn',
        score: 50,
        message: `Security headers check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
      };
    }
  }

  /**
   * Check rate limiting
   */
  private async checkRateLimiting(): Promise<HealthCheck> {
    const startTime = Date.now();
    const name = 'Rate Limiting';

    try {
      // Make multiple rapid requests to test rate limiting
      const requests = Array.from({ length: 5 }, (_, i) =>
        fetch('/api/health', { method: 'GET' })
      );

      const results = await Promise.allSettled(requests);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.ok).length;
      const rateLimited = results.some(r =>
        r.status === 'fulfilled' && r.value.status === 429
      );

      let score = 100;
      let status: 'pass' | 'warn' | 'fail' = 'pass';
      let message = 'Rate limiting appears functional';

      if (successful === 0) {
        score = 0;
        status = 'fail';
        message = 'All requests failed';
      } else if (!rateLimited && successful === 5) {
        score = 70;
        status = 'warn';
        message = 'Rate limiting may not be configured';
      }

      return {
        name,
        status,
        score,
        message,
        details: { successful, rateLimited },
        duration: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
      };

    } catch (error) {
      return {
        name,
        status: 'warn',
        score: 50,
        message: `Rate limiting check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
      };
    }
  }

  /**
   * Get page performance metrics
   */
  private async getPageMetrics(): Promise<SystemMetrics['performance']> {
    return new Promise((resolve) => {
      // Use Web Vitals library if available
      if ('webVitals' in window) {
        // This would be populated by the Web Vitals library
        resolve({
          lcp: 0, // Would be populated by Web Vitals
          fid: 0,
          cls: 0,
          ttfb: 0,
          fcp: 0,
        });
      } else {
        // Fallback to Navigation Timing API
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        resolve({
          lcp: 0,
          fid: 0,
          cls: 0,
          ttfb: navigation.responseStart - navigation.requestStart,
          fcp: navigation.loadEventEnd - navigation.navigationStart,
        });
      }
    });
  }

  /**
   * Calculate overall health score
   */
  private calculateOverallHealth(checks: { [key: string]: HealthCheck }) {
    const checkValues = Object.values(checks);
    const averageScore = checkValues.reduce((sum, check) => sum + check.score, 0) / checkValues.length;

    const failedChecks = checkValues.filter(check => check.status === 'fail');
    const warnings = checkValues.filter(check => check.status === 'warn');

    const issues: string[] = [
      ...failedChecks.map(check => `${check.name}: ${check.message}`),
      ...warnings.map(check => `${check.name}: ${check.message}`),
    ];

    const recommendations: string[] = [];

    if (failedChecks.length > 0) {
      recommendations.push('Address critical failures immediately');
    }
    if (warnings.length > 0) {
      recommendations.push('Review and resolve warnings');
    }
    if (averageScore < 80) {
      recommendations.push('Consider performance optimization');
    }

    return {
      score: Math.round(averageScore),
      issues,
      recommendations,
    };
  }

  /**
   * Get overall status based on score
   */
  private getOverallStatus(score: number): 'healthy' | 'degraded' | 'unhealthy' {
    if (score >= 90) return 'healthy';
    if (score >= 70) return 'degraded';
    return 'unhealthy';
  }

  /**
   * Report health results to monitoring
   */
  private async reportHealthResults(results: HealthCheckResult) {
    try {
      // Send to monitoring service
      monitoringService.trackMetric('health_score', results.overall.score, {
        status: results.status,
      });

      // Send individual check results
      Object.entries(results.checks).forEach(([key, check]) => {
        monitoringService.trackMetric(`health_${key.toLowerCase()}`, check.score, {
          status: check.status,
        });
      });

      // Report critical issues
      if (results.status === 'unhealthy') {
        monitoringService.trackMetric('health_alert', 1, {
          severity: 'critical',
          issues: results.overall.issues.length,
        });
      }

    } catch (error) {
      console.error('Failed to report health results:', error);
    }
  }

  /**
   * Helper to time queries
   */
  private async timeQuery<T>(query: () => Promise<T>): Promise<{ data: T; time: number; error?: any }> {
    const start = performance.now();
    try {
      const data = await query();
      const time = performance.now() - start;
      return { data, time };
    } catch (error) {
      const time = performance.now() - start;
      return { data: null as any, time, error };
    }
  }

  /**
   * Get last check results
   */
  getLastResults(): Map<string, HealthCheck> {
    return new Map(this.lastResults);
  }

  /**
   * Get specific check result
   */
  getCheckResult(name: string): HealthCheck | undefined {
    return this.lastResults.get(name);
  }
}

// Export singleton instance
export const healthCheckService = HealthCheckService.getInstance();

// Export convenience functions
export const startHealthMonitoring = () => healthCheckService.startContinuousMonitoring();
export const stopHealthMonitoring = () => healthCheckService.stopContinuousMonitoring();
export const runHealthCheck = () => healthCheckService.runFullHealthCheck();
export const getHealthStatus = () => healthCheckService.getLastResults();