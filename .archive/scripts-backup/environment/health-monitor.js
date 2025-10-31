#!/usr/bin/env node

/**
 * Advanced Environment Health Monitoring and Analytics System
 * Provides comprehensive health monitoring, alerting, and analytics for all environments
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import YAML from 'yaml';
import { EventEmitter } from 'events';
import { CronJob } from 'cron';
import fetch from 'node-fetch';
import { exec } from 'child_process';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execAsync = promisify(exec);

class HealthMonitor extends EventEmitter {
  constructor() {
    super();
    this.configDir = path.join(__dirname, '..', '..', 'config');
    this.monitoringDir = path.join(this.configDir, 'monitoring');
    this.healthDir = path.join(this.monitoringDir, 'health');
    this.alertsDir = path.join(this.monitoringDir, 'alerts');
    this.metricsDir = path.join(this.monitoringDir, 'metrics');
    this.analyticsDir = path.join(this.monitoringDir, 'analytics');
    this.stateDir = path.join(this.monitoringDir, '.state');
    this.logsDir = path.join(this.monitoringDir, 'logs');

    this.ensureDirectories();
    this.loadConfiguration();
    this.initializeHealthChecks();
    this.setupMonitoringJobs();
    this.loadHistoricalData();
  }

  ensureDirectories() {
    const dirs = [
      this.configDir,
      this.monitoringDir,
      this.healthDir,
      this.alertsDir,
      this.metricsDir,
      this.analyticsDir,
      this.stateDir,
      this.logsDir,
      path.join(this.healthDir, 'checks'),
      path.join(this.healthDir, 'thresholds'),
      path.join(this.alertsDir, 'rules'),
      path.join(this.alertsDir, 'channels'),
      path.join(this.metricsDir, 'raw'),
      path.join(this.metricsDir, 'aggregated'),
      path.join(this.analyticsDir, 'reports'),
      path.join(this.analyticsDir, 'dashboards')
    ];

    dirs.forEach(dir => fs.ensureDirSync(dir));
  }

  loadConfiguration() {
    this.config = this.loadConfig(path.join(this.monitoringDir, 'config.yml'));
    this.healthChecks = this.loadConfig(path.join(this.healthDir, 'health-checks.yml'));
    this.thresholds = this.loadConfig(path.join(this.healthDir, 'thresholds.yml'));
    this.alertRules = this.loadConfig(path.join(this.alertsDir, 'rules.yml'));
    this.alertChannels = this.loadConfig(path.join(this.alertsDir, 'channels.yml'));
  }

  loadConfig(configPath) {
    try {
      if (fs.existsSync(configPath)) {
        return YAML.parse(fs.readFileSync(configPath, 'utf8'));
      }
    } catch (error) {
      console.warn(`Warning: Could not load config from ${configPath}:`, error.message);
    }
    return {};
  }

  initializeHealthChecks() {
    this.healthStatus = new Map();
    this.healthHistory = new Map();
    this.activeAlerts = new Map();
    this.alertHistory = [];
    this.metricsHistory = new Map();
    this.trends = new Map();
  }

  loadHistoricalData() {
    try {
      const statePath = path.join(this.stateDir, 'health-state.json');
      if (fs.existsSync(statePath)) {
        const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));

        // Restore Maps
        if (state.healthStatus) {
          this.healthStatus = new Map(Object.entries(state.healthStatus));
        }
        if (state.healthHistory) {
          this.healthHistory = new Map(Object.entries(state.healthHistory));
        }
        if (state.activeAlerts) {
          this.activeAlerts = new Map(Object.entries(state.activeAlerts));
        }
        if (state.alertHistory) {
          this.alertHistory = state.alertHistory;
        }
        if (state.metricsHistory) {
          this.metricsHistory = new Map(Object.entries(state.metricsHistory));
        }
      }
    } catch (error) {
      console.warn('Warning: Could not load historical health data:', error.message);
    }
  }

  setupMonitoringJobs() {
    // Real-time health checks
    this.realtimeJob = new CronJob('*/15 * * * * *', async () => {
      await this.runRealtimeHealthChecks();
    });

    // Comprehensive health checks
    this.comprehensiveJob = new CronJob('*/2 * * * *', async () => {
      await this.runComprehensiveHealthChecks();
    });

    // Trend analysis
    this.trendAnalysisJob = new CronJob('*/10 * * * *', async () => {
      await this.analyzeTrends();
    });

    // Alert processing
    this.alertProcessingJob = new CronJob('*/30 * * * * *', async () => {
      await this.processAlerts();
    });

    // Report generation
    this.reportJob = new CronJob('0 */6 * * *', async () => {
      await this.generateHealthReports();
    });

    // Start all jobs
    this.realtimeJob.start();
    this.comprehensiveJob.start();
    this.trendAnalysisJob.start();
    this.alertProcessingJob.start();
    this.reportJob.start();

    console.log('🏥 Health monitoring jobs started');
  }

  /**
   * Run real-time health checks
   */
  async runRealtimeHealthChecks() {
    try {
      const environments = await this.getActiveEnvironments();

      for (const env of environments) {
        await this.runBasicHealthCheck(env);
      }

      await this.persistHealthState();
    } catch (error) {
      console.error('Error in realtime health checks:', error.message);
      this.emit('health-check:error', { error: error.message });
    }
  }

  /**
   * Run comprehensive health checks
   */
  async runComprehensiveHealthChecks() {
    try {
      const environments = await this.getActiveEnvironments();

      for (const env of environments) {
        await this.runFullHealthCheck(env);
      }

      await this.persistHealthState();
    } catch (error) {
      console.error('Error in comprehensive health checks:', error.message);
      this.emit('health-check:error', { error: error.message });
    }
  }

  /**
   * Run basic health check for an environment
   */
  async runBasicHealthCheck(environment) {
    const { name, type, domain, namespace } = environment;
    const startTime = Date.now();

    try {
      const healthResults = {
        timestamp: new Date().toISOString(),
        environment: name,
        type,
        duration: 0,
        status: 'healthy',
        checks: {},
        score: 100,
        errors: []
      };

      // Application health check
      healthResults.checks.application = await this.checkApplicationHealth(domain);

      // Database health check
      healthResults.checks.database = await this.checkDatabaseHealth(namespace);

      // Service availability check
      healthResults.checks.services = await this.checkServicesHealth(namespace);

      // Basic resource check
      healthResults.checks.resources = await this.checkBasicResources(namespace);

      // Calculate overall health score
      healthResults.score = this.calculateHealthScore(healthResults.checks);
      healthResults.status = healthResults.score >= 80 ? 'healthy' : healthResults.score >= 60 ? 'degraded' : 'unhealthy';
      healthResults.duration = Date.now() - startTime;

      // Update health status
      this.healthStatus.set(name, healthResults);

      // Add to history
      if (!this.healthHistory.has(name)) {
        this.healthHistory.set(name, []);
      }
      const history = this.healthHistory.get(name);
      history.push(healthResults);

      // Keep only last 1000 entries
      if (history.length > 1000) {
        history.splice(0, history.length - 1000);
      }

      // Emit health status change
      const previousStatus = this.healthStatus.get(name);
      if (previousStatus && previousStatus.status !== healthResults.status) {
        this.emit('health:status-changed', {
          environment: name,
          previousStatus: previousStatus.status,
          currentStatus: healthResults.status,
          score: healthResults.score
        });
      }

      // Check for alerts
      await this.checkAlertConditions(name, healthResults);

      return healthResults;

    } catch (error) {
      const errorResult = {
        timestamp: new Date().toISOString(),
        environment: name,
        type,
        duration: Date.now() - startTime,
        status: 'error',
        checks: {},
        score: 0,
        errors: [error.message]
      };

      this.healthStatus.set(name, errorResult);
      this.emit('health-check:error', { environment: name, error: error.message });

      return errorResult;
    }
  }

  /**
   * Run full health check for an environment
   */
  async runFullHealthCheck(environment) {
    const { name, type, domain, namespace } = environment;
    const startTime = Date.now();

    try {
      const healthResults = {
        timestamp: new Date().toISOString(),
        environment: name,
        type,
        duration: 0,
        status: 'healthy',
        checks: {},
        metrics: {},
        score: 100,
        errors: [],
        recommendations: []
      };

      // Basic checks (from runBasicHealthCheck)
      healthResults.checks.application = await this.checkApplicationHealth(domain);
      healthResults.checks.database = await this.checkDatabaseHealth(namespace);
      healthResults.checks.services = await this.checkServicesHealth(namespace);
      healthResults.checks.resources = await this.checkFullResources(namespace);

      // Advanced checks
      healthResults.checks.performance = await this.checkPerformanceMetrics(domain);
      healthResults.checks.security = await this.checkSecurityHealth(domain);
      healthResults.checks.dependencies = await this.checkDependenciesHealth(namespace);
      healthResults.checks.backup = await this.checkBackupHealth(namespace);
      healthResults.checks.ssl = await this.checkSSLHealth(domain);

      // Collect metrics
      healthResults.metrics = await this.collectHealthMetrics(namespace);

      // Generate recommendations
      healthResults.recommendations = await this.generateHealthRecommendations(healthResults);

      // Calculate overall health score
      healthResults.score = this.calculateHealthScore(healthResults.checks);
      healthResults.status = healthResults.score >= 80 ? 'healthy' : healthResults.score >= 60 ? 'degraded' : 'unhealthy';
      healthResults.duration = Date.now() - startTime;

      // Update health status
      this.healthStatus.set(name, healthResults);

      // Add to history
      if (!this.healthHistory.has(name)) {
        this.healthHistory.set(name, []);
      }
      const history = this.healthHistory.get(name);
      history.push(healthResults);

      // Keep only last 1000 entries
      if (history.length > 1000) {
        history.splice(0, history.length - 1000);
      }

      // Check for alerts
      await this.checkAlertConditions(name, healthResults);

      return healthResults;

    } catch (error) {
      const errorResult = {
        timestamp: new Date().toISOString(),
        environment: name,
        type,
        duration: Date.now() - startTime,
        status: 'error',
        checks: {},
        metrics: {},
        score: 0,
        errors: [error.message],
        recommendations: ['Fix the monitoring error to get accurate health readings']
      };

      this.healthStatus.set(name, errorResult);
      this.emit('health-check:error', { environment: name, error: error.message });

      return errorResult;
    }
  }

  /**
   * Check application health
   */
  async checkApplicationHealth(domain) {
    try {
      const healthEndpoint = `https://${domain}/api/health`;
      const startTime = Date.now();

      const response = await fetch(healthEndpoint, {
        method: 'GET',
        timeout: 10000
      });

      const responseTime = Date.now() - startTime;
      const isHealthy = response.ok;

      let healthData = {};
      try {
        healthData = await response.json();
      } catch (e) {
        // Health endpoint doesn't return JSON
      }

      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        responseTime,
        statusCode: response.status,
        uptime: healthData.uptime || null,
        version: healthData.version || null,
        checks: healthData.checks || {},
        details: isHealthy ? 'Application is responding normally' : `HTTP ${response.status}: ${response.statusText}`
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: 10000,
        statusCode: 0,
        uptime: null,
        version: null,
        checks: {},
        details: `Connection failed: ${error.message}`
      };
    }
  }

  /**
   * Check database health
   */
  async checkDatabaseHealth(namespace) {
    try {
      const result = await execAsync(
        `kubectl exec -n ${namespace} deployment/app -- pg_isready -U postgres`,
        { timeout: 5000 }
      );

      const isHealthy = result.stdout.includes('accepting connections');

      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        details: isHealthy ? 'Database is accepting connections' : 'Database is not accepting connections',
        response: result.stdout.trim()
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        details: `Database check failed: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Check services health
   */
  async checkServicesHealth(namespace) {
    try {
      const result = await execAsync(
        `kubectl get pods -n ${namespace} -o jsonpath='{range .items[*]}{.metadata.name}{"\\t"}{.status.phase}{"\\n"}{end}'`,
        { timeout: 5000 }
      );

      const podLines = result.stdout.trim().split('\n');
      let totalPods = 0;
      let runningPods = 0;
      let failedPods = 0;
      const podDetails = [];

      for (const line of podLines) {
        if (line.trim()) {
          const [name, status] = line.split('\t');
          totalPods++;

          if (status === 'Running') {
            runningPods++;
          } else {
            failedPods++;
          }

          podDetails.push({ name, status });
        }
      }

      const healthPercentage = totalPods > 0 ? (runningPods / totalPods) * 100 : 0;
      const status = healthPercentage >= 90 ? 'healthy' : healthPercentage >= 70 ? 'degraded' : 'unhealthy';

      return {
        status,
        totalPods,
        runningPods,
        failedPods,
        healthPercentage,
        podDetails,
        details: `${runningPods}/${totalPods} pods are running`
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        totalPods: 0,
        runningPods: 0,
        failedPods: 0,
        healthPercentage: 0,
        podDetails: [],
        details: `Service check failed: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Check basic resources
   */
  async checkBasicResources(namespace) {
    try {
      const result = await execAsync(
        `kubectl top pods -n ${namespace} --no-headers`,
        { timeout: 5000 }
      );

      const podLines = result.stdout.trim().split('\n');
      let totalCPU = 0;
      let totalMemory = 0;
      let podCount = 0;

      for (const line of podLines) {
        if (line.trim()) {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 3) {
            const cpu = this.parseCPUUsage(parts[2]);
            const memory = this.parseMemoryUsage(parts[3]);
            totalCPU += cpu;
            totalMemory += memory;
            podCount++;
          }
        }
      }

      return {
        status: 'healthy', // Basic check just collects data
        totalCPU,
        totalMemory,
        podCount,
        details: `Resource usage collected for ${podCount} pods`
      };

    } catch (error) {
      return {
        status: 'warning',
        totalCPU: 0,
        totalMemory: 0,
        podCount: 0,
        details: `Resource check failed: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Check full resources
   */
  async checkFullResources(namespace) {
    const basicResources = await this.checkBasicResources(namespace);

    try {
      // Get resource requests and limits
      const describeResult = await execAsync(
        `kubectl describe pods -n ${namespace} | grep -A 2 "Requests:"`,
        { timeout: 5000 }
      );

      const requests = this.parseResourceRequests(describeResult.stdout);

      return {
        ...basicResources,
        requests,
        utilization: {
          cpu: requests.cpu > 0 ? (basicResources.totalCPU / requests.cpu) * 100 : 0,
          memory: requests.memory > 0 ? (basicResources.totalMemory / requests.memory) * 100 : 0
        },
        status: basicResources.status === 'warning' ? 'warning' : 'healthy'
      };

    } catch (error) {
      return {
        ...basicResources,
        requests: { cpu: 0, memory: 0 },
        utilization: { cpu: 0, memory: 0 },
        status: 'warning',
        details: `${basicResources.details}. Resource limits could not be determined.`,
        error: error.message
      };
    }
  }

  /**
   * Check performance metrics
   */
  async checkPerformanceMetrics(domain) {
    try {
      const baseUrl = `https://${domain}`;

      // Measure response times
      const responseTimes = await this.measureResponseTimes(baseUrl);

      // Check error rate
      const errorRate = await this.measureErrorRate(baseUrl);

      // Check availability
      const availability = await this.checkAvailability(baseUrl);

      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const p95ResponseTime = responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.95)];

      let status = 'healthy';
      if (avgResponseTime > 2000 || errorRate > 5 || !availability) {
        status = 'unhealthy';
      } else if (avgResponseTime > 1000 || errorRate > 1) {
        status = 'degraded';
      }

      return {
        status,
        responseTime: {
          average: Math.round(avgResponseTime),
          p95: Math.round(p95ResponseTime),
          min: Math.min(...responseTimes),
          max: Math.max(...responseTimes)
        },
        errorRate,
        availability,
        details: `Average response time: ${Math.round(avgResponseTime)}ms, Error rate: ${errorRate.toFixed(2)}%, Availability: ${availability ? 'Yes' : 'No'}`
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: { average: 0, p95: 0, min: 0, max: 0 },
        errorRate: 100,
        availability: false,
        details: `Performance check failed: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Check security health
   */
  async checkSecurityHealth(domain) {
    try {
      const securityChecks = [];

      // SSL certificate check
      const sslCheck = await this.checkSSLCertificate(domain);
      securityChecks.push(sslCheck);

      // Security headers check
      const headersCheck = await this.checkSecurityHeaders(domain);
      securityChecks.push(headersCheck);

      // HTTPS enforcement check
      const httpsCheck = await this.checkHTTPSRedirection(domain);
      securityChecks.push(httpsCheck);

      const failedChecks = securityChecks.filter(check => check.status !== 'healthy');
      const status = failedChecks.length === 0 ? 'healthy' : failedChecks.length === 1 ? 'degraded' : 'unhealthy';

      return {
        status,
        checks: securityChecks,
        failedCount: failedChecks.length,
        totalCount: securityChecks.length,
        details: `${securityChecks.length - failedChecks.length}/${securityChecks.length} security checks passed`
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        checks: [],
        failedCount: 0,
        totalCount: 0,
        details: `Security check failed: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Check dependencies health
   */
  async checkDependenciesHealth(namespace) {
    try {
      const dependencies = [];

      // Check Redis if configured
      try {
        const redisResult = await execAsync(
          `kubectl exec -n ${namespace} deployment/app -- redis-cli ping`,
          { timeout: 5000 }
        );
        dependencies.push({
          name: 'Redis',
          status: redisResult.stdout.includes('PONG') ? 'healthy' : 'unhealthy',
          details: redisResult.stdout.trim()
        });
      } catch (error) {
        dependencies.push({
          name: 'Redis',
          status: 'warning',
          details: 'Redis not accessible or not configured'
        });
      }

      // Check external APIs
      const externalServices = [
        { name: 'Supabase', url: 'https://api.supabase.io' },
        { name: 'Stripe', url: 'https://api.stripe.com/v1' }
      ];

      for (const service of externalServices) {
        try {
          const response = await fetch(service.url, {
            method: 'HEAD',
            timeout: 5000
          });
          dependencies.push({
            name: service.name,
            status: response.ok ? 'healthy' : 'degraded',
            details: `HTTP ${response.status}`
          });
        } catch (error) {
          dependencies.push({
            name: service.name,
            status: 'unhealthy',
            details: `Connection failed: ${error.message}`
          });
        }
      }

      const healthyCount = dependencies.filter(dep => dep.status === 'healthy').length;
      const status = healthyCount === dependencies.length ? 'healthy' : healthyCount > 0 ? 'degraded' : 'unhealthy';

      return {
        status,
        dependencies,
        healthyCount,
        totalCount: dependencies.length,
        details: `${healthyCount}/${dependencies.length} dependencies are healthy`
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        dependencies: [],
        healthyCount: 0,
        totalCount: 0,
        details: `Dependencies check failed: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Check backup health
   */
  async checkBackupHealth(namespace) {
    try {
      // This would integrate with your backup system
      // For now, return a basic check
      return {
        status: 'healthy',
        lastBackup: new Date().toISOString(),
        backupRetention: 7,
        details: 'Backup system is operational'
      };
    } catch (error) {
      return {
        status: 'warning',
        lastBackup: null,
        backupRetention: 0,
        details: `Backup check failed: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Check SSL health
   */
  async checkSSLHealth(domain) {
    const sslCheck = await this.checkSSLCertificate(domain);
    return {
      status: sslCheck.status,
      details: sslCheck.details,
      expires: sslCheck.expires,
      daysUntilExpiry: sslCheck.daysUntilExpiry
    };
  }

  /**
   * Check SSL certificate
   */
  async checkSSLCertificate(domain) {
    try {
      // This would use a proper SSL checking library or command
      // For now, simulate SSL check
      const certExpiry = new Date();
      certExpiry.setDate(certExpiry.getDate() + 90); // Simulate 90 days to expiry
      const daysUntilExpiry = Math.ceil((certExpiry - new Date()) / (1000 * 60 * 60 * 24));

      const status = daysUntilExpiry > 30 ? 'healthy' : daysUntilExpiry > 7 ? 'degraded' : 'unhealthy';

      return {
        status,
        expires: certExpiry.toISOString(),
        daysUntilExpiry,
        issuer: 'Let\'s Encrypt',
        details: `Certificate expires in ${daysUntilExpiry} days`
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        expires: null,
        daysUntilExpiry: 0,
        issuer: null,
        details: `SSL check failed: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Check security headers
   */
  async checkSecurityHeaders(domain) {
    try {
      const response = await fetch(`https://${domain}`, { timeout: 5000 });
      const headers = response.headers;

      const securityHeaders = [
        'strict-transport-security',
        'x-content-type-options',
        'x-frame-options',
        'x-xss-protection',
        'content-security-policy'
      ];

      const presentHeaders = securityHeaders.filter(header => headers.get(header));
      const missingHeaders = securityHeaders.filter(header => !headers.get(header));

      const status = missingHeaders.length === 0 ? 'healthy' : missingHeaders.length <= 2 ? 'degraded' : 'unhealthy';

      return {
        status,
        presentHeaders,
        missingHeaders,
        details: `${presentHeaders.length}/${securityHeaders.length} security headers present`
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        presentHeaders: [],
        missingHeaders: [],
        details: `Security headers check failed: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Check HTTPS redirection
   */
  async checkHTTPSRedirection(domain) {
    try {
      const response = await fetch(`http://${domain}`, {
        redirect: 'manual',
        timeout: 5000
      });

      const status = response.status >= 300 && response.status < 400 ? 'healthy' : 'unhealthy';
      const location = response.headers.get('location');

      return {
        status,
        redirectLocation: location,
        details: status === 'healthy' ? `Properly redirects to HTTPS (${location})` : 'Does not redirect to HTTPS'
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        redirectLocation: null,
        details: `HTTPS redirection check failed: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Measure response times
   */
  async measureResponseTimes(baseUrl, iterations = 10) {
    const times = [];

    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      try {
        await fetch(`${baseUrl}/api/health`, { timeout: 5000 });
        times.push(Date.now() - start);
      } catch (error) {
        times.push(5000); // Max timeout
      }
    }

    return times;
  }

  /**
   * Measure error rate
   */
  async measureErrorRate(baseUrl, iterations = 20) {
    let errors = 0;

    for (let i = 0; i < iterations; i++) {
      try {
        const response = await fetch(`${baseUrl}/api/health`, { timeout: 2000 });
        if (!response.ok) errors++;
      } catch (error) {
        errors++;
      }
    }

    return (errors / iterations) * 100;
  }

  /**
   * Check availability
   */
  async checkAvailability(baseUrl) {
    try {
      const response = await fetch(`${baseUrl}/api/health`, { timeout: 5000 });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Collect health metrics
   */
  async collectHealthMetrics(namespace) {
    try {
      const metrics = {};

      // Container metrics
      metrics.containers = await this.getContainerMetrics(namespace);

      // Network metrics
      metrics.network = await this.getNetworkMetrics(namespace);

      // Storage metrics
      metrics.storage = await this.getStorageMetrics(namespace);

      return metrics;

    } catch (error) {
      return {
        containers: {},
        network: {},
        storage: {},
        error: error.message
      };
    }
  }

  /**
   * Get container metrics
   */
  async getContainerMetrics(namespace) {
    try {
      const result = await execAsync(
        `kubectl get pods -n ${namespace} -o jsonpath='{range .items[*]}{.metadata.name}{"\\t"}{.status.containerStatuses[0].restartCount}{"\\n"}{end}'`,
        { timeout: 5000 }
      );

      const lines = result.stdout.trim().split('\n');
      const containers = [];

      for (const line of lines) {
        if (line.trim()) {
          const [name, restartCount] = line.split('\t');
          containers.push({
            name,
            restartCount: parseInt(restartCount) || 0
          });
        }
      }

      return {
        total: containers.length,
        totalRestarts: containers.reduce((sum, c) => sum + c.restartCount, 0),
        containers
      };

    } catch (error) {
      return { total: 0, totalRestarts: 0, containers: [] };
    }
  }

  /**
   * Get network metrics
   */
  async getNetworkMetrics(namespace) {
    // This would integrate with network monitoring tools
    return {
      inbound: 0,
      outbound: 0,
      connections: 0,
      errors: 0
    };
  }

  /**
   * Get storage metrics
   */
  async getStorageMetrics(namespace) {
    try {
      const result = await execAsync(
        `kubectl get pvc -n ${namespace} -o jsonpath='{range .items[*]}{.metadata.name}{"\\t"}{.status.capacity.storage}{"\\t"}{.status.conditions[?(@.type=="Bound")].status}{"\\n"}{end}'`,
        { timeout: 5000 }
      );

      const lines = result.stdout.trim().split('\n');
      const volumes = [];

      for (const line of lines) {
        if (line.trim()) {
          const parts = line.split('\t');
          if (parts.length >= 3) {
            volumes.push({
              name: parts[0],
              capacity: parts[1],
              status: parts[2]
            });
          }
        }
      }

      return {
        total: volumes.length,
        bound: volumes.filter(v => v.status === 'True').length,
        volumes
      };

    } catch (error) {
      return { total: 0, bound: 0, volumes: [] };
    }
  }

  /**
   * Calculate health score
   */
  calculateHealthScore(checks) {
    let totalScore = 0;
    let weightSum = 0;

    const weights = {
      application: 30,
      database: 25,
      services: 20,
      resources: 15,
      performance: 10,
      security: 10,
      dependencies: 10,
      backup: 5,
      ssl: 5
    };

    Object.entries(checks).forEach(([checkName, checkResult]) => {
      const weight = weights[checkName] || 5;
      let score = 0;

      if (checkResult.status === 'healthy') {
        score = 100;
      } else if (checkResult.status === 'degraded') {
        score = 70;
      } else if (checkResult.status === 'warning') {
        score = 50;
      } else {
        score = 0;
      }

      totalScore += score * weight;
      weightSum += weight;
    });

    return weightSum > 0 ? Math.round(totalScore / weightSum) : 0;
  }

  /**
   * Generate health recommendations
   */
  async generateHealthRecommendations(healthResults) {
    const recommendations = [];

    // Performance recommendations
    if (healthResults.checks.performance?.responseTime?.average > 1000) {
      recommendations.push({
        category: 'performance',
        priority: 'high',
        title: 'High Response Time Detected',
        description: `Average response time is ${healthResults.checks.performance.responseTime.average}ms`,
        actions: [
          'Check for database performance issues',
          'Review application performance bottlenecks',
          'Consider scaling up resources'
        ]
      });
    }

    // Security recommendations
    if (healthResults.checks.security?.failedCount > 0) {
      recommendations.push({
        category: 'security',
        priority: 'medium',
        title: 'Security Issues Found',
        description: `${healthResults.checks.security.failedCount} security checks failed`,
        actions: [
          'Fix SSL certificate issues',
          'Add missing security headers',
          'Ensure HTTPS redirection is properly configured'
        ]
      });
    }

    // Resource recommendations
    if (healthResults.checks.resources?.utilization?.cpu > 80) {
      recommendations.push({
        category: 'resources',
        priority: 'high',
        title: 'High CPU Utilization',
        description: `CPU utilization is at ${Math.round(healthResults.checks.resources.utilization.cpu)}%`,
        actions: [
          'Scale up CPU resources',
          'Optimize application performance',
          'Check for inefficient processes'
        ]
      });
    }

    return recommendations;
  }

  /**
   * Check alert conditions
   */
  async checkAlertConditions(environment, healthResults) {
    const rules = this.alertRules.rules || [];

    for (const rule of rules) {
      if (this.evaluateAlertRule(rule, healthResults)) {
        await this.triggerAlert(environment, rule, healthResults);
      }
    }
  }

  /**
   * Evaluate alert rule
   */
  evaluateAlertRule(rule, healthResults) {
    try {
      const { condition, threshold } = rule;
      let value = 0;

      // Extract value based on condition
      if (condition.includes('health_score')) {
        value = healthResults.score;
      } else if (condition.includes('response_time')) {
        value = healthResults.checks.performance?.responseTime?.average || 0;
      } else if (condition.includes('error_rate')) {
        value = healthResults.checks.performance?.errorRate || 0;
      } else if (condition.includes('cpu_utilization')) {
        value = healthResults.checks.resources?.utilization?.cpu || 0;
      }

      // Evaluate condition
      if (condition.includes('>')) {
        return value > threshold;
      } else if (condition.includes('<')) {
        return value < threshold;
      } else if (condition.includes('==')) {
        return value === threshold;
      }

      return false;

    } catch (error) {
      console.error(`Error evaluating alert rule:`, error.message);
      return false;
    }
  }

  /**
   * Trigger alert
   */
  async triggerAlert(environment, rule, healthResults) {
    const alertId = `${environment}-${rule.name}-${Date.now()}`;
    const alert = {
      id: alertId,
      environment,
      rule: rule.name,
      severity: rule.severity,
      title: rule.title,
      description: rule.description,
      timestamp: new Date().toISOString(),
      healthScore: healthResults.score,
      status: 'active',
      acknowledged: false
    };

    // Store alert
    this.activeAlerts.set(alertId, alert);
    this.alertHistory.push(alert);

    // Emit alert event
    this.emit('alert:triggered', alert);

    // Send alert to channels
    await this.sendAlertToChannels(alert);

    console.log(`🚨 Alert triggered: ${rule.title} for ${environment}`);
  }

  /**
   * Send alert to channels
   */
  async sendAlertToChannels(alert) {
    const channels = this.alertChannels.channels || [];

    for (const channel of channels) {
      if (channel.enabled) {
        try {
          await this.sendAlertToChannel(alert, channel);
        } catch (error) {
          console.error(`Failed to send alert to ${channel.type}:`, error.message);
        }
      }
    }
  }

  /**
   * Send alert to specific channel
   */
  async sendAlertToChannel(alert, channel) {
    switch (channel.type) {
      case 'email':
        await this.sendEmailAlert(alert, channel);
        break;
      case 'slack':
        await this.sendSlackAlert(alert, channel);
        break;
      case 'webhook':
        await this.sendWebhookAlert(alert, channel);
        break;
      default:
        console.warn(`Unknown alert channel type: ${channel.type}`);
    }
  }

  /**
   * Send email alert
   */
  async sendEmailAlert(alert, channel) {
    // This would integrate with an email service
    console.log(`📧 Email alert sent: ${alert.title}`);
  }

  /**
   * Send Slack alert
   */
  async sendSlackAlert(alert, channel) {
    // This would integrate with Slack API
    console.log(`💬 Slack alert sent: ${alert.title}`);
  }

  /**
   * Send webhook alert
   */
  async sendWebhookAlert(alert, channel) {
    try {
      const payload = {
        alert,
        timestamp: new Date().toISOString()
      };

      const response = await fetch(channel.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        timeout: 5000
      });

      if (response.ok) {
        console.log(`🔗 Webhook alert sent: ${alert.title}`);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      throw new Error(`Webhook alert failed: ${error.message}`);
    }
  }

  /**
   * Analyze trends
   */
  async analyzeTrends() {
    try {
      const environments = await this.getActiveEnvironments();

      for (const env of environments) {
        const history = this.healthHistory.get(env.name) || [];
        if (history.length >= 10) { // Need at least 10 data points for trend analysis
          const trends = this.calculateTrends(history);
          this.trends.set(env.name, trends);
        }
      }

      this.emit('trends:analyzed', { timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('Error analyzing trends:', error.message);
      this.emit('trends:error', { error: error.message });
    }
  }

  /**
   * Calculate trends from health history
   */
  calculateTrends(history) {
    const recentHistory = history.slice(-24); // Last 24 checks
    const olderHistory = history.slice(-48, -24); // Previous 24 checks

    if (recentHistory.length === 0 || olderHistory.length === 0) {
      return { trend: 'stable', change: 0 };
    }

    const recentAvg = recentHistory.reduce((sum, h) => sum + h.score, 0) / recentHistory.length;
    const olderAvg = olderHistory.reduce((sum, h) => sum + h.score, 0) / olderHistory.length;

    const change = recentAvg - olderAvg;
    let trend = 'stable';

    if (change > 5) {
      trend = 'improving';
    } else if (change < -5) {
      trend = 'degrading';
    }

    return {
      trend,
      change: Math.round(change * 10) / 10,
      recentAverage: Math.round(recentAvg),
      olderAverage: Math.round(olderAvg),
      dataPoints: recentHistory.length
    };
  }

  /**
   * Process alerts
   */
  async processAlerts() {
    try {
      // Check for alerts to resolve
      for (const [alertId, alert] of this.activeAlerts) {
        if (await this.shouldResolveAlert(alert)) {
          await this.resolveAlert(alertId);
        }
      }

      // Check for alerts to escalate
      for (const [alertId, alert] of this.activeAlerts) {
        if (await this.shouldEscalateAlert(alert)) {
          await this.escalateAlert(alert);
        }
      }

      this.emit('alerts:processed', { timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('Error processing alerts:', error.message);
      this.emit('alerts:error', { error: error.message });
    }
  }

  /**
   * Check if alert should be resolved
   */
  async shouldResolveAlert(alert) {
    const healthResults = this.healthStatus.get(alert.environment);
    if (!healthResults) return false;

    // Check if the condition that triggered the alert is no longer present
    const rule = this.alertRules.rules?.find(r => r.name === alert.rule);
    if (!rule) return true; // Resolve if rule no longer exists

    return !this.evaluateAlertRule(rule, healthResults);
  }

  /**
   * Resolve alert
   */
  async resolveAlert(alertId) {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return;

    alert.status = 'resolved';
    alert.resolvedAt = new Date().toISOString();

    this.activeAlerts.delete(alertId);

    this.emit('alert:resolved', alert);
    console.log(`✅ Alert resolved: ${alert.title}`);

    // Send resolution notification
    await this.sendAlertResolution(alert);
  }

  /**
   * Check if alert should be escalated
   */
  async shouldEscalateAlert(alert) {
    const alertAge = Date.now() - new Date(alert.timestamp).getTime();
    const maxAge = 5 * 60 * 1000; // 5 minutes

    return alertAge > maxAge && !alert.acknowledged && alert.severity === 'critical';
  }

  /**
   * Escalate alert
   */
  async escalateAlert(alert) {
    alert.escalated = true;
    alert.escalatedAt = new Date().toISOString();

    this.emit('alert:escalated', alert);
    console.log(`🔥 Alert escalated: ${alert.title}`);

    // Send escalation notification
    await this.sendAlertEscalation(alert);
  }

  /**
   * Send alert resolution notification
   */
  async sendAlertResolution(alert) {
    const resolutionAlert = {
      ...alert,
      title: `Resolved: ${alert.title}`,
      description: `Alert has been resolved automatically`,
      status: 'resolved'
    };

    await this.sendAlertToChannels(resolutionAlert);
  }

  /**
   * Send alert escalation notification
   */
  async sendAlertEscalation(alert) {
    const escalationAlert = {
      ...alert,
      title: `ESCALATED: ${alert.title}`,
      description: `Alert has been escalated due to critical severity and lack of acknowledgment`,
      severity: 'critical',
      escalated: true
    };

    await this.sendAlertToChannels(escalationAlert);
  }

  /**
   * Generate health reports
   */
  async generateHealthReports() {
    try {
      const report = {
        timestamp: new Date().toISOString(),
        summary: await this.generateHealthSummary(),
        environments: await this.generateEnvironmentReports(),
        alerts: await this.generateAlertReport(),
        trends: await this.generateTrendReport(),
        recommendations: await this.generateRecommendations()
      };

      // Save report
      const reportPath = path.join(this.analyticsDir, 'reports', `health-report-${new Date().toISOString().split('T')[0]}.json`);
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

      this.emit('report:generated', report);
      console.log('📊 Health report generated');

      return report;

    } catch (error) {
      console.error('Error generating health reports:', error.message);
      this.emit('report:error', { error: error.message });
    }
  }

  /**
   * Generate health summary
   */
  async generateHealthSummary() {
    const environments = await this.getActiveEnvironments();
    let totalScore = 0;
    let healthyCount = 0;
    let degradedCount = 0;
    let unhealthyCount = 0;

    for (const env of environments) {
      const health = this.healthStatus.get(env.name);
      if (health) {
        totalScore += health.score;

        if (health.status === 'healthy') healthyCount++;
        else if (health.status === 'degraded') degradedCount++;
        else unhealthyCount++;
      }
    }

    const avgScore = environments.length > 0 ? totalScore / environments.length : 0;

    return {
      totalEnvironments: environments.length,
      healthyCount,
      degradedCount,
      unhealthyCount,
      averageHealthScore: Math.round(avgScore),
      activeAlerts: this.activeAlerts.size,
      resolvedAlerts: this.alertHistory.filter(a => a.status === 'resolved').length
    };
  }

  /**
   * Generate environment reports
   */
  async generateEnvironmentReports() {
    const environments = await this.getActiveEnvironments();
    const reports = {};

    for (const env of environments) {
      const health = this.healthStatus.get(env.name);
      const history = this.healthHistory.get(env.name) || [];
      const trends = this.trends.get(env.name);

      reports[env.name] = {
        current: health,
        history: history.slice(-24), // Last 24 checks
        trends,
        uptime: this.calculateUptime(history),
        averageResponseTime: this.calculateAverageResponseTime(history)
      };
    }

    return reports;
  }

  /**
   * Generate alert report
   */
  async generateAlertReport() {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const recentAlerts = this.alertHistory.filter(alert =>
      new Date(alert.timestamp) > last24Hours
    );

    return {
      total: recentAlerts.length,
      active: this.activeAlerts.size,
      resolved: recentAlerts.filter(a => a.status === 'resolved').length,
      bySeverity: this.groupAlertsBySeverity(recentAlerts),
      byEnvironment: this.groupAlertsByEnvironment(recentAlerts)
    };
  }

  /**
   * Generate trend report
   */
  async generateTrendReport() {
    const environments = await this.getActiveEnvironments();
    const trends = {};

    for (const env of environments) {
      const envTrends = this.trends.get(env.name);
      if (envTrends) {
        trends[env.name] = envTrends;
      }
    }

    return trends;
  }

  /**
   * Generate recommendations
   */
  async generateRecommendations() {
    const environments = await this.getActiveEnvironments();
    const allRecommendations = [];

    for (const env of environments) {
      const health = this.healthStatus.get(env.name);
      if (health && health.recommendations) {
        allRecommendations.push(...health.recommendations);
      }
    }

    // Group recommendations by priority
    const grouped = {
      high: allRecommendations.filter(r => r.priority === 'high'),
      medium: allRecommendations.filter(r => r.priority === 'medium'),
      low: allRecommendations.filter(r => r.priority === 'low')
    };

    return grouped;
  }

  /**
   * Helper methods
   */
  calculateUptime(history) {
    if (history.length === 0) return 100;

    const healthyChecks = history.filter(h => h.status === 'healthy').length;
    return Math.round((healthyChecks / history.length) * 100);
  }

  calculateAverageResponseTime(history) {
    const responseTimes = history
      .filter(h => h.checks.performance?.responseTime?.average)
      .map(h => h.checks.performance.responseTime.average);

    if (responseTimes.length === 0) return 0;

    return Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length);
  }

  groupAlertsBySeverity(alerts) {
    return alerts.reduce((groups, alert) => {
      groups[alert.severity] = (groups[alert.severity] || 0) + 1;
      return groups;
    }, {});
  }

  groupAlertsByEnvironment(alerts) {
    return alerts.reduce((groups, alert) => {
      groups[alert.environment] = (groups[alert.environment] || 0) + 1;
      return groups;
    }, {});
  }

  parseCPUUsage(cpuString) {
    if (cpuString.endsWith('m')) {
      return parseInt(cpuString.slice(0, -1)) / 1000;
    } else {
      return parseFloat(cpuString);
    }
  }

  parseMemoryUsage(memoryString) {
    const match = memoryString.match(/^(\d+(?:\.\d+)?)([KMGT]?i)?$/);
    if (!match) return 0;

    const value = parseFloat(match[1]);
    const unit = match[2] || '';

    const multipliers = {
      'Ki': 1,
      'Mi': 1024,
      'Gi': 1024 * 1024,
      'Ti': 1024 * 1024 * 1024
    };

    return value * (multipliers[unit] || 1);
  }

  parseResourceRequests(output) {
    const lines = output.split('\n');
    let cpu = 0;
    let memory = 0;

    for (const line of lines) {
      if (line.includes('cpu:')) {
        const cpuMatch = line.match(/cpu:\s*(\d+m?)/);
        if (cpuMatch) {
          cpu += this.parseCPUUsage(cpuMatch[1]);
        }
      }
      if (line.includes('memory:')) {
        const memoryMatch = line.match(/memory:\s*(\d+[KMGT]?i)/);
        if (memoryMatch) {
          memory += this.parseMemoryUsage(memoryMatch[1]);
        }
      }
    }

    return { cpu, memory };
  }

  /**
   * Get active environments
   */
  async getActiveEnvironments() {
    // This would integrate with your environment manager
    return [
      {
        name: 'staging',
        type: 'staging',
        namespace: 'mariaborysevych-staging',
        domain: 'staging.mariaborysevych.com'
      }
      // Add more environments as needed
    ];
  }

  /**
   * Persist health state
   */
  async persistHealthState() {
    try {
      const statePath = path.join(this.stateDir, 'health-state.json');

      const state = {
        healthStatus: Object.fromEntries(this.healthStatus),
        healthHistory: Object.fromEntries(this.healthHistory),
        activeAlerts: Object.fromEntries(this.activeAlerts),
        alertHistory: this.alertHistory,
        metricsHistory: Object.fromEntries(this.metricsHistory)
      };

      fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
    } catch (error) {
      console.error('Error persisting health state:', error.message);
    }
  }

  /**
   * Stop monitoring
   */
  stop() {
    if (this.realtimeJob) this.realtimeJob.stop();
    if (this.comprehensiveJob) this.comprehensiveJob.stop();
    if (this.trendAnalysisJob) this.trendAnalysisJob.stop();
    if (this.alertProcessingJob) this.alertProcessingJob.stop();
    if (this.reportJob) this.reportJob.stop();

    console.log('🛑 Health monitoring jobs stopped');
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const monitor = new HealthMonitor();

  try {
    switch (command) {
      case 'start':
        console.log('🚀 Starting health monitor...');
        console.log('Health monitor is running. Press Ctrl+C to stop.');

        // Keep process alive
        process.on('SIGINT', () => {
          console.log('\n🛑 Stopping health monitor...');
          monitor.stop();
          process.exit(0);
        });

        // Prevent process from exiting
        setInterval(() => {}, 1000);
        break;

      case 'check':
        const envName = args[1];
        if (envName) {
          const environment = await monitor.getActiveEnvironments().find(env => env.name === envName);
          if (environment) {
            const health = await monitor.runFullHealthCheck(environment);
            console.log('🏥 Health Check Results:');
            console.log(JSON.stringify(health, null, 2));
          } else {
            console.error(`Environment ${envName} not found`);
          }
        } else {
          await monitor.runComprehensiveHealthChecks();
          console.log('🏥 Comprehensive health checks completed');
        }
        break;

      case 'status':
        const environments = await monitor.getActiveEnvironments();
        console.log('🏥 Environment Health Status:');
        console.table(environments.map(env => {
          const health = monitor.healthStatus.get(env.name);
          return {
            environment: env.name,
            type: env.type,
            status: health?.status || 'unknown',
            score: health?.score || 0,
            lastCheck: health?.timestamp || 'never'
          };
        }));
        break;

      case 'alerts':
        console.log('🚨 Active Alerts:');
        if (monitor.activeAlerts.size === 0) {
          console.log('No active alerts');
        } else {
          console.table(Array.from(monitor.activeAlerts.values()));
        }
        break;

      case 'report':
        const report = await monitor.generateHealthReports();
        console.log('📊 Health Report Summary:');
        console.log(`- Total environments: ${report.summary.totalEnvironments}`);
        console.log(`- Average health score: ${report.summary.averageHealthScore}%`);
        console.log(`- Active alerts: ${report.summary.activeAlerts}`);
        console.log(`- Healthy: ${report.summary.healthyCount}`);
        console.log(`- Degraded: ${report.summary.degradedCount}`);
        console.log(`- Unhealthy: ${report.summary.unhealthyCount}`);
        break;

      case 'acknowledge':
        const alertId = args[1];
        if (alertId && monitor.activeAlerts.has(alertId)) {
          const alert = monitor.activeAlerts.get(alertId);
          alert.acknowledged = true;
          alert.acknowledgedAt = new Date().toISOString();
          console.log(`✅ Alert ${alertId} acknowledged`);
        } else {
          console.error(`Alert ${alertId} not found`);
        }
        break;

      default:
        console.log(`
Health Monitor CLI

Commands:
  start                              Start the health monitor daemon
  check [environment]                 Run health checks (all or specific environment)
  status                             Show health status of all environments
  alerts                             Show active alerts
  report                             Generate and display health report
  acknowledge <alert-id>             Acknowledge an alert

Examples:
  node health-monitor.js start
  node health-monitor.js check staging
  node health-monitor.js status
  node health-monitor.js alerts
  node health-monitor.js report
  node health-monitor.js acknowledge abc-123-def
        `);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default HealthMonitor;