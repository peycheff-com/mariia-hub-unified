/**
 * Infrastructure Performance Monitoring System
 *
 * Comprehensive monitoring of database performance, API endpoints, CDN/edge performance,
 * third-party services, and system-wide infrastructure health.
 *
 * @author Performance Team
 * @version 1.0.0
 */

import { performance } from './performance-monitoring-system';

// ===== TYPE DEFINITIONS =====

interface DatabaseMetrics {
  queryPerformance: {
    slowQueries: DatabaseQuery[];
    averageExecutionTime: number;
    queryVolume: number;
    errorRate: number;
    connectionPoolUtilization: number;
  };
  indexUsage: Array<{
    tableName: string;
    indexName: string;
    usageCount: number;
    efficiency: number;
  }>;
  tableMetrics: Array<{
    tableName: string;
    rowCount: number;
    sizeMB: number;
    lastAnalyzed: Date;
    scanRate: number;
  }>;
  performanceTrends: {
    timestamp: number;
    avgQueryTime: number;
    connectionCount: number;
    cacheHitRate: number;
  }[];
}

interface DatabaseQuery {
  id: string;
  query: string;
  executionTime: number;
  timestamp: number;
  parameters?: any[];
  affectedRows?: number;
  indexesUsed: string[];
  explainPlan?: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  optimizationSuggestions: string[];
}

interface APIEndpointMetrics {
  endpoint: string;
  method: string;
  responseTime: {
    avg: number;
    p50: number;
    p75: number;
    p90: number;
    p95: number;
    p99: number;
  };
  throughput: {
    requestsPerSecond: number;
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  errorMetrics: {
    errorRate: number;
    errorTypes: Array<{
      type: string;
      count: number;
      percentage: number;
    }>;
    clientErrors: number; // 4xx
    serverErrors: number; // 5xx
  };
  statusCodes: Record<number, number>;
  healthScore: number; // 0-100
  lastIncident?: {
    timestamp: number;
    type: string;
    duration: number;
    affectedUsers: number;
  };
}

interface CDNPerformanceMetrics {
  region: string;
  provider: string;
  cacheHitRate: number;
  averageResponseTime: number;
  bandwidthUsage: {
    totalGB: number;
    cachedGB: number;
    originGB: number;
  };
  requestVolume: {
    total: number;
    cached: number;
    origin: number;
  };
  edgeLocations: Array<{
    location: string;
    responseTime: number;
    requestCount: number;
    errorRate: number;
  }>;
  performanceIssues: Array<{
    type: 'slow-response' | 'high-error-rate' | 'cache-miss' | 'origin-fallback';
    description: string;
    severity: 'low' | 'medium' | 'high';
    affectedRegions: string[];
  }>;
}

interface ThirdPartyServiceMetrics {
  serviceName: string;
  endpoint: string;
  availability: {
    uptime: number; // percentage
    downtime: number; // total downtime in ms
    incidents: Array<{
      timestamp: number;
      duration: number;
      type: string;
      description: string;
    }>;
  };
  performance: {
    averageResponseTime: number;
    p95ResponseTime: number;
    timeoutRate: number;
    retryRate: number;
  };
  usage: {
    requestCount: number;
    dataTransferred: number;
    cost?: number;
  };
  healthScore: number;
  slaCompliance: {
    target: number; // target uptime percentage
    actual: number; // actual uptime percentage
    penalty?: number;
  };
}

interface InfrastructureHealthMetrics {
  systemLoad: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkIO: number;
  };
  serviceHealth: Array<{
    serviceName: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    lastCheck: number;
    responseTime: number;
    uptime: number;
  }>;
  containerMetrics: Array<{
    containerId: string;
    name: string;
    cpuUsage: number;
    memoryUsage: number;
    networkIO: number;
    restartCount: number;
  }>;
  networkMetrics: {
    latency: number;
    packetLoss: number;
    bandwidth: number;
    connectionCount: number;
  };
  alerts: Array<{
    id: string;
    type: string;
    severity: 'info' | 'warning' | 'critical';
    message: string;
    timestamp: number;
    resolved?: boolean;
    resolvedAt?: number;
  }>;
}

interface PerformanceOptimization {
  category: 'database' | 'api' | 'cdn' | 'infrastructure';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  estimatedImpact: {
    performanceImprovement: number; // percentage
    costSavings?: number; // currency amount
    userExperienceImpact: string;
  };
  implementation: {
    effort: 'low' | 'medium' | 'high';
    timeRequired: string;
    risks: string[];
    prerequisites: string[];
  };
  metrics: {
    currentValue: number;
    targetValue: number;
    measurementMethod: string;
  };
}

// ===== INFRASTRUCTURE MONITORING CLASS =====

class InfrastructurePerformanceMonitoring {
  private static instance: InfrastructurePerformanceMonitoring;
  private databaseMetrics: DatabaseMetrics | null = null;
  private apiMetrics: Map<string, APIEndpointMetrics> = new Map();
  private cdnMetrics: Map<string, CDNPerformanceMetrics> = new Map();
  private thirdPartyMetrics: Map<string, ThirdPartyServiceMetrics> = new Map();
  private infrastructureHealth: InfrastructureHealthMetrics | null = null;
  private optimizations: PerformanceOptimization[] = [];
  private isInitialized = false;
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {}

  static getInstance(): InfrastructurePerformanceMonitoring {
    if (!InfrastructurePerformanceMonitoring.instance) {
      InfrastructurePerformanceMonitoring.instance = new InfrastructurePerformanceMonitoring();
    }
    return InfrastructurePerformanceMonitoring.instance;
  }

  // ===== INITIALIZATION =====

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize database monitoring
      await this.initializeDatabaseMonitoring();

