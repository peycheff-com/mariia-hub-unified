/**
 * Performance Monitoring System Integration and Validation
 * Comprehensive testing, validation, and integration utilities
 * for the complete performance monitoring ecosystem
 */

import { logger } from '@/services/logger.service';

import { performanceMonitoringService } from './performance-monitoring';
import { performanceAlertingService } from './performance-alerts';
import { securityPerformanceIntegration } from './security-performance-integration';
import { slaManagementService } from './sla-management';

// Testing interfaces
export interface PerformanceTestSuite {
  name: string;
  description: string;
  tests: PerformanceTest[];
  setup?: () => Promise<void>;
  teardown?: () => Promise<void>;
  timeout?: number;
}

export interface PerformanceTest {
  name: string;
  description: string;
  test: () => Promise<TestResult>;
  timeout?: number;
  retries?: number;
  expected?: {
    result: any;
    error?: string;
  };
}

export interface TestResult {
  passed: boolean;
  duration: number;
  result?: any;
  error?: string;
  metrics?: TestMetrics;
}

export interface TestMetrics {
  cpu?: number;
  memory?: number;
  network?: number;
  custom?: Record<string, number>;
}

export interface SystemValidation {
  timestamp: string;
  environment: string;
  version: string;
  components: {
    performanceMonitoring: ComponentStatus;
    alerting: ComponentStatus;
    securityIntegration: ComponentStatus;
    slaManagement: ComponentStatus;
    apiEndpoints: ComponentStatus;
    database: ComponentStatus;
  };
  overall: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    score: number;
    issues: string[];
    recommendations: string[];
  };
}

export interface ComponentStatus {
  initialized: boolean;
  functional: boolean;
  responseTime: number;
  lastCheck: string;
  errors: string[];
  metrics?: Record<string, any>;
}

export interface PerformanceBenchmark {
  category: string;
  metrics: {
    responseTime: {
      p50: number;
      p75: number;
      p90: number;
      p95: number;
      p99: number;
    };
    throughput: number;
    errorRate: number;
    availability: number;
    resourceUsage: {
      cpu: number;
      memory: number;
      disk: number;
      network: number;
    };
  };
  timestamp: string;
  environment: string;
}

class PerformanceMonitoringIntegration {
  private static instance: PerformanceMonitoringIntegration;
  private testResults: Map<string, TestResult> = new Map();
  private validationResults: SystemValidation | null = null;
  private benchmarks: Map<string, PerformanceBenchmark> = new Map();
  private isInitialized = false;

  constructor() {
    this.setupTestSuites();
  }

  static getInstance(): PerformanceMonitoringIntegration {
    if (!PerformanceMonitoringIntegration.instance) {
      PerformanceMonitoringIntegration.instance = new PerformanceMonitoringIntegration();
    }
    return PerformanceMonitoringIntegration.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize all performance monitoring components
      await performanceMonitoringService.initialize();
      await performanceAlertingService.initialize();
      await securityPerformanceIntegration.initialize();
      await slaManagementService.initialize();

      this.isInitialized = true;
      logger.info('Performance monitoring integration initialized');

    } catch (error) {
      logger.error('Failed to initialize performance monitoring integration', error);
      throw error;
    }
  }

  async runValidationSuite(): Promise<SystemValidation> {
    try {
      logger.info('Starting performance monitoring validation suite');

      const validation: SystemValidation = {
        timestamp: new Date().toISOString(),
        environment: import.meta.env.MODE,
        version: '1.0.0',
        components: {
          performanceMonitoring: await this.validatePerformanceMonitoring(),
          alerting: await this.validateAlerting(),
          securityIntegration: await this.validateSecurityIntegration(),
          slaManagement: await this.validateSLAManagement(),
          apiEndpoints: await this.validateAPIEndpoints(),
          database: await this.validateDatabase()
        },
        overall: {
          status: 'healthy',
          score: 0,
          issues: [],
          recommendations: []
        }
      };

      // Calculate overall status and score
      const componentScores = Object.values(validation.components).map(component =>
        component.functional && component.initialized ? 100 : 0
      );
      validation.overall.score = Math.round(componentScores.reduce((sum, score) => sum + score, 0) / componentScores.length);

      // Determine overall status
      const failedComponents = Object.values(validation.components).filter(component => !component.functional);
      if (failedComponents.length === 0) {
        validation.overall.status = 'healthy';
      } else if (failedComponents.length <= 2) {
        validation.overall.status = 'degraded';
      } else {
        validation.overall.status = 'unhealthy';
      }

      // Collect issues
      for (const [name, component] of Object.entries(validation.components)) {
        if (!component.initialized) {
          validation.overall.issues.push(`${name} not initialized`);
        }
        if (!component.functional) {
          validation.overall.issues.push(`${name} not functional`);
        }
        validation.overall.issues.push(...component.errors);
      }

      // Generate recommendations
      validation.overall.recommendations = this.generateRecommendations(validation);

      this.validationResults = validation;

      logger.info('Performance monitoring validation completed', {
        status: validation.overall.status,
        score: validation.overall.score,
        issues: validation.overall.issues.length
      });

      return validation;

    } catch (error) {
      logger.error('Performance monitoring validation failed', error);
      throw error;
    }
  }

  private async validatePerformanceMonitoring(): Promise<ComponentStatus> {
    const startTime = Date.now();
    const status: ComponentStatus = {
      initialized: false,
      functional: false,
      responseTime: 0,
      lastCheck: new Date().toISOString(),
      errors: []
    };

    try {
      // Check if service is initialized
      const metrics = performanceMonitoringService.getCurrentMetrics();
      status.initialized = true;

      // Test metric collection
      if (metrics) {
        status.functional = true;
        status.metrics = {
          currentMetrics: metrics,
          historyLength: performanceMonitoringService.getMetricsHistory().length,
          activeAlerts: performanceMonitoringService.getActiveAlerts().length
        };
      } else {
        status.errors.push('No metrics available');
      }

    } catch (error) {
      status.errors.push(`Performance monitoring error: ${(error as Error).message}`);
    }

    status.responseTime = Date.now() - startTime;
    return status;
  }

  private async validateAlerting(): Promise<ComponentStatus> {
    const startTime = Date.now();
    const status: ComponentStatus = {
      initialized: false,
      functional: false,
      responseTime: 0,
      lastCheck: new Date().toISOString(),
      errors: []
    };

    try {
      // Test alert creation
      const alertId = await performanceAlertingService.createAlert({
        type: 'performance',
        severity: 'info',
        title: 'Test Alert',
        message: 'Test alert for validation',
        details: { test: true },
        businessImpact: 'low'
      });

      if (alertId) {
        status.functional = true;

        // Test alert retrieval
        const alerts = performanceAlertingService.getActiveAlerts();
        status.metrics = {
          totalAlerts: alerts.length,
          activeAlerts: alerts.filter(a => !a.resolved).length
        };

        // Clean up test alert
        await performanceAlertingService.resolveAlert(alertId, 'validation-system');
      }

      status.initialized = true;

    } catch (error) {
      status.errors.push(`Alerting system error: ${(error as Error).message}`);
    }

    status.responseTime = Date.now() - startTime;
    return status;
  }

  private async validateSecurityIntegration(): Promise<ComponentStatus> {
    const startTime = Date.now();
    const status: ComponentStatus = {
      initialized: false,
      functional: false,
      responseTime: 0,
      lastCheck: new Date().toISOString(),
      errors: []
    };

    try {
      const dashboard = securityPerformanceIntegration.getUnifiedDashboard();
      status.initialized = true;
      status.functional = true;
      status.metrics = dashboard;

    } catch (error) {
      status.errors.push(`Security integration error: ${(error as Error).message}`);
    }

    status.responseTime = Date.now() - startTime;
    return status;
  }

  private async validateSLAManagement(): Promise<ComponentStatus> {
    const startTime = Date.now();
    const status: ComponentStatus = {
      initialized: false,
      functional: false,
      responseTime: 0,
      lastCheck: new Date().toISOString(),
      errors: []
    };

    try {
      const slas = slaManagementService.getAllSLAs();
      status.initialized = true;
      status.functional = true;
      status.metrics = {
        totalSLAs: slas.length,
        activeSLAs: slas.filter(sla => sla.status === 'active').length
      };

    } catch (error) {
      status.errors.push(`SLA management error: ${(error as Error).message}`);
    }

    status.responseTime = Date.now() - startTime;
    return status;
  }

  private async validateAPIEndpoints(): Promise<ComponentStatus> {
    const startTime = Date.now();
    const status: ComponentStatus = {
      initialized: false,
      functional: false,
      responseTime: 0,
      lastCheck: new Date().toISOString(),
      errors: []
    };

    try {
      // Test key API endpoints
      const endpoints = [
        '/api/performance/health',
        '/api/performance/report'
      ];

      const results = await Promise.allSettled(
        endpoints.map(endpoint => fetch(endpoint))
      );

      const passed = results.filter(result => result.status === 'fulfilled').length;
      status.functional = passed === endpoints.length;
      status.initialized = true;
      status.metrics = {
        endpointsTested: endpoints.length,
        endpointsPassed: passed,
        successRate: (passed / endpoints.length) * 100
      };

      if (passed < endpoints.length) {
        status.errors.push(`${endpoints.length - passed} API endpoints failed`);
      }

    } catch (error) {
      status.errors.push(`API validation error: ${(error as Error).message}`);
    }

    status.responseTime = Date.now() - startTime;
    return status;
  }

  private async validateDatabase(): Promise<ComponentStatus> {
    const startTime = Date.now();
    const status: ComponentStatus = {
      initialized: false,
      functional: false,
      responseTime: 0,
      lastCheck: new Date().toISOString(),
      errors: []
    };

    try {
      // Test database connectivity with a simple query
      const { data, error } = await supabase
        .from('monitoring_health_checks')
        .select('id')
        .limit(1);

      if (error) {
        status.errors.push(`Database connection error: ${error.message}`);
      } else {
        status.functional = true;
        status.metrics = {
          connected: true,
          queryTime: Date.now() - startTime
        };
      }

      status.initialized = true;

    } catch (error) {
      status.errors.push(`Database validation error: ${(error as Error).message}`);
    }

    status.responseTime = Date.now() - startTime;
    return status;
  }

  private generateRecommendations(validation: SystemValidation): string[] {
    const recommendations: string[] = [];

    for (const [name, component] of Object.entries(validation.components)) {
      if (!component.initialized) {
        recommendations.push(`Initialize ${name} component`);
      }
      if (!component.functional) {
        recommendations.push(`Fix functionality issues in ${name}`);
      }
      if (component.responseTime > 1000) {
        recommendations.push(`Optimize ${name} response time (${component.responseTime}ms)`);
      }
    }

    if (validation.overall.score < 80) {
      recommendations.push('Review and address critical system issues');
    }

    if (validation.overall.issues.length > 5) {
      recommendations.push('Implement comprehensive system health monitoring');
    }

    return recommendations;
  }

  async runPerformanceTests(): Promise<Map<string, TestResult>> {
    logger.info('Starting performance monitoring test suite');

    const testSuites = this.getTestSuites();

    for (const suite of testSuites) {
      logger.info(`Running test suite: ${suite.name}`);

      try {
        if (suite.setup) {
          await suite.setup();
        }

        for (const test of suite.tests) {
          await this.runTest(suite.name, test, test.retries || 0);
        }

        if (suite.teardown) {
          await suite.teardown();
        }

      } catch (error) {
        logger.error(`Test suite ${suite.name} failed`, error);
      }
    }

    logger.info('Performance monitoring test suite completed', {
      totalTests: this.testResults.size,
      passedTests: Array.from(this.testResults.values()).filter(r => r.passed).length
    });

    return this.testResults;
  }

  private async runTest(suiteName: string, test: PerformanceTest, retriesLeft: number): Promise<void> {
    const testKey = `${suiteName}:${test.name}`;
    const startTime = Date.now();

    try {
      logger.debug(`Running test: ${test.name}`);

      const result = await Promise.race([
        test.test(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Test timeout')), test.timeout || 30000)
        )
      ]);

      const testResult: TestResult = {
        passed: true,
        duration: Date.now() - startTime,
        result
      };

      // Validate expected result if provided
      if (test.expected) {
        if (test.expected.result !== undefined && JSON.stringify(result) !== JSON.stringify(test.expected.result)) {
          testResult.passed = false;
          testResult.error = `Expected ${JSON.stringify(test.expected.result)}, got ${JSON.stringify(result)}`;
        }
      }

      this.testResults.set(testKey, testResult);
      logger.debug(`Test passed: ${test.name}`, { duration: testResult.duration });

    } catch (error) {
      const testResult: TestResult = {
        passed: false,
        duration: Date.now() - startTime,
        error: (error as Error).message
      };

      // Check if error matches expected
      if (test.expected?.error && testResult.error?.includes(test.expected.error)) {
        testResult.passed = true;
      }

      this.testResults.set(testKey, testResult);

      if (!testResult.passed && retriesLeft > 0) {
        logger.warn(`Test failed, retrying (${retriesLeft} attempts left): ${test.name}`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before retry
        return this.runTest(suiteName, test, retriesLeft - 1);
      }

      logger.error(`Test failed: ${test.name}`, { error: testResult.error, duration: testResult.duration });
    }
  }

  private getTestSuites(): PerformanceTestSuite[] {
    return [
      {
        name: 'Performance Monitoring Core',
        description: 'Test core performance monitoring functionality',
        tests: [
          {
            name: 'Initialize Service',
            description: 'Test performance monitoring service initialization',
            test: async () => {
              await performanceMonitoringService.initialize();
              return { initialized: true };
            },
            expected: { result: { initialized: true } }
          },
          {
            name: 'Collect Metrics',
            description: 'Test metric collection functionality',
            test: async () => {
              const metrics = performanceMonitoringService.getCurrentMetrics();
              return { metricsAvailable: metrics !== null };
            },
            expected: { result: { metricsAvailable: true } }
          },
          {
            name: 'Get Metrics History',
            description: 'Test metrics history retrieval',
            test: async () => {
              const history = performanceMonitoringService.getMetricsHistory(10);
              return { historyLength: history.length };
            }
          },
          {
            name: 'Export Metrics',
            description: 'Test metrics export functionality',
            test: async () => {
              const data = await performanceMonitoringService.exportMetrics('json');
              return { exportSuccessful: data.length > 0 };
            }
          }
        ]
      },
      {
        name: 'Alerting System',
        description: 'Test alerting and notification functionality',
        tests: [
          {
            name: 'Create Alert',
            description: 'Test alert creation',
            test: async () => {
              const alertId = await performanceAlertingService.createAlert({
                type: 'performance',
                severity: 'warning',
                title: 'Test Alert',
                message: 'Test message',
                details: {},
                businessImpact: 'low'
              });
              return { alertId, alertCreated: !!alertId };
            },
            expected: { result: { alertCreated: true } }
          },
          {
            name: 'Get Active Alerts',
            description: 'Test active alerts retrieval',
            test: async () => {
              const alerts = performanceAlertingService.getActiveAlerts();
              return { alertsCount: alerts.length };
            }
          },
          {
            name: 'Alert Statistics',
            description: 'Test alert statistics calculation',
            test: async () => {
              const stats = await performanceAlertingService.getAlertStatistics('day');
              return { statsAvailable: stats.total >= 0 };
            }
          }
        ]
      },
      {
        name: 'Security Integration',
        description: 'Test security-performance integration',
        tests: [
          {
            name: 'Get Unified Dashboard',
            description: 'Test unified dashboard functionality',
            test: async () => {
              const dashboard = securityPerformanceIntegration.getUnifiedDashboard();
              return { dashboardAvailable: dashboard !== null };
            }
          }
        ]
      },
      {
        name: 'SLA Management',
        description: 'Test SLA management functionality',
        tests: [
          {
            name: 'Get SLAs',
            description: 'Test SLA retrieval',
            test: async () => {
              const slas = slaManagementService.getAllSLAs();
              return { slasCount: slas.length };
            }
          },
          {
            name: 'Create SLA',
            description: 'Test SLA creation',
            test: async () => {
              const slaId = await slaManagementService.createSLA({
                name: 'Test SLA',
                description: 'Test SLA for validation',
                version: '1.0',
                status: 'draft',
                serviceLevel: 'standard',
                customerSegment: 'all',
                validityPeriod: {
                  startDate: new Date().toISOString(),
                  endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
                },
                metrics: [],
                penalties: { enabled: false, structure: {}, escalation: { levels: [] } },
                reporting: { frequency: 'monthly', recipients: [], format: 'dashboard', include: {} },
                exemptions: []
              });
              return { slaId, slaCreated: !!slaId };
            },
            expected: { result: { slaCreated: true } }
          }
        ]
      },
      {
        name: 'Performance Under Load',
        description: 'Test system performance under load',
        tests: [
          {
            name: 'Concurrent Metric Collection',
            description: 'Test concurrent metric collection',
            test: async () => {
              const promises = Array.from({ length: 10 }, () =>
                performanceMonitoringService.getCurrentMetrics()
              );
              const results = await Promise.all(promises);
              return {
                concurrentCollections: results.length,
                allSuccessful: results.every(r => r !== null)
              };
            },
            expected: { result: { allSuccessful: true } }
          },
          {
            name: 'Alert Throughput',
            description: 'Test alert system throughput',
            test: async () => {
              const startTime = Date.now();
              const promises = Array.from({ length: 5 }, (_, i) =>
                performanceAlertingService.createAlert({
                  type: 'performance',
                  severity: 'info',
                  title: `Test Alert ${i}`,
                  message: `Test message ${i}`,
                  details: {},
                  businessImpact: 'low'
                })
              );
              const results = await Promise.all(promises);
              const duration = Date.now() - startTime;
              return {
                alertsCreated: results.filter(r => r).length,
                duration,
                throughput: results.length / (duration / 1000)
              };
            }
          }
        ]
      }
    ];
  }

  async runPerformanceBenchmark(category: string = 'overall'): Promise<PerformanceBenchmark> {
    logger.info(`Running performance benchmark for category: ${category}`);

    const benchmark: PerformanceBenchmark = {
      category,
      metrics: {
        responseTime: {
          p50: 0,
          p75: 0,
          p90: 0,
          p95: 0,
          p99: 0
        },
        throughput: 0,
        errorRate: 0,
        availability: 100,
        resourceUsage: {
          cpu: 0,
          memory: 0,
          disk: 0,
          network: 0
        }
      },
      timestamp: new Date().toISOString(),
      environment: import.meta.env.MODE
    };

    try {
      // Collect response time metrics
      const responseTimes: number[] = [];
      const startTime = Date.now();

      for (let i = 0; i < 100; i++) {
        const testStart = Date.now();
        await this.performBenchmarkOperation(category);
        responseTimes.push(Date.now() - testStart);
      }

      // Calculate percentiles
      responseTimes.sort((a, b) => a - b);
      benchmark.metrics.responseTime = {
        p50: responseTimes[Math.floor(responseTimes.length * 0.5)],
        p75: responseTimes[Math.floor(responseTimes.length * 0.75)],
        p90: responseTimes[Math.floor(responseTimes.length * 0.9)],
        p95: responseTimes[Math.floor(responseTimes.length * 0.95)],
        p99: responseTimes[Math.floor(responseTimes.length * 0.99)]
      };

      // Calculate throughput
      const totalTime = Date.now() - startTime;
      benchmark.metrics.throughput = (100 / totalTime) * 1000; // operations per second

      // Get resource usage
      if (typeof window !== 'undefined' && (performance as any).memory) {
        const memory = (performance as any).memory;
        benchmark.metrics.resourceUsage.memory = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      }

      // Store benchmark
      this.benchmarks.set(`${category}-${Date.now()}`, benchmark);

      logger.info('Performance benchmark completed', {
        category,
        avgResponseTime: benchmark.metrics.responseTime.p95,
        throughput: benchmark.metrics.throughput
      });

    } catch (error) {
      logger.error('Performance benchmark failed', error);
    }

    return benchmark;
  }

  private async performBenchmarkOperation(category: string): Promise<void> {
    switch (category) {
      case 'metrics':
        performanceMonitoringService.getCurrentMetrics();
        break;
      case 'alerts':
        await performanceAlertingService.getActiveAlerts();
        break;
      case 'security':
        securityPerformanceIntegration.getUnifiedDashboard();
        break;
      case 'sla':
        slaManagementService.getAllSLAs();
        break;
      default:
        // General operation
        await Promise.all([
          performanceMonitoringService.getCurrentMetrics(),
          performanceAlertingService.getActiveAlerts()
        ]);
    }
  }

  getValidationResults(): SystemValidation | null {
    return this.validationResults;
  }

  getTestResults(): Map<string, TestResult> {
    return this.testResults;
  }

  getBenchmarks(): Map<string, PerformanceBenchmark> {
    return this.benchmarks;
  }

  generateReport(): string {
    const validation = this.validationResults;
    const testResults = this.testResults;
    const benchmarks = this.benchmarks;

    if (!validation) {
      return 'No validation results available. Run validation suite first.';
    }

    const totalTests = testResults.size;
    const passedTests = Array.from(testResults.values()).filter(r => r.passed).length;
    const testPassRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

    let report = `
# Performance Monitoring System Validation Report

Generated: ${new Date().toISOString()}
Environment: ${validation.environment}
Version: ${validation.version}

## Overall Status
- Status: ${validation.overall.status.toUpperCase()}
- Score: ${validation.overall.score}/100
- Issues: ${validation.overall.issues.length}
- Test Pass Rate: ${testPassRate.toFixed(1)}%

## Component Status
`;

    for (const [name, component] of Object.entries(validation.components)) {
      report += `
### ${name}
- Initialized: ${component.initialized ? '✅' : '❌'}
- Functional: ${component.functional ? '✅' : '❌'}
- Response Time: ${component.responseTime}ms
- Errors: ${component.errors.length}
${component.errors.length > 0 ? `- Errors: ${component.errors.join(', ')}` : ''}
`;
    }

    if (validation.overall.issues.length > 0) {
      report += `
## Issues
${validation.overall.issues.map(issue => `- ${issue}`).join('\n')}
`;
    }

    if (validation.overall.recommendations.length > 0) {
      report += `
## Recommendations
${validation.overall.recommendations.map(rec => `- ${rec}`).join('\n')}
`;
    }

    if (benchmarks.size > 0) {
      report += `
## Performance Benchmarks
`;
      for (const [key, benchmark] of benchmarks.entries()) {
        report += `
### ${benchmark.category}
- Avg Response Time (P95): ${benchmark.metrics.responseTime.p95}ms
- Throughput: ${benchmark.metrics.throughput.toFixed(2)} ops/sec
- Memory Usage: ${benchmark.metrics.resourceUsage.memory.toFixed(1)}%
- Timestamp: ${benchmark.timestamp}
`;
      }
    }

    report += `
## Test Results Summary
- Total Tests: ${totalTests}
- Passed: ${passedTests}
- Failed: ${totalTests - passedTests}
- Pass Rate: ${testPassRate.toFixed(1)}%

`;

    return report;
  }

  private setupTestSuites(): void {
    // Additional test suites can be added here
  }

  // Public API methods

  public async validateSystem(): Promise<SystemValidation> {
    return this.runValidationSuite();
  }

  public async runTests(): Promise<Map<string, TestResult>> {
    return this.runPerformanceTests();
  }

  public async benchmark(category?: string): Promise<PerformanceBenchmark> {
    return this.runPerformanceBenchmark(category);
  }

  public getReport(): string {
    return this.generateReport();
  }

  public destroy(): void {
    this.testResults.clear();
    this.benchmarks.clear();
    this.validationResults = null;
    this.isInitialized = false;
  }
}

// Export singleton instance
export const performanceMonitoringIntegration = PerformanceMonitoringIntegration.getInstance();

// Export convenient functions
export const validatePerformanceMonitoring = () => performanceMonitoringIntegration.validateSystem();
export const runPerformanceTests = () => performanceMonitoringIntegration.runTests();
export const benchmarkPerformance = (category?: string) => performanceMonitoringIntegration.benchmark(category);
export const getPerformanceReport = () => performanceMonitoringIntegration.getReport();

// Export validation result type
export type { SystemValidation, TestResult, PerformanceBenchmark };

// Auto-validation in development
if (import.meta.env.DEV) {
  // Run validation on module load in development
  validatePerformanceMonitoring().catch(console.error);
}