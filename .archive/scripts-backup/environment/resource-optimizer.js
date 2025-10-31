#!/usr/bin/env node

/**
 * Advanced Resource Optimization and Auto-scaling System
 * Provides intelligent resource management, auto-scaling, and cost optimization
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import YAML from 'yaml';
import { spawn } from 'child_process';
import { CronJob } from 'cron';
import { EventEmitter } from 'events';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ResourceOptimizer extends EventEmitter {
  constructor() {
    super();
    this.configDir = path.join(__dirname, '..', '..', 'config');
    this.optimizationDir = path.join(this.configDir, 'optimization');
    this.policiesDir = path.join(this.optimizationDir, 'policies');
    this.rulesDir = path.join(this.optimizationDir, 'rules');
    this.stateDir = path.join(this.optimizationDir, '.state');
    this.logsDir = path.join(this.optimizationDir, 'logs');

    this.ensureDirectories();
    this.loadConfiguration();
    this.initializeMetrics();
    this.setupOptimizationJobs();
  }

  ensureDirectories() {
    const dirs = [
      this.configDir,
      this.optimizationDir,
      this.policiesDir,
      this.rulesDir,
      this.stateDir,
      this.logsDir,
      path.join(this.optimizationDir, 'strategies'),
      path.join(this.optimizationDir, 'metrics'),
      path.join(this.optimizationDir, 'alerts'),
      path.join(this.optimizationDir, 'backups')
    ];

    dirs.forEach(dir => fs.ensureDirSync(dir));
  }

  loadConfiguration() {
    this.config = this.loadConfig(path.join(this.optimizationDir, 'config.yml'));
    this.policies = this.loadConfig(path.join(this.policiesDir, 'policies.yml'));
    this.rules = this.loadConfig(path.join(this.rulesDir, 'scaling-rules.yml'));
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

  initializeMetrics() {
    this.metrics = {
      environments: new Map(),
      resourceUsage: new Map(),
      costs: new Map(),
      performance: new Map(),
      scaling: new Map()
    };

    // Load persisted metrics
    this.loadPersistedMetrics();
  }

  loadPersistedMetrics() {
    try {
      const metricsPath = path.join(this.stateDir, 'metrics.json');
      if (fs.existsSync(metricsPath)) {
        const persisted = JSON.parse(fs.readFileSync(metricsPath, 'utf8'));

        // Restore Map objects
        Object.entries(persisted).forEach(([key, value]) => {
          if (this.metrics[key]) {
            this.metrics[key] = new Map(Object.entries(value));
          }
        });
      }
    } catch (error) {
      console.warn('Warning: Could not load persisted metrics:', error.message);
    }
  }

  setupOptimizationJobs() {
    // Continuous monitoring job
    this.monitoringJob = new CronJob('*/30 * * * * *', async () => {
      await this.collectMetrics();
    });

    // Resource optimization job
    this.optimizationJob = new CronJob('*/5 * * * *', async () => {
      await this.runOptimizationCycle();
    });

    // Cost analysis job
    this.costAnalysisJob = new CronJob('0 2 * * *', async () => {
      await this.analyzeCosts();
    });

    // Cleanup job
    this.cleanupJob = new CronJob('0 3 * * 0', async () => {
      await this.cleanupResources();
    });

    // Start all jobs
    this.monitoringJob.start();
    this.optimizationJob.start();
    this.costAnalysisJob.start();
    this.cleanupJob.start();

    console.log('📊 Resource optimization jobs started');
  }

  /**
   * Collect comprehensive metrics from all environments
   */
  async collectMetrics() {
    try {
      const environments = await this.getActiveEnvironments();

      for (const env of environments) {
        await this.collectEnvironmentMetrics(env);
      }

      // Persist metrics
      await this.persistMetrics();

      this.emit('metrics:collected', { timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('Error collecting metrics:', error.message);
      this.emit('metrics:error', { error: error.message });
    }
  }

  /**
   * Collect metrics for a specific environment
   */
  async collectEnvironmentMetrics(environment) {
    const { name, type, namespace } = environment;

    try {
      // Resource usage metrics
      const resourceMetrics = await this.getResourceUsage(namespace);

      // Performance metrics
      const performanceMetrics = await this.getPerformanceMetrics(environment);

      // Cost metrics
      const costMetrics = await this.calculateEnvironmentCost(environment, resourceMetrics);

      // Store metrics
      this.metrics.resourceUsage.set(name, {
        ...resourceMetrics,
        timestamp: new Date().toISOString()
      });

      this.metrics.performance.set(name, {
        ...performanceMetrics,
        timestamp: new Date().toISOString()
      });

      this.metrics.costs.set(name, {
        ...costMetrics,
        timestamp: new Date().toISOString()
      });

      // Emit metrics for real-time monitoring
      this.emit('environment:metrics', {
        environment: name,
        type,
        metrics: {
          resources: resourceMetrics,
          performance: performanceMetrics,
          costs: costMetrics
        }
      });

    } catch (error) {
      console.error(`Error collecting metrics for ${name}:`, error.message);
    }
  }

  /**
   * Get resource usage metrics
   */
  async getResourceUsage(namespace) {
    try {
      // CPU usage
      const cpuUsage = await this.getCPUUsage(namespace);

      // Memory usage
      const memoryUsage = await this.getMemoryUsage(namespace);

      // Storage usage
      const storageUsage = await this.getStorageUsage(namespace);

      // Network usage
      const networkUsage = await this.getNetworkUsage(namespace);

      return {
        cpu: cpuUsage,
        memory: memoryUsage,
        storage: storageUsage,
        network: networkUsage
      };
    } catch (error) {
      throw new Error(`Failed to get resource usage: ${error.message}`);
    }
  }

  /**
   * Get CPU usage metrics
   */
  async getCPUUsage(namespace) {
    try {
      const result = await this.executeCommand(
        `kubectl top pods -n ${namespace} --no-headers`
      );

      const pods = result.trim().split('\n');
      let totalCores = 0;
      let requestedCores = 0;
      let podCount = 0;

      for (const pod of pods) {
        if (pod.trim()) {
          const parts = pod.trim().split(/\s+/);
          if (parts.length >= 3) {
            const usage = parts[2]; // CPU usage column
            const cores = this.parseCPUUsage(usage);
            totalCores += cores;
            podCount++;
          }
        }
      }

      // Get requested CPU
      const requestedResult = await this.executeCommand(
        `kubectl describe pods -n ${namespace} | grep -A 1 "Requests:" | grep cpu | awk '{print $2}'`
      );

      if (requestedResult.trim()) {
        requestedCores = this.parseCPUUsage(requestedResult.trim());
      }

      return {
        current: totalCores,
        requested: requestedCores,
        utilization: requestedCores > 0 ? (totalCores / requestedCores) * 100 : 0,
        podCount
      };
    } catch (error) {
      return { current: 0, requested: 0, utilization: 0, podCount: 0 };
    }
  }

  /**
   * Get memory usage metrics
   */
  async getMemoryUsage(namespace) {
    try {
      const result = await this.executeCommand(
        `kubectl top pods -n ${namespace} --no-headers`
      );

      const pods = result.trim().split('\n');
      let totalMemory = 0;
      let requestedMemory = 0;
      let podCount = 0;

      for (const pod of pods) {
        if (pod.trim()) {
          const parts = pod.trim().split(/\s+/);
          if (parts.length >= 3) {
            const usage = parts[3]; // Memory usage column
            const memory = this.parseMemoryUsage(usage);
            totalMemory += memory;
            podCount++;
          }
        }
      }

      // Get requested memory
      const requestedResult = await this.executeCommand(
        `kubectl describe pods -n ${namespace} | grep -A 1 "Requests:" | grep memory | awk '{print $2}'`
      );

      if (requestedResult.trim()) {
        requestedMemory = this.parseMemoryUsage(requestedResult.trim());
      }

      return {
        current: totalMemory,
        requested: requestedMemory,
        utilization: requestedMemory > 0 ? (totalMemory / requestedMemory) * 100 : 0,
        podCount
      };
    } catch (error) {
      return { current: 0, requested: 0, utilization: 0, podCount: 0 };
    }
  }

  /**
   * Get storage usage metrics
   */
  async getStorageUsage(namespace) {
    try {
      const result = await this.executeCommand(
        `kubectl get pv -o jsonpath='{range .items[*]}{.spec.capacity.storage}{"\\n"}{end}'`
      );

      const storageValues = result.trim().split('\n').filter(Boolean);
      let totalStorage = 0;

      for (const storage of storageValues) {
        totalStorage += this.parseStorageSize(storage);
      }

      return {
        total: totalStorage,
        allocated: totalStorage, // Simplified - in reality would check actual usage
        utilization: 0
      };
    } catch (error) {
      return { total: 0, allocated: 0, utilization: 0 };
    }
  }

  /**
   * Get network usage metrics
   */
  async getNetworkUsage(namespace) {
    // This would integrate with network monitoring tools
    return {
      inbound: 0,
      outbound: 0,
      requests: 0,
      errors: 0
    };
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(environment) {
    try {
      const baseUrl = `https://${environment.domain}`;

      // Response time metrics
      const responseTime = await this.measureResponseTime(baseUrl);

      // Error rate
      const errorRate = await this.measureErrorRate(baseUrl);

      // Throughput
      const throughput = await this.measureThroughput(baseUrl);

      return {
        responseTime,
        errorRate,
        throughput,
        availability: await this.checkAvailability(baseUrl)
      };
    } catch (error) {
      return {
        responseTime: 0,
        errorRate: 100,
        throughput: 0,
        availability: false
      };
    }
  }

  /**
   * Measure response time
   */
  async measureResponseTime(baseUrl, iterations = 10) {
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

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const p95 = times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)];

    return {
      average: Math.round(avg),
      p95: Math.round(p95),
      min: Math.min(...times),
      max: Math.max(...times)
    };
  }

  /**
   * Measure error rate
   */
  async measureErrorRate(baseUrl) {
    const requests = 20;
    let errors = 0;

    for (let i = 0; i < requests; i++) {
      try {
        const response = await fetch(`${baseUrl}/api/health`, { timeout: 2000 });
        if (!response.ok) errors++;
      } catch (error) {
        errors++;
      }
    }

    return (errors / requests) * 100;
  }

  /**
   * Measure throughput
   */
  async measureThroughput(baseUrl) {
    const startTime = Date.now();
    const duration = 10000; // 10 seconds
    let requests = 0;

    while (Date.now() - startTime < duration) {
      try {
        await fetch(`${baseUrl}/api/health`, { timeout: 1000 });
        requests++;
      } catch (error) {
        // Continue
      }
    }

    return Math.round(requests / (duration / 1000)); // requests per second
  }

  /**
   * Check service availability
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
   * Calculate environment cost
   */
  async calculateEnvironmentCost(environment, resourceMetrics) {
    const pricing = this.pricing || await this.loadPricing();
    const { resources } = environment;

    let hourlyCost = 0;

    // CPU cost
    const cpuCost = (resourceMetrics.cpu.current / 1000) * pricing.cpu.perCoreHour;
    hourlyCost += cpuCost;

    // Memory cost
    const memoryCost = (resourceMetrics.memory.current / 1024) * pricing.memory.perGiHour;
    hourlyCost += memoryCost;

    // Storage cost
    const storageCost = (resourceMetrics.storage.total / 1024) * pricing.storage.perGiMonth / 730; // Convert to hourly
    hourlyCost += storageCost;

    // Network cost
    const networkCost = (resourceMetrics.network.inbound + resourceMetrics.network.outbound) / 1024 * pricing.network.perGi;
    hourlyCost += networkCost;

    return {
      hourly: Math.round(hourlyCost * 100) / 100,
      daily: Math.round(hourlyCost * 24 * 100) / 100,
      monthly: Math.round(hourlyCost * 730 * 100) / 100,
      breakdown: {
        cpu: Math.round(cpuCost * 100) / 100,
        memory: Math.round(memoryCost * 100) / 100,
        storage: Math.round(storageCost * 100) / 100,
        network: Math.round(networkCost * 100) / 100
      }
    };
  }

  /**
   * Load pricing information
   */
  async loadPricing() {
    return {
      cpu: {
        perCoreHour: 0.0316 // Example pricing
      },
      memory: {
        perGiHour: 0.00423
      },
      storage: {
        perGiMonth: 0.11
      },
      network: {
        perGi: 0.09
      }
    };
  }

  /**
   * Run optimization cycle
   */
  async runOptimizationCycle() {
    try {
      console.log('🔄 Running resource optimization cycle');

      const environments = await this.getActiveEnvironments();
      const optimizations = [];

      for (const env of environments) {
        const optimization = await this.optimizeEnvironment(env);
        if (optimization) {
          optimizations.push(optimization);
        }
      }

      // Apply optimizations
      for (const optimization of optimizations) {
        await this.applyOptimization(optimization);
      }

      this.emit('optimization:completed', {
        timestamp: new Date().toISOString(),
        optimizationsApplied: optimizations.length
      });

    } catch (error) {
      console.error('Error in optimization cycle:', error.message);
      this.emit('optimization:error', { error: error.message });
    }
  }

  /**
   * Optimize a specific environment
   */
  async optimizeEnvironment(environment) {
    const { name, type } = environment;
    const metrics = this.metrics.resourceUsage.get(name);
    const performance = this.metrics.performance.get(name);

    if (!metrics || !performance) {
      return null;
    }

    const optimizations = [];

    // CPU optimization
    const cpuOptimization = await this.optimizeCPU(environment, metrics, performance);
    if (cpuOptimization) optimizations.push(cpuOptimization);

    // Memory optimization
    const memoryOptimization = await this.optimizeMemory(environment, metrics, performance);
    if (memoryOptimization) optimizations.push(memoryOptimization);

    // Scaling optimization
    const scalingOptimization = await this.optimizeScaling(environment, metrics, performance);
    if (scalingOptimization) optimizations.push(scalingOptimization);

    if (optimizations.length > 0) {
      return {
        environment: name,
        type,
        optimizations,
        timestamp: new Date().toISOString()
      };
    }

    return null;
  }

  /**
   * Optimize CPU resources
   */
  async optimizeCPU(environment, metrics, performance) {
    const { name, type } = environment;
    const { cpu } = metrics;
    const { responseTime, errorRate } = performance;

    // Define thresholds based on environment type
    const thresholds = this.getThresholds(type);

    // Check for over-provisioning
    if (cpu.utilization < thresholds.cpu.min && cpu.requested > thresholds.cpu.minCores) {
      return {
        type: 'cpu-scale-down',
        action: 'scale-down',
        currentCores: cpu.requested,
        recommendedCores: Math.max(cpu.current * 1.2, thresholds.cpu.minCores),
        reason: 'CPU underutilization detected',
        savings: this.calculateSavings(cpu.requested - (cpu.current * 1.2), 'cpu')
      };
    }

    // Check for under-provisioning
    if (cpu.utilization > thresholds.cpu.max || responseTime.p95 > thresholds.responseTime.max) {
      return {
        type: 'cpu-scale-up',
        action: 'scale-up',
        currentCores: cpu.requested,
        recommendedCores: cpu.current * 1.5,
        reason: 'CPU overload or high response time detected',
        impact: this.calculateImpact(cpu.current * 0.5, 'cpu')
      };
    }

    return null;
  }

  /**
   * Optimize memory resources
   */
  async optimizeMemory(environment, metrics, performance) {
    const { name, type } = environment;
    const { memory } = metrics;
    const { errorRate } = performance;

    const thresholds = this.getThresholds(type);

    // Check for over-provisioning
    if (memory.utilization < thresholds.memory.min && memory.requested > thresholds.memory.minGi) {
      return {
        type: 'memory-scale-down',
        action: 'scale-down',
        currentMemory: memory.requested,
        recommendedMemory: Math.max(memory.current * 1.2, thresholds.memory.minGi),
        reason: 'Memory underutilization detected',
        savings: this.calculateSavings(memory.requested - (memory.current * 1.2), 'memory')
      };
    }

    // Check for under-provisioning
    if (memory.utilization > thresholds.memory.max || errorRate > thresholds.errorRate.max) {
      return {
        type: 'memory-scale-up',
        action: 'scale-up',
        currentMemory: memory.requested,
        recommendedMemory: memory.current * 1.5,
        reason: 'Memory overload or high error rate detected',
        impact: this.calculateImpact(memory.current * 0.5, 'memory')
      };
    }

    return null;
  }

  /**
   * Optimize scaling (replicas)
   */
  async optimizeScaling(environment, metrics, performance) {
    const { name, type } = environment;
    const { resources } = environment;
    const { cpu, memory } = metrics;
    const { responseTime, throughput } = performance;

    const thresholds = this.getThresholds(type);

    // Scale down if underutilized
    if (cpu.utilization < thresholds.cpu.min &&
        memory.utilization < thresholds.memory.min &&
        responseTime.p95 < thresholds.responseTime.target &&
        resources.replicas > thresholds.scaling.minReplicas) {
      return {
        type: 'replica-scale-down',
        action: 'scale-down',
        currentReplicas: resources.replicas,
        recommendedReplicas: Math.max(resources.replicas - 1, thresholds.scaling.minReplicas),
        reason: 'Low utilization and good performance',
        savings: this.calculateReplicaSavings(1, resources)
      };
    }

    // Scale up if overloaded
    if (cpu.utilization > thresholds.cpu.max ||
        memory.utilization > thresholds.memory.max ||
        responseTime.p95 > thresholds.responseTime.max) {
      return {
        type: 'replica-scale-up',
        action: 'scale-up',
        currentReplicas: resources.replicas,
        recommendedReplicas: Math.min(resources.replicas + 1, thresholds.scaling.maxReplicas),
        reason: 'High utilization or poor performance detected',
        impact: this.calculateReplicaImpact(1, resources)
      };
    }

    return null;
  }

  /**
   * Get optimization thresholds based on environment type
   */
  getThresholds(type) {
    const thresholds = {
      development: {
        cpu: { min: 20, max: 90, minCores: 0.5 },
        memory: { min: 30, max: 85, minGi: 0.5 },
        responseTime: { target: 500, max: 2000 },
        errorRate: { max: 5 },
        scaling: { minReplicas: 1, maxReplicas: 2 }
      },
      staging: {
        cpu: { min: 30, max: 80, minCores: 1 },
        memory: { min: 40, max: 80, minGi: 1 },
        responseTime: { target: 300, max: 1000 },
        errorRate: { max: 2 },
        scaling: { minReplicas: 1, maxReplicas: 3 }
      },
      production: {
        cpu: { min: 40, max: 70, minCores: 2 },
        memory: { min: 50, max: 75, minGi: 2 },
        responseTime: { target: 200, max: 500 },
        errorRate: { max: 1 },
        scaling: { minReplicas: 2, maxReplicas: 10 }
      },
      feature: {
        cpu: { min: 25, max: 85, minCores: 0.5 },
        memory: { min: 35, max: 82, minGi: 0.5 },
        responseTime: { target: 400, max: 1500 },
        errorRate: { max: 3 },
        scaling: { minReplicas: 1, maxReplicas: 2 }
      },
      ephemeral: {
        cpu: { min: 20, max: 90, minCores: 0.25 },
        memory: { min: 25, max: 90, minGi: 0.25 },
        responseTime: { target: 600, max: 3000 },
        errorRate: { max: 8 },
        scaling: { minReplicas: 1, maxReplicas: 1 }
      }
    };

    return thresholds[type] || thresholds.development;
  }

  /**
   * Calculate cost savings for resource reduction
   */
  calculateSavings(amount, resourceType) {
    const pricing = {
      cpu: 0.0316 / 1000, // per millicore per hour
      memory: 0.00423 / 1024 // per MiB per hour
    };

    const hourlySavings = amount * (resourceType === 'cpu' ? pricing.cpu : pricing.memory);
    const dailySavings = hourlySavings * 24;
    const monthlySavings = hourlySavings * 730;

    return {
      hourly: Math.round(hourlySavings * 100) / 100,
      daily: Math.round(dailySavings * 100) / 100,
      monthly: Math.round(monthlySavings * 100) / 100
    };
  }

  /**
   * Calculate cost impact for resource increase
   */
  calculateImpact(amount, resourceType) {
    return this.calculateSavings(amount, resourceType); // Same calculation, just framed as cost
  }

  /**
   * Calculate replica savings
   */
  calculateReplicaSavings(replicas, resources) {
    const hourlyCostPerReplica = (
      (this.parseCPUUsage(resources.cpu) * 0.0316) +
      (this.parseMemoryUsage(resources.memory) * 0.00423)
    );

    const hourlySavings = hourlyCostPerReplica * replicas;
    const dailySavings = hourlySavings * 24;
    const monthlySavings = hourlySavings * 730;

    return {
      hourly: Math.round(hourlySavings * 100) / 100,
      daily: Math.round(dailySavings * 100) / 100,
      monthly: Math.round(monthlySavings * 100) / 100
    };
  }

  /**
   * Calculate replica impact
   */
  calculateReplicaImpact(replicas, resources) {
    return this.calculateReplicaSavings(replicas, resources);
  }

  /**
   * Apply optimization to environment
   */
  async applyOptimization(optimization) {
    const { environment, optimizations } = optimization;

    console.log(`🔧 Applying optimizations to ${environment}`);

    for (const opt of optimizations) {
      try {
        await this.applySingleOptimization(environment, opt);

        this.emit('optimization:applied', {
          environment,
          optimization: opt,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error(`Failed to apply optimization ${opt.type} to ${environment}:`, error.message);

        this.emit('optimization:failed', {
          environment,
          optimization: opt,
          error: error.message
        });
      }
    }
  }

  /**
   * Apply a single optimization
   */
  async applySingleOptimization(environment, optimization) {
    const { type, action, recommendedCores, recommendedMemory, recommendedReplicas } = optimization;

    switch (type) {
      case 'cpu-scale-up':
      case 'cpu-scale-down':
        await this.scaleCPU(environment, recommendedCores);
        break;

      case 'memory-scale-up':
      case 'memory-scale-down':
        await this.scaleMemory(environment, recommendedMemory);
        break;

      case 'replica-scale-up':
      case 'replica-scale-down':
        await this.scaleReplicas(environment, recommendedReplicas);
        break;

      default:
        console.warn(`Unknown optimization type: ${type}`);
    }
  }

  /**
   * Scale CPU resources
   */
  async scaleCPU(environment, cores) {
    const namespace = `mariaborysevych-${environment}`;
    const command = `kubectl patch deployment app -n ${namespace} -p '{"spec":{"template":{"spec":{"containers":[{"name":"app","resources":{"requests":{"cpu":"${cores}m"}}}]}}}}'`;

    await this.executeCommand(command);
    console.log(`✅ Scaled CPU for ${environment} to ${cores}m`);
  }

  /**
   * Scale memory resources
   */
  async scaleMemory(environment, memory) {
    const namespace = `mariaborysevych-${environment}`;
    const command = `kubectl patch deployment app -n ${namespace} -p '{"spec":{"template":{"spec":{"containers":[{"name":"app","resources":{"requests":{"memory":"${memory}Mi"}}}]}}}}'`;

    await this.executeCommand(command);
    console.log(`✅ Scaled memory for ${environment} to ${memory}Mi`);
  }

  /**
   * Scale replicas
   */
  async scaleReplicas(environment, replicas) {
    const namespace = `mariaborysevych-${environment}`;
    const command = `kubectl scale deployment app -n ${namespace} --replicas=${replicas}`;

    await this.executeCommand(command);
    console.log(`✅ Scaled replicas for ${environment} to ${replicas}`);
  }

  /**
   * Analyze costs across all environments
   */
  async analyzeCosts() {
    console.log('💰 Analyzing costs across all environments');

    const environments = await this.getActiveEnvironments();
    const costAnalysis = {
      total: 0,
      byEnvironment: {},
      byType: {},
      breakdown: {
        cpu: 0,
        memory: 0,
        storage: 0,
        network: 0
      },
      recommendations: []
    };

    for (const env of environments) {
      const costMetrics = this.metrics.costs.get(env.name);
      if (costMetrics) {
        costAnalysis.byEnvironment[env.name] = costMetrics;
        costAnalysis.total += costMetrics.monthly;

        // Aggregate by type
        if (!costAnalysis.byType[env.type]) {
          costAnalysis.byType[env.type] = 0;
        }
        costAnalysis.byType[env.type] += costMetrics.monthly;

        // Aggregate breakdown
        Object.entries(costMetrics.breakdown).forEach(([resource, cost]) => {
          costAnalysis.breakdown[resource] += cost;
        });

        // Generate recommendations
        const recommendations = await this.generateCostRecommendations(env, costMetrics);
        costAnalysis.recommendations.push(...recommendations);
      }
    }

    // Save cost analysis
    await this.saveCostAnalysis(costAnalysis);

    this.emit('costs:analyzed', costAnalysis);

    return costAnalysis;
  }

  /**
   * Generate cost optimization recommendations
   */
  async generateCostRecommendations(environment, costMetrics) {
    const recommendations = [];
    const { name, type } = environment;

    // Check for underutilized environments
    const metrics = this.metrics.resourceUsage.get(name);
    if (metrics) {
      if (metrics.cpu.utilization < 30 && type !== 'production') {
        recommendations.push({
          environment: name,
          type: 'reduce-resources',
          priority: 'medium',
          description: `CPU utilization is only ${Math.round(metrics.cpu.utilization)}%. Consider reducing CPU allocation.`,
          estimatedSavings: Math.round(costMetrics.breakdown.cpu * 0.3)
        });
      }

      if (metrics.memory.utilization < 40 && type !== 'production') {
        recommendations.push({
          environment: name,
          type: 'reduce-resources',
          priority: 'medium',
          description: `Memory utilization is only ${Math.round(metrics.memory.utilization)}%. Consider reducing memory allocation.`,
          estimatedSavings: Math.round(costMetrics.breakdown.memory * 0.3)
        });
      }
    }

    // Check for environments that can be shut down
    if (type === 'feature' || type === 'ephemeral') {
      const performance = this.metrics.performance.get(name);
      if (performance && performance.errorRate === 100) {
        recommendations.push({
          environment: name,
          type: 'shutdown',
          priority: 'high',
          description: `Environment appears to be inactive and can be shut down.`,
          estimatedSavings: costMetrics.monthly
        });
      }
    }

    return recommendations;
  }

  /**
   * Save cost analysis to file
   */
  async saveCostAnalysis(analysis) {
    const analysisPath = path.join(this.optimizationDir, 'metrics', `cost-analysis-${new Date().toISOString().split('T')[0]}.json`);
    fs.writeFileSync(analysisPath, JSON.stringify(analysis, null, 2));
  }

  /**
   * Cleanup unused resources
   */
  async cleanupResources() {
    console.log('🧹 Running resource cleanup');

    try {
      // Cleanup old metrics
      await this.cleanupOldMetrics();

      // Cleanup unused volumes
      await this.cleanupUnusedVolumes();

      // Cleanup old configurations
      await this.cleanupOldConfigurations();

      this.emit('cleanup:completed', {
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error during cleanup:', error.message);
      this.emit('cleanup:error', { error: error.message });
    }
  }

  /**
   * Cleanup old metrics
   */
  async cleanupOldMetrics() {
    const retentionDays = this.config.metricsRetentionDays || 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // Clean up environment metrics
    for (const [envName, metrics] of this.metrics.environment) {
      const filteredMetrics = metrics.filter(metric =>
        new Date(metric.timestamp) > cutoffDate
      );
      this.metrics.environment.set(envName, filteredMetrics);
    }

    // Clean up other metric types
    ['resourceUsage', 'costs', 'performance'].forEach(metricType => {
      for (const [envName, metrics] of this.metrics[metricType]) {
        if (Array.isArray(metrics)) {
          const filteredMetrics = metrics.filter(metric =>
            new Date(metric.timestamp) > cutoffDate
          );
          this.metrics[metricType].set(envName, filteredMetrics);
        }
      }
    });
  }

  /**
   * Cleanup unused volumes
   */
  async cleanupUnusedVolumes() {
    try {
      const result = await this.executeCommand(
        'kubectl get pvc -o jsonpath=\'{range .items[*]}{.metadata.name}{"\\n"}{end}\''
      );

      const volumes = result.trim().split('\n').filter(Boolean);
      const unusedVolumes = [];

      for (const volume of volumes) {
        const usage = await this.executeCommand(
          `kubectl describe pvc ${volume} | grep "Used By"`
        );

        if (usage.includes('<none>')) {
          unusedVolumes.push(volume);
        }
      }

      for (const volume of unusedVolumes) {
        await this.executeCommand(`kubectl delete pvc ${volume}`);
        console.log(`🗑️  Deleted unused volume: ${volume}`);
      }

    } catch (error) {
      console.warn('Error cleaning up volumes:', error.message);
    }
  }

  /**
   * Cleanup old configurations
   */
  async cleanupOldConfigurations() {
    const configRetentionDays = this.config.configRetentionDays || 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - configRetentionDays);

    const configsPath = path.join(this.optimizationDir, 'metrics');
    if (fs.existsSync(configsPath)) {
      const files = fs.readdirSync(configsPath);

      for (const file of files) {
        const filePath = path.join(configsPath, file);
        const stats = fs.statSync(filePath);

        if (stats.mtime < cutoffDate) {
          fs.removeSync(filePath);
          console.log(`🗑️  Deleted old config file: ${file}`);
        }
      }
    }
  }

  /**
   * Persist metrics to disk
   */
  async persistMetrics() {
    try {
      const metricsPath = path.join(this.stateDir, 'metrics.json');

      const serializable = {};
      Object.entries(this.metrics).forEach(([key, value]) => {
        serializable[key] = Object.fromEntries(value);
      });

      fs.writeFileSync(metricsPath, JSON.stringify(serializable, null, 2));
    } catch (error) {
      console.error('Error persisting metrics:', error.message);
    }
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
        domain: 'staging.mariaborysevych.com',
        resources: {
          cpu: '1000m',
          memory: '1Gi',
          replicas: 1
        }
      }
      // Add more environments as needed
    ];
  }

  /**
   * Execute shell command
   */
  async executeCommand(command) {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout);
        }
      });
    });
  }

  /**
   * Parse CPU usage string (e.g., "500m" or "1")
   */
  parseCPUUsage(cpuString) {
    if (cpuString.endsWith('m')) {
      return parseInt(cpuString.slice(0, -1)) / 1000;
    } else {
      return parseFloat(cpuString);
    }
  }

  /**
   * Parse memory usage string (e.g., "512Mi" or "1Gi")
   */
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

  /**
   * Parse storage size string
   */
  parseStorageSize(storageString) {
    return this.parseMemoryUsage(storageString); // Same format
  }

  /**
   * Stop all optimization jobs
   */
  stop() {
    if (this.monitoringJob) this.monitoringJob.stop();
    if (this.optimizationJob) this.optimizationJob.stop();
    if (this.costAnalysisJob) this.costAnalysisJob.stop();
    if (this.cleanupJob) this.cleanupJob.stop();

    console.log('🛑 Resource optimization jobs stopped');
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const optimizer = new ResourceOptimizer();

  try {
    switch (command) {
      case 'start':
        console.log('🚀 Starting resource optimizer...');
        console.log('Resource optimizer is running. Press Ctrl+C to stop.');

        // Keep process alive
        process.on('SIGINT', () => {
          console.log('\n🛑 Stopping resource optimizer...');
          optimizer.stop();
          process.exit(0);
        });

        // Prevent process from exiting
        setInterval(() => {}, 1000);
        break;

      case 'optimize':
        const envName = args[1];
        if (envName) {
          const environment = await optimizer.getActiveEnvironments().find(env => env.name === envName);
          if (environment) {
            const optimization = await optimizer.optimizeEnvironment(environment);
            if (optimization) {
              await optimizer.applyOptimization(optimization);
              console.log('✅ Optimization completed:', optimization);
            } else {
              console.log('ℹ️  No optimizations needed');
            }
          } else {
            console.error(`Environment ${envName} not found`);
          }
        } else {
          await optimizer.runOptimizationCycle();
        }
        break;

      case 'analyze':
        const costAnalysis = await optimizer.analyzeCosts();
        console.log('💰 Cost Analysis:');
        console.log(`Total monthly cost: $${costAnalysis.total}`);
        console.log('By environment:', costAnalysis.byEnvironment);
        console.log('By type:', costAnalysis.byType);
        console.log('Recommendations:', costAnalysis.recommendations);
        break;

      case 'metrics':
        await optimizer.collectMetrics();
        console.log('📊 Metrics collected successfully');
        break;

      case 'cleanup':
        await optimizer.cleanupResources();
        console.log('🧹 Cleanup completed');
        break;

      default:
        console.log(`
Resource Optimizer CLI

Commands:
  start                              Start the optimizer daemon
  optimize [environment]             Run optimization cycle (or for specific environment)
  analyze                            Analyze costs and generate recommendations
  metrics                            Collect metrics from all environments
  cleanup                            Clean up unused resources

Examples:
  node resource-optimizer.js start
  node resource-optimizer.js optimize staging
  node resource-optimizer.js analyze
  node resource-optimizer.js metrics
  node resource-optimizer.js cleanup
        `);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

const { exec } = await import('child_process');

function exec(command, options = {}) {
  return new Promise((resolve, reject) => {
    exec(command, options, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default ResourceOptimizer;