      // Initialize API monitoring
      await this.initializeAPIMonitoring();

      // Initialize CDN monitoring
      await this.initializeCDNMonitoring();

      // Initialize third-party service monitoring
      await this.initializeThirdPartyMonitoring();

      // Initialize infrastructure health monitoring
      await this.initializeInfrastructureMonitoring();

      // Start continuous monitoring
      this.startContinuousMonitoring();

      // Set up alerting
      this.setupAlerting();

      this.isInitialized = true;

      performance.trackMetric('infrastructure_monitoring_initialized', {
        databaseMonitoring: !!this.databaseMetrics,
        apiEndpoints: this.apiMetrics.size,
        cdnProviders: this.cdnMetrics.size,
        thirdPartyServices: this.thirdPartyMetrics.size
      });

    } catch (error) {
      console.error('Failed to initialize infrastructure monitoring:', error);
      performance.trackError(error as Error, {
        context: 'infrastructure_monitoring_initialization'
      });
    }
  }

  // ===== DATABASE MONITORING =====

  private async initializeDatabaseMonitoring(): Promise<void> {
    try {
      // Initialize database metrics structure
      this.databaseMetrics = {
        queryPerformance: {
          slowQueries: [],
          averageExecutionTime: 0,
          queryVolume: 0,
          errorRate: 0,
          connectionPoolUtilization: 0
        },
        indexUsage: [],
        tableMetrics: [],
        performanceTrends: []
      };

      // Set up real-time query monitoring
      this.setupQueryMonitoring();

      // Collect initial database statistics
      await this.collectDatabaseStats();

      // Start periodic database analysis
      this.startDatabaseAnalysis();

    } catch (error) {
      console.error('Failed to initialize database monitoring:', error);
      performance.trackError(error as Error, {
        context: 'database_monitoring_initialization'
      });
    }
  }

  private setupQueryMonitoring(): void {
    // Monitor slow queries
    const queryMonitor = async () => {
      try {
        const slowQueries = await this.getSlowQueries();
        this.processSlowQueries(slowQueries);
      } catch (error) {
        console.error('Error monitoring queries:', error);
      }
    };

    // Run query monitoring every minute
    const interval = setInterval(queryMonitor, 60000);
    this.monitoringIntervals.set('query_monitoring', interval);
  }

  private async getSlowQueries(): Promise<DatabaseQuery[]> {
    // This would connect to the actual database and get slow queries
    // For Supabase/PostgreSQL, this would query pg_stat_statements
    try {
      // Mock implementation - in reality, this would query the database
      const mockSlowQueries: DatabaseQuery[] = [
        {
          id: 'query_1',
          query: 'SELECT * FROM services WHERE category = $1 ORDER BY created_at DESC',
          executionTime: 2500,
          timestamp: Date.now(),
          parameters: ['beauty'],
          affectedRows: 150,
          indexesUsed: ['services_category_idx', 'services_created_at_idx'],
          severity: 'medium',
          optimizationSuggestions: [
            'Consider adding a composite index on (category, created_at)',
            'Add LIMIT clause if only recent records are needed',
            'Consider pagination for large result sets'
          ]
        },
        {
          id: 'query_2',
          query: 'SELECT b.*, s.name FROM bookings b JOIN services s ON b.service_id = s.id WHERE b.status = $1',
          executionTime: 5000,
          timestamp: Date.now(),
          parameters: ['confirmed'],
          affectedRows: 500,
          indexesUsed: ['bookings_status_idx'],
          severity: 'high',
          optimizationSuggestions: [
            'Missing index on services.id (should be primary key)',
            'Consider materialized view for frequent joins',
            'Add index on bookings.service_id'
          ]
        }
      ];

      return mockSlowQueries;
    } catch (error) {
      console.error('Error fetching slow queries:', error);
      return [];
    }
  }

  private processSlowQueries(queries: DatabaseQuery[]): void {
    if (!this.databaseMetrics) return;

    // Update slow queries list
    this.databaseMetrics.queryPerformance.slowQueries = [
      ...this.databaseMetrics.queryPerformance.slowQueries,
      ...queries
    ].slice(-100); // Keep last 100 slow queries

    // Calculate average execution time
    const allQueries = this.databaseMetrics.queryPerformance.slowQueries;
    if (allQueries.length > 0) {
      const totalTime = allQueries.reduce((sum, query) => sum + query.executionTime, 0);
      this.databaseMetrics.queryPerformance.averageExecutionTime = totalTime / allQueries.length;
    }

    // Generate optimization suggestions
    this.generateDatabaseOptimizations(queries);
  }

  private async collectDatabaseStats(): Promise<void> {
    if (!this.databaseMetrics) return;

    try {
      // In a real implementation, this would connect to the database
      // and collect comprehensive statistics

      // Collect table metrics
      this.databaseMetrics.tableMetrics = [
        {
          tableName: 'services',
          rowCount: 1500,
          sizeMB: 45,
          lastAnalyzed: new Date(),
          scanRate: 0.05 // 5% of queries require full table scan
        },
        {
          tableName: 'bookings',
          rowCount: 25000,
          sizeMB: 180,
          lastAnalyzed: new Date(),
          scanRate: 0.02 // 2% require full table scan
        },
        {
          tableName: 'profiles',
          rowCount: 8500,
          sizeMB: 95,
          lastAnalyzed: new Date(),
          scanRate: 0.01
        }
      ];

      // Collect index usage statistics
      this.databaseMetrics.indexUsage = [
        {
          tableName: 'services',
          indexName: 'services_category_idx',
          usageCount: 12500,
          efficiency: 0.95
        },
        {
          tableName: 'bookings',
          indexName: 'bookings_status_idx',
          usageCount: 35000,
          efficiency: 0.88
        },
        {
          tableName: 'bookings',
          indexName: 'bookings_created_at_idx',
          usageCount: 8500,
          efficiency: 0.92
        }
      ];

      // Collect connection pool metrics
      this.databaseMetrics.queryPerformance.connectionPoolUtilization = 0.65; // 65% utilization

      // Calculate query volume
      this.databaseMetrics.queryPerformance.queryVolume = 450; // queries per minute

      // Calculate error rate
      this.databaseMetrics.queryPerformance.errorRate = 0.02; // 2% error rate

    } catch (error) {
      console.error('Error collecting database stats:', error);
    }
  }

  private startDatabaseAnalysis(): void {
    const analyzeDatabase = async () => {
      try {
        await this.collectDatabaseStats();
        this.analyzeDatabaseTrends();
        this.detectDatabaseAnomalies();
      } catch (error) {
        console.error('Error in database analysis:', error);
      }
    };

    // Run database analysis every 5 minutes
    const interval = setInterval(analyzeDatabase, 300000);
    this.monitoringIntervals.set('database_analysis', interval);
  }

  private analyzeDatabaseTrends(): void {
    if (!this.databaseMetrics) return;

    const trend = {
      timestamp: Date.now(),
      avgQueryTime: this.databaseMetrics.queryPerformance.averageExecutionTime,
      connectionCount: this.databaseMetrics.queryPerformance.connectionPoolUtilization * 100,
      cacheHitRate: this.calculateCacheHitRate()
    };

    this.databaseMetrics.performanceTrends.push(trend);

    // Keep only last 24 hours of trends
    const twentyFourHoursAgo = Date.now() - 86400000;
    this.databaseMetrics.performanceTrends = this.databaseMetrics.performanceTrends.filter(
      t => t.timestamp > twentyFourHoursAgo
    );
  }

  private calculateCacheHitRate(): number {
    // Mock calculation - in reality, this would come from database metrics
    return 0.85; // 85% cache hit rate
  }

  private detectDatabaseAnomalies(): void {
    if (!this.databaseMetrics || this.databaseMetrics.performanceTrends.length < 10) return;

    const recentTrends = this.databaseMetrics.performanceTrends.slice(-10);
    const olderTrends = this.databaseMetrics.performanceTrends.slice(-20, -10);

    if (olderTrends.length === 0) return;

    const recentAvg = recentTrends.reduce((sum, t) => sum + t.avgQueryTime, 0) / recentTrends.length;
    const olderAvg = olderTrends.reduce((sum, t) => sum + t.avgQueryTime, 0) / olderTrends.length;

    // Detect significant performance degradation
    if (recentAvg > olderAvg * 1.5) {
      this.generateDatabaseAlert('Performance degradation detected', {
        recentAverage: recentAvg,
        baselineAverage: olderAvg,
        degradationPercentage: ((recentAvg - olderAvg) / olderAvg) * 100
      });
    }
  }

  private generateDatabaseOptimizations(queries: DatabaseQuery[]): void {
    queries.forEach(query => {
      if (query.severity === 'high' || query.severity === 'critical') {
        this.optimizations.push({
          category: 'database',
          priority: query.severity === 'critical' ? 'critical' : 'high',
          title: `Optimize slow query: ${query.id}`,
          description: `Query taking ${query.executionTime}ms needs optimization`,
          estimatedImpact: {
            performanceImprovement: Math.min(80, (query.executionTime / 100) * 10),
            userExperienceImpact: 'Faster booking and search responses'
          },
          implementation: {
            effort: 'medium',
            timeRequired: '2-4 hours',
            risks: ['Query regression', 'Index maintenance overhead'],
            prerequisites: ['Database access', 'Load testing environment']
          },
          metrics: {
            currentValue: query.executionTime,
            targetValue: query.executionTime * 0.3,
            measurementMethod: 'Query execution time'
          }
        });
      }
    });
  }

  // ===== API MONITORING =====

  private async initializeAPIMonitoring(): Promise<void> {
    try {
      // Define key API endpoints to monitor
      const endpoints = [
        '/api/services',
        '/api/bookings',
        '/api/availability',
        '/api/auth/login',
        '/api/auth/register',
        '/api/admin/services',
        '/api/admin/bookings',
        '/api/search'
      ];

      // Initialize metrics for each endpoint
      endpoints.forEach(endpoint => {
        this.apiMetrics.set(endpoint, {
          endpoint,
          method: 'GET',
          responseTime: { avg: 0, p50: 0, p75: 0, p90: 0, p95: 0, p99: 0 },
          throughput: { requestsPerSecond: 0, requestsPerMinute: 0, requestsPerHour: 0 },
          errorMetrics: { errorRate: 0, errorTypes: [], clientErrors: 0, serverErrors: 0 },
          statusCodes: {},
          healthScore: 100
        });
      });

      // Set up API monitoring middleware
      this.setupAPIMonitoring();

      // Start API performance analysis
      this.startAPIAnalysis();

    } catch (error) {
      console.error('Failed to initialize API monitoring:', error);
      performance.trackError(error as Error, {
        context: 'api_monitoring_initialization'
      });
    }
  }

  private setupAPIMonitoring(): void {
    // This would typically be implemented as middleware
    // For this example, we'll simulate API monitoring

    const monitorEndpoint = (endpoint: string, responseTime: number, statusCode: number) => {
      const metrics = this.apiMetrics.get(endpoint);
      if (metrics) {
        this.updateEndpointMetrics(metrics, responseTime, statusCode);
      }
    };

    // Simulate some API calls for demonstration
    setInterval(() => {
      // Simulate varying response times and status codes
      const endpoints = Array.from(this.apiMetrics.keys());
      endpoints.forEach(endpoint => {
        const responseTime = Math.random() * 1000 + 50; // 50-1050ms
        const statusCode = Math.random() > 0.95 ? 500 : 200; // 5% error rate
        monitorEndpoint(endpoint, responseTime, statusCode);
      });
    }, 5000);
  }

  private updateEndpointMetrics(metrics: APIEndpointMetrics, responseTime: number, statusCode: number): void {
    // Update response time metrics
    const responseTimes = metrics.responseTime._values || [];
    responseTimes.push(responseTime);
    metrics.responseTime._values = responseTimes.slice(-1000); // Keep last 1000 values

    // Recalculate percentiles
    responseTimes.sort((a, b) => a - b);
    const len = responseTimes.length;

    metrics.responseTime.avg = responseTimes.reduce((sum, time) => sum + time, 0) / len;
    metrics.responseTime.p50 = responseTimes[Math.floor(len * 0.5)];
    metrics.responseTime.p75 = responseTimes[Math.floor(len * 0.75)];
    metrics.responseTime.p90 = responseTimes[Math.floor(len * 0.9)];
    metrics.responseTime.p95 = responseTimes[Math.floor(len * 0.95)];
    metrics.responseTime.p99 = responseTimes[Math.floor(len * 0.99)];

    // Update status codes
    metrics.statusCodes[statusCode] = (metrics.statusCodes[statusCode] || 0) + 1;

    // Update error metrics
    if (statusCode >= 400) {
      if (statusCode < 500) {
        metrics.errorMetrics.clientErrors++;
      } else {
        metrics.errorMetrics.serverErrors++;
      }
    }

    // Calculate error rate
    const totalRequests = Object.values(metrics.statusCodes).reduce((sum, count) => sum + count, 0);
    const errorRequests = metrics.errorMetrics.clientErrors + metrics.errorMetrics.serverErrors;
    metrics.errorMetrics.errorRate = totalRequests > 0 ? errorRequests / totalRequests : 0;

    // Update throughput (simplified calculation)
    const now = Date.now();
    const timeWindow = 60000; // 1 minute
    const recentRequests = responseTimes.filter(time => now - time < timeWindow).length;
    metrics.throughput.requestsPerMinute = recentRequests;
    metrics.throughput.requestsPerSecond = recentRequests / 60;
    metrics.throughput.requestsPerHour = recentRequests * 60;

    // Calculate health score
    metrics.healthScore = this.calculateEndpointHealthScore(metrics);
  }

  private calculateEndpointHealthScore(metrics: APIEndpointMetrics): number {
    let score = 100;

    // Penalize slow response times
    if (metrics.responseTime.p95 > 2000) score -= 30;
    else if (metrics.responseTime.p95 > 1000) score -= 15;
    else if (metrics.responseTime.p95 > 500) score -= 5;

    // Penalize high error rates
    if (metrics.errorMetrics.errorRate > 0.1) score -= 40;
    else if (metrics.errorMetrics.errorRate > 0.05) score -= 20;
    else if (metrics.errorMetrics.errorRate > 0.01) score -= 5;

    // Penalize server errors more heavily
    if (metrics.errorMetrics.serverErrors > 0) {
      score -= Math.min(50, metrics.errorMetrics.serverErrors * 2);
    }

    return Math.max(0, score);
  }

  private startAPIAnalysis(): void {
    const analyzeAPIs = () => {
      this.apiMetrics.forEach((metrics, endpoint) => {
        this.analyzeEndpointPerformance(endpoint, metrics);
      });
    };

    // Run API analysis every 2 minutes
    const interval = setInterval(analyzeAPIs, 120000);
    this.monitoringIntervals.set('api_analysis', interval);
  }

  private analyzeEndpointPerformance(endpoint: string, metrics: APIEndpointMetrics): void {
    // Detect performance issues
    if (metrics.healthScore < 70) {
      this.generateAPIAlert(endpoint, 'Low health score detected', {
        healthScore: metrics.healthScore,
        responseTimeP95: metrics.responseTime.p95,
        errorRate: metrics.errorMetrics.errorRate
      });
    }

    // Generate optimization suggestions
    if (metrics.responseTime.p95 > 1000) {
      this.optimizations.push({
        category: 'api',
        priority: metrics.responseTime.p95 > 2000 ? 'high' : 'medium',
        title: `Optimize API endpoint: ${endpoint}`,
        description: `Endpoint P95 response time of ${metrics.responseTime.p95}ms needs optimization`,
        estimatedImpact: {
          performanceImprovement: Math.min(60, (metrics.responseTime.p95 / 1000) * 30),
          userExperienceImpact: 'Faster page loads and interactions'
        },
        implementation: {
          effort: 'medium',
          timeRequired: '4-8 hours',
          risks: ['Breaking changes', 'Caching invalidation'],
          prerequisites: ['API documentation', 'Load testing']
        },
        metrics: {
          currentValue: metrics.responseTime.p95,
          targetValue: 500,
          measurementMethod: 'API response time P95'
        }
      });
    }
  }

  // ===== CDN MONITORING =====

  private async initializeCDNMonitoring(): Promise<void> {
    try {
      // Initialize CDN metrics for different providers and regions
      const providers = ['cloudflare', 'vercel', 'supabase'];
      const regions = ['europe-west1', 'europe-central1', 'us-east1'];

      providers.forEach(provider => {
        regions.forEach(region => {
          const key = `${provider}-${region}`;
          this.cdnMetrics.set(key, {
            region,
            provider,
            cacheHitRate: 0,
            averageResponseTime: 0,
            bandwidthUsage: { totalGB: 0, cachedGB: 0, originGB: 0 },
            requestVolume: { total: 0, cached: 0, origin: 0 },
            edgeLocations: [],
            performanceIssues: []
          });
        });
      });

      // Start CDN performance monitoring
      this.startCDNMonitoring();

    } catch (error) {
      console.error('Failed to initialize CDN monitoring:', error);
      performance.trackError(error as Error, {
        context: 'cdn_monitoring_initialization'
      });
    }
  }

  private startCDNMonitoring(): void {
    const monitorCDN = async () => {
      try {
        // Collect CDN metrics from providers
        await this.collectCDNMetrics();

        // Analyze CDN performance
        this.analyzeCDNPerformance();

        // Detect CDN issues
        this.detectCDNIssues();

      } catch (error) {
        console.error('Error monitoring CDN:', error);
      }
    };

    // Run CDN monitoring every 5 minutes
    const interval = setInterval(monitorCDN, 300000);
    this.monitoringIntervals.set('cdn_monitoring', interval);
  }

  private async collectCDNMetrics(): Promise<void> {
    // Mock CDN metrics collection
    this.cdnMetrics.forEach((metrics, key) => {
      // Simulate varying metrics
      metrics.cacheHitRate = 0.75 + Math.random() * 0.2; // 75-95%
      metrics.averageResponseTime = 50 + Math.random() * 200; // 50-250ms

      const totalRequests = Math.floor(Math.random() * 10000) + 1000;
      const cachedRequests = Math.floor(totalRequests * metrics.cacheHitRate);

      metrics.requestVolume = {
        total: totalRequests,
        cached: cachedRequests,
        origin: totalRequests - cachedRequests
      };

      const totalGB = (Math.random() * 50 + 10).toFixed(2);
      const cachedGB = (parseFloat(totalGB) * metrics.cacheHitRate).toFixed(2);

      metrics.bandwidthUsage = {
        totalGB: parseFloat(totalGB),
        cachedGB: parseFloat(cachedGB),
        originGB: parseFloat(totalGB) - parseFloat(cachedGB)
      };

      // Add edge location data
      metrics.edgeLocations = [
        {
          location: 'Warsaw',
          responseTime: metrics.averageResponseTime * 0.8,
          requestCount: Math.floor(totalRequests * 0.3),
          errorRate: 0.001
        },
        {
          location: 'Frankfurt',
          responseTime: metrics.averageResponseTime * 0.9,
          requestCount: Math.floor(totalRequests * 0.25),
          errorRate: 0.002
        },
        {
          location: 'London',
          responseTime: metrics.averageResponseTime * 1.1,
          requestCount: Math.floor(totalRequests * 0.2),
          errorRate: 0.001
        }
      ];
    });
  }

  private analyzeCDNPerformance(): void {
    this.cdnMetrics.forEach((metrics, key) => {
      // Check cache hit rate
      if (metrics.cacheHitRate < 0.8) {
        metrics.performanceIssues.push({
          type: 'cache-miss',
          description: `Low cache hit rate: ${(metrics.cacheHitRate * 100).toFixed(1)}%`,
          severity: metrics.cacheHitRate < 0.6 ? 'high' : 'medium',
          affectedRegions: [metrics.region]
        });
      }

      // Check response times
      if (metrics.averageResponseTime > 500) {
        metrics.performanceIssues.push({
          type: 'slow-response',
          description: `Slow CDN response time: ${metrics.averageResponseTime.toFixed(0)}ms`,
          severity: metrics.averageResponseTime > 1000 ? 'high' : 'medium',
          affectedRegions: [metrics.region]
        });
      }

      // Check edge location performance
      metrics.edgeLocations.forEach(location => {
        if (location.responseTime > 1000) {
          metrics.performanceIssues.push({
            type: 'slow-response',
            description: `Slow response from ${location.location}: ${location.responseTime.toFixed(0)}ms`,
            severity: location.responseTime > 2000 ? 'high' : 'medium',
            affectedRegions: [location.location]
          });
        }

        if (location.errorRate > 0.01) {
          metrics.performanceIssues.push({
            type: 'high-error-rate',
            description: `High error rate from ${location.location}: ${(location.errorRate * 100).toFixed(2)}%`,
            severity: location.errorRate > 0.05 ? 'high' : 'medium',
            affectedRegions: [location.location]
          });
        }
      });
    });
  }

  private detectCDNIssues(): void {
    this.cdnMetrics.forEach((metrics, key) => {
      if (metrics.performanceIssues.length > 0) {
        const criticalIssues = metrics.performanceIssues.filter(issue => issue.severity === 'high');
        if (criticalIssues.length > 0) {
          this.generateCDNAlert(key, criticalIssues);
        }
      }
    });
  }

  // ===== THIRD-PARTY SERVICE MONITORING =====

  private async initializeThirdPartyMonitoring(): Promise<void> {
    try {
      // Define third-party services to monitor
      const services = [
        { name: 'stripe', endpoint: 'https://api.stripe.com/v1' },
        { name: 'supabase', endpoint: 'https://api.supabase.io' },
        { name: 'sendgrid', endpoint: 'https://api.sendgrid.com/v3' },
        { name: 'google-analytics', endpoint: 'https://www.google-analytics.com' }
      ];

      services.forEach(service => {
        this.thirdPartyMetrics.set(service.name, {
          serviceName: service.name,
          endpoint: service.endpoint,
          availability: {
            uptime: 99.9,
            downtime: 0,
            incidents: []
          },
          performance: {
            averageResponseTime: 0,
            p95ResponseTime: 0,
            timeoutRate: 0,
            retryRate: 0
          },
          usage: {
            requestCount: 0,
            dataTransferred: 0,
            cost: 0
          },
          healthScore: 100,
          slaCompliance: {
            target: 99.9,
            actual: 99.9
          }
        });
      });

      // Start third-party monitoring
      this.startThirdPartyMonitoring();

    } catch (error) {
      console.error('Failed to initialize third-party monitoring:', error);
      performance.trackError(error as Error, {
        context: 'third_party_monitoring_initialization'
      });
    }
  }

  private startThirdPartyMonitoring(): void {
    const monitorThirdParty = async () => {
      try {
        // Check health of each third-party service
        for (const [serviceName, metrics] of this.thirdPartyMetrics) {
          await this.checkThirdPartyHealth(serviceName, metrics);
        }
      } catch (error) {
        console.error('Error monitoring third-party services:', error);
      }
    };

    // Run third-party monitoring every 2 minutes
    const interval = setInterval(monitorThirdParty, 120000);
    this.monitoringIntervals.set('third_party_monitoring', interval);
  }

  private async checkThirdPartyHealth(serviceName: string, metrics: ThirdPartyServiceMetrics): Promise<void> {
    try {
      const startTime = performance.now();

      // Make a health check request
      const response = await fetch(`${metrics.endpoint}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      const responseTime = performance.now() - startTime;

      // Update performance metrics
      metrics.performance.averageResponseTime = responseTime;
      metrics.usage.requestCount++;

      // Update availability
      if (response.ok) {
        metrics.availability.uptime = Math.min(100, metrics.availability.uptime + 0.01);
      } else {
        metrics.availability.uptime = Math.max(0, metrics.availability.uptime - 0.1);
        metrics.availability.incidents.push({
          timestamp: Date.now(),
          duration: 0, // Will be updated when service recovers
          type: 'http_error',
          description: `HTTP ${response.status}: ${response.statusText}`
        });
      }

      // Update SLA compliance
      metrics.slaCompliance.actual = metrics.availability.uptime;

      // Calculate health score
      metrics.healthScore = this.calculateThirdPartyHealthScore(metrics);

      // Check for issues
      if (metrics.healthScore < 80) {
        this.generateThirdPartyAlert(serviceName, 'Service health degraded', metrics);
      }

    } catch (error) {
      // Handle service unavailability
      metrics.availability.uptime = Math.max(0, metrics.availability.uptime - 0.5);
      metrics.performance.timeoutRate += 0.1;
      metrics.availability.incidents.push({
        timestamp: Date.now(),
        duration: 0,
        type: 'timeout',
        description: 'Service timeout or unreachable'
      });

      metrics.healthScore = this.calculateThirdPartyHealthScore(metrics);
      this.generateThirdPartyAlert(serviceName, 'Service unavailable', metrics);
    }
  }

  private calculateThirdPartyHealthScore(metrics: ThirdPartyServiceMetrics): number {
    let score = 100;

    // Penalize low uptime
    if (metrics.availability.uptime < 95) score -= 50;
    else if (metrics.availability.uptime < 99) score -= 20;

    // Penalize slow response times
    if (metrics.performance.averageResponseTime > 2000) score -= 30;
    else if (metrics.performance.averageResponseTime > 1000) score -= 15;
    else if (metrics.performance.averageResponseTime > 500) score -= 5;

    // Penalize high timeout rate
    if (metrics.performance.timeoutRate > 0.1) score -= 40;
    else if (metrics.performance.timeoutRate > 0.05) score -= 20;

    // Penalize SLA violations
    if (metrics.slaCompliance.actual < metrics.slaCompliance.target) {
      const violation = metrics.slaCompliance.target - metrics.slaCompliance.actual;
      score -= violation * 10;
    }

    return Math.max(0, score);
  }

  // ===== INFRASTRUCTURE HEALTH MONITORING =====

  private async initializeInfrastructureMonitoring(): Promise<void> {
    try {
      this.infrastructureHealth = {
        systemLoad: {
          cpuUsage: 0,
          memoryUsage: 0,
          diskUsage: 0,
          networkIO: 0
        },
        serviceHealth: [],
        containerMetrics: [],
        networkMetrics: {
          latency: 0,
          packetLoss: 0,
          bandwidth: 0,
          connectionCount: 0
        },
        alerts: []
      };

      // Start infrastructure monitoring
      this.startInfrastructureMonitoring();

    } catch (error) {
      console.error('Failed to initialize infrastructure monitoring:', error);
      performance.trackError(error as Error, {
        context: 'infrastructure_monitoring_initialization'
      });
    }
  }

  private startInfrastructureMonitoring(): void {
    const monitorInfrastructure = async () => {
      try {
        await this.collectSystemMetrics();
        await this.checkServiceHealth();
        this.analyzeInfrastructureHealth();
      } catch (error) {
        console.error('Error monitoring infrastructure:', error);
      }
    };

    // Run infrastructure monitoring every minute
    const interval = setInterval(monitorInfrastructure, 60000);
    this.monitoringIntervals.set('infrastructure_monitoring', interval);
  }

  private async collectSystemMetrics(): Promise<void> {
    if (!this.infrastructureHealth) return;

    // Mock system metrics collection
    // In a real implementation, this would collect actual system metrics
    this.infrastructureHealth.systemLoad = {
      cpuUsage: Math.random() * 80, // 0-80%
      memoryUsage: Math.random() * 70, // 0-70%
      diskUsage: 45 + Math.random() * 30, // 45-75%
      networkIO: Math.random() * 1000 // 0-1000 Mbps
    };

    this.infrastructureHealth.networkMetrics = {
      latency: 10 + Math.random() * 40, // 10-50ms
      packetLoss: Math.random() * 0.01, // 0-1%
      bandwidth: Math.random() * 1000, // 0-1000 Mbps
      connectionCount: Math.floor(Math.random() * 500) + 100 // 100-600 connections
    };
  }

  private async checkServiceHealth(): Promise<void> {
    if (!this.infrastructureHealth) return;

    // Check key services
    const services = [
      'api-server',
      'database',
      'redis-cache',
      'cdn-edge',
      'load-balancer'
    ];

    this.infrastructureHealth.serviceHealth = services.map(service => ({
      serviceName: service,
      status: Math.random() > 0.95 ? 'unhealthy' :
               Math.random() > 0.9 ? 'degraded' : 'healthy',
      lastCheck: Date.now(),
      responseTime: Math.random() * 100 + 10, // 10-110ms
      uptime: 95 + Math.random() * 5 // 95-100%
    }));
  }

  private analyzeInfrastructureHealth(): void {
    if (!this.infrastructureHealth) return;

    // Check for system load issues
    if (this.infrastructureHealth.systemLoad.cpuUsage > 80) {
      this.createInfrastructureAlert('High CPU usage detected', {
        usage: this.infrastructureHealth.systemLoad.cpuUsage,
        threshold: 80
      });
    }

    if (this.infrastructureHealth.systemLoad.memoryUsage > 85) {
      this.createInfrastructureAlert('High memory usage detected', {
        usage: this.infrastructureHealth.systemLoad.memoryUsage,
        threshold: 85
      });
    }

    // Check for unhealthy services
    const unhealthyServices = this.infrastructureHealth.serviceHealth.filter(
      service => service.status !== 'healthy'
    );

    if (unhealthyServices.length > 0) {
      this.createInfrastructureAlert('Service health issues detected', {
        unhealthyServices: unhealthyServices.map(s => s.serviceName)
      });
    }

    // Check network issues
    if (this.infrastructureHealth.networkMetrics.latency > 100) {
      this.createInfrastructureAlert('High network latency detected', {
        latency: this.infrastructureHealth.networkMetrics.latency,
        threshold: 100
      });
    }
  }

  // ===== ALERTING =====

  private setupAlerting(): void {
    // Set up alert processing and routing
    const processAlerts = () => {
      this.processPendingAlerts();
      this.updateAlertStatuses();
    };

    // Process alerts every 30 seconds
    const interval = setInterval(processAlerts, 30000);
    this.monitoringIntervals.set('alert_processing', interval);
  }

  private generateDatabaseAlert(message: string, details: any): void {
    const alert = {
      id: `db_alert_${Date.now()}`,
      type: 'database',
      severity: 'warning',
      message,
      timestamp: Date.now(),
      details
    };

    if (this.infrastructureHealth) {
      this.infrastructureHealth.alerts.push(alert);
    }

    performance.trackError(new Error(message), {
      context: 'database_alert',
      details
    });
  }

  private generateAPIAlert(endpoint: string, message: string, details: any): void {
    const alert = {
      id: `api_alert_${Date.now()}`,
      type: 'api',
      severity: 'warning',
      message: `${endpoint}: ${message}`,
      timestamp: Date.now(),
      details
    };

    if (this.infrastructureHealth) {
      this.infrastructureHealth.alerts.push(alert);
    }

    performance.trackError(new Error(message), {
      context: 'api_alert',
      endpoint,
      details
    });
  }

  private generateCDNAlert(provider: string, issues: any[]): void {
    const alert = {
      id: `cdn_alert_${Date.now()}`,
      type: 'cdn',
      severity: 'warning',
      message: `CDN issues detected for ${provider}`,
      timestamp: Date.now(),
      details: { issues }
    };

    if (this.infrastructureHealth) {
      this.infrastructureHealth.alerts.push(alert);
    }

    performance.trackError(new Error(`CDN issues: ${provider}`), {
      context: 'cdn_alert',
      provider,
      issues
    });
  }

  private generateThirdPartyAlert(service: string, message: string, metrics: ThirdPartyServiceMetrics): void {
    const alert = {
      id: `third_party_alert_${Date.now()}`,
      type: 'third-party',
      severity: metrics.healthScore < 50 ? 'critical' : 'warning',
      message: `${service}: ${message}`,
      timestamp: Date.now(),
      details: { healthScore: metrics.healthScore }
    };

    if (this.infrastructureHealth) {
      this.infrastructureHealth.alerts.push(alert);
    }

    performance.trackError(new Error(`${service}: ${message}`), {
      context: 'third_party_alert',
      service,
      healthScore: metrics.healthScore
    });
  }

  private createInfrastructureAlert(message: string, details: any): void {
    const alert = {
      id: `infra_alert_${Date.now()}`,
      type: 'infrastructure',
      severity: 'warning',
      message,
      timestamp: Date.now(),
      details
    };

    if (this.infrastructureHealth) {
      this.infrastructureHealth.alerts.push(alert);
    }

    performance.trackError(new Error(message), {
      context: 'infrastructure_alert',
      details
    });
  }

  private processPendingAlerts(): void {
    if (!this.infrastructureHealth) return;

    // Process unresolved alerts
    this.infrastructureHealth.alerts.forEach(alert => {
      if (!alert.resolved) {
        // Check if alert should be escalated
        const age = Date.now() - alert.timestamp;
        if (age > 300000) { // 5 minutes
          // Escalate alert severity
          if (alert.severity === 'warning') {
            alert.severity = 'critical';
          }
        }
      }
    });

    // Clean up old resolved alerts
    const twentyFourHoursAgo = Date.now() - 86400000;
    this.infrastructureHealth.alerts = this.infrastructureHealth.alerts.filter(
      alert => !alert.resolved || alert.resolvedAt && alert.resolvedAt > twentyFourHoursAgo
    );
  }

  private updateAlertStatuses(): void {
    if (!this.infrastructureHealth) return;

    // Auto-resolve alerts for recovered services
    this.infrastructureHealth.alerts.forEach(alert => {
      if (!alert.resolved) {
        let shouldResolve = false;

        switch (alert.type) {
          case 'database':
            shouldResolve = this.isDatabaseHealthy();
            break;
          case 'api':
            shouldResolve = this.isAPIHealthy();
            break;
          case 'cdn':
            shouldResolve = this.isCDNHealthy();
            break;
          case 'third-party':
            shouldResolve = this.isThirdPartyHealthy(alert.details?.service);
            break;
          case 'infrastructure':
            shouldResolve = this.isInfrastructureHealthy();
            break;
        }

        if (shouldResolve) {
          alert.resolved = true;
          alert.resolvedAt = Date.now();
        }
      }
    });
  }

  // ===== HEALTH CHECK METHODS =====

  private isDatabaseHealthy(): boolean {
    if (!this.databaseMetrics) return false;

    return (
      this.databaseMetrics.queryPerformance.errorRate < 0.05 &&
      this.databaseMetrics.queryPerformance.averageExecutionTime < 1000 &&
      this.databaseMetrics.queryPerformance.connectionPoolUtilization < 0.9
    );
  }

  private isAPIHealthy(): boolean {
    let healthyEndpoints = 0;
    let totalEndpoints = 0;

    this.apiMetrics.forEach(metrics => {
      totalEndpoints++;
      if (metrics.healthScore > 80) {
        healthyEndpoints++;
      }
    });

    return totalEndpoints === 0 || (healthyEndpoints / totalEndpoints) > 0.9;
  }

  private isCDNHealthy(): boolean {
    let healthyProviders = 0;
    let totalProviders = 0;

    this.cdnMetrics.forEach(metrics => {
      totalProviders++;
      if (metrics.performanceIssues.length === 0 ||
          metrics.performanceIssues.every(issue => issue.severity !== 'high')) {
        healthyProviders++;
      }
    });

    return totalProviders === 0 || (healthyProviders / totalProviders) > 0.8;
  }

  private isThirdPartyHealthy(serviceName?: string): boolean {
    if (serviceName) {
      const metrics = this.thirdPartyMetrics.get(serviceName);
      return metrics ? metrics.healthScore > 70 : false;
    }

    // Check all third-party services
    let healthyServices = 0;
    let totalServices = 0;

    this.thirdPartyMetrics.forEach(metrics => {
      totalServices++;
      if (metrics.healthScore > 70) {
        healthyServices++;
      }
    });

    return totalServices === 0 || (healthyServices / totalServices) > 0.8;
  }

  private isInfrastructureHealthy(): boolean {
    if (!this.infrastructureHealth) return false;

    const { systemLoad, networkMetrics } = this.infrastructureHealth;

    return (
      systemLoad.cpuUsage < 80 &&
      systemLoad.memoryUsage < 85 &&
      networkMetrics.latency < 100 &&
      networkMetrics.packetLoss < 0.01
    );
  }

  // ===== CONTINUOUS MONITORING =====

  private startContinuousMonitoring(): void {
    // Start all monitoring intervals
    // These are already set up in the initialization methods
  }

  // ===== PUBLIC API =====

  public getDatabaseMetrics(): DatabaseMetrics | null {
    return this.databaseMetrics;
  }

  public getAPIMetrics(endpoint?: string): APIEndpointMetrics | Map<string, APIEndpointMetrics> {
    if (endpoint) {
      return this.apiMetrics.get(endpoint) || null;
    }
    return this.apiMetrics;
  }

  public getCDNMetrics(provider?: string): CDNPerformanceMetrics | Map<string, CDNPerformanceMetrics> {
    if (provider) {
      for (const [key, metrics] of this.cdnMetrics) {
        if (key.startsWith(provider)) {
          return metrics;
        }
      }
      return null;
    }
    return this.cdnMetrics;
  }

  public getThirdPartyMetrics(serviceName?: string): ThirdPartyServiceMetrics | Map<string, ThirdPartyServiceMetrics> {
    if (serviceName) {
      return this.thirdPartyMetrics.get(serviceName) || null;
    }
    return this.thirdPartyMetrics;
  }

  public getInfrastructureHealth(): InfrastructureHealthMetrics | null {
    return this.infrastructureHealth;
  }

  public getOptimizations(): PerformanceOptimization[] {
    return this.optimizations;
  }

  public async forceHealthCheck(serviceType?: string): Promise<void> {
    switch (serviceType) {
      case 'database':
        await this.collectDatabaseStats();
        break;
      case 'api':
        this.apiMetrics.forEach((metrics, endpoint) => {
          this.analyzeEndpointPerformance(endpoint, metrics);
        });
        break;
      case 'cdn':
        await this.collectCDNMetrics();
        this.analyzeCDNPerformance();
        break;
      case 'third-party':
        for (const [serviceName, metrics] of this.thirdPartyMetrics) {
          await this.checkThirdPartyHealth(serviceName, metrics);
        }
        break;
      case 'infrastructure':
      default:
        await this.collectSystemMetrics();
        await this.checkServiceHealth();
        break;
    }
  }

  public cleanup(): void {
    // Clear all monitoring intervals
    this.monitoringIntervals.forEach(interval => {
      clearInterval(interval);
    });
    this.monitoringIntervals.clear();
  }
}

// Initialize and export the monitoring system
export const infrastructureMonitoring = InfrastructurePerformanceMonitoring.getInstance();

export type {
  DatabaseMetrics,
  DatabaseQuery,
  APIEndpointMetrics,
  CDNPerformanceMetrics,
  ThirdPartyServiceMetrics,
  InfrastructureHealthMetrics,
  PerformanceOptimization
};

// Initialize the monitoring system
if (typeof window !== 'undefined') {
  infrastructureMonitoring.initialize().catch(console.error);
